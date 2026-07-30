import type { Metadata } from 'next';
import CamuCalculatorClient from './CamuCalculatorClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://konza.cg';

export const metadata: Metadata = {
  title: 'Calcul CAMU Congo 2026 — Assurance Maladie, taux salarié & employeur',
  description:
    'Calculez la CAMU au Congo-Brazzaville 2026 : salarié 2,27% + employeur 4,55%, plafond 600 000 FCFA. Explications simples, exemples chiffrés. Conforme Loi n°37-2014.',
  alternates: { canonical: `${SITE_URL}/outils/calcul-camu-congo` },
  keywords: [
    'calcul CAMU Congo 2026','CAMU Congo Brazzaville','assurance maladie universelle Congo',
    'taux CAMU salarié employeur','CAMU 2.27% 4.55% Congo','plafond CAMU 600000 FCFA',
  ].join(', '),
  openGraph: {
    title: 'Calcul CAMU Congo 2026 — 2,27% salarié + 4,55% employeur',
    description: 'Calculez votre CAMU Congo : taux officiels, plafond 600 000 FCFA, exemple complet.',
    url: `${SITE_URL}/outils/calcul-camu-congo`,
    type: 'website',
    images: [{ url: `${SITE_URL}/og/calcul-camu.png`, width: 1200, height: 630 }],
  },
};

const faqJsonLd = {
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'Quel est le taux CAMU au Congo en 2026 ?',
      acceptedAnswer: { '@type': 'Answer', text: 'La CAMU prélève 2,27% du salaire brut côté salarié et 4,55% côté employeur. Les deux taux sont plafonnés à une assiette de 600 000 FCFA. Au-delà de 600 000 FCFA de salaire brut, les cotisations CAMU restent identiques.' }},
    { '@type': 'Question', name: 'La CAMU Congo est-elle obligatoire ?',
      acceptedAnswer: { '@type': 'Answer', text: 'Oui. La CAMU est obligatoire pour tous les salariés du secteur privé et public au Congo-Brazzaville depuis la Loi n°37-2014 modifiée par la Loi n°12-2023. Tout employeur doit afficher et déduire la cotisation CAMU sur les bulletins de paie.' }},
    { '@type': 'Question', name: 'À quoi sert la CAMU Congo ?',
      acceptedAnswer: { '@type': 'Answer', text: 'La CAMU finance les frais médicaux des travailleurs et de leurs familles (consultations, hospitalisations, médicaments). En cotisant à la CAMU, chaque assuré reçoit une carte CAMU qui lui donne accès aux soins dans les établissements conventionnés.' }},
    { '@type': 'Question', name: 'Comment déclarer la CAMU au Congo ?',
      acceptedAnswer: { '@type': 'Answer', text: 'Les cotisations CAMU sont déclarées et versées mensuellement, avant le 15 du mois suivant. La déclaration se fait auprès de la CAMU Congo, avec un bordereau mensuel similaire à celui de la CNSS. Le retard expose à une pénalité de 3%.' }},
  ],
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Outils RH', item: `${SITE_URL}/outils` },
    { '@type': 'ListItem', position: 3, name: 'Calcul CAMU Congo', item: `${SITE_URL}/outils/calcul-camu-congo` },
  ],
};

export default function CalcCamuPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <CamuCalculatorClient />
    </>
  );
}