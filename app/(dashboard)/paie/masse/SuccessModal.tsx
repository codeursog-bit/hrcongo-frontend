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
          <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-100 dark:border-gray-700 relative max-h-[90vh] flex flex-col">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-sky-500 rounded-t-3xl"></div>
            
            <div className="p-8 text-center border-b border-gray-100 dark:border-gray-700">
              <div className="mx-auto w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6 text-emerald-500">
                <CheckCircle2 size={48} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Traitement Terminé !</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                <span className="font-bold text-emerald-500">{results.success}</span> bulletins créés,{' '}
                <span className="font-bold text-orange-500">{results.skipped}</span> ignorés,{' '}
                <span className="font-bold text-red-500">{results.failed}</span> échecs.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
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
                        ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {detail.status === 'SUCCESS' && <CheckCircle2 size={20} className="text-emerald-500" />}
                        {detail.status === 'SKIPPED' && <AlertTriangle size={20} className="text-orange-500" />}
                        {detail.status === 'FAILED' && <X size={20} className="text-red-500" />}
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{detail.employeeName}</p>
                          {detail.reason && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">{detail.reason}</p>
                          )}
                        </div>
                      </div>
                      {detail.netSalary && (
                        <span className="font-mono text-sm font-bold text-gray-600 dark:text-gray-300">
                          {detail.netSalary.toLocaleString()} F
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex gap-3">
              <button 
                onClick={onNewBatch} 
                className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700"
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