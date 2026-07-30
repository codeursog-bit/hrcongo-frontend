// ============================================================================
// 📁 lib/nationalities.ts
// Liste des nationalités proposées dans les listes déroulantes (création,
// édition employé). Les libellés correspondent exactement à ceux normalisés
// côté backend (common/utils/nationality.util.ts) — même si un utilisateur
// tape "congo" ou "CG" à l'import Excel, le backend range ça sous le même
// libellé "Congo" qu'on retrouve ici, donc pas de doublon dans les filtres.
// ============================================================================

export const NATIONALITIES: string[] = [
  'Congo',
  'République Démocratique du Congo',
  'Cameroun',
  'Gabon',
  'Tchad',
  'République Centrafricaine',
  'Guinée Équatoriale',
  'Angola',
  'Bénin',
  "Côte d'Ivoire",
  'Sénégal',
  'Mali',
  'Togo',
  'Burkina Faso',
  'Niger',
  'Guinée',
  'Nigeria',
  'Mauritanie',
  'Maroc',
  'Algérie',
  'Tunisie',
  'Égypte',
  'Afrique du Sud',
  'Rwanda',
  'Burundi',
  'Kenya',
  'Ghana',
  'Madagascar',
  'France',
  'Belgique',
  'Suisse',
  'Canada',
  'États-Unis',
  'Royaume-Uni',
  'Chine',
  'Inde',
  'Liban',
  'Turquie',
  'Portugal',
  'Italie',
];

export const NATIONALITY_OPTIONS = NATIONALITIES.map((label) => ({ value: label, label }));