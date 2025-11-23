/**
 * Keycloak OIDC Provider Configuration
 * Configuration for Keycloak-based SSO authentication
 */

import type { OIDCProviderConfig } from '../../types/auth';
import { env } from '../env';

const getOrigin = () => typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

export const keycloakConfig: OIDCProviderConfig = {
  id: 'keycloak',
  name: 'SSO Login',
  
  // Auth Gateway handles OIDC flow - use provider-specific endpoint
  authority: `${env.AUTH_SERVICE_URL}/auth/oidc/keycloak`,
  
  client_id: env.OIDC_CLIENT_ID,
  
  scope: env.OIDC_SCOPE,
  
  response_type: 'code',
  
  redirect_uri: env.OIDC_REDIRECT_URI || `${getOrigin()}/auth/callback`,
  
  post_logout_redirect_uri: env.OIDC_POST_LOGOUT_REDIRECT_URI || `${getOrigin()}/login`,
  
  logo: '/logos/sso.svg',
  color: '#00A9E0',
  
  enabled: true,
};
