// ============================================================================
// 📁 components/landing/CTA.tsx
// ============================================================================
'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function CTA() {
  return (
    <section id="contact" className="py-16 sm:py-24 lg:py-32 relative overflow-hidden px-4">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-cyan-900/20 pointer-events-none"></div>
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 sm:mb-8 px-4">
          Prêt à Simplifier Votre Paie ?
        </h2>
        <p className="text-base sm:text-lg lg:text-xl text-slate-400 mb-8 sm:mb-12 px-4">
          Rejoignez les entreprises congolaises qui nous font confiance.
        </p>
        <Link 
          href="/auth/register"
          className="inline-flex items-center gap-3 px-8 sm:px-10 py-4 sm:py-5 bg-white text-slate-900 rounded-full font-bold text-lg sm:text-xl shadow-[0_0_50px_rgba(255,255,255,0.3)] hover:scale-105 transition-transform"
        >
          Commencer gratuitement <ArrowRight size={24} />
        </Link>
        <p className="text-slate-500 mt-4 sm:mt-6 text-sm sm:text-base px-4">
          Aucune carte bancaire requise
        </p>
      </div>
    </section>
  );
}