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