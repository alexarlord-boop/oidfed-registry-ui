/**
 * SSO Login Button
 * Button for initiating OIDC/OAuth login flow
 */

import { Button } from '@/components/ui/button';
import type { OIDCProviderConfig } from '@/types/auth';

interface SSOLoginButtonProps {
  config: OIDCProviderConfig;
  onClick: () => void;
  isLoading?: boolean;
}

export function SSOLoginButton({ config, onClick, isLoading }: SSOLoginButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={onClick}
      disabled={isLoading}
      style={config.color ? { borderColor: config.color } : undefined}
    >
      {config.logo && (
        <img 
          src={config.logo} 
          alt={config.name}
          className="w-5 h-5 mr-2"
        />
      )}
      <span>Continue with {config.name}</span>
    </Button>
  );
}
