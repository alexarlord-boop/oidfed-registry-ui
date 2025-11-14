import type { 
  AuthAdapter, 
  AuthState, 
  AuthToken, 
  AuthUser, 
  LoginCredentials, 
  LoginResult, 
  LogoutResult,
  BasicAuthConfig 
} from '../types';

/**
 * Basic Authentication Adapter
 * Handles traditional username/password authentication with API endpoints
 */
export class BasicAuthAdapter implements AuthAdapter {
  public readonly id = 'basic';
  public readonly name = 'Basic Authentication';
  public readonly config: BasicAuthConfig;

  private currentState: AuthState;
  private storage: Storage | null = null;

  constructor(config: BasicAuthConfig) {
    this.config = config;
    this.currentState = {
      user: null,
      token: null,
      isLoading: false,
      error: null
    };

    // Initialize storage if available
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        this.storage = window.localStorage;
      }
    } catch (e) {
      console.warn('BasicAuth: localStorage not available');
    }
  }

  async initialize(): Promise<void> {
    try {
      this.currentState.isLoading = true;
      
      // Try to restore auth state from storage
      const storedToken = this.getStoredToken();
      const storedUser = this.getStoredUser();
      
      if (storedToken && storedUser) {
        // Validate the stored token
        const isValid = await this.validateToken(storedToken);
        if (isValid) {
          this.currentState = {
            user: storedUser,
            token: storedToken,
            isLoading: false,
            error: null
          };
        } else {
          // Clear invalid stored data
          this.clearStoredAuth();
        }
      }
    } catch (error) {
      console.error('BasicAuth: Error initializing adapter', error);
      this.currentState.error = 'Failed to initialize authentication';
    } finally {
      this.currentState.isLoading = false;
    }
  }

  async login(credentials: LoginCredentials): Promise<LoginResult> {
    try {
      this.currentState.isLoading = true;
      this.currentState.error = null;

      const response = await fetch(this.config.settings.loginEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password,
          ...credentials.additionalFields
        })
      });

      if (!response.ok) {
        let errorMessage = 'Authentication failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          // Use default error message if parsing fails
        }
        
        this.currentState.error = errorMessage;
        return { success: false, error: errorMessage };
      }

      const authData = await response.json();
      
      // Extract token and user data from response
      const token: AuthToken = {
        value: authData.token || authData.access_token,
        type: 'Bearer',
        expiresAt: authData.expires_at ? parseInt(authData.expires_at) : undefined,
        metadata: authData.token_metadata
      };

      const user: AuthUser = {
        id: authData.user?.id || credentials.username,
        username: authData.user?.username || credentials.username,
        email: authData.user?.email,
        metadata: authData.user?.metadata,
        roles: authData.user?.roles || ['admin'] // Default to admin role
      };

      // Store auth state
      this.currentState = {
        user,
        token,
        isLoading: false,
        error: null
      };

      // Persist to storage if enabled
      this.storeAuth(user, token);

      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      this.currentState.error = errorMessage;
      return { success: false, error: errorMessage };
    } finally {
      this.currentState.isLoading = false;
    }
  }

  async logout(): Promise<LogoutResult> {
    try {
      // Call logout endpoint if configured
      if (this.config.settings.logoutEndpoint && this.currentState.token) {
        try {
          await fetch(this.config.settings.logoutEndpoint, {
            method: 'POST',
            headers: {
              'Authorization': `${this.currentState.token.type} ${this.currentState.token.value}`,
              'Content-Type': 'application/json'
            }
          });
        } catch (error) {
          console.warn('BasicAuth: Logout endpoint call failed', error);
          // Continue with local logout even if server logout fails
        }
      }

      // Clear local state
      this.currentState = {
        user: null,
        token: null,
        isLoading: false,
        error: null
      };

      // Clear storage
      this.clearStoredAuth();

      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      return { success: false, error: errorMessage };
    }
  }

  async getAuthState(): Promise<AuthState> {
    return { ...this.currentState };
  }

  async validateToken(token: AuthToken): Promise<boolean> {
    try {
      // Check expiration if available
      if (token.expiresAt && Date.now() / 1000 > token.expiresAt) {
        return false;
      }

      // Call validation endpoint if configured
      if (this.config.settings.validateEndpoint) {
        const response = await fetch(this.config.settings.validateEndpoint, {
          method: 'GET',
          headers: {
            'Authorization': `${token.type} ${token.value}`
          }
        });
        return response.ok;
      }

      // If no validation endpoint, assume token is valid if not expired
      return true;

    } catch (error) {
      console.warn('BasicAuth: Token validation failed', error);
      return false;
    }
  }

  supportsRefresh(): boolean {
    return false; // Basic auth typically doesn't support token refresh
  }

  async getAuthHeader(): Promise<string | null> {
    if (!this.currentState.token) return null;
    return `${this.currentState.token.type} ${this.currentState.token.value}`;
  }

  async destroy(): Promise<void> {
    // Clear any stored state but don't clear localStorage
    this.currentState = {
      user: null,
      token: null,
      isLoading: false,
      error: null
    };
  }

  // Private helper methods
  private getStoredToken(): AuthToken | null {
    if (!this.storage) return null;
    
    try {
      const tokenData = this.storage.getItem('basic_auth_token');
      return tokenData ? JSON.parse(tokenData) : null;
    } catch (e) {
      console.warn('BasicAuth: Failed to parse stored token');
      return null;
    }
  }

  private getStoredUser(): AuthUser | null {
    if (!this.storage) return null;
    
    try {
      const userData = this.storage.getItem('basic_auth_user');
      return userData ? JSON.parse(userData) : null;
    } catch (e) {
      console.warn('BasicAuth: Failed to parse stored user');
      return null;
    }
  }

  private storeAuth(user: AuthUser, token: AuthToken): void {
    if (!this.storage || !this.config.settings.allowCredentialStorage) return;

    try {
      this.storage.setItem('basic_auth_token', JSON.stringify(token));
      this.storage.setItem('basic_auth_user', JSON.stringify(user));
    } catch (e) {
      console.warn('BasicAuth: Failed to store auth data');
    }
  }

  private clearStoredAuth(): void {
    if (!this.storage) return;
    
    try {
      this.storage.removeItem('basic_auth_token');
      this.storage.removeItem('basic_auth_user');
    } catch (e) {
      console.warn('BasicAuth: Failed to clear stored auth data');
    }
  }
}