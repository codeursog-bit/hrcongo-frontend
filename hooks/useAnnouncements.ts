'use client';
import { useCallback, useEffect, useState } from 'react';
import { announcementsAvailable, getAnnouncements } from '@/lib/data/announcements';
import type { Announcement } from '@/types/contracts/announcements';
export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]); const [error, setError] = useState(''); const [loading, setLoading] = useState(announcementsAvailable);
  const refresh = useCallback(async () => { if (!announcementsAvailable) return; setLoading(true); try { setAnnouncements(await getAnnouncements().list()); setError(''); } catch (e) { setError(e instanceof Error ? e.message : 'Chargement interrompu'); } finally { setLoading(false); } }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  return { announcements, loading, error, available: announcementsAvailable, refresh, create: async (title: string, body: string) => { await getAnnouncements().create(title, body); await refresh(); } };
}
