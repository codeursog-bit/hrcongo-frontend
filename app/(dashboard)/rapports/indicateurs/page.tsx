'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Loader2, Building2, ClipboardList, LayoutDashboard, UsersRound,
  UmbrellaOff, BookOpen, DollarSign, UserCircle, BarChart3, Maximize2, X,
  Users2, Wallet, GraduationCap, UserPlus, Target, CalendarDays, Hourglass,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, LineChart, Line, AreaChart, Area,
} from 'recharts';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';

const COLORS = ['#0EA5E9', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1', '#F97316', '#14B8A6'];
const GOAL_COLORS: Record<string, string> = { NOT_STARTED: '#94A3B8', IN_PROGRESS: '#0EA5E9', COMPLETED: '#10B981', CANCELLED: '#EF4444' };
const REVIEW_COLORS: Record<string, string> = { DRAFT: '#94A3B8', SUBMITTED: '#0EA5E9', ACKNOWLEDGED: '#10B981' };
const TOOLTIP_STYLE = { backgroundColor: '#1f2937', color: '#fff', borderRadius: '12px', border: 'none' };

interface TileDef {
  key: string;
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  render: (big: boolean) => React.ReactNode;
}

export default function IndicateursRhPage() {
  const router = useRouter();
  const { bp } = useBasePath();
  const [workforce, setWorkforce] = useState<any>(null);
  const [departments, setDepartments] = useState<any>(null);
  const [leaves, setLeaves] = useState<any>(null);
  const [performance, setPerformance] = useState<any>(null);
  const [recruitment, setRecruitment] = useState<any>(null);
  const [training, setTraining] = useState<any>(null);
  const [payroll, setPayroll] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [w, d, l, p, r, t, pay] = await Promise.all([
          api.get('/reports/workforce'),
          api.get('/reports/department-traceability'),
          api.get('/reports/leaves'),
          api.get('/reports/performance-indicators'),
          api.get('/reports/recruitment-indicators'),
          api.get('/reports/training-indicators'),
          api.get('/reports/payroll'),
        ]);
        setWorkforce(w); setDepartments(d); setLeaves(l);
        setPerformance(p); setRecruitment(r); setTraining(t); setPayroll(pay);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-sky-500" size={48} />
      </div>
    );
  }

  const goalData     = (performance?.goals?.byStatus || []).filter((g: any) => g.count > 0);
  const reviewData   = (performance?.reviews?.byStatus || []).filter((r: any) => r.count > 0);
  const offersData   = (recruitment?.offersByStatus || []).filter((o: any) => o.count > 0);
  const decisionData = (recruitment?.candidatesByDecision || []).filter((c: any) => c.count > 0);
  const trainingStatusData = (training?.sessionsByStatus || []).filter((s: any) => s.count > 0);
  const deptRows = departments?.departments || [];

  // ══ Définition des tuiles — chacune est un graphe pur, rien d'autre ══
  const tiles: TileDef[] = [
    {
      key: 'agePyramid', title: 'Pyramide des Âges', subtitle: 'Effectif par tranche d\'âge et genre', icon: Users2,
      render: (big) => (
        <ResponsiveContainer width="100%" height={big ? 480 : 260}>
          <BarChart layout="vertical" data={workforce?.pyramid || []} margin={{ left: 10, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" hide />
            <YAxis dataKey="label" type="category" width={80} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend />
            <Bar dataKey="male"   name="Hommes" fill="#0EA5E9" radius={[0, 8, 8, 0]} />
            <Bar dataKey="female" name="Femmes" fill="#EC4899" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    {
      key: 'seniorityPyramid', title: "Pyramide de l'Ancienneté", subtitle: 'Depuis combien de temps l\'effectif est en poste', icon: Hourglass,
      render: (big) => (
        <ResponsiveContainer width="100%" height={big ? 480 : 260}>
          <BarChart layout="vertical" data={workforce?.seniority || []} margin={{ left: 10, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" hide />
            <YAxis dataKey="label" type="category" width={80} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend />
            <Bar dataKey="male"   name="Hommes" fill="#8B5CF6" radius={[0, 8, 8, 0]} />
            <Bar dataKey="female" name="Femmes" fill="#F59E0B" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    {
      key: 'headcountTrend', title: 'Évolution des Effectifs', subtitle: '12 derniers mois', icon: UsersRound,
      render: (big) => (
        <ResponsiveContainer width="100%" height={big ? 480 : 260}>
          <AreaChart data={workforce?.trend || []}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Area type="monotone" dataKey="total" name="Effectif" stroke="#0EA5E9" fill="url(#colorTotal)" strokeWidth={3} />
          </AreaChart>
        </ResponsiveContainer>
      ),
    },
    {
      key: 'turnoverTrend', title: 'Turnover Mensuel', subtitle: 'Départs / effectif moyen × 100', icon: BarChart3,
      render: (big) => (
        <ResponsiveContainer width="100%" height={big ? 480 : 260}>
          <LineChart data={workforce?.turnoverDetail?.monthly || []}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} unit="%" />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Line type="monotone" dataKey="rate" name="Turnover" stroke="#EF4444" strokeWidth={3} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      ),
    },
    {
      key: 'deptHeadcount', title: 'Effectif par Département', icon: Building2,
      render: (big) => (
        <ResponsiveContainer width="100%" height={big ? 480 : 260}>
          <BarChart layout="vertical" data={deptRows} margin={{ left: 10, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" width={110} axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="headcount" name="Effectif" radius={[0, 8, 8, 0]}>
              {deptRows.map((d: any, idx: number) => <Cell key={idx} fill={d.color || COLORS[idx % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    {
      key: 'deptCost', title: 'Coût Employeur par Département', icon: Wallet,
      render: (big) => (
        <ResponsiveContainer width="100%" height={big ? 480 : 260}>
          <BarChart layout="vertical" data={deptRows} margin={{ left: 10, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" width={110} axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => `${Math.round(v).toLocaleString('fr-FR')} FCFA`} />
            <Bar dataKey="totalEmployerCost" name="Coût employeur" radius={[0, 8, 8, 0]}>
              {deptRows.map((d: any, idx: number) => <Cell key={idx} fill={d.color || COLORS[idx % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    {
      key: 'payrollTrend', title: 'Masse Salariale', subtitle: 'Brut / Net / Charges (millions FCFA)', icon: DollarSign,
      render: (big) => (
        <ResponsiveContainer width="100%" height={big ? 480 : 260}>
          <LineChart data={payroll?.trend || []}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend />
            <Line type="monotone" dataKey="brut"    name="Brut"    stroke="#0EA5E9" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="net"      name="Net"     stroke="#10B981" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="charges" name="Charges" stroke="#F59E0B" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      ),
    },
    {
      key: 'leaveDistribution', title: 'Répartition des Congés', subtitle: 'Par type', icon: UmbrellaOff,
      render: (big) => (
        <ResponsiveContainer width="100%" height={big ? 480 : 260}>
          <PieChart>
            <Pie data={leaves?.distribution || []} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={big ? 90 : 50} outerRadius={big ? 160 : 90} label>
              {(leaves?.distribution || []).map((d: any, idx: number) => <Cell key={idx} fill={d.color || COLORS[idx % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ),
    },
    {
      key: 'leaveSeasonal', title: 'Saisonnalité des Congés', subtitle: 'Annuel vs Maladie — 12 mois', icon: CalendarDays,
      render: (big) => (
        <ResponsiveContainer width="100%" height={big ? 480 : 260}>
          <AreaChart data={leaves?.seasonal || []}>
            <defs>
              <linearGradient id="colorAnnual2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.3} /><stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} /></linearGradient>
              <linearGradient id="colorSick2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} /><stop offset="95%" stopColor="#EF4444" stopOpacity={0} /></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend />
            <Area type="monotone" dataKey="Annual" name="Congé annuel" stroke="#0EA5E9" fill="url(#colorAnnual2)" strokeWidth={2} />
            <Area type="monotone" dataKey="Sick"   name="Maladie"      stroke="#EF4444" fill="url(#colorSick2)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      ),
    },
    {
      key: 'goalsByStatus', title: 'Objectifs par Statut', subtitle: 'Module Performance', icon: Target,
      render: (big) => goalData.length === 0 ? <EmptyChart label="Aucun objectif enregistré" big={big} /> : (
        <ResponsiveContainer width="100%" height={big ? 480 : 260}>
          <PieChart>
            <Pie data={goalData} dataKey="count" nameKey="label" cx="50%" cy="50%" innerRadius={big ? 90 : 45} outerRadius={big ? 160 : 85} label>
              {goalData.map((g: any, idx: number) => <Cell key={idx} fill={GOAL_COLORS[g.status] || COLORS[idx % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ),
    },
    {
      key: 'reviewsByStatus', title: 'Entretiens par Statut', subtitle: 'Module Performance', icon: ClipboardList,
      render: (big) => reviewData.length === 0 ? <EmptyChart label="Aucun entretien cette année" big={big} /> : (
        <ResponsiveContainer width="100%" height={big ? 480 : 260}>
          <BarChart layout="vertical" data={reviewData} margin={{ left: 10, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" hide />
            <YAxis dataKey="label" type="category" width={120} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="count" name="Entretiens" radius={[0, 8, 8, 0]}>
              {reviewData.map((r: any, idx: number) => <Cell key={idx} fill={REVIEW_COLORS[r.status] || COLORS[idx % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    {
      key: 'candidatesTrend', title: 'Candidatures Reçues', subtitle: '6 derniers mois', icon: UserPlus,
      render: (big) => (
        <ResponsiveContainer width="100%" height={big ? 480 : 260}>
          <BarChart data={recruitment?.candidatesTrend || []}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="count" name="Candidatures" fill="#6366F1" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    {
      key: 'candidatesDecision', title: 'Candidatures par Décision', icon: UserPlus,
      render: (big) => decisionData.length === 0 ? <EmptyChart label="Aucune candidature récente" big={big} /> : (
        <ResponsiveContainer width="100%" height={big ? 480 : 260}>
          <PieChart>
            <Pie data={decisionData} dataKey="count" nameKey="label" cx="50%" cy="50%" innerRadius={big ? 90 : 50} outerRadius={big ? 160 : 90} label>
              {decisionData.map((d: any, idx: number) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ),
    },
    {
      key: 'offersByStatus', title: "Offres d'Emploi par Statut", icon: UserPlus,
      render: (big) => offersData.length === 0 ? <EmptyChart label="Aucune offre publiée" big={big} /> : (
        <ResponsiveContainer width="100%" height={big ? 480 : 260}>
          <BarChart data={offersData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="count" name="Offres" radius={[8, 8, 0, 0]}>
              {offersData.map((o: any, idx: number) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    {
      key: 'trainingByStatus', title: 'Formations par Statut', icon: GraduationCap,
      render: (big) => trainingStatusData.length === 0 ? <EmptyChart label="Aucune formation enregistrée" big={big} /> : (
        <ResponsiveContainer width="100%" height={big ? 480 : 260}>
          <PieChart>
            <Pie data={trainingStatusData} dataKey="count" nameKey="label" cx="50%" cy="50%" innerRadius={big ? 90 : 50} outerRadius={big ? 160 : 90} label>
              {trainingStatusData.map((s: any, idx: number) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ),
    },
    {
      key: 'trainingCostByCategory', title: 'Coût des Formations par Catégorie', icon: GraduationCap,
      render: (big) => (training?.byCategory || []).length === 0 ? <EmptyChart label="Aucun coût de formation enregistré" big={big} /> : (
        <ResponsiveContainer width="100%" height={big ? 480 : 260}>
          <BarChart layout="vertical" data={training?.byCategory || []} margin={{ left: 10, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" hide />
            <YAxis dataKey="label" type="category" width={120} axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => `${Math.round(v).toLocaleString('fr-FR')} FCFA`} />
            <Bar dataKey="cost" name="Coût" radius={[0, 8, 8, 0]}>
              {(training?.byCategory || []).map((_: any, idx: number) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ),
    },
  ];

  const activeTile = tiles.find(t => t.key === expanded);

  return (
    <div className="max-w-[1600px] mx-auto pb-20 space-y-8">

      {/* HEADER */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(bp('/rapports'))}
            className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
          >
            <ArrowLeft size={20} className="text-gray-500" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Indicateurs RH
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Recrutement, effectifs, départements, coûts, formations — clique un graphe pour l'agrandir
            </p>
          </div>
        </div>
      </div>

      {/* NAVIGATION RAPPORTS */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
        {[
          { href: '/rapports',                label: "Vue d'ensemble", Icon: LayoutDashboard },
          { href: '/rapports/complet',        label: 'Rapport Complet', Icon: ClipboardList },
          { href: '/rapports/analyse-paie',   label: 'Paie & Coûts',   Icon: DollarSign },
          { href: '/rapports/effectifs',      label: 'Effectifs',       Icon: UsersRound },
          { href: '/rapports/departements',   label: 'Départements',    Icon: Building2 },
          { href: '/rapports/employes',       label: 'Employés',        Icon: UserCircle },
          { href: '/rapports/analyse-conges', label: 'Congés',          Icon: UmbrellaOff },
          { href: '/rapports/indicateurs',    label: 'Indicateurs RH',  Icon: BarChart3, active: true },
          { href: '/rapports/comptabilite',   label: 'Comptabilité',    Icon: BookOpen },
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
            <item.Icon size={16} />
            {item.label}
          </button>
        ))}
      </div>

      {/* GRILLE DE GRAPHES — c'est tout ce que cette page affiche */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tiles.map((tile) => (
          <button
            key={tile.key}
            onClick={() => setExpanded(tile.key)}
            className="group text-left bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-sky-300 dark:hover:border-sky-500/50 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <tile.icon size={17} className="text-sky-500" />
                <div>
                  <h4 className="text-base font-bold text-gray-900 dark:text-white">{tile.title}</h4>
                  {tile.subtitle && <p className="text-xs text-gray-400">{tile.subtitle}</p>}
                </div>
              </div>
              <Maximize2 size={15} className="text-gray-300 group-hover:text-sky-500 transition-colors shrink-0 mt-1" />
            </div>
            {tile.render(false)}
          </button>
        ))}
      </div>

      {/* MODALE DE DÉTAIL */}
      {activeTile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setExpanded(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-4xl p-8 relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setExpanded(null)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <X size={18} className="text-gray-500 dark:text-gray-300" />
            </button>
            <div className="flex items-center gap-2 mb-1">
              <activeTile.icon size={20} className="text-sky-500" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{activeTile.title}</h3>
            </div>
            {activeTile.subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{activeTile.subtitle}</p>}
            {activeTile.render(true)}
          </div>
        </div>
      )}

    </div>
  );
}

function EmptyChart({ label, big }: { label: string; big: boolean }) {
  return (
    <div className="flex items-center justify-center text-sm text-gray-400 dark:text-gray-500" style={{ height: big ? 480 : 260 }}>
      {label}
    </div>
  );
}