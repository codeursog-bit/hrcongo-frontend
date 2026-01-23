
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, User, Mail, Phone, Calendar, Download, Loader2, 
  CheckCircle2, XCircle, FileText, MapPin, Briefcase, MessageSquare, LucideIcon
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/services/api';

interface CandidateManual {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  resumeUrl: string;
  coverLetter?: string;
  status: string;
  notes?: string;
  rating?: number;
  jobOffer: {
    title: string;
    location: string;
    type: string;
    department: { name: string };
  };
  createdAt: string;
}

interface StatusConfig {
  label: string;
  color: string;
  icon: LucideIcon;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  APPLIED: { label: 'Nouvelle', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20', icon: User },
  SCREENING: { label: 'Qualifié', color: 'text-purple-500 bg-purple-500/10 border-purple-500/20', icon: CheckCircle2 },
  INTERVIEW: { label: 'Entretien', color: 'text-orange-500 bg-orange-500/10 border-orange-500/20', icon: MessageSquare },
  OFFER: { label: 'Offre envoyée', color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20', icon: FileText },
  HIRED: { label: 'Embauché', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 },
  REJECTED: { label: 'Refusé', color: 'text-red-500 bg-red-500/10 border-red-500/20', icon: XCircle },
};

const ALL_STATUSES = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'];

export default function DetailCandidatManualPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [candidate, setCandidate] = useState<CandidateManual | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCandidate = useCallback(async () => {
    try {
      const data = await api.get<CandidateManual>(`/recruitment/candidates/${params.id}`);
      setCandidate(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchCandidate();
  }, [fetchCandidate]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      await api.patch(`/recruitment/candidates/${params.id}/status`, { status: newStatus });
      setCandidate(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (e) {
      alert("Erreur lors de la mise à jour du statut");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={32}/>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Candidat introuvable</h1>
        <Link href="/recrutement/manuel/candidats" className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold">
          Retour au pipeline
        </Link>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[candidate.status] || STATUS_CONFIG.APPLIED;
  const StatusIcon = statusConfig.icon;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => router.back()} 
          className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={20}/>
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {candidate.firstName} {candidate.lastName}
          </h1>
          <p className="text-sm text-gray-500">
            Postulé le {new Date(candidate.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SIDEBAR */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-1"
        >
          <div className="glass-panel rounded-3xl p-8 shadow-xl text-center sticky top-8">
            
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 shadow-lg">
              {candidate.firstName[0]}{candidate.lastName[0]}
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {candidate.firstName} {candidate.lastName}
            </h2>
            
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${statusConfig.color} font-bold text-sm mt-4 mb-6`}>
              <StatusIcon size={16} />
              {statusConfig.label}
            </div>

            {/* CHANGER STATUT */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Changer le statut</label>
              <select 
                value={candidate.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 font-medium text-sm"
              >
                {ALL_STATUSES.map(s => (
                  <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-4 mb-8 text-left">
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <Mail size={16} className="text-gray-400"/>
                <a href={`mailto:${candidate.email}`} className="hover:text-blue-500 transition-colors break-all">
                  {candidate.email}
                </a>
              </div>
              
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <Phone size={16} className="text-gray-400"/>
                <a href={`tel:${candidate.phone}`} className="hover:text-blue-500 transition-colors">
                  {candidate.phone}
                </a>
              </div>
              
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <Calendar size={16} className="text-gray-400"/>
                <span>{new Date(candidate.createdAt).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>

            <a 
              href={candidate.resumeUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <Download size={20} />
              Télécharger le CV
            </a>
          </div>
        </motion.div>

        {/* MAIN CONTENT */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-6"
        >
          
          {/* POSTE VISÉ */}
          <div className="glass-panel rounded-3xl p-8 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Briefcase size={20} className="text-blue-500"/>
              Poste visé
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm font-bold text-gray-500 mb-1">Titre du poste</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{candidate.jobOffer.title}</p>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <div>
                  <p className="text-sm font-bold text-gray-500 mb-1">Département</p>
                  <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-900/50 px-3 py-2 rounded-lg">
                    <Briefcase size={14} className="text-purple-400"/>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{candidate.jobOffer.department.name}</span>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-bold text-gray-500 mb-1">Lieu</p>
                  <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-900/50 px-3 py-2 rounded-lg">
                    <MapPin size={14} className="text-red-400"/>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{candidate.jobOffer.location}</span>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-bold text-gray-500 mb-1">Contrat</p>
                  <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-900/50 px-3 py-2 rounded-lg">
                    <FileText size={14} className="text-orange-400"/>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{candidate.jobOffer.type}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* LETTRE DE MOTIVATION */}
          {candidate.coverLetter && (
            <div className="glass-panel rounded-3xl p-8 shadow-xl">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <MessageSquare size={20} className="text-blue-500"/>
                Lettre de motivation
              </h3>
              
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line leading-relaxed">
                  {candidate.coverLetter}
                </p>
              </div>
            </div>
          )}

          {/* NOTES RH */}
          <div className="glass-panel rounded-3xl p-8 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Notes RH</h3>
            <textarea 
              className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4 min-h-[120px] text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
              placeholder="Ajoutez vos notes sur ce candidat..."
              defaultValue={candidate.notes || ''}
            />
          </div>

        </motion.div>
      </div>
    </div>
  );
}
// 'use client';

// import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { motion } from 'framer-motion';
// import {
//   ArrowLeft, User, Mail, Phone, Calendar, Download, Loader2, 
//   CheckCircle2, XCircle, FileText, MapPin, Briefcase, MessageSquare
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

// const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
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

//   useEffect(() => {
//     fetchCandidate();
//   }, []);

//   const fetchCandidate = async () => {
//     try {
//       const data = await api.get<CandidateManual>(`/recruitment/candidates/${params.id}`);
//       setCandidate(data);
//     } catch (e) {
//       console.error(e);
//     } finally {
//       setIsLoading(false);
//     }
//   };

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

//             <a 
//               href={candidate.resumeUrl} 
//               target="_blank" 
//               rel="noopener noreferrer"
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