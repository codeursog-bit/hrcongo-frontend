// ============================================================================
// 📁 components/absences/absenceColors.ts
// ✅ Traduit les `colorKey` sémantiques renvoyés par
//    /absence-tracking/* (backend) en couleurs réelles du design system
//    front. Le backend ne connaît jamais de couleur concrète — seulement un
//    identifiant logique (colorKey) — pour rester libre de toute décision
//    visuelle. Ce fichier est l'unique endroit à modifier pour retoucher la
//    palette du module.
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
  teal:          { hex: '#14b8a6', bg: 'bg-teal-50 dark:bg-teal-900/20', text: 'text-teal-600 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-800' },
  neutral:       { hex: '#6b7280', bg: 'bg-gray-50 dark:bg-gray-800', text: 'text-gray-500 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-700' },
  purple:        { hex: '#8b5cf6', bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-600 dark:text-violet-300', border: 'border-violet-200 dark:border-violet-800' },
  pink:          { hex: '#ec4899', bg: 'bg-pink-50 dark:bg-pink-900/20', text: 'text-pink-600 dark:text-pink-300', border: 'border-pink-200 dark:border-pink-800' },
  indigo:        { hex: '#6366f1', bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-600 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800' },
  violet:        { hex: '#a78bfa', bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-500 dark:text-violet-300', border: 'border-violet-200 dark:border-violet-800' },
  amber:         { hex: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
  'slate-dark':  { hex: '#334155', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-300', border: 'border-slate-300 dark:border-slate-700' },
  sky:           { hex: '#0ea5e9', bg: 'bg-sky-50 dark:bg-sky-900/20', text: 'text-sky-600 dark:text-sky-300', border: 'border-sky-200 dark:border-sky-800' },
  orange:        { hex: '#f97316', bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800' },
  rose:          { hex: '#f43f5e', bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-600 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800' },
  holiday:       { hex: '#94a3b8', bg: 'bg-slate-50 dark:bg-slate-800', text: 'text-slate-500 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-700' },
  presence:      { hex: '#22c55e', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
  remote:        { hex: '#3b82f6', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
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