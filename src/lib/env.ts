/**
 * Environment Variable Utilities
 * Safely access environment variables with fallbacks
 */

/**
 * Get environment variable value
 * Works with both Vite (import.meta.env) and runtime environments
 */
export function getEnv(key: string, fallback: string = ''): string {
  // Check if import.meta.env is available (Vite/build time)
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  
  // Fallback to default value
  return fallback;
}

/**
 * Get boolean environment variable
 */
export function getEnvBoolean(key: string, fallback: boolean = false): boolean {
  const value = getEnv(key, String(fallback));
  return value !== 'false' && value !== '0';
}

/**
 * Environment configuration
 */
export const env = {
  // Auth Gateway
  AUTH_GATEWAY_URL: getEnv('VITE_AUTH_GATEWAY_URL', 'http://localhost:9000'),
  
  // API
  API_BASE_URL: getEnv('VITE_API_BASE_URL', 'http://localhost:9000/api'),
  
  // Local Authentication
  LOCAL_AUTH_ENABLED: getEnvBoolean('VITE_LOCAL_AUTH_ENABLED', true),
  
  // OIDC Configuration
  OIDC_CLIENT_ID: getEnv('VITE_OIDC_CLIENT_ID', 'oidfed-registry-ui'),
  OIDC_SCOPE: getEnv('VITE_OIDC_SCOPE', 'openid profile email roles'),
  OIDC_REDIRECT_URI: getEnv('VITE_OIDC_REDIRECT_URI', ''),
  OIDC_POST_LOGOUT_REDIRECT_URI: getEnv('VITE_OIDC_POST_LOGOUT_REDIRECT_URI', ''),
  
  // Keycloak
  KEYCLOAK_ENABLED: getEnvBoolean('VITE_KEYCLOAK_ENABLED', true),
};
