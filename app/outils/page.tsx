// ============================================================================
// 📁 app/outils/page.tsx — Hub des outils RH Congo · SEO-first
// ✅ Page référence pour les requêtes "calcul X Congo"
// ✅ Chaque outil = une URL dédiée = une chance de se positionner
// ============================================================================
import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://konza-rh.cg';

export const metadata: Metadata = {
  title: 'Outils RH & Paie Congo 2026 — Calculateurs gratuits',
  description:
    'Calculateurs gratuits pour les entreprises congolaises : ITS 2026, CNSS, CAMU, TUS, heures supplémentaires, cotisations patronales. ',
  alternates: { canonical: `${SITE_URL}/outils` },
  openGraph: {
    title: 'Outils RH & Paie Congo 2026 — Calculateurs gratuits',
    description: 'ITS, CNSS, CAMU, TUS, heures sup — Tous les calculs RH Congo en un clic.',
    url: `${SITE_URL}/outils`,
    type: 'website',
    images: [{ url: `${SITE_URL}/og/outils.png`, width: 1200, height: 630, alt: 'Outils RH & Paie Congo' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Outils RH & Paie Congo 2026 — Calculateurs gratuits',
    description: 'ITS, CNSS, CAMU, TUS, heures sup — Tous les calculs RH Congo en un clic.',
    images: [`${SITE_URL}/og/outils.png`],
  },
};

const TOOLS = [
  {
    href: '/simulateur',
    title: 'Simulateur de paie complet',
    desc: 'Salaire brut → net + coût employeur. ITS, CNSS, TUS, CAMU, heures sup, primes, avances.',
    tags: ['ITS 2026', 'CNSS', 'TUS', 'CAMU'],
    featured: true,
  },
  {
    href: '/outils/calcul-its-congo',
    title: 'Calcul ITS 2026',
    desc: 'Barème progressif : 5 tranches, abattement 20 %, quotient familial. Ordonnance 2025-44.',
    tags: ['ITS 2026', 'Barème', 'Parts fiscales'],
  },
  {
    href: '/outils/calcul-cnss-congo',
    title: 'Calcul CNSS Congo',
    desc: 'CNSS salarié (4 %) et patronal (pensions 8 % + famille 10,03 % + AT 2,25 %). Plafonds 2026.',
    tags: ['CNSS', 'Cotisations', 'Plafonds'],
  },
  {
    href: '/outils/calcul-camu-congo',
    title: 'Calcul CAMU',
    desc: 'Assurance maladie universelle : 2,27 % salarié + 4,55 % employeur. Plafond 600 000 FCFA.',
    tags: ['CAMU', 'Assurance maladie'],
  },
  {
    href: '/outils/calcul-heures-supplementaires-congo',
    title: 'Calcul heures supplémentaires',
    desc: 'Majorations Décret 78-360 : +10 %, +25 %, +50 %, +100 %. Calcul sur taux horaire proratisé.',
    tags: ['HS', 'Majorations', 'Décret 78-360'],
  },
  {
    href: '/outils/calcul-tus-congo',
    title: 'Calcul TUS Congo',
    desc: 'Taxe Unique sur les Salaires 7,5 % : part DGI 2,025 % + part CNSS 5,475 %.',
    tags: ['TUS', 'DGI', 'Patronal'],
  },
];

// JSON-LD ItemList
const toolsJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Outils RH & Paie Congo-Brazzaville',
  description: 'Calculateurs gratuits pour les entreprises congolaises',
  url: `${SITE_URL}/outils`,
  numberOfItems: TOOLS.length,
  itemListElement: TOOLS.map((t, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: t.title,
    description: t.desc,
    url: `${SITE_URL}${t.href}`,
  })),
};

export default function OutilsPage() {
  const featured = TOOLS.find((t) => t.featured)!;
  const others = TOOLS.filter((t) => !t.featured);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(toolsJsonLd) }} />

      <div className="min-h-screen overflow-x-hidden bg-[#050607] font-sans text-[#F2F2F2]">
        <Navbar />

        {/* Titre */}
        <header className="relative px-6 pb-14 pt-36">
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(55% 60% at 20% 0%, rgba(247,135,75,.12), transparent 70%)' }}
          />
          <div className="relative mx-auto max-w-5xl">
            <div className="mb-4 text-[13px] font-semibold uppercase tracking-[0.12em] text-[#FF9A62]">Outils RH Congo-Brazzaville 2026</div>
            <h1 className="max-w-2xl text-[36px] font-bold leading-[1.08] tracking-[-0.03em] sm:text-[52px]">
              Calculateurs RH et paie <span className="text-[#FF9A62]">pour le Congo</span>
            </h1>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-[#9a9a9a]">
              Des outils gratuits pour calculer vos cotisations et impôts : ITS, CNSS, CAMU, TUS, heures supplémentaires.
            </p>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-6 pb-24">
          {/* Outil principal */}
          <Link
            href={featured.href}
            className="group mb-5 flex flex-col gap-4 rounded-2xl border border-[#FF9A62]/40 bg-[#0c0c0d] p-7 transition-colors hover:border-[#FF9A62] sm:flex-row sm:items-center sm:justify-between sm:p-9"
          >
            <div>
              <h2 className="mb-2 text-[24px] font-semibold tracking-[-0.01em]">{featured.title}</h2>
              <p className="max-w-xl text-[15px] leading-relaxed text-[#9a9a9a]">{featured.desc}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {featured.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-white/10 px-3 py-1 text-[12px] text-[#bdbdbd]">{tag}</span>
                ))}
              </div>
            </div>
            <span className="shrink-0 rounded-xl bg-[#FAFAFA] px-6 py-3 text-center text-[14px] font-semibold text-black transition-colors group-hover:bg-white">
              Lancer le simulateur
            </span>
          </Link>

          {/* Calculateurs */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="group flex flex-col rounded-2xl border border-white/[0.08] bg-[#0c0c0d] p-6 transition-colors hover:border-white/[0.18]"
              >
                <h2 className="mb-2 text-[18px] font-semibold leading-snug transition-colors group-hover:text-[#FF9A62]">{tool.title}</h2>
                <p className="mb-5 text-[14px] leading-relaxed text-[#9a9a9a]">{tool.desc}</p>
                <div className="mt-auto flex flex-wrap gap-2">
                  {tool.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-white/10 px-2.5 py-0.5 text-[11.5px] text-[#9a9a9a]">{tag}</span>
                  ))}
                </div>
              </Link>
            ))}
          </div>

          <p className="mt-12 max-w-2xl text-[13px] leading-relaxed text-[#6f6f6f]">
            Ces calculateurs donnent une estimation à partir des barèmes et taux indiqués. Pour une paie complète, avec bulletins
            et déclarations CNSS, <Link href="/auth/register" className="text-[#9a9a9a] underline underline-offset-4 hover:text-[#F2F2F2]">essayez Konza RH gratuitement</Link>.
          </p>
        </main>

        <Footer />
      </div>
    </>
  );
}