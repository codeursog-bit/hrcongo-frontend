'use client';

// app/(dashboard)/cabinet/[cabinetId]/entreprise/[companyId]/rapports/page.tsx
// API INCHANGÉE — UX améliorée

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { api } from '@/services/api';
import {
  C, Ico, Card, Badge, Avatar, KpiCard,
  PageHeader, SectionHeader, LoadingInline,
  Th,
} from '@/components/cabinet/cabinet-ui';

const fmt = (n: number) => new Intl.NumberFormat('fr-CG', { maximumFractionDigits: 0 }).format(n);
const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

// Shared chart tooltip style
const tooltipStyle = {
  contentStyle: {
    background: C.cardBg,
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    fontSize: 12,
    color: C.textPrimary,
  },
  labelStyle: { color: C.textSecondary },
};

export default function CabinetRapportsPage() {
  const params    = useParams();
  const companyId = params.companyId as string;

  const now = new Date();
  const [year,      setYear]      = useState(now.getFullYear());
  const [stats,     setStats]     = useState<any>(null);
  const [payrolls,  setPayrolls]  = useState<any[]>([]);
  const [employees, setEmp]       = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/employees?companyId=${companyId}&status=ACTIVE&limit=200`) as Promise<any>,
      api.get(`/payrolls?companyId=${companyId}&year=${year}&limit=500`)   as Promise<any>,
    ])
      .then(([emps, pays]) => {
        const empList = Array.isArray(emps) ? emps : emps?.data ?? [];
        const payList = Array.isArray(pays) ? pays : pays?.data ?? [];
        setEmp(empList);
        setPayrolls(payList);
        setStats({
          totalGross: payList.reduce((s: number, p: any) => s + (p.grossSalary ?? 0), 0),
          totalNet:   payList.reduce((s: number, p: any) => s + (p.netSalary ?? 0), 0),
          totalCost:  payList.reduce((s: number, p: any) => s + (p.totalEmployerCost ?? 0), 0),
          paid:       payList.filter((p: any) => p.status === 'PAID').length,
          validated:  payList.filter((p: any) => p.status === 'VALIDATED').length,
          draft:      payList.filter((p: any) => p.status === 'DRAFT').length,
          count:      payList.length,
          empCount:   empList.length,
        });
      })
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [companyId, year]);

  const masseSalariale = MONTHS.map((m, i) => {
    const mp = payrolls.filter((p: any) => p.month === i + 1);
    return {
      mois: m,
      brut: mp.reduce((s: number, p: any) => s + (p.grossSalary ?? 0), 0),
      net:  mp.reduce((s: number, p: any) => s + (p.netSalary ?? 0), 0),
      cout: mp.reduce((s: number, p: any) => s + (p.totalEmployerCost ?? 0), 0),
    };
  });

  const statutData = stats ? [
    { name: 'Payés',      value: stats.paid,      color: C.emerald },
    { name: 'Validés',    value: stats.validated,  color: C.cyan    },
    { name: 'Brouillons', value: stats.draft,      color: C.amber   },
  ].filter(d => d.value > 0) : [];

  const PAYROLL_BADGE: Record<string, any> = {
    PAID:      { label: 'Payé',       variant: 'success' },
    VALIDATED: { label: 'Validé',     variant: 'info'    },
    DRAFT:     { label: 'Brouillon',  variant: 'warning' },
  };

  return (
    <div className="p-6 space-y-5" style={{ minHeight: '100vh', background: C.pageBg }}>

      <PageHeader
        title="Rapports"
        sub="Analyse RH et masse salariale"
        icon={<Ico.BarChart size={18} color={C.cyan} />}
        action={
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: C.cardBg, border: `1px solid ${C.border}` }}
          >
            <Ico.Leave size={13} color={C.textMuted} />
            <select
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              className="bg-transparent text-sm outline-none"
              style={{ color: C.textPrimary }}
            >
              {[year - 1, year, year + 1].map(y => (
                <option key={y} value={y} style={{ background: C.cardBg }}>{y}</option>
              ))}
            </select>
          </div>
        }
      />

      {/* KPIs */}
      {loading ? <LoadingInline /> : stats && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard label="Employés actifs" value={stats.empCount}              icon={<Ico.Users    size={16} color={C.indigo}  />} accentColor={C.indigo}  />
            <KpiCard label="Masse nette"     value={`${fmt(stats.totalNet)} F`}  icon={<Ico.Dollar   size={16} color={C.emerald} />} accentColor={C.emerald} />
            <KpiCard label="Masse brute"     value={`${fmt(stats.totalGross)} F`}icon={<Ico.TrendUp  size={16} color={C.cyan}    />} accentColor={C.cyan}    />
            <KpiCard label="Coût total emp." value={`${fmt(stats.totalCost)} F`} icon={<Ico.Wallet   size={16} color={C.amber}   />} accentColor={C.amber}   />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-3 gap-4">

            {/* Bar chart — masse salariale */}
            <Card className="col-span-2 p-5">
              <SectionHeader title={`Évolution masse salariale ${year}`} />
              <div className="pt-4">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={masseSalariale} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis dataKey="mois" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false}
                      tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
                    <Tooltip {...tooltipStyle} formatter={(v: any) => [`${fmt(v)} F`, '']} />
                    <Bar dataKey="brut" name="Brut"         fill={C.cyan}    radius={[3, 3, 0, 0]} />
                    <Bar dataKey="net"  name="Net"          fill={C.emerald} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="cout" name="Coût total"   fill={C.amber}   radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Pie chart — statuts bulletins */}
            <Card className="p-5">
              <SectionHeader title={`Bulletins ${year}`} sub={`${stats.count} total`} />
              <div className="pt-4">
                {statutData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie
                        data={statutData}
                        cx="50%"
                        cy="50%"
                        outerRadius={65}
                        innerRadius={35}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {statutData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-40 text-sm" style={{ color: C.textMuted }}>
                    Aucun bulletin
                  </div>
                )}

                <div className="space-y-2 mt-2">
                  {[
                    { label: 'Payés',      value: stats.paid,      color: C.emerald },
                    { label: 'Validés',    value: stats.validated,  color: C.cyan    },
                    { label: 'Brouillons', value: stats.draft,      color: C.amber   },
                  ].map(s => (
                    <div key={s.label} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                        <span style={{ color: C.textSecondary }}>{s.label}</span>
                      </div>
                      <span className="font-semibold" style={{ color: C.textPrimary }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Recent payrolls table */}
          {payrolls.length > 0 && (
            <Card>
              <SectionHeader title={`Derniers bulletins`} sub={`${payrolls.length} au total`} />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <Th>Employé</Th>
                      <Th>Mois</Th>
                      <Th align="right">Brut</Th>
                      <Th align="right">Net</Th>
                      <Th align="right">Coût total</Th>
                      <Th align="center">Statut</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {payrolls.slice(0, 10).map((p: any, i) => {
                      const sb = PAYROLL_BADGE[p.status] ?? PAYROLL_BADGE['DRAFT'];
                      return (
                        <tr
                          key={p.id}
                          className="transition-colors"
                          style={{ borderBottom: `1px solid ${C.border}` }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Avatar
                                name={`${p.employee?.firstName ?? ''} ${p.employee?.lastName ?? ''}`}
                                size={26}
                                index={i}
                              />
                              <span className="text-sm" style={{ color: C.textPrimary }}>
                                {p.employee?.firstName} {p.employee?.lastName}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs" style={{ color: C.textSecondary }}>
                            {MONTHS[(p.month ?? 1) - 1]} {p.year}
                          </td>
                          <td className="px-4 py-3 text-right text-xs" style={{ color: C.textSecondary }}>
                            {fmt(p.grossSalary ?? 0)} F
                          </td>
                          <td className="px-4 py-3 text-right text-xs font-semibold" style={{ color: C.emerald }}>
                            {fmt(p.netSalary ?? 0)} F
                          </td>
                          <td className="px-4 py-3 text-right text-xs" style={{ color: C.amber }}>
                            {fmt(p.totalEmployerCost ?? 0)} F
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge label={sb.label} variant={sb.variant} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}