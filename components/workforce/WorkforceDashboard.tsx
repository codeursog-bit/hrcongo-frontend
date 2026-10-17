'use client';

// ============================================================================
// 📁 components/workforce/WorkforceDashboard.tsx
// Tableau de bord effectifs — mêmes représentations et mêmes couleurs que les
// onglets « dashboard » des modèles :
//   • ORCA     (page Liste des employés)  : genre, contrat, nationalité, fonctions
//   • POWERMAN (portefeuille)             : départements, genre, catégories, contrats,
//                                           villes, fonctions, pyramide des âges, indicateurs
// Toutes les valeurs viennent du back (/workforce-dashboard) — la même source
// que l'Excel : l'écran et le fichier affichent les mêmes chiffres.
//
// Lisibilité en mode sombre : chaque barre affiche sa valeur (LabelList) et
// tous les textes utilisent les variables du thème (--text, --text-muted).
// ============================================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Download, Loader2, AlertCircle, Users, TrendingUp, Building2, Briefcase, Globe, PieChart as PieIcon, BarChart3,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList, PieChart, Pie, Legend,
  LineChart, Line,
} from 'recharts';
import { api } from '@/services/api';
import { FancySelect } from '@/components/ui/FancySelect';
import { WorkforcePeriodPicker } from './WorkforcePeriodPicker';
import { WorkforceExportDialog } from './WorkforceExportDialog';
import {
  CONTRACT_LABEL_ORCA, WfModel, WfPeriodState, WfScopeMode, WfView, defaultPeriod, endpointFor, monthsCount,
} from '@/lib/workforce';

// ─── Couleurs des modèles ────────────────────────────────────────────────────
const C = {
  navy: '#1F497D', magenta: '#FF33CC', teal: '#4BACC6', salmon: '#C0504D',
  orange: '#ED7D31', orangeDark: '#C55A11', purple: '#9900CC', blue: '#0070C0', kpi: '#28236B',
  multi: ['#4F81BD', '#C0504D', '#9BBB59', '#8064A2', '#4BACC6', '#F79646', '#2C4D75', '#772C2A', '#5F7530', '#4D3B62', '#276A7C', '#B65708'],
};

// ─── Briques de graphiques (valeurs toujours visibles, thème-aware) ───────────
const TT = {
  contentStyle: { backgroundColor: 'var(--surface)', color: 'var(--text)', borderRadius: 12, border: '1px solid var(--border)' },
  itemStyle: { color: 'var(--text)' },
  labelStyle: { color: 'var(--text)', fontWeight: 700 },
  cursor: { fill: 'var(--surface-2)' },
};
const TICK = { fontSize: 11, fill: 'var(--text)' };
const LBL = { fill: 'var(--text)', fontSize: 12, fontWeight: 700 } as const;

function Card({ title, icon, children, hint }: { title: string; icon?: React.ReactNode; hint?: string; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] shadow-sm">
      <h3 className="text-sm font-bold text-[var(--text)] mb-1 flex items-center gap-2">{icon}{title}</h3>
      {hint && <p className="text-xs text-[var(--text-muted)] mb-3">{hint}</p>}
      <div className={hint ? '' : 'mt-3'}>{children}</div>
    </div>
  );
}

function HBar({ data, color, colors, labelWidth = 150, rowH = 30 }: {
  data: { label: string; count: number }[]; color?: string; colors?: string[]; labelWidth?: number; rowH?: number;
}) {
  const h = Math.max(140, data.length * rowH + 20);
  return (
    <div style={{ height: Math.min(h, 640), overflowY: h > 640 ? 'auto' : 'visible' }}>
      <ResponsiveContainer width="100%" height={h}>
        <BarChart layout="vertical" data={data} margin={{ left: 4, right: 36, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis dataKey="label" type="category" width={labelWidth} axisLine={false} tickLine={false} tick={TICK} interval={0} />
          <Tooltip {...TT} />
          <Bar dataKey="count" name="Effectif" radius={[0, 6, 6, 0]}>
            {data.map((_, i) => <Cell key={i} fill={colors ? colors[i % colors.length] : color ?? C.teal} />)}
            <LabelList dataKey="count" position="right" {...LBL} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function VBar({ data, color, colors, height = 240, tickAngle = 0 }: {
  data: { label: string; count: number }[]; color?: string; colors?: string[]; height?: number; tickAngle?: number;
}) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 22, right: 8, left: -18, bottom: tickAngle ? 40 : 8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={TICK} interval={0} angle={tickAngle} textAnchor={tickAngle ? 'end' : 'middle'} height={tickAngle ? 70 : 30} />
          <YAxis axisLine={false} tickLine={false} tick={TICK} allowDecimals={false} />
          <Tooltip {...TT} />
          <Bar dataKey="count" name="Effectif" radius={[6, 6, 0, 0]}>
            {data.map((_, i) => <Cell key={i} fill={colors ? colors[i % colors.length] : color ?? C.teal} />)}
            <LabelList dataKey="count" position="top" {...LBL} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function Donut({ data, colors, height = 230 }: { data: { label: string; count: number }[]; colors: string[]; height?: number }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data} dataKey="count" nameKey="label" cx="50%" cy="50%" innerRadius={48} outerRadius={82} paddingAngle={2}
            label={({ value }: any) => value} labelLine={false} stroke="var(--surface)"
          >
            {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
          </Pie>
          <Tooltip {...TT} />
          <Legend formatter={(v: any) => <span style={{ color: 'var(--text)', fontSize: 12 }}>{v}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function Kpi({ title, value, sub, tone = 'dark' }: { title: string; value: string; sub?: string; tone?: 'dark' | 'light' }) {
  return tone === 'dark' ? (
    <div className="rounded-2xl p-5 text-center text-white shadow-sm" style={{ background: C.kpi }}>
      <p className="text-xs font-bold tracking-wider" style={{ fontFamily: 'Cambria, serif' }}>{title}</p>
      <p className="text-4xl font-extrabold mt-2" style={{ fontFamily: 'Cambria, serif' }}>{value}</p>
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

const pct = (x: number) => `${(x * 100).toFixed(2).replace('.', ',')} %`;

// ─── Composant principal ─────────────────────────────────────────────────────

interface Props {
  model: WfModel;
  scope: WfScopeMode;
  /** Mode PME : identifiant de l'entreprise ouverte (depuis l'URL). */
  companyId?: string;
  title?: string;
  /** Période initiale (défaut : mois en cours). */
  initialPeriod?: WfPeriodState;
}

export function WorkforceDashboard({ model, scope, companyId, title, initialPeriod }: Props) {
  const [period, setPeriod] = useState<WfPeriodState>(initialPeriod ?? defaultPeriod());
  const [companies, setCompanies] = useState<string>('ALL');
  const [view, setView] = useState<WfView | null>(null);
  const [allCompanies, setAllCompanies] = useState<{ id: string; name: string }[]>([]);
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
      const data = await api.get<WfView>(endpointFor(scope, 'view', model, period, { companies, companyId }));
      setView(data);
      if (scope === 'PORTFOLIO' && data.companies?.length) setAllCompanies(data.companies);
    } catch (e: any) {
      setError(e?.message || 'Impossible de charger le tableau de bord.');
      setView(null);
    } finally {
      setLoading(false);
    }
  }, [scope, model, period, companies, companyId, valid]);

  useEffect(() => { load(); }, [load]);

  const cur = view?.current;
  const ind = cur?.indicators;
  const cityLabel = (view?.city || view?.companyName || '').toUpperCase();

  const orca = useMemo(() => {
    if (!cur) return null;
    const N = cur.nationality;
    return {
      genre: [{ label: 'HOMMES', count: cur.gender.M }, { label: 'FEMMES', count: cur.gender.F }, ...(cur.gender.O ? [{ label: 'AUTRE', count: cur.gender.O }] : [])],
      contrat: [
        { label: CONTRACT_LABEL_ORCA.PERMANENT, count: cur.contract.PERMANENT },
        { label: CONTRACT_LABEL_ORCA.EXPATRIE, count: cur.contract.EXPATRIE },
        { label: CONTRACT_LABEL_ORCA.STAGIAIRE, count: cur.contract.STAGIAIRE },
        { label: CONTRACT_LABEL_ORCA.PRESTATAIRE, count: cur.contract.PRESTATAIRE },
        { label: 'TOTAL', count: cur.total },
      ],
      nat: [
        { label: 'NATIONAUX', count: N.nat }, { label: 'ETRANGERS', count: N.etr },
        { label: 'NATIONAUX HOMMES', count: N.natM }, { label: 'NATIONAUX FEMMES', count: N.natF },
        { label: 'ETRANGERS HOMMES', count: N.etrM }, { label: 'ETRANGERS FEMMES', count: N.etrF },
      ],
    };
  }, [cur]);

  const pyramid = useMemo(() => (cur?.ageBuckets ?? []).map((b) => ({ label: b.label, Hommes: b.M, Femmes: b.F })), [cur]);

  return (
    <section className="pt-8 mt-4 border-t border-[var(--border)] space-y-5">
      {/* En-tête + barre d'outils */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-emerald-500" />
            <h2 className="text-lg font-bold text-[var(--text)]">
              {title ?? (model === 'ORCA' ? 'Tableau de bord de suivi de l’effectif' : 'Tableau de bord — gestion des effectifs')}
            </h2>
          </div>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {view ? `${view.companyName} — ${view.period.label}` : 'Chargement…'}
            {view && n > 1 && <span> · situation affichée : fin {view.current.month.label.toLowerCase()}</span>}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          {scope === 'PORTFOLIO' && allCompanies.length > 0 && (
            <div className="w-64">
              <FancySelect
                label="Entreprises" value={companies} onChange={setCompanies}
                options={[{ value: 'ALL', label: `Toutes (${allCompanies.length})` }, ...allCompanies.map((c) => ({ value: c.id, label: c.name }))]}
              />
            </div>
          )}
          <button
            onClick={() => setDialog(true)}
            disabled={!view}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold flex items-center gap-2 disabled:opacity-60"
          >
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

      {view && cur && (
        <div className={`space-y-6 transition-opacity ${loading ? 'opacity-60' : ''}`}>
          {/* ───────────── MODÈLE ORCA ───────────── */}
          {model === 'ORCA' && orca && (
            <>
              <p className="text-2xl font-extrabold tracking-tight" style={{ color: C.blue }}>
                TOTAL EFFECTIF {cityLabel}: {cur.total}
              </p>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card title={`Effectif ${cityLabel} par genre`} icon={<Users size={15} className="text-emerald-500" />}
                  hint={`${cur.gender.M} homme${cur.gender.M > 1 ? 's' : ''} · ${cur.gender.F} femme${cur.gender.F > 1 ? 's' : ''}`}>
                  <VBar data={orca.genre} colors={[C.navy, C.magenta, '#94A3B8']} height={250} />
                </Card>
                <Card title={`Effectif ${cityLabel} par contrat`} icon={<Briefcase size={15} className="text-emerald-500" />}>
                  <VBar data={orca.contrat} color={C.teal} height={250} tickAngle={-20} />
                </Card>
                <Card title={`Effectif ${cityLabel} par nationalité`} icon={<Globe size={15} className="text-emerald-500" />}>
                  <VBar data={orca.nat} color={C.salmon} height={260} tickAngle={-25} />
                </Card>
                <Card title={`Effectif ${cityLabel} par fonction`} icon={<Building2 size={15} className="text-emerald-500" />}
                  hint={cur.functions.length > 1 ? `${cur.functions[0].label} en tête (${cur.functions[0].count})` : undefined}>
                  <HBar data={cur.functions} colors={C.multi} labelWidth={170} />
                </Card>
              </div>
            </>
          )}

          {/* ───────────── MODÈLE POWERMAN ───────────── */}
          {model === 'POWERMAN' && ind && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <Kpi title="EFFECTIF GÉNÉRAL" value={String(cur.total)} sub={`${cur.hires} entrée${cur.hires > 1 ? 's' : ''} · ${cur.departures} sortie${cur.departures > 1 ? 's' : ''} ce mois`} />
                <Kpi title="TAUX DE PRÉSENCE" value={ind.hasAttendance ? pct(ind.presenceRate) : 'n/d'} sub={ind.hasAttendance ? undefined : 'aucun pointage sur la période'} />
                <Kpi tone="light" title="TAUX D’ABSENTÉISME" value={ind.hasAttendance ? pct(ind.absenteeismRate) : 'n/d'} sub={ind.hasAttendance ? `${ind.absenceDays} j d’absence / ${ind.theoreticalDays} j à travailler` : undefined} />
                <Kpi tone="light" title="DURÉE MOY. DES ABSENCES" value={ind.hasAttendance ? `${ind.avgAbsenceDuration.toFixed(2).replace('.', ',')} j` : 'n/d'} sub={ind.hasAttendance ? `${ind.absenceCount} salarié${ind.absenceCount > 1 ? 's' : ''} concerné${ind.absenceCount > 1 ? 's' : ''}` : undefined} />
                <Kpi tone="light" title="TURN-OVER (ANNÉE)" value={pct(ind.turnover)} sub={`${ind.departuresYtd} départ${ind.departuresYtd > 1 ? 's' : ''} / effectif moyen ${ind.avgHeadcountYtd.toFixed(1).replace('.', ',')}`} />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card title="Effectif par département" icon={<Building2 size={15} className="text-emerald-500" />}>
                  <HBar data={cur.departments} color={C.orange} labelWidth={170} />
                </Card>
                <Card title="Répartition par genre" icon={<Users size={15} className="text-emerald-500" />}>
                  <Donut data={[{ label: 'HOMME', count: cur.gender.M }, { label: 'FEMME', count: cur.gender.F }]} colors={['#1F497D', C.purple]} />
                </Card>
                <Card title="Catégorie socio-professionnelle" icon={<Briefcase size={15} className="text-emerald-500" />}>
                  <VBar data={cur.csp} color="#1F497D" height={240} />
                </Card>
                <Card title="Type de contrat" icon={<Briefcase size={15} className="text-emerald-500" />}>
                  <VBar data={cur.contractPowerman} color={C.orangeDark} height={240} tickAngle={-15} />
                </Card>
                <Card title="Effectif par ville / village d’origine" icon={<PieIcon size={15} className="text-emerald-500" />}>
                  <Donut data={cur.cities} colors={C.multi} height={300} />
                </Card>
                <Card title="Effectif par fonction / poste" icon={<TrendingUp size={15} className="text-emerald-500" />}>
                  <HBar data={cur.functions} color={C.orange} labelWidth={170} />
                </Card>
                <Card title="Pyramide des âges" icon={<Users size={15} className="text-emerald-500" />} hint="Selon la date de naissance renseignée sur la fiche employé.">
                  <div style={{ height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={pyramid} margin={{ top: 22, right: 8, left: -18, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={TICK} interval={0} angle={-25} textAnchor="end" height={60} />
                        <YAxis axisLine={false} tickLine={false} tick={TICK} allowDecimals={false} />
                        <Tooltip {...TT} />
                        <Legend formatter={(v: any) => <span style={{ color: 'var(--text)', fontSize: 12 }}>{v}</span>} />
                        <Bar dataKey="Hommes" fill="#1F497D" radius={[4, 4, 0, 0]}><LabelList dataKey="Hommes" position="top" {...LBL} /></Bar>
                        <Bar dataKey="Femmes" fill={C.purple} radius={[4, 4, 0, 0]}><LabelList dataKey="Femmes" position="top" {...LBL} /></Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
            </>
          )}

          {/* ───────────── Évolution (plage / année) ───────────── */}
          {view.evolution.length > 1 && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Card title="Évolution de l’effectif total" icon={<TrendingUp size={15} className="text-emerald-500" />}>
                <div style={{ height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={view.evolution} margin={{ top: 22, right: 16, left: -10, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis dataKey="short" axisLine={false} tickLine={false} tick={TICK} />
                      <YAxis axisLine={false} tickLine={false} tick={TICK} allowDecimals={false} domain={['dataMin - 5', 'dataMax + 5']} />
                      <Tooltip {...TT} />
                      <Line type="monotone" dataKey="total" name="Effectif" stroke={model === 'ORCA' ? C.blue : C.orange} strokeWidth={3} dot={{ r: 4 }}>
                        <LabelList dataKey="total" position="top" {...LBL} />
                      </Line>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
              <Card title="Entrées et sorties par mois" icon={<Users size={15} className="text-emerald-500" />}>
                <div style={{ height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={view.evolution} margin={{ top: 22, right: 8, left: -18, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis dataKey="short" axisLine={false} tickLine={false} tick={TICK} />
                      <YAxis axisLine={false} tickLine={false} tick={TICK} allowDecimals={false} />
                      <Tooltip {...TT} />
                      <Legend formatter={(v: any) => <span style={{ color: 'var(--text)', fontSize: 12 }}>{v}</span>} />
                      <Bar dataKey="hires" name="Entrées" fill="#10B981" radius={[4, 4, 0, 0]}><LabelList dataKey="hires" position="top" {...LBL} /></Bar>
                      <Bar dataKey="departures" name="Sorties" fill="#F59E0B" radius={[4, 4, 0, 0]}><LabelList dataKey="departures" position="top" {...LBL} /></Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      <WorkforceExportDialog
        open={dialog}
        onClose={() => setDialog(false)}
        model={model}
        scope={scope}
        initialPeriod={period}
        companyId={companyId}
        companies={allCompanies}
        initialCompanies={companies}
        companyLabel={view?.companyName ?? 'Entreprise'}
      />
    </section>
  );
}