'use client';

// ============================================================================
// 📄 app/(dashboard)/performance/page.tsx — VERSION AMÉLIORÉE
// Style purple conservé + grille critères + workflow + stats
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Target, Star, Calendar, Loader2, Plus, Check,
  Send, ThumbsUp, Eye, BarChart3, Award,
  RefreshCw, ChevronDown, Search, MessageSquare,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';
import { CreateReviewModal } from '@/components/performance/CreateReviewModal';
import { ReviewDetailModal } from '@/components/performance/ReviewDetailModal';

// ─── Types ────────────────────────────────────────────────────────────────────

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
  criteria?: any[];
  submittedAt?: string;
  acknowledgedAt?: string;
  createdAt: string;
  scoreLabel?: string;
  employee: {
    firstName: string; lastName: string;
    position?: string; photoUrl?: string;
    department?: { name: string };
  };
  reviewer?: { id: string; firstName: string; lastName: string };
}

interface Stats {
  total: number; drafts: number; submitted: number; acknowledged: number;
  avgScore: string | null; avgScoreLabel: string | null; thisYearCount: number;
  topEmployees: Array<{
    employeeId: string; avgScore: number; scoreLabel: string;
    employee: { firstName: string; lastName: string; position?: string; photoUrl?: string };
  }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  ANNUAL: 'Annuelle', PROBATION: "Fin d'essai",
  QUARTERLY: 'Trimestrielle', EXCEPTIONAL: 'Exceptionnelle',
};

const STATUS_CFG = {
  DRAFT:        { label: 'Brouillon',    bg: 'bg-gray-100 dark:bg-gray-700',          text: 'text-gray-500 dark:text-gray-300',         dot: 'bg-gray-400' },
  SHARED:       { label: 'Soumise',      bg: 'bg-amber-100 dark:bg-amber-900/30',      text: 'text-amber-700 dark:text-amber-400',        dot: 'bg-amber-500' },
  ACKNOWLEDGED: { label: 'Réceptionnée', bg: 'bg-emerald-100 dark:bg-emerald-900/30',  text: 'text-emerald-700 dark:text-emerald-400',    dot: 'bg-emerald-500' },
};

const getScore = (r: Review) => Number(r.overallScore ?? r.rating ?? 0);

const scoreBg = (s: number) => {
  if (s >= 4) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
  if (s >= 3) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  if (s >= 2) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
  return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
};

const scoreLabel = (s: number) => {
  if (s >= 4.5) return 'Exceptionnel'; if (s >= 3.5) return 'Très bien';
  if (s >= 2.5) return 'Bien';         if (s >= 1.5) return 'À améliorer';
  return s > 0 ? 'Insuffisant' : '';
};

const fmt = (d?: string) =>
  d ? new Date(d).toLocaleDateString('fr-FR') : '—';

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ emp }: { emp: Review['employee'] }) {
  const initials = `${emp?.firstName?.[0] ?? ''}${emp?.lastName?.[0] ?? ''}`.toUpperCase();
  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-700 flex items-center justify-center font-bold text-white text-sm flex-shrink-0 shadow-sm">
      {emp?.photoUrl
        ? <img src={emp.photoUrl} className="w-full h-full rounded-full object-cover" alt="" />
        : initials}
    </div>
  );
}

// ─── Carte review ─────────────────────────────────────────────────────────────

function ReviewCard({
  review, onView, onSubmit, onAcknowledge, currentUserId, isHR,
}: {
  review: Review; onView: (r: Review) => void;
  onSubmit: (r: Review) => void; onAcknowledge: (r: Review) => void;
  currentUserId?: string; isHR: boolean;
}) {
  const score      = getScore(review);
  const cfg        = STATUS_CFG[review.status];
  const isReviewer = review.reviewer?.id === currentUserId;
  const lbl        = review.scoreLabel ?? (score > 0 ? scoreLabel(score) : '');

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors group cursor-pointer"
      onClick={() => onView(review)}
    >
      {/* Gauche : score + identité */}
      <div className="flex items-center gap-5">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl shadow-inner flex-shrink-0
          ${score > 0 ? scoreBg(score) : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
          {score > 0
            ? <><span>{Number(score).toFixed(1)}</span><span className="text-xs opacity-60">/5</span></>
            : <Star size={22} className="opacity-30" />
          }
        </div>
        <div>
          <p className="font-bold text-gray-900 dark:text-white text-lg">
            {review.employee?.firstName} {review.employee?.lastName}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {review.employee?.position}
            {review.employee?.department?.name && ` · ${review.employee.department.name}`}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs text-gray-400">{review.period}</span>
            {review.reviewType && (
              <span className="text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full font-medium">
                {TYPE_LABELS[review.reviewType] ?? review.reviewType}
              </span>
            )}
            {lbl && <span className="text-xs font-medium text-gray-500">{lbl}</span>}
          </div>
        </div>
      </div>

      {/* Droite : statut + actions */}
      <div className="flex flex-col md:items-end gap-2" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          {/* Statut */}
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>

          {/* Vue */}
          <button
            onClick={() => onView(review)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 transition-colors"
            title="Voir le détail"
          >
            <Eye size={15} />
          </button>

          {/* Soumettre */}
          {review.status === 'DRAFT' && (isReviewer || isHR) && (
            <button
              onClick={() => onSubmit(review)}
              className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-gray-400 hover:text-amber-600 transition-colors"
              title="Soumettre à l'employé"
            >
              <Send size={15} />
            </button>
          )}

          {/* Accuser réception */}
          {review.status === 'SHARED' && (
            <button
              onClick={() => onAcknowledge(review)}
              className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-gray-400 hover:text-emerald-600 transition-colors"
              title={isHR ? 'Marquer reçu' : 'Accuser réception'}
            >
              {isHR ? <Check size={15} /> : <ThumbsUp size={15} />}
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 text-sm text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg w-fit">
          <Calendar size={13} />
          <span>{fmt(review.date)}</span>
        </div>

        {(review.feedback ?? review.comments) && (
          <p className="text-sm text-gray-400 italic max-w-xs text-right truncate hidden md:block">
            "{review.feedback ?? review.comments}"
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function PerformancePage() {
  const [reviews, setReviews]     = useState<Review[]>([]);
  const [stats, setStats]         = useState<Stats | null>(null);
  const [isLoading, setLoading]   = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatus]     = useState('ALL');
  const [tab, setTab]                 = useState<'list' | 'stats'>('list');
  const [createOpen, setCreateOpen]   = useState(false);
  const [viewReview, setViewReview]   = useState<Review | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const stored = localStorage.getItem('user');
      const user   = stored ? JSON.parse(stored) : null;
      if (user) setCurrentUser(user);

      const [revs, statsData] = await Promise.all([
        api.get<Review[]>('/performance/reviews'),
        api.get<Stats>('/performance/stats').catch(() => null),
      ]);

      setReviews(Array.isArray(revs) ? revs : []);
      if (statsData) setStats(statsData);
    } catch (e) {
      console.error(e);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const canCreate = currentUser && ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'MANAGER'].includes(currentUser.role);
  const isHR      = currentUser && ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'].includes(currentUser.role);

  const handleSubmit = async (review: Review) => {
    if (!confirm(`Soumettre l'évaluation de ${review.employee?.firstName} ${review.employee?.lastName} ?\nL'employé sera notifié.`)) return;
    try { await api.patch(`/performance/reviews/${review.id}/submit`, {}); load(); }
    catch { alert('Erreur lors de la soumission'); }
  };

  const handleAcknowledge = async (review: Review) => {
    if (!confirm('Confirmer la réception de cette évaluation ?')) return;
    try { await api.patch(`/performance/reviews/${review.id}/acknowledge`, {}); load(); }
    catch { alert('Erreur lors de l\'accusé de réception'); }
  };

  const filtered = reviews.filter(r => {
    const q  = search.toLowerCase();
    const mq = !q || `${r.employee?.firstName} ${r.employee?.lastName}`.toLowerCase().includes(q) || r.period.toLowerCase().includes(q);
    const ms = statusFilter === 'ALL' || r.status === statusFilter;
    return mq && ms;
  });

  const draftCount  = reviews.filter(r => r.status === 'DRAFT').length;
  const sharedCount = reviews.filter(r => r.status === 'SHARED').length;
  const ackCount    = reviews.filter(r => r.status === 'ACKNOWLEDGED').length;

  return (
    <div className="max-w-[1600px] mx-auto pb-20 space-y-8">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Performance</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Suivi des évaluations et feedback
            {sharedCount > 0 && (
              <span className="ml-2 text-amber-600 font-medium">· {sharedCount} en attente de réception</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={load}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <Link
            href="/performance/objectifs"
            className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 text-gray-700 dark:text-gray-300"
          >
            <Target size={18} />
            <span className="hidden sm:inline">Gérer les Objectifs</span>
          </Link>
          {canCreate && (
            <button
              onClick={() => setCreateOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2"
            >
              <Plus size={20} /> Nouvelle Évaluation
            </button>
          )}
        </div>
      </div>

      {/* ── KPI ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total',          value: reviews.length, color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600' },
          { label: 'Brouillons',     value: draftCount,     color: 'bg-gray-100 dark:bg-gray-700 text-gray-500' },
          { label: 'En attente',     value: sharedCount,    color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600', pulse: sharedCount > 0 },
          { label: 'Réceptionnées',  value: ackCount,       color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' },
        ].map(k => (
          <div key={k.label} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${k.color}`}>
              <Star size={18} className={(k as any).pulse ? 'animate-pulse' : ''} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{k.value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* ── Score moyen banner ───────────────────────────────────────────── */}
      {stats?.avgScore && (
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl p-6 flex items-center justify-between text-white">
          <div>
            <p className="text-purple-200 text-sm font-medium mb-1">Score moyen de l'équipe</p>
            <p className="text-4xl font-bold">{stats.avgScore}<span className="text-xl text-purple-300">/5</span></p>
            <p className="text-purple-300 text-sm mt-1">{stats.avgScoreLabel}</p>
          </div>
          <div className="text-right">
            <p className="text-purple-200 text-sm">{stats.thisYearCount} évaluation{stats.thisYearCount !== 1 ? 's' : ''} cette année</p>
            {stats.topEmployees?.[0] && (
              <p className="text-white font-semibold mt-1 text-sm">
                🏆 {stats.topEmployees[0].employee?.firstName} {stats.topEmployees[0].employee?.lastName}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        {[{ key: 'list', label: 'Évaluations' }, { key: 'stats', label: 'Statistiques' }].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all
              ${tab === t.key ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Onglet liste ──────────────────────────────────────────────────── */}
      {tab === 'list' && (
        <>
          {/* Filtres */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un employé, une période..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              />
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={e => setStatus(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/30 cursor-pointer"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="DRAFT">Brouillons</option>
                <option value="SHARED">En attente</option>
                <option value="ACKNOWLEDGED">Réceptionnées</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Contenu */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden min-h-[300px]">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Historique des évaluations</h3>
              <span className="text-sm text-gray-400">{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</span>
            </div>

            {isLoading ? (
              <div className="p-20 flex justify-center">
                <Loader2 className="animate-spin text-purple-500" size={40} />
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-20 text-center flex flex-col items-center text-gray-400">
                <Star size={48} className="opacity-20 mb-4" />
                <p className="font-medium">Aucune évaluation trouvée</p>
                {canCreate && reviews.length === 0 && (
                  <button
                    onClick={() => setCreateOpen(true)}
                    className="mt-4 px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-700 transition-colors"
                  >
                    Créer la première évaluation
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                <AnimatePresence>
                  {filtered.map(r => (
                    <ReviewCard
                      key={r.id}
                      review={r}
                      onView={setViewReview}
                      onSubmit={handleSubmit}
                      onAcknowledge={handleAcknowledge}
                      currentUserId={currentUser?.id}
                      isHR={isHR}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Onglet stats ──────────────────────────────────────────────────── */}
      {tab === 'stats' && stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top collaborateurs */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-5">
              <Award size={18} className="text-amber-500" /> Top collaborateurs
            </h3>
            {stats.topEmployees.length === 0 ? (
              <p className="text-gray-400 text-sm">Aucune donnée disponible</p>
            ) : (
              <div className="space-y-3">
                {stats.topEmployees.map((t, i) => (
                  <div key={t.employeeId} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold
                      ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-100 dark:bg-gray-700 text-gray-500' : 'bg-orange-50 text-orange-600'}`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {t.employee?.firstName} {t.employee?.lastName}
                      </p>
                      <p className="text-xs text-gray-400">{t.employee?.position}</p>
                    </div>
                    <div className={`px-2.5 py-1 rounded-xl text-sm font-bold ${scoreBg(t.avgScore)}`}>
                      {Number(t.avgScore).toFixed(1)}/5
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Répartition + score global */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-5">
              <BarChart3 size={18} className="text-purple-500" /> Vue d'ensemble
            </h3>
            <div className="space-y-3 mb-6">
              {[
                { label: 'Brouillons',     value: stats.drafts,      color: 'bg-gray-300 dark:bg-gray-600' },
                { label: 'En attente',     value: stats.submitted,   color: 'bg-amber-400' },
                { label: 'Réceptionnées',  value: stats.acknowledged, color: 'bg-emerald-500' },
              ].map(item => {
                const pct = stats.total > 0 ? Math.round((item.value / stats.total) * 100) : 0;
                return (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">{item.label}</span>
                      <span className="text-gray-400">{item.value} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${item.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-3 gap-4 pt-5 border-t border-gray-100 dark:border-gray-700 text-center">
              <div>
                <p className="text-2xl font-bold text-purple-600">{stats.avgScore ?? '—'}<span className="text-base">/5</span></p>
                <p className="text-xs text-gray-400 mt-1">Score moyen</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-sky-600">{stats.thisYearCount}</p>
                <p className="text-xs text-gray-400 mt-1">Cette année</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">
                  {stats.total > 0 ? Math.round((stats.acknowledged / stats.total) * 100) : 0}%
                </p>
                <p className="text-xs text-gray-400 mt-1">Taux réception</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      <CreateReviewModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => { setCreateOpen(false); load(); }}
      />

      {viewReview && (
        <ReviewDetailModal
          review={viewReview}
          onClose={() => setViewReview(null)}
          onSubmit={handleSubmit}
          onAcknowledge={handleAcknowledge}
          currentUserId={currentUser?.id}
          isHR={isHR}
          onUpdate={load}
        />
      )}
    </div>
  );
}