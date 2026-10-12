'use client';

// ============================================================================
// 📁 components/audit/charts/TrendCharts.tsx
// Courbes de tendance des contrôles de paie, mois par mois :
//   1. Conformité (% de bulletins sans écart ouvert)
//   2. Écarts ouverts / critiques / bloquants
//   3. Écarts nouveaux / résolus
//   4. Répartition des écarts ouverts par gravité (anneau)
//   5. Règles les plus en écart
// Un mois sans contrôle apparaît comme un TROU (valeur null), jamais comme un faux 0.
// L'infobulle de chaque mois affiche TOUS les champs renvoyés par le back.
// ============================================================================
import React, { useMemo } from 'react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ReferenceLine,
} from 'recharts';
import type { AuditSummary, RuleDef, TrendPoint, TopRule } from '@/services/audit-engine';
import { CHART_COLORS as C, MONTHS_FR, MONTHS_SHORT_FR, fmtDateTime } from '@/lib/audit-labels';

type Row = TrendPoint & { label: string };

const toRows = (months: TrendPoint[]): Row[] =>
  months.map(m => ({ ...m, label: `${MONTHS_SHORT_FR[m.month - 1]} ${String(m.year).slice(2)}` }));

const axis = { fontSize: 11, fill: C.text } as const;

function Empty({ text }: { text: string }) {
  return <div className="h-full flex items-center justify-center text-xs text-[var(--text-muted)] text-center px-6">{text}</div>;
}

function Card({ title, subtitle, children, height = 240 }: { title: string; subtitle?: string; children: React.ReactNode; height?: number }) {
  return (
    <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4">
      <p className="text-sm font-black text-[var(--text)]">{title}</p>
      {subtitle && <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
      <div className="mt-3" style={{ height }}>{children}</div>
    </div>
  );
}

/** Infobulle commune : tous les champs du mois. */
function MonthTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p: Row = payload[0].payload;
  const line = (k: string, v: React.ReactNode) => (
    <div className="flex justify-between gap-4"><span className="text-[var(--text-muted)]">{k}</span><span className="font-semibold text-[var(--text)]">{v ?? '—'}</span></div>
  );
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg p-3 text-xs space-y-0.5 min-w-[210px]">
      <p className="font-black text-[var(--text)] mb-1">{MONTHS_FR[p.month - 1]} {p.year}</p>
      {!p.hasRun ? <p className="text-[var(--text-muted)]">Aucun contrôle ce mois-là.</p> : (
        <>
          {line('Conformité', p.conformityRate === null ? '—' : `${p.conformityRate} %`)}
          {line('Bulletins contrôlés', p.payrollsChecked)}
          {line('Bulletins avec écart', p.payrollsWithFindings)}
          {line('Écarts ouverts', p.findingsOpen)}
          {line('Dont critiques', p.openCritical)}
          {line('Dont bloquants', p.openBlocking)}
          {line('Nouveaux / rouverts', p.findingsNew)}
          {line('Résolus', p.findingsResolved)}
          {line('Contrôles du mois', p.runs)}
          {line('Dernier contrôle', p.lastRunAt ? fmtDateTime(p.lastRunAt) : '—')}
        </>
      )}
    </div>
  );
}

export function TrendCharts({
  months, topRules, open, rulesByCode,
}: { months: TrendPoint[]; topRules: TopRule[]; open: AuditSummary['open']; rulesByCode: Record<string, RuleDef> }) {
  const rows = useMemo(() => toRows(months), [months]);
  const anyRun = rows.some(r => r.hasRun);

  const donut = [
    { name: 'Critiques', value: open.critical, color: C.critical },
    { name: 'Importants', value: open.warn, color: C.warn },
    { name: 'Informations', value: open.info, color: C.info },
  ].filter(d => d.value > 0);

  const ruleRows = topRules.map(r => ({
    name: (rulesByCode[r.ruleCode]?.label ?? r.ruleCode).slice(0, 34),
    detected: r.count, open: r.open,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <Card title="Conformité de la paie" subtitle="Part des bulletins sans écart ouvert, d'après le dernier contrôle de chaque mois.">
        {!anyRun ? <Empty text="Aucun contrôle sur la période : lancez un contrôle pour démarrer la courbe." /> : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: -12 }} aria-label="Conformité mensuelle">
              <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
              <XAxis dataKey="label" tick={axis} tickLine={false} />
              <YAxis domain={[0, 100]} tick={axis} tickLine={false} unit=" %" />
              <ReferenceLine y={100} stroke={C.ok} strokeDasharray="4 4" />
              <Tooltip content={<MonthTooltip />} />
              <Line type="monotone" dataKey="conformityRate" name="Conformité (%)" stroke={C.brand} strokeWidth={2.5} dot={{ r: 3 }} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card title="Écarts ouverts" subtitle="À l'issue du dernier contrôle de chaque mois : total, critiques, bloquants.">
        {!anyRun ? <Empty text="Aucune donnée sur la période." /> : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: -12 }} aria-label="Écarts ouverts par mois">
              <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
              <XAxis dataKey="label" tick={axis} tickLine={false} />
              <YAxis allowDecimals={false} tick={axis} tickLine={false} />
              <Tooltip content={<MonthTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="findingsOpen" name="Ouverts" fill={C.warn} radius={[3, 3, 0, 0]} />
              <Bar dataKey="openCritical" name="Critiques" fill={C.critical} radius={[3, 3, 0, 0]} />
              <Bar dataKey="openBlocking" name="Bloquants" fill={C.blocking} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card title="Nouveaux et résolus" subtitle="Écarts apparus (ou rouverts) et écarts clos automatiquement, par mois." height={220}>
        {!anyRun ? <Empty text="Aucune donnée sur la période." /> : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: -12 }} aria-label="Écarts nouveaux et résolus">
              <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
              <XAxis dataKey="label" tick={axis} tickLine={false} />
              <YAxis allowDecimals={false} tick={axis} tickLine={false} />
              <Tooltip content={<MonthTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="findingsNew" name="Nouveaux / rouverts" fill={C.critical} radius={[3, 3, 0, 0]} />
              <Bar dataKey="findingsResolved" name="Résolus" fill={C.ok} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card title="Écarts ouverts par gravité" subtitle="Situation actuelle du mois sélectionné." height={220}>
        {donut.length === 0 ? <Empty text="Aucun écart ouvert pour ce mois." /> : (
          <div className="h-full flex items-center gap-4">
            <div className="relative h-full flex-1 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart aria-label="Répartition des écarts ouverts par gravité">
                  <Pie data={donut} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="85%" paddingAngle={2} stroke="none">
                    {donut.map(d => <Cell key={d.name} fill={d.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: any, n: any) => [`${v}`, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-[var(--text)]">{open.total}</span>
                <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">ouverts</span>
              </div>
            </div>
            <ul className="space-y-1.5 text-xs shrink-0">
              {donut.map(d => (
                <li key={d.name} className="flex items-center gap-2 text-[var(--text)]">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: d.color }} /> {d.name} <b>{d.value}</b>
                </li>
              ))}
              {open.blocking > 0 && <li className="text-[var(--text-muted)] pt-1">dont <b className="text-red-600">{open.blocking}</b> bloquant{open.blocking > 1 ? 's' : ''}</li>}
            </ul>
          </div>
        )}
      </Card>

      <div className="lg:col-span-2">
        <Card title="Règles les plus en écart" subtitle="Sur la fenêtre affichée : écarts détectés et encore ouverts, par règle." height={Math.max(160, ruleRows.length * 34 + 40)}>
          {ruleRows.length === 0 ? <Empty text="Aucun écart détecté sur la période." /> : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ruleRows} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 8 }} aria-label="Règles les plus en écart">
                <CartesianGrid strokeDasharray="3 3" stroke={C.grid} horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={axis} tickLine={false} />
                <YAxis type="category" dataKey="name" width={190} tick={axis} tickLine={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="detected" name="Détectés" fill={C.warn} radius={[0, 3, 3, 0]} />
                <Bar dataKey="open" name="Encore ouverts" fill={C.critical} radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
}