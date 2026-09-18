'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Loader2, User, Briefcase,
  CheckCircle2, XCircle, Eye, Calendar,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';
import { ToastProvider, useToast } from '@/components/ui/useToast';
import { JobFilterSelect } from '@/components/JobFilterSelect';

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
  borderTop: string;
  headerBg: string;
  countBg: string;
  icon: React.ElementType;
  emptyMsg: string;
}[] = [
  {
    id: 'APPLIED',
    title: 'Nouvelles candidatures',
    borderTop: 'border-t-emerald-500',
    headerBg: 'bg-emerald-50 dark:bg-emerald-500/5',
    countBg: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    icon: User,
    emptyMsg: 'Aucune nouvelle candidature',
  },
  {
    id: 'INTERVIEW',
    title: 'En entretien',
    borderTop: 'border-t-amber-500',
    headerBg: 'bg-amber-50 dark:bg-amber-500/5',
    countBg: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400',
    icon: Briefcase,
    emptyMsg: 'Aucun entretien planifié',
  },
  {
    id: 'HIRED',
    title: 'Embauchés',
    borderTop: 'border-t-emerald-500',
    headerBg: 'bg-emerald-50 dark:bg-emerald-500/5',
    countBg: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    icon: CheckCircle2,
    emptyMsg: 'Aucune embauche',
  },
  {
    id: 'REJECTED',
    title: 'Refusés',
    borderTop: 'border-t-red-500',
    headerBg: 'bg-red-50 dark:bg-red-500/5',
    countBg: 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400',
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

  // ── LOADING ──
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="animate-spin text-emerald-500 mx-auto" size={40} />
          <p className="text-[var(--text-muted)] mt-3 text-sm">Chargement du pipeline...</p>
        </div>
      </div>
    );
  }

  // ── EMPTY GLOBAL ──
  if (candidates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 border border-emerald-500/20">
          <User size={32} className="text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold text-[var(--text)] mb-2">Aucune candidature manuelle</h2>
        <p className="text-[var(--text-muted)] mb-6 text-sm">Publiez des offres en mode Manuel pour recevoir des candidatures ici.</p>
        <Link
          href="/recrutement"
          className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold flex items-center gap-2 text-sm"
        >
          <ArrowLeft size={16} /> Retour
        </Link>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 px-1">
        <div className="flex items-center gap-3">
          <Link
            href="/recrutement"
            className="p-2 bg-[var(--surface)] rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[var(--text)]">Pipeline Manuel</h1>
            <p className="text-xs text-[var(--text-muted)]">
              {selectedJobId
                ? `${filteredCandidates.length} candidat(s) sur cette offre`
                : `${filteredCandidates.length} candidat(s) — toutes les offres`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Sélecteur moderne */}
          <JobFilterSelect
            jobs={jobOptions}
            value={selectedJobId}
            onChange={setSelectedJobId}
            totalCount={candidates.length}
            
          />

          <Link
            href="/recrutement/entretiens"
            className="px-3 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
          >
            <Calendar size={14} /> Entretiens
          </Link>
        </div>
      </div>

      {/* BOARD */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <div className="flex gap-4 h-full min-w-[880px]">
          {MANUAL_COLUMNS.map((col) => {
            const colData = getColumnData(col.id);
            const Icon = col.icon;

            return (
              <div key={col.id} className="flex-1 flex flex-col min-w-[210px]">

                {/* En-tête colonne */}
                <div className={`
                  flex items-center justify-between px-4 py-3 mb-2
                  ${col.headerBg} rounded-t-2xl border-t-[3px] ${col.borderTop}
                  border-x border-b border-[var(--border)]/50
                `}>
                  <div className="flex items-center gap-2">
                    <Icon size={15} className="text-[var(--text-muted)] shrink-0" />
                    <h3 className="font-bold text-sm text-[var(--text)] leading-tight">{col.title}</h3>
                  </div>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${col.countBg}`}>
                    {colData.length}
                  </span>
                </div>

                {/* Cartes */}
                <div className="flex-1 bg-[var(--surface-2)] rounded-b-2xl px-2 pt-2 pb-3 overflow-y-auto space-y-2 border border-t-0 border-[var(--border)]/50">
                  <AnimatePresence mode="popLayout">
                    {colData.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center h-28 text-center py-6"
                      >
                        <Icon size={22} className="text-[var(--border)] mb-2" />
                        <p className="text-xs text-[var(--text-muted)] italic">{col.emptyMsg}</p>
                        {selectedJobId && (
                          <p className="text-[10px] text-[var(--text-muted)]/50 mt-1">pour cette offre</p>
                        )}
                      </motion.div>
                    ) : (
                      colData.map((c) => (
                        <motion.div
                          key={c.id}
                          layout
                          initial={{ opacity: 0, scale: 0.97 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          onClick={() => router.push(`/recrutement/manuel/candidats/${c.id}`)}
                          className="bg-[var(--surface)] px-3 py-3 rounded-xl border border-[var(--border)] shadow-sm cursor-pointer hover:shadow-md hover:border-emerald-400/60 dark:hover:border-emerald-500/40 transition-all group"
                        >
                          <div className="flex items-center gap-2.5 mb-2">
                            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-xs text-white shrink-0">
                              {c.firstName[0]}{c.lastName[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-sm text-[var(--text)] truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                {c.firstName} {c.lastName}
                              </h4>
                              <p className="text-[11px] text-[var(--text-muted)] truncate">{c.jobOffer?.title}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-[var(--text-muted)] bg-[var(--surface-2)] px-2 py-0.5 rounded-md">
                              {new Date(c.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                            </span>
                            <Eye size={13} className="text-[var(--text-muted)] group-hover:text-emerald-500 transition-colors" />
                          </div>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
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