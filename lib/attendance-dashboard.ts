// ============================================================================
// 📁 lib/attendance-dashboard.ts
// Types + helpers du tableau de bord Présences · Absences · Permissions.
// Aucun calcul métier ici : tout vient du back (/attendance-dashboard).
// La période réutilise celle du dashboard effectifs (lib/workforce).
// ============================================================================

import { WfPeriodState, WfScopeMode, periodParams } from '@/lib/workforce';

export interface AdCount { label: string; count: number; days?: number }

export interface AdTotals {
  present: number; remote: number; late: number; leave: number; absPaid: number; absUnpaid: number;
  holiday: number; offDay: number;
  workedDays: number; absenceDays: number; theoreticalDays: number; absentEmployees: number;
  presenceRate: number; absenteeismRate: number; lateRate: number; remoteRate: number; avgAbsenceDuration: number;
}

export interface AdDepartmentRow {
  label: string; headcount: number; workedDays: number; absenceDays: number; lateDays: number;
  presenceRate: number; absenteeismRate: number;
}

export interface AdTopEmployee {
  id: string; fullName: string; department: string; companyName: string; value: number; extra: number;
}

export interface AdMonthPoint {
  month: number; year: number; label: string; short: string; key: string; hasAttendance: boolean;
  workedDays: number; absenceDays: number; lateDays: number; presenceRate: number; absenteeismRate: number;
  absenceRequests: number; permissions: number;
}

export interface AdAbsenceStats {
  total: number; approved: number; pending: number; rejected: number; cancelled: number;
  approvedDays: number; paidDays: number; unpaidDays: number;
  byType: AdCount[]; bySubType: AdCount[]; byStatus: AdCount[];
}

export interface AdPermissionStats {
  total: number; approved: number; pending: number; rejected: number; cancelled: number;
  totalHours: number; avgHours: number; lateReturns: number; notReturned: number;
  byType: AdCount[]; byMission: AdCount[]; byStatus: AdCount[];
}

export interface AdView {
  companyName: string;
  city: string;
  multi: boolean;
  companies: { id: string; name: string }[];
  warnings: string[];
  period: { mode: string; label: string; months: { month: number; year: number; label: string; short: string }[] };
  headcount: number;
  totals: AdTotals;
  absences: AdAbsenceStats;
  permissions: AdPermissionStats;
  departments: AdDepartmentRow[];
  topAbsent: AdTopEmployee[];
  topPermissions: AdTopEmployee[];
  evolution: AdMonthPoint[];
}

export interface AdScopeSelection {
  /** Mode portefeuille : 'ALL' ou un identifiant d'entreprise. */
  companies: string;
  /** Mode PME : identifiant de l'entreprise ouverte (depuis l'URL). */
  companyId?: string;
}

export function attendanceEndpoint(scope: WfScopeMode, kind: 'view' | 'export', p: WfPeriodState, sel: AdScopeSelection): string {
  const q = periodParams(p);
  if (scope === 'PORTFOLIO') q.set('companies', sel.companies || 'ALL');
  else if (sel.companyId) q.set('companyId', sel.companyId);
  const base = scope === 'PORTFOLIO' ? '/portfolio/attendance-dashboard' : '/attendance-dashboard';
  return `${base}${kind === 'export' ? '/export' : ''}?${q.toString()}`;
}

export function attendanceFileName(p: WfPeriodState, companyLabel: string): string {
  const clean = (s: string) =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40);
  const span =
    p.mode === 'MOIS' ? `${String(p.month).padStart(2, '0')}_${p.year}`
    : p.mode === 'ANNEE' ? `${p.year}`
    : `${p.fromYear}_${String(p.fromMonth).padStart(2, '0')}_a_${p.toYear}_${String(p.toMonth).padStart(2, '0')}`;
  return `Presences_Absences_${clean(companyLabel) || 'Entreprise'}_${span}.xlsx`;
}

export const pct = (x: number) => `${(x * 100).toFixed(2).replace('.', ',')} %`;
export const num1 = (x: number) => x.toFixed(2).replace('.', ',').replace(/,00$/, '');
