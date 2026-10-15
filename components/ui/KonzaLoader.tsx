'use client';

// ============================================================================
// 📁 components/ui/KonzaLoader.tsx
// Loader unique de Konza RH : logo K + anneau qui tourne + halo doux.
// À utiliser PARTOUT à la place des spinners de page / de section.
//
//   variant="screen"  → plein écran (garde d'auth, premier affichage)
//   variant="page"    → zone principale d'une page (défaut)
//   variant="section" → bloc / panneau / liste en cours de chargement
//   variant="inline"  → petite ligne « Chargement… » dans un formulaire
//
// logoSrc : logo à afficher à la place du K (portail cabinet en marque blanche).
// tone="dark" : écrans à fond sombre fixe (ex. portail cabinet) → K clair + texte clair,
//               quel que soit le thème de l'app. background : couleur de fond (variant "screen").
// Les spinners DANS les boutons (Enregistrer…) restent des petits Loader2.
// ============================================================================

import React from 'react';
import { KonzaMark } from './KonzaMark';

type Variant = 'screen' | 'page' | 'section' | 'inline';

interface KonzaLoaderProps {
  variant?: Variant;
  /** Texte sous le logo. `null` = aucun texte. Défaut : « Chargement… » */
  label?: string | null;
  logoSrc?: string | null;
  tone?: 'auto' | 'dark';
  background?: string;
  className?: string;
}

const SIZES: Record<Variant, { box: number; mark: number; wrap: string }> = {
  screen:  { box: 88, mark: 46, wrap: 'h-screen w-full' },
  page:    { box: 76, mark: 40, wrap: 'w-full min-h-[60vh] py-20' },
  section: { box: 56, mark: 28, wrap: 'w-full py-12' },
  inline:  { box: 28, mark: 14, wrap: 'py-2' },
};

const CSS = `
@keyframes konza-loader-spin { to { transform: rotate(360deg); } }
@keyframes konza-loader-breathe { 0%,100% { transform: scale(1); opacity: .95; } 50% { transform: scale(.9); opacity: .75; } }
@keyframes konza-loader-glow { 0%,100% { opacity: .18; transform: scale(.92); } 50% { opacity: .38; transform: scale(1.08); } }
@keyframes konza-loader-text { 0%,100% { opacity: .55; } 50% { opacity: 1; } }
.konza-loader-ring   { animation: konza-loader-spin 1.1s linear infinite; }
.konza-loader-mark   { animation: konza-loader-breathe 2.2s ease-in-out infinite; }
.konza-loader-glow   { animation: konza-loader-glow 2.2s ease-in-out infinite; }
.konza-loader-text   { animation: konza-loader-text 1.8s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .konza-loader-ring, .konza-loader-mark, .konza-loader-glow, .konza-loader-text { animation: none; }
}
`;

export const KonzaLoader: React.FC<KonzaLoaderProps> = ({ variant = 'page', label, logoSrc, tone = 'auto', background, className = '' }) => {
  const s = SIZES[variant];
  const text = label === undefined ? 'Chargement…' : label;
  const inline = variant === 'inline';
  const dark = tone === 'dark';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center justify-center ${inline ? 'flex-row gap-3' : 'flex-col gap-5'} ${s.wrap} ${className}`}
      style={variant === 'screen' ? { background: background ?? (dark ? '#0d1117' : 'var(--bg)') } : undefined}
    >
      <style>{CSS}</style>

      <div className="relative shrink-0" style={{ width: s.box, height: s.box }}>
        <span className="konza-loader-glow absolute inset-0 rounded-full blur-xl" style={{ background: 'var(--brand, #10B981)' }} />
        <span
          className="konza-loader-ring absolute inset-0 rounded-full"
          style={{
            border: `${inline ? 2 : 3}px solid rgba(16,185,129,0.15)`,
            borderTopColor: 'var(--brand, #10B981)',
          }}
        />
        <span className="konza-loader-mark absolute inset-0 flex items-center justify-center">
          {logoSrc ? (
            <img src={logoSrc} alt="" style={{ width: s.mark * 1.15, height: s.mark * 1.15, objectFit: 'contain' }} />
          ) : (
            <KonzaMark size={s.mark} forceDark={dark} />
          )}
        </span>
      </div>

      {text ? (
        <p
          className={`konza-loader-text font-semibold tracking-wide ${inline ? 'text-xs' : 'text-sm'}`}
          style={{ color: dark ? '#94A3B8' : 'var(--text-muted)' }}
        >
          {text}
        </p>
      ) : (
        <span className="sr-only">Chargement</span>
      )}
    </div>
  );
};

export default KonzaLoader;