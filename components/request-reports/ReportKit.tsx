'use client';

// ============================================================================
// 📁 components/request-reports/ReportKit.tsx
// ✅ Briques communes des dashboards de rapport des demandes : barre de
//    filtres (période / type / département), tuile KPI avec évolution vs
//    période précédente, carte de graphique, carte d'observations.
// ============================================================================

import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, Lightbulb, X, Download } from 'lucide-react';
import { Period, MONTHS } from '@/lib/request-history';

/** Période équivalente précédente (mois → mois -1, année → année -1) ; null si non comparable */
export const prevPeriod = (p: Period): Period | null => {
  if (p.mode === 'month') return p.month === 1 ? { ...p, month: 12, year: p.year - 1 } : { ...p, month: p.month - 1 };
  if (p.mode === 'year') return { ...p, year: p.year - 1 };
  return null;
};

export const periodLabel = (p: Period) =>
  p.mode === 'month' ? `${MONTHS[p.month - 1]} ${p.year}` : p.mode === 'year' ? `Année ${p.year}` : p.mode === 'all' ? 'Toute la période'
    : `${p.from || '…'} → ${p.to || '…'}`;

export function KpiTile({ icon: Icon, tone, label, value, hint, delta, invert, onClick, active }: {
  icon: any; tone: string; label: string; value: React.ReactNode; hint?: string;
  /** variation en % vs période précédente (null = non comparable) */
  delta?: number | null; /** true si une baisse est une bonne nouvelle (ex. délai, dépassements) */ invert?: boolean;
  onClick?: () => void; active?: boolean;
}) {
  const good = delta == null || delta === 0 ? null : invert ? delta < 0 : delta > 0;
  const Tag: any = onClick ? 'button' : 'div';
  return (
    <Tag onClick={onClick} className={`text-left bg-[var(--surface)] rounded-2xl border p-4 ${active ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-[var(--border)]'} ${onClick ? 'hover:border-emerald-400 cursor-pointer' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${tone}`}><Icon size={17} /></div>
        {delta !== undefined && (
          <span className={`text-[11px] font-bold flex items-center gap-0.5 px-1.5 py-0.5 rounded-md ${delta == null || delta === 0 ? 'text-[var(--text-muted)] bg-[var(--surface-2)]' : good ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' : 'text-red-600 bg-red-50 dark:bg-red-900/20'}`}>
            {delta == null ? <Minus size={11} /> : delta > 0 ? <ArrowUpRight size={12} /> : delta < 0 ? <ArrowDownRight size={12} /> : <Minus size={11} />}
            {delta == null ? '—' : `${delta > 0 ? '+' : ''}${Math.round(delta)}%`}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-[var(--text)] leading-none">{value}</p>
      <p className="text-xs text-[var(--text-muted)] mt-1.5">{label}</p>
      {hint && <p className="text-[10px] text-[var(--text-muted)] mt-0.5 opacity-80">{hint}</p>}
    </Tag>
  );
}

export const deltaPct = (cur: number | null, prev: number | null): number | null =>
  cur == null || prev == null || prev === 0 ? null : ((cur - prev) / prev) * 100;

export function ChartCard({ title, subtitle, children, className = '', action }: { title: string; subtitle?: string; children: React.ReactNode; className?: string; action?: React.ReactNode }) {
  return (
    <div className={`bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 ${className}`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <p className="text-sm font-bold text-[var(--text)]">{title}</p>
          {subtitle && <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export const EmptyChart = ({ h = 220 }: { h?: number }) => (
  <div style={{ height: h }} className="flex items-center justify-center text-sm text-[var(--text-muted)]">Aucune donnée pour cette période.</div>
);

export function Insights({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/60 dark:bg-emerald-900/10 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 mb-2"><Lightbulb size={14} /> À retenir</p>
      <ul className="space-y-1.5">
        {items.map((t, i) => <li key={i} className="text-sm text-[var(--text)] flex gap-2"><span className="text-emerald-500">•</span>{t}</li>)}
      </ul>
    </div>
  );
}

export function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <button onClick={onClear} className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500 text-white flex items-center gap-1">
      {label} <X size={11} />
    </button>
  );
}

export function PeriodBar({ period, setPeriod, years, types, type, setType, depts, dept, setDept, onExport, exportDisabled }: {
  period: Period; setPeriod: (p: Period) => void; years: number[];
  types: Record<string, string>; type: string; setType: (v: string) => void;
  depts: string[]; dept: string; setDept: (v: string) => void;
  onExport?: () => void; exportDisabled?: boolean;
}) {
  const sel = 'text-xs px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)]';
  return (
    <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-3 flex flex-wrap items-center gap-2">
      <div className="flex gap-1 bg-[var(--surface-2)] p-1 rounded-xl">
        {([['month', 'Mois'], ['year', 'Année'], ['custom', 'Libre'], ['all', 'Tout']] as const).map(([m, l]) => (
          <button key={m} onClick={() => setPeriod({ ...period, mode: m })} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${period.mode === m ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm' : 'text-[var(--text-muted)]'}`}>{l}</button>
        ))}
      </div>
      {period.mode === 'month' && (
        <select value={period.month} onChange={e => setPeriod({ ...period, month: Number(e.target.value) })} className={sel}>
          {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
      )}
      {(period.mode === 'month' || period.mode === 'year') && (
        <select value={period.year} onChange={e => setPeriod({ ...period, year: Number(e.target.value) })} className={sel}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      )}
      {period.mode === 'custom' && (<>
        <input type="date" value={period.from} onChange={e => setPeriod({ ...period, from: e.target.value })} className={sel} />
        <span className="text-xs text-[var(--text-muted)]">au</span>
        <input type="date" value={period.to} onChange={e => setPeriod({ ...period, to: e.target.value })} className={sel} />
      </>)}
      <select value={type} onChange={e => setType(e.target.value)} className={sel}>
        <option value="">Tous les types</option>
        {Object.entries(types).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
      <select value={dept} onChange={e => setDept(e.target.value)} className={sel}>
        <option value="">Tous les départements</option>
        {depts.map(d => <option key={d} value={d}>{d}</option>)}
      </select>
      {onExport && (
        <button onClick={onExport} disabled={exportDisabled} className="ml-auto px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-500 text-white flex items-center gap-1.5 disabled:opacity-40">
          <Download size={14} /> Exporter CSV
        </button>
      )}
    </div>
  );
}

/** Carte de chaleur jour × heure (permissions) — 7 lignes (lun→dim) × colonnes d'heures */
export function Heatmap({ cells, hours, rowLabels }: { cells: number[][]; hours: number[]; rowLabels: string[] }) {
  const max = Math.max(1, ...cells.flat());
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[520px]">
        <div className="grid gap-1" style={{ gridTemplateColumns: `44px repeat(${hours.length}, minmax(0, 1fr))` }}>
          <span />
          {hours.map(h => <span key={h} className="text-[10px] text-center text-[var(--text-muted)]">{h}h</span>)}
          {cells.map((row, r) => (
            <React.Fragment key={r}>
              <span className="text-[11px] text-[var(--text-muted)] flex items-center">{rowLabels[r]}</span>
              {row.map((v, c) => (
                <div key={c} title={`${rowLabels[r]} ${hours[c]}h : ${v} sortie(s)`} className="h-7 rounded-md flex items-center justify-center text-[10px] font-semibold"
                  style={{ background: v ? `rgba(16,185,129,${0.15 + 0.85 * (v / max)})` : 'var(--surface-2)', color: v / max > 0.55 ? '#fff' : 'var(--text-muted)' }}>
                  {v || ''}
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Entonnoir horizontal : chaque étape avec son % de l'étape d'origine */
export function Funnel({ steps }: { steps: { label: string; value: number; color: string }[] }) {
  const top = Math.max(1, steps[0]?.value || 1);
  return (
    <div className="space-y-3">
      {steps.map((s, i) => (
        <div key={s.label}>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-semibold text-[var(--text)]">{s.label}</span>
            <span className="text-[var(--text-muted)]">{s.value}{i > 0 ? ` · ${Math.round((s.value / top) * 100)}%` : ''}</span>
          </div>
          <div className="h-3 rounded-full bg-[var(--surface-2)] overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${(s.value / top) * 100}%`, background: s.color }} />
          </div>
        </div>
      ))}
    </div>
  );
}
