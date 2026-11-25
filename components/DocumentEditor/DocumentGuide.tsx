'use client';

import { useCallback, useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { tourSteps, type TourGesture, type TourSignal } from '@/lib/document-engine/tour-steps';
import styles from './guide.module.css';

type Mode = 'live' | 'watch';
type Spot = { x: number; y: number; width: number; height: number };
type Point = { x: number; y: number };

const editor = (mode: Mode) => document.querySelector<HTMLElement>(`[data-guide-scope="${mode}"] main`);
function target(root: HTMLElement | null, id: string, reveal = false) {
  const candidates = [...(root?.querySelectorAll<HTMLElement>('[data-tour]') ?? [])]
    .filter(element => element.dataset.tour === id);
  if (reveal) {
    const details = candidates[0]?.closest('details');
    if (details && !details.open) details.open = true;
  }
  return candidates.find(element => element.getClientRects().length > 0);
}

function position(element: HTMLElement): Spot {
  const rect = element.getBoundingClientRect();
  const x = Math.max(0, rect.left - 4);
  const y = Math.max(0, rect.top - 4);
  return { x, y, width: Math.max(0, Math.min(innerWidth, rect.right + 4) - x),
    height: Math.max(0, Math.min(innerHeight, rect.bottom + 4) - y) };
}

function sleep(ms: number, signal: AbortSignal) {
  return new Promise<void>(resolve => {
    if (signal.aborted) return resolve();
    const timer = window.setTimeout(done, ms);
    function done() { clearTimeout(timer); signal.removeEventListener('abort', done); resolve(); }
    signal.addEventListener('abort', done, { once: true });
  });
}

async function findTarget(root: HTMLElement, id: string, signal: AbortSignal) {
  for (let attempt = 0; attempt < 60 && !signal.aborted; attempt++) {
    const element = target(root, id, true);
    if (element) return element;
    await sleep(40, signal);
  }
  if (!signal.aborted) throw new Error(`L’action « ${id} » est indisponible dans l’éditeur.`);
}

function setValue(element: HTMLInputElement | HTMLSelectElement, value: string) {
  const prototype = element instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, 'value')?.set?.call(element, value);
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

async function exampleLogo() {
  const canvas = document.createElement('canvas');
  canvas.width = 180;
  canvas.height = 64;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Le logo de démonstration est indisponible.');
  context.fillStyle = '#154d3b';
  context.fillRect(0, 0, 180, 64);
  context.fillStyle = '#ffffff';
  context.font = 'bold 22px sans-serif';
  context.fillText('KONZA TECH', 17, 40);
  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Le logo de démonstration est indisponible.');
  return new File([blob], 'logo-exemple.png', { type: 'image/png' });
}

async function runGesture(root: HTMLElement, element: HTMLElement, gesture: TourGesture, signal: AbortSignal) {
  switch (gesture.action) {
    case 'click': element.click(); break;
    case 'dblclick': element.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })); break;
    case 'type':
      setValue(element as HTMLInputElement, gesture.value);
      await sleep(60, signal);
      if (!signal.aborted) element.blur();
      break;
    case 'select': setValue(element as HTMLInputElement | HTMLSelectElement, gesture.value); break;
    case 'drag': root.dispatchEvent(new CustomEvent('document-guide-drag', { detail: gesture })); break;
    case 'file': {
      const input = element as HTMLInputElement;
      const file = await exampleLogo();
      if (signal.aborted) return;
      const transfer = new DataTransfer();
      transfer.items.add(file);
      input.files = transfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
}

export default function DocumentGuide({ userId, onWatch, onClose, sandbox }: {
  userId: string; onWatch: (watching: boolean) => void; onClose: () => void; sandbox: ReactNode;
}) {
  const [mode, setMode] = useState<Mode>('live');
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [minimized, setMinimized] = useState(false);
  const [moved, setMoved] = useState<Point>();
  const [spot, setSpot] = useState<Spot>();
  const [cursor, setCursor] = useState<Point>();
  const [seen, setSeen] = useState<TourSignal[]>([]);
  const [finished, setFinished] = useState<Mode>();
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState(false);
  const panel = useRef<HTMLElement>(null);
  const partial = useRef({ gesture: 0, index: -1 });
  const completionKey = `konza:document-tour:${userId}`;
  const step = tourSteps[index];
  const watching = mode === 'watch';

  useEffect(() => {
    try { setCompleted(localStorage.getItem(completionKey) === '1'); } catch { /* storage unavailable */ }
  }, [completionKey]);

  const jump = useCallback((next: number) => {
    partial.current = { gesture: 0, index: -1 };
    setSeen([]); setIndex(next); setFinished(undefined); setError(''); setSpot(undefined); setCursor(undefined);
  }, []);

  function switchMode(next: Mode) {
    if (next === mode && !finished) return;
    partial.current = { gesture: 0, index: -1 };
    setSeen([]); setFinished(undefined); setError(''); setCursor(undefined); setSpot(undefined);
    setMode(next); onWatch(next === 'watch'); setPlaying(next === 'watch');
  }

  const complete = useCallback((done: Mode) => {
    setPlaying(false); setFinished(done); setCursor(undefined); setSpot(undefined);
    setCompleted(true); onWatch(false);
    try { localStorage.setItem(completionKey, '1'); } catch { /* storage unavailable */ }
  }, [completionKey, onWatch]);

  const next = useCallback(() => {
    if (index === tourSteps.length - 1) complete(mode);
    else jump(index + 1);
  }, [complete, index, jump, mode]);

  useEffect(() => {
    if (finished) return;
    const root = editor(mode);
    if (!root) return;
    root.dispatchEvent(new CustomEvent('document-guide-prepare', { detail: step.params.reveal }));
  }, [finished, mode, step]);

  useEffect(() => {
    const root = watching ? editor('watch') : null;
    function escape(event: KeyboardEvent) {
      if (event.key === 'Escape' && !(event.target instanceof HTMLElement && event.target.dataset.tour === 'label-input')) {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    }
    root?.addEventListener('document-guide-exit', onClose);
    window.addEventListener('keydown', escape, true);
    return () => { root?.removeEventListener('document-guide-exit', onClose); window.removeEventListener('keydown', escape, true); };
  }, [watching, finished, onClose]);

  useEffect(() => {
    if (finished || watching) return;
    const root = editor('live');
    if (!root) return;
    function observe(event: Event) {
      const name = (event as CustomEvent<TourSignal>).detail;
      if (step.waitFor.includes(name)) setSeen(current => current.includes(name) ? current : [...current, name]);
    }
    root.addEventListener('document-guide-signal', observe);
    return () => root.removeEventListener('document-guide-signal', observe);
  }, [finished, step, watching]);

  useEffect(() => {
    if (!finished && !watching && step.waitFor.every(signal => seen.includes(signal))) next();
  }, [seen, step, finished, watching, next]);

  useEffect(() => {
    if (finished || (watching && playing)) return;
    const root = editor(mode);
    if (!root) return;
    let last: HTMLElement | undefined;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const alternative = step.params.nextTarget && (step.waitFor.length === 1 || seen.length > 0)
          ? target(root, step.params.nextTarget) : undefined;
        const found = alternative ?? target(root, step.target, true);
        if (found && found !== last) {
          last = found;
          found.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
        }
        setSpot(found ? position(found) : undefined);
      });
    };
    const observer = new MutationObserver(update);
    observer.observe(root, { subtree: true, childList: true, attributes: true });
    const geometry = new ResizeObserver(update);
    geometry.observe(root);
    window.addEventListener('resize', update);
    document.addEventListener('scroll', update, true);
    update();
    return () => {
      cancelAnimationFrame(frame); observer.disconnect(); geometry.disconnect();
      window.removeEventListener('resize', update);
      document.removeEventListener('scroll', update, true);
    };
  }, [finished, mode, playing, seen, step, watching]);

  useEffect(() => {
    if (finished || !watching || !playing) return;
    const root = editor('watch');
    if (!root) return;
    const abort = new AbortController();
    const { signal } = abort;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const beat = (ms: number) => sleep((reduced ? Math.min(280, ms) : ms) / speed, signal);
    function point(element: HTMLElement) {
      element.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
      const box = position(element);
      setSpot(box);
      setCursor({ x: box.x + box.width / 2, y: box.y + box.height / 2 });
    }
    async function play() {
      if (!root) return;
      if (partial.current.index !== index) partial.current = { gesture: 0, index };
      for (let offset = partial.current.gesture; offset < step.params.gestures.length && !signal.aborted; offset++) {
        const gesture = step.params.gestures[offset];
        const element = await findTarget(root, gesture.target, signal);
        if (!element) return;
        point(element);
        await beat(520);
        if (gesture.action === 'drag' && !signal.aborted) {
          const destination = await findTarget(root, gesture.to, signal);
          if (!destination) return;
          point(destination);
          await beat(430);
        }
        if (signal.aborted) return;
        await runGesture(root, element, gesture, signal);
        if (signal.aborted) return;
        partial.current.gesture = offset + 1;
        await beat(340);
      }
      await beat(500);
      if (!signal.aborted) next();
    }
    play().catch(err => {
      if (!signal.aborted) { setError(err instanceof Error ? err.message : 'La démonstration a été interrompue.'); setPlaying(false); }
    });
    return () => abort.abort();
  }, [finished, index, playing, speed, step, watching, next]);

  function drag(event: PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) return;
    const box = panel.current?.getBoundingClientRect();
    if (!box) return;
    const button = event.currentTarget;
    const dx = event.clientX - box.left;
    const dy = event.clientY - box.top;
    button.setPointerCapture(event.pointerId);
    function move(next: globalThis.PointerEvent) {
      setMoved({ x: Math.max(0, Math.min(innerWidth - box!.width, next.clientX - dx)),
        y: Math.max(0, Math.min(innerHeight - box!.height, next.clientY - dy)) });
    }
    function stop() { button.removeEventListener('pointermove', move); button.removeEventListener('lostpointercapture', stop); }
    button.addEventListener('pointermove', move);
    button.addEventListener('lostpointercapture', stop);
  }

  return <>
    {watching && !finished && <div data-guide-scope="watch">{sandbox}</div>}
    {!finished && spot && <div aria-hidden="true" className={styles.spot}
      style={{ left: spot.x, top: spot.y, width: spot.width, height: spot.height }} />}
    {!finished && watching && cursor && <svg aria-hidden="true" className={styles.cursor} data-guide-cursor="" data-playing={playing}
      style={{ left: cursor.x, top: cursor.y, transitionDuration: `${340 / speed}ms` }} width="23" height="29" viewBox="0 0 23 29">
      <path d="M2 1.5v21l5.5-5 4 8 3.7-2-4-7.8h8z" fill="#14533f" stroke="white" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>}
    <aside ref={panel} className={styles.panel} aria-label="Guide du bulletin"
      style={moved ? { left: moved.x, top: moved.y, bottom: 'auto' } : spot && spot.x < innerWidth / 2 ? { right: 16 } : { left: 16 }}>
      <header>
        <button type="button" className={styles.grip} title="Déplacer le guide avec la souris ou les flèches"
          aria-label="Déplacer le guide" onPointerDown={drag} onKeyDown={event => {
            const directions: Partial<Record<string, [number, number]>> = {
              ArrowLeft: [-20, 0], ArrowRight: [20, 0], ArrowUp: [0, -20], ArrowDown: [0, 20],
            };
            const delta = directions[event.key];
            const box = panel.current?.getBoundingClientRect();
            if (!delta || !box) return;
            event.preventDefault();
            setMoved({ x: Math.max(0, Math.min(innerWidth - box.width, box.left + delta[0])),
              y: Math.max(0, Math.min(innerHeight - box.height, box.top + delta[1])) });
          }}>⠿</button>
        <strong data-guide-step={finished ? 'complete' : step.id}>{finished ? 'Guide terminé' : `Étape ${index + 1} / ${tourSteps.length}`}</strong>
        <button type="button" aria-label={minimized ? 'Agrandir le guide' : 'Réduire le guide'} onClick={() => setMinimized(!minimized)}>{minimized ? '+' : '−'}</button>
        <button type="button" aria-label="Fermer le guide" onClick={onClose}>×</button>
      </header>
      {!minimized && <>
        <div className={styles.controls}>
          <button type="button" aria-pressed={!watching && !finished} onClick={() => { if (finished) jump(0); switchMode('live'); }}>À vous</button>
          <button type="button" aria-pressed={watching && !finished} onClick={() => { if (finished) jump(0); switchMode('watch'); }}>Regarder</button>
          <label><span className="sr-only">Choisir une étape</span><select aria-label="Choisir une étape" value={index}
            onChange={event => { if (finished) switchMode('live'); jump(Number(event.target.value)); }}>
            {tourSteps.map((entry, position) => <option key={entry.id} value={position}>{position + 1}. {entry.title}</option>)}
          </select></label>
        </div>
        {finished ? <p role="status">{finished === 'watch' ? 'Démonstration terminée. Votre modèle est de nouveau affiché.' : 'Vous avez terminé le guide.'}</p>
          : <p aria-live="polite">{step.caption}</p>}
        {!finished && watching && <p className={styles.example}>Modèle d’exemple. Les actions sont simulées.</p>}
        {!finished && error && <p role="alert">{error}</p>}
        {finished ? <button type="button" onClick={() => { jump(0); switchMode('live'); }}>Recommencer le guide</button>
          : <div className={styles.controls}>
            <button type="button" disabled={!index} onClick={() => jump(index - 1)}>Précédent</button>
            {watching ? <>
              <button type="button" onClick={() => setPlaying(!playing)}>{playing ? 'Pause' : 'Lecture'}</button>
              <button type="button" onClick={next}>Suivant</button>
              <label><span className="sr-only">Vitesse</span><select aria-label="Vitesse" value={speed} onChange={event => setSpeed(Number(event.target.value))}>
                {[0.5, 1, 1.5, 2].map(value => <option key={value} value={value}>{String(value).replace('.', ',')}×</option>)}
              </select></label>
            </> : <button type="button" onClick={next}>Passer</button>}
          </div>}
        {completed && !finished && <span className="sr-only">Guide déjà terminé</span>}
        {!watching && <Link href="/aide/modeles-documents" className="text-xs underline" target="_blank" rel="noopener">Tutoriels vidéo</Link>}
      </>}
    </aside>
  </>;
}
