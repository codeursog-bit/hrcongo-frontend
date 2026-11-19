'use client';

// ============================================================================
// components/requests/ModuleNav.tsx
// Navigation de module UNIQUE pour toute l'app (Congés, Présences, Absences, Permissions,
// Prêts, Rapports, Performance…). Une seule barre :
//   • les onglets qui tiennent sont affichés, les autres passent dans « Plus » (menu groupé) ;
//   • l'onglet actif est toujours visible ;
//   • l'action principale (ex. « Nouvelle demande ») est un bouton à droite ;
//   • un petit séparateur marque le changement de groupe ;
//   • sur petit écran le bouton principal devient une icône.
// Le composant ne connaît aucune route métier : les pages lui passent leurs liens.
// ============================================================================

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { MoreHorizontal, ChevronDown, Plus } from 'lucide-react';
import { moduleNavMenuPosition, moduleNavVisibleCount } from './module-nav-layout';
import './module-nav.css';

export interface ModuleNavItem {
  href: string;
  label: string;
  icon?: React.ElementType;
  /** Regroupement (séparateurs et titres du menu « Plus »). */
  group?: string;
  active?: boolean;
}

interface ModuleNavProps {
  items: ModuleNavItem[];
  /** Titres des groupes dans le menu « Plus ». */
  groupLabels?: Record<string, string>;
  /** Action principale, affichée à droite. */
  cta?: (ModuleNavItem & { active?: boolean }) | null;
  ariaLabel?: string;
  /** Réduit l'espace sous la barre (quand un texte d'aide suit). */
  tight?: boolean;
}

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default function ModuleNav({ items, groupLabels = {}, cta = null, ariaLabel = 'Navigation du module', tight = false }: ModuleNavProps) {
  const tabsRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState<ReturnType<typeof moduleNavMenuPosition> | null>(null);
  const [visibleCount, setVisibleCount] = useState(items.length);
  const [moreOpen, setMoreOpen] = useState(false);
  // Les pages recréent le tableau à chaque rendu : on ne remesure que si son contenu change.
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const itemsKey = items.map((i) => `${i.href}|${i.label}|${i.group ?? ''}|${!!i.active}`).join('~');

  const compute = useCallback(() => {
    const tabs = tabsRef.current;
    const ghost = ghostRef.current;
    if (!tabs || !ghost) return;
    const available = tabs.clientWidth;
    if (available <= 0) return;
    const list = itemsRef.current;
    const tabEls = Array.from(ghost.querySelectorAll<HTMLElement>('[data-ghost-tab]'));
    const moreEl = ghost.querySelector<HTMLElement>('[data-ghost-more]');
    const widths = tabEls.map(el => el.getBoundingClientRect().width);
    const moreWidth = moreEl?.getBoundingClientRect().width ?? 90;
    setVisibleCount(moduleNavVisibleCount(list, widths, available, moreWidth));
  }, [itemsKey]);

  useIsoLayoutEffect(() => {
    compute();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(compute) : null;
    if (observer && tabsRef.current) observer.observe(tabsRef.current);
    (document as any).fonts?.ready?.then(compute).catch(() => {});
    return () => observer?.disconnect();
  }, [compute]);

  const { visible, hidden } = useMemo(() => {
    if (visibleCount >= items.length) return { visible: items, hidden: [] as ModuleNavItem[] };
    let vis = items.slice(0, visibleCount);
    const activeIndex = items.findIndex((i) => i.active);
    if (visibleCount > 0 && activeIndex >= visibleCount) vis = [...items.slice(0, visibleCount - 1), items[activeIndex]];
    const set = new Set(vis.map((i) => i.href));
    return { visible: vis, hidden: items.filter((i) => !set.has(i.href)) };
  }, [items, visibleCount]);

  useIsoLayoutEffect(() => {
    if (!moreOpen || hidden.length === 0) { setMenuPosition(null); return; }
    const position = () => {
      if (!buttonRef.current || !navRef.current) return;
      setMenuPosition(moduleNavMenuPosition(buttonRef.current.getBoundingClientRect(), navRef.current.getBoundingClientRect(), { width: window.innerWidth, height: window.innerHeight }, menuRef.current?.scrollHeight || 420));
    };
    position();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(position) : null;
    if (navRef.current) observer?.observe(navRef.current);
    window.addEventListener('resize', position);
    return () => { observer?.disconnect(); window.removeEventListener('resize', position); };
  }, [moreOpen, hidden.length, visibleCount, itemsKey]);

  useEffect(() => {
    if (hidden.length === 0) setMoreOpen(false);
  }, [hidden.length]);

  useEffect(() => {
    if (!moreOpen) return;
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus({ preventScroll: true });
    const onDown = (e: MouseEvent) => { if (!moreRef.current?.contains(e.target as Node) && !menuRef.current?.contains(e.target as Node)) setMoreOpen(false); };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); setMoreOpen(false); buttonRef.current?.focus({ preventScroll: true }); }
    };
    const onScroll = (e: Event) => { if (!menuRef.current?.contains(e.target as Node)) setMoreOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); window.removeEventListener('scroll', onScroll, true); };
  }, [moreOpen]);

  const hiddenGroups = useMemo(() => {
    const groups: { key: string; items: ModuleNavItem[] }[] = [];
    hidden.forEach((i) => {
      const key = i.group ?? '';
      const found = groups.find((g) => g.key === key);
      if (found) found.items.push(i); else groups.push({ key, items: [i] });
    });
    return groups;
  }, [hidden]);

  const renderTabContent = (it: ModuleNavItem) => {
    const Icon = it.icon;
    return (<>{Icon ? <Icon size={16} strokeWidth={1.5} aria-hidden="true" /> : null}{it.label}</>);
  };

  return (
    <nav ref={navRef} className={`module-nav${tight ? ' module-nav--tight' : ''}`} aria-label={ariaLabel}>
      <div className="module-nav-tabs" ref={tabsRef}>
        {visible.map((it, i) => (
          <React.Fragment key={it.href}>
            {i > 0 && it.group !== visible[i - 1].group && <span className="module-nav-sep" aria-hidden="true" />}
            <Link href={it.href} className={`module-nav-tab${it.active ? ' is-active' : ''}`} aria-current={it.active ? 'page' : undefined}>
              {renderTabContent(it)}
            </Link>
          </React.Fragment>
        ))}

        {hidden.length > 0 && (
          <div className="module-nav-more" ref={moreRef}>
            <button
              ref={buttonRef}
              type="button"
              className="module-nav-tab"
              aria-haspopup="menu"
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen((o) => !o)}
            >
              <MoreHorizontal size={16} strokeWidth={1.5} aria-hidden="true" />
              Plus
              <ChevronDown size={14} strokeWidth={1.5} aria-hidden="true" style={{ transition: 'transform .2s', transform: moreOpen ? 'rotate(180deg)' : 'none' }} />
            </button>
            {moreOpen && typeof document !== 'undefined' && createPortal(
              <div ref={menuRef} className="shell-menu module-nav-menu" role="menu" aria-label="Autres pages du module"
                style={menuPosition ? { ...menuPosition, visibility: 'visible' } : { visibility: 'hidden' }}
                onBlur={e => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node) && !moreRef.current?.contains(e.relatedTarget as Node)) setMoreOpen(false);
                }}
                onKeyDown={e => {
                  if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
                  e.preventDefault();
                  const links = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]'));
                  const index = links.indexOf(document.activeElement as HTMLElement);
                  const next = e.key === 'Home' ? 0 : e.key === 'End' ? links.length - 1 : (index + (e.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length;
                  links[next]?.focus();
                }}>
                {hiddenGroups.map((g) => (
                  <div key={g.key || 'default'}>
                    {g.key && groupLabels[g.key] && hiddenGroups.length > 1 && <p className="module-nav-menu-title">{groupLabels[g.key]}</p>}
                    {g.items.map((it) => {
                      const Icon = it.icon;
                      return (
                        <Link key={it.href} href={it.href} role="menuitem" aria-current={it.active ? 'page' : undefined} className={`shell-menu-item${it.active ? ' is-current' : ''}`} onClick={() => setMoreOpen(false)}>
                          {Icon ? <Icon size={16} strokeWidth={1.5} aria-hidden="true" /> : null}
                          <span style={{ flex: 1 }}>{it.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </div>, buttonRef.current?.closest('dialog') || document.body
            )}
          </div>
        )}
      </div>

      {cta && (
        <Link href={cta.href} className="module-nav-cta" aria-label={cta.label} aria-current={cta.active ? 'page' : undefined}>
          <Plus size={16} strokeWidth={2} aria-hidden="true" />
          <span>{cta.label}</span>
        </Link>
      )}

      {/* Rangée invisible servant uniquement à mesurer la largeur de chaque onglet. */}
      <div className="module-nav-ghost" ref={ghostRef} aria-hidden="true">
        {items.map((it) => (
          <span key={it.href} data-ghost-tab className={`module-nav-tab${it.active ? ' is-active' : ''}`}>{renderTabContent(it)}</span>
        ))}
        <span data-ghost-more className="module-nav-tab">
          <MoreHorizontal size={16} strokeWidth={1.5} />Plus<ChevronDown size={14} strokeWidth={1.5} />
        </span>
      </div>
    </nav>
  );
}
