'use client';

// app/(dashboard)/portefeuille/dashboard/page.tsx

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Building2, Users, UserCheck, FileClock, ArrowRight, Plus,
  Calendar, FileText, HandCoins, CheckCircle, Clock,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { GlobalLoader } from '@/components/ui/GlobalLoader';
import { StatCard } from '@/components/ui/StatCard';
import { api } from '@/services/api';
import { DAY_MS, isPendingStatus, timeAgo } from '@/components/portfolio/requests';
import { PortfolioPageFrame as ModulePageFrame } from '@/components/portfolio/PortfolioPageFrame';

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
    <div className={`portfolio-panel rounded-2xl p-4 sm:p-6 ${className}`} style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      {children}
    </div>
  );
}

const ACTIVITY_ICON: Record<string, { icon: React.ReactNode; color: string }> = {
  leave:   { icon: <Calendar size={16} />,    color: "bg-[var(--portfolio-warning-soft)] text-[var(--warning-text)]  " },
  absence: { icon: <FileText size={16} />,    color: "bg-[var(--brand-soft)] text-[var(--action)]  " },
  loan:    { icon: <HandCoins size={16} />,   color: "bg-[var(--brand-soft)] text-[var(--action)]  " },
  advance: { icon: <HandCoins size={16} />,   color: "bg-[var(--brand-soft)] text-[var(--action)]  " },
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'En attente', PENDING_DG: 'En attente DG', APPROVED: 'Approuvée',
  REJECTED: 'Refusée', CANCELLED: 'Annulée', ACTIVE: 'Active', PAID: 'Payée', DEDUCTED: 'Déduite',
};

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-[var(--portfolio-warning-soft)] text-[var(--warning-text)]  ",
  PENDING_DG: "bg-[var(--portfolio-warning-soft)] text-[var(--warning-text)]  ",
  APPROVED: "bg-[var(--portfolio-positive-soft)] text-[var(--success-text)]  ",
  ACTIVE: "bg-[var(--portfolio-positive-soft)] text-[var(--success-text)]  ",
  PAID: "bg-[var(--portfolio-positive-soft)] text-[var(--success-text)]  ",
  DEDUCTED: "bg-[var(--portfolio-positive-soft)] text-[var(--success-text)]  ",
  REJECTED: "bg-[var(--portfolio-danger-soft)] text-[var(--danger-text)]  ",
  CANCELLED: "bg-[var(--surface-2)] text-[var(--text-secondary)]  ",
};

const PIE_COLORS = ["var(--portfolio-chart-4)", "var(--portfolio-chart-2)", "var(--portfolio-chart-3)"];

// Ligne d'une demande dans « Demandes récentes »
function ActivityRow({ act, pending }: { act: RecentActivityItem; pending: boolean }) {
  const meta = ACTIVITY_ICON[act.type] ?? ACTIVITY_ICON.leave;
  return (
    <Link
      href="/portefeuille/demandes"
      className="flex items-center gap-4 p-3 -mx-3 rounded-xl transition-colors hover:bg-[var(--surface-2)]"
    >
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${meta.color}`}>{meta.icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{act.label}</p>
        <p className="text-xs mt-0.5 flex items-center gap-1.5 flex-wrap" style={{ color: 'var(--text-muted)' }}>
          <span className="inline-flex items-center gap-1"><Building2 size={11} /> {act.company}</span>
          <span>·</span>
          <span className="inline-flex items-center gap-1"><Clock size={11} /> {timeAgo(act.date)}</span>
        </p>
      </div>
      {pending ? (
        <span className="relative inline-flex shrink-0">
          <span className="absolute inset-0 rounded-full bg-[var(--portfolio-danger-soft)] opacity-50  motion-reduce:animate-none" />
          <span className="relative inline-flex rounded-full bg-[var(--portfolio-danger-soft)] text-[var(--danger-text)] text-[11px] font-semibold px-2.5 py-1">À traiter</span>
        </span>
      ) : (
        <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0 ${STATUS_BADGE[act.status] ?? STATUS_BADGE.CANCELLED}`}>
          {STATUS_LABEL[act.status] ?? act.status}
        </span>
      )}
    </Link>
  );
}

function PortfolioDashboardPage() {
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

  // Demandes récentes : en attente = toujours visibles ; traitées = 24 h puis elles disparaissent
  const nowMs = Date.now();
  const pendingActs = s.recentActivity.filter(a => isPendingStatus(a.status));
  const handledActs = s.recentActivity.filter(a => {
    if (isPendingStatus(a.status)) return false;
    const ts = Date.parse(a.date);
    return !Number.isNaN(ts) && nowMs - ts < DAY_MS;
  });

  const pendingPieData = [
    { name: 'Congés', value: s.pendingRequests.leaves },
    { name: 'Absences', value: s.pendingRequests.absences },
    { name: 'Prêts/Avances', value: s.pendingRequests.loans },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 min-h-screen pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight" style={{ color: 'var(--text)' }}>Mon portefeuille</h1>
          <p className="mt-1 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
            <span className="w-2 h-2 rounded-full bg-[var(--action)] " />
            Vue globale sur toutes vos entreprises
          </p>
        </div>
        <Link
          href="/portefeuille/mes-entreprises"
          className="px-5 py-2.5 rounded-xl bg-[var(--action)] hover:bg-[var(--action)] text-[var(--on-brand)] font-semibold transition-colors flex items-center gap-2"
        >
          <Plus size={18} /> Ajouter une entreprise
        </Link>
      </div>

      {/* ── INDICATEURS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Entreprises" value={`${s.companies.active}/${s.companies.total}`} trend="actives" isPositive={s.companies.active === s.companies.total} icon={Building2} color="emerald" />
        <StatCard label="Employés" value={String(s.employees.total)} trend="au total" isPositive icon={Users} color="sky" />
        <StatCard label="Présents aujourd'hui" value={`${s.attendance.presentToday}/${s.attendance.totalEmployees}`} trend={`${attendanceRate}%`} isPositive={attendanceRate >= 80} icon={UserCheck} color="violet" />
        <StatCard label="Demandes en attente" value={String(totalPending)} trend={totalPending > 0 ? 'à traiter' : 'à jour'} isPositive={totalPending === 0} icon={FileClock} color="amber" />
      </div>

      {s.companies.total === 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 rounded-2xl bg-[var(--brand-soft)]  border border-[var(--border)] ">
          <p className="text-sm font-medium text-[var(--action)] ">
            Vous n'avez pas encore d'entreprise — les indicateurs ci-dessous s'activeront dès que vous en ajoutez une.
          </p>
          <Link href="/portefeuille/mes-entreprises" className="text-sm font-semibold text-[var(--action)]  whitespace-nowrap flex items-center gap-1">
            Ajouter <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {totalPending > 0 && (
        <Link
          href="/portefeuille/demandes"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 rounded-2xl bg-[var(--portfolio-danger-soft)]  border border-[var(--border)]  transition-colors hover:bg-[var(--portfolio-danger-soft)] "
        >
          <p className="text-sm font-semibold text-[var(--danger-text)]  flex items-center gap-3">
            <span className="relative flex w-3 h-3 shrink-0">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--portfolio-danger-soft)] opacity-75  motion-reduce:animate-none" />
              <span className="relative inline-flex w-3 h-3 rounded-full bg-[var(--portfolio-danger-soft)]" />
            </span>
            {totalPending} demande{totalPending > 1 ? 's' : ''} en attente dans vos entreprises
          </p>
          <span className="text-sm font-semibold text-[var(--danger-text)]  whitespace-nowrap flex items-center gap-1">
            Traiter maintenant <ArrowRight size={14} />
          </span>
        </Link>
      )}

      {/* ── GRAPHIQUES ── */}
      <div className="portfolio-overview-charts">
        <Panel className="lg:col-span-2">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>Employés par entreprise</h3>
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
                <Bar isAnimationActive={false} dataKey="count" fill="var(--portfolio-chart-1)" name="Employés" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel>
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>Répartition des demandes</h3>
          {pendingPieData.length === 0 ? (
            <div className="h-[220px] flex flex-col items-center justify-center text-sm text-center" style={{ color: 'var(--text-muted)' }}>
              <CheckCircle size={28} className="mb-2 opacity-30" />
              Rien en attente
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie isAnimationActive={false} data={pendingPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value" stroke="none">
                  {pendingPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Panel>
      </div>

      {/* ── DEMANDES RÉCENTES ── */}
      <Panel>
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[var(--portfolio-danger-soft)] rounded-lg text-[var(--danger-text)]"><FileClock size={18} /></div>
            <div>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Demandes récentes</h3>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                En attente jusqu&apos;à décision · traitées visibles 24 h
              </p>
            </div>
          </div>
          <Link href="/portefeuille/demandes" className="text-sm font-semibold text-[var(--action)]  whitespace-nowrap flex items-center gap-1">
            Tout voir <ArrowRight size={14} />
          </Link>
        </div>

        {pendingActs.length === 0 && handledActs.length === 0 ? (
          <div className="text-center py-10" style={{ color: 'var(--text-muted)' }}>
            <CheckCircle size={32} className="mx-auto mb-2 opacity-20" />
            <p className="text-sm">Rien à signaler : aucune demande en attente ni traitée ces dernières 24 h.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {pendingActs.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide mb-1 text-[var(--danger-text)]">À traiter · {pendingActs.length}</p>
                <div>{pendingActs.map((a, i) => <ActivityRow key={`p${i}`} act={a} pending />)}</div>
              </div>
            )}
            {handledActs.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Traitées · 24 h</p>
                <div>{handledActs.map((a, i) => <ActivityRow key={`h${i}`} act={a} pending={false} />)}</div>
              </div>
            )}
          </div>
        )}
      </Panel>
    </div>
  );
}


export default function PortfolioDashboardPageWithFrame() {
  return (
    <ModulePageFrame kind="dashboard">
      <PortfolioDashboardPage />
    </ModulePageFrame>
  );
}
