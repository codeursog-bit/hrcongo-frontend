'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, User, Briefcase,
  CheckCircle2, XCircle, Eye, Calendar,
  type LucideIcon,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { api } from '@/services/api';
import { ToastProvider, useToast } from '@/components/ui/useToast';
import { JobFilterSelect } from '@/components/JobFilterSelect';
import { KonzaLoader } from '@/components/ui/KonzaLoader';
import { Badge, Card, EmptyState } from '@/components/design-system/primitives';
import { RecruitmentListPage as ListPage } from '@/components/recruitment/RecruitmentFrame';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

type ManualColumnId = 'APPLIED' | 'INTERVIEW' | 'HIRED' | 'REJECTED';

interface JobOffer {
  id: string;
  title: string;
  processingMode: string;
}

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  jobOffer?: {
    id: string;
    title: string;
    processingMode: string;
  };
  createdAt: string;
}

// ─────────────────────────────────────────────
// CONFIG COLONNES (4 colonnes simplifiées)
// ─────────────────────────────────────────────

const MANUAL_COLUMNS: {
  id: ManualColumnId;
  title: string;
  accent: string;
  tone: 'success' | 'warning' | 'neutral' | 'info';
  icon: LucideIcon;
  emptyMsg: string;
}[] = [
  {
    id: 'APPLIED',
    title: 'Nouvelles candidatures',
    accent: 'text-[var(--brand-strong)]',
    tone: 'info',
    icon: User,
    emptyMsg: 'Aucune nouvelle candidature',
  },
  {
    id: 'INTERVIEW',
    title: 'En entretien',
    accent: 'text-[var(--mustard)]',
    tone: 'warning',
    icon: Briefcase,
    emptyMsg: 'Aucun entretien planifié',
  },
  {
    id: 'HIRED',
    title: 'Embauchés',
    accent: 'text-[var(--green)]',
    tone: 'success',
    icon: CheckCircle2,
    emptyMsg: 'Aucune embauche',
  },
  {
    id: 'REJECTED',
    title: 'Refusés',
    accent: 'text-[var(--text-muted)]',
    tone: 'neutral',
    icon: XCircle,
    emptyMsg: 'Aucun refus',
  },
];

// Normalise les anciens statuts vers les 4 colonnes simplifiées
const normalizeStatus = (status: string): ManualColumnId => {
  if (status === 'HIRED') return 'HIRED';
  if (status === 'REJECTED' || status === 'REFUSE') return 'REJECTED';
  if (status === 'INTERVIEW') return 'INTERVIEW';
  return 'APPLIED'; // APPLIED, SCREENING, OFFER, EN_ATTENTE_ANALYSE, etc.
};

// ─────────────────────────────────────────────
// INNER COMPONENT
// ─────────────────────────────────────────────

function KanbanManualContent() {
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
      setCandidates(candidatesData.filter((c) => c.jobOffer?.processingMode === 'MANUAL'));
      setJobs(jobsData.filter((j) => j.processingMode === 'MANUAL'));
    } catch {
      toast.error('Erreur de chargement', 'Impossible de récupérer les candidats.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtre correct sur jobOffer.id
  const filteredCandidates = selectedJobId
    ? candidates.filter((c) => c.jobOffer?.id === selectedJobId)
    : candidates;

  const getColumnData = (colId: ManualColumnId) =>
    filteredCandidates.filter((c) => normalizeStatus(c.status) === colId);

  // Options pour JobFilterSelect
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
        title="Pipeline Manuel"
        description="Suivez les candidatures à chaque étape du recrutement."
        action={headerAction}
        filters={jobFilter}
      >
        <KonzaLoader variant="page" label="Chargement du pipeline…" />
      </ListPage>
    );
  }

  if (candidates.length === 0) {
    return (
      <ListPage
        title="Pipeline Manuel"
        description="Suivez les candidatures à chaque étape du recrutement."
        action={headerAction}
        filters={jobFilter}
      >
        <Card>
          <EmptyState
            title="Aucune candidature manuelle"
            icon={User}
            action={<Link className="k-button k-button-secondary" href="/recrutement">Retour au recrutement</Link>}
          >
            Publiez une offre en mode manuel pour recevoir des candidatures ici.
          </EmptyState>
        </Card>
      </ListPage>
    );
  }

  return (
    <ListPage
      title="Pipeline Manuel"
      description={selectedJobId
        ? `${filteredCandidates.length} candidat(s) sur cette offre`
        : `${filteredCandidates.length} candidat(s) — toutes les offres`}
      action={headerAction}
      filters={jobFilter}
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-4">
        {MANUAL_COLUMNS.map((col, colIdx) => {
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
                      <h2 id={`pipeline-${col.id}`} className="text-base font-semibold leading-snug text-[var(--text)]">{col.title}</h2>
                    </div>
                  </div>
                  <Badge tone={col.tone}>{colData.length}</Badge>
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
                    colData.map((c) => (
                      <motion.article
                        key={c.id}
                        layout={!prefersReducedMotion}
                        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={prefersReducedMotion ? undefined : { opacity: 0, y: -4 }}
                        transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
                      >
                        <Link
                          href={`/recrutement/manuel/candidats/${c.id}`}
                          aria-label={`Voir le dossier de ${c.firstName} ${c.lastName}`}
                          className="group block rounded-[var(--radius-card)] bg-[var(--surface)] p-4 text-left shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-pop)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand)] focus-visible:outline-offset-2"
                        >
                          <div className="mb-3 flex min-w-0 items-center gap-3">
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--brand-soft)] text-xs font-semibold text-[var(--text)]" aria-hidden="true">
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
                          <div className="flex items-center justify-between gap-2 border-t border-[var(--border)] pt-3 text-xs text-[var(--text-muted)]">
                            <span>{new Date(c.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                            <span className={col.accent}>{col.title}</span>
                          </div>
                        </Link>
                      </motion.article>
                    ))
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

export default function KanbanManualPage() {
  return (
    <ToastProvider>
      <KanbanManualContent />
    </ToastProvider>
  );
}