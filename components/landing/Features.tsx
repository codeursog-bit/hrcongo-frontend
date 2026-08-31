// ============================================================================
// 📁 components/landing/Features.tsx
// ============================================================================
'use client';

import React from 'react';
import { Zap, Shield, MapPin, Calendar, DollarSign, Users } from 'lucide-react';

const features = [
  { 
    icon: Zap, 
    title: "Paie Automatique", 
    desc: "Génération des bulletins en un clic. Calculs fiscaux, CNSS et IRPP/ITS inclus.",
    color: "text-yellow-400", 
    bg: "bg-yellow-500/10"
  },
  { 
    icon: Shield, 
    title: "Conformité Garantie", 
    desc: "Toutes les règles légales congolaises appliquées automatiquement. Zéro risque.",
    color: "text-emerald-400", 
    bg: "bg-emerald-500/10"
  },
  { 
    icon: MapPin, 
    title: "Pointage Intelligent", 
    desc: "Vos équipes pointent depuis leur téléphone. Géolocalisation et alertes incluses.",
    color: "text-pink-400", 
    bg: "bg-pink-500/10"
  },
  { 
    icon: Calendar, 
    title: "Gestion des Congés", 
    desc: "Demandes en ligne, validation rapide, soldes automatiques. Simple et efficace.",
    color: "text-blue-400", 
    bg: "bg-blue-500/10"
  },
  { 
    icon: DollarSign, 
    title: "Prêts & Avances", 
    desc: "Gérez les demandes avec validation automatique des montants légaux.",
    color: "text-purple-400", 
    bg: "bg-purple-500/10"
  },
  { 
    icon: Users, 
    title: "Recrutement", 
    desc: "Publiez vos offres, gérez les candidatures et recrutez en quelques clics.",
    color: "text-orange-400", 
    bg: "bg-orange-500/10"
  }
];

export function Features() {
  return (
    <section id="fonctionnalités" className="py-16 sm:py-24 lg:py-32 relative px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 sm:mb-20">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 px-4">
            Tout Ce Dont Vous Avez Besoin
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-slate-400 max-w-2xl mx-auto px-4">
            Une suite complète pour gérer vos employés efficacement
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <div 
                key={i}
                className="group p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all hover:-translate-y-2"
              >
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl ${feat.bg} ${feat.color} flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform`}>
                  <Icon size={24} className="sm:w-7 sm:h-7" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">{feat.title}</h3>
                <p className="text-sm sm:text-base text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}