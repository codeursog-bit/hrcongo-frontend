'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Mail, Phone, Calendar, Download,
  CheckCircle2, XCircle, AlertTriangle, BrainCircuit, Sparkles,
  TrendingUp, Award, Target, Zap, FileText, MapPin, Briefcase,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/services/api';
import { ToastProvider, useToast } from '@/components/ui/useToast';
import { KonzaLoader } from '@/components/ui/KonzaLoader';
import { Badge, Button, Card, EmptyState, Input, Textarea } from '@/components/design-system/primitives';
import { Modal } from '@/components/design-system/feedback';
import { RecruitmentDetailPage as DetailPage } from '@/components/recruitment/RecruitmentFrame';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

type AIDecision = 'RETENU' | 'MOYENNE' | 'SECONDE_CHANCE' | 'REFUS';

interface CandidateIA {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  resumeUrl: string;
  additionalDocUrl?: string;
  coverLetter?: string;
  aiSuggestion: AIDecision;
  hrDecision?: AIDecision;
  hrNotes?: string;
  totalScore: number;
  cvScore: number;
  testScore: number;
  aiReasoning?: string;
  cvAnalysis?: { strengths: string[]; weaknesses: string[] };
  tabSwitchCount?: number;
  suspiciousActivity?: boolean;
  status: string;
  interviewDate?: string;
  interviewNotes?: string;
  jobOffer: {
    id: string;
    status?: string;
    title: string;
    location: string;
    type: string;
    department: { name: string };
  };
  createdAt: string;
}

const DECISION_CONFIG: Record<AIDecision, { label: string; tone: 'success' | 'warning' | 'neutral' | 'danger'; icon: React.ElementType }> = {
  RETENU:        { label: 'Retenu',         tone: 'success', icon: Award },
  MOYENNE:       { label: 'Moyen',          tone: 'warning', icon: TrendingUp },
  SECONDE_CHANCE:{ label: 'Seconde Chance', tone: 'neutral', icon: Target },
  REFUS:         { label: 'Refusé',         tone: 'danger', icon: XCircle },
};

// ─────────────────────────────────────────────
// INNER COMPONENT
// ─────────────────────────────────────────────

function DetailCandidatIAContent({ id }: { id: string }) {
  const router = useRouter();
  const toast = useToast();

  const [candidate, setCandidate] = useState<CandidateIA | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hrDecision, setHrDecision] = useState<AIDecision | null>(null);
  const [hrNotes, setHrNotes] = useState('');
  const [isSavingDecision, setIsSavingDecision] = useState(false);
  const [testUrl, setTestUrl] = useState('');
  const [creatingTestAccess, setCreatingTestAccess] = useState(false);

  const renewTestAccess = async () => {
    setCreatingTestAccess(true);
    try {
      const result = await api.put<{ testUrl: string }>(`/recruitment/candidates/${id}/allow-retake`, { reason: 'Nouvel accès accordé par le recruteur' });
      setTestUrl(new URL(result.testUrl, window.location.origin).toString());
      await fetchCandidate();
      toast.success('Accès créé', 'Le nouveau lien est prêt à être transmis au candidat.');
    } catch (error) {
      toast.error('Accès non créé', error instanceof Error ? error.message : 'Réessayez.');
    } finally { setCreatingTestAccess(false); }
  };

  // Modal entretien
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);

  useEffect(() => { fetchCandidate(); }, [id]);

  const fetchCandidate = async () => {
    try {
      const data = await api.get<CandidateIA>(`/recruitment/candidates/${id}`);
      setCandidate(data);
      if (data.hrDecision) { setHrDecision(data.hrDecision); setHrNotes(data.hrNotes || ''); }
      if (data.interviewDate) {
        setInterviewDate(new Date(data.interviewDate).toISOString().slice(0, 16));
        setInterviewNotes(data.interviewNotes || '');
      }
    } catch {
      toast.error('Erreur', 'Impossible de charger le candidat');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDecision = async () => {
    if (!hrDecision) { toast.warning('Attention', 'Choisissez une décision avant de valider'); return; }
    setIsSavingDecision(true);
    try {
      await api.patch(`/recruitment/candidates/${id}/hr-decision`, { hrDecision, hrNotes });
      toast.success('Décision enregistrée !', 'La décision RH a été sauvegardée avec succès.');
      fetchCandidate();
    } catch (e: any) {
      toast.error('Erreur', e?.message || 'Une erreur est survenue');
    } finally {
      setIsSavingDecision(false);
    }
  };

  const handleScheduleInterview = async () => {
    setIsScheduling(true);
    try {
      await api.patch(`/recruitment/candidates/${id}/schedule-interview`, {
        interviewDate: interviewDate || undefined,
        interviewNotes: interviewNotes || undefined,
      });
      toast.success('Entretien planifié !', 'Un email d\'invitation a été envoyé au candidat.');
      setShowInterviewModal(false);
      fetchCandidate();
    } catch (e: any) {
      toast.error('Erreur', e?.message || 'Impossible de planifier l\'entretien');
    } finally {
      setIsScheduling(false);
    }
  };

  if (isLoading) {
    return <DetailPage title="Dossier candidat"><KonzaLoader variant="page" label="Chargement du candidat…" /></DetailPage>;
  }

  if (!candidate) {
    return (
      <DetailPage title="Dossier candidat" action={<Link className="k-button k-button-secondary" href="/recrutement/ia/candidats">Retour au pipeline</Link>}>
        <Card>
          <EmptyState
            title="Candidat introuvable"
            icon={XCircle}
            action={<Link className="k-button k-button-secondary" href="/recrutement/ia/candidats">Retour au pipeline</Link>}
          >
            Ce dossier n’est pas disponible.
          </EmptyState>
        </Card>
      </DetailPage>
    );
  }

  const aiConfig = DECISION_CONFIG[candidate.aiSuggestion];
  const AIIcon = aiConfig.icon;
  const hasOverride = candidate.hrDecision && candidate.hrDecision !== candidate.aiSuggestion;
  const isInInterview = candidate.status === 'INTERVIEW';

  return (
    <>
      <Modal
        open={showInterviewModal}
        onClose={() => setShowInterviewModal(false)}
        title={isInInterview ? 'Modifier l’entretien' : 'Planifier un entretien'}
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowInterviewModal(false)}>Annuler</Button>
            <Button onClick={handleScheduleInterview} loading={isScheduling}>
              <Calendar size={16} strokeWidth={1.5} aria-hidden="true" /> Confirmer
            </Button>
          </>
        }
      >
        <p>Pour <strong className="text-[var(--text)]">{candidate.firstName} {candidate.lastName}</strong></p>
        <div className="mt-5 grid gap-4">
          <Input
            label="Date et heure"
            type="datetime-local"
            value={interviewDate}
            onChange={(e) => setInterviewDate(e.target.value)}
          />
          <Textarea
            label="Notes (lieu, modalités…)"
            placeholder="Ex : Entretien en présentiel, bâtiment A, 2e étage…"
            value={interviewNotes}
            onChange={(e) => setInterviewNotes(e.target.value)}
            rows={3}
          />
        </div>
      </Modal>

      <DetailPage
        title={`${candidate.firstName} ${candidate.lastName}`}
        description={`Postulé le ${new Date(candidate.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`}
        action={
          <Button variant="secondary" onClick={() => router.back()} aria-label="Retour à la page précédente">
            <ArrowLeft size={17} strokeWidth={1.5} aria-hidden="true" /> Retour
          </Button>
        }
        status={
          <div className="flex flex-wrap gap-2">
            <Badge tone={aiConfig.tone}><BrainCircuit size={13} strokeWidth={1.5} aria-hidden="true" /> Analyse IA · {aiConfig.label}</Badge>
            {isInInterview && <Badge tone="warning"><Calendar size={13} strokeWidth={1.5} aria-hidden="true" /> En entretien</Badge>}
          </div>
        }
        aside={
          <Card className="text-center">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-[var(--brand-soft)] text-xl font-semibold text-[var(--text)]" aria-hidden="true">
              {candidate.firstName?.[0] || ''}{candidate.lastName?.[0] || ''}
            </div>
            <h2 className="text-lg font-semibold text-[var(--text)]">{candidate.firstName} {candidate.lastName}</h2>
            <div className="mt-3"><Badge tone={aiConfig.tone}><AIIcon size={14} strokeWidth={1.5} aria-hidden="true" /> {aiConfig.label}</Badge></div>

            <section aria-label="Scores du candidat" className="my-5 rounded-[var(--radius-card)] bg-[var(--surface-2)] p-5">
              <p className="text-xs font-semibold text-[var(--text-muted)]">Score total</p>
              <p className="mt-1 text-4xl font-semibold tabular-nums text-[var(--text)]">{candidate.totalScore}<span className="text-base text-[var(--text-muted)]">/100</span></p>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-left">
                <div className="rounded-[var(--radius-control)] bg-[var(--surface)] p-3">
                  <dt className="text-xs text-[var(--text-muted)]">CV</dt>
                  <dd className="mt-1 font-semibold tabular-nums text-[var(--text)]">{candidate.cvScore}<span className="text-xs text-[var(--text-muted)]">/35</span></dd>
                </div>
                <div className="rounded-[var(--radius-control)] bg-[var(--surface)] p-3">
                  <dt className="text-xs text-[var(--text-muted)]">Test</dt>
                  <dd className="mt-1 font-semibold tabular-nums text-[var(--text)]">{candidate.testScore}<span className="text-xs text-[var(--text-muted)]">/65</span></dd>
                </div>
              </dl>
            </section>

            {candidate.interviewDate && (
              <div className="mb-5 rounded-[var(--radius-control)] bg-[var(--surface-2)] p-4 text-left">
                <p className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-[var(--mustard)]">
                  <Calendar size={14} strokeWidth={1.5} aria-hidden="true" /> Entretien planifié
                </p>
                <p className="text-sm font-medium text-[var(--text)]">
                  {new Date(candidate.interviewDate).toLocaleDateString('fr-FR', {
                    weekday: 'short', day: 'numeric', month: 'short',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
                {candidate.interviewNotes && <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">{candidate.interviewNotes}</p>}
              </div>
            )}

            <div className="mb-5 grid gap-3 text-left">
              <a href={`mailto:${candidate.email}`} className="flex min-w-0 items-center gap-3 text-sm text-[var(--text-muted)] hover:text-[var(--brand-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand)]">
                <Mail size={15} strokeWidth={1.5} className="shrink-0" aria-hidden="true" />
                <span className="break-all">{candidate.email}</span>
              </a>
              <a href={`tel:${candidate.phone}`} className="flex items-center gap-3 text-sm text-[var(--text-muted)] hover:text-[var(--brand-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand)]">
                <Phone size={15} strokeWidth={1.5} className="shrink-0" aria-hidden="true" />
                <span>{candidate.phone}</span>
              </a>
            </div>

            <Button className="mb-2 w-full" variant="secondary" onClick={() => setShowInterviewModal(true)}>
              <Calendar size={16} strokeWidth={1.5} aria-hidden="true" />
              {isInInterview ? 'Modifier l’entretien' : 'Planifier un entretien'}
            </Button>

            <div className="grid gap-2 border-t border-[var(--border)] pt-4">
              <p className="text-left text-xs font-semibold text-[var(--text-muted)]">Documents</p>
              <a
                href={candidate.resumeUrl.replace('/raw/upload/', '/raw/upload/fl_attachment/')}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="k-button k-button-secondary w-full"
              >
                <Download size={15} strokeWidth={1.5} aria-hidden="true" /> Télécharger le CV
              </a>
              {candidate.additionalDocUrl && (
                <a
                  href={candidate.additionalDocUrl.replace('/raw/upload/', '/raw/upload/fl_attachment/')}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="k-button k-button-secondary w-full"
                >
                  <Download size={15} strokeWidth={1.5} aria-hidden="true" /> Télécharger le document joint
                </a>
              )}
            </div>
          </Card>
        }
      >
        {candidate.jobOffer.status === 'PUBLISHED' && (
          <Card title="Accès au test candidat">
            <p className="mb-4 text-sm leading-relaxed text-[var(--text-muted)]">Un nouveau lien remplace le précédent et remet les réponses et le score du test à zéro. Il est valable 24 heures.</p>
            <Button onClick={renewTestAccess} loading={creatingTestAccess}>
              {creatingTestAccess ? 'Création…' : 'Réinitialiser le test et créer un lien'}
            </Button>
            {testUrl && (
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
                <Input label="Lien du test à transmettre au candidat" readOnly value={testUrl} />
                <Button variant="secondary" className="shrink-0" onClick={async () => {
                  try { await navigator.clipboard.writeText(testUrl); toast.success('Lien copié', 'Vous pouvez le transmettre au candidat.'); }
                  catch { toast.error('Copie indisponible', 'Sélectionnez le lien et copiez-le manuellement.'); }
                }}>Copier</Button>
              </div>
            )}
          </Card>
        )}

        <Card title="Poste visé">
          <p className="mb-4 text-lg font-semibold text-[var(--text)]">{candidate.jobOffer.title}</p>
          <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm text-[var(--text-muted)]">
            <span className="inline-flex items-center gap-2"><Briefcase size={15} strokeWidth={1.5} aria-hidden="true" /> {candidate.jobOffer.department?.name ?? 'Sans département'}</span>
            <span className="inline-flex items-center gap-2"><MapPin size={15} strokeWidth={1.5} aria-hidden="true" /> {candidate.jobOffer.location}</span>
            <span className="inline-flex items-center gap-2"><FileText size={15} strokeWidth={1.5} aria-hidden="true" /> {candidate.jobOffer.type}</span>
          </div>
        </Card>

        <Card title="Analyse IA">
          {candidate.aiReasoning && (
            <section className="mb-5">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                <Sparkles size={15} strokeWidth={1.5} aria-hidden="true" /> Raisonnement IA
              </h3>
              <p className="text-sm leading-relaxed text-[var(--text-muted)]">{candidate.aiReasoning}</p>
            </section>
          )}

          {candidate.cvAnalysis && (
            <div className="grid gap-5 md:grid-cols-2">
              <section>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--green)]">
                  <CheckCircle2 size={15} strokeWidth={1.5} aria-hidden="true" /> Points forts
                </h3>
                <ul className="grid gap-2">
                  {candidate.cvAnalysis.strengths?.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-[var(--text-muted)]">
                      <Zap size={14} strokeWidth={1.5} className="mt-0.5 shrink-0 text-[var(--green)]" aria-hidden="true" />{s}
                    </li>
                  ))}
                </ul>
              </section>
              <section>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--danger)]">
                  <XCircle size={15} strokeWidth={1.5} aria-hidden="true" /> Points faibles
                </h3>
                <ul className="grid gap-2">
                  {candidate.cvAnalysis.weaknesses?.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-[var(--text-muted)]">
                      <AlertTriangle size={14} strokeWidth={1.5} className="mt-0.5 shrink-0 text-[var(--danger)]" aria-hidden="true" />{w}
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          )}

          {((candidate.tabSwitchCount ?? 0) > 0 || candidate.suspiciousActivity) && (
            <section className="mt-5 rounded-[var(--radius-control)] bg-[color-mix(in_srgb,var(--mustard)_14%,transparent)] p-4" aria-label="Activité détectée">
              <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-[var(--mustard)]">
                <AlertTriangle size={16} strokeWidth={1.5} aria-hidden="true" /> Activité suspecte détectée
              </h3>
              <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                {(candidate.tabSwitchCount ?? 0) > 0 && `${candidate.tabSwitchCount} changement(s) d'onglet pendant le test. `}
                {candidate.suspiciousActivity && 'Comportement anormal détecté.'}
              </p>
            </section>
          )}
        </Card>

        <Card title="Décision RH">
          {hasOverride && (
            <div className="mb-5 flex items-start gap-2 rounded-[var(--radius-control)] bg-[color-mix(in_srgb,var(--mustard)_14%,transparent)] p-4">
              <AlertTriangle size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-[var(--mustard)]" aria-hidden="true" />
              <p className="text-sm font-medium text-[var(--text)]">Override actif : {candidate.aiSuggestion} → {candidate.hrDecision}</p>
            </div>
          )}

          <fieldset>
            <legend className="mb-3 text-sm font-semibold text-[var(--text)]">Choisir une décision</legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {(Object.entries(DECISION_CONFIG) as [AIDecision, typeof DECISION_CONFIG[AIDecision]][]).map(([key, config]) => {
                const Icon = config.icon;
                const isActive = hrDecision === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setHrDecision(key)}
                    aria-pressed={isActive}
                    className={`k-button k-button-secondary min-h-12 justify-start ${isActive ? 'ring-2 ring-[var(--brand)]' : ''}`}
                  >
                    <Icon size={16} strokeWidth={1.5} className={config.tone === 'success' ? 'text-[var(--green)]' : config.tone === 'warning' ? 'text-[var(--mustard)]' : config.tone === 'danger' ? 'text-[var(--danger)]' : 'text-[var(--text-muted)]'} aria-hidden="true" />
                    {config.label}
                    {isActive && <CheckCircle2 size={15} className="ml-auto text-[var(--brand-strong)]" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-5">
            <Textarea
              label="Notes RH (facultatif)"
              placeholder="Notes RH (facultatif)…"
              value={hrNotes}
              onChange={(e) => setHrNotes(e.target.value)}
              rows={4}
            />
          </div>
          <Button className="mt-4" onClick={handleSaveDecision} disabled={!hrDecision} loading={isSavingDecision}>
            <CheckCircle2 size={16} strokeWidth={1.5} aria-hidden="true" /> Valider la décision RH
          </Button>
        </Card>

        {candidate.coverLetter && (
          <Card title="Lettre de motivation">
            <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--text-muted)]">{candidate.coverLetter}</p>
          </Card>
        )}
      </DetailPage>
    </>
  );
}

// ─────────────────────────────────────────────
// EXPORT — ToastProvider local à cette page
// ─────────────────────────────────────────────

export default function DetailCandidatIAPage({ params }: { params: { id: string } }) {
  return (
    <ToastProvider>
      <DetailCandidatIAContent id={params.id} />
    </ToastProvider>
  );
}
