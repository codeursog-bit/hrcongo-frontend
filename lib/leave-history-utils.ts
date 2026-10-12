// ============================================================================
// 📁 lib/leave-history-utils.ts
// ✅ Libellés, couleurs et helpers partagés par les pages
//    /conges/historique et /conges/diagrammes
// ============================================================================

export const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
export const MONTHS_SHORT = MONTHS.map(m => m.slice(0, 3));

export const LEAVE_TYPE_LABELS: Record<string, string> = {
  ANNUAL: 'Congé annuel',
  ANNUAL_ANTICIPATED: 'Annuel anticipé',
  COMPENSATORY: 'Compensatoire',
  SICK: 'Maladie',
  MATERNITY: 'Maternité',
  PATERNITY: 'Paternité',
  UNPAID: 'Sans solde',
};

// Couleurs hex (utilisées dans les SVG — les classes Tailwind ne s'appliquent pas aux attributs fill)
export const LEAVE_TYPE_COLORS: Record<string, string> = {
  ANNUAL: '#10b981',
  ANNUAL_ANTICIPATED: '#f59e0b',
  COMPENSATORY: '#06b6d4',
  SICK: '#ef4444',
  MATERNITY: '#ec4899',
  PATERNITY: '#8b5cf6',
  UNPAID: '#64748b',
};

export const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  APPROVED: 'Approuvée',
  REJECTED: 'Refusée',
  CANCELLED: 'Annulée',
};
export const STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
  APPROVED: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
  REJECTED: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
  CANCELLED: 'bg-[var(--surface-2)] text-[var(--text-muted)]',
};

export const PHASE_LABELS: Record<string, string> = {
  IN_PROGRESS: 'En congé',
  COMPLETED: 'Terminé',
  UPCOMING: 'À venir',
  PENDING: 'En attente',
};
export const PHASE_BADGE: Record<string, string> = {
  IN_PROGRESS: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
  COMPLETED: 'bg-[var(--surface-2)] text-[var(--text-muted)]',
  UPCOMING: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
  PENDING: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
};

export const fmtDate = (d?: string | Date | null) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { timeZone: 'UTC' }) : '—';

export const fmtDateTime = (d?: string | Date | null) =>
  d
    ? new Date(d).toLocaleString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Brazzaville',
      })
    : '—';

export const fmtDays = (n: number) =>
  `${Number.isInteger(n) ? n : n.toFixed(1).replace('.', ',')} j`;

export const initials = (first?: string, last?: string) =>
  `${(first || '?')[0] ?? ''}${(last || '')[0] ?? ''}`.toUpperCase();

/** Jour de l'année (0-based) d'une date ISO, en UTC. */
export const dayOfYear = (iso: string | Date) => {
  const d = new Date(iso);
  const start = Date.UTC(d.getUTCFullYear(), 0, 1);
  return Math.floor((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - start) / 86400000);
};

export const daysInYear = (year: number) =>
  (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365;

/** Export CSV simple (séparateur ; pour Excel FR, BOM UTF-8). */
export function downloadCsv(filename: string, header: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [header, ...rows].map(r => r.map(esc).join(';')).join('\r\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}