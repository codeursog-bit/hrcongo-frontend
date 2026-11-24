import type { Block, DocLayout, DocType, FontId, TableConfig } from '@/types/document-layout';
import skins from '@/docs/modeles-documents/skins.json';
import references from '@/docs/modeles-documents/reference-documents.json';
import { buildPayslipContext, cumulativeColumns, payColumns, payslipSpec, type PayslipData } from './payslip';

const { page, skins: payslipSkins } = skins.bulletinDePaie;
const { PAYSLIP: reference } = references;
export const documentRegistry = {
  PAYSLIP: { ...payslipSpec, buildContext: buildPayslipContext, defaultPreset: 'A_BLEU' as const },
} satisfies Partial<Record<DocType, unknown>>;
export type SupportedDocType = keyof typeof documentRegistry;

export function buildContext(docType: SupportedDocType, apiData: PayslipData) {
  return documentRegistry[docType].buildContext(apiData);
}

export type PayslipPreset = keyof typeof payslipSkins;
export const payslipPresets = Object.entries(payslipSkins).map(([key, skin]) => ({
  id: key as PayslipPreset, name: skin.nom,
}));

const fonts: Record<string, FontId> = { Calibri: 'carlito', Cambria: 'caladea', Arial: 'liberation-sans' };

export function createPayslipLayout(
  preset: PayslipPreset = documentRegistry.PAYSLIP.defaultPreset,
  fill: TableConfig['fill'] = 'page',
): DocLayout {
  const skin = payslipSkins[preset];
  const color = skin.colors;
  const table: TableConfig = {
    columns: payColumns.map(([key, label, width, align], index) => ({
      key, label, widthPct: width / skins.bulletinDePaie.colonnesTableauPaie_unites.total * 100, align, visible: true,
      group: index < 4 ? undefined : index < 7 ? 'employee' : 'employer',
      strong: key === 'gain' || key === 'deduction' || key === 'employerCost',
    })),
    groups: { employee: 'Part salariale', employer: 'Part patronale' },
    rows: { order: [], hidden: [], autoAppendUnknown: true },
    fill,
    totalsStyle: 'fill',
  };
  const block = (type: Block['type'], row: number, config: Block['config'], locked = false): Block =>
    ({ id: type, type, row, col: 1, span: 12, visible: true, locked, config });
  const labels = Object.fromEntries(payslipSpec.fields.map(({ key, labelDefaut }) => [key, labelDefaut]));
  return {
    schemaVersion: 2,
    docType: 'PAYSLIP',
    basePreset: preset,
    page: {
      size: 'A4', orientation: 'portrait',
      marginsMm: { top: page.margesMm.haut, right: page.margesMm.droite, bottom: page.margesMm.bas, left: page.margesMm.gauche },
    },
    tokens: {
      fonts: { title: fonts[skin.fonts.titre], body: fonts[skin.fonts.corps] },
      sizeBasePt: 8,
      colors: {
        ink: '#1b1f27', muted: '#434b55', main: `#${color.main}`, line: `#${color.line}`,
        headFill: `#${color.headFill}`, headText: `#${'headText' in color ? color.headText : color.main}`,
        soft: `#${color.totFill}`, thin: `#${color.thin}`, netHeadFill: `#${color.netHeadFill}`,
        netCellFill: `#${color.netCellFill}`, netCellText: `#${color.netCellText}`,
      },
      lineWidthPt: skin.cadreExterieur.includes('0,75') ? 0.75 : 1,
    },
    variants: {
      header: 'title-right-big', title: 'uppercase', section: skin.cadreExterieur.startsWith('double') ? 'double' : 'single',
      field: 'label-value', table: skin.colonnesVerticales.startsWith('seulement') ? 'grouped' : 'grid',
      signature: 'empty-box', footer: 'centered',
    },
    blocks: [
      block('header', 1, { title: reference.titre }, true),
      block('meta', 2, { groups: [['pay.period', 'pay.payment'], ['pay.month', 'pay.year']], labels }),
      block('fieldGroup', 3, { groups: Object.values(reference.infosSalarie).map(group => group.map(([key]) => key)), labels }, true),
      block('table', 4, { ...table }, true),
      block('cumuls', 5, { columns: cumulativeColumns, highlight: { column: 'netSalary', valueKey: 'pay.netSalary' } }, true),
      block('signatures', 6, { captions: reference.signatures }),
    ],
    labels: {},
    footer: { text: reference.piedDePage, showPageNumber: false },
  };
}
