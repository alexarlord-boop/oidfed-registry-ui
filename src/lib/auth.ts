/**
 * Simple Authentication Interface
 * Clean, minimal authentication system with generic interface and dev implementation
 */

// Core types
export interface AuthUser {
  id: string;
  username: string;
  email?: string;
  roles: string[];
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
 * Development Authentication Implementation
 * Simple auth for development - accepts any credentials
 */
export class DevAuth implements AuthProvider {
  private state: AuthState = {
    user: null,
    isLoading: false,
    error: null
  };

  async initialize(): Promise<void> {
    // Try to restore auth from localStorage
    try {
      const storedUser = localStorage.getItem('dev_auth_user');
      const storedToken = localStorage.getItem('dev_auth_token');
      
      if (storedUser && storedToken) {
        this.state.user = JSON.parse(storedUser);
      }
    } catch (error) {
      console.warn('Failed to restore dev auth:', error);
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

    // In dev mode, any credentials work
    const user: AuthUser = {
      id: username,
      username: username,
      email: `${username}@dev.local`,
      roles: ['admin']
    };

    // Generate simple token
    const token = `dev_${username}_${Date.now()}`;

    // Update state
    this.state = {
      user,
      isLoading: false,
      error: null
    };

    // Store for persistence
    try {
      localStorage.setItem('dev_auth_user', JSON.stringify(user));
      localStorage.setItem('dev_auth_token', token);
      
      // Legacy compatibility
      localStorage.setItem('API_BEARER', token);
      localStorage.setItem('API_ACCOUNT_USERNAME', username);
    } catch (error) {
      console.warn('Failed to store dev auth:', error);
    }

    return { success: true };
  }

  async logout(): Promise<void> {
    this.state = {
      user: null,
      isLoading: false,
      error: null
    };

    // Clear storage
    try {
      localStorage.removeItem('dev_auth_user');
      localStorage.removeItem('dev_auth_token');
      
      // Legacy compatibility
      localStorage.removeItem('API_BEARER');
      localStorage.removeItem('API_ACCOUNT_USERNAME');
    } catch (error) {
      console.warn('Failed to clear dev auth:', error);
    }
  }

  async getAuthHeader(): Promise<string | null> {
    try {
      const token = localStorage.getItem('dev_auth_token');
      return token ? `Bearer ${token}` : null;
    } catch (error) {
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
    // For now, always use dev auth
    // In the future, this could be configurable based on environment
    authInstance = new DevAuth();
  }
  return authInstance;
}

export function setAuth(provider: AuthProvider): void {
  authInstance = provider;
}