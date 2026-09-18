'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BrainCircuit, Award, TrendingUp, Clock, XCircle, Zap,
  ArrowLeft, Loader2, AlertTriangle, Eye, Target, BarChart3, Calendar,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';
import Link from 'next/link';
import { ToastProvider, useToast } from '@/components/ui/useToast';
import { JobFilterSelect } from '@/components/JobFilterSelect';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

type AIColumnId = 'RETENU' | 'MOYENNE' | 'SECONDE_CHANCE' | 'REFUS';

interface JobOffer {
  id: string;
  title: string;
  processingMode: string;
  _count?: { candidates: number };
}

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  aiSuggestion: AIColumnId;
  hrDecision?: AIColumnId;
  totalScore: number;
  cvScore: number;
  testScore: number;
  tabSwitchCount?: number;
  jobOffer: {
    id: string;
    title: string;
    processingMode: string;
  };
  createdAt: string;
}

// ─────────────────────────────────────────────
// CONFIG COLONNES
// ─────────────────────────────────────────────

const AI_COLUMNS = [
  {
    id: 'RETENU' as AIColumnId,
    title: 'Retenus',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/40',
    accent: 'text-emerald-500',
    icon: Award,
    description: '≥ 75/100',
    emptyMsg: 'Aucun candidat retenu',
  },
  {
    id: 'MOYENNE' as AIColumnId,
    title: 'Profils Moyens',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/40',
    accent: 'text-amber-500',
    icon: TrendingUp,
    description: '55–74/100',
    emptyMsg: 'Aucun profil moyen',
  },
  {
    id: 'SECONDE_CHANCE' as AIColumnId,
    title: 'Seconde Chance',
    bg: 'bg-[var(--surface-2)]',
    border: 'border-[var(--border)]',
    accent: 'text-[var(--text-muted)]',
    icon: Clock,
    description: '40–54/100',
    emptyMsg: 'Aucun profil seconde chance',
  },
  {
    id: 'REFUS' as AIColumnId,
    title: 'Non Retenus',
    bg: 'bg-red-500/10',
    border: 'border-red-500/40',
    accent: 'text-red-500',
    icon: XCircle,
    description: '< 40/100',
    emptyMsg: 'Aucun candidat refusé',
  },
];

// ─────────────────────────────────────────────
// INNER COMPONENT
// ─────────────────────────────────────────────

function KanbanIAContent() {
  const router = useRouter();
  const toast = useToast();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<JobOffer[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [candidatesData, jobsData] = await Promise.all([
        api.get<Candidate[]>('/recruitment/candidates'),
        api.get<JobOffer[]>('/recruitment/jobs'),
      ]);
      setCandidates(
        candidatesData.filter((c) => c.jobOffer?.processingMode === 'AI_ASSISTED' && c.aiSuggestion)
      );
      setJobs(jobsData.filter((j) => j.processingMode === 'AI_ASSISTED'));
    } catch {
      toast.error('Erreur de chargement', 'Impossible de récupérer les candidats.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCandidates = selectedJobId
    ? candidates.filter((c) => c.jobOffer?.id === selectedJobId)
    : candidates;

  const getColumnData = (colId: AIColumnId) =>
    filteredCandidates.filter((c) => c.aiSuggestion === colId);

  const jobOptions = jobs.map((j) => ({
    id: j.id,
    title: j.title,
    count: candidates.filter((c) => c.jobOffer?.id === j.id).length,
  }));

  // ── LOADING ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-emerald-500 blur-2xl opacity-20 animate-pulse rounded-full" />
            <Loader2 className="animate-spin text-emerald-500 relative z-10" size={48} />
          </div>
          <p className="text-[var(--text-muted)] mt-6 font-medium">Chargement du pipeline IA...</p>
        </div>
      </div>
    );
  }

  // ── EMPTY GLOBAL ──
  if (candidates.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
            <BrainCircuit size={40} className="text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text)] mb-3">Aucun candidat IA</h1>
          <p className="text-[var(--text-muted)] mb-8">
            Publiez des offres en mode{' '}
            <span className="text-emerald-500 font-bold">IA Assistée</span> pour voir les candidats ici.
          </p>
          <Link
            href="/recrutement"
            className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold inline-flex items-center gap-2"
          >
            <ArrowLeft size={18} /> Retour au recrutement
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">

      {/* BG GLOW */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 p-6 md:p-8">
        {/* HEADER */}
        <div className="max-w-[1800px] mx-auto mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/recrutement')}
                className="p-3 bg-[var(--surface)] hover:bg-[var(--surface-2)] rounded-xl border border-[var(--border)] transition-all"
              >
                <ArrowLeft size={20} className="text-[var(--text)]" />
              </button>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-black text-[var(--text)]">Pipeline Recrutement IA</h1>
                  <div className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-1.5">
                    <BrainCircuit size={14} className="text-emerald-500" />
                    <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">IA</span>
                  </div>
                </div>
                <p className="text-[var(--text-muted)] text-sm">
                  {selectedJobId
                    ? `${filteredCandidates.length} candidat(s) sur cette offre`
                    : `${filteredCandidates.length} candidat(s) — toutes les offres`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <JobFilterSelect
                jobs={jobOptions}
                value={selectedJobId}
                onChange={setSelectedJobId}
                totalCount={candidates.length}
              />
              <Link
                href="/recrutement/entretiens"
                className="px-4 py-2.5 bg-[var(--surface-2)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--text)] rounded-xl font-bold text-sm flex items-center gap-2 transition-all"
              >
                <Calendar size={15} /> Entretiens
              </Link>
              <Link
                href="/recrutement/ia/analytics"
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg"
              >
                <BarChart3 size={15} /> Statistiques
              </Link>
            </div>
          </div>
        </div>

        {/* KANBAN */}
        <div className="max-w-[1800px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {AI_COLUMNS.map((col, colIdx) => {
              const colData = getColumnData(col.id);
              const Icon = col.icon;
              return (
                <motion.div
                  key={col.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: colIdx * 0.08 }}
                  className="flex flex-col h-[calc(100vh-220px)] min-h-[400px]"
                >
                  {/* En-tête */}
                  <div className={`${col.bg} backdrop-blur-xl border-2 ${col.border} rounded-2xl p-4 mb-3 shadow-xl`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-[var(--surface)] rounded-lg">
                          <Icon size={18} className={col.accent} />
                        </div>
                        <h3 className="font-black text-[var(--text)] text-base">{col.title}</h3>
                      </div>
                      <div className="px-2.5 py-0.5 bg-[var(--surface)] rounded-full border border-[var(--border)]">
                        <span className="text-sm font-bold text-[var(--text)]">{colData.length}</span>
                      </div>
                    </div>
                    <p className={`text-[11px] ${col.accent} font-bold uppercase tracking-wider opacity-80`}>{col.description}</p>
                  </div>

                  {/* Cartes */}
                  <div className="flex-1 bg-[var(--surface)] backdrop-blur-sm rounded-2xl p-2.5 overflow-y-auto border border-[var(--border)] space-y-2.5">
                    <AnimatePresence mode="popLayout">
                      {colData.length === 0 ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="h-full flex flex-col items-center justify-center py-10 text-center"
                        >
                          <div className="w-12 h-12 rounded-xl bg-[var(--surface-2)] flex items-center justify-center mb-3">
                            <Icon size={20} className="text-[var(--text-muted)]" />
                          </div>
                          <p className="text-[var(--text-muted)] text-sm">{col.emptyMsg}</p>
                          {selectedJobId && (
                            <p className="text-[var(--text-muted)] text-xs mt-1 opacity-70">pour cette offre</p>
                          )}
                        </motion.div>
                      ) : (
                        colData.map((c) => {
                          const hasOverride = c.hrDecision && c.hrDecision !== c.aiSuggestion;
                          return (
                            <motion.div
                              key={c.id}
                              layout
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              onClick={() => router.push(`/recrutement/ia/candidats/${c.id}`)}
                              className={`bg-[var(--surface-2)] backdrop-blur-xl border rounded-xl p-4 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-xl group ${
                                hasOverride ? 'border-amber-500/50' : 'border-[var(--border)] hover:border-emerald-500/40'
                              }`}
                            >
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-white text-sm shadow-lg shrink-0">
                                  {c.firstName[0]}{c.lastName[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-[var(--text)] text-sm truncate group-hover:text-emerald-500 transition-colors">
                                    {c.firstName} {c.lastName}
                                  </h4>
                                  <p className="text-[11px] text-[var(--text-muted)] truncate">{c.jobOffer?.title}</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-1.5 mb-3">
                                <div className="bg-[var(--surface)] p-1.5 rounded-lg text-center border border-[var(--border)]">
                                  <p className="text-[9px] text-[var(--text-muted)] uppercase font-bold">CV</p>
                                  <p className="text-xs font-bold text-[var(--text)]">{c.cvScore || 0}<span className="text-[var(--text-muted)]">/35</span></p>
                                </div>
                                <div className="bg-[var(--surface)] p-1.5 rounded-lg text-center border border-[var(--border)]">
                                  <p className="text-[9px] text-[var(--text-muted)] uppercase font-bold">Test</p>
                                  <p className="text-xs font-bold text-[var(--text)]">{c.testScore || 0}<span className="text-[var(--text-muted)]">/65</span></p>
                                </div>
                                <div className="bg-emerald-500/10 p-1.5 rounded-lg text-center border border-emerald-500/20">
                                  <p className="text-[9px] text-emerald-500 uppercase font-bold">Total</p>
                                  <p className="text-xs font-bold text-emerald-500">{c.totalScore || 0}<span className="text-emerald-700 dark:text-emerald-300">/100</span></p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between text-[11px]">
                                <div className="flex items-center gap-2">
                                  {hasOverride && (
                                    <span className="flex items-center gap-1 text-amber-500 font-bold">
                                      <AlertTriangle size={11} /> Décision RH
                                    </span>
                                  )}
                                  {(c.tabSwitchCount ?? 0) > 0 && (
                                    <span className="flex items-center gap-1 text-amber-500 font-bold">
                                      <Target size={11} /> {c.tabSwitchCount} switch
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                                  <Zap size={10} className="text-emerald-600" />
                                  <span>{new Date(c.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                                  <Eye size={12} className="ml-1 group-hover:text-emerald-500 transition-colors" />
                                </div>
                              </div>
                            </motion.div>
                          );
                        })
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// EXPORT — ToastProvider local à cette page
// ─────────────────────────────────────────────

export default function KanbanIAPage() {
  return (
    <ToastProvider>
      <KanbanIAContent />
    </ToastProvider>
  );
}