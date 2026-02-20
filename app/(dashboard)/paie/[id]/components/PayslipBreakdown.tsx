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
  totalDeductions?: number;
  // Champs pour les exemptions
  isSubjectToCnss?: boolean;
  isSubjectToIrpp?: boolean;
  // Primes
  bonuses?: any[];
}

export default function PayslipBreakdown({
  items, grossSalary, netSalary, totalDeductions,
  isSubjectToCnss = true, isSubjectToIrpp = true,
  bonuses = []
}: PayslipBreakdownProps) {
  const fmt = (val: number) => (val ?? 0).toLocaleString('fr-FR');

  const gains = items.filter(i => i.type === 'GAIN' && i.amount > 0).sort((a, b) => a.order - b.order);
  const deductions = items.filter(i => i.type === 'DEDUCTION' && i.amount > 0).sort((a, b) => a.order - b.order);
  
  // Primes depuis items (type GAIN avec code BONUS_*) ou depuis bonuses prop
  const bonusItems = bonuses.length > 0 ? bonuses : gains.filter(i => i.code?.startsWith('BONUS') || i.code?.startsWith('PRIME'));
  const salaryItems = gains.filter(i => !i.code?.startsWith('BONUS') && !i.code?.startsWith('PRIME'));

  // Trouver CNSS et IRPP dans les déductions
  const cnssItem = deductions.find(i => i.code === 'CNSS' || i.code?.includes('CNSS'));
  const irppItem = deductions.find(i => i.code === 'ITS' || i.code === 'IRPP' || i.code?.includes('ITS'));
  const otherDeductions = deductions.filter(i => i.id !== cnssItem?.id && i.id !== irppItem?.id);

  return (
    <div className="space-y-0 text-sm print:text-xs">

      {/* ═══════════════════════════════════════
          TABLEAU RÉMUNÉRATIONS
      ═══════════════════════════════════════ */}
      <div className="mb-6">
        {/* En-tête tableau */}
        <div className="grid grid-cols-12 bg-gray-800 dark:bg-gray-700 print:bg-gray-800 text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-t-lg">
          <div className="col-span-5">Désignation</div>
          <div className="col-span-2 text-right">Base (FCFA)</div>
          <div className="col-span-2 text-right">Taux</div>
          <div className="col-span-3 text-right">Montant (FCFA)</div>
        </div>

        {/* ── GAINS ── */}
        <div className="border border-gray-200 dark:border-gray-700 print:border-gray-400 border-t-0 rounded-b-lg overflow-hidden">
          
          {/* Sous-section gains */}
          <div className="bg-emerald-50 dark:bg-emerald-900/10 print:bg-emerald-50 px-4 py-1.5">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 print:text-emerald-700 uppercase tracking-wider">Rémunérations</span>
          </div>

          {salaryItems.length > 0 ? salaryItems.map((item, idx) => (
            <div key={item.id} className={`grid grid-cols-12 px-4 py-2.5 items-center ${idx % 2 === 0 ? 'bg-white dark:bg-gray-800 print:bg-white' : 'bg-gray-50/50 dark:bg-gray-850 print:bg-gray-50'} border-b border-gray-100 dark:border-gray-700/50 print:border-gray-300`}>
              <div className="col-span-5">
                <p className="font-semibold text-gray-900 dark:text-white print:text-black">{item.label}</p>
                <div className="flex gap-2 mt-0.5">
                  {item.isTaxable && <span className="text-[10px] px-1.5 py-0.5 bg-sky-100 dark:bg-sky-900/30 print:bg-sky-100 text-sky-700 dark:text-sky-400 print:text-sky-700 rounded">Imposable</span>}
                  {item.isCnss && <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 print:bg-purple-100 text-purple-700 dark:text-purple-400 print:text-purple-700 rounded">CNSS</span>}
                </div>
              </div>
              <div className="col-span-2 text-right font-mono text-gray-600 dark:text-gray-400 print:text-gray-700">{item.base ? fmt(item.base) : '—'}</div>
              <div className="col-span-2 text-right font-mono text-gray-600 dark:text-gray-400 print:text-gray-700">{item.rate ? `${(item.rate * 100).toFixed(0)}%` : '—'}</div>
              <div className="col-span-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 print:text-emerald-700">+{fmt(item.amount)}</div>
            </div>
          )) : (
            <div className="grid grid-cols-12 px-4 py-2.5 bg-white dark:bg-gray-800 print:bg-white border-b border-gray-100 dark:border-gray-700/50 print:border-gray-300">
              <div className="col-span-5 font-semibold text-gray-900 dark:text-white print:text-black">Salaire de base</div>
              <div className="col-span-2 text-right font-mono text-gray-600">—</div>
              <div className="col-span-2 text-right font-mono text-gray-600">—</div>
              <div className="col-span-3 text-right font-mono font-bold text-emerald-600">+{fmt(grossSalary)}</div>
            </div>
          )}

          {/* Primes */}
          {bonusItems.length > 0 && (
            <>
              <div className="bg-cyan-50 dark:bg-cyan-900/10 print:bg-cyan-50 px-4 py-1.5">
                <span className="text-xs font-bold text-cyan-700 dark:text-cyan-400 print:text-cyan-700 uppercase tracking-wider">Primes & Accessoires</span>
              </div>
              {bonusItems.map((b: any, idx: number) => (
                <div key={b.id || idx} className={`grid grid-cols-12 px-4 py-2.5 items-center ${idx % 2 === 0 ? 'bg-white dark:bg-gray-800 print:bg-white' : 'bg-gray-50/50 print:bg-gray-50'} border-b border-gray-100 dark:border-gray-700/50 print:border-gray-300`}>
                  <div className="col-span-5">
                    <p className="font-semibold text-gray-900 dark:text-white print:text-black">{b.label || b.bonusType}</p>
                    {b.description && <p className="text-xs text-gray-400">{b.description}</p>}
                  </div>
                  <div className="col-span-2 text-right font-mono text-gray-600">—</div>
                  <div className="col-span-2 text-right font-mono text-gray-600">{b.percentage ? `${b.percentage}%` : '—'}</div>
                  <div className="col-span-3 text-right font-mono font-bold text-cyan-600 dark:text-cyan-400 print:text-cyan-700">
                    +{fmt(b.amount || b.computedAmount || 0)}
                  </div>
                </div>
              ))}
            </>
          )}

          {/* TOTAL BRUT */}
          <div className="grid grid-cols-12 px-4 py-3 bg-emerald-500 text-white">
            <div className="col-span-9 font-bold uppercase tracking-wider text-sm">Total Brut</div>
            <div className="col-span-3 text-right font-mono font-bold text-xl">{fmt(grossSalary)}</div>
          </div>

          {/* ── DÉDUCTIONS ── */}
          <div className="bg-red-50 dark:bg-red-900/10 print:bg-red-50 px-4 py-1.5">
            <span className="text-xs font-bold text-red-700 dark:text-red-400 print:text-red-700 uppercase tracking-wider">Retenues & Cotisations Sociales</span>
          </div>

          {/* CNSS — toujours affiché, 0 si exempté */}
          <div className="grid grid-cols-12 px-4 py-2.5 items-center bg-white dark:bg-gray-800 print:bg-white border-b border-gray-100 dark:border-gray-700/50 print:border-gray-300">
            <div className="col-span-5">
              <p className="font-semibold text-gray-900 dark:text-white print:text-black">CNSS Salariale</p>
              <p className="text-xs text-gray-400">Caisse Nationale de Sécurité Sociale</p>
            </div>
            <div className="col-span-2 text-right font-mono text-gray-600">{fmt(grossSalary)}</div>
            <div className="col-span-2 text-right font-mono text-gray-600">
              {isSubjectToCnss ? (cnssItem?.rate ? `${(cnssItem.rate * 100).toFixed(0)}%` : '4%') : '0%'}
            </div>
            <div className={`col-span-3 text-right font-mono font-bold ${isSubjectToCnss ? 'text-red-500' : 'text-gray-400'}`}>
              {isSubjectToCnss
                ? (cnssItem ? `-${fmt(cnssItem.amount)}` : '—')
                : '0 (Exempté)'}
            </div>
          </div>

          {/* IRPP/ITS — toujours affiché, 0 si exempté */}
          <div className="grid grid-cols-12 px-4 py-2.5 items-center bg-gray-50/50 dark:bg-gray-850 print:bg-gray-50 border-b border-gray-100 dark:border-gray-700/50 print:border-gray-300">
            <div className="col-span-5">
              <p className="font-semibold text-gray-900 dark:text-white print:text-black">IRPP / ITS</p>
              <p className="text-xs text-gray-400">Impôt sur le revenu des personnes physiques</p>
            </div>
            <div className="col-span-2 text-right font-mono text-gray-600">{fmt(grossSalary - (cnssItem?.amount || 0))}</div>
            <div className="col-span-2 text-right font-mono text-gray-600">{isSubjectToIrpp ? 'Barème' : '0%'}</div>
            <div className={`col-span-3 text-right font-mono font-bold ${isSubjectToIrpp ? 'text-red-500' : 'text-gray-400'}`}>
              {isSubjectToIrpp
                ? (irppItem ? `-${fmt(irppItem.amount)}` : '—')
                : '0 (Exempté)'}
            </div>
          </div>

          {/* Autres déductions (prêts, avances) */}
          {otherDeductions.map((item, idx) => (
            <div key={item.id} className={`grid grid-cols-12 px-4 py-2.5 items-center ${idx % 2 === 0 ? 'bg-white dark:bg-gray-800 print:bg-white' : 'bg-gray-50/50 print:bg-gray-50'} border-b border-gray-100 dark:border-gray-700/50 print:border-gray-300`}>
              <div className="col-span-5">
                <p className="font-semibold text-gray-900 dark:text-white print:text-black">{item.label}</p>
              </div>
              <div className="col-span-2 text-right font-mono text-gray-600">{item.base ? fmt(item.base) : '—'}</div>
              <div className="col-span-2 text-right font-mono text-gray-600">{item.rate ? `${(item.rate * 100).toFixed(2)}%` : '—'}</div>
              <div className="col-span-3 text-right font-mono font-bold text-red-500">-{fmt(item.amount)}</div>
            </div>
          ))}

          {/* TOTAL RETENUES */}
          <div className="grid grid-cols-12 px-4 py-2.5 bg-red-100 dark:bg-red-900/20 print:bg-red-100 border-b border-gray-200 print:border-gray-400">
            <div className="col-span-9 font-bold text-red-800 dark:text-red-200 print:text-red-800 uppercase tracking-wider text-sm">Total Retenues</div>
            <div className="col-span-3 text-right font-mono font-bold text-red-600 dark:text-red-400 print:text-red-700">
              -{fmt(totalDeductions || deductions.reduce((s, i) => s + i.amount, 0))}
            </div>
          </div>

          {/* ─── NET À PAYER ─── */}
          <div className="bg-gradient-to-r from-gray-900 to-slate-800 print:bg-gray-900 p-5">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-0.5">Net à Payer</p>
                <p className="text-xs text-gray-500">(Montant net versé à l'employé)</p>
              </div>
              <div className="text-right">
                <span className="text-4xl font-extrabold text-white print:text-black font-mono tracking-tight">
                  {fmt(netSalary)}
                </span>
                <span className="text-base text-gray-400 font-normal ml-2">FCFA</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          RÉCAPITULATIF COTISATIONS
      ═══════════════════════════════════════ */}
      <div className="mt-6 grid grid-cols-2 gap-4 print:gap-2">
        <div className="p-4 bg-sky-50 dark:bg-sky-900/10 print:bg-sky-50 rounded-xl border border-sky-200 dark:border-sky-800 print:border-sky-300">
          <p className="text-xs font-bold text-sky-700 dark:text-sky-400 print:text-sky-700 uppercase mb-3 tracking-wider">Cotisations Salariales</p>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400 print:text-gray-700">CNSS (4%)</span>
              <span className="font-mono font-bold text-gray-900 dark:text-white print:text-black">
                {isSubjectToCnss ? `${fmt(cnssItem?.amount || 0)} F` : '0 F'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400 print:text-gray-700">IRPP / ITS</span>
              <span className="font-mono font-bold text-gray-900 dark:text-white print:text-black">
                {isSubjectToIrpp ? `${fmt(irppItem?.amount || 0)} F` : '0 F'}
              </span>
            </div>
            <div className="flex justify-between pt-1.5 border-t border-sky-200 dark:border-sky-700 print:border-sky-300">
              <span className="font-bold text-gray-800 dark:text-white print:text-black">Total salarié</span>
              <span className="font-mono font-bold text-sky-700 dark:text-sky-300 print:text-sky-700">
                {fmt((isSubjectToCnss ? (cnssItem?.amount || 0) : 0) + (isSubjectToIrpp ? (irppItem?.amount || 0) : 0))} F
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-purple-50 dark:bg-purple-900/10 print:bg-purple-50 rounded-xl border border-purple-200 dark:border-purple-800 print:border-purple-300">
          <p className="text-xs font-bold text-purple-700 dark:text-purple-400 print:text-purple-700 uppercase mb-3 tracking-wider">Récapitulatif Net</p>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400 print:text-gray-700">Salaire brut</span>
              <span className="font-mono font-bold text-gray-900 dark:text-white print:text-black">{fmt(grossSalary)} F</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400 print:text-gray-700">Total retenues</span>
              <span className="font-mono font-bold text-red-600 print:text-red-700">
                -{fmt(totalDeductions || deductions.reduce((s, i) => s + i.amount, 0))} F
              </span>
            </div>
            <div className="flex justify-between pt-1.5 border-t border-purple-200 dark:border-purple-700 print:border-purple-300">
              <span className="font-bold text-gray-800 dark:text-white print:text-black">NET</span>
              <span className="font-mono font-bold text-purple-700 dark:text-purple-300 print:text-purple-700">{fmt(netSalary)} F</span>
            </div>
          </div>
        </div>
      </div>

      {/* Signature */}
      <div className="mt-8 grid grid-cols-2 gap-12 print:mt-6">
        <div className="text-center">
          <div className="border-b-2 border-gray-300 dark:border-gray-600 print:border-gray-400 mb-2 h-12"/>
          <p className="text-xs text-gray-500 print:text-gray-600 font-medium">Signature de l'employeur</p>
          <p className="text-xs text-gray-400 print:text-gray-500">Cachet & signature</p>
        </div>
        <div className="text-center">
          <div className="border-b-2 border-gray-300 dark:border-gray-600 print:border-gray-400 mb-2 h-12"/>
          <p className="text-xs text-gray-500 print:text-gray-600 font-medium">Signature de l'employé</p>
          <p className="text-xs text-gray-400 print:text-gray-500">Lu et approuvé</p>
        </div>
      </div>
    </div>
  );
}