'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Mail, Phone, Calendar, Download,
  CheckCircle2, XCircle, FileText, MapPin, Briefcase, User,
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

interface CandidateManual {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  resumeUrl: string;
  additionalDocUrl?: string;
  coverLetter?: string;
  status: string;
  notes?: string;
  interviewDate?: string;
  interviewNotes?: string;
  jobOffer: {
    id: string;
    title: string;
    location: string;
    type: string;
    department: { name: string };
  };
  createdAt: string;
}

// Statuts sélectionnables (simplifiés)
const STATUSES: { value: string; label: string; color: string; icon: React.ElementType }[] = [
  { value: 'APPLIED',   label: 'Nouvelle candidature', color: 'text-[var(--brand-strong)]', icon: User },
  { value: 'INTERVIEW', label: 'En entretien',         color: 'text-[var(--mustard)]', icon: Calendar },
  { value: 'HIRED',     label: 'Embauché(e)',          color: 'text-[var(--green)]', icon: CheckCircle2 },
  { value: 'REJECTED',  label: 'Refusé(e)',            color: 'text-[var(--text-muted)]', icon: XCircle },
];

const getStatusConfig = (status: string) =>
  STATUSES.find((s) => s.value === status) || STATUSES[0];

// Normalise les anciens statuts
const normalizeStatus = (s: string) => {
  if (['APPLIED', 'INTERVIEW', 'HIRED', 'REJECTED'].includes(s)) return s;
  if (s === 'REFUSE') return 'REJECTED';
  return 'APPLIED';
};

// ─────────────────────────────────────────────
// INNER COMPONENT
// ─────────────────────────────────────────────

function DetailCandidatManualContent({ id }: { id: string }) {
  const router = useRouter();
  const toast = useToast();

  const [candidate, setCandidate] = useState<CandidateManual | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Modal entretien
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);

  const fetchCandidate = useCallback(async () => {
    try {
      const data = await api.get<CandidateManual>(`/recruitment/candidates/${id}`);
      setCandidate(data);
      setNotes(data.notes || '');
      if (data.interviewDate) {
        setInterviewDate(new Date(data.interviewDate).toISOString().slice(0, 16));
        setInterviewNotes(data.interviewNotes || '');
      }
    } catch {
      toast.error('Erreur', 'Impossible de charger le candidat');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchCandidate(); }, [fetchCandidate]);

  const handleStatusChange = async (newStatus: string) => {
    // Si on passe en entretien → ouvrir le modal de planification
    if (newStatus === 'INTERVIEW') {
      setShowInterviewModal(true);
      return;
    }
    try {
      await api.patch(`/recruitment/candidates/${id}/status`, { status: newStatus });
      setCandidate((prev) => prev ? { ...prev, status: newStatus } : null);
      const config = getStatusConfig(newStatus);
      toast.success('Statut mis à jour', `Candidat passé en "${config.label}"`);
    } catch {
      toast.error('Erreur', 'Impossible de mettre à jour le statut');
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

  const handleSaveNotes = async () => {
    if (!candidate) return;
    setIsSavingNotes(true);
    try {
      await api.patch(`/recruitment/candidates/${id}/status`, {
        status: candidate.status,
        notes,
      });
      toast.success('Notes sauvegardées', 'Les notes RH ont été mises à jour.');
    } catch {
      toast.error('Erreur', 'Impossible de sauvegarder les notes');
    } finally {
      setIsSavingNotes(false);
    }
  };

  if (isLoading) {
    return (
      <DetailPage title="Dossier candidat">
        <KonzaLoader variant="page" label="Chargement du candidat…" />
      </DetailPage>
    );
  }

  if (!candidate) {
    return (
      <DetailPage title="Dossier candidat" action={<Link className="k-button k-button-secondary" href="/recrutement/manuel/candidats">Retour</Link>}>
        <Card>
          <EmptyState
            title="Candidat introuvable"
            icon={XCircle}
            action={<Link className="k-button k-button-secondary" href="/recrutement/manuel/candidats">Retour aux candidatures</Link>}
          >
            Ce dossier n’est pas disponible.
          </EmptyState>
        </Card>
      </DetailPage>
    );
  }

  const normalizedStatus = normalizeStatus(candidate.status);
  const statusConfig = getStatusConfig(normalizedStatus);
  const StatusIcon = statusConfig.icon;
  const isInInterview = normalizedStatus === 'INTERVIEW';
  const statusTone = normalizedStatus === 'HIRED'
    ? 'success'
    : normalizedStatus === 'INTERVIEW'
      ? 'warning'
      : normalizedStatus === 'REJECTED'
        ? 'neutral'
        : 'info';

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
            placeholder="Ex : Entretien présentiel, bâtiment A…"
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
        status={<Badge tone={statusTone}><StatusIcon size={13} strokeWidth={1.5} aria-hidden="true" /> {statusConfig.label}</Badge>}
        aside={
          <Card className="text-center">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-[var(--brand-soft)] text-xl font-semibold text-[var(--text)]" aria-hidden="true">
              {candidate.firstName?.[0] || ''}{candidate.lastName?.[0] || ''}
            </div>
            <h2 className="text-lg font-semibold text-[var(--text)]">{candidate.firstName} {candidate.lastName}</h2>
            <Badge tone={statusTone}><StatusIcon size={13} strokeWidth={1.5} aria-hidden="true" /> {statusConfig.label}</Badge>

            {candidate.interviewDate && (
              <div className="my-5 rounded-[var(--radius-control)] bg-[var(--surface-2)] p-4 text-left">
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

            <fieldset className="mb-5 text-left">
              <legend className="mb-2 text-xs font-semibold text-[var(--text-muted)]">Changer le statut</legend>
              <div className="grid gap-2">
                {STATUSES.map((s) => {
                  const SIcon = s.icon;
                  const isActive = normalizedStatus === s.value;
                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => handleStatusChange(s.value)}
                      aria-pressed={isActive}
                      className={`k-button k-button-secondary w-full justify-start ${s.color} ${isActive ? 'ring-2 ring-[var(--brand)]' : ''}`}
                    >
                      <SIcon size={15} strokeWidth={1.5} aria-hidden="true" />
                      {s.label}
                      {isActive && <CheckCircle2 size={15} className="ml-auto" aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            </fieldset>

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
        <Card title="Poste visé">
          <p className="mb-4 text-lg font-semibold text-[var(--text)]">{candidate.jobOffer.title}</p>
          <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm text-[var(--text-muted)]">
            <span className="inline-flex items-center gap-2"><Briefcase size={15} strokeWidth={1.5} aria-hidden="true" /> {candidate.jobOffer.department?.name ?? 'Sans département'}</span>
            <span className="inline-flex items-center gap-2"><MapPin size={15} strokeWidth={1.5} aria-hidden="true" /> {candidate.jobOffer.location}</span>
            <span className="inline-flex items-center gap-2"><FileText size={15} strokeWidth={1.5} aria-hidden="true" /> {candidate.jobOffer.type}</span>
          </div>
        </Card>

        {candidate.coverLetter && (
          <Card title="Lettre de motivation">
            <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--text-muted)]">{candidate.coverLetter}</p>
          </Card>
        )}

        <Card title="Notes RH">
          <Textarea
            label="Observations sur ce candidat"
            placeholder="Ajoutez vos observations sur ce candidat…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
          />
          <Button className="mt-4" onClick={handleSaveNotes} loading={isSavingNotes}>
            <CheckCircle2 size={16} strokeWidth={1.5} aria-hidden="true" /> Sauvegarder les notes
          </Button>
        </Card>
      </DetailPage>
    </>
  );
}

// ─────────────────────────────────────────────
// EXPORT — ToastProvider local à cette page
// ─────────────────────────────────────────────

export default function DetailCandidatManualPage({ params }: { params: { id: string } }) {
  return (
    <ToastProvider>
      <DetailCandidatManualContent id={params.id} />
    </ToastProvider>
  );
}