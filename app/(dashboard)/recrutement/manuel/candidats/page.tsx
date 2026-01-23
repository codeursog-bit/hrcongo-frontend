'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Loader2, User, Briefcase, CheckCircle2, XCircle, 
  Clock, AlertTriangle, Eye, FileText, LucideIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/services/api';

type ManualColumnId = 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'OFFER' | 'HIRED' | 'REJECTED';

interface JobOffer {
  id: string;
  title: string;
  processingMode: 'MANUAL';
}

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: ManualColumnId;
  jobOffer?: JobOffer;
  createdAt: string;
}

interface JobOfferWithCount extends JobOffer {
  _count: { candidates: number };
}

interface ColumnConfig {
  id: ManualColumnId;
  title: string;
  color: string;
  icon: LucideIcon;
}

const MANUAL_COLUMNS: ColumnConfig[] = [
  { id: 'APPLIED', title: 'Nouvelles', color: 'border-blue-500 bg-blue-500/5', icon: User },
  { id: 'SCREENING', title: 'Qualifiés', color: 'border-purple-500 bg-purple-500/5', icon: CheckCircle2 },
  { id: 'INTERVIEW', title: 'Entretiens', color: 'border-orange-500 bg-orange-500/5', icon: Briefcase },
  { id: 'OFFER', title: 'Offre', color: 'border-cyan-500 bg-cyan-500/5', icon: FileText },
  { id: 'HIRED', title: 'Embauché', color: 'border-emerald-500 bg-emerald-500/5', icon: CheckCircle2 },
  { id: 'REJECTED', title: 'Refusé', color: 'border-red-500 bg-red-500/5', icon: XCircle },
];

export default function KanbanManualPage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<JobOfferWithCount[]>([]);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [candidatesData, jobsData] = await Promise.all([
        api.get<Candidate[]>('/recruitment/candidates'),
        api.get<JobOfferWithCount[]>('/recruitment/jobs')
      ]);
      
      // Filtrer uniquement les candidats manuels
      const manualCandidates = candidatesData.filter(c => 
        c.jobOffer?.processingMode === 'MANUAL'
      );
      
      setCandidates(manualCandidates);
      
      // Filtrer uniquement les jobs manuels
      const manualJobs = jobsData.filter(j => j.processingMode === 'MANUAL');
      setJobs(manualJobs);
      
      if (manualJobs.length > 0 && !selectedJob) {
        setSelectedJob(manualJobs[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCandidates = selectedJob 
    ? candidates.filter(c => c.jobOffer?.id === selectedJob)
    : candidates;

  const getManualColumnData = (colId: ManualColumnId) => 
    filteredCandidates.filter(c => c.status === colId);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin text-blue-500" size={40}/>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 px-4 md:px-0">
        <div className="flex items-center gap-4">
          <Link href="/recrutement" className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors">
            <ArrowLeft size={20}/>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pipeline Recrutement Manuel</h1>
            </div>
            <p className="text-sm text-gray-500">
              Gestion classique des candidatures
            </p>
          </div>
        </div>

        {/* Sélecteur d'offre */}
        <select
          value={selectedJob || ''}
          onChange={(e) => setSelectedJob(e.target.value)}
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 outline-none"
        >
          <option value="">Toutes les offres</option>
          {jobs.map(job => (
            <option key={job.id} value={job.id}>
              {job.title} ({job._count.candidates})
            </option>
          ))}
        </select>
      </div>

      {/* KANBAN BOARD */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <div className="flex gap-6 h-full px-4 md:px-0 min-w-[1600px]">
          
          {MANUAL_COLUMNS.map((col) => {
            const colData = getManualColumnData(col.id);
            const Icon = col.icon;
            
            return (
              <div key={col.id} className="flex-1 flex flex-col min-w-[280px]">
                <div className={`flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-t-xl border-t-4 ${col.color} border-x border-b shadow-sm mb-3`}>
                  <div className="flex items-center gap-2">
                    <Icon size={18} className="text-gray-600 dark:text-gray-400"/>
                    <h3 className="font-bold text-gray-900 dark:text-white">{col.title}</h3>
                  </div>
                  <span className="bg-gray-100 dark:bg-gray-700 text-xs px-2 py-0.5 rounded-full font-bold">
                    {colData.length}
                  </span>
                </div>
                
                <div className="flex-1 bg-gray-100/50 dark:bg-gray-900/50 rounded-xl p-2 overflow-y-auto space-y-3">
                  {colData.map((c) => (
                    <motion.div 
                      key={c.id} 
                      layoutId={c.id}
                      onClick={() => router.push(`/recrutement/manuel/candidats/${c.id}`)}
                      className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm cursor-pointer hover:shadow-md hover:border-blue-500/50 transition-all"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-xs text-white">
                          {c.firstName[0]}{c.lastName[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                            {c.firstName} {c.lastName}
                          </h4>
                          <p className="text-xs text-gray-500 truncate">{c.jobOffer?.title}</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-3">
                        <div className="text-[10px] text-gray-400 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded">
                          {new Date(c.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </div>
                        <Eye size={14} className="text-gray-400"/>
                      </div>
                    </motion.div>
                  ))}
                  
                  {colData.length === 0 && (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-gray-400 text-sm italic">Aucun candidat</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

        </div>
      </div>

    </div>
  );
}
// 'use client';

// import React, { useState, useEffect } from 'react';
// import Link from 'next/link';
// import { useRouter } from 'next/navigation';
// import { 
//   ArrowLeft, Loader2, User, Briefcase, CheckCircle2, XCircle, 
//   Clock, AlertTriangle, Eye, FileText
// } from 'lucide-react';
// import { motion } from 'framer-motion';
// import { api } from '@/services/api';

// type ManualColumnId = 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'OFFER' | 'HIRED' | 'REJECTED';

// interface Candidate {
//   id: string;
//   firstName: string;
//   lastName: string;
//   email: string;
//   status: ManualColumnId;
//   jobOffer?: { 
//     title: string;
//     processingMode: 'MANUAL';
//   };
//   createdAt: string;
// }

// interface JobOffer {
//   id: string;
//   title: string;
//   processingMode: 'MANUAL';
//   _count: { candidates: number };
// }

// const MANUAL_COLUMNS: { id: ManualColumnId; title: string; color: string; icon: any }[] = [
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
//   const [jobs, setJobs] = useState<JobOffer[]>([]);
//   const [selectedJob, setSelectedJob] = useState<string | null>(null);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     fetchData();
//   }, []);

//   const fetchData = async () => {
//     try {
//       const [candidatesData, jobsData] = await Promise.all([
//         api.get<Candidate[]>('/recruitment/candidates'),
//         api.get<JobOffer[]>('/recruitment/jobs')
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