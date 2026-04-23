// 'use client';

// import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { motion } from 'framer-motion';
// import {
//   ArrowLeft, User, Mail, Phone, Calendar, Download, Loader2, 
//   CheckCircle2, XCircle, AlertTriangle, BrainCircuit, Sparkles,
//   TrendingUp, Award, Target, Zap, FileText, MapPin, Briefcase
// } from 'lucide-react';
// import Link from 'next/link';
// import { api } from '@/services/api';

// interface CandidateIA {
//   id: string;
//   firstName: string;
//   lastName: string;
//   email: string;
//   phone: string;
//   resumeUrl: string;
//   coverLetter?: string;
//   aiSuggestion: 'RETENU' | 'MOYENNE' | 'SECONDE_CHANCE' | 'REFUS';
//   hrDecision?: 'RETENU' | 'MOYENNE' | 'SECONDE_CHANCE' | 'REFUS';
//   hrNotes?: string;
//   totalScore: number;
//   cvScore: number;
//   testScore: number;
//   aiReasoning: string;
//   cvAnalysis: {
//     strengths: string[];
//     weaknesses: string[];
//   };
//   tabSwitchCount: number;
//   suspiciousActivity: boolean;
//   jobOffer: {
//     title: string;
//     location: string;
//     type: string;
//     department: { name: string };
//   };
//   createdAt: string;
// }

// const DECISION_CONFIG = {
//   RETENU: { label: 'Retenu', color: 'from-emerald-500 to-emerald-600', icon: Award },
//   MOYENNE: { label: 'Moyen', color: 'from-orange-500 to-orange-600', icon: TrendingUp },
//   SECONDE_CHANCE: { label: 'Seconde Chance', color: 'from-purple-500 to-purple-600', icon: Target },
//   REFUS: { label: 'Refusé', color: 'from-red-500 to-red-600', icon: XCircle }
// };

// export default function DetailCandidatIAPage({ params }: { params: { id: string } }) {
//   const router = useRouter();
//   const [candidate, setCandidate] = useState<CandidateIA | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
  
//   const [hrDecision, setHrDecision] = useState<string | null>(null);
//   const [hrNotes, setHrNotes] = useState('');
//   const [isSavingDecision, setIsSavingDecision] = useState(false);

//   useEffect(() => {
//     fetchCandidate();
//   }, []);

//   const fetchCandidate = async () => {
//     try {
//       const data = await api.get<CandidateIA>(`/recruitment/candidates/${params.id}`);
//       setCandidate(data);
      
//       if (data.hrDecision) {
//         setHrDecision(data.hrDecision);
//         setHrNotes(data.hrNotes || '');
//       }
//     } catch (e) {
//       console.error(e);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleSaveDecision = async () => {
//     if (!hrDecision) {
//       alert("⚠️ Veuillez choisir une décision");
//       return;
//     }

//     setIsSavingDecision(true);
//     try {
//       await api.patch(`/recruitment/candidates/${params.id}/hr-decision`, {
//         hrDecision,
//         hrNotes
//       });
//       alert("✅ Décision enregistrée !");
//       fetchCandidate();
//     } catch (e: any) {
//       alert(`❌ ${e.message}`);
//     } finally {
//       setIsSavingDecision(false);
//     }
//   };

//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
//         <div className="relative">
//           <div className="absolute inset-0 bg-cyan-500 blur-2xl opacity-20 animate-pulse"></div>
//           <Loader2 className="animate-spin text-cyan-500 relative z-10" size={48}/>
//         </div>
//       </div>
//     );
//   }

//   if (!candidate) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-4">
//         <XCircle size={64} className="text-red-500 mb-6"/>
//         <h1 className="text-3xl font-bold text-white mb-4">Candidat introuvable</h1>
//         <Link href="/recrutement/ia/candidats" className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-colors">
//           Retour au Pipeline
//         </Link>
//       </div>
//     );
//   }

//   const aiConfig = DECISION_CONFIG[candidate.aiSuggestion];
//   const AIIcon = aiConfig.icon;
//   const hasOverride = candidate.hrDecision && candidate.hrDecision !== candidate.aiSuggestion;

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      
//       {/* Animated Background */}
//       <div className="fixed inset-0 pointer-events-none">
//         <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
//         <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
//       </div>

//       <div className="max-w-7xl mx-auto py-8 px-4 relative z-10">
        
//         {/* HEADER */}
//         <div className="flex items-center gap-4 mb-10">
//           <button 
//             onClick={() => router.back()} 
//             className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all backdrop-blur-sm"
//           >
//             <ArrowLeft size={20} className="text-white"/>
//           </button>
//           <div className="flex-1">
//             <div className="flex items-center gap-4 mb-2">
//               <h1 className="text-3xl font-black text-white tracking-tight">
//                 {candidate.firstName} {candidate.lastName}
//               </h1>
//               <div className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center gap-2">
//                 <BrainCircuit size={16} className="text-cyan-400"/>
//                 <span className="text-xs font-bold text-cyan-400 uppercase">Analyse IA</span>
//               </div>
//             </div>
//             <p className="text-slate-400">
//               Postulé le {new Date(candidate.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
//             </p>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
//           {/* SIDEBAR */}
//           <motion.div 
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             className="lg:col-span-1"
//           >
//             <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl text-center sticky top-8">
              
//               {/* Avatar */}
//               <div className="w-28 h-28 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white text-4xl font-bold mx-auto mb-6 shadow-2xl shadow-cyan-500/50">
//                 {candidate.firstName[0]}{candidate.lastName[0]}
//               </div>
              
//               <h2 className="text-2xl font-bold text-white mb-2">
//                 {candidate.firstName} {candidate.lastName}
//               </h2>
              
//               {/* Suggestion IA */}
//               <div className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r ${aiConfig.color} text-white font-bold text-sm mt-4 mb-8 shadow-lg`}>
//                 <AIIcon size={18} />
//                 Suggestion IA : {aiConfig.label}
//               </div>

//               {/* Score Total */}
//               <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 p-6 rounded-2xl border-2 border-cyan-500/30 mb-8">
//                 <div className="text-center mb-4">
//                   <p className="text-xs font-bold text-cyan-400 uppercase mb-2">Score Total</p>
//                   <p className="text-6xl font-black text-cyan-400">{candidate.totalScore}</p>
//                   <p className="text-slate-500 font-bold">/100</p>
//                 </div>
//                 <div className="grid grid-cols-2 gap-3 text-xs">
//                   <div className="bg-black/40 p-3 rounded-lg backdrop-blur-sm border border-white/5">
//                     <p className="text-slate-500 uppercase font-bold mb-1">CV</p>
//                     <p className="text-white font-bold text-lg">{candidate.cvScore}/35</p>
//                   </div>
//                   <div className="bg-black/40 p-3 rounded-lg backdrop-blur-sm border border-white/5">
//                     <p className="text-slate-500 uppercase font-bold mb-1">Test</p>
//                     <p className="text-white font-bold text-lg">{candidate.testScore}/65</p>
//                   </div>
//                 </div>
//               </div>

//               {/* Contact */}
//               <div className="space-y-4 mb-8 text-left">
//                 <div className="flex items-center gap-3 text-sm text-slate-300">
//                   <Mail size={16} className="text-cyan-400"/>
//                   <a href={`mailto:${candidate.email}`} className="hover:text-cyan-400 transition-colors break-all">
//                     {candidate.email}
//                   </a>
//                 </div>
                
//                 <div className="flex items-center gap-3 text-sm text-slate-300">
//                   <Phone size={16} className="text-cyan-400"/>
//                   <a href={`tel:${candidate.phone}`} className="hover:text-cyan-400 transition-colors">
//                     {candidate.phone}
//                   </a>
//                 </div>
                
//                 <div className="flex items-center gap-3 text-sm text-slate-300">
//                   <Calendar size={16} className="text-cyan-400"/>
//                   <span>{new Date(candidate.createdAt).toLocaleDateString('fr-FR')}</span>
//                 </div>
//               </div>

//               {/* Download CV */}
//              <a 
//   href={candidate.resumeUrl.replace('/raw/upload/', '/raw/upload/fl_attachment/')} 
//   target="_blank" 
//   rel="noopener noreferrer"
//   download
//                 className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-xl transition-all flex items-center justify-center gap-2"
//               >
//                 <Download size={20} />
//                 Télécharger le CV
//               </a>
//             </div>
//           </motion.div>

//           {/* MAIN CONTENT */}
//           <motion.div 
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.1 }}
//             className="lg:col-span-2 space-y-6"
//           >
            
//             {/* POSTE VISÉ */}
//             <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
//               <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
//                 <Briefcase size={24} className="text-cyan-400"/>
//                 Poste visé
//               </h3>
              
//               <div className="space-y-4">
//                 <div>
//                   <p className="text-sm font-bold text-slate-500 mb-2 uppercase">Titre</p>
//                   <p className="text-2xl font-bold text-white">{candidate.jobOffer.title}</p>
//                 </div>
                
//                 <div className="flex flex-wrap gap-4">
//                   <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/5 flex items-center gap-2">
//                     <Briefcase size={16} className="text-purple-400"/>
//                     <span className="text-white font-medium">{candidate.jobOffer.department.name}</span>
//                   </div>
                  
//                   <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/5 flex items-center gap-2">
//                     <MapPin size={16} className="text-red-400"/>
//                     <span className="text-white font-medium">{candidate.jobOffer.location}</span>
//                   </div>
                  
//                   <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/5 flex items-center gap-2">
//                     <FileText size={16} className="text-orange-400"/>
//                     <span className="text-white font-medium">{candidate.jobOffer.type}</span>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* ANALYSE IA */}
//             <div className="bg-gradient-to-br from-cyan-950/50 to-blue-950/50 backdrop-blur-xl border-2 border-cyan-500/30 rounded-3xl p-8 shadow-2xl">
//               <h3 className="text-2xl font-bold mb-8 flex items-center gap-3 text-white">
//                 <BrainCircuit className="text-cyan-400" size={28}/> 
//                 Intelligence Artificielle
//               </h3>

//               {/* Raisonnement IA */}
//               {candidate.aiReasoning && (
//                 <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 p-6 rounded-2xl border border-emerald-500/30 mb-8">
//                   <div className="flex items-center gap-2 mb-3">
//                     <Sparkles size={20} className="text-emerald-400"/>
//                     <h4 className="font-bold text-emerald-400">Raisonnement IA</h4>
//                   </div>
//                   <p className="text-slate-300 leading-relaxed">{candidate.aiReasoning}</p>
//                 </div>
//               )}

//               {/* Forces / Faiblesses */}
//               {candidate.cvAnalysis && (
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
//                   <div className="bg-emerald-500/5 p-6 rounded-2xl border border-emerald-500/30">
//                     <h5 className="text-xs font-bold text-emerald-400 uppercase mb-4 flex items-center gap-2">
//                       <CheckCircle2 size={16}/>
//                       Points Forts
//                     </h5>
//                     <ul className="space-y-3">
//                       {candidate.cvAnalysis.strengths?.map((s: string, i: number) => (
//                         <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
//                           <Zap size={14} className="text-emerald-400 mt-1 shrink-0" />
//                           {s}
//                         </li>
//                       ))}
//                     </ul>
//                   </div>
                  
//                   <div className="bg-red-500/5 p-6 rounded-2xl border border-red-500/30">
//                     <h5 className="text-xs font-bold text-red-400 uppercase mb-4 flex items-center gap-2">
//                       <XCircle size={16}/>
//                       Points Faibles
//                     </h5>
//                     <ul className="space-y-3">
//                       {candidate.cvAnalysis.weaknesses?.map((w: string, i: number) => (
//                         <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
//                           <AlertTriangle size={14} className="text-red-400 mt-1 shrink-0" />
//                           {w}
//                         </li>
//                       ))}
//                     </ul>
//                   </div>
//                 </div>
//               )}

//               {/* Anti-triche */}
//               {(candidate.tabSwitchCount > 0 || candidate.suspiciousActivity) && (
//                 <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-2xl p-6 mb-8 flex items-start gap-4">
//                   <AlertTriangle size={24} className="text-yellow-400 shrink-0 mt-1" />
//                   <div>
//                     <h5 className="text-sm font-bold text-yellow-400 mb-2 uppercase">Activité Suspecte Détectée</h5>
//                     <p className="text-slate-300 text-sm leading-relaxed">
//                       {candidate.tabSwitchCount > 0 && `${candidate.tabSwitchCount} changement(s) d'onglet pendant le test. `}
//                       {candidate.suspiciousActivity && 'Comportement anormal signalé par le système.'}
//                     </p>
//                   </div>
//                 </div>
//               )}

//               {/* DÉCISION RH */}
//               <div className="pt-8 border-t border-white/10">
//                 <h4 className="text-xl font-bold mb-6 text-white flex items-center gap-3">
//                   <User size={24} className="text-purple-400"/>
//                   Votre Décision RH
//                 </h4>
                
//                 {hasOverride && (
//                   <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6 flex items-center gap-3">
//                     <AlertTriangle size={20} className="text-yellow-400 shrink-0"/>
//                     <p className="text-sm text-yellow-400 font-bold">
//                       Vous avez override la suggestion IA ({candidate.aiSuggestion} → {candidate.hrDecision})
//                     </p>
//                   </div>
//                 )}
                
//                 <div className="grid grid-cols-2 gap-4 mb-6">
//                   {Object.entries(DECISION_CONFIG).map(([key, config]) => {
//                     const Icon = config.icon;
//                     return (
//                       <button 
//                         key={key} 
//                         onClick={() => setHrDecision(key)} 
//                         className={`p-5 rounded-xl border-2 font-bold transition-all flex items-center justify-center gap-2 ${
//                           hrDecision === key 
//                             ? `bg-gradient-to-r ${config.color} border-white/30 text-white shadow-lg scale-105` 
//                             : 'border-white/10 text-slate-400 hover:border-white/30 bg-white/5'
//                         }`}
//                       >
//                         <Icon size={20}/>
//                         {config.label}
//                       </button>
//                     );
//                   })}
//                 </div>
                
//                 <textarea 
//                   className="w-full bg-white/5 border border-white/10 rounded-xl p-5 mb-6 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-cyan-500/50 outline-none min-h-[120px] resize-none backdrop-blur-sm" 
//                   placeholder="Vos observations et notes..." 
//                   value={hrNotes} 
//                   onChange={(e) => setHrNotes(e.target.value)} 
//                 />
                
//                 <button 
//                   onClick={handleSaveDecision} 
//                   disabled={!hrDecision || isSavingDecision} 
//                   className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-5 rounded-xl shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
//                 >
//                   {isSavingDecision ? (
//                     <Loader2 className="animate-spin" size={24} />
//                   ) : (
//                     <>
//                       <CheckCircle2 size={24} />
//                       Valider la Décision
//                     </>
//                   )}
//                 </button>
//               </div>
//             </div>

//             {/* LETTRE DE MOTIVATION */}
//             {candidate.coverLetter && (
//               <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
//                 <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
//                   <FileText size={24} className="text-cyan-400"/>
//                   Lettre de Motivation
//                 </h3>
                
//                 <div className="prose prose-invert max-w-none">
//                   <p className="text-slate-300 whitespace-pre-line leading-relaxed">
//                     {candidate.coverLetter}
//                   </p>
//                 </div>
//               </div>
//             )}

//           </motion.div>
//         </div>
//       </div>
//     </div>
//   );
// }





'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Mail, Phone, Calendar, Download, Loader2,
  CheckCircle2, XCircle, AlertTriangle, BrainCircuit, Sparkles,
  TrendingUp, Award, Target, Zap, FileText, MapPin, Briefcase, User,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/services/api';
import { ToastProvider, useToast } from '@/components/ui/useToast';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

type AIDecision = 'RETENU' | 'MOYENNE' | 'SECONDE_CHANCE' | 'REFUS';

interface CandidateIA {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  resumeUrl: string;
  additionalDocUrl?: string;
  coverLetter?: string;
  aiSuggestion: AIDecision;
  hrDecision?: AIDecision;
  hrNotes?: string;
  totalScore: number;
  cvScore: number;
  testScore: number;
  aiReasoning?: string;
  cvAnalysis?: { strengths: string[]; weaknesses: string[] };
  tabSwitchCount?: number;
  suspiciousActivity?: boolean;
  status: string;
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

const DECISION_CONFIG: Record<AIDecision, { label: string; gradient: string; icon: React.ElementType }> = {
  RETENU:        { label: 'Retenu',         gradient: 'from-emerald-500 to-emerald-600', icon: Award },
  MOYENNE:       { label: 'Moyen',          gradient: 'from-orange-500 to-orange-600',   icon: TrendingUp },
  SECONDE_CHANCE:{ label: 'Seconde Chance', gradient: 'from-purple-500 to-purple-600',   icon: Target },
  REFUS:         { label: 'Refusé',         gradient: 'from-red-500 to-red-600',         icon: XCircle },
};

// ─────────────────────────────────────────────
// INNER COMPONENT
// ─────────────────────────────────────────────

function DetailCandidatIAContent({ id }: { id: string }) {
  const router = useRouter();
  const toast = useToast();

  const [candidate, setCandidate] = useState<CandidateIA | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hrDecision, setHrDecision] = useState<AIDecision | null>(null);
  const [hrNotes, setHrNotes] = useState('');
  const [isSavingDecision, setIsSavingDecision] = useState(false);

  // Modal entretien
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);

  useEffect(() => { fetchCandidate(); }, [id]);

  const fetchCandidate = async () => {
    try {
      const data = await api.get<CandidateIA>(`/recruitment/candidates/${id}`);
      setCandidate(data);
      if (data.hrDecision) { setHrDecision(data.hrDecision); setHrNotes(data.hrNotes || ''); }
      if (data.interviewDate) {
        setInterviewDate(new Date(data.interviewDate).toISOString().slice(0, 16));
        setInterviewNotes(data.interviewNotes || '');
      }
    } catch {
      toast.error('Erreur', 'Impossible de charger le candidat');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDecision = async () => {
    if (!hrDecision) { toast.warning('Attention', 'Choisissez une décision avant de valider'); return; }
    setIsSavingDecision(true);
    try {
      await api.patch(`/recruitment/candidates/${id}/hr-decision`, { hrDecision, hrNotes });
      toast.success('Décision enregistrée !', 'La décision RH a été sauvegardée avec succès.');
      fetchCandidate();
    } catch (e: any) {
      toast.error('Erreur', e?.message || 'Une erreur est survenue');
    } finally {
      setIsSavingDecision(false);
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

  // ── LOADING ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-cyan-500 blur-2xl opacity-20 animate-pulse rounded-full" />
          <Loader2 className="animate-spin text-cyan-500 relative z-10" size={48} />
        </div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-4">
        <XCircle size={64} className="text-red-500 mb-6" />
        <h1 className="text-2xl font-bold text-white mb-4">Candidat introuvable</h1>
        <Link href="/recrutement/ia/candidats" className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-colors">
          Retour au Pipeline
        </Link>
      </div>
    );
  }

  const aiConfig = DECISION_CONFIG[candidate.aiSuggestion];
  const AIIcon = aiConfig.icon;
  const hasOverride = candidate.hrDecision && candidate.hrDecision !== candidate.aiSuggestion;
  const isInInterview = candidate.status === 'INTERVIEW';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">

      {/* BG Glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* ── MODAL ENTRETIEN ── */}
      {showInterviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-purple-500/30 rounded-3xl p-8 max-w-md w-full shadow-2xl"
          >
            <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-3">
              <Calendar className="text-purple-400" size={22} />
              {isInInterview ? 'Modifier l\'entretien' : 'Planifier un entretien'}
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              Pour <span className="text-white font-medium">{candidate.firstName} {candidate.lastName}</span>
            </p>

            <div className="space-y-4 mb-8">
              <div>
                <label className="text-sm font-bold text-slate-300 mb-2 block">Date et heure</label>
                <input
                  type="datetime-local"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500/40 outline-none transition-all"
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-300 mb-2 block">Notes (lieu, modalités…)</label>
                <textarea
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-purple-500/40 outline-none resize-none min-h-[80px] transition-all"
                  placeholder="Ex : Entretien en présentiel, bâtiment A, 2e étage…"
                  value={interviewNotes}
                  onChange={(e) => setInterviewNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowInterviewModal(false)}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleScheduleInterview}
                disabled={isScheduling}
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
              >
                {isScheduling ? <Loader2 className="animate-spin" size={18} /> : <Calendar size={18} />}
                Confirmer
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <div className="max-w-7xl mx-auto py-8 px-4 relative z-10">

        {/* HEADER */}
        <div className="flex items-center gap-4 mb-10">
          <button
            onClick={() => router.back()}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-2xl font-black text-white">{candidate.firstName} {candidate.lastName}</h1>
              <div className="px-3 py-1 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center gap-1.5">
                <BrainCircuit size={13} className="text-cyan-400" />
                <span className="text-xs font-bold text-cyan-400">Analyse IA</span>
              </div>
              {isInInterview && (
                <div className="px-3 py-1 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center gap-1.5">
                  <Calendar size={13} className="text-purple-400" />
                  <span className="text-xs font-bold text-purple-400">En entretien</span>
                </div>
              )}
            </div>
            <p className="text-slate-400 text-sm">
              Postulé le {new Date(candidate.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── SIDEBAR ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-1">
            <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl text-center sticky top-8">

              {/* Avatar */}
              <div className="w-24 h-24 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 shadow-2xl shadow-cyan-500/20">
                {candidate.firstName[0]}{candidate.lastName[0]}
              </div>

              <h2 className="text-xl font-bold text-white mb-1">{candidate.firstName} {candidate.lastName}</h2>

              {/* Badge IA suggestion */}
              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gradient-to-r ${aiConfig.gradient} text-white font-bold text-sm mt-2 mb-6 shadow-lg`}>
                <AIIcon size={15} />
                {aiConfig.label}
              </div>

              {/* Score */}
              <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 p-5 rounded-2xl border-2 border-cyan-500/30 mb-5">
                <p className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">Score Total</p>
                <p className="text-5xl font-black text-cyan-400">{candidate.totalScore}</p>
                <p className="text-slate-500 text-sm mb-3">/100</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-black/40 p-2 rounded-lg border border-white/5">
                    <p className="text-slate-500 mb-0.5">CV</p>
                    <p className="text-white font-bold">{candidate.cvScore}<span className="text-slate-600">/35</span></p>
                  </div>
                  <div className="bg-black/40 p-2 rounded-lg border border-white/5">
                    <p className="text-slate-500 mb-0.5">Test</p>
                    <p className="text-white font-bold">{candidate.testScore}<span className="text-slate-600">/65</span></p>
                  </div>
                </div>
              </div>

              {/* Entretien planifié */}
              {candidate.interviewDate && (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 mb-5 text-left">
                  <p className="text-xs font-bold text-purple-400 mb-1 flex items-center gap-1.5">
                    <Calendar size={11} /> Entretien planifié
                  </p>
                  <p className="text-sm text-white font-medium">
                    {new Date(candidate.interviewDate).toLocaleDateString('fr-FR', {
                      weekday: 'short', day: 'numeric', month: 'short',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                  {candidate.interviewNotes && (
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{candidate.interviewNotes}</p>
                  )}
                </div>
              )}

              {/* Contact */}
              <div className="space-y-3 mb-6 text-left">
                <a href={`mailto:${candidate.email}`} className="flex items-center gap-3 text-sm text-slate-300 hover:text-cyan-400 transition-colors">
                  <Mail size={14} className="text-cyan-400 shrink-0" />
                  <span className="break-all">{candidate.email}</span>
                </a>
                <a href={`tel:${candidate.phone}`} className="flex items-center gap-3 text-sm text-slate-300 hover:text-cyan-400 transition-colors">
                  <Phone size={14} className="text-cyan-400 shrink-0" />
                  <span>{candidate.phone}</span>
                </a>
              </div>

              {/* Bouton entretien */}
              <button
                onClick={() => setShowInterviewModal(true)}
                className="w-full py-3 mb-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <Calendar size={17} />
                {isInInterview ? 'Modifier l\'entretien' : 'Planifier un entretien'}
              </button>

              {/* ── Documents téléchargeables ── */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">Documents</p>

                {/* CV */}
                <a
                  href={candidate.resumeUrl.replace('/raw/upload/', '/raw/upload/fl_attachment/')}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <Download size={17} /> Télécharger le CV
                </a>

                {/* Document additionnel */}
                {candidate.additionalDocUrl && (
                  <a
                    href={candidate.additionalDocUrl.replace('/raw/upload/', '/raw/upload/fl_attachment/')}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                  >
                    <Download size={17} /> Télécharger le document joint
                  </a>
                )}
              </div>
            </div>
          </motion.div>

          {/* ── MAIN ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 space-y-6">

            {/* Poste */}
            <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-white/10 rounded-3xl p-7 shadow-2xl">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Briefcase size={18} className="text-cyan-400" /> Poste visé
              </h3>
              <p className="text-xl font-bold text-white mb-4">{candidate.jobOffer.title}</p>
              <div className="flex flex-wrap gap-2.5">
                <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 text-sm text-slate-300">
                  <Briefcase size={13} className="text-purple-400" /> {candidate.jobOffer.department.name}
                </span>
                <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 text-sm text-slate-300">
                  <MapPin size={13} className="text-red-400" /> {candidate.jobOffer.location}
                </span>
                <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 text-sm text-slate-300">
                  <FileText size={13} className="text-orange-400" /> {candidate.jobOffer.type}
                </span>
              </div>
            </div>

            {/* Analyse IA */}
            <div className="bg-gradient-to-br from-cyan-950/50 to-blue-950/50 backdrop-blur-xl border-2 border-cyan-500/30 rounded-3xl p-7 shadow-2xl">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-3 text-white">
                <BrainCircuit className="text-cyan-400" size={24} /> Intelligence Artificielle
              </h3>

              {/* Raisonnement */}
              {candidate.aiReasoning && (
                <div className="bg-emerald-500/10 p-5 rounded-2xl border border-emerald-500/30 mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={16} className="text-emerald-400" />
                    <h4 className="font-bold text-emerald-400 text-sm">Raisonnement IA</h4>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-sm">{candidate.aiReasoning}</p>
                </div>
              )}

              {/* Forces / Faiblesses */}
              {candidate.cvAnalysis && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                  <div className="bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/20">
                    <h5 className="text-xs font-bold text-emerald-400 uppercase mb-3 flex items-center gap-1.5">
                      <CheckCircle2 size={12} /> Points Forts
                    </h5>
                    <ul className="space-y-1.5">
                      {candidate.cvAnalysis.strengths?.map((s, i) => (
                        <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                          <Zap size={12} className="text-emerald-400 mt-0.5 shrink-0" />{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-red-500/5 p-4 rounded-2xl border border-red-500/20">
                    <h5 className="text-xs font-bold text-red-400 uppercase mb-3 flex items-center gap-1.5">
                      <XCircle size={12} /> Points Faibles
                    </h5>
                    <ul className="space-y-1.5">
                      {candidate.cvAnalysis.weaknesses?.map((w, i) => (
                        <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                          <AlertTriangle size={12} className="text-red-400 mt-0.5 shrink-0" />{w}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Activité suspecte */}
              {((candidate.tabSwitchCount ?? 0) > 0 || candidate.suspiciousActivity) && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 mb-5 flex items-start gap-3">
                  <AlertTriangle size={20} className="text-yellow-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-yellow-400 mb-1">Activité Suspecte Détectée</p>
                    <p className="text-slate-300 text-sm">
                      {(candidate.tabSwitchCount ?? 0) > 0 && `${candidate.tabSwitchCount} changement(s) d'onglet pendant le test. `}
                      {candidate.suspiciousActivity && 'Comportement anormal détecté.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Décision RH */}
              <div className="pt-6 border-t border-white/10">
                <h4 className="text-base font-bold mb-5 text-white flex items-center gap-2">
                  <User size={18} className="text-purple-400" /> Décision RH
                </h4>

                {hasOverride && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3.5 mb-5 flex items-center gap-3">
                    <AlertTriangle size={17} className="text-yellow-400 shrink-0" />
                    <p className="text-sm text-yellow-400 font-bold">
                      Override actif : {candidate.aiSuggestion} → {candidate.hrDecision}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2.5 mb-5">
                  {(Object.entries(DECISION_CONFIG) as [AIDecision, typeof DECISION_CONFIG[AIDecision]][]).map(([key, config]) => {
                    const Icon = config.icon;
                    const isActive = hrDecision === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setHrDecision(key)}
                        className={`p-4 rounded-xl border-2 font-bold transition-all flex items-center justify-center gap-2 text-sm ${
                          isActive
                            ? `bg-gradient-to-r ${config.gradient} border-white/20 text-white shadow-lg scale-[1.03]`
                            : 'border-white/10 text-slate-400 hover:border-white/25 bg-white/5 hover:bg-white/8'
                        }`}
                      >
                        <Icon size={17} />{config.label}
                      </button>
                    );
                  })}
                </div>

                <textarea
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 mb-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-cyan-500/40 outline-none min-h-[90px] resize-none transition-all text-sm"
                  placeholder="Notes RH (facultatif)…"
                  value={hrNotes}
                  onChange={(e) => setHrNotes(e.target.value)}
                />

                <button
                  onClick={handleSaveDecision}
                  disabled={!hrDecision || isSavingDecision}
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 rounded-xl shadow-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
                >
                  {isSavingDecision ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                  Valider la Décision RH
                </button>
              </div>
            </div>

            {/* Lettre de motivation */}
            {candidate.coverLetter && (
              <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-white/10 rounded-3xl p-7 shadow-2xl">
                <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <FileText size={18} className="text-cyan-400" /> Lettre de Motivation
                </h3>
                <p className="text-slate-300 whitespace-pre-line leading-relaxed text-sm">
                  {candidate.coverLetter}
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// EXPORT — ToastProvider local à cette page
// ─────────────────────────────────────────────

export default function DetailCandidatIAPage({ params }: { params: { id: string } }) {
  return (
    <ToastProvider>
      <DetailCandidatIAContent id={params.id} />
    </ToastProvider>
  );
}