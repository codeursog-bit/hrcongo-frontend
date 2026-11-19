'use client';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { moduleNavMenuPosition } from '@/components/requests/module-nav-layout';

const usePositionEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
export function AnchoredMenu({ anchorRef, onClose, children, label }: { anchorRef: React.RefObject<HTMLButtonElement>; onClose: () => void; children: React.ReactNode; label: string }) {
  const menu = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<ReturnType<typeof moduleNavMenuPosition> | null>(null);
  usePositionEffect(() => {
    const place = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const column = anchor.closest('main')?.getBoundingClientRect() || { left: 12, right: window.innerWidth - 12, top: 0, bottom: window.innerHeight };
      setPosition(moduleNavMenuPosition(anchor.getBoundingClientRect(), column, { width: window.innerWidth, height: window.innerHeight }, menu.current?.scrollHeight || 420));
    };
    place();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(place) : null;
    if (anchorRef.current) observer?.observe(anchorRef.current);
    window.addEventListener('resize', place);
    return () => { observer?.disconnect(); window.removeEventListener('resize', place); };
  }, [anchorRef]);
  useEffect(() => {
    menu.current?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
    const down = (e: MouseEvent) => { if (!menu.current?.contains(e.target as Node) && !anchorRef.current?.contains(e.target as Node)) onClose(); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); onClose(); anchorRef.current?.focus({ preventScroll: true }); } };
    const scroll = (e: Event) => { if (!menu.current?.contains(e.target as Node)) onClose(); };
    document.addEventListener('mousedown', down);document.addEventListener('keydown', key);window.addEventListener('scroll', scroll, true);
    return () => { document.removeEventListener('mousedown', down);document.removeEventListener('keydown', key);window.removeEventListener('scroll', scroll, true); };
  }, [anchorRef, onClose]);
  if (typeof document === 'undefined') return null;
  return createPortal(<div ref={menu} className="shell-menu payroll-row-menu" aria-label={label} style={{ position:'fixed', zIndex:1000, overflowY:'auto', boxSizing:'border-box', ...position, visibility:position?'visible':'hidden' }} onClick={e=>e.stopPropagation()} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node)&&!anchorRef.current?.contains(e.relatedTarget as Node))onClose();}}>
    {children}
  </div>, anchorRef.current?.closest('dialog') || document.body);
}
