// ============================================================================
// 📁 app/outils/calcul-its-congo/page.tsx
// 🎯 Cible : "calcul ITS Congo 2026", "barème ITS Congo", "impôt salaire Congo"
// ✅ Server Component : metadata + JSON-LD FAQPage + WebApplication
// ✅ Calculateur client-side inline
// ============================================================================
import type { Metadata } from 'next';
import ItsCalculatorClient from './ItsCalculatorClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://konza.cg';

export const metadata: Metadata = {
  title: 'Calcul ITS Congo 2026 — Barème progressif, Abattement, Parts fiscales',
  description:
    'Calculez l\'ITS (Impôt sur les Traitements et Salaires) au Congo-Brazzaville 2026. Barème officiel Ordonnance n°2025-44 : 5 tranches, abattement 20%, quotient familial jusqu\'à 6,5 parts. Gratuit et instantané.',
  alternates: { canonical: `${SITE_URL}/outils/calcul-its-congo` },
  keywords: [
    'calcul ITS Congo 2026', 'ITS Congo Brazzaville', 'barème ITS Congo',
    'impôt traitement salaire Congo', 'calcul IRPP Congo', 'abattement ITS 20% Congo',
    'quotient familial Congo', 'parts fiscales Congo', 'Ordonnance 2025-44 Congo',
    'ITS progressif Congo', 'tranche imposition Congo salaire',
  ].join(', '),
  openGraph: {
    title: 'Calcul ITS Congo 2026 — Barème officiel + Simulateur gratuit',
    description: 'Simulez votre ITS 2026 : barème 5 tranches, abattement 20%, quotient familial. Conforme Ordonnance n°2025-44.',
    url: `${SITE_URL}/outils/calcul-its-congo`,
    type: 'website',
    images: [{ url: `${SITE_URL}/og/calcul-its.png`, width: 1200, height: 630 }],
  },
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Quelle est la différence entre l\'ITS 2026 et l\'ancien IRPP au Congo ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'L\'ITS remplace l\'IRPP depuis le 1er janvier 2026 (Ordonnance n°2025-44). Le nouveau barème ITS 2026 comporte 5 tranches : forfait 1 200 FCFA (0–615 000 FCFA), 10% (615 001–1 500 000 FCFA), 15% (1 500 001–3 500 000 FCFA), 20% (3 500 001–5 000 000 FCFA), 30% (au-delà de 5 000 000 FCFA). L\'ancien IRPP avait 4 tranches : 1% (0–464 000 FCFA), 10%, 25%, 40%. L\'abattement de 20% reste identique pour les deux régimes.',
      },
    },
    {
      '@type': 'Question',
      name: 'Comment fonctionne l\'abattement de 20% pour l\'ITS Congo ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'L\'abattement de 20% s\'applique sur le salaire brut après déduction de la CNSS salariale (4%). Le résultat est le Revenu Net Imposable (RNI). Formule : RNI mensuel = (Brut − CNSS) × 80%. Ce RNI est ensuite annualisé (× 12) avant d\'être divisé par le nombre de parts fiscales pour obtenir la base du barème.',
      },
    },
    {
      '@type': 'Question',
      name: 'Le quotient familial s\'applique-t-il à l\'ITS 2026 ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Oui. Contrairement à ce qui était initialement annoncé, le quotient familial est maintenu en ITS 2026 (confirmation PaySpace Congo, février 2026). Les parts sont : 1 part (célibataire sans enfant), 2 parts (marié sans enfant), +0,5 part par enfant pour un marié, +1 part pour le 1er enfant d\'un célibataire puis +0,5 par enfant. Plafond : 6,5 parts.',
      },
    },
    {
      '@type': 'Question',
      name: 'Quel est le taux effectif d\'ITS pour un salaire de 400 000 FCFA au Congo ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Pour un salaire brut de 400 000 FCFA, célibataire sans enfant : CNSS = 16 000 FCFA, base imposable = 304 000 FCFA, RNI mensuel = 304 000 × 80% = 243 200 FCFA, RNI annuel = 2 918 400 FCFA. Barème : 1 200 FCFA (forfait) + (1 500 000 − 615 000) × 10% + (2 918 400 − 1 500 000) × 15% = 1 200 + 88 500 + 212 760 = 302 460 FCFA/an. ITS mensuel = ceil(302 460/12) = 25 205 FCFA. Taux effectif ≈ 6,6%.',
      },
    },
    {
      '@type': 'Question',
      name: 'Quand l\'ITS Congo est-il arrondi à la hausse ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'L\'ITS mensuel est toujours arrondi à l\'entier supérieur (Math.ceil) conformément à la pratique fiscale congolaise. Exemple : si le calcul donne 25 204,58 FCFA, l\'ITS retenu sera 25 205 FCFA.',
      },
    },
  ],
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Outils RH', item: `${SITE_URL}/outils` },
    { '@type': 'ListItem', position: 3, name: 'Calcul ITS 2026', item: `${SITE_URL}/outils/calcul-its-congo` },
  ],
};

const webAppJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Calculateur ITS Congo-Brazzaville 2026',
  description: 'Calculez l\'ITS (Impôt sur les Traitements et Salaires) au Congo 2026 avec le barème officiel de l\'Ordonnance n°2025-44.',
  url: `${SITE_URL}/outils/calcul-its-congo`,
  applicationCategory: 'FinanceApplication',
  isAccessibleForFree: true,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'XAF' },
  provider: { '@type': 'Organization', name: 'Konza RH', url: SITE_URL },
};

export default function CalcItsPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
      <ItsCalculatorClient />
    </>
  );
}