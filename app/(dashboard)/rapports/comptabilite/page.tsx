'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Download, FileSpreadsheet, Copy, CheckCircle2,
  Building2, ArrowRightLeft, Settings, Loader2, AlertCircle,
  CheckCircle, FileText, Calculator, Receipt, Globe,

  ClipboardList, LayoutDashboard,UsersRound,
  UmbrellaOff,BookOpen,DollarSign,UserCircle,BarChart3
} from 'lucide-react';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import RapportsSubNav from '@/components/RapportsSubNav';

// ─── Types ───────────────────────────────────────────────────────────────────
interface JournalEntry {
  date:    Date;
  journal: string;
  piece:   string;
  account: string;
  label:   string;
  debit:   number;
  credit:  number;
}

interface JournalResponse {
  month:        number;
  year:         number;
  totalEntries: number;
  entries:      JournalEntry[];
}

const MONTHS = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre'
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

export default function AccountingPage() {
  const router = useRouter();
  const { bp } = useBasePath();

  const now = new Date();
  const [period, setPeriod]     = useState({ month: now.getMonth() + 1, year: now.getFullYear() });
  const [journal, setJournal]   = useState<JournalResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied]     = useState(false);
  const [exportLoading, setExportLoading] = useState<string | null>(null);
  const [notification, setNotification]  = useState<{ type: 'success'|'error'; msg: string } | null>(null);

  const showNotif = (type: 'success'|'error', msg: string) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      try {
        const data = await api.get<JournalResponse>(
          `/payrolls/journal?month=${period.month}&year=${period.year}`
        );
        setJournal(data);
      } catch (e) {
        console.error(e);
        setJournal(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [period]);

  const entries      = journal?.entries || [];
  const totalDebit   = entries.reduce((s, e) => s + Number(e.debit  || 0), 0);
  const totalCredit  = entries.reduce((s, e) => s + Number(e.credit || 0), 0);
  const isBalanced   = Math.abs(totalDebit - totalCredit) < 10;
  const monthName    = MONTHS[(period.month - 1)] + ' ' + period.year;

  // ── Export Excel Standard ────────────────────────────────────────────
  const handleExcelExport = async () => {
    setExportLoading('excel');
    try {
      const blob = await api.getBlob(
        `/payrolls/export/excel?month=${period.month}&year=${period.year}`
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url;
      a.download = `paie_${period.month}_${period.year}.xlsx`;
      a.click(); URL.revokeObjectURL(url);
      showNotif('success', 'Export Excel téléchargé');
    } catch { showNotif('error', 'Erreur export Excel'); }
    finally { setExportLoading(null); }
  };

  // ── Export Sage (.TXT) ───────────────────────────────────────────────
  const handleSageExport = async () => {
    setExportLoading('sage');
    try {
      const text = await api.getText(
        `/payrolls/export/sage?month=${period.month}&year=${period.year}`
      );
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a'); a.href = url;
      a.download = `sage_paie_${period.month}_${period.year}.txt`;
      a.click(); URL.revokeObjectURL(url);
      showNotif('success', 'Export Sage téléchargé');
    } catch { showNotif('error', 'Erreur export Sage'); }
    finally { setExportLoading(null); }
  };

  // ── Export eTax Congo ────────────────────────────────────────────────
  // ── Export eTax DGI Congo ─────────────────────────────────────────────
  // ✅ Format XLSX strict conforme portail e-Tax (NIU|Brut|BaseITS|ITS|TUS)
  // ✅ Warnings NIU lus depuis les headers HTTP → notification à l'utilisateur
  const handleETaxExport = async () => {
    setExportLoading('etax');
    try {
      const token = typeof window !== 'undefined'
        ? (localStorage.getItem('accessToken') || '')
        : '';

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(
        `${API_URL}/payrolls/export/etax?month=${period.month}&year=${period.year}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error(errText || `Erreur HTTP ${response.status}`);
      }

      // Lire les warnings NIU depuis les headers
      const warningCount = response.headers.get('X-Warning-Count');
      const filename     = response.headers.get('X-Filename')
        || `DECLARATION_ITS_${String(period.month).padStart(2,'0')}_${period.year}.xlsx`;

      const blob = await response.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      if (warningCount && parseInt(warningCount) > 0) {
        showNotif('error', `eTax téléchargé — ⚠ ${warningCount} NIU manquant(s). Vérifiez avant envoi DGI.`);
      } else {
        showNotif('success', `eTax DGI téléchargé : ${filename}`);
      }
    } catch (e: any) {
      showNotif('error', e?.message || 'Erreur export eTax');
    }
    finally { setExportLoading(null); }
  };

  // ── Export CSV Générique ─────────────────────────────────────────────
  const handleCSVExport = async () => {
    setExportLoading('csv');
    try {
      const text = await api.getText(
        `/payrolls/export/csv?month=${period.month}&year=${period.year}`
      );
      const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a'); a.href = url;
      a.download = `paie_${period.month}_${period.year}.csv`;
      a.click(); URL.revokeObjectURL(url);
      showNotif('success', 'Export CSV téléchargé');
    } catch { showNotif('error', 'Erreur export CSV'); }
    finally { setExportLoading(null); }
  };

  // ── Copier les montants ──────────────────────────────────────────────
  const handleCopy = () => {
    const text = entries.map(e =>
      `${e.account}\t${e.label}\t${Number(e.debit).toLocaleString()}\t${Number(e.credit).toLocaleString()}`
    ).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // ── Grouper par pièce pour une lecture plus claire ───────────────────
  const groupedByPiece = entries.reduce((acc: Record<string, JournalEntry[]>, e) => {
    const key = e.piece || 'SANS_REF';
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {});

  return (
    <div className="max-w-[1600px] mx-auto pb-20 space-y-8 px-4">

      {/* ── NOTIFICATION ─────────────────────────────────────────────── */}
      {notification && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-white font-bold text-sm transition-all
          ${notification.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
          {notification.type === 'success'
            ? <CheckCircle size={18} />
            : <AlertCircle size={18} />}
          {notification.msg}
        </div>
      )}

      {/* ── HEADER ────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(bp('/rapports'))}
            className="p-2.5 bg-[var(--surface)] rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors"
          >
            <ArrowLeft size={20} className="text-[var(--text-muted)]" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-[var(--text)] tracking-tight">
              Écritures Comptables
            </h1>
            <p className="text-[var(--text-muted)]">
              OD de paie — Norme OHADA · {monthName}
            </p>
          </div>
        </div>

        {/* Sélecteur de période */}
        <div className="flex items-center gap-3">
          <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] flex items-center px-4 py-2.5 gap-3 shadow-sm">
            <span className="text-[var(--text-muted)] text-sm font-medium">Période :</span>
            <select
              value={period.month}
              onChange={e => setPeriod(p => ({ ...p, month: parseInt(e.target.value) }))}
              className="bg-transparent font-bold text-[var(--text)] outline-none cursor-pointer text-sm"
            >
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select
              value={period.year}
              onChange={e => setPeriod(p => ({ ...p, year: parseInt(e.target.value) }))}
              className="bg-transparent font-bold text-[var(--text)] outline-none cursor-pointer text-sm"
            >
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── NAV ────────────────────────────────────────────────────────── */}
      <RapportsSubNav active="/rapports/comptabilite" />

      {/* ── CONTENU PRINCIPAL ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── JOURNAL COMPTABLE (2/3) ──────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Tableau du journal */}
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-xl overflow-hidden">

            {/* En-tête */}
            <div className="p-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-2)]/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--brand-soft)] text-[var(--brand)] rounded-xl">
                  <ArrowRightLeft size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-[var(--text)]">Journal de Paie — OD</h3>
                  <p className="text-xs text-[var(--text-muted)]">{entries.length} écritures · {monthName}</p>
                </div>
              </div>
              <div className={`px-3 py-1.5 rounded-full text-xs font-bold border
                ${isBalanced
                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400'
                  : 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400'}`}>
                {isBalanced ? '✓ ÉQUILIBRÉ' : '⚠ DÉSÉQUILIBRÉ'}
              </div>
            </div>

            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="animate-spin text-[var(--brand)]" size={36} />
                </div>
              ) : entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-[var(--text-muted)]">
                  <Receipt size={40} className="mb-3 opacity-30" />
                  <p className="font-medium">Aucune écriture pour cette période</p>
                  <p className="text-sm mt-1">Générez d'abord les bulletins de paie</p>
                </div>
              ) : (
                <table className="w-full text-sm text-left font-mono">
                  <thead className="bg-[var(--surface-2)] text-[var(--text-muted)] uppercase text-xs font-semibold">
                    <tr>
                      <th className="px-5 py-3 w-20">Compte</th>
                      <th className="px-5 py-3">Libellé</th>
                      <th className="px-5 py-3 w-28 text-right text-emerald-600">Débit</th>
                      <th className="px-5 py-3 w-28 text-right text-red-500">Crédit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {Object.entries(groupedByPiece).map(([piece, pEntries], pi) => (
                      <React.Fragment key={piece}>
                        {/* Séparateur de pièce */}
                        <tr>
                          <td colSpan={4} className="px-5 py-2 bg-[var(--brand-soft)]">
                            <span className="text-xs font-bold text-[var(--brand)]">
                              📄 {piece}
                            </span>
                          </td>
                        </tr>
                        {pEntries.map((entry, i) => (
                          <tr key={`${pi}-${i}`} className="hover:bg-[var(--surface-2)] transition-colors">
                            <td className="px-5 py-2.5 font-bold text-[var(--text)]">{entry.account}</td>
                            <td className="px-5 py-2.5 text-[var(--text)] text-xs">{entry.label}</td>
                            <td className="px-5 py-2.5 text-right text-[var(--text)] bg-emerald-50/40 dark:bg-emerald-900/5">
                              {Number(entry.debit) > 0 ? Number(entry.debit).toLocaleString('fr-FR') : '–'}
                            </td>
                            <td className="px-5 py-2.5 text-right text-[var(--text)] bg-red-50/40 dark:bg-red-900/5">
                              {Number(entry.credit) > 0 ? Number(entry.credit).toLocaleString('fr-FR') : '–'}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                  <tfoot className="bg-[var(--surface-2)] font-bold border-t-2 border-[var(--border)]">
                    <tr>
                      <td colSpan={2} className="px-5 py-4 text-right uppercase tracking-wider text-xs text-[var(--text-muted)]">
                        TOTAUX ({entries.length} lignes)
                      </td>
                      <td className="px-5 py-4 text-right text-emerald-600 text-base">{totalDebit.toLocaleString('fr-FR')}</td>
                      <td className="px-5 py-4 text-right text-red-600 text-base">{totalCredit.toLocaleString('fr-FR')}</td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>

          {/* Note plan comptable */}
          <div className="bg-[var(--brand-soft)] border border-[var(--brand)]/30 rounded-2xl p-5 flex gap-4">
            <div className="p-2 bg-white/20 rounded-xl text-white shrink-0 self-start">
              <Settings size={20} />
            </div>
            <div>
              <h4 className="font-bold text-[var(--text)] mb-1">
                Plan Comptable OHADA
              </h4>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-1">
                Comptes utilisés par défaut :
                <span className="font-mono mx-1">661100</span> Salaires bruts ·
                <span className="font-mono mx-1">431100</span> CNSS Salarié ·
                <span className="font-mono mx-1">447200</span> ITS/IRPP ·
                <span className="font-mono mx-1">422100</span> Net à payer ·
                <span className="font-mono mx-1">664100</span> Charges patronales ·
                <span className="font-mono mx-1">443000</span> TUS
              </p>
              <p className="text-xs text-[var(--brand)]">
                L'export Sage remplace ces comptes par le format PNM compatible Sage Comptabilité.
              </p>
            </div>
          </div>
        </div>

        {/* ── SIDEBAR ACTIONS (1/3) ────────────────────────────────────── */}
        <div className="space-y-6">

          {/* Formats d'export */}
          <div className="bg-[var(--surface)] rounded-2xl p-6 border border-[var(--border)] shadow-sm">
            <h3 className="font-bold text-[var(--text)] mb-4 flex items-center gap-2">
              <Download size={18} className="text-[var(--brand)]" />
              Formats d'Export
            </h3>
            <div className="space-y-3">

              {/* Excel Standard */}
              <button
                onClick={handleExcelExport}
                disabled={exportLoading === 'excel'}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-[var(--border)] hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all group disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">XL</div>
                  <div className="text-left">
                    <p className="font-bold text-sm text-[var(--text)]">Excel Complet</p>
                    <p className="text-xs text-[var(--text-muted)]">3 feuilles : Paie + Charges + CNSS</p>
                  </div>
                </div>
                {exportLoading === 'excel'
                  ? <Loader2 size={16} className="animate-spin text-emerald-500" />
                  : <Download size={16} className="text-[var(--text-muted)] group-hover:text-emerald-500" />}
              </button>

              {/* Sage */}
              <button
                onClick={handleSageExport}
                disabled={exportLoading === 'sage'}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-[var(--border)] hover:border-[var(--brand)] hover:bg-[var(--brand-soft)] transition-all group disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center font-bold text-xs">SG</div>
                  <div className="text-left">
                    <p className="font-bold text-sm text-[var(--text)]">Sage Comptabilité</p>
                    <p className="text-xs text-[var(--text-muted)]">Format journal .TXT (PNM)</p>
                  </div>
                </div>
                {exportLoading === 'sage'
                  ? <Loader2 size={16} className="animate-spin text-[var(--brand)]" />
                  : <Download size={16} className="text-[var(--text-muted)] group-hover:text-[var(--brand)]" />}
              </button>

              {/* eTax DGID */}
              <button
                onClick={handleETaxExport}
                disabled={exportLoading === 'etax'}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-[var(--border)] hover:border-[var(--accent-2)] hover:bg-[var(--accent-2-soft)] transition-all group disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[var(--accent-2-soft)] text-[var(--accent-2)] flex items-center justify-center">
                    <Globe size={16} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm text-[var(--text)]">eTax Congo (DGID)</p>
                    <p className="text-xs text-[var(--text-muted)]">Déclaration ITS/IRPP · FCFA</p>
                  </div>
                </div>
                {exportLoading === 'etax'
                  ? <Loader2 size={16} className="animate-spin text-[var(--accent-2)]" />
                  : <Download size={16} className="text-[var(--text-muted)] group-hover:text-[var(--accent-2)]" />}
              </button>

              {/* CSV Générique */}
              <button
                onClick={handleCSVExport}
                disabled={exportLoading === 'csv'}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-[var(--border)] hover:border-[var(--text-muted)] hover:bg-[var(--surface-2)] transition-all group disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[var(--surface-2)] text-[var(--text-muted)] flex items-center justify-center font-bold text-xs">CSV</div>
                  <div className="text-left">
                    <p className="font-bold text-sm text-[var(--text)]">CSV Générique</p>
                    <p className="text-xs text-[var(--text-muted)]">Universel — tous logiciels</p>
                  </div>
                </div>
                {exportLoading === 'csv'
                  ? <Loader2 size={16} className="animate-spin text-[var(--text-muted)]" />
                  : <Download size={16} className="text-[var(--text-muted)] group-hover:text-[var(--text)]" />}
              </button>
            </div>
          </div>

          {/* Synthèse financière */}
          <div className="bg-[var(--brand)] rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center gap-2 mb-4 opacity-70">
              <Building2 size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Synthèse {monthName}</span>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Bulletins',          val: `${journal?.totalEntries ? Math.floor(journal.totalEntries / 4) : 0} emp.`, mono: false },
                { label: 'Total Débit',         val: totalDebit.toLocaleString('fr-FR'),  mono: true, color: 'text-emerald-400' },
                { label: 'Total Crédit',        val: totalCredit.toLocaleString('fr-FR'), mono: true, color: 'text-red-400' },
                { label: 'Équilibre',           val: isBalanced ? '✓ OK' : '⚠ Écart : ' + Math.abs(totalDebit - totalCredit).toLocaleString(), mono: false, color: isBalanced ? 'text-emerald-400' : 'text-amber-400' },
              ].map((item, i) => (
                <div key={i} className={`flex justify-between items-center pb-3 ${i < 3 ? 'border-b border-white/10' : ''}`}>
                  <span className="text-sm text-white/80">{item.label}</span>
                  <span className={`font-bold ${item.mono ? 'font-mono text-sm' : ''} ${item.color || ''}`}>
                    {item.val}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={handleCopy}
              className="w-full mt-5 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
            >
              {copied
                ? <><CheckCircle2 size={16} className="text-emerald-400" /> Copié !</>
                : <><Copy size={16} /> Copier les montants</>}
            </button>
          </div>

          {/* Aide eTax DGI — specs précises */}
          <div className="bg-[var(--accent-2-soft)] rounded-2xl p-5 border border-[var(--accent-2)]/30 space-y-3">
            <div className="flex items-start gap-3">
              <Globe size={18} className="text-[var(--accent-2)] mt-0.5 shrink-0" />
              <div className="flex-1">
                <h4 className="font-bold text-[var(--text)] text-sm mb-2">
                  eTax DGI Congo — Format officiel
                </h4>

                {/* Colonnes obligatoires */}
                <div className="space-y-1 mb-3">
                  <p className="text-xs font-bold text-[var(--accent-2)] uppercase tracking-wide mb-1">
                    Colonnes (ordre DGI) :
                  </p>
                  {[
                    { col: 'A', label: 'NIU', desc: '13 chiffres — Identifiant fiscal salarié' },
                    { col: 'B', label: 'Nom & Prénom', desc: 'Identité complète' },
                    { col: 'C', label: 'Salaire Brut', desc: 'Total avant déductions' },
                    { col: 'D', label: 'Base ITS/IRPP', desc: '(Brut − CNSS) × 80%' },
                    { col: 'E', label: 'Montant ITS', desc: 'Impôt retenu à la source' },
                    { col: 'F', label: 'TUS', desc: 'Brut × 7,5% (charge patronale)' },
                  ].map((item) => (
                    <div key={item.col} className="flex items-center gap-2 text-xs">
                      <span className="w-5 h-5 rounded bg-[var(--accent-2-soft)] text-[var(--accent-2)] font-bold text-center leading-5 text-xs shrink-0">
                        {item.col}
                      </span>
                      <span className="font-medium text-[var(--text)] w-24 shrink-0">{item.label}</span>
                      <span className="text-[var(--text-muted)]">{item.desc}</span>
                    </div>
                  ))}
                </div>

                {/* Règles d'or */}
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 border border-amber-200 dark:border-amber-700">
                  <p className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-1.5">⚠ Règles DGI — fichier rejeté si :</p>
                  <ul className="space-y-1 text-xs text-amber-700 dark:text-amber-400">
                    <li>• NIU absent ou ≠ 13 chiffres → rejet <strong>fichier entier</strong></li>
                    <li>• Cellules fusionnées ou avec style → rejeté</li>
                    <li>• Colonne manquante ou dans le mauvais ordre → rejeté</li>
                  </ul>
                </div>

                <p className="text-xs text-[var(--accent-2)] mt-2">
                  Portail : <span className="font-bold">etax.finances.gouv.cg</span>
                  &nbsp;→ Déclarations → ITS/IRPP → Importer fichier
                </p>
              </div>
            </div>
          </div>

          {/* Aide Sage */}
          <div className="bg-[var(--brand-soft)] rounded-2xl p-5 border border-[var(--brand)]/30">
            <div className="flex items-start gap-3">
              <FileText size={18} className="text-[var(--brand)] mt-0.5 shrink-0" />
              <div>
                <h4 className="font-bold text-[var(--text)] text-sm mb-1">
                  Import Sage Comptabilité
                </h4>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Format journal PNM pipe-séparé. Dans Sage : <em>Fichier → Import → Écritures comptables</em> puis sélectionnez le fichier .TXT.
                  Les comptes 661100, 431100, 431300, 447200, 422100, 664100, 641300 doivent exister dans votre plan comptable.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}