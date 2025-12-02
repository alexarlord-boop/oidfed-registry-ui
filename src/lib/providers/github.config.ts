/**
 * GitHub OIDC Provider Configuration
 * Configuration for GitHub-based SSO authentication
 */

import type { OIDCProviderConfig } from '../../types/auth';
import { env } from '../env';

const getOrigin = () => typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

export const githubConfig: OIDCProviderConfig = {
  id: 'github',
  name: 'GitHub',
  
  // Auth Gateway handles OIDC flow - use provider-specific endpoint
  authority: `${env.AUTH_SERVICE_URL}/auth/oidc/github`,
  
  client_id: env.OIDC_CLIENT_ID,
  
  scope: 'openid profile email',
  
  response_type: 'code',
  
  redirect_uri: env.OIDC_REDIRECT_URI || `${getOrigin()}/auth/callback`,
  
  post_logout_redirect_uri: env.OIDC_POST_LOGOUT_REDIRECT_URI || `${getOrigin()}/login`,
  
  // GitHub branding
  logo: undefined, // Will use icon instead
  color: '#24292e',
  
  enabled: true,
};
