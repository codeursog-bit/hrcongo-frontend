'use client';

// ============================================================================
// 📁 app/(dashboard)/recrutement/candidat/[id]/page.tsx
// FICHE CANDIDAT 360° — tout ce que le recruteur fait sur un candidat, au même endroit :
//   Chronologie (qui a fait quoi, notes d'équipe) · Entretiens + grille d'évaluation ·
//   Offre d'embauche · Écrire (modèles) · Refuser avec motif · Embaucher sans doublon
// ============================================================================

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, ArrowRightLeft, StickyNote, CalendarClock, Mail, Banknote, BadgeCheck, Info,
  Phone, MessageCircle, FileText, ExternalLink, Plus, Sparkles, UserPlus,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Badge, Button, Card, EmptyState, Select, Textarea } from '@/components/design-system/primitives';
import { Modal, useToast } from '@/components/design-system/feedback';
import { RecruitmentFrame as ModulePageFrame } from '@/components/recruitment/RecruitmentFrame';
import { KonzaLoader } from '@/components/ui/KonzaLoader';
import { api } from '@/services/api';
import {
  Activity, Avatar, DaysChip, Interview, KIND_LABEL, MODE_LABEL, RECO_LABEL, RECO_TONE,
  RecruitmentNav, ScoreBar, SOURCE_OPTIONS, Stars, StatusBadge, errMsg, fmtDate, fmtDateTime, fmtMoney,
  fmtTime, isClosed, reasonLabel, timeAgo, whatsappLink,
} from '@/components/recruitment/recruitment-ui';
import {
  CloseJobModal, EmailModal, FeedbackModal, HireModal, InterviewModal, OfferModal, RejectModal,
} from '@/components/recruitment/RecruitmentModals';

interface Fiche {
  candidate: {
    id: string; firstName: string; lastName: string; email: string; phone: string | null;
    status: string; createdAt: string; resumeUrl: string | null; additionalDocUrl: string | null;
    coverLetter: string | null; cvScore: number | null; testScore: number | null; totalScore: number | null;
    aiSuggestion: string | null; aiReasoning: string | null; hrDecision: string | null; hrNotes: string | null;
    notes: string | null; rating: number | null; source: string | null; talentPool: boolean;
    rejectionReason: string | null; offerSalary: number | string | null; offerStartDate: string | null;
    offerSentAt: string | null; offerAcceptedAt: string | null; offerDeclinedAt: string | null;
    hiredEmployeeId: string | null; hiredAt: string | null; suspiciousActivity: boolean; autoDisqualified: boolean;
    jobOfferId: string;
  };
  job: {
    id: string; title: string; departmentId: string | null; departmentName: string | null; location: string | null;
    salaryMin: number | string | null; salaryMax: number | string | null; salaryCurrency: string | null;
    processingMode: string; type: string;
  };
  daysInStage: number;
  activities: Activity[];
  interviews: Interview[];
  otherApplications: Array<{ id: string; status: string; createdAt: string; jobTitle: string }>;
}

type Tab = 'timeline' | 'interviews' | 'offer';
type ModalState =
  | null
  | { type: 'reject' | 'interview' | 'offer' | 'hire' | 'email' | 'reapply' }
  | { type: 'feedback' | 'reschedule'; interview: Interview }
  | { type: 'close'; active: number };

const ACTIVITY_ICON: Record<Activity['type'], LucideIcon> = {
  STATUS_CHANGE: ArrowRightLeft, NOTE: StickyNote, INTERVIEW: CalendarClock, EMAIL: Mail,
  OFFER: Banknote, HIRE: BadgeCheck, SYSTEM: Info,
};

export default function CandidateFichePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const notify = useToast();

  const [fiche, setFiche] = useState<Fiche | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('timeline');
  const [modal, setModal] = useState<ModalState>(null);
  const [note, setNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const load = useCallback(async () => {
    try {
      setFiche(await api.get<Fiche>(`/recruitment/candidates/${id}/fiche`));
      setError('');
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  // Onglet demandé par un lien (?tab=interviews | offer) — ex. depuis le tableau de bord
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('tab');
    if (t === 'interviews' || t === 'offer') setTab(t);
  }, []);

  if (loading) return <ModulePageFrame kind="detail"><KonzaLoader variant="section" /></ModulePageFrame>;
  if (!fiche) {
    return (
      <ModulePageFrame kind="detail" error={error || undefined}>
        <EmptyState title="Candidat introuvable" action={<Button onClick={() => router.push('/recrutement/pipeline')}>Retour au pipeline</Button>}>
          Ce dossier n’existe plus ou vous n’y avez pas accès.
        </EmptyState>
      </ModulePageFrame>
    );
  }

  const { candidate: c, job } = fiche;
  const person = { id: c.id, firstName: c.firstName, lastName: c.lastName, email: c.email };
  const closed = isClosed(c.status);
  const rejected = ['REJECTED', 'REFUSE', 'DISQUALIFIED'].includes(c.status);
  const offerPending = !!c.offerSentAt && !c.offerAcceptedAt && !c.offerDeclinedAt;
  const wa = whatsappLink(c.phone);
  const done = () => { setModal(null); void load(); };

  const patchProfile = async (body: Record<string, unknown>) => {
    try { await api.patch(`/recruitment/candidates/${c.id}/profile`, body); await load(); }
    catch (e) { notify('error', errMsg(e)); }
  };

  const move = async (status: string) => {
    try { await api.patch(`/recruitment/candidates/${c.id}/move`, { status }); await load(); }
    catch (e) { notify('error', errMsg(e)); }
  };

  const addNote = async () => {
    if (!note.trim()) return;
    setSavingNote(true);
    try { await api.post(`/recruitment/candidates/${c.id}/notes`, { text: note }); setNote(''); await load(); }
    catch (e) { notify('error', errMsg(e)); }
    finally { setSavingNote(false); }
  };

  const interviewAction = async (i: Interview, status: 'CANCELLED' | 'NO_SHOW') => {
    const ask = status === 'CANCELLED' ? 'Annuler cet entretien ?' : 'Marquer le candidat comme absent à cet entretien ?';
    if (!window.confirm(ask)) return;
    try { await api.patch(`/recruitment/interviews/${i.id}`, { status }); await load(); }
    catch (e) { notify('error', errMsg(e)); }
  };

  const offerResponse = async (accepted: boolean) => {
    if (!accepted && !window.confirm('Le candidat décline l’offre : le dossier sera classé « refusé ». Confirmer ?')) return;
    try { await api.post(`/recruitment/candidates/${c.id}/offer-response`, { accepted }); await load(); }
    catch (e) { notify('error', errMsg(e)); }
  };

  const openCloseJob = async () => {
    let active = 0;
    try {
      const jobs = await api.get<Array<{ id: string; counts: { new: number; screening: number; interview: number } }>>('/recruitment/jobs-overview');
      const j = jobs.find((x) => x.id === job.id);
      active = j ? j.counts.new + j.counts.screening + j.counts.interview : 0;
    } catch { /* on propose quand même la clôture */ }
    setModal({ type: 'close', active });
  };

  const doneInterviews = fiche.interviews.filter((i) => i.status === 'DONE' && i.overallScore !== null);
  const avgScore = doneInterviews.length ? Math.round(doneInterviews.reduce((s, i) => s + (i.overallScore ?? 0), 0) / doneInterviews.length) : null;

  return (
    <ModulePageFrame kind="detail">
      <div className="mx-auto max-w-[1400px] space-y-6 pb-20">
        <RecruitmentNav />

        {/* En-tête */}
        <div className="recruitment-candidate-header space-y-4">
          <Link href={`/recrutement/pipeline?job=${job.id}`} className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text)]">
            <ArrowLeft size={15} strokeWidth={1.5} /> Pipeline — {job.title}
          </Link>

          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
            <div className="flex items-start gap-4">
              <Avatar first={c.firstName} last={c.lastName} size={56} />
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-[var(--text)]">{c.firstName} {c.lastName}</h1>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {job.title}{job.departmentName ? ` · ${job.departmentName}` : ''}{job.location ? ` · ${job.location}` : ''}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusBadge status={c.status} />
                  {!closed && <span className="text-xs text-[var(--text-secondary)]">dans cette étape depuis <DaysChip days={fiche.daysInStage} label={fiche.daysInStage > 1 ? 'jours' : 'jour'} /></span>}
                  {rejected && c.rejectionReason && <Badge tone="danger">{reasonLabel(c.rejectionReason)}</Badge>}
                  {c.talentPool && <Badge tone="info">Vivier de talents</Badge>}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" onClick={() => setModal({ type: 'email' })}><Mail size={16} strokeWidth={1.5} /> Écrire</Button>
              {!closed && <Button variant="secondary" onClick={() => setModal({ type: 'interview' })}><CalendarClock size={16} strokeWidth={1.5} /> Planifier un entretien</Button>}
              {!closed && <Button variant="secondary" onClick={() => setModal({ type: 'offer' })}><Banknote size={16} strokeWidth={1.5} /> {c.offerSentAt ? 'Modifier l’offre' : 'Faire une offre'}</Button>}
              {!closed && <Button variant={c.offerAcceptedAt ? 'primary' : 'secondary'} onClick={() => setModal({ type: 'hire' })}><UserPlus size={16} strokeWidth={1.5} /> Embaucher</Button>}
              {!closed && <Button variant="ghost" onClick={() => setModal({ type: 'reject' })}>Refuser</Button>}
              {rejected && <Button variant="secondary" onClick={() => move('SCREENING')}>Rouvrir le dossier</Button>}
              {c.hiredEmployeeId && <Link href={`/employes/${c.hiredEmployeeId}`} className="k-button k-button-primary">Ouvrir la fiche employé <ExternalLink size={14} strokeWidth={1.5} /></Link>}
            </div>
          </div>
        </div>

        {(offerPending || (c.offerAcceptedAt && !c.hiredEmployeeId && !closed)) && (
          <div className="flex flex-col justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] p-4 sm:flex-row sm:items-center" role="status">
            <p className="text-sm text-[var(--text)]">
              {c.offerAcceptedAt
                ? <>Le candidat a <strong>accepté</strong> l’offre ({fmtMoney(c.offerSalary, job.salaryCurrency ?? 'XAF')}). Il ne reste qu’à l’embaucher.</>
                : <>Offre envoyée le {fmtDate(c.offerSentAt)} : en attente de la réponse du candidat.</>}
            </p>
            {c.offerAcceptedAt
              ? <Button onClick={() => setModal({ type: 'hire' })}>Embaucher maintenant</Button>
              : <div className="flex gap-2"><Button variant="secondary" onClick={() => offerResponse(true)}>Il accepte</Button><Button variant="ghost" onClick={() => offerResponse(false)}>Il décline</Button></div>}
          </div>
        )}

        <div className="recruitment-candidate-layout">
          {/* ───────── Colonne gauche : profil ───────── */}
          <div className="space-y-6">
            <Card title="Coordonnées et profil">
              <div className="space-y-3 text-sm">
                <p><a className="break-all text-[var(--brand-strong)] underline" href={`mailto:${c.email}`}>{c.email}</a></p>
                {c.phone && (
                  <p className="flex flex-wrap items-center gap-3">
                    <a className="inline-flex items-center gap-1.5 text-[var(--text)]" href={`tel:${c.phone}`}><Phone size={14} strokeWidth={1.5} /> {c.phone}</a>
                    {wa && <a className="inline-flex items-center gap-1.5 text-[var(--success-text)]" href={wa} target="_blank" rel="noreferrer"><MessageCircle size={14} strokeWidth={1.5} /> WhatsApp</a>}
                  </p>
                )}
                <p className="text-[var(--text-secondary)]">A postulé le {fmtDate(c.createdAt)}</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {c.resumeUrl && <a className="k-button k-button-secondary" href={c.resumeUrl} target="_blank" rel="noreferrer"><FileText size={15} strokeWidth={1.5} /> CV</a>}
                  {c.additionalDocUrl && <a className="k-button k-button-secondary" href={c.additionalDocUrl} target="_blank" rel="noreferrer"><FileText size={15} strokeWidth={1.5} /> Document</a>}
                </div>
              </div>
              <div className="mt-5 space-y-4 border-t border-[var(--border)] pt-4">
                <Select label="Source de la candidature" value={c.source ?? ''} onChange={(e) => patchProfile({ source: e.target.value || null })}
                  hint="Alimente vos statistiques : d’où viennent vos meilleurs candidats ?">
                  <option value="">Non renseignée</option>
                  {Array.from(new Set([...(c.source ? [c.source] : []), ...SOURCE_OPTIONS])).map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
                <div>
                  <p className="mb-1 text-sm font-medium text-[var(--text)]">Appréciation</p>
                  <Stars value={c.rating} onChange={(v) => patchProfile({ rating: v })} size={20} />
                </div>
                <label className="flex items-center gap-2 text-sm text-[var(--text)]">
                  <input type="checkbox" checked={c.talentPool} onChange={(e) => patchProfile({ talentPool: e.target.checked })} className="h-4 w-4 accent-[var(--brand)]" />
                  Garder dans le vivier de talents
                </label>
                <Button variant="secondary" onClick={() => setModal({ type: 'reapply' })}>Proposer pour une autre offre</Button>
              </div>
            </Card>

            {((c.cvScore ?? 0) > 0 || (c.testScore ?? 0) > 0 || c.aiSuggestion || avgScore !== null) && (
              <Card title="Évaluation">
                <div className="space-y-3">
                  {(c.cvScore ?? 0) > 0 && <ScoreBar label="Analyse du CV" value={c.cvScore ?? 0} />}
                  {(c.testScore ?? 0) > 0 && <ScoreBar label="Test en ligne" value={c.testScore ?? 0} />}
                  {avgScore !== null && <ScoreBar label={`Entretiens (${doneInterviews.length})`} value={avgScore} />}
                  {(c.totalScore ?? 0) > 0 && <p className="text-sm text-[var(--text-secondary)]">Score global : <strong className="text-[var(--text)]">{Math.round(c.totalScore ?? 0)}/100</strong></p>}
                  {(c.suspiciousActivity || c.autoDisqualified) && <p className="rounded-lg bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] p-2 text-xs text-[var(--danger-text)]">Activité suspecte détectée pendant le test.</p>}
                  {c.aiSuggestion && c.aiSuggestion !== 'PENDING' && (
                    <div className="rounded-xl bg-[var(--surface-2)] p-3 text-sm">
                      <p className="flex items-center gap-1.5 font-medium text-[var(--text)]"><Sparkles size={14} strokeWidth={1.5} /> Suggestion de l’IA : {c.aiSuggestion === 'ACCEPT' ? 'retenir' : c.aiSuggestion === 'REJECT' ? 'refuser' : 'à examiner'}</p>
                      {c.aiReasoning && <p className="mt-1 line-clamp-5 text-xs text-[var(--text-secondary)]">{c.aiReasoning}</p>}
                    </div>
                  )}
                  {job.processingMode === 'AI_ASSISTED' && (
                    <Link href={`/recrutement/ia/candidats/${c.id}`} className="inline-flex items-center gap-1.5 text-sm text-[var(--brand-strong)] underline">Voir l’analyse IA détaillée et le test <ExternalLink size={13} strokeWidth={1.5} /></Link>
                  )}
                </div>
              </Card>
            )}

            {fiche.otherApplications.length > 0 && (
              <Card title="Autres candidatures de cette personne">
                <ul className="space-y-2 text-sm">
                  {fiche.otherApplications.map((o) => (
                    <li key={o.id} className="flex items-center justify-between gap-2">
                      <Link href={`/recrutement/candidat/${o.id}`} className="truncate text-[var(--brand-strong)] underline">{o.jobTitle}</Link>
                      <StatusBadge status={o.status} />
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {(c.coverLetter || c.notes || c.hrNotes) && (
              <Card title="Lettre et anciennes notes">
                <div className="space-y-3 text-sm text-[var(--text-secondary)]">
                  {c.coverLetter && <div><p className="mb-1 font-medium text-[var(--text)]">Lettre de motivation</p><p className="whitespace-pre-line">{c.coverLetter}</p></div>}
                  {c.hrNotes && <div><p className="mb-1 font-medium text-[var(--text)]">Notes RH</p><p className="whitespace-pre-line">{c.hrNotes}</p></div>}
                  {c.notes && <div><p className="mb-1 font-medium text-[var(--text)]">Notes</p><p className="whitespace-pre-line">{c.notes}</p></div>}
                </div>
              </Card>
            )}
          </div>

          {/* ───────── Colonne droite : onglets ───────── */}
          <div className="min-w-0 space-y-4">
            <div role="tablist" aria-label="Sections du dossier" className="flex gap-1 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-1">
              {([['timeline', 'Chronologie', fiche.activities.length], ['interviews', 'Entretiens', fiche.interviews.length], ['offer', 'Offre', c.offerSentAt ? 1 : 0]] as const).map(([k, label, n]) => (
                <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
                  className={`min-h-10 flex-1 rounded-xl px-3 text-sm font-medium transition-colors ${tab === k ? 'bg-[var(--brand)] text-[var(--on-brand)]' : 'text-[var(--text-secondary)] hover:text-[var(--text)]'}`}>
                  {label}{n > 0 ? ` (${n})` : ''}
                </button>
              ))}
            </div>

            {/* Chronologie */}
            {tab === 'timeline' && (
              <Card>
                <div className="space-y-3">
                  <Textarea label="Ajouter une note pour l’équipe" rows={2} value={note} onChange={(e) => setNote(e.target.value)}
                    placeholder="Impression, point à vérifier, information échangée au téléphone…" />
                  <div className="flex justify-end"><Button onClick={addNote} loading={savingNote} disabled={!note.trim()}><Plus size={15} strokeWidth={1.5} /> Ajouter la note</Button></div>
                </div>
                <ol className="mt-6 space-y-5 border-t border-[var(--border)] pt-6" aria-label="Historique du dossier">
                  {fiche.activities.length === 0 && <li className="text-sm text-[var(--text-secondary)]">Aucune activité pour le moment.</li>}
                  {fiche.activities.map((a) => {
                    const Icon = ACTIVITY_ICON[a.type] ?? Info;
                    return (
                      <li key={a.id} className="flex gap-3">
                        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--brand-strong)]"><Icon size={15} strokeWidth={1.5} /></span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-[var(--text)]">{a.title ?? 'Activité'}</p>
                          {a.body && <p className="mt-1 line-clamp-6 whitespace-pre-line text-sm text-[var(--text-secondary)]">{a.body}</p>}
                          <p className="mt-1 text-xs text-[var(--text-secondary)]" title={fmtDateTime(a.createdAt)}>{a.authorName ?? 'Système'} · {timeAgo(a.createdAt)}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </Card>
            )}

            {/* Entretiens */}
            {tab === 'interviews' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-[var(--text-secondary)]">
                    {fiche.interviews.length === 0 ? 'Aucun entretien planifié.' : avgScore !== null ? `Moyenne des évaluations : ${avgScore}/100` : 'En attente d’évaluation.'}
                  </p>
                  {!closed && <Button onClick={() => setModal({ type: 'interview' })}><CalendarClock size={16} strokeWidth={1.5} /> Planifier un entretien</Button>}
                </div>
                {fiche.interviews.map((i) => (
                  <Card key={i.id}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[var(--text)]">Entretien n°{i.round} — {KIND_LABEL[i.kind] ?? i.kind}</p>
                        <p className="mt-1 text-sm text-[var(--text-secondary)]">
                          {fmtDate(i.scheduledAt)} à {fmtTime(i.scheduledAt)} · {i.durationMin} min · {MODE_LABEL[i.mode] ?? i.mode}
                          {i.location ? ` · ${i.location}` : ''}
                        </p>
                        {i.meetingUrl && <a className="text-sm text-[var(--brand-strong)] underline" href={i.meetingUrl} target="_blank" rel="noreferrer">Lien de connexion</a>}
                        {i.interviewers && <p className="mt-1 text-sm text-[var(--text-secondary)]">Avec : {i.interviewers}</p>}
                      </div>
                      <Badge tone={i.status === 'DONE' ? 'success' : i.status === 'SCHEDULED' ? 'info' : 'danger'}>
                        {i.status === 'DONE' ? 'Évalué' : i.status === 'SCHEDULED' ? (new Date(i.scheduledAt).getTime() < Date.now() ? 'À évaluer' : 'Planifié') : i.status === 'NO_SHOW' ? 'Absent' : 'Annulé'}
                      </Badge>
                    </div>

                    {i.status === 'DONE' && i.criteria && (
                      <div className="mt-4 space-y-3 border-t border-[var(--border)] pt-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-2xl font-semibold tabular-nums text-[var(--text)]">{i.overallScore}/100</span>
                          {i.recommendation && <Badge tone={RECO_TONE[i.recommendation] ?? 'neutral'}>{RECO_LABEL[i.recommendation]}</Badge>}
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {i.criteria.map((k, idx) => (
                            <div key={idx}>
                              <ScoreBar label={k.label} value={k.score * 20} />
                              {k.comment && <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{k.comment}</p>}
                            </div>
                          ))}
                        </div>
                        {i.summary && <p className="whitespace-pre-line rounded-xl bg-[var(--surface-2)] p-3 text-sm text-[var(--text)]">{i.summary}</p>}
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      {(i.status === 'SCHEDULED' || i.status === 'DONE') && <Button variant={i.status === 'SCHEDULED' ? 'primary' : 'secondary'} onClick={() => setModal({ type: 'feedback', interview: i })}>{i.status === 'DONE' ? 'Modifier l’évaluation' : 'Évaluer'}</Button>}
                      {i.status === 'SCHEDULED' && <Button variant="secondary" onClick={() => setModal({ type: 'reschedule', interview: i })}>Reporter / modifier</Button>}
                      {i.status === 'SCHEDULED' && <Button variant="ghost" onClick={() => interviewAction(i, 'NO_SHOW')}>Absent</Button>}
                      {i.status === 'SCHEDULED' && <Button variant="ghost" onClick={() => interviewAction(i, 'CANCELLED')}>Annuler</Button>}
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Offre */}
            {tab === 'offer' && (
              c.offerSentAt ? (
                <Card title="Offre d’embauche">
                  <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div><dt className="text-xs text-[var(--text-secondary)]">Salaire mensuel proposé</dt><dd className="text-lg font-semibold text-[var(--text)]">{fmtMoney(c.offerSalary, job.salaryCurrency ?? 'XAF')}</dd></div>
                    <div><dt className="text-xs text-[var(--text-secondary)]">Début souhaité</dt><dd className="text-lg font-semibold text-[var(--text)]">{c.offerStartDate ? fmtDate(c.offerStartDate) : 'Non précisé'}</dd></div>
                    <div><dt className="text-xs text-[var(--text-secondary)]">Réponse</dt><dd className="mt-1">{c.offerAcceptedAt ? <Badge tone="success">Acceptée le {fmtDate(c.offerAcceptedAt)}</Badge> : c.offerDeclinedAt ? <Badge tone="danger">Déclinée le {fmtDate(c.offerDeclinedAt)}</Badge> : <Badge tone="warning">En attente depuis le {fmtDate(c.offerSentAt)}</Badge>}</dd></div>
                  </dl>
                  {(job.salaryMin || job.salaryMax) && (
                    <p className="mt-4 text-sm text-[var(--text-secondary)]">Fourchette de l’offre : {fmtMoney(job.salaryMin, job.salaryCurrency ?? 'XAF')} – {fmtMoney(job.salaryMax, job.salaryCurrency ?? 'XAF')}</p>
                  )}
                  {!closed && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {offerPending && <><Button onClick={() => offerResponse(true)}>Le candidat accepte</Button><Button variant="secondary" onClick={() => offerResponse(false)}>Le candidat décline</Button></>}
                      <Button variant="secondary" onClick={() => setModal({ type: 'offer' })}>Modifier / renvoyer l’offre</Button>
                      {c.offerAcceptedAt && <Button onClick={() => setModal({ type: 'hire' })}>Embaucher</Button>}
                    </div>
                  )}
                </Card>
              ) : (
                <EmptyState title="Aucune offre envoyée" icon={Banknote}
                  action={!closed ? <Button onClick={() => setModal({ type: 'offer' })}>Faire une offre</Button> : undefined}>
                  Indiquez le salaire et la date de début : l’offre est suivie ici jusqu’à la réponse du candidat, puis l’embauche en un clic.
                </EmptyState>
              )
            )}
          </div>
        </div>
      </div>

      {modal?.type === 'reject' && <RejectModal candidate={person} onClose={() => setModal(null)} onDone={done} />}
      {modal?.type === 'interview' && <InterviewModal candidate={person} onClose={() => setModal(null)} onDone={() => { setTab('interviews'); done(); }} />}
      {modal?.type === 'reschedule' && <InterviewModal candidate={person} interview={modal.interview} onClose={() => setModal(null)} onDone={done} />}
      {modal?.type === 'feedback' && <FeedbackModal interview={modal.interview} candidateName={`${c.firstName} ${c.lastName}`} onClose={() => setModal(null)} onDone={done} />}
      {modal?.type === 'offer' && (
        <OfferModal candidate={person} currency={job.salaryCurrency ?? 'XAF'}
          defaultSalary={c.offerSalary ? Number(c.offerSalary) : job.salaryMin ? Number(job.salaryMin) : null}
          defaultStart={c.offerStartDate} onClose={() => setModal(null)} onDone={() => { setTab('offer'); done(); }} />
      )}
      {modal?.type === 'hire' && (
        <HireModal candidate={person} jobDepartmentId={job.departmentId} defaultStart={c.offerStartDate}
          onClose={() => { setModal(null); void load(); }} onDone={done} onCloseJob={openCloseJob} />
      )}
      {modal?.type === 'email' && <EmailModal candidate={person} onClose={() => setModal(null)} onDone={done} />}
      {modal?.type === 'close' && <CloseJobModal job={{ id: job.id, title: job.title }} activeCandidates={modal.active} onClose={() => setModal(null)} onDone={done} />}
      {modal?.type === 'reapply' && <ReapplyModal candidateId={c.id} currentJobId={job.id} onClose={() => setModal(null)} onDone={(newId) => { setModal(null); router.push(`/recrutement/candidat/${newId}`); }} />}
    </ModulePageFrame>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Proposer ce candidat pour une autre offre (vivier)
// ─────────────────────────────────────────────────────────────────────────────
function ReapplyModal({ candidateId, currentJobId, onClose, onDone }: {
  candidateId: string; currentJobId: string; onClose: () => void; onDone: (newCandidateId: string) => void;
}) {
  const notify = useToast();
  const [jobs, setJobs] = useState<Array<{ id: string; title: string; status: string; processingMode: string }>>([]);
  const [jobId, setJobId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<Array<{ id: string; title: string; status: string; processingMode: string }>>('/recruitment/jobs-overview')
      .then((j) => setJobs((j ?? []).filter((x) => x.status === 'PUBLISHED' && x.id !== currentJobId && x.processingMode !== 'AI_ASSISTED')))
      .catch(() => setJobs([]));
  }, [currentJobId]);

  const submit = async () => {
    if (!jobId) return notify('error', 'Choisissez une offre');
    setSaving(true);
    try {
      const r = await api.post<{ id: string }>(`/recruitment/candidates/${candidateId}/reapply`, { jobOfferId: jobId });
      notify('success', 'Candidature créée sur la nouvelle offre');
      onDone(r.id);
    } catch (e) {
      notify('error', errMsg(e));
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Proposer pour une autre offre"
      actions={<><Button variant="secondary" onClick={onClose}>Annuler</Button><Button onClick={submit} loading={saving}>Créer la candidature</Button></>}>
      <div className="space-y-4">
        <p className="text-sm text-[var(--text-secondary)]">Le dossier (coordonnées, CV) est copié sur l’offre choisie, au stade « à traiter ». Les offres en mode IA ne sont pas proposées (test obligatoire).</p>
        <Select label="Offre" value={jobId} onChange={(e) => setJobId(e.target.value)}>
          <option value="">Choisir une offre publiée</option>
          {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
        </Select>
      </div>
    </Modal>
  );
}
