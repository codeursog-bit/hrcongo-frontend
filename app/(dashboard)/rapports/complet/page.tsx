'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, TrendingUp, TrendingDown, Users, Wallet, Building2, 
  Clock, Calendar, AlertCircle, CheckCircle, Download, Printer,
  DollarSign, Shield, FileBarChart, Award, Target, Loader2,
  ArrowUpRight, ArrowDownRight, Info, Zap
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { api } from '@/services/api';

// Couleurs cohérentes
const COLORS = {
  primary: '#0EA5E9',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  indigo: '#6366F1'
};

const CHART_COLORS = ['#0EA5E9', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1'];

export default function CompleteHRReport() {
  const router = useRouter();
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

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
          api.get('/reports/payroll'),
          api.get('/reports/departments'),
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
  }, []);

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
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-sky-500 mb-4" size={48} />
        <p className="text-gray-500">Génération du rapport en cours...</p>
      </div>
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
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/rapports')} 
            className="p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-500" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              Rapport RH Complet
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Période : {now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-white font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2">
            <Download size={18} />
            Exporter PDF
          </button>
          <button className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-white font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2">
            <Printer size={18} />
            Imprimer
          </button>
        </div>
      </div>

      {/* ✅ NAVIGATION RAPPORTS */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
        {[
          { href: '/rapports', label: 'Vue d\'ensemble', icon: '📊' },
          { href: '/rapports/complet', label: 'Rapport Complet', icon: '📋', active: true },
          { href: '/rapports/analyse-paie', label: 'Paie & Coûts', icon: '💰' },
          { href: '/rapports/effectifs', label: 'Effectifs', icon: '👥' },
          { href: '/rapports/analyse-conges', label: 'Congés', icon: '🏖️' }
        ].map((item) => (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all
              ${item.active 
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30' 
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-sky-300'
              }
            `}
          >
            <span>{item.icon}</span>
            <span className="hidden sm:inline">{item.label}</span>
          </button>
        ))}
      </div>

      {/* ========================================
          SECTION 1 : COMPARAISON AVEC MOIS PRÉCÉDENT
      ======================================== */}
      <div className="bg-gradient-to-r from-sky-500 to-blue-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">📊 Évolution vs Mois Précédent</h2>
            <p className="text-sky-100">
              Comparaison {now.toLocaleDateString('fr-FR', { month: 'long' })} vs {comparisonData?.previous ? new Date(comparisonData.previous.year, comparisonData.previous.month - 1).toLocaleDateString('fr-FR', { month: 'long' }) : 'mois précédent'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sky-100 text-sm">Variation Globale</p>
            <div className={`text-4xl font-bold flex items-center gap-2 ${isGrossUp ? 'text-white' : 'text-red-200'}`}>
              {isGrossUp ? <ArrowUpRight size={32} /> : <ArrowDownRight size={32} />}
              {formatPercent(variations.grossPercent)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <p className="text-sky-100 text-xs uppercase font-bold mb-2">Masse Salariale Brute</p>
            <p className="text-2xl font-bold">{formatCurrency(comparisonData?.current?.gross)}</p>
            <div className={`flex items-center gap-1 text-sm font-bold mt-2 ${isGrossUp ? 'text-emerald-200' : 'text-red-200'}`}>
              {isGrossUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {formatPercent(variations.grossPercent)}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <p className="text-sky-100 text-xs uppercase font-bold mb-2">Salaire Net Total</p>
            <p className="text-2xl font-bold">{formatCurrency(comparisonData?.current?.net)}</p>
            <div className={`flex items-center gap-1 text-sm font-bold mt-2 ${variations.netPercent > 0 ? 'text-emerald-200' : 'text-red-200'}`}>
              {variations.netPercent > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {formatPercent(variations.netPercent)}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <p className="text-sky-100 text-xs uppercase font-bold mb-2">Coût Employeur Total</p>
            <p className="text-2xl font-bold">{formatCurrency(comparisonData?.current?.cost)}</p>
            <div className={`flex items-center gap-1 text-sm font-bold mt-2 ${variations.costPercent > 0 ? 'text-red-200' : 'text-emerald-200'}`}>
              {variations.costPercent > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {formatPercent(variations.costPercent)}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <p className="text-sky-100 text-xs uppercase font-bold mb-2">Bulletins Générés</p>
            <p className="text-2xl font-bold">{comparisonData?.current?.count || 0}</p>
            <div className={`flex items-center gap-1 text-sm font-bold mt-2 ${isCountUp ? 'text-emerald-200' : 'text-red-200'}`}>
              {isCountUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {isCountUp ? '+' : ''}{variations.countDiff} employé(s)
            </div>
          </div>
        </div>

        {/* Explication automatique */}
        <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <div className="flex items-start gap-3">
            <Info size={20} className="text-white mt-0.5 flex-shrink-0" />
            <div className="text-sm text-sky-50 leading-relaxed">
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Building2 size={24} className="text-sky-500" />
            Analyse Détaillée par Département
          </h2>

          <div className="grid grid-cols-1 gap-6">
            {departmentData.map((dept: any, idx: number) => (
              <div key={dept.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl font-bold"
                      style={{ backgroundColor: dept.color || CHART_COLORS[idx % CHART_COLORS.length] }}
                    >
                      {dept.name[0]}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{dept.name}</h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        {dept.headcount} employé(s) · Salaire moyen : {formatCurrency(dept.avgSalary)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase mb-1">Masse Salariale Brute</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(dept.totalGross)}</p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase mb-1">Salaire Net Total</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(dept.totalNet)}</p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase mb-1">CNSS Patronale</p>
                    <p className="text-lg font-bold text-orange-600">{formatCurrency(dept.totalCNSS)}</p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase mb-1">ITS Collecté</p>
                    <p className="text-lg font-bold text-purple-600">{formatCurrency(dept.totalITS)}</p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase mb-1">Heures Sup Total</p>
                    <p className="text-lg font-bold text-indigo-600">{dept.totalOvertime || 0}h</p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase mb-1">Congés Validés</p>
                    <p className="text-lg font-bold text-emerald-600">{dept.totalLeaves || 0}</p>
                  </div>
                </div>

                {/* Barre de contribution */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Coût Total Employeur</span>
                    <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(dept.totalEmployerCost)}</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-sky-500 to-blue-600 transition-all duration-500"
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock size={24} className="text-indigo-500" />
                Heures Supplémentaires Détaillées
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                {overtimeData.summary?.totalHours || 0}h totales · {overtimeData.summary?.totalAmount || '0 FCFA'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Employés concernés</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{overtimeData.summary?.employeesWithOvertime || 0}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500 font-semibold">
                <tr>
                  <th className="px-4 py-3 text-left">Employé</th>
                  <th className="px-4 py-3 text-left">Département</th>
                  <th className="px-4 py-3 text-right">HS +15%</th>
                  <th className="px-4 py-3 text-right">HS +50%</th>
                  <th className="px-4 py-3 text-right">Total Heures</th>
                  <th className="px-4 py-3 text-right">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {overtimeData.byEmployee.map((emp: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{emp.name || 'N/A'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{emp.department || 'N/A'}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-900 dark:text-white">{safeToFixed(emp.overtime15)}h</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-900 dark:text-white">{safeToFixed(emp.overtime50)}h</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-indigo-600">{safeToFixed(emp.totalOvertime)}h</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">{formatCurrency(emp.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Explication heures sup */}
          <div className="mt-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 border border-indigo-200 dark:border-indigo-800">
            <div className="flex items-start gap-3">
              <Zap size={20} className="text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-indigo-900 dark:text-indigo-100 leading-relaxed">
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Award size={20} className="text-amber-500" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Top 10 Heures Supplémentaires</h3>
            </div>
            <div className="space-y-3">
              {topEmployeesData.topOvertime.slice(0, 10).map((emp: any, idx: number) => (
                <div key={emp.id || idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{emp.name || 'N/A'}</p>
                      <p className="text-xs text-gray-500">{emp.department || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-indigo-600">{safeToFixed(emp.totalOvertime)}h</p>
                    <p className="text-xs text-gray-500">{formatCurrency(emp.overtimeAmount)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Congés */}
        {topEmployeesData?.topLeaves?.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={20} className="text-emerald-500" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Top 10 Congés Pris</h3>
            </div>
            <div className="space-y-3">
              {topEmployeesData.topLeaves.slice(0, 10).map((emp: any, idx: number) => (
                <div key={emp.id || idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{emp.name || 'N/A'}</p>
                      <p className="text-xs text-gray-500">{emp.department || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-600">{safeToFixed(emp.leavesDays, 1)} jours</p>
                    <p className="text-xs text-gray-500">{emp.leavesCount || 0} demande(s)</p>
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <TrendingUp size={24} className="text-sky-500" />
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
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    color: '#fff', 
                    borderRadius: '12px', 
                    border: 'none',
                    padding: '12px'
                  }} 
                />
                <Legend iconType="circle" />
                <Area 
                  type="monotone" 
                  name="Salaire Brut (M FCFA)" 
                  dataKey="brut" 
                  stroke={COLORS.primary} 
                  fill="url(#colorBrut)" 
                  strokeWidth={3} 
                />
                <Area 
                  type="monotone" 
                  name="Salaire Net (M FCFA)" 
                  dataKey="net" 
                  stroke={COLORS.success} 
                  fill="url(#colorNet)" 
                  strokeWidth={3} 
                />
                <Area 
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-emerald-500" />
              Répartition des Congés par Type
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
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
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Statistiques Congés</h3>
            <div className="space-y-4">
              {leavesData.kpi?.map((kpi: any, idx: number) => (
                <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase mb-1">{kpi.label}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{kpi.value}</p>
                </div>
              ))}

              <div className="mt-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-start gap-3">
                  <CheckCircle size={20} className="text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-emerald-900 dark:text-emerald-100 leading-relaxed">
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
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-black rounded-2xl p-8 text-white shadow-xl">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <FileBarChart size={24} />
          Résumé Exécutif
        </h2>

        {payrollData?.summary?.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {payrollData.summary.map((metric: any, idx: number) => (
              <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-white/70 text-xs uppercase font-bold mb-2">{metric.label}</p>
                <p className="text-2xl font-bold">{metric.value}</p>
                <p className="text-white/50 text-xs mt-1">{metric.currency} {metric.sub && `· ${metric.sub}`}</p>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <h3 className="font-bold text-lg mb-4">🎯 Points Clés à Retenir</h3>
          <ul className="space-y-3 text-sm text-white/90">
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
              <span>
                Masse salariale totale : <strong>{formatCurrency(comparisonData?.current?.gross)}</strong> 
                {isGrossUp ? " (hausse)" : " (baisse)"} vs mois précédent
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
              <span>
                {overtimeData?.summary?.employeesWithOvertime || 0} employés avec heures supplémentaires pour un total de {overtimeData?.summary?.totalAmount || "0 FCFA"}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
              <span>
                {leavesData?.kpi?.[0]?.value || 0} demandes de congés validées ce mois
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
              <span>
                Département le plus coûteux : <strong>
                  {departmentData?.reduce((max: any, d: any) => d.totalEmployerCost > max.totalEmployerCost ? d : max, {name: 'N/A', totalEmployerCost: 0})?.name || 'N/A'}
                </strong>
              </span>
            </li>
            {variations.grossPercent < -5 && (
              <li className="flex items-start gap-2">
                <AlertCircle size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
                <span className="text-amber-200">
                  <strong>Alerte :</strong> Baisse importante de la masse salariale ({formatPercent(variations.grossPercent)}). 
                  Vérifiez les départs ou absences prolongées.
                </span>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-8">
        <p>Rapport généré automatiquement le {new Date().toLocaleDateString('fr-FR', { dateStyle: 'full' })}</p>
        <p className="mt-2">HRCongo System · Confidentiel · À usage interne uniquement</p>
      </div>
    </div>
  );
}