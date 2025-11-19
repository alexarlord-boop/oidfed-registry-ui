/**
 * Session Timeout Warning Component
 * Displays warning when session is about to expire
 */

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface SessionTimeoutProps {
  expiresIn: number; // seconds until expiry
  onExtend: () => void;
  onLogout: () => void;
}

export function SessionTimeout({ expiresIn, onExtend, onLogout }: SessionTimeoutProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(expiresIn);

  useEffect(() => {
    // Show warning when less than 2 minutes remain
    if (expiresIn <= 120 && expiresIn > 0) {
      setIsVisible(true);
      setTimeLeft(expiresIn);
    }
  }, [expiresIn]);

  useEffect(() => {
    if (!isVisible) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible, onLogout]);

  const handleExtend = () => {
    setIsVisible(false);
    onExtend();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Session Expiring Soon</CardTitle>
          <CardDescription>
            Your session will expire in <strong className="text-destructive">{formatTime(timeLeft)}</strong>.
            Would you like to extend your session?
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex gap-2">
          <Button variant="outline" onClick={onLogout} className="flex-1">
            Sign out
          </Button>
          <Button onClick={handleExtend} className="flex-1">
            Extend session
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
