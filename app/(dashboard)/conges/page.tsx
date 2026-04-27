'use client';
// 'use client';

// import React, { useState, useMemo, useEffect } from 'react';
// import Link from 'next/link';
// import {
//   Calendar, Check, X, Clock, ArrowRight, UserCircle,
//   Loader2, AlertCircle, FileText, CheckCircle2, XCircle,
//   MessageSquare, ChevronDown, Info
// } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { GlobalLoader } from '@/components/ui/GlobalLoader';
// import { api } from '@/services/api';

// type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
// type LeaveType = 'ANNUAL' | 'SICK' | 'MATERNITY' | 'PATERNITY' | 'UNPAID' | 'SPECIAL';

// interface LeaveRequest {
//   id: string;
//   employee: {
//     firstName: string;
//     lastName: string;
//     photoUrl?: string;
//     position: string;
//     department?: { name: string };
//   };
//   type: LeaveType;
//   startDate: string;
//   endDate: string;
//   daysCount: number;
//   reason?: string;
//   status: LeaveStatus;
//   createdAt: string;
// }

// const TYPE_CONFIG: Record<LeaveType, { label: string; dot: string; badge: string }> = {
//   ANNUAL:    { label: 'Congés Annuels',  dot: 'bg-sky-400',    badge: 'bg-sky-50 text-sky-700 border-sky-100' },
//   SICK:      { label: 'Maladie',         dot: 'bg-red-400',    badge: 'bg-red-50 text-red-700 border-red-100' },
//   MATERNITY: { label: 'Maternité',       dot: 'bg-pink-400',   badge: 'bg-pink-50 text-pink-700 border-pink-100' },
//   PATERNITY: { label: 'Paternité',       dot: 'bg-blue-400',   badge: 'bg-blue-50 text-blue-700 border-blue-100' },
//   UNPAID:    { label: 'Sans Solde',      dot: 'bg-gray-400',   badge: 'bg-gray-50 text-gray-600 border-gray-200' },
//   SPECIAL:   { label: 'Événement Fam.', dot: 'bg-violet-400', badge: 'bg-violet-50 text-violet-700 border-violet-100' },
// };

// export default function LeaveManagementPage() {
//   const [activeTab, setActiveTab] = useState<'ACTION' | 'HISTORY'>('ACTION');
//   const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [modalData, setModalData] = useState<{
//     type: 'approve' | 'reject';
//     leave: LeaveRequest;
//   } | null>(null);
//   const [rejectionReason, setRejectionReason] = useState('');
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [userRole, setUserRole] = useState<string>('');

//   useEffect(() => {
//     // Rôle uniquement pour l'affichage UI — jamais pour gater la sécurité
//     // La vraie sécurité est gérée côté backend
//     try {
//       const token = document.cookie
//         .split(';')
//         .find((c) => c.trim().startsWith('role='))
//         ?.split('=')[1];
//       if (token) setUserRole(decodeURIComponent(token));
//     } catch {}

//     fetchLeaves();
//   }, []);

//   const fetchLeaves = async () => {
//     try {
//       // Le backend filtre automatiquement selon le rôle du token JWT
//       const data = await api.get<LeaveRequest[]>('/leaves');
//       setLeaves(data);
//     } catch (error) {
//       console.error('Erreur chargement congés', error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const pendingLeaves = useMemo(() => leaves.filter((l) => l.status === 'PENDING'), [leaves]);
//   const historyLeaves = useMemo(() => leaves.filter((l) => l.status !== 'PENDING'), [leaves]);

//   const openModal = (type: 'approve' | 'reject', leave: LeaveRequest) => {
//     setRejectionReason('');
//     setModalData({ type, leave });
//   };

//   const confirmAction = async () => {
//     if (!modalData) return;

//     if (modalData.type === 'reject' && !rejectionReason.trim()) return;

//     setIsProcessing(true);
//     try {
//       const status = modalData.type === 'approve' ? 'APPROVED' : 'REJECTED';
//       await api.patch(`/leaves/${modalData.leave.id}/status`, {
//         status,
//         rejectionReason: modalData.type === 'reject' ? rejectionReason : undefined,
//       });

//       // Mise à jour optimiste
//       setLeaves((prev) =>
//         prev.map((l) =>
//           l.id === modalData.leave.id ? { ...l, status } : l,
//         ),
//       );
//       setModalData(null);
//     } catch (e: any) {
//       alert(e?.message || 'Erreur lors de la mise à jour');
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   if (isLoading) return <GlobalLoader />;

//   return (
//     <div className="max-w-[1600px] mx-auto pb-24 space-y-8">

//       {/* ── HEADER ── */}
//       <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
//         <div>
//           <p className="text-xs font-bold tracking-[0.2em] text-gray-400 uppercase mb-1">
//             Ressources Humaines
//           </p>
//           <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
//             Gestion des Congés
//           </h1>
//           <p className="text-gray-400 text-sm mt-1">
//             Validez les demandes · Consultez l'historique de votre périmètre
//           </p>
//         </div>
//         <div className="flex gap-3">
//           <Link
//             href={bp("/conges/mon-espace")}
//             className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 text-gray-600 dark:text-gray-300"
//           >
//             <UserCircle size={18} /> Mon Espace
//           </Link>
//           <Link
//             href={bp("/conges/calendrier")}
//             className="px-5 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold text-sm hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm"
//           >
//             <Calendar size={18} /> Planning
//           </Link>
//         </div>
//       </div>

//       {/* ── TABS ── */}
//       <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
//         <button
//           onClick={() => setActiveTab('ACTION')}
//           className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
//             activeTab === 'ACTION'
//               ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
//               : 'text-gray-500 hover:text-gray-700'
//           }`}
//         >
//           <AlertCircle size={16} />
//           À Traiter
//           {pendingLeaves.length > 0 && (
//             <span className="bg-orange-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
//               {pendingLeaves.length}
//             </span>
//           )}
//         </button>
//         <button
//           onClick={() => setActiveTab('HISTORY')}
//           className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
//             activeTab === 'HISTORY'
//               ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
//               : 'text-gray-500 hover:text-gray-700'
//           }`}
//         >
//           <FileText size={16} />
//           Historique
//         </button>
//       </div>

//       {/* ── CONTENT ── */}
//       <AnimatePresence mode="wait">

//         {/* TAB PENDING */}
//         {activeTab === 'ACTION' && (
//           <motion.div
//             key="action"
//             initial={{ opacity: 0, y: 8 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0, y: -8 }}
//             className="space-y-4"
//           >
//             {pendingLeaves.length === 0 ? (
//               <div className="text-center py-24 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
//                 <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
//                   <CheckCircle2 size={32} />
//                 </div>
//                 <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
//                   Tout est traité !
//                 </h3>
//                 <p className="text-gray-400 text-sm">Aucune demande en attente.</p>
//               </div>
//             ) : (
//               <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
//                 {pendingLeaves.map((leave) => {
//                   const cfg = TYPE_CONFIG[leave.type];
//                   const initials = `${leave.employee.firstName[0]}${leave.employee.lastName[0]}`;
//                   return (
//                     <motion.div
//                       key={leave.id}
//                       layout
//                       className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
//                     >
//                       {/* Barre de couleur type */}
//                       <div className={`h-1 w-full ${cfg.dot.replace('bg-', 'bg-').replace('-400', '-300')}`} />

//                       <div className="p-6 flex gap-5">
//                         {/* Avatar */}
//                         <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center font-bold text-gray-500 dark:text-gray-300 text-sm shrink-0">
//                           {leave.employee.photoUrl ? (
//                             <img
//                               src={leave.employee.photoUrl}
//                               className="w-full h-full rounded-xl object-cover"
//                               alt={initials}
//                             />
//                           ) : (
//                             initials
//                           )}
//                         </div>

//                         {/* Info */}
//                         <div className="flex-1 min-w-0">
//                           <div className="flex items-start justify-between gap-2 mb-3">
//                             <div>
//                               <p className="font-bold text-gray-900 dark:text-white">
//                                 {leave.employee.firstName} {leave.employee.lastName}
//                               </p>
//                               <p className="text-xs text-gray-400">
//                                 {leave.employee.position}
//                                 {leave.employee.department
//                                   ? ` · ${leave.employee.department.name}`
//                                   : ''}
//                               </p>
//                             </div>
//                             <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${cfg.badge} shrink-0`}>
//                               {cfg.label}
//                             </span>
//                           </div>

//                           {/* Dates */}
//                           <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 px-3 py-2 rounded-lg mb-3">
//                             <Calendar size={14} className="text-gray-400 shrink-0" />
//                             <span className="font-mono text-xs">
//                               {new Date(leave.startDate).toLocaleDateString('fr-FR')}
//                             </span>
//                             <ArrowRight size={12} className="text-gray-300" />
//                             <span className="font-mono text-xs">
//                               {new Date(leave.endDate).toLocaleDateString('fr-FR')}
//                             </span>
//                             <span className="ml-auto font-bold text-xs text-gray-500">
//                               {leave.daysCount}j ouvrés
//                             </span>
//                           </div>

//                           {leave.reason && (
//                             <p className="text-xs text-gray-400 italic border-l-2 border-gray-200 dark:border-gray-600 pl-3 mb-4 truncate">
//                               "{leave.reason}"
//                             </p>
//                           )}

//                           {/* Actions */}
//                           <div className="flex gap-2">
//                             <button
//                               onClick={() => openModal('approve', leave)}
//                               className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5"
//                             >
//                               <Check size={16} /> Valider
//                             </button>
//                             <button
//                               onClick={() => openModal('reject', leave)}
//                               className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 hover:text-red-600 text-gray-600 dark:text-gray-300 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5"
//                             >
//                               <X size={16} /> Refuser
//                             </button>
//                           </div>
//                         </div>
//                       </div>
//                     </motion.div>
//                   );
//                 })}
//               </div>
//             )}
//           </motion.div>
//         )}

//         {/* TAB HISTORY */}
//         {activeTab === 'HISTORY' && (
//           <motion.div
//             key="history"
//             initial={{ opacity: 0, y: 8 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0, y: -8 }}
//           >
//             {historyLeaves.length === 0 ? (
//               <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
//                 <Clock size={32} className="text-gray-300 mx-auto mb-3" />
//                 <p className="text-gray-400 text-sm">Aucun historique disponible.</p>
//               </div>
//             ) : (
//               <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
//                 <table className="w-full text-left">
//                   <thead className="bg-gray-50 dark:bg-gray-900/40 border-b border-gray-100 dark:border-gray-700">
//                     <tr>
//                       <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Employé</th>
//                       <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Type</th>
//                       <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Période</th>
//                       <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Durée</th>
//                       <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Statut</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
//                     {historyLeaves.map((leave) => {
//                       const cfg = TYPE_CONFIG[leave.type];
//                       return (
//                         <tr
//                           key={leave.id}
//                           className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
//                         >
//                           <td className="px-6 py-4">
//                             <p className="font-semibold text-sm text-gray-900 dark:text-white">
//                               {leave.employee.firstName} {leave.employee.lastName}
//                             </p>
//                             <p className="text-xs text-gray-400">
//                               {leave.employee.department?.name}
//                             </p>
//                           </td>
//                           <td className="px-6 py-4">
//                             <span className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
//                               <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
//                               {cfg.label}
//                             </span>
//                           </td>
//                           <td className="px-6 py-4 text-sm font-mono text-gray-500">
//                             {new Date(leave.startDate).toLocaleDateString('fr-FR')} →{' '}
//                             {new Date(leave.endDate).toLocaleDateString('fr-FR')}
//                           </td>
//                           <td className="px-6 py-4 text-center">
//                             <span className="text-sm font-bold text-gray-500">
//                               {leave.daysCount}j
//                             </span>
//                           </td>
//                           <td className="px-6 py-4 text-center">
//                             {leave.status === 'APPROVED' && (
//                               <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full border border-emerald-100">
//                                 <CheckCircle2 size={13} /> Validé
//                               </span>
//                             )}
//                             {leave.status === 'REJECTED' && (
//                               <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-full border border-red-100">
//                                 <XCircle size={13} /> Refusé
//                               </span>
//                             )}
//                             {leave.status === 'CANCELLED' && (
//                               <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-600">
//                                 Annulé
//                               </span>
//                             )}
//                           </td>
//                         </tr>
//                       );
//                     })}
//                   </tbody>
//                 </table>
//               </div>
//             )}
//           </motion.div>
//         )}

//       </AnimatePresence>

//       {/* ── MODAL CONFIRMATION ── */}
//       <AnimatePresence>
//         {modalData && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
//             onClick={(e) => e.target === e.currentTarget && setModalData(null)}
//           >
//             <motion.div
//               initial={{ scale: 0.95, y: 16 }}
//               animate={{ scale: 1, y: 0 }}
//               exit={{ scale: 0.95, y: 16 }}
//               className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-700"
//             >
//               {/* Icône */}
//               <div
//                 className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${
//                   modalData.type === 'approve'
//                     ? 'bg-emerald-100 text-emerald-600'
//                     : 'bg-red-100 text-red-600'
//                 }`}
//               >
//                 {modalData.type === 'approve' ? <Check size={26} /> : <X size={26} />}
//               </div>

//               <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
//                 {modalData.type === 'approve' ? 'Valider la demande' : 'Refuser la demande'}
//               </h3>
//               <p className="text-sm text-gray-400 mb-6">
//                 {modalData.type === 'approve'
//                   ? 'L\'employé sera notifié par email.'
//                   : 'Un motif est requis pour justifier le refus.'}
//               </p>

//               {/* Récap */}
//               <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6 space-y-1.5 text-sm border border-gray-100 dark:border-gray-600">
//                 <p className="text-gray-500">
//                   Employé :{' '}
//                   <strong className="text-gray-900 dark:text-white">
//                     {modalData.leave.employee.firstName} {modalData.leave.employee.lastName}
//                   </strong>
//                 </p>
//                 <p className="text-gray-500">
//                   Période : {new Date(modalData.leave.startDate).toLocaleDateString('fr-FR')} →{' '}
//                   {new Date(modalData.leave.endDate).toLocaleDateString('fr-FR')}
//                 </p>
//                 <p className="text-gray-500">
//                   Durée :{' '}
//                   <strong className="text-gray-900 dark:text-white">
//                     {modalData.leave.daysCount} jours ouvrés
//                   </strong>
//                 </p>
//               </div>

//               {/* Motif de refus */}
//               {modalData.type === 'reject' && (
//                 <div className="mb-6">
//                   <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
//                     <MessageSquare size={14} />
//                     Motif du refus <span className="text-red-500">*</span>
//                   </label>
//                   <textarea
//                     value={rejectionReason}
//                     onChange={(e) => setRejectionReason(e.target.value)}
//                     placeholder="Ex: Chevauchement avec une autre absence, période de forte activité..."
//                     rows={3}
//                     className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none focus:ring-2 focus:ring-red-500/20 outline-none placeholder-gray-300"
//                   />
//                   {!rejectionReason.trim() && (
//                     <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
//                       <Info size={12} /> Le motif est obligatoire
//                     </p>
//                   )}
//                 </div>
//               )}

//               <div className="flex gap-3">
//                 <button
//                   onClick={() => setModalData(null)}
//                   className="flex-1 py-3 border border-gray-200 dark:border-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
//                 >
//                   Annuler
//                 </button>
//                 <button
//                   onClick={confirmAction}
//                   disabled={
//                     isProcessing ||
//                     (modalData.type === 'reject' && !rejectionReason.trim())
//                   }
//                   className={`flex-1 py-3 rounded-xl font-semibold text-sm text-white shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${
//                     modalData.type === 'approve'
//                       ? 'bg-emerald-500 hover:bg-emerald-600'
//                       : 'bg-red-500 hover:bg-red-600'
//                   }`}
//                 >
//                   {isProcessing ? (
//                     <Loader2 size={16} className="animate-spin" />
//                   ) : modalData.type === 'approve' ? (
//                     <><Check size={16} /> Confirmer</>
//                   ) : (
//                     <><X size={16} /> Refuser</>
//                   )}
//                 </button>
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }





import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar, Check, X, Clock, ArrowRight, UserCircle,
  Loader2, AlertCircle, FileText, CheckCircle2, XCircle,
  MessageSquare, Info, Wallet, Users, TrendingUp, BarChart3,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlobalLoader } from '@/components/ui/GlobalLoader';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';

// ─── Types ────────────────────────────────────────────────────────────────────

type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
type LeaveType   = 'ANNUAL' | 'SICK' | 'MATERNITY' | 'PATERNITY' | 'UNPAID' | 'SPECIAL' | 'COMPENSATORY';

interface LeaveRequest {
  id: string;
  employee: {
    firstName: string;
    lastName:  string;
    photoUrl?: string;
    position:  string;
    department?: { name: string };
  };
  type:      LeaveType;
  startDate: string;
  endDate:   string;
  daysCount: number;
  reason?:   string;
  status:    LeaveStatus;
  createdAt: string;
}

interface ProvisionSummary {
  totalProvision: number;
  details: Array<{ alertLevel: string }>;
}

// ─── Config types ─────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<LeaveType, { label: string; dot: string; badge: string }> = {
  ANNUAL:       { label: 'Congés Annuels',  dot: 'bg-sky-400',    badge: 'bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800' },
  SICK:         { label: 'Maladie',         dot: 'bg-red-400',    badge: 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800' },
  MATERNITY:    { label: 'Maternité',       dot: 'bg-pink-400',   badge: 'bg-pink-50 text-pink-700 border-pink-100 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800' },
  PATERNITY:    { label: 'Paternité',       dot: 'bg-blue-400',   badge: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' },
  UNPAID:       { label: 'Sans Solde',      dot: 'bg-gray-400',   badge: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700' },
  SPECIAL:      { label: 'Événement Fam.', dot: 'bg-violet-400', badge: 'bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800' },
  COMPENSATORY: { label: 'Compensatoire',  dot: 'bg-teal-400',   badge: 'bg-teal-50 text-teal-700 border-teal-100 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800' },
};

const fmtXAF = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n));

// ─── Composant principal ──────────────────────────────────────────────────────

export default function LeaveManagementPage() {
  const { bp } = useBasePath();
  const [activeTab, setActiveTab]   = useState<'ACTION' | 'HISTORY'>('ACTION');
  const [leaves, setLeaves]         = useState<LeaveRequest[]>([]);
  const [provision, setProvision]   = useState<ProvisionSummary | null>(null);
  const [isLoading, setIsLoading]   = useState(true);
  const [modalData, setModalData]   = useState<{ type: 'approve' | 'reject'; leave: LeaveRequest } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing]       = useState(false);
  const [userRole, setUserRole]     = useState<string>('');
  const [isRH, setIsRH]             = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        setUserRole(u.role || '');
        setIsRH(['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'].includes(u.role));
      }
    } catch {}

    const loadAll = async () => {
      try {
        // Charger les congés + la provision en parallèle (provision uniquement pour RH/Admin)
        const stored = localStorage.getItem('user');
        const role   = stored ? JSON.parse(stored).role : '';
        const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'].includes(role);

        const [leavesData, provData] = await Promise.allSettled([
          api.get<LeaveRequest[]>('/leaves'),
          isAdmin ? api.get<ProvisionSummary>('/leaves/provision') : Promise.resolve(null),
        ]);

        if (leavesData.status === 'fulfilled') setLeaves(leavesData.value);
        if (provData.status === 'fulfilled' && provData.value) setProvision(provData.value);
      } catch (e) {
        console.error('Erreur chargement congés', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadAll();
  }, []);

  const pendingLeaves = useMemo(() => leaves.filter(l => l.status === 'PENDING'),  [leaves]);
  const historyLeaves = useMemo(() => leaves.filter(l => l.status !== 'PENDING'),  [leaves]);

  // Alertes provision critiques
  const criticalCount = useMemo(
    () => provision?.details.filter(d => d.alertLevel === 'CRITICAL').length ?? 0,
    [provision]
  );
  const warningCount = useMemo(
    () => provision?.details.filter(d => d.alertLevel === 'WARNING').length ?? 0,
    [provision]
  );

  const openModal = (type: 'approve' | 'reject', leave: LeaveRequest) => {
    setRejectionReason('');
    setModalData({ type, leave });
  };

  const confirmAction = async () => {
    if (!modalData) return;
    if (modalData.type === 'reject' && !rejectionReason.trim()) return;

    setIsProcessing(true);
    try {
      const status = modalData.type === 'approve' ? 'APPROVED' : 'REJECTED';
      await api.patch(`/leaves/${modalData.leave.id}/status`, {
        status,
        rejectionReason: modalData.type === 'reject' ? rejectionReason : undefined,
      });
      setLeaves(prev => prev.map(l => l.id === modalData.leave.id ? { ...l, status } : l));
      setModalData(null);
    } catch (e: any) {
      alert(e?.message || 'Erreur lors de la mise à jour');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) return <GlobalLoader />;

  return (
    <div className="max-w-[1600px] mx-auto pb-24 space-y-8">

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-gray-400 uppercase mb-1">
            Ressources Humaines
          </p>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Gestion des Congés
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Validez les demandes · Consultez l'historique de votre périmètre
          </p>
        </div>

        {/* ── BOUTONS DE NAVIGATION ── */}
        <div className="flex flex-wrap gap-3">
          {/* Toujours visible */}
          <Link
            href={bp("/conges/mon-espace")}
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 text-gray-600 dark:text-gray-300"
          >
            <UserCircle size={18} /> Mon Espace
          </Link>

          <Link
            href={bp("/conges/nouveau")}
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 text-gray-600 dark:text-gray-300"
          >
            <AlertCircle size={18} /> Nouvelle demande
          </Link>

          <Link
            href={bp("/conges/calendrier")}
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 text-gray-600 dark:text-gray-300"
          >
            <Calendar size={18} /> Planning
          </Link>

          {/* RH / Admin uniquement */}
          {isRH && (
            <>
              <Link
                href={bp("/conges/soldes")}
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 text-gray-600 dark:text-gray-300"
              >
                <Users size={18} /> Soldes
              </Link>

              <Link
                href={bp("/conges/provision")}
                className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 shadow-sm ${
                  criticalCount > 0
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : warningCount > 0
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90'
                }`}
              >
                <Wallet size={18} />
                Provision
                {(criticalCount + warningCount) > 0 && (
                  <span className="bg-white/30 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {criticalCount + warningCount}
                  </span>
                )}
              </Link>
            </>
          )}
        </div>
      </div>

      {/* ── BANDEAU PROVISION (si alertes critiques) ── */}
      {isRH && criticalCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-5 flex items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-800 dark:text-red-200 text-sm">
                {criticalCount} employé{criticalCount > 1 ? 's' : ''} proche{criticalCount > 1 ? 's' : ''} du plafond légal (78 jours)
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                Provision totale : <strong>{fmtXAF(provision?.totalProvision ?? 0)} F CFA</strong> · Planifiez les départs en congé pour éviter la perte de droits.
              </p>
            </div>
          </div>
          <Link
            href={bp("/conges/provision")}
            className="shrink-0 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2"
          >
            Voir le détail <ArrowRight size={14} />
          </Link>
        </motion.div>
      )}

      {/* ── BANDEAU PROVISION (alertes warning uniquement) ── */}
      {isRH && criticalCount === 0 && warningCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <AlertCircle size={18} className="text-amber-500 shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              <strong>{warningCount} employé{warningCount > 1 ? 's' : ''}</strong> ont plus de 75% de leur plafond de congés non pris.
              Provision : <strong>{fmtXAF(provision?.totalProvision ?? 0)} F CFA</strong>
            </p>
          </div>
          <Link href={bp("/conges/provision")} className="text-sm font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 shrink-0">
            Détails <ArrowRight size={13} />
          </Link>
        </motion.div>
      )}

      {/* ── TABS ── */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('ACTION')}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'ACTION'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <AlertCircle size={16} />
          À Traiter
          {pendingLeaves.length > 0 && (
            <span className="bg-orange-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
              {pendingLeaves.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'HISTORY'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText size={16} />
          Historique
        </button>
      </div>

      {/* ── CONTENU ── */}
      <AnimatePresence mode="wait">

        {/* TAB PENDING */}
        {activeTab === 'ACTION' && (
          <motion.div key="action" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
            {pendingLeaves.length === 0 ? (
              <div className="text-center py-24 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Tout est traité !</h3>
                <p className="text-gray-400 text-sm">Aucune demande en attente.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {pendingLeaves.map(leave => {
                  const cfg      = TYPE_CONFIG[leave.type] ?? TYPE_CONFIG.ANNUAL;
                  const initials = `${leave.employee.firstName[0]}${leave.employee.lastName[0]}`;
                  return (
                    <motion.div key={leave.id} layout className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                      <div className={`h-1 w-full ${cfg.dot.replace('bg-', 'bg-').replace('-400', '-300')}`} />
                      <div className="p-6 flex gap-5">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center font-bold text-gray-500 dark:text-gray-300 text-sm shrink-0">
                          {leave.employee.photoUrl ? (
                            <img src={leave.employee.photoUrl} className="w-full h-full rounded-xl object-cover" alt={initials} />
                          ) : initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div>
                              <p className="font-bold text-gray-900 dark:text-white">
                                {leave.employee.firstName} {leave.employee.lastName}
                              </p>
                              <p className="text-xs text-gray-400">
                                {leave.employee.position}{leave.employee.department ? ` · ${leave.employee.department.name}` : ''}
                              </p>
                            </div>
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${cfg.badge} shrink-0`}>
                              {cfg.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 px-3 py-2 rounded-lg mb-3">
                            <Calendar size={14} className="text-gray-400 shrink-0" />
                            <span className="font-mono text-xs">{new Date(leave.startDate).toLocaleDateString('fr-FR')}</span>
                            <ArrowRight size={12} className="text-gray-300" />
                            <span className="font-mono text-xs">{new Date(leave.endDate).toLocaleDateString('fr-FR')}</span>
                            <span className="ml-auto font-bold text-xs text-gray-500">{leave.daysCount}j ouvrés</span>
                          </div>
                          {leave.type === 'UNPAID' && (
                            <p className="text-xs text-gray-400 bg-gray-50 dark:bg-gray-700/30 px-3 py-1.5 rounded-lg mb-3 flex items-center gap-1.5">
                              <Info size={12} className="text-gray-400" />
                              Congé sans solde — aucune indemnité versée
                            </p>
                          )}
                          {leave.reason && (
                            <p className="text-xs text-gray-400 italic border-l-2 border-gray-200 dark:border-gray-600 pl-3 mb-4 truncate">
                              "{leave.reason}"
                            </p>
                          )}
                          <div className="flex gap-2">
                            <button
                              onClick={() => openModal('approve', leave)}
                              className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                            >
                              <Check size={16} /> Valider
                            </button>
                            <button
                              onClick={() => openModal('reject', leave)}
                              className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 hover:text-red-600 text-gray-600 dark:text-gray-300 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5"
                            >
                              <X size={16} /> Refuser
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* TAB HISTORY */}
        {activeTab === 'HISTORY' && (
          <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            {historyLeaves.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                <Clock size={32} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Aucun historique disponible.</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 dark:bg-gray-900/40 border-b border-gray-100 dark:border-gray-700">
                    <tr>
                      {['Employé', 'Type', 'Période', 'Durée', 'Statut'].map(h => (
                        <th key={h} className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                    {historyLeaves.map(leave => {
                      const cfg = TYPE_CONFIG[leave.type] ?? TYPE_CONFIG.ANNUAL;
                      return (
                        <tr key={leave.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-semibold text-sm text-gray-900 dark:text-white">
                              {leave.employee.firstName} {leave.employee.lastName}
                            </p>
                            <p className="text-xs text-gray-400">{leave.employee.department?.name}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                              <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-mono text-gray-500">
                            {new Date(leave.startDate).toLocaleDateString('fr-FR')} → {new Date(leave.endDate).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm font-bold text-gray-500">{leave.daysCount}j</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {leave.status === 'APPROVED' && (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full border border-emerald-100">
                                <CheckCircle2 size={13} /> Validé
                              </span>
                            )}
                            {leave.status === 'REJECTED' && (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-full border border-red-100">
                                <XCircle size={13} /> Refusé
                              </span>
                            )}
                            {leave.status === 'CANCELLED' && (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-600">
                                Annulé
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MODAL CONFIRMATION ── */}
      <AnimatePresence>
        {modalData && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={e => e.target === e.currentTarget && setModalData(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-700"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${
                modalData.type === 'approve' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
              }`}>
                {modalData.type === 'approve' ? <Check size={26} /> : <X size={26} />}
              </div>

              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                {modalData.type === 'approve' ? 'Valider la demande' : 'Refuser la demande'}
              </h3>
              <p className="text-sm text-gray-400 mb-6">
                {modalData.type === 'approve'
                  ? "L'employé sera notifié par email."
                  : 'Un motif est requis pour justifier le refus.'}
              </p>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6 space-y-1.5 text-sm border border-gray-100 dark:border-gray-600">
                <p className="text-gray-500">
                  Employé : <strong className="text-gray-900 dark:text-white">
                    {modalData.leave.employee.firstName} {modalData.leave.employee.lastName}
                  </strong>
                </p>
                <p className="text-gray-500">
                  Période : {new Date(modalData.leave.startDate).toLocaleDateString('fr-FR')} → {new Date(modalData.leave.endDate).toLocaleDateString('fr-FR')}
                </p>
                <p className="text-gray-500">
                  Durée : <strong className="text-gray-900 dark:text-white">{modalData.leave.daysCount} jours ouvrés</strong>
                </p>
                <p className="text-gray-500">
                  Type : <strong className="text-gray-900 dark:text-white">{TYPE_CONFIG[modalData.leave.type]?.label}</strong>
                  {modalData.leave.type === 'UNPAID' && (
                    <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-600 text-gray-500 px-2 py-0.5 rounded-full">Sans indemnité</span>
                  )}
                </p>
              </div>

              {modalData.type === 'reject' && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                    <MessageSquare size={14} />
                    Motif du refus <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    placeholder="Ex: Chevauchement avec une absence, période de forte activité..."
                    rows={3}
                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none focus:ring-2 focus:ring-red-500/20 outline-none placeholder-gray-300"
                  />
                  {!rejectionReason.trim() && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <Info size={12} /> Le motif est obligatoire
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setModalData(null)}
                  className="flex-1 py-3 border border-gray-200 dark:border-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmAction}
                  disabled={isProcessing || (modalData.type === 'reject' && !rejectionReason.trim())}
                  className={`flex-1 py-3 rounded-xl font-semibold text-sm text-white shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${
                    modalData.type === 'approve' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  {isProcessing ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : modalData.type === 'approve' ? (
                    <><Check size={16} /> Confirmer</>
                  ) : (
                    <><X size={16} /> Refuser</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}