'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Download, Loader2, CalendarDays, CalendarRange, Info,
  ChevronDown, Users, Wallet, Landmark, TrendingDown, ShieldCheck, X,
  Printer, AlertTriangle,
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
  return 'hover:bg-slate-50 dark:hover:bg-slate-800/40';
}

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [pendingExport, setPendingExport] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      if (mode === 'mensuel') {
        const data = await api.get<MonthlyRecap>(
          `/reports/personnel-recap?month=${period.month}&year=${period.year}`,
        );
        setMonthly(data);
      } else {
        const data = await api.get<AnnualRecap>(
          `/reports/personnel-recap/annual?year=${period.year}`,
        );
        setAnnual(data);
      }
    } catch (e: any) {
      setLoadError(e?.message || 'Erreur de chargement');
      if (mode === 'mensuel') setMonthly(null);
      else setAnnual(null);
    } finally {
      setIsLoading(false);
    }
  }, [mode, period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const current = mode === 'mensuel' ? monthly : annual;
  const indemniteColumns = current?.indemniteColumns ?? [];
  const rows = current?.rows ?? [];
  const totals = current?.totals;

  const hasEcart = useMemo(
    () => rows.some((r) => Math.abs(r.autresRetenuesNonDetaillees) > 1),
    [rows],
  );

  // ── KPI de la page ────────────────────────────────────────────────────
  const effectifPaye = rows.filter((r) => r.status === 'PAYE').length;
  const totalCharges = (totals?.cnss ?? 0) + (totals?.irpp ?? 0) + (totals?.tol ?? 0) + (totals?.taxeDept ?? 0);

  const runExport = async () => {
    setExporting(true);
    setLoadError(null);
    try {
      const url = mode === 'mensuel'
        ? `/reports/personnel-recap/export?month=${period.month}&year=${period.year}`
        : `/reports/personnel-recap/annual/export?year=${period.year}`;
      const blob = await api.getBlob(url);
      downloadBlob(
        blob,
        mode === 'mensuel'
          ? `recap_personnel_${period.month}_${period.year}.xlsx`
          : `recap_personnel_annuel_${period.year}.xlsx`,
      );
      setPendingExport(false);
    } catch (e: any) {
      setLoadError(e?.message || "Échec de l'export");
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 print:bg-white print:p-0">
      {/* ── En-tête ─────────────────────────────────────────────────────── */}
      <div className="mb-6 print:hidden">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(bp('/rapports'))}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500" />
            </button>
            <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/30">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                Récapitulatif du Personnel
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Brut, charges, indemnités et retenues — mensuel &amp; annuel
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode('mensuel')}
              className={`px-3 py-2 text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5 ${
                mode === 'mensuel'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              <CalendarDays className="w-4 h-4" /> Mensuel
            </button>
            <button
              onClick={() => setMode('annuel')}
              className={`px-3 py-2 text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5 ${
                mode === 'annuel'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              <CalendarRange className="w-4 h-4" /> Annuel
            </button>
          </div>
        </div>

        {/* ── Sélecteurs période ────────────────────────────────────────── */}
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          {mode === 'mensuel' && (
            <div className="relative">
              <select
                value={period.month}
                onChange={(e) => setPeriod((p) => ({ ...p, month: Number(e.target.value) }))}
                className="pl-3 pr-8 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" />
            </div>
          )}
          <div className="relative">
            <select
              value={period.year}
              onChange={(e) => setPeriod((p) => ({ ...p, year: Number(e.target.value) }))}
              className="pl-3 pr-8 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <RapportsSubNav active="/rapports/recap-personnel" />

        {loadError && (
          <div className="mt-4 flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">{loadError}</p>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
        </div>
      ) : !current || rows.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 border border-slate-200 dark:border-slate-700/60 text-center text-slate-500 dark:text-slate-400">
          Aucun bulletin trouvé pour cette période.
        </div>
      ) : (
        <>
          {/* ── Indicateurs ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4 print:hidden">
            <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Salariés payés</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {effectifPaye} / {rows.length}
                </p>
              </div>
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Masse salariale brute</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{fmt(totals?.salBrut)} F</p>
              </div>
              <Wallet className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Charges &amp; retenues (CNSS+IRPP+TOL+Dépt)</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{fmt(totalCharges)} F</p>
              </div>
              <Landmark className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Net à payer</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{fmt(totals?.netAPayer)} F</p>
              </div>
              <TrendingDown className="w-5 h-5 text-violet-500" />
            </div>
          </div>

          {/* ── Bandeau titre + légende ───────────────────────────────── */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden print:shadow-none print:border-black">
            <div className="flex items-center justify-between px-6 pt-5 flex-wrap gap-3">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  {mode === 'mensuel'
                    ? `${MONTHS[period.month - 1]} ${period.year}`
                    : `Récapitulatif annuel ${period.year}`}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {rows.length} employé{rows.length > 1 ? 's' : ''}
                </p>
              </div>
              {hasEcart && (
                <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 rounded-lg">
                  <Info className="w-3.5 h-3.5" />
                  Certains employés ont d&apos;autres retenues (prêt, etc.) non détaillées ici
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 px-6 pt-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-sky-100 dark:bg-sky-500/20 border border-sky-300 dark:border-sky-500/40 inline-block" />
                En congé (normal, pas de bulletin)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/40 inline-block" />
                Sans bulletin ni congé (à vérifier)
              </span>
            </div>

            {/* ── Tableau ─────────────────────────────────────────────── */}
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold sticky left-0 bg-slate-50 dark:bg-slate-800/60 z-10">Nom</th>
                    <th className="px-4 py-3 text-right font-semibold">Sal. Brut</th>
                    <th className="px-4 py-3 text-right font-semibold">CNSS 4%</th>
                    <th className="px-4 py-3 text-right font-semibold">IRPP</th>
                    <th className="px-4 py-3 text-right font-semibold">Reste 1</th>
                    {indemniteColumns.map((c) => (
                      <th key={c.key} className="px-4 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">{c.label}</th>
                    ))}
                    <th className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-white">S/Total</th>
                    <th className="px-4 py-3 text-right font-semibold text-red-500">Avance</th>
                    <th className="px-4 py-3 text-right font-semibold text-red-500">Pharmacie</th>
                    <th className="px-4 py-3 text-right font-semibold text-red-500">TOL</th>
                    <th className="px-4 py-3 text-right font-semibold text-red-500">Taxe Dpt</th>
                    <th className="px-4 py-3 text-right font-semibold text-red-500">Autres</th>
                    <th className="px-4 py-3 text-right font-semibold text-blue-600 dark:text-blue-400">Net à payer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {rows.map((r) => {
                    const isAbsent = r.status !== 'PAYE';
                    return (
                      <tr key={r.employeeId} className={`transition-colors ${rowClasses(r.status)}`}>
                        <td className="px-4 py-3 sticky left-0 z-10" style={{ background: 'inherit' }}>
                          <div className="font-medium text-slate-900 dark:text-white">{r.employeeName}</div>
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
                          <td colSpan={4 + indemniteColumns.length} className="px-4 py-3 text-center text-slate-400 italic text-xs">
                            Pas de bulletin ce mois-ci
                          </td>
                        ) : (
                          <>
                            <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">{fmt(r.salBrut)}</td>
                            <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">{fmt(r.cnss)}</td>
                            <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">{fmt(r.irpp)}</td>
                            <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">{fmt(r.reste1)}</td>
                            {indemniteColumns.map((c) => (
                              <td key={c.key} className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400">
                                {fmt(r.indemnites[c.key])}
                              </td>
                            ))}
                          </>
                        )}
                        <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-white">{fmt(r.sousTotal)}</td>
                        <td className="px-4 py-3 text-right text-red-500">{fmt(r.avance)}</td>
                        <td className="px-4 py-3 text-right text-red-500">{fmt(r.pharmacie)}</td>
                        <td className="px-4 py-3 text-right text-red-500">{fmt(r.tol)}</td>
                        <td className="px-4 py-3 text-right text-red-500">{fmt(r.taxeDept)}</td>
                        <td className="px-4 py-3 text-right text-red-500">{fmt(r.autresTaxes)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-blue-600 dark:text-blue-400">{fmt(r.netAPayer)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                {totals && (
                  <tfoot className="bg-slate-50 dark:bg-slate-800/60 font-semibold border-t-2 border-slate-200 dark:border-slate-700">
                    <tr>
                      <td className="px-4 py-3 sticky left-0 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white">TOTAL</td>
                      <td className="px-4 py-3 text-right text-slate-900 dark:text-white">{fmt(totals.salBrut)}</td>
                      <td className="px-4 py-3 text-right text-slate-900 dark:text-white">{fmt(totals.cnss)}</td>
                      <td className="px-4 py-3 text-right text-slate-900 dark:text-white">{fmt(totals.irpp)}</td>
                      <td className="px-4 py-3 text-right text-slate-900 dark:text-white">{fmt(totals.reste1)}</td>
                      {indemniteColumns.map((c) => (
                        <td key={c.key} className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400">
                          {fmt(totals.indemnites[c.key])}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right text-slate-900 dark:text-white">{fmt(totals.sousTotal)}</td>
                      <td className="px-4 py-3 text-right text-red-500">{fmt(totals.avance)}</td>
                      <td className="px-4 py-3 text-right text-red-500">{fmt(totals.pharmacie)}</td>
                      <td className="px-4 py-3 text-right text-red-500">{fmt(totals.tol)}</td>
                      <td className="px-4 py-3 text-right text-red-500">{fmt(totals.taxeDept)}</td>
                      <td className="px-4 py-3 text-right text-red-500">{fmt(totals.autresTaxes)}</td>
                      <td className="px-4 py-3 text-right text-blue-600 dark:text-blue-400">{fmt(totals.netAPayer)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
            <div className="h-5" />
          </div>

          {/* ── Actions ─────────────────────────────────────────────────── */}
          <div className="mt-5 flex items-center gap-3 print:hidden">
            <button
              onClick={() => setPendingExport(true)}
              disabled={exporting || !current}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-500/30 transition-all"
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Exporter Excel
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl transition-all"
            >
              <Printer className="w-4 h-4" />
              Imprimer
            </button>
          </div>
        </>
      )}

      {/* ── Modale de revue avant export ────────────────────────────────── */}
      {pendingExport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:hidden">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700/60 overflow-hidden">
            <div className="p-5 flex items-start gap-3 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-xl shrink-0">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Une dernière vérification avant diffusion
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {mode === 'mensuel' ? `${MONTHS[period.month - 1]} ${period.year}` : `Année ${period.year}`}
                </p>
              </div>
              <button
                onClick={() => setPendingExport(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Le fichier reprend les bulletins validés de la période — brut,
                charges, indemnités, net à payer. Toutes les cellules restent
                modifiables à la main une fois ouvertes dans Excel.
              </p>
              {hasEcart && (
                <p className="text-sm text-amber-700 dark:text-amber-400 leading-relaxed">
                  Certains employés ont d'autres retenues (prêt, etc.) non
                  détaillées dans ce tableau — pensez à les vérifier avant de
                  diffuser le fichier.
                </p>
              )}
            </div>

            <div className="p-5 pt-0 flex items-center gap-3">
              <button
                onClick={() => setPendingExport(false)}
                className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Revoir avant
              </button>
              <button
                onClick={runExport}
                disabled={exporting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-500/30 transition-all"
              >
                {exporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                C'est vérifié, télécharger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}