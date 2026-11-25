'use client';
import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
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
      <p className="au-panel-label">Konza RH · Ressources humaines & paie</p>
      <h2 className="au-panel-title">
        Le futur de la <em>gestion RH</em>
      </h2>
      <p className="au-panel-sub">
        Connectez-vous à l’écosystème le plus avancé pour les entreprises congolaises.
      </p>
      <figure className="au-product">
        <div className="au-product-scene">
          <div className="au-dashboard-shot">
            <span>Tableau de bord</span>
            <img
              src="/images/produit/dashboard-fourni.png"
              alt="Tableau de bord Konza RH : effectifs, paie et suivi des équipes"
              width={1276}
              height={906}
            />
          </div>
          <div className="au-bulletin-shot">
            <span>Bulletin de paie</span>
            <img
              src="/images/produit/bulletin.webp"
              alt="Bulletin de paie complet, avec des données de démonstration"
              width={794}
              height={1123}
            />
          </div>
        </div>
        <figcaption>Captures de l’application · Bulletin de démonstration</figcaption>
      </figure>
      <Link href="/" className="au-product-link">
        Découvrir le produit <ArrowUpRight size={16} />
      </Link>
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
      <header className="au-header">
        <AuthLogo />
        <nav aria-label="Navigation authentification">
          <Link href="/contact" className="au-help">
            Une question ? Contactez-nous
          </Link>
          <Link href="/" className="au-home">
            <ArrowLeft size={14} />
            Accueil
          </Link>
        </nav>
      </header>
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
