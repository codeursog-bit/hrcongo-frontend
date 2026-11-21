// ============================================================================
// 📁 lib/contract-templates.ts
// Types + petits utilitaires partagés par l'éditeur, la liste et la génération.
// ============================================================================

export interface CatalogVariable {
  key: string;
  label: string;
  group: string;
  source: 'EMPLOYEE' | 'COMPANY' | 'LEGAL' | 'COMPUTED' | 'MANUAL' | 'CUSTOM';
  type: string;
  example: string;
}

export interface TemplateSettings {
  fontFamily: string;
  fontSize: number;
  letterhead: boolean;
  /** Présent si le modèle est une copie d'un modèle Konza RH */
  fromSystemTemplate?: string;
  /** L'entreprise confirme avoir adapté le modèle et l'avoir fait relire par un juriste */
  legalReviewed?: boolean;
}

export const DEFAULT_SETTINGS: TemplateSettings = {
  fontFamily: 'Times New Roman',
  fontSize: 11,
  letterhead: true,
};

export const FONT_CHOICES = ['Times New Roman', 'Arial', 'Calibri', 'Bookman Old Style', 'Garamond', 'Verdana'];

export interface TemplateListItem {
  id: string;
  name: string;
  category: string;
  description: string | null;
  isSystem: boolean;
  companyId: string | null;
  version: number;
  updatedAt: string;
  settings?: Partial<TemplateSettings>;
}

export interface TemplateFull extends TemplateListItem {
  content: any; // document TipTap JSON
  settings: Partial<TemplateSettings>;
}

export interface ResolvedVariable {
  key: string;
  label: string;
  group: string;
  source: string;
  type: string;
  value: string;
  missing: boolean;
  overridden: boolean;
}

export const CATEGORIES: { value: string; label: string }[] = [
  { value: 'CDI', label: 'CDI' },
  { value: 'CDD', label: 'CDD' },
  { value: 'ESSAI', label: 'Période d\'essai' },
  { value: 'STAGE', label: 'Stage' },
  { value: 'PRESTATION', label: 'Prestation / consultant' },
  { value: 'AUTRE', label: 'Autre' },
];

export const SOURCE_LABEL: Record<string, string> = {
  EMPLOYEE: 'Fiche employé',
  COMPANY: 'Entreprise',
  LEGAL: 'Taux légal',
  COMPUTED: 'Calcul de paie',
  MANUAL: 'À saisir',
  CUSTOM: 'Personnalisée',
  UNKNOWN: 'Inconnue',
};

export const EMPTY_DOC = { type: 'doc', content: [{ type: 'paragraph' }] };

/** Télécharge un Blob renvoyé par api.getBlob(). */
export function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** « Date de naissance » → date_naissance (clé de variable personnalisée). */
export function slugKey(label: string): string {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 50);
}

export interface ImportDocxResult {
  content: any;
  settings: TemplateSettings;
  warnings: string[];
  stats: { paragraphs: number; tables: number; lists: number; gaps: number };
}

/** Sources dont la valeur peut être mémorisée une fois pour toute l'entreprise. */
export const SAVABLE_SOURCES = ['COMPANY', 'CUSTOM'];