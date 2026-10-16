'use client';

// ============================================================================
// 📁 components/payroll-journal/JournalDashboard.tsx
// ✅ Partie "dashboard" du journal de paie : indicateurs RH + graphiques.
//    Aucun appel réseau : tout vient du journal déjà chargé par la page.
//    Les blocs sans donnée (ex. pas d'expatriés) ne s'affichent pas.
// ============================================================================

import React from 'react';
import {
  Users, Wallet, Landmark, HandCoins, Globe2, Building2, Percent, TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts';
import type { PayrollJournal } from '@/types/payroll-journal';
import { fmtMoney } from '@/lib/payroll-journal-columns';

const PALETTE = ['#10B981', '#EF4444', '#F59E0B', '#8B5CF6', '#0EA5E9', '#EC4899', '#14B8A6', '#64748B'];

const fmtShort = (v: number) =>
  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1).replace('.0', '')} M` : v >= 1000 ? `${Math.round(v / 1000)} k` : String(v);

const tooltipMoney = (v: any) => `${Math.round(Number(v)).toLocaleString('fr-FR')} F`;

function Kpi({
  label, value, hint, Icon, tone,
}: { label: string; value: string; hint?: string; Icon: any; tone: string }) {
  return (
    <div className="flex items-center justify-between p-4 bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm">
      <div className="min-w-0">
        <p className="text-xs text-[var(--text-muted)]">{label}</p>
        <p className="text-lg font-bold text-[var(--text)] truncate">{value}</p>
        {hint && <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{hint}</p>}
      </div>
      <Icon className={`w-5 h-5 shrink-0 ${tone}`} />
    </div>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm p-4">
      <h3 className="text-sm font-bold text-[var(--text)]">{title}</h3>
      {subtitle && <p className="text-xs text-[var(--text-muted)] mb-2">{subtitle}</p>}
      <div className="mt-2">{children}</div>
    </div>
  );
}

function RatioBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-[var(--text-muted)]">{label}</span>
        <span className="font-bold text-[var(--text)]">{value.toLocaleString('fr-FR')} %</span>
      </div>
      <div className="h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, value)}%`, background: color }} />
      </div>
    </div>
  );
}

export default function JournalDashboard({ journal }: { journal: PayrollJournal }) {
  const s = journal.summary;
  const c = journal.charts;
  const hasExpat = journal.options.hasExpat;

  return (
    <div className="space-y-4 print:hidden">
      {/* ── Récapitulatif ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi
          label="Effectif au journal" Icon={Users} tone="text-[var(--brand)]"
          value={String(s.headcount)}
          hint={hasExpat ? `dont ${s.expatCount} expatrié${s.expatCount > 1 ? 's' : ''}` : undefined}
        />
        <Kpi
          label="Brut Congo" Icon={Wallet} tone="text-emerald-500"
          value={`${fmtMoney(s.grossCongo)} F`}
          hint={`Moyenne : ${fmtMoney(s.avgGrossCongo)} F`}
        />
        <Kpi
          label="Charges salariales (CNSS + impôt + taxes)" Icon={Landmark} tone="text-red-500"
          value={`${fmtMoney(s.totalChargesCongo)} F`}
          hint={`${s.chargesRatio.toLocaleString('fr-FR')} % du brut`}
        />
        <Kpi
          label="Net à payer — Congo" Icon={HandCoins} tone="text-[var(--accent-2)]"
          value={`${fmtMoney(s.netCongo)} F`}
          hint={`Moyenne : ${fmtMoney(s.avgNetCongo)} F`}
        />
        {hasExpat && (
          <>
            <Kpi label="Brut payé à l'étranger" Icon={Globe2} tone="text-violet-500" value={`${fmtMoney(s.foreignGross)} F`} />
            <Kpi label="Net payé à l'étranger" Icon={Globe2} tone="text-violet-500" value={`${fmtMoney(s.foreignNet)} F`} />
            <Kpi label="Brut total (Congo + étranger)" Icon={TrendingUp} tone="text-[var(--text)]" value={`${fmtMoney(s.totalGross)} F`} />
            <Kpi label="Net total (Congo + étranger)" Icon={TrendingUp} tone="text-[var(--text)]" value={`${fmtMoney(s.totalNet)} F`} />
          </>
        )}
        <Kpi
          label="Charges patronales CNSS" Icon={Building2} tone="text-sky-500"
          value={`${fmtMoney(s.cnssEmployer)} F`}
        />
        <Kpi
          label={hasExpat ? 'Coût total entreprise (employeur Congo + brut étranger)' : 'Coût total employeur'}
          Icon={Percent} tone="text-[var(--brand)]"
          value={`${fmtMoney(s.totalCompanyCost)} F`}
        />
      </div>

      {/* ── Indicateurs en pourcentage ───────────────────────────────── */}
      <Card title="Indicateurs clés" subtitle="Calculés sur la paie Congo du mois">
        <div className={`grid grid-cols-1 ${hasExpat ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
          <RatioBar label="Net / Brut" value={s.netToGrossRatio} color="#10B981" />
          <RatioBar label="Charges salariales / Brut" value={s.chargesRatio} color="#EF4444" />
          {hasExpat && <RatioBar label="Part de l'étranger dans le brut total" value={s.foreignShare} color="#8B5CF6" />}
        </div>
      </Card>

      {/* ── Graphiques ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Où va l'argent ?" subtitle="Répartition du coût salarial du mois">
          {c.distribution.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] py-10 text-center">Aucune donnée.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={c.distribution} dataKey="value" nameKey="label" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {c.distribution.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Pie>
                <Tooltip formatter={tooltipMoney} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card title="Du brut au net" subtitle="Étapes de la paie Congo">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={c.grossToNet} margin={{ left: 0, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={fmtShort} />
              <Tooltip formatter={tooltipMoney} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {c.grossToNet.map((_, i) => <Cell key={i} fill={['#10B981', '#EF4444', '#F59E0B', '#0EA5E9'][i % 4]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Les mieux rémunérés" subtitle="Brut et net (Congo + étranger)">
          <ResponsiveContainer width="100%" height={Math.max(220, c.topEarners.length * 34)}>
            <BarChart data={c.topEarners} layout="vertical" margin={{ left: 10, right: 12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={fmtShort} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10 }} />
              <Tooltip formatter={tooltipMoney} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="totalGross" name="Brut" fill="#10B981" radius={[0, 4, 4, 0]} />
              <Bar dataKey="totalNet" name="Net" fill="#F59E0B" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Détail des charges salariales" subtitle="CNSS, impôt et taxes configurées">
          {c.chargesBreakdown.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] py-10 text-center">Aucune charge ce mois-ci.</p>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(220, c.chargesBreakdown.length * 40)}>
              <BarChart data={c.chargesBreakdown} layout="vertical" margin={{ left: 10, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={fmtShort} />
                <YAxis type="category" dataKey="label" width={110} tick={{ fontSize: 10 }} />
                <Tooltip formatter={tooltipMoney} />
                <Bar dataKey="value" name="Montant" radius={[0, 6, 6, 0]}>
                  {c.chargesBreakdown.map((_, i) => <Cell key={i} fill={PALETTE[(i + 1) % PALETTE.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {c.byDepartment.length > 1 && (
          <Card title="Masse salariale par département" subtitle="Brut et net (Congo + étranger)">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={c.byDepartment} margin={{ left: 0, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={fmtShort} />
                <Tooltip formatter={tooltipMoney} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="totalGross" name="Brut" fill="#10B981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="totalNet" name="Net" fill="#F59E0B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {hasExpat && c.byCountry.length > 0 && (
          <Card title="Paie à l'étranger par pays" subtitle="Qui paie quoi, et d'où">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[var(--text-muted)] text-left border-b border-[var(--border)]">
                    <th className="py-2 pr-2 font-semibold">Pays</th>
                    <th className="py-2 px-2 font-semibold text-right">Expatriés</th>
                    <th className="py-2 px-2 font-semibold text-right">Brut</th>
                    <th className="py-2 pl-2 font-semibold text-right">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {c.byCountry.map((k) => (
                    <tr key={k.countryCode} className="border-b border-[var(--border)] last:border-0">
                      <td className="py-2 pr-2 font-semibold text-[var(--text)]">{k.countryName} ({k.countryCode})</td>
                      <td className="py-2 px-2 text-right tabular-nums">{k.headcount}</td>
                      <td className="py-2 px-2 text-right tabular-nums">{fmtMoney(k.gross)}</td>
                      <td className="py-2 pl-2 text-right tabular-nums font-bold">{fmtMoney(k.net)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}