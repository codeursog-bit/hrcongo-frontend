'use client';
// ============================================================================
// 📁 app/outils/calcul-cnss-congo/CnssCalculatorClient.tsx
// Style : professeur qui explique à son étudiant. Ultra simple, zéro jargon.
// ============================================================================
import React, { useState, useMemo } from 'react';
import Link from 'next/link';

const PLAFOND_PENSION  = 1_200_000;
const PLAFOND_FAM_AT   = 600_000;
const TAUX_SAL         = 0.04;
const TAUX_PAT_PENSION = 0.08;
const TAUX_PAT_FAM     = 0.1003;
const TAUX_PAT_AT      = 0.0225;

function calcCnss(gross: number) {
  const basePension = Math.min(gross, PLAFOND_PENSION);
  const baseLow     = Math.min(gross, PLAFOND_FAM_AT);
  const sal         = Math.round(basePension * TAUX_SAL);
  const pension     = Math.round(basePension * TAUX_PAT_PENSION);
  const famille     = Math.round(baseLow     * TAUX_PAT_FAM);
  const accident    = Math.round(baseLow     * TAUX_PAT_AT);
  const totalPat    = pension + famille + accident;
  return { sal, pension, famille, accident, totalPat, basePension, baseLow };
}

const fmt = (v: number) => Math.round(v).toLocaleString('fr-FR');

// Barre de progression visuelle
function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}

export default function CnssCalculatorClient() {
  const [gross, setGross] = useState('');

  const res = useMemo(() => {
    const g = Number(gross);
    if (!g || g < 1) return null;
    return calcCnss(g);
  }, [gross]);

  const g = Number(gross) || 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* HERO */}
      <div className="bg-gradient-to-br from-gray-900 to-emerald-950 text-white">
        <div className="max-w-4xl mx-auto px-4 pt-20 pb-10">
          <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6">
            <Link href="/" className="hover:text-gray-300">Accueil</Link><span>›</span>
            <Link href="/outils" className="hover:text-gray-300">Outils RH</Link><span>›</span>
            <span className="text-gray-300">Calcul CNSS Congo</span>
          </nav>
          <span className="inline-block px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs text-emerald-300 mb-4">
            🏥 CNSS Congo — Décret n°99-284
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3">
            Calcul CNSS Congo-Brazzaville<br />
            <span className="text-emerald-400">Taux 2026, salarié & employeur</span>
          </h1>
          <p className="text-gray-400 text-sm max-w-xl">
            La CNSS, c'est la caisse qui protège les travailleurs : retraite, allocations familiales, accidents du travail.
            Salarié et employeur cotisent chacun. On vous explique tout, simplement.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">

        {/* ── C'EST QUOI LA CNSS ? ── */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="font-black text-lg text-gray-900 dark:text-white mb-4">
            🤔 La CNSS, c'est quoi exactement ?
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
            Imaginez une caisse commune où tout le monde met un peu d'argent chaque mois.
            Quand vous prenez votre retraite, quand vous avez un accident au travail,
            ou quand vous avez des enfants — cette caisse vous aide.
            C'est ça, la <strong className="text-gray-700 dark:text-gray-200">CNSS : Caisse Nationale de Sécurité Sociale du Congo</strong>.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: '👴', title: 'Retraite', desc: 'Vous cotisez aujourd\'hui pour toucher une pension demain' },
              { icon: '👶', title: 'Famille', desc: 'Allocations pour vos enfants à charge' },
              { icon: '🩹', title: 'Accidents', desc: 'Protection si vous vous blessez au travail' },
            ].map(c => (
              <div key={c.title} className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-center border border-emerald-100 dark:border-emerald-900">
                <span className="text-2xl block mb-2">{c.icon}</span>
                <p className="font-bold text-xs text-emerald-700 dark:text-emerald-300 mb-1">{c.title}</p>
                <p className="text-[10px] text-gray-500">{c.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CALCULATEUR ── */}
        <div className="grid md:grid-cols-2 gap-6 items-start">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="font-black text-base text-gray-900 dark:text-white mb-2">Calculez votre CNSS</h2>
            <p className="text-xs text-gray-400 mb-4">Entrez le salaire brut mensuel. On fait tout le reste.</p>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Salaire brut mensuel (FCFA)
            </label>
            <input
              type="number" value={gross} onChange={e => setGross(e.target.value)}
              placeholder="Ex : 400 000"
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-lg font-black font-mono bg-white dark:bg-gray-700 outline-none focus:border-emerald-400 transition-colors"
            />
            {g > PLAFOND_PENSION && (
              <p className="text-[11px] text-amber-500 mt-2 flex items-center gap-1">
                ⚠️ Brut dépasse 1 200 000 FCFA — plafond CNSS appliqué
              </p>
            )}

            {/* Explication visuelle du plafond */}
            {g > 0 && (
              <div className="mt-4 space-y-3">
                <div>
                  <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                    <span>Brut soumis à CNSS salarié</span>
                    <span className="font-mono font-bold">{fmt(Math.min(g, PLAFOND_PENSION))} / {fmt(PLAFOND_PENSION)} FCFA</span>
                  </div>
                  <ProgressBar pct={(Math.min(g, PLAFOND_PENSION) / PLAFOND_PENSION) * 100} color="bg-emerald-400" />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                    <span>Brut soumis à CNSS patronale (famille/AT)</span>
                    <span className="font-mono font-bold">{fmt(Math.min(g, PLAFOND_FAM_AT))} / {fmt(PLAFOND_FAM_AT)} FCFA</span>
                  </div>
                  <ProgressBar pct={(Math.min(g, PLAFOND_FAM_AT) / PLAFOND_FAM_AT) * 100} color="bg-orange-400" />
                </div>
              </div>
            )}
          </div>

          {/* Résultat */}
          {!res ? (
            <div className="bg-gray-100 dark:bg-gray-800/50 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-12 text-center">
              <p className="text-3xl mb-3">🏥</p>
              <p className="text-sm text-gray-400">Entrez un salaire pour voir le calcul</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Salarié */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-emerald-200 dark:border-emerald-800 overflow-hidden">
                <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-100 dark:border-emerald-900">
                  <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">👤 Ce que vous payez (salarié)</p>
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Branche pension (4%)</p>
                      <p className="text-[10px] text-gray-400">{fmt(res.basePension)} FCFA × 4%</p>
                    </div>
                    <span className="font-black font-mono text-red-500">−{fmt(res.sal)} FCFA</span>
                  </div>
                </div>
              </div>

              {/* Employeur */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-orange-200 dark:border-orange-800 overflow-hidden">
                <div className="px-4 py-3 bg-orange-50 dark:bg-orange-900/20 border-b border-orange-100 dark:border-orange-900">
                  <p className="text-[10px] font-bold text-orange-700 dark:text-orange-300 uppercase tracking-wider">🏢 Ce que l'entreprise paie (employeur)</p>
                </div>
                <div className="p-4 space-y-3">
                  {[
                    { label: 'Pensions / Vieillesse / Invalidité', rate: '8%', base: res.basePension, amount: res.pension, icon: '👴' },
                    { label: 'Prestations familiales',             rate: '10,03%', base: res.baseLow, amount: res.famille, icon: '👶' },
                    { label: 'Accidents du travail',               rate: '2,25%', base: res.baseLow, amount: res.accident, icon: '🩹' },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-700 dark:text-gray-200 flex items-center gap-1">
                          <span>{r.icon}</span> {r.label}
                        </p>
                        <p className="text-[10px] text-gray-400">{fmt(r.base)} FCFA × {r.rate}</p>
                      </div>
                      <span className="font-black font-mono text-orange-500">+{fmt(r.amount)} FCFA</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 border-t border-orange-100 dark:border-orange-900">
                    <span className="text-sm font-bold text-orange-700 dark:text-orange-300">Total charges patronales CNSS</span>
                    <span className="font-black font-mono text-orange-600 dark:text-orange-400">+{fmt(res.totalPat)} FCFA</span>
                  </div>
                </div>
              </div>

              {/* Total coût */}
              <div className="bg-gray-900 dark:bg-black rounded-2xl p-5 text-white">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Ce que CNSS coûte au total</p>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-400">Salarié retire : <span className="text-red-400 font-bold">−{fmt(res.sal)}</span></p>
                    <p className="text-xs text-gray-400">Employeur verse : <span className="text-orange-400 font-bold">+{fmt(res.totalPat)}</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-500">Total CNSS</p>
                    <p className="font-black font-mono text-2xl">{fmt(res.sal + res.totalPat)}</p>
                    <p className="text-xs text-gray-400">FCFA / mois</p>
                  </div>
                </div>
              </div>

              <Link href="/simulateur"
                className="flex items-center justify-between p-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl hover:opacity-90 transition-all group">
                <div>
                  <p className="font-black text-sm">Voir le salaire net complet</p>
                  <p className="text-xs text-violet-200">CNSS + ITS + TUS + CAMU en un clic</p>
                </div>
                <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
          )}
        </div>

        {/* ── TABLEAU TAUX OFFICIEL ── */}
        <section>
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">
            Les taux CNSS Congo 2026 — Tableau officiel
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Ces taux sont fixés par le <strong className="text-gray-700 dark:text-gray-200">Décret n°99-284 du 31 décembre 1999</strong>, toujours en vigueur en 2026.
          </p>
          <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-emerald-50 dark:bg-emerald-900/20">
                <tr>
                  {['Branche', 'Qui paie ?', 'Taux', 'Plafond assiette', 'À quoi ça sert ?'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                {[
                  { b: 'Pension (vieillesse / invalidité / décès)', q: 'Salarié', t: '4%',     p: '1 200 000 FCFA', s: 'Votre retraite' },
                  { b: 'Pension (vieillesse / invalidité / décès)', q: 'Employeur', t: '8%',   p: '1 200 000 FCFA', s: 'Votre retraite' },
                  { b: 'Prestations familiales',                    q: 'Employeur', t: '10,03%', p: '600 000 FCFA', s: 'Allocations enfants' },
                  { b: 'Accidents du travail / maladies prof.',     q: 'Employeur', t: '2,25%', p: '600 000 FCFA',  s: 'Protection blessures' },
                ].map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300 text-xs">{r.b}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.q === 'Salarié' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'}`}>
                        {r.q}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-black font-mono text-sm text-gray-900 dark:text-white">{r.t}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs font-mono">{r.p}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{r.s}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── EXPLICATION PLAFOND (pédago) ── */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="font-black text-lg text-gray-900 dark:text-white mb-3">
            💡 C'est quoi un "plafond" en CNSS ?
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
            Imaginez que la CNSS dit : <em className="text-gray-700 dark:text-gray-200">"On calcule les cotisations uniquement sur la première tranche de ton salaire."</em>
            <br /><br />
            Exemple concret : vous gagnez <strong className="text-gray-700 dark:text-gray-200">2 000 000 FCFA</strong>.
            Le plafond pension est à 1 200 000 FCFA. Donc la CNSS salarié (4%) se calcule
            sur <strong className="text-gray-700 dark:text-gray-200">1 200 000 FCFA</strong> seulement, pas sur 2 000 000.
          </p>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 text-sm">
            <p className="font-bold text-emerald-700 dark:text-emerald-300 mb-2">Calcul pour 2 000 000 FCFA :</p>
            <p className="text-gray-600 dark:text-gray-300">CNSS salarié = <span className="font-mono">1 200 000 × 4% = 48 000 FCFA</span></p>
            <p className="text-gray-400 text-xs mt-1">
              (et non 2 000 000 × 4% = 80 000 FCFA — c'est le plafond qui protège les hauts salaires)
            </p>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section>
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4">
            Questions fréquentes — CNSS Congo 2026
          </h2>
          <div className="space-y-3">
            {[
              {
                q: 'Un salarié étranger cotise-t-il à la CNSS au Congo ?',
                a: 'Oui. Tout salarié qui travaille légalement au Congo-Brazzaville est affilié à la CNSS, quelle que soit sa nationalité. L\'affiliation est obligatoire dès le premier jour de travail.'
              },
              {
                q: 'Comment immatriculer un salarié à la CNSS Congo ?',
                a: 'L\'employeur dépose un dossier d\'immatriculation auprès de la CNSS Congo (agence ou en ligne sur cnss.cg) avec : la copie du contrat de travail, la pièce d\'identité du salarié et le numéro de l\'employeur. La CNSS délivre un numéro d\'immatriculation personnel au salarié.'
              },
              {
                q: 'La CNSS Congo couvre-t-elle aussi les stagiaires ?',
                a: 'Les stagiaires sous convention de stage ne cotisent généralement pas à la CNSS. Mais dès qu\'il y a un contrat de travail (même CDD), l\'affiliation CNSS est obligatoire.'
              },
              {
                q: 'Quelle est la différence entre CNSS et CAMU au Congo ?',
                a: 'La CNSS couvre la retraite, la famille et les accidents du travail. La CAMU (Caisse d\'Assurance Maladie Universelle) couvre les frais de santé. Ce sont deux institutions distinctes avec des cotisations séparées. Les deux sont obligatoires pour les salariés du privé congolais.'
              },
            ].map(({ q, a }) => (
              <details key={q} className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-bold text-sm text-gray-900 dark:text-white list-none">
                  {q}
                  <span className="text-gray-400 text-xs ml-3 group-open:rotate-180 transition-transform inline-block">▼</span>
                </summary>
                <div className="px-5 pb-4 pt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-gray-700">{a}</div>
              </details>
            ))}
          </div>
        </section>

        {/* Liens autres outils */}
        <section>
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4">Autres calculs RH Congo</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { href: '/outils/calcul-its-congo',  icon: '📊', label: 'Calcul ITS 2026' },
              { href: '/outils/calcul-camu-congo',  icon: '💊', label: 'Calcul CAMU' },
              { href: '/outils/calcul-tus-congo',   icon: '🏦', label: 'Calcul TUS' },
              { href: '/outils/calcul-heures-supplementaires-congo', icon: '⏰', label: 'Heures sup' },
            ].map(l => (
              <Link key={l.href} href={l.href}
                className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all text-sm font-bold text-gray-700 dark:text-gray-300">
                <span>{l.icon}</span>{l.label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}