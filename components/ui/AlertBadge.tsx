'use client';

// components/ui/AlertBadge.tsx
// Pastille d'alerte clignotante (compteur + halo qui pulse).
// Même rendu que celle de components/layout/Sidebar.tsx, extraite pour être
// réutilisée (sidebar du portefeuille). Respecte prefers-reduced-motion.

import React from 'react';

export type AlertTone = 'red' | 'emerald' | 'amber';

export const ALERT_TONES: Record<AlertTone, { solid: string; text: string; tint: string; ring: string }> = {
  red:     { solid: '#EF4444', text: '#DC2626', tint: 'rgba(239,68,68,0.10)',  ring: 'rgba(239,68,68,0.28)' },
  emerald: { solid: '#10B981', text: '#059669', tint: 'rgba(16,185,129,0.10)', ring: 'rgba(16,185,129,0.28)' },
  amber:   { solid: '#F59E0B', text: '#D97706', tint: 'rgba(245,158,11,0.12)', ring: 'rgba(245,158,11,0.32)' },
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
        <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping motion-reduce:animate-none" style={{ background: t.solid }} />
        <span className="relative inline-flex w-3 h-3 rounded-full" style={{ background: t.solid, border: '2px solid var(--surface)' }} />
      </span>
    );
  }

  return (
    <span className="relative flex shrink-0">
      <span className="absolute inset-0 rounded-full opacity-60 animate-ping motion-reduce:animate-none" style={{ background: t.solid }} />
      <span
        className="relative min-w-[22px] h-[22px] px-1.5 rounded-full text-white text-[11px] font-bold flex items-center justify-center shadow-sm"
        style={{ background: t.solid }}
      >
        {label}
      </span>
    </span>
  );
};

export default AlertBadge;