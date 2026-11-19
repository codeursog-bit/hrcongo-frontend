'use client';
import { PerformanceOverlay } from '@/components/performance/PerformanceOverlay';


// ============================================================================
// 📄 components/performance/ReviewDetailModal.tsx
// Modal détail complet d'une évaluation — style purple cohérent
// ============================================================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Star, Send, ThumbsUp, Check, Edit3,
  MessageSquare, TrendingUp, Target, Calendar,
  User, Award, ChevronRight, Loader2,
} from 'lucide-react';
import { api } from '@/services/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Review {
  id: string;
  period: string;
  reviewType?: string;
  date: string;
  status: 'DRAFT' | 'SUBMITTED' | 'ACKNOWLEDGED';
  rating?: number;
  overallScore?: number;
  feedback?: string;
  comments?: string;
  strengths?: string;
  improvements?: string;
  nextGoals?: string;
  criteria?: Array<{ id: string; label: string; weight: number; score: number; comment?: string }>;
  submittedAt?: string;
  acknowledgedAt?: string;
  createdAt: string;
  employee: { firstName: string; lastName: string; position?: string; photoUrl?: string; department?: { name: string } };
  reviewer?: { id: string; firstName: string; lastName: string };
  scoreLabel?: string;
}

interface Props {
  review: Review;
  onClose: () => void;
  onSubmit: (r: Review) => void;
  onAcknowledge: (r: Review) => void;
  currentUserId?: string;
  isHR: boolean;
  onUpdate: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  ANNUAL: 'Évaluation annuelle', PROBATION: "Fin de période d'essai",
  QUARTERLY: 'Évaluation trimestrielle', EXCEPTIONAL: 'Évaluation exceptionnelle',
};

const STATUS_CFG = {
  DRAFT:        { label: 'Brouillon',   color: 'bg-[var(--surface-2)] text-[var(--text-secondary)]' },
  SUBMITTED:     { label: 'Soumise',     color: 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--warning-text)]' },
  ACKNOWLEDGED: { label: 'Réceptionnée', color: 'bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] text-[var(--success-text)]' },
};

const getScore = (r: Review) => Number(r.overallScore ?? r.rating ?? 0);

const scoreBg = (s: number) => {
  if (s >= 4)  return 'bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] text-[var(--success-text)]';
  if (s >= 3)  return 'bg-[var(--brand-soft)] text-[var(--action)]';
  if (s >= 2)  return 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--warning-text)]';
  return 'bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] text-[var(--danger-text)]';
};

const scoreColor = (s: number) => {
  if (s >= 4.5) return 'text-[var(--success-text)]'; if (s >= 3.5) return 'text-[var(--action)]';
  if (s >= 2.5) return 'text-[var(--warning-text)]';   return 'text-[var(--danger-text)]';
};

const scoreLabel = (s: number) => {
  if (s >= 4.5) return 'Exceptionnel'; if (s >= 3.5) return 'Très bien';
  if (s >= 2.5) return 'Bien';         if (s >= 1.5) return 'À améliorer';
  return s > 0 ? 'Insuffisant' : '';
};

const fmt = (d?: string) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

// ─── Barre de score ───────────────────────────────────────────────────────────

function ScoreBar({ score, weight }: { score: number; weight: number }) {
  const pct = (score / 5) * 100;
  const color = score >= 4 ? 'bg-[var(--green)]' : score >= 3 ? 'bg-[var(--brand)]' : score >= 2 ? 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]' : 'bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))]';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-sm font-semibold w-8 text-right ${scoreColor(score)}`}>{score}/5</span>
    </div>
  );
}

// ─── Section qualitative ──────────────────────────────────────────────────────

function QualSection({ icon: Icon, label, value, color }: { icon: any; label: string; value?: string; color: string }) {
  if (!value) return null;
  return (
    <div className={`p-4 rounded-xl border ${color}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={15} />
        <span className="text-sm font-semibold">{label}</span>
      </div>
      <p className="text-sm leading-relaxed whitespace-pre-line">{value}</p>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function ReviewDetailModal({
  review, onClose, onSubmit, onAcknowledge, currentUserId, isHR, onUpdate,
}: Props) {
  const [editing,   setEditing]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [feedback,  setFeedback]  = useState(review.feedback ?? review.comments ?? '');
  const [strengths, setStrengths] = useState(review.strengths ?? '');
  const [improv,    setImprov]    = useState(review.improvements ?? '');
  const [goals,     setGoals]     = useState(review.nextGoals ?? '');

  const score       = getScore(review);
  const isReviewer  = review.reviewer?.id === currentUserId;
  const canEdit     = review.status === 'DRAFT' && (isReviewer || isHR);
  const canSubmit   = review.status === 'DRAFT' && (isReviewer || isHR);
  const canAck      = review.status === 'SUBMITTED' && (isHR || !isReviewer);
  const cfg         = STATUS_CFG[review.status];

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/performance/reviews/${review.id}`, {
        feedback, strengths, improvements: improv, nextGoals: goals,
      });
      setEditing(false);
      onUpdate();
    } catch { alert('Erreur lors de la sauvegarde'); }
    finally { setSaving(false); }
  };

  return (
    <AnimatePresence>
      <PerformanceOverlay
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(0_0_0_/.45)] p-4"
        onClose={onClose}
      >
        <motion.div
          initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 10 }}
          onClick={e => e.stopPropagation()}
          className="bg-[var(--surface)] rounded-3xl w-full max-w-2xl shadow-2xl border border-[var(--border)] overflow-hidden max-h-[92vh] flex flex-col performance-card"
        >
          {/* Header */}
          <div className="px-7 py-5 border-b border-[var(--border)] flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-12 h-12 rounded-xl flex items-center justify-center font-semibold text-[var(--text)] text-base flex-shrink-0 performance-icon-wrap bg-[var(--surface)] text-[var(--text)] performance-card">
                {review.employee?.photoUrl
                  ? <img src={review.employee.photoUrl} className="w-full h-full rounded-xl object-cover" alt="" />
                  : `${review.employee?.firstName?.[0] ?? ''}${review.employee?.lastName?.[0] ?? ''}`
                }
              </div>
              <div>
                <h2 className="font-semibold text-[var(--text)] text-lg">
                  {review.employee?.firstName} {review.employee?.lastName}
                </h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  {review.employee?.position}
                  {review.employee?.department?.name && ` · ${review.employee.department.name}`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--surface-2)] rounded-full text-[var(--text-secondary)] transition-colors"
            >
              <X strokeWidth={1.5} size={18} />
            </button>
          </div>

          {/* Corps scrollable */}
          <div className="flex-1 overflow-y-auto p-7 space-y-6">

            {/* ── Meta ─────────────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-[var(--text)]">{review.period}</span>
              {review.reviewType && (
                <span className="text-xs bg-[var(--brand-soft)] text-[var(--action)] px-2 py-0.5 rounded-full font-medium">
                  {TYPE_LABELS[review.reviewType] ?? review.reviewType}
                </span>
              )}
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${cfg.color}`}>
                {cfg.label}
              </span>
              <span className="text-xs text-[var(--text-secondary)] ml-auto flex items-center gap-1">
                <Calendar strokeWidth={1.5} size={11} /> {fmt(review.date)}
              </span>
            </div>

            {/* ── Score global ──────────────────────────────────────────── */}
            {score > 0 && (
              <div className="flex items-center gap-4 p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] performance-card">
                <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-semibold shadow-inner ${scoreBg(score)}`}>
                  <span className="text-2xl">{score.toFixed(1)}</span>
                  <span className="text-xs opacity-60">/5</span>
                </div>
                <div>
                  <p className={`text-xl font-semibold ${scoreColor(score)}`}>{review.scoreLabel ?? scoreLabel(score)}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star strokeWidth={1.5}
                        key={i}
                        size={14}
                        className={i <= Math.round(score) ? 'text-[var(--warning-text)] fill-[var(--warning-text)]' : 'text-[var(--text-secondary)]'}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Évalué par {review.reviewer?.firstName} {review.reviewer?.lastName}
                  </p>
                </div>
              </div>
            )}

            {/* ── Grille de critères ────────────────────────────────────── */}
            {review.criteria && review.criteria.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-[var(--text)] mb-3 flex items-center gap-2">
                  <Award strokeWidth={1.5} size={15} className="text-[var(--action)]" /> Détail par critère
                </p>
                <div className="space-y-3">
                  {review.criteria.map(c => (
                    <div key={c.id} className="bg-[var(--surface-2)] rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold text-[var(--text)]">{c.label}</p>
                          <p className="text-xs text-[var(--text-secondary)]">Pondération : {c.weight}%</p>
                        </div>
                      </div>
                      <ScoreBar score={c.score} weight={c.weight} />
                      {c.comment && (
                        <p className="text-xs text-[var(--text-secondary)] italic mt-2 pl-1">"{c.comment}"</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Commentaires qualitatifs (vue ou édition) ────────────── */}
            {editing ? (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-[var(--text)]">Modifier les commentaires</p>
                {[
                  { label: 'Commentaire général',     value: feedback,  set: setFeedback,  ph: 'Bilan global...' },
                  { label: '💪 Points forts',         value: strengths, set: setStrengths, ph: 'Ce que l\'employé fait bien...' },
                  { label: '📈 Axes d\'amélioration', value: improv,    set: setImprov,    ph: 'Ce sur quoi progresser...' },
                  { label: '🎯 Objectifs suivants',   value: goals,     set: setGoals,     ph: 'Pour la prochaine période...' },
                ].map(f => (
                  <div key={f.label}>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">{f.label}</label>
                    <textarea
                      value={f.value}
                      onChange={e => f.set(e.target.value)}
                      placeholder={f.ph}
                      rows={3}
                      className="w-full p-3 text-sm border border-[var(--border)] rounded-xl bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)] resize-none placeholder-gray-300"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <QualSection
                  icon={MessageSquare}
                  label="Commentaire général"
                  value={review.feedback ?? review.comments}
                  color="border-[var(--border)] text-[var(--text)]"
                />
                <QualSection
                  icon={TrendingUp}
                  label="Points forts"
                  value={review.strengths}
                  color="border-[var(--border)] text-[var(--success-text)] bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))]"
                />
                <QualSection
                  icon={ChevronRight}
                  label="Axes d'amélioration"
                  value={review.improvements}
                  color="border-[var(--border)] text-[var(--warning-text)] bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]"
                />
                <QualSection
                  icon={Target}
                  label="Objectifs suivants"
                  value={review.nextGoals}
                  color="border-[var(--border)] text-[var(--action)] bg-[var(--brand-soft)]"
                />
              </div>
            )}

            {/* ── Timeline statut ───────────────────────────────────────── */}
            <div className="pt-4 border-t border-[var(--border)]">
              <p className="text-xs font-semibold text-[var(--text-secondary)] mb-3">Historique</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--brand)]" />
                  Créée le {fmt(review.createdAt)}
                </div>
                {review.submittedAt && (
                  <div className="flex items-center gap-2 text-xs text-[var(--warning-text)]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]" />
                    Soumise le {fmt(review.submittedAt)}
                  </div>
                )}
                {review.acknowledgedAt && (
                  <div className="flex items-center gap-2 text-xs text-[var(--success-text)]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--green)]" />
                    Réceptionnée le {fmt(review.acknowledgedAt)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="px-7 py-5 border-t border-[var(--border)] bg-[var(--surface-2)]">
            {editing ? (
              <div className="flex gap-3">
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 py-3 border border-[var(--border)] text-[var(--text)] font-semibold rounded-xl hover:bg-[var(--surface-2)] transition-colors text-sm"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 bg-[var(--brand)] hover:bg-[var(--brand)] text-[var(--on-brand)] font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? <Loader2 strokeWidth={1.5} size={15} className="animate-spin" /> : <Check strokeWidth={1.5} size={15} />}
                  Sauvegarder
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 border border-[var(--border)] text-[var(--text)] font-semibold rounded-xl hover:bg-[var(--surface-2)] transition-colors text-sm"
                >
                  Fermer
                </button>

                {/* Modifier — DRAFT seulement */}
                {canEdit && (
                  <button
                    onClick={() => setEditing(true)}
                    className="px-4 py-2.5 border border-[var(--border)] text-[var(--action)] font-semibold rounded-xl hover:bg-[var(--brand-soft)] transition-colors text-sm flex items-center gap-2"
                  >
                    <Edit3 strokeWidth={1.5} size={14} /> Modifier
                  </button>
                )}

                {/* Soumettre — DRAFT */}
                {canSubmit && (
                  <button
                    onClick={() => { onSubmit(review); onClose(); }}
                    className="flex-1 py-2.5 bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] hover:bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--text)] font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Send strokeWidth={1.5} size={15} /> Soumettre à l'employé
                  </button>
                )}

                {/* Accuser réception — SUBMITTED */}
                {canAck && (
                  <button
                    onClick={() => { onAcknowledge(review); onClose(); }}
                    className="flex-1 py-2.5 bg-[var(--green)] hover:bg-[var(--green)] text-[var(--on-brand)] font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-2 shadow-sm"
                  >
                    <ThumbsUp strokeWidth={1.5} size={15} /> J'ai pris connaissance
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </PerformanceOverlay>
    </AnimatePresence>
  );
}
