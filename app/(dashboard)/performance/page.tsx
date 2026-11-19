'use client';
import { ModuleSelect } from '@/components/ui/ModuleSelect';


// ============================================================================
// 📄 app/(dashboard)/performance/page.tsx — VERSION AMÉLIORÉE
// Style purple conservé + grille critères + workflow + stats
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Star, Calendar, Plus, Check,
  Send, ThumbsUp, Eye, BarChart3, Award,
  RefreshCw, ChevronDown, Search, MessageSquare, Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';
import PerformanceNav from '@/components/performance/PerformanceNav';
import PerformanceStart from '@/components/performance/PerformanceStart';
import { MANAGE_ROLES } from '@/components/performance/sheet-types';
import { useBasePath } from '@/hooks/useBasePath';
import { CreateReviewModal } from '@/components/performance/CreateReviewModal';
import { ReviewDetailModal } from '@/components/performance/ReviewDetailModal';
import { KonzaLoader } from '@/components/ui/KonzaLoader';
import { PerformanceFrame as ModulePageFrame } from '@/components/performance/PerformanceFrame';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Review {
  id: string;
  period: string;
  reviewType?: string;
  cycleId?: string | null;
  date: string;
  status: 'DRAFT' | 'SUBMITTED' | 'ACKNOWLEDGED';
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
  DRAFT:        { label: 'Brouillon',    bg: 'bg-[var(--surface-2)]',          text: 'text-[var(--text-secondary)]',         dot: 'bg-[var(--surface-2)]' },
  SUBMITTED:     { label: 'Soumise',      bg: 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]',      text: 'text-[var(--warning-text)]',        dot: 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]' },
  ACKNOWLEDGED: { label: 'Réceptionnée', bg: 'bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))]',  text: 'text-[var(--success-text)]',    dot: 'bg-[var(--green)]' },
};

const getScore = (r: Review) => Number(r.overallScore ?? r.rating ?? 0);

const scoreBg = (s: number) => {
  if (s >= 4) return 'bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] text-[var(--success-text)]';
  if (s >= 3) return 'bg-[var(--brand-soft)] text-[var(--action)]';
  if (s >= 2) return 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--warning-text)]';
  return 'bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] text-[var(--danger-text)]';
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
    <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-[var(--text)] text-sm flex-shrink-0 shadow-sm performance-icon-wrap bg-[var(--surface)] text-[var(--text)] performance-card">
      {emp?.photoUrl
        ? <img src={emp.photoUrl} className="w-full h-full rounded-full object-cover" alt="" />
        : initials}
    </div>
  );
}

// ─── Carte review ─────────────────────────────────────────────────────────────

function ReviewCard({
  review, onView, onSubmit, onAcknowledge, onDelete, currentUserId, isHR,
}: {
  review: Review; onView: (r: Review) => void;
  onSubmit: (r: Review) => void; onAcknowledge: (r: Review) => void; onDelete: (r: Review) => void;
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
      className="bg-[var(--surface)] rounded-3xl shadow-sm border border-[var(--border)] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[var(--surface-2)] transition-colors group cursor-pointer performance-card performance-review"
      onClick={() => onView(review)}
      role="button"
      tabIndex={0}
      onKeyDown={event => {
        event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ') && (event.preventDefault(), onView(review));
      }}
    >
      {/* Gauche : score + identité */}
      <div className="flex items-center gap-5">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-semibold text-xl shadow-inner flex-shrink-0 ${score > 0 ? scoreBg(score) : 'bg-[var(--surface-2)] text-[var(--text-secondary)]'}`}>
          {score > 0
            ? <><span>{Number(score).toFixed(1)}</span><span className="text-xs opacity-60">/5</span></>
            : <Star strokeWidth={1.5} size={22} className="opacity-30" />
          }
        </div>
        <div>
          <p className="font-semibold text-[var(--text)] text-lg">
            {review.employee?.firstName} {review.employee?.lastName}
          </p>
          <p className="text-sm text-[var(--text-secondary)]">
            {review.employee?.position}
            {review.employee?.department?.name && ` · ${review.employee.department.name}`}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs text-[var(--text-secondary)]">{review.period}</span>
            {review.reviewType && (
              <span className="text-xs bg-[var(--brand-soft)] text-[var(--action)] px-2 py-0.5 rounded-full font-medium">
                {TYPE_LABELS[review.reviewType] ?? review.reviewType}
              </span>
            )}
            {lbl && <span className="text-xs font-medium text-[var(--text-secondary)]">{lbl}</span>}
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
            className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-secondary)] transition-colors"
            title="Voir le détail"
          >
            <Eye strokeWidth={1.5} size={15} />
          </button>

          {/* Soumettre */}
          {review.status === 'DRAFT' && (isReviewer || isHR) && (
            <button
              onClick={() => onSubmit(review)}
              className="p-1.5 rounded-lg hover:bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--text-secondary)] hover:text-[var(--warning-text)] transition-colors"
              title="Soumettre à l'employé"
            >
              <Send strokeWidth={1.5} size={15} />
            </button>
          )}

          {/* Supprimer : brouillon → RH ou responsable ; déjà transmise → RH seule */}
          {(isHR || (isReviewer && review.status === 'DRAFT')) && (
            <button
              onClick={() => onDelete(review)}
              className="p-1.5 rounded-lg hover:bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] text-[var(--text-secondary)] hover:text-[var(--danger-text)] transition-colors"
              title="Supprimer l'évaluation"
            >
              <Trash2 strokeWidth={1.5} size={15} />
            </button>
          )}

          {/* Accuser réception */}
          {review.status === 'SUBMITTED' && (isHR || !isReviewer) && (
            <button
              onClick={() => onAcknowledge(review)}
              className="p-1.5 rounded-lg hover:bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] text-[var(--text-secondary)] hover:text-[var(--success-text)] transition-colors"
              title={isHR ? 'Marquer reçu' : 'Accuser réception'}
            >
              {isHR ? <Check strokeWidth={1.5} size={15} /> : <ThumbsUp strokeWidth={1.5} size={15} />}
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 text-sm text-[var(--text-secondary)] bg-[var(--surface-2)] px-3 py-1 rounded-lg w-fit">
          <Calendar strokeWidth={1.5} size={13} />
          <span>{fmt(review.date)}</span>
        </div>

        {(review.feedback ?? review.comments) && (
          <p className="text-sm text-[var(--text-secondary)] italic max-w-xs text-right truncate hidden md:block">
            "{review.feedback ?? review.comments}"
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

function PerformancePage() {
  const router = useRouter();
  const { bp } = useBasePath();
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
      // Un employé n'a qu'une page : « Ma performance » (il ne note personne)
      if (user?.role && !MANAGE_ROLES.includes(user.role)) router.replace(bp('/performance/mon-espace'));

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

  // Les évaluations de cycle s'ouvrent dans la fiche (mobile-first) ;
  // les anciennes évaluations libres gardent la fenêtre de détail.
  const openReview = (r: Review) => {
    if (r.cycleId) router.push(bp(`/performance/fiche/${r.id}`));
    else setViewReview(r);
  };

  const handleSubmit = async (review: Review) => {
    if (review.cycleId) { router.push(bp(`/performance/fiche/${review.id}`)); return; }
    if (!confirm(`Soumettre l'évaluation de ${review.employee?.firstName} ${review.employee?.lastName} ?\nL'employé sera notifié.`)) return;
    try { await api.patch(`/performance/reviews/${review.id}/submit`, {}); load(); }
    catch { alert('Erreur lors de la soumission'); }
  };

  const handleDelete = async (review: Review) => {
    const who = `${review.employee?.firstName} ${review.employee?.lastName}`;
    const msg = review.status === 'DRAFT'
      ? `Supprimer le brouillon d'évaluation de ${who} (${review.period}) ?`
      : `⚠ Cette évaluation a déjà été transmise à ${who}.\nLa supprimer l'efface définitivement.\n\nConfirmer ?`;
    if (!confirm(msg)) return;
    try { await api.delete(`/performance/reviews/${review.id}`); load(); }
    catch (e: any) { alert(e?.message || 'Suppression impossible'); }
  };

  const handleAcknowledge = async (review: Review) => {
    if (review.cycleId) { router.push(bp(`/performance/fiche/${review.id}`)); return; }
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
  const sharedCount = reviews.filter(r => r.status === 'SUBMITTED').length;
  const ackCount    = reviews.filter(r => r.status === 'ACKNOWLEDGED').length;

  return (
    <div className="max-w-[1600px] mx-auto pb-20 space-y-8">
      <PerformanceNav />



      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 performance-header">
        <div>
          <h1 className="text-3xl font-semibold text-[var(--text)] tracking-tight">Évaluations</h1>
          <p className="text-[var(--text-secondary)]">
            À noter, à envoyer, déjà lues
            {sharedCount > 0 && (
              <span className="ml-2 text-[var(--warning-text)] font-medium">· {sharedCount} à lire par l'employé</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={load}
            className="p-2.5 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
          >
            <RefreshCw strokeWidth={1.5} size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
          {canCreate && (
            <button
              onClick={() => setCreateOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand)] text-[var(--on-brand)] font-semibold shadow-lg transition-colors flex items-center gap-2"
            >
              <Plus strokeWidth={1.5} size={20} /> Nouvelle Évaluation
            </button>
          )}
        </div>
      </div>

      {/* ── KPI ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 performance-metrics">
        {[
          { label: 'Total',          value: reviews.length, color: 'bg-[var(--brand-soft)] text-[var(--action)]' },
          { label: 'Brouillons',     value: draftCount,     color: 'bg-[var(--surface-2)] text-[var(--text-secondary)]' },
          { label: 'En attente',     value: sharedCount,    color: 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--warning-text)]', pulse: sharedCount > 0 },
          { label: 'Réceptionnées',  value: ackCount,       color: 'bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] text-[var(--success-text)]' },
        ].map(k => (
          <div key={k.label} className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 shadow-sm performance-card">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${k.color}`}>
              <Star strokeWidth={1.5} size={18} className={(k as any).pulse ? '' : ''} />
            </div>
            <p className="text-2xl font-semibold text-[var(--text)]">{k.value}</p>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>


      {/* ── Score moyen banner ───────────────────────────────────────────── */}
      {stats?.avgScore && (
        <div className="rounded-2xl p-6 flex items-center justify-between text-[var(--text)] bg-[var(--surface)] text-[var(--text)] performance-card">
          <div>
            <p className="text-[var(--action)] text-sm font-medium mb-1">Score moyen de l'équipe</p>
            <p className="text-4xl font-semibold">{stats.avgScore}<span className="text-xl text-[var(--action)]">/5</span></p>
            <p className="text-[var(--action)] text-sm mt-1">{stats.avgScoreLabel}</p>
          </div>
          <div className="text-right">
            <p className="text-[var(--action)] text-sm">{stats.thisYearCount} évaluation{stats.thisYearCount !== 1 ? 's' : ''} cette année</p>
            {stats.topEmployees?.[0] && (
              <p className="text-[var(--text)] font-semibold mt-1 text-sm">
                 {stats.topEmployees[0].employee?.firstName} {stats.topEmployees[0].employee?.lastName}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-[var(--surface-2)] p-1 rounded-xl w-fit">
        {[{ key: 'list', label: 'Évaluations' }, { key: 'stats', label: 'Statistiques' }].map(t => (
          <button aria-pressed={tab === t.key}
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === t.key ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text)]'}`}
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
              <Search strokeWidth={1.5} size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un employé, une période..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
              />
            </div>
            <div className="relative">
              <ModuleSelect
                value={statusFilter}
                onChange={e => setStatus(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)] cursor-pointer"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="DRAFT">Brouillons</option>
                <option value="SUBMITTED">En attente</option>
                <option value="ACKNOWLEDGED">Réceptionnées</option>
              </ModuleSelect>
              <ChevronDown strokeWidth={1.5} size={14} className="absolute right-2.5 top-1/2 text-[var(--text-secondary)] pointer-events-none" />
            </div>
          </div>

          {/* Contenu */}
          <div className="bg-[var(--surface)] rounded-3xl shadow-sm border border-[var(--border)] overflow-hidden min-h-[300px] performance-card">
            <div className="p-6 border-b border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[var(--text)]">Historique des évaluations</h3>
              <span className="text-sm text-[var(--text-secondary)]">{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</span>
            </div>

            {isLoading ? (
              <KonzaLoader variant="section" />
            ) : filtered.length === 0 ? (
              <div className="p-20 text-center flex flex-col items-center text-[var(--text-secondary)]">
                <Star strokeWidth={1.5} size={48} className="opacity-20 mb-4" />
                <p className="font-medium">Aucune évaluation trouvée</p>
                {canCreate && reviews.length === 0 && (
                  <button
                    onClick={() => setCreateOpen(true)}
                    className="mt-4 px-4 py-2 bg-[var(--brand)] text-[var(--on-brand)] text-sm font-semibold rounded-xl hover:bg-[var(--brand)] transition-colors"
                  >
                    Créer la première évaluation
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                <AnimatePresence>
                  {filtered.map(r => (
                    <ReviewCard
                      key={r.id}
                      review={r}
                      onView={openReview}
                      onSubmit={handleSubmit}
                      onAcknowledge={handleAcknowledge}
                      onDelete={handleDelete}
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
          <div className="bg-[var(--surface)] rounded-3xl border border-[var(--border)] p-6 performance-card">
            <h3 className="font-semibold text-[var(--text)] flex items-center gap-2 mb-5">
              <Award strokeWidth={1.5} size={18} className="text-[var(--warning-text)]" /> Top collaborateurs
            </h3>
            {stats.topEmployees.length === 0 ? (
              <p className="text-[var(--text-secondary)] text-sm">Aucune donnée disponible</p>
            ) : (
              <div className="space-y-3">
                {stats.topEmployees.map((t, i) => (
                  <div key={t.employeeId} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold ${i === 0 ? 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--warning-text)]' : i === 1 ? 'bg-[var(--surface-2)] text-[var(--text-secondary)]' : 'bg-[var(--brand-soft)] text-[var(--action)]'}`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--text)] truncate">
                        {t.employee?.firstName} {t.employee?.lastName}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)]">{t.employee?.position}</p>
                    </div>
                    <div className={`px-2.5 py-1 rounded-xl text-sm font-semibold ${scoreBg(t.avgScore)}`}>
                      {Number(t.avgScore).toFixed(1)}/5
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Répartition + score global */}
          <div className="bg-[var(--surface)] rounded-3xl border border-[var(--border)] p-6 performance-card">
            <h3 className="font-semibold text-[var(--text)] flex items-center gap-2 mb-5">
              <BarChart3 strokeWidth={1.5} size={18} className="text-[var(--action)]" /> Vue d'ensemble
            </h3>
            <div className="space-y-3 mb-6">
              {[
                { label: 'Brouillons',     value: stats.drafts,      color: 'bg-[var(--surface-2)]' },
                { label: 'En attente',     value: stats.submitted,   color: 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]' },
                { label: 'Réceptionnées',  value: stats.acknowledged, color: 'bg-[var(--green)]' },
              ].map(item => {
                const pct = stats.total > 0 ? Math.round((item.value / stats.total) * 100) : 0;
                return (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[var(--text)] font-medium">{item.label}</span>
                      <span className="text-[var(--text-secondary)]">{item.value} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${item.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-3 gap-4 pt-5 border-t border-[var(--border)] text-center">
              <div>
                <p className="text-2xl font-semibold text-[var(--action)]">{stats.avgScore ?? '—'}<span className="text-base">/5</span></p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">Score moyen</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-[var(--action)]">{stats.thisYearCount}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">Cette année</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-[var(--success-text)]">
                  {stats.total > 0 ? Math.round((stats.acknowledged / stats.total) * 100) : 0}%
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">Taux réception</p>
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

      <PerformanceStart reviews={reviews} />
</div>
  );
}


export default function PerformancePageWithFrame() {
  return (
    <ModulePageFrame kind="list">
      <PerformancePage />
    </ModulePageFrame>
  );
}
