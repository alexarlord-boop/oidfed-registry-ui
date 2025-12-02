import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { SessionTimeout } from './SessionTimeout';
import { getTokenManager } from '@/lib/tokenManager';
import type { ReactNode } from 'react';

interface RequireAuthProps {
  children: ReactNode;
  redirectTo?: string;
}

/**
 * Authentication guard component with session management
 * Redirects to login if not authenticated and monitors token expiry
 */
export function RequireAuth({ children, redirectTo = '/login' }: RequireAuthProps) {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const location = useLocation();
  const [timeUntilExpiry, setTimeUntilExpiry] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Check token expiry every 10 seconds
    const checkExpiry = async () => {
      const tokenManager = getTokenManager();
      const seconds = await tokenManager.getTimeUntilExpiry();
      setTimeUntilExpiry(seconds);
    };

    checkExpiry();
    const interval = setInterval(checkExpiry, 10000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleExtendSession = async () => {
    // Token manager will auto-refresh when needed
    const tokenManager = getTokenManager();
    const token = await tokenManager.getValidToken();
    if (token) {
      setTimeUntilExpiry(null); // Reset warning
    }
  };

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Render protected content with session monitoring
  return (
    <>
      {timeUntilExpiry !== null && timeUntilExpiry <= 120 && (
        <SessionTimeout
          expiresIn={timeUntilExpiry}
          onExtend={handleExtendSession}
          onLogout={logout}
        />
      )}
      {children}
    </>
  );
}

export default RequireAuth;
