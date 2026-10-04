'use client';

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

type Tab = 'parcours' | 'plan';

const inputCls =
  'w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-400';

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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4" onClick={onClose}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg shadow-2xl border border-gray-100 dark:border-gray-700 max-h-[94vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Ajouter un événement</h2>
          <button onClick={onClose} aria-label="Fermer" className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto">
          <p className="text-xs text-gray-500">Pour reconstituer un historique antérieur à l'application. Les embauches, passages d'échelon, formations et évaluations sont ajoutés automatiquement.</p>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
            <select className={`${inputCls} mt-1`} value={type} onChange={e => setType(e.target.value)}>
              {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date d'effet</label>
              <input type="date" className={`${inputCls} mt-1`} value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Intitulé</label>
              <input className={`${inputCls} mt-1`} value={title} onChange={e => setTitle(e.target.value)} placeholder="ex : Passage chauffeur PL" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Avant (facultatif)</label>
              <input className={`${inputCls} mt-1`} value={from} onChange={e => setFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Après (facultatif)</label>
              <input className={`${inputCls} mt-1`} value={to} onChange={e => setTo(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Note interne <span className="text-xs font-normal text-gray-400">(jamais visible par l'employé)</span></label>
            <textarea rows={2} className={`${inputCls} mt-1`} value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl p-3 break-words">{error}</p>}
        </div>
        <div className="p-5 border-t border-gray-100 dark:border-gray-700 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-600 font-bold text-gray-600 dark:text-gray-300">Annuler</button>
          <button onClick={save} disabled={busy || !title.trim()}
            className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-lg shadow-purple-500/20 disabled:opacity-60 flex items-center justify-center gap-2">
            {busy && <Loader2 size={16} className="animate-spin" />} Enregistrer
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function EmployeeCareerPage() {
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

  if (loading) return <div className="flex justify-center py-32"><Loader2 className="animate-spin text-purple-600" size={32} /></div>;
  if (error || !career?.employee) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4">
        <AlertTriangle className="mx-auto text-amber-500" size={36} />
        <p className="text-gray-700 dark:text-gray-300">{error ?? 'Introuvable'}</p>
        <Link href={bp('/performance/carriere')} className="inline-flex items-center gap-2 text-purple-600 font-bold"><ArrowLeft size={16} /> Retour</Link>
      </div>
    );
  }

  const e = career.employee;

  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-6">
      <PerformanceNav />
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="min-w-0">
          <Link href={bp('/performance/carriere')} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-purple-600 mb-2"><ArrowLeft size={14} /> Carrière</Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{e.firstName} {e.lastName}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">{[e.position, e.department, e.echelon].filter(Boolean).join(' · ')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={bp(`/performance/competences/employe/${e.id}`)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 text-sm"><GraduationCap size={16} /> Compétences</Link>
          {career.canPropose && (
            <button onClick={() => setPropose(true)} className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-lg shadow-purple-500/20 flex items-center gap-2 text-sm"><TrendingUp size={16} /> Proposer un avancement</button>
          )}
        </div>
      </div>

      {notice && (
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-sm p-4 flex items-start justify-between gap-2">
          <span className="flex items-start gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0" /> {notice}</span>
          <button onClick={() => setNotice(null)} aria-label="Fermer"><X size={14} /></button>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto">
        {([['parcours', 'Parcours', <Route key="r" size={16} />], ['plan', 'Plan de développement', <Target key="t" size={16} />]] as const).map(([k, label, icon]) => (
          <button key={k} onClick={() => setTab(k as Tab)}
            className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors ${tab === k ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-700'}`}>
            {icon} {label}
          </button>
        ))}
      </div>

      {tab === 'parcours' ? (
        <div className="space-y-4">
          {career.canEdit && (
            <button onClick={() => setAddEvent(true)} className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 text-sm"><Plus size={16} /> Ajouter un événement</button>
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