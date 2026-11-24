'use client';

// ============================================================================
// 📁 hooks/useDraggableWidget.ts
// Rend un élément flottant (position: fixed) déplaçable à la souris ou au doigt.
//  ✅ Reste TOUJOURS visible : la position est bornée à la fenêtre (marge 8 px),
//     y compris après un redimensionnement ou l'ouverture d'un panneau.
//  ✅ Un simple clic reste un clic (le déplacement ne démarre qu'après 5 px).
//  ✅ La position est mémorisée dans ce navigateur (localStorage) : aucun appel
//     serveur, aucun coût côté API.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react';

interface Pos { right: number; bottom: number }

const KEY_PREFIX = 'konza:widget:';
const RESET_EVENT = 'konza:widgets-reset';

/** Remet TOUS les boutons flottants à leur place d'origine (immédiatement, sans recharger). */
export function resetFloatingWidgets() {
  try {
    Object.keys(window.localStorage)
      .filter((k) => k.startsWith(KEY_PREFIX))
      .forEach((k) => window.localStorage.removeItem(k));
  } catch {}
  window.dispatchEvent(new Event(RESET_EVENT));
}

const MARGIN = 8;          // distance minimale au bord de la fenêtre
const DRAG_THRESHOLD = 5;  // px avant de considérer que c'est un déplacement

function readSaved(key: string): Pos | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (typeof p?.right === 'number' && typeof p?.bottom === 'number') return p;
  } catch {}
  return null;
}

export function useDraggableWidget<T extends HTMLElement>(storageKey: string) {
  const ref = useRef<T>(null) as RefObject<T>;
  const [pos, setPos] = useState<Pos | null>(null);
  const posRef = useRef<Pos | null>(null);
  const moved = useRef(false);
  const drag = useRef<{
    startX: number; startY: number;
    startRight: number; startBottom: number;
    active: boolean;
  } | null>(null);

  // Borne la position pour que l'élément reste entièrement visible
  const clamp = useCallback((p: Pos): Pos => {
    const el = ref.current;
    const w = el?.offsetWidth ?? 0;
    const h = el?.offsetHeight ?? 0;
    const maxRight = Math.max(MARGIN, window.innerWidth - w - MARGIN);
    const maxBottom = Math.max(MARGIN, window.innerHeight - h - MARGIN);
    return {
      right: Math.min(Math.max(p.right, MARGIN), maxRight),
      bottom: Math.min(Math.max(p.bottom, MARGIN), maxBottom),
    };
  }, []);

  // Position mémorisée au chargement
  useEffect(() => {
    const saved = readSaved(storageKey);
    if (saved) { posRef.current = saved; setPos(saved); }
  }, [storageKey]);

  // Réinitialisation demandée (menu profil ou bouton ↺)
  useEffect(() => {
    const onReset = () => { posRef.current = null; setPos(null); };
    window.addEventListener(RESET_EVENT, onReset);
    return () => window.removeEventListener(RESET_EVENT, onReset);
  }, []);

  // Reste visible : redimensionnement de la fenêtre
  useEffect(() => {
    const onResize = () =>
      setPos((prev) => {
        if (!prev) return prev;
        const c = clamp(prev);
        posRef.current = c;
        return c;
      });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [clamp]);

  // Reste visible : après chaque rendu (ouverture d'un panneau qui élargit
  // l'élément, apparition tardive du bouton…). Ne re-rend que si la position change.
  useEffect(() => {
    if (!pos || !ref.current) return;
    const c = clamp(pos);
    if (c.right !== pos.right || c.bottom !== pos.bottom) {
      posRef.current = c;
      setPos(c);
    }
  });

  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    moved.current = false;
    drag.current = {
      startX: e.clientX,
      startY: e.clientY,
      startRight: window.innerWidth - rect.right,
      startBottom: window.innerHeight - rect.bottom,
      active: false,
    };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.active && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    d.active = true;
    moved.current = true;
    const next = clamp({ right: d.startRight - dx, bottom: d.startBottom - dy });
    posRef.current = next;
    setPos(next);
  };

  const endDrag = (e: ReactPointerEvent<HTMLElement>) => {
    const d = drag.current;
    drag.current = null;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    if (d?.active && posRef.current) {
      try { window.localStorage.setItem(storageKey, JSON.stringify(posRef.current)); } catch {}
    }
  };

  return {
    ref,
    pos,
    /** À appliquer sur l'élément flottant : prend le dessus sur sa position par défaut. */
    style: pos
      ? ({ right: pos.right, bottom: pos.bottom, left: 'auto', top: 'auto' } as const)
      : undefined,
    /** À étaler sur la « poignée » (le bouton, ou le titre d'un panneau). */
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
    },
    /** Style de la poignée (à fusionner avec le style existant du bouton). */
    handleStyle: { touchAction: 'none', cursor: 'grab' } as const,
    handleTitle: 'Cliquez pour ouvrir · Glissez pour déplacer',
    /** Vrai si le geste qui vient d'avoir lieu était un déplacement (à tester dans onClick). */
    didDrag: () => moved.current,
  };
}