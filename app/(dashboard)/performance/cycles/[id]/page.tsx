'use client';
import { PerformanceOverlay } from '@/components/performance/PerformanceOverlay';


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
import { KonzaLoader } from '@/components/ui/KonzaLoader';
import { PerformanceFrame as ModulePageFrame } from '@/components/performance/PerformanceFrame';

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
  'w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--focus)] focus:border-[var(--border)]';

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
        <PerformanceOverlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[rgb(0_0_0_/.45)] sm:p-4" onClose={onClose}>
          <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="bg-[var(--surface)] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg shadow-2xl border border-[var(--border)] max-h-[92vh] flex flex-col performance-card">
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
              <h2 className="text-lg font-semibold text-[var(--text)]">{result ? 'Cycle lancé' : 'Lancer le cycle'}</h2>
              <button onClick={onClose} aria-label="Fermer" className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"><X strokeWidth={1.5} size={18} /></button>
            </div>

            {result ? (
              <div className="p-5 space-y-4 overflow-y-auto">
                <div className="flex items-center gap-3 text-[var(--success-text)]">
                  <CheckCircle2 strokeWidth={1.5} size={22} /> <p className="font-semibold">{result.created} fiche(s) créée(s)</p>
                </div>
                <ul className="text-sm text-[var(--text-secondary)] space-y-1.5">
                  {result.skipped > 0 && <li>• {result.skipped} employé(s) avaient déjà une fiche dans ce cycle.</li>}
                  <li>• {result.carriedGoals} objectif(s) repris de la revue précédente.</li>
                  {result.standaloneGoals > 0 && <li>• {result.standaloneGoals} objectif(s) de la page Objectifs rattachés aux fiches.</li>}
                  {result.templateGoals > 0 && <li>• {result.templateGoals} objectif(s) proposés par les modèles.</li>}
                </ul>
                {result.withoutGoals.length > 0 && (
                  <div className="rounded-xl bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] border border-[var(--border)] p-4 text-sm text-[var(--warning-text)]">
                    <p className="font-semibold flex items-center gap-2 mb-1"><Info strokeWidth={1.5} size={15} /> Sans objectif pour l'instant</p>
                    <p className="break-words">{result.withoutGoals.join(', ')}</p>
                    <p className="mt-1 text-xs">Le responsable les ajoutera directement dans la fiche.</p>
                  </div>
                )}
                <button onClick={onClose} className="w-full py-3 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand)] text-[var(--on-brand)] font-semibold">Terminer</button>
              </div>
            ) : (
              <>
                <div className="p-5 space-y-4 overflow-y-auto">
                  <p className="text-sm text-[var(--text-secondary)]">
                    Une fiche en brouillon est créée pour chaque employé de votre périmètre (toute l'entreprise pour la RH, votre département pour un manager), avec les objectifs fixés à sa dernière évaluation et les critères de son poste. Les responsables sont notifiés.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {([['all', 'Tous (mon périmètre)'], ['pick', 'Choisir des employés']] as const).map(([k, label]) => (
                      <button key={k} onClick={() => setScope(k)}
                        className={`py-3 px-2 rounded-xl text-sm font-semibold border transition-colors ${scope === k
                          ? 'bg-[var(--brand)] text-[var(--on-brand)] border-[var(--border)]'
                          : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)]'}`}>
                        {label}
                      </button>
                    ))}
                  </div>

                  {scope === 'pick' && (
                    <div className="space-y-2">
                      <div className="relative">
                        <Search strokeWidth={1.5} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                        <input className={`${inputCls} pl-9`} placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} />
                      </div>
                      <div className="max-h-64 overflow-y-auto rounded-xl border border-[var(--border)] divide-y divide-[var(--border)]">
                        {list.map(e => (
                          <label key={e.id} className="flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-[var(--surface-2)]">
                            <input type="checkbox" checked={picked.has(e.id)} onChange={() => toggle(e.id)} className="w-5 h-5 accent-purple-600" />
                            <span className="text-sm text-[var(--text)] min-w-0 truncate">
                              {e.firstName} {e.lastName}{e.position ? <span className="text-[var(--text-secondary)]"> — {e.position}</span> : null}
                            </span>
                          </label>
                        ))}
                        {list.length === 0 && <p className="p-4 text-sm text-[var(--text-secondary)] text-center">Aucun résultat</p>}
                      </div>
                      <p className="text-xs text-[var(--text-secondary)]">{picked.size} sélectionné(s)</p>
                    </div>
                  )}
                  {error && <p className="text-sm text-[var(--danger-text)] bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] rounded-xl p-3">{error}</p>}
                </div>
                <div className="p-5 border-t border-[var(--border)] flex gap-3">
                  <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-[var(--border)] font-semibold text-[var(--text-secondary)]">Annuler</button>
                  <button onClick={launch} disabled={busy || (scope === 'pick' && picked.size === 0)}
                    className="flex-1 py-3 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand)] text-[var(--on-brand)] font-semibold shadow-lg disabled:opacity-60 flex items-center justify-center gap-2">
                    {busy ? <Loader2 strokeWidth={1.5} size={16} className="animate-spin" /> : <Rocket strokeWidth={1.5} size={16} />} Lancer
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </PerformanceOverlay>
      )}
    </AnimatePresence>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
function CycleDetailPage() {
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

  if (loading && !data) return <KonzaLoader variant="page" />;
  if (error || !data) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4">
        <AlertTriangle strokeWidth={1.5} className="mx-auto text-[var(--warning-text)]" size={36} />
        <p className="text-[var(--text)]">{error ?? 'Cycle introuvable'}</p>
        <Link href={bp('/performance/cycles')} className="inline-flex items-center gap-2 text-[var(--action)] font-semibold"><ArrowLeft strokeWidth={1.5} size={16} /> Retour</Link>
      </div>
    );
  }

  const { cycle, progress, reviews } = data;
  const pct = progress.total ? Math.round((progress.acknowledged / progress.total) * 100) : 0;
  const q = search.toLowerCase();
  const filtered = reviews.filter(r => !q || `${r.employee.firstName} ${r.employee.lastName}`.toLowerCase().includes(q));

  const tiles = [
    { label: 'Fiches', value: progress.total, cls: 'bg-[var(--brand-soft)] text-[var(--action)]' },
    { label: 'À noter', value: progress.draft, cls: 'bg-[var(--surface-2)] text-[var(--text-secondary)]' },
    { label: 'Envoyées aux employés', value: progress.submitted, cls: 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--warning-text)]' },
    { label: 'Lues par les employés', value: progress.acknowledged, cls: 'bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] text-[var(--success-text)]' },
  ];

  return (
    <div className="max-w-[1200px] mx-auto pb-20 space-y-6 sm:space-y-8">
      <PerformanceNav />
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 performance-header">
        <div className="min-w-0">
          <Link href={bp('/performance/cycles')} className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--action)] mb-2">
            <ArrowLeft strokeWidth={1.5} size={14} /> Campagnes
          </Link>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--text)] tracking-tight">{cycle.name}</h1>
          <p className="text-[var(--text-secondary)] text-sm sm:text-base">
            {fmtDate(cycle.startDate)} → {fmtDate(cycle.endDate)} · {cycle.status === 'OPEN' ? 'Ouvert' : 'Clôturé'}
            {cycle.template ? ` · Modèle : ${cycle.template.name}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} aria-label="Actualiser" className="p-2.5 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)]">
            <RefreshCw strokeWidth={1.5} size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          {isHR && (
            <button onClick={removeCycle}
              className="px-4 py-2.5 rounded-xl border border-[var(--border)] font-semibold text-[var(--danger-text)] hover:bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] flex items-center gap-2 text-sm">
              <Trash2 strokeWidth={1.5} size={16} /> <span className="hidden sm:inline">Supprimer</span>
            </button>
          )}
          {cycle.status === 'OPEN' && (
            <>
              {isHR && (
                <button onClick={close}
                  className="px-4 py-2.5 rounded-xl border border-[var(--border)] font-semibold text-[var(--text)] hover:bg-[var(--surface-2)] flex items-center gap-2 text-sm">
                  <Lock strokeWidth={1.5} size={16} /> <span className="hidden sm:inline">Clôturer</span>
                </button>
              )}
              {canLaunch && (
                <button onClick={() => setLaunchOpen(true)}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand)] text-[var(--on-brand)] font-semibold shadow-lg flex items-center justify-center gap-2">
                  <Rocket strokeWidth={1.5} size={18} />
                  {isHR ? (cycle.launchedAt ? 'Ajouter des employés' : 'Lancer') : 'Lancer pour mon équipe'}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Avancement */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4 performance-metrics">
        {tiles.map(t => (
          <div key={t.label} className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4 sm:p-5 shadow-sm performance-card">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${t.cls}`}><Users strokeWidth={1.5} size={16} /></div>
            <p className="text-2xl font-semibold text-[var(--text)]">{t.value}</p>
            <p className="text-sm text-[var(--text-secondary)]">{t.label}</p>
          </div>
        ))}
      </div>
      {progress.total > 0 && (
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4 sm:p-5 shadow-sm performance-card">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium text-[var(--text)]">Évaluations réceptionnées</span>
            <span className="font-semibold text-[var(--success-text)]">{pct} %</span>
          </div>
          <div className="h-2.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
            <div className="h-full bg-[var(--green)] rounded-full transition-colors" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {/* Fiches */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[var(--text)]">Fiches</h2>
          <div className="relative w-full max-w-xs">
            <Search strokeWidth={1.5} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
            <input className={`${inputCls} pl-9`} placeholder="Rechercher un employé…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-10 text-center text-sm text-[var(--text-secondary)] performance-card">
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
                  className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm p-4 flex items-center gap-3 sm:gap-4 hover:bg-[var(--surface-2)] transition-colors performance-card">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center font-semibold text-[var(--text)] text-sm shrink-0 bg-[var(--surface)] text-[var(--text)] performance-card">
                    {r.employee.photoUrl ? <img referrerPolicy="no-referrer" src={r.employee.photoUrl} alt="" className="w-full h-full rounded-full object-cover" /> : initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[var(--text)] truncate">{r.employee.firstName} {r.employee.lastName}</p>
                    <p className="text-sm text-[var(--text-secondary)] truncate">
                      {[r.employee.position, r.employee.department?.name].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  {score > 0 && (
                    <span className={`px-2.5 py-1 rounded-lg text-sm font-semibold shrink-0 ${scoreTone(score)}`}>{score.toFixed(1)}</span>
                  )}
                  <span className={`hidden sm:inline px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 ${st.cls}`}>{st.label}</span>
                  <ChevronRight strokeWidth={1.5} size={18} className="text-[var(--text-secondary)] shrink-0" />
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


export default function CycleDetailPageWithFrame() {
  return (
    <ModulePageFrame kind="detail">
      <CycleDetailPage />
    </ModulePageFrame>
  );
}
