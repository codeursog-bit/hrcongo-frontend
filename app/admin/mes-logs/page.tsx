// ============================================================================
// 📋 PAGE LOGS SYSTÈME — crons, jobs planifiés, alertes (visible en prod)
// ============================================================================
// Fichier: frontend/app/admin/logs/page.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollText, RefreshCw, Loader2, ChevronDown, ChevronRight,
  Info, AlertTriangle, XCircle, Siren, Clock,
} from 'lucide-react';
import { adminService } from '@/lib/services/adminService';

const LEVEL_STYLE: Record<string, { badge: string; icon: any }> = {
  INFO:    { badge: 'bg-sky-500/15 text-sky-300 border-sky-500/25',       icon: Info },
  WARNING: { badge: 'bg-amber-500/15 text-amber-300 border-amber-500/25', icon: AlertTriangle },
  ERROR:   { badge: 'bg-red-500/15 text-red-300 border-red-500/25',       icon: XCircle },
  ALERT:   { badge: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/25', icon: Siren },
};

const fmtDateTime = (d: string) => new Date(d).toLocaleString('fr-FR', {
  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit',
});

export default function SystemLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [source, setSource] = useState('');
  const [level, setLevel] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminService.getSystemLogs({ source: source || undefined, level: level || undefined, limit: 200 });
      setLogs(r?.data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [source, level]);

  useEffect(() => {
    adminService.getSystemLogSources().then(setSources).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <ScrollText className="text-red-500" size={24} /> Logs Système
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Crons et jobs planifiés — ce que tu ne vois plus en production
          </p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm transition-colors disabled:opacity-50">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Actualiser
        </button>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3">
        <select value={source} onChange={e => setSource(e.target.value)}
          className="px-3 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-gray-300 outline-none focus:border-gray-600 transition-colors">
          <option value="">Toutes les sources</option>
          {sources.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={level} onChange={e => setLevel(e.target.value)}
          className="px-3 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-gray-300 outline-none focus:border-gray-600 transition-colors">
          <option value="">Tous les niveaux</option>
          <option value="INFO">Info</option>
          <option value="WARNING">Avertissement</option>
          <option value="ERROR">Erreur</option>
          <option value="ALERT">Alerte</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={28} className="animate-spin text-red-500" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-gray-600">
            <ScrollText size={36} className="mb-2 opacity-20" />
            <p className="text-sm">Aucun log pour ces filtres</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {logs.map((log) => {
              const style = LEVEL_STYLE[log.level] ?? LEVEL_STYLE.INFO;
              const Icon = style.icon;
              const isOpen = expanded === log.id;
              const skipped = log.details?.skipped ?? [];

              return (
                <div key={log.id}>
                  <button
                    onClick={() => setExpanded(isOpen ? null : log.id)}
                    className="w-full flex items-start gap-3 px-5 py-4 hover:bg-gray-800/30 transition-colors text-left">
                    {skipped.length > 0 ? (
                      isOpen ? <ChevronDown size={14} className="text-gray-600 mt-1 shrink-0" /> : <ChevronRight size={14} className="text-gray-600 mt-1 shrink-0" />
                    ) : <span className="w-[14px]" />}

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 shrink-0 mt-0.5 ${style.badge}`}>
                      <Icon size={11} /> {log.level}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-gray-500">{log.source}</span>
                        {log.companyName && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">{log.companyName}</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-200 mt-0.5">{log.message}</p>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-gray-600 shrink-0">
                      <Clock size={11} />
                      {fmtDateTime(log.createdAt)}
                    </div>
                  </button>

                  {isOpen && skipped.length > 0 && (
                    <div className="px-5 pb-4 pl-12">
                      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 space-y-1.5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                          Détail — {skipped.length} non notifié(s)
                        </p>
                        {skipped.map((s: any, i: number) => (
                          <div key={i} className="text-xs flex justify-between gap-4">
                            <span className="text-gray-300">{s.name ?? s.employeeId ?? '—'}</span>
                            <span className="text-amber-400/80 text-right">{s.reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}