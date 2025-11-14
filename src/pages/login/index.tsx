import React, { useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth, useAuthAdapters } from "@/auth";

export function Login() {
  const navigate = useNavigate();
  const location = useLocation() as any;
  const from = location.state?.from?.pathname ?? "/";
  
  const { login, isLoading, error, isAuthenticated } = useAuth();
  const { currentAdapter } = useAuthAdapters();
  
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [localError, setLocalError] = useState<string | null>(null);

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    
    if (!username || !password) {
      setLocalError("Username and password required");
      return;
    }

    try {
      const result = await login({ username, password });
      
      if (result.success) {
        navigate(from, { replace: true });
      } else if (result.redirectUrl) {
        // OAuth flow - redirect to authorization server
        window.location.href = result.redirectUrl;
      } else {
        setLocalError(result.error || "Login failed");
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Login failed");
    }
  };

  const displayError = localError || error;
  const isOAuthFlow = currentAdapter === 'oauth';
  
  // Dynamic title and description based on auth method
  const getAuthDisplayInfo = () => {
    switch (currentAdapter) {
      case 'dev':
        return {
          title: 'Developer Login',
          description: 'Demo-only login (defaults: admin / admin)'
        };
      case 'oauth':
      case 'oidc':
        return {
          title: 'OIDFED Registry',
          description: 'You will be redirected to complete authentication'
        };
      case 'basic':
      default:
        return {
          title: 'OIDFED Registry',
          description: 'Enter your credentials to access the admin panel'
        };
    }
  };
  
  const { title, description } = getAuthDisplayInfo();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full px-4">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              {!isOAuthFlow && (
                <>
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input 
                      id="username"
                      value={username} 
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={isLoading}
                      autoFocus
                    />
                  </div>

                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input 
                      id="password"
                      type="password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </>
              )}

              {displayError && (
                <div className="text-destructive text-sm bg-destructive/10 p-3 rounded">
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
                  : isOAuthFlow 
                    ? 'Continue with SSO' 
                    : 'Sign in'
                }
              </Button>
              
              {currentAdapter === 'dev' && (
                <div className="flex gap-2">
                  <Button 
                    type="button"
                    variant="ghost" 
                    onClick={() => { setUsername('admin'); setPassword('admin'); }}
                    disabled={isLoading}
                    className="w-full"
                  >
                    Use defaults
                  </Button>
                </div>
              )}
            </form>
            
            {currentAdapter === 'dev' && (
              <div className="mt-4 p-3 bg-muted rounded text-sm text-muted-foreground">
                <strong>Development Mode:</strong> Any credentials accepted. 
                Default: admin / admin
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Login;
