// ============================================================================
// 📁 components/absences/absenceColors.ts
// ✅ Traduit les `colorKey` sémantiques renvoyés par
//    /absence-tracking/* (backend) en couleurs réelles du design system
//    front. Le backend ne connaît jamais de couleur concrète — seulement un
//    identifiant logique (colorKey) — pour rester libre de toute décision
//    visuelle. Ce fichier est l'unique endroit à modifier pour retoucher la
//    palette du module.
//
// Palette du thème : codes et libellés distinguent les motifs, sans dépendre de la couleur.
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
  success:         { hex: 'var(--brand-soft)', fg: 'var(--text)', bg: 'bg-[var(--brand-soft)] ',   text: 'text-[var(--action)] ',     border: 'border-[var(--border)] ' },     // CP  Congé annuel
  'success-light': { hex: 'var(--brand-soft)', fg: 'var(--text)', bg: 'bg-[var(--brand-soft)] ',     text: 'text-[var(--action)] ',       border: 'border-[var(--border)] ' },       // CA  Congé anticipé
  neutral:         { hex: 'var(--surface-2)', fg: 'var(--text)', ...NEUTRAL_CLS },                                                                                                                       // CSS Congé sans solde (+ défaut)
  // ── Présence ───────────────────────────────────────────────────────────
  presence:        { hex: 'color-mix(in srgb, var(--green) 18%, var(--surface))', fg: 'var(--text)', bg: 'bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] ', text: 'text-[var(--success-text)] ', border: 'border-[var(--border)] ' }, // Présent
  remote:          { hex: 'var(--brand-soft)', fg: 'var(--text)', bg: 'bg-[var(--brand-soft)] ',   text: 'text-[var(--action)] ',     border: 'border-[var(--border)] ' },     // Télétravail
  late:            { hex: 'color-mix(in srgb, var(--mustard) 22%, var(--surface))', fg: 'var(--text)', bg: 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] ', text: 'text-[var(--warning-text)] ', border: 'border-[var(--border)] ' }, // Retard
  teal:            { hex: 'var(--brand-soft)', fg: 'var(--text)', bg: 'bg-[var(--brand-soft)] ',   text: 'text-[var(--action)] ',     border: 'border-[var(--border)] ' },     // CPT Congé payé (travaillé)
  // ── Conventionnelle (violets / rose) ───────────────────────────────────
  purple:          { hex: 'var(--brand-soft)', fg: 'var(--text)', bg: 'bg-[var(--brand-soft)] ', text: 'text-[var(--action)] ', border: 'border-[var(--border)] ' }, // MAL Maladie
  pink:            { hex: 'var(--brand-soft)', fg: 'var(--text)', bg: 'bg-[var(--brand-soft)] ',   text: 'text-[var(--action)] ',     border: 'border-[var(--border)] ' },     // MAT Maternité
  indigo:          { hex: 'var(--brand-soft)', fg: 'var(--text)', bg: 'bg-[var(--brand-soft)] ', text: 'text-[var(--action)] ', border: 'border-[var(--border)] ' }, // PAT Paternité
  violet:          { hex: 'var(--brand-soft)', fg: 'var(--text)', bg: 'bg-[var(--brand-soft)] ', text: 'text-[var(--action)] ', border: 'border-[var(--border)] ' }, // CONV_AUTRE
  // ── Exceptionnelle (oranges / ambre / ocre) ────────────────────────────
  amber:           { hex: 'var(--brand-soft)', fg: 'var(--text)', bg: 'bg-[var(--brand-soft)] ', text: 'text-[var(--action)] ', border: 'border-[var(--border)] ' }, // MAR Mariage
  sky:             { hex: 'var(--brand-soft)', fg: 'var(--text)', bg: 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] ',  text: 'text-[var(--warning-text)] ',   border: 'border-[var(--border)] ' },   // NAI Naissance
  orange:          { hex: 'var(--brand-soft)', fg: 'var(--text)', bg: 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] ', text: 'text-[var(--warning-text)] ', border: 'border-[var(--border)] ' }, // EXC_AUTRE
  'slate-dark':    { hex: 'var(--brand-soft)', fg: 'var(--text)', ...NEUTRAL_CLS },                                                                                                                       // DEC Décès
  // ── Non justifiée (rouge, réservé à ce seul motif) ─────────────────────
  rose:            { hex: 'color-mix(in srgb, var(--danger) 18%, var(--surface))', fg: 'var(--text)', bg: 'bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] ',     text: 'text-[var(--danger-text)] ',       border: 'border-[var(--border)] ' },       // ABS
  // ── Calendrier ─────────────────────────────────────────────────────────
  holiday:         { hex: 'var(--surface-2)', fg: 'var(--text)', ...NEUTRAL_CLS },                                                                                                                       // JF Jour férié
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