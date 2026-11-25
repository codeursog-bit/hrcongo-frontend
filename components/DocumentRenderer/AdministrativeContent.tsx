import type { CSSProperties, ReactNode } from 'react';
import type { Block, DocLayout, DocumentContext } from '@/types/document-layout';
import { below, drawSeparator, paint, palette } from './colorStyles';
import Shapes from './Shapes';
import SeparatorText from './SeparatorText';
import type { AdministrativeBlock } from '@/lib/document-engine/administrative';
import styles from './administrative.module.css';

const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
const signatureCodes: Record<string, string> = {
  'Le Responsable Hiérarchique': 'HIERARCHY_HEAD',
  'Le Supérieur hiérarchique': 'HIERARCHY_HEAD',
  'La Direction des Ressources Humaines': 'HR',
  'Les Ressources Humaines': 'HR',
  'Direction des Ressources Humaines': 'HR',
  'La Direction Générale': 'DG',
  'Direction Générale': 'DG',
  'Responsable direct': 'HIERARCHY_HEAD',
  'Responsable comptable': 'ACCOUNTANT',
};
function Check({ checked = false }: { checked?: boolean }) {
  return <span className={styles.checkbox} role="img" aria-label={checked ? 'Coché' : 'Non coché'}>{checked ? '✓' : ''}</span>;
}

export default function AdministrativeContent({ layout, data }: { layout: DocLayout; data: DocumentContext }) {
  const { values, administrative } = data;
  const documentFooter = layout.footer.text ?? administrative?.footer;
  const label = (key: string, fallback: string) =>
    typeof layout.labels[key] === 'string' ? layout.labels[key] || fallback : fallback;
  const text = (key?: string) => key && Object.hasOwn(values, key) ? values[key] ?? '' : '';
  const { variants } = layout;
  const header = layout.blocks.find(block => block.visible && block.type === 'header');
  const title = label('document.title', String(header?.config.title ?? ''));
  const subtitle = String(header?.config.subtitle ?? '');
  const intro = String(header?.config.intro ?? '');
  const logo = layout.logo ? layout.logo.assetUrl : data.company.logo;
  const approvals = administrative?.approvals ?? [];
  const reference = text('request.reference');
  const company = <div className={styles.wordmark}>
    {logo && <img src={logo} alt="" style={layout.logo ? {
      width: `${layout.logo.widthMm}mm`, maxWidth: '100%', justifySelf: layout.logo.align,
    } : undefined} />}
    {!(logo && layout.logo?.hideNameWhenLogo) && <strong style={{ ...paint(header?.sectionColors?.['company.name']), ...below(header?.sectionSeparators?.['company.name']) }}>
      <SeparatorText text={data.company.name} separator={header?.sectionSeparators?.['company.name']} />
    </strong>}
    {layout.docType !== 'CONTRACTOR_INVOICE' && <small>Direction des ressources humaines</small>}
  </div>;
  const referenceBlock = reference && <div className={styles.reference}><span>Référence</span><b>{reference}</b></div>;
  const blockStyle = (block?: Block) => ({
    ...(block?.colors && palette({ ...layout.tokens.colors, ...block.colors })),
    ...paint(block?.colors),
    '--admin-company': block?.colors?.companyText ?? layout.tokens.colors.companyText,
    '--admin-title': block?.colors?.main,
    '--admin-header-ink': block?.colors?.ink ?? layout.tokens.colors.headText,
    '--admin-header-bg': block?.colors?.background,
    '--admin-table-head-ink': block?.colors?.headText ?? layout.tokens.colors.headText,
    '--admin-table-head-bg': block?.colors?.headFill,
  }) as CSSProperties;
  const heading = <div className={styles.title} style={{ ...blockStyle(header), ...below(header?.separator) }}>
    <h1 style={{ ...paint(header?.sectionColors?.['document.title']), ...below(header?.sectionSeparators?.['document.title']) }}>
      <SeparatorText text={title} separator={header?.sectionSeparators?.['document.title']} />
    </h1>{subtitle && <p>{subtitle}</p>}
  </div>;
  const contextDate = (template?: string) => {
    if (!template) return '';
    const city = text('company.city') || '…………';
    return text('request.date') ? `Fait à ${city}, le ${text('request.date')}`
      : template.replace('{ville}', String(city)).replace(/……\/……\/\s*2026$/, '……/……/……');
  };

  function signature(role: string) {
    const found = approvals.find(item => item.code === signatureCodes[role] || item.label === role);
    const stamp = signatureCodes[role] === 'HR' ? administrative?.stamp : undefined;
    if (!found && !stamp) return null;
    return <div className={styles.visa}>
      {found?.name && <b>{found.name}</b>}
      {found && <span>{found.decision}{found.date ? ` · ${found.date}` : ''}</span>}
      {found?.image && <img src={found.image} alt="Signature" />}
      {stamp && <img src={stamp} alt="Cachet de l’entreprise" />}
    </div>;
  }

  function render(config: AdministrativeBlock, block: Block): ReactNode {
    const zone = (key: string) => ({ ...paint(block.sectionColors?.[key]), ...below(block.sectionSeparators?.[key]) });
    const ornament = (key: string, value: string) => <SeparatorText text={value} separator={block.sectionSeparators?.[key]} />;
    switch (config.type) {
      case 'fieldGroup':
        return <dl className={styles.fields} style={{ '--field-columns': typeof config.colonnes === 'number' ? config.colonnes : 2 } as CSSProperties}>
          {config.champs?.map(([key, caption]) => <div key={key} style={{ ...paint(block.sectionColors?.[`field.${key}`]), ...below(block.sectionSeparators?.[`field.${key}`]) }}
            data-field-ink={block.sectionColors?.[`field.${key}`]?.ink ? '' : undefined}>
            <dt><SeparatorText text={label(key, caption)} separator={block.sectionSeparators?.[`field.${key}`]} /></dt><dd>{text(key)}</dd>
          </div>)}
        </dl>;
      case 'invoiceTable': return <table className={styles.table}>
        <thead><tr>{['label', 'gain', 'deduction'].map((key, i) => <th key={key} style={zone('column.' + key)}>{label('invoice.' + key, ['Désignation', 'Montant', 'Retenue'][i])}</th>)}</tr></thead>
        <tbody>{data.items.map(row => <tr key={row.id}>{['label', 'gain', 'deduction'].map(key => <td key={key} style={{ ...zone('column.' + key), textAlign: key === 'label' ? 'left' : 'right' }}>{row.cells[key]}</td>)}</tr>)}</tbody>
      </table>;
      case 'motifTable': {
        const rows = administrative?.motifs ?? (Array.isArray(config.lignes) ? config.lignes.flatMap(row =>
          typeof row === 'string' ? [] : [{ ...row, days: row.jours, checked: false }]) : []);
        return <table className={styles.table} data-kind="motifs">
          <colgroup><col style={{ width: '68%' }} /><col style={{ width: '23%' }} /><col style={{ width: '9%' }} /></colgroup>
          <thead><tr>{Array.isArray(config.colonnes) && config.colonnes.map(caption => <th scope="col" key={caption}>{caption}</th>)}</tr></thead>
          <tbody>{rows.map(row => <tr key={row.key}><td style={zone(`motif.${row.key}`)}>{ornament(`motif.${row.key}`, row.label)}</td>
            <td style={zone(`motif.${row.key}`)}>{row.days == null ? '' : `${row.days} jour${row.days === 1 ? '' : 's'}`}</td>
            <td style={zone(`motif.${row.key}`)}><Check checked={row.checked} /></td></tr>)}</tbody>
        </table>;
      }
      case 'checklist':
        return <div className={styles.choiceGroup}>{config.label && <b>{config.label}</b>}
          <div>{config.options?.map((option, index) => <span key={option} style={zone(`option.${index}`)}>
            <Check checked={!!config.optionKeys?.[index] && text(config.valueKey) === config.optionKeys[index]} /> {ornament(`option.${index}`, option)}
          </span>)}</div>
        </div>;
      case 'textLines':
        return <div className={styles.textLines}>
          <b style={zone('text.label')}>{ornament('text.label', label(`block.${block.id}`, config.label ?? ''))}</b>
          <p>{text(config.valueKey ?? 'request.reason')}</p>
          {Array.from({ length: typeof config.lignes === 'number' ? config.lignes - 1 : 0 }, (_, i) => <p key={i} />)}
        </div>;
      case 'dateSignature':
        return <div className={styles.dateSignature}>
          <span>{contextDate(config.date)}</span>
          {config.signature && <div><b>{config.signature}</b></div>}
        </div>;
      case 'decision':
        return <div className={styles.decision}><b>Décision</b><div>{config.options?.map((option, index) =>
          <span key={option} style={zone(`option.${index}`)}><Check checked={text('request.status') === option} /> {ornament(`option.${index}`, option)}</span>)}</div>
          {config.commentaire && <p>{config.commentaire}</p>}
        </div>;
      case 'reviewTable':
        return <table className={styles.table} data-kind="reviews">
          <thead><tr>{(Array.isArray(config.colonnes) ? config.colonnes : ['Fonction', 'Nom et visa', 'Décision'])
            .map(caption => <th scope="col" key={caption}>{caption}</th>)}</tr></thead>
          <tbody>{Array.isArray(config.lignes) && config.lignes.map((role, index) => typeof role === 'string' && <tr key={role}>
            <th scope="row" style={zone(`review.${index}`)}>{ornament(`review.${index}`, role)}</th><td>{signature(role)}</td><td>{config.options?.map(option =>
              <span key={option}><Check checked={approvals.some(item => (item.code === signatureCodes[role] || item.label === role) && item.decision === option)} /> {option}</span>)}</td>
          </tr>)}
          {config.ligneFinale && <tr><th scope="row">{config.ligneFinale}</th><td colSpan={2}>{text('advance.approvedAmount')}</td></tr>}</tbody>
        </table>;
      case 'signatures':
        return <div className={styles.signatures} data-large={!!config.hauteurRelative}
          style={{ '--signature-columns': config.items?.length || 1 } as CSSProperties}>
          {config.items?.map((role, index) => <div key={role} style={zone(`signature.${index}`)}><b>{ornament(`signature.${index}`, role)}</b>{signature(role)}</div>)}
        </div>;
      case 'note':
      case 'declaration':
        return <p className={styles.note} style={zone('block.text')}>
          <SeparatorText text={config.texte ?? ''} separator={block.sectionSeparators?.['block.text']} />
        </p>;
      case 'divider':
        return <hr style={{ border: 0, borderTop: drawSeparator(block.separator ?? { style: 'solid' }), margin: 0 }} />;
      default: return null;
    }
  }

  const supplementary = [
    ['employee.employeeNumber', 'Matricule'], ['leave.type', 'Type de congé'], ['absence.days', 'Jours ouvrables'],
    ['absence.returnDate', 'Date de reprise'], ['advance.period', 'Période de récupération'],
    ['loan.monthlyRepayment', 'Mensualité'],
  ].filter(([key]) => text(key) !== '' && !layout.blocks.some(block =>
    (block.config.champs as string[][] | undefined)?.some(([field]) => field === key)));
  const assignedCodes = new Set<string>();
  for (const block of layout.blocks) {
    const config = block.config as AdministrativeBlock;
    if (config.type !== 'reviewTable' && config.type !== 'signatures') continue;
    for (const role of config.items ?? (Array.isArray(config.lignes) ? config.lignes : [])) {
      if (typeof role === 'string') { assignedCodes.add(signatureCodes[role]); assignedCodes.add(role); }
    }
  }
  const unassigned = approvals.filter(item => !assignedCodes.has(item.code) && !assignedCodes.has(item.label));
  const bodyBlocks = layout.blocks.filter(block => block.visible && block.type !== 'header')
    .sort((a, b) => a.row - b.row || a.col - b.col);
  const rowOrder = Array.from(new Set(bodyBlocks.map(block => block.row)));
  let section = 0;
  return <div className={styles.sheet} data-document-page="" data-shape-anchor="page" style={{ position: 'relative' }} data-admin-type={layout.docType}
    data-heading={variants.header} data-title={variants.title} data-section={variants.section}
    data-field={variants.field} data-table-variant={variants.table} data-signature={variants.signature}
    data-footer={variants.footer}>
    <header className={styles.header} data-shape-anchor={header?.id} style={{ ...blockStyle(header), position: 'relative' }}>
      <Shapes anchor={header?.id ?? 'header'} />{company}{variants.title === 'inside-cartouche' && heading}{referenceBlock}
    </header>
    {variants.title !== 'inside-cartouche' && heading}
    {text('request.status') && layout.docType !== 'EXIT_PERMISSION' && <p className={styles.status}>{text('request.status')}</p>}
    {intro && <p className={styles.note}>{intro}</p>}
    <div className={styles.blocks}>
      {bodyBlocks.map(block => {
        const config = block.config as AdministrativeBlock;
        const sectionTitle = label(`section.${block.id}`, config.titre ?? '');
        const number = sectionTitle ? section++ : 0;
        return <section key={block.id} data-admin-block={block.id} data-shape-anchor={block.id} style={{
          position: 'relative', ...blockStyle(block), ...(block.type !== 'divider' && below(block.separator)),
          gridColumn: `${block.col} / span ${block.span}`, gridRow: rowOrder.indexOf(block.row) + 1,
        }}>
          {sectionTitle && <h2 style={{ ...paint(block.sectionColors?.['block.title']), ...below(block.sectionSeparators?.['block.title']) }}><span data-roman={roman[number] ?? number + 1} data-number={String(number + 1).padStart(2, '0')} />
            <SeparatorText text={sectionTitle} separator={block.sectionSeparators?.['block.title']} /></h2>}
          {render(config, block)}<Shapes anchor={block.id} />
        </section>;
      })}
    </div>
    {supplementary.length > 0 && <dl className={styles.supplementary}>
      {supplementary.map(([key, caption]) => <div key={key}><dt>{caption}</dt><dd>{text(key)}</dd></div>)}
    </dl>}
    {unassigned.length > 0 && <div className={styles.extra}>{unassigned.map(item =>
      <div key={item.code}><b>{item.label}</b>{signature(item.label)}</div>)}</div>}
    {(documentFooter || layout.footer.showPageNumber) && <footer className={styles.footer} style={{
      ...paint(layout.footer.colors), borderTop: layout.footer.separator?.word ? undefined : drawSeparator(layout.footer.separator),
    }}>
      {documentFooter && <SeparatorText text={documentFooter} separator={layout.footer.separator} />}{layout.footer.showPageNumber && <span className={styles.pageNumber}>1</span>}
    </footer>}
    <Shapes anchor="page" />
  </div>;
}
