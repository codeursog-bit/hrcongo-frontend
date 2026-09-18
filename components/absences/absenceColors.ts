// ============================================================================
// 📁 components/absences/absenceColors.ts
// ✅ Traduit les `colorKey` sémantiques renvoyés par
//    /absence-tracking/* (backend) en couleurs réelles du design system
//    front. Le backend ne connaît jamais de couleur concrète — seulement un
//    identifiant logique (colorKey) — pour rester libre de toute décision
//    visuelle. Ce fichier est l'unique endroit à modifier pour retoucher la
//    palette du module.
//
// ✅ Palette resserrée à émeraude (positif/présence) + ambre (secondaire/
//    attention) + neutre (fermé/non applicable) + rouge (négatif/injustifié),
//    cohérent avec le reste de l'app. Les clés (colorKey) elles-mêmes ne
//    changent pas — seules les couleurs qu'elles pointent ont bougé, donc
//    rien à modifier côté backend.
// ============================================================================

export interface ColorDef {
  hex: string;       // utilisé par recharts (fill/stroke)
  bg: string;         // pastille / badge
  text: string;
  border: string;
}

export const COLOR_MAP: Record<string, ColorDef> = {
  success:       { hex: '#10b981', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
  'success-light': { hex: '#34d399', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-500 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
  teal:          { hex: '#10b981', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
  neutral:       { hex: '#6b7280', bg: 'bg-[var(--surface-2)]', text: 'text-[var(--text-muted)]', border: 'border-[var(--border)]' },
  purple:        { hex: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
  pink:          { hex: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
  indigo:        { hex: '#10b981', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
  violet:        { hex: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-500 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
  amber:         { hex: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
  'slate-dark':  { hex: '#334155', bg: 'bg-[var(--surface-2)]', text: 'text-[var(--text-muted)]', border: 'border-[var(--border)]' },
  sky:           { hex: '#10b981', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
  orange:        { hex: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
  rose:          { hex: '#ef4444', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-300', border: 'border-red-200 dark:border-red-800' },
  holiday:       { hex: '#94a3b8', bg: 'bg-[var(--surface-2)]', text: 'text-[var(--text-muted)]', border: 'border-[var(--border)]' },
  presence:      { hex: '#10b981', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
  remote:        { hex: '#10b981', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
  late:          { hex: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
};

export function colorFor(colorKey?: string | null): ColorDef {
  return COLOR_MAP[colorKey ?? ''] ?? COLOR_MAP.neutral;
}

/** Libellés d'affichage pour les 4 classements ciblés renvoyés par le backend (leaderboards / departmentLeaderboards). */
export const LEADERBOARD_LABELS: Record<string, string> = {
  maladie: 'Maladie',
  conventionnelle: 'Conventionnelle (maladie, maternité, paternité…)',
  exceptionnelle: 'Exceptionnelle (mariage, décès, naissance…)',
  injustifiee: 'Non justifiée',
};

export const FAMILY_ORDER = ['CONGE_STATUTAIRE', 'CONVENTIONNELLE', 'EXCEPTIONNELLE', 'INJUSTIFIEE', 'FERIE', 'PRESENCE'];