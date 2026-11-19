'use client';
import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { computeFallbackLeaveBalance, computeDebtKpis, computeMonthlyPresenceRate } from '@/lib/personal-dashboard-stats';
import type { DayContext, PersonalStats } from '@/components/dashboard/day-types';

/** Lazy admin/RH personal view, using the employee dashboard's existing reads. */
export function usePersonalDay(enabled: boolean) {
  const [loading, setLoading] = useState(true); const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(''); const [stats, setStats] = useState<PersonalStats>({}); const [context, setContext] = useState<DayContext>({});
  useEffect(() => {
    if (!enabled || loaded) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const employeeProfile = await api.get<any>('/employees/me').catch(error => { if (error?.status === 404) return null; throw error; });
        if (!employeeProfile?.id) { if (!cancelled) setContext({ employee: null }); return; }
        const now = new Date();
        const [leaves, attendance, payrolls, loans, advancesList, dayStatuses] = await Promise.all([
          api.get<any[]>('/leaves/me').catch(() => []), api.get<any[]>('/attendance/today').catch(() => []),
          api.get<any[]>(`/payrolls?employeeId=${employeeProfile.id}`).catch(() => []), api.get<any[]>('/loans/me').catch(() => []),
          api.get<any[]>('/loans/advances/me').catch(() => []), api.get<any[]>(`/attendance/employee/${employeeProfile.id}?month=${now.getMonth() + 1}&year=${now.getFullYear()}`).catch(() => []),
        ]);
        let remainingLeaves = 0;
        try { const balance = await api.get<any>(`/leaves/balance/${employeeProfile.id}?year=${now.getFullYear()}`); remainingLeaves = balance.annualRemaining || 0; }
        catch { remainingLeaves = computeFallbackLeaveBalance(employeeProfile, leaves.filter(l => l.status === 'APPROVED' && l.type === 'ANNUAL' && new Date(l.startDate).getFullYear() === now.getFullYear())); }
        const leaveEx = await api.get<any>('/leaves/me/balance-explained').catch(() => null);
        if (leaveEx?.totals) remainingLeaves = leaveEx.totals.remaining;
        const today = attendance.find(a => a.employeeId === employeeProfile.id);
        let lastSalaryAmount = '0 F', lastSalaryMonth = '-';
        if (payrolls.length) { const sorted = [...payrolls].sort((a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month); lastSalaryAmount = sorted[0].netSalary.toLocaleString() + ' F'; lastSalaryMonth = new Date(0, sorted[0].month - 1).toLocaleString('fr-FR', { month: 'long' }); }
        const debt = computeDebtKpis(loans, advancesList);
        if (!cancelled) {
          setContext({ employee: employeeProfile, leaves, attendance: today, dayStatuses });
          setStats({ pendingLeaves: leaves.filter(l => l.status === 'PENDING').length, remainingLeaves: Number(remainingLeaves).toFixed(1), leaveEx, checkIn: today?.checkIn, checkOut: today?.checkOut, lastSalary: lastSalaryAmount, lastSalaryMonth, totalDebt: debt.totalRemaining, totalPaid: debt.totalPaid, presenceRateMonth: computeMonthlyPresenceRate(dayStatuses) });
        }
      } catch { if (!cancelled) setError('Votre espace personnel ne peut pas être chargé pour le moment.'); }
      finally { if (!cancelled) { setLoading(false); setLoaded(true); } }
    };
    void load(); return () => { cancelled = true; };
  }, [enabled, loaded]);
  return { loading, stats, context, error };
}
