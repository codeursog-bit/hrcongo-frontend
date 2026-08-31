import type { Metadata } from 'next';
import TusCalculatorClient from './TusCalculatorClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://konza.cg';

export const metadata: Metadata = {
  title: 'Calcul TUS Congo 2026 — Taxe Unique sur les Salaires, taux 7,5%',
  description:
    'Calculez le TUS (Taxe Unique sur les Salaires) au Congo-Brazzaville 2026 : 7,5% sur le salaire brut, réparti entre DGI (2,025%) et CNSS (5,475%). Exemples, tableau et explications simples.',
  alternates: { canonical: `${SITE_URL}/outils/calcul-tus-congo` },
  keywords: [
    'calcul TUS Congo 2026','taxe unique salaires Congo','TUS DGI Congo','TUS CNSS Congo',
    'TUS 7.5% Congo','charges patronales Congo','taxe fiscale salaire Congo',
  ].join(', '),
  openGraph: {
    title: 'Calcul TUS Congo 2026 — 7,5% sur salaire brut',
    description: 'TUS = 2,025% DGI + 5,475% CNSS. Charge 100% patronale. Calculez en quelques secondes.',
    url: `${SITE_URL}/outils/calcul-tus-congo`,
    type: 'website',
  },
};

const faqJsonLd = {
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'Qu\'est-ce que le TUS au Congo-Brazzaville ?',
      acceptedAnswer: { '@type': 'Answer', text: 'Le TUS (Taxe Unique sur les Salaires) est une taxe patronale de 7,5% sur le salaire brut total. Elle remplace plusieurs taxes antérieures et se répartit entre la DGI (2,025%) et la CNSS (5,475%). Le TUS est 100% à la charge de l\'employeur, le salarié n\'en paie rien.' }},
    { '@type': 'Question', name: 'Le TUS est-il plafonné au Congo ?',
      acceptedAnswer: { '@type': 'Answer', text: 'Non. Contrairement à la CNSS et à la CAMU, le TUS n\'a pas de plafond d\'assiette. Il s\'applique sur l\'intégralité du salaire brut, quel que soit le montant.' }},
    { '@type': 'Question', name: 'Comment payer le TUS au Congo ?',
      acceptedAnswer: { '@type': 'Answer', text: 'Le TUS se paye en deux parties : la part DGI (2,025%) est versée via la plateforme eTax Congo avant le 15 du mois. La part CNSS (5,475%) est déclarée avec le bordereau mensuel CNSS.' }},
    { '@type': 'Question', name: 'TUS, CNSS, CAMU : quelle différence ?',
      acceptedAnswer: { '@type': 'Answer', text: 'Ce sont trois obligations patronales distinctes : la CNSS (pensions + famille + accidents) est une cotisation sociale, la CAMU est une cotisation santé, et le TUS est une taxe fiscale. Les trois s\'accumulent et constituent les charges patronales totales en plus du salaire brut.' }},
  ],
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Outils RH', item: `${SITE_URL}/outils` },
    { '@type': 'ListItem', position: 3, name: 'Calcul TUS Congo', item: `${SITE_URL}/outils/calcul-tus-congo` },
  ],
};

export default function CalcTusPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <TusCalculatorClient />
    </>
  );
}