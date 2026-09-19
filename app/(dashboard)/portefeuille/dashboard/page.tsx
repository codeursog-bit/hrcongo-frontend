'use client';

// app/(dashboard)/portefeuille/dashboard/page.tsx

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Building2, Users, UserCheck, FileClock, ArrowRight, Plus, Radio,
  Calendar, FileText, HandCoins, CheckCircle,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { GlobalLoader } from '@/components/ui/GlobalLoader';
import { StatCard } from '@/components/ui/StatCard';
import { api } from '@/services/api';

interface EmployeesByCompany { companyId: string; name: string; count: number; }
interface RecentActivityItem {
  type: 'leave' | 'absence' | 'loan' | 'advance';
  label: string;
  company: string;
  status: string;
  date: string;
}
interface PortfolioStats {
  companies: { total: number; active: number };
  employees: { total: number };
  attendance: { presentToday: number; totalEmployees: number };
  pendingRequests: { leaves: number; absences: number; loans: number };
  employeesByCompany: EmployeesByCompany[];
  recentActivity: RecentActivityItem[];
}

const EMPTY_STATS: PortfolioStats = {
  companies: { total: 0, active: 0 },
  employees: { total: 0 },
  attendance: { presentToday: 0, totalEmployees: 0 },
  pendingRequests: { leaves: 0, absences: 0, loans: 0 },
  employeesByCompany: [],
  recentActivity: [],
};

function Panel({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-2xl p-4 sm:p-6 ${className}`} style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      {children}
    </div>
  );
}

const ACTIVITY_ICON: Record<string, { icon: React.ReactNode; color: string }> = {
  leave:   { icon: <Calendar size={16} />,    color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' },
  absence: { icon: <FileText size={16} />,    color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' },
  loan:    { icon: <HandCoins size={16} />,   color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' },
  advance: { icon: <HandCoins size={16} />,   color: 'bg-sky-100 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400' },
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'En attente', PENDING_DG: 'En attente DG', APPROVED: 'Approuvée',
  REJECTED: 'Refusée', CANCELLED: 'Annulée', ACTIVE: 'Active', PAID: 'Payée', DEDUCTED: 'Déduite',
};

const PIE_COLORS = ['#F43F5E', '#6366F1', '#F59E0B'];

export default function PortfolioDashboardPage() {
  const [stats, setStats] = useState<PortfolioStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<PortfolioStats>('/portfolio/stats')
      .then(data => setStats({ ...EMPTY_STATS, ...data }))
      .catch(() => setStats(EMPTY_STATS))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <GlobalLoader />;

  const s = stats;
  const totalPending = s.pendingRequests.leaves + s.pendingRequests.absences + s.pendingRequests.loans;
  const attendanceRate = s.attendance.totalEmployees > 0
    ? Math.round((s.attendance.presentToday / s.attendance.totalEmployees) * 100)
    : 0;

  const pendingPieData = [
    { name: 'Congés', value: s.pendingRequests.leaves },
    { name: 'Absences', value: s.pendingRequests.absences },
    { name: 'Prêts/Avances', value: s.pendingRequests.loans },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 min-h-screen pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>Mon portefeuille</h1>
          <p className="mt-1 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Vue globale sur toutes vos entreprises
          </p>
        </div>
        <Link
          href="/portefeuille/mes-entreprises"
          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-colors flex items-center gap-2"
        >
          <Plus size={18} /> Ajouter une entreprise
        </Link>
      </div>

      {s.companies.total === 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
            Vous n'avez pas encore d'entreprise — les indicateurs ci-dessous s'activeront dès que vous en ajoutez une.
          </p>
          <Link href="/portefeuille/mes-entreprises" className="text-sm font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap flex items-center gap-1">
            Ajouter <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* ── INDICATEURS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Entreprises" value={`${s.companies.active}/${s.companies.total}`} trend="actives" isPositive={s.companies.active === s.companies.total} icon={Building2} color="emerald" />
        <StatCard label="Employés" value={String(s.employees.total)} trend="au total" isPositive icon={Users} color="sky" />
        <StatCard label="Présents aujourd'hui" value={`${s.attendance.presentToday}/${s.attendance.totalEmployees}`} trend={`${attendanceRate}%`} isPositive={attendanceRate >= 80} icon={UserCheck} color="violet" />
        <StatCard label="Demandes en attente" value={String(totalPending)} trend={totalPending > 0 ? 'à traiter' : 'à jour'} isPositive={totalPending === 0} icon={FileClock} color="amber" />
      </div>

      {/* ── GRAPHIQUES ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel className="lg:col-span-2">
          <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text)' }}>Employés par entreprise</h3>
          {s.employeesByCompany.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-sm" style={{ color: 'var(--text-muted)' }}>
              Aucune donnée pour le moment
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={s.employeesByCompany.length > 4 ? 260 : 220}>
              <BarChart data={s.employeesByCompany} margin={{ top: 10, right: 10, left: 0, bottom: s.employeesByCompany.length > 4 ? 40 : 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  interval={0}
                  angle={s.employeesByCompany.length > 4 ? -30 : 0}
                  textAnchor={s.employeesByCompany.length > 4 ? 'end' : 'middle'}
                  dy={10}
                />
                <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="count" fill="#10B981" name="Employés" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel>
          <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text)' }}>Répartition des demandes</h3>
          {pendingPieData.length === 0 ? (
            <div className="h-[220px] flex flex-col items-center justify-center text-sm text-center" style={{ color: 'var(--text-muted)' }}>
              <CheckCircle size={28} className="mb-2 opacity-30" />
              Rien en attente
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pendingPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value" stroke="none">
                  {pendingPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Panel>
      </div>

      {/* ── ACTIVITÉ RÉCENTE ── */}
      <Panel>
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-red-500/10 rounded-lg text-red-500 animate-pulse"><Radio size={18} /></div>
          <h3 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Activité récente</h3>
        </div>
        {s.recentActivity.length === 0 ? (
          <div className="text-center py-10" style={{ color: 'var(--text-muted)' }}>
            <FileClock size={32} className="mx-auto mb-2 opacity-20" />
            <p className="text-sm">Aucune activité récente pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {s.recentActivity.map((act, i) => {
              const meta = ACTIVITY_ICON[act.type] ?? ACTIVITY_ICON.leave;
              return (
                <div key={i} className="flex gap-4 relative">
                  {i !== s.recentActivity.length - 1 && (
                    <div className="absolute left-[15px] top-8 bottom-[-20px] w-0.5" style={{ background: 'var(--border)' }} />
                  )}
                  <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${meta.color}`}>{meta.icon}</div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{act.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {act.company} · {STATUS_LABEL[act.status] ?? act.status}
                    </p>
                    <p className="text-[10px] mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>{new Date(act.date).toLocaleString('fr-FR')}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}