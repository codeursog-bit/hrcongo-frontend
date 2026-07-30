'use client';
// ============================================================================
// 📁 app/outils/calcul-its-congo/ItsCalculatorClient.tsx
// Calculateur ITS 2026 + IRPP Legacy · avec décomposition tranches
// ============================================================================
import React, { useState, useMemo } from 'react';
import Link from 'next/link';

// ── Barèmes ──────────────────────────────────────────────────────────────────
const ITS_2026 = [
  { label: 'Tranche 1 (0 – 615 000)',         min: 0,         max: 615_000,  rate: 0,    fixed: 1_200 },
  { label: 'Tranche 2 (615 001 – 1 500 000)', min: 615_000,   max: 1_500_000,rate: 0.10, fixed: 0 },
  { label: 'Tranche 3 (1 500 001 – 3 500 000)',min: 1_500_000, max: 3_500_000,rate: 0.15, fixed: 0 },
  { label: 'Tranche 4 (3 500 001 – 5 000 000)',min: 3_500_000, max: 5_000_000,rate: 0.20, fixed: 0 },
  { label: 'Tranche 5 (au-delà de 5 000 000)', min: 5_000_000, max: Infinity, rate: 0.30, fixed: 0 },
];
const IRPP_LEGACY = [
  { label: 'Tranche 1 (0 – 464 000)',          min: 0,         max: 464_000,  rate: 0.01, fixed: 0 },
  { label: 'Tranche 2 (464 001 – 1 000 000)',  min: 464_000,   max: 1_000_000,rate: 0.10, fixed: 0 },
  { label: 'Tranche 3 (1 000 001 – 3 000 000)',min: 1_000_000, max: 3_000_000,rate: 0.25, fixed: 0 },
  { label: 'Tranche 4 (au-delà de 3 000 000)', min: 3_000_000, max: Infinity, rate: 0.40, fixed: 0 },
];

function calcFiscalParts(marital: string, children: number) {
  let p = marital === 'MARRIED' ? 2 : 1;
  if (marital !== 'MARRIED') {
    if (children >= 1) p += 1;
    if (children >= 2) p += (children - 1) * 0.5;
  } else {
    p += children * 0.5;
  }
  return Math.min(p, 6.5);
}

function applyBrackets(base: number, brackets: typeof ITS_2026) {
  let total = 0;
  const details: { label: string; taxable: number; rate: number; amount: number }[] = [];
  for (const b of brackets) {
    if (base <= b.min) break;
    const taxable = Math.min(base, b.max) - b.min;
    if (b.fixed > 0 && base > b.min) {
      total += b.fixed;
      details.push({ label: b.label, taxable: 0, rate: 0, amount: b.fixed });
    } else if (b.rate > 0) {
      const amount = Math.round(taxable * b.rate);
      total += amount;
      details.push({ label: b.label, taxable, rate: b.rate, amount });
    }
  }
  return { total, details };
}

function calcIts(gross: number, marital: string, children: number, mode: string, cnssRate = 0.04) {
  const cnss = Math.round(Math.min(gross, 1_200_000) * cnssRate);
  const base = gross - cnss;
  const abatt = Math.round(base * 0.20);
  const rni = base - abatt;
  const rniAnnuel = rni * 12;
  const parts = mode === 'ITS_2026' ? calcFiscalParts(marital, children) : calcFiscalParts(marital, children);
  const parPart = rniAnnuel / parts;
  const brackets = mode === 'IRPP_LEGACY' ? IRPP_LEGACY : ITS_2026;
  const { total: itsParPart, details } = applyBrackets(parPart, brackets);
  const itsAnnuel = itsParPart * parts;
  const its = Math.ceil(itsAnnuel / 12);
  const effectiveRate = base > 0 ? ((its / base) * 100).toFixed(2) : '0';
  return { cnss, base, abatt, rni, rniAnnuel, parts, parPart, itsParPart, itsAnnuel, its, effectiveRate, details };
}

const fmt = (v: number) => Math.round(v).toLocaleString('fr-FR');

export default function ItsCalculatorClient() {
  const [gross,    setGross]    = useState('');
  const [marital,  setMarital]  = useState('SINGLE');
  const [children, setChildren] = useState(0);
  const [mode,     setMode]     = useState<'ITS_2026' | 'IRPP_LEGACY'>('ITS_2026');
  const [showStep, setShowStep] = useState(false);

  const res = useMemo(() => {
    const g = Number(gross);
    if (!g || g < 1) return null;
    return calcIts(g, marital, children, mode);
  }, [gross, marital, children, mode]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* ── HERO ── */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950 text-white">
        <div className="max-w-4xl mx-auto px-4 pt-20 pb-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6">
            <Link href="/" className="hover:text-gray-300 transition-colors">Accueil</Link>
            <span>›</span>
            <Link href="/outils" className="hover:text-gray-300 transition-colors">Outils RH</Link>
            <span>›</span>
            <span className="text-gray-300">Calcul ITS 2026</span>
          </nav>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs text-indigo-300 mb-4">
            📊 Ordonnance n°2025-44 du 31 déc. 2025
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3">
            Calcul ITS Congo-Brazzaville<br />
            <span className="text-indigo-400">Barème 2026 officiel</span>
          </h1>
          <p className="text-gray-400 text-sm max-w-xl">
            Impôt sur les Traitements et Salaires : abattement 20%, barème progressif 5 tranches, quotient familial maintenu.
            Décomposition tranche par tranche.
          </p>
        </div>
      </div>

      {/* ── CONTENU ── */}
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">

        {/* Grille formulaire + résultat */}
        <div className="grid md:grid-cols-2 gap-6 items-start">

          {/* Formulaire */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">
            <h2 className="font-black text-base text-gray-900 dark:text-white">Paramètres</h2>

            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Salaire brut mensuel (FCFA)</label>
              <input type="number" value={gross} onChange={e => setGross(e.target.value)} placeholder="Ex : 500 000"
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-base font-black font-mono bg-white dark:bg-gray-700 outline-none focus:border-indigo-400 transition-colors" />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Régime fiscal</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { val: 'ITS_2026',    label: 'ITS 2026',    sub: 'Depuis janv. 2026',   color: 'indigo' },
                  { val: 'IRPP_LEGACY', label: 'IRPP Ancien', sub: 'Avant 2026',           color: 'amber'  },
                ].map(m => (
                  <button key={m.val} onClick={() => setMode(m.val as any)}
                    className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer
                      ${mode === m.val
                        ? m.color === 'indigo' ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : 'border-amber-400 bg-amber-50 dark:bg-amber-900/20'
                        : 'border-gray-200 dark:border-gray-600'}`}>
                    <p className={`text-xs font-black ${mode === m.val ? m.color === 'indigo' ? 'text-indigo-700 dark:text-indigo-300' : 'text-amber-700 dark:text-amber-300' : 'text-gray-600 dark:text-gray-400'}`}>{m.label}</p>
                    <p className="text-[10px] text-gray-400">{m.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Situation familiale</label>
              <select value={marital} onChange={e => setMarital(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 outline-none mb-3 cursor-pointer">
                <option value="SINGLE">Célibataire / Divorcé(e)</option>
                <option value="MARRIED">Marié(e)</option>
              </select>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 flex-1">Enfants à charge</span>
                <button onClick={() => setChildren(n => Math.max(0, n - 1))}
                  className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 flex items-center justify-center text-sm font-bold cursor-pointer">−</button>
                <span className="w-8 text-center font-black font-mono">{children}</span>
                <button onClick={() => setChildren(n => Math.min(10, n + 1))}
                  className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 flex items-center justify-center text-sm font-bold cursor-pointer">+</button>
              </div>
              {res && (
                <p className="text-[11px] text-indigo-500 mt-2 font-semibold">
                  → {res.parts.toFixed(1)} parts fiscales
                </p>
              )}
            </div>
          </div>

          {/* Résultat */}
          <div className="space-y-4">
            {!res ? (
              <div className="bg-gray-100 dark:bg-gray-800/50 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-12 text-center">
                <p className="text-3xl mb-3">📊</p>
                <p className="text-sm text-gray-400">Entrez un salaire brut pour calculer</p>
              </div>
            ) : (
              <>
                {/* ITS mensuel — headline */}
                <div className="bg-gray-900 dark:bg-black rounded-2xl p-6 text-white">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">ITS mensuel</p>
                  <p className="text-4xl font-black font-mono tracking-tight">
                    {fmt(res.its)} <span className="text-base font-normal text-gray-400">FCFA</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Taux effectif : <span className="font-bold text-indigo-400">{res.effectiveRate}%</span>
                    {' · '}{res.parts.toFixed(1)} parts fiscales
                    {' · '}{mode === 'ITS_2026' ? 'Barème ITS 2026' : 'IRPP legacy'}
                  </p>
                </div>

                {/* Récap calcul */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-indigo-50/50 dark:bg-indigo-900/10">
                    <button onClick={() => setShowStep(s => !s)}
                      className="w-full flex items-center justify-between cursor-pointer">
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Décomposition étape par étape</span>
                      <span className="text-gray-400 text-xs">{showStep ? '▲' : '▼'}</span>
                    </button>
                  </div>
                  {showStep && (
                    <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                      {[
                        { label: 'Salaire brut',                     value: `${fmt(Number(gross))} FCFA`,   color: 'text-emerald-600' },
                        { label: 'CNSS salarié (4%)',                 value: `− ${fmt(res.cnss)} FCFA`,      color: 'text-red-500' },
                        { label: 'Base imposable (brut − CNSS)',      value: `${fmt(res.base)} FCFA`,        color: '' },
                        { label: 'Abattement 20%',                    value: `− ${fmt(res.abatt)} FCFA`,     color: 'text-orange-500' },
                        { label: 'RNI mensuel',                       value: `${fmt(res.rni)} FCFA`,         color: '' },
                        { label: 'RNI annualisé (× 12)',              value: `${fmt(res.rniAnnuel)} FCFA`,   color: '' },
                        { label: `Divisé par ${res.parts.toFixed(1)} parts`, value: `${fmt(res.parPart)} FCFA / part`, color: 'text-indigo-600' },
                      ].map(r => (
                        <div key={r.label} className="flex items-center justify-between px-4 py-2.5">
                          <span className="text-xs text-gray-500">{r.label}</span>
                          <span className={`text-xs font-mono font-bold ${r.color || 'text-gray-700 dark:text-gray-200'}`}>{r.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Décomposition barème */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-indigo-50/50 dark:bg-indigo-900/10">
                    <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Barème par tranches</p>
                    <p className="text-[10px] text-gray-400">Sur la base de {fmt(res.parPart)} FCFA / part</p>
                  </div>
                  <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                    {res.details.map((d, i) => (
                      <div key={i} className="flex items-center justify-between px-4 py-2.5">
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-300">{d.label}</p>
                          {d.taxable > 0 && <p className="text-[10px] text-gray-400">{fmt(d.taxable)} × {(d.rate * 100).toFixed(0)}%</p>}
                          {d.amount > 0 && d.taxable === 0 && <p className="text-[10px] text-gray-400">Forfait minimum</p>}
                        </div>
                        <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">{fmt(d.amount)} F</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20">
                      <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">ITS / part × {res.parts.toFixed(1)} parts ÷ 12</span>
                      <span className="font-mono font-black text-indigo-700 dark:text-indigo-300">{fmt(res.its)} F/mois</span>
                    </div>
                  </div>
                </div>

                {/* CTA simulateur complet */}
                <Link href="/simulateur"
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl hover:from-violet-700 hover:to-indigo-700 transition-all group">
                  <div>
                    <p className="font-black text-sm">Calculer le salaire net complet</p>
                    <p className="text-xs text-violet-200">CNSS + ITS + TUS + CAMU + HS + Primes</p>
                  </div>
                  <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* ── BARÈME OFFICIEL ITS 2026 ── */}
        <section>
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4">
            Barème ITS 2026 — Congo-Brazzaville
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Le barème ITS 2026 est défini par l'Ordonnance n°2025-44 du 31 décembre 2025.
            Il remplace l'IRPP et s'applique sur le revenu annuel par part fiscale.
          </p>
          <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-indigo-50 dark:bg-indigo-900/20">
                <tr>
                  {['Tranche', 'Base annuelle / part', 'Taux', 'Impôt sur la tranche'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                {[
                  { t: '1', range: '0 – 615 000 FCFA',          taux: '0%',  note: 'Forfait fixe 1 200 FCFA/an' },
                  { t: '2', range: '615 001 – 1 500 000 FCFA',   taux: '10%', note: 'Max 88 500 FCFA' },
                  { t: '3', range: '1 500 001 – 3 500 000 FCFA', taux: '15%', note: 'Max 300 000 FCFA' },
                  { t: '4', range: '3 500 001 – 5 000 000 FCFA', taux: '20%', note: 'Max 300 000 FCFA' },
                  { t: '5', range: 'Au-delà de 5 000 000 FCFA',  taux: '30%', note: 'Pas de plafond' },
                ].map(r => (
                  <tr key={r.t} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                    <td className="px-4 py-3 font-bold text-indigo-600 dark:text-indigo-400">T{r.t}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-mono text-xs">{r.range}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-bold">{r.taux}</span></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-2">Source : Ordonnance n°2025-44 · PaySpace Congo Annual Amendments 2026</p>
        </section>

        {/* ── QUOTIENT FAMILIAL ── */}
        <section>
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4">
            Quotient familial ITS 2026 — Parts fiscales
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Le quotient familial réduit l'impôt en divisant le revenu imposable annuel par le nombre de parts.
            Il est <strong className="text-gray-700 dark:text-gray-200">maintenu en ITS 2026</strong> contrairement à ce qui était initialement annoncé.
          </p>
          <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-emerald-50 dark:bg-emerald-900/20">
                <tr>
                  {['Situation familiale', 'Parts fiscales'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                {[
                  { s: 'Célibataire / Divorcé(e) / Veuf(ve) sans enfant', p: '1 part' },
                  { s: 'Marié(e) sans enfant',                            p: '2 parts' },
                  { s: 'Marié(e) + 1 enfant',                            p: '2,5 parts' },
                  { s: 'Marié(e) + 2 enfants',                           p: '3 parts' },
                  { s: 'Célibataire + 1er enfant',                       p: '2 parts (+1)' },
                  { s: 'Célibataire + 2e enfant et suivants',            p: '+0,5 par enfant' },
                  { s: 'Plafond maximum',                                 p: '6,5 parts' },
                ].map(r => (
                  <tr key={r.s} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{r.s}</td>
                    <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">{r.p}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── CONTENU SEO LONG ── */}
        <section className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <h2 className="text-xl font-black text-gray-900 dark:text-white">
            Comment calculer l'ITS au Congo-Brazzaville en 2026 ?
          </h2>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-3">Formule de calcul ITS 2026</h3>
            <div className="space-y-2 text-xs font-mono bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
              <p className="text-gray-500">// Étape 1 : CNSS salariale</p>
              <p className="text-indigo-600 dark:text-indigo-400">CNSS = min(brut, 1 200 000) × 4%</p>
              <p className="text-gray-500 mt-2">// Étape 2 : Base imposable et abattement</p>
              <p className="text-indigo-600 dark:text-indigo-400">Base = brut − CNSS</p>
              <p className="text-indigo-600 dark:text-indigo-400">RNI mensuel = Base × 80%  (abattement 20%)</p>
              <p className="text-gray-500 mt-2">// Étape 3 : Annualisation + quotient familial</p>
              <p className="text-indigo-600 dark:text-indigo-400">RNI annuel = RNI mensuel × 12</p>
              <p className="text-indigo-600 dark:text-indigo-400">Base / part = RNI annuel ÷ parts fiscales</p>
              <p className="text-gray-500 mt-2">// Étape 4 : Barème progressif</p>
              <p className="text-indigo-600 dark:text-indigo-400">ITS annuel = barème(Base / part) × parts fiscales</p>
              <p className="text-gray-500 mt-2">// Étape 5 : Mensualisation (arrondi supérieur)</p>
              <p className="text-emerald-600 dark:text-emerald-400">ITS mensuel = ceil(ITS annuel ÷ 12)</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                title: 'Exemple 1 — Salaire 350 000 FCFA, célibataire',
                steps: [
                  'CNSS = 350 000 × 4% = 14 000 FCFA',
                  'Base = 350 000 − 14 000 = 336 000 FCFA',
                  'RNI mensuel = 336 000 × 80% = 268 800 FCFA',
                  'RNI annuel = 268 800 × 12 = 3 225 600 FCFA',
                  'Base/part = 3 225 600 ÷ 1 = 3 225 600 FCFA',
                  'T1 : 1 200 F, T2 : 88 500 F, T3 : (3 225 600−1 500 000)×15% = 258 840 F',
                  'ITS annuel = (1 200+88 500+258 840) × 1 = 348 540 F',
                  'ITS mensuel = ceil(348 540 ÷ 12) = 29 045 FCFA',
                ],
                color: 'indigo',
              },
              {
                title: 'Exemple 2 — Salaire 450 000 FCFA, marié 2 enfants',
                steps: [
                  'CNSS = 450 000 × 4% = 18 000 FCFA',
                  'Base = 450 000 − 18 000 = 432 000 FCFA',
                  'RNI mensuel = 432 000 × 80% = 345 600 FCFA',
                  'RNI annuel = 345 600 × 12 = 4 147 200 FCFA',
                  'Parts = 2 (marié) + 0,5×2 (enfants) = 3 parts',
                  'Base/part = 4 147 200 ÷ 3 = 1 382 400 FCFA',
                  'T1 : 1 200 F, T2 : (1 382 400−615 000)×10% = 76 740 F',
                  'ITS mensuel = ceil((1 200+76 740) × 3 ÷ 12) = 19 485 FCFA',
                ],
                color: 'emerald',
              },
            ].map(ex => (
              <div key={ex.title} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <h3 className={`font-bold text-sm mb-3 ${ex.color === 'indigo' ? 'text-indigo-700 dark:text-indigo-300' : 'text-emerald-700 dark:text-emerald-300'}`}>{ex.title}</h3>
                <ol className="space-y-1.5">
                  {ex.steps.map((s, i) => (
                    <li key={i} className="flex gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <span className={`font-bold shrink-0 ${ex.color === 'indigo' ? 'text-indigo-500' : 'text-emerald-500'}`}>{i + 1}.</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <p className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-1">⚠️ ITS 2026 vs IRPP — Ce qui change</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
              L'ITS 2026 remplace l'IRPP (Ordonnance n°2025-44). Le principal changement : la tranche 1 passe de 1% sur 0–464 000 FCFA à un <strong>forfait fixe de 1 200 FCFA/an</strong> dès que le revenu dépasse 615 000 FCFA. Les tranches supérieures sont significativement plus favorables (10/15/20/30% vs 1/10/25/40%).
              L'abattement de 20% est inchangé. Le quotient familial est maintenu contrairement aux premières annonces.
            </p>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section>
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4">Questions fréquentes — ITS Congo 2026</h2>
          <div className="space-y-3">
            {[
              { q: 'L\'ITS est-il prélevé à la source au Congo ?', a: 'Oui. L\'ITS est retenu à la source par l\'employeur chaque mois et reversé à la DGI. Le salarié reçoit son salaire net déjà défalqué de l\'ITS, de la CNSS et des autres retenues.' },
              { q: 'Quand l\'ITS est-il versé à la DGI Congo ?', a: 'L\'employeur doit reverser l\'ITS retenu avant le 15 du mois suivant. Le non-respect de ce délai expose à des majorations de retard.' },
              { q: 'Un expatrié est-il soumis à l\'ITS au Congo ?', a: 'Oui. Tout salarié qui travaille et réside légalement au Congo-Brazzaville est soumis à l\'ITS, qu\'il soit congolais ou étranger.' },
              { q: 'Peut-on simuler son ITS avant de négocier son salaire ?', a: 'Oui, c\'est même recommandé. Notre simulateur complet vous permet de calculer exactement votre net à partir d\'un brut donné, avec toutes les cotisations (CNSS, ITS, TUS, CAMU).' },
            ].map(({ q, a }) => (
              <details key={q} className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-bold text-sm text-gray-900 dark:text-white list-none">
                  {q}
                  <span className="text-gray-400 text-xs ml-3 group-open:rotate-180 transition-transform inline-block">▼</span>
                </summary>
                <div className="px-5 pb-4 pt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-gray-700">
                  {a}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* ── LIENS VERS AUTRES OUTILS ── */}
        <section>
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4">Autres calculs RH Congo</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { href: '/outils/calcul-cnss-congo',  icon: '🏥', label: 'Calcul CNSS' },
              { href: '/outils/calcul-camu-congo',  icon: '💊', label: 'Calcul CAMU' },
              { href: '/outils/calcul-tus-congo',   icon: '🏦', label: 'Calcul TUS' },
              { href: '/outils/calcul-heures-supplementaires-congo', icon: '⏰', label: 'Heures sup' },
            ].map(l => (
              <Link key={l.href} href={l.href}
                className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all text-sm font-bold text-gray-700 dark:text-gray-300">
                <span>{l.icon}</span>{l.label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}