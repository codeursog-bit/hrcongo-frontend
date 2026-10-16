// ============================================================================
// 📁 lib/workforce.ts
// Types + helpers partagés du tableau de bord effectifs (modèles ORCA / POWERMAN).
// Aucun calcul métier ici : tout vient du back (/workforce-dashboard).
// ============================================================================

export type WfModel = 'ORCA' | 'POWERMAN';
export type WfScopeMode = 'COMPANY' | 'PORTFOLIO';
export type WfPeriodMode = 'MOIS' | 'PLAGE' | 'ANNEE';

export const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

export interface WfPeriodState {
  mode: WfPeriodMode;
  month: number;
  year: number;
  fromMonth: number;
  fromYear: number;
  toMonth: number;
  toYear: number;
}

export function defaultPeriod(): WfPeriodState {
  const now = new Date();
  const m = now.getMonth() + 1;
  const y = now.getFullYear();
  return { mode: 'MOIS', month: m, year: y, fromMonth: 1, fromYear: y, toMonth: m, toYear: y };
}

/** Nombre de mois couverts (mois futurs exclus, comme côté back). */
export function monthsCount(p: WfPeriodState): number {
  const now = new Date();
  const curM = now.getMonth() + 1;
  const curY = now.getFullYear();
  let fm = 1, fy = p.year, tm = 12, ty = p.year;
  if (p.mode === 'MOIS') { fm = tm = p.month; fy = ty = p.year; }
  if (p.mode === 'PLAGE') { fm = p.fromMonth; fy = p.fromYear; tm = p.toMonth; ty = p.toYear; }
  if (ty > curY || (ty === curY && tm > curM)) { ty = curY; tm = curM; }
  if (fy > ty || (fy === ty && fm > tm)) return 0;
  return (ty - fy) * 12 + (tm - fm) + 1;
}

export function periodLabel(p: WfPeriodState): string {
  if (p.mode === 'MOIS') return `${MONTHS_FR[p.month - 1]} ${p.year}`;
  if (p.mode === 'ANNEE') return `Année ${p.year}`;
  return `${MONTHS_FR[p.fromMonth - 1]} ${p.fromYear} → ${MONTHS_FR[p.toMonth - 1]} ${p.toYear}`;
}

export function periodParams(p: WfPeriodState): URLSearchParams {
  const q = new URLSearchParams();
  q.set('mode', p.mode);
  if (p.mode === 'MOIS') { q.set('month', String(p.month)); q.set('year', String(p.year)); }
  if (p.mode === 'ANNEE') q.set('year', String(p.year));
  if (p.mode === 'PLAGE') {
    q.set('fromMonth', String(p.fromMonth)); q.set('fromYear', String(p.fromYear));
    q.set('toMonth', String(p.toMonth)); q.set('toYear', String(p.toYear));
  }
  return q;
}

export interface WfScopeSelection {
  /** Mode portefeuille : 'ALL' ou un identifiant d'entreprise. */
  companies: string;
  /** Mode PME : identifiant de l'entreprise ouverte (depuis l'URL). */
  companyId?: string;
}

export function endpointFor(scope: WfScopeMode, kind: 'view' | 'export', model: WfModel, p: WfPeriodState, sel: WfScopeSelection): string {
  const q = periodParams(p);
  q.set('model', model);
  if (scope === 'PORTFOLIO') q.set('companies', sel.companies || 'ALL');
  else if (sel.companyId) q.set('companyId', sel.companyId);
  const base = scope === 'PORTFOLIO' ? '/portfolio/workforce-dashboard' : '/workforce-dashboard';
  return `${base}${kind === 'export' ? '/export' : ''}?${q.toString()}`;
}

export function exportFileName(model: WfModel, p: WfPeriodState, companyLabel: string): string {
  const clean = (s: string) =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40);
  const span =
    p.mode === 'MOIS' ? `${String(p.month).padStart(2, '0')}_${p.year}`
    : p.mode === 'ANNEE' ? `${p.year}`
    : `${p.fromYear}_${String(p.fromMonth).padStart(2, '0')}_a_${p.toYear}_${String(p.toMonth).padStart(2, '0')}`;
  const prefix = model === 'ORCA' ? 'Effectif_ORCA' : 'TB_Effectifs_POWERMAN';
  return `${prefix}_${clean(companyLabel) || 'Entreprise'}_${span}.xlsx`;
}

// ─── Réponse du back (voir WorkforceDashboardView) ───────────────────────────

export interface WfCount { label: string; count: number }
export interface WfMonthLite { month: number; year: number; label: string; short: string }

export interface WfView {
  model: WfModel;
  companyName: string;
  city: string;
  multi: boolean;
  companies: { id: string; name: string }[];
  canSeeNet: boolean;
  warnings: string[];
  period: { mode: WfPeriodMode; label: string; months: WfMonthLite[] };
  current: {
    month: WfMonthLite;
    total: number;
    gender: { M: number; F: number; O: number };
    contract: { PERMANENT: number; EXPATRIE: number; STAGIAIRE: number; PRESTATAIRE: number };
    nationality: { nat: number; etr: number; natM: number; natF: number; etrM: number; etrF: number };
    functions: WfCount[];
    departments: WfCount[];
    csp: WfCount[];
    contractPowerman: WfCount[];
    cities: WfCount[];
    ageBuckets: { label: string; lo: number; hi: number; M: number; F: number }[];
    hires: number;
    departures: number;
    indicators: {
      hasAttendance: boolean;
      absenceDays: number;
      theoreticalDays: number;
      absenceCount: number;
      absenteeismRate: number;
      avgAbsenceDuration: number;
      presenceRate: number;
      departuresYtd: number;
      avgHeadcountYtd: number;
      turnover: number;
    };
  };
  evolution: (WfMonthLite & { total: number; M: number; F: number; hires: number; departures: number })[];
}

export const CONTRACT_LABEL_ORCA = {
  PERMANENT: 'CONTRAT PERMANENT LOCAL',
  EXPATRIE: "CONTRAT D'EXPATRIE (CDD)",
  STAGIAIRE: 'STAGIAIRE',
  PRESTATAIRE: 'CONTRAT DE PRESTATIONS',
} as const;