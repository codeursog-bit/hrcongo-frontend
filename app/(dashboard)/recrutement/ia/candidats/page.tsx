
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BrainCircuit, Award, TrendingUp, Clock, XCircle, Zap, 
  ArrowLeft, Loader2, AlertTriangle, Eye, Target, BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';
import Link from 'next/link';

type AIColumnId = 'RETENU' | 'MOYENNE' | 'SECONDE_CHANCE' | 'REFUS';

interface JobOffer {
  id: string;
  title: string;
  processingMode: 'AI_ASSISTED';
}

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  aiSuggestion: AIColumnId;
  hrDecision?: AIColumnId;
  totalScore: number;
  cvScore: number;
  testScore: number;
  tabSwitchCount?: number;
  jobOffer: JobOffer;
  createdAt: string;
}

interface JobOfferWithCount extends JobOffer {
  _count: { candidates: number };
}

const AI_COLUMNS = [
  { 
    id: 'RETENU' as AIColumnId, 
    title: 'Retenus', 
    gradient: 'from-emerald-500/20 via-emerald-600/10 to-transparent',
    border: 'border-emerald-500/50',
    icon: Award,
    glow: 'shadow-emerald-500/20',
    description: '≥ 75/100'
  },
  { 
    id: 'MOYENNE' as AIColumnId, 
    title: 'Profils Moyens', 
    gradient: 'from-orange-500/20 via-orange-600/10 to-transparent',
    border: 'border-orange-500/50',
    icon: TrendingUp,
    glow: 'shadow-orange-500/20',
    description: '55-74/100'
  },
  { 
    id: 'SECONDE_CHANCE' as AIColumnId, 
    title: 'Seconde Chance', 
    gradient: 'from-purple-500/20 via-purple-600/10 to-transparent',
    border: 'border-purple-500/50',
    icon: Clock,
    glow: 'shadow-purple-500/20',
    description: '40-54/100'
  },
  { 
    id: 'REFUS' as AIColumnId, 
    title: 'Non Retenus', 
    gradient: 'from-red-500/20 via-red-600/10 to-transparent',
    border: 'border-red-500/50',
    icon: XCircle,
    glow: 'shadow-red-500/20',
    description: '< 40/100'
  },
];

export default function KanbanIAPage() {
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
      
      // Filtrer uniquement les candidats IA
      const aiCandidates = candidatesData.filter(c => 
        c.jobOffer?.processingMode === 'AI_ASSISTED' && c.aiSuggestion
      );
      
      setCandidates(aiCandidates);
      
      // Filtrer uniquement les jobs IA
      const aiJobs = jobsData.filter(j => j.processingMode === 'AI_ASSISTED');
      setJobs(aiJobs);
      
      if (aiJobs.length > 0 && !selectedJob) {
        setSelectedJob(aiJobs[0].id);
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

  const getColumnData = (colId: AIColumnId) => 
    filteredCandidates.filter(c => c.aiSuggestion === colId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-cyan-500 blur-2xl opacity-20 animate-pulse"></div>
            <Loader2 className="animate-spin text-cyan-500 relative z-10" size={48}/>
          </div>
          <p className="text-slate-400 mt-6 font-medium">Chargement du pipeline IA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 p-6">
        
        {/* HEADER */}
        <div className="max-w-[1800px] mx-auto mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.push('/recrutement')} 
                className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all backdrop-blur-sm"
              >
                <ArrowLeft size={20} className="text-white"/>
              </button>
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <h1 className="text-3xl font-black text-white tracking-tight">Pipeline Recrutement IA</h1>
                  <div className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center gap-2">
                    <BrainCircuit size={16} className="text-cyan-400"/>
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Intelligence Artificielle</span>
                  </div>
                </div>
                <p className="text-slate-400">Candidats analysés et classés automatiquement par score</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedJob || ''}
                onChange={(e) => setSelectedJob(e.target.value)}
                className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-medium focus:ring-2 focus:ring-cyan-500/30 outline-none backdrop-blur-sm"
              >
                <option value="">Toutes les offres</option>
                {jobs.map(job => (
                  <option key={job.id} value={job.id} className="bg-slate-900">
                    {job.title} ({job._count.candidates})
                  </option>
                ))}
              </select>

              <Link 
                href="/recrutement/ia/analytics"
                className="px-5 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg"
              >
                <BarChart3 size={18}/> Statistiques
              </Link>
            </div>
          </div>
        </div>

        {/* KANBAN */}
        <div className="max-w-[1800px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            
            {AI_COLUMNS.map((col) => {
              const colData = getColumnData(col.id);
              const Icon = col.icon;
              
              return (
                <motion.div 
                  key={col.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: AI_COLUMNS.indexOf(col) * 0.1 }}
                  className="flex flex-col h-[calc(100vh-200px)]"
                >
                  {/* Column Header */}
                  <div className={`bg-gradient-to-br ${col.gradient} backdrop-blur-xl border-2 ${col.border} rounded-2xl p-5 mb-4 ${col.glow} shadow-2xl`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg">
                          <Icon size={20} className="text-white"/>
                        </div>
                        <h3 className="font-black text-white text-lg">{col.title}</h3>
                      </div>
                      <div className="px-3 py-1 bg-black/30 rounded-full border border-white/10">
                        <span className="text-sm font-bold text-white">{colData.length}</span>
                      </div>
                    </div>
                    <p className="text-xs text-white/70 font-bold uppercase tracking-wider">{col.description}</p>
                  </div>
                  
                  {/* Cards */}
                  <div className="flex-1 bg-white/5 backdrop-blur-sm rounded-2xl p-3 overflow-y-auto border border-white/10 space-y-3">
                    <AnimatePresence mode="popLayout">
                      {colData.map((c) => {
                        const hasOverride = c.hrDecision && c.hrDecision !== c.aiSuggestion;
                        
                        return (
                          <motion.div 
                            key={c.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            onClick={() => router.push(`/recrutement/ia/candidats/${c.id}`)}
                            className={`bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border rounded-2xl p-5 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-xl group ${
                              hasOverride 
                                ? 'border-yellow-500/50 shadow-yellow-500/20' 
                                : 'border-white/10 hover:border-cyan-500/50'
                            }`}
                          >
                            {/* Avatar + Name */}
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg group-hover:shadow-cyan-500/50 transition-shadow">
                                {c.firstName[0]}{c.lastName[0]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-white truncate group-hover:text-cyan-400 transition-colors">
                                  {c.firstName} {c.lastName}
                                </h4>
                                <p className="text-xs text-slate-400 truncate">{c.jobOffer?.title}</p>
                              </div>
                            </div>

                            {/* Scores */}
                            <div className="grid grid-cols-3 gap-2 mb-4">
                              <div className="bg-black/40 p-2 rounded-lg text-center border border-white/5">
                                <p className="text-[9px] text-slate-500 uppercase font-bold mb-1">CV</p>
                                <p className="text-sm font-bold text-white">{c.cvScore || 0}<span className="text-slate-600">/35</span></p>
                              </div>
                              <div className="bg-black/40 p-2 rounded-lg text-center border border-white/5">
                                <p className="text-[9px] text-slate-500 uppercase font-bold mb-1">Test</p>
                                <p className="text-sm font-bold text-white">{c.testScore || 0}<span className="text-slate-600">/65</span></p>
                              </div>
                              <div className="bg-gradient-to-br from-cyan-500/20 to-blue-600/20 p-2 rounded-lg text-center border border-cyan-500/30">
                                <p className="text-[9px] text-cyan-400 uppercase font-bold mb-1">Total</p>
                                <p className="text-sm font-bold text-cyan-400">{c.totalScore || 0}<span className="text-cyan-600">/100</span></p>
                              </div>
                            </div>

                            {/* Flags */}
                            <div className="flex items-center justify-between text-xs">
                              {hasOverride && (
                                <div className="flex items-center gap-1 text-yellow-400">
                                  <AlertTriangle size={12}/>
                                  <span className="font-bold">Décision RH</span>
                                </div>
                              )}
                              
                              {c.tabSwitchCount && c.tabSwitchCount > 0 && (
                                <div className="flex items-center gap-1 text-orange-400">
                                  <Target size={12}/>
                                  <span className="font-bold">{c.tabSwitchCount} switches</span>
                                </div>
                              )}
                              
                              <div className="ml-auto text-slate-500 group-hover:text-cyan-400 transition-colors">
                                <Eye size={14}/>
                              </div>
                            </div>

                            {/* Date */}
                            <div className="mt-3 pt-3 border-t border-white/5">
                              <p className="text-[10px] text-slate-500 flex items-center gap-2">
                                <Zap size={10} className="text-cyan-500"/>
                                {new Date(c.createdAt).toLocaleDateString('fr-FR', { 
                                  day: 'numeric', 
                                  month: 'short', 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                    
                    {colData.length === 0 && (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-slate-600 text-sm italic">Aucun candidat</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}

          </div>
        </div>

      </div>
    </div>
  );
}
// 'use client';

// import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { 
//   BrainCircuit, Award, TrendingUp, Clock, XCircle, Zap, 
//   ArrowLeft, Loader2, AlertTriangle, Eye, Target, BarChart3
// } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { api } from '@/services/api';
// import Link from 'next/link';

// type AIColumnId = 'RETENU' | 'MOYENNE' | 'SECONDE_CHANCE' | 'REFUS';

// interface Candidate {
//   id: string;
//   firstName: string;
//   lastName: string;
//   aiSuggestion: AIColumnId;
//   hrDecision?: AIColumnId;
//   totalScore: number;
//   cvScore: number;
//   testScore: number;
//   tabSwitchCount?: number;
//   jobOffer: { 
//     title: string;
//     processingMode: 'AI_ASSISTED';
//   };
//   createdAt: string;
// }

// interface JobOffer {
//   id: string;
//   title: string;
//   processingMode: 'AI_ASSISTED';
//   _count: { candidates: number };
// }

// const AI_COLUMNS = [
//   { 
//     id: 'RETENU' as AIColumnId, 
//     title: 'Retenus', 
//     gradient: 'from-emerald-500/20 via-emerald-600/10 to-transparent',
//     border: 'border-emerald-500/50',
//     icon: Award,
//     glow: 'shadow-emerald-500/20',
//     description: '≥ 75/100'
//   },
//   { 
//     id: 'MOYENNE' as AIColumnId, 
//     title: 'Profils Moyens', 
//     gradient: 'from-orange-500/20 via-orange-600/10 to-transparent',
//     border: 'border-orange-500/50',
//     icon: TrendingUp,
//     glow: 'shadow-orange-500/20',
//     description: '55-74/100'
//   },
//   { 
//     id: 'SECONDE_CHANCE' as AIColumnId, 
//     title: 'Seconde Chance', 
//     gradient: 'from-purple-500/20 via-purple-600/10 to-transparent',
//     border: 'border-purple-500/50',
//     icon: Clock,
//     glow: 'shadow-purple-500/20',
//     description: '40-54/100'
//   },
//   { 
//     id: 'REFUS' as AIColumnId, 
//     title: 'Non Retenus', 
//     gradient: 'from-red-500/20 via-red-600/10 to-transparent',
//     border: 'border-red-500/50',
//     icon: XCircle,
//     glow: 'shadow-red-500/20',
//     description: '< 40/100'
//   },
// ];

// export default function KanbanIAPage() {
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
      
//       // Filtrer uniquement les candidats IA
//       const aiCandidates = candidatesData.filter(c => 
//         c.jobOffer?.processingMode === 'AI_ASSISTED' && c.aiSuggestion
//       );
      
//       setCandidates(aiCandidates);
      
//       // Filtrer uniquement les jobs IA
//       const aiJobs = jobsData.filter(j => j.processingMode === 'AI_ASSISTED');
//       setJobs(aiJobs);
      
//       if (aiJobs.length > 0 && !selectedJob) {
//         setSelectedJob(aiJobs[0].id);
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

//   const getColumnData = (colId: AIColumnId) => 
//     filteredCandidates.filter(c => c.aiSuggestion === colId);

//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
//         <div className="text-center">
//           <div className="relative">
//             <div className="absolute inset-0 bg-cyan-500 blur-2xl opacity-20 animate-pulse"></div>
//             <Loader2 className="animate-spin text-cyan-500 relative z-10" size={48}/>
//           </div>
//           <p className="text-slate-400 mt-6 font-medium">Chargement du pipeline IA...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      
//       {/* Animated Background */}
//       <div className="fixed inset-0 pointer-events-none overflow-hidden">
//         <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
//         <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
//         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
//       </div>

//       <div className="relative z-10 p-6">
        
//         {/* HEADER */}
//         <div className="max-w-[1800px] mx-auto mb-8">
//           <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
//             <div className="flex items-center gap-4">
//               <button 
//                 onClick={() => router.push('/recrutement')} 
//                 className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all backdrop-blur-sm"
//               >
//                 <ArrowLeft size={20} className="text-white"/>
//               </button>
//               <div>
//                 <div className="flex items-center gap-4 mb-2">
//                   <h1 className="text-3xl font-black text-white tracking-tight">Pipeline Recrutement IA</h1>
//                   <div className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center gap-2">
//                     <BrainCircuit size={16} className="text-cyan-400"/>
//                     <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Intelligence Artificielle</span>
//                   </div>
//                 </div>
//                 <p className="text-slate-400">Candidats analysés et classés automatiquement par score</p>
//               </div>
//             </div>

//             <div className="flex items-center gap-3">
//               <select
//                 value={selectedJob || ''}
//                 onChange={(e) => setSelectedJob(e.target.value)}
//                 className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-medium focus:ring-2 focus:ring-cyan-500/30 outline-none backdrop-blur-sm"
//               >
//                 <option value="">Toutes les offres</option>
//                 {jobs.map(job => (
//                   <option key={job.id} value={job.id} className="bg-slate-900">
//                     {job.title} ({job._count.candidates})
//                   </option>
//                 ))}
//               </select>

//               <Link 
//                 href="/recrutement/ia/analytics"
//                 className="px-5 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg"
//               >
//                 <BarChart3 size={18}/> Statistiques
//               </Link>
//             </div>
//           </div>
//         </div>

//         {/* KANBAN */}
//         <div className="max-w-[1800px] mx-auto">
//           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            
//             {AI_COLUMNS.map((col) => {
//               const colData = getColumnData(col.id);
//               const Icon = col.icon;
              
//               return (
//                 <motion.div 
//                   key={col.id}
//                   initial={{ opacity: 0, y: 20 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   transition={{ delay: AI_COLUMNS.indexOf(col) * 0.1 }}
//                   className="flex flex-col h-[calc(100vh-200px)]"
//                 >
//                   {/* Column Header */}
//                   <div className={`bg-gradient-to-br ${col.gradient} backdrop-blur-xl border-2 ${col.border} rounded-2xl p-5 mb-4 ${col.glow} shadow-2xl`}>
//                     <div className="flex items-center justify-between mb-3">
//                       <div className="flex items-center gap-3">
//                         <div className={`p-2 bg-white/10 rounded-lg`}>
//                           <Icon size={20} className="text-white"/>
//                         </div>
//                         <h3 className="font-black text-white text-lg">{col.title}</h3>
//                       </div>
//                       <div className="px-3 py-1 bg-black/30 rounded-full border border-white/10">
//                         <span className="text-sm font-bold text-white">{colData.length}</span>
//                       </div>
//                     </div>
//                     <p className="text-xs text-white/70 font-bold uppercase tracking-wider">{col.description}</p>
//                   </div>
                  
//                   {/* Cards */}
//                   <div className="flex-1 bg-white/5 backdrop-blur-sm rounded-2xl p-3 overflow-y-auto border border-white/10 space-y-3">
//                     <AnimatePresence mode="popLayout">
//                       {colData.map((c) => {
//                         const hasOverride = c.hrDecision && c.hrDecision !== c.aiSuggestion;
                        
//                         return (
//                           <motion.div 
//                             key={c.id}
//                             layout
//                             initial={{ opacity: 0, scale: 0.9 }}
//                             animate={{ opacity: 1, scale: 1 }}
//                             exit={{ opacity: 0, scale: 0.9 }}
//                             onClick={() => router.push(`/recrutement/ia/candidats/${c.id}`)}
//                             className={`bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border rounded-2xl p-5 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-xl group ${
//                               hasOverride 
//                                 ? 'border-yellow-500/50 shadow-yellow-500/20' 
//                                 : 'border-white/10 hover:border-cyan-500/50'
//                             }`}
//                           >
//                             {/* Avatar + Name */}
//                             <div className="flex items-center gap-3 mb-4">
//                               <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg group-hover:shadow-cyan-500/50 transition-shadow">
//                                 {c.firstName[0]}{c.lastName[0]}
//                               </div>
//                               <div className="flex-1 min-w-0">
//                                 <h4 className="font-bold text-white truncate group-hover:text-cyan-400 transition-colors">
//                                   {c.firstName} {c.lastName}
//                                 </h4>
//                                 <p className="text-xs text-slate-400 truncate">{c.jobOffer?.title}</p>
//                               </div>
//                             </div>

//                             {/* Scores */}
//                             <div className="grid grid-cols-3 gap-2 mb-4">
//                               <div className="bg-black/40 p-2 rounded-lg text-center border border-white/5">
//                                 <p className="text-[9px] text-slate-500 uppercase font-bold mb-1">CV</p>
//                                 <p className="text-sm font-bold text-white">{c.cvScore || 0}<span className="text-slate-600">/35</span></p>
//                               </div>
//                               <div className="bg-black/40 p-2 rounded-lg text-center border border-white/5">
//                                 <p className="text-[9px] text-slate-500 uppercase font-bold mb-1">Test</p>
//                                 <p className="text-sm font-bold text-white">{c.testScore || 0}<span className="text-slate-600">/65</span></p>
//                               </div>
//                               <div className="bg-gradient-to-br from-cyan-500/20 to-blue-600/20 p-2 rounded-lg text-center border border-cyan-500/30">
//                                 <p className="text-[9px] text-cyan-400 uppercase font-bold mb-1">Total</p>
//                                 <p className="text-sm font-bold text-cyan-400">{c.totalScore || 0}<span className="text-cyan-600">/100</span></p>
//                               </div>
//                             </div>

//                             {/* Flags */}
//                             <div className="flex items-center justify-between text-xs">
//                               {hasOverride && (
//                                 <div className="flex items-center gap-1 text-yellow-400">
//                                   <AlertTriangle size={12}/>
//                                   <span className="font-bold">Décision RH</span>
//                                 </div>
//                               )}
                              
//                               {c.tabSwitchCount && c.tabSwitchCount > 0 && (
//                                 <div className="flex items-center gap-1 text-orange-400">
//                                   <Target size={12}/>
//                                   <span className="font-bold">{c.tabSwitchCount} switches</span>
//                                 </div>
//                               )}
                              
//                               <div className="ml-auto text-slate-500 group-hover:text-cyan-400 transition-colors">
//                                 <Eye size={14}/>
//                               </div>
//                             </div>

//                             {/* Date */}
//                             <div className="mt-3 pt-3 border-t border-white/5">
//                               <p className="text-[10px] text-slate-500 flex items-center gap-2">
//                                 <Zap size={10} className="text-cyan-500"/>
//                                 {new Date(c.createdAt).toLocaleDateString('fr-FR', { 
//                                   day: 'numeric', 
//                                   month: 'short', 
//                                   hour: '2-digit', 
//                                   minute: '2-digit' 
//                                 })}
//                               </p>
//                             </div>
//                           </motion.div>
//                         );
//                       })}
//                     </AnimatePresence>
                    
//                     {colData.length === 0 && (
//                       <div className="h-full flex items-center justify-center">
//                         <p className="text-slate-600 text-sm italic">Aucun candidat</p>
//                       </div>
//                     )}
//                   </div>
//                 </motion.div>
//               );
//             })}

//           </div>
//         </div>

//       </div>
//     </div>
//   );
// }