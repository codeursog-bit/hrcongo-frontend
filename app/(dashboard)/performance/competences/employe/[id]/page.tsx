'use client';

// ============================================================================
// 📄 app/(dashboard)/performance/competences/employe/[id]/page.tsx
// Compétences d'un employé vues par son supérieur / la RH : niveaux, écarts,
// mise à jour des niveaux, affectation d'une formation.
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { api } from '@/services/api';
import PerformanceNav from '@/components/performance/PerformanceNav';
import { useBasePath } from '@/hooks/useBasePath';
import { CompetencyGaps } from '@/components/performance/CompetencyGaps';
import { EmployeeCompetencies } from '@/components/performance/competency-types';

export default function EmployeeCompetenciesPage() {
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

  if (loading) return <div className="flex justify-center py-32"><Loader2 className="animate-spin text-purple-600" size={32} /></div>;
  if (error || !data) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4">
        <AlertTriangle className="mx-auto text-amber-500" size={36} />
        <p className="text-gray-700 dark:text-gray-300">{error ?? 'Introuvable'}</p>
        <Link href={bp('/performance/competences')} className="inline-flex items-center gap-2 text-purple-600 font-bold"><ArrowLeft size={16} /> Retour</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-32 space-y-6">
      <PerformanceNav />
      <div>
        <Link href={bp('/performance/competences')} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-purple-600 mb-2">
          <ArrowLeft size={14} /> Compétences
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
          {data.employee?.firstName} {data.employee?.lastName}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">{data.employee?.position}</p>
      </div>
      <CompetencyGaps data={data} mode={data.canAssess ? 'supervisor' : 'self'} onChanged={load} />
    </div>
  );
}