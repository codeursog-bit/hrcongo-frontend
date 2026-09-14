// ============================================================================
// 💳 PAGE ABONNEMENTS — expirations à venir / déjà expirés
// ============================================================================
// Fichier: frontend/app/admin/subscriptions/page.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  CreditCard, RefreshCw, Loader2, AlertTriangle, Clock, ChevronRight,
} from 'lucide-react';
import { adminService } from '@/lib/services/adminService';

const fmtFcfa = (n: number) => `${(n ?? 0).toLocaleString('fr-FR')} F`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', {
  day: '2-digit', month: 'short', year: 'numeric',
});

const PLAN_STYLE: Record<string, string> = {
  FREE:       'bg-slate-500/15 text-slate-300 border-slate-500/25',
  BASIC:      'bg-sky-500/15 text-sky-300 border-sky-500/25',
  PRO:        'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  ENTERPRISE: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
};

type Tab = 'expiring' | 'expired' | 'all';

export default function SubscriptionsPage() {
  const [tab, setTab] = useState<Tab>('expiring');
  const [days, setDays] = useState(7);
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const filters =
        tab === 'expiring' ? { expiringInDays: days } :
        tab === 'expired'  ? { expired: true } :
        {};
      const r = await adminService.getSubscriptions(filters);
      setSubs(Array.isArray(r) ? r : r?.data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [tab, days]);

  useEffect(() => { load(); }, [load]);

  const rowStyle = (s: any) => {
    if (s.isExpired) return 'text-red-400';
    if (s.daysRemaining <= 3) return 'text-amber-400';
    return 'text-gray-300';
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <CreditCard className="text-red-500" size={24} /> Abonnements
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Suivi des échéances — {subs.length} abonnement{subs.length > 1 ? 's' : ''} affiché{subs.length > 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm transition-colors disabled:opacity-50">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Actualiser
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex bg-gray-900 border border-gray-800 rounded-xl p-1">
          {([
            { k: 'expiring', l: 'Expirent bientôt' },
            { k: 'expired',  l: 'Expirés' },
            { k: 'all',      l: 'Tous' },
          ] as { k: Tab; l: string }[]).map(t => (
            <button key={t.k} onClick={() => setTab(t.k)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                tab === t.k ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'
              }`}>
              {t.l}
            </button>
          ))}
        </div>

        {tab === 'expiring' && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock size={14} />
            Dans les
            <input type="number" min={1} value={days}
              onChange={e => setDays(parseInt(e.target.value) || 1)}
              className="w-16 bg-gray-900 border border-gray-800 rounded-lg px-2 py-1 text-white text-center outline-none focus:border-gray-600" />
            jours
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={28} className="animate-spin text-red-500" />
          </div>
        ) : subs.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-gray-600">
            <CreditCard size={36} className="mb-2 opacity-20" />
            <p className="text-sm">
              {tab === 'expired' ? 'Aucun abonnement expiré' : 'Aucune échéance dans cette fenêtre'}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden lg:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_40px] gap-4 px-5 py-3 border-b border-gray-800">
              {['Entreprise', 'Plan', 'Statut', 'Fin de période', 'Jours restants', ''].map((h, i) => (
                <span key={i} className="text-[10px] font-bold uppercase tracking-widest text-gray-600">{h}</span>
              ))}
            </div>
            <div className="divide-y divide-gray-800">
              {subs.map((s, i) => (
                <Link key={i} href={`/admin/companies/${s.companyId}`}
                  className="grid grid-cols-1 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_40px] gap-4 items-center px-5 py-4 hover:bg-gray-800/30 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{s.companyName}</p>
                    <p className="text-xs text-gray-600">{fmtFcfa(s.pricePerMonth)} / mois</p>
                  </div>
                  <div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${PLAN_STYLE[s.plan] ?? 'bg-gray-700 text-gray-400 border-gray-600'}`}>
                      {s.plan}
                    </span>
                  </div>
                  <div className="text-sm text-gray-300">{s.status}</div>
                  <div className="text-sm text-gray-400">{fmtDate(s.currentPeriodEnd)}</div>
                  <div className={`text-sm font-semibold flex items-center gap-1.5 ${rowStyle(s)}`}>
                    {s.isExpired && <AlertTriangle size={13} />}
                    {s.isExpired
                      ? `Expiré depuis ${Math.abs(s.daysRemaining)}j`
                      : `${s.daysRemaining}j restant${s.daysRemaining > 1 ? 's' : ''}`}
                  </div>
                  <ChevronRight size={14} className="text-gray-700 justify-self-end" />
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}