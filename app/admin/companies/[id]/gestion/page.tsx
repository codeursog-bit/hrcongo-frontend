// ============================================================================
// 🏢 GESTION D'ENTREPRISE — Super Admin
// Fichier: frontend/app/admin/companies/[id]/gestion/page.tsx
// Onglets : Vue d'ensemble · Tendances · Bilans · Contrôles de cohérence
// Tout est recalculé en base à chaque chargement (aucun compteur stocké) ;
// aucune donnée individuelle sensible (ni net à payer, ni salaire par employé).
// ============================================================================

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Loader2, AlertTriangle, CheckCircle2, Users, FileText, UserCog, CreditCard,
  TrendingUp, TrendingDown, Minus, Wrench, ShieldCheck, RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';
import { adminService } from '@/lib/services/adminService';

type Tab = 'overview' | 'trends' | 'reports' | 'checks';

const fmt = (n?: number | null) => `${Math.round(n ?? 0).toLocaleString('fr-FR')} F`;
const fmtN = (n?: number | null) => (n ?? 0).toLocaleString('fr-FR');
const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');
const errMsg = (e: any) => e?.message || 'Une erreur est survenue';

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Brouillon', VALIDATED: 'Validé', TO_PAY: 'À payer', PAID: 'Payé', CANCELLED: 'Annulé',
  ACTIVE: 'Actif', ON_LEAVE: 'En congé', SUSPENDED: 'Suspendu', TERMINATED: 'Parti', RETIRED: 'Retraité',
};
const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Admin', MANAGER: 'Manager', EMPLOYEE: 'Employé', ACCOUNTANT: 'Comptable', RH: 'RH',
};

const card = 'bg-gray-900 border border-gray-800 rounded-2xl p-4';
const selectCls = 'bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-gray-600';

function Variation({ v }: { v?: number | null }) {
  if (v == null) return <span className="text-gray-600">—</span>;
  const up = v > 0, flat = v === 0;
  const Icon = flat ? Minus : up ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${flat ? 'text-gray-400' : up ? 'text-emerald-300' : 'text-red-300'}`}>
      <Icon size={12} /> {up ? '+' : ''}{v} %
    </span>
  );
}

function Stat({ icon: Icon, label, value, sub }: { icon: any; label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className={card}>
      <div className="flex items-center gap-2 text-xs text-gray-500"><Icon size={14} /> {label}</div>
      <div className="text-2xl font-semibold text-white mt-1">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}

function Loading() {
  return <p className="text-sm text-gray-500 flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Chargement…</p>;
}
function ErrorBox({ text }: { text: string }) {
  return <div className="flex items-center gap-2 text-sm rounded-xl px-4 py-2 border text-red-300 border-red-500/25 bg-red-500/10"><AlertTriangle size={14} /> {text}</div>;
}

/** Charge une ressource et se recharge quand l'URL change. */
function useResource<T = any>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!url) return;
    let alive = true;
    setLoading(true); setError(null);
    adminService.get<T>(url).then(d => alive && setData(d)).catch(e => alive && setError(errMsg(e))).finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [url, tick]);
  return { data, loading, error, reload: () => setTick(t => t + 1) };
}

// ── Vue d'ensemble ───────────────────────────────────────────────────────────
function OverviewTab({ base, companyId }: { base: string; companyId: string }) {
  const { data: o, loading, error, reload } = useResource<any>(`${base}/overview`);
  const router = useRouter();
  if (loading && !o) return <Loading />;
  if (error) return <ErrorBox text={error} />;
  if (!o) return null;

  const cur = o.payrolls.currentMonth, prev = o.payrolls.previousMonth;
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={reload} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white"><RefreshCw size={12} /> Actualiser</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat icon={Users} label="Salariés en poste" value={fmtN(o.employees.paying)} sub={`${fmtN(o.employees.total)} fiches au total`} />
        <Stat icon={FileText} label={`Bulletins ${cur.period}`} value={fmtN(cur.payrolls)}
          sub={o.payrolls.activeEmployeesWithoutPayroll > 0
            ? <span className="text-amber-300">{o.payrolls.activeEmployeesWithoutPayroll} salarié(s) sans bulletin</span>
            : 'Tous les salariés ont un bulletin'} />
        <Stat icon={FileText} label="Bulletins générés (total)" value={fmtN(o.payrolls.total)} sub={`${prev.period} : ${fmtN(prev.payrolls)}`} />
        <Stat icon={UserCog} label="Utilisateurs" value={fmtN(o.users.active)}
          sub={`${o.users.total} comptes${o.users.locked ? ` · ${o.users.locked} bloqué(s)` : ''}`} />
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className={card}>
          <h3 className="text-sm font-medium text-white mb-3">Salariés par statut</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(o.employees.byStatus).map(([k, v]: any) => (
              <span key={k} className="px-2.5 py-1 rounded-full bg-gray-800 text-xs text-gray-300">{STATUS_LABEL[k] ?? k} · {v}</span>
            ))}
            {Object.keys(o.employees.byStatus).length === 0 && <span className="text-sm text-gray-500">Aucun salarié</span>}
          </div>
          <h3 className="text-sm font-medium text-white mt-4 mb-3">Bulletins {cur.period} par statut</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(cur.byStatus ?? {}).map(([k, v]: any) => (
              <span key={k} className="px-2.5 py-1 rounded-full bg-gray-800 text-xs text-gray-300">{STATUS_LABEL[k] ?? k} · {v}</span>
            ))}
            {Object.keys(cur.byStatus ?? {}).length === 0 && <span className="text-sm text-gray-500">Aucun bulletin ce mois-ci</span>}
          </div>
        </div>

        <div className={card}>
          <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2"><CreditCard size={14} /> Abonnement</h3>
          {o.subscription ? (
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-gray-500">Plan</dt><dd className="text-white">{o.subscription.plan}</dd>
              <dt className="text-gray-500">Statut</dt><dd className="text-white">{o.subscription.status}</dd>
              <dt className="text-gray-500">Fin de période</dt>
              <dd className="text-white">{fmtDate(o.subscription.currentPeriodEnd)}
                {o.subscription.daysLeft != null && <span className={`ml-2 text-xs ${o.subscription.daysLeft <= 7 ? 'text-amber-300' : 'text-gray-500'}`}>({o.subscription.daysLeft} j)</span>}
              </dd>
              <dt className="text-gray-500">Prix / mois</dt><dd className="text-white">{o.subscription.pricePerMonth != null ? fmt(o.subscription.pricePerMonth) : '—'}</dd>
              <dt className="text-gray-500">Comptes multi-entreprises liés</dt><dd className="text-white">{o.portfolio.linkedAccounts}</dd>
            </dl>
          ) : <p className="text-sm text-gray-500">Aucun abonnement</p>}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className={card}>
          <h3 className="text-sm font-medium text-white mb-3">Comptes</h3>
          <div className="flex flex-wrap gap-2 text-xs">
            {Object.entries(o.users.byRole).map(([k, v]: any) => (
              <span key={k} className="px-2.5 py-1 rounded-full bg-gray-800 text-gray-300">{ROLE_LABEL[k] ?? k} · {v}</span>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">2FA activée : {o.users.withTwoFactor}/{o.users.total} · dernière connexion : {fmtDate(o.users.lastLoginAt)}</p>
        </div>
        <div className={card}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-white">Dernières actions super admin</h3>
            <button onClick={() => router.push('/admin/actions')} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white"><Wrench size={12} /> Actions de support</button>
          </div>
          {o.recentAdminActions.length === 0 && <p className="text-sm text-gray-500">Aucune action enregistrée</p>}
          <div className="space-y-2">
            {o.recentAdminActions.map((a: any) => (
              <div key={a.id} className="text-xs">
                <p className="text-gray-300">{a.summary}</p>
                <p className="text-gray-600">{new Date(a.occurredAt).toLocaleString('fr-FR')}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tendances ────────────────────────────────────────────────────────────────
function TrendsTab({ base }: { base: string }) {
  const [months, setMonths] = useState(12);
  const { data, loading, error } = useResource<any>(`${base}/trends?months=${months}`);
  const rows: any[] = data?.months ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Période</span>
        <select className={selectCls} value={months} onChange={e => setMonths(Number(e.target.value))}>
          {[6, 12, 18, 24].map(m => <option key={m} value={m}>{m} derniers mois</option>)}
        </select>
      </div>
      {loading && !data && <Loading />}
      {error && <ErrorBox text={error} />}

      {rows.length > 0 && (
        <>
          <div className={card}>
            <h3 className="text-sm font-medium text-white mb-3">Effectif, embauches et départs</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={rows}>
                  <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                  <XAxis dataKey="period" tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 8 }} />
                  <Legend />
                  <Bar dataKey="hired" name="Embauches" fill="#10b981" />
                  <Bar dataKey="departed" name="Départs" fill="#ef4444" />
                  <Line type="monotone" dataKey="headcount" name="Effectif" stroke="#60a5fa" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={card}>
            <h3 className="text-sm font-medium text-white mb-3">Masse salariale et charges</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={rows}>
                  <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                  <XAxis dataKey="period" tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                  <Tooltip formatter={(v: any) => fmt(Number(v))} contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 8 }} />
                  <Legend />
                  <Bar dataKey="grossTotal" name="Masse salariale brute" fill="#6366f1" />
                  <Line type="monotone" dataKey="cnssSalarial" name="CNSS salariale" stroke="#f59e0b" dot={false} />
                  <Line type="monotone" dataKey="cnssEmployer" name="CNSS patronale" stroke="#fb7185" dot={false} />
                  <Line type="monotone" dataKey="its" name="ITS" stroke="#22d3ee" dot={false} />
                  <Line type="monotone" dataKey="tus" name="TUS" stroke="#a78bfa" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={`${card} overflow-x-auto`}>
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-500 text-left">
                <tr>
                  <th className="py-2 pr-3">Mois</th><th className="pr-3">Effectif</th><th className="pr-3">Bulletins</th>
                  <th className="pr-3">Masse brute</th><th className="pr-3">Var.</th><th className="pr-3">CNSS sal.</th>
                  <th className="pr-3">CNSS pat.</th><th className="pr-3">ITS</th><th>TUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-gray-300">
                {[...rows].reverse().map(r => (
                  <tr key={r.period}>
                    <td className="py-2 pr-3 text-white">{r.period}</td>
                    <td className="pr-3">{r.headcount} <span className="text-xs text-gray-500">({r.headcountChange > 0 ? '+' : ''}{r.headcountChange ?? 0})</span></td>
                    <td className="pr-3">{r.payrolls}{r.cancelled ? <span className="text-xs text-red-300"> (+{r.cancelled} annulés)</span> : null}</td>
                    <td className="pr-3">{fmt(r.grossTotal)}</td>
                    <td className="pr-3"><Variation v={r.grossVariationPct} /></td>
                    <td className="pr-3">{fmt(r.cnssSalarial)}</td>
                    <td className="pr-3">{fmt(r.cnssEmployer)}</td>
                    <td className="pr-3">{fmt(r.its)}</td>
                    <td>{fmt(r.tus)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ── Bilans ───────────────────────────────────────────────────────────────────
function ReportsTab({ base }: { base: string }) {
  const now = new Date();
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [year, setYear] = useState(now.getFullYear());
  const [index, setIndex] = useState(now.getMonth() + 1);
  const idx = period === 'month' ? index : period === 'quarter' ? Math.min(index, 4) : undefined;
  const { data: r, loading, error } = useResource<any>(`${base}/report?period=${period}&year=${year}${idx ? `&index=${idx}` : ''}`);

  const rowsDef: [string, string][] = [
    ['grossTotal', 'Masse salariale brute'], ['cnssSalarial', 'CNSS salariale'], ['cnssEmployer', 'CNSS patronale'],
    ['its', 'ITS / IRPP'], ['tus', 'TUS'], ['customTaxes', 'Taxes personnalisées'], ['employerCost', 'Coût total employeur'],
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select className={selectCls} value={period} onChange={e => { setPeriod(e.target.value as any); setIndex(1); }}>
          <option value="month">Mensuel</option><option value="quarter">Trimestriel</option><option value="year">Annuel</option>
        </select>
        <input type="number" className={`${selectCls} w-24`} value={year} onChange={e => setYear(Number(e.target.value))} />
        {period === 'month' && (
          <select className={selectCls} value={index} onChange={e => setIndex(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{String(i + 1).padStart(2, '0')}</option>)}
          </select>
        )}
        {period === 'quarter' && (
          <select className={selectCls} value={Math.min(index, 4)} onChange={e => setIndex(Number(e.target.value))}>
            {[1, 2, 3, 4].map(q => <option key={q} value={q}>T{q}</option>)}
          </select>
        )}
      </div>

      {loading && !r && <Loading />}
      {error && <ErrorBox text={error} />}

      {r && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Stat icon={Users} label="Effectif début" value={r.headcount.start} />
            <Stat icon={Users} label="Effectif fin" value={r.headcount.end} />
            <Stat icon={TrendingUp} label="Embauches" value={r.headcount.hired} />
            <Stat icon={TrendingDown} label="Départs" value={r.headcount.departed} />
            <Stat icon={Users} label="Supprimés du système" value={r.headcount.deletedFromSystem ?? '—'} sub="d'après l'audit" />
          </div>

          <div className={`${card} overflow-x-auto`}>
            <h3 className="text-sm font-medium text-white mb-3">Bilan {r.label} <span className="text-gray-500 font-normal">· comparé à {r.previousLabel}</span></h3>
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-500 text-left"><tr><th className="py-2">Rubrique</th><th>{r.label}</th><th>{r.previousLabel}</th><th>Variation</th></tr></thead>
              <tbody className="divide-y divide-gray-800 text-gray-300">
                <tr><td className="py-2">Bulletins générés</td><td>{r.totals.payrolls}</td><td>{r.previousTotals.payrolls}</td><td><Variation v={r.variationPct.payrolls} /></td></tr>
                {rowsDef.map(([k, label]) => (
                  <tr key={k}>
                    <td className="py-2">{label}</td><td className="text-white">{fmt(r.totals[k])}</td><td>{fmt(r.previousTotals[k])}</td>
                    <td><Variation v={r.variationPct[k]} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {r.byMonth.length > 1 && (
            <div className={`${card} overflow-x-auto`}>
              <h3 className="text-sm font-medium text-white mb-3">Détail par mois</h3>
              <table className="w-full text-sm">
                <thead className="text-xs text-gray-500 text-left"><tr><th className="py-2">Mois</th><th>Effectif</th><th>Bulletins</th><th>Masse brute</th><th>CNSS</th><th>ITS</th><th>TUS</th></tr></thead>
                <tbody className="divide-y divide-gray-800 text-gray-300">
                  {r.byMonth.map((m: any) => (
                    <tr key={m.period}><td className="py-2 text-white">{m.period}</td><td>{m.headcount}</td><td>{m.payrolls}</td>
                      <td>{fmt(m.grossTotal)}</td><td>{fmt(m.cnssSalarial + m.cnssEmployer)}</td><td>{fmt(m.its)}</td><td>{fmt(m.tus)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Contrôles de cohérence ───────────────────────────────────────────────────
function ChecksTab({ base }: { base: string }) {
  const d = new Date(); d.setMonth(d.getMonth() - 1);
  const [month, setMonth] = useState(d.getMonth() + 1);
  const [year, setYear] = useState(d.getFullYear());
  const router = useRouter();
  const { data: c, loading, error } = useResource<any>(`${base}/consistency?month=${month}&year=${year}`);

  // Regroupe les anomalies par règle
  const grouped: Record<string, { label: string; severity: string; items: any[] }> = {};
  (c?.issues ?? []).forEach((i: any) => {
    (grouped[i.code] ??= { label: i.label, severity: i.severity, items: [] }).items.push(i);
  });

  const ratioRow = (k: string, label: string) => (
    <tr key={k}><td className="py-2">{label}</td>
      <td className="text-white">{c.totals.ratiosPct[k] ?? '—'} %</td><td>{c.totals.previousRatiosPct[k] ?? '—'} %</td>
      <td><Variation v={c.totals.variationPct[k]} /></td></tr>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select className={selectCls} value={month} onChange={e => setMonth(Number(e.target.value))}>
          {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{String(i + 1).padStart(2, '0')}</option>)}
        </select>
        <input type="number" className={`${selectCls} w-24`} value={year} onChange={e => setYear(Number(e.target.value))} />
      </div>

      {loading && !c && <Loading />}
      {error && <ErrorBox text={error} />}

      {c && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat icon={FileText} label="Bulletins contrôlés" value={c.payrollsChecked} sub={`Mode fiscal : ${c.fiscalMode}`} />
            <Stat icon={ShieldCheck} label="Conformes" value={<span className="text-emerald-300">{c.summary.payrollsOk}</span>} />
            <Stat icon={AlertTriangle} label="Erreurs" value={<span className={c.summary.errors ? 'text-red-300' : 'text-white'}>{c.summary.errors}</span>} />
            <Stat icon={AlertTriangle} label="À vérifier" value={<span className={c.summary.warnings ? 'text-amber-300' : 'text-white'}>{c.summary.warnings}</span>} />
          </div>

          {c.summary.errors + c.summary.warnings === 0 && c.payrollsChecked > 0 && (
            <div className="flex items-center gap-2 text-sm rounded-xl px-4 py-2 border text-emerald-300 border-emerald-500/25 bg-emerald-500/10">
              <CheckCircle2 size={14} /> Tous les calculs de {c.period} sont cohérents.
            </div>
          )}

          <div className={`${card} overflow-x-auto`}>
            <h3 className="text-sm font-medium text-white mb-3">Masse salariale {c.totals.current.period} vs {c.totals.previous.period}</h3>
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-500 text-left"><tr><th className="py-2">Indicateur</th><th>{c.totals.current.period}</th><th>{c.totals.previous.period}</th><th>Variation</th></tr></thead>
              <tbody className="divide-y divide-gray-800 text-gray-300">
                <tr><td className="py-2">Effectif</td><td className="text-white">{c.totals.current.headcount}</td><td>{c.totals.previous.headcount}</td><td><Variation v={c.totals.variationPct.headcount} /></td></tr>
                <tr><td className="py-2">Masse salariale brute</td><td className="text-white">{fmt(c.totals.current.grossTotal)}</td><td>{fmt(c.totals.previous.grossTotal)}</td><td><Variation v={c.totals.variationPct.grossTotal} /></td></tr>
                <tr><td colSpan={4} className="pt-3 pb-1 text-xs text-gray-500">Poids de chaque prélèvement dans la masse salariale</td></tr>
                {ratioRow('cnssSalarial', 'CNSS salariale')}
                {ratioRow('cnssEmployer', 'CNSS patronale')}
                {ratioRow('its', 'ITS')}
                {ratioRow('tus', 'TUS')}
              </tbody>
            </table>
          </div>

          {c.checks.length > 0 && (
            <div className={card}>
              <h3 className="text-sm font-medium text-white mb-3">Points d'attention</h3>
              <ul className="space-y-1.5">
                {c.checks.map((k: any) => (
                  <li key={k.code} className={`text-sm flex items-start gap-2 ${k.severity === 'ERROR' ? 'text-red-300' : 'text-amber-300'}`}>
                    <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {k.label}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {Object.keys(grouped).length > 0 && (
            <div className={card}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-white">Écarts par règle</h3>
                <button onClick={() => router.push('/admin/actions')} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white"><Wrench size={12} /> Corriger via les actions</button>
              </div>
              <div className="space-y-4">
                {Object.entries(grouped).map(([code, g]) => (
                  <div key={code}>
                    <p className={`text-sm font-medium ${g.severity === 'ERROR' ? 'text-red-300' : 'text-amber-300'}`}>
                      {g.label} <span className="text-xs text-gray-500">· {g.items.length} bulletin(s)</span>
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {g.items.slice(0, 30).map((i: any) => (
                        <span key={i.payrollId + code} className="px-2 py-0.5 rounded-full bg-gray-800 text-xs text-gray-300">
                          {i.employee}{i.gap != null ? ` (écart ${fmt(i.gap)})` : ''}
                        </span>
                      ))}
                      {g.items.length > 30 && <span className="text-xs text-gray-500">+{g.items.length - 30} autres</span>}
                    </div>
                  </div>
                ))}
              </div>
              {c.summary.truncated && <p className="text-xs text-gray-500 mt-3">Liste tronquée aux 200 premiers écarts.</p>}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function CompanyManagementPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('overview');
  const [name, setName] = useState('');
  const base = `/admin/management/companies/${id}`;

  const loadName = useCallback(async () => {
    try { const o = await adminService.get<any>(`${base}/overview`); setName(o.company.name); } catch { /* affiché dans l'onglet */ }
  }, [base]);
  useEffect(() => { loadName(); }, [loadName]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: "Vue d'ensemble" }, { id: 'trends', label: 'Tendances' },
    { id: 'reports', label: 'Bilans' }, { id: 'checks', label: 'Contrôles' },
  ];

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto">
      <div>
        <button onClick={() => router.push(`/admin/companies/${id}`)} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white mb-2">
          <ArrowLeft size={12} /> Retour à la fiche entreprise
        </button>
        <h1 className="text-xl font-semibold text-white">{name || 'Gestion de l’entreprise'}</h1>
        <p className="text-sm text-gray-500 mt-1">Chiffres recalculés en direct depuis la base — aucune donnée individuelle sensible.</p>
      </div>

      <div className="flex gap-2 border-b border-gray-800 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm border-b-2 -mb-px whitespace-nowrap transition-colors ${
              tab === t.id ? 'border-red-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab base={base} companyId={id} />}
      {tab === 'trends' && <TrendsTab base={base} />}
      {tab === 'reports' && <ReportsTab base={base} />}
      {tab === 'checks' && <ChecksTab base={base} />}
    </div>
  );
}