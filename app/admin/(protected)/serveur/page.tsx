// ============================================================================
// Fichier: app/admin/(protected)/serveur/page.tsx
// Suivi du serveur (machine, back, base, front) + purge sécurisée des journaux
// ============================================================================

'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  HardDrive, Cpu, Database, Globe, Server, RefreshCw, Loader2, CheckCircle2,
  AlertCircle, AlertTriangle, Info, Trash2, Activity, Eye, Clock,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { adminService } from '@/lib/services/adminService';

// ─── Types ──────────────────────────────────────────────────────────────────
type Level = 'CRITICAL' | 'WARNING' | 'INFO';
interface Finding { key: string; level: Level; title: string; detail: string; action?: string; evidence?: any }
interface Metrics {
  at: string;
  machine: { cpuLoad1: number; cpuCores: number; loadPct: number; memTotalMb: number; memUsedMb: number; memPct: number; diskTotalGb: number | null; diskUsedGb: number | null; diskPct: number | null };
  container: { memMb: number | null; memLimitMb: number | null };
  app: { rssMb: number; heapUsedMb: number; heapTotalMb: number; cpuPct: number; eventLoopMeanMs: number; eventLoopMaxMs: number; uptimeSec: number; nodeVersion: string };
  db: { ok: boolean; sizeMb: number | null; connections: number | null; maxConnections: number | null; cacheHitPct: number | null; latencyMs: number | null };
  front: { checked: boolean; ok: boolean | null; latencyMs: number | null };
}
interface RouteStat { route: string; count: number; err4xx: number; err5xx: number; avgMs: number; p95Ms: number; maxMs: number; totalMs: number }
interface PurgeTarget {
  key: string; label: string; description: string; keeps: string | null; table: string;
  risk: 'SAFE' | 'CAUTION'; defaultDays: number; minDays: number;
  totalRowsEstimate: number | null; eligibleAtDefault: number | null;
}
interface PreviewResult { total: number; needsConfirmText: boolean; results: { key: string; label: string; risk: string; days: number; count: number }[] }

type Tab = 'overview' | 'curves' | 'tables' | 'purge';

// ─── Helpers ────────────────────────────────────────────────────────────────
const fmtN = (n: number | null | undefined) => (n == null ? '—' : n.toLocaleString('fr-FR'));
const fmtMb = (mb: number | null | undefined) =>
  mb == null ? '—' : mb >= 1024 ? `${(mb / 1024).toFixed(1)} Go` : `${Math.round(mb)} Mo`;
const fmtUptime = (s: number) => {
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  return d ? `${d} j ${h} h` : h ? `${h} h ${m} min` : `${m} min`;
};
const barColor = (pct: number | null | undefined) =>
  pct == null ? 'bg-gray-700' : pct >= 90 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-500' : 'bg-emerald-500';

const LEVEL_STYLE: Record<Level, { box: string; chip: string; icon: React.ElementType; label: string }> = {
  CRITICAL: { box: 'border-red-500/30 bg-red-500/5',     chip: 'bg-red-500/15 text-red-300',     icon: AlertCircle,   label: 'Critique' },
  WARNING:  { box: 'border-amber-500/30 bg-amber-500/5', chip: 'bg-amber-500/15 text-amber-300', icon: AlertTriangle, label: 'À surveiller' },
  INFO:     { box: 'border-gray-800 bg-gray-900',        chip: 'bg-sky-500/15 text-sky-300',     icon: Info,          label: 'Info' },
};

// ─── Petits composants ──────────────────────────────────────────────────────
function Card({ title, icon: Icon, children, accent = 'text-gray-400' }: { title: string; icon: React.ElementType; children: React.ReactNode; accent?: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-1.5 mb-3">
        <Icon size={12} className={accent} /> {title}
      </p>
      {children}
    </div>
  );
}

function Bar({ pct }: { pct: number | null | undefined }) {
  return (
    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden mt-2">
      <div className={`h-full rounded-full transition-all ${barColor(pct)}`} style={{ width: `${Math.min(100, Math.max(0, pct ?? 0))}%` }} />
    </div>
  );
}

function EvidenceTable({ rows }: { rows: any[] }) {
  if (!Array.isArray(rows) || rows.length === 0 || typeof rows[0] !== 'object') return null;
  const cols = Object.keys(rows[0]);
  return (
    <div className="overflow-x-auto mt-3 rounded-lg border border-gray-800">
      <table className="w-full text-[11px]">
        <thead className="bg-gray-950 text-gray-500">
          <tr>{cols.map((c) => <th key={c} className="text-left font-semibold px-2.5 py-1.5">{c}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-gray-800 text-gray-300 font-mono">
          {rows.map((r, i) => (
            <tr key={i}>{cols.map((c) => <td key={c} className="px-2.5 py-1.5 whitespace-nowrap">{String(r[c])}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FindingCard({ f }: { f: Finding }) {
  const s = LEVEL_STYLE[f.level];
  const Icon = s.icon;
  return (
    <div className={`border rounded-2xl p-4 ${s.box}`}>
      <div className="flex items-start gap-3">
        <Icon size={16} className={f.level === 'CRITICAL' ? 'text-red-400 mt-0.5' : f.level === 'WARNING' ? 'text-amber-400 mt-0.5' : 'text-sky-400 mt-0.5'} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-white">{f.title}</p>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${s.chip}`}>{s.label}</span>
          </div>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">{f.detail}</p>
          {f.action && <p className="text-xs text-emerald-300/80 mt-1.5 leading-relaxed">➜ {f.action}</p>}
          {Array.isArray(f.evidence) && <EvidenceTable rows={f.evidence} />}
        </div>
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────
export default function ServeurPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const [msg, setMsg] = useState<{ t: 'ok' | 'err'; s: string } | null>(null);

  // Vue d'ensemble
  const [overview, setOverview] = useState<{ live: Metrics; liveRoutes: RouteStat[]; findings: Finding[] } | null>(null);
  const [ovLoading, setOvLoading] = useState(true);

  // Courbes
  const [hours, setHours] = useState(24);
  const [history, setHistory] = useState<any | null>(null);
  const [histLoading, setHistLoading] = useState(false);

  // Tables
  const [tables, setTables] = useState<any | null>(null);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [slow, setSlow] = useState<any | null>(null);
  const [slowLoading, setSlowLoading] = useState(false);

  // Purge
  const [targets, setTargets] = useState<PurgeTarget[]>([]);
  const [confirmWord, setConfirmWord] = useState('SUPPRIMER');
  const [purgeLoading, setPurgeLoading] = useState(false);
  const [sel, setSel] = useState<Record<string, { on: boolean; days: number }>>({});
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);

  const flash = (t: 'ok' | 'err', s: string) => { setMsg({ t, s }); setTimeout(() => setMsg(null), 7000); };

  // ── Chargements ───────────────────────────────────────────────────────────
  const loadOverview = useCallback(async (silent = false) => {
    if (!silent) setOvLoading(true);
    try { setOverview(await adminService.getServerOverview()); }
    catch (e: any) { if (!silent) flash('err', e.message); }
    finally { setOvLoading(false); }
  }, []);

  const loadHistory = useCallback(async () => {
    setHistLoading(true);
    try { setHistory(await adminService.getServerHistory(hours)); }
    catch (e: any) { flash('err', e.message); }
    finally { setHistLoading(false); }
  }, [hours]);

  const loadTables = useCallback(async () => {
    setTablesLoading(true);
    try { setTables(await adminService.getServerTables()); }
    catch (e: any) { flash('err', e.message); }
    finally { setTablesLoading(false); }
  }, []);

  const loadSlow = async () => {
    setSlowLoading(true);
    try { setSlow(await adminService.getServerSlowQueries()); }
    catch (e: any) { flash('err', e.message); }
    finally { setSlowLoading(false); }
  };

  const loadTargets = useCallback(async () => {
    setPurgeLoading(true);
    try {
      const r = await adminService.getPurgeTargets();
      setTargets(r.targets);
      setConfirmWord(r.confirmText || 'SUPPRIMER');
      setSel((prev) => {
        const next: Record<string, { on: boolean; days: number }> = {};
        for (const t of r.targets as PurgeTarget[]) next[t.key] = prev[t.key] ?? { on: false, days: t.defaultDays };
        return next;
      });
    } catch (e: any) { flash('err', e.message); }
    finally { setPurgeLoading(false); }
  }, []);

  useEffect(() => { loadOverview(); }, [loadOverview]);
  // Rafraîchissement automatique (30 s) de la vue d'ensemble uniquement
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (tab !== 'overview') return;
    timer.current = setInterval(() => loadOverview(true), 30_000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [tab, loadOverview]);
  useEffect(() => { if (tab === 'curves') loadHistory(); }, [tab, loadHistory]);
  useEffect(() => { if (tab === 'tables' && !tables) loadTables(); }, [tab, tables, loadTables]);
  useEffect(() => { if (tab === 'purge' && targets.length === 0) loadTargets(); }, [tab, targets.length, loadTargets]);

  // ── Purge : actions ───────────────────────────────────────────────────────
  const chosen = useMemo(
    () => targets.filter((t) => sel[t.key]?.on).map((t) => ({ key: t.key, days: sel[t.key].days })),
    [targets, sel],
  );

  const changeSel = (key: string, patch: Partial<{ on: boolean; days: number }>) => {
    setSel((p) => ({ ...p, [key]: { ...p[key], ...patch } }));
    setPreview(null); setTyped('');
  };

  const doPreview = async () => {
    if (chosen.length === 0) return flash('err', 'Coche au moins une règle.');
    setBusy(true);
    try { setPreview(await adminService.previewPurge(chosen)); setTyped(''); }
    catch (e: any) { flash('err', e.message); setPreview(null); }
    finally { setBusy(false); }
  };

  const doExecute = async () => {
    if (!preview) return;
    const items = preview.results.filter((r) => r.count > 0).map((r) => ({ key: r.key, days: r.days, expectedCount: r.count }));
    if (items.length === 0) return flash('ok', 'Rien à supprimer.');
    if (!window.confirm(`Supprimer définitivement ${fmtN(preview.total)} ligne(s) ? Cette action est irréversible.`)) return;
    setBusy(true);
    try {
      const r = await adminService.executePurge(items, preview.needsConfirmText ? typed : undefined);
      flash('ok', `${fmtN(r.total)} ligne(s) supprimée(s).${r.partial ? ' Volume important : relance la purge pour continuer.' : ''}`);
      setPreview(null); setTyped('');
      await loadTargets();
      setTables(null);
    } catch (e: any) { flash('err', e.message); }
    finally { setBusy(false); }
  };

  // ── Rendu ─────────────────────────────────────────────────────────────────
  const m = overview?.live;
  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Vue d’ensemble', icon: Activity },
    { id: 'curves',   label: 'Courbes',        icon: Clock },
    { id: 'tables',   label: 'Base & tables',  icon: Database },
    { id: 'purge',    label: 'Purge',          icon: Trash2 },
  ];

  const refreshCurrent = () => {
    if (tab === 'overview') loadOverview();
    else if (tab === 'curves') loadHistory();
    else if (tab === 'tables') loadTables();
    else loadTargets();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <HardDrive className="text-red-500" size={24} /> Serveur
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Ressources du serveur, de la base et de l’app — avec le pourquoi, et la purge sécurisée des journaux
          </p>
        </div>
        <button onClick={refreshCurrent}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm transition-colors">
          <RefreshCw size={13} className={ovLoading || histLoading || tablesLoading || purgeLoading ? 'animate-spin' : ''} /> Actualiser
        </button>
      </div>

      {msg && (
        <div className={`flex items-center gap-2 p-3.5 rounded-xl border text-sm font-medium ${msg.t === 'ok' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-red-500/10 border-red-500/20 text-red-300'}`}>
          {msg.t === 'ok' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />} {msg.s}
        </div>
      )}

      {/* Onglets */}
      <div className="flex gap-1 border-b border-gray-800 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${tab === t.id ? 'border-red-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* ═══════════════ VUE D'ENSEMBLE ═══════════════ */}
      {tab === 'overview' && (
        ovLoading && !overview ? (
          <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-red-500" /></div>
        ) : m ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              <Card title="Disque" icon={HardDrive} accent="text-purple-400">
                <p className="text-2xl font-bold text-white">{m.machine.diskPct != null ? `${m.machine.diskPct} %` : '—'}</p>
                <p className="text-xs text-gray-500">{m.machine.diskUsedGb ?? '—'} Go sur {m.machine.diskTotalGb ?? '—'} Go</p>
                <Bar pct={m.machine.diskPct} />
              </Card>

              <Card title="Mémoire de la machine" icon={Server} accent="text-sky-400">
                <p className="text-2xl font-bold text-white">{m.machine.memPct} %</p>
                <p className="text-xs text-gray-500">{fmtMb(m.machine.memUsedMb)} sur {fmtMb(m.machine.memTotalMb)}</p>
                <Bar pct={m.machine.memPct} />
                {m.container.memMb != null && (
                  <p className="text-[11px] text-gray-500 mt-2">
                    Conteneur du back : {fmtMb(m.container.memMb)}{m.container.memLimitMb ? ` / ${fmtMb(m.container.memLimitMb)}` : ' (sans limite)'}
                  </p>
                )}
              </Card>

              <Card title="Charge processeur" icon={Cpu} accent="text-amber-400">
                <p className="text-2xl font-bold text-white">{m.machine.loadPct} %</p>
                <p className="text-xs text-gray-500">charge {m.machine.cpuLoad1} sur {m.machine.cpuCores} cœur(s)</p>
                <Bar pct={m.machine.loadPct} />
              </Card>

              <Card title="Back (API)" icon={Activity} accent="text-emerald-400">
                <p className="text-2xl font-bold text-white">{fmtMb(m.app.rssMb)}</p>
                <p className="text-xs text-gray-500">mémoire · actif depuis {fmtUptime(m.app.uptimeSec)}</p>
                <p className="text-[11px] text-gray-500 mt-2">
                  CPU {m.app.cpuPct} % d’un cœur · retard boucle {m.app.eventLoopMeanMs} ms (pic {m.app.eventLoopMaxMs} ms)
                </p>
              </Card>

              <Card title="Base de données" icon={Database} accent="text-blue-400">
                {m.db.ok ? (
                  <>
                    <p className="text-2xl font-bold text-white">{fmtMb(m.db.sizeMb)}</p>
                    <p className="text-xs text-gray-500">taille · réponse en {m.db.latencyMs} ms</p>
                    <p className="text-[11px] text-gray-500 mt-2">
                      Connexions {m.db.connections}/{m.db.maxConnections}
                      {m.db.cacheHitPct != null && ` · cache ${m.db.cacheHitPct} %`}
                    </p>
                    <Bar pct={m.db.maxConnections ? ((m.db.connections ?? 0) / m.db.maxConnections) * 100 : null} />
                  </>
                ) : <p className="text-sm font-bold text-red-400">Injoignable</p>}
              </Card>

              <Card title="Front" icon={Globe} accent="text-pink-400">
                {!m.front.checked ? (
                  <p className="text-xs text-gray-500">Non testé : renseigne FRONTEND_URL côté back.</p>
                ) : m.front.ok ? (
                  <>
                    <p className="text-2xl font-bold text-emerald-400">En ligne</p>
                    <p className="text-xs text-gray-500">réponse en {m.front.latencyMs} ms</p>
                  </>
                ) : <p className="text-2xl font-bold text-red-400">Ne répond pas</p>}
              </Card>
            </div>

            {/* Diagnostic */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Diagnostic — pourquoi ?</p>
              {overview!.findings.length === 0 ? (
                <div className="flex items-center gap-2 p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 text-sm text-emerald-300">
                  <CheckCircle2 size={16} /> Rien d’anormal détecté sur les dernières 24 h.
                </div>
              ) : overview!.findings.map((f) => <FindingCard key={f.key} f={f} />)}
            </div>

            {/* Routes */}
            {overview!.liveRoutes.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-4 pt-4">Routes les plus coûteuses (depuis le dernier relevé)</p>
                <div className="overflow-x-auto p-4">
                  <table className="w-full text-xs">
                    <thead className="text-gray-500">
                      <tr><th className="text-left py-1.5">Route</th><th className="text-right">Appels</th><th className="text-right">Moy.</th><th className="text-right">p95</th><th className="text-right">Erreurs 5xx</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800 text-gray-300">
                      {overview!.liveRoutes.map((r) => (
                        <tr key={r.route}>
                          <td className="py-1.5 font-mono text-[11px]">{r.route}</td>
                          <td className="text-right">{fmtN(r.count)}</td>
                          <td className="text-right">{r.avgMs} ms</td>
                          <td className={`text-right ${r.p95Ms >= 2000 ? 'text-amber-400 font-bold' : ''}`}>{r.p95Ms} ms</td>
                          <td className={`text-right ${r.err5xx ? 'text-red-400 font-bold' : ''}`}>{r.err5xx}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            <p className="text-[11px] text-gray-600">Mise à jour automatique toutes les 30 s · un relevé est enregistré toutes les 5 min et gardé 30 jours.</p>
          </div>
        ) : <p className="text-sm text-gray-500">Aucune donnée.</p>
      )}

      {/* ═══════════════ COURBES ═══════════════ */}
      {tab === 'curves' && (
        <div className="space-y-5">
          <div className="flex gap-2 flex-wrap">
            {[[6, '6 h'], [24, '24 h'], [72, '3 jours'], [168, '7 jours'], [720, '30 jours']].map(([h, l]) => (
              <button key={h as number} onClick={() => setHours(h as number)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${hours === h ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'border-gray-700 text-gray-400 hover:text-white'}`}>
                {l as string}
              </button>
            ))}
          </div>
          {histLoading && !history ? (
            <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-red-500" /></div>
          ) : !history || history.points.length < 2 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 text-center text-sm text-gray-500">
              Pas encore assez de relevés (un toutes les 5 minutes). Reviens dans un moment.
            </div>
          ) : (
            <>
              {[
                { title: 'Machine (%)', lines: [['diskPct', 'Disque', '#a855f7'], ['memPct', 'Mémoire', '#38bdf8'], ['loadPct', 'Charge CPU', '#f59e0b']], unit: '%' },
                { title: 'Back (Mo)', lines: [['rssMb', 'Mémoire (RSS)', '#34d399'], ['heapUsedMb', 'Heap utilisé', '#a3e635']], unit: ' Mo' },
                { title: 'Back — CPU et retard de boucle', lines: [['appCpuPct', 'CPU (% d’un cœur)', '#f87171'], ['eventLoopMeanMs', 'Retard boucle (ms)', '#fb923c']], unit: '' },
                { title: 'Base de données', lines: [['dbConnections', 'Connexions', '#60a5fa'], ['dbLatencyMs', 'Réponse (ms)', '#f472b6']], unit: '' },
                { title: 'Front — temps de réponse (ms)', lines: [['frontLatencyMs', 'Réponse', '#2dd4bf']], unit: ' ms' },
              ].map((c) => (
                <div key={c.title} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{c.title}</p>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={history.points}>
                        <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                        <XAxis dataKey="at" stroke="#6b7280" fontSize={10}
                          tickFormatter={(v) => new Date(v).toLocaleString('fr-FR', hours > 48 ? { day: '2-digit', month: '2-digit' } : { hour: '2-digit', minute: '2-digit' })} />
                        <YAxis stroke="#6b7280" fontSize={10} />
                        <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                          labelFormatter={(v) => new Date(v as string).toLocaleString('fr-FR')} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        {c.lines.map(([k, name, color]) => (
                          <Line key={k} type="monotone" dataKey={k} name={name} stroke={color} dot={false} strokeWidth={2} connectNulls />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ))}
              <p className="text-[11px] text-gray-600">{history.snapshots} relevé(s){history.stride > 1 ? ` — affichage allégé (1 point sur ${history.stride})` : ''}.</p>
            </>
          )}
        </div>
      )}

      {/* ═══════════════ BASE & TABLES ═══════════════ */}
      {tab === 'tables' && (
        <div className="space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-4 pt-4">
              Taille des tables (toutes, nouvelles incluses)
            </p>
            {tablesLoading && !tables ? (
              <div className="flex justify-center py-12"><Loader2 size={22} className="animate-spin text-red-500" /></div>
            ) : tables ? (
              <div className="overflow-x-auto p-4">
                <table className="w-full text-xs">
                  <thead className="text-gray-500">
                    <tr>
                      <th className="text-left py-1.5">Table</th><th className="text-right">Taille</th>
                      <th className="text-right">Données</th><th className="text-right">Index</th>
                      <th className="text-right">Lignes</th><th className="text-right">Mortes</th>
                      <th className="text-right">Croissance (7 j)</th><th className="text-left pl-4">Purge</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800 text-gray-300">
                    {tables.tables.map((t: any) => (
                      <tr key={t.name}>
                        <td className="py-1.5 font-mono text-[11px]">{t.name}{t.isNewSinceBase && <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300">nouvelle</span>}</td>
                        <td className="text-right font-semibold">{fmtMb(t.totalMb)}</td>
                        <td className="text-right text-gray-500">{fmtMb(t.tableMb)}</td>
                        <td className="text-right text-gray-500">{fmtMb(t.indexMb)}</td>
                        <td className="text-right">{fmtN(t.liveRows)}</td>
                        <td className={`text-right ${t.deadRows > 10000 ? 'text-amber-400' : 'text-gray-500'}`}>{fmtN(t.deadRows)}</td>
                        <td className={`text-right ${t.growthMb == null ? 'text-gray-600' : t.growthMb >= 50 ? 'text-amber-400 font-bold' : 'text-gray-400'}`}>
                          {t.growthMb == null ? '—' : `${t.growthMb > 0 ? '+' : ''}${fmtMb(t.growthMb)}`}
                        </td>
                        <td className="pl-4">{t.purgeable
                          ? <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300">purgeable</span>
                          : <span className="text-[10px] text-gray-600">données métier</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!tables.since && <p className="text-[11px] text-gray-600 mt-3">La croissance apparaîtra après le premier relevé de tables (toutes les 6 h).</p>}
              </div>
            ) : null}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Requêtes les plus coûteuses</p>
              <button onClick={loadSlow} disabled={slowLoading}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs disabled:opacity-50">
                {slowLoading ? <Loader2 size={12} className="animate-spin" /> : <Eye size={12} />} Analyser
              </button>
            </div>
            {slow && (slow.available ? (
              <div className="overflow-x-auto mt-3">
                <table className="w-full text-xs">
                  <thead className="text-gray-500"><tr><th className="text-left py-1.5">Requête</th><th className="text-right">Appels</th><th className="text-right">Total</th><th className="text-right">Moy.</th></tr></thead>
                  <tbody className="divide-y divide-gray-800 text-gray-300">
                    {slow.queries.map((q: any, i: number) => (
                      <tr key={i}>
                        <td className="py-1.5 font-mono text-[10px] max-w-xl truncate" title={q.query}>{q.query}</td>
                        <td className="text-right">{fmtN(q.calls)}</td>
                        <td className="text-right">{fmtN(Math.round(q.totalMs / 1000))} s</td>
                        <td className={`text-right ${q.meanMs >= 200 ? 'text-amber-400 font-bold' : ''}`}>{q.meanMs} ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-gray-400 mt-3 leading-relaxed">{slow.howTo}</p>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════ PURGE ═══════════════ */}
      {tab === 'purge' && (
        <div className="space-y-5">
          <div className="flex items-start gap-3 p-4 rounded-2xl border border-sky-500/20 bg-sky-500/5 text-xs text-sky-200/90 leading-relaxed">
            <Info size={16} className="shrink-0 mt-0.5 text-sky-400" />
            <div>
              Seuls les <b>journaux techniques</b> de cette liste peuvent être supprimés : les données métier (employés, paies, congés, prêts…) ne sont jamais concernées.
              Un aperçu est obligatoire avant toute suppression. L’espace libéré est réutilisé par la base ; pour réduire réellement le disque il faut un <code>VACUUM FULL</code> en heures creuses.
            </div>
          </div>

          {purgeLoading && targets.length === 0 ? (
            <div className="flex justify-center py-12"><Loader2 size={22} className="animate-spin text-red-500" /></div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl divide-y divide-gray-800">
              {targets.map((t) => {
                const s = sel[t.key] ?? { on: false, days: t.defaultDays };
                const tooLow = s.days < t.minDays;
                return (
                  <div key={t.key} className={`flex flex-col md:flex-row md:items-center gap-3 px-4 py-3.5 ${s.on ? 'bg-gray-800/40' : ''}`}>
                    <label className="flex items-start gap-3 flex-1 min-w-0 cursor-pointer">
                      <input type="checkbox" checked={s.on} onChange={(e) => changeSel(t.key, { on: e.target.checked })}
                        className="mt-1 accent-red-500" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-white">{t.label}</p>
                          {t.risk === 'CAUTION' && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-300">sensible</span>}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>
                        {t.keeps && <p className="text-[11px] text-emerald-400/70 mt-0.5">Conservé : {t.keeps}</p>}
                      </div>
                    </label>
                    <div className="flex items-center gap-4 shrink-0 text-xs">
                      <div className="text-right text-gray-500 w-28">
                        <p>{t.eligibleAtDefault == null ? '—' : fmtN(t.eligibleAtDefault)} concernée(s)</p>
                        <p className="text-[10px] text-gray-600">≈ {fmtN(t.totalRowsEstimate)} au total</p>
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase tracking-wider text-gray-600 mb-1">Plus vieux que</label>
                        <div className="flex items-center gap-1.5">
                          <input type="number" min={t.minDays} value={s.days}
                            onChange={(e) => changeSel(t.key, { days: Math.floor(Number(e.target.value)) || t.minDays })}
                            className={`w-20 px-2 py-1.5 rounded-lg border bg-gray-800 text-white text-xs outline-none ${tooLow ? 'border-red-500/60' : 'border-gray-700 focus:border-red-500/50'}`} />
                          <span className="text-gray-500">jours</span>
                        </div>
                        <p className="text-[10px] text-gray-600 mt-1">min. {t.minDays}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Aperçu */}
          {preview && (
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Aperçu — rien n’est encore supprimé</p>
              <div className="divide-y divide-gray-800 text-sm">
                {preview.results.map((r) => (
                  <div key={r.key} className="flex justify-between py-1.5">
                    <span className="text-gray-300">{r.label} <span className="text-gray-600 text-xs">(&gt; {r.days} j)</span></span>
                    <span className={`font-mono font-bold ${r.count ? 'text-white' : 'text-gray-600'}`}>{fmtN(r.count)}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-white font-bold">Total : {fmtN(preview.total)} ligne(s)</p>
              {preview.needsConfirmText && preview.total > 0 && (
                <div>
                  <label className="block text-xs text-amber-300 mb-1.5">Données sensibles incluses : tape <b>{confirmWord}</b> pour confirmer</label>
                  <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={confirmWord}
                    className="w-full sm:w-64 px-3 py-2 rounded-lg border border-amber-500/40 bg-gray-800 text-white text-sm outline-none" />
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 flex-wrap">
            <button onClick={doPreview} disabled={busy || chosen.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl text-sm disabled:opacity-40">
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />} Aperçu ({chosen.length})
            </button>
            <button onClick={doExecute}
              disabled={busy || !preview || preview.total === 0 || (preview.needsConfirmText && typed.trim() !== confirmWord)}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-semibold disabled:opacity-30 disabled:cursor-not-allowed">
              <Trash2 size={14} /> Supprimer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}