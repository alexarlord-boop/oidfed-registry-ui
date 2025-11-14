import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth, useAuthAdapters, useOAuthCallback } from '../hooks/useAuth';
import type { LoginCredentials } from '../types';

interface UnifiedLoginProps {
  /** Redirect path after successful login */
  redirectTo?: string;
  /** Called after successful login */
  onSuccess?: () => void;
  /** Called after login error */
  onError?: (error: string) => void;
  /** Whether to show adapter selection */
  showAdapterSelection?: boolean;
  /** Custom styling */
  className?: string;
}

/**
 * Unified Login Component
 * Handles login for any configured authentication adapter
 */
export function UnifiedLogin({ 
  redirectTo, 
  onSuccess, 
  onError,
  showAdapterSelection = true,
  className 
}: UnifiedLoginProps) {
  const { login, isLoading, error } = useAuth();
  const { adapters, currentAdapter, switchAdapter } = useAuthAdapters();
  
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: '',
    additionalFields: {}
  });
  
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!credentials.username || !credentials.password) {
      const error = 'Username and password are required';
      setLocalError(error);
      onError?.(error);
      return;
    }

    try {
      const result = await login(credentials);
      
      if (result.success) {
        onSuccess?.();
        if (redirectTo && result.redirectUrl) {
          window.location.href = result.redirectUrl;
        } else if (redirectTo) {
          window.location.href = redirectTo;
        }
      } else if (result.error) {
        setLocalError(result.error);
        onError?.(result.error);
      } else if (result.redirectUrl) {
        // OAuth flow - redirect to authorization endpoint
        window.location.href = result.redirectUrl;
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Login failed';
      setLocalError(error);
      onError?.(error);
    }
  };

  const handleAdapterChange = async (adapterId: string) => {
    await switchAdapter(adapterId);
  };

  const displayError = localError || error;
  const isOAuthAdapter = currentAdapter === 'oauth';

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>
            {isOAuthAdapter 
              ? 'You will be redirected to complete authentication'
              : 'Enter your credentials to access the admin panel'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {showAdapterSelection && adapters.length > 1 && (
            <div>
              <Label htmlFor="adapter-select">Authentication Method</Label>
              <Select value={currentAdapter || ''} onValueChange={handleAdapterChange}>
                <SelectTrigger id="adapter-select">
                  <SelectValue placeholder="Select authentication method" />
                </SelectTrigger>
                <SelectContent>
                  {adapters.map(adapter => (
                    <SelectItem key={adapter.id} value={adapter.id}>
                      {adapter.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isOAuthAdapter && (
              <>
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={credentials.username}
                    onChange={(e) => setCredentials(prev => ({ 
                      ...prev, 
                      username: e.target.value 
                    }))}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={credentials.password}
                    onChange={(e) => setCredentials(prev => ({ 
                      ...prev, 
                      password: e.target.value 
                    }))}
                    disabled={isLoading}
                    required
                  />
                </div>
              </>
            )}

            {displayError && (
              <div className="text-destructive text-sm">
                {displayError}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading 
                ? 'Signing in...' 
                : isOAuthAdapter 
                  ? 'Sign in with OAuth' 
                  : 'Sign in'
              }
            </Button>
          </form>

          {currentAdapter === 'dev' && (
            <div className="mt-4 p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">
                <strong>Development Mode:</strong> Use any credentials to sign in.
                Default: admin / admin
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * OAuth Callback Handler Component
 * Processes OAuth callback and displays status
 */
export function OAuthCallback() {
  const { handleCallback, isProcessing, error } = useOAuthCallback();
  const [processed, setProcessed] = useState(false);

  React.useEffect(() => {
    if (!processed) {
      setProcessed(true);
      handleCallback();
    }
  }, [handleCallback, processed]);

  if (isProcessing) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p>Processing authentication...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-destructive">Authentication failed</p>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button onClick={() => window.location.href = '/login'}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <p className="text-primary">Authentication successful!</p>
            <p className="text-sm text-muted-foreground">Redirecting...</p>
          </div>
        </CardContent>
      </Card>
    </div>
    );
}


export default UnifiedLogin;