// ============================================================================
// Fichier: app/admin/(protected)/page.tsx
// Dashboard Super Admin — avec mini graphe MRR branché sur l'API
// ============================================================================

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Building2, Users, CreditCard, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle2, Activity, Clock, ArrowRight,
  Zap, Globe, Shield, BarChart2, Terminal, Loader2,
  RefreshCw, ChevronRight,
} from 'lucide-react';
import { MetricCard }    from '@/components/admin/MetricCard';
import { ActivityTable } from '@/components/admin/ActivityTable';
import { GrowthChart }   from '@/components/admin/Charts';
import { adminService }  from '@/lib/services/adminService';

const fmt  = (n: number) => n.toLocaleString('fr-FR');
const fcfa = (n: number) => `${fmt(n)} F`;
const pct  = (n: number) => `${n > 0 ? '+' : ''}${n}%`;
const fmtD = (d: string) => new Date(d).toLocaleDateString('fr-FR', {
  day: '2-digit', month: 'short', year: 'numeric',
});

function KPI({ icon: Icon, label, value, sub, trend, color = 'text-sky-400', href }: any) {
  return (
    <Link href={href ?? '#'} className="group bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-2xl p-5 block transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-800 group-hover:scale-110 transition-transform">
          <Icon size={18} className={color} />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-bold flex items-center gap-1 ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {pct(trend)}
          </span>
        )}
      </div>
      <p className="text-2xl font-black text-white mb-1">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
      {sub && <p className="text-[11px] text-gray-700 mt-0.5">{sub}</p>}
    </Link>
  );
}

export default function SuperAdminDashboard() {
  const [stats,     setStats]     = useState<any>(null);
  const [health,    setHealth]    = useState<any>(null);
  const [secEvts,   setSecEvts]   = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading,   setLoading]   = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [s, h, sec, a] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getServerHealth(),
        adminService.getSecurityEvents(10),
        adminService.getAnalytics().catch(() => null), // non bloquant
      ]);
      setStats(s); setHealth(h); setSecEvts(sec); setAnalytics(a);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={32} className="animate-spin text-red-500" />
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Command Center</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Vue globale · {new Date().toLocaleDateString('fr-FR', {
              weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
            })}
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm transition-colors"
        >
          <RefreshCw size={14} /> Actualiser
        </button>
      </div>

      {/* Status serveur */}
      {health && (
        <div className={`rounded-xl border px-5 py-3 flex items-center gap-3
          ${health.status === 'healthy' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
          <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${health.status === 'healthy' ? 'bg-emerald-400' : 'bg-red-400'}`} />
          <p className="text-sm font-medium text-gray-300">
            Serveur{' '}
            <span className={health.status === 'healthy' ? 'text-emerald-400' : 'text-red-400'}>
              {health.status === 'healthy' ? 'opérationnel' : 'dégradé'}
            </span>
            {' · '}Uptime {health.uptimeFormatted}
            {' · '}DB {health.db.latencyMs}ms
            {' · '}{health.activeSessions} sessions actives
          </p>
          <Link href="/admin/monitoring" className="ml-auto text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1">
            Voir monitoring <ChevronRight size={12} />
          </Link>
        </div>
      )}

      {/* KPIs */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPI icon={Building2} label="Entreprises actives" value={fmt(stats.activeCompanies ?? 0)}  trend={8}  color="text-sky-400"     href="/admin/companies" />
          <KPI icon={Users}     label="Utilisateurs totaux" value={fmt(stats.totalUsers ?? 0)}       trend={12} color="text-emerald-400" href="/admin/users"      />
          <KPI icon={CreditCard}label="MRR"                 value={fcfa(stats.totalMRR ?? 0)}        trend={15} color="text-amber-400"   href="/admin/billing"   />
          <KPI icon={BarChart2} label="Employés gérés"      value={fmt(stats.totalEmployees ?? 0)}   trend={5}  color="text-violet-400"  href="/admin/analytics" />
        </div>
      )}

      {/* Mini graphe MRR — branché sur analytics.growthData */}
      {analytics?.growthData?.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
            <p className="font-bold text-white flex items-center gap-2">
              <TrendingUp size={16} className="text-amber-400" /> Croissance MRR & Utilisateurs
            </p>
            <Link href="/admin/analytics" className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1">
              Analytics complet <ArrowRight size={11} />
            </Link>
          </div>
          <div className="px-5 py-4">
            <GrowthChart data={analytics.growthData} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Dernières entreprises */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
            <p className="font-bold text-white flex items-center gap-2">
              <Building2 size={16} className="text-sky-400" /> Dernières entreprises
            </p>
            <Link href="/admin/companies" className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1">
              Voir tout <ArrowRight size={11} />
            </Link>
          </div>
          <div className="divide-y divide-gray-800">
            {(stats?.recentCompanies ?? []).slice(0, 5).map((c: any, i: number) => (
              <Link key={i} href={`/admin/companies/${c.id}`}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-800/40 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-600/20 border border-sky-500/15 flex items-center justify-center shrink-0">
                  <span className="text-xs font-black text-sky-400">
                    {(c.legalName ?? c.name ?? '?')[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{c.legalName ?? c.name}</p>
                  <p className="text-xs text-gray-600">{c.email} · {c.employeeCount ?? 0} employés</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.isActive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-gray-700 text-gray-500'}`}>
                    {c.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <p className="text-[10px] text-gray-700 mt-0.5">{c.createdAt ? fmtD(c.createdAt) : '—'}</p>
                </div>
              </Link>
            ))}
            {!stats?.recentCompanies?.length && (
              <p className="text-center text-gray-600 text-sm py-8">Aucune entreprise</p>
            )}
          </div>
        </div>

        {/* Alertes sécurité */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
            <p className="font-bold text-white flex items-center gap-2">
              <Shield size={16} className="text-red-500" /> Alertes sécurité
            </p>
            <Link href="/admin/monitoring" className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1">
              Voir tout <ArrowRight size={11} />
            </Link>
          </div>
          {secEvts.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-gray-600">
              <CheckCircle2 size={28} className="mb-2 text-emerald-700 opacity-40" />
              <p className="text-sm text-emerald-700">Aucune alerte critique</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {secEvts.map((e, i) => (
                <div key={i} className="px-5 py-3 flex items-start gap-3">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                    e.risk === 'Critical' ? 'bg-red-400' : e.risk === 'High' ? 'bg-orange-400' : 'bg-amber-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-gray-300 truncate">{e.action.replace(/_/g, ' ')}</p>
                    <p className="text-[10px] text-gray-600 truncate">{e.company} · {e.ip}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Navigation rapide */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: '/admin/analytics', l: 'Analytics',  I: BarChart2, c: 'text-violet-400', sub: 'Croissance & churn'   },
          { href: '/admin/billing',   l: 'Revenus',    I: CreditCard,c: 'text-amber-400',  sub: 'MRR & transactions'   },
          { href: '/admin/monitoring',l: 'Monitoring', I: Terminal,  c: 'text-red-400',    sub: 'Audit & santé'        },
          { href: '/admin/settings',  l: 'Paramètres', I: Zap,       c: 'text-emerald-400',sub: 'Config plateforme'    },
        ].map((item, i) => (
          <Link key={i} href={item.href}
            className="bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl p-4 flex items-center gap-3 transition-colors group">
            <div className="w-9 h-9 rounded-xl bg-gray-800 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <item.I size={16} className={item.c} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{item.l}</p>
              <p className="text-[10px] text-gray-600">{item.sub}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}