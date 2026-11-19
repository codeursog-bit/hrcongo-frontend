'use client';

// ============================================================================
// 📁 app/(dashboard)/recrutement/page.tsx
// OFFRES — chaque offre avec l'état réel de son recrutement :
//   candidats par étape, postes pourvus, ancienneté, expiration.
//   Recherche et filtres qui fonctionnent, clôture (avec e-mail « poste pourvu »),
//   réouverture, partage (lien, WhatsApp), accès direct au pipeline de l'offre.
// ============================================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, Palette, Search, Share2, Pencil, Trash2, Check, Copy, MapPin, Building2, Clock, Briefcase, BrainCircuit, MessageCircle } from 'lucide-react';
import { Badge, Button, Card, EmptyState } from '@/components/design-system/primitives';
import { Modal, useToast } from '@/components/design-system/feedback';
import { RecruitmentFrame as ModulePageFrame } from '@/components/recruitment/RecruitmentFrame';
import { KonzaLoader } from '@/components/ui/KonzaLoader';
import { api } from '@/services/api';
import { ModeSelectionModal } from './ModeSelectionModal';
import { CloseJobModal } from '@/components/recruitment/RecruitmentModals';
import { RecruitmentHeader, RecruitmentNav, errMsg, fmtDate } from '@/components/recruitment/recruitment-ui';

interface JobOverview {
  id: string; title: string; status: 'PUBLISHED' | 'CLOSED' | 'DRAFT' | 'ARCHIVED'; processingMode: 'MANUAL' | 'AI_ASSISTED';
  departmentName: string | null; location: string | null; type: string; showOnPortal: boolean;
  createdAt: string; expirationDate: string | null; isExpired: boolean; daysOpen: number;
  counts: { new: number; screening: number; interview: number; offer: number; hired: number; rejected: number; total: number };
  positions: number; requisitionId: string | null;
}

const STATUS_FILTERS = [
  { id: 'ALL', label: 'Toutes' }, { id: 'PUBLISHED', label: 'Publiées' }, { id: 'CLOSED', label: 'Clôturées' }, { id: 'DRAFT', label: 'Brouillons' },
] as const;

const STAGE_CHIPS: Array<{ key: keyof JobOverview['counts']; label: string }> = [
  { key: 'new', label: 'À traiter' }, { key: 'screening', label: 'Présélection' },
  { key: 'interview', label: 'Entretiens' }, { key: 'offer', label: 'Offre' }, { key: 'hired', label: 'Embauchés' },
];

export default function RecruitmentOffersPage() {
  const notify = useToast();
  const [jobs, setJobs] = useState<JobOverview[] | null>(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]['id']>('ALL');
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [shareJob, setShareJob] = useState<JobOverview | null>(null);
  const [copied, setCopied] = useState(false);
  const [closeJob, setCloseJob] = useState<JobOverview | null>(null);

  const load = useCallback(async () => {
    try { setJobs(await api.get<JobOverview[]>('/recruitment/jobs-overview')); setError(''); }
    catch (e) { setError(errMsg(e)); setJobs([]); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const visible = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (jobs ?? []).filter((j) =>
      (status === 'ALL' || j.status === status) &&
      (!t || `${j.title} ${j.departmentName ?? ''} ${j.location ?? ''}`.toLowerCase().includes(t)));
  }, [jobs, q, status]);

  const handleDelete = async (job: JobOverview) => {
    const warn = job.counts.total > 0 ? `Cette offre a ${job.counts.total} candidature(s). ` : '';
    if (!window.confirm(`${warn}Supprimer « ${job.title} » définitivement ?`)) return;
    try { await api.delete(`/recruitment/jobs/${job.id}`); notify('success', 'Offre supprimée'); await load(); }
    catch (e) { notify('error', 'Suppression impossible', errMsg(e)); }
  };

  const reopen = async (job: JobOverview) => {
    try { await api.post(`/recruitment/jobs/${job.id}/reopen`, {}); notify('success', 'Offre rouverte'); await load(); }
    catch (e) { notify('error', errMsg(e)); }
  };

  const shareUrl = shareJob ? `${typeof window !== 'undefined' ? window.location.origin : ''}/jobs/${shareJob.id}` : '';
  const copyLink = () => {
    void navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ModulePageFrame kind="dashboard" error={error || undefined}>
      <div className="mx-auto max-w-[1400px] space-y-6 pb-20">
        <RecruitmentHeader
          title="Offres d’emploi"
          subtitle="Chaque offre avec l’état réel de son recrutement."
          actions={
            <>
              <Link href="/recrutement/customize-career-page" className="k-button k-button-secondary">
                <Palette size={18} strokeWidth={1.5} /><span className="hidden lg:inline">Page carrière</span>
              </Link>
              <Button data-guide="recrutement-create" onClick={() => setShowModeSelector(true)}><Plus size={18} strokeWidth={1.5} /><span>Nouvelle offre</span></Button>
            </>
          }
        />
        <RecruitmentNav />

        <Card className="!p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative min-w-0 flex-1">
              <Search size={16} strokeWidth={1.5} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
              <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher une offre (poste, département, lieu)…"
                aria-label="Rechercher une offre" className="w-full rounded-xl border border-[var(--border)] bg-transparent text-[var(--text)]" style={{ paddingLeft: 38 }} />
            </div>
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtrer par statut">
              {STATUS_FILTERS.map((s) => (
                <button key={s.id} role="tab" aria-selected={status === s.id} onClick={() => setStatus(s.id)}
                  className={`min-h-10 rounded-xl border px-4 text-sm font-medium transition-colors ${status === s.id ? 'border-[var(--brand)] bg-[var(--brand)] text-[var(--on-brand)]' : 'border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)]'}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {jobs === null ? <KonzaLoader variant="section" /> : visible.length === 0 ? (
          <EmptyState title={jobs.length === 0 ? 'Aucune offre pour le moment' : 'Aucune offre ne correspond'} icon={Briefcase}
            action={jobs.length === 0 ? <Button onClick={() => setShowModeSelector(true)}>Créer ma première offre</Button> : undefined}>
            {jobs.length === 0 ? 'Créez une offre, ou partez d’une demande de recrutement validée.' : 'Modifiez la recherche ou le filtre de statut.'}
          </EmptyState>
        ) : (
          <div className="space-y-4">
            {visible.map((job) => {
              const isAI = job.processingMode === 'AI_ASSISTED';
              const expiresSoon = job.expirationDate && job.status === 'PUBLISHED' && new Date(job.expirationDate).getTime() - Date.now() < 7 * 86_400_000;
              const active = job.counts.new + job.counts.screening + job.counts.interview;
              return (
                <Card key={job.id} className="recruitment-job">
                  <div className="recruitment-job-layout">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        {isAI ? <Badge tone="info"><BrainCircuit size={12} strokeWidth={1.5} className="mr-1 inline" />IA</Badge> : <Badge tone="neutral">Manuel</Badge>}
                        {job.status === 'PUBLISHED' && <Badge tone="success">Publiée</Badge>}
                        {job.status === 'CLOSED' && <Badge tone="neutral">Clôturée</Badge>}
                        {job.status === 'DRAFT' && <Badge tone="warning">Brouillon</Badge>}
                        {job.status === 'ARCHIVED' && <Badge tone="neutral">Archivée</Badge>}
                        {(job.isExpired || expiresSoon) && <Badge tone={job.isExpired ? 'danger' : 'warning'}>{job.isExpired ? 'Expirée' : `Expire le ${fmtDate(job.expirationDate)}`}</Badge>}
                        {job.requisitionId && <Badge tone="info">Issue d’une demande</Badge>}
                      </div>
                      <h2 className="text-xl font-semibold text-[var(--text)]">{job.title}</h2>
                      <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--text-secondary)]">
                        <span className="inline-flex items-center gap-1.5"><Building2 size={14} strokeWidth={1.5} />{job.departmentName ?? 'Sans département'}</span>
                        {job.location && <span className="inline-flex items-center gap-1.5"><MapPin size={14} strokeWidth={1.5} />{job.location}</span>}
                        <span>{job.type}</span>
                        <span className="inline-flex items-center gap-1.5"><Clock size={14} strokeWidth={1.5} />ouverte depuis {job.daysOpen} j</span>
                      </p>

                      <div className="recruitment-job-stages" aria-label="Candidats par étape">
                        {STAGE_CHIPS.map((s) => (
                          <Link key={s.key} href={`/recrutement/pipeline?job=${job.id}`}
                            className={`rounded-xl border px-3 py-1.5 text-xs ${job.counts[s.key] > 0 ? 'border-[var(--border)] text-[var(--text)]' : 'border-transparent text-[var(--text-secondary)]'} bg-[var(--surface-2)]`}>
                            <span className="font-semibold tabular-nums">{job.counts[s.key]}</span> {s.label}
                          </Link>
                        ))}
                      </div>
                      <p className="mt-3 text-xs text-[var(--text-secondary)]">
                        {job.counts.total} candidature(s) · {job.counts.hired}/{job.positions} poste{job.positions > 1 ? 's' : ''} pourvu{job.counts.hired > 1 ? 's' : ''}
                      </p>
                    </div>

                    <div className="recruitment-job-actions flex flex-wrap items-center gap-2">
                      <Link href={`/recrutement/pipeline?job=${job.id}`} className="k-button k-button-primary">Voir le pipeline</Link>
                      {job.status === 'PUBLISHED' && <Button variant="secondary" onClick={() => setCloseJob(job)}>Clôturer</Button>}
                      {job.status === 'CLOSED' && <Button variant="secondary" onClick={() => reopen(job)}>Rouvrir</Button>}
                      <Button variant="ghost" aria-label={`Partager ${job.title}`} onClick={() => setShareJob(job)}><Share2 size={16} strokeWidth={1.5} /></Button>
                      <Link href={`/recrutement/offres/${job.id}/edit`} aria-label={`Modifier ${job.title}`} className="k-button k-button-ghost"><Pencil size={16} strokeWidth={1.5} /></Link>
                      <Button variant="ghost" aria-label={`Supprimer ${job.title}`} onClick={() => handleDelete(job)}><Trash2 size={16} strokeWidth={1.5} /></Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {showModeSelector && <ModeSelectionModal isOpen={showModeSelector} onClose={() => setShowModeSelector(false)} />}

      {closeJob && (
        <CloseJobModal job={closeJob} activeCandidates={closeJob.counts.new + closeJob.counts.screening + closeJob.counts.interview}
          onClose={() => setCloseJob(null)} onDone={() => { setCloseJob(null); void load(); }} />
      )}

      {shareJob && (
        <Modal open onClose={() => setShareJob(null)} title="Partager l’offre" actions={<Button onClick={() => setShareJob(null)}>Fermer</Button>}>
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-secondary)]">{shareJob.title}</p>
            <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] p-2">
              <input readOnly value={shareUrl} aria-label="Lien de l’offre" className="min-w-0 flex-1 bg-transparent text-sm text-[var(--text)]" style={{ height: 36, padding: '0 8px', border: 0 }} />
              <Button variant="secondary" onClick={copyLink}>{copied ? <Check size={16} strokeWidth={1.5} /> : <Copy size={16} strokeWidth={1.5} />}{copied ? 'Copié' : 'Copier'}</Button>
            </div>
            <a className="k-button k-button-secondary" target="_blank" rel="noreferrer"
              href={`https://wa.me/?text=${encodeURIComponent(`Nous recrutons : ${shareJob.title}. Postulez ici : ${shareUrl}`)}`}>
              <MessageCircle size={16} strokeWidth={1.5} /> Partager sur WhatsApp
            </a>
          </div>
        </Modal>
      )}
    </ModulePageFrame>
  );
}
