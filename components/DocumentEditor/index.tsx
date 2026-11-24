'use client';

import { useEffect, useMemo, useReducer, useRef, useState, type DragEvent, type KeyboardEvent, type PointerEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, PanelLeftClose, PanelRightClose, Printer, Redo2, Save, Undo2 } from 'lucide-react';
import { api } from '@/services/api';
import DocumentRenderer from '@/components/DocumentRenderer';
import { printBulletin } from '@/lib/bulletin-print';
import { buildContext, createPayslipLayout, payslipPresets, type PayslipPreset } from '@/lib/document-engine/registry';
import { loadPayslipLayout, savePayslipLayout } from '@/lib/document-engine/layout-api';
import { payslipExample } from '@/lib/document-engine/example';
import { blockNames, copyLegacyTemplate, documentHistory, initialHistory, movePayrollRow, orderedBlocks, resizeColumn, tableSettings, type EditorDraft } from '@/lib/document-engine/editor-state';
import { uploadDocumentLogo } from '@/lib/document-engine/editor-logo';
import type { BulletinTemplateConfig } from '@/types/bulletin-template';
import type { CanvasLayout } from '@/types/canvas-block';
import type { Block, DocLayout, DocumentContext } from '@/types/document-layout';
import type { PayslipData } from '@/lib/document-engine/payslip';
import { isFactureContract } from '@/lib/facture-contract-types';
import Inspector from './Inspector';
import styles from './editor.module.css';

const gallery = '/parametres/documents';
const blue: EditorDraft = { name: 'Bleu', layout: createPayslipLayout() };
const blockMime = 'application/x-konza-block';
const rowMime = 'application/x-konza-payroll-row';
type Company = { id: string; legalName?: string; logo?: string; documentTemplate?: string };
type PayrollChoice = Pick<PayslipData, 'id' | 'year' | 'month' | 'employee' | 'companyId'>;
type DraftRecord = { draft: EditorDraft; version: number; baseline?: string };
type LabelEdit = { key: string; text: string; x: number; y: number; width: number };

function localDraft(key: string, version: number) {
  try {
    const record = JSON.parse(localStorage.getItem(key) ?? 'null') as DraftRecord | null;
    return record?.version === version && record.draft.layout.schemaVersion === 2 ? record : null;
  } catch { return null; }
}

export default function DocumentEditor({ companyId, userId }: { companyId: string; userId: string }) {
  const router = useRouter();
  const [history, dispatch] = useReducer(documentHistory, blue, initialHistory);
  const [company, setCompany] = useState<Company>();
  const [savedDraft, setSavedDraft] = useState<EditorDraft>();
  const [version, setVersion] = useState(0);
  const [baseline, setBaseline] = useState('');
  const [starting, setStarting] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [selectedId, select] = useState<string>();
  const [zoom, setZoom] = useState(75);
  const [left, setLeft] = useState(true);
  const [right, setRight] = useState(true);
  const [preview, setPreview] = useState(false);
  const [wide, setWide] = useState(false);
  const [viewport, setViewport] = useState(390);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [preparingLogo, setPreparingLogo] = useState(false);
  const [labelEdit, setLabelEdit] = useState<LabelEdit>();
  const [drop, setDrop] = useState<{ id: string; side: 'before' | 'after' | 'left' | 'right' }>();
  const [rowDrop, setRowDrop] = useState<string>();
  const [choices, setChoices] = useState<PayrollChoice[]>();
  const [payrollId, setPayrollId] = useState('');
  const [realData, setRealData] = useState<DocumentContext>();
  const [realLoading, setRealLoading] = useState(false);
  const [overflow, setOverflow] = useState(false);
  const uploadedLogos = useRef(new Map<string, string>());
  const lastSave = useRef(-Infinity);
  const editorRoot = useRef<HTMLElement>(null);
  const paper = useRef<HTMLDivElement>(null);
  const draftKey = `konza:document-draft:${companyId}:${userId}:PAYSLIP`;
  const { layout, name } = history.current;
  const serialized = JSON.stringify(history.current);
  const dirty = !!baseline && baseline !== serialized;
  const blocks = orderedBlocks(layout.blocks);
  const selected = blocks.find(block => block.id === selectedId);
  const data = realData ?? payslipExample;
  const displayLayout = useMemo(() => !layout.logo && company?.logo ? {
    ...layout, logo: { assetUrl: company.logo, align: 'left' as const, widthMm: 22, hideNameWhenLogo: false },
  } : layout, [company?.logo, layout]);

  useEffect(() => {
    const update = () => { setWide(window.innerWidth >= 1024); setViewport(window.innerWidth); };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([api.get<Company>('/companies/mine'), loadPayslipLayout(companyId)]).then(([current, saved]) => {
      if (!active) return;
      if (current.id !== companyId) throw new Error('Entreprise inaccessible.');
      const local = localDraft(draftKey, saved?.version ?? 0);
      const preset = new URLSearchParams(window.location.search).get('preset');
      const choice = payslipPresets.find(item => item.id === preset);
      const savedDraft = saved ? { name: saved.name, layout: saved.config } : undefined;
      const activeDraft = savedDraft ?? blue;
      const selectedDraft = choice && choice.id !== saved?.basePreset
        ? { name: choice.name, layout: createPayslipLayout(choice.id) } : activeDraft;
      dispatch({ type: 'initialize', draft: local?.draft ?? selectedDraft });
      setSavedDraft(savedDraft);
      setBaseline(local?.baseline ?? JSON.stringify(activeDraft));
      setCompany(current);
      setVersion(saved?.version ?? 0);
      setStarting(!saved && !local && !choice);
      if (local) setNotice('Brouillon local restauré.');
    }).catch(() => { if (active) setError('Impossible de charger le modèle.'); });
    return () => { active = false; };
  }, [attempt, companyId, draftKey]);

  useEffect(() => {
    if (company) editorRoot.current?.focus({ preventScroll: true });
  }, [company]);

  useEffect(() => {
    if (!company || starting) return;
    const store = () => {
      try {
        if (dirty) localStorage.setItem(draftKey, JSON.stringify({ draft: history.current, version, baseline }));
        else localStorage.removeItem(draftKey);
      } catch { /* La sauvegarde serveur reste disponible. */ }
    };
    store();
    const unload = (event: BeforeUnloadEvent) => {
      if (dirty) { event.preventDefault(); event.returnValue = ''; }
    };
    window.addEventListener('beforeunload', unload);
    return () => window.removeEventListener('beforeunload', unload);
  }, [baseline, company, dirty, draftKey, history.current, starting, version]);

  useEffect(() => {
    const element = paper.current;
    if (!element) return;
    function check() {
      if (!element) return;
      const sheets = [...element.querySelectorAll<HTMLElement>('[data-document-engine] > [data-document-page]')];
      setOverflow(sheets.some(sheet => sheet.scrollHeight > sheet.clientHeight + 2 || sheet.scrollWidth > sheet.clientWidth + 2
        || [...sheet.querySelectorAll<HTMLElement>('th,td,dt,dd')].some(cell => cell.scrollWidth > cell.clientWidth + 2)));
    }
    const observer = new ResizeObserver(check);
    observer.observe(element);
    check();
    document.fonts?.addEventListener('loadingdone', check);
    return () => { observer.disconnect(); document.fonts?.removeEventListener('loadingdone', check); };
  }, [layout, data, zoom, starting]);

  async function save() {
    if (saving || preparingLogo || !wide || starting || !company) return;
    if (!name.trim() || /[<>]/.test(name) || Object.values(layout.labels).some(text => /[<>]/.test(text))) {
      setError('Vérifiez le nom et les libellés. Le texte entre chevrons est refusé.');
      return;
    }
    if (performance.now() - lastSave.current < 1000) {
      setNotice('Patientez un instant avant de réenregistrer.');
      return;
    }
    lastSave.current = performance.now();
    setSaving(true); setError(''); setNotice('');
    try {
      let payload = layout;
      const logo = layout.logo;
      if (logo?.assetUrl.startsWith('data:')) {
        const url = uploadedLogos.current.get(logo.assetUrl) ?? await uploadDocumentLogo(logo.assetUrl);
        uploadedLogos.current.set(logo.assetUrl, url);
        payload = { ...layout, logo: { ...logo, assetUrl: url } };
      }
      const saved = await savePayslipLayout(name.trim(), payload);
      const next = { name: saved.name, layout: saved.config };
      dispatch({ type: 'replace', draft: next });
      setSavedDraft(next);
      setBaseline(JSON.stringify(next));
      setVersion(saved.version);
      setNotice('Modèle enregistré.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enregistrement impossible.');
    } finally { setSaving(false); }
  }

  function leave() {
    if (saving || (dirty && !window.confirm('Quitter avec des modifications non enregistrées ? Votre brouillon reste sur cet appareil.'))) return;
    router.push(gallery);
  }

  function onKeys(event: KeyboardEvent<HTMLElement>) {
    if (event.defaultPrevented) return;
    const command = event.ctrlKey || event.metaKey;
    if (event.key === 'Escape') {
      event.preventDefault();
      if (starting) leave();
      else if (labelEdit) setLabelEdit(undefined);
      else if (preview) setPreview(false);
      else leave();
    } else if (command && event.key.toLowerCase() === 's') {
      event.preventDefault(); void save();
    } else if (!(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement)) {
      if (command && ['z', 'y'].includes(event.key.toLowerCase())) {
        event.preventDefault();
        dispatch({ type: event.shiftKey || event.key.toLowerCase() === 'y' ? 'redo' : 'undo' });
      } else if (selected && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault();
        const backwards = event.key === 'ArrowUp' || event.key === 'ArrowLeft';
        const other = blocks[blocks.indexOf(selected) + (backwards ? -1 : 1)];
        if (other) dispatch({ type: 'move', id: selected.id, target: other.id,
          side: event.key === 'ArrowLeft' ? 'left' : event.key === 'ArrowRight' ? 'right' : backwards ? 'before' : 'after' });
      }
    }
  }

  function targetDrop(event: DragEvent) {
    const target = (event.target as HTMLElement).closest<HTMLElement>('[data-document-block], [data-structure-block]');
    const id = target?.dataset.documentBlock ?? target?.dataset.structureBlock;
    if (!target || !id || !event.dataTransfer.types.includes(blockMime)) return;
    event.preventDefault();
    const bounds = target.getBoundingClientRect();
    const relative = (event.clientX - bounds.left) / bounds.width;
    const side = !target.dataset.documentBlock || (relative > 0.23 && relative < 0.77)
      ? (event.clientY < bounds.top + bounds.height / 2 ? 'before' : 'after') : (relative < 0.5 ? 'left' : 'right');
    return { id, side } as const;
  }

  function resize(event: PointerEvent<HTMLButtonElement>, dimension: 'width' | 'height', block: Block, column?: string) {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const x = event.clientX, y = event.clientY;
    const control = event.currentTarget;
    const width = paper.current?.querySelector(`[data-document-block="${CSS.escape(block.id)}"]`)?.getBoundingClientRect().width ?? 400;
    const height = paper.current?.querySelector(`[data-document-block="${CSS.escape(block.id)}"]`)?.getBoundingClientRect().height ?? 300;
    function finish(end: globalThis.PointerEvent) {
      if (column) {
        const config = tableSettings(block);
        const current = config.columns.find(item => item.key === column);
        if (current) dispatch({ type: 'table', patch: { columns: resizeColumn(config.columns, column, current.widthPct + (end.clientX - x) * 100 / width) } });
      } else if (dimension === 'height') {
        const mm = (height + end.clientY - y) / (96 / 25.4 * zoom / 100);
        dispatch({ type: 'block', id: block.id, patch: {
          heightMm: Math.min(250, Math.max(0, Math.round(mm))), config: { ...block.config, fill: 'content' },
        } });
      } else {
        const next = blocks.find(other => other.row === block.row && other.col > block.col);
        const max = (next?.col ?? 13) - block.col;
        dispatch({ type: 'block', id: block.id, patch: { span: Math.max(1, Math.min(max,
          Math.round(block.span + (end.clientX - x) * block.span / width))) } });
      }
    }
    control.addEventListener('pointerup', finish, { once: true });
    control.addEventListener('pointercancel', () => control.removeEventListener('pointerup', finish), { once: true });
  }

  async function chooseReal() {
    if (choices || realLoading) return;
    setRealLoading(true); setError('');
    try {
      const result = await api.get<PayrollChoice[] | { data: PayrollChoice[] }>('/payrolls?limit=50');
      setChoices((Array.isArray(result) ? result : result.data ?? []).filter(item =>
        !isFactureContract(item.employee?.contractType) && (!item.companyId || item.companyId === companyId)));
    } catch { setError('Impossible de lister les bulletins de votre entreprise.'); }
    finally { setRealLoading(false); }
  }

  useEffect(() => {
    let active = true;
    if (!payrollId) { setRealData(undefined); setRealLoading(false); return; }
    setRealLoading(true);
    api.get<PayslipData>(`/payrolls/${encodeURIComponent(payrollId)}`).then(payroll => {
      if ((payroll.company.id ?? payroll.companyId) !== companyId) throw new Error('Entreprise inaccessible.');
      if (active) setRealData(buildContext('PAYSLIP', payroll));
    }).catch(() => { if (active) { setRealData(undefined); setError('Ce bulletin n’est pas accessible.'); } })
      .finally(() => { if (active) setRealLoading(false); });
    return () => { active = false; };
  }, [companyId, payrollId]);

  async function copyCurrent() {
    if (savedDraft) {
      if (dirty && !window.confirm('Remplacer le brouillon par une copie du modèle enregistré ?')) return;
      dispatch({ type: 'replace', draft: { ...savedDraft, name: 'Copie de mon modèle' } });
      setStarting(false);
      return;
    }
    if (dirty && !window.confirm('Remplacer le brouillon par une copie du modèle historique ?')) return;
    setError('');
    try {
      const result = await api.get<{ config?: Partial<BulletinTemplateConfig> & { canvasLayout?: CanvasLayout } }>('/companies/bulletin-template');
      dispatch({ type: 'replace', draft: copyLegacyTemplate(result.config, company?.logo) });
      setStarting(false);
      setNotice('Les couleurs, la typographie et les options compatibles de l’ancien modèle ont été reprises.');
    } catch { setError('Impossible de récupérer le modèle historique.'); }
  }

  const edit = wide && !preview && !starting && !saving;
  return <main ref={editorRoot} className={styles.editor} onKeyDown={onKeys} tabIndex={-1}>
    <h1 className="sr-only">Éditeur de bulletin de paie</h1>
    <header className={styles.toolbar}>
      <button type="button" onClick={leave}><ArrowLeft size={17} /> Retour</button>
      <button type="button" onClick={leave} aria-label="Quitter vers Documents"><img src="/icons/konza-icon.svg" alt="" width={22} height={22} /></button>
      <input aria-label="Nom du modèle" maxLength={80} value={name} disabled={!edit} onChange={e => dispatch({ type: 'name', name: e.target.value })} />
      {wide && <div className={styles.tools}>
        <button type="button" aria-label="Annuler" disabled={!edit || !history.past.length} onClick={() => dispatch({ type: 'undo' })}><Undo2 size={17} /></button>
        <button type="button" aria-label="Rétablir" disabled={!edit || !history.future.length} onClick={() => dispatch({ type: 'redo' })}><Redo2 size={17} /></button>
        <label>Zoom <select value={zoom} onChange={e => setZoom(Number(e.target.value))}>{[50, 65, 75, 90, 100, 125, 150].map(value => <option key={value} value={value}>{value} %</option>)}</select></label>
        <button type="button" aria-pressed={preview} disabled={starting || !company} onClick={() => setPreview(!preview)}>{preview ? 'Revenir à l’édition' : 'Aperçu'}</button>
        {preview && <button type="button" onClick={() => printBulletin('editor-document')}><Printer size={16} /> Imprimer</button>}
        <button type="button" className={styles.primary} disabled={saving || preparingLogo || starting || !company} onClick={() => void save()}><Save size={16} /> {saving ? 'Enregistrement…' : 'Enregistrer'}</button>
      </div>}
    </header>
    {error && <p className={styles.warning} role="alert">{error} {!company && <button type="button" onClick={() => { setError(''); setAttempt(value => value + 1); }}>Réessayer</button>}</p>}
    {notice && <p className={styles.notice} role="status">{notice}</p>}
    {!company && !error && <p className={styles.notice} role="status">Chargement du modèle…</p>}
    {!wide && <p className={styles.notice}>Sur mobile, le bulletin est en lecture seule. Utilisez un écran d’au moins 1 024 px pour modifier le modèle.</p>}
    {company && starting && wide ? <section className={styles.start}>
      <h2>Choisir un point de départ</h2>
      <div className={styles.intros}>
        {payslipPresets.map(preset => <button key={preset.id} type="button" onClick={() => {
          dispatch({ type: 'replace', draft: { name: preset.name, layout: createPayslipLayout(preset.id) } });
          setStarting(false);
        }}>{preset.name}</button>)}
        <button type="button" onClick={() => void copyCurrent()}>Copier mon modèle actuel</button>
      </div>
    </section> : company && <div className={styles.workspace}>
      {edit && <aside className={styles.panel} data-open={left} aria-label="Structure du bulletin">
        <button type="button" aria-expanded={left} onClick={() => setLeft(!left)}><PanelLeftClose size={17} />{left && ' Structure'}</button>
        {left && <>
          <div className={styles.panelBody}>
            <h2>Ajouter un bloc</h2>
            {(['freeText', 'divider', 'spacer', 'signatures', 'meta'] as const).map(type => (
              <button key={type} type="button" disabled={blocks.length >= 60 || ['signatures', 'meta'].includes(type) && blocks.some(block => block.type === type)} onClick={() => {
                const id = crypto.randomUUID();
                const original = createPayslipLayout().blocks.find(block => block.type === type);
                const block: Block = { id, type, row: blocks.length + 1, col: 1, span: 12, visible: true,
                  config: original?.config ?? (type === 'freeText' ? { text: 'Votre texte' } : {}),
                  ...(type === 'spacer' ? { heightMm: 5 } : {}) };
                dispatch({ type: 'add', block }); select(id);
              }}>{blockNames[type]}</button>
            ))}
          </div>
          <ol className={styles.structure} onDragOver={event => { const next = targetDrop(event); if (next) setDrop(next); }}
            onDrop={event => { const next = targetDrop(event); if (next) dispatch({ type: 'move', side: next.side, target: next.id, id: event.dataTransfer.getData(blockMime) }); setDrop(undefined); }}>
            {blocks.map(block => <li key={block.id} data-structure-block={block.id} data-drop={drop?.id === block.id ? drop.side : undefined} data-selected={block.id === selectedId}>
              <button type="button" draggable onDragStart={event => event.dataTransfer.setData(blockMime, block.id)} onDragEnd={() => setDrop(undefined)} onClick={() => select(block.id)}>
                {blockNames[block.type] ?? block.type}{block.locked ? ' · Verrouillé' : ''}
              </button>
              <input type="checkbox" aria-label={`Afficher ${blockNames[block.type]}`} checked={block.visible} disabled={block.locked}
                onChange={event => dispatch({ type: 'block', id: block.id, patch: { visible: event.target.checked } })} />
            </li>)}
          </ol>
        </>}
      </aside>}
      <section className={styles.center}>
        {wide && <div className={styles.previewTools}>
          <button type="button" onClick={() => void chooseReal()}>Données réelles</button>
          {choices && <select aria-label="Bulletin d’aperçu" value={payrollId} onChange={event => { setRealData(undefined); setPayrollId(event.target.value); }}>
            <option value="">Données d’exemple</option>
            {choices.map(item => <option key={item.id} value={item.id}>{item.employee?.firstName} {item.employee?.lastName} · {String(item.month).padStart(2, '0')}/{item.year}</option>)}
          </select>}
          {realLoading && <span role="status">Chargement…</span>}
          {choices?.length === 0 && <span>Aucun bulletin disponible.</span>}
          {overflow && <span role="alert">Le contenu dépasse la page. Réduisez les marges ou la taille du texte.</span>}
          {overflow && edit && <button type="button" onClick={() => dispatch({ type: 'layout', patch: {
            page: { ...layout.page, marginsMm: {
              top: Math.min(8, layout.page.marginsMm.top), right: Math.min(8, layout.page.marginsMm.right),
              bottom: Math.min(8, layout.page.marginsMm.bottom), left: Math.min(8, layout.page.marginsMm.left),
            } },
            tokens: { ...layout.tokens, sizeBasePt: 8 },
          } })}>Réduire les marges et le texte</button>}
        </div>}
        <div ref={paper} id="editor-document" className={styles.paper} data-editing={edit}
          data-drop-side={drop?.side}
          style={{ zoom: wide ? zoom / 100 : Math.min(0.5, (viewport - 6) / (layout.page.orientation === 'landscape' ? 1123 : 794)) }}
          onClick={event => {
            if (!edit) return;
            const block = (event.target as HTMLElement).closest<HTMLElement>('[data-document-block]');
            select(block?.dataset.documentBlock);
          }}
          onDoubleClick={event => {
            if (!edit) return;
            const element = (event.target as HTMLElement).closest<HTMLElement>('[data-label-key]');
            if (!element?.dataset.labelKey) return;
            const bounds = element.getBoundingClientRect();
            setLabelEdit({ key: element.dataset.labelKey, text: element.textContent ?? '', x: bounds.left, y: bounds.top, width: Math.max(160, bounds.width) });
          }}
          onDragEnd={() => { setDrop(undefined); setRowDrop(undefined); }}
          onDragOver={event => {
            if (!edit) return;
            const row = (event.target as HTMLElement).closest<HTMLElement>('[data-payroll-row]');
            if (row && event.dataTransfer.types.includes(rowMime)) {
              event.preventDefault();
              setRowDrop(row.dataset.payrollRow);
            } else {
              const next = targetDrop(event);
              if (next) setDrop(next);
            }
          }}
          onDrop={event => {
            if (!edit) return;
            const row = (event.target as HTMLElement).closest<HTMLElement>('[data-payroll-row]');
            const table = blocks.find(block => block.type === 'table');
            if (row?.dataset.payrollRow && table && event.dataTransfer.types.includes(rowMime)) {
              event.preventDefault();
              const box = row.getBoundingClientRect();
              const command = movePayrollRow(tableSettings(table), data.items, event.dataTransfer.getData(rowMime),
                row.dataset.payrollRow, event.clientY > box.top + box.height / 2);
              if (command) dispatch(command);
            } else {
              const next = targetDrop(event);
              if (next) dispatch({ type: 'move', target: next.id, side: next.side, id: event.dataTransfer.getData(blockMime) });
            }
            setDrop(undefined); setRowDrop(undefined);
          }}>
          <Canvas layout={displayLayout} data={data} editing={edit} selected={selected} drop={drop?.id} rowDrop={rowDrop} onResize={resize} />
        </div>
      </section>
      {edit && <aside className={styles.panel} data-open={right} aria-label="Inspecteur">
        <button type="button" aria-expanded={right} onClick={() => setRight(!right)}><PanelRightClose size={17} />{right && ' Inspecteur'}</button>
        {right && <Inspector layout={layout} block={selected} data={data} companyLogo={company.logo} dispatch={dispatch} onError={setError}
          importing={preparingLogo} onImporting={setPreparingLogo}
          onUnselect={() => select(undefined)} onCopy={() => void copyCurrent()} onReset={() => {
            if (window.confirm('Rétablir les réglages du design de départ ?')) {
              dispatch({ type: 'replace', draft: { name, layout: createPayslipLayout(layout.basePreset as PayslipPreset) } });
              select(undefined);
            }
          }} rowMime={rowMime} />}
      </aside>}
    </div>}
    {labelEdit && <input className={styles.inlineLabel} aria-label="Renommer le libellé" autoFocus maxLength={80} value={labelEdit.text}
      style={{ left: labelEdit.x, top: labelEdit.y, width: labelEdit.width }} onChange={event => setLabelEdit({ ...labelEdit, text: event.target.value })}
      onBlur={() => { dispatch({ type: 'label', key: labelEdit.key, text: labelEdit.text }); setLabelEdit(undefined); }}
      onFocus={event => event.target.select()} onKeyDown={event => {
        if (event.key === 'Enter') event.currentTarget.blur();
        if (event.key === 'Escape') { event.preventDefault(); setLabelEdit(undefined); }
      }} />}
  </main>;
}

function Canvas({ layout, data, editing, selected, drop, rowDrop, onResize }: {
  layout: DocLayout; data: DocumentContext; editing: boolean; selected?: Block; drop?: string; rowDrop?: string;
  onResize: (event: PointerEvent<HTMLButtonElement>, dimension: 'width' | 'height', block: Block, column?: string) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [handles, setHandles] = useState<{ x: number; y: number; type: 'width' | 'height'; column?: string }[]>([]);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const refresh = () => {
      element.querySelectorAll<HTMLElement>('[data-document-block]').forEach(block => {
        block.dataset.active = String(block.dataset.documentBlock === selected?.id);
        block.dataset.target = String(block.dataset.documentBlock === drop);
        block.draggable = editing;
      });
      element.querySelectorAll<HTMLElement>('[data-payroll-row]').forEach(row => {
        row.dataset.target = String(row.dataset.payrollRow === rowDrop);
      });
      const active = (selected && editing) ? element.querySelector<HTMLElement>(`[data-document-block="${CSS.escape(selected.id)}"]`) : null;
      if (!active) { setHandles(previous => previous.length ? [] : previous); return; }
      const parent = element.getBoundingClientRect();
      const scale = parent.width / element.offsetWidth || 1;
      const bounds = active.getBoundingClientRect();
      const handle = (rect: DOMRect, type: 'width' | 'height', column?: string) => ({
        x: ((type === 'width' ? rect.right : rect.left + rect.width / 2) - parent.left) / scale,
        y: ((type === 'width' ? rect.top + rect.height / 2 : rect.bottom) - parent.top) / scale, type, column,
      });
      const next = [handle(bounds, 'width')];
      if (selected?.type === 'table') {
        next.push(handle(bounds, 'height'));
        active.querySelectorAll<HTMLElement>('[data-column-key]').forEach(cell => next.push(handle(cell.getBoundingClientRect(), 'width', cell.dataset.columnKey)));
      }
      setHandles(previous => JSON.stringify(previous) === JSON.stringify(next) ? previous : next);
    };
    const observer = new ResizeObserver(refresh);
    observer.observe(element);
    refresh();
    document.fonts?.addEventListener('loadingdone', refresh);
    return () => { observer.disconnect(); document.fonts?.removeEventListener('loadingdone', refresh); };
  }, [data, layout, editing, selected, drop, rowDrop]);
  return <div className={styles.canvas} ref={root} onDragStart={event => {
    const row = (event.target as HTMLElement).closest<HTMLElement>('[data-payroll-row]');
    if (row?.dataset.payrollRow) { event.dataTransfer.setData(rowMime, row.dataset.payrollRow); return; }
    const block = (event.target as HTMLElement).closest<HTMLElement>('[data-document-block]');
    if (block?.dataset.documentBlock) event.dataTransfer.setData(blockMime, block.dataset.documentBlock);
  }}>
    <DocumentRenderer docType="PAYSLIP" layout={layout} data={data} editing={editing} />
    {selected && editing && handles.map(({ x, y, type, column }) =>
      <button key={column ?? type} type="button" className={styles.handle} data-dimension={type}
        style={{ left: x, top: y }} aria-label={column ? `Redimensionner la colonne ${column}` : type === 'width' ? 'Redimensionner le bloc' : 'Étirer le tableau'}
        onClick={event => event.stopPropagation()} onPointerDown={event => onResize(event, type, selected, column)} />)}
  </div>;
}
