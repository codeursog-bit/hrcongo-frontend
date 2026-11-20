'use client';

// ============================================================================
// 📁 components/leave-overview/LeaveCalcBreakdown.tsx
// ✅ « Congé à payer » : pour chaque employé, les MOIS pris comme intervalle de
//    calcul de l'indemnité — visibles d'un coup d'œil (brut de chaque mois,
//    mois manquants, mois estimé, indemnité précédente ajoutée, diviseur).
// ============================================================================

import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

interface Item {
  year?: number; month?: number; label?: string; gross: number;
  kind: 'REAL' | 'CURRENT' | 'ESTIMATED' | 'INDEMNITY' | 'INDEMNITY_EXTRA' | 'OPENING' | 'MISSING' | 'FUTURE';
}
interface Cycle {
  from: string; to: string; isFirstCycle: boolean; divisor: number;
  sum: number; averageMonthly: number; days: number; amount: number; items: Item[];
}

const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const fr = (n: number) => Math.round(n).toLocaleString('fr-FR');
const fmtDay = (s: string) => {
  const [y, m] = s.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
};

const KIND: Record<Item['kind'], { label: string; cls: string }> = {
  REAL:            { label: 'Bulletin',            cls: 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-200' },
  CURRENT:         { label: 'Mois de paie',        cls: 'border-emerald-400 bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:border-emerald-700 dark:text-emerald-100' },
  ESTIMATED:       { label: 'Estimé',              cls: 'border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-200' },
  INDEMNITY:       { label: 'Indemnité versée',    cls: 'border-sky-300 bg-sky-50 text-sky-800 dark:bg-sky-900/20 dark:border-sky-800 dark:text-sky-200' },
  INDEMNITY_EXTRA: { label: 'Indemnité précédente',cls: 'border-sky-300 bg-sky-50 text-sky-800 dark:bg-sky-900/20 dark:border-sky-800 dark:text-sky-200' },
  OPENING:         { label: 'Cumul d’embauche',    cls: 'border-violet-300 bg-violet-50 text-violet-800 dark:bg-violet-900/20 dark:border-violet-800 dark:text-violet-200' },
  MISSING:         { label: 'Aucun bulletin',      cls: 'border-red-300 bg-red-50 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300' },
  FUTURE:          { label: 'Pas encore atteint',  cls: 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)]' },
};

export default function LeaveCalcBreakdown({ rows }: { rows: any[] }) {
  const withDetail = rows.filter((r) => Array.isArray(r.breakdown) && r.breakdown.length > 0);
  if (rows.length === 0) return null;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-bold text-[var(--text)]">Détail du calcul — mois pris en compte</p>
        <p className="text-xs text-[var(--text-muted)] mt-0.5 flex items-center gap-1.5">
          <Info size={12} /> Pour chaque employé : l’intervalle de mois retenu, le brut de chaque mois, puis somme ÷ diviseur.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 text-[11px]">
        {(['REAL', 'CURRENT', 'ESTIMATED', 'INDEMNITY', 'MISSING', 'FUTURE'] as const).map((k) => (
          <span key={k} className={`px-2 py-0.5 rounded-md border ${KIND[k].cls}`}>{KIND[k].label}</span>
        ))}
      </div>

      {withDetail.length === 0 && (
        <p className="text-sm text-[var(--text-muted)]">Aucun détail disponible pour ce mois.</p>
      )}

      {withDetail.map((r) => (
        <div key={r.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border)] flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-bold text-sm text-[var(--text)]">
                {r.employee?.firstName} {r.employee?.lastName}
                {r.isTheoretical && <span className="ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Prévu (pas encore planifié)</span>}
              </p>
              <p className="text-xs text-[var(--text-muted)]">{r.employee?.department?.name || r.employee?.position || '—'}</p>
            </div>
            <p className="text-sm font-bold text-[var(--text)]">{fr(Number(r.indemnityAmount || 0))} F</p>
          </div>

          {r.breakdown.map((c: Cycle, i: number) => {
            const real = c.items.filter((x) => x.kind === 'REAL' || x.kind === 'CURRENT').length;
            const missing = c.items.filter((x) => x.kind === 'MISSING');
            const estimated = c.items.some((x) => x.kind === 'ESTIMATED');
            return (
              <div key={i} className="p-4 space-y-3 border-b last:border-0 border-[var(--border)]">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
                  <span className="font-semibold text-[var(--text)]">Intervalle : {fmtDay(c.from)} → {fmtDay(c.to)}</span>
                  <span>{c.isFirstCycle ? 'Premier cycle (depuis l’embauche)' : 'Cycle suivant'}</span>
                  <span>{real} bulletin(s) pris{estimated ? ' · 1 mois estimé' : ''}</span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                  {c.items.map((it, j) => (
                    <div key={j} className={`rounded-lg border px-2.5 py-1.5 ${KIND[it.kind].cls}`} title={KIND[it.kind].label}>
                      <p className="text-[10px] font-semibold uppercase opacity-80">
                        {it.label ?? `${MONTHS[(it.month || 1) - 1]} ${it.year}`}
                      </p>
                      <p className="text-xs font-bold">
                        {it.kind === 'MISSING' || it.kind === 'FUTURE' ? '—' : `${fr(it.gross)} F`}
                      </p>
                    </div>
                  ))}
                </div>

                {missing.length > 0 && (
                  <p className="text-xs text-red-600 dark:text-red-400 flex items-start gap-1.5">
                    <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                    {missing.length} mois sans bulletin dans l’intervalle : {missing.map((m) => `${MONTHS[(m.month || 1) - 1]} ${m.year}`).join(', ')}. Ils comptent pour 0 dans la somme.
                  </p>
                )}

                <p className="text-xs text-[var(--text-muted)]">
                  Somme <strong className="text-[var(--text)]">{fr(c.sum)} F</strong> ÷ <strong className="text-[var(--text)]">{c.divisor}</strong>
                  {' '}= <strong className="text-[var(--text)]">{fr(c.averageMonthly)} F</strong>/mois
                  {' '}· {c.days} j × ({fr(c.averageMonthly)} ÷ 26) = <strong className="text-[var(--text)]">{fr(c.amount)} F</strong>
                </p>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}