import type { DocumentColors, DocumentSeparator } from '@/types/document-layout';

export function drawSeparator(separator?: DocumentSeparator) {
  if (!separator) return undefined;
  return `${separator.style === 'thick' ? '2pt' : '.75pt'} ${separator.style === 'dashed' ? 'dashed' : 'solid'} ${separator.color ?? 'var(--doc-line, currentColor)'}`;
}

export function below(separator?: DocumentSeparator) {
  return separator && !separator.word ? { borderBottom: drawSeparator(separator) } : undefined;
}

export const paint = (colors?: Pick<DocumentColors, 'ink' | 'background'>) => ({
  color: colors?.ink, backgroundColor: colors?.background,
});
export const palette = (colors: DocumentColors) => ({
  '--doc-ink': colors.ink, '--doc-muted': colors.muted, '--doc-main': colors.main,
  '--doc-accent': colors.accent ?? colors.main, '--doc-line': colors.line, '--doc-thin': colors.thin ?? colors.line,
  '--doc-head': colors.headFill ?? '#ffffff', '--doc-head-text': colors.headText ?? colors.ink,
  '--doc-soft': colors.soft ?? '#ffffff', '--doc-net-head': colors.netHeadFill ?? colors.main,
  '--doc-net-head-text': colors.netHeadText ?? '#ffffff',
  '--doc-net-fill': colors.netCellFill ?? '#ffffff', '--doc-net-text': colors.netCellText ?? colors.main,
  '--doc-company': colors.companyText ?? colors.main, '--doc-field-label': colors.fieldLabel ?? colors.ink,
  '--doc-field-value': colors.fieldValue ?? colors.ink, '--doc-totals-text': colors.totalsText ?? colors.ink,
});

