/**
 * OAuth Callback Handler
 * Handles the redirect from Auth Gateway after OIDC authorization
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { OIDCAuth } from '../lib/oidcAuth';
import { getAuth, setAuth } from '../lib/auth';

export function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      // Get authorization code and state from URL
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
        // Get or create OIDC auth instance
        let auth = getAuth();
        if (!(auth instanceof OIDCAuth)) {
          auth = new OIDCAuth('keycloak');
          setAuth(auth);
          await auth.initialize();
        }

        // Handle the callback and exchange code for tokens
        const redirectTo = await (auth as OIDCAuth).handleCallback(code, state);

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
