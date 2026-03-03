
// 'use client';

// import React, { useState, useEffect } from 'react';
// import { useParams } from 'next/navigation';
// import Link from 'next/link';
// import Image from 'next/image';
// import { MapPin, Clock, Briefcase, ChevronRight, Loader2, Building2, Users, DollarSign, Calendar, Heart, Share2, Globe, Linkedin, Twitter } from 'lucide-react';
// import { motion } from 'framer-motion';

// interface CompanyJob {
//   id: string;
//   title: string;
//   location: string;
//   type: string;
//   department: string | null;
//   imageUrl: string | null;
//   processingMode: 'MANUAL' | 'AI_ASSISTED';
//   salaryRange: string | null;
//   candidatesCount: number;
//   createdAt: string;
// }

// interface CompanyData {
//   legalName: string;
//   logo: string | null;
//   industry: string | null;
//   city: string | null;
//   careerPageBanner: string | null;
//   careerPageLogo: string | null;
//   careerPageColors: {
//     primary: string;
//     secondary: string;
//     accent: string;
//   };
//   careerPageAbout: string | null;
//   careerPageValues: string[] | null;
//   careerPagePhotos: string[] | null;
// }

// export default function CompanyJobsPage() {
//   const params = useParams<{ companyId: string }>();
//   const companyId = params?.companyId;

//   const [company, setCompany] = useState<CompanyData | null>(null);
//   const [jobs, setJobs] = useState<CompanyJob[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [selectedType, setSelectedType] = useState<string>('');
//   const [activeTab, setActiveTab] = useState<'jobs' | 'about'>('jobs');

//   useEffect(() => {
//     if (!companyId) {
//       console.error('❌ companyId is undefined');
//       setIsLoading(false);
//       return;
//     }
//     fetchCompanyData();
//   }, [companyId]);

//   const fetchCompanyData = async () => {
//     if (!companyId) return;
    
//     try {
//       const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/jobs/company/${companyId}`);
//       if (!response.ok) throw new Error('Erreur chargement');
//       const data = await response.json();
//       setCompany(data.company);
//       setJobs(data.jobs);
//     } catch (error) {
//       console.error('Erreur chargement données entreprise:', error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const filteredJobs = selectedType ? jobs.filter(j => j.type === selectedType) : jobs;

//   if (isLoading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900">
//         <Loader2 className="animate-spin text-blue-500" size={48} />
//       </div>
//     );
//   }

//   if (!company) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900">
//         <div className="text-center">
//           <p className="text-xl text-slate-500 mb-4">Entreprise introuvable</p>
//         </div>
//       </div>
//     );
//   }

//   const colors = company.careerPageColors || { primary: '#2563eb', secondary: '#1e40af', accent: '#06b6d4' };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      
//       {/* HEADER */}
//       <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
//         <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
//           <Link href="/jobs/portal" className="text-2xl font-black text-slate-900 dark:text-white">
//             RH <span className="text-blue-600">Konza</span>
//           </Link>
//           <div className="flex items-center gap-4">
//             <Link 
//               href="/jobs/portal" 
//               className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
//             >
//               ← Retour aux offres
//             </Link>
//           </div>
//         </div>
//       </header>

//       {/* COVER IMAGE */}
//       <div className="relative h-64 overflow-hidden">
//         {company.careerPageBanner ? (
//           <Image 
//             src={company.careerPageBanner} 
//             alt={company.legalName}
//             fill
//             className="object-cover"
//           />
//         ) : (
//           <div 
//             className="w-full h-full"
//             style={{ 
//               background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
//             }}
//           ></div>
//         )}
//       </div>

//       {/* COMPANY HEADER */}
//       <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
//         <div className="max-w-7xl mx-auto px-6">
//           <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-12 pb-6">
//             {/* Logo */}
//             {(company.careerPageLogo || company.logo) && (
//               <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-2xl p-3 shadow-xl border-4 border-white dark:border-slate-900">
//                 <Image 
//                   src={company.careerPageLogo || company.logo!} 
//                   alt={company.legalName}
//                   width={96}
//                   height={96}
//                   className="w-full h-full object-contain"
//                 />
//               </div>
//             )}

//             {/* Info */}
//             <div className="flex-1">
//               <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-2">
//                 {company.legalName}
//               </h1>
//               <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
//                 {company.industry && (
//                   <span className="flex items-center gap-1.5">
//                     <Briefcase size={16} />
//                     {company.industry}
//                   </span>
//                 )}
//                 {company.city && (
//                   <span className="flex items-center gap-1.5">
//                     <MapPin size={16} />
//                     {company.city}
//                   </span>
//                 )}
//                 <span className="flex items-center gap-1.5">
//                   <Building2 size={16} />
//                   {jobs.length} offre{jobs.length > 1 ? 's' : ''} disponible{jobs.length > 1 ? 's' : ''}
//                 </span>
//               </div>
//             </div>

//             {/* Actions */}
//             <div className="flex items-center gap-3">
//               <button className="p-3 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
//                 <Heart size={20} className="text-slate-600 dark:text-slate-400" />
//               </button>
//               <button className="p-3 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
//                 <Share2 size={20} className="text-slate-600 dark:text-slate-400" />
//               </button>
//             </div>
//           </div>

//           {/* TABS */}
//           <div className="flex items-center gap-8 border-t border-slate-200 dark:border-slate-800 pt-4">
//             <button
//               onClick={() => setActiveTab('jobs')}
//               className={`pb-4 border-b-2 transition-colors font-semibold ${
//                 activeTab === 'jobs'
//                   ? 'border-blue-600 text-blue-600 dark:border-cyan-400 dark:text-cyan-400'
//                   : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
//               }`}
//             >
//               Offres ({jobs.length})
//             </button>
//             <button
//               onClick={() => setActiveTab('about')}
//               className={`pb-4 border-b-2 transition-colors font-semibold ${
//                 activeTab === 'about'
//                   ? 'border-blue-600 text-blue-600 dark:border-cyan-400 dark:text-cyan-400'
//                   : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
//               }`}
//             >
//               À propos
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* CONTENT */}
//       <div className="max-w-7xl mx-auto px-6 py-12">
        
//         {/* TAB: JOBS */}
//         {activeTab === 'jobs' && (
//           <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
//             {/* FILTERS SIDEBAR */}
//             <div className="lg:col-span-1">
//               <div className="sticky top-24 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
//                 <h3 className="font-bold text-slate-900 dark:text-white mb-4">Filtres</h3>
                
//                 <div className="space-y-4">
//                   <div>
//                     <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
//                       Type de contrat
//                     </label>
//                     <select
//                       className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
//                       value={selectedType}
//                       onChange={(e) => setSelectedType(e.target.value)}
//                     >
//                       <option value="">Tous</option>
//                       <option value="CDI">CDI</option>
//                       <option value="CDD">CDD</option>
//                       <option value="STAGE">Stage</option>
//                     </select>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* JOBS LIST */}
//             <div className="lg:col-span-3">
//               {filteredJobs.length === 0 ? (
//                 <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
//                   <Briefcase size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
//                   <p className="text-lg font-semibold text-slate-500 dark:text-slate-400">Aucune offre disponible</p>
//                 </div>
//               ) : (
//                 <div className="space-y-3">
//                   {filteredJobs.map((job, index) => (
//                     <Link
//                       key={job.id}
//                       href={`/jobs/${job.id}`}
//                       className="group block bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-lg rounded-xl overflow-hidden transition-all duration-200"
//                       style={{
//                         borderColor: 'transparent',
//                       }}
//                       onMouseEnter={(e) => e.currentTarget.style.borderColor = colors.primary}
//                       onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
//                     >
//                       <div className="p-6">
//                         <div className="flex items-start justify-between mb-4">
//                           <div className="flex-1">
//                             <h3 className="font-bold text-xl text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors mb-2">
//                               {job.title}
//                             </h3>
//                             <div className="flex flex-wrap items-center gap-2 mb-3">
//                               <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-full">
//                                 <MapPin size={14} />
//                                 {job.location}
//                               </span>
//                               <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-full">
//                                 <Clock size={14} />
//                                 {job.type}
//                               </span>
//                               {job.department && (
//                                 <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-full">
//                                   <Briefcase size={14} />
//                                   {job.department}
//                                 </span>
//                               )}
//                             </div>
//                             {job.salaryRange && (
//                               <p className="text-lg font-bold flex items-center gap-2" style={{ color: colors.primary }}>
//                                 <DollarSign size={20} />
//                                 {job.salaryRange}
//                               </p>
//                             )}
//                           </div>
//                           <ChevronRight className="text-slate-400 group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors shrink-0" size={24} />
//                         </div>

//                         <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
//                           <span className="flex items-center gap-1.5">
//                             <Calendar size={14} />
//                             Publié le {new Date(job.createdAt).toLocaleDateString('fr-FR')}
//                           </span>
//                           {job.candidatesCount > 0 && (
//                             <span className="flex items-center gap-1.5">
//                               <Users size={14} />
//                               {job.candidatesCount} candidat{job.candidatesCount > 1 ? 's' : ''}
//                             </span>
//                           )}
//                         </div>
//                       </div>
//                     </Link>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </div>
//         )}

//         {/* TAB: ABOUT */}
//         {activeTab === 'about' && (
//           <div className="max-w-4xl">
            
//             {/* About */}
//             {company.careerPageAbout && (
//               <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 mb-8 border border-slate-200 dark:border-slate-700">
//                 <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
//                   À Propos de {company.legalName}
//                 </h2>
//                 <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
//                   {company.careerPageAbout}
//                 </p>
//               </div>
//             )}

//             {/* Values */}
//             {company.careerPageValues && company.careerPageValues.length > 0 && (
//               <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 mb-8 border border-slate-200 dark:border-slate-700">
//                 <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
//                   Nos Valeurs
//                 </h2>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   {company.careerPageValues.map((value, idx) => (
//                     <div 
//                       key={idx}
//                       className="flex items-center gap-3 p-4 rounded-xl border-l-4"
//                       style={{ 
//                         backgroundColor: `${colors.accent}10`,
//                         borderColor: colors.accent
//                       }}
//                     >
//                       <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${colors.accent}20` }}>
//                         <span className="font-black text-lg" style={{ color: colors.accent }}>
//                           {idx + 1}
//                         </span>
//                       </div>
//                       <span className="font-semibold text-slate-700 dark:text-slate-200">{value}</span>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* Photos */}
//             {company.careerPagePhotos && company.careerPagePhotos.length > 0 && (
//               <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700">
//                 <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
//                   La Vie chez {company.legalName}
//                 </h2>
//                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
//                   {company.careerPagePhotos.map((photo, idx) => (
//                     <div key={idx} className="aspect-square rounded-xl overflow-hidden hover:scale-105 transition-transform cursor-pointer">
//                       <Image 
//                         src={photo} 
//                         alt={`Photo ${idx + 1}`}
//                         width={300}
//                         height={300}
//                         className="w-full h-full object-cover"
//                       />
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}
//           </div>
//         )}
//       </div>

//       {/* FOOTER */}
//       <footer className="bg-slate-900 text-white py-12 mt-20">
//         <div className="max-w-7xl mx-auto px-6 text-center">
//           <p className="text-slate-400">
//             © 2026 {company.legalName}. Plateforme de recrutement propulsée par RH Konza.
//           </p>
//         </div>
//       </footer>
//     </div>
//   );
// }




'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin, Clock, Briefcase, ChevronRight, Loader2, Building2,
  DollarSign, Calendar, Share2, Globe, Users, Heart, X,
  Copy, Check, Linkedin, Twitter, Facebook, MessageCircle, ArrowLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

interface CompanyJob {
  id: string;
  title: string;
  location: string;
  type: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  createdAt: string;
}

interface CompanyData {
  id: string;
  legalName: string;
  slug: string;
  logo: string | null;
  industry: string | null;
  city: string | null;
  careerPageBanner: string | null;
  careerPageLogo: string | null;
  careerPageColors: { primary: string; secondary: string; accent: string } | null;
  careerPageAbout: string | null;
  careerPageValues: string[] | null;
  careerPagePhotos: string[] | null;
}

const TABS = ['jobs', 'about'] as const;
type Tab = typeof TABS[number];

// ─────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────

export default function CompanyDetailPage() {
  const params = useParams();
  // Le paramètre est le slug (nom-de-l-entreprise), pas l'id
  const slug = params.slug as string;

  const [company, setCompany] = useState<CompanyData | null>(null);
  const [jobs, setJobs] = useState<CompanyJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('jobs');
  const [selectedType, setSelectedType] = useState('');
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);

  useEffect(() => { fetchData(); }, [slug]);

  const fetchData = async () => {
    try {
      // L'API accepte le slug OU l'id
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/jobs/company/${slug}`);
      if (!res.ok) throw new Error('404');
      const data = await res.json();
      setCompany(data.company);
      setJobs(data.jobs || []);
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const handleCopy = () => { navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const colors = company?.careerPageColors || { primary: '#06b6d4', secondary: '#0284c7', accent: '#06b6d4' };

  const filteredJobs = selectedType ? jobs.filter(j => j.type === selectedType) : jobs;

  const getSalary = (j: CompanyJob) => {
    if (!j.salaryMin) return null;
    if (j.salaryMax) return `${j.salaryMin.toLocaleString()} – ${j.salaryMax.toLocaleString()} ${j.salaryCurrency}`;
    return `${j.salaryMin.toLocaleString()} ${j.salaryCurrency}`;
  };

  const postedAgo = (d: string) => {
    const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return 'Hier';
    if (days < 7) return `il y a ${days}j`;
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  // ── LOADING
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-cyan-500" size={40} />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <Building2 size={48} className="text-slate-700 mb-4" />
        <h1 className="text-xl font-bold text-white mb-2">Entreprise introuvable</h1>
        <Link href="/companies" className="mt-4 text-sm text-cyan-400 hover:underline">← Toutes les entreprises</Link>
      </div>
    );
  }

  const logo = company.careerPageLogo || company.logo;

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ── MODAL PARTAGE ── */}
      <AnimatePresence>
        {showShare && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowShare(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <h3 className="font-bold text-white mb-4 text-base">Partager {company.legalName}</h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { icon: Linkedin, label: 'LinkedIn', color: '#0A66C2', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}` },
                  { icon: Twitter, label: 'Twitter', color: '#1DA1F2', href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}` },
                  { icon: Facebook, label: 'Facebook', color: '#1877F2', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` },
                  { icon: MessageCircle, label: 'WhatsApp', color: '#25D366', href: `https://wa.me/?text=${encodeURIComponent(company.legalName + ' – ' + shareUrl)}` },
                ].map(({ icon: Icon, label, color, href }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: color + '20', border: `1px solid ${color}40` }}
                  >
                    <Icon size={16} style={{ color }} />{label}
                  </a>
                ))}
              </div>
              <div className="flex items-center gap-2 bg-slate-800 rounded-xl p-3">
                <p className="flex-1 text-xs text-slate-400 font-mono truncate">{shareUrl}</p>
                <button onClick={handleCopy} className="shrink-0 px-3 py-1.5 bg-cyan-500 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1">
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
            <Link href="/companies" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
              <ArrowLeft size={16} /> Entreprises
            </Link>
            <div className="hidden sm:block h-4 w-px bg-slate-800" />
            <Link href="/" className="hidden sm:block text-sm font-black">RH<span className="text-cyan-400">Konza</span></Link>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setLiked(l => !l)} className={`p-2.5 rounded-xl border transition-all ${liked ? 'border-red-500/50 bg-red-500/10 text-red-400' : 'border-slate-800 text-slate-500 hover:text-white'}`}>
              <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
            </button>
            <button onClick={() => setShowShare(true)} className="flex items-center gap-2 px-4 py-2.5 border border-slate-800 hover:border-slate-600 text-slate-400 hover:text-white rounded-xl text-sm transition-all">
              <Share2 size={14} /> Partager
            </button>
          </div>
        </div>
      </header>

      {/* ── COVER BANNER ── */}
      <div className="relative h-48 sm:h-64 overflow-hidden">
        {company.careerPageBanner ? (
          <Image src={company.careerPageBanner} alt={company.legalName} fill className="object-cover" />
        ) : (
          <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${colors.primary}30, ${colors.secondary}15, transparent)` }}>
            <div className="absolute inset-0 bg-slate-950/60" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
      </div>

      {/* ── COMPANY HEADER ── */}
      <div className="bg-slate-950 border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Logo + Infos */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5 -mt-12 pb-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-900 border-4 border-slate-950 shadow-xl flex items-center justify-center overflow-hidden shrink-0">
              {logo ? (
                <Image src={logo} alt={company.legalName} width={96} height={96} className="object-contain w-full h-full" />
              ) : (
                <Building2 size={36} className="text-slate-700" />
              )}
            </div>
            <div className="flex-1 pb-4">
              <h1 className="text-2xl sm:text-3xl font-black text-white mb-1.5 tracking-tight">{company.legalName}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                {company.industry && <span className="flex items-center gap-1.5"><Briefcase size={14} />{company.industry}</span>}
                {company.city && <span className="flex items-center gap-1.5"><MapPin size={14} />{company.city}</span>}
                <span className="flex items-center gap-1.5">
                  <Building2 size={14} />
                  <span className="font-medium" style={{ color: colors.accent }}>{jobs.length} offre{jobs.length > 1 ? 's' : ''}</span>
                </span>
              </div>
            </div>
          </div>

          {/* TABS */}
          <div className="flex gap-0 mt-4 -mb-px">
            {[
              { id: 'jobs' as Tab, label: `Offres (${jobs.length})` },
              { id: 'about' as Tab, label: 'À propos' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-5 py-3.5 text-sm font-bold border-b-2 transition-all ${
                  tab === t.id
                    ? 'text-white border-cyan-400'
                    : 'text-slate-500 border-transparent hover:text-slate-300 hover:border-slate-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTENU ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* ── TAB: OFFRES ── */}
        {tab === 'jobs' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

            {/* Filtres latéraux */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-4">Filtrer</h3>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Type de contrat</p>
                  <div className="space-y-1.5">
                    {['', 'CDI', 'CDD', 'STAGE', 'CONSULTANT'].map(t => (
                      <button
                        key={t || 'all'}
                        onClick={() => setSelectedType(t)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${
                          selectedType === t
                            ? 'bg-cyan-500/15 text-cyan-400 font-medium border border-cyan-500/30'
                            : 'text-slate-500 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        {t || 'Tous les contrats'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Liste offres */}
            <div className="lg:col-span-3">
              {filteredJobs.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/50 border border-slate-800 rounded-2xl">
                  <Briefcase size={36} className="mx-auto text-slate-700 mb-3" />
                  <p className="text-slate-500 font-medium">Aucune offre disponible</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredJobs.map((job, i) => {
                    const salary = getSalary(job);
                    return (
                      <motion.div key={job.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <Link
                          href={`/jobs/${job.id}`}
                          className="group flex items-center justify-between gap-4 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-600 rounded-2xl px-5 py-4 transition-all"
                        >
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-white group-hover:text-cyan-400 transition-colors mb-1.5 text-base leading-snug">
                              {job.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2.5 text-sm">
                              <span className="inline-flex items-center gap-1 text-slate-500">
                                <MapPin size={12} />{job.location}
                              </span>
                              <span className="text-slate-700">·</span>
                              <span className="inline-flex items-center gap-1 text-slate-500">
                                <Clock size={12} />{job.type}
                              </span>
                              {salary && (
                                <>
                                  <span className="text-slate-700">·</span>
                                  <span className="inline-flex items-center gap-1 text-cyan-500 font-medium text-xs">
                                    <DollarSign size={11} />{salary}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="shrink-0 flex flex-col items-end gap-2">
                            <span className="text-xs text-slate-600">{postedAgo(job.createdAt)}</span>
                            <ChevronRight size={16} className="text-slate-700 group-hover:text-cyan-400 transition-colors" />
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: À PROPOS ── */}
        {tab === 'about' && (
          <div className="max-w-3xl space-y-6">

            {/* À propos */}
            {company.careerPageAbout && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8">
                <h2 className="text-lg font-bold text-white mb-4">À propos de {company.legalName}</h2>
                <p className="text-slate-300 leading-relaxed whitespace-pre-line text-sm">{company.careerPageAbout}</p>
              </div>
            )}

            {/* Valeurs */}
            {company.careerPageValues && company.careerPageValues.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8">
                <h2 className="text-lg font-bold text-white mb-5">Nos valeurs</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {company.careerPageValues.map((v, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-4 rounded-xl border"
                      style={{ borderColor: `${colors.accent}30`, backgroundColor: `${colors.accent}08` }}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black shrink-0"
                        style={{ backgroundColor: `${colors.accent}20`, color: colors.accent }}
                      >
                        {i + 1}
                      </div>
                      <span className="text-slate-200 text-sm font-medium">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Photos */}
            {company.careerPagePhotos && company.careerPagePhotos.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8">
                <h2 className="text-lg font-bold text-white mb-5">La vie chez {company.legalName}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {company.careerPagePhotos.map((p, i) => (
                    <div key={i} className="aspect-square rounded-xl overflow-hidden">
                      <Image src={p} alt={`Photo ${i + 1}`} width={300} height={300} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pas de contenu */}
            {!company.careerPageAbout && !company.careerPageValues?.length && !company.careerPagePhotos?.length && (
              <div className="text-center py-16 bg-slate-900/50 border border-slate-800 rounded-2xl">
                <Building2 size={36} className="mx-auto text-slate-700 mb-3" />
                <p className="text-slate-500 text-sm">L'entreprise n'a pas encore renseigné sa page carrière.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-800/50 mt-16 py-8 px-4">
        <div className="max-w-7xl mx-auto text-center text-xs text-slate-700">
          © 2026 RH Konza · Plateforme de recrutement propulsée pour {company.legalName}
        </div>
      </footer>
    </div>
  );
}