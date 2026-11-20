// ============================================================================
// 📁 app/qui-sommes-nous/page.tsx — Konza RH · À propos
// Même esprit que l'accueil. Photo du fondateur : déposer le fichier
//    public/about/fondateur.jpg   (portrait, 4:5 environ)
// ============================================================================
'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';

const ACCENT = '#FF9A62';
const FOUNDER_PHOTO = '/about/fondateur.jpg';

const VALUES = [
  {
    title: 'Le Congo d’abord',
    desc: 'Nous sommes à Pointe-Noire. Les coupures internet, les délais CNSS, les particularités du CGI congolais : nous les connaissons. Konza RH est conçu pour ici, pas adapté depuis l’étranger.',
  },
  {
    title: 'Des calculs fiables',
    desc: 'Les calculs suivent les textes en vigueur, et les barèmes sont mis à jour à chaque révision légale. Notre objectif : zéro surprise fiscale.',
  },
  {
    title: 'Vos données vous appartiennent',
    desc: 'Chiffrement TLS 1.3, serveurs sécurisés, journal d’audit complet. Vos données de paie ne sont jamais revendues ni partagées.',
  },
  {
    title: 'Simplicité avant tout',
    desc: 'Une DRH qui ouvre Konza RH doit pouvoir lancer une paie sans formation. Si ce n’est pas évident, on redessine. La complexité reste dans le moteur, pas dans l’interface.',
  },
];

const SUPPORT = [
  {
    title: 'Veille juridique et fiscale',
    desc: 'Suivi du droit du travail congolais, du CGI et des règles CNSS, pour que les barèmes restent à jour à chaque révision légale.',
  },
  {
    title: 'Formation et migration',
    desc: 'Formation de vos équipes RH à Pointe-Noire et Brazzaville, reprise de vos données existantes et support en français.',
  },
];

// ─── Photo du fondateur (cadre vide tant que le fichier n'existe pas) ────────
function FounderPhoto() {
  const [status, setStatus] = useState<'pending' | 'ok' | 'error'>('pending');
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = ref.current;
    if (img && img.complete) setStatus(img.naturalWidth > 0 ? 'ok' : 'error');
  }, []);

  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#1a1a1a]">
      {status !== 'ok' && (
        <div className="absolute inset-3 flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/20 text-center text-[13px] text-white/55">
          <span>Photo à ajouter</span>
          <code className="px-3 font-mono text-[11px]" style={{ color: ACCENT }}>public{FOUNDER_PHOTO}</code>
        </div>
      )}
      {status !== 'error' && (
        <img
          ref={ref}
          src={FOUNDER_PHOTO}
          alt="Nathan Bondoma Sogoya, fondateur de Konza RH"
          onLoad={() => setStatus('ok')}
          onError={() => setStatus('error')}
          className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-300 ${
            status === 'ok' ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 text-[13px] font-semibold uppercase tracking-[0.12em]" style={{ color: ACCENT }}>
      {children}
    </div>
  );
}

function IconArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

export default function AboutPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050607] font-sans text-[#F2F2F2]">
      <Navbar />

      {/* ── Titre ── */}
      <section className="relative px-6 pb-20 pt-36 text-center">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(55% 60% at 50% 0%, rgba(247,135,75,.12), transparent 70%)' }}
        />
        <div className="relative mx-auto max-w-3xl">
          <Eyebrow>Qui sommes-nous</Eyebrow>
          <h1 className="text-[40px] font-bold leading-[1.05] tracking-[-0.03em] sm:text-[62px]">
            Fabriqué à Pointe-Noire.
            <br />
            <span style={{ color: ACCENT }}>Pour le Congo entier.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-[18px] leading-relaxed text-[#9a9a9a]">
            Konza RH est né d’un constat simple : les logiciels RH existants ne sont pas pensés pour la fiscalité
            congolaise. On a décidé de construire celui qui manquait.
          </p>
        </div>
      </section>

      {/* ── Histoire + fondateur ── */}
      <section className="border-t border-white/[0.06] px-6 py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.2fr_0.8fr] lg:gap-20">
          <div>
            <Eyebrow>Notre histoire</Eyebrow>
            <h2 className="text-[30px] font-semibold leading-[1.15] tracking-[-0.02em] sm:text-[40px]">
              Le problème qu’on a vécu avant de le résoudre
            </h2>
            <div className="mt-8 flex flex-col gap-5 text-[16px] leading-[1.8] text-[#9a9a9a]">
              <p>
                En travaillant avec des entreprises locales, le constat était toujours le même : les DRH passaient
                plusieurs jours par mois sur la paie, entre Excel, calculatrice et CNSS à la main. Les erreurs coûtaient
                cher, les redressements fiscaux aussi.
              </p>
              <p>
                Les solutions internationales ? Sans connaissance du CGI congolais, sans intégration CNSS, sans quotient
                familial. Et souvent inutilisables avec une connexion 3G.
              </p>
              <p>
                Konza RH a été conçu de zéro, à Pointe-Noire, avec une obsession : que la paie soit juste, rapide et
                simple, sans être ingénieur pour l’utiliser.
              </p>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[360px]">
            <FounderPhoto />
            <div className="mt-5">
              <div className="text-[17px] font-semibold">Nathan Bondoma Sogoya</div>
              <div className="mt-0.5 text-[14px] font-medium" style={{ color: ACCENT }}>Fondateur et développeur full-stack</div>
              <p className="mt-3 text-[14px] leading-relaxed text-[#9a9a9a]">
                Développeur basé à Pointe-Noire, concepteur de Konza RH de la base de données jusqu’à l’interface.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Valeurs ── */}
      <section className="border-t border-white/[0.06] px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <Eyebrow>Nos valeurs</Eyebrow>
          <h2 className="max-w-xl text-[30px] font-semibold leading-[1.15] tracking-[-0.02em] sm:text-[40px]">
            Ce qui guide chaque décision
          </h2>
          <div className="mt-14 grid gap-x-12 gap-y-10 sm:grid-cols-2">
            {VALUES.map((v, i) => (
              <div key={v.title} className="border-t border-white/10 pt-6">
                <div className="mb-3 font-mono text-[12px]" style={{ color: ACCENT }}>{String(i + 1).padStart(2, '0')}</div>
                <h3 className="mb-2.5 text-[19px] font-semibold">{v.title}</h3>
                <p className="text-[15px] leading-relaxed text-[#9a9a9a]">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Accompagnement ── */}
      <section className="border-t border-white/[0.06] px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <Eyebrow>Accompagnement</Eyebrow>
          <h2 className="max-w-xl text-[30px] font-semibold leading-[1.15] tracking-[-0.02em] sm:text-[40px]">
            Pas seulement un logiciel
          </h2>
          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.08] sm:grid-cols-2">
            {SUPPORT.map((s) => (
              <div key={s.title} className="bg-[#0c0c0d] p-8">
                <h3 className="mb-2.5 text-[18px] font-semibold">{s.title}</h3>
                <p className="text-[15px] leading-relaxed text-[#9a9a9a]">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Appel final ── */}
      <section className="relative overflow-hidden border-t border-white/[0.06] px-6 py-24 text-center">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(50% 60% at 50% 100%, rgba(247,135,75,.12), transparent 70%)' }}
        />
        <div className="relative mx-auto max-w-xl">
          <h2 className="text-[30px] font-bold leading-[1.15] tracking-[-0.025em] sm:text-[42px]">
            Prêt à essayer <span style={{ color: ACCENT }}>Konza RH</span> ?
          </h2>
          <p className="mt-4 text-[17px] leading-relaxed text-[#9a9a9a]">
            30 jours d’essai gratuit, sans carte bancaire. Support en français.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <Link
              href="/auth/register"
              className="flex items-center gap-2 rounded-xl bg-[#FAFAFA] px-8 py-3.5 text-[15px] font-semibold text-black transition-colors hover:bg-white"
            >
              Démarrer gratuitement <IconArrow />
            </Link>
            <Link
              href="/contact"
              className="rounded-xl border border-white/10 px-8 py-3.5 text-[15px] font-semibold text-[#F2F2F2] transition-colors hover:border-white/25 hover:bg-white/[0.04]"
            >
              Nous contacter
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}