'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileSpreadsheet, Calendar, Building2, Users, Banknote,
  Loader2, Printer, Download, RefreshCw, ChevronDown,
  AlertTriangle, CheckCircle2, FileArchive,
} from 'lucide-react';
import { api } from '@/services/api';

// ─── TYPES ─────────────────────────────────────────────────────────────────
interface DasEmployeeLine {
  employeeId: string;
  matricule: string;
  nom: string;
  prenom: string;
  profession: string;
  sexe: string;
  situationMatrimoniale: string;
  nbEnfants: number;
  salaireBrut: number;
  salairePlafonne: number;
  salaireBrutTaxable: number;
  baseImposable: number;
  irppRetenu: number;
}

interface DasRecap {
  company: { legalName: string; cnssAffiliationNumber?: string; taxNumber?: string } | null;
  year: number;
  deadlineLabel: string;
  employees: DasEmployeeLine[];
  totals: { effectif: number; salaireBrut: number; irppRetenu: number };
}

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR').format(Math.round(n || 0));

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

export default function DasDeclarationPage() {
  const currentYear = new Date().getFullYear();

  const [years, setYears] = useState<number[]>([]);
  const [year, setYear] = useState<number>(currentYear);
  const [rangeMode, setRangeMode] = useState(false);
  const [startYear, setStartYear] = useState<number>(currentYear - 5);
  const [endYear, setEndYear] = useState<number>(currentYear);

  const [recap, setRecap] = useState<DasRecap | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadYears = useCallback(async () => {
    try {
      const data = await api.get<number[]>('/das-declaration/years');
      setYears(data);
      if (data.length && !data.includes(year)) {
        setYear(data[0]);
      }
    } catch {
      // silencieux — le sélecteur retombe sur l'année courante
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRecap = useCallback(async (y: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<DasRecap>(`/das-declaration/recap?year=${y}`);
      setRecap(data);
    } catch (e: any) {
      setError(e?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadYears();
  }, [loadYears]);

  useEffect(() => {
    if (!rangeMode) loadRecap(year);
  }, [year, rangeMode, loadRecap]);

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    try {
      const blob = await api.getBlob(`/das-declaration/export?year=${year}`);
      downloadBlob(blob, `DAS_I_${year}.xlsx`);
    } catch (e: any) {
      setError(e?.message || "Échec de l'export");
    } finally {
      setExporting(false);
    }
  };

  const handleExportRange = async () => {
    setExporting(true);
    setError(null);
    try {
      const blob = await api.getBlob(
        `/das-declaration/export-range?startYear=${startYear}&endYear=${endYear}`,
      );
      downloadBlob(blob, `DAS_I_${startYear}-${endYear}.zip`);
    } catch (e: any) {
      setError(e?.message || "Échec de l'export");
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => window.print();

  const yearOptions = years.length
    ? years
    : Array.from({ length: 7 }, (_, i) => currentYear - i);

  // Plage d'années : toujours une liste large et indépendante des années
  // qui ont déjà des paies validées — le backend saute lui-même les
  // années sans donnée, donc restreindre ce sélecteur à `years` empêchait
  // de choisir une borne (ex: 2021) tant qu'aucune paie n'y était validée.
  const rangeYearOptions = Array.from({ length: 10 }, (_, i) => currentYear - i);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 print:bg-white print:p-0">
      {/* ── En-tête ─────────────────────────────────────────────────────── */}
      <div className="mb-6 print:hidden">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/30">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                Déclaration Annuelle des Salaires — DAS I
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                CNSS-Impôts · récapitulatif annuel par salarié
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setRangeMode(false)}
              className={`px-3 py-2 text-sm font-semibold rounded-xl transition-colors ${
                !rangeMode
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              Une année
            </button>
            <button
              onClick={() => setRangeMode(true)}
              className={`px-3 py-2 text-sm font-semibold rounded-xl transition-colors ${
                rangeMode
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              Plage d'années
            </button>
          </div>
        </div>

        {/* ── Sélecteurs ────────────────────────────────────────────────── */}
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          {!rangeMode ? (
            <div className="relative">
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="pl-3 pr-8 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" />
            </div>
          ) : (
            <>
              <div className="relative">
                <select
                  value={startYear}
                  onChange={(e) => setStartYear(Number(e.target.value))}
                  className="pl-3 pr-8 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  {rangeYearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" />
              </div>
              <span className="text-slate-400 text-sm">à</span>
              <div className="relative">
                <select
                  value={endYear}
                  onChange={(e) => setEndYear(Number(e.target.value))}
                  className="pl-3 pr-8 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  {rangeYearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" />
              </div>
            </>
          )}

          {!rangeMode && (
            <button
              onClick={() => loadRecap(year)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              title="Rafraîchir"
            >
              <RefreshCw className="w-4 h-4 text-slate-500" />
            </button>
          )}
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}
      </div>

      {/* ── Mode plage d'années : juste l'action d'export groupé ─────────── */}
      {rangeMode ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 p-6 shadow-sm print:hidden">
          <div className="flex items-center gap-3 mb-4">
            <FileArchive className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-slate-900 dark:text-white">
              Export groupé {startYear} → {endYear}
            </h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Génère un fichier .zip contenant un DAS I (.xlsx) par année de la
            plage sélectionnée — seules les années où des paies ont été
            validées sont incluses.
          </p>
          <button
            onClick={handleExportRange}
            disabled={exporting}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-500/30 transition-all"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Télécharger le zip
          </button>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
        </div>
      ) : recap ? (
        <>
          {/* ── Carte entreprise / période ──────────────────────────────── */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 p-5 mb-4 shadow-sm print:shadow-none print:border-black">
            <div className="flex items-center gap-3 mb-3">
              <Building2 className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {recap.company?.legalName || '—'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Matricule CNSS : {recap.company?.cnssAffiliationNumber || '—'} · NIU :{' '}
                  {recap.company?.taxNumber || '—'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
              <Calendar className="w-4 h-4" />
              Déclaration à renvoyer avant le {recap.deadlineLabel}
            </div>
          </div>

          {/* ── Indicateurs ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 print:hidden">
            <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Effectif déclaré</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {recap.totals.effectif}
                </p>
              </div>
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Masse salariale brute</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {fmt(recap.totals.salaireBrut)} F
                </p>
              </div>
              <Banknote className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">IRPP retenu (cumul)</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {fmt(recap.totals.irppRetenu)} F
                </p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-violet-500" />
            </div>
          </div>

          {/* ── Tableau salariés ────────────────────────────────────────── */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 overflow-hidden shadow-sm print:shadow-none print:border-black">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 text-left text-xs text-slate-500 dark:text-slate-400">
                    <th className="px-4 py-3 font-semibold">Matricule</th>
                    <th className="px-4 py-3 font-semibold">Nom &amp; prénom</th>
                    <th className="px-4 py-3 font-semibold">Profession</th>
                    <th className="px-4 py-3 font-semibold text-right">Salaire brut</th>
                    <th className="px-4 py-3 font-semibold text-right">Base imposable</th>
                    <th className="px-4 py-3 font-semibold text-right">IRPP retenu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recap.employees.map((e) => (
                    <tr key={e.employeeId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{e.matricule}</td>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                        {e.nom} {e.prenom}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{e.profession}</td>
                      <td className="px-4 py-3 text-right text-slate-900 dark:text-white">
                        {fmt(e.salaireBrut)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">
                        {fmt(e.baseImposable)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-white">
                        {fmt(e.irppRetenu)}
                      </td>
                    </tr>
                  ))}
                  {recap.employees.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                        Aucune paie validée pour {recap.year}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Actions ─────────────────────────────────────────────────── */}
          <div className="mt-5 flex items-center gap-3 print:hidden">
            <button
              onClick={handleExport}
              disabled={exporting || recap.employees.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-500/30 transition-all"
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Exporter le DAS I (.xlsx)
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
      ) : null}
    </div>
  );
}