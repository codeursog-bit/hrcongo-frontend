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
import { CalendarRange, Users, Wallet, PiggyBank, Building2, TrendingUp, TrendingDown } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import { KonzaLoader } from '@/components/ui/KonzaLoader';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { api } from '@/services/api';
import { Badge, Card, EmptyState, Select } from '@/components/design-system/primitives';

const C = {
  sky: 'var(--brand)',
  emerald: 'var(--green)',
  violet: 'var(--mustard)',
  rose: 'var(--text-secondary)',
};

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
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Icon size={19} strokeWidth={1.5} style={{ color }} aria-hidden="true" />
        {trend !== null && trend !== undefined && (
          <Badge tone={trend >= 0 ? 'success' : 'danger'}>
            <span className="flex items-center gap-1">
              {trend >= 0 ? <TrendingUp size={12} strokeWidth={1.5} /> : <TrendingDown size={12} strokeWidth={1.5} />}
              {Math.abs(trend).toFixed(1)}%
            </span>
          </Badge>
        )}
      </div>
      <div>
        <p className="text-2xl font-semibold text-[var(--text)] tracking-tight tabular-nums">{value}</p>
        <p className="text-xs font-semibold text-[var(--text-secondary)] mt-1">{label}</p>
        {sub && <p className="text-[11px] text-[var(--text-secondary)] mt-1">{sub}</p>}
      </div>
    </Card>
  );
}

export default function YearlyEvolutionPanel({ companyId }: { companyId?: string }) {
  const currentYear = new Date().getFullYear();
  const prefersReducedMotion = useReducedMotion();

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
    'Retenues salariales': Math.round(y.chargesSalariales / 1000),
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

  const periodFilters = (
    <div className="flex flex-wrap items-end gap-3">
      <Select label="De" value={yearFrom} onChange={(e) => setYearFrom(Number(e.target.value))}>
        {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
      </Select>
      <Select label="À" value={yearTo} onChange={(e) => setYearTo(Number(e.target.value))}>
        {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
      </Select>
      <Select label="Mois" value={monthFilter ?? ''} onChange={(e) => setMonthFilter(e.target.value ? Number(e.target.value) : null)}>
        <option value="">Année entière</option>
        {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
      </Select>
    </div>
  );

  return (
    <Card title="Évolution pluriannuelle" action={periodFilters}>
      <p className="text-xs text-[var(--text-secondary)] mb-5">Comparer plusieurs années — masse salariale, net et charges.</p>

      {loading ? (
        <KonzaLoader variant="section" />
      ) : !data || data.years.length === 0 ? (
        <EmptyState title="Aucune donnée de paie sur cette plage d'années" icon={CalendarRange}>Essayez une autre période pour afficher l’évolution de la masse salariale.</EmptyState>
      ) : (
        <>
          {/* KPI de la plage — cumul sur la période + évolution début → fin */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
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
            <div className="mt-5">
              <Badge tone={brutEvolution >= 0 ? 'success' : 'danger'}>
              Masse salariale brute {brutEvolution >= 0 ? 'en hausse' : 'en baisse'} de {Math.abs(brutEvolution).toFixed(1)}%
              {' '}entre {first!.year} et {last!.year}
              </Badge>
            </div>
          )}

          <div className="h-[300px] w-full min-w-0 mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 6" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} label={{ value: 'K FCFA', angle: -90, position: 'insideLeft', fontSize: 11, fill: 'var(--text-secondary)' }} />
                <Tooltip contentStyle={{ background: 'var(--surface)', border: 0, borderRadius: 'var(--radius-control)', color: 'var(--text)', boxShadow: 'var(--shadow-pop)', fontSize: 12 }} labelStyle={{ color: 'var(--text)', fontWeight: 600 }} formatter={(v: number) => `${v.toLocaleString('fr-FR')} K FCFA`} />
                <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-secondary)' }} />
                <Line type="monotone" dataKey="Brut" stroke={C.sky} strokeWidth={2.25} dot={false} activeDot={{ r: 4 }} isAnimationActive={prefersReducedMotion !== true} animationDuration={700} />
                <Line type="monotone" dataKey="Net" stroke={C.emerald} strokeWidth={2.25} dot={false} activeDot={{ r: 4 }} isAnimationActive={prefersReducedMotion !== true} animationDuration={700} />
                <Line type="monotone" dataKey="Charges patronales" stroke={C.violet} strokeWidth={2.25} dot={false} activeDot={{ r: 4 }} isAnimationActive={prefersReducedMotion !== true} animationDuration={700} />
                <Line type="monotone" dataKey="Retenues salariales" stroke={C.rose} strokeWidth={2} dot={false} activeDot={{ r: 4 }} isAnimationActive={prefersReducedMotion !== true} animationDuration={700} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Détail chiffré par année — pratique pour comparer précisément */}
          <div className="k-table-desktop overflow-x-auto mt-5">
            <table className="k-table">
              <caption className="k-sr-only">Détail des indicateurs de paie par année</caption>
              <thead>
                <tr>
                  <th scope="col">Année</th>
                  <th scope="col" className="text-right">Effectif</th>
                  <th scope="col" className="text-right">Brut</th>
                  <th scope="col" className="text-right">Net</th>
                  <th scope="col" className="text-right">Charges patronales</th>
                  <th scope="col" className="text-right">Retenues salariales</th>
                  <th scope="col" className="text-right">Coût total employeur</th>
                </tr>
              </thead>
              <tbody>
                {data.years.map((y) => (
                  <tr key={y.year}>
                    <td className="font-semibold">{y.year}</td>
                    <td className="text-right text-[var(--text-secondary)]">{y.effectif}</td>
                    <td className="text-right">{fcfa(y.brut)}</td>
                    <td className="text-right">{fcfa(y.net)}</td>
                    <td className="text-right text-[var(--mustard)]">{fcfa(y.chargesPatronales)}</td>
                    <td className="text-right text-[var(--text-secondary)]">{fcfa(y.chargesSalariales)}</td>
                    <td className="text-right font-semibold">{fcfa(y.coutTotalEmployeur)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="k-table-mobile mt-5" aria-label="Détail des indicateurs de paie par année">
            {data.years.map((y) => (
              <li key={y.year}>
                <dl>
                  <div><dt>Année</dt><dd className="font-semibold">{y.year}</dd></div>
                  <div><dt>Effectif</dt><dd>{y.effectif}</dd></div>
                  <div><dt>Brut</dt><dd>{fcfa(y.brut)}</dd></div>
                  <div><dt>Net</dt><dd>{fcfa(y.net)}</dd></div>
                  <div><dt>Charges patronales</dt><dd className="text-[var(--mustard)]">{fcfa(y.chargesPatronales)}</dd></div>
                  <div><dt>Retenues salariales</dt><dd>{fcfa(y.chargesSalariales)}</dd></div>
                  <div><dt>Coût total employeur</dt><dd className="font-semibold">{fcfa(y.coutTotalEmployeur)}</dd></div>
                </dl>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}
