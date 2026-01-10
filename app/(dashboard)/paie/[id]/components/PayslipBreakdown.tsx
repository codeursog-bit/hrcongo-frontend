'use client';

import React from 'react';

interface PayrollItem {
  id: string;
  code: string;
  label: string;
  type: 'GAIN' | 'DEDUCTION' | 'EMPLOYER_COST';
  base?: number;
  rate?: number;
  amount: number;
  isTaxable: boolean;
  isCnss: boolean;
  order: number;
}

interface PayslipBreakdownProps {
  items: PayrollItem[];
  grossSalary: number;
  netSalary: number;
}

export default function PayslipBreakdown({ items, grossSalary, netSalary }: PayslipBreakdownProps) {
  const formatMoney = (val: number) => val?.toLocaleString('fr-FR') || '0';

  const gains = items.filter(i => i.type === 'GAIN' && i.amount > 0).sort((a, b) => a.order - b.order);
  const deductions = items.filter(i => i.type === 'DEDUCTION' && i.amount > 0).sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      {/* GAINS */}
      {gains.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-6 bg-emerald-500 rounded-full"></div>
            <h4 className="text-sm font-bold uppercase text-emerald-600 dark:text-emerald-400 print:text-emerald-700 tracking-wider">
              Rémunérations
            </h4>
          </div>
          <div className="space-y-2">
            {gains.map((item) => (
              <div 
                key={item.id} 
                className="flex justify-between items-start p-3 bg-emerald-50/50 dark:bg-emerald-900/10 print:bg-emerald-50 rounded-lg border border-emerald-100 dark:border-emerald-900/30 print:border-emerald-200"
              >
                <div className="flex-1">
                  <p className="font-bold text-sm text-gray-900 dark:text-white print:text-black">
                    {item.label}
                  </p>
                  {item.base && item.rate && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 print:text-gray-600 mt-0.5">
                      Base: {formatMoney(item.base)} FCFA × Taux: {(item.rate * 100).toFixed(0)}%
                    </p>
                  )}
                  <div className="flex gap-3 mt-1">
                    {item.isTaxable && (
                      <span className="text-xs px-2 py-0.5 bg-sky-100 dark:bg-sky-900/30 print:bg-sky-100 text-sky-700 dark:text-sky-400 print:text-sky-700 rounded-full">
                        Imposable
                      </span>
                    )}
                    {item.isCnss && (
                      <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 print:bg-purple-100 text-purple-700 dark:text-purple-400 print:text-purple-700 rounded-full">
                        Soumis CNSS
                      </span>
                    )}
                  </div>
                </div>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 print:text-emerald-700 text-right ml-4">
                  +{formatMoney(item.amount)}
                  <span className="text-xs font-normal ml-1">F</span>
                </span>
              </div>
            ))}
          </div>
          
          {/* TOTAL BRUT */}
          <div className="mt-4 p-4 bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/20 dark:to-green-900/20 print:from-emerald-100 print:to-green-100 rounded-xl border-2 border-emerald-200 dark:border-emerald-800 print:border-emerald-300">
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-900 dark:text-white print:text-black uppercase text-sm tracking-wide">
                Total Brut
              </span>
              <span className="font-mono font-bold text-2xl text-emerald-700 dark:text-emerald-400 print:text-emerald-800">
                {formatMoney(grossSalary)} <span className="text-sm font-normal">FCFA</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* DÉDUCTIONS */}
      {deductions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-6 bg-red-500 rounded-full"></div>
            <h4 className="text-sm font-bold uppercase text-red-600 dark:text-red-400 print:text-red-700 tracking-wider">
              Retenues & Cotisations
            </h4>
          </div>
          <div className="space-y-2">
            {deductions.map((item) => (
              <div 
                key={item.id} 
                className="flex justify-between items-start p-3 bg-red-50/50 dark:bg-red-900/10 print:bg-red-50 rounded-lg border border-red-100 dark:border-red-900/30 print:border-red-200"
              >
                <div className="flex-1">
                  <p className="font-bold text-sm text-gray-900 dark:text-white print:text-black">
                    {item.label}
                  </p>
                  {item.base && item.rate && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 print:text-gray-600 mt-0.5">
                      Assiette: {formatMoney(item.base)} FCFA × Taux: {(item.rate * 100).toFixed(2)}%
                    </p>
                  )}
                </div>
                <span className="font-mono font-bold text-red-600 dark:text-red-400 print:text-red-700 text-right ml-4">
                  -{formatMoney(item.amount)}
                  <span className="text-xs font-normal ml-1">F</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NET À PAYER */}
      <div className="pt-6 border-t-2 border-dashed border-gray-300 dark:border-gray-700 print:border-gray-400">
        <div className="p-6 bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-800 dark:to-black print:from-white print:to-gray-50 print:border-4 print:border-gray-900 rounded-2xl">
          <div className="flex justify-between items-end">
            <div>
              <span className="text-xs font-bold text-gray-400 dark:text-gray-500 print:text-gray-600 uppercase tracking-widest block mb-1">
                Net à Payer
              </span>
              <span className="text-sm text-gray-400 dark:text-gray-500 print:text-gray-700">
                (Montant versé à l'employé)
              </span>
            </div>
            <span className="text-4xl font-extrabold text-white dark:text-white print:text-black font-mono tracking-tight">
              {formatMoney(netSalary)} <span className="text-lg text-gray-400 dark:text-gray-500 print:text-gray-600 font-normal">FCFA</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
