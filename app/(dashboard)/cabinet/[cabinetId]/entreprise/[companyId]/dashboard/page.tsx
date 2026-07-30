'use client';

// ============================================================================
// app/(dashboard)/cabinet/[cabinetId]/entreprise/[companyId]/dashboard/page.tsx
// REFONTE UX — Vue PME côté cabinet, même ADN que dashboard Entreprise
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/services/api';
import {
  C, Ico, Card, KpiCard, SectionHeader,
  Badge, Avatar, Btn, LoadingScreen,
} from '@/components/cabinet/cabinet-ui';

const fmt    = (n: number) => new Intl.NumberFormat('fr-CG', { maximumFractionDigits: 0 }).format(n);
const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

// ─── Quick-action card ────────────────────────────────────────────────────────
function QuickAction({ label, sub, icon, color, onClick }: {
  label: string; sub: string; icon: React.ReactNode; color: string; onClick: () => void;
}) {
  return (
    <Card onClick={onClick} className="flex items-center gap-4 px-5 py-4">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}18`, border: `1px solid ${color}30` }}
      >
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold" style={{ color: C.textPrimary }}>{label}</p>
        <p className="text-xs" style={{ color: C.textMuted }}>{sub}</p>
      </div>
      <Ico.ArrowRight size={14} color={C.textMuted} />
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CabinetPmeDashboardPage() {
  const params    = useParams();
  const router    = useRouter();
  const cabinetId = params.cabinetId as string;
  const companyId = params.companyId as string;

  const now = new Date();
  const [stats,   setStats]   = useState<any>(null);
  const [leaves,  setLeaves]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [emps, pays, leavesRes] = await Promise.all([
          api.get(`/employees?companyId=${companyId}&status=ACTIVE&limit=1`) as Promise<any>,
          api.get(`/payrolls?companyId=${companyId}&month=${now.getMonth() + 1}&year=${now.getFullYear()}&limit=1`) as Promise<any>,
          api.get(`/leaves?companyId=${companyId}`) as Promise<any>,
        ]);
        const empCount  = emps?.total ?? (Array.isArray(emps) ? emps.length : 0);
        const payList   = Array.isArray(pays) ? pays : pays?.data ?? [];
        const leaveList = Array.isArray(leavesRes) ? leavesRes : [];
        const pending   = leaveList.filter((l: any) => l.status === 'PENDING');
        setStats({
          employees:    empCount,
          payrolls:     payList.length,
          pendingLeaves: pending.length,
          totalNet:     payList.reduce((s: number, p: any) => s + (p.netSalary ?? 0), 0),
          totalGross:   payList.reduce((s: number, p: any) => s + (p.grossSalary ?? 0), 0),
        });
        setLeaves(leaveList.slice(0, 5));
      } catch {
        setStats({ employees: 0, payrolls: 0, pendingLeaves: 0, totalNet: 0, totalGross: 0 });
      } finally { setLoading(false); }
    };
    load();
  }, [companyId]);

  const STATUS_CFG: Record<string, { label: string; variant: any }> = {
    PENDING:   { label: 'En attente', variant: 'warning' },
    APPROVED:  { label: 'Approuvé',   variant: 'success' },
    REJECTED:  { label: 'Refusé',     variant: 'danger'  },
    CANCELLED: { label: 'Annulé',     variant: 'default' },
  };

  const LEAVE_TYPES: Record<string, string> = {
    ANNUAL:'Annuel', SICK:'Maladie', MATERNITY:'Maternité', PATERNITY:'Paternité', UNPAID:'Sans solde',
  };

  if (loading) return <LoadingScreen />;

  const base = `/cabinet/${cabinetId}/entreprise/${companyId}`;

  return (
    <div className="p-6 space-y-6" style={{ background: C.pageBg, minHeight: '100vh' }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: C.textPrimary }}>Vue d'ensemble</h1>
          <p className="text-sm mt-0.5" style={{ color: C.textSecondary }}>
            {now.toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
          </p>
        </div>
        <Btn
          variant="primary"
          icon={<Ico.Dollar size={14} color="#fff" />}
          onClick={() => router.push(`${base}/paie`)}
        >
          Saisir la paie
        </Btn>
      </div>

      {/* KPI */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Employés actifs"
            value={stats.employees}
            icon={<Ico.Users size={18} color={C.indigo} />}
            accentColor={C.indigo}
            onClick={() => router.push(`${base}/employes`)}
          />
          <KpiCard
            label="Congés en attente"
            value={stats.pendingLeaves}
            icon={<Ico.Leave size={18} color={C.amber} />}
            accentColor={C.amber}
            onClick={() => router.push(`${base}/conges`)}
          />
          <KpiCard
            label="Bulletins ce mois"
            value={stats.payrolls}
            icon={<Ico.FileText size={18} color={C.emerald} />}
            accentColor={C.emerald}
            onClick={() => router.push(`${base}/paie`)}
          />
          <KpiCard
            label="Masse nette du mois"
            value={`${fmt(stats.totalNet)} F`}
            icon={<Ico.Dollar size={18} color={C.cyan} />}
            accentColor={C.cyan}
          />
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-4">
        <QuickAction
          label="Saisir variables paie"
          sub="Variables du mois"
          icon={<Ico.Dollar size={16} color={C.cyan} />}
          color={C.cyan}
          onClick={() => router.push(`${base}/paie`)}
        />
        <QuickAction
          label="Résumé présences"
          sub="Pointage mensuel"
          icon={<Ico.Users size={16} color={C.emerald} />}
          color={C.emerald}
          onClick={() => router.push(`${base}/presences`)}
        />
        <QuickAction
          label="Générer bulletins"
          sub="Bulletins de paie"
          icon={<Ico.Payroll size={16} color={C.violet} />}
          color={C.violet}
          onClick={() => router.push(`${base}/paie`)}
        />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-3 gap-5">

        {/* Congés */}
        <Card className="col-span-2">
          <SectionHeader
            title="Congés récents"
            sub={`${leaves.length} demande${leaves.length > 1 ? 's' : ''}`}
            action={
              <button
                onClick={() => router.push(`${base}/conges`)}
                className="flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-75"
                style={{ color: C.indigoL }}
              >
                Voir tout <Ico.ArrowRight size={11} color={C.indigoL} />
              </button>
            }
          />
          <div>
            {leaves.length === 0 ? (
              <div className="py-10 text-center text-sm" style={{ color: C.textMuted }}>
                Aucune demande de congé
              </div>
            ) : (
              leaves.map((leave, idx) => {
                const sc = STATUS_CFG[leave.status] ?? STATUS_CFG['PENDING'];
                const empName = leave.employee
                  ? `${leave.employee.firstName ?? ''} ${leave.employee.lastName ?? ''}`.trim()
                  : 'Employé';
                return (
                  <div
                    key={leave.id}
                    className="flex items-center gap-3 px-5 py-3.5 transition-colors"
                    style={{ borderBottom: idx < leaves.length - 1 ? `1px solid ${C.border}` : 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.background = C.cardBgHover)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Avatar name={empName} size={30} index={idx} />
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: C.textPrimary }}>{empName}</p>
                      <p className="text-xs" style={{ color: C.textMuted }}>
                        {LEAVE_TYPES[leave.type] ?? leave.type} ·{' '}
                        {new Date(leave.startDate).toLocaleDateString('fr-FR')} → {new Date(leave.endDate).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <Badge label={sc.label} variant={sc.variant} />
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Infos PME */}
        <Card className="p-5">
          <p className="text-sm font-semibold mb-4" style={{ color: C.textPrimary }}>Navigation rapide</p>
          <div className="space-y-1.5">
            {[
              { label: 'Employés',    href: `${base}/employes`,    icon: <Ico.Users    size={14} color={C.indigo}  /> },
              { label: 'Présences',   href: `${base}/presences`,   icon: <Ico.Clock    size={14} color={C.cyan}    /> },
              { label: 'Paie',        href: `${base}/paie`,        icon: <Ico.Dollar   size={14} color={C.emerald} /> },
              { label: 'Congés',      href: `${base}/conges`,      icon: <Ico.Leave    size={14} color={C.amber}   /> },
              { label: 'Contrats',    href: `${base}/contrats`,    icon: <Ico.FileText size={14} color={C.violet}  /> },
              { label: 'Documents',   href: `${base}/documents`,   icon: <Ico.Payroll  size={14} color={C.teal}    /> },
              { label: 'Formation',   href: `${base}/formation`,   icon: <Ico.Shield   size={14} color={C.pink}    /> },
              { label: 'Paramètres',  href: `${base}/parametres`,  icon: <Ico.Settings size={14} color={C.textMuted}/> },
            ].map((item, i) => (
              <button
                key={i}
                onClick={() => router.push(item.href)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-left transition-all"
                style={{ color: C.textSecondary }}
                onMouseEnter={e => {
                  (e.currentTarget.style.background = 'rgba(255,255,255,0.05)');
                  (e.currentTarget.style.color) = C.textPrimary;
                }}
                onMouseLeave={e => {
                  (e.currentTarget.style.background = 'transparent');
                  (e.currentTarget.style.color) = C.textSecondary;
                }}
              >
                {item.icon}
                {item.label}
                <Ico.ArrowRight size={11} color={C.textMuted} />
              </button>
            ))}
          </div>
        </Card>

      </div>
    </div>
  );
}