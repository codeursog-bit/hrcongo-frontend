// ============================================================================
// Fichier: components/admin/companies/CompanyInsights.tsx
// Détail enrichi d'une entreprise (super admin) — toutes les données viennent de
// GET /admin/companies/:id/insights : aucune valeur écrite en dur.
// ============================================================================

'use client';

import React, { useState } from 'react';
import {
  Users, UserCheck, Activity, Clock, AlertTriangle, AlertCircle, Info, CheckCircle2, Circle,
  HardDrive, Database, CreditCard, Layers, TrendingUp, Loader2, RefreshCw, Briefcase, ShieldCheck,
} from 'lucide-react';
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';

// ─── Types (reflet de la réponse du back) ───────────────────────────────────
type Level = 'CRITICAL' | 'WARNING' | 'INFO';
export interface CompanyInsightsData {
  generatedAt: string;
  plan: string;
  personnel: null | {
    activeHeadcount: number; totalRecords: number; byStatus: Record<string, number>;
    byContractType: { type: string; count: number }[]; byDepartment: { name: string; count: number }[];
    hiredLast30d: number; leftLast30d: number; cddEndingIn30d: number; onTrial: number; withAccount: number;
  };
  accounts: null | {
    total: number; active: number; byRole: { role: string; count: number }[];
    loggedIn30d: number; neverLoggedIn: number; twoFactorEnabled: number; lastLoginAt: string | null;
  };
  limits: { key: string; label: string; used: number; max: number | null; pct: number | null; unit: string }[];
  features: {
    key: string; label: string; unit: string; included: boolean; events30d: number; eventsTotal: number;
    lastUsedAt: string | null; adoption: 'active' | 'dormant' | 'unused' | 'locked'; sharePct: number;
  }[];
  consumption: null | {
    requests30d: number; platformSharePct: number; activeMinutes30d: number; distinctActiveUsers30d: number;
    activeDays30d: number; avgRequestsPerActiveDay: number; peakDay: { date: string; requests: number } | null;
    daily: { date: string; requests: number; activeUsers: number; activeMinutes: number }[];
    attendanceMethods: { method: string; count: number }[];
  };
  storage: null | {
    documentsCount: number; documentsBytes: number; estimatedDbBytes: number;
    topTables: { table: string; label: string; rows: number; estimatedBytes: number }[];
  };
  payments: null | {
    totalPaid: number; successfulCount: number; failedLast30d: number;
    last: { id: string; status: string; amount: number; currency: string; provider: string; method: string | null; at: string }[];
  };
  setup: null | { items: { key: string; label: string; done: boolean }[]; done: number; total: number; scorePct: number };
  health: { lastActivityAt: string | null; daysSinceActivity: number | null; signals: { level: Level; title: string; detail: string }[] };
}

// ─── Helpers d'affichage ────────────────────────────────────────────────────
const fmtN = (n: number | null | undefined) => (n == null ? '—' : n.toLocaleString('fr-FR'));
const fmtBytes = (b: number) =>
  b >= 1073741824 ? `${(b / 1073741824).toFixed(2)} Go` : b >= 1048576 ? `${(b / 1048576).toFixed(1)} Mo`
  : b >= 1024 ? `${Math.round(b / 1024)} Ko` : `${b} o`;
const fmtMin = (m: number) => (m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`);
const ago = (iso: string | null) => {
  if (!iso) return 'jamais';
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return d <= 0 ? 'aujourd’hui' : d === 1 ? 'hier' : `il y a ${d} j`;
};
const barColor = (pct: number | null) =>
  pct == null ? 'bg-sky-500' : pct >= 100 ? 'bg-red-500' : pct >= 90 ? 'bg-amber-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-emerald-500';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrateur', HR_MANAGER: 'RH', MANAGER: 'Manager', EMPLOYEE: 'Employé',
  SUPER_ADMIN: 'Super admin', CABINET_ADMIN: 'Admin cabinet', CABINET_GESTIONNAIRE: 'Gestionnaire cabinet',
};
const STATUS_META: Record<string, { label: string; bar: string }> = {
  ACTIVE: { label: 'Actifs', bar: 'bg-emerald-500' }, ON_LEAVE: { label: 'En congé', bar: 'bg-sky-500' },
  SUSPENDED: { label: 'Suspendus', bar: 'bg-amber-500' }, TERMINATED: { label: 'Sortis', bar: 'bg-gray-600' },
  RETIRED: { label: 'Retraités', bar: 'bg-purple-500' },
};
const METHOD_LABELS: Record<string, string> = {
  GPS: 'GPS (mobile)', KIOSK: 'Borne / kiosque', QR_SCAN: 'Scan QR', SECRET_CODE: 'Code secret',
  MANUAL: 'Saisie manuelle', 'NON_RENSEIGNÉ': 'Non renseigné',
};
const SIGNAL_STYLE: Record<Level, { box: string; icon: React.ElementType; color: string }> = {
  CRITICAL: { box: 'border-red-900/50 bg-red-900/10', icon: AlertCircle, color: 'text-red-400' },
  WARNING: { box: 'border-amber-900/50 bg-amber-900/10', icon: AlertTriangle, color: 'text-amber-400' },
  INFO: { box: 'border-gray-800 bg-gray-900', icon: Info, color: 'text-sky-400' },
};

function Section({ title, icon: Icon, accent = 'text-brand-gold', right, children }: {
  title: string; icon: React.ElementType; accent?: string; right?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4 gap-3">
        <h3 className="font-bold text-white flex items-center gap-2"><Icon className={`w-5 h-5 ${accent}`} />{title}</h3>
        {right}
      </div>
      {children}
    </div>
  );
}

function Kpi({ icon: Icon, color, label, value, sub, loading }: {
  icon: React.ElementType; color: string; label: string; value: React.ReactNode; sub?: React.ReactNode; loading?: boolean;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs text-gray-500 uppercase">{label}</span>
      </div>
      {loading ? <div className="h-8 w-16 bg-gray-800 rounded animate-pulse" /> : <div className="text-2xl font-bold text-white">{value}</div>}
      {sub && !loading && <div className="text-[11px] text-gray-500 mt-1 leading-snug">{sub}</div>}
    </div>
  );
}

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  );
}

// ─── Composant principal ────────────────────────────────────────────────────
export function CompanyInsightsPanel({ insights, loading, error, onRetry, fallback }: {
  insights: CompanyInsightsData | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  /** Chiffres simples déjà connus (utilisés tant que le détail enrichi charge) */
  fallback: { users: number; employees: number; payrolls: number };
}) {
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const i = insights;
  const pay = i?.features.find((f) => f.key === 'payroll');
  const att = i?.features.find((f) => f.key === 'attendance');

  const adoptionCount = (a: string) => i?.features.filter((f) => f.adoption === a).length ?? 0;
  const maxEvents = Math.max(1, ...(i?.features.map((f) => f.events30d) ?? [1]));
  const features = i ? (showAllFeatures ? i.features : i.features.slice(0, 10)) : [];
  const maxMethod = Math.max(1, ...(i?.consumption?.attendanceMethods.map((m) => m.count) ?? [1]));

  return (
    <div className="space-y-6">
      {/* Erreur de chargement */}
      {error && (
        <div className="flex items-center gap-3 bg-red-900/20 border border-red-900/50 rounded-xl p-4 text-sm text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">Détails enrichis indisponibles : {error}</span>
          <button onClick={onRetry} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs">
            <RefreshCw className="w-3 h-3" /> Réessayer
          </button>
        </div>
      )}

      {/* ── KPIs ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <Kpi icon={Users} color="text-emerald-500" label="Personnel actif" loading={loading && !i}
          value={fmtN(i?.personnel?.activeHeadcount ?? fallback.employees)}
          sub={i?.personnel ? `sur ${fmtN(i.personnel.totalRecords)} fiches (dont ${fmtN(i.personnel.byStatus.TERMINATED)} sorties)` : undefined} />
        <Kpi icon={UserCheck} color="text-sky-500" label="Comptes actifs" loading={loading && !i}
          value={fmtN(i?.accounts?.active ?? fallback.users)}
          sub={i?.accounts ? `${fmtN(i.accounts.loggedIn30d)} connecté(s) sur 30 j` : undefined} />
        <Kpi icon={Briefcase} color="text-orange-500" label="Bulletins (30 j)" loading={loading && !i}
          value={fmtN(pay?.events30d ?? fallback.payrolls)}
          sub={pay ? `${fmtN(pay.eventsTotal)} au total · dernier ${ago(pay.lastUsedAt)}` : undefined} />
        <Kpi icon={Clock} color="text-purple-500" label="Pointages (30 j)" loading={loading && !i}
          value={fmtN(att?.events30d)}
          sub={att ? `dernier ${ago(att.lastUsedAt)}` : undefined} />
        <Kpi icon={Activity} color="text-pink-500" label="Requêtes (30 j)" loading={loading && !i}
          value={fmtN(i?.consumption?.requests30d)}
          sub={i?.consumption ? `≈ ${i.consumption.platformSharePct} % du trafic de la plateforme` : undefined} />
      </div>

      {!i && loading && (
        <div className="flex items-center justify-center py-10 text-gray-500 text-sm gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Analyse de l’entreprise en cours…
        </div>
      )}

      {i && (
        <>
          {/* ── Santé & signaux ─────────────────────────────────────────── */}
          <Section title="Santé & signaux" icon={ShieldCheck} accent="text-emerald-400"
            right={<span className="text-[11px] text-gray-500">Dernière activité : {ago(i.health.lastActivityAt)}</span>}>
            {i.health.signals.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-emerald-400">
                <CheckCircle2 className="w-4 h-4" /> Aucun point d’attention : l’entreprise utilise l’app normalement.
              </div>
            ) : (
              <div className="space-y-2">
                {i.health.signals.map((s, k) => {
                  const st = SIGNAL_STYLE[s.level];
                  return (
                    <div key={k} className={`flex items-start gap-3 border rounded-lg p-3 ${st.box}`}>
                      <st.icon className={`w-4 h-4 mt-0.5 shrink-0 ${st.color}`} />
                      <div>
                        <p className="text-sm font-semibold text-white">{s.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{s.detail}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>

          {/* ── Personnel ───────────────────────────────────────────────── */}
          {i.personnel && (
            <Section title="Personnel" icon={Users} accent="text-emerald-400"
              right={<span className="text-xs text-gray-500">{fmtN(i.personnel.withAccount)} employé(s) avec un compte</span>}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                {[
                  { l: 'Embauches (30 j)', v: i.personnel.hiredLast30d },
                  { l: 'Sorties (30 j)', v: i.personnel.leftLast30d },
                  { l: 'CDD à échéance (30 j)', v: i.personnel.cddEndingIn30d },
                  { l: 'En période d’essai', v: i.personnel.onTrial },
                ].map((c) => (
                  <div key={c.l} className="bg-gray-800/50 border border-gray-800 rounded-lg p-3">
                    <div className="text-lg font-bold text-white">{fmtN(c.v)}</div>
                    <div className="text-[10px] text-gray-500 uppercase leading-tight">{c.l}</div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-500 uppercase mb-2">Répartition par statut</p>
              <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-800 mb-2">
                {Object.entries(i.personnel.byStatus).filter(([, n]) => n > 0).map(([k, n]) => (
                  <div key={k} className={STATUS_META[k]?.bar ?? 'bg-gray-500'} style={{ width: `${(n / Math.max(1, i.personnel!.totalRecords)) * 100}%` }} title={`${STATUS_META[k]?.label ?? k} : ${n}`} />
                ))}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mb-5">
                {Object.entries(i.personnel.byStatus).filter(([, n]) => n > 0).map(([k, n]) => (
                  <span key={k} className="text-xs text-gray-400 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${STATUS_META[k]?.bar ?? 'bg-gray-500'}`} />{STATUS_META[k]?.label ?? k} <b className="text-white">{n}</b>
                  </span>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-2">Contrats (personnel actif)</p>
                  <div className="space-y-2">
                    {i.personnel.byContractType.length === 0 && <p className="text-xs text-gray-600">Aucun employé actif</p>}
                    {i.personnel.byContractType.map((c) => (
                      <div key={c.type}>
                        <div className="flex justify-between text-xs mb-1"><span className="text-gray-300">{c.type}</span><span className="text-white font-semibold">{c.count}</span></div>
                        <ProgressBar pct={(c.count / Math.max(1, i.personnel!.activeHeadcount)) * 100} color="bg-sky-500" />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-2">Départements (personnel actif)</p>
                  <div className="space-y-2">
                    {i.personnel.byDepartment.length === 0 && <p className="text-xs text-gray-600">Aucun département</p>}
                    {i.personnel.byDepartment.map((d) => (
                      <div key={d.name}>
                        <div className="flex justify-between text-xs mb-1"><span className="text-gray-300 truncate pr-2">{d.name}</span><span className="text-white font-semibold">{d.count}</span></div>
                        <ProgressBar pct={(d.count / Math.max(1, i.personnel!.activeHeadcount)) * 100} color="bg-purple-500" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {i.accounts && (
                <div className="mt-5 pt-4 border-t border-gray-800">
                  <p className="text-xs text-gray-500 uppercase mb-2">Comptes utilisateurs</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {i.accounts.byRole.map((r) => (
                      <span key={r.role} className="px-2.5 py-1 rounded-full bg-gray-800 border border-gray-700 text-gray-300">
                        {ROLE_LABELS[r.role] ?? r.role} <b className="text-white">{r.count}</b>
                      </span>
                    ))}
                    <span className="px-2.5 py-1 rounded-full bg-gray-800 border border-gray-700 text-gray-300">2FA activée <b className="text-white">{i.accounts.twoFactorEnabled}</b></span>
                    <span className={`px-2.5 py-1 rounded-full border ${i.accounts.neverLoggedIn ? 'bg-amber-900/20 border-amber-900/50 text-amber-300' : 'bg-gray-800 border-gray-700 text-gray-300'}`}>
                      Jamais connectés <b>{i.accounts.neverLoggedIn}</b>
                    </span>
                  </div>
                </div>
              )}
            </Section>
          )}

          {/* ── Fonctionnalités les plus utilisées ──────────────────────── */}
          <Section title="Fonctionnalités les plus utilisées (30 jours)" icon={TrendingUp} accent="text-orange-400"
            right={
              <span className="text-[11px] text-gray-500">
                {adoptionCount('active')} actives · {adoptionCount('dormant')} dormantes · {adoptionCount('unused')} jamais utilisées · {adoptionCount('locked')} hors plan
              </span>
            }>
            <div className="space-y-3">
              {features.map((f) => (
                <div key={f.key} className={f.adoption === 'locked' ? 'opacity-50' : ''}>
                  <div className="flex items-center justify-between gap-3 text-xs mb-1">
                    <span className="text-gray-200 font-medium flex items-center gap-2 min-w-0">
                      <span className="truncate">{f.label}</span>
                      {f.adoption === 'dormant' && <span className="px-1.5 py-0.5 rounded bg-amber-900/30 text-amber-300 text-[9px] font-bold">DORMANTE</span>}
                      {f.adoption === 'unused' && <span className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 text-[9px] font-bold">JAMAIS UTILISÉE</span>}
                      {f.adoption === 'locked' && <span className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-500 text-[9px] font-bold">HORS PLAN</span>}
                    </span>
                    <span className="text-gray-400 shrink-0">
                      <b className="text-white">{fmtN(f.events30d)}</b> {f.unit} · {f.sharePct} % · {f.lastUsedAt ? `dernier ${ago(f.lastUsedAt)}` : 'jamais'}
                    </span>
                  </div>
                  <ProgressBar pct={(f.events30d / maxEvents) * 100} color={f.adoption === 'active' ? 'bg-orange-500' : 'bg-gray-700'} />
                </div>
              ))}
            </div>
            {i.features.length > 10 && (
              <button onClick={() => setShowAllFeatures((v) => !v)} className="mt-4 text-xs text-sky-400 hover:text-sky-300">
                {showAllFeatures ? 'Voir moins' : `Voir les ${i.features.length} fonctionnalités`}
              </button>
            )}
          </Section>

          {/* ── Consommation ────────────────────────────────────────────── */}
          {i.consumption && (
            <Section title="Consommation" icon={Activity} accent="text-pink-400"
              right={<span className="text-[11px] text-gray-500">30 derniers jours</span>}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
                {[
                  { l: 'Requêtes (≈)', v: fmtN(i.consumption.requests30d), s: `${i.consumption.platformSharePct} % de la plateforme` },
                  { l: 'Temps actif', v: fmtMin(i.consumption.activeMinutes30d), s: `${i.consumption.distinctActiveUsers30d} utilisateur(s) distinct(s)` },
                  { l: 'Jours d’activité', v: `${i.consumption.activeDays30d}/30`, s: `≈ ${fmtN(i.consumption.avgRequestsPerActiveDay)} requêtes / jour actif` },
                ].map((c) => (
                  <div key={c.l} className="bg-gray-800/50 border border-gray-800 rounded-lg p-3">
                    <div className="text-lg font-bold text-white">{c.v}</div>
                    <div className="text-[10px] text-gray-500 uppercase">{c.l}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">{c.s}</div>
                  </div>
                ))}
              </div>

              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={i.consumption.daily}>
                    <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                    <XAxis dataKey="date" stroke="#6b7280" fontSize={10}
                      tickFormatter={(v: string) => `${v.slice(8, 10)}/${v.slice(5, 7)}`} />
                    <YAxis yAxisId="l" stroke="#6b7280" fontSize={10} />
                    <YAxis yAxisId="r" orientation="right" stroke="#6b7280" fontSize={10} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                      labelFormatter={(v) => new Date(String(v)).toLocaleDateString('fr-FR')} />
                    <Bar yAxisId="l" dataKey="requests" name="Requêtes" fill="#ec4899" radius={[3, 3, 0, 0]} />
                    <Line yAxisId="r" type="monotone" dataKey="activeUsers" name="Utilisateurs actifs" stroke="#38bdf8" dot={false} strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              {i.consumption.peakDay && (
                <p className="text-[11px] text-gray-500 mt-2">
                  Pic : {new Date(i.consumption.peakDay.date).toLocaleDateString('fr-FR')} ({fmtN(i.consumption.peakDay.requests)} requêtes).
                  Les requêtes sont comptées par le suivi d’activité : valeur approximative.
                </p>
              )}

              {i.consumption.attendanceMethods.length > 0 && (
                <div className="mt-5 pt-4 border-t border-gray-800">
                  <p className="text-xs text-gray-500 uppercase mb-2">Pointages par méthode (30 j)</p>
                  <div className="space-y-2">
                    {i.consumption.attendanceMethods.map((m) => (
                      <div key={m.method}>
                        <div className="flex justify-between text-xs mb-1"><span className="text-gray-300">{METHOD_LABELS[m.method] ?? m.method}</span><span className="text-white font-semibold">{fmtN(m.count)}</span></div>
                        <ProgressBar pct={(m.count / maxMethod) * 100} color="bg-purple-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Section>
          )}

          {/* ── Stockage ────────────────────────────────────────────────── */}
          {i.storage && (
            <Section title="Stockage & volume de données" icon={HardDrive} accent="text-blue-400">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-800/50 border border-gray-800 rounded-lg p-3">
                  <div className="text-lg font-bold text-white">{fmtBytes(i.storage.documentsBytes)}</div>
                  <div className="text-[10px] text-gray-500 uppercase">Documents ({fmtN(i.storage.documentsCount)} fichiers)</div>
                </div>
                <div className="bg-gray-800/50 border border-gray-800 rounded-lg p-3">
                  <div className="text-lg font-bold text-white">≈ {fmtBytes(i.storage.estimatedDbBytes)}</div>
                  <div className="text-[10px] text-gray-500 uppercase">Volume en base (estimation)</div>
                </div>
              </div>
              <div className="space-y-1.5">
                {i.storage.topTables.map((t) => (
                  <div key={t.table} className="flex items-center justify-between text-xs">
                    <span className="text-gray-300 flex items-center gap-1.5"><Database className="w-3 h-3 text-gray-600" />{t.label}</span>
                    <span className="text-gray-400">{fmtN(t.rows)} lignes · <b className="text-white">≈ {fmtBytes(t.estimatedBytes)}</b></span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-gray-600 mt-3">Estimation : lignes de l’entreprise × poids moyen d’une ligne de chaque table.</p>
            </Section>
          )}

          {/* ── Limites du plan ─────────────────────────────────────────── */}
          <Section title={`Limites du plan ${i.plan}`} icon={Layers} accent="text-sky-400">
            <div className="space-y-4">
              {i.limits.map((l) => (
                <div key={l.key}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-300">{l.label}</span>
                    <span className="text-gray-400">
                      <b className="text-white">{fmtN(l.used)}</b> {l.unit} / {l.max === null ? 'illimité' : `${fmtN(l.max)} ${l.unit}`}
                      {l.pct !== null && <span className={`ml-2 font-semibold ${l.pct >= 90 ? 'text-amber-400' : 'text-gray-500'}`}>{l.pct} %</span>}
                    </span>
                  </div>
                  <ProgressBar pct={l.pct ?? 8} color={barColor(l.pct)} />
                </div>
              ))}
            </div>
          </Section>

          {/* ── Configuration ───────────────────────────────────────────── */}
          {i.setup && (
            <Section title="Configuration de l’entreprise" icon={CheckCircle2} accent="text-emerald-400"
              right={<span className="text-sm font-bold text-white">{i.setup.scorePct} %</span>}>
              <div className="mb-4"><ProgressBar pct={i.setup.scorePct} color={i.setup.scorePct >= 80 ? 'bg-emerald-500' : i.setup.scorePct >= 50 ? 'bg-amber-500' : 'bg-red-500'} /></div>
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
                {i.setup.items.map((it) => (
                  <div key={it.key} className="flex items-center gap-2 text-xs">
                    {it.done ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <Circle className="w-3.5 h-3.5 text-gray-600 shrink-0" />}
                    <span className={it.done ? 'text-gray-300' : 'text-gray-500'}>{it.label}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* ── Paiements ───────────────────────────────────────────────── */}
          {i.payments && (
            <Section title="Paiements" icon={CreditCard} accent="text-brand-gold"
              right={<span className="text-[11px] text-gray-500">{i.payments.successfulCount} réussi(s) · {i.payments.failedLast30d} échec(s) sur 30 j</span>}>
              <div className="text-xs text-gray-500 uppercase">Total encaissé</div>
              <div className="text-xl font-bold text-brand-gold mb-4">{fmtN(i.payments.totalPaid)} FCFA</div>
              {i.payments.last.length === 0 ? (
                <p className="text-xs text-gray-600">Aucun paiement enregistré.</p>
              ) : (
                <div className="divide-y divide-gray-800">
                  {i.payments.last.map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-2 text-xs">
                      <span className="text-gray-400">{new Date(p.at).toLocaleDateString('fr-FR')} · {p.method ?? p.provider}</span>
                      <span className="flex items-center gap-3">
                        <b className="text-white">{fmtN(p.amount)} {p.currency}</b>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'SUCCEEDED' ? 'bg-emerald-900/30 text-emerald-400' : p.status === 'FAILED' ? 'bg-red-900/30 text-red-400' : 'bg-gray-800 text-gray-400'
                        }`}>{p.status === 'SUCCEEDED' ? 'Réussi' : p.status === 'FAILED' ? 'Échoué' : p.status}</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          )}
        </>
      )}
    </div>
  );
}