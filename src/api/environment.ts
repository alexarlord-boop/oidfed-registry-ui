/**
 * API environment setup - configures the generated API client without modifying generated files
 * Handles Auth Gateway URL configuration and base URL override
 */

import { env } from '../lib/env';

// Environment configuration
export const AUTH_GATEWAY_URL = env.AUTH_GATEWAY_URL;
export const API_BASE_URL = env.API_BASE_URL;

// Store the original fetch function
let originalFetch: typeof window.fetch | undefined;

/**
 * Simple fetch interceptor that handles base URL override
 */
function createApiInterceptor() {
  return async function interceptedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const request = new Request(input, init);
    let url = request.url;
    
    // Override base URL to point to configured API or mock server
    const originalBaseUrl = 'http://localhost:8765';
    
    if (url.startsWith(originalBaseUrl)) {
      url = url.replace(originalBaseUrl, API_BASE_URL);
      console.debug('[API]', request.method, 'redirected to:', url);
    }
    
    // Make the actual request with the modified URL
    return originalFetch!(url, init);
  };
}

/**
 * Set up the API environment - automatically called when this module is imported
 */
if (typeof window !== 'undefined' && window.fetch) {
  // Store original fetch if not already stored
  if (!originalFetch) {
    originalFetch = window.fetch;
    // Install our interceptor
    window.fetch = createApiInterceptor() as typeof fetch;
    console.debug('[API] Environment configured - Auth Gateway:', AUTH_GATEWAY_URL, 'API Base:', API_BASE_URL);
  }
}