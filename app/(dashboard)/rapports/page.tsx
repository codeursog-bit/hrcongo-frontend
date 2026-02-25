'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, TrendingUp, TrendingDown, Users, Wallet, Building2,
  Clock, Calendar, AlertCircle, CheckCircle, Download, Printer,
  DollarSign, Shield, FileBarChart, Award, Loader2,
  ArrowUpRight, ArrowDownRight, Info, Zap, FileSpreadsheet, FileText
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { api } from '@/services/api';

const COLORS = {
  primary: '#0EA5E9', success: '#10B981',
  warning: '#F59E0B', danger: '#EF4444',
  purple: '#8B5CF6', indigo: '#6366F1'
};
const CHART_COLORS = ['#0EA5E9', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1'];

// ─── Navigation commune ──────────────────────────────────────────────────────
const NAV_ITEMS = [
  { href: '/rapports',              label: "Vue d'ensemble",  icon: '📊' },
  { href: '/rapports/complet',      label: 'Rapport Complet', icon: '📋', active: true },
  { href: '/rapports/analyse-paie', label: 'Paie & Coûts',    icon: '💰' },
  { href: '/rapports/effectifs',    label: 'Effectifs',        icon: '👥' },
  { href: '/rapports/analyse-conges', label: 'Congés',         icon: '🏖️' },
  { href: '/rapports/comptabilite', label: 'Comptabilité',     icon: '📒' },
];

function ReportNav({ active }: { active: string }) {
  const router = useRouter();
  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.href}
          onClick={() => router.push(item.href)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all
            ${item.href === active
              ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30'
              : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-sky-300'
            }`}
        >
          <span>{item.icon}</span>
          <span className="hidden sm:inline">{item.label}</span>
        </button>
      ))}
    </div>
  );
}

export default function CompleteHRReport() {
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear  = now.getFullYear();

  const [isLoading,      setIsLoading]      = useState(true);
  const [isExporting,    setIsExporting]    = useState(false);
  const [payrollData,    setPayrollData]    = useState<any>(null);
  const [departmentData, setDepartmentData] = useState<any>(null);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [topEmployees,   setTopEmployees]   = useState<any>(null);
  const [overtimeData,   setOvertimeData]   = useState<any>(null);
  const [leavesData,     setLeavesData]     = useState<any>(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [payroll, depts, comp, top, ot, leaves] = await Promise.all([
          api.get('/reports/payroll'),
          api.get('/reports/departments'),
          api.get(`/reports/comparison?month=${currentMonth}&year=${currentYear}`),
          api.get('/reports/top-employees'),
          api.get(`/reports/overtime?month=${currentMonth}&year=${currentYear}`),
          api.get('/reports/leaves'),
        ]);
        setPayrollData(payroll);
        setDepartmentData(depts);
        setComparisonData(comp);
        setTopEmployees(top);
        setOvertimeData(ot);
        setLeavesData(leaves);
      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
    };
    fetchAll();
  }, []);

  const fmt = (val: number) => val ? val.toLocaleString('fr-FR') + ' FCFA' : '0 FCFA';
  const fmtPct = (val: number) => { const s = val > 0 ? '+' : ''; return `${s}${(val || 0).toFixed(1)}%`; };
  const safeNum = (val: any, d = 2) => Number(val || 0).toFixed(d);

  // ── Export Excel ──────────────────────────────────────────────────────
  const handleExcelExport = async () => {
    setIsExporting(true);
    try {
      const blob = await api.getBlob(
        `/payrolls/export/excel?month=${currentMonth}&year=${currentYear}`
      );
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href    = url;
      a.download = `paie_${currentMonth}_${currentYear}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { alert('Erreur export Excel'); }
    finally { setIsExporting(false); }
  };

  // ── Imprimer ─────────────────────────────────────────────────────────
  const handlePrint = () => window.print();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="animate-spin text-sky-500" size={48} />
        <p className="text-gray-500">Génération du rapport...</p>
      </div>
    );
  }

  const variations = comparisonData?.variations || {};
  const isGrossUp  = (variations.grossPercent || 0) > 0;
  const isCountUp  = (variations.countDiff || 0) > 0;

  return (
    <div ref={printRef} className="max-w-[1800px] mx-auto pb-20 space-y-8 px-4 print:px-0">

      {/* ── HEADER ────────────────────────────────────────────────────── */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 print:hidden">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/rapports')}
            className="p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-500" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Rapport RH Complet</h1>
            <p className="text-gray-500 dark:text-gray-400">
              {now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExcelExport}
            disabled={isExporting}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
          >
            {isExporting ? <Loader2 size={18} className="animate-spin" /> : <FileSpreadsheet size={18} />}
            Export Excel
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-white font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <Printer size={18} /> Imprimer
          </button>
        </div>
      </div>

      {/* ── NAV ────────────────────────────────────────────────────────── */}
      <div className="print:hidden">
        <ReportNav active="/rapports/complet" />
      </div>

      {/* ── S1 : COMPARAISON MOIS ──────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-sky-500 to-blue-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-1">📊 Évolution vs Mois Précédent</h2>
            <p className="text-sky-100 text-sm">
              {now.toLocaleDateString('fr-FR', { month: 'long' })} vs{' '}
              {comparisonData?.previous
                ? new Date(comparisonData.previous.year, comparisonData.previous.month - 1)
                    .toLocaleDateString('fr-FR', { month: 'long' })
                : 'mois précédent'}
            </p>
          </div>
          <div className={`flex items-center gap-2 text-4xl font-bold ${isGrossUp ? 'text-white' : 'text-red-200'}`}>
            {isGrossUp ? <ArrowUpRight size={32} /> : <ArrowDownRight size={32} />}
            {fmtPct(variations.grossPercent)}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Masse Salariale Brute', val: comparisonData?.current?.gross, pct: variations.grossPercent, up: isGrossUp },
            { label: 'Salaire Net Total',      val: comparisonData?.current?.net,   pct: variations.netPercent,   up: (variations.netPercent || 0) > 0 },
            { label: 'Coût Employeur Total',   val: comparisonData?.current?.cost,  pct: variations.costPercent,  up: (variations.costPercent || 0) > 0, reverse: true },
            { label: 'Bulletins Générés',      val: null, count: comparisonData?.current?.count, diff: variations.countDiff },
          ].map((item, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-sky-100 text-xs uppercase font-bold mb-2">{item.label}</p>
              <p className="text-2xl font-bold">
                {item.count != null ? item.count : fmt(item.val || 0)}
              </p>
              <div className={`flex items-center gap-1 text-sm font-bold mt-2
                ${item.diff != null
                  ? (item.diff > 0 ? 'text-emerald-200' : 'text-red-200')
                  : (item.reverse
                    ? (item.up ? 'text-red-200' : 'text-emerald-200')
                    : (item.up ? 'text-emerald-200' : 'text-red-200'))
                }`}>
                {item.diff != null
                  ? `${item.diff > 0 ? '+' : ''}${item.diff} emp.`
                  : fmtPct(item.pct || 0)
                }
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-white/10 rounded-xl p-4 border border-white/20">
          <div className="flex items-start gap-3">
            <Info size={18} className="text-white mt-0.5 shrink-0" />
            <p className="text-sm text-sky-50 leading-relaxed">
              <strong>Interprétation :</strong>{' '}
              {isGrossUp
                ? `La masse salariale a augmenté de ${fmtPct(variations.grossPercent)}, ${
                    (variations.countDiff || 0) > 0
                      ? `lié à l'embauche de ${variations.countDiff} nouvel(le)(s) employé(e)(s)`
                      : `probablement dû à une hausse des heures supplémentaires ou primes`
                  }.`
                : `La masse salariale a diminué de ${fmtPct(Math.abs(variations.grossPercent || 0))}, ${
                    (variations.countDiff || 0) < 0
                      ? `suite à ${Math.abs(variations.countDiff || 0)} départ(s)`
                      : `moins d'heures supplémentaires ou absences non payées`
                  }.`}
            </p>
          </div>
        </div>
      </div>

      {/* ── S2 : ANALYSE DÉPARTEMENTS ─────────────────────────────────── */}
      {Array.isArray(departmentData) && departmentData.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Building2 size={24} className="text-sky-500" />
            Analyse Détaillée par Département
          </h2>

          {departmentData.map((dept: any, idx: number) => {
            const totalCost = departmentData.reduce((s: number, d: any) => s + d.totalEmployerCost, 0);
            const pct       = totalCost > 0 ? (dept.totalEmployerCost / totalCost) * 100 : 0;

            return (
              <div key={dept.id} className="mb-4 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-bold"
                    style={{ backgroundColor: dept.color || CHART_COLORS[idx % CHART_COLORS.length] }}
                  >
                    {dept.name[0]}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{dept.name}</h3>
                    <p className="text-sm text-gray-500">
                      {dept.headcount} employé(s) · Salaire moyen : {fmt(dept.avgSalary)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    { label: 'Masse Brute',    val: dept.totalGross,        color: 'text-gray-900 dark:text-white' },
                    { label: 'Net Total',       val: dept.totalNet,          color: 'text-emerald-600' },
                    { label: 'CNSS Patronale',  val: dept.totalCNSS,         color: 'text-orange-600' },
                    { label: 'ITS Collecté',    val: dept.totalITS,          color: 'text-purple-600' },
                    { label: 'Heures Sup',      val: null, unit: `${dept.totalOvertime || 0}h`, color: 'text-indigo-600' },
                    { label: 'Congés',          val: null, unit: `${dept.totalLeaves || 0} dem.`, color: 'text-sky-600' },
                  ].map((item, i) => (
                    <div key={i} className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-3">
                      <p className="text-xs text-gray-500 font-bold uppercase mb-1">{item.label}</p>
                      <p className={`text-base font-bold ${item.color}`}>
                        {item.val != null ? fmt(item.val) : item.unit}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Coût Total Employeur</span>
                    <span className="font-bold text-gray-900 dark:text-white">{fmt(dept.totalEmployerCost)}</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-sky-500 to-blue-600 transition-all duration-500"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{pct.toFixed(1)}% du coût total</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── S3 : HEURES SUPPLÉMENTAIRES — 4 catégories Décret 78-360 ─── */}
      {overtimeData?.byEmployee?.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock size={24} className="text-indigo-500" />
                Heures Supplémentaires
              </h2>
              <p className="text-gray-500 text-sm">
                {overtimeData.summary?.totalHours}h totales · {overtimeData.summary?.totalAmount}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Employés concernés</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {overtimeData.summary?.employeesWithOvertime}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500 font-semibold">
                <tr>
                  <th className="px-4 py-3 text-left">Employé</th>
                  <th className="px-4 py-3 text-left">Département</th>
                  {/* ✅ DÉCRET 78-360 — 4 catégories correctes */}
                  <th className="px-4 py-3 text-right text-blue-600">HS +10%</th>
                  <th className="px-4 py-3 text-right text-sky-600">HS +25%</th>
                  <th className="px-4 py-3 text-right text-amber-600">HS +50%</th>
                  <th className="px-4 py-3 text-right text-red-600">HS +100%</th>
                  <th className="px-4 py-3 text-right font-bold">Total H</th>
                  <th className="px-4 py-3 text-right font-bold">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {overtimeData.byEmployee.map((emp: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{emp.name}</td>
                    <td className="px-4 py-3 text-gray-500">{emp.department}</td>
                    {/* ✅ Champs corrigés : overtime10/25/50/100 */}
                    <td className="px-4 py-3 text-right font-mono text-blue-700">{safeNum(emp.overtime10)}h</td>
                    <td className="px-4 py-3 text-right font-mono text-sky-700">{safeNum(emp.overtime25)}h</td>
                    <td className="px-4 py-3 text-right font-mono text-amber-700">{safeNum(emp.overtime50)}h</td>
                    <td className="px-4 py-3 text-right font-mono text-red-700">{safeNum(emp.overtime100)}h</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-indigo-600">{safeNum(emp.totalOvertime)}h</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">{fmt(emp.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 dark:bg-gray-900/50 font-bold text-sm border-t-2 border-gray-200">
                <tr>
                  <td colSpan={6} className="px-4 py-3 text-right text-gray-500 uppercase text-xs">Totaux</td>
                  <td className="px-4 py-3 text-right text-indigo-600 font-mono">
                    {safeNum(overtimeData.byEmployee.reduce((s: number, e: any) => s + Number(e.totalOvertime || 0), 0))}h
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                    {fmt(overtimeData.byEmployee.reduce((s: number, e: any) => s + Number(e.amount || 0), 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 border border-indigo-200 dark:border-indigo-800">
            <div className="flex items-start gap-3">
              <Zap size={18} className="text-indigo-600 mt-0.5 shrink-0" />
              <p className="text-sm text-indigo-900 dark:text-indigo-100 leading-relaxed">
                <strong>Décret 78-360 :</strong> HS +10% (jours ouvrés) · HS +25% (dimanches/nuits) ·
                HS +50% (fériés diurnes) · HS +100% (fériés nuit). Total :{' '}
                <strong>{overtimeData.summary?.totalAmount}</strong>
                {Number(overtimeData.summary?.totalHours || 0) > 50
                  ? ' — Volume élevé, envisagez d\'analyser la charge de travail.'
                  : ' — Volume dans la normale.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── S4 : TOP EMPLOYÉS ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top HS */}
        {topEmployees?.topOvertime?.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <Award size={20} className="text-amber-500" />
              Top 10 Heures Supplémentaires
            </h3>
            <div className="space-y-2">
              {topEmployees.topOvertime.slice(0, 10).map((emp: any, idx: number) => (
                <div key={emp.id || idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{emp.name}</p>
                      <p className="text-xs text-gray-500">{emp.department}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-indigo-600">{safeNum(emp.totalOvertime)}h</p>
                    <p className="text-xs text-gray-500">{fmt(emp.overtimeAmount)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Congés */}
        {topEmployees?.topLeaves?.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <Calendar size={20} className="text-emerald-500" />
              Top 10 Congés Pris
            </h3>
            <div className="space-y-2">
              {topEmployees.topLeaves.slice(0, 10).map((emp: any, idx: number) => (
                <div key={emp.id || idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{emp.name}</p>
                      <p className="text-xs text-gray-500">{emp.department}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-600">{safeNum(emp.leavesDays, 1)} j</p>
                    <p className="text-xs text-gray-500">{emp.leavesCount} dem.</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── S5 : TENDANCE 6 MOIS ──────────────────────────────────────── */}
      {payrollData?.trend?.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <TrendingUp size={22} className="text-sky-500" />
            Évolution sur 6 Mois (millions FCFA)
          </h2>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={payrollData.trend}>
                <defs>
                  <linearGradient id="gBrut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={COLORS.primary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gNet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={COLORS.success} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.success} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', color: '#fff', borderRadius: '12px', border: 'none', padding: '12px' }} />
                <Legend iconType="circle" />
                <Area type="monotone" name="Brut" dataKey="brut" stroke={COLORS.primary} fill="url(#gBrut)" strokeWidth={3} />
                <Area type="monotone" name="Net"  dataKey="net"  stroke={COLORS.success} fill="url(#gNet)"  strokeWidth={3} />
                <Area type="monotone" name="Charges" dataKey="charges" stroke={COLORS.warning} fillOpacity={0} strokeWidth={2} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── S6 : CONGÉS ───────────────────────────────────────────────── */}
      {leavesData?.distribution?.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-emerald-500" />
              Répartition des Congés
            </h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={leavesData.distribution} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" label={e => `${e.name}: ${e.value}`}>
                    {leavesData.distribution.map((_: any, i: number) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip /><Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Statistiques Congés</h3>
            <div className="space-y-3">
              {leavesData.kpi?.map((kpi: any, idx: number) => (
                <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">{kpi.label}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpi.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── S7 : RÉSUMÉ EXÉCUTIF ──────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 text-white shadow-xl">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <FileBarChart size={24} /> Résumé Exécutif
        </h2>

        {payrollData?.summary?.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {payrollData.summary.map((m: any, idx: number) => (
              <div key={idx} className="bg-white/10 rounded-xl p-4">
                <p className="text-white/60 text-xs uppercase font-bold mb-1">{m.label}</p>
                <p className="text-xl font-bold">{m.value}</p>
                <p className="text-white/40 text-xs mt-1">{m.currency}{m.sub && ` · ${m.sub}`}</p>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white/10 rounded-xl p-6 border border-white/20">
          <h3 className="font-bold text-lg mb-4">🎯 Points Clés</h3>
          <ul className="space-y-3 text-sm text-white/90">
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="text-emerald-400 mt-0.5 shrink-0" />
              Masse salariale : <strong>{fmt(comparisonData?.current?.gross)}</strong>{' '}
              ({isGrossUp ? '↑ hausse' : '↓ baisse'} vs mois précédent)
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="text-emerald-400 mt-0.5 shrink-0" />
              {overtimeData?.summary?.employeesWithOvertime || 0} employés avec HS — total{' '}
              <strong>{overtimeData?.summary?.totalAmount || '0 FCFA'}</strong>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="text-emerald-400 mt-0.5 shrink-0" />
              {leavesData?.kpi?.[0]?.value || 0} demandes de congés ce mois
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="text-emerald-400 mt-0.5 shrink-0" />
              Dép. le plus coûteux :{' '}
              <strong>
                {Array.isArray(departmentData) && departmentData.length > 0
                  ? departmentData.reduce((mx: any, d: any) =>
                      d.totalEmployerCost > mx.totalEmployerCost ? d : mx,
                      { name: 'N/A', totalEmployerCost: 0 }
                    ).name
                  : 'N/A'}
              </strong>
            </li>
            {(variations.grossPercent || 0) < -5 && (
              <li className="flex items-start gap-2">
                <AlertCircle size={16} className="text-amber-400 mt-0.5 shrink-0" />
                <span className="text-amber-200">
                  <strong>Alerte :</strong> Baisse {fmtPct(Math.abs(variations.grossPercent || 0))} — vérifiez absences ou départs.
                </span>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-gray-400 text-sm py-4">
        Rapport généré le {new Date().toLocaleDateString('fr-FR', { dateStyle: 'full' })} · HRCongo · Confidentiel
      </div>
    </div>
  );
}