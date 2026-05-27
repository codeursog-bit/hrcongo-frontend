// ============================================================================
// lib/bulletin-templates.ts
// 3 templates actifs — classification items identique dans les 3 renderers
// ============================================================================

import { BulletinTemplateConfig, BlockConfig } from '@/types/bulletin-template';

const ALL_BLOCKS: BlockConfig[] = [
  { id:'header',     label:'En-tête entreprise',      display:'table',  visible:true,  scope:'both', order:0  },
  { id:'employee',   label:'Informations du salarié', display:'table',  visible:true,  scope:'both', order:1  },
  { id:'time',       label:'Temps de travail',        display:'table',  visible:true,  scope:'both', order:2  },
  { id:'salary',     label:'Rémunérations',           display:'table',  visible:true,  scope:'both', order:3  },
  { id:'overtime',   label:'Heures supplémentaires',  display:'table',  visible:true,  scope:'both', order:4  },
  { id:'bonuses',    label:'Primes & Avantages',      display:'table',  visible:true,  scope:'both', order:5  },
  { id:'deductions', label:'Cotisations salariales',  display:'table',  visible:true,  scope:'both', order:6  },
  { id:'employer',   label:'Charges patronales',      display:'table',  visible:true,  scope:'both', order:7  },
  { id:'net',        label:'Net à payer',             display:'card',   visible:true,  scope:'both', order:8  },
  { id:'recap',      label:'Récapitulatif',           display:'table',  visible:true,  scope:'both', order:9  },
  { id:'signatures', label:'Signatures',              display:'line',   visible:true,  scope:'both', order:10 },
  { id:'message',    label:'Message employeur',       display:'card',   visible:false, scope:'both', order:11 },
  { id:'legal',      label:'Mentions légales',        display:'subtle', visible:true,  scope:'app',  order:12 },
];

function cloneBlocks(overrides: Partial<BlockConfig>[] = []): BlockConfig[] {
  return ALL_BLOCKS.map(b => {
    const o = overrides.find(x => x.id === b.id);
    return o ? { ...b, ...o } : { ...b };
  });
}

// ─── 1. DEFAULT — Classique administratif (IESM) ─────────────────────────────

export const TEMPLATE_DEFAULT: BulletinTemplateConfig = {
  templateId: 'default',
  name: 'Classique administratif (IESM)',
  style: {
    primaryColor:      '#000000',
    secondaryColor:    '#555555',
    textColor:         '#000000',
    fontFamily:        'sans',
    fontSize:          'md',
    density:           'compact',
    layout:            '1col',
    borderRadius:      0,
    headerStyle:       'line',
    showLogo:          true,
    logoPosition:      'left',
    showAddress:       true,
    showFiscalNumbers: true,
    showPageNumber:    false,
    showGeneratedDate: false,
    showHrSignature:   false,
    footerMessage:     '',
  },
  blocks: cloneBlocks([
    { id:'employer', visible:true  },
    { id:'message',  visible:false },
  ]),
};

// ─── 2. CORPORATE — Bandeau bleu marine, sections colorées ───────────────────

export const TEMPLATE_CORPORATE: BulletinTemplateConfig = {
  templateId: 'corporate',
  name: 'Corporate professionnel',
  style: {
    primaryColor:      '#1e3a5f',
    secondaryColor:    '#3b82f6',
    textColor:         '#1e293b',
    fontFamily:        'sans',
    fontSize:          'md',
    density:           'normal',
    layout:            '1col',
    borderRadius:      0,
    headerStyle:       'dark',
    showLogo:          true,
    logoPosition:      'left',
    showAddress:       true,
    showFiscalNumbers: true,
    showPageNumber:    false,
    showGeneratedDate: false,
    showHrSignature:   false,
    footerMessage:     '',
  },
  blocks: cloneBlocks([
    { id:'employer', visible:true  },
    { id:'message',  visible:false },
  ]),
};

// ─── 3. ADMIN — Sections numérotées, marine/doré ─────────────────────────────

export const TEMPLATE_ADMIN: BulletinTemplateConfig = {
  templateId: 'admin',
  name: 'Administration numérotée',
  style: {
    primaryColor:      '#0f2544',
    secondaryColor:    '#b8860b',
    textColor:         '#000000',
    fontFamily:        'sans',
    fontSize:          'sm',
    density:           'compact',
    layout:            '1col',
    borderRadius:      0,
    headerStyle:       'dark',
    showLogo:          true,
    logoPosition:      'left',
    showAddress:       true,
    showFiscalNumbers: true,
    showPageNumber:    false,
    showGeneratedDate: false,
    showHrSignature:   false,
    footerMessage:     '',
  },
  blocks: cloneBlocks([
    { id:'employer', visible:true  },
    { id:'message',  visible:false },
  ]),
};

// ─── Registre ─────────────────────────────────────────────────────────────────

export const TEMPLATES: Record<string, BulletinTemplateConfig> = {
  default:   TEMPLATE_DEFAULT,
  corporate: TEMPLATE_CORPORATE,
  admin:     TEMPLATE_ADMIN,
};

export const TEMPLATE_LIST = [
  TEMPLATE_DEFAULT,
  TEMPLATE_CORPORATE,
  TEMPLATE_ADMIN,
];

export function getBaseTemplate(templateId: string): BulletinTemplateConfig {
  const base = TEMPLATES[templateId] ?? TEMPLATE_DEFAULT;
  return JSON.parse(JSON.stringify(base));
}