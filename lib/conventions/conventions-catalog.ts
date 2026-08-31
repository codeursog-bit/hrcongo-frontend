// ============================================================================
// 📁 lib/conventions/conventions-catalog.ts
//
// SOURCE DE VÉRITÉ UNIQUE côté front pour la liste des conventions
// sélectionnables (inscription ET paramètres entreprise — les deux pages
// important ce fichier au lieu d'avoir chacune leur propre liste locale).
//
// ⚠️ Ne contient QUE les codes confirmés identiques dans les DEUX registres
// backend (règles/grille salariale ET rupture de contrat), après
// alignement de PETROLIER→PETROLE et suppression du doublon TIC (gardé :
// NTIC) — décision actée, voir back/PATCH_conventions.service.ts_petrole-ntic.md :
//   BTP, COMMERCE, INDUSTRIE, HOTELLERIE, PHARMACIE, TRANSPORT, PETROLE, NTIC
//
// PRESSE reste exclue : gérée côté rupture de contrat mais absente de la
// grille salariale/règles — à ajouter le jour où quelqu'un digitalise ses
// données réelles côté conventions.service.ts.
// ============================================================================

import {
  HardHat, ShoppingCart, Factory, Utensils, Truck, HeartPulse, Wifi, Flame,
  type LucideIcon,
} from 'lucide-react';

export type DigitalizationStatus = 'complete' | 'pending';

export interface ConventionCoverage {
  /** Grille salariale réelle (catégories × échelons) au lieu d'un placeholder */
  salaryGrid: boolean;
  /** Barème de prime d'ancienneté fidèle au texte */
  senioritybonus: boolean;
  /** Jours de congé supplémentaires par ancienneté */
  extraLeave: boolean;
  /** Primes suggérées automatiquement à l'activation (BonusTemplate) */
  bonusPresets: boolean;
  /** Suggestions de changement d'échelon avec validation RH */
  echelonSuggestions: boolean;
}

export interface ConventionCatalogEntry {
  code: string;
  label: string;
  description: string;
  icon: LucideIcon;
  status: DigitalizationStatus;
  coverage: ConventionCoverage;
  /** Affiché dans "Voir plus" — ce qui reste à faire pour les conventions non complètes */
  missingNote?: string;
}

const NONE: ConventionCoverage = {
  salaryGrid: false,
  senioritybonus: false,
  extraLeave: false,
  bonusPresets: false,
  echelonSuggestions: false,
};

export const CONVENTIONS_CATALOG: ConventionCatalogEntry[] = [
  {
    code: 'TRANSPORT',
    label: 'Transport',
    description: 'Auxiliaires de Transport, Terminaux à Conteneurs et Assimilés',
    icon: Truck,
    status: 'complete',
    coverage: {
      salaryGrid: true,
      senioritybonus: true,
      extraLeave: true,
      bonusPresets: true,
      echelonSuggestions: true,
    },
  },
  {
    code: 'BTP',
    label: 'BTP',
    description: 'Bâtiment & Travaux Publics',
    icon: HardHat,
    status: 'complete',
    coverage: {
      salaryGrid: true,
      senioritybonus: true,
      extraLeave: true,
      bonusPresets: true,
      echelonSuggestions: false,
    },
    missingNote:
      "Pas de suggestion de changement d'échelon : l'avancement (Art.16) est décidé par l'employeur au choix, pas automatique. ⚠️ Grille salariale datée de 1990 (aucune version plus récente fournie) — bien en dessous du SMIG actuel, c'est une simple suggestion de départ que l'admin doit ajuster librement, jamais un plancher imposé.",
  },
  {
    code: 'COMMERCE',
    label: 'Commerce',
    description: 'Commerce & Distribution',
    icon: ShoppingCart,
    status: 'complete',
    coverage: {
      salaryGrid: true,
      senioritybonus: true,
      extraLeave: true,
      bonusPresets: true,
      echelonSuggestions: false,
    },
    missingNote:
      "Pas de suggestion de changement d'échelon pour cette convention : l'Art.59 laisse l'avancement à la discrétion de l'employeur (pas de progression automatique par ancienneté comme pour Transport) — ce n'est donc pas une case à cocher, juste non applicable ici.",
  },
  {
    code: 'INDUSTRIE',
    label: 'Industrie',
    description: 'Industrie & Métallurgie',
    icon: Factory,
    status: 'complete',
    coverage: {
      salaryGrid: true,
      senioritybonus: true,
      extraLeave: true,
      bonusPresets: true,
      echelonSuggestions: false,
    },
    missingNote:
      "Pas de suggestion de changement d'échelon pour cette convention : l'avancement (Art.21/68) résulte d'appréciations annuelles et d'une commission paritaire, pas d'une progression automatique. Grille confirmée depuis une image nette du barème signé — la plupart des catégories n'ont qu'1 ou 2 échelons chiffrés (le 3ème échelon n'est renseigné pour aucune catégorie dans ce barème, c'est le document original qui est ainsi, pas un manque de transcription).",
  },
  {
    code: 'PETROLE',
    label: 'Pétrole',
    description: 'Entreprises de Services Pétroliers',
    icon: Flame,
    status: 'complete',
    coverage: {
      salaryGrid: true,
      senioritybonus: true,
      extraLeave: true,
      bonusPresets: true,
      echelonSuggestions: false,
    },
    missingNote:
      "Pas de suggestion de changement d'échelon pour cette convention : l'avancement (Art.20/22) résulte d'un examen annuel au mérite décidé par la direction, pas d'une progression automatique. Grille remise à jour depuis une image nette du barème signé — échelons 1 à 6 désormais tous confirmés. ⚠️ Cette convention se renégocie quasi chaque année (12 barèmes différents entre 2010 et 2023) — la grille devra être vérifiée plus souvent que les autres.",
  },
  {
    code: 'HOTELLERIE',
    label: 'Hôtellerie',
    description: 'Hôtellerie & Restauration',
    icon: Utensils,
    status: 'pending',
    coverage: { ...NONE, salaryGrid: false },
    missingNote:
      'Aucune donnée réelle encore digitalisée pour cette convention — seuls des placeholders sont en place (grille, prime d\'ancienneté, congés, primes, échelon restent à faire).',
  },
  {
    code: 'PHARMACIE',
    label: 'Pharmacie',
    description: 'Officines de Pharmacie',
    icon: HeartPulse,
    status: 'complete',
    coverage: {
      salaryGrid: true,
      senioritybonus: true,
      extraLeave: true,
      bonusPresets: true,
      echelonSuggestions: false,
    },
    missingNote:
      "Pas de suggestion de changement d'échelon pour cette convention : le texte (Art.51) prévoit un avancement biennal après évaluation, mais le nombre d'échelons varie par catégorie (4 pour Cat.1-6, 2 pour Cat.8, 1 seul pour Cat.7/9/10) — le mécanisme générique de suggestion ne gère pas encore un plafond différent par catégorie. Grille conventionnelle datée de 2012 : une pure suggestion de départ, à ajuster librement par l'admin — certains montants sont aujourd'hui sous le SMIG légal.",
  },
  {
    code: 'NTIC',
    label: 'NTIC',
    description: 'Nouvelles Technologies & Télécoms',
    icon: Wifi,
    status: 'pending',
    coverage: { ...NONE, salaryGrid: false },
    missingNote:
      'Aucune donnée réelle encore digitalisée pour cette convention — seuls des placeholders sont en place (grille, prime d\'ancienneté, congés, primes, échelon restent à faire).',
  },
];

export function getConventionCatalogEntry(code: string | null | undefined) {
  if (!code) return undefined;
  return CONVENTIONS_CATALOG.find(c => c.code === code.toUpperCase());
}