'use client';

// ============================================================================
// 📄 app/(dashboard)/performance/mon-espace/page.tsx
// Espace performance de l'employé : ce qu'il doit faire, ses objectifs en cours
// (il met à jour sa progression), et l'historique de ses évaluations.
// Aucune donnée de manager non finalisée n'est exposée par l'API ici.
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Loader2, Target, ClipboardCheck, ThumbsUp, ChevronRight, Award,
  Calendar, RefreshCw, UserX, CheckCircle2, GraduationCap, Route, Sparkles,
} from 'lucide-react';
import { api } from '@/services/api';
import PerformanceNav from '@/components/performance/PerformanceNav';
import { useBasePath } from '@/hooks/useBasePath';
import { STATUS_LABEL, fmtDate, scoreTone, ReviewStatus } from '@/components/performance/sheet-types';
import { CompetencyGaps } from '@/components/performance/CompetencyGaps';
import { EmployeeCompetencies } from '@/components/performance/competency-types';
import { CareerTimeline } from '@/components/performance/CareerTimeline';
import { DevelopmentPlans } from '@/components/performance/DevelopmentPlans';
import { CareerData, PlansData } from '@/components/performance/career-types';
import { KonzaLoader } from '@/components/ui/KonzaLoader';
import { PerformanceFrame as ModulePageFrame } from '@/components/performance/PerformanceFrame';

interface MeData {
  employeeId: string | null;
  reviews: Array<{
    id: string; period: string; date: string; status: ReviewStatus;
    overallScore: number | string | null; verdict: string | null;
    submittedAt?: string | null; acknowledgedAt?: string | null;
    reviewer?: { firstName: string; lastName: string } | null;
  }>;
  goals: Array<{
    id: string; title: string; kpi?: string | null; support?: string | null;
    weight: number | string | null; progress: number; status: string; endDate: string;
  }>;
}

const cardCls =
  'bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm';

function GoalProgress({ goal, onSaved }: { goal: MeData['goals'][number]; onSaved: () => void }) {
  const [value, setValue] = useState(goal.progress);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setValue(goal.progress); }, [goal.progress]);

  const commit = async () => {
    if (value === goal.progress) return;
    setSaving(true); setError(null);
    try {
      await api.patch(`/performance/goals/${goal.id}/progress`, { progress: value });
      onSaved();
    } catch (e: any) {
      setError(e?.message || 'Mise à jour impossible');
      setValue(goal.progress);
    } finally { setSaving(false); }
  };

  const late = new Date(goal.endDate) < new Date() && value < 100;

  return (
    <div className={`${cardCls} p-4 sm:p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-[var(--text)] break-words">{goal.title}</h3>
          {goal.kpi && <p className="text-sm text-[var(--text-secondary)] mt-0.5 break-words">{goal.kpi}</p>}
        </div>
        {goal.weight !== null && goal.weight !== undefined && Number(goal.weight) > 0 && (
          <span className="px-2.5 py-1 rounded-lg bg-[var(--brand-soft)] text-[var(--action)] text-xs font-semibold shrink-0">
            {Number(goal.weight)} %
          </span>
        )}
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium text-[var(--text)]">Progression</span>
          <span className="font-semibold text-[var(--action)] flex items-center gap-1.5">
            {saving && <Loader2 strokeWidth={1.5} size={12} className="animate-spin" />}{value} %
          </span>
        </div>
        <input
          type="range" min={0} max={100} step={5} value={value}
          onChange={e => setValue(Number(e.target.value))}
          onPointerUp={commit} onKeyUp={commit} onBlur={commit}
          aria-label={`Progression de l'objectif ${goal.title}`}
          className="w-full h-3 accent-purple-600 cursor-pointer"
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-[var(--text-secondary)]">
        <span className="flex items-center gap-1"><Calendar strokeWidth={1.5} size={12} /> Échéance : {fmtDate(goal.endDate)}</span>
        {late && <span className="text-[var(--warning-text)] font-medium">Échéance dépassée</span>}
        {goal.support && <span className="break-words">Support : {goal.support}</span>}
      </div>
      {error && <p className="text-xs text-[var(--danger-text)] mt-2">{error}</p>}
    </div>
  );
}

function MyPerformancePage() {
  const { bp } = useBasePath();
  const [data, setData] = useState<MeData | null>(null);
  const [comp, setComp] = useState<EmployeeCompetencies | null>(null);
  const [career, setCareer] = useState<CareerData | null>(null);
  const [plans, setPlans] = useState<PlansData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api.get<MeData>('/performance/me'));
      // Compétences : section facultative, son échec ne bloque pas la page
      api.get<EmployeeCompetencies>('/performance/competencies/me').then(setComp).catch(() => setComp(null));
      api.get<CareerData>('/performance/career/me').then(setCareer).catch(() => setCareer(null));
      api.get<PlansData>('/performance/development/me').then(setPlans).catch(() => setPlans(null));
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Chargement impossible');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading && !data) {
    return <KonzaLoader variant="page" />;
  }

  if (error || !data) {
    return <div className="max-w-xl mx-auto py-20 text-center text-[var(--text-secondary)]">{error ?? 'Aucune donnée'}</div>;
  }

  if (!data.employeeId) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-3">
        <UserX strokeWidth={1.5} className="mx-auto text-[var(--text-secondary)]" size={40} />
        <p className="font-semibold text-[var(--text)]">Compte non relié à une fiche employé</p>
        <p className="text-sm text-[var(--text-secondary)]">Demandez à votre RH de relier votre compte à votre fiche pour accéder à votre espace performance.</p>
      </div>
    );
  }

  const toAck = data.reviews.filter(r => r.status === 'SUBMITTED');
  const nothingToDo = toAck.length === 0;

  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-6 sm:space-y-8">
      <PerformanceNav />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 performance-header">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--text)] tracking-tight">Ma performance</h1>
          <p className="text-[var(--text-secondary)] text-sm sm:text-base">Ici : ce que vous devez faire, vos objectifs et vos évaluations.</p>
        </div>
        <button onClick={load} aria-label="Actualiser"
          className="p-2.5 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors shrink-0">
          <RefreshCw strokeWidth={1.5} size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* À faire */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[var(--text)]">À faire</h2>
        {nothingToDo && (
          <div className={`${cardCls} p-5 flex items-center gap-3 text-[var(--success-text)]`}>
            <CheckCircle2 strokeWidth={1.5} size={20} /> <span className="text-sm font-medium">Rien à faire pour le moment. Tout est à jour </span>
          </div>
        )}
        {toAck.map(r => (
          <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Link href={bp(`/performance/fiche/${r.id}`)}
              className={`${cardCls} p-4 sm:p-5 flex items-center gap-4 border-l-4 !border-l-[var(--mustard)] hover:bg-[var(--surface-2)] transition-colors`}>
              <div className="w-11 h-11 rounded-xl bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--warning-text)] flex items-center justify-center shrink-0"><ThumbsUp strokeWidth={1.5} size={20} /></div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[var(--text)]">Lire mon évaluation et accuser réception</p>
                <p className="text-sm text-[var(--text-secondary)] truncate">{r.period}{r.reviewer ? ` · par ${r.reviewer.firstName} ${r.reviewer.lastName}` : ''}</p>
              </div>
              <ChevronRight strokeWidth={1.5} size={18} className="text-[var(--text-secondary)] shrink-0" />
            </Link>
          </motion.div>
        ))}
      </section>

      {/* Objectifs en cours */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[var(--text)] flex items-center gap-2"><Target strokeWidth={1.5} size={18} className="text-[var(--action)]" /> Mes objectifs</h2>
        {data.goals.length === 0 ? (
          <div className={`${cardCls} p-8 text-center text-sm text-[var(--text-secondary)]`}>
            Aucun objectif pour le moment. Votre responsable vous en fixera lors de votre évaluation.
          </div>
        ) : (
          <div className="grid gap-3">
            {data.goals.map(g => <GoalProgress key={g.id} goal={g} onSaved={load} />)}
          </div>
        )}
      </section>

      {/* Plan de développement */}
      {plans && plans.plans.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-[var(--text)] flex items-center gap-2"><Sparkles strokeWidth={1.5} size={18} className="text-[var(--action)]" /> Mon plan de développement</h2>
          <DevelopmentPlans data={plans} canEdit={false} onChanged={load} />
        </section>
      )}

      {/* Compétences */}
      {comp?.profile && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-[var(--text)] flex items-center gap-2"><GraduationCap strokeWidth={1.5} size={18} className="text-[var(--action)]" /> Mes compétences</h2>
          <CompetencyGaps data={comp} mode="self" onChanged={load} />
        </section>
      )}

      {/* Parcours */}
      {career && career.items.length > 1 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-[var(--text)] flex items-center gap-2"><Route strokeWidth={1.5} size={18} className="text-[var(--action)]" /> Mon parcours</h2>
          <CareerTimeline items={career.items} />
        </section>
      )}

      {/* Historique */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[var(--text)] flex items-center gap-2"><Award strokeWidth={1.5} size={18} className="text-[var(--action)]" /> Mes évaluations</h2>
        {data.reviews.length === 0 ? (
          <div className={`${cardCls} p-8 text-center text-sm text-[var(--text-secondary)]`}>Aucune évaluation pour le moment.</div>
        ) : (
          <div className="grid gap-3">
            {data.reviews.map(r => {
              const score = Number(r.overallScore ?? 0);
              const st = STATUS_LABEL[r.status];
              return (
                <Link key={r.id} href={bp(`/performance/fiche/${r.id}`)}
                  className={`${cardCls} p-4 sm:p-5 flex items-center gap-4 hover:bg-[var(--surface-2)] transition-colors`}>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-semibold text-lg shrink-0 ${score > 0 ? scoreTone(score) : 'bg-[var(--surface-2)] text-[var(--text-secondary)]'}`}>
                    {score > 0 ? score.toFixed(1) : '—'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[var(--text)] truncate">{r.period}</p>
                    <p className="text-sm text-[var(--text-secondary)] truncate">{r.verdict ?? 'Sans verdict'} · {fmtDate(r.date)}</p>
                  </div>
                  <span className={`hidden sm:inline px-2.5 py-1 rounded-lg text-xs font-semibold ${st.cls}`}>{st.label}</span>
                  <ChevronRight strokeWidth={1.5} size={18} className="text-[var(--text-secondary)] shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}


export default function MyPerformancePageWithFrame() {
  return (
    <ModulePageFrame kind="list">
      <MyPerformancePage />
    </ModulePageFrame>
  );
}
