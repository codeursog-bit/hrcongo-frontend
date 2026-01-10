'use client';
import React from 'react';
import { Calculator, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PayrollCalculation {
  baseSalary: number;
  grossSalary: number;
  netSalary: number;
  cnssEmployee: number;
  its: number;
  overtimeTotal: number;
  overtimeAmount15?: number;
  overtimeAmount50?: number;
  loanDeductions: number;
  advanceDeductions: number;
  parametersUsed: {
    cnssRate: number;
  };
}

interface PayrollPreviewCardProps {
  calculation: PayrollCalculation | null;
  month: string;
  year: number;
  overtime15: number;
  overtime50: number;
  loansCount: number;
  advancesCount: number;
  onSubmit: () => void;
}

export default function PayrollPreviewCard({
  calculation,
  month,
  year,
  overtime15,
  overtime50,
  loansCount,
  advancesCount,
  onSubmit
}: PayrollPreviewCardProps) {
  const formatNumber = (val: number | undefined | null): string => {
    const num = Number(val) || 0;
    return num.toLocaleString('fr-FR');
  };

  return (
    <AnimatePresence mode="wait">
      {calculation ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gray-900 text-white p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 rounded-full blur-3xl opacity-20 -mr-10 -mt-10"></div>
            <h3 className="font-bold text-lg relative z-10">Aperçu du Net</h3>
            <p className="text-gray-400 text-sm relative z-10 capitalize">{month} {year}</p>
          </div>
          
          {/* Body */}
          <div className="p-6 space-y-4">
            {/* Salaire de Base */}
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Salaire de Base</span>
              <span className="font-mono font-bold text-gray-900 dark:text-white">
                {formatNumber(calculation.baseSalary)} FCFA
              </span>
            </div>
            
            {/* Heures Supplémentaires */}
            {calculation.overtimeTotal > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Heures Supplémentaires</span>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {overtime15 > 0 && `${overtime15}h (+15%) `}
                    {overtime50 > 0 && `${overtime50}h (+50%)`}
                  </p>
                </div>
                <span className="font-mono font-bold text-emerald-600">
                  +{formatNumber(calculation.overtimeTotal)} FCFA
                </span>
              </div>
            )}

            {/* Salaire Brut */}
            <div className="flex justify-between items-center py-2 bg-gray-50 dark:bg-gray-750/50 px-3 rounded-lg">
              <span className="font-bold text-gray-800 dark:text-gray-200">Salaire Brut</span>
              <span className="font-mono font-bold text-gray-900 dark:text-white">
                {formatNumber(calculation.grossSalary)} FCFA
              </span>
            </div>

            {/* Déductions */}
            <div className="space-y-2 pt-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Déductions</p>
              
              {/* CNSS */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-red-500">CNSS ({calculation.parametersUsed?.cnssRate || 4}%)</span>
                <span className="font-mono text-red-500">-{formatNumber(calculation.cnssEmployee)} FCFA</span>
              </div>
              
              {/* ITS */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-red-500">IRPP (ITS)</span>
                <span className="font-mono text-red-500">-{formatNumber(calculation.its)} FCFA</span>
              </div>
              
              {/* Prêts */}
              {calculation.loanDeductions > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <div>
                    <span className="text-red-500">Remboursement Prêts</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {loansCount} prêt{loansCount > 1 ? 's' : ''} actif{loansCount > 1 ? 's' : ''}
                    </p>
                  </div>
                  <span className="font-mono text-red-500">-{formatNumber(calculation.loanDeductions)} FCFA</span>
                </div>
              )}
              
              {/* Avances */}
              {calculation.advanceDeductions > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <div>
                    <span className="text-red-500">Avances sur Salaire</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {advancesCount} avance{advancesCount > 1 ? 's' : ''} à déduire
                    </p>
                  </div>
                  <span className="font-mono text-red-500">-{formatNumber(calculation.advanceDeductions)} FCFA</span>
                </div>
              )}
            </div>

            {/* Net à Payer */}
            <div className="pt-6 border-t-2 border-dashed border-gray-200 dark:border-gray-700 mt-4">
              <div className="flex justify-between items-end">
                <span className="text-sm font-bold text-gray-500 uppercase">Net à Payer</span>
                <span className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                  {formatNumber(calculation.netSalary)} <span className="text-base text-gray-400 font-normal">FCFA</span>
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-right">
                Période : {month} {year}
              </p>
            </div>
          </div>
          
          {/* Footer */}
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
            <button 
              onClick={onSubmit} 
              className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold hover:scale-[1.02] transition-transform shadow-lg flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={18}/> Confirmer & Enregistrer
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gray-50 dark:bg-gray-800/50 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl h-full min-h-[300px] flex flex-col items-center justify-center text-gray-400 p-8 text-center"
        >
          <Calculator size={48} className="mb-4 opacity-20" />
          <p>Sélectionnez un employé et lancez le calcul.</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}