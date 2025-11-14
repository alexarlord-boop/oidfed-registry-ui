import type { AuthConfig, BasicAuthConfig, OAuthConfig, DevAuthConfig } from './types';

/**
 * Authentication configuration defaults and utilities
 */

// Default configurations for different deployment scenarios
export const DEFAULT_AUTH_CONFIGS = {
  /**
   * Development configuration - for local development only
   */
  development: (): DevAuthConfig => ({
    type: 'dev',
    name: 'Development Authentication',
    enabled: true,
    settings: {
      defaultUsername: 'admin',
      defaultPassword: 'admin',
      generateDummyTokens: true,
      allowAnyCredentials: true
    }
  }),

  /**
   * Basic authentication configuration template
   */
  basicAuth: (baseUrl: string = ''): BasicAuthConfig => ({
    type: 'basic',
    name: 'Basic Authentication',
    enabled: true,
    settings: {
      loginEndpoint: `${baseUrl}/api/auth/login`,
      logoutEndpoint: `${baseUrl}/api/auth/logout`,
      validateEndpoint: `${baseUrl}/api/auth/validate`,
      allowCredentialStorage: true
    }
  }),

  /**
   * OAuth 2.0 configuration template
   */
  oauth: (clientId: string, baseUrl: string = ''): OAuthConfig => ({
    type: 'oauth',
    name: 'OAuth 2.0 Authentication',
    enabled: true,
    settings: {
      clientId,
      authorizationEndpoint: `${baseUrl}/oauth/authorize`,
      tokenEndpoint: `${baseUrl}/oauth/token`,
      redirectUri: `${window?.location?.origin || 'http://localhost:3000'}/auth/callback`,
      scopes: ['openid', 'profile', 'admin'],
      userinfoEndpoint: `${baseUrl}/oauth/userinfo`,
      additionalParams: {}
    }
  }),

  /**
   * OIDC configuration template  
   */
  oidc: (clientId: string, baseUrl: string = ''): OAuthConfig => ({
    type: 'oidc',
    name: 'OpenID Connect Authentication',
    enabled: true,
    settings: {
      clientId,
      authorizationEndpoint: `${baseUrl}/.well-known/openid_configuration`,
      tokenEndpoint: `${baseUrl}/token`,
      redirectUri: `${window?.location?.origin || 'http://localhost:3000'}/auth/callback`,
      scopes: ['openid', 'profile', 'email'],
      userinfoEndpoint: `${baseUrl}/userinfo`,
      additionalParams: {}
    }
  })
};

/**
 * Environment-based configuration loader
 */
export class AuthConfigLoader {
  /**
   * Load authentication configuration from environment variables
   */
  static loadFromEnvironment(): AuthConfig[] {
    const configs: AuthConfig[] = [];

    // Check for development mode
    if (process.env.NODE_ENV === 'development' || 
        import.meta.env?.DEV || 
        window?.location?.hostname === 'localhost') {
      configs.push(DEFAULT_AUTH_CONFIGS.development());
    }

    // Check for basic auth configuration
    const basicAuthEndpoint = import.meta.env?.VITE_AUTH_BASIC_ENDPOINT || 
                              process.env.VITE_AUTH_BASIC_ENDPOINT;
    if (basicAuthEndpoint) {
      const baseUrl = new URL(basicAuthEndpoint).origin;
      configs.push(DEFAULT_AUTH_CONFIGS.basicAuth(baseUrl));
    }

    // Check for OAuth configuration
    const oauthClientId = import.meta.env?.VITE_AUTH_OAUTH_CLIENT_ID || 
                          process.env.VITE_AUTH_OAUTH_CLIENT_ID;
    const oauthBaseUrl = import.meta.env?.VITE_AUTH_OAUTH_BASE_URL || 
                         process.env.VITE_AUTH_OAUTH_BASE_URL;
    if (oauthClientId && oauthBaseUrl) {
      configs.push(DEFAULT_AUTH_CONFIGS.oauth(oauthClientId, oauthBaseUrl));
    }

    // Check for OIDC configuration
    const oidcClientId = import.meta.env?.VITE_AUTH_OIDC_CLIENT_ID || 
                         process.env.VITE_AUTH_OIDC_CLIENT_ID;
    const oidcBaseUrl = import.meta.env?.VITE_AUTH_OIDC_BASE_URL || 
                        process.env.VITE_AUTH_OIDC_BASE_URL;
    if (oidcClientId && oidcBaseUrl) {
      configs.push(DEFAULT_AUTH_CONFIGS.oidc(oidcClientId, oidcBaseUrl));
    }

    // Fallback to development if no configuration found
    if (configs.length === 0) {
      console.warn('No authentication configuration found, falling back to development mode');
      configs.push(DEFAULT_AUTH_CONFIGS.development());
    }

    return configs;
  }

  /**
   * Load authentication configuration from a configuration object
   */
  static loadFromConfig(config: Partial<AuthConfigOptions>): AuthConfig[] {
    const configs: AuthConfig[] = [];

    if (config.development?.enabled) {
      configs.push({
        ...DEFAULT_AUTH_CONFIGS.development(),
        ...config.development
      });
    }

    if (config.basicAuth?.enabled) {
      configs.push({
        ...DEFAULT_AUTH_CONFIGS.basicAuth(config.basicAuth.baseUrl || ''),
        ...config.basicAuth
      });
    }

    if (config.oauth?.enabled && config.oauth.clientId) {
      configs.push({
        ...DEFAULT_AUTH_CONFIGS.oauth(config.oauth.clientId, config.oauth.baseUrl || ''),
        ...config.oauth
      });
    }

    if (config.oidc?.enabled && config.oidc.clientId) {
      configs.push({
        ...DEFAULT_AUTH_CONFIGS.oidc(config.oidc.clientId, config.oidc.baseUrl || ''),
        ...config.oidc
      });
    }

    return configs;
  }

  /**
   * Load configuration with auto-detection
   */
  static loadAutoDetect(): AuthConfig[] {
    // Try environment variables first
    const envConfigs = this.loadFromEnvironment();
    
    // TODO: Could also check for configuration files, API endpoints, etc.
    
    return envConfigs;
  }
}

/**
 * Configuration options interface for easier setup
 */
export interface AuthConfigOptions {
  development?: Partial<DevAuthConfig> & { enabled?: boolean };
  basicAuth?: Partial<BasicAuthConfig> & { 
    enabled?: boolean; 
    baseUrl?: string; 
  };
  oauth?: Partial<OAuthConfig> & { 
    enabled?: boolean; 
    clientId?: string;
    baseUrl?: string; 
  };
  oidc?: Partial<OAuthConfig> & { 
    enabled?: boolean; 
    clientId?: string;
    baseUrl?: string; 
  };
}

/**
 * Deployment-specific configuration presets
 */
export const DEPLOYMENT_PRESETS = {
  /**
   * Development preset - only dev auth enabled
   */
  development: (): AuthConfig[] => [
    DEFAULT_AUTH_CONFIGS.development()
  ],

  /**
   * Production with basic auth
   */
  productionBasicAuth: (apiBaseUrl: string): AuthConfig[] => [
    DEFAULT_AUTH_CONFIGS.basicAuth(apiBaseUrl)
  ],

  /**
   * Production with OAuth
   */
  productionOAuth: (clientId: string, oauthBaseUrl: string): AuthConfig[] => [
    DEFAULT_AUTH_CONFIGS.oauth(clientId, oauthBaseUrl)
  ],

  /**
   * Production with OIDC
   */
  productionOIDC: (clientId: string, oidcBaseUrl: string): AuthConfig[] => [
    DEFAULT_AUTH_CONFIGS.oidc(clientId, oidcBaseUrl)
  ],

  /**
   * Hybrid setup - multiple auth methods available
   */
  hybrid: (options: {
    devMode?: boolean;
    basicAuth?: { baseUrl: string };
    oauth?: { clientId: string; baseUrl: string };
    oidc?: { clientId: string; baseUrl: string };
  }): AuthConfig[] => {
    const configs: AuthConfig[] = [];

    if (options.devMode) {
      configs.push(DEFAULT_AUTH_CONFIGS.development());
    }

    if (options.basicAuth) {
      configs.push(DEFAULT_AUTH_CONFIGS.basicAuth(options.basicAuth.baseUrl));
    }

    if (options.oauth) {
      configs.push(DEFAULT_AUTH_CONFIGS.oauth(options.oauth.clientId, options.oauth.baseUrl));
    }

    if (options.oidc) {
      configs.push(DEFAULT_AUTH_CONFIGS.oidc(options.oidc.clientId, options.oidc.baseUrl));
    }

    return configs;
  }
};

/**
 * Validate authentication configuration
 */
export function validateAuthConfig(config: AuthConfig): string[] {
  const errors: string[] = [];

  if (!config.type) {
    errors.push('Authentication type is required');
  }

  if (!config.name) {
    errors.push('Authentication name is required');
  }

  switch (config.type) {
    case 'basic':
      const basicConfig = config as BasicAuthConfig;
      if (!basicConfig.settings.loginEndpoint) {
        errors.push('Basic auth requires loginEndpoint');
      }
      break;

    case 'oauth':
    case 'oidc':
      const oauthConfig = config as OAuthConfig;
      if (!oauthConfig.settings.clientId) {
        errors.push('OAuth/OIDC requires clientId');
      }
      if (!oauthConfig.settings.authorizationEndpoint) {
        errors.push('OAuth/OIDC requires authorizationEndpoint');
      }
      if (!oauthConfig.settings.tokenEndpoint) {
        errors.push('OAuth/OIDC requires tokenEndpoint');
      }
      if (!oauthConfig.settings.redirectUri) {
        errors.push('OAuth/OIDC requires redirectUri');
      }
      break;

    case 'dev':
      // Dev config is always valid
      break;

    default:
      errors.push(`Unknown authentication type: ${(config as any).type}`);
  }

  return errors;
}