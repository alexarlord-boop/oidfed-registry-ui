/**
 * Auth Service API Client
 * Handles authentication, user management, and admin operations
 */

import { env } from '../lib/env';

const AUTH_SERVICE_URL = env.AUTH_SERVICE_URL;

/**
 * User types matching backend schemas
 */
export enum UserRole {
  ADMIN = 'admin',
  TECHNICAL_CONTACT = 'technical_contact',
}

export interface User {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  organization?: string;
  role: UserRole;
  roles: string[];  // Legacy
  is_active: boolean;
  is_superuser: boolean;
  is_approved: boolean;
  oidc_provider?: string;
  created_at?: string;
  last_login?: string;
}

export interface UserCreate {
  username: string;
  email: string;
  password?: string;
  full_name?: string;
  organization?: string;
  role?: UserRole;
  is_approved?: boolean;
}

export interface UserUpdate {
  email?: string;
  full_name?: string;
  organization?: string;
  password?: string;
  role?: UserRole;
  is_active?: boolean;
  is_approved?: boolean;
}

/**
 * Get auth token from storage
 */
function getAuthToken(): string | null {
  return sessionStorage.getItem('auth_access_token');
}

/**
 * Make authenticated request to auth service with automatic token refresh
 */
async function authFetch<T>(
  path: string,
  options: RequestInit = {},
  retryCount: number = 0
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${AUTH_SERVICE_URL}${path}`, {
    ...options,
    headers,
  });

  // If we get a 401 and haven't retried yet, try to refresh the token
  if (response.status === 401 && retryCount === 0) {
    const refreshToken = sessionStorage.getItem('auth_refresh_token');
    console.log('[authFetch] Got 401, checking refresh token:', {
      hasRefreshToken: !!refreshToken,
      refreshTokenLength: refreshToken?.length || 0
    });
    
    if (refreshToken) {
      console.log('[authFetch] Attempting token refresh...');
      const refreshed = await attemptTokenRefresh(refreshToken);
      if (refreshed) {
        console.log('[authFetch] Token refresh successful, retrying request...');
        // Retry the request with the new token
        return authFetch<T>(path, options, retryCount + 1);
      } else {
        console.error('[authFetch] Token refresh failed');
      }
    } else {
      console.error('[authFetch] No refresh token found in sessionStorage');
    }
    // If refresh failed or no refresh token, throw auth error
    console.error('[authFetch] Token refresh failed or no refresh token available');
    throw new Error('Not authenticated');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

/**
 * Attempt to refresh the access token
 */
async function attemptTokenRefresh(refreshToken: string): Promise<boolean> {
  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      console.error('[attemptTokenRefresh] Refresh failed:', response.status);
      return false;
    }

    const tokenData = await response.json();
    const { access_token, refresh_token: new_refresh_token } = tokenData;

    if (!access_token) {
      return false;
    }

    // Update stored tokens
    sessionStorage.setItem('auth_access_token', access_token);
    if (new_refresh_token) {
      sessionStorage.setItem('auth_refresh_token', new_refresh_token);
    }

    // Parse and update user info from new token
    const payload = parseJWT(access_token);
    if (payload) {
      const user = {
        id: payload.sub,
        username: payload.preferred_username,
        email: payload.email,
        role: payload.role,
        roles: payload.roles || []
      };
      sessionStorage.setItem('auth_user', JSON.stringify(user));
      console.log('[attemptTokenRefresh] User info updated from refreshed token:', user.role);
    }

    return true;
  } catch (error) {
    console.error('[attemptTokenRefresh] Error during token refresh:', error);
    return false;
  }
}

/**
 * Parse JWT token payload
 */
function parseJWT(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const base64Url = parts[1];
    if (!base64Url) return null;
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

/**
 * Public API - No authentication required
 */
export const authServicePublic = {
  /**
   * Register new user account (self-registration)
   */
  async register(userData: UserCreate): Promise<User> {
    return authFetch<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
};

/**
 * Admin API - Requires admin authentication
 */
export const authServiceAdmin = {
  /**
   * List all users
   */
  async listUsers(skip: number = 0, limit: number = 100): Promise<User[]> {
    return authFetch<User[]>(`/admin/users?skip=${skip}&limit=${limit}`);
  },

  /**
   * List pending users awaiting approval
   */
  async listPendingUsers(skip: number = 0, limit: number = 100): Promise<User[]> {
    return authFetch<User[]>(`/admin/users/pending?skip=${skip}&limit=${limit}`);
  },

  /**
   * Get user by ID
   */
  async getUser(userId: string): Promise<User> {
    return authFetch<User>(`/admin/users/${userId}`);
  },

  /**
   * Create new user (admin-initiated, can be pre-approved)
   */
  async createUser(userData: UserCreate): Promise<User> {
    return authFetch<User>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  /**
   * Update user
   */
  async updateUser(userId: string, userData: UserUpdate): Promise<User> {
    return authFetch<User>(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<void> {
    return authFetch<void>(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Approve pending user
   */
  async approveUser(userId: string): Promise<User> {
    return authFetch<User>(`/admin/users/${userId}/approve`, {
      method: 'POST',
    });
  },

  /**
   * Reject pending user (deletes the user)
   */
  async rejectUser(userId: string): Promise<void> {
    return authFetch<void>(`/admin/users/${userId}/reject`, {
      method: 'POST',
    });
  },
};

/**
 * Combined export
 */
export const authService = {
  ...authServicePublic,
  admin: authServiceAdmin,
};
