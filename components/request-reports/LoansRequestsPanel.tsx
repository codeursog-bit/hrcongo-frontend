'use client';

// ============================================================================
// 📁 components/request-reports/LoansRequestsPanel.tsx
// ✅ Volet « Pilotage des demandes » du rapport Prêts / Avances : circuit de
//    décision (accordées / refusées / en attente), délais, montants demandés vs
//    accordés, évolution annuelle — sur TOUTES les demandes (pas seulement les
//    dettes validées déjà affichées plus bas dans la page).
// ============================================================================

import React, { useMemo } from 'react';
import { ListChecks, CheckCircle2, Timer, Banknote, Hourglass } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { KpiTile, ChartCard, EmptyChart, Insights, deltaPct } from './ReportKit';
import { MONTHS, MONTHS_SHORT, STATUS_COLORS, avg, fmtMinutes, minutesBetween, pct } from '@/lib/request-history';

type Group = 'Accordées' | 'En attente' | 'Refusées' | 'Annulées';
const GROUP_COLOR: Record<Group, string> = { Accordées: STATUS_COLORS.APPROVED, 'En attente': STATUS_COLORS.PENDING, Refusées: STATUS_COLORS.REJECTED, Annulées: STATUS_COLORS.CANCELLED };
const fmt = (n: number) => Math.round(n).toLocaleString('fr-FR') + ' FCFA';

const groupOf = (s: string): Group =>
  ['PENDING', 'PENDING_DG'].includes(s) ? 'En attente' : ['ACTIVE', 'PAID', 'APPROVED', 'DEDUCTED'].includes(s) ? 'Accordées' : s === 'REJECTED' ? 'Refusées' : 'Annulées';

interface Req { group: Group; amount: number; createdAt: Date; decisionMin: number | null; isAdvance: boolean }

const normalize = (loans: any[], advances: any[]): Req[] => [
  ...loans.map(l => ({ l, adv: false })), ...advances.map(l => ({ l, adv: true })),
].map(({ l, adv }) => {
  const decided = l.dgDecidedAt || l.approvedAt || l.drhDecidedAt || l.rejectedAt || null;
  const g = groupOf(l.status);
  return {
    group: g, amount: Number(l.amount) || 0, createdAt: new Date(l.createdAt), isAdvance: adv,
    decisionMin: g === 'Accordées' || g === 'Refusées' ? minutesBetween(l.createdAt, decided) : null,
  };
});

export default function LoansRequestsPanel({ loans, advances, month, year }: { loans: any[]; advances: any[]; month: number; year: number }) {
  const all = useMemo(() => normalize(loans, advances), [loans, advances]);
  const inM = (r: Req, y: number, m: number) => r.createdAt.getFullYear() === y && r.createdAt.getMonth() + 1 === m;
  const cur = useMemo(() => all.filter(r => inM(r, year, month)), [all, year, month]);
  const prev = useMemo(() => { const m = month === 1 ? 12 : month - 1, y = month === 1 ? year - 1 : year; return all.filter(r => inM(r, y, m)); }, [all, year, month]);

  const st = (rs: Req[]) => {
    const ok = rs.filter(r => r.group === 'Accordées'), ko = rs.filter(r => r.group === 'Refusées');
    return {
      total: rs.length, ok: ok.length, ko: ko.length, pending: rs.filter(r => r.group === 'En attente').length,
      rate: ok.length + ko.length ? pct(ok.length, ok.length + ko.length) : null,
      delay: avg(rs.map(r => r.decisionMin).filter((n): n is number => n != null)),
      asked: rs.reduce((s, r) => s + r.amount, 0), granted: ok.reduce((s, r) => s + r.amount, 0),
    };
  };
  const S = useMemo(() => st(cur), [cur]);
  const P = useMemo(() => st(prev), [prev]);

  const byGroup = (Object.keys(GROUP_COLOR) as Group[]).map(name => ({ name, value: cur.filter(r => r.group === name).length })).filter(d => d.value > 0);
  const yearly = MONTHS_SHORT.map((mois, i) => {
    const rs = all.filter(r => inM(r, year, i + 1));
    const row: any = { mois };
    (Object.keys(GROUP_COLOR) as Group[]).forEach(g => { row[g] = rs.filter(r => r.group === g).length; });
    return row;
  });
  const buckets = (() => {
    const b: [string, number][] = [['< 1 h', 0], ['1 – 24 h', 0], ['1 – 3 j', 0], ['> 3 j', 0]];
    cur.forEach(r => { const m = r.decisionMin; if (m == null) return; b[m < 60 ? 0 : m < 1440 ? 1 : m < 4320 ? 2 : 3][1] += 1; });
    return b.map(([name, value]) => ({ name, value }));
  })();
  const adv = cur.filter(r => r.isAdvance).length;

  const insights: string[] = [];
  if (S.total) {
    const d = deltaPct(S.total, P.total || null);
    if (d != null && Math.abs(d) >= 10) insights.push(`Les demandes sont en ${d > 0 ? 'hausse' : 'baisse'} de ${Math.abs(Math.round(d))} % par rapport au mois précédent (${P.total} → ${S.total}).`);
    if (S.asked > 0) insights.push(`${fmt(S.granted)} accordés sur ${fmt(S.asked)} demandés (${pct(S.granted, S.asked)} %).`);
    if (S.pending) insights.push(`${S.pending} demande(s) toujours en attente de décision.`);
    insights.push(`${adv} avance(s) sur salaire et ${S.total - adv} prêt(s) sur le mois.`);
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-bold text-[var(--text)]">Pilotage des demandes — {MONTHS[month - 1]} {year}</p>
        <p className="text-xs text-[var(--text-muted)]">Toutes les demandes créées sur le mois, quel que soit leur statut ; évolution comparée au mois précédent.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        <KpiTile icon={ListChecks} tone="bg-sky-50 text-sky-600 dark:bg-sky-900/20" label="Demandes" value={S.total} delta={deltaPct(S.total, P.total || null)} />
        <KpiTile icon={CheckCircle2} tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20" label="Taux d’acceptation" value={S.rate != null ? `${S.rate} %` : '—'} hint={`${S.ok} accordée(s) · ${S.ko} refusée(s)`} delta={deltaPct(S.rate, P.rate)} />
        <KpiTile icon={Timer} tone="bg-violet-50 text-violet-600 dark:bg-violet-900/20" label="Délai moyen de décision" value={fmtMinutes(S.delay)} delta={deltaPct(S.delay, P.delay)} invert />
        <KpiTile icon={Banknote} tone="bg-amber-50 text-amber-600 dark:bg-amber-900/20" label="Montant accordé" value={fmt(S.granted)} hint={`sur ${fmt(S.asked)} demandés`} delta={deltaPct(S.granted, P.granted || null)} />
        <KpiTile icon={Hourglass} tone="bg-amber-50 text-amber-600 dark:bg-amber-900/20" label="En attente" value={S.pending} />
      </div>
      <Insights items={insights} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <ChartCard className="lg:col-span-2" title={`Demandes ${year}`} subtitle="Par décision, mois par mois">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={yearly}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} /><XAxis dataKey="mois" fontSize={12} /><YAxis fontSize={12} allowDecimals={false} /><Tooltip /><Legend />
              {(Object.keys(GROUP_COLOR) as Group[]).map(g => <Bar key={g} dataKey={g} stackId="a" fill={GROUP_COLOR[g]} />)}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Décisions du mois">
          {byGroup.length === 0 ? <EmptyChart h={240} /> : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart><Pie data={byGroup} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} label={(d: any) => `${pct(d.value, S.total)}%`}>
                {byGroup.map(d => <Cell key={d.name} fill={GROUP_COLOR[d.name as Group]} />)}
              </Pie><Tooltip /><Legend /></PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
        <ChartCard title="Délai de décision" subtitle="Demandes décidées sur le mois">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={buckets}><CartesianGrid strokeDasharray="3 3" opacity={0.2} /><XAxis dataKey="name" fontSize={11} /><YAxis fontSize={12} allowDecimals={false} /><Tooltip />
              <Bar dataKey="value" name="Demandes" fill="#8b5cf6" radius={[6, 6, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
