'use client';

import Link from 'next/link';
import { useEffect, useMemo, useReducer, useState } from 'react';
import { ArrowDown, ArrowUp, Printer, Redo2, Save, Undo2 } from 'lucide-react';
import DocumentRenderer from '@/components/DocumentRenderer';
import { DocumentReader } from '@/components/ui/DocumentReader';
import { api } from '@/services/api';
import { printBulletin } from '@/lib/bulletin-print';
import { prepareLogo, uploadDocumentLogo } from '@/lib/document-engine/editor-logo';
import {
  administrativeBlockOptional, administrativeExample, administrativeNames, administrativeOtherDesigns,
  administrativePresets, makeAdministrativeDesign, type AdministrativeBlock, type AdministrativeType,
} from '@/lib/document-engine/administrative';
import { invoiceDesigns, invoiceExample, makeInvoiceDesign } from '@/lib/document-engine/invoices';
import { loadAdministrativeLayout, saveAdministrativeLayout } from '@/lib/document-engine/administrative-api';
import { loadDocumentRights, type DocumentRights } from '@/lib/document-engine/document-rights';
import { documentHistory, initialHistory, orderedBlocks } from '@/lib/document-engine/editor-state';
import type { Block, DocLayout, DocumentColors } from '@/types/document-layout';
import { newSeparator } from '@/components/DocumentRenderer/Shapes';
import SeparatorControls from './SeparatorControls';
import styles from './editor.module.css';
import local from './administrative-editor.module.css';

const visualColors: Partial<Record<keyof DocumentColors, string>> = {
  background: 'Fond', main: 'Titres et accents', companyText: 'Nom de l’entreprise', ink: 'Texte',
  fieldLabel: 'Libellés', fieldValue: 'Valeurs', line: 'Bordures', muted: 'Texte secondaire et pied de page',
  headFill: 'Fond des en-têtes', headText: 'Texte des en-têtes', soft: 'Fond des encadrés', accent: 'Couleur d’accent',
};
const blockLabels: Partial<Record<Block['type'], string>> = {
  header: 'En-tête et titre', fieldGroup: 'Informations', table: 'Tableau des motifs',
  signatures: 'Signatures', reviewTable: 'Avis et décisions', textLines: 'Texte', dateSignature: 'Date et signature',
  checklist: 'Cases à cocher', decision: 'Décision', declaration: 'Déclaration', note: 'Texte libre', divider: 'Séparateur',
};
type Company = { id: string; logo?: string; documentTemplate?: string };

function blockLabel(block: Block) {
  return String(block.config.titre || block.config.label || blockLabels[block.type] || block.type);
}

export default function AdministrativeEditor({ companyId, docType }: { companyId: string; docType: AdministrativeType | 'CONTRACTOR_INVOICE' }) {
  const invoice = docType === 'CONTRACTOR_INVOICE';
  const documentName = invoice ? 'Facture prestataire' : administrativeNames[docType];
  const makeDesign = (preset?: string) => invoice ? makeInvoiceDesign(preset) : makeAdministrativeDesign(docType, preset);
  const presets = invoice ? invoiceDesigns : administrativePresets;
  const otherDesigns = (template?: string) => invoice ? [] : administrativeOtherDesigns(docType, template);
  const [history, dispatch] = useReducer(documentHistory, { name: documentName, layout: makeDesign() }, initialHistory);
  const [company, setCompany] = useState<Company>();
  const [rights, setRights] = useState<DocumentRights>();
  const [baseline, setBaseline] = useState('');
  const [selected, setSelected] = useState<string>();
  const [field, setField] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [importing, setImporting] = useState(false);
  const [starting, setStarting] = useState(false);
  const { layout, name } = history.current;
  const serialized = JSON.stringify(history.current);
  const dirty = baseline !== '' && baseline !== serialized;
  const blocks = orderedBlocks(layout.blocks);
  const active = blocks.find(block => block.id === selected);
  const lockSave = layout.basePreset === 'BLANK' && !rights?.canBuildDocumentsFromScratch;
  const data = useMemo(() => docType === 'CONTRACTOR_INVOICE' ? invoiceExample() : administrativeExample(docType), [docType]);
  const gallery = invoice ? '/parametres/documents/factures' : `/parametres/documents/administratifs?type=${docType}`;

  useEffect(() => {
    let mounted = true;
    Promise.all([api.get<Company>('/companies/mine'), loadAdministrativeLayout(companyId, docType), loadDocumentRights()])
      .then(([current, saved, access]) => {
        if (!mounted) return;
        if (current.id !== companyId) throw new Error('Entreprise inaccessible.');
        setCompany(current); setRights(access);
        if (!access.canCustomizeDocuments) return;
        const params = new URLSearchParams(window.location.search);
        const other = otherDesigns(current.documentTemplate);
        const choice = [...presets, ...other].find(model => model.id === params.get('preset'));
        const startingBlank = params.get('start') === 'blank' && access.canBuildDocumentsFromScratch;
        const currentLayout = saved?.config?.docType === docType ? { ...saved.config, useOriginal: undefined } : makeDesign();
        const initial = { name: saved?.name ?? documentName, layout: currentLayout };
        const draft = startingBlank ? { name: 'Mon modèle', layout: makeDesign('BLANK') }
          : choice && choice.id !== saved?.basePreset ? { name: choice.name, layout: makeDesign(choice.id) } : initial;
        dispatch({ type: 'initialize', draft }); setBaseline(JSON.stringify(initial));
      }).catch(() => { if (mounted) setError('Impossible de charger l’éditeur.'); });
    return () => { mounted = false; };
  }, [companyId, docType]);

  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [dirty]);

  function select(id?: string) { setSelected(id); setField(''); }
  function patchBlock(patch: Partial<Block>) {
    if (active) dispatch({ type: 'block', id: active.id, patch });
  }
  function patchLayout(patch: Partial<DocLayout>) { dispatch({ type: 'layout', patch }); }
  function move(id: string, target: string, side: 'before' | 'after') {
    if (id !== 'header' && target !== 'header') dispatch({ type: 'move', id, target, side });
  }
  function add(type: 'divider' | 'note') {
    if (type === 'divider') { if ((layout.shapes?.length ?? 0) >= 60) return; patchLayout({ shapes: [...(layout.shapes ?? []), newSeparator(active?.id)] }); return; }
    if (blocks.length >= 60) return;
    const id = crypto.randomUUID();
    dispatch({ type: 'add', block: { id, type, col: 1, span: 12, row: blocks.length + 1,
      visible: true, config: { type, texte: 'Votre texte' } } });
    if (active && active.type !== 'header') move(id, active.id, 'after');
    select(id);
  }
  function choose(preset: string, model: string) {
    if (dirty && !window.confirm('Remplacer les modifications en cours par ce modèle ?')) return;
    dispatch({ type: 'replace', draft: { name: model, layout: makeDesign(preset) } });
    select(); setStarting(false);
  }
  async function save() {
    if (!rights?.canCustomizeDocuments || busy || importing || lockSave) return;
    if (!name.trim() || /[<>]/.test(name)) { setError('Saisissez un nom de modèle valide.'); return; }
    setBusy(true); setError(''); setNotice('');
    try {
      const logo = layout.logo;
      const out = logo?.assetUrl.startsWith('data:')
        ? { ...layout, logo: { ...logo, assetUrl: await uploadDocumentLogo(logo.assetUrl, docType) } } : layout;
      const saved = await saveAdministrativeLayout(docType, out, name.trim());
      const next = { name: saved.name ?? name.trim(), layout: saved.config ?? out };
      dispatch({ type: 'replace', draft: next }); setBaseline(JSON.stringify(next));
      setNotice('Modèle enregistré et actif pour ce type de document.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible d’enregistrer ce modèle.');
    } finally { setBusy(false); }
  }

  const config = active?.config as AdministrativeBlock | undefined;
  const sectionTitle = active ? layout.labels[`section.${active.id}`] ?? config?.titre : undefined;
  const zones = [
    ...(invoice && active?.type === 'table' ? ['label', 'gain', 'deduction'].map((key, i) => ({ id: 'column.' + key, label: ['Désignation', 'Montant', 'Retenue'][i] })) : []),
    ...(active?.type === 'header' ? [{ id: 'document.title', label: 'Titre du document' }, { id: 'company.name', label: 'Nom de l’entreprise' }] : []),
    ...(sectionTitle ? [{ id: 'block.title', label: sectionTitle }] : []),
    ...(config?.texte ? [{ id: 'block.text', label: 'Texte de la zone' }] : []),
    ...(active?.type === 'textLines' && config?.label ? [{ id: 'text.label', label: config.label }] : []),
    ...((active?.type === 'checklist' || active?.type === 'decision') ? config?.options?.map((label, index) => ({ id: `option.${index}`, label })) ?? [] : []),
    ...(Array.isArray(config?.lignes) ? config.lignes.flatMap((row, index) =>
      typeof row === 'string' ? active?.type === 'reviewTable' ? [{ id: `review.${index}`, label: row }] : [] : [{ id: `motif.${row.key}`, label: row.label }]) : []),
    ...(config?.items?.map((label, index) => ({ id: `signature.${index}`, label })) ?? []),
    ...(config?.champs?.map(([id, label]) => ({ id: `field.${id}`, label })) ?? []),
  ];
  const activeColor = active?.colors?.line ?? layout.tokens.colors.line;
  const labelInput = (key: string, placeholder: string, caption: string) =>
    <label>{caption}<input maxLength={80} placeholder={placeholder} value={layout.labels[key] ?? ''}
      onChange={event => dispatch({ type: 'label', key, text: event.target.value })} /></label>;

  if (!rights?.canCustomizeDocuments) return <main className="space-y-4 p-6">
    {error ? <p role="alert">{error}</p> : <p role="status">{rights ? 'La personnalisation est disponible à partir du plan Pro.' : 'Chargement de l’éditeur…'}</p>}
    <Link href={gallery} className="underline">Retour aux modèles</Link>
  </main>;
  return <main className={`${styles.editor} ${local.editor}`}>
    <header className={styles.toolbar}>
      <Link href={gallery} onClick={event => {
        if (dirty && !window.confirm('Quitter sans enregistrer les modifications ?')) event.preventDefault();
      }}>Retour aux modèles</Link>
      <input aria-label="Nom du modèle" maxLength={80} value={name} disabled={busy}
        onChange={event => dispatch({ type: 'name', name: event.target.value })} />
      <div className={styles.tools}>
        <button type="button" onClick={() => setStarting(!starting)} aria-expanded={starting}>Points de départ</button>
        <button type="button" aria-label="Annuler" disabled={busy || !history.past.length} onClick={() => dispatch({ type: 'undo' })}><Undo2 size={16} /></button>
        <button type="button" aria-label="Rétablir" disabled={busy || !history.future.length} onClick={() => dispatch({ type: 'redo' })}><Redo2 size={16} /></button>
        <button type="button" onClick={() => printBulletin('admin-editor-document')}><Printer size={16} /> Imprimer l’aperçu</button>
        <button type="button" className={styles.primary} disabled={busy || importing || lockSave} onClick={() => void save()}><Save size={16} /> Enregistrer</button>
      </div>
    </header>
    {error && <p className={styles.warning} role="alert">{error}</p>}
    {notice && <p className={styles.notice} role="status">{notice}</p>}
    {starting && <section className={styles.start}><h2>Choisir un point de départ</h2>
      <div className={styles.intros}>
        {[...presets, ...otherDesigns(company?.documentTemplate)].map(item =>
          <button type="button" key={item.id} onClick={() => choose(item.id, item.name)}>{item.name}</button>)}
        {rights.canBuildDocumentsFromScratch && <button type="button" onClick={() => choose('BLANK', 'Mon modèle')}>Page blanche</button>}
      </div>
    </section>}
    <div className={`${styles.workspace} ${local.workspace}`}>
      <aside className={styles.panel} aria-label="Structure de la demande">
        <h2>{documentName}</h2>
        <div className={styles.panelBody}>
          <button type="button" disabled={busy || blocks.length >= 60} onClick={() => add('divider')}>Ajouter un séparateur</button>
          <button type="button" disabled={busy || blocks.length >= 60} onClick={() => add('note')}>Ajouter un texte</button>
        </div>
        <ol className={styles.structure}>
          {blocks.map((block, index) => <li key={block.id} data-selected={selected === block.id}
            onDragOver={event => { if (block.type !== 'header') event.preventDefault(); }}
            onDrop={event => { event.preventDefault(); move(event.dataTransfer.getData('text/plain'), block.id, 'before'); }}>
            <button type="button" onClick={() => select(block.id)} draggable={block.type !== 'header'}
              onDragStart={event => event.dataTransfer.setData('text/plain', block.id)}>{blockLabel(block)}</button>
            {block.type !== 'header' && <>
              <button type="button" aria-label={`Monter ${blockLabel(block)}`} disabled={index < 2 || busy}
                onClick={() => move(block.id, blocks[index - 1].id, 'before')}><ArrowUp size={13} /></button>
              <button type="button" aria-label={`Descendre ${blockLabel(block)}`} disabled={index === blocks.length - 1 || busy}
                onClick={() => move(block.id, blocks[index + 1].id, 'after')}><ArrowDown size={13} /></button>
            </>}
          </li>)}
        </ol>
      </aside>
      <div className={styles.center}>
        <DocumentReader title={invoice ? "Aperçu de la facture" : "Aperçu de la demande"} subtitle="Données d’exemple" landscape={layout.page.orientation === 'landscape'}>
          <div id="admin-editor-document" onClick={event => {
            const node = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-admin-block]') : null;
            if (node?.dataset.adminBlock) select(node.dataset.adminBlock);
          }}><DocumentRenderer docType={docType} layout={layout} data={data} editing onShapesChange={shapes => patchLayout({ shapes })} /></div>
        </DocumentReader>
      </div>
      <aside className={styles.panel} aria-label="Réglages du document">
        <div className={styles.inspector}>
          {active && <button type="button" onClick={() => select()}>Réglages de la page</button>}
          <h2>{active ? blockLabel(active) : 'Réglages de la page'}</h2>
          {active && active.type !== 'header' && <label>Largeur sur 12 colonnes
            <input type="range" min={1} max={13 - active.col} value={active.span}
              onChange={event => patchBlock({ span: Number(event.target.value) })} />
          </label>}
          {active && administrativeBlockOptional(active) && <button type="button" onClick={() => {
            dispatch({ type: 'remove', id: active.id }); select();
          }}>Supprimer le bloc</button>}
          {active?.type === 'header' && labelInput('document.title', String(active.config.title ?? ''), 'Titre du document')}
          {invoice && active?.type === 'table' && ['label', 'gain', 'deduction'].map((key, i) => <div key={key}>{labelInput('invoice.' + key, ['Désignation', 'Montant', 'Retenue'][i], 'Titre de colonne')}</div>)}
          {active && active.type !== 'header' && active.type !== 'divider' && labelInput(`section.${active.id}`, config?.titre ?? '', 'Titre de la section')}
          {active?.type === 'textLines' && config?.label && labelInput(`block.${active.id}`, config.label, 'Libellé du texte')}
          {active?.type === 'note' && <label>Texte
            <textarea maxLength={600} value={config?.texte ?? ''} onChange={event => patchBlock({ config: { ...active.config, texte: event.target.value } })} />
          </label>}
          {!!config?.champs?.length && <details><summary>Libellés des champs</summary>
            {config.champs.map(([id, caption]) => <div key={id}>{labelInput(id, caption, caption)}</div>)}
          </details>}
          <details open={!active || undefined}><summary>Couleurs</summary>
            {(Object.entries(visualColors) as [keyof DocumentColors, string][]).map(([key, caption]) => <label key={key} className={styles.swatch}>
              {caption}<input type="color" value={active?.colors?.[key] ?? layout.tokens.colors[key] ?? (key === 'background' ? '#ffffff' : '#222222')}
                onChange={event => {
                  if (active) patchBlock({ colors: { ...active.colors, [key]: event.target.value } });
                  else patchLayout({ tokens: { ...layout.tokens, colors: { ...layout.tokens.colors, [key]: event.target.value } } });
                }} />
            </label>)}
            {active?.colors && <button type="button" onClick={() => patchBlock({ colors: undefined })}>Reprendre les couleurs de la page</button>}
          </details>
          {active ? <details open><summary>Séparateurs</summary>
            {active.type === 'divider' && <button type="button" onClick={() => {
              patchLayout({ blocks: layout.blocks.filter(item => item.id !== active.id), shapes: [...(layout.shapes ?? []), newSeparator()] }); select();
            }}>Transformer en séparateur libre</button>}
            <SeparatorControls title={active.type === 'divider' ? 'Style du séparateur' : 'Trait sous le bloc'} value={active.separator}
              standalone={active.type === 'divider'} color={activeColor} onChange={separator => patchBlock({ separator })} />
            {zones.length > 0 && <label>Zone précise
              <select value={field} onChange={event => setField(event.target.value)}>
                <option value="">Choisir une zone</option>
                {zones.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
              </select>
            </label>}
            {field && <SeparatorControls title="Trait sous la zone sélectionnée" value={active.sectionSeparators?.[field]}
              color={activeColor} allowWord onChange={value => {
                const next = { ...active.sectionSeparators };
                if (value) next[field] = value; else delete next[field];
                patchBlock({ sectionSeparators: Object.keys(next).length ? next : undefined });
              }} />}
            {field && (['ink', 'background'] as const).map(key => <label key={key} className={styles.swatch}>
              {key === 'ink' ? 'Texte de la zone' : 'Fond de la zone'}<input type="color"
                value={active.sectionColors?.[field]?.[key] ?? active.colors?.[key] ?? layout.tokens.colors[key] ?? '#ffffff'}
                onChange={event => patchBlock({ sectionColors: { ...active.sectionColors,
                  [field]: { ...active.sectionColors?.[field], [key]: event.target.value },
                } })} />
            </label>)}
          </details> : <>
            <details><summary>Page et typographie</summary>
              <label>Orientation<select value={layout.page.orientation} onChange={event => patchLayout({ page: {
                ...layout.page, orientation: event.target.value as DocLayout['page']['orientation'],
              } })}><option value="portrait">Portrait</option><option value="landscape">Paysage</option></select></label>
              {(['title', 'body'] as const).map(key => <label key={key}>{key === 'title' ? 'Police des titres' : 'Police du texte'}
                <select value={layout.tokens.fonts[key]} onChange={event => patchLayout({ tokens: {
                  ...layout.tokens, fonts: { ...layout.tokens.fonts, [key]: event.target.value },
                } })}><option value="carlito">Carlito</option><option value="caladea">Caladea</option><option value="liberation-sans">Liberation Sans</option></select>
              </label>)}
              <label>Pied de page<textarea maxLength={500} value={layout.footer.text ?? ''}
                placeholder="Pied de page de l’entreprise" onChange={event => patchLayout({ footer: { ...layout.footer, text: event.target.value } })} /></label>
              <button type="button" onClick={() => patchLayout({ footer: { ...layout.footer, text: undefined } })}>Reprendre le pied de page de l’entreprise</button>
              <SeparatorControls title="Séparateur du pied de page" value={layout.footer.separator} color={activeColor} allowWord
                onChange={separator => patchLayout({ footer: { ...layout.footer, separator } })} />
            </details>
            <details><summary>Logo</summary>
              <label>Importer un logo<input type="file" accept="image/png,image/jpeg,image/webp" disabled={importing} onChange={async event => {
                const file = event.target.files?.[0];
                if (!file) return;
                setImporting(true); setError('');
                try { patchLayout({ logo: { assetUrl: await prepareLogo(file), align: 'left', widthMm: 24, hideNameWhenLogo: false } }); }
                catch { setError('Impossible de lire le logo sélectionné.'); }
                finally { setImporting(false); }
              }} /></label>
              {company?.logo && <button type="button" onClick={() => patchLayout({ logo: { assetUrl: company.logo!, align: 'left',
                widthMm: 24, hideNameWhenLogo: false } })}>Utiliser le logo de l’entreprise</button>}
              <button type="button" onClick={() => patchLayout({ logo: { assetUrl: '', align: 'left', widthMm: 24, hideNameWhenLogo: false } })}>Masquer le logo</button>
            </details>
          </>}
        </div>
      </aside>
    </div>
  </main>;
}
