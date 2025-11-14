import type { 
  AuthAdapter, 
  AuthState, 
  AuthToken, 
  AuthUser, 
  LoginCredentials, 
  LoginResult, 
  LogoutResult,
  DevAuthConfig 
} from '../types';

/**
 * Development Authentication Adapter
 * Provides a simple authentication mechanism for development and testing
 * This adapter should NEVER be used in production
 */
export class DevAuthAdapter implements AuthAdapter {
  public readonly id = 'dev';
  public readonly name = 'Development Authentication';
  public readonly config: DevAuthConfig;

  private currentState: AuthState;
  private storage: Storage | null = null;

  constructor(config: DevAuthConfig) {
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
      console.warn('DevAuth: localStorage not available');
    }
  }

  async initialize(): Promise<void> {
    try {
      this.currentState.isLoading = true;
      
      // Try to restore auth state from storage
      const storedToken = this.getStoredToken();
      const storedUser = this.getStoredUser();
      
      if (storedToken && storedUser) {
        // For dev auth, we'll assume stored tokens are always valid
        this.currentState = {
          user: storedUser,
          token: storedToken,
          isLoading: false,
          error: null
        };
      }
    } catch (error) {
      console.error('DevAuth: Error initializing adapter', error);
      this.currentState.error = 'Failed to initialize development authentication';
    } finally {
      this.currentState.isLoading = false;
    }
  }

  async login(credentials: LoginCredentials): Promise<LoginResult> {
    try {
      this.currentState.isLoading = true;
      this.currentState.error = null;

      const { username, password } = credentials;

      // Validate credentials if not allowing any credentials
      if (!this.config.settings.allowAnyCredentials) {
        if (username !== this.config.settings.defaultUsername || 
            password !== this.config.settings.defaultPassword) {
          const errorMessage = 'Invalid development credentials';
          this.currentState.error = errorMessage;
          return { success: false, error: errorMessage };
        }
      }

      // Basic validation
      if (!username || !password) {
        const errorMessage = 'Username and password are required';
        this.currentState.error = errorMessage;
        return { success: false, error: errorMessage };
      }

      // Create a token
      const token: AuthToken = this.config.settings.generateDummyTokens
        ? this.createDummyJWT(username)
        : this.createSimpleToken(username);

      // Create user object
      const user: AuthUser = {
        id: username,
        username: username,
        email: `${username}@dev.local`,
        metadata: {
          authType: 'dev',
          loginTime: new Date().toISOString()
        },
        roles: ['admin'] // Dev users are always admins
      };

      // Update state
      this.currentState = {
        user,
        token,
        isLoading: false,
        error: null
      };

      // Store for persistence
      this.storeAuth(user, token);

      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Development login failed';
      this.currentState.error = errorMessage;
      return { success: false, error: errorMessage };
    } finally {
      this.currentState.isLoading = false;
    }
  }

  async logout(): Promise<LogoutResult> {
    try {
      // Clear state
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
      const errorMessage = error instanceof Error ? error.message : 'Development logout failed';
      return { success: false, error: errorMessage };
    }
  }

  async getAuthState(): Promise<AuthState> {
    return { ...this.currentState };
  }

  async validateToken(token: AuthToken): Promise<boolean> {
    try {
      // For dev auth, check basic token structure and expiration
      if (!token.value) return false;
      
      if (token.expiresAt && Date.now() / 1000 > token.expiresAt) {
        return false;
      }

      // If it's a dummy JWT, do basic validation
      if (token.metadata?.isDummyJWT) {
        return this.validateDummyJWT(token.value);
      }

      // Simple tokens are always valid if not expired
      return true;

    } catch (error) {
      console.warn('DevAuth: Token validation failed', error);
      return false;
    }
  }

  supportsRefresh(): boolean {
    return false; // Dev auth doesn't need token refresh
  }

  async getAuthHeader(): Promise<string | null> {
    if (!this.currentState.token) return null;
    return `${this.currentState.token.type} ${this.currentState.token.value}`;
  }

  async destroy(): Promise<void> {
    this.currentState = {
      user: null,
      token: null,
      isLoading: false,
      error: null
    };
  }

  // Public helper methods for backwards compatibility
  public generateDummyJWT(username: string): string {
    return this.createDummyJWT(username).value;
  }

  public setDevAuth(token: string | null, username: string | null): void {
    try {
      if (this.storage) {
        if (token) {
          this.storage.setItem('API_BEARER', token);
        } else {
          this.storage.removeItem('API_BEARER');
        }
        
        if (username) {
          this.storage.setItem('API_ACCOUNT_USERNAME', username);
        } else {
          this.storage.removeItem('API_ACCOUNT_USERNAME');
        }
        
        // Trigger update notification
        this.storage.setItem('API_DEV_LAST_UPDATE', String(Date.now()));
      }
    } catch (e) {
      console.warn('DevAuth: Failed to set dev auth');
    }
  }

  public getDevAuth(): { token: string | null; account: string | null } {
    try {
      if (this.storage) {
        return {
          token: this.storage.getItem('API_BEARER'),
          account: this.storage.getItem('API_ACCOUNT_USERNAME'),
        };
      }
    } catch (e) {
      // ignore
    }
    return { token: null, account: null };
  }

  // Private helper methods
  private createDummyJWT(username: string): AuthToken {
    const header = { alg: 'none', typ: 'JWT' };
    const payload = { 
      sub: username, 
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
      iss: 'dev-auth-adapter',
      aud: 'oidfed-registry-ui'
    };

    const encode = (obj: unknown) => {
      const str = JSON.stringify(obj);
      if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
        return window.btoa(unescape(encodeURIComponent(str)))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
      }
      
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const buf = require('buffer').Buffer.from(str);
        return buf.toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
      } catch (e) {
        return '';
      }
    };

    const jwt = `${encode(header)}.${encode(payload)}.`;

    return {
      value: jwt,
      type: 'Bearer',
      expiresAt: payload.exp,
      metadata: {
        isDummyJWT: true,
        header,
        payload
      }
    };
  }

  private createSimpleToken(username: string): AuthToken {
    const tokenValue = `dev_token_${username}_${Date.now()}`;
    
    return {
      value: tokenValue,
      type: 'Bearer',
      expiresAt: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
      metadata: {
        isDummyJWT: false,
        username
      }
    };
  }

  private validateDummyJWT(jwt: string): boolean {
    try {
      const parts = jwt.split('.');
      if (parts.length !== 3) return false;

      // Parse payload to check expiration
      if (parts[1]) {
        const payload = JSON.parse(atob(parts[1]));
        if (payload.exp && Date.now() / 1000 > payload.exp) {
          return false;
        }
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  private getStoredToken(): AuthToken | null {
    if (!this.storage) return null;
    
    try {
      const tokenData = this.storage.getItem('dev_auth_token');
      if (tokenData) {
        return JSON.parse(tokenData);
      }

      // Backwards compatibility: check for old API_BEARER token
      const oldToken = this.storage.getItem('API_BEARER');
      if (oldToken) {
        return {
          value: oldToken,
          type: 'Bearer',
          metadata: { legacy: true }
        };
      }

      return null;
    } catch (e) {
      console.warn('DevAuth: Failed to parse stored token');
      return null;
    }
  }

  private getStoredUser(): AuthUser | null {
    if (!this.storage) return null;
    
    try {
      const userData = this.storage.getItem('dev_auth_user');
      if (userData) {
        return JSON.parse(userData);
      }

      // Backwards compatibility: check for old API_ACCOUNT_USERNAME
      const oldUsername = this.storage.getItem('API_ACCOUNT_USERNAME');
      if (oldUsername) {
        return {
          id: oldUsername,
          username: oldUsername,
          email: `${oldUsername}@dev.local`,
          roles: ['admin'],
          metadata: { legacy: true }
        };
      }

      return null;
    } catch (e) {
      console.warn('DevAuth: Failed to parse stored user');
      return null;
    }
  }

  private storeAuth(user: AuthUser, token: AuthToken): void {
    if (!this.storage) return;

    try {
      this.storage.setItem('dev_auth_token', JSON.stringify(token));
      this.storage.setItem('dev_auth_user', JSON.stringify(user));
      
      // Also store in legacy format for backwards compatibility
      this.storage.setItem('API_BEARER', token.value);
      this.storage.setItem('API_ACCOUNT_USERNAME', user.username);
      this.storage.setItem('API_DEV_LAST_UPDATE', String(Date.now()));
    } catch (e) {
      console.warn('DevAuth: Failed to store auth data');
    }
  }

  private clearStoredAuth(): void {
    if (!this.storage) return;
    
    try {
      this.storage.removeItem('dev_auth_token');
      this.storage.removeItem('dev_auth_user');
      
      // Also clear legacy format
      this.storage.removeItem('API_BEARER');
      this.storage.removeItem('API_ACCOUNT_USERNAME');
      this.storage.setItem('API_DEV_LAST_UPDATE', String(Date.now()));
    } catch (e) {
      console.warn('DevAuth: Failed to clear stored auth data');
    }
  }
}