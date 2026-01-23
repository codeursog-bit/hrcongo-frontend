// ============================================================================
// 📁 components/landing/Hero.tsx
// ============================================================================
'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Play, Sparkles, Clock, Shield, CheckCircle2 } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-[400px] sm:w-[600px] lg:w-[800px] h-[400px] sm:h-[600px] lg:h-[800px] bg-cyan-500/10 rounded-full blur-[80px] sm:blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] sm:w-[500px] lg:w-[600px] h-[300px] sm:h-[500px] lg:h-[600px] bg-purple-500/10 rounded-full blur-[80px] sm:blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full relative z-10 text-center">
        
        <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-cyan-400 font-bold text-xs uppercase tracking-widest mb-6 sm:mb-8 hover:bg-white/10 transition-colors cursor-default">
          <Sparkles size={14} /> Conforme CGI 2025-2026
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-7xl xl:text-8xl font-black tracking-tight leading-[1.1] mb-6 sm:mb-8 px-4">
          Gérez Votre Paie<br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">Sans Stress.</span>
        </h1>

        <p className="text-base sm:text-lg lg:text-xl text-slate-400 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed px-4">
          Terminés les calculs manuels et les erreurs. HRCongo automatise votre paie, vos congés et votre pointage. 
          <span className="text-white font-semibold block mt-2">Tout est conforme. Tout est simple.</span>
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-12 sm:mb-16 px-4">
          <Link 
            href="/auth/register"
            className="w-full sm:w-auto group relative px-6 sm:px-8 py-3 sm:py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-900 rounded-2xl font-bold text-base sm:text-lg transition-all hover:scale-105 shadow-[0_0_40px_-10px_rgba(34,211,238,0.5)] text-center"
          >
            Démarrer gratuitement
            <ArrowRight className="inline-block ml-2 group-hover:translate-x-1 transition-transform" size={20} />
          </Link>
          <button className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl font-bold text-base sm:text-lg transition-all flex items-center justify-center gap-3 backdrop-blur-md">
            <Play size={20} className="fill-current" /> Voir la démo
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto px-4">
          {[
            { value: "< 3 min", label: "500 bulletins générés", icon: Clock },
            { value: "100%", label: "Conformité légale", icon: Shield },
            { value: "24/7", label: "Support disponible", icon: CheckCircle2 }
          ].map((stat, i) => (
            <div key={i} className="p-4 sm:p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <stat.icon className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400 mb-2 sm:mb-3 mx-auto" />
              <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-xs sm:text-sm text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
