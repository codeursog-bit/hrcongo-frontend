// ============================================================================
// 📁 components/landing/Pricing.tsx
// ============================================================================
'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

const plans = [
  {
    name: "Gratuit",
    price: "0",
    limit: "Jusqu'à 5 employés",
    badge: null,
    badgeColor: "bg-slate-500/20 text-slate-400",
    features: [
      "Paie basique",
      "Gestion congés",
      "Pointage simple",
      "1 utilisateur",
      "Support communautaire"
    ],
    iconColor: "text-slate-400",
    buttonStyle: "bg-white/10 hover:bg-white/20 text-white border border-white/10"
  },
  {
    name: "Startup",
    price: "15K",
    limit: "Jusqu'à 20 employés",
    badge: null,
    badgeColor: "bg-blue-500/20 text-blue-400",
    features: [
      "Tout Gratuit +",
      "Calcul fiscal complet",
      "Bulletins PDF",
      "3 utilisateurs",
      "Support email"
    ],
    iconColor: "text-blue-400",
    buttonStyle: "bg-white/10 hover:bg-white/20 text-white border border-white/10"
  },
  {
    name: "Business",
    price: "35K",
    limit: "Jusqu'à 100 employés",
    badge: "Populaire",
    badgeColor: "bg-cyan-500/20 text-cyan-400",
    isPopular: true,
    features: [
      "Tout Startup +",
      "Prêts & avances",
      "Pointage GPS",
      "Formation",
      "Recrutement",
      "10 utilisateurs",
      "Support prioritaire"
    ],
    iconColor: "text-cyan-400",
    buttonStyle: "bg-cyan-500 hover:bg-cyan-400 text-slate-900"
  },
  {
    name: "Enterprise",
    price: "65K",
    limit: "Illimité",
    badge: null,
    badgeColor: "bg-purple-500/20 text-purple-400",
    features: [
      "Tout Business +",
      "Multi-départements",
      "API & Intégrations",
      "Exports comptables",
      "Formation sur-mesure",
      "Utilisateurs illimités",
      "Gestionnaire dédié",
      "Support 24/7"
    ],
    iconColor: "text-purple-400",
    buttonStyle: "bg-white/10 hover:bg-white/20 text-white border border-white/10"
  }
];

export function Pricing() {
  return (
    <section id="tarifs" className="py-16 sm:py-24 lg:py-32 relative px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 sm:mb-20">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 px-4">Tarifs Simples</h2>
          <p className="text-base sm:text-lg lg:text-xl text-slate-400 px-4">Choisissez la formule adaptée à votre entreprise</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8 max-w-7xl mx-auto">
          {plans.map((plan, idx) => (
            <div 
              key={idx}
              className={`p-6 sm:p-8 rounded-2xl sm:rounded-3xl ${
                plan.isPopular 
                  ? 'bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-2 border-cyan-500/50 shadow-2xl relative lg:scale-105' 
                  : 'bg-white/5 border border-white/10 hover:border-white/20'
              } transition-all`}
            >
              {plan.badge && (
                <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 px-3 sm:px-4 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-bold uppercase tracking-wider">
                  {plan.badge}
                </div>
              )}
              
              <div className="mb-6 sm:mb-8">
                <div className={`inline-block px-3 sm:px-4 py-1 rounded-full ${plan.badgeColor} text-xs font-bold mb-3 sm:mb-4 uppercase tracking-wider`}>
                  {plan.name}
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl sm:text-5xl font-black text-white">{plan.price}</span>
                  {plan.price !== "0" && <span className="text-lg sm:text-xl text-slate-400">FCFA/mois</span>}
                  {plan.price === "0" && <span className="text-lg sm:text-xl text-slate-400">FCFA</span>}
                </div>
                <p className="text-slate-400 text-sm">{plan.limit}</p>
              </div>

              <div className="space-y-3 mb-6 sm:mb-8">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className={`${plan.iconColor} flex-shrink-0`} size={18} />
                    <span className="text-slate-300">{feature}</span>
                  </div>
                ))}
              </div>

              <Link 
                href="/auth/register"
                className={`w-full py-3 rounded-xl font-bold transition-all text-center block ${plan.buttonStyle} ${
                  plan.isPopular ? 'hover:scale-105 shadow-[0_0_40px_-10px_rgba(34,211,238,0.5)]' : ''
                }`}
              >
                {plan.name === "Enterprise" ? "Nous contacter" : "Démarrer"}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-slate-500 mt-8 sm:mt-12 text-sm sm:text-base px-4">
          14 jours d'essai gratuit • Sans engagement • Support en français
        </p>
      </div>
    </section>
  );
}
