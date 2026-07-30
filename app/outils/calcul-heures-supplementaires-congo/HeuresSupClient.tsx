'use client';
import React, { useState, useMemo } from 'react';
import Link from 'next/link';

const WORK_DAYS  = 26;
const HOURS_DAY  = 8;
const fmt = (v: number) => Math.round(v).toLocaleString('fr-FR');
const fmtDec = (v: number) => v.toFixed(0);

const MAJORS = [
  { key: 'h10',  label: '+10%',  sub: 'Les 5 premières heures sup',    color: 'amber',  rate: 1.10, icon: '1️⃣' },
  { key: 'h25',  label: '+25%',  sub: 'Les heures suivantes',           color: 'orange', rate: 1.25, icon: '2️⃣' },
  { key: 'h50',  label: '+50%',  sub: 'Nuit, repos compensateur, jours fériés', color: 'red', rate: 1.50, icon: '🌙' },
  { key: 'h100', label: '+100%', sub: 'Nuit dimanche & jours fériés',   color: 'purple', rate: 2.00, icon: '🌙⭐' },
];

type Hours = { h10: number; h25: number; h50: number; h100: number };

export default function HeuresSupClient() {
  const [salary, setSalary] = useState('');
  const [hours,  setHours]  = useState<Hours>({ h10: 0, h25: 0, h50: 0, h100: 0 });

  const res = useMemo(() => {
    const s = Number(salary);
    if (!s || s < 1) return null;
    const hourly = s / (WORK_DAYS * HOURS_DAY);
    return {
      hourly,
      h10:  Math.round(hourly * 1.10 * hours.h10),
      h25:  Math.round(hourly * 1.25 * hours.h25),
      h50:  Math.round(hourly * 1.50 * hours.h50),
      h100: Math.round(hourly * 2.00 * hours.h100),
      total: Math.round(
        hourly * 1.10 * hours.h10 +
        hourly * 1.25 * hours.h25 +
        hourly * 1.50 * hours.h50 +
        hourly * 2.00 * hours.h100
      ),
    };
  }, [salary, hours]);

  const StepBtn = ({ k, v }: { k: keyof Hours; v: number }) => (
    <div className="flex items-center gap-2">
      <button onClick={() => setHours(p => ({ ...p, [k]: Math.max(0, p[k] - 0.5) }))}
        className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 font-bold flex items-center justify-center cursor-pointer">−</button>
      <input type="number" value={v} min={0} step={0.5}
        onChange={e => setHours(p => ({ ...p, [k]: Math.max(0, Number(e.target.value)) }))}
        className="w-14 text-center font-black font-mono text-sm border border-gray-200 dark:border-gray-600 rounded-lg py-1.5 bg-white dark:bg-gray-700 outline-none" />
      <button onClick={() => setHours(p => ({ ...p, [k]: p[k] + 0.5 }))}
        className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 font-bold flex items-center justify-center cursor-pointer">+</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-gradient-to-br from-gray-900 to-orange-950 text-white">
        <div className="max-w-4xl mx-auto px-4 pt-20 pb-10">
          <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6">
            <Link href="/" className="hover:text-gray-300">Accueil</Link><span>›</span>
            <Link href="/outils" className="hover:text-gray-300">Outils RH</Link><span>›</span>
            <span className="text-gray-300">Heures supplémentaires</span>
          </nav>
          <span className="inline-block px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full text-xs text-orange-300 mb-4">
            ⏰ Décret n°78-360 — Code du Travail Congo
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3">
            Calcul Heures Supplémentaires<br />
            <span className="text-orange-400">Congo-Brazzaville 2026</span>
          </h1>
          <p className="text-gray-400 text-sm max-w-xl">
            Vous avez travaillé plus que prévu ? La loi congolaise oblige votre employeur
            à vous payer ces heures en plus, <strong className="text-white">avec une majoration</strong>.
            On vous explique comment calculer exactement ce que vous devez recevoir.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">

        {/* Explication pédago */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="font-black text-lg text-gray-900 dark:text-white mb-3">
            ⏰ Les heures sup, c'est quoi et comment ça se calcule ?
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
            Au Congo, la durée normale de travail est de <strong className="text-gray-700 dark:text-gray-200">40 heures par semaine</strong> (8h/jour × 5 jours).
            Chaque heure travaillée au-delà est une <strong className="text-gray-700 dark:text-gray-200">heure supplémentaire</strong>.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
            Ces heures ne se paient pas au même taux que les heures normales.
            La loi prévoit des <strong className="text-gray-700 dark:text-gray-200">majorations</strong> — c'est-à-dire un bonus en pourcentage —
            selon l'heure à laquelle vous travaillez.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {MAJORS.map(m => (
              <div key={m.key} className={`p-3 rounded-xl border text-center
                ${m.color === 'amber'  ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' :
                  m.color === 'orange' ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' :
                  m.color === 'red'    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
                                         'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'}`}>
                <p className="text-xl mb-1">{m.icon}</p>
                <p className={`font-black text-lg ${
                  m.color === 'amber'  ? 'text-amber-600 dark:text-amber-400' :
                  m.color === 'orange' ? 'text-orange-600 dark:text-orange-400' :
                  m.color === 'red'    ? 'text-red-600 dark:text-red-400' :
                                         'text-purple-600 dark:text-purple-400'}`}>{m.label}</p>
                <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{m.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Comment on calcule le taux horaire */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="font-black text-base text-gray-900 dark:text-white mb-3">
            💡 D'abord : comment trouver votre taux horaire ?
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
            Avant de calculer les heures sup, on doit savoir combien vaut <strong className="text-gray-700 dark:text-gray-200">une heure de votre travail</strong>.
            C'est simple :
          </p>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 font-mono text-sm">
            <p className="text-gray-500 text-xs mb-1">// Formule</p>
            <p className="text-indigo-600 dark:text-indigo-400">Taux horaire = Salaire de base ÷ ({WORK_DAYS} jours × {HOURS_DAY}h)</p>
            <p className="text-gray-500 text-xs mt-3 mb-1">// Exemple avec 400 000 FCFA</p>
            <p className="text-emerald-600 dark:text-emerald-400">Taux horaire = 400 000 ÷ 208 = <strong>1 923 FCFA/heure</strong></p>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Ensuite, chaque heure sup se calcule comme ça : <strong>taux horaire × majoration × nombre d'heures</strong>
          </p>
        </section>

        {/* CALCULATEUR */}
        <div className="grid md:grid-cols-2 gap-6 items-start">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">
            <h2 className="font-black text-base text-gray-900 dark:text-white">Calculez vos heures supplémentaires</h2>

            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Salaire de base mensuel (FCFA)</label>
              <input type="number" value={salary} onChange={e => setSalary(e.target.value)} placeholder="Ex : 400 000"
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-lg font-black font-mono bg-white dark:bg-gray-700 outline-none focus:border-orange-400 transition-colors" />
              {Number(salary) > 0 && (
                <p className="text-[11px] text-orange-500 mt-1.5">
                  → Taux horaire : <strong>{fmt(Number(salary) / (WORK_DAYS * HOURS_DAY))} FCFA/h</strong>
                </p>
              )}
            </div>

            <div className="space-y-4">
              {MAJORS.map(m => (
                <div key={m.key} className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${
                      m.color === 'amber'  ? 'text-amber-600 dark:text-amber-400' :
                      m.color === 'orange' ? 'text-orange-600 dark:text-orange-400' :
                      m.color === 'red'    ? 'text-red-600 dark:text-red-400' :
                                             'text-purple-600 dark:text-purple-400'}`}>
                      {m.icon} {m.label}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">{m.sub}</p>
                  </div>
                  <StepBtn k={m.key as keyof Hours} v={hours[m.key as keyof Hours]} />
                </div>
              ))}
            </div>
          </div>

          {!res || res.total === 0 ? (
            <div className="bg-gray-100 dark:bg-gray-800/50 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-12 text-center">
              <p className="text-3xl mb-3">⏰</p>
              <p className="text-sm text-gray-400">Entrez un salaire et des heures sup pour calculer</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-orange-200 dark:border-orange-800 overflow-hidden">
                <div className="px-4 py-3 bg-orange-50 dark:bg-orange-900/20 border-b border-orange-100 dark:border-orange-900">
                  <p className="text-[10px] font-bold text-orange-700 dark:text-orange-300 uppercase tracking-wider">Résultat heures supplémentaires</p>
                  <p className="text-[10px] text-gray-400">Taux horaire : {fmt(res.hourly)} FCFA/h</p>
                </div>
                <div className="p-4 space-y-2.5">
                  {MAJORS.map(m => {
                    const amount = res[m.key as keyof typeof res] as number;
                    const h = hours[m.key as keyof Hours];
                    if (!h) return null;
                    return (
                      <div key={m.key} className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-700 dark:text-gray-200">{m.icon} Heures {m.label}</p>
                          <p className="text-[10px] text-gray-400">{fmt(res.hourly)} × {m.rate} × {h}h</p>
                        </div>
                        <span className="font-black font-mono text-orange-500">+{fmt(amount)} FCFA</span>
                      </div>
                    );
                  })}
                  <div className="flex justify-between items-center pt-2 border-t border-orange-200 dark:border-orange-800">
                    <span className="font-bold text-sm text-orange-700 dark:text-orange-300">Total heures supplémentaires</span>
                    <span className="font-black font-mono text-orange-600 dark:text-orange-400 text-lg">+{fmt(res.total)} FCFA</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 dark:bg-black rounded-2xl p-4 text-white">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Salaire brut avec heures sup</p>
                <p className="font-black font-mono text-2xl">
                  {fmt(Number(salary) + res.total)} <span className="text-sm font-normal text-gray-400">FCFA</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">{fmt(Number(salary))} base + {fmt(res.total)} HS</p>
              </div>

              <Link href="/simulateur"
                className="flex items-center justify-between p-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl hover:opacity-90 transition-all group">
                <div>
                  <p className="font-black text-sm">Calculer le net après déductions</p>
                  <p className="text-xs text-violet-200">ITS + CNSS calculés sur le brut avec HS</p>
                </div>
                <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
          )}
        </div>

        {/* Tableau légal */}
        <section>
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">Majorations légales — Décret n°78-360</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Ce tableau est tiré du <strong className="text-gray-700 dark:text-gray-200">Décret n°78-360</strong> qui fixe les conditions de travail au Congo-Brazzaville.
            Tout employeur est légalement obligé de respecter ces taux.
          </p>
          <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-orange-50 dark:bg-orange-900/20">
                <tr>{['Catégorie','Condition','Majoration','Calcul sur 1h à 2 000 FCFA'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-orange-700 dark:text-orange-300 uppercase tracking-wider">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                {[
                  { c: 'Heures supplémentaires normales', cond: '5 premières heures au-delà de 40h/semaine', maj: '+10%', ex: '2 200 FCFA/h' },
                  { c: 'Heures supplémentaires normales', cond: 'Au-delà des 5 premières HS',                maj: '+25%', ex: '2 500 FCFA/h' },
                  { c: 'Heures de nuit / repos / féries', cond: 'Travail entre 21h et 5h ou jours fériés',  maj: '+50%', ex: '3 000 FCFA/h' },
                  { c: 'Nuit dimanche & jours fériés',   cond: 'Nuit du dimanche ou nuit d\'un jour férié', maj: '+100%', ex: '4 000 FCFA/h' },
                ].map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">{r.c}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{r.cond}</td>
                    <td className="px-4 py-3"><span className="font-black text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded-full text-xs">{r.maj}</span></td>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-gray-700 dark:text-gray-300">{r.ex}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4">Questions fréquentes</h2>
          <div className="space-y-3">
            {[
              { q: 'Un employeur peut-il refuser de payer les heures supplémentaires au Congo ?', a: 'Non. Dès lors que le salarié a travaillé au-delà de 40h/semaine sur demande ou avec l\'accord de l\'employeur, le paiement des heures supplémentaires est obligatoire. Le refus constitue une infraction au Code du travail et peut faire l\'objet d\'une plainte à l\'Inspection du Travail.' },
              { q: 'Les heures supplémentaires sont-elles imposables (ITS) au Congo ?', a: 'Oui. Les heures supplémentaires s\'ajoutent au salaire brut et sont soumises à l\'ITS 2026 et à la CNSS (dans la limite du plafond). Elles font partie intégrante du salaire brut imposable.' },
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

        <section>
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4">Autres calculs RH Congo</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { href: '/outils/calcul-its-congo', icon: '📊', label: 'Calcul ITS 2026' },
              { href: '/outils/calcul-cnss-congo', icon: '🏥', label: 'Calcul CNSS' },
              { href: '/outils/calcul-camu-congo', icon: '💊', label: 'Calcul CAMU' },
              { href: '/simulateur', icon: '🧮', label: 'Simulateur complet' },
            ].map(l => (
              <Link key={l.href} href={l.href}
                className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-all text-sm font-bold text-gray-700 dark:text-gray-300">
                <span>{l.icon}</span>{l.label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}