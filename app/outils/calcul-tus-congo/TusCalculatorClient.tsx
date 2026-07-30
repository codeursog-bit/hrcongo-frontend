'use client';
import React, { useState, useMemo } from 'react';
import Link from 'next/link';

const TAUX_DGI  = 0.02025;
const TAUX_CNSS = 0.05475;
const fmt = (v: number) => Math.round(v).toLocaleString('fr-FR');

export default function TusCalculatorClient() {
  const [gross, setGross] = useState('');
  const res = useMemo(() => {
    const g = Number(gross);
    if (!g || g < 1) return null;
    return {
      g,
      dgi:  Math.round(g * TAUX_DGI),
      cnss: Math.round(g * TAUX_CNSS),
      total: Math.round(g * (TAUX_DGI + TAUX_CNSS)),
    };
  }, [gross]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-gradient-to-br from-gray-900 to-amber-950 text-white">
        <div className="max-w-4xl mx-auto px-4 pt-20 pb-10">
          <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6">
            <Link href="/" className="hover:text-gray-300">Accueil</Link><span>›</span>
            <Link href="/outils" className="hover:text-gray-300">Outils RH</Link><span>›</span>
            <span className="text-gray-300">Calcul TUS Congo</span>
          </nav>
          <span className="inline-block px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs text-amber-300 mb-4">
            🏦 TUS — Taxe Unique sur les Salaires
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3">
            Calcul TUS Congo-Brazzaville<br />
            <span className="text-amber-400">7,5% sur le salaire brut</span>
          </h1>
          <p className="text-gray-400 text-sm max-w-xl">
            Le TUS, c'est une taxe que <strong className="text-white">seul l'employeur paie</strong>.
            Le salarié ne la voit même pas sur son bulletin. On vous explique comment elle fonctionne.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">

        {/* Explication */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="font-black text-lg text-gray-900 dark:text-white mb-3">🏦 Le TUS en 3 phrases simples</h2>
          <div className="space-y-3">
            {[
              { n: '1', t: 'C\'est une taxe patronale', d: 'Seul l\'employeur la paie. Le salarié ne la voit pas sur son bulletin.' },
              { n: '2', t: '7,5% du salaire brut total', d: 'Sans plafond. Sur 500 000 FCFA de brut → 37 500 FCFA de TUS.' },
              { n: '3', t: 'Versée en deux endroits', d: '2,025% vont à la DGI (via eTax), 5,475% vont à la CNSS (même bordereau que les cotisations CNSS).' },
            ].map(s => (
              <div key={s.n} className="flex items-start gap-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-900">
                <span className="w-7 h-7 rounded-full bg-amber-500 text-white font-black text-sm flex items-center justify-center shrink-0">{s.n}</span>
                <div>
                  <p className="font-bold text-sm text-amber-800 dark:text-amber-300">{s.t}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Calculateur */}
        <div className="grid md:grid-cols-2 gap-6 items-start">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="font-black text-base text-gray-900 dark:text-white mb-2">Calculez le TUS</h2>
            <p className="text-xs text-gray-400 mb-4">Entrez le salaire brut mensuel total (masse salariale).</p>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Salaire brut (FCFA)</label>
            <input type="number" value={gross} onChange={e => setGross(e.target.value)} placeholder="Ex : 500 000"
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-lg font-black font-mono bg-white dark:bg-gray-700 outline-none focus:border-amber-400 transition-colors" />
            <p className="text-[10px] text-gray-400 mt-2">💡 Pas de plafond — le TUS s'applique sur l'intégralité du brut</p>
          </div>

          {!res ? (
            <div className="bg-gray-100 dark:bg-gray-800/50 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-12 text-center">
              <p className="text-3xl mb-3">🏦</p>
              <p className="text-sm text-gray-400">Entrez un salaire pour calculer</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-amber-200 dark:border-amber-800 overflow-hidden">
                <div className="px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-900">
                  <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">TUS sur {fmt(res.g)} FCFA</p>
                  <p className="text-[10px] text-gray-400">100% charge employeur</p>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                    <div>
                      <p className="text-sm font-bold text-gray-700 dark:text-gray-200">🏛️ Part DGI (2,025%)</p>
                      <p className="text-[10px] text-gray-400">Versé via eTax Congo avant le 15</p>
                    </div>
                    <span className="font-black font-mono text-amber-600">{fmt(res.dgi)} FCFA</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <div>
                      <p className="text-sm font-bold text-gray-700 dark:text-gray-200">🏥 Part CNSS (5,475%)</p>
                      <p className="text-[10px] text-gray-400">Inclus dans le bordereau CNSS mensuel</p>
                    </div>
                    <span className="font-black font-mono text-amber-600">{fmt(res.cnss)} FCFA</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 -mx-4 px-4 py-3">
                    <span className="text-sm font-bold text-amber-700 dark:text-amber-300">Total TUS mensuel</span>
                    <span className="font-black font-mono text-amber-700 dark:text-amber-300 text-lg">{fmt(res.total)} FCFA</span>
                  </div>
                </div>
              </div>
              <Link href="/simulateur"
                className="flex items-center justify-between p-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl hover:opacity-90 transition-all group">
                <div>
                  <p className="font-black text-sm">Calculer le coût employeur total</p>
                  <p className="text-xs text-violet-200">TUS + CNSS + CAMU tout inclus</p>
                </div>
                <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
          )}
        </div>

        {/* FAQ */}
        <section>
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4">Questions fréquentes — TUS Congo</h2>
          <div className="space-y-3">
            {[
              { q: 'Le TUS est-il déductible au Congo ?', a: 'Oui. Le TUS versé est déductible du bénéfice imposable de l\'entreprise au titre des charges d\'exploitation, comme toutes les charges sociales patronales.' },
              { q: 'Que se passe-t-il si on oublie de payer le TUS ?', a: 'Le non-paiement du TUS expose l\'employeur à des pénalités et majorations de la DGI (pour la part DGI) et de la CNSS (pour la part CNSS). Un contrôle fiscal peut entraîner un redressement sur plusieurs années.' },
            ].map(({ q, a }) => (
              <details key={q} className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-bold text-sm text-gray-900 dark:text-white list-none">
                  {q}<span className="text-gray-400 text-xs ml-3 group-open:rotate-180 transition-transform inline-block">▼</span>
                </summary>
                <div className="px-5 pb-4 pt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-gray-700">{a}</div>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}