// ============================================================================
// 👀 PAGE ACTIVITÉ UTILISATEURS — en ligne, récemment vus, classement
// ============================================================================
// Fichier: frontend/app/admin/user-activity/page.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Radio, RefreshCw, Loader2, Clock, Trophy, Circle, BellRing, BellOff, AlertTriangle,
} from 'lucide-react';
import { adminService } from '@/lib/services/adminService';

const fmtTime = (d: string) => new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
const fmtRelative = (d: string) => {
  const min = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${Math.floor(h / 24)}j`;
};
const fmtMinutes = (m: number) => {
  const h = Math.floor(m / 60);
  const rem = Math.round(m % 60);
  return h > 0 ? `${h}h${String(rem).padStart(2, '0')}` : `${rem}min`;
};

type Period = 'today' | 'week' | 'month';

export default function UserActivityPage() {
  const [online, setOnline] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [pushStatus, setPushStatus] = useState<any>(null);
  const [period, setPeriod] = useState<Period>('week');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [o, r, t, p] = await Promise.all([
        adminService.getUsersOnlineNow(),
        adminService.getUsersRecentlyOnline(24),
        adminService.getMostActiveUsers(period),
        adminService.getPushStatus(),
      ]);
      setOnline(o ?? []);
      setRecent(r ?? []);
      setTopUsers(t ?? []);
      setPushStatus(p ?? null);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [period]);

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000); // auto-refresh — "en ligne" bouge vite
    return () => clearInterval(t);
  }, [load]);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Radio className="text-red-500" size={24} /> Activité Utilisateurs
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Présence en temps réel et temps actif — actualisation auto toutes les 30s
          </p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm transition-colors disabled:opacity-50">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Actualiser
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* En ligne maintenant */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <p className="font-bold text-white text-sm">En ligne maintenant</p>
            </div>
            <span className="text-xs text-gray-500">{online.length} actif{online.length > 1 ? 's' : ''}</span>
          </div>
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-800">
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-gray-600" /></div>
            ) : online.length === 0 ? (
              <p className="text-sm text-gray-600 text-center py-10">Personne en ligne actuellement</p>
            ) : online.map((u, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{u.name}</p>
                  <p className="text-xs text-gray-600 truncate">{u.companyName ?? 'Plateforme'} · {u.role}</p>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 shrink-0">EN LIGNE</span>
              </div>
            ))}
          </div>
        </div>

        {/* Récemment en ligne */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-2">
            <Clock size={15} className="text-sky-400" />
            <p className="font-bold text-white text-sm">Récemment en ligne (24h)</p>
          </div>
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-800">
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-gray-600" /></div>
            ) : recent.length === 0 ? (
              <p className="text-sm text-gray-600 text-center py-10">Aucune activité sur les dernières 24h</p>
            ) : recent.map((u, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Circle size={7} className={u.isOnlineNow ? 'text-emerald-500 fill-emerald-500' : 'text-gray-700 fill-gray-700'} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{u.name}</p>
                    <p className="text-xs text-gray-600 truncate">{u.companyName ?? 'Plateforme'}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500 shrink-0">{fmtRelative(u.lastActiveAt)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications push */}
      {pushStatus && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BellRing size={15} className="text-violet-400" />
              <p className="font-bold text-white text-sm">Notifications push</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="text-emerald-400 font-semibold">{pushStatus.activeDeviceCount} actifs</span>
              {pushStatus.brokenCount > 0 && (
                <span className="text-amber-400 font-semibold flex items-center gap-1">
                  <AlertTriangle size={11} /> {pushStatus.brokenCount} activé(s) sans appareil
                </span>
              )}
              <span className="text-gray-600">{pushStatus.totalUsers - pushStatus.enabledCount} désactivé(s)</span>
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-gray-800">
            {pushStatus.users.length === 0 ? (
              <p className="text-sm text-gray-600 text-center py-10">Personne n'a activé les notifications</p>
            ) : pushStatus.users.map((u: any, i: number) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{u.name}</p>
                  <p className="text-xs text-gray-600 truncate">{u.companyName ?? 'Plateforme'} · {u.role}</p>
                </div>
                {u.status === 'active' ? (
                  <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 shrink-0">
                    <BellRing size={11} /> ACTIF{u.deviceCount > 1 ? ` · ${u.deviceCount} appareils` : ''}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1 shrink-0" title="Activé côté profil mais aucun appareil enregistré">
                    <BellOff size={11} /> SANS APPAREIL
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top utilisateurs actifs */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy size={15} className="text-amber-400" />
            <p className="font-bold text-white text-sm">Utilisateurs les plus actifs</p>
          </div>
          <div className="flex bg-gray-800 border border-gray-700 rounded-lg p-0.5">
            {([['today', "Aujourd'hui"], ['week', '7 jours'], ['month', '30 jours']] as [Period, string][]).map(([k, l]) => (
              <button key={k} onClick={() => setPeriod(k)}
                className={`px-3 py-1 rounded-md text-xs transition-colors ${period === k ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-gray-600" /></div>
        ) : topUsers.length === 0 ? (
          <p className="text-sm text-gray-600 text-center py-10">Pas encore de données pour cette période</p>
        ) : (
          <div className="divide-y divide-gray-800">
            {topUsers.map((u, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3">
                <span className={`text-xs font-black w-6 text-center ${i < 3 ? 'text-amber-400' : 'text-gray-600'}`}>#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{u.name}</p>
                  <p className="text-xs text-gray-600 truncate">{u.companyName ?? 'Plateforme'} · {u.role}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-white">{fmtMinutes(u.activeMinutes)}</p>
                  <p className="text-[10px] text-gray-600">{u.requestCount} actions</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}