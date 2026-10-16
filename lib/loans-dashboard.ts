// ============================================================================
// 📁 lib/loans-dashboard.ts
// Types + helpers du tableau de bord Prêts · Avances.
// Aucun calcul métier ici : tout vient du back (/loans-dashboard).
// La période réutilise celle du dashboard effectifs (lib/workforce).
// ============================================================================

import { WfPeriodState, WfScopeMode, periodParams } from '@/lib/workforce';

export interface LdCount { label: string; count: number; amount: number }

export interface LdTotals {
  loansRequested: number; loansGranted: number; loansGrantedAmount: number; loansPending: number; loansRejected: number; loanAcceptanceRate: number;
  advancesRequested: number; advancesGranted: number; advancesGrantedAmount: number; advancesPending: number; advancesRejected: number; advanceAcceptanceRate: number;
  grantedAmount: number; borrowers: number; avgGrantedAmount: number; recoveredAmount: number; recoveryRate: number;
  repaidInPeriod: number; repaidPayroll: number; repaidCash: number;
  outstandingLoans: number; outstandingAdvances: number; outstandingTotal: number;
  indebtedEmployees: number; loansInProgress: number; advancesToRecover: number;
}

export interface LdDepartmentRow {
  label: string; indebted: number; outstandingLoans: number; outstandingAdvances: number; outstandingTotal: number;
}

export interface LdTopEmployee {
  id: string; fullName: string; department: string; companyName: string; value: number; extra: number;
}

export interface LdMonthPoint {
  month: number; year: number; label: string; short: string; key: string;
  loansGrantedAmount: number; advancesGrantedAmount: number; repaidAmount: number; loansGranted: number; advancesGranted: number;
}

export interface LdView {
  companyName: string;
  city: string;
  multi: boolean;
  companies: { id: string; name: string }[];
  warnings: string[];
  period: { mode: string; label: string; months: { month: number; year: number; label: string; short: string }[] };
  totals: LdTotals;
  loansByStatus: LdCount[];
  loansByNature: LdCount[];
  loansByType: LdCount[];
  advancesByStatus: LdCount[];
  repaymentsByMethod: LdCount[];
  departments: LdDepartmentRow[];
  topIndebted: LdTopEmployee[];
  evolution: LdMonthPoint[];
}

export interface LdScopeSelection {
  /** Mode portefeuille : 'ALL' ou un identifiant d'entreprise. */
  companies: string;
  /** Mode PME : identifiant de l'entreprise ouverte (depuis l'URL). */
  companyId?: string;
}

export function loansEndpoint(scope: WfScopeMode, kind: 'view' | 'export', p: WfPeriodState, sel: LdScopeSelection): string {
  const q = periodParams(p);
  if (scope === 'PORTFOLIO') q.set('companies', sel.companies || 'ALL');
  else if (sel.companyId) q.set('companyId', sel.companyId);
  const base = scope === 'PORTFOLIO' ? '/portfolio/loans-dashboard' : '/loans-dashboard';
  return `${base}${kind === 'export' ? '/export' : ''}?${q.toString()}`;
}

export function loansFileName(p: WfPeriodState, companyLabel: string): string {
  const clean = (s: string) =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40);
  const span =
    p.mode === 'MOIS' ? `${String(p.month).padStart(2, '0')}_${p.year}`
    : p.mode === 'ANNEE' ? `${p.year}`
    : `${p.fromYear}_${String(p.fromMonth).padStart(2, '0')}_a_${p.toYear}_${String(p.toMonth).padStart(2, '0')}`;
  return `Prets_Avances_${clean(companyLabel) || 'Entreprise'}_${span}.xlsx`;
}

export const pct = (x: number) => `${(x * 100).toFixed(2).replace('.', ',')} %`;
/** Montant complet : « 1 250 000 FCFA ». */
export const fcfa = (x: number) => `${Math.round(x).toLocaleString('fr-FR')} FCFA`;
/** Montant compact pour les étiquettes de graphiques : « 1,2 M », « 300 k ». */
export function short(x: number): string {
  const a = Math.abs(x);
  if (a >= 1_000_000) return `${(x / 1_000_000).toFixed(a >= 10_000_000 ? 0 : 1).replace('.', ',').replace(/,0$/, '')} M`;
  if (a >= 1_000) return `${Math.round(x / 1_000)} k`;
  return String(Math.round(x));
}