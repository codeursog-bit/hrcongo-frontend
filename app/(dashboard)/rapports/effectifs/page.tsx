'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Users, UserPlus, TrendingDown, TrendingUp, Clock, 
  Calendar, Loader2, Building2, Award, Target, AlertCircle
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, ReferenceLine, PieChart, Pie, Cell, Legend
} from 'recharts';
import { api } from '@/services/api';

const COLORS = ['#0EA5E9', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

interface Metric {
  value: number;
  label: string;
  sub: string;
}

interface Department {
  id: string;
  name: string;
  color?: string;
  headcount: number;
  avgSalary: number;
}

interface TrendData {
  month: string;
  total: number;
}

interface PyramidData {
  label: string;
  male: number;
  female: number;
}

interface WorkforceData {
  metrics?: Metric[];
  trend?: TrendData[];
  pyramid?: PyramidData[];
}

export default function EmployeeAnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<WorkforceData | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [topEmployees, setTopEmployees] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [workforceRes, deptRes, topRes] = await Promise.all([
          api.get('/reports/workforce'),
          api.get('/reports/departments'),
          api.get('/reports/top-employees')
        ]);
        
        setData(workforceRes as WorkforceData);
        setDepartments(deptRes as Department[]);
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

  const totalEmployees = data?.metrics?.[0]?.value || 0;

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
              Analyse des Effectifs
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Répartition, tendances et pyramide des âges
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
          { href: '/rapports/effectifs', label: 'Effectifs', icon: '👥', active: true },
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

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {data?.metrics?.map((m: Metric, i: number) => {
          const icons = [Users, UserPlus, TrendingDown];
          const colors = [
            'from-sky-500 to-blue-600',
            'from-emerald-500 to-teal-600',
            'from-red-500 to-pink-600'
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
                <p className="text-xs text-gray-400 mt-1">{m.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* RÉPARTITION PAR DÉPARTEMENT */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Building2 size={20} className="text-sky-500" />
              Répartition par Département
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Effectif et salaire moyen
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments?.map((dept: Department, idx: number) => (
            <div key={dept.id} className="p-5 bg-gray-50 dark:bg-gray-900/50 rounded-xl hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold"
                    style={{ backgroundColor: dept.color || COLORS[idx % COLORS.length] }}
                  >
                    {dept.name[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">{dept.name}</h4>
                    <p className="text-xs text-gray-500">{dept.headcount} employé(s)</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Salaire moyen</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {(dept.avgSalary / 1000).toFixed(0)}k FCFA
                  </span>
                </div>
                
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-sky-500 to-blue-600 transition-all duration-500"
                    style={{ 
                      width: `${Math.min(100, (dept.headcount / totalEmployees) * 100)}%` 
                    }}
                  />
                </div>

                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>{((dept.headcount / totalEmployees) * 100).toFixed(1)}% de l'effectif</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* GRAPHIQUES */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Évolution */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
            Évolution de l'Effectif
          </h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.trend || []}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
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
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#0EA5E9" 
                  strokeWidth={3}
                  fill="url(#colorTotal)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pyramide des Âges */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
            Pyramide des Âges
          </h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                layout="vertical" 
                data={data?.pyramid || []} 
                stackOffset="sign"
                margin={{ left: 20, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="label" 
                  type="category" 
                  width={60} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    color: '#fff', 
                    borderRadius: '12px', 
                    border: 'none' 
                  }} 
                />
                <Legend />
                <ReferenceLine x={0} stroke="#64748b" strokeWidth={2} />
                <Bar 
                  dataKey="male" 
                  name="Hommes" 
                  fill="#0EA5E9" 
                  radius={[0, 8, 8, 0]}
                />
                <Bar 
                  dataKey="female" 
                  name="Femmes" 
                  fill="#EC4899" 
                  radius={[8, 0, 0, 8]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* DISTRIBUTION PAR GENRE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Répartition par Genre
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Hommes', value: data?.pyramid?.reduce((sum: number, age: PyramidData) => sum + age.male, 0) || 0 },
                    { name: 'Femmes', value: data?.pyramid?.reduce((sum: number, age: PyramidData) => sum + age.female, 0) || 0 }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  label
                >
                  <Cell fill="#0EA5E9" />
                  <Cell fill="#EC4899" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
          <h3 className="text-lg font-bold mb-4">Insights & Recommandations</h3>
          
          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Target size={20} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold mb-1">Équilibre Démographique</p>
                  <p className="text-sm text-sky-50 leading-relaxed">
                    La pyramide des âges montre une concentration dans la tranche 30-40 ans. 
                    Envisagez de recruter des profils juniors pour assurer la relève.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold mb-1">Diversité de Genre</p>
                  <p className="text-sm text-sky-50 leading-relaxed">
                    {((data?.pyramid?.reduce((sum: number, age: PyramidData) => sum + age.female, 0) || 0) / totalEmployees * 100).toFixed(0)}% de l'effectif est féminin. 
                    Continuez les efforts pour maintenir la diversité.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-start gap-3">
                <TrendingUp size={20} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold mb-1">Tendance Effectif</p>
                  <p className="text-sm text-sky-50 leading-relaxed">
                    L'effectif est stable. Anticipez les besoins futurs en fonction de la croissance prévue.
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