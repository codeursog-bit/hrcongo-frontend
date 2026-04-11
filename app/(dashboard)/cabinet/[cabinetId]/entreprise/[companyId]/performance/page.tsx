'use client';

// app/(dashboard)/cabinet/[cabinetId]/entreprise/[companyId]/performance/page.tsx
// API INCHANGÉE — UX améliorée

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/services/api';
import {
  C, Ico, Card, Badge, Avatar, KpiCard,
  PageHeader, TabBar, EmptyState, LoadingInline, ProgressBar,
} from '@/components/cabinet/cabinet-ui';

const RATING_COLORS: Record<number, string> = {
  1: C.red, 2: '#f97316', 3: C.amber, 4: C.cyan, 5: C.emerald,
};

export default function CabinetPerformancePage() {
  const params    = useParams();
  const companyId = params.companyId as string;

  const [reviews, setReviews] = useState<any[]>([]);
  const [goals,   setGoals]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState<'reviews' | 'goals'>('reviews');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/performance/reviews?companyId=${companyId}`) as Promise<any>,
      api.get(`/performance/goals?companyId=${companyId}`)   as Promise<any>,
    ])
      .then(([revRes, goalRes]) => {
        setReviews(Array.isArray(revRes) ? revRes : revRes?.data ?? []);
        setGoals(Array.isArray(goalRes) ? goalRes : goalRes?.data ?? []);
      })
      .catch(() => { setReviews([]); setGoals([]); })
      .finally(() => setLoading(false));
  }, [companyId]);

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + (r.overallRating ?? 0), 0) / reviews.length)
    : 0;

  const goalsCompleted = goals.filter(g => g.status === 'COMPLETED').length;

  const GOAL_BADGE: Record<string, any> = {
    COMPLETED:   { label: 'Atteint',  variant: 'success' },
    IN_PROGRESS: { label: 'En cours', variant: 'info'    },
    PLANNED:     { label: 'Planifié', variant: 'warning' },
  };

  return (
    <div className="p-6 space-y-5" style={{ minHeight: '100vh', background: C.pageBg }}>

      <PageHeader
        title="Performance"
        sub="Évaluations et objectifs des employés"
        icon={<Ico.Target size={18} color={C.cyan} />}
      />

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="Évaluations"     value={reviews.length} icon={<Ico.Star size={16} color={C.amber}  />} accentColor={C.amber}   />
        <KpiCard label="Note moyenne"    value={avgRating ? avgRating.toFixed(1) + '/5' : '—'} icon={<Ico.Star size={16} color={C.cyan} />} accentColor={C.cyan} />
        <KpiCard label="Objectifs"       value={goals.length}   icon={<Ico.Target size={16} color={C.indigo}/>} accentColor={C.indigo}  />
        <KpiCard label="Objectifs atteints" value={goalsCompleted} icon={<Ico.Check size={16} color={C.emerald}/>} accentColor={C.emerald} />
      </div>

      <TabBar
        tabs={[{ key: 'reviews', label: 'Évaluations' }, { key: 'goals', label: 'Objectifs' }]}
        active={tab}
        onChange={setTab}
      />

      {loading ? <LoadingInline /> : (
        <>
          {/* ── Évaluations ── */}
          {tab === 'reviews' && (
            reviews.length === 0 ? (
              <Card>
                <EmptyState
                  icon={<Ico.Star size={22} color={C.textMuted} />}
                  title="Aucune évaluation"
                  sub="Les revues de performance apparaîtront ici"
                />
              </Card>
            ) : (
              <div className="space-y-3">
                {reviews.map((r: any, i) => {
                  const ratingColor = RATING_COLORS[r.overallRating] ?? C.amber;
                  return (
                    <Card key={r.id} className="p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={`${r.employee?.firstName ?? ''} ${r.employee?.lastName ?? ''}`} size={36} index={i} />
                          <div>
                            <p className="text-sm font-semibold" style={{ color: C.textPrimary }}>
                              {r.employee?.firstName} {r.employee?.lastName}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: C.textSecondary }}>
                              {r.period}
                              {r.reviewedBy && ` · Évalué par ${r.reviewedBy.firstName} ${r.reviewedBy.lastName}`}
                            </p>
                          </div>
                        </div>
                        {r.overallRating && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Ico.Star
                                  key={star}
                                  size={14}
                                  color={star <= r.overallRating ? ratingColor : C.textMuted}
                                  filled={star <= r.overallRating}
                                />
                              ))}
                            </div>
                            <span className="text-sm font-bold ml-1" style={{ color: ratingColor }}>
                              {r.overallRating}/5
                            </span>
                          </div>
                        )}
                      </div>
                      {r.comments && (
                        <p className="text-xs mt-3 line-clamp-2" style={{ color: C.textSecondary }}>
                          {r.comments}
                        </p>
                      )}
                    </Card>
                  );
                })}
              </div>
            )
          )}

          {/* ── Objectifs ── */}
          {tab === 'goals' && (
            goals.length === 0 ? (
              <Card>
                <EmptyState
                  icon={<Ico.Target size={22} color={C.textMuted} />}
                  title="Aucun objectif"
                  sub="Les objectifs des employés apparaîtront ici"
                />
              </Card>
            ) : (
              <div className="space-y-3">
                {goals.map((g: any, i) => {
                  const gb = GOAL_BADGE[g.status] ?? GOAL_BADGE['PLANNED'];
                  return (
                    <Card key={g.id} className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <Avatar name={`${g.employee?.firstName ?? ''} ${g.employee?.lastName ?? ''}`} size={32} index={i} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold" style={{ color: C.textPrimary }}>{g.title}</p>
                            <p className="text-xs mt-0.5" style={{ color: C.textSecondary }}>
                              {g.employee?.firstName} {g.employee?.lastName}
                              {g.dueDate && ` · Échéance : ${new Date(g.dueDate).toLocaleDateString('fr-FR')}`}
                            </p>
                            {g.description && (
                              <p className="text-xs mt-1.5 line-clamp-2" style={{ color: C.textMuted }}>
                                {g.description}
                              </p>
                            )}
                            {g.progress !== undefined && (
                              <div className="mt-3">
                                <div className="flex justify-between text-xs mb-1.5" style={{ color: C.textMuted }}>
                                  <span>Progression</span>
                                  <span style={{ color: C.textSecondary }}>{g.progress}%</span>
                                </div>
                                <ProgressBar value={g.progress} max={100} color={C.cyan} />
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge label={gb.label} variant={gb.variant} />
                      </div>
                    </Card>
                  );
                })}
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}