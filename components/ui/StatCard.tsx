'use client';

// components/ui/StatCard.tsx
// Carte de chiffre clé : mêmes surfaces que le reste de l'app (sans bordure, ombre douce).
import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight, Eye, EyeOff } from 'lucide-react';
import '@/components/design-system/design-system.css';

interface StatCardProps {
  label: string;
  value: string;
  trend: string;
  isPositive: boolean;
  icon: LucideIcon;
  /** Couleur de l'icône. Conservé tel quel pour ne pas toucher aux appels existants. */
  color?: 'emerald' | 'amber' | 'sky' | 'red' | 'violet';
  isPrivate?: boolean;
  showValue?: boolean;
  onToggleVisibility?: () => void;
}

const TONES: Record<string, string> = {
  emerald: 'var(--green)',
  amber: 'var(--mustard)',
  sky: 'var(--brand)',
  red: 'var(--danger)',
  violet: 'var(--brand)',
};

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  trend,
  isPositive,
  icon: Icon,
  color = 'emerald',
  isPrivate = false,
  showValue = true,
  onToggleVisibility,
}) => {
  const tone = TONES[color] || TONES.emerald;

  return (
    <div
      className="h-full p-6 flex flex-col justify-between gap-5 transition-shadow duration-200 hover:shadow-[var(--shadow-pop)]"
      style={{ background: 'var(--surface)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[13px] font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>{label}</p>
          <div className="flex items-center gap-2">
            <h3 className="text-2xl lg:text-[28px] font-semibold tracking-tight tabular-nums" style={{ color: 'var(--text)' }}>
              {isPrivate && !showValue ? '•••• FCFA' : value}
            </h3>
            {isPrivate && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onToggleVisibility && onToggleVisibility(); }}
                aria-label={showValue ? 'Masquer le montant' : 'Afficher le montant'}
                className="shell-icon-btn"
                style={{ minWidth: 32, minHeight: 32, padding: 0 }}
              >
                {showValue ? <EyeOff size={16} strokeWidth={1.5} aria-hidden="true" /> : <Eye size={16} strokeWidth={1.5} aria-hidden="true" />}
              </button>
            )}
          </div>
        </div>

        <div
          className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center"
          style={{ background: `color-mix(in srgb, ${tone} 14%, transparent)`, color: tone }}
          aria-hidden="true"
        >
          <Icon size={20} strokeWidth={1.5} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className={`k-badge ${isPositive ? 'k-tone-success' : 'k-tone-danger'}`} style={{ gap: 4 }}>
          {isPositive ? <ArrowUpRight size={14} strokeWidth={1.5} aria-hidden="true" /> : <ArrowDownRight size={14} strokeWidth={1.5} aria-hidden="true" />}
          {trend}
        </span>
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>vs dernier</span>
      </div>
    </div>
  );
};
