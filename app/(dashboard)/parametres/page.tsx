
'use client';

import React from 'react';
import Link from 'next/link';
import { Settings, Wallet, Users, Lock, ChevronRight, Building2, Network } from 'lucide-react';

export default function ParametresPage() {
  const modules = [
    { 
      title: 'Entreprise', 
      desc: 'Infos légales, branding, coordonnées.', 
      icon: Building2, 
      color: 'bg-blue-500',
      path: '/parametres/entreprise' 
    },
    { 
      title: 'Départements', 
      desc: 'Structure organisationnelle et services.', 
      icon: Network, 
      color: 'bg-indigo-500',
      path: '/parametres/departements' 
    },
    { 
      title: 'Paramètres de Paie', 
      desc: 'Taux CNSS, Barèmes ITS, Heures Supp.', 
      icon: Wallet, 
      color: 'bg-emerald-500',
      path: '/parametres/paie' 
    },
    { 
      title: 'Gestion Utilisateurs', 
      desc: 'Rôles, permissions et accès.', 
      icon: Users, 
      color: 'bg-sky-500',
      path: '/parametres/users' 
    },
    { 
      title: 'Sécurité', 
      desc: 'Double authentification, mot de passe.', 
      icon: Lock, 
      color: 'bg-purple-500',
      path: '#' 
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
       <div className="flex items-center gap-4">
         <div className="p-3 bg-gradient-to-br from-gray-800 to-black rounded-2xl border border-white/10 shadow-xl">
            <Settings size={32} className="text-white" />
         </div>
         <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Système & Configuration</h1>
            <p className="text-gray-500 dark:text-gray-400">Pilotez le cœur de votre organisation.</p>
         </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modules.map((mod, i) => (
             <Link href={mod.path} key={i}>
                <div className="group bg-white dark:bg-gray-800/50 backdrop-blur-xl rounded-3xl p-6 border border-gray-100 dark:border-white/5 hover:border-sky-500/30 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer flex items-center gap-5 relative overflow-hidden">
                   <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-white/0 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700`}></div>
                   
                   <div className={`w-16 h-16 rounded-2xl ${mod.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 relative z-10`}>
                      <mod.icon size={32} />
                   </div>
                   
                   <div className="flex-1 relative z-10">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-sky-500 transition-colors">{mod.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{mod.desc}</p>
                   </div>
                   
                   <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 group-hover:bg-sky-500 group-hover:text-white transition-all duration-300">
                      <ChevronRight size={20} />
                   </div>
                </div>
             </Link>
          ))}
       </div>
    </div>
  );
}
