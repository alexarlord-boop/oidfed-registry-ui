/**
 * Environment Variable Utilities
 * Safely access environment variables with fallbacks
 */

/**
 * Get environment variable value
 * Works with Bun (Bun.env), Node (process.env), and Vite (import.meta.env)
 */
export function getEnv(key: string, fallback: string = ''): string {
  // Check Bun.env (Bun runtime) - FIRST priority
  if (typeof Bun !== 'undefined' && Bun.env?.[key]) {
    return Bun.env[key];
  }
  
  // Check process.env (Node/Bun)
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key];
  }
  
  // Check import.meta.env (Vite/build time)
  if (typeof import.meta !== 'undefined' && import.meta.env?.[key]) {
    return import.meta.env[key];
  }
  
  // Fallback to default value
  return fallback;
}

/**
 * Get boolean environment variable
 */
export function getEnvBoolean(key: string, fallback: boolean = false): boolean {
  const value = getEnv(key, '');
  if (value === '') return fallback;
  return value === 'true' || value === '1';
}

/**
 * Environment configuration
 */
export const env = {
  // Auth Gateway
  AUTH_GATEWAY_URL: getEnv('AUTH_GATEWAY_URL', 'http://localhost:9000'),
  
  // API - Gateway handles /api prefix, so base URL should not include it
  API_BASE_URL: getEnv('API_BASE_URL', 'http://localhost:9000'),
  
  // Local Authentication
  LOCAL_AUTH_ENABLED: getEnvBoolean('LOCAL_AUTH_ENABLED', true),
  
  // OIDC Configuration
  OIDC_CLIENT_ID: getEnv('OIDC_CLIENT_ID', 'oidfed-registry-ui'),
  OIDC_SCOPE: getEnv('OIDC_SCOPE', 'openid profile email roles'),
  OIDC_REDIRECT_URI: getEnv('OIDC_REDIRECT_URI', ''),
  OIDC_POST_LOGOUT_REDIRECT_URI: getEnv('OIDC_POST_LOGOUT_REDIRECT_URI', ''),
  
  // Keycloak
  KEYCLOAK_ENABLED: getEnvBoolean('KEYCLOAK_ENABLED', true),
  
  // GitHub
  GITHUB_ENABLED: getEnvBoolean('GITHUB_ENABLED', false),
};

// Debug: log environment configuration on module load
console.log('[env] Environment configuration loaded:', {
  AUTH_GATEWAY_URL: env.AUTH_GATEWAY_URL,
  API_BASE_URL: env.API_BASE_URL,
  LOCAL_AUTH_ENABLED: env.LOCAL_AUTH_ENABLED,
  KEYCLOAK_ENABLED: env.KEYCLOAK_ENABLED,
  GITHUB_ENABLED: env.GITHUB_ENABLED,
});
