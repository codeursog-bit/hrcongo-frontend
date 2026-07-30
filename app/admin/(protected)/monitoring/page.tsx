// ============================================================================
// Fichier: app/admin/(protected)/monitoring/page.tsx
// Page Monitoring améliorée — intègre LogStream + MonitoringTables
// ============================================================================

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Terminal, Activity, Shield, AlertTriangle, Server, Database,
  RefreshCw, Filter, ChevronLeft, ChevronRight,
  Globe, User, Building2, Zap, Clock, XCircle, CheckCircle2,
  Loader2, BarChart2, Lock, LogOut, Key, Trash2, Settings,
  CreditCard, Info, FileText, Download,
} from 'lucide-react';
import { LogStream }          from '@/components/admin/monitoring/LogStream';
import { SecurityTable, ApiRequestTable, DbQueryTable, ErrorsTable } from '@/components/admin/monitoring/MonitoringTables';
import { adminService }       from '@/lib/services/adminService';

// ─── Types ──────────────────────────────────────────────────────────────────
interface AuditLog {
  id: string; timestamp: string; time: string;
  level: string; severity: string;
  action: string; entity: string; description: string;
  user: string; userName: string; role: string;
  company: string; companyId: string | null;
  ip: string; duration: number | null; path: string | null;
  metadata: any;
}
interface SecEvent {
  id: string; timestamp: string; action: string; description: string;
  user: string; userName: string; company: string; role: string;
  ip: string; severity: string; risk: string;
}
interface Stats {
  total24h: number; total7d: number; total30d: number;
  critical24h: number; critical7d: number;
  logins24h: number; failedLogins24h: number;
  failRatio: number; exports24h: number;
  byAction7d:  { action: string; count: number }[];
  byCompany7d: { companyId: string; name: string; actions: number }[];
}
interface Health {
  status: string; uptimeFormatted: string;
  memory: { heapUsed: number; heapTotal: number; rss: number; pct: number; status: string };
  db: { status: string; latencyMs: number };
  activeSessions: number; nodeVersion: string; pid: number; env: string;
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const LVL: Record<string, string> = {
  ERROR: 'text-red-400 bg-red-500/10',
  WARN:  'text-amber-400 bg-amber-500/10',
  INFO:  'text-sky-400 bg-sky-500/10',
};
const RISK_STYLE: Record<string, string> = {
  Critical: 'bg-red-500/15 text-red-300 border border-red-500/25',
  High:     'bg-orange-500/15 text-orange-300 border border-orange-500/25',
  Medium:   'bg-amber-500/15 text-amber-300 border border-amber-500/25',
  Low:      'bg-sky-500/15 text-sky-300 border border-sky-500/20',
};
const ACTION_ICON: Record<string, React.ElementType> = {
  LOGIN: Globe, LOGOUT: LogOut, REGISTER: User,
  CHANGE_PASSWORD: Key, RESET_PASSWORD: Key,
  '2FA_ACTIVATED': Shield, '2FA_DISABLED': XCircle,
  EMPLOYEE_CREATE: CheckCircle2, EMPLOYEE_UPDATE: Settings,
  EMPLOYEE_DELETE: Trash2, PAYROLL_GENERATE_BATCH: Zap,
  PAYROLL_DELETE: Trash2, CONTRACT_RUPTURE: XCircle,
  SUBSCRIPTION_CANCEL: AlertTriangle,
  EXPORT_EXCEL: Download, EXPORT_SAGE: Download,
  EXPORT_ETAX: Download, EXPORT_CNSS: Download,
  SETTINGS_PAYROLL: Settings, LOAN_CREATE: CreditCard,
  USER_INVITE: User, COMPANY_UPDATE: Building2,
};

const fmt  = (d: string) => new Date(d).toLocaleString('fr-FR', {
  day: '2-digit', month: 'short', year: 'numeric',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
});
const fmtS = (d: string) => new Date(d).toLocaleString('fr-FR', {
  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
});

type Tab = 'logs' | 'security' | 'stats' | 'health' | 'stream';

// ─── Page principale ─────────────────────────────────────────────────────────
export default function MonitoringPage() {
  const [tab,     setTab]    = useState<Tab>('logs');
  const [loading, setLoad]   = useState(true);
  const [live,    setLive]   = useState(false);

  // Logs
  const [logs,    setLogs]   = useState<AuditLog[]>([]);
  const [meta,    setMeta]   = useState<any>(null);
  const [page,    setPage]   = useState(1);
  const [detail,  setDetail] = useState<AuditLog | null>(null);
  const [showFlt, setShowFlt]= useState(false);
  const [flt, setFlt] = useState({
    companyId: '', action: '', entity: '', severity: '', from: '', to: '',
  });

  // Autres onglets
  const [sec,     setSec]    = useState<SecEvent[]>([]);
  const [stats,   setStats]  = useState<Stats | null>(null);
  const [health,  setHealth] = useState<Health | null>(null);
  const [fullH,   setFullH]  = useState<any>(null);

  const load = useCallback(async () => {
    setLoad(true);
    try {
      if (tab === 'logs' || tab === 'stream') {
        const p: any = { page, limit: 50 };
        Object.entries(flt).forEach(([k, v]) => { if (v) p[k] = v; });
        const r = await adminService.getAuditLogs(p);
        setLogs(r.data ?? []); setMeta(r.meta ?? null);
      } else if (tab === 'security') {
        setSec(await adminService.getSecurityEvents(300));
      } else if (tab === 'stats') {
        setStats(await adminService.getMonitoringStats());
      } else {
        const [h, hd] = await Promise.all([
          adminService.getServerHealth(),
          adminService.getHealthDetails().catch(() => null),
        ]);
        setHealth(h); setFullH(hd);
      }
    } catch (e) { console.error(e); }
    finally { setLoad(false); }
  }, [tab, page, flt]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!live) return;
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [live, load]);

  const fltCount = Object.values(flt).filter(Boolean).length;
  const clearFlt = (k: keyof typeof flt) => setFlt(p => ({ ...p, [k]: '' }));

  // Adapter les logs pour LogStream
  const logStreamEntries = logs.map(l => ({
    id:        l.id,
    timestamp: fmtS(l.timestamp),
    level:     l.level,
    service:   l.entity,
    message:   l.description,
    user:      l.userName,
    duration:  l.duration ?? undefined,
  }));

  // Adapter les events sécurité pour SecurityTable
  const secTableEntries = sec.map(e => ({
    id:        e.id,
    timestamp: fmtS(e.timestamp),
    type:      e.action.replace(/_/g, ' '),
    user:      e.userName,
    ip:        e.ip,
    location:  '—',
    risk:      e.risk,
  }));

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Terminal className="text-red-500" size={24} />
            Monitoring Super Admin
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Audit complet · Sécurité cross-entreprises · Santé serveur
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLive(v => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${live
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-300'}`}
          >
            <div className={`w-2 h-2 rounded-full ${live ? 'bg-white animate-pulse' : 'bg-gray-500'}`} />
            {live ? 'Live ON' : 'Live OFF'}
          </button>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
        {([
          { k: 'logs',     l: 'Journal d\'audit', I: Terminal   },
          { k: 'stream',   l: 'Log Stream',        I: Activity   },
          { k: 'security', l: 'Sécurité',          I: Shield     },
          { k: 'stats',    l: 'Statistiques',      I: BarChart2  },
          { k: 'health',   l: 'Santé serveur',     I: Server     },
        ] as { k: Tab; l: string; I: React.ElementType }[]).map(t => (
          <button
            key={t.k}
            onClick={() => { setTab(t.k); setPage(1); }}
            className={`flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
              ${tab === t.k
                ? 'bg-gray-800 text-white border-b-2 border-red-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}
          >
            <t.I size={15} /> {t.l}
          </button>
        ))}
      </div>

      {/* ══ ONGLET LOGS ══ */}
      {tab === 'logs' && (
        <div className="space-y-4">
          {/* Contrôles */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <p className="text-sm font-semibold text-white">
                  {meta?.total?.toLocaleString('fr-FR') ?? '—'}
                  <span className="text-gray-500 font-normal text-xs ml-1.5">événements</span>
                </p>
                {fltCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 text-[10px] font-bold border border-red-500/20">
                    {fltCount} filtre{fltCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowFlt(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors
                  ${showFlt
                    ? 'bg-red-500/15 border-red-500/30 text-red-400'
                    : 'border-gray-700 text-gray-400 hover:text-white hover:border-gray-600'}`}
              >
                <Filter size={12} /> Filtres
              </button>
            </div>

            {showFlt && (
              <div className="border-t border-gray-800 p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { k: 'companyId', l: 'Entreprise ID', ph: 'uuid…'          },
                  { k: 'action',    l: 'Action',        ph: 'LOGIN, EXPORT…'  },
                  { k: 'entity',    l: 'Entité',        ph: 'AUTH, PAYROLL…'  },
                  { k: 'severity',  l: 'Sévérité',      ph: 'CRITICAL…'       },
                  { k: 'from',      l: 'Depuis',        ph: '', type: 'date'  },
                  { k: 'to',        l: "Jusqu'à",       ph: '', type: 'date'  },
                ].map(f => (
                  <div key={f.k}>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1.5">
                      {f.l}
                    </label>
                    <div className="relative">
                      <input
                        type={f.type ?? 'text'}
                        value={(flt as any)[f.k]}
                        placeholder={f.ph}
                        onChange={e => { setFlt(p => ({ ...p, [f.k]: e.target.value })); setPage(1); }}
                        className="w-full px-3 py-2 pr-7 rounded-lg border border-gray-700 bg-gray-800 text-xs text-white placeholder:text-gray-600 outline-none focus:border-red-500/50 transition-colors"
                      />
                      {(flt as any)[f.k] && (
                        <button
                          onClick={() => clearFlt(f.k as any)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400"
                        >
                          <XCircle size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Table logs */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={28} className="animate-spin text-red-500" />
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-600">
                <FileText size={32} className="mb-2 opacity-20" />
                <p className="text-sm">Aucun événement pour ces critères</p>
                {fltCount > 0 && (
                  <button
                    onClick={() => setFlt({ companyId:'', action:'', entity:'', severity:'', from:'', to:'' })}
                    className="mt-2 text-xs text-red-400 hover:text-red-300"
                  >
                    Effacer les filtres
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="divide-y divide-gray-800">
                  {logs.map(log => {
                    const Icon = ACTION_ICON[log.action] ?? Shield;
                    const sel  = detail?.id === log.id;
                    return (
                      <React.Fragment key={log.id}>
                        <div
                          onClick={() => setDetail(sel ? null : log)}
                          className={`flex items-start gap-3 px-5 py-3.5 cursor-pointer transition-colors
                            ${log.level === 'ERROR' ? 'border-l-2 border-l-red-500/50'
                              : log.level === 'WARN' ? 'border-l-2 border-l-amber-500/30' : ''}
                            ${sel ? 'bg-gray-800/60' : 'hover:bg-gray-800/30'}`}
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${LVL[log.level] ?? LVL.INFO}`}>
                            <Icon size={12} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-md ${LVL[log.level] ?? LVL.INFO}`}>
                                {log.action.replace(/_/g, ' ')}
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-gray-700 text-gray-400">
                                {log.entity}
                              </span>
                              {log.company && log.company !== '—' && (
                                <span className="flex items-center gap-1 text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md">
                                  <Building2 size={9} /> {log.company}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 truncate mb-1.5">{log.description}</p>
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="flex items-center gap-1 text-[11px] text-gray-600">
                                <User size={9} /> {log.userName}
                                <span className="text-gray-700"> ({log.role})</span>
                              </span>
                              {log.ip && log.ip !== 'N/A' && (
                                <span className="flex items-center gap-1 text-[11px] text-gray-700">
                                  <Globe size={9} /> {log.ip}
                                </span>
                              )}
                              {log.duration !== null && (
                                <span className="text-[11px] text-gray-700 font-mono">{log.duration}ms</span>
                              )}
                            </div>
                          </div>
                          <p className="text-[10px] font-mono text-gray-700 whitespace-nowrap shrink-0 self-center">
                            {fmtS(log.timestamp)}
                          </p>
                        </div>

                        {sel && (
                          <div className="bg-gray-950 border-t border-gray-800 px-5 py-5 space-y-4">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                                <Info size={12} className="text-red-400" /> Détail complet
                              </p>
                              <button onClick={() => setDetail(null)} className="text-[11px] text-gray-700 hover:text-gray-500">
                                fermer ×
                              </button>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                              {[
                                { l: 'ID événement',  v: log.id,                           m: true  },
                                { l: 'Horodatage',    v: fmt(log.timestamp)                         },
                                { l: 'Sévérité',      v: log.severity                               },
                                { l: 'Niveau',        v: log.level                                  },
                                { l: 'IP source',     v: log.ip,                           m: true  },
                                { l: 'Méthode HTTP',  v: log.metadata?.method ?? '—'                },
                                { l: 'Route',         v: log.path ?? '—',                  m: true  },
                                { l: 'Durée',         v: log.duration ? `${log.duration}ms` : '—'  },
                              ].map((f, i) => (
                                <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-3">
                                  <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-1">{f.l}</p>
                                  <p className={`truncate ${f.m ? 'font-mono text-[10px] text-gray-400' : 'text-xs text-gray-300 font-medium'}`}>
                                    {f.v}
                                  </p>
                                </div>
                              ))}
                            </div>
                            {log.company && log.company !== '—' && (
                              <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 flex items-center gap-3">
                                <Building2 size={16} className="text-blue-400 shrink-0" />
                                <div>
                                  <p className="text-xs font-semibold text-white">{log.company}</p>
                                  <p className="text-[10px] font-mono text-gray-600">{log.companyId}</p>
                                </div>
                              </div>
                            )}
                            {log.metadata?.error && (
                              <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-3">
                                <p className="text-[9px] text-red-600 uppercase tracking-wider mb-1">Message d'erreur</p>
                                <p className="text-xs text-red-400 font-mono">{log.metadata.error}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                {meta && meta.totalPages > 1 && (
                  <div className="px-5 py-3 border-t border-gray-800 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-gray-600">
                      Page {meta.page} / {meta.totalPages} · {meta.total?.toLocaleString('fr-FR')} événements
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-400 text-xs hover:bg-gray-800 disabled:opacity-30 transition-colors"
                      >
                        <ChevronLeft size={11} /> Préc.
                      </button>
                      <button
                        onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                        disabled={page === meta.totalPages}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-400 text-xs hover:bg-gray-800 disabled:opacity-30 transition-colors"
                      >
                        Suiv. <ChevronRight size={11} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ══ ONGLET LOG STREAM ══ */}
      {tab === 'stream' && (
        <LogStream logs={logStreamEntries} />
      )}

      {/* ══ ONGLET SÉCURITÉ ══ */}
      {tab === 'security' && (
        <div className="space-y-4">
          <div className="bg-gray-900 border border-red-500/20 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-800 flex items-center justify-between">
              <p className="text-sm font-bold text-white flex items-center gap-2">
                <Shield size={16} className="text-red-500" />
                Événements de sécurité critiques
                <span className="text-[10px] text-gray-500 font-normal">— toutes entreprises</span>
              </p>
              <span className="text-xs text-gray-500">{sec.length} événements</span>
            </div>
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 size={24} className="animate-spin text-red-500" />
              </div>
            ) : sec.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-gray-600">
                <CheckCircle2 size={32} className="mb-2 opacity-20 text-emerald-500" />
                <p className="text-sm text-emerald-700">Aucun événement de sécurité critique</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {sec.map(e => (
                  <div key={e.id} className="flex items-start gap-4 px-5 py-3.5 hover:bg-gray-800/30 transition-colors">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg whitespace-nowrap mt-0.5 ${RISK_STYLE[e.risk] ?? RISK_STYLE.Low}`}>
                      {e.risk}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-[11px] font-bold font-mono text-red-300">
                          {e.action.replace(/_/g, ' ')}
                        </span>
                        {e.company !== '—' && (
                          <span className="text-[10px] text-blue-400 flex items-center gap-1">
                            <Building2 size={9} /> {e.company}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate">{e.description}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-[11px] text-gray-600 flex items-center gap-1">
                          <User size={9} /> {e.userName}
                        </span>
                        {e.ip !== 'N/A' && (
                          <span className="text-[11px] text-gray-700 flex items-center gap-1">
                            <Globe size={9} /> {e.ip}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-[10px] font-mono text-gray-700 whitespace-nowrap shrink-0">
                      {fmtS(e.timestamp)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Table sécurité enrichie */}
          {!loading && sec.length > 0 && (
            <SecurityTable events={secTableEntries} />
          )}
        </div>
      )}

      {/* ══ ONGLET STATS ══ */}
      {tab === 'stats' && (
        <div className="space-y-5">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 size={28} className="animate-spin text-red-500" />
            </div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { l: 'Événements 24h',  v: stats.total24h.toLocaleString('fr-FR'),    c: 'text-sky-400',     I: Activity      },
                  { l: 'Critiques 24h',   v: stats.critical24h.toLocaleString('fr-FR'), c: 'text-red-400',     I: AlertTriangle },
                  { l: 'Connexions 24h',  v: stats.logins24h.toLocaleString('fr-FR'),   c: 'text-emerald-400', I: Globe         },
                  { l: 'Exports 24h',     v: stats.exports24h.toLocaleString('fr-FR'),  c: 'text-amber-400',   I: Download      },
                ].map((s, i) => (
                  <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <s.I size={14} className={s.c} />
                      <span className="text-[11px] text-gray-600">{s.l}</span>
                    </div>
                    <p className={`text-2xl font-black ${s.c}`}>{s.v}</p>
                  </div>
                ))}
              </div>

              {/* Taux d'échec */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
                  Taux d'échec connexions — 24h
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-gray-800 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        stats.failRatio > 30 ? 'bg-red-500'
                          : stats.failRatio > 10 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(100, stats.failRatio)}%` }}
                    />
                  </div>
                  <span className={`text-xl font-black tabular-nums ${
                    stats.failRatio > 30 ? 'text-red-400'
                      : stats.failRatio > 10 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {stats.failRatio}%
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  {stats.failedLogins24h} échecs / {stats.logins24h + stats.failedLogins24h} tentatives totales
                  {stats.failRatio > 30 && (
                    <span className="text-red-400 ml-2 font-semibold">⚠️ Taux anormalement élevé</span>
                  )}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Top actions — 7 jours</p>
                  <div className="space-y-2.5">
                    {stats.byAction7d.slice(0, 8).map((a, i) => {
                      const p = Math.round((a.count / (stats.byAction7d[0]?.count || 1)) * 100);
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-[10px] font-mono text-gray-700 w-3 text-right">{i + 1}</span>
                          <span className="text-xs text-gray-400 w-40 truncate">{a.action.replace(/_/g, ' ')}</span>
                          <div className="flex-1 bg-gray-800 rounded-full h-1.5">
                            <div className="h-full rounded-full bg-gradient-to-r from-red-600/70 to-red-400/70" style={{ width: `${p}%` }} />
                          </div>
                          <span className="text-[11px] font-bold text-gray-500 w-8 text-right tabular-nums">{a.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Entreprises les + actives — 7j</p>
                  <div className="space-y-2.5">
                    {stats.byCompany7d.slice(0, 8).map((c, i) => {
                      const p = Math.round((c.actions / (stats.byCompany7d[0]?.actions || 1)) * 100);
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-[10px] font-mono text-gray-700 w-3 text-right">{i + 1}</span>
                          <span className="text-xs text-gray-400 w-36 truncate">{c.name}</span>
                          <div className="flex-1 bg-gray-800 rounded-full h-1.5">
                            <div className="h-full rounded-full bg-gradient-to-r from-blue-600/70 to-sky-400/70" style={{ width: `${p}%` }} />
                          </div>
                          <span className="text-[11px] font-bold text-gray-500 w-8 text-right tabular-nums">{c.actions}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { l: '24 dernières heures',  v: stats.total24h,  c: stats.critical24h,  color: 'border-sky-500/20'     },
                  { l: '7 derniers jours',     v: stats.total7d,   c: stats.critical7d,   color: 'border-amber-500/20'   },
                  { l: '30 derniers jours',    v: stats.total30d,  c: 0,                  color: 'border-emerald-500/20' },
                ].map((p, i) => (
                  <div key={i} className={`bg-gray-900 border ${p.color} rounded-xl p-4`}>
                    <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-3">{p.l}</p>
                    <p className="text-2xl font-black text-white">{p.v.toLocaleString('fr-FR')}</p>
                    <p className="text-xs text-gray-600 mt-1">événements</p>
                    {p.c > 0 && (
                      <p className="text-[11px] text-red-400 mt-1 font-semibold">
                        {p.c} critique{p.c > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-20 text-gray-600">
              <BarChart2 size={40} className="mx-auto mb-3 opacity-20" />
              <p>Statistiques indisponibles</p>
            </div>
          )}
        </div>
      )}

      {/* ══ ONGLET SANTÉ ══ */}
      {tab === 'health' && (
        <div className="space-y-5">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 size={28} className="animate-spin text-red-500" />
            </div>
          ) : health ? (
            <>
              <div className={`rounded-xl border p-5 flex items-center justify-between gap-4
                ${health.status === 'healthy'
                  ? 'bg-emerald-500/5 border-emerald-500/20'
                  : 'bg-red-500/5 border-red-500/20'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full animate-pulse ${health.status === 'healthy' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  <div>
                    <p className={`font-bold ${health.status === 'healthy' ? 'text-emerald-300' : 'text-red-300'}`}>
                      Système {health.status === 'healthy' ? 'opérationnel' : 'dégradé'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">Uptime : {health.uptimeFormatted}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 font-mono">{health.env}</p>
                  <p className="text-xs text-gray-700 font-mono">{health.nodeVersion} · PID {health.pid}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Database size={13} className="text-sky-400" />
                    <span className="text-[11px] text-gray-600">Base de données</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2.5 h-2.5 rounded-full ${health.db.status === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                    <span className={`text-sm font-bold ${health.db.status === 'connected' ? 'text-emerald-300' : 'text-red-300'}`}>
                      {health.db.status === 'connected' ? 'Connectée' : 'Erreur'}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-700 font-mono">{health.db.latencyMs}ms latence</p>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Server size={13} className="text-amber-400" />
                    <span className="text-[11px] text-gray-600">Mémoire heap</span>
                  </div>
                  <p className={`text-2xl font-black ${
                    health.memory.pct > 90 ? 'text-red-400'
                      : health.memory.pct > 70 ? 'text-amber-400' : 'text-sky-400'}`}>
                    {health.memory.pct}%
                  </p>
                  <p className="text-[11px] text-gray-700 mt-1">
                    {health.memory.heapUsed}MB / {health.memory.heapTotal}MB
                  </p>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Lock size={13} className="text-violet-400" />
                    <span className="text-[11px] text-gray-600">Sessions actives</span>
                  </div>
                  <p className="text-2xl font-black text-violet-400">{health.activeSessions}</p>
                  <p className="text-[11px] text-gray-700 mt-1">JWT valides en base</p>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock size={13} className="text-emerald-400" />
                    <span className="text-[11px] text-gray-600">Uptime serveur</span>
                  </div>
                  <p className="text-lg font-black text-emerald-300">{health.uptimeFormatted}</p>
                  <p className="text-[11px] text-gray-700 mt-1">Depuis le dernier redémarrage</p>
                </div>
              </div>

              {fullH?.app && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Statistiques base de données</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                    {[
                      { l: 'Utilisateurs', v: fullH.app.totalUsers?.toLocaleString('fr-FR')    },
                      { l: 'Actifs',       v: fullH.app.activeUsers?.toLocaleString('fr-FR')   },
                      { l: 'Entreprises',  v: fullH.app.totalCompanies?.toLocaleString('fr-FR') },
                      { l: 'Employés',     v: fullH.app.totalEmployees?.toLocaleString('fr-FR') },
                      { l: 'Bulletins',    v: fullH.app.totalPayrolls?.toLocaleString('fr-FR')  },
                      { l: 'Sessions',     v: fullH.app.activeSessions?.toLocaleString('fr-FR') },
                      { l: 'Logs audit',   v: fullH.app.totalAuditLogs?.toLocaleString('fr-FR') },
                    ].map((s, i) => (
                      <div key={i} className="bg-gray-800 rounded-xl p-3 text-center">
                        <p className="text-[10px] text-gray-600 mb-1.5">{s.l}</p>
                        <p className="text-lg font-black text-white">{s.v ?? '—'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {fullH?.services && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">État des services</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {Object.entries(fullH.services).map(([key, svc]: any) => (
                      <div key={key} className="flex items-center gap-3 bg-gray-800 rounded-xl p-3">
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0
                          ${svc.status === 'ok' ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{svc.name}</p>
                          <p className={`text-[10px] font-bold ${svc.status === 'ok' ? 'text-emerald-600' : 'text-red-400'}`}>
                            {svc.status.toUpperCase()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center py-20 text-gray-600">
              <Server size={40} className="mb-3 opacity-20" />
              <p>Données de santé indisponibles</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}