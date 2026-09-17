import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight, Eye, EyeOff } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  trend: string;
  isPositive: boolean;
  icon: LucideIcon;
  /** Couleur unique de l'accent (icône + halo). Ex: 'emerald' | 'amber' | 'sky' | 'red' */
  color?: 'emerald' | 'amber' | 'sky' | 'red' | 'violet';
  isPrivate?: boolean;
  showValue?: boolean;
  onToggleVisibility?: () => void;
}

const COLOR_MAP: Record<string, { icon: string; halo: string }> = {
  emerald: { icon: 'bg-emerald-500', halo: 'bg-emerald-500' },
  amber:   { icon: 'bg-amber-500',   halo: 'bg-amber-500' },
  sky:     { icon: 'bg-sky-500',     halo: 'bg-sky-500' },
  red:     { icon: 'bg-red-500',     halo: 'bg-red-500' },
  violet:  { icon: 'bg-violet-500',  halo: 'bg-violet-500' },
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
  const c = COLOR_MAP[color] || COLOR_MAP.emerald;

  return (
    <div className="relative group h-full">
      <div
        className="relative h-full rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col justify-between"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
        }}
      >
        {/* Halo décoratif — un seul ton uni, pas de dégradé */}
        <div className={`absolute top-0 right-0 w-28 h-28 ${c.halo} opacity-[0.06] rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none`} />

        <div className="flex justify-between items-start mb-4 relative z-10">
          <div className="flex-1">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>
              {label}
            </p>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl lg:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>
                {isPrivate && !showValue ? '•••• FCFA' : value}
              </h3>
              {isPrivate && (
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleVisibility && onToggleVisibility(); }}
                  className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {showValue ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              )}
            </div>
          </div>

          <div className={`w-12 h-12 rounded-xl ${c.icon} flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300`}>
            <Icon size={22} strokeWidth={2.5} />
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2">
          <div
            className={`flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${
              isPositive
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20'
                : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20'
            }`}
          >
            {isPositive ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
            {trend}
          </div>
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>vs dernier</span>
        </div>
      </div>
    </div>
  );
};