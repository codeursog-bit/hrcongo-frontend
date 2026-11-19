import React from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import '@/components/design-system/design-system.css';

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, description, icon: Icon }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center mb-8"
        style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}
        aria-hidden="true"
      >
        <Icon size={40} strokeWidth={1.5} />
      </div>

      <h1 className="text-3xl font-semibold mb-3" style={{ color: 'var(--text)' }}>{title}</h1>
      <p className="max-w-md mx-auto mb-8 text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{description}</p>

      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" className="k-button k-button-primary">Me prévenir</button>
        <Link href="/dashboard" className="k-button k-button-secondary">Retour à l’accueil</Link>
      </div>
    </div>
  );
};
