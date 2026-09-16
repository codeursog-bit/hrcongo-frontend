import type { Metadata } from 'next';
import EntreprisesClient from './EntreprisesClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://konza-rh.cg';

export const metadata: Metadata = {
  title: 'Entreprises qui recrutent — Konza RH',
  description: 'Découvrez les entreprises congolaises qui recrutent via Konza RH et consultez leurs offres d\'emploi.',
  alternates: { canonical: `${SITE_URL}/entreprises` },
};

export default function EntreprisesPage() {
  return <EntreprisesClient />;
}