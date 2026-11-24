'use client';

import { Fragment, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import type { Block, CumulsConfig, DocLayout, DocumentContext, DocumentRow, TableConfig } from '@/types/document-layout';
import styles from './document.module.css';

type Props = {
  docType: DocLayout['docType'];
  layout: DocLayout;
  data: DocumentContext;
  mode?: 'screen' | 'print';
  editing?: boolean;
};

const fontFamilies = {
  carlito: '"Document Carlito", Calibri, Arial, sans-serif',
  caladea: '"Document Caladea", Cambria, Georgia, serif',
  'liberation-sans': '"Document Liberation Sans", Arial, sans-serif',
};

const groups = (config: Block['config']) => config.groups as string[][] ?? [];

function orderedRows(items: DocumentRow[], config: TableConfig) {
  const ranks = new Map(config.rows.order.map((key, index) => [key, index]));
  return items.filter(row => row.required || !config.rows.hidden.includes(row.key))
    .sort((a, b) => (ranks.get(a.key) ?? Infinity) - (ranks.get(b.key) ?? Infinity));
}

function PayrollTable({ config, items, label, fill, editing }: {
  config: TableConfig; items: DocumentRow[]; label: (key: string, fallback: string) => string; fill: boolean; editing: boolean;
}) {
  const columns = config.columns.filter(column => column.visible && column.widthPct > 0);
  const sum = columns.reduce((width, column) => width + column.widthPct, 0);
  const runs: { group?: string; start: number; length: number }[] = [];
  columns.forEach(({ group }, index) => {
    const previous = runs.at(-1);
    if (group && previous?.group === group) previous.length++;
    else runs.push({ group, start: index, length: 1 });
  });
  const hasGroups = runs.some(({ group }) => group);
  const columnLabel = (column: TableConfig['columns'][number]) => label(`column.${column.key}`, column.label ?? column.key);
  const needsDivider = (index: number) => index > 0
    && columns[index].group !== columns[index - 1].group;
  return (
    <table className={styles.payTable} data-table="" data-totals={config.totalsStyle}>
      <colgroup>{columns.map(column => <col key={column.key} style={{ width: `${column.widthPct / sum * 100}%` }} />)}</colgroup>
      <thead>
        <tr>{runs.map(({ group, start, length }) => !group
          ? <th key={start} scope="col" rowSpan={hasGroups ? 2 : 1} data-label-key={`column.${columns[start].key}`} data-column-key={columns[start].key}>{columnLabel(columns[start])}</th>
          : <th key={start} scope="colgroup" colSpan={length} data-divider={needsDivider(start)}>{label(`table.${group}`, config.groups?.[group] ?? group)}</th>)}</tr>
        {hasGroups && <tr>{columns.map((column, index) => column.group
          ? <th key={column.key} scope="col" data-label-key={`column.${column.key}`} data-column-key={column.key} data-divider={needsDivider(index)}>{columnLabel(column)}</th> : null)}</tr>}
      </thead>
      <tbody>
        {items.map(row => (
          <tr key={row.id} data-item="" data-total={row.total || undefined}
            data-payroll-row={editing ? row.key : undefined} draggable={editing || undefined}>
            {columns.map(({ key, align, strong }, index) => (
              <td key={key} data-label-key={key === 'label' ? row.key : undefined} data-divider={needsDivider(index)} style={{ textAlign: align }} data-amount={strong}>
                {key === 'label' ? label(row.key, String(row.cells[key] ?? '')) : row.cells[key]}
              </td>
            ))}
          </tr>
        ))}
        {fill && <tr className={styles.filler} aria-hidden="true">{columns.map(({ key }, index) => <td key={key} data-divider={needsDivider(index)} />)}</tr>}
      </tbody>
    </table>
  );
}

function Cumuls({ config, values, label }: {
  config: CumulsConfig; values: DocumentContext['values']; label: (key: string, fallback: string) => string;
}) {
  const { columns, highlight } = config;
  return (
    <table className={styles.cumuls}>
      <colgroup>{columns.map(({ key, widthPct }) => <col key={key} style={{ width: `${widthPct}%` }} />)}</colgroup>
      <thead><tr>{columns.map(column => (
        <th key={column.key} scope="col" data-label-key={column.key === highlight.column ? highlight.valueKey : `cumuls.${column.key}`} data-net={column.key === highlight.column}>
          {label(column.key === highlight.column ? highlight.valueKey : `cumuls.${column.key}`, column.label)}
        </th>
      ))}</tr></thead>
      <tbody>{(['monthly', 'annual'] as const).map((period, index) => (
        <tr key={period}>
          <th scope="row">{label(`cumuls.${period}`, index === 0 ? 'Mensuel' : 'Annuel')}</th>
          {columns.slice(1).map(({ key }) => key === highlight.column
            ? index === 0 && <td key={key} className={styles.net} rowSpan={2}>{values[highlight.valueKey]}</td>
            : <td key={key}>{values[`${period}.${key}`]}</td>)}
        </tr>
      ))}</tbody>
    </table>
  );
}

export default function DocumentRenderer({ docType, layout, data, mode = 'screen', editing = false }: Props) {
  const measure = useRef<HTMLDivElement>(null);
  const [pagination, setPagination] = useState<{ ends: number[]; compact: boolean } | null>(null);
  const blocks = layout.blocks.filter(block => block.visible || block.locked)
    .sort((a, b) => a.row - b.row || a.col - b.col);
  const table = blocks.find(block => block.type === 'table');
  const tableConfig = table?.config as unknown as TableConfig | undefined;
  const items = tableConfig ? orderedRows(data.items, tableConfig) : [];
  const pageOrientation = layout.page.orientation;
  const { colors, fonts, sizeBasePt, lineWidthPt } = layout.tokens;
  const { top, right, bottom, left } = layout.page.marginsMm;
  const label = (key: string, fallback: string) => {
    const override = layout.labels[key];
    return typeof override === 'string' && override.trim() ? override.slice(0, 80) : fallback;
  };
  const style = {
    '--doc-ink': colors.ink, '--doc-muted': colors.muted, '--doc-main': colors.main,
    '--doc-line': colors.line, '--doc-thin': colors.thin ?? colors.line,
    '--doc-head': colors.headFill ?? '#fff', '--doc-head-text': colors.headText ?? colors.ink,
    '--doc-soft': colors.soft ?? '#fff', '--doc-net-head': colors.netHeadFill ?? colors.main,
    '--doc-net-fill': colors.netCellFill ?? '#fff', '--doc-net-text': colors.netCellText ?? colors.main,
    '--doc-font': fontFamilies[fonts.body], '--doc-title-font': fontFamilies[fonts.title],
    '--doc-size': `${Math.min(11, Math.max(8, sizeBasePt))}pt`, '--doc-rule': `${lineWidthPt}pt`,
    '--doc-width': pageOrientation === 'landscape' ? '297mm' : '210mm',
    '--doc-height': pageOrientation === 'landscape' ? '210mm' : '297mm',
    '--doc-padding': `${top}mm ${right}mm ${bottom}mm ${left}mm`,
  } as CSSProperties;

  useLayoutEffect(() => {
    const root = measure.current;
    if (!root) return;
    const read = (compact: boolean) => {
      root.dataset.compact = String(compact);
      const sheet = root.firstElementChild as HTMLElement;
      const flow = sheet.firstElementChild as HTMLElement;
      const padding = getComputedStyle(sheet);
      const available = sheet.clientHeight - parseFloat(padding.paddingTop) - parseFloat(padding.paddingBottom);
      const scale = sheet.getBoundingClientRect().height / sheet.offsetHeight || 1;
      const rows = Array.from(flow.querySelectorAll('[data-item]'), row => row.getBoundingClientRect().height / scale);
      return { rows, room: available - (flow.getBoundingClientRect().height / scale - rows.reduce((a, b) => a + b, 0)) - 2 };
    };
    function paginate() {
      const normal = read(false);
      const compact = normal.rows.reduce((sum, height) => sum + height, 0) > normal.room;
      const { rows, room } = compact ? read(true) : normal;
      const ends: number[] = [];
      let used = 0;
      rows.forEach((height, index) => {
        if (used > 0 && used + height > room) {
          ends.push(index);
          used = 0;
        }
        used += height;
      });
      ends.push(rows.length);
      setPagination(current => current?.compact === compact && current.ends.join() === ends.join() ? current : { ends, compact });
    }
    paginate();
    document.fonts?.addEventListener('loadingdone', paginate);
    return () => document.fonts?.removeEventListener('loadingdone', paginate);
  }, [layout, data, editing]);

  if (docType !== layout.docType) return null;
  const logo = layout.logo ?? (data.company.logo ? {
    assetUrl: data.company.logo, widthMm: 22, align: 'left', hideNameWhenLogo: false,
  } : undefined);
  const footer = layout.footer.text;
  function renderBlock(block: Block, rows: DocumentRow[], measuring: boolean) {
    const fieldLabels = block.config.labels as Record<string, string> | undefined;
    const hidden = block.config.hidden as string[] | undefined;
    switch (block.type) {
      case 'header':
        return <header className={styles.header}>
          <div className={styles.company}>
            {logo?.assetUrl && <img className={styles.logo} src={logo.assetUrl} alt="" decoding="async"
              style={{ width: `${logo.widthMm}mm`, justifySelf: logo.align }} />}
            {(!logo?.assetUrl || !logo.hideNameWhenLogo) && data.company.name}
          </div>
          <h1 data-label-key="document.title">{label('document.title', String(block.config.title ?? ''))}</h1>
        </header>;
      case 'meta':
      case 'fieldGroup':
        return <div className={block.type === 'meta' ? styles.meta : styles.identity}>
          {groups(block.config).map((group, index) => <dl key={index}>
            {group.filter(key => !hidden?.includes(key) && (data.values[key] != null || block.type === 'fieldGroup')).map(key => (
              <div key={key}><dt data-label-key={key}>{label(key, fieldLabels?.[key] ?? key)}</dt><dd>{data.values[key]}</dd></div>
            ))}
          </dl>)}
        </div>;
      case 'table':
        return tableConfig && <PayrollTable items={rows} label={label} config={tableConfig} editing={editing && !measuring}
          fill={!measuring && (tableConfig.fill === 'page' || block.heightMm === 'fill' || typeof block.heightMm === 'number')} />;
      case 'cumuls': return <Cumuls config={block.config as unknown as CumulsConfig} values={data.values} label={label} />;
      case 'signatures':
        return <div className={styles.signatures}>{(block.config.captions as string[]).map((caption, index) => (
          <div key={index}><span data-label-key={`signature.${index}`}>{label(`signature.${index}`, caption)}</span><div /></div>
        ))}</div>;
      case 'title': return <h2>{label('document.title', String(block.config.title ?? ''))}</h2>;
      case 'freeText':
      case 'note': return <p>{String(block.config.text ?? '')}</p>;
      case 'divider': return <hr />;
      default: return null;
    }
  }

  function page(start: number, end: number, number: number, last: boolean, measuring = false) {
    const visible = blocks.filter(block => last || (block.type !== 'cumuls' && block.type !== 'signatures'));
    const rows = Array.from(new Set(visible.map(block => block.row)));
    return <article className={styles.sheet} key={number} data-document-page="">
      <div className={styles.flow} data-document-flow={editing && !measuring ? '' : undefined}>
        {rows.map(row => {
          const blocksInRow = visible.filter(block => block.row === row);
          const fill = !measuring && blocksInRow.some(block => block.heightMm === 'fill'
            || (block.type === 'table' && tableConfig?.fill === 'page'));
          return <div className={styles.gridRow} key={row} data-fill={fill}>
            {blocksInRow.map(block => <div key={block.id} className={styles.block}
              data-document-block={editing && !measuring ? block.id : undefined}
              data-fixed-table={!measuring && block.type === 'table' && typeof block.heightMm === 'number' ? '' : undefined}
              style={{ gridColumn: `${block.col} / span ${block.span}`, minHeight: typeof block.heightMm === 'number' ? `${block.heightMm}mm` : undefined }}>
              {renderBlock(block, items.slice(start, end), measuring)}
            </div>)}
          </div>;
        })}
        {(last && footer || layout.footer.showPageNumber) && <footer className={styles.footer}>
          {last && footer}{layout.footer.showPageNumber && <Fragment> {number} / {pagination?.ends.length ?? 1}</Fragment>}
        </footer>}
      </div>
    </article>;
  }

  const ends = pagination?.ends ?? [items.length];
  return <div className={styles.root} data-table-variant={layout.variants.table} data-frame={layout.variants.section}
    data-orientation={pageOrientation} data-mode={mode} data-compact={pagination?.compact}
    data-document-engine="" data-bulletin-root="true" style={style}>
    <div ref={measure} className={styles.measure} aria-hidden="true">{page(0, items.length, 0, true, true)}</div>
    {ends.map((end, index) => page(ends[index - 1] ?? 0, end, index + 1, index === ends.length - 1))}
  </div>;
}
