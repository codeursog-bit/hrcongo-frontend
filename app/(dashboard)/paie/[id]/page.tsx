

// 'use client';

// import React, { useState, useEffect, useRef } from 'react';
// import { useRouter } from 'next/navigation';
// import {
//   ArrowLeft, Printer, Download, Check, Ban,
//   DollarSign, ChevronDown, ChevronUp, AlertCircle,
//   Loader2, Info, Building2, Gift, Pencil, Trash2, RotateCcw
// } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { api } from '@/services/api';

// import PayslipHeader from './components/PayslipHeader';
// import PayslipEmployeeInfo from './components/PayslipEmployeeInfo';
// import PayslipBreakdown from './components/PayslipBreakdown';
// import PayslipFooter from './components/PayslipFooter';

// interface PayrollData {
//   employee?: {
//     id: string;
//     firstName?: string;
//     lastName?: string;
//     isSubjectToCnss?: boolean;
//     isSubjectToIrpp?: boolean;
//     professionalCategory?: string;
//     employeeNumber?: string;
//     position?: string;
//     department?: { name?: string };
//     cnssNumber?: string;
//     nationalIdNumber?: string;
//     paymentMethod?: string;
//     maritalStatus?: string;
//     numberOfChildren?: number;
//     echelon?: string;
//     contractType?: string;
//     hireDate?: string;
//   };
//   company?: {
//     legalName?: string;
//     logo?: string;
//     address?: string;
//     rccmNumber?: string;
//     nif?: string;
//     phone?: string;
//     collectiveAgreement?: string;
//     [key: string]: any;
//   };
//   items?: Array<{
//     id: string; code: string; label: string;
//     type: 'GAIN' | 'DEDUCTION' | 'EMPLOYER_COST';
//     base?: number; rate?: number; amount: number;
//     isTaxable: boolean; isCnss: boolean; order: number;
//   }>;
//   status: string;
//   month: number;
//   year: number;
//   grossSalary: number;
//   netSalary: number;
//   totalDeductions: number;
//   totalEmployerCost?: number;
//   workDays?: number;
//   workedDays?: number;
//   absenceDays?: number;
//   daysOnLeave?: number;
//   daysRemote?: number;
//   daysHoliday?: number;
//   overtimeHours10?: number;
//   overtimeHours25?: number;
//   overtimeHours50?: number;
//   overtimeHours100?: number;
// }

// const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

// const STATUS_INFO: Record<string, { label: string; dot: string; border: string; text: string }> = {
//   DRAFT:     { label: 'Brouillon', dot: '#94a3b8', border: '#e2e8f0', text: '#64748b' },
//   VALIDATED: { label: 'Validé',    dot: '#10b981', border: '#a7f3d0', text: '#059669' },
//   PAID:      { label: 'Payé',      dot: '#0ea5e9', border: '#bae6fd', text: '#0369a1' },
//   CANCELLED: { label: 'Annulé',    dot: '#ef4444', border: '#fecaca', text: '#dc2626' },
// };

// const CONFIRM_CONFIG = {
//   validate: { title: 'Valider le bulletin ?',      sub: 'Le bulletin ne pourra plus être modifié.',          btnLabel: 'Valider',    btnColor: '#10b981', icon: Check    },
//   pay:      { title: 'Confirmer le paiement ?',    sub: "L'employé pourra accéder à son bulletin.",          btnLabel: 'Confirmer',  btnColor: '#0ea5e9', icon: DollarSign },
//   cancel:   { title: 'Annuler ce bulletin ?',      sub: 'Le bulletin sera invalidé.',                        btnLabel: 'Annuler',    btnColor: '#f97316', icon: Ban      },
//   restore:  { title: 'Remettre en brouillon ?',    sub: 'Le bulletin repassera en statut Brouillon.',        btnLabel: 'Restaurer',  btnColor: '#6366f1', icon: RotateCcw },
//   delete:   { title: 'Supprimer définitivement ?', sub: 'Action irréversible — le bulletin sera effacé.',    btnLabel: 'Supprimer',  btnColor: '#dc2626', icon: Trash2   },
// };

// export default function PayslipPage({ params }: { params: { id: string } }) {
//   const router = useRouter();
//   const printRef = useRef<HTMLDivElement>(null);

//   const [data, setData]             = useState<PayrollData | null>(null);
//   const [userRole, setUserRole]     = useState<string | null>(null);
//   const [isLoading, setIsLoading]   = useState(true);
//   const [isBusy, setIsBusy]         = useState(false);
//   const [showEmployer, setShowEmployer] = useState(false);
//   const [confirm, setConfirm]       = useState<keyof typeof CONFIRM_CONFIG | null>(null);
//   const [bonuses, setBonuses]       = useState<any[]>([]);

//   useEffect(() => { fetchData(); }, [params.id]);

//   const fetchData = async () => {
//     try {
//       const stored = localStorage.getItem('user');
//       if (stored) setUserRole(JSON.parse(stored).role);
//       const payroll = await api.get<PayrollData>(`/payrolls/${params.id}`);
//       setData(payroll);
//       if (payroll?.employee?.id) {
//         try {
//           const bd: any = await api.get(`/employee-bonuses?employeeId=${payroll.employee.id}`);
//           const all = Array.isArray(bd) ? bd : bd?.data || [];
//           setBonuses(all.filter((b: any) => b.isRecurring || b.source === 'AUTOMATIC'));
//         } catch {}
//       }
//     } catch { router.push('/paie'); }
//     finally { setIsLoading(false); }
//   };

//   const handleConfirm = async () => {
//     if (!confirm) return;
//     setIsBusy(true);
//     try {
//       if (confirm === 'delete') {
//         await api.delete(`/payrolls/${params.id}`);
//         router.push('/paie');
//         return;
//       }
//       const statusMap: Record<string, string> = {
//         validate: 'VALIDATED', pay: 'PAID', cancel: 'CANCELLED', restore: 'DRAFT',
//       };
//       const updated = await api.patch<PayrollData>(`/payrolls/${params.id}`, { status: statusMap[confirm] });
//       setData(updated);
//       setConfirm(null);
//     } catch (e: any) {
//       alert(`Erreur : ${e.response?.data?.message || e.message}`);
//     } finally { setIsBusy(false); }
//   };

//   const handleDownloadPDF = () => window.print();
//   const handlePrint       = () => window.print();

//   const fmt = (v: number) => (v ?? 0).toLocaleString('fr-FR');
//   const isAdmin = ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'].includes(userRole || '');
//   const isDraft = data?.status === 'DRAFT';

//   if (isLoading) return (
//     <div className="min-h-screen flex items-center justify-center">
//       <Loader2 className="animate-spin text-sky-500" size={32} />
//     </div>
//   );

//   if (!data) return (
//     <div className="p-8 text-center">
//       <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
//       <p className="text-gray-500">Bulletin introuvable</p>
//       <button onClick={() => router.push('/paie')}
//         className="mt-4 px-6 py-2 bg-gray-900 text-white rounded-xl font-bold">Retour</button>
//     </div>
//   );

//   const cnssItem      = (data.items || []).find(i => i.code?.toUpperCase().includes('CNSS') && i.type === 'DEDUCTION');
//   const irppItem      = (data.items || []).find(i => ['ITS','IRPP'].some(k => i.code?.toUpperCase().includes(k)) && i.type === 'DEDUCTION');
//   const employerCosts = (data.items || []).filter(i => i.type === 'EMPLOYER_COST');
//   const absItem       = (data.items || []).find(i => i.code?.toUpperCase().includes('ABSENCE') || i.label?.toLowerCase().includes('absence'));

//   const isSubjectToCnss = data.employee?.isSubjectToCnss ?? ((cnssItem?.amount ?? 0) > 0);
//   const isSubjectToIrpp = data.employee?.isSubjectToIrpp ?? ((irppItem?.amount ?? 0) > 0);
//   const statusInfo = STATUS_INFO[data.status] ?? STATUS_INFO['DRAFT'];
//   const monthLabel = MONTHS[(data.month ?? 1) - 1];

//   return (
//     <>
//       {/* ═══════════════════════════════════════
//           STYLES IMPRESSION A4
//       ═══════════════════════════════════════ */}
//       <style jsx global>{`
//         @media print {
//           body       { background: #fff !important; margin: 0; }
//           .no-print  { display: none !important; }
//           @page      { size: A4 portrait; margin: 8mm 10mm 8mm 10mm; }
//           *          { -webkit-print-color-adjust: exact !important;
//                        color-adjust: exact !important; }
//           .payslip-sheet {
//             width: 100% !important; max-width: 100% !important;
//             box-shadow: none !important; border: none !important;
//             border-radius: 0 !important; margin: 0 !important;
//           }
//         }
//       `}</style>

//       <div className="max-w-[1280px] mx-auto pb-20 px-4 print:p-0 print:max-w-none">

//         {/* ═══════════════════════════════════════
//             BARRE D'ACTIONS (masquée à l'impression)
//         ═══════════════════════════════════════ */}
//         <div className="no-print mb-6 space-y-3">

//           {/* Ligne 1 : retour + identité */}
//           <div className="flex items-center gap-3">
//             <button onClick={() => router.back()}
//               className="flex-shrink-0 p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors">
//               <ArrowLeft size={18} className="text-gray-500" />
//             </button>
//             <div className="flex items-center gap-3 min-w-0 flex-1">
//               <h1 className="font-bold text-gray-900 dark:text-white text-lg truncate">
//                 Bulletin — {data.employee?.firstName} {data.employee?.lastName}
//               </h1>
//               {/* Badge statut inline styles pour garantir rendu */}
//               <span style={{
//                 display: 'inline-flex', alignItems: 'center', gap: 5,
//                 padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
//                 border: `1.5px solid ${statusInfo.border}`, color: statusInfo.text,
//                 background: '#fff', flexShrink: 0,
//               }}>
//                 <span style={{ width: 7, height: 7, borderRadius: '50%', background: statusInfo.dot, flexShrink: 0 }} />
//                 {statusInfo.label}
//               </span>
//               <span className="text-sm text-gray-400 flex-shrink-0">{monthLabel} {data.year}</span>
//             </div>
//           </div>

//           {/* Ligne 2 : boutons d'action */}
//           <div className="flex flex-wrap items-center gap-2">

//             {/* ══════════════════════════════════════════
//                 ✅ BOUTON MODIFIER — BIEN VISIBLE, TOUJOURS EN PREMIER
//                 Affiché si statut DRAFT + rôle admin
//             ══════════════════════════════════════════ */}
//             {isAdmin && isDraft && (
//               <button
//                 onClick={() => router.push(`/paie/${params.id}/modifier`)}
//                 style={{
//                   display: 'flex', alignItems: 'center', gap: 8,
//                   padding: '10px 20px', borderRadius: 12, fontWeight: 700, fontSize: 14,
//                   background: '#0ea5e9', color: '#fff', border: 'none', cursor: 'pointer',
//                   boxShadow: '0 4px 14px rgba(14,165,233,0.35)',
//                   transition: 'all .15s',
//                 }}>
//                 <Pencil size={16} />
//                 Modifier ce bulletin
//               </button>
//             )}

//             {/* Valider */}
//             {isAdmin && data.status === 'DRAFT' && (
//               <button onClick={() => setConfirm('validate')}
//                 className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-sm transition-all text-sm">
//                 <Check size={15} /> Valider
//               </button>
//             )}
//             {/* Marquer payé */}
//             {isAdmin && data.status === 'VALIDATED' && (
//               <button onClick={() => setConfirm('pay')}
//                 className="flex items-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl shadow-sm transition-all text-sm">
//                 <DollarSign size={15} /> Marquer Payé
//               </button>
//             )}
//             {/* Annuler */}
//             {isAdmin && !['CANCELLED', 'PAID'].includes(data.status) && (
//               <button onClick={() => setConfirm('cancel')}
//                 className="flex items-center gap-2 px-4 py-2.5 border border-orange-200 dark:border-orange-700 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/10 font-bold rounded-xl transition-colors text-sm">
//                 <Ban size={15} /> Annuler
//               </button>
//             )}
//             {/* Restaurer brouillon */}
//             {isAdmin && data.status === 'CANCELLED' && (
//               <button onClick={() => setConfirm('restore')}
//                 className="flex items-center gap-2 px-4 py-2.5 border border-indigo-200 dark:border-indigo-700 text-indigo-600 hover:bg-indigo-50 font-bold rounded-xl transition-colors text-sm">
//                 <RotateCcw size={15} /> Restaurer
//               </button>
//             )}

//             {/* ══ Séparateur ══ */}
//             <div className="w-px h-7 bg-gray-200 dark:bg-gray-700 hidden sm:block mx-1" />

//             {/* ✅ TÉLÉCHARGER EN PDF */}
//             <button
//               onClick={handleDownloadPDF}
//               className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl shadow-sm hover:opacity-90 transition-all text-sm">
//               <Download size={15} /> PDF
//             </button>

//             {/* ✅ IMPRIMER SUR PAPIER */}
//             <button
//               onClick={handlePrint}
//               className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-sm">
//               <Printer size={15} /> Imprimer
//             </button>

//             {/* Supprimer — tout à droite, discret */}
//             {isAdmin && (
//               <button onClick={() => setConfirm('delete')}
//                 className="ml-auto flex items-center gap-2 px-3 py-2.5 border border-red-200 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 font-bold rounded-xl transition-colors text-sm">
//                 <Trash2 size={14} /> Supprimer
//               </button>
//             )}
//           </div>

//           {/* ✅ BANNER MODIFIER — rappel contextuel si DRAFT */}
//           {isAdmin && isDraft && (
//             <div style={{
//               display: 'flex', alignItems: 'center', justifyContent: 'space-between',
//               padding: '10px 16px', borderRadius: 12,
//               background: '#eff6ff', border: '1.5px solid #93c5fd',
//             }}>
//               <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
//                 <Pencil size={15} style={{ color: '#3b82f6', flexShrink: 0 }} />
//                 <div>
//                   <p style={{ fontSize: 13, fontWeight: 700, color: '#1d4ed8', margin: 0 }}>
//                     Ce bulletin est modifiable
//                   </p>
//                   <p style={{ fontSize: 11, color: '#3b82f6', margin: 0 }}>
//                     Statut Brouillon — vous pouvez encore modifier les jours et heures supplémentaires
//                   </p>
//                 </div>
//               </div>
//               <button
//                 onClick={() => router.push(`/paie/${params.id}/modifier`)}
//                 style={{
//                   display: 'flex', alignItems: 'center', gap: 6,
//                   padding: '7px 14px', borderRadius: 8, fontWeight: 700, fontSize: 12,
//                   background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer',
//                   flexShrink: 0, whiteSpace: 'nowrap',
//                 }}>
//                 <Pencil size={13} /> Modifier
//               </button>
//             </div>
//           )}
//         </div>

//         {/* ═══════════════════════════════════════
//             LAYOUT : bulletin + sidebar
//         ═══════════════════════════════════════ */}
//         <div className="grid grid-cols-1 xl:grid-cols-[1fr_290px] gap-6 items-start print:block">

//           {/* ── BULLETIN ── */}
//           <div ref={printRef}
//             className="payslip-sheet bg-white shadow-xl rounded-xl overflow-hidden border border-gray-200">

//             <PayslipHeader
//               company={data.company ?? {}}
//               month={data.month}
//               year={data.year}
//               status={data.status}
//             />

//             <PayslipEmployeeInfo
//               employee={data.employee ?? { id: '' }}
//               payslip={{
//                 month:       data.month,       year:         data.year,
//                 workDays:    data.workDays    ?? 0,
//                 workedDays:  data.workedDays  ?? 0,
//                 absenceDays: data.absenceDays ?? 0,
//                 daysOnLeave:    data.daysOnLeave,
//                 daysRemote:     data.daysRemote,
//                 daysHoliday:    data.daysHoliday,
//                 overtimeHours10:  data.overtimeHours10,
//                 overtimeHours25:  data.overtimeHours25,
//                 overtimeHours50:  data.overtimeHours50,
//                 overtimeHours100: data.overtimeHours100,
//                 professionalCategory: data.employee?.professionalCategory,
//                 collectiveAgreement:  data.company?.collectiveAgreement,
//               }}
//             />

//             <div className="px-5 pb-6 print:px-4 print:pb-4">
//               <PayslipBreakdown
//                 items={(data.items || []) as any}
//                 grossSalary={data.grossSalary}
//                 netSalary={data.netSalary}
//                 totalDeductions={data.totalDeductions}
//                 isSubjectToCnss={isSubjectToCnss}
//                 isSubjectToIrpp={isSubjectToIrpp}
//                 bonuses={bonuses}
//                 absenceDeduction={absItem?.amount ?? 0}
//                 absenceDays={data.absenceDays ?? 0}
//                 workDays={data.workDays ?? 26}

//                cnssEmployer={data.cnssEmployer}
//                cnssEmployerPension={data.cnssEmployerPension}
//                cnssEmployerFamily={data.cnssEmployerFamily}
//                cnssEmployerAccident={data.cnssEmployerAccident}
//                tusAmount={data.tusAmount}

//                totalEmployerCost={data.totalEmployerCost}
//                irppDetails={data.irppDetails}
//               />
//               <PayslipFooter />
//             </div>
//           </div>

//           {/* ── SIDEBAR (no-print) ── */}
//           <div className="no-print space-y-4">

//             {/* ✅ CTA Modifier dans la sidebar aussi */}
//             {isAdmin && isDraft && (
//               <button
//                 onClick={() => router.push(`/paie/${params.id}/modifier`)}
//                 style={{
//                   width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
//                   gap: 8, padding: '13px 16px', borderRadius: 14, fontWeight: 700, fontSize: 14,
//                   background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
//                   color: '#fff', border: 'none', cursor: 'pointer',
//                   boxShadow: '0 4px 20px rgba(14,165,233,0.3)',
//                 }}>
//                 <Pencil size={17} />
//                 Modifier ce bulletin
//               </button>
//             )}

//             {/* Primes */}
//             {bonuses.length > 0 && (
//               <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
//                 <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
//                   <Gift size={15} className="text-cyan-500" />
//                   <h3 className="font-bold text-gray-900 dark:text-white text-sm">Primes ce mois</h3>
//                 </div>
//                 <div className="p-4 space-y-2">
//                   {bonuses.map((b: any) => (
//                     <div key={b.id} className="flex justify-between text-sm">
//                       <span className="text-gray-600 dark:text-gray-400 truncate flex-1 mr-2">{b.bonusType || b.label}</span>
//                       <span className="font-mono font-bold text-cyan-600 flex-shrink-0">+{fmt(b.amount || 0)} F</span>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* Exemptions */}
//             {(!isSubjectToCnss || !isSubjectToIrpp) && (
//               <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 rounded-2xl p-4">
//                 <p className="font-bold text-amber-800 text-sm flex items-center gap-2 mb-2">
//                   <AlertCircle size={14} /> Exemptions actives
//                 </p>
//                 {!isSubjectToCnss && <p className="text-xs text-amber-600">• CNSS : exempté</p>}
//                 {!isSubjectToIrpp && <p className="text-xs text-amber-600">• ITS : exempté</p>}
//               </div>
//             )}

//             {/* Coût employeur */}
//             {isAdmin && (
//               <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
//                 <button onClick={() => setShowEmployer(!showEmployer)}
//                   className="w-full flex items-center justify-between p-4 font-bold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
//                   <span className="flex items-center gap-2 text-sm">
//                     <Building2 size={15} className="text-sky-500" />Coût Employeur
//                   </span>
//                   {showEmployer ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
//                 </button>
//                 <AnimatePresence>
//                   {showEmployer && (
//                     <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
//                       className="border-t border-gray-100 dark:border-gray-700 overflow-hidden">
//                       <div className="p-4 space-y-2 text-sm bg-gray-50 dark:bg-gray-900/40">
//                         <div className="flex justify-between text-gray-600 dark:text-gray-400">
//                           <span>Brut</span>
//                           <span className="font-mono font-bold">{fmt(data.grossSalary)} F</span>
//                         </div>
//                         {employerCosts.map(c => (
//                           <div key={c.id} className="flex justify-between text-gray-600 dark:text-gray-400">
//                             <span className="truncate flex-1 mr-2">{c.label}</span>
//                             <span className="font-mono font-bold text-red-500 flex-shrink-0">+{fmt(c.amount ?? 0)} F</span>
//                           </div>
//                         ))}
//                         <div className="flex justify-between font-bold pt-2 border-t border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
//                           <span>Coût Total</span>
//                           <span className="font-mono">{fmt(data.totalEmployerCost ?? 0)} F</span>
//                         </div>
//                       </div>
//                     </motion.div>
//                   )}
//                 </AnimatePresence>
//               </div>
//             )}

//             {/* Récapitulatif */}
//             <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
//               <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-sm">Récapitulatif</h3>
//               <div className="space-y-2.5 text-sm">
//                 {[
//                   { label: 'Brut',        val: `+${fmt(data.grossSalary)} F`, cls: 'text-emerald-600 font-mono font-bold' },
//                   { label: 'CNSS',        val: `−${fmt(cnssItem?.amount || 0)} F`, cls: 'font-mono text-red-500' },
//                   { label: 'ITS',         val: `−${fmt(irppItem?.amount || 0)} F`, cls: 'font-mono text-red-500' },
//                 ].map(r => (
//                   <div key={r.label} className="flex justify-between">
//                     <span className="text-gray-500 dark:text-gray-400">{r.label}</span>
//                     <span className={r.cls}>{r.val}</span>
//                   </div>
//                 ))}
//                 <div className="flex justify-between pt-2.5 border-t border-gray-200 dark:border-gray-700">
//                   <span className="font-bold text-gray-900 dark:text-white">Net</span>
//                   <span className="font-mono font-bold text-gray-900 dark:text-white">{fmt(data.netSalary)} F</span>
//                 </div>
//               </div>
//             </div>

//             {/* Réglementation */}
//             <div className="bg-sky-50 dark:bg-sky-900/20 rounded-2xl p-4 border border-sky-200 dark:border-sky-800">
//               <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm">
//                 <Info size={14} className="text-sky-500" /> Congo 2026
//               </h3>
//               <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
//                 <p>• ITS 2026 — sans quotient familial</p>
//                 <p>• CNSS salarié : 4% (plafond 1,2M FCFA)</p>
//                 <p>• CNSS patronal : 8% + 10% + 2,25%</p>
//                 <p>• TUS : 2% sur brut (patronale)</p>
//                 <p>• SMIG : 70 400 FCFA/mois</p>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* ═══════════════════════════════════════
//             MODAL CONFIRMATION
//         ═══════════════════════════════════════ */}
//         <AnimatePresence>
//           {confirm && (
//             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//               className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print">
//               <motion.div initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 16 }}
//                 className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
//                 {(() => {
//                   const cfg = CONFIRM_CONFIG[confirm];
//                   const Icon = cfg.icon;
//                   const isDel = confirm === 'delete';
//                   return (
//                     <div className="flex flex-col items-center text-center">
//                       <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
//                         style={{ background: isDel ? '#fee2e2' : '#f1f5f9', color: isDel ? '#dc2626' : '#475569' }}>
//                         <Icon size={30} />
//                       </div>
//                       <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{cfg.title}</h3>
//                       <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{cfg.sub}</p>
//                       {isDel && (
//                         <div className="w-full mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-left">
//                           <p className="text-xs text-red-700 dark:text-red-300 font-bold">
//                             ⚠️ Cette action est irréversible.
//                           </p>
//                         </div>
//                       )}
//                       <div className="flex gap-3 w-full">
//                         <button onClick={() => setConfirm(null)}
//                           className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
//                           Retour
//                         </button>
//                         <button onClick={handleConfirm} disabled={isBusy}
//                           className="flex-1 py-3 text-white font-bold rounded-xl flex justify-center items-center gap-2 text-sm disabled:opacity-50 transition-all"
//                           style={{ background: cfg.btnColor }}>
//                           {isBusy ? <Loader2 className="animate-spin" size={18} /> : <Icon size={16} />}
//                           {isBusy ? '…' : cfg.btnLabel}
//                         </button>
//                       </div>
//                     </div>
//                   );
//                 })()}
//               </motion.div>
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </div>
//     </>
//   );
// }


'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Printer, Download, Check, Ban,
  DollarSign, ChevronDown, ChevronUp, AlertCircle,
  Loader2, Info, Building2, Gift, Pencil, Trash2, RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';

import PayslipHeader from './components/PayslipHeader';
import PayslipEmployeeInfo from './components/PayslipEmployeeInfo';
import PayslipBreakdown from './components/PayslipBreakdown';
import PayslipFooter from './components/PayslipFooter';

interface PayrollData {
  employee?: {
    id: string;
    firstName?: string;
    lastName?: string;
    isSubjectToCnss?: boolean;
    isSubjectToIrpp?: boolean;
    professionalCategory?: string;
    employeeNumber?: string;
    position?: string;
    department?: { name?: string };
    cnssNumber?: string;
    nationalIdNumber?: string;
    paymentMethod?: string;
    maritalStatus?: string;
    numberOfChildren?: number;
    echelon?: string;
    contractType?: string;
    hireDate?: string;
  };
  company?: {
    legalName?: string;
    logo?: string;
    address?: string;
    rccmNumber?: string;
    nif?: string;
    phone?: string;
    collectiveAgreement?: string;
    [key: string]: any;
  };
  items?: Array<{
    id: string; code: string; label: string;
    type: 'GAIN' | 'DEDUCTION' | 'EMPLOYER_COST';
    base?: number; rate?: number; amount: number;
    isTaxable: boolean; isCnss: boolean; order: number;
  }>;
  status: string;
  month: number;
  year: number;
  grossSalary: number;
  netSalary: number;
  totalDeductions: number;
  totalEmployerCost?: number;
  workDays?: number;
  workedDays?: number;
  absenceDays?: number;
  daysOnLeave?: number;
  daysRemote?: number;
  daysHoliday?: number;
  overtimeHours10?: number;
  overtimeHours25?: number;
  overtimeHours50?: number;
  overtimeHours100?: number;
  // ✅ Champs CNSS Patronale détaillés + TUS + irppDetails
  cnssEmployer?: number;
  cnssEmployerPension?: number;
  cnssEmployerFamily?: number;
  cnssEmployerAccident?: number;
  tusAmount?: number;
  irppDetails?: any;
}

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const STATUS_INFO: Record<string, { label: string; dot: string; border: string; text: string }> = {
  DRAFT:     { label: 'Brouillon', dot: '#94a3b8', border: '#e2e8f0', text: '#64748b' },
  VALIDATED: { label: 'Validé',    dot: '#10b981', border: '#a7f3d0', text: '#059669' },
  PAID:      { label: 'Payé',      dot: '#0ea5e9', border: '#bae6fd', text: '#0369a1' },
  CANCELLED: { label: 'Annulé',    dot: '#ef4444', border: '#fecaca', text: '#dc2626' },
};

const CONFIRM_CONFIG = {
  validate: { title: 'Valider le bulletin ?',      sub: 'Le bulletin ne pourra plus être modifié.',          btnLabel: 'Valider',    btnColor: '#10b981', icon: Check    },
  pay:      { title: 'Confirmer le paiement ?',    sub: "L'employé pourra accéder à son bulletin.",          btnLabel: 'Confirmer',  btnColor: '#0ea5e9', icon: DollarSign },
  cancel:   { title: 'Annuler ce bulletin ?',      sub: 'Le bulletin sera invalidé.',                        btnLabel: 'Annuler',    btnColor: '#f97316', icon: Ban      },
  restore:  { title: 'Remettre en brouillon ?',    sub: 'Le bulletin repassera en statut Brouillon.',        btnLabel: 'Restaurer',  btnColor: '#6366f1', icon: RotateCcw },
  delete:   { title: 'Supprimer définitivement ?', sub: 'Action irréversible — le bulletin sera effacé.',    btnLabel: 'Supprimer',  btnColor: '#dc2626', icon: Trash2   },
};

export default function PayslipPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);

  const [data, setData]             = useState<PayrollData | null>(null);
  const [userRole, setUserRole]     = useState<string | null>(null);
  const [isLoading, setIsLoading]   = useState(true);
  const [isBusy, setIsBusy]         = useState(false);
  const [showEmployer, setShowEmployer] = useState(false);
  const [confirm, setConfirm]       = useState<keyof typeof CONFIRM_CONFIG | null>(null);
  const [bonuses, setBonuses]       = useState<any[]>([]);

  useEffect(() => { fetchData(); }, [params.id]);

  const fetchData = async () => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) setUserRole(JSON.parse(stored).role);
      const payroll = await api.get<PayrollData>(`/payrolls/${params.id}`);
      setData(payroll);
      if (payroll?.employee?.id) {
        try {
          const bd: any = await api.get(`/employee-bonuses?employeeId=${payroll.employee.id}`);
          const all = Array.isArray(bd) ? bd : bd?.data || [];
          setBonuses(all.filter((b: any) => b.isRecurring || b.source === 'AUTOMATIC'));
        } catch {}
      }
    } catch { router.push('/paie'); }
    finally { setIsLoading(false); }
  };

  const handleConfirm = async () => {
    if (!confirm) return;
    setIsBusy(true);
    try {
      if (confirm === 'delete') {
        await api.delete(`/payrolls/${params.id}`);
        router.push('/paie');
        return;
      }
      const statusMap: Record<string, string> = {
        validate: 'VALIDATED', pay: 'PAID', cancel: 'CANCELLED', restore: 'DRAFT',
      };
      const updated = await api.patch<PayrollData>(`/payrolls/${params.id}`, { status: statusMap[confirm] });
      setData(updated);
      setConfirm(null);
    } catch (e: any) {
      alert(`Erreur : ${e.response?.data?.message || e.message}`);
    } finally { setIsBusy(false); }
  };

  const handleDownloadPDF = () => window.print();
  const handlePrint       = () => window.print();

  const fmt = (v: number) => (v ?? 0).toLocaleString('fr-FR');
  const isAdmin = ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'].includes(userRole || '');
  const isDraft = data?.status === 'DRAFT';

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-sky-500" size={32} />
    </div>
  );

  if (!data) return (
    <div className="p-8 text-center">
      <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
      <p className="text-gray-500">Bulletin introuvable</p>
      <button onClick={() => router.push('/paie')}
        className="mt-4 px-6 py-2 bg-gray-900 text-white rounded-xl font-bold">Retour</button>
    </div>
  );

  const cnssItem      = (data.items || []).find(i => i.code?.toUpperCase().includes('CNSS') && i.type === 'DEDUCTION');
  const irppItem      = (data.items || []).find(i => ['ITS','IRPP'].some(k => i.code?.toUpperCase().includes(k)) && i.type === 'DEDUCTION');
  const employerCosts = (data.items || []).filter(i => i.type === 'EMPLOYER_COST');
  const absItem       = (data.items || []).find(i => i.code?.toUpperCase().includes('ABSENCE') || i.label?.toLowerCase().includes('absence'));

  const isSubjectToCnss = data.employee?.isSubjectToCnss ?? ((cnssItem?.amount ?? 0) > 0);
  const isSubjectToIrpp = data.employee?.isSubjectToIrpp ?? ((irppItem?.amount ?? 0) > 0);
  const statusInfo = STATUS_INFO[data.status] ?? STATUS_INFO['DRAFT'];
  const monthLabel = MONTHS[(data.month ?? 1) - 1];

  return (
    <>
      {/* ═══════════════════════════════════════
          STYLES IMPRESSION A4
      ═══════════════════════════════════════ */}
      <style jsx global>{`
        @media print {
          body       { background: #fff !important; margin: 0; }
          .no-print  { display: none !important; }
          @page      { size: A4 portrait; margin: 8mm 10mm 8mm 10mm; }
          *          { -webkit-print-color-adjust: exact !important;
                       color-adjust: exact !important; }
          .payslip-sheet {
            width: 100% !important; max-width: 100% !important;
            box-shadow: none !important; border: none !important;
            border-radius: 0 !important; margin: 0 !important;
          }
        }
      `}</style>

      <div className="max-w-[1280px] mx-auto pb-20 px-4 print:p-0 print:max-w-none">

        {/* ═══════════════════════════════════════
            BARRE D'ACTIONS (masquée à l'impression)
        ═══════════════════════════════════════ */}
        <div className="no-print mb-6 space-y-3">

          {/* Ligne 1 : retour + identité */}
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()}
              className="flex-shrink-0 p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors">
              <ArrowLeft size={18} className="text-gray-500" />
            </button>
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <h1 className="font-bold text-gray-900 dark:text-white text-lg truncate">
                Bulletin — {data.employee?.firstName} {data.employee?.lastName}
              </h1>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                border: `1.5px solid ${statusInfo.border}`, color: statusInfo.text,
                background: '#fff', flexShrink: 0,
              }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: statusInfo.dot, flexShrink: 0 }} />
                {statusInfo.label}
              </span>
              <span className="text-sm text-gray-400 flex-shrink-0">{monthLabel} {data.year}</span>
            </div>
          </div>

          {/* Ligne 2 : boutons d'action */}
          <div className="flex flex-wrap items-center gap-2">

            {isAdmin && isDraft && (
              <button
                onClick={() => router.push(`/paie/${params.id}/modifier`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 20px', borderRadius: 12, fontWeight: 700, fontSize: 14,
                  background: '#0ea5e9', color: '#fff', border: 'none', cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(14,165,233,0.35)',
                  transition: 'all .15s',
                }}>
                <Pencil size={16} />
                Modifier ce bulletin
              </button>
            )}

            {isAdmin && data.status === 'DRAFT' && (
              <button onClick={() => setConfirm('validate')}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-sm transition-all text-sm">
                <Check size={15} /> Valider
              </button>
            )}
            {isAdmin && data.status === 'VALIDATED' && (
              <button onClick={() => setConfirm('pay')}
                className="flex items-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl shadow-sm transition-all text-sm">
                <DollarSign size={15} /> Marquer Payé
              </button>
            )}
            {isAdmin && !['CANCELLED', 'PAID'].includes(data.status) && (
              <button onClick={() => setConfirm('cancel')}
                className="flex items-center gap-2 px-4 py-2.5 border border-orange-200 dark:border-orange-700 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/10 font-bold rounded-xl transition-colors text-sm">
                <Ban size={15} /> Annuler
              </button>
            )}
            {isAdmin && data.status === 'CANCELLED' && (
              <button onClick={() => setConfirm('restore')}
                className="flex items-center gap-2 px-4 py-2.5 border border-indigo-200 dark:border-indigo-700 text-indigo-600 hover:bg-indigo-50 font-bold rounded-xl transition-colors text-sm">
                <RotateCcw size={15} /> Restaurer
              </button>
            )}

            <div className="w-px h-7 bg-gray-200 dark:bg-gray-700 hidden sm:block mx-1" />

            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl shadow-sm hover:opacity-90 transition-all text-sm">
              <Download size={15} /> PDF
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-sm">
              <Printer size={15} /> Imprimer
            </button>

            {isAdmin && (
              <button onClick={() => setConfirm('delete')}
                className="ml-auto flex items-center gap-2 px-3 py-2.5 border border-red-200 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 font-bold rounded-xl transition-colors text-sm">
                <Trash2 size={14} /> Supprimer
              </button>
            )}
          </div>

          {isAdmin && isDraft && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 16px', borderRadius: 12,
              background: '#eff6ff', border: '1.5px solid #93c5fd',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Pencil size={15} style={{ color: '#3b82f6', flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#1d4ed8', margin: 0 }}>
                    Ce bulletin est modifiable
                  </p>
                  <p style={{ fontSize: 11, color: '#3b82f6', margin: 0 }}>
                    Statut Brouillon — vous pouvez encore modifier les jours et heures supplémentaires
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push(`/paie/${params.id}/modifier`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 8, fontWeight: 700, fontSize: 12,
                  background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer',
                  flexShrink: 0, whiteSpace: 'nowrap',
                }}>
                <Pencil size={13} /> Modifier
              </button>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════
            LAYOUT : bulletin + sidebar
        ═══════════════════════════════════════ */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_290px] gap-6 items-start print:block">

          {/* ── BULLETIN ── */}
          <div ref={printRef}
            className="payslip-sheet bg-white shadow-xl rounded-xl overflow-hidden border border-gray-200">

            <PayslipHeader
              company={data.company ?? {}}
              month={data.month}
              year={data.year}
              status={data.status}
            />

            <PayslipEmployeeInfo
              employee={data.employee ?? { id: '' }}
              payslip={{
                month:       data.month,       year:         data.year,
                workDays:    data.workDays    ?? 0,
                workedDays:  data.workedDays  ?? 0,
                absenceDays: data.absenceDays ?? 0,
                daysOnLeave:    data.daysOnLeave,
                daysRemote:     data.daysRemote,
                daysHoliday:    data.daysHoliday,
                overtimeHours10:  data.overtimeHours10,
                overtimeHours25:  data.overtimeHours25,
                overtimeHours50:  data.overtimeHours50,
                overtimeHours100: data.overtimeHours100,
                professionalCategory: data.employee?.professionalCategory,
                collectiveAgreement:  data.company?.collectiveAgreement,
              }}
            />

            <div className="px-5 pb-6 print:px-4 print:pb-4">
              <PayslipBreakdown
                items={(data.items || []) as any}
                grossSalary={data.grossSalary}
                netSalary={data.netSalary}
                totalDeductions={data.totalDeductions}
                isSubjectToCnss={isSubjectToCnss}
                isSubjectToIrpp={isSubjectToIrpp}
                bonuses={bonuses}
                absenceDeduction={absItem?.amount ?? 0}
                absenceDays={data.absenceDays ?? 0}
                workDays={data.workDays ?? 26}
                cnssEmployer={data.cnssEmployer}
                cnssEmployerPension={data.cnssEmployerPension}
                cnssEmployerFamily={data.cnssEmployerFamily}
                cnssEmployerAccident={data.cnssEmployerAccident}
                tusAmount={data.tusAmount}
                totalEmployerCost={data.totalEmployerCost}
                irppDetails={data.irppDetails}
              />
              <PayslipFooter />
            </div>
          </div>

          {/* ── SIDEBAR (no-print) ── */}
          <div className="no-print space-y-4">

            {isAdmin && isDraft && (
              <button
                onClick={() => router.push(`/paie/${params.id}/modifier`)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 8, padding: '13px 16px', borderRadius: 14, fontWeight: 700, fontSize: 14,
                  background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                  color: '#fff', border: 'none', cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(14,165,233,0.3)',
                }}>
                <Pencil size={17} />
                Modifier ce bulletin
              </button>
            )}

            {/* Primes */}
            {bonuses.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                  <Gift size={15} className="text-cyan-500" />
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">Primes ce mois</h3>
                </div>
                <div className="p-4 space-y-2">
                  {bonuses.map((b: any) => (
                    <div key={b.id} className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400 truncate flex-1 mr-2">{b.bonusType || b.label}</span>
                      <span className="font-mono font-bold text-cyan-600 flex-shrink-0">+{fmt(b.amount || 0)} F</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Exemptions */}
            {(!isSubjectToCnss || !isSubjectToIrpp) && (
              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 rounded-2xl p-4">
                <p className="font-bold text-amber-800 text-sm flex items-center gap-2 mb-2">
                  <AlertCircle size={14} /> Exemptions actives
                </p>
                {!isSubjectToCnss && <p className="text-xs text-amber-600">• CNSS : exempté</p>}
                {!isSubjectToIrpp && <p className="text-xs text-amber-600">• ITS : exempté</p>}
              </div>
            )}

            {/* Coût employeur */}
            {isAdmin && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <button onClick={() => setShowEmployer(!showEmployer)}
                  className="w-full flex items-center justify-between p-4 font-bold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                  <span className="flex items-center gap-2 text-sm">
                    <Building2 size={15} className="text-sky-500" />Coût Employeur
                  </span>
                  {showEmployer ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>
                <AnimatePresence>
                  {showEmployer && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                      className="border-t border-gray-100 dark:border-gray-700 overflow-hidden">
                      <div className="p-4 space-y-2 text-sm bg-gray-50 dark:bg-gray-900/40">
                        <div className="flex justify-between text-gray-600 dark:text-gray-400">
                          <span>Brut</span>
                          <span className="font-mono font-bold">{fmt(data.grossSalary)} F</span>
                        </div>
                        {/* Détail 3 branches CNSS patronale */}
                        {(data.cnssEmployerPension ?? 0) > 0 && (
                          <>
                            <div className="flex justify-between text-gray-500 dark:text-gray-400">
                              <span>CNSS Pensions (8%)</span>
                              <span className="font-mono font-bold text-orange-500">+{fmt(data.cnssEmployerPension ?? 0)} F</span>
                            </div>
                            <div className="flex justify-between text-gray-500 dark:text-gray-400">
                              <span>CNSS Famille (10,03%)</span>
                              <span className="font-mono font-bold text-orange-500">+{fmt(data.cnssEmployerFamily ?? 0)} F</span>
                            </div>
                            <div className="flex justify-between text-gray-500 dark:text-gray-400">
                              <span>CNSS Accident (2,25%)</span>
                              <span className="font-mono font-bold text-orange-500">+{fmt(data.cnssEmployerAccident ?? 0)} F</span>
                            </div>
                            <div className="flex justify-between text-gray-500 dark:text-gray-400">
                              <span>TUS (2%)</span>
                              <span className="font-mono font-bold text-orange-500">+{fmt(data.tusAmount ?? 0)} F</span>
                            </div>
                          </>
                        )}
                        {/* Fallback : items EMPLOYER_COST si nouveaux champs pas encore en BDD */}
                        {(data.cnssEmployerPension ?? 0) === 0 && employerCosts.map(c => (
                          <div key={c.id} className="flex justify-between text-gray-600 dark:text-gray-400">
                            <span className="truncate flex-1 mr-2">{c.label}</span>
                            <span className="font-mono font-bold text-red-500 flex-shrink-0">+{fmt(c.amount ?? 0)} F</span>
                          </div>
                        ))}
                        <div className="flex justify-between font-bold pt-2 border-t border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
                          <span>Coût Total</span>
                          <span className="font-mono">{fmt(data.totalEmployerCost ?? 0)} F</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Récapitulatif */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-sm">Récapitulatif</h3>
              <div className="space-y-2.5 text-sm">
                {[
                  { label: 'Brut',  val: `+${fmt(data.grossSalary)} F`,        cls: 'text-emerald-600 font-mono font-bold' },
                  { label: 'CNSS',  val: `−${fmt(cnssItem?.amount || 0)} F`,   cls: 'font-mono text-red-500' },
                  { label: 'ITS',   val: `−${fmt(irppItem?.amount || 0)} F`,   cls: 'font-mono text-red-500' },
                ].map(r => (
                  <div key={r.label} className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">{r.label}</span>
                    <span className={r.cls}>{r.val}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2.5 border-t border-gray-200 dark:border-gray-700">
                  <span className="font-bold text-gray-900 dark:text-white">Net</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-white">{fmt(data.netSalary)} F</span>
                </div>
              </div>
            </div>

            {/* Réglementation */}
            <div className="bg-sky-50 dark:bg-sky-900/20 rounded-2xl p-4 border border-sky-200 dark:border-sky-800">
              <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm">
                <Info size={14} className="text-sky-500" /> Congo 2026
              </h3>
              <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                <p>• ITS 2026 — barème 1%/10%/25%/40%</p>
                <p>• CNSS salarié : 4% (plafond 1,2M FCFA)</p>
                <p>• CNSS patronal Pensions : 8% / 1 200 000</p>
                <p>• CNSS patronal Famille : 10,03% / 600 000</p>
                <p>• CNSS patronal Accident : 2,25% / 600 000</p>
                <p>• TUS : 2% sur brut total (déplafonné)</p>
                <p>• SMIG : 70 400 FCFA/mois</p>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════
            MODAL CONFIRMATION
        ═══════════════════════════════════════ */}
        <AnimatePresence>
          {confirm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print">
              <motion.div initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 16 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                {(() => {
                  const cfg = CONFIRM_CONFIG[confirm];
                  const Icon = cfg.icon;
                  const isDel = confirm === 'delete';
                  return (
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                        style={{ background: isDel ? '#fee2e2' : '#f1f5f9', color: isDel ? '#dc2626' : '#475569' }}>
                        <Icon size={30} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{cfg.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{cfg.sub}</p>
                      {isDel && (
                        <div className="w-full mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-left">
                          <p className="text-xs text-red-700 dark:text-red-300 font-bold">
                            ⚠️ Cette action est irréversible.
                          </p>
                        </div>
                      )}
                      <div className="flex gap-3 w-full">
                        <button onClick={() => setConfirm(null)}
                          className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          Retour
                        </button>
                        <button onClick={handleConfirm} disabled={isBusy}
                          className="flex-1 py-3 text-white font-bold rounded-xl flex justify-center items-center gap-2 text-sm disabled:opacity-50 transition-all"
                          style={{ background: cfg.btnColor }}>
                          {isBusy ? <Loader2 className="animate-spin" size={18} /> : <Icon size={16} />}
                          {isBusy ? '…' : cfg.btnLabel}
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}