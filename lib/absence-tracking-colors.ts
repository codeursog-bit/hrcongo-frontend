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
  // ✅ Ajoutés pour les codes fins par sous-motif (refonte traçabilité) —
  // congé anticipé (variante plus claire du congé annuel), paternité,
  // conventionnelle "autre", mariage, décès, naissance.
  'success-light': {
    hex: '#34D399',
    dot: 'bg-emerald-400',
    chip: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/10 dark:text-emerald-300 dark:border-emerald-800',
    cellBg: 'bg-emerald-50 dark:bg-emerald-500/10',
    cellText: 'text-emerald-600 dark:text-emerald-300',
    solid: 'bg-emerald-300',
  },
  indigo: {
    hex: '#6366F1',
    dot: 'bg-indigo-500',
    chip: 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800',
    cellBg: 'bg-indigo-100 dark:bg-indigo-500/20',
    cellText: 'text-indigo-700 dark:text-indigo-300',
    solid: 'bg-indigo-400',
  },
  violet: {
    hex: '#A78BFA',
    dot: 'bg-violet-400',
    chip: 'bg-violet-50 text-violet-600 border-violet-100 dark:bg-violet-900/10 dark:text-violet-300 dark:border-violet-800',
    cellBg: 'bg-violet-50 dark:bg-violet-500/10',
    cellText: 'text-violet-600 dark:text-violet-300',
    solid: 'bg-violet-300',
  },
  amber: {
    hex: '#FBBF24',
    dot: 'bg-amber-400',
    chip: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
    cellBg: 'bg-amber-100 dark:bg-amber-500/20',
    cellText: 'text-amber-700 dark:text-amber-300',
    solid: 'bg-amber-400',
  },
  sky: {
    hex: '#38BDF8',
    dot: 'bg-sky-400',
    chip: 'bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-800',
    cellBg: 'bg-sky-100 dark:bg-sky-500/20',
    cellText: 'text-sky-700 dark:text-sky-300',
    solid: 'bg-sky-400',
  },
  'slate-dark': {
    hex: '#334155',
    dot: 'bg-slate-600',
    chip: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    cellBg: 'bg-slate-200 dark:bg-slate-600/40',
    cellText: 'text-slate-700 dark:text-slate-300',
    solid: 'bg-slate-500',
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

// ✅ Miroir des libellés backend (absence-tracking.constants.ts) — pour
// afficher des labels lisibles sans dépendre d'un appel API supplémentaire
// quand on manipule des données agrégées brutes (ex: comparaison d'années).
export const CODE_LABELS: Record<string, string> = {
  CP: 'Congé annuel', CA: 'Congé anticipé', CSS: 'Congé sans solde',
  MAL: 'Maladie', MAT: 'Maternité', PAT: 'Paternité', CONV_AUTRE: 'Conventionnelle — autre',
  MAR: 'Mariage', DEC: 'Décès', NAI: 'Naissance', EXC_AUTRE: 'Exceptionnelle — autre',
  ABS: 'Absence non justifiée', JF: 'Jour férié',
};

export const FAMILY_META: Record<string, { label: string; colorKey: string }> = {
  CONGE_STATUTAIRE: { label: 'Congé statutaire', colorKey: 'success' },
  CONVENTIONNELLE: { label: 'Conventionnelle', colorKey: 'purple' },
  EXCEPTIONNELLE: { label: 'Exceptionnelle', colorKey: 'amber' },
  INJUSTIFIEE: { label: 'Non justifiée', colorKey: 'rose' },
};

// ✅ Miroir de ALERT_THRESHOLDS côté backend (absence-tracking.constants.ts)
// — uniquement pour affichage ("seuil : X"), la logique d'alerte reste
// calculée côté serveur.
export const FRONT_ALERT_THRESHOLDS = {
  employeeSickDaysPerYear: 15,
  employeeSickEpisodesRolling90d: 3,
  employeeTrackableDaysPerYear: 25,
  departmentAbsenteeismRatePercent: 8,
};

// Palette de secours pour les graphiques quand on a besoin d'une série ordonnée
// (identique à la palette déjà utilisée dans rapports/departements)
export const CHART_PALETTE = ['#0EA5E9', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1', '#EF4444', '#64748B'];

// ✅ Code couleur du taux d'absentéisme — mêmes seuils que le backend
// (ALERT_THRESHOLDS.departmentAbsenteeismRatePercent = 8%). En dessous de la
// moitié du seuil = sain, entre les deux = à surveiller, au-dessus = alerte.
export function absenteeismRateTone(ratePercent: number): { text: string; bg: string; label: string } {
  if (ratePercent >= 8) return { text: 'text-red-600 dark:text-red-400', bg: 'from-red-400 to-rose-500', label: 'Élevé' };
  if (ratePercent >= 4) return { text: 'text-amber-600 dark:text-amber-400', bg: 'from-amber-400 to-orange-500', label: 'À surveiller' };
  return { text: 'text-emerald-600 dark:text-emerald-400', bg: 'from-emerald-400 to-teal-500', label: 'Sain' };
}