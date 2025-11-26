/**
 * Token Debug Component
 * Displays current token information and allows manual refresh
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, CheckCircle, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export function TokenDebug() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [refreshResult, setRefreshResult] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const parseJWT = (token: string): any => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const base64Url = parts[1];
      if (!base64Url) return null;
      
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  const checkToken = () => {
    const accessToken = sessionStorage.getItem('auth_access_token');
    const refreshToken = sessionStorage.getItem('auth_refresh_token');
    const storedUser = sessionStorage.getItem('auth_user');

    if (accessToken) {
      const payload = parseJWT(accessToken);
      const now = Date.now() / 1000;
      const expiresIn = payload.exp - now;

      setTokenInfo({
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        storedUser: storedUser ? JSON.parse(storedUser) : null,
        tokenPayload: payload,
        expiresIn: Math.floor(expiresIn),
        expired: expiresIn < 0,
      });
    } else {
      setTokenInfo({
        hasAccessToken: false,
        hasRefreshToken: !!refreshToken,
        storedUser: null,
        tokenPayload: null,
      });
    }
  };

  const attemptRefresh = async () => {
    setIsRefreshing(true);
    setRefreshResult(null);

    const refreshToken = sessionStorage.getItem('auth_refresh_token');
    if (!refreshToken) {
      setRefreshResult('No refresh token found. Please log out and log back in.');
      setIsRefreshing(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:9000/auth/token', {
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
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        setRefreshResult(`Refresh failed: ${error.detail}`);
        setIsRefreshing(false);
        return;
      }

      const tokenData = await response.json();
      const { access_token, refresh_token: new_refresh_token } = tokenData;

      // Update stored tokens
      sessionStorage.setItem('auth_access_token', access_token);
      if (new_refresh_token) {
        sessionStorage.setItem('auth_refresh_token', new_refresh_token);
      }

      // Parse and update user info
      const payload = parseJWT(access_token);
      if (payload) {
        const newUser = {
          id: payload.sub,
          username: payload.preferred_username,
          email: payload.email,
          role: payload.role,
          roles: payload.roles || [],
        };
        sessionStorage.setItem('auth_user', JSON.stringify(newUser));
        setRefreshResult(`✓ Token refreshed successfully! New role: ${payload.role}`);
        
        // Reload the page to update the UI with new permissions
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }

      checkToken();
    } catch (error: any) {
      setRefreshResult(`Error: ${error.message}`);
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
