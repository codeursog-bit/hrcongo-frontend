import type { Metadata } from 'next';
import HeuresSupClient from './HeuresSupClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://konza.cg';

export const metadata: Metadata = {
  title: 'Calcul Heures Supplémentaires Congo 2026 — Majorations +10% +25% +50% +100%',
  description:
    'Calculez les heures supplémentaires au Congo-Brazzaville 2026. Majorations légales : +10% (5 premières heures), +25% (suivantes), +50% (nuit/férié), +100% (nuit dimanche/férié). Décret 78-360. Exemples simples.',
  alternates: { canonical: `${SITE_URL}/outils/calcul-heures-supplementaires-congo` },
  keywords: [
    'calcul heures supplémentaires Congo','heures sup Congo 2026','majoration heures supplémentaires Congo',
    'Décret 78-360 Congo','taux heures supplémentaires Congo Brazzaville','HS +25% Congo',
    'heures de nuit Congo','travail dimanche Congo','heure sup légale Congo',
  ].join(', '),
  openGraph: {
    title: 'Calcul Heures Supplémentaires Congo 2026 — Décret 78-360',
    description: '+10%, +25%, +50%, +100% selon la loi congolaise. Exemples chiffrés et calculateur gratuit.',
    url: `${SITE_URL}/outils/calcul-heures-supplementaires-congo`,
    type: 'website',
  },
};

const faqJsonLd = {
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'Quel est le taux de majoration des heures supplémentaires au Congo ?',
      acceptedAnswer: { '@type': 'Answer', text: 'Selon le Décret 78-360, les heures supplémentaires au Congo sont majorées de : +10% pour les 5 premières heures au-delà de la durée légale (40h/semaine), +25% pour les heures suivantes, +50% pour les heures de nuit, de repos compensateur ou jours fériés, +100% pour les heures de nuit du dimanche et des jours fériés.' }},
    { '@type': 'Question', name: 'Comment calculer le taux horaire d\'un salarié au Congo ?',
      acceptedAnswer: { '@type': 'Answer', text: 'Le taux horaire se calcule en divisant le salaire de base mensuel par le nombre d\'heures de travail mensuel (base 26 jours × 8 heures = 208 heures). Exemple : salaire 400 000 FCFA → taux horaire = 400 000 ÷ 208 = 1 923 FCFA/h.' }},
    { '@type': 'Question', name: 'Quelle est la durée légale de travail au Congo-Brazzaville ?',
      acceptedAnswer: { '@type': 'Answer', text: 'La durée légale de travail au Congo-Brazzaville est de 40 heures par semaine (8h/jour × 5 jours), soit environ 173 heures par mois. Tout dépassement de cette durée constitue des heures supplémentaires obligatoirement rémunérées avec majoration.' }},
    { '@type': 'Question', name: 'Les heures supplémentaires sont-elles plafonnées au Congo ?',
      acceptedAnswer: { '@type': 'Answer', text: 'Oui. Le Code du travail congolais fixe un maximum d\'heures supplémentaires par semaine et par mois. L\'employeur doit également obtenir une autorisation préalable de l\'Inspection du Travail pour les heures supplémentaires dépassant un certain seuil hebdomadaire.' }},
  ],
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Outils RH', item: `${SITE_URL}/outils` },
    { '@type': 'ListItem', position: 3, name: 'Heures supplémentaires Congo', item: `${SITE_URL}/outils/calcul-heures-supplementaires-congo` },
  ],
};

export default function CalcHeuresSupPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <HeuresSupClient />
    </>
  );
}