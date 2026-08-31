// 'use client';

// import React from 'react';

// // ============================================================================
// // 📁 src/app/(dashboard)/paie/[id]/components/PayslipBreakdown.tsx
// //
// // ✅ TUS corrigé : tusDgiAmount (4,13%) + tusCnssAmount (3,38%) + tusTotal (7,51%)
// //    tusAmount SUPPRIMÉ — le backend n'envoie PLUS ce champ
// // ✅ Taxes custom (CompanyTax) affichées dynamiquement
// // ============================================================================

// interface PayrollItem {
//   id: string; code: string; label: string;
//   type: 'GAIN' | 'DEDUCTION' | 'EMPLOYER_COST';
//   base?: number; rate?: number; amount: number;
//   isTaxable: boolean; isCnss: boolean; order: number;
// }

// interface Props {
//   items: PayrollItem[];
//   grossSalary: number;
//   netSalary: number;
//   totalDeductions?: number;
//   isSubjectToCnss?: boolean;
//   isSubjectToIrpp?: boolean;
//   bonuses?: any[];
//   absenceDeduction?: number;
//   absenceDays?: number;
//   workDays?: number;
//   // ✅ CNSS Patronale 3 branches
//   cnssEmployer?: number;
//   cnssEmployerPension?: number;
//   cnssEmployerFamily?: number;
//   cnssEmployerAccident?: number;
//   // ✅ TUS — 3 champs distincts (tusAmount RETIRÉ)
//   tusDgiAmount?: number;   // 4,13% → versé DGI
//   tusCnssAmount?: number;  // 3,38% → versé CNSS
//   tusTotal?: number;       // 7,51% total
//   totalEmployerCost?: number;
//   irppDetails?: any;
// }

// export default function PayslipBreakdown({
//   items, grossSalary, netSalary, totalDeductions,
//   isSubjectToCnss = true, isSubjectToIrpp = true,
//   bonuses = [], absenceDeduction = 0, absenceDays = 0, workDays = 26,
//   cnssEmployer = 0,
//   cnssEmployerPension  = 0,
//   cnssEmployerFamily   = 0,
//   cnssEmployerAccident = 0,
//   tusDgiAmount  = 0,
//   tusCnssAmount = 0,
//   tusTotal      = 0,
//   totalEmployerCost = 0,
//   irppDetails,
// }: Props) {
//   const fmt = (v: number) => Math.round(v ?? 0).toLocaleString('fr-FR');

//   const cnssPatTotal = cnssEmployerPension + cnssEmployerFamily + cnssEmployerAccident;

//   // ── Taxes custom EMPLOYER_COST (hors CNSS/TUS identifiés) ─────────────────
//   const KNOWN_EMPLOYER_CODES = ['CNSS_EMP','CNSS_PAT','TUS','TUS_DGI','TUS_CNSS','CNSS_PENSION','CNSS_FAMILY','CNSS_ACCIDENT'];
//   const customEmployerItems = items.filter(i =>
//     i.type === 'EMPLOYER_COST' &&
//     !KNOWN_EMPLOYER_CODES.some(k => i.code?.toUpperCase().includes(k))
//   );

//   // ── Taxes custom DEDUCTION (hors CNSS/ITS classiques) ─────────────────────
//   const KNOWN_DEDUCTION_CODES = ['CNSS_SAL','CNSS_SL','ITS','IRPP','LOAN','ADVANCE','PRET','AVANCE','ABSENCE'];

//   // ── Items classés ──────────────────────────────────────────────────────────
//   const gains      = items.filter(i => i.type === 'GAIN').sort((a, b) => a.order - b.order);
//   const deductions = items.filter(i => i.type === 'DEDUCTION').sort((a, b) => a.order - b.order);

//   const isOT    = (i: PayrollItem) => ['OT','OVERTIME','HS','HEURE'].some(k => i.code?.toUpperCase().includes(k));
//   const isBonus = (i: PayrollItem) => ['BONUS','PRIME','TRANSPORT','PANIER','INDEMNITE'].some(k => i.code?.toUpperCase().includes(k));

//   const salaryItems = gains.filter(i => !isOT(i) && !isBonus(i));
//   const otItems     = gains.filter(isOT);
//   const bonusItems  = bonuses.length > 0 ? bonuses : gains.filter(isBonus);

//   const cnssItem = deductions.find(i => i.code?.toUpperCase().includes('CNSS'));
//   const irppItem = deductions.find(i => ['ITS','IRPP'].some(k => i.code?.toUpperCase().includes(k)));
//   const extraDed = deductions.filter(i =>
//     i.id !== cnssItem?.id && i.id !== irppItem?.id &&
//     !i.code?.toUpperCase().includes('ABSENCE') && !i.label?.toLowerCase().includes('absence') &&
//     !KNOWN_DEDUCTION_CODES.some(k => i.code?.toUpperCase().includes(k))
//   );

//   // Taxes salariales custom (CompanyTax avec part employé)
//   const customSalaryDed = deductions.filter(i =>
//     i.id !== cnssItem?.id && i.id !== irppItem?.id &&
//     !i.code?.toUpperCase().includes('ABSENCE') && !i.label?.toLowerCase().includes('absence') &&
//     !['LOAN','PRET','ADVANCE','AVANCE'].some(k => i.code?.toUpperCase().includes(k))
//   );
//   // Prêts/avances
//   const loanAdvanceDed = deductions.filter(i =>
//     ['LOAN','PRET','ADVANCE','AVANCE'].some(k => i.code?.toUpperCase().includes(k))
//   );

//   const cnssAmt  = isSubjectToCnss ? (cnssItem?.amount ?? 0) : 0;
//   const irppAmt  = isSubjectToIrpp ? (irppItem?.amount ?? 0) : 0;
//   const totalRet = totalDeductions ?? deductions.reduce((s, i) => s + i.amount, 0);

//   const C = {
//     dark:    '#111827', green:   '#15803d', cyan:    '#0e7490',
//     amber:   '#b45309', red:     '#b91c1c', redLt:   '#fef2f2',
//     purple:  '#7e22ce', sky:     '#0369a1', skyLt:   '#f0f9ff',
//     orange:  '#c2410c', orangeLt:'#fff7ed', gray50:  '#f9fafb',
//     teal:    '#0f766e', tealLt:  '#f0fdfa',
//     white:   '#ffffff', border:  '#e5e7eb', text:    '#111827',
//     textSub: '#9ca3af',
//   };

//   let rowIdx = 0;

//   const Row = ({ label, sub, base, rate, amount, amtColor }: {
//     label: string; sub?: string; base?: string; rate?: string;
//     amount: string; amtColor: string;
//   }) => {
//     const bg = rowIdx++ % 2 === 0 ? C.white : C.gray50;
//     return (
//       <tr>
//         <td style={{ background: bg, padding: '7px 14px', borderBottom: `1px solid ${C.border}`, verticalAlign: 'top' }}>
//           <p style={{ fontSize: '11px', fontWeight: 600, color: C.text, lineHeight: 1.3, margin: 0 }}>{label}</p>
//           {sub && <p style={{ fontSize: '9.5px', color: C.textSub, marginTop: 2, lineHeight: 1.3 }}>{sub}</p>}
//         </td>
//         <td style={{ background: bg, padding: '7px 14px', borderBottom: `1px solid ${C.border}`, textAlign: 'right', verticalAlign: 'middle' }}>
//           <span style={{ fontSize: '10px', fontFamily: 'monospace', color: C.textSub }}>{base ?? '—'}</span>
//         </td>
//         <td style={{ background: bg, padding: '7px 14px', borderBottom: `1px solid ${C.border}`, textAlign: 'right', verticalAlign: 'middle' }}>
//           <span style={{ fontSize: '10px', fontFamily: 'monospace', color: C.textSub }}>{rate ?? '—'}</span>
//         </td>
//         <td style={{ background: bg, padding: '7px 14px', borderBottom: `1px solid ${C.border}`, textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, fontSize: '11.5px', color: amtColor }}>
//           {amount}
//         </td>
//       </tr>
//     );
//   };

//   const Head = ({ label, bg }: { label: string; bg: string }) => (
//     <tr>
//       <td colSpan={4} style={{ background: bg, padding: '7px 14px' }}>
//         <span style={{ fontSize: '9.5px', fontWeight: 900, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: C.white }}>{label}</span>
//       </td>
//     </tr>
//   );

//   return (
//     <div style={{ width: '100%' }}>
//       <div style={{ width: '100%', borderRadius: 8, overflow: 'hidden', border: `1.5px solid ${C.border}` }}>
//         <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' as const }}>
//           <colgroup>
//             <col style={{ width: '46%' }} /><col style={{ width: '20%' }} />
//             <col style={{ width: '13%' }} /><col style={{ width: '21%' }} />
//           </colgroup>
//           <thead>
//             <tr>
//               {[['Désignation','left'],['Base (FCFA)','right'],['Taux','right'],['Montant (FCFA)','right']].map(([h, align]) => (
//                 <th key={h} style={{ background: C.dark, padding: '10px 14px', textAlign: align as any, fontSize: '9.5px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.white }}>{h}</th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>

//             {/* ── RÉMUNÉRATIONS ───────────────────────────────────────── */}
//             <Head label="Rémunérations" bg={C.green} />
//             {(() => { rowIdx = 0; return null; })()}
//             {salaryItems.length > 0 ? salaryItems.map(i => (
//               <Row key={i.id} label={i.label}
//                 base={i.base ? fmt(i.base) : undefined}
//                 rate={i.rate ? `${(i.rate*100).toFixed(0)}%` : undefined}
//                 amount={`+${fmt(i.amount)}`} amtColor={C.green} />
//             )) : (
//               <Row label="Salaire de base"
//                 amount={`+${fmt(Math.max(0, grossSalary - bonusItems.reduce((s: number, b: any) => s + (b.amount || b.computedAmount || 0), 0) - otItems.reduce((s, i) => s + i.amount, 0)))}`}
//                 amtColor={C.green} />
//             )}
//             {absenceDays > 0 && absenceDeduction > 0 && (
//               <Row label={`Déduction absences (${absenceDays} j)`}
//                 sub={`${fmt(Math.round(absenceDeduction / absenceDays))} FCFA/j × ${absenceDays} j`}
//                 rate={`${absenceDays}/${workDays}`}
//                 amount={`−${fmt(absenceDeduction)}`} amtColor={C.amber} />
//             )}

//             {/* ── HEURES SUP ──────────────────────────────────────────── */}
//             {otItems.length > 0 && (
//               <>
//                 <Head label="Heures Supplémentaires — Décret n°78-360" bg={C.amber} />
//                 {(() => { rowIdx = 0; return null; })()}
//                 {otItems.map(i => (
//                   <Row key={i.id} label={i.label}
//                     rate={i.rate ? `+${(i.rate * 100).toFixed(0)}%` : undefined}
//                     amount={`+${fmt(i.amount)}`} amtColor={C.amber} />
//                 ))}
//               </>
//             )}

//             {/* ── PRIMES ──────────────────────────────────────────────── */}
//             {bonusItems.length > 0 && (
//               <>
//                 <Head label="Primes & Accessoires" bg={C.cyan} />
//                 {(() => { rowIdx = 0; return null; })()}
//                 {bonusItems.map((b: any, idx: number) => (
//                   <Row key={b.id ?? idx} label={b.label || b.bonusType || b.code || 'Prime'}
//                     sub={b.description || undefined}
//                     rate={b.percentage ? `${b.percentage}%` : undefined}
//                     amount={`+${fmt(b.amount || b.computedAmount || 0)}`} amtColor={C.cyan} />
//                 ))}
//               </>
//             )}

//             {/* TOTAL BRUT */}
//             <tr>
//               <td colSpan={3} style={{ background: C.green, padding: '10px 14px', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.white }}>Total Brut</td>
//               <td style={{ background: C.green, padding: '10px 14px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 900, fontSize: '16px', color: C.white }}>{fmt(grossSalary)}</td>
//             </tr>

//             {/* ── COTISATIONS SALARIALES ──────────────────────────────── */}
//             <Head label="Cotisations & Retenues Salariales" bg={C.red} />
//             {(() => { rowIdx = 0; return null; })()}
//             <Row label="CNSS Salariale — Branche Pension"
//               sub="Caisse Nationale de Sécurité Sociale"
//               base={cnssItem?.base ? fmt(cnssItem.base) : undefined}
//               rate={isSubjectToCnss ? '4 %' : '—'}
//               amount={isSubjectToCnss ? `−${fmt(cnssAmt)}` : '0 (Exempté)'}
//               amtColor={isSubjectToCnss ? C.red : C.textSub} />
//             <Row label="ITS — Impôt sur les Traitements et Salaires"
//               sub="Barème progressif 2026 : 1% · 10% · 25% · 40% — Abattement 20%"
//               base={irppItem?.base ? fmt(irppItem.base) : undefined}
//               rate={isSubjectToIrpp ? 'Barème' : '—'}
//               amount={isSubjectToIrpp ? `−${fmt(irppAmt)}` : '0 (Exempté)'}
//               amtColor={isSubjectToIrpp ? C.red : C.textSub} />

//             {/* ── TAXES CUSTOM SALARIALES (CompanyTax part employé) ──── */}
//             {customSalaryDed.filter(i =>
//               !['LOAN','PRET','ADVANCE','AVANCE'].some(k => i.code?.toUpperCase().includes(k))
//             ).map(i => (
//               <Row key={i.id} label={i.label}
//                 sub={i.code}
//                 base={i.base ? fmt(i.base) : undefined}
//                 rate={i.rate ? `${(i.rate * 100).toFixed(2)}%` : undefined}
//                 amount={`−${fmt(i.amount)}`} amtColor={C.teal} />
//             ))}

//             {/* ── PRÊTS & AVANCES ─────────────────────────────────────── */}
//             {loanAdvanceDed.length > 0 && (
//               <>
//                 <Head label="Retenues Facultatives — Prêts & Avances" bg={C.purple} />
//                 {(() => { rowIdx = 0; return null; })()}
//                 {loanAdvanceDed.map(i => (
//                   <Row key={i.id} label={i.label}
//                     base={i.base ? fmt(i.base) : undefined}
//                     rate={i.rate ? `${(i.rate * 100).toFixed(2)}%` : undefined}
//                     amount={`−${fmt(i.amount)}`} amtColor={C.purple} />
//                 ))}
//               </>
//             )}
//             {extraDed.length > 0 && loanAdvanceDed.length === 0 && (
//               <>
//                 <Head label="Retenues Facultatives" bg={C.purple} />
//                 {(() => { rowIdx = 0; return null; })()}
//                 {extraDed.map(i => (
//                   <Row key={i.id} label={i.label}
//                     base={i.base ? fmt(i.base) : undefined}
//                     rate={i.rate ? `${(i.rate * 100).toFixed(2)}%` : undefined}
//                     amount={`−${fmt(i.amount)}`} amtColor={C.purple} />
//                 ))}
//               </>
//             )}

//             {/* TOTAL RETENUES */}
//             <tr>
//               <td colSpan={3} style={{ background: C.redLt, padding: '9px 14px', borderTop: '2px solid #fecaca', fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', color: C.red }}>Total Retenues Salariales</td>
//               <td style={{ background: C.redLt, padding: '9px 14px', borderTop: '2px solid #fecaca', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, fontSize: '12px', color: C.red }}>−{fmt(totalRet)}</td>
//             </tr>

//             {/* ── PART PATRONALE ──────────────────────────────────────── */}
//             <Head label="Part Patronale — Charges Sociales Employeur" bg={C.orange} />
//             {(() => { rowIdx = 0; return null; })()}

//             {/* CNSS 3 branches */}
//             <Row label="CNSS Patronale — Pensions (Vieillesse / Invalidité)"
//               sub="Plafond mensuel : 1 200 000 FCFA"
//               rate="8 %" amount={`+${fmt(cnssEmployerPension)}`} amtColor={C.orange} />
//             <Row label="CNSS Patronale — Prestations Familiales"
//               sub="Plafond mensuel : 600 000 FCFA"
//               rate="10,03 %" amount={`+${fmt(cnssEmployerFamily)}`} amtColor={C.orange} />
//             <Row label="CNSS Patronale — Accidents du Travail"
//               sub="Plafond mensuel : 600 000 FCFA"
//               rate="2,25 %" amount={`+${fmt(cnssEmployerAccident)}`} amtColor={C.orange} />

//             {/* TUS — 2 lignes séparées */}
//             <Row label="TUS — Part DGI (4,13%)"
//               sub="Taxe Unique sur Salaires · versée à la DGI · déplafonné"
//               rate="4,13 %" amount={`+${fmt(tusDgiAmount)}`} amtColor={C.orange} />
//             <Row label="TUS — Part CNSS (3,38%)"
//               sub="Taxe Unique sur Salaires · versée à la CNSS · déplafonné"
//               rate="3,38 %" amount={`+${fmt(tusCnssAmount)}`} amtColor={C.orange} />

//             {/* Taxes custom EMPLOYER_COST */}
//             {customEmployerItems.length > 0 && (
//               <>
//                 {customEmployerItems.map(i => (
//                   <Row key={i.id} label={i.label}
//                     sub={i.code}
//                     base={i.base ? fmt(i.base) : undefined}
//                     rate={i.rate ? `${(i.rate * 100).toFixed(2)}%` : undefined}
//                     amount={`+${fmt(i.amount)}`} amtColor={C.teal} />
//                 ))}
//               </>
//             )}

//             {/* TOTAL PATRONAL */}
//             <tr>
//               <td colSpan={3} style={{ background: C.orangeLt, padding: '9px 14px', borderTop: '2px solid #fed7aa', fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', color: C.orange }}>Total Charges Patronales</td>
//               <td style={{ background: C.orangeLt, padding: '9px 14px', borderTop: '2px solid #fed7aa', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, fontSize: '12px', color: C.orange }}>
//                 +{fmt(cnssPatTotal + tusTotal + customEmployerItems.reduce((s, i) => s + i.amount, 0))}
//               </td>
//             </tr>

//           </tbody>
//         </table>

//         {/* NET À PAYER */}
//         <div style={{ background: C.dark, padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//           <div>
//             <p style={{ fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.25em', color: '#9ca3af', marginBottom: 3 }}>Net à Payer</p>
//             <p style={{ fontSize: '9px', color: '#6b7280' }}>Montant net versé à l'employé</p>
//           </div>
//           <div style={{ textAlign: 'right' }}>
//             <span style={{ fontSize: '30px', fontWeight: 900, fontFamily: 'monospace', color: C.white }}>{fmt(netSalary)}</span>
//             <span style={{ marginLeft: 8, fontSize: '13px', color: '#6b7280' }}>FCFA</span>
//           </div>
//         </div>
//       </div>

//       {/* ── RÉCAPITULATIF 3 COLONNES ───────────────────────────────────── */}
//       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 14 }}>

//         {/* Part salariale */}
//         <div style={{ borderRadius: 8, overflow: 'hidden', border: `1.5px solid ${C.border}` }}>
//           <div style={{ background: C.sky, padding: '8px 14px' }}>
//             <p style={{ fontSize: '9.5px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.white, margin: 0 }}>Part Salariale</p>
//           </div>
//           <div style={{ background: C.white, padding: '10px 14px' }}>
//             {[
//               { label: 'CNSS salariale (4 %)', val: `−${fmt(cnssAmt)} F`,  color: C.red },
//               { label: 'ITS — barème 2026',    val: `−${fmt(irppAmt)} F`,  color: C.red },
//             ].map(r => (
//               <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
//                 <span style={{ fontSize: '10px', color: '#6b7280' }}>{r.label}</span>
//                 <span style={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 700, color: r.color }}>{r.val}</span>
//               </div>
//             ))}
//             {customSalaryDed.filter(i => !['LOAN','PRET','ADVANCE','AVANCE'].some(k => i.code?.toUpperCase().includes(k))).map(i => (
//               <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
//                 <span style={{ fontSize: '10px', color: '#6b7280' }}>{i.code}</span>
//                 <span style={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 700, color: C.teal }}>−{fmt(i.amount)} F</span>
//               </div>
//             ))}
//             <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 7, borderTop: `1px solid ${C.border}` }}>
//               <span style={{ fontSize: '10.5px', fontWeight: 700, color: C.text }}>Total salarié</span>
//               <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, color: C.sky }}>{fmt(cnssAmt + irppAmt)} F</span>
//             </div>
//           </div>
//         </div>

//         {/* Part patronale */}
//         <div style={{ borderRadius: 8, overflow: 'hidden', border: `1.5px solid ${C.border}` }}>
//           <div style={{ background: C.orange, padding: '8px 14px' }}>
//             <p style={{ fontSize: '9.5px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.white, margin: 0 }}>Part Patronale</p>
//           </div>
//           <div style={{ background: C.white, padding: '10px 14px' }}>
//             {[
//               { label: 'Pensions 8% / 1 200k',  val: `+${fmt(cnssEmployerPension)} F`,  color: C.orange },
//               { label: 'Famille 10% / 600k',    val: `+${fmt(cnssEmployerFamily)} F`,   color: C.orange },
//               { label: 'AT 2,25% / 600k',       val: `+${fmt(cnssEmployerAccident)} F`, color: C.orange },
//               { label: 'TUS DGI 4,13%',         val: `+${fmt(tusDgiAmount)} F`,         color: C.orange },
//               { label: 'TUS CNSS 3,38%',        val: `+${fmt(tusCnssAmount)} F`,        color: C.orange },
//             ].map(r => (
//               <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
//                 <span style={{ fontSize: '9.5px', color: '#6b7280' }}>{r.label}</span>
//                 <span style={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 700, color: r.color }}>{r.val}</span>
//               </div>
//             ))}
//             {customEmployerItems.map(i => (
//               <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
//                 <span style={{ fontSize: '9.5px', color: '#6b7280' }}>{i.code}</span>
//                 <span style={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 700, color: C.teal }}>+{fmt(i.amount)} F</span>
//               </div>
//             ))}
//             <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 7, borderTop: `1px solid ${C.border}` }}>
//               <span style={{ fontSize: '10.5px', fontWeight: 700, color: C.text }}>Total patronal</span>
//               <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, color: C.orange }}>
//                 +{fmt(cnssPatTotal + tusTotal + customEmployerItems.reduce((s, i) => s + i.amount, 0))} F
//               </span>
//             </div>
//           </div>
//         </div>

//         {/* Récapitulatif */}
//         <div style={{ borderRadius: 8, overflow: 'hidden', border: `1.5px solid ${C.border}` }}>
//           <div style={{ background: C.purple, padding: '8px 14px' }}>
//             <p style={{ fontSize: '9.5px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.white, margin: 0 }}>Récapitulatif</p>
//           </div>
//           <div style={{ background: C.white, padding: '10px 14px' }}>
//             {[
//               { label: 'Salaire brut',       val: `+${fmt(grossSalary)} F`,  color: C.green  },
//               { label: 'Total retenues',     val: `−${fmt(totalRet)} F`,     color: C.red    },
//               { label: 'Charges patronales', val: `+${fmt(cnssPatTotal + tusTotal)} F`, color: C.orange },
//             ].map(r => (
//               <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
//                 <span style={{ fontSize: '10px', color: '#6b7280' }}>{r.label}</span>
//                 <span style={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 700, color: r.color }}>{r.val}</span>
//               </div>
//             ))}
//             <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 7, borderTop: `1px solid ${C.border}` }}>
//               <span style={{ fontSize: '10.5px', fontWeight: 700, color: C.text }}>Coût total</span>
//               <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, color: C.purple }}>{fmt(totalEmployerCost)} F</span>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* ── BANDE NET / COÛT ───────────────────────────────────────────── */}
//       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
//         <div style={{ background: '#f0f9ff', borderRadius: 8, padding: '12px 16px', border: '1.5px solid #bae6fd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//           <span style={{ fontSize: '11px', fontWeight: 700, color: C.sky }}>Net à payer</span>
//           <span style={{ fontSize: '16px', fontFamily: 'monospace', fontWeight: 900, color: C.sky }}>{fmt(netSalary)} F</span>
//         </div>
//         <div style={{ background: C.orangeLt, borderRadius: 8, padding: '12px 16px', border: '1.5px solid #fed7aa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//           <span style={{ fontSize: '11px', fontWeight: 700, color: C.orange }}>Coût employeur total</span>
//           <span style={{ fontSize: '16px', fontFamily: 'monospace', fontWeight: 900, color: C.orange }}>{fmt(totalEmployerCost)} F</span>
//         </div>
//       </div>

//       {/* ── TUS DÉTAIL (mention déclarations) ─────────────────────────── */}
//       {tusTotal > 0 && (
//         <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 8, background: '#fffbeb', border: '1.5px solid #fde68a', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
//           <div style={{ fontSize: '13px', marginTop: 1 }}>ℹ️</div>
//           <div>
//             <p style={{ fontSize: '10px', fontWeight: 700, color: '#92400e', margin: '0 0 3px' }}>TUS — Déclarations séparées</p>
//             <p style={{ fontSize: '9.5px', color: '#b45309', margin: 0, lineHeight: 1.5 }}>
//               Part DGI ({fmt(tusDgiAmount)} F à 4,13%) → formulaire eTax DGI ·{' '}
//               Part CNSS ({fmt(tusCnssAmount)} F à 3,38%) → déclaration CNSS mensuelle
//             </p>
//           </div>
//         </div>
//       )}

//       {/* ── SIGNATURES ─────────────────────────────────────────────────── */}
//       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, marginTop: 24 }}>
//         {[{ label: "Signature de l'employeur", sub: 'Cachet & signature' },
//           { label: "Signature de l'employé",   sub: 'Lu et approuvé'    }].map(s => (
//           <div key={s.label} style={{ textAlign: 'center' }}>
//             <p style={{ fontSize: '10px', fontWeight: 700, color: '#4b5563', marginBottom: 3 }}>{s.label}</p>
//             <p style={{ fontSize: '9px', color: '#9ca3af', marginBottom: 10 }}>{s.sub}</p>
//             <div style={{ height: 44, borderBottom: '2px dashed #d1d5db' }} />
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }



'use client';

import React from 'react';

// ============================================================================
// 📁 src/app/(dashboard)/paie/[id]/components/PayslipBreakdown.tsx
//
// ✅ TUS corrigé : tusDgiAmount (2,025%) + tusCnssAmount (5,475%) + tusTotal (7,51%)
//    tusAmount SUPPRIMÉ — le backend n'envoie PLUS ce champ
// ✅ Taxes custom (CompanyTax) affichées dynamiquement
// ============================================================================

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
  // ✅ CNSS Patronale 3 branches
  cnssEmployer?: number;
  cnssEmployerPension?: number;
  cnssEmployerFamily?: number;
  cnssEmployerAccident?: number;
  // ✅ TUS — 3 champs distincts (tusAmount RETIRÉ)
  tusDgiAmount?: number;   // 2,025% → versé DGI
  tusCnssAmount?: number;  // 5,475% → versé CNSS
  tusTotal?: number;       // 7,51% total
  totalEmployerCost?: number;
  irppDetails?: any;
}

export default function PayslipBreakdown({
  items, grossSalary, netSalary, totalDeductions,
  isSubjectToCnss = true, isSubjectToIrpp = true,
  bonuses = [], absenceDeduction = 0, absenceDays = 0, workDays = 26,
  cnssEmployer = 0,
  cnssEmployerPension  = 0,
  cnssEmployerFamily   = 0,
  cnssEmployerAccident = 0,
  tusDgiAmount  = 0,
  tusCnssAmount = 0,
  tusTotal      = 0,
  totalEmployerCost = 0,
  irppDetails,
}: Props) {
  const fmt = (v: number | string | any) => Math.round(Number(v) || 0).toLocaleString('fr-FR');

  const cnssPatTotal = Number(cnssEmployerPension) + Number(cnssEmployerFamily) + Number(cnssEmployerAccident);

  // ── Taxes custom EMPLOYER_COST (hors CNSS/TUS identifiés) ─────────────────
  const KNOWN_EMPLOYER_CODES = ['CNSS_EMP','CNSS_PAT','TUS','TUS_DGI','TUS_CNSS','CNSS_PENSION','CNSS_FAMILY','CNSS_ACCIDENT'];
  const customEmployerItems = items.filter(i =>
    i.type === 'EMPLOYER_COST' &&
    !KNOWN_EMPLOYER_CODES.some(k => i.code?.toUpperCase().includes(k))
  );

  // ── Taxes custom DEDUCTION (hors CNSS/ITS classiques) ─────────────────────
  const KNOWN_DEDUCTION_CODES = ['CNSS_SAL','CNSS_SL','ITS','IRPP','LOAN','ADVANCE','PRET','AVANCE','ABSENCE'];

  // ── Items classés ──────────────────────────────────────────────────────────
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
    !i.code?.toUpperCase().includes('ABSENCE') && !i.label?.toLowerCase().includes('absence') &&
    !KNOWN_DEDUCTION_CODES.some(k => i.code?.toUpperCase().includes(k))
  );

  // Taxes salariales custom (CompanyTax avec part employé)
  const customSalaryDed = deductions.filter(i =>
    i.id !== cnssItem?.id && i.id !== irppItem?.id &&
    !i.code?.toUpperCase().includes('ABSENCE') && !i.label?.toLowerCase().includes('absence') &&
    !['LOAN','PRET','ADVANCE','AVANCE'].some(k => i.code?.toUpperCase().includes(k))
  );
  // Prêts/avances
  const loanAdvanceDed = deductions.filter(i =>
    ['LOAN','PRET','ADVANCE','AVANCE'].some(k => i.code?.toUpperCase().includes(k))
  );

  const cnssAmt  = isSubjectToCnss ? (cnssItem?.amount ?? 0) : 0;
  const irppAmt  = isSubjectToIrpp ? (irppItem?.amount ?? 0) : 0;
  const totalRet = totalDeductions ?? deductions.reduce((s, i) => s + i.amount, 0);

  const C = {
    dark:    '#111827', green:   '#15803d', cyan:    '#0e7490',
    amber:   '#b45309', red:     '#b91c1c', redLt:   '#fef2f2',
    purple:  '#7e22ce', sky:     '#0369a1', skyLt:   '#f0f9ff',
    orange:  '#c2410c', orangeLt:'#fff7ed', gray50:  '#f9fafb',
    teal:    '#0f766e', tealLt:  '#f0fdfa',
    white:   '#ffffff', border:  '#e5e7eb', text:    '#111827',
    textSub: '#9ca3af',
  };

  let rowIdx = 0;

  const Row = ({ label, sub, base, rate, amount, amtColor }: {
    label: string; sub?: string; base?: string; rate?: string;
    amount: string; amtColor: string;
  }) => {
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
        <td style={{ background: bg, padding: '7px 14px', borderBottom: `1px solid ${C.border}`, textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, fontSize: '11.5px', color: amtColor }}>
          {amount}
        </td>
      </tr>
    );
  };

  const Head = ({ label, bg }: { label: string; bg: string }) => (
    <tr>
      <td colSpan={4} style={{ background: bg, padding: '7px 14px' }}>
        <span style={{ fontSize: '9.5px', fontWeight: 900, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: C.white }}>{label}</span>
      </td>
    </tr>
  );

  return (
    <div style={{ width: '100%' }}>
      <div style={{ width: '100%', borderRadius: 8, overflow: 'hidden', border: `1.5px solid ${C.border}` }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' as const }}>
          <colgroup>
            <col style={{ width: '46%' }} /><col style={{ width: '20%' }} />
            <col style={{ width: '13%' }} /><col style={{ width: '21%' }} />
          </colgroup>
          <thead>
            <tr>
              {[['Désignation','left'],['Base (FCFA)','right'],['Taux','right'],['Montant (FCFA)','right']].map(([h, align]) => (
                <th key={h} style={{ background: C.dark, padding: '10px 14px', textAlign: align as any, fontSize: '9.5px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.white }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>

            {/* ── RÉMUNÉRATIONS ───────────────────────────────────────── */}
            <Head label="Rémunérations" bg={C.green} />
            {(() => { rowIdx = 0; return null; })()}
            {salaryItems.length > 0 ? salaryItems.map(i => (
              <Row key={i.id} label={i.label}
                base={i.base ? fmt(i.base) : undefined}
                rate={i.rate ? `${(i.rate*100).toFixed(0)}%` : undefined}
                amount={`+${fmt(i.amount)}`} amtColor={C.green} />
            )) : (
              <Row label="Salaire de base"
                amount={`+${fmt(Math.max(0, grossSalary - bonusItems.reduce((s: number, b: any) => s + (b.amount || b.computedAmount || 0), 0) - otItems.reduce((s, i) => s + i.amount, 0)))}`}
                amtColor={C.green} />
            )}
            {absenceDays > 0 && absenceDeduction > 0 && (
              <Row label={`Déduction absences (${absenceDays} j)`}
                sub={`${fmt(Math.round(absenceDeduction / absenceDays))} FCFA/j × ${absenceDays} j`}
                rate={`${absenceDays}/${workDays}`}
                amount={`−${fmt(absenceDeduction)}`} amtColor={C.amber} />
            )}

            {/* ── HEURES SUP ──────────────────────────────────────────── */}
            {otItems.length > 0 && (
              <>
                <Head label="Heures Supplémentaires — Décret n°78-360" bg={C.amber} />
                {(() => { rowIdx = 0; return null; })()}
                {otItems.map(i => (
                  <Row key={i.id} label={i.label}
                    rate={i.rate ? `+${(i.rate * 100).toFixed(0)}%` : undefined}
                    amount={`+${fmt(i.amount)}`} amtColor={C.amber} />
                ))}
              </>
            )}

            {/* ── PRIMES ──────────────────────────────────────────────── */}
            {bonusItems.length > 0 && (
              <>
                <Head label="Primes & Accessoires" bg={C.cyan} />
                {(() => { rowIdx = 0; return null; })()}
                {bonusItems.map((b: any, idx: number) => (
                  <Row key={b.id ?? idx} label={b.label || b.bonusType || b.code || 'Prime'}
                    sub={b.description || undefined}
                    rate={b.percentage ? `${b.percentage}%` : undefined}
                    amount={`+${fmt(b.amount || b.computedAmount || 0)}`} amtColor={C.cyan} />
                ))}
              </>
            )}

            {/* TOTAL BRUT */}
            <tr>
              <td colSpan={3} style={{ background: C.green, padding: '10px 14px', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.white }}>Total Brut</td>
              <td style={{ background: C.green, padding: '10px 14px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 900, fontSize: '16px', color: C.white }}>{fmt(grossSalary)}</td>
            </tr>

            {/* ── COTISATIONS SALARIALES ──────────────────────────────── */}
            <Head label="Cotisations & Retenues Salariales" bg={C.red} />
            {(() => { rowIdx = 0; return null; })()}
            <Row label="CNSS Salariale — Branche Pension"
              sub="Caisse Nationale de Sécurité Sociale"
              base={cnssItem?.base ? fmt(cnssItem.base) : undefined}
              rate={isSubjectToCnss ? '4 %' : '—'}
              amount={isSubjectToCnss ? `−${fmt(cnssAmt)}` : '0 (Exempté)'}
              amtColor={isSubjectToCnss ? C.red : C.textSub} />
            <Row label="ITS — Impôt sur les Traitements et Salaires"
              sub="Barème progressif 2026 : 1 200F · 10% · 15% · 20% · 30% — Abattement 20%"
              base={irppItem?.base ? fmt(irppItem.base) : undefined}
              rate={isSubjectToIrpp ? 'Barème' : '—'}
              amount={isSubjectToIrpp ? `−${fmt(irppAmt)}` : '0 (Exempté)'}
              amtColor={isSubjectToIrpp ? C.red : C.textSub} />

            {/* ── TAXES CUSTOM SALARIALES (CompanyTax part employé) ──── */}
            {customSalaryDed.filter(i =>
              !['LOAN','PRET','ADVANCE','AVANCE'].some(k => i.code?.toUpperCase().includes(k))
            ).map(i => (
              <Row key={i.id} label={i.label}
                sub={i.code}
                base={i.base ? fmt(i.base) : undefined}
                rate={i.rate ? `${(i.rate * 100).toFixed(2)}%` : undefined}
                amount={`−${fmt(i.amount)}`} amtColor={C.teal} />
            ))}

            {/* ── PRÊTS & AVANCES ─────────────────────────────────────── */}
            {loanAdvanceDed.length > 0 && (
              <>
                <Head label="Retenues Facultatives — Prêts & Avances" bg={C.purple} />
                {(() => { rowIdx = 0; return null; })()}
                {loanAdvanceDed.map(i => (
                  <Row key={i.id} label={i.label}
                    base={i.base ? fmt(i.base) : undefined}
                    rate={i.rate ? `${(i.rate * 100).toFixed(2)}%` : undefined}
                    amount={`−${fmt(i.amount)}`} amtColor={C.purple} />
                ))}
              </>
            )}
            {extraDed.length > 0 && loanAdvanceDed.length === 0 && (
              <>
                <Head label="Retenues Facultatives" bg={C.purple} />
                {(() => { rowIdx = 0; return null; })()}
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
              <td colSpan={3} style={{ background: C.redLt, padding: '9px 14px', borderTop: '2px solid #fecaca', fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', color: C.red }}>Total Retenues Salariales</td>
              <td style={{ background: C.redLt, padding: '9px 14px', borderTop: '2px solid #fecaca', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, fontSize: '12px', color: C.red }}>−{fmt(totalRet)}</td>
            </tr>

            {/* ── PART PATRONALE ──────────────────────────────────────── */}
            <Head label="Part Patronale — Charges Sociales Employeur" bg={C.orange} />
            {(() => { rowIdx = 0; return null; })()}

            {/* CNSS 3 branches */}
            <Row label="CNSS Patronale — Pensions (Vieillesse / Invalidité)"
              sub="Plafond mensuel : 1 200 000 FCFA"
              rate="8 %" amount={`+${fmt(cnssEmployerPension)}`} amtColor={C.orange} />
            <Row label="CNSS Patronale — Prestations Familiales"
              sub="Plafond mensuel : 600 000 FCFA"
              rate="10,03 %" amount={`+${fmt(cnssEmployerFamily)}`} amtColor={C.orange} />
            <Row label="CNSS Patronale — Accidents du Travail"
              sub="Plafond mensuel : 600 000 FCFA"
              rate="2,25 %" amount={`+${fmt(cnssEmployerAccident)}`} amtColor={C.orange} />

            {/* TUS — 2 lignes séparées */}
            <Row label="TUS — Part DGI (2,025%)"
              sub="Taxe Unique sur Salaires · versée à la DGI · déplafonné"
              rate="2,025 %" amount={`+${fmt(tusDgiAmount)}`} amtColor={C.orange} />
            <Row label="TUS — Part CNSS (5,475%)"
              sub="Taxe Unique sur Salaires · versée à la CNSS · déplafonné"
              rate="5,475 %" amount={`+${fmt(tusCnssAmount)}`} amtColor={C.orange} />

            {/* Taxes custom EMPLOYER_COST */}
            {customEmployerItems.length > 0 && (
              <>
                {customEmployerItems.map(i => (
                  <Row key={i.id} label={i.label}
                    sub={i.code}
                    base={i.base ? fmt(i.base) : undefined}
                    rate={i.rate ? `${(i.rate * 100).toFixed(2)}%` : undefined}
                    amount={`+${fmt(i.amount)}`} amtColor={C.teal} />
                ))}
              </>
            )}

            {/* TOTAL PATRONAL */}
            <tr>
              <td colSpan={3} style={{ background: C.orangeLt, padding: '9px 14px', borderTop: '2px solid #fed7aa', fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', color: C.orange }}>Total Charges Patronales</td>
              <td style={{ background: C.orangeLt, padding: '9px 14px', borderTop: '2px solid #fed7aa', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, fontSize: '12px', color: C.orange }}>
                +{fmt(cnssPatTotal + tusTotal + customEmployerItems.reduce((s, i) => s + i.amount, 0))}
              </td>
            </tr>

          </tbody>
        </table>

        {/* NET À PAYER */}
        <div style={{ background: C.dark, padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.25em', color: '#9ca3af', marginBottom: 3 }}>Net à Payer</p>
            <p style={{ fontSize: '9px', color: '#6b7280' }}>Montant net versé à l'employé</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '30px', fontWeight: 900, fontFamily: 'monospace', color: C.white }}>{fmt(netSalary)}</span>
            <span style={{ marginLeft: 8, fontSize: '13px', color: '#6b7280' }}>FCFA</span>
          </div>
        </div>
      </div>

      {/* ── RÉCAPITULATIF 3 COLONNES ───────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 14 }}>

        {/* Part salariale */}
        <div style={{ borderRadius: 8, overflow: 'hidden', border: `1.5px solid ${C.border}` }}>
          <div style={{ background: C.sky, padding: '8px 14px' }}>
            <p style={{ fontSize: '9.5px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.white, margin: 0 }}>Part Salariale</p>
          </div>
          <div style={{ background: C.white, padding: '10px 14px' }}>
            {[
              { label: 'CNSS salariale (4 %)', val: `−${fmt(cnssAmt)} F`,  color: C.red },
              { label: 'ITS — barème 2026',    val: `−${fmt(irppAmt)} F`,  color: C.red },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: '10px', color: '#6b7280' }}>{r.label}</span>
                <span style={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 700, color: r.color }}>{r.val}</span>
              </div>
            ))}
            {customSalaryDed.filter(i => !['LOAN','PRET','ADVANCE','AVANCE'].some(k => i.code?.toUpperCase().includes(k))).map(i => (
              <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: '10px', color: '#6b7280' }}>{i.code}</span>
                <span style={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 700, color: C.teal }}>−{fmt(i.amount)} F</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 7, borderTop: `1px solid ${C.border}` }}>
              <span style={{ fontSize: '10.5px', fontWeight: 700, color: C.text }}>Total salarié</span>
              <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, color: C.sky }}>{fmt(cnssAmt + irppAmt)} F</span>
            </div>
          </div>
        </div>

        {/* Part patronale */}
        <div style={{ borderRadius: 8, overflow: 'hidden', border: `1.5px solid ${C.border}` }}>
          <div style={{ background: C.orange, padding: '8px 14px' }}>
            <p style={{ fontSize: '9.5px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.white, margin: 0 }}>Part Patronale</p>
          </div>
          <div style={{ background: C.white, padding: '10px 14px' }}>
            {[
              { label: 'Pensions 8% / 1 200k',  val: `+${fmt(cnssEmployerPension)} F`,  color: C.orange },
              { label: 'Famille 10% / 600k',    val: `+${fmt(cnssEmployerFamily)} F`,   color: C.orange },
              { label: 'AT 2,25% / 600k',       val: `+${fmt(cnssEmployerAccident)} F`, color: C.orange },
              { label: 'TUS DGI 2,025%',         val: `+${fmt(tusDgiAmount)} F`,         color: C.orange },
              { label: 'TUS CNSS 5,475%',        val: `+${fmt(tusCnssAmount)} F`,        color: C.orange },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: '9.5px', color: '#6b7280' }}>{r.label}</span>
                <span style={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 700, color: r.color }}>{r.val}</span>
              </div>
            ))}
            {customEmployerItems.map(i => (
              <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: '9.5px', color: '#6b7280' }}>{i.code}</span>
                <span style={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 700, color: C.teal }}>+{fmt(i.amount)} F</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 7, borderTop: `1px solid ${C.border}` }}>
              <span style={{ fontSize: '10.5px', fontWeight: 700, color: C.text }}>Total patronal</span>
              <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, color: C.orange }}>
                +{fmt(cnssPatTotal + tusTotal + customEmployerItems.reduce((s, i) => s + i.amount, 0))} F
              </span>
            </div>
          </div>
        </div>

        {/* Récapitulatif */}
        <div style={{ borderRadius: 8, overflow: 'hidden', border: `1.5px solid ${C.border}` }}>
          <div style={{ background: C.purple, padding: '8px 14px' }}>
            <p style={{ fontSize: '9.5px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.white, margin: 0 }}>Récapitulatif</p>
          </div>
          <div style={{ background: C.white, padding: '10px 14px' }}>
            {[
              { label: 'Salaire brut',       val: `+${fmt(grossSalary)} F`,  color: C.green  },
              { label: 'Total retenues',     val: `−${fmt(totalRet)} F`,     color: C.red    },
              { label: 'Charges patronales', val: `+${fmt(cnssPatTotal + tusTotal)} F`, color: C.orange },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: '10px', color: '#6b7280' }}>{r.label}</span>
                <span style={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 700, color: r.color }}>{r.val}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 7, borderTop: `1px solid ${C.border}` }}>
              <span style={{ fontSize: '10.5px', fontWeight: 700, color: C.text }}>Coût total</span>
              <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, color: C.purple }}>{fmt(totalEmployerCost)} F</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── BANDE NET / COÛT ───────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
        <div style={{ background: '#f0f9ff', borderRadius: 8, padding: '12px 16px', border: '1.5px solid #bae6fd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: C.sky }}>Net à payer</span>
          <span style={{ fontSize: '16px', fontFamily: 'monospace', fontWeight: 900, color: C.sky }}>{fmt(netSalary)} F</span>
        </div>
        <div style={{ background: C.orangeLt, borderRadius: 8, padding: '12px 16px', border: '1.5px solid #fed7aa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: C.orange }}>Coût employeur total</span>
          <span style={{ fontSize: '16px', fontFamily: 'monospace', fontWeight: 900, color: C.orange }}>{fmt(totalEmployerCost)} F</span>
        </div>
      </div>

      {/* ── TUS DÉTAIL (mention déclarations) ─────────────────────────── */}
      {tusTotal > 0 && (
        <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 8, background: '#fffbeb', border: '1.5px solid #fde68a', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <div style={{ fontSize: '13px', marginTop: 1 }}>ℹ️</div>
          <div>
            <p style={{ fontSize: '10px', fontWeight: 700, color: '#92400e', margin: '0 0 3px' }}>TUS — Déclarations séparées</p>
            <p style={{ fontSize: '9.5px', color: '#b45309', margin: 0, lineHeight: 1.5 }}>
              Part DGI ({fmt(tusDgiAmount)} F à 2,025%) → formulaire eTax DGI ·{' '}
              Part CNSS ({fmt(tusCnssAmount)} F à 5,475%) → déclaration CNSS mensuelle
            </p>
          </div>
        </div>
      )}

      {/* ── SIGNATURES ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, marginTop: 24 }}>
        {[{ label: "Signature de l'employeur", sub: 'Cachet & signature' },
          { label: "Signature de l'employé",   sub: 'Lu et approuvé'    }].map(s => (
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
