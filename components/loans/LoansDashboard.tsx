'use client';

// ============================================================================
// 📁 components/loans/LoansDashboard.tsx
// Tableau de bord Prêts · Avances — même logique que les dashboards effectifs et
// présences : mêmes sélecteurs de période, mêmes cartes, Excel téléchargeable depuis
// le même écran. Quatre onglets :
//   • Vue d'ensemble : accordé et remboursé par mois, remboursements par mode
//   • Prêts          : demandes par statut, nature, type ; taux d'acceptation
//   • Avances        : demandes par statut ; taux d'acceptation
//   • Encours        : ce que les salariés doivent À CE JOUR, par département et par salarié
// Toutes les valeurs viennent du back (/loans-dashboard) — la même source que
// l'Excel : l'écran et le fichier affichent les mêmes chiffres.
// ============================================================================

import React, { useCallback, useEffect, useState } from 'react';
import {
  Download, Loader2, AlertCircle, Banknote, HandCoins, Wallet, Building2, TrendingUp, PieChart as PieIcon, BarChart3, Users,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList, PieChart, Pie, Legend,
  LineChart, Line,
} from 'recharts';
import { api } from '@/services/api';
import { FancySelect } from '@/components/ui/FancySelect';
import { WorkforcePeriodPicker } from '@/components/workforce/WorkforcePeriodPicker';
import { WfPeriodState, WfScopeMode, defaultPeriod, monthsCount } from '@/lib/workforce';
import { LdTopEmployee, LdView, fcfa, loansEndpoint, pct, short } from '@/lib/loans-dashboard';
import { LoansExportDialog } from './LoansExportDialog';

// ─── Couleurs ────────────────────────────────────────────────────────────────
const C = {
  navy: '#1F497D', teal: '#4BACC6', red: '#C0504D', orange: '#F79646', green: '#10B981', amber: '#F59E0B',
  purple: '#8064A2', kpi: '#28236B',
  multi: ['#4F81BD', '#C0504D', '#9BBB59', '#8064A2', '#4BACC6', '#F79646', '#2C4D75', '#772C2A'],
};
const TT = {
  contentStyle: { backgroundColor: 'var(--surface)', color: 'var(--text)', borderRadius: 12, border: '1px solid var(--border)' },
  itemStyle: { color: 'var(--text)' },
  labelStyle: { color: 'var(--text)', fontWeight: 700 },
  cursor: { fill: 'var(--surface-2)' },
};
const TICK = { fontSize: 11, fill: 'var(--text)' };
const LBL = { fill: 'var(--text)', fontSize: 12, fontWeight: 700 } as const;
const legendFmt = (v: any) => <span style={{ color: 'var(--text)', fontSize: 12 }}>{v}</span>;

type Row = { label: string; count: number };
type Fmt = (v: number) => string;
const plain: Fmt = (v) => String(v);

// ─── Briques de graphiques (valeurs toujours visibles, thème-aware) ──────────
function Card({ title, icon, hint, children }: { title: string; icon?: React.ReactNode; hint?: string; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] shadow-sm">
      <h3 className="text-sm font-bold text-[var(--text)] mb-1 flex items-center gap-2">{icon}{title}</h3>
      {hint && <p className="text-xs text-[var(--text-muted)] mb-3">{hint}</p>}
      <div className={hint ? '' : 'mt-3'}>{children}</div>
    </div>
  );
}

function Empty({ text = 'Aucune donnée sur cette période.' }: { text?: string }) {
  return <p className="text-sm text-[var(--text-muted)] py-10 text-center">{text}</p>;
}

function HBar({ data, color, labelWidth = 150, rowH = 30, fmt = plain, tip }: { data: Row[]; color: string; labelWidth?: number; rowH?: number; fmt?: Fmt; tip?: Fmt }) {
  if (data.length === 0 || data.every((d) => d.count === 0)) return <Empty />;
  const h = Math.max(140, data.length * rowH + 20);
  return (
    <div style={{ height: Math.min(h, 520), overflowY: h > 520 ? 'auto' : 'visible' }}>
      <ResponsiveContainer width="100%" height={h}>
        <BarChart layout="vertical" data={data} margin={{ left: 4, right: 56, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
          <XAxis type="number" hide />
          <YAxis dataKey="label" type="category" width={labelWidth} axisLine={false} tickLine={false} tick={TICK} interval={0} />
          <Tooltip {...TT} formatter={(v: any) => (tip ?? fmt)(Number(v))} />
          <Bar dataKey="count" name="Valeur" fill={color} radius={[0, 6, 6, 0]}>
            <LabelList dataKey="count" position="right" {...LBL} formatter={(v: any) => fmt(Number(v))} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function VBar({ data, colors, height = 240, fmt = plain, tip }: { data: Row[]; colors: string[]; height?: number; fmt?: Fmt; tip?: Fmt }) {
  if (data.every((d) => d.count === 0)) return <Empty />;
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 22, right: 8, left: -10, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={TICK} interval={0} />
          <YAxis axisLine={false} tickLine={false} tick={TICK} allowDecimals={false} tickFormatter={(v: any) => fmt(Number(v))} />
          <Tooltip {...TT} formatter={(v: any) => (tip ?? fmt)(Number(v))} />
          <Bar dataKey="count" name="Valeur" radius={[6, 6, 0, 0]}>
            {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
            <LabelList dataKey="count" position="top" {...LBL} formatter={(v: any) => fmt(Number(v))} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function Donut({ data, colors, height = 240, fmt = plain }: { data: Row[]; colors: string[]; height?: number; fmt?: Fmt }) {
  const d = data.filter((x) => x.count > 0);
  if (d.length === 0) return <Empty />;
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={d} dataKey="count" nameKey="label" cx="50%" cy="50%" innerRadius={48} outerRadius={82} paddingAngle={2}
            label={({ value }: any) => fmt(Number(value))} labelLine={false} stroke="var(--surface)">
            {d.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
          </Pie>
          <Tooltip {...TT} formatter={(v: any) => fmt(Number(v))} />
          <Legend formatter={legendFmt} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function Kpi({ title, value, sub, tone = 'light' }: { title: string; value: string; sub?: string; tone?: 'dark' | 'light' }) {
  return tone === 'dark' ? (
    <div className="rounded-2xl p-5 text-center text-white shadow-sm" style={{ background: C.kpi }}>
      <p className="text-xs font-bold tracking-wider">{title}</p>
      <p className="text-2xl xl:text-3xl font-extrabold mt-2 break-words">{value}</p>
      {sub && <p className="text-xs mt-1 opacity-80">{sub}</p>}
    </div>
  ) : (
    <div className="rounded-2xl p-5 text-center bg-[var(--surface)] border border-[var(--border)] shadow-sm">
      <p className="text-xs font-bold tracking-wider text-[var(--text-muted)]">{title}</p>
      <p className="text-xl xl:text-2xl font-extrabold mt-2 text-[var(--text)] break-words">{value}</p>
      {sub && <p className="text-xs mt-1 text-[var(--text-muted)]">{sub}</p>}
    </div>
  );
}

function TopTable({ rows }: { rows: LdTopEmployee[] }) {
  if (rows.length === 0) return <Empty text="Aucune dette en cours." />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-[var(--text-muted)] border-b border-[var(--border)]">
            <th className="py-2 pr-3">Salarié</th><th className="py-2 pr-3">Département</th>
            <th className="py-2 pr-3 text-right">Encours total</th><th className="py-2 pr-3 text-right">dont prêts</th><th className="py-2 text-right">dont avances</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-[var(--border)] last:border-0 text-[var(--text)]">
              <td className="py-2 pr-3 font-semibold">{r.fullName}</td>
              <td className="py-2 pr-3 text-[var(--text-muted)]">{r.department}</td>
              <td className="py-2 pr-3 text-right font-bold">{fcfa(r.value)}</td>
              <td className="py-2 pr-3 text-right">{fcfa(r.extra)}</td>
              <td className="py-2 text-right">{fcfa(r.value - r.extra)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Composant principal ─────────────────────────────────────────────────────

type Tab = 'OVERVIEW' | 'LOANS' | 'ADVANCES' | 'STOCK';
const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'OVERVIEW', label: 'Vue d’ensemble', icon: <TrendingUp size={15} /> },
  { id: 'LOANS', label: 'Prêts', icon: <HandCoins size={15} /> },
  { id: 'ADVANCES', label: 'Avances', icon: <Wallet size={15} /> },
  { id: 'STOCK', label: 'Encours', icon: <Banknote size={15} /> },
];
const STATUS_COLORS = ['#F59E0B', '#F79646', '#10B981', '#4F81BD', '#C0504D', '#94A3B8'];

interface Props {
  scope: WfScopeMode;
  /** Mode PME : identifiant de l'entreprise ouverte (depuis l'URL). */
  companyId?: string;
  title?: string;
  initialPeriod?: WfPeriodState;
}

export function LoansDashboard({ scope, companyId, title, initialPeriod }: Props) {
  const [period, setPeriod] = useState<WfPeriodState>(initialPeriod ?? defaultPeriod());
  const [companies, setCompanies] = useState<string>('ALL');
  const [view, setView] = useState<LdView | null>(null);
  const [allCompanies, setAllCompanies] = useState<{ id: string; name: string }[]>([]);
  const [tab, setTab] = useState<Tab>('OVERVIEW');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState(false);

  const n = monthsCount(period);
  const valid = n >= 1 && n <= 24;

  const load = useCallback(async () => {
    if (!valid) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<LdView>(loansEndpoint(scope, 'view', period, { companies, companyId }));
      setView(data);
      if (scope === 'PORTFOLIO' && data.companies?.length) setAllCompanies(data.companies);
    } catch (e: any) {
      setError(e?.message || 'Impossible de charger le tableau de bord.');
      setView(null);
    } finally {
      setLoading(false);
    }
  }, [scope, period, companies, companyId, valid]);

  useEffect(() => { load(); }, [load]);

  const T = view?.totals;
  const evo = view?.evolution ?? [];
  const evoLine = evo.map((e) => ({ short: e.short, Accordé: e.loansGrantedAmount + e.advancesGrantedAmount, Remboursé: e.repaidAmount }));
  const amounts = (xs: { label: string; amount: number }[]): Row[] => xs.map((x) => ({ label: x.label, count: x.amount }));
  const counts = (xs: { label: string; count: number }[]): Row[] => xs.map((x) => ({ label: x.label, count: x.count }));

  return (
    <section className="pt-8 mt-4 border-t border-[var(--border)] space-y-5">
      {/* En-tête + barre d'outils */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-emerald-500" />
            <h2 className="text-lg font-bold text-[var(--text)]">{title ?? 'Tableau de bord — prêts et avances'}</h2>
          </div>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {view ? `${view.companyName} — ${view.period.label}` : 'Chargement…'}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          {scope === 'PORTFOLIO' && allCompanies.length > 0 && (
            <div className="w-64">
              <FancySelect label="Entreprises" value={companies} onChange={setCompanies}
                options={[{ value: 'ALL', label: `Toutes (${allCompanies.length})` }, ...allCompanies.map((c) => ({ value: c.id, label: c.name }))]} />
            </div>
          )}
          <button onClick={() => setDialog(true)} disabled={!view}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold flex items-center gap-2 disabled:opacity-60">
            <Download size={18} /> Télécharger l’Excel
          </button>
        </div>
      </div>

      <WorkforcePeriodPicker value={period} onChange={setPeriod} />

      {!valid && (
        <div className="flex items-start gap-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 px-4 py-3 text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0" /> {n === 0 ? 'Période invalide : le début doit précéder la fin (mois futurs exclus).' : 'Maximum 24 mois.'}
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-3 text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}
      {view?.warnings?.map((w, i) => (
        <div key={i} className="flex items-start gap-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 px-4 py-3 text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0" /> {w}
        </div>
      ))}

      {loading && !view && (
        <div className="flex items-center justify-center py-16 text-[var(--text-muted)]"><Loader2 className="animate-spin mr-2" size={18} /> Calcul en cours…</div>
      )}

      {view && T && (
        <div className={`space-y-6 transition-opacity ${loading ? 'opacity-60' : ''}`}>
          {/* KPI communs */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Kpi tone="dark" title="MONTANT ACCORDÉ" value={fcfa(T.grantedAmount)} sub={`${T.loansGranted} prêt${T.loansGranted > 1 ? 's' : ''} · ${T.advancesGranted} avance${T.advancesGranted > 1 ? 's' : ''}`} />
            <Kpi title="TAUX DE REMBOURSEMENT" value={T.grantedAmount > 0 ? pct(T.recoveryRate) : 'n/d'} sub={`${fcfa(T.recoveredAmount)} déjà remboursé`} />
            <Kpi title="REMBOURSÉ SUR LA PÉRIODE" value={fcfa(T.repaidInPeriod)} sub={`${fcfa(T.repaidPayroll)} paie · ${fcfa(T.repaidCash)} espèces`} />
            <Kpi title="ENCOURS À CE JOUR" value={fcfa(T.outstandingTotal)} sub="prêts + avances, toutes périodes" />
            <Kpi title="SALARIÉS ENDETTÉS" value={String(T.indebtedEmployees)} sub={`${T.loansInProgress} prêt${T.loansInProgress > 1 ? 's' : ''} en cours · ${T.advancesToRecover} avance${T.advancesToRecover > 1 ? 's' : ''}`} />
          </div>

          {/* Onglets */}
          <div className="inline-flex flex-wrap p-1 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
            {TABS.map((t) => (
              <button key={t.id} type="button" onClick={() => setTab(t.id)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${tab === t.id ? 'bg-emerald-500 text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>

          {/* ───────────── VUE D'ENSEMBLE ───────────── */}
          {tab === 'OVERVIEW' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Card title="Remboursements par mode" icon={<PieIcon size={15} className="text-emerald-500" />} hint="Retenues sur paie et paiements en espèces encaissés sur la période.">
                <Donut colors={[C.navy, C.green]} fmt={short} data={amounts(view.repaymentsByMethod)} />
              </Card>
              <Card title="Dette restante à ce jour" icon={<Banknote size={15} className="text-emerald-500" />} hint="Ne dépend pas de la période choisie.">
                <VBar colors={[C.navy, C.orange]} fmt={short} tip={fcfa}
                  data={[{ label: 'Prêts', count: T.outstandingLoans }, { label: 'Avances', count: T.outstandingAdvances }]} />
              </Card>
              {evo.length > 1 && (
                <Card title="Prêts et avances accordés par mois (FCFA)" icon={<BarChart3 size={15} className="text-emerald-500" />} hint="Prêts rattachés au mois de début, avances au mois de la demande.">
                  <div style={{ height: 250 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={evo} margin={{ top: 22, right: 8, left: -4, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                        <XAxis dataKey="short" axisLine={false} tickLine={false} tick={TICK} />
                        <YAxis axisLine={false} tickLine={false} tick={TICK} tickFormatter={(v: any) => short(Number(v))} />
                        <Tooltip {...TT} formatter={(v: any) => fcfa(Number(v))} />
                        <Legend formatter={legendFmt} />
                        <Bar dataKey="loansGrantedAmount" name="Prêts" fill={C.navy} radius={[4, 4, 0, 0]}><LabelList dataKey="loansGrantedAmount" position="top" {...LBL} formatter={(v: any) => (Number(v) > 0 ? short(Number(v)) : '')} /></Bar>
                        <Bar dataKey="advancesGrantedAmount" name="Avances" fill={C.orange} radius={[4, 4, 0, 0]}><LabelList dataKey="advancesGrantedAmount" position="top" {...LBL} formatter={(v: any) => (Number(v) > 0 ? short(Number(v)) : '')} /></Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}
              {evo.length > 1 && (
                <Card title="Accordé et remboursé par mois (FCFA)" icon={<TrendingUp size={15} className="text-emerald-500" />} hint="Remboursé = retenues sur paie + espèces du mois.">
                  <div style={{ height: 250 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={evoLine} margin={{ top: 22, right: 16, left: -4, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                        <XAxis dataKey="short" axisLine={false} tickLine={false} tick={TICK} />
                        <YAxis axisLine={false} tickLine={false} tick={TICK} tickFormatter={(v: any) => short(Number(v))} />
                        <Tooltip {...TT} formatter={(v: any) => fcfa(Number(v))} />
                        <Legend formatter={legendFmt} />
                        <Line type="monotone" dataKey="Accordé" stroke={C.red} strokeWidth={3} dot={{ r: 4 }}><LabelList dataKey="Accordé" position="top" {...LBL} formatter={(v: any) => short(Number(v))} /></Line>
                        <Line type="monotone" dataKey="Remboursé" stroke={C.green} strokeWidth={3} dot={{ r: 4 }}><LabelList dataKey="Remboursé" position="bottom" {...LBL} formatter={(v: any) => short(Number(v))} /></Line>
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* ───────────── PRÊTS ───────────── */}
          {tab === 'LOANS' && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <Kpi title="DEMANDES" value={String(T.loansRequested)} sub={`${T.loansGranted} accordé${T.loansGranted > 1 ? 's' : ''}`} />
                <Kpi title="MONTANT ACCORDÉ" value={fcfa(T.loansGrantedAmount)} />
                <Kpi title="TAUX D’ACCEPTATION" value={T.loansGranted + T.loansRejected > 0 ? pct(T.loanAcceptanceRate) : 'n/d'} sub={`${T.loansRejected} refusé${T.loansRejected > 1 ? 's' : ''}`} />
                <Kpi title="EN ATTENTE" value={String(T.loansPending)} sub="DRH ou DG" />
                <Kpi title="ENCOURS DES PRÊTS" value={fcfa(T.outstandingLoans)} sub="à ce jour" />
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card title="Prêts accordés par nature (FCFA)" icon={<PieIcon size={15} className="text-emerald-500" />}>
                  <Donut colors={C.multi} fmt={short} data={amounts(view.loansByNature)} />
                </Card>
                <Card title="Prêts accordés par type (FCFA)" icon={<BarChart3 size={15} className="text-emerald-500" />}>
                  <HBar color={C.teal} labelWidth={130} fmt={short} tip={fcfa} data={amounts(view.loansByType)} />
                </Card>
                <div className="xl:col-span-2">
                  <Card title="Demandes de prêt par statut" icon={<BarChart3 size={15} className="text-emerald-500" />}>
                    <VBar colors={STATUS_COLORS} data={counts(view.loansByStatus)} />
                  </Card>
                </div>
              </div>
            </>
          )}

          {/* ───────────── AVANCES ───────────── */}
          {tab === 'ADVANCES' && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <Kpi title="DEMANDES" value={String(T.advancesRequested)} sub={`${T.advancesGranted} accordée${T.advancesGranted > 1 ? 's' : ''}`} />
                <Kpi title="MONTANT ACCORDÉ" value={fcfa(T.advancesGrantedAmount)} />
                <Kpi title="TAUX D’ACCEPTATION" value={T.advancesGranted + T.advancesRejected > 0 ? pct(T.advanceAcceptanceRate) : 'n/d'} sub={`${T.advancesRejected} refusée${T.advancesRejected > 1 ? 's' : ''}`} />
                <Kpi title="EN ATTENTE" value={String(T.advancesPending)} />
                <Kpi title="ENCOURS DES AVANCES" value={fcfa(T.outstandingAdvances)} sub="à ce jour" />
              </div>
              <Card title="Demandes d’avance par statut" icon={<BarChart3 size={15} className="text-emerald-500" />}
                hint="« À récupérer » = accordée, pas encore entièrement remboursée.">
                <VBar colors={STATUS_COLORS} data={counts(view.advancesByStatus)} />
              </Card>
            </>
          )}

          {/* ───────────── ENCOURS ───────────── */}
          {tab === 'STOCK' && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Kpi tone="dark" title="ENCOURS TOTAL" value={fcfa(T.outstandingTotal)} />
                <Kpi title="DONT PRÊTS" value={fcfa(T.outstandingLoans)} sub={`${T.loansInProgress} en cours`} />
                <Kpi title="DONT AVANCES" value={fcfa(T.outstandingAdvances)} sub={`${T.advancesToRecover} à récupérer`} />
                <Kpi title="SALARIÉS ENDETTÉS" value={String(T.indebtedEmployees)} />
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card title="Encours par département (FCFA)" icon={<Building2 size={15} className="text-emerald-500" />}>
                  <HBar color={C.red} labelWidth={170} fmt={short} tip={fcfa} data={view.departments.map((d) => ({ label: d.label, count: d.outstandingTotal }))} />
                </Card>
                <Card title="Salariés les plus endettés" icon={<Users size={15} className="text-emerald-500" />} hint="Prêts en cours + avances à récupérer, à ce jour.">
                  <TopTable rows={view.topIndebted} />
                </Card>
              </div>
            </>
          )}
        </div>
      )}

      <LoansExportDialog open={dialog} onClose={() => setDialog(false)} scope={scope} initialPeriod={period} companyId={companyId}
        companies={allCompanies} initialCompanies={companies} companyLabel={view?.companyName ?? 'Entreprise'} />
    </section>
  );
}