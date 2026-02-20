// 'use client';

// import React, { useState, useEffect, useRef } from 'react';
// import { useRouter } from 'next/navigation';
// import {
//   ArrowLeft, Printer, Download, Check, Ban,
//   DollarSign, ChevronDown, ChevronUp, AlertCircle,
//   Loader2, Info, Building2, Gift, Pencil, Trash2
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

// // Statuts qui autorisent la modification
// const EDITABLE_STATUSES = ['DRAFT'];
// // Statuts qui autorisent la suppression définitive
// const DELETABLE_STATUSES = ['DRAFT', 'CANCELLED', 'PAID', 'VALIDATED'];

// export default function PayslipPage({ params }: { params: { id: string } }) {
//   const router = useRouter();
//   const printRef = useRef<HTMLDivElement>(null);

//   const [data, setData]                 = useState<PayrollData | null>(null);
//   const [userRole, setUserRole]         = useState<string | null>(null);
//   const [isLoading, setIsLoading]       = useState(true);
//   const [isUpdating, setIsUpdating]     = useState(false);
//   const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
//   const [isDeleting, setIsDeleting]     = useState(false);
//   const [showEmployer, setShowEmployer] = useState(false);
//   const [showConfirm, setShowConfirm]   = useState<{ show: boolean; action: 'validate' | 'pay' | 'cancel' | 'delete' } | null>(null);
//   const [bonuses, setBonuses]           = useState<any[]>([]);

//   useEffect(() => { fetchData(); }, [params.id]);

//   const fetchData = async () => {
//     try {
//       const storedUser = localStorage.getItem('user');
//       if (storedUser) setUserRole(JSON.parse(storedUser).role);

//       const payroll = await api.get<PayrollData>(`/payrolls/${params.id}`);
//       setData(payroll);

//       if (payroll?.employee?.id) {
//         try {
//           const bonusesData: any = await api.get(`/employee-bonuses?employeeId=${payroll.employee.id}`);
//           const all = Array.isArray(bonusesData) ? bonusesData : bonusesData?.data || [];
//           setBonuses(all.filter((b: any) => b.isRecurring || b.source === 'AUTOMATIC'));
//         } catch {}
//       }
//     } catch (error: any) {
//       console.error('Erreur chargement:', error);
//       router.push('/paie');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // ── Actions statut ──────────────────────────────────────────────────────
//   const handleAction = async () => {
//     if (!showConfirm) return;

//     // Suppression définitive
//     if (showConfirm.action === 'delete') {
//       setIsDeleting(true);
//       try {
//         await api.delete(`/payrolls/${params.id}`);
//         router.push('/paie');
//       } catch (e: any) {
//         alert(`Erreur: ${e.response?.data?.message || e.message}`);
//         setIsDeleting(false);
//       }
//       return;
//     }

//     setIsUpdating(true);
//     const statusMap: any = { validate: 'VALIDATED', pay: 'PAID', cancel: 'CANCELLED' };
//     try {
//       const updated = await api.patch<PayrollData>(`/payrolls/${params.id}`, { status: statusMap[showConfirm.action] });
//       setData(updated);
//       setShowConfirm(null);
//     } catch (e: any) {
//       alert(`Erreur: ${e.response?.data?.message || e.message}`);
//     } finally {
//       setIsUpdating(false);
//     }
//   };

//   // ── PDF via impression navigateur (meilleure qualité que html2canvas) ──
//   const handleDownloadPDF = () => window.print();

//   const fmt = (val: number) => (val ?? 0).toLocaleString('fr-FR');
//   const canEditStatus = ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'].includes(userRole || '');
//   const canEdit       = canEditStatus && EDITABLE_STATUSES.includes(data?.status || '');
//   const canDelete     = canEditStatus;

//   if (isLoading) return (
//     <div className="min-h-screen flex items-center justify-center">
//       <Loader2 className="animate-spin text-sky-500" size={32} />
//     </div>
//   );

//   if (!data) return (
//     <div className="p-8 text-center">
//       <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
//       <p className="text-gray-500">Bulletin introuvable</p>
//       <button onClick={() => router.push('/paie')} className="mt-4 px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold">Retour</button>
//     </div>
//   );

//   const employerCosts = (data.items || []).filter(i => i.type === 'EMPLOYER_COST');
//   const cnssItem  = (data.items || []).find(i => i.code === 'CNSS' || i.code?.includes('CNSS'));
//   const irppItem  = (data.items || []).find(i => ['ITS', 'IRPP'].includes(i.code) || i.code?.includes('ITS'));
//   const isSubjectToCnss = data.employee?.isSubjectToCnss ?? ((cnssItem?.amount ?? 0) > 0);
//   const isSubjectToIrpp = data.employee?.isSubjectToIrpp ?? ((irppItem?.amount ?? 0) > 0);

//   const CONFIRM_CONFIG = {
//     validate: { title: 'Valider le bulletin ?',       sub: 'Le bulletin ne pourra plus être modifié.',              color: 'bg-emerald-500 hover:bg-emerald-600', icon: Check },
//     pay:      { title: 'Confirmer le paiement ?',     sub: "L'employé pourra accéder à son bulletin.",              color: 'bg-sky-500 hover:bg-sky-600',     icon: DollarSign },
//     cancel:   { title: 'Annuler ce bulletin ?',        sub: 'Le bulletin sera invalidé définitivement.',             color: 'bg-orange-500 hover:bg-orange-600',icon: Ban },
//     delete:   { title: 'Supprimer définitivement ?',  sub: 'Le bulletin sera effacé de la base de données. Vous devrez recréer un bulletin si nécessaire.', color: 'bg-red-600 hover:bg-red-700', icon: Trash2 },
//   };

//   return (
//     <>
//       {/* ── STYLES IMPRESSION A4 ───────────────────────────────────────────── */}
//       <style jsx global>{`
//         @media print {
//           body { background: white !important; print-color-adjust: exact; -webkit-print-color-adjust: exact; font-size: 11px; }
//           .no-print { display: none !important; }
//           @page { size: A4 portrait; margin: 12mm 14mm 10mm 14mm; }

//           /* Forcer couleurs sur le print */
//           * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }

//           /* Eviter coupures dans les blocs clés */
//           .payslip-root { max-width: 100% !important; page-break-inside: avoid; }
//           table { break-inside: auto; }
//           tr { break-inside: avoid; }
//           .print-no-break { break-inside: avoid; page-break-inside: avoid; }
//         }
//       `}</style>

//       <div className="max-w-[1200px] mx-auto pb-20 px-4 print:p-0 print:max-w-none">

//         {/* ── BARRE D'ACTIONS ── */}
//         <div className="no-print flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
//           <button onClick={() => router.back()}
//             className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors">
//             <ArrowLeft size={20} className="text-gray-500" />
//           </button>

//           <div className="flex flex-wrap items-center gap-3">
//             {canEditStatus && (
//               <>
//                 {/* Modifier — uniquement DRAFT */}
//                 {canEdit && (
//                   <button
//                     onClick={() => router.push(`/paie/${params.id}/modifier`)}
//                     className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 transition-colors">
//                     <Pencil size={16} /> Modifier
//                   </button>
//                 )}

//                 {data.status === 'DRAFT' && (
//                   <button onClick={() => setShowConfirm({ show: true, action: 'validate' })}
//                     className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg flex items-center gap-2">
//                     <Check size={18} /> Valider
//                   </button>
//                 )}
//                 {data.status === 'VALIDATED' && (
//                   <button onClick={() => setShowConfirm({ show: true, action: 'pay' })}
//                     className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl shadow-lg flex items-center gap-2">
//                     <DollarSign size={18} /> Marquer Payé
//                   </button>
//                 )}
//                 {!['CANCELLED', 'PAID'].includes(data.status) && (
//                   <button onClick={() => setShowConfirm({ show: true, action: 'cancel' })}
//                     className="px-4 py-2 border border-orange-200 dark:border-orange-800 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/10 font-bold rounded-xl flex items-center gap-2">
//                     <Ban size={18} /> Annuler
//                   </button>
//                 )}

//                 {/* Supprimer définitivement — toujours visible pour admin */}
//                 {canDelete && (
//                   <button onClick={() => setShowConfirm({ show: true, action: 'delete' })}
//                     className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center gap-2 transition-colors">
//                     <Trash2 size={16} /> Supprimer
//                   </button>
//                 )}
//               </>
//             )}

//             <button onClick={handleDownloadPDF} disabled={isGeneratingPDF}
//               className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 disabled:opacity-50">
//               {isGeneratingPDF ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
//               PDF
//             </button>
//             <button onClick={() => window.print()}
//               className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-50 flex items-center gap-2">
//               <Printer size={18} /> Imprimer
//             </button>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start print:block">

//           {/* ── BULLETIN ── */}
//           <div
//             ref={printRef}
//             className="payslip-root lg:col-span-2 bg-white dark:bg-gray-800 shadow-xl print:shadow-none
//                        rounded-xl print:rounded-none overflow-hidden
//                        border border-gray-200 dark:border-gray-700 print:border-0 print:bg-white"
//           >
//             <PayslipHeader
//               company={data.company ?? {}}
//               month={data.month}
//               year={data.year}
//               status={data.status}
//             />
//             <PayslipEmployeeInfo
//               employee={data.employee ?? { id: '' }}
//               payslip={{
//                 month: data.month, year: data.year,
//                 workDays: data.workDays ?? 0, workedDays: data.workedDays ?? 0, absenceDays: data.absenceDays ?? 0,
//                 daysOnLeave: data.daysOnLeave, daysRemote: data.daysRemote, daysHoliday: data.daysHoliday,
//                 overtimeHours10: data.overtimeHours10, overtimeHours25: data.overtimeHours25,
//                 overtimeHours50: data.overtimeHours50, overtimeHours100: data.overtimeHours100,
//                 professionalCategory: data.employee?.professionalCategory,
//                 collectiveAgreement: data.company?.collectiveAgreement,
//               }}
//             />
//             <div className="p-8 print:p-5">
//               <PayslipBreakdown
//                 items={(data.items || []) as any}
//                 grossSalary={data.grossSalary}
//                 netSalary={data.netSalary}
//                 totalDeductions={data.totalDeductions}
//                 isSubjectToCnss={isSubjectToCnss}
//                 isSubjectToIrpp={isSubjectToIrpp}
//                 bonuses={bonuses}
//               />
//               <PayslipFooter />
//             </div>
//           </div>

//           {/* ── SIDEBAR ── */}
//           <div className="space-y-6 no-print">

//             {bonuses.length > 0 && (
//               <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
//                 <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
//                   <Gift size={18} className="text-cyan-500" />
//                   <h3 className="font-bold text-gray-900 dark:text-white text-sm">Primes ce mois</h3>
//                 </div>
//                 <div className="p-4 space-y-2">
//                   {bonuses.map((b: any) => (
//                     <div key={b.id} className="flex justify-between text-sm">
//                       <span className="text-gray-600 dark:text-gray-400">{b.bonusType}</span>
//                       <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">+{fmt(b.amount || 0)} F</span>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {(!isSubjectToCnss || !isSubjectToIrpp) && (
//               <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700 rounded-2xl p-4">
//                 <p className="font-bold text-amber-800 dark:text-amber-200 text-sm flex items-center gap-2 mb-2">
//                   <AlertCircle size={15} /> Exemptions actives
//                 </p>
//                 {!isSubjectToCnss && <p className="text-xs text-amber-600 dark:text-amber-400">• CNSS : exempté</p>}
//                 {!isSubjectToIrpp && <p className="text-xs text-amber-600 dark:text-amber-400">• ITS : exempté</p>}
//               </div>
//             )}

//             {canEditStatus && (
//               <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
//                 <button onClick={() => setShowEmployer(!showEmployer)}
//                   className="w-full flex items-center justify-between p-4 font-bold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
//                   <span className="flex items-center gap-2 text-sm"><Building2 size={16} className="text-sky-500" />Coût Employeur</span>
//                   {showEmployer ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
//                 </button>
//                 <AnimatePresence>
//                   {showEmployer && (
//                     <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
//                       className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 overflow-hidden">
//                       <div className="p-4 space-y-2 text-sm">
//                         <div className="flex justify-between text-gray-600 dark:text-gray-400">
//                           <span>Brut</span>
//                           <span className="font-mono font-bold">{fmt(data.grossSalary)} F</span>
//                         </div>
//                         {employerCosts.map(cost => (
//                           <div key={cost.id} className="flex justify-between text-gray-600 dark:text-gray-400">
//                             <span>{cost.label}</span>
//                             <span className="font-mono font-bold text-red-500">+{fmt(cost.amount ?? 0)} F</span>
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

//             {/* Récapitulatif sidebar */}
//             <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
//               <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-sm">Récapitulatif</h3>
//               <div className="space-y-2.5 text-sm">
//                 <div className="flex justify-between">
//                   <span className="text-gray-500">Brut</span>
//                   <span className="font-mono font-bold text-emerald-600">{fmt(data.grossSalary)} F</span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-gray-500">CNSS</span>
//                   <span className="font-mono text-red-500">{isSubjectToCnss ? `-${fmt(cnssItem?.amount || 0)}` : '0'} F</span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-gray-500">ITS</span>
//                   <span className="font-mono text-red-500">{isSubjectToIrpp ? `-${fmt(irppItem?.amount || 0)}` : '0'} F</span>
//                 </div>
//                 <div className="flex justify-between pt-2.5 border-t border-gray-200 dark:border-gray-700">
//                   <span className="font-bold text-gray-900 dark:text-white">Net</span>
//                   <span className="font-mono font-bold text-gray-900 dark:text-white">{fmt(data.netSalary)} F</span>
//                 </div>
//               </div>
//             </div>

//             {/* Info réglementation */}
//             <div className="bg-gradient-to-br from-sky-50 to-emerald-50 dark:from-sky-900/20 dark:to-emerald-900/20 rounded-2xl p-5 border border-sky-200 dark:border-sky-800">
//               <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm">
//                 <Info size={16} className="text-sky-500" /> Réglementation Congo 2026
//               </h3>
//               <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
//                 <p>• ITS 2026 — sans quotient familial</p>
//                 <p>• CNSS salarié : 4% (plafond 1 200 000 FCFA)</p>
//                 <p>• CNSS patronal : pension 8% + famille 10% + AT 2,25%</p>
//                 <p>• TUS : 2% sur brut (patronale)</p>
//                 <p>• SMIG : 70 400 FCFA/mois</p>
//                 <p className="text-sky-600 dark:text-sky-400 font-medium">Décret n°78-360 du 12 mai 1978</p>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* ── MODAL CONFIRMATION ── */}
//         <AnimatePresence>
//           {showConfirm && (
//             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//               className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print">
//               <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
//                 className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
//                 <div className="flex flex-col items-center text-center">
//                   {(() => {
//                     const cfg = CONFIRM_CONFIG[showConfirm.action];
//                     const Icon = cfg.icon;
//                     const isDelete = showConfirm.action === 'delete';
//                     return (
//                       <>
//                         <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4
//                           ${isDelete ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-600'}`}>
//                           <Icon size={32} />
//                         </div>
//                         <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{cfg.title}</h3>
//                         <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{cfg.sub}</p>
//                         {isDelete && (
//                           <div className="w-full mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
//                             <p className="text-xs text-red-700 dark:text-red-300 font-bold text-left">
//                               ⚠️ Cette action est irréversible. Le bulletin sera définitivement supprimé de la base de données.
//                             </p>
//                           </div>
//                         )}
//                         <div className="flex gap-3 w-full">
//                           <button onClick={() => setShowConfirm(null)}
//                             className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700">
//                             Retour
//                           </button>
//                           <button onClick={handleAction}
//                             disabled={isUpdating || isDeleting}
//                             className={`flex-1 py-3 text-white font-bold rounded-xl flex justify-center items-center gap-2 ${cfg.color}`}>
//                             {(isUpdating || isDeleting)
//                               ? <Loader2 className="animate-spin" size={20} />
//                               : isDelete ? 'Supprimer' : 'Confirmer'}
//                           </button>
//                         </div>
//                       </>
//                     );
//                   })()}
//                 </div>
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
  Loader2, Info, Building2, Gift, Pencil, Trash2
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
}

const EDITABLE_STATUSES = ['DRAFT'];

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  DRAFT:     { label: 'Brouillon',  color: 'bg-gray-100 text-gray-600 border-gray-200' },
  VALIDATED: { label: 'Validé',    color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  PAID:      { label: 'Payé',      color: 'bg-sky-50 text-sky-700 border-sky-200' },
  CANCELLED: { label: 'Annulé',    color: 'bg-red-50 text-red-600 border-red-200' },
};

export default function PayslipPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);

  const [data, setData]                 = useState<PayrollData | null>(null);
  const [userRole, setUserRole]         = useState<string | null>(null);
  const [isLoading, setIsLoading]       = useState(true);
  const [isUpdating, setIsUpdating]     = useState(false);
  const [isDeleting, setIsDeleting]     = useState(false);
  const [showEmployer, setShowEmployer] = useState(false);
  const [showConfirm, setShowConfirm]   = useState<{ action: 'validate' | 'pay' | 'cancel' | 'delete' } | null>(null);
  const [bonuses, setBonuses]           = useState<any[]>([]);

  useEffect(() => { fetchData(); }, [params.id]);

  const fetchData = async () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) setUserRole(JSON.parse(storedUser).role);
      const payroll = await api.get<PayrollData>(`/payrolls/${params.id}`);
      setData(payroll);
      if (payroll?.employee?.id) {
        try {
          const bonusesData: any = await api.get(`/employee-bonuses?employeeId=${payroll.employee.id}`);
          const all = Array.isArray(bonusesData) ? bonusesData : bonusesData?.data || [];
          setBonuses(all.filter((b: any) => b.isRecurring || b.source === 'AUTOMATIC'));
        } catch {}
      }
    } catch {
      router.push('/paie');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async () => {
    if (!showConfirm) return;
    if (showConfirm.action === 'delete') {
      setIsDeleting(true);
      try {
        await api.delete(`/payrolls/${params.id}`);
        router.push('/paie');
      } catch (e: any) {
        alert(`Erreur: ${e.response?.data?.message || e.message}`);
        setIsDeleting(false);
      }
      return;
    }
    setIsUpdating(true);
    const statusMap: any = { validate: 'VALIDATED', pay: 'PAID', cancel: 'CANCELLED' };
    try {
      const updated = await api.patch<PayrollData>(`/payrolls/${params.id}`, { status: statusMap[showConfirm.action] });
      setData(updated);
      setShowConfirm(null);
    } catch (e: any) {
      alert(`Erreur: ${e.response?.data?.message || e.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const fmt = (val: number) => (val ?? 0).toLocaleString('fr-FR');
  const canAdmin  = ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'].includes(userRole || '');
  const canEdit   = canAdmin && EDITABLE_STATUSES.includes(data?.status || '');
  const canDelete = canAdmin;

  const CONFIRM_CONFIG = {
    validate: { title: 'Valider le bulletin ?',      sub: 'Le bulletin ne pourra plus être modifié.',                                   color: 'bg-emerald-500 hover:bg-emerald-600', icon: Check },
    pay:      { title: 'Confirmer le paiement ?',    sub: "L'employé pourra accéder à son bulletin.",                                   color: 'bg-sky-500 hover:bg-sky-600',         icon: DollarSign },
    cancel:   { title: 'Annuler ce bulletin ?',      sub: 'Le bulletin sera invalidé.',                                                  color: 'bg-orange-500 hover:bg-orange-600',   icon: Ban },
    delete:   { title: 'Supprimer définitivement ?', sub: 'Le bulletin sera effacé de la base de données. Action irréversible.',         color: 'bg-red-600 hover:bg-red-700',         icon: Trash2 },
  };

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

  const cnssItem  = (data.items || []).find(i => i.code === 'CNSS' || i.code?.includes('CNSS'));
  const irppItem  = (data.items || []).find(i => ['ITS','IRPP'].includes(i.code) || i.code?.includes('ITS'));
  const employerCosts = (data.items || []).filter(i => i.type === 'EMPLOYER_COST');
  const isSubjectToCnss = data.employee?.isSubjectToCnss ?? ((cnssItem?.amount ?? 0) > 0);
  const isSubjectToIrpp = data.employee?.isSubjectToIrpp ?? ((irppItem?.amount ?? 0) > 0);
  const statusInfo = STATUS_LABEL[data.status] ?? STATUS_LABEL['DRAFT'];
  const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

  return (
    <>
      {/* ── STYLES IMPRESSION A4 ── */}
      <style jsx global>{`
        @media print {
          body        { background: white !important; }
          .no-print   { display: none !important; }
          @page       { size: A4 portrait; margin: 8mm 10mm 8mm 10mm; }
          *           { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
          /* Le bulletin occupe toute la largeur disponible */
          .payslip-root  { width: 100% !important; max-width: 100% !important; box-shadow: none !important;
                           border: none !important; border-radius: 0 !important; padding: 0 !important; margin: 0 !important; }
          .payslip-inner { padding: 12px 16px !important; }
          /* Forcer fond coloré des en-têtes de section */
          .sec-green  { background-color: #15803d !important; }
          .sec-cyan   { background-color: #0e7490 !important; }
          .sec-amber  { background-color: #b45309 !important; }
          .sec-red    { background-color: #b91c1c !important; }
          .sec-purple { background-color: #7e22ce !important; }
          .net-bg     { background-color: #111827 !important; }
          /* Toutes les couleurs de texte conservées */
          .print-green  { color: #15803d !important; }
          .print-red    { color: #b91c1c !important; }
          .print-sky    { color: #0369a1 !important; }
          .print-purple { color: #7e22ce !important; }
          .print-amber  { color: #b45309 !important; }
          /* Pas de coupures sur blocs importants */
          .no-break   { break-inside: avoid !important; page-break-inside: avoid !important; }
        }
      `}</style>

      <div className="max-w-[1280px] mx-auto pb-20 px-4 print:p-0 print:max-w-none">

        {/* ══════════════════════════════════════════════
            BARRE D'ACTIONS — masquée à l'impression
        ══════════════════════════════════════════════ */}
        <div className="no-print mb-6">

          {/* Ligne 1 : retour + titre + statut */}
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => router.back()}
              className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors flex-shrink-0">
              <ArrowLeft size={20} className="text-gray-500" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                  Bulletin — {data.employee?.firstName} {data.employee?.lastName}
                </h1>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
                <span className="text-sm text-gray-400">
                  {MONTHS[(data.month ?? 1) - 1]} {data.year}
                </span>
              </div>
            </div>
          </div>

          {/* Ligne 2 : boutons d'action */}
          <div className="flex flex-wrap items-center gap-2">

            {/* ✅ BOUTON MODIFIER — toujours visible si DRAFT + admin */}
            {canEdit && (
              <button
                onClick={() => router.push(`/paie/${params.id}/modifier`)}
                className="px-5 py-2.5 bg-white dark:bg-gray-800 border-2 border-sky-400 text-sky-600 dark:text-sky-400 font-bold rounded-xl hover:bg-sky-50 dark:hover:bg-sky-900/10 flex items-center gap-2 transition-all hover:scale-105 shadow-sm">
                <Pencil size={16} />
                Modifier ce bulletin
              </button>
            )}

            {/* Actions statut */}
            {canAdmin && (
              <>
                {data.status === 'DRAFT' && (
                  <button onClick={() => setShowConfirm({ action: 'validate' })}
                    className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 transition-all">
                    <Check size={16} /> Valider
                  </button>
                )}
                {data.status === 'VALIDATED' && (
                  <button onClick={() => setShowConfirm({ action: 'pay' })}
                    className="px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 transition-all">
                    <DollarSign size={16} /> Marquer Payé
                  </button>
                )}
                {!['CANCELLED', 'PAID'].includes(data.status) && (
                  <button onClick={() => setShowConfirm({ action: 'cancel' })}
                    className="px-4 py-2.5 border border-orange-200 dark:border-orange-700 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/10 font-bold rounded-xl flex items-center gap-2 transition-colors">
                    <Ban size={16} /> Annuler
                  </button>
                )}
              </>
            )}

            {/* Séparateur visuel */}
            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block" />

            {/* PDF / Imprimer */}
            <button onClick={() => window.print()}
              className="px-4 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl shadow-lg flex items-center gap-2 hover:opacity-90 transition-all">
              <Download size={16} /> PDF / Imprimer
            </button>

            {/* Supprimer — toujours à droite, moins visible */}
            {canDelete && (
              <button onClick={() => setShowConfirm({ action: 'delete' })}
                className="px-3 py-2.5 border border-red-200 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 font-bold rounded-xl flex items-center gap-2 transition-colors ml-auto">
                <Trash2 size={15} /> Supprimer
              </button>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════
            LAYOUT : bulletin (large) + sidebar
        ══════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6 items-start print:block">

          {/* ── BULLETIN PRINCIPAL ── */}
          <div
            ref={printRef}
            className="payslip-root bg-white dark:bg-white shadow-xl rounded-xl overflow-hidden
                       border border-gray-200 print:shadow-none print:border-0"
          >
            {/* Header */}
            <PayslipHeader
              company={data.company ?? {}}
              month={data.month}
              year={data.year}
              status={data.status}
            />

            {/* Infos employé */}
            <PayslipEmployeeInfo
              employee={data.employee ?? { id: '' }}
              payslip={{
                month:       data.month,
                year:        data.year,
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

            {/* Tableau + récapitulatif + signatures + footer */}
            <div className="payslip-inner px-6 pb-6 print:px-4 print:pb-4">
              <PayslipBreakdown
                items={(data.items || []) as any}
                grossSalary={data.grossSalary}
                netSalary={data.netSalary}
                totalDeductions={data.totalDeductions}
                isSubjectToCnss={isSubjectToCnss}
                isSubjectToIrpp={isSubjectToIrpp}
                bonuses={bonuses}
                absenceDeduction={
                  (data.items || []).find(i =>
                    i.code?.includes('ABSENCE') || i.label?.toLowerCase().includes('absence')
                  )?.amount ?? 0
                }
                absenceDays={data.absenceDays ?? 0}
                workDays={data.workDays ?? 26}
              />
              <PayslipFooter />
            </div>
          </div>

          {/* ══════════════════════════════════════════════
              SIDEBAR — masquée à l'impression
          ══════════════════════════════════════════════ */}
          <div className="space-y-4 no-print">

            {/* ✅ CTA Modifier — mis en avant dans la sidebar aussi */}
            {canEdit && (
              <div className="bg-sky-50 dark:bg-sky-900/20 border-2 border-sky-300 dark:border-sky-700 rounded-2xl p-4">
                <p className="text-xs font-bold text-sky-700 dark:text-sky-300 mb-2 uppercase tracking-wide">
                  ✏️ Bulletin modifiable
                </p>
                <p className="text-xs text-sky-600 dark:text-sky-400 mb-3">
                  Ce bulletin est en brouillon. Vous pouvez encore modifier les jours travaillés et les heures supplémentaires.
                </p>
                <button
                  onClick={() => router.push(`/paie/${params.id}/modifier`)}
                  className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors text-sm">
                  <Pencil size={15} /> Modifier ce bulletin
                </button>
              </div>
            )}

            {/* Primes */}
            {bonuses.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                  <Gift size={16} className="text-cyan-500" />
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">Primes ce mois</h3>
                </div>
                <div className="p-4 space-y-2">
                  {bonuses.map((b: any) => (
                    <div key={b.id} className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400 truncate flex-1 mr-2">{b.bonusType || b.label}</span>
                      <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 flex-shrink-0">+{fmt(b.amount || 0)} F</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Exemptions */}
            {(!isSubjectToCnss || !isSubjectToIrpp) && (
              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700 rounded-2xl p-4">
                <p className="font-bold text-amber-800 dark:text-amber-200 text-sm flex items-center gap-2 mb-2">
                  <AlertCircle size={14} /> Exemptions actives
                </p>
                {!isSubjectToCnss && <p className="text-xs text-amber-600 dark:text-amber-400">• CNSS : exempté</p>}
                {!isSubjectToIrpp && <p className="text-xs text-amber-600 dark:text-amber-400">• ITS : exempté</p>}
              </div>
            )}

            {/* Coût employeur */}
            {canAdmin && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <button onClick={() => setShowEmployer(!showEmployer)}
                  className="w-full flex items-center justify-between p-4 font-bold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                  <span className="flex items-center gap-2 text-sm">
                    <Building2 size={16} className="text-sky-500" />Coût Employeur
                  </span>
                  {showEmployer ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                <AnimatePresence>
                  {showEmployer && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                      className="border-t border-gray-100 dark:border-gray-700 overflow-hidden">
                      <div className="p-4 space-y-2 text-sm bg-gray-50 dark:bg-gray-900/50">
                        <div className="flex justify-between text-gray-600 dark:text-gray-400">
                          <span>Brut</span>
                          <span className="font-mono font-bold">{fmt(data.grossSalary)} F</span>
                        </div>
                        {employerCosts.map(cost => (
                          <div key={cost.id} className="flex justify-between text-gray-600 dark:text-gray-400">
                            <span className="truncate flex-1 mr-2">{cost.label}</span>
                            <span className="font-mono font-bold text-red-500 flex-shrink-0">+{fmt(cost.amount ?? 0)} F</span>
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
                <div className="flex justify-between">
                  <span className="text-gray-500">Brut</span>
                  <span className="font-mono font-bold text-emerald-600">{fmt(data.grossSalary)} F</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">CNSS salarié</span>
                  <span className="font-mono text-red-500">{isSubjectToCnss ? `−${fmt(cnssItem?.amount || 0)}` : '0'} F</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">ITS</span>
                  <span className="font-mono text-red-500">{isSubjectToIrpp ? `−${fmt(irppItem?.amount || 0)}` : '0'} F</span>
                </div>
                <div className="flex justify-between pt-2.5 border-t border-gray-200 dark:border-gray-700">
                  <span className="font-bold text-gray-900 dark:text-white">Net à payer</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-white">{fmt(data.netSalary)} F</span>
                </div>
              </div>
            </div>

            {/* Réglementation */}
            <div className="bg-gradient-to-br from-sky-50 to-emerald-50 dark:from-sky-900/20 dark:to-emerald-900/20 rounded-2xl p-4 border border-sky-200 dark:border-sky-800">
              <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm">
                <Info size={15} className="text-sky-500" /> Réglementation Congo 2026
              </h3>
              <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                <p>• ITS 2026 — sans quotient familial</p>
                <p>• CNSS salarié : 4% (plafond 1 200 000 FCFA)</p>
                <p>• CNSS patronal : 8% + 10% + 2,25%</p>
                <p>• TUS : 2% sur brut (patronale)</p>
                <p>• SMIG : 70 400 FCFA/mois</p>
                <p className="text-sky-600 dark:text-sky-400 font-medium">Décret n°78-360 du 12 mai 1978</p>
              </div>
            </div>
          </div>

        </div>

        {/* ══════════════════════════════════════════════
            MODAL CONFIRMATION
        ══════════════════════════════════════════════ */}
        <AnimatePresence>
          {showConfirm && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print">
              <motion.div
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                <div className="flex flex-col items-center text-center">
                  {(() => {
                    const cfg = CONFIRM_CONFIG[showConfirm.action];
                    const Icon = cfg.icon;
                    const isDel = showConfirm.action === 'delete';
                    return (
                      <>
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4
                          ${isDel ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-600'}`}>
                          <Icon size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{cfg.title}</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{cfg.sub}</p>
                        {isDel && (
                          <div className="w-full mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                            <p className="text-xs text-red-700 dark:text-red-300 font-bold text-left">
                              ⚠️ Action irréversible. Le bulletin sera définitivement supprimé.
                            </p>
                          </div>
                        )}
                        <div className="flex gap-3 w-full">
                          <button onClick={() => setShowConfirm(null)}
                            className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            Annuler
                          </button>
                          <button onClick={handleAction}
                            disabled={isUpdating || isDeleting}
                            className={`flex-1 py-3 text-white font-bold rounded-xl flex justify-center items-center gap-2 transition-colors ${cfg.color}`}>
                            {(isUpdating || isDeleting)
                              ? <Loader2 className="animate-spin" size={20} />
                              : isDel ? 'Supprimer' : 'Confirmer'}
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}