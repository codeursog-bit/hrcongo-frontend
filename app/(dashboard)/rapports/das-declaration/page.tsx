'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileSpreadsheet, Calendar, Building2, Users, Banknote,
  Loader2, Printer, Download, RefreshCw, ChevronDown,
  AlertTriangle, CheckCircle2, FileArchive, ShieldCheck, X,
} from 'lucide-react';
import { api } from '@/services/api';

import { useBasePath } from '@/hooks/useBasePath';
import RapportsSubNav from '@/components/RapportsSubNav';

// ─── TYPES ─────────────────────────────────────────────────────────────────
interface DasEmployeeLine {
  employeeId: string;
  matricule: string;
  niu: string | null;
  cnssNumber: string | null;
  nom: string;
  prenom: string;
  profession: string;
  adresse: string;
  sexe: string;
  situationMatrimoniale: string;
  nbEnfants: number;
  nationaliteCode: string;
  dateEmbauche: string;
  dateParti: string | null;
  dureeEmploi: string;
  salaireBrut: number;
  salairePlafonne: number;
  salaireBrutTaxable: number;
  salaireDeConge: number;
  salaireDePresence: number;
  baseImposable: number;
  irppRetenu: number;
  tolAnnuel: number;
  taxeDeptAnnuel: number;
  indemniteTransport: number;
  indemnitePanier: number;
  // ✅ Vient de la configuration des primes (BonusTemplate.isNature) —
  // 0 si rien n'est configuré comme tel chez cette entreprise.
  avantageNature: number;
}

interface DasRecap {
  company: { legalName: string; cnssAffiliationNumber?: string; taxNumber?: string } | null;
  year: number;
  deadlineLabel: string;
  employees: DasEmployeeLine[];
  totals: { effectif: number; salaireBrut: number; irppRetenu: number; avantageNature: number };
}

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR').format(Math.round(n || 0));

// Le backend renvoie les dates au format ISO brut (sérialisation JSON par
// défaut d'un objet Date Prisma) — on les affiche en jj/mm/aaaa.
const fmtDate = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

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

  // ── Modale de revue avant export ─────────────────────────────────────────
  // Le fichier généré reste une proposition : l'app a fait le calcul à
  // partir des bulletins de paie, mais la décision finale (compléter,
  // corriger, valider) revient à la personne qui dépose la déclaration.
  const [pendingExport, setPendingExport] = useState<'single' | 'range' | null>(null);

  const runExport = async () => {
    setExporting(true);
    setError(null);
    try {
      const blob = await api.getBlob(`/das-declaration/export?year=${year}`);
      downloadBlob(blob, `DAS_I_${year}.xlsx`);
      setPendingExport(null);
    } catch (e: any) {
      setError(e?.message || "Échec de l'export");
    } finally {
      setExporting(false);
    }
  };

  const runExportRange = async () => {
    setExporting(true);
    setError(null);
    try {
      const blob = await api.getBlob(
        `/das-declaration/export-range?startYear=${startYear}&endYear=${endYear}`,
      );
      downloadBlob(blob, `DAS_I_${startYear}-${endYear}.zip`);
      setPendingExport(null);
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

  return (
    <div className="min-h-screen bg-[var(--bg)] p-4 md:p-6 print:bg-white print:p-0">
      {/* ── En-tête ─────────────────────────────────────────────────────── */}

      <RapportsSubNav active="/rapports/das-declaration" />

      <div className="mb-6 mt-6 print:hidden">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[var(--brand)] rounded-xl shadow-lg shadow-[var(--brand)]/30">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[var(--text)]">
                Déclaration Annuelle des Salaires — DAS I
              </h1>
              <p className="text-sm text-[var(--text-muted)]">
                CNSS-Impôts · récapitulatif annuel par salarié
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setRangeMode(false)}
              className={`px-3 py-2 text-sm font-semibold rounded-xl transition-colors ${
                !rangeMode
                  ? 'bg-[var(--brand)] text-white shadow-md shadow-[var(--brand)]/30'
                  : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text)]'
              }`}
            >
              Une année
            </button>
            <button
              onClick={() => setRangeMode(true)}
              className={`px-3 py-2 text-sm font-semibold rounded-xl transition-colors ${
                rangeMode
                  ? 'bg-[var(--brand)] text-white shadow-md shadow-[var(--brand)]/30'
                  : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text)]'
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
                className="pl-3 pr-8 py-2 text-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/50"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2.5 top-2.5 text-[var(--text-muted)] pointer-events-none" />
            </div>
          ) : (
            <>
              <div className="relative">
                <select
                  value={startYear}
                  onChange={(e) => setStartYear(Number(e.target.value))}
                  className="pl-3 pr-8 py-2 text-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/50"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-2.5 top-2.5 text-[var(--text-muted)] pointer-events-none" />
              </div>
              <span className="text-[var(--text-muted)] text-sm">à</span>
              <div className="relative">
                <select
                  value={endYear}
                  onChange={(e) => setEndYear(Number(e.target.value))}
                  className="pl-3 pr-8 py-2 text-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/50"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-2.5 top-2.5 text-[var(--text-muted)] pointer-events-none" />
              </div>
            </>
          )}

          {!rangeMode && (
            <button
              onClick={() => loadRecap(year)}
              className="p-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)] transition-colors"
              title="Rafraîchir"
            >
              <RefreshCw className="w-4 h-4 text-[var(--text-muted)]" />
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
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)]/60 p-6 shadow-sm print:hidden">
          <div className="flex items-center gap-3 mb-4">
            <FileArchive className="w-5 h-5 text-[var(--brand)]" />
            <h2 className="font-semibold text-[var(--text)]">
              Export groupé {startYear} → {endYear}
            </h2>
          </div>
          <p className="text-sm text-[var(--text-muted)] mb-4">
            Génère un fichier .zip contenant un DAS I (.xlsx) par année de la
            plage sélectionnée — seules les années où des paies ont été
            validées sont incluses.
          </p>
          <button
            onClick={() => setPendingExport('range')}
            disabled={exporting}
            className="flex items-center gap-2 px-5 py-2.5 bg-[var(--brand)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-md shadow-[var(--brand)]/30 transition-all"
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
          <Loader2 className="w-6 h-6 text-[var(--brand)] animate-spin" />
        </div>
      ) : recap ? (
        <>
          {/* ── Carte entreprise / période ──────────────────────────────── */}
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)]/60 p-5 mb-4 shadow-sm print:shadow-none print:border-black">
            <div className="flex items-center gap-3 mb-3">
              <Building2 className="w-5 h-5 text-[var(--brand)]" />
              <div>
                <p className="font-semibold text-[var(--text)]">
                  {recap.company?.legalName || '—'}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4 print:hidden">
            <div className="flex items-center justify-between p-4 bg-[var(--surface)] rounded-2xl border border-[var(--border)]/60 shadow-sm">
              <div>
                <p className="text-xs text-[var(--text-muted)]">Effectif déclaré</p>
                <p className="text-lg font-bold text-[var(--text)]">
                  {recap.totals.effectif}
                </p>
              </div>
              <Users className="w-5 h-5 text-[var(--brand)]" />
            </div>
            <div className="flex items-center justify-between p-4 bg-[var(--surface)] rounded-2xl border border-[var(--border)]/60 shadow-sm">
              <div>
                <p className="text-xs text-[var(--text-muted)]">Masse salariale brute</p>
                <p className="text-lg font-bold text-[var(--text)]">
                  {fmt(recap.totals.salaireBrut)} F
                </p>
              </div>
              <Banknote className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="flex items-center justify-between p-4 bg-[var(--surface)] rounded-2xl border border-[var(--border)]/60 shadow-sm">
              <div>
                <p className="text-xs text-[var(--text-muted)]">IRPP retenu (cumul)</p>
                <p className="text-lg font-bold text-[var(--text)]">
                  {fmt(recap.totals.irppRetenu)} F
                </p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-[var(--accent-2)]" />
            </div>
            <div className="flex items-center justify-between p-4 bg-[var(--surface)] rounded-2xl border border-[var(--border)]/60 shadow-sm">
              <div>
                <p className="text-xs text-[var(--text-muted)]">Avantages en nature</p>
                <p className={`text-lg font-bold ${recap.totals.avantageNature > 0 ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}`}>
                  {fmt(recap.totals.avantageNature)} F
                </p>
                {recap.totals.avantageNature === 0 && (
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Aucune prime configurée « en nature »</p>
                )}
              </div>
              <Building2 className="w-5 h-5 text-amber-500" />
            </div>
          </div>

          {/* ── Tableau salariés ────────────────────────────────────────── */}
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)]/60 overflow-hidden shadow-sm print:shadow-none print:border-black">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--surface-2)]/60 text-left text-xs text-[var(--text-muted)]">
                    <th className="px-4 py-3 font-semibold">Matricule</th>
                    <th className="px-4 py-3 font-semibold">NIU</th>
                    <th className="px-4 py-3 font-semibold">N° CNSS</th>
                    <th className="px-4 py-3 font-semibold">Nom &amp; prénom</th>
                    <th className="px-4 py-3 font-semibold">Profession</th>
                    <th className="px-4 py-3 font-semibold">Adresse</th>
                    <th className="px-4 py-3 font-semibold text-center">Sexe</th>
                    <th className="px-4 py-3 font-semibold text-center">Sit. matri.</th>
                    <th className="px-4 py-3 font-semibold text-center">Nb enf.</th>
                    <th className="px-4 py-3 font-semibold text-center">Nationalité</th>
                    <th className="px-4 py-3 font-semibold">Embauche</th>
                    <th className="px-4 py-3 font-semibold">Départ</th>
                    <th className="px-4 py-3 font-semibold">Contrat</th>
                    <th className="px-4 py-3 font-semibold text-right">Salaire brut</th>
                    <th className="px-4 py-3 font-semibold text-right">Sal. plafonné</th>
                    <th className="px-4 py-3 font-semibold text-right">Congé</th>
                    <th className="px-4 py-3 font-semibold text-right">Présence</th>
                    <th className="px-4 py-3 font-semibold text-right">Brut taxable</th>
                    <th className="px-4 py-3 font-semibold text-right">Base imposable</th>
                    <th className="px-4 py-3 font-semibold text-right">IRPP retenu</th>
                    <th className="px-4 py-3 font-semibold text-right">Avantage nature</th>
                    <th className="px-4 py-3 font-semibold text-right">Transport</th>
                    <th className="px-4 py-3 font-semibold text-right">Panier</th>
                    <th className="px-4 py-3 font-semibold text-right">TOL</th>
                    <th className="px-4 py-3 font-semibold text-right">Taxe Dépt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {recap.employees.map((e) => (
                    <tr key={e.employeeId} className="hover:bg-[var(--surface-2)]/40">
                      <td className="px-4 py-3 text-[var(--text-muted)]">{e.matricule}</td>
                      <td className="px-4 py-3 text-[var(--text-muted)]">{e.niu || '—'}</td>
                      <td className="px-4 py-3 text-[var(--text-muted)]">{e.cnssNumber || '—'}</td>
                      <td className="px-4 py-3 font-medium text-[var(--text)] whitespace-nowrap">
                        {e.nom} {e.prenom}
                      </td>
                      <td className="px-4 py-3 text-[var(--text)]">{e.profession}</td>
                      <td className="px-4 py-3 text-[var(--text)]">{e.adresse || '—'}</td>
                      <td className="px-4 py-3 text-center text-[var(--text)]">{e.sexe || '—'}</td>
                      <td className="px-4 py-3 text-center text-[var(--text)]">
                        {e.situationMatrimoniale || '—'}
                      </td>
                      <td className="px-4 py-3 text-center text-[var(--text)]">{e.nbEnfants}</td>
                      <td className="px-4 py-3 text-center text-[var(--text)]">
                        {e.nationaliteCode || '—'}
                      </td>
                      <td className="px-4 py-3 text-[var(--text)] whitespace-nowrap">
                        {fmtDate(e.dateEmbauche)}
                      </td>
                      <td className="px-4 py-3 text-[var(--text)] whitespace-nowrap">
                        {fmtDate(e.dateParti)}
                      </td>
                      <td className="px-4 py-3 text-[var(--text)]">{e.dureeEmploi || '—'}</td>
                      <td className="px-4 py-3 text-right text-[var(--text)]">
                        {fmt(e.salaireBrut)}
                      </td>
                      <td className="px-4 py-3 text-right text-[var(--text)]">
                        {fmt(e.salairePlafonne)}
                      </td>
                      <td className="px-4 py-3 text-right text-[var(--text)]">
                        {e.salaireDeConge > 0 ? fmt(e.salaireDeConge) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-[var(--text)]">
                        {fmt(e.salaireDePresence)}
                      </td>
                      <td className="px-4 py-3 text-right text-[var(--text)]">
                        {fmt(e.salaireBrutTaxable)}
                      </td>
                      <td className="px-4 py-3 text-right text-[var(--text)]">
                        {fmt(e.baseImposable)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-[var(--text)]">
                        {fmt(e.irppRetenu)}
                      </td>
                      <td className="px-4 py-3 text-right text-[var(--text)]">
                        {e.avantageNature > 0 ? fmt(e.avantageNature) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-[var(--text)]">
                        {e.indemniteTransport > 0 ? fmt(e.indemniteTransport) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-[var(--text)]">
                        {e.indemnitePanier > 0 ? fmt(e.indemnitePanier) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-[var(--text)]">
                        {e.tolAnnuel > 0 ? fmt(e.tolAnnuel) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-[var(--text)]">
                        {e.taxeDeptAnnuel > 0 ? fmt(e.taxeDeptAnnuel) : '—'}
                      </td>
                    </tr>
                  ))}
                  {recap.employees.length === 0 && (
                    <tr>
                      <td colSpan={25} className="px-4 py-10 text-center text-[var(--text-muted)]">
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
              onClick={() => setPendingExport('single')}
              disabled={exporting || recap.employees.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-[var(--brand)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-md shadow-[var(--brand)]/30 transition-all"
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
              className="flex items-center gap-2 px-5 py-2.5 bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] text-sm font-semibold rounded-xl transition-all"
            >
              <Printer className="w-4 h-4" />
              Imprimer
            </button>
          </div>
        </>
      ) : null}

      {/* ── Modale de revue avant export ────────────────────────────────── */}
      {pendingExport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print:hidden">
          <div className="w-full max-w-md bg-[var(--surface)] rounded-2xl shadow-2xl border border-[var(--border)]/60 overflow-hidden">
            <div className="p-5 flex items-start gap-3 border-b border-[var(--border)]">
              <div className="p-2 bg-[var(--brand-soft)] rounded-xl shrink-0">
                <ShieldCheck className="w-5 h-5 text-[var(--brand)]" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[var(--text)]">
                  Une dernière vérification avant le dépôt
                </h3>
              </div>
              <button
                onClick={() => setPendingExport(null)}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-sm text-[var(--text)] leading-relaxed">
                Le fichier a été rempli automatiquement à partir des bulletins
                de paie de la période — l'essentiel du travail est fait.
              </p>
              <p className="text-sm text-[var(--text)] leading-relaxed">
                Avant de le transmettre à la CNSS, un dernier regard reste
                utile : compléter une information manquante, ajuster un
                détail propre à un salarié. Vous seul(e) avez le dernier mot
                sur ce qui part.
              </p>
            </div>

            <div className="p-5 pt-0 flex items-center gap-3">
              <button
                onClick={() => setPendingExport(null)}
                className="flex-1 px-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] text-sm font-semibold rounded-xl hover:bg-[var(--surface-2)] transition-colors"
              >
                Revoir avant
              </button>
              <button
                onClick={pendingExport === 'range' ? runExportRange : runExport}
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