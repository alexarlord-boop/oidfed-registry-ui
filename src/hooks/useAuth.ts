import { useEffect, useCallback } from 'react';
import { getAuth, ensureAuthInitialized, type LoginCredentials, type LoginResult, type AuthUser } from '@/lib/auth';
import { useAppState } from './store';

/**
 * Authentication hook using Zustand for state management
 * Automatically reactive - updates when auth state changes (e.g., after token refresh)
 */
export function useAuth() {
  // Get auth state from Zustand store
  const user = useAppState((state) => state.user);
  const isLoading = useAppState((state) => state.isAuthLoading);
  const error = useAppState((state) => state.authError);

  const auth = getAuth();

  // Initialize auth on mount
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        await ensureAuthInitialized();
        
        // State is already synced to Zustand by UnifiedAuth
        // No need to manually set it here
      } catch (error) {
        if (mounted) {
          const { setAuthState } = useAppState.getState();
          setAuthState({
            user: null,
            isAuthLoading: false,
            authError: error instanceof Error ? error.message : 'Auth initialization failed'
          });
        }
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  // Login function
  const login = useCallback(async (credentials: LoginCredentials): Promise<LoginResult> => {
    const { setAuthState } = useAppState.getState();
    setAuthState({ isAuthLoading: true, authError: null });

    const result = await auth.login(credentials);
    
    // State is synced automatically by UnifiedAuth.updateState()
    
    return result;
  }, [auth]);

  // Logout function
  const logout = useCallback(async (): Promise<void> => {
    const { setAuthState } = useAppState.getState();
    setAuthState({ isAuthLoading: true });

    await auth.logout();
    
    // State is synced automatically by UnifiedAuth.updateState()
  }, [auth]);

  const isAuthenticated = !!user;

  return {
    user,
    isLoading,
    error,
    isAuthenticated,
    login,
    logout
  };
}

/**
 * Hook to get current user
 */
export function useCurrentUser(): AuthUser | null {
  return useAppState((state) => state.user);
}

/**
 * Hook to check if user is authenticated
 */
export function useIsAuthenticated(): boolean {
  const user = useAppState((state) => state.user);
  return !!user;
}

/**
 * Hook to get auth loading state
 */
export function useAuthLoading(): boolean {
  return useAppState((state) => state.isAuthLoading);
}