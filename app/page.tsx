// 'use client';

// import React from 'react';
// import Link from 'next/link';
// import { 
//   ArrowRight, CheckCircle2, Shield, Clock, Zap, 
//   Menu, X, Play, Hexagon, Users, TrendingUp,
//   Sparkles, Star, DollarSign, Calendar, MapPin, 
//   BarChart3, Smartphone, Globe
// } from 'lucide-react';

// const Navbar = () => {
//   const [isOpen, setIsOpen] = React.useState(false);

//   return (
//     <nav className="fixed top-0 left-0 right-0 z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="flex justify-between items-center h-16 sm:h-20">
//           <div className="flex items-center gap-2 sm:gap-3">
//             <div className="relative group cursor-pointer">
//                <div className="absolute inset-0 bg-cyan-500 blur-lg opacity-50 group-hover:opacity-100 transition-opacity"></div>
//                <div className="relative w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-white border border-white/20">
//                  <Hexagon size={20} className="sm:w-6 sm:h-6" fill="currentColor" />
//                </div>
//             </div>
//             <span className="text-xl sm:text-2xl font-bold text-white tracking-tight">HRCongo</span>
//           </div>

//           <div className="hidden md:flex items-center gap-8 lg:gap-10">
//             {['Fonctionnalités', 'Tarifs', 'Contact'].map((item) => (
//                 <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-medium text-slate-400 hover:text-white transition-colors relative group">
//                     {item}
//                     <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cyan-500 transition-all group-hover:w-full"></span>
//                 </a>
//             ))}
//           </div>

//           <div className="hidden md:flex items-center gap-3 lg:gap-4">
//             <Link href="/auth/login" className="text-white font-bold hover:text-cyan-400 transition-colors px-3 lg:px-4 text-sm lg:text-base">
//               Connexion
//             </Link>
//             <Link 
//               href="/auth/register"
//               className="group relative px-4 lg:px-6 py-2 lg:py-3 bg-white text-slate-900 rounded-xl font-bold transition-all hover:scale-105 overflow-hidden text-sm lg:text-base"
//             >
//               <div className="absolute inset-0 bg-gradient-to-r from-cyan-300 via-cyan-400 to-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
//               <span className="relative z-10 flex items-center gap-2">Essai Gratuit <ArrowRight size={16}/></span>
//             </Link>
//           </div>

//           <div className="md:hidden">
//             <button onClick={() => setIsOpen(!isOpen)} className="text-white p-2">
//               {isOpen ? <X size={24} /> : <Menu size={24} />}
//             </button>
//           </div>
//         </div>

//         {/* Mobile Menu */}
//         {isOpen && (
//           <div className="md:hidden py-4 border-t border-white/5 space-y-4">
//             {['Fonctionnalités', 'Tarifs', 'Contact'].map((item) => (
//               <a 
//                 key={item} 
//                 href={`#${item.toLowerCase()}`} 
//                 className="block text-slate-300 hover:text-white transition-colors"
//                 onClick={() => setIsOpen(false)}
//               >
//                 {item}
//               </a>
//             ))}
//             <Link 
//               href="/auth/register"
//               className="w-full py-3 bg-cyan-500 text-slate-900 rounded-xl font-bold"
//             >
//               Essai Gratuit
//             </Link>
//           </div>
//         )}
//       </div>
//     </nav>
//   );
// };

// export default function LandingPage() {
//   return (
//     <div className="min-h-screen bg-[#020617] text-white selection:bg-cyan-500 selection:text-white">
//       <Navbar />

//       {/* --- HERO --- */}
//       <section className="relative min-h-screen flex items-center justify-center pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 overflow-hidden">
//         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
//         <div className="absolute top-0 right-0 w-[400px] sm:w-[600px] lg:w-[800px] h-[400px] sm:h-[600px] lg:h-[800px] bg-cyan-500/10 rounded-full blur-[80px] sm:blur-[120px] pointer-events-none" />
//         <div className="absolute bottom-0 left-0 w-[300px] sm:w-[500px] lg:w-[600px] h-[300px] sm:h-[500px] lg:h-[600px] bg-purple-500/10 rounded-full blur-[80px] sm:blur-[120px] pointer-events-none" />

//         <div className="max-w-7xl mx-auto w-full relative z-10 text-center">
          
//           <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-cyan-400 font-bold text-xs uppercase tracking-widest mb-6 sm:mb-8 hover:bg-white/10 transition-colors cursor-default">
//             <Sparkles size={14} /> Conforme CGI 2025-2026
//           </div>

//           <h1 className="text-4xl sm:text-5xl lg:text-7xl xl:text-8xl font-black tracking-tight leading-[1.1] mb-6 sm:mb-8 px-4">
//             Gérez Votre Paie<br className="hidden sm:block" />
//             <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">Sans Stress.</span>
//           </h1>

//           <p className="text-base sm:text-lg lg:text-xl text-slate-400 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed px-4">
//             Terminés les calculs manuels et les erreurs. HRCongo automatise votre paie, vos congés et votre pointage. 
//             <span className="text-white font-semibold block mt-2">Tout est conforme. Tout est simple.</span>
//           </p>

//           <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-12 sm:mb-16 px-4">
//             <Link 
//               href="/auth/register"
//               className="w-full sm:w-auto group relative px-6 sm:px-8 py-3 sm:py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-900 rounded-2xl font-bold text-base sm:text-lg transition-all hover:scale-105 shadow-[0_0_40px_-10px_rgba(34,211,238,0.5)] text-center"
//             >
//               Démarrer gratuitement
//               <ArrowRight className="inline-block ml-2 group-hover:translate-x-1 transition-transform" size={20} />
//             </Link>
//             <button className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl font-bold text-base sm:text-lg transition-all flex items-center justify-center gap-3 backdrop-blur-md">
//               <Play size={20} className="fill-current" /> Voir la démo
//             </button>
//           </div>

//           {/* Quick Stats */}
//           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto px-4">
//             {[
//               { value: "< 3 min", label: "500 bulletins générés", icon: Clock },
//               { value: "100%", label: "Conformité légale", icon: Shield },
//               { value: "24/7", label: "Support disponible", icon: CheckCircle2 }
//             ].map((stat, i) => (
//               <div key={i} className="p-4 sm:p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
//                 <stat.icon className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400 mb-2 sm:mb-3 mx-auto" />
//                 <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{stat.value}</div>
//                 <div className="text-xs sm:text-sm text-slate-400">{stat.label}</div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* --- FEATURES --- */}
//       <section id="fonctionnalités" className="py-16 sm:py-24 lg:py-32 relative px-4">
//          <div className="max-w-7xl mx-auto">
//             <div className="text-center mb-12 sm:mb-20">
//                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 px-4">
//                   Tout Ce Dont Vous Avez Besoin
//                </h2>
//                <p className="text-base sm:text-lg lg:text-xl text-slate-400 max-w-2xl mx-auto px-4">
//                   Une suite complète pour gérer vos employés efficacement
//                </p>
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
//                {[
//                   { 
//                      icon: Zap, 
//                      title: "Paie Automatique", 
//                      desc: "Génération des bulletins en un clic. Calculs fiscaux, CNSS et IRPP/ITS inclus.",
//                      color: "text-yellow-400", 
//                      bg: "bg-yellow-500/10"
//                   },
//                   { 
//                      icon: Shield, 
//                      title: "Conformité Garantie", 
//                      desc: "Toutes les règles légales congolaises appliquées automatiquement. Zéro risque.",
//                      color: "text-emerald-400", 
//                      bg: "bg-emerald-500/10"
//                   },
//                   { 
//                      icon: MapPin, 
//                      title: "Pointage Intelligent", 
//                      desc: "Vos équipes pointent depuis leur téléphone. Géolocalisation et alertes incluses.",
//                      color: "text-pink-400", 
//                      bg: "bg-pink-500/10"
//                   },
//                   { 
//                      icon: Calendar, 
//                      title: "Gestion des Congés", 
//                      desc: "Demandes en ligne, validation rapide, soldes automatiques. Simple et efficace.",
//                      color: "text-blue-400", 
//                      bg: "bg-blue-500/10"
//                   },
//                   { 
//                      icon: DollarSign, 
//                      title: "Prêts & Avances", 
//                      desc: "Gérez les demandes avec validation automatique des montants légaux.",
//                      color: "text-purple-400", 
//                      bg: "bg-purple-500/10"
//                   },
//                   { 
//                      icon: Users, 
//                      title: "Recrutement", 
//                      desc: "Publiez vos offres, gérez les candidatures et recrutez en quelques clics.",
//                      color: "text-orange-400", 
//                      bg: "bg-orange-500/10"
//                   }
//                ].map((feat, i) => (
//                   <div 
//                      key={i}
//                      className="group p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all hover:-translate-y-2"
//                   >
//                      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl ${feat.bg} ${feat.color} flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform`}>
//                         <feat.icon size={24} className="sm:w-7 sm:h-7" />
//                      </div>
//                      <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">{feat.title}</h3>
//                      <p className="text-sm sm:text-base text-slate-400 leading-relaxed">{feat.desc}</p>
//                   </div>
//                ))}
//             </div>
//          </div>
//       </section>

//       {/* --- TRUST --- */}
//       <section className="py-16 sm:py-24 lg:py-32 relative bg-gradient-to-b from-transparent to-cyan-900/10 px-4">
//          <div className="max-w-7xl mx-auto">
//             <div className="text-center mb-12 sm:mb-16">
//                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 px-4">Conformité Légale Intégrée</h2>
//                <p className="text-base sm:text-lg lg:text-xl text-slate-400 max-w-3xl mx-auto px-4">
//                   Les règles du Code Général des Impôts sont automatiquement respectées.
//                </p>
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
//                <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 text-center">
//                   <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 sm:mb-6">
//                      <Shield size={24} className="sm:w-8 sm:h-8" />
//                   </div>
//                   <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Barème Fiscal 2025</h3>
//                   <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
//                      Calcul IRPP/ITS automatique avec quotient familial
//                   </p>
//                </div>

//                <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 text-center">
//                   <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-4 sm:mb-6">
//                      <BarChart3 size={24} className="sm:w-8 sm:h-8" />
//                   </div>
//                   <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">CNSS Intégrée</h3>
//                   <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
//                      Parts salariale et patronale calculées automatiquement
//                   </p>
//                </div>

//                <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20 text-center">
//                   <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center mx-auto mb-4 sm:mb-6">
//                      <CheckCircle2 size={24} className="sm:w-8 sm:h-8" />
//                   </div>
//                   <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Protection SMIC</h3>
//                   <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
//                      Garantie légale de 91 000 FCFA net minimum
//                   </p>
//                </div>
//             </div>
//          </div>
//       </section>

//       {/* --- PRICING --- */}
//       <section id="tarifs" className="py-16 sm:py-24 lg:py-32 relative px-4">
//          <div className="max-w-7xl mx-auto">
//             <div className="text-center mb-12 sm:mb-20">
//                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 px-4">Tarifs Simples</h2>
//                <p className="text-base sm:text-lg lg:text-xl text-slate-400 px-4">Choisissez la formule adaptée à votre entreprise</p>
//             </div>

//             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
//                {/* STARTUP */}
//                <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-white/5 border border-white/10 hover:border-white/20 transition-all">
//                   <div className="mb-6 sm:mb-8">
//                      <div className="inline-block px-3 sm:px-4 py-1 rounded-full bg-slate-500/20 text-slate-400 text-xs font-bold mb-3 sm:mb-4 uppercase tracking-wider">
//                         Startup
//                      </div>
//                      <div className="flex items-baseline gap-2 mb-2">
//                         <span className="text-4xl sm:text-5xl font-black text-white">15K</span>
//                         <span className="text-lg sm:text-xl text-slate-400">FCFA/mois</span>
//                      </div>
//                      <p className="text-slate-400 text-sm">Jusqu'à 20 employés</p>
//                   </div>

//                   <div className="space-y-3 mb-6 sm:mb-8">
//                      {[
//                         "Paie automatique",
//                         "Gestion congés",
//                         "Pointage simple",
//                         "Bulletins PDF",
//                         "Support email"
//                      ].map((feature, i) => (
//                         <div key={i} className="flex items-center gap-3 text-sm">
//                            <CheckCircle2 className="text-slate-400 flex-shrink-0" size={18} />
//                            <span className="text-slate-300">{feature}</span>
//                         </div>
//                      ))}
//                   </div>

//                   <Link 
//                      href="/auth/register"
//                      className="w-full py-3 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-xl font-bold transition-all text-center block"
//                   >
//                      Démarrer
//                   </Link>
//                </div>

//                {/* BUSINESS */}
//                <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-2 border-cyan-500/50 shadow-2xl relative lg:scale-105">
//                   <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 px-3 sm:px-4 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-bold uppercase tracking-wider">
//                      Populaire
//                   </div>
                  
//                   <div className="mb-6 sm:mb-8">
//                      <div className="inline-block px-3 sm:px-4 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold mb-3 sm:mb-4 uppercase tracking-wider">
//                         Business
//                      </div>
//                      <div className="flex items-baseline gap-2 mb-2">
//                         <span className="text-4xl sm:text-5xl font-black text-white">35K</span>
//                         <span className="text-lg sm:text-xl text-slate-400">FCFA/mois</span>
//                      </div>
//                      <p className="text-slate-400 text-sm">Jusqu'à 100 employés</p>
//                   </div>

//                   <div className="space-y-3 mb-6 sm:mb-8">
//                      {[
//                         "Tout Startup +",
//                         "Prêts & avances",
//                         "Pointage GPS",
//                         "Formation continue",
//                         "Recrutement",
//                         "Rapports avancés",
//                         "Support prioritaire"
//                      ].map((feature, i) => (
//                         <div key={i} className="flex items-center gap-3 text-sm">
//                            <CheckCircle2 className="text-cyan-400 flex-shrink-0" size={18} />
//                            <span className="text-slate-300">{feature}</span>
//                         </div>
//                      ))}
//                   </div>

//                   <Link 
//                      href="/auth/register"
//                      className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-900 rounded-xl font-bold transition-all hover:scale-105 shadow-[0_0_40px_-10px_rgba(34,211,238,0.5)] text-center block"
//                   >
//                      Démarrer
//                   </Link>
//                </div>

//                {/* ENTERPRISE */}
//                <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-white/5 border border-white/10 hover:border-white/20 transition-all">
//                   <div className="mb-6 sm:mb-8">
//                      <div className="inline-block px-3 sm:px-4 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold mb-3 sm:mb-4 uppercase tracking-wider">
//                         Enterprise
//                      </div>
//                      <div className="flex items-baseline gap-2 mb-2">
//                         <span className="text-4xl sm:text-5xl font-black text-white">65K</span>
//                         <span className="text-lg sm:text-xl text-slate-400">FCFA/mois</span>
//                      </div>
//                      <p className="text-slate-400 text-sm">Illimité</p>
//                   </div>

//                   <div className="space-y-3 mb-6 sm:mb-8">
//                      {[
//                         "Tout Business +",
//                         "Multi-départements",
//                         "API & Intégrations",
//                         "Exports comptables",
//                         "Formation sur-mesure",
//                         "Gestionnaire dédié",
//                         "Support 24/7"
//                      ].map((feature, i) => (
//                         <div key={i} className="flex items-center gap-3 text-sm">
//                            <CheckCircle2 className="text-purple-400 flex-shrink-0" size={18} />
//                            <span className="text-slate-300">{feature}</span>
//                         </div>
//                      ))}
//                   </div>

//                   <Link 
//                      href="/auth/register"
//                      className="w-full py-3 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-xl font-bold transition-all text-center block"
//                   >
//                      Nous contacter
//                   </Link>
//                </div>
//             </div>

//             <p className="text-center text-slate-500 mt-8 sm:mt-12 text-sm sm:text-base px-4">
//               14 jours d'essai gratuit • Sans engagement • Support en français
//             </p>
//          </div>
//       </section>

//       {/* --- CTA --- */}
//       <section id="contact" className="py-16 sm:py-24 lg:py-32 relative overflow-hidden px-4">
//          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-cyan-900/20 pointer-events-none"></div>
//          <div className="max-w-4xl mx-auto text-center relative z-10">
//             <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 sm:mb-8 px-4">
//               Prêt à Simplifier Votre Paie ?
//             </h2>
//             <p className="text-base sm:text-lg lg:text-xl text-slate-400 mb-8 sm:mb-12 px-4">
//               Rejoignez les entreprises congolaises qui nous font confiance.
//             </p>
//             <Link 
//                href="/auth/register"
//                className="inline-flex items-center gap-3 px-8 sm:px-10 py-4 sm:py-5 bg-white text-slate-900 rounded-full font-bold text-lg sm:text-xl shadow-[0_0_50px_rgba(255,255,255,0.3)] hover:scale-105 transition-transform"
//             >
//                Commencer gratuitement <ArrowRight size={24} />
//             </Link>
//             <p className="text-slate-500 mt-4 sm:mt-6 text-sm sm:text-base px-4">
//               Aucune carte bancaire requise
//             </p>
//          </div>
//       </section>

//       {/* --- FOOTER --- */}
//       <footer className="border-t border-white/5 py-8 sm:py-12 px-4">
//          <div className="max-w-7xl mx-auto">
//             <div className="flex flex-col md:flex-row justify-between items-center gap-6">
//                <div className="flex items-center gap-2 sm:gap-3">
//                   <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
//                      <Hexagon size={16} fill="white" />
//                   </div>
//                   <span className="font-bold text-white">HRCongo</span>
//                </div>
//                <div className="flex flex-wrap justify-center gap-6 sm:gap-8 text-sm text-slate-400">
//                   <a href="#" className="hover:text-white transition-colors">À propos</a>
//                   <a href="#" className="hover:text-white transition-colors">Blog</a>
//                   <a href="#" className="hover:text-white transition-colors">CGU</a>
//                   <a href="#" className="hover:text-white transition-colors">Contact</a>
//                </div>
//             </div>
//             <div className="text-center mt-6 sm:mt-8 text-slate-500 text-xs sm:text-sm">
//                © 2025 HRCongo. Conforme CGI Congo-Brazzaville.
//             </div>
//          </div>
//       </footer>

//     </div>
//   );
// }


// ============================================================================
// 📁 app/page.tsx - AVEC SCROLLBAR VISIBLE
// ============================================================================
'use client';

import { useEffect } from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';
import { WhyChoose } from '@/components/landing/WhyChoose';
import { Pricing } from '@/components/landing/Pricing';
import { CTA } from '@/components/landing/CTA';
import { Footer } from '@/components/landing/Footer';

export default function LandingPage() {
  // ✅ Ajouter la classe visible-scrollbar au body au montage
  useEffect(() => {
    document.body.classList.add('visible-scrollbar');
    document.documentElement.classList.add('visible-scrollbar');
    
    // ✅ Nettoyer au démontage (quand on quitte la page)
    return () => {
      document.body.classList.remove('visible-scrollbar');
      document.documentElement.classList.remove('visible-scrollbar');
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-cyan-500 selection:text-white">
      <Navbar />
      <Hero />
      <Features />
      <WhyChoose />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  );
}