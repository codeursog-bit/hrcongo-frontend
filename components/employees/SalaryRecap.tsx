'use client';

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { api } from '@/services/api';

// ── RÉCAP SALAIRE — TOUJOURS CONTRACTUEL, JAMAIS PRORATISÉ ──────────────────
// Un seul mode, utilisé identiquement sur la fiche employé ET la page primes :
// appelle GET /employees/:id/salary-estimate (SalaryEstimateService), qui
// calcule le brut/net "si l'employé fait le mois complet" — indépendant du
// pointage réel. Le principe : cette page dit "on doit lui payer X net sur
// un brut de Y" — si l'employé s'absente un mois donné, ça ne change RIEN
// à cette page ; seul le bulletin réel de ce mois-là reflète l'absence
// (prorata des primes proratisées, jours non payés, etc.).
//
// - Sans `previewBonus` : reflète les primes MENSUELLES déjà enregistrées.
// - Avec `previewBonus` : ajoute la prime en cours de création (pas encore
//   sauvegardée) à son montant plein mois, pour montrer l'impact avant de
//   valider — toujours sans prorata, cohérent avec le reste.
export interface RecapBonus {
  bonusType: string;
  amount?: number | null;
  percentage?: number | null;
  unitAmount?: number | null;
  defaultQuantity?: number | null;
  quantityMode?: string | null;
  isTaxable?: boolean;
  isCnss?: boolean;
  frequency?: 'MONTHLY' | 'ANNUAL' | 'ONE_TIME';
}

interface PreviewBonusInput {
  bonusType: string;
  amount?: number;
  percentage?: number;
  isTaxable?: boolean;
  isCnss?: boolean;
}

export const SalaryRecap = ({
  employeeId,
  employee,
  bonuses,
  previewBonus,
  label,
}: {
  employeeId: string;
  employee: any;
  /** Non utilisé pour le calcul (fait côté backend) — seulement pour
   * déclencher un rafraîchissement quand la liste de primes change. */
  bonuses: RecapBonus[];
  previewBonus?: PreviewBonusInput;
  /** Libellé affiché au-dessus des montants */
  label?: string;
}) => {
  const [result, setResult]   = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(false);

  useEffect(() => {
    if (!employeeId || !employee) return;
    let cancelled = false;
    setLoading(true);
    setError(false);

    const baseSalary = Number(employee.baseSalary ?? 0);
    const params = new URLSearchParams();
    if (previewBonus) {
      const amount = previewBonus.amount != null
        ? previewBonus.amount
        : previewBonus.percentage != null
          ? Math.round((previewBonus.percentage / 100) * baseSalary)
          : 0;
      if (amount > 0) {
        params.set('previewAmount', String(amount));
        params.set('previewTaxable', String(previewBonus.isTaxable ?? true));
        params.set('previewCnss', String(previewBonus.isCnss ?? true));
      }
    }
    const qs = params.toString();

    const timer = setTimeout(async () => {
      try {
        const res = await api.get<any>(
          `/employees/${employeeId}/salary-estimate${qs ? `?${qs}` : ''}`,
        );
        if (!cancelled) setResult(res);
      } catch (e) {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, previewBonus ? 400 : 0); // debounce seulement en mode preview (saisie live)

    return () => { cancelled = true; clearTimeout(timer); };
  }, [
    employeeId, employee, bonuses,
    previewBonus?.amount, previewBonus?.percentage, previewBonus?.bonusType,
    previewBonus?.isTaxable, previewBonus?.isCnss,
  ]);

  if (error) return null; // silencieux — le récap est une aide, pas un bloquant

  const defaultLabel = previewBonus ? 'Brut / net (avec cette prime)' : 'Brut / net';

  return (
    <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold text-slate-500 dark:text-white uppercase tracking-wide">
          {label ?? defaultLabel}
        </p>
        {loading && <Loader2 size={13} className="animate-spin text-slate-400 dark:text-white" />}
      </div>
      {result ? (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-slate-500 dark:text-white uppercase font-bold">Brut</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white font-mono">
              {Number(result.grossSalary ?? 0).toLocaleString('fr-FR')} <span className="text-xs font-normal text-slate-500 dark:text-slate-200">FCFA</span>
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 dark:text-white uppercase font-bold">Net</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {Number(result.netSalary ?? 0).toLocaleString('fr-FR')} <span className="text-xs font-normal text-slate-500 dark:text-slate-200">FCFA</span>
            </p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500 dark:text-white italic">Calcul en cours…</p>
      )}
      <p className="text-[10px] text-slate-500 dark:text-slate-200 mt-2">
        Brut = salaire de base + primes mensuelles imposables. Net = brut moins CNSS, ITS et TOL. Montant contractuel — ne varie pas selon les jours travaillés ce mois-ci ; seul le bulletin réel applique le prorata des primes proratisées.
      </p>
    </div>
  );
};