'use client';

// ============================================================================
// 📄 app/(dashboard)/performance/cycles/page.tsx
// Campagnes d'évaluation : liste + création (RH). Les managers peuvent consulter.
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Loader2, X, Calendar, Users, ChevronRight, ArrowLeft, RefreshCw,
  CheckCircle2, Lock, Layers, AlertTriangle,
} from 'lucide-react';
import { api } from '@/services/api';
import PerformanceNav from '@/components/performance/PerformanceNav';
import { useBasePath } from '@/hooks/useBasePath';
import { HR_ROLES, getStoredUser, fmtDate } from '@/components/performance/sheet-types';

interface Cycle {
  id: string; name: string; type: string; startDate: string; endDate: string;
  status: 'OPEN' | 'CLOSED'; objectivesWeight: number;
  launchedAt?: string | null;
  _count?: { reviews: number };
  template?: { id: string; name: string } | null;
}

const TYPES: Record<string, string> = {
  QUARTERLY: 'Trimestrielle', ANNUAL: 'Annuelle', PROBATION: "Fin d'essai", EXCEPTIONAL: 'Exceptionnelle',
};

const inputCls =
  'w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-400';

/** Trimestre en cours : nom + dates par défaut */
function currentQuarter() {
  const now = new Date();
  const q = Math.floor(now.getMonth() / 3);
  const y = now.getFullYear();
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return {
    name: `T${q + 1} ${y}`,
    start: iso(new Date(y, q * 3, 1)),
    end: iso(new Date(y, q * 3 + 3, 0)),
  };
}

// ─── Modal de création ───────────────────────────────────────────────────────
function CreateCycleModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const q = currentQuarter();
  const [name, setName] = useState(q.name);
  const [type, setType] = useState('QUARTERLY');
  const [start, setStart] = useState(q.start);
  const [end, setEnd] = useState(q.end);
  const [objW, setObjW] = useState(80);
  const [templateId, setTemplateId] = useState('');
  const [templates, setTemplates] = useState<Array<{ id: string; name: string; jobTitle?: string | null }>>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    api.get<{ custom: any[] }>('/performance/templates')
      .then(r => setTemplates(r.custom ?? []))
      .catch(() => setTemplates([]));
  }, [open]);

  const submit = async () => {
    setSaving(true); setError(null);
    try {
      await api.post('/performance/cycles', {
        name, type, startDate: start, endDate: end,
        objectivesWeight: objW,
        templateId: templateId || null,
      });
      onCreated(); onClose();
    } catch (e: any) { setError(e?.message || 'Création impossible'); }
    finally { setSaving(false); }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4" onClick={onClose}>
          <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg shadow-2xl border border-gray-100 dark:border-gray-700 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Nouvelle campagne d'évaluation</h2>
              <button onClick={onClose} aria-label="Fermer" className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"><X size={18} /></button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nom de la campagne</label>
                <input className={`${inputCls} mt-1`} value={name} onChange={e => setName(e.target.value)} placeholder="ex : T4 2026" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {Object.entries(TYPES).map(([k, label]) => (
                    <button key={k} type="button" onClick={() => setType(k)}
                      className={`py-2.5 rounded-xl text-sm font-bold border transition-colors ${type === k
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Début</label>
                  <input type="date" className={`${inputCls} mt-1`} value={start} onChange={e => setStart(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Fin</label>
                  <input type="date" className={`${inputCls} mt-1`} value={end} onChange={e => setEnd(e.target.value)} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Comment calculer la note finale ?</label>
                  <span className="text-sm font-bold text-purple-600">{objW} % / {100 - objW} %</span>
                </div>
                <input type="range" min={0} max={100} step={5} value={objW} onChange={e => setObjW(Number(e.target.value))}
                  className="w-full h-3 mt-2 accent-purple-600" />
                <p className="text-xs text-gray-500 mt-1">{objW} % de la note = objectifs atteints · {100 - objW} % = critères de la grille (qualité du travail, comportement…)</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Grille de notation</label>
                <select className={`${inputCls} mt-1`} value={templateId} onChange={e => setTemplateId(e.target.value)}>
                  <option value="">Grille standard (5 critères)</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}{t.jobTitle ? ` — ${t.jobTitle}` : ''}</option>)}
                </select>
                <p className="text-xs text-gray-500 mt-1">Si vous avez créé une grille pour un poste précis (ex : chauffeur), elle est utilisée automatiquement pour les employés de ce poste.</p>
              </div>

              {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl p-3">{error}</p>}
            </div>

            <div className="p-5 border-t border-gray-100 dark:border-gray-700 flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-600 font-bold text-gray-600 dark:text-gray-300">Annuler</button>
              <button onClick={submit} disabled={saving || !name.trim()}
                className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-lg shadow-purple-500/20 disabled:opacity-60 flex items-center justify-center gap-2">
                {saving && <Loader2 size={16} className="animate-spin" />} Créer
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function CyclesPage() {
  const { bp } = useBasePath();
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [isHR, setIsHR] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCycles(await api.get<Cycle[]>('/performance/cycles'));
      setError(null);
    } catch (e: any) { setError(e?.message || 'Chargement impossible'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const u = getStoredUser();
    setIsHR(!!u?.role && HR_ROLES.includes(u.role));
    load();
  }, [load]);

  return (
    <div className="max-w-[1200px] mx-auto pb-20 space-y-6 sm:space-y-8">
      <PerformanceNav />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href={bp('/performance')} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-purple-600 mb-2">
            <ArrowLeft size={14} /> Performance
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Campagnes d'évaluation</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">Une campagne prépare automatiquement une évaluation pour chaque employé</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} aria-label="Actualiser" className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-700">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <Link href={bp('/performance/modeles')}
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 text-sm">
            <Layers size={16} /> <span className="hidden sm:inline">Grilles</span>
          </Link>
          {isHR && (
            <button onClick={() => setCreateOpen(true)}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2">
              <Plus size={20} /> Nouvelle campagne
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm p-4 flex items-center gap-2">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {loading && cycles.length === 0 ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-purple-600" size={28} /></div>
      ) : cycles.length === 0 && !error ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-10 text-center">
          <Calendar className="mx-auto text-gray-300 mb-3" size={36} />
          <p className="font-bold text-gray-900 dark:text-white">Aucune campagne pour le moment</p>
          <p className="text-sm text-gray-500 mt-1">{isHR ? 'Créez votre première campagne : par exemple le trimestre en cours. Ensuite, cliquez sur « Lancer ».' : "La RH n'a pas encore créé de campagne."}</p>
          {isHR && <button onClick={() => setCreateOpen(true)} className="mt-4 px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-lg shadow-purple-500/20 inline-flex items-center gap-2 min-h-[48px]"><Plus size={18} /> Créer la première campagne</button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {cycles.map(c => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Link href={bp(`/performance/cycles/${c.id}`)}
                className="block bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors h-full">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">{c.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{TYPES[c.type] ?? c.type}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 ${c.status === 'OPEN'
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                    {c.status === 'OPEN' ? <CheckCircle2 size={12} /> : <Lock size={12} />}
                    {c.status === 'OPEN' ? 'Ouvert' : 'Clôturé'}
                  </span>
                </div>
                <div className="mt-4 space-y-1.5 text-sm text-gray-500 dark:text-gray-400">
                  <p className="flex items-center gap-2"><Calendar size={14} /> {fmtDate(c.startDate)} → {fmtDate(c.endDate)}</p>
                  <p className="flex items-center gap-2"><Users size={14} /> {c._count?.reviews ?? 0} fiche(s){!c.launchedAt && ' · pas encore lancé'}</p>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="text-gray-400">Note = {c.objectivesWeight} % objectifs + {100 - c.objectivesWeight} % critères</span>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      <CreateCycleModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={load} />
    </div>
  );
}