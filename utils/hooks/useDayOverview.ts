'use client';
import { useEffect, useState } from 'react';
import { dayOverviewAvailable, getDayOverview } from '@/lib/data/day-overview';
import type { DayOverview } from '@/types/contracts/day-overview';
export function useDayOverview() {
  const [data, setData] = useState<DayOverview>({ holidays: [], absentColleagues: [], schedule: [] }); const [error, setError] = useState(''); const [loading, setLoading] = useState(dayOverviewAvailable);
  useEffect(() => { if (!dayOverviewAvailable) return; let cancelled = false; getDayOverview().get().then(value => { if (!cancelled) setData(value); }).catch(() => { if (!cancelled) setError('Les informations de la journée sont temporairement indisponibles.'); }).finally(() => { if (!cancelled) setLoading(false); }); return () => { cancelled = true; }; }, []);
  return { available: dayOverviewAvailable, data, error, loading };
}
