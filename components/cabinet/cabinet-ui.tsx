'use client';

// ============================================================================
// components/cabinet/cabinet-ui.tsx
// DESIGN SYSTEM CABINET — Fusion v1 + v2 + paie/rapports
// ============================================================================

import React from 'react';

// ─── Tokens ──────────────────────────────────────────────────────────────────
export const C = {
  pageBg:        '#0d1117',
  cardBg:        '#161b22',
  cardBgHover:   '#1c2330',
  surfaceBg:     '#1e2840',
  inputBg:       'rgba(255,255,255,0.04)',
  border:        'rgba(255,255,255,0.07)',
  borderHover:   'rgba(255,255,255,0.13)',
  borderFocus:   'rgba(99,102,241,0.5)',
  textPrimary:   '#e6edf3',
  textSecondary: '#8b949e',
  textMuted:     '#484f58',
  indigo:  '#6366f1',
  indigoL: '#818cf8',
  cyan:    '#06b6d4',
  teal:    '#14b8a6',
  emerald: '#10b981',
  amber:   '#f59e0b',
  red:     '#ef4444',
  violet:  '#8b5cf6',
  pink:    '#ec4899',
  kpiColors: ['#39394d', '#06b6d4', '#10b981', '#f59e0b'] as const,
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────
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
  ArrowLeft: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 14} height={p.size ?? 14} viewBox="0 0 14 14" fill="none">
      <path d="M11 7H3M6 3.5L2.5 7 6 10.5" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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
  CheckSimple: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 16 16" fill="none">
      <path d="M3 8l4 4 6-7" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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
  Download: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 16 16" fill="none">
      <path d="M8 2v8M5 7l3 3 3-3" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2 13h12" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Eye: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 16 16" fill="none">
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinejoin="round"/>
      <circle cx="8" cy="8" r="2" stroke={p.color ?? 'currentColor'} strokeWidth="1.5"/>
    </svg>
  ),
  Copy: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 16 16" fill="none">
      <rect x="6" y="6" width="8" height="8" rx="1.5" stroke={p.color ?? 'currentColor'} strokeWidth="1.5"/>
      <path d="M4 10H3a1 1 0 01-1-1V3a1 1 0 011-1h6a1 1 0 011 1v1" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Link: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 16 16" fill="none">
      <path d="M6.5 9.5l3-3M5 8a2 2 0 003 2.83l1.5-1.5A2 2 0 007 6.17L5.5 7.67" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M9 5.17l1.5-1.5A2 2 0 1113.33 6.5l-1.5 1.5A2 2 0 019 5.17z" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Mail: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 16 16" fill="none">
      <rect x="1" y="3" width="14" height="10" rx="1.5" stroke={p.color ?? 'currentColor'} strokeWidth="1.5"/>
      <path d="M1 5l7 5 7-5" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Send: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 16 16" fill="none">
      <path d="M2 8l12-5.5L8 14l-.5-5L2 8z" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M7.5 9L14 2.5" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Refresh: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 16 16" fill="none">
      <path d="M2 8a6 6 0 0110.39-4.1L14 2M14 8a6 6 0 01-10.39 4.1L2 14" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M14 2v4h-4M2 14v-4h4" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Star: (p: { size?: number; color?: string; filled?: boolean }) => (
    <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 16 16" fill="none">
      <path d="M8 2l1.6 3.5 3.8.4-2.8 2.6.7 3.8L8 10.5l-3.3 1.8.7-3.8L2.6 5.9l3.8-.4L8 2z"
        stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinejoin="round"
        fill={p.filled ? (p.color ?? 'currentColor') : 'none'}/>
    </svg>
  ),
  Target: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke={p.color ?? 'currentColor'} strokeWidth="1.5"/>
      <circle cx="8" cy="8" r="3" stroke={p.color ?? 'currentColor'} strokeWidth="1.5"/>
      <circle cx="8" cy="8" r="1" fill={p.color ?? 'currentColor'}/>
    </svg>
  ),
  Package: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 16 16" fill="none">
      <path d="M8 2L2 5v6l6 3 6-3V5L8 2z" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M2 5l6 3 6-3M8 8v6" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Book: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 16 16" fill="none">
      <path d="M3 2h9a1 1 0 011 1v9a1 1 0 01-1 1H3M3 2a1 1 0 00-1 1v9a1 1 0 001 1m0-10v10" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M6 6h4M6 9h2" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Fingerprint: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 16 16" fill="none">
      <path d="M8 14c-1.5-1.5-3-3.5-3-6a3 3 0 016 0c0 1-.5 2-1 3" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M4 6a4 4 0 018 0c0 2-1 4-2 5.5" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M2 7a6 6 0 0112 0" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  BarChart: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 16 16" fill="none">
      <path d="M3 13V7M8 13V4M13 13V9" stroke={p.color ?? 'currentColor'} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  UserCog: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 16 16" fill="none">
      <circle cx="6" cy="5" r="2.5" stroke={p.color ?? 'currentColor'} strokeWidth="1.5"/>
      <path d="M1 13c0-2.21 2.24-4 5-4" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="12" cy="12" r="1.2" stroke={p.color ?? 'currentColor'} strokeWidth="1.3"/>
      <path d="M12 9.5v1M12 13.5v1M9.5 12h1M13.5 12h1M10.4 10.4l.7.7M13.5 13.5l.7.7M13.5 10.4l-.7.7M10.4 13.5l-.7.7" stroke={p.color ?? 'currentColor'} strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  ChevronDown: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 12} height={p.size ?? 12} viewBox="0 0 12 12" fill="none">
      <path d="M2.5 4.5l3.5 3.5 3.5-3.5" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  ChevronUp: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 12} height={p.size ?? 12} viewBox="0 0 12 12" fill="none">
      <path d="M2.5 7.5l3.5-3.5 3.5 3.5" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  ChevronLeft: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 14} height={p.size ?? 14} viewBox="0 0 14 14" fill="none">
      <path d="M9 3L5 7l4 4" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  ChevronRight: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 14} height={p.size ?? 14} viewBox="0 0 14 14" fill="none">
      <path d="M5 3l4 4-4 4" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Tag: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 16 16" fill="none">
      <path d="M2 2h5.5l6.5 6.5-5 5L2.5 7H2V2z" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinejoin="round"/>
      <circle cx="5" cy="5" r="1" fill={p.color ?? 'currentColor'}/>
    </svg>
  ),
  MapPin: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 16 16" fill="none">
      <path d="M8 1.5a4.5 4.5 0 014.5 4.5c0 3-4.5 8.5-4.5 8.5S3.5 9 3.5 6A4.5 4.5 0 018 1.5z" stroke={p.color ?? 'currentColor'} strokeWidth="1.5"/>
      <circle cx="8" cy="6" r="1.5" stroke={p.color ?? 'currentColor'} strokeWidth="1.5"/>
    </svg>
  ),
  Network: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="3" r="1.5" stroke={p.color ?? 'currentColor'} strokeWidth="1.5"/>
      <circle cx="3" cy="13" r="1.5" stroke={p.color ?? 'currentColor'} strokeWidth="1.5"/>
      <circle cx="13" cy="13" r="1.5" stroke={p.color ?? 'currentColor'} strokeWidth="1.5"/>
      <path d="M8 4.5v3M8 7.5L3 11.5M8 7.5L13 11.5" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Trash: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 16 16" fill="none">
      <path d="M2 4h12M5 4V2.5A.5.5 0 015.5 2h5a.5.5 0 01.5.5V4M6 7v5M10 7v5" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M3 4l.75 9.5A1 1 0 004.75 14h6.5a1 1 0 001-1L13 4" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  ExternalLink: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 16 16" fill="none">
      <path d="M7 3H3a1 1 0 00-1 1v9a1 1 0 001 1h9a1 1 0 001-1V9" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M10 2h4v4M9 7l5-5" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  // ── Icônes requises par paie/page.tsx ────────────────────────────────────
  Play: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 16 16" fill="none">
      <path d="M4 3l9 5-9 5V3z" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinejoin="round"
        fill={p.color ?? 'currentColor'} fillOpacity="0.15"/>
    </svg>
  ),
  Save: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 16 16" fill="none">
      <path d="M2 3a1 1 0 011-1h8l3 3v8a1 1 0 01-1 1H3a1 1 0 01-1-1V3z" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M5 2v3h5V2M5 15v-5h6v5" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Info: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke={p.color ?? 'currentColor'} strokeWidth="1.5"/>
      <path d="M8 7v5" stroke={p.color ?? 'currentColor'} strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="8" cy="4.5" r="0.75" fill={p.color ?? 'currentColor'}/>
    </svg>
  ),
};

// ─── Page wrapper (v1) ────────────────────────────────────────────────────────
export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: C.pageBg, color: C.textPrimary }}>
      <div className="ml-56">{children}</div>
    </div>
  );
}

// ─── TopBar (v1) ──────────────────────────────────────────────────────────────
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
      style={{ background: C.cardBg, borderBottom: `1px solid ${C.border}` }}
    >
      <div>
        {breadcrumb && (
          <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: C.textMuted }}>
            {breadcrumb}
          </p>
        )}
        <h1 className="text-xl font-bold" style={{ color: C.textPrimary }}>{title}</h1>
        {subtitle && <p className="text-sm mt-0.5" style={{ color: C.textSecondary }}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ─── Page Header (v2) ─────────────────────────────────────────────────────────
interface PageHeaderProps {
  title: string;
  sub?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  breadcrumb?: string;
}

export function PageHeader({ title, sub, icon, action, breadcrumb }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        {icon && (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)' }}
          >
            {icon}
          </div>
        )}
        <div>
          {breadcrumb && (
            <p className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: C.textMuted }}>
              {breadcrumb}
            </p>
          )}
          <h1 className="text-xl font-bold" style={{ color: C.textPrimary }}>{title}</h1>
          {sub && <p className="text-sm mt-0.5" style={{ color: C.textSecondary }}>{sub}</p>}
        </div>
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
        boxShadow: '0 2px 4px rgba(0,0,0,0.25), 0 6px 16px rgba(0,0,0,0.2)',
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
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${accentColor}18`, border: `1px solid ${accentColor}30` }}
        >
          {icon}
        </div>
        {delta ? (
          <div className="flex items-center gap-1 text-xs font-medium"
            style={{ color: delta.value >= 0 ? C.emerald : C.red }}>
            {delta.value >= 0
              ? <Ico.TrendUp size={12} color={C.emerald} />
              : <Ico.TrendDown size={12} color={C.red} />}
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

// ─── Section Header ───────────────────────────────────────────────────────────
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

// ─── StatRow — requis par paie/page.tsx ───────────────────────────────────────
export function StatRow({ label, value, color }: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between text-xs py-0.5">
      <span style={{ color: C.textSecondary }}>{label}</span>
      <span className="tabular-nums font-medium" style={{ color: color ?? C.textPrimary }}>{value}</span>
    </div>
  );
}

// ─── Badge / Pill ─────────────────────────────────────────────────────────────
type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'default' | 'purple' | 'cyan';

const BADGE_STYLES: Record<BadgeVariant, { bg: string; color: string }> = {
  success: { bg: 'rgba(16,185,129,0.12)',  color: '#34d399' },
  warning: { bg: 'rgba(245,158,11,0.12)',  color: '#fbbf24' },
  danger:  { bg: 'rgba(239,68,68,0.12)',   color: '#f87171' },
  info:    { bg: 'rgba(99,102,241,0.15)',  color: '#a5b4fc' },
  purple:  { bg: 'rgba(139,92,246,0.15)',  color: '#c4b5fd' },
  cyan:    { bg: 'rgba(6,182,212,0.12)',   color: '#67e8f9' },
  default: { bg: 'rgba(255,255,255,0.07)', color: '#8b949e' },
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
  const initials = name.split(' ').map(p => p[0] ?? '').slice(0, 2).join('').toUpperCase();
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
  variant?: 'primary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const BTN_VARIANTS = {
  primary: { bg: '#6366f1', hover: '#4f46e5', text: '#fff', border: 'transparent' },
  ghost:   { bg: 'transparent', hover: 'rgba(255,255,255,0.06)', text: '#8b949e', border: 'rgba(255,255,255,0.1)' },
  danger:  { bg: 'rgba(239,68,68,0.1)', hover: 'rgba(239,68,68,0.18)', text: '#f87171', border: 'rgba(239,68,68,0.2)' },
  success: { bg: 'rgba(16,185,129,0.12)', hover: 'rgba(16,185,129,0.2)', text: '#34d399', border: 'rgba(16,185,129,0.2)' },
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
        background: v.bg, color: v.text,
        border: `1px solid ${v.border}`,
        padding: `${py} ${px}`, fontSize: fs,
        cursor: 'pointer', opacity: props.disabled ? 0.5 : 1,
      }}
      onMouseEnter={e => !props.disabled && (e.currentTarget.style.background = v.hover)}
      onMouseLeave={e => !props.disabled && (e.currentTarget.style.background = v.bg)}
      onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.98)')}
      onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
}

// ─── Input field ──────────────────────────────────────────────────────────────
interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function InputField({ label, error, className = '', ...props }: InputFieldProps) {
  return (
    <div>
      {label && (
        <label className="block text-xs font-medium mb-1.5" style={{ color: C.textSecondary }}>
          {label}
        </label>
      )}
      <input
        {...props}
        className={`w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all ${className}`}
        style={{
          background: C.inputBg,
          border: error ? `1px solid ${C.red}40` : `1px solid ${C.border}`,
          color: C.textPrimary,
        }}
        onFocus={e => { e.currentTarget.style.borderColor = C.borderFocus; }}
        onBlur={e => { e.currentTarget.style.borderColor = error ? `${C.red}40` : C.border; }}
      />
      {error && <p className="text-xs mt-1" style={{ color: C.red }}>{error}</p>}
    </div>
  );
}

// ─── Legacy input helpers ────────────────────────────────────────────────────
export const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all';
export const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#f1f5f9',
};

// ─── Search bar ───────────────────────────────────────────────────────────────
export function SearchBar({ value, onChange, placeholder = 'Rechercher...' }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2">
        <Ico.Search size={14} color={C.textMuted} />
      </div>
      <input
        value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
        style={{ background: C.inputBg, border: `1px solid ${C.border}`, color: C.textPrimary }}
        onFocus={e => { e.currentTarget.style.borderColor = C.borderFocus; }}
        onBlur={e => { e.currentTarget.style.borderColor = C.border; }}
      />
    </div>
  );
}

// ─── Tab bar ─────────────────────────────────────────────────────────────────
export function TabBar<T extends string>({ tabs, active, onChange }: {
  tabs: { key: T; label: string }[]; active: T; onChange: (k: T) => void;
}) {
  return (
    <div className="flex gap-0.5 p-1 rounded-xl w-fit"
      style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}` }}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)}
          className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
          style={{
            background: active === t.key ? 'rgba(255,255,255,0.09)' : 'transparent',
            color: active === t.key ? C.textPrimary : C.textMuted,
          }}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ─── Filter pill bar ──────────────────────────────────────────────────────────
export function FilterBar<T extends string>({ filters, active, onChange }: {
  filters: { key: T; label: string }[]; active: T; onChange: (k: T) => void;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {filters.map(f => (
        <button key={f.key} onClick={() => onChange(f.key)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{
            background: active === f.key ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
            color: active === f.key ? C.indigoL : C.textMuted,
            border: active === f.key ? `1px solid rgba(99,102,241,0.3)` : `1px solid ${C.border}`,
          }}>
          {f.label}
        </button>
      ))}
    </div>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────
export function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: C.cardBg, border: `1px solid ${C.border}`, boxShadow: '0 2px 4px rgba(0,0,0,0.25)' }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">{children}</table>
      </div>
    </div>
  );
}

export function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' | 'center' }) {
  return (
    <th
      className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-${align}`}
      style={{ color: C.textMuted, borderBottom: `1px solid ${C.border}` }}
    >
      {children}
    </th>
  );
}

export function Tr({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <tr onClick={onClick} className="transition-colors" style={{ borderBottom: `1px solid ${C.border}` }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
      {children}
    </tr>
  );
}

export function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3.5 ${className}`}>{children}</td>;
}

// ─── Empty state ──────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, sub }: { icon: React.ReactNode; title: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}` }}>
        {icon}
      </div>
      <p className="text-sm font-medium" style={{ color: C.textSecondary }}>{title}</p>
      {sub && <p className="text-xs mt-1" style={{ color: C.textMuted }}>{sub}</p>}
    </div>
  );
}

// ─── Alert banner ─────────────────────────────────────────────────────────────
interface BannerProps {
  icon: React.ReactNode; title: string; sub?: string; color: string;
  action?: { label: string; onClick: () => void };
}

export function Banner({ icon, title, sub, color, action }: BannerProps) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4 rounded-2xl"
      style={{ background: `${color}10`, border: `1px solid ${color}25` }}>
      <div className="flex items-center gap-3">
        <span style={{ color }}>{icon}</span>
        <div>
          <p className="text-sm font-semibold" style={{ color: C.textPrimary }}>{title}</p>
          {sub && <p className="text-xs mt-0.5" style={{ color: C.textSecondary }}>{sub}</p>}
        </div>
      </div>
      {action && (
        <button onClick={action.onClick}
          className="text-xs font-semibold whitespace-nowrap transition-opacity hover:opacity-75"
          style={{ color }}>
          {action.label} →
        </button>
      )}
    </div>
  );
}

// ─── Info note ────────────────────────────────────────────────────────────────
export function InfoNote({ children, color = C.indigoL }: { children: React.ReactNode; color?: string }) {
  return (
    <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl"
      style={{ background: `${color}08`, border: `1px solid ${color}18` }}>
      <span className="text-xs shrink-0 mt-0.5" style={{ color }}>ⓘ</span>
      <p className="text-xs leading-relaxed" style={{ color: `${color}cc` }}>{children}</p>
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
export function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }}/>
    </div>
  );
}

// ─── Loading Screen ───────────────────────────────────────────────────────────
export function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: C.pageBg }}>
      <Ico.Loader size={28} />
    </div>
  );
}

// ─── Loading inline ───────────────────────────────────────────────────────────
export function LoadingInline() {
  return (
    <div className="flex items-center justify-center py-20">
      <Ico.Loader size={24} />
    </div>
  );
}