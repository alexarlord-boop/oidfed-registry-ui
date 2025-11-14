import type { 
  AuthAdapter, 
  AuthState, 
  AuthToken, 
  AuthUser, 
  LoginCredentials, 
  LoginResult, 
  LogoutResult,
  OAuthConfig 
} from '../types';

/**
 * OAuth/OIDC Authentication Adapter
 * Handles OAuth 2.0 and OpenID Connect authentication flows
 */
export class OAuthAdapter implements AuthAdapter {
  public readonly id = 'oauth';
  public readonly name = 'OAuth/OIDC Authentication';
  public readonly config: OAuthConfig;

  private currentState: AuthState;
  private storage: Storage | null = null;

  constructor(config: OAuthConfig) {
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
      console.warn('OAuth: localStorage not available');
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
          // Try to refresh if possible
          if (this.supportsRefresh()) {
            const refreshed = await this.refreshToken();
            if (refreshed) {
              await this.updateUserInfo(refreshed);
            } else {
              this.clearStoredAuth();
            }
          } else {
            this.clearStoredAuth();
          }
        }
      }
    } catch (error) {
      console.error('OAuth: Error initializing adapter', error);
      this.currentState.error = 'Failed to initialize authentication';
    } finally {
      this.currentState.isLoading = false;
    }
  }

  async login(credentials: LoginCredentials): Promise<LoginResult> {
    try {
      // For OAuth, we don't use username/password directly
      // Instead, we redirect to the authorization endpoint
      const authUrl = this.buildAuthorizationUrl();
      
      return {
        success: true,
        redirectUrl: authUrl,
        metadata: {
          flow: 'authorization_code',
          state: this.generateState()
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initiate OAuth flow';
      this.currentState.error = errorMessage;
      return { success: false, error: errorMessage };
    }
  }

  async logout(): Promise<LogoutResult> {
    try {
      // Clear local state
      this.currentState = {
        user: null,
        token: null,
        isLoading: false,
        error: null
      };

      // Clear storage
      this.clearStoredAuth();

      // For OAuth, we might want to redirect to the provider's logout endpoint
      // This is optional and depends on the provider
      const logoutUrl = this.buildLogoutUrl();
      
      return { 
        success: true,
        redirectUrl: logoutUrl
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      return { success: false, error: errorMessage };
    }
  }

  async handleCallback(callbackData: Record<string, string>): Promise<LoginResult> {
    try {
      this.currentState.isLoading = true;
      
      const { code, state, error } = callbackData;
      
      if (error) {
        this.currentState.error = `OAuth error: ${error}`;
        return { success: false, error: `OAuth error: ${error}` };
      }

      if (!code) {
        this.currentState.error = 'No authorization code received';
        return { success: false, error: 'No authorization code received' };
      }

      // Verify state parameter if we stored one
      const storedState = this.getStoredState();
      if (storedState && state !== storedState) {
        this.currentState.error = 'Invalid state parameter';
        return { success: false, error: 'Invalid state parameter' };
      }

      // Exchange authorization code for access token
      const tokenResponse = await this.exchangeCodeForToken(code);
      
      if (!tokenResponse.access_token) {
        this.currentState.error = 'No access token received';
        return { success: false, error: 'No access token received' };
      }

      const token: AuthToken = {
        value: tokenResponse.access_token,
        type: 'Bearer',
        expiresAt: tokenResponse.expires_in 
          ? Math.floor(Date.now() / 1000) + tokenResponse.expires_in 
          : undefined,
        metadata: {
          refresh_token: tokenResponse.refresh_token,
          scope: tokenResponse.scope,
          token_type: tokenResponse.token_type
        }
      };

      // Get user info (for OIDC or via userinfo endpoint)
      let user: AuthUser;
      if (this.config.type === 'oidc' && tokenResponse.id_token) {
        user = this.parseIdToken(tokenResponse.id_token);
      } else if (this.config.settings.userinfoEndpoint) {
        user = await this.fetchUserInfo(token);
      } else {
        // Fallback: create minimal user from token
        user = {
          id: 'oauth_user',
          username: 'oauth_user',
          roles: ['admin']
        };
      }

      // Store auth state
      this.currentState = {
        user,
        token,
        isLoading: false,
        error: null
      };

      // Persist to storage
      this.storeAuth(user, token);
      this.clearStoredState();

      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'OAuth callback failed';
      this.currentState.error = errorMessage;
      return { success: false, error: errorMessage };
    } finally {
      this.currentState.isLoading = false;
    }
  }

  async getAuthState(): Promise<AuthState> {
    return { ...this.currentState };
  }

  async refreshToken(): Promise<AuthToken | null> {
    try {
      const refreshToken = this.currentState.token?.metadata?.refresh_token;
      if (!refreshToken) return null;

      const response = await fetch(this.config.settings.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: this.config.settings.clientId,
        })
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const tokenData = await response.json();
      
      const newToken: AuthToken = {
        value: tokenData.access_token,
        type: 'Bearer',
        expiresAt: tokenData.expires_in 
          ? Math.floor(Date.now() / 1000) + tokenData.expires_in 
          : undefined,
        metadata: {
          refresh_token: tokenData.refresh_token || refreshToken,
          scope: tokenData.scope,
          token_type: tokenData.token_type
        }
      };

      this.currentState.token = newToken;
      if (this.currentState.user) {
        this.storeAuth(this.currentState.user, newToken);
      }

      return newToken;

    } catch (error) {
      console.error('OAuth: Token refresh failed', error);
      return null;
    }
  }

  supportsRefresh(): boolean {
    return true; // OAuth typically supports token refresh
  }

  async validateToken(token: AuthToken): Promise<boolean> {
    try {
      // Check expiration
      if (token.expiresAt && Date.now() / 1000 > token.expiresAt) {
        return false;
      }

      // For OAuth, we can validate by making a request to userinfo endpoint
      if (this.config.settings.userinfoEndpoint) {
        const response = await fetch(this.config.settings.userinfoEndpoint, {
          headers: {
            'Authorization': `${token.type} ${token.value}`
          }
        });
        return response.ok;
      }

      return true;
    } catch (error) {
      console.warn('OAuth: Token validation failed', error);
      return false;
    }
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

  // Private helper methods
  private buildAuthorizationUrl(): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.settings.clientId,
      redirect_uri: this.config.settings.redirectUri,
      scope: this.config.settings.scopes.join(' '),
      state: this.generateState(),
      ...this.config.settings.additionalParams
    });

    return `${this.config.settings.authorizationEndpoint}?${params.toString()}`;
  }

  private buildLogoutUrl(): string | undefined {
    // This is provider-specific; some providers support logout URLs
    // For now, we'll return undefined, but this could be configurable
    return undefined;
  }

  private generateState(): string {
    const state = Math.random().toString(36).substring(2, 15);
    this.storeState(state);
    return state;
  }

  private async exchangeCodeForToken(code: string): Promise<any> {
    const response = await fetch(this.config.settings.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.config.settings.clientId,
        code,
        redirect_uri: this.config.settings.redirectUri,
      })
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    return response.json();
  }

  private parseIdToken(idToken: string): AuthUser {
    try {
      // Simple JWT parsing (for demo purposes - in production, verify signature)
      const parts = idToken.split('.');
      if (parts.length !== 3 || !parts[1]) {
        throw new Error('Invalid ID token format');
      }
      const payload = JSON.parse(atob(parts[1]));
      
      return {
        id: payload.sub,
        username: payload.preferred_username || payload.name || payload.sub,
        email: payload.email,
        metadata: payload,
        roles: ['admin'] // Default role
      };
    } catch (error) {
      throw new Error('Failed to parse ID token');
    }
  }

  private async fetchUserInfo(token: AuthToken): Promise<AuthUser> {
    if (!this.config.settings.userinfoEndpoint) {
      throw new Error('No userinfo endpoint configured');
    }

    const response = await fetch(this.config.settings.userinfoEndpoint, {
      headers: {
        'Authorization': `${token.type} ${token.value}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    const userInfo = await response.json();
    
    return {
      id: userInfo.sub || userInfo.id,
      username: userInfo.preferred_username || userInfo.name || userInfo.sub,
      email: userInfo.email,
      metadata: userInfo,
      roles: ['admin'] // Default role
    };
  }

  private async updateUserInfo(token: AuthToken): Promise<void> {
    try {
      if (this.config.settings.userinfoEndpoint) {
        const user = await this.fetchUserInfo(token);
        this.currentState.user = user;
        this.storeAuth(user, token);
      }
    } catch (error) {
      console.warn('OAuth: Failed to update user info', error);
    }
  }

  private getStoredToken(): AuthToken | null {
    if (!this.storage) return null;
    
    try {
      const tokenData = this.storage.getItem('oauth_auth_token');
      return tokenData ? JSON.parse(tokenData) : null;
    } catch (e) {
      console.warn('OAuth: Failed to parse stored token');
      return null;
    }
  }

  private getStoredUser(): AuthUser | null {
    if (!this.storage) return null;
    
    try {
      const userData = this.storage.getItem('oauth_auth_user');
      return userData ? JSON.parse(userData) : null;
    } catch (e) {
      console.warn('OAuth: Failed to parse stored user');
      return null;
    }
  }

  private getStoredState(): string | null {
    if (!this.storage) return null;
    return this.storage.getItem('oauth_state');
  }

  private storeAuth(user: AuthUser, token: AuthToken): void {
    if (!this.storage) return;

    try {
      this.storage.setItem('oauth_auth_token', JSON.stringify(token));
      this.storage.setItem('oauth_auth_user', JSON.stringify(user));
    } catch (e) {
      console.warn('OAuth: Failed to store auth data');
    }
  }

  private storeState(state: string): void {
    if (!this.storage) return;
    try {
      this.storage.setItem('oauth_state', state);
    } catch (e) {
      console.warn('OAuth: Failed to store state');
    }
  }

  private clearStoredAuth(): void {
    if (!this.storage) return;
    
    try {
      this.storage.removeItem('oauth_auth_token');
      this.storage.removeItem('oauth_auth_user');
    } catch (e) {
      console.warn('OAuth: Failed to clear stored auth data');
    }
  }

  private clearStoredState(): void {
    if (!this.storage) return;
    try {
      this.storage.removeItem('oauth_state');
    } catch (e) {
      console.warn('OAuth: Failed to clear stored state');
    }
  }
}