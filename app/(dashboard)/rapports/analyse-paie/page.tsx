'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Calendar, Download, Printer, DollarSign, Wallet, 
  Shield, TrendingUp, TrendingDown, Users, Building2, Loader2,
  ArrowUpRight, ArrowDownRight, AlertCircle, CheckCircle
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { api } from '@/services/api';

const COLORS = ['#0EA5E9', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1'];

export default function PayrollAnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [comparison, setComparison] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [payrollRes, deptRes, compRes] = await Promise.all([
          api.get('/reports/payroll'),
          api.get('/reports/departments'),
          api.get(`/reports/comparison?month=${currentMonth}&year=${currentYear}`)
        ]) as [any, any, any];
        
        setData(payrollRes);
        setDepartments(Array.isArray(deptRes) ? deptRes : []);
        setComparison(compRes);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatCurrency = (val: number) => {
    if (!val) return '0 FCFA';
    return val.toLocaleString('fr-FR') + ' FCFA';
  };

  const formatPercent = (val: number) => {
    const sign = val > 0 ? '+' : '';
    return `${sign}${val.toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-sky-500" size={48} />
      </div>
    );
  }

  const variations = comparison?.variations || {};

  return (
    <div className="max-w-[1600px] mx-auto pb-20 space-y-8">
      
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/rapports')} 
            className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-500" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              Analyse Détaillée de Paie
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Rapports financiers et décomposition des coûts salariaux
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-white font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2">
            <Download size={18} />
            Exporter
          </button>
          <button className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-white font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2">
            <Printer size={18} />
            Imprimer
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
        {[
          { href: '/rapports', label: 'Vue d\'ensemble', icon: '📊' },
          { href: '/rapports/complet', label: 'Rapport Complet', icon: '📋' },
          { href: '/rapports/analyse-paie', label: 'Paie & Coûts', icon: '💰', active: true },
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {data?.summary?.map((metric: any, i: number) => {
          const icons = [Wallet, Shield, DollarSign, TrendingUp];
          const colors = [
            'from-sky-500 to-blue-600',
            'from-orange-500 to-red-600',
            'from-emerald-500 to-teal-600',
            'from-purple-500 to-indigo-600'
          ];
          const Icon = icons[i % icons.length];

          return (
            <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colors[i]} opacity-5 rounded-bl-full -mr-10 -mt-10 group-hover:scale-150 transition-transform`} />
              
              <div className="relative z-10">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[i]} flex items-center justify-center text-white shadow-lg mb-4`}>
                  <Icon size={24} />
                </div>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  {metric.label}
                </p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {metric.value}
                </h3>
                <p className="text-xs text-gray-500 mt-2">
                  {metric.currency} {metric.sub && `· ${metric.sub}`}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        <div className="xl:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Évolution Masse Salariale
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Tendance sur 6 mois (en millions FCFA)
              </p>
            </div>
          </div>
          
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.trend || []}>
                <defs>
                  <linearGradient id="colorBrut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    color: '#fff', 
                    borderRadius: '12px', 
                    border: 'none' 
                  }} 
                />
                <Legend iconType="circle" />
                <Area 
                  type="monotone" 
                  name="Salaire Brut" 
                  dataKey="brut" 
                  stroke="#0EA5E9" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorBrut)" 
                />
                <Area 
                  type="monotone" 
                  name="Salaire Net" 
                  dataKey="net" 
                  stroke="#10B981" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorNet)" 
                />
                <Area 
                  type="monotone" 
                  name="Charges" 
                  dataKey="charges" 
                  stroke="#F59E0B" 
                  strokeWidth={2} 
                  strokeDasharray="5 5"
                  fillOpacity={0} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
          <h3 className="text-lg font-bold mb-4">Comparaison vs Mois Précédent</h3>
          
          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-sky-100 text-xs uppercase font-bold mb-1">Masse Brute</p>
              <p className="text-2xl font-bold">{formatCurrency(comparison?.current?.gross)}</p>
              <div className={`flex items-center gap-1 text-sm font-bold mt-2 ${variations.grossPercent > 0 ? 'text-emerald-200' : 'text-red-200'}`}>
                {variations.grossPercent > 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                {formatPercent(variations.grossPercent)}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-sky-100 text-xs uppercase font-bold mb-1">Salaire Net</p>
              <p className="text-2xl font-bold">{formatCurrency(comparison?.current?.net)}</p>
              <div className={`flex items-center gap-1 text-sm font-bold mt-2 ${variations.netPercent > 0 ? 'text-emerald-200' : 'text-red-200'}`}>
                {variations.netPercent > 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                {formatPercent(variations.netPercent)}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-sky-100 text-xs uppercase font-bold mb-1">Coût Employeur</p>
              <p className="text-2xl font-bold">{formatCurrency(comparison?.current?.cost)}</p>
              <div className={`flex items-center gap-1 text-sm font-bold mt-2 ${variations.costPercent > 0 ? 'text-red-200' : 'text-emerald-200'}`}>
                {variations.costPercent > 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                {formatPercent(variations.costPercent)}
              </div>
            </div>
          </div>

          <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-start gap-2">
              {variations.grossPercent > 5 ? (
                <AlertCircle size={16} className="text-amber-300 mt-0.5 flex-shrink-0" />
              ) : (
                <CheckCircle size={16} className="text-emerald-300 mt-0.5 flex-shrink-0" />
              )}
              <p className="text-xs text-sky-50 leading-relaxed">
                {variations.grossPercent > 5 
                  ? "Hausse importante détectée. Vérifiez les heures supplémentaires et nouvelles embauches."
                  : "Évolution dans la normale. Pas d'alerte particulière."
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Building2 size={20} className="text-sky-500" />
              Répartition par Département
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Masse salariale et charges détaillées
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500 font-semibold">
              <tr>
                <th className="px-4 py-3 text-left">Département</th>
                <th className="px-4 py-3 text-right">Effectif</th>
                <th className="px-4 py-3 text-right">Salaire Brut</th>
                <th className="px-4 py-3 text-right">Salaire Net</th>
                <th className="px-4 py-3 text-right">CNSS Employeur</th>
                <th className="px-4 py-3 text-right">ITS</th>
                <th className="px-4 py-3 text-right">Coût Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {departments?.map((dept: any, idx: number) => (
                <tr key={dept.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: dept.color || COLORS[idx % COLORS.length] }}
                      >
                        {dept.name[0]}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">{dept.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right font-medium text-gray-900 dark:text-white">
                    {dept.headcount}
                  </td>
                  <td className="px-4 py-4 text-right font-bold text-gray-900 dark:text-white">
                    {formatCurrency(dept.totalGross)}
                  </td>
                  <td className="px-4 py-4 text-right font-bold text-emerald-600">
                    {formatCurrency(dept.totalNet)}
                  </td>
                  <td className="px-4 py-4 text-right font-bold text-orange-600">
                    {formatCurrency(dept.totalCNSS)}
                  </td>
                  <td className="px-4 py-4 text-right font-bold text-purple-600">
                    {formatCurrency(dept.totalITS)}
                  </td>
                  <td className="px-4 py-4 text-right font-bold text-sky-600">
                    {formatCurrency(dept.totalEmployerCost)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Répartition Masse Salariale
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={departments?.map(d => ({ name: d.name, value: d.totalGross }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={(entry) => `${entry.name}: ${(entry.value / 1000000).toFixed(1)}M`}
                >
                  {departments?.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Charges Patronales par Département
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departments || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="totalCNSS" name="CNSS" fill="#F59E0B" />
                <Bar dataKey="totalITS" name="ITS" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}