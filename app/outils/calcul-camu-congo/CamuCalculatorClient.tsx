'use client';
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';

const PLAFOND = 600_000;
const TAUX_SAL = 0.0227;
const TAUX_PAT = 0.0455;
const fmt = (v: number) => Math.round(v).toLocaleString('fr-FR');

export default function CamuCalculatorClient() {
  const [gross, setGross] = useState('');

  const res = useMemo(() => {
    const g = Number(gross);
    if (!g || g < 1) return null;
    const base = Math.min(g, PLAFOND);
    return {
      base, g,
      sal: Math.round(base * TAUX_SAL),
      pat: Math.round(base * TAUX_PAT),
      plafonné: g > PLAFOND,
    };
  }, [gross]);

  return (
    <div className="min-h-screen bg-[#050607]">
      <Navbar />
      <div className="fixed -right-40 -top-40 w-[600px] h-[600px] bg-white/[0.04] rounded-full blur-[130px] pointer-events-none" />
      <div className="fixed -left-40 bottom-0 w-[500px] h-[500px] bg-[#D4A548]/[0.06] rounded-full blur-[130px] pointer-events-none" />
      <div className="bg-gradient-to-br from-gray-900 to-rose-950 text-white">
        <div className="max-w-4xl mx-auto px-4 pt-20 pb-10">
          <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6">
            <Link href="/" className="hover:text-gray-300">Accueil</Link><span>›</span>
            <Link href="/outils" className="hover:text-gray-300">Outils RH</Link><span>›</span>
            <span className="text-gray-300">Calcul CAMU Congo</span>
          </nav>
          <span className="inline-block px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full text-xs text-rose-300 mb-4">
            💊 CAMU Congo — Loi n°37-2014 modifiée
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3">
            Calcul CAMU Congo-Brazzaville<br />
            <span className="text-rose-400">Assurance Maladie Universelle 2026</span>
          </h1>
          <p className="text-gray-400 text-sm max-w-xl">
            La CAMU, c'est votre protection santé au travail. On vous explique comment elle se calcule,
            qui paie quoi, et combien ça coûte — simplement.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">

        {/* Explication simple */}
        <section className="rounded-2xl border p-6 bg-gray-800 border-gray-700">
          <h2 className="font-black text-lg mb-3 text-white">💊 La CAMU, c'est quoi ?</h2>
          <p className="text-sm leading-relaxed mb-4 text-gray-400">
            Imaginez que vous tombez malade. Sans couverture, vous payez tout de votre poche.
            Avec la CAMU, l'État et votre employeur ont mis en place une caisse qui rembourse vos soins.
            <br /><br />
            Chaque mois, <strong className="text-gray-200">vous cotisez un peu</strong> (2,27% de votre salaire),
            votre <strong className="text-gray-200">employeur cotise aussi</strong> (4,55%),
            et en échange vous avez accès aux soins dans les établissements partenaires CAMU.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border text-center bg-rose-900/20 border-rose-900">
              <p className="text-3xl font-black mb-1 text-rose-400">2,27%</p>
              <p className="text-xs font-bold text-rose-300">Votre part (salarié)</p>
              <p className="text-[10px] text-gray-400 mt-1">Déduit de votre salaire chaque mois</p>
            </div>
            <div className="p-4 rounded-xl border text-center bg-orange-900/20 border-orange-900">
              <p className="text-3xl font-black mb-1 text-orange-400">4,55%</p>
              <p className="text-xs font-bold text-orange-300">Part de l'employeur</p>
              <p className="text-[10px] text-gray-400 mt-1">Payé en plus par l'entreprise</p>
            </div>
          </div>
          <div className="mt-4 p-3 border rounded-xl bg-amber-900/20 border-amber-800">
            <p className="text-xs text-amber-400">
              <strong>Le plafond :</strong> Ces taux s'appliquent sur un maximum de <strong>600 000 FCFA</strong> de salaire brut.
              Si vous gagnez 800 000 FCFA, la CAMU se calcule quand même sur 600 000 FCFA seulement.
            </p>
          </div>
        </section>

        {/* Calculateur + résultat */}
        <div className="grid md:grid-cols-2 gap-6 items-start">
          <div className="rounded-2xl border p-6 bg-gray-800 border-gray-700">
            <h2 className="font-black text-base mb-2 text-white">Calculez votre CAMU</h2>
            <p className="text-xs text-gray-400 mb-4">Entrez le salaire brut mensuel.</p>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Salaire brut (FCFA)</label>
            <input type="number" value={gross} onChange={e => setGross(e.target.value)} placeholder="Ex : 350 000"
              className="w-full px-4 py-3 border-2 rounded-xl text-lg font-black font-mono outline-none focus:border-rose-400 transition-colors border-gray-600 bg-gray-700" />
            {res?.plafonné && (
              <p className="text-[11px] text-amber-500 mt-2">⚠️ Brut dépasse 600 000 FCFA — plafond CAMU appliqué sur 600 000 F</p>
            )}
          </div>

          {!res ? (
            <div className="border border-dashed rounded-2xl p-12 text-center bg-gray-800/50 border-gray-700">
              <p className="text-3xl mb-3">💊</p>
              <p className="text-sm text-gray-400">Entrez un salaire pour calculer</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border overflow-hidden bg-gray-800 border-rose-800">
                <div className="px-4 py-3 border-b bg-rose-900/20 border-rose-900">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-rose-300">Résultat CAMU</p>
                  <p className="text-[10px] text-gray-400">Base de calcul : {fmt(res.base)} FCFA{res.plafonné ? ' (plafonné)' : ''}</p>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-700">
                    <div>
                      <p className="text-sm font-bold text-gray-200">👤 Votre part (2,27%)</p>
                      <p className="text-[10px] text-gray-400">{fmt(res.base)} × 2,27% — déduit de votre salaire</p>
                    </div>
                    <span className="font-black font-mono text-red-500">−{fmt(res.sal)} FCFA</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <div>
                      <p className="text-sm font-bold text-gray-200">🏢 Part employeur (4,55%)</p>
                      <p className="text-[10px] text-gray-400">{fmt(res.base)} × 4,55% — payé par l'entreprise</p>
                    </div>
                    <span className="font-black font-mono text-orange-500">+{fmt(res.pat)} FCFA</span>
                  </div>
                </div>
                <div className="px-4 py-3 border-t flex justify-between items-center bg-gray-900 border-gray-700">
                  <span className="text-xs font-bold text-gray-300">Total CAMU / mois</span>
                  <span className="font-black font-mono text-white">{fmt(res.sal + res.pat)} FCFA</span>
                </div>
              </div>
              <Link href="/simulateur"
                className="flex items-center justify-between p-4 bg-[#FAFAFA] text-black rounded-2xl hover:bg-white transition-colors group">
                <div>
                  <p className="font-black text-sm">Calculer le salaire net complet</p>
                  <p className="text-xs text-gray-600">CNSS + ITS + TUS + CAMU tout-en-un</p>
                </div>
                <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
          )}
        </div>

        {/* Tableau officiel */}
        <section>
          <h2 className="text-xl font-black mb-4 text-white">Taux CAMU officiels 2026</h2>
          <div className="overflow-x-auto rounded-2xl border border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-rose-900/20">
                <tr>{['Qui paie ?','Taux','Plafond assiette','Montant max/mois'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-rose-300">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y bg-gray-800 divide-gray-700">
                {[
                  { q: 'Salarié',    t: '2,27%', p: '600 000 FCFA', m: '13 620 FCFA' },
                  { q: 'Employeur',  t: '4,55%', p: '600 000 FCFA', m: '27 300 FCFA' },
                ].map(r => (
                  <tr key={r.q}>
                    <td className="px-4 py-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.q === 'Salarié' ? 'bg-rose-100 text-rose-700' : 'bg-orange-100 text-orange-700'}`}>{r.q}</span></td>
                    <td className="px-4 py-3 font-black font-mono text-white">{r.t}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{r.p}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{r.m}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-2">Source : Loi n°37-2014 modifiée par Loi n°12-2023 · Décret n°2024-131</p>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-xl font-black mb-4 text-white">Questions fréquentes — CAMU Congo</h2>
          <div className="space-y-3">
            {[
              { q: 'Comment obtenir sa carte CAMU au Congo ?', a: 'Après immatriculation par l\'employeur, la CAMU Congo envoie une carte d\'assuré au salarié. Cette carte donne accès aux soins dans les établissements de santé conventionnés CAMU sur toute l\'étendue du territoire congolais.' },
              { q: 'La CAMU rembourse-t-elle tous les frais médicaux ?', a: 'La CAMU prend en charge une partie des frais de santé selon un panier de soins défini. Consultations, hospitalisations, médicaments de la liste CAMU sont couverts. Certains actes spécialisés peuvent ne pas être remboursés à 100%.' },
              { q: 'La CAMU et la CNSS, c\'est la même chose ?', a: 'Non. La CNSS gère la retraite, les allocations familiales et les accidents du travail. La CAMU gère uniquement la santé (maladie, maternité). Ce sont deux institutions séparées avec des cotisations distinctes, toutes les deux obligatoires.' },
            ].map(({ q, a }) => (
              <details key={q} className="group border rounded-xl overflow-hidden bg-gray-800 border-gray-700">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-bold text-sm list-none text-white">
                  {q}<span className="text-gray-400 text-xs ml-3 group-open:rotate-180 transition-transform inline-block">▼</span>
                </summary>
                <div className="px-5 pb-4 pt-2 text-sm leading-relaxed border-t text-gray-400 border-gray-700">{a}</div>
              </details>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-black mb-4 text-white">Autres calculs RH Congo</h2>
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
      </div>
      <Footer />
    </div>
  );
}