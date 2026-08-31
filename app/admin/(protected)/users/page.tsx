'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield, UserPlus, Search, CheckCircle, XCircle, Clock,
  Key, MoreVertical, Loader2, RefreshCw, AlertTriangle,
  User, Mail, Globe, Lock, ShieldCheck,
} from 'lucide-react';
import { adminService } from '@/lib/services/adminService';

const fmtD = (d?: string) => d
  ? new Date(d).toLocaleString('fr-FR', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })
  : '—';

const ROLE_STYLE: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-500/15 text-red-300 border-red-500/25',
  ADMIN:       'bg-sky-500/15 text-sky-300 border-sky-500/25',
  HR_MANAGER:  'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
};

export default function UsersPage() {
  const [users,   setUsers]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [showInvite, setInvite] = useState(false);
  const [invEmail, setInvEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [msg, setMsg] = useState<{t:'ok'|'err';s:string}|null>(null);

  // Stats depuis audit logs
  const [auditStats, setAuditStats] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [u, as] = await Promise.all([
        adminService.getUsers().catch(() => []),
        adminService.getMonitoringStats().catch(() => null),
      ]);
      setUsers(Array.isArray(u) ? u : u?.data ?? []);
      setAuditStats(as);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = users.filter(u =>
    !search ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.firstName?.toLowerCase().includes(search.toLowerCase()) ||
    u.lastName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Shield className="text-red-500" size={24} /> Administrateurs Plateforme
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Comptes à hauts privilèges — Super Admins et Admins internes
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={load} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm transition-colors disabled:opacity-50">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Actualiser
          </button>
          <button onClick={() => setInvite(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-100 text-gray-900 rounded-xl font-bold text-sm transition-colors shadow-lg">
            <UserPlus size={16} /> Inviter Super Admin
          </button>
        </div>
      </div>

      {/* Stats rapides depuis audit */}
      {auditStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { l: 'Connexions (24h)',   v: auditStats.logins24h,       c: 'text-sky-400'     },
            { l: 'Échecs connexion',   v: auditStats.failedLogins24h, c: 'text-red-400'     },
            { l: 'Taux d\'échec',      v: `${auditStats.failRatio}%`, c: auditStats.failRatio > 20 ? 'text-red-400' : 'text-emerald-400' },
            { l: 'Sessions actives',   v: '—',                         c: 'text-violet-400'  },
          ].map((s, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-[11px] text-gray-600 mb-2">{s.l}</p>
              <p className={`text-xl font-black ${s.c}`}>{s.v}</p>
            </div>
          ))}
        </div>
      )}

      {/* Message */}
      {msg && (
        <div className={`flex items-center gap-2 p-3.5 rounded-xl border text-sm font-medium
          ${msg.t === 'ok' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-red-500/10 border-red-500/20 text-red-300'}`}>
          {msg.t === 'ok' ? <CheckCircle size={15} /> : <AlertTriangle size={15} />} {msg.s}
        </div>
      )}

      {/* Recherche */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par email, nom…"
          className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white placeholder:text-gray-700 outline-none focus:border-gray-600 transition-colors" />
      </div>

      {/* Liste */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-800 flex items-center justify-between">
          <p className="text-sm font-bold text-white">{filtered.length} administrateur{filtered.length > 1 ? 's' : ''}</p>
          <span className="text-[10px] text-gray-600 font-mono">Tous les accès sont logués dans Monitoring</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-red-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-600">
            <User size={32} className="mx-auto mb-2 opacity-20" />
            <p className="text-sm">Aucun utilisateur</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {filtered.map((u, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-800/30 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-red-700/20 border border-red-500/15 flex items-center justify-center shrink-0">
                  <span className="text-sm font-black text-red-400">
                    {(u.firstName?.[0] ?? u.email?.[0] ?? '?').toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="text-sm font-semibold text-white">{u.firstName} {u.lastName}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${ROLE_STYLE[u.role] ?? 'bg-gray-700 text-gray-400 border-gray-600'}`}>
                      {u.role}
                    </span>
                    {u.twoFactorEnabled && (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                        <ShieldCheck size={9} /> 2FA
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 flex items-center gap-1">
                    <Mail size={10} /> {u.email}
                  </p>
                  {u.lastLoginAt && (
                    <p className="text-[10px] text-gray-700 flex items-center gap-1 mt-0.5">
                      <Clock size={9} /> Dernière connexion : {fmtD(u.lastLoginAt)}
                      {u.lastLoginIp && <><Globe size={9} className="ml-1" /> {u.lastLoginIp}</>}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`w-2 h-2 rounded-full ${u.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'}`} />
                  <span className="text-[11px] text-gray-500">{u.isActive ? 'Actif' : 'Inactif'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal invitation */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-1">Inviter un Super Admin</h3>
            <p className="text-xs text-gray-500 mb-5">Cette action crée un compte avec accès total à la plateforme.</p>
            <input type="email" value={invEmail} onChange={e => setInvEmail(e.target.value)}
              placeholder="email@konzarh.com"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm outline-none focus:border-red-500/50 mb-4 transition-colors" />
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  if (!invEmail) return;
                  setInviting(true);
                  try {
                    await adminService.inviteSuperAdmin?.(invEmail);
                    setMsg({ t: 'ok', s: `Invitation envoyée à ${invEmail}` });
                    setInvite(false); setInvEmail('');
                  } catch(e: any) {
                    setMsg({ t: 'err', s: e.message });
                  } finally { setInviting(false); }
                }}
                disabled={inviting || !invEmail}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                {inviting ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                Envoyer l'invitation
              </button>
              <button onClick={() => { setInvite(false); setInvEmail(''); }}
                className="px-4 py-2.5 border border-gray-700 text-gray-400 rounded-xl text-sm hover:bg-gray-800 transition-colors">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}