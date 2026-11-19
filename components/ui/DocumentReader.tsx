'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Maximize2, Minus, Plus, Scan } from 'lucide-react';
import './document-reader.css';

/** A screen-only reading frame. Children keep their original print IDs and content. */
export function DocumentReader({ children, title = 'Aperçu du document', landscape = false, fitPage = false, initialZoom }: { children: React.ReactNode; title?: string; landscape?: boolean; fitPage?: boolean; initialZoom?: number }) {
  const root = useRef<HTMLElement>(null), viewport = useRef<HTMLDivElement>(null), paper = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0), [height, setHeight] = useState(0), [zoom, setZoom] = useState<number | null>(initialZoom ?? null);
  const [availableHeight, setAvailableHeight] = useState(0);
  const pageWidth = landscape ? 1123 : 794;
  useEffect(() => {
    const view = viewport.current, page = paper.current;
    if (!view || !page) return;
    const measure = () => { setWidth(view.clientWidth); setHeight(page.scrollHeight); setAvailableHeight(window.innerHeight * .72 - 32); };
    measure(); const observer = new ResizeObserver(measure); observer.observe(view); observer.observe(page);
    window.addEventListener('resize', measure);
    return () => { observer.disconnect(); window.removeEventListener('resize', measure); };
  }, [children]);
  const widthFit = width ? Math.min(1, Math.max(.1, (width - 32) / pageWidth)) : .6;
  const fit = fitPage && height && availableHeight ? Math.min(widthFit, availableHeight / height) : widthFit;
  const scale = zoom ?? fit;
  return <section ref={root} className="document-reader" aria-label={title}>
    <div className="document-reader-toolbar">
      <div><strong>{title}</strong><span>Document officiel · aperçu avant impression</span></div>
      <div className="document-reader-tools">
        <button type="button" aria-label="Réduire le zoom" disabled={scale <= .25} onClick={() => setZoom(Math.max(.25, scale - .1))}><Minus size={16} /></button>
        <output aria-live="polite">{Math.round(scale * 100)} %</output>
        <button type="button" aria-label="Augmenter le zoom" disabled={scale >= 1.5} onClick={() => setZoom(Math.min(1.5, scale + .1))}><Plus size={16} /></button>
        <button type="button" title={fitPage ? 'Voir la page entière' : 'Ajuster à la largeur'} aria-label={fitPage ? 'Afficher la page entière' : 'Ajuster le document à la largeur'} onClick={() => setZoom(null)}><Scan size={17} /></button>
        <button type="button" title="Plein écran — Échap pour quitter" aria-label="Afficher le document en plein écran" onClick={() => { if (document.fullscreenElement === root.current) void document.exitFullscreen?.(); else void root.current?.requestFullscreen?.().catch(() => {}); }}><Maximize2 size={17} /></button>
      </div>
    </div>
    <div ref={viewport} className="document-reader-scroll" tabIndex={0} role="region" aria-label="Document — défilement horizontal et vertical">
      <div className="document-reader-size" style={{ width: pageWidth * scale, height: height ? height * scale : undefined }}>
        <div ref={paper} className="document-reader-paper loan-document-protected" style={{ width: pageWidth, transform: `scale(${scale})` }}>{children}</div>
      </div>
    </div>
  </section>;
}

export function DocumentPreviewPanel({ children, title, landscape = false }: { children: React.ReactNode; title: string; landscape?: boolean }) {
  return <details className="document-preview-panel"><summary>Voir l’aperçu — {title}</summary><DocumentReader title={title} landscape={landscape}>{children}</DocumentReader></details>;
}
