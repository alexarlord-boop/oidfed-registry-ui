/**
 * Authentication System Index
 * Unified authentication interface for OIDFED Registry UI
 */

// Core types and interfaces
export type {
  AuthAdapter,
  AuthState,
  AuthToken,
  AuthUser,
  LoginCredentials,
  LoginResult,
  LogoutResult,
  AuthConfig,
  BasicAuthConfig,
  OAuthConfig,
  DevAuthConfig,
  AuthEvents,
  AuthEventEmitter,
  AuthAdapterConfig
} from './types';

// Authentication manager
export { 
  AuthManager, 
  getAuthManager, 
  initializeAuth, 
  auth 
} from './AuthManager';

// Configuration system
export {
  DEFAULT_AUTH_CONFIGS,
  AuthConfigLoader,
  DEPLOYMENT_PRESETS,
  validateAuthConfig
} from './config';
export type { AuthConfigOptions } from './config';

// Individual adapters (for advanced use cases)
export { BasicAuthAdapter } from './adapters/BasicAuthAdapter';
export { OAuthAdapter } from './adapters/OAuthAdapter';
export { DevAuthAdapter } from './adapters/DevAuthAdapter';

// React hooks and components
export { 
  useAuth, 
  useCurrentUser, 
  useIsAuthenticated, 
  useAuthHeader, 
  useOAuthCallback, 
  useAuthAdapters 
} from './hooks/useAuth';

export { UnifiedLogin, OAuthCallback } from './components/UnifiedLogin';
export { RequireAuth, withAuth, useAuthGuard } from './components/RequireAuth';
export { 
  AuthProvider, 
  useAuthContext, 
  getAuthenticatedHeaders, 
  authenticatedFetch, 
  legacyAuth 
} from './components/AuthProvider';

// Convenience functions for common scenarios
export const createAuthConfig = {
  /**
   * Create development authentication config
   */
  development: (options?: { 
    defaultUsername?: string; 
    defaultPassword?: string;
    allowAnyCredentials?: boolean;
  }) => ({
    type: 'dev' as const,
    name: 'Development Authentication',
    enabled: true,
    settings: {
      defaultUsername: options?.defaultUsername || 'admin',
      defaultPassword: options?.defaultPassword || 'admin',
      generateDummyTokens: true,
      allowAnyCredentials: options?.allowAnyCredentials ?? true
    }
  }),

  /**
   * Create basic authentication config
   */
  basicAuth: (baseUrl: string, options?: {
    loginPath?: string;
    logoutPath?: string;
    validatePath?: string;
    allowCredentialStorage?: boolean;
  }) => ({
    type: 'basic' as const,
    name: 'Basic Authentication',
    enabled: true,
    settings: {
      loginEndpoint: `${baseUrl}${options?.loginPath || '/api/auth/login'}`,
      logoutEndpoint: `${baseUrl}${options?.logoutPath || '/api/auth/logout'}`,
      validateEndpoint: `${baseUrl}${options?.validatePath || '/api/auth/validate'}`,
      allowCredentialStorage: options?.allowCredentialStorage ?? true
    }
  }),

  /**
   * Create OAuth configuration
   */
  oauth: (config: {
    clientId: string;
    authorizationEndpoint: string;
    tokenEndpoint: string;
    redirectUri?: string;
    scopes?: string[];
    userinfoEndpoint?: string;
  }) => ({
    type: 'oauth' as const,
    name: 'OAuth 2.0 Authentication',
    enabled: true,
    settings: {
      clientId: config.clientId,
      authorizationEndpoint: config.authorizationEndpoint,
      tokenEndpoint: config.tokenEndpoint,
      redirectUri: config.redirectUri || `${window?.location?.origin || 'http://localhost:3000'}/auth/callback`,
      scopes: config.scopes || ['openid', 'profile'],
      userinfoEndpoint: config.userinfoEndpoint,
      additionalParams: {}
    }
  }),

  /**
   * Create OIDC configuration
   */
  oidc: (config: {
    clientId: string;
    issuer: string;
    redirectUri?: string;
    scopes?: string[];
  }) => ({
    type: 'oidc' as const,
    name: 'OpenID Connect Authentication',
    enabled: true,
    settings: {
      clientId: config.clientId,
      authorizationEndpoint: `${config.issuer}/auth`,
      tokenEndpoint: `${config.issuer}/token`,
      redirectUri: config.redirectUri || `${window?.location?.origin || 'http://localhost:3000'}/auth/callback`,
      scopes: config.scopes || ['openid', 'profile', 'email'],
      userinfoEndpoint: `${config.issuer}/userinfo`,
      additionalParams: {}
    }
  })
};

/**
 * Quick setup functions for common deployment scenarios
 */
export const setupAuth = {
  /**
   * Setup for development environment
   */
  async development(options?: Parameters<typeof createAuthConfig.development>[0]) {
    const { initializeAuth } = await import('./AuthManager');
    const config = createAuthConfig.development(options);
    return initializeAuth([config]);
  },

  /**
   * Setup for production with basic auth
   */
  async basicAuth(
    baseUrl: string, 
    options?: Parameters<typeof createAuthConfig.basicAuth>[1]
  ) {
    const { initializeAuth } = await import('./AuthManager');
    const config = createAuthConfig.basicAuth(baseUrl, options);
    return initializeAuth([config]);
  },

  /**
   * Setup for production with OAuth
   */
  async oauth(config: Parameters<typeof createAuthConfig.oauth>[0]) {
    const { initializeAuth } = await import('./AuthManager');
    const authConfig = createAuthConfig.oauth(config);
    return initializeAuth([authConfig]);
  },

  /**
   * Setup for production with OIDC
   */
  async oidc(config: Parameters<typeof createAuthConfig.oidc>[0]) {
    const { initializeAuth } = await import('./AuthManager');
    const authConfig = createAuthConfig.oidc(config);
    return initializeAuth([authConfig]);
  },

  /**
   * Setup with auto-detected configuration from environment
   */
  async autoDetect() {
    const { initializeAuth } = await import('./AuthManager');
    const { AuthConfigLoader } = await import('./config');
    const configs = AuthConfigLoader.loadAutoDetect();
    return initializeAuth(configs);
  },

  /**
   * Setup with multiple authentication methods
   */
  async multiple(configs: Parameters<typeof createAuthConfig[keyof typeof createAuthConfig]>[0][]) {
    const { initializeAuth } = await import('./AuthManager');
    return initializeAuth(configs as any);
  }
};

/**
 * Utility functions
 */
export const authUtils = {
  /**
   * Check if running in development mode
   */
  isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development' || 
           !!import.meta.env?.DEV || 
           window?.location?.hostname === 'localhost';
  },

  /**
   * Get environment variable with fallback
   */
  getEnvVar(key: string, fallback?: string): string | undefined {
    return import.meta.env?.[key] || 
           process.env[key] || 
           fallback;
  },

  /**
   * Parse URL search parameters (useful for OAuth callbacks)
   */
  parseUrlParams(url?: string): Record<string, string> {
    const searchParams = new URLSearchParams(url ? new URL(url).search : window.location.search);
    const params: Record<string, string> = {};
    
    for (const [key, value] of searchParams.entries()) {
      params[key] = value;
    }
    
    return params;
  },

  /**
   * Check if current URL is an auth callback
   */
  isAuthCallback(): boolean {
    return window.location.pathname.includes('/auth/callback') ||
           window.location.pathname.includes('/oauth/callback') ||
           window.location.search.includes('code=') ||
           window.location.search.includes('state=');
  },

  /**
   * Validate configuration before use
   */
  async validateConfig(config: any): Promise<{ isValid: boolean; errors: string[] }> {
    const { validateAuthConfig } = await import('./config');
    const errors = validateAuthConfig(config);
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};