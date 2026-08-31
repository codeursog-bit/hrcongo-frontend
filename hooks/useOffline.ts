'use client';

import { useState, useEffect } from 'react';

export function useOffline() {
  const [isOffline, setIsOffline] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const updateStatus = () => {
      setIsOffline(!navigator.onLine);
      setIsOnline(navigator.onLine);
    };

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    updateStatus();

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);

  return { isOffline, isOnline };
}