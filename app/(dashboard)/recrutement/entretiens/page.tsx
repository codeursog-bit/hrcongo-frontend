// 'use client';

// import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { motion, AnimatePresence } from 'framer-motion';
// import {
//   Calendar, ArrowLeft, Loader2, BrainCircuit, User,
//   CheckCircle2, XCircle, Eye, Clock, Briefcase,
//   AlertTriangle, UserPlus, Search,
// } from 'lucide-react';
// import { api } from '@/services/api';
// import { ToastProvider, useToast } from '@/components/ui/useToast';

// // ─────────────────────────────────────────────
// // TYPES
// // ─────────────────────────────────────────────

// interface InterviewCandidate {
//   id: string;
//   firstName: string;
//   lastName: string;
//   email: string;
//   phone: string;
//   status: string;
//   totalScore?: number;
//   cvScore?: number;
//   testScore?: number;
//   aiSuggestion?: string;
//   interviewDate?: string;
//   interviewNotes?: string;
//   jobOffer: {
//     id: string;
//     title: string;
//     processingMode: string;
//     department: { name: string };
//   };
//   createdAt: string;
// }

// interface HireModalData {
//   candidateId: string;
//   firstName: string;
//   lastName: string;
//   email: string;
//   phone: string;
//   jobTitle: string;
//   jobOfferId: string;
// }

// interface RejectModalData {
//   candidateId: string;
//   name: string;
// }

// // ─────────────────────────────────────────────
// // INNER COMPONENT
// // ─────────────────────────────────────────────

// function EntretiensContent() {
//   const router = useRouter();
//   const toast = useToast();
//   const [candidates, setCandidates] = useState<InterviewCandidate[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [search, setSearch] = useState('');
//   const [filterMode, setFilterMode] = useState<'ALL' | 'AI_ASSISTED' | 'MANUAL'>('ALL');
//   const [hireModal, setHireModal] = useState<HireModalData | null>(null);
//   const [rejectModal, setRejectModal] = useState<RejectModalData | null>(null);
//   const [rejectReason, setRejectReason] = useState('');
//   const [isActioning, setIsActioning] = useState(false);

//   useEffect(() => { fetchInterviews(); }, []);

//   const fetchInterviews = async () => {
//     try {
//       const data = await api.get<{ candidates: InterviewCandidate[] }>('/recruitment/interviews');
//       setCandidates(data.candidates || []);
//     } catch {
//       toast.error('Erreur', 'Impossible de charger les entretiens');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const now = new Date();

//   const filtered = candidates.filter((c) => {
//     const matchSearch = `${c.firstName} ${c.lastName} ${c.jobOffer?.title}`
//       .toLowerCase().includes(search.toLowerCase());
//     const matchMode = filterMode === 'ALL' || c.jobOffer?.processingMode === filterMode;
//     return matchSearch && matchMode;
//   });

//   const upcoming = filtered
//     .filter((c) => !c.interviewDate || new Date(c.interviewDate) >= now)
//     .sort((a, b) => {
//       if (!a.interviewDate) return 1;
//       if (!b.interviewDate) return -1;
//       return new Date(a.interviewDate).getTime() - new Date(b.interviewDate).getTime();
//     });

//   const past = filtered
//     .filter((c) => c.interviewDate && new Date(c.interviewDate) < now)
//     .sort((a, b) => new Date(b.interviewDate!).getTime() - new Date(a.interviewDate!).getTime());

//   // ── ACTIONS ──

//   const handleHire = async () => {
//     if (!hireModal) return;
//     setIsActioning(true);
//     try {
//       await api.patch(`/recruitment/candidates/${hireModal.candidateId}/hire-after-interview`, {});
//       toast.success('Embauche confirmée !', `${hireModal.firstName} ${hireModal.lastName} a été embauché(e).`);
//       setHireModal(null);
//       fetchInterviews();
//     } catch (e: any) {
//       toast.error('Erreur', e?.message || 'Impossible de confirmer l\'embauche');
//     } finally {
//       setIsActioning(false);
//     }
//   };

//   const handleHireAndCreateEmployee = async () => {
//     if (!hireModal) return;
//     setIsActioning(true);
//     try {
//       await api.patch(`/recruitment/candidates/${hireModal.candidateId}/hire-after-interview`, {});
//       toast.success('Embauche confirmée !', 'Redirection vers la création du dossier employé…');
//       setHireModal(null);
//       const params = new URLSearchParams({
//         firstName: hireModal.firstName,
//         lastName: hireModal.lastName,
//         email: hireModal.email,
//         phone: hireModal.phone || '',
//         jobTitle: hireModal.jobTitle,
//         fromCandidate: hireModal.candidateId,
//       });
//       setTimeout(() => router.push(`/employes/nouveau?${params.toString()}`), 700);
//     } catch (e: any) {
//       toast.error('Erreur', e?.message || 'Impossible de confirmer l\'embauche');
//     } finally {
//       setIsActioning(false);
//     }
//   };

//   const handleReject = async () => {
//     if (!rejectModal) return;
//     setIsActioning(true);
//     try {
//       await api.patch(`/recruitment/candidates/${rejectModal.candidateId}/reject-after-interview`, {
//         reason: rejectReason || undefined,
//       });
//       toast.success('Candidat refusé', 'Le candidat a été notifié par email.');
//       setRejectModal(null);
//       setRejectReason('');
//       fetchInterviews();
//     } catch (e: any) {
//       toast.error('Erreur', e?.message || 'Impossible de refuser le candidat');
//     } finally {
//       setIsActioning(false);
//     }
//   };

//   const formatDate = (d: string) =>
//     new Date(d).toLocaleDateString('fr-FR', {
//       weekday: 'long', day: 'numeric', month: 'long',
//       hour: '2-digit', minute: '2-digit',
//     });

//   // ─────────────────────────────────────────────
//   // CARD COMPOSANT
//   // ─────────────────────────────────────────────

//   const CandidateCard = ({ c }: { c: InterviewCandidate }) => {
//     const isAI = c.jobOffer?.processingMode === 'AI_ASSISTED';
//     const isPast = c.interviewDate && new Date(c.interviewDate) < now;

//     return (
//       <motion.div
//         layout
//         initial={{ opacity: 0, y: 8 }}
//         animate={{ opacity: 1, y: 0 }}
//         exit={{ opacity: 0, scale: 0.97 }}
//         className={`bg-white dark:bg-gray-900 border rounded-2xl p-5 shadow-sm transition-all ${
//           isPast
//             ? 'border-orange-400/40 bg-orange-50/40 dark:bg-orange-500/5'
//             : 'border-gray-200 dark:border-gray-800 hover:border-purple-400/40 dark:hover:border-purple-500/30 hover:shadow-md'
//         }`}
//       >
//         <div className="flex flex-col sm:flex-row sm:items-start gap-4">

//           {/* Infos candidat */}
//           <div className="flex items-start gap-3 flex-1 min-w-0">
//             <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center font-bold text-white text-sm shrink-0 shadow-md">
//               {c.firstName[0]}{c.lastName[0]}
//             </div>
//             <div className="flex-1 min-w-0">
//               <div className="flex items-center gap-2 mb-1 flex-wrap">
//                 <h3 className="font-bold text-gray-900 dark:text-white">{c.firstName} {c.lastName}</h3>
//                 {isAI ? (
//                   <span className="px-2 py-0.5 text-[10px] font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 rounded-full flex items-center gap-1">
//                     <BrainCircuit size={9} /> IA
//                   </span>
//                 ) : (
//                   <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-full flex items-center gap-1">
//                     <User size={9} /> Manuel
//                   </span>
//                 )}
//                 {isPast && (
//                   <span className="px-2 py-0.5 text-[10px] font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 rounded-full flex items-center gap-1">
//                     <AlertTriangle size={9} /> Passé
//                   </span>
//                 )}
//               </div>

//               <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mb-1 flex-wrap">
//                 <Briefcase size={12} />
//                 <span className="font-medium text-gray-700 dark:text-gray-300">{c.jobOffer?.title}</span>
//                 <span className="text-gray-300 dark:text-gray-700">·</span>
//                 <span>{c.jobOffer?.department?.name}</span>
//               </p>

//               {c.interviewDate ? (
//                 <p className="text-sm font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
//                   <Calendar size={13} />
//                   {formatDate(c.interviewDate)}
//                 </p>
//               ) : (
//                 <p className="text-sm text-gray-400 italic flex items-center gap-1.5">
//                   <Clock size={13} /> Date à planifier
//                 </p>
//               )}

//               {c.interviewNotes && (
//                 <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">📝 {c.interviewNotes}</p>
//               )}

//               {/* Score IA */}
//               {isAI && c.totalScore != null && (
//                 <div className="flex items-center gap-3 mt-2">
//                   <span className="text-xs text-gray-400">CV <strong className="text-gray-600 dark:text-gray-400">{c.cvScore}/35</strong></span>
//                   <span className="text-xs text-gray-400">Test <strong className="text-gray-600 dark:text-gray-400">{c.testScore}/65</strong></span>
//                   <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">{c.totalScore}/100</span>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Actions */}
//           <div className="flex items-center gap-2 flex-wrap sm:shrink-0">
//             <button
//               onClick={() => router.push(
//                 isAI ? `/recrutement/ia/candidats/${c.id}` : `/recrutement/manuel/candidats/${c.id}`
//               )}
//               className="px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors"
//             >
//               <Eye size={13} /> Profil
//             </button>
//             <button
//               onClick={() => setHireModal({
//                 candidateId: c.id,
//                 firstName: c.firstName,
//                 lastName: c.lastName,
//                 email: c.email,
//                 phone: c.phone,
//                 jobTitle: c.jobOffer?.title,
//                 jobOfferId: c.jobOffer?.id,
//               })}
//               className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors shadow-sm"
//             >
//               <CheckCircle2 size={13} /> Embaucher
//             </button>
//             <button
//               onClick={() => setRejectModal({ candidateId: c.id, name: `${c.firstName} ${c.lastName}` })}
//               className="px-3 py-2 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors"
//             >
//               <XCircle size={13} /> Recaler
//             </button>
//           </div>
//         </div>
//       </motion.div>
//     );
//   };

//   // ── LOADING ──
//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center min-h-[60vh]">
//         <div className="text-center">
//           <Loader2 className="animate-spin text-purple-500 mx-auto" size={36} />
//           <p className="text-gray-500 mt-3 text-sm">Chargement des entretiens…</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-5xl mx-auto py-8 px-4">

//       {/* ── MODAL EMBAUCHE ── */}
//       <AnimatePresence>
//         {hireModal && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
//           >
//             <motion.div
//               initial={{ scale: 0.9, y: 16 }}
//               animate={{ scale: 1, y: 0 }}
//               exit={{ scale: 0.9, opacity: 0 }}
//               className="bg-white dark:bg-gray-900 border border-emerald-500/30 rounded-3xl p-8 max-w-md w-full shadow-2xl"
//             >
//               <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-emerald-500/20">
//                 <CheckCircle2 size={28} className="text-emerald-500" />
//               </div>
//               <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-1">Confirmer l'embauche</h3>
//               <p className="text-center text-gray-500 dark:text-gray-400 mb-6 text-sm">
//                 Vous embauchez <strong className="text-gray-900 dark:text-white">{hireModal.firstName} {hireModal.lastName}</strong> pour <strong className="text-gray-900 dark:text-white">{hireModal.jobTitle}</strong>
//               </p>

//               <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-2xl p-4 mb-6">
//                 <div className="flex items-start gap-3">
//                   <UserPlus size={18} className="text-blue-500 mt-0.5 shrink-0" />
//                   <div>
//                     <p className="font-bold text-blue-700 dark:text-blue-400 text-sm mb-0.5">Créer un dossier employé ?</p>
//                     <p className="text-xs text-blue-600/70 dark:text-blue-300/70 leading-relaxed">
//                       Les informations du candidat seront pré-remplies automatiquement dans le formulaire.
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               <div className="space-y-2.5">
//                 <button
//                   onClick={handleHireAndCreateEmployee}
//                   disabled={isActioning}
//                   className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-lg text-sm"
//                 >
//                   {isActioning ? <Loader2 className="animate-spin" size={18} /> : <UserPlus size={18} />}
//                   Embaucher + Créer le dossier employé
//                 </button>
//                 <button
//                   onClick={handleHire}
//                   disabled={isActioning}
//                   className="w-full py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-colors text-sm"
//                 >
//                   <CheckCircle2 size={16} /> Embaucher sans créer le dossier
//                 </button>
//                 <button
//                   onClick={() => setHireModal(null)}
//                   className="w-full py-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-medium text-sm transition-colors"
//                 >
//                   Annuler
//                 </button>
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* ── MODAL REFUS ── */}
//       <AnimatePresence>
//         {rejectModal && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
//           >
//             <motion.div
//               initial={{ scale: 0.9, y: 16 }}
//               animate={{ scale: 1, y: 0 }}
//               exit={{ scale: 0.9, opacity: 0 }}
//               className="bg-white dark:bg-gray-900 border border-red-500/30 rounded-3xl p-8 max-w-md w-full shadow-2xl"
//             >
//               <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-red-500/20">
//                 <XCircle size={28} className="text-red-500" />
//               </div>
//               <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-1">Recaler le candidat ?</h3>
//               <p className="text-center text-gray-500 dark:text-gray-400 mb-5 text-sm">
//                 <strong className="text-gray-900 dark:text-white">{rejectModal.name}</strong> sera notifié(e) par email.
//               </p>

//               <div className="mb-6">
//                 <label className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-2 block">Motif du refus <span className="font-normal text-gray-400">(optionnel)</span></label>
//                 <textarea
//                   className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-red-500/20 resize-none min-h-[80px] text-sm transition-all"
//                   placeholder="Ex : Profil ne correspond pas aux attentes du poste…"
//                   value={rejectReason}
//                   onChange={(e) => setRejectReason(e.target.value)}
//                 />
//               </div>

//               <div className="flex gap-3">
//                 <button
//                   onClick={() => { setRejectModal(null); setRejectReason(''); }}
//                   className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm transition-colors"
//                 >
//                   Annuler
//                 </button>
//                 <button
//                   onClick={handleReject}
//                   disabled={isActioning}
//                   className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-md text-sm"
//                 >
//                   {isActioning ? <Loader2 className="animate-spin" size={16} /> : <XCircle size={16} />}
//                   Confirmer le refus
//                 </button>
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* ── HEADER ── */}
//       <div className="flex items-center gap-4 mb-8">
//         <button
//           onClick={() => router.back()}
//           className="p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
//         >
//           <ArrowLeft size={20} />
//         </button>
//         <div className="flex-1">
//           <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
//             <Calendar className="text-purple-500" size={26} /> Entretiens
//           </h1>
//           <p className="text-sm text-gray-500 mt-0.5">
//             {candidates.length} candidat(s) en cours d'entretien — IA & Manuel
//           </p>
//         </div>
//       </div>

//       {/* ── FILTRES ── */}
//       <div className="flex flex-col sm:flex-row gap-3 mb-8">
//         {/* Recherche */}
//         <div className="relative flex-1">
//           <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
//           <input
//             type="text"
//             placeholder="Rechercher un candidat, un poste…"
//             className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400/50 dark:focus:border-purple-500/30 transition-all placeholder:text-gray-400"
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//           />
//         </div>

//         {/* Toggle mode */}
//         <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shrink-0">
//           {([
//             { value: 'ALL', label: 'Tous' },
//             { value: 'AI_ASSISTED', label: '🤖 IA' },
//             { value: 'MANUAL', label: '👤 Manuel' },
//           ] as const).map((opt) => (
//             <button
//               key={opt.value}
//               onClick={() => setFilterMode(opt.value)}
//               className={`px-4 py-2.5 text-sm font-bold transition-colors ${
//                 filterMode === opt.value
//                   ? 'bg-purple-600 text-white'
//                   : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
//               }`}
//             >
//               {opt.label}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* ── EMPTY STATE ── */}
//       {filtered.length === 0 && (
//         <div className="text-center py-20">
//           <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/20">
//             <Calendar size={28} className="text-purple-400" />
//           </div>
//           <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
//             {candidates.length === 0 ? 'Aucun entretien planifié' : 'Aucun résultat'}
//           </h2>
//           <p className="text-gray-500 text-sm max-w-xs mx-auto">
//             {candidates.length === 0
//               ? 'Passez des candidats en statut "Entretien" depuis leur fiche pour les voir ici.'
//               : 'Modifiez votre recherche ou vos filtres.'}
//           </p>
//         </div>
//       )}

//       {/* ── ENTRETIENS À VENIR ── */}
//       {upcoming.length > 0 && (
//         <div className="mb-8">
//           <div className="flex items-center gap-2 mb-4">
//             <Clock size={16} className="text-purple-500" />
//             <h2 className="text-base font-bold text-gray-900 dark:text-white">À venir</h2>
//             <span className="bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-bold px-2.5 py-0.5 rounded-full">
//               {upcoming.length}
//             </span>
//           </div>
//           <div className="space-y-3">
//             <AnimatePresence>
//               {upcoming.map((c) => <CandidateCard key={c.id} c={c} />)}
//             </AnimatePresence>
//           </div>
//         </div>
//       )}

//       {/* ── ENTRETIENS PASSÉS ── */}
//       {past.length > 0 && (
//         <div>
//           <div className="flex items-center gap-2 mb-4">
//             <AlertTriangle size={16} className="text-orange-400" />
//             <h2 className="text-base font-bold text-gray-500">Entretiens passés — décision en attente</h2>
//             <span className="bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-bold px-2.5 py-0.5 rounded-full">
//               {past.length}
//             </span>
//           </div>
//           <div className="space-y-3">
//             <AnimatePresence>
//               {past.map((c) => <CandidateCard key={c.id} c={c} />)}
//             </AnimatePresence>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────
// // EXPORT — ToastProvider local à cette page
// // ─────────────────────────────────────────────

// export default function EntretiensPage() {
//   return (
//     <ToastProvider>
//       <EntretiensContent />
//     </ToastProvider>
//   );
// }


'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, ArrowLeft, Loader2, BrainCircuit, User,
  CheckCircle2, XCircle, Eye, Clock, Briefcase,
  AlertTriangle, UserPlus, Search,
} from 'lucide-react';
import { api } from '@/services/api';
import { ToastProvider, useToast } from '@/components/ui/useToast';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

interface InterviewCandidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  totalScore?: number;
  cvScore?: number;
  testScore?: number;
  aiSuggestion?: string;
  interviewDate?: string;
  interviewNotes?: string;
  jobOffer: {
    id: string;
    title: string;
    processingMode: string;
    department: { name: string };
  };
  createdAt: string;
}

interface HireModalData {
  candidateId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  jobOfferId: string;
}

interface RejectModalData {
  candidateId: string;
  name: string;
}

// ─────────────────────────────────────────────
// INNER COMPONENT
// ─────────────────────────────────────────────

function EntretiensContent() {
  const router = useRouter();
  const toast = useToast();
  const [candidates, setCandidates] = useState<InterviewCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'AI_ASSISTED' | 'MANUAL'>('ALL');
  const [hireModal, setHireModal] = useState<HireModalData | null>(null);
  const [rejectModal, setRejectModal] = useState<RejectModalData | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isActioning, setIsActioning] = useState(false);

  useEffect(() => { fetchInterviews(); }, []);

  const fetchInterviews = async () => {
    try {
      const data = await api.get<{ candidates: InterviewCandidate[] }>('/recruitment/interviews');
      setCandidates(data.candidates || []);
    } catch {
      toast.error('Erreur', 'Impossible de charger les entretiens');
    } finally {
      setIsLoading(false);
    }
  };

  const now = new Date();

  const filtered = candidates.filter((c) => {
    const matchSearch = `${c.firstName} ${c.lastName} ${c.jobOffer?.title}`
      .toLowerCase().includes(search.toLowerCase());
    const matchMode = filterMode === 'ALL' || c.jobOffer?.processingMode === filterMode;
    return matchSearch && matchMode;
  });

  const upcoming = filtered
    .filter((c) => !c.interviewDate || new Date(c.interviewDate) >= now)
    .sort((a, b) => {
      if (!a.interviewDate) return 1;
      if (!b.interviewDate) return -1;
      return new Date(a.interviewDate).getTime() - new Date(b.interviewDate).getTime();
    });

  const past = filtered
    .filter((c) => c.interviewDate && new Date(c.interviewDate) < now)
    .sort((a, b) => new Date(b.interviewDate!).getTime() - new Date(a.interviewDate!).getTime());

  // ── ACTIONS ──

  const handleHire = async () => {
    if (!hireModal) return;
    setIsActioning(true);
    try {
      await api.patch(`/recruitment/candidates/${hireModal.candidateId}/hire-after-interview`, {});
      toast.success('Embauche confirmée !', `${hireModal.firstName} ${hireModal.lastName} a été embauché(e).`);
      setHireModal(null);
      fetchInterviews();
    } catch (e: any) {
      toast.error('Erreur', e?.message || 'Impossible de confirmer l\'embauche');
    } finally {
      setIsActioning(false);
    }
  };

  const handleHireAndCreateEmployee = async () => {
    if (!hireModal) return;
    setIsActioning(true);
    try {
      await api.patch(`/recruitment/candidates/${hireModal.candidateId}/hire-after-interview`, {});
      toast.success('Embauche confirmée !', 'Redirection vers la création du dossier employé…');
      setHireModal(null);
      const params = new URLSearchParams({
        firstName: hireModal.firstName,
        lastName: hireModal.lastName,
        email: hireModal.email,
        phone: hireModal.phone || '',
        jobTitle: hireModal.jobTitle,
        fromCandidate: hireModal.candidateId,
      });
      setTimeout(() => router.push(`/employes/nouveau/formulaire?${params.toString()}`), 700);
    } catch (e: any) {
      toast.error('Erreur', e?.message || 'Impossible de confirmer l\'embauche');
    } finally {
      setIsActioning(false);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setIsActioning(true);
    try {
      await api.patch(`/recruitment/candidates/${rejectModal.candidateId}/reject-after-interview`, {
        reason: rejectReason || undefined,
      });
      toast.success('Candidat refusé', 'Le candidat a été notifié par email.');
      setRejectModal(null);
      setRejectReason('');
      fetchInterviews();
    } catch (e: any) {
      toast.error('Erreur', e?.message || 'Impossible de refuser le candidat');
    } finally {
      setIsActioning(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long',
      hour: '2-digit', minute: '2-digit',
    });

  // ─────────────────────────────────────────────
  // CARD COMPOSANT
  // ─────────────────────────────────────────────

  const CandidateCard = ({ c }: { c: InterviewCandidate }) => {
    const isAI = c.jobOffer?.processingMode === 'AI_ASSISTED';
    const isPast = c.interviewDate && new Date(c.interviewDate) < now;

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className={`bg-white dark:bg-gray-900 border rounded-2xl p-5 shadow-sm transition-all ${
          isPast
            ? 'border-orange-400/40 bg-orange-50/40 dark:bg-orange-500/5'
            : 'border-gray-200 dark:border-gray-800 hover:border-purple-400/40 dark:hover:border-purple-500/30 hover:shadow-md'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">

          {/* Infos candidat */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center font-bold text-white text-sm shrink-0 shadow-md">
              {c.firstName[0]}{c.lastName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="font-bold text-gray-900 dark:text-white">{c.firstName} {c.lastName}</h3>
                {isAI ? (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 rounded-full flex items-center gap-1">
                    <BrainCircuit size={9} /> IA
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-full flex items-center gap-1">
                    <User size={9} /> Manuel
                  </span>
                )}
                {isPast && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 rounded-full flex items-center gap-1">
                    <AlertTriangle size={9} /> Passé
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mb-1 flex-wrap">
                <Briefcase size={12} />
                <span className="font-medium text-gray-700 dark:text-gray-300">{c.jobOffer?.title}</span>
                <span className="text-gray-300 dark:text-gray-700">·</span>
                <span>{c.jobOffer?.department?.name}</span>
              </p>

              {c.interviewDate ? (
                <p className="text-sm font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                  <Calendar size={13} />
                  {formatDate(c.interviewDate)}
                </p>
              ) : (
                <p className="text-sm text-gray-400 italic flex items-center gap-1.5">
                  <Clock size={13} /> Date à planifier
                </p>
              )}

              {c.interviewNotes && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">📝 {c.interviewNotes}</p>
              )}

              {/* Score IA */}
              {isAI && c.totalScore != null && (
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-gray-400">CV <strong className="text-gray-600 dark:text-gray-400">{c.cvScore}/35</strong></span>
                  <span className="text-xs text-gray-400">Test <strong className="text-gray-600 dark:text-gray-400">{c.testScore}/65</strong></span>
                  <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">{c.totalScore}/100</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap sm:shrink-0">
            <button
              onClick={() => router.push(
                isAI ? `/recrutement/ia/candidats/${c.id}` : `/recrutement/manuel/candidats/${c.id}`
              )}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors"
            >
              <Eye size={13} /> Profil
            </button>
            <button
              onClick={() => setHireModal({
                candidateId: c.id,
                firstName: c.firstName,
                lastName: c.lastName,
                email: c.email,
                phone: c.phone,
                jobTitle: c.jobOffer?.title,
                jobOfferId: c.jobOffer?.id,
              })}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <CheckCircle2 size={13} /> Embaucher
            </button>
            <button
              onClick={() => setRejectModal({ candidateId: c.id, name: `${c.firstName} ${c.lastName}` })}
              className="px-3 py-2 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors"
            >
              <XCircle size={13} /> Recaler
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  // ── LOADING ──
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="animate-spin text-purple-500 mx-auto" size={36} />
          <p className="text-gray-500 mt-3 text-sm">Chargement des entretiens…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">

      {/* ── MODAL EMBAUCHE ── */}
      <AnimatePresence>
        {hireModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-900 border border-emerald-500/30 rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-emerald-500/20">
                <CheckCircle2 size={28} className="text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-1">Confirmer l'embauche</h3>
              <p className="text-center text-gray-500 dark:text-gray-400 mb-6 text-sm">
                Vous embauchez <strong className="text-gray-900 dark:text-white">{hireModal.firstName} {hireModal.lastName}</strong> pour <strong className="text-gray-900 dark:text-white">{hireModal.jobTitle}</strong>
              </p>

              <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-2xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <UserPlus size={18} className="text-blue-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-blue-700 dark:text-blue-400 text-sm mb-0.5">Créer un dossier employé ?</p>
                    <p className="text-xs text-blue-600/70 dark:text-blue-300/70 leading-relaxed">
                      Les informations du candidat seront pré-remplies automatiquement dans le formulaire.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <button
                  onClick={handleHireAndCreateEmployee}
                  disabled={isActioning}
                  className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-lg text-sm"
                >
                  {isActioning ? <Loader2 className="animate-spin" size={18} /> : <UserPlus size={18} />}
                  Embaucher + Créer le dossier employé
                </button>
                <button
                  onClick={handleHire}
                  disabled={isActioning}
                  className="w-full py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-colors text-sm"
                >
                  <CheckCircle2 size={16} /> Embaucher sans créer le dossier
                </button>
                <button
                  onClick={() => setHireModal(null)}
                  className="w-full py-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-medium text-sm transition-colors"
                >
                  Annuler
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MODAL REFUS ── */}
      <AnimatePresence>
        {rejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-900 border border-red-500/30 rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-red-500/20">
                <XCircle size={28} className="text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-1">Recaler le candidat ?</h3>
              <p className="text-center text-gray-500 dark:text-gray-400 mb-5 text-sm">
                <strong className="text-gray-900 dark:text-white">{rejectModal.name}</strong> sera notifié(e) par email.
              </p>

              <div className="mb-6">
                <label className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-2 block">Motif du refus <span className="font-normal text-gray-400">(optionnel)</span></label>
                <textarea
                  className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-red-500/20 resize-none min-h-[80px] text-sm transition-all"
                  placeholder="Ex : Profil ne correspond pas aux attentes du poste…"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setRejectModal(null); setRejectReason(''); }}
                  className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleReject}
                  disabled={isActioning}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-md text-sm"
                >
                  {isActioning ? <Loader2 className="animate-spin" size={16} /> : <XCircle size={16} />}
                  Confirmer le refus
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HEADER ── */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.back()}
          className="p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Calendar className="text-purple-500" size={26} /> Entretiens
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {candidates.length} candidat(s) en cours d'entretien — IA & Manuel
          </p>
        </div>
      </div>

      {/* ── FILTRES ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        {/* Recherche */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher un candidat, un poste…"
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400/50 dark:focus:border-purple-500/30 transition-all placeholder:text-gray-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Toggle mode */}
        <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shrink-0">
          {([
            { value: 'ALL', label: 'Tous' },
            { value: 'AI_ASSISTED', label: '🤖 IA' },
            { value: 'MANUAL', label: '👤 Manuel' },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilterMode(opt.value)}
              className={`px-4 py-2.5 text-sm font-bold transition-colors ${
                filterMode === opt.value
                  ? 'bg-purple-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── EMPTY STATE ── */}
      {filtered.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/20">
            <Calendar size={28} className="text-purple-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            {candidates.length === 0 ? 'Aucun entretien planifié' : 'Aucun résultat'}
          </h2>
          <p className="text-gray-500 text-sm max-w-xs mx-auto">
            {candidates.length === 0
              ? 'Passez des candidats en statut "Entretien" depuis leur fiche pour les voir ici.'
              : 'Modifiez votre recherche ou vos filtres.'}
          </p>
        </div>
      )}

      {/* ── ENTRETIENS À VENIR ── */}
      {upcoming.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-purple-500" />
            <h2 className="text-base font-bold text-gray-900 dark:text-white">À venir</h2>
            <span className="bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {upcoming.length}
            </span>
          </div>
          <div className="space-y-3">
            <AnimatePresence>
              {upcoming.map((c) => <CandidateCard key={c.id} c={c} />)}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* ── ENTRETIENS PASSÉS ── */}
      {past.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-orange-400" />
            <h2 className="text-base font-bold text-gray-500">Entretiens passés — décision en attente</h2>
            <span className="bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {past.length}
            </span>
          </div>
          <div className="space-y-3">
            <AnimatePresence>
              {past.map((c) => <CandidateCard key={c.id} c={c} />)}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// EXPORT — ToastProvider local à cette page
// ─────────────────────────────────────────────

export default function EntretiensPage() {
  return (
    <ToastProvider>
      <EntretiensContent />
    </ToastProvider>
  );
}