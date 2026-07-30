// ============================================================================
// Fichier: app/admin/(protected)/billing/page.tsx
// Page Billing améliorée — utilise RevenueCharts + TransactionList
// ============================================================================

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Calendar, Download, Loader2, CreditCard, TrendingUp, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { RevenueCharts }   from '@/components/admin/billing/RevenueCharts';
import { TransactionList } from '@/components/admin/billing/TransactionList';
import { adminService }    from '@/lib/services/adminService';

const fmt     = (n: number) => n?.toLocaleString('fr-FR') ?? '0';
const fmtFcfa = (n: number) => `${fmt(Math.round(n ?? 0))} F`;
const fmtDate = (d: string) => new Date(d).toLocaleString('fr-FR', {
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

export default function BillingPage() {
  const [stats,     setStats]     = useState<any>(null);
  const [loading,   setLoading]   = useState(true);
  const [dateRange, setDateRange] = useState('Janvier 2025');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getBillingStats();
      setStats(data);
    } catch (err) {
      console.error('Erreur chargement billing:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    );
  }

  if (!stats) return null;

  const transactions   = stats.recentTransactions ?? [];
  const succeeded      = transactions.filter((t: any) => t.status === 'SUCCEEDED' || t.status === 'Success');
  const failed         = transactions.filter((t: any) => t.status === 'FAILED'    || t.status === 'Failed');
  const totalRev       = stats.totalRevenue ?? 0;

  // Adapter les transactions pour TransactionList (format attendu)
  const adaptedTransactions = transactions.map((t: any) => ({
    id:          t.id,
    date:        t.createdAt ? fmtDate(t.createdAt) : '—',
    companyName: t.company?.legalName ?? t.company?.tradeName ?? '—',
    companyLogo: (t.company?.legalName ?? '?')[0].toUpperCase(),
    invoiceId:   `INV-${t.id?.slice(0, 8).toUpperCase()}`,
    amount:      t.amount ?? 0,
    method:      t.paymentMethod ?? t.method ?? 'Virement',
    status:      t.status === 'SUCCEEDED' ? 'Success' : t.status === 'FAILED' ? 'Failed' : t.status ?? 'Pending',
    plan:        t.subscription?.plan ?? t.plan ?? '—',
  }));

  // Données pour RevenueCharts
  const revenueHistory = (stats.revenueHistory ?? []).map((r: any) => ({
    month: r.month ?? r.name ?? '',
    value: r.value ?? r.amount ?? 0,
  }));

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <CreditCard className="text-red-500" size={24} />
            Facturation & Abonnements
          </h1>
          <p className="text-gray-400 text-sm mt-1">Gérer tous les paiements et flux de revenus</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-gray-900 border border-gray-700 text-white pl-9 pr-8 py-2 rounded-lg text-sm outline-none cursor-pointer hover:bg-gray-800 transition-colors"
            >
              <option>Janvier 2025</option>
              <option>Décembre 2024</option>
              <option>Novembre 2024</option>
            </select>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm px-4 py-2 rounded-lg border border-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4" /> Actualiser
          </button>
          <button className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded-lg border border-gray-700 transition-colors">
            <Download className="w-4 h-4" /> Exporter
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { l: 'Revenus totaux',          v: fmtFcfa(totalRev),       c: 'text-amber-400',   I: TrendingUp   },
          { l: 'Transactions (récentes)', v: fmt(transactions.length), c: 'text-sky-400',     I: CreditCard   },
          { l: 'Paiements réussis',       v: fmt(succeeded.length),   c: 'text-emerald-400', I: CheckCircle2 },
          {
            l: 'Paiements échoués',
            v: fmt(failed.length),
            c: failed.length > 0 ? 'text-red-400' : 'text-gray-500',
            I: XCircle,
          },
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

      {/* Hero MRR */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-[#0B0F19] to-gray-900 border border-gray-800 rounded-2xl p-8">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Revenu Total (MRR)
            </h2>
            <div className="flex items-baseline gap-4">
              <span className="text-5xl font-extrabold text-white tracking-tight">
                {(totalRev / 1_000_000).toFixed(2)}M
              </span>
              <span className="text-xl font-medium text-gray-500">FCFA</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 bg-emerald-900/20 px-2 py-1 rounded text-sm font-bold">
                +12.5%
              </span>
              <span className="text-gray-500 text-sm">vs mois dernier</span>
            </div>
          </div>

          {/* Taux de succès */}
          {transactions.length > 0 && (
            <div className="lg:col-span-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
                Taux de succès des paiements
              </p>
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-gray-800 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-700"
                    style={{ width: `${Math.round((succeeded.length / transactions.length) * 100)}%` }}
                  />
                </div>
                <span className="text-xl font-black text-emerald-400 tabular-nums">
                  {Math.round((succeeded.length / transactions.length) * 100)}%
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                {succeeded.length} réussis · {failed.length} échoués · {transactions.length} total
              </p>
            </div>
          )}
        </div>
      </div>

      {/* RevenueCharts — graphes Recharts */}
      <RevenueCharts
        revenueHistory={revenueHistory}
        paymentStats={{ success: succeeded.length, failed: failed.length }}
      />

      {/* TransactionList — table complète */}
      <TransactionList transactions={adaptedTransactions} />
    </div>
  );
}