/**
 * API environment setup - configures the generated API client without modifying generated files
 * Simple base URL override to point to mock server
 */

// Store the original fetch function
let originalFetch: typeof window.fetch | undefined;

/**
 * Simple fetch interceptor that only handles base URL override
 */
function createApiInterceptor() {
  return async function interceptedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const request = new Request(input, init);
    let url = request.url;
    
    // Override base URL to point to mock server
    const originalBaseUrl = 'http://localhost:8765';
    const mockBaseUrl = 'http://127.0.0.1:4010';
    
    if (url.startsWith(originalBaseUrl)) {
      url = url.replace(originalBaseUrl, mockBaseUrl);
      console.debug('[API]', request.method, 'redirected to mock:', url);
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
    console.debug('[API] Environment configured to use mock server at http://127.0.0.1:4010');
  }
}