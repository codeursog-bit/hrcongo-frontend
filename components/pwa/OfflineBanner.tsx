'use client';

import { useOffline } from '@/hooks/useOffline';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { WifiOff, Wifi } from 'lucide-react';

export function OfflineBanner() {
  const { isOffline } = useOffline();
  const { pendingCount } = useSyncStatus();

  if (!isOffline && pendingCount === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {isOffline && (
        <div className="bg-orange-500 text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2">
          <WifiOff className="h-4 w-4" />
          Mode hors ligne - {pendingCount} action{pendingCount > 1 ? 's' : ''} en attente
        </div>
      )}
      {!isOffline && pendingCount > 0 && (
        <div className="bg-blue-500 text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2">
          <Wifi className="h-4 w-4 animate-pulse" />
          Synchronisation... {pendingCount} action{pendingCount > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}