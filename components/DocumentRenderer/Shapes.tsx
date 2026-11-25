'use client';
import { createContext, useContext, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { Block, DocumentShape } from '@/types/document-layout';
import styles from './shapes.module.css';
const ShapeContext = createContext<{ shapes: DocumentShape[]; blocks: Block[]; selected?: string; select: (id?: string) => void; change?: (shapes: DocumentShape[]) => void }>({ shapes: [], blocks: [], select: () => {} });
export function ShapeProvider({ shapes = [], blocks, change, children }: { shapes?: DocumentShape[]; blocks: Block[]; change?: (shapes: DocumentShape[]) => void; children: ReactNode }) {
  const [selected, select] = useState<string>();
  return <ShapeContext.Provider value={{ shapes, blocks, change, selected, select }}>{children}</ShapeContext.Provider>;
}
export function newSeparator(anchor = 'page'): DocumentShape {
  return { id: crypto.randomUUID(), anchor, x: 10, y: 50, width: 30, thickness: .75, color: '#222222', style: 'solid' };
}
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
export default function Shapes({ anchor }: { anchor: string }) {
  const context = useContext(ShapeContext);
  return <>{context.shapes.filter(shape => shape.anchor === anchor).map(shape => <Shape key={shape.id} shape={shape} />)}</>;
}
function Shape({ shape }: { shape: DocumentShape }) {
  const { shapes, blocks, change, selected: selectedId, select } = useContext(ShapeContext);
  const ref = useRef<HTMLDivElement>(null);
  const selected = selectedId === shape.id;
  const setSelected = (value: boolean) => select(value ? shape.id : undefined);
  const [firstColumn, setFirstColumn] = useState(0);
  const [lastColumn, setLastColumn] = useState(0);
  const anchorBlock = blocks.find(block => block.id === shape.anchor);
  const columns = anchorBlock?.type === 'cumuls' ? anchorBlock.config.columns as { key: string; label: string; widthPct: number }[] : [];
  const [motion, setMotion] = useState<{ dx: number; dy: number; width?: number }>();
  function patch(value: Partial<DocumentShape>) {
    const next = { ...shape, ...value };
    next.width = clamp(next.width, .5, 100);
    next.x = clamp(next.x, 0, 100 - next.width);
    next.y = clamp(next.y, 0, 100);
    change?.(shapes.map(item => item.id === shape.id ? next : item));
  }
  function drag(event: PointerEvent<HTMLButtonElement>, resize = false) {
    if (!change || !ref.current) return;
    event.preventDefault(); event.stopPropagation(); setSelected(true);
    const button = event.currentTarget, parent = ref.current.parentElement!;
    const box = parent.getBoundingClientRect();
    const scale = box.width / parent.offsetWidth || 1;
    const startX = event.clientX, startY = event.clientY;
    const start = ref.current.getBoundingClientRect();
    button.setPointerCapture(event.pointerId);
    const move = (e: globalThis.PointerEvent) => {
      setMotion(resize ? { dx: 0, dy: 0, width: clamp(shape.width + (e.clientX - startX) / box.width * 100, .5, 100 - shape.x) }
        : { dx: (e.clientX - startX) / scale, dy: (e.clientY - startY) / scale });
    };
    const stop = (e: globalThis.PointerEvent) => {
      button.removeEventListener('pointermove', move); button.removeEventListener('pointerup', stop); button.removeEventListener('pointercancel', cancel);
      setMotion(undefined);
      if (resize) { patch({ width: shape.width + (e.clientX - startX) / box.width * 100 }); return; }
      const sheet = parent.closest<HTMLElement>('[data-document-page]');
      const target = document.elementsFromPoint(e.clientX, e.clientY)
        .filter(el => !el.closest('[data-shape]'))
        .map(el => el.closest<HTMLElement>('[data-shape-anchor]'))
        .find(el => el && el.closest('[data-document-page]') === sheet && !el.closest('[data-shape]')) ?? sheet;
      if (!target) return;
      const bounds = target.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      patch({ anchor: target.dataset.shapeAnchor ?? 'page',
        x: (start.left + e.clientX - startX - bounds.left) / bounds.width * 100,
        y: (start.top + start.height / 2 + e.clientY - startY - bounds.top) / bounds.height * 100,
        width: start.width / bounds.width * 100 });
    };
    const cancel = () => {
      setMotion(undefined); button.removeEventListener('pointermove', move); button.removeEventListener('pointerup', stop); button.removeEventListener('pointercancel', cancel);
    };
    button.addEventListener('pointermove', move); button.addEventListener('pointerup', stop); button.addEventListener('pointercancel', cancel);
  }
  return <div ref={ref} className={styles.shape} data-shape={shape.id} data-editable={!!change} style={{
    left: `${shape.x}%`, top: `${shape.y}%`, width: `${motion?.width ?? shape.width}%`,
    transform: motion ? `translate(${motion.dx}px, ${motion.dy}px)` : undefined,
  }} onClick={e => e.stopPropagation()} onDragStart={e => { e.preventDefault(); e.stopPropagation(); }}>
    <div className={styles.line} style={{ borderTop: `${shape.thickness}pt ${shape.style} ${shape.color}` }} />
    {change && <>
      <button className={styles.move} type="button" aria-label="Déplacer le séparateur libre" onPointerDown={e => drag(e)}
        onClick={() => setSelected(true)} onKeyDown={e => {
          if (e.key === 'Escape') setSelected(false);
          if (e.key === 'Delete') change(shapes.filter(item => item.id !== shape.id));
          const delta = e.shiftKey ? 5 : .5;
          if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
            e.preventDefault(); patch({ x: shape.x + (e.key === 'ArrowRight' ? delta : e.key === 'ArrowLeft' ? -delta : 0), y: shape.y + (e.key === 'ArrowDown' ? delta : e.key === 'ArrowUp' ? -delta : 0) });
          }
        }} />
      <button type="button" className={styles.handle} aria-label="Régler la longueur du séparateur" onPointerDown={e => drag(e, true)} />
      {selected && createPortal(<div className={styles.controls} style={{ position: 'fixed', top: 85, right: 20, left: 'auto', maxHeight: 'calc(100dvh - 110px)', overflow: 'auto', zIndex: 1000 }} onPointerDown={e => e.stopPropagation()}>
        <label>Zone<select aria-label="Zone du séparateur" value={shape.anchor} onChange={e => {
          const page = ref.current?.closest('[data-document-page]');
          const next = page?.querySelector<HTMLElement>('[data-shape-anchor="' + CSS.escape(e.target.value) + '"]') ?? (e.target.value === 'page' ? page as HTMLElement : null);
          const current = ref.current?.parentElement;
          patch({ anchor: e.target.value, x: 0, y: 50, width: next && current ? shape.width * current.offsetWidth / next.offsetWidth : shape.width });
        }}><option value="page">Page entière</option>{blocks.filter(block => block.visible).map(block => <option key={block.id} value={block.id}>{String(block.config.titre ?? block.config.title ?? ({ cumuls: 'Cumuls', signatures: 'Signatures', fieldGroup: 'Informations', table: 'Tableau', header: 'En-tête' } as Record<string,string>)[block.type] ?? block.type)}</option>)}</select></label>
        <label>Largeur (%)<input aria-label="Largeur du séparateur (%)" type="number" min="0.5" max="100" step="0.5" value={Math.round(shape.width * 100) / 100} onChange={e => patch({ width: Number(e.target.value) })} /></label>
        <label>Position X (%)<input aria-label="Position horizontale du séparateur" type="number" min="0" max={100 - shape.width} step=".5" value={Math.round(shape.x * 100) / 100} onChange={e => patch({ x: Number(e.target.value) })} /></label>
        <label>Position Y (%)<input aria-label="Position verticale du séparateur" type="number" min="0" max="100" step=".5" value={Math.round(shape.y * 100) / 100} onChange={e => patch({ y: Number(e.target.value) })} /></label>
        <label>Épaisseur (pt)<input type="number" min="0.25" max="12" step="0.25" value={shape.thickness} onChange={e => patch({ thickness: clamp(Number(e.target.value), .25, 12) })} /></label>
        <label>Couleur<input type="color" value={shape.color} onChange={e => patch({ color: e.target.value })} /></label>
        <select aria-label="Trait du séparateur" value={shape.style} onChange={e => patch({ style: e.target.value as DocumentShape['style'] })}><option value="solid">Continu</option><option value="dashed">Tirets</option></select>
        {!!columns.length && <>
          <label>De la colonne<select aria-label="Première colonne du séparateur" value={firstColumn} onChange={e => { setFirstColumn(Number(e.target.value)); setLastColumn(Math.max(lastColumn, Number(e.target.value))); }}>{columns.map((column, i) => <option key={column.key} value={i}>{column.label || 'Période'}</option>)}</select></label>
          <label>À la colonne<select aria-label="Dernière colonne du séparateur" value={lastColumn} onChange={e => setLastColumn(Number(e.target.value))}>{columns.map((column, i) => <option key={column.key} value={i} disabled={i < firstColumn}>{column.label || 'Période'}</option>)}</select></label>
          <button type="button" onClick={() => {
            const sum = columns.reduce((total, column) => total + column.widthPct, 0);
            patch({ x: columns.slice(0, firstColumn).reduce((total, column) => total + column.widthPct, 0) / sum * 100,
              width: columns.slice(firstColumn, lastColumn + 1).reduce((total, column) => total + column.widthPct, 0) / sum * 100 });
          }}>Ajuster à ces colonnes</button>
          <button type="button" onClick={() => {
            const parent = ref.current?.parentElement;
            const row = parent?.querySelector('tbody tr');
            if (parent && row) patch({ y: (row.getBoundingClientRect().bottom - parent.getBoundingClientRect().top) / parent.getBoundingClientRect().height * 100 });
          }}>Entre Mensuel et Annuel</button>
        </>}
        <button type="button" onClick={() => change(shapes.filter(item => item.id !== shape.id))}>Supprimer</button>
        <button type="button" onClick={() => setSelected(false)}>Fermer</button>
      </div>, document.body)}
    </>}
  </div>;
}
