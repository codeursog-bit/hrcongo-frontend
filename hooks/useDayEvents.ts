'use client';
import { useCallback, useEffect, useState } from 'react';
import { dayEventsAvailable, getDayEvents } from '@/lib/data/day-events';
import { sendDayEventComment } from '@/lib/data/day-events.api';
import { DEMO_MODE } from '@/lib/demo/config';
import type { DayEvent } from '@/types/contracts/day-events';
export function useDayEvents() {
  const [events, setEvents] = useState<DayEvent[]>([]); const [loading, setLoading] = useState(dayEventsAvailable); const [error, setError] = useState('');
  // `silent` : met à jour les données SANS repasser par l'état « chargement » → la carte ne clignote plus.
  const refresh = useCallback(async (silent?: unknown) => {
    if (!dayEventsAvailable) return;
    const quiet = silent === true;
    if (!quiet) setLoading(true);
    try { setEvents(await getDayEvents().list()); setError(''); } catch (e) { setError(e instanceof Error ? e.message : 'Chargement interrompu'); } finally { if (!quiet) setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => {
    if (!dayEventsAvailable || !events.length) return;
    const expiry = Math.min(...events.map(event => new Date(event.expiresAt).getTime()).filter(Number.isFinite));
    if (!Number.isFinite(expiry)) return;
    const timer = setTimeout(() => { void refresh(true); }, Math.min(86400000, Math.max(100, expiry - Date.now() + 50)));
    return () => clearTimeout(timer);
  }, [events, refresh]);
  return { events, loading, error, available: dayEventsAvailable, refresh,
    // 1 seule réaction par personne : même emoji = retrait, autre emoji = remplacement. Affichage immédiat, le serveur confirme ensuite.
    react: async (id: string, emoji: string) => {
      setEvents(list => list.map(e => {
        if (e.id !== id) return e;
        const current = e.reactions.find(r => r.mine)?.emoji; const next = current === emoji ? null : emoji;
        return { ...e, reactions: e.reactions.map(r => r.emoji === current ? { ...r, count: Math.max(0, r.count - 1), mine: false } : r.emoji === next ? { ...r, count: r.count + 1, mine: true } : r) };
      }));
      try { await getDayEvents().react(id, emoji); } catch (e) { await refresh(true); throw e; }
      void refresh(true);
    },
    comment: async (id: string, text: string) => {
      if (DEMO_MODE) throw new Error('Messages indisponibles en démonstration.');
      await sendDayEventComment(id, text);
      setEvents(list => list.map(e => e.id === id ? { ...e, sentCount: ((e as any).sentCount || 0) + 1 } as DayEvent : e));
    },
  };
}