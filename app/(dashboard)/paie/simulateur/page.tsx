'use client';

/**
 * ─────────────────────────────────────────────────────────────
 * VERSION TEST — src/app/paie/simulateur/page.tsx
 * ─────────────────────────────────────────────────────────────
 * Simulateur LIBRE de bulletin de paie.
 * ✅ Aucun bulletin existant requis — tout est saisi manuellement.
 * ✅ Peut reproduire un bulletin déjà payé pour vérifier les calculs.
 * ✅ Affiche le bulletin détaillé complet côte à côte.
 * ✅ Jamais sauvegardé en BDD — simulation pure.
 * ─────────────────────────────────────────────────────────────
 * Route : /paie/simulateur
 * Ajouter dans le menu : lien vers /paie/simulateur (icône FlaskConical)
 * ─────────────────────────────────────────────────────────────
 */

import React, { useState, useCallback } from 'react';
import {
  FlaskConical, RefreshCw, Loader2, ChevronDown, ChevronUp,
  AlertCircle, CheckCircle2, ArrowLeft, Info, Copy, Check
} from 'lucide-react';
import { api } from '@/services/api';

// ─── Types ───────────────────────────────────────────────────
interface SimInput {
  // Identité (optionnel — pour comparaison avec bulletin réel)
  employeeName: string;
  month: number;
  year: number;
  // Rémunération
  baseSalary: number;
  workedDays: number;
  workDays: number;
  // Heures sup
  overtime10: number;
  overtime25: number;
  overtime50: number;
  overtime100: number;
  // Primes libres
  bonuses: { label: string; amount: number; isTaxable: boolean; isCnss: boolean }[];
  // Déductions libres (prêts, avances)
  deductions: { label: string; amount: number }[];
}

interface SimResult {
  // Rémunérations
  baseSalary: number;
  adjustedBaseSalary: number;
  absenceDeduction: number;
  totalOvertimeAmount: number;
  overtimeAmount10: number;
  overtimeAmount25: number;
  overtimeAmount50: number;
  overtimeAmount100: number;
  totalBonuses: number;
  grossSalary: number;
  // Cotisations
  cnssSalarial: number;
  cnssEmployer: number;
  its: number;
  tus: number;
  // Totaux
  totalDeductions: number;
  netSalary: number;
  totalEmployerCost: number;
  // Détails ITS
  irppDetails?: {
    rniMensuel: number;
    rniAnnuel: number;
    itsAnnuel: number;
    effectiveRate: number;
    abattement: number;
  };
}

// ─── Calcul FISCAL LOCAL (miroir exact du backend) ───────────
// Permet de simuler SANS appel API (mode hors-ligne)
function calcLocal(input: SimInput): SimResult {
  const { baseSalary, workedDays, workDays } = input;

  // 1. Absences
  const absenceDays      = Math.max(0, workDays - workedDays);
  const absenceDeduction = Math.floor((baseSalary / workDays) * absenceDays);
  const adjustedBase     = baseSalary - absenceDeduction;

  // 2. Heures sup (taux horaire = base ajustée / 173.33h)
  const hourly    = adjustedBase / 173.33;
  const ot10Amt   = Math.floor(input.overtime10  * hourly * 1.10);
  const ot25Amt   = Math.floor(input.overtime25  * hourly * 1.25);
  const ot50Amt   = Math.floor(input.overtime50  * hourly * 1.50);
  const ot100Amt  = Math.floor(input.overtime100 * hourly * 2.00);
  const totalOT   = ot10Amt + ot25Amt + ot50Amt + ot100Amt;

  // 3. Primes
  const totalBonuses = input.bonuses.reduce((s, b) => s + b.amount, 0);

  // 4. Brut
  const grossSalary = adjustedBase + totalOT + totalBonuses;

  // 5. CNSS salarié (4%, plafond 1 200 000)
  const cnssSalarial = Math.round(Math.min(grossSalary, 1_200_000) * 0.04);

  // 6. CNSS patronal (3 branches)
  const cnssPatronPension  = Math.round(Math.min(grossSalary, 1_200_000) * 0.08);
  const cnssPatronFamille  = Math.round(Math.min(grossSalary,   600_000) * 0.10);
  const cnssPatronAT       = Math.round(Math.min(grossSalary,   600_000) * 0.0225);
  const cnssEmployer       = cnssPatronPension + cnssPatronFamille + cnssPatronAT;

  // 7. TUS 2%
  const tus = Math.round(grossSalary * 0.02);

  // 8. ITS barème progressif 2026 — abattement 20%, pas de parts fiscales
  const brutImposable = grossSalary - cnssSalarial;
  const abattement    = Math.round(brutImposable * 0.20);
  const rniMensuel    = brutImposable - abattement;
  const rniAnnuel     = rniMensuel * 12;

  const brackets = [
    { min: 0,         max: 464_000,   rate: 0.01 },
    { min: 464_000,   max: 1_000_000, rate: 0.10 },
    { min: 1_000_000, max: 3_000_000, rate: 0.25 },
    { min: 3_000_000, max: Infinity,  rate: 0.40 },
  ];
  let itsAnnuel = 0;
  for (const b of brackets) {
    if (rniAnnuel <= b.min) break;
    itsAnnuel += (Math.min(rniAnnuel, b.max) - b.min) * b.rate;
  }
  const its = Math.ceil(itsAnnuel / 12);
  const effectiveRate = grossSalary > 0 ? +((its / grossSalary) * 100).toFixed(2) : 0;

  // 9. Autres déductions (prêts, avances)
  const otherDed = input.deductions.reduce((s, d) => s + d.amount, 0);

  // 10. Totaux
  const totalDeductions   = cnssSalarial + its + otherDed;
  const netSalary         = Math.floor(grossSalary - totalDeductions);
  const totalEmployerCost = grossSalary + cnssEmployer + tus;

  return {
    baseSalary, adjustedBaseSalary: adjustedBase, absenceDeduction,
    totalOvertimeAmount: totalOT,
    overtimeAmount10: ot10Amt, overtimeAmount25: ot25Amt,
    overtimeAmount50: ot50Amt, overtimeAmount100: ot100Amt,
    totalBonuses, grossSalary,
    cnssSalarial, cnssEmployer, its, tus,
    totalDeductions, netSalary, totalEmployerCost,
    irppDetails: { rniMensuel, rniAnnuel, itsAnnuel: Math.ceil(itsAnnuel), effectiveRate, abattement },
  };
}

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const fmt    = (v: number) => Math.round(v ?? 0).toLocaleString('fr-FR');
const now    = new Date();

const DEFAULT_INPUT: SimInput = {
  employeeName: '',
  month: now.getMonth() + 1,
  year:  now.getFullYear(),
  baseSalary: 500_000,
  workedDays: 26,
  workDays:   26,
  overtime10: 0, overtime25: 0, overtime50: 0, overtime100: 0,
  bonuses:    [],
  deductions: [],
};

// ─── Page ────────────────────────────────────────────────────
export default function SimulateurPage() {
  const [input, setInput]           = useState<SimInput>(DEFAULT_INPUT);
  const [result, setResult]         = useState<SimResult | null>(null);
  const [isLoading, setIsLoading]   = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied]         = useState(false);
  const [useAPI, setUseAPI]         = useState(false); // true = appel backend, false = calcul local

  const set = (field: keyof SimInput, value: any) =>
    setInput(prev => ({ ...prev, [field]: value }));

  // ── Simuler ──
  const simulate = useCallback(async () => {
    setIsLoading(true);
    setResult(null);
    try {
      if (useAPI) {
        // Appel backend (même moteur que la prod)
        const r = await api.post<SimResult>('/payrolls/simulate', {
          baseSalary:       input.baseSalary,
          workedDays:       input.workedDays,
          workDays:         input.workDays,
          month:            input.month,
          year:             input.year,
          overtimeHours10:  input.overtime10,
          overtimeHours25:  input.overtime25,
          overtimeHours50:  input.overtime50,
          overtimeHours100: input.overtime100,
          bonuses:          input.bonuses,
          deductions:       input.deductions,
        });
        setResult(r);
      } else {
        // Calcul local — identique au backend, instantané
        await new Promise(r => setTimeout(r, 300)); // petite pause UX
        setResult(calcLocal(input));
      }
    } catch (e: any) {
      alert(`Erreur simulation : ${e.message}`);
    } finally { setIsLoading(false); }
  }, [input, useAPI]);

  // ── Reset ──
  const reset = () => { setInput(DEFAULT_INPUT); setResult(null); };

  // ── Copier résultat ──
  const copyResult = () => {
    if (!result) return;
    const text = [
      `Simulation paie — ${input.employeeName || 'Employé'} — ${MONTHS[input.month - 1]} ${input.year}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `Salaire base    : ${fmt(input.baseSalary)} FCFA`,
      `Jours travaillés: ${input.workedDays}/${input.workDays}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `Salaire brut    : ${fmt(result.grossSalary)} FCFA`,
      `CNSS salarié    : −${fmt(result.cnssSalarial)} FCFA`,
      `ITS             : −${fmt(result.its)} FCFA`,
      `Net à payer     : ${fmt(result.netSalary)} FCFA`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `Coût employeur  : ${fmt(result.totalEmployerCost)} FCFA`,
    ].join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const absenceDays = Math.max(0, input.workDays - input.workedDays);
  const totalOT     = input.overtime10 + input.overtime25 + input.overtime50 + input.overtime100;

  return (
    <div className="max-w-5xl mx-auto px-4 pb-24 pt-2">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
          <FlaskConical size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Simulateur de Paie</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Testez librement — aucune donnée enregistrée en base
          </p>
        </div>
        {/* Toggle API vs Local */}
        <div className="ml-auto flex items-center gap-2 text-xs">
          <span className="text-gray-400">Mode :</span>
          <button
            onClick={() => setUseAPI(!useAPI)}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              useAPI
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}>
            {useAPI ? '🔌 API backend' : '⚡ Calcul local'}
          </button>
        </div>
      </div>

      {/* Notice mode */}
      <div className="mb-5 flex gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl">
        <Info size={14} className="text-purple-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-purple-700 dark:text-purple-300">
          {useAPI
            ? '🔌 Mode API : les calculs passent par le moteur backend (même résultat que les bulletins réels).'
            : '⚡ Mode local : calcul instantané dans le navigateur — identique au moteur backend Congo 2026. Fonctionne hors connexion.'}
          {' '}Utilisez ce simulateur pour <strong>vérifier des bulletins déjà payés</strong> et confirmer que les montants sont corrects.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ════════════════════════════════════
            COLONNE GAUCHE — FORMULAIRE
        ════════════════════════════════════ */}
        <div className="space-y-4">

          {/* Identité */}
          <Section title="Identification" color="#6366f1">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="label">Nom de l'employé (optionnel)</label>
                <input type="text" placeholder="Ex : Nathan Sogoya"
                  value={input.employeeName}
                  onChange={e => set('employeeName', e.target.value)}
                  className="input w-full" />
              </div>
              <div>
                <label className="label">Mois</label>
                <select value={input.month} onChange={e => set('month', Number(e.target.value))} className="input w-full">
                  {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Année</label>
                <input type="number" min={2020} max={2030} value={input.year}
                  onChange={e => set('year', Number(e.target.value))}
                  className="input w-full" />
              </div>
            </div>
          </Section>

          {/* Rémunération */}
          <Section title="Rémunération" color="#10b981">
            <div className="space-y-3">
              <div>
                <label className="label">Salaire de base (FCFA)</label>
                <div className="relative">
                  <input type="number" min={0} step={1000}
                    value={input.baseSalary}
                    onChange={e => set('baseSalary', Math.max(0, Number(e.target.value)))}
                    className="input w-full pr-14 text-right font-mono font-bold text-lg" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">FCFA</span>
                </div>
                {input.baseSalary < 70400 && input.baseSalary > 0 && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={11} /> Sous le SMIG (70 400 FCFA)
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Jours travaillés</label>
                  <input type="number" min={0} max={input.workDays}
                    value={input.workedDays}
                    onChange={e => set('workedDays', Math.min(input.workDays, Math.max(0, Number(e.target.value))))}
                    className="input w-full text-center font-bold text-xl" />
                </div>
                <div>
                  <label className="label">Jours ouvrables</label>
                  <input type="number" min={1} max={31}
                    value={input.workDays}
                    onChange={e => set('workDays', Math.max(1, Number(e.target.value)))}
                    className="input w-full text-center font-bold text-xl" />
                </div>
              </div>

              {/* Mini barre présence */}
              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, (input.workedDays / input.workDays) * 100)}%`,
                    background: absenceDays > 0 ? '#f97316' : '#10b981',
                  }} />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-emerald-600 font-bold">{input.workedDays}j présent</span>
                {absenceDays > 0 && <span className="text-orange-500 font-bold">−{absenceDays}j absent</span>}
              </div>
            </div>
          </Section>

          {/* Heures sup */}
          <Section title="Heures supplémentaires" color="#f97316" badge="Décret n°78-360">
            <div className="space-y-2">
              {[
                { label: '+10%',  sub: '5 premières heures',       field: 'overtime10'  as const },
                { label: '+25%',  sub: 'Heures suivantes',          field: 'overtime25'  as const },
                { label: '+50%',  sub: 'Nuit / repos / férié',      field: 'overtime50'  as const },
                { label: '+100%', sub: 'Nuit dimanche / fériés',    field: 'overtime100' as const },
              ].map(({ label, sub, field }) => (
                <div key={field} className="flex items-center gap-3 p-2.5 bg-gray-50 dark:bg-gray-700/40 rounded-xl">
                  <div className="w-12 text-center flex-shrink-0">
                    <span className="text-xs font-black text-orange-500">{label}</span>
                    <p className="text-[9px] text-gray-400 leading-tight">{sub}</p>
                  </div>
                  <input type="number" min={0} step={0.5}
                    value={input[field]}
                    onChange={e => set(field, Math.max(0, Number(e.target.value)))}
                    className="flex-1 input text-center font-bold" />
                  <span className="text-xs text-gray-400 flex-shrink-0">h</span>
                </div>
              ))}
            </div>
            {totalOT > 0 && (
              <p className="text-xs text-center font-bold text-orange-500 mt-2">
                Total : {totalOT.toFixed(1)}h supplémentaire{totalOT > 1 ? 's' : ''}
              </p>
            )}
          </Section>

          {/* Primes libres */}
          <Section title="Primes & Accessoires" color="#0891b2">
            <div className="space-y-2">
              {input.bonuses.map((b, i) => (
                <div key={i} className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-gray-700/40 rounded-xl">
                  <input type="text" placeholder="Libellé prime"
                    value={b.label}
                    onChange={e => {
                      const updated = [...input.bonuses];
                      updated[i] = { ...b, label: e.target.value };
                      set('bonuses', updated);
                    }}
                    className="input flex-1 text-sm min-w-0" />
                  <input type="number" min={0} step={500}
                    value={b.amount}
                    onChange={e => {
                      const updated = [...input.bonuses];
                      updated[i] = { ...b, amount: Math.max(0, Number(e.target.value)) };
                      set('bonuses', updated);
                    }}
                    className="input w-28 text-right font-mono font-bold text-sm flex-shrink-0" />
                  <span className="text-xs text-gray-400">F</span>
                  <button
                    onClick={() => set('bonuses', input.bonuses.filter((_, j) => j !== i))}
                    className="text-red-400 hover:text-red-600 text-lg font-bold leading-none flex-shrink-0">×</button>
                </div>
              ))}
              <button
                onClick={() => set('bonuses', [...input.bonuses, { label: '', amount: 0, isTaxable: true, isCnss: true }])}
                className="w-full py-2 border-2 border-dashed border-cyan-300 dark:border-cyan-700 text-cyan-600 dark:text-cyan-400 rounded-xl text-sm font-bold hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-colors">
                + Ajouter une prime
              </button>
            </div>
          </Section>

          {/* Retenues facultatives (prêts/avances) */}
          <Section title="Retenues facultatives" color="#7c3aed">
            <div className="space-y-2">
              {input.deductions.map((d, i) => (
                <div key={i} className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-gray-700/40 rounded-xl">
                  <input type="text" placeholder="Ex : Remboursement prêt"
                    value={d.label}
                    onChange={e => {
                      const updated = [...input.deductions];
                      updated[i] = { ...d, label: e.target.value };
                      set('deductions', updated);
                    }}
                    className="input flex-1 text-sm min-w-0" />
                  <input type="number" min={0} step={500}
                    value={d.amount}
                    onChange={e => {
                      const updated = [...input.deductions];
                      updated[i] = { ...d, amount: Math.max(0, Number(e.target.value)) };
                      set('deductions', updated);
                    }}
                    className="input w-28 text-right font-mono font-bold text-sm flex-shrink-0" />
                  <span className="text-xs text-gray-400">F</span>
                  <button
                    onClick={() => set('deductions', input.deductions.filter((_, j) => j !== i))}
                    className="text-red-400 hover:text-red-600 text-lg font-bold leading-none flex-shrink-0">×</button>
                </div>
              ))}
              <button
                onClick={() => set('deductions', [...input.deductions, { label: '', amount: 0 }])}
                className="w-full py-2 border-2 border-dashed border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 rounded-xl text-sm font-bold hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors">
                + Ajouter une retenue
              </button>
            </div>
          </Section>

          {/* Boutons */}
          <div className="flex gap-3 pt-1">
            <button onClick={reset}
              className="flex items-center gap-2 px-4 py-3 border border-gray-200 dark:border-gray-700 text-gray-500 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm">
              <RefreshCw size={14} /> Réinitialiser
            </button>
            <button onClick={simulate} disabled={isLoading}
              className="flex-1 py-3 text-white font-bold rounded-xl flex justify-center items-center gap-2 disabled:opacity-50 transition-all shadow-lg text-sm"
              style={{ background: isLoading ? '#9ca3af' : 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              {isLoading
                ? <><Loader2 className="animate-spin" size={16} /> Calcul…</>
                : <><FlaskConical size={16} /> Simuler</>}
            </button>
          </div>
        </div>

        {/* ════════════════════════════════════
            COLONNE DROITE — RÉSULTAT
        ════════════════════════════════════ */}
        <div className="space-y-4">
          {!result && (
            <div className="flex flex-col items-center justify-center h-64 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400">
              <FlaskConical size={40} className="mb-3 opacity-30" />
              <p className="font-bold text-sm">Remplissez le formulaire</p>
              <p className="text-xs">puis cliquez sur Simuler</p>
            </div>
          )}

          {result && (
            <>
              {/* Titre résultat + copier */}
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-500" />
                  Résultat — {input.employeeName || 'Simulation'}
                  <span className="text-gray-400 font-normal">{MONTHS[input.month - 1]} {input.year}</span>
                </h2>
                <button onClick={copyResult}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition-colors">
                  {copied ? <><Check size={12} className="text-emerald-500" /> Copié !</> : <><Copy size={12} /> Copier</>}
                </button>
              </div>

              {/* NET — mise en avant */}
              <div className="rounded-2xl overflow-hidden" style={{ background: '#111827' }}>
                <div className="px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-0.5">Net à Payer</p>
                    <p className="text-xs text-gray-500">
                      {input.employeeName || 'Simulation'} · {MONTHS[input.month - 1]} {input.year}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-black font-mono text-white" style={{ fontSize: 28 }}>
                      {fmt(result.netSalary)}
                    </span>
                    <span className="text-gray-400 ml-2 text-sm">FCFA</span>
                  </div>
                </div>
              </div>

              {/* Tableau détaillé */}
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Rémunérations */}
                <ResultSection label="Rémunérations" color="#15803d" rows={[
                  { label: 'Salaire de base',        val: fmt(result.baseSalary),            sign: '+', color: '#15803d' },
                  ...(result.absenceDeduction > 0 ? [
                    { label: `Déd. absences (${absenceDays}j)`, val: fmt(result.absenceDeduction), sign: '−', color: '#f97316' },
                    { label: 'Base ajustée',          val: fmt(result.adjustedBaseSalary),   sign: '=', color: '#0f172a' },
                  ] : []),
                  ...(result.totalOvertimeAmount > 0 ? [
                    { label: 'Heures supplémentaires', val: fmt(result.totalOvertimeAmount), sign: '+', color: '#d97706' },
                  ] : []),
                  ...(result.totalBonuses > 0 ? [
                    { label: 'Primes & accessoires',  val: fmt(result.totalBonuses),         sign: '+', color: '#0891b2' },
                  ] : []),
                ]} />

                {/* Total brut */}
                <div style={{ background: '#15803d' }} className="px-4 py-2.5 flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-widest text-white">Total Brut</span>
                  <span className="font-black font-mono text-white text-base">{fmt(result.grossSalary)} FCFA</span>
                </div>

                {/* Cotisations */}
                <ResultSection label="Cotisations Salariales" color="#b91c1c" rows={[
                  { label: `CNSS (4% × ${fmt(Math.min(result.grossSalary, 1_200_000))})`, val: fmt(result.cnssSalarial), sign: '−', color: '#b91c1c' },
                  { label: 'ITS — barème progressif 2026', val: fmt(result.its), sign: '−', color: '#b91c1c' },
                ]} />

                {/* Total retenues */}
                <div style={{ background: '#fef2f2', borderTop: '2px solid #fecaca' }} className="px-4 py-2 flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wide text-red-700">Total Retenues</span>
                  <span className="font-bold font-mono text-red-700">−{fmt(result.totalDeductions)} FCFA</span>
                </div>
              </div>

              {/* Détails ITS */}
              {result.irppDetails && (
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 transition-colors">
                  <span>Détail calcul ITS 2026</span>
                  {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              )}
              {showDetails && result.irppDetails && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl space-y-2 text-xs">
                  {[
                    ['Brut imposable (brut − CNSS)',   `${fmt(result.grossSalary - result.cnssSalarial)} FCFA`],
                    ['Abattement 20%',                 `−${fmt(result.irppDetails.abattement)} FCFA`],
                    ['RNI mensuel',                    `${fmt(result.irppDetails.rniMensuel)} FCFA`],
                    ['RNI annuel (×12)',                `${fmt(result.irppDetails.rniAnnuel)} FCFA`],
                    ['ITS annuel calculé',             `${fmt(result.irppDetails.itsAnnuel)} FCFA`],
                    ['ITS mensuel (÷12)',              `${fmt(result.its)} FCFA`],
                    ['Taux effectif',                  `${result.irppDetails.effectiveRate}%`],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">{label}</span>
                      <span className="font-mono font-bold text-gray-900 dark:text-white">{val}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Récapitulatif 2 colonnes */}
              <div className="grid grid-cols-2 gap-3">
                <MiniCard title="Salarié" color="#0369a1" rows={[
                  { label: 'CNSS 4%',    val: `${fmt(result.cnssSalarial)} F` },
                  { label: 'ITS',        val: `${fmt(result.its)} F` },
                  { label: 'Total ded.', val: `${fmt(result.totalDeductions)} F`, bold: true },
                ]} />
                <MiniCard title="Employeur" color="#7e22ce" rows={[
                  { label: 'Brut',      val: `${fmt(result.grossSalary)} F` },
                  { label: 'CNSS pat.', val: `${fmt(result.cnssEmployer)} F` },
                  { label: 'TUS 2%',    val: `${fmt(result.tus)} F` },
                  { label: 'Coût total',val: `${fmt(result.totalEmployerCost)} F`, bold: true },
                ]} />
              </div>

              {/* Comparaison si voulu */}
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl">
                <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-1">
                  💡 Pour comparer avec un bulletin réel payé
                </p>
                <p className="text-xs text-indigo-600 dark:text-indigo-400">
                  Saisissez exactement les mêmes valeurs (base, jours, primes) que le bulletin réel.
                  Les résultats doivent être identiques. Si différent → vérifiez les primes exonérées ou les paramètres CNSS.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* CSS inline pour réutilisation */}
      <style jsx>{`
        .input {
          padding: 10px 12px;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 13px;
          color: #0f172a;
          outline: none;
          transition: border-color .15s, box-shadow .15s;
          width: 100%;
        }
        .input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
        }
        .label {
          display: block;
          font-size: 10.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #94a3b8;
          margin-bottom: 6px;
        }
        @media (prefers-color-scheme: dark) {
          .input { background: #1e293b; border-color: #334155; color: #f1f5f9; }
        }
      `}</style>
    </div>
  );
}

// ── Sous-composants ──────────────────────────────────────────

function Section({
  title, color, badge, children,
}: { title: string; color: string; badge?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div style={{ background: color }} className="px-4 py-2.5 flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-widest text-white">{title}</span>
        {badge && <span className="text-[10px] text-white/70 font-mono">{badge}</span>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function ResultSection({ label, color, rows }: {
  label: string;
  color: string;
  rows: { label: string; val: string; sign: string; color: string }[];
}) {
  return (
    <>
      <div style={{ background: color }} className="px-4 py-1.5">
        <span className="text-[9.5px] font-black uppercase tracking-widest text-white">{label}</span>
      </div>
      {rows.map((r, i) => (
        <div key={i}
          className="flex justify-between items-center px-4 py-2"
          style={{ background: i % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
          <span style={{ fontSize: 11, color: '#475569' }}>{r.label}</span>
          <span style={{ fontSize: 11.5, fontFamily: 'monospace', fontWeight: 700, color: r.color }}>
            {r.sign}{r.val}
          </span>
        </div>
      ))}
    </>
  );
}

function MiniCard({ title, color, rows }: {
  title: string;
  color: string;
  rows: { label: string; val: string; bold?: boolean }[];
}) {
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
      <div style={{ background: color }} className="px-3 py-1.5">
        <span className="text-[9.5px] font-black uppercase tracking-widest text-white">{title}</span>
      </div>
      <div className="bg-white dark:bg-gray-800 p-3 space-y-1.5">
        {rows.map(r => (
          <div key={r.label} className={`flex justify-between text-[10.5px] ${r.bold ? 'pt-1.5 border-t border-gray-100 dark:border-gray-700' : ''}`}>
            <span className={r.bold ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}>{r.label}</span>
            <span className={`font-mono font-bold ${r.bold ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>{r.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}