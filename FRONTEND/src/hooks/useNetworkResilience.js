import { useState, useEffect } from 'react';
import { Logger } from '../utils/logger';

export function useNetworkResilience() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      Logger.info('Network Restored', { type: 'NETWORK_ONLINE' });
      setIsOffline(false);
    };

    const handleOffline = () => {
      Logger.warn('Network Lost', { type: 'NETWORK_OFFLINE' });
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOffline };
}
