/**
 * SSO Login Button
 * Button for initiating OIDC/OAuth login flow
 */

import { Button } from '@/components/ui/button';
import { KeyRound, Github } from 'lucide-react';
import type { OIDCProviderConfig } from '@/types/auth';

interface SSOLoginButtonProps {
  config: OIDCProviderConfig;
  onClick: () => void;
  isLoading?: boolean;
}

export function SSOLoginButton({ config, onClick, isLoading }: SSOLoginButtonProps) {
  // Icon selection based on provider
  const getIcon = () => {
    switch (config.id) {
      case 'github':
        return <Github className="w-5 h-5 mr-2" />;
      case 'keycloak':
      default:
        return <KeyRound className="w-5 h-5 mr-2" />;
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={onClick}
      disabled={isLoading}
      style={config.color ? { borderColor: config.color } : undefined}
    >
      {getIcon()}
      <span>Continue with {config.name}</span>
    </Button>
  );
}
