import React, { useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export function Login() {
  const navigate = useNavigate();
  const location = useLocation() as any;
  const from = location.state?.from?.pathname ?? "/";
  
  const { login, isLoading, error, isAuthenticated } = useAuth();
  
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
      } else {
        setLocalError(result.error || "Login failed");
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Login failed");
    }
  };

  const displayError = localError || error;
  
  // Simple login form for development
  const title = 'OIDFED Registry';
  const description = 'Enter your credentials to access the admin panel';

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
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
              
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
            </form>
            
            <div className="mt-4 p-3 bg-muted rounded text-sm text-muted-foreground">
              <strong>Development Mode:</strong> Any credentials accepted. 
              Default: admin / admin
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Login;
