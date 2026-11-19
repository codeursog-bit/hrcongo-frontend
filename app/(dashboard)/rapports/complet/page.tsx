'use client';
import { ReportContents } from '@/components/reports/ReportContents';
import { chartTheme } from '@/lib/chart-theme';


import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, TrendingUp, TrendingDown, Users, Wallet, Building2,
  Clock, Calendar, AlertCircle, CheckCircle, Download, Printer,
  DollarSign, Shield, FileBarChart, Award, Target, ArrowUpRight, ArrowDownRight, Info, Zap, ClipboardList, LayoutDashboard,UsersRound,
  UmbrellaOff,BookOpen,UserCircle,BarChart3

} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import RapportsSubNav from '@/components/RapportsSubNav';
import YearlyEvolutionPanel from '@/components/YearlyEvolutionPanel';
import PeriodSelector, { PeriodValue } from '@/components/PeriodSelector';
import { KonzaLoader } from '@/components/ui/KonzaLoader';
import { ReportsFrame as ModulePageFrame } from '@/components/reports/ReportsFrame';
const COLORS = {
  primary: 'var(--green)',
  success: 'var(--green)',
  warning: 'var(--mustard)',
  danger: 'var(--danger)',
  purple: 'var(--green)',
  indigo: 'var(--text-secondary)'
};

const CHART_COLORS = chartTheme.series;

function CompleteHRReport() {
  const router = useRouter();
  const { bp } = useBasePath();
  const now = new Date();

  // ✅ Sélecteur de période — mode "Mensuel" uniquement ici (données
  // affichées par mois). /reports/comparison, /reports/overtime,
  // /reports/payroll et /reports/departments suivent tous maintenant le
  // mois/année choisis. /reports/top-employees et /reports/leaves restent
  // à part (pas utilisés sur cette page).
  const [period, setPeriod] = useState<PeriodValue>({
    mode: 'MOIS',
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });
  const currentMonth = period.month;
  const currentYear = period.year;

  const [isLoading, setIsLoading] = useState(true);
  const [payrollData, setPayrollData] = useState<any>(null);
  const [departmentData, setDepartmentData] = useState<any>(null);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [topEmployeesData, setTopEmployeesData] = useState<any>(null);
  const [overtimeData, setOvertimeData] = useState<any>(null);
  const [leavesData, setLeavesData] = useState<any>(null);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [payroll, departments, comparison, topEmployees, overtime, leaves] = await Promise.all([
          api.get(`/reports/payroll?month=${currentMonth}&year=${currentYear}`),
          api.get(`/reports/departments?month=${currentMonth}&year=${currentYear}`),
          api.get(`/reports/comparison?month=${currentMonth}&year=${currentYear}`),
          api.get('/reports/top-employees'),
          api.get(`/reports/overtime?month=${currentMonth}&year=${currentYear}`),
          api.get('/reports/leaves')
        ]);

        setPayrollData(payroll);
        setDepartmentData(departments);
        setComparisonData(comparison);
        setTopEmployeesData(topEmployees);
        setOvertimeData(overtime);
        setLeavesData(leaves);
      } catch (error) {
        console.error('Erreur chargement rapports:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [currentMonth, currentYear]);

  const formatCurrency = (val: number) => {
    if (!val) return '0 FCFA';
    return val.toLocaleString('fr-FR') + ' FCFA';
  };

  const formatPercent = (val: number) => {
    if (!val && val !== 0) return '0%';
    const sign = val > 0 ? '+' : '';
    return `${sign}${val.toFixed(1)}%`;
  };

  const safeToFixed = (val: any, decimals: number = 2) => {
    if (!val && val !== 0) return '0.00';
    return Number(val).toFixed(decimals);
  };

  if (isLoading) {
    return (
      <KonzaLoader variant="page" label="Génération du rapport en cours…" />
    );
  }

  const variations = comparisonData?.variations || {};
  const isGrossUp = variations.grossPercent > 0;
  const isCountUp = variations.countDiff > 0;

  return (
    <div className="max-w-[1800px] mx-auto pb-20 space-y-8 px-4">

      {/* ========================================
          HEADER
      ======================================== */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 reports-header">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(bp('/rapports'))}
            className="p-2.5 bg-[var(--surface)] rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors"
          >
            <ArrowLeft strokeWidth={1.5} size={20} className="text-[var(--text-muted)]" />
          </button>
          <div>
            <h1 className="text-3xl font-semibold text-[var(--text)] tracking-tight">
              Rapport RH Complet
            </h1>
            <p className="text-[var(--text-muted)]">
              Période : {new Date(currentYear, currentMonth - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <PeriodSelector value={period} onChange={setPeriod} modes={['MOIS']} />


        </div>
      </div>

      {/* ✅ NAVIGATION RAPPORTS */}
      <RapportsSubNav active="/rapports/complet" />
      <ReportContents sections={[{"id":"report-section-1","label":"Évolution vs Mois Précédent"},{"id":"report-section-2","label":"Analyse Détaillée par Département"},{"id":"report-section-3","label":"Heures Supplémentaires Détaillées"},{"id":"report-section-4","label":"Top 10 Heures Supplémentaires"},{"id":"report-section-5","label":"Top 10 Congés Pris"},{"id":"report-section-6","label":"Évolution sur 6 Mois"},{"id":"report-section-7","label":"Répartition des Congés par Type"},{"id":"report-section-8","label":"Statistiques Congés"},{"id":"report-section-9","label":"Résumé Exécutif"}]} />

      {/* ========================================
          SECTION 1 : COMPARAISON AVEC MOIS PRÉCÉDENT
      ======================================== */}
      <div className="bg-[var(--surface)] rounded-2xl p-8 text-[var(--text)] shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 id="report-section-1" tabIndex={-1} className="text-2xl font-semibold mb-2"> Évolution vs Mois Précédent</h2>
            <p className="text-[var(--text)]">
              Comparaison {now.toLocaleDateString('fr-FR', { month: 'long' })} vs {comparisonData?.previous ? new Date(comparisonData.previous.year, comparisonData.previous.month - 1).toLocaleDateString('fr-FR', { month: 'long' }) : 'mois précédent'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[var(--text)] text-sm">Variation Globale</p>
            <div className={`text-4xl font-semibold flex items-center gap-2 ${isGrossUp ? 'text-[var(--text)]' : 'text-[var(--danger-text)]'}`}>
              {isGrossUp ? <ArrowUpRight strokeWidth={1.5} size={32} /> : <ArrowDownRight strokeWidth={1.5} size={32} />}
              {formatPercent(variations.grossPercent)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-[color-mix(in_srgb,var(--surface)_10%,transparent)] rounded-xl p-4">
            <p className="text-[var(--text)] text-xs  font-semibold mb-2">Masse Salariale Brute</p>
            <p className="text-2xl font-semibold">{formatCurrency(comparisonData?.current?.gross)}</p>
            <div className={`flex items-center gap-1 text-sm font-semibold mt-2 ${isGrossUp ? 'text-[var(--action)]' : 'text-[var(--danger-text)]'}`}>
              {isGrossUp ? <TrendingUp strokeWidth={1.5} size={16} /> : <TrendingDown strokeWidth={1.5} size={16} />}
              {formatPercent(variations.grossPercent)}
            </div>
          </div>

          <div className="bg-[color-mix(in_srgb,var(--surface)_10%,transparent)] rounded-xl p-4">
            <p className="text-[var(--text)] text-xs  font-semibold mb-2">Salaire Net Total</p>
            <p className="text-2xl font-semibold">{formatCurrency(comparisonData?.current?.net)}</p>
            <div className={`flex items-center gap-1 text-sm font-semibold mt-2 ${variations.netPercent > 0 ? 'text-[var(--action)]' : 'text-[var(--danger-text)]'}`}>
              {variations.netPercent > 0 ? <TrendingUp strokeWidth={1.5} size={16} /> : <TrendingDown strokeWidth={1.5} size={16} />}
              {formatPercent(variations.netPercent)}
            </div>
          </div>

          <div className="bg-[color-mix(in_srgb,var(--surface)_10%,transparent)] rounded-xl p-4">
            <p className="text-[var(--text)] text-xs  font-semibold mb-2">Coût Employeur Total</p>
            <p className="text-2xl font-semibold">{formatCurrency(comparisonData?.current?.cost)}</p>
            <div className={`flex items-center gap-1 text-sm font-semibold mt-2 ${variations.costPercent > 0 ? 'text-[var(--danger-text)]' : 'text-[var(--action)]'}`}>
              {variations.costPercent > 0 ? <TrendingUp strokeWidth={1.5} size={16} /> : <TrendingDown strokeWidth={1.5} size={16} />}
              {formatPercent(variations.costPercent)}
            </div>
          </div>

          <div className="bg-[color-mix(in_srgb,var(--surface)_10%,transparent)] rounded-xl p-4">
            <p className="text-[var(--text)] text-xs  font-semibold mb-2">Bulletins Générés</p>
            <p className="text-2xl font-semibold">{comparisonData?.current?.count || 0}</p>
            <div className={`flex items-center gap-1 text-sm font-semibold mt-2 ${isCountUp ? 'text-[var(--action)]' : 'text-[var(--danger-text)]'}`}>
              {isCountUp ? <TrendingUp strokeWidth={1.5} size={16} /> : <TrendingDown strokeWidth={1.5} size={16} />}
              {isCountUp ? '+' : ''}{variations.countDiff} employé(s)
            </div>
          </div>
        </div>

        {/* Explication automatique */}
        <div className="mt-6 bg-[color-mix(in_srgb,var(--surface)_10%,transparent)] rounded-xl p-4 border border-[var(--border)]">
          <div className="flex items-start gap-3">
            <Info strokeWidth={1.5} size={20} className="text-[var(--text)] mt-0.5 flex-shrink-0" />
            <div className="text-sm text-[var(--text)] leading-relaxed">
              <strong>Interprétation :</strong> {
                isGrossUp
                  ? `La masse salariale a augmenté de ${formatPercent(variations.grossPercent)}, principalement dû à ${
                      variations.countDiff > 0
                        ? `l'embauche de ${variations.countDiff} nouvel(le)(s) employé(e)(s)`
                        : `une augmentation des heures supplémentaires ou primes`
                    }.`
                  : `La masse salariale a diminué de ${formatPercent(Math.abs(variations.grossPercent))}, possiblement en raison de ${
                      variations.countDiff < 0
                        ? `${Math.abs(variations.countDiff)} départ(s)`
                        : `moins d'heures supplémentaires ou d'absences non payées`
                    }.`
              }
            </div>
          </div>
        </div>
      </div>

      {/* ========================================
          SECTION 2 : ANALYSE PAR DÉPARTEMENT
      ======================================== */}
      {departmentData && departmentData.length > 0 && (
        <div>
          <h2 id="report-section-2" tabIndex={-1} className="text-2xl font-semibold text-[var(--text)] mb-6 flex items-center gap-2">
            <Building2 strokeWidth={1.5} size={24} className="text-[var(--brand)]" />
            Analyse Détaillée par Département
          </h2>

          <div className="grid grid-cols-1 gap-6">
            {departmentData.map((dept: any, idx: number) => (
              <div key={dept.id} className="bg-[var(--surface)] rounded-2xl p-6 border border-[var(--border)] shadow-sm hover:shadow-md transition-shadow reports-card">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-xl flex items-center justify-center text-[var(--text)] text-2xl font-semibold reports-metric-icon"
                      style={{ backgroundColor: dept.color || CHART_COLORS[idx % CHART_COLORS.length] }}
                    >
                      {dept.name[0]}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-[var(--text)]">{dept.name}</h3>
                      <p className="text-[var(--text-muted)]">
                        {dept.headcount} employé(s) · Salaire moyen : {formatCurrency(dept.avgSalary)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="bg-[var(--surface-2)]/50 rounded-xl p-4">
                    <p className="text-xs text-[var(--text-muted)] font-semibold  mb-1">Masse Salariale Brute</p>
                    <p className="text-lg font-semibold text-[var(--text)]">{formatCurrency(dept.totalGross)}</p>
                  </div>

                  <div className="bg-[var(--surface-2)]/50 rounded-xl p-4">
                    <p className="text-xs text-[var(--text-muted)] font-semibold  mb-1">Salaire Net Total</p>
                    <p className="text-lg font-semibold text-[var(--text)]">{formatCurrency(dept.totalNet)}</p>
                  </div>

                  <div className="bg-[var(--surface-2)]/50 rounded-xl p-4">
                    <p className="text-xs text-[var(--text-muted)] font-semibold  mb-1">CNSS Patronale</p>
                    <p className="text-lg font-semibold text-[var(--accent-2)]">{formatCurrency(dept.totalCNSS)}</p>
                  </div>

                  <div className="bg-[var(--surface-2)]/50 rounded-xl p-4">
                    <p className="text-xs text-[var(--text-muted)] font-semibold  mb-1">ITS Collecté</p>
                    <p className="text-lg font-semibold text-[var(--brand)]">{formatCurrency(dept.totalItsReel ?? dept.totalITS)}</p>
                    {(dept.totalBnc10 > 0 || dept.totalBnc20 > 0) && (
                      <p className="text-[11px] text-[var(--text-muted)] mt-1">
                        + BNC : {formatCurrency((dept.totalBnc10 || 0) + (dept.totalBnc20 || 0))}
                        {dept.totalBnc10 > 0 && ` (${formatCurrency(dept.totalBnc10)} à 10%)`}
                        {dept.totalBnc20 > 0 && ` (${formatCurrency(dept.totalBnc20)} à 20%)`}
                        {' — prestataires, jamais additionné à l\u2019ITS'}
                      </p>
                    )}
                  </div>

                  <div className="bg-[var(--surface-2)]/50 rounded-xl p-4">
                    <p className="text-xs text-[var(--text-muted)] font-semibold  mb-1">Heures Sup Total</p>
                    <p className="text-lg font-semibold text-[var(--accent-2)]">{dept.totalOvertime || 0}h</p>
                  </div>

                  <div className="bg-[var(--surface-2)]/50 rounded-xl p-4">
                    <p className="text-xs text-[var(--text-muted)] font-semibold  mb-1">Congés Validés</p>
                    <p className="text-lg font-semibold text-[var(--action)]">{dept.totalLeaves || 0}</p>
                  </div>
                </div>

                {/* Barre de contribution */}
                <div className="mt-4 pt-4 border-t border-[var(--border)]">
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-[var(--text-muted)]">Coût Total Employeur</span>
                    <span className="font-semibold text-[var(--text)]">{formatCurrency(dept.totalEmployerCost)}</span>
                  </div>
                  <div className="h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--surface)] transition-colors duration-500"
                      style={{
                        width: `${Math.min(100, (dept.totalEmployerCost / (departmentData?.reduce((sum: number, d: any) => sum + d.totalEmployerCost, 0) || 1)) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================
          SECTION 3 : HEURES SUPPLÉMENTAIRES
      ======================================== */}
      {overtimeData?.byEmployee?.length > 0 && (
        <div className="bg-[var(--surface)] rounded-2xl p-6 border border-[var(--border)] shadow-sm reports-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 id="report-section-3" tabIndex={-1} className="text-2xl font-semibold text-[var(--text)] flex items-center gap-2">
                <Clock strokeWidth={1.5} size={24} className="text-[var(--accent-2)]" />
                Heures Supplémentaires Détaillées
              </h2>
              <p className="text-[var(--text-muted)]">
                {overtimeData.summary?.totalHours || 0}h totales · {overtimeData.summary?.totalAmount || '0 FCFA'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-[var(--text-muted)]">Employés concernés</p>
              <p className="text-3xl font-semibold text-[var(--text)]">{overtimeData.summary?.employeesWithOvertime || 0}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="reports-table-region" role="region" aria-label="Données du rapport" tabIndex={0}><table data-report-table className="w-full text-sm reports-table">
              <thead className="bg-[var(--surface-2)]/50 text-xs  text-[var(--text-muted)] font-semibold">
                <tr>
                  <th className="px-4 py-3 text-left">Employé</th>
                  <th className="px-4 py-3 text-left">Département</th>
                  <th className="px-4 py-3 text-right">HS +15%</th>
                  <th className="px-4 py-3 text-right">HS +50%</th>
                  <th className="px-4 py-3 text-right">Total Heures</th>
                  <th className="px-4 py-3 text-right">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {overtimeData.byEmployee.map((emp: any, idx: number) => (
                  <tr key={idx} className="hover:bg-[var(--surface-2)] transition-colors">
                    <td className="px-4 py-3 font-medium text-[var(--text)]">{emp.name || 'N/A'}</td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{emp.department || 'N/A'}</td>
                    <td className="px-4 py-3 text-right font-mono text-[var(--text)]">{safeToFixed(emp.overtime15)}h</td>
                    <td className="px-4 py-3 text-right font-mono text-[var(--text)]">{safeToFixed(emp.overtime50)}h</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-[var(--accent-2)]">{safeToFixed(emp.totalOvertime)}h</td>
                    <td className="px-4 py-3 text-right font-semibold text-[var(--text)]">{formatCurrency(emp.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>

          {/* Explication heures sup */}
          <div className="mt-6 bg-[var(--accent-2-soft)] rounded-xl p-4 border border-[var(--accent-2)]/30">
            <div className="flex items-start gap-3">
              <Zap strokeWidth={1.5} size={20} className="text-[var(--accent-2)] mt-0.5 flex-shrink-0" />
              <div className="text-sm text-[var(--text)] leading-relaxed">
                <strong>Analyse :</strong> Les heures supplémentaires représentent un coût de <strong>{overtimeData.summary?.totalAmount || '0 FCFA'}</strong>.
                {(overtimeData.summary?.totalHours || 0) > 50
                  ? " Volume élevé d'heures sup détecté. Envisagez d'analyser la charge de travail ou de recruter."
                  : " Volume d'heures sup dans la normale."
                }
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================
          SECTION 4 : TOP EMPLOYÉS
      ======================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Heures Sup */}
        {topEmployeesData?.topOvertime?.length > 0 && (
          <div className="bg-[var(--surface)] rounded-2xl p-6 border border-[var(--border)] shadow-sm reports-card">
            <div className="flex items-center gap-2 mb-4">
              <Award strokeWidth={1.5} size={20} className="text-[var(--warning-text)]" />
              <h3 id="report-section-4" tabIndex={-1} className="text-lg font-semibold text-[var(--text)]">Top 10 Heures Supplémentaires</h3>
            </div>
            <div className="space-y-3">
              {topEmployeesData.topOvertime.slice(0, 10).map((emp: any, idx: number) => (
                <div key={emp.id || idx} className="flex items-center justify-between p-3 bg-[var(--surface-2)] rounded-xl hover:opacity-80 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--warning-text)] flex items-center justify-center font-semibold text-sm">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-medium text-[var(--text)]">{emp.name || 'N/A'}</p>
                      <p className="text-xs text-[var(--text-muted)]">{emp.department || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[var(--accent-2)]">{safeToFixed(emp.totalOvertime)}h</p>
                    <p className="text-xs text-[var(--text-muted)]">{formatCurrency(emp.overtimeAmount)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Congés */}
        {topEmployeesData?.topLeaves?.length > 0 && (
          <div className="bg-[var(--surface)] rounded-2xl p-6 border border-[var(--border)] shadow-sm reports-card">
            <div className="flex items-center gap-2 mb-4">
              <Calendar strokeWidth={1.5} size={20} className="text-[var(--action)]" />
              <h3 id="report-section-5" tabIndex={-1} className="text-lg font-semibold text-[var(--text)]">Top 10 Congés Pris</h3>
            </div>
            <div className="space-y-3">
              {topEmployeesData.topLeaves.slice(0, 10).map((emp: any, idx: number) => (
                <div key={emp.id || idx} className="flex items-center justify-between p-3 bg-[var(--surface-2)] rounded-xl hover:opacity-80 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[var(--brand-soft)] text-[var(--action)] flex items-center justify-center font-semibold text-sm">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-medium text-[var(--text)]">{emp.name || 'N/A'}</p>
                      <p className="text-xs text-[var(--text-muted)]">{emp.department || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[var(--action)]">{safeToFixed(emp.leavesDays, 1)} jours</p>
                    <p className="text-xs text-[var(--text-muted)]">{emp.leavesCount || 0} demande(s)</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ========================================
          SECTION 5 : ÉVOLUTION TENDANCE
      ======================================== */}
      {payrollData?.trend?.length > 0 && (
        <div className="bg-[var(--surface)] rounded-2xl p-6 border border-[var(--border)] shadow-sm reports-card">
          <h2 id="report-section-6" tabIndex={-1} className="text-2xl font-semibold text-[var(--text)] mb-6 flex items-center gap-2">
            <TrendingUp strokeWidth={1.5} size={24} className="text-[var(--brand)]" />
            Évolution sur 6 Mois
          </h2>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={payrollData.trend}>
                <defs>
                  <linearGradient id="colorBrut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.success} stopOpacity={0} />
                  </linearGradient>
                </defs>

                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <Tooltip
                  contentStyle={chartTheme.tooltip}
                />
                <Legend iconType="circle" />
                <Area isAnimationActive={false} activeDot={{r:5,stroke:chartTheme.surface,strokeWidth:3}}
                  type="monotone"
                  name="Salaire Brut (M FCFA)"
                  dataKey="brut"
                  stroke={COLORS.primary}
                  fill="url(#colorBrut)"
                  strokeWidth={3}
                />
                <Area isAnimationActive={false} activeDot={{r:5,stroke:chartTheme.surface,strokeWidth:3}}
                  type="monotone"
                  name="Salaire Net (M FCFA)"
                  dataKey="net"
                  stroke={COLORS.success}
                  fill="url(#colorNet)"
                  strokeWidth={3}
                />
                <Area isAnimationActive={false} activeDot={{r:5,stroke:chartTheme.surface,strokeWidth:3}}
                  type="monotone"
                  name="Charges (M FCFA)"
                  dataKey="charges"
                  stroke={COLORS.warning}
                  fillOpacity={0}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ========================================
          SECTION 6 : RÉPARTITION CONGÉS
      ======================================== */}
      {leavesData?.distribution?.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 reports-charts">
          <div className="bg-[var(--surface)] rounded-2xl p-6 border border-[var(--border)] shadow-sm reports-card">
            <h3 id="report-section-7" tabIndex={-1} className="text-lg font-semibold text-[var(--text)] mb-4 flex items-center gap-2">
              <Calendar strokeWidth={1.5} size={20} className="text-[var(--action)]" />
              Répartition des Congés par Type
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie isAnimationActive={false} stroke="none" cornerRadius={6}
                    data={leavesData.distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={(entry) => `${entry.name}: ${entry.value}`}
                  >
                    {leavesData.distribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={chartTheme.tooltip} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[var(--surface)] rounded-2xl p-6 border border-[var(--border)] shadow-sm reports-card">
            <h3 id="report-section-8" tabIndex={-1} className="text-lg font-semibold text-[var(--text)] mb-4">Statistiques Congés</h3>
            <div className="space-y-4">
              {leavesData.kpi?.map((kpi: any, idx: number) => (
                <div key={idx} className="p-4 bg-[var(--surface-2)]/50 rounded-xl">
                  <p className="text-sm text-[var(--text-muted)] font-semibold  mb-1">{kpi.label}</p>
                  <p className="text-3xl font-semibold text-[var(--text)]">{kpi.value}</p>
                </div>
              ))}

              <div className="mt-6 bg-[var(--brand-soft)] rounded-xl p-4 border border-[var(--border)]">
                <div className="flex items-start gap-3">
                  <CheckCircle strokeWidth={1.5} size={20} className="text-[var(--action)] mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-[var(--action)] leading-relaxed">
                    <strong>Observation :</strong> Le taux de congés est {
                      leavesData.distribution?.reduce((sum: number, d: any) => sum + d.value, 0) > 50
                        ? "élevé ce mois-ci. Vérifiez la planification pour assurer la continuité des opérations."
                        : "dans la normale. Pas d'alerte particulière."
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================
          SECTION 7 : RÉSUMÉ GLOBAL
      ======================================== */}
      <div className="bg-[var(--surface)] rounded-2xl p-8 text-[var(--text)] shadow-xl">
        <h2 id="report-section-9" tabIndex={-1} className="text-2xl font-semibold mb-6 flex items-center gap-2">
          <FileBarChart strokeWidth={1.5} size={24} />
          Résumé Exécutif
        </h2>

        {payrollData?.summary?.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 reports-metrics">
            {payrollData.summary.map((metric: any, idx: number) => (
              <div key={idx} className="bg-[color-mix(in_srgb,var(--surface)_10%,transparent)] rounded-xl p-4">
                <p className="text-[var(--text)] text-xs  font-semibold mb-2">{metric.label}</p>
                <p className="text-2xl font-semibold">{metric.value}</p>
                <p className="text-[var(--text)] text-xs mt-1">{metric.currency} {metric.sub && `· ${metric.sub}`}</p>
              </div>
            ))}
          </div>
        )}

        <div className="bg-[color-mix(in_srgb,var(--surface)_10%,transparent)] rounded-xl p-6 border border-[var(--border)]">
          <h3 className="font-semibold text-lg mb-4"> Points Clés à Retenir</h3>
          <ul className="space-y-3 text-sm text-[var(--text)]">
            <li className="flex items-start gap-2">
              <CheckCircle strokeWidth={1.5} size={16} className="text-[var(--action)] mt-0.5 flex-shrink-0" />
              <span>
                Masse salariale totale : <strong>{formatCurrency(comparisonData?.current?.gross)}</strong>
                {isGrossUp ? " (hausse)" : " (baisse)"} vs mois précédent
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle strokeWidth={1.5} size={16} className="text-[var(--action)] mt-0.5 flex-shrink-0" />
              <span>
                {overtimeData?.summary?.employeesWithOvertime || 0} employés avec heures supplémentaires pour un total de {overtimeData?.summary?.totalAmount || "0 FCFA"}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle strokeWidth={1.5} size={16} className="text-[var(--action)] mt-0.5 flex-shrink-0" />
              <span>
                {leavesData?.kpi?.[0]?.value || 0} demandes de congés validées ce mois
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle strokeWidth={1.5} size={16} className="text-[var(--action)] mt-0.5 flex-shrink-0" />
              <span>
                Département le plus coûteux : <strong>
                  {departmentData?.reduce((max: any, d: any) => d.totalEmployerCost > max.totalEmployerCost ? d : max, {name: 'N/A', totalEmployerCost: 0})?.name || 'N/A'}
                </strong>
              </span>
            </li>
            {variations.grossPercent < -5 && (
              <li className="flex items-start gap-2">
                <AlertCircle strokeWidth={1.5} size={16} className="text-[var(--warning-text)] mt-0.5 flex-shrink-0" />
                <span className="text-[var(--warning-text)]">
                  <strong>Alerte :</strong> Baisse importante de la masse salariale ({formatPercent(variations.grossPercent)}).
                  Vérifiez les départs ou absences prolongées.
                </span>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[var(--text-muted)] text-sm py-8">
        <p>Rapport généré automatiquement le {new Date().toLocaleDateString('fr-FR', { dateStyle: 'full' })}</p>
        <p className="mt-2">Konza-rh System · Confidentiel · À usage interne uniquement</p>
      </div>

      {/* ═══ ÉVOLUTION PLURIANNUELLE (en bas de page) ══════════════════════ */}
      <YearlyEvolutionPanel />
    </div>
  );
}


export default function CompleteHRReportWithFrame() {
  return (
    <ModulePageFrame kind="list">
      <CompleteHRReport />
    </ModulePageFrame>
  );
}
