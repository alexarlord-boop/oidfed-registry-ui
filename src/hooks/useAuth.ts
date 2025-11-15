import { useState, useEffect, useCallback } from 'react';
import { getAuth, type AuthState, type LoginCredentials, type LoginResult, type AuthUser } from '@/lib/auth';

/**
 * Simple React hook for authentication
 * Clean integration with React components
 */
export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null
  });

  const auth = getAuth();

  // Load initial state
  useEffect(() => {
    let mounted = true;

    const loadAuthState = async () => {
      try {
        await auth.initialize();
        const state = await auth.getState();
        if (mounted) {
          setAuthState(state);
        }
      } catch (error) {
        if (mounted) {
          setAuthState({
            user: null,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Auth initialization failed'
          });
        }
      }
    };

    loadAuthState();

    return () => {
      mounted = false;
    };
  }, [auth]);

  // Login function
  const login = useCallback(async (credentials: LoginCredentials): Promise<LoginResult> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await auth.login(credentials);
      
      if (result.success) {
        const newState = await auth.getState();
        setAuthState(newState);
      } else {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Login failed'
        }));
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      return { success: false, error: errorMessage };
    }
  }, [auth]);

  // Logout function
  const logout = useCallback(async (): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      await auth.logout();
      setAuthState({
        user: null,
        isLoading: false,
        error: null
      });
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Logout failed'
      }));
    }
  }, [auth]);

  const isAuthenticated = !!authState.user;

  return {
    ...authState,
    isAuthenticated,
    login,
    logout
  };
}

/**
 * Hook to get current user
 */
export function useCurrentUser(): AuthUser | null {
  const { user } = useAuth();
  return user;
}

/**
 * Hook to check if user is authenticated
 */
export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}