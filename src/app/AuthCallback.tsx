/**
 * OAuth Callback Handler
 * Handles the redirect from Auth Gateway after OIDC authorization
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAuth } from '../lib/auth';
import type { UnifiedAuth } from '../lib/auth';

export function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      // Check for tokens in URL fragment (from auth-gateway SSO callback)
      const hash = window.location.hash.substring(1); // Remove '#'
      const fragmentParams = new URLSearchParams(hash);
      
      const accessToken = fragmentParams.get('access_token');
      const idToken = fragmentParams.get('id_token');
      const refreshToken = fragmentParams.get('refresh_token');
      const expiresIn = fragmentParams.get('expires_in');
      const fragmentState = fragmentParams.get('state');
      
      // If we have tokens in fragment, this is from auth-gateway SSO callback
      if (accessToken && idToken) {
        try {
          const auth = getAuth() as UnifiedAuth;
          
          // Use UnifiedAuth's handleSSOCallback method
          await auth.handleSSOCallback({
            access_token: accessToken,
            id_token: idToken,
            refresh_token: refreshToken || undefined,
            expires_in: parseInt(expiresIn || '900', 10),
          });
          
          console.log('[AuthCallback] SSO callback successful');
          
          // Redirect to home or original destination
          navigate('/', { replace: true });
          return;
        } catch (err) {
          console.error('SSO callback error:', err);
          setError(err instanceof Error ? err.message : 'Failed to complete authentication');
          setIsProcessing(false);
          return;
        }
      }
      
      // Otherwise, check for authorization code in query params (standard OIDC flow)
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const errorParam = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // Check for error response
      if (errorParam) {
        setError(errorDescription || errorParam || 'Authentication failed');
        setIsProcessing(false);
        return;
      }

      // Validate required parameters
      if (!code || !state) {
        setError('Missing authorization code or state parameter');
        setIsProcessing(false);
        return;
      }

      try {
        const auth = getAuth() as UnifiedAuth;
        
        // Handle the callback and exchange code for tokens
        const redirectTo = await auth.handleCallback(code, state);

        // Redirect to original destination or home
        navigate(redirectTo || '/', { replace: true });
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-destructive">
              Authentication Failed
            </h2>
            <p className="mt-4 text-muted-foreground">
              {error}
            </p>
            <div className="mt-6">
              <a
                href="/login"
                className="text-primary hover:underline"
              >
                Return to login
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <h2 className="mt-6 text-2xl font-bold tracking-tight">
            Completing sign in...
          </h2>
          <p className="mt-2 text-muted-foreground">
            Please wait while we complete your authentication.
          </p>
        </div>
      </div>
    </div>
  );
}
