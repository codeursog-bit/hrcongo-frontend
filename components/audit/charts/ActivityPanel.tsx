'use client';

// ============================================================================
// 📁 components/audit/charts/ActivityPanel.tsx
// Activité du journal d'audit : événements par jour (information / important /
// critique), totaux, actions et objets les plus fréquents. Données agrégées
// (aucune valeur, aucun nom) : visible aussi du support plateforme.
// ============================================================================
import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { Activity } from 'lucide-react';
import { KonzaLoader } from '@/components/ui/KonzaLoader';
import { auditTrailService, type AuditStats } from '@/services/audit-trail';
import { ACTION_LABEL, CHART_COLORS as C, ENTITY_LABEL, MONTHS_SHORT_FR } from '@/lib/audit-labels';

const axis = { fontSize: 11, fill: C.text } as const;
const WINDOWS = [7, 30, 90] as const;

const dayLabel = (iso: string) => `${Number(iso.slice(8, 10))} ${MONTHS_SHORT_FR[Number(iso.slice(5, 7)) - 1]}`;

function Tile({ label, value, tone }: { label: string; value: number; tone?: 'red' }) {
  return (
    <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-3">
      <p className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">{label}</p>
      <p className={`text-xl font-black mt-0.5 ${tone === 'red' && value > 0 ? 'text-red-600' : 'text-[var(--text)]'}`}>{value}</p>
    </div>
  );
}

function DayTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg p-3 text-xs space-y-0.5 min-w-[160px]">
      <p className="font-black text-[var(--text)] mb-1">{new Date(p.date + 'T00:00:00Z').toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' })}</p>
      <div className="flex justify-between gap-4"><span className="text-[var(--text-muted)]">Informations</span><b>{p.info}</b></div>
      <div className="flex justify-between gap-4"><span className="text-[var(--text-muted)]">Importants</span><b>{p.warn}</b></div>
      <div className="flex justify-between gap-4"><span className="text-[var(--text-muted)]">Critiques</span><b className="text-red-600">{p.critical}</b></div>
      <div className="flex justify-between gap-4 pt-1 border-t border-[var(--border)]"><span className="text-[var(--text-muted)]">Total</span><b>{p.info + p.warn + p.critical}</b></div>
    </div>
  );
}

export default function ActivityPanel({ companyId }: { companyId?: string }) {
  const [days, setDays] = useState<(typeof WINDOWS)[number]>(30);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setStats(null); setError(null);
    auditTrailService.stats({ companyId, days })
      .then(r => { if (alive) setStats(r); })
      .catch(e => { if (alive) setError(e?.message || "Impossible de charger l'activité"); });
    return () => { alive = false; };
  }, [companyId, days]);

  const rows = (stats?.days ?? []).map(d => ({ ...d, label: dayLabel(d.date) }));
  const actions = (stats?.topActions ?? []).map(a => ({ name: (ACTION_LABEL[a.action] ?? a.action).slice(0, 34), count: a.count }));
  const entities = (stats?.topEntities ?? []).map(e => ({ name: ENTITY_LABEL[e.entity] ?? e.entity, count: e.count }));

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm font-black text-[var(--text)] flex items-center gap-2"><Activity className="w-4 h-4 text-[var(--brand)]" /> Activité du journal</p>
        <div className="flex gap-1 p-1 rounded-xl bg-[var(--surface-2)]">
          {WINDOWS.map(w => (
            <button key={w} type="button" onClick={() => setDays(w)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${days === w ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}>
              {w} jours
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {!stats && !error && <KonzaLoader variant="section" />}

      {stats && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Tile label={`Événements (${stats.windowDays} j)`} value={stats.totals.events} />
            <Tile label="Informations" value={stats.totals.info} />
            <Tile label="Importants" value={stats.totals.warn} />
            <Tile label="Critiques" value={stats.totals.critical} tone="red" />
          </div>

          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4">
            <p className="text-sm font-black text-[var(--text)]">Événements par jour</p>
            <div className="mt-3" style={{ height: 220 }}>
              {stats.totals.events === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-[var(--text-muted)]">Aucun événement sur la période.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: -12 }} aria-label="Événements d'audit par jour">
                    <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
                    <XAxis dataKey="label" tick={axis} tickLine={false} interval={days === 7 ? 0 : 'preserveStartEnd'} />
                    <YAxis allowDecimals={false} tick={axis} tickLine={false} />
                    <Tooltip content={<DayTooltip />} cursor={{ fill: 'rgba(107,114,128,0.12)' }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="info" name="Informations" stackId="a" fill={C.info} />
                    <Bar dataKey="warn" name="Importants" stackId="a" fill={C.warn} />
                    <Bar dataKey="critical" name="Critiques" stackId="a" fill={C.critical} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {stats.totals.events > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {([['Actions les plus fréquentes', actions], ['Objets les plus touchés', entities]] as const).map(([title, data]) => (
                <div key={title} className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4">
                  <p className="text-sm font-black text-[var(--text)]">{title}</p>
                  <div className="mt-3" style={{ height: Math.max(120, data.length * 32 + 30) }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data as any} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 8 }} aria-label={title}>
                        <CartesianGrid strokeDasharray="3 3" stroke={C.grid} horizontal={false} />
                        <XAxis type="number" allowDecimals={false} tick={axis} tickLine={false} />
                        <YAxis type="category" dataKey="name" width={170} tick={axis} tickLine={false} />
                        <Tooltip />
                        <Bar dataKey="count" name="Événements" fill={C.brand} radius={[0, 3, 3, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}