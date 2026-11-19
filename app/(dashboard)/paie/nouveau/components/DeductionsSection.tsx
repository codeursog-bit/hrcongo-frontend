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
      className="bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))]  rounded-2xl border border-[var(--border)]  p-6"
    >
      <h3 className="text-lg font-semibold text-[var(--danger-text)]  mb-4 flex items-center gap-2">
        <DollarSign size={20} /> Déductions Programmées
      </h3>
      
      {hasDeductions ? (
        <>
          <div className="mb-4 p-3 bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))]  rounded-lg border border-[var(--border)] ">
            <p className="text-sm text-[var(--danger-text)]  font-medium">
              ⚠️ Déductions détectées pour {month} {year}
            </p>
            <p className="text-xs text-[var(--danger-text)]  mt-1">
              Total à déduire : <span className="font-mono font-semibold">{formatNumber(totalLoanDeduction + totalAdvanceDeduction)} FCFA</span>
            </p>
          </div>
          
          <div className="space-y-3">
            {loans.map((loan) => (
              <div key={loan.id} className="flex items-center justify-between bg-[var(--surface)] p-3 rounded-lg border border-[var(--border)] ">
                <div className="flex items-center gap-3">
                  <CreditCard size={16} className="text-[var(--danger-text)]" />
                  <div>
                    <p className="text-sm font-semibold text-[var(--text)]">Prêt #{loan.id.substring(0, 8)}</p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Solde restant : {formatNumber(loan.remainingBalance)} FCFA
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-semibold text-[var(--danger-text)]">-{formatNumber(loan.monthlyRepayment)} FCFA</p>
                  <p className="text-xs text-[var(--text-secondary)]">Mensualité</p>
                </div>
              </div>
            ))}
            
            {advances.map((adv) => (
              <div key={adv.id} className="flex items-center justify-between bg-[var(--surface)] p-3 rounded-lg border border-[var(--border)] ">
                <div className="flex items-center gap-3">
                  <Wallet size={16} className="text-[var(--danger-text)]" />
                  <div>
                    <p className="text-sm font-semibold text-[var(--text)]">Avance #{adv.id.substring(0, 8)}</p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Accordée le {new Date(adv.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-semibold text-[var(--danger-text)]">-{formatNumber(adv.amount)} FCFA</p>
                  <p className="text-xs text-[var(--text-secondary)]">Montant</p>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-6 text-[var(--text-secondary)]">
          <p className="text-sm">✅ Aucune déduction programmée pour ce mois</p>
        </div>
      )}
    </motion.section>
  );
}