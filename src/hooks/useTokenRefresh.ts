/**
 * Token Refresh Hook
 * Automatically refreshes tokens before expiry
 */

import { useEffect } from 'react';
import { getTokenManager } from '@/lib/tokenManager';

interface UseTokenRefreshOptions {
  enabled?: boolean;
  refreshBeforeSeconds?: number; // Refresh this many seconds before expiry
}

/**
 * Hook to automatically refresh tokens
 * Monitors token expiry and triggers refresh when needed
 */
export function useTokenRefresh({ 
  enabled = true, 
  refreshBeforeSeconds = 60 
}: UseTokenRefreshOptions = {}) {
  useEffect(() => {
    if (!enabled) return;

    const tokenManager = getTokenManager();
    let timeoutId: NodeJS.Timeout | null = null;

    const scheduleRefresh = async () => {
      const timeUntilExpiry = await tokenManager.getTimeUntilExpiry();
      
      if (timeUntilExpiry === null) {
        // No tokens
        return;
      }

      // Calculate when to refresh (N seconds before expiry)
      const refreshIn = Math.max(0, timeUntilExpiry - refreshBeforeSeconds);

      console.debug(`[Token Refresh] Scheduling refresh in ${refreshIn} seconds`);

      timeoutId = setTimeout(async () => {
        console.debug('[Token Refresh] Attempting refresh');
        const validToken = await tokenManager.getValidToken();
        
        if (validToken) {
          console.debug('[Token Refresh] Success');
          // Schedule next refresh
          scheduleRefresh();
        } else {
          console.warn('[Token Refresh] Failed - user may need to re-authenticate');
        }
      }, refreshIn * 1000);
    };

    scheduleRefresh();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [enabled, refreshBeforeSeconds]);
}
