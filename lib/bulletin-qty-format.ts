// ============================================================================
// lib/bulletin-qty-format.ts
//
// Formatage partagé des colonnes « Nombre » et « Base » des bulletins
// (gabarits Inf, Classique, Clarifié et standard).
//
// Principe : Nombre × Base = Gain, avec « Base » = valeur d'UNE unité
// (un jour, une heure…). Les deux valeurs viennent telles quelles du back
// (payroll_items.quantity / payroll_items.base) — aucun calcul ici, on ne
// fait que les mettre en forme.
// ============================================================================

const toNum = (v: any): number => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

/**
 * Valeur d'une unité (colonne Base).
 * - entier            → « 1 000 »
 * - non rond          → « 18 210,38 » (2 décimales, pour que
 *                        Nombre × Base retombe sur le Gain affiché)
 * - vide / 0 / null   → ''
 */
export function formatUnitBase(v: any): string {
  if (v == null || v === '') return '';
  const x = toNum(v);
  if (x === 0) return '';
  if (Number.isInteger(x) || Math.abs(x - Math.round(x)) < 0.005) {
    return Math.round(x).toLocaleString('fr-FR');
  }
  return x.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Nombre d'unités (colonne Nombre).
 * - entier   → « 26 »
 * - décimal  → « 20,5 »
 * - vide / 0 → ''
 */
export function formatQty(v: any): string {
  if (v == null || v === '') return '';
  const x = toNum(v);
  if (x === 0) return '';
  if (Number.isInteger(x)) return String(x);
  return x.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}