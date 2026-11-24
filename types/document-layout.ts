export type DocType = 'PAYSLIP' | 'LEAVE' | 'ABSENCE' | 'EXIT_PERMISSION' | 'LOAN' | 'ADVANCE'
  | 'CONTRACTOR_INVOICE' | 'LEAVE_AUTHORIZATION' | 'TRAINING_CERTIFICATE';

export type FontId = 'carlito' | 'caladea' | 'liberation-sans';
export type BlockType = 'header' | 'title' | 'meta' | 'fieldGroup' | 'table' | 'cumuls'
  | 'checklist' | 'textLines' | 'declaration' | 'dateSignature' | 'decision' | 'reviewTable'
  | 'signatures' | 'image' | 'freeText' | 'divider' | 'spacer' | 'note';

export interface Block {
  id: string;
  type: BlockType;
  row: number;
  col: number;
  span: number;
  visible: boolean;
  locked?: boolean;
  heightMm?: number | 'auto' | 'fill';
  config: Record<string, unknown>;
}

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
}

export interface DocLayout {
  schemaVersion: 2;
  docType: DocType;
  basePreset: string | null;
  page: {
    size: 'A4';
    orientation: 'portrait' | 'landscape';
    marginsMm: { top: number; right: number; bottom: number; left: number };
  };
  tokens: {
    fonts: { title: FontId; body: FontId };
    sizeBasePt: number;
    colors: {
      ink: string; muted: string; main: string; line: string; accent?: string;
      headFill?: string; headText?: string; soft?: string;
      thin?: string; netHeadFill?: string; netCellFill?: string; netCellText?: string;
    };
    lineWidthPt: number;
  };
  variants: {
    header: string; title: string; section: string; field: string;
    table: string; signature: string; footer: string;
  };
  logo?: { assetUrl: string; align: 'left' | 'center' | 'right'; widthMm: number; hideNameWhenLogo: boolean };
  blocks: Block[];
  labels: Record<string, string>;
  footer: { text?: string; showPageNumber: boolean };
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
}
