// ============================================================================
// 📁 components/auth/AuthShell.tsx
// Coquille commune à toutes les pages d'authentification.
//
//   variant="split"    (défaut) : panneau de marque (messages + captures) à
//                                 gauche + formulaire à droite, sur une seule
//                                 hauteur d'écran (pas de scroll sur ordinateur). Sur mobile : formulaire seul, avec
//                                 la barre tricolore du logo en haut.
//   variant="centered"          : carte centrée sur le fond de l'app (pages
//                                 courtes : invitation, vérification…).
//
// Couleurs : uniquement les tokens de l'app (--bg, --surface, --brand…), donc
// thème clair / sombre automatique. Seul le panneau de marque reste sombre.
// ============================================================================
'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import './auth.css';

// ── Logo horizontal (version adaptée au thème) ───────────────────────────────
export function AuthLogo({ onDark = false }: { onDark?: boolean }) {
  return (
    <Link href="/" className="au-logo" aria-label="Konza RH — Accueil">
      {onDark ? (
        <img src="/logos/konza_logo_h_white.png" alt="Konza RH" width={507} height={240} />
      ) : (
        <>
          <img className="au-logo-light" src="/logos/konza_logo_h_color.png" alt="Konza RH" width={507} height={240} />
          <img className="au-logo-dark" src="/logos/konza_logo_h_white.png" alt="Konza RH" width={507} height={240} />
        </>
      )}
    </Link>
  );
}

// ── Contenu du panneau de marque ─────────────────────────────────────────────
// Les trois messages défilent. Pour les modifier, c'est ici et nulle part ailleurs.
const SLIDES: Array<{ title: React.ReactNode; text: string; tagline: string }> = [
  {
    title: (<>Le futur de la <em>gestion RH</em></>),
    text: 'Connectez-vous à l’écosystème le plus avancé pour les entreprises congolaises.',
    tagline: 'L’ère du numérique est là : vos RH aussi passent au digital.',
  },
  {
    title: (<>Digitalisez et gérez <em>à distance</em> vos RH</>),
    text: 'Paie, congés, présences et contrats : tout se fait depuis un navigateur, au bureau comme en déplacement.',
    tagline: 'Fini les fichiers éparpillés : tout vit au même endroit.',
  },
  {
    title: (<>Une plateforme RH <em>complète</em> pour le Congo</>),
    text: 'De l’embauche à la déclaration CNSS, un seul outil, conforme au droit congolais.',
    tagline: 'Encore sur Excel pour vos RH ? Il existe mieux.',
  },
  {
    title: (<>Moins de saisie, <em>plus de temps</em> pour votre équipe</>),
    text: 'Les calculs, les déclarations et les rappels se font tout seuls.',
    tagline: 'Automatisez tous vos processus RH, une bonne fois pour toutes.',
  },
];

// Captures d'écran : déposer les deux fichiers dans  public/login/
// Tant qu'un fichier est absent, un cadre vide avec son nom s'affiche à la place.
const SHOT_DASHBOARD = { label: 'Tableau de bord', src: '/login/dashboard.png' };
const SHOT_BULLETIN = { label: 'Bulletin de paie', src: '/login/bulletin.png' };

function Shot({
  className,
  label,
  src,
}: {
  className: string;
  label: string;
  src: string;
}) {
  const [status, setStatus] = useState<'pending' | 'ok' | 'error'>('pending');
  const ref = useRef<HTMLImageElement>(null);

  // L'image peut avoir fini de charger (ou d'échouer) avant l'hydratation.
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete) setStatus(img.naturalWidth > 0 ? 'ok' : 'error');
  }, []);

  return (
    <figure className={`au-shot ${className}${status === 'ok' ? ' is-ok' : ''}`}>
      <figcaption className="au-shot-bar">{label}</figcaption>
      <div className="au-shot-body">
        {status !== 'ok' && (
          <div className="au-shot-empty">
            <span>Capture à ajouter</span>
            <code>public{src}</code>
          </div>
        )}
        {status !== 'error' && (
          <img
            ref={ref}
            src={src}
            alt={`Aperçu : ${label}`}
            onLoad={() => setStatus('ok')}
            onError={() => setStatus('error')}
          />
        )}
      </div>
    </figure>
  );
}

// ── Panneau de marque (écrans ≥ 1024 px) ─────────────────────────────────────
function AuthBrandPanel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setIndex((v) => (v + 1) % SLIDES.length), 6000);
    return () => clearInterval(t);
  }, [paused]);

  return (
    <aside className="au-panel">
      <div>
        <AuthLogo onDark />
      </div>

      <div className="au-panel-body">
        <div
          className="au-slides"
          aria-live="polite"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {SLIDES.map((s, n) => (
            <div key={n} className={`au-slide${n === index ? ' is-active' : ''}`} aria-hidden={n !== index}>
              <h2 className="au-panel-title">{s.title}</h2>
              <p className="au-panel-sub">{s.text}</p>
            </div>
          ))}
        </div>

        <div className="au-dots" role="tablist" aria-label="Messages">
          {SLIDES.map((_, n) => (
            <button
              key={n}
              type="button"
              role="tab"
              aria-selected={n === index}
              aria-label={`Message ${n + 1}`}
              className={`au-dot${n === index ? ' is-active' : ''}`}
              onClick={() => setIndex(n)}
            />
          ))}
        </div>

        {/* Captures réelles de l'application */}
        <div className="au-stage">
          <Shot className="au-shot-dash" {...SHOT_DASHBOARD} />
          <Shot className="au-shot-bull" {...SHOT_BULLETIN} />
        </div>
      </div>

      <div className="au-tagline" aria-live="polite">
        {SLIDES.map((sl, n) => (
          <p key={n} className={`au-tag${n === index ? ' is-active' : ''}`} aria-hidden={n !== index}>
            {sl.tagline.split(' ').map((w, i) => (
              <React.Fragment key={i}>
                <span className="au-w" style={{ ['--wd' as any]: `${i * 90}ms` }}>{w}</span>{' '}
              </React.Fragment>
            ))}
          </p>
        ))}
      </div>
    </aside>
  );
}

// ── Coquille ─────────────────────────────────────────────────────────────────
export function AuthShell({
  children,
  variant = 'split',
  panel,
  maxWidth,
}: {
  children: React.ReactNode;
  variant?: 'split' | 'centered';
  /** Remplace le panneau de marque Konza (ex. invitation d'un cabinet avec son propre logo). */
  panel?: React.ReactNode;
  /** Largeur max du contenu en px (par défaut 420, 440 en « centered »). */
  maxWidth?: number;
}) {
  const split = variant === 'split';

  return (
    <div className={`au-root ${split ? 'au-split' : 'au-centered'}`}>
      {split && (panel ? <aside className="au-panel au-panel-custom">{panel}</aside> : <AuthBrandPanel />)}

      <main className="au-main">
        <div className="au-topbar">
          <span className="au-topbar-logo"><AuthLogo /></span>
          <Link href="/" className="au-home">
            <ArrowLeft size={14} />
            Accueil
          </Link>
        </div>

        <div className="au-form" style={maxWidth ? { maxWidth } : undefined}>{children}</div>
      </main>
    </div>
  );
}

// ── Carte (transparente en « split », carte flottante en « centered ») ───────
export function AuthCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`au-card ${className}`}>{children}</div>;
}

// ── Titre de page ────────────────────────────────────────────────────────────
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