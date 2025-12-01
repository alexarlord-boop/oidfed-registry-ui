/**
 * Unified Authentication System
 * Single authentication provider supporting both password and OIDC flows
 * Uses TokenManager as exclusive storage mechanism
 */

import { UserRole } from '@/types/auth';
import type { 
  TokenSet, 
  OIDCUserInfo, 
  AuthorizationState,
  ProviderId,
  AuthGatewayTokenResponse,
  AuthGatewayUserInfoResponse,
  AuthGatewayErrorResponse
} from '@/types/auth';
import { getTokenManager, TokenManager } from './tokenManager';
import { generatePKCEPair, generateState, generateNonce } from './pkce';
import { getProviderConfig } from '../config/oidc.config';
import { parseJWT } from './utils';
import { useAppState } from '@/hooks/store';

// Core types
export interface AuthUser {
  id: string;
  username: string;
  email?: string;
  role: UserRole | string;
  roles: string[];  // Legacy field for backward compatibility
  oidc_provider?: string;  // SSO provider (github, keycloak, etc.)
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
  
  /** Login with OIDC provider (optional method for SSO) */
  loginWithOIDC?(providerId: ProviderId, redirectTo?: string): Promise<void>;
  
  /** Handle OAuth callback (optional method for SSO) */
  handleCallback?(code: string, state: string): Promise<string>;
  
  /** Get token manager instance (optional, for advanced usage) */
  getTokenManager?(): TokenManager;
}

/**
 * Unified Authentication Provider
 * Supports both password-based and OIDC authentication flows
 * Uses TokenManager as the exclusive token storage mechanism
 * Syncs state with Zustand store for reactive UI updates
 */
export class UnifiedAuth implements AuthProvider {
  private state: AuthState = {
    user: null,
    isLoading: false,
    error: null
  };

  private authGatewayUrl: string;
  private tokenManager: TokenManager;
  private providerId: ProviderId;
  private initialized: boolean = false;

  constructor(providerId: ProviderId = 'local') {
    this.providerId = providerId;
    this.authGatewayUrl = 'http://localhost:9000'; // Will be updated in initialize()
    this.tokenManager = getTokenManager();
    
    // Set up token refresh callback
    this.tokenManager.setRefreshCallback(async (refreshToken: string) => {
      return this.refreshTokens(refreshToken);
    });
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    console.log('[UnifiedAuth] Initialize called');
    
    // Load environment config
    try {
      const { env } = await import('./env');
      this.authGatewayUrl = env.AUTH_SERVICE_URL;
      console.log('[UnifiedAuth] Auth service URL:', this.authGatewayUrl);
    } catch (e) {
      console.warn('Failed to load env config, using default:', e);
      this.authGatewayUrl = 'http://localhost:9000';
    }

    this.state.isLoading = true;
    this.syncToStore();
    
    try {
      // Check if we have tokens in TokenManager
      const hasTokens = await this.tokenManager.hasTokens();
      
      if (hasTokens) {
        // Try to get valid access token (will auto-refresh if needed)
        const accessToken = await this.tokenManager.getValidToken();
        if (accessToken) {
          // Fetch user info with the valid token
          const userInfo = await this.fetchUserInfo(accessToken);
          const user = this.mapUserInfo(userInfo);
          this.state.user = user;
          console.log('[UnifiedAuth] Restored user from tokens:', user.username, 'role:', user.role);
        }
      } else {
        console.log('[UnifiedAuth] No stored tokens found');
      }
    } catch (error) {
      console.warn('Failed to restore auth:', error);
      this.state.error = 'Failed to restore session';
    } finally {
      this.state.isLoading = false;
      this.initialized = true;
      this.syncToStore();
    }
  }

  async getState(): Promise<AuthState> {
    return { ...this.state };
  }

  /**
   * Login with username/password
   * Calls Auth Gateway /auth/token endpoint with password grant
   */
  async login(credentials: LoginCredentials): Promise<LoginResult> {
    const { username, password } = credentials;

    // Basic validation
    if (!username || !password) {
      const error = 'Username and password are required';
      this.state.error = error;
      return { success: false, error };
    }

    this.state.isLoading = true;
    this.state.error = null;

    try {
      // Call Auth Gateway token endpoint with password grant
      const response = await fetch(`${this.authGatewayUrl}/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'password',
          username: username,
          password: password,
          client_id: 'oidfed-registry-ui',
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
        this.state.isLoading = false;
        return { success: false, error };
      }

      const tokenResponse: AuthGatewayTokenResponse = await response.json();
      
      // Store tokens via TokenManager
      const tokens: TokenSet = {
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        id_token: tokenResponse.id_token,
        expires_in: tokenResponse.expires_in,
        expires_at: Date.now() + (tokenResponse.expires_in * 1000),
        token_type: 'Bearer',
        scope: tokenResponse.scope,
      };
      
      await this.tokenManager.setTokens(tokens, 'local');

      // Fetch and store user info
      const userInfo = await this.fetchUserInfo(tokens.access_token);
      const user = this.mapUserInfo(userInfo);
      this.updateState({ user, isLoading: false });

      console.log('[UnifiedAuth] Login successful:', {
        user: user.username,
        hasRefreshToken: !!tokenResponse.refresh_token
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      this.state.error = errorMessage;
      this.state.isLoading = false;
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Initiate OIDC authorization flow
   * Redirects to Auth Gateway /authorize endpoint
   */
  async loginWithOIDC(providerId: ProviderId, redirectTo?: string): Promise<void> {
    const providerConfig = getProviderConfig(providerId);
    if (!providerConfig) {
      throw new Error(`Provider ${providerId} not configured`);
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
      provider: providerId,
    };
    await this.tokenManager.setAuthState(authState);

    // Build authorization URL
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
      const response = await fetch(`${this.authGatewayUrl}/auth/token`, {
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
      
      // Store tokens via TokenManager
      const tokens: TokenSet = {
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        id_token: tokenResponse.id_token,
        expires_in: tokenResponse.expires_in,
        expires_at: Date.now() + (tokenResponse.expires_in * 1000),
        token_type: 'Bearer',
        scope: tokenResponse.scope,
      };
      
      await this.tokenManager.setTokens(tokens, authState.provider);

      // Fetch user info
      const userInfo = await this.fetchUserInfo(tokens.access_token);
      const user = this.mapUserInfo(userInfo);
      this.updateState({ user });

      // Clear authorization state
      await this.tokenManager.clearAuthState();

      console.log('[UnifiedAuth] OAuth callback successful:', user.username);

      // Return redirect URL
      return authState.redirect_to || '/';
    } catch (error) {
      await this.tokenManager.clearAuthState();
      throw error;
    }
  }

  /**
   * Handle SSO callback with tokens in URL fragment
   * Used when Auth Gateway redirects with tokens directly
   */
  async handleSSOCallback(tokens: {
    access_token: string;
    id_token: string;
    refresh_token?: string;
    expires_in: number;
  }): Promise<void> {
    try {
      // Fetch user info first to get provider
      const userInfo = await this.fetchUserInfo(tokens.access_token);
      const provider = userInfo.oidc_provider || 'keycloak';
      
      // Store tokens via TokenManager
      const tokenSet: TokenSet = {
        access_token: tokens.access_token,
        id_token: tokens.id_token,
        refresh_token: tokens.refresh_token || '',
        expires_in: tokens.expires_in,
        expires_at: Date.now() + (tokens.expires_in * 1000),
        token_type: 'Bearer',
        scope: 'openid profile email',
      };
      
      await this.tokenManager.setTokens(tokenSet, provider);

      // Map and store user info
      const user = this.mapUserInfo(userInfo);
      this.updateState({ user });

      console.log('[UnifiedAuth] SSO callback successful:', user.username);
    } catch (error) {
      console.error('[UnifiedAuth] SSO callback error:', error);
      throw error;
    }
  }

  /**
   * Logout user and clear session
   */
  async logout(): Promise<void> {
    const tokens = await this.tokenManager.getTokens();
    
    // Clear local state
    this.updateState({
      user: null,
      isLoading: false,
      error: null,
    });
    
    await this.tokenManager.clearTokens();

    // Call Auth Gateway logout endpoint (optional)
    if (tokens?.access_token) {
      try {
        await fetch(`${this.authGatewayUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`,
          },
        });
      } catch (error) {
        console.error('Logout request failed:', error);
      }
    }

    console.log('[UnifiedAuth] Logout complete');
  }

  /**
   * Get authorization header for API requests
   */
  async getAuthHeader(): Promise<string | null> {
    try {
      const token = await this.tokenManager.getValidToken();
      if (!token) {
        console.warn('[UnifiedAuth] No valid access token available');
        return null;
      }

      console.log('[UnifiedAuth] Returning valid Bearer token');
      return `Bearer ${token}`;
    } catch (error) {
      console.error('[UnifiedAuth] Error getting auth header:', error);
      return null;
    }
  }

  /**
   * Refresh access token using refresh token
   * Called by TokenManager when token needs refresh
   * Also updates user info to get latest role and permissions
   */
  private async refreshTokens(refreshToken: string): Promise<TokenSet> {
    console.log('[UnifiedAuth] Refreshing tokens');
    
    const response = await fetch(`${this.authGatewayUrl}/auth/token`, {
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
    
    const tokenSet: TokenSet = {
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token || refreshToken, // Use new or keep old
      id_token: tokenResponse.id_token,
      expires_in: tokenResponse.expires_in,
      expires_at: Date.now() + (tokenResponse.expires_in * 1000),
      token_type: 'Bearer',
      scope: tokenResponse.scope,
    };
    
    // Fetch updated user info with new token to get latest role/permissions
    try {
      const userInfo = await this.fetchUserInfo(tokenSet.access_token);
      const updatedUser = this.mapUserInfo(userInfo);
      
      // Update user state if role or other info changed
      if (this.state.user && 
          (this.state.user.role !== updatedUser.role || 
           this.state.user.username !== updatedUser.username)) {
        console.log('[UnifiedAuth] User info updated after token refresh:', {
          oldRole: this.state.user.role,
          newRole: updatedUser.role,
          username: updatedUser.username
        });
        this.updateState({ user: updatedUser });
      }
    } catch (error) {
      console.warn('[UnifiedAuth] Failed to fetch updated user info after token refresh:', error);
      // Don't fail the refresh if userinfo fetch fails - tokens are still valid
    }
    
    console.log('[UnifiedAuth] Token refresh successful');
    
    return tokenSet;
  }

  /**
   * Fetch user information from Auth Gateway
   */
  private async fetchUserInfo(accessToken: string): Promise<OIDCUserInfo> {
    const response = await fetch(`${this.authGatewayUrl}/auth/userinfo`, {
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
      role: userInfo.role || UserRole.TECHNICAL_CONTACT,
      roles: userInfo.roles || [userInfo.role || UserRole.TECHNICAL_CONTACT],
      oidc_provider: userInfo.oidc_provider,
    };
  }

  /**
   * Get token manager instance (for advanced usage)
   */
  getTokenManager(): TokenManager {
    return this.tokenManager;
  }

  /**
   * Sync auth state to Zustand store
   * This makes state reactive across all components using the store
   */
  private syncToStore(): void {
    const { setAuthState } = useAppState.getState();
    setAuthState({
      user: this.state.user,
      isAuthLoading: this.state.isLoading,
      authError: this.state.error,
    });
  }

  /**
   * Update state and sync to Zustand
   */
  private updateState(updates: Partial<AuthState>): void {
    this.state = { ...this.state, ...updates };
    this.syncToStore();
  }
}

/**
 * Global auth instance
 * Singleton with lazy initialization
 */
let authInstance: AuthProvider | null = null;
let initPromise: Promise<void> | null = null;

export function getAuth(): AuthProvider {
  if (!authInstance) {
    // Create UnifiedAuth instance (supports both password and OIDC)
    authInstance = new UnifiedAuth('local');
    
    // Start initialization (don't await to avoid blocking)
    initPromise = authInstance.initialize().catch(error => {
      console.error('[Auth] Initialization failed:', error);
    });
  }
  return authInstance;
}

export function setAuth(provider: AuthProvider): void {
  authInstance = provider;
  initPromise = null;
}

/**
 * Ensure auth is initialized (for cases where you need to wait)
 */
export async function ensureAuthInitialized(): Promise<void> {
  getAuth(); // Ensure instance exists
  if (initPromise) {
    await initPromise;
  }
}