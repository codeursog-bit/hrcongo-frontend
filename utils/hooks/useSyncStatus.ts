'use client';

import { useState, useEffect, useCallback } from 'react';
import { countPendingActions } from '@/lib/pwa/db';

export function useSyncStatus() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const counts = await countPendingActions();
      setPendingCount(counts.total);
    } catch (error) {
      console.error('Error refreshing pending count:', error);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  return {
    pendingCount,
    isSyncing,
    refresh,
    startSync: () => setIsSyncing(true),
    endSync: () => setIsSyncing(false),
  };
}