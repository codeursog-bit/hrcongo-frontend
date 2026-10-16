// ============================================================================
// 📁 lib/request-history.ts
// ✅ Helpers partagés par les pages « Historique » et « Rapport » des demandes
//    (permissions, absences) : période, libellés, délais, normalisation des
//    lignes. Même logique que lib/leave-history-utils (congés).
// ============================================================================

import { effectiveDeparture, returnState, type ReturnState } from '@/lib/permission-return';

export { downloadCsv, MONTHS, MONTHS_SHORT, STATUS_LABELS, STATUS_BADGE, initials } from '@/lib/leave-history-utils';

export type RequestKind = 'permission' | 'absence';
export type PeriodMode = 'month' | 'year' | 'custom' | 'all';
export interface Period { mode: PeriodMode; month: number; year: number; from: string; to: string }

export const PERMISSION_TYPE_LABELS: Record<string, string> = { URGENCE: 'Urgence', MISSION: 'Mission', AUTRE: 'Autre' };
export const PERMISSION_TYPE_COLORS: Record<string, string> = { URGENCE: '#ef4444', MISSION: '#8b5cf6', AUTRE: '#64748b' };
export const ABSENCE_TYPE_LABELS: Record<string, string> = { MALADIE: 'Maladie', CONVENTIONNELLE: 'Conventionnelle', EXCEPTIONNELLE: 'Exceptionnelle' };
export const ABSENCE_TYPE_COLORS: Record<string, string> = { MALADIE: '#ef4444', CONVENTIONNELLE: '#10b981', EXCEPTIONNELLE: '#f59e0b' };
export const STATUS_COLORS: Record<string, string> = { PENDING: '#f59e0b', APPROVED: '#10b981', REJECTED: '#ef4444', CANCELLED: '#94a3b8' };
export const DEPT_PALETTE = ['#0ea5e9', '#f59e0b', '#8b5cf6', '#10b981', '#ef4444', '#ec4899', '#14b8a6', '#6366f1'];

/** Date « calendaire » d'un champ @db.Date (UTC minuit) → midi local, pour éviter les décalages de jour */
export const dateOnly = (iso: string | Date): Date => {
  const s = typeof iso === 'string' ? iso.slice(0, 10) : iso.toISOString().slice(0, 10);
  return new Date(`${s}T12:00:00`);
};

export const inPeriod = (d: Date | null | undefined, p: Period): boolean => {
  if (!d || isNaN(d.getTime())) return false;
  if (p.mode === 'all') return true;
  if (p.mode === 'year') return d.getFullYear() === p.year;
  if (p.mode === 'month') return d.getFullYear() === p.year && d.getMonth() + 1 === p.month;
  const t = d.getTime();
  if (p.from && t < new Date(`${p.from}T00:00:00`).getTime()) return false;
  if (p.to && t > new Date(`${p.to}T23:59:59`).getTime()) return false;
  return true;
};

export const fmtDay = (d?: Date | string | null) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
export const fmtHM = (d?: Date | string | null) =>
  d ? new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—';
export const fmtStamp = (d?: Date | string | null) =>
  d ? new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

/** Durée lisible depuis des minutes : « 35 min », « 3 h 05 », « 2 j 4 h » */
export const fmtMinutes = (min?: number | null): string => {
  if (min == null || !isFinite(min)) return '—';
  const m = Math.max(0, Math.round(min));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ${String(m % 60).padStart(2, '0')}`;
  return `${Math.floor(h / 24)} j ${h % 24} h`;
};

export const minutesBetween = (a?: string | Date | null, b?: string | Date | null): number | null => {
  if (!a || !b) return null;
  const v = (new Date(b).getTime() - new Date(a).getTime()) / 60000;
  return isFinite(v) ? v : null;
};

export const avg = (xs: number[]) => (xs.length ? xs.reduce((s, n) => s + n, 0) / xs.length : null);
export const pct = (n: number, total: number) => (total ? Math.round((n / total) * 1000) / 10 : 0);

export const userLabel = (u?: { firstName?: string | null; lastName?: string | null; email?: string | null } | null) => {
  if (!u) return '—';
  const n = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim();
  return n || u.email || '—';
};

export interface HistoryRow {
  id: string;
  kind: RequestKind;
  employeeId?: string;
  name: string;
  dept: string;
  photoUrl?: string | null;
  number?: string | null;
  type: string;
  status: string;
  ref: Date;               // date de référence pour le filtre de période
  createdAt: Date;
  reviewedAt: Date | null;
  reviewer: string;
  reason: string;
  rejection?: string | null;
  when: string;            // ligne principale (créneau / dates)
  sub: string;             // ligne secondaire
  responseMin: number | null; // délai de réponse (création → décision)
  // permissions
  ret?: ReturnState;
  outMin?: number | null;       // durée réelle de sortie (validée)
  overrunMin?: number | null;   // dépassement par rapport au retour prévu
  adjusted?: boolean;
  declaredBy?: string;
  confirmedBy?: string;
  confirmedAt?: Date | null;
  declaredAt?: Date | null;
  // absences
  days?: number;
  raw: any;
}

export function permissionRow(t: any): HistoryRow {
  const dep = effectiveDeparture(t);
  const rs = returnState(t);
  const out = rs === 'CONFIRMED' ? minutesBetween(dep, t.actualReturnTime) : null;
  const overrun = rs === 'CONFIRMED' ? minutesBetween(t.expectedReturnTime, t.actualReturnTime) : null;
  const retTxt = rs === 'CONFIRMED' && t.actualReturnTime ? fmtHM(t.actualReturnTime) : `${fmtHM(t.expectedReturnTime)} (prévu)`;
  return {
    id: t.id, kind: 'permission', employeeId: t.employeeId,
    name: `${t.employee?.firstName ?? ''} ${t.employee?.lastName ?? ''}`.trim() || '—',
    dept: t.employee?.department?.name || 'Sans département',
    photoUrl: t.employee?.photoUrl, number: t.employee?.employeeNumber,
    type: t.type, status: t.status, ref: new Date(dep), createdAt: new Date(t.createdAt),
    reviewedAt: t.reviewedAt ? new Date(t.reviewedAt) : null,
    reviewer: t.reviewedByUser?.email || '—',
    reason: t.reason || '', rejection: t.rejectionReason,
    when: `${fmtDay(dep)} · ${fmtHM(dep)} → ${retTxt}`,
    sub: out != null ? `Sorti ${fmtMinutes(out)}` : (t.destination || ''),
    responseMin: minutesBetween(t.createdAt, t.reviewedAt),
    ret: rs, outMin: out, overrunMin: overrun, adjusted: !!t.timesAdjusted,
    declaredAt: t.returnDeclaredAt ? new Date(t.returnDeclaredAt) : null,
    confirmedAt: t.returnConfirmedAt ? new Date(t.returnConfirmedAt) : null,
    confirmedBy: userLabel(t.returnConfirmedByUser),
    declaredBy: t.employee ? `${t.employee.firstName ?? ''} ${t.employee.lastName ?? ''}`.trim() : '—',
    raw: t,
  };
}

export function absenceRow(r: any): HistoryRow {
  const start = dateOnly(r.startDate);
  const end = dateOnly(r.endDate);
  const days = Number(r.workingDays ?? 0);
  const created = r.requestedAt || r.createdAt;
  return {
    id: r.id, kind: 'absence', employeeId: r.employeeId,
    name: `${r.employee?.firstName ?? ''} ${r.employee?.lastName ?? ''}`.trim() || '—',
    dept: r.employee?.department?.name || 'Sans département',
    photoUrl: r.employee?.photoUrl, number: r.employee?.employeeNumber,
    type: r.type, status: r.status, ref: start, createdAt: new Date(created),
    reviewedAt: r.reviewedAt ? new Date(r.reviewedAt) : null,
    reviewer: r.reviewedByUser?.email || '—',
    reason: r.reason || '', rejection: r.rejectionReason,
    when: start.getTime() === end.getTime() ? fmtDay(start) : `${fmtDay(start)} → ${fmtDay(end)}`,
    sub: `${Number.isInteger(days) ? days : days.toFixed(1).replace('.', ',')} j ouvré(s)${r.isPaid ? ' · payé' : ''}`,
    responseMin: minutesBetween(created, r.reviewedAt),
    days, raw: r,
  };
}

export const toRows = (kind: RequestKind, list: any[]): HistoryRow[] =>
  (list || []).map(kind === 'permission' ? permissionRow : absenceRow);
