'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Users, UserPlus, TrendingDown, TrendingUp, Clock, 
  Calendar, Loader2, Building2, Award, Target, AlertCircle, ClipboardList, LayoutDashboard,UsersRound,
  UmbrellaOff,BookOpen, DollarSign, Hourglass, AlertTriangle, CheckCircle2, Activity, LogOut, UserCircle, BarChart3,
  Globe, Briefcase, SlidersHorizontal, ChevronDown, ChevronUp,
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, ReferenceLine, PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import { api } from '@/services/api';
 import { useBasePath } from '@/hooks/useBasePath';
import RapportsSubNav from '@/components/RapportsSubNav';
import SlideOver from '@/components/SlideOver'; // 🆕 panneau détail nationalité
import EffectifMonthlyList from '@/components/reports/EffectifMonthlyList'; // 🆕 liste mensuelle séparée
import { FancySelect } from '@/components/ui/FancySelect'; // 🆕 filtres du rapport
import { NATIONALITIES } from '@/lib/nationalities'; // 🆕 filtre nationalité

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

// 🆕 Détail par nationalité (un pays réel, plus le bloc binaire Congolais/Étranger)
interface NationalityData { label: string; male: number; female: number; count: number; }
interface NationalitySummary {
  distinctCount: number;
  foreignCount: number;
  foreignPercentage: number;
  unspecifiedCount: number;
}
interface NationalityEmployee {
  id: string;
  name: string;
  position: string;
  department: string | null;
  hireDate: string;
  gender: string;
}

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
  trendPreviousYear?: { month: string; total: number }[]; // 🆕
  yearlyHeadcount?: { year: number; total: number }[];     // 🆕
  availableYears?: number[];           // 🆕
  selectedYear?: number;               // 🆕
  insights?: { type: 'success' | 'warning' | 'info'; title: string; message: string }[]; // 🆕
  byContractType?: ContractTypeData[]; // 🆕
  byNationality?: NationalityData[];   // 🆕
  nationalitySummary?: NationalitySummary; // 🆕
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

  // 🆕 Filtres du rapport (repliables pour ne pas surcharger l'en-tête)
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [reportFilters, setReportFilters] = useState({
    department: 'Tous',
    contractType: 'Tous',
    nationality: 'Tous',
    year: new Date().getFullYear(),
  });

  // 🆕 Panneau latéral "Détail nationalité" — évite de surcharger la page principale
  const [selectedNationality, setSelectedNationality] = useState<string | null>(null);
  const [nationalityEmployees, setNationalityEmployees] = useState<NationalityEmployee[]>([]);
  const [nationalityLoading, setNationalityLoading] = useState(false);

  const openNationalityDetail = async (label: string) => {
    setSelectedNationality(label);
    setNationalityLoading(true);
    try {
      const res = await api.get<NationalityEmployee[]>(
        `/reports/workforce/nationality/${encodeURIComponent(label)}`
      );
      setNationalityEmployees(res || []);
    } catch (e) {
      console.error('Erreur chargement détail nationalité', e);
      setNationalityEmployees([]);
    } finally {
      setNationalityLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (reportFilters.department !== 'Tous') params.set('department', reportFilters.department);
        if (reportFilters.contractType !== 'Tous') params.set('contractType', reportFilters.contractType);
        if (reportFilters.nationality !== 'Tous') params.set('nationality', reportFilters.nationality);
        params.set('year', String(reportFilters.year));

        const [workforceRes, deptRes, topRes] = await Promise.all([
          api.get(`/reports/workforce?${params}`),
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
  }, [reportFilters]);

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

      {/* 🆕 FILTRES DU RAPPORT — repliable pour ne pas surcharger la page */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <button
          onClick={() => setFiltersOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-4"
        >
          <div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
            <SlidersHorizontal size={16} className="text-sky-500" />
            Filtres du rapport
            <span className="text-xs font-normal text-gray-400">
              — Année {reportFilters.year}
              {reportFilters.department !== 'Tous' ? ` · ${reportFilters.department}` : ''}
              {reportFilters.contractType !== 'Tous' ? ` · ${reportFilters.contractType}` : ''}
              {reportFilters.nationality !== 'Tous' ? ` · ${reportFilters.nationality}` : ''}
            </span>
          </div>
          {filtersOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
        </button>
        {filtersOpen && (
          <div className="px-5 pb-5 flex flex-wrap items-end gap-3 border-t border-gray-100 dark:border-gray-700 pt-4">
            <div className="w-40">
              <FancySelect
                label="Année"
                value={String(reportFilters.year)}
                onChange={(v) => setReportFilters((prev) => ({ ...prev, year: parseInt(v, 10) }))}
                icon={Calendar}
                options={(data?.availableYears?.length ? data.availableYears : [new Date().getFullYear()]).map((y) => ({ value: String(y), label: String(y) }))}
              />
            </div>
            <div className="w-48">
              <FancySelect
                label="Département"
                value={reportFilters.department}
                onChange={(v) => setReportFilters((prev) => ({ ...prev, department: v }))}
                icon={Building2}
                placeholder="Tous"
                options={[{ value: 'Tous', label: 'Tous' }, ...departments.map((d) => ({ value: d.name, label: d.name }))]}
              />
            </div>
            <div className="w-48">
              <FancySelect
                label="Contrat"
                value={reportFilters.contractType}
                onChange={(v) => setReportFilters((prev) => ({ ...prev, contractType: v }))}
                icon={Briefcase}
                placeholder="Tous"
                options={[
                  { value: 'Tous', label: 'Tous' }, { value: 'CDI', label: 'CDI' },
                  { value: 'CDD', label: 'CDD' }, { value: 'STAGE', label: 'Stage' },
                  { value: 'INTERIM', label: 'Intérim' },
                  { value: 'CONSULTANT', label: 'Consultant' },
                  { value: 'PRESTATAIRE', label: 'Prestataire' },
                ]}
              />
            </div>
            <div className="w-48">
              <FancySelect
                label="Nationalité"
                value={reportFilters.nationality}
                onChange={(v) => setReportFilters((prev) => ({ ...prev, nationality: v }))}
                icon={Globe}
                placeholder="Toutes"
                options={[
                  { value: 'Tous', label: 'Toutes' },
                  ...NATIONALITIES.map((n) => ({ value: n, label: n })),
                  { value: 'Non renseigné', label: 'Non renseigné' },
                ]}
              />
            </div>
            {(reportFilters.department !== 'Tous' || reportFilters.contractType !== 'Tous' || reportFilters.nationality !== 'Tous') && (
              <button
                onClick={() => setReportFilters((prev) => ({ ...prev, department: 'Tous', contractType: 'Tous', nationality: 'Tous' }))}
                className="text-xs font-bold text-red-500 hover:text-red-600 px-3 py-2.5"
              >
                Réinitialiser
              </button>
            )}
          </div>
        )}
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
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            Évolution de l'Effectif — {reportFilters.year}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            Comparé à {reportFilters.year - 1} (pointillés)
          </p>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              {(() => {
                const trendCur = data?.trend || [];
                const trendPrev = data?.trendPreviousYear || [];
                const merged = trendCur.map((t, idx) => ({
                  month: t.month,
                  total: t.total,
                  totalPrevYear: trendPrev[idx]?.total,
                }));
                return (
                  <AreaChart data={merged}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
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
                      dataKey="total" 
                      name={String(reportFilters.year)}
                      stroke="#0EA5E9" 
                      strokeWidth={3}
                      fill="url(#colorTotal)" 
                    />
                    <Area
                      type="monotone"
                      dataKey="totalPrevYear"
                      name={String(reportFilters.year - 1)}
                      stroke="#94A3B8"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      fill="none"
                    />
                  </AreaChart>
                );
              })()}
            </ResponsiveContainer>
          </div>
        </div>

        {/* 🆕 Historique pluriannuel — combien on avait chaque année */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            Évolution sur 5 ans
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            Effectif au 31 décembre de chaque année (aujourd'hui pour l'année en cours)
          </p>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.yearlyHeadcount || []} margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="year" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    color: '#fff', 
                    borderRadius: '12px', 
                    border: 'none' 
                  }} 
                />
                <Bar dataKey="total" name="Effectif" radius={[8, 8, 0, 0]}>
                  {(data?.yearlyHeadcount || []).map((yh, idx) => (
                    <Cell key={idx} fill={yh.year === reportFilters.year ? '#0EA5E9' : '#93C5FD'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pyramide des Âges */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            Pyramide des Âges
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            Femmes à gauche, hommes à droite — par tranche d'âge
          </p>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              {(() => {
                const pyramidSrc = data?.pyramid || [];
                const pyramidData = pyramidSrc.map((b: PyramidData) => ({ ...b, femaleNeg: -b.female }));
                const maxSide = Math.max(1, ...pyramidSrc.map((b: PyramidData) => Math.max(b.male, b.female)));
                const axisMax = Math.ceil(maxSide * 1.15);
                return (
                  <BarChart 
                    layout="vertical" 
                    data={pyramidData} 
                    margin={{ left: 20, right: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" domain={[-axisMax, axisMax]} tickFormatter={(v: number) => String(Math.abs(v))} allowDecimals={false} />
                    <YAxis 
                      dataKey="label" 
                      type="category" 
                      width={60} 
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      formatter={(value: any, name: any) => [Math.abs(value), name]}
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
                      dataKey="femaleNeg" 
                      name="Femmes" 
                      fill="#EC4899" 
                      radius={[8, 0, 0, 8]}
                    />
                    <Bar 
                      dataKey="male" 
                      name="Hommes" 
                      fill="#0EA5E9" 
                      radius={[0, 8, 8, 0]}
                    />
                  </BarChart>
                );
              })()}
            </ResponsiveContainer>
          </div>
        </div>

        {/* 🆕 Pyramide de l'Ancienneté */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            Pyramide de l'Ancienneté
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            Femmes à gauche, hommes à droite — depuis combien de temps l'effectif est-il en poste ?
          </p>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              {(() => {
                const senioritySrc = data?.seniority || [];
                const seniorityData = senioritySrc.map((b: PyramidData) => ({ ...b, femaleNeg: -b.female }));
                const maxSide = Math.max(1, ...senioritySrc.map((b: PyramidData) => Math.max(b.male, b.female)));
                const axisMax = Math.ceil(maxSide * 1.15);
                return (
                  <BarChart 
                    layout="vertical" 
                    data={seniorityData} 
                    margin={{ left: 20, right: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" domain={[-axisMax, axisMax]} tickFormatter={(v: number) => String(Math.abs(v))} allowDecimals={false} />
                    <YAxis 
                      dataKey="label" 
                      type="category" 
                      width={80} 
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      formatter={(value: any, name: any) => [Math.abs(value), name]}
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        color: '#fff', 
                        borderRadius: '12px', 
                        border: 'none' 
                      }} 
                    />
                    <Legend />
                    <ReferenceLine x={0} stroke="#64748b" strokeWidth={2} />
                    <Bar dataKey="femaleNeg" name="Femmes" fill="#F59E0B" radius={[8, 0, 0, 8]} />
                    <Bar dataKey="male"      name="Hommes" fill="#8B5CF6" radius={[0, 8, 8, 0]} />
                  </BarChart>
                );
              })()}
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

          {/* 🆕 Nationalité — détail réel par pays, cliquable pour voir la liste */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Globe size={17} className="text-teal-500" /> Répartition par Nationalité
              </h4>
            </div>
            {data?.nationalitySummary && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                <strong className="text-gray-900 dark:text-white">{data.nationalitySummary.distinctCount}</strong> nationalité{data.nationalitySummary.distinctCount > 1 ? 's' : ''} différente{data.nationalitySummary.distinctCount > 1 ? 's' : ''} dans l'effectif —{' '}
                <strong className="text-gray-900 dark:text-white">{data.nationalitySummary.foreignPercentage}%</strong> de salariés étrangers
                {data.nationalitySummary.unspecifiedCount > 0 && (
                  <> · {data.nationalitySummary.unspecifiedCount} fiche{data.nationalitySummary.unspecifiedCount > 1 ? 's' : ''} sans nationalité renseignée</>
                )}
              </p>
            )}
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">Cliquez sur une barre pour voir le détail des employés</p>
            <div style={{ height: Math.max(220, (data?.byNationality?.length || 0) * 34) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={data?.byNationality || []}
                  margin={{ left: 10, right: 30 }}
                  onClick={(state: any) => {
                    const label = state?.activePayload?.[0]?.payload?.label;
                    if (label) openNationalityDetail(label);
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" hide allowDecimals={false} />
                  <YAxis dataKey="label" type="category" width={110} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', color: '#fff', borderRadius: '12px', border: 'none' }}
                    formatter={(value: any, _name: any, item: any) => [
                      `${value} (${item?.payload?.male ?? 0} H · ${item?.payload?.female ?? 0} F)`,
                      'Employés',
                    ]}
                  />
                  <Bar dataKey="count" name="Employés" radius={[0, 8, 8, 0]} cursor="pointer">
                    {(data?.byNationality || []).map((_: NationalityData, idx: number) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Bar>
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
          <h3 className="text-lg font-bold mb-1">Conseils RH — Assistant Effectifs</h3>
          <p className="text-sm text-sky-100 mb-4">Généré automatiquement à partir des données de {data?.selectedYear || new Date().getFullYear()}</p>

          <div className="space-y-4">
            {(!data?.insights || data.insights.length === 0) && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-sm text-sky-50 leading-relaxed">
                  Pas encore assez de données pour générer des conseils. Revenez lorsque l'effectif aura un peu plus d'historique.
                </p>
              </div>
            )}
            {data?.insights?.map((insight: { type: 'success' | 'warning' | 'info'; title: string; message: string }, idx: number) => {
              const InsightIcon = insight.type === 'warning' ? AlertTriangle : insight.type === 'success' ? CheckCircle2 : Target;
              return (
                <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <InsightIcon size={20} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold mb-1">{insight.title}</p>
                      <p className="text-sm text-sky-50 leading-relaxed">{insight.message}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 🆕 Composant séparé (Phase 4) — liste des employés par mois/année */}
      <EffectifMonthlyList
        availableYears={data?.availableYears}
        department={reportFilters.department}
        contractType={reportFilters.contractType}
        nationality={reportFilters.nationality}
      />

      {/* 🆕 Panneau latéral — détail des employés d'une nationalité */}
      <SlideOver
        open={!!selectedNationality}
        onClose={() => setSelectedNationality(null)}
        title={selectedNationality || ''}
        subtitle={`${nationalityEmployees.length} employé${nationalityEmployees.length > 1 ? 's' : ''}`}
      >
        {nationalityLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-sky-500" />
          </div>
        ) : nationalityEmployees.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-12">Aucun employé trouvé pour cette nationalité.</p>
        ) : (
          <div className="space-y-2">
            {nationalityEmployees.map((e) => (
              <div key={e.id} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{e.name}</p>
                  <span className="text-[10px] uppercase font-bold tracking-wide px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 shrink-0">
                    {e.gender === 'MALE' ? 'H' : e.gender === 'FEMALE' ? 'F' : '—'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {e.position}{e.department ? ` · ${e.department}` : ''}
                </p>
                {e.hireDate && (
                  <p className="text-[11px] text-gray-400 mt-1">
                    Embauché(e) le {new Date(e.hireDate).toLocaleDateString('fr-FR')}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </SlideOver>
    </div>
  );
}