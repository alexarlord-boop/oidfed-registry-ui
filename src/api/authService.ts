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
 * Make authenticated request to auth service
 */
async function authFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${AUTH_SERVICE_URL}${path}`, {
    ...options,
    headers,
  });

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
