'use client';

// ============================================================================
// 📁 components/attendance/AttendanceDashboard.tsx
// Tableau de bord Présences · Absences · Permissions — même logique que le
// dashboard effectifs : mêmes sélecteurs de période, mêmes cartes, Excel
// téléchargeable depuis le même écran. Trois onglets :
//   • Présences    : taux de présence / absentéisme / retards, jours par statut, départements
//   • Absences     : demandes par statut, type, motif ; jours payés / non payés ; salariés les plus absents
//   • Permissions  : tickets par statut, type, mission ; heures, retours en retard ; salariés les plus sortis
// Toutes les valeurs viennent du back (/attendance-dashboard) — la même source que
// l'Excel : l'écran et le fichier affichent les mêmes chiffres.
// ============================================================================

import React, { useCallback, useEffect, useState } from 'react';
import {
  Download, Loader2, AlertCircle, UserCheck, UserX, Ticket, Clock, Building2, TrendingUp, PieChart as PieIcon, BarChart3,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList, PieChart, Pie, Legend,
  LineChart, Line,
} from 'recharts';
import { api } from '@/services/api';
import { FancySelect } from '@/components/ui/FancySelect';
import { WorkforcePeriodPicker } from '@/components/workforce/WorkforcePeriodPicker';
import { WfPeriodState, WfScopeMode, defaultPeriod, monthsCount } from '@/lib/workforce';
import { AdTopEmployee, AdView, attendanceEndpoint, num1, pct } from '@/lib/attendance-dashboard';
import { AttendanceExportDialog } from './AttendanceExportDialog';

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

function HBar({ data, color, labelWidth = 150, rowH = 30, suffix = '' }: { data: Row[]; color: string; labelWidth?: number; rowH?: number; suffix?: string }) {
  if (data.length === 0) return <Empty />;
  const h = Math.max(140, data.length * rowH + 20);
  return (
    <div style={{ height: Math.min(h, 520), overflowY: h > 520 ? 'auto' : 'visible' }}>
      <ResponsiveContainer width="100%" height={h}>
        <BarChart layout="vertical" data={data} margin={{ left: 4, right: 48, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
          <XAxis type="number" hide />
          <YAxis dataKey="label" type="category" width={labelWidth} axisLine={false} tickLine={false} tick={TICK} interval={0} />
          <Tooltip {...TT} formatter={(v: any) => `${v}${suffix}`} />
          <Bar dataKey="count" name="Valeur" fill={color} radius={[0, 6, 6, 0]}>
            <LabelList dataKey="count" position="right" {...LBL} formatter={(v: any) => `${v}${suffix}`} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function VBar({ data, colors, height = 240 }: { data: Row[]; colors: string[]; height?: number }) {
  if (data.every((d) => d.count === 0)) return <Empty />;
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 22, right: 8, left: -18, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={TICK} interval={0} />
          <YAxis axisLine={false} tickLine={false} tick={TICK} allowDecimals={false} />
          <Tooltip {...TT} />
          <Bar dataKey="count" name="Nombre" radius={[6, 6, 0, 0]}>
            {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
            <LabelList dataKey="count" position="top" {...LBL} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function Donut({ data, colors, height = 240 }: { data: Row[]; colors: string[]; height?: number }) {
  const d = data.filter((x) => x.count > 0);
  if (d.length === 0) return <Empty />;
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={d} dataKey="count" nameKey="label" cx="50%" cy="50%" innerRadius={48} outerRadius={82} paddingAngle={2}
            label={({ value }: any) => value} labelLine={false} stroke="var(--surface)">
            {d.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
          </Pie>
          <Tooltip {...TT} />
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
      <p className="text-4xl font-extrabold mt-2">{value}</p>
      {sub && <p className="text-xs mt-1 opacity-80">{sub}</p>}
    </div>
  ) : (
    <div className="rounded-2xl p-5 text-center bg-[var(--surface)] border border-[var(--border)] shadow-sm">
      <p className="text-xs font-bold tracking-wider text-[var(--text-muted)]">{title}</p>
      <p className="text-3xl font-extrabold mt-2 text-[var(--text)]">{value}</p>
      {sub && <p className="text-xs mt-1 text-[var(--text-muted)]">{sub}</p>}
    </div>
  );
}

function TopTable({ rows, valueLabel, extraLabel, fmtExtra }: { rows: AdTopEmployee[]; valueLabel: string; extraLabel: string; fmtExtra?: (n: number) => string }) {
  if (rows.length === 0) return <Empty />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-[var(--text-muted)] border-b border-[var(--border)]">
            <th className="py-2 pr-3">Salarié</th><th className="py-2 pr-3">Département</th>
            <th className="py-2 pr-3 text-right">{valueLabel}</th><th className="py-2 text-right">{extraLabel}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-[var(--border)] last:border-0 text-[var(--text)]">
              <td className="py-2 pr-3 font-semibold">{r.fullName}</td>
              <td className="py-2 pr-3 text-[var(--text-muted)]">{r.department}</td>
              <td className="py-2 pr-3 text-right font-bold">{r.value}</td>
              <td className="py-2 text-right">{fmtExtra ? fmtExtra(r.extra) : r.extra}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Composant principal ─────────────────────────────────────────────────────

type Tab = 'PRESENCES' | 'ABSENCES' | 'PERMISSIONS';
const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'PRESENCES', label: 'Présences', icon: <UserCheck size={15} /> },
  { id: 'ABSENCES', label: 'Absences', icon: <UserX size={15} /> },
  { id: 'PERMISSIONS', label: 'Permissions', icon: <Ticket size={15} /> },
];

interface Props {
  scope: WfScopeMode;
  /** Mode PME : identifiant de l'entreprise ouverte (depuis l'URL). */
  companyId?: string;
  title?: string;
  initialPeriod?: WfPeriodState;
}

export function AttendanceDashboard({ scope, companyId, title, initialPeriod }: Props) {
  const [period, setPeriod] = useState<WfPeriodState>(initialPeriod ?? defaultPeriod());
  const [companies, setCompanies] = useState<string>('ALL');
  const [view, setView] = useState<AdView | null>(null);
  const [allCompanies, setAllCompanies] = useState<{ id: string; name: string }[]>([]);
  const [tab, setTab] = useState<Tab>('PRESENCES');
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
      const data = await api.get<AdView>(attendanceEndpoint(scope, 'view', period, { companies, companyId }));
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
  const A = view?.absences;
  const P = view?.permissions;
  const evo = view?.evolution ?? [];
  const evoPct = evo.map((e) => ({ short: e.short, Présence: +(e.presenceRate * 100).toFixed(2), Absentéisme: +(e.absenteeismRate * 100).toFixed(2) }));

  const monthBars = (keys: { key: string; name: string; color: string }[]) => (
    <div style={{ height: 250 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={evo} margin={{ top: 22, right: 8, left: -18, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis dataKey="short" axisLine={false} tickLine={false} tick={TICK} />
          <YAxis axisLine={false} tickLine={false} tick={TICK} allowDecimals={false} />
          <Tooltip {...TT} />
          <Legend formatter={legendFmt} />
          {keys.map((k) => (
            <Bar key={k.key} dataKey={k.key} name={k.name} fill={k.color} radius={[4, 4, 0, 0]}>
              <LabelList dataKey={k.key} position="top" {...LBL} />
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  return (
    <section className="pt-8 mt-4 border-t border-[var(--border)] space-y-5">
      {/* En-tête + barre d'outils */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-emerald-500" />
            <h2 className="text-lg font-bold text-[var(--text)]">{title ?? 'Tableau de bord — présences, absences et permissions'}</h2>
          </div>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {view ? `${view.companyName} — ${view.period.label} · ${view.headcount} salarié${view.headcount > 1 ? 's' : ''}` : 'Chargement…'}
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

      {view && T && A && P && (
        <div className={`space-y-6 transition-opacity ${loading ? 'opacity-60' : ''}`}>
          {/* KPI communs */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Kpi tone="dark" title="TAUX DE PRÉSENCE" value={T.theoreticalDays > 0 ? pct(T.presenceRate) : 'n/d'} sub={`${T.workedDays} j travaillés / ${T.theoreticalDays} j à travailler`} />
            <Kpi title="TAUX D’ABSENTÉISME" value={T.theoreticalDays > 0 ? pct(T.absenteeismRate) : 'n/d'} sub={`${T.absenceDays} j d’absence · ${T.absentEmployees} salarié${T.absentEmployees > 1 ? 's' : ''}`} />
            <Kpi title="TAUX DE RETARD" value={T.workedDays > 0 ? pct(T.lateRate) : 'n/d'} sub={`${T.late} jour${T.late > 1 ? 's' : ''} en retard`} />
            <Kpi title="ABSENCES APPROUVÉES" value={String(A.approved)} sub={`${num1(A.approvedDays)} j ouvrés · ${A.pending} en attente`} />
            <Kpi title="PERMISSIONS APPROUVÉES" value={String(P.approved)} sub={`${num1(P.totalHours)} h · ${P.pending} en attente`} />
          </div>

          {/* Onglets */}
          <div className="inline-flex p-1 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
            {TABS.map((t) => (
              <button key={t.id} type="button" onClick={() => setTab(t.id)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${tab === t.id ? 'bg-emerald-500 text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>

          {/* ───────────── PRÉSENCES ───────────── */}
          {tab === 'PRESENCES' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Card title="Répartition des jours" icon={<PieIcon size={15} className="text-emerald-500" />}
                hint="Les jours de retard comptent comme jours travaillés. Congés, fériés et repos sont exclus des taux.">
                <Donut colors={[C.navy, C.teal, C.amber, C.red, C.purple]} data={[
                  { label: 'Présent', count: T.present }, { label: 'Télétravail', count: T.remote }, { label: 'En retard', count: T.late },
                  { label: 'Absence payée', count: T.absPaid }, { label: 'Absence non payée', count: T.absUnpaid },
                ]} />
              </Card>
              <Card title="Absentéisme par département (%)" icon={<Building2 size={15} className="text-emerald-500" />}>
                <HBar color={C.red} suffix=" %" labelWidth={170}
                  data={view.departments.filter((d) => d.workedDays + d.absenceDays > 0).map((d) => ({ label: d.label, count: +(d.absenteeismRate * 100).toFixed(1) }))} />
              </Card>
              {evo.length > 1 && (
                <Card title="Taux de présence et d’absentéisme (%)" icon={<TrendingUp size={15} className="text-emerald-500" />}>
                  <div style={{ height: 250 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={evoPct} margin={{ top: 22, right: 16, left: -10, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                        <XAxis dataKey="short" axisLine={false} tickLine={false} tick={TICK} />
                        <YAxis axisLine={false} tickLine={false} tick={TICK} domain={[0, 100]} />
                        <Tooltip {...TT} formatter={(v: any) => `${v} %`} />
                        <Legend formatter={legendFmt} />
                        <Line type="monotone" dataKey="Présence" stroke={C.navy} strokeWidth={3} dot={{ r: 4 }}><LabelList dataKey="Présence" position="top" {...LBL} /></Line>
                        <Line type="monotone" dataKey="Absentéisme" stroke={C.red} strokeWidth={3} dot={{ r: 4 }}><LabelList dataKey="Absentéisme" position="bottom" {...LBL} /></Line>
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}
              {evo.length > 1 && (
                <Card title="Jours d’absence et de retard par mois" icon={<Clock size={15} className="text-emerald-500" />}>
                  {monthBars([{ key: 'absenceDays', name: 'Jours d’absence', color: C.red }, { key: 'lateDays', name: 'Jours en retard', color: C.orange }])}
                </Card>
              )}
              <div className="xl:col-span-2">
                <Card title="Détail par département" icon={<Building2 size={15} className="text-emerald-500" />}>
                  {view.departments.length === 0 ? <Empty /> : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs uppercase tracking-wide text-[var(--text-muted)] border-b border-[var(--border)]">
                            <th className="py-2 pr-3">Département</th><th className="py-2 pr-3 text-right">Effectif</th>
                            <th className="py-2 pr-3 text-right">Jours travaillés</th><th className="py-2 pr-3 text-right">Jours d’absence</th>
                            <th className="py-2 pr-3 text-right">Retards</th><th className="py-2 pr-3 text-right">Présence</th><th className="py-2 text-right">Absentéisme</th>
                          </tr>
                        </thead>
                        <tbody>
                          {view.departments.map((d) => (
                            <tr key={d.label} className="border-b border-[var(--border)] last:border-0 text-[var(--text)]">
                              <td className="py-2 pr-3 font-semibold">{d.label}</td>
                              <td className="py-2 pr-3 text-right">{d.headcount}</td>
                              <td className="py-2 pr-3 text-right">{d.workedDays}</td>
                              <td className="py-2 pr-3 text-right">{d.absenceDays}</td>
                              <td className="py-2 pr-3 text-right">{d.lateDays}</td>
                              <td className="py-2 pr-3 text-right">{d.workedDays + d.absenceDays > 0 ? pct(d.presenceRate) : 'n/d'}</td>
                              <td className="py-2 text-right font-bold">{d.workedDays + d.absenceDays > 0 ? pct(d.absenteeismRate) : 'n/d'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          )}

          {/* ───────────── ABSENCES ───────────── */}
          {tab === 'ABSENCES' && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <Kpi title="DEMANDES" value={String(A.total)} sub={`${A.approved} approuvée${A.approved > 1 ? 's' : ''}`} />
                <Kpi title="EN ATTENTE" value={String(A.pending)} />
                <Kpi title="JOURS APPROUVÉS" value={num1(A.approvedDays)} sub="jours ouvrés" />
                <Kpi title="DONT PAYÉS" value={num1(A.paidDays)} sub="jours" />
                <Kpi title="DONT NON PAYÉS" value={num1(A.unpaidDays)} sub="jours" />
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card title="Par type (demandes approuvées)" icon={<PieIcon size={15} className="text-emerald-500" />}>
                  <Donut colors={C.multi} data={A.byType.map((t) => ({ label: t.label, count: t.count }))} />
                </Card>
                <Card title="Par motif (demandes approuvées)" icon={<BarChart3 size={15} className="text-emerald-500" />}>
                  <HBar color={C.teal} labelWidth={150} data={A.bySubType.map((t) => ({ label: t.label, count: t.count }))} />
                </Card>
                <Card title="Demandes par statut" icon={<BarChart3 size={15} className="text-emerald-500" />}>
                  <VBar colors={[C.amber, C.green, C.red, '#94A3B8']} data={A.byStatus} />
                </Card>
                <Card title="Salariés les plus absents" icon={<UserX size={15} className="text-emerald-500" />} hint="Jours d’absence (payée + non payée) sur la période.">
                  <TopTable rows={view.topAbsent} valueLabel="Jours d’absence" extraLabel="Retards" />
                </Card>
                {evo.length > 1 && (
                  <Card title="Absences approuvées par mois" icon={<TrendingUp size={15} className="text-emerald-500" />} hint="Rattachées au mois de début de l’absence.">
                    {monthBars([{ key: 'absenceRequests', name: 'Demandes approuvées', color: C.teal }])}
                  </Card>
                )}
              </div>
            </>
          )}

          {/* ───────────── PERMISSIONS ───────────── */}
          {tab === 'PERMISSIONS' && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <Kpi title="TICKETS" value={String(P.total)} sub={`${P.approved} approuvé${P.approved > 1 ? 's' : ''}`} />
                <Kpi title="HEURES DE SORTIE" value={num1(P.totalHours)} sub="retours validés" />
                <Kpi title="DURÉE MOYENNE" value={`${num1(P.avgHours)} h`} />
                <Kpi title="RETOURS EN RETARD" value={String(P.lateReturns)} />
                <Kpi title="RETOURS NON VALIDÉS" value={String(P.notReturned)} sub="permissions approuvées" />
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card title="Par type (permissions approuvées)" icon={<PieIcon size={15} className="text-emerald-500" />}>
                  <Donut colors={C.multi} data={P.byType} />
                </Card>
                <Card title="Missions par nature" icon={<BarChart3 size={15} className="text-emerald-500" />}>
                  <HBar color={C.orange} labelWidth={150} data={P.byMission} />
                </Card>
                <Card title="Tickets par statut" icon={<BarChart3 size={15} className="text-emerald-500" />}>
                  <VBar colors={[C.amber, C.green, C.red, '#94A3B8']} data={P.byStatus} />
                </Card>
                <Card title="Salariés les plus sortis" icon={<Ticket size={15} className="text-emerald-500" />} hint="Permissions approuvées sur la période.">
                  <TopTable rows={view.topPermissions} valueLabel="Permissions" extraLabel="Heures" fmtExtra={(x) => `${num1(x)} h`} />
                </Card>
                {evo.length > 1 && (
                  <Card title="Permissions approuvées par mois" icon={<TrendingUp size={15} className="text-emerald-500" />} hint="Rattachées au mois de la sortie.">
                    {monthBars([{ key: 'permissions', name: 'Permissions approuvées', color: C.orange }])}
                  </Card>
                )}
              </div>
            </>
          )}
        </div>
      )}

      <AttendanceExportDialog open={dialog} onClose={() => setDialog(false)} scope={scope} initialPeriod={period} companyId={companyId}
        companies={allCompanies} initialCompanies={companies} companyLabel={view?.companyName ?? 'Entreprise'} />
    </section>
  );
}
