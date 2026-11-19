'use client';

// ============================================================================
// 📄 app/(dashboard)/performance/competences/employe/[id]/page.tsx
// Compétences d'un employé vues par son supérieur / la RH : niveaux, écarts,
// mise à jour des niveaux, affectation d'une formation.
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { api } from '@/services/api';
import PerformanceNav from '@/components/performance/PerformanceNav';
import { useBasePath } from '@/hooks/useBasePath';
import { CompetencyGaps } from '@/components/performance/CompetencyGaps';
import { EmployeeCompetencies } from '@/components/performance/competency-types';
import { KonzaLoader } from '@/components/ui/KonzaLoader';
import { PerformanceFrame as ModulePageFrame } from '@/components/performance/PerformanceFrame';

function EmployeeCompetenciesPage() {
  const params = useParams();
  const id = params?.id as string;
  const { bp } = useBasePath();
  const [data, setData] = useState<EmployeeCompetencies | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await api.get<EmployeeCompetencies>(`/performance/competencies/employee/${id}`));
      setError(null);
    } catch (e: any) { setError(e?.message || 'Chargement impossible'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <KonzaLoader variant="page" />;
  if (error || !data) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4">
        <AlertTriangle strokeWidth={1.5} className="mx-auto text-[var(--warning-text)]" size={36} />
        <p className="text-[var(--text)]">{error ?? 'Introuvable'}</p>
        <Link href={bp('/performance/competences')} className="inline-flex items-center gap-2 text-[var(--action)] font-semibold"><ArrowLeft strokeWidth={1.5} size={16} /> Retour</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-32 space-y-6">
      <PerformanceNav />
      <div>
        <Link href={bp('/performance/competences')} className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--action)] mb-2">
          <ArrowLeft strokeWidth={1.5} size={14} /> Compétences
        </Link>
        <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--text)] tracking-tight">
          {data.employee?.firstName} {data.employee?.lastName}
        </h1>
        <p className="text-[var(--text-secondary)] text-sm sm:text-base">{data.employee?.position}</p>
      </div>
      <CompetencyGaps data={data} mode={data.canAssess ? 'supervisor' : 'self'} onChanged={load} />
    </div>
  );
}


export default function EmployeeCompetenciesPageWithFrame() {
  return (
    <ModulePageFrame kind="detail">
      <EmployeeCompetenciesPage />
    </ModulePageFrame>
  );
}
