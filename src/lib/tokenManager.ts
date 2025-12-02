/**
 * Token Manager
 * Handles secure token storage, retrieval, and automatic refresh
 * 
 * Security Strategy:
 * - Access tokens: Stored in memory (cleared on page refresh)
 * - Refresh tokens: Would ideally be in httpOnly cookies (requires Auth Gateway support)
 * - For MVP: Store refresh tokens in sessionStorage (better than localStorage)
 * - Authorization state: sessionStorage for PKCE flow
 */

import type { 
  TokenSet, 
  TokenStorage, 
  AuthorizationState,
  SessionInfo 
} from '../types/auth';

/**
 * In-memory token storage
 * Access tokens stored in memory for security (not accessible via XSS)
 */
class MemoryTokenStorage implements TokenStorage {
  private tokens: TokenSet | null = null;
  private readonly REFRESH_TOKEN_KEY = 'auth_refresh_token';
  private readonly AUTH_STATE_KEY = 'auth_state';
  private readonly SESSION_INFO_KEY = 'auth_session_info';
  
  async getTokens(): Promise<TokenSet | null> {
    if (!this.tokens) {
      // Try to restore refresh token from sessionStorage
      const refreshToken = this.getRefreshToken();
      if (refreshToken) {
        // Tokens exist but access token expired - caller should refresh
        return {
          access_token: '', // Empty, needs refresh
          refresh_token: refreshToken,
          expires_in: 0,
          expires_at: 0,
          token_type: 'Bearer'
        };
      }
    }
    return this.tokens;
  }

  async setTokens(tokens: TokenSet): Promise<void> {
    // Calculate expiry timestamp
    const expiresAt = Date.now() + (tokens.expires_in * 1000);
    
    this.tokens = {
      ...tokens,
      expires_at: expiresAt
    };

    // Persist refresh token in sessionStorage
    if (tokens.refresh_token) {
      try {
        sessionStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refresh_token);
      } catch (error) {
        console.error('Failed to store refresh token:', error);
      }
    }
  }

  async clearTokens(): Promise<void> {
    this.tokens = null;
    
    try {
      sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
      sessionStorage.removeItem(this.SESSION_INFO_KEY);
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }

  async getAuthState(): Promise<AuthorizationState | null> {
    try {
      const state = sessionStorage.getItem(this.AUTH_STATE_KEY);
      return state ? JSON.parse(state) : null;
    } catch (error) {
      console.error('Failed to get auth state:', error);
      return null;
    }
  }

  async setAuthState(state: AuthorizationState): Promise<void> {
    try {
      sessionStorage.setItem(this.AUTH_STATE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to set auth state:', error);
    }
  }

  async clearAuthState(): Promise<void> {
    try {
      sessionStorage.removeItem(this.AUTH_STATE_KEY);
    } catch (error) {
      console.error('Failed to clear auth state:', error);
    }
  }

  getRefreshToken(): string | null {
    try {
      return sessionStorage.getItem(this.REFRESH_TOKEN_KEY);
    } catch (error) {
      return null;
    }
  }

  getSessionInfo(): SessionInfo | null {
    try {
      const info = sessionStorage.getItem(this.SESSION_INFO_KEY);
      return info ? JSON.parse(info) : null;
    } catch (error) {
      return null;
    }
  }

  setSessionInfo(info: SessionInfo): void {
    try {
      sessionStorage.setItem(this.SESSION_INFO_KEY, JSON.stringify(info));
    } catch (error) {
      console.error('Failed to set session info:', error);
    }
  }
}

/**
 * Token Manager
 * Centralized token management with automatic refresh
 */
export class TokenManager {
  private storage: TokenStorage;
  private refreshPromise: Promise<TokenSet | null> | null = null;
  private refreshCallback?: (refreshToken: string) => Promise<TokenSet>;

  constructor(storage?: TokenStorage) {
    this.storage = storage || new MemoryTokenStorage();
  }

  /**
   * Set the refresh callback function
   * This will be called when tokens need to be refreshed
   */
  setRefreshCallback(callback: (refreshToken: string) => Promise<TokenSet>): void {
    this.refreshCallback = callback;
  }

  /**
   * Get valid access token, refreshing if necessary
   * Returns null if no tokens or refresh fails
   */
  async getValidToken(): Promise<string | null> {
    let tokens = await this.storage.getTokens();
    
    if (!tokens) {
      return null;
    }

    // Check if access token is still valid (with 60 second buffer)
    const now = Date.now();
    const expiryBuffer = 60 * 1000; // 60 seconds
    
    if (tokens.access_token && tokens.expires_at > now + expiryBuffer) {
      return tokens.access_token;
    }

    // Access token expired or missing, try to refresh
    if (tokens.refresh_token) {
      tokens = await this.refreshTokens(tokens.refresh_token);
      if (tokens) {
        return tokens.access_token;
      }
    }

    return null;
  }

  /**
   * Get tokens without automatic refresh
   */
  async getTokens(): Promise<TokenSet | null> {
    return this.storage.getTokens();
  }

  /**
   * Store new tokens
   */
  async setTokens(tokens: TokenSet, provider?: string): Promise<void> {
    await this.storage.setTokens(tokens);
    
    // Store session info
    if (this.storage instanceof MemoryTokenStorage) {
      const sessionInfo: SessionInfo = {
        created_at: Date.now(),
        expires_at: tokens.expires_at,
        last_activity: Date.now(),
        provider: (provider as any) || 'local',
      };
      this.storage.setSessionInfo(sessionInfo);
    }
  }

  /**
   * Refresh access token using refresh token
   * Prevents multiple simultaneous refresh requests
   */
  async refreshTokens(refreshToken: string): Promise<TokenSet | null> {
    // If a refresh is already in progress, wait for it
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    // Start new refresh request
    this.refreshPromise = this._performRefresh(refreshToken);
    
    try {
      const tokens = await this.refreshPromise;
      return tokens;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async _performRefresh(refreshToken: string): Promise<TokenSet | null> {
    if (!this.refreshCallback) {
      console.error('No refresh callback set');
      return null;
    }

    try {
      const newTokens = await this.refreshCallback(refreshToken);
      await this.setTokens(newTokens);
      return newTokens;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Clear tokens on refresh failure
      await this.clearTokens();
      return null;
    }
  }

  /**
   * Clear all tokens and session info
   */
  async clearTokens(): Promise<void> {
    await this.storage.clearTokens();
  }

  /**
   * Check if tokens exist (doesn't validate expiry)
   */
  async hasTokens(): Promise<boolean> {
    const tokens = await this.storage.getTokens();
    return tokens !== null && (!!tokens.access_token || !!tokens.refresh_token);
  }

  /**
   * Get time until token expiry (in seconds)
   */
  async getTimeUntilExpiry(): Promise<number | null> {
    const tokens = await this.storage.getTokens();
    if (!tokens || !tokens.expires_at) {
      return null;
    }

    const now = Date.now();
    const timeLeft = Math.max(0, tokens.expires_at - now);
    return Math.floor(timeLeft / 1000);
  }

  /**
   * Get session information
   */
  getSessionInfo(): SessionInfo | null {
    if (this.storage instanceof MemoryTokenStorage) {
      return this.storage.getSessionInfo();
    }
    return null;
  }

  /**
   * Update last activity timestamp
   */
  updateActivity(): void {
    const sessionInfo = this.getSessionInfo();
    if (sessionInfo && this.storage instanceof MemoryTokenStorage) {
      sessionInfo.last_activity = Date.now();
      this.storage.setSessionInfo(sessionInfo);
    }
  }

  // Authorization state methods
  async getAuthState(): Promise<AuthorizationState | null> {
    return this.storage.getAuthState();
  }

  async setAuthState(state: AuthorizationState): Promise<void> {
    await this.storage.setAuthState(state);
  }

  async clearAuthState(): Promise<void> {
    await this.storage.clearAuthState();
  }
}

// Global token manager instance
let tokenManagerInstance: TokenManager | null = null;

/**
 * Get the global token manager instance
 */
export function getTokenManager(): TokenManager {
  if (!tokenManagerInstance) {
    tokenManagerInstance = new TokenManager();
  }
  return tokenManagerInstance;
}

/**
 * Set a custom token manager instance
 */
export function setTokenManager(manager: TokenManager): void {
  tokenManagerInstance = manager;
}
