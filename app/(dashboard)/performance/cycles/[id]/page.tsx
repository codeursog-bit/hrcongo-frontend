'use client';

// ============================================================================
// 📄 app/(dashboard)/performance/cycles/[id]/page.tsx
// Suivi d'un cycle : avancement, lancement (RH), clôture (RH), fiches par employé.
// ============================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Loader2, Rocket, Lock, Trash2, X, Search, ChevronRight, AlertTriangle,
  CheckCircle2, Users, RefreshCw, Info,
} from 'lucide-react';
import { api } from '@/services/api';
import PerformanceNav from '@/components/performance/PerformanceNav';
import { useBasePath } from '@/hooks/useBasePath';
import { HR_ROLES, MANAGE_ROLES, getStoredUser, fmtDate, STATUS_LABEL, scoreTone, ReviewStatus } from '@/components/performance/sheet-types';

interface CycleDetail {
  cycle: {
    id: string; name: string; type: string; startDate: string; endDate: string;
    status: 'OPEN' | 'CLOSED'; objectivesWeight: number;
    launchedAt?: string | null; template?: { id: string; name: string } | null;
  };
  progress: { total: number; draft: number; submitted: number; acknowledged: number };
  reviews: Array<{
    id: string; status: ReviewStatus; overallScore: number | string | null; verdict: string | null;
    employee: { id: string; firstName: string; lastName: string; position?: string; photoUrl?: string | null; department?: { name: string } | null };
    reviewer?: { id: string; firstName: string; lastName: string } | null;
  }>;
}

interface LaunchResult { created: number; skipped: number; carriedGoals: number; standaloneGoals: number; templateGoals: number; withoutGoals: string[] }

const inputCls =
  'w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-400';

// ─── Modal de lancement ──────────────────────────────────────────────────────
function LaunchModal({ open, cycleId, onClose, onDone }: { open: boolean; cycleId: string; onClose: () => void; onDone: () => void }) {
  const [scope, setScope] = useState<'all' | 'pick'>('all');
  const [employees, setEmployees] = useState<any[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LaunchResult | null>(null);

  useEffect(() => {
    if (!open) { setResult(null); setError(null); setScope('all'); setPicked(new Set()); return; }
    api.get<any[]>('/employees/simple').then(r => setEmployees(Array.isArray(r) ? r : [])).catch(() => setEmployees([]));
  }, [open]);

  const list = useMemo(() => {
    const q = search.toLowerCase();
    return employees.filter(e => !q || `${e.firstName} ${e.lastName} ${e.position ?? ''}`.toLowerCase().includes(q));
  }, [employees, search]);

  const toggle = (id: string) => setPicked(prev => {
    const n = new Set(prev);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });

  const launch = async () => {
    setBusy(true); setError(null);
    try {
      const res = await api.post<LaunchResult>(`/performance/cycles/${cycleId}/launch`,
        scope === 'pick' ? { employeeIds: Array.from(picked) } : {});
      setResult(res);
      onDone();
    } catch (e: any) { setError(e?.message || 'Lancement impossible'); }
    finally { setBusy(false); }
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
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{result ? 'Cycle lancé' : 'Lancer le cycle'}</h2>
              <button onClick={onClose} aria-label="Fermer" className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"><X size={18} /></button>
            </div>

            {result ? (
              <div className="p-5 space-y-4 overflow-y-auto">
                <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={22} /> <p className="font-bold">{result.created} fiche(s) créée(s)</p>
                </div>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1.5">
                  {result.skipped > 0 && <li>• {result.skipped} employé(s) avaient déjà une fiche dans ce cycle.</li>}
                  <li>• {result.carriedGoals} objectif(s) repris de la revue précédente.</li>
                  {result.standaloneGoals > 0 && <li>• {result.standaloneGoals} objectif(s) de la page Objectifs rattachés aux fiches.</li>}
                  {result.templateGoals > 0 && <li>• {result.templateGoals} objectif(s) proposés par les modèles.</li>}
                </ul>
                {result.withoutGoals.length > 0 && (
                  <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 p-4 text-sm text-amber-800 dark:text-amber-200">
                    <p className="font-bold flex items-center gap-2 mb-1"><Info size={15} /> Sans objectif pour l'instant</p>
                    <p className="break-words">{result.withoutGoals.join(', ')}</p>
                    <p className="mt-1 text-xs">Le responsable les ajoutera directement dans la fiche.</p>
                  </div>
                )}
                <button onClick={onClose} className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold">Terminer</button>
              </div>
            ) : (
              <>
                <div className="p-5 space-y-4 overflow-y-auto">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Une fiche en brouillon est créée pour chaque employé de votre périmètre (toute l'entreprise pour la RH, votre département pour un manager), avec les objectifs fixés à sa dernière évaluation et les critères de son poste. Les responsables sont notifiés.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {([['all', 'Tous (mon périmètre)'], ['pick', 'Choisir des employés']] as const).map(([k, label]) => (
                      <button key={k} onClick={() => setScope(k)}
                        className={`py-3 px-2 rounded-xl text-sm font-bold border transition-colors ${scope === k
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'}`}>
                        {label}
                      </button>
                    ))}
                  </div>

                  {scope === 'pick' && (
                    <div className="space-y-2">
                      <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input className={`${inputCls} pl-9`} placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} />
                      </div>
                      <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                        {list.map(e => (
                          <label key={e.id} className="flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750">
                            <input type="checkbox" checked={picked.has(e.id)} onChange={() => toggle(e.id)} className="w-5 h-5 accent-purple-600" />
                            <span className="text-sm text-gray-800 dark:text-gray-200 min-w-0 truncate">
                              {e.firstName} {e.lastName}{e.position ? <span className="text-gray-400"> — {e.position}</span> : null}
                            </span>
                          </label>
                        ))}
                        {list.length === 0 && <p className="p-4 text-sm text-gray-400 text-center">Aucun résultat</p>}
                      </div>
                      <p className="text-xs text-gray-400">{picked.size} sélectionné(s)</p>
                    </div>
                  )}
                  {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl p-3">{error}</p>}
                </div>
                <div className="p-5 border-t border-gray-100 dark:border-gray-700 flex gap-3">
                  <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-600 font-bold text-gray-600 dark:text-gray-300">Annuler</button>
                  <button onClick={launch} disabled={busy || (scope === 'pick' && picked.size === 0)}
                    className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-lg shadow-purple-500/20 disabled:opacity-60 flex items-center justify-center gap-2">
                    {busy ? <Loader2 size={16} className="animate-spin" /> : <Rocket size={16} />} Lancer
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function CycleDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { bp } = useBasePath();
  const router = useRouter();

  const [data, setData] = useState<CycleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [launchOpen, setLaunchOpen] = useState(false);
  const [isHR, setIsHR] = useState(false);
  const [canLaunch, setCanLaunch] = useState(false); // RH ou manager (son département)
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api.get<CycleDetail>(`/performance/cycles/${id}`));
      setError(null);
    } catch (e: any) { setError(e?.message || 'Chargement impossible'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => {
    const u = getStoredUser();
    setIsHR(!!u?.role && HR_ROLES.includes(u.role));
    setCanLaunch(!!u?.role && MANAGE_ROLES.includes(u.role));
    load();
  }, [load]);

  const close = async () => {
    if (!confirm('Clôturer ce cycle ?\nLes fiches non soumises ne pourront plus être modifiées.')) return;
    try { await api.patch(`/performance/cycles/${id}/close`, {}); load(); }
    catch (e: any) { alert(e?.message || 'Clôture impossible'); }
  };

  const removeCycle = async () => {
    if (!data) return;
    const transmitted = data.progress.submitted + data.progress.acknowledged;
    const base = `Supprimer le cycle « ${data.cycle.name} » ?\nSes ${data.progress.draft} évaluation(s) en brouillon seront supprimées (les objectifs sont conservés).`;
    if (!confirm(base)) return;
    let withReviews = false;
    if (transmitted > 0) {
      if (!confirm(`⚠ ${transmitted} évaluation(s) ont déjà été transmises aux employés.\nElles seront aussi supprimées définitivement, avec les niveaux de compétence qu'elles ont enregistrés.\n\nConfirmer la suppression complète ?`)) return;
      withReviews = true;
    }
    try {
      await api.delete(`/performance/cycles/${id}${withReviews ? '?withReviews=true' : ''}`);
      router.push(bp('/performance/cycles'));
    } catch (e: any) { alert(e?.message || 'Suppression impossible'); }
  };

  if (loading && !data) return <div className="flex justify-center py-32"><Loader2 className="animate-spin text-purple-600" size={32} /></div>;
  if (error || !data) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4">
        <AlertTriangle className="mx-auto text-amber-500" size={36} />
        <p className="text-gray-700 dark:text-gray-300">{error ?? 'Cycle introuvable'}</p>
        <Link href={bp('/performance/cycles')} className="inline-flex items-center gap-2 text-purple-600 font-bold"><ArrowLeft size={16} /> Retour</Link>
      </div>
    );
  }

  const { cycle, progress, reviews } = data;
  const pct = progress.total ? Math.round((progress.acknowledged / progress.total) * 100) : 0;
  const q = search.toLowerCase();
  const filtered = reviews.filter(r => !q || `${r.employee.firstName} ${r.employee.lastName}`.toLowerCase().includes(q));

  const tiles = [
    { label: 'Fiches', value: progress.total, cls: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600' },
    { label: 'À noter', value: progress.draft, cls: 'bg-gray-100 dark:bg-gray-700 text-gray-500' },
    { label: 'Envoyées aux employés', value: progress.submitted, cls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' },
    { label: 'Lues par les employés', value: progress.acknowledged, cls: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' },
  ];

  return (
    <div className="max-w-[1200px] mx-auto pb-20 space-y-6 sm:space-y-8">
      <PerformanceNav />
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="min-w-0">
          <Link href={bp('/performance/cycles')} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-purple-600 mb-2">
            <ArrowLeft size={14} /> Campagnes
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{cycle.name}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
            {fmtDate(cycle.startDate)} → {fmtDate(cycle.endDate)} · {cycle.status === 'OPEN' ? 'Ouvert' : 'Clôturé'}
            {cycle.template ? ` · Modèle : ${cycle.template.name}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} aria-label="Actualiser" className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-700">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          {isHR && (
            <button onClick={removeCycle}
              className="px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-900/50 font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 text-sm">
              <Trash2 size={16} /> <span className="hidden sm:inline">Supprimer</span>
            </button>
          )}
          {cycle.status === 'OPEN' && (
            <>
              {isHR && (
                <button onClick={close}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 text-sm">
                  <Lock size={16} /> <span className="hidden sm:inline">Clôturer</span>
                </button>
              )}
              {canLaunch && (
                <button onClick={() => setLaunchOpen(true)}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2">
                  <Rocket size={18} />
                  {isHR ? (cycle.launchedAt ? 'Ajouter des employés' : 'Lancer') : 'Lancer pour mon équipe'}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Avancement */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
        {tiles.map(t => (
          <div key={t.label} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 sm:p-5 shadow-sm">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${t.cls}`}><Users size={16} /></div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{t.value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.label}</p>
          </div>
        ))}
      </div>
      {progress.total > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium text-gray-700 dark:text-gray-300">Évaluations réceptionnées</span>
            <span className="font-bold text-emerald-600">{pct} %</span>
          </div>
          <div className="h-2.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {/* Fiches */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Fiches</h2>
          <div className="relative w-full max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className={`${inputCls} pl-9`} placeholder="Rechercher un employé…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-10 text-center text-sm text-gray-500">
            {reviews.length === 0 ? (canLaunch ? 'Aucune fiche : lancez le cycle pour les créer.' : 'Aucune fiche dans votre périmètre.') : 'Aucun résultat.'}
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map(r => {
              const st = STATUS_LABEL[r.status];
              const score = Number(r.overallScore ?? 0);
              const initials = `${r.employee.firstName[0] ?? ''}${r.employee.lastName[0] ?? ''}`.toUpperCase();
              return (
                <Link key={r.id} href={bp(`/performance/fiche/${r.id}`)}
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 flex items-center gap-3 sm:gap-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-400 to-purple-700 flex items-center justify-center font-bold text-white text-sm shrink-0">
                    {r.employee.photoUrl ? <img referrerPolicy="no-referrer" src={r.employee.photoUrl} alt="" className="w-full h-full rounded-full object-cover" /> : initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 dark:text-white truncate">{r.employee.firstName} {r.employee.lastName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {[r.employee.position, r.employee.department?.name].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  {score > 0 && (
                    <span className={`px-2.5 py-1 rounded-lg text-sm font-bold shrink-0 ${scoreTone(score)}`}>{score.toFixed(1)}</span>
                  )}
                  <span className={`hidden sm:inline px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 ${st.cls}`}>{st.label}</span>
                  <ChevronRight size={18} className="text-gray-400 shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <LaunchModal open={launchOpen} cycleId={id} onClose={() => setLaunchOpen(false)} onDone={load} />
    </div>
  );
}