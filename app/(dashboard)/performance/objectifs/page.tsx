'use client';

// ============================================================================
// 📄 app/(dashboard)/performance/objectifs/page.tsx
// Objectifs (OKR) — version intégrée au module performance :
//  • RH / manager : créent des objectifs (poids, KPI, support, résultats clés)
//    pour les employés de leur périmètre
//  • Employé : voit ses objectifs et met à jour ses résultats clés ; la
//    progression de l'objectif se recalcule toute seule
//  • Chaque objectif indique à quelle évaluation il est rattaché ; au lancement
//    d'un cycle, les objectifs qui couvrent la période entrent dans la fiche
// ============================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus, Target, ChevronDown, Loader2, X, User, TrendingUp, Search, Calendar,
  CheckCircle2, Link2, Clock, Trash2, AlertTriangle, Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';
import PerformanceNav from '@/components/performance/PerformanceNav';
import { MANAGE_ROLES, getStoredUser, fmtDate } from '@/components/performance/sheet-types';

interface KeyResult { id: string; title: string; targetValue: number | string; currentValue: number | string; unit?: string | null }
interface Goal {
  id: string; title: string; description?: string | null; kpi?: string | null; support?: string | null;
  weight?: number | string | null; progress: number; status: string; startDate: string; endDate: string;
  keyResults: KeyResult[];
  employee?: { firstName: string; lastName: string; photoUrl?: string | null };
  employeeId: string;
  evaluatedInReview?: { id: string; period: string; status: string } | null;
  plannedInReview?: { id: string; period: string; status: string } | null;
}

type Filter = 'ALL' | 'OPEN' | 'DONE';

const inputCls =
  'w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-400';
const cardCls = 'bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm';

// ─── Rattachement à une évaluation ───────────────────────────────────────────
function LinkBadge({ g }: { g: Goal }) {
  if (g.evaluatedInReview)
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"><Link2 size={11} /> Évalué dans « {g.evaluatedInReview.period} »</span>;
  if (g.plannedInReview)
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"><Clock size={11} /> Fixé pour la prochaine évaluation</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-500"><Clock size={11} /> Sera repris au prochain cycle</span>;
}

// ─── Un résultat clé : valeur modifiable ─────────────────────────────────────
function KeyResultRow({ kr, onSaved }: { kr: KeyResult; onSaved: () => void }) {
  const target = Number(kr.targetValue);
  const [value, setValue] = useState(String(Number(kr.currentValue)));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setValue(String(Number(kr.currentValue))); }, [kr.currentValue]);

  const pct = target > 0 ? Math.min(100, Math.round((Number(value) / target) * 100)) : 0;

  const commit = async () => {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) { setError('Valeur invalide'); setValue(String(Number(kr.currentValue))); return; }
    if (n === Number(kr.currentValue)) return;
    setSaving(true); setError(null);
    try { await api.patch(`/performance/goals/key-results/${kr.id}`, { currentValue: n }); onSaved(); }
    catch (e: any) { setError(e?.message || 'Mise à jour impossible'); setValue(String(Number(kr.currentValue))); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-3 text-sm">
        <span className="font-medium text-gray-800 dark:text-gray-200 break-words min-w-0">{kr.title}</span>
        <span className="text-gray-400 shrink-0 text-xs pt-0.5">cible : {target} {kr.unit}</span>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <div className="flex-1 h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-emerald-500' : 'bg-purple-600'}`} style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs font-bold text-gray-500 w-10 text-right">{pct} %</span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <label className="text-xs text-gray-500">Valeur actuelle</label>
        <input type="number" inputMode="decimal" min={0} className={`${inputCls} !w-28 !py-2`} value={value}
          onChange={e => setValue(e.target.value)} onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} />
        {saving && <Loader2 size={14} className="animate-spin text-purple-600" />}
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// ─── Progression directe (objectif sans résultat clé) ───────────────────────
function ProgressSlider({ goal, onSaved }: { goal: Goal; onSaved: () => void }) {
  const [value, setValue] = useState(goal.progress);
  const [saving, setSaving] = useState(false);
  useEffect(() => { setValue(goal.progress); }, [goal.progress]);
  const commit = async () => {
    if (value === goal.progress) return;
    setSaving(true);
    try { await api.patch(`/performance/goals/${goal.id}/progress`, { progress: value }); onSaved(); }
    catch { setValue(goal.progress); }
    finally { setSaving(false); }
  };
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="font-medium text-gray-700 dark:text-gray-300">Progression</span>
        <span className="font-bold text-purple-600 flex items-center gap-1.5">{saving && <Loader2 size={12} className="animate-spin" />}{value} %</span>
      </div>
      <input type="range" min={0} max={100} step={5} value={value} onChange={e => setValue(Number(e.target.value))}
        onPointerUp={commit} onKeyUp={commit} onBlur={commit} aria-label="Progression" className="w-full h-3 accent-purple-600 cursor-pointer" />
    </div>
  );
}

// ─── Création ────────────────────────────────────────────────────────────────
interface NewKR { title: string; target: string; unit: string }

function CreateModal({ employees, onClose, onDone }: {
  employees: Array<{ id: string; firstName: string; lastName: string; position?: string }>;
  onClose: () => void; onDone: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [employeeId, setEmployeeId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState('');
  const [weight, setWeight] = useState('');
  const [kpi, setKpi] = useState('');
  const [support, setSupport] = useState('');
  const [krs, setKrs] = useState<NewKR[]>([{ title: 'Objectif principal', target: '100', unit: '%' }]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setKr = (i: number, p: Partial<NewKR>) => setKrs(prev => prev.map((k, j) => (j === i ? { ...k, ...p } : k)));
  const valid = employeeId && title.trim() && endDate && endDate >= startDate &&
    krs.every(k => k.title.trim() && Number(k.target) > 0);

  const submit = async () => {
    setBusy(true); setError(null);
    try {
      await api.post('/performance/goals', {
        employeeId, title: title.trim(), description: description.trim() || undefined,
        startDate, endDate,
        ...(weight !== '' && { weight: Number(weight) }),
        kpi: kpi.trim() || undefined, support: support.trim() || undefined,
        keyResults: krs.map(k => ({ title: k.title.trim(), target: Number(k.target), unit: k.unit.trim() || undefined, current: 0 })),
      });
      onDone(); onClose();
    } catch (e: any) { setError(e?.message || 'Création impossible'); }
    finally { setBusy(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4" onClick={onClose}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-xl shadow-2xl border border-gray-100 dark:border-gray-700 max-h-[94vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-xl"><Target size={20} /></div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Nouvel objectif</h2>
          </div>
          <button onClick={onClose} aria-label="Fermer" className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Assigné à *</label>
            <select className={`${inputCls} mt-1`} value={employeeId} onChange={e => setEmployeeId(e.target.value)}>
              <option value="">Choisir un collaborateur…</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}{e.position ? ` — ${e.position}` : ''}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Objectif *</label>
            <input className={`${inputCls} mt-1`} value={title} onChange={e => setTitle(e.target.value)} placeholder="ex : Réduire les retards de livraison" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description (facultatif)</label>
            <textarea rows={2} className={`${inputCls} mt-1`} value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Début *</label>
              <input type="date" className={`${inputCls} mt-1`} value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Échéance *</label>
              <input type="date" className={`${inputCls} mt-1`} value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="rounded-2xl bg-gray-50 dark:bg-gray-900/40 p-4 space-y-3">
            <p className="text-sm font-bold text-gray-900 dark:text-white">Pour l'évaluation <span className="text-xs font-normal text-gray-400">(facultatif)</span></p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500">Poids (%)</label>
                <input type="number" min={0} max={100} inputMode="decimal" className={`${inputCls} mt-1`} value={weight} onChange={e => setWeight(e.target.value)} placeholder="auto" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-gray-500">KPI / livrables attendus</label>
                <input className={`${inputCls} mt-1`} value={kpi} onChange={e => setKpi(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Support / dépendances</label>
              <input className={`${inputCls} mt-1`} value={support} onChange={e => setSupport(e.target.value)} />
            </div>
            <p className="text-xs text-gray-400">Sans poids, les objectifs d'un même employé se partagent 100 % à parts égales quand le cycle est lancé.</p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2"><TrendingUp size={15} /> Résultats clés</p>
            {krs.map((k, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="flex-1 min-w-0 space-y-1.5">
                  <input className={inputCls} value={k.title} onChange={e => setKr(i, { title: e.target.value })} placeholder="Résultat mesurable" />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" min={1} inputMode="decimal" className={inputCls} value={k.target} onChange={e => setKr(i, { target: e.target.value })} placeholder="Cible" />
                    <input className={inputCls} value={k.unit} onChange={e => setKr(i, { unit: e.target.value })} placeholder="Unité (%, ventes…)" />
                  </div>
                </div>
                {krs.length > 1 && (
                  <button type="button" aria-label="Retirer" onClick={() => setKrs(prev => prev.filter((_, j) => j !== i))}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0"><Trash2 size={16} /></button>
                )}
              </div>
            ))}
            {krs.length < 5 && (
              <button type="button" onClick={() => setKrs(prev => [...prev, { title: '', target: '100', unit: '' }])}
                className="w-full py-2.5 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-600 text-gray-500 hover:border-purple-400 hover:text-purple-600 font-bold text-sm flex items-center justify-center gap-2">
                <Plus size={16} /> Ajouter un résultat clé
              </button>
            )}
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl p-3 break-words">{error}</p>}
        </div>

        <div className="p-5 border-t border-gray-100 dark:border-gray-700 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-600 font-bold text-gray-600 dark:text-gray-300">Annuler</button>
          <button onClick={submit} disabled={busy || !valid}
            className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-lg shadow-purple-500/20 disabled:opacity-60 flex items-center justify-center gap-2">
            {busy && <Loader2 size={16} className="animate-spin" />} Créer
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function ObjectivesPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canCreate, setCanCreate] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('ALL');

  const load = useCallback(async () => {
    try {
      const data = await api.get<Goal[]>('/performance/goals');
      setGoals(Array.isArray(data) ? data : []);
      setError(null);
    } catch (e: any) { setError(e?.message || 'Chargement impossible'); setGoals([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const u = getStoredUser();
    const manage = !!u?.role && MANAGE_ROLES.includes(u.role);
    setCanCreate(manage);
    load();
    if (manage) {
      api.get<any[]>('/employees/simple').then(r => setEmployees(Array.isArray(r) ? r : [])).catch(() => setEmployees([]));
    }
  }, [load]);

  const shown = useMemo(() => {
    const q = search.toLowerCase();
    return goals.filter(g => {
      if (filter === 'OPEN' && g.progress >= 100) return false;
      if (filter === 'DONE' && g.progress < 100) return false;
      if (!q) return true;
      return `${g.title} ${g.employee?.firstName ?? ''} ${g.employee?.lastName ?? ''}`.toLowerCase().includes(q);
    });
  }, [goals, search, filter]);

  const done = goals.filter(g => g.progress >= 100).length;

  return (
    <div className="max-w-[1200px] mx-auto pb-20 space-y-6 sm:space-y-8">
      <PerformanceNav />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Objectifs (OKR)</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
            Alignement et suivi{goals.length > 0 && ` · ${goals.length} objectif${goals.length > 1 ? 's' : ''}, ${done} atteint${done > 1 ? 's' : ''}`}
          </p>
        </div>
        {canCreate && (
          <button onClick={() => setCreating(true)}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2">
            <Plus size={20} /> Nouvel objectif
          </button>
        )}
      </div>

      {error && <div className="rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm p-4 flex items-center gap-2"><AlertTriangle size={16} /> {error}</div>}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className={`${inputCls} pl-9`} placeholder="Rechercher un objectif ou un employé…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {([['ALL', 'Tous'], ['OPEN', 'En cours'], ['DONE', 'Atteints']] as const).map(([k, label]) => (
            <button key={k} onClick={() => setFilter(k)}
              className={`px-3.5 py-2 rounded-lg text-sm font-bold ${filter === k ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>{label}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-purple-600" size={32} /></div>
      ) : shown.length === 0 ? (
        <div className={`${cardCls} p-12 text-center`}>
          <Target size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="font-bold text-gray-900 dark:text-white">{goals.length === 0 ? 'Aucun objectif défini' : 'Aucun résultat'}</p>
          <p className="text-sm text-gray-500 mt-1">{goals.length === 0 ? (canCreate ? 'Fixez des objectifs clairs à vos équipes.' : "Votre responsable n'a pas encore fixé d'objectif.") : 'Modifiez la recherche ou le filtre.'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {shown.map(g => {
            const open = expanded === g.id;
            const finished = g.progress >= 100;
            const w = g.weight !== null && g.weight !== undefined ? Number(g.weight) : 0;
            const late = !finished && new Date(g.endDate) < new Date();
            return (
              <motion.div key={g.id} layout className={`${cardCls} overflow-hidden`}>
                <button type="button" onClick={() => setExpanded(open ? null : g.id)} aria-expanded={open}
                  className="w-full text-left p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-bold shrink-0 ${finished ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : g.progress >= 50 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'}`}>
                    <span className="text-lg leading-none">{g.progress}</span><span className="text-[10px] opacity-60">%</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white break-words">{g.title}</h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mt-1">
                      {g.employee && <span className="flex items-center gap-1"><User size={12} /> {g.employee.firstName} {g.employee.lastName}</span>}
                      <span className={`flex items-center gap-1 ${late ? 'text-amber-600 font-medium' : ''}`}><Calendar size={12} /> {fmtDate(g.endDate)}{late ? ' · en retard' : ''}</span>
                      {w > 0 && <span className="font-bold text-purple-600">{w} %</span>}
                    </div>
                    <div className="mt-2"><LinkBadge g={g} /></div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {finished && <CheckCircle2 size={20} className="text-emerald-500" />}
                    <ChevronDown size={18} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                <div className="px-4 sm:px-5 pb-3">
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${finished ? 'bg-emerald-500' : 'bg-gradient-to-r from-purple-500 to-indigo-500'}`} style={{ width: `${g.progress}%` }} />
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-black/20">
                      <div className="p-4 sm:p-5 space-y-5">
                        {g.description && <p className="text-sm text-gray-600 dark:text-gray-300 break-words">{g.description}</p>}
                        {(g.kpi || g.support) && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            {g.kpi && <p className="text-gray-600 dark:text-gray-300 break-words"><b className="text-gray-900 dark:text-white">KPI / livrables :</b> {g.kpi}</p>}
                            {g.support && <p className="text-gray-600 dark:text-gray-300 break-words"><b className="text-gray-900 dark:text-white">Support :</b> {g.support}</p>}
                          </div>
                        )}
                        {g.keyResults.length > 0 ? (
                          <div className="space-y-5">
                            <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider flex items-center gap-2"><TrendingUp size={13} /> Résultats clés</h4>
                            {g.keyResults.map(kr => <KeyResultRow key={kr.id} kr={kr} onSaved={load} />)}
                            <p className="text-xs text-gray-400 flex items-center gap-1.5"><Check size={12} /> La progression de l'objectif se calcule à partir des résultats clés.</p>
                          </div>
                        ) : (
                          <ProgressSlider goal={g} onSaved={load} />
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {creating && <CreateModal employees={employees} onClose={() => setCreating(false)} onDone={load} />}
      </AnimatePresence>
    </div>
  );
}