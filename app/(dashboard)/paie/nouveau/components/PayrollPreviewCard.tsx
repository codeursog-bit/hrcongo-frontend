'use client';
import React from 'react';
import { Calculator, CheckCircle2, Gift, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PayrollCalculation {
  baseSalary: number;
  grossSalary: number;
  netSalary: number;
  cnssEmployee: number;
  its: number;
  overtimeTotal: number;
  overtimeAmount10?: number;
  overtimeAmount25?: number;
  overtimeAmount50?: number;
  overtimeAmount100?: number;
  bonusesTotal: number;
  bonuses: any[];
  loanDeductions: number;
  advanceDeductions: number;
  isSubjectToCnss: boolean;
  isSubjectToIrpp: boolean;
  parametersUsed: { cnssRate: number };
}

interface PayrollPreviewCardProps {
  calculation: PayrollCalculation | null;
  month: string;
  year: number;
  overtime10: number;
  overtime25: number;
  overtime50: number;
  overtime100: number;
  loansCount: number;
  advancesCount: number;
  onSubmit: () => void;
}

export default function PayrollPreviewCard({
  calculation, month, year,
  overtime10, overtime25, overtime50, overtime100,
  loansCount, advancesCount, onSubmit
}: PayrollPreviewCardProps) {
  const fmt = (val: number | undefined | null) => (Number(val) || 0).toLocaleString('fr-FR');

  return (
    <AnimatePresence mode="wait">
      {calculation ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden sticky top-6">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-900 to-slate-800 text-white p-6 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 80% 20%, #0ea5e9 0%, transparent 60%)'}}/>
            <h3 className="font-bold text-lg relative z-10">Aperçu du Bulletin</h3>
            <p className="text-gray-400 text-sm relative z-10 capitalize">{month} {year}</p>
          </div>
          
          <div className="p-6 space-y-3">
            {/* Salaire base */}
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400 text-sm">Salaire de base</span>
              <span className="font-mono font-bold text-gray-900 dark:text-white">{fmt(calculation.baseSalary)} F</span>
            </div>

            {/* ✅ 4 lignes HS distinctes */}
            {(calculation.overtimeAmount10 ?? 0) > 0 && (
              <div className="flex justify-between items-center py-1.5">
                <div>
                  <span className="text-gray-600 dark:text-gray-400 text-sm">HS +10%</span>
                  <p className="text-xs text-amber-600">{overtime10}h · 5 premières heures</p>
                </div>
                <span className="font-mono font-bold text-amber-600">+{fmt(calculation.overtimeAmount10)} F</span>
              </div>
            )}
            {(calculation.overtimeAmount25 ?? 0) > 0 && (
              <div className="flex justify-between items-center py-1.5">
                <div>
                  <span className="text-gray-600 dark:text-gray-400 text-sm">HS +25%</span>
                  <p className="text-xs text-orange-600">{overtime25}h · heures suivantes</p>
                </div>
                <span className="font-mono font-bold text-orange-600">+{fmt(calculation.overtimeAmount25)} F</span>
              </div>
            )}
            {(calculation.overtimeAmount50 ?? 0) > 0 && (
              <div className="flex justify-between items-center py-1.5">
                <div>
                  <span className="text-gray-600 dark:text-gray-400 text-sm flex items-center gap-1">
                    HS +50% <Moon size={11} className="text-purple-500" />
                  </span>
                  <p className="text-xs text-purple-600">{overtime50}h · nuit repos/férié</p>
                </div>
                <span className="font-mono font-bold text-purple-600">+{fmt(calculation.overtimeAmount50)} F</span>
              </div>
            )}
            {(calculation.overtimeAmount100 ?? 0) > 0 && (
              <div className="flex justify-between items-center py-1.5">
                <div>
                  <span className="text-gray-600 dark:text-gray-400 text-sm flex items-center gap-1">
                    HS +100% <Moon size={11} className="text-red-500" />
                  </span>
                  <p className="text-xs text-red-600">{overtime100}h · nuit dimanche/férié</p>
                </div>
                <span className="font-mono font-bold text-red-600">+{fmt(calculation.overtimeAmount100)} F</span>
              </div>
            )}
            {calculation.overtimeTotal > 0 && (
              <div className="flex justify-between items-center text-xs text-gray-500 pl-2 border-b border-gray-100 dark:border-gray-700 pb-2">
                <span>Sous-total heures sup.</span>
                <span className="font-mono font-bold text-emerald-600">+{fmt(calculation.overtimeTotal)} F</span>
              </div>
            )}

            {/* Primes */}
            {calculation.bonusesTotal > 0 && (
              <div className="py-2 border-b border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-600 dark:text-gray-400 text-sm flex items-center gap-1">
                    <Gift size={13} className="text-cyan-500" /> Primes
                  </span>
                  <span className="font-mono font-bold text-cyan-600">+{fmt(calculation.bonusesTotal)} F</span>
                </div>
                {calculation.bonuses.map((b: any) => (
                  <div key={b.id} className="flex justify-between text-xs text-gray-400 pl-4">
                    <span>{b.bonusType}</span>
                    <span className="font-mono">+{fmt(b.computedAmount)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Brut */}
            <div className="flex justify-between items-center py-2 bg-gray-50 dark:bg-gray-900/50 px-3 rounded-lg">
              <span className="font-bold text-gray-800 dark:text-gray-200 text-sm">Salaire Brut</span>
              <span className="font-mono font-bold text-gray-900 dark:text-white">{fmt(calculation.grossSalary)} F</span>
            </div>

            {/* Déductions */}
            <div className="space-y-2 pt-1">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Retenues</p>
              <div className="flex justify-between items-center text-sm">
                <span className={calculation.isSubjectToCnss ? 'text-red-500' : 'text-gray-400'}>
                  CNSS ({calculation.parametersUsed?.cnssRate || 0}%)
                </span>
                <span className={`font-mono ${calculation.isSubjectToCnss ? 'text-red-500' : 'text-gray-400'}`}>
                  {calculation.isSubjectToCnss ? `-${fmt(calculation.cnssEmployee)} F` : '0 F (exempté)'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className={calculation.isSubjectToIrpp ? 'text-red-500' : 'text-gray-400'}>
                  IRPP / ITS
                </span>
                <span className={`font-mono ${calculation.isSubjectToIrpp ? 'text-red-500' : 'text-gray-400'}`}>
                  {calculation.isSubjectToIrpp ? `-${fmt(calculation.its)} F` : '0 F (exempté)'}
                </span>
              </div>
              {calculation.loanDeductions > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-red-500">Prêts ({loansCount})</span>
                  <span className="font-mono text-red-500">-{fmt(calculation.loanDeductions)} F</span>
                </div>
              )}
              {calculation.advanceDeductions > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-red-500">Avances ({advancesCount})</span>
                  <span className="font-mono text-red-500">-{fmt(calculation.advanceDeductions)} F</span>
                </div>
              )}
            </div>

            {/* Net */}
            <div className="pt-4 border-t-2 border-dashed border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-end">
                <span className="text-xs font-bold text-gray-500 uppercase">Net à Payer</span>
                <span className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                  {fmt(calculation.netSalary)} <span className="text-sm text-gray-400 font-normal">FCFA</span>
                </span>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
            <button onClick={onSubmit}
              className="w-full py-3 bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-600 hover:to-emerald-600 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02]">
              <CheckCircle2 size={18} /> Confirmer & Enregistrer
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-gray-50 dark:bg-gray-800/50 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl min-h-[300px] flex flex-col items-center justify-center text-gray-400 p-8 text-center">
          <Calculator size={48} className="mb-4 opacity-20" />
          <p className="text-sm">Sélectionnez un employé et lancez le calcul.</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

