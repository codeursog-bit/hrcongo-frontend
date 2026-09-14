// ============================================================================
// 📁 app/page.tsx — Konza RH Landing Page
// Dark mode · Tailwind · Palette monochrome + un seul accent (or)
// ============================================================================
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';

const ACCENT = '#10B981'; // vert émeraude du logo — accent principal
const AMBER = '#F59E0B'; // ambre du logo — réservé aux étoiles de notation, rien d'autre

// ─── Icônes ──────────────────────────────────────────────────────────────────
function IconArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
function IconPlay() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
function IconClock() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function IconShield() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function IconZap() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
function IconStar() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={AMBER}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

// ─── Bloc réutilisable : label "// section" ─────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto mb-6 w-fit rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-[13px] text-[#8B8F98] sm:mx-0">
      {children}
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  center = false,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: string;
  center?: boolean;
}) {
  return (
    <div className={center ? 'mx-auto max-w-2xl text-center' : 'max-w-xl'}>
      <SectionLabel>{eyebrow}</SectionLabel>
      <h2 className="text-[32px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#FAFAFA] sm:text-[44px]">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-[17px] leading-relaxed text-[#8B8F98]">
          {description}
        </p>
      )}
    </div>
  );
}

function StatCard({ value, label, icon }: { value: string; label: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-white/[0.08] bg-[#0B0C0F] px-6 py-7 text-center">
      {icon && <div className="mb-1 text-[#8B8F98]">{icon}</div>}
      <div className="font-mono text-3xl font-medium tracking-[-0.02em] text-[#FAFAFA]">{value}</div>
      <div className="text-[13px] text-[#8B8F98]">{label}</div>
    </div>
  );
}

// ─── HERO ────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#050607] px-6 pb-20 pt-32">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-white/[0.04] blur-[130px]" />
        <div className="absolute -left-40 bottom-0 h-[500px] w-[500px] rounded-full bg-[#10B981]/[0.06] blur-[130px]" />
      </div>
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative z-10 w-full max-w-3xl text-center">
        <div className="mx-auto mb-7 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-[13px] text-[#8B8F98]">
          <span style={{ color: ACCENT }}>
            <IconZap />
          </span>
          Conforme CGI Congo · Fiscalité 2025–2026
        </div>

        <h1 className="text-[40px] font-semibold leading-[1.08] tracking-[-0.03em] text-[#FAFAFA] sm:text-[64px]">
          Gérez votre paie
          <br />
          sans erreur, sans stress.
        </h1>

        <p className="mx-auto mt-6 max-w-[600px] text-[18px] leading-relaxed text-[#8B8F98]">
          Konza RH automatise la paie, les congés, le pointage GPS et le recrutement —{' '}
          <strong className="font-semibold text-[#FAFAFA]">
            100% conforme au Code Général des Impôts congolais.
          </strong>
          <br />
          La seule solution RH conçue pour les entreprises du Congo-Brazzaville.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/auth/register"
            className="flex items-center gap-2 rounded-xl bg-[#FAFAFA] px-8 py-4 text-[16px] font-medium text-black transition-colors hover:bg-white"
          >
            Démarrer gratuitement
            <IconArrow />
          </Link>
          <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-7 py-4 text-[16px] font-medium text-[#FAFAFA] transition-colors hover:border-white/20 hover:bg-white/[0.06]">
            <IconPlay />
            Voir la démo
          </button>
        </div>

        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard value="< 3 min" label="500 bulletins générés" icon={<IconClock />} />
          <StatCard value="100%" label="Conformité CNSS & IRPP" icon={<IconShield />} />
          <StatCard value="24 / 7" label="Support en français" icon={<IconZap />} />
        </div>
      </div>

      <div className="relative z-10 mx-auto mt-16 w-full max-w-4xl">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0B0C0F] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.6)]">
          <div className="flex h-10 items-center gap-2 border-b border-white/[0.06] px-4">
            <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
          </div>
          <div className="relative h-[420px] overflow-hidden sm:h-[500px]">
            {/* Remplacez par votre vraie capture : /screenshots/dashboard-konza.png */}
            <img
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1400&q=80"
              alt="Dashboard Konza RH — aperçu"
              className="h-full w-full object-cover brightness-[0.5] saturate-[0.7]"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#050607]/60" />

            <div className="absolute right-6 top-6 rounded-xl border border-white/10 bg-[#0B0C0F]/90 px-4 py-3.5 backdrop-blur-md">
              <div className="mb-1 text-[11px] text-[#8B8F98]">Paie du mois</div>
              <div className="font-mono text-xl font-medium text-[#FAFAFA]">
                47,3M <span style={{ color: ACCENT }} className="text-[12px]">FCFA</span>
              </div>
              <div className="mt-1 text-[11px] text-[#8B8F98]">↑ 312 bulletins générés</div>
            </div>

            <div className="absolute bottom-6 left-6 rounded-xl border border-white/10 bg-[#0B0C0F]/90 px-4 py-3.5 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: ACCENT }} />
                <span className="text-[12px] font-medium" style={{ color: ACCENT }}>
                  Conformité validée
                </span>
              </div>
              <div className="mt-1 text-[11px] text-[#8B8F98]">CNSS · IRPP/ITS · CGI 2025</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── LOGOS / SOCIAL PROOF ────────────────────────────────────────────────────
function LogosStrip() {
  const names = ['TOTAL Energies', 'BTP Congo', 'Pharmacie Elite', 'Groupe Bolloré', 'Cabinet Juridique RDC', 'Mining Corp CG'];
  return (
    <section className="border-y border-white/[0.06] bg-[#050607] px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <p className="mb-8 text-center text-[13px] uppercase tracking-[0.08em] text-[#5A5E66]">
          Déjà utilisé par des entreprises à Pointe-Noire & Brazzaville
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
          {names.map((name) => (
            <div key={name} className="whitespace-nowrap text-[13px] font-semibold uppercase tracking-[0.05em] text-[#5A5E66]">
              {name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FEATURES ────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    id: 'paie', group: 'big', tag: 'Core',
    title: 'Paie automatique & conforme',
    hook: '500 bulletins en moins de 3 minutes.',
    desc: 'Calculs CNSS, IRPP/ITS et TUS appliqués automatiquement selon le CGI 2025-2026. Abattement 20%, quotient familial, primes, retenues — zéro erreur, zéro redressement fiscal.',
    img: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=75',
    imgAlt: 'Paie automatique Konza RH',
    pills: ['CNSS 4% + 20.28%', 'IRPP / ITS', 'Quotient familial', 'Bulletins PDF'],
  },
  {
    id: 'conformite', group: 'big', tag: 'Légal',
    title: 'Conformité légale garantie',
    hook: 'Le CGI 2025-2026 appliqué automatiquement.',
    desc: "Barèmes mis à jour à chaque révision légale. Déclarations CNSS prêtes à soumettre. TUS, abattement 20%, parts fiscales — rien n'est oublié. Dormez tranquille.",
    img: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=900&q=75',
    imgAlt: 'Conformité fiscale Congo',
    pills: ['CGI 2025-2026', 'Déclaration CNSS', 'TUS inclus', 'Alertes légales'],
  },
  {
    id: 'pointage', group: 'big', tag: 'Terrain',
    title: 'Pointage GPS multi-sites',
    hook: 'Votre équipe pointe depuis son téléphone.',
    desc: 'Géolocalisation en temps réel, périmètre configurable par site, alertes retard et absence automatiques. Historique infalsifiable, accessible en un clic pour la DRH.',
    img: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=900&q=75',
    imgAlt: 'Pointage GPS mobile Congo',
    pills: ['Géolocalisation live', 'Multi-sites', 'Alertes retard', 'Historique intégral'],
  },
  {
    id: 'conges', group: 'big', tag: 'RH',
    title: 'Congés & absences simplifiés',
    hook: 'Fini les tableaux Excel de suivi.',
    desc: 'Demandes en ligne, validation hiérarchique, soldes calculés sur 26 jours ouvrables, jours fériés congolais intégrés. RTT, maladie, maternité — tout est automatique.',
    img: 'https://images.unsplash.com/photo-1506784365847-bbad939e9335?auto=format&fit=crop&w=900&q=75',
    imgAlt: 'Gestion congés Congo',
    pills: ['Validation hiérarchique', '26 j. ouvrables', 'Jours fériés CG', 'Soldes auto'],
  },
  {
    id: 'prets', group: 'compact', tag: 'Finance',
    title: 'Prêts, avances & acomptes',
    hook: 'Sans risque légal, remboursement automatique.',
    desc: 'Plafonds légaux validés automatiquement. Remboursements déduits chaque mois sur la fiche de paie. Historique complet par employé.',
    img: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=700&q=75',
    imgAlt: 'Prêts avances employés',
    pills: ['Plafonds légaux', 'Remboursement auto'],
  },
  {
    id: 'recrutement', group: 'compact', tag: 'Talent',
    title: 'Recrutement & onboarding',
    hook: "De l'offre à la première fiche de paie.",
    desc: 'Page carrière personnalisée, gestion des candidatures, entretiens planifiés, intégration directe dans la paie dès le recrutement.',
    img: 'https://images.unsplash.com/photo-1521737852567-6949f3f9f2b5?auto=format&fit=crop&w=700&q=75',
    imgAlt: 'Recrutement onboarding',
    pills: ['Page carrière custom', 'ATS intégré'],
  },
  {
    id: 'rupture', group: 'compact', tag: 'Légal',
    title: 'Rupture de contrat',
    hook: 'Calculs de fin de contrat sans erreur.',
    desc: 'Indemnités légales, préavis, solde de tout compte — calculés automatiquement selon le Code du Travail congolais. Documents de sortie PDF générés en 1 clic.',
    img: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=700&q=75',
    imgAlt: 'Rupture contrat travail Congo',
    pills: ['Indemnités légales', 'Documents de sortie'],
  },
  {
    id: 'cnss', group: 'compact', tag: 'Déclaration',
    title: 'Déclaration CNSS automatique',
    hook: 'Plus jamais de retard de déclaration.',
    desc: 'État nominatif des salaires généré chaque mois au format CNSS Congo. Rappels de délais, historique des soumissions, cotisations calculées employé par employé.',
    img: 'https://images.unsplash.com/photo-1560472355-536de3962603?auto=format&fit=crop&w=700&q=75',
    imgAlt: 'Déclaration CNSS Congo',
    pills: ['Export CNSS CG', 'Rappels délais'],
  },
];

function FBigCard({ feat, reverse }: { feat: (typeof FEATURES)[0]; reverse?: boolean }) {
  return (
    <div
      className={`group grid overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0B0C0F] transition-colors hover:border-white/[0.16] md:min-h-[340px] ${
        reverse ? 'md:grid-cols-[1fr_1.15fr]' : 'md:grid-cols-[1.15fr_1fr]'
      }`}
    >
      <div className={`flex flex-col justify-center gap-4 p-8 sm:p-11 ${reverse ? 'md:order-2' : 'md:order-1'}`}>
        <span
          className="w-fit rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em]"
          style={{ color: ACCENT, borderColor: `${ACCENT}40`, background: `${ACCENT}14` }}
        >
          {feat.tag}
        </span>
        <h3 className="text-[24px] font-semibold leading-tight tracking-[-0.02em] text-[#FAFAFA] sm:text-[28px]">
          {feat.title}
        </h3>
        <p className="text-[15px] font-medium leading-snug" style={{ color: ACCENT }}>
          {feat.hook}
        </p>
        <p className="max-w-[400px] text-[14px] leading-relaxed text-[#8B8F98]">{feat.desc}</p>
        <div className="mt-1 flex flex-wrap gap-2">
          {feat.pills.map((p) => (
            <span
              key={p}
              className="rounded-md border px-3 py-1 text-[12px] font-medium text-[#8B8F98]"
              style={{ borderColor: 'rgba(255,255,255,0.1)' }}
            >
              {p}
            </span>
          ))}
        </div>
      </div>

      <div
        className={`relative min-h-[220px] overflow-hidden border-white/[0.08] ${
          reverse ? 'md:order-1 md:border-r' : 'md:order-2 md:border-l'
        }`}
      >
        <img
          src={feat.img}
          alt={feat.imgAlt}
          className="absolute inset-0 h-full w-full object-cover brightness-[0.55] saturate-[0.75] transition-transform duration-500 group-hover:scale-105"
        />
        <div
          className={`absolute inset-0 ${
            reverse
              ? 'bg-gradient-to-r from-transparent via-transparent to-[#0B0C0F]'
              : 'bg-gradient-to-l from-transparent via-transparent to-[#0B0C0F]'
          }`}
        />
      </div>
    </div>
  );
}

function FCompactCard({ feat }: { feat: (typeof FEATURES)[0] }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0B0C0F] transition-colors hover:border-white/[0.16]">
      <div className="relative h-[190px] shrink-0 overflow-hidden">
        <img
          src={feat.img}
          alt={feat.imgAlt}
          className="h-full w-full object-cover brightness-50 saturate-[0.7] transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C0F] via-transparent to-transparent" />
        <span
          className="absolute left-3.5 top-3.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] backdrop-blur-md"
          style={{ color: ACCENT, borderColor: `${ACCENT}40`, background: 'rgba(5,6,7,0.7)' }}
        >
          {feat.tag}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-6">
        <h3 className="text-[17px] font-semibold leading-snug tracking-[-0.01em] text-[#FAFAFA]">{feat.title}</h3>
        <p className="text-[13.5px] font-medium leading-snug" style={{ color: ACCENT }}>{feat.hook}</p>
        <p className="text-[13.5px] leading-relaxed text-[#8B8F98]">{feat.desc}</p>
        <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
          {feat.pills.map((p) => (
            <span key={p} className="rounded-md border border-white/10 px-2.5 py-1 text-[11px] font-medium text-[#8B8F98]">
              {p}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeaturesSection() {
  const bigCards = FEATURES.filter((f) => f.group === 'big');
  const compactCards = FEATURES.filter((f) => f.group === 'compact');

  return (
    <section id="fonctionnalites" className="bg-[#050607] px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          center
          eyebrow="// Fonctionnalités"
          title={<>Une suite RH complète,<br />conçue pour le Congo</>}
          description="De la fiche employé au bulletin de paie — tout en un, conforme au Code Général des Impôts congolais."
        />

        <div className="mt-14 flex flex-col gap-5">
          {bigCards.map((feat, i) => (
            <FBigCard key={feat.id} feat={feat} reverse={i % 2 === 1} />
          ))}
        </div>

        <div className="my-16 -mx-6 border-y border-white/[0.06] bg-white/[0.02] px-6 py-10 text-center">
          <p className="mb-2 text-[12px] uppercase tracking-[0.1em] text-[#5A5E66]">
            Et aussi — parce que les détails font la différence
          </p>
          <p className="text-[19px] font-semibold tracking-[-0.01em] text-[#FAFAFA]">
            Gestion de bout en bout, <span style={{ color: ACCENT }}>sans exception.</span>
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {compactCards.map((feat) => (
            <FCompactCard key={feat.id} feat={feat} />
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center gap-4 text-center">
          <p className="max-w-[460px] text-[16px] text-[#8B8F98]">
            Toutes les fonctionnalités incluses dans votre essai gratuit de 14 jours.
          </p>
          <Link
            href="/auth/register"
            className="flex items-center gap-2 rounded-xl bg-[#FAFAFA] px-8 py-3.5 text-[15px] font-medium text-black transition-colors hover:bg-white"
          >
            Essayer gratuitement — sans carte bancaire
            <IconArrow />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── WHY US ──────────────────────────────────────────────────────────────────
function WhyUs() {
  const points = [
    { icon: '⚖', title: 'Code du Travail congolais natif', desc: 'Barèmes CNSS, IRPP, TUS, quotient familial — mis à jour à chaque révision légale.' },
    { icon: '🌍', title: 'Fonctionnel sans infrastructure avancée', desc: 'Optimisé pour les connexions 3G/4G locales. Application mobile légère pour le terrain.' },
    { icon: '🔐', title: '2FA & Sécurité enterprise', desc: 'Authentification à deux facteurs, sessions sécurisées, audit log complet de chaque action.' },
    { icon: '🏢', title: 'Multi-entreprises & Cabinets', desc: "Gérez un groupe d'entreprises ou un portefeuille de clients comptables depuis un seul compte." },
  ];
  const stats = [
    { val: '50+', label: 'Entreprises actives' },
    { val: '2 000+', label: 'Employés gérés' },
    { val: '99 %', label: 'Satisfaction client' },
    { val: '< 3 min', label: 'Pour 500 bulletins' },
  ];

  return (
    <section className="border-t border-white/[0.06] bg-[#050607] px-6 py-24">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 lg:grid-cols-2">
        <div>
          <SectionLabel>// Pourquoi Konza RH ?</SectionLabel>
          <h2 className="text-[32px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#FAFAFA] sm:text-[44px]">
            Conçu pour la réalité
            <br />
            congolaise.
          </h2>
          <p className="mt-6 max-w-[560px] text-[17px] leading-relaxed text-[#8B8F98]">
            La plupart des logiciels RH sont faits pour l'Europe ou les États-Unis. Konza RH est le
            premier — et seul — système conçu nativement pour les spécificités fiscales, sociales et
            opérationnelles du Congo-Brazzaville.
          </p>
          <div className="mt-9 flex flex-col gap-5">
            {points.map(({ icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="mt-0.5 text-[22px]">{icon}</div>
                <div>
                  <div className="mb-1 text-[15px] font-semibold text-[#FAFAFA]">{title}</div>
                  <div className="text-[14px] leading-relaxed text-[#8B8F98]">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/[0.08] bg-[#0B0C0F] p-10">
          <h3 className="mb-8 text-center text-[20px] font-semibold text-[#FAFAFA]">En chiffres</h3>
          <div className="mb-8 grid grid-cols-2 gap-5">
            {stats.map(({ val, label }) => (
              <div key={label} className="rounded-xl bg-white/[0.03] p-5 text-center">
                <div className="text-[28px] font-semibold tracking-[-0.02em] text-[#FAFAFA]">{val}</div>
                <div className="mt-1.5 text-[12px] text-[#8B8F98]">{label}</div>
              </div>
            ))}
          </div>
          <div className="border-t border-white/[0.08] pt-6 text-center">
            <div className="mb-2.5 flex justify-center gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <IconStar key={i} />
              ))}
            </div>
            <p className="text-[13px] italic leading-relaxed text-[#8B8F98]">
              "Konza RH nous a économisé 3 jours par mois sur la paie. Les bulletins sont conformes, la
              DRH est sereine."
            </p>
            <p className="mt-2 text-[12px] text-[#5A5E66]">— Directeur Administratif, groupe industriel à PNR</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── HOW IT WORKS ────────────────────────────────────────────────────────────
function TimelineStep({ num, title, desc, last }: { num: string; title: string; desc: string; last?: boolean }) {
  return (
    <div className="flex gap-6">
      <div className="flex flex-col items-center">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[16px] font-semibold text-black"
          style={{ background: ACCENT }}
        >
          {num}
        </div>
        {!last && <div className="min-h-[48px] w-px flex-1 bg-white/10" />}
      </div>
      <div className={last ? 'pb-0 pt-2' : 'pb-12 pt-2'}>
        <h4 className="mb-2 text-[17px] font-semibold text-[#FAFAFA]">{title}</h4>
        <p className="text-[14px] leading-relaxed text-[#8B8F98]">{desc}</p>
      </div>
    </div>
  );
}

function HowItWorks() {
  const processSteps = [
    { step: 'Configuration', desc: "RCCM · CNSS · Secteur d'activité · Règles fiscales", status: 'done' as const },
    { step: 'Employés importés', desc: '48 employés · 3 départements · Contrats configurés', status: 'done' as const },
    { step: 'Variables du mois', desc: '3 absences · 5 heures supp · 2 primes exceptionnelles', status: 'progress' as const },
    { step: 'Bulletins générés', desc: '48 bulletins PDF · Export SAGE · Déclaration CNSS', status: 'pending' as const },
  ];

  return (
    <section className="border-t border-white/[0.06] bg-[#050607] px-6 py-24">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-16 lg:grid-cols-2">
        <div>
          <SectionLabel>// Comment ça marche</SectionLabel>
          <h2 className="mb-10 text-[32px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#FAFAFA] sm:text-[44px]">
            Opérationnel
            <br />
            en moins d'une heure.
          </h2>
          <div className="flex flex-col">
            <TimelineStep
              num="1"
              title="Créez votre compte gratuitement"
              desc="Saisissez les infos de votre entreprise (RCCM, CNSS, secteur). Nos paramètres fiscaux s'appliquent automatiquement selon votre activité."
            />
            <TimelineStep
              num="2"
              title="Importez vos employés"
              desc="Import Excel en 1 clic ou saisie manuelle. Contrats, salaires de base, primes, parts fiscales — tout est configuré en quelques minutes."
            />
            <TimelineStep
              num="3"
              title="Lancez votre première paie"
              desc="Définissez les variables du mois (absences, heures supp, primes exceptionnelles) et générez tous les bulletins en moins de 3 minutes."
            />
            <TimelineStep
              num="4"
              title="Exportez & distribuez"
              last
              desc="Bulletins PDF signés électroniquement, export comptable (SAGE, CIEL), déclaration CNSS prête à déposer. Tout est prêt."
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {processSteps.map(({ step, desc, status }) => (
            <div
              key={step}
              className="flex items-center gap-4 rounded-xl border bg-[#0B0C0F] px-5 py-4.5"
              style={{ borderColor: status === 'done' ? `${ACCENT}40` : 'rgba(255,255,255,0.08)' }}
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                style={{
                  background: status === 'pending' ? 'rgba(255,255,255,0.04)' : `${ACCENT}20`,
                  color: status === 'pending' ? '#8B8F98' : ACCENT,
                }}
              >
                {status === 'done' ? (
                  <IconCheck />
                ) : status === 'progress' ? (
                  <IconClock />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <div className={`mb-0.5 text-[14px] font-semibold ${status === 'pending' ? 'text-[#8B8F98]' : 'text-[#FAFAFA]'}`}>
                  {step}
                </div>
                <div className="text-[12px] text-[#8B8F98]">{desc}</div>
              </div>
              {status === 'progress' && (
                <div
                  className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style={{ color: ACCENT, background: `${ACCENT}18` }}
                >
                  En cours
                </div>
              )}
            </div>
          ))}

          <div className="flex items-center justify-between rounded-xl border px-5 py-5" style={{ borderColor: `${ACCENT}30`, background: `${ACCENT}0D` }}>
            <div>
              <div className="mb-1 text-[13px] text-[#8B8F98]">Masse salariale totale</div>
              <div className="text-[26px] font-semibold text-[#FAFAFA]">
                47 318 400 <span className="text-[13px]" style={{ color: ACCENT }}>FCFA</span>
              </div>
            </div>
            <div className="text-right">
              <div className="mb-1 text-[12px] font-semibold" style={{ color: ACCENT }}>✓ Conforme CGI</div>
              <div className="text-[11px] text-[#8B8F98]">CNSS · IRPP · TUS calculés</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── TESTIMONIALS ────────────────────────────────────────────────────────────
function TestiCard({ quote, name, role, company }: { quote: string; name: string; role: string; company: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0B0C0F] p-7">
      <div className="mb-4 flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <IconStar key={i} />
        ))}
      </div>
      <p className="mb-5 text-[14px] italic leading-relaxed text-[#8B8F98]">"{quote}"</p>
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full text-[14px] font-semibold text-black"
          style={{ background: ACCENT }}
        >
          {name[0]}
        </div>
        <div>
          <div className="text-[14px] font-semibold text-[#FAFAFA]">{name}</div>
          <div className="text-[12px] text-[#8B8F98]">{role} · {company}</div>
        </div>
      </div>
    </div>
  );
}

function Testimonials() {
  return (
    <section className="border-t border-white/[0.06] bg-[#050607] px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading center eyebrow="// Témoignages" title="Ce qu'ils disent de nous" />
        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
          <TestiCard
            quote="Avant Konza RH, notre DRH passait 4 jours sur la paie chaque mois. Maintenant c'est 2 heures. Les bulletins sont conformes et nos employés reçoivent leurs fiches le 25 sans exception."
            name="Marie-Claire N."
            role="Directrice Administrative"
            company="Groupe BTP Pointe-Noire"
          />
          <TestiCard
            quote="Le pointage GPS a changé notre gestion des chantiers. On sait exactement qui est présent, on n'a plus de disputes sur les absences. La CNSS est calculée automatiquement, c'est un gain de temps énorme."
            name="Franck O."
            role="DRH"
            company="Entreprise de construction, Brazzaville"
          />
          <TestiCard
            quote="En tant que cabinet comptable, je gère 12 clients avec Konza RH. La clôture groupée me fait économiser 3 jours de travail par mois. Le module d'import/export vers SAGE est parfait."
            name="Dr. Paul M."
            role="Expert-Comptable"
            company="Cabinet PM & Associés"
          />
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    q: 'Est-ce vraiment conforme à la fiscalité congolaise ?',
    a: "Oui, à 100%. Konza RH applique les barèmes IRPP/ITS avec abattement de 20%, le CNSS salarial (4%) et patronal (20.28%), la Taxe Unique sur les Salaires (TUS), et le quotient familial — selon le Code Général des Impôts 2025-2026. Les barèmes sont mis à jour automatiquement à chaque révision légale.",
  },
  {
    q: 'Combien de temps pour générer les bulletins de 500 employés ?',
    a: "Moins de 3 minutes. Notre moteur de calcul traite les 500 fiches en parallèle, génère les PDF et prépare l'export CNSS en quelques minutes. Les variables exceptionnelles du mois (absences, primes, heures sup) sont prises en compte automatiquement.",
  },
  {
    q: 'Peut-on utiliser Konza RH pour plusieurs entreprises ?',
    a: 'Oui. Le plan Enterprise et le mode Cabinet comptable permettent de gérer plusieurs entités légales depuis un seul compte. Chaque entreprise a ses propres paramètres fiscaux, ses employés et ses bulletins. Les experts-comptables peuvent gérer tout leur portefeuille clients.',
  },
  {
    q: 'Comment fonctionne le pointage GPS ?',
    a: "Chaque employé installe l'application mobile et pointe à son arrivée/départ. Le système vérifie sa position GPS en temps réel et la compare au périmètre autorisé (configurable en mètres par site). Les retards et absences sont signalés automatiquement au RH.",
  },
  {
    q: 'Comment Konza RH gère-t-il la rupture de contrat ?',
    a: 'Konza RH calcule automatiquement toutes les indemnités légales de fin de contrat selon le Code du Travail congolais : indemnité de licenciement, préavis, congés payés non pris, solde de tout compte. Les documents de sortie (attestation de travail, reçu pour solde de tout compte) sont générés en PDF prêts à signer.',
  },
  {
    q: 'La déclaration CNSS est-elle générée automatiquement ?',
    a: "Oui. Chaque mois, Konza RH produit automatiquement l'état nominatif des salaires au format requis par la CNSS Congo, avec les cotisations salariales (4%) et patronales (20.28%) calculées employé par employé. Vous n'avez plus qu'à déposer le fichier. Des rappels de délai sont envoyés avant la date limite.",
  },
  {
    q: 'Quels modes de paiement sont acceptés ?',
    a: 'MTN Mobile Money, Airtel Money, et virement bancaire. Aucune carte Visa/Mastercard n\'est requise. La facturation est mensuelle, sans engagement minimum.',
  },
  {
    q: 'Mes données sont-elles sécurisées ?',
    a: "Vos données sont hébergées sur des serveurs PostgreSQL sécurisés (Neon.tech), chiffrées au repos et en transit (TLS 1.3). L'accès est protégé par 2FA, sessions sécurisées, et un audit log complet de chaque action. Conformité RGPD incluse.",
  },
];

function FaqList() {
  const [open, setOpen] = useState<number | null>(null);
  const items = FAQ_ITEMS;

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={i}
            className="overflow-hidden rounded-xl border bg-[#0B0C0F] transition-colors"
            style={{ borderColor: isOpen ? `${ACCENT}50` : 'rgba(255,255,255,0.08)' }}
          >
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4.5 text-left"
            >
              <span className="text-[15px] font-medium leading-snug text-[#FAFAFA]">{item.q}</span>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke={ACCENT}
                strokeWidth="2.5"
                className={`shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`}
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
            {isOpen && (
              <div className="border-t border-white/[0.06] px-5 pb-5 pt-4 text-[14px] leading-relaxed text-[#8B8F98]">
                {item.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function FaqSection() {
  return (
    <section className="border-t border-white/[0.06] bg-[#050607] px-6 py-24">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-16 lg:grid-cols-[1fr_1.5fr]">
        <div>
          <SectionLabel>// FAQ</SectionLabel>
          <h2 className="mb-5 text-[32px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#FAFAFA] sm:text-[44px]">
            Questions fréquentes
          </h2>
          <p className="mb-8 max-w-[420px] text-[17px] leading-relaxed text-[#8B8F98]">
            Vous avez d'autres questions ? Notre équipe vous répond sous 24h.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-[14px] font-semibold"
            style={{ borderColor: `${ACCENT}40`, color: ACCENT }}
          >
            Contacter le support
            <IconArrow />
          </Link>
        </div>
        <FaqList />
      </div>
    </section>
  );
}

// ─── CTA FINAL ───────────────────────────────────────────────────────────────
function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-[#050607] px-6 py-28">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.04] blur-[130px]" />
      <div className="relative mx-auto max-w-2xl text-center">
        <SectionLabel>// Prêt à commencer ?</SectionLabel>
        <h2 className="text-[36px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#FAFAFA] sm:text-[56px]">
          Simplifiez votre paie.
          <br />
          Dès aujourd'hui.
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-[18px] leading-relaxed text-[#8B8F98]">
          Rejoignez les DRH congolais qui ont choisi la sérénité. 14 jours d'essai gratuit, sans
          engagement, sans carte bancaire.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/auth/register"
            className="flex items-center gap-2.5 rounded-xl bg-[#FAFAFA] px-9 py-4 text-[16px] font-semibold text-black transition-colors hover:bg-white"
          >
            Commencer gratuitement
            <IconArrow />
          </Link>
          <Link
            href="/contact"
            className="flex items-center gap-2 rounded-xl border border-white/10 px-8 py-4 text-[16px] font-semibold text-[#FAFAFA] transition-colors hover:border-white/20 hover:bg-white/[0.03]"
          >
            Demander une démo
          </Link>
        </div>
        <p className="mt-6 text-[13px] text-[#5A5E66]">
          ✓ Sans carte bancaire &nbsp;·&nbsp; ✓ Configuration en 30 min &nbsp;·&nbsp; ✓ Support en français
        </p>
      </div>
    </section>
  );
}

// ─── PAGE ────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).style.opacity = '1';
            (e.target as HTMLElement).style.transform = 'translateY(0)';
          }
        }),
      { threshold: 0.08 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050607] font-sans text-[#FAFAFA]">
      {/* Balisage FAQ — pour que Google puisse afficher l'accordéon directement
          dans les résultats de recherche (rich snippet) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQ_ITEMS.map((item) => ({
              '@type': 'Question',
              name: item.q,
              acceptedAnswer: { '@type': 'Answer', text: item.a },
            })),
          }),
        }}
      />
      <Navbar />
      <Hero />
      <LogosStrip />
      <FeaturesSection />
      <WhyUs />
      <HowItWorks />
      <Testimonials />
      <FaqSection />
      <FinalCta />
      <Footer />
    </div>
  );
}