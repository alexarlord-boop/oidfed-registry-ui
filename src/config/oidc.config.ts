/**
 * OIDC Configuration
 * Main configuration file for OAuth/OIDC providers
 */

import { keycloakConfig } from '../lib/providers/keycloak.config';
import { githubConfig } from '../lib/providers/github.config';
import { env } from '../lib/env';
import type { OIDCProviderConfig, ProviderId } from '../types/auth';

export type { ProviderId };

/**
 * All configured OIDC providers
 * MVP: Local auth + Keycloak SSO
 */
export const oidcProviders: Record<ProviderId, OIDCProviderConfig | null> = {
  local: null, // Local password auth doesn't use OIDC
  keycloak: keycloakConfig,
  github: githubConfig,
};

/**
 * Get enabled OIDC providers (excludes local auth)
 */
export const enabledOIDCProviders = Object.values(oidcProviders)
  .filter((config): config is OIDCProviderConfig => config !== null && config.enabled);

// Debug logging
console.log('[oidc.config] All providers:', oidcProviders);
console.log('[oidc.config] Enabled providers:', enabledOIDCProviders.map(p => ({ id: p.id, name: p.name, enabled: p.enabled })));

/**
 * Get provider configuration by ID
 */
export function getProviderConfig(providerId: ProviderId): OIDCProviderConfig | null {
  return oidcProviders[providerId];
}

/**
 * Check if local authentication is enabled
 */
export const isLocalAuthEnabled = env.LOCAL_AUTH_ENABLED;

/**
 * Check if any OIDC provider is enabled
 */
export const hasOIDCProviders = enabledOIDCProviders.length > 0;

/**
 * Default provider for automatic redirects
 */
export const defaultProvider: ProviderId = hasOIDCProviders ? 'keycloak' : 'local';
