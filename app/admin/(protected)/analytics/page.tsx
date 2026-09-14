// ============================================================================
// Fichier: app/admin/(protected)/analytics/page.tsx
// Page Analytics — uniquement des données réelles (voir notes ci-dessous)
// ============================================================================
//
// Ce qui a été retiré volontairement (aucune donnée réelle disponible) :
//  - Session moyenne / taux de rebond / pages par session → pas de tracking
//    de sessions front-end dans le code
//  - Latence API / taux d'erreur par route → pas d'APM
//  - Répartition par secteur d'activité → pas de champ "industry" en base
//  - CAC et ratio LTV/CAC → aucune donnée de dépense marketing
//
// Ce qui a été rendu réel (voir analytics.service.ts) :
//  - ARPU, répartition Direct/Parrainage, rétention à 12 mois
//  - Adoption des modules (Paie, Documents, Congés, Recrutement, Formation)
//  - Ratio DAU/MAU
//  - "Signaux à surveiller" (remplace l'ex "Prédiction Churn IA" fictive)

'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar, Download, ArrowUpRight, Users,
  CreditCard, Activity, AlertTriangle, AlertCircle, Loader2,
  MapPin, TrendingUp, TrendingDown, RefreshCw, BarChart2,
} from 'lucide-react';
import { AnalyticsCard } from '@/components/admin/analytics/AnalyticsCard';
import {
  AcquisitionChart, ChurnPieChart, DauChart, FeatureBarChart,
} from '@/components/admin/analytics/AnalyticsCharts';
import { CohortAnalysis } from '@/components/admin/analytics/CohortAnalysis';
import { adminService } from '@/lib/services/adminService';

const fmt     = (n: number) => n?.toLocaleString('fr-FR') ?? '0';
const fmtFcfa = (n: number) => `${fmt(Math.round(n ?? 0))} F`;
const pct     = (a: number, b: number) => b > 0 ? Math.round(((a - b) / b) * 100) : 0;

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

  const dau = analytics.dau?.[analytics.dau.length - 1]?.value ?? 0;
  const mau = analytics.mau ?? 0;
  const dauMauRatio = mau > 0 ? Math.round((dau / mau) * 100) : 0;

  const economics = analytics.unitEconomics ?? {};
  const featureAdoption: Array<{ name: string; value: number }> = analytics.featureAdoption ?? [];
  const weakestFeature = featureAdoption.length > 0
    ? [...featureAdoption].sort((a, b) => a.value - b.value)[0]
    : null;

  const risk = analytics.riskSignals ?? { count: 0, companies: [] };

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
            Analyse des performances et du comportement des entreprises
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
              <span className="text-white font-bold">{economics.acquisitionChannels?.direct ?? 0}%</span>
            </div>
            <div>
              <span className="text-gray-500 block">Parrainage</span>
              <span className="text-white font-bold">{economics.acquisitionChannels?.referral ?? 0}%</span>
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
              <div className="text-sm font-bold text-white">
                {economics.annualRetention === null ? 'N/A' : `${economics.annualRetention}%`}
              </div>
              <div className="text-xs text-gray-500">Rétention 12 mois</div>
            </div>
          </div>
          <ChurnPieChart data={analytics.churnData?.reasons ?? []} />
        </AnalyticsCard>

        <AnalyticsCard title="Économie Unitaire" subtitle="Revenu moyen par entreprise">
          <div className="flex flex-col items-center justify-center h-full py-4">
            <span className="text-xs text-gray-500 uppercase mb-2">ARPU (revenu moyen / entreprise active)</span>
            <span className="text-3xl font-bold text-amber-400">{fmtFcfa(economics.arpu ?? 0)}</span>
            <span className="text-xs text-gray-600 mt-2 text-center">
              Par mois. LTV/CAC non affichés : pas de donnée de coût d'acquisition en base.
            </span>
          </div>
        </AnalyticsCard>

        <AnalyticsCard title="Signaux à surveiller" subtitle="Basé sur connexions & paiements — pas d'IA">
          <div className="flex items-center gap-3 mb-4 bg-amber-900/10 border border-amber-900/30 p-3 rounded-lg">
            <AlertCircle className="w-8 h-8 text-amber-500" />
            <div>
              <div className="text-2xl font-bold text-white">{risk.count}</div>
              <div className="text-xs text-amber-400 font-bold">Entreprises à surveiller</div>
            </div>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {risk.companies.length === 0 ? (
              <p className="text-xs text-gray-600 text-center py-4">Aucun signal détecté</p>
            ) : risk.companies.map((c: any, i: number) => (
              <div key={i} className="text-xs">
                <div className="text-gray-200 font-medium truncate">{c.name}</div>
                <div className="text-gray-500">{c.reasons.join(' · ')}</div>
              </div>
            ))}
          </div>
        </AnalyticsCard>
      </div>

      {/* ROW 2 — DAU/MAU & Adoption */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AnalyticsCard title="Utilisateurs Actifs Quotidiens (DAU)" subtitle="Tendance 7 derniers jours" className="h-full">
            <div className="flex items-end gap-2 mb-4">
              <span className="text-3xl font-bold text-white">{dau}</span>
              <span className="text-sm text-emerald-400 mb-1">Aujourd'hui</span>
            </div>
            <DauChart data={analytics.dau ?? []} />
            <div className="grid grid-cols-3 gap-4 mt-6">
              {[
                { l: 'DAU (aujourd\'hui)', v: fmt(dau) },
                { l: 'MAU (30j)', v: fmt(mau) },
                { l: 'Ratio DAU/MAU', v: `${dauMauRatio}%` },
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
          <AnalyticsCard title="Adoption des Modules" subtitle="% d'entreprises actives utilisant chaque module" className="h-full">
            <FeatureBarChart data={featureAdoption} />
            {weakestFeature && (
              <div className="mt-4 p-3 bg-amber-900/10 border border-amber-900/30 rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-amber-200">Adoption la plus faible</div>
                  <div className="text-[10px] text-amber-400/80">
                    Seulement {weakestFeature.value}% utilisent {weakestFeature.name}.
                  </div>
                </div>
              </div>
            )}
          </AnalyticsCard>
        </div>
      </div>

      {/* ROW 3 — Cohorte */}
      <div className="grid grid-cols-1 gap-6">
        <AnalyticsCard title="Analyse de Cohorte" subtitle="Rétention par mois d'inscription (— = échéance pas encore atteinte)">
          <CohortAnalysis data={analytics.cohortData ?? []} />
        </AnalyticsCard>
      </div>

      {/* ROW 4 — Géo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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