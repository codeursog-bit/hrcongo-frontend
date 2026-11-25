import type { Block, BlockType, DocLayout, DocumentRow, TableConfig } from '@/types/document-layout';
import { createPayslipLayout, type PayslipPreset } from './registry';
import type { BulletinTemplateConfig } from '@/types/bulletin-template';
import type { CanvasLayout } from '@/types/canvas-block';

export type EditorDraft = { name: string; layout: DocLayout };
export type History = { current: EditorDraft; past: EditorDraft[]; future: EditorDraft[] };
export const initialHistory = (current: EditorDraft): History => ({ current, past: [], future: [] });
export type EditorCommand =
  | { type: 'initialize' | 'replace'; draft: EditorDraft }
  | { type: 'name'; name: string }
  | { type: 'label'; key: string; text: string }
  | { type: 'layout'; patch: Partial<DocLayout> }
  | { type: 'block'; id: string; patch: Partial<Block> }
  | { type: 'add'; block: Block }
  | { type: 'remove'; id: string }
  | { type: 'move'; id: string; target: string; side: 'before' | 'after' | 'left' | 'right' }
  | { type: 'table'; patch: Partial<TableConfig> }
  | { type: 'undo' | 'redo' };

export const blockNames: Partial<Record<BlockType, string>> = {
  header: 'En-tête', meta: 'Période et paiement', fieldGroup: 'Identité du salarié',
  table: 'Tableau de paie', cumuls: 'Cumuls et net à payer', signatures: 'Signatures',
  leaveBalance: 'Congés (jours)', freeText: 'Texte libre', divider: 'Séparateur', spacer: 'Espace',
};

const byPosition = (a: Block, b: Block) => a.row - b.row || a.col - b.col;
export const orderedBlocks = (blocks: Block[]) => [...blocks].sort(byPosition);
export const tableSettings = (block: Block) => block.config as unknown as TableConfig;

function move(blocks: Block[], id: string, targetId: string, side: 'before' | 'after' | 'left' | 'right') {
  const dragged = blocks.find(block => block.id === id);
  const target = blocks.find(block => block.id === targetId);
  if (!dragged || !target || dragged === target) return blocks;
  const rows = [...new Set(orderedBlocks(blocks).map(block => block.row))]
    .map(row => orderedBlocks(blocks.filter(block => block.row === row && block.id !== id)));
  const targetIndex = rows.findIndex(row => row.some(block => block.id === target.id));
  if (side === 'before' || side === 'after') {
    rows.splice(targetIndex + Number(side === 'after'), 0, [{ ...dragged, col: 1 }]);
  } else {
    const row = rows[targetIndex];
    if (row.length >= 12) return blocks;
    const index = row.findIndex(block => block.id === targetId);
    row.splice(index + Number(side === 'right'), 0, dragged);
    let col = 1;
    rows[targetIndex] = row.map((block, offset) => {
      const next = { ...block, col, span: Math.floor(12 / row.length) + Number(offset < 12 % row.length) };
      col += next.span;
      return next;
    });
  }
  return rows.filter(row => row.length).flatMap((row, index) => row.map(block => ({ ...block, row: index + 1 })));
}

function apply(current: EditorDraft, command: Exclude<EditorCommand, { type: 'undo' | 'redo' }>): EditorDraft {
  const { layout } = current;
  switch (command.type) {
    case 'initialize':
    case 'replace': return command.draft;
    case 'name': return { ...current, name: command.name };
    case 'label': {
      const labels = { ...layout.labels };
      if (command.text.trim()) labels[command.key] = command.text.slice(0, 80);
      else delete labels[command.key];
      return { ...current, layout: { ...layout, labels } };
    }
    case 'layout': return { ...current, layout: { ...layout, ...command.patch } };
    case 'block': return { ...current, layout: { ...layout, blocks: layout.blocks.map(block => {
      if (block.id !== command.id) return block;
      const next = { ...block, ...command.patch };
      if (block.locked) next.visible = true;
      return next;
    }) } };
    case 'add': {
      if (layout.blocks.length >= 60) return current;
      const positions = [...new Set(orderedBlocks(layout.blocks).map(block => block.row))];
      const blocks = layout.blocks.map(block => ({ ...block, row: positions.indexOf(block.row) + 1 }));
      return { ...current, layout: { ...layout, blocks: [...blocks, { ...command.block, row: positions.length + 1 }] } };
    }
    case 'remove': return { ...current, layout: { ...layout, shapes: layout.shapes?.filter(shape => shape.anchor !== command.id || layout.blocks.some(block => block.id === command.id && block.locked)), blocks: layout.blocks.filter(block => block.id !== command.id || block.locked) } };
    case 'move': return { ...current, layout: { ...layout, blocks: move(layout.blocks, command.id, command.target, command.side) } };
    case 'table': return { ...current, layout: { ...layout, blocks: layout.blocks.map(block => block.type === 'table'
      ? { ...block, config: { ...block.config, ...command.patch } } : block) } };
  }
}

export function documentHistory(state: History, command: EditorCommand): History {
  if (command.type === 'initialize') return initialHistory(command.draft);
  if (command.type === 'undo') {
    const previous = state.past.at(-1);
    return previous ? { current: previous, past: state.past.slice(0, -1), future: [state.current, ...state.future] } : state;
  }
  if (command.type === 'redo') {
    const next = state.future[0];
    return next ? { current: next, past: [...state.past, state.current], future: state.future.slice(1) } : state;
  }
  const current = apply(state.current, command as Exclude<EditorCommand, { type: 'undo' | 'redo' }>);
  return JSON.stringify(current) === JSON.stringify(state.current) ? state
    : { current, past: [...state.past.slice(-59), state.current], future: [] };
}

export function resizeColumn(columns: TableConfig['columns'], key: string, requested: number, visible?: boolean) {
  const changed = columns.map(column => column.key === key && visible !== undefined ? { ...column, visible } : column);
  const target = changed.find(column => column.key === key && column.visible);
  const other = changed.filter(column => column.visible && column !== target);
  const sum = other.reduce((total, column) => total + column.widthPct, 0);
  const targetWidth = target ? Math.max(2, Math.min(requested, 100 - other.length * 2)) : 0;
  return changed.map(column => !column.visible ? column : {
    ...column,
    widthPct: column === target ? targetWidth : 2 + (100 - targetWidth - other.length * 2) * column.widthPct / sum,
  });
}

export function orderedPayrollRows(data: DocumentRow[], order: string[]) {
  const ranks = new Map(order.map((key, index) => [key, index]));
  return [...new Map(data.map(item => [item.key, item])).values()]
    .sort((a, b) => (ranks.get(a.key) ?? Infinity) - (ranks.get(b.key) ?? Infinity));
}

export function movePayrollRow(config: TableConfig, data: DocumentRow[], source: string, target: string, after: boolean): EditorCommand | undefined {
  if (!source || source === target) return;
  const keys = orderedPayrollRows(data, config.rows.order).map(item => item.key);
  if (!keys.includes(source) || !keys.includes(target)) return;
  const order = keys.filter(key => source !== key);
  order.splice(order.indexOf(target) + Number(after), 0, source);
  const carried = config.rows.order.filter(key => !order.includes(key));
  return { type: 'table', patch: { rows: { ...config.rows, order: [...order, ...carried] } } };
}

const presetByTemplate: Record<string, PayslipPreset> = {
  default: 'A_BLEU', clarifie: 'B_VERT', classique: 'C_ARDOISE', inf: 'D_BORDEAUX',
};
const hex = (value?: string) => value && /^#[0-9a-f]{6}$/i.test(value) ? value : undefined;

export function copyLegacyTemplate(config?: Partial<BulletinTemplateConfig> & { canvasLayout?: CanvasLayout }, companyLogo?: string): EditorDraft {
  const layout = createPayslipLayout(presetByTemplate[config?.templateId ?? ''] ?? 'A_BLEU');
  const style = config?.style;
  if (style) {
    const { colors, fonts } = layout.tokens;
    layout.tokens = { ...layout.tokens, colors: {
      ...colors, main: hex(style.primaryColor) ?? colors.main, accent: hex(style.secondaryColor),
      ink: hex(style.textColor) ?? colors.ink,
    }, fonts: style.fontFamily === 'serif' ? { ...fonts, title: 'caladea' } : fonts,
    sizeBasePt: style.fontSize === 'lg' ? 10 : style.fontSize === 'md' ? 9 : 8 };
    layout.footer = {
      text: style.footerMessage && !/[<>]/.test(style.footerMessage) ? style.footerMessage.slice(0, 500) : layout.footer.text,
      showPageNumber: !!style.showPageNumber,
    };
    if (style.showLogo === false) layout.logo = { assetUrl: '', widthMm: 22, align: 'left', hideNameWhenLogo: false };
    else if (companyLogo && ['left', 'center', 'right'].includes(style.logoPosition)) {
      layout.logo = { assetUrl: companyLogo, widthMm: 22, align: style.logoPosition, hideNameWhenLogo: false };
    }
    if (style.showHrSignature === false) layout.blocks = layout.blocks.map(block =>
      block.type === 'signatures' ? { ...block, visible: false } : block);
  }
  const oldCanvas = config?.canvasLayout;
  if (oldCanvas) {
    const { colors, fonts } = layout.tokens;
    layout.tokens = { ...layout.tokens, colors: { ...colors,
      main: hex(oldCanvas.primaryColor) ?? colors.main, accent: hex(oldCanvas.secondaryColor),
    }, fonts: oldCanvas.fontFamily === 'serif' ? { ...fonts, title: 'caladea' } : fonts };
    const fields = new Set(layout.blocks.flatMap(block => Array.isArray(block.config.groups) ? (block.config.groups as string[][]).flat() : []));
    fields.add('pay.netSalary');
    for (const block of oldCanvas.blocks ?? []) {
      if (block.variable && fields.has(block.variable) && block.label && !/[<>]/.test(block.label)) {
        layout.labels[block.variable] = block.label.slice(0, 80);
      }
    }
  }
  return { name: 'Copie de mon modèle', layout };
}

export function colorContrast(first: string, second: string) {
  function luminance(hexColor: string) {
    const r = [1, 3, 5].map(i => parseInt(hexColor.slice(i, i + 2), 16) / 255)
      .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return r[0] * 0.2126 + r[1] * 0.7152 + r[2] * 0.0722;
  }
  const a = luminance(first);
  const b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
