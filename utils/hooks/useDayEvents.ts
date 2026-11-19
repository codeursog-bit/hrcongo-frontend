'use client';
import { useCallback, useEffect, useState } from 'react';
import { dayEventsAvailable, getDayEvents } from '@/lib/data/day-events';
import type { DayEvent } from '@/types/contracts/day-events';
export function useDayEvents() {
  const [events, setEvents] = useState<DayEvent[]>([]); const [loading, setLoading] = useState(dayEventsAvailable); const [error, setError] = useState('');
  const refresh = useCallback(async () => { if (!dayEventsAvailable) return; setLoading(true); try { setEvents(await getDayEvents().list()); setError(''); } catch (e) { setError(e instanceof Error ? e.message : 'Chargement interrompu'); } finally { setLoading(false); } }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => {
    if (!dayEventsAvailable || !events.length) return;
    const expiry = Math.min(...events.map(event => new Date(event.expiresAt).getTime()).filter(Number.isFinite));
    if (!Number.isFinite(expiry)) return;
    const timer = setTimeout(() => { void refresh(); }, Math.min(86400000, Math.max(100, expiry - Date.now() + 50)));
    return () => clearTimeout(timer);
  }, [events, refresh]);
  return { events, loading, error, available: dayEventsAvailable, refresh, react: async (id: string, emoji: string) => { await getDayEvents().react(id, emoji); await refresh(); } };
}
