'use client';

// ============================================================================
// 📁 components/request-reports/RequestReportDashboard.tsx
// ✅ Dashboard interactif de rapport pour un type de demande (permissions,
//    absences) : KPI avec évolution vs période précédente, graphiques
//    cliquables (clic = filtre / drill-down), carte de chaleur, entonnoir du
//    circuit, ponctualité des retours, classement, observations automatiques.
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ListChecks, CheckCircle2, Timer, Clock, ShieldCheck, AlertTriangle, PencilLine, CalendarDays,
  Hourglass, Users2, FileText,
} from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import { KonzaLoader } from '@/components/ui/KonzaLoader';
import {
  RequestKind, Period, HistoryRow, toRows, inPeriod, MONTHS, MONTHS_SHORT, STATUS_LABELS, STATUS_BADGE, STATUS_COLORS,
  PERMISSION_TYPE_LABELS, PERMISSION_TYPE_COLORS, ABSENCE_TYPE_LABELS, ABSENCE_TYPE_COLORS, DEPT_PALETTE,
  fmtMinutes, avg, pct, downloadCsv, fmtStamp,
} from '@/lib/request-history';
import {
  KpiTile, ChartCard, EmptyChart, Insights, FilterChip, PeriodBar, Heatmap, Funnel, prevPeriod, periodLabel, deltaPct,
} from './ReportKit';

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const HOURS = Array.from({ length: 15 }, (_, i) => i + 6); // 6h → 20h
const wd = (d: Date) => (d.getDay() + 6) % 7;

function stats(rs: HistoryRow[]) {
  const c = (s: string) => rs.filter(r => r.status === s).length;
  const approved = c('APPROVED'), rejected = c('REJECTED');
  const confirmed = rs.filter(r => r.ret === 'CONFIRMED');
  const late = confirmed.filter(r => (r.overrunMin ?? 0) > 10);
  const apprRows = rs.filter(r => r.status === 'APPROVED');
  return {
    total: rs.length, approved, rejected, pending: c('PENDING'), cancelled: c('CANCELLED'),
    approvalRate: approved + rejected ? pct(approved, approved + rejected) : null,
    response: avg(rs.map(r => r.responseMin).filter((n): n is number => n != null)),
    avgOut: avg(confirmed.map(r => r.outMin).filter((n): n is number => n != null)),
    outHours: confirmed.reduce((s, r) => s + (r.outMin || 0), 0) / 60,
    confirmed: confirmed.length, lateCount: late.length, lateRate: confirmed.length ? pct(late.length, confirmed.length) : null,
    adjusted: rs.filter(r => r.adjusted).length,
    returnsPending: rs.filter(r => r.ret === 'PENDING_VALIDATION').length,
    declared: rs.filter(r => r.ret && r.ret !== 'NOT_RETURNED').length,
    sick: apprRows.filter(r => r.type === 'MALADIE').length,
    sickProof: apprRows.filter(r => r.type === 'MALADIE' && r.raw?.attachmentUrl).length,
    days: apprRows.reduce((s, r) => s + (r.days || 0), 0),
    avgDays: apprRows.length ? apprRows.reduce((s, r) => s + (r.days || 0), 0) / apprRows.length : null,
  };
}

export default function RequestReportDashboard({ kind }: { kind: RequestKind }) {
  const { bp } = useBasePath();
  const now = new Date();
  const isPerm = kind === 'permission';
  const TYPE_LABELS = isPerm ? PERMISSION_TYPE_LABELS : ABSENCE_TYPE_LABELS;
  const TYPE_COLORS = isPerm ? PERMISSION_TYPE_COLORS : ABSENCE_TYPE_COLORS;

  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>({ mode: 'month', month: now.getMonth() + 1, year: now.getFullYear(), from: '', to: '' });
  const [type, setType] = useState('');
  const [dept, setDept] = useState('');
  const [status, setStatus] = useState('');
  // 🆕 Filtres croisés : un clic sur un KPI ou une ligne du classement filtre tout le tableau de bord
  const [emp, setEmp] = useState('');
  const [flag, setFlag] = useState<'' | 'pending' | 'late' | 'adjusted'>('');
  const toggleFlag = (f: 'pending' | 'late' | 'adjusted') => setFlag(flag === f ? '' : f);

  useEffect(() => {
    (async () => {
      try {
        const list: any = await api.get(isPerm ? '/permission-tickets' : '/absence-requests');
        setRows(toRows(kind, Array.isArray(list) ? list : []));
      } catch (e) { console.error('Rapport : chargement impossible', e); }
      finally { setLoading(false); }
    })();
  }, [kind, isPerm]);

  const years = useMemo(() => {
    const s = new Set<number>([now.getFullYear()]);
    rows.forEach(r => s.add(r.ref.getFullYear()));
    return Array.from(s).sort((a, b) => b - a);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);
  const depts = useMemo(() => Array.from(new Set(rows.map(r => r.dept))).sort(), [rows]);

  const flagOk = (r: HistoryRow) => !flag || (flag === 'pending' ? r.ret === 'PENDING_VALIDATION' : flag === 'late' ? (r.overrunMin ?? 0) > 10 : !!r.adjusted);
  // scopedAll : sans le filtre « employé » (le classement garde ainsi tous ses employés visibles)
  const scopedAll = useMemo(() => rows.filter(r => (!type || r.type === type) && (!dept || r.dept === dept) && flagOk(r)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, type, dept, flag]);
  const scoped = useMemo(() => (emp ? scopedAll.filter(r => r.employeeId === emp) : scopedAll), [scopedAll, emp]);
  const baseAll = useMemo(() => scopedAll.filter(r => inPeriod(r.ref, period)), [scopedAll, period]);
  const base = useMemo(() => scoped.filter(r => inPeriod(r.ref, period)), [scoped, period]);
  // Absences — salariés absents AUJOURD'HUI (indépendant de la période choisie)
  const absentToday = useMemo(() => {
    if (isPerm) return 0;
    const t0 = new Date(); t0.setHours(0, 0, 0, 0);
    const t1 = new Date(); t1.setHours(23, 59, 59, 999);
    return scoped.filter(r => r.status === 'APPROVED' && new Date(r.raw.startDate) <= t1 && new Date(r.raw.endDate) >= t0).length;
  }, [scoped, isPerm]);
  const prev = useMemo(() => { const p = prevPeriod(period); return p ? scoped.filter(r => inPeriod(r.ref, p)) : null; }, [scoped, period]);
  const S = useMemo(() => stats(base), [base]);
  const P = useMemo(() => (prev ? stats(prev) : null), [prev]);

  // ── Évolution mensuelle (année de la période) empilée par type — clic = zoom sur le mois
  const chartYear = period.mode === 'month' || period.mode === 'year' ? period.year : now.getFullYear();
  const monthly = useMemo(() => MONTHS_SHORT.map((m, i) => {
    const row: any = { mois: m, idx: i + 1 };
    Object.values(TYPE_LABELS).forEach(l => { row[l] = 0; });
    scoped.filter(r => r.ref.getFullYear() === chartYear && r.ref.getMonth() === i).forEach(r => { row[TYPE_LABELS[r.type] || r.type] += 1; });
    return row;
  }), [scoped, chartYear, TYPE_LABELS]);

  const byStatus = useMemo(() => (['APPROVED', 'PENDING', 'REJECTED', 'CANCELLED'] as const)
    .map(code => ({ code, name: STATUS_LABELS[code], value: base.filter(r => r.status === code).length }))
    .filter(d => d.value > 0), [base]);

  const byType = useMemo(() => Object.entries(TYPE_LABELS)
    .map(([code, name]) => ({ code, name, value: base.filter(r => r.type === code).length }))
    .filter(d => d.value > 0), [base, TYPE_LABELS]);

  const byDept = useMemo(() => {
    const m = new Map<string, { name: string; value: number; out: number; n: number }>();
    base.forEach(r => {
      const e = m.get(r.dept) ?? { name: r.dept, value: 0, out: 0, n: 0 };
      e.value += isPerm ? 1 : (r.status === 'APPROVED' ? r.days || 0 : 0);
      if (r.outMin != null) { e.out += r.outMin; e.n += 1; }
      m.set(r.dept, e);
    });
    return Array.from(m.values()).filter(d => d.value > 0).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [base, isPerm]);

  // Permissions — chaleur jour × heure de sortie
  const heat = useMemo(() => {
    const cells = Array.from({ length: 7 }, () => HOURS.map(() => 0));
    base.filter(r => r.status === 'APPROVED').forEach(r => {
      const h = r.ref.getHours();
      const ci = HOURS.indexOf(Math.min(20, Math.max(6, h)));
      cells[wd(r.ref)][ci] += 1;
    });
    return cells;
  }, [base]);

  // Délai de décision par tranche
  const decisionBuckets = useMemo(() => {
    const b = [['< 15 min', 0], ['15 min – 1 h', 0], ['1 – 4 h', 0], ['4 – 24 h', 0], ['> 24 h', 0]] as [string, number][];
    base.forEach(r => {
      const m = r.responseMin; if (m == null) return;
      b[m < 15 ? 0 : m < 60 ? 1 : m < 240 ? 2 : m < 1440 ? 3 : 4][1] += 1;
    });
    return b.map(([name, value]) => ({ name, value }));
  }, [base]);

  // Permissions — ponctualité des retours validés
  const punctuality = useMemo(() => {
    const b = [['En avance', 0, '#10b981'], ['À l’heure (± 10 min)', 0, '#0ea5e9'], ['Retard 10 – 60 min', 0, '#f59e0b'], ['Retard > 1 h', 0, '#ef4444']] as [string, number, string][];
    base.filter(r => r.ret === 'CONFIRMED' && r.overrunMin != null).forEach(r => {
      const o = r.overrunMin as number;
      b[o < -10 ? 0 : o <= 10 ? 1 : o <= 60 ? 2 : 3][1] += 1;
    });
    return b.map(([name, value, color]) => ({ name, value, color }));
  }, [base]);

  // Absences — durée et jour de début
  const durationBuckets = useMemo(() => {
    const b = [['1 jour', 0], ['2 – 3 jours', 0], ['4 – 7 jours', 0], ['> 7 jours', 0]] as [string, number][];
    base.filter(r => r.status === 'APPROVED').forEach(r => { const d = r.days || 0; b[d <= 1 ? 0 : d <= 3 ? 1 : d <= 7 ? 2 : 3][1] += 1; });
    return b.map(([name, value]) => ({ name, value }));
  }, [base]);
  const startWeekday = useMemo(() => WEEKDAYS.map((name, i) => ({ name, value: base.filter(r => r.status !== 'CANCELLED' && wd(r.ref) === i).length })), [base]);
  const subTypes = useMemo(() => {
    const m = new Map<string, number>();
    base.filter(r => r.status === 'APPROVED').forEach(r => { const k = r.raw.subType || r.type; m.set(k, (m.get(k) || 0) + 1); });
    return Array.from(m.entries()).map(([name, value]) => ({ name: name.charAt(0) + name.slice(1).toLowerCase().replace(/_/g, ' '), value })).sort((a, b) => b.value - a.value);
  }, [base]);

  // Classement employés
  const top = useMemo(() => {
    const m = new Map<string, { id?: string; name: string; dept: string; n: number; metric: number; late: number }>();
    baseAll.filter(r => r.status !== 'CANCELLED' && r.status !== 'REJECTED').forEach(r => {
      const e = m.get(r.employeeId || r.name) ?? { id: r.employeeId, name: r.name, dept: r.dept, n: 0, metric: 0, late: 0 };
      e.n += 1; e.metric += isPerm ? (r.outMin || 0) : (r.days || 0);
      if ((r.overrunMin ?? 0) > 10) e.late += 1;
      m.set(r.employeeId || r.name, e);
    });
    return Array.from(m.values()).sort((a, b) => b.n - a.n || b.metric - a.metric).slice(0, 10);
  }, [baseAll, isPerm]);

  const detail = useMemo(() => (status ? base.filter(r => r.status === status) : base)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 8), [base, status]);

  // Observations automatiques
  const insights = useMemo(() => {
    const out: string[] = [];
    if (!S.total) return out;
    const d = deltaPct(S.total, P?.total ?? null);
    if (d != null && Math.abs(d) >= 10) out.push(`${isPerm ? 'Les tickets' : 'Les demandes'} sont en ${d > 0 ? 'hausse' : 'baisse'} de ${Math.abs(Math.round(d))} % par rapport à la période précédente (${P?.total} → ${S.total}).`);
    if (byDept.length > 1) {
      const t = byDept.reduce((s, x) => s + x.value, 0);
      out.push(`« ${byDept[0].name} » concentre ${Math.round((byDept[0].value / t) * 100)} % ${isPerm ? 'des sorties' : 'des jours d’absence approuvés'}.`);
    }
    if (S.response != null && S.response > 1440) out.push(`Le délai moyen de décision est de ${fmtMinutes(S.response)} : les demandes attendent plus d’une journée.`);
    if (S.pending > 0) out.push(`${S.pending} demande(s) en attente de décision sur la période.`);
    if (isPerm) {
      if (S.returnsPending > 0) out.push(`${S.returnsPending} retour(s) déclaré(s) attendent d’être validés par l’administration.`);
      if (S.lateRate != null && S.lateRate >= 20) out.push(`${S.lateRate} % des retours validés dépassent l’heure prévue de plus de 10 minutes.`);
      if (S.adjusted > 0) out.push(`${S.adjusted} ticket(s) ont eu leurs heures corrigées par l’administration (voir la traçabilité dans l’historique).`);
      const dayTotals = heat.map(r => r.reduce((s, n) => s + n, 0));
      const mx = Math.max(...dayTotals);
      if (mx > 2) out.push(`Le ${WEEKDAYS[dayTotals.indexOf(mx)].toLowerCase()} est le jour où il y a le plus de sorties (${mx}).`);
    } else {
      const mx = Math.max(...startWeekday.map(x => x.value));
      if (mx > 2) out.push(`Les absences démarrent le plus souvent un ${startWeekday.find(x => x.value === mx)?.name.toLowerCase()} (${mx} demandes).`);
      if (S.avgDays != null) out.push(`Durée moyenne d’une absence approuvée : ${S.avgDays.toFixed(1).replace('.', ',')} jour(s) ouvré(s).`);
    }
    return out;
  }, [S, P, byDept, heat, startWeekday, isPerm]);

  const exportCsv = () => {
    const header = ['Employé', 'Département', 'Type', isPerm ? 'Créneau' : 'Période', 'Statut', 'Demandé le', 'Délai de réponse']
      .concat(isPerm ? ['Durée de sortie', 'Dépassement', 'Heures corrigées'] : ['Jours ouvrés']);
    downloadCsv(`rapport-${isPerm ? 'permissions' : 'absences'}-${periodLabel(period).replace(/[^\w]+/g, '-')}.csv`, header,
      base.map(r => [r.name, r.dept, TYPE_LABELS[r.type] || r.type, r.when, STATUS_LABELS[r.status] || r.status, fmtStamp(r.createdAt), fmtMinutes(r.responseMin),
        ...(isPerm ? [fmtMinutes(r.outMin), r.overrunMin != null && r.overrunMin > 0 ? fmtMinutes(r.overrunMin) : '', r.adjusted ? 'Oui' : 'Non'] : [String(r.days ?? 0)])]));
  };

  if (loading) return <KonzaLoader variant="page" />;

  const typeNames = Object.values(TYPE_LABELS);
  const typeColorList = Object.keys(TYPE_LABELS).map(k => TYPE_COLORS[k]);
  const hasFilter = !!(type || dept || status || emp || flag);
  const empName = rows.find(r => r.employeeId === emp)?.name || 'Employé';
  const FLAG_LABEL = { pending: 'Retours à valider', late: 'Retours en dépassement', adjusted: 'Heures corrigées' } as const;
  const clearAll = () => { setType(''); setDept(''); setStatus(''); setEmp(''); setFlag(''); };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[var(--text)]">Rapport — {isPerm ? 'Permissions' : 'Absences'}</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Tableau de bord de pilotage · {periodLabel(period)}{P ? ' · évolution comparée à la période précédente' : ''}. Cliquez sur un graphique pour filtrer.
        </p>
      </div>

      <PeriodBar period={period} setPeriod={setPeriod} years={years} types={TYPE_LABELS} type={type} setType={setType}
        depts={depts} dept={dept} setDept={setDept} onExport={exportCsv} exportDisabled={!base.length} />

      {hasFilter && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[11px] text-[var(--text-muted)]">Filtres actifs :</span>
          {type && <FilterChip label={TYPE_LABELS[type]} onClear={() => setType('')} />}
          {dept && <FilterChip label={dept} onClear={() => setDept('')} />}
          {status && <FilterChip label={STATUS_LABELS[status]} onClear={() => setStatus('')} />}
          {emp && <FilterChip label={empName} onClear={() => setEmp('')} />}
          {flag && <FilterChip label={FLAG_LABEL[flag]} onClear={() => setFlag('')} />}
          <button onClick={clearAll} className="text-[11px] text-[var(--text-muted)] underline hover:text-[var(--text)]">Tout effacer</button>
        </div>
      )}

      {/* KPI — cliquez sur une tuile marquée pour isoler les demandes concernées */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <KpiTile icon={ListChecks} tone="bg-sky-50 text-sky-600 dark:bg-sky-900/20" label={isPerm ? 'Tickets' : 'Demandes'} value={S.total} hint={`${S.pending} en attente · ${S.cancelled} annulé(s)`} delta={P ? deltaPct(S.total, P.total) : undefined} />
        <KpiTile icon={CheckCircle2} tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20" label="Taux d’approbation" value={S.approvalRate != null ? `${S.approvalRate} %` : '—'} hint={`${S.approved} approuvée(s) · ${S.rejected} refusée(s)`}
          delta={P ? deltaPct(S.approvalRate, P.approvalRate) : undefined} />
        <KpiTile icon={Timer} tone="bg-violet-50 text-violet-600 dark:bg-violet-900/20" label="Délai moyen de décision" value={fmtMinutes(S.response)} delta={P ? deltaPct(S.response, P.response) : undefined} invert />
        {isPerm ? (<>
          <KpiTile icon={Clock} tone="bg-amber-50 text-amber-600 dark:bg-amber-900/20" label="Durée moyenne de sortie" value={fmtMinutes(S.avgOut)} hint={`sur ${S.confirmed} retour(s) validé(s)`} delta={P ? deltaPct(S.avgOut, P.avgOut) : undefined} invert />
          <KpiTile icon={Clock} tone="bg-sky-50 text-sky-600 dark:bg-sky-900/20" label="Heures hors poste" value={`${Math.round(S.outHours * 10) / 10} h`} hint="cumul des retours validés" delta={P ? deltaPct(S.outHours, P.outHours) : undefined} invert />
          <KpiTile icon={AlertTriangle} tone="bg-red-50 text-red-600 dark:bg-red-900/20" label="Retours en dépassement" value={S.lateRate != null ? `${S.lateRate} %` : '—'} hint={S.lateCount ? `${S.lateCount} sur ${S.confirmed} · cliquer pour les isoler` : `${S.lateCount} sur ${S.confirmed} validés`}
            delta={P ? deltaPct(S.lateRate, P.lateRate) : undefined} invert onClick={S.lateCount || flag === 'late' ? () => toggleFlag('late') : undefined} active={flag === 'late'} />
          <KpiTile icon={ShieldCheck} tone="bg-amber-50 text-amber-600 dark:bg-amber-900/20" label="Retours à valider" value={S.returnsPending} hint={S.returnsPending ? 'cliquer pour les isoler' : 'rien en attente'} onClick={S.returnsPending || flag === 'pending' ? () => toggleFlag('pending') : undefined} active={flag === 'pending'} />
          <KpiTile icon={PencilLine} tone="bg-violet-50 text-violet-600 dark:bg-violet-900/20" label="Heures corrigées" value={S.adjusted} hint="par l’administration" onClick={S.adjusted || flag === 'adjusted' ? () => toggleFlag('adjusted') : undefined} active={flag === 'adjusted'} />
        </>) : (<>
          <KpiTile icon={CalendarDays} tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20" label="Jours d’absence approuvés" value={`${S.days} j`} delta={P ? deltaPct(S.days, P.days) : undefined} invert />
          <KpiTile icon={FileText} tone="bg-amber-50 text-amber-600 dark:bg-amber-900/20" label="Durée moyenne" value={S.avgDays != null ? `${S.avgDays.toFixed(1).replace('.', ',')} j` : '—'} />
          <KpiTile icon={Hourglass} tone="bg-amber-50 text-amber-600 dark:bg-amber-900/20" label="En attente de décision" value={S.pending} hint={S.pending ? 'cliquer pour les isoler' : `${S.cancelled} annulée(s)`} onClick={S.pending || status === 'PENDING' ? () => setStatus(status === 'PENDING' ? '' : 'PENDING') : undefined} active={status === 'PENDING'} />
          <KpiTile icon={Users2} tone="bg-sky-50 text-sky-600 dark:bg-sky-900/20" label="Absents aujourd’hui" value={absentToday} hint="absences approuvées en cours" />
          <KpiTile icon={FileText} tone="bg-red-50 text-red-600 dark:bg-red-900/20" label="Maladies avec justificatif" value={S.sick ? `${pct(S.sickProof, S.sick)} %` : '—'} hint={S.sick ? `${S.sickProof} sur ${S.sick} maladie(s) approuvée(s)` : 'aucune maladie sur la période'} />
        </>)}
      </div>

      <Insights items={insights} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <ChartCard className="lg:col-span-2" title={`Évolution ${chartYear}`} subtitle="Par type — cliquez sur un mois pour zoomer">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="mois" fontSize={12} /><YAxis fontSize={12} allowDecimals={false} />
              <Tooltip /><Legend />
              {typeNames.map((n, i) => (
                <Bar key={n} dataKey={n} stackId="a" fill={typeColorList[i]} cursor="pointer"
                  onClick={(d: any) => setPeriod({ ...period, mode: 'month', year: chartYear, month: d?.payload?.idx ?? period.month })} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Statuts" subtitle="Cliquez pour filtrer la liste">
          {byStatus.length === 0 ? <EmptyChart h={260} /> : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} cursor="pointer"
                  label={(d: any) => `${pct(d.value, S.total)}%`} onClick={(d: any) => setStatus(status === d?.code ? '' : d?.code)}>
                  {byStatus.map(d => <Cell key={d.code} fill={STATUS_COLORS[d.code]} opacity={!status || status === d.code ? 1 : 0.35} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Répartition par type" subtitle="Cliquez pour filtrer">
          {byType.length === 0 ? <EmptyChart h={240} /> : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={byType} dataKey="value" nameKey="name" outerRadius={85} cursor="pointer" label={(d: any) => `${pct(d.value, S.total)}%`}
                  onClick={(d: any) => setType(type === d?.code ? '' : d?.code)}>
                  {byType.map(d => <Cell key={d.code} fill={TYPE_COLORS[d.code]} opacity={!type || type === d.code ? 1 : 0.35} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title={isPerm ? 'Sorties par département' : 'Jours d’absence par département'} subtitle="Cliquez sur une barre pour filtrer">
          {byDept.length === 0 ? <EmptyChart h={240} /> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={byDept} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} horizontal={false} />
                <XAxis type="number" fontSize={12} allowDecimals={false} />
                <YAxis type="category" dataKey="name" fontSize={11} width={95} />
                <Tooltip />
                <Bar dataKey="value" name={isPerm ? 'Tickets' : 'Jours'} radius={[0, 6, 6, 0]} cursor="pointer" onClick={(d: any) => setDept(dept === d?.name ? '' : d?.name)}>
                  {byDept.map((d, i) => <Cell key={d.name} fill={DEPT_PALETTE[i % DEPT_PALETTE.length]} opacity={!dept || dept === d.name ? 1 : 0.35} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Délai de décision" subtitle="Temps entre la demande et la réponse">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={decisionBuckets}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" fontSize={10} /><YAxis fontSize={12} allowDecimals={false} /><Tooltip />
              <Bar dataKey="value" name="Demandes" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {isPerm ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <ChartCard className="lg:col-span-2" title="Quand les employés sortent" subtitle="Sorties autorisées par jour de la semaine et heure de départ">
            {S.approved === 0 ? <EmptyChart h={200} /> : <Heatmap cells={heat} hours={HOURS} rowLabels={WEEKDAYS} />}
          </ChartCard>
          <ChartCard title="Circuit du ticket" subtitle="De la demande à la validation du retour">
            <Funnel steps={[
              { label: 'Demandés', value: S.total, color: '#0ea5e9' },
              { label: 'Autorisés', value: S.approved, color: '#10b981' },
              { label: 'Retours déclarés', value: S.declared, color: '#f59e0b' },
              { label: 'Retours validés', value: S.confirmed, color: '#059669' },
            ]} />
          </ChartCard>
          <ChartCard className="lg:col-span-3" title="Ponctualité des retours validés" subtitle="Heure de retour validée comparée à l’heure prévue">
            {punctuality.every(p => p.value === 0) ? <EmptyChart h={160} /> : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={punctuality} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} horizontal={false} />
                  <XAxis type="number" fontSize={12} allowDecimals={false} /><YAxis type="category" dataKey="name" fontSize={11} width={130} /><Tooltip />
                  <Bar dataKey="value" name="Retours" radius={[0, 6, 6, 0]}>{punctuality.map(p => <Cell key={p.name} fill={p.color} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <ChartCard title="Durée des absences approuvées">
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={durationBuckets}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} /><XAxis dataKey="name" fontSize={11} /><YAxis fontSize={12} allowDecimals={false} /><Tooltip />
                <Bar dataKey="value" name="Absences" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Jour de début" subtitle="Quand démarrent les absences">
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={startWeekday}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} /><XAxis dataKey="name" fontSize={12} /><YAxis fontSize={12} allowDecimals={false} /><Tooltip />
                <Bar dataKey="value" name="Demandes" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Motifs des absences approuvées">
            {subTypes.length === 0 ? <EmptyChart h={230} /> : (
              <ResponsiveContainer width="100%" height={230}>
                <PieChart><Pie data={subTypes} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80}>
                  {subTypes.map((d, i) => <Cell key={d.name} fill={DEPT_PALETTE[i % DEPT_PALETTE.length]} />)}
                </Pie><Tooltip /><Legend /></PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title={isPerm ? 'Classement — employés les plus en sortie' : 'Classement — employés les plus absents'} subtitle="Hors refusées et annulées — cliquez sur un employé pour filtrer"
          action={<Users2 size={16} className="text-[var(--text-muted)]" />}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-[10px] uppercase text-[var(--text-muted)]">
                <th className="text-left py-1.5 w-8">#</th><th className="text-left">Employé</th><th className="text-right">{isPerm ? 'Tickets' : 'Demandes'}</th>
                <th className="text-right">{isPerm ? 'Temps dehors' : 'Jours'}</th>{isPerm && <th className="text-right">Retards</th>}
              </tr></thead>
              <tbody className="divide-y divide-[var(--border)]">
                {top.length === 0 ? <tr><td colSpan={5} className="py-8 text-center text-[var(--text-muted)]">Aucune donnée.</td></tr> : top.map((e, i) => (
                  <tr key={e.id || e.name} onClick={() => e.id && setEmp(emp === e.id ? '' : e.id)} title="Cliquer pour isoler cet employé"
                    className={`cursor-pointer hover:bg-[var(--surface-2)]/60 ${emp && emp === e.id ? 'bg-emerald-50/70 dark:bg-emerald-900/10' : ''}`}>
                    <td className="py-2 text-[var(--text-muted)] font-semibold">{i + 1}</td>
                    <td className="py-2"><p className="font-semibold text-[var(--text)]">{e.name}</p><p className="text-[11px] text-[var(--text-muted)]">{e.dept}</p></td>
                    <td className="py-2 text-right font-bold text-[var(--text)]">{e.n}</td>
                    <td className="py-2 text-right text-[var(--text)]">{isPerm ? fmtMinutes(e.metric) : `${e.metric} j`}</td>
                    {isPerm && <td className={`py-2 text-right font-semibold ${e.late ? 'text-red-500' : 'text-[var(--text-muted)]'}`}>{e.late}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>

        <ChartCard title={status ? `Demandes — ${STATUS_LABELS[status].toLowerCase()}` : 'Dernières demandes de la période'}
          action={<Link href={bp(isPerm ? '/presences/permissions/historique' : '/presences/absences/historique')} className="text-xs font-semibold text-emerald-600 hover:underline">Ouvrir l’historique</Link>}>
          <div className="space-y-2">
            {detail.length === 0 ? <p className="py-8 text-center text-sm text-[var(--text-muted)]">Aucune demande.</p> : detail.map(r => (
              <div key={r.id} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[var(--surface-2)]/50">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--text)] truncate">{r.name}</p>
                  <p className="text-[11px] text-[var(--text-muted)] truncate">{TYPE_LABELS[r.type] || r.type} · {r.when}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold shrink-0 ${STATUS_BADGE[r.status]}`}>{STATUS_LABELS[r.status]}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}