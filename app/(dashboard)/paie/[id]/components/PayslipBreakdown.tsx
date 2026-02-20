// 'use client';

// import React from 'react';

// interface PayrollItem {
//   id: string;
//   code: string;
//   label: string;
//   type: 'GAIN' | 'DEDUCTION' | 'EMPLOYER_COST';
//   base?: number;
//   rate?: number;
//   amount: number;
//   isTaxable: boolean;
//   isCnss: boolean;
//   order: number;
// }

// interface PayslipBreakdownProps {
//   items: PayrollItem[];
//   grossSalary: number;
//   netSalary: number;
//   totalDeductions?: number;
//   // Champs pour les exemptions
//   isSubjectToCnss?: boolean;
//   isSubjectToIrpp?: boolean;
//   // Primes
//   bonuses?: any[];
// }

// export default function PayslipBreakdown({
//   items, grossSalary, netSalary, totalDeductions,
//   isSubjectToCnss = true, isSubjectToIrpp = true,
//   bonuses = []
// }: PayslipBreakdownProps) {
//   const fmt = (val: number) => (val ?? 0).toLocaleString('fr-FR');

//   const gains = items.filter(i => i.type === 'GAIN' && i.amount > 0).sort((a, b) => a.order - b.order);
//   const deductions = items.filter(i => i.type === 'DEDUCTION' && i.amount > 0).sort((a, b) => a.order - b.order);
  
//   // Primes depuis items (type GAIN avec code BONUS_*) ou depuis bonuses prop
//   const bonusItems = bonuses.length > 0 ? bonuses : gains.filter(i => i.code?.startsWith('BONUS') || i.code?.startsWith('PRIME'));
//   const salaryItems = gains.filter(i => !i.code?.startsWith('BONUS') && !i.code?.startsWith('PRIME'));

//   // Trouver CNSS et IRPP dans les déductions
//   const cnssItem = deductions.find(i => i.code === 'CNSS' || i.code?.includes('CNSS'));
//   const irppItem = deductions.find(i => i.code === 'ITS' || i.code === 'IRPP' || i.code?.includes('ITS'));
//   const otherDeductions = deductions.filter(i => i.id !== cnssItem?.id && i.id !== irppItem?.id);

//   return (
//     <div className="space-y-0 text-sm print:text-xs">

//       {/* ═══════════════════════════════════════
//           TABLEAU RÉMUNÉRATIONS
//       ═══════════════════════════════════════ */}
//       <div className="mb-6">
//         {/* En-tête tableau */}
//         <div className="grid grid-cols-12 bg-gray-800 dark:bg-gray-700 print:bg-gray-800 text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-t-lg">
//           <div className="col-span-5">Désignation</div>
//           <div className="col-span-2 text-right">Base (FCFA)</div>
//           <div className="col-span-2 text-right">Taux</div>
//           <div className="col-span-3 text-right">Montant (FCFA)</div>
//         </div>

//         {/* ── GAINS ── */}
//         <div className="border border-gray-200 dark:border-gray-700 print:border-gray-400 border-t-0 rounded-b-lg overflow-hidden">
          
//           {/* Sous-section gains */}
//           <div className="bg-emerald-50 dark:bg-emerald-900/10 print:bg-emerald-50 px-4 py-1.5">
//             <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 print:text-emerald-700 uppercase tracking-wider">Rémunérations</span>
//           </div>

//           {salaryItems.length > 0 ? salaryItems.map((item, idx) => (
//             <div key={item.id} className={`grid grid-cols-12 px-4 py-2.5 items-center ${idx % 2 === 0 ? 'bg-white dark:bg-gray-800 print:bg-white' : 'bg-gray-50/50 dark:bg-gray-850 print:bg-gray-50'} border-b border-gray-100 dark:border-gray-700/50 print:border-gray-300`}>
//               <div className="col-span-5">
//                 <p className="font-semibold text-gray-900 dark:text-white print:text-black">{item.label}</p>
//                 <div className="flex gap-2 mt-0.5">
//                   {item.isTaxable && <span className="text-[10px] px-1.5 py-0.5 bg-sky-100 dark:bg-sky-900/30 print:bg-sky-100 text-sky-700 dark:text-sky-400 print:text-sky-700 rounded">Imposable</span>}
//                   {item.isCnss && <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 print:bg-purple-100 text-purple-700 dark:text-purple-400 print:text-purple-700 rounded">CNSS</span>}
//                 </div>
//               </div>
//               <div className="col-span-2 text-right font-mono text-gray-600 dark:text-gray-400 print:text-gray-700">{item.base ? fmt(item.base) : '—'}</div>
//               <div className="col-span-2 text-right font-mono text-gray-600 dark:text-gray-400 print:text-gray-700">{item.rate ? `${(item.rate * 100).toFixed(0)}%` : '—'}</div>
//               <div className="col-span-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 print:text-emerald-700">+{fmt(item.amount)}</div>
//             </div>
//           )) : (
//             <div className="grid grid-cols-12 px-4 py-2.5 bg-white dark:bg-gray-800 print:bg-white border-b border-gray-100 dark:border-gray-700/50 print:border-gray-300">
//               <div className="col-span-5 font-semibold text-gray-900 dark:text-white print:text-black">Salaire de base</div>
//               <div className="col-span-2 text-right font-mono text-gray-600">—</div>
//               <div className="col-span-2 text-right font-mono text-gray-600">—</div>
//               <div className="col-span-3 text-right font-mono font-bold text-emerald-600">+{fmt(grossSalary)}</div>
//             </div>
//           )}

//           {/* Primes */}
//           {bonusItems.length > 0 && (
//             <>
//               <div className="bg-cyan-50 dark:bg-cyan-900/10 print:bg-cyan-50 px-4 py-1.5">
//                 <span className="text-xs font-bold text-cyan-700 dark:text-cyan-400 print:text-cyan-700 uppercase tracking-wider">Primes & Accessoires</span>
//               </div>
//               {bonusItems.map((b: any, idx: number) => (
//                 <div key={b.id || idx} className={`grid grid-cols-12 px-4 py-2.5 items-center ${idx % 2 === 0 ? 'bg-white dark:bg-gray-800 print:bg-white' : 'bg-gray-50/50 print:bg-gray-50'} border-b border-gray-100 dark:border-gray-700/50 print:border-gray-300`}>
//                   <div className="col-span-5">
//                     <p className="font-semibold text-gray-900 dark:text-white print:text-black">{b.label || b.bonusType}</p>
//                     {b.description && <p className="text-xs text-gray-400">{b.description}</p>}
//                   </div>
//                   <div className="col-span-2 text-right font-mono text-gray-600">—</div>
//                   <div className="col-span-2 text-right font-mono text-gray-600">{b.percentage ? `${b.percentage}%` : '—'}</div>
//                   <div className="col-span-3 text-right font-mono font-bold text-cyan-600 dark:text-cyan-400 print:text-cyan-700">
//                     +{fmt(b.amount || b.computedAmount || 0)}
//                   </div>
//                 </div>
//               ))}
//             </>
//           )}

//           {/* TOTAL BRUT */}
//           <div className="grid grid-cols-12 px-4 py-3 bg-emerald-500 text-white">
//             <div className="col-span-9 font-bold uppercase tracking-wider text-sm">Total Brut</div>
//             <div className="col-span-3 text-right font-mono font-bold text-xl">{fmt(grossSalary)}</div>
//           </div>

//           {/* ── DÉDUCTIONS ── */}
//           <div className="bg-red-50 dark:bg-red-900/10 print:bg-red-50 px-4 py-1.5">
//             <span className="text-xs font-bold text-red-700 dark:text-red-400 print:text-red-700 uppercase tracking-wider">Retenues & Cotisations Sociales</span>
//           </div>

//           {/* CNSS — toujours affiché, 0 si exempté */}
//           <div className="grid grid-cols-12 px-4 py-2.5 items-center bg-white dark:bg-gray-800 print:bg-white border-b border-gray-100 dark:border-gray-700/50 print:border-gray-300">
//             <div className="col-span-5">
//               <p className="font-semibold text-gray-900 dark:text-white print:text-black">CNSS Salariale</p>
//               <p className="text-xs text-gray-400">Caisse Nationale de Sécurité Sociale</p>
//             </div>
//             <div className="col-span-2 text-right font-mono text-gray-600">{fmt(grossSalary)}</div>
//             <div className="col-span-2 text-right font-mono text-gray-600">
//               {isSubjectToCnss ? (cnssItem?.rate ? `${(cnssItem.rate * 100).toFixed(0)}%` : '4%') : '0%'}
//             </div>
//             <div className={`col-span-3 text-right font-mono font-bold ${isSubjectToCnss ? 'text-red-500' : 'text-gray-400'}`}>
//               {isSubjectToCnss
//                 ? (cnssItem ? `-${fmt(cnssItem.amount)}` : '—')
//                 : '0 (Exempté)'}
//             </div>
//           </div>

//           {/* IRPP/ITS — toujours affiché, 0 si exempté */}
//           <div className="grid grid-cols-12 px-4 py-2.5 items-center bg-gray-50/50 dark:bg-gray-850 print:bg-gray-50 border-b border-gray-100 dark:border-gray-700/50 print:border-gray-300">
//             <div className="col-span-5">
//               <p className="font-semibold text-gray-900 dark:text-white print:text-black">IRPP / ITS</p>
//               <p className="text-xs text-gray-400">Impôt sur le revenu des personnes physiques</p>
//             </div>
//             <div className="col-span-2 text-right font-mono text-gray-600">{fmt(grossSalary - (cnssItem?.amount || 0))}</div>
//             <div className="col-span-2 text-right font-mono text-gray-600">{isSubjectToIrpp ? 'Barème' : '0%'}</div>
//             <div className={`col-span-3 text-right font-mono font-bold ${isSubjectToIrpp ? 'text-red-500' : 'text-gray-400'}`}>
//               {isSubjectToIrpp
//                 ? (irppItem ? `-${fmt(irppItem.amount)}` : '—')
//                 : '0 (Exempté)'}
//             </div>
//           </div>

//           {/* Autres déductions (prêts, avances) */}
//           {otherDeductions.map((item, idx) => (
//             <div key={item.id} className={`grid grid-cols-12 px-4 py-2.5 items-center ${idx % 2 === 0 ? 'bg-white dark:bg-gray-800 print:bg-white' : 'bg-gray-50/50 print:bg-gray-50'} border-b border-gray-100 dark:border-gray-700/50 print:border-gray-300`}>
//               <div className="col-span-5">
//                 <p className="font-semibold text-gray-900 dark:text-white print:text-black">{item.label}</p>
//               </div>
//               <div className="col-span-2 text-right font-mono text-gray-600">{item.base ? fmt(item.base) : '—'}</div>
//               <div className="col-span-2 text-right font-mono text-gray-600">{item.rate ? `${(item.rate * 100).toFixed(2)}%` : '—'}</div>
//               <div className="col-span-3 text-right font-mono font-bold text-red-500">-{fmt(item.amount)}</div>
//             </div>
//           ))}

//           {/* TOTAL RETENUES */}
//           <div className="grid grid-cols-12 px-4 py-2.5 bg-red-100 dark:bg-red-900/20 print:bg-red-100 border-b border-gray-200 print:border-gray-400">
//             <div className="col-span-9 font-bold text-red-800 dark:text-red-200 print:text-red-800 uppercase tracking-wider text-sm">Total Retenues</div>
//             <div className="col-span-3 text-right font-mono font-bold text-red-600 dark:text-red-400 print:text-red-700">
//               -{fmt(totalDeductions || deductions.reduce((s, i) => s + i.amount, 0))}
//             </div>
//           </div>

//           {/* ─── NET À PAYER ─── */}
//           <div className="bg-gradient-to-r from-gray-900 to-slate-800 print:bg-gray-900 p-5">
//             <div className="flex justify-between items-center">
//               <div>
//                 <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-0.5">Net à Payer</p>
//                 <p className="text-xs text-gray-500">(Montant net versé à l'employé)</p>
//               </div>
//               <div className="text-right">
//                 <span className="text-4xl font-extrabold text-white print:text-black font-mono tracking-tight">
//                   {fmt(netSalary)}
//                 </span>
//                 <span className="text-base text-gray-400 font-normal ml-2">FCFA</span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* ═══════════════════════════════════════
//           RÉCAPITULATIF COTISATIONS
//       ═══════════════════════════════════════ */}
//       <div className="mt-6 grid grid-cols-2 gap-4 print:gap-2">
//         <div className="p-4 bg-sky-50 dark:bg-sky-900/10 print:bg-sky-50 rounded-xl border border-sky-200 dark:border-sky-800 print:border-sky-300">
//           <p className="text-xs font-bold text-sky-700 dark:text-sky-400 print:text-sky-700 uppercase mb-3 tracking-wider">Cotisations Salariales</p>
//           <div className="space-y-1.5 text-sm">
//             <div className="flex justify-between">
//               <span className="text-gray-600 dark:text-gray-400 print:text-gray-700">CNSS (4%)</span>
//               <span className="font-mono font-bold text-gray-900 dark:text-white print:text-black">
//                 {isSubjectToCnss ? `${fmt(cnssItem?.amount || 0)} F` : '0 F'}
//               </span>
//             </div>
//             <div className="flex justify-between">
//               <span className="text-gray-600 dark:text-gray-400 print:text-gray-700">IRPP / ITS</span>
//               <span className="font-mono font-bold text-gray-900 dark:text-white print:text-black">
//                 {isSubjectToIrpp ? `${fmt(irppItem?.amount || 0)} F` : '0 F'}
//               </span>
//             </div>
//             <div className="flex justify-between pt-1.5 border-t border-sky-200 dark:border-sky-700 print:border-sky-300">
//               <span className="font-bold text-gray-800 dark:text-white print:text-black">Total salarié</span>
//               <span className="font-mono font-bold text-sky-700 dark:text-sky-300 print:text-sky-700">
//                 {fmt((isSubjectToCnss ? (cnssItem?.amount || 0) : 0) + (isSubjectToIrpp ? (irppItem?.amount || 0) : 0))} F
//               </span>
//             </div>
//           </div>
//         </div>

//         <div className="p-4 bg-purple-50 dark:bg-purple-900/10 print:bg-purple-50 rounded-xl border border-purple-200 dark:border-purple-800 print:border-purple-300">
//           <p className="text-xs font-bold text-purple-700 dark:text-purple-400 print:text-purple-700 uppercase mb-3 tracking-wider">Récapitulatif Net</p>
//           <div className="space-y-1.5 text-sm">
//             <div className="flex justify-between">
//               <span className="text-gray-600 dark:text-gray-400 print:text-gray-700">Salaire brut</span>
//               <span className="font-mono font-bold text-gray-900 dark:text-white print:text-black">{fmt(grossSalary)} F</span>
//             </div>
//             <div className="flex justify-between">
//               <span className="text-gray-600 dark:text-gray-400 print:text-gray-700">Total retenues</span>
//               <span className="font-mono font-bold text-red-600 print:text-red-700">
//                 -{fmt(totalDeductions || deductions.reduce((s, i) => s + i.amount, 0))} F
//               </span>
//             </div>
//             <div className="flex justify-between pt-1.5 border-t border-purple-200 dark:border-purple-700 print:border-purple-300">
//               <span className="font-bold text-gray-800 dark:text-white print:text-black">NET</span>
//               <span className="font-mono font-bold text-purple-700 dark:text-purple-300 print:text-purple-700">{fmt(netSalary)} F</span>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Signature */}
//       <div className="mt-8 grid grid-cols-2 gap-12 print:mt-6">
//         <div className="text-center">
//           <div className="border-b-2 border-gray-300 dark:border-gray-600 print:border-gray-400 mb-2 h-12"/>
//           <p className="text-xs text-gray-500 print:text-gray-600 font-medium">Signature de l'employeur</p>
//           <p className="text-xs text-gray-400 print:text-gray-500">Cachet & signature</p>
//         </div>
//         <div className="text-center">
//           <div className="border-b-2 border-gray-300 dark:border-gray-600 print:border-gray-400 mb-2 h-12"/>
//           <p className="text-xs text-gray-500 print:text-gray-600 font-medium">Signature de l'employé</p>
//           <p className="text-xs text-gray-400 print:text-gray-500">Lu et approuvé</p>
//         </div>
//       </div>
//     </div>
//   );
// }


'use client';

import React from 'react';

interface PayrollItem {
  id: string; code: string; label: string;
  type: 'GAIN' | 'DEDUCTION' | 'EMPLOYER_COST';
  base?: number; rate?: number; amount: number;
  isTaxable: boolean; isCnss: boolean; order: number;
}

interface Props {
  items: PayrollItem[];
  grossSalary: number;
  netSalary: number;
  totalDeductions?: number;
  isSubjectToCnss?: boolean;
  isSubjectToIrpp?: boolean;
  bonuses?: any[];
  absenceDeduction?: number;
  absenceDays?: number;
  workDays?: number;
}

export default function PayslipBreakdown({
  items, grossSalary, netSalary, totalDeductions,
  isSubjectToCnss = true, isSubjectToIrpp = true,
  bonuses = [], absenceDeduction = 0, absenceDays = 0, workDays = 26,
}: Props) {
  const fmt = (v: number) => Math.round(v ?? 0).toLocaleString('fr-FR');

  const gains      = items.filter(i => i.type === 'GAIN').sort((a, b) => a.order - b.order);
  const deductions = items.filter(i => i.type === 'DEDUCTION').sort((a, b) => a.order - b.order);

  const isOT    = (i: PayrollItem) => ['OT','OVERTIME','HS','HEURE'].some(k => i.code?.toUpperCase().includes(k));
  const isBonus = (i: PayrollItem) => ['BONUS','PRIME','TRANSPORT','PANIER','INDEMNITE'].some(k => i.code?.toUpperCase().includes(k));

  const salaryItems = gains.filter(i => !isOT(i) && !isBonus(i));
  const otItems     = gains.filter(isOT);
  const bonusItems  = bonuses.length > 0 ? bonuses : gains.filter(isBonus);

  const cnssItem = deductions.find(i => i.code?.toUpperCase().includes('CNSS'));
  const irppItem = deductions.find(i => ['ITS','IRPP'].some(k => i.code?.toUpperCase().includes(k)));
  const extraDed = deductions.filter(i =>
    i.id !== cnssItem?.id && i.id !== irppItem?.id &&
    !i.code?.toUpperCase().includes('ABSENCE') && !i.label?.toLowerCase().includes('absence')
  );

  const cnssAmt  = isSubjectToCnss ? (cnssItem?.amount ?? 0) : 0;
  const irppAmt  = isSubjectToIrpp ? (irppItem?.amount ?? 0) : 0;
  const totalRet = totalDeductions ?? deductions.reduce((s, i) => s + i.amount, 0);

  // Couleurs en inline styles (garantis au print)
  const C = {
    dark:    '#111827',
    green:   '#15803d',
    greenLt: '#f0fdf4',
    cyan:    '#0e7490',
    amber:   '#b45309',
    red:     '#b91c1c',
    redLt:   '#fef2f2',
    purple:  '#7e22ce',
    purpleLt:'#faf5ff',
    sky:     '#0369a1',
    gray50:  '#f9fafb',
    white:   '#ffffff',
    border:  '#e5e7eb',
    text:    '#111827',
    textSub: '#9ca3af',
  };

  let rowIdx = 0;
  const Row = ({
    label, sub, base, rate, amount, amtColor,
  }: { label: string; sub?: string; base?: string; rate?: string; amount: string; amtColor: string }) => {
    const bg = rowIdx++ % 2 === 0 ? C.white : C.gray50;
    return (
      <tr>
        <td style={{ background: bg, padding: '7px 14px', borderBottom: `1px solid ${C.border}`, verticalAlign: 'top' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: C.text, lineHeight: 1.3, margin: 0 }}>{label}</p>
          {sub && <p style={{ fontSize: '9.5px', color: C.textSub, marginTop: 2, lineHeight: 1.3 }}>{sub}</p>}
        </td>
        <td style={{ background: bg, padding: '7px 14px', borderBottom: `1px solid ${C.border}`, textAlign: 'right', verticalAlign: 'middle' }}>
          <span style={{ fontSize: '10px', fontFamily: 'monospace', color: C.textSub }}>{base ?? '—'}</span>
        </td>
        <td style={{ background: bg, padding: '7px 14px', borderBottom: `1px solid ${C.border}`, textAlign: 'right', verticalAlign: 'middle' }}>
          <span style={{ fontSize: '10px', fontFamily: 'monospace', color: C.textSub }}>{rate ?? '—'}</span>
        </td>
        <td style={{ background: bg, padding: '7px 14px', borderBottom: `1px solid ${C.border}`, textAlign: 'right', verticalAlign: 'middle', fontFamily: 'monospace', fontWeight: 700, fontSize: '11.5px', color: amtColor }}>
          {amount}
        </td>
      </tr>
    );
  };

  const Head = ({ label, bg }: { label: string; bg: string }) => (
    <tr>
      <td colSpan={4} style={{ background: bg, padding: '7px 14px' }}>
        <span style={{ fontSize: '9.5px', fontWeight: 900, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: C.white }}>
          {label}
        </span>
      </td>
    </tr>
  );

  return (
    <div style={{ width: '100%' }}>

      {/* ══ TABLEAU ══ */}
      <div style={{ width: '100%', borderRadius: 8, overflow: 'hidden', border: `1.5px solid ${C.border}` }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' as const }}>
          <colgroup>
            <col style={{ width: '46%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '21%' }} />
          </colgroup>

          <thead>
            <tr>
              {[
                { h: 'Désignation', align: 'left' as const },
                { h: 'Base (FCFA)',   align: 'right' as const },
                { h: 'Taux',         align: 'right' as const },
                { h: 'Montant (FCFA)', align: 'right' as const },
              ].map(({ h, align }) => (
                <th key={h} style={{
                  background: C.dark, padding: '10px 14px', textAlign: align,
                  fontSize: '9.5px', fontWeight: 900, textTransform: 'uppercase' as const,
                  letterSpacing: '0.1em', color: C.white,
                }}>{h}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {/* RÉMUNÉRATIONS */}
            <Head label="Rémunérations" bg={C.green} />

            {salaryItems.length > 0 ? salaryItems.map(i => (
              <Row key={i.id} label={i.label}
                base={i.base ? fmt(i.base) : undefined}
                rate={i.rate ? `${(i.rate * 100).toFixed(0)}%` : undefined}
                amount={`+${fmt(i.amount)}`} amtColor={C.green} />
            )) : (
              <Row label="Salaire de base"
                amount={`+${fmt(Math.max(0, grossSalary - bonusItems.reduce((s: number, b: any) => s + (b.amount || b.computedAmount || 0), 0) - otItems.reduce((s, i) => s + i.amount, 0)))}`}
                amtColor={C.green} />
            )}

            {/* ✅ ABSENCES → dans Rémunérations */}
            {absenceDays > 0 && absenceDeduction > 0 && (
              <Row
                label={`Déduction absences (${absenceDays} jour${absenceDays > 1 ? 's' : ''})`}
                sub={`Taux journalier : ${fmt(Math.round(absenceDeduction / absenceDays))} FCFA/j × ${absenceDays} j`}
                rate={`${absenceDays}/${workDays}`}
                amount={`−${fmt(absenceDeduction)}`} amtColor={C.amber} />
            )}

            {/* HEURES SUP */}
            {otItems.length > 0 && (
              <>
                <Head label="Heures Supplémentaires — Décret n°78-360" bg={C.amber} />
                {otItems.map(i => (
                  <Row key={i.id} label={i.label}
                    rate={i.rate ? `+${(i.rate * 100).toFixed(0)}%` : undefined}
                    amount={`+${fmt(i.amount)}`} amtColor={C.amber} />
                ))}
              </>
            )}

            {/* PRIMES */}
            {bonusItems.length > 0 && (
              <>
                <Head label="Primes & Accessoires" bg={C.cyan} />
                {bonusItems.map((b: any, idx: number) => (
                  <Row key={b.id ?? idx}
                    label={b.label || b.bonusType || b.code || 'Prime'}
                    sub={b.description || undefined}
                    rate={b.percentage ? `${b.percentage}%` : undefined}
                    amount={`+${fmt(b.amount || b.computedAmount || 0)}`} amtColor={C.cyan} />
                ))}
              </>
            )}

            {/* TOTAL BRUT */}
            <tr>
              <td colSpan={3} style={{ background: C.green, padding: '10px 14px', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: C.white }}>
                Total Brut
              </td>
              <td style={{ background: C.green, padding: '10px 14px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 900, fontSize: '16px', color: C.white }}>
                {fmt(grossSalary)}
              </td>
            </tr>

            {/* COTISATIONS */}
            <Head label="Cotisations & Retenues Salariales" bg={C.red} />

            <Row
              label="CNSS Salariale"
              sub="Caisse Nationale de Sécurité Sociale"
              base={fmt(Math.min(grossSalary, 1_200_000))}
              rate={isSubjectToCnss ? '4 %' : '—'}
              amount={isSubjectToCnss ? `−${fmt(cnssAmt)}` : '0 (Exempté)'}
              amtColor={isSubjectToCnss ? C.red : C.textSub} />

            <Row
              label="ITS — Impôt sur les Traitements et Salaires"
              sub="Barème progressif 2026 : 1% · 10% · 25% · 40% — Abattement forfaitaire 20%"
              base={fmt(grossSalary - cnssAmt)}
              rate={isSubjectToIrpp ? 'Barème' : '—'}
              amount={isSubjectToIrpp ? `−${fmt(irppAmt)}` : '0 (Exempté)'}
              amtColor={isSubjectToIrpp ? C.red : C.textSub} />

            {/* Prêts & avances */}
            {extraDed.length > 0 && (
              <>
                <Head label="Retenues Facultatives — Prêts & Avances" bg={C.purple} />
                {extraDed.map(i => (
                  <Row key={i.id} label={i.label}
                    base={i.base ? fmt(i.base) : undefined}
                    rate={i.rate ? `${(i.rate * 100).toFixed(2)}%` : undefined}
                    amount={`−${fmt(i.amount)}`} amtColor={C.purple} />
                ))}
              </>
            )}

            {/* TOTAL RETENUES */}
            <tr>
              <td colSpan={3} style={{ background: C.redLt, padding: '9px 14px', borderTop: `2px solid #fecaca`, fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase' as const, color: C.red }}>
                Total Retenues
              </td>
              <td style={{ background: C.redLt, padding: '9px 14px', borderTop: `2px solid #fecaca`, textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, fontSize: '12px', color: C.red }}>
                −{fmt(totalRet)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* NET À PAYER */}
        <div style={{ background: C.dark, padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.25em', color: '#9ca3af', marginBottom: 3 }}>Net à Payer</p>
            <p style={{ fontSize: '9px', color: '#6b7280' }}>Montant net versé à l'employé</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '30px', fontWeight: 900, fontFamily: 'monospace', letterSpacing: '-0.02em', color: C.white }}>
              {fmt(netSalary)}
            </span>
            <span style={{ marginLeft: 8, fontSize: '13px', color: '#6b7280' }}>FCFA</span>
          </div>
        </div>
      </div>

      {/* ══ RÉCAPITULATIF 2 COLONNES ══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14, width: '100%' }}>
        {[
          {
            headBg: C.sky, headLabel: 'Cotisations Salariales',
            rows: [
              { label: 'CNSS salariale (4 %)', val: fmt(cnssAmt) + ' F', color: C.text },
              { label: 'ITS — barème progressif 2026', val: fmt(irppAmt) + ' F', color: C.text },
            ],
            totalLabel: 'Total salarié', totalVal: fmt(cnssAmt + irppAmt) + ' F', totalColor: C.sky,
          },
          {
            headBg: C.purple, headLabel: 'Récapitulatif',
            rows: [
              { label: 'Salaire brut',   val: '+' + fmt(grossSalary) + ' F', color: C.green },
              { label: 'Total retenues', val: '−' + fmt(totalRet)    + ' F', color: C.red },
            ],
            totalLabel: 'Net à payer', totalVal: fmt(netSalary) + ' F', totalColor: C.purple,
          },
        ].map(card => (
          <div key={card.headLabel} style={{ borderRadius: 8, overflow: 'hidden', border: '1.5px solid #e5e7eb' }}>
            <div style={{ background: card.headBg, padding: '8px 14px' }}>
              <p style={{ fontSize: '9.5px', fontWeight: 900, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: C.white }}>
                {card.headLabel}
              </p>
            </div>
            <div style={{ background: C.white, padding: '10px 14px' }}>
              {card.rows.map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: '10.5px', color: '#6b7280' }}>{r.label}</span>
                  <span style={{ fontSize: '10.5px', fontFamily: 'monospace', fontWeight: 700, color: r.color }}>{r.val}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 7, borderTop: '1px solid #e5e7eb', marginTop: 2 }}>
                <span style={{ fontSize: '10.5px', fontWeight: 700, color: C.text }}>{card.totalLabel}</span>
                <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, color: card.totalColor }}>{card.totalVal}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ══ SIGNATURES ══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, marginTop: 24, width: '100%' }}>
        {[
          { label: "Signature de l'employeur", sub: 'Cachet & signature' },
          { label: "Signature de l'employé",   sub: 'Lu et approuvé' },
        ].map(s => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, color: '#4b5563', marginBottom: 3 }}>{s.label}</p>
            <p style={{ fontSize: '9px', color: '#9ca3af', marginBottom: 10 }}>{s.sub}</p>
            <div style={{ height: 44, borderBottom: '2px dashed #d1d5db' }} />
          </div>
        ))}
      </div>
    </div>
  );
}