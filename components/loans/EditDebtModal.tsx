'use client';

// ============================================================================
// 📁 components/loans/EditDebtModal.tsx
// ✅ Modal d'édition d'un prêt ou d'une avance déjà existant(e) — corrige une
//    erreur de saisie (montant, mensualité, motif...) SANS avoir à supprimer
//    et resaisir toute la dette. Réservé ADMIN/SUPER_ADMIN côté backend.
// ============================================================================

import React, { useEffect, useState } from 'react';
import { Loader2, X, Pencil } from 'lucide-react';

const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

type DebtItem = {
  kind: 'loan' | 'advance';
  id: string;
  amount: number;
  monthlyRepayment?: number;
  deductMonth?: number;
  deductYear?: number;
  reason?: string;
};

type Props = {
  open: boolean;
  item: DebtItem | null;
  onClose: () => void;
  onSave: (id: string, kind: 'loan' | 'advance', data: any) => Promise<void>;
};

export default function EditDebtModal({ open, item, onClose, onSave }: Props) {
  const [amount, setAmount] = useState('');
  const [monthlyRepayment, setMonthlyRepayment] = useState('');
  const [deductMonth, setDeductMonth] = useState(1);
  const [deductYear, setDeductYear] = useState(new Date().getFullYear());
  const [reason, setReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (item) {
      setAmount(String(item.amount ?? ''));
      setMonthlyRepayment(String(item.monthlyRepayment ?? ''));
      setDeductMonth(item.deductMonth ?? new Date().getMonth() + 1);
      setDeductYear(item.deductYear ?? new Date().getFullYear());
      setReason(item.reason ?? '');
      setError('');
    }
  }, [item]);

  if (!open || !item) return null;

  const handleSave = async () => {
    const amountNum = Number(amount.replace(/[^\d.]/g, ''));
    if (!amountNum || amountNum <= 0) { setError('Montant invalide'); return; }
    if (item.kind === 'loan') {
      const monthlyNum = Number(monthlyRepayment.replace(/[^\d.]/g, ''));
      if (!monthlyNum || monthlyNum <= 0) { setError('Mensualité invalide'); return; }
    }
    setIsSaving(true);
    setError('');
    try {
      const data = item.kind === 'loan'
        ? { amount: amountNum, monthlyRepayment: Number(monthlyRepayment.replace(/[^\d.]/g, '')), reason }
        : { amount: amountNum, deductMonth, deductYear, reason };
      await onSave(item.id, item.kind, data);
    } catch (e: any) {
      setError(e?.message || 'Erreur lors de la modification');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
            <Pencil size={16} /> Modifier {item.kind === 'loan' ? 'le prêt' : "l'avance"}
          </p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Montant (FCFA)</label>
            <input type="text" inputMode="numeric" value={amount} onChange={e => setAmount(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-sm" />
          </div>

          {item.kind === 'loan' && (
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Remboursement mensuel (FCFA)</label>
              <input type="text" inputMode="numeric" value={monthlyRepayment} onChange={e => setMonthlyRepayment(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-sm" />
            </div>
          )}

          {item.kind === 'advance' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Mois de déduction</label>
                <select value={deductMonth} onChange={e => setDeductMonth(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-sm">
                  {MONTHS_FR.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Année</label>
                <input type="number" value={deductYear} onChange={e => setDeductYear(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-sm" />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Motif</label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
              className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-sm resize-none" />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <p className="text-[11px] text-gray-400 leading-snug">
            Si des remboursements ont déjà été enregistrés, seul le reste à rembourser est ajusté — l&apos;historique existant est conservé.
          </p>
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-semibold rounded-xl text-gray-600 dark:text-gray-300">
            Annuler
          </button>
          <button onClick={handleSave} disabled={isSaving} className="flex-1 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2">
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Pencil size={16} />} Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
