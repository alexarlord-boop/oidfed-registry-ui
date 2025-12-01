/**
 * Token Debug Component
 * Displays current token information and allows manual refresh
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, CheckCircle, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { parseJWT } from '@/lib/utils';
import { getAuth } from '@/lib/auth';
import type { UnifiedAuth } from '@/lib/auth';

export function TokenDebug() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [refreshResult, setRefreshResult] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-check token when user changes (e.g., after refresh or role update)
  useEffect(() => {
    if (user) {
      checkToken();
    }
  }, [user?.id, user?.role]); // Re-check when user ID or role changes

  const checkToken = async () => {
    const auth = getAuth() as UnifiedAuth;
    const tokenManager = auth.getTokenManager();
    
    // Get tokens from TokenManager (source of truth)
    const tokens = await tokenManager.getTokens();
    const refreshToken = tokens?.refresh_token;
    
    // Get current valid token (from memory)
    const accessToken = await tokenManager.getValidToken();

    if (accessToken) {
      const payload = parseJWT(accessToken);
      const now = Date.now() / 1000;
      const expiresIn = payload.exp - now;

      setTokenInfo({
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        storedUser: user, // Use Zustand user (source of truth)
        tokenPayload: payload,
        expiresIn: Math.floor(expiresIn),
        expired: expiresIn < 0,
      });
    } else {
      setTokenInfo({
        hasAccessToken: false,
        hasRefreshToken: !!refreshToken,
        storedUser: user,
        tokenPayload: null,
      });
    }
  };

  const attemptRefresh = async () => {
    setIsRefreshing(true);
    setRefreshResult(null);

    const auth = getAuth() as UnifiedAuth;
    const tokenManager = auth.getTokenManager();
    
    const tokens = await tokenManager.getTokens();
    const refreshToken = tokens?.refresh_token;
    
    if (!refreshToken) {
      setRefreshResult('No refresh token found. Please log out and log back in.');
      setIsRefreshing(false);
      return;
    }

    try {
      // Force a token refresh through TokenManager
      // This will trigger UnifiedAuth.refreshTokens() which updates user info
      const newTokens = await tokenManager.refreshTokens(refreshToken);
      
      if (newTokens && newTokens.access_token) {
        const payload = parseJWT(newTokens.access_token);
        setRefreshResult(`✓ Token refreshed successfully! New role: ${payload.role}`);
        
        // Wait a moment for Zustand to update, then check token info
        setTimeout(async () => {
          await checkToken();
        }, 100);
      } else {
        setRefreshResult('Refresh failed: No new tokens received');
      }
    } catch (error) {
      setRefreshResult(`Refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogoutAndRelogin = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Authentication Debug</CardTitle>
        <CardDescription>
          Current session and token information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button onClick={checkToken} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Check Current Token
            </Button>
            <Button onClick={attemptRefresh} disabled={isRefreshing} size="sm">
              {isRefreshing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Token Now
                </>
              )}
            </Button>
            <Button onClick={handleLogoutAndRelogin} variant="outline" size="sm">
              <LogOut className="mr-2 h-4 w-4" />
              Logout & Re-login
            </Button>
          </div>

          {refreshResult && (
            <Alert variant={refreshResult.includes('✓') ? 'default' : 'destructive'}>
              {refreshResult.includes('✓') ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{refreshResult}</AlertDescription>
            </Alert>
          )}
        </div>

        {tokenInfo && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="font-semibold">Access Token:</div>
              <div>
                {tokenInfo.hasAccessToken ? (
                  <span className="text-green-600">✓ Present</span>
                ) : (
                  <span className="text-red-600">✗ Missing</span>
                )}
              </div>

              <div className="font-semibold">Refresh Token:</div>
              <div>
                {tokenInfo.hasRefreshToken ? (
                  <span className="text-green-600">✓ Present</span>
                ) : (
                  <span className="text-red-600">✗ Missing</span>
                )}
              </div>

              {tokenInfo.tokenPayload && (
                <>
                  <div className="font-semibold">Token Role:</div>
                  <div>
                    <code className="bg-slate-100 px-2 py-1 rounded">
                      {tokenInfo.tokenPayload.role}
                    </code>
                  </div>

                  <div className="font-semibold">Token Status:</div>
                  <div>
                    {tokenInfo.expired ? (
                      <span className="text-red-600">✗ Expired</span>
                    ) : (
                      <span className="text-green-600">
                        ✓ Valid (expires in {tokenInfo.expiresIn}s)
                      </span>
                    )}
                  </div>

                  <div className="font-semibold">Username:</div>
                  <div>{tokenInfo.tokenPayload.preferred_username}</div>

                  <div className="font-semibold">Email:</div>
                  <div>{tokenInfo.tokenPayload.email}</div>
                </>
              )}

              {tokenInfo.storedUser && (
                <>
                  <div className="font-semibold">Stored User Role:</div>
                  <div>
                    <code className="bg-slate-100 px-2 py-1 rounded">
                      {tokenInfo.storedUser.role}
                    </code>
                  </div>
                </>
              )}

              {user && (
                <>
                  <div className="font-semibold">Current User Role:</div>
                  <div>
                    <code className="bg-slate-100 px-2 py-1 rounded">
                      {user.role}
                    </code>
                  </div>
                </>
              )}
            </div>

            {tokenInfo.tokenPayload && user && tokenInfo.tokenPayload.role !== user.role && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Role mismatch detected!</strong>
                  <br />
                  Token role: {tokenInfo.tokenPayload.role} | UI role: {user.role}
                  <br />
                  Click "Refresh Token Now" to get updated permissions.
                </AlertDescription>
              </Alert>
            )}

            {tokenInfo.expired && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your access token has expired. Click "Refresh Token Now" to renew it.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>If you were recently approved or promoted:</strong>
            <br />
            1. Click "Refresh Token Now" to get a new token with updated permissions
            <br />
            2. If refresh fails, click "Logout & Re-login" to get a fresh session
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
