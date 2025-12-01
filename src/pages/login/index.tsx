import { useState, useEffect } from "react";
import { useNavigate, useLocation, Navigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { LoginForm } from "@/components/auth/LoginForm";
import { SSOLoginButton } from "@/components/auth/SSOLoginButton";
import { LoginDivider } from "@/components/auth/LoginDivider";
import { enabledOIDCProviders, isLocalAuthEnabled } from "@/config/oidc.config";
import { getAuth } from "@/lib/auth";
import type { UnifiedAuth } from "@/lib/auth";
import type { ProviderId } from "@/types/auth";

export function Login() {
  const navigate = useNavigate();
  const location = useLocation() as any;
  const [searchParams] = useSearchParams();
  const from = location.state?.from?.pathname ?? "/dashboard";
  const stateMessage = location.state?.message; // Message from RequireAuth redirect
  const errorParam = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  
  const { login, isLoading, error, isAuthenticated } = useAuth();
  const [localError, setLocalError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(stateMessage || errorDescription || null);

  // Clear info message after 10 seconds
  useEffect(() => {
    if (infoMessage) {
      const timer = setTimeout(() => setInfoMessage(null), 10000);
      return () => clearTimeout(timer);
    }
  }, [infoMessage]);

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
        // Parse error message to detect specific issues
        const errorMsg = result.error || "Login failed";
        
        if (errorMsg.includes("pending approval") || errorMsg.includes("Account pending approval")) {
          setLocalError("Your account is pending approval by an administrator. You will receive an email notification once your account is approved.");
        } else if (errorMsg.includes("disabled") || errorMsg.includes("Account is disabled")) {
          setLocalError("Your account has been disabled. Please contact an administrator for assistance.");
        } else {
          setLocalError(errorMsg);
        }
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Login failed");
    }
  };

  const handleSSOLogin = async (providerId: ProviderId) => {
    setLocalError(null);
    try {
      const auth = getAuth() as UnifiedAuth;
      
      // UnifiedAuth supports OIDC flow via loginWithOIDC method
      if (auth.loginWithOIDC) {
        await auth.loginWithOIDC(providerId, from);
      } else {
        throw new Error('SSO login not supported');
      }
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
            {/* Info message from redirect (e.g., pending approval, inactive account) */}
            {infoMessage && (
              <Alert className="mb-4 bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">{infoMessage}</AlertDescription>
              </Alert>
            )}

            {/* SSO Login Options */}
            {hasOIDC && (
              <div className="space-y-3">
                {enabledOIDCProviders.map((provider) => (
                  <SSOLoginButton
                    key={provider.id}
                    config={provider}
                    onClick={() => handleSSOLogin(provider.id)}
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
