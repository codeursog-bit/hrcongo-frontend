// 'use client';

// import React, { useState, useEffect, useCallback } from 'react';
// import { useRouter } from 'next/navigation';
// import { motion } from 'framer-motion';
// import {
//   ArrowLeft, Mail, Phone, Calendar, Download, Loader2,
//   CheckCircle2, XCircle, FileText, MapPin, Briefcase, MessageSquare, User,
// } from 'lucide-react';
// import Link from 'next/link';
// import { api } from '@/services/api';
// import { ToastProvider, useToast } from '@/components/ui/useToast';

// // ─────────────────────────────────────────────
// // TYPES
// // ─────────────────────────────────────────────

// interface CandidateManual {
//   id: string;
//   firstName: string;
//   lastName: string;
//   email: string;
//   phone: string;
//   resumeUrl: string;
//   coverLetter?: string;
//   status: string;
//   notes?: string;
//   interviewDate?: string;
//   interviewNotes?: string;
//   jobOffer: {
//     id: string;
//     title: string;
//     location: string;
//     type: string;
//     department: { name: string };
//   };
//   createdAt: string;
// }

// // Statuts sélectionnables (simplifiés)
// const STATUSES: { value: string; label: string; color: string; icon: React.ElementType }[] = [
//   { value: 'APPLIED',   label: 'Nouvelle candidature', color: 'text-blue-600 dark:text-blue-400',   icon: User },
//   { value: 'INTERVIEW', label: 'En entretien',         color: 'text-purple-600 dark:text-purple-400', icon: Calendar },
//   { value: 'HIRED',     label: 'Embauché(e)',          color: 'text-emerald-600 dark:text-emerald-400', icon: CheckCircle2 },
//   { value: 'REJECTED',  label: 'Refusé(e)',            color: 'text-red-500 dark:text-red-400',      icon: XCircle },
// ];

// const getStatusConfig = (status: string) =>
//   STATUSES.find((s) => s.value === status) || STATUSES[0];

// // Normalise les anciens statuts
// const normalizeStatus = (s: string) => {
//   if (['APPLIED', 'INTERVIEW', 'HIRED', 'REJECTED'].includes(s)) return s;
//   if (s === 'REFUSE') return 'REJECTED';
//   return 'APPLIED';
// };

// // ─────────────────────────────────────────────
// // INNER COMPONENT
// // ─────────────────────────────────────────────

// function DetailCandidatManualContent({ id }: { id: string }) {
//   const router = useRouter();
//   const toast = useToast();

//   const [candidate, setCandidate] = useState<CandidateManual | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [notes, setNotes] = useState('');
//   const [isSavingNotes, setIsSavingNotes] = useState(false);

//   // Modal entretien
//   const [showInterviewModal, setShowInterviewModal] = useState(false);
//   const [interviewDate, setInterviewDate] = useState('');
//   const [interviewNotes, setInterviewNotes] = useState('');
//   const [isScheduling, setIsScheduling] = useState(false);

//   const fetchCandidate = useCallback(async () => {
//     try {
//       const data = await api.get<CandidateManual>(`/recruitment/candidates/${id}`);
//       setCandidate(data);
//       setNotes(data.notes || '');
//       if (data.interviewDate) {
//         setInterviewDate(new Date(data.interviewDate).toISOString().slice(0, 16));
//         setInterviewNotes(data.interviewNotes || '');
//       }
//     } catch {
//       toast.error('Erreur', 'Impossible de charger le candidat');
//     } finally {
//       setIsLoading(false);
//     }
//   }, [id]);

//   useEffect(() => { fetchCandidate(); }, [fetchCandidate]);

//   const handleStatusChange = async (newStatus: string) => {
//     // Si on passe en entretien → ouvrir le modal de planification
//     if (newStatus === 'INTERVIEW') {
//       setShowInterviewModal(true);
//       return;
//     }
//     try {
//       await api.patch(`/recruitment/candidates/${id}/status`, { status: newStatus });
//       setCandidate((prev) => prev ? { ...prev, status: newStatus } : null);
//       const config = getStatusConfig(newStatus);
//       toast.success('Statut mis à jour', `Candidat passé en "${config.label}"`);
//     } catch {
//       toast.error('Erreur', 'Impossible de mettre à jour le statut');
//     }
//   };

//   const handleScheduleInterview = async () => {
//     setIsScheduling(true);
//     try {
//       await api.patch(`/recruitment/candidates/${id}/schedule-interview`, {
//         interviewDate: interviewDate || undefined,
//         interviewNotes: interviewNotes || undefined,
//       });
//       toast.success('Entretien planifié !', 'Un email d\'invitation a été envoyé au candidat.');
//       setShowInterviewModal(false);
//       fetchCandidate();
//     } catch (e: any) {
//       toast.error('Erreur', e?.message || 'Impossible de planifier l\'entretien');
//     } finally {
//       setIsScheduling(false);
//     }
//   };

//   const handleSaveNotes = async () => {
//     if (!candidate) return;
//     setIsSavingNotes(true);
//     try {
//       await api.patch(`/recruitment/candidates/${id}/status`, {
//         status: candidate.status,
//         notes,
//       });
//       toast.success('Notes sauvegardées', 'Les notes RH ont été mises à jour.');
//     } catch {
//       toast.error('Erreur', 'Impossible de sauvegarder les notes');
//     } finally {
//       setIsSavingNotes(false);
//     }
//   };

//   // ── LOADING ──
//   if (isLoading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="text-center">
//           <Loader2 className="animate-spin text-blue-500 mx-auto" size={36} />
//           <p className="text-slate-500 mt-3 text-sm">Chargement du candidat…</p>
//         </div>
//       </div>
//     );
//   }

//   if (!candidate) {
//     return (
//       <div className="min-h-screen flex flex-col items-center justify-center">
//         <XCircle size={48} className="text-red-400 mb-4" />
//         <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Candidat introuvable</h1>
//         <Link href="/recrutement/manuel/candidats" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold">
//           Retour
//         </Link>
//       </div>
//     );
//   }

//   const normalizedStatus = normalizeStatus(candidate.status);
//   const statusConfig = getStatusConfig(normalizedStatus);
//   const StatusIcon = statusConfig.icon;
//   const isInInterview = normalizedStatus === 'INTERVIEW';

//   return (
//     <div className="max-w-6xl mx-auto py-8 px-4">

//       {/* ── MODAL ENTRETIEN ── */}
//       {showInterviewModal && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
//           <motion.div
//             initial={{ scale: 0.9, opacity: 0 }}
//             animate={{ scale: 1, opacity: 1 }}
//             className="bg-white dark:bg-gray-900 border border-purple-500/30 rounded-3xl p-8 max-w-md w-full shadow-2xl"
//           >
//             <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2.5">
//               <Calendar className="text-purple-500" size={22} />
//               {isInInterview ? 'Modifier l\'entretien' : 'Planifier un entretien'}
//             </h3>
//             <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">
//               Pour <span className="font-medium text-gray-900 dark:text-white">{candidate.firstName} {candidate.lastName}</span>
//             </p>

//             <div className="space-y-4 mb-6">
//               <div>
//                 <label className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-2 block">Date et heure</label>
//                 <input
//                   type="datetime-local"
//                   className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/30 outline-none transition-all"
//                   value={interviewDate}
//                   onChange={(e) => setInterviewDate(e.target.value)}
//                 />
//               </div>
//               <div>
//                 <label className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-2 block">Notes (lieu, modalités…)</label>
//                 <textarea
//                   className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-purple-500/30 resize-none min-h-[80px] transition-all text-sm"
//                   placeholder="Ex : Entretien présentiel, bâtiment A…"
//                   value={interviewNotes}
//                   onChange={(e) => setInterviewNotes(e.target.value)}
//                 />
//               </div>
//             </div>

//             <div className="flex gap-3">
//               <button
//                 onClick={() => setShowInterviewModal(false)}
//                 className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
//               >
//                 Annuler
//               </button>
//               <button
//                 onClick={handleScheduleInterview}
//                 disabled={isScheduling}
//                 className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-lg"
//               >
//                 {isScheduling ? <Loader2 className="animate-spin" size={18} /> : <Calendar size={18} />}
//                 Confirmer
//               </button>
//             </div>
//           </motion.div>
//         </div>
//       )}

//       {/* HEADER */}
//       <div className="flex items-center gap-4 mb-8">
//         <button
//           onClick={() => router.back()}
//           className="p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
//         >
//           <ArrowLeft size={20} />
//         </button>
//         <div className="flex-1 min-w-0">
//           <div className="flex flex-wrap items-center gap-3 mb-1">
//             <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
//               {candidate.firstName} {candidate.lastName}
//             </h1>
//             {isInInterview && (
//               <div className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center gap-1.5">
//                 <Calendar size={12} className="text-purple-500" />
//                 <span className="text-xs font-bold text-purple-500">En entretien</span>
//               </div>
//             )}
//           </div>
//           <p className="text-sm text-gray-500">
//             Postulé le {new Date(candidate.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
//           </p>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

//         {/* ── SIDEBAR ── */}
//         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-1">
//           <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-7 shadow-xl text-center sticky top-8">

//             {/* Avatar */}
//             <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-lg">
//               {candidate.firstName[0]}{candidate.lastName[0]}
//             </div>
//             <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
//               {candidate.firstName} {candidate.lastName}
//             </h2>

//             {/* Badge statut */}
//             <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 font-bold text-sm mt-3 mb-5 ${statusConfig.color}`}>
//               <StatusIcon size={14} />
//               {statusConfig.label}
//             </div>

//             {/* Entretien planifié */}
//             {candidate.interviewDate && (
//               <div className="bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30 rounded-xl p-4 mb-5 text-left">
//                 <p className="text-xs font-bold text-purple-600 dark:text-purple-400 mb-1.5 flex items-center gap-1.5">
//                   <Calendar size={11} /> Entretien planifié
//                 </p>
//                 <p className="text-sm text-gray-900 dark:text-white font-medium">
//                   {new Date(candidate.interviewDate).toLocaleDateString('fr-FR', {
//                     weekday: 'short', day: 'numeric', month: 'short',
//                     hour: '2-digit', minute: '2-digit',
//                   })}
//                 </p>
//                 {candidate.interviewNotes && (
//                   <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{candidate.interviewNotes}</p>
//                 )}
//               </div>
//             )}

//             {/* Changer statut */}
//             <div className="mb-5 text-left">
//               <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Changer le statut</label>
//               <div className="space-y-1.5">
//                 {STATUSES.map((s) => {
//                   const SIcon = s.icon;
//                   const isActive = normalizedStatus === s.value;
//                   return (
//                     <button
//                       key={s.value}
//                       onClick={() => handleStatusChange(s.value)}
//                       className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
//                         isActive
//                           ? 'bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 font-bold'
//                           : 'bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800'
//                       } ${s.color}`}
//                     >
//                       <SIcon size={14} className="shrink-0" />
//                       <span>{s.label}</span>
//                       {isActive && (
//                         <CheckCircle2 size={13} className="ml-auto shrink-0" />
//                       )}
//                     </button>
//                   );
//                 })}
//               </div>
//             </div>

//             {/* Contact */}
//             <div className="space-y-3 mb-6 text-left">
//               <a href={`mailto:${candidate.email}`} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500 transition-colors">
//                 <Mail size={14} className="text-gray-400 shrink-0" />
//                 <span className="break-all">{candidate.email}</span>
//               </a>
//               <a href={`tel:${candidate.phone}`} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500 transition-colors">
//                 <Phone size={14} className="text-gray-400 shrink-0" />
//                 <span>{candidate.phone}</span>
//               </a>
//             </div>

//             {/* Bouton entretien */}
//             <button
//               onClick={() => setShowInterviewModal(true)}
//               className="w-full py-3 mb-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md"
//             >
//               <Calendar size={16} />
//               {isInInterview ? 'Modifier l\'entretien' : 'Planifier un entretien'}
//             </button>

//             {/* CV download */}
//             <a
//               href={candidate.resumeUrl.replace('/raw/upload/', '/raw/upload/fl_attachment/')}
//               target="_blank"
//               rel="noopener noreferrer"
//               download
//               className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-md"
//             >
//               <Download size={16} /> Télécharger le CV
//             </a>
//           </div>
//         </motion.div>

//         {/* ── MAIN ── */}
//         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 space-y-6">

//           {/* Poste */}
//           <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-7 shadow-xl">
//             <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
//               <Briefcase size={18} className="text-blue-500" /> Poste visé
//             </h3>
//             <p className="text-xl font-bold text-gray-900 dark:text-white mb-4">{candidate.jobOffer.title}</p>
//             <div className="flex flex-wrap gap-2.5">
//               <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg text-sm text-gray-700 dark:text-gray-300">
//                 <Briefcase size={13} className="text-purple-400" /> {candidate.jobOffer.department.name}
//               </span>
//               <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg text-sm text-gray-700 dark:text-gray-300">
//                 <MapPin size={13} className="text-red-400" /> {candidate.jobOffer.location}
//               </span>
//               <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg text-sm text-gray-700 dark:text-gray-300">
//                 <FileText size={13} className="text-orange-400" /> {candidate.jobOffer.type}
//               </span>
//             </div>
//           </div>

//           {/* Lettre de motivation */}
//           {candidate.coverLetter && (
//             <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-7 shadow-xl">
//               <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
//                 <MessageSquare size={18} className="text-blue-500" /> Lettre de motivation
//               </h3>
//               <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line leading-relaxed text-sm">
//                 {candidate.coverLetter}
//               </p>
//             </div>
//           )}

//           {/* Notes RH */}
//           <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-7 shadow-xl">
//             <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
//               <MessageSquare size={18} className="text-blue-500" /> Notes RH
//             </h3>
//             <textarea
//               className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 min-h-[120px] text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 resize-none transition-all text-sm placeholder:text-gray-400"
//               placeholder="Ajoutez vos observations sur ce candidat…"
//               value={notes}
//               onChange={(e) => setNotes(e.target.value)}
//             />
//             <button
//               onClick={handleSaveNotes}
//               disabled={isSavingNotes}
//               className="mt-3 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 text-sm shadow-md"
//             >
//               {isSavingNotes ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
//               Sauvegarder les notes
//             </button>
//           </div>

//         </motion.div>
//       </div>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────
// // EXPORT — ToastProvider local à cette page
// // ─────────────────────────────────────────────

// export default function DetailCandidatManualPage({ params }: { params: { id: string } }) {
//   return (
//     <ToastProvider>
//       <DetailCandidatManualContent id={params.id} />
//     </ToastProvider>
//   );
// }


// 'use client';

// import React, { useState, useEffect, useCallback } from 'react';
// import { useRouter } from 'next/navigation';
// import { motion } from 'framer-motion';
// import {
//   ArrowLeft, User, Mail, Phone, Calendar, Download, Loader2, 
//   CheckCircle2, XCircle, FileText, MapPin, Briefcase, MessageSquare, LucideIcon
// } from 'lucide-react';
// import Link from 'next/link';
// import { api } from '@/services/api';

// interface CandidateManual {
//   id: string;
//   firstName: string;
//   lastName: string;
//   email: string;
//   phone: string;
//   resumeUrl: string;
//   coverLetter?: string;
//   status: string;
//   notes?: string;
//   rating?: number;
//   jobOffer: {
//     title: string;
//     location: string;
//     type: string;
//     department: { name: string };
//   };
//   createdAt: string;
// }

// interface StatusConfig {
//   label: string;
//   color: string;
//   icon: LucideIcon;
// }

// const STATUS_CONFIG: Record<string, StatusConfig> = {
//   APPLIED: { label: 'Nouvelle', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20', icon: User },
//   SCREENING: { label: 'Qualifié', color: 'text-purple-500 bg-purple-500/10 border-purple-500/20', icon: CheckCircle2 },
//   INTERVIEW: { label: 'Entretien', color: 'text-orange-500 bg-orange-500/10 border-orange-500/20', icon: MessageSquare },
//   OFFER: { label: 'Offre envoyée', color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20', icon: FileText },
//   HIRED: { label: 'Embauché', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 },
//   REJECTED: { label: 'Refusé', color: 'text-red-500 bg-red-500/10 border-red-500/20', icon: XCircle },
// };

// const ALL_STATUSES = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'];

// export default function DetailCandidatManualPage({ params }: { params: { id: string } }) {
//   const router = useRouter();
//   const [candidate, setCandidate] = useState<CandidateManual | null>(null);
//   const [isLoading, setIsLoading] = useState(true);

//   const fetchCandidate = useCallback(async () => {
//     try {
//       const data = await api.get<CandidateManual>(`/recruitment/candidates/${params.id}`);
//       setCandidate(data);
//     } catch (e) {
//       console.error(e);
//     } finally {
//       setIsLoading(false);
//     }
//   }, [params.id]);

//   useEffect(() => {
//     fetchCandidate();
//   }, [fetchCandidate]);

//   const handleStatusChange = async (newStatus: string) => {
//     try {
//       await api.patch(`/recruitment/candidates/${params.id}/status`, { status: newStatus });
//       setCandidate(prev => prev ? { ...prev, status: newStatus } : null);
//     } catch (e) {
//       alert("Erreur lors de la mise à jour du statut");
//     }
//   };

//   if (isLoading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <Loader2 className="animate-spin text-blue-500" size={32}/>
//       </div>
//     );
//   }

//   if (!candidate) {
//     return (
//       <div className="min-h-screen flex flex-col items-center justify-center">
//         <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Candidat introuvable</h1>
//         <Link href="/recrutement/manuel/candidats" className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold">
//           Retour au pipeline
//         </Link>
//       </div>
//     );
//   }

//   const statusConfig = STATUS_CONFIG[candidate.status] || STATUS_CONFIG.APPLIED;
//   const StatusIcon = statusConfig.icon;

//   return (
//     <div className="max-w-6xl mx-auto py-8 px-4">
      
//       {/* HEADER */}
//       <div className="flex items-center gap-4 mb-8">
//         <button 
//           onClick={() => router.back()} 
//           className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors"
//         >
//           <ArrowLeft size={20}/>
//         </button>
//         <div className="flex-1">
//           <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
//             {candidate.firstName} {candidate.lastName}
//           </h1>
//           <p className="text-sm text-gray-500">
//             Postulé le {new Date(candidate.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
//           </p>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
//         {/* SIDEBAR */}
//         <motion.div 
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           className="lg:col-span-1"
//         >
//           <div className="glass-panel rounded-3xl p-8 shadow-xl text-center sticky top-8">
            
//             <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 shadow-lg">
//               {candidate.firstName[0]}{candidate.lastName[0]}
//             </div>
            
//             <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
//               {candidate.firstName} {candidate.lastName}
//             </h2>
            
//             <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${statusConfig.color} font-bold text-sm mt-4 mb-6`}>
//               <StatusIcon size={16} />
//               {statusConfig.label}
//             </div>

//             {/* CHANGER STATUT */}
//             <div className="mb-6">
//               <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Changer le statut</label>
//               <select 
//                 value={candidate.status}
//                 onChange={(e) => handleStatusChange(e.target.value)}
//                 className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 font-medium text-sm"
//               >
//                 {ALL_STATUSES.map(s => (
//                   <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
//                 ))}
//               </select>
//             </div>

//             <div className="space-y-4 mb-8 text-left">
//               <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
//                 <Mail size={16} className="text-gray-400"/>
//                 <a href={`mailto:${candidate.email}`} className="hover:text-blue-500 transition-colors break-all">
//                   {candidate.email}
//                 </a>
//               </div>
              
//               <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
//                 <Phone size={16} className="text-gray-400"/>
//                 <a href={`tel:${candidate.phone}`} className="hover:text-blue-500 transition-colors">
//                   {candidate.phone}
//                 </a>
//               </div>
              
//               <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
//                 <Calendar size={16} className="text-gray-400"/>
//                 <span>{new Date(candidate.createdAt).toLocaleDateString('fr-FR')}</span>
//               </div>
//             </div>

//            <a 
//   href={candidate.resumeUrl.replace('/raw/upload/', '/raw/upload/fl_attachment/')} 
//   target="_blank" 
//   rel="noopener noreferrer"
//   download
//               className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2"
//             >
//               <Download size={20} />
//               Télécharger le CV
//             </a>
//           </div>
//         </motion.div>

//         {/* MAIN CONTENT */}
//         <motion.div 
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.1 }}
//           className="lg:col-span-2 space-y-6"
//         >
          
//           {/* POSTE VISÉ */}
//           <div className="glass-panel rounded-3xl p-8 shadow-xl">
//             <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
//               <Briefcase size={20} className="text-blue-500"/>
//               Poste visé
//             </h3>
            
//             <div className="space-y-4">
//               <div>
//                 <p className="text-sm font-bold text-gray-500 mb-1">Titre du poste</p>
//                 <p className="text-lg font-bold text-gray-900 dark:text-white">{candidate.jobOffer.title}</p>
//               </div>
              
//               <div className="flex flex-wrap gap-4">
//                 <div>
//                   <p className="text-sm font-bold text-gray-500 mb-1">Département</p>
//                   <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-900/50 px-3 py-2 rounded-lg">
//                     <Briefcase size={14} className="text-purple-400"/>
//                     <span className="text-sm font-medium text-gray-900 dark:text-white">{candidate.jobOffer.department.name}</span>
//                   </div>
//                 </div>
                
//                 <div>
//                   <p className="text-sm font-bold text-gray-500 mb-1">Lieu</p>
//                   <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-900/50 px-3 py-2 rounded-lg">
//                     <MapPin size={14} className="text-red-400"/>
//                     <span className="text-sm font-medium text-gray-900 dark:text-white">{candidate.jobOffer.location}</span>
//                   </div>
//                 </div>
                
//                 <div>
//                   <p className="text-sm font-bold text-gray-500 mb-1">Contrat</p>
//                   <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-900/50 px-3 py-2 rounded-lg">
//                     <FileText size={14} className="text-orange-400"/>
//                     <span className="text-sm font-medium text-gray-900 dark:text-white">{candidate.jobOffer.type}</span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* LETTRE DE MOTIVATION */}
//           {candidate.coverLetter && (
//             <div className="glass-panel rounded-3xl p-8 shadow-xl">
//               <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
//                 <MessageSquare size={20} className="text-blue-500"/>
//                 Lettre de motivation
//               </h3>
              
//               <div className="prose prose-gray dark:prose-invert max-w-none">
//                 <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line leading-relaxed">
//                   {candidate.coverLetter}
//                 </p>
//               </div>
//             </div>
//           )}

//           {/* NOTES RH */}
//           <div className="glass-panel rounded-3xl p-8 shadow-xl">
//             <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Notes RH</h3>
//             <textarea 
//               className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4 min-h-[120px] text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
//               placeholder="Ajoutez vos notes sur ce candidat..."
//               defaultValue={candidate.notes || ''}
//             />
//           </div>

//         </motion.div>
//       </div>
//     </div>
//   );
// }


'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Mail, Phone, Calendar, Download, Loader2,
  CheckCircle2, XCircle, FileText, MapPin, Briefcase, MessageSquare, User,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/services/api';
import { ToastProvider, useToast } from '@/components/ui/useToast';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

interface CandidateManual {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  resumeUrl: string;
  additionalDocUrl?: string;
  coverLetter?: string;
  status: string;
  notes?: string;
  interviewDate?: string;
  interviewNotes?: string;
  jobOffer: {
    id: string;
    title: string;
    location: string;
    type: string;
    department: { name: string };
  };
  createdAt: string;
}

// Statuts sélectionnables (simplifiés)
const STATUSES: { value: string; label: string; color: string; icon: React.ElementType }[] = [
  { value: 'APPLIED',   label: 'Nouvelle candidature', color: 'text-blue-600 dark:text-blue-400',   icon: User },
  { value: 'INTERVIEW', label: 'En entretien',         color: 'text-purple-600 dark:text-purple-400', icon: Calendar },
  { value: 'HIRED',     label: 'Embauché(e)',          color: 'text-emerald-600 dark:text-emerald-400', icon: CheckCircle2 },
  { value: 'REJECTED',  label: 'Refusé(e)',            color: 'text-red-500 dark:text-red-400',      icon: XCircle },
];

const getStatusConfig = (status: string) =>
  STATUSES.find((s) => s.value === status) || STATUSES[0];

// Normalise les anciens statuts
const normalizeStatus = (s: string) => {
  if (['APPLIED', 'INTERVIEW', 'HIRED', 'REJECTED'].includes(s)) return s;
  if (s === 'REFUSE') return 'REJECTED';
  return 'APPLIED';
};

// ─────────────────────────────────────────────
// INNER COMPONENT
// ─────────────────────────────────────────────

function DetailCandidatManualContent({ id }: { id: string }) {
  const router = useRouter();
  const toast = useToast();

  const [candidate, setCandidate] = useState<CandidateManual | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Modal entretien
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);

  const fetchCandidate = useCallback(async () => {
    try {
      const data = await api.get<CandidateManual>(`/recruitment/candidates/${id}`);
      setCandidate(data);
      setNotes(data.notes || '');
      if (data.interviewDate) {
        setInterviewDate(new Date(data.interviewDate).toISOString().slice(0, 16));
        setInterviewNotes(data.interviewNotes || '');
      }
    } catch {
      toast.error('Erreur', 'Impossible de charger le candidat');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchCandidate(); }, [fetchCandidate]);

  const handleStatusChange = async (newStatus: string) => {
    // Si on passe en entretien → ouvrir le modal de planification
    if (newStatus === 'INTERVIEW') {
      setShowInterviewModal(true);
      return;
    }
    try {
      await api.patch(`/recruitment/candidates/${id}/status`, { status: newStatus });
      setCandidate((prev) => prev ? { ...prev, status: newStatus } : null);
      const config = getStatusConfig(newStatus);
      toast.success('Statut mis à jour', `Candidat passé en "${config.label}"`);
    } catch {
      toast.error('Erreur', 'Impossible de mettre à jour le statut');
    }
  };

  const handleScheduleInterview = async () => {
    setIsScheduling(true);
    try {
      await api.patch(`/recruitment/candidates/${id}/schedule-interview`, {
        interviewDate: interviewDate || undefined,
        interviewNotes: interviewNotes || undefined,
      });
      toast.success('Entretien planifié !', 'Un email d\'invitation a été envoyé au candidat.');
      setShowInterviewModal(false);
      fetchCandidate();
    } catch (e: any) {
      toast.error('Erreur', e?.message || 'Impossible de planifier l\'entretien');
    } finally {
      setIsScheduling(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!candidate) return;
    setIsSavingNotes(true);
    try {
      await api.patch(`/recruitment/candidates/${id}/status`, {
        status: candidate.status,
        notes,
      });
      toast.success('Notes sauvegardées', 'Les notes RH ont été mises à jour.');
    } catch {
      toast.error('Erreur', 'Impossible de sauvegarder les notes');
    } finally {
      setIsSavingNotes(false);
    }
  };

  // ── LOADING ──
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-500 mx-auto" size={36} />
          <p className="text-slate-500 mt-3 text-sm">Chargement du candidat…</p>
        </div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <XCircle size={48} className="text-red-400 mb-4" />
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Candidat introuvable</h1>
        <Link href="/recrutement/manuel/candidats" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold">
          Retour
        </Link>
      </div>
    );
  }

  const normalizedStatus = normalizeStatus(candidate.status);
  const statusConfig = getStatusConfig(normalizedStatus);
  const StatusIcon = statusConfig.icon;
  const isInInterview = normalizedStatus === 'INTERVIEW';

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">

      {/* ── MODAL ENTRETIEN ── */}
      {showInterviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-900 border border-purple-500/30 rounded-3xl p-8 max-w-md w-full shadow-2xl"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2.5">
              <Calendar className="text-purple-500" size={22} />
              {isInInterview ? 'Modifier l\'entretien' : 'Planifier un entretien'}
            </h3>
            <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">
              Pour <span className="font-medium text-gray-900 dark:text-white">{candidate.firstName} {candidate.lastName}</span>
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-2 block">Date et heure</label>
                <input
                  type="datetime-local"
                  className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/30 outline-none transition-all"
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-2 block">Notes (lieu, modalités…)</label>
                <textarea
                  className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-purple-500/30 resize-none min-h-[80px] transition-all text-sm"
                  placeholder="Ex : Entretien présentiel, bâtiment A…"
                  value={interviewNotes}
                  onChange={(e) => setInterviewNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowInterviewModal(false)}
                className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                Annuler
              </button>
              <button
                onClick={handleScheduleInterview}
                disabled={isScheduling}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-lg"
              >
                {isScheduling ? <Loader2 className="animate-spin" size={18} /> : <Calendar size={18} />}
                Confirmer
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.back()}
          className="p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {candidate.firstName} {candidate.lastName}
            </h1>
            {isInInterview && (
              <div className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center gap-1.5">
                <Calendar size={12} className="text-purple-500" />
                <span className="text-xs font-bold text-purple-500">En entretien</span>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500">
            Postulé le {new Date(candidate.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── SIDEBAR ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-7 shadow-xl text-center sticky top-8">

            {/* Avatar */}
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-lg">
              {candidate.firstName[0]}{candidate.lastName[0]}
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              {candidate.firstName} {candidate.lastName}
            </h2>

            {/* Badge statut */}
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 font-bold text-sm mt-3 mb-5 ${statusConfig.color}`}>
              <StatusIcon size={14} />
              {statusConfig.label}
            </div>

            {/* Entretien planifié */}
            {candidate.interviewDate && (
              <div className="bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30 rounded-xl p-4 mb-5 text-left">
                <p className="text-xs font-bold text-purple-600 dark:text-purple-400 mb-1.5 flex items-center gap-1.5">
                  <Calendar size={11} /> Entretien planifié
                </p>
                <p className="text-sm text-gray-900 dark:text-white font-medium">
                  {new Date(candidate.interviewDate).toLocaleDateString('fr-FR', {
                    weekday: 'short', day: 'numeric', month: 'short',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
                {candidate.interviewNotes && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{candidate.interviewNotes}</p>
                )}
              </div>
            )}

            {/* Changer statut */}
            <div className="mb-5 text-left">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Changer le statut</label>
              <div className="space-y-1.5">
                {STATUSES.map((s) => {
                  const SIcon = s.icon;
                  const isActive = normalizedStatus === s.value;
                  return (
                    <button
                      key={s.value}
                      onClick={() => handleStatusChange(s.value)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                        isActive
                          ? 'bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 font-bold'
                          : 'bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800'
                      } ${s.color}`}
                    >
                      <SIcon size={14} className="shrink-0" />
                      <span>{s.label}</span>
                      {isActive && (
                        <CheckCircle2 size={13} className="ml-auto shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-3 mb-6 text-left">
              <a href={`mailto:${candidate.email}`} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500 transition-colors">
                <Mail size={14} className="text-gray-400 shrink-0" />
                <span className="break-all">{candidate.email}</span>
              </a>
              <a href={`tel:${candidate.phone}`} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500 transition-colors">
                <Phone size={14} className="text-gray-400 shrink-0" />
                <span>{candidate.phone}</span>
              </a>
            </div>

            {/* Bouton entretien */}
            <button
              onClick={() => setShowInterviewModal(true)}
              className="w-full py-3 mb-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              <Calendar size={16} />
              {isInInterview ? 'Modifier l\'entretien' : 'Planifier un entretien'}
            </button>

            {/* ── Documents téléchargeables ── */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Documents</p>

              {/* CV */}
              <a
                href={candidate.resumeUrl.replace('/raw/upload/', '/raw/upload/fl_attachment/')}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-md"
              >
                <Download size={16} /> Télécharger le CV
              </a>

              {/* Document additionnel */}
              {candidate.additionalDocUrl && (
                <a
                  href={candidate.additionalDocUrl.replace('/raw/upload/', '/raw/upload/fl_attachment/')}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md shadow-amber-500/20"
                >
                  <Download size={16} /> Télécharger le document joint
                </a>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── MAIN ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 space-y-6">

          {/* Poste */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-7 shadow-xl">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Briefcase size={18} className="text-blue-500" /> Poste visé
            </h3>
            <p className="text-xl font-bold text-gray-900 dark:text-white mb-4">{candidate.jobOffer.title}</p>
            <div className="flex flex-wrap gap-2.5">
              <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                <Briefcase size={13} className="text-purple-400" /> {candidate.jobOffer.department.name}
              </span>
              <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                <MapPin size={13} className="text-red-400" /> {candidate.jobOffer.location}
              </span>
              <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                <FileText size={13} className="text-orange-400" /> {candidate.jobOffer.type}
              </span>
            </div>
          </div>

          {/* Lettre de motivation */}
          {candidate.coverLetter && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-7 shadow-xl">
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <MessageSquare size={18} className="text-blue-500" /> Lettre de motivation
              </h3>
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line leading-relaxed text-sm">
                {candidate.coverLetter}
              </p>
            </div>
          )}

          {/* Notes RH */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-7 shadow-xl">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MessageSquare size={18} className="text-blue-500" /> Notes RH
            </h3>
            <textarea
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 min-h-[120px] text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 resize-none transition-all text-sm placeholder:text-gray-400"
              placeholder="Ajoutez vos observations sur ce candidat…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <button
              onClick={handleSaveNotes}
              disabled={isSavingNotes}
              className="mt-3 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 text-sm shadow-md"
            >
              {isSavingNotes ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
              Sauvegarder les notes
            </button>
          </div>

        </motion.div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// EXPORT — ToastProvider local à cette page
// ─────────────────────────────────────────────

export default function DetailCandidatManualPage({ params }: { params: { id: string } }) {
  return (
    <ToastProvider>
      <DetailCandidatManualContent id={params.id} />
    </ToastProvider>
  );
}