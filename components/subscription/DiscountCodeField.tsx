// ============================================================================
// 🎟️ components/subscription/DiscountCodeField.tsx
// Saisie + vérification d'un code de réduction côté client.
// Appelle POST /subscriptions/discount/validate (n'enregistre rien) et remonte
// { code, percentOff } au parent, qui l'envoie ensuite avec /subscriptions/upgrade.
// ============================================================================

'use client';

import React, { useState } from 'react';
import { Tag, Loader2, X, CheckCircle2 } from 'lucide-react';
import { api } from '@/services/api';

export type AppliedDiscount = { code: string; percentOff: number };

/** Même arrondi que le serveur : montant - round(montant × % / 100). */
export function discountedPrice(price: number, percentOff?: number | null): number {
  if (!percentOff) return price;
  return price - Math.round((price * percentOff) / 100);
}

interface Props {
  /** Texte saisi (contrôlé par le parent, pour ne pas perdre un code tapé mais pas « appliqué ») */
  value: string;
  onChange: (v: string) => void;
  applied: AppliedDiscount | null;
  onApplied: (d: AppliedDiscount | null) => void;
  billingPeriod?: 'monthly' | 'yearly';
  className?: string;
}

export function DiscountCodeField({
  value, onChange, applied, onApplied, billingPeriod = 'monthly', className = '',
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const apply = async () => {
    const code = value.trim().toUpperCase();
    if (!code || loading) return;
    setLoading(true);
    setError('');
    try {
      // Le pourcentage ne dépend pas du plan : on vérifie le code sur un plan payant quelconque.
      const r = await api.post<{ code: string; percentOff: number }>(
        '/subscriptions/discount/validate',
        { code, plan: 'BASIC', billingPeriod },
      );
      onApplied({ code: r.code, percentOff: r.percentOff });
      onChange('');
    } catch (e: any) {
      onApplied(null);
      setError(e?.message || 'Code de réduction invalide');
    } finally {
      setLoading(false);
    }
  };

  const remove = () => {
    onApplied(null);
    onChange('');
    setError('');
  };

  if (applied) {
    return (
      <div className={`flex items-center justify-between gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 ${className}`}>
        <span className="flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 size={16} />
          <span className="font-mono">{applied.code}</span>
          <span>−{applied.percentOff} % appliqué</span>
        </span>
        <button
          type="button"
          onClick={remove}
          title="Retirer le code"
          aria-label="Retirer le code de réduction"
          className="p-1 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={value}
            onChange={(e) => { onChange(e.target.value.toUpperCase()); if (error) setError(''); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); apply(); } }}
            placeholder="Code de réduction (optionnel)"
            autoComplete="off"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm font-mono tracking-wide"
          />
        </div>
        <button
          type="button"
          onClick={apply}
          disabled={!value.trim() || loading}
          className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-900 text-white dark:bg-white dark:text-slate-900 disabled:opacity-40 flex items-center gap-2"
        >
          {loading && <Loader2 size={14} className="animate-spin" />} Appliquer
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  );
}