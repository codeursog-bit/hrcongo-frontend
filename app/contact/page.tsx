import type { Metadata } from 'next';
import ContactClient from './ContactClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://konza-rh.cg';

export const metadata: Metadata = {
  title: 'Contact — Konza RH',
  description: 'Contactez l\'équipe Konza RH à Pointe-Noire pour toute question sur notre logiciel RH & paie conforme au droit congolais.',
  alternates: { canonical: `${SITE_URL}/contact` },
};

export default function ContactPage() {
  return <ContactClient />;
}