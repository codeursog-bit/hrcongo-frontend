// ============================================================================
// 🔔 PAGE NOTIFICATIONS PUSH — diagnostic complet, tous utilisateurs
// ============================================================================
// Fichier: frontend/app/admin/push-notifications/page.tsx
//
// Objectif : voir en un coup d'œil qui a activé le push, qui ne l'a jamais
// activé, et qui a activé côté profil mais n'a aucun appareil enregistré
// (abonnement cassé — c'est souvent la cause réelle de "je ne reçois pas
// mes push" : le toggle est ON en base mais le navigateur n'a jamais
// finalisé l'abonnement technique, ou l'a perdu depuis).

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell, BellRing, BellOff, AlertTriangle, RefreshCw, Loader2,
  Search, Smartphone, ShieldAlert, CheckCircle2,
} from 'lucide-react';
import { adminService } from '@/lib/services/adminService';

type StatusFilter = 'all' | 'active' | 'enabled_no_device' | 'disabled';

const fmtRelative = (d: string | null) => {
  if (!d) return 'jamais';
  const min = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${Math.floor(h / 24)}j`;
};

const STATUS_META: Record<'active' | 'enabled_no_device' | 'disabled', { label: string; cls: string; icon: any }> = {
  active:             { label: 'Actif',              cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: BellRing },
  enabled_no_device:  { label: 'Activé sans appareil', cls: 'text-amber-400 bg-amber-500/10 border-amber-500/20',     icon: AlertTriangle },
  disabled:           { label: 'Désactivé',          cls: 'text-gray-500 bg-gray-800 border-gray-700',               icon: BellOff },
};

export default function PushNotificationsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const d = await adminService.getPushDiagnostics();
      setData(d);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    let list = data.users as any[];
    if (filter !== 'all') list = list.filter((u) => u.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((u) =>
        u.name.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        (u.companyName ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [data, filter, search]);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Bell className="text-red-500" size={24} /> Notifications Push
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Qui a activé, qui n'a jamais activé, et qui a un abonnement cassé
          </p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm transition-colors disabled:opacity-50">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Actualiser
        </button>
      </div>

      {/* Alerte VAPID — cause n°1 d'un push qui ne part jamais, pour PERSONNE */}
      {data && !data.vapidConfigured && (
        <div className="bg-red-950/40 border border-red-800 rounded-2xl p-4 flex items-start gap-3">
          <ShieldAlert className="text-red-500 shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-sm font-bold text-red-300">Clés VAPID manquantes sur le serveur</p>
            <p className="text-xs text-red-400/80 mt-1">
              Aucune notification push ne peut être envoyée sur toute la plateforme, quel que soit
              le statut d'activation des utilisateurs ci-dessous. Vérifie <code className="bg-red-900/40 px-1 rounded">VAPID_PUBLIC_KEY</code> et{' '}
              <code className="bg-red-900/40 px-1 rounded">VAPID_PRIVATE_KEY</code> dans les variables d'environnement du backend.
            </p>
          </div>
        </div>
      )}

      {/* Compteurs / filtres */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {([
            ['all', 'Tous', data.totalUsers, 'text-white'],
            ['active', 'Actifs', data.activeCount, 'text-emerald-400'],
            ['enabled_no_device', 'Sans appareil', data.brokenCount, 'text-amber-400'],
            ['disabled', 'Désactivés', data.disabledCount, 'text-gray-400'],
          ] as [StatusFilter, string, number, string][]).map(([key, label, count, cls]) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`text-left p-3.5 rounded-xl border transition-colors ${filter === key ? 'bg-gray-800 border-gray-600' : 'bg-gray-900 border-gray-800 hover:border-gray-700'}`}>
              <p className={`text-2xl font-black ${cls}`}>{count}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </button>
          ))}
        </div>
      )}

      {/* Recherche */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Chercher un nom, un email, une entreprise…"
          className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-600"
        />
      </div>

      {/* Liste */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-gray-600" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-600 text-center py-16">Aucun utilisateur pour ce filtre</p>
        ) : (
          <div className="divide-y divide-gray-800">
            {filtered.map((u) => {
              const meta = STATUS_META[u.status as 'active' | 'enabled_no_device' | 'disabled'];
              const Icon = meta.icon;
              const isExpanded = expandedId === u.id;
              return (
                <div key={u.id}>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : u.id)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-gray-800/40 transition-colors text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">{u.name}</p>
                      <p className="text-xs text-gray-600 truncate">{u.email} · {u.companyName ?? 'Plateforme'} · {u.role}</p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-xs text-gray-600 hidden sm:block">Vu {fmtRelative(u.lastActiveAt)}</span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Smartphone size={12} /> {u.deviceCount}
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${meta.cls}`}>
                        <Icon size={11} /> {meta.label}
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-4 pt-1 bg-gray-950/40">
                      {u.status === 'enabled_no_device' && (
                        <p className="text-xs text-amber-400/90 mb-3 flex items-start gap-1.5">
                          <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                          Push activé côté profil mais aucun appareil enregistré — l'utilisateur doit
                          rouvrir l'app et réactiver le push depuis son navigateur/téléphone.
                        </p>
                      )}
                      {u.status === 'disabled' && (
                        <p className="text-xs text-gray-500 mb-3 flex items-start gap-1.5">
                          <BellOff size={12} className="shrink-0 mt-0.5" />
                          N'a jamais activé les notifications push.
                        </p>
                      )}
                      {u.devices.length > 0 ? (
                        <div className="space-y-1.5">
                          {u.devices.map((d: any) => (
                            <div key={d.id} className="flex items-center justify-between text-xs bg-gray-900 border border-gray-800 rounded-lg px-3 py-2">
                              <span className="text-gray-300 flex items-center gap-2">
                                <CheckCircle2 size={12} className="text-emerald-500" />
                                {d.label || 'Appareil sans nom'}
                              </span>
                              <span className="text-gray-600">
                                utilisé {fmtRelative(d.lastUsedAt)} · ajouté {fmtRelative(d.createdAt)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-700">Aucun appareil enregistré.</p>
                      )}
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