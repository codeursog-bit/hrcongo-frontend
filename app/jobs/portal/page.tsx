// 'use client';

// import React, { useState, useEffect } from 'react';
// import Link from 'next/link';
// import Image from 'next/image';
// // AJOUT DE DollarSign DANS LES IMPORTS ICI
// import { Search, MapPin, Briefcase, Clock, ChevronRight, Building2, Sparkles, Filter, X, Loader2, DollarSign } from 'lucide-react';
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
  
//   // CORRECTION ICI : On utilise une fonction de type guard pour garantir que c'est une string
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
      
//       {/* HERO SECTION */}
//       <div className="relative bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 dark:from-blue-900 dark:via-cyan-900 dark:to-blue-900 overflow-hidden">
//         <div className="absolute inset-0">
//           <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
//           <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-300/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
//         </div>
        
//         <div className="max-w-7xl mx-auto px-4 py-24 relative z-10">
//           <motion.div 
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             className="text-center mb-12"
//           >
//             <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight">
//               Trouvez Votre <span className="text-yellow-300">Dream Job</span>
//             </h1>
//             <p className="text-xl md:text-2xl text-blue-100 mb-4 max-w-3xl mx-auto">
//               {jobs.length} opportunités professionnelles vous attendent dans les meilleures entreprises
//             </p>
//             <div className="flex items-center justify-center gap-3 text-white/80">
//               <div className="flex items-center gap-2">
//                 <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
//                 <span className="text-sm">Mis à jour en temps réel</span>
//               </div>
//               <span className="text-white/40">•</span>
//               <span className="text-sm">{premiumJobs.length} offres premium disponibles</span>
//             </div>
//           </motion.div>

//           {/* SEARCH BAR */}
//           <motion.div 
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.2 }}
//             className="max-w-5xl mx-auto"
//           >
//             <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-4">
//               <div className="flex flex-col md:flex-row gap-3">
//                 <div className="flex-1 relative">
//                   <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={22} />
//                   <input
//                     type="text"
//                     placeholder="Poste, entreprise, compétence..."
//                     className="w-full pl-14 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none transition-all text-slate-900 dark:text-white text-lg"
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                   />
//                 </div>
                
//                 <button className="px-10 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-bold rounded-2xl shadow-lg transition-all hover:scale-[1.02] text-lg">
//                   Rechercher
//                 </button>
//               </div>

//               {/* FILTERS */}
//               <div className="flex flex-wrap gap-3 mt-4">
//                 <select
//                   className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white text-sm"
//                   value={selectedType}
//                   onChange={(e) => setSelectedType(e.target.value)}
//                 >
//                   <option value="">Type de contrat</option>
//                   <option value="CDI">CDI</option>
//                   <option value="CDD">CDD</option>
//                   <option value="STAGE">Stage</option>
//                 </select>

//                 <select
//                   className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white text-sm"
//                   value={selectedLocation}
//                   onChange={(e) => setSelectedLocation(e.target.value)}
//                 >
//                   <option value="">Localisation</option>
//                   {uniqueLocations.map(loc => (
//                     <option key={loc} value={loc}>{loc}</option>
//                   ))}
//                 </select>

//                 <select
//                   className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white text-sm"
//                   value={selectedDepartment}
//                   onChange={(e) => setSelectedDepartment(e.target.value)}
//                 >
//                   <option value="">Département</option>
//                   {uniqueDepartments.map(dept => (
//                     <option key={dept} value={dept}>{dept}</option>
//                   ))}
//                 </select>

//                 {hasActiveFilters && (
//                   <button
//                     onClick={clearFilters}
//                     className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl font-medium flex items-center gap-2 transition-colors"
//                   >
//                     <X size={16} />
//                     Effacer
//                   </button>
//                 )}
//               </div>
//             </div>
//           </motion.div>
//         </div>
//       </div>

//       {/* CONTENT */}
//       <div className="max-w-7xl mx-auto px-4 py-16">
        
//         {isLoading ? (
//           <div className="flex flex-col items-center justify-center py-32">
//             <Loader2 className="animate-spin text-blue-500 mb-4" size={64} />
//             <p className="text-slate-500 dark:text-slate-400 text-lg">Chargement des offres...</p>
//           </div>
//         ) : (
//           <>
//             {/* PREMIUM SECTION */}
//             {premiumJobs.length > 0 && (
//               <motion.div 
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 className="mb-16"
//               >
//                 <div className="flex items-center gap-3 mb-8">
//                   <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl shadow-lg">
//                     <Sparkles className="text-white" size={28} />
//                   </div>
//                   <div>
//                     <h2 className="text-3xl font-black text-slate-900 dark:text-white">Offres Premium</h2>
//                     <p className="text-slate-500 dark:text-slate-400">Les meilleures opportunités mises en avant</p>
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                   {premiumJobs.map((job, index) => (
//                     <motion.div
//                       key={job.id}
//                       initial={{ opacity: 0, y: 20 }}
//                       animate={{ opacity: 1, y: 0 }}
//                       transition={{ delay: index * 0.1 }}
//                       className="group relative bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-50 dark:from-yellow-900/20 dark:via-orange-900/20 dark:to-yellow-900/20 border-2 border-yellow-400/40 rounded-3xl p-8 hover:shadow-2xl hover:border-yellow-400 transition-all duration-300 overflow-hidden"
//                     >
//                       {/* Floating Badge */}
//                       <div className="absolute -top-2 -right-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-yellow-900 text-xs font-black rounded-full flex items-center gap-1.5 shadow-lg rotate-12 group-hover:rotate-0 transition-transform">
//                         <Sparkles size={14} />
//                         PREMIUM
//                       </div>

//                       {/* Image */}
//                       {job.imageUrl && (
//                         <div className="mb-6 -mx-8 -mt-8">
//                           <Image 
//                             src={job.imageUrl} 
//                             alt={job.title} 
//                             width={600}
//                             height={200}
//                             className="w-full h-48 object-cover"
//                           />
//                         </div>
//                       )}

//                       {/* Company Logo */}
//                       {job.companyLogo && (
//                         <div className="mb-4">
//                           <Image src={job.companyLogo} alt={job.company} width={60} height={60} className="rounded-xl border-2 border-white/50 shadow-lg" />
//                         </div>
//                       )}

//                       <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
//                         {job.title}
//                       </h3>
                      
//                       <div className="flex flex-wrap gap-2 mb-4">
//                         <span className="px-3 py-1.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 border border-slate-200/50 dark:border-slate-700/50">
//                           <Building2 size={14} className="text-blue-500" />
//                           {job.company}
//                         </span>
//                         <span className="px-3 py-1.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 border border-slate-200/50 dark:border-slate-700/50">
//                           <MapPin size={14} className="text-red-500" />
//                           {job.location}
//                         </span>
//                         <span className="px-3 py-1.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 border border-slate-200/50 dark:border-slate-700/50">
//                           <Clock size={14} className="text-green-500" />
//                           {job.type}
//                         </span>
//                       </div>

//                       {job.salaryRange && (
//                         <p className="text-xl font-black text-blue-600 dark:text-cyan-400 mb-4 flex items-center gap-2">
//                           <DollarSign size={24} />
//                           {job.salaryRange}
//                         </p>
//                       )}

//                       {job.requiredSkills.length > 0 && (
//                         <div className="flex flex-wrap gap-2 mb-6">
//                           {job.requiredSkills.slice(0, 4).map((skill, idx) => (
//                             <span key={idx} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-full">
//                               {skill}
//                             </span>
//                           ))}
//                         </div>
//                       )}

//                       <div className="flex items-center justify-between pt-4 border-t-2 border-yellow-400/30">
//                         <div className="flex items-center gap-3">
//                           <Link
//                             href={`/jobs/${job.id}`}
//                             className="text-blue-600 dark:text-cyan-400 font-bold hover:underline"
//                           >
//                             Voir détails
//                           </Link>
//                           {job.daysRemaining !== null && job.daysRemaining > 0 && (
//                             <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
//                               Expire dans {job.daysRemaining}j
//                             </span>
//                           )}
//                         </div>
//                         <Link
//                           href={job.processingMode === 'AI_ASSISTED' ? `/jobs/ia/${job.id}` : `/jobs/manuel/${job.id}`}
//                           className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-bold rounded-xl shadow-lg transition-all hover:scale-105 flex items-center gap-2"
//                         >
//                           Postuler <ChevronRight size={16} />
//                         </Link>
//                       </div>
//                     </motion.div>
//                   ))}
//                 </div>
//               </motion.div>
//             )}

//             {/* REGULAR JOBS */}
//             <div>
//               <div className="flex items-center justify-between mb-8">
//                 <div>
//                   <h2 className="text-3xl font-black text-slate-900 dark:text-white">
//                     Toutes les Offres ({regularJobs.length})
//                   </h2>
//                   <p className="text-slate-500 dark:text-slate-400 mt-1">
//                     Explorez toutes les opportunités disponibles
//                   </p>
//                 </div>
//               </div>

//               {regularJobs.length === 0 ? (
//                 <div className="text-center py-20 bg-white dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
//                   <Briefcase size={64} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
//                   <p className="text-xl font-bold text-slate-500 dark:text-slate-400 mb-2">Aucune offre trouvée</p>
//                   <p className="text-slate-400 dark:text-slate-500">Essayez de modifier vos filtres</p>
//                 </div>
//               ) : (
//                 <div className="space-y-4">
//                   {regularJobs.map((job, index) => (
//                     <motion.div
//                       key={job.id}
//                       initial={{ opacity: 0, x: -20 }}
//                       animate={{ opacity: 1, x: 0 }}
//                       transition={{ delay: index * 0.05 }}
//                       className="group bg-white dark:bg-slate-800/50 backdrop-blur-sm border-2 border-slate-200 dark:border-slate-700/50 rounded-3xl p-6 hover:shadow-2xl hover:border-blue-400 dark:hover:border-cyan-500 transition-all duration-300"
//                     >
//                       <div className="flex flex-col md:flex-row items-start gap-6">
//                         {/* Image or Logo */}
//                         <div className="shrink-0">
//                           {job.imageUrl ? (
//                             <Image src={job.imageUrl} alt={job.title} width={120} height={80} className="w-32 h-20 object-cover rounded-xl border-2 border-slate-200 dark:border-slate-700" />
//                           ) : job.companyLogo ? (
//                             <Image src={job.companyLogo} alt={job.company} width={80} height={80} className="w-20 h-20 rounded-xl border-2 border-slate-200 dark:border-slate-700" />
//                           ) : (
//                             <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900 dark:to-cyan-900 rounded-xl flex items-center justify-center border-2 border-slate-200 dark:border-slate-700">
//                               <Building2 className="text-blue-600 dark:text-cyan-400" size={32} />
//                             </div>
//                           )}
//                         </div>

//                         {/* Content */}
//                         <div className="flex-1 min-w-0">
//                           <div className="flex items-start justify-between mb-3">
//                             <h3 className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
//                               {job.title}
//                             </h3>
//                           </div>
                          
//                           <div className="flex flex-wrap gap-2 mb-4">
//                             <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-lg flex items-center gap-2">
//                               <Building2 size={14} className="text-blue-500" />
//                               {job.company}
//                             </span>
//                             <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-lg flex items-center gap-2">
//                               <MapPin size={14} className="text-red-500" />
//                               {job.location}
//                             </span>
//                             <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-lg flex items-center gap-2">
//                               <Clock size={14} className="text-green-500" />
//                               {job.type}
//                             </span>
//                             {job.department && (
//                               <span className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-bold rounded-lg">
//                                 {job.department}
//                               </span>
//                             )}
//                           </div>

//                           {job.salaryRange && (
//                             <p className="text-lg font-black text-blue-600 dark:text-cyan-400 mb-3 flex items-center gap-2">
//                               <DollarSign size={20} />
//                               {job.salaryRange}
//                             </p>
//                           )}

//                           {job.requiredSkills.length > 0 && (
//                             <div className="flex flex-wrap gap-2">
//                               {job.requiredSkills.slice(0, 5).map((skill, idx) => (
//                                 <span key={idx} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-full">
//                                   {skill}
//                                 </span>
//                               ))}
//                             </div>
//                           )}
//                         </div>

//                         {/* Actions */}
//                         <div className="flex md:flex-col gap-3 w-full md:w-auto">
//                           <Link
//                             href={`/jobs/${job.id}`}
//                             className="flex-1 md:flex-none px-6 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-bold rounded-xl transition-all text-center"
//                           >
//                             Détails
//                           </Link>
//                           <Link
//                             href={job.processingMode === 'AI_ASSISTED' ? `/jobs/ia/${job.id}` : `/jobs/manuel/${job.id}`}
//                             className="flex-1 md:flex-none px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-bold rounded-xl shadow-lg transition-all hover:scale-105 flex items-center justify-center gap-2"
//                           >
//                             Postuler
//                           </Link>
//                         </div>
//                       </div>

//                       {/* Footer */}
//                       <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-sm text-slate-500 dark:text-slate-400">
//                         <span>Publié le {new Date(job.createdAt).toLocaleDateString('fr-FR')}</span>
//                         {job.daysRemaining !== null && job.daysRemaining > 0 && (
//                           <span className="text-orange-600 dark:text-orange-400 font-bold flex items-center gap-1.5">
//                             <Clock size={16} />
//                             Expire dans {job.daysRemaining} jour{job.daysRemaining > 1 ? 's' : ''}
//                           </span>
//                         )}
//                       </div>
//                     </motion.div>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </>
//         )}
//       </div>

//       {/* FOOTER */}
//       <div className="bg-slate-900 text-white py-16 mt-20">
//         <div className="max-w-7xl mx-auto px-4">
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
//             <div>
//               <h3 className="text-xl font-black mb-4">RH Konza</h3>
//               <p className="text-slate-400">Votre plateforme de recrutement intelligente propulsée par l'IA.</p>
//             </div>
//             <div>
//               <h4 className="font-bold mb-4">Liens Rapides</h4>
//               <ul className="space-y-2 text-slate-400">
//                 <li><a href="#" className="hover:text-white transition-colors">À propos</a></li>
//                 <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
//                 <li><a href="#" className="hover:text-white transition-colors">Entreprises</a></li>
//               </ul>
//             </div>
//             <div>
//               <h4 className="font-bold mb-4">Statistiques</h4>
//               <ul className="space-y-2 text-slate-400">
//                 <li className="flex items-center gap-2"><Briefcase size={16} /> {jobs.length} offres actives</li>
//                 <li className="flex items-center gap-2"><Building2 size={16} /> {Array.from(new Set(jobs.map(j => j.company))).length} entreprises</li>
//                 <li className="flex items-center gap-2"><Sparkles size={16} /> {premiumJobs.length} offres premium</li>
//               </ul>
//             </div>
//           </div>
//           <div className="text-center pt-8 border-t border-slate-800">
//             <p className="text-slate-500">© 2026 RH Konza. Tous droits réservés.</p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, MapPin, Briefcase, Clock, ChevronRight, Building2, Sparkles, X, Loader2, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface JobOffer {
  id: string;
  title: string;
  company: string;
  companyLogo: string | null;
  industry: string | null;
  location: string;
  type: string;
  department: string | null;
  imageUrl: string | null;
  isPremium: boolean;
  processingMode: 'MANUAL' | 'AI_ASSISTED';
  salaryRange: string | null;
  requiredSkills: string[];
  candidatesCount: number;
  daysRemaining: number | null;
  createdAt: string;
}

export default function JobPortalPage() {
  const [jobs, setJobs] = useState<JobOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [view, setView] = useState<'grid' | 'list'>('list');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/jobs/portal`);
      const data = await response.json();
      setJobs(data.jobs);
    } catch (error) {
      console.error('Erreur chargement offres:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        job.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = !selectedType || job.type === selectedType;
    const matchLocation = !selectedLocation || job.location.toLowerCase().includes(selectedLocation.toLowerCase());
    const matchDepartment = !selectedDepartment || job.department === selectedDepartment;
    return matchSearch && matchType && matchLocation && matchDepartment;
  });

  const premiumJobs = filteredJobs.filter(j => j.isPremium);
  const regularJobs = filteredJobs.filter(j => !j.isPremium);

  const uniqueLocations = Array.from(new Set(jobs.map(j => j.location.split(',')[0])));
  const uniqueDepartments = Array.from(new Set(jobs.map(j => j.department).filter((d): d is string => !!d)));

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedType('');
    setSelectedLocation('');
    setSelectedDepartment('');
  };

  const hasActiveFilters = searchTerm || selectedType || selectedLocation || selectedDepartment;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      
      {/* HEADER SIMPLE STYLE JUNGLE */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-2xl font-black text-slate-900 dark:text-white">
              RH <span className="text-blue-600">Konza</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link href="/jobs/portal" className="text-blue-600 dark:text-cyan-400 font-bold">
                Offres d'emploi
              </Link>
              <Link href="/jobs/blog" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                Blog
              </Link>
              <Link href="/entreprises" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                Entreprises
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="hidden md:block px-5 py-2.5 text-slate-700 dark:text-slate-300 font-medium hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Connexion
            </Link>
            <Link 
              href="/register" 
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Créer un compte
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION MINIMALISTE */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white mb-4 leading-tight">
              Trouvez un emploi qui vous correspond
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">
              Explorez {jobs.length} opportunités dans les meilleures entreprises au Congo
            </p>

            {/* SEARCH BAR STYLE JUNGLE */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-2 border border-slate-200 dark:border-slate-700">
              <div className="flex flex-col md:flex-row gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="text"
                    placeholder="Titre du poste, mot-clé..."
                    className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors">
                  Rechercher
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* FILTERS BAR STYLE JUNGLE */}
      <div className="sticky top-[73px] z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 overflow-x-auto">
              <select
                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="">Type de contrat</option>
                <option value="CDI">CDI</option>
                <option value="CDD">CDD</option>
                <option value="STAGE">Stage</option>
              </select>

              <select
                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
              >
                <option value="">Ville</option>
                {uniqueLocations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>

              <select
                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
              >
                <option value="">Département</option>
                {uniqueDepartments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-2 transition-colors"
                >
                  <X size={16} />
                  Effacer les filtres
                </button>
              )}
            </div>

            <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {filteredJobs.length} offre{filteredJobs.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
            <p className="text-slate-500 dark:text-slate-400">Chargement des offres...</p>
          </div>
        ) : (
          <>
            {/* PREMIUM SECTION */}
            {premiumJobs.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg">
                    <Sparkles className="text-white" size={20} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Offres à la Une</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Les opportunités mises en avant par nos partenaires</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {premiumJobs.map((job, index) => (
                    <Link
                      key={job.id}
                      href={`/jobs/${job.id}`}
                      className="group relative bg-white dark:bg-slate-800 border-2 border-yellow-400/30 hover:border-yellow-400 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl"
                    >
                      {/* Premium Badge */}
                      <div className="absolute top-4 right-4 z-10 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-yellow-900 text-xs font-bold rounded-full flex items-center gap-1.5 shadow-lg">
                        <Sparkles size={12} />
                        PREMIUM
                      </div>

                      {/* Image ou placeholder */}
                      <div className="relative h-40 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
                        {job.imageUrl ? (
                          <Image 
                            src={job.imageUrl} 
                            alt={job.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Briefcase className="text-blue-300 dark:text-blue-700" size={48} />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-6">
                        <div className="flex items-start gap-4 mb-4">
                          {job.companyLogo ? (
                            <Image src={job.companyLogo} alt={job.company} width={48} height={48} className="rounded-lg border border-slate-200 dark:border-slate-700" />
                          ) : (
                            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                              <Building2 size={24} className="text-slate-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors mb-1 line-clamp-2">
                              {job.title}
                            </h3>
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{job.company}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-full">
                            <MapPin size={12} />
                            {job.location}
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-full">
                            <Clock size={12} />
                            {job.type}
                          </span>
                          {job.salaryRange && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-full">
                              <DollarSign size={12} />
                              {job.salaryRange}
                            </span>
                          )}
                        </div>

                        {job.requiredSkills.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {job.requiredSkills.slice(0, 3).map((skill, idx) => (
                              <span key={idx} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs rounded-md">
                                {skill}
                              </span>
                            ))}
                            {job.requiredSkills.length > 3 && (
                              <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs rounded-md">
                                +{job.requiredSkills.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}

            {/* REGULAR JOBS - LISTE STYLE JUNGLE */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Toutes les offres
                </h2>
              </div>

              {regularJobs.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                  <Briefcase size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                  <p className="text-lg font-semibold text-slate-500 dark:text-slate-400 mb-2">Aucune offre trouvée</p>
                  <p className="text-sm text-slate-400 dark:text-slate-500">Essayez de modifier vos critères de recherche</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {regularJobs.map((job, index) => (
                    <Link
                      key={job.id}
                      href={`/jobs/${job.id}`}
                      className="group block bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-cyan-500 rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg"
                    >
                      <div className="p-6 flex items-center gap-6">
                        {/* Logo */}
                        <div className="shrink-0">
                          {job.companyLogo ? (
                            <Image src={job.companyLogo} alt={job.company} width={56} height={56} className="rounded-lg border border-slate-200 dark:border-slate-700" />
                          ) : (
                            <div className="w-14 h-14 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                              <Building2 size={28} className="text-slate-400" />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors mb-1.5 line-clamp-1">
                            {job.title}
                          </h3>
                          
                          <div className="flex flex-wrap items-center gap-3 text-sm mb-3">
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {job.company}
                            </span>
                            {job.industry && (
                              <>
                                <span className="text-slate-300 dark:text-slate-700">•</span>
                                <span className="text-slate-500 dark:text-slate-400">{job.industry}</span>
                              </>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs font-medium rounded-md">
                              <MapPin size={12} />
                              {job.location}
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs font-medium rounded-md">
                              <Clock size={12} />
                              {job.type}
                            </span>
                            {job.department && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs font-medium rounded-md">
                                <Briefcase size={12} />
                                {job.department}
                              </span>
                            )}
                            {job.salaryRange && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-md">
                                <DollarSign size={12} />
                                {job.salaryRange}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-slate-500 dark:text-slate-400 text-xs">
                              <Calendar size={12} />
                              {new Date(job.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        </div>

                        {/* Arrow */}
                        <div className="shrink-0 hidden md:block">
                          <ChevronRight className="text-slate-400 group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors" size={24} />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* FOOTER MINIMALISTE */}
      <footer className="bg-slate-900 text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-bold mb-4">RH Konza</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                La plateforme de recrutement intelligente propulsée par l'IA pour l'Afrique.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm">Pour les candidats</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/jobs/portal" className="hover:text-white transition-colors">Rechercher un emploi</Link></li>
                <li><Link href="/jobs/blog" className="hover:text-white transition-colors">Blog carrière</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Créer un profil</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm">Pour les entreprises</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/entreprises" className="hover:text-white transition-colors">Publier une offre</Link></li>
                <li><Link href="/sirh" className="hover:text-white transition-colors">Solution SIRH</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Nous contacter</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm">À propos</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/about" className="hover:text-white transition-colors">Qui sommes-nous</Link></li>
                <li><Link href="/cgu" className="hover:text-white transition-colors">CGU</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Confidentialité</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
            <p>© 2026 RH Konza. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}