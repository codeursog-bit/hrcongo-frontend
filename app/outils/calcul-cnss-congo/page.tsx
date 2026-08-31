// ============================================================================
// 📁 app/outils/calcul-cnss-congo/page.tsx
// 🎯 Cible : "calcul CNSS Congo", "taux CNSS Congo 2026", "cotisation CNSS Congo"
// ============================================================================
import type { Metadata } from 'next';
import CnssCalculatorClient from './CnssCalculatorClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://konza.cg';

export const metadata: Metadata = {
  title: 'Calcul CNSS Congo 2026 — Taux salarié & employeur, plafonds officiels',
  description:
    'Calculez vos cotisations CNSS au Congo-Brazzaville 2026. Salarié : 4% (plaf. 1 200 000 FCFA). Employeur : pensions 8% + famille 10,03% + accidents 2,25%. Exemples chiffrés, tableaux et explications simples.',
  alternates: { canonical: `${SITE_URL}/outils/calcul-cnss-congo` },
  keywords: [
    'calcul CNSS Congo 2026', 'taux CNSS Congo Brazzaville', 'cotisation CNSS employeur Congo',
    'CNSS salarié Congo', 'plafond CNSS Congo', 'déclaration CNSS Congo', 'CNSS pension Congo',
    'cotisations sociales Congo', 'charges patronales Congo', 'CNSS accidents travail Congo',
  ].join(', '),
  openGraph: {
    title: 'Calcul CNSS Congo 2026 — Salarié + Employeur + Plafonds',
    description: 'Taux CNSS 2026, plafonds, exemples chiffrés. Salarié 4% · Employeur 20,28% · Calcul instantané.',
    url: `${SITE_URL}/outils/calcul-cnss-congo`,
    type: 'website',
    images: [{ url: `${SITE_URL}/og/calcul-cnss.png`, width: 1200, height: 630 }],
  },
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Quel est le taux CNSS salarié au Congo en 2026 ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Le taux CNSS salarié au Congo-Brazzaville est de 4% du salaire brut, plafonné à 1 200 000 FCFA. Pour un salaire de 400 000 FCFA, la CNSS salariale est de 16 000 FCFA.',
      },
    },
    {
      '@type': 'Question',
      name: 'Quelles sont les cotisations CNSS patronales au Congo ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'L\'employeur verse 3 cotisations CNSS : pensions/vieillesse/invalidité 8% (plafond 1 200 000 FCFA), prestations familiales 10,03% (plafond 600 000 FCFA), accidents du travail 2,25% (plafond 600 000 FCFA). Soit environ 20,28% de charges patronales CNSS sur le brut.',
      },
    },
    {
      '@type': 'Question',
      name: 'Quand faut-il déclarer et payer la CNSS au Congo ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Le bordereau mensuel CNSS doit être déposé et le paiement effectué avant le 15 de chaque mois pour les cotisations du mois précédent. Les entreprises s\'acquittent de ce bordereau auprès de la CNSS Congo (www.cnss.cg).',
      },
    },
    {
      '@type': 'Question',
      name: 'Que se passe-t-il si on ne paie pas la CNSS au Congo ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Le non-paiement ou le retard de CNSS expose l\'employeur à une majoration de 10% par mois de retard. Un redressement peut être opéré sur 3 ans. L\'entreprise peut également perdre l\'accès aux marchés publics si elle n\'est pas en règle.',
      },
    },
    {
      '@type': 'Question',
      name: 'La CNSS au Congo est-elle la même que le TUS ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Non. La CNSS et le TUS sont deux obligations distinctes. La CNSS couvre la protection sociale (retraite, famille, accidents). Le TUS (Taxe Unique sur les Salaires) de 7,5% est une taxe fiscale versée à la DGI et à la CNSS. Les deux s\'ajoutent au coût employeur.',
      },
    },
  ],
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Accueil',   item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Outils RH', item: `${SITE_URL}/outils` },
    { '@type': 'ListItem', position: 3, name: 'Calcul CNSS Congo', item: `${SITE_URL}/outils/calcul-cnss-congo` },
  ],
};

export default function CalcCnssPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <CnssCalculatorClient />
    </>
  );
}