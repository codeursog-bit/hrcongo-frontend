'use client';

// ============================================================================
// 📁 components/loans/AmendmentTrace.tsx
// ✅ Traçabilité des modifications RH/Admin d'un prêt ou d'une avance :
//    montant demandé à l'origine → montant retenu, qui, quand. Partagé entre
//    la vue RH (liste + fiche), « Mon espace » (employé) et la fiche dette.
//    `item.amount` est TOUJOURS le montant retenu (celui qui sert à la paie).
// ============================================================================

import React from 'react';
import { Pencil, ArrowRight } from 'lucide-react';

const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const fmt = (n: number) => `${Number(n || 0).toLocaleString('fr-FR')} FCFA`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

/** Vrai si le montant retenu diffère de celui demandé à l'origine. */
export function wasAmended(item: any): boolean {
  return item?.requestedAmount != null && Number(item.requestedAmount) !== Number(item.amount);
}

/** Petite ligne « demandé 20 000 » à glisser sous un montant dans un tableau. */
export function RequestedHint({ item }: { item: any }) {
  if (!wasAmended(item)) return null;
  return (
    <span className="block text-[11px] font-medium text-amber-600 dark:text-amber-400 line-through decoration-amber-400/60" title="Montant demandé à l'origine">
      {fmt(Number(item.requestedAmount))}
    </span>
  );
}

/** Bandeau détaillé + historique des modifications (fiche détail / mon espace). */
export default function AmendmentTrace({ item, audience = 'hr' }: { item: any; audience?: 'hr' | 'employee' }) {
  const amendments: any[] = Array.isArray(item?.amendments) ? item.amendments : [];
  if (!wasAmended(item) && amendments.length === 0) return null;

  const requested = Number(item.requestedAmount ?? amendments[amendments.length - 1]?.oldAmount ?? item.amount);
  const last = amendments[0];

  return (
    <div className="rounded-2xl border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-900/15 p-4">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 mb-2">
        <Pencil size={13} /> {audience === 'employee' ? 'Montant ajusté par les RH' : 'Montant modifié'}
      </div>

      {wasAmended(item) && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--text)]">
          <span className="text-[var(--text-muted)]">Demandé</span>
          <span className="font-semibold line-through decoration-amber-500/70">{fmt(requested)}</span>
          <ArrowRight size={14} className="text-amber-600" />
          <span className="text-[var(--text-muted)]">Retenu</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">{fmt(Number(item.amount))}</span>
        </div>
      )}

      {amendments.length > 0 && (
        <ul className="mt-3 space-y-1.5 border-t border-amber-200/70 dark:border-amber-800/40 pt-3">
          {amendments.map((a: any) => {
            const parts: string[] = [];
            if (a.oldAmount != null && a.newAmount != null && Number(a.oldAmount) !== Number(a.newAmount))
              parts.push(`montant ${fmt(Number(a.oldAmount))} → ${fmt(Number(a.newAmount))}`);
            if (a.oldMonthlyRepayment != null && a.newMonthlyRepayment != null && Number(a.oldMonthlyRepayment) !== Number(a.newMonthlyRepayment))
              parts.push(`mensualité ${fmt(Number(a.oldMonthlyRepayment))} → ${fmt(Number(a.newMonthlyRepayment))}`);
            if ((a.oldDeductMonth != null && a.newDeductMonth != null && (a.oldDeductMonth !== a.newDeductMonth || a.oldDeductYear !== a.newDeductYear)))
              parts.push(`déduction ${MONTHS_FR[(a.oldDeductMonth || 1) - 1]} ${a.oldDeductYear} → ${MONTHS_FR[(a.newDeductMonth || 1) - 1]} ${a.newDeductYear}`);
            return (
              <li key={a.id} className="text-xs text-[var(--text-muted)]">
                <span className="font-semibold text-[var(--text)]">{fmtDate(a.createdAt)}</span>
                {a.modifiedByName ? ` · ${a.modifiedByName}` : ''}
                {a.modifiedByRole ? ` (${a.modifiedByRole === 'HR_MANAGER' ? 'RH' : 'Admin'})` : ''}
                {parts.length > 0 ? ` : ${parts.join(' ; ')}` : ''}
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-2 text-[11px] text-[var(--text-muted)]">
        {audience === 'employee'
          ? 'Le montant retenu est celui qui sera pris en compte pour le remboursement.'
          : last
            ? 'Le montant retenu remplace la demande initiale pour la paie et les cumuls.'
            : 'Le montant retenu remplace la demande initiale.'}
      </p>
    </div>
  );
}