// ============================================================================
// 📁 app/simulateur/page.tsx — Simulateur de paie Congo · SEO-first
// ✅ Metadata title/description/OG optimisés
// ✅ JSON-LD : WebApplication + FAQPage
// ✅ Calcul 100% client-side (pas d'API requise)
// ============================================================================
import type { Metadata } from 'next';
import SimulateurPublicPage from './SimulateurClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://konza.cg';

export const metadata: Metadata = {
  title: 'Calculateur Salaire Net Congo 2026 — ITS, CNSS, CAMU gratuit',
  description:
    'Calculez votre salaire net au Congo-Brazzaville 2026 : ITS barème progressif, CNSS 4%, TUS 7,5%, CAMU, heures supplémentaires, quotient familial. Conforme Ordonnance n°2025-44. Gratuit et instantané.',
  alternates: {
    canonical: `${SITE_URL}/simulateur`,
  },
  keywords: [
    'calculateur salaire net Congo',
    'simulateur paie Congo Brazzaville 2026',
    'calcul ITS Congo 2026',
    'ITS barème progressif Congo',
    'CNSS Congo salarié',
    'TUS Congo employeur',
    'CAMU Congo taux',
    'calcul salaire brut net Congo',
    'heures supplémentaires Congo',
    'quotient familial Congo',
    'abattement ITS Congo 20%',
    'SMIG Congo 2026',
  ].join(', '),
  openGraph: {
    title: 'Simulateur Salaire Net Congo-Brazzaville 2026 — ITS + CNSS + CAMU',
    description:
      'Calcul instantané et gratuit : salaire net, ITS 2026, CNSS, TUS, CAMU, heures sup, coût employeur. Conforme droit congolais.',
    url: `${SITE_URL}/simulateur`,
    type: 'website',
    images: [{ url: `${SITE_URL}/og/simulateur.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Simulateur Salaire Net Congo 2026',
    description: 'Calcul gratuit ITS + CNSS + CAMU + TUS — Conforme Ordonnance 2025-44',
    images: [`${SITE_URL}/og/simulateur.png`],
  },
};

// ── JSON-LD WebApplication ────────────────────────────────────────────────────
const webAppJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Simulateur de Salaire Net Congo-Brazzaville 2026',
  description:
    'Calculez votre salaire net au Congo-Brazzaville en 2026 : ITS barème progressif, CNSS, TUS, CAMU, heures supplémentaires, quotient familial.',
  url: `${SITE_URL}/simulateur`,
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web',
  inLanguage: 'fr-CG',
  isAccessibleForFree: true,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'XAF' },
  provider: {
    '@type': 'Organization',
    name: 'Konza RH',
    url: SITE_URL,
  },
  featureList: [
    'Calcul ITS 2026 (barème progressif 5 tranches)',
    'Calcul IRPP ancien barème (avant 2026)',
    'Calcul CNSS salarié et patronal',
    'Calcul TUS 7,5% (DGI + CNSS)',
    'Calcul CAMU et taxes personnalisées',
    'Heures supplémentaires (10/25/50/100%)',
    'Quotient familial (parts fiscales)',
    'Coût total employeur',
  ].join(', '),
  screenshot: `${SITE_URL}/og/simulateur.png`,
};

// ── JSON-LD FAQPage ───────────────────────────────────────────────────────────
const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Comment calculer le salaire net au Congo-Brazzaville en 2026 ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Le salaire net au Congo-Brazzaville s\'obtient en soustrayant du salaire brut : la CNSS salariale (4%, plafonnée à 1 200 000 FCFA) et l\'ITS 2026 (barème progressif : forfait 1 200 FCFA jusqu\'à 615 000 FCFA, puis 10% jusqu\'à 1 500 000 FCFA, 15% jusqu\'à 3 500 000 FCFA, 20% jusqu\'à 5 000 000 FCFA, 30% au-delà). Un abattement de 20% est appliqué avant le calcul de l\'ITS.',
      },
    },
    {
      '@type': 'Question',
      name: 'Qu\'est-ce que l\'ITS 2026 au Congo ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'L\'ITS (Impôt sur les Traitements et Salaires) remplace l\'IRPP depuis le 1er janvier 2026 en vertu de l\'Ordonnance n°2025-44 du 31 décembre 2025. Il s\'applique sur un barème progressif à 5 tranches sur le revenu net imposable annualisé, après abattement de 20%. Le quotient familial (parts fiscales) est maintenu : de 1 part pour un célibataire à 6,5 parts maximum.',
      },
    },
    {
      '@type': 'Question',
      name: 'Quel est le taux CNSS au Congo en 2026 ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'La CNSS au Congo en 2026 : côté salarié 4% plafonné à 1 200 000 FCFA. Côté employeur : pensions/vieillesse/invalidité 8% (plafond 1 200 000 FCFA), prestations familiales 10,03% (plafond 600 000 FCFA), accidents du travail 2,25% (plafond 600 000 FCFA).',
      },
    },
    {
      '@type': 'Question',
      name: 'Qu\'est-ce que le TUS au Congo-Brazzaville ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Le TUS (Taxe Unique sur les Salaires) est une charge patronale de 7,5% sur le salaire brut, répartie entre la DGI (2,025%) et la CNSS (5,475%). Elle s\'applique à toutes les entreprises assujetties et s\'ajoute aux cotisations CNSS patronales.',
      },
    },
    {
      '@type': 'Question',
      name: 'Quel est le taux CAMU au Congo ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'La CAMU (Caisse d\'Assurance Maladie Universelle) prélève 2,27% sur le salaire brut à la charge du salarié et 4,55% à la charge de l\'employeur, avec un plafond d\'assiette de 600 000 FCFA.',
      },
    },
    {
      '@type': 'Question',
      name: 'Quel est le SMIG au Congo-Brazzaville en 2026 ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Le SMIG (Salaire Minimum Interprofessionnel Garanti) est fixé à 70 400 FCFA par mois au Congo-Brazzaville.',
      },
    },
    {
      '@type': 'Question',
      name: 'Comment calculer les heures supplémentaires au Congo ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Selon le Décret 78-360, les heures supplémentaires au Congo sont majorées comme suit : +10% pour les 5 premières heures supplémentaires, +25% pour les heures suivantes, +50% pour les heures de nuit, de repos compensateur ou jours fériés, +100% pour les nuits du dimanche et jours fériés.',
      },
    },
    {
      '@type': 'Question',
      name: 'Comment fonctionne le quotient familial en ITS 2026 Congo ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Le quotient familial ITS 2026 attribue : 1 part pour un célibataire sans enfant, 2 parts pour un marié sans enfant, +0,5 part par enfant à charge pour les mariés, +1 part pour le 1er enfant d\'un célibataire puis +0,5 par enfant supplémentaire. Le maximum est de 6,5 parts.',
      },
    },
  ],
};

// ── BreadcrumbList ────────────────────────────────────────────────────────────
const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Simulateur de paie', item: `${SITE_URL}/simulateur` },
  ],
};

export default function SimulateurPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <SimulateurPublicPage />
    </>
  );
}