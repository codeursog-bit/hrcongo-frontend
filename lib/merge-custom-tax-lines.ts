// ============================================================================
// 📁 lib/merge-custom-tax-lines.ts
//
// Fusionne, pour une même taxe configurée (CompanyTax), la ligne « part
// salariale » (code CTAX_<CODE>) et la ligne « part patronale »
// (code CTAX_EMP_<CODE>) en UNE seule ligne de bulletin :
//   - part salarié  → colonnes Retenue / taux salarié
//   - part patronal → colonnes Charges patronales / taux patronal
//
// Utilisé par les 4 modèles de bulletin (Default, Classique, Clarifié, Inf).
// ============================================================================

export interface MergedTaxLine {
  key: string;
  /** Item salarié (CTAX_<CODE>) — null si la taxe n'a pas de part salariale. */
  emp: any | null;
  /** Item patronal (CTAX_EMP_<CODE>) — null si la taxe n'a pas de part patronale. */
  pat: any | null;
}

const taxKey = (code: unknown): string =>
  String(code ?? '').replace(/^CTAX_EMP_/, '').replace(/^CTAX_/, '');

/** Retire le suffixe historique « (part patronale) » des anciens libellés. */
export const cleanTaxLabel = (label: unknown): string =>
  String(label ?? '').replace(/\s*\(part patronale\)\s*$/i, '').trim();

export function mergeCustomTaxLines(empItems: any[], patItems: any[]): MergedTaxLine[] {
  const map = new Map<string, MergedTaxLine>();

  for (const item of empItems ?? []) {
    let key = taxKey(item?.code);
    // Deux items salariés avec la même clé : on ne perd aucune ligne.
    if (map.get(key)?.emp) key = `${key}#${item?.id ?? map.size}`;
    if (!map.has(key)) map.set(key, { key, emp: null, pat: null });
    map.get(key)!.emp = item;
  }

  for (const item of patItems ?? []) {
    let key = taxKey(item?.code);
    if (map.get(key)?.pat) key = `${key}#${item?.id ?? map.size}`;
    if (!map.has(key)) map.set(key, { key, emp: null, pat: null });
    map.get(key)!.pat = item;
  }

  return Array.from(map.values());
}