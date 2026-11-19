'use client';
import { PerformanceOverlay } from '@/components/performance/PerformanceOverlay';
import { ModuleSelect } from '@/components/ui/ModuleSelect';


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
import { KonzaLoader } from '@/components/ui/KonzaLoader';
import { PerformanceFrame as ModulePageFrame } from '@/components/performance/PerformanceFrame';

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
  'w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--focus)] focus:border-[var(--border)]';
const cardCls = 'bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm';

// ─── Rattachement à une évaluation ───────────────────────────────────────────
function LinkBadge({ g }: { g: Goal }) {
  if (g.evaluatedInReview)
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[var(--brand-soft)] text-[var(--action)]"><Link2 strokeWidth={1.5} size={11} /> Évalué dans « {g.evaluatedInReview.period} »</span>;
  if (g.plannedInReview)
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[var(--brand-soft)] text-[var(--action)]"><Clock strokeWidth={1.5} size={11} /> Fixé pour la prochaine évaluation</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[var(--surface-2)] text-[var(--text-secondary)]"><Clock strokeWidth={1.5} size={11} /> Sera repris au prochain cycle</span>;
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
        <span className="font-medium text-[var(--text)] break-words min-w-0">{kr.title}</span>
        <span className="text-[var(--text-secondary)] shrink-0 text-xs pt-0.5">cible : {target} {kr.unit}</span>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <div className="flex-1 h-2.5 bg-[var(--surface-2)] rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-[var(--green)]' : 'bg-[var(--brand)]'}`} style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs font-semibold text-[var(--text-secondary)] w-10 text-right">{pct} %</span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <label className="text-xs text-[var(--text-secondary)]">Valeur actuelle</label>
        <input type="number" inputMode="decimal" min={0} className={`${inputCls} !w-28 !py-2`} value={value}
          onChange={e => setValue(e.target.value)} onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} />
        {saving && <Loader2 strokeWidth={1.5} size={14} className="animate-spin text-[var(--action)]" />}
      </div>
      {error && <p className="text-xs text-[var(--danger-text)] mt-1">{error}</p>}
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
        <span className="font-medium text-[var(--text)]">Progression</span>
        <span className="font-semibold text-[var(--action)] flex items-center gap-1.5">{saving && <Loader2 strokeWidth={1.5} size={12} className="animate-spin" />}{value} %</span>
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
    <PerformanceOverlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[rgb(0_0_0_/.45)] sm:p-4" onClose={onClose}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} onClick={e => e.stopPropagation()}
        className="bg-[var(--surface)] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-xl shadow-2xl border border-[var(--border)] max-h-[94vh] flex flex-col performance-card">
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--brand-soft)] text-[var(--action)] rounded-xl"><Target strokeWidth={1.5} size={20} /></div>
            <h2 className="text-lg font-semibold text-[var(--text)]">Nouvel objectif</h2>
          </div>
          <button onClick={onClose} aria-label="Fermer" className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"><X strokeWidth={1.5} size={18} /></button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          <div>
            <label className="text-sm font-medium text-[var(--text)]">Assigné à *</label>
            <ModuleSelect className={`${inputCls} mt-1`} value={employeeId} onChange={e => setEmployeeId(e.target.value)}>
              <option value="">Choisir un collaborateur…</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}{e.position ? ` — ${e.position}` : ''}</option>)}
            </ModuleSelect>
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--text)]">Objectif *</label>
            <input className={`${inputCls} mt-1`} value={title} onChange={e => setTitle(e.target.value)} placeholder="ex : Réduire les retards de livraison" />
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--text)]">Description (facultatif)</label>
            <textarea rows={2} className={`${inputCls} mt-1`} value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-[var(--text)]">Début *</label>
              <input type="date" className={`${inputCls} mt-1`} value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--text)]">Échéance *</label>
              <input type="date" className={`${inputCls} mt-1`} value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="rounded-2xl bg-[var(--surface-2)] p-4 space-y-3">
            <p className="text-sm font-semibold text-[var(--text)]">Pour l'évaluation <span className="text-xs font-normal text-[var(--text-secondary)]">(facultatif)</span></p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)]">Poids (%)</label>
                <input type="number" min={0} max={100} inputMode="decimal" className={`${inputCls} mt-1`} value={weight} onChange={e => setWeight(e.target.value)} placeholder="auto" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-[var(--text-secondary)]">KPI / livrables attendus</label>
                <input className={`${inputCls} mt-1`} value={kpi} onChange={e => setKpi(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)]">Support / dépendances</label>
              <input className={`${inputCls} mt-1`} value={support} onChange={e => setSupport(e.target.value)} />
            </div>
            <p className="text-xs text-[var(--text-secondary)]">Sans poids, les objectifs d'un même employé se partagent 100 % à parts égales quand le cycle est lancé.</p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-[var(--text)] flex items-center gap-2"><TrendingUp strokeWidth={1.5} size={15} /> Comment mesurer la réussite ?</p>
            {krs.map((k, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="flex-1 min-w-0 space-y-1.5">
                  <input className={inputCls} value={k.title} onChange={e => setKr(i, { title: e.target.value })} placeholder="ex : 95 % des livraisons à l'heure" />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" min={1} inputMode="decimal" className={inputCls} value={k.target} onChange={e => setKr(i, { target: e.target.value })} placeholder="Cible" />
                    <input className={inputCls} value={k.unit} onChange={e => setKr(i, { unit: e.target.value })} placeholder="Unité (%, ventes…)" />
                  </div>
                </div>
                {krs.length > 1 && (
                  <button type="button" aria-label="Retirer" onClick={() => setKrs(prev => prev.filter((_, j) => j !== i))}
                    className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--danger-text)] hover:bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] shrink-0"><Trash2 strokeWidth={1.5} size={16} /></button>
                )}
              </div>
            ))}
            {krs.length < 5 && (
              <button type="button" onClick={() => setKrs(prev => [...prev, { title: '', target: '100', unit: '' }])}
                className="w-full py-2.5 rounded-xl border-2 border-dashed border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border)] hover:text-[var(--action)] font-semibold text-sm flex items-center justify-center gap-2">
                <Plus strokeWidth={1.5} size={16} /> Ajouter une mesure
              </button>
            )}
          </div>

          {error && <p className="text-sm text-[var(--danger-text)] bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] rounded-xl p-3 break-words">{error}</p>}
        </div>

        <div className="p-5 border-t border-[var(--border)] flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-[var(--border)] font-semibold text-[var(--text-secondary)]">Annuler</button>
          <button onClick={submit} disabled={busy || !valid}
            className="flex-1 py-3 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand)] text-[var(--on-brand)] font-semibold shadow-lg disabled:opacity-60 flex items-center justify-center gap-2">
            {busy && <Loader2 strokeWidth={1.5} size={16} className="animate-spin" />} Créer
          </button>
        </div>
      </motion.div>
    </PerformanceOverlay>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
function ObjectivesPage() {
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

  const removeGoal = async (g: Goal) => {
    const msg = g.evaluatedInReview
      ? `Supprimer l'objectif « ${g.title} » ?\nIl est rattaché à l'évaluation « ${g.evaluatedInReview.period} » (brouillon) : il sera retiré de la fiche.`
      : `Supprimer l'objectif « ${g.title} » ?`;
    if (!confirm(msg)) return;
    try { await api.delete(`/performance/goals/${g.id}`); setExpanded(null); load(); }
    catch (e: any) { alert(e?.message || 'Suppression impossible'); }
  };

  return (
    <div className="max-w-[1200px] mx-auto pb-20 space-y-6 sm:space-y-8">
      <PerformanceNav />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 performance-header">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--text)] tracking-tight">{canCreate ? 'Objectifs' : 'Mes objectifs'}</h1>
          <p className="text-[var(--text-secondary)] text-sm sm:text-base">
            {canCreate ? 'Ce que chaque personne doit atteindre' : 'Mettez à jour votre avancement'}{goals.length > 0 && ` · ${goals.length} objectif${goals.length > 1 ? 's' : ''}, ${done} atteint${done > 1 ? 's' : ''}`}
          </p>
        </div>
        {canCreate && (
          <button onClick={() => setCreating(true)}
            className="px-5 py-2.5 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand)] text-[var(--on-brand)] font-semibold shadow-lg flex items-center justify-center gap-2">
            <Plus strokeWidth={1.5} size={20} /> Nouvel objectif
          </button>
        )}
      </div>

      {error && <div className="rounded-xl bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] text-[var(--danger-text)] text-sm p-4 flex items-center gap-2"><AlertTriangle strokeWidth={1.5} size={16} /> {error}</div>}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search strokeWidth={1.5} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input className={`${inputCls} pl-9`} placeholder="Rechercher un objectif ou un employé…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {([['ALL', 'Tous'], ['OPEN', 'En cours'], ['DONE', 'Atteints']] as const).map(([k, label]) => (
            <button aria-pressed={filter === k} key={k} onClick={() => setFilter(k)}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold ${filter === k ? 'bg-[var(--brand-soft)] text-[var(--action)]' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'}`}>{label}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <KonzaLoader variant="section" />
      ) : shown.length === 0 ? (
        <div className={`${cardCls} p-12 text-center`}>
          <Target strokeWidth={1.5} size={40} className="mx-auto text-[var(--text-secondary)] mb-3" />
          <p className="font-semibold text-[var(--text)]">{goals.length === 0 ? 'Aucun objectif défini' : 'Aucun résultat'}</p>
          <p className="text-sm text-[var(--text-secondary)] mt-1">{goals.length === 0 ? (canCreate ? 'Commencez par en créer un : choisissez la personne, écrivez l\'objectif et la date limite.' : "Votre responsable n'a pas encore fixé d'objectif.") : 'Modifiez la recherche ou le filtre.'}</p>
          {goals.length === 0 && canCreate && (
            <button onClick={() => setCreating(true)} className="mt-4 px-5 py-3 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand)] text-[var(--on-brand)] font-semibold shadow-lg inline-flex items-center gap-2 min-h-[48px]"><Plus strokeWidth={1.5} size={18} /> Créer le premier objectif</button>
          )}
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
                  <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-semibold shrink-0 ${finished ? 'bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] text-[var(--success-text)]' : g.progress >= 50 ? 'bg-[var(--brand-soft)] text-[var(--action)]' : 'bg-[var(--brand-soft)] text-[var(--action)]'}`}>
                    <span className="text-lg leading-none">{g.progress}</span><span className="text-[10px] opacity-60">%</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[var(--text)] break-words">{g.title}</h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-secondary)] mt-1">
                      {g.employee && <span className="flex items-center gap-1"><User strokeWidth={1.5} size={12} /> {g.employee.firstName} {g.employee.lastName}</span>}
                      <span className={`flex items-center gap-1 ${late ? 'text-[var(--warning-text)] font-medium' : ''}`}><Calendar strokeWidth={1.5} size={12} /> {fmtDate(g.endDate)}{late ? ' · en retard' : ''}</span>
                      {w > 0 && <span className="font-semibold text-[var(--action)]">{w} %</span>}
                    </div>
                    <div className="mt-2"><LinkBadge g={g} /></div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {finished && <CheckCircle2 strokeWidth={1.5} size={20} className="text-[var(--success-text)]" />}
                    <ChevronDown strokeWidth={1.5} size={18} className={`text-[var(--text-secondary)] transition-transform ${open ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                <div className="px-4 sm:px-5 pb-3">
                  <div className="h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${finished ? 'bg-[var(--green)]' : ''}`} style={{ width: `${g.progress}%` }} />
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-[var(--border)] bg-[var(--surface-2)]">
                      <div className="p-4 sm:p-5 space-y-5">
                        {g.description && <p className="text-sm text-[var(--text-secondary)] break-words">{g.description}</p>}
                        {(g.kpi || g.support) && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            {g.kpi && <p className="text-[var(--text-secondary)] break-words"><b className="text-[var(--text)]">KPI / livrables :</b> {g.kpi}</p>}
                            {g.support && <p className="text-[var(--text-secondary)] break-words"><b className="text-[var(--text)]">Support :</b> {g.support}</p>}
                          </div>
                        )}
                        {canCreate && (
                          <div className="flex justify-end">
                            <button type="button" onClick={() => removeGoal(g)}
                              className="px-3 py-2 rounded-lg text-sm font-semibold text-[var(--danger-text)] hover:bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] flex items-center gap-2 min-h-[40px]">
                              <Trash2 strokeWidth={1.5} size={15} /> Supprimer cet objectif
                            </button>
                          </div>
                        )}
                        {g.keyResults.length > 0 ? (
                          <div className="space-y-5">
                            <h4 className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-2"><TrendingUp strokeWidth={1.5} size={13} /> Avancement</h4>
                            {g.keyResults.map(kr => <KeyResultRow key={kr.id} kr={kr} onSaved={load} />)}
                            <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5"><Check strokeWidth={1.5} size={12} /> Le pourcentage de l'objectif se calcule tout seul à partir de ces mesures.</p>
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


export default function ObjectivesPageWithFrame() {
  return (
    <ModulePageFrame kind="list">
      <ObjectivesPage />
    </ModulePageFrame>
  );
}
