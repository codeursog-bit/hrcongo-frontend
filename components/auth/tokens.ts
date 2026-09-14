// ============================================================================
// 📁 components/auth/tokens.ts
// Design tokens partagés avec la landing page (app/page.tsx).
// Toute nouvelle surface "auth" doit piocher ses couleurs ici — jamais de
// valeur cyan/purple/blue codée en dur : on reste sur le système mono + accent.
// ============================================================================

export const BG = '#050607'; // fond de page (identique à la landing)
export const SURFACE = '#0B0C0F'; // cartes, inputs, panneaux
export const ACCENT = '#10B981'; // vert émeraude du logo — accent unique
export const AMBER = '#F59E0B'; // réservé aux étoiles de notation

export const TEXT = '#FAFAFA';
export const TEXT_MUTED = '#8B8F98';
export const TEXT_DIM = '#5A5E66';

export const BORDER = 'rgba(255,255,255,0.08)';
export const BORDER_HOVER = 'rgba(255,255,255,0.16)';

// Grille de fond identique au Hero de la landing (discrète, 5% d'opacité)
export const GRID_BG_STYLE = {
  backgroundImage:
    'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
  backgroundSize: '48px 48px',
} as const;