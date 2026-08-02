'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Users, UserPlus, TrendingDown, TrendingUp, Clock, 
  Calendar, Loader2, Building2, Award, Target, AlertCircle, ClipboardList, LayoutDashboard,UsersRound,
  UmbrellaOff,BookOpen, DollarSign, Hourglass, AlertTriangle, CheckCircle2, Activity, LogOut, UserCircle, BarChart3,
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, ReferenceLine, PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import { api } from '@/services/api';
 import { useBasePath } from '@/hooks/useBasePath';
import RapportsSubNav from '@/components/RapportsSubNav';

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

interface RetirementCandidate {
  id: string;
  name: string;
  position: string;
  department: string | null;
  age: number;
  yearsRemaining: number;
}

interface RetirementWatch {
  legalRetirementAge: number;
  critical: RetirementCandidate[];
  upcoming: RetirementCandidate[];
}

interface ContractTypeData { type: string; label: string; count: number; }
interface CategoryData { label: string; count: number; }

interface TurnoverMonthly { month: string; rate: number; }
interface TurnoverMotif { motif: string; label: string; count: number; }
interface TurnoverByDept { department: string; count: number; }
interface TurnoverDetail {
  recordedRuptures: number;
  monthly: TurnoverMonthly[];
  byMotif: TurnoverMotif[];
  byDepartment: TurnoverByDept[];
}
interface Absenteeism {
  rate: number;
  avgDurationDays: number;
  totalAbsenceDays: number;
  totalAbsenceCount: number;
  theoreticalWorkingDays: number;
}

interface WorkforceData {
  metrics?: Metric[];
  trend?: TrendData[];
  pyramid?: PyramidData[];
  seniority?: PyramidData[];         // 🆕
  retirementWatch?: RetirementWatch; // 🆕
  byContractType?: ContractTypeData[]; // 🆕
  byNationality?: PyramidData[];       // 🆕
  byCategory?: CategoryData[];         // 🆕
  csp?: CategoryData[];                // 🆕
  hasConvention?: boolean;             // 🆕
  turnoverDetail?: TurnoverDetail;     // 🆕 étape 3
  absenteeism?: Absenteeism;           // 🆕 étape 3
}

export default function EmployeeAnalyticsPage() {
  const router = useRouter();
  const { bp } = useBasePath();
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
            onClick={() => router.push(bp('/rapports'))} 
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
      <RapportsSubNav active="/rapports/effectifs" />

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

        {/* 🆕 Pyramide de l'Ancienneté */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            Pyramide de l'Ancienneté
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            Depuis combien de temps l'effectif est-il en poste ?
          </p>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                layout="vertical" 
                data={data?.seniority || []} 
                margin={{ left: 20, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="label" 
                  type="category" 
                  width={80} 
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
                <Bar dataKey="male"   name="Hommes" fill="#8B5CF6" radius={[0, 8, 8, 0]} />
                <Bar dataKey="female" name="Femmes" fill="#F59E0B" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 🆕 Veille Départs à la Retraite */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Hourglass size={20} className="text-amber-500" />
              Veille Départs à la Retraite
            </h3>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            Âge légal de départ : {data?.retirementWatch?.legalRetirementAge ?? 60} ans
          </p>

          {(!data?.retirementWatch || (data.retirementWatch.critical.length === 0 && data.retirementWatch.upcoming.length === 0)) ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <CheckCircle2 size={32} className="text-emerald-400" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">Aucun départ à la retraite à anticiper dans les 5 prochaines années.</p>
            </div>
          ) : (
            <div className="space-y-5 max-h-[320px] overflow-y-auto pr-1">
              {data.retirementWatch.critical.length > 0 && (
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-red-500 mb-2 flex items-center gap-1.5">
                    <AlertTriangle size={13} /> Critique — {data.retirementWatch.critical.length} à préparer en priorité
                  </p>
                  <div className="space-y-2">
                    {data.retirementWatch.critical.map((e: RetirementCandidate) => (
                      <div key={e.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl">
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{e.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{e.position}{e.department ? ` · ${e.department}` : ''}</p>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <p className="text-sm font-black text-red-600 dark:text-red-400">{e.yearsRemaining === 0 ? 'Éligible' : `${e.yearsRemaining} an${e.yearsRemaining > 1 ? 's' : ''}`}</p>
                          <p className="text-[11px] text-gray-400">{e.age} ans</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.retirementWatch.upcoming.length > 0 && (
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-amber-500 mb-2 flex items-center gap-1.5">
                    <Hourglass size={13} /> À anticiper — {data.retirementWatch.upcoming.length}
                  </p>
                  <div className="space-y-2">
                    {data.retirementWatch.upcoming.map((e: RetirementCandidate) => (
                      <div key={e.id} className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-xl">
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{e.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{e.position}{e.department ? ` · ${e.department}` : ''}</p>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <p className="text-sm font-black text-amber-600 dark:text-amber-400">{e.yearsRemaining} ans</p>
                          <p className="text-[11px] text-gray-400">{e.age} ans</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 🆕 RÉPARTITIONS AVANCÉES */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Répartitions Avancées</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Contrat, nationalité et catégorie conventionnelle</p>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

          {/* Type de contrat */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <h4 className="text-base font-bold text-gray-900 dark:text-white mb-5">Répartition par Type de Contrat</h4>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={data?.byContractType || []} margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="label" type="category" width={90} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', color: '#fff', borderRadius: '12px', border: 'none' }} />
                  <Bar dataKey="count" name="Employés" radius={[0, 8, 8, 0]}>
                    {(data?.byContractType || []).map((_: ContractTypeData, idx: number) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Nationalité × Genre */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <h4 className="text-base font-bold text-gray-900 dark:text-white mb-5">Répartition par Nationalité</h4>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={data?.byNationality || []} margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="label" type="category" width={100} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', color: '#fff', borderRadius: '12px', border: 'none' }} />
                  <Legend />
                  <Bar dataKey="male"   name="Hommes" fill="#0EA5E9" radius={[0, 8, 8, 0]} />
                  <Bar dataKey="female" name="Femmes" fill="#EC4899" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Regroupement CSP */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-base font-bold text-gray-900 dark:text-white">Regroupement Socio-Professionnel (CSP)</h4>
            </div>
            {data?.hasConvention === false ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-10 text-center">
                Aucune convention collective configurée pour cette entreprise — cette répartition n'est disponible qu'avec une convention active.
              </p>
            ) : (
              <>
                <p className="text-xs text-gray-400 mb-5">Estimation basée sur la grille conventionnelle — pas une classification légale</p>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data?.csp || []}
                        dataKey="count"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        label
                      >
                        {(data?.csp || []).map((_: CategoryData, idx: number) => (
                          <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1f2937', color: '#fff', borderRadius: '12px', border: 'none' }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>

          {/* Catégorie / Échelon conventionnel */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <h4 className="text-base font-bold text-gray-900 dark:text-white mb-5">Effectif par Catégorie / Échelon</h4>
            <div className="h-[280px] overflow-y-auto pr-1">
              {(data?.byCategory || []).length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-10">Aucune catégorie renseignée pour le moment.</p>
              ) : (
                <div className="space-y-2.5">
                  {data!.byCategory!.map((c: CategoryData, idx: number) => {
                    const max = Math.max(...data!.byCategory!.map((x: CategoryData) => x.count));
                    return (
                      <div key={c.label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-semibold text-gray-700 dark:text-gray-300">{c.label}</span>
                          <span className="text-gray-400">{c.count}</span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${(c.count / max) * 100}%`, backgroundColor: COLORS[idx % COLORS.length] }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* 🆕 KPI BILAN SOCIAL */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">KPI Bilan Social</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Turnover détaillé et absentéisme — indicateurs RH classiques</p>

        {/* Cartes Absentéisme */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Activity size={16} className="text-rose-500" />
              <span className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Taux d'absentéisme</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{data?.absenteeism?.rate ?? 0}%</p>
            <p className="text-xs text-gray-400 mt-1">
              {data?.absenteeism?.totalAbsenceDays ?? 0} j. d'absence / {data?.absenteeism?.theoreticalWorkingDays ?? 0} j. ouvrés théoriques (12 mois)
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={16} className="text-amber-500" />
              <span className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Durée moyenne d'absence</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{data?.absenteeism?.avgDurationDays ?? 0} j.</p>
            <p className="text-xs text-gray-400 mt-1">{data?.absenteeism?.totalAbsenceCount ?? 0} absence(s) enregistrée(s) sur 12 mois</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <LogOut size={16} className="text-sky-500" />
              <span className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Motifs de départ enregistrés</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{data?.turnoverDetail?.recordedRuptures ?? 0}</p>
            <p className="text-xs text-gray-400 mt-1">via le module rupture de contrat (12 mois)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

          {/* Turnover mensuel */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <h4 className="text-base font-bold text-gray-900 dark:text-white mb-1">Turnover Mensuel (12 mois)</h4>
            <p className="text-xs text-gray-400 mb-5">Départs du mois / effectif moyen du mois × 100</p>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.turnoverDetail?.monthly || []} margin={{ left: 0, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} unit="%" />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', color: '#fff', borderRadius: '12px', border: 'none' }} />
                  <Line type="monotone" dataKey="rate" name="Turnover" stroke="#EF4444" strokeWidth={3} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Turnover par motif */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <h4 className="text-base font-bold text-gray-900 dark:text-white mb-1">Départs par Motif (12 mois)</h4>
            <p className="text-xs text-gray-400 mb-5">Source : dossiers de rupture de contrat validés</p>
            {(data?.turnoverDetail?.byMotif || []).length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-16">Aucune rupture de contrat enregistrée sur les 12 derniers mois.</p>
            ) : (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={data?.turnoverDetail?.byMotif || []} margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="label" type="category" width={140} axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', color: '#fff', borderRadius: '12px', border: 'none' }} />
                    <Bar dataKey="count" name="Départs" radius={[0, 8, 8, 0]}>
                      {(data?.turnoverDetail?.byMotif || []).map((_: TurnoverMotif, idx: number) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Turnover par département */}
          {(data?.turnoverDetail?.byDepartment || []).length > 0 && (
            <div className="xl:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <h4 className="text-base font-bold text-gray-900 dark:text-white mb-5">Départs par Département (12 mois)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {data!.turnoverDetail!.byDepartment.map((d: TurnoverByDept, idx: number) => (
                  <div key={d.department} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{d.department}</span>
                    <span
                      className="text-sm font-black px-2.5 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    >
                      {d.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
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
                    {(() => {
                      const buckets = data?.pyramid || [];
                      const dominant = buckets.reduce((max: PyramidData | null, b: PyramidData) =>
                        (b.male + b.female) > ((max?.male || 0) + (max?.female || 0)) ? b : max, null as PyramidData | null);
                      if (!dominant) return 'Pas encore assez de données pour analyser la pyramide des âges.';
                      return `La pyramide des âges montre une concentration dans la tranche ${dominant.label}. ${
                        dominant.label.includes('55') || dominant.label.includes('60')
                          ? 'Anticipez la relève avec des profils plus juniors.'
                          : 'Surveillez l\'équilibre entre les générations à moyen terme.'
                      }`;
                    })()}
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
                    {(() => {
                      const trend = data?.trend || [];
                      if (trend.length < 2) return "Pas encore assez d'historique pour dégager une tendance.";
                      const first = trend[0].total;
                      const last  = trend[trend.length - 1].total;
                      const delta = last - first;
                      if (delta === 0) return "L'effectif est resté stable sur les 12 derniers mois.";
                      const pct = first > 0 ? Math.abs(Math.round((delta / first) * 100)) : 0;
                      return delta > 0
                        ? `L'effectif a progressé de ${delta} personne(s) (+${pct}%) sur 12 mois. Anticipez les besoins RH liés à cette croissance.`
                        : `L'effectif a reculé de ${Math.abs(delta)} personne(s) (-${pct}%) sur 12 mois. Identifiez les causes de ces départs.`;
                    })()}
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