// ============================================================================
// lib/document-template.ts
// Source unique pour les modèles de document de l'entreprise (company.documentTemplate).
//   DEFAULT  → modèle par défaut
//   ORCA     → Modèle 1 (reproduction du modèle client Orca)
//   STANDARD → Modèle 2 (gabarit Infinitium / Geolane / Arkia)
//   MODERN   → Modèle 3 (élégant, commun aux 4 types de demandes)
// ============================================================================

export type DocumentTemplate = 'DEFAULT' | 'ORCA' | 'STANDARD' | 'MODERN';

/**
 * Les modèles 2 et 3 consomment EXACTEMENT les mêmes données (catalogue
 * conventionnel des absences, nature du prêt, pièce jointe, avis signés…).
 * Partout où le code testait `=== 'STANDARD'` pour décider quelles données
 * charger / quels champs afficher, on teste maintenant ceci.
 */
export const usesStandardData = (template?: string | null): boolean =>
  template === 'STANDARD' || template === 'MODERN';

export const isModernTemplate = (template?: string | null): boolean => template === 'MODERN';