import { useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { LoginForm } from "@/components/auth/LoginForm";
import { SSOLoginButton } from "@/components/auth/SSOLoginButton";
import { LoginDivider } from "@/components/auth/LoginDivider";
import { enabledOIDCProviders, isLocalAuthEnabled } from "@/config/oidc.config";
import { OIDCAuth } from "@/lib/oidcAuth";
import { getAuth, setAuth } from "@/lib/auth";

export function Login() {
  const navigate = useNavigate();
  const location = useLocation() as any;
  const from = location.state?.from?.pathname ?? "/";
  
  const { login, isLoading, error, isAuthenticated } = useAuth();
  const [localError, setLocalError] = useState<string | null>(null);

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleLocalLogin = async (username: string, password: string) => {
    setLocalError(null);

    try {
      const result = await login({ username, password });
      
      if (result.success) {
        // Small delay to ensure tokens are persisted before navigation
        await new Promise(resolve => setTimeout(resolve, 100));
        navigate(from, { replace: true });
      } else {
        setLocalError(result.error || "Login failed");
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Login failed");
    }
  };

  const handleOIDCLogin = async () => {
    try {
      // Ensure we have OIDC auth provider
      let auth = getAuth();
      if (!(auth instanceof OIDCAuth)) {
        auth = new OIDCAuth('keycloak');
        setAuth(auth);
        await auth.initialize();
      }

      // Start OIDC flow (will redirect to Auth Gateway)
      await (auth as OIDCAuth).loginWithOIDC(from);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "SSO login failed");
    }
  };

  const displayError = localError || error;
  const hasOIDC = enabledOIDCProviders.length > 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full px-4">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>OIDFED Registry</CardTitle>
            <CardDescription>Sign in to access the admin panel</CardDescription>
          </CardHeader>
          <CardContent>
            {/* SSO Login Options */}
            {hasOIDC && (
              <div className="space-y-3">
                {enabledOIDCProviders.map((provider) => (
                  <SSOLoginButton
                    key={provider.id}
                    config={provider}
                    onClick={handleOIDCLogin}
                    isLoading={isLoading}
                  />
                ))}
              </div>
            )}

            {/* Divider if both local and SSO are enabled */}
            {isLocalAuthEnabled && hasOIDC && <LoginDivider />}

            {/* Local Login Form */}
            {isLocalAuthEnabled && (
              <LoginForm
                onSubmit={handleLocalLogin}
                isLoading={isLoading}
                error={displayError}
              />
            )}

            {/* Registration Link */}
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <a href="/register" className="text-primary hover:underline">
                Request access
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Login;
