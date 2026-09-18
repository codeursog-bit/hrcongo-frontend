'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Mail, Phone, Calendar, Download, Loader2,
  CheckCircle2, XCircle, FileText, MapPin, Briefcase, MessageSquare, User,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/services/api';
import { ToastProvider, useToast } from '@/components/ui/useToast';

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
  { value: 'APPLIED',   label: 'Nouvelle candidature', color: 'text-emerald-600 dark:text-emerald-400',   icon: User },
  { value: 'INTERVIEW', label: 'En entretien',         color: 'text-amber-600 dark:text-amber-400', icon: Calendar },
  { value: 'HIRED',     label: 'Embauché(e)',          color: 'text-emerald-600 dark:text-emerald-400', icon: CheckCircle2 },
  { value: 'REJECTED',  label: 'Refusé(e)',            color: 'text-red-500 dark:text-red-400',      icon: XCircle },
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

  // ── LOADING ──
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-emerald-500 mx-auto" size={36} />
          <p className="text-[var(--text-muted)] mt-3 text-sm">Chargement du candidat…</p>
        </div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <XCircle size={48} className="text-red-400 mb-4" />
        <h1 className="text-xl font-bold text-[var(--text)] mb-4">Candidat introuvable</h1>
        <Link href="/recrutement/manuel/candidats" className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold">
          Retour
        </Link>
      </div>
    );
  }

  const normalizedStatus = normalizeStatus(candidate.status);
  const statusConfig = getStatusConfig(normalizedStatus);
  const StatusIcon = statusConfig.icon;
  const isInInterview = normalizedStatus === 'INTERVIEW';

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">

      {/* ── MODAL ENTRETIEN ── */}
      {showInterviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[var(--surface)] border border-amber-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl"
          >
            <h3 className="text-lg font-bold text-[var(--text)] mb-1 flex items-center gap-2.5">
              <Calendar className="text-amber-500" size={22} />
              {isInInterview ? 'Modifier l\'entretien' : 'Planifier un entretien'}
            </h3>
            <p className="text-[var(--text-muted)] text-sm mb-6">
              Pour <span className="font-medium text-[var(--text)]">{candidate.firstName} {candidate.lastName}</span>
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm font-bold text-[var(--text-muted)] mb-2 block">Date et heure</label>
                <input
                  type="datetime-local"
                  className="w-full border border-[var(--border)] bg-[var(--surface-2)] rounded-xl px-4 py-3 text-[var(--text)] focus:ring-2 focus:ring-amber-500/30 outline-none transition-all"
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-bold text-[var(--text-muted)] mb-2 block">Notes (lieu, modalités…)</label>
                <textarea
                  className="w-full border border-[var(--border)] bg-[var(--surface-2)] rounded-xl px-4 py-3 text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none focus:ring-2 focus:ring-amber-500/30 resize-none min-h-[80px] transition-all text-sm"
                  placeholder="Ex : Entretien présentiel, bâtiment A…"
                  value={interviewNotes}
                  onChange={(e) => setInterviewNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowInterviewModal(false)}
                className="flex-1 py-3 bg-[var(--surface-2)] text-[var(--text-muted)] rounded-xl font-bold transition-colors hover:bg-[var(--border)]"
              >
                Annuler
              </button>
              <button
                onClick={handleScheduleInterview}
                disabled={isScheduling}
                className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-lg"
              >
                {isScheduling ? <Loader2 className="animate-spin" size={18} /> : <Calendar size={18} />}
                Confirmer
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.back()}
          className="p-2.5 bg-[var(--surface)] rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-[var(--text)]">
              {candidate.firstName} {candidate.lastName}
            </h1>
            {isInInterview && (
              <div className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-1.5">
                <Calendar size={12} className="text-amber-500" />
                <span className="text-xs font-bold text-amber-500">En entretien</span>
              </div>
            )}
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            Postulé le {new Date(candidate.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── SIDEBAR ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-1">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-7 shadow-xl text-center sticky top-8">

            {/* Avatar */}
            <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-lg">
              {candidate.firstName[0]}{candidate.lastName[0]}
            </div>
            <h2 className="text-xl font-bold text-[var(--text)] mb-1">
              {candidate.firstName} {candidate.lastName}
            </h2>

            {/* Badge statut */}
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-[var(--surface-2)] border-[var(--border)] font-bold text-sm mt-3 mb-5 ${statusConfig.color}`}>
              <StatusIcon size={14} />
              {statusConfig.label}
            </div>

            {/* Entretien planifié */}
            {candidate.interviewDate && (
              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-4 mb-5 text-left">
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-1.5 flex items-center gap-1.5">
                  <Calendar size={11} /> Entretien planifié
                </p>
                <p className="text-sm text-[var(--text)] font-medium">
                  {new Date(candidate.interviewDate).toLocaleDateString('fr-FR', {
                    weekday: 'short', day: 'numeric', month: 'short',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
                {candidate.interviewNotes && (
                  <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">{candidate.interviewNotes}</p>
                )}
              </div>
            )}

            {/* Changer statut */}
            <div className="mb-5 text-left">
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Changer le statut</label>
              <div className="space-y-1.5">
                {STATUSES.map((s) => {
                  const SIcon = s.icon;
                  const isActive = normalizedStatus === s.value;
                  return (
                    <button
                      key={s.value}
                      onClick={() => handleStatusChange(s.value)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                        isActive
                          ? 'bg-[var(--surface-2)] border-2 border-[var(--border)] font-bold'
                          : 'bg-[var(--surface-2)] border border-[var(--border)] hover:bg-[var(--surface-2)]'
                      } ${s.color}`}
                    >
                      <SIcon size={14} className="shrink-0" />
                      <span>{s.label}</span>
                      {isActive && (
                        <CheckCircle2 size={13} className="ml-auto shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-3 mb-6 text-left">
              <a href={`mailto:${candidate.email}`} className="flex items-center gap-3 text-sm text-[var(--text-muted)] hover:text-emerald-500 transition-colors">
                <Mail size={14} className="text-[var(--text-muted)] shrink-0" />
                <span className="break-all">{candidate.email}</span>
              </a>
              <a href={`tel:${candidate.phone}`} className="flex items-center gap-3 text-sm text-[var(--text-muted)] hover:text-emerald-500 transition-colors">
                <Phone size={14} className="text-[var(--text-muted)] shrink-0" />
                <span>{candidate.phone}</span>
              </a>
            </div>

            {/* Bouton entretien */}
            <button
              onClick={() => setShowInterviewModal(true)}
              className="w-full py-3 mb-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              <Calendar size={16} />
              {isInInterview ? 'Modifier l\'entretien' : 'Planifier un entretien'}
            </button>

            {/* ── Documents téléchargeables ── */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Documents</p>

              {/* CV */}
              <a
                href={candidate.resumeUrl.replace('/raw/upload/', '/raw/upload/fl_attachment/')}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="w-full py-3 bg-[#FAFAFA] hover:bg-white text-black font-bold rounded-xl flex items-center justify-center gap-2 transition-opacity shadow-md"
              >
                <Download size={16} /> Télécharger le CV
              </a>

              {/* Document additionnel */}
              {candidate.additionalDocUrl && (
                <a
                  href={candidate.additionalDocUrl.replace('/raw/upload/', '/raw/upload/fl_attachment/')}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md shadow-amber-500/20"
                >
                  <Download size={16} /> Télécharger le document joint
                </a>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── MAIN ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 space-y-6">

          {/* Poste */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-7 shadow-xl">
            <h3 className="text-base font-bold text-[var(--text)] mb-4 flex items-center gap-2">
              <Briefcase size={18} className="text-emerald-500" /> Poste visé
            </h3>
            <p className="text-xl font-bold text-[var(--text)] mb-4">{candidate.jobOffer.title}</p>
            <div className="flex flex-wrap gap-2.5">
              <span className="flex items-center gap-1.5 bg-[var(--surface-2)] px-3 py-1.5 rounded-lg text-sm text-[var(--text-muted)]">
                <Briefcase size={13} className="text-[var(--text-muted)]" /> {candidate.jobOffer.department.name}
              </span>
              <span className="flex items-center gap-1.5 bg-[var(--surface-2)] px-3 py-1.5 rounded-lg text-sm text-[var(--text-muted)]">
                <MapPin size={13} className="text-[var(--text-muted)]" /> {candidate.jobOffer.location}
              </span>
              <span className="flex items-center gap-1.5 bg-[var(--surface-2)] px-3 py-1.5 rounded-lg text-sm text-[var(--text-muted)]">
                <FileText size={13} className="text-[var(--text-muted)]" /> {candidate.jobOffer.type}
              </span>
            </div>
          </div>

          {/* Lettre de motivation */}
          {candidate.coverLetter && (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-7 shadow-xl">
              <h3 className="text-base font-bold text-[var(--text)] mb-4 flex items-center gap-2">
                <MessageSquare size={18} className="text-emerald-500" /> Lettre de motivation
              </h3>
              <p className="text-[var(--text-muted)] whitespace-pre-line leading-relaxed text-sm">
                {candidate.coverLetter}
              </p>
            </div>
          )}

          {/* Notes RH */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-7 shadow-xl">
            <h3 className="text-base font-bold text-[var(--text)] mb-4 flex items-center gap-2">
              <MessageSquare size={18} className="text-emerald-500" /> Notes RH
            </h3>
            <textarea
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl p-4 min-h-[120px] text-[var(--text)] outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none transition-all text-sm placeholder:text-[var(--text-muted)]"
              placeholder="Ajoutez vos observations sur ce candidat…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <button
              onClick={handleSaveNotes}
              disabled={isSavingNotes}
              className="mt-3 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 text-sm shadow-md"
            >
              {isSavingNotes ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
              Sauvegarder les notes
            </button>
          </div>

        </motion.div>
      </div>
    </div>
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