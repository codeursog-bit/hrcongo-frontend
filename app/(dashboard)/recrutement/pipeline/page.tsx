'use client';
import { ModuleSelect } from '@/components/ui/ModuleSelect';

// ============================================================================
// 📁 app/(dashboard)/recrutement/pipeline/page.tsx
// PIPELINE — toutes les candidatures (manuel + IA) par étape, sur un seul écran.
//   • Glisser-déposer sur ordinateur, menu « Déplacer vers » au clavier / mobile
//   • Déposer sur Entretien / Offre / Embauche / Refus ouvre la bonne fenêtre
//     (on ne change jamais d'étape « dans le vide »)
//   • Ancienneté dans l'étape, prochain entretien, état de l'offre sur chaque carte
// ============================================================================

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, CalendarClock, Mail, Sparkles, AlertTriangle, Briefcase, Download } from 'lucide-react';
import { Badge, Button, Card, EmptyState } from '@/components/design-system/primitives';
import { useToast } from '@/components/design-system/feedback';
import { RecruitmentFrame as ModulePageFrame } from '@/components/recruitment/RecruitmentFrame';
import { KonzaLoader } from '@/components/ui/KonzaLoader';
import { api } from '@/services/api';
import {
  Avatar, COLUMNS, ColumnId, DaysChip, JobLite, PipelineCard, RecruitmentHeader, RecruitmentNav,
  Stars, columnOf, errMsg, fmtDate, fmtTime, KIND_LABEL, STATUS_LABEL,
} from '@/components/recruitment/recruitment-ui';
import { BulkRejectModal, EmailModal, HireModal, InterviewModal, OfferModal, RejectModal } from '@/components/recruitment/RecruitmentModals';

type Data = { candidates: PipelineCard[]; jobs: JobLite[]; sources: string[] };
type ModalState = null | { type: 'reject' | 'interview' | 'offer' | 'hire' | 'email'; card: PipelineCard };

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export default function PipelinePage() {
  const router = useRouter();
  const notify = useToast();

  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [ready, setReady] = useState(false);
  const [jobId, setJobId] = useState('');
  const [q, setQ] = useState('');
  const [source, setSource] = useState('');
  const [vivier, setVivier] = useState(false);
  const [showRejected, setShowRejected] = useState(false);
  const debouncedQ = useDebounced(q, 300);

  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<ColumnId | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkReject, setBulkReject] = useState(false);
  const reqSeq = useRef(0);

  // Filtre d'offre venant d'un lien (?job=…)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get('job')) setJobId(p.get('job') as string);
    setReady(true);
  }, []);

  const load = useCallback(async () => {
    const seq = ++reqSeq.current;
    try {
      const params = new URLSearchParams();
      if (jobId) params.set('jobId', jobId);
      if (debouncedQ.trim()) params.set('q', debouncedQ.trim());
      if (source) params.set('source', source);
      if (vivier) params.set('talentPool', 'true');
      const res = await api.get<Data>(`/recruitment/pipeline?${params.toString()}`);
      if (seq !== reqSeq.current) return; // une réponse plus récente a déjà été reçue
      setData(res);
      setSelected((s) => new Set([...s].filter((id) => res.candidates.some((c) => c.id === id))));
      setError('');
    } catch (e) {
      if (seq !== reqSeq.current) return;
      setError(errMsg(e));
    } finally {
      if (seq === reqSeq.current) setLoading(false);
    }
  }, [jobId, debouncedQ, source, vivier]);

  useEffect(() => { if (ready) void load(); }, [ready, load]);

  const byColumn = useMemo(() => {
    const map: Record<ColumnId, PipelineCard[]> = { NEW: [], SCREENING: [], INTERVIEW: [], OFFER: [], HIRED: [], REJECTED: [] };
    for (const c of data?.candidates ?? []) map[columnOf(c.status)].push(c);
    return map;
  }, [data]);

  // ── Déplacement ─────────────────────────────────────────────────────────────
  const requestMove = async (card: PipelineCard, col: ColumnId) => {
    if (columnOf(card.status) === col) return;
    if (card.status === 'HIRED') return notify('info', 'Ce candidat est déjà embauché');
    if (col === 'NEW' || col === 'SCREENING') {
      const target = COLUMNS.find((c) => c.id === col)!.target;
      const before = data;
      setData((d) => d && ({ ...d, candidates: d.candidates.map((c) => (c.id === card.id ? { ...c, status: target, daysInStage: 0 } : c)) }));
      try {
        await api.patch(`/recruitment/candidates/${card.id}/move`, { status: target });
      } catch (e) {
        setData(before);
        notify('error', errMsg(e));
      }
      return;
    }
    const type = col === 'INTERVIEW' ? 'interview' : col === 'OFFER' ? 'offer' : col === 'HIRED' ? 'hire' : 'reject';
    setModal({ type, card });
  };

  const done = () => { setModal(null); void load(); };

  // ── Sélection et actions groupées ───────────────────────────────────────────
  const toggleSelect = (id: string) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const bulkScreening = async () => {
    try {
      const r = await api.post<{ done: number; failed: Array<{ message: string }> }>('/recruitment/bulk/move', { ids: [...selected], status: 'SCREENING' });
      notify(r.failed.length ? 'error' : 'success', `${r.done} candidat(s) présélectionné(s)`, r.failed.length ? `${r.failed.length} échec(s) : ${r.failed[0].message}` : undefined);
      setSelected(new Set());
      await load();
    } catch (e) { notify('error', errMsg(e)); }
  };

  const compare = () => router.push(`/recrutement/comparer?ids=${[...selected].join(',')}`);

  // Export Excel (CSV avec « ; » et BOM pour s'ouvrir correctement en français)
  const exportCsv = () => {
    const rows = data?.candidates ?? [];
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const header = ['Prénom', 'Nom', 'E-mail', 'Téléphone', 'Offre', 'Étape', 'Score global', 'Source', 'Vivier', 'Candidature le', 'Jours dans l’étape'];
    const lines = rows.map((c) => [
      c.firstName, c.lastName, c.email, c.phone, c.jobTitle, STATUS_LABEL[c.status] ?? c.status,
      c.totalScore ? Math.round(c.totalScore) : '', c.source, c.talentPool ? 'Oui' : 'Non', fmtDate(c.createdAt), c.daysInStage,
    ].map(esc).join(';'));
    const csv = '\uFEFF' + [header.map(esc).join(';'), ...lines].join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `candidats-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const rejectedCount = byColumn.REJECTED.length;
  const visibleColumns = COLUMNS.filter((c) => c.id !== 'REJECTED' || showRejected);
  const total = data?.candidates.length ?? 0;
  const jobTitle = jobId ? data?.jobs.find((j) => j.id === jobId)?.title : null;

  return (
    <ModulePageFrame kind="dashboard" error={error || undefined}>
      <div className="mx-auto max-w-[1700px] space-y-6 pb-20">
        <RecruitmentHeader
          title="Pipeline"
          subtitle={jobTitle ? `Candidatures pour « ${jobTitle} »` : 'Toutes les candidatures, de la candidature à l’embauche.'}
        />
        <RecruitmentNav />

        {/* Filtres */}
        <Card className="!p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search size={16} strokeWidth={1.5} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
              <input
                type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un candidat (nom, e-mail)…"
                aria-label="Rechercher un candidat" className="w-full rounded-xl border border-[var(--border)] bg-transparent text-[var(--text)]"
                style={{ paddingLeft: 38 }}
              />
            </div>
            <ModuleSelect value={jobId} onChange={(e) => setJobId(e.target.value)} aria-label="Filtrer par offre" className="rounded-xl border border-[var(--border)] bg-transparent text-[var(--text)] lg:w-64">
              <option value="">Toutes les offres</option>
              {data?.jobs.map((j) => <option key={j.id} value={j.id}>{j.title}{j.status === 'CLOSED' ? ' (clôturée)' : ''}</option>)}
            </ModuleSelect>
            <ModuleSelect value={source} onChange={(e) => setSource(e.target.value)} aria-label="Filtrer par source" className="rounded-xl border border-[var(--border)] bg-transparent text-[var(--text)] lg:w-52">
              <option value="">Toutes les sources</option>
              {(data?.sources ?? []).map((s) => <option key={s} value={s}>{s}</option>)}
            </ModuleSelect>
            <label className="flex items-center gap-2 whitespace-nowrap text-sm text-[var(--text)]">
              <input type="checkbox" checked={vivier} onChange={(e) => setVivier(e.target.checked)} className="h-4 w-4 accent-[var(--brand)]" />
              Vivier de talents
            </label>
          </div>
        </Card>

        {loading ? (
          <KonzaLoader variant="section" />
        ) : total === 0 && !q && !jobId && !source && !vivier ? (
          <EmptyState title="Aucune candidature pour le moment" icon={Briefcase}
            action={<Button onClick={() => router.push('/recrutement')}>Voir mes offres</Button>}>
            Dès qu’un candidat postule à l’une de vos offres, il apparaît ici, prêt à être traité.
          </EmptyState>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-[var(--text-secondary)]">{total} candidat{total > 1 ? 's' : ''}</p>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="ghost" onClick={exportCsv} disabled={total === 0}><Download size={15} strokeWidth={1.5} /> Exporter (Excel)</Button>
                {rejectedCount > 0 && (
                  <Button variant="ghost" onClick={() => setShowRejected((s) => !s)}>
                    {showRejected ? 'Masquer' : 'Afficher'} les refusés ({rejectedCount})
                  </Button>
                )}
              </div>
            </div>

            <div className="recruitment-board recruitment-board-lanes" role="list" aria-label="Étapes du recrutement">
              {visibleColumns.map((col) => {
                const cards = byColumn[col.id];
                const isOver = overCol === col.id && dragId !== null;
                return (
                  <section
                    key={col.id}
                    role="listitem"
                    aria-label={`${col.label} — ${cards.length} candidat(s)`}
                    onDragOver={(e) => { if (dragId) { e.preventDefault(); setOverCol(col.id); } }}
                    onDragLeave={() => setOverCol((c) => (c === col.id ? null : c))}
                    onDrop={(e) => {
                      e.preventDefault();
                      const card = data?.candidates.find((c) => c.id === dragId);
                      setOverCol(null); setDragId(null);
                      if (card) void requestMove(card, col.id);
                    }}
                    className={`recruitment-lane transition-colors ${isOver ? 'border-[var(--brand)]' : 'border-[var(--border)]'}`}
                  >
                    <header className="mb-3 flex items-center justify-between gap-2 px-1">
                      <div className="min-w-0">
                        <h2 className="truncate text-sm font-semibold text-[var(--text)]">{col.label}</h2>
                        <p className="truncate text-xs text-[var(--text-secondary)]">{col.hint}</p>
                      </div>
                      <span className="rounded-full bg-[var(--surface)] px-2.5 py-0.5 text-xs font-semibold tabular-nums text-[var(--text)]">{cards.length}</span>
                    </header>

                    <div className="flex min-h-24 flex-col gap-3">
                      {cards.length === 0 && (
                        <p className="rounded-xl border border-dashed border-[var(--border)] p-4 text-center text-xs text-[var(--text-secondary)]">
                          {isOver ? 'Déposer ici' : 'Aucun candidat'}
                        </p>
                      )}
                      {cards.map((c) => (
                        <CandidateCard
                          key={c.id}
                          card={c}
                          showJob={!jobId}
                          dragging={dragId === c.id}
                          selected={selected.has(c.id)}
                          onToggle={() => toggleSelect(c.id)}
                          onDragStart={() => setDragId(c.id)}
                          onDragEnd={() => { setDragId(null); setOverCol(null); }}
                          onOpen={() => router.push(`/recrutement/candidat/${c.id}`)}
                          onMove={(target) => void requestMove(c, target)}
                          onEmail={() => setModal({ type: 'email', card: c })}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </>
        )}
      </div>

      {selected.size > 0 && (
        <div role="region" aria-label="Actions groupées" className="sticky bottom-4 z-20 mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-lg">
          <p className="text-sm font-medium text-[var(--text)]">{selected.size} sélectionné{selected.size > 1 ? 's' : ''}</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={bulkScreening}>Présélectionner</Button>
            <Button variant="secondary" onClick={() => setBulkReject(true)}>Refuser…</Button>
            <Button variant="secondary" disabled={selected.size < 2 || selected.size > 4} onClick={compare} title="Comparer 2 à 4 candidats">Comparer</Button>
            <Button variant="ghost" onClick={() => setSelected(new Set())}>Tout désélectionner</Button>
          </div>
        </div>
      )}

      {bulkReject && <BulkRejectModal ids={[...selected]} onClose={() => setBulkReject(false)} onDone={() => { setBulkReject(false); setSelected(new Set()); void load(); }} />}
      {modal?.type === 'reject' && <RejectModal candidate={modal.card} onClose={() => setModal(null)} onDone={done} />}
      {modal?.type === 'interview' && <InterviewModal candidate={modal.card} onClose={() => setModal(null)} onDone={done} />}
      {modal?.type === 'offer' && <OfferModal candidate={modal.card} onClose={() => setModal(null)} onDone={done} />}
      {modal?.type === 'hire' && <HireModal candidate={modal.card} onClose={() => { setModal(null); void load(); }} onDone={done} />}
      {modal?.type === 'email' && <EmailModal candidate={modal.card} onClose={() => setModal(null)} onDone={done} />}
    </ModulePageFrame>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function CandidateCard({ card, showJob, dragging, selected, onToggle, onDragStart, onDragEnd, onOpen, onMove, onEmail }: {
  card: PipelineCard; showJob: boolean; dragging: boolean; selected: boolean; onToggle: () => void;
  onDragStart: () => void; onDragEnd: () => void; onOpen: () => void;
  onMove: (c: ColumnId) => void; onEmail: () => void;
}) {
  const col = columnOf(card.status);
  const waitingTest = card.status === 'EN_ATTENTE_TEST' || card.status === 'EN_ATTENTE_ANALYSE';
  const closedFile = col === 'HIRED' || col === 'REJECTED';
  const offerState = card.offerAcceptedAt ? 'Offre acceptée' : card.offerDeclinedAt ? 'Offre déclinée' : card.offerSentAt ? 'Offre envoyée' : null;

  return (
    <article
      draggable={col !== 'HIRED'}
      onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', card.id); onDragStart(); }}
      onDragEnd={onDragEnd}
      className={`recruitment-candidate-card transition-opacity ${dragging ? 'opacity-40' : ''} ${col !== 'HIRED' ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      <div className="flex items-start gap-2">
      {col !== 'HIRED' && (
        <input type="checkbox" checked={selected} onChange={onToggle} aria-label={`Sélectionner ${card.firstName} ${card.lastName}`} className="mt-1 h-4 w-4 shrink-0 accent-[var(--brand)]" />
      )}
      <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-start gap-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus)]" aria-label={`Ouvrir la fiche de ${card.firstName} ${card.lastName}`}>
        <Avatar first={card.firstName} last={card.lastName} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-[var(--text)]">{card.firstName} {card.lastName}</span>
          {showJob && <span className="block truncate text-xs text-[var(--text-secondary)]">{card.jobTitle}</span>}
        </span>
        {!closedFile && <DaysChip days={card.daysInStage} />}
      </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {card.totalScore > 0 && <Badge tone={card.totalScore >= 70 ? 'success' : card.totalScore >= 45 ? 'warning' : 'danger'}>Score {Math.round(card.totalScore)}</Badge>}
        {waitingTest && <Badge tone="warning">{STATUS_LABEL[card.status]}</Badge>}
        {card.aiSuggestion && card.aiSuggestion !== 'PENDING' && <span title="Suggestion de l’IA" className="inline-flex items-center gap-1 text-xs text-[var(--text-secondary)]"><Sparkles size={12} strokeWidth={1.5} />{card.aiSuggestion === 'ACCEPT' ? 'IA : retenir' : card.aiSuggestion === 'REJECT' ? 'IA : refuser' : 'IA : à voir'}</span>}
        {card.talentPool && <Badge tone="info">Vivier</Badge>}
        {(card.autoDisqualified || card.suspiciousActivity) && <span title="Activité suspecte pendant le test" className="inline-flex items-center gap-1 text-xs text-[var(--danger-text)]"><AlertTriangle size={12} strokeWidth={1.5} />Suspect</span>}
        {offerState && <Badge tone={card.offerAcceptedAt ? 'success' : card.offerDeclinedAt ? 'danger' : 'warning'}>{offerState}</Badge>}
      </div>

      {card.nextInterviewAt && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-[var(--text)]">
          <CalendarClock size={13} strokeWidth={1.5} aria-hidden="true" />
          {KIND_LABEL[card.nextInterviewKind ?? 'OTHER']} · {fmtDate(card.nextInterviewAt)} {fmtTime(card.nextInterviewAt)}
        </p>
      )}
      {card.rating ? <div className="mt-2"><Stars value={card.rating} size={13} /></div> : null}

      {col !== 'HIRED' && (
        <div className="mt-3 flex items-center gap-2">
          <ModuleSelect
            aria-label={`Déplacer ${card.firstName} ${card.lastName} vers…`}
            value=""
            onChange={(e) => { if (e.target.value) onMove(e.target.value as ColumnId); }}
            className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-transparent text-xs text-[var(--text-secondary)]"
            style={{ height: 34, padding: '4px 8px', fontSize: 12 }}
          >
            <option value="">Déplacer vers…</option>
            {COLUMNS.filter((c) => c.id !== col).map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </ModuleSelect>
          <button type="button" onClick={onEmail} aria-label={`Écrire à ${card.firstName}`} className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)]">
            <Mail size={15} strokeWidth={1.5} />
          </button>
        </div>
      )}
    </article>
  );
}