'use client';

// ============================================================================
// 📄 components/documents/RejectDocumentModal.tsx
// ============================================================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldX, AlertCircle } from 'lucide-react';

interface Document {
  id: string;
  name: string;
  employee?: { firstName: string; lastName: string };
}

interface Props {
  document: Document;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

const QUICK_REASONS = [
  'Document illisible ou de mauvaise qualité',
  'Document expiré ou non valide',
  'Document incomplet — pages manquantes',
  'Document ne correspond pas au type sélectionné',
  'Informations incorrectes ou incohérentes',
  'Signature ou tampon manquant',
];

export function RejectDocumentModal({ document: doc, onClose, onConfirm }: Props) {
  const [reason,    setReason]    = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setError('Le motif est obligatoire');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onConfirm(reason.trim());
    } catch (e: any) {
      setError(e?.message ?? 'Erreur lors du rejet');
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 8 }}
          animate={{ scale: 1,    opacity: 1, y: 0 }}
          exit={{ scale: 0.96,    opacity: 0, y: 8 }}
          onClick={e => e.stopPropagation()}
          className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-red-50 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                <ShieldX size={17} className="text-red-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white text-base">Rejeter le document</h2>
                <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[220px]">{doc.name}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Corps */}
          <div className="p-6 space-y-4">

            {/* Info employé */}
            {doc.employee && (
              <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl text-sm text-gray-600 dark:text-gray-400">
                Document de <span className="font-semibold text-gray-900 dark:text-white">
                  {doc.employee.firstName} {doc.employee.lastName}
                </span> — l'employé sera notifié du rejet et du motif.
              </div>
            )}

            {/* Motifs rapides */}
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Motifs fréquents
              </p>
              <div className="space-y-1.5">
                {QUICK_REASONS.map(r => (
                  <button
                    key={r}
                    onClick={() => setReason(r)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all border
                      ${reason === r
                        ? 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 font-medium'
                        : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                      }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Motif personnalisé */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                Ou saisir un motif personnalisé <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={e => { setReason(e.target.value); setError(null); }}
                placeholder="Précisez la raison du rejet..."
                rows={3}
                className={`w-full px-3 py-2.5 text-sm border rounded-xl bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 resize-none placeholder-gray-300
                  ${error ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-600'}`}
              />
              {error && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle size={11} /> {error}
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading || !reason.trim()}
              className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  En cours...
                </span>
              ) : (
                <>
                  <ShieldX size={15} />
                  Confirmer le rejet
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}