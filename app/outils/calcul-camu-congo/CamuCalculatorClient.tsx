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
      
      {/* En-tête optimisé SEO (H1 fort) */}
      <header className="bg-gradient-to-br from-[#0c0c0d] to-[#1a110c] text-white">
        <div className="max-w-4xl mx-auto px-4 pt-20 pb-10">
          <nav className="flex items-center gap-2 text-xs text-[#6f6f6f] mb-6" aria-label="Fil d'Ariane">
            <Link href="/" className="hover:text-[#d6d6d6]">Accueil</Link><span>›</span>
            <Link href="/outils" className="hover:text-[#d6d6d6]">Outils RH</Link><span>›</span>
            <span className="text-[#d6d6d6]">Calcul CAMU Congo</span>
          </nav>
          <span className="inline-block px-3 py-1 bg-[#FF9A62]/10 border border-[#FF9A62]/20 rounded-full text-xs text-[#FF9A62] mb-4">
            Conformité Paie Congo 2026 — Lois n°37-2014 & n°12-2023
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3">
            Simulateur CAMU Congo-Brazzaville :<br />
            <span className="text-[#FF9A62]">Calculer la Cotisation et la Solidarité sur Salaire</span>
          </h1>
          <p className="text-[#9a9a9a] text-sm max-w-2xl leading-relaxed">
            Outil de calcul gratuit pour les professionnels RH, comptables et salariés au Congo. Simulez en un clic la CAMU classique (salarié et employeur) et la CAMU solidarité sur l'excédent imposable.
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-12">

        {/* Sélecteur de mode */}
        <div className="flex rounded-2xl bg-[#161616] p-1.5 border border-[#2a2a2a] max-w-md mx-auto shadow-xl">
          <button
            onClick={() => setMode('solidarite')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${mode === 'solidarite' ? 'bg-[#B85A32] text-white shadow-lg' : 'text-[#9a9a9a] hover:text-white'}`}>
            CAMU Solidarité (0,5%)
          </button>
          <button
            onClick={() => setMode('classique')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${mode === 'classique' ? 'bg-[#B85A32] text-white shadow-lg' : 'text-[#9a9a9a] hover:text-white'}`}>
            CAMU Classique (2,27% / 4,55%)
          </button>
        </div>

        {/* Explication contextuelle orientée intention de recherche */}
        {mode === 'solidarite' ? (
          <article className="rounded-2xl border p-6 bg-[#161616] border-[#2a2a2a]">
            <h2 className="font-black text-lg mb-3 text-white">Comprendre le calcul de la CAMU Solidarité au Congo</h2>
            <p className="text-sm leading-relaxed mb-4 text-[#9a9a9a]">
              Instaurée pour renforcer l'équité du système de santé, la <strong className="text-[#e5e5e5]">CAMU solidarité</strong> est un prélèvement additionnel prélevé sur les revenus des salariés. Elle s'active dès lors que la base imposable mensuelle (après déduction de la part salariale CNSS) franchit le seuil de <strong className="text-[#e5e5e5]">500 000 FCFA</strong>. Le taux de <strong className="text-[#FF9A62]">0,5%</strong> s'applique exclusivement sur la tranche excédentaire.
            </p>
            <div className="p-3 border rounded-xl bg-amber-900/20 border-amber-800">
              <p className="text-xs text-amber-400">
                <strong>Formule paie :</strong> <code className="bg-[#0c0c0d] px-1.5 py-0.5 rounded font-mono">(Salaire Imposable − 500 000) × 0,5%</code>. Si la base est inférieure ou égale à 500 000 FCFA, la cotisation est nulle (0 F).
              </p>
            </div>
          </article>
        ) : (
          <article className="rounded-2xl border p-6 bg-[#161616] border-[#2a2a2a]">
            <h2 className="font-black text-lg mb-3 text-white">Tout savoir sur la CAMU Classique et Conventionnelle</h2>
            <p className="text-sm leading-relaxed mb-4 text-[#9a9a9a]">
              La couverture maladie universelle standard implique une double contribution obligatoire sur les bulletins de paie congolais : <strong className="text-[#e5e5e5]">2,27% à la charge du salarié</strong> et <strong className="text-[#e5e5e5]">4,55% à la charge de l'employeur</strong>. Ces taux sont strictement plafonnés sur une assiette maximale de <strong className="text-[#e5e5e5]">600 000 FCFA</strong>.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border text-center bg-[#FF9A62]/15 border-[#FF9A62]">
                <p className="text-3xl font-black mb-1 text-[#FF9A62]">2,27%</p>
                <p className="text-xs font-bold text-[#FF9A62]">Quote-part Salarié</p>
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
          <div className="rounded-2xl border p-6 bg-[#161616] border-[#2a2a2a] shadow-lg">
            <h2 className="font-black text-base mb-2 text-white">Simulateur en ligne</h2>
            <p className="text-xs text-[#9a9a9a] mb-4">Saisissez le salaire brut mensuel de l'employé :</p>
            <label htmlFor="gross-salary" className="block text-[11px] font-bold text-[#9a9a9a] uppercase tracking-wider mb-1.5">Salaire Brut (FCFA)</label>
            <input 
              id="gross-salary"
              type="number" 
              value={gross} 
              onChange={e => setGross(e.target.value)} 
              placeholder="Ex : 750 000"
              className="w-full px-4 py-3 border-2 rounded-xl text-lg font-black font-mono outline-none focus:border-[#FF9A62] transition-colors border-[#3a3a3a] bg-[#2a2a2a] text-white" 
            />
          </div>

          {/* Affichage dynamique des résultats */}
          {mode === 'solidarite' ? (
            !resSolidarite ? (
              <div className="border border-dashed rounded-2xl p-12 text-center bg-[#161616]/50 border-[#2a2a2a] flex flex-col items-center justify-center">
                <span className="text-3xl mb-3"></span>
                <p className="text-sm text-[#9a9a9a]">Renseignez un montant brut pour voir le détail de la CAMU solidarité</p>
              </div>
            ) : (
              <div className="rounded-2xl border overflow-hidden bg-[#161616] border-[#FF9A62] shadow-xl">
                <div className="px-4 py-3 border-b bg-[#FF9A62]/15 border-[#FF9A62]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#FF9A62]">Détail du calcul — Solidarité</p>
                  <p className="text-[10px] text-[#9a9a9a]">Base imposable de référence : {fmt(resSolidarite.baseImposable)} FCFA</p>
                </div>
                <div className="p-4 space-y-3 text-sm">
                  <div className="flex justify-between py-1 border-b border-[#2a2a2a] text-[#d6d6d6]">
                    <span>Salaire Brut de base</span>
                    <span className="font-mono font-bold">{fmt(resSolidarite.g)} F</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#2a2a2a] text-[#d6d6d6]">
                    <span>Abattement CNSS salariale (4%)</span>
                    <span className="font-mono text-red-400">−{fmt(resSolidarite.cnssSal)} F</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#2a2a2a] text-[#d6d6d6]">
                    <span>Seuil d'exonération</span>
                    <span className="font-mono text-[#9a9a9a]">500 000 F</span>
                  </div>
                  <div className="flex justify-between py-1 text-[#d6d6d6]">
                    <span>Tranche soumise à cotisation</span>
                    <span className="font-mono font-bold text-white">{fmt(resSolidarite.excédent)} F</span>
                  </div>
                </div>
                <div className="px-4 py-3 border-t flex justify-between items-center bg-[#0c0c0d] border-[#2a2a2a]">
                  <span className="text-xs font-bold text-[#d6d6d6]">Montant CAMU Solidarité (0,5%)</span>
                  <span className="font-black font-mono text-[#FF9A62] text-base">{fmt(resSolidarite.montant)} FCFA</span>
                </div>
              </div>
            )
          ) : (
            !resClassic ? (
              <div className="border border-dashed rounded-2xl p-12 text-center bg-[#161616]/50 border-[#2a2a2a] flex flex-col items-center justify-center">
                <span className="text-3xl mb-3"></span>
                <p className="text-sm text-[#9a9a9a]">Renseignez un montant brut pour calculer la part classique</p>
              </div>
            ) : (
              <div className="rounded-2xl border overflow-hidden bg-[#161616] border-[#FF9A62] shadow-xl">
                <div className="px-4 py-3 border-b bg-[#FF9A62]/15 border-[#FF9A62]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#FF9A62]">Détail du calcul — Classique</p>
                  <p className="text-[10px] text-[#9a9a9a]">Assiette de calcul : {fmt(resClassic.base)} FCFA {resClassic.plafonné ? '(Plafonné à 600k)' : ''}</p>
                </div>
                <div className="p-4 space-y-3 text-sm">
                  <div className="flex justify-between py-1 border-b border-[#2a2a2a] text-[#d6d6d6]">
                    <span>Retenue Salarié (2,27%)</span>
                    <span className="font-mono text-red-400">−{fmt(resClassic.sal)} F</span>
                  </div>
                  <div className="flex justify-between py-1 text-[#d6d6d6]">
                    <span>Charge Employeur (4,55%)</span>
                    <span className="font-mono text-orange-400">+{fmt(resClassic.pat)} F</span>
                  </div>
                </div>
                <div className="px-4 py-3 border-t flex justify-between items-center bg-[#0c0c0d] border-[#2a2a2a]">
                  <span className="text-xs font-bold text-[#d6d6d6]">Total cotisations versées</span>
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
              <details key={q} className="group border rounded-xl overflow-hidden bg-[#161616] border-[#2a2a2a] transition-all">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-bold text-sm list-none text-white hover:text-[#FF9A62]">
                  {q}
                  <span className="text-[#9a9a9a] text-xs ml-3 group-open:rotate-180 transition-transform inline-block">▼</span>
                </summary>
                <div className="px-5 pb-4 pt-2 text-sm leading-relaxed border-t text-[#9a9a9a] border-[#2a2a2a] bg-[#161616]/50">
                  {a}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Maillage interne SEO */}
        <section>
          <h2 className="text-xl font-black mb-4 text-white">Autres calculateurs pour la paie au Congo</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { href: '/outils/calcul-its-congo', icon: '', label: 'Calcul ITS 2026' },
              { href: '/outils/calcul-cnss-congo', icon: '', label: 'Calcul CNSS' },
              { href: '/outils/calcul-tus-congo', icon: '', label: 'Calcul TUS' },
              { href: '/outils/calcul-heures-supplementaires-congo', icon: '', label: 'Heures sup' },
            ].map(l => (
              <Link key={l.href} href={l.href}
                className="flex items-center gap-2 p-3 border rounded-xl hover:border-[#FF9A62] transition-all text-sm font-bold bg-[#161616] border-[#2a2a2a] hover:bg-[#FF9A62]/10 text-[#d6d6d6]">
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