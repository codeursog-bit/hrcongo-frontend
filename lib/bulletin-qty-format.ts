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

/**
 * Sur une ligne de gain / indemnité, un « taux » ≥ 1 n'est PAS un pourcentage :
 * les vrais taux sont décimaux (0,06 = 6 %, 0,26 = 26 %). C'est une quantité
 * enregistrée dans `rate` (ex. bulletin saisi / modifié à la main, où « rate »
 * porte la quantité). Les gabarits à colonnes séparées l'affichent donc dans
 * « Nombre », jamais dans « Taux » — pour que le nombre soit toujours au même
 * endroit sur toutes les lignes.
 */
export function isQtyLikeRate(item: any): boolean {
  const q = Number(item?.quantity);
  if (Number.isFinite(q) && q !== 0) return false; // une vraie quantité existe déjà
  const r = item?.rate;
  if (r == null || r === '') return false;
  return Number(r) >= 1;
}

/**
 * Taux décimal → pourcentage avec « % », comme la ligne CNSS (« 4% »).
 * 0,26 → « 26% » · 0,0227 → « 2,27% » · 0,005 → « 0,5% ».
 * Hors ]0 ; 1[ (pas un taux décimal) → '' (l'appelant gère).
 */
export function formatRatePct(rate: any): string {
  const r = Number(rate);
  if (!Number.isFinite(r) || r <= 0 || r >= 1) return '';
  return (r * 100).toFixed(3).replace('.', ',').replace(/,?0+$/, '') + '%';
}

/**
 * Ancien drapeau d'affichage « rate = 1 » posé sur les taxes à montant fixe
 * (TOL…). Ce n'est PAS un taux : une taxe fixe n'a ni taux ni nombre, sa base
 * est déjà son montant. Les nouveaux bulletins n'ont plus ce drapeau ; ce test
 * masque le « 1 » sur ceux déjà générés.
 */
export function isFixedTaxFlag(item: any): boolean {
  if (typeof item?.code !== 'string' || !item.code.startsWith('CTAX')) return false;
  const q = Number(item?.quantity);
  if (Number.isFinite(q) && q !== 0) return false;
  return Number(item?.rate) === 1;
}