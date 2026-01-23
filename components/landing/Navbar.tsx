// ============================================================================
// 📁 components/landing/Navbar.tsx
// ============================================================================
'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Menu, X, Hexagon } from 'lucide-react';

export function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative group cursor-pointer">
               <div className="absolute inset-0 bg-cyan-500 blur-lg opacity-50 group-hover:opacity-100 transition-opacity"></div>
               <div className="relative w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-white border border-white/20">
                 <Hexagon size={20} className="sm:w-6 sm:h-6" fill="currentColor" />
               </div>
            </div>
            <span className="text-xl sm:text-2xl font-bold text-white tracking-tight">HRCongo</span>
          </div>

          <div className="hidden md:flex items-center gap-8 lg:gap-10">
            {['Fonctionnalités', 'Tarifs', 'Contact'].map((item) => (
                <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-medium text-slate-400 hover:text-white transition-colors relative group">
                    {item}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cyan-500 transition-all group-hover:w-full"></span>
                </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3 lg:gap-4">
            <Link href="/auth/login" className="text-white font-bold hover:text-cyan-400 transition-colors px-3 lg:px-4 text-sm lg:text-base">
              Connexion
            </Link>
            <Link 
              href="/auth/register"
              className="group relative px-4 lg:px-6 py-2 lg:py-3 bg-white text-slate-900 rounded-xl font-bold transition-all hover:scale-105 overflow-hidden text-sm lg:text-base"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-300 via-cyan-400 to-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10 flex items-center gap-2">Essai Gratuit <ArrowRight size={16}/></span>
            </Link>
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-white p-2">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden py-4 border-t border-white/5 space-y-4">
            {['Fonctionnalités', 'Tarifs', 'Contact'].map((item) => (
              <a 
                key={item} 
                href={`#${item.toLowerCase()}`} 
                className="block text-slate-300 hover:text-white transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {item}
              </a>
            ))}
            <Link 
              href="/auth/register"
              className="w-full py-3 bg-cyan-500 text-slate-900 rounded-xl font-bold text-center block"
            >
              Essai Gratuit
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
