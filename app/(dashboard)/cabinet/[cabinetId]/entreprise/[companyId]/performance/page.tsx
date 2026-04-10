'use client';

// app/(dashboard)/cabinet/[cabinetId]/entreprise/[companyId]/performance/page.tsx

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Star, Loader2, Target, TrendingUp, Users, ChevronDown } from 'lucide-react';
import { api } from '@/services/api';

const RATING_COLORS: Record<number, string> = {
  1: 'text-red-400', 2: 'text-orange-400', 3: 'text-amber-400',
  4: 'text-cyan-400', 5: 'text-emerald-400',
};

export default function CabinetPerformancePage() {
  const params    = useParams();
  const companyId = params.companyId as string;

  const [reviews,  setReviews]  = useState<any[]>([]);
  const [goals,    setGoals]    = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState<'reviews' | 'goals'>('reviews');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [revRes, goalRes] = await Promise.all([
          api.get(`/performance/reviews?companyId=${companyId}`) as Promise<any>,
          api.get(`/performance/goals?companyId=${companyId}`) as Promise<any>,
        ]);
        setReviews(Array.isArray(revRes) ? revRes : revRes?.data ?? []);
        setGoals(Array.isArray(goalRes) ? goalRes : goalRes?.data ?? []);
      } catch {
        setReviews([]); setGoals([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [companyId]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-gray-600" /></div>;

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Star size={20} className="text-cyan-400" /> Performance
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Évaluations et objectifs</p>
      </div>

      <div className="flex gap-1 bg-white/3 border border-white/8 rounded-lg p-1 w-fit">
        {([['reviews','Évaluations'],['goals','Objectifs']] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-1.5 rounded-md text-sm transition-colors ${tab === k ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'reviews' && (
        reviews.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Star size={36} className="mx-auto mb-3 text-gray-700" /> <p>Aucune évaluation</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((r: any) => (
              <div key={r.id} className="bg-white/3 border border-white/8 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white text-sm">
                      {r.employee?.firstName} {r.employee?.lastName}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {r.period} · {r.reviewedBy?.firstName} {r.reviewedBy?.lastName}
                    </p>
                  </div>
                  {r.overallRating && (
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} size={14}
                          className={i <= r.overallRating ? (RATING_COLORS[r.overallRating] || 'text-amber-400') : 'text-gray-700'}
                          fill={i <= r.overallRating ? 'currentColor' : 'none'}
                        />
                      ))}
                      <span className={`ml-1 text-sm font-bold ${RATING_COLORS[r.overallRating] || 'text-amber-400'}`}>
                        {r.overallRating}/5
                      </span>
                    </div>
                  )}
                </div>
                {r.comments && <p className="text-xs text-gray-400 mt-2 line-clamp-2">{r.comments}</p>}
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'goals' && (
        goals.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Target size={36} className="mx-auto mb-3 text-gray-700" /> <p>Aucun objectif</p>
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map((g: any) => (
              <div key={g.id} className="bg-white/3 border border-white/8 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-white text-sm">{g.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {g.employee?.firstName} {g.employee?.lastName}
                      {g.dueDate && ` · Échéance : ${new Date(g.dueDate).toLocaleDateString('fr-FR')}`}
                    </p>
                    {g.description && <p className="text-xs text-gray-400 mt-1.5 line-clamp-2">{g.description}</p>}
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full shrink-0 ${
                    g.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' :
                    g.status === 'IN_PROGRESS' ? 'bg-blue-500/10 text-blue-400' :
                    'bg-amber-500/10 text-amber-400'
                  }`}>
                    {g.status === 'COMPLETED' ? 'Atteint' : g.status === 'IN_PROGRESS' ? 'En cours' : 'Planifié'}
                  </span>
                </div>
                {g.progress !== undefined && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progression</span><span>{g.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500 rounded-full transition-all"
                           style={{ width: `${Math.min(100, g.progress)}%` }} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}