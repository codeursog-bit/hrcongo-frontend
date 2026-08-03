'use client';

// ============================================================================
// 📁 components/absences/AbsencesOverview.tsx
// ✅ Onglet "Vue d'ensemble" de la page Gestion des absences — même modèle
//    que PermissionsOverview / LoansOverview (KPI, dernières demandes
//    filtrables, dernières demandes approuvées, graphiques, navigation
//    vers Suivi / Demandes).
// ============================================================================

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useBasePath } from '@/hooks/useBasePath';
import {
  Clock, CheckCircle2, TrendingUp, Filter, ChevronRight, Users2, LineChart as LineChartIcon, ListChecks,
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';

const TYPE_LABEL: Record<string, string> = { MALADIE: 'Maladie', CONVENTIONNELLE: 'Conventionnelle', EXCEPTIONNELLE: 'Exceptionnelle' };
const TYPE_COLOR: Record<string, string> = { MALADIE: '#ef4444', CONVENTIONNELLE: '#8b5cf6', EXCEPTIONNELLE: '#f59e0b' };

type Props = {
  requests: any[];
  onSelectEmployee: (emp: any) => void;
  onGoToRequest: (id: string) => void;
};

export default function AbsencesOverview({ requests, onSelectEmployee, onGoToRequest }: Props) {
  const { bp } = useBasePath();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [typeFilter, setTypeFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [showAll, setShowAll] = useState(false);

  const sorted = useMemo(() => [...requests].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [requests]);

  const departments = useMemo(() => Array.from(new Set(requests.map(r => r.employee?.department?.name).filter(Boolean))).sort(), [requests]);

  const filtered = useMemo(() => sorted.filter(r =>
    (!typeFilter || r.type === typeFilter) && (!deptFilter || r.employee?.department?.name === deptFilter),
  ), [sorted, typeFilter, deptFilter]);

  const kpis = useMemo(() => {
    const thisMonth = requests.filter(r => { const d = new Date(r.createdAt); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
    return {
      countThisMonth: thisMonth.length,
      approvedThisMonth: thisMonth.filter(r => r.status === 'APPROVED').length,
      totalApproved: requests.filter(r => r.status === 'APPROVED').length,
      pending: requests.filter(r => r.status === 'PENDING').length,
    };
  }, [requests, now]);

  const recentlyApproved = useMemo(() =>
    requests.filter(r => r.status === 'APPROVED')
      .sort((a, b) => new Date(b.reviewedAt ?? b.createdAt).getTime() - new Date(a.reviewedAt ?? a.createdAt).getTime())
      .slice(0, 5),
  [requests]);

  const availableYears = useMemo(() => {
    const set = new Set<number>([now.getFullYear()]);
    requests.forEach(r => set.add(new Date(r.createdAt).getFullYear()));
    return Array.from(set).sort((a, b) => b - a);
  }, [requests, now]);

  const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
  const monthlySeries = useMemo(() => MONTHS_FR.map((label, idx) => {
    const inMonth = requests.filter(r => { const d = new Date(r.createdAt); return d.getFullYear() === year && d.getMonth() === idx; });
    return { mois: label, Demandées: inMonth.length, Approuvées: inMonth.filter(r => r.status === 'APPROVED').length };
  }), [requests, year]);

  const byType = useMemo(() => {
    const map: Record<string, number> = {};
    requests.forEach(r => { map[r.type] = (map[r.type] ?? 0) + 1; });
    return Object.entries(map).map(([type, value]) => ({ type, name: TYPE_LABEL[type] ?? type, value }));
  }, [requests]);

  const byDept = useMemo(() => {
    const map: Record<string, number> = {};
    requests.forEach(r => { const n = r.employee?.department?.name || 'Sans département'; map[n] = (map[n] ?? 0) + 1; });
    return Object.entries(map).map(([departement, nombre]) => ({ departement, nombre })).sort((a, b) => b.nombre - a.nombre).slice(0, 5);
  }, [requests]);

  const displayed = showAll ? filtered : filtered.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* ══════════════════ KPI ══════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Clock} label="Demandes ce mois-ci" value={String(kpis.countThisMonth)} tone="sky" />
        <KpiCard icon={CheckCircle2} label="Approuvées ce mois-ci" value={String(kpis.approvedThisMonth)} tone="emerald" />
        <KpiCard icon={TrendingUp} label="Approuvées (toutes périodes)" value={String(kpis.totalApproved)} tone="violet" />
        <KpiCard icon={Clock} label="En attente" value={String(kpis.pending)} tone="amber" />
      </div>

      {/* ══════════════════ DERNIÈRES DEMANDES ══════════════════ */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-700">
          <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{showAll ? 'Toutes les demandes' : 'Dernières demandes'}</p>
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect icon={Filter} value={typeFilter} onChange={setTypeFilter} placeholder="Tous les types" options={Object.entries(TYPE_LABEL)} />
            {departments.length > 0 && <FilterSelect icon={Users2} value={deptFilter} onChange={setDeptFilter} placeholder="Tous les départements" options={departments.map(d => [d, d] as [string, string])} />}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>{['Employé', 'Type', 'Début', 'Statut', ''].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase whitespace-nowrap">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {displayed.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">Aucune demande pour ce filtre.</td></tr>
              ) : displayed.map(r => (
                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                  <td className="px-4 py-3">
                    <button onClick={() => onSelectEmployee(r.employee)} className="font-semibold text-gray-800 dark:text-gray-100 hover:text-sky-600 hover:underline">
                      {r.employee?.firstName} {r.employee?.lastName}
                    </button>
                    {r.employee?.department?.name && <p className="text-xs text-gray-400">{r.employee.department.name}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{TYPE_LABEL[r.type] ?? r.type}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(r.startDate).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3"><StatusPill status={r.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => onGoToRequest(r.id)} className="text-sky-600 hover:underline text-xs font-semibold flex items-center gap-0.5 ml-auto">Détail <ChevronRight size={12} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length > 10 && (
          <div className="p-3 border-t border-gray-100 dark:border-gray-700 flex justify-center">
            <button onClick={() => setShowAll(s => !s)} className="text-xs font-semibold text-sky-600 hover:underline">
              {showAll ? 'Réduire à 10 demandes' : `Voir les ${filtered.length} demandes`}
            </button>
          </div>
        )}
      </div>

      {/* ══════════════════ DERNIÈRES DEMANDES APPROUVÉES ══════════════════ */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Dernières demandes approuvées</p>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {recentlyApproved.length === 0 ? (
            <p className="text-center py-10 text-gray-400 text-sm">Aucune demande approuvée pour le moment.</p>
          ) : recentlyApproved.map(r => (
            <button key={r.id} onClick={() => onSelectEmployee(r.employee)} className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/40 text-left">
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{r.employee?.firstName} {r.employee?.lastName}</p>
                <p className="text-xs text-gray-400">{TYPE_LABEL[r.type] ?? r.type} · approuvée le {new Date(r.reviewedAt ?? r.createdAt).toLocaleDateString('fr-FR')}</p>
              </div>
              <span className="text-xs font-semibold text-emerald-600 whitespace-nowrap">Approuvée</span>
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════ NAVIGATION ══════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href={bp('/presences/absences/suivi')} className="group relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/25 hover:shadow-xl hover:shadow-sky-500/30 transition-all">
          <LineChartIcon className="absolute -right-3 -bottom-3 opacity-20 group-hover:scale-110 transition-transform" size={110} />
          <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1">Suivi</p>
          <p className="text-lg font-bold mb-1">Suivi des absences →</p>
          <p className="text-xs opacity-80">Qui s'absente le plus, par employé, avec historique complet</p>
        </Link>
        <button onClick={() => onGoToRequest('')} className="text-left group relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 transition-all">
          <ListChecks className="absolute -right-3 -bottom-3 opacity-20 group-hover:scale-110 transition-transform" size={110} />
          <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1">Décisions</p>
          <p className="text-lg font-bold mb-1">Demandes →</p>
          <p className="text-xs opacity-80">Toutes les demandes, approuver ou refuser en un clic</p>
        </button>
      </div>

      {/* ══════════════════ GRAPHIQUES ══════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Demandes vs approuvées par mois</p>
            <select value={year} onChange={e => setYear(Number(e.target.value))} className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900">
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthlySeries}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="mois" fontSize={12} />
              <YAxis fontSize={12} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Demandées" stroke="#0ea5e9" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="Approuvées" stroke="#10b981" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
          <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4">Répartition par type d&apos;absence</p>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={byType} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                {byType.map((t, i) => <Cell key={i} fill={TYPE_COLOR[t.type] ?? '#0ea5e9'} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
          <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4">Top 5 départements par nombre de demandes</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byDept} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} horizontal={false} />
              <XAxis type="number" fontSize={12} allowDecimals={false} />
              <YAxis type="category" dataKey="departement" fontSize={12} width={110} />
              <Tooltip />
              <Bar dataKey="nombre" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone: 'sky' | 'emerald' | 'violet' | 'amber' }) {
  const cls: Record<string, string> = {
    sky: 'bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-300',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-300',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300',
  };
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${cls[tone]}`}><Icon size={18} /></div>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-lg font-bold text-gray-900 dark:text-white truncate">{value}</p>
    </div>
  );
}

function FilterSelect({ icon: Icon, value, onChange, placeholder, options }: { icon: any; value: string; onChange: (v: string) => void; placeholder: string; options: [string, string][] }) {
  return (
    <div className="relative">
      <Icon size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      <select value={value} onChange={e => onChange(e.target.value)} className="pl-7 pr-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-xs">
        <option value="">{placeholder}</option>
        {options.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
      </select>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    PENDING: { label: 'En attente', cls: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-300' },
    APPROVED: { label: 'Approuvée', cls: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300' },
    REJECTED: { label: 'Refusée', cls: 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-300' },
    CANCELLED: { label: 'Annulée', cls: 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400' },
  };
  const c = cfg[status] ?? cfg.PENDING;
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${c.cls}`}>{c.label}</span>;
}
