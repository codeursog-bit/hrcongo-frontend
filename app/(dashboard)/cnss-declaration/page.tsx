'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileSpreadsheet, Download, AlertTriangle, CheckCircle2,
  Clock, ChevronDown, RefreshCw, Shield, Users, TrendingUp,
  Banknote, AlertCircle, Calendar, ChevronRight, FileText,
  Building2, Info, XCircle, Loader2, BarChart3, Eye, EyeOff,
} from 'lucide-react';
import { api } from '@/services/api';

// ─── CONFIG ────────────────────────────────────────────────────────────────

const MONTHS = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
];

// ─── TYPES ─────────────────────────────────────────────────────────────────
interface EmployeeCnss {
  employeeId: string;
  matricule: string;
  cnssNumber: string;
  nom: string;
  poste: string;
  contractType: string;
  brutMensuel: number;
  pensionSalarial: number;
  pensionPatronal: number;
  familyPatronal: number;
  accidentPatronal: number;
  totalSalarial: number;
  totalPatronal: number;
  totalGlobal: number;
  tusDgi: number;
  tusCnss: number;
  tusTotal: number;
  its: number;
  netSalary: number;
  missingCnss: boolean;
}

interface CnssTotals {
  effectif: number;
  masseSalariale: number;
  pensionSalarial: number;
  totalSalarial: number;
  pensionPatronal: number;
  familyPatronal: number;
  accidentPatronal: number;
  totalPatronal: number;
  totalCnss: number;
  tusDgi: number;
  tusCnss: number;
  tusTotal: number;
  totalAVerserCnss: number;
  totalAVerserDgi: number;
  isLate: boolean;
  monthsLate: number;
  latePenalty: number;
  totalAvecPenalite: number;
}

interface CnssRecap {
  company: { name: string; cnssNumber: string; address?: string } | null;
  month: number;
  year: number;
  employees: EmployeeCnss[];
  totals: CnssTotals;
  deadline: string;
  isLate: boolean;
  missingCnssCount: number;
  rates: {
    PENSION_SALARIAL: number;
    PENSION_PATRONAL: number;
    FAMILY_PATRONAL: number;
    ACCIDENT_PATRONAL: number;
    PENSION_CEILING: number;
    FAMILY_CEILING: number;
    TUS_DGI: number;
    TUS_CNSS: number;
  };
}

interface HistoryItem {
  month: number;
  year: number;
  monthLabel: string;
  payrollCount: number;
  deadline: string;
  isLate: boolean;
  hasPaid: boolean;
  status: 'DÉCLARÉ' | 'EN RETARD' | 'À DÉCLARER' | 'À VENIR';
}

// ─── HELPERS ───────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' FCFA';

const fmtShort = (n: number) =>
  new Intl.NumberFormat('fr-FR').format(Math.round(n));

// ─── SOUS-COMPOSANTS ───────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon: Icon, color, alert
}: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; color: string; alert?: boolean;
}) {
  return (
    <div className={`
      relative rounded-2xl p-5 border transition-all
      bg-white dark:bg-slate-900
      ${alert
        ? 'border-red-300 dark:border-red-700 shadow-red-100 dark:shadow-red-950/30 shadow-md'
        : 'border-slate-200 dark:border-slate-700/60 shadow-sm hover:shadow-md'
      }
    `}>
      {alert && (
        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
      )}
      <div className="flex items-start gap-3">
        <div className={`p-2.5 rounded-xl ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide mb-1">
            {label}
          </p>
          <p className={`text-lg font-bold truncate ${alert ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
            {value}
          </p>
          {sub && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{sub}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Badge({ status }: { status: HistoryItem['status'] }) {
  const styles = {
    'DÉCLARÉ':    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
    'EN RETARD':  'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
    'À DÉCLARER': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
    'À VENIR':    'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[status]}`}>
      {status}
    </span>
  );
}

// ─── PAGE PRINCIPALE ───────────────────────────────────────────────────────
export default function CnssDeclarationPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year,  setYear]  = useState(now.getFullYear());

  const [recap,   setRecap]   = useState<CnssRecap | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [histLoading, setHistLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [activeTab, setActiveTab] = useState<'declaration' | 'history' | 'taux'>('declaration');
  const [showCnssDetail, setShowCnssDetail] = useState(false);
  const [exportingXlsx, setExportingXlsx] = useState(false);
  const [exportingCsv,  setExportingCsv]  = useState(false);
  const [searchEmp, setSearchEmp] = useState('');
  const [showMissingOnly, setShowMissingOnly] = useState(false);

  const loadRecap = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get<CnssRecap>(
        `/cnss-declaration/recap?month=${month}&year=${year}`,
      );
      setRecap(data);
    } catch (e: any) {
      setError(e.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  const loadHistory = useCallback(async () => {
    setHistLoading(true);
    try {
      const data = await api.get<HistoryItem[]>(`/cnss-declaration/history?year=${year}`);
      setHistory(data);
    } catch {/* silencieux */}
    finally { setHistLoading(false); }
  }, [year]);

  useEffect(() => { loadRecap(); }, [loadRecap]);
  useEffect(() => { if (activeTab === 'history') loadHistory(); }, [activeTab, loadHistory]);

  const handleExportXlsx = async () => {
    if (!recap) return;
    setExportingXlsx(true);
    try {
      const mm = String(month).padStart(2, '0');
      const name = (recap.company?.name || 'ENTREPRISE').replace(/\s+/g, '_').toUpperCase();
      const blob = await api.getBlob(`/cnss-declaration/export/excel?month=${month}&year=${year}`);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `CNSS_DNMS_${mm}_${year}_${name}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert('❌ ' + e.message);
    } finally {
      setExportingXlsx(false);
    }
  };

  const handleExportCsv = async () => {
    if (!recap) return;
    setExportingCsv(true);
    try {
      const mm   = String(month).padStart(2, '0');
      const name = (recap.company?.name || 'ENTREPRISE').replace(/\s+/g, '_').toUpperCase();
      const blob = await api.getBlob(`/cnss-declaration/export/csv?month=${month}&year=${year}`);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `CNSS_DNMS_${mm}_${year}_${name}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert('❌ ' + e.message);
    } finally {
      setExportingCsv(false);
    }
  };

  // ─── Filtered employees ─────────────────────────────────────────────────
  const filteredEmployees = (recap?.employees ?? []).filter(emp => {
    if (showMissingOnly && !emp.missingCnss) return false;
    if (searchEmp && !emp.nom.toLowerCase().includes(searchEmp.toLowerCase()) &&
        !emp.matricule.toLowerCase().includes(searchEmp.toLowerCase())) return false;
    return true;
  });

  const deadline = recap ? new Date(recap.deadline) : null;
  const isLate   = recap?.isLate ?? false;

  // ─── RENDER ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/30">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Déclaration CNSS
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Déclaration Nominative Mensuelle des Salaires — Congo Brazzaville
              </p>
            </div>
          </div>

          {/* Sélecteur mois/année */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={month}
                onChange={e => setMonth(Number(e.target.value))}
                className="pl-3 pr-8 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                {MONTHS.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={year}
                onChange={e => setYear(Number(e.target.value))}
                className="pl-3 pr-8 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                {[2023,2024,2025,2026].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            <button
              onClick={loadRecap}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Alerte retard */}
        {isLate && (
          <div className="mt-4 flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                ⚠️ Déclaration en retard — {recap?.totals.monthsLate} mois
              </p>
              <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">
                Date limite dépassée ({deadline?.toLocaleDateString('fr-FR')}). 
                Pénalité estimée : <strong>{fmt(recap?.totals.latePenalty ?? 0)}</strong> (10% / mois).
                Régularisez auprès de la CNSS dès que possible.
              </p>
            </div>
          </div>
        )}

        {/* Alerte N° CNSS manquants */}
        {(recap?.missingCnssCount ?? 0) > 0 && (
          <div className="mt-3 flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700 dark:text-amber-400">
              <strong>{recap?.missingCnssCount} employé(s)</strong> n'ont pas de numéro CNSS renseigné. 
              La déclaration sera incomplète. Mettez à jour leurs fiches avant l'export.
            </p>
          </div>
        )}
      </div>

      {/* ── Onglets ──────────────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-6 p-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 w-fit">
        {[
          { id: 'declaration', label: 'Déclaration', icon: FileText },
          { id: 'history',     label: 'Historique',  icon: Calendar },
          { id: 'taux',        label: 'Taux & Règles', icon: Info },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          ONG. DÉCLARATION
      ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'declaration' && (
        <div className="space-y-6">

          {/* Loader */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl text-red-600 dark:text-red-400">
              <XCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {recap && !loading && (
            <>
              {/* ── Stat cards ──────────────────────────────────────────── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  label="Effectif déclaré"
                  value={`${recap.totals.effectif} salariés`}
                  sub={`${MONTHS[month-1]} ${year}`}
                  icon={Users}
                  color="bg-blue-600"
                />
                <StatCard
                  label="Masse salariale"
                  value={fmt(recap.totals.masseSalariale)}
                  sub="Brut total"
                  icon={Banknote}
                  color="bg-indigo-600"
                />
                <StatCard
                  label="À verser → CNSS"
                  value={fmt(recap.totals.totalAVerserCnss)}
                  sub="Cotisations + TUS-CNSS"
                  icon={Shield}
                  color="bg-emerald-600"
                  alert={isLate}
                />
                <StatCard
                  label="À verser → DGI"
                  value={fmt(recap.totals.totalAVerserDgi)}
                  sub="TUS part DGI (2,013%)"
                  icon={Building2}
                  color="bg-violet-600"
                />
              </div>

              {/* ── Récap versement visuel ───────────────────────────────── */}
              <div className="grid md:grid-cols-2 gap-4">

                {/* Détail cotisations */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => setShowCnssDetail(!showCnssDetail)}
                      className="flex items-center justify-between w-full"
                    >
                      <h3 className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-blue-500" />
                        Détail des cotisations
                      </h3>
                      {showCnssDetail
                        ? <EyeOff className="w-4 h-4 text-slate-400" />
                        : <Eye className="w-4 h-4 text-slate-400" />
                      }
                    </button>
                  </div>

                  <div className="p-4 space-y-3">
                    {/* Part salariale */}
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Part salariale</p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Pension 4% (plaf. 1 200 000)</span>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{fmtShort(recap.totals.pensionSalarial)}</span>
                      </div>
                    </div>

                    <hr className="border-slate-100 dark:border-slate-800" />

                    {/* Part patronale */}
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Part patronale</p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Pension 8% (plaf. 1 200 000)</span>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{fmtShort(recap.totals.pensionPatronal)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Prestations familiales 10,03% (plaf. 600 000)</span>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{fmtShort(recap.totals.familyPatronal)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Accidents du travail 2,25% (plaf. 600 000)</span>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{fmtShort(recap.totals.accidentPatronal)}</span>
                      </div>
                    </div>

                    <hr className="border-slate-100 dark:border-slate-800" />

                    {/* Totaux */}
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-sm text-slate-800 dark:text-slate-200">Total CNSS global</span>
                      <span className="text-sm text-blue-600 dark:text-blue-400">{fmt(recap.totals.totalCnss)}</span>
                    </div>

                    {showCnssDetail && (
                      <div className="mt-2 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">TUS (Taxe Unique sur Salaires)</p>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600 dark:text-slate-400">TUS → CNSS (5,475%)</span>
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">{fmtShort(recap.totals.tusCnss)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600 dark:text-slate-400">TUS → DGI (2,025%)</span>
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">{fmtShort(recap.totals.tusDgi)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Récap paiement */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-emerald-500" />
                      Récapitulatif des versements
                    </h3>
                  </div>
                  <div className="p-4 space-y-4">

                    {/* Date limite */}
                    <div className={`flex items-center gap-3 p-3 rounded-xl ${
                      isLate
                        ? 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'
                        : 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800'
                    }`}>
                      <Clock className={`w-4 h-4 ${isLate ? 'text-red-500' : 'text-emerald-500'}`} />
                      <div>
                        <p className={`text-xs font-semibold ${isLate ? 'text-red-600 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                          {isLate ? '⚠️ Date limite dépassée' : '✅ Dans les délais'}
                        </p>
                        <p className={`text-xs ${isLate ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-500'}`}>
                          Dépôt au plus tard le {deadline?.toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>

                    {/* Versement CNSS */}
                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-800/50">
                      <div>
                        <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide">→ CNSS</p>
                        <p className="text-xs text-blue-600 dark:text-blue-500">Cotisations + TUS-CNSS</p>
                      </div>
                      <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{fmt(recap.totals.totalAVerserCnss)}</p>
                    </div>

                    {/* Versement DGI */}
                    <div className="flex items-center justify-between p-3 bg-violet-50 dark:bg-violet-950/30 rounded-xl border border-violet-100 dark:border-violet-800/50">
                      <div>
                        <p className="text-xs font-semibold text-violet-700 dark:text-violet-400 uppercase tracking-wide">→ DGI</p>
                        <p className="text-xs text-violet-600 dark:text-violet-500">TUS part Trésor</p>
                      </div>
                      <p className="text-lg font-bold text-violet-700 dark:text-violet-400">{fmt(recap.totals.totalAVerserDgi)}</p>
                    </div>

                    {/* Pénalité */}
                    {isLate && (
                      <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-800">
                        <div>
                          <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">⚠️ Pénalité retard</p>
                          <p className="text-xs text-red-500">{recap.totals.monthsLate} mois × 10%</p>
                        </div>
                        <p className="text-lg font-bold text-red-600 dark:text-red-400">{fmt(recap.totals.latePenalty)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Boutons d'export ─────────────────────────────────────── */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleExportXlsx}
                  disabled={exportingXlsx || recap.employees.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-500/30 transition-all"
                >
                  {exportingXlsx
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <FileSpreadsheet className="w-4 h-4" />
                  }
                  Export Excel DNMS (3 feuilles)
                </button>

                <button
                  onClick={handleExportCsv}
                  disabled={exportingCsv || recap.employees.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl shadow-sm transition-all"
                >
                  {exportingCsv
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Download className="w-4 h-4" />
                  }
                  Export CSV (e-déclaration)
                </button>

                {recap.employees.length > 0 && (
                  <a
                    href="https://edeclaration.cnss.cg"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-emerald-500/30 transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                    Portail e-Déclaration CNSS
                  </a>
                )}
              </div>

              {/* ── Tableau employés ─────────────────────────────────────── */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 overflow-hidden shadow-sm">
                {/* Barre de recherche */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    Détail par salarié ({filteredEmployees.length})
                  </h3>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Rechercher un salarié…"
                      value={searchEmp}
                      onChange={e => setSearchEmp(e.target.value)}
                      className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-48"
                    />
                    {recap.missingCnssCount > 0 && (
                      <button
                        onClick={() => setShowMissingOnly(!showMissingOnly)}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                          showMissingOnly
                            ? 'bg-amber-500 border-amber-500 text-white'
                            : 'border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                        }`}
                      >
                        <AlertCircle className="w-3 h-3" />
                        N° CNSS manquants ({recap.missingCnssCount})
                      </button>
                    )}
                  </div>
                </div>

                {/* Table */}
                {recap.employees.length === 0 ? (
                  <div className="text-center py-16">
                    <FileText className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Aucun bulletin validé pour {MONTHS[month-1]} {year}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Générez et validez les bulletins de paie pour ce mois d'abord.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                          {['Matricule','N° CNSS','Nom & Prénom','Poste','Brut','Sal. 4%','Pat. Pension','Pat. Famille','Pat. AT','Total CNSS'].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEmployees.map((emp, idx) => (
                          <tr
                            key={emp.employeeId}
                            className={`border-b border-slate-50 dark:border-slate-800/50 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30 ${
                              emp.missingCnss ? 'bg-amber-50/50 dark:bg-amber-950/10' : ''
                            }`}
                          >
                            <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">{emp.matricule}</td>
                            <td className="px-4 py-3">
                              {emp.cnssNumber ? (
                                <span className="font-mono text-xs text-slate-700 dark:text-slate-300">{emp.cnssNumber}</span>
                              ) : (
                                <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-semibold">
                                  <AlertCircle className="w-3 h-3" /> Manquant
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-white whitespace-nowrap">{emp.nom}</td>
                            <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{emp.poste}</td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-white whitespace-nowrap">{fmtShort(emp.brutMensuel)}</td>
                            <td className="px-4 py-3 text-right text-blue-600 dark:text-blue-400 whitespace-nowrap">{fmtShort(emp.pensionSalarial)}</td>
                            <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400 whitespace-nowrap">{fmtShort(emp.pensionPatronal)}</td>
                            <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400 whitespace-nowrap">{fmtShort(emp.familyPatronal)}</td>
                            <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400 whitespace-nowrap">{fmtShort(emp.accidentPatronal)}</td>
                            <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{fmtShort(emp.totalGlobal)}</td>
                          </tr>
                        ))}
                      </tbody>
                      {/* Ligne totaux */}
                      <tfoot>
                        <tr className="bg-slate-900 dark:bg-slate-950 border-t-2 border-slate-700">
                          <td colSpan={4} className="px-4 py-3 font-bold text-white text-xs uppercase tracking-wider">
                            TOTAL — {recap.totals.effectif} salarié(s)
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-white whitespace-nowrap">{fmtShort(recap.totals.masseSalariale)}</td>
                          <td className="px-4 py-3 text-right font-bold text-blue-300 whitespace-nowrap">{fmtShort(recap.totals.pensionSalarial)}</td>
                          <td className="px-4 py-3 text-right font-bold text-slate-300 whitespace-nowrap">{fmtShort(recap.totals.pensionPatronal)}</td>
                          <td className="px-4 py-3 text-right font-bold text-slate-300 whitespace-nowrap">{fmtShort(recap.totals.familyPatronal)}</td>
                          <td className="px-4 py-3 text-right font-bold text-slate-300 whitespace-nowrap">{fmtShort(recap.totals.accidentPatronal)}</td>
                          <td className="px-4 py-3 text-right font-bold text-emerald-400 whitespace-nowrap">{fmtShort(recap.totals.totalCnss)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          ONG. HISTORIQUE
      ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 dark:text-white">
              Suivi déclarations {year}
            </h2>
            {histLoading && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
          </div>

          {/* Vue grille 12 mois */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {MONTHS.map((label, idx) => {
              const item = history.find(h => h.month === idx + 1);
              const status = item?.status ?? 'À VENIR';
              const isCurrentMonth = idx + 1 === month;

              const borderColor = {
                'DÉCLARÉ':    'border-emerald-300 dark:border-emerald-700',
                'EN RETARD':  'border-red-300 dark:border-red-700',
                'À DÉCLARER': 'border-amber-300 dark:border-amber-700',
                'À VENIR':    'border-slate-200 dark:border-slate-700',
              }[status];

              const bg = {
                'DÉCLARÉ':    'bg-emerald-50 dark:bg-emerald-950/30',
                'EN RETARD':  'bg-red-50 dark:bg-red-950/30',
                'À DÉCLARER': 'bg-amber-50 dark:bg-amber-950/30',
                'À VENIR':    'bg-white dark:bg-slate-900',
              }[status];

              return (
                <button
                  key={idx}
                  onClick={() => { setMonth(idx + 1); setActiveTab('declaration'); }}
                  className={`p-3 rounded-xl border transition-all text-left hover:shadow-md ${borderColor} ${bg} ${
                    isCurrentMonth ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-950' : ''
                  }`}
                >
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">{label}</p>
                  <Badge status={status} />
                  {item && item.payrollCount > 0 && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {item.payrollCount} bulletins
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          {/* Légende */}
          <div className="flex flex-wrap gap-3 pt-2">
            {[
              { label: 'Déclaré', color: 'bg-emerald-500' },
              { label: 'En retard', color: 'bg-red-500' },
              { label: 'À déclarer', color: 'bg-amber-500' },
              { label: 'À venir', color: 'bg-slate-400' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <div className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
                {l.label}
              </div>
            ))}
          </div>

          {/* Rappel procédure */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl">
            <p className="text-xs text-blue-700 dark:text-blue-400 font-semibold mb-1">
              📅 Rappel procédure CNSS Congo
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-500">
              La déclaration doit être déposée <strong>avant le 15 du mois suivant</strong>.
              Le paiement peut se faire par virement bancaire, chèque ou au guichet CNSS.
              Tout retard entraîne une <strong>majoration de 10% par mois</strong>.
              Télédéclaration disponible sur <strong>edeclaration.cnss.cg</strong>.
            </p>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          ONG. TAUX & RÈGLES
      ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'taux' && (
        <div className="space-y-5 max-w-3xl">

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 overflow-hidden shadow-sm">
            <div className="p-4 bg-blue-600 text-white">
              <h3 className="font-bold text-base">Taux de cotisations CNSS — Congo Brazzaville</h3>
              <p className="text-xs text-blue-200 mt-1">Source officielle : cnss.cg — En vigueur</p>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Branche</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Part salarié</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Part employeur</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Plafond/mois</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { branche: 'Assurance Pensions (Retraite / Invalidité / Décès)', sal: '4%', pat: '8%', plaf: '1 200 000 FCFA' },
                  { branche: 'Prestations Familiales (dont maternité)', sal: '—', pat: '10,03%', plaf: '600 000 FCFA' },
                  { branche: 'Accidents du Travail & Maladies Professionnelles', sal: '—', pat: '2,25%', plaf: '600 000 FCFA' },
                ].map((row, i) => (
                  <tr key={i} className={`border-b border-slate-50 dark:border-slate-800 ${i%2===0?'bg-white dark:bg-slate-900':'bg-slate-50/50 dark:bg-slate-800/20'}`}>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{row.branche}</td>
                    <td className="px-4 py-3 text-center font-bold text-blue-600 dark:text-blue-400">{row.sal}</td>
                    <td className="px-4 py-3 text-center font-bold text-emerald-600 dark:text-emerald-400">{row.pat}</td>
                    <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400 font-mono text-xs">{row.plaf}</td>
                  </tr>
                ))}
                <tr className="bg-slate-900 dark:bg-slate-950 border-t-2 border-slate-700">
                  <td className="px-4 py-3 font-bold text-white">TOTAL CNSS</td>
                  <td className="px-4 py-3 text-center font-bold text-blue-300">4%</td>
                  <td className="px-4 py-3 text-center font-bold text-emerald-300">20,28%</td>
                  <td className="px-4 py-3 text-right text-slate-400 text-xs">—</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* TUS */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 overflow-hidden shadow-sm">
            <div className="p-4 bg-violet-600 text-white">
              <h3 className="font-bold text-base">Taxe Unique sur les Salaires (TUS) — 7,5%</h3>
              <p className="text-xs text-violet-200 mt-1">100% à la charge de l'employeur — Aucun plafond</p>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {[
                  { dest: 'Part CNSS', taux: '5,475%', desc: 'Versée à la CNSS avec les cotisations' },
                  { dest: 'Part DGI (Trésor)', taux: '2,025%', desc: 'Versée séparément à la Direction Générale des Impôts' },
                ].map((row, i) => (
                  <tr key={i} className={`border-b border-slate-50 dark:border-slate-800 ${i%2===0?'bg-white dark:bg-slate-900':'bg-slate-50/50 dark:bg-slate-800/20'}`}>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{row.dest}</td>
                    <td className="px-4 py-3 text-center font-bold text-violet-600 dark:text-violet-400">{row.taux}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{row.desc}</td>
                  </tr>
                ))}
                <tr className="bg-slate-900 dark:bg-slate-950 border-t-2 border-slate-700">
                  <td className="px-4 py-3 font-bold text-white">TOTAL TUS</td>
                  <td className="px-4 py-3 text-center font-bold text-violet-300">7,5%</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">Base = Salaire brut total (sans plafond)</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Règles clés */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 p-4 shadow-sm">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-500" />
              Règles essentielles CNSS Congo
            </h3>
            <div className="space-y-3">
              {[
                { icon: '📅', title: 'Délai de déclaration', text: 'La déclaration et le paiement doivent être effectués avant le 15 du mois suivant la paie.' },
                { icon: '⚠️', title: 'Pénalité de retard', text: 'Tout retard entraîne une majoration de 10% par mois (art. Loi 004/86 du 25/02/1986). Régularisation possible dans les 5 jours après le délai limite.' },
                { icon: '🔢', title: 'N° CNSS obligatoire', text: 'Chaque salarié doit être immatriculé à la CNSS. Le N° CNSS est obligatoire dans la déclaration nominative.' },
                { icon: '💰', title: 'Assiette de cotisation', text: 'Toutes les rémunérations (salaire de base + primes + heures supplémentaires). Minimum = SMIG. La base CNSS pension est plafonnée à 1 200 000 FCFA.' },
                { icon: '🌐', title: 'Télédéclaration', text: 'Depuis 2022, la CNSS propose la déclaration en ligne sur edeclaration.cnss.cg. Le CSV exporté depuis cette application est compatible.' },
                { icon: '👷', title: 'Stagiaires', text: 'Les employeurs utilisant des stagiaires doivent cotiser pour les accidents du travail (2,25% de la rémunération).' },
              ].map((rule, i) => (
                <div key={i} className="flex gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  <span className="text-lg">{rule.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{rule.title}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{rule.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}