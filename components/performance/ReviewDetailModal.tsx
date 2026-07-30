'use client';

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
  status: 'DRAFT' | 'SHARED' | 'ACKNOWLEDGED';
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
  DRAFT:        { label: 'Brouillon',   color: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300' },
  SHARED:       { label: 'Soumise',     color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
  ACKNOWLEDGED: { label: 'Réceptionnée', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
};

const getScore = (r: Review) => Number(r.overallScore ?? r.rating ?? 0);

const scoreBg = (s: number) => {
  if (s >= 4)  return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
  if (s >= 3)  return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  if (s >= 2)  return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
  return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
};

const scoreColor = (s: number) => {
  if (s >= 4.5) return 'text-emerald-600'; if (s >= 3.5) return 'text-blue-600';
  if (s >= 2.5) return 'text-amber-600';   return 'text-red-600';
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
  const color = score >= 4 ? 'bg-emerald-500' : score >= 3 ? 'bg-blue-500' : score >= 2 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-sm font-bold w-8 text-right ${scoreColor(score)}`}>{score}/5</span>
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
        <span className="text-sm font-bold">{label}</span>
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
  const canAck      = review.status === 'SHARED';
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
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 10 }}
          onClick={e => e.stopPropagation()}
          className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="px-7 py-5 border-b border-gray-100 dark:border-gray-700 flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-700 flex items-center justify-center font-bold text-white text-base flex-shrink-0">
                {review.employee?.photoUrl
                  ? <img src={review.employee.photoUrl} className="w-full h-full rounded-xl object-cover" alt="" />
                  : `${review.employee?.firstName?.[0] ?? ''}${review.employee?.lastName?.[0] ?? ''}`
                }
              </div>
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white text-lg">
                  {review.employee?.firstName} {review.employee?.lastName}
                </h2>
                <p className="text-sm text-gray-400">
                  {review.employee?.position}
                  {review.employee?.department?.name && ` · ${review.employee.department.name}`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Corps scrollable */}
          <div className="flex-1 overflow-y-auto p-7 space-y-6">

            {/* ── Meta ─────────────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{review.period}</span>
              {review.reviewType && (
                <span className="text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full font-medium">
                  {TYPE_LABELS[review.reviewType] ?? review.reviewType}
                </span>
              )}
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${cfg.color}`}>
                {cfg.label}
              </span>
              <span className="text-xs text-gray-400 ml-auto flex items-center gap-1">
                <Calendar size={11} /> {fmt(review.date)}
              </span>
            </div>

            {/* ── Score global ──────────────────────────────────────────── */}
            {score > 0 && (
              <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-900/10 rounded-2xl border border-purple-100 dark:border-purple-800">
                <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-bold shadow-inner ${scoreBg(score)}`}>
                  <span className="text-2xl">{score.toFixed(1)}</span>
                  <span className="text-xs opacity-60">/5</span>
                </div>
                <div>
                  <p className={`text-xl font-bold ${scoreColor(score)}`}>{review.scoreLabel ?? scoreLabel(score)}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star
                        key={i}
                        size={14}
                        className={i <= Math.round(score) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 dark:text-gray-600'}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Évalué par {review.reviewer?.firstName} {review.reviewer?.lastName}
                  </p>
                </div>
              </div>
            )}

            {/* ── Grille de critères ────────────────────────────────────── */}
            {review.criteria && review.criteria.length > 0 && (
              <div>
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Award size={15} className="text-purple-500" /> Détail par critère
                </p>
                <div className="space-y-3">
                  {review.criteria.map(c => (
                    <div key={c.id} className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{c.label}</p>
                          <p className="text-xs text-gray-400">Pondération : {c.weight}%</p>
                        </div>
                      </div>
                      <ScoreBar score={c.score} weight={c.weight} />
                      {c.comment && (
                        <p className="text-xs text-gray-400 italic mt-2 pl-1">"{c.comment}"</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Commentaires qualitatifs (vue ou édition) ────────────── */}
            {editing ? (
              <div className="space-y-4">
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Modifier les commentaires</p>
                {[
                  { label: 'Commentaire général',     value: feedback,  set: setFeedback,  ph: 'Bilan global...' },
                  { label: '💪 Points forts',         value: strengths, set: setStrengths, ph: 'Ce que l\'employé fait bien...' },
                  { label: '📈 Axes d\'amélioration', value: improv,    set: setImprov,    ph: 'Ce sur quoi progresser...' },
                  { label: '🎯 Objectifs suivants',   value: goals,     set: setGoals,     ph: 'Pour la prochaine période...' },
                ].map(f => (
                  <div key={f.label}>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{f.label}</label>
                    <textarea
                      value={f.value}
                      onChange={e => f.set(e.target.value)}
                      placeholder={f.ph}
                      rows={3}
                      className="w-full p-3 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none placeholder-gray-300"
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
                  color="border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                />
                <QualSection
                  icon={TrendingUp}
                  label="Points forts"
                  value={review.strengths}
                  color="border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/10"
                />
                <QualSection
                  icon={ChevronRight}
                  label="Axes d'amélioration"
                  value={review.improvements}
                  color="border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10"
                />
                <QualSection
                  icon={Target}
                  label="Objectifs suivants"
                  value={review.nextGoals}
                  color="border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/10"
                />
              </div>
            )}

            {/* ── Timeline statut ───────────────────────────────────────── */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Historique</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  Créée le {fmt(review.createdAt)}
                </div>
                {review.submittedAt && (
                  <div className="flex items-center gap-2 text-xs text-amber-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Soumise le {fmt(review.submittedAt)}
                  </div>
                )}
                {review.acknowledgedAt && (
                  <div className="flex items-center gap-2 text-xs text-emerald-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Réceptionnée le {fmt(review.acknowledgedAt)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="px-7 py-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            {editing ? (
              <div className="flex gap-3">
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 py-3 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                  Sauvegarder
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
                >
                  Fermer
                </button>

                {/* Modifier — DRAFT seulement */}
                {canEdit && (
                  <button
                    onClick={() => setEditing(true)}
                    className="px-4 py-2.5 border border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-400 font-semibold rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-sm flex items-center gap-2"
                  >
                    <Edit3 size={14} /> Modifier
                  </button>
                )}

                {/* Soumettre — DRAFT */}
                {canSubmit && (
                  <button
                    onClick={() => { onSubmit(review); onClose(); }}
                    className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-2 shadow-sm shadow-amber-300/30"
                  >
                    <Send size={15} /> Soumettre à l'employé
                  </button>
                )}

                {/* Accuser réception — SHARED */}
                {canAck && (
                  <button
                    onClick={() => { onAcknowledge(review); onClose(); }}
                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-2 shadow-sm shadow-emerald-300/30"
                  >
                    <ThumbsUp size={15} /> J'ai pris connaissance
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}