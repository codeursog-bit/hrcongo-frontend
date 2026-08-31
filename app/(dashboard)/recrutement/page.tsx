// 'use client';

// import React, { useEffect, useState } from 'react';
// import Link from 'next/link';
// import { 
//   Briefcase, Users, MessageSquare, Clock, Plus, Search, 
//   MapPin, ChevronRight, BarChart3, Loader2,
//   Share2, Copy, ExternalLink, X, Check, Globe, TrendingUp, 
//   Trash2, Edit, BrainCircuit, User, Zap, Palette
// } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { api } from '@/services/api';

// interface JobOffer {
//   id: string;
//   title: string;
//   department: { name: string };
//   location: string;
//   type: string;
//   status: 'PUBLISHED' | 'CLOSED' | 'DRAFT';
//   processingMode: 'MANUAL' | 'AI_ASSISTED';
//   _count: { candidates: number };
// }

// export default function RecruitmentPage() {
//   const [jobs, setJobs] = useState<JobOffer[]>([]);
//   const [candidates, setCandidates] = useState<any[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
  
//   const [shareJob, setShareJob] = useState<JobOffer | null>(null);
//   const [isCopied, setIsCopied] = useState(false);

//   useEffect(() => {
//     fetchData();
//   }, []);

//   const fetchData = async () => {
//     try {
//       const [jobsData, candidatesData] = await Promise.all([
//         api.get<JobOffer[]>('/recruitment/jobs'),
//         api.get<any[]>('/recruitment/candidates')
//       ]);
//       setJobs(jobsData);
//       setCandidates(candidatesData);
//     } catch (e) {
//       console.error("Failed to load recruitment data", e);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleDeleteJob = async (jobId: string) => {
//     if (!confirm('Supprimer cette offre définitivement ?')) return;
//     try {
//       await api.delete(`/recruitment/jobs/${jobId}`);
//       setJobs(prev => prev.filter(j => j.id !== jobId));
//     } catch (e) {
//       alert("Erreur lors de la suppression");
//     }
//   };

//   const openJobsCount = jobs.filter(j => j.status === 'PUBLISHED').length;
//   const totalCandidates = jobs.reduce((acc, curr) => acc + curr._count.candidates, 0);
//   const interviewsCount = candidates.filter(c => c.status === 'INTERVIEW').length;
//   const aiJobsCount = jobs.filter(j => j.processingMode === 'AI_ASSISTED').length;

//   const STATS = [
//     { label: 'Postes Ouverts', value: openJobsCount.toString(), icon: Briefcase, color: 'text-cyan-400', from: 'from-cyan-500/20', to: 'to-blue-600/20' },
//     { label: 'Candidats', value: totalCandidates.toString(), icon: Users, color: 'text-emerald-400', from: 'from-emerald-500/20', to: 'to-teal-600/20' },
//     { label: 'Offres IA', value: aiJobsCount.toString(), icon: BrainCircuit, color: 'text-purple-400', from: 'from-purple-500/20', to: 'to-indigo-600/20' },
//     { label: 'Entretiens', value: interviewsCount.toString(), icon: MessageSquare, color: 'text-orange-400', from: 'from-orange-500/20', to: 'to-red-600/20' },
//   ];

//   const handleCopyLink = () => {
//     if (!shareJob) return;
//     const baseUrl = `${window.location.origin}/jobs/${shareJob.id}`;
//     navigator.clipboard.writeText(baseUrl);
//     setIsCopied(true);
//     setTimeout(() => setIsCopied(false), 2000);
//   };

//   return (
//     <div className="max-w-[1600px] mx-auto pb-20 space-y-10 relative">
      
//       <div className="fixed inset-0 z-0 pointer-events-none">
//         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-600/5 rounded-full blur-[100px]"></div>
//         <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[100px]"></div>
//       </div>

//       {/* HEADER */}
//       <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
//         <div>
//           <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
//             Recrutement <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">& Talents</span>
//           </h1>
//           <p className="text-gray-500 dark:text-gray-400 text-lg">Pilotez vos campagnes d'acquisition de talents.</p>
//         </div>
        
//         <div className="flex items-center gap-4">
//           {/* ✨ BOUTON PERSONNALISATION PAGE CARRIÈRE */}
//           <Link 
//             href="/recrutement/customize-career-page" 
//             className="px-6 py-3 rounded-2xl border border-purple-500/30 bg-purple-500/10 font-bold text-purple-400 hover:bg-purple-500/20 transition-all flex items-center gap-2"
//           >
//             <Palette size={20} />
//             <span className="hidden lg:inline">Page Carrière</span>
//           </Link>

//           <Link 
//             href="/recrutement/manuel/candidats" 
//             className="px-6 py-3 rounded-2xl border border-gray-200 dark:border-white/10 font-bold text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-all flex items-center gap-2"
//           >
//             <User size={20} className="text-gray-400" />
//             <span className="hidden sm:inline">Pipeline Manuel</span>
//           </Link>
          
//           <Link 
//             href="/recrutement/ia/candidats" 
//             className="px-6 py-3 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 font-bold text-cyan-400 hover:bg-cyan-500/20 transition-all flex items-center gap-2"
//           >
//             <BrainCircuit size={20} />
//             <span className="hidden sm:inline">Pipeline IA</span>
//           </Link>

//           <div className="relative group">
//             <button className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-lg shadow-cyan-500/20 hover:scale-105 transition-all flex items-center gap-2">
//               <Plus size={20} /> 
//               <span>Nouvelle Offre</span>
//             </button>
            
//             {/* Dropdown */}
//             <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100]">
//               <Link 
//                 href="/recrutement/manuel/create" 
//                 className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors rounded-t-2xl border-b border-gray-100 dark:border-white/5"
//               >
//                 <div className="p-2 bg-gray-100 dark:bg-white/5 rounded-lg">
//                   <User size={20} className="text-gray-600 dark:text-gray-400"/>
//                 </div>
//                 <div>
//                   <p className="font-bold text-gray-900 dark:text-white text-sm">Mode Manuel</p>
//                   <p className="text-xs text-gray-500">Gestion classique</p>
//                 </div>
//               </Link>
              
//               <Link 
//                 href="/recrutement/ia/create" 
//                 className="flex items-center gap-3 p-4 hover:bg-cyan-500/5 transition-colors rounded-b-2xl"
//               >
//                 <div className="p-2 bg-cyan-500/10 rounded-lg">
//                   <BrainCircuit size={20} className="text-cyan-400"/>
//                 </div>
//                 <div>
//                   <p className="font-bold text-gray-900 dark:text-white text-sm">Mode IA</p>
//                   <p className="text-xs text-gray-500">Sélection automatique</p>
//                 </div>
//               </Link>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* STATS */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
//         {STATS.map((stat, i) => (
//           <motion.div 
//             key={i} 
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: i * 0.1 }}
//             className="relative bg-white dark:bg-gray-900/40 backdrop-blur-xl p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-xl overflow-hidden group"
//           >
//             <div className={`absolute inset-0 bg-gradient-to-br ${stat.from} ${stat.to} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
            
//             <div className="relative z-10 flex justify-between items-start mb-4">
//               <div>
//                 <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{stat.label}</p>
//                 <h3 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">{stat.value}</h3>
//               </div>
//               <div className={`p-3 rounded-2xl bg-gray-50 dark:bg-white/5 ${stat.color} shadow-inner`}>
//                 <stat.icon size={24} />
//               </div>
//             </div>
            
//             <div className="relative z-10 flex items-center gap-1 text-xs font-medium text-gray-400">
//               <TrendingUp size={14} className="text-emerald-500" />
//               <span className="text-emerald-500 font-bold">+12%</span>
//               <span>vs mois dernier</span>
//             </div>
//           </motion.div>
//         ))}
//       </div>

//       {/* OFFRES */}
//       <div className="bg-white dark:bg-gray-900/40 backdrop-blur-xl rounded-[32px] border border-gray-100 dark:border-white/5 shadow-2xl overflow-hidden relative z-10">
        
//         <div className="p-8 border-b border-gray-100 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
//           <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
//             <Briefcase className="text-cyan-500" size={24} />
//             Offres en cours
//           </h2>
          
//           <div className="relative w-full md:w-80 group">
//             <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
//               <Search className="text-gray-400 group-focus-within:text-cyan-500 transition-colors" size={18} />
//             </div>
//             <input 
//               type="text" 
//               placeholder="Rechercher une offre..."
//               className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl text-sm focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all"
//             />
//           </div>
//         </div>

//         {isLoading ? (
//           <div className="flex flex-col items-center justify-center py-32">
//             <Loader2 className="animate-spin text-cyan-500" size={48}/>
//             <p className="mt-4 text-cyan-500 font-bold text-sm">CHARGEMENT</p>
//           </div>
//         ) : (
//           <div className="divide-y divide-gray-100 dark:divide-white/5">
//             {jobs.map((job, index) => {
//               const isAI = job.processingMode === 'AI_ASSISTED';
//               const candidatesCount = job._count.candidates;
              
//               return (
//                 <motion.div 
//                   key={job.id}
//                   initial={{ opacity: 0, x: -20 }}
//                   animate={{ opacity: 1, x: 0 }}
//                   transition={{ delay: index * 0.05 }}
//                   className="p-6 md:p-8 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6 group relative"
//                 >
//                   <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${isAI ? 'from-cyan-500 to-blue-600' : 'from-gray-400 to-gray-600'} opacity-0 group-hover:opacity-100 transition-opacity`}></div>

//                   <div className="flex-1">
//                     <div className="flex items-center gap-3 mb-3">
//                       <h3 className="font-bold text-gray-900 dark:text-white text-xl">{job.title}</h3>
                      
//                       {/* Badge Mode */}
//                       {isAI ? (
//                         <div className="px-3 py-1 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold uppercase rounded-lg flex items-center gap-1.5">
//                           <BrainCircuit size={12}/>
//                           IA
//                         </div>
//                       ) : (
//                         <div className="px-3 py-1 bg-gray-500/10 border border-gray-500/20 text-gray-500 text-[10px] font-bold uppercase rounded-lg flex items-center gap-1.5">
//                           <User size={12}/>
//                           Manuel
//                         </div>
//                       )}
                      
//                       {/* Badge Statut */}
//                       {job.status === 'PUBLISHED' ? (
//                         <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold uppercase rounded-lg flex items-center gap-1.5">
//                           <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Public
//                         </span>
//                       ) : (
//                         <span className="px-2.5 py-1 bg-orange-500/10 text-orange-500 border border-orange-500/20 text-[10px] font-bold uppercase rounded-lg">
//                           Brouillon
//                         </span>
//                       )}
//                     </div>
                    
//                     <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
//                       <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-white/5 px-3 py-1 rounded-lg">
//                         <Briefcase size={14} className="text-purple-400"/> {job.department?.name}
//                       </span>
//                       <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-white/5 px-3 py-1 rounded-lg">
//                         <MapPin size={14} className="text-red-400"/> {job.location}
//                       </span>
//                       <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-white/5 px-3 py-1 rounded-lg">
//                         <Clock size={14} className="text-orange-400"/> {job.type}
//                       </span>
                      
//                       {/* Avatars Candidats */}
//                       {candidatesCount > 0 && (
//                         <div className="flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-lg">
//                           <div className="flex -space-x-2">
//                             {[...Array(Math.min(candidatesCount, 3))].map((_, i) => (
//                               <div 
//                                 key={i} 
//                                 className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 border-2 border-white dark:border-gray-900 flex items-center justify-center text-[10px] font-bold text-white"
//                               >
//                                 {String.fromCharCode(65 + i)}
//                               </div>
//                             ))}
//                           </div>
//                           <span className="text-cyan-600 dark:text-cyan-400 font-bold text-xs">
//                             {candidatesCount} candidat{candidatesCount > 1 ? 's' : ''}
//                           </span>
//                         </div>
//                       )}
//                     </div>
//                   </div>

//                   {/* Actions */}
//                   <div className="flex items-center gap-3">
//                     <button 
//                       onClick={() => setShareJob(job)}
//                       className="w-12 h-12 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-cyan-500/50 hover:bg-cyan-500/10 text-gray-400 hover:text-cyan-500 transition-all flex items-center justify-center"
//                     >
//                       <Share2 size={20} />
//                     </button>

//                     <Link 
//                       href={`/recrutement/offres/${job.id}/edit`}
//                       className="w-12 h-12 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-blue-500/50 hover:bg-blue-500/10 text-gray-400 hover:text-blue-500 transition-all flex items-center justify-center"
//                     >
//                       <Edit size={20} />
//                     </Link>

//                     <button 
//                       onClick={() => handleDeleteJob(job.id)}
//                       className="w-12 h-12 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-red-500/50 hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-all flex items-center justify-center"
//                     >
//                       <Trash2 size={20} />
//                     </button>

//                     <Link 
//                       href={isAI ? '/recrutement/ia/candidats' : '/recrutement/manuel/candidats'} 
//                       className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
//                     >
//                       Gérer <ChevronRight size={16} />
//                     </Link>
//                   </div>
//                 </motion.div>
//               );
//             })}
//           </div>
//         )}
//       </div>

//       {/* MODAL SHARE */}
//       <AnimatePresence>
//         {shareJob && (
//           <motion.div 
//             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//             className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
//             onClick={() => setShareJob(null)}
//           >
//             <motion.div 
//               initial={{ scale: 0.9 }} animate={{ scale: 1 }}
//               className="bg-gray-900 rounded-[32px] p-8 w-full max-w-lg shadow-2xl"
//               onClick={(e) => e.stopPropagation()}
//             >
//               <div className="flex justify-between items-start mb-8">
//                 <div>
//                   <h3 className="text-2xl font-bold text-white mb-1">Partager l'offre</h3>
//                   <p className="text-gray-400">Diffusez cette opportunité.</p>
//                 </div>
//                 <button onClick={() => setShareJob(null)} className="p-2 hover:bg-white/10 rounded-full text-gray-400">
//                   <X size={24}/>
//                 </button>
//               </div>

//               <div className="p-6 bg-black/30 rounded-2xl mb-8">
//                 <div className="flex items-center gap-4 mb-6">
//                   <div className={`w-12 h-12 bg-gradient-to-br ${shareJob.processingMode === 'AI_ASSISTED' ? 'from-cyan-500 to-blue-600' : 'from-gray-500 to-gray-700'} rounded-xl flex items-center justify-center text-white`}>
//                     {shareJob.processingMode === 'AI_ASSISTED' ? <BrainCircuit size={20} /> : <User size={20}/>}
//                   </div>
//                   <div>
//                     <p className="font-bold text-white text-lg">{shareJob.title}</p>
//                     <p className="text-sm text-gray-400">{shareJob.location} • {shareJob.type}</p>
//                   </div>
//                 </div>
                
//                 <div className="flex items-center gap-3 bg-black/40 p-2 rounded-xl">
//                   <div className="flex-1 px-3 font-mono text-sm text-cyan-400 truncate">
//                     {`${window.location.origin}/jobs/${shareJob.id}`}
//                   </div>
//                   <button 
//                     onClick={handleCopyLink}
//                     className="p-2.5 bg-white/10 hover:bg-white/20 rounded-lg text-white"
//                   >
//                     {isCopied ? <Check size={18} className="text-emerald-400"/> : <Copy size={18}/>}
//                   </button>
//                 </div>
//               </div>

//               <div className="flex gap-4">
//                 <Link 
//                   href={`/jobs/${shareJob.id}`}
//                   target="_blank" 
//                   className="flex-1 py-4 border border-white/10 hover:bg-white/5 rounded-2xl font-bold text-white flex justify-center items-center gap-2"
//                 >
//                   <ExternalLink size={20} /> Voir
//                 </Link>
//                 <button 
//                   onClick={handleCopyLink}
//                   className="flex-1 py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-2xl flex justify-center items-center gap-2"
//                 >
//                   {isCopied ? 'Copié !' : 'Copier'}
//                 </button>
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//     </div>
//   );
// }


'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Briefcase, Users, MessageSquare, Clock, Plus, Search, 
  MapPin, ChevronRight, BarChart3, Loader2,
  Share2, Copy, ExternalLink, X, Check, Globe, TrendingUp, 
  Trash2, Edit, BrainCircuit, User, Zap, Palette
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';
import { ModeSelectionModal } from './ModeSelectionModal';

interface JobOffer {
  id: string;
  title: string;
  department: { name: string };
  location: string;
  type: string;
  status: 'PUBLISHED' | 'CLOSED' | 'DRAFT';
  processingMode: 'MANUAL' | 'AI_ASSISTED';
  _count: { candidates: number };
}

export default function RecruitmentPage() {
  const [jobs, setJobs] = useState<JobOffer[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [shareJob, setShareJob] = useState<JobOffer | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  
  // ✨ NOUVEAU : État pour le modal de sélection
  const [showModeSelector, setShowModeSelector] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [jobsData, candidatesData] = await Promise.all([
        api.get<JobOffer[]>('/recruitment/jobs'),
        api.get<any[]>('/recruitment/candidates')
      ]);
      setJobs(jobsData);
      setCandidates(candidatesData);
    } catch (e) {
      console.error("Failed to load recruitment data", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Supprimer cette offre définitivement ?')) return;
    try {
      await api.delete(`/recruitment/jobs/${jobId}`);
      setJobs(prev => prev.filter(j => j.id !== jobId));
    } catch (e) {
      alert("Erreur lors de la suppression");
    }
  };

  const openJobsCount = jobs.filter(j => j.status === 'PUBLISHED').length;
  const totalCandidates = jobs.reduce((acc, curr) => acc + curr._count.candidates, 0);
  const interviewsCount = candidates.filter(c => c.status === 'INTERVIEW').length;
  const aiJobsCount = jobs.filter(j => j.processingMode === 'AI_ASSISTED').length;

  const STATS = [
    { label: 'Postes Ouverts', value: openJobsCount.toString(), icon: Briefcase, color: 'text-cyan-400', from: 'from-cyan-500/20', to: 'to-blue-600/20' },
    { label: 'Candidats', value: totalCandidates.toString(), icon: Users, color: 'text-emerald-400', from: 'from-emerald-500/20', to: 'to-teal-600/20' },
    { label: 'Offres IA', value: aiJobsCount.toString(), icon: BrainCircuit, color: 'text-purple-400', from: 'from-purple-500/20', to: 'to-indigo-600/20' },
    { label: 'Entretiens', value: interviewsCount.toString(), icon: MessageSquare, color: 'text-orange-400', from: 'from-orange-500/20', to: 'to-red-600/20' },
  ];

  const handleCopyLink = () => {
    if (!shareJob) return;
    const baseUrl = `${window.location.origin}/jobs/${shareJob.id}`;
    navigator.clipboard.writeText(baseUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-20 space-y-10 relative">
      
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-600/5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[100px]"></div>
      </div>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
            Recrutement <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">& Talents</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg">Pilotez vos campagnes d'acquisition de talents.</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* ✨ BOUTON PERSONNALISATION PAGE CARRIÈRE */}
          <Link 
            href="/recrutement/customize-career-page" 
            className="px-6 py-3 rounded-2xl border border-purple-500/30 bg-purple-500/10 font-bold text-purple-400 hover:bg-purple-500/20 transition-all flex items-center gap-2"
          >
            <Palette size={20} />
            <span className="hidden lg:inline">Page Carrière</span>
          </Link>

          <Link 
            href="/recrutement/manuel/candidats" 
            className="px-6 py-3 rounded-2xl border border-gray-200 dark:border-white/10 font-bold text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-all flex items-center gap-2"
          >
            <User size={20} className="text-gray-400" />
            <span className="hidden sm:inline">Pipeline Manuel</span>
          </Link>
          
          <Link 
            href="/recrutement/ia/candidats" 
            className="px-6 py-3 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 font-bold text-cyan-400 hover:bg-cyan-500/20 transition-all flex items-center gap-2"
          >
            <BrainCircuit size={20} />
            <span className="hidden sm:inline">Pipeline IA</span>
          </Link>

          {/* ✨ NOUVEAU BOUTON - Ouvre le modal au lieu du dropdown */}
          <button 
            onClick={() => setShowModeSelector(true)}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-lg shadow-cyan-500/20 hover:scale-105 transition-all flex items-center gap-2"
          >
            <Plus size={20} /> 
            <span>Nouvelle Offre</span>
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        {STATS.map((stat, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="relative bg-white dark:bg-gray-900/40 backdrop-blur-xl p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-xl overflow-hidden group"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.from} ${stat.to} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
            
            <div className="relative z-10 flex justify-between items-start mb-4">
              <div>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{stat.label}</p>
                <h3 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-2xl bg-gray-50 dark:bg-white/5 ${stat.color} shadow-inner`}>
                <stat.icon size={24} />
              </div>
            </div>
            
            <div className="relative z-10 flex items-center gap-1 text-xs font-medium text-gray-400">
              <TrendingUp size={14} className="text-emerald-500" />
              <span className="text-emerald-500 font-bold">+12%</span>
              <span>vs mois dernier</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* OFFRES */}
      <div className="bg-white dark:bg-gray-900/40 backdrop-blur-xl rounded-[32px] border border-gray-100 dark:border-white/5 shadow-2xl overflow-hidden relative z-10">
        
        <div className="p-8 border-b border-gray-100 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Briefcase className="text-cyan-500" size={24} />
            Offres en cours
          </h2>
          
          <div className="relative w-full md:w-80 group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="text-gray-400 group-focus-within:text-cyan-500 transition-colors" size={18} />
            </div>
            <input 
              type="text" 
              placeholder="Rechercher une offre..."
              className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl text-sm focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="animate-spin text-cyan-500" size={48}/>
            <p className="mt-4 text-cyan-500 font-bold text-sm">CHARGEMENT</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-white/5">
            {jobs.map((job, index) => {
              const isAI = job.processingMode === 'AI_ASSISTED';
              const candidatesCount = job._count.candidates;
              
              return (
                <motion.div 
                  key={job.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-6 md:p-8 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6 group relative"
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${isAI ? 'from-cyan-500 to-blue-600' : 'from-gray-400 to-gray-600'} opacity-0 group-hover:opacity-100 transition-opacity`}></div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-bold text-gray-900 dark:text-white text-xl">{job.title}</h3>
                      
                      {/* Badge Mode */}
                      {isAI ? (
                        <div className="px-3 py-1 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold uppercase rounded-lg flex items-center gap-1.5">
                          <BrainCircuit size={12}/>
                          IA
                        </div>
                      ) : (
                        <div className="px-3 py-1 bg-gray-500/10 border border-gray-500/20 text-gray-500 text-[10px] font-bold uppercase rounded-lg flex items-center gap-1.5">
                          <User size={12}/>
                          Manuel
                        </div>
                      )}
                      
                      {/* Badge Statut */}
                      {job.status === 'PUBLISHED' ? (
                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold uppercase rounded-lg flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Public
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-orange-500/10 text-orange-500 border border-orange-500/20 text-[10px] font-bold uppercase rounded-lg">
                          Brouillon
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-white/5 px-3 py-1 rounded-lg">
                        <Briefcase size={14} className="text-purple-400"/> {job.department?.name}
                      </span>
                      <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-white/5 px-3 py-1 rounded-lg">
                        <MapPin size={14} className="text-red-400"/> {job.location}
                      </span>
                      <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-white/5 px-3 py-1 rounded-lg">
                        <Clock size={14} className="text-orange-400"/> {job.type}
                      </span>
                      
                      {/* Avatars Candidats */}
                      {candidatesCount > 0 && (
                        <div className="flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-lg">
                          <div className="flex -space-x-2">
                            {[...Array(Math.min(candidatesCount, 3))].map((_, i) => (
                              <div 
                                key={i} 
                                className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 border-2 border-white dark:border-gray-900 flex items-center justify-center text-[10px] font-bold text-white"
                              >
                                {String.fromCharCode(65 + i)}
                              </div>
                            ))}
                          </div>
                          <span className="text-cyan-600 dark:text-cyan-400 font-bold text-xs">
                            {candidatesCount} candidat{candidatesCount > 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setShareJob(job)}
                      className="w-12 h-12 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-cyan-500/50 hover:bg-cyan-500/10 text-gray-400 hover:text-cyan-500 transition-all flex items-center justify-center"
                    >
                      <Share2 size={20} />
                    </button>

                    <Link 
                      href={`/recrutement/offres/${job.id}/edit`}
                      className="w-12 h-12 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-blue-500/50 hover:bg-blue-500/10 text-gray-400 hover:text-blue-500 transition-all flex items-center justify-center"
                    >
                      <Edit size={20} />
                    </Link>

                    <button 
                      onClick={() => handleDeleteJob(job.id)}
                      className="w-12 h-12 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-red-500/50 hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-all flex items-center justify-center"
                    >
                      <Trash2 size={20} />
                    </button>

                    <Link 
                      href={isAI ? '/recrutement/ia/candidats' : '/recrutement/manuel/candidats'} 
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
                    >
                      Gérer <ChevronRight size={16} />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ✨ MODAL DE SÉLECTION MODE - Utilise Portal pour éviter les conflits avec la sidebar */}
      <ModeSelectionModal 
        isOpen={showModeSelector} 
        onClose={() => setShowModeSelector(false)} 
      />

      {/* MODAL SHARE (Inchangé) */}
      <AnimatePresence>
        {shareJob && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
            onClick={() => setShareJob(null)}
          >
            <motion.div 
              initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              className="bg-gray-900 rounded-[32px] p-8 w-full max-w-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">Partager l'offre</h3>
                  <p className="text-gray-400">Diffusez cette opportunité.</p>
                </div>
                <button onClick={() => setShareJob(null)} className="p-2 hover:bg-white/10 rounded-full text-gray-400">
                  <X size={24}/>
                </button>
              </div>

              <div className="p-6 bg-black/30 rounded-2xl mb-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-12 h-12 bg-gradient-to-br ${shareJob.processingMode === 'AI_ASSISTED' ? 'from-cyan-500 to-blue-600' : 'from-gray-500 to-gray-700'} rounded-xl flex items-center justify-center text-white`}>
                    {shareJob.processingMode === 'AI_ASSISTED' ? <BrainCircuit size={20} /> : <User size={20}/>}
                  </div>
                  <div>
                    <p className="font-bold text-white text-lg">{shareJob.title}</p>
                    <p className="text-sm text-gray-400">{shareJob.location} • {shareJob.type}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 bg-black/40 p-2 rounded-xl">
                  <div className="flex-1 px-3 font-mono text-sm text-cyan-400 truncate">
                    {`${window.location.origin}/jobs/${shareJob.id}`}
                  </div>
                  <button 
                    onClick={handleCopyLink}
                    className="p-2.5 bg-white/10 hover:bg-white/20 rounded-lg text-white"
                  >
                    {isCopied ? <Check size={18} className="text-emerald-400"/> : <Copy size={18}/>}
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <Link 
                  href={`/jobs/${shareJob.id}`}
                  target="_blank" 
                  className="flex-1 py-4 border border-white/10 hover:bg-white/5 rounded-2xl font-bold text-white flex justify-center items-center gap-2"
                >
                  <ExternalLink size={20} /> Voir
                </Link>
                <button 
                  onClick={handleCopyLink}
                  className="flex-1 py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-2xl flex justify-center items-center gap-2"
                >
                  {isCopied ? 'Copié !' : 'Copier'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}