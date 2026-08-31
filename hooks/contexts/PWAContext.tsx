'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useOffline } from '@/hooks/useOffline';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { startAutoSync, stopAutoSync } from '@/lib/pwa/sync-queue';

interface PWAContextType {
  isOffline: boolean;
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export function PWAProvider({ children, apiClient }: { children: React.ReactNode; apiClient?: any }) {
  const { isOffline, isOnline } = useOffline();
  const { pendingCount, isSyncing, refresh } = useSyncStatus();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized && apiClient) {
      startAutoSync(apiClient, () => refresh());
      setIsInitialized(true);
      return () => stopAutoSync();
    }
  }, [isInitialized, apiClient, refresh]);

  return (
    <PWAContext.Provider value={{ isOffline, isOnline, pendingCount, isSyncing }}>
      {children}
    </PWAContext.Provider>
  );
}

export function usePWA() {
  const context = useContext(PWAContext);
  if (!context) throw new Error('usePWA must be used within PWAProvider');
  return context;
}