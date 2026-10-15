'use client';

// ============================================================================
// 📁 components/ui/KonzaMark.tsx
// Logo « K » de Konza RH (version carrée), clair / sombre.
//
// Utilise tes fichiers officiels :
//   /public/logos/konza_logo_k_color.png   (thème clair)
//   /public/logos/konza_logo_k_white.png   (thème sombre)
// Si un de ces fichiers est introuvable, le composant affiche le même K en SVG
// (jamais d'image cassée).
//
// forceDark : toujours la version blanche (écrans à fond sombre fixe, ex. portail
//             cabinet), quel que soit le thème de l'app.
// ============================================================================

import React, { useState } from 'react';

const SRC = { light: '/logos/konza_logo_k_color.png', dark: '/logos/konza_logo_k_white.png' };

// Les PNG ont ~14 % de marge autour du K : on agrandit légèrement pour que le K
// occupe visuellement toute la taille demandée.
const PNG_ZOOM = 1.22;

interface KonzaMarkProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  forceDark?: boolean;
}

// Secours SVG (mêmes formes / couleurs que le logo)
const Glyph: React.FC<{ size: number; bar: string; top: string; bottom: string; className?: string }> = ({ size, bar, top, bottom, className }) => (
  <svg width={size} height={size} viewBox="16 46 148 148" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Konza RH" className={className} style={{ display: 'block' }}>
    <rect x="30" y="50" width="30" height="130" rx="5" fill={bar} />
    <polygon points="80,50 150,50 80,115" fill={top} />
    <polygon points="80,125 150,190 80,190" fill={bottom} />
  </svg>
);

export const KonzaMark: React.FC<KonzaMarkProps> = ({ size = 32, className = '', style, forceDark = false }) => {
  const [missing, setMissing] = useState({ light: false, dark: false });

  const render = (theme: 'light' | 'dark') => {
    const cls = forceDark ? 'block' : theme === 'light' ? 'block dark:hidden' : 'hidden dark:block';
    if (missing[theme]) {
      return theme === 'light'
        ? <Glyph size={size} bar="#047857" top="#10B981" bottom="#F59E0B" className={cls} />
        : <Glyph size={size} bar="#FFFFFF" top="#6EE7B7" bottom="#FBBF24" className={cls} />;
    }
    return (
      <img
        src={SRC[theme]}
        alt="Konza RH"
        draggable={false}
        onError={() => setMissing((m) => ({ ...m, [theme]: true }))}
        className={cls}
        style={{ width: size * PNG_ZOOM, height: size * PNG_ZOOM, maxWidth: 'none', objectFit: 'contain' }}
      />
    );
  };

  return (
    <span className={`inline-flex shrink-0 items-center justify-center ${className}`} style={{ width: size, height: size, ...style }}>
      {!forceDark && render('light')}
      {render('dark')}
    </span>
  );
};

export default KonzaMark;