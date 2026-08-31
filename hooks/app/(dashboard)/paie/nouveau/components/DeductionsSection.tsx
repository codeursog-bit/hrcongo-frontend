'use client';
import React from 'react';
import { DollarSign, CreditCard, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';

interface Loan {
  id: string;
  remainingBalance: number;
  monthlyRepayment: number;
}

interface Advance {
  id: string;
  amount: number;
  createdAt: string;
}

interface DeductionsSectionProps {
  month: string;
  year: number;
  loans: Loan[];
  advances: Advance[];
  totalLoanDeduction: number;
  totalAdvanceDeduction: number;
}

export default function DeductionsSection({
  month,
  year,
  loans,
  advances,
  totalLoanDeduction,
  totalAdvanceDeduction
}: DeductionsSectionProps) {
  const formatNumber = (val: number): string => {
    return val.toLocaleString('fr-FR');
  };

  const hasDeductions = totalLoanDeduction > 0 || totalAdvanceDeduction > 0;

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/10 dark:to-pink-900/10 rounded-2xl border border-red-200 dark:border-red-800 p-6"
    >
      <h3 className="text-lg font-bold text-red-900 dark:text-red-200 mb-4 flex items-center gap-2">
        <DollarSign size={20} /> Déductions Programmées
      </h3>
      
      {hasDeductions ? (
        <>
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-900/30">
            <p className="text-sm text-red-800 dark:text-red-300 font-medium">
              ⚠️ Déductions détectées pour {month} {year}
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              Total à déduire : <span className="font-mono font-bold">{formatNumber(totalLoanDeduction + totalAdvanceDeduction)} FCFA</span>
            </p>
          </div>
          
          <div className="space-y-3">
            {loans.map((loan) => (
              <div key={loan.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg border border-red-100 dark:border-red-900/30">
                <div className="flex items-center gap-3">
                  <CreditCard size={16} className="text-red-500" />
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">Prêt #{loan.id.substring(0, 8)}</p>
                    <p className="text-xs text-gray-500">
                      Solde restant : {formatNumber(loan.remainingBalance)} FCFA
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-red-600">-{formatNumber(loan.monthlyRepayment)} FCFA</p>
                  <p className="text-xs text-gray-500">Mensualité</p>
                </div>
              </div>
            ))}
            
            {advances.map((adv) => (
              <div key={adv.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg border border-red-100 dark:border-red-900/30">
                <div className="flex items-center gap-3">
                  <Wallet size={16} className="text-red-500" />
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">Avance #{adv.id.substring(0, 8)}</p>
                    <p className="text-xs text-gray-500">
                      Accordée le {new Date(adv.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-red-600">-{formatNumber(adv.amount)} FCFA</p>
                  <p className="text-xs text-gray-500">Montant</p>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-6 text-gray-400">
          <p className="text-sm">✅ Aucune déduction programmée pour ce mois</p>
        </div>
      )}
    </motion.section>
  );
}