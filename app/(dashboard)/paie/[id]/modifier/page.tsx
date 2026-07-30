// 'use client';

// import React, { useState, useEffect, useCallback } from 'react';
// import { useRouter } from 'next/navigation';
// import {
//   ArrowLeft, Save, Loader2, AlertCircle, DollarSign,
//   Calendar, Clock, Gift, Minus, Plus, Check, RefreshCw,
//   TrendingUp, TrendingDown, Minus as MinusIcon,
// } from 'lucide-react';
// import { api } from '@/services/api';
// import { useAlert } from '@/components/providers/AlertProvider';

// // ─── Types ────────────────────────────────────────────────────────────────────
// interface PayrollEditData {
//   id: string;
//   status: string;
//   month: number;
//   year: number;
//   baseSalary: number;
//   grossSalary: number;
//   netSalary: number;
//   workDays: number;
//   workedDays: number;
//   absenceDays: number;
//   cnssSalarial: number;
//   its: number;
//   overtimeHours10?: number;
//   overtimeHours25?: number;
//   overtimeHours50?: number;
//   overtimeHours100?: number;
//   employee?: {
//     id: string;
//     firstName?: string;
//     lastName?: string;
//     employeeNumber?: string;
//     position?: string;
//   };
// }

// interface EmployeeBonus {
//   id: string;
//   bonusType: string;
//   amount: number | null;
//   fixedAmount?: number | null;
//   percentage: number | null;
//   calculationType?: 'FIXED_AMOUNT' | 'PERCENTAGE';
//   isRecurring?: boolean;
//   frequency?: string;
//   isActive?: boolean;
//   isTaxable: boolean;
//   isCnss: boolean;
// }

// // Résultat de simulation (aperçu recalcul)
// interface SimPreview {
//   grossSalary: number;
//   netSalary: number;
//   cnssSalarial: number;
//   its: number;
//   totalBonuses: number;
//   totalOvertimeAmount: number;
// }

// const MONTHS = [
//   'Janvier','Février','Mars','Avril','Mai','Juin',
//   'Juillet','Août','Septembre','Octobre','Novembre','Décembre'
// ];

// const fmt = (v: number) => Math.round(v ?? 0).toLocaleString('fr-FR');

// // ─── Flèche de variation ──────────────────────────────────────────────────────
// const Delta = ({ before, after }: { before: number; after: number }) => {
//   const diff = after - before;
//   if (Math.abs(diff) < 1) return null;
//   const positive = diff > 0;
//   return (
//     <span className={`text-xs font-bold flex items-center gap-0.5 ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
//       {positive ? <TrendingUp size={11}/> : <TrendingDown size={11}/>}
//       {positive ? '+' : ''}{fmt(diff)} F
//     </span>
//   );
// };

// // ─── Ligne heures sup ─────────────────────────────────────────────────────────
// const OtRow = ({ label, sub, value, onChange }: {
//   label: string; sub: string; value: number; onChange: (v: number) => void;
// }) => (
//   <div className="flex items-center gap-3 px-4 py-2.5 bg-orange-500/5 dark:bg-orange-900/10 rounded-xl mb-1.5">
//     <div className="w-14 shrink-0">
//       <span className="font-black text-orange-500 text-sm">{label}</span>
//       <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{sub}</p>
//     </div>
//     <button onClick={() => onChange(Math.max(0, +(value - 0.5).toFixed(1)))}
//       className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700
//                  flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer">
//       <Minus size={11} />
//     </button>
//     <span className="w-12 text-center font-bold font-mono text-sm text-gray-900 dark:text-white">
//       {value.toFixed(1)}
//     </span>
//     <button onClick={() => onChange(+(value + 0.5).toFixed(1))}
//       className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700
//                  flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer">
//       <Plus size={11} />
//     </button>
//     <span className="text-xs text-gray-400">h</span>
//   </div>
// );

// // ─── Page principale ──────────────────────────────────────────────────────────
// export default function EditPayrollPage({ params }: { params: { id: string } }) {
//   const router = useRouter();
//   const alert  = useAlert();

//   const [payroll,   setPayroll]   = useState<PayrollEditData | null>(null);
//   const [bonuses,   setBonuses]   = useState<EmployeeBonus[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isSaving,  setIsSaving]  = useState(false);
//   const [saved,     setSaved]     = useState(false);

//   // Champs modifiables
//   const [baseSalary, setBaseSalary] = useState(0);
//   const [workedDays, setWorkedDays] = useState(0);
//   const [ot10,  setOt10]  = useState(0);
//   const [ot25,  setOt25]  = useState(0);
//   const [ot50,  setOt50]  = useState(0);
//   const [ot100, setOt100] = useState(0);
//   const [bonusEdits,   setBonusEdits]   = useState<Record<string, number>>({});
//   const [dirtyBonuses, setDirtyBonuses] = useState<Set<string>>(new Set());

//   // ✅ Aperçu recalcul temps réel
//   const [preview,     setPreview]     = useState<SimPreview | null>(null);
//   const [isPreviewLoading, setIsPreviewLoading] = useState(false);
//   const [previewTimer, setPreviewTimer] = useState<NodeJS.Timeout | null>(null);

//   // ── Chargement ────────────────────────────────────────────────────────────
//   useEffect(() => { loadPayroll(); }, [params.id]);

//   const loadPayroll = async () => {
//     try {
//       const data = await api.get<PayrollEditData>(`/payrolls/${params.id}`);

//       if (data.status !== 'DRAFT') {
//         alert.error('Non modifiable', `Un bulletin "${data.status}" ne peut pas être modifié.`);
//         router.push(`/paie/${params.id}`);
//         return;
//       }

//       setPayroll(data);
//       setBaseSalary(Number(data.baseSalary));
//       setWorkedDays(data.workedDays ?? data.workDays ?? 26);
//       setOt10(Number(data.overtimeHours10  ?? 0));
//       setOt25(Number(data.overtimeHours25  ?? 0));
//       setOt50(Number(data.overtimeHours50  ?? 0));
//       setOt100(Number(data.overtimeHours100 ?? 0));

//       if ((data as any).employee?.id) {
//         try {
//           const bonusData: any = await api.get(
//             `/employee-bonuses?employeeId=${(data as any).employee.id}`
//           );
//           const list: EmployeeBonus[] = Array.isArray(bonusData) ? bonusData : bonusData?.data || [];
//           const fixedBonuses = list.filter(b =>
//             (b.isActive !== false) &&
//             (b.calculationType === 'FIXED_AMOUNT' || (b.amount != null && b.percentage == null))
//           );
//           setBonuses(fixedBonuses);
//           const initEdits: Record<string, number> = {};
//           fixedBonuses.forEach(b => {
//             initEdits[b.id] = Number(b.amount ?? b.fixedAmount ?? 0);
//           });
//           setBonusEdits(initEdits);
//         } catch { /* non bloquant */ }
//       }
//     } catch {
//       alert.error('Erreur', 'Impossible de charger le bulletin.');
//       router.push('/paie');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // ── Recalcul en temps réel via /payrolls/simulate ─────────────────────────
//   const triggerPreview = useCallback((
//     newBaseSalary: number,
//     newWorkedDays: number,
//     newOt10: number, newOt25: number, newOt50: number, newOt100: number,
//   ) => {
//     if (!payroll?.employee?.id) return;

//     // Debounce 600ms — évite un appel à chaque clic
//     if (previewTimer) clearTimeout(previewTimer);

//     const timer = setTimeout(async () => {
//       if (newBaseSalary < 70400) return;
//       setIsPreviewLoading(true);
//       try {
//         const result: any = await api.post('/payrolls/simulate', {
//           employeeId:       payroll.employee!.id,
//           month:            payroll.month,
//           year:             payroll.year,
//           baseSalary:       newBaseSalary,
//           workedDays:       newWorkedDays,
//           overtimeHours10:  newOt10,
//           overtimeHours25:  newOt25,
//           overtimeHours50:  newOt50,
//           overtimeHours100: newOt100,
//         });
//         setPreview({
//           grossSalary:         result.grossSalary,
//           netSalary:           result.netSalary,
//           cnssSalarial:        result.cnssSalarial,
//           its:                 result.its,
//           totalBonuses:        result.totalBonuses ?? 0,
//           totalOvertimeAmount: result.overtime?.total ?? 0,
//         });
//       } catch {
//         setPreview(null);
//       } finally {
//         setIsPreviewLoading(false);
//       }
//     }, 600);

//     setPreviewTimer(timer);
//   }, [payroll, previewTimer]);

//   // Déclencher l'aperçu à chaque changement de valeur
//   const handleBaseSalaryChange = (v: number) => {
//     setBaseSalary(v);
//     triggerPreview(v, workedDays, ot10, ot25, ot50, ot100);
//   };
//   const handleWorkedDaysChange = (v: number) => {
//     setWorkedDays(v);
//     triggerPreview(baseSalary, v, ot10, ot25, ot50, ot100);
//   };
//   const handleOt10Change  = (v: number) => { setOt10(v);  triggerPreview(baseSalary, workedDays, v,    ot25, ot50, ot100); };
//   const handleOt25Change  = (v: number) => { setOt25(v);  triggerPreview(baseSalary, workedDays, ot10, v,    ot50, ot100); };
//   const handleOt50Change  = (v: number) => { setOt50(v);  triggerPreview(baseSalary, workedDays, ot10, ot25, v,    ot100); };
//   const handleOt100Change = (v: number) => { setOt100(v); triggerPreview(baseSalary, workedDays, ot10, ot25, ot50, v); };

//   // ── Détection de changements ──────────────────────────────────────────────
//   const hasChanges = payroll ? (
//     baseSalary !== Number(payroll.baseSalary)                     ||
//     workedDays !== (payroll.workedDays ?? payroll.workDays ?? 26) ||
//     ot10       !== Number(payroll.overtimeHours10  ?? 0)          ||
//     ot25       !== Number(payroll.overtimeHours25  ?? 0)          ||
//     ot50       !== Number(payroll.overtimeHours50  ?? 0)          ||
//     ot100      !== Number(payroll.overtimeHours100 ?? 0)          ||
//     dirtyBonuses.size > 0
//   ) : false;

//   // ── Sauvegarde ────────────────────────────────────────────────────────────
//   const handleSave = async () => {
//     if (!payroll) return;

//     const workDays = payroll.workDays ?? 26;
//     if (workedDays < 0 || workedDays > workDays) {
//       alert.error('Valeur invalide', `Les jours travaillés doivent être entre 0 et ${workDays}.`);
//       return;
//     }
//     if (baseSalary < 70400) {
//       alert.error('Salaire invalide', 'Le salaire ne peut pas être inférieur au SMIG (70 400 FCFA).');
//       return;
//     }

//     setIsSaving(true);
//     const bonusErrors: string[] = [];

//     try {
//       await api.patch(`/payrolls/${params.id}`, {
//         baseSalary,
//         workedDays,
//         overtimeHours10:  ot10,
//         overtimeHours25:  ot25,
//         overtimeHours50:  ot50,
//         overtimeHours100: ot100,
//       });

//       if (dirtyBonuses.size > 0) {
//         await Promise.all(
//           Array.from(dirtyBonuses).map(async (bonusId) => {
//             try {
//               await api.patch(`/employee-bonuses/${bonusId}`, {
//                 amount:      bonusEdits[bonusId],
//                 fixedAmount: bonusEdits[bonusId],
//               });
//             } catch {
//               bonusErrors.push(bonuses.find(b => b.id === bonusId)?.bonusType ?? bonusId);
//             }
//           })
//         );
//       }

//       if (bonusErrors.length > 0) {
//         alert.error('Bulletin sauvegardé', `${bonusErrors.length} prime(s) non modifiées : ${bonusErrors.join(', ')}.`);
//       } else {
//         setSaved(true);
//         setTimeout(() => router.push(`/paie/${params.id}`), 800);
//       }
//     } catch (e: any) {
//       alert.error('Erreur de sauvegarde', e?.response?.data?.message || e?.message || 'Impossible de sauvegarder.');
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   // ── Guards ────────────────────────────────────────────────────────────────
//   if (isLoading) return (
//     <div className="min-h-[60vh] flex items-center justify-center">
//       <Loader2 size={32} className="animate-spin text-indigo-500" />
//     </div>
//   );
//   if (!payroll) return null;

//   const workDays    = payroll.workDays ?? 26;
//   const absenceDays = Math.max(0, workDays - workedDays);

//   // Valeurs affichées (aperçu si disponible, sinon valeurs BDD)
//   const displayGross = preview?.grossSalary  ?? payroll.grossSalary;
//   const displayNet   = preview?.netSalary    ?? payroll.netSalary;
//   const displayCnss  = preview?.cnssSalarial ?? payroll.cnssSalarial;
//   const displayIts   = preview?.its          ?? payroll.its;

//   return (
//     <div className="max-w-[680px] mx-auto px-4 py-6 pb-20">

//       {/* ── Header ────────────────────────────────────────────────────────── */}
//       <div className="flex items-center gap-3 mb-6">
//         <button onClick={() => router.back()}
//           className="w-9 h-9 rounded-xl border border-gray-200 dark:border-gray-700
//                      bg-white dark:bg-gray-800 flex items-center justify-center
//                      hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
//           <ArrowLeft size={17} className="text-gray-500 dark:text-gray-400" />
//         </button>
//         <div>
//           <h1 className="text-xl font-black text-gray-900 dark:text-white">Modifier le bulletin</h1>
//           <p className="text-xs text-gray-500 dark:text-gray-400">
//             {payroll.employee?.firstName} {payroll.employee?.lastName}
//             {' · '}{MONTHS[payroll.month - 1]} {payroll.year}
//           </p>
//         </div>
//         <span className="ml-auto text-[10px] font-bold px-2.5 py-1 rounded-lg
//                          bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400
//                          border border-amber-200 dark:border-amber-700">
//           DRAFT
//         </span>
//       </div>

//       {/* ── Notice ────────────────────────────────────────────────────────── */}
//       <div className="flex items-start gap-2.5 p-3 mb-5 rounded-xl
//                       bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
//         <AlertCircle size={13} className="text-blue-500 dark:text-blue-400 mt-0.5 shrink-0" />
//         <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
//           <strong>Recalcul automatique</strong> — L'aperçu ci-dessous se met à jour en temps réel.
//           Après sauvegarde, le backend recalcule CNSS, ITS et net à payer.
//         </p>
//       </div>

//       {/* ── Aperçu résultat (recalcul temps réel) ─────────────────────────── */}
//       <div className="bg-gray-900 dark:bg-black rounded-2xl p-5 mb-5 relative overflow-hidden">
//         {isPreviewLoading && (
//           <div className="absolute inset-0 bg-gray-900/60 dark:bg-black/60 flex items-center justify-center rounded-2xl z-10">
//             <RefreshCw size={18} className="animate-spin text-white" />
//           </div>
//         )}

//         <div className="flex items-center justify-between mb-4">
//           <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
//             {preview ? '⚡ Aperçu recalculé' : 'Valeurs actuelles'}
//           </p>
//           {preview && (
//             <span className="text-[10px] text-violet-400 font-semibold bg-violet-900/30 px-2 py-0.5 rounded-full">
//               Simulation live
//             </span>
//           )}
//         </div>

//         <div className="grid grid-cols-2 gap-3 mb-3">
//           {/* Net à payer — le plus important */}
//           <div className="col-span-2 bg-white/5 rounded-xl p-4">
//             <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Net à payer</p>
//             <div className="flex items-end gap-3">
//               <p className="text-2xl font-black font-mono text-white tracking-tight">
//                 {fmt(displayNet)}
//                 <span className="text-sm font-normal text-gray-400 ml-1.5">FCFA</span>
//               </p>
//               {preview && <Delta before={payroll.netSalary} after={displayNet} />}
//             </div>
//           </div>
//         </div>

//         <div className="grid grid-cols-3 gap-2">
//           <div className="bg-white/5 rounded-xl p-3">
//             <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Brut</p>
//             <p className="font-bold font-mono text-emerald-400 text-sm">{fmt(displayGross)} F</p>
//             {preview && <Delta before={payroll.grossSalary} after={displayGross} />}
//           </div>
//           <div className="bg-white/5 rounded-xl p-3">
//             <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">CNSS</p>
//             <p className="font-bold font-mono text-red-400 text-sm">{fmt(displayCnss)} F</p>
//             {preview && <Delta before={payroll.cnssSalarial} after={displayCnss} />}
//           </div>
//           <div className="bg-white/5 rounded-xl p-3">
//             <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">ITS</p>
//             <p className="font-bold font-mono text-red-400 text-sm">{fmt(displayIts)} F</p>
//             {preview && <Delta before={payroll.its} after={displayIts} />}
//           </div>
//         </div>
//       </div>

//       {/* ── Salaire de base ───────────────────────────────────────────────── */}
//       <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 mb-4">
//         <div className="flex items-center gap-2 mb-3">
//           <DollarSign size={15} className="text-emerald-500" />
//           <h3 className="font-bold text-sm text-gray-900 dark:text-white">Salaire de base</h3>
//         </div>
//         <div className="flex items-center gap-2">
//           <input
//             type="number"
//             value={baseSalary}
//             onChange={e => handleBaseSalaryChange(Number(e.target.value))}
//             className={`flex-1 px-3 py-2.5 rounded-xl border text-base font-bold font-mono outline-none
//                         transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white
//                         focus:ring-2 focus:ring-violet-500/20
//                         ${baseSalary < 70400
//                           ? 'border-red-300 dark:border-red-700'
//                           : baseSalary !== Number(payroll.baseSalary)
//                             ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/10'
//                             : 'border-gray-200 dark:border-gray-600'}`}
//           />
//           <span className="text-sm text-gray-400 whitespace-nowrap">FCFA</span>
//         </div>
//         {baseSalary < 70400 ? (
//           <p className="text-xs text-red-500 mt-1.5">⚠ Inférieur au SMIG (70 400 FCFA)</p>
//         ) : baseSalary !== Number(payroll.baseSalary) ? (
//           <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1.5">
//             {fmt(payroll.baseSalary)} → {fmt(baseSalary)} FCFA
//           </p>
//         ) : null}
//       </div>

//       {/* ── Présence ──────────────────────────────────────────────────────── */}
//       <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 mb-4">
//         <div className="flex items-center gap-2 mb-3">
//           <Calendar size={15} className="text-violet-500" />
//           <h3 className="font-bold text-sm text-gray-900 dark:text-white">Présence</h3>
//           <span className="ml-auto text-[10px] text-gray-400">Base : {workDays} jours ouvrables</span>
//         </div>

//         <div className="flex items-center gap-2.5 mb-2">
//           <button onClick={() => handleWorkedDaysChange(Math.max(0, workedDays - 1))}
//             className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700
//                        flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer">
//             <Minus size={13} className="text-gray-600 dark:text-gray-300" />
//           </button>
//           <input
//             type="number" min={0} max={workDays} value={workedDays}
//             onChange={e => handleWorkedDaysChange(Math.min(workDays, Math.max(0, Number(e.target.value))))}
//             className="w-16 text-center font-black text-lg font-mono border border-gray-200 dark:border-gray-600
//                        rounded-xl py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none"
//           />
//           <button onClick={() => handleWorkedDaysChange(Math.min(workDays, workedDays + 1))}
//             className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700
//                        flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer">
//             <Plus size={13} className="text-gray-600 dark:text-gray-300" />
//           </button>
//           {absenceDays > 0
//             ? <span className="text-xs font-bold text-orange-500">→ {absenceDays}j d'absence</span>
//             : <span className="text-xs font-bold text-emerald-500">✓ Mois complet</span>
//           }
//         </div>

//         <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
//           <div className="h-full rounded-full transition-all duration-300"
//             style={{
//               width: `${(workedDays / workDays) * 100}%`,
//               background: absenceDays === 0 ? '#10b981' : '#f97316',
//             }} />
//         </div>
//       </div>

//       {/* ── Heures supplémentaires ────────────────────────────────────────── */}
//       <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 mb-4">
//         <div className="flex items-center gap-2 mb-3">
//           <Clock size={15} className="text-orange-500" />
//           <h3 className="font-bold text-sm text-gray-900 dark:text-white">Heures supplémentaires</h3>
//           <span className="ml-auto text-[10px] text-gray-400">Décret 78-360</span>
//         </div>
//         <OtRow label="+10%"  sub="5 premières heures"   value={ot10}  onChange={handleOt10Change} />
//         <OtRow label="+25%"  sub="Heures suivantes"     value={ot25}  onChange={handleOt25Change} />
//         <OtRow label="+50%"  sub="Nuit / repos / férié" value={ot50}  onChange={handleOt50Change} />
//         <OtRow label="+100%" sub="Nuit dim. / férié"    value={ot100} onChange={handleOt100Change} />

//         {(ot10 + ot25 + ot50 + ot100) > 0 && (
//           <div className="mt-2 px-3 py-2 bg-orange-50 dark:bg-orange-900/10 rounded-xl">
//             <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
//               Total : {(ot10 + ot25 + ot50 + ot100).toFixed(1)} h sup
//               {preview?.totalOvertimeAmount ? ` → +${fmt(preview.totalOvertimeAmount)} FCFA` : ''}
//             </span>
//           </div>
//         )}
//       </div>

//       {/* ── Primes ────────────────────────────────────────────────────────── */}
//       {bonuses.length > 0 && (
//         <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 mb-4">
//           <div className="flex items-center gap-2 mb-1">
//             <Gift size={15} className="text-cyan-500" />
//             <h3 className="font-bold text-sm text-gray-900 dark:text-white">Primes de l'employé</h3>
//           </div>
//           <p className="text-[10px] text-gray-400 mb-3">Seules les primes à montant fixe sont modifiables ici.</p>

//           <div className="space-y-2">
//             {bonuses.map(b => {
//               const currentVal  = bonusEdits[b.id] ?? Number(b.amount ?? b.fixedAmount ?? 0);
//               const isDirty     = dirtyBonuses.has(b.id);
//               const origVal     = Number(b.amount ?? b.fixedAmount ?? 0);
//               const isNonTaxable = b.isTaxable === false;
//               const taxableOnly  = b.isTaxable === true && b.isCnss === false;

//               return (
//                 <div key={b.id}
//                   className={`flex items-center gap-3 p-3 rounded-xl border transition-all
//                     ${isDirty
//                       ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800'
//                       : 'bg-gray-50 dark:bg-gray-700/30 border-gray-100 dark:border-gray-700'
//                     }`}>
//                   <div className="flex-1 min-w-0">
//                     <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{b.bonusType}</span>
//                     <span className="ml-2 text-[10px] text-gray-400">
//                       {(b.isRecurring !== false || b.frequency === 'MONTHLY') ? 'mensuelle' : 'ponctuelle'}
//                     </span>
//                     <span className="inline-flex gap-1 ml-2 align-middle">
//                       {!isNonTaxable && (
//                         <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full
//                                          bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300
//                                          border border-cyan-200 dark:border-cyan-700">ITS</span>
//                       )}
//                       {!isNonTaxable && !taxableOnly && (
//                         <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full
//                                          bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300
//                                          border border-emerald-200 dark:border-emerald-700">CNSS</span>
//                       )}
//                       {isNonTaxable && (
//                         <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full
//                                          bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300
//                                          border border-amber-200 dark:border-amber-700">Net direct</span>
//                       )}
//                       {taxableOnly && !isNonTaxable && (
//                         <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full
//                                          bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300
//                                          border border-indigo-200 dark:border-indigo-700">ITS seul</span>
//                       )}
//                     </span>
//                   </div>

//                   <input
//                     type="number"
//                     value={currentVal}
//                     onChange={e => {
//                       const v = Number(e.target.value);
//                       setBonusEdits(prev => ({ ...prev, [b.id]: v }));
//                       setDirtyBonuses(prev => {
//                         const next = new Set(prev);
//                         v !== origVal ? next.add(b.id) : next.delete(b.id);
//                         return next;
//                       });
//                     }}
//                     className="w-28 px-2.5 py-1.5 border border-gray-200 dark:border-gray-600
//                                rounded-lg text-sm font-mono font-bold text-right outline-none
//                                bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
//                   />
//                   <span className="text-xs text-gray-400">F</span>
//                   {isDirty && <span className="text-xs font-bold text-emerald-500 whitespace-nowrap">✓</span>}
//                 </div>
//               );
//             })}
//           </div>
//           <p className="text-[10px] text-orange-500 dark:text-orange-400 mt-3">
//             ⚠ Modifier une prime ici change sa valeur permanente pour les prochains bulletins.
//           </p>
//         </div>
//       )}

//       {/* ── Boutons d'action ──────────────────────────────────────────────── */}
//       <div className="flex gap-3">
//         <button onClick={() => router.back()}
//           className="flex-1 py-3 rounded-xl font-bold text-sm cursor-pointer transition-colors
//                      bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300
//                      hover:bg-gray-200 dark:hover:bg-gray-600 border border-transparent">
//           Annuler
//         </button>

//         <button
//           onClick={handleSave}
//           disabled={isSaving || !hasChanges || saved}
//           className={`flex-[2] py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2
//                       transition-all duration-200
//                       ${saved
//                         ? 'bg-emerald-500 text-white cursor-not-allowed'
//                         : !hasChanges || isSaving
//                           ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
//                           : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/25 cursor-pointer'
//                       }`}>
//           {isSaving ? (
//             <><Loader2 size={17} className="animate-spin" /> Sauvegarde...</>
//           ) : saved ? (
//             <><Check size={17} /> Sauvegardé !</>
//           ) : (
//             <>
//               <Save size={17} />
//               Enregistrer
//               {dirtyBonuses.size > 0 ? ` + ${dirtyBonuses.size} prime${dirtyBonuses.size > 1 ? 's' : ''}` : ''}
//             </>
//           )}
//         </button>
//       </div>

//       {!hasChanges && !saved && (
//         <p className="text-center text-xs text-gray-400 mt-3">
//           Aucune modification — modifiez au moins un champ pour activer la sauvegarde
//         </p>
//       )}
//     </div>
//   );
// }



'use client';

// ============================================================================
// app/(dashboard)/paie/[id]/modifier/page.tsx
// Page d'édition d'un bulletin existant — même UX que la paie manuelle
// Charge toutes les données du bulletin et permet de les modifier
// Le calculateur recalcule en temps réel avant de sauvegarder
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Plus, Trash2, Loader2, CheckCircle2,
  Calculator, AlertCircle, ChevronDown, ChevronUp,
  Building2, CreditCard, Wallet, Save, History,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Row {
  localId: string;
  label:   string;
  base:    number | '';
  rate:    number | '';
  amount:  number;
}

interface ManualDeduction {
  localId: string;
  label:   string;
  amount:  number | '';
}

interface SimResult {
  employee:         { id: string; firstName: string; lastName: string; baseSalary: number; effectiveBaseSalary: number; isSubjectToCnss: boolean; isSubjectToIrpp: boolean };
  month:            number; year: number; daysToPay: number; workDays: number;
  absenceDeduction: number;
  overtime:         { hours10: number; amount10: number; hours25: number; amount25: number; hours50: number; amount50: number; hours100: number; amount100: number; total: number };
  bonuses:          Array<{ bonusType: string; amount: number }>;
  adjustedBaseSalary: number; grossSalary: number;
  cnssSalarial:     number; its: number; totalDeductions: number; netSalary: number;
  cnssEmployerPension: number; cnssEmployerFamily: number; cnssEmployerAccident: number;
  tusDgiAmount:     number; tusCnssAmount: number; totalEmployerCost: number;
  loans:            any[]; advances: any[];
  totalLoanDeduction: number; totalAdvanceDeduction: number;
  settings:         { cnssSalarialRate: number; overtimeRate10: number; overtimeRate25: number; overtimeRate50: number; overtimeRate100: number };
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const ALL_PRIME_LABELS = [
  "Prime d'ancienneté","Prime d'assiduité","Prime de confiance","Prime de garde",
  "Prime de motivation","Prime de précaire","Prime de responsabilité","Prime de risque",
  "Prime de base congé","Prime de diplôme","Prime de technicité","Prime de rendement",
  "Prime de résultat","Prime de fin d'année","Prime de performance","Prime exceptionnelle",
  "Prime de poste","Prime de nuit","Prime de dimanche","Prime de caisse",
  "Gratification","13ème mois","Prime d'intéressement",
];

const ALL_INDEM_LABELS = [
  "Indemnité de transport","Indemnité de logement","Indemnité de panier",
  "Indemnité kilométrique","Indemnité de représentation","Indemnité vestimentaire",
  "Indemnité de déplacement","Indemnité de téléphone","Indemnité de salissure",
  "Indemnité de fonction","Indemnité de stage","Indemnité d'expatriation",
];

const uid  = () => Math.random().toString(36).slice(2, 9);
const fmt  = (v: number) => Math.round(v || 0).toLocaleString('fr-FR');
const n    = (v: number | '') => Number(v) || 0;

// ─── Micro-composants ────────────────────────────────────────────────────────

const SLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">{children}</label>
);

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 ${className}`}>
    {children}
  </div>
);

const SectionHeader = ({ icon, title, subtitle, total, color }: {
  icon: React.ReactNode; title: string; subtitle: string; total?: number; color: string;
}) => (
  <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-700/50">
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{title}</p>
      <p className="text-[11px] text-gray-400 dark:text-gray-500">{subtitle}</p>
    </div>
    {total != null && total > 0 && (
      <span className="text-sm font-mono font-bold text-gray-600 dark:text-gray-300 shrink-0">{fmt(total)} F</span>
    )}
  </div>
);

const BLine = ({ label, value, cls, sm }: { label: string; value: string; cls?: string; sm?: boolean }) => (
  <div className={`flex items-center justify-between ${sm ? 'py-0.5' : 'py-1.5'}`}>
    <span className={`${sm ? 'text-xs' : 'text-sm'} text-gray-500 dark:text-gray-400`}>{label}</span>
    <span className={`font-mono font-bold tabular-nums ${sm ? 'text-xs' : 'text-sm'} ${cls ?? 'text-gray-700 dark:text-gray-200'}`}>{value}</span>
  </div>
);

// ─── LabelInput — autocomplete contextuel ────────────────────────────────────

const LabelInput = ({ value, onChange, placeholder, suggestions, className = '' }: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; suggestions: string[]; className?: string;
}) => {
  const [open, setOpen]   = React.useState(false);
  const [query, setQuery] = React.useState(value);
  const ref               = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => { setQuery(value); }, [value]);
  React.useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered = query.length >= 1
    ? suggestions.filter(s => s.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : [];

  const handleChange = (v: string) => { setQuery(v); onChange(v); setOpen(true); };
  const handleSelect = (s: string) => { setQuery(s); onChange(s); setOpen(false); };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <input type="text" value={query} onChange={e => handleChange(e.target.value)}
        onFocus={() => query.length >= 1 && setOpen(true)} placeholder={placeholder}
        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-400/30 placeholder:text-gray-300" />
      <AnimatePresence>
        {open && filtered.length > 0 && (
          <motion.div initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className="absolute z-[999] left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden">
            {filtered.map(s => {
              const idx = s.toLowerCase().indexOf(query.toLowerCase());
              return (
                <button key={s} onMouseDown={() => handleSelect(s)}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors border-b border-gray-50 dark:border-gray-700/50 last:border-0">
                  {idx === -1 ? s : <>{s.slice(0, idx)}<span className="font-bold text-sky-600 dark:text-sky-400">{s.slice(idx, idx + query.length)}</span>{s.slice(idx + query.length)}</>}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── InputRow ────────────────────────────────────────────────────────────────

const InputRow = ({ row, onChangeLabel, onChangeBase, onChangeRate, onRemove, placeholder = 'Libellé…', suggestions = [] }: {
  row: Row; onChangeLabel: (v: string) => void; onChangeBase: (v: number | '') => void;
  onChangeRate: (v: number | '') => void; onRemove: () => void; placeholder?: string; suggestions?: string[];
}) => (
  <motion.div initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-4 }}
    className="group grid grid-cols-[1fr_100px_70px_90px_28px] gap-2 items-center">
    <LabelInput value={row.label} onChange={onChangeLabel} placeholder={placeholder} suggestions={suggestions} />
    <div className="relative">
      <input type="number" value={row.base} onChange={e => onChangeBase(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Base"
        className="w-full pl-2 pr-5 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono text-right text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-400/30" />
      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-gray-400">F</span>
    </div>
    <input type="number" value={row.rate} step="0.01" onChange={e => onChangeRate(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Taux"
      className="w-full px-2 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono text-center text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-400/30" />
    <div className={`px-2 py-2 rounded-xl text-sm font-black font-mono text-right tabular-nums border transition-colors ${row.amount > 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700' : 'bg-gray-50 dark:bg-gray-900/30 border-gray-100 dark:border-gray-700/50 text-gray-300'}`}>
      {row.amount > 0 ? row.amount.toLocaleString('fr-FR') : '—'}
    </div>
    <button onClick={onRemove} className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all">
      <Trash2 size={13} />
    </button>
  </motion.div>
);

const SimpleRow = ({ row, onChangeLabel, onChangeAmount, onRemove, placeholder = 'Libellé…' }: {
  row: Row; onChangeLabel: (v: string) => void; onChangeAmount: (v: number | '') => void;
  onRemove: () => void; placeholder?: string;
}) => (
  <motion.div initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-4 }}
    className="group flex items-center gap-2">
    <input type="text" value={row.label} onChange={e => onChangeLabel(e.target.value)} placeholder={placeholder}
      className="flex-1 min-w-0 px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-400/30" />
    <div className="relative w-32 shrink-0">
      <input type="number" value={row.amount || ''} onChange={e => onChangeAmount(e.target.value === '' ? '' : Number(e.target.value))} placeholder="0"
        className="w-full pl-3 pr-5 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-right text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-400/30" />
      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">F</span>
    </div>
    <button onClick={onRemove} className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all shrink-0">
      <Trash2 size={13} />
    </button>
  </motion.div>
);

// ─── Page principale ──────────────────────────────────────────────────────────

export default function ModifierBulletinPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { bp } = useBasePath();

  // ── Chargement ──────────────────────────────────────────────────────────────
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [empName, setEmpName]   = useState('');
  const [month, setMonth]       = useState('');
  const [year, setYear]         = useState(0);
  const [employeeId, setEmployeeId] = useState('');
  const [baseSalary, setBaseSalary] = useState(0);

  // ── Champs formulaire ────────────────────────────────────────────────────────
  const [workedDays, setWorkedDays] = useState<number | ''>(26);
  const [ot10, setOt10]   = useState<number | ''>(0);
  const [ot25, setOt25]   = useState<number | ''>(0);
  const [ot50, setOt50]   = useState<number | ''>(0);
  const [ot100, setOt100] = useState<number | ''>(0);

  const [primes, setPrimes]         = useState<Row[]>([]);
  const [indemnites, setIndemnites] = useState<Row[]>([]);
  const [retenues, setRetenues]     = useState<ManualDeduction[]>([]);

  const [congesDroits, setCongesDroits]     = useState<number | ''>('');
  const [congesPris, setCongesPris]         = useState<number | ''>('');
  const [congesSolde, setCongesSolde]       = useState<number | ''>('');
  const [joursCongesPris, setJoursCongesPris] = useState<number | ''>('');

  // ── Sim ─────────────────────────────────────────────────────────────────────
  const [sim, setSim]               = useState<SimResult | null>(null);
  const [simLoading, setSimLoading] = useState(false);
  const [simError, setSimError]     = useState<string | null>(null);
  const [showEmpCost, setShowEmpCost] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // ── Submit ───────────────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved]           = useState(false);

  // ── Chargement initial du bulletin ───────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const payroll: any = await api.get(`/payrolls/${params.id}`);
        if (!payroll) { setNotFound(true); return; }

        // Infos de base
        setEmpName(`${payroll.employee?.firstName ?? ''} ${payroll.employee?.lastName ?? ''}`.trim());
        setMonth(MONTHS[(payroll.month ?? 1) - 1]);
        setYear(payroll.year ?? new Date().getFullYear());
        setEmployeeId(payroll.employee?.id ?? '');
        setBaseSalary(Number(payroll.baseSalary ?? payroll.employee?.baseSalary ?? 0));

        // Jours travaillés
        setWorkedDays(payroll.workedDays ?? payroll.workDays ?? 26);

        // Heures sup
        setOt10(Number(payroll.overtimeHours10  ?? 0));
        setOt25(Number(payroll.overtimeHours25  ?? 0));
        setOt50(Number(payroll.overtimeHours50  ?? 0));
        setOt100(Number(payroll.overtimeHours100 ?? 0));

        // Extraire primes depuis les items (GAIN isTaxable, hors SAL_BASE et INDEM_CONGE)
        const items: any[] = payroll.items ?? [];

        const extractedPrimes: Row[] = items
          .filter(i => i.type === 'GAIN' && i.isTaxable && !['SAL_BASE','INDEM_CONGE','ABS_DEDUCT','ABS_CONGE'].includes(i.code))
          .map(i => ({
            localId: uid(),
            label:   i.label ?? '',
            base:    i.base     ? Number(i.base)     : '',
            rate:    i.quantity ? Number(i.quantity)  : (i.rate ? Number(i.rate) : 1),
            amount:  Number(i.amount ?? 0),
          }));
        if (extractedPrimes.length > 0) setPrimes(extractedPrimes);

        // Indemnités (GAIN !isTaxable && !isCnss)
        const extractedIndem: Row[] = items
          .filter(i => i.type === 'GAIN' && !i.isTaxable && !i.isCnss)
          .map(i => ({
            localId: uid(),
            label:   i.label ?? '',
            base:    i.base     ? Number(i.base)     : '',
            rate:    i.quantity ? Number(i.quantity)  : (i.rate ? Number(i.rate) : 1),
            amount:  Number(i.amount ?? 0),
          }));
        if (extractedIndem.length > 0) setIndemnites(extractedIndem);

        // Retenues libres (MANUAL_DEDUCTION)
        const extractedRet: ManualDeduction[] = items
          .filter(i => i.code === 'MANUAL_DEDUCTION')
          .map(i => ({
            localId: uid(),
            label:   i.label ?? '',
            amount:  Number(i.amount ?? 0),
          }));
        if (extractedRet.length > 0) setRetenues(extractedRet);

        // Congés — depuis les items snapshot ou champs directs
        if (payroll.congesDroits != null) setCongesDroits(Number(payroll.congesDroits));
        if (payroll.congesPris   != null) setCongesPris(Number(payroll.congesPris));
        if (payroll.congesSolde  != null) setCongesSolde(Number(payroll.congesSolde));

      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.id]);

  // ── Helpers rows ─────────────────────────────────────────────────────────────
  const newRow = (): Row => ({ localId: uid(), label: '', base: '', rate: 1, amount: 0 });

  const updateRow = (set: React.Dispatch<React.SetStateAction<Row[]>>, localId: string, patch: Partial<Row>) =>
    set(prev => prev.map(r => {
      if (r.localId !== localId) return r;
      const next = { ...r, ...patch };
      next.amount = Math.round((Number(next.base) || 0) * (Number(next.rate) || 0));
      return next;
    }));

  const removeRow = (set: React.Dispatch<React.SetStateAction<Row[]>>, localId: string) =>
    set(prev => prev.filter(r => r.localId !== localId));

  // ── Simulateur ───────────────────────────────────────────────────────────────
  const buildBonusPayload = (rows: Row[], taxable: boolean) =>
    rows.filter(r => n(r.amount) > 0).map(r => ({
      bonusType:  r.label || (taxable ? 'Prime' : 'Indemnité'),
      amount:     r.amount,
      base:       n(r.base) > 0 ? n(r.base) : r.amount,
      rate:       n(r.rate) > 0 ? n(r.rate) : (n(r.base) > 0 ? 1 : undefined),
      isTaxable:  taxable,
      isCnss:     taxable,
      fiscalType: taxable ? 'TAXABLE_CNSS' : 'NON_TAXABLE',
    }));

  useEffect(() => {
    if (!employeeId || !baseSalary) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(runSim, 700);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primes, indemnites, workedDays, ot10, ot25, ot50, ot100, retenues, employeeId, baseSalary]);

  const runSim = async () => {
    if (!employeeId || !baseSalary) return;
    setSimLoading(true); setSimError(null);
    try {
      const monthNum = MONTHS.findIndex(m => m === month) + 1;
      const result = await api.post<SimResult>('/payrolls/simulate', {
        employeeId,
        month:            monthNum,
        year,
        workedDays:       n(workedDays) || 26,
        baseSalary,
        overtimeHours10:  n(ot10),
        overtimeHours25:  n(ot25),
        overtimeHours50:  n(ot50),
        overtimeHours100: n(ot100),
        manualBonuses:    [...buildBonusPayload(primes, true), ...buildBonusPayload(indemnites, false)],
        manualDeductions: retenues.filter(r => n(r.amount) > 0).map(r => ({ label: r.label || 'Retenue', amount: n(r.amount) })),
      });
      setSim(result);
    } catch (e: any) {
      setSimError(e?.response?.data?.message || e?.message || 'Erreur simulation');
      setSim(null);
    } finally {
      setSimLoading(false);
    }
  };

  // ── Sauvegarde ───────────────────────────────────────────────────────────────
  const submit = async () => {
    if (!sim || !employeeId) return;
    setSubmitting(true);
    try {
      const monthNum = MONTHS.findIndex(m => m === month) + 1;
      await api.patch(`/payrolls/${params.id}`, {
        workedDays:       n(workedDays) || 26,
        baseSalary,
        overtimeHours10:  n(ot10),
        overtimeHours25:  n(ot25),
        overtimeHours50:  n(ot50),
        overtimeHours100: n(ot100),
        manualBonuses:    [...buildBonusPayload(primes, true), ...buildBonusPayload(indemnites, false)],
        manualDeductions: retenues.filter(r => n(r.amount) > 0).map(r => ({ label: r.label || 'Retenue', amount: n(r.amount) })),
        congesDroits:     n(congesDroits) || undefined,
        congesPris:       n(congesPris)   || undefined,
        congesSolde:      n(congesSolde)  || undefined,
        joursCongesPris:  n(joursCongesPris) || undefined,
        // ✅ Recalculés par le back depuis les manualBonuses
        month:            monthNum,
        year,
      });
      setSaved(true);
      setTimeout(() => router.push(bp(`/paie/${params.id}`)), 1500);
    } catch (e: any) {
      alert(`Erreur : ${e?.response?.data?.message || e?.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Totaux ───────────────────────────────────────────────────────────────────
  const totalPrimes     = primes.reduce((s, r) => s + r.amount, 0);
  const totalIndemnites = indemnites.reduce((s, r) => s + r.amount, 0);
  const totalRetenues   = retenues.reduce((s, r) => s + n(r.amount), 0);

  // ── États de chargement ───────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-sky-500" size={32} />
    </div>
  );

  if (notFound) return (
    <div className="p-8 text-center">
      <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
      <p className="text-gray-500 mb-4">Bulletin introuvable ou non modifiable</p>
      <button onClick={() => router.back()} className="px-6 py-2 bg-gray-900 text-white rounded-xl font-bold">Retour</button>
    </div>
  );

  return (
    <div className="max-w-[1380px] mx-auto pb-28 px-4 pt-1">

      {/* ── Header ── */}
      <div className="flex items-center gap-4 mb-7">
        <button onClick={() => router.back()}
          className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shrink-0">
          <ArrowLeft size={18} className="text-gray-500" />
        </button>
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Modifier le bulletin</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 uppercase tracking-wide">Édition</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {empName} — {month} {year}
          </p>
        </div>
      </div>

      {/* ── Bandeau infos bulletin ── */}
      <div className="mb-4 flex items-center gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
        <History size={16} className="text-amber-500 shrink-0" />
        <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
          Les données du bulletin <strong>{month} {year}</strong> ont été chargées. Modifiez les éléments puis confirmez pour recalculer et sauvegarder.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6 items-start">

        {/* ════ COL GAUCHE ════ */}
        <div className="lg:col-span-3 space-y-4">

          {/* ── Jours travaillés ── */}
          <Card className="p-5">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4">Temps de travail</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <SLabel>Jours travaillés</SLabel>
                <div className="flex items-center gap-3">
                  <input type="number" min={0} max={31} value={workedDays}
                    onChange={e => setWorkedDays(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-20 px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-center text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30" />
                  <span className="text-xs text-gray-400">jours</span>
                </div>
              </div>
            </div>

            {/* Heures supplémentaires */}
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 mt-5">Heures supplémentaires</p>
            <div className="grid grid-cols-4 gap-3">
              {([
                { label:'+10%',  v:ot10,  set:setOt10,  col:'text-amber-500',  ring:'focus:ring-amber-400/30' },
                { label:'+25%',  v:ot25,  set:setOt25,  col:'text-orange-500', ring:'focus:ring-orange-400/30' },
                { label:'+50%',  v:ot50,  set:setOt50,  col:'text-rose-500',   ring:'focus:ring-rose-400/30' },
                { label:'+100%', v:ot100, set:setOt100, col:'text-red-500',    ring:'focus:ring-red-400/30' },
              ] as const).map(({ label, v, set, col, ring }) => (
                <div key={label} className="text-center">
                  <label className={`block text-xs font-bold mb-1.5 ${col}`}>{label}</label>
                  <div className="relative">
                    <input type="number" min={0} value={v}
                      onChange={e => set(e.target.value === '' ? 0 : Number(e.target.value) as any)}
                      className={`w-full pl-2 pr-5 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-center text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 ${ring}`} />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">h</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* ── Primes ── */}
          <Card className="overflow-visible">
            <SectionHeader
              icon={<span className="text-violet-600 dark:text-violet-400 text-xs font-black">%</span>}
              title="Primes"
              subtitle="Soumises à CNSS et ITS"
              total={totalPrimes}
              color="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 text-violet-600"
            />
            <div className="px-5 py-4 space-y-2">
              <div className="grid grid-cols-[1fr_100px_70px_90px_28px] gap-2 px-1 mb-1">
                {['Libellé','Base (F)','Taux','Gain (F)',''].map((h, i) => (
                  <span key={i} className={`text-[10px] font-bold text-gray-400 uppercase tracking-wide ${i===3?'text-right':''}`}>{h}</span>
                ))}
              </div>
              <AnimatePresence initial={false}>
                {primes.map(row => (
                  <InputRow key={row.localId} row={row}
                    placeholder="Ex : Prime d'ancienneté, de rendement…"
                    suggestions={ALL_PRIME_LABELS}
                    onChangeLabel={v => updateRow(setPrimes, row.localId, { label: v })}
                    onChangeBase={v => updateRow(setPrimes, row.localId, { base: v })}
                    onChangeRate={v => updateRow(setPrimes, row.localId, { rate: v })}
                    onRemove={() => removeRow(setPrimes, row.localId)} />
                ))}
              </AnimatePresence>
              <button onClick={() => setPrimes(p => [...p, newRow()])}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/30 rounded-lg transition-colors mt-1">
                <Plus size={11} /> Ajouter une prime
              </button>
            </div>
          </Card>

          {/* ── Indemnités ── */}
          <Card className="overflow-visible">
            <SectionHeader
              icon={<span className="text-emerald-600 dark:text-emerald-400 text-xs font-black">≠</span>}
              title="Indemnités"
              subtitle="Non soumises à CNSS ni ITS"
              total={totalIndemnites}
              color="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-600"
            />
            <div className="px-5 py-4 space-y-2">
              <div className="grid grid-cols-[1fr_100px_70px_90px_28px] gap-2 px-1 mb-1">
                {['Libellé','Base (F)','Taux','Gain (F)',''].map((h, i) => (
                  <span key={i} className={`text-[10px] font-bold text-gray-400 uppercase tracking-wide ${i===3?'text-right':''}`}>{h}</span>
                ))}
              </div>
              <AnimatePresence initial={false}>
                {indemnites.map(row => (
                  <InputRow key={row.localId} row={row}
                    placeholder="Ex : Indemnité de transport, de logement…"
                    suggestions={ALL_INDEM_LABELS}
                    onChangeLabel={v => updateRow(setIndemnites, row.localId, { label: v })}
                    onChangeBase={v => updateRow(setIndemnites, row.localId, { base: v })}
                    onChangeRate={v => updateRow(setIndemnites, row.localId, { rate: v })}
                    onRemove={() => removeRow(setIndemnites, row.localId)} />
                ))}
              </AnimatePresence>
              <button onClick={() => setIndemnites(p => [...p, newRow()])}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg transition-colors mt-1">
                <Plus size={11} /> Ajouter une indemnité
              </button>
            </div>
          </Card>

          {/* ── Autres retenues ── */}
          <Card className="overflow-hidden">
            <SectionHeader
              icon={<span className="text-rose-600 dark:text-rose-400 text-xs font-black">−</span>}
              title="Autres retenues"
              subtitle="Retenues libres — déduites du net"
              total={totalRetenues}
              color="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800"
            />
            <div className="px-5 py-4 space-y-2">
              <AnimatePresence initial={false}>
                {retenues.map(r => (
                  <motion.div key={r.localId} initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-4 }}
                    className="group flex items-center gap-2">
                    <input type="text" value={r.label}
                      onChange={e => setRetenues(prev => prev.map(x => x.localId === r.localId ? { ...x, label: e.target.value } : x))}
                      placeholder="Ex : Remboursement, Trop-perçu…"
                      className="flex-1 min-w-0 px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-400/30" />
                    <div className="relative w-32 shrink-0">
                      <input type="number" value={r.amount || ''}
                        onChange={e => setRetenues(prev => prev.map(x => x.localId === r.localId ? { ...x, amount: e.target.value === '' ? '' : Number(e.target.value) } : x))}
                        placeholder="Montant"
                        className="w-full pl-3 pr-5 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-right text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-400/30" />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">F</span>
                    </div>
                    <button onClick={() => setRetenues(prev => prev.filter(x => x.localId !== r.localId))}
                      className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all shrink-0">
                      <Trash2 size={13} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              <button onClick={() => setRetenues(prev => [...prev, { localId: uid(), label: '', amount: '' }])}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-lg transition-colors mt-1">
                <Plus size={11} /> Ajouter une retenue
              </button>
            </div>
          </Card>

          {/* ── Congés ── */}
          <Card className="p-5">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4">Congés annuels</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label:'Droits (j)', val:congesDroits, set:setCongesDroits },
                { label:'Pris (j)',   val:congesPris,   set:setCongesPris   },
                { label:'Solde (j)', val:congesSolde,  set:setCongesSolde  },
                { label:'Jours pris ce mois', val:joursCongesPris, set:setJoursCongesPris },
              ].map(({ label, val, set }) => (
                <div key={label}>
                  <SLabel>{label}</SLabel>
                  <input type="number" min={0} value={val}
                    onChange={e => set(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-center text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30" />
                </div>
              ))}
            </div>
          </Card>

        </div>

        {/* ════ COL DROITE — Récap ════ */}
        <div className="lg:col-span-2 sticky top-4">
          <AnimatePresence mode="wait">
            {sim ? (
              <motion.div key="sim" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">

                <div className="px-5 pt-5 pb-3 border-b border-gray-100 dark:border-gray-700/50">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Récapitulatif</p>
                    {simLoading && <Loader2 size={13} className="animate-spin text-sky-400" />}
                  </div>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{empName}</p>
                  <p className="text-xs text-gray-400">{month} {year}</p>
                </div>

                <div className="px-5 py-4 space-y-0.5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Éléments de paie</p>
                  <BLine label="Salaire de base"    value={`${fmt(baseSalary)} F`} />
                  {totalPrimes > 0     && <BLine label="Primes"       value={`+${fmt(totalPrimes)} F`}     cls="text-violet-600" />}
                  {totalIndemnites > 0 && <BLine label="Indemnités"   value={`+${fmt(totalIndemnites)} F`} cls="text-emerald-600" />}
                  {sim.overtime.total  > 0 && <BLine label="Heures sup" value={`+${fmt(sim.overtime.total)} F`} cls="text-amber-600" />}
                  {sim.absenceDeduction > 0 && <BLine label="Déd. absences" value={`−${fmt(sim.absenceDeduction)} F`} cls="text-red-400" sm />}

                  <div className="flex justify-between items-center py-2 bg-emerald-50 dark:bg-emerald-900/20 px-3 rounded-xl mt-2">
                    <span className="text-sm font-bold text-emerald-800 dark:text-emerald-200">Salaire brut</span>
                    <span className="font-mono font-black text-emerald-700 dark:text-emerald-300">{fmt(sim.grossSalary)} F</span>
                  </div>

                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pt-3 mb-2">Retenues légales</p>
                  <BLine label={`CNSS (${sim.settings.cnssSalarialRate}%)`}
                    value={sim.employee.isSubjectToCnss ? `−${fmt(sim.cnssSalarial)} F` : '0 F (exempté)'}
                    cls={sim.employee.isSubjectToCnss ? 'text-red-500' : 'text-gray-400'} />
                  <BLine label="ITS / IRPP"
                    value={sim.employee.isSubjectToIrpp ? `−${fmt(sim.its)} F` : '0 F (exempté)'}
                    cls={sim.employee.isSubjectToIrpp ? 'text-red-500' : 'text-gray-400'} />
                  {totalRetenues > 0 && <BLine label="Autres retenues" value={`−${fmt(totalRetenues)} F`} cls="text-red-500" sm />}

                  <div className="mt-4 pt-4 border-t-2 border-dashed border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Net à payer</span>
                      <div className="text-right leading-none">
                        <span className="text-[26px] font-black text-gray-900 dark:text-white font-mono tracking-tight">{fmt(sim.netSalary)}</span>
                        <span className="text-sm text-gray-400 ml-1">FCFA</span>
                      </div>
                    </div>
                  </div>

                  {/* Coût employeur */}
                  <div className="mt-3 border border-orange-200 dark:border-orange-800/40 rounded-xl overflow-hidden">
                    <button onClick={() => setShowEmpCost(v => !v)}
                      className="w-full flex items-center justify-between px-4 py-2.5 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100/50 transition-colors">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-orange-700 dark:text-orange-400">
                        <Building2 size={12} /> Coût employeur
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-orange-600 dark:text-orange-400">+{fmt(sim.totalEmployerCost)} F</span>
                        {showEmpCost ? <ChevronUp size={12} className="text-orange-400"/> : <ChevronDown size={12} className="text-orange-400"/>}
                      </div>
                    </button>
                    <AnimatePresence>
                      {showEmpCost && (
                        <motion.div initial={{ height:0 }} animate={{ height:'auto' }} exit={{ height:0 }} className="overflow-hidden">
                          <div className="px-4 py-3 bg-white dark:bg-gray-800/50 space-y-0.5">
                            <BLine label="CNSS Pensions (8%)"    value={`+${fmt(sim.cnssEmployerPension)} F`}  cls="text-orange-500" sm />
                            <BLine label="CNSS Famille (10,03%)" value={`+${fmt(sim.cnssEmployerFamily)} F`}   cls="text-orange-500" sm />
                            <BLine label="CNSS Accident (2,25%)" value={`+${fmt(sim.cnssEmployerAccident)} F`} cls="text-orange-500" sm />
                            <BLine label="TUS DGI (2,025%)"      value={`+${fmt(sim.tusDgiAmount)} F`}         cls="text-amber-500"  sm />
                            <BLine label="TUS CNSS (5,475%)"     value={`+${fmt(sim.tusCnssAmount)} F`}        cls="text-amber-500"  sm />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Bouton sauvegarder */}
                <div className="px-5 pb-5">
                  {saved ? (
                    <div className="w-full py-3.5 bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm">
                      <CheckCircle2 size={15} /> Sauvegardé — redirection…
                    </div>
                  ) : (
                    <button onClick={submit} disabled={submitting || simLoading}
                      className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                      {submitting ? <><Loader2 size={15} className="animate-spin"/>Sauvegarde…</> : <><Save size={15}/>Sauvegarder le bulletin</>}
                    </button>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity:0 }} animate={{ opacity:1 }}
                className="bg-gray-50 dark:bg-gray-800/50 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl min-h-[260px] flex flex-col items-center justify-center text-center p-8">
                {simLoading
                  ? <><Loader2 size={32} className="animate-spin mb-3 text-sky-500"/><p className="text-sm font-medium text-gray-600 dark:text-gray-300">Calcul en cours…</p></>
                  : simError
                  ? <><AlertCircle size={32} className="mb-3 text-red-400"/><p className="text-sm font-medium text-red-500 max-w-[200px]">{simError}</p></>
                  : <><Calculator size={36} className="mb-3 text-gray-300 dark:text-gray-600"/><p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Chargement du bulletin…</p></>
                }
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}