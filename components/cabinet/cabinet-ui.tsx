'use client';

// ============================================================================
// components/cabinet/cabinet-ui.tsx
// DESIGN SYSTEM CABINET — Tokens, composants réutilisables, SVG icons
// À importer dans toutes les pages Cabinet
// ============================================================================

import React from 'react';

// ─── Tokens ──────────────────────────────────────────────────────────────────
export const C = {
  // Backgrounds
  pageBg:        '#0f1626',
  cardBg:        '#151e30',
  cardBgHover:   '#1a2540',
  surfaceBg:     '#1e2b42',

  // Borders
  border:        'rgba(255,255,255,0.08)',
  borderHover:   'rgba(255,255,255,0.14)',

  // Text
  textPrimary:   '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted:     '#475569',

  // Accents  (identiques côté Entreprise)
  indigo:  '#6366f1',
  indigoL: '#818cf8',
  cyan:    '#06b6d4',
  teal:    '#14b8a6',
  emerald: '#10b981',
  amber:   '#f59e0b',
  red:     '#ef4444',
  violet:  '#8b5cf6',
  pink:    '#ec4899',

  // Top-border accents for KPI cards
  kpiColors: ['#6366f1', '#06b6d4', '#10b981', '#f59e0b'] as const,
};

// ─── SVG Icons  (stroke, 16×16, linecap=round) ───────────────────────────────
export const Ico = {
  Users: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 16 16" fill="none">
      <circle cx="6" cy="5" r="2.5" stroke={p.color ?? 'currentColor'} strokeWidth="1.5"/>
      <path d="M1 13c0-2.21 2.24-4 5-4s5 1.79 5 4" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M11.5 7.5a2 2 0 010 4M13 13a3 3 0 00-3-2.5" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Dollar: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 16 16" fill="none">
      <path d="M8 2v12M5.5 5a2.5 2.5 0 015 0c0 1.38-.89 2-2.5 2-1.74 0-3 .82-3 2.5a2.5 2.5 0 005 0" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Building: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 16 16" fill="none">
      <rect x="2" y="5" width="12" height="9" rx="1.5" stroke={p.color ?? 'currentColor'} strokeWidth="1.5"/>
      <path d="M5 5V4a3 3 0 016 0v1" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M6 10h4" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  FileText: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 16 16" fill="none">
      <path d="M9 2H4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V6L9 2z" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M9 2v4h4M5 9h6M5 12h4" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Clock: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke={p.color ?? 'currentColor'} strokeWidth="1.5"/>
      <path d="M8 4.5v4l2.5 2" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  ArrowRight: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 14} height={p.size ?? 14} viewBox="0 0 14 14" fill="none">
      <path d="M3 7h8M8 3.5L11.5 7 8 10.5" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  TrendUp: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 14} height={p.size ?? 14} viewBox="0 0 14 14" fill="none">
      <path d="M1 10l4-4 3 3 5-6" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 4h3v3" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  TrendDown: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 14} height={p.size ?? 14} viewBox="0 0 14 14" fill="none">
      <path d="M1 4l4 4 3-3 5 6" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Crown: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 16 16" fill="none">
      <path d="M2 12h12M2 12l2-6 4 3 4-6 2 9H2z" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  ),
  Alert: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 16 16" fill="none">
      <path d="M8 2L1.5 13h13L8 2z" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M8 7v3M8 12v.5" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Check: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke={p.color ?? 'currentColor'} strokeWidth="1.5"/>
      <path d="M5 8l2 2 4-4" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Plus: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 14} height={p.size ?? 14} viewBox="0 0 14 14" fill="none">
      <path d="M7 2v10M2 7h10" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Search: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 16 16" fill="none">
      <circle cx="7" cy="7" r="5" stroke={p.color ?? 'currentColor'} strokeWidth="1.5"/>
      <path d="M11 11l3 3" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Loader: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 20} height={p.size ?? 20} viewBox="0 0 20 20" fill="none" className="animate-spin">
      <circle cx="10" cy="10" r="8" stroke={p.color ?? '#6366f1'} strokeWidth="2" strokeDasharray="40" strokeDashoffset="15" strokeLinecap="round"/>
    </svg>
  ),
  Shield: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 16 16" fill="none">
      <path d="M8 2L3 4v5c0 3 2.5 4.8 5 5.5 2.5-.7 5-2.5 5-5.5V4L8 2z" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M6 8l1.5 1.5L10 6" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Palette: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke={p.color ?? 'currentColor'} strokeWidth="1.5"/>
      <circle cx="6" cy="6" r="1" fill={p.color ?? 'currentColor'}/>
      <circle cx="10" cy="6" r="1" fill={p.color ?? 'currentColor'}/>
      <circle cx="6" cy="10" r="1" fill={p.color ?? 'currentColor'}/>
      <circle cx="11" cy="10" r="1.5" fill={p.color ?? 'currentColor'}/>
    </svg>
  ),
  Wallet: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 16 16" fill="none">
      <rect x="1" y="4" width="14" height="9" rx="1.5" stroke={p.color ?? 'currentColor'} strokeWidth="1.5"/>
      <path d="M1 7h14" stroke={p.color ?? 'currentColor'} strokeWidth="1.5"/>
      <circle cx="12" cy="10.5" r="1" fill={p.color ?? 'currentColor'}/>
      <path d="M4 2.5h8" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Payroll: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="12" height="12" rx="2" stroke={p.color ?? 'currentColor'} strokeWidth="1.5"/>
      <path d="M5 6h6M5 9h4M5 12h2" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Settings: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="2" stroke={p.color ?? 'currentColor'} strokeWidth="1.5"/>
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Leave: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 16 16" fill="none">
      <rect x="2" y="3" width="12" height="11" rx="1.5" stroke={p.color ?? 'currentColor'} strokeWidth="1.5"/>
      <path d="M2 7h12M5 1v3M11 1v3" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M5.5 10.5l1.5 1.5 3.5-3.5" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

// ─── Page wrapper ─────────────────────────────────────────────────────────────
export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: C.pageBg, color: C.textPrimary }}>
      <div className="ml-56">
        {children}
      </div>
    </div>
  );
}

// ─── TopBar ──────────────────────────────────────────────────────────────────
interface TopBarProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  breadcrumb?: string;
}

export function TopBar({ title, subtitle, action, breadcrumb }: TopBarProps) {
  return (
    <div
      className="flex items-center justify-between px-8 py-5"
      style={{
        background: C.cardBg,
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      <div>
        {breadcrumb && (
          <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: C.textMuted }}>
            {breadcrumb}
          </p>
        )}
        <h1 className="text-xl font-bold" style={{ color: C.textPrimary }}>{title}</h1>
        {subtitle && (
          <p className="text-sm mt-0.5" style={{ color: C.textSecondary }}>{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  accentColor?: string;
  style?: React.CSSProperties;
}

export function Card({ children, className = '', onClick, accentColor, style }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl transition-all duration-150 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{
        background: C.cardBg,
        border: `1px solid ${C.border}`,
        borderTop: accentColor ? `2px solid ${accentColor}` : `1px solid ${C.border}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.15)',
        ...style,
      }}
      onMouseEnter={onClick ? e => {
        (e.currentTarget as HTMLElement).style.background = C.cardBgHover;
        (e.currentTarget as HTMLElement).style.borderColor = C.borderHover;
      } : undefined}
      onMouseLeave={onClick ? e => {
        (e.currentTarget as HTMLElement).style.background = C.cardBg;
        (e.currentTarget as HTMLElement).style.borderColor = C.border;
      } : undefined}
    >
      {children}
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  accentColor: string;
  delta?: { value: number; label: string };
  onClick?: () => void;
}

export function KpiCard({ label, value, sub, icon, accentColor, delta, onClick }: KpiCardProps) {
  return (
    <Card accentColor={accentColor} onClick={onClick} className="p-5">
      <div className="flex items-start justify-between mb-4">
        {/* Icon circle */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${accentColor}18`, border: `1px solid ${accentColor}35` }}
        >
          {icon}
        </div>

        {/* Delta or arrow */}
        {delta ? (
          <div
            className="flex items-center gap-1 text-xs font-medium"
            style={{ color: delta.value >= 0 ? C.emerald : C.red }}
          >
            {delta.value >= 0
              ? <Ico.TrendUp size={12} color={C.emerald} />
              : <Ico.TrendDown size={12} color={C.red} />
            }
            {delta.value >= 0 ? '+' : ''}{delta.value.toFixed(1)}%
          </div>
        ) : onClick ? (
          <Ico.ArrowRight size={13} color={C.textMuted} />
        ) : null}
      </div>

      <p className="text-2xl font-bold leading-none" style={{ color: C.textPrimary }}>{value}</p>
      <p className="text-xs mt-1.5" style={{ color: C.textSecondary }}>{label}</p>
      {sub && <p className="text-[11px] mt-0.5" style={{ color: C.textMuted }}>{sub}</p>}
    </Card>
  );
}

// ─── Section Header (inside card) ────────────────────────────────────────────
interface SectionHeaderProps {
  title: string;
  sub?: string;
  action?: React.ReactNode;
}

export function SectionHeader({ title, sub, action }: SectionHeaderProps) {
  return (
    <div
      className="flex items-center justify-between px-5 py-4"
      style={{ borderBottom: `1px solid ${C.border}` }}
    >
      <div>
        <p className="text-sm font-semibold" style={{ color: C.textPrimary }}>{title}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: C.textSecondary }}>{sub}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ─── Badge / Pill ─────────────────────────────────────────────────────────────
type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'default';

const BADGE_STYLES: Record<BadgeVariant, { bg: string; color: string }> = {
  success: { bg: 'rgba(16,185,129,0.12)',  color: '#34d399' },
  warning: { bg: 'rgba(245,158,11,0.12)',  color: '#fbbf24' },
  danger:  { bg: 'rgba(239,68,68,0.12)',   color: '#f87171' },
  info:    { bg: 'rgba(99,102,241,0.15)',  color: '#a5b4fc' },
  default: { bg: 'rgba(255,255,255,0.07)', color: '#94a3b8' },
};

export function Badge({ label, variant = 'default' }: { label: string; variant?: BadgeVariant }) {
  const s = BADGE_STYLES[variant];
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold"
      style={{ background: s.bg, color: s.color }}
    >
      {label}
    </span>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  ['#4f46e5','#818cf8'],
  ['#0891b2','#67e8f9'],
  ['#059669','#6ee7b7'],
  ['#d97706','#fcd34d'],
  ['#db2777','#f9a8d4'],
  ['#7c3aed','#c4b5fd'],
];

export function Avatar({ name, size = 32, index = 0 }: { name: string; size?: number; index?: number }) {
  const [from, to] = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <div
      className="flex items-center justify-center rounded-full font-semibold shrink-0"
      style={{
        width: size, height: size,
        background: `linear-gradient(135deg, ${from}, ${to})`,
        fontSize: size * 0.35,
        color: 'white',
      }}
    >
      {initials}
    </div>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const BTN_VARIANTS = {
  primary: { bg: '#6366f1', hover: '#4f46e5', text: '#fff', border: 'transparent' },
  ghost:   { bg: 'transparent', hover: 'rgba(255,255,255,0.06)', text: '#94a3b8', border: 'rgba(255,255,255,0.12)' },
  danger:  { bg: 'rgba(239,68,68,0.1)', hover: 'rgba(239,68,68,0.2)', text: '#f87171', border: 'rgba(239,68,68,0.2)' },
};

export function Btn({ variant = 'ghost', size = 'md', icon, children, ...props }: BtnProps) {
  const v = BTN_VARIANTS[variant];
  const px = size === 'sm' ? '10px' : '16px';
  const py = size === 'sm' ? '6px' : '9px';
  const fs = size === 'sm' ? '12px' : '13px';

  return (
    <button
      {...props}
      className="flex items-center gap-2 rounded-xl font-medium transition-all duration-150"
      style={{
        background: v.bg,
        color: v.text,
        border: `1px solid ${v.border}`,
        padding: `${py} ${px}`,
        fontSize: fs,
        cursor: 'pointer',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = v.hover)}
      onMouseLeave={e => (e.currentTarget.style.background = v.bg)}
      onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.98)')}
      onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
export const inputCls = [
  'w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all',
].join(' ');

export const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#f1f5f9',
};

// ─── LoadingScreen ────────────────────────────────────────────────────────────
export function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: C.pageBg }}>
      <Ico.Loader size={28} />
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
export function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="h-1.5 rounded-full overflow-hidden mt-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

// ─── Banner alert ─────────────────────────────────────────────────────────────
interface BannerProps {
  icon: React.ReactNode;
  title: string;
  sub?: string;
  color: string;
  action?: { label: string; onClick: () => void };
}

export function Banner({ icon, title, sub, color, action }: BannerProps) {
  return (
    <div
      className="flex items-center justify-between gap-4 px-5 py-4 rounded-2xl"
      style={{ background: `${color}12`, border: `1px solid ${color}25` }}
    >
      <div className="flex items-center gap-3">
        <span style={{ color }}>{icon}</span>
        <div>
          <p className="text-sm font-semibold" style={{ color: C.textPrimary }}>{title}</p>
          {sub && <p className="text-xs mt-0.5" style={{ color: C.textSecondary }}>{sub}</p>}
        </div>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="text-xs font-semibold whitespace-nowrap transition-opacity hover:opacity-75"
          style={{ color }}
        >
          {action.label} →
        </button>
      )}
    </div>
  );
}