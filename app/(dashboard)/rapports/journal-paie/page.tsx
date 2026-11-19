'use client';
import { ModuleSelect } from '@/components/ui/ModuleSelect';

import { DocumentPreviewPanel } from '@/components/ui/DocumentReader';

// ============================================================================
// 📁 app/(dashboard)/rapports/journal-paie/page.tsx
// ✅ JOURNAL DE PAIE — page de lecture (aucun bulletin n'est modifié ici).
//    1) Récapitulatif + indicateurs + graphiques (JournalDashboard)
//    2) Tableau du plus payé au moins payé, dans l'ordre d'une feuille de paie
//       (JournalTable)
//    3) Saisie manuelle de la paie étrangère des expatriés (ForeignPayModal)
//    4) Impression / PDF A4 paysage avec en-tête entreprise, en couleur ou
//       en noir & blanc (JournalPrintable)
//    5) Export Excel dynamique (formules) généré par le serveur
//    Accès : déjà couvert par la règle /rapports/* de lib/route-access.ts.
// ============================================================================

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, BookOpen, ChevronDown, Printer, FileDown, Globe2,
  AlertTriangle, Loader2, Palette, Contrast, FileSpreadsheet,
} from 'lucide-react';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import RapportsSubNav from '@/components/RapportsSubNav';
import { KonzaLoader } from '@/components/ui/KonzaLoader';
import { printReport } from '@/lib/report-print';
import { downloadJournalPDF } from '@/lib/payroll-journal-pdf';
import { MONTHS_FR } from '@/lib/payroll-journal-columns';
import type { JournalRow, PayrollJournal } from '@/types/payroll-journal';
import JournalDashboard from '@/components/payroll-journal/JournalDashboard';
import JournalTable from '@/components/payroll-journal/JournalTable';
import JournalPrintable from '@/components/payroll-journal/JournalPrintable';
import ForeignPayModal from '@/components/payroll-journal/ForeignPayModal';
import { ReportsFrame as ModulePageFrame } from '@/components/reports/ReportsFrame';

const REPORT_ID = 'journal-paie-print';
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

const selectCls =
  'pl-3 pr-8 py-2 text-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/50';

function JournalPaiePage() {
  const router = useRouter();
  const { bp } = useBasePath();

  const now = new Date();
  const [period, setPeriod] = useState({ month: now.getMonth() + 1, year: now.getFullYear() });
  const [journal, setJournal] = useState<PayrollJournal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [mono, setMono] = useState(false); // false = couleur, true = noir & blanc
  const [pdfBusy, setPdfBusy] = useState(false);
  const [excelBusy, setExcelBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalEmployeeId, setModalEmployeeId] = useState<string | null>(null);

  const loadData = useCallback(
    async (showLoader = true) => {
      if (showLoader) setIsLoading(true);
      setLoadError(null);
      try {
        const data = await api.get<PayrollJournal>(
          `/payroll-journal?month=${period.month}&year=${period.year}`,
        );
        setJournal(data);
      } catch (e: any) {
        setLoadError(e?.message || 'Erreur de chargement');
        if (showLoader) setJournal(null);
      } finally {
        if (showLoader) setIsLoading(false);
      }
    },
    [period],
  );

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  const openForeign = (row?: JournalRow) => {
    setModalEmployeeId(row?.employeeId ?? null);
    setModalOpen(true);
  };

  const handlePrint = () => setTimeout(() => printReport(REPORT_ID), 50);

  // Export Excel DYNAMIQUE (formules, cellules modifiables) — généré côté serveur,
  // même design que l'Excel du récap personnel.
  const handleExcel = async () => {
    setExcelBusy(true);
    setActionError(null);
    try {
      const blob = await api.getBlob(
        `/payroll-journal/export/excel?month=${period.month}&year=${period.year}`,
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `journal_paie_${String(period.month).padStart(2, '0')}_${period.year}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setActionError(e?.message || "Erreur lors de l'export Excel");
    } finally {
      setExcelBusy(false);
    }
  };

  const handlePdf = async () => {
    if (!journal) return;
    setPdfBusy(true);
    try {
      const slug = journal.company.name.replace(/[^\w]+/g, '_').replace(/^_+|_+$/g, '');
      await downloadJournalPDF(
        REPORT_ID,
        `journal_paie_${slug}_${String(period.month).padStart(2, '0')}_${period.year}.pdf`,
      );
    } finally {
      setPdfBusy(false);
    }
  };

  const hasRows = !!journal && journal.rows.length > 0;

  return (
    <div className="min-h-screen bg-[var(--bg)] p-4 md:p-6">
      {/* ── En-tête ─────────────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3 reports-header">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(bp('/rapports'))}
              className="p-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)] transition-colors"
            >
              <ArrowLeft strokeWidth={1.5} className="w-4 h-4 text-[var(--text-muted)]" />
            </button>
            <div className="p-2.5 bg-[var(--surface)] rounded-xl shadow-lg shadow-[var(--brand)]/30">
              <BookOpen strokeWidth={1.5} className="w-5 h-5 text-[var(--text)]" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[var(--text)]">Journal de paie</h1>
              <p className="text-sm text-[var(--text-muted)]">
                Récapitulatif, détail par employé et expatriés — {MONTHS_FR[period.month - 1]} {period.year}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => openForeign()}
              disabled={!hasRows}
              className="px-3 py-2 text-sm font-semibold rounded-xl border border-[var(--border)] text-[var(--action)] bg-[var(--brand-soft)] hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
            >
              <Globe2 strokeWidth={1.5} className="w-4 h-4" /> Paie expatrié
            </button>

            {/* Couleur / Noir & blanc — s'applique à l'impression et au PDF */}
            <div className="flex rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--surface)]">
              <button
                onClick={() => setMono(false)}
                title="Impression en couleur"
                className={`px-3 py-2 text-sm font-semibold flex items-center gap-1.5 ${!mono ? 'bg-[var(--brand)] text-[var(--text)]' : 'text-[var(--text)]'}`}
              >
                <Palette strokeWidth={1.5} className="w-4 h-4" /> Couleur
              </button>
              <button
                onClick={() => setMono(true)}
                title="Impression en noir et blanc"
                className={`px-3 py-2 text-sm font-semibold flex items-center gap-1.5 ${mono ? 'bg-[var(--brand)] text-[var(--text)]' : 'text-[var(--text)]'}`}
              >
                <Contrast strokeWidth={1.5} className="w-4 h-4" /> N&amp;B
              </button>
            </div>

            <button
              onClick={handlePrint}
              disabled={!hasRows}
              className="px-3 py-2 text-sm font-semibold rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-2)] disabled:opacity-50 flex items-center gap-1.5"
            >
              <Printer strokeWidth={1.5} className="w-4 h-4" /> Imprimer
            </button>
            <button
              onClick={handleExcel}
              disabled={!hasRows || excelBusy}
              className="px-3 py-2 text-sm font-semibold rounded-xl border border-[var(--border)] text-[var(--action)] bg-[var(--brand-soft)] hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
            >
              {excelBusy ? <Loader2 strokeWidth={1.5} className="w-4 h-4 animate-spin" /> : <FileSpreadsheet strokeWidth={1.5} className="w-4 h-4" />}
              Excel
            </button>
            <button
              onClick={handlePdf}
              disabled={!hasRows || pdfBusy}
              className="px-3 py-2 text-sm font-semibold rounded-xl bg-[var(--brand)] text-[var(--text)] shadow-md shadow-[var(--brand)]/30 hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
            >
              {pdfBusy ? <Loader2 strokeWidth={1.5} className="w-4 h-4 animate-spin" /> : <FileDown strokeWidth={1.5} className="w-4 h-4" />}
              PDF
            </button>
          </div>
        </div>

        {/* ── Période ───────────────────────────────────────────────── */}
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <div className="relative">
            <ModuleSelect
              value={period.month}
              onChange={(e) => setPeriod((p) => ({ ...p, month: Number(e.target.value) }))}
              className={selectCls}
            >
              {MONTHS_FR.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </ModuleSelect>
            <ChevronDown strokeWidth={1.5} className="w-4 h-4 absolute right-2.5 top-2.5 text-[var(--text-muted)] pointer-events-none" />
          </div>
          <div className="relative">
            <ModuleSelect
              value={period.year}
              onChange={(e) => setPeriod((p) => ({ ...p, year: Number(e.target.value) }))}
              className={selectCls}
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </ModuleSelect>
            <ChevronDown strokeWidth={1.5} className="w-4 h-4 absolute right-2.5 top-2.5 text-[var(--text-muted)] pointer-events-none" />
          </div>
        </div>

        <RapportsSubNav active="/rapports/journal-paie" />

        {actionError && (
          <div className="mt-4 flex items-start gap-3 p-4 bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] border border-[var(--border)] rounded-2xl">
            <AlertTriangle strokeWidth={1.5} className="w-5 h-5 text-[var(--danger-text)] shrink-0 mt-0.5" />
            <p className="text-sm text-[var(--danger-text)]">{actionError}</p>
          </div>
        )}

        {loadError && (
          <div className="mt-4 flex items-start gap-3 p-4 bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] border border-[var(--border)] rounded-2xl">
            <AlertTriangle strokeWidth={1.5} className="w-5 h-5 text-[var(--danger-text)] shrink-0 mt-0.5" />
            <p className="text-sm text-[var(--danger-text)]">{loadError}</p>
          </div>
        )}
      </div>

      {/* ── Contenu ─────────────────────────────────────────────────── */}
      {isLoading ? (
        <KonzaLoader variant="section" />
      ) : !journal || journal.rows.length === 0 ? (
        <div className="bg-[var(--surface)] rounded-2xl p-12 border border-[var(--border)] text-center text-[var(--text-muted)] reports-card">
          Aucun bulletin trouvé pour cette période.
        </div>
      ) : (
        <div className="space-y-5">
          <JournalDashboard journal={journal} />

          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-[var(--text)]">
                Journal détaillé — du plus payé au moins payé
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Montants en FCFA · l'icône <Globe2 strokeWidth={1.5} className="w-3 h-3 inline -mt-0.5" /> permet de saisir la paie à l'étranger d'un expatrié
              </p>
            </div>
            <JournalTable journal={journal} onEditForeign={openForeign} />
          </div>
        </div>
      )}

      {/* ── Saisie expatrié ─────────────────────────────────────────── */}
      {journal && (
        <ForeignPayModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          journal={journal}
          initialEmployeeId={modalEmployeeId}
          onChanged={() => loadData(false)}
        />
      )}

      {/* ── Document imprimable : hors écran, généré depuis les données déjà chargées ── */}
      {journal && journal.rows.length > 0 && (
        <DocumentPreviewPanel title="Journal de paie" landscape><div style={{ position: 'fixed', top: -99999, left: -99999 }}>
          <JournalPrintable id={REPORT_ID} journal={journal} mono={mono} />
        </div></DocumentPreviewPanel>
      )}
    </div>
  );
}


export default function JournalPaiePageWithFrame() {
  return (
    <ModulePageFrame kind="list">
      <JournalPaiePage />
    </ModulePageFrame>
  );
}
