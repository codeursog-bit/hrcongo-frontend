'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Users, Target, BarChart3, GitCompare, TrendingUp, Award, Info,
  PieChart as PieChartIcon, AlertTriangle, ArrowLeft, Loader2, BrainCircuit,
  CheckCircle2, XCircle, Clock, Sparkles
} from 'lucide-react';
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { api } from '@/services/api';
import Link from 'next/link';

interface AIStats {
  total: number;
  retenu: number;
  moyenne: number;
  seconde: number;
  refus: number;
  overrideRate: number;
  avgScore: number;
}

// Type pour les données brutes de l'API
interface CandidateAPIResponse {
  id: string;
  firstName: string;
  lastName: string;
  aiSuggestion: string;
  hrDecision: string | null;
  totalScore: number;
  cvScore: number;
  testScore: number;
  jobOffer?: {
    title: string;
  };
}

// Type pour l'affichage
interface CandidateResult {
  id: string;
  name: string;
  jobTitle: string;
  aiSuggestion: string;
  hrDecision: string | null;
  totalScore: number;
  cvScore: number;
  testScore: number;
}

export default function AnalyticsAIPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AIStats | null>(null);
  const [candidates, setCandidates] = useState<CandidateResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsData, candidatesData] = await Promise.all([
        api.get<AIStats>('/recruitment/ai-stats'),
        api.get<CandidateAPIResponse[]>('/recruitment/candidates')
      ]);
      
      setStats(statsData);
      
      // Filtrer et transformer les candidats avec aiSuggestion
      const aiCandidates = candidatesData
        .filter(c => c.aiSuggestion)
        .map(c => ({
          id: c.id,
          name: `${c.firstName} ${c.lastName}`,
          jobTitle: c.jobOffer?.title || 'Poste non spécifié',
          aiSuggestion: c.aiSuggestion,
          hrDecision: c.hrDecision,
          totalScore: c.totalScore || 0,
          cvScore: c.cvScore || 0,
          testScore: c.testScore || 0
        }));
      
      setCandidates(aiCandidates);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-cyan-500" size={40} />
      </div>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-cyan-500/30">
            <BrainCircuit size={40} className="text-cyan-400"/>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Aucune Donnée IA Disponible</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Publiez des offres en mode <span className="font-bold text-cyan-400">IA Assistée</span> pour voir les statistiques apparaître ici.
          </p>
          <Link href="/recrutement" className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold inline-flex items-center gap-2 hover:scale-105 transition-transform">
            <ArrowLeft size={20}/> Retour au Recrutement
          </Link>
        </div>
      </div>
    );
  }

  const pieData = [
    { name: 'Retenus', value: stats.retenu, fill: '#10b981' },
    { name: 'Moyens', value: stats.moyenne, fill: '#f97316' },
    { name: 'Seconde Chance', value: stats.seconde, fill: '#a855f7' },
    { name: 'Refusés', value: stats.refus, fill: '#ef4444' }
  ];

  const retentionRate = stats.total > 0 
    ? Math.round((stats.retenu / stats.total) * 100) 
    : 0;

  return (
    <div className="min-h-screen p-4 md:p-8 w-full max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => router.back()} 
          className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={20}/>
        </button>
        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900 dark:text-white flex items-center gap-3">
            <BrainCircuit className="text-cyan-500"/> Analytiques <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Recrutement IA</span>
          </h1>
          <p className="text-slate-400">Métriques de performance du système de sélection automatisé.</p>
        </div>
      </div>

      {/* KPIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }} 
          className="glass-panel rounded-2xl p-6 group cursor-default hover:border-cyan-500/30 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <Users size={20} className="text-cyan-400" />
            <TrendingUp size={16} className="text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-3xl font-bold mb-1 text-gray-900 dark:text-white">{stats.total}</p>
          <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Candidats Analysés IA</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }} 
          className="glass-panel rounded-2xl p-6 group cursor-default hover:border-emerald-500/30 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <Target size={20} className="text-emerald-400" />
            <Award size={16} className="text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-3xl font-bold mb-1 text-emerald-400">{retentionRate}%</p>
          <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Taux de Rétention IA</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.3 }} 
          className="glass-panel rounded-2xl p-6 group cursor-default hover:border-purple-500/30 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <BarChart3 size={20} className="text-purple-400" />
            <Sparkles size={16} className="text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-3xl font-bold mb-1 text-purple-400">{stats.avgScore}</p>
          <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Score Moyen /100</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.4 }} 
          className="glass-panel rounded-2xl p-6 group cursor-default hover:border-orange-500/30 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <GitCompare size={20} className="text-orange-400" />
            <Info size={16} className="text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-3xl font-bold mb-1 text-orange-400">{stats.overrideRate}%</p>
          <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Taux d'Override RH</p>
        </motion.div>
      </div>

      {/* GRAPHIQUES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* PIE CHART */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ delay: 0.5 }} 
          className="lg:col-span-1 glass-panel rounded-2xl p-6"
        >
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
            <PieChartIcon size={20} className="text-cyan-400" /> 
            Distribution des Suggestions
          </h3>
          
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={pieData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={60} 
                  outerRadius={80} 
                  paddingAngle={5} 
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} stroke="rgba(0,0,0,0)" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '12px' 
                  }} 
                  itemStyle={{ color: '#f8fafc' }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mt-6">
            {pieData.map((entry, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.fill }} 
                />
                <span className="text-[10px] text-slate-400 uppercase tracking-tighter">
                  {entry.name} ({entry.value})
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* TABLE */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ delay: 0.6 }} 
          className="lg:col-span-2 glass-panel rounded-2xl p-6 overflow-hidden"
        >
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
            <GitCompare size={20} className="text-cyan-400" /> 
            Suggestion IA vs Décision RH
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-gray-200 dark:border-white/5">
                <tr>
                  <th className="pb-4 pr-4">Candidat</th>
                  <th className="pb-4 pr-4">CV</th>
                  <th className="pb-4 pr-4">Test</th>
                  <th className="pb-4 pr-4">Total</th>
                  <th className="pb-4 pr-4">IA</th>
                  <th className="pb-4">RH</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                {candidates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      Aucune donnée disponible
                    </td>
                  </tr>
                ) : (
                  candidates.map((cand) => {
                    const isOverride = cand.hrDecision && cand.aiSuggestion !== cand.hrDecision;
                    return (
                      <tr 
                        key={cand.id} 
                        className={`group transition-colors ${isOverride ? 'bg-yellow-500/5' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
                      >
                        <td className={`py-4 pr-4 border-l-2 ${isOverride ? 'border-yellow-500/50 pl-3' : 'border-transparent pl-2'}`}>
                          <p className="font-bold text-gray-900 dark:text-slate-200">{cand.name}</p>
                          <p className="text-[10px] text-slate-500 truncate max-w-[150px]" title={cand.jobTitle}>{cand.jobTitle}</p>
                        </td>
                        <td className="py-4 pr-4">
                          <span className="text-xs font-mono text-slate-400">{cand.cvScore}/35</span>
                        </td>
                        <td className="py-4 pr-4">
                          <span className="text-xs font-mono text-slate-400">{cand.testScore}/65</span>
                        </td>
                        <td className="py-4 pr-4">
                          <span className="font-mono font-bold text-cyan-400">{cand.totalScore}/100</span>
                        </td>
                        <td className="py-4 pr-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            cand.aiSuggestion === 'RETENU' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' : 
                            cand.aiSuggestion === 'MOYENNE' ? 'text-orange-400 border-orange-500/20 bg-orange-500/10' :
                            cand.aiSuggestion === 'SECONDE_CHANCE' ? 'text-purple-400 border-purple-500/20 bg-purple-500/10' :
                            'text-red-400 border-red-500/20 bg-red-500/10'
                          }`}>
                            {cand.aiSuggestion?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            {cand.hrDecision ? (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                cand.hrDecision === 'RETENU' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' : 
                                cand.hrDecision === 'MOYENNE' ? 'text-orange-400 border-orange-500/20 bg-orange-500/10' :
                                cand.hrDecision === 'SECONDE_CHANCE' ? 'text-purple-400 border-purple-500/20 bg-purple-500/10' :
                                'text-red-400 border-red-500/20 bg-red-500/10'
                              }`}>
                                {cand.hrDecision?.replace('_', ' ')}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500 italic">En attente</span>
                            )}
                            {isOverride && (
                              <div title="Décision RH différente de l'IA">
                                <AlertTriangle size={14} className="text-yellow-500" />
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* INSIGHTS */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <CheckCircle2 size={20} className="text-emerald-400"/>
            </div>
            <h4 className="font-bold text-gray-900 dark:text-white">Profils Retenus</h4>
          </div>
          <p className="text-3xl font-bold text-emerald-400 mb-2">{stats.retenu}</p>
          <p className="text-xs text-slate-500">Candidats avec score ≥ 75/100</p>
        </div>

        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Clock size={20} className="text-purple-400"/>
            </div>
            <h4 className="font-bold text-gray-900 dark:text-white">Seconde Chance</h4>
          </div>
          <p className="text-3xl font-bold text-purple-400 mb-2">{stats.seconde}</p>
          <p className="text-xs text-slate-500">Profils à potentiel (40-54 pts)</p>
        </div>

        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <XCircle size={20} className="text-red-400"/>
            </div>
            <h4 className="font-bold text-gray-900 dark:text-white">Profils Refusés</h4>
          </div>
          <p className="text-3xl font-bold text-red-400 mb-2">{stats.refus}</p>
          <p className="text-xs text-slate-500">Candidats avec score {'<'} 40/100</p>
        </div>
      </div>

    </div>
  );
}











// 📍 OÙ EST LE DÉTAIL MANUEL ?
// Le détail candidat que je t'ai donné (candidate_detail_ai) gère DÉJÀ les deux modes :
// typescriptconst isAIMode = candidate.jobOffer.processingMode === 'AI_ASSISTED';

// // Si isAIMode = false, la section IA ne s'affiche pas
// {isAIMode && (
//   <div className="glass-panel">
//     {/* Section IA complète */}
//   </div>
// )}
// ```

// **Donc le même fichier** `app/(protected)/recrutement/candidats/[id]/page.tsx` affiche :
// - ✅ **Mode MANUEL** : Infos candidat + Lettre motivation + Changement statut
// - ✅ **Mode IA** : Tout ça + Scores + Décision RH

// ---

// ## 🔄 **WORKFLOW COMPLET : MANUEL vs IA**

// ---

// ### **🟦 MODE MANUEL (Classique)**
// ```
// ┌─────────────────────────────────────────────────────────────┐
// │ 1️⃣ RH CRÉE L'OFFRE                                         │
// │    ├─ Toggle sur "MANUEL"                                  │
// │    ├─ Remplit : Titre, Dept, Description                   │
// │    └─ Clique "Publier"                                     │
// │                                                              │
// │    Backend : processingMode = MANUAL                        │
// └─────────────────────────────────────────────────────────────┘
//                            ↓
// ┌─────────────────────────────────────────────────────────────┐
// │ 2️⃣ CANDIDAT POSTULE                                        │
// │    ├─ Visite : /jobs/[id] (page publique)                 │
// │    ├─ Remplit formulaire : Nom, Email, CV, Lettre         │
// │    └─ Clique "Envoyer candidature"                         │
// │                                                              │
// │    Backend : Candidate créé avec status = APPLIED          │
// └─────────────────────────────────────────────────────────────┘
//                            ↓
// ┌─────────────────────────────────────────────────────────────┐
// │ 3️⃣ RH CONSULTE LES CANDIDATURES                           │
// │    ├─ Va sur /recrutement/candidats/kanban                 │
// │    ├─ Voit les candidats dans colonne "Nouvelles"          │
// │    └─ Clique sur un candidat                               │
// └─────────────────────────────────────────────────────────────┘
//                            ↓
// ┌─────────────────────────────────────────────────────────────┐
// │ 4️⃣ RH ÉVALUE MANUELLEMENT                                 │
// │    ├─ Page : /recrutement/candidats/[id]                  │
// │    ├─ Lit CV (télécharge PDF)                              │
// │    ├─ Lit lettre de motivation                             │
// │    └─ Change statut manuellement :                         │
// │        APPLIED → SCREENING → INTERVIEW → OFFER → HIRED     │
// │                                                              │
// │    🔄 Le RH décide tout seul (pas d'IA)                    │
// └─────────────────────────────────────────────────────────────┘
//                            ↓
// ┌─────────────────────────────────────────────────────────────┐
// │ 5️⃣ ENTRETIEN & RECRUTEMENT                                │
// │    ├─ Si status = INTERVIEW : RH organise entretien       │
// │    ├─ Si status = HIRED : RH clique "Créer Employé"       │
// │    └─ Le candidat devient un Employee dans le SIRH        │
// └─────────────────────────────────────────────────────────────┘
// ```

// ---

// ### **🟪 MODE IA (Assisté)**
// ```
// ┌─────────────────────────────────────────────────────────────┐
// │ 1️⃣ RH CRÉE L'OFFRE EN MODE IA                             │
// │    ├─ Toggle sur "IA ASSISTÉE" ✨                          │
// │    ├─ Remplit : Titre, Dept, Description                   │
// │    ├─ Ajoute : Skills (badges), Expérience, Formation     │
// │    └─ Crée 10 questions QCM (drag & drop)                 │
// │                                                              │
// │    Backend :                                                │
// │    ├─ processingMode = AI_ASSISTED                         │
// │    ├─ requiredSkills = ["React", "Node"]                   │
// │    └─ JobOfferTestQuestion × 10                            │
// └─────────────────────────────────────────────────────────────┘
//                            ↓
// ┌─────────────────────────────────────────────────────────────┐
// │ 2️⃣ CANDIDAT POSTULE                                        │
// │    ├─ Visite : /jobs/[id]                                  │
// │    ├─ Remplit formulaire + Upload CV                       │
// │    └─ Clique "Envoyer candidature"                         │
// │                                                              │
// │    Backend : Candidate créé avec status = APPLIED          │
// └─────────────────────────────────────────────────────────────┘
//                            ↓
// ┌─────────────────────────────────────────────────────────────┐
// │ 3️⃣ CANDIDAT PASSE LE TEST TECHNIQUE                       │
// │    ├─ Reçoit email : "Passez le test d'évaluation"        │
// │    ├─ Va sur : /jobs/[id]/test/[candidateId]              │
// │    ├─ Écran d'accueil : Règles + Timer                     │
// │    ├─ Clique "Commencer"                                   │
// │    │                                                         │
// │    │   🔒 ANTI-TRICHE ACTIVÉE :                            │
// │    │   ├─ Détection changement onglet                      │
// │    │   ├─ Copier-coller désactivé                          │
// │    │   └─ Timer 30 min                                     │
// │    │                                                         │
// │    ├─ Répond aux 10 questions QCM                          │
// │    └─ Clique "Terminer"                                    │
// │                                                              │
// │    Backend :                                                │
// │    ├─ CandidateTestAnswer créé pour chaque question       │
// │    ├─ testCompletedAt enregistré                           │
// │    └─ tabSwitchCount enregistré (ex: 2)                   │
// └─────────────────────────────────────────────────────────────┘
//                            ↓
// ┌─────────────────────────────────────────────────────────────┐
// │ 4️⃣ IA ANALYSE AUTOMATIQUEMENT (Optionnel automatique)     │
// │    ├─ Trigger : Dès que test complété                     │
// │    │   OU                                                   │
// │    │   RH clique "Analyser CV" manuellement                │
// │    │                                                         │
// │    │   PHASE 1 : Analyse CV avec Gemini                    │
// │    │   ├─ API : POST /candidates/{id}/analyze-cv          │
// │    │   ├─ Gemini parse le CV                               │
// │    │   └─ Stocke : cvScore (0-40)                          │
// │    │                                                         │
// │    │   PHASE 2 : Correction Test (Auto)                    │
// │    │   ├─ API : POST /candidates/{id}/grade-test          │
// │    │   ├─ Compare réponses vs correctAnswers               │
// │    │   └─ Stocke : testScore (0-60)                        │
// │    │                                                         │
// │    │   PHASE 3 : Score Final + Suggestion                  │
// │    │   ├─ API : POST /candidates/{id}/calculate-score     │
// │    │   ├─ totalScore = cvScore + testScore                 │
// │    │   ├─ Détermine aiSuggestion :                         │
// │    │   │   ├─ ≥75 → RETENU                                 │
// │    │   │   ├─ 55-74 → MOYENNE                              │
// │    │   │   ├─ 40-54 → SECONDE_CHANCE                       │
// │    │   │   └─ <40 → REFUS                                  │
// │    │   └─ Gemini génère aiReasoning (justification)       │
// │    │                                                         │
// │    └─ Backend stocke :                                      │
// │        ├─ cvScore, testScore, totalScore                   │
// │        ├─ aiSuggestion, aiReasoning                         │
// │        └─ cvAnalysis (forces/faiblesses)                   │
// └─────────────────────────────────────────────────────────────┘
//                            ↓
// ┌─────────────────────────────────────────────────────────────┐
// │ 5️⃣ RH CONSULTE & DÉCIDE                                   │
// │    ├─ Va sur /recrutement/candidats/[id]                  │
// │    ├─ Voit :                                               │
// │    │   ┌───────────────────────────────────────┐          │
// │    │   │ 🤖 ANALYSE IA                         │          │
// │    │   │                                        │          │
// │    │   │ CV : 32/40  🟢                        │          │
// │    │   │ Test : 48/60  🟢                      │          │
// │    │   │ TOTAL : 80/100                        │          │
// │    │   │                                        │          │
// │    │   │ 💡 Suggestion IA : RETENU             │          │
// │    │   │ "Profil solide, compétences..."      │          │
// │    │   │                                        │          │
// │    │   │ 👤 VOTRE DÉCISION :                   │          │
// │    │   │ [x] Accepter (RETENU)                │          │
// │    │   │ [ ] Reclasser en MOYENNE              │          │
// │    │   │ [ ] Donner SECONDE CHANCE             │          │
// │    │   │ [ ] REFUSER quand même                │          │
// │    │   │                                        │          │
// │    │   │ 💬 Note : "Bon candidat mais..."     │          │
// │    │   │                                        │          │
// │    │   │ [Valider décision]                    │          │
// │    │   └───────────────────────────────────────┘          │
// │    │                                                         │
// │    ├─ RH peut OVERRIDE la suggestion IA :                  │
// │    │   Ex: IA dit MOYENNE → RH met RETENU                  │
// │    │                                                         │
// │    └─ Clique "Valider décision"                            │
// │                                                              │
// │    Backend :                                                │
// │    ├─ API : PATCH /candidates/{id}/hr-decision             │
// │    └─ Stocke : hrDecision, hrNotes, hrDecidedBy           │
// └─────────────────────────────────────────────────────────────┘
//                            ↓
// ┌─────────────────────────────────────────────────────────────┐
// │ 6️⃣ SUITE DU PROCESSUS                                     │
// │    ├─ Si hrDecision = RETENU :                             │
// │    │   ├─ RH change status → INTERVIEW                     │
// │    │   ├─ Organise entretien physique/visio                │
// │    │   └─ Email auto : "Félicitations, entretien le..."   │
// │    │                                                         │
// │    ├─ Si hrDecision = MOYENNE :                            │
// │    │   ├─ RH garde en observation                          │
// │    │   └─ Email auto : "En cours d'examen..."             │
// │    │                                                         │
// │    ├─ Si hrDecision = SECONDE_CHANCE :                     │
// │    │   └─ Email auto : "Informations complémentaires"      │
// │    │                                                         │
// │    └─ Si hrDecision = REFUS :                              │
// │        ├─ RH change status → REJECTED                      │
// │        └─ Email auto : "Merci pour votre candidature..."   │
// └─────────────────────────────────────────────────────────────┘
//                            ↓
// ┌─────────────────────────────────────────────────────────────┐
// │ 7️⃣ EMBAUCHE FINALE                                        │
// │    ├─ Si status = HIRED :                                  │
// │    │   ├─ RH clique "Créer Employé"                        │
// │    │   ├─ API : POST /candidates/{id}/hire                │
// │    │   └─ Création automatique dans SIRH :                 │
// │    │       ├─ Employee créé                                 │
// │    │       ├─ Données pré-remplies (nom, email, dept)     │
// │    │       └─ Redirection vers /employes/{id}/edit         │
// │    │                                                         │
// │    └─ RH complète le dossier employé (salaire, contrat...) │
// └─────────────────────────────────────────────────────────────┘

// 🔑 DIFFÉRENCES CLÉS
// AspectMode MANUELMode IACréation offreRapide (titre + desc)Plus long (skills + quiz)CandidatureCV + Lettre uniquementCV + Lettre + TESTÉvaluationRH lit CV manuellementIA analyse + Test auto-corrigéDécision100% humaineIA suggère, RH valideTempsLent (RH lit tous les CVs)Rapide (IA pré-filtre)QualitéSubjectiveObjective + Humain finalTarifGratuit/StarterEntreprise (45K FCFA/mois)

// 📊 STATISTIQUES IA (Dashboard)
// Le dashboard /recrutement/stats-ia montre :

// Combien de candidats analysés
// Taux de rétention (% RETENU)
// Score moyen (ex: 62/100)
// Taux d'override RH (quand RH contredit l'IA)


// ✅ RÉSUMÉ
// Mode Manuel = Processus classique (RH fait tout)
// Mode IA = IA pré-filtre → RH valide → Gain de temps énorme
// Le même fichier détail candidat gère les 2 modes en affichant la section IA conditionnellement.
// Des questions ? 🚀