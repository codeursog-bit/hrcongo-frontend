'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Download, Loader2, CalendarDays, CalendarRange, Info,
} from 'lucide-react';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import RapportsSubNav from '@/components/RapportsSubNav';

// ─── Types (miroir de payroll-recap.service.ts côté backend) ───────────────

interface IndemniteColumn {
  key: string;
  label: string;
}

interface RecapRow {
  employeeId: string;
  employeeName: string;
  matricule: string | null;
  status: 'PAYE' | 'CONGE' | 'SANS_PAIE';
  leaveLabel?: string | null;
  salBrut: number;
  cnss: number;
  irpp: number;
  reste1: number;
  indemnites: Record<string, number>;
  sousTotal: number;
  avance: number;
  pharmacie: number;
  tol: number;
  taxeDept: number;
  autresTaxes: number;
  netAPayer: number;
  autresRetenuesNonDetaillees: number;
  moisEnConge?: number[];
  moisSansPaie?: number[];
}

interface MonthlyRecap {
  month: number;
  year: number;
  indemniteColumns: IndemniteColumn[];
  rows: RecapRow[];
  totals: RecapRow;
}

interface AnnualRecap {
  year: number;
  indemniteColumns: IndemniteColumn[];
  rows: RecapRow[];
  totals: RecapRow;
  monthlyTotals: { month: number; sousTotal: number; netAPayer: number }[];
}

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
const MONTHS_SHORT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

function fmt(val: number | undefined | null) {
  const n = Number(val ?? 0);
  if (!n) return '—';
  return n.toLocaleString('fr-FR');
}

// Couleurs de ligne selon le statut du mois — bleu pour congé (comme dans
// le modèle Excel d'origine), ambre pour une absence de bulletin
// inexpliquée (à vérifier), rien de spécial si le bulletin est normal.
function rowClasses(status: RecapRow['status']) {
  if (status === 'CONGE') return 'bg-sky-50 dark:bg-sky-500/10 hover:bg-sky-100 dark:hover:bg-sky-500/20';
  if (status === 'SANS_PAIE') return 'bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20';
  return 'hover:bg-gray-50 dark:hover:bg-gray-900/30';
}

export default function RecapPersonnelPage() {
  const router = useRouter();
  const { bp } = useBasePath();

  const now = new Date();
  const [mode, setMode] = useState<'mensuel' | 'annuel'>('mensuel');
  const [period, setPeriod] = useState({ month: now.getMonth() + 1, year: now.getFullYear() });

  const [monthly, setMonthly] = useState<MonthlyRecap | null>(null);
  const [annual, setAnnual] = useState<AnnualRecap | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (mode === 'mensuel') {
          const data = await api.get<MonthlyRecap>(
            `/reports/personnel-recap?month=${period.month}&year=${period.year}`,
          );
          if (!cancelled) setMonthly(data);
        } else {
          const data = await api.get<AnnualRecap>(
            `/reports/personnel-recap/annual?year=${period.year}`,
          );
          if (!cancelled) setAnnual(data);
        }
      } catch (e) {
        console.error(e);
        if (mode === 'mensuel') setMonthly(null);
        else setAnnual(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [mode, period]);

  const current = mode === 'mensuel' ? monthly : annual;
  const indemniteColumns = current?.indemniteColumns ?? [];
  const rows = current?.rows ?? [];
  const totals = current?.totals;

  const hasEcart = useMemo(
    () => rows.some((r) => Math.abs(r.autresRetenuesNonDetaillees) > 1),
    [rows],
  );

  const [exporting, setExporting] = useState(false);

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const url = mode === 'mensuel'
        ? `/reports/personnel-recap/export?month=${period.month}&year=${period.year}`
        : `/reports/personnel-recap/annual/export?year=${period.year}`;
      const blob = await api.getBlob(url);
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = mode === 'mensuel'
        ? `recap_personnel_${period.month}_${period.year}.xlsx`
        : `recap_personnel_annuel_${period.year}.xlsx`;
      a.click();
      URL.revokeObjectURL(href);
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-20 space-y-8">

      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(bp('/rapports'))}
            className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-500" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              Récapitulatif du Personnel
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Brut, charges, indemnités et retenues — mensuel &amp; annuel
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportExcel}
            disabled={!current || exporting}
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-white font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {exporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            Exporter Excel
          </button>
        </div>
      </div>

      <RapportsSubNav active="/rapports/recap-personnel" />

      {/* ── Sélecteur mode + période ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-900/50 rounded-xl p-1">
          <button
            onClick={() => setMode('mensuel')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              mode === 'mensuel' ? 'bg-sky-500 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <CalendarDays size={14} /> Mensuel
          </button>
          <button
            onClick={() => setMode('annuel')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              mode === 'annuel' ? 'bg-sky-500 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <CalendarRange size={14} /> Annuel
          </button>
        </div>

        <div className="flex items-center gap-2 sm:ml-auto">
          {mode === 'mensuel' && (
            <select
              value={period.month}
              onChange={(e) => setPeriod((p) => ({ ...p, month: Number(e.target.value) }))}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-medium text-gray-700 dark:text-white"
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          )}
          <select
            value={period.year}
            onChange={(e) => setPeriod((p) => ({ ...p, year: Number(e.target.value) }))}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-medium text-gray-700 dark:text-white"
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-sky-500" size={48} />
        </div>
      ) : !current || rows.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 border border-gray-100 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400">
          Aucun bulletin trouvé pour cette période.
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 pt-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {mode === 'mensuel'
                  ? `${MONTHS[period.month - 1]} ${period.year}`
                  : `Récapitulatif annuel ${period.year}`}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {rows.length} employé{rows.length > 1 ? 's' : ''}
              </p>
            </div>
            {hasEcart && (
              <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 rounded-lg">
                <Info size={14} />
                Certains employés ont d&apos;autres retenues (prêt, etc.) non détaillées ici
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 px-6 pt-3 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-sky-100 dark:bg-sky-500/20 border border-sky-300 dark:border-sky-500/40 inline-block" />
              En congé (normal, pas de bulletin)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/40 inline-block" />
              Sans bulletin ni congé (à vérifier)
            </span>
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-[11px] uppercase text-gray-500 font-semibold">
                <tr>
                  <th className="px-4 py-3 text-left sticky left-0 bg-gray-50 dark:bg-gray-900/50 z-10">Nom</th>
                  <th className="px-4 py-3 text-right">Sal. Brut</th>
                  <th className="px-4 py-3 text-right">CNSS 4%</th>
                  <th className="px-4 py-3 text-right">IRPP</th>
                  <th className="px-4 py-3 text-right">Reste 1</th>
                  {indemniteColumns.map((c) => (
                    <th key={c.key} className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400">{c.label}</th>
                  ))}
                  <th className="px-4 py-3 text-right font-bold">S/Total</th>
                  <th className="px-4 py-3 text-right text-red-500">Avance</th>
                  <th className="px-4 py-3 text-right text-red-500">Pharmacie</th>
                  <th className="px-4 py-3 text-right text-red-500">TOL</th>
                  <th className="px-4 py-3 text-right text-red-500">Taxe Dpt</th>
                  <th className="px-4 py-3 text-right text-red-500">Autres</th>
                  <th className="px-4 py-3 text-right font-bold text-sky-600">Net à payer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {rows.map((r) => {
                  const isAbsent = r.status !== 'PAYE';
                  return (
                    <tr key={r.employeeId} className={`transition-colors ${rowClasses(r.status)}`}>
                      <td className="px-4 py-3 sticky left-0 z-10" style={{ background: 'inherit' }}>
                        <div className="font-medium text-gray-900 dark:text-white">{r.employeeName}</div>
                        {r.status === 'CONGE' && (
                          <div className="text-[11px] text-sky-600 dark:text-sky-400 font-medium">
                            {r.leaveLabel ?? 'En congé'}
                          </div>
                        )}
                        {r.status === 'SANS_PAIE' && (
                          <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                            Aucun bulletin ni congé — à vérifier
                          </div>
                        )}
                        {mode === 'annuel' && !!r.moisEnConge?.length && (
                          <div className="text-[10px] text-sky-500 mt-0.5">
                            Congé : {r.moisEnConge.map((m) => MONTHS_SHORT[m - 1]).join(', ')}
                          </div>
                        )}
                        {mode === 'annuel' && !!r.moisSansPaie?.length && (
                          <div className="text-[10px] text-amber-500 mt-0.5">
                            Sans paie : {r.moisSansPaie.map((m) => MONTHS_SHORT[m - 1]).join(', ')}
                          </div>
                        )}
                      </td>
                      {isAbsent && mode === 'mensuel' ? (
                        <td colSpan={4 + indemniteColumns.length} className="px-4 py-3 text-center text-gray-400 italic text-xs">
                          Pas de bulletin ce mois-ci
                        </td>
                      ) : (
                        <>
                          <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{fmt(r.salBrut)}</td>
                          <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{fmt(r.cnss)}</td>
                          <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{fmt(r.irpp)}</td>
                          <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{fmt(r.reste1)}</td>
                          {indemniteColumns.map((c) => (
                            <td key={c.key} className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400">
                              {fmt(r.indemnites[c.key])}
                            </td>
                          ))}
                        </>
                      )}
                      <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">{fmt(r.sousTotal)}</td>
                      <td className="px-4 py-3 text-right text-red-500">{fmt(r.avance)}</td>
                      <td className="px-4 py-3 text-right text-red-500">{fmt(r.pharmacie)}</td>
                      <td className="px-4 py-3 text-right text-red-500">{fmt(r.tol)}</td>
                      <td className="px-4 py-3 text-right text-red-500">{fmt(r.taxeDept)}</td>
                      <td className="px-4 py-3 text-right text-red-500">{fmt(r.autresTaxes)}</td>
                      <td className="px-4 py-3 text-right font-bold text-sky-600">{fmt(r.netAPayer)}</td>
                    </tr>
                  );
                })}
              </tbody>
              {totals && (
                <tfoot className="bg-gray-50 dark:bg-gray-900/50 font-bold border-t-2 border-gray-200 dark:border-gray-700">
                  <tr>
                    <td className="px-4 py-3 sticky left-0 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white">TOTAL</td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{fmt(totals.salBrut)}</td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{fmt(totals.cnss)}</td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{fmt(totals.irpp)}</td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{fmt(totals.reste1)}</td>
                    {indemniteColumns.map((c) => (
                      <td key={c.key} className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400">
                        {fmt(totals.indemnites[c.key])}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{fmt(totals.sousTotal)}</td>
                    <td className="px-4 py-3 text-right text-red-500">{fmt(totals.avance)}</td>
                    <td className="px-4 py-3 text-right text-red-500">{fmt(totals.pharmacie)}</td>
                    <td className="px-4 py-3 text-right text-red-500">{fmt(totals.tol)}</td>
                    <td className="px-4 py-3 text-right text-red-500">{fmt(totals.taxeDept)}</td>
                    <td className="px-4 py-3 text-right text-red-500">{fmt(totals.autresTaxes)}</td>
                    <td className="px-4 py-3 text-right text-sky-600">{fmt(totals.netAPayer)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  );
}