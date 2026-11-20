'use client';

// ============================================================================
// 📁 app/admin/(protected)/parametres-legaux/page.tsx
// 🇨🇬 Paramètres légaux — barèmes ITS, CNSS, TUS, parts fiscales
// Le super administrateur publie une NOUVELLE VERSION avec une date d'application.
// Les versions passées ne sont jamais modifiées : c'est l'historique.
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import {
  Scale, Loader2, CheckCircle2, AlertTriangle, Plus, Trash2, History,
  Save, ChevronDown, ChevronRight, Info, ArrowRight,
} from 'lucide-react';
import { adminService } from '@/lib/services/adminService';

// ── Types (miroir du backend : legal-parameters.core.ts) ─────────────────────
type Bracket = { min: number; max: number | null; rate: number; fixed: number };
type LegalParams = {
  schemaVersion: 1;
  fiscal: {
    regimeLabel: string;
    abattementRate: number;
    brackets: { ITS_2026: Bracket[]; IRPP_LEGACY: Bracket[] };
    partsMode: 'FAMILY_QUOTIENT' | 'SINGLE_PART';
    maxParts: number;
    autoItsFromYear: number;
  };
  cnss: {
    salarialRate: number; pensionCeiling: number; socialCeiling: number;
    employerPensionRate: number; employerFamilyRate: number; employerAccidentRate: number;
  };
  tus: { dgiRate: number; cnssRate: number };
  leave?: { annualDays: number; maxCumulYears: number; minMonthsBeforeLeave: number; firstCycleDivisor: number; nextCycleDivisor: number };
};
type Version = {
  id: string; effectiveFrom: string; note: string | null;
  createdAt: string; createdByName: string | null; params: LegalParams;
};

// ── Formulaire : on saisit des POURCENTAGES, on envoie des ratios ────────────
type BracketRow = { max: string; ratePct: string; fixed: string }; // min déduit de la ligne précédente
type Form = {
  regimeLabel: string; abattementPct: string; partsMode: 'FAMILY_QUOTIENT' | 'SINGLE_PART';
  maxParts: string; autoItsFromYear: string;
  its: BracketRow[]; irpp: BracketRow[];
  salarialPct: string; pensionPct: string; familyPct: string; accidentPct: string;
  pensionCeiling: string; socialCeiling: string;
  tusDgiPct: string; tusCnssPct: string;
  firstDivisor: string; nextDivisor: string;
  annualDays: string; maxCumulYears: string; minMonths: string;
  effectiveFrom: string; note: string;
};

const pct = (r: number) => String(+(r * 100).toFixed(4));
const toRows = (b: Bracket[]): BracketRow[] =>
  b.map((x) => ({ max: x.max === null ? '' : String(x.max), ratePct: pct(x.rate), fixed: String(x.fixed) }));

function toForm(p: LegalParams, effectiveFrom: string): Form {
  return {
    regimeLabel: p.fiscal.regimeLabel, abattementPct: pct(p.fiscal.abattementRate),
    partsMode: p.fiscal.partsMode, maxParts: String(p.fiscal.maxParts), autoItsFromYear: String(p.fiscal.autoItsFromYear),
    its: toRows(p.fiscal.brackets.ITS_2026), irpp: toRows(p.fiscal.brackets.IRPP_LEGACY),
    salarialPct: pct(p.cnss.salarialRate), pensionPct: pct(p.cnss.employerPensionRate),
    familyPct: pct(p.cnss.employerFamilyRate), accidentPct: pct(p.cnss.employerAccidentRate),
    pensionCeiling: String(p.cnss.pensionCeiling), socialCeiling: String(p.cnss.socialCeiling),
    tusDgiPct: pct(p.tus.dgiRate), tusCnssPct: pct(p.tus.cnssRate),
    annualDays: String(p.leave?.annualDays ?? 26), maxCumulYears: String(p.leave?.maxCumulYears ?? 3), minMonths: String(p.leave?.minMonthsBeforeLeave ?? 12),
    firstDivisor: String(p.leave?.firstCycleDivisor ?? 12), nextDivisor: String(p.leave?.nextCycleDivisor ?? 12),
    effectiveFrom, note: '',
  };
}

const num = (s: string) => Number(String(s).replace(/\s/g, '').replace(',', '.'));
const ratio = (s: string) => +(num(s) / 100).toFixed(8);

function toBrackets(rows: BracketRow[]): Bracket[] {
  let prev = 0;
  return rows.map((r, i) => {
    const isLast = i === rows.length - 1;
    const max = isLast || r.max.trim() === '' ? null : num(r.max);
    const b: Bracket = { min: prev, max, rate: ratio(r.ratePct), fixed: num(r.fixed || '0') };
    prev = max ?? prev;
    return b;
  });
}

function toParams(f: Form): LegalParams {
  return {
    schemaVersion: 1,
    fiscal: {
      regimeLabel: f.regimeLabel.trim(), abattementRate: ratio(f.abattementPct),
      brackets: { ITS_2026: toBrackets(f.its), IRPP_LEGACY: toBrackets(f.irpp) },
      partsMode: f.partsMode, maxParts: num(f.maxParts), autoItsFromYear: Math.trunc(num(f.autoItsFromYear)),
    },
    cnss: {
      salarialRate: ratio(f.salarialPct), pensionCeiling: num(f.pensionCeiling), socialCeiling: num(f.socialCeiling),
      employerPensionRate: ratio(f.pensionPct), employerFamilyRate: ratio(f.familyPct), employerAccidentRate: ratio(f.accidentPct),
    },
    tus: { dgiRate: ratio(f.tusDgiPct), cnssRate: ratio(f.tusCnssPct) },
    leave: { annualDays: num(f.annualDays), maxCumulYears: Math.trunc(num(f.maxCumulYears)), minMonthsBeforeLeave: Math.trunc(num(f.minMonths)), firstCycleDivisor: Math.trunc(num(f.firstDivisor)), nextCycleDivisor: Math.trunc(num(f.nextDivisor)) },
  };
}

// ── Comparaison entre deux versions (liste des valeurs qui changent) ─────────
const fmtF = (n: number) => n.toLocaleString('fr-FR');
const fmtP = (r: number) => `${+(r * 100).toFixed(4)} %`.replace('.', ',');
function lines(p: LegalParams): Record<string, string> {
  const o: Record<string, string> = {
    'Nom de l’impôt': p.fiscal.regimeLabel,
    'Abattement': fmtP(p.fiscal.abattementRate),
    'Parts fiscales': p.fiscal.partsMode === 'SINGLE_PART' ? '1 part pour tous' : 'Selon la situation familiale',
    'Maximum de parts': String(p.fiscal.maxParts).replace('.', ','),
    'Bascule automatique vers l’ITS (année)': String(p.fiscal.autoItsFromYear),
    'CNSS salarié': fmtP(p.cnss.salarialRate),
    'CNSS patronale — retraite': fmtP(p.cnss.employerPensionRate),
    'CNSS patronale — famille': fmtP(p.cnss.employerFamilyRate),
    'CNSS patronale — accidents': fmtP(p.cnss.employerAccidentRate),
    'Plafond CNSS retraite': `${fmtF(p.cnss.pensionCeiling)} F`,
    'Plafond CNSS famille/accidents': `${fmtF(p.cnss.socialCeiling)} F`,
    'TUS — part État (DGI)': fmtP(p.tus.dgiRate),
    'TUS — part CNSS': fmtP(p.tus.cnssRate),
    'Congé — jours par an': String(p.leave?.annualDays ?? 26),
    'Congé — cumul maximum (années)': String(p.leave?.maxCumulYears ?? 3),
    'Congé — ancienneté minimale (mois)': String(p.leave?.minMonthsBeforeLeave ?? 12),
    'Congé — diviseur, ancienneté de 1 an (1er congé)': String(p.leave?.firstCycleDivisor ?? 12),
    'Congé — diviseur, plus d’un an d’ancienneté': String(p.leave?.nextCycleDivisor ?? 12),
  };
  const br = (name: string, b: Bracket[]) => b.forEach((t, i) => {
    o[`${name} — tranche ${i + 1}`] = `${fmtF(t.min)} → ${t.max === null ? '∞' : fmtF(t.max)} : ${t.fixed > 0 ? `${fmtF(t.fixed)} F fixe` : fmtP(t.rate)}`;
  });
  br('Barème ITS', p.fiscal.brackets.ITS_2026);
  br('Ancien barème IRPP', p.fiscal.brackets.IRPP_LEGACY);
  return o;
}
function diff(before: LegalParams | null, after: LegalParams) {
  const a = before ? lines(before) : {}; const b = lines(after);
  return Object.keys({ ...a, ...b }).filter((k) => a[k] !== b[k]).map((k) => ({ label: k, before: a[k] ?? '—', after: b[k] ?? '— (supprimée)' }));
}

// ── Petits composants ────────────────────────────────────────────────────────
const inputCls = 'w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500';
function Card({ title, children, hint }: { title: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-800"><p className="font-bold text-white text-sm">{title}</p>{hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}</div>
      <div className="p-5">{children}</div>
    </div>
  );
}
function Field({ label, suffix, children }: { label: string; suffix?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs text-gray-400 mb-1">{label}{suffix && <span className="text-gray-600"> ({suffix})</span>}</span>
      {children}
    </label>
  );
}

function BracketEditor({ rows, onChange }: { rows: BracketRow[]; onChange: (r: BracketRow[]) => void }) {
  const set = (i: number, k: keyof BracketRow, v: string) => onChange(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  let prev = 0;
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1fr_1fr_90px_110px_32px] gap-2 text-[11px] uppercase tracking-wide text-gray-500 px-1">
        <span>De (FCFA)</span><span>À (FCFA)</span><span>Taux %</span><span>Montant fixe</span><span />
      </div>
      {rows.map((r, i) => {
        const last = i === rows.length - 1;
        const from = prev; prev = last ? prev : num(r.max) || prev;
        return (
          <div key={i} className="grid grid-cols-[1fr_1fr_90px_110px_32px] gap-2 items-center">
            <div className="px-3 py-2 text-sm text-gray-400 bg-gray-950/50 border border-gray-800 rounded-lg">{fmtF(from)}</div>
            {last
              ? <div className="px-3 py-2 text-sm text-gray-400 bg-gray-950/50 border border-gray-800 rounded-lg">au-delà (∞)</div>
              : <input className={inputCls} inputMode="numeric" value={r.max} onChange={(e) => set(i, 'max', e.target.value)} />}
            <input className={inputCls} inputMode="decimal" value={r.ratePct} onChange={(e) => set(i, 'ratePct', e.target.value)} />
            <input className={inputCls} inputMode="numeric" value={r.fixed} onChange={(e) => set(i, 'fixed', e.target.value)} />
            <button type="button" title="Supprimer la tranche" disabled={rows.length <= 1}
              onClick={() => onChange(rows.filter((_, j) => j !== i))}
              className="text-gray-500 hover:text-red-400 disabled:opacity-30"><Trash2 size={15} /></button>
          </div>
        );
      })}
      <button type="button" onClick={() => {
        // nouvelle tranche insérée avant la dernière (la dernière reste « au-delà »)
        const copy = rows.slice(); const lastRow = copy.pop()!;
        const prevMax = copy.length ? num(copy[copy.length - 1].max) || 0 : 0;
        onChange([...copy, { max: String(prevMax + 1_000_000), ratePct: '0', fixed: '0' }, lastRow]);
      }} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 mt-1"><Plus size={13} /> Ajouter une tranche</button>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function ParametresLegauxPage() {
  const [data, setData] = useState<{ effectiveToday: LegalParams; versions: Version[]; currentVersionId: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ t: 'ok' | 'err'; s: string; errors?: string[] } | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [showLegacy, setShowLegacy] = useState(false);

  const load = async () => {
    const d = await adminService.get<any>('/admin/legal-parameters');
    setData(d);
    const nextJan = `${new Date().getFullYear() + 1}-01-01`;
    setForm(toForm(d.effectiveToday, nextJan));
  };
  useEffect(() => { load().catch(() => {}).finally(() => setLoading(false)); }, []);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));

  const changes = useMemo(() => (data && form ? diff(data.effectiveToday, toParams(form)) : []), [data, form]);

  const publish = async () => {
    if (!form) return;
    setSaving(true); setMsg(null);
    try {
      await adminService.post('/admin/legal-parameters', { effectiveFrom: form.effectiveFrom, params: toParams(form), note: form.note });
      await load();
      setMsg({ t: 'ok', s: `Version publiée : elle s’applique aux bulletins à partir du ${new Date(form.effectiveFrom).toLocaleDateString('fr-FR')}.` });
    } catch (e: any) {
      setMsg({ t: 'err', s: e.message || 'Erreur', errors: e?.errors });
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-24"><Loader2 size={28} className="animate-spin text-red-500" /></div>;
  if (!data || !form) return <p className="text-gray-400">Impossible de charger les paramètres légaux.</p>;

  const versionsAsc = [...data.versions].sort((a, b) => (a.effectiveFrom + a.createdAt).localeCompare(b.effectiveFrom + b.createdAt));

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3"><Scale className="text-red-500" size={24} /> Paramètres légaux</h1>
        <p className="text-gray-400 text-sm mt-0.5">Barèmes ITS, CNSS, TUS et parts fiscales — appliqués à toutes les entreprises, par date d’effet.</p>
      </div>

      <div className="flex gap-2 items-start bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-sm text-blue-200">
        <Info size={16} className="mt-0.5 shrink-0" />
        <p>Une publication n’écrase rien : elle ajoute une version qui s’applique <b>aux bulletins dont le mois est égal ou postérieur à la date choisie</b>.
          Les bulletins plus anciens se recalculent toujours avec les règles de leur époque. Une erreur se corrige en publiant une nouvelle version à la même date.</p>
      </div>

      {/* ── Nouvelle version ── */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2"><Plus size={18} className="text-red-500" /> Nouvelle version</h2>

        <Card title="Date d’application">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="S’applique à partir du"><input type="date" className={inputCls} value={form.effectiveFrom} onChange={(e) => set('effectiveFrom', e.target.value)} /></Field>
            <Field label="Motif (ex. Loi de finances 2027)"><input className={inputCls} value={form.note} onChange={(e) => set('note', e.target.value)} placeholder="Facultatif" /></Field>
          </div>
        </Card>

        <Card title="Impôt sur les traitements et salaires" hint="Les valeurs ci-dessous sont celles en vigueur aujourd’hui ; modifiez uniquement ce qui change.">
          <div className="grid sm:grid-cols-3 gap-4 mb-5">
            <Field label="Nom affiché"><input className={inputCls} value={form.regimeLabel} onChange={(e) => set('regimeLabel', e.target.value)} /></Field>
            <Field label="Abattement" suffix="%"><input className={inputCls} inputMode="decimal" value={form.abattementPct} onChange={(e) => set('abattementPct', e.target.value)} /></Field>
            <Field label="Bascule auto vers l’ITS" suffix="année"><input className={inputCls} inputMode="numeric" value={form.autoItsFromYear} onChange={(e) => set('autoItsFromYear', e.target.value)} /></Field>
            <Field label="Parts fiscales">
              <select className={inputCls} value={form.partsMode} onChange={(e) => set('partsMode', e.target.value as Form['partsMode'])}>
                <option value="FAMILY_QUOTIENT">Selon la situation familiale</option>
                <option value="SINGLE_PART">1 part pour tous</option>
              </select>
            </Field>
            <Field label="Maximum de parts"><input className={inputCls} inputMode="decimal" value={form.maxParts} onChange={(e) => set('maxParts', e.target.value)} /></Field>
          </div>
          <p className="text-sm font-semibold text-white mb-2">Barème {form.regimeLabel || 'ITS'} (annuel, par part)</p>
          <BracketEditor rows={form.its} onChange={(r) => set('its', r)} />
          <button type="button" onClick={() => setShowLegacy((v) => !v)} className="mt-5 flex items-center gap-1 text-xs text-gray-400 hover:text-white">
            {showLegacy ? <ChevronDown size={14} /> : <ChevronRight size={14} />} Ancien barème IRPP (bulletins avant la bascule)
          </button>
          {showLegacy && <div className="mt-3"><BracketEditor rows={form.irpp} onChange={(r) => set('irpp', r)} /></div>}
        </Card>

        <div className="grid md:grid-cols-2 gap-4">
          <Card title="CNSS">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Salarié" suffix="%"><input className={inputCls} inputMode="decimal" value={form.salarialPct} onChange={(e) => set('salarialPct', e.target.value)} /></Field>
              <Field label="Patronal retraite" suffix="%"><input className={inputCls} inputMode="decimal" value={form.pensionPct} onChange={(e) => set('pensionPct', e.target.value)} /></Field>
              <Field label="Patronal famille" suffix="%"><input className={inputCls} inputMode="decimal" value={form.familyPct} onChange={(e) => set('familyPct', e.target.value)} /></Field>
              <Field label="Patronal accidents" suffix="%"><input className={inputCls} inputMode="decimal" value={form.accidentPct} onChange={(e) => set('accidentPct', e.target.value)} /></Field>
              <Field label="Plafond retraite" suffix="FCFA/mois"><input className={inputCls} inputMode="numeric" value={form.pensionCeiling} onChange={(e) => set('pensionCeiling', e.target.value)} /></Field>
              <Field label="Plafond famille/accidents" suffix="FCFA/mois"><input className={inputCls} inputMode="numeric" value={form.socialCeiling} onChange={(e) => set('socialCeiling', e.target.value)} /></Field>
            </div>
          </Card>
          <Card title="TUS (taxe unique sur les salaires)">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Part État (DGI)" suffix="%"><input className={inputCls} inputMode="decimal" value={form.tusDgiPct} onChange={(e) => set('tusDgiPct', e.target.value)} /></Field>
              <Field label="Part CNSS" suffix="%"><input className={inputCls} inputMode="decimal" value={form.tusCnssPct} onChange={(e) => set('tusCnssPct', e.target.value)} /></Field>
            </div>
            <p className="text-xs text-gray-500 mt-3">Total : {fmtP(ratio(form.tusDgiPct) + ratio(form.tusCnssPct))} du brut.</p>
          </Card>
        </div>

        <Card title="Congé payé" hint="Règles légales. Les congés supplémentaires d’ancienneté prévus par chaque convention collective ne sont pas concernés (gérés par la convention). Diviseur : somme des bruts du cycle ÷ diviseur = base mensuelle (à confirmer avec votre expert : 11 ou 12).">
          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            <Field label="Jours de congé par an" suffix="jours ouvrables"><input className={inputCls} inputMode="decimal" value={form.annualDays} onChange={(e) => set('annualDays', e.target.value)} /></Field>
            <Field label="Cumul maximum sans congé" suffix="années"><input className={inputCls} inputMode="numeric" value={form.maxCumulYears} onChange={(e) => set('maxCumulYears', e.target.value)} /></Field>
            <Field label="Ancienneté avant le 1er congé" suffix="mois"><input className={inputCls} inputMode="numeric" value={form.minMonths} onChange={(e) => set('minMonths', e.target.value)} /></Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Employé à 1 an d’ancienneté (premier congé depuis l’embauche) — diviseur"><input className={inputCls} inputMode="numeric" value={form.firstDivisor} onChange={(e) => set('firstDivisor', e.target.value)} /></Field>
            <Field label="Employé de plus d’un an d’ancienneté (congés suivants) — diviseur"><input className={inputCls} inputMode="numeric" value={form.nextDivisor} onChange={(e) => set('nextDivisor', e.target.value)} /></Field>
          </div>
        </Card>

        <Card title={`Ce qui va changer (${changes.length})`} hint="Comparaison avec les valeurs en vigueur aujourd’hui.">
          {changes.length === 0
            ? <p className="text-sm text-gray-500">Aucun changement par rapport aux valeurs actuelles.</p>
            : <ul className="space-y-1.5">{changes.map((c) => (
                <li key={c.label} className="text-sm flex flex-wrap items-center gap-2">
                  <span className="text-gray-300">{c.label} :</span>
                  <span className="text-gray-500 line-through">{c.before}</span><ArrowRight size={13} className="text-gray-600" />
                  <span className="text-emerald-400 font-semibold">{c.after}</span>
                </li>))}</ul>}
        </Card>

        {msg && (
          <div className={`rounded-xl border p-4 text-sm flex gap-2 ${msg.t === 'ok' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
            {msg.t === 'ok' ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <AlertTriangle size={16} className="mt-0.5 shrink-0" />}
            <div><p>{msg.s}</p>{msg.errors && <ul className="list-disc pl-5 mt-1">{msg.errors.map((e) => <li key={e}>{e}</li>)}</ul>}</div>
          </div>
        )}

        <button onClick={publish} disabled={saving || changes.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-sm disabled:opacity-40 transition-colors">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Publier cette version
        </button>
      </div>

      {/* ── Historique ── */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-white flex items-center gap-2"><History size={18} className="text-red-500" /> Historique</h2>
        {data.versions.length === 0 && <p className="text-sm text-gray-500">Aucune version publiée : ce sont les valeurs d’origine (initiales) qui s’appliquent.</p>}
        {data.versions.map((v) => {
          const idx = versionsAsc.findIndex((x) => x.id === v.id);
          const before = idx > 0 ? versionsAsc[idx - 1].params : null;
          const d = diff(before, v.params);
          const isOpen = open === v.id;
          return (
            <div key={v.id} className="bg-gray-900 border border-gray-800 rounded-xl">
              <button onClick={() => setOpen(isOpen ? null : v.id)} className="w-full px-4 py-3 flex items-center gap-3 text-left">
                {isOpen ? <ChevronDown size={15} className="text-gray-500" /> : <ChevronRight size={15} className="text-gray-500" />}
                <span className="font-semibold text-white text-sm">À partir du {new Date(v.effectiveFrom).toLocaleDateString('fr-FR')}</span>
                {v.id === data.currentVersionId && <span className="text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">En vigueur</span>}
                <span className="text-xs text-gray-500 ml-auto">{v.note || 'Sans motif'} · {v.createdByName || '—'} · {new Date(v.createdAt).toLocaleDateString('fr-FR')}</span>
              </button>
              {isOpen && (
                <div className="px-4 pb-4 border-t border-gray-800 pt-3">
                  <p className="text-xs text-gray-500 mb-2">{before ? 'Changements par rapport à la version précédente :' : 'Première version publiée (comparée aux valeurs d’origine) :'}</p>
                  {d.length === 0 ? <p className="text-sm text-gray-500">Identique.</p> : (
                    <ul className="space-y-1">{d.map((c) => (
                      <li key={c.label} className="text-sm flex flex-wrap items-center gap-2">
                        <span className="text-gray-300">{c.label} :</span><span className="text-gray-500 line-through">{c.before}</span>
                        <ArrowRight size={13} className="text-gray-600" /><span className="text-emerald-400">{c.after}</span>
                      </li>))}</ul>)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}