'use client';

// ============================================================================
// 📁 components/recruitment/recruitment-ui.tsx
// Base commune du module Recrutement : types, libellés, navigation (identique
// sur toutes les pages), petits composants et utilitaires.
// ============================================================================

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Briefcase, KanbanSquare, CalendarClock, Mail, Star } from 'lucide-react';
import { Badge } from '@/components/design-system/primitives';
import type { Tone } from '@/components/design-system/primitives';
import { api } from '@/services/api';
import ModuleNav from '@/components/requests/ModuleNav';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface PipelineCard {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  status: string;
  jobOfferId: string;
  jobTitle: string;
  createdAt: string;
  daysInStage: number;
  daysSinceApplied: number;
  totalScore: number;
  cvScore: number;
  testScore: number;
  aiSuggestion: string | null;
  hrDecision: string | null;
  rating: number | null;
  source: string | null;
  talentPool: boolean;
  autoDisqualified: boolean;
  suspiciousActivity: boolean;
  offerSentAt: string | null;
  offerAcceptedAt: string | null;
  offerDeclinedAt: string | null;
  hiredEmployeeId: string | null;
  processingMode: string | null;
  nextInterviewAt: string | null;
  nextInterviewKind: string | null;
}

export interface CriterionScore { label: string; score: number; comment?: string | null }

export interface Interview {
  id: string;
  candidateId: string;
  round: number;
  kind: string;
  mode: string;
  scheduledAt: string;
  durationMin: number;
  location: string | null;
  meetingUrl: string | null;
  interviewers: string | null;
  status: 'SCHEDULED' | 'DONE' | 'CANCELLED' | 'NO_SHOW';
  criteria: CriterionScore[] | null;
  overallScore: number | null;
  recommendation: string | null;
  summary: string | null;
  invitationSentAt: string | null;
}

export interface Activity {
  id: string;
  type: 'STATUS_CHANGE' | 'NOTE' | 'INTERVIEW' | 'EMAIL' | 'OFFER' | 'HIRE' | 'SYSTEM';
  title: string | null;
  body: string | null;
  fromStatus: string | null;
  toStatus: string | null;
  authorName: string | null;
  createdAt: string;
}

export interface JobLite { id: string; title: string; status: string }

export interface PersonRef { id: string; name: string; jobTitle: string }

// ─── Étapes (colonnes du pipeline) ────────────────────────────────────────────
export type ColumnId = 'NEW' | 'SCREENING' | 'INTERVIEW' | 'OFFER' | 'HIRED' | 'REJECTED';

export const COLUMNS: Array<{
  id: ColumnId; label: string; hint: string; statuses: string[]; target: string;
}> = [
  { id: 'NEW', label: 'À traiter', hint: 'Nouvelles candidatures', statuses: ['APPLIED', 'EN_ATTENTE_TEST', 'EN_ATTENTE_ANALYSE'], target: 'APPLIED' },
  { id: 'SCREENING', label: 'Présélection', hint: 'Dossiers retenus pour étude', statuses: ['SCREENING'], target: 'SCREENING' },
  { id: 'INTERVIEW', label: 'Entretiens', hint: 'Entretiens à tenir ou tenus', statuses: ['INTERVIEW'], target: 'INTERVIEW' },
  { id: 'OFFER', label: 'Offre', hint: 'Offre envoyée', statuses: ['OFFER'], target: 'OFFER' },
  { id: 'HIRED', label: 'Embauchés', hint: 'Fiche employé créée', statuses: ['HIRED'], target: 'HIRED' },
  { id: 'REJECTED', label: 'Refusés', hint: 'Dossiers clôturés', statuses: ['REJECTED', 'REFUSE', 'DISQUALIFIED'], target: 'REJECTED' },
];

export const columnOf = (status: string): ColumnId =>
  COLUMNS.find((c) => c.statuses.includes(status))?.id ?? 'NEW';

export const STATUS_LABEL: Record<string, string> = {
  APPLIED: 'À traiter',
  EN_ATTENTE_TEST: 'Test en attente',
  EN_ATTENTE_ANALYSE: 'Analyse en attente',
  SCREENING: 'Présélection',
  INTERVIEW: 'Entretien',
  OFFER: 'Offre',
  HIRED: 'Embauché',
  REJECTED: 'Refusé',
  REFUSE: 'Refusé',
  DISQUALIFIED: 'Disqualifié',
};

const STATUS_TONE: Record<string, Tone> = {
  APPLIED: 'neutral',
  EN_ATTENTE_TEST: 'warning',
  EN_ATTENTE_ANALYSE: 'warning',
  SCREENING: 'info',
  INTERVIEW: 'info',
  OFFER: 'warning',
  HIRED: 'success',
  REJECTED: 'danger',
  REFUSE: 'danger',
  DISQUALIFIED: 'danger',
};

export const isClosed = (status: string) => ['HIRED', 'REJECTED', 'REFUSE', 'DISQUALIFIED'].includes(status);

export const REJECTION_REASONS: Array<{ code: string; label: string }> = [
  { code: 'PROFILE_MISMATCH', label: 'Profil inadapté au poste' },
  { code: 'EXPERIENCE', label: 'Expérience insuffisante' },
  { code: 'TEST_RESULT', label: 'Résultat du test insuffisant' },
  { code: 'INTERVIEW', label: 'Entretien non concluant' },
  { code: 'SALARY', label: 'Prétentions salariales trop élevées' },
  { code: 'WITHDREW', label: 'Le candidat se retire' },
  { code: 'OFFER_DECLINED', label: 'Offre déclinée par le candidat' },
  { code: 'NO_SHOW', label: 'Absent à l’entretien' },
  { code: 'POSITION_FILLED', label: 'Poste pourvu' },
  { code: 'OTHER', label: 'Autre motif' },
];
export const reasonLabel = (code: string) => REJECTION_REASONS.find((r) => r.code === code)?.label ?? code;

export const KIND_LABEL: Record<string, string> = {
  PHONE_SCREEN: 'Entretien téléphonique',
  HR: 'Entretien RH',
  TECHNICAL: 'Entretien technique',
  MANAGER: 'Entretien avec le responsable',
  DIRECTION: 'Entretien avec la direction',
  OTHER: 'Entretien',
};
export const MODE_LABEL: Record<string, string> = {
  ONSITE: 'En présentiel',
  VIDEO: 'Visioconférence',
  PHONE: 'Téléphone',
};
export const RECO_LABEL: Record<string, string> = {
  STRONG_YES: 'Fortement favorable',
  YES: 'Favorable',
  NO: 'Défavorable',
  STRONG_NO: 'Fortement défavorable',
};
export const RECO_TONE: Record<string, Tone> = {
  STRONG_YES: 'success', YES: 'success', NO: 'danger', STRONG_NO: 'danger',
};

export const SOURCE_OPTIONS = [
  'Site carrière', 'WhatsApp', 'LinkedIn', 'Facebook', 'Parrainage / cooptation',
  'Candidature spontanée', 'Annonce / journal', 'École / université', 'Vivier de talents', 'Autre',
];

// ─── Utilitaires ──────────────────────────────────────────────────────────────
const TZ = 'Africa/Brazzaville';

export const errMsg = (e: any): string => e?.message || 'Une erreur est survenue';

export const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: TZ }) : '—';

export const fmtDateLong = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: TZ }) : '—';

export const fmtTime = (d?: string | null) =>
  d ? new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: TZ }) : '';

export const fmtDateTime = (d?: string | null) => (d ? `${fmtDate(d)} à ${fmtTime(d)}` : '—');

export const fmtMoney = (n?: number | string | null, cur = 'XAF') =>
  n === null || n === undefined || n === '' ? '—' : `${Number(n).toLocaleString('fr-FR')} ${cur === 'XAF' ? 'FCFA' : cur}`;

export const timeAgo = (d: string) => {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 1) return 'à l’instant';
  if (mins < 60) return `il y a ${mins} min`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `il y a ${h} h`;
  const days = Math.floor(h / 24);
  if (days < 30) return `il y a ${days} j`;
  return fmtDate(d);
};

/** Valeur d'un <input type="datetime-local"> → ISO (fuseau du navigateur). */
export const localToIso = (v: string) => new Date(v).toISOString();

/** Demain à 10h, au format datetime-local. */
export const tomorrowTenLocal = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const isoToLocalInput = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const whatsappLink = (phone?: string | null) => {
  const digits = (phone ?? '').replace(/[^\d]/g, '');
  return digits.length >= 8 ? `https://wa.me/${digits}` : null;
};

export const readUserRole = (): string | null => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}')?.role ?? null;
  } catch {
    return null;
  }
};
export const HR_ROLES = ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'];

// ─── Petits composants ────────────────────────────────────────────────────────
export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONE[status] ?? 'neutral'}>{STATUS_LABEL[status] ?? status}</Badge>;
}

export function Avatar({ first, last, size = 36 }: { first: string; last: string; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] font-semibold text-[var(--brand-strong)]"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {(first[0] ?? '').toUpperCase()}{(last[0] ?? '').toUpperCase()}
    </span>
  );
}

/** Ancienneté dans l'étape : neutre → orange (> 4 j) → rouge (> 7 j). */
export function DaysChip({ days, label = 'j' }: { days: number; label?: string }) {
  const cls = days > 7 ? 'text-[var(--danger-text)]' : days > 4 ? 'text-[var(--warning-text)]' : 'text-[var(--text-secondary)]';
  return <span className={`text-xs font-medium tabular-nums ${cls}`}>{days} {label}</span>;
}

export function Stars({ value, onChange, size = 16 }: { value: number | null; onChange?: (v: number | null) => void; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" role={onChange ? 'radiogroup' : undefined} aria-label="Appréciation">
      {[1, 2, 3, 4, 5].map((n) => {
        const on = (value ?? 0) >= n;
        const icon = <Star size={size} strokeWidth={1.5} className={on ? 'fill-[var(--warning-text)] text-[var(--warning-text)]' : 'text-[var(--text-secondary)]'} />;
        return onChange ? (
          <button
            key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} sur 5`}
            onClick={() => onChange(value === n ? null : n)}
            className="rounded p-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus)]"
          >{icon}</button>
        ) : <span key={n}>{icon}</span>;
      })}
    </span>
  );
}

export function ScoreBar({ label, value }: { label: string; value: number }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-[var(--text-secondary)]"><span>{label}</span><span className="tabular-nums">{v}/100</span></div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
        <div className={`h-full rounded-full ${v >= 70 ? 'bg-[var(--brand)]' : v >= 45 ? 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]' : 'bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))]'}`} style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

// ─── Navigation commune du module ─────────────────────────────────────────────
const TABS = [
  { href: '/recrutement/tableau-de-bord', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/recrutement/demandes', label: 'Demandes', icon: FileText, badge: true },
  { href: '/recrutement', label: 'Offres', icon: Briefcase, exact: true },
  { href: '/recrutement/pipeline', label: 'Pipeline', icon: KanbanSquare },
  { href: '/recrutement/entretiens', label: 'Entretiens', icon: CalendarClock },
  { href: '/recrutement/modeles', label: 'Modèles', icon: Mail },
];

export function RecruitmentNav() {
  const pathname = usePathname() || '';
  const [pending, setPending] = useState(0);

  useEffect(() => {
    if (!HR_ROLES.includes(readUserRole() ?? '')) return;
    api.get<any[]>('/recruitment/requisitions?status=PENDING')
      .then((r) => setPending(Array.isArray(r) ? r.length : 0))
      .catch(() => setPending(0));
  }, [pathname]);

  const isActive = (t: (typeof TABS)[number]) => {
    if (t.exact) {
      return pathname === '/recrutement' || pathname.startsWith('/recrutement/offres') ||
        pathname.includes('/create') || pathname.startsWith('/recrutement/manuel') || pathname.startsWith('/recrutement/ia');
    }
    if (t.href.endsWith('/pipeline')) return pathname.startsWith('/recrutement/pipeline') || pathname.startsWith('/recrutement/candidat') || pathname.startsWith('/recrutement/comparer');
    return pathname.startsWith(t.href);
  };

  return <ModuleNav ariaLabel="Navigation du recrutement" items={TABS.map(t => { const active = isActive(t); return { href:t.href, label:t.badge && pending > 0 ? t.label+' ('+pending+')' : t.label, icon:t.icon, active }; })} />;
}

// ─── En-tête de page commun ───────────────────────────────────────────────────
export function RecruitmentHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="recruitment-header">
      <div>
        <h1 className="mb-1 text-3xl font-semibold tracking-tight text-[var(--text)]">{title}</h1>
        {subtitle && <p className="text-sm text-[var(--text-secondary)]">{subtitle}</p>}
      </div>
      {actions && <div className="recruitment-header-actions">{actions}</div>}
    </div>
  );
}
