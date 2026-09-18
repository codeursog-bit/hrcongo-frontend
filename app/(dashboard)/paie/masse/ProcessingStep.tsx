// ===========================
// FILE: ProcessingStep.tsx
// ===========================
import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Activity, Terminal, Play, CheckCircle2, AlertTriangle, X } from 'lucide-react';

interface ProcessingStepProps {
  isProcessing: boolean;
  progress: number;
  currentEmployee: string;
  logs: string[];
  results: { success: number; failed: number; skipped: number };
  selectedCount: number;
  estimatedCost: number;
  onStart: () => void;
  onShowSummary: () => void;
}

export default function ProcessingStep({ 
  isProcessing, 
  progress, 
  currentEmployee, 
  logs, 
  results, 
  selectedCount, 
  estimatedCost, 
  onStart,
  onShowSummary
}: ProcessingStepProps) {
  // Debug
  React.useEffect(() => {
    console.log('🔍 ProcessingStep - isProcessing:', isProcessing, 'progress:', progress);
  }, [isProcessing, progress]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }} 
      className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto"
    >
      {isProcessing || progress > 0 ? (
        <div className="w-full space-y-8">
          <div className="relative w-48 h-48 mx-auto">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-100 dark:text-gray-700" />
              <circle 
                cx="96" cy="96" r="88" stroke="#10B981" strokeWidth="12" fill="transparent" 
                strokeDasharray={552} strokeDashoffset={552 - (552 * progress) / 100} 
                className="transition-all duration-500 ease-out drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Zap className="text-emerald-500 mb-2 animate-pulse" size={32} />
              <span className="text-4xl font-bold text-[var(--text)]">{progress}%</span>
            </div>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-6 py-3 mb-4">
              <Activity className="text-emerald-500 animate-pulse" size={18} />
              <span className="font-bold text-[var(--text)]">Traitement en cours...</span>
            </div>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 animate-pulse">{currentEmployee}</p>
          </div>
          
          <div className="w-full bg-gray-900 dark:bg-black rounded-2xl p-4 h-64 overflow-y-auto border border-gray-700 font-mono text-xs space-y-1 shadow-inner">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-800">
              <Terminal size={14} className="text-emerald-400" />
              <span className="text-emerald-400">PAYROLL_BATCH_PROCESSOR v2.0</span>
            </div>
            {logs.map((log, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-gray-300"
              >
                {log}
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
              <CheckCircle2 className="mx-auto text-emerald-500 mb-2" size={20} />
              <p className="text-2xl font-bold text-emerald-600">{results.success}</p>
              <p className="text-xs text-gray-500">Créés</p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
              <AlertTriangle className="mx-auto text-amber-500 mb-2" size={20} />
              <p className="text-2xl font-bold text-amber-600">{results.skipped}</p>
              <p className="text-xs text-gray-500">Ignorés</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
              <X className="mx-auto text-red-500 mb-2" size={20} />
              <p className="text-2xl font-bold text-red-600">{results.failed}</p>
              <p className="text-xs text-gray-500">Échecs</p>
            </div>
          </div>

          {(progress === 100 && !isProcessing) && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={onShowSummary}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-xl hover:scale-105 transition-all"
            >
              Voir le résumé complet
            </motion.button>
          )}
        </div>
      ) : (
        <div className="text-center">
          <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
            <Play size={40} className="ml-1"/>
          </div>
          <h2 className="text-3xl font-bold text-[var(--text)] mb-4">Prêt à lancer ?</h2>
          <p className="text-gray-500 text-lg mb-8 max-w-md mx-auto">
            Génération de <strong className="text-[var(--text)]">{selectedCount} bulletins</strong> pour <strong className="text-[var(--text)]">{estimatedCost.toLocaleString()} FCFA</strong>.
          </p>
          <button 
            onClick={onStart} 
            className="px-10 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-xl hover:scale-105 transition-all text-lg flex items-center justify-center gap-3 mx-auto"
          >
            <Zap size={24} /> Lancer le Traitement
          </button>
        </div>
      )}
    </motion.div>
  );
}