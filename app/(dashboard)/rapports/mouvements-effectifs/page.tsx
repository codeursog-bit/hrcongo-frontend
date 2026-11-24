'use client';
import { chartTheme } from '@/lib/chart-theme';


import React, { useState, useEffect, useCallback } from 'react';
import {
  Loader2, RefreshCw, Download, Users, ArrowLeft,
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import RapportsSubNav from '@/components/RapportsSubNav';
import PeriodSelector, { PeriodValue } from '@/components/PeriodSelector';
import { KonzaLoader } from '@/components/ui/KonzaLoader';
import { ReportsFrame as ModulePageFrame } from '@/components/reports/ReportsFrame';

interface DeptMovement {
  name: string;
  initial: number;
  hires: number;
  departures: number;
  final: number;
}
interface WorkforceMovement {
  mode: 'MOIS' | 'ANNEE';
  month: number;
  year: number;
  periodLabel: string;
  departments: DeptMovement[];
  totals: { initial: number; hires: number; departures: number; final: number };
  deletions?:number;
  unconfirmedDepartures?:number;
}

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0));
// ✅ Variations émeraude/ambre uniquement — jamais d'arc-en-ciel (voir la
// charte de refonte du design appliquée au reste du dossier rapports/).
const PIE_COLORS = chartTheme.series;

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

function MouvementsEffectifsPage() {
  const router = useRouter();
  const { bp } = useBasePath();
  const currentYear = new Date().getFullYear();
  const [period, setPeriod] = useState<PeriodValue>({
    mode: 'MOIS',
    month: new Date().getMonth() + 1,
    year: currentYear,
  });
  const [data, setData] = useState<WorkforceMovement | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ mode: period.mode === 'ANNEE' ? 'ANNEE' : 'MOIS', year: String(period.year) });
      if (period.mode !== 'ANNEE') params.set('month', String(period.month));
      const res = await api.get<WorkforceMovement>(`/reports/workforce-movement?${params.toString()}`);
      setData(res);
    } catch (e: any) {
      setError(e?.message ?? 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [period.mode, period.month, period.year]);

  useEffect(() => { load(); }, [load]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({ mode: period.mode === 'ANNEE' ? 'ANNEE' : 'MOIS', year: String(period.year) });
      if (period.mode !== 'ANNEE') params.set('month', String(period.month));
      const blob = await api.getBlob(`/reports/workforce-movement/export?${params.toString()}`);
      downloadBlob(
        blob,
        `effectif_${period.mode === 'ANNEE' ? period.year : `${String(period.month).padStart(2, '0')}_${period.year}`}.xlsx`,
      );
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

  const departures = data?.departments.filter((d) => d.departures > 0) ?? [];
  const hires = data?.departments.filter((d) => d.hires > 0) ?? [];

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.push(bp('/rapports'))} className="p-2 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
          <ArrowLeft strokeWidth={1.5} size={20} className="text-[var(--text-muted)]" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-[var(--text)]">État des mouvements d'effectif</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Effectif initial, entrées, sorties et effectif actuel — par département, mois ou année.
          </p>
        </div>
      </div>

      <RapportsSubNav active="/rapports/mouvements-effectifs" />

      <div className="flex items-center justify-between mt-6 mb-4 flex-wrap gap-3">
        <PeriodSelector value={period} onChange={setPeriod} modes={['MOIS', 'ANNEE']} />
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--surface-2)]"
          >
            <RefreshCw strokeWidth={1.5} className="w-4 h-4" /> Actualiser
          </button>
          <button
            onClick={handleExport}
            disabled={exporting || !data}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-[var(--brand)] text-[var(--text)] rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {exporting ? <Loader2 strokeWidth={1.5} className="w-4 h-4 animate-spin" /> : <Download strokeWidth={1.5} className="w-4 h-4" />}
            Exporter Excel
          </button>
        </div>
      </div>

      {loading ? (
        <KonzaLoader variant="section" />
      ) : error ? (
        <div className="text-[var(--danger-text)] text-sm py-8">{error}</div>
      ) : !data || data.departments.length === 0 ? (
        <div className="text-[var(--text-muted)] text-sm py-12 text-center border border-[var(--border)] rounded-xl">
          Aucune donnée d'effectif pour {data?.periodLabel ?? 'cette période'}.
        </div>
      ) : (
        <>
          {/* Bandeau KPI */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
            <div className="p-4 bg-[var(--surface)] rounded-2xl border border-[var(--border)] reports-card">
              <p className="text-xs text-[var(--text-muted)] font-semibold ">Effectif initial</p>
              <p className="text-2xl font-semibold text-[var(--text)] mt-1">{fmt(data.totals.initial)}</p>
            </div>
            <div className="p-4 bg-[var(--surface)] rounded-2xl border border-[var(--border)] reports-card">
              <p className="text-xs text-[var(--text-muted)] font-semibold ">Entrées</p>
              <p className="text-2xl font-semibold text-[var(--brand)] mt-1">+{fmt(data.totals.hires)}</p>
            </div>
            <div className="p-4 bg-[var(--surface)] rounded-2xl border border-[var(--border)] reports-card">
              <p className="text-xs text-[var(--text-muted)] font-semibold ">Sorties</p>
              <p className="text-2xl font-semibold text-[var(--accent-2)] mt-1">-{fmt(data.totals.departures)}</p>
            </div>
            <div className="p-4 bg-[var(--surface)] rounded-2xl">
              <p className="text-xs text-[var(--text)] font-semibold ">Effectif actuel</p>
              <p className="text-2xl font-semibold text-[var(--text)] mt-1">{fmt(data.totals.final)}</p>
            </div>
          </div>

          {/* Tableau — même structure que le modèle : départements en colonnes */}
          <p className="text-xs text-[var(--text-muted)] mb-5">{data.deletions??0} fiche(s) supprimée(s) sur la période, comptées séparément et exclues des sorties et du turnover.{!!data.unconfirmedDepartures&&` ${data.unconfirmedDepartures} ancienne(s) fin(s) d’emploi restent à confirmer et ne sont pas comptées comme départs.`}</p>
          <div className="overflow-x-auto border border-[var(--border)] rounded-xl mb-6">
            <div className="reports-table-region" role="region" aria-label="Données du rapport" tabIndex={0}><table data-report-table className="min-w-full text-sm reports-table">
              <thead className="bg-[var(--surface-2)] border-b border-[var(--border)]">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-[var(--text)] sticky left-0 bg-[var(--surface-2)]">Département →</th>
                  {data.departments.map((d) => (
                    <th key={d.name} className="text-right px-4 py-3 font-semibold text-[var(--text)] whitespace-nowrap">{d.name}</th>
                  ))}
                  <th className="text-right px-4 py-3 font-semibold text-[var(--text)] bg-[var(--brand-soft)]">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                <tr>
                  <td className="px-4 py-2.5 text-[var(--text-muted)] sticky left-0 bg-[var(--surface)]">Effectif initial</td>
                  {data.departments.map((d) => (
                    <td key={d.name} className="text-right px-4 py-2.5 text-[var(--text)]">{fmt(d.initial)}</td>
                  ))}
                  <td className="text-right px-4 py-2.5 font-semibold text-[var(--text)] bg-[var(--surface-2)]">{fmt(data.totals.initial)}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-[var(--text-muted)] sticky left-0 bg-[var(--surface)]">Entrées</td>
                  {data.departments.map((d) => (
                    <td key={d.name} className="text-right px-4 py-2.5 text-[var(--brand)]">{d.hires > 0 ? `+${fmt(d.hires)}` : '—'}</td>
                  ))}
                  <td className="text-right px-4 py-2.5 font-semibold text-[var(--brand)] bg-[var(--surface-2)]">+{fmt(data.totals.hires)}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-[var(--text-muted)] sticky left-0 bg-[var(--surface)]">Sorties</td>
                  {data.departments.map((d) => (
                    <td key={d.name} className="text-right px-4 py-2.5 text-[var(--accent-2)]">{d.departures > 0 ? `-${fmt(d.departures)}` : '—'}</td>
                  ))}
                  <td className="text-right px-4 py-2.5 font-semibold text-[var(--accent-2)] bg-[var(--surface-2)]">-{fmt(data.totals.departures)}</td>
                </tr>
                <tr className="bg-[var(--brand)]">
                  <td className="px-4 py-2.5 font-semibold text-[var(--text)] sticky left-0 bg-[var(--brand)]">Effectif actuel</td>
                  {data.departments.map((d) => (
                    <td key={d.name} className="text-right px-4 py-2.5 font-semibold text-[var(--text)]">{fmt(d.final)}</td>
                  ))}
                  <td className="text-right px-4 py-2.5 font-semibold text-[var(--text)]">{fmt(data.totals.final)}</td>
                </tr>
              </tbody>
            </table></div>
          </div>

          {/* Graphiques */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 reports-charts">
            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 reports-card">
              <h3 className="text-sm font-semibold text-[var(--text)] mb-4">Sorties par département</h3>
              {departures.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)] py-10 text-center">Aucune sortie sur la période.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={departures}>

                    <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={chartTheme.tooltip} />
                    <Bar isAnimationActive={false} maxBarSize={32} background={{fill:chartTheme.track,radius:8}} dataKey="departures" name="Sorties" fill="var(--mustard)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 reports-card">
              <h3 className="text-sm font-semibold text-[var(--text)] mb-4">Entrées par département</h3>
              {hires.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)] py-10 text-center">Aucune entrée sur la période.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie isAnimationActive={false} innerRadius={54} stroke="none" cornerRadius={6} data={hires} dataKey="hires" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e: any) => `${e.name}: ${e.hires}`}>
                      {hires.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={chartTheme.tooltip} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 reports-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[var(--text)]">Effectif actuel par département</h3>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--brand-soft)] rounded-full">
                <Users strokeWidth={1.5} size={14} className="text-[var(--brand)]" />
                <span className="text-sm font-semibold text-[var(--brand)]">Total : {fmt(data.totals.final)}</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data.departments}>
                <defs>
                  <linearGradient id="finalGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--green)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--green)" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={chartTheme.tooltip} />
                <Area isAnimationActive={false} activeDot={{r:5,stroke:chartTheme.surface,strokeWidth:3}} type="monotone" dataKey="final" name="Effectif actuel" stroke="var(--green)" strokeWidth={2} fill="url(#finalGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}


export default function MouvementsEffectifsPageWithFrame() {
  return (
    <ModulePageFrame kind="list">
      <MouvementsEffectifsPage />
    </ModulePageFrame>
  );
}
