'use client';
import { PerformanceOverlay } from '@/components/performance/PerformanceOverlay';
import { ModuleSelect } from '@/components/ui/ModuleSelect';


// ============================================================================
// 📄 app/(dashboard)/performance/carriere/employe/[id]/page.tsx
// Dossier carrière d'un employé (vu par son supérieur / la RH) :
// parcours, plan de développement, accès aux compétences, proposition d'avancement.
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, AlertTriangle, Route, Target, TrendingUp, Plus, X, GraduationCap, CheckCircle2 } from 'lucide-react';
import { api } from '@/services/api';
import PerformanceNav from '@/components/performance/PerformanceNav';
import { useBasePath } from '@/hooks/useBasePath';
import { CareerTimeline } from '@/components/performance/CareerTimeline';
import { DevelopmentPlans } from '@/components/performance/DevelopmentPlans';
import { ProposalModal } from '@/components/performance/ProposalModal';
import { CareerData, EVENT_TYPES, PlansData } from '@/components/performance/career-types';
import { KonzaLoader } from '@/components/ui/KonzaLoader';
import { PerformanceFrame as ModulePageFrame } from '@/components/performance/PerformanceFrame';

type Tab = 'parcours' | 'plan';

const inputCls =
  'w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--focus)] focus:border-[var(--border)]';

function EventModal({ employeeId, onClose, onDone }: { employeeId: string; onClose: () => void; onDone: () => void }) {
  const [type, setType] = useState('POSITION_CHANGE');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [title, setTitle] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setBusy(true); setError(null);
    try {
      await api.post(`/performance/career/employee/${employeeId}/events`, {
        type, effectiveDate: date, title, fromValue: from || null, toValue: to || null, notes: notes || null,
      });
      onDone(); onClose();
    } catch (e: any) { setError(e?.message || 'Enregistrement impossible'); }
    finally { setBusy(false); }
  };

  return (
    <PerformanceOverlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[rgb(0_0_0_/.45)] sm:p-4" onClose={onClose}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} onClick={e => e.stopPropagation()}
        className="bg-[var(--surface)] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg shadow-2xl border border-[var(--border)] max-h-[94vh] flex flex-col performance-card">
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--text)]">Ajouter un événement</h2>
          <button onClick={onClose} aria-label="Fermer" className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"><X strokeWidth={1.5} size={18} /></button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto">
          <p className="text-xs text-[var(--text-secondary)]">Pour reconstituer un historique antérieur à l'application. Les embauches, passages d'échelon, formations et évaluations sont ajoutés automatiquement.</p>
          <div>
            <label className="text-sm font-medium text-[var(--text)]">Type</label>
            <ModuleSelect className={`${inputCls} mt-1`} value={type} onChange={e => setType(e.target.value)}>
              {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </ModuleSelect>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-[var(--text)]">Date d'effet</label>
              <input type="date" className={`${inputCls} mt-1`} value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--text)]">Intitulé</label>
              <input className={`${inputCls} mt-1`} value={title} onChange={e => setTitle(e.target.value)} placeholder="ex : Passage chauffeur PL" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-[var(--text)]">Avant (facultatif)</label>
              <input className={`${inputCls} mt-1`} value={from} onChange={e => setFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--text)]">Après (facultatif)</label>
              <input className={`${inputCls} mt-1`} value={to} onChange={e => setTo(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--text)]">Note interne <span className="text-xs font-normal text-[var(--text-secondary)]">(jamais visible par l'employé)</span></label>
            <textarea rows={2} className={`${inputCls} mt-1`} value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          {error && <p className="text-sm text-[var(--danger-text)] bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] rounded-xl p-3 break-words">{error}</p>}
        </div>
        <div className="p-5 border-t border-[var(--border)] flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-[var(--border)] font-semibold text-[var(--text-secondary)]">Annuler</button>
          <button onClick={save} disabled={busy || !title.trim()}
            className="flex-1 py-3 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand)] text-[var(--on-brand)] font-semibold shadow-lg disabled:opacity-60 flex items-center justify-center gap-2">
            {busy && <Loader2 strokeWidth={1.5} size={16} className="animate-spin" />} Enregistrer
          </button>
        </div>
      </motion.div>
    </PerformanceOverlay>
  );
}

function EmployeeCareerPage() {
  const params = useParams();
  const id = params?.id as string;
  const { bp } = useBasePath();

  const [career, setCareer] = useState<CareerData | null>(null);
  const [plans, setPlans] = useState<PlansData | null>(null);
  const [tab, setTab] = useState<Tab>('parcours');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [addEvent, setAddEvent] = useState(false);
  const [propose, setPropose] = useState(false);

  const load = useCallback(async () => {
    try {
      const [c, p] = await Promise.all([
        api.get<CareerData>(`/performance/career/employee/${id}`),
        api.get<PlansData>(`/performance/development/employee/${id}`),
      ]);
      setCareer(c); setPlans(p); setError(null);
    } catch (e: any) { setError(e?.message || 'Chargement impossible'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <KonzaLoader variant="page" />;
  if (error || !career?.employee) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4">
        <AlertTriangle strokeWidth={1.5} className="mx-auto text-[var(--warning-text)]" size={36} />
        <p className="text-[var(--text)]">{error ?? 'Introuvable'}</p>
        <Link href={bp('/performance/carriere')} className="inline-flex items-center gap-2 text-[var(--action)] font-semibold"><ArrowLeft strokeWidth={1.5} size={16} /> Retour</Link>
      </div>
    );
  }

  const e = career.employee;

  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-6">
      <PerformanceNav />
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 performance-header">
        <div className="min-w-0">
          <Link href={bp('/performance/carriere')} className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--action)] mb-2"><ArrowLeft strokeWidth={1.5} size={14} /> Carrière</Link>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--text)] tracking-tight">{e.firstName} {e.lastName}</h1>
          <p className="text-[var(--text-secondary)] text-sm sm:text-base">{[e.position, e.department, e.echelon].filter(Boolean).join(' · ')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={bp(`/performance/competences/employe/${e.id}`)}
            className="px-4 py-2.5 rounded-xl border border-[var(--border)] font-semibold text-[var(--text)] hover:bg-[var(--surface-2)] flex items-center gap-2 text-sm"><GraduationCap strokeWidth={1.5} size={16} /> Compétences</Link>
          {career.canPropose && (
            <button onClick={() => setPropose(true)} className="px-4 py-2.5 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand)] text-[var(--on-brand)] font-semibold shadow-lg flex items-center gap-2 text-sm"><TrendingUp strokeWidth={1.5} size={16} /> Proposer un avancement</button>
          )}
        </div>
      </div>

      {notice && (
        <div className="rounded-xl bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] text-[var(--success-text)] text-sm p-4 flex items-start justify-between gap-2">
          <span className="flex items-start gap-2"><CheckCircle2 strokeWidth={1.5} size={16} className="mt-0.5 shrink-0" /> {notice}</span>
          <button onClick={() => setNotice(null)} aria-label="Fermer"><X strokeWidth={1.5} size={14} /></button>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto">
        {([['parcours', 'Parcours', <Route strokeWidth={1.5} key="r" size={16} />], ['plan', 'Plan de développement', <Target strokeWidth={1.5} key="t" size={16} />]] as const).map(([k, label, icon]) => (
          <button key={k} onClick={() => setTab(k as Tab)}
            className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors ${tab === k ? 'bg-[var(--brand)] text-[var(--on-brand)] shadow-lg' : 'bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)]'}`}>
            {icon} {label}
          </button>
        ))}
      </div>

      {tab === 'parcours' ? (
        <div className="space-y-4">
          {career.canEdit && (
            <button onClick={() => setAddEvent(true)} className="px-4 py-2.5 rounded-xl border border-[var(--border)] font-semibold text-[var(--text)] hover:bg-[var(--surface-2)] flex items-center gap-2 text-sm"><Plus strokeWidth={1.5} size={16} /> Ajouter un événement</button>
          )}
          <CareerTimeline items={career.items} onChanged={load} />
        </div>
      ) : plans && (
        <DevelopmentPlans data={plans} canEdit={!!plans.canEdit} onChanged={load} />
      )}

      <AnimatePresence>
        {addEvent && <EventModal employeeId={e.id} onClose={() => setAddEvent(false)} onDone={load} />}
        {propose && <ProposalModal employees={[{ id: e.id, firstName: e.firstName, lastName: e.lastName, position: e.position }]} employeeId={e.id}
          onClose={() => setPropose(false)} onDone={() => setNotice("Proposition envoyée à la RH. Elle reste confidentielle jusqu'à la décision.")} />}
      </AnimatePresence>
    </div>
  );
}


export default function EmployeeCareerPageWithFrame() {
  return (
    <ModulePageFrame kind="detail">
      <EmployeeCareerPage />
    </ModulePageFrame>
  );
}
