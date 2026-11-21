'use client';
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';

const HOURS_MONTH = 173; // Heure conventionnelle : 40h/semaine × 52 semaines ÷ 12 mois ≈ 173h/mois
const fmt = (v: number) => Math.round(v).toLocaleString('fr-FR');
const fmtDec = (v: number) => v.toFixed(0);

const MAJORS = [
  { key: 'h10',  label: '+10%',  sub: 'Les 5 premières heures sup',    color: 'amber',  rate: 1.10, icon: '1⃣' },
  { key: 'h25',  label: '+25%',  sub: 'Les heures suivantes',           color: 'orange', rate: 1.25, icon: '2⃣' },
  { key: 'h50',  label: '+50%',  sub: 'Nuit, repos compensateur, jours fériés', color: 'red', rate: 1.50, icon: '' },
  { key: 'h100', label: '+100%', sub: 'Nuit dimanche & jours fériés',   color: 'purple', rate: 2.00, icon: '' },
];

type Hours = { h10: number; h25: number; h50: number; h100: number };

export default function HeuresSupClient() {
  const [salary, setSalary] = useState('');
  const [hours,  setHours]  = useState<Hours>({ h10: 0, h25: 0, h50: 0, h100: 0 });

  const res = useMemo(() => {
    const s = Number(salary);
    if (!s || s < 1) return null;
    const hourly = s / HOURS_MONTH;
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
        className="w-8 h-8 rounded-lg border font-bold flex items-center justify-center cursor-pointer border-[#3a3a3a] bg-[#2a2a2a]">−</button>
      <input type="number" value={v} min={0} step={0.5}
        onChange={e => setHours(p => ({ ...p, [k]: Math.max(0, Number(e.target.value)) }))}
        className="w-14 text-center font-black font-mono text-sm border rounded-lg py-1.5 outline-none border-[#3a3a3a] bg-[#2a2a2a]" />
      <button onClick={() => setHours(p => ({ ...p, [k]: p[k] + 0.5 }))}
        className="w-8 h-8 rounded-lg border font-bold flex items-center justify-center cursor-pointer border-[#3a3a3a] bg-[#2a2a2a]">+</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050607]">
      <Navbar />
      <div className="bg-gradient-to-br from-[#0c0c0d] to-[#1a110c] text-white">
        <div className="max-w-4xl mx-auto px-4 pt-20 pb-10">
          <nav className="flex items-center gap-2 text-xs text-[#6f6f6f] mb-6">
            <Link href="/" className="hover:text-[#d6d6d6]">Accueil</Link><span>›</span>
            <Link href="/outils" className="hover:text-[#d6d6d6]">Outils RH</Link><span>›</span>
            <span className="text-[#d6d6d6]">Heures supplémentaires</span>
          </nav>
          <span className="inline-block px-3 py-1 bg-[#FF9A62]/10 border border-[#FF9A62]/20 rounded-full text-xs text-[#FF9A62] mb-4">
            Décret n°78-360 — Code du Travail Congo
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3">
            Calcul Heures Supplémentaires<br />
            <span className="text-[#FF9A62]">Congo-Brazzaville 2026</span>
          </h1>
          <p className="text-[#9a9a9a] text-sm max-w-xl">
            Vous avez travaillé plus que prévu ? La loi congolaise oblige votre employeur
            à vous payer ces heures en plus, <strong className="text-white">avec une majoration</strong>.
            On vous explique comment calculer exactement ce que vous devez recevoir.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">

        {/* Explication pédago */}
        <section className="rounded-2xl border p-6 bg-[#161616] border-[#2a2a2a]">
          <h2 className="font-black text-lg mb-3 text-white">
            Les heures sup, c'est quoi et comment ça se calcule ?
          </h2>
          <p className="text-sm leading-relaxed mb-4 text-[#9a9a9a]">
            Au Congo, la durée normale de travail est de <strong className="text-[#e5e5e5]">40 heures par semaine</strong> (8h/jour × 5 jours).
            Chaque heure travaillée au-delà est une <strong className="text-[#e5e5e5]">heure supplémentaire</strong>.
          </p>
          <p className="text-sm leading-relaxed mb-4 text-[#9a9a9a]">
            Ces heures ne se paient pas au même taux que les heures normales.
            La loi prévoit des <strong className="text-[#e5e5e5]">majorations</strong> — c'est-à-dire un bonus en pourcentage —
            selon l'heure à laquelle vous travaillez.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {MAJORS.map(m => (
              <div key={m.key} className={`p-3 rounded-xl border text-center
                ${m.color === 'amber'  ? 'bg-amber-900/20 border-amber-800' :
                  m.color === 'orange' ? 'bg-[#FF9A62]/15 border-[#FF9A62]' :
                  m.color === 'red'    ? 'bg-red-900/20 border-red-800' :
                                         'bg-[#FF9A62]/15 border-[#FF9A62]'}`}>
                <p className="text-xl mb-1">{m.icon}</p>
                <p className={`font-black text-lg ${
                  m.color === 'amber'  ? 'text-amber-400' :
                  m.color === 'orange' ? 'text-[#FF9A62]' :
                  m.color === 'red'    ? 'text-red-400' :
                                         'text-[#FF9A62]'}`}>{m.label}</p>
                <p className="text-[10px] text-[#6f6f6f] mt-0.5 leading-tight">{m.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Comment on calcule le taux horaire */}
        <section className="rounded-2xl border p-6 bg-[#161616] border-[#2a2a2a]">
          <h2 className="font-black text-base mb-3 text-white">
            D'abord : comment trouver votre taux horaire ?
          </h2>
          <p className="text-sm leading-relaxed mb-3 text-[#9a9a9a]">
            Avant de calculer les heures sup, on doit savoir combien vaut <strong className="text-[#e5e5e5]">une heure de votre travail</strong>.
            C'est simple :
          </p>
          <div className="rounded-xl p-4 font-mono text-sm bg-[#0c0c0d]">
            <p className="text-[#6f6f6f] text-xs mb-1">// Formule</p>
            <p className="text-indigo-400">Taux horaire = Salaire de base ÷ Heure conventionnelle ({HOURS_MONTH}h/mois)</p>
            <p className="text-[#6f6f6f] text-xs mt-3 mb-1">// Exemple avec 400 000 FCFA</p>
            <p className="text-emerald-400">Taux horaire = 400 000 ÷ {HOURS_MONTH} = <strong>2 312 FCFA/heure</strong></p>
          </div>
          <p className="text-xs text-[#9a9a9a] mt-3">
            Ensuite, chaque heure sup se calcule comme ça : <strong>taux horaire × majoration × nombre d'heures</strong>
          </p>
        </section>

        {/* CALCULATEUR */}
        <div className="grid md:grid-cols-2 gap-6 items-start">
          <div className="rounded-2xl border p-6 space-y-5 bg-[#161616] border-[#2a2a2a]">
            <h2 className="font-black text-base text-white">Calculez vos heures supplémentaires</h2>

            <div>
              <label className="block text-[11px] font-bold text-[#9a9a9a] uppercase tracking-wider mb-1.5">Salaire de base mensuel (FCFA)</label>
              <input type="number" value={salary} onChange={e => setSalary(e.target.value)} placeholder="Ex : 400 000"
                className="w-full px-4 py-3 border-2 rounded-xl text-lg font-black font-mono outline-none focus:border-[#FF9A62] transition-colors border-[#3a3a3a] bg-[#2a2a2a]" />
              {Number(salary) > 0 && (
                <p className="text-[11px] text-[#FF9A62] mt-1.5">
                  → Taux horaire : <strong>{fmt(Number(salary) / HOURS_MONTH)} FCFA/h</strong>
                </p>
              )}
            </div>

            <div className="space-y-4">
              {MAJORS.map(m => (
                <div key={m.key} className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${
                      m.color === 'amber'  ? 'text-amber-400' :
                      m.color === 'orange' ? 'text-[#FF9A62]' :
                      m.color === 'red'    ? 'text-red-400' :
                                             'text-[#FF9A62]'}`}>
                      {m.icon} {m.label}
                    </p>
                    <p className="text-[10px] text-[#9a9a9a] truncate">{m.sub}</p>
                  </div>
                  <StepBtn k={m.key as keyof Hours} v={hours[m.key as keyof Hours]} />
                </div>
              ))}
            </div>
          </div>

          {!res || res.total === 0 ? (
            <div className="border border-dashed rounded-2xl p-12 text-center bg-[#161616]/50 border-[#2a2a2a]">
              <p className="text-3xl mb-3"></p>
              <p className="text-sm text-[#9a9a9a]">Entrez un salaire et des heures sup pour calculer</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border overflow-hidden bg-[#161616] border-[#FF9A62]">
                <div className="px-4 py-3 border-b bg-[#FF9A62]/15 border-[#FF9A62]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#FF9A62]">Résultat heures supplémentaires</p>
                  <p className="text-[10px] text-[#9a9a9a]">Taux horaire : {fmt(res.hourly)} FCFA/h</p>
                </div>
                <div className="p-4 space-y-2.5">
                  {MAJORS.map(m => {
                    const amount = res[m.key as keyof typeof res] as number;
                    const h = hours[m.key as keyof Hours];
                    if (!h) return null;
                    return (
                      <div key={m.key} className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-[#e5e5e5]">{m.icon} Heures {m.label}</p>
                          <p className="text-[10px] text-[#9a9a9a]">{fmt(res.hourly)} × {m.rate} × {h}h</p>
                        </div>
                        <span className="font-black font-mono text-[#FF9A62]">+{fmt(amount)} FCFA</span>
                      </div>
                    );
                  })}
                  <div className="flex justify-between items-center pt-2 border-t border-[#FF9A62]">
                    <span className="font-bold text-sm text-[#FF9A62]">Total heures supplémentaires</span>
                    <span className="font-black font-mono text-lg text-[#FF9A62]">+{fmt(res.total)} FCFA</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl p-4 text-white bg-black">
                <p className="text-[10px] text-[#6f6f6f] uppercase tracking-widest mb-1">Salaire brut avec heures sup</p>
                <p className="font-black font-mono text-2xl">
                  {fmt(Number(salary) + res.total)} <span className="text-sm font-normal text-[#9a9a9a]">FCFA</span>
                </p>
                <p className="text-xs text-[#6f6f6f] mt-1">{fmt(Number(salary))} base + {fmt(res.total)} HS</p>
              </div>

              <Link href="/simulateur"
                className="flex items-center justify-between p-4 bg-[#FAFAFA] text-black rounded-2xl hover:bg-white transition-colors group">
                <div>
                  <p className="font-black text-sm">Calculer le net après déductions</p>
                  <p className="text-xs text-[#3a3a3a]">ITS + CNSS calculés sur le brut avec HS</p>
                </div>
                <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
          )}
        </div>

        {/* Tableau légal */}
        <section>
          <h2 className="text-xl font-black mb-2 text-white">Majorations légales — Décret n°78-360</h2>
          <p className="text-sm mb-4 text-[#9a9a9a]">
            Ce tableau est tiré du <strong className="text-[#e5e5e5]">Décret n°78-360</strong> qui fixe les conditions de travail au Congo-Brazzaville.
            Tout employeur est légalement obligé de respecter ces taux.
          </p>
          <div className="overflow-x-auto rounded-2xl border border-[#2a2a2a]">
            <table className="w-full text-sm">
              <thead className="bg-[#FF9A62]/15">
                <tr>{['Catégorie','Condition','Majoration','Calcul sur 1h à 2 000 FCFA'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#FF9A62]">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y bg-[#161616] divide-[#2a2a2a]">
                {[
                  { c: 'Heures supplémentaires normales', cond: '5 premières heures au-delà de 40h/semaine', maj: '+10%', ex: '2 200 FCFA/h' },
                  { c: 'Heures supplémentaires normales', cond: 'Au-delà des 5 premières HS',                maj: '+25%', ex: '2 500 FCFA/h' },
                  { c: 'Heures de nuit / repos / féries', cond: 'Travail entre 21h et 5h ou jours fériés',  maj: '+50%', ex: '3 000 FCFA/h' },
                  { c: 'Nuit dimanche & jours fériés',   cond: 'Nuit du dimanche ou nuit d\'un jour férié', maj: '+100%', ex: '4 000 FCFA/h' },
                ].map((r, i) => (
                  <tr key={i} className="transition-colors hover:bg-[#6f6f6f]">
                    <td className="px-4 py-3 text-xs text-[#9a9a9a]">{r.c}</td>
                    <td className="px-4 py-3 text-xs text-[#6f6f6f]">{r.cond}</td>
                    <td className="px-4 py-3"><span className="font-black px-2 py-0.5 rounded-full text-xs text-[#FF9A62] bg-[#FF9A62]/15">{r.maj}</span></td>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-[#d6d6d6]">{r.ex}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-xl font-black mb-4 text-white">Questions fréquentes</h2>
          <div className="space-y-3">
            {[
              { q: 'Un employeur peut-il refuser de payer les heures supplémentaires au Congo ?', a: 'Non. Dès lors que le salarié a travaillé au-delà de 40h/semaine sur demande ou avec l\'accord de l\'employeur, le paiement des heures supplémentaires est obligatoire. Le refus constitue une infraction au Code du travail et peut faire l\'objet d\'une plainte à l\'Inspection du Travail.' },
              { q: 'Les heures supplémentaires sont-elles imposables (ITS) au Congo ?', a: 'Oui. Les heures supplémentaires s\'ajoutent au salaire brut et sont soumises à l\'ITS 2026 et à la CNSS (dans la limite du plafond). Elles font partie intégrante du salaire brut imposable.' },
            ].map(({ q, a }) => (
              <details key={q} className="group border rounded-xl overflow-hidden bg-[#161616] border-[#2a2a2a]">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-bold text-sm list-none text-white">
                  {q}<span className="text-[#9a9a9a] text-xs ml-3 group-open:rotate-180 transition-transform inline-block">▼</span>
                </summary>
                <div className="px-5 pb-4 pt-2 text-sm leading-relaxed border-t text-[#9a9a9a] border-[#2a2a2a]">{a}</div>
              </details>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-black mb-4 text-white">Autres calculs RH Congo</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { href: '/outils/calcul-its-congo', icon: '', label: 'Calcul ITS 2026' },
              { href: '/outils/calcul-cnss-congo', icon: '', label: 'Calcul CNSS' },
              { href: '/outils/calcul-camu-congo', icon: '', label: 'Calcul CAMU' },
              { href: '/simulateur', icon: '', label: 'Simulateur complet' },
            ].map(l => (
              <Link key={l.href} href={l.href}
                className="flex items-center gap-2 p-3 border rounded-xl hover:border-[#FF9A62] transition-all text-sm font-bold bg-[#161616] border-[#2a2a2a] hover:bg-[#FF9A62]/10 text-[#d6d6d6]">
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