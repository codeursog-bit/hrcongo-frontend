'use client';

import React, { useEffect, useId, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

export type ChartRow = { label: string; primary: number; secondary: number };
const colors = ['var(--brand)', 'var(--green)', 'var(--mustard)'];
function useChartMotion() {
  const [animate, setAnimate] = useState(false);
  useEffect(() => { const media = matchMedia('(prefers-reduced-motion: reduce)'); const update = () => setAnimate(!media.matches); update(); media.addEventListener('change', update); return () => media.removeEventListener('change', update); }, []);
  return animate;
}
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name?: string; value?: number | string; color?: string }[]; label?: string | number }) {
  if (!active || !payload?.length) return null;
  return <div className="k-chart-tooltip"><strong>{label}</strong>{payload.map((p, i) => <p key={i}>{p.name} : <b>{typeof p.value === 'number' ? p.value.toLocaleString('fr-FR') : p.value}</b></p>)}</div>;
}
function ChartFrame({ label, description, children }: { label: string; description: string; children: React.ReactNode }) {
  return <figure aria-label={label}><figcaption className="k-sr-only">{description}</figcaption>{children}</figure>;
}
export function SmoothChart({ data, label = 'Évolution mensuelle de la paie', primaryLabel = 'Masse salariale', secondaryLabel = 'Salaire net' }: { data: ChartRow[]; label?: string; primaryLabel?: string; secondaryLabel?: string }) {
  const id = useId().replace(/:/g, ''); const animate = useChartMotion();
  return <ChartFrame label={label} description={data.map(d => `${d.label} : ${primaryLabel} ${d.primary}, ${secondaryLabel} ${d.secondary} FCFA`).join(' ; ')}><div className="k-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{ top: 24, right: 16, left: 16, bottom: 0 }} accessibilityLayer>
    <defs>{colors.slice(0, 2).map((color, i) => <linearGradient id={`${id}-${i}`} key={i} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={0.24} /><stop offset="100%" stopColor={color} stopOpacity={0} /></linearGradient>)}</defs>
    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} dy={8} /><Tooltip content={<ChartTooltip />} cursor={false} />
    {(['primary', 'secondary'] as const).map((key, i) => <Area key={key} dataKey={key} name={i ? secondaryLabel : primaryLabel} type="monotone" stroke={colors[i]} strokeWidth={2.25} fill={`url(#${id}-${i})`} dot={false} activeDot={{ r: 5, fill: colors[i], stroke: 'var(--surface)', strokeWidth: 3 }} isAnimationActive={animate} animationDuration={700} />)}
  </AreaChart></ResponsiveContainer></div><div className="k-legend"><span><i style={{ background: colors[0] }} />{primaryLabel}</span><span><i style={{ background: colors[1] }} />{secondaryLabel}</span></div></ChartFrame>;
}
export function CapsuleChart({ data }: { data: ChartRow[] }) {
  const animate = useChartMotion();
  return <ChartFrame label="Paie par mois" description={data.map(d => `${d.label} : masse salariale ${d.primary}, net ${d.secondary} FCFA`).join(' ; ')}><div className="k-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} barGap={7} margin={{ top: 20, right: 8, left: 8, bottom: 0 }} accessibilityLayer>
    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} dy={8} /><Tooltip content={<ChartTooltip />} cursor={false} />
    {(['primary', 'secondary'] as const).map((key, i) => <Bar key={key} dataKey={key} name={i ? 'Salaire net' : 'Masse salariale'} fill={colors[i]} radius={[10, 10, 0, 0]} maxBarSize={16} background={{ fill: 'var(--surface-2)', radius: 10 }} isAnimationActive={animate} animationDuration={700} />)}
  </BarChart></ResponsiveContainer></div><div className="k-legend"><span><i style={{ background: colors[0] }} />Masse salariale</span><span><i style={{ background: colors[1] }} />Salaire net</span></div></ChartFrame>;
}
export function DonutChart({ data, total, label }: { data: { name: string; value: number }[]; total: string; label: string }) {
  const animate = useChartMotion();
  return <ChartFrame label={label} description={`${total} ${label}. ${data.map(d => `${d.name} : ${d.value}`).join(' ; ')}`}><div className="k-donut-layout"><div className="k-donut"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius="72%" outerRadius="94%" paddingAngle={5} cornerRadius={8} stroke="none" startAngle={90} endAngle={-270} isAnimationActive={animate} animationDuration={700}>{data.map((d, i) => <Cell key={d.name} fill={colors[i % colors.length]} />)}</Pie><Tooltip content={<ChartTooltip />} /></PieChart></ResponsiveContainer><div className="k-donut-center"><strong>{total}</strong><span>{label}</span></div></div><ul className="k-donut-legend">{data.map((d, i) => <li key={d.name}><i style={{ background: colors[i % colors.length] }} /><span>{d.name}</span><b>{d.value}</b></li>)}</ul></div></ChartFrame>;
}
