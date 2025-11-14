import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeAuth, setupAuth, authUtils } from '../index';
import type { AuthManager } from '../AuthManager';

interface AuthProviderProps {
  children: React.ReactNode;
  /** Custom auth configuration */
  config?: 'auto' | 'development' | 'basic' | 'oauth' | 'oidc';
  /** Options for the selected config */
  options?: any;
}

interface AuthContextType {
  authManager: AuthManager | null;
  isInitialized: boolean;
  initializationError: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Auth Provider Component
 * Sets up and provides the authentication system to the app
 */
export function AuthProvider({ children, config = 'auto', options }: AuthProviderProps) {
  const [authManager, setAuthManager] = useState<AuthManager | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        let manager: AuthManager;

        switch (config) {
          case 'development':
            manager = await setupAuth.development(options);
            break;
          case 'basic':
            manager = await setupAuth.basicAuth(options?.baseUrl || '', options);
            break;
          case 'oauth':
            manager = await setupAuth.oauth(options);
            break;
          case 'oidc':
            manager = await setupAuth.oidc(options);
            break;
          case 'auto':
          default:
            manager = await setupAuth.autoDetect();
            break;
        }

        if (mounted) {
          setAuthManager(manager);
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Failed to initialize authentication:', error);
        if (mounted) {
          setInitializationError(
            error instanceof Error ? error.message : 'Authentication initialization failed'
          );
          setIsInitialized(true);
        }
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, [config, options]);

  const contextValue: AuthContextType = {
    authManager,
    isInitialized,
    initializationError
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access the auth context
 */
export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

/**
 * Updated API fetcher integration
 * This replaces the manual token management in the current apiFetcher
 */
export async function getAuthenticatedHeaders(): Promise<HeadersInit> {
  try {
    const authHeader = await import('../index').then(m => m.auth.getAuthHeader());
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (authHeader) {
      (headers as Record<string, string>)['Authorization'] = authHeader;
    }

    return headers;
  } catch (error) {
    console.warn('Failed to get auth headers:', error);
    return {
      'Content-Type': 'application/json',
    };
  }
}

/**
 * Enhanced fetch wrapper that automatically includes auth headers
 */
export async function authenticatedFetch(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  const authHeaders = await getAuthenticatedHeaders();
  
  const enhancedOptions: RequestInit = {
    ...options,
    headers: {
      ...authHeaders,
      ...options.headers,
    },
  };

  return fetch(url, enhancedOptions);
}

/**
 * Migration helper for backwards compatibility with existing devAuth functions
 */
export const legacyAuth = {
  /**
   * Check if authenticated (backwards compatible)
   */
  isAuthenticated: async (): Promise<boolean> => {
    try {
      const { auth } = await import('../index');
      return auth.isAuthenticated();
    } catch {
      return false;
    }
  },

  /**
   * Get dev auth data (backwards compatible)
   */
  getDevAuth: (): { token: string | null; account: string | null } => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return {
          token: window.localStorage.getItem('API_BEARER'),
          account: window.localStorage.getItem('API_ACCOUNT_USERNAME'),
        };
      }
    } catch (e) {
      // ignore
    }
    return { token: null, account: null };
  },

  /**
   * Set dev auth (backwards compatible)
   */
  setDevAuth: (token: string | null, account: string | null): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        if (token) {
          window.localStorage.setItem('API_BEARER', token);
        } else {
          window.localStorage.removeItem('API_BEARER');
        }
        
        if (account) {
          window.localStorage.setItem('API_ACCOUNT_USERNAME', account);
        } else {
          window.localStorage.removeItem('API_ACCOUNT_USERNAME');
        }
        
        window.localStorage.setItem('API_DEV_LAST_UPDATE', String(Date.now()));
      }
    } catch (e) {
      // ignore
    }
  },

  /**
   * Make dummy JWT (backwards compatible)
   */
  makeDummyJwt: (account: string): string => {
    const header = { alg: 'none', typ: 'JWT' };
    const payload = { sub: account, iat: Math.floor(Date.now() / 1000) };
    
    const encode = (obj: unknown) => {
      const str = JSON.stringify(obj);
      if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
        return window.btoa(unescape(encodeURIComponent(str)))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
      }
      
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const buf = require('buffer').Buffer.from(str);
        return buf.toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
      } catch (e) {
        return '';
      }
    };
    
    return `${encode(header)}.${encode(payload)}.`;
  }
};

export default AuthProvider;