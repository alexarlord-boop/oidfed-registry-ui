/**
 * OIDC Authentication Provider
 * Implements AuthProvider interface using OAuth 2.0 / OpenID Connect
 * with PKCE for secure authorization code flow
 */

import type { 
  AuthProvider, 
  AuthState, 
  AuthUser, 
  LoginCredentials, 
  LoginResult 
} from './auth';
import type { 
  TokenSet, 
  OIDCUserInfo, 
  AuthorizationState,
  ProviderId,
  LocalLoginRequest,
  AuthGatewayTokenResponse,
  AuthGatewayUserInfoResponse,
  AuthGatewayErrorResponse
} from '../types/auth';
import { getTokenManager, TokenManager } from './tokenManager';
import { generatePKCEPair, generateState, generateNonce } from './pkce';
import { getProviderConfig } from '../config/oidc.config';
import { env } from './env';
import * as jose from 'jose';

const AUTH_GATEWAY_URL = env.AUTH_SERVICE_URL;

export class OIDCAuth implements AuthProvider {
  private tokenManager: TokenManager;
  private state: AuthState = {
    user: null,
    isLoading: false,
    error: null
  };
  private providerId: ProviderId;

  constructor(providerId: ProviderId = 'keycloak') {
    this.providerId = providerId;
    this.tokenManager = getTokenManager();
    
    // Set up token refresh callback
    this.tokenManager.setRefreshCallback(async (refreshToken: string) => {
      return this.refreshTokens(refreshToken);
    });
  }

  async initialize(): Promise<void> {
    this.state.isLoading = true;
    
    try {
      // Check if we have tokens
      const hasTokens = await this.tokenManager.hasTokens();
      
      if (hasTokens) {
        // Try to get user info
        const accessToken = await this.tokenManager.getValidToken();
        if (accessToken) {
          const userInfo = await this.fetchUserInfo(accessToken);
          this.state.user = this.mapUserInfo(userInfo);
        }
      }
    } catch (error) {
      console.error('Failed to initialize OIDC auth:', error);
      this.state.error = 'Failed to restore session';
    } finally {
      this.state.isLoading = false;
    }
  }

  async getState(): Promise<AuthState> {
    return { ...this.state };
  }

  /**
   * Login with local credentials (username/password)
   * Calls Auth Gateway /auth/token endpoint
   */
  async login(credentials: LoginCredentials): Promise<LoginResult> {
    const { username, password } = credentials;

    if (!username || !password) {
      const error = 'Username and password are required';
      this.state.error = error;
      return { success: false, error };
    }

    this.state.isLoading = true;
    this.state.error = null;

    try {
      // Call Auth Gateway local login endpoint
      const response = await fetch(`${AUTH_GATEWAY_URL}/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'password',
          username,
          password,
          client_id: 'oidfed-registry-ui',
        }),
      });

      if (!response.ok) {
        const error: AuthGatewayErrorResponse = await response.json();
        throw new Error(error.error_description || error.error || 'Login failed');
      }

      const tokenResponse: AuthGatewayTokenResponse = await response.json();
      
      // Store tokens
      const tokens: TokenSet = {
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        id_token: tokenResponse.id_token,
        expires_in: tokenResponse.expires_in,
        expires_at: Date.now() + (tokenResponse.expires_in * 1000),
        token_type: 'Bearer',
        scope: tokenResponse.scope,
      };
      
      await this.tokenManager.setTokens(tokens);

      // Fetch and store user info
      const userInfo = await this.fetchUserInfo(tokens.access_token);
      this.state.user = this.mapUserInfo(userInfo);
      this.state.isLoading = false;

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      this.state.error = errorMessage;
      this.state.isLoading = false;
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Initiate OIDC authorization flow
   * Redirects to Auth Gateway /authorize endpoint
   */
  async loginWithOIDC(redirectTo?: string): Promise<void> {
    const providerConfig = getProviderConfig(this.providerId);
    if (!providerConfig) {
      throw new Error(`Provider ${this.providerId} not configured`);
    }

    // Generate PKCE parameters
    const { code_verifier, code_challenge } = await generatePKCEPair();
    const state = generateState();
    const nonce = generateNonce();

    // Store authorization state for callback
    const authState: AuthorizationState = {
      state,
      code_verifier,
      redirect_to: redirectTo || window.location.pathname,
      provider: this.providerId,
    };
    await this.tokenManager.setAuthState(authState);

    // Build authorization URL - use provider's authority
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: providerConfig.client_id,
      redirect_uri: providerConfig.redirect_uri,
      scope: providerConfig.scope,
      state,
      code_challenge,
      code_challenge_method: 'S256',
      nonce,
    });

    const authorizeUrl = `${providerConfig.authority}/authorize?${params.toString()}`;
    
    // Redirect to Auth Gateway
    window.location.href = authorizeUrl;
  }

  /**
   * Handle OAuth callback
   * Exchange authorization code for tokens
   */
  async handleCallback(code: string, state: string): Promise<string> {
    // Retrieve and validate authorization state
    const authState = await this.tokenManager.getAuthState();
    
    if (!authState) {
      throw new Error('No authorization state found');
    }

    if (authState.state !== state) {
      throw new Error('State mismatch - possible CSRF attack');
    }

    const providerConfig = getProviderConfig(authState.provider);
    if (!providerConfig) {
      throw new Error(`Provider ${authState.provider} not configured`);
    }

    try {
      // Exchange code for tokens
      const response = await fetch(`${AUTH_GATEWAY_URL}/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: providerConfig.redirect_uri,
          client_id: providerConfig.client_id,
          code_verifier: authState.code_verifier,
        }),
      });

      if (!response.ok) {
        const error: AuthGatewayErrorResponse = await response.json();
        throw new Error(error.error_description || error.error || 'Token exchange failed');
      }

      const tokenResponse: AuthGatewayTokenResponse = await response.json();
      
      // Store tokens
      const tokens: TokenSet = {
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        id_token: tokenResponse.id_token,
        expires_in: tokenResponse.expires_in,
        expires_at: Date.now() + (tokenResponse.expires_in * 1000),
        token_type: 'Bearer',
        scope: tokenResponse.scope,
      };
      
      await this.tokenManager.setTokens(tokens);

      // Fetch user info
      const userInfo = await this.fetchUserInfo(tokens.access_token);
      this.state.user = this.mapUserInfo(userInfo);

      // Clear authorization state
      await this.tokenManager.clearAuthState();

      // Return redirect URL
      return authState.redirect_to || '/';
    } catch (error) {
      await this.tokenManager.clearAuthState();
      throw error;
    }
  }

  /**
   * Logout user and clear session
   */
  async logout(): Promise<void> {
    const tokens = await this.tokenManager.getTokens();
    
    // Clear local state
    this.state = {
      user: null,
      isLoading: false,
      error: null,
    };
    
    await this.tokenManager.clearTokens();

    // Call Auth Gateway logout endpoint (optional)
    if (tokens?.access_token) {
      try {
        await fetch(`${AUTH_GATEWAY_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`,
          },
        });
      } catch (error) {
        console.error('Logout request failed:', error);
      }
    }
  }

  /**
   * Get authorization header for API requests
   */
  async getAuthHeader(): Promise<string | null> {
    const token = await this.tokenManager.getValidToken();
    return token ? `Bearer ${token}` : null;
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshTokens(refreshToken: string): Promise<TokenSet> {
    const response = await fetch(`${AUTH_GATEWAY_URL}/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: 'oidfed-registry-ui',
      }),
    });

    if (!response.ok) {
      const error: AuthGatewayErrorResponse = await response.json();
      throw new Error(error.error_description || error.error || 'Token refresh failed');
    }

    const tokenResponse: AuthGatewayTokenResponse = await response.json();
    
    return {
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token || refreshToken, // Use new or keep old
      id_token: tokenResponse.id_token,
      expires_in: tokenResponse.expires_in,
      expires_at: Date.now() + (tokenResponse.expires_in * 1000),
      token_type: 'Bearer',
      scope: tokenResponse.scope,
    };
  }

  /**
   * Fetch user information from Auth Gateway
   */
  private async fetchUserInfo(accessToken: string): Promise<OIDCUserInfo> {
    const response = await fetch(`${AUTH_GATEWAY_URL}/auth/userinfo`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    return response.json();
  }

  /**
   * Map OIDC user info to AuthUser
   */
  private mapUserInfo(userInfo: OIDCUserInfo): AuthUser {
    return {
      id: userInfo.sub,
      username: userInfo.preferred_username || userInfo.email,
      email: userInfo.email,
      role: userInfo.role || 'pending',
      roles: userInfo.roles || [],
    };
  }

  /**
   * Get token manager instance
   */
  getTokenManager(): TokenManager {
    return this.tokenManager;
  }
}

/**
 * Create OIDC auth instance for a specific provider
 */
export function createOIDCAuth(providerId: ProviderId = 'keycloak'): OIDCAuth {
  return new OIDCAuth(providerId);
}
