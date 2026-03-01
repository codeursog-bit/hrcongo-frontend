// 'use client';

// import React, { useState, useEffect } from 'react';
// import Link from 'next/link';
// import { useRouter } from 'next/navigation';
// import { 
//   ArrowLeft, Loader2, User, Briefcase, CheckCircle2, XCircle, 
//   Clock, AlertTriangle, Eye, FileText, LucideIcon
// } from 'lucide-react';
// import { motion } from 'framer-motion';
// import { api } from '@/services/api';

// type ManualColumnId = 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'OFFER' | 'HIRED' | 'REJECTED';

// interface JobOffer {
//   id: string;
//   title: string;
//   processingMode: 'MANUAL';
// }

// interface Candidate {
//   id: string;
//   firstName: string;
//   lastName: string;
//   email: string;
//   status: ManualColumnId;
//   jobOffer?: JobOffer;
//   createdAt: string;
// }

// interface JobOfferWithCount extends JobOffer {
//   _count: { candidates: number };
// }

// interface ColumnConfig {
//   id: ManualColumnId;
//   title: string;
//   color: string;
//   icon: LucideIcon;
// }

// const MANUAL_COLUMNS: ColumnConfig[] = [
//   { id: 'APPLIED', title: 'Nouvelles', color: 'border-blue-500 bg-blue-500/5', icon: User },
//   { id: 'SCREENING', title: 'Qualifiés', color: 'border-purple-500 bg-purple-500/5', icon: CheckCircle2 },
//   { id: 'INTERVIEW', title: 'Entretiens', color: 'border-orange-500 bg-orange-500/5', icon: Briefcase },
//   { id: 'OFFER', title: 'Offre', color: 'border-cyan-500 bg-cyan-500/5', icon: FileText },
//   { id: 'HIRED', title: 'Embauché', color: 'border-emerald-500 bg-emerald-500/5', icon: CheckCircle2 },
//   { id: 'REJECTED', title: 'Refusé', color: 'border-red-500 bg-red-500/5', icon: XCircle },
// ];

// export default function KanbanManualPage() {
//   const router = useRouter();
//   const [candidates, setCandidates] = useState<Candidate[]>([]);
//   const [jobs, setJobs] = useState<JobOfferWithCount[]>([]);
//   const [selectedJob, setSelectedJob] = useState<string | null>(null);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     fetchData();
//   }, []);

//   const fetchData = async () => {
//     try {
//       const [candidatesData, jobsData] = await Promise.all([
//         api.get<Candidate[]>('/recruitment/candidates'),
//         api.get<JobOfferWithCount[]>('/recruitment/jobs')
//       ]);
      
//       // Filtrer uniquement les candidats manuels
//       const manualCandidates = candidatesData.filter(c => 
//         c.jobOffer?.processingMode === 'MANUAL'
//       );
      
//       setCandidates(manualCandidates);
      
//       // Filtrer uniquement les jobs manuels
//       const manualJobs = jobsData.filter(j => j.processingMode === 'MANUAL');
//       setJobs(manualJobs);
      
//       if (manualJobs.length > 0 && !selectedJob) {
//         setSelectedJob(manualJobs[0].id);
//       }
//     } catch (e) {
//       console.error(e);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const filteredCandidates = selectedJob 
//     ? candidates.filter(c => c.jobOffer?.id === selectedJob)
//     : candidates;

//   const getManualColumnData = (colId: ManualColumnId) => 
//     filteredCandidates.filter(c => c.status === colId);

//   if (isLoading) {
//     return (
//       <div className="flex justify-center items-center min-h-screen">
//         <Loader2 className="animate-spin text-blue-500" size={40}/>
//       </div>
//     );
//   }

//   return (
//     <div className="h-[calc(100vh-100px)] flex flex-col">
      
//       {/* HEADER */}
//       <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 px-4 md:px-0">
//         <div className="flex items-center gap-4">
//           <Link href="/recrutement" className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors">
//             <ArrowLeft size={20}/>
//           </Link>
//           <div>
//             <div className="flex items-center gap-3 mb-1">
//               <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pipeline Recrutement Manuel</h1>
//             </div>
//             <p className="text-sm text-gray-500">
//               Gestion classique des candidatures
//             </p>
//           </div>
//         </div>

//         {/* Sélecteur d'offre */}
//         <select
//           value={selectedJob || ''}
//           onChange={(e) => setSelectedJob(e.target.value)}
//           className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 outline-none"
//         >
//           <option value="">Toutes les offres</option>
//           {jobs.map(job => (
//             <option key={job.id} value={job.id}>
//               {job.title} ({job._count.candidates})
//             </option>
//           ))}
//         </select>
//       </div>

//       {/* KANBAN BOARD */}
//       <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
//         <div className="flex gap-6 h-full px-4 md:px-0 min-w-[1600px]">
          
//           {MANUAL_COLUMNS.map((col) => {
//             const colData = getManualColumnData(col.id);
//             const Icon = col.icon;
            
//             return (
//               <div key={col.id} className="flex-1 flex flex-col min-w-[280px]">
//                 <div className={`flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-t-xl border-t-4 ${col.color} border-x border-b shadow-sm mb-3`}>
//                   <div className="flex items-center gap-2">
//                     <Icon size={18} className="text-gray-600 dark:text-gray-400"/>
//                     <h3 className="font-bold text-gray-900 dark:text-white">{col.title}</h3>
//                   </div>
//                   <span className="bg-gray-100 dark:bg-gray-700 text-xs px-2 py-0.5 rounded-full font-bold">
//                     {colData.length}
//                   </span>
//                 </div>
                
//                 <div className="flex-1 bg-gray-100/50 dark:bg-gray-900/50 rounded-xl p-2 overflow-y-auto space-y-3">
//                   {colData.map((c) => (
//                     <motion.div 
//                       key={c.id} 
//                       layoutId={c.id}
//                       onClick={() => router.push(`/recrutement/manuel/candidats/${c.id}`)}
//                       className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm cursor-pointer hover:shadow-md hover:border-blue-500/50 transition-all"
//                     >
//                       <div className="flex items-center gap-3 mb-2">
//                         <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-xs text-white">
//                           {c.firstName[0]}{c.lastName[0]}
//                         </div>
//                         <div className="flex-1 min-w-0">
//                           <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">
//                             {c.firstName} {c.lastName}
//                           </h4>
//                           <p className="text-xs text-gray-500 truncate">{c.jobOffer?.title}</p>
//                         </div>
//                       </div>
//                       <div className="flex justify-between items-center mt-3">
//                         <div className="text-[10px] text-gray-400 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded">
//                           {new Date(c.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
//                         </div>
//                         <Eye size={14} className="text-gray-400"/>
//                       </div>
//                     </motion.div>
//                   ))}
                  
//                   {colData.length === 0 && (
//                     <div className="h-full flex items-center justify-center">
//                       <p className="text-gray-400 text-sm italic">Aucun candidat</p>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             );
//           })}

//         </div>
//       </div>

//     </div>
//   );
// }


'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Loader2, User, Briefcase,
  CheckCircle2, XCircle, Eye, Calendar,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';
import { ToastProvider, useToast } from '@/components/ui/useToast';
import { JobFilterSelect } from '@/components/JobFilterSelect';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

type ManualColumnId = 'APPLIED' | 'INTERVIEW' | 'HIRED' | 'REJECTED';

interface JobOffer {
  id: string;
  title: string;
  processingMode: string;
}

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  jobOffer?: {
    id: string;
    title: string;
    processingMode: string;
  };
  createdAt: string;
}

// ─────────────────────────────────────────────
// CONFIG COLONNES (4 colonnes simplifiées)
// ─────────────────────────────────────────────

const MANUAL_COLUMNS: {
  id: ManualColumnId;
  title: string;
  borderTop: string;
  headerBg: string;
  countBg: string;
  icon: React.ElementType;
  emptyMsg: string;
}[] = [
  {
    id: 'APPLIED',
    title: 'Nouvelles candidatures',
    borderTop: 'border-t-blue-500',
    headerBg: 'bg-blue-50 dark:bg-blue-500/5',
    countBg: 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400',
    icon: User,
    emptyMsg: 'Aucune nouvelle candidature',
  },
  {
    id: 'INTERVIEW',
    title: 'En entretien',
    borderTop: 'border-t-purple-500',
    headerBg: 'bg-purple-50 dark:bg-purple-500/5',
    countBg: 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400',
    icon: Briefcase,
    emptyMsg: 'Aucun entretien planifié',
  },
  {
    id: 'HIRED',
    title: 'Embauchés',
    borderTop: 'border-t-emerald-500',
    headerBg: 'bg-emerald-50 dark:bg-emerald-500/5',
    countBg: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    icon: CheckCircle2,
    emptyMsg: 'Aucune embauche',
  },
  {
    id: 'REJECTED',
    title: 'Refusés',
    borderTop: 'border-t-red-500',
    headerBg: 'bg-red-50 dark:bg-red-500/5',
    countBg: 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400',
    icon: XCircle,
    emptyMsg: 'Aucun refus',
  },
];

// Normalise les anciens statuts vers les 4 colonnes simplifiées
const normalizeStatus = (status: string): ManualColumnId => {
  if (status === 'HIRED') return 'HIRED';
  if (status === 'REJECTED' || status === 'REFUSE') return 'REJECTED';
  if (status === 'INTERVIEW') return 'INTERVIEW';
  return 'APPLIED'; // APPLIED, SCREENING, OFFER, EN_ATTENTE_ANALYSE, etc.
};

// ─────────────────────────────────────────────
// INNER COMPONENT
// ─────────────────────────────────────────────

function KanbanManualContent() {
  const router = useRouter();
  const toast = useToast();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<JobOffer[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [candidatesData, jobsData] = await Promise.all([
        api.get<Candidate[]>('/recruitment/candidates'),
        api.get<JobOffer[]>('/recruitment/jobs'),
      ]);
      setCandidates(candidatesData.filter((c) => c.jobOffer?.processingMode === 'MANUAL'));
      setJobs(jobsData.filter((j) => j.processingMode === 'MANUAL'));
    } catch {
      toast.error('Erreur de chargement', 'Impossible de récupérer les candidats.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtre correct sur jobOffer.id
  const filteredCandidates = selectedJobId
    ? candidates.filter((c) => c.jobOffer?.id === selectedJobId)
    : candidates;

  const getColumnData = (colId: ManualColumnId) =>
    filteredCandidates.filter((c) => normalizeStatus(c.status) === colId);

  // Options pour JobFilterSelect
  const jobOptions = jobs.map((j) => ({
    id: j.id,
    title: j.title,
    count: candidates.filter((c) => c.jobOffer?.id === j.id).length,
  }));

  // ── LOADING ──
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-500 mx-auto" size={40} />
          <p className="text-slate-500 mt-3 text-sm">Chargement du pipeline...</p>
        </div>
      </div>
    );
  }

  // ── EMPTY GLOBAL ──
  if (candidates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 border border-blue-500/20">
          <User size={32} className="text-blue-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Aucune candidature manuelle</h2>
        <p className="text-gray-500 mb-6 text-sm">Publiez des offres en mode Manuel pour recevoir des candidatures ici.</p>
        <Link
          href="/recrutement"
          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2 text-sm"
        >
          <ArrowLeft size={16} /> Retour
        </Link>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 px-1">
        <div className="flex items-center gap-3">
          <Link
            href="/recrutement"
            className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Pipeline Manuel</h1>
            <p className="text-xs text-gray-500">
              {selectedJobId
                ? `${filteredCandidates.length} candidat(s) sur cette offre`
                : `${filteredCandidates.length} candidat(s) — toutes les offres`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Sélecteur moderne */}
          <JobFilterSelect
            jobs={jobOptions}
            value={selectedJobId}
            onChange={setSelectedJobId}
            totalCount={candidates.length}
            theme="light"
          />

          <Link
            href="/recrutement/entretiens"
            className="px-3 py-2.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-600 dark:text-purple-400 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
          >
            <Calendar size={14} /> Entretiens
          </Link>
        </div>
      </div>

      {/* BOARD */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <div className="flex gap-4 h-full min-w-[880px]">
          {MANUAL_COLUMNS.map((col) => {
            const colData = getColumnData(col.id);
            const Icon = col.icon;

            return (
              <div key={col.id} className="flex-1 flex flex-col min-w-[210px]">

                {/* En-tête colonne */}
                <div className={`
                  flex items-center justify-between px-4 py-3 mb-2
                  ${col.headerBg} rounded-t-2xl border-t-[3px] ${col.borderTop}
                  border-x border-b border-gray-200 dark:border-gray-700/50
                `}>
                  <div className="flex items-center gap-2">
                    <Icon size={15} className="text-gray-500 dark:text-gray-400 shrink-0" />
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white leading-tight">{col.title}</h3>
                  </div>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${col.countBg}`}>
                    {colData.length}
                  </span>
                </div>

                {/* Cartes */}
                <div className="flex-1 bg-gray-50/80 dark:bg-gray-900/40 rounded-b-2xl px-2 pt-2 pb-3 overflow-y-auto space-y-2 border border-t-0 border-gray-200 dark:border-gray-700/50">
                  <AnimatePresence mode="popLayout">
                    {colData.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center h-28 text-center py-6"
                      >
                        <Icon size={22} className="text-gray-200 dark:text-gray-700 mb-2" />
                        <p className="text-xs text-gray-400 dark:text-gray-600 italic">{col.emptyMsg}</p>
                        {selectedJobId && (
                          <p className="text-[10px] text-gray-300 dark:text-gray-700 mt-1">pour cette offre</p>
                        )}
                      </motion.div>
                    ) : (
                      colData.map((c) => (
                        <motion.div
                          key={c.id}
                          layout
                          initial={{ opacity: 0, scale: 0.97 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          onClick={() => router.push(`/recrutement/manuel/candidats/${c.id}`)}
                          className="bg-white dark:bg-gray-800 px-3 py-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm cursor-pointer hover:shadow-md hover:border-blue-400/60 dark:hover:border-blue-500/40 transition-all group"
                        >
                          <div className="flex items-center gap-2.5 mb-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-xs text-white shrink-0">
                              {c.firstName[0]}{c.lastName[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {c.firstName} {c.lastName}
                              </h4>
                              <p className="text-[11px] text-gray-400 truncate">{c.jobOffer?.title}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md">
                              {new Date(c.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                            </span>
                            <Eye size={13} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                          </div>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// EXPORT — ToastProvider local à cette page
// ─────────────────────────────────────────────

export default function KanbanManualPage() {
  return (
    <ToastProvider>
      <KanbanManualContent />
    </ToastProvider>
  );
}