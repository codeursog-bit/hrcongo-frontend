'use client';

import React from 'react';
import Link from 'next/link';
import { Settings, Wallet, Users, Lock, ChevronRight, Building2, Network, Gift, Receipt,Crown,Palette } from 'lucide-react';

export default function ParametresPage() {
  const modules = [
    {
      title: 'Entreprise',
      desc: 'Infos légales, branding, coordonnées.',
      icon: Building2,
      color: 'bg-emerald-500',
      path: '/parametres/entreprise',
    },
    {
      title: 'Départements',
      desc: 'Structure organisationnelle et services.',
      icon: Network,
      color: 'bg-amber-500',
      path: '/parametres/departements',
    },
    {
      title: 'Paramètres de Paie',
      desc: 'Taux CNSS, Barèmes ITS, Heures Supp.',
      icon: Wallet,
      color: 'bg-emerald-500',
      path: '/parametres/paie',
    },
    {
      title: 'Catalogue des Primes',
      desc: 'Créez vos types de primes, configurez ITS et CNSS.',
      icon: Gift,
      color: 'bg-amber-500',
      path: '/parametres/primes',
    },
    {
      title: 'Cotisations & Taxes',
      desc: 'TOL, CAMU, taxes personnalisées salarié / patronales.',
      icon: Receipt,
      color: 'bg-emerald-500',
      path: '/parametres/taxes',
    },
    {
      title: 'Gestion Utilisateurs',
      desc: 'Rôles, permissions et accès.',
      icon: Users,
      color: 'bg-amber-500',
      path: '/parametres/users',
    },
    {
  title: 'Abonnement',
  desc: 'Plan actuel, utilisation et facturation.',
  icon: Crown,
  color: 'bg-emerald-500',
  path: '/parametres/subscription',
},
    {
      title: 'Sécurité',
      desc: 'Double authentification, mot de passe.',
      icon: Lock,
      color: 'bg-amber-500',
      path: '/parametres/securite',
    },
{
  title: 'Apparence Bulletin',
  desc: 'Personnalisez le design de vos bulletins de paie.',
  icon: Palette,
  color: 'bg-emerald-500',
  path: '/parametres/bulletin',
},
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-emerald-600 rounded-2xl border border-[var(--border)] shadow-xl">
          <Settings size={32} className="text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[var(--text)] tracking-tight">Système & Configuration</h1>
          <p className="text-[var(--text-muted)]">Pilotez le cœur de votre organisation.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modules.map((mod, i) => (
          <Link href={mod.path} key={i}>
            <div className="group bg-[var(--surface)] backdrop-blur-xl rounded-2xl p-6 border border-[var(--border)] hover:border-emerald-500/30 hover:bg-[var(--surface-2)] transition-all cursor-pointer flex items-center gap-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700" />
              <div className={`w-16 h-16 rounded-2xl ${mod.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 relative z-10`}>
                <mod.icon size={32} />
              </div>
              <div className="flex-1 relative z-10">
                <h3 className="text-xl font-bold text-[var(--text)] group-hover:text-emerald-500 transition-colors">{mod.title}</h3>
                <p className="text-sm text-[var(--text-muted)] mt-1">{mod.desc}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[var(--surface-2)] flex items-center justify-center text-[var(--text-muted)] group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                <ChevronRight size={20} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}