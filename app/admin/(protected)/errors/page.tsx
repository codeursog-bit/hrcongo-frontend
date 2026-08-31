'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle, AlertCircle, XCircle, CheckCircle2, RefreshCw,
  Filter, ChevronLeft, ChevronRight, Search, Loader2,
  Bug, Building2, User, Globe, Clock, FileText, BarChart2,
  Trash2, Check, Info, X, Code, Server,
} from 'lucide-react';
import { adminService } from '@/lib/services/adminService';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface AppError {
  id:          string;
  errorCode:   string;
  statusCode:  number;
  message:     string;
  stack?:      string;
  method:      string;
  path:        string;
  body?:       any;
  query?:      any;
  userId?:     string;
  companyId?:  string;
  companyName?:string;
  userEmail?:  string;
  ip?:         string;
  severity:    string;
  resolved:    boolean;
  resolvedAt?: string;
  note?:       string;
  createdAt:   string;
}
interface ErrorStats {
  total24h: number; total7d: number; unresolved: number;
  by4xx: number; by5xx: number; critical: number;
  byCode:    { code:   string; count: number }[];
  byPath:    { path:   string; count: number }[];
  byCompany: { companyId: string; name: string; count: number }[];
  byStatus:  { status: number; count: number }[];
  recent500: { id: string; message: string; path: string; createdAt: string; errorCode: string }[];
}

// ─── Constantes visuelles ──────────────────────────────────────────────────────
const STATUS_COLOR: Record<number, string> = {
  400: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
  401: 'bg-orange-500/10 text-orange-400 border-orange-500/25',
  403: 'bg-red-500/10 text-red-400 border-red-500/25',
  404: 'bg-slate-500/10 text-slate-400 border-slate-500/25',
  409: 'bg-purple-500/10 text-purple-400 border-purple-500/25',
  422: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/25',
  429: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
  500: 'bg-red-600/15 text-red-300 border-red-600/30',
};
const STATUS_GROUP = (s: number) =>
  s >= 500 ? 'SERVEUR' : s >= 400 ? 'CLIENT' : 'AUTRE';

const SEV_STYLE: Record<string, string> = {
  CRITICAL: 'bg-red-500/15 text-red-300 border border-red-500/25',
  ERROR:    'bg-orange-500/15 text-orange-300 border border-orange-500/25',
  WARN:     'bg-amber-500/15 text-amber-300 border border-amber-500/25',
};

const fmtDate = (d: string) => new Date(d).toLocaleString('fr-FR',
  { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
const fmtShort = (d: string) => new Date(d).toLocaleString('fr-FR',
  { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function ErrorsPage() {
  const [tab,     setTab]    = useState<'errors' | 'stats'>('errors');
  const [errors,  setErrors] = useState<AppError[]>([]);
  const [stats,   setStats]  = useState<ErrorStats | null>(null);
  const [meta,    setMeta]   = useState<any>(null);
  const [loading, setLoad]   = useState(true);
  const [page,    setPage]   = useState(1);
  const [detail,  setDetail] = useState<AppError | null>(null);
  const [showFlt, setShowFlt]= useState(false);
  const [resolveNote, setNote] = useState('');
  const [resolving, setResolving] = useState<string | null>(null);
  const [msg,     setMsg]    = useState<{ t: 'ok' | 'err'; s: string } | null>(null);

  const [flt, setFlt] = useState({
    companyId: '', errorCode: '', statusCode: '',
    path: '', severity: '', resolved: '', from: '', to: '',
  });

  const load = useCallback(async () => {
    setLoad(true);
    try {
      if (tab === 'errors') {
        const p: any = { page, limit: 40 };
        if (flt.companyId)  p.companyId  = flt.companyId;
        if (flt.errorCode)  p.errorCode  = flt.errorCode;
        if (flt.statusCode) p.statusCode = +flt.statusCode;
        if (flt.path)       p.path       = flt.path;
        if (flt.severity)   p.severity   = flt.severity;
        if (flt.from)       p.from       = flt.from;
        if (flt.to)         p.to         = flt.to;
        if (flt.resolved)   p.resolved   = flt.resolved === 'true';
        const r = await adminService.getErrors(p);
        setErrors(r.data ?? []); setMeta(r.meta ?? null);
      } else {
        setStats(await adminService.getErrorStats());
      }
    } catch (e) { console.error(e); }
    finally { setLoad(false); }
  }, [tab, page, flt]);

  useEffect(() => { load(); }, [load]);

  const resolve = async (err: AppError) => {
    setResolving(err.id);
    try {
      await adminService.resolveError(err.id, resolveNote || undefined);
      setMsg({ t: 'ok', s: `Erreur "${err.errorCode}" marquée résolue` });
      setDetail(null); setNote('');
      load();
    } catch (e: any) { setMsg({ t: 'err', s: e.message }); }
    finally { setResolving(null); setTimeout(() => setMsg(null), 4000); }
  };

  const resolveAllByCode = async (code: string) => {
    setResolving(code);
    try {
      const r = await adminService.resolveByCode(code);
      setMsg({ t: 'ok', s: `Toutes les erreurs "${code}" résolues` });
      load();
    } catch (e: any) { setMsg({ t: 'err', s: e.message }); }
    finally { setResolving(null); setTimeout(() => setMsg(null), 4000); }
  };

  const cleanup = async () => {
    if (!confirm('Supprimer les erreurs résolues de plus de 30 jours ?')) return;
    try {
      const r = await adminService.cleanupErrors(30);
      setMsg({ t: 'ok', s: `${r.count ?? 0} erreur(s) supprimée(s)` });
      load();
    } catch (e: any) { setMsg({ t: 'err', s: e.message }); }
  };

  const fltCount = Object.values(flt).filter(Boolean).length;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Bug className="text-red-500" size={24} /> Error Tracker
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Toutes les erreurs applicatives — validation, serveur, auth, métier
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={cleanup}
            className="flex items-center gap-2 px-3 py-2 border border-gray-700 text-gray-500 hover:text-gray-300 rounded-xl text-sm transition-colors">
            <Trash2 size={13} /> Nettoyer
          </button>
          <button onClick={load} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm transition-colors disabled:opacity-50">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Actualiser
          </button>
        </div>
      </div>

      {/* Message */}
      {msg && (
        <div className={`flex items-center gap-2 p-3.5 rounded-xl border text-sm font-medium
          ${msg.t === 'ok' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-red-500/10 border-red-500/20 text-red-300'}`}>
          {msg.t === 'ok' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />} {msg.s}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
        {([
          { k: 'errors', l: 'Erreurs',       I: Bug      },
          { k: 'stats',  l: 'Statistiques',  I: BarChart2 },
        ] as any[]).map(t => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${tab === t.k ? 'bg-gray-800 text-white border-b-2 border-red-500' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}>
            <t.I size={14} /> {t.l}
          </button>
        ))}
      </div>

      {/* ══ ONGLET ERREURS ═══════════════════════════════════════════════════ */}
      {tab === 'errors' && (
        <div className="space-y-4">

          {/* Filtres */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <p className="text-sm font-semibold text-white">
                  {meta?.total?.toLocaleString('fr-FR') ?? '—'}
                  <span className="text-gray-500 font-normal text-xs ml-1.5">erreurs</span>
                </p>
                {fltCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 text-[10px] font-bold border border-red-500/20">
                    {fltCount} filtre{fltCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {/* Raccourcis rapides */}
                {['400', '422', '500', ''].map(s => (
                  <button key={s} onClick={() => { setFlt(p => ({ ...p, statusCode: s })); setPage(1); }}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-colors
                      ${flt.statusCode === s && s
                        ? 'bg-red-500/15 border-red-500/30 text-red-400'
                        : 'border-gray-700 text-gray-500 hover:text-white'}`}>
                    {s || 'Tous'}
                  </button>
                ))}
                <button onClick={() => setShowFlt(v => !v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors
                    ${showFlt ? 'bg-red-500/15 border-red-500/30 text-red-400' : 'border-gray-700 text-gray-400 hover:text-white'}`}>
                  <Filter size={11} /> Plus
                </button>
              </div>
            </div>

            {showFlt && (
              <div className="border-t border-gray-800 p-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                {[
                  { k: 'companyId',  l: 'Entreprise', ph: 'uuid…'          },
                  { k: 'errorCode',  l: 'Code erreur', ph: 'VALIDATION_ERR' },
                  { k: 'path',       l: 'Route',       ph: '/employees'     },
                  { k: 'severity',   l: 'Sévérité',    ph: 'CRITICAL'       },
                  { k: 'resolved',   l: 'Résolu',      ph: 'true / false'   },
                  { k: 'from',       l: 'Depuis',      ph: '', type: 'date' },
                  { k: 'to',         l: 'Jusqu\'à',    ph: '', type: 'date' },
                ].map(f => (
                  <div key={f.k} className="col-span-1">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1.5">{f.l}</label>
                    <div className="relative">
                      <input type={f.type ?? 'text'} value={(flt as any)[f.k]} placeholder={f.ph}
                        onChange={e => { setFlt(p => ({ ...p, [f.k]: e.target.value })); setPage(1); }}
                        className="w-full px-2.5 py-2 pr-6 rounded-lg border border-gray-700 bg-gray-800 text-[11px] text-white placeholder:text-gray-700 outline-none focus:border-red-500/50 transition-colors" />
                      {(flt as any)[f.k] && (
                        <button onClick={() => setFlt(p => ({ ...p, [f.k]: '' }))}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400">
                          <X size={10} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Table */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 size={24} className="animate-spin text-red-500" />
              </div>
            ) : errors.length === 0 ? (
              <div className="flex flex-col items-center py-20 text-gray-600">
                <CheckCircle2 size={36} className="mb-2 opacity-20 text-emerald-600" />
                <p className="text-sm text-emerald-800">Aucune erreur correspondant aux critères</p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-gray-800">
                  {errors.map(err => {
                    const sel = detail?.id === err.id;
                    const sBadge = STATUS_COLOR[err.statusCode] ?? 'bg-gray-700 text-gray-400 border-gray-600';
                    return (
                      <React.Fragment key={err.id}>
                        <div
                          onClick={() => setDetail(sel ? null : err)}
                          className={`flex items-start gap-3 px-5 py-3.5 cursor-pointer transition-colors
                            ${err.statusCode >= 500 ? 'border-l-2 border-l-red-600/60' : err.severity === 'WARN' ? 'border-l-2 border-l-amber-500/30' : ''}
                            ${err.resolved ? 'opacity-50' : ''}
                            ${sel ? 'bg-gray-800/60' : 'hover:bg-gray-800/30'}`}
                        >
                          {/* Status */}
                          <span className={`text-[11px] font-black font-mono px-2 py-1 rounded-md border shrink-0 mt-0.5 ${sBadge}`}>
                            {err.statusCode}
                          </span>

                          {/* Contenu */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-[11px] font-bold text-gray-200 font-mono">{err.errorCode}</span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${SEV_STYLE[err.severity] ?? SEV_STYLE.ERROR}`}>
                                {err.severity}
                              </span>
                              <span className="text-[10px] font-mono text-gray-600 flex items-center gap-1">
                                <Code size={9} /> {err.method} {err.path}
                              </span>
                              {err.resolved && (
                                <span className="flex items-center gap-1 text-[10px] text-emerald-600">
                                  <Check size={9} /> Résolu
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 mb-1.5 line-clamp-1">{err.message}</p>
                            <div className="flex items-center gap-3 flex-wrap">
                              {err.companyName && (
                                <span className="flex items-center gap-1 text-[11px] text-blue-400">
                                  <Building2 size={9} /> {err.companyName}
                                </span>
                              )}
                              {err.userEmail && (
                                <span className="flex items-center gap-1 text-[11px] text-gray-600">
                                  <User size={9} /> {err.userEmail.split(' <')[0]}
                                </span>
                              )}
                              {err.ip && (
                                <span className="flex items-center gap-1 text-[11px] text-gray-700">
                                  <Globe size={9} /> {err.ip}
                                </span>
                              )}
                            </div>
                          </div>

                          <p className="text-[10px] font-mono text-gray-700 whitespace-nowrap shrink-0 self-center">
                            {fmtShort(err.createdAt)}
                          </p>
                        </div>

                        {/* Détail inline */}
                        {sel && (
                          <div className="bg-gray-950 border-t border-gray-800 px-5 py-5 space-y-4">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                                <Info size={12} className="text-red-400" /> Détail complet
                              </p>
                              <button onClick={() => setDetail(null)}
                                className="text-[11px] text-gray-700 hover:text-gray-500">fermer ×</button>
                            </div>

                            {/* Infos */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                              {[
                                { l: 'ID',          v: err.id,        m: true },
                                { l: 'Horodatage',  v: fmtDate(err.createdAt) },
                                { l: 'Status',      v: String(err.statusCode) },
                                { l: 'Groupe',      v: STATUS_GROUP(err.statusCode) },
                                { l: 'Code erreur', v: err.errorCode, m: true },
                                { l: 'Méthode',     v: err.method },
                                { l: 'Route',       v: err.path,      m: true },
                                { l: 'IP',          v: err.ip ?? '—', m: true },
                              ].map((f, i) => (
                                <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-3">
                                  <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-1">{f.l}</p>
                                  <p className={`truncate ${f.m ? 'font-mono text-[10px] text-gray-400' : 'text-xs text-gray-300 font-medium'}`}>{f.v}</p>
                                </div>
                              ))}
                            </div>

                            {/* Message complet */}
                            <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
                              <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-2">Message d'erreur</p>
                              <p className="text-sm text-red-300 font-medium">{err.message}</p>
                            </div>

                            {/* Entreprise & utilisateur */}
                            {(err.companyName || err.userEmail) && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {err.companyName && (
                                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 flex items-center gap-2">
                                    <Building2 size={14} className="text-blue-400 shrink-0" />
                                    <div>
                                      <p className="text-[9px] text-gray-600 uppercase tracking-wider">Entreprise</p>
                                      <p className="text-xs text-white font-semibold">{err.companyName}</p>
                                    </div>
                                  </div>
                                )}
                                {err.userEmail && (
                                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 flex items-center gap-2">
                                    <User size={14} className="text-violet-400 shrink-0" />
                                    <div>
                                      <p className="text-[9px] text-gray-600 uppercase tracking-wider">Utilisateur</p>
                                      <p className="text-xs text-white font-semibold">{err.userEmail}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Body */}
                            {err.body && Object.keys(err.body).length > 0 && (
                              <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
                                <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-2">Corps de la requête (sensibles masqués)</p>
                                <pre className="text-[11px] font-mono text-gray-500 max-h-32 overflow-auto leading-relaxed">
                                  {JSON.stringify(err.body, null, 2)}
                                </pre>
                              </div>
                            )}

                            {/* Stack trace (500 uniquement) */}
                            {err.stack && (
                              <div className="bg-gray-900 border border-red-500/15 rounded-xl p-3">
                                <p className="text-[9px] text-red-600 uppercase tracking-wider mb-2">Stack trace</p>
                                <pre className="text-[10px] font-mono text-red-300/70 max-h-40 overflow-auto leading-relaxed whitespace-pre-wrap">
                                  {err.stack}
                                </pre>
                              </div>
                            )}

                            {/* Actions résolution */}
                            {!err.resolved ? (
                              <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-3">
                                <p className="text-xs font-bold text-gray-400">Résoudre cette erreur</p>
                                <textarea
                                  value={resolveNote}
                                  onChange={e => setNote(e.target.value)}
                                  placeholder="Note optionnelle (ex: corrigé dans le commit abc123, ou champ manquant dans le DTO CreateEmployee…)"
                                  rows={2}
                                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white placeholder:text-gray-600 outline-none focus:border-emerald-500/50 resize-none transition-colors"
                                />
                                <div className="flex gap-3">
                                  <button onClick={() => resolve(err)} disabled={resolving === err.id}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-colors">
                                    {resolving === err.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                                    Marquer résolu
                                  </button>
                                  <button onClick={() => resolveAllByCode(err.errorCode)} disabled={resolving === err.errorCode}
                                    className="flex items-center gap-2 px-4 py-2 border border-gray-700 text-gray-400 hover:text-white rounded-xl text-sm transition-colors disabled:opacity-50">
                                    {resolving === err.errorCode ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                                    Résoudre tous les « {err.errorCode} »
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-2">
                                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                                <div>
                                  <p className="text-sm text-emerald-300 font-semibold">Erreur résolue</p>
                                  {err.resolvedAt && <p className="text-xs text-gray-600">{fmtDate(err.resolvedAt)}</p>}
                                  {err.note && <p className="text-xs text-gray-500 mt-0.5">{err.note}</p>}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Pagination */}
                {meta && meta.totalPages > 1 && (
                  <div className="px-5 py-3 border-t border-gray-800 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-gray-600">
                      Page {meta.page}/{meta.totalPages} · {meta.total?.toLocaleString('fr-FR')} erreurs
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-400 text-xs hover:bg-gray-800 disabled:opacity-30 transition-colors">
                        <ChevronLeft size={11} /> Préc.
                      </button>
                      <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-400 text-xs hover:bg-gray-800 disabled:opacity-30 transition-colors">
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

      {/* ══ ONGLET STATS ═════════════════════════════════════════════════════ */}
      {tab === 'stats' && (
        <div className="space-y-5">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-red-500" /></div>
          ) : stats ? (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                {[
                  { l: 'Erreurs 24h',    v: stats.total24h.toLocaleString(),  c: 'text-sky-400',     I: AlertTriangle },
                  { l: 'Erreurs 7j',     v: stats.total7d.toLocaleString(),   c: 'text-amber-400',   I: AlertTriangle },
                  { l: 'Non résolues',   v: stats.unresolved.toLocaleString(),c: 'text-red-400',     I: XCircle       },
                  { l: 'Critiques 7j',   v: stats.critical.toLocaleString(),  c: 'text-red-300',     I: AlertCircle   },
                  { l: 'Erreurs 4xx',    v: stats.by4xx.toLocaleString(),     c: 'text-amber-400',   I: Bug           },
                  { l: 'Erreurs 5xx',    v: stats.by5xx.toLocaleString(),     c: 'text-red-500',     I: Server        },
                ].map((s, i) => (
                  <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <s.I size={13} className={s.c} />
                      <span className="text-[11px] text-gray-600">{s.l}</span>
                    </div>
                    <p className={`text-2xl font-black ${s.c}`}>{s.v}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Top codes d'erreur */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
                    Top codes d'erreur — 7 jours
                  </p>
                  <div className="space-y-2.5">
                    {stats.byCode.slice(0, 8).map((e, i) => {
                      const pct = Math.round((e.count / (stats.byCode[0]?.count || 1)) * 100);
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-[10px] font-mono text-gray-700 w-3 text-right">{i + 1}</span>
                          <button
                            onClick={() => { setFlt(p => ({ ...p, errorCode: e.code })); setTab('errors'); setPage(1); }}
                            className="text-xs text-amber-400 hover:text-amber-300 font-mono w-48 truncate text-left transition-colors"
                            title={`Filtrer sur ${e.code}`}
                          >
                            {e.code}
                          </button>
                          <div className="flex-1 bg-gray-800 rounded-full h-1.5">
                            <div className="h-full rounded-full bg-gradient-to-r from-amber-600/70 to-amber-400/70"
                              style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[11px] font-bold text-gray-500 w-8 text-right tabular-nums">{e.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Top routes avec erreurs */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
                    Routes les + touchées — 7 jours
                  </p>
                  <div className="space-y-2.5">
                    {stats.byPath.slice(0, 8).map((p, i) => {
                      const pct = Math.round((p.count / (stats.byPath[0]?.count || 1)) * 100);
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-[10px] font-mono text-gray-700 w-3 text-right">{i + 1}</span>
                          <button
                            onClick={() => { setFlt(prev => ({ ...prev, path: p.path })); setTab('errors'); setPage(1); }}
                            className="text-xs text-sky-400 hover:text-sky-300 font-mono w-48 truncate text-left transition-colors"
                          >
                            {p.path}
                          </button>
                          <div className="flex-1 bg-gray-800 rounded-full h-1.5">
                            <div className="h-full rounded-full bg-gradient-to-r from-sky-600/70 to-sky-400/70"
                              style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[11px] font-bold text-gray-500 w-8 text-right tabular-nums">{p.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Erreurs par entreprise */}
              {stats.byCompany.length > 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
                    Entreprises avec le + d'erreurs — 7 jours
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {stats.byCompany.slice(0, 10).map((c, i) => (
                      <button key={i}
                        onClick={() => { setFlt(p => ({ ...p, companyId: c.companyId })); setTab('errors'); setPage(1); }}
                        className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl p-3 text-left transition-colors">
                        <div className="flex items-center gap-2 mb-1">
                          <Building2 size={11} className="text-blue-400 shrink-0" />
                          <p className="text-[11px] font-semibold text-white truncate">{c.name}</p>
                        </div>
                        <p className="text-xl font-black text-red-400">{c.count}</p>
                        <p className="text-[10px] text-gray-600">erreur{c.count > 1 ? 's' : ''}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Dernières 500 */}
              {stats.recent500.length > 0 && (
                <div className="bg-gray-900 border border-red-500/20 rounded-xl overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-gray-800 flex items-center gap-2">
                    <Server size={15} className="text-red-500" />
                    <p className="text-sm font-bold text-white">Dernières erreurs serveur 500</p>
                    <span className="text-[10px] text-gray-600 ml-auto">7 derniers jours</span>
                  </div>
                  <div className="divide-y divide-gray-800">
                    {stats.recent500.map((e, i) => (
                      <div key={i} className="flex items-start gap-3 px-5 py-3">
                        <span className="text-[11px] font-bold font-mono text-red-400 shrink-0 mt-0.5">{e.errorCode}</span>
                        <p className="text-xs text-gray-400 flex-1 truncate">{e.message}</p>
                        <span className="text-[10px] font-mono text-gray-700 whitespace-nowrap">{fmtShort(e.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 text-gray-600">
              <Bug size={40} className="mx-auto mb-3 opacity-20" />
              <p>Statistiques indisponibles</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}