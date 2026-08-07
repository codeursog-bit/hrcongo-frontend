// ============================================================================
// 📁 lib/absence-tracking-colors.ts
// ✅ Mappe les colorKey sémantiques renvoyés par /absence-tracking (success,
//    warning, danger, info, neutral, holiday, purple) sur la palette RÉELLE
//    déjà utilisée dans le reste de l'app (cf. rapports/departements,
//    STATUS_CONFIG de la page demandes d'absence, et le calendrier mensuel
//    de presences/MonthlyView.tsx dont on reprend ici le même vocabulaire de
//    couleurs pleines pour la grille + la légende). Rien n'est copié du
//    fichier Excel de référence — uniquement nos propres couleurs.
// ============================================================================

export interface ColorTokens {
  hex: string;       // pour recharts (Cell fill, Line stroke...)
  dot: string;        // pastille ronde
  chip: string;        // badge/legend chip (fond + texte, light & dark)
  cellBg: string;      // fond de cellule dans la grille calendrier (pastel)
  cellText: string;
  solid: string;       // ✅ bloc plein — même vocabulaire que le calendrier
                        //    de présences (bg-emerald-400, bg-red-400, etc.)
}

export const COLOR_TOKENS: Record<string, ColorTokens> = {
  success: {
    hex: '#10B981',
    dot: 'bg-emerald-500',
    chip: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800',
    cellBg: 'bg-emerald-100 dark:bg-emerald-500/20',
    cellText: 'text-emerald-700 dark:text-emerald-300',
    solid: 'bg-emerald-400',
  },
  warning: {
    hex: '#F59E0B',
    dot: 'bg-amber-500',
    chip: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
    cellBg: 'bg-amber-100 dark:bg-amber-500/20',
    cellText: 'text-amber-700 dark:text-amber-300',
    solid: 'bg-orange-400',
  },
  danger: {
    hex: '#EF4444',
    dot: 'bg-red-500',
    chip: 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
    cellBg: 'bg-red-100 dark:bg-red-500/20',
    cellText: 'text-red-700 dark:text-red-300',
    solid: 'bg-red-400',
  },
  info: {
    hex: '#0EA5E9',
    dot: 'bg-sky-500',
    chip: 'bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-800',
    cellBg: 'bg-sky-100 dark:bg-sky-500/20',
    cellText: 'text-sky-700 dark:text-sky-300',
    solid: 'bg-sky-400',
  },
  purple: {
    hex: '#8B5CF6',
    dot: 'bg-violet-500',
    chip: 'bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-800',
    cellBg: 'bg-violet-100 dark:bg-violet-500/20',
    cellText: 'text-violet-700 dark:text-violet-300',
    solid: 'bg-purple-400',
  },
  holiday: {
    hex: '#6366F1',
    dot: 'bg-indigo-500',
    chip: 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800',
    cellBg: 'bg-indigo-100 dark:bg-indigo-500/20',
    cellText: 'text-indigo-700 dark:text-indigo-300',
    solid: 'bg-blue-400',
  },
  neutral: {
    hex: '#64748B',
    dot: 'bg-slate-400',
    chip: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    cellBg: 'bg-slate-100 dark:bg-slate-700/40',
    cellText: 'text-slate-600 dark:text-slate-300',
    solid: 'bg-gray-300 dark:bg-gray-700',
  },
  teal: {
    hex: '#14B8A6',
    dot: 'bg-teal-500',
    chip: 'bg-teal-50 text-teal-700 border-teal-100 dark:bg-teal-900/20 dark:text-teal-300 dark:border-teal-800',
    cellBg: 'bg-teal-100 dark:bg-teal-500/20',
    cellText: 'text-teal-700 dark:text-teal-300',
    solid: 'bg-teal-400',
  },
  pink: {
    hex: '#EC4899',
    dot: 'bg-pink-500',
    chip: 'bg-pink-50 text-pink-700 border-pink-100 dark:bg-pink-900/20 dark:text-pink-300 dark:border-pink-800',
    cellBg: 'bg-pink-100 dark:bg-pink-500/20',
    cellText: 'text-pink-700 dark:text-pink-300',
    solid: 'bg-pink-400',
  },
  rose: {
    hex: '#E11D48',
    dot: 'bg-rose-600',
    chip: 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800',
    cellBg: 'bg-rose-100 dark:bg-rose-500/20',
    cellText: 'text-rose-700 dark:text-rose-300',
    solid: 'bg-rose-600',
  },
  orange: {
    hex: '#FB923C',
    dot: 'bg-orange-500',
    chip: 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800',
    cellBg: 'bg-orange-100 dark:bg-orange-500/20',
    cellText: 'text-orange-700 dark:text-orange-300',
    solid: 'bg-orange-500',
  },
  // ✅ Statuts de présence (pas des absences) — mêmes tons cyan que le repère
  //    "Jour ouvrable" de la légende, mais version pleine pour un jour confirmé
  presence: {
    hex: '#22D3EE',
    dot: 'bg-cyan-500',
    chip: 'bg-cyan-50 text-cyan-700 border-cyan-100 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-800',
    cellBg: 'bg-cyan-100 dark:bg-cyan-500/20',
    cellText: 'text-cyan-700 dark:text-cyan-300',
    solid: 'bg-cyan-400',
  },
  remote: {
    hex: '#60A5FA',
    dot: 'bg-blue-500',
    chip: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
    cellBg: 'bg-blue-100 dark:bg-blue-500/20',
    cellText: 'text-blue-700 dark:text-blue-300',
    solid: 'bg-blue-400',
  },
  late: {
    hex: '#FACC15',
    dot: 'bg-yellow-500',
    chip: 'bg-yellow-50 text-yellow-700 border-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800',
    cellBg: 'bg-yellow-100 dark:bg-yellow-500/20',
    cellText: 'text-yellow-700 dark:text-yellow-300',
    solid: 'bg-yellow-400',
  },
};

export function colorFor(colorKey: string): ColorTokens {
  return COLOR_TOKENS[colorKey] ?? COLOR_TOKENS.neutral;
}

// Palette de secours pour les graphiques quand on a besoin d'une série ordonnée
// (identique à la palette déjà utilisée dans rapports/departements)
export const CHART_PALETTE = ['#0EA5E9', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1', '#EF4444', '#64748B'];