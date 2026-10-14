'use client';

// ============================================================================
// 📁 components/ui/KonzaMark.tsx
// Logo « K » de Konza RH (version carrée), clair / sombre.
//
// Fichiers attendus dans /public/logos :
//   - konza_logo_k_color.png   (thème clair)
//   - konza_logo_k_white.png   (thème sombre)
// Tant qu'ils n'existent pas, le composant retombe automatiquement sur la partie
// gauche du logo horizontal existant (konza_logo_h_*.png) — aucune image cassée.
// ============================================================================

import React, { useState } from 'react';

const MARK = { light: '/logos/konza_logo_k_color.png', dark: '/logos/konza_logo_k_white.png' };
const HORIZONTAL = { light: '/logos/konza_logo_h_color.png', dark: '/logos/konza_logo_h_white.png' };

interface KonzaMarkProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const KonzaMark: React.FC<KonzaMarkProps> = ({ size = 32, className = '', style }) => {
  const [missing, setMissing] = useState({ light: false, dark: false });

  const img = (theme: 'light' | 'dark') => {
    const fallback = missing[theme];
    return (
      <img
        src={fallback ? HORIZONTAL[theme] : MARK[theme]}
        alt="Konza RH"
        width={size}
        height={size}
        draggable={false}
        onError={() => { if (!fallback) setMissing((m) => ({ ...m, [theme]: true })); }}
        className={theme === 'light' ? 'block dark:hidden' : 'hidden dark:block'}
        style={{
          width: size,
          height: size,
          objectFit: fallback ? 'cover' : 'contain',
          objectPosition: 'left center',
        }}
      />
    );
  };

  return (
    <span className={`inline-flex shrink-0 items-center justify-center ${className}`} style={{ width: size, height: size, ...style }}>
      {img('light')}
      {img('dark')}
    </span>
  );
};

export default KonzaMark;