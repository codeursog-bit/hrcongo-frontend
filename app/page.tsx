// ============================================================================
// 📁 app/page.tsx — Accueil Konza RH
// Même esprit que la page de connexion : sobre, fond sombre, un seul accent
// orange. Les captures s'affichent dès que les fichiers existent :
//    public/login/dashboard.png   et   public/login/bulletin.png
// (les mêmes que celles de la page de connexion).
// ============================================================================
'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';

const ACCENT = '#FF9A62';
const SHOT_DASHBOARD = { label: 'Tableau de bord', src: '/login/dashboard.png' };
const SHOT_BULLETIN = { label: 'Bulletin de paie', src: '/login/bulletin.png' };

// Phrases qui défilent sous le titre (toutes les 5 s, mot par mot)
const TAGLINES = [
  'L’ère du numérique est là : vos RH aussi passent au digital.',
  'Fini les fichiers éparpillés : tout vit au même endroit.',
  'Encore sur Excel pour vos RH ? Il existe mieux.',
  'Automatisez tous vos processus RH, une bonne fois pour toutes.',
];

function IconArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

// ─── Cadre de capture (placeholder tant que le fichier n'existe pas) ─────────
function ShotFrame({
  label, src, className, position,
}: { label: string; src: string; className: string; position: string }) {
  const [status, setStatus] = useState<'pending' | 'ok' | 'error'>('pending');
  const ref = useRef<HTMLImageElement>(null);

  // L'image peut avoir fini de charger (ou d'échouer) avant l'hydratation.
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete) setStatus(img.naturalWidth > 0 ? 'ok' : 'error');
  }, []);

  return (
    <figure
      className={`m-0 flex flex-col overflow-hidden rounded-xl border border-white/10 bg-[#1a1a1a] shadow-[0_26px_50px_-26px_rgba(0,0,0,0.8)] ${className}`}
    >
      <figcaption className="shrink-0 border-b border-white/[0.08] bg-[#222] px-3 py-2 text-[11.5px] font-semibold text-white/70">
        {label}
      </figcaption>
      <div className="relative min-h-0 flex-1">
        {status !== 'ok' && (
          <div className="absolute inset-2.5 flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/20 text-center text-[12px] text-white/55">
            <span>Capture à ajouter</span>
            <code className="break-all px-2 font-mono text-[10.5px]" style={{ color: ACCENT }}>
              public{src}
            </code>
          </div>
        )}
        {status !== 'error' && (
          <img
            ref={ref}
            src={src}
            alt={`Aperçu : ${label}`}
            onLoad={() => setStatus('ok')}
            onError={() => setStatus('error')}
            className={`absolute inset-0 h-full w-full bg-white object-cover transition-opacity duration-300 ${position} ${
              status === 'ok' ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}
      </div>
    </figure>
  );
}

// ─── Phrase qui change toutes les 5 s, mot par mot ───────────────────────────
function RotatingLine() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setIndex((v) => (v + 1) % TAGLINES.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      aria-live="polite"
      style={{ display: 'grid', marginTop: 36, paddingLeft: 14, borderLeft: `2px solid ${ACCENT}` }}
    >
      {TAGLINES.map((text, n) => {
        const on = n === index;
        return (
          <p
            key={n}
            aria-hidden={!on}
            style={{ gridArea: '1 / 1', alignSelf: 'center', margin: 0, fontSize: 16, lineHeight: 1.55, color: 'rgba(242,242,242,.82)' }}
          >
            {text.split(' ').map((w, i) => (
              <React.Fragment key={i}>
                <span
                  style={{
                    display: 'inline-block',
                    opacity: on ? 1 : 0,
                    transform: on ? 'none' : 'translateY(8px)',
                    transition: on
                      ? `opacity .5s ease ${i * 90}ms, transform .5s ease ${i * 90}ms`
                      : 'opacity .2s ease, transform .2s ease',
                  }}
                >
                  {w}
                </span>{' '}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

// ─── Titre de section ────────────────────────────────────────────────────────
function SectionHead({
  eyebrow, title, description, center = false,
}: { eyebrow: string; title: React.ReactNode; description?: string; center?: boolean }) {
  return (
    <div className={center ? 'mx-auto max-w-2xl text-center' : 'max-w-xl'}>
      <div className="mb-4 text-[13px] font-semibold uppercase tracking-[0.12em]" style={{ color: ACCENT }}>
        {eyebrow}
      </div>
      <h2 className="text-[32px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#F2F2F2] sm:text-[44px]">
        {title}
      </h2>
      {description && <p className="mt-4 text-[17px] leading-relaxed text-[#9a9a9a]">{description}</p>}
    </div>
  );
}

// ─── HERO ────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#050607] px-6 pb-20 pt-32 lg:pt-36">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(60% 50% at 90% 0%, rgba(247,135,75,.14), transparent 70%)' }}
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1fr_1.05fr]">
        <div>
          <h1 className="text-[42px] font-bold leading-[1.05] tracking-[-0.03em] text-[#F2F2F2] sm:text-[60px]">
            Le futur de la <span style={{ color: ACCENT }}>gestion RH</span>
          </h1>
          <p className="mt-6 max-w-[520px] text-[18px] leading-relaxed text-[#9a9a9a]">
            Paie, congés, présences, recrutement et contrats : tout se gère dans un seul outil, pensé pour les
            entreprises congolaises.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/auth/register"
              className="flex items-center gap-2 rounded-xl bg-[#FAFAFA] px-7 py-3.5 text-[15px] font-medium text-black transition-colors hover:bg-white"
            >
              Démarrer gratuitement <IconArrow />
            </Link>
            <Link
              href="/contact"
              className="rounded-xl border border-white/10 px-7 py-3.5 text-[15px] font-medium text-[#F2F2F2] transition-colors hover:border-white/20 hover:bg-white/[0.04]"
            >
              Demander une démo
            </Link>
          </div>
          <p className="mt-4 text-[13px] text-[#6f6f6f]">
            30 jours d’essai gratuit · Sans carte bancaire · Support en français
          </p>

          <RotatingLine />
        </div>

        {/* Captures de l'application */}
        <div className="relative h-[380px] sm:h-[460px] lg:h-[520px]">
          <ShotFrame {...SHOT_DASHBOARD} position="object-left-top" className="absolute left-0 top-0 z-[1] h-[86%] w-[84%]" />
          <ShotFrame {...SHOT_BULLETIN} position="object-top" className="absolute bottom-0 right-0 z-[2] h-[84%] w-[38%]" />
        </div>
      </div>
    </section>
  );
}

// ─── FONCTIONNALITÉS ─────────────────────────────────────────────────────────
// Une fonctionnalité qui a une `shot` s'affiche en grande ligne avec sa capture
// (alternance gauche / droite). Sans `shot`, elle reste dans la grille « Et aussi ».
// Pour ajouter une image à une fonctionnalité : ajoutez simplement une `shot`.
//   landscape → capture 16:10 (écran large)      portrait → capture 3:4 (document)
type Feature = {
  kicker: string;
  title: string;
  desc: string;
  points?: string[];
  shot?: { label: string; src: string; shape: 'landscape' | 'portrait' };
};

const FEATURES: Feature[] = [
  {
    kicker: 'Paie',
    title: 'Paie automatique',
    desc: 'Les bulletins de tous vos employés sont calculés en une seule opération, selon les barèmes en vigueur au Congo.',
    points: ['CNSS, ITS, TUS et abattement calculés', 'Quotient familial, primes et retenues', 'Bulletins PDF pour toute l’entreprise'],
    shot: { label: 'Bulletin de paie', src: '/features/bulletin.png', shape: 'portrait' },
  },
  {
    kicker: 'CNSS',
    title: 'Déclaration CNSS',
    desc: 'L’état nominatif des salaires est généré chaque mois, prêt à être déposé.',
    points: ['Format CNSS Congo', 'Cotisations calculées employé par employé', 'Rappels avant la date limite'],
    shot: { label: 'Déclaration CNSS', src: '/features/cnss.png', shape: 'landscape' },
  },
  {
    kicker: 'Terrain',
    title: 'Pointage GPS multi-sites',
    desc: 'Vos équipes pointent depuis leur téléphone, où qu’elles travaillent.',
    points: ['Périmètre configurable par site', 'Alertes de retard et d’absence', 'Historique consultable par les RH'],
    shot: { label: 'Pointage', src: '/features/pointage.png', shape: 'landscape' },
  },
  {
    kicker: 'Congés',
    title: 'Congés et absences',
    desc: 'Fini les tableaux de suivi : les demandes, les validations et les soldes se font en ligne.',
    points: ['Validation hiérarchique', 'Soldes sur 26 jours ouvrables', 'Jours fériés congolais intégrés'],
    shot: { label: 'Congés', src: '/features/conges.png', shape: 'landscape' },
  },
  // ── sans capture pour l'instant ──
  {
    kicker: 'Réglementation',
    title: 'Réglementation intégrée',
    desc: 'Barèmes du Code Général des Impôts 2025–2026, mis à jour à chaque révision légale, avec des alertes quand quelque chose change.',
  },
  {
    kicker: 'Finance',
    title: 'Prêts, avances et acomptes',
    desc: 'Plafonds légaux vérifiés, remboursement déduit chaque mois sur le bulletin, historique complet par employé.',
  },
  {
    kicker: 'Recrutement',
    title: 'Recrutement et intégration',
    desc: 'Page carrière, candidatures, entretiens, puis passage direct du candidat retenu dans la paie.',
  },
  {
    kicker: 'Départ',
    title: 'Rupture de contrat',
    desc: 'Indemnités, préavis et solde de tout compte calculés selon le Code du Travail, documents de sortie en PDF.',
  },
];

function FeatureRow({ feat, reverse }: { feat: Feature; reverse: boolean }) {
  const shot = feat.shot!;
  const portrait = shot.shape === 'portrait';
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <div className={reverse ? 'lg:order-2' : ''}>
        <div className="mb-3 text-[13px] font-semibold uppercase tracking-[0.12em]" style={{ color: ACCENT }}>
          {feat.kicker}
        </div>
        <h3 className="text-[28px] font-semibold leading-tight tracking-[-0.02em] text-[#F2F2F2] sm:text-[34px]">
          {feat.title}
        </h3>
        <p className="mt-4 max-w-[480px] text-[16px] leading-relaxed text-[#9a9a9a]">{feat.desc}</p>
        {feat.points && (
          <ul className="mt-6 flex flex-col gap-3">
            {feat.points.map((pt) => (
              <li key={pt} className="flex items-start gap-3 text-[15px] text-[#d6d6d6]">
                <span className="mt-[9px] h-px w-4 shrink-0" style={{ background: ACCENT }} />
                {pt}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div
        className={`rounded-2xl border border-white/[0.08] p-6 sm:p-9 ${reverse ? 'lg:order-1' : ''}`}
        style={{ background: 'radial-gradient(80% 70% at 50% 0%, rgba(247,135,75,.10), transparent 70%), #0c0c0d' }}
      >
        <ShotFrame
          label={shot.label}
          src={shot.src}
          position={portrait ? 'object-top' : 'object-left-top'}
          className={portrait ? 'relative mx-auto h-[420px] w-[310px] max-w-full' : 'relative aspect-[16/10] w-full'}
        />
      </div>
    </div>
  );
}

function FeaturesSection() {
  const withShot = FEATURES.filter((f) => f.shot);
  const without = FEATURES.filter((f) => !f.shot);

  return (
    <section id="fonctionnalites" className="border-t border-white/[0.06] bg-[#050607] px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHead
          eyebrow="Fonctionnalités"
          title="Tout ce qu’il faut pour gérer vos RH"
          description="De la fiche employé au bulletin de paie, dans un seul outil."
        />

        <div className="mt-16 flex flex-col gap-20 lg:gap-24">
          {withShot.map((feat, i) => (
            <FeatureRow key={feat.title} feat={feat} reverse={i % 2 === 1} />
          ))}
        </div>

        {without.length > 0 && (
          <>
            <div className="mb-6 mt-24 text-[13px] font-semibold uppercase tracking-[0.12em] text-[#6f6f6f]">Et aussi</div>
            <div className="grid gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.08] sm:grid-cols-2 lg:grid-cols-4">
              {without.map((f) => (
                <div key={f.title} className="flex flex-col gap-3 bg-[#0c0c0d] p-7">
                  <span className="text-[12px] font-semibold uppercase tracking-[0.1em]" style={{ color: ACCENT }}>
                    {f.kicker}
                  </span>
                  <h3 className="text-[17px] font-semibold leading-snug text-[#F2F2F2]">{f.title}</h3>
                  <p className="text-[14px] leading-relaxed text-[#9a9a9a]">{f.desc}</p>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="mt-14 flex flex-col items-center gap-4 text-center">
          <p className="text-[16px] text-[#9a9a9a]">Toutes les fonctionnalités sont incluses dans l’essai gratuit de 30 jours.</p>
          <Link
            href="/auth/register"
            className="flex items-center gap-2 rounded-xl bg-[#FAFAFA] px-8 py-3.5 text-[15px] font-medium text-black transition-colors hover:bg-white"
          >
            Essayer gratuitement <IconArrow />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── POURQUOI KONZA ──────────────────────────────────────────────────────────
function WhyUs() {
  const points = [
    { title: 'Pensé pour le droit congolais', desc: 'CNSS, ITS, TUS, quotient familial et jours fériés du Congo sont intégrés dès le départ.' },
    { title: 'Léger sur le terrain', desc: 'Optimisé pour les connexions 3G/4G locales, avec une application mobile légère.' },
    { title: 'Sécurisé', desc: 'Double authentification, sessions sécurisées et journal d’audit de chaque action.' },
    { title: 'Entreprises et cabinets', desc: 'Gérez un groupe d’entreprises ou un portefeuille de clients depuis un seul compte.' },
  ];
  return (
    <section className="border-t border-white/[0.06] bg-[#050607] px-6 py-24">
      <div className="mx-auto grid max-w-6xl items-start gap-14 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <div className="mb-4 text-[13px] font-semibold uppercase tracking-[0.12em]" style={{ color: ACCENT }}>
            Pourquoi Konza RH
          </div>
          <h2 className="text-[32px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#F2F2F2] sm:text-[44px]">
            Conçu pour la réalité congolaise.
          </h2>
          <p className="mt-6 max-w-[480px] text-[17px] leading-relaxed text-[#9a9a9a]">
            La plupart des logiciels RH sont faits pour l’Europe. Konza RH est construit dès le départ pour les
            règles fiscales, sociales et pratiques du Congo-Brazzaville.
          </p>
        </div>
        <div className="grid gap-x-10 gap-y-9 sm:grid-cols-2">
          {points.map((p) => (
            <div key={p.title} className="border-t border-white/10 pt-5">
              <h3 className="mb-2 text-[16px] font-semibold text-[#F2F2F2]">{p.title}</h3>
              <p className="text-[14px] leading-relaxed text-[#9a9a9a]">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── COMMENT ÇA MARCHE ───────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { title: 'Créez votre compte', desc: 'Renseignez votre entreprise (RCCM, CNSS, secteur). Les paramètres fiscaux s’appliquent selon votre activité.' },
    { title: 'Importez vos employés', desc: 'Import Excel ou saisie manuelle : contrats, salaires de base, primes et parts fiscales.' },
    { title: 'Lancez la paie', desc: 'Indiquez les variables du mois (absences, heures supplémentaires, primes) et générez tous les bulletins d’un coup.' },
    { title: 'Exportez et distribuez', desc: 'Bulletins PDF, export comptable et déclaration CNSS prêts à déposer.' },
  ];
  return (
    <section className="border-t border-white/[0.06] bg-[#050607] px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHead eyebrow="Comment ça marche" title="Opérationnel en quatre étapes." />
        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.title}>
              <div
                className="mb-5 flex h-10 w-10 items-center justify-center rounded-full border text-[15px] font-semibold"
                style={{ borderColor: `${ACCENT}66`, color: ACCENT }}
              >
                {i + 1}
              </div>
              <h3 className="mb-2 text-[17px] font-semibold text-[#F2F2F2]">{s.title}</h3>
              <p className="text-[14px] leading-relaxed text-[#9a9a9a]">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    q: 'Est-ce conforme à la fiscalité congolaise ?',
    a: 'Konza RH applique les barèmes IRPP/ITS avec abattement de 20 %, la CNSS salariale (4 %) et patronale (20,28 %), la Taxe Unique sur les Salaires (TUS) et le quotient familial, selon le Code Général des Impôts 2025-2026. Les barèmes sont mis à jour à chaque révision légale.',
  },
  {
    q: 'Combien de temps pour générer les bulletins de toute l’entreprise ?',
    a: 'Les bulletins sont générés en une seule opération, en quelques minutes selon l’effectif. Les variables du mois (absences, primes, heures supplémentaires) sont prises en compte automatiquement, et l’export CNSS est préparé en même temps.',
  },
  {
    q: 'Peut-on utiliser Konza RH pour plusieurs entreprises ?',
    a: 'Oui. Le plan Enterprise et le mode Cabinet permettent de gérer plusieurs entités depuis un seul compte. Chaque entreprise garde ses propres paramètres fiscaux, ses employés et ses bulletins. Les experts-comptables peuvent gérer tout leur portefeuille clients.',
  },
  {
    q: 'Comment fonctionne le pointage GPS ?',
    a: 'Chaque employé installe l’application mobile et pointe à son arrivée et à son départ. Le système compare sa position au périmètre autorisé du site (configurable en mètres). Les retards et absences sont signalés automatiquement aux RH.',
  },
  {
    q: 'Comment la rupture de contrat est-elle gérée ?',
    a: 'Konza RH calcule les indemnités légales de fin de contrat selon le Code du Travail congolais : licenciement, préavis, congés payés non pris, solde de tout compte. Les documents de sortie (attestation de travail, reçu pour solde de tout compte) sont générés en PDF.',
  },
  {
    q: 'La déclaration CNSS est-elle générée automatiquement ?',
    a: 'Oui. Chaque mois, Konza RH produit l’état nominatif des salaires au format CNSS Congo, avec les cotisations salariales (4 %) et patronales (20,28 %) calculées employé par employé. Des rappels sont envoyés avant la date limite.',
  },
  {
    q: 'Quels modes de paiement sont acceptés ?',
    a: 'MTN Mobile Money, Airtel Money et virement bancaire. Aucune carte Visa ou Mastercard n’est requise. La facturation est mensuelle, sans engagement minimum.',
  },
  {
    q: 'Mes données sont-elles sécurisées ?',
    a: 'Vos données sont hébergées sur des serveurs PostgreSQL sécurisés (Neon.tech), chiffrées au repos et en transit (TLS 1.3). L’accès est protégé par la double authentification, des sessions sécurisées et un journal d’audit de chaque action.',
  },
];

function FaqList() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="flex flex-col">
      {FAQ_ITEMS.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q} className="border-t border-white/10 last:border-b">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 py-5 text-left"
            >
              <span className="text-[16px] font-medium leading-snug text-[#F2F2F2]">{item.q}</span>
              <svg
                width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2.5"
                className={`shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`}
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
            {isOpen && <p className="pb-6 pr-8 text-[14.5px] leading-relaxed text-[#9a9a9a]">{item.a}</p>}
          </div>
        );
      })}
    </div>
  );
}

function FaqSection() {
  return (
    <section className="border-t border-white/[0.06] bg-[#050607] px-6 py-24">
      <div className="mx-auto grid max-w-6xl items-start gap-14 lg:grid-cols-[1fr_1.6fr]">
        <div>
          <div className="mb-4 text-[13px] font-semibold uppercase tracking-[0.12em]" style={{ color: ACCENT }}>FAQ</div>
          <h2 className="mb-5 text-[32px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#F2F2F2] sm:text-[44px]">
            Questions fréquentes
          </h2>
          <p className="mb-8 max-w-[380px] text-[17px] leading-relaxed text-[#9a9a9a]">
            Une autre question ? Écrivez-nous, nous répondons sous 24 h.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-[14px] font-semibold"
            style={{ borderColor: `${ACCENT}66`, color: ACCENT }}
          >
            Contacter le support <IconArrow />
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
    <section className="relative overflow-hidden border-t border-white/[0.06] bg-[#050607] px-6 py-28">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(50% 60% at 50% 100%, rgba(247,135,75,.12), transparent 70%)' }}
      />
      <div className="relative mx-auto max-w-2xl text-center">
        <h2 className="text-[36px] font-bold leading-[1.1] tracking-[-0.025em] text-[#F2F2F2] sm:text-[54px]">
          Passez d’Excel <span style={{ color: ACCENT }}>au digital.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-[18px] leading-relaxed text-[#9a9a9a]">
          30 jours d’essai gratuit, sans engagement et sans carte bancaire.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/auth/register"
            className="flex items-center gap-2.5 rounded-xl bg-[#FAFAFA] px-9 py-4 text-[16px] font-semibold text-black transition-colors hover:bg-white"
          >
            Commencer gratuitement <IconArrow />
          </Link>
          <Link
            href="/contact"
            className="rounded-xl border border-white/10 px-8 py-4 text-[16px] font-semibold text-[#F2F2F2] transition-colors hover:border-white/20 hover:bg-white/[0.04]"
          >
            Demander une démo
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── PAGE ────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050607] font-sans text-[#F2F2F2]">
      {/* Balisage FAQ pour que Google puisse afficher l'accordéon dans les résultats */}
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
      <FeaturesSection />
      <WhyUs />
      <HowItWorks />
      <FaqSection />
      <FinalCta />
      <Footer />
    </div>
  );
}