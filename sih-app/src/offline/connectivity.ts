import { useState, useEffect } from 'react';

/**
 * Lightweight connectivity hook that mirrors the demo offline-override toggle
 * stored in SahayakContext.
 *
 * Production upgrade path: replace the body with @react-native-community/netinfo
 * subscription while keeping the same return shape so callers need no changes.
 */
export function useNetworkStatus(isOfflineOverride: boolean): { isConnected: boolean } {
  const [isConnected, setIsConnected] = useState(!isOfflineOverride);

  useEffect(() => {
    setIsConnected(!isOfflineOverride);
  }, [isOfflineOverride]);

  return { isConnected };
}
