'use client';
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';

const PLAFOND_CLASSIQUE = 600_000;
const TAUX_SAL_CLASSIC = 0.0227;
const TAUX_PAT_CLASSIC = 0.0455;

const SEUIL_SOL = 500_000;
const TAUX_SOL = 0.005; // 0.5%

const fmt = (v: number) => Math.round(v).toLocaleString('fr-FR');

export default function CamuCalculatorClient() {
  const [gross, setGross] = useState('');
  const [mode, setMode] = useState<'classique' | 'solidarite'>('solidarite');

  const resClassic = useMemo(() => {
    const g = Number(gross);
    if (!g || g < 1) return null;
    const base = Math.min(g, PLAFOND_CLASSIQUE);
    return {
      base, g,
      sal: Math.round(base * TAUX_SAL_CLASSIC),
      pat: Math.round(base * TAUX_PAT_CLASSIC),
      plafonné: g > PLAFOND_CLASSIQUE,
    };
  }, [gross]);

  const resSolidarite = useMemo(() => {
    const g = Number(gross);
    if (!g || g < 1) return null;
    const cnssSal = Math.min(g, 1_200_000) * 0.04;
    const baseImposable = g - cnssSal;
    const excédent = Math.max(0, baseImposable - SEUIL_SOL);
    return {
      g,
      cnssSal,
      baseImposable,
      excédent,
      montant: Math.round(excédent * TAUX_SOL),
      applicable: baseImposable > SEUIL_SOL,
    };
  }, [gross]);

  return (
    <div className="min-h-screen bg-[#050607]">
      <Navbar />
      <div className="fixed -right-40 -top-40 w-[600px] h-[600px] bg-white/[0.04] rounded-full blur-[130px] pointer-events-none" />
      <div className="fixed -left-40 bottom-0 w-[500px] h-[500px] bg-[#D4A548]/[0.06] rounded-full blur-[130px] pointer-events-none" />
      
      {/* En-tête optimisé SEO (H1 fort) */}
      <header className="bg-gradient-to-br from-gray-900 to-rose-950 text-white">
        <div className="max-w-4xl mx-auto px-4 pt-20 pb-10">
          <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6" aria-label="Fil d'Ariane">
            <Link href="/" className="hover:text-gray-300">Accueil</Link><span>›</span>
            <Link href="/outils" className="hover:text-gray-300">Outils RH</Link><span>›</span>
            <span className="text-gray-300">Calcul CAMU Congo</span>
          </nav>
          <span className="inline-block px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full text-xs text-rose-300 mb-4">
            💊 Conformité Paie Congo 2026 — Lois n°37-2014 & n°12-2023
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3">
            Simulateur CAMU Congo-Brazzaville :<br />
            <span className="text-rose-400">Calculer la Cotisation et la Solidarité sur Salaire</span>
          </h1>
          <p className="text-gray-400 text-sm max-w-2xl leading-relaxed">
            Outil de calcul gratuit et officiel pour les professionnels RH, comptables et salariés au Congo. Simulez en un clic la CAMU classique (salarié et employeur) et la CAMU solidarité sur l'excédent imposable.
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-12">

        {/* Sélecteur de mode */}
        <div className="flex rounded-2xl bg-gray-800 p-1.5 border border-gray-700 max-w-md mx-auto shadow-xl">
          <button
            onClick={() => setMode('solidarite')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${mode === 'solidarite' ? 'bg-rose-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
            🤝 CAMU Solidarité (0,5%)
          </button>
          <button
            onClick={() => setMode('classique')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${mode === 'classique' ? 'bg-rose-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
            🏥 CAMU Classique (2,27% / 4,55%)
          </button>
        </div>

        {/* Explication contextuelle orientée intention de recherche */}
        {mode === 'solidarite' ? (
          <article className="rounded-2xl border p-6 bg-gray-800 border-gray-700">
            <h2 className="font-black text-lg mb-3 text-white">🤝 Comprendre le calcul de la CAMU Solidarité au Congo</h2>
            <p className="text-sm leading-relaxed mb-4 text-gray-400">
              Instaurée pour renforcer l'équité du système de santé, la <strong className="text-gray-200">CAMU solidarité</strong> est un prélèvement additionnel prélevé sur les revenus des salariés. Elle s'active dès lors que la base imposable mensuelle (après déduction de la part salariale CNSS) franchit le seuil de <strong className="text-gray-200">500 000 FCFA</strong>. Le taux de <strong className="text-rose-400">0,5%</strong> s'applique exclusivement sur la tranche excédentaire.
            </p>
            <div className="p-3 border rounded-xl bg-amber-900/20 border-amber-800">
              <p className="text-xs text-amber-400">
                <strong>Formule paie :</strong> <code className="bg-gray-900 px-1.5 py-0.5 rounded font-mono">(Salaire Imposable − 500 000) × 0,5%</code>. Si la base est inférieure ou égale à 500 000 FCFA, la cotisation est nulle (0 F).
              </p>
            </div>
          </article>
        ) : (
          <article className="rounded-2xl border p-6 bg-gray-800 border-gray-700">
            <h2 className="font-black text-lg mb-3 text-white">💊 Tout savoir sur la CAMU Classique et Conventionnelle</h2>
            <p className="text-sm leading-relaxed mb-4 text-gray-400">
              La couverture maladie universelle standard implique une double contribution obligatoire sur les bulletins de paie congolais : <strong className="text-gray-200">2,27% à la charge du salarié</strong> et <strong className="text-gray-200">4,55% à la charge de l'employeur</strong>. Ces taux sont strictement plafonnés sur une assiette maximale de <strong className="text-gray-200">600 000 FCFA</strong>.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border text-center bg-rose-900/20 border-rose-900">
                <p className="text-3xl font-black mb-1 text-rose-400">2,27%</p>
                <p className="text-xs font-bold text-rose-300">Quote-part Salarié</p>
              </div>
              <div className="p-4 rounded-xl border text-center bg-orange-900/20 border-orange-900">
                <p className="text-3xl font-black mb-1 text-orange-400">4,55%</p>
                <p className="text-xs font-bold text-orange-300">Quote-part Employeur</p>
              </div>
            </div>
          </article>
        )}

        {/* Zone de test interactive */}
        <section className="grid md:grid-cols-2 gap-6 items-start">
          <div className="rounded-2xl border p-6 bg-gray-800 border-gray-700 shadow-lg">
            <h2 className="font-black text-base mb-2 text-white">Simulateur en ligne</h2>
            <p className="text-xs text-gray-400 mb-4">Saisissez le salaire brut mensuel de l'employé :</p>
            <label htmlFor="gross-salary" className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Salaire Brut (FCFA)</label>
            <input 
              id="gross-salary"
              type="number" 
              value={gross} 
              onChange={e => setGross(e.target.value)} 
              placeholder="Ex : 750 000"
              className="w-full px-4 py-3 border-2 rounded-xl text-lg font-black font-mono outline-none focus:border-rose-400 transition-colors border-gray-600 bg-gray-700 text-white" 
            />
          </div>

          {/* Affichage dynamique des résultats */}
          {mode === 'solidarite' ? (
            !resSolidarite ? (
              <div className="border border-dashed rounded-2xl p-12 text-center bg-gray-800/50 border-gray-700 flex flex-col items-center justify-center">
                <span className="text-3xl mb-3">🤝</span>
                <p className="text-sm text-gray-400">Renseignez un montant brut pour voir le détail de la CAMU solidarité</p>
              </div>
            ) : (
              <div className="rounded-2xl border overflow-hidden bg-gray-800 border-rose-800 shadow-xl">
                <div className="px-4 py-3 border-b bg-rose-900/20 border-rose-900">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-rose-300">Détail du calcul — Solidarité</p>
                  <p className="text-[10px] text-gray-400">Base imposable de référence : {fmt(resSolidarite.baseImposable)} FCFA</p>
                </div>
                <div className="p-4 space-y-3 text-sm">
                  <div className="flex justify-between py-1 border-b border-gray-700 text-gray-300">
                    <span>Salaire Brut de base</span>
                    <span className="font-mono font-bold">{fmt(resSolidarite.g)} F</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-700 text-gray-300">
                    <span>Abattement CNSS salariale (4%)</span>
                    <span className="font-mono text-red-400">−{fmt(resSolidarite.cnssSal)} F</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-700 text-gray-300">
                    <span>Seuil d'exonération</span>
                    <span className="font-mono text-gray-400">500 000 F</span>
                  </div>
                  <div className="flex justify-between py-1 text-gray-300">
                    <span>Tranche soumise à cotisation</span>
                    <span className="font-mono font-bold text-white">{fmt(resSolidarite.excédent)} F</span>
                  </div>
                </div>
                <div className="px-4 py-3 border-t flex justify-between items-center bg-gray-900 border-gray-700">
                  <span className="text-xs font-bold text-gray-300">Montant CAMU Solidarité (0,5%)</span>
                  <span className="font-black font-mono text-rose-400 text-base">{fmt(resSolidarite.montant)} FCFA</span>
                </div>
              </div>
            )
          ) : (
            !resClassic ? (
              <div className="border border-dashed rounded-2xl p-12 text-center bg-gray-800/50 border-gray-700 flex flex-col items-center justify-center">
                <span className="text-3xl mb-3">💊</span>
                <p className="text-sm text-gray-400">Renseignez un montant brut pour calculer la part classique</p>
              </div>
            ) : (
              <div className="rounded-2xl border overflow-hidden bg-gray-800 border-rose-800 shadow-xl">
                <div className="px-4 py-3 border-b bg-rose-900/20 border-rose-900">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-rose-300">Détail du calcul — Classique</p>
                  <p className="text-[10px] text-gray-400">Assiette de calcul : {fmt(resClassic.base)} FCFA {resClassic.plafonné ? '(Plafonné à 600k)' : ''}</p>
                </div>
                <div className="p-4 space-y-3 text-sm">
                  <div className="flex justify-between py-1 border-b border-gray-700 text-gray-300">
                    <span>Retenue Salarié (2,27%)</span>
                    <span className="font-mono text-red-400">−{fmt(resClassic.sal)} F</span>
                  </div>
                  <div className="flex justify-between py-1 text-gray-300">
                    <span>Charge Employeur (4,55%)</span>
                    <span className="font-mono text-orange-400">+{fmt(resClassic.pat)} F</span>
                  </div>
                </div>
                <div className="px-4 py-3 border-t flex justify-between items-center bg-gray-900 border-gray-700">
                  <span className="text-xs font-bold text-gray-300">Total cotisations versées</span>
                  <span className="font-black font-mono text-white text-base">{fmt(resClassic.sal + resClassic.pat)} FCFA</span>
                </div>
              </div>
            )
          )}
        </section>

        {/* Section FAQ SEO enrichie (Structure Schema FAQ intégrée côté page parente) */}
        <section className="space-y-4">
          <h2 className="text-xl font-black text-white">Questions fréquentes & Expertises Paie (Congo-Brazzaville)</h2>
          <div className="space-y-3">
            {[
              { 
                q: 'Quelle est la différence exacte entre la CAMU solidarité et la CAMU classique ?', 
                a: 'La CAMU classique est une cotisation proportionnelle obligatoire (2,27% salarial et 4,55% patronal) plafonnée à 600 000 FCFA de salaire brut. À l’inverse, la CAMU solidarité est un prélèvement additionnel de 0,5% qui cible uniquement la fraction du salaire imposable dépassant le seuil de 500 000 FCFA.' 
              },
              { 
                q: 'Comment automatiser le calcul de la CAMU solidarité sur un bulletin de paie ?', 
                a: 'Pour l’intégrer dans un logiciel de paie comme Konza RH, il faut définir une règle s’appuyant sur le salaire brut diminué de la cotisation CNSS salariale. Si ce montant net imposable dépasse 500 000 FCFA, appliquez 0,5% sur la différence.' 
              },
              { 
                q: 'Le plafond de la CAMU classique est-il révisable ?', 
                a: 'Oui, l’assiette maximale de cotisation est fixée réglementairement à 600 000 FCFA par mois, sauf modification par décret ministériel ou loi de finances au Congo.' 
              }
            ].map(({ q, a }) => (
              <details key={q} className="group border rounded-xl overflow-hidden bg-gray-800 border-gray-700 transition-all">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-bold text-sm list-none text-white hover:text-rose-400">
                  {q}
                  <span className="text-gray-400 text-xs ml-3 group-open:rotate-180 transition-transform inline-block">▼</span>
                </summary>
                <div className="px-5 pb-4 pt-2 text-sm leading-relaxed border-t text-gray-400 border-gray-700 bg-gray-800/50">
                  {a}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Maillage interne SEO */}
        <section>
          <h2 className="text-xl font-black mb-4 text-white">Autres calculateurs officiels pour la paie au Congo</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { href: '/outils/calcul-its-congo', icon: '📊', label: 'Calcul ITS 2026' },
              { href: '/outils/calcul-cnss-congo', icon: '🏥', label: 'Calcul CNSS' },
              { href: '/outils/calcul-tus-congo', icon: '🏦', label: 'Calcul TUS' },
              { href: '/outils/calcul-heures-supplementaires-congo', icon: '⏰', label: 'Heures sup' },
            ].map(l => (
              <Link key={l.href} href={l.href}
                className="flex items-center gap-2 p-3 border rounded-xl hover:border-rose-300 transition-all text-sm font-bold bg-gray-800 border-gray-700 hover:bg-rose-900/10 text-gray-300">
                <span>{l.icon}</span>{l.label}
              </Link>
            ))}
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}