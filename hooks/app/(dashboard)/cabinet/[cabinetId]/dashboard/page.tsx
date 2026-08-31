'use client';

// ============================================================================
// app/(dashboard)/cabinet/[cabinetId]/dashboard/page.tsx
// REFONTE UX — Dashboard Cabinet, ADN visuel Entreprise, SVG custom, no Lucide
// ============================================================================

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { api } from '@/services/api';
import CabinetSidebar from '../CabinetSidebar';
import {
  C, Ico, PageShell, TopBar, Card, KpiCard,
  SectionHeader, Badge, Avatar, Btn, Banner,
  LoadingScreen, ProgressBar,
} from '@/components/cabinet/cabinet-ui';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt    = (n: number) => new Intl.NumberFormat('fr-CG', { maximumFractionDigits: 0 }).format(n);
const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

// ─── Tooltip recharts ─────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-4 py-3 text-xs shadow-2xl"
         style={{ background: C.surfaceBg, border: `1px solid ${C.border}` }}>
      <p className="mb-2 font-medium" style={{ color: C.textSecondary }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="flex items-center gap-2" style={{ color: p.color }}>
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          {p.name} : <span className="font-bold">{fmt(p.value)} F</span>
        </p>
      ))}
    </div>
  );
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface DashboardData {
  totalCompanies:  number;
  pendingPayrolls: number;
  wallet: any;
  companies: Array<{
    companyId: string; legalName: string; tradeName: string | null;
    employeeCount: number; lastPayroll: any; pmePortalEnabled: boolean;
  }>;
}

interface Subscription {
  // Nouveau shape CabinetSubscription
  plan:             string;
  status:           string;
  trialEndsAt:      string | null;
  currentPeriodEnd: string;
  maxCompanies:     number;
  maxEmployees:     number;
  currentCompanies: number;
  currentEmployees: number;
  daysLeftInTrial:  number;
  canAddCompany:    boolean;
  // Compat ancien shape (wallet renvoyait ces champs)
  planLabel?:       string;
  isTrial?:         boolean;
  bulletinsBalance?: number;
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function CabinetDashboardPage() {
  const params    = useParams();
  const router    = useRouter();
  const cabinetId = params.cabinetId as string;

  const [data,    setData]    = useState<DashboardData | null>(null);
  const [sub,     setSub]     = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [user,    setUser]    = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) { try { setUser(JSON.parse(stored)); } catch {} }

    const load = async () => {
      try {
        const [dash, subscription] = await Promise.all([
          api.get(`/cabinet/${cabinetId}/dashboard`),
          api.get(`/cabinet/${cabinetId}/subscription`),
        ]);
        setData(dash as DashboardData);
        setSub(subscription as Subscription);
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, [cabinetId]);

  const agg = useMemo(() => {
    if (!data) return null;
    const cos = data.companies;
    const now = new Date();

    const totalEmployees = cos.reduce((s, c) => s + c.employeeCount, 0);
    const totalNetLast   = cos.reduce((s, c) => s + (c.lastPayroll?.netSalary ?? 0), 0);
    const bulletinsThisMonth = cos.filter(c =>
      c.lastPayroll?.month === now.getMonth() + 1 && c.lastPayroll?.year === now.getFullYear()
    ).length;
    const portailActifs    = cos.filter(c => c.pmePortalEnabled).length;
    const pmeWithoutPayroll = cos.filter(c =>
      !c.lastPayroll ||
      !(c.lastPayroll.month === now.getMonth() + 1 && c.lastPayroll.year === now.getFullYear())
    ).length;

    const chartData = MONTHS.map((m, i) => ({
      mois:  m,
      masse: i === now.getMonth() ? totalNetLast : 0,
    }));

    const statusRepartition = [
      { name: 'Payés',    value: cos.filter(c => c.lastPayroll?.status === 'PAID').length,      color: C.emerald },
      { name: 'Validés',  value: cos.filter(c => c.lastPayroll?.status === 'VALIDATED').length,  color: C.cyan    },
      { name: 'En cours', value: cos.filter(c => c.lastPayroll?.status === 'DRAFT').length,      color: C.amber   },
      { name: 'Sans paie',value: pmeWithoutPayroll,                                               color: C.textMuted },
    ].filter(d => d.value > 0);

    const topPme = [...cos].sort((a, b) => b.employeeCount - a.employeeCount).slice(0, 5);

    return { totalEmployees, totalNetLast, bulletinsThisMonth, portailActifs, pmeWithoutPayroll, chartData, statusRepartition, topPme };
  }, [data]);

  const daysLeft = sub?.daysLeftInTrial ?? (sub?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(sub.trialEndsAt).getTime() - Date.now()) / 86400000))
    : 0);

  if (loading) return <LoadingScreen />;

  const dateStr = new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  // ─── Quick-actions ─────────────────────────────────────────────────────────
  const quickActions = [
    { label: 'Mes PME',          icon: <Ico.Building size={14} color={C.indigo}   />, color: C.indigo,   href: `mes-pme`        },
    { label: 'Clôture & Import', icon: <Ico.FileText size={14} color={C.cyan}     />, color: C.cyan,     href: `cloture`        },
    { label: 'Ajouter une PME',  icon: <Ico.Plus     size={14} color={C.emerald}  />, color: C.emerald,  href: `ajouter-pme`    },
    { label: 'Gestionnaires',    icon: <Ico.Users    size={14} color={C.amber}    />, color: C.amber,    href: `gestionnaires`  },
    { label: 'Abonnement',       icon: <Ico.Wallet   size={14} color={C.violet}   />, color: C.violet,   href: `abonnement`     },
    { label: 'Paramètres',       icon: <Ico.Settings size={14} color={C.teal}     />, color: C.teal,     href: `parametres`     },
  ];

  return (
    <div className="min-h-screen" style={{ background: C.pageBg }}>
      <CabinetSidebar cabinetId={cabinetId} userEmail={user?.email} userName={user?.firstName ? `${user.firstName} ${user.lastName ?? ''}`.trim() : undefined} />

      <div className="ml-56">
        {/* TopBar */}
        <TopBar
          title="Tableau de bord"
          subtitle={dateStr}
          breadcrumb="Cabinet"
          action={
            <Btn variant="primary" icon={<Ico.Building size={14} color="#fff" />} onClick={() => router.push(`/cabinet/${cabinetId}/mes-pme`)}>
              Gérer mes PME
            </Btn>
          }
        />

        <div className="p-8 space-y-6">

          {/* ── Banners ─────────────────────────────────────────────────── */}
          {sub?.status === 'TRIALING' && (
            <Banner
              icon={<Ico.Crown size={18} color={C.violet} />}
              color={C.violet}
              title={`Essai gratuit — Plan ${sub.plan ?? 'Starter'}`}
              sub={`${daysLeft > 0 ? `${daysLeft} jour${daysLeft > 1 ? 's' : ''} restant${daysLeft > 1 ? 's' : ''}` : 'Expiré'} · ${sub.currentCompanies ?? 0}/${sub.maxCompanies ?? 5} PME`}
              action={{ label: 'Voir les plans', onClick: () => router.push(`/cabinet/${cabinetId}/abonnement`) }}
            />
          )}

          {data && data.pendingPayrolls > 0 && (
            <Banner
              icon={<Ico.Alert size={16} color={C.amber} />}
              color={C.amber}
              title={`${data.pendingPayrolls} PME ont des bulletins en attente ce mois`}
              action={{ label: 'Traiter', onClick: () => router.push(`/cabinet/${cabinetId}/mes-pme?filter=PENDING`) }}
            />
          )}

          {/* ── KPI principaux ──────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="PME clientes"
              value={data?.totalCompanies ?? 0}
              sub={`${agg?.portailActifs ?? 0} portails actifs`}
              icon={<Ico.Building size={18} color={C.indigo} />}
              accentColor={C.indigo}
              onClick={() => router.push(`/cabinet/${cabinetId}/mes-pme`)}
            />
            <KpiCard
              label="Employés sous gestion"
              value={fmt(agg?.totalEmployees ?? 0)}
              sub="Toutes PME confondues"
              icon={<Ico.Users size={18} color={C.cyan} />}
              accentColor={C.cyan}
            />
            <KpiCard
              label="Masse salariale du mois"
              value={`${fmt(agg?.totalNetLast ?? 0)} F`}
              sub="Net agrégé — mois en cours"
              icon={<Ico.Dollar size={18} color={C.emerald} />}
              accentColor={C.emerald}
            />
            <KpiCard
              label="Plan cabinet"
              value={sub ? `${sub.currentCompanies ?? 0}/${sub.maxCompanies ?? 5}` : '—'}
              sub={sub ? `Plan ${sub.plan} · ${sub.currentEmployees ?? 0} employés` : 'Chargement…'}
              icon={<Ico.Wallet size={18} color={C.amber} />}
              accentColor={C.amber}
              onClick={() => router.push(`/cabinet/${cabinetId}/abonnement`)}
            />
          </div>

          {/* ── KPI secondaires ─────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-4">
            {/* Bulletins ce mois */}
            <Card accentColor={C.emerald} className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Ico.FileText size={15} color={C.emerald} />
                <p className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: C.textMuted }}>
                  Bulletins ce mois
                </p>
              </div>
              <p className="text-3xl font-bold" style={{ color: C.textPrimary }}>
                {agg?.bulletinsThisMonth ?? 0}
              </p>
              <p className="text-xs mt-1" style={{ color: C.textMuted }}>
                sur {data?.totalCompanies ?? 0} PME
              </p>
              <ProgressBar
                value={agg?.bulletinsThisMonth ?? 0}
                max={data?.totalCompanies ?? 1}
                color={C.emerald}
              />
            </Card>

            {/* PME sans paie */}
            <Card accentColor={C.amber} className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Ico.Clock size={15} color={C.amber} />
                <p className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: C.textMuted }}>
                  PME sans paie
                </p>
              </div>
              <p className="text-3xl font-bold" style={{ color: C.textPrimary }}>
                {agg?.pmeWithoutPayroll ?? 0}
              </p>
              <p className="text-xs mt-1" style={{ color: C.textMuted }}>à traiter ce mois</p>
              {(agg?.pmeWithoutPayroll ?? 0) > 0 && (
                <button
                  onClick={() => router.push(`/cabinet/${cabinetId}/mes-pme?filter=PENDING`)}
                  className="mt-3 flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-75"
                  style={{ color: C.amber }}
                >
                  Voir la liste <Ico.ArrowRight size={11} color={C.amber} />
                </button>
              )}
            </Card>

            {/* Portails PME actifs */}
            <Card accentColor={C.cyan} className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Ico.Check size={15} color={C.cyan} />
                <p className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: C.textMuted }}>
                  Portails actifs
                </p>
              </div>
              <p className="text-3xl font-bold" style={{ color: C.textPrimary }}>
                {agg?.portailActifs ?? 0}
              </p>
              <p className="text-xs mt-1" style={{ color: C.textMuted }}>dirigeants connectés</p>
              <ProgressBar
                value={agg?.portailActifs ?? 0}
                max={data?.totalCompanies ?? 1}
                color={C.cyan}
              />
            </Card>
          </div>

          {/* ── Graphiques ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-5">

            {/* Masse salariale agrégée */}
            <Card className="col-span-2 p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-sm font-semibold" style={{ color: C.textPrimary }}>Masse salariale agrégée</p>
                  <p className="text-xs mt-0.5" style={{ color: C.textSecondary }}>Toutes PME — net mensuel cumulé</p>
                </div>
                <span
                  className="text-xs px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.06)', color: C.textMuted }}
                >
                  {new Date().getFullYear()}
                </span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={agg?.chartData ?? []} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="massGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={C.indigo} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={C.indigo} stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="mois" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false}
                    tickFormatter={v => `${(v / 1000000).toFixed(1)}M`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="masse" name="Masse nette" stroke={C.indigo}
                    strokeWidth={2} fill="url(#massGrad)" dot={{ fill: C.indigo, r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            {/* Statuts bulletins */}
            <Card className="p-5">
              <p className="text-sm font-semibold mb-1" style={{ color: C.textPrimary }}>Statuts bulletins</p>
              <p className="text-xs mb-4" style={{ color: C.textSecondary }}>
                Ce mois · {data?.totalCompanies ?? 0} PME
              </p>
              {agg?.statusRepartition.length ? (
                <>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie data={agg.statusRepartition} cx="50%" cy="50%"
                        innerRadius={38} outerRadius={60} dataKey="value" strokeWidth={0}>
                        {agg.statusRepartition.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: C.surfaceBg, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-2">
                    {agg.statusRepartition.map(s => (
                      <div key={s.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                          <span style={{ color: C.textSecondary }}>{s.name}</span>
                        </div>
                        <span className="font-semibold" style={{ color: C.textPrimary }}>{s.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-32 text-sm" style={{ color: C.textMuted }}>
                  Aucune donnée
                </div>
              )}
            </Card>
          </div>

          {/* ── Bottom row ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-5">

            {/* Top PME */}
            <Card className="col-span-2">
              <SectionHeader
                title="Vos PME"
                sub="Par effectifs"
                action={
                  <button
                    onClick={() => router.push(`/cabinet/${cabinetId}/mes-pme`)}
                    className="flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-75"
                    style={{ color: C.indigoL }}
                  >
                    Voir toutes <Ico.ArrowRight size={11} color={C.indigoL} />
                  </button>
                }
              />
              <div>
                {(agg?.topPme ?? []).length === 0 ? (
                  <div className="py-10 text-center text-sm" style={{ color: C.textMuted }}>
                    Aucune PME ·{' '}
                    <button
                      onClick={() => router.push(`/cabinet/${cabinetId}/ajouter-pme`)}
                      className="transition-opacity hover:opacity-75"
                      style={{ color: C.indigoL }}
                    >
                      Ajouter
                    </button>
                  </div>
                ) : (
                  (agg?.topPme ?? []).map((company, idx) => {
                    const lp = company.lastPayroll;
                    const statusMap: Record<string, { label: string; variant: any }> = {
                      PAID:      { label: 'Payé',      variant: 'success' },
                      VALIDATED: { label: 'Validé',    variant: 'info'    },
                      DRAFT:     { label: 'En cours',  variant: 'warning' },
                    };
                    const s = lp ? (statusMap[lp.status] ?? { label: 'Inconnu', variant: 'default' }) : null;

                    return (
                      <div
                        key={company.companyId}
                        className="flex items-center gap-3 px-5 py-3.5 cursor-pointer transition-colors"
                        style={{ borderBottom: `1px solid ${C.border}` }}
                        onClick={() => router.push(`/cabinet/${cabinetId}/entreprise/${company.companyId}/dashboard`)}
                        onMouseEnter={e => (e.currentTarget.style.background = C.cardBgHover)}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <Avatar
                          name={(company.tradeName || company.legalName).slice(0, 2)}
                          size={32}
                          index={idx}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: C.textPrimary }}>
                            {company.tradeName || company.legalName}
                          </p>
                          <p className="text-xs" style={{ color: C.textMuted }}>
                            {company.employeeCount} employé{company.employeeCount > 1 ? 's' : ''}
                          </p>
                        </div>
                        {s ? (
                          <Badge label={s.label} variant={s.variant} />
                        ) : (
                          <Badge label="Sans paie" variant="default" />
                        )}
                        <Ico.ArrowRight size={13} color={C.textMuted} />
                      </div>
                    );
                  })
                )}
              </div>
            </Card>

            {/* Accès rapides */}
            <div className="space-y-2.5">
              <p className="text-sm font-semibold px-1 mb-3" style={{ color: C.textPrimary }}>Accès rapides</p>
              {quickActions.map((a, i) => (
                <Card
                  key={i}
                  onClick={() => router.push(`/cabinet/${cabinetId}/${a.href}`)}
                  className="flex items-center gap-3 px-4 py-3 group"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${a.color}18`, border: `1px solid ${a.color}30` }}
                  >
                    {a.icon}
                  </div>
                  <span className="flex-1 text-[13px] font-medium" style={{ color: C.textSecondary }}>
                    {a.label}
                  </span>
                  <Ico.ArrowRight size={12} color={C.textMuted} />
                </Card>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}