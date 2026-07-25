'use client';

// ============================================================================
// 📁 components/documents/PrintAuthorizationModal.tsx
// ✅ Modale générique d'autorisation d'impression — utilisée pour congé,
//    absence, prêt et avance. Appelle simplement onConfirm(authorized) et
//    laisse la page appelante gérer l'appel API + le rechargement.
// ============================================================================

import { useState } from 'react';
import { Loader2, Printer } from 'lucide-react';

interface PrintAuthorizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (authorized: boolean) => Promise<void>;
  employeeName: string;
}

export function PrintAuthorizationModal({
  isOpen,
  onClose,
  onConfirm,
  employeeName,
}: PrintAuthorizationModalProps) {
  const [loading, setLoading] = useState<'yes' | 'no' | null>(null);

  if (!isOpen) return null;

  const handle = async (authorized: boolean) => {
    setLoading(authorized ? 'yes' : 'no');
    try {
      await onConfirm(authorized);
      onClose();
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center mb-4">
          <Printer size={18} className="text-sky-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Autoriser l&apos;impression ?
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Voulez-vous autoriser <strong>{employeeName || "l'employé"}</strong> à imprimer ce
          document désormais validé ?
        </p>
        <div className="flex gap-3 justify-end">
          <button
            disabled={loading !== null}
            onClick={() => handle(false)}
            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-semibold disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {loading === 'no' ? <Loader2 size={16} className="animate-spin" /> : 'Non'}
          </button>
          <button
            disabled={loading !== null}
            onClick={() => handle(true)}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
          >
            {loading === 'yes' ? <Loader2 size={16} className="animate-spin" /> : 'Oui, autoriser'}
          </button>
        </div>
      </div>
    </div>
  );
}