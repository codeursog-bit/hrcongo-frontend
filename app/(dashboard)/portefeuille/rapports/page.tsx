'use client';

// app/(dashboard)/portefeuille/rapports/page.tsx

import React, { useEffect, useState, useMemo } from 'react';
import {
  BarChart3, Building2, Loader2, AlertCircle, Users, Wallet, Landmark, TrendingUp,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';
import { GlobalLoader } from '@/components/ui/GlobalLoader';
import { StatCard } from '@/components/ui/StatCard';
import { api } from '@/services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MonthPoint { month: number; year: number; headcount: number; gross: number; net: number; employerCost: number; cnss: number; its: number; avgSalary: number; }
interface CompanyReport { id: string; name: string; isActive: boolean; headcount: number; payrollByMonth: MonthPoint[]; }
interface Overview {
  periods: { month: number; year: number }[];
  companies: CompanyReport[];
  totals: { headcount: number; payrollByMonth: MonthPoint[] };
}

const MONTHS_SHORT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
const RANGE_OPTIONS = [3, 6, 12];
const LINE_COLORS = ['#10B981', '#6366F1', '#F59E0B', '#F43F5E', '#0EA5E9', '#A855F7', '#84CC16', '#EC4899'];

const fmtFCFA = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0)) + ' FCFA';
const fmtCompact = (n: number) => new Intl.NumberFormat('fr-FR', { notation: 'compact', compactDisplay: 'short' }).format(n || 0);

function Panel({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-2xl p-6 ${className}`} style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      {children}
    </div>
  );
}

export default function PortfolioReportsPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(6);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api.get<Overview>(`/portfolio/reports/overview?months=${range}`)
      .then(setData)
      .catch((e: any) => setError(e.message || 'Erreur lors du chargement'))
      .finally(() => setLoading(false));
  }, [range]);

  const monthLabels = useMemo(
    () => (data?.periods ?? []).map(p => `${MONTHS_SHORT[p.month - 1]} ${String(p.year).slice(-2)}`),
    [data],
  );

  // Reshape pour un LineChart multi-entreprises : une ligne par mois avec
  // une clé par entreprise (recharts veut un tableau plat "par point X").
  const netTrendData = useMemo(() => {
    if (!data) return [];
    return data.periods.map((p, i) => {
      const row: Record<string, any> = { label: monthLabels[i] };
      data.companies.forEach(c => { row[c.name] = c.payrollByMonth[i]?.net ?? 0; });
      return row;
    });
  }, [data, monthLabels]);

  const totalsTrendData = useMemo(() => {
    if (!data) return [];
    return data.totals.payrollByMonth.map((m, i) => ({
      label: monthLabels[i], Net: m.net, Charges: m.employerCost,
    }));
  }, [data, monthLabels]);

  // 🆕 Courbe comparative d'effectif — même principe que la masse salariale,
  // reconstruite mois par mois côté back (hireDate/terminationDate).
  const headcountTrendData = useMemo(() => {
    if (!data) return [];
    return data.periods.map((p, i) => {
      const row: Record<string, any> = { label: monthLabels[i] };
      data.companies.forEach(c => { row[c.name] = c.payrollByMonth[i]?.headcount ?? 0; });
      return row;
    });
  }, [data, monthLabels]);

  // 🆕 Salaire net moyen par employé — révèle des écarts que la masse
  // salariale brute masque (une entreprise avec plus de monde peut avoir
  // une masse plus grosse tout en payant moins par tête).
  const avgSalaryData = useMemo(() => {
    if (!data) return [];
    const lastIdx = data.periods.length - 1;
    return data.companies
      .map(c => ({ name: c.name, 'Salaire moyen': c.payrollByMonth[lastIdx]?.avgSalary ?? 0 }))
      .sort((a, b) => b['Salaire moyen'] - a['Salaire moyen']);
  }, [data]);

  const headcountData = useMemo(
    () => (data?.companies ?? []).map(c => ({ name: c.name, Effectif: c.headcount })).sort((a, b) => b.Effectif - a.Effectif),
    [data],
  );

  const latestChargesData = useMemo(() => {
    if (!data) return [];
    const lastIdx = data.periods.length - 1;
    return data.companies.map(c => ({
      name: c.name,
      CNSS: c.payrollByMonth[lastIdx]?.cnss ?? 0,
      ITS: c.payrollByMonth[lastIdx]?.its ?? 0,
    }));
  }, [data]);

  // 🆕 Petits encarts "qui est en tête" — lecture rapide sans avoir à
  // scanner le tableau détaillé.
  const insights = useMemo(() => {
    if (!data || data.companies.length === 0) return null;
    const lastIdx = data.periods.length - 1;
    const byHeadcount = [...data.companies].sort((a, b) => b.headcount - a.headcount)[0];
    const byNet = [...data.companies].sort((a, b) => (b.payrollByMonth[lastIdx]?.net ?? 0) - (a.payrollByMonth[lastIdx]?.net ?? 0))[0];
    const byCharges = [...data.companies].sort((a, b) => (b.payrollByMonth[lastIdx]?.employerCost ?? 0) - (a.payrollByMonth[lastIdx]?.employerCost ?? 0))[0];
    return { byHeadcount, byNet, byCharges };
  }, [data]);

  if (loading && !data) return <GlobalLoader />;

  const latestTotals = data?.totals.payrollByMonth[data.totals.payrollByMonth.length - 1];

  return (
    <div className="space-y-6 min-h-screen pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>Rapports</h1>
          <p className="mt-1 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Comparatif de toutes vos entreprises
          </p>
        </div>
        <div className="flex bg-[var(--surface-2)] p-1 rounded-xl w-fit">
          {RANGE_OPTIONS.map(r => (
            <button key={r} onClick={() => setRange(r)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${range === r ? 'bg-[var(--surface)] text-emerald-500 shadow-sm' : ''}`} style={{ color: range === r ? undefined : 'var(--text-muted)' }}>
              {r} mois
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium">
          <AlertCircle size={16} className="shrink-0" />{error}
        </div>
      )}

      {!data || data.companies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl" style={{ border: '2px dashed var(--border)' }}>
          <BarChart3 size={24} style={{ color: 'var(--text-muted)' }} className="mb-3" />
          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Pas encore de données à comparer</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Ajoutez des entreprises et générez de la paie pour voir les rapports.</p>
        </div>
      ) : (
        <>
          {/* ── INDICATEURS GLOBAUX ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard label="Entreprises comparées" value={String(data.companies.length)} trend={`${data.companies.filter(c => c.isActive).length} actives`} isPositive icon={Building2} color="emerald" />
            <StatCard label="Effectif total" value={String(data.totals.headcount)} trend="tous confondus" isPositive icon={Users} color="sky" />
            <StatCard label="Masse salariale nette" value={fmtCompact(latestTotals?.net ?? 0)} trend="dernier mois" isPositive icon={Wallet} color="violet" />
            <StatCard label="Charges patronales" value={fmtCompact(latestTotals?.employerCost ?? 0)} trend="dernier mois" isPositive={false} icon={Landmark} color="amber" />
          </div>

          {/* ── ENCARTS "QUI EST EN TÊTE" ── */}
          {insights && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0"><Users size={18} /></div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Plus gros effectif</p>
                  <p className="text-sm font-bold truncate" style={{ color: 'var(--text)' }}>{insights.byHeadcount.name} · {insights.byHeadcount.headcount}</p>
                </div>
              </div>
              <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0"><Wallet size={18} /></div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Plus grosse masse nette</p>
                  <p className="text-sm font-bold truncate" style={{ color: 'var(--text)' }}>{insights.byNet.name} · {fmtCompact(insights.byNet.payrollByMonth[insights.byNet.payrollByMonth.length - 1]?.net ?? 0)}</p>
                </div>
              </div>
              <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0"><Landmark size={18} /></div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Plus grosses charges</p>
                  <p className="text-sm font-bold truncate" style={{ color: 'var(--text)' }}>{insights.byCharges.name} · {fmtCompact(insights.byCharges.payrollByMonth[insights.byCharges.payrollByMonth.length - 1]?.employerCost ?? 0)}</p>
                </div>
              </div>
            </div>
          )}

          {/* ── EFFECTIF PAR ENTREPRISE ── */}
          <Panel>
            <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text)' }}>Effectif par entreprise</h3>
            <ResponsiveContainer width="100%" height={Math.max(180, headcountData.length * 42)}>
              <BarChart data={headcountData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={140} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="Effectif" fill="#0EA5E9" radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>

          {/* ── TENDANCE EFFECTIF (historique réel, comparatif) ── */}
          <Panel>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-sky-500" />
              <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Effectif — évolution sur {range} mois</h3>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={headcountTrendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {data.companies.map((c, i) => (
                  <Line key={c.id} type="monotone" dataKey={c.name} stroke={LINE_COLORS[i % LINE_COLORS.length]} strokeWidth={2} dot={{ r: 3 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Panel>

          {/* ── TENDANCE MASSE SALARIALE (comparatif entreprises) ── */}
          <Panel>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-emerald-500" />
              <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Masse salariale nette — comparatif sur {range} mois</h3>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={netTrendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={fmtCompact} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} formatter={(v: number) => fmtFCFA(v)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {data.companies.map((c, i) => (
                  <Line key={c.id} type="monotone" dataKey={c.name} stroke={LINE_COLORS[i % LINE_COLORS.length]} strokeWidth={2} dot={{ r: 3 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Panel>

          {/* ── NET vs CHARGES — PORTEFEUILLE GLOBAL ── */}
          <Panel>
            <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text)' }}>Net payé vs charges patronales — portefeuille global</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={totalsTrendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={fmtCompact} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} formatter={(v: number) => fmtFCFA(v)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="Net" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Charges" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </Panel>

          {/* ── CHARGES & COTISATIONS PAR ENTREPRISE (dernier mois) ── */}
          <Panel>
            <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text)' }}>
              Charges & cotisations par entreprise — {monthLabels[monthLabels.length - 1]}
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={latestChargesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={fmtCompact} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} formatter={(v: number) => fmtFCFA(v)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="CNSS" fill="#6366F1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ITS" fill="#F43F5E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>

          {/* ── SALAIRE MOYEN PAR EMPLOYÉ ── */}
          <Panel>
            <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text)' }}>
              Salaire net moyen par employé — {monthLabels[monthLabels.length - 1]}
            </h3>
            <ResponsiveContainer width="100%" height={Math.max(180, avgSalaryData.length * 42)}>
              <BarChart data={avgSalaryData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                <XAxis type="number" tickFormatter={fmtCompact} axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={140} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} formatter={(v: number) => fmtFCFA(v)} />
                <Bar dataKey="Salaire moyen" fill="#A855F7" radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>

          {/* ── TABLEAU DÉTAIL ── */}
          <Panel className="!p-0 overflow-hidden">
            <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Détail par entreprise — {monthLabels[monthLabels.length - 1]}</h3>
            </div>
            <div className="grid px-6 py-3" style={{ gridTemplateColumns: '1fr 100px 150px 150px 150px 150px', gap: 12, borderBottom: '1px solid var(--border)' }}>
              {['Entreprise', 'Effectif', 'Masse nette', 'Salaire moyen', 'Coût employeur', 'CNSS + ITS'].map((h, i) => (
                <p key={i} className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{h}</p>
              ))}
            </div>
            {data.companies.map(c => {
              const last = c.payrollByMonth[c.payrollByMonth.length - 1];
              return (
                <div key={c.id} className="grid items-center px-6 py-3 transition-colors hover:bg-[var(--surface-2)]"
                  style={{ gridTemplateColumns: '1fr 100px 150px 150px 150px 150px', gap: 12, borderBottom: '1px solid var(--border)' }}>
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{c.name}</p>
                  <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{c.headcount}</p>
                  <p className="text-sm" style={{ color: 'var(--text)' }}>{fmtFCFA(last?.net ?? 0)}</p>
                  <p className="text-sm" style={{ color: 'var(--text)' }}>{fmtFCFA(last?.avgSalary ?? 0)}</p>
                  <p className="text-sm" style={{ color: 'var(--text)' }}>{fmtFCFA(last?.employerCost ?? 0)}</p>
                  <p className="text-sm" style={{ color: 'var(--text)' }}>{fmtFCFA((last?.cnss ?? 0) + (last?.its ?? 0))}</p>
                </div>
              );
            })}
          </Panel>
        </>
      )}
    </div>
  );
}