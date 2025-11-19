import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { UserRole, hasRole } from '@/types/auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';

interface RequireRoleProps {
  children: ReactNode;
  role?: UserRole;
  roles?: UserRole[];
  requireAll?: boolean;
  fallback?: ReactNode;
  redirectTo?: string;
}

/**
 * Role-based authorization guard component
 * Wraps RequireAuth behavior and adds role checking
 * 
 * @example
 * // Require admin role
 * <RequireRole role={UserRole.ADMIN}>
 *   <AdminPanel />
 * </RequireRole>
 * 
 * @example
 * // Require one of multiple roles
 * <RequireRole roles={[UserRole.ADMIN, UserRole.TECHNICAL_CONTACT]}>
 *   <EntityManagement />
 * </RequireRole>
 * 
 * @example
 * // Require all specified roles
 * <RequireRole roles={[UserRole.ADMIN, UserRole.TECHNICAL_CONTACT]} requireAll>
 *   <SuperSecretFeature />
 * </RequireRole>
 */
export function RequireRole({
  children,
  role,
  roles,
  requireAll = false,
  fallback,
  redirectTo,
}: RequireRoleProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role requirements
  let hasRequiredRole = false;

  if (role) {
    // Single role check
    hasRequiredRole = hasRole(user, role);
  } else if (roles && roles.length > 0) {
    if (requireAll) {
      // User must have ALL specified roles
      hasRequiredRole = roles.every(r => hasRole(user, r));
    } else {
      // User must have AT LEAST ONE of the specified roles
      hasRequiredRole = roles.some(r => hasRole(user, r));
    }
  } else {
    // No role specified, just require authentication
    hasRequiredRole = true;
  }

  // If user doesn't have required role
  if (!hasRequiredRole) {
    // Redirect if specified
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }

    // Show custom fallback if provided
    if (fallback) {
      return <>{fallback}</>;
    }

    // Default access denied message
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              <CardTitle className="text-destructive">Access Denied</CardTitle>
            </div>
            <CardDescription>
              You don't have the required permissions to access this page.
            </CardDescription>
          </CardHeader>
          {user?.role === UserRole.PENDING && (
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Your account is pending approval. Please contact an administrator.
              </p>
            </CardContent>
          )}
        </Card>
      </div>
    );
  }

  // User has required role, render children
  return <>{children}</>;
}

export default RequireRole;
