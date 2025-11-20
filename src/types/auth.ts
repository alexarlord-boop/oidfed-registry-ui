/**
 * Authentication Types
 * Type definitions for OIDC, JWT tokens, and user profiles
 */

// User Role Enumeration
export enum UserRole {
  ADMIN = 'admin',
  TECHNICAL_CONTACT = 'technical_contact',
  PENDING = 'pending',
}

// Role checking utilities
export function hasRole(user: { role?: UserRole | string } | null, role: UserRole): boolean {
  if (!user || !user.role) return false;
  return user.role === role || user.role === role.valueOf();
}

export function isAdmin(user: { role?: UserRole | string } | null): boolean {
  return hasRole(user, UserRole.ADMIN);
}

export function isTechnicalContact(user: { role?: UserRole | string } | null): boolean {
  return hasRole(user, UserRole.TECHNICAL_CONTACT);
}

export function isPending(user: { role?: UserRole | string } | null): boolean {
  return hasRole(user, UserRole.PENDING);
}

export function canManageUsers(user: { role?: UserRole | string } | null): boolean {
  return isAdmin(user);
}

export function canManageEntities(user: { role?: UserRole | string } | null): boolean {
  return isAdmin(user) || isTechnicalContact(user);
}

// OIDC Provider Configuration
export type ProviderId = 'local' | 'keycloak' | 'github';

export interface OIDCProviderConfig {
  id: ProviderId;
  name: string;
  authority: string;
  client_id: string;
  scope: string;
  response_type: 'code';
  redirect_uri: string;
  post_logout_redirect_uri: string;
  logo?: string;
  color?: string;
  enabled: boolean;
}

// Token Types
export interface TokenSet {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  expires_in: number;
  expires_at: number; // Timestamp when token expires
  token_type: 'Bearer';
  scope?: string;
}

export interface TokenRefreshRequest {
  refresh_token: string;
  client_id: string;
  grant_type: 'refresh_token';
}

// OIDC User Info (from /userinfo endpoint or ID token)
export interface OIDCUserInfo {
  sub: string; // Subject identifier (unique user ID)
  email: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  preferred_username?: string;
  picture?: string;
  role?: string; // User role from auth-gateway
  roles?: string[];
  groups?: string[];
  org_id?: string;
  
  // Additional claims
  [key: string]: unknown;
}

// PKCE (Proof Key for Code Exchange) Types
export interface PKCEPair {
  code_verifier: string;
  code_challenge: string;
  code_challenge_method: 'S256';
}

// Authorization Request State
export interface AuthorizationState {
  state: string; // Random state for CSRF protection
  code_verifier: string; // PKCE code verifier
  redirect_to?: string; // Original URL to redirect after login
  provider: ProviderId;
}

// OAuth Authorization Request Parameters
export interface AuthorizationParams {
  response_type: 'code';
  client_id: string;
  redirect_uri: string;
  scope: string;
  state: string;
  code_challenge: string;
  code_challenge_method: 'S256';
  nonce?: string;
}

// Token Exchange Request
export interface TokenExchangeRequest {
  grant_type: 'authorization_code';
  code: string;
  redirect_uri: string;
  client_id: string;
  code_verifier: string;
}

// Session Information
export interface SessionInfo {
  created_at: number;
  expires_at: number;
  last_activity: number;
  refresh_token_expires_at?: number;
  provider: ProviderId;
}

// Token Storage Interface
export interface TokenStorage {
  getTokens(): Promise<TokenSet | null>;
  setTokens(tokens: TokenSet): Promise<void>;
  clearTokens(): Promise<void>;
  getAuthState(): Promise<AuthorizationState | null>;
  setAuthState(state: AuthorizationState): Promise<void>;
  clearAuthState(): Promise<void>;
}

// Auth Gateway API Responses
export interface AuthGatewayTokenResponse {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  expires_in: number;
  token_type: 'Bearer';
  scope?: string;
}

export interface AuthGatewayUserInfoResponse {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  preferred_username?: string;
  picture?: string;
  roles: string[];
  org_id?: string;
}

export interface AuthGatewayErrorResponse {
  error: string;
  error_description?: string;
  error_uri?: string;
}

// Local Login Types (for password-based auth)
export interface LocalLoginRequest {
  username: string;
  password: string;
}

export interface LocalLoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: 'Bearer';
}

// User Registration Types
export interface UserRegistrationRequest {
  username: string;
  email: string;
  password: string;
  organization?: string;
}

export interface UserRegistrationResponse {
  user_id: string;
  email: string;
  username: string;
  status: 'pending_approval' | 'active';
  message?: string;
}
