'use client';

// ============================================================================
// app/(dashboard)/cabinet/[cabinetId]/dashboard/page.tsx
// DASHBOARD CABINET — Vue globale agrégée sur toutes les PME
// PAS de liste de gestion ici — c'est la page /mes-pme pour ça
// Inspiré du dashboard Konza Entreprise : KPI + courbes + résumés
// ============================================================================

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Building2, Users, FileText, DollarSign, TrendingUp, TrendingDown,
  AlertCircle, Clock, Crown, Loader2, ArrowUpRight, ArrowRight,
  CheckCircle2, Wallet, BarChart3, Calendar,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { api } from '@/services/api';
import CabinetSidebar from '../CabinetSidebar';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt    = (n: number) => new Intl.NumberFormat('fr-CG', { maximumFractionDigits: 0 }).format(n);
const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
const CHART_COLORS = ['#0EA5E9','#10B981','#F59E0B','#8B5CF6','#EC4899','#6366F1'];

// ─── Types ────────────────────────────────────────────────────────────────────
interface DashboardData {
  totalCompanies:  number;
  pendingPayrolls: number;
  wallet:          any;
  companies:       Array<{
    companyId: string; legalName: string; tradeName: string | null;
    employeeCount: number; lastPayroll: any;
    pmePortalEnabled: boolean;
  }>;
}

interface Subscription {
  planLabel: string; status: string; isTrial: boolean;
  trialEndsAt: string | null; bulletinsBalance: number;
  remainingSlots: number | null; canGenerate: boolean;
}

// ─── Tooltip recharts ─────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0f1a2e] border border-white/10 rounded-xl px-4 py-3 text-xs shadow-xl">
      <p className="text-gray-400 mb-2 font-medium">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          {p.name} : <span className="font-bold">{fmt(p.value)} F</span>
        </p>
      ))}
    </div>
  );
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, icon: Icon, color, trend, onClick,
}: {
  label: string; value: string | number; sub?: string;
  icon: any; color: string; trend?: { val: number; label: string };
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white/3 border border-white/8 rounded-2xl p-5 transition-all ${onClick ? 'cursor-pointer hover:bg-white/5 hover:border-white/15' : ''}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
             style={{ background: `${color}22`, border: `1px solid ${color}44` }}>
          <Icon size={18} style={{ color }} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend.val >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend.val >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend.val >= 0 ? '+' : ''}{trend.val.toFixed(1)}%
          </div>
        )}
        {onClick && !trend && (
          <ArrowRight size={14} className="text-gray-700" />
        )}
      </div>
      <p className="text-2xl font-bold text-white mb-0.5">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
      {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
    </div>
  );
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

  // ── Calculs agrégés sur toutes les PME ──────────────────────────────────────
  const agg = useMemo(() => {
    if (!data) return null;
    const companies = data.companies;

    // Total employés
    const totalEmployees = companies.reduce((s, c) => s + c.employeeCount, 0);

    // Masse salariale totale du dernier bulletin de chaque PME
    const totalNetLast   = companies.reduce((s, c) => s + (c.lastPayroll?.netSalary ?? 0), 0);

    // Bulletins générés ce mois (ceux qui ont un lastPayroll ce mois-ci)
    const now = new Date();
    const bulletinsThisMonth = companies.filter(c =>
      c.lastPayroll?.month === now.getMonth() + 1 &&
      c.lastPayroll?.year  === now.getFullYear()
    ).length;

    // PME avec portail actif
    const portailActifs = companies.filter(c => c.pmePortalEnabled).length;

    // PME sans paie ce mois
    const pmeWithoutPayroll = companies.filter(c =>
      !c.lastPayroll ||
      !(c.lastPayroll.month === now.getMonth() + 1 && c.lastPayroll.year === now.getFullYear())
    ).length;

    // Données graphique : masse salariale agrégée simulée par mois (sur les données dispos)
    // En production, un endpoint dédié retournerait l'historique réel
    const chartData = MONTHS.map((m, i) => ({
      mois:  m,
      masse: i === now.getMonth() ? totalNetLast : 0,
    }));

    // Répartition statuts bulletins
    const statusRepartition = [
      { name: 'Payés',     value: companies.filter(c => c.lastPayroll?.status === 'PAID').length,      color: '#10B981' },
      { name: 'Validés',   value: companies.filter(c => c.lastPayroll?.status === 'VALIDATED').length,  color: '#0EA5E9' },
      { name: 'En cours',  value: companies.filter(c => c.lastPayroll?.status === 'DRAFT').length,      color: '#F59E0B' },
      { name: 'Sans paie', value: pmeWithoutPayroll,                                                     color: '#6B7280' },
    ].filter(d => d.value > 0);

    // Top PME par employés
    const topPme = [...companies]
      .sort((a, b) => b.employeeCount - a.employeeCount)
      .slice(0, 5);

    return {
      totalEmployees, totalNetLast, bulletinsThisMonth,
      portailActifs, pmeWithoutPayroll, chartData,
      statusRepartition, topPme,
    };
  }, [data]);

  const daysLeft = sub?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(sub.trialEndsAt).getTime() - Date.now()) / 86400000))
    : null;

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <Loader2 size={28} className="text-purple-400 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <CabinetSidebar cabinetId={cabinetId} userEmail={user?.email} />

      <main className="ml-56 p-8 space-y-8">

        {/* ── En-tête ───────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600 uppercase tracking-widest mb-1">Cabinet</p>
            <h1 className="text-2xl font-bold text-white">Tableau de bord</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
            </p>
          </div>
          <button
            onClick={() => router.push(`/cabinet/${cabinetId}/mes-pme`)}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-500 hover:bg-purple-400 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <Building2 size={15} /> Gérer mes PME
          </button>
        </div>

        {/* ── Bannière essai / alerte wallet ───────────────────────────────── */}
        {sub?.isTrial && (
          <div className="bg-purple-500/10 border border-purple-500/25 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Crown size={18} className="text-purple-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-white">Essai gratuit — {sub.planLabel}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {daysLeft !== null ? `${daysLeft} jour${daysLeft > 1 ? 's' : ''} restant${daysLeft > 1 ? 's' : ''}` : ''}
                  {' · '}{sub.bulletinsBalance} bulletin{sub.bulletinsBalance > 1 ? 's' : ''} disponible{sub.bulletinsBalance > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <button onClick={() => router.push(`/cabinet/${cabinetId}/abonnement`)}
              className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors whitespace-nowrap">
              Voir les plans →
            </button>
          </div>
        )}

        {/* Alerte paies en attente */}
        {data && data.pendingPayrolls > 0 && (
          <div className="bg-amber-500/8 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle size={16} className="text-amber-400 shrink-0" />
              <p className="text-sm text-amber-300">
                <span className="font-bold">{data.pendingPayrolls} PME</span> ont des bulletins en attente de traitement ce mois-ci
              </p>
            </div>
            <button onClick={() => router.push(`/cabinet/${cabinetId}/mes-pme?filter=PENDING`)}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 whitespace-nowrap transition-colors">
              Traiter →
            </button>
          </div>
        )}

        {/* ── KPI principaux ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="PME clientes"
            value={data?.totalCompanies ?? 0}
            sub={`${agg?.portailActifs ?? 0} portails actifs`}
            icon={Building2}
            color="#8b5cf6"
            onClick={() => router.push(`/cabinet/${cabinetId}/mes-pme`)}
          />
          <KpiCard
            label="Employés sous gestion"
            value={fmt(agg?.totalEmployees ?? 0)}
            sub="Toutes PME confondues"
            icon={Users}
            color="#0ea5e9"
          />
          <KpiCard
            label="Masse salariale du mois"
            value={`${fmt(agg?.totalNetLast ?? 0)} F`}
            sub="Net agrégé — mois en cours"
            icon={DollarSign}
            color="#22c55e"
          />
          <KpiCard
            label="Bulletins restants"
            value={sub?.bulletinsBalance ?? '∞'}
            sub={sub?.planLabel ?? 'Pay-as-you-go'}
            icon={Wallet}
            color="#f97316"
            onClick={() => router.push(`/cabinet/${cabinetId}/abonnement`)}
          />
        </div>

        {/* ── KPI secondaires ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={15} className="text-emerald-400" />
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Bulletins ce mois</p>
            </div>
            <p className="text-3xl font-bold text-white">{agg?.bulletinsThisMonth ?? 0}</p>
            <p className="text-xs text-gray-600 mt-1">sur {data?.totalCompanies ?? 0} PME</p>
            {/* Barre de progression */}
            <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all"
                   style={{ width: `${data?.totalCompanies ? ((agg?.bulletinsThisMonth ?? 0) / data.totalCompanies) * 100 : 0}%` }} />
            </div>
          </div>

          <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={15} className="text-amber-400" />
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">PME sans paie</p>
            </div>
            <p className="text-3xl font-bold text-white">{agg?.pmeWithoutPayroll ?? 0}</p>
            <p className="text-xs text-gray-600 mt-1">à traiter ce mois</p>
            {(agg?.pmeWithoutPayroll ?? 0) > 0 && (
              <button onClick={() => router.push(`/cabinet/${cabinetId}/mes-pme?filter=PENDING`)}
                className="mt-3 flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors">
                Voir la liste <ArrowRight size={11} />
              </button>
            )}
          </div>

          <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 size={15} className="text-blue-400" />
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Portails PME actifs</p>
            </div>
            <p className="text-3xl font-bold text-white">{agg?.portailActifs ?? 0}</p>
            <p className="text-xs text-gray-600 mt-1">dirigeants connectés</p>
            <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all"
                   style={{ width: `${data?.totalCompanies ? ((agg?.portailActifs ?? 0) / data.totalCompanies) * 100 : 0}%` }} />
            </div>
          </div>
        </div>

        {/* ── Graphiques ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-5">

          {/* Masse salariale agrégée */}
          <div className="col-span-2 bg-white/3 border border-white/8 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-semibold text-white text-sm">Masse salariale agrégée</h3>
                <p className="text-xs text-gray-500 mt-0.5">Toutes PME — net mensuel cumulé</p>
              </div>
              <span className="text-xs text-gray-600 bg-white/3 border border-white/8 px-2.5 py-1 rounded-full">
                {new Date().getFullYear()}
              </span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={agg?.chartData ?? []} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="massGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="mois" tick={{ fill:'#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:'#6b7280', fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `${(v/1000000).toFixed(1)}M`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="masse" name="Masse nette" stroke="#8b5cf6"
                  strokeWidth={2} fill="url(#massGrad)" dot={{ fill:'#8b5cf6', r:3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Répartition statuts bulletins */}
          <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
            <h3 className="font-semibold text-white text-sm mb-1">Statuts bulletins</h3>
            <p className="text-xs text-gray-500 mb-4">Ce mois · {data?.totalCompanies ?? 0} PME</p>
            {agg?.statusRepartition.length ? (
              <>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie data={agg.statusRepartition} cx="50%" cy="50%"
                      innerRadius={40} outerRadius={65} dataKey="value" strokeWidth={0}>
                      {agg.statusRepartition.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background:'#0f1a2e', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, fontSize:11 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {agg.statusRepartition.map(s => (
                    <div key={s.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                        <span className="text-gray-400">{s.name}</span>
                      </div>
                      <span className="text-white font-semibold">{s.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-32 text-gray-600 text-sm">
                Aucune donnée
              </div>
            )}
          </div>
        </div>

        {/* ── Top PME + Accès rapides ───────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-5">

          {/* Top PME par effectifs */}
          <div className="col-span-2 bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
              <h3 className="font-semibold text-white text-sm">Vos PME</h3>
              <button onClick={() => router.push(`/cabinet/${cabinetId}/mes-pme`)}
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1">
                Voir toutes <ArrowRight size={11} />
              </button>
            </div>
            <div className="divide-y divide-white/5">
              {(agg?.topPme ?? []).length === 0 ? (
                <div className="py-8 text-center text-gray-600 text-sm">
                  Aucune PME · <button onClick={() => router.push(`/cabinet/${cabinetId}/ajouter-pme`)}
                    className="text-purple-400 hover:text-purple-300">Ajouter</button>
                </div>
              ) : (
                (agg?.topPme ?? []).map(company => {
                  const lp = company.lastPayroll;
                  const statusColor = lp?.status === 'PAID' ? 'text-emerald-400' :
                                      lp?.status === 'VALIDATED' ? 'text-blue-400' :
                                      lp?.status === 'DRAFT'     ? 'text-amber-400' : 'text-gray-600';
                  const statusLabel = lp?.status === 'PAID' ? 'Payé' :
                                      lp?.status === 'VALIDATED' ? 'Validé' :
                                      lp?.status === 'DRAFT'     ? 'En cours' : 'Sans paie';
                  return (
                    <div key={company.companyId}
                      className="px-5 py-3.5 flex items-center gap-3 hover:bg-white/3 cursor-pointer transition-colors"
                      onClick={() => router.push(`/cabinet/${cabinetId}/entreprise/${company.companyId}/dashboard`)}>
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/20 rounded-lg flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-purple-400">
                          {(company.tradeName || company.legalName).slice(0,2).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">
                          {company.tradeName || company.legalName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {company.employeeCount} employé{company.employeeCount > 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        {lp ? (
                          <>
                            <p className={`text-xs font-semibold ${statusColor}`}>{statusLabel}</p>
                            <p className="text-[10px] text-gray-600">{MONTHS[(lp.month ?? 1) - 1]} {lp.year}</p>
                          </>
                        ) : (
                          <p className="text-xs text-gray-600">Aucune paie</p>
                        )}
                      </div>
                      <ArrowRight size={13} className="text-gray-700 shrink-0" />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Accès rapides */}
          {/* Accès rapides */}
<div className="space-y-3">
  <h3 className="font-semibold text-white text-sm px-1">Accès rapides</h3>
  {[
    { label: 'Gérer mes PME',      icon: Building2,  color:'#8b5cf6', link: `/cabinet/${cabinetId}/mes-pme`       },
    { label: 'Clôture & Import',    icon: FileText,   color:'#0ea5e9', link: `/cabinet/${cabinetId}/cloture`       },
    { label: 'Ajouter une PME',     icon: () => <span className="text-sm font-bold">+</span>, color:'#22c55e', link: `/cabinet/${cabinetId}/ajouter-pme` },
    { label: 'Gestionnaires',       icon: Users,      color:'#f97316', link: `/cabinet/${cabinetId}/gestionnaires` },
    { label: 'Abonnement',          icon: Wallet,     color:'#6366f1', link: `/cabinet/${cabinetId}/abonnement`   },
    { label: 'Paramètres cabinet',  icon: BarChart3,  color:'#06b6d4', link: `/cabinet/${cabinetId}/parametres`   },
  ].map((a, idx) => {
    // ON CRÉE LA CONSTANTE ICI AVEC UNE MAJUSCULE
    const Icon = a.icon; 
    
    return (
      <button key={idx} onClick={() => router.push(a.link)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white/3 hover:bg-white/5 border border-white/8 hover:border-white/15 rounded-xl text-sm text-left transition-all group">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
             style={{ background:`${a.color}22`, border:`1px solid ${a.color}44` }}>
          {/* UTILISATION DE LA CONSTANTE ICON */}
          <Icon size={13} style={{ color: a.color }} />
        </div>
        <span className="text-gray-300 group-hover:text-white transition-colors flex-1">{a.label}</span>
        <ArrowRight size={12} className="text-gray-700 group-hover:text-gray-400 transition-colors" />
      </button>
    );
  })}
</div>
        </div>

      </main>
    </div>
  );
}