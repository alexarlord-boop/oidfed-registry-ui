/**
 * Simple Authentication Interface
 * Clean, minimal authentication system with generic interface and dev implementation
 */

import { UserRole } from '@/types/auth';

// Core types
export interface AuthUser {
  id: string;
  username: string;
  email?: string;
  role: UserRole | string;
  roles: string[];  // Legacy field for backward compatibility
}

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResult {
  success: boolean;
  error?: string;
}

/**
 * Generic authentication interface that different implementations can use
 * Keeps the door open for future auth methods while staying simple
 */
export interface AuthProvider {
  /** Get current authentication state */
  getState(): Promise<AuthState>;
  
  /** Attempt to log in with credentials */
  login(credentials: LoginCredentials): Promise<LoginResult>;
  
  /** Log out current user */
  logout(): Promise<void>;
  
  /** Get authorization header for API requests */
  getAuthHeader(): Promise<string | null>;
  
  /** Initialize the auth provider */
  initialize(): Promise<void>;
}

/**
 * Password-Based Authentication Implementation
 * Authenticates users via username/password against the Auth Gateway API
 * Includes JWT validation, token refresh, and session management
 */
export class PasswordAuth implements AuthProvider {
  private state: AuthState = {
    user: null,
    isLoading: false,
    error: null
  };

  private authGatewayUrl: string;

  constructor() {
    // Get auth gateway URL from environment
    // Import dynamically to avoid circular dependencies
    this.authGatewayUrl = 'http://localhost:9000'; // Will be updated in initialize()
  }

  async initialize(): Promise<void> {
    console.log('[PasswordAuth] Initialize called');
    
    // Load environment config
    try {
      const { env } = await import('./env');
      this.authGatewayUrl = env.AUTH_SERVICE_URL;
      console.log('[PasswordAuth] Auth service URL:', this.authGatewayUrl);
    } catch (e) {
      console.warn('Failed to load env config, using default:', e);
      this.authGatewayUrl = 'http://localhost:9000';
    }

    // Try to restore auth from sessionStorage
    try {
      const storedUser = sessionStorage.getItem('auth_user');
      const storedToken = sessionStorage.getItem('auth_access_token');
      
      console.log('[PasswordAuth] Checking stored auth:', {
        hasUser: !!storedUser,
        hasToken: !!storedToken
      });
      
      if (storedUser && storedToken) {
        // Verify token is still valid
        const payload = this.parseJWT(storedToken);
        if (payload && payload.exp && payload.exp * 1000 > Date.now()) {
          this.state.user = JSON.parse(storedUser);
          console.log('[PasswordAuth] Restored user from sessionStorage:', this.state.user?.username);
        } else {
          console.log('[PasswordAuth] Token expired, attempting refresh');
          // Token expired, try to refresh
          const refreshToken = sessionStorage.getItem('auth_refresh_token');
          if (refreshToken) {
            await this.refreshToken(refreshToken);
          }
        }
      } else {
        console.log('[PasswordAuth] No stored auth found');
      }
    } catch (error) {
      console.warn('Failed to restore auth:', error);
    }
  }

  private parseJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }

  async getState(): Promise<AuthState> {
    return { ...this.state };
  }

  async login(credentials: LoginCredentials): Promise<LoginResult> {
    const { username, password } = credentials;

    // Basic validation
    if (!username || !password) {
      const error = 'Username and password are required';
      this.state.error = error;
      return { success: false, error };
    }

    try {
      // Call Auth Gateway token endpoint
      const response = await fetch(`${this.authGatewayUrl}/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'password',
          username: username,
          password: password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Login failed' }));
        // Handle nested error format: { detail: { error, error_description } }
        let error = 'Invalid credentials';
        if (typeof errorData.detail === 'object' && errorData.detail !== null) {
          error = errorData.detail.error_description || errorData.detail.error || error;
        } else if (typeof errorData.detail === 'string') {
          error = errorData.detail;
        } else if (errorData.error_description) {
          error = errorData.error_description;
        } else if (errorData.error) {
          error = errorData.error;
        }
        this.state.error = error;
        return { success: false, error };
      }

      const tokenData = await response.json();
      const { access_token, refresh_token, id_token } = tokenData;

      // Parse JWT to get user info
      const payload = this.parseJWT(access_token);
      if (!payload) {
        const error = 'Invalid token received';
        this.state.error = error;
        return { success: false, error };
      }

      // Create user object from JWT claims
      const user: AuthUser = {
        id: payload.sub,
        username: payload.preferred_username || username,
        email: payload.email,
        role: payload.role || UserRole.PENDING,
        roles: payload.roles || []
      };

      // Update state
      this.state = {
        user,
        isLoading: false,
        error: null
      };

      // Store tokens in sessionStorage (more secure than localStorage)
      try {
        sessionStorage.setItem('auth_user', JSON.stringify(user));
        sessionStorage.setItem('auth_access_token', access_token);
        if (refresh_token) {
          sessionStorage.setItem('auth_refresh_token', refresh_token);
        }
        if (id_token) {
          sessionStorage.setItem('auth_id_token', id_token);
        }

        console.log('[PasswordAuth] Login successful, tokens stored:', {
          user: user.username,
          tokenLength: access_token.length,
          hasRefreshToken: !!refresh_token
        });
      } catch (error) {
        console.warn('Failed to store auth tokens:', error);
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      this.state.error = errorMessage;
      return { success: false, error: errorMessage };
    }
  }

  private async refreshToken(refreshToken: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.authGatewayUrl}/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      });

      if (!response.ok) {
        return false;
      }

      const tokenData = await response.json();
      const { access_token, refresh_token: new_refresh_token } = tokenData;

      // Parse new token
      const payload = this.parseJWT(access_token);
      if (!payload) {
        return false;
      }

      // Update user
      const user: AuthUser = {
        id: payload.sub,
        username: payload.preferred_username,
        email: payload.email,
        role: payload.role || UserRole.PENDING,
        roles: payload.roles || []
      };

      this.state.user = user;

      // Update stored tokens
      sessionStorage.setItem('auth_user', JSON.stringify(user));
      sessionStorage.setItem('auth_access_token', access_token);
      if (new_refresh_token) {
        sessionStorage.setItem('auth_refresh_token', new_refresh_token);
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  async logout(): Promise<void> {
    this.state = {
      user: null,
      isLoading: false,
      error: null
    };

    // Clear storage
    try {
      sessionStorage.removeItem('auth_user');
      sessionStorage.removeItem('auth_access_token');
      sessionStorage.removeItem('auth_refresh_token');
      sessionStorage.removeItem('auth_id_token');
    } catch (error) {
      console.warn('Failed to clear auth:', error);
    }
  }

  async getAuthHeader(): Promise<string | null> {
    try {
      const token = sessionStorage.getItem('auth_access_token');
      if (!token) {
        console.warn('[PasswordAuth] No access token found in sessionStorage');
        return null;
      }

      // Check if token is expired
      const payload = this.parseJWT(token);
      if (payload && payload.exp) {
        const expiresAt = payload.exp * 1000;
        const now = Date.now();
        
        console.log('[PasswordAuth] Token check:', {
          expiresAt: new Date(expiresAt).toISOString(),
          now: new Date(now).toISOString(),
          timeUntilExpiry: Math.floor((expiresAt - now) / 1000) + 's'
        });
        
        // If token expires in less than 60 seconds, try to refresh
        if (expiresAt - now < 60000) {
          console.log('[PasswordAuth] Token expiring soon, attempting refresh');
          const refreshToken = sessionStorage.getItem('auth_refresh_token');
          if (refreshToken) {
            const refreshed = await this.refreshToken(refreshToken);
            if (refreshed) {
              const newToken = sessionStorage.getItem('auth_access_token');
              console.log('[PasswordAuth] Token refreshed successfully');
              return newToken ? `Bearer ${newToken}` : null;
            }
          }
          // Token expired and couldn't refresh
          console.warn('[PasswordAuth] Token expired and could not refresh');
          return null;
        }
      }

      console.log('[PasswordAuth] Returning valid Bearer token');
      return `Bearer ${token}`;
    } catch (error) {
      console.error('[PasswordAuth] Error getting auth header:', error);
      return null;
    }
  }
}

/**
 * Global auth instance
 * Simple singleton for easy access throughout the app
 */
let authInstance: AuthProvider;

export function getAuth(): AuthProvider {
  if (!authInstance) {
    // For now, always use password-based auth
    // In the future, this could be configurable based on environment
    authInstance = new PasswordAuth();
  }
  return authInstance;
}

export function setAuth(provider: AuthProvider): void {
  authInstance = provider;
}