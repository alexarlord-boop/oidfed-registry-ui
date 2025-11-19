/**
 * PKCE (Proof Key for Code Exchange) Utilities
 * Implements RFC 7636 for securing OAuth authorization code flow in public clients
 */

import type { PKCEPair } from '../types/auth';

/**
 * Generate a cryptographically random string for use as code_verifier
 * Must be 43-128 characters, using unreserved characters [A-Z, a-z, 0-9, -, ., _, ~]
 */
export function generateCodeVerifier(): string {
  const array = new Uint8Array(32); // 32 bytes = 256 bits
  crypto.getRandomValues(array);
  
  // Base64url encode (URL-safe base64 without padding)
  return base64UrlEncode(array);
}

/**
 * Generate code_challenge from code_verifier using S256 method (SHA-256)
 * code_challenge = BASE64URL(SHA256(ASCII(code_verifier)))
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  // Convert verifier string to Uint8Array
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  
  // Hash with SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  
  // Base64url encode
  return base64UrlEncode(hashArray);
}

/**
 * Generate both code_verifier and code_challenge
 * Returns a complete PKCE pair ready for OAuth flow
 */
export async function generatePKCEPair(): Promise<PKCEPair> {
  const code_verifier = generateCodeVerifier();
  const code_challenge = await generateCodeChallenge(code_verifier);
  
  return {
    code_verifier,
    code_challenge,
    code_challenge_method: 'S256'
  };
}

/**
 * Base64url encode a Uint8Array
 * URL-safe base64 encoding without padding (RFC 4648 Section 5)
 */
function base64UrlEncode(array: Uint8Array): string {
  // Convert array to binary string
  let binary = '';
  for (let i = 0; i < array.length; i++) {
    const byte = array[i];
    if (byte !== undefined) {
      binary += String.fromCharCode(byte);
    }
  }
  
  // Base64 encode
  let base64 = btoa(binary);
  
  // Make URL-safe: replace +/= with -_
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Generate a random state parameter for CSRF protection
 * Should be unique per authorization request
 */
export function generateState(): string {
  const array = new Uint8Array(16); // 16 bytes = 128 bits
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

/**
 * Generate a random nonce for ID token validation
 * Binds the ID token to the client session
 */
export function generateNonce(): string {
  const array = new Uint8Array(16); // 16 bytes = 128 bits
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

/**
 * Verify that a code_challenge matches a code_verifier
 * Used for testing/validation purposes
 */
export async function verifyPKCE(verifier: string, challenge: string): Promise<boolean> {
  const computedChallenge = await generateCodeChallenge(verifier);
  return computedChallenge === challenge;
}
