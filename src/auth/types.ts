// Authentication system types and interfaces
// Provides a unified authentication interface that adapters can implement

export interface AuthUser {
  /** Unique identifier for the user */
  id: string;
  /** Display name for the user */
  username: string;
  /** User's email if available */
  email?: string;
  /** Additional user metadata */
  metadata?: Record<string, any>;
  /** User roles (currently just 'admin' but extensible) */
  roles: string[];
}

export interface AuthToken {
  /** The raw token string */
  value: string;
  /** Token type (e.g., 'Bearer', 'Basic') */
  type: string;
  /** Token expiration time (Unix timestamp) */
  expiresAt?: number;
  /** Token metadata */
  metadata?: Record<string, any>;
}

export interface AuthState {
  /** Current user if authenticated */
  user: AuthUser | null;
  /** Current token if authenticated */
  token: AuthToken | null;
  /** Whether authentication is in progress */
  isLoading: boolean;
  /** Last authentication error */
  error: string | null;
}

export interface LoginCredentials {
  /** Username/email */
  username: string;
  /** Password */
  password: string;
  /** Additional fields (e.g., 2FA code) */
  additionalFields?: Record<string, string>;
}

export interface LoginResult {
  /** Whether login was successful */
  success: boolean;
  /** Error message if login failed */
  error?: string;
  /** Redirect URL if needed (e.g., for OAuth flows) */
  redirectUrl?: string;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

export interface LogoutResult {
  /** Whether logout was successful */
  success: boolean;
  /** Error message if logout failed */
  error?: string;
  /** Redirect URL if needed */
  redirectUrl?: string;
}

/**
 * Core authentication adapter interface that all auth methods must implement.
 * This provides a unified API for the frontend regardless of the underlying auth mechanism.
 */
export interface AuthAdapter {
  /** Unique identifier for this adapter */
  readonly id: string;
  /** Human-readable name for this adapter */
  readonly name: string;
  /** Configuration for this adapter */
  readonly config: AuthAdapterConfig;

  /**
   * Initialize the adapter (load stored tokens, set up event listeners, etc.)
   */
  initialize(): Promise<void>;

  /**
   * Attempt to authenticate with provided credentials
   */
  login(credentials: LoginCredentials): Promise<LoginResult>;

  /**
   * Log out the current user
   */
  logout(): Promise<LogoutResult>;

  /**
   * Get current authentication state
   */
  getAuthState(): Promise<AuthState>;

  /**
   * Refresh the current token if supported
   */
  refreshToken?(): Promise<AuthToken | null>;

  /**
   * Check if the adapter supports token refresh
   */
  supportsRefresh(): boolean;

  /**
   * Validate a token (e.g., check expiration, verify with server)
   */
  validateToken(token: AuthToken): Promise<boolean>;

  /**
   * Handle OAuth/OIDC callback (for OAuth adapters)
   */
  handleCallback?(callbackData: Record<string, string>): Promise<LoginResult>;

  /**
   * Get the authorization header for API requests
   */
  getAuthHeader(): Promise<string | null>;

  /**
   * Clean up resources when adapter is being destroyed
   */
  destroy(): Promise<void>;
}

export interface AuthAdapterConfig {
  /** Adapter type identifier */
  type: string;
  /** Display name for this configuration */
  name: string;
  /** Whether this adapter is enabled */
  enabled: boolean;
  /** Adapter-specific settings */
  settings: Record<string, any>;
}

/**
 * Configuration for different auth adapter types
 */
export interface BasicAuthConfig extends AuthAdapterConfig {
  type: 'basic';
  settings: {
    /** API endpoint for username/password authentication */
    loginEndpoint: string;
    /** API endpoint for logout */
    logoutEndpoint?: string;
    /** API endpoint for token validation */
    validateEndpoint?: string;
    /** Whether to store credentials (dev mode only) */
    allowCredentialStorage?: boolean;
  };
}

export interface OAuthConfig extends AuthAdapterConfig {
  type: 'oauth' | 'oidc';
  settings: {
    /** OAuth client ID */
    clientId: string;
    /** OAuth authorization endpoint */
    authorizationEndpoint: string;
    /** OAuth token endpoint */
    tokenEndpoint: string;
    /** OAuth redirect URI */
    redirectUri: string;
    /** OAuth scopes */
    scopes: string[];
    /** OIDC userinfo endpoint (for OIDC) */
    userinfoEndpoint?: string;
    /** Additional OAuth parameters */
    additionalParams?: Record<string, string>;
  };
}

export interface DevAuthConfig extends AuthAdapterConfig {
  type: 'dev';
  settings: {
    /** Default username for dev mode */
    defaultUsername: string;
    /** Default password for dev mode */
    defaultPassword: string;
    /** Whether to generate dummy JWTs */
    generateDummyTokens: boolean;
    /** Whether to allow any credentials */
    allowAnyCredentials?: boolean;
  };
}

/**
 * Union type for all supported auth configurations
 */
export type AuthConfig = BasicAuthConfig | OAuthConfig | DevAuthConfig;

/**
 * Events that the auth system can emit
 */
export interface AuthEvents {
  /** User logged in */
  'auth:login': { user: AuthUser; token: AuthToken };
  /** User logged out */
  'auth:logout': { user: AuthUser | null };
  /** Token refreshed */
  'auth:token-refresh': { token: AuthToken };
  /** Authentication error occurred */
  'auth:error': { error: string; adapter: string };
  /** Auth state changed */
  'auth:state-change': { state: AuthState };
}

/**
 * Event emitter interface for auth events
 */
export interface AuthEventEmitter {
  on<K extends keyof AuthEvents>(event: K, listener: (data: AuthEvents[K]) => void): void;
  off<K extends keyof AuthEvents>(event: K, listener: (data: AuthEvents[K]) => void): void;
  emit<K extends keyof AuthEvents>(event: K, data: AuthEvents[K]): void;
}