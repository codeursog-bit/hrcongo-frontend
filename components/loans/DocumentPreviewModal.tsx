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
      <div onClick={e => e.stopPropagation()} className="bg-[var(--surface)] rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[var(--surface)] border-b border-[var(--border)] p-4 flex items-center justify-between z-10">
          <p className="font-bold text-[var(--text)] flex items-center gap-2"><Eye size={16} /> Aperçu de la fiche</p>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text)]"><X size={20} /></button>
        </div>
        <div className="p-6 flex justify-center">
          <div className="w-[794px] shrink-0">{children}</div>
        </div>
      </div>
    </div>
  );
}