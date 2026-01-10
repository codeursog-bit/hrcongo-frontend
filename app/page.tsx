
'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowRight, CheckCircle2, Shield, Clock, Zap, 
  Menu, X, Play, Hexagon, CreditCard, Layout, Globe, Star,
  MousePointer2, Sparkles, Fingerprint
} from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';

const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-24">
          <div className="flex items-center gap-3">
            <div className="relative group cursor-pointer">
               <div className="absolute inset-0 bg-cyan-500 blur-lg opacity-50 group-hover:opacity-100 transition-opacity"></div>
               <div className="relative w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-white border border-white/20">
                 <Hexagon size={24} fill="currentColor" />
               </div>
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">HRCongo</span>
          </div>

          <div className="hidden md:flex items-center gap-10">
            {['Fonctionnalités', 'Tarifs', 'Témoignages'].map((item) => (
                <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-medium text-slate-400 hover:text-white transition-colors relative group">
                    {item}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cyan-500 transition-all group-hover:w-full"></span>
                </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/auth/login" className="text-white font-bold hover:text-cyan-400 transition-colors px-4">
              Se connecter
            </Link>
            <Link 
              href="/auth/register"
              className="group relative px-6 py-3 bg-white text-slate-900 rounded-xl font-bold transition-all hover:scale-105 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-300 via-cyan-400 to-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10 flex items-center gap-2">Essai Gratuit <ArrowRight size={16}/></span>
            </Link>
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-white">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default function LandingPage() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const y2 = useTransform(scrollY, [0, 500], [0, -150]);

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-cyan-500 selection:text-white overflow-hidden">
      <Navbar />

      {/* --- HERO --- */}
      <section className="relative min-h-screen flex items-center justify-center pt-32 pb-20 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
        <motion.div style={{ y: y1 }} className="absolute top-0 right-0 w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
        <motion.div style={{ y: y2 }} className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-cyan-400 font-bold text-xs uppercase tracking-widest mb-8 hover:bg-white/10 transition-colors cursor-default"
          >
            <Sparkles size={14} /> Nouvelle Version 2.0
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-6xl lg:text-8xl font-black tracking-tight leading-[1.1] mb-8"
          >
            La Paie Congolaise <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 animate-gradient-x">Réinventée.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            Une suite RH complète conçue pour l'excellence. Conformité CNSS & ITS, gestion des talents, et automatisation de la paie. Le tout dans une interface fluide.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <Link 
              href="/auth/register"
              className="group relative px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-900 rounded-2xl font-bold text-lg transition-all hover:scale-105 shadow-[0_0_40px_-10px_rgba(34,211,238,0.5)]"
            >
              Commencer maintenant
              <ArrowRight className="inline-block ml-2 group-hover:translate-x-1 transition-transform" size={20} />
            </Link>
            <button className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl font-bold text-lg transition-all flex items-center gap-3 backdrop-blur-md">
              <Play size={20} className="fill-current" /> Démo Interactive
            </button>
          </motion.div>

          {/* Trusted Logos */}
          <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: 1, duration: 1 }}
             className="mt-20 pt-10 border-t border-white/5"
          >
             <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-8">Ils nous font confiance</p>
             <div className="flex flex-wrap justify-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                {['TotalEnergies', 'MTN Congo', 'Canal+', 'Bolloré', 'Airtel'].map(brand => (
                   <span key={brand} className="text-2xl font-bold text-white">{brand}</span>
                ))}
             </div>
          </motion.div>
        </div>
      </section>

      {/* --- DASHBOARD PREVIEW --- */}
      <section className="py-20 relative">
         <div className="max-w-7xl mx-auto px-4">
            <div className="relative rounded-[32px] p-2 bg-gradient-to-b from-white/10 to-transparent">
               <div className="relative rounded-[30px] overflow-hidden bg-[#0B1121] shadow-2xl border border-white/10">
                  <div className="absolute top-0 left-0 right-0 h-10 bg-white/5 flex items-center px-4 gap-2 border-b border-white/5">
                     <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                     <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                     <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                  </div>
                  <img 
                     src="https://images.unsplash.com/photo-1664575602276-acd073f104c1?q=80&w=2070&auto=format&fit=crop" 
                     alt="App Interface" 
                     className="w-full mt-10 opacity-80 hover:opacity-100 transition-opacity duration-700"
                  />
                  {/* Floating Stats */}
                  <div className="absolute bottom-10 left-10 p-6 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-2xl animate-bounce-slow hidden md:block">
                     <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
                           <CreditCard size={24} />
                        </div>
                        <div>
                           <p className="text-slate-400 text-xs uppercase font-bold">Paie Validée</p>
                           <p className="text-2xl font-bold text-white">45.2M FCFA</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section id="features" className="py-32 relative">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {[
                  { icon: Shield, title: "100% Conforme", desc: "Barèmes ITS, CNSS patronale et salariale mis à jour automatiquement.", color: "text-emerald-400", bg: "bg-emerald-500/10" },
                  { icon: Zap, title: "Paie Éclair", desc: "Générez 500 bulletins en moins de 3 minutes. Automatisation totale.", color: "text-yellow-400", bg: "bg-yellow-500/10" },
                  { icon: Fingerprint, title: "Pointage Biométrique", desc: "Intégration native avec vos pointeuses ou via application mobile.", color: "text-purple-400", bg: "bg-purple-500/10" }
               ].map((feat, i) => (
                  <motion.div 
                     key={i}
                     initial={{ opacity: 0, y: 30 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     viewport={{ once: true }}
                     transition={{ delay: i * 0.1 }}
                     className="group p-8 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all hover:-translate-y-2"
                  >
                     <div className={`w-14 h-14 rounded-2xl ${feat.bg} ${feat.color} flex items-center justify-center mb-6`}>
                        <feat.icon size={28} />
                     </div>
                     <h3 className="text-2xl font-bold text-white mb-4">{feat.title}</h3>
                     <p className="text-slate-400 leading-relaxed">{feat.desc}</p>
                  </motion.div>
               ))}
            </div>
         </div>
      </section>

      {/* --- CTA FOOTER --- */}
      <section className="py-32 relative overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-b from-transparent to-cyan-900/20 pointer-events-none"></div>
         <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
            <h2 className="text-5xl font-bold text-white mb-8">Prêt à moderniser votre RH ?</h2>
            <p className="text-xl text-slate-400 mb-12">Rejoignez l'élite des entreprises congolaises.</p>
            <Link 
               href="/auth/register"
               className="inline-flex items-center gap-3 px-10 py-5 bg-white text-slate-900 rounded-full font-bold text-xl shadow-[0_0_50px_rgba(255,255,255,0.3)] hover:scale-105 transition-transform"
            >
               Créer un compte <ArrowRight size={24} />
            </Link>
         </div>
      </section>

    </div>
  );
}
