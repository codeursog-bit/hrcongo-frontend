'use client';

import { useEffect, useState, type Dispatch } from 'react';
import type { Block, CumulsConfig, DocLayout, DocumentColors, DocumentContext, FontId } from '@/types/document-layout';
import { blockNames, colorContrast, movePayrollRow, orderedPayrollRows, resizeColumn, tableSettings, type EditorCommand } from '@/lib/document-engine/editor-state';
import { logoColors, prepareLogo } from '@/lib/document-engine/editor-logo';
import { newSeparator } from '@/components/DocumentRenderer/Shapes';
import SeparatorControls from './SeparatorControls';
import styles from './editor.module.css';

const fonts: Record<FontId, string> = { carlito: 'Carlito', caladea: 'Caladea', 'liberation-sans': 'Liberation Sans' };
const colors: Partial<Record<keyof DocLayout['tokens']['colors'], string>> = {
  main: 'Titres', companyText: 'Nom de l’entreprise', ink: 'Texte courant', background: 'Fond de page',
  fieldLabel: 'Libellés des champs', fieldValue: 'Valeurs des champs', line: 'Bordures', thin: 'Quadrillage',
  headFill: 'Fond des en-têtes de tableau', headText: 'Texte des en-têtes de tableau', soft: 'Fond des totaux',
  totalsText: 'Texte des totaux', netHeadFill: 'Fond du libellé net à payer', netHeadText: 'Couleur du libellé net à payer',
  netCellFill: 'Fond du montant net à payer', netCellText: 'Couleur du montant net à payer', muted: 'Texte du pied de page',
};
const commonOptions = ['ink', 'background', 'line'] as const;
const blockOptions: Partial<Record<Block['type'], (keyof DocumentColors)[]>> = {
  header: ['main', 'companyText', 'background'], meta: ['fieldLabel', 'fieldValue', 'background'],
  fieldGroup: ['fieldLabel', 'fieldValue', 'background', 'line'],
  table: ['ink', 'background', 'line', 'thin', 'headFill', 'headText', 'soft', 'totalsText'],
  cumuls: ['ink', 'background', 'line', 'thin', 'headFill', 'headText', 'netHeadFill', 'netHeadText', 'netCellFill', 'netCellText'],
};
const margins = { top: 'Haut', right: 'Droite', bottom: 'Bas', left: 'Gauche' } as const;
type EyeDropperConstructor = new () => { open(): Promise<{ sRGBHex: string }> };

type Props = {
  layout: DocLayout; block?: Block; data: DocumentContext; companyLogo?: string; rowMime: string;
  dispatch: Dispatch<EditorCommand>; onError: (value: string) => void; onUnselect: () => void;
  onReset: () => void; onCopy: () => void;
  importing: boolean; onImporting: (busy: boolean) => void;
};

export default function Inspector({ layout, block, data, companyLogo, dispatch, onError, onUnselect, onReset, onCopy, rowMime, importing, onImporting }: Props) {
  const [palette, setPalette] = useState<string[]>([]);
  const [subsection, setSubsection] = useState<{ blockId: string; key: string }>();
  const EyeDropper = typeof window === 'undefined' ? undefined
    : (window as Window & { EyeDropper?: EyeDropperConstructor }).EyeDropper;
  const logo = layout.logo ?? { assetUrl: companyLogo ?? '', widthMm: 22, align: 'left' as const, hideNameWhenLogo: false };
  const tokens = layout.tokens;
  const setLayout = (patch: Partial<DocLayout>) => dispatch({ type: 'layout', patch });
  const setTokens = (patch: Partial<DocLayout['tokens']>) => setLayout({ tokens: { ...tokens, ...patch } });
  const setColor = (key: keyof DocLayout['tokens']['colors'], color: string) =>
    setTokens({ colors: { ...tokens.colors, [key]: color } });
  const setLogo = (patch: Partial<NonNullable<DocLayout['logo']>>) => setLayout({ logo: { ...logo, ...patch } });
  const setBlock = (patch: Partial<Block>) => { if (block) dispatch({ type: 'block', id: block.id, patch }); };

  useEffect(() => {
    let active = true;
    setPalette([]);
    if (logo.assetUrl) logoColors(logo.assetUrl).then(values => { if (active) setPalette(values); }).catch(() => {});
    return () => { active = false; };
  }, [logo.assetUrl]);

  if (block) {
    const maxSpan = (layout.blocks.filter(other => other.row === block.row && other.col > block.col)
      .sort((a, b) => a.col - b.col)[0]?.col ?? 13) - block.col;
    const table = block.type === 'table' ? tableSettings(block) : undefined;
    const fields = Array.isArray(block.config.groups) ? (block.config.groups as string[][]).flat() : [];
    const hidden = (block.config.hidden as string[] | undefined) ?? [];
    const defaultLabels = (block.config.labels as Record<string, string> | undefined) ?? {};
    const items = orderedPayrollRows(data.items, table?.rows.order ?? []);
    const columns = table?.columns ?? (block.type === 'cumuls' ? block.config.columns as CumulsConfig['columns'] : []);
    const signatures = block.type === 'signatures' ? block.config.captions as string[] : [];
    const separator = block.type === 'cumuls' ? (block.config as unknown as CumulsConfig).separator : undefined;
    const targets = [
      ...(block.type === 'header' ? [{ key: 'document.title', label: 'Titre du document' }, { key: 'company.name', label: 'Nom de l’entreprise' }] : []),
      ...(block.type === 'leaveBalance' ? [{ key: 'leave.entitled', label: 'Droits à congé' }, { key: 'leave.taken', label: 'Congés pris' }, { key: 'leave.remaining', label: 'Congés restants' }] : []),
      ...(block.type === 'cumuls' ? [{ key: 'period.monthly', label: 'Ligne · Mensuel' }, { key: 'period.annual', label: 'Ligne · Annuel' }] : []),
      ...(block.type === 'freeText' ? [{ key: 'block.text', label: 'Texte du bloc' }] : []),
      ...fields.map(key => ({ key: `field.${key}`, label: defaultLabels[key] ?? key })),
      ...Object.entries(table?.groups ?? {}).map(([key, label]) => ({ key: `group.${key}`, label })),
      ...columns.map(column => ({ key: `column.${column.key}`, label: `Colonne · ${column.label ?? column.key}` })),
      ...signatures.map((caption, index) => ({ key: `signature.${index}`, label: caption })),
      ...(table ? items.map(row => ({ key: `row.${row.key}`, label: `Ligne · ${row.cells.label ?? row.key}` })) : []),
    ];
    const zone = subsection?.blockId === block.id ? subsection.key : '';

    function moveRow(source: string, target: string, after: boolean) {
      if (!table) return;
      const command = movePayrollRow(table, data.items, source, target, after);
      if (command) dispatch(command);
    }

    return <div className={styles.inspector}>
      <button type="button" onClick={onUnselect}>Réglages de la page</button>
      <h2>{blockNames[block.type]}</h2>
      {block.type !== 'spacer' && <details open>
        <summary>Couleurs du bloc</summary>
        {(blockOptions[block.type] ?? commonOptions).map(key => <ColorPicker key={key} label={colors[key] ?? key}
          value={block.colors?.[key]} fallback={tokens.colors[key] ?? (key === 'background' ? '#ffffff' : tokens.colors.ink)}
          change={value => {
            const next = { ...block.colors };
            if (value) next[key] = value; else delete next[key];
            setBlock({ colors: Object.keys(next).length ? next : undefined });
          }} />)}
        {targets.length > 0 && <label>Zone précise
          <select value={zone} onChange={event => setSubsection({ blockId: block.id, key: event.target.value })}>
            <option value="">Choisir une zone</option>
            {targets.map(target => <option key={target.key} value={target.key}>{target.label}</option>)}
          </select>
        </label>}
        {zone && (['ink', 'background'] as const).map(key => <ColorPicker key={key} label={key === 'ink' ? 'Texte de la zone' : 'Fond de la zone'}
          value={block.sectionColors?.[zone]?.[key]} fallback={key === 'ink' ? block.colors?.ink ?? tokens.colors.ink : block.colors?.background ?? tokens.colors.background ?? '#ffffff'}
          change={value => {
            const next = { ...block.sectionColors };
            const updated = { ...next[zone] };
            if (value) updated[key] = value; else delete updated[key];
            if (Object.keys(updated).length) next[zone] = updated; else delete next[zone];
            setBlock({ sectionColors: Object.keys(next).length ? next : undefined });
          }} />)}
      </details>}
      <details open={block.type === 'divider' || block.type === 'cumuls' || undefined}>
        <summary>Séparateurs</summary>
        {block.type === 'divider' && <button type="button" onClick={() => {
          setLayout({ blocks: layout.blocks.filter(item => item.id !== block.id), shapes: [...(layout.shapes ?? []), newSeparator()] }); onUnselect();
        }}>Transformer en séparateur libre</button>}
        <SeparatorControls title={block.type === 'divider' ? 'Style du filet' : 'Trait sous le bloc'}
          value={block.separator} standalone={block.type === 'divider'} color={block.colors?.line ?? tokens.colors.line}
          onChange={separator => setBlock({ separator })} />
        {block.type === 'cumuls' && <SeparatorControls title="Entre Mensuel et Annuel"
          value={separator} color={block.colors?.line ?? tokens.colors.line} onChange={value => setBlock({ config: { ...block.config, separator: value } })} />}
        {zone && <SeparatorControls title="Trait sous la zone sélectionnée" value={block.sectionSeparators?.[zone]}
          color={block.colors?.line ?? tokens.colors.line} allowWord onChange={value => {
            const next = { ...block.sectionSeparators };
            if (value) next[zone] = value; else delete next[zone];
            setBlock({ sectionSeparators: Object.keys(next).length ? next : undefined });
          }} />}
      </details>
      <label>Largeur sur 12 colonnes
        <input type="range" min={1} max={maxSpan} value={block.span} onChange={event => setBlock({ span: Number(event.target.value) })} />
        <output>{block.span} / 12</output>
      </label>
      {block.locked ? <p>Ce bloc est requis.</p> : <button type="button" onClick={() => {
        dispatch({ type: 'remove', id: block.id }); onUnselect();
      }}>Supprimer le bloc</button>}
      {block.type === 'header' && <LabelField label="Titre du document" original={String(block.config.title ?? '')} field="document.title" layout={layout} dispatch={dispatch} />}
      {block.type === 'freeText' && <label>Texte
        <textarea aria-label="Texte du bloc" maxLength={500} value={String(block.config.text ?? '')} onChange={event => setBlock({ config: { text: event.target.value } })} />
      </label>}
      {block.type === 'spacer' && <label>Hauteur de l’espace (mm)
        <input type="range" min={1} max={50} value={typeof block.heightMm === 'number' ? block.heightMm : 5} onChange={event => setBlock({ heightMm: Number(event.target.value) })} />
      </label>}
      {fields.length > 0 && <details open>
        <summary>Libellés des champs</summary>
        {fields.map(key => <div key={key} className={styles.column}>
          <LabelField field={key} label={defaultLabels[key] ?? key} original={defaultLabels[key] ?? key} layout={layout} dispatch={dispatch} />
          <label className={styles.check}><input type="checkbox" checked={!hidden.includes(key)} disabled={key === 'employee.fullName'}
            onChange={event => setBlock({ config: { ...block.config,
              hidden: event.target.checked ? hidden.filter(field => field !== key) : [...hidden, key],
            } })} /> Afficher {defaultLabels[key] ?? key}</label>
        </div>)}
      </details>}
      {table && <>
        <label className={styles.check}><input type="checkbox" data-tour="table-fill" checked={table.fill === 'page' || block.heightMm === 'fill'} onChange={event => {
          setBlock({ heightMm: 'auto', config: { ...block.config, fill: event.target.checked ? 'page' : 'content' } });
        }} /> Remplir la page</label>
        <label>Hauteur minimale du tableau (mm)
          <input type="number" min={0} max={250} value={typeof block.heightMm === 'number' ? block.heightMm : 0}
            disabled={table.fill === 'page' || block.heightMm === 'fill'} onChange={event => setBlock({ heightMm: Math.max(0, Math.min(250, Number(event.target.value))) })} />
        </label>
        <details open>
          <summary>Colonnes du tableau</summary>
          {table.columns.map(column => <div className={styles.column} key={column.key}>
            <label className={styles.check}><input type="checkbox" checked={column.visible} disabled={['label', 'gain', 'deduction'].includes(column.key)}
              onChange={event => dispatch({ type: 'table', patch: { columns: resizeColumn(table.columns, column.key, column.widthPct, event.target.checked) } })} />
              {column.label ?? column.key}
            </label>
            {column.visible && <label>Largeur {column.label ?? column.key} (%)
              <input type="number" min={2} max={100} step={0.5} value={Number(column.widthPct.toFixed(1))}
                onChange={event => dispatch({ type: 'table', patch: { columns: resizeColumn(table.columns, column.key, Number(event.target.value)) } })} />
            </label>}
            <LabelField label={`Libellé ${column.label ?? column.key}`} original={column.label ?? column.key} field={`column.${column.key}`} layout={layout} dispatch={dispatch} />
          </div>)}
        </details>
        <details>
          <summary>Ordre et visibilité des rubriques</summary>
          <p>Glissez une rubrique ou utilisez les flèches pour la déplacer.</p>
          <ol className={styles.structure}>{items.map((item, index) => <li key={item.key}
            onDragOver={event => { if (event.dataTransfer.types.includes(rowMime)) event.preventDefault(); }}
            onDrop={event => {
              event.preventDefault();
              const bounds = event.currentTarget.getBoundingClientRect();
              moveRow(event.dataTransfer.getData(rowMime), item.key, event.clientY > bounds.top + bounds.height / 2);
            }}>
            <label className={styles.check} draggable onDragStart={event => event.dataTransfer.setData(rowMime, item.key)}>
              <input type="checkbox" checked={!table.rows.hidden.includes(item.key) || item.required} disabled={item.required} onChange={event =>
                dispatch({ type: 'table', patch: { rows: { ...table.rows, hidden: event.target.checked ? table.rows.hidden.filter(key => key !== item.key) : [...table.rows.hidden, item.key] } } })} />
              {layout.labels[item.key] ?? item.cells.label}
            </label>
            <button type="button" aria-label={`Monter ${item.cells.label}`} disabled={index === 0} onClick={() => moveRow(item.key, items[index - 1].key, false)}>↑</button>
            <button type="button" aria-label={`Descendre ${item.cells.label}`} disabled={index === items.length - 1} onClick={() => moveRow(item.key, items[index + 1].key, true)}>↓</button>
          </li>)}</ol>
        </details>
      </>}
    </div>;
  }

  const contrast = [
    [tokens.colors.ink, '#ffffff'], [tokens.colors.main, '#ffffff'],
    [tokens.colors.headText ?? tokens.colors.ink, tokens.colors.headFill ?? '#ffffff'],
    [tokens.colors.netCellText ?? tokens.colors.main, tokens.colors.netCellFill ?? '#ffffff'],
  ].some(([ink, background]) => colorContrast(ink, background) < 4.5);

  return <div className={styles.inspector}>
    <details open>
      <summary>Mise en page A4</summary>
      <label>Orientation
        <select value={layout.page.orientation} onChange={event => setLayout({ page: { ...layout.page, orientation: event.target.value as DocLayout['page']['orientation'] } })}>
          <option value="portrait">Portrait</option><option value="landscape">Paysage</option>
        </select>
      </label>
      <fieldset className={styles.margins}><legend>Marges (mm)</legend>
        {(Object.entries(margins) as [keyof typeof margins, string][]).map(([key, label]) => <label key={key}>{label}
          <input type="number" min={0} max={45} value={layout.page.marginsMm[key]} onChange={event => setLayout({
            page: { ...layout.page, marginsMm: { ...layout.page.marginsMm, [key]: Math.max(0, Math.min(45, Number(event.target.value))) } },
          })} />
        </label>)}
      </fieldset>
      <label>Taille du texte (pt)
        <input type="range" min={8} max={11} step={0.5} value={tokens.sizeBasePt} onChange={event => setTokens({ sizeBasePt: Number(event.target.value) })} />
        <output>{tokens.sizeBasePt} pt</output>
      </label>
      <label>Épaisseur des filets (pt)
        <input type="range" min={0.25} max={1.5} step={0.25} value={tokens.lineWidthPt} onChange={event => setTokens({ lineWidthPt: Number(event.target.value) })} />
      </label>
      <label>Pied de page
        <textarea maxLength={500} value={layout.footer.text ?? ''} onChange={event => setLayout({ footer: { ...layout.footer, text: event.target.value } })} />
      </label>
      <ColorPicker label="Fond du pied de page" value={layout.footer.colors?.background} fallback={tokens.colors.background ?? '#ffffff'}
        change={value => setLayout({ footer: { ...layout.footer, colors: { ...layout.footer.colors, background: value } } })} />
      <SeparatorControls title="Séparateur du pied de page" value={layout.footer.separator} color={tokens.colors.line} allowWord
        onChange={separator => setLayout({ footer: { ...layout.footer, separator } })} />
      <label className={styles.check}><input type="checkbox" checked={layout.footer.showPageNumber}
        onChange={event => setLayout({ footer: { ...layout.footer, showPageNumber: event.target.checked } })} /> Numéroter les pages</label>
    </details>
    <details open>
      <summary>Couleurs et polices</summary>
      {(['title', 'body'] as const).map(key => <label key={key}>Police {key === 'title' ? 'des titres' : 'du corps'}
        <select data-tour={key === 'title' ? 'title-font' : undefined} value={tokens.fonts[key]} onChange={event => setTokens({ fonts: { ...tokens.fonts, [key]: event.target.value as FontId } })}>
          {Object.entries(fonts).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
      </label>)}
      {(Object.entries(colors) as [keyof DocLayout['tokens']['colors'], string][]).map(([key, label]) => <label className={styles.swatch} key={key}>
        <input type="color" data-tour={key === 'main' ? 'title-color' : undefined} value={tokens.colors[key] ?? '#ffffff'} onChange={event => setColor(key, event.target.value)} /> {label}
      </label>)}
      {EyeDropper && <button type="button" onClick={() => {
        void new EyeDropper().open().then(({ sRGBHex }) => setColor('main', sRGBHex)).catch(() => {});
      }}>Prélever une couleur pour les titres</button>}
      {palette.length > 0 && <div className={styles.palette} aria-label="Palette extraite du logo">{palette.map(color => <button type="button" key={color}
        style={{ backgroundColor: color }} title={`Couleur de titre ${color}`} aria-label={`Utiliser ${color} pour les titres`} onClick={() => setColor('main', color)} />)}</div>}
      {contrast && <p role="status" className={styles.warning}>Une paire de couleurs est sous le seuil de contraste 4,5:1.</p>}
    </details>
    <details>
      <summary>Logo</summary>
      <label>Importer un logo
        <input type="file" data-tour="logo-import" accept="image/png,image/jpeg,image/webp" disabled={importing} onChange={async event => {
          const file = event.target.files?.[0];
          if (!file) return;
          onImporting(true);
          try { setLogo({ assetUrl: await prepareLogo(file) }); }
          catch (err) { onError(err instanceof Error ? err.message : 'Impossible de lire le logo.'); }
          finally { onImporting(false); }
        }} />
      </label>
      {companyLogo && <button type="button" onClick={() => setLogo({ assetUrl: companyLogo })}>Utiliser le logo de l’entreprise</button>}
      {logo.assetUrl && <button type="button" onClick={() => setLogo({ assetUrl: '' })}>Masquer le logo</button>}
      <label>Position du logo
        <select value={logo.align} onChange={event => setLogo({ align: event.target.value as typeof logo.align })}>
          <option value="left">Gauche</option><option value="center">Centre</option><option value="right">Droite</option>
        </select>
      </label>
      <label>Largeur du logo (mm)
        <input type="range" min={8} max={75} value={logo.widthMm} onChange={event => setLogo({ widthMm: Number(event.target.value) })} />
        <output>{logo.widthMm} mm</output>
      </label>
      <label className={styles.check}><input type="checkbox" checked={logo.hideNameWhenLogo}
        onChange={event => setLogo({ hideNameWhenLogo: event.target.checked })} /> Masquer le nom quand le logo est présent</label>
    </details>
    <button type="button" onClick={onReset}>Rétablir le design de départ</button>
    <button type="button" onClick={onCopy}>Copier mon modèle actuel</button>
  </div>;
}

function ColorPicker({ label, value, fallback, change }: {
  label: string; value?: string; fallback: string; change: (value?: string) => void;
}) {
  return <div>
    <label className={styles.swatch}><input type="color" value={value ?? fallback} onChange={event => change(event.target.value)} /> {label}</label>
    {value && <button type="button" onClick={() => change()}>Rétablir</button>}
  </div>;
}

function LabelField({ label, field, original, layout, dispatch }: {
  label: string; field: string; original: string; layout: DocLayout; dispatch: Dispatch<EditorCommand>;
}) {
  return <label>{label}
    <input type="text" maxLength={80} placeholder={original} value={layout.labels[field] ?? ''}
      onChange={event => dispatch({ type: 'label', key: field, text: event.target.value })} />
    {layout.labels[field] && <button type="button" onClick={() => dispatch({ type: 'label', key: field, text: '' })}>Rétablir le libellé</button>}
  </label>;
}
