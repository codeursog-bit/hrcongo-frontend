'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Download, FileSpreadsheet, Copy, CheckCircle2,
  Building2, ArrowRightLeft, Settings, Loader2, AlertCircle,
  CheckCircle, FileText, Calculator, Receipt, Globe,

  ClipboardList, LayoutDashboard,UsersRound,
  UmbrellaOff,BookOpen,DollarSign
} from 'lucide-react';
import { api } from '@/services/api';

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

// ─── Navigation commune ──────────────────────────────────────────────────────
const NAV_ITEMS = [
  { href:'/rapports',                label:"Vue d'ensemble", Icon:LayoutDashboard},
  { href:'/rapports/complet',        label:'Rapport Complet', Icon:ClipboardList },
  { href:'/rapports/analyse-paie',   label:'Paie & Coûts',   Icon:DollarSign },
  { href:'/rapports/effectifs',      label:'Effectifs',       Icon:UsersRound },
  { href:'/rapports/analyse-conges', label:'Congés',          Icon:UmbrellaOff },
  { href:'/rapports/comptabilite',   label:'Comptabilité',    Icon:BookOpen , active:true  },
];

const MONTHS = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre'
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

export default function AccountingPage() {
  const router = useRouter();

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
            onClick={() => router.push('/rapports')}
            className="p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-500" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              Écritures Comptables
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              OD de paie — Norme OHADA · {monthName}
            </p>
          </div>
        </div>

        {/* Sélecteur de période */}
        <div className="flex items-center gap-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center px-4 py-2.5 gap-3 shadow-sm">
            <span className="text-gray-400 text-sm font-medium">Période :</span>
            <select
              value={period.month}
              onChange={e => setPeriod(p => ({ ...p, month: parseInt(e.target.value) }))}
              className="bg-transparent font-bold text-gray-900 dark:text-white outline-none cursor-pointer text-sm"
            >
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select
              value={period.year}
              onChange={e => setPeriod(p => ({ ...p, year: parseInt(e.target.value) }))}
              className="bg-transparent font-bold text-gray-900 dark:text-white outline-none cursor-pointer text-sm"
            >
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── NAV ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all
              ${item.active
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-sky-300'
              }`}
          >
            <span><item.Icon size={16} /></span>
            <span className="hidden sm:inline">{item.label}</span>
          </button>
        ))}
      </div>

      {/* ── CONTENU PRINCIPAL ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── JOURNAL COMPTABLE (2/3) ──────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Tableau du journal */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xl overflow-hidden">

            {/* En-tête */}
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-xl">
                  <ArrowRightLeft size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Journal de Paie — OD</h3>
                  <p className="text-xs text-gray-500">{entries.length} écritures · {monthName}</p>
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
                  <Loader2 className="animate-spin text-sky-500" size={36} />
                </div>
              ) : entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <Receipt size={40} className="mb-3 opacity-30" />
                  <p className="font-medium">Aucune écriture pour cette période</p>
                  <p className="text-sm mt-1">Générez d'abord les bulletins de paie</p>
                </div>
              ) : (
                <table className="w-full text-sm text-left font-mono">
                  <thead className="bg-gray-100 dark:bg-gray-900 text-gray-500 uppercase text-xs font-semibold">
                    <tr>
                      <th className="px-5 py-3 w-20">Compte</th>
                      <th className="px-5 py-3">Libellé</th>
                      <th className="px-5 py-3 w-28 text-right text-emerald-600">Débit</th>
                      <th className="px-5 py-3 w-28 text-right text-red-500">Crédit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                    {Object.entries(groupedByPiece).map(([piece, pEntries], pi) => (
                      <React.Fragment key={piece}>
                        {/* Séparateur de pièce */}
                        <tr>
                          <td colSpan={4} className="px-5 py-2 bg-blue-50 dark:bg-blue-900/10">
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                              📄 {piece}
                            </span>
                          </td>
                        </tr>
                        {pEntries.map((entry, i) => (
                          <tr key={`${pi}-${i}`} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                            <td className="px-5 py-2.5 font-bold text-gray-900 dark:text-white">{entry.account}</td>
                            <td className="px-5 py-2.5 text-gray-600 dark:text-gray-300 text-xs">{entry.label}</td>
                            <td className="px-5 py-2.5 text-right text-gray-800 dark:text-gray-200 bg-emerald-50/40 dark:bg-emerald-900/5">
                              {Number(entry.debit) > 0 ? Number(entry.debit).toLocaleString('fr-FR') : '–'}
                            </td>
                            <td className="px-5 py-2.5 text-right text-gray-800 dark:text-gray-200 bg-red-50/40 dark:bg-red-900/5">
                              {Number(entry.credit) > 0 ? Number(entry.credit).toLocaleString('fr-FR') : '–'}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-100 dark:bg-gray-900 font-bold border-t-2 border-gray-200 dark:border-gray-600">
                    <tr>
                      <td colSpan={2} className="px-5 py-4 text-right uppercase tracking-wider text-xs text-gray-500">
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
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl p-5 flex gap-4">
            <div className="p-2 bg-white dark:bg-blue-900/40 rounded-xl text-blue-500 shrink-0 self-start">
              <Settings size={20} />
            </div>
            <div>
              <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-1">
                Plan Comptable OHADA
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-400 leading-relaxed mb-1">
                Comptes utilisés par défaut :
                <span className="font-mono mx-1">661100</span> Salaires bruts ·
                <span className="font-mono mx-1">431100</span> CNSS Salarié ·
                <span className="font-mono mx-1">447200</span> ITS/IRPP ·
                <span className="font-mono mx-1">422100</span> Net à payer ·
                <span className="font-mono mx-1">664100</span> Charges patronales ·
                <span className="font-mono mx-1">443000</span> TUS
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-500">
                L'export Sage remplace ces comptes par le format PNM compatible Sage Comptabilité.
              </p>
            </div>
          </div>
        </div>

        {/* ── SIDEBAR ACTIONS (1/3) ────────────────────────────────────── */}
        <div className="space-y-6">

          {/* Formats d'export */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Download size={18} className="text-sky-500" />
              Formats d'Export
            </h3>
            <div className="space-y-3">

              {/* Excel Standard */}
              <button
                onClick={handleExcelExport}
                disabled={exportLoading === 'excel'}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all group disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">XL</div>
                  <div className="text-left">
                    <p className="font-bold text-sm text-gray-900 dark:text-white">Excel Complet</p>
                    <p className="text-xs text-gray-500">3 feuilles : Paie + Charges + CNSS</p>
                  </div>
                </div>
                {exportLoading === 'excel'
                  ? <Loader2 size={16} className="animate-spin text-emerald-500" />
                  : <Download size={16} className="text-gray-400 group-hover:text-emerald-500" />}
              </button>

              {/* Sage */}
              <button
                onClick={handleSageExport}
                disabled={exportLoading === 'sage'}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">SG</div>
                  <div className="text-left">
                    <p className="font-bold text-sm text-gray-900 dark:text-white">Sage Comptabilité</p>
                    <p className="text-xs text-gray-500">Format journal .TXT (PNM)</p>
                  </div>
                </div>
                {exportLoading === 'sage'
                  ? <Loader2 size={16} className="animate-spin text-blue-500" />
                  : <Download size={16} className="text-gray-400 group-hover:text-blue-500" />}
              </button>

              {/* eTax DGID */}
              <button
                onClick={handleETaxExport}
                disabled={exportLoading === 'etax'}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all group disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
                    <Globe size={16} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm text-gray-900 dark:text-white">eTax Congo (DGID)</p>
                    <p className="text-xs text-gray-500">Déclaration ITS/IRPP · FCFA</p>
                  </div>
                </div>
                {exportLoading === 'etax'
                  ? <Loader2 size={16} className="animate-spin text-violet-500" />
                  : <Download size={16} className="text-gray-400 group-hover:text-violet-500" />}
              </button>

              {/* CSV Générique */}
              <button
                onClick={handleCSVExport}
                disabled={exportLoading === 'csv'}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-all group disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-xs">CSV</div>
                  <div className="text-left">
                    <p className="font-bold text-sm text-gray-900 dark:text-white">CSV Générique</p>
                    <p className="text-xs text-gray-500">Universel — tous logiciels</p>
                  </div>
                </div>
                {exportLoading === 'csv'
                  ? <Loader2 size={16} className="animate-spin text-gray-500" />
                  : <Download size={16} className="text-gray-400 group-hover:text-gray-600" />}
              </button>
            </div>
          </div>

          {/* Synthèse financière */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-black rounded-2xl p-6 text-white shadow-xl">
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
                  <span className="text-sm text-gray-300">{item.label}</span>
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
          <div className="bg-violet-50 dark:bg-violet-900/20 rounded-2xl p-5 border border-violet-200 dark:border-violet-800 space-y-3">
            <div className="flex items-start gap-3">
              <Globe size={18} className="text-violet-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <h4 className="font-bold text-violet-900 dark:text-violet-200 text-sm mb-2">
                  eTax DGI Congo — Format officiel
                </h4>

                {/* Colonnes obligatoires */}
                <div className="space-y-1 mb-3">
                  <p className="text-xs font-bold text-violet-700 dark:text-violet-300 uppercase tracking-wide mb-1">
                    Colonnes (ordre DGI) :
                  </p>
                  {[
                    { col: 'A', label: 'NIU', desc: '13 chiffres — Identifiant fiscal salarié' },
                    { col: 'B', label: 'Nom & Prénom', desc: 'Identité complète' },
                    { col: 'C', label: 'Salaire Brut', desc: 'Total avant déductions' },
                    { col: 'D', label: 'Base ITS/IRPP', desc: '(Brut − CNSS) × 80%' },
                    { col: 'E', label: 'Montant ITS', desc: 'Impôt retenu à la source' },
                    { col: 'F', label: 'TUS', desc: 'Brut × 5% (charge patronale)' },
                  ].map((item) => (
                    <div key={item.col} className="flex items-center gap-2 text-xs">
                      <span className="w-5 h-5 rounded bg-violet-200 dark:bg-violet-800 text-violet-700 dark:text-violet-200 font-bold text-center leading-5 text-xs shrink-0">
                        {item.col}
                      </span>
                      <span className="font-medium text-violet-800 dark:text-violet-200 w-24 shrink-0">{item.label}</span>
                      <span className="text-violet-600 dark:text-violet-400">{item.desc}</span>
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

                <p className="text-xs text-violet-600 dark:text-violet-400 mt-2">
                  Portail : <span className="font-bold">etax.finances.gouv.cg</span>
                  &nbsp;→ Déclarations → ITS/IRPP → Importer fichier
                </p>
              </div>
            </div>
          </div>

          {/* Aide Sage */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-5 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <FileText size={18} className="text-blue-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-bold text-blue-900 dark:text-blue-200 text-sm mb-1">
                  Import Sage Comptabilité
                </h4>
                <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
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




// 'use client';

// import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { 
//   ArrowLeft, Download, FileSpreadsheet, Copy, 
//   CheckCircle2, Building2, ArrowRightLeft, Settings
// } from 'lucide-react';
// import { api } from '@/services/api';

// // --- Types ---
// interface JournalEntry {
//   account: string;
//   label: string;
//   debit: number;
//   credit: number;
//   ref: string;
// }

// export default function AccountingExportPage() {
//   const router = useRouter();
//   const [period, setPeriod] = useState({ month: 11, year: 2025 }); // Nov 2025 default
//   const [copied, setCopied] = useState(false);
//   const [entries, setEntries] = useState<JournalEntry[]>([]);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     const fetchJournal = async () => {
//       setIsLoading(true);
//       try {
//         const data = await api.get<JournalEntry[]>(`/payrolls/journal?month=${period.month}&year=${period.year}`);
//         setEntries(Array.isArray(data) ? data : []);
//       } catch (e) {
//         console.error("Erreur chargement journal", e);
//         setEntries([]);
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     fetchJournal();
//   }, [period]);

//   const totalDebit = entries.reduce((acc, curr) => acc + curr.debit, 0);
//   const totalCredit = entries.reduce((acc, curr) => acc + curr.credit, 0);
//   const isBalanced = Math.abs(totalDebit - totalCredit) < 1; // Tolerance for float errors

//   const handleCopy = () => {
//     // Logic to copy text to clipboard
//     const text = entries.map(e => `${e.account}\t${e.label}\t${e.debit}\t${e.credit}`).join('\n');
//     navigator.clipboard.writeText(text);
//     setCopied(true);
//     setTimeout(() => setCopied(false), 2000);
//   };

//   return (
//     <div className="max-w-[1600px] mx-auto pb-20 space-y-8">
      
//       {/* HEADER */}
//       <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
//         <div className="flex items-center gap-4">
//            <button onClick={() => router.back()} className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors">
//              <ArrowLeft size={20} className="text-gray-500" />
//            </button>
//            <div>
//               <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Ecritures Comptables</h1>
//               <p className="text-gray-500 dark:text-gray-400">Génération automatique des OD de paie (Norme OHADA).</p>
//            </div>
//         </div>

//         <div className="flex items-center gap-3">
//            <div className="bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center px-3 py-2 shadow-sm">
//               <span className="text-gray-500 text-sm font-medium mr-2">Période :</span>
//               <select 
//                  value={period.month}
//                  onChange={(e) => setPeriod({ ...period, month: parseInt(e.target.value) })}
//                  className="bg-transparent font-bold text-gray-900 dark:text-white outline-none cursor-pointer text-sm mr-2"
//               >
//                  <option value={10}>Octobre</option>
//                  <option value={11}>Novembre</option>
//                  <option value={12}>Décembre</option>
//               </select>
//               <select 
//                  value={period.year}
//                  onChange={(e) => setPeriod({ ...period, year: parseInt(e.target.value) })}
//                  className="bg-transparent font-bold text-gray-900 dark:text-white outline-none cursor-pointer text-sm"
//               >
//                  <option value={2024}>2024</option>
//                  <option value={2025}>2025</option>
//               </select>
//            </div>
           
//            <button className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all">
//               <FileSpreadsheet size={18} />
//               <span>Export Excel</span>
//            </button>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         
//          {/* LEFT: THE JOURNAL (The Core Feature) */}
//          <div className="lg:col-span-2 space-y-6">
//             <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
//                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
//                   <div className="flex items-center gap-3">
//                      <div className="p-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-lg">
//                         <ArrowRightLeft size={20} />
//                      </div>
//                      <div>
//                         <h3 className="font-bold text-gray-900 dark:text-white">Journal de Paie</h3>
//                         <p className="text-xs text-gray-500">Brouillard de saisie</p>
//                      </div>
//                   </div>
//                   <div className={`px-3 py-1 rounded-full text-xs font-bold border ${isBalanced ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
//                      {isBalanced ? 'ÉQUILIBRÉ' : 'DÉSÉQUILIBRÉ'}
//                   </div>
//                </div>

//                <div className="overflow-x-auto">
//                   <table className="w-full text-sm text-left font-mono">
//                      <thead className="bg-gray-100 dark:bg-gray-900 text-gray-500 uppercase text-xs font-semibold">
//                         <tr>
//                            <th className="px-6 py-3 w-24">Compte</th>
//                            <th className="px-6 py-3">Libellé de l'écriture</th>
//                            <th className="px-6 py-3 w-32 text-right text-emerald-600">Débit</th>
//                            <th className="px-6 py-3 w-32 text-right text-red-500">Crédit</th>
//                         </tr>
//                      </thead>
//                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
//                         {isLoading ? (
//                             <tr><td colSpan={4} className="p-8 text-center text-gray-500">Chargement des écritures...</td></tr>
//                         ) : entries.length === 0 ? (
//                             <tr><td colSpan={4} className="p-8 text-center text-gray-500">Aucune écriture pour cette période.</td></tr>
//                         ) : (
//                             entries.map((entry, i) => (
//                             <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
//                                 <td className="px-6 py-3 font-bold text-gray-900 dark:text-white">{entry.account}</td>
//                                 <td className="px-6 py-3 text-gray-600 dark:text-gray-300">{entry.label}</td>
//                                 <td className="px-6 py-3 text-right text-gray-800 dark:text-gray-200 border-r border-gray-100 dark:border-gray-700 bg-emerald-50/30 dark:bg-emerald-900/10">
//                                     {entry.debit > 0 ? entry.debit.toLocaleString() : '-'}
//                                 </td>
//                                 <td className="px-6 py-3 text-right text-gray-800 dark:text-gray-200 bg-red-50/30 dark:bg-red-900/10">
//                                     {entry.credit > 0 ? entry.credit.toLocaleString() : '-'}
//                                 </td>
//                             </tr>
//                             ))
//                         )}
//                      </tbody>
//                      <tfoot className="bg-gray-100 dark:bg-gray-900 font-bold border-t-2 border-gray-200 dark:border-gray-600">
//                         <tr>
//                            <td colSpan={2} className="px-6 py-4 text-right uppercase tracking-wider text-xs">Totaux</td>
//                            <td className="px-6 py-4 text-right text-emerald-600">{totalDebit.toLocaleString()}</td>
//                            <td className="px-6 py-4 text-right text-red-600">{totalCredit.toLocaleString()}</td>
//                         </tr>
//                      </tfoot>
//                   </table>
//                </div>
//             </div>

//             <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 flex gap-4 items-start">
//                <div className="p-2 bg-white dark:bg-blue-900/40 rounded-full text-blue-500 shrink-0">
//                   <Settings size={20} />
//                </div>
//                <div>
//                   <h4 className="font-bold text-blue-800 dark:text-blue-300 text-sm">Configuration du Plan Comptable</h4>
//                   <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 mb-3">
//                      Les numéros de comptes (6611, 4221...) sont configurés par défaut selon le plan OHADA. Vous pouvez les personnaliser pour correspondre à votre logiciel comptable (Sage, Ciel, Xero).
//                   </p>
//                   <button className="text-xs font-bold bg-white dark:bg-blue-800 text-blue-600 dark:text-blue-200 px-3 py-1.5 rounded border border-blue-200 dark:border-blue-700 hover:shadow-sm transition-all">
//                      Modifier le mapping des comptes
//                   </button>
//                </div>
//             </div>
//          </div>

//          {/* RIGHT: ACTIONS & SUMMARY */}
//          <div className="space-y-6">
            
//             <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
//                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Formats d'export</h3>
//                <div className="space-y-3">
//                   <button className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all group">
//                      <div className="flex items-center gap-3">
//                         <div className="w-8 h-8 rounded-lg bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs">XL</div>
//                         <div className="text-left">
//                            <p className="font-bold text-sm text-gray-900 dark:text-white">Excel (Standard)</p>
//                            <p className="text-xs text-gray-500">Pour révision manuelle</p>
//                         </div>
//                      </div>
//                      <Download size={16} className="text-gray-400 group-hover:text-emerald-500" />
//                   </button>

//                   <button className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group">
//                      <div className="flex items-center gap-3">
//                         <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">SG</div>
//                         <div className="text-left">
//                            <p className="font-bold text-sm text-gray-900 dark:text-white">Sage Comptabilité</p>
//                            <p className="text-xs text-gray-500">Format .PNM ou .TXT</p>
//                         </div>
//                      </div>
//                      <Download size={16} className="text-gray-400 group-hover:text-blue-500" />
//                   </button>

//                   <button className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group">
//                      <div className="flex items-center gap-3">
//                         <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">CS</div>
//                         <div className="text-left">
//                            <p className="font-bold text-sm text-gray-900 dark:text-white">CSV Générique</p>
//                            <p className="text-xs text-gray-500">Universel</p>
//                         </div>
//                      </div>
//                      <Download size={16} className="text-gray-400 group-hover:text-purple-500" />
//                   </button>
//                </div>
//             </div>

//             <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-black rounded-2xl p-6 text-white shadow-lg">
//                <div className="flex items-center gap-2 mb-4 opacity-80">
//                   <Building2 size={18} />
//                   <span className="text-sm font-bold uppercase tracking-wider">Synthèse</span>
//                </div>
//                <div className="space-y-4">
//                   <div className="flex justify-between items-center pb-2 border-b border-white/10">
//                      <span className="text-sm text-gray-300">Total Charges</span>
//                      <span className="font-mono font-bold">{entries.find(e => e.account === '6641')?.debit.toLocaleString() || 0}</span>
//                   </div>
//                   <div className="flex justify-between items-center pb-2 border-b border-white/10">
//                      <span className="text-sm text-gray-300">Net à Payer</span>
//                      <span className="font-mono font-bold text-emerald-400">{entries.find(e => e.account === '4221')?.credit.toLocaleString() || 0}</span>
//                   </div>
//                   <div className="flex justify-between items-center pt-2">
//                      <span className="text-sm font-bold">Masse Totale</span>
//                      <span className="font-mono font-bold text-xl">{totalDebit.toLocaleString()}</span>
//                   </div>
//                </div>
               
//                <button 
//                   onClick={handleCopy}
//                   className="w-full mt-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
//                >
//                   {copied ? <CheckCircle2 size={16} className="text-emerald-400"/> : <Copy size={16} />}
//                   {copied ? 'Copié !' : 'Copier les montants'}
//                </button>
//             </div>

//          </div>

//       </div>
//     </div>
//   );
// }