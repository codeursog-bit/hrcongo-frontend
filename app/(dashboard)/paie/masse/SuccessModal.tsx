// ===========================
// FILE: SuccessModal.tsx
// ===========================
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Terminal, AlertTriangle, X } from 'lucide-react';

interface SuccessModalProps {
  show: boolean;
  results: { success: number; failed: number; skipped: number };
  processingDetails: any[];
  onClose: () => void;
  onNewBatch: () => void;
  onViewPayrolls: () => void;
}

export default function SuccessModal({ 
  show, 
  results, 
  processingDetails, 
  onClose, 
  onNewBatch, 
  onViewPayrolls 
}: SuccessModalProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
        >
          <div className="bg-[var(--surface)] rounded-3xl max-w-2xl w-full shadow-2xl border border-[var(--border)] relative max-h-[90vh] flex flex-col">
            <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500 rounded-t-3xl"></div>
            
            <div className="p-8 text-center border-b border-[var(--border)]">
              <div className="mx-auto w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6 text-emerald-500">
                <CheckCircle2 size={48} />
              </div>
              <h2 className="text-2xl font-bold text-[var(--text)] mb-2">Traitement Terminé !</h2>
              <p className="text-[var(--text-muted)] mb-4">
                <span className="font-bold text-emerald-500">{results.success}</span> bulletins créés,{' '}
                <span className="font-bold text-amber-500">{results.skipped}</span> ignorés,{' '}
                <span className="font-bold text-red-500">{results.failed}</span> échecs.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <h3 className="font-bold text-[var(--text)] mb-4 flex items-center gap-2">
                <Terminal size={18} />
                Détails du traitement
              </h3>
              <div className="space-y-2">
                {processingDetails.map((detail, i) => (
                  <div 
                    key={i}
                    className={`p-4 rounded-xl border ${
                      detail.status === 'SUCCESS' 
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' 
                        : detail.status === 'SKIPPED'
                        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {detail.status === 'SUCCESS' && <CheckCircle2 size={20} className="text-emerald-500" />}
                        {detail.status === 'SKIPPED' && <AlertTriangle size={20} className="text-amber-500" />}
                        {detail.status === 'FAILED' && <X size={20} className="text-red-500" />}
                        <div>
                          <p className="font-bold text-[var(--text)]">{detail.employeeName}</p>
                          {detail.reason && (
                            <p className="text-xs text-[var(--text-muted)]">{detail.reason}</p>
                          )}
                        </div>
                      </div>
                      {detail.netSalary && (
                        <span className="font-mono text-sm font-bold text-[var(--text-muted)]">
                          {detail.netSalary.toLocaleString()} F
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-[var(--border)] flex gap-3">
              <button 
                onClick={onNewBatch} 
                className="flex-1 py-3 border border-[var(--border)] rounded-xl font-bold hover:bg-[var(--surface-2)]"
              >
                Nouveau lot
              </button>
              <button 
                onClick={onViewPayrolls} 
                className="flex-1 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl shadow-lg hover:scale-105 transition-transform"
              >
                Voir bulletins
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}