import { useState, useEffect, useCallback } from 'react';
import { getAuthManager, auth } from '../index';
import type { AuthState, AuthUser, LoginCredentials, LoginResult, LogoutResult } from '../types';

/**
 * Main authentication hook
 * Provides access to authentication state and methods
 */
export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    error: null
  });

  const [isInitialized, setIsInitialized] = useState(false);

  // Update auth state
  const updateAuthState = useCallback(async () => {
    try {
      const state = await auth.getState();
      setAuthState(state);
    } catch (error) {
      console.error('Error getting auth state:', error);
      setAuthState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false
      }));
    }
  }, []);

  // Initialize and set up event listeners
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Initial state load
        await updateAuthState();
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setAuthState(prev => ({
            ...prev,
            error: 'Failed to initialize authentication',
            isLoading: false
          }));
        }
      }
    };

    initializeAuth();

    // Set up event listeners
    const handleAuthStateChange = ({ state }: { state: AuthState }) => {
      if (mounted) {
        setAuthState(state);
      }
    };

    const handleAuthError = ({ error }: { error: string }) => {
      if (mounted) {
        setAuthState(prev => ({
          ...prev,
          error,
          isLoading: false
        }));
      }
    };

    const handleLogin = () => {
      if (mounted) {
        updateAuthState();
      }
    };

    const handleLogout = () => {
      if (mounted) {
        setAuthState({
          user: null,
          token: null,
          isLoading: false,
          error: null
        });
      }
    };

    auth.on('auth:state-change', handleAuthStateChange);
    auth.on('auth:error', handleAuthError);
    auth.on('auth:login', handleLogin);
    auth.on('auth:logout', handleLogout);

    return () => {
      mounted = false;
      auth.off('auth:state-change', handleAuthStateChange);
      auth.off('auth:error', handleAuthError);
      auth.off('auth:login', handleLogin);
      auth.off('auth:logout', handleLogout);
    };
  }, [updateAuthState]);

  // Login function
  const login = useCallback(async (credentials: LoginCredentials): Promise<LoginResult> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await auth.login(credentials);
      
      if (!result.success) {
        setAuthState(prev => ({
          ...prev,
          error: result.error || 'Login failed',
          isLoading: false
        }));
      }
      // Success state will be updated via event listeners
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setAuthState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // Logout function
  const logout = useCallback(async (): Promise<LogoutResult> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await auth.logout();
      // State will be updated via event listeners
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      setAuthState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // Check if user is authenticated
  const isAuthenticated = authState.user !== null && authState.token !== null;

  return {
    // State
    ...authState,
    isAuthenticated,
    isInitialized,
    
    // Methods
    login,
    logout,
    refresh: updateAuthState,
    
    // Convenience getters
    user: authState.user,
    token: authState.token,
  };
}

/**
 * Hook for accessing current user information
 */
export function useCurrentUser(): AuthUser | null {
  const { user } = useAuth();
  return user;
}

/**
 * Hook for checking authentication status
 */
export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}

/**
 * Hook for getting auth header for API requests
 */
export function useAuthHeader() {
  const [authHeader, setAuthHeader] = useState<string | null>(null);
  
  useEffect(() => {
    let mounted = true;
    
    const updateAuthHeader = async () => {
      try {
        const header = await auth.getAuthHeader();
        if (mounted) {
          setAuthHeader(header);
        }
      } catch (error) {
        console.error('Error getting auth header:', error);
        if (mounted) {
          setAuthHeader(null);
        }
      }
    };

    updateAuthHeader();

    // Update header when auth state changes
    const handleAuthChange = () => {
      updateAuthHeader();
    };

    auth.on('auth:login', handleAuthChange);
    auth.on('auth:logout', handleAuthChange);
    auth.on('auth:token-refresh', handleAuthChange);

    return () => {
      mounted = false;
      auth.off('auth:login', handleAuthChange);
      auth.off('auth:logout', handleAuthChange);
      auth.off('auth:token-refresh', handleAuthChange);
    };
  }, []);

  return authHeader;
}

/**
 * Hook for handling OAuth callbacks
 */
export function useOAuthCallback() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCallback = useCallback(async (callbackData?: Record<string, string>) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Parse URL parameters if no callback data provided
      const params = callbackData || (() => {
        const searchParams = new URLSearchParams(window.location.search);
        const result: Record<string, string> = {};
        for (const [key, value] of searchParams.entries()) {
          result[key] = value;
        }
        return result;
      })();

      const manager = getAuthManager();
      const result = await manager.handleOAuthCallback(params);

      if (!result.success && result.error) {
        setError(result.error);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Callback processing failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    handleCallback,
    isProcessing,
    error
  };
}

/**
 * Hook for managing authentication adapters
 */
export function useAuthAdapters() {
  const [adapters, setAdapters] = useState<Array<{ id: string; name: string; isActive: boolean }>>([]);
  const [currentAdapter, setCurrentAdapter] = useState<string | null>(null);

  useEffect(() => {
    const manager = getAuthManager();
    const allAdapters = manager.getAdapters();
    const current = manager.getCurrentAdapter();

    setAdapters(allAdapters.map(adapter => ({
      id: adapter.id,
      name: adapter.name,
      isActive: adapter.id === current?.id
    })));

    setCurrentAdapter(current?.id || null);
  }, []);

  const switchAdapter = useCallback(async (adapterId: string) => {
    const manager = getAuthManager();
    const success = manager.setActiveAdapter(adapterId);
    
    if (success) {
      setCurrentAdapter(adapterId);
      setAdapters(prev => prev.map(adapter => ({
        ...adapter,
        isActive: adapter.id === adapterId
      })));
      
      // Reinitialize with new adapter
      await manager.initialize();
    }
    
    return success;
  }, []);

  return {
    adapters,
    currentAdapter,
    switchAdapter
  };
}