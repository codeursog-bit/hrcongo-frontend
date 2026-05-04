// ============================================================================
// lib/bulletin-templates.ts
// 5 templates prédéfinis — mises en page fondamentalement distinctes
// ============================================================================

import { BulletinTemplateConfig, BlockConfig, StyleConfig } from '@/types/bulletin-template';

// ─── Blocs par défaut (ordre et visibilité pour chaque template) ──────────────

const ALL_BLOCKS_DEFAULT: BlockConfig[] = [
  { id:'header',     label:'En-tête entreprise',      display:'table',  visible:true,  scope:'both',  order:0 },
  { id:'employee',   label:'Informations du salarié', display:'table',  visible:true,  scope:'both',  order:1 },
  { id:'time',       label:'Temps de travail',        display:'table',  visible:true,  scope:'both',  order:2 },
  { id:'salary',     label:'Rémunérations',           display:'table',  visible:true,  scope:'both',  order:3 },
  { id:'overtime',   label:'Heures supplémentaires',  display:'table',  visible:true,  scope:'both',  order:4 },
  { id:'bonuses',    label:'Primes & Avantages',      display:'table',  visible:true,  scope:'both',  order:5 },
  { id:'deductions', label:'Cotisations salariales',  display:'table',  visible:true,  scope:'both',  order:6 },
  { id:'employer',   label:'Charges patronales',      display:'table',  visible:true,  scope:'both',  order:7 },
  { id:'net',        label:'Net à payer',             display:'card',   visible:true,  scope:'both',  order:8 },
  { id:'recap',      label:'Récapitulatif',           display:'table',  visible:true,  scope:'both',  order:9 },
  { id:'signatures', label:'Signatures',              display:'line',   visible:true,  scope:'both',  order:10 },
  { id:'message',    label:'Message employeur',       display:'card',   visible:false, scope:'both',  order:11 },
  { id:'legal',      label:'Mentions légales',        display:'subtle', visible:true,  scope:'app',   order:12 },
];

function cloneBlocks(overrides: Partial<BlockConfig>[] = []): BlockConfig[] {
  return ALL_BLOCKS_DEFAULT.map(b => {
    const o = overrides.find(x => x.id === b.id);
    return o ? { ...b, ...o } : { ...b };
  });
}

// ─── 1. DEFAULT — Administratif classique, sobre ─────────────────────────────

export const TEMPLATE_DEFAULT: BulletinTemplateConfig = {
  templateId: 'default',
  name: 'Classique administratif',
  style: {
    primaryColor:    '#111827',
    secondaryColor:  '#374151',
    textColor:       '#111827',
    fontFamily:      'sans',
    fontSize:        'md',
    density:         'normal',
    layout:          '1col',
    borderRadius:    4,
    headerStyle:     'line',
    showLogo:        true,
    logoPosition:    'left',
    showAddress:     true,
    showFiscalNumbers: true,
    showPageNumber:  false,
    showGeneratedDate: true,
    showHrSignature: false,
    footerMessage:   '',
  },
  blocks: cloneBlocks([
    { id:'employer', visible:false },  // Charges patron masquées par défaut
    { id:'message',  visible:false },
  ]),
};

// ─── 2. CORPORATE — 2 colonnes, bandeau pleine largeur ───────────────────────

export const TEMPLATE_CORPORATE: BulletinTemplateConfig = {
  templateId: 'corporate',
  name: 'Corporate professionnel',
  style: {
    primaryColor:    '#1e40af',
    secondaryColor:  '#3b82f6',
    textColor:       '#1e293b',
    fontFamily:      'sans',
    fontSize:        'md',
    density:         'normal',
    layout:          '2col',
    borderRadius:    8,
    headerStyle:     'dark',
    showLogo:        true,
    logoPosition:    'left',
    showAddress:     true,
    showFiscalNumbers: true,
    showPageNumber:  true,
    showGeneratedDate: true,
    showHrSignature: true,
    footerMessage:   '',
  },
  blocks: cloneBlocks([
    { id:'time',     display:'card'  },
    { id:'recap',    display:'card'  },
    { id:'message',  visible:false   },
  ]),
};

// ─── 3. MODERNE — Typographie large, net à payer très mis en avant ────────────

export const TEMPLATE_MODERNE: BulletinTemplateConfig = {
  templateId: 'moderne',
  name: 'Moderne & épuré',
  style: {
    primaryColor:    '#0ea5e9',
    secondaryColor:  '#10b981',
    textColor:       '#0f172a',
    fontFamily:      'sans',
    fontSize:        'lg',
    density:         'airy',
    layout:          '1col',
    borderRadius:    16,
    headerStyle:     'gradient',
    showLogo:        true,
    logoPosition:    'left',
    showAddress:     true,
    showFiscalNumbers: false,
    showPageNumber:  false,
    showGeneratedDate: true,
    showHrSignature: false,
    footerMessage:   '',
  },
  blocks: cloneBlocks([
    { id:'net',      display:'card',   order:3 },
    { id:'salary',   order:4 },
    { id:'overtime', order:5 },
    { id:'bonuses',  order:6 },
    { id:'deductions',order:7 },
    { id:'employer', visible:false },
    { id:'recap',    display:'card' },
    { id:'legal',    visible:false  },
  ]),
};

// ─── 4. COMPACT — Tout sur une page, dense, technique ────────────────────────

export const TEMPLATE_COMPACT: BulletinTemplateConfig = {
  templateId: 'compact',
  name: 'Compact (1 page)',
  style: {
    primaryColor:    '#475569',
    secondaryColor:  '#64748b',
    textColor:       '#1e293b',
    fontFamily:      'mono',
    fontSize:        'sm',
    density:         'compact',
    layout:          '2col',
    borderRadius:    2,
    headerStyle:     'minimal',
    showLogo:        false,
    logoPosition:    'left',
    showAddress:     true,
    showFiscalNumbers: true,
    showPageNumber:  false,
    showGeneratedDate: true,
    showHrSignature: false,
    footerMessage:   '',
  },
  blocks: cloneBlocks([
    { id:'time',     display:'line'  },
    { id:'recap',    display:'line'  },
    { id:'employer', display:'line'  },
    { id:'signatures', visible:false },
    { id:'message',  visible:false   },
    { id:'legal',    visible:false   },
  ]),
};

// ─── 5. PREMIUM — Logo centré, fond teinté, icônes, pied élaboré ─────────────

export const TEMPLATE_PREMIUM: BulletinTemplateConfig = {
  templateId: 'premium',
  name: 'Premium & soigné',
  style: {
    primaryColor:    '#7c3aed',
    secondaryColor:  '#a855f7',
    textColor:       '#1e1b4b',
    fontFamily:      'sans',
    fontSize:        'md',
    density:         'airy',
    layout:          '1col',
    borderRadius:    16,
    headerStyle:     'dark',
    showLogo:        true,
    logoPosition:    'center',
    showAddress:     true,
    showFiscalNumbers: true,
    showPageNumber:  true,
    showGeneratedDate: true,
    showHrSignature: true,
    footerMessage:   'Ce bulletin de paie est généré automatiquement et certifié conforme par KonzaRH.',
  },
  blocks: cloneBlocks([
    { id:'message',  visible:true, order:12 },
    { id:'legal',    scope:'app'  },
  ]),
};

// ─── Registre des templates ───────────────────────────────────────────────────

export const TEMPLATES: Record<string, BulletinTemplateConfig> = {
  default:   TEMPLATE_DEFAULT,
  corporate: TEMPLATE_CORPORATE,
  moderne:   TEMPLATE_MODERNE,
  compact:   TEMPLATE_COMPACT,
  premium:   TEMPLATE_PREMIUM,
};

export const TEMPLATE_LIST = [
  TEMPLATE_DEFAULT,
  TEMPLATE_CORPORATE,
  TEMPLATE_MODERNE,
  TEMPLATE_COMPACT,
  TEMPLATE_PREMIUM,
];

// Retourne une copie profonde du template de base pour la réinitialisation
export function getBaseTemplate(templateId: string): BulletinTemplateConfig {
  const base = TEMPLATES[templateId] ?? TEMPLATE_DEFAULT;
  return JSON.parse(JSON.stringify(base));
}
