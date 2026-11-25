import { getBaseTemplate } from '@/lib/bulletin-templates';
import { copyLegacyTemplate } from './editor-state';
import { createBlankPayslipLayout, createPayslipLayout, payslipPresets } from './registry';
import type { DocLayout } from '@/types/document-layout';

const historic = [
  { id: 'LEGACY_DEFAULT', source: 'default', name: 'Classique administratif' },
  { id: 'LEGACY_CLARIFIE', source: 'clarifie', name: 'Clarifié' },
  { id: 'LEGACY_CLASSIQUE', source: 'classique', name: 'Classique numéroté' },
  { id: 'LEGACY_INF', source: 'inf', name: 'Numéroté INF' },
] as const;

export const referenceDesigns = [...payslipPresets, { id: 'REFERENCE', name: 'Original de référence' }] as const;
export const historicDesigns = historic;
export const payslipDesigns = [...referenceDesigns, ...historic];

export function historicDesign(preset?: string | null) {
  return historic.find(design => design.id === preset);
}

export function makePayslipDesign(preset?: string | null, asOriginal = false): DocLayout {
  if (preset === 'BLANK') return createBlankPayslipLayout();
  const legacy = historicDesign(preset);
  if (legacy) {
    const config = getBaseTemplate(legacy.source);
    const { layout } = copyLegacyTemplate(config);
    layout.basePreset = legacy.id;
    layout.variants.header = legacy.source === 'default' || legacy.source === 'classique' ? 'centered' : 'stacked';
    layout.tokens.colors.headFill = config.style.primaryColor;
    layout.tokens.colors.headText = '#ffffff';
    layout.tokens.colors.soft = '#f2f3f5';
    if (asOriginal) layout.useOriginal = true;
    return layout;
  }
  const skin = payslipPresets.find(entry => entry.id === preset);
  const layout = createPayslipLayout(skin?.id);
  if (preset === 'REFERENCE') {
    layout.basePreset = preset;
    layout.page.marginsMm = { top: 7, right: 7, bottom: 5, left: 7 };
    layout.tokens.fonts = { title: 'liberation-sans', body: 'liberation-sans' };
    layout.tokens.lineWidthPt = 0.5;
    layout.tokens.colors = { ...layout.tokens.colors, ink: '#000000', main: '#000000',
      muted: '#000000', line: '#000000', thin: '#000000', headFill: '#a6c9e6',
      headText: '#000000', soft: '#ffffff', netHeadFill: '#a6c9e6', netHeadText: '#000000',
      netCellFill: '#ffffff', netCellText: '#000000' };
  }
  return layout;
}
