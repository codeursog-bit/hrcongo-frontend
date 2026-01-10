
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Loader2, Calendar, CheckCircle, Clock, 
  TrendingUp, Users, Award, AlertCircle, XCircle
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';
import { api } from '@/services/api';

const COLORS = ['#0EA5E9', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1'];

export default function LeaveAnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [topEmployees, setTopEmployees] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leavesRes, topRes] = await Promise.all([
          api.get('/reports/leaves'),
          api.get('/reports/top-employees')
        ]);
        
        setData(leavesRes);
        setTopEmployees(topRes);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-sky-500" size={48}/>
      </div>
    );
  }

  const totalLeaves = data?.distribution?.reduce((sum: number, d: any) => sum + d.value, 0) || 0;

  return (
    <div className="max-w-[1600px] mx-auto pb-20 space-y-8">
      
      {/* HEADER */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/rapports')} 
            className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
          >
            <ArrowLeft size={20} className="text-gray-500"/>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Analyse des Congés
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Répartition, saisonnalité et suivi des soldes
            </p>
          </div>
        </div>
      </div>

      {/* ✅ NAVIGATION RAPPORTS */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
        {[
          { href: '/rapports', label: 'Vue d\'ensemble', icon: '📊' },
          { href: '/rapports/complet', label: 'Rapport Complet', icon: '📋' },
          { href: '/rapports/analyse-paie', label: 'Paie & Coûts', icon: '💰' },
          { href: '/rapports/effectifs', label: 'Effectifs', icon: '👥' },
          { href: '/rapports/analyse-conges', label: 'Congés', icon: '🏖️', active: true }
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

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {data?.kpi?.map((m: any, i: number) => {
          const icons = [Calendar, CheckCircle, Clock];
          const colors = [
            'from-emerald-500 to-teal-600',
            'from-sky-500 to-blue-600',
            'from-purple-500 to-indigo-600'
          ];
          const Icon = icons[i];

          return (
            <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colors[i]} opacity-5 rounded-bl-full -mr-10 -mt-10 group-hover:scale-150 transition-transform`} />
              
              <div className="relative z-10">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[i]} flex items-center justify-center text-white shadow-lg mb-4`}>
                  <Icon size={24} />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {m.value}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wide mt-2">
                  {m.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* GRAPHIQUES PRINCIPAUX */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Répartition par Type */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Répartition par Type de Congé
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {totalLeaves} demande(s) au total
            </p>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={data?.distribution || []} 
                  cx="50%" 
                  cy="50%"
                  innerRadius={70} 
                  outerRadius={100} 
                  paddingAngle={5} 
                  dataKey="value"
                  label={(entry) => `${entry.name}: ${entry.value}`}
                >
                  {data?.distribution?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Légende détaillée */}
          <div className="mt-6 space-y-2">
            {data?.distribution?.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span className="font-medium text-gray-900 dark:text-white">{item.name}</span>
                </div>
                <span className="font-bold text-gray-900 dark:text-white">
                  {item.value} ({((item.value / totalLeaves) * 100).toFixed(0)}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Saisonnalité */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
            Saisonnalité des Congés
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.seasonal || []}>
                <defs>
                  <linearGradient id="colorAnnual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSick" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    color: '#fff', 
                    borderRadius: '12px', 
                    border: 'none' 
                  }} 
                />
                <Legend />
                <Area 
                  type="monotone" 
                  name="Congés Annuels" 
                  dataKey="Annual" 
                  stackId="1"
                  stroke="#0EA5E9" 
                  fill="url(#colorAnnual)"
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  name="Congés Maladie" 
                  dataKey="Sick" 
                  stackId="1"
                  stroke="#EF4444" 
                  fill="url(#colorSick)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-900 dark:text-amber-100 leading-relaxed">
                <strong>Observation :</strong> {
                  totalLeaves > 50
                    ? "Volume élevé de congés ce mois. Vérifiez la charge de travail et planifiez les remplacements."
                    : "Volume de congés dans la normale. Pas d'alerte particulière."
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TOP EMPLOYÉS CONGÉS */}
      {topEmployees?.topLeaves?.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Award size={20} className="text-emerald-500" />
                Top 10 Employés - Congés Pris
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Classement par nombre de jours
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {topEmployees.topLeaves.slice(0, 10).map((emp: any, idx: number) => (
              <div key={emp.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{emp.name}</p>
                    <p className="text-xs text-gray-500">{emp.department}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-emerald-600">{emp.leavesDays.toFixed(1)}</p>
                  <p className="text-xs text-gray-500">{emp.leavesCount} demande(s)</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ANALYSE COMPARATIVE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Statistiques Clés */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-xl">
          <h3 className="text-lg font-bold mb-4">Statistiques Clés</h3>
          
          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-emerald-100 text-sm">Taux d'utilisation</span>
                <span className="text-2xl font-bold">
                  {totalLeaves > 0 ? ((totalLeaves / 100) * 100).toFixed(0) : '0'}%
                </span>
              </div>
              <div className="mt-2 h-2 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-500"
                  style={{ width: `${Math.min(100, (totalLeaves / 100) * 100)}%` }}
                />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-emerald-100 text-sm mb-1">Solde Moyen Restant</p>
              <p className="text-3xl font-bold">{data?.kpi?.[1]?.value || '24j'}</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-emerald-100 text-sm mb-1">Type le Plus Demandé</p>
              <p className="text-xl font-bold">
                {data?.distribution?.[0]?.name || 'N/A'}
              </p>
              <p className="text-emerald-100 text-xs mt-1">
                {data?.distribution?.[0]?.value || 0} demande(s)
              </p>
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Insights & Recommandations
          </h3>

          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-start gap-3">
                <CheckCircle size={20} className="text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold text-emerald-900 dark:text-emerald-100 mb-1">
                    Gestion Optimale
                  </p>
                  <p className="text-sm text-emerald-800 dark:text-emerald-200 leading-relaxed">
                    Le taux d'utilisation des congés est équilibré. Les employés utilisent leurs droits sans surcharge.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-sky-50 dark:bg-sky-900/20 rounded-xl border border-sky-200 dark:border-sky-800">
              <div className="flex items-start gap-3">
                <Users size={20} className="text-sky-600 dark:text-sky-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold text-sky-900 dark:text-sky-100 mb-1">
                    Planification
                  </p>
                  <p className="text-sm text-sky-800 dark:text-sky-200 leading-relaxed">
                    Anticipez les périodes de forte demande (vacances scolaires) pour maintenir la continuité opérationnelle.
                  </p>
                </div>
              </div>
            </div>

            {totalLeaves > 100 && (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-amber-900 dark:text-amber-100 mb-1">
                      Volume Élevé Détecté
                    </p>
                    <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                      Plus de 100 demandes ce mois. Vérifiez que les équipes ne sont pas en sous-effectif.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
              <div className="flex items-start gap-3">
                <TrendingUp size={20} className="text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold text-purple-900 dark:text-purple-100 mb-1">
                    Soldes à Surveiller
                  </p>
                  <p className="text-sm text-purple-800 dark:text-purple-200 leading-relaxed">
                    Encouragez les employés avec des soldes élevés à planifier leurs congés pour éviter les pertes en fin d'année.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}