import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface RequireAuthProps {
  /** The component to render if authenticated */
  children: React.ReactNode;
  /** Redirect path for unauthenticated users */
  redirectTo?: string;
  /** Required roles for access (optional) */
  requiredRoles?: string[];
  /** Fallback component while checking authentication */
  fallback?: React.ReactNode;
}

/**
 * Updated RequireAuth Component
 * Protects routes and requires authentication using the unified auth system
 */
export function RequireAuth({ 
  children, 
  redirectTo = '/login',
  requiredRoles,
  fallback
}: RequireAuthProps) {
  const { isAuthenticated, isLoading, user, isInitialized } = useAuth();
  const location = useLocation();

  // Show loading state while auth is being initialized or checked
  if (!isInitialized || isLoading) {
    return (
      <>
        {fallback || (
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Checking authentication...</p>
            </div>
          </div>
        )}
      </>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Check role requirements if specified
  if (requiredRoles && requiredRoles.length > 0 && user) {
    const hasRequiredRole = requiredRoles.some(role => user.roles.includes(role));
    
    if (!hasRequiredRole) {
      return (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold">Access Denied</h2>
            <p className="text-muted-foreground">
              You don't have the required permissions to access this page.
            </p>
            <p className="text-sm text-muted-foreground">
              Required roles: {requiredRoles.join(', ')}
            </p>
          </div>
        </div>
      );
    }
  }

  // Render protected content
  return <>{children}</>;
}

/**
 * Higher-order component for protecting routes
 */
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: Omit<RequireAuthProps, 'children'>
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <RequireAuth {...options}>
        <WrappedComponent {...props} />
      </RequireAuth>
    );
  };
}

/**
 * Hook for conditional rendering based on authentication
 */
export function useAuthGuard() {
  const { isAuthenticated, user } = useAuth();

  const hasRole = (role: string) => {
    return user?.roles?.includes(role) ?? false;
  };

  const hasAnyRole = (roles: string[]) => {
    return roles.some(role => hasRole(role));
  };

  const hasAllRoles = (roles: string[]) => {
    return roles.every(role => hasRole(role));
  };

  return {
    isAuthenticated,
    user,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    isAdmin: hasRole('admin')
  };
}

export default RequireAuth;