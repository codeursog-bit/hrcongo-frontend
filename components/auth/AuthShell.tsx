'use client';
import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, Check, FileText, Users, CalendarDays } from 'lucide-react';
import './auth.css';

export function AuthLogo({ onDark = false }: { onDark?: boolean }) {
  return (
    <Link href="/" className="au-logo" aria-label="Konza RH — Accueil">
      {onDark ? (
        <img src="/logos/konza_logo_h_white.png" alt="Konza RH" width={140} height={40} />
      ) : (
        <>
          <img
            className="au-logo-light"
            src="/logos/konza_logo_h_color.png"
            alt="Konza RH"
            width={140}
            height={40}
          />
          <img
            className="au-logo-dark"
            src="/logos/konza_logo_h_white.png"
            alt="Konza RH"
            width={140}
            height={40}
          />
        </>
      )}
    </Link>
  );
}

function AuthBrandPanel() {
  return (
    <aside className="au-panel" aria-label="Découvrir Konza RH">
      <div className="au-brand-copy">
        <p className="au-panel-label"><span className="au-brand-spark" /> Pensé pour les équipes d’ici</p>
        <h2 className="au-panel-title">Le travail avance.<br /><em>Tout le monde suit.</em></h2>
        <p className="au-panel-sub">Connectez-vous à l’écosystème le plus avancé pour les entreprises du Congo.</p>
        <Link href="/" className="au-product-link">Découvrir Konza RH <ArrowUpRight size={17} /></Link>
      </div>
      <div className="au-brand-art" aria-hidden="true">
        <div className="au-art-orbit au-art-orbit-one" />
        <div className="au-art-orbit au-art-orbit-two" />
        <div className="au-art-core"><span className="au-art-core-k">K</span><span className="au-art-core-dot" /></div>
        <div className="au-art-chip au-art-chip-team"><Users size={18} /><span>Équipes</span><Check size={14} /></div>
        <div className="au-art-chip au-art-chip-leave"><CalendarDays size={18} /><span>Congés</span><Check size={14} /></div>
        <div className="au-art-chip au-art-chip-pay"><FileText size={18} /><span>Paie</span><Check size={14} /></div>
      </div>
      <p className="au-panel-note">Une organisation plus simple, chaque jour.</p>
    </aside>
  );
}

export function AuthShell({
  children,
  variant = 'split',
  panel,
  maxWidth,
}: {
  children: React.ReactNode;
  variant?: 'split' | 'centered';
  panel?: React.ReactNode;
  maxWidth?: number;
}) {
  const split = variant === 'split';
  return (
    <div className={split ? 'au-root au-split' : 'au-root au-centered'}>
      <div className="au-layout">
        {split &&
          (panel ? (
            <aside className="au-panel au-panel-custom">{panel}</aside>
          ) : (
            <AuthBrandPanel />
          ))}
        <main id="contenu" className="au-main">
          <div className="au-form" style={maxWidth ? { maxWidth } : undefined}>
            {children}
          </div>
          <footer className="au-footer">
            <span>Konza RH · Congo-Brazzaville</span>
            <Link href="/privacy">Confidentialité</Link>
          </footer>
        </main>
      </div>
    </div>
  );
}
export function AuthCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={'au-card ' + className}>{children}</div>;
}
export function AuthHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
}) {
  return (
    <div className="au-heading">
      {eyebrow && <div className="au-eyebrow">{eyebrow}</div>}
      <h1 className="au-title">{title}</h1>
      {description && <p className="au-desc">{description}</p>}
    </div>
  );
}
