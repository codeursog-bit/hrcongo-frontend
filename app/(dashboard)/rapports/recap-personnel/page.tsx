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
  // ✅ Précise si "irpp" est un vrai ITS ou une retenue BNC (10%/20%,
  // prestataires) — jamais additionner sans regarder ce label, voir le
  // badge affiché à côté du montant.
  fiscalCategory: 'ITS' | 'BNC_10' | 'BNC_20' | 'EXONERE' | 'AGENCE' | 'MIXTE';
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

// ✅ Badge affiché à côté de tout montant "irpp" — pour ne jamais laisser
// croire qu'un ITS et une retenue BNC (10%/20%) sont la même chose. Voir
// classifyFiscalCategory côté backend (payroll-recap.service.ts).
const FISCAL_BADGE: Record<RecapRow['fiscalCategory'], { label: string; className: string }> = {
  ITS: { label: 'ITS', className: 'bg-[var(--brand-soft)] text-[var(--brand)]' },
  BNC_10: { label: 'BNC 10%', className: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  BNC_20: { label: 'BNC 20%', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200' },
  EXONERE: { label: 'Exonéré', className: 'bg-[var(--surface-2)] text-[var(--text-muted)]' },
  AGENCE: { label: 'Agence', className: 'bg-[var(--surface-2)] text-[var(--text-muted)]' },
  MIXTE: { label: 'Mixte', className: 'bg-[var(--surface-2)] text-[var(--text-muted)]' },
};

function FiscalBadge({ category }: { category: RecapRow['fiscalCategory'] }) {
  const b = FISCAL_BADGE[category] ?? FISCAL_BADGE.MIXTE;
  return (
    <span className={`ml-1.5 inline-block px-1.5 py-0.5 rounded text-[10px] font-medium align-middle ${b.className}`}>
      {b.label}
    </span>
  );
}

// Couleurs de ligne selon le statut du mois — émeraude doux pour congé,
// ambre pour une absence de bulletin inexpliquée (à vérifier), rien de
// spécial si le bulletin est normal.
function rowClasses(status: RecapRow['status']) {
  if (status === 'CONGE') return 'bg-[var(--brand-soft)] hover:opacity-90';
  if (status === 'SANS_PAIE') return 'bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20';
  return 'hover:bg-[var(--surface-2)]';
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
    <div className="min-h-screen bg-[var(--bg)] p-4 md:p-6 print:bg-white print:p-0">
      {/* ── En-tête ─────────────────────────────────────────────────────── */}
      <div className="mb-6 print:hidden">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(bp('/rapports'))}
              className="p-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-[var(--text-muted)]" />
            </button>
            <div className="p-2.5 bg-[var(--brand)] rounded-xl shadow-lg shadow-[var(--brand)]/30">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[var(--text)]">
                Récapitulatif du Personnel
              </h1>
              <p className="text-sm text-[var(--text-muted)]">
                Brut, charges, indemnités et retenues — mensuel &amp; annuel
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode('mensuel')}
              className={`px-3 py-2 text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5 ${
                mode === 'mensuel'
                  ? 'bg-[var(--brand)] text-white shadow-md shadow-[var(--brand)]/30'
                  : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text)]'
              }`}
            >
              <CalendarDays className="w-4 h-4" /> Mensuel
            </button>
            <button
              onClick={() => setMode('annuel')}
              className={`px-3 py-2 text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5 ${
                mode === 'annuel'
                  ? 'bg-[var(--brand)] text-white shadow-md shadow-[var(--brand)]/30'
                  : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text)]'
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
                className="pl-3 pr-8 py-2 text-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/50"
              >
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2.5 top-2.5 text-[var(--text-muted)] pointer-events-none" />
            </div>
          )}
          <div className="relative">
            <select
              value={period.year}
              onChange={(e) => setPeriod((p) => ({ ...p, year: Number(e.target.value) }))}
              className="pl-3 pr-8 py-2 text-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/50"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2.5 top-2.5 text-[var(--text-muted)] pointer-events-none" />
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
          <Loader2 className="w-6 h-6 text-[var(--brand)] animate-spin" />
        </div>
      ) : !current || rows.length === 0 ? (
        <div className="bg-[var(--surface)] rounded-2xl p-12 border border-[var(--border)] text-center text-[var(--text-muted)]">
          Aucun bulletin trouvé pour cette période.
        </div>
      ) : (
        <>
          {/* ── Indicateurs ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4 print:hidden">
            <div className="flex items-center justify-between p-4 bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm">
              <div>
                <p className="text-xs text-[var(--text-muted)]">Salariés payés</p>
                <p className="text-lg font-bold text-[var(--text)]">
                  {effectifPaye} / {rows.length}
                </p>
              </div>
              <Users className="w-5 h-5 text-[var(--brand)]" />
            </div>
            <div className="flex items-center justify-between p-4 bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm">
              <div>
                <p className="text-xs text-[var(--text-muted)]">Masse salariale brute</p>
                <p className="text-lg font-bold text-[var(--text)]">{fmt(totals?.salBrut)} F</p>
              </div>
              <Wallet className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="flex items-center justify-between p-4 bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm">
              <div>
                <p className="text-xs text-[var(--text-muted)]">Charges &amp; retenues (CNSS+IRPP+TOL+Dépt)</p>
                <p className="text-lg font-bold text-[var(--text)]">{fmt(totalCharges)} F</p>
              </div>
              <Landmark className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex items-center justify-between p-4 bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm">
              <div>
                <p className="text-xs text-[var(--text-muted)]">Net à payer</p>
                <p className="text-lg font-bold text-[var(--text)]">{fmt(totals?.netAPayer)} F</p>
              </div>
              <TrendingDown className="w-5 h-5 text-[var(--accent-2)]" />
            </div>
          </div>

          {/* ── Bandeau titre + légende ───────────────────────────────── */}
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden print:shadow-none print:border-black">
            <div className="flex items-center justify-between px-6 pt-5 flex-wrap gap-3">
              <div>
                <h3 className="font-semibold text-[var(--text)]">
                  {mode === 'mensuel'
                    ? `${MONTHS[period.month - 1]} ${period.year}`
                    : `Récapitulatif annuel ${period.year}`}
                </h3>
                <p className="text-sm text-[var(--text-muted)]">
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

            <div className="flex items-center gap-4 px-6 pt-3 text-xs text-[var(--text-muted)]">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-[var(--brand-soft)] border border-[var(--brand)]/40 inline-block" />
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
                <thead className="bg-[var(--surface-2)]/60 text-xs text-[var(--text-muted)]">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold sticky left-0 bg-[var(--surface-2)]/60 z-10">Nom</th>
                    <th className="px-4 py-3 text-right font-semibold">Sal. Brut</th>
                    <th className="px-4 py-3 text-right font-semibold">CNSS 4%</th>
                    <th className="px-4 py-3 text-right font-semibold">IRPP</th>
                    <th className="px-4 py-3 text-right font-semibold">Reste 1</th>
                    {indemniteColumns.map((c) => (
                      <th key={c.key} className="px-4 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">{c.label}</th>
                    ))}
                    <th className="px-4 py-3 text-right font-semibold text-[var(--text)]">S/Total</th>
                    <th className="px-4 py-3 text-right font-semibold text-red-500">Avance</th>
                    <th className="px-4 py-3 text-right font-semibold text-red-500">Pharmacie</th>
                    <th className="px-4 py-3 text-right font-semibold text-red-500">TOL</th>
                    <th className="px-4 py-3 text-right font-semibold text-red-500">Taxe Dpt</th>
                    <th className="px-4 py-3 text-right font-semibold text-red-500">Autres</th>
                    <th className="px-4 py-3 text-right font-semibold text-[var(--brand)] dark:text-[var(--brand)]">Net à payer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {rows.map((r) => {
                    const isAbsent = r.status !== 'PAYE';
                    return (
                      <tr key={r.employeeId} className={`transition-colors ${rowClasses(r.status)}`}>
                        <td className="px-4 py-3 sticky left-0 z-10" style={{ background: 'inherit' }}>
                          <div className="font-medium text-[var(--text)]">{r.employeeName}</div>
                          {r.status === 'CONGE' && (
                            <div className="text-[11px] text-[var(--brand)] font-medium">
                              {r.leaveLabel ?? 'En congé'}
                            </div>
                          )}
                          {r.status === 'SANS_PAIE' && (
                            <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                              Aucun bulletin ni congé — à vérifier
                            </div>
                          )}
                          {mode === 'annuel' && !!r.moisEnConge?.length && (
                            <div className="text-[10px] text-[var(--brand)] mt-0.5">
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
                          <td colSpan={4 + indemniteColumns.length} className="px-4 py-3 text-center text-[var(--text-muted)] italic text-xs">
                            Pas de bulletin ce mois-ci
                          </td>
                        ) : (
                          <>
                            <td className="px-4 py-3 text-right text-[var(--text)]">{fmt(r.salBrut)}</td>
                            <td className="px-4 py-3 text-right text-[var(--text)]">{fmt(r.cnss)}</td>
                            <td className="px-4 py-3 text-right text-[var(--text)] whitespace-nowrap">
                              {fmt(r.irpp)}
                              <FiscalBadge category={r.fiscalCategory} />
                            </td>
                            <td className="px-4 py-3 text-right text-[var(--text)]">{fmt(r.reste1)}</td>
                            {indemniteColumns.map((c) => (
                              <td key={c.key} className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400">
                                {fmt(r.indemnites[c.key])}
                              </td>
                            ))}
                          </>
                        )}
                        <td className="px-4 py-3 text-right font-semibold text-[var(--text)]">{fmt(r.sousTotal)}</td>
                        <td className="px-4 py-3 text-right text-red-500">{fmt(r.avance)}</td>
                        <td className="px-4 py-3 text-right text-red-500">{fmt(r.pharmacie)}</td>
                        <td className="px-4 py-3 text-right text-red-500">{fmt(r.tol)}</td>
                        <td className="px-4 py-3 text-right text-red-500">{fmt(r.taxeDept)}</td>
                        <td className="px-4 py-3 text-right text-red-500">{fmt(r.autresTaxes)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-[var(--brand)] dark:text-[var(--brand)]">{fmt(r.netAPayer)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                {totals && (
                  <tfoot className="bg-[var(--surface-2)]/60 font-semibold border-t-2 border-[var(--border)]">
                    <tr>
                      <td className="px-4 py-3 sticky left-0 bg-[var(--surface-2)]/60 text-[var(--text)]">TOTAL</td>
                      <td className="px-4 py-3 text-right text-[var(--text)]">{fmt(totals.salBrut)}</td>
                      <td className="px-4 py-3 text-right text-[var(--text)]">{fmt(totals.cnss)}</td>
                      <td className="px-4 py-3 text-right text-[var(--text)] whitespace-nowrap">
                        {fmt(totals.irpp)}
                        <FiscalBadge category="MIXTE" />
                      </td>
                      <td className="px-4 py-3 text-right text-[var(--text)]">{fmt(totals.reste1)}</td>
                      {indemniteColumns.map((c) => (
                        <td key={c.key} className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400">
                          {fmt(totals.indemnites[c.key])}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right text-[var(--text)]">{fmt(totals.sousTotal)}</td>
                      <td className="px-4 py-3 text-right text-red-500">{fmt(totals.avance)}</td>
                      <td className="px-4 py-3 text-right text-red-500">{fmt(totals.pharmacie)}</td>
                      <td className="px-4 py-3 text-right text-red-500">{fmt(totals.tol)}</td>
                      <td className="px-4 py-3 text-right text-red-500">{fmt(totals.taxeDept)}</td>
                      <td className="px-4 py-3 text-right text-red-500">{fmt(totals.autresTaxes)}</td>
                      <td className="px-4 py-3 text-right text-[var(--brand)] dark:text-[var(--brand)]">{fmt(totals.netAPayer)}</td>
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
              className="flex items-center gap-2 px-5 py-2.5 bg-[var(--brand)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-md shadow-[var(--brand)]/30 transition-all"
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
              className="flex items-center gap-2 px-5 py-2.5 bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] text-sm font-semibold rounded-xl transition-all"
            >
              <Printer className="w-4 h-4" />
              Imprimer
            </button>
          </div>
        </>
      )}

      {/* ── Modale de revue avant export ────────────────────────────────── */}
      {pendingExport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print:hidden">
          <div className="w-full max-w-md bg-[var(--surface)] rounded-2xl shadow-2xl border border-[var(--border)] overflow-hidden">
            <div className="p-5 flex items-start gap-3 border-b border-[var(--border)]">
              <div className="p-2 bg-[var(--brand-soft)] rounded-xl shrink-0">
                <ShieldCheck className="w-5 h-5 text-[var(--brand)]" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[var(--text)]">
                  Une dernière vérification avant diffusion
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  {mode === 'mensuel' ? `${MONTHS[period.month - 1]} ${period.year}` : `Année ${period.year}`}
                </p>
              </div>
              <button
                onClick={() => setPendingExport(false)}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-sm text-[var(--text)] leading-relaxed">
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
                className="flex-1 px-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] text-sm font-semibold rounded-xl hover:bg-[var(--surface-2)] transition-colors"
              >
                Revoir avant
              </button>
              <button
                onClick={runExport}
                disabled={exporting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--brand)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-md shadow-[var(--brand)]/30 transition-all"
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