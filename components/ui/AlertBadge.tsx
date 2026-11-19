'use client';

// components/ui/AlertBadge.tsx
// Pastille d'alerte (compteur), sans animation : couleurs du design system.
// Même rendu que celle de components/layout/Sidebar.tsx, extraite pour être
// réutilisée (sidebar du portefeuille). Respecte prefers-reduced-motion.

import React from 'react';

export type AlertTone = 'red' | 'emerald' | 'amber';

export const ALERT_TONES: Record<AlertTone, { solid: string; text: string; tint: string; ring: string }> = {
  red:     { solid: 'var(--danger)',  text: 'var(--danger)',  tint: 'color-mix(in srgb, var(--danger) 10%, transparent)',  ring: 'color-mix(in srgb, var(--danger) 28%, transparent)' },
  emerald: { solid: 'var(--green)',   text: 'var(--green)',   tint: 'color-mix(in srgb, var(--green) 10%, transparent)',   ring: 'color-mix(in srgb, var(--green) 28%, transparent)' },
  amber:   { solid: 'var(--mustard)', text: 'var(--text)',    tint: 'color-mix(in srgb, var(--mustard) 14%, transparent)', ring: 'color-mix(in srgb, var(--mustard) 34%, transparent)' },
};

interface AlertBadgeProps {
  count: number;
  tone?: AlertTone;
  /** Version compacte (simple point) pour une sidebar réduite */
  mini?: boolean;
}

export const AlertBadge: React.FC<AlertBadgeProps> = ({ count, tone = 'red', mini = false }) => {
  const t = ALERT_TONES[tone];
  const label = count > 99 ? '99+' : String(count);

  if (mini) {
    return (
      <span className="absolute top-1 right-1.5 flex w-3 h-3" aria-hidden="true">
        <span className="relative inline-flex w-3 h-3 rounded-full" style={{ background: t.solid, border: '2px solid var(--surface)' }} />
      </span>
    );
  }

  return (
    <span className="relative flex shrink-0">
      <span
        className="relative min-w-[22px] h-[22px] px-1.5 rounded-full text-white text-[11px] font-semibold flex items-center justify-center"
        style={{ background: t.solid }}
      >
        {label}
      </span>
    </span>
  );
};

export default AlertBadge;