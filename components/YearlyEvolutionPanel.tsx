'use client';

// ============================================================================
// 📁 lib/components/YearlyEvolutionPanel.tsx
// ✅ Composant réutilisable à déposer sur les pages de rapports pour
// répondre au besoin : "comment évolue l'entreprise sur plusieurs années —
// il y a 2 ans, 5 ans, de 2020 à 2022, etc." Contrairement au filtre
// mois/année existant (qui montre UNE période), ce panneau montre une
// PLAGE d'années (ex: 2020 → 2028) avec un point par an : masse salariale
// brute, net, charges patronales, charges salariales.
//
// Utilisation :
//   <YearlyEvolutionPanel companyId={companyId} />
// (companyId optionnel — utile pour les rôles cabinet qui changent de PME)
// ============================================================================

import React, { useEffect, useState } from 'react';
import { CalendarRange, Loader2, Users, Wallet, PiggyBank, Building2, TrendingUp, TrendingDown } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { api } from '@/services/api';

const C = { sky: '#0EA5E9', emerald: '#10B981', violet: '#8B5CF6', rose: '#EF4444' };

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

interface YearlyPoint {
  year: number;
  effectif: number;
  brut: number;
  net: number;
  chargesSalariales: number;
  chargesPatronales: number;
  coutTotalEmployeur: number;
}

interface YearlyTrendResponse {
  yearFrom: number;
  yearTo: number;
  month: number | null;
  years: YearlyPoint[];
}

function fcfa(v: number) {
  return v >= 1_000_000 ? `${(v / 1_000_000).toFixed(2)} M FCFA` : `${Math.round(v).toLocaleString('fr-FR')} FCFA`;
}

function pct(from: number, to: number): number | null {
  if (!from) return null;
  return ((to - from) / from) * 100;
}

function KpiCard({ icon: Icon, label, value, sub, color, trend }: {
  icon: any; label: string; value: string; sub?: string; color: string; trend?: number | null;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: color + '20' }}>
          <Icon size={20} style={{ color }} />
        </div>
        {trend !== null && trend !== undefined && (
          <span className={`text-xs font-bold flex items-center gap-1 ${trend >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{value}</p>
        <p className="text-xs font-bold text-gray-500 mt-0.5">{label}</p>
        {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function YearlyEvolutionPanel({ companyId }: { companyId?: string }) {
  const currentYear = new Date().getFullYear();

  const [yearFrom, setYearFrom] = useState(currentYear);
  const [yearTo, setYearTo] = useState(currentYear);
  // Par défaut : mois et année en cours (comme avant) — l'utilisateur élargit
  // la plage lui-même s'il veut comparer plusieurs années.
  const [monthFilter, setMonthFilter] = useState<number | null>(new Date().getMonth() + 1);

  const [data, setData] = useState<YearlyTrendResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          yearFrom: String(yearFrom),
          yearTo: String(yearTo),
        });
        if (monthFilter) params.set('month', String(monthFilter));
        if (companyId) params.set('companyId', companyId);
        const res = await api.get<YearlyTrendResponse>(`/reports/yearly-trend?${params.toString()}`);
        if (!cancelled) setData(res);
      } catch (e) {
        console.error(e);
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [yearFrom, yearTo, monthFilter, companyId]);

  const chartData = (data?.years ?? []).map((y) => ({
    year: String(y.year),
    'Brut': Math.round(y.brut / 1000),
    'Net': Math.round(y.net / 1000),
    'Charges patronales': Math.round(y.chargesPatronales / 1000),
    'Charges salariales': Math.round(y.chargesSalariales / 1000),
  }));

  // Évolution entre la première et la dernière année de la plage — répond
  // à "est-ce que j'ai évolué ou pas entre 2025 et 2027".
  const first = data?.years?.[0];
  const last = data?.years?.[data.years.length - 1];
  const isSingleYear = data ? data.years.length <= 1 : true;

  const brutEvolution = first && last ? pct(first.brut, last.brut) : null;
  const netEvolution = first && last ? pct(first.net, last.net) : null;
  const coutEvolution = first && last ? pct(first.coutTotalEmployeur, last.coutTotalEmployeur) : null;
  const effectifEvolution = first && last ? pct(first.effectif, last.effectif) : null;

  // Cumul sur toute la plage — répond à "sur 2025-2027, j'ai fait combien au total".
  const cumulBrut = (data?.years ?? []).reduce((s, y) => s + y.brut, 0);
  const cumulNet = (data?.years ?? []).reduce((s, y) => s + y.net, 0);
  const cumulCoutTotal = (data?.years ?? []).reduce((s, y) => s + y.coutTotalEmployeur, 0);

  const yearOptions: number[] = [];
  for (let y = currentYear - 20; y <= currentYear + 5; y++) yearOptions.push(y);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-900/20 flex items-center justify-center">
            <CalendarRange size={18} className="text-sky-600" />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-900 dark:text-white">Évolution pluriannuelle</h3>
            <p className="text-[11px] text-gray-400">Comparer plusieurs années — masse salariale, net, charges</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">De</span>
          <select
            value={yearFrom}
            onChange={(e) => setYearFrom(Number(e.target.value))}
            className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-bold text-gray-700 dark:text-white"
          >
            {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">à</span>
          <select
            value={yearTo}
            onChange={(e) => setYearTo(Number(e.target.value))}
            className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-bold text-gray-700 dark:text-white"
          >
            {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>

          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide ml-2">Mois</span>
          <select
            value={monthFilter ?? ''}
            onChange={(e) => setMonthFilter(e.target.value ? Number(e.target.value) : null)}
            className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-bold text-gray-700 dark:text-white"
          >
            <option value="">Année entière</option>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-sky-500" size={32} />
        </div>
      ) : !data || data.years.length === 0 ? (
        <div className="py-12 text-center text-gray-400 text-sm">
          Aucune donnée de paie sur cette plage d&apos;années.
        </div>
      ) : (
        <>
          {/* KPI de la plage — cumul sur la période + évolution début → fin */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              icon={Users}
              label="Effectif"
              value={isSingleYear ? String(last?.effectif ?? 0) : `${first?.effectif ?? 0} → ${last?.effectif ?? 0}`}
              sub={isSingleYear ? `Année ${last?.year}` : `${first?.year} → ${last?.year}`}
              color={C.sky}
              trend={isSingleYear ? null : effectifEvolution}
            />
            <KpiCard
              icon={Wallet}
              label={isSingleYear ? 'Masse salariale brute' : 'Brut cumulé sur la période'}
              value={fcfa(cumulBrut)}
              sub={isSingleYear ? `Année ${last?.year}` : `Total ${first?.year}–${last?.year}`}
              color={C.emerald}
              trend={isSingleYear ? null : brutEvolution}
            />
            <KpiCard
              icon={PiggyBank}
              label={isSingleYear ? 'Salaire net' : 'Net cumulé sur la période'}
              value={fcfa(cumulNet)}
              sub={isSingleYear ? `Année ${last?.year}` : `Total ${first?.year}–${last?.year}`}
              color={C.violet}
              trend={isSingleYear ? null : netEvolution}
            />
            <KpiCard
              icon={Building2}
              label={isSingleYear ? 'Coût total employeur' : 'Coût employeur cumulé'}
              value={fcfa(cumulCoutTotal)}
              sub={isSingleYear ? `Année ${last?.year}` : `Total ${first?.year}–${last?.year}`}
              color={C.rose}
              trend={isSingleYear ? null : coutEvolution}
            />
          </div>

          {!isSingleYear && brutEvolution !== null && (
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold ${
              brutEvolution >= 0
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
            }`}>
              Masse salariale brute {brutEvolution >= 0 ? 'en hausse' : 'en baisse'} de {Math.abs(brutEvolution).toFixed(1)}%
              {' '}entre {first!.year} et {last!.year}
            </div>
          )}

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} label={{ value: 'K FCFA', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <Tooltip formatter={(v: number) => `${v.toLocaleString('fr-FR')} K FCFA`} />
                <Legend />
                <Line type="linear" dataKey="Brut" stroke={C.sky} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="linear" dataKey="Net" stroke={C.emerald} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="linear" dataKey="Charges patronales" stroke={C.violet} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="linear" dataKey="Charges salariales" stroke={C.rose} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Détail chiffré par année — pratique pour comparer précisément */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase text-gray-400 border-b border-gray-100 dark:border-gray-700">
                  <th className="py-2 pr-4">Année</th>
                  <th className="py-2 pr-4 text-right">Effectif</th>
                  <th className="py-2 pr-4 text-right">Brut</th>
                  <th className="py-2 pr-4 text-right">Net</th>
                  <th className="py-2 pr-4 text-right">Charges patronales</th>
                  <th className="py-2 pr-4 text-right">Charges salariales</th>
                  <th className="py-2 text-right">Coût total employeur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {data.years.map((y) => (
                  <tr key={y.year}>
                    <td className="py-2 pr-4 font-bold text-gray-900 dark:text-white">{y.year}</td>
                    <td className="py-2 pr-4 text-right text-gray-500">{y.effectif}</td>
                    <td className="py-2 pr-4 text-right text-gray-700 dark:text-gray-300">{fcfa(y.brut)}</td>
                    <td className="py-2 pr-4 text-right text-gray-700 dark:text-gray-300">{fcfa(y.net)}</td>
                    <td className="py-2 pr-4 text-right text-violet-600">{fcfa(y.chargesPatronales)}</td>
                    <td className="py-2 pr-4 text-right text-rose-500">{fcfa(y.chargesSalariales)}</td>
                    <td className="py-2 text-right font-bold text-gray-900 dark:text-white">{fcfa(y.coutTotalEmployeur)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}