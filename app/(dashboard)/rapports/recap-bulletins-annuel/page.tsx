'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Download, Loader2, FileSpreadsheet, ChevronDown,
  Users, Wallet, Landmark, ShieldCheck, X, Search, Printer, RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import RapportsSubNav from '@/components/RapportsSubNav';

// ─── Types (miroir de das1-declaration.service.ts côté backend — l'API et
// les noms de route restent "das1" côté backend, seul l'affichage change) ─

interface BulletinAnnuelIndemniteLine {
  label: string;
  amount: number;
}

interface BulletinAnnuelItem {
  ordre: number;
  employeeId: string;
  employeeName: string;
  niu: string | null;
  position: string;
  address: string;
  city: string;
  phone: string | null;
  maritalStatusLabel: string;
  numberOfChildren: number;
  periodFrom: string;
  periodTo: string;
  montantEspeces: number;
  avantageNatureLogement: number;
  avantageNatureAutres: number;
  montantImposable80: number;
  irppRetenu: number;
  taxeDepartementale: number;
  tolRetenu: number;
  indemnitesNonImposables: BulletinAnnuelIndemniteLine[];
  totalIndemnitesNonImposables: number;
  moisPresence: number;
  moisConge: number;
  moisSansPaie: number;
}

interface BulletinAnnuelDeclaration {
  year: number;
  companyName: string;
  companyActivity: string | null;
  companyAddress: string;
  companyCity: string;
  companyPhone: string;
  bulletins: BulletinAnnuelItem[];
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR];

const fmt = (n: number | undefined | null) => {
  const v = Number(n ?? 0);
  return v ? new Intl.NumberFormat('fr-FR').format(Math.round(v)) : '—';
};

function normalizeSearch(s: string) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

export default function BulletinAnnuelPage() {
  const router = useRouter();
  const { bp } = useBasePath();

  const [year, setYear] = useState(CURRENT_YEAR - 1); // se déclare pour l'année N-1
  const [declaration, setDeclaration] = useState<BulletinAnnuelDeclaration | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [pendingExport, setPendingExport] = useState(false);

  const loadDeclaration = useCallback(async (y: number) => {
    setLoading(true);
    setError(null);
    try {
      // ⚠️ Route API inchangée côté backend (/reports/das1) — seul
      // l'affichage front devient "Bulletin Annuel".
      const data = await api.get<BulletinAnnuelDeclaration>(`/reports/das1?year=${y}`);
      setDeclaration(data);
    } catch (e: any) {
      setError(e?.message || 'Erreur de chargement');
      setDeclaration(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDeclaration(year);
  }, [year, loadDeclaration]);

  const runExport = async () => {
    setExporting(true);
    setError(null);
    try {
      const blob = await api.getBlob(`/reports/das1/export?year=${year}`);
      downloadBlob(blob, `Bulletin_Annuel_${year}.xlsx`);
      setPendingExport(false);
    } catch (e: any) {
      setError(e?.message || "Échec de l'export");
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => window.print();

  const bulletins = declaration?.bulletins ?? [];

  // Recherche par nom — insensible à la casse et aux accents.
  const filteredBulletins = search.trim()
    ? bulletins.filter((b) => normalizeSearch(b.employeeName).includes(normalizeSearch(search)))
    : bulletins;

  // KPI de la page — toujours basés sur l'exercice entier, pas sur la recherche.
  const totalMontantEspeces = bulletins.reduce((s, b) => s + b.montantEspeces, 0);
  const totalIrpp = bulletins.reduce((s, b) => s + b.irppRetenu, 0);
  const totalIndemnites = bulletins.reduce((s, b) => s + b.totalIndemnitesNonImposables, 0);

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
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[var(--text)]">
                Bulletin Annuel — Bulletin Individuel DAS
              </h1>
              <p className="text-sm text-[var(--text-muted)]">
                Modèle officiel DGI · un bulletin par salarié
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <div className="relative">
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="pl-3 pr-8 py-2 text-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/50"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2.5 top-2.5 text-[var(--text-muted)] pointer-events-none" />
          </div>

          <button
            onClick={() => loadDeclaration(year)}
            className="p-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)] transition-colors"
            title="Rafraîchir"
          >
            <RefreshCw className="w-4 h-4 text-[var(--text-muted)]" />
          </button>
        </div>

        <RapportsSubNav active="/rapports/recap-bulletins-annuel" />

        {error && (
          <div className="mt-4 flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 text-[var(--brand)] animate-spin" />
        </div>
      ) : declaration && bulletins.length > 0 ? (
        <>
          {/* ── Carte entreprise ──────────────────────────────────────── */}
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)]/60 p-5 mb-4 shadow-sm print:shadow-none print:border-black">
            <p className="font-semibold text-[var(--text)]">{declaration.companyName}</p>
            <p className="text-xs text-[var(--text-muted)]">
              {declaration.companyActivity ? `${declaration.companyActivity} · ` : ''}
              {declaration.companyAddress}
              {declaration.companyCity ? `, ${declaration.companyCity}` : ''}
              {declaration.companyPhone ? ` · Tél. ${declaration.companyPhone}` : ''}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              {bulletins.length} bulletin{bulletins.length > 1 ? 's' : ''} individuel
              {bulletins.length > 1 ? 's' : ''} — Exercice {year}
            </p>
          </div>

          {/* ── Indicateurs ───────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4 print:hidden">
            <div className="flex items-center justify-between p-4 bg-[var(--surface)] rounded-2xl border border-[var(--border)]/60 shadow-sm">
              <div>
                <p className="text-xs text-[var(--text-muted)]">Employés inclus</p>
                <p className="text-lg font-bold text-[var(--text)]">{bulletins.length}</p>
                <p className="text-[11px] text-[var(--text-muted)]">CDD / CDI uniquement</p>
              </div>
              <Users className="w-5 h-5 text-[var(--brand)]" />
            </div>
            <div className="flex items-center justify-between p-4 bg-[var(--surface)] rounded-2xl border border-[var(--border)]/60 shadow-sm">
              <div>
                <p className="text-xs text-[var(--text-muted)]">Masse salariale (espèces)</p>
                <p className="text-lg font-bold text-[var(--text)]">{fmt(totalMontantEspeces)} F</p>
              </div>
              <Wallet className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="flex items-center justify-between p-4 bg-[var(--surface)] rounded-2xl border border-[var(--border)]/60 shadow-sm">
              <div>
                <p className="text-xs text-[var(--text-muted)]">IRPP retenu cumulé</p>
                <p className="text-lg font-bold text-[var(--text)]">{fmt(totalIrpp)} F</p>
              </div>
              <Landmark className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex items-center justify-between p-4 bg-[var(--surface)] rounded-2xl border border-[var(--border)]/60 shadow-sm">
              <div>
                <p className="text-xs text-[var(--text-muted)]">Indemnités non imposables</p>
                <p className="text-lg font-bold text-[var(--text)]">{fmt(totalIndemnites)} F</p>
              </div>
              <ShieldCheck className="w-5 h-5 text-[var(--accent-2)]" />
            </div>
          </div>

          {/* ── Recherche ─────────────────────────────────────────────── */}
          <div className="relative mb-4 print:hidden">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un employé par nom..."
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none focus:ring-2 focus:ring-[var(--brand)]/40"
            />
          </div>

          {/* ── Tableau des bulletins ─────────────────────────────────── */}
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)]/60 overflow-hidden shadow-sm print:shadow-none print:border-black">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--surface-2)]/60 text-left text-xs text-[var(--text-muted)]">
                    <th className="px-4 py-3 font-semibold">N°</th>
                    <th className="px-4 py-3 font-semibold">NIU</th>
                    <th className="px-4 py-3 font-semibold">Nom &amp; prénom</th>
                    <th className="px-4 py-3 font-semibold">Emploi</th>
                    <th className="px-4 py-3 font-semibold">Adresse</th>
                    <th className="px-4 py-3 font-semibold">Téléphone</th>
                    <th className="px-4 py-3 font-semibold">Situation</th>
                    <th className="px-4 py-3 font-semibold text-center">Enf.</th>
                    <th className="px-4 py-3 font-semibold">Période</th>
                    <th className="px-4 py-3 font-semibold text-center">Présence</th>
                    <th className="px-4 py-3 font-semibold text-center">Congé</th>
                    <th className="px-4 py-3 font-semibold text-right">Montant espèces</th>
                    <th className="px-4 py-3 font-semibold text-right">Avant. logement</th>
                    <th className="px-4 py-3 font-semibold text-right">Avant. autres</th>
                    <th className="px-4 py-3 font-semibold text-right">Imposable 80%</th>
                    <th className="px-4 py-3 font-semibold text-right">IRPP retenu</th>
                    <th className="px-4 py-3 font-semibold text-right">Taxe Dépt</th>
                    <th className="px-4 py-3 font-semibold text-right">TOL retenu</th>
                    <th className="px-4 py-3 font-semibold">Indemnités</th>
                    <th className="px-4 py-3 font-semibold text-right">Total indem.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredBulletins.map((b) => (
                    <tr key={b.employeeId} className="hover:bg-[var(--surface-2)]/40">
                      <td className="px-4 py-3 text-[var(--text-muted)]">{b.ordre}</td>
                      <td className="px-4 py-3 text-[var(--text-muted)] whitespace-nowrap">
                        {b.niu || '—'}
                      </td>
                      <td className="px-4 py-3 font-medium text-[var(--text)] whitespace-nowrap">
                        {b.employeeName}
                      </td>
                      <td className="px-4 py-3 text-[var(--text)]">{b.position}</td>
                      <td className="px-4 py-3 text-[var(--text)]">
                        {b.address}
                        {b.city ? `, ${b.city}` : ''}
                      </td>
                      <td className="px-4 py-3 text-[var(--text)] whitespace-nowrap">
                        {b.phone || '—'}
                      </td>
                      <td className="px-4 py-3 text-[var(--text)] whitespace-nowrap">
                        {b.maritalStatusLabel}
                      </td>
                      <td className="px-4 py-3 text-center text-[var(--text)]">
                        {b.numberOfChildren}
                      </td>
                      <td className="px-4 py-3 text-[var(--text)] whitespace-nowrap">
                        {b.periodFrom} → {b.periodTo}
                      </td>
                      <td className="px-4 py-3 text-center text-[var(--text)]">
                        {b.moisPresence}
                      </td>
                      <td className="px-4 py-3 text-center text-[var(--text)]">
                        {b.moisConge > 0 ? b.moisConge : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-[var(--text)]">
                        {fmt(b.montantEspeces)}
                      </td>
                      <td className="px-4 py-3 text-right text-[var(--text)]">
                        {b.avantageNatureLogement > 0 ? fmt(b.avantageNatureLogement) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-[var(--text)]">
                        {b.avantageNatureAutres > 0 ? fmt(b.avantageNatureAutres) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-[var(--text)]">
                        {fmt(b.montantImposable80)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-[var(--text)]">
                        {fmt(b.irppRetenu)}
                      </td>
                      <td className="px-4 py-3 text-right text-[var(--text)]">
                        {b.taxeDepartementale > 0 ? fmt(b.taxeDepartementale) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-[var(--text)]">
                        {b.tolRetenu > 0 ? fmt(b.tolRetenu) : '—'}
                      </td>
                      <td className="px-4 py-3 text-[var(--text)] whitespace-nowrap">
                        {b.indemnitesNonImposables.length === 0
                          ? '—'
                          : b.indemnitesNonImposables.map((l) => l.label).join(', ')}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-[var(--text)]">
                        {fmt(b.totalIndemnitesNonImposables)}
                      </td>
                    </tr>
                  ))}
                  {filteredBulletins.length === 0 && (
                    <tr>
                      <td colSpan={19} className="px-4 py-10 text-center text-[var(--text-muted)]">
                        Aucun employé ne correspond à &quot;{search}&quot;.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Actions ───────────────────────────────────────────────── */}
          <div className="mt-5 flex items-center gap-3 print:hidden">
            <button
              onClick={() => setPendingExport(true)}
              disabled={exporting || bulletins.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-[var(--brand)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-md shadow-[var(--brand)]/30 transition-all"
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Exporter le Bulletin Annuel (.xlsx)
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
      ) : (
        <div className="bg-[var(--surface)] rounded-2xl p-12 border border-[var(--border)]/60 text-center text-[var(--text-muted)]">
          Aucun bulletin trouvé pour {year}.
        </div>
      )}

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
                  Une dernière vérification avant l'envoi
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Exercice {year} · {bulletins.length} employé{bulletins.length > 1 ? 's' : ''}
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
                Le fichier reprend fidèlement ce que KonzaRH a enregistré sur la
                paie de l'année — brut, IRPP, indemnités, congés. L'essentiel
                du travail est fait.
              </p>
              <p className="text-sm text-[var(--text)] leading-relaxed">
                Une fois téléchargé, avant de le déposer aux impôts, ouvrez-le
                et vérifiez chaque ligne — en particulier les{' '}
                <strong className="text-[var(--text)]">avantages en nature</strong>{' '}
                (logement, autres — jamais suivis automatiquement) et les{' '}
                <strong className="text-[var(--text)]">informations personnelles</strong>{' '}
                d'un employé qui aurait eu un changement récent. Vous seul(e) avez
                le dernier mot sur ce qui part.
              </p>
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