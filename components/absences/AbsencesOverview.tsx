'use client';
import { AttendanceSelect } from '@/components/attendance/AttendanceSelect';
import { useModuleVisuals } from '@/components/requests/ModulePageFrame';

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
  ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';

const TYPE_LABEL: Record<string, string> = { MALADIE: 'Maladie', CONVENTIONNELLE: 'Conventionnelle', EXCEPTIONNELLE: 'Exceptionnelle' };
const TYPE_COLOR: Record<string, string> = { MALADIE: 'var(--loan-chart-1)', CONVENTIONNELLE: 'var(--loan-chart-2)', EXCEPTIONNELLE: 'var(--loan-chart-3)' };

type Props = {
  requests: any[];
  onSelectEmployee: (emp: any) => void;
  onGoToRequest: (id: string) => void;
  canSeeTracking?: boolean; // 🔒 carte « Suivi des absences » : admin / RH uniquement (défaut : oui)
};

export default function AbsencesOverview({ requests, onSelectEmployee, onGoToRequest, canSeeTracking = true }: Props) {
 const {refonte:uiRefonte,motion:uiMotion}=useModuleVisuals();
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 attendance-metrics">
        <KpiCard icon={Clock} label="Demandes ce mois-ci" value={String(kpis.countThisMonth)} tone="emerald" />
        <KpiCard icon={CheckCircle2} label="Approuvées ce mois-ci" value={String(kpis.approvedThisMonth)} tone="emerald" />
        <KpiCard icon={TrendingUp} label="Approuvées (toutes périodes)" value={String(kpis.totalApproved)} tone="amber" />
        <KpiCard icon={Clock} label="En attente" value={String(kpis.pending)} tone="amber" />
      </div>

      {/* ══════════════════ DERNIÈRES DEMANDES ══════════════════ */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
        <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[var(--border)]">
          <p className="text-sm font-semibold text-[var(--text-muted)]">{showAll ? 'Toutes les demandes' : 'Dernières demandes'}</p>
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect icon={Filter} value={typeFilter} onChange={setTypeFilter} placeholder="Tous les types" options={Object.entries(TYPE_LABEL)} />
            {departments.length > 0 && <FilterSelect icon={Users2} value={deptFilter} onChange={setDeptFilter} placeholder="Tous les départements" options={departments.map(d => [d, d] as [string, string])} />}
          </div>
        </div>

        <div className="overflow-x-auto attendance-table-scroll" tabIndex={0} role="region" aria-label="Tableau défilant horizontalement">
          <table className="w-full text-sm attendance-table">
            <thead className="bg-[var(--surface-2)]">
              <tr>{['Employé', 'Type', 'Début', 'Statut', ''].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)]  whitespace-nowrap">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {displayed.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-[var(--text-muted)]">Aucune demande pour ce filtre.</td></tr>
              ) : displayed.map(r => (
                <tr key={r.id} className="hover:bg-[var(--surface-2)]">
                  <td className="px-4 py-3">
                    <button onClick={() => onSelectEmployee(r.employee)} className="font-semibold text-[var(--text)] hover:text-[var(--success-text)] hover:underline">
                      {r.employee?.firstName} {r.employee?.lastName}
                    </button>
                    {r.employee?.department?.name && <p className="text-xs text-[var(--text-muted)]">{r.employee.department.name}</p>}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{TYPE_LABEL[r.type] ?? r.type}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)] whitespace-nowrap">{new Date(r.startDate).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3"><StatusPill status={r.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => onGoToRequest(r.id)} className="text-[var(--success-text)] hover:underline text-xs font-semibold flex items-center gap-0.5 ml-auto">Détail <ChevronRight size={12} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length > 10 && (
          <div className="p-3 border-t border-[var(--border)] flex justify-center">
            <button onClick={() => setShowAll(s => !s)} className="text-xs font-semibold text-[var(--success-text)] hover:underline">
              {showAll ? 'Réduire à 10 demandes' : `Voir les ${filtered.length} demandes`}
            </button>
          </div>
        )}
      </div>

      {/* ══════════════════ DERNIÈRES DEMANDES APPROUVÉES ══════════════════ */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
        <div className="p-4 border-b border-[var(--border)]">
          <p className="text-sm font-semibold text-[var(--text-muted)]">Dernières demandes approuvées</p>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {recentlyApproved.length === 0 ? (
            <p className="text-center py-10 text-[var(--text-muted)] text-sm">Aucune demande approuvée pour le moment.</p>
          ) : recentlyApproved.map(r => (
            <button key={r.id} onClick={() => onSelectEmployee(r.employee)} className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-[var(--surface-2)] text-left">
              <div>
                <p className="text-sm font-semibold text-[var(--text)]">{r.employee?.firstName} {r.employee?.lastName}</p>
                <p className="text-xs text-[var(--text-muted)]">{TYPE_LABEL[r.type] ?? r.type} · approuvée le {new Date(r.reviewedAt ?? r.createdAt).toLocaleDateString('fr-FR')}</p>
              </div>
              <span className="text-xs font-semibold text-[var(--success-text)] whitespace-nowrap">Approuvée</span>
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════ NAVIGATION ══════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {canSeeTracking && (
        <Link href={bp('/presences/absences/suivi')} className="group relative overflow-hidden rounded-2xl p-5 bg-[var(--brand)] text-[var(--on-brand)] hover:bg-[var(--brand)] transition-colors">
          <LineChartIcon className="absolute -right-3 -bottom-3 opacity-20  transition-transform" size={110} />
          <p className="text-xs font-semibold   opacity-80 mb-1">Suivi</p>
          <p className="text-lg font-semibold mb-1">Suivi des absences →</p>
          <p className="text-xs opacity-80">Qui s'absente le plus, par employé, avec historique complet</p>
        </Link>
        )}
        <button onClick={() => onGoToRequest('')} className="text-left group relative overflow-hidden rounded-2xl p-5 bg-[var(--mustard)] text-[var(--on-brand)] hover:bg-[var(--mustard)] transition-colors">
          <ListChecks className="absolute -right-3 -bottom-3 opacity-20  transition-transform" size={110} />
          <p className="text-xs font-semibold   opacity-80 mb-1">Décisions</p>
          <p className="text-lg font-semibold mb-1">Demandes →</p>
          <p className="text-xs opacity-80">Toutes les demandes, approuver ou refuser en un clic</p>
        </button>
      </div>

      {/* ══════════════════ GRAPHIQUES ══════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4 attendance-filters">
            <p className="text-sm font-semibold text-[var(--text-muted)]">Demandes vs approuvées par mois</p>
            <AttendanceSelect value={year} onChange={e => setYear(Number(e.target.value))} className="text-xs px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </AttendanceSelect>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            {uiRefonte ? (<AreaChart data={monthlySeries}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="mois" fontSize={12} />
              <YAxis fontSize={12} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="Demandées" stroke="var(--brand)" strokeWidth={2.5} dot={false}  fill="var(--loan-gradient-1)" fillOpacity={1} isAnimationActive={uiMotion} animationDuration={700}/>
              <Area type="monotone" dataKey="Approuvées" stroke="var(--green)" strokeWidth={2.5} dot={false}  fill="var(--loan-gradient-2)" fillOpacity={1} isAnimationActive={uiMotion} animationDuration={700}/>
            </AreaChart>) : (<LineChart data={monthlySeries}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="mois" fontSize={12} />
              <YAxis fontSize={12} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Demandées" stroke="var(--mustard)" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="Approuvées" stroke="var(--green)" strokeWidth={2.5} dot={false} />
            </LineChart>)}
          </ResponsiveContainer>
        </div>

        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5">
          <p className="text-sm font-semibold text-[var(--text-muted)] mb-4">Répartition par type d&apos;absence</p>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={byType} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={uiRefonte ? 5 : 2} cornerRadius={uiRefonte ? 8 : 0} isAnimationActive={uiRefonte ? uiMotion : undefined} animationDuration={uiRefonte ? 700 : undefined}>
                {byType.map((t, i) => <Cell key={i} fill={TYPE_COLOR[t.type] ?? 'var(--green)'} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5">
          <p className="text-sm font-semibold text-[var(--text-muted)] mb-4">Top 5 départements par nombre de demandes</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byDept} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} horizontal={false} />
              <XAxis type="number" fontSize={12} allowDecimals={false} />
              <YAxis type="category" dataKey="departement" fontSize={12} width={110} />
              <Tooltip />
              <Bar dataKey="nombre" fill="var(--loan-chart-2)" radius={uiRefonte ? [10,10,10,10] : [0, 6, 6, 0]} maxBarSize={uiRefonte ? 16 : undefined} background={uiRefonte ? {fill:"var(--surface-2)",radius:10} : undefined} isAnimationActive={uiRefonte ? uiMotion : undefined} animationDuration={uiRefonte ? 700 : undefined} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone: 'emerald' | 'amber' }) {
  const cls: Record<string, string> = {
    emerald: 'bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] text-[var(--success-text)]  ',
    amber: 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--warning-text)]  ',
  };
  return (
    <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${cls[tone]}`}><Icon size={18} /></div>
      <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">{label}</p>
      <p className="text-lg font-semibold text-[var(--text)] truncate">{value}</p>
    </div>
  );
}

function FilterSelect({ icon: Icon, value, onChange, placeholder, options }: { icon: any; value: string; onChange: (v: string) => void; placeholder: string; options: [string, string][] }) {
  return (
    <div className="relative">
      <Icon size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
      <AttendanceSelect value={value} onChange={e => onChange(e.target.value)} className="pl-7 pr-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs">
        <option value="">{placeholder}</option>
        {options.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
      </AttendanceSelect>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    PENDING: { label: 'En attente', cls: 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--warning-text)] border-[var(--border)]  ' },
    APPROVED: { label: 'Approuvée', cls: 'bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] text-[var(--success-text)] border-[var(--border)]  ' },
    REJECTED: { label: 'Refusée', cls: 'bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] text-[var(--danger-text)] border-[var(--border)]  ' },
    CANCELLED: { label: 'Annulée', cls: 'bg-[var(--surface-2)] text-[var(--text-muted)]' },
  };
  const c = cfg[status] ?? cfg.PENDING;
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${c.cls}`}>{c.label}</span>;
}
