// ============================================================================
// 📁 lib/absence-tracking-colors.ts
// ✅ Mappe les colorKey sémantiques renvoyés par /absence-tracking (success,
//    warning, danger, info, neutral, holiday, purple) sur la palette RÉELLE
//    déjà utilisée dans le reste de l'app (cf. rapports/departements,
//    STATUS_CONFIG de la page demandes d'absence). Rien n'est copié du
//    fichier Excel de référence — uniquement nos propres couleurs.
// ============================================================================

export interface ColorTokens {
  hex: string;       // pour recharts (Cell fill, Line stroke...)
  dot: string;        // pastille ronde
  chip: string;        // badge/legend chip (fond + texte, light & dark)
  cellBg: string;      // fond de cellule dans la grille calendrier
  cellText: string;
}

export const COLOR_TOKENS: Record<string, ColorTokens> = {
  success: {
    hex: '#10B981',
    dot: 'bg-emerald-500',
    chip: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800',
    cellBg: 'bg-emerald-100 dark:bg-emerald-500/20',
    cellText: 'text-emerald-700 dark:text-emerald-300',
  },
  warning: {
    hex: '#F59E0B',
    dot: 'bg-amber-500',
    chip: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
    cellBg: 'bg-amber-100 dark:bg-amber-500/20',
    cellText: 'text-amber-700 dark:text-amber-300',
  },
  danger: {
    hex: '#EF4444',
    dot: 'bg-red-500',
    chip: 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
    cellBg: 'bg-red-100 dark:bg-red-500/20',
    cellText: 'text-red-700 dark:text-red-300',
  },
  info: {
    hex: '#0EA5E9',
    dot: 'bg-sky-500',
    chip: 'bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-800',
    cellBg: 'bg-sky-100 dark:bg-sky-500/20',
    cellText: 'text-sky-700 dark:text-sky-300',
  },
  purple: {
    hex: '#8B5CF6',
    dot: 'bg-violet-500',
    chip: 'bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-800',
    cellBg: 'bg-violet-100 dark:bg-violet-500/20',
    cellText: 'text-violet-700 dark:text-violet-300',
  },
  holiday: {
    hex: '#6366F1',
    dot: 'bg-indigo-500',
    chip: 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800',
    cellBg: 'bg-indigo-100 dark:bg-indigo-500/20',
    cellText: 'text-indigo-700 dark:text-indigo-300',
  },
  neutral: {
    hex: '#64748B',
    dot: 'bg-slate-400',
    chip: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    cellBg: 'bg-slate-100 dark:bg-slate-700/40',
    cellText: 'text-slate-600 dark:text-slate-300',
  },
};

export function colorFor(colorKey: string): ColorTokens {
  return COLOR_TOKENS[colorKey] ?? COLOR_TOKENS.neutral;
}

// Palette de secours pour les graphiques quand on a besoin d'une série ordonnée
// (identique à la palette déjà utilisée dans rapports/departements)
export const CHART_PALETTE = ['#0EA5E9', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1', '#EF4444', '#64748B'];
