import type { Metadata } from 'next';
import TarifsClient from './TarifsClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://konza-rh.cg';

export const metadata: Metadata = {
  title: 'Tarifs — Konza RH | Logiciel RH & Paie Congo-Brazzaville',
  description:
    'Tarifs simples et transparents pour Konza RH. Forfaits PME et cabinets, essai gratuit, sans engagement. Paie, CNSS, ITS 2026 conformes au droit congolais.',
  alternates: { canonical: `${SITE_URL}/tarifs` },
  openGraph: {
    title: 'Tarifs — Konza RH',
    description: 'Tarifs simples et transparents pour la gestion RH et paie au Congo.',
    url: `${SITE_URL}/tarifs`,
  },
};

export default function TarifsPage() {
  return <TarifsClient />;
}