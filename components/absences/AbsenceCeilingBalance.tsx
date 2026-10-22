'use client';

// ============================================================================
// 📁 components/absences/AbsenceCeilingBalance.tsx
// ✅ Solde du plafond annuel de permissions exceptionnelles (convention
//    collective) : "il me reste X jours en 2026".
//
//  - Le compteur est PAR ANNÉE CIVILE : 2025 et 2026 ne se cumulent pas, il
//    repart à zéro chaque 1er janvier. Même règle que le blocage côté serveur
//    (GET /absence-requests/ceiling-balance).
//  - Employé : son propre solde. RH/Admin : passer `employeeId` pour voir celui
//    d'un employé. Un RH/Admin n'est jamais bloqué par le plafond (le solde
//    peut alors être négatif = dépassement).
//  - Ne rend rien si la convention de l'entreprise n'a pas de plafond.
// ============================================================================

import React, { useEffect, useState } from 'react';
import { CalendarCheck, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import { api } from '@/services/api';

export interface CeilingBalance {
  year: number;
  employeeId: string;
  /** null = la convention n'a pas de plafond annuel */
  ceiling: number | null;
  used: number;
  /** ceiling - used ; négatif = dépassement (enregistré par un RH/Admin) */
  remaining: number | null;
  exceeded: boolean;
  /** true pour un RH/Admin : aucun blocage pour lui */
  viewerExempt: boolean;
}

interface Props {
  /** RH/Admin uniquement : employé dont on veut le solde (sinon : le sien) */
  employeeId?: string;
  /** Année civile affichée (défaut : année en cours) */
  year?: number;
  /** Affiche les flèches ‹ › pour consulter une autre année (pas de cumul) */
  selectable?: boolean;
  /** Pour forcer un rechargement (ex. après l'envoi d'une demande) */
  refreshKey?: string | number;
  /** Remonte le solde chargé au parent (null = pas de plafond / erreur) */
  onLoaded?: (balance: CeilingBalance | null) => void;
  className?: string;
}

const fmtDays = (n: number) =>
  Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ',');

export default function AbsenceCeilingBalance({
  employeeId, year, selectable = false, refreshKey, onLoaded, className = '',
}: Props) {
  const currentYear = new Date().getFullYear();
  const [shownYear, setShownYear] = useState<number>(year ?? currentYear);
  const [balance, setBalance] = useState<CeilingBalance | null>(null);
  const [loading, setLoading] = useState(true);

  // Le parent peut changer l'année (ex. nouvelle date de départ) : on suit.
  useEffect(() => { if (year != null) setShownYear(year); }, [year]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const q = new URLSearchParams({ year: String(shownYear) });
        if (employeeId) q.set('employeeId', employeeId);
        const r = (await api.get(`/absence-requests/ceiling-balance?${q.toString()}`)) as CeilingBalance;
        if (cancelled) return;
        setBalance(r);
        onLoaded?.(r.ceiling != null ? r : null);
      } catch {
        if (cancelled) return;
        setBalance(null);
        onLoaded?.(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, shownYear, refreshKey]);

  if (loading && !balance) return null;
  if (!balance || balance.ceiling == null) return null;

  const { ceiling, used, remaining } = balance;
  const left = remaining ?? 0;
  const over = left < 0;
  const pct = Math.min(100, Math.max(0, (used / ceiling) * 100));
  const tone = over
    ? { bar: 'bg-red-500', text: 'text-red-600 dark:text-red-400', box: 'border-red-200 dark:border-red-800 bg-red-50/60 dark:bg-red-900/10' }
    : left === 0
      ? { bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', box: 'border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-900/10' }
      : { bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', box: 'border-[var(--border)] bg-[var(--surface)]' };

  return (
    <div className={`rounded-2xl border p-4 space-y-3 ${tone.box} ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
          <CalendarCheck size={14} />
          Permissions exceptionnelles
        </div>
        {selectable ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShownYear(y => y - 1)}
              className="p-1 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-muted)]"
              aria-label="Année précédente"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-bold text-[var(--text)] tabular-nums w-12 text-center">{shownYear}</span>
            <button
              type="button"
              onClick={() => setShownYear(y => y + 1)}
              disabled={shownYear >= currentYear + 1}
              className="p-1 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-muted)] disabled:opacity-30"
              aria-label="Année suivante"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        ) : (
          <span className="text-sm font-bold text-[var(--text)] tabular-nums">{shownYear}</span>
        )}
      </div>

      <div className="flex items-end justify-between gap-3">
        <div>
          <p className={`text-3xl font-bold leading-none ${tone.text}`}>
            {over ? `+${fmtDays(Math.abs(left))}` : fmtDays(left)}
            <span className="text-base font-semibold ml-1">j.</span>
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            {over ? 'de dépassement du plafond' : left === 0 ? 'plafond atteint' : 'restants'}
          </p>
        </div>
        <p className="text-sm text-[var(--text-muted)] text-right">
          <strong className="text-[var(--text)]">{fmtDays(used)}</strong> utilisés sur <strong className="text-[var(--text)]">{fmtDays(ceiling)}</strong>
        </p>
      </div>

      <div className="h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
        <div className={`h-full rounded-full transition-all ${tone.bar}`} style={{ width: `${pct}%` }} />
      </div>

      <p className="text-[11px] text-[var(--text-muted)] leading-snug">
        Plafond annuel fixé par la convention collective, compté sur l&apos;année civile {shownYear} : il repart à zéro chaque 1<sup>er</sup> janvier,
        sans report. Les demandes en attente sont comptées ; les refusées et annulées ne le sont pas.
      </p>

      {balance.viewerExempt && (
        <p className="flex items-start gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-300">
          <ShieldCheck size={13} className="shrink-0 mt-px" />
          <span>En tant que RH/Admin, vous n&apos;êtes jamais bloqué par ce plafond : vous pouvez enregistrer des demandes au-delà.</span>
        </p>
      )}
    </div>
  );
}