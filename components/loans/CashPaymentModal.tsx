'use client';

// ============================================================================
// 📁 components/loans/CashPaymentModal.tsx
// ✅ Modal unique pour enregistrer un paiement en espèces — remplace les
//    prompt() JS utilisés ailleurs (page Gestion, fiche employé du RH).
//    Même modèle partout : montant libre + raccourci "solder toute la dette".
// ============================================================================

import React, { useEffect, useState } from 'react';
import { Loader2, Wallet, X } from 'lucide-react';

const fmt = (n: number) => Math.round(n).toLocaleString('fr-FR') + ' FCFA';

type Props = {
  open: boolean;
  onClose: () => void;
  remaining: number;
  onConfirm: (amount: number) => Promise<void>;
};

export default function CashPaymentModal({ open, onClose, remaining, onConfirm }: Props) {
  const [amount, setAmount] = useState('');
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => { if (open) setAmount(''); }, [open]);

  if (!open) return null;

  const handleConfirm = async () => {
    const value = Number(amount.replace(/[^\d.]/g, ''));
    if (!value || value <= 0) { alert('Montant invalide'); return; }
    setIsPaying(true);
    try { await onConfirm(value); }
    finally { setIsPaying(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-[var(--surface)] rounded-2xl shadow-xl max-w-sm w-full p-6">
        <div className="flex items-center justify-between mb-1">
          <p className="font-bold text-[var(--text)] text-lg">Enregistrer un remboursement</p>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text)]"><X size={20} /></button>
        </div>
        <p className="text-sm text-[var(--text-muted)] mb-4">Reste dû : <span className="font-semibold text-amber-600">{fmt(remaining)}</span></p>
        <input
          type="text" inputMode="numeric" autoFocus value={amount} onChange={e => setAmount(e.target.value)}
          placeholder="Montant remboursé (FCFA)"
          className="w-full text-lg font-semibold p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] mb-3"
        />
        <button onClick={() => setAmount(String(remaining))} className="text-xs font-semibold text-emerald-600 hover:underline mb-4">
          Solder toute la dette ({fmt(remaining)})
        </button>
        <div className="flex gap-2">
          <button onClick={handleConfirm} disabled={isPaying} className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2">
            {isPaying ? <Loader2 size={16} className="animate-spin" /> : <Wallet size={16} />} Confirmer le remboursement
          </button>
        </div>
      </div>
    </div>
  );
}