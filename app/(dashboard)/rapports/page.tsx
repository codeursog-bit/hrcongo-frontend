
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // ✅ Ajout;

import { 
  Users, Wallet, TrendingUp, TrendingDown, Clock, Calendar, 
  UserPlus, Calculator, AlertTriangle, Download, Share2, 
  Printer, ArrowUpRight, ArrowDownRight, ChevronDown, Filter,
  FileBarChart, CheckCircle2, XCircle, MoreHorizontal, ArrowRight, Loader2
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, Legend,
  ReferenceLine
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';

// --- Components ---

const KPICard = ({ title, value, trend, trendValue, icon: Icon, color, data, compareMode }: any) => {
  const isPositive = trend === 'up';
  const comparisonValue = compareMode ? (isPositive ? "vs N-1" : "vs obj") : `vs mois dernier`;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${color.bg} ${color.text}`}>
          <Icon size={24} />
        </div>
      </div>
      
      <div className="flex items-end justify-between relative z-10">
        <div>
           <div className={`flex items-center gap-1 text-sm font-bold ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
             {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
             {trendValue}
           </div>
           <p className="text-xs text-gray-400 mt-0.5">{comparisonValue}</p>
        </div>
      </div>
    </div>
  );
};

export default function AnalyticsDashboard() {
   const router = useRouter(); // ✅ Ajout
  const [period, setPeriod] = useState('month');
  const [compareMode, setCompareMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
        try {
            const res = await api.get('/reports/overview');
            setData(res);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };
    fetchData();
  }, []);

  const formatMoney = (val: number) => {
      if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
      if (val >= 1000) return (val / 1000).toFixed(1) + 'k';
      return val?.toString() || '0';
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-sky-500" size={48}/></div>;

  return (
    <div className="max-w-[1600px] mx-auto pb-20 space-y-8">
      
      {/* HEADER */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
           <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Rapports & Analyses</h1>
           <p className="text-gray-500 dark:text-gray-400">Vue d'ensemble stratégique des ressources humaines.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
           <div className="bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center shadow-sm">
              <button onClick={() => setPeriod('month')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${period === 'month' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>Mois</button>
              <button onClick={() => setPeriod('year')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${period === 'year' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>Année</button>
           </div>
           <button onClick={() => setCompareMode(!compareMode)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-bold text-sm transition-colors ${compareMode ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-white border-gray-200 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-white'}`}>
              <TrendingUp size={16} /> Comparer
           </button>
        </div>
      </div>

    {/* ✅ AJOUT : Navigation Rapports */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
        {[
          { href: '/rapports', label: 'Vue d\'ensemble', icon: '📊', active: true },
          { href: '/rapports/complet', label: 'Rapport Complet', icon: '📋' },
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



      {/* TABS */}
      <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
         <div className="flex gap-8 min-w-max">
            <button className="pb-4 text-sm font-bold border-b-2 text-sky-600 border-sky-500">Vue d'ensemble</button>
            <Link href="/rapports/analyse-paie" className="pb-4 text-sm font-bold border-b-2 border-transparent text-gray-500 hover:text-sky-600 transition-colors">Paie & Coûts</Link>
            <Link href="/rapports/effectifs" className="pb-4 text-sm font-bold border-b-2 border-transparent text-gray-500 hover:text-sky-600 transition-colors">Effectifs</Link>
         </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
         
         {/* LEFT COLUMN (3/4) */}
         <div className="xl:col-span-3 space-y-8">
            
            {/* KPI GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               <KPICard 
                  title="Effectif Total" 
                  value={data?.headcount || 0} 
                  trend="up" 
                  trendValue="Actifs" 
                  icon={Users} 
                  color={{bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600'}} 
                  compareMode={compareMode}
               />
               <KPICard 
                  title="Masse Salariale" 
                  value={formatMoney(data?.payrollTotal)} 
                  trend="up" 
                  trendValue="YTD" 
                  icon={Wallet} 
                  color={{bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600'}} 
                  compareMode={compareMode}
               />
               <KPICard 
                  title="Congés Actifs" 
                  value={data?.activeLeaves || 0} 
                  trend="up" 
                  trendValue="Validés" 
                  icon={Calendar} 
                  color={{bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-600'}} 
                  compareMode={compareMode}
               />
               <KPICard 
                  title="Coût Moyen" 
                  value={data?.headcount > 0 ? formatMoney(data?.payrollTotal / data?.headcount) : '0'} 
                  trend="up" 
                  trendValue="Par emp." 
                  icon={Calculator} 
                  color={{bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600'}} 
                  compareMode={compareMode}
               />
            </div>

            {/* CHARTS ROW 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 min-h-[400px]">
               {/* Line Chart */}
               <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                     <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Évolution Masse Salariale</h3>
                        <p className="text-sm text-gray-500">Brut vs Net (Millions FCFA)</p>
                     </div>
                  </div>
                  <div className="flex-1 w-full min-h-[300px]">
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data?.salaryTrend || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                           <defs>
                              <linearGradient id="colorBrut" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.3}/>
                                 <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0}/>
                              </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                           <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                           <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                           <Tooltip contentStyle={{ backgroundColor: '#1f2937', color: '#fff', borderRadius: '8px', border: 'none' }} />
                           <Legend iconType="circle" />
                           <Area type="monotone" name="Salaire Brut" dataKey="brut" stroke="#0EA5E9" fill="url(#colorBrut)" strokeWidth={3} />
                           <Area type="monotone" name="Salaire Net" dataKey="net" stroke="#10B981" fillOpacity={0} strokeWidth={3} />
                        </AreaChart>
                     </ResponsiveContainer>
                  </div>
               </div>

               {/* Donut Chart */}
               <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Répartition Effectif</h3>
                  <div className="flex-1 min-h-[300px] relative">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                           <Pie
                              data={data?.deptDistribution || []}
                              cx="50%"
                              cy="50%"
                              innerRadius={80}
                              outerRadius={100}
                              paddingAngle={5}
                              dataKey="value"
                           >
                              {data?.deptDistribution?.map((entry: any, index: number) => (
                                 <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                              ))}
                           </Pie>
                           <Tooltip contentStyle={{ backgroundColor: '#1f2937', color: '#fff', borderRadius: '8px', border: 'none' }} />
                           <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                     </ResponsiveContainer>
                     <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                        <span className="text-4xl font-bold text-gray-900 dark:text-white">{data?.headcount}</span>
                        <span className="text-xs text-gray-500 uppercase">Employés</span>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* RIGHT COLUMN (1/4) - SIDEBAR */}
         <div className="space-y-6">
            <div className="bg-gradient-to-b from-gray-900 to-gray-800 dark:from-gray-800 dark:to-black rounded-2xl p-6 text-white shadow-lg">
               <h3 className="font-bold mb-4">Actions Rapides</h3>
               <div className="space-y-3">
                  <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                     <FileBarChart size={16} /> Rapport Mensuel
                  </button>
                  <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                     <Clock size={16} /> Planifier Rapport
                  </button>
                  <button className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-500/20">
                     <Share2 size={16} /> Partager Direction
                  </button>
               </div>
            </div>
         </div>

      </div>
    </div>
  );
}
