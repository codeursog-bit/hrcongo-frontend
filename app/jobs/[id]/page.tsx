// 'use client';

// import React, { useState, useEffect } from 'react';
// import { useParams, useRouter } from 'next/navigation';
// import Link from 'next/link';
// import Image from 'next/image';
// import { 
//   MapPin, Clock, Briefcase, Building2, Calendar, DollarSign, 
//   Share2, Loader2, AlertCircle, ChevronRight, Facebook, 
//   Linkedin, Twitter, MessageCircle, Copy, Check, ArrowLeft, Sparkles, Users
// } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';

// interface JobDetail {
//   id: string;
//   title: string;
//   description: string;
//   requirements: string | null;
//   location: string;
//   type: string;
//   companyId: string; // ✅ AJOUT
//   processingMode: 'MANUAL' | 'AI_ASSISTED';
//   imageUrl: string | null;
//   salaryMin: number | null;
//   salaryMax: number | null;
//   salaryCurrency: string;
//   requiredSkills: string[];
//   minExperience: number | null;
//   educationLevel: string | null;
//   expirationDate: string | null;
//   isExpired: boolean;
//   createdAt: string;
//   company: {
//     legalName: string;
//     logo: string | null;
//     careerPageLogo: string | null;
//     industry: string | null;
//     city: string | null;
//   };
//   department: {
//     name: string;
//   } | null;
// }

// export default function JobDetailPage() {
//   const params = useParams();
//   const router = useRouter();
//   const jobId = params.id as string;

//   const [job, setJob] = useState<JobDetail | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [showShareModal, setShowShareModal] = useState(false);
//   const [isCopied, setIsCopied] = useState(false);

//   useEffect(() => {
//     fetchJobDetail();
//   }, [jobId]);

//   const fetchJobDetail = async () => {
//     try {
//       const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/jobs/${jobId}?source=direct`);
      
//       if (!response.ok) throw new Error('Offre introuvable');
      
//       const data = await response.json();
//       setJob(data);
//     } catch (error) {
//       console.error('Erreur chargement offre:', error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleCopyLink = () => {
//     navigator.clipboard.writeText(window.location.href);
//     setIsCopied(true);
//     setTimeout(() => setIsCopied(false), 2000);
//   };

//   const getSalaryRange = () => {
//     if (!job || !job.salaryMin || !job.salaryMax) return null;
//     return `${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()} ${job.salaryCurrency}`;
//   };

//   const getDaysRemaining = () => {
//     if (!job?.expirationDate) return null;
//     const now = new Date();
//     const expiration = new Date(job.expirationDate);
//     const diffTime = expiration.getTime() - now.getTime();
//     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
//     return diffDays > 0 ? diffDays : 0;
//   };

//   if (isLoading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
//         <Loader2 className="animate-spin text-blue-500" size={64} />
//       </div>
//     );
//   }

//   if (!job) {
//     return (
//       <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
//         <AlertCircle className="text-red-500 mb-4" size={64} />
//         <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Offre introuvable</h1>
//         <p className="text-slate-500 dark:text-slate-400 mb-6">Cette offre n'existe pas ou a été retirée.</p>
//         <Link href="/jobs/portal" className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl">
//           Retour au portail
//         </Link>
//       </div>
//     );
//   }

//   const salaryRange = getSalaryRange();
//   const daysRemaining = getDaysRemaining();
//   const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

//   return (
//     <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      
//       {/* SHARE MODAL */}
//       <AnimatePresence>
//         {showShareModal && (
//           <motion.div 
//             initial={{ opacity: 0 }} 
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
//             onClick={() => setShowShareModal(false)}
//           >
//             <motion.div 
//               initial={{ scale: 0.9 }} 
//               animate={{ scale: 1 }}
//               className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl"
//               onClick={(e) => e.stopPropagation()}
//             >
//               <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Partager cette offre</h3>
              
//               <div className="grid grid-cols-2 gap-4 mb-6">
//                 <a
//                   href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="flex items-center justify-center gap-2 px-4 py-3 bg-[#0A66C2] hover:bg-[#004182] text-white rounded-xl font-bold transition-colors"
//                 >
//                   <Linkedin size={20} />
//                   LinkedIn
//                 </a>
                
//                 <a
//                   href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(job.title)}`}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1DA1F2] hover:bg-[#0C85D0] text-white rounded-xl font-bold transition-colors"
//                 >
//                   <Twitter size={20} />
//                   Twitter
//                 </a>
                
//                 <a
//                   href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1877F2] hover:bg-[#0C63D4] text-white rounded-xl font-bold transition-colors"
//                 >
//                   <Facebook size={20} />
//                   Facebook
//                 </a>
                
//                 <a
//                   href={`https://wa.me/?text=${encodeURIComponent(job.title + ' - ' + shareUrl)}`}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] hover:bg-[#1EBE57] text-white rounded-xl font-bold transition-colors"
//                 >
//                   <MessageCircle size={20} />
//                   WhatsApp
//                 </a>
//               </div>

//               <div className="bg-slate-100 dark:bg-slate-900 rounded-xl p-4 flex items-center gap-3">
//                 <input 
//                   type="text" 
//                   value={shareUrl}
//                   readOnly
//                   className="flex-1 bg-transparent outline-none text-sm text-slate-600 dark:text-slate-400 font-mono"
//                 />
//                 <button
//                   onClick={handleCopyLink}
//                   className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold transition-colors flex items-center gap-2"
//                 >
//                   {isCopied ? <Check size={16} /> : <Copy size={16} />}
//                   {isCopied ? 'Copié' : 'Copier'}
//                 </button>
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* HEADER IMAGE */}
//       {job.imageUrl && (
//         <div className="relative h-96 overflow-hidden">
//           <Image 
//             src={job.imageUrl} 
//             alt={job.title} 
//             fill
//             className="object-cover"
//           />
//           <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
//         </div>
//       )}

//       <div className="max-w-5xl mx-auto px-4 py-12">
        
//         {/* BACK BUTTON */}
//         <button
//           onClick={() => router.back()}
//           className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium mb-8 transition-colors"
//         >
//           <ArrowLeft size={20} />
//           Retour aux offres
//         </button>

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
//           {/* MAIN CONTENT */}
//           <div className="lg:col-span-2 space-y-8">
            
//             {/* TITLE & COMPANY */}
//             <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-lg border border-slate-200 dark:border-slate-700">
//               <div className="flex items-start gap-6 mb-6">
//                 {(job.company.careerPageLogo || job.company.logo) && (
//                   <div className="shrink-0">
//                     <Image 
//                       src={job.company.careerPageLogo || job.company.logo!} 
//                       alt={job.company.legalName} 
//                       width={80}
//                       height={80}
//                       className="rounded-2xl border-2 border-slate-200 dark:border-slate-700"
//                     />
//                   </div>
//                 )}
//                 <div className="flex-1">
//                   <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-3">
//                     {job.title}
//                   </h1>
//                   <Link
//                     href={`/company/${job.companyId}/jobs`}
//                     className="text-xl font-bold text-blue-600 dark:text-cyan-400 hover:underline"
//                   >
//                     {job.company.legalName}
//                   </Link>
//                   {job.company.industry && (
//                     <p className="text-slate-500 dark:text-slate-400 mt-1">{job.company.industry}</p>
//                   )}
//                 </div>
//               </div>

//               <div className="flex flex-wrap gap-3 mb-6">
//                 <span className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl flex items-center gap-2">
//                   <MapPin size={18} className="text-red-500" />
//                   {job.location}
//                 </span>
//                 <span className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl flex items-center gap-2">
//                   <Clock size={18} className="text-green-500" />
//                   {job.type}
//                 </span>
//                 {job.department && (
//                   <span className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl flex items-center gap-2">
//                     <Briefcase size={18} className="text-purple-500" />
//                     {job.department.name}
//                   </span>
//                 )}
//                 {salaryRange && (
//                   <span className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-bold rounded-xl flex items-center gap-2">
//                     <DollarSign size={18} />
//                     {salaryRange}
//                   </span>
//                 )}
//               </div>

//               {/* EXPIRATION WARNING */}
//               {job.isExpired && (
//                 <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-2xl p-6 mb-6">
//                   <div className="flex items-center gap-3">
//                     <AlertCircle className="text-red-500" size={24} />
//                     <div>
//                       <p className="font-black text-red-600 dark:text-red-400 text-lg">Offre Expirée</p>
//                       <p className="text-red-600 dark:text-red-400 text-sm">Cette offre n'est plus disponible</p>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 7 && (
//                 <div className="bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-400 rounded-2xl p-4 mb-6">
//                   <p className="text-orange-600 dark:text-orange-400 font-bold flex items-center gap-2">
//                     <Calendar size={18} />
//                     Expire dans {daysRemaining} jour{daysRemaining > 1 ? 's' : ''}
//                   </p>
//                 </div>
//               )}

//               {/* ACTIONS */}
//               <div className="flex gap-4">
//                 {!job.isExpired && (
//                   <Link
//                     href={job.processingMode === 'AI_ASSISTED' ? `/jobs/ia/${job.id}` : `/jobs/manuel/${job.id}`}
//                     className="flex-1 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-black text-lg rounded-2xl shadow-2xl transition-all hover:scale-[1.02] flex items-center justify-center gap-3"
//                   >
//                     Postuler Maintenant <ChevronRight size={24} />
//                   </Link>
//                 )}
//                 <button
//                   onClick={() => setShowShareModal(true)}
//                   className="px-6 py-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-bold rounded-2xl transition-colors flex items-center gap-2"
//                 >
//                   <Share2 size={20} />
//                   Partager
//                 </button>
//               </div>
//             </div>

//             {/* DESCRIPTION */}
//             <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-lg border border-slate-200 dark:border-slate-700">
//               <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Description du Poste</h2>
//               <div className="prose prose-slate dark:prose-invert max-w-none">
//                 <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
//                   {job.description}
//                 </p>
//               </div>
//             </div>

//             {/* REQUIREMENTS */}
//             {job.requirements && (
//               <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-lg border border-slate-200 dark:border-slate-700">
//                 <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Prérequis & Qualifications</h2>
//                 <div className="prose prose-slate dark:prose-invert max-w-none">
//                   <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
//                     {job.requirements}
//                   </p>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* SIDEBAR */}
//           <div className="lg:col-span-1 space-y-6">
            
//             {/* SKILLS */}
//             {job.requiredSkills.length > 0 && (
//               <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 sticky top-8">
//                 <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4">Compétences Requises</h3>
//                 <div className="flex flex-wrap gap-2">
//                   {job.requiredSkills.map((skill, idx) => (
//                     <span 
//                       key={idx} 
//                       className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold rounded-xl text-sm"
//                     >
//                       {skill}
//                     </span>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* DETAILS */}
//             <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
//               <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4">Détails</h3>
//               <div className="space-y-4">
//                 {job.minExperience !== null && (
//                   <div className="flex justify-between items-center">
//                     <span className="text-slate-500 dark:text-slate-400">Expérience</span>
//                     <span className="font-bold text-slate-900 dark:text-white">{job.minExperience}+ ans</span>
//                   </div>
//                 )}
//                 {job.educationLevel && (
//                   <div className="flex justify-between items-center">
//                     <span className="text-slate-500 dark:text-slate-400">Formation</span>
//                     <span className="font-bold text-slate-900 dark:text-white">{job.educationLevel}</span>
//                   </div>
//                 )}
//                 <div className="flex justify-between items-center">
//                   <span className="text-slate-500 dark:text-slate-400">Publié le</span>
//                   <span className="font-bold text-slate-900 dark:text-white">
//                     {new Date(job.createdAt).toLocaleDateString('fr-FR')}
//                   </span>
//                 </div>
//                 <div className="flex justify-between items-center">
//                   <span className="text-slate-500 dark:text-slate-400">Mode</span>
//                   <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
//                     {job.processingMode === 'AI_ASSISTED' ? (
//                       <>
//                         <Sparkles size={16} className="text-cyan-400" />
//                         IA
//                       </>
//                     ) : (
//                       <>
//                         <Users size={16} className="text-blue-500" />
//                         Manuel
//                       </>
//                     )}
//                   </span>
//                 </div>
//               </div>
//             </div>

//             {/* COMPANY LINK */}
//             <Link
//               href={`/company/${job.companyId}/jobs`}
//               className="block bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-3xl p-6 hover:shadow-lg transition-all"
//             >
//               <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-2">Voir toutes les offres de</p>
//               <p className="text-xl font-black text-blue-600 dark:text-cyan-400 flex items-center gap-2">
//                 {job.company.legalName} <ChevronRight size={20} />
//               </p>
//             </Link>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }







'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin, Clock, Briefcase, Building2, Calendar, DollarSign,
  Share2, Loader2, AlertCircle, ChevronRight, ArrowLeft,
  Linkedin, Twitter, Facebook, MessageCircle, Copy, Check,
  BookmarkPlus, Users, GraduationCap, ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

interface JobDetail {
  id: string;
  title: string;
  description: string;
  requirements: string | null;
  location: string;
  type: string;
  processingMode: 'MANUAL' | 'AI_ASSISTED';
  imageUrl: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  requiredSkills: string[];
  minExperience: number | null;
  educationLevel: string | null;
  expirationDate: string | null;
  isExpired: boolean;
  createdAt: string;
  company: {
    id: string;
    legalName: string;
    slug: string;
    logo: string | null;
    careerPageLogo: string | null;
    careerPageBanner: string | null;
    industry: string | null;
    city: string | null;
  };
  department: { name: string } | null;
}

// ─────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [job, setJob] = useState<JobDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { fetchJob(); }, [jobId]);

  const fetchJob = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/jobs/${jobId}`);
      if (!res.ok) throw new Error('404');
      setJob(await res.json());
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSalary = () => {
    if (!job?.salaryMin) return null;
    if (job.salaryMax) return `${job.salaryMin.toLocaleString()} – ${job.salaryMax.toLocaleString()} ${job.salaryCurrency}`;
    return `${job.salaryMin.toLocaleString()} ${job.salaryCurrency}`;
  };

  const getDaysRemaining = () => {
    if (!job?.expirationDate) return null;
    const diff = Math.ceil((new Date(job.expirationDate).getTime() - Date.now()) / 86400000);
    return diff > 0 ? diff : 0;
  };

  const postedAgo = () => {
    if (!job) return '';
    const days = Math.floor((Date.now() - new Date(job.createdAt).getTime()) / 86400000);
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return 'Hier';
    if (days < 7) return `il y a ${days} jours`;
    if (days < 30) return `il y a ${Math.floor(days / 7)} semaine${days > 13 ? 's' : ''}`;
    return new Date(job.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  };

  // ── LOADING
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-cyan-500" size={40} />
      </div>
    );
  }

  // ── NOT FOUND
  if (!job) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle size={48} className="text-red-400 mb-5" />
        <h1 className="text-2xl font-bold text-white mb-2">Offre introuvable</h1>
        <p className="text-slate-500 mb-6">Cette offre n'existe plus ou a été retirée.</p>
        <Link href="/jobs/portal" className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium text-sm transition-colors">
          Retour aux offres
        </Link>
      </div>
    );
  }

  const salary = getSalary();
  const daysLeft = getDaysRemaining();
  const applyHref = job.processingMode === 'AI_ASSISTED' ? `/jobs/ia/${job.id}` : `/jobs/manuel/${job.id}`;
  const companyHref = `/companies/${job.company.slug || job.company.id}`;

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ── MODAL PARTAGE ── */}
      <AnimatePresence>
        {showShare && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowShare(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.92, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <h3 className="font-bold text-white mb-5 text-base">Partager cette offre</h3>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  { icon: Linkedin, label: 'LinkedIn', color: '#0A66C2', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}` },
                  { icon: Twitter, label: 'Twitter / X', color: '#1DA1F2', href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(job.title)}` },
                  { icon: Facebook, label: 'Facebook', color: '#1877F2', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` },
                  { icon: MessageCircle, label: 'WhatsApp', color: '#25D366', href: `https://wa.me/?text=${encodeURIComponent(job.title + ' – ' + shareUrl)}` },
                ].map(({ icon: Icon, label, color, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 px-4 py-3 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-80"
                    style={{ backgroundColor: color + '20', border: `1px solid ${color}40` }}
                  >
                    <Icon size={18} style={{ color }} />
                    {label}
                  </a>
                ))}
              </div>
              <div className="flex items-center gap-2 bg-slate-800 rounded-xl p-3">
                <p className="flex-1 text-xs text-slate-400 font-mono truncate">{shareUrl}</p>
                <button
                  onClick={handleCopy}
                  className="shrink-0 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  {copied ? <><Check size={12} />Copié</> : <><Copy size={12} />Copier</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft size={16} /> Retour
            </button>
            <div className="hidden sm:block h-4 w-px bg-slate-800" />
            <Link href="/" className="hidden sm:block text-sm font-black">
              RH<span className="text-cyan-400">Konza</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSaved(s => !s)}
              className={`p-2.5 rounded-xl border transition-all text-sm ${saved ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400' : 'border-slate-800 text-slate-500 hover:text-white hover:border-slate-600'}`}
            >
              <BookmarkPlus size={16} />
            </button>
            <button
              onClick={() => setShowShare(true)}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-800 hover:border-slate-600 text-slate-400 hover:text-white rounded-xl text-sm transition-all"
            >
              <Share2 size={14} /> Partager
            </button>
          </div>
        </div>
      </header>

      {/* ── IMAGE COVER ── */}
      {(job.imageUrl || job.company.careerPageBanner) && (
        <div className="relative h-56 sm:h-72 overflow-hidden">
          <Image
            src={job.imageUrl || job.company.careerPageBanner!}
            alt={job.title}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        </div>
      )}

      {/* ── MAIN ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── COLONNE PRINCIPALE ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Bloc titre + infos + CTA */}
            <div>
              {/* Breadcrumb entreprise */}
              <div className="flex items-center gap-2.5 mb-4">
                {(job.company.careerPageLogo || job.company.logo) && (
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                    <Image
                      src={job.company.careerPageLogo || job.company.logo!}
                      alt={job.company.legalName}
                      width={40} height={40}
                      className="object-contain"
                    />
                  </div>
                )}
                <Link href={companyHref} className="text-sm font-bold text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1">
                  {job.company.legalName}
                  <ChevronRight size={14} />
                </Link>
              </div>

              {/* Titre */}
              <h1 className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight tracking-tight">
                {job.title}
              </h1>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-300 text-sm rounded-xl">
                  <Clock size={14} className="text-slate-500" />{job.type}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-300 text-sm rounded-xl">
                  <MapPin size={14} className="text-slate-500" />{job.location}
                </span>
                {job.department && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-300 text-sm rounded-xl">
                    <Briefcase size={14} className="text-slate-500" />{job.department.name}
                  </span>
                )}
                {salary && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium rounded-xl">
                    <DollarSign size={14} />{salary}
                  </span>
                )}
              </div>

              {/* Méta */}
              <div className="flex items-center gap-3 text-xs text-slate-600 mb-6">
                <span className="flex items-center gap-1"><Calendar size={12} /> Publiée {postedAgo()}</span>
                {daysLeft !== null && daysLeft <= 7 && daysLeft > 0 && (
                  <span className="text-amber-500 font-medium">· Expire dans {daysLeft}j</span>
                )}
                {job.isExpired && <span className="text-red-500 font-medium">· Offre expirée</span>}
              </div>

              {/* Alertes */}
              {job.isExpired && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-5 flex items-center gap-3">
                  <AlertCircle size={18} className="text-red-400 shrink-0" />
                  <p className="text-sm text-red-400 font-medium">Cette offre n'est plus disponible aux candidatures.</p>
                </div>
              )}

              {/* CTA postuler */}
              {!job.isExpired && (
                <Link
                  href={applyHref}
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all text-sm shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 hover:-translate-y-0.5 active:translate-y-0"
                >
                  Postuler à cette offre <ChevronRight size={16} />
                </Link>
              )}
            </div>

            {/* Description */}
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 sm:p-7">
              <h2 className="text-lg font-bold text-white mb-4">Description du poste</h2>
              <div className="text-slate-300 leading-relaxed whitespace-pre-wrap text-sm space-y-3">
                {job.description}
              </div>
            </div>

            {/* Prérequis */}
            {job.requirements && (
              <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 sm:p-7">
                <h2 className="text-lg font-bold text-white mb-4">Profil recherché</h2>
                <div className="text-slate-300 leading-relaxed whitespace-pre-wrap text-sm">
                  {job.requirements}
                </div>
              </div>
            )}

            {/* Compétences */}
            {job.requiredSkills.length > 0 && (
              <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 sm:p-7">
                <h2 className="text-lg font-bold text-white mb-4">Compétences requises</h2>
                <div className="flex flex-wrap gap-2">
                  {job.requiredSkills.map((s, i) => (
                    <span key={i} className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-xl">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* FAQ-style */}
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 sm:p-7">
              <h2 className="text-lg font-bold text-white mb-4">Questions fréquentes</h2>
              <div className="space-y-4 text-sm">
                {[
                  { q: 'Un CV est-il obligatoire ?', a: 'Oui, votre CV est requis pour postuler.' },
                  { q: 'Quel est le type de contrat ?', a: job.type },
                  ...(job.minExperience !== null ? [{ q: "Expérience requise ?", a: `${job.minExperience}+ ans d'expérience` }] : []),
                  ...(job.educationLevel ? [{ q: 'Niveau d\'études requis ?', a: job.educationLevel }] : []),
                ].map(({ q, a }) => (
                  <div key={q} className="border-b border-slate-800 pb-4 last:border-0 last:pb-0">
                    <p className="font-medium text-white mb-1">{q}</p>
                    <p className="text-slate-400">{a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── SIDEBAR ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">

              {/* CTA sidebar */}
              {!job.isExpired && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <p className="text-sm text-slate-400 mb-3 font-medium">Cette offre vous intéresse ?</p>
                  <Link
                    href={applyHref}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all text-sm shadow-lg shadow-cyan-500/15 hover:-translate-y-0.5"
                  >
                    Postuler maintenant
                  </Link>
                  <button
                    onClick={() => setSaved(s => !s)}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 mt-2.5 rounded-xl text-sm font-medium border transition-all ${
                      saved
                        ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400'
                        : 'border-slate-800 text-slate-500 hover:text-white hover:border-slate-600'
                    }`}
                  >
                    <BookmarkPlus size={15} />
                    {saved ? 'Sauvegardée' : 'Sauvegarder'}
                  </button>
                </div>
              )}

              {/* Infos pratiques */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-4">Informations pratiques</h3>
                <div className="space-y-3">
                  {[
                    { icon: Clock, label: 'Contrat', value: job.type },
                    { icon: MapPin, label: 'Lieu', value: job.location },
                    ...(job.department ? [{ icon: Briefcase, label: 'Département', value: job.department.name }] : []),
                    ...(salary ? [{ icon: DollarSign, label: 'Salaire', value: salary }] : []),
                    ...(job.minExperience !== null ? [{ icon: Users, label: 'Expérience', value: `${job.minExperience}+ ans` }] : []),
                    ...(job.educationLevel ? [{ icon: GraduationCap, label: 'Formation', value: job.educationLevel }] : []),
                    { icon: Calendar, label: 'Publiée', value: postedAgo() },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-3">
                      <Icon size={15} className="text-slate-600 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-slate-600">{label}</p>
                        <p className="text-sm text-slate-300 font-medium truncate">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lien entreprise */}
              <Link
                href={companyHref}
                className="group flex items-center gap-4 bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-2xl p-4 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                  {(job.company.careerPageLogo || job.company.logo) ? (
                    <Image
                      src={job.company.careerPageLogo || job.company.logo!}
                      alt={job.company.legalName}
                      width={48} height={48}
                      className="object-contain"
                    />
                  ) : (
                    <Building2 size={20} className="text-slate-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500 mb-0.5">Voir toutes les offres de</p>
                  <p className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors truncate">{job.company.legalName}</p>
                  {job.company.industry && <p className="text-xs text-slate-600 truncate">{job.company.industry}</p>}
                </div>
                <ExternalLink size={14} className="text-slate-700 group-hover:text-cyan-400 transition-colors shrink-0" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}