'use client';

// ============================================================================
// 📁 components/loans/DocumentPreviewModal.tsx
// ✅ L'aperçu de la fiche imprimable ne prend plus de place dans le panneau
//    par défaut — masqué, affiché uniquement au clic sur "Aperçu de la
//    fiche", dans cette modal.
// ============================================================================

import React from 'react';
import { X, Eye } from 'lucide-react';

export default function DocumentPreviewModal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 p-4 flex items-center justify-between z-10">
          <p className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><Eye size={16} /> Aperçu de la fiche</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={20} /></button>
        </div>
        <div className="p-6 flex justify-center">
          <div className="w-[794px] shrink-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
