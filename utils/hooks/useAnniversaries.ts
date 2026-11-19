'use client';
import { useCallback, useEffect, useState } from 'react';
import { anniversariesAvailable, getAnniversaries } from '@/lib/data/anniversaries';
import type { AnniversaryNotification } from '@/types/contracts/anniversaries';
export function useAnniversaries() {
  const [notifications, setNotifications] = useState<AnniversaryNotification[]>([]); const [error, setError] = useState(''); const [loading, setLoading] = useState(anniversariesAvailable);
  const refresh = useCallback(async () => { if (!anniversariesAvailable) return; setLoading(true); try { setNotifications(await getAnniversaries().list()); setError(''); } catch (e) { setError(e instanceof Error ? e.message : 'Chargement interrompu'); } finally { setLoading(false); } }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  return { notifications, loading, error, available: anniversariesAvailable, refresh, markRead: async (id: string) => { await getAnniversaries().markRead(id); await refresh(); } };
}
