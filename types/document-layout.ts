export type DocType = 'PAYSLIP' | 'LEAVE' | 'ABSENCE' | 'EXIT_PERMISSION' | 'LOAN' | 'ADVANCE'
  | 'CONTRACTOR_INVOICE' | 'LEAVE_AUTHORIZATION' | 'TRAINING_CERTIFICATE';

export type FontId = 'carlito' | 'caladea' | 'liberation-sans';
export type BlockType = 'header' | 'title' | 'meta' | 'fieldGroup' | 'table' | 'cumuls'
  | 'checklist' | 'textLines' | 'declaration' | 'dateSignature' | 'decision' | 'reviewTable'
  | 'leaveBalance' | 'signatures' | 'image' | 'freeText' | 'divider' | 'spacer' | 'note';

export interface Block {
  id: string;
  type: BlockType;
  row: number;
  col: number;
  span: number;
  visible: boolean;
  locked?: boolean;
  heightMm?: number | 'auto' | 'fill';
  colors?: DocumentColors;
  sectionColors?: Record<string, Pick<DocumentColors, 'ink' | 'background'>>;
  separator?: DocumentSeparator;
  sectionSeparators?: Record<string, DocumentSeparator>;
  config: Record<string, unknown>;
}

export type DocumentColors = {
  ink?: string; muted?: string; main?: string; line?: string; accent?: string;
  headFill?: string; headText?: string; soft?: string; thin?: string;
  netHeadFill?: string; netHeadText?: string; netCellFill?: string; netCellText?: string;
  background?: string; companyText?: string; fieldLabel?: string; fieldValue?: string;
  totalsText?: string;
};
export type DocumentSeparator = { style: 'solid' | 'dashed' | 'thick'; color?: string; word?: string };

export interface TableConfig {
  columns: {
    key: string;
    widthPct: number;
    align: 'left' | 'center' | 'right';
    visible: boolean;
    label?: string;
    group?: string;
    strong?: boolean;
  }[];
  groups?: Record<string, string>;
  rows: { order: string[]; hidden: string[]; autoAppendUnknown: true };
  fill: 'content' | 'page';
  totalsStyle: 'fill' | 'rules';
}

export interface CumulsConfig {
  columns: { key: string; label: string; widthPct: number }[];
  highlight: { column: string; valueKey: string };
  separator?: DocumentSeparator;
}

export interface DocumentShape {
  id: string;
  anchor: string;
  x: number;
  y: number;
  width: number;
  thickness: number;
  color: string;
  style: 'solid' | 'dashed';
}

export interface DocLayout {
  shapes?: DocumentShape[];
  schemaVersion: 2;
  docType: DocType;
  basePreset: string | null;
  useOriginal?: true;
  independent?: true;
  page: {
    size: 'A4';
    orientation: 'portrait' | 'landscape';
    marginsMm: { top: number; right: number; bottom: number; left: number };
  };
  tokens: {
    fonts: { title: FontId; body: FontId };
    sizeBasePt: number;
    colors: DocumentColors & { ink: string; muted: string; main: string; line: string };
    lineWidthPt: number;
  };
  variants: {
    header: string; title: string; section: string; field: string;
    table: string; signature: string; footer: string;
  };
  logo?: { assetUrl: string; align: 'left' | 'center' | 'right'; widthMm: number; hideNameWhenLogo: boolean };
  blocks: Block[];
  labels: Record<string, string>;
  footer: { text?: string; showPageNumber: boolean; colors?: Pick<DocumentColors, 'ink' | 'background'>; separator?: DocumentSeparator };
}

export type DocumentValue = string | number | null | undefined;

export interface DocumentRow {
  key: string;
  id: string;
  cells: Record<string, DocumentValue>;
  total?: boolean;
  required?: boolean;
}

export interface DocumentContext {
  values: Record<string, DocumentValue>;
  items: DocumentRow[];
  company: { name: string; logo?: string };
  administrative?: {
    motifs?: { key: string; label: string; days?: number | null; checked: boolean }[];
    approvals?: { code: string; label: string; name: string; decision: string; image?: string; date?: string }[];
    footer?: string;
    stamp?: string;
  };
}
