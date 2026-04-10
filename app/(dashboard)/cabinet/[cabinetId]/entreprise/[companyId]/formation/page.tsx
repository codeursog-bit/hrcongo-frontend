'use client';

// app/(dashboard)/cabinet/[cabinetId]/entreprise/[companyId]/formation/page.tsx

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { BookOpen, Loader2, Plus, Users, Calendar, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { api } from '@/services/api';

const fmt = (n: number) => new Intl.NumberFormat('fr-CG', { maximumFractionDigits: 0 }).format(n);

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  PLANNED:    { label: 'Planifiée',  color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20' },
  IN_PROGRESS:{ label: 'En cours',   color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20' },
  COMPLETED:  { label: 'Terminée',   color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  CANCELLED:  { label: 'Annulée',    color: 'text-gray-400',    bg: 'bg-gray-500/10 border-gray-500/20' },
};

export default function CabinetFormationPage() {
  const params    = useParams();
  const companyId = params.companyId as string;

  const [courses,  setCourses]  = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    api.get(`/training?companyId=${companyId}`)
      .then((r: any) => setCourses(Array.isArray(r) ? r : r?.data ?? []))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, [companyId]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-gray-600" /></div>;

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <BookOpen size={20} className="text-cyan-400" /> Formation
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">{courses.length} formation{courses.length > 1 ? 's' : ''}</p>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <BookOpen size={36} className="mx-auto mb-3 text-gray-700" />
          <p>Aucune formation enregistrée</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {courses.map((c: any) => {
            const sc = STATUS_MAP[c.status] ?? STATUS_MAP['PLANNED'];
            return (
              <div key={c.id} className="bg-white/3 border border-white/8 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white text-sm truncate">{c.title}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${sc.bg} ${sc.color}`}>
                        {sc.label}
                      </span>
                    </div>
                    {c.description && <p className="text-xs text-gray-500 line-clamp-2">{c.description}</p>}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      {c.startDate && (
                        <span className="flex items-center gap-1">
                          <Calendar size={11} />
                          {new Date(c.startDate).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' })}
                        </span>
                      )}
                      {c.duration && <span className="flex items-center gap-1"><Clock size={11} />{c.duration}h</span>}
                      {c.budget && <span className="flex items-center gap-1">{fmt(c.budget)} F</span>}
                    </div>
                  </div>
                  {c._count?.enrollments !== undefined && (
                    <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                      <Users size={12} />
                      <span>{c._count.enrollments} inscrit{c._count.enrollments > 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}