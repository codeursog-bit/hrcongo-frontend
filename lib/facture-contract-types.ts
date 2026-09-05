// ============================================================================
// lib/facture-contract-types.ts
//
// Source unique de vérité pour savoir quels contractType reçoivent une
// FACTURE (FactureRendererForfait / FactureRendererDetaillee) plutôt qu'un
// BULLETIN DE PAIE classique.
//
// Décision produit (sept. 2026) : prestataire, consultant, intérimaire ET
// stagiaire — le stagiaire touche un forfait/indemnité de stage, rarement de
// congé, avec déduction en cas d'absence, et paie sa BNC comme les autres
// s'il y est soumis. Même document que les autres profils non-salariés.
// ============================================================================

export const FACTURE_CONTRACT_TYPES: string[] = [
  'PRESTATAIRE',
  'CONSULTANT',
  'INTERIM',
  'STAGE',
];

export function isFactureContract(contractType?: string | null): boolean {
  return !!contractType && FACTURE_CONTRACT_TYPES.includes(contractType);
}