'use client';

// app/(dashboard)/cabinet/[cabinetId]/entreprise/[companyId]/formation/page.tsx
// API INCHANGÉE — UX améliorée

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/services/api';
import {
  C, Ico, Card, Badge, KpiCard,
  PageHeader, EmptyState, LoadingInline,
} from '@/components/cabinet/cabinet-ui';

const fmt = (n: number) => new Intl.NumberFormat('fr-CG', { maximumFractionDigits: 0 }).format(n);

const STATUS_MAP: Record<string, { label: string; variant: any; accentColor: string }> = {
  NOT_STARTED: { label: 'Au catalogue', variant: 'info', accentColor: C.cyan },
  PLANNED:    { label: 'Planifiée',  variant: 'info',    accentColor: C.cyan    },
  IN_PROGRESS:{ label: 'En cours',   variant: 'warning', accentColor: C.amber   },
  COMPLETED:  { label: 'Terminée',   variant: 'success', accentColor: C.emerald },
  CANCELLED:  { label: 'Annulée',    variant: 'default', accentColor: C.textMuted },
};

export default function CabinetFormationPage() {
  const params    = useParams();
  const companyId = params.companyId as string;

  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/training/courses?companyId=${companyId}`)
      .then((r: any) => setCourses(Array.isArray(r) ? r : r?.data ?? []))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [companyId]);

  const stats = {
    total: courses.length,
    enrolled: courses.reduce((s, c) => s + (c.enrolledCount ?? 0), 0),
    totalBudget:courses.reduce((s, c) => s + Number(c.cost ?? 0), 0),
  };

  return (
    <div className="p-6 space-y-5" style={{ minHeight: '100vh', background: C.pageBg }}>

      <PageHeader
        title="Formation"
        sub={`${courses.length} formation${courses.length > 1 ? 's' : ''}`}
        icon={<Ico.Book size={18} color={C.cyan} />}
      />

      {courses.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <KpiCard label="Formations" value={stats.total} icon={<Ico.Book size={16} color={C.cyan} />} accentColor={C.cyan} />
          <KpiCard label="Inscriptions" value={stats.enrolled} icon={<Ico.Users size={16} color={C.emerald} />} accentColor={C.emerald} />
          <KpiCard label="Coût du catalogue" value={`${fmt(stats.totalBudget)} F`} icon={<Ico.Dollar size={16} color={C.violet} />} accentColor={C.violet} />
        </div>
      )}

      {error ? <p role="alert" className="text-red-300">{error}</p> : loading ? <LoadingInline /> : courses.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Ico.Book size={22} color={C.textMuted} />}
            title="Aucune formation enregistrée"
            sub="Les plans de formation de la PME apparaîtront ici"
          />
        </Card>
      ) : (
        <div className="grid gap-3">
          {courses.map((c: any) => {
            const sc = STATUS_MAP[c.status] ?? STATUS_MAP['PLANNED'];
            return (
              <Card key={c.id} accentColor={sc.accentColor} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-2">
                      <h3 className="font-semibold text-sm truncate" style={{ color: C.textPrimary }}>
                        {c.title}
                      </h3>
                      <Badge label={sc.label} variant={sc.variant} />
                    </div>
                    {c.description && (
                      <p className="text-xs line-clamp-2 mb-3" style={{ color: C.textSecondary }}>
                        {c.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4" style={{ color: C.textMuted }}>
                      {c.dateSchedule && (
                        <span className="flex items-center gap-1 text-xs">
                          <Ico.Leave size={11} color="currentColor" />
                          {new Date(c.dateSchedule).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                      {c.duration && (
                        <span className="flex items-center gap-1 text-xs">
                          <Ico.Clock size={11} color="currentColor" />
                          {c.duration}h
                        </span>
                      )}
                      {c.cost != null && (
                        <span className="flex items-center gap-1 text-xs">
                          <Ico.Dollar size={11} color="currentColor" />
                          {fmt(c.cost)} F
                        </span>
                      )}
                      {c.enrolledCount !== undefined && (
                        <span className="flex items-center gap-1 text-xs">
                          <Ico.Users size={11} color="currentColor" />
                          {c.enrolledCount} inscrit{c.enrolledCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
