// ============================================================================
// Fichier: app/admin/(protected)/analytics/page.tsx
// Page Analytics améliorée — utilise les vrais composants + données API
// ============================================================================

'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar, Download, ArrowUpRight, ArrowDownRight, Users,
  CreditCard, Activity, AlertTriangle, AlertCircle, Loader2,
  MapPin, TrendingUp, TrendingDown, RefreshCw, BarChart2,
} from 'lucide-react';
import { AnalyticsCard } from '@/components/admin/analytics/AnalyticsCard';
import {
  AcquisitionChart, ChurnPieChart, DauChart,
  FeatureBarChart, LatencyChart, IndustryPieChart,
} from '@/components/admin/analytics/AnalyticsCharts';
import { CohortAnalysis } from '@/components/admin/analytics/CohortAnalysis';
import { adminService } from '@/lib/services/adminService';

const fmt     = (n: number) => n?.toLocaleString('fr-FR') ?? '0';
const fmtFcfa = (n: number) => `${fmt(Math.round(n ?? 0))} F`;
const pct     = (a: number, b: number) => b > 0 ? Math.round(((a - b) / b) * 100) : 0;

const MOIS = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'];

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [stats,     setStats]     = useState<any>(null);
  const [loading,   setLoading]   = useState(true);
  const [dateRange, setDateRange] = useState('Last 30 Days');

  const load = async () => {
    setLoading(true);
    try {
      const [a, s] = await Promise.all([
        adminService.getAnalytics().catch(() => null),
        adminService.getMonitoringStats().catch(() => null),
      ]);
      setAnalytics(a);
      setStats(s);
    } catch (err) {
      console.error('Erreur chargement analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-600">
        <BarChart2 size={40} className="mb-3 opacity-20" />
        <p>Analytics indisponibles</p>
      </div>
    );
  }

  // Données de croissance
  const growth      = analytics.growthData ?? [];
  const latest      = growth[growth.length - 1] ?? {};
  const prev        = growth[growth.length - 2] ?? {};
  const lastAcquisition = analytics.acquisitionData?.[analytics.acquisitionData?.length - 1]?.value ?? 0;

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <BarChart2 className="text-red-500" size={24} />
            Analytique Plateforme
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Analyse approfondie des performances et du comportement des utilisateurs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-gray-900 border border-gray-700 text-white pl-9 pr-8 py-2 rounded-lg text-sm appearance-none outline-none focus:border-red-500 cursor-pointer hover:bg-gray-800 transition-colors"
            >
              <option value="Today">Aujourd'hui</option>
              <option value="Last 7 Days">7 Derniers Jours</option>
              <option value="Last 30 Days">30 Derniers Jours</option>
              <option value="This Quarter">Ce Trimestre</option>
              <option value="This Year">Cette Année</option>
            </select>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm px-4 py-2 rounded-lg border border-gray-700 transition-colors"
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
          {
            l: 'Entreprises', v: fmt(latest.companies ?? 0),
            trend: pct(latest.companies, prev.companies),
            c: 'text-sky-400', I: Users,
          },
          {
            l: 'Revenus ce mois', v: fmtFcfa(latest.revenue ?? 0),
            trend: pct(latest.revenue, prev.revenue),
            c: 'text-amber-400', I: CreditCard,
          },
          {
            l: 'Événements 7j', v: fmt(stats?.total7d ?? 0),
            trend: 0,
            c: 'text-violet-400', I: Activity,
          },
          {
            l: 'Taux d\'échec auth', v: `${stats?.failRatio ?? 0}%`,
            trend: 0,
            c: (stats?.failRatio ?? 0) > 20 ? 'text-red-400' : 'text-emerald-400',
            I: AlertTriangle,
          },
        ].map((s, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <s.I size={14} className={s.c} />
                <span className="text-[11px] text-gray-600">{s.l}</span>
              </div>
              {s.trend !== 0 && (
                <span className={`text-[10px] font-bold flex items-center gap-0.5 ${s.trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {s.trend >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {s.trend > 0 ? '+' : ''}{s.trend}%
                </span>
              )}
            </div>
            <p className={`text-2xl font-black ${s.c}`}>{s.v}</p>
          </div>
        ))}
      </div>

      {/* Executive Summary */}
      <div className="relative overflow-hidden bg-gradient-to-r from-gray-900 via-[#0B0F19] to-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 relative z-10 text-center lg:text-left">
          <div className="flex flex-col justify-center items-center lg:items-start border-b lg:border-b-0 lg:border-r border-gray-800 pb-6 lg:pb-0">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Entreprises Actives</span>
            <div className="text-4xl font-extrabold text-white">{fmt(latest.companies ?? 0)}</div>
            <div className="flex items-center gap-2 mt-2 bg-emerald-900/20 px-3 py-1 rounded-full border border-emerald-900/30">
              <ArrowUpRight className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-bold text-emerald-400">
                +{pct(latest.companies, prev.companies)}%
              </span>
            </div>
          </div>
          <div className="flex flex-col justify-center items-center lg:items-start space-y-4 border-b lg:border-b-0 lg:border-r border-gray-800 pb-6 lg:pb-0 lg:pl-8">
            <div>
              <span className="text-xs text-gray-500 uppercase">Revenu Total (MRR)</span>
              <div className="text-xl font-bold text-amber-400">{fmtFcfa(latest.revenue ?? 0)}</div>
              <span className="text-xs text-emerald-500 font-medium">
                +{pct(latest.revenue, prev.revenue)}% vs mois préc.
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase">Santé Plateforme</span>
              <div className="text-xl font-bold text-white">
                {(stats?.failRatio ?? 0) < 5 ? 'Excellent' : (stats?.failRatio ?? 0) < 15 ? 'Bon' : 'Dégradé'}
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-center items-center lg:items-start space-y-4 border-b lg:border-b-0 lg:border-r border-gray-800 pb-6 lg:pb-0 lg:pl-8">
            <div>
              <span className="text-xs text-gray-500 uppercase">Événements Critiques 7j</span>
              <div className={`text-xl font-bold ${(stats?.critical7d ?? 0) > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {fmt(stats?.critical7d ?? 0)}
              </div>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase">Connexions 24h</span>
              <div className="text-xl font-bold text-white">{fmt(stats?.logins24h ?? 0)}</div>
            </div>
          </div>
          <div className="flex flex-col justify-center items-center lg:items-start lg:pl-8">
            <div className="w-full bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <span className="text-xs text-gray-400 uppercase font-bold mb-2 block">Actions Rapides</span>
              <div className="space-y-2">
                <button className="w-full text-left text-xs text-sky-400 hover:text-white hover:underline">Voir Rapport Churn →</button>
                <button className="w-full text-left text-xs text-sky-400 hover:text-white hover:underline">Analyser Revenus →</button>
                <button className="w-full text-left text-xs text-sky-400 hover:text-white hover:underline">Logs Système →</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 1 — ACQUISITION & CHURN */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <AnalyticsCard title="Acquisition Utilisateurs" subtitle="Nouveaux vs mois préc.">
          <div className="mb-4">
            <div className="flex justify-between items-end mb-1">
              <span className="text-2xl font-bold text-white">{lastAcquisition}</span>
              <span className="text-xs text-gray-400">Ce mois</span>
            </div>
            <div className="text-xs text-emerald-400 flex items-center">
              <ArrowUpRight className="w-3 h-3 mr-1" /> Nouveaux utilisateurs
            </div>
          </div>
          <AcquisitionChart data={analytics.acquisitionData ?? []} />
          <div className="mt-4 pt-4 border-t border-gray-800 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-500 block">Direct</span>
              <span className="text-white font-bold">45%</span>
            </div>
            <div>
              <span className="text-gray-500 block">Parrainage</span>
              <span className="text-white font-bold">30%</span>
            </div>
          </div>
        </AnalyticsCard>

        <AnalyticsCard title="Churn & Rétention" subtitle="Taux d'attrition mensuel">
          <div className="flex justify-between items-center mb-2">
            <div>
              <div className="text-2xl font-bold text-white">
                {analytics.churnData?.rate ?? 0}%
              </div>
              <div className="text-xs text-red-400">
                {analytics.churnData?.count ?? 0} entreprises perdues
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-white">78%</div>
              <div className="text-xs text-gray-500">Rétention Annuelle</div>
            </div>
          </div>
          <ChurnPieChart data={analytics.churnData?.reasons ?? []} />
          <div className="mt-2 text-center text-xs text-gray-500">
            Raison Principale: <span className="text-white font-medium">Prix (40%)</span>
          </div>
        </AnalyticsCard>

        <AnalyticsCard title="Économie Unitaire" subtitle="Efficacité des revenus">
          <div className="space-y-4 mt-2">
            {[
              { l: 'ARPU',     v: '15 000 F',  c: 'text-white'   },
              { l: 'LTV',      v: '180 000 F', c: 'text-amber-400' },
              { l: 'CAC',      v: '45 000 F',  c: 'text-red-400' },
            ].map((r, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-sm text-gray-400">{r.l}</span>
                <span className={`text-sm font-bold ${r.c}`}>{r.v}</span>
              </div>
            ))}
            <div className="pt-2 border-t border-gray-800">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-500">Ratio LTV/CAC</span>
                <span className="text-xs font-bold text-emerald-400">4.0x (Sain)</span>
              </div>
              <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '80%' }} />
              </div>
            </div>
          </div>
        </AnalyticsCard>

        <AnalyticsCard title="Prédiction Churn IA" subtitle="Analyse de risque (30j)">
          <div className="flex items-center gap-3 mb-6 bg-red-900/10 border border-red-900/30 p-3 rounded-lg">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <div>
              <div className="text-2xl font-bold text-white">7</div>
              <div className="text-xs text-red-400 font-bold">Entreprises à Haut Risque</div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="text-xs text-gray-500 uppercase font-bold">Facteurs Détectés</div>
            {[
              'Faible usage (> 14 jours sans connexion)',
              'Paiement échoué 2+ fois',
              'Ticket support ouvert > 7 jours',
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-gray-300">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                {f}
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold rounded-lg border border-gray-700 transition-colors">
            Contacter les Comptes à Risque
          </button>
        </AnalyticsCard>
      </div>

      {/* ROW 2 — DAU & Features */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AnalyticsCard title="Utilisateurs Actifs Quotidiens (DAU)" subtitle="Tendance 7 derniers jours" className="h-full">
            <div className="flex items-end gap-2 mb-4">
              <span className="text-3xl font-bold text-white">
                {analytics.dau?.[analytics.dau.length - 1]?.value ?? 0}
              </span>
              <span className="text-sm text-emerald-400 mb-1">Aujourd'hui</span>
            </div>
            <DauChart data={analytics.dau ?? []} />
            <div className="grid grid-cols-4 gap-4 mt-6">
              {[
                { l: 'DAU/MAU', v: '33%' },
                { l: 'Session Moy.', v: '24m' },
                { l: 'Taux Rebond', v: '12%' },
                { l: 'Pages/Session', v: '7.4' },
              ].map((s, i) => (
                <div key={i} className="p-3 bg-gray-800/50 rounded-lg text-center">
                  <span className="text-xs text-gray-500 block uppercase">{s.l}</span>
                  <span className="text-lg font-bold text-white">{s.v}</span>
                </div>
              ))}
            </div>
          </AnalyticsCard>
        </div>
        <div className="lg:col-span-1">
          <AnalyticsCard title="Utilisation Fonctionnalités" subtitle="Modules les plus adoptés" className="h-full">
            <FeatureBarChart />
            <div className="mt-4 p-3 bg-amber-900/10 border border-amber-900/30 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-bold text-amber-200">Alerte Faible Adoption</div>
                <div className="text-[10px] text-amber-400/80">
                  Seulement 29% utilisent les Documents.
                </div>
              </div>
            </div>
          </AnalyticsCard>
        </div>
      </div>

      {/* ROW 3 — Cohorte & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsCard title="Analyse de Cohorte" subtitle="Rétention par mois d'inscription">
          <CohortAnalysis data={analytics.cohortData ?? []} />
        </AnalyticsCard>
        <AnalyticsCard title="Performance Système" subtitle="Temps Réponse API (24h)">
          <div className="flex justify-between items-end mb-4">
            <div>
              <div className="text-2xl font-bold text-white">124ms</div>
              <div className="text-xs text-gray-400">Latence Moy.</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-red-400">0.05%</div>
              <div className="text-xs text-gray-500">Taux d'Erreur</div>
            </div>
          </div>
          <LatencyChart />
          <div className="space-y-3 mt-4">
            {[
              { route: 'POST /payroll/calculate', ms: 450, pct: 80, c: 'text-red-400 bg-red-500' },
              { route: 'GET /reports/analytics',  ms: 380, pct: 65, c: 'text-amber-400 bg-amber-500' },
            ].map((r, i) => (
              <div key={i}>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-gray-400 font-mono">{r.route}</span>
                  <span className={r.c.split(' ')[0] + ' font-bold'}>{r.ms}ms</span>
                </div>
                <div className="w-full bg-gray-800 h-1 rounded-full overflow-hidden">
                  <div className={`${r.c.split(' ')[1]} h-full rounded-full`} style={{ width: `${r.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </AnalyticsCard>
      </div>

      {/* ROW 4 — BI Géo & Secteur */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AnalyticsCard title="Distribution Géographique" subtitle="Entreprises par Ville">
          <div className="space-y-4 mt-2">
            {(analytics.geoDistribution ?? []).slice(0, 5).map((geo: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-500">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-white font-medium">{geo.city}</span>
                    <span className="text-gray-400">{geo.count}</span>
                  </div>
                  <div className="w-full bg-gray-800 h-1.5 rounded-full mt-1.5">
                    <div
                      className="bg-red-500 h-full rounded-full"
                      style={{ width: `${(geo.count / (latest.companies || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AnalyticsCard>

        <AnalyticsCard title="Répartition par Secteur" subtitle="Segmentation industrielle">
          <IndustryPieChart />
        </AnalyticsCard>

        {/* Stats monitoring */}
        {stats && (
          <AnalyticsCard title="Santé Plateforme" subtitle="7 derniers jours">
            <div className="grid grid-cols-2 gap-3 mt-2">
              {[
                { l: 'Événements',  v: fmt(stats.total7d),    c: 'text-sky-400'     },
                { l: 'Critiques',   v: fmt(stats.critical7d), c: 'text-red-400'     },
                { l: 'Connexions',  v: fmt(stats.logins24h),  c: 'text-emerald-400' },
                { l: 'Taux échec',  v: `${stats.failRatio}%`, c: stats.failRatio > 20 ? 'text-red-400' : 'text-emerald-400' },
              ].map((s, i) => (
                <div key={i} className="bg-gray-800 rounded-xl p-3">
                  <p className="text-[10px] text-gray-600 mb-1">{s.l}</p>
                  <p className={`text-xl font-black ${s.c}`}>{s.v}</p>
                </div>
              ))}
            </div>
          </AnalyticsCard>
        )}
      </div>
    </div>
  );
}