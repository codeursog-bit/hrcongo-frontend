


// 'use client';

// import React, { useState, useEffect } from 'react';
// import Link from 'next/link';
// import Image from 'next/image';
// import { Search, MapPin, Briefcase, Clock, ChevronRight, Building2, Sparkles, X, Loader2, DollarSign, Calendar, TrendingUp } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';

// interface JobOffer {
//   id: string;
//   title: string;
//   company: string;
//   companyLogo: string | null;
//   industry: string | null;
//   location: string;
//   type: string;
//   department: string | null;
//   imageUrl: string | null;
//   isPremium: boolean;
//   processingMode: 'MANUAL' | 'AI_ASSISTED';
//   salaryRange: string | null;
//   requiredSkills: string[];
//   candidatesCount: number;
//   daysRemaining: number | null;
//   createdAt: string;
// }

// export default function JobPortalPage() {
//   const [jobs, setJobs] = useState<JobOffer[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [selectedType, setSelectedType] = useState<string>('');
//   const [selectedLocation, setSelectedLocation] = useState<string>('');
//   const [selectedDepartment, setSelectedDepartment] = useState<string>('');
//   const [view, setView] = useState<'grid' | 'list'>('list');

//   useEffect(() => {
//     fetchJobs();
//   }, []);

//   const fetchJobs = async () => {
//     try {
//       const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/jobs/portal`);
//       const data = await response.json();
//       setJobs(data.jobs);
//     } catch (error) {
//       console.error('Erreur chargement offres:', error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const filteredJobs = jobs.filter(job => {
//     const matchSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                         job.company.toLowerCase().includes(searchTerm.toLowerCase());
//     const matchType = !selectedType || job.type === selectedType;
//     const matchLocation = !selectedLocation || job.location.toLowerCase().includes(selectedLocation.toLowerCase());
//     const matchDepartment = !selectedDepartment || job.department === selectedDepartment;
//     return matchSearch && matchType && matchLocation && matchDepartment;
//   });

//   const premiumJobs = filteredJobs.filter(j => j.isPremium);
//   const regularJobs = filteredJobs.filter(j => !j.isPremium);

//   const uniqueLocations = Array.from(new Set(jobs.map(j => j.location.split(',')[0])));
//   const uniqueDepartments = Array.from(new Set(jobs.map(j => j.department).filter((d): d is string => !!d)));

//   const clearFilters = () => {
//     setSearchTerm('');
//     setSelectedType('');
//     setSelectedLocation('');
//     setSelectedDepartment('');
//   };

//   const hasActiveFilters = searchTerm || selectedType || selectedLocation || selectedDepartment;

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      
//       {/* HEADER SIMPLE STYLE JUNGLE */}
//       <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
//         <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
//           <div className="flex items-center gap-8">
//             <Link href="/" className="text-2xl font-black text-slate-900 dark:text-white">
//               RH <span className="text-blue-600">Konza</span>
//             </Link>
//             <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
//               <Link href="/jobs/portal" className="text-blue-600 dark:text-cyan-400 font-bold">
//                 Offres d'emploi
//               </Link>
//               <Link href="/jobs/blog" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
//                 Blog
//               </Link>
//               <Link href="/entreprises" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
//                 Entreprises
//               </Link>
//             </nav>
//           </div>
//           <div className="flex items-center gap-4">
//             <Link 
//               href="/login" 
//               className="hidden md:block px-5 py-2.5 text-slate-700 dark:text-slate-300 font-medium hover:text-slate-900 dark:hover:text-white transition-colors"
//             >
//               Connexion
//             </Link>
//             <Link 
//               href="/register" 
//               className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
//             >
//               Créer un compte
//             </Link>
//           </div>
//         </div>
//       </header>

//       {/* HERO SECTION MINIMALISTE */}
//       <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
//         <div className="max-w-7xl mx-auto px-6 py-16">
//           <motion.div 
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             className="max-w-3xl"
//           >
//             <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white mb-4 leading-tight">
//               Trouvez un emploi qui vous correspond
//             </h1>
//             <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">
//               Explorez {jobs.length} opportunités dans les meilleures entreprises au Congo
//             </p>

//             {/* SEARCH BAR STYLE JUNGLE */}
//             <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-2 border border-slate-200 dark:border-slate-700">
//               <div className="flex flex-col md:flex-row gap-2">
//                 <div className="flex-1 relative">
//                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
//                   <input
//                     type="text"
//                     placeholder="Titre du poste, mot-clé..."
//                     className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                   />
//                 </div>
//                 <button className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors">
//                   Rechercher
//                 </button>
//               </div>
//             </div>
//           </motion.div>
//         </div>
//       </div>

//       {/* FILTERS BAR STYLE JUNGLE */}
//       <div className="sticky top-[73px] z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
//         <div className="max-w-7xl mx-auto px-6 py-4">
//           <div className="flex items-center justify-between gap-4">
//             <div className="flex items-center gap-3 flex-1 overflow-x-auto">
//               <select
//                 className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
//                 value={selectedType}
//                 onChange={(e) => setSelectedType(e.target.value)}
//               >
//                 <option value="">Type de contrat</option>
//                 <option value="CDI">CDI</option>
//                 <option value="CDD">CDD</option>
//                 <option value="STAGE">Stage</option>
//               </select>

//               <select
//                 className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
//                 value={selectedLocation}
//                 onChange={(e) => setSelectedLocation(e.target.value)}
//               >
//                 <option value="">Ville</option>
//                 {uniqueLocations.map(loc => (
//                   <option key={loc} value={loc}>{loc}</option>
//                 ))}
//               </select>

//               <select
//                 className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
//                 value={selectedDepartment}
//                 onChange={(e) => setSelectedDepartment(e.target.value)}
//               >
//                 <option value="">Département</option>
//                 {uniqueDepartments.map(dept => (
//                   <option key={dept} value={dept}>{dept}</option>
//                 ))}
//               </select>

//               {hasActiveFilters && (
//                 <button
//                   onClick={clearFilters}
//                   className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-2 transition-colors"
//                 >
//                   <X size={16} />
//                   Effacer les filtres
//                 </button>
//               )}
//             </div>

//             <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
//               {filteredJobs.length} offre{filteredJobs.length > 1 ? 's' : ''}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* CONTENT */}
//       <div className="max-w-7xl mx-auto px-6 py-12">
        
//         {isLoading ? (
//           <div className="flex flex-col items-center justify-center py-32">
//             <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
//             <p className="text-slate-500 dark:text-slate-400">Chargement des offres...</p>
//           </div>
//         ) : (
//           <>
//             {/* PREMIUM SECTION */}
//             {premiumJobs.length > 0 && (
//               <motion.div 
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 className="mb-12"
//               >
//                 <div className="flex items-center gap-3 mb-6">
//                   <div className="p-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg">
//                     <Sparkles className="text-white" size={20} />
//                   </div>
//                   <div>
//                     <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Offres à la Une</h2>
//                     <p className="text-sm text-slate-500 dark:text-slate-400">Les opportunités mises en avant par nos partenaires</p>
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   {premiumJobs.map((job, index) => (
//                     <Link
//                       key={job.id}
//                       href={`/jobs/${job.id}`}
//                       className="group relative bg-white dark:bg-slate-800 border-2 border-yellow-400/30 hover:border-yellow-400 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl"
//                     >
//                       {/* Premium Badge */}
//                       <div className="absolute top-4 right-4 z-10 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-yellow-900 text-xs font-bold rounded-full flex items-center gap-1.5 shadow-lg">
//                         <Sparkles size={12} />
//                         PREMIUM
//                       </div>

//                       {/* Image ou placeholder */}
//                       <div className="relative h-40 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
//                         {job.imageUrl ? (
//                           <Image 
//                             src={job.imageUrl} 
//                             alt={job.title}
//                             fill
//                             className="object-cover"
//                           />
//                         ) : (
//                           <div className="w-full h-full flex items-center justify-center">
//                             <Briefcase className="text-blue-300 dark:text-blue-700" size={48} />
//                           </div>
//                         )}
//                       </div>

//                       {/* Content */}
//                       <div className="p-6">
//                         <div className="flex items-start gap-4 mb-4">
//                           {job.companyLogo ? (
//                             <Image src={job.companyLogo} alt={job.company} width={48} height={48} className="rounded-lg border border-slate-200 dark:border-slate-700" />
//                           ) : (
//                             <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
//                               <Building2 size={24} className="text-slate-400" />
//                             </div>
//                           )}
//                           <div className="flex-1 min-w-0">
//                             <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors mb-1 line-clamp-2">
//                               {job.title}
//                             </h3>
//                             <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{job.company}</p>
//                           </div>
//                         </div>

//                         <div className="flex flex-wrap gap-2 mb-4">
//                           <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-full">
//                             <MapPin size={12} />
//                             {job.location}
//                           </span>
//                           <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-full">
//                             <Clock size={12} />
//                             {job.type}
//                           </span>
//                           {job.salaryRange && (
//                             <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-full">
//                               <DollarSign size={12} />
//                               {job.salaryRange}
//                             </span>
//                           )}
//                         </div>

//                         {job.requiredSkills.length > 0 && (
//                           <div className="flex flex-wrap gap-2">
//                             {job.requiredSkills.slice(0, 3).map((skill, idx) => (
//                               <span key={idx} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs rounded-md">
//                                 {skill}
//                               </span>
//                             ))}
//                             {job.requiredSkills.length > 3 && (
//                               <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs rounded-md">
//                                 +{job.requiredSkills.length - 3}
//                               </span>
//                             )}
//                           </div>
//                         )}
//                       </div>
//                     </Link>
//                   ))}
//                 </div>
//               </motion.div>
//             )}

//             {/* REGULAR JOBS - LISTE STYLE JUNGLE */}
//             <div>
//               <div className="flex items-center justify-between mb-6">
//                 <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
//                   Toutes les offres
//                 </h2>
//               </div>

//               {regularJobs.length === 0 ? (
//                 <div className="text-center py-20 bg-white dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
//                   <Briefcase size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
//                   <p className="text-lg font-semibold text-slate-500 dark:text-slate-400 mb-2">Aucune offre trouvée</p>
//                   <p className="text-sm text-slate-400 dark:text-slate-500">Essayez de modifier vos critères de recherche</p>
//                 </div>
//               ) : (
//                 <div className="space-y-3">
//                   {regularJobs.map((job, index) => (
//                     <Link
//                       key={job.id}
//                       href={`/jobs/${job.id}`}
//                       className="group block bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-cyan-500 rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg"
//                     >
//                       <div className="p-6 flex items-center gap-6">
//                         {/* Logo */}
//                         <div className="shrink-0">
//                           {job.companyLogo ? (
//                             <Image src={job.companyLogo} alt={job.company} width={56} height={56} className="rounded-lg border border-slate-200 dark:border-slate-700" />
//                           ) : (
//                             <div className="w-14 h-14 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
//                               <Building2 size={28} className="text-slate-400" />
//                             </div>
//                           )}
//                         </div>

//                         {/* Content */}
//                         <div className="flex-1 min-w-0">
//                           <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors mb-1.5 line-clamp-1">
//                             {job.title}
//                           </h3>
                          
//                           <div className="flex flex-wrap items-center gap-3 text-sm mb-3">
//                             <span className="font-medium text-slate-700 dark:text-slate-300">
//                               {job.company}
//                             </span>
//                             {job.industry && (
//                               <>
//                                 <span className="text-slate-300 dark:text-slate-700">•</span>
//                                 <span className="text-slate-500 dark:text-slate-400">{job.industry}</span>
//                               </>
//                             )}
//                           </div>

//                           <div className="flex flex-wrap items-center gap-2">
//                             <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs font-medium rounded-md">
//                               <MapPin size={12} />
//                               {job.location}
//                             </span>
//                             <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs font-medium rounded-md">
//                               <Clock size={12} />
//                               {job.type}
//                             </span>
//                             {job.department && (
//                               <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs font-medium rounded-md">
//                                 <Briefcase size={12} />
//                                 {job.department}
//                               </span>
//                             )}
//                             {job.salaryRange && (
//                               <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-md">
//                                 <DollarSign size={12} />
//                                 {job.salaryRange}
//                               </span>
//                             )}
//                             <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-slate-500 dark:text-slate-400 text-xs">
//                               <Calendar size={12} />
//                               {new Date(job.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
//                             </span>
//                           </div>
//                         </div>

//                         {/* Arrow */}
//                         <div className="shrink-0 hidden md:block">
//                           <ChevronRight className="text-slate-400 group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors" size={24} />
//                         </div>
//                       </div>
//                     </Link>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </>
//         )}
//       </div>

//       {/* FOOTER MINIMALISTE */}
//       <footer className="bg-slate-900 text-white py-12 mt-20">
//         <div className="max-w-7xl mx-auto px-6">
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
//             <div>
//               <h3 className="text-lg font-bold mb-4">RH Konza</h3>
//               <p className="text-sm text-slate-400 leading-relaxed">
//                 La plateforme de recrutement intelligente propulsée par l'IA pour l'Afrique.
//               </p>
//             </div>
//             <div>
//               <h4 className="font-semibold mb-4 text-sm">Pour les candidats</h4>
//               <ul className="space-y-2 text-sm text-slate-400">
//                 <li><Link href="/jobs/portal" className="hover:text-white transition-colors">Rechercher un emploi</Link></li>
//                 <li><Link href="/jobs/blog" className="hover:text-white transition-colors">Blog carrière</Link></li>
//                 <li><Link href="/register" className="hover:text-white transition-colors">Créer un profil</Link></li>
//               </ul>
//             </div>
//             <div>
//               <h4 className="font-semibold mb-4 text-sm">Pour les entreprises</h4>
//               <ul className="space-y-2 text-sm text-slate-400">
//                 <li><Link href="/entreprises" className="hover:text-white transition-colors">Publier une offre</Link></li>
//                 <li><Link href="/sirh" className="hover:text-white transition-colors">Solution SIRH</Link></li>
//                 <li><Link href="/contact" className="hover:text-white transition-colors">Nous contacter</Link></li>
//               </ul>
//             </div>
//             <div>
//               <h4 className="font-semibold mb-4 text-sm">À propos</h4>
//               <ul className="space-y-2 text-sm text-slate-400">
//                 <li><Link href="/about" className="hover:text-white transition-colors">Qui sommes-nous</Link></li>
//                 <li><Link href="/cgu" className="hover:text-white transition-colors">CGU</Link></li>
//                 <li><Link href="/privacy" className="hover:text-white transition-colors">Confidentialité</Link></li>
//               </ul>
//             </div>
//           </div>
//           <div className="pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
//             <p>© 2026 RH Konza. Tous droits réservés.</p>
//           </div>
//         </div>
//       </footer>
//     </div>
//   );
// }


'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search, MapPin, Clock, ChevronRight, Building2,
  X, Loader2, DollarSign, Calendar, LayoutGrid, List,
  Zap, ChevronLeft, SlidersHorizontal, Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

interface JobOffer {
  id: string;
  title: string;
  company: string;
  companySlug: string;
  companyLogo: string | null;
  industry: string | null;
  location: string;
  type: string;
  imageUrl: string | null;
  isPremium: boolean;
  salaryRange: string | null;
  requiredSkills: string[];
  daysRemaining: number | null;
  createdAt: string;
}

const CONTRACT_TYPES = ['CDI', 'CDD', 'STAGE', 'CONSULTANT'];
const PAGE_SIZE_OPTIONS = [6, 8, 12];

// ─────────────────────────────────────────────
// COMPOSANT CARTE JOB — vue liste (WTTJ style)
// ─────────────────────────────────────────────

function JobCardList({ job }: { job: JobOffer }) {
  const posted = new Date(job.createdAt);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - posted.getTime()) / 86400000);
  const postedLabel = diffDays === 0 ? "Aujourd'hui" : diffDays === 1 ? 'Hier' : `il y a ${diffDays}j`;

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="group flex items-center gap-5 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-600 rounded-2xl px-5 py-4 transition-all duration-200"
    >
      {/* Logo */}
      <div className="shrink-0 w-14 h-14 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden">
        {job.companyLogo ? (
          <Image src={job.companyLogo} alt={job.company} width={56} height={56} className="object-contain" />
        ) : (
          <Building2 size={24} className="text-slate-600" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-bold text-white group-hover:text-cyan-400 transition-colors text-base leading-tight mb-1 truncate">
              {job.title}
            </h3>
            <p className="text-sm text-slate-400 mb-2 truncate">
              {job.company}
              {job.industry && <span className="text-slate-600"> · {job.industry}</span>}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <MapPin size={11} />{job.location}
              </span>
              <span className="text-slate-700">·</span>
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <Clock size={11} />{job.type}
              </span>
              {job.salaryRange && (
                <>
                  <span className="text-slate-700">·</span>
                  <span className="inline-flex items-center gap-1 text-xs text-cyan-500 font-medium">
                    <DollarSign size={11} />{job.salaryRange}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="shrink-0 flex flex-col items-end gap-2">
            <span className="text-xs text-slate-600">{postedLabel}</span>
            <ChevronRight size={16} className="text-slate-700 group-hover:text-cyan-400 transition-colors" />
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────
// COMPOSANT CARTE JOB — vue grille
// ─────────────────────────────────────────────

function JobCardGrid({ job }: { job: JobOffer }) {
  return (
    <Link
      href={`/jobs/${job.id}`}
      className="group flex flex-col bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-600 rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/40"
    >
      {/* Image */}
      <div className="h-36 bg-slate-800 relative overflow-hidden">
        {job.imageUrl ? (
          <Image src={job.imageUrl} alt={job.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building2 size={32} className="text-slate-700" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
        {/* Logo sur l'image */}
        <div className="absolute bottom-3 left-3 w-10 h-10 rounded-lg bg-slate-900/80 backdrop-blur-sm border border-slate-700 flex items-center justify-center overflow-hidden">
          {job.companyLogo ? (
            <Image src={job.companyLogo} alt={job.company} width={40} height={40} className="object-contain" />
          ) : (
            <Building2 size={18} className="text-slate-500" />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col gap-2">
        <div>
          <h3 className="font-bold text-white group-hover:text-cyan-400 transition-colors text-sm leading-snug mb-0.5 line-clamp-2">
            {job.title}
          </h3>
          <p className="text-xs text-slate-500 truncate">{job.company}</p>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-auto pt-2 border-t border-slate-800">
          <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
            <MapPin size={10} />{job.location.split(',')[0]}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
            {job.type}
          </span>
          {job.salaryRange && (
            <span className="inline-flex items-center gap-1 text-xs text-cyan-500 font-medium bg-cyan-500/10 px-2 py-0.5 rounded-full">
              {job.salaryRange}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────
// SLIDER OFFRES BOOSTÉES
// ─────────────────────────────────────────────

function BoostedSlider({ jobs }: { jobs: JobOffer[] }) {
  const [idx, setIdx] = useState(0);
  const visible = 4;
  const canLeft = idx > 0;
  const canRight = idx + visible < jobs.length;

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Zap size={14} className="text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Offres à la une</h2>
            <p className="text-xs text-slate-500">{jobs.length} offre{jobs.length > 1 ? 's' : ''} mise{jobs.length > 1 ? 's' : ''} en avant</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIdx(i => Math.max(0, i - 1))}
            disabled={!canLeft}
            className="w-8 h-8 rounded-full border border-slate-700 flex items-center justify-center text-slate-500 hover:text-white hover:border-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setIdx(i => Math.min(jobs.length - visible, i + 1))}
            disabled={!canRight}
            className="w-8 h-8 rounded-full border border-slate-700 flex items-center justify-center text-slate-500 hover:text-white hover:border-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="overflow-hidden">
        <motion.div
          animate={{ x: `-${idx * (100 / visible)}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="flex gap-4"
          style={{ width: `${(jobs.length / visible) * 100}%` }}
        >
          {jobs.map((job) => (
            <div key={job.id} style={{ width: `${100 / jobs.length}%` }}>
              <Link
                href={`/jobs/${job.id}`}
                className="group block bg-slate-900 border border-amber-500/20 hover:border-amber-500/50 rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/10 h-full"
              >
                {/* Image */}
                <div className="h-28 bg-slate-800 relative overflow-hidden">
                  {job.imageUrl ? (
                    <Image src={job.imageUrl} alt={job.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-500/10 to-orange-500/10 flex items-center justify-center">
                      <Sparkles size={24} className="text-amber-500/40" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                  {/* Badge boosté */}
                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full text-[10px] font-bold text-black flex items-center gap-1">
                    <Zap size={9} />À LA UNE
                  </div>
                </div>

                <div className="p-3.5">
                  {/* Logo + Company */}
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                      {job.companyLogo
                        ? <Image src={job.companyLogo} alt={job.company} width={32} height={32} className="object-contain" />
                        : <Building2 size={14} className="text-slate-600" />
                      }
                    </div>
                    <p className="text-xs text-slate-500 truncate">{job.company}</p>
                  </div>
                  <h3 className="font-bold text-sm text-white group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug mb-2">
                    {job.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <MapPin size={10} />{job.location.split(',')[0]}
                    <span>·</span>{job.type}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// PAGE PRINCIPALE
// ─────────────────────────────────────────────

export default function JobPortalPage() {
  const [jobs, setJobs] = useState<JobOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { fetchJobs(); }, []);
  useEffect(() => { setPage(1); }, [searchTerm, selectedType, selectedLocation]);

  const fetchJobs = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/jobs/portal`);
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch { } finally {
      setIsLoading(false);
    }
  };

  // Filtres
  const filtered = jobs.filter(j => {
    const s = searchTerm.toLowerCase();
    const matchSearch = !searchTerm || j.title.toLowerCase().includes(s) || j.company.toLowerCase().includes(s);
    const matchType = !selectedType || j.type === selectedType;
    const matchLoc = !selectedLocation || j.location.toLowerCase().includes(selectedLocation.toLowerCase());
    return matchSearch && matchType && matchLoc;
  });

  const boosted = filtered.filter(j => j.isPremium);
  const regular = filtered.filter(j => !j.isPremium);

  // Pagination
  const totalPages = Math.ceil(regular.length / pageSize);
  const paginated = regular.slice((page - 1) * pageSize, page * pageSize);

  const uniqueLocations = Array.from(new Set(jobs.map(j => j.location.split(',')[0].trim()))).sort();
  const hasFilters = searchTerm || selectedType || selectedLocation;

  const clearFilters = () => { setSearchTerm(''); setSelectedType(''); setSelectedLocation(''); };

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
          <div className="flex items-center gap-8 shrink-0">
            <Link href="/" className="text-xl font-black tracking-tight">
              RH<span className="text-cyan-400">Konza</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <Link href="/jobs/portal" className="text-white font-semibold border-b-2 border-cyan-400 pb-0.5">Offres</Link>
              <Link href="/entreprises" className="text-slate-400 hover:text-white transition-colors">Entreprises</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:block text-sm text-slate-400 hover:text-white transition-colors px-3 py-2">Connexion</Link>
            <Link href="/register" className="text-sm font-bold px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl transition-colors">
              Créer un compte
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <div className="bg-slate-950 border-b border-slate-800/50 py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-3 leading-tight tracking-tight">
              Trouvez votre prochain<br />
              <span className="text-cyan-400">emploi au Congo</span>
            </h1>
            <p className="text-slate-400 mb-8 text-lg">
              {jobs.length} opportunité{jobs.length > 1 ? 's' : ''} dans les meilleures entreprises
            </p>

            {/* Barre de recherche */}
            <div className="flex gap-2 bg-slate-900 border border-slate-700 rounded-2xl p-2">
              <div className="flex-1 flex items-center gap-3 bg-slate-800 rounded-xl px-4 py-3">
                <Search size={18} className="text-slate-500 shrink-0" />
                <input
                  type="text"
                  placeholder="Poste, entreprise, mot-clé..."
                  className="flex-1 bg-transparent outline-none text-white placeholder:text-slate-600 text-sm"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')}>
                    <X size={14} className="text-slate-600 hover:text-white" />
                  </button>
                )}
              </div>
              <button className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-sm transition-colors shrink-0">
                Rechercher
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── BARRE FILTRES STICKY ── */}
      <div className="sticky top-16 z-40 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3 flex-wrap">

            {/* Contrat */}
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5 flex-nowrap">
              {CONTRACT_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => setSelectedType(selectedType === t ? '' : t)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    selectedType === t
                      ? 'bg-cyan-500 border-cyan-500 text-slate-950'
                      : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Ville */}
            <select
              className="px-3 py-1.5 bg-slate-900 border border-slate-700 text-slate-400 text-xs rounded-full outline-none hover:border-slate-500 transition-colors cursor-pointer"
              value={selectedLocation}
              onChange={e => setSelectedLocation(e.target.value)}
            >
              <option value="">Toutes les villes</option>
              {uniqueLocations.map(l => <option key={l} value={l}>{l}</option>)}
            </select>

            {hasFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white transition-colors">
                <X size={12} /> Effacer
              </button>
            )}

            {/* Spacer + résultats + vues */}
            <div className="ml-auto flex items-center gap-3 shrink-0">
              <span className="text-xs text-slate-500 hidden sm:block">
                {filtered.length} offre{filtered.length > 1 ? 's' : ''}
              </span>
              {/* Toggle vue */}
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
                <button
                  onClick={() => setView('list')}
                  className={`p-1.5 rounded-lg transition-colors ${view === 'list' ? 'bg-slate-700 text-white' : 'text-slate-600 hover:text-slate-400'}`}
                >
                  <List size={15} />
                </button>
                <button
                  onClick={() => setView('grid')}
                  className={`p-1.5 rounded-lg transition-colors ${view === 'grid' ? 'bg-slate-700 text-white' : 'text-slate-600 hover:text-slate-400'}`}
                >
                  <LayoutGrid size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENU ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="animate-spin text-cyan-500 mb-4" size={40} />
            <p className="text-slate-500 text-sm">Chargement des offres...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Search size={28} className="text-slate-700" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Aucune offre trouvée</h2>
            <p className="text-slate-500 text-sm mb-5">Essayez de modifier vos critères de recherche</p>
            {hasFilters && (
              <button onClick={clearFilters} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-colors">
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <>
            {/* SLIDER OFFRES BOOSTÉES — seulement si il y en a */}
            {boosted.length > 0 && <BoostedSlider jobs={boosted} />}

            {/* TOUTES LES OFFRES */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-white">
                  {hasFilters ? `Résultats (${regular.length})` : `Toutes les offres (${regular.length})`}
                </h2>
                {/* Offres par page */}
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="hidden sm:block">Afficher</span>
                  {PAGE_SIZE_OPTIONS.map(n => (
                    <button
                      key={n}
                      onClick={() => { setPageSize(n); setPage(1); }}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${pageSize === n ? 'bg-slate-700 text-white' : 'text-slate-600 hover:text-white'}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* LISTE ou GRILLE */}
              {view === 'list' ? (
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {paginated.map((job, i) => (
                      <motion.div
                        key={job.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: i * 0.04 }}
                      >
                        <JobCardList job={job} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  <AnimatePresence mode="popLayout">
                    {paginated.map((job, i) => (
                      <motion.div
                        key={job.id}
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: i * 0.04 }}
                      >
                        <JobCardGrid job={job} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* PAGINATION */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="w-9 h-9 rounded-xl border border-slate-800 flex items-center justify-center text-slate-500 hover:text-white hover:border-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .reduce<(number | '...')[]>((acc, p, i, arr) => {
                      if (i > 0 && typeof arr[i - 1] === 'number' && (p as number) - (arr[i - 1] as number) > 1) acc.push('...');
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) =>
                      p === '...' ? (
                        <span key={`dot-${i}`} className="text-slate-700 px-1">…</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setPage(p as number)}
                          className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${
                            page === p
                              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                              : 'border border-slate-800 text-slate-500 hover:text-white hover:border-slate-600'
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )}

                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="w-9 h-9 rounded-xl border border-slate-800 flex items-center justify-center text-slate-500 hover:text-white hover:border-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-800/50 mt-16 py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8 text-sm">
            <div>
              <p className="font-black text-white mb-3 text-base">RH<span className="text-cyan-400">Konza</span></p>
              <p className="text-slate-600 text-xs leading-relaxed">Plateforme de recrutement pour l'Afrique centrale.</p>
            </div>
            {[
              { title: 'Candidats', links: [['Offres', '/jobs/portal'], ['Entreprises', '/entreprises'], ['Créer un profil', '/register']] },
              { title: 'Recruteurs', links: [['Publier une offre', '/recrutement/nouveau'], ['Solution SIRH', '/sirh'], ['Contact', '/contact']] },
              { title: 'À propos', links: [['Qui sommes-nous', '/about'], ['CGU', '/cgu'], ['Confidentialité', '/privacy']] },
            ].map(col => (
              <div key={col.title}>
                <p className="font-bold text-slate-400 mb-3 text-xs uppercase tracking-wider">{col.title}</p>
                <ul className="space-y-2">
                  {col.links.map(([label, href]) => (
                    <li key={label}>
                      <Link href={href} className="text-slate-600 hover:text-slate-300 transition-colors text-xs">{label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-800/50 pt-6 text-center text-xs text-slate-700">
            © 2026 RH Konza. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
}