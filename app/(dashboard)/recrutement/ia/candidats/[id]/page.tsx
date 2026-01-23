'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, User, Mail, Phone, Calendar, Download, Loader2, 
  CheckCircle2, XCircle, AlertTriangle, BrainCircuit, Sparkles,
  TrendingUp, Award, Target, Zap, FileText, MapPin, Briefcase
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/services/api';

interface CandidateIA {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  resumeUrl: string;
  coverLetter?: string;
  aiSuggestion: 'RETENU' | 'MOYENNE' | 'SECONDE_CHANCE' | 'REFUS';
  hrDecision?: 'RETENU' | 'MOYENNE' | 'SECONDE_CHANCE' | 'REFUS';
  hrNotes?: string;
  totalScore: number;
  cvScore: number;
  testScore: number;
  aiReasoning: string;
  cvAnalysis: {
    strengths: string[];
    weaknesses: string[];
  };
  tabSwitchCount: number;
  suspiciousActivity: boolean;
  jobOffer: {
    title: string;
    location: string;
    type: string;
    department: { name: string };
  };
  createdAt: string;
}

const DECISION_CONFIG = {
  RETENU: { label: 'Retenu', color: 'from-emerald-500 to-emerald-600', icon: Award },
  MOYENNE: { label: 'Moyen', color: 'from-orange-500 to-orange-600', icon: TrendingUp },
  SECONDE_CHANCE: { label: 'Seconde Chance', color: 'from-purple-500 to-purple-600', icon: Target },
  REFUS: { label: 'Refusé', color: 'from-red-500 to-red-600', icon: XCircle }
};

export default function DetailCandidatIAPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [candidate, setCandidate] = useState<CandidateIA | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [hrDecision, setHrDecision] = useState<string | null>(null);
  const [hrNotes, setHrNotes] = useState('');
  const [isSavingDecision, setIsSavingDecision] = useState(false);

  useEffect(() => {
    fetchCandidate();
  }, []);

  const fetchCandidate = async () => {
    try {
      const data = await api.get<CandidateIA>(`/recruitment/candidates/${params.id}`);
      setCandidate(data);
      
      if (data.hrDecision) {
        setHrDecision(data.hrDecision);
        setHrNotes(data.hrNotes || '');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDecision = async () => {
    if (!hrDecision) {
      alert("⚠️ Veuillez choisir une décision");
      return;
    }

    setIsSavingDecision(true);
    try {
      await api.patch(`/recruitment/candidates/${params.id}/hr-decision`, {
        hrDecision,
        hrNotes
      });
      alert("✅ Décision enregistrée !");
      fetchCandidate();
    } catch (e: any) {
      alert(`❌ ${e.message}`);
    } finally {
      setIsSavingDecision(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-cyan-500 blur-2xl opacity-20 animate-pulse"></div>
          <Loader2 className="animate-spin text-cyan-500 relative z-10" size={48}/>
        </div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-4">
        <XCircle size={64} className="text-red-500 mb-6"/>
        <h1 className="text-3xl font-bold text-white mb-4">Candidat introuvable</h1>
        <Link href="/recrutement/ia/candidats" className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-colors">
          Retour au Pipeline
        </Link>
      </div>
    );
  }

  const aiConfig = DECISION_CONFIG[candidate.aiSuggestion];
  const AIIcon = aiConfig.icon;
  const hasOverride = candidate.hrDecision && candidate.hrDecision !== candidate.aiSuggestion;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4 relative z-10">
        
        {/* HEADER */}
        <div className="flex items-center gap-4 mb-10">
          <button 
            onClick={() => router.back()} 
            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all backdrop-blur-sm"
          >
            <ArrowLeft size={20} className="text-white"/>
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-3xl font-black text-white tracking-tight">
                {candidate.firstName} {candidate.lastName}
              </h1>
              <div className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center gap-2">
                <BrainCircuit size={16} className="text-cyan-400"/>
                <span className="text-xs font-bold text-cyan-400 uppercase">Analyse IA</span>
              </div>
            </div>
            <p className="text-slate-400">
              Postulé le {new Date(candidate.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* SIDEBAR */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl text-center sticky top-8">
              
              {/* Avatar */}
              <div className="w-28 h-28 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white text-4xl font-bold mx-auto mb-6 shadow-2xl shadow-cyan-500/50">
                {candidate.firstName[0]}{candidate.lastName[0]}
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2">
                {candidate.firstName} {candidate.lastName}
              </h2>
              
              {/* Suggestion IA */}
              <div className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r ${aiConfig.color} text-white font-bold text-sm mt-4 mb-8 shadow-lg`}>
                <AIIcon size={18} />
                Suggestion IA : {aiConfig.label}
              </div>

              {/* Score Total */}
              <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 p-6 rounded-2xl border-2 border-cyan-500/30 mb-8">
                <div className="text-center mb-4">
                  <p className="text-xs font-bold text-cyan-400 uppercase mb-2">Score Total</p>
                  <p className="text-6xl font-black text-cyan-400">{candidate.totalScore}</p>
                  <p className="text-slate-500 font-bold">/100</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-black/40 p-3 rounded-lg backdrop-blur-sm border border-white/5">
                    <p className="text-slate-500 uppercase font-bold mb-1">CV</p>
                    <p className="text-white font-bold text-lg">{candidate.cvScore}/35</p>
                  </div>
                  <div className="bg-black/40 p-3 rounded-lg backdrop-blur-sm border border-white/5">
                    <p className="text-slate-500 uppercase font-bold mb-1">Test</p>
                    <p className="text-white font-bold text-lg">{candidate.testScore}/65</p>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-4 mb-8 text-left">
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <Mail size={16} className="text-cyan-400"/>
                  <a href={`mailto:${candidate.email}`} className="hover:text-cyan-400 transition-colors break-all">
                    {candidate.email}
                  </a>
                </div>
                
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <Phone size={16} className="text-cyan-400"/>
                  <a href={`tel:${candidate.phone}`} className="hover:text-cyan-400 transition-colors">
                    {candidate.phone}
                  </a>
                </div>
                
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <Calendar size={16} className="text-cyan-400"/>
                  <span>{new Date(candidate.createdAt).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>

              {/* Download CV */}
              <a 
                href={candidate.resumeUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <Download size={20} />
                Télécharger le CV
              </a>
            </div>
          </motion.div>

          {/* MAIN CONTENT */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-6"
          >
            
            {/* POSTE VISÉ */}
            <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <Briefcase size={24} className="text-cyan-400"/>
                Poste visé
              </h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-bold text-slate-500 mb-2 uppercase">Titre</p>
                  <p className="text-2xl font-bold text-white">{candidate.jobOffer.title}</p>
                </div>
                
                <div className="flex flex-wrap gap-4">
                  <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/5 flex items-center gap-2">
                    <Briefcase size={16} className="text-purple-400"/>
                    <span className="text-white font-medium">{candidate.jobOffer.department.name}</span>
                  </div>
                  
                  <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/5 flex items-center gap-2">
                    <MapPin size={16} className="text-red-400"/>
                    <span className="text-white font-medium">{candidate.jobOffer.location}</span>
                  </div>
                  
                  <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/5 flex items-center gap-2">
                    <FileText size={16} className="text-orange-400"/>
                    <span className="text-white font-medium">{candidate.jobOffer.type}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ANALYSE IA */}
            <div className="bg-gradient-to-br from-cyan-950/50 to-blue-950/50 backdrop-blur-xl border-2 border-cyan-500/30 rounded-3xl p-8 shadow-2xl">
              <h3 className="text-2xl font-bold mb-8 flex items-center gap-3 text-white">
                <BrainCircuit className="text-cyan-400" size={28}/> 
                Intelligence Artificielle
              </h3>

              {/* Raisonnement IA */}
              {candidate.aiReasoning && (
                <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 p-6 rounded-2xl border border-emerald-500/30 mb-8">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={20} className="text-emerald-400"/>
                    <h4 className="font-bold text-emerald-400">Raisonnement IA</h4>
                  </div>
                  <p className="text-slate-300 leading-relaxed">{candidate.aiReasoning}</p>
                </div>
              )}

              {/* Forces / Faiblesses */}
              {candidate.cvAnalysis && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-emerald-500/5 p-6 rounded-2xl border border-emerald-500/30">
                    <h5 className="text-xs font-bold text-emerald-400 uppercase mb-4 flex items-center gap-2">
                      <CheckCircle2 size={16}/>
                      Points Forts
                    </h5>
                    <ul className="space-y-3">
                      {candidate.cvAnalysis.strengths?.map((s: string, i: number) => (
                        <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                          <Zap size={14} className="text-emerald-400 mt-1 shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="bg-red-500/5 p-6 rounded-2xl border border-red-500/30">
                    <h5 className="text-xs font-bold text-red-400 uppercase mb-4 flex items-center gap-2">
                      <XCircle size={16}/>
                      Points Faibles
                    </h5>
                    <ul className="space-y-3">
                      {candidate.cvAnalysis.weaknesses?.map((w: string, i: number) => (
                        <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                          <AlertTriangle size={14} className="text-red-400 mt-1 shrink-0" />
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Anti-triche */}
              {(candidate.tabSwitchCount > 0 || candidate.suspiciousActivity) && (
                <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-2xl p-6 mb-8 flex items-start gap-4">
                  <AlertTriangle size={24} className="text-yellow-400 shrink-0 mt-1" />
                  <div>
                    <h5 className="text-sm font-bold text-yellow-400 mb-2 uppercase">Activité Suspecte Détectée</h5>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {candidate.tabSwitchCount > 0 && `${candidate.tabSwitchCount} changement(s) d'onglet pendant le test. `}
                      {candidate.suspiciousActivity && 'Comportement anormal signalé par le système.'}
                    </p>
                  </div>
                </div>
              )}

              {/* DÉCISION RH */}
              <div className="pt-8 border-t border-white/10">
                <h4 className="text-xl font-bold mb-6 text-white flex items-center gap-3">
                  <User size={24} className="text-purple-400"/>
                  Votre Décision RH
                </h4>
                
                {hasOverride && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6 flex items-center gap-3">
                    <AlertTriangle size={20} className="text-yellow-400 shrink-0"/>
                    <p className="text-sm text-yellow-400 font-bold">
                      Vous avez override la suggestion IA ({candidate.aiSuggestion} → {candidate.hrDecision})
                    </p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {Object.entries(DECISION_CONFIG).map(([key, config]) => {
                    const Icon = config.icon;
                    return (
                      <button 
                        key={key} 
                        onClick={() => setHrDecision(key)} 
                        className={`p-5 rounded-xl border-2 font-bold transition-all flex items-center justify-center gap-2 ${
                          hrDecision === key 
                            ? `bg-gradient-to-r ${config.color} border-white/30 text-white shadow-lg scale-105` 
                            : 'border-white/10 text-slate-400 hover:border-white/30 bg-white/5'
                        }`}
                      >
                        <Icon size={20}/>
                        {config.label}
                      </button>
                    );
                  })}
                </div>
                
                <textarea 
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-5 mb-6 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-cyan-500/50 outline-none min-h-[120px] resize-none backdrop-blur-sm" 
                  placeholder="Vos observations et notes..." 
                  value={hrNotes} 
                  onChange={(e) => setHrNotes(e.target.value)} 
                />
                
                <button 
                  onClick={handleSaveDecision} 
                  disabled={!hrDecision || isSavingDecision} 
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-5 rounded-xl shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
                >
                  {isSavingDecision ? (
                    <Loader2 className="animate-spin" size={24} />
                  ) : (
                    <>
                      <CheckCircle2 size={24} />
                      Valider la Décision
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* LETTRE DE MOTIVATION */}
            {candidate.coverLetter && (
              <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                  <FileText size={24} className="text-cyan-400"/>
                  Lettre de Motivation
                </h3>
                
                <div className="prose prose-invert max-w-none">
                  <p className="text-slate-300 whitespace-pre-line leading-relaxed">
                    {candidate.coverLetter}
                  </p>
                </div>
              </div>
            )}

          </motion.div>
        </div>
      </div>
    </div>
  );
}