/**
 * API environment setup - configures the generated API client without modifying generated files
 * Handles Auth Gateway URL configuration and base URL override
 */

import { env } from '../lib/env';

// Environment configuration
export const AUTH_GATEWAY_URL = env.AUTH_GATEWAY_URL;
export const API_BASE_URL = env.API_BASE_URL;

// No interceptor needed - apiFetcher.ts uses API_BASE_URL directly