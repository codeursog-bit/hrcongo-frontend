'use client';

import React, { useState, useEffect } from 'react';
import {
  BrainCircuit, Award, TrendingUp, Clock, XCircle, Zap,
  ArrowLeft, AlertTriangle, Eye, Target, BarChart3, Calendar,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { api } from '@/services/api';
import Link from 'next/link';
import { ToastProvider, useToast } from '@/components/ui/useToast';
import { JobFilterSelect } from '@/components/JobFilterSelect';
import { KonzaLoader } from '@/components/ui/KonzaLoader';
import { Badge, Card, EmptyState } from '@/components/design-system/primitives';
import { RecruitmentListPage as ListPage } from '@/components/recruitment/RecruitmentFrame';

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
    accent: 'text-[var(--green)]',
    icon: Award,
    description: '≥ 75/100',
    emptyMsg: 'Aucun candidat retenu',
  },
  {
    id: 'MOYENNE' as AIColumnId,
    title: 'Profils Moyens',
    accent: 'text-[var(--mustard)]',
    icon: TrendingUp,
    description: '55–74/100',
    emptyMsg: 'Aucun profil moyen',
  },
  {
    id: 'SECONDE_CHANCE' as AIColumnId,
    title: 'Seconde Chance',
    accent: 'text-[var(--text-muted)]',
    icon: Clock,
    description: '40–54/100',
    emptyMsg: 'Aucun profil seconde chance',
  },
  {
    id: 'REFUS' as AIColumnId,
    title: 'Non Retenus',
    accent: 'text-[var(--danger)]',
    icon: XCircle,
    description: '< 40/100',
    emptyMsg: 'Aucun candidat refusé',
  },
];

// ─────────────────────────────────────────────
// INNER COMPONENT
// ─────────────────────────────────────────────

function KanbanIAContent() {
  const toast = useToast();
  const prefersReducedMotion = useReducedMotion();
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

  const headerAction = (
    <div className="flex flex-wrap items-center gap-3">
      <Link className="k-button k-button-secondary" href="/recrutement">
        <ArrowLeft size={16} strokeWidth={1.5} aria-hidden="true" /> Retour
      </Link>
      <Link className="k-button k-button-secondary" href="/recrutement/entretiens">
        <Calendar size={16} strokeWidth={1.5} aria-hidden="true" /> Entretiens
      </Link>
      <Link className="k-button k-button-primary" href="/recrutement/ia/analytics">
        <BarChart3 size={16} strokeWidth={1.5} aria-hidden="true" /> Statistiques
      </Link>
    </div>
  );
  const jobFilter = (
    <JobFilterSelect
      jobs={jobOptions}
      value={selectedJobId}
      onChange={setSelectedJobId}
      totalCount={candidates.length}
    />
  );

  if (isLoading) {
    return (
      <ListPage
        title="Pipeline Recrutement IA"
        description="Suivez les candidatures selon leur score d’analyse."
        action={headerAction}
        filters={jobFilter}
      >
        <KonzaLoader variant="page" label="Chargement du pipeline IA…" />
      </ListPage>
    );
  }

  if (candidates.length === 0) {
    return (
      <ListPage
        title="Pipeline Recrutement IA"
        description="Suivez les candidatures selon leur score d’analyse."
        action={headerAction}
        filters={jobFilter}
      >
        <Card>
          <EmptyState
            title="Aucun candidat IA"
            icon={BrainCircuit}
            action={<Link className="k-button k-button-secondary" href="/recrutement">Retour au recrutement</Link>}
          >
            Publiez des offres en mode IA assistée pour voir les candidatures ici.
          </EmptyState>
        </Card>
      </ListPage>
    );
  }

  return (
    <ListPage
      title="Pipeline Recrutement IA"
      description={selectedJobId
        ? `${filteredCandidates.length} candidat(s) sur cette offre`
        : `${filteredCandidates.length} candidat(s) — toutes les offres`}
      action={headerAction}
      filters={jobFilter}
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-4">
        {AI_COLUMNS.map((col, colIdx) => {
          const colData = getColumnData(col.id);
          const Icon = col.icon;
          return (
            <motion.section
              key={col.id}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: prefersReducedMotion ? 0 : colIdx * 0.05, duration: prefersReducedMotion ? 0 : 0.2 }}
              aria-labelledby={`pipeline-${col.id}`}
              className="flex min-w-0 flex-col gap-3"
            >
              <Card className="!p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Icon size={17} strokeWidth={1.5} className={col.accent} aria-hidden="true" />
                      <h2 id={`pipeline-${col.id}`} className="text-base font-semibold text-[var(--text)]">{col.title}</h2>
                    </div>
                    <p className={`mt-1 text-xs ${col.accent}`}>{col.description}</p>
                  </div>
                  <Badge tone={col.id === 'RETENU' ? 'success' : col.id === 'MOYENNE' ? 'warning' : col.id === 'REFUS' ? 'danger' : 'neutral'}>
                    {colData.length}
                  </Badge>
                </div>
              </Card>
              <div className="flex min-h-40 flex-col gap-3">
                <AnimatePresence mode="popLayout">
                  {colData.length === 0 ? (
                    <Card key="empty" className="flex min-h-40 items-center justify-center !p-4">
                      <EmptyState title={col.emptyMsg} icon={Icon}>
                        {selectedJobId ? 'Aucune candidature dans cette étape pour cette offre.' : 'Les candidatures apparaîtront ici lorsqu’elles seront reçues.'}
                      </EmptyState>
                    </Card>
                  ) : (
                    colData.map((c) => {
                      const hasOverride = c.hrDecision && c.hrDecision !== c.aiSuggestion;
                      return (
                        <motion.article
                          key={c.id}
                          layout={!prefersReducedMotion}
                          initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={prefersReducedMotion ? undefined : { opacity: 0, y: -4 }}
                          transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
                        >
                          <Link
                            href={`/recrutement/ia/candidats/${c.id}`}
                            aria-label={`Voir le dossier de ${c.firstName} ${c.lastName}`}
                            className="group block rounded-[var(--radius-card)] bg-[var(--surface)] p-4 text-left shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-pop)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand)] focus-visible:outline-offset-2"
                          >
                            <div className="mb-4 flex min-w-0 items-center gap-3">
                              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--brand-soft)] text-sm font-semibold text-[var(--text)]" aria-hidden="true">
                                {c.firstName?.[0] || ''}{c.lastName?.[0] || ''}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-semibold text-[var(--text)] group-hover:text-[var(--brand-strong)]">
                                  {c.firstName} {c.lastName}
                                </span>
                                <span className="block truncate text-xs text-[var(--text-muted)]">{c.jobOffer?.title}</span>
                              </span>
                              <Eye size={15} strokeWidth={1.5} className="shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
                            </div>
                            <div className="mb-4 grid grid-cols-3 gap-2">
                              <div className="rounded-xl bg-[var(--surface-2)] p-2 text-center">
                                <span className="block text-[10px] text-[var(--text-muted)]">CV</span>
                                <span className="text-xs font-semibold tabular-nums text-[var(--text)]">{c.cvScore || 0}<span className="text-[var(--text-muted)]">/35</span></span>
                              </div>
                              <div className="rounded-xl bg-[var(--surface-2)] p-2 text-center">
                                <span className="block text-[10px] text-[var(--text-muted)]">Test</span>
                                <span className="text-xs font-semibold tabular-nums text-[var(--text)]">{c.testScore || 0}<span className="text-[var(--text-muted)]">/65</span></span>
                              </div>
                              <div className="rounded-xl bg-[color-mix(in_srgb,var(--green)_12%,transparent)] p-2 text-center">
                                <span className="block text-[10px] text-[var(--green)]">Total</span>
                                <span className="text-xs font-semibold tabular-nums text-[var(--green)]">{c.totalScore || 0}<span>/100</span></span>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--text-muted)]">
                              <span className="flex flex-wrap items-center gap-3">
                                {hasOverride && <span className="flex items-center gap-1 text-[var(--mustard)]"><AlertTriangle size={12} aria-hidden="true" /> Décision RH</span>}
                                {(c.tabSwitchCount ?? 0) > 0 && <span className="flex items-center gap-1 text-[var(--mustard)]"><Target size={12} aria-hidden="true" /> {c.tabSwitchCount} switch</span>}
                              </span>
                              <span className="inline-flex items-center gap-1.5">
                                <Zap size={12} strokeWidth={1.5} aria-hidden="true" />
                                {new Date(c.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                              </span>
                            </div>
                          </Link>
                        </motion.article>
                      );
                    })
                  )}
                </AnimatePresence>
              </div>
            </motion.section>
          );
        })}
      </div>
    </ListPage>
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