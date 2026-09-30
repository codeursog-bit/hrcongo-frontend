// ============================================================================
// 📁 components/absences/absenceColors.ts
// ✅ Traduit les `colorKey` sémantiques renvoyés par
//    /absence-tracking/* (backend) en couleurs réelles du design system
//    front. Le backend ne connaît jamais de couleur concrète — seulement un
//    identifiant logique (colorKey) — pour rester libre de toute décision
//    visuelle. Ce fichier est l'unique endroit à modifier pour retoucher la
//    palette du module.
//
// 🎨 PALETTE — une couleur RÉELLEMENT distincte par motif.
//    Avant : 17 motifs partageaient 7 couleurs (30 paires quasi identiques :
//    Maladie = Mariage = Retard, Présent = Naissance = Paternité…).
//    Maintenant : 17 couleurs distinctes, différence perçue minimale entre
//    deux motifs quelconques ΔE(CIEDE2000) ≥ 16 (au-delà de ~10 c'est net).
//    Repères par famille (pour retrouver un motif d'un coup d'œil) :
//      • Présence ............ verts / citron / jaune  (+ cyan pour "congé payé travaillé")
//      • Congé statutaire .... bleus, gris pour le congé sans solde
//      • Conventionnelle ..... violets et rose  (maladie, maternité, paternité)
//      • Exceptionnelle ...... oranges / ambre / ocre, ardoise foncé pour le décès
//      • Non justifiée ....... rouge (jamais réutilisé ailleurs)
//    Les clés (colorKey) sont des IDENTIFIANTS sémantiques, pas des couleurs
//    littérales (ex : la clé "amber" désigne Mariage, dont la teinte est orange).
//    La couleur du texte dans les cases (`fg`) garantit un contraste ≥ 4.5:1.
// ============================================================================

export interface ColorDef {
  hex: string;       // utilisé par recharts (fill/stroke) et les cases de la grille
  fg: string;        // couleur du texte posé sur `hex` (contraste ≥ 4.5:1)
  bg: string;         // pastille / badge
  text: string;
  border: string;
}

const NEUTRAL_CLS = { bg: 'bg-[var(--surface-2)]', text: 'text-[var(--text-muted)]', border: 'border-[var(--border)]' };

export const COLOR_MAP: Record<string, ColorDef> = {
  // ── Congé statutaire (bleus) ───────────────────────────────────────────
  success:         { hex: '#2563eb', fg: '#ffffff', bg: 'bg-blue-50 dark:bg-blue-900/20',   text: 'text-blue-600 dark:text-blue-300',     border: 'border-blue-200 dark:border-blue-800' },     // CP  Congé annuel
  'success-light': { hex: '#7dd3fc', fg: '#111827', bg: 'bg-sky-50 dark:bg-sky-900/20',     text: 'text-sky-600 dark:text-sky-300',       border: 'border-sky-200 dark:border-sky-800' },       // CA  Congé anticipé
  neutral:         { hex: '#6b7280', fg: '#ffffff', ...NEUTRAL_CLS },                                                                                                                       // CSS Congé sans solde (+ défaut)
  // ── Présence ───────────────────────────────────────────────────────────
  presence:        { hex: '#059669', fg: '#111827', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' }, // Présent
  remote:          { hex: '#84cc16', fg: '#111827', bg: 'bg-lime-50 dark:bg-lime-900/20',   text: 'text-lime-700 dark:text-lime-300',     border: 'border-lime-200 dark:border-lime-800' },     // Télétravail
  late:            { hex: '#fde047', fg: '#111827', bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-200 dark:border-yellow-800' }, // Retard
  teal:            { hex: '#0891b2', fg: '#111827', bg: 'bg-cyan-50 dark:bg-cyan-900/20',   text: 'text-cyan-700 dark:text-cyan-300',     border: 'border-cyan-200 dark:border-cyan-800' },     // CPT Congé payé (travaillé)
  // ── Conventionnelle (violets / rose) ───────────────────────────────────
  purple:          { hex: '#6d28d9', fg: '#ffffff', bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-600 dark:text-violet-300', border: 'border-violet-200 dark:border-violet-800' }, // MAL Maladie
  pink:            { hex: '#db2777', fg: '#ffffff', bg: 'bg-pink-50 dark:bg-pink-900/20',   text: 'text-pink-600 dark:text-pink-300',     border: 'border-pink-200 dark:border-pink-800' },     // MAT Maternité
  indigo:          { hex: '#818cf8', fg: '#111827', bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-600 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800' }, // PAT Paternité
  violet:          { hex: '#d8b4fe', fg: '#111827', bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' }, // CONV_AUTRE
  // ── Exceptionnelle (oranges / ambre / ocre) ────────────────────────────
  amber:           { hex: '#ea580c', fg: '#111827', bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800' }, // MAR Mariage
  sky:             { hex: '#f59e0b', fg: '#111827', bg: 'bg-amber-50 dark:bg-amber-900/20',  text: 'text-amber-600 dark:text-amber-300',   border: 'border-amber-200 dark:border-amber-800' },   // NAI Naissance
  orange:          { hex: '#a16207', fg: '#ffffff', bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-800 dark:text-yellow-300', border: 'border-yellow-300 dark:border-yellow-800' }, // EXC_AUTRE
  'slate-dark':    { hex: '#334155', fg: '#ffffff', ...NEUTRAL_CLS },                                                                                                                       // DEC Décès
  // ── Non justifiée (rouge, réservé à ce seul motif) ─────────────────────
  rose:            { hex: '#b91c1c', fg: '#ffffff', bg: 'bg-red-50 dark:bg-red-900/20',     text: 'text-red-600 dark:text-red-300',       border: 'border-red-200 dark:border-red-800' },       // ABS
  // ── Calendrier ─────────────────────────────────────────────────────────
  holiday:         { hex: '#e2e8f0', fg: '#111827', ...NEUTRAL_CLS },                                                                                                                       // JF Jour férié
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

/** Ordre d'affichage de la légende de la grille (présence d'abord). */
export const LEGEND_FAMILY_ORDER = ['PRESENCE', 'CONGE_STATUTAIRE', 'CONVENTIONNELLE', 'EXCEPTIONNELLE', 'INJUSTIFIEE', 'FERIE'];

/** Titres de famille (légende groupée). */
export const FAMILY_LABEL: Record<string, string> = {
  PRESENCE: 'Présence',
  CONGE_STATUTAIRE: 'Congés',
  CONVENTIONNELLE: 'Conventionnelle',
  EXCEPTIONNELLE: 'Exceptionnelle',
  INJUSTIFIEE: 'Non justifiée',
  FERIE: 'Calendrier',
};

/** Sigle affiché DANS les cases de la grille et la légende (lisible même sans distinguer les couleurs). */
export const SHORT_CODE: Record<string, string> = {
  PRESENT: '', // présent = case pleine, sans texte (évite le bruit)
  REMOTE: 'TT',
  LATE: 'RET',
  CP: 'CP', CA: 'CA', CPT: 'CPT', CSS: 'CSS',
  MAL: 'MAL', MAT: 'MAT', PAT: 'PAT', CONV_AUTRE: 'CV',
  MAR: 'MAR', DEC: 'DÉC', NAI: 'NAI', EXC_AUTRE: 'EX',
  ABS: 'ABS',
  JF: 'JF',
};