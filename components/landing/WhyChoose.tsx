'use client';

import React from 'react';
import { 
  Shield, Clock, BarChart3, CheckCircle2, Star,
  BarChart3 as BarIcon, Users, DollarSign, Calendar, 
  Clock as ClockIcon, Briefcase 
} from 'lucide-react';

const gridFeatures = [
  {
    icon: BarIcon,
    title: "Tableau de Bord Unique",
    desc: "Vue d'ensemble complète des données RH sur un seul écran",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10"
  },
  {
    icon: Users,
    title: "Gestion Centralisée",
    desc: "Profils employés, documents et historique professionnel en un lieu",
    color: "text-blue-400",
    bg: "bg-blue-500/10"
  },
  {
    icon: DollarSign,
    title: "Paie Automatisée",
    desc: "Calculs fiscaux, CNSS et bulletins téléchargeables automatiquement",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10"
  },
  {
    icon: Calendar,
    title: "Congés Simplifiés",
    desc: "Processus adapté avec validation et suivi des soldes facilité",
    color: "text-purple-400",
    bg: "bg-purple-500/10"
  },
  {
    icon: ClockIcon,
    title: "Présences Intelligentes",
    desc: "Registres automatisés avec arrivées, départs et horaires",
    color: "text-orange-400",
    bg: "bg-orange-500/10"
  },
  {
    icon: Briefcase,
    title: "Recrutement Intégré",
    desc: "Suivi des candidats et intégration numérique simplifiée",
    color: "text-pink-400",
    bg: "bg-pink-500/10"
  }
];

const benefits = [
  {
    icon: Shield,
    title: "Solution RH tout-en-un",
    desc: "Gérez vos employés, la paie, les présences et le recrutement depuis une plateforme unique",
    color: "text-emerald-400"
  },
  {
    icon: Clock,
    title: "Automatisation intelligente",
    desc: "Automatisez les tâches RH répétitives pour vous concentrer sur les décisions stratégiques",
    color: "text-blue-400"
  },
  {
    icon: BarChart3,
    title: "Analyses avancées",
    desc: "Prenez des décisions éclairées grâce à des analyses et des rapports avancés",
    color: "text-purple-400"
  },
  {
    icon: CheckCircle2,
    title: "Sécurité enterprise",
    desc: "Protégez vos données RH sensibles grâce à une sécurité de niveau entreprise",
    color: "text-yellow-400"
  }
];

export function WhyChoose() {
  return (
    <section className="py-16 sm:py-24 lg:py-32 relative bg-gradient-to-b from-transparent to-cyan-900/10 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 px-4">
            Pourquoi Choisir HRCongo ?
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-slate-400 max-w-3xl mx-auto px-4">
            Des solutions RH intelligentes, simples et performantes pour toutes les entreprises
          </p>
        </div>

        {/* Grid Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-16 sm:mb-20">
          {gridFeatures.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <div 
                key={i}
                className="group relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white/5 border border-white/10 hover:border-cyan-500/50 transition-all p-6 sm:p-8"
              >
                <div className={`absolute inset-0 ${feat.bg} opacity-0 group-hover:opacity-20 transition-opacity`}></div>
                
                <div className="relative">
                  <div className={`w-14 h-14 rounded-xl ${feat.bg} ${feat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon size={28} />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">{feat.title}</h3>
                  <p className="text-sm sm:text-base text-slate-400 leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Left Side - Benefits */}
          <div className="space-y-6">
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-6">
              Ce Qui Nous Rend Différents
            </h3>
            
            {benefits.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                    <Icon className={item.color} size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">{item.title}</h4>
                    <p className="text-sm text-slate-400">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Side - Social Proof */}
          <div className="p-8 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-8 text-center">
              Approuvé par les Leaders
            </h3>
            
            <div className="space-y-8">
              <div className="text-center">
                <div className="text-5xl font-black text-white mb-2">50+</div>
                <div className="text-slate-400">Entreprises utilisatrices</div>
              </div>
              
              <div className="text-center">
                <div className="text-5xl font-black text-white mb-2">2000+</div>
                <div className="text-slate-400">Employés gérés</div>
              </div>
              
              <div className="text-center">
                <div className="text-5xl font-black text-white mb-2">99%</div>
                <div className="text-slate-400">Satisfaction client</div>
              </div>

              <div className="pt-6 border-t border-white/10">
                <div className="flex items-center justify-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={20} className="fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-center text-sm text-slate-400">
                  "Une solution complète qui nous fait gagner un temps précieux"
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}