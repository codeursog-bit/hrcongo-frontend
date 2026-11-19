'use client';
import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Search, CornerDownLeft, History } from 'lucide-react';
import { canAccessPath } from '@/lib/route-access';
import { SHELL_PAGES, stripBasePath } from '@/lib/shell/page-index';

/**
 * Recherche de pages (Ctrl/⌘ + K).
 * Les résultats viennent (1) des liens du menu latéral déjà filtré par les droits de la personne
 * et (2) de l'index des sous-pages (lib/shell/page-index), proposées seulement si le module existe
 * dans son menu ET si son rôle y a accès. Aucune donnée métier n'est lue ici.
 */
type Entry = { label: string; href: string; group: string; kind: 'menu' | 'page' | 'recent'; keywords?: string };

const RECENT_KEY = 'konza:shell:recent';
const MAX_RESULTS = 10;

const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’']/g, ' ').toLowerCase();

const readRecents = (): Entry[] => {
  try {
    const raw = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    return Array.isArray(raw)
      ? raw.filter((r) => r && typeof r.label === 'string' && typeof r.href === 'string').slice(0, 5).map((r) => ({ label: r.label, href: r.href, group: 'Récents', kind: 'recent' as const }))
      : [];
  } catch { return []; }
};

const saveRecent = (entry: Entry) => {
  try {
    const current = readRecents().filter((r) => r.href !== entry.href);
    const next = [{ label: entry.label, href: entry.href }, ...current.map((r) => ({ label: r.label, href: r.href }))].slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch { /* stockage indisponible */ }
};

const collectEntries = (): Entry[] => {
  const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>('.shell-sidebar nav a[href]'));
  const menu: Entry[] = anchors
    .map((a) => ({
      label: (a.getAttribute('aria-label') || a.querySelector('span.truncate')?.textContent || a.textContent || '').trim(),
      href: a.getAttribute('href') || '',
      group: 'Menu',
      kind: 'menu' as const,
    }))
    .filter((e) => e.label && e.href);

  const prefixed = menu.some((m) => /^\/(pme|cabinet|portefeuille|admin)\//.test(m.href));
  let role = '';
  try { role = JSON.parse(localStorage.getItem('user') || 'null')?.role || ''; } catch { /* ignore */ }

  const pages: Entry[] = [];
  if (!prefixed && role) {
    const menuPaths = menu.map((m) => stripBasePath(m.href.split('?')[0]));
    for (const page of SHELL_PAGES) {
      const moduleInMenu = page.always || menuPaths.some((p) => p === page.module || p.startsWith(page.module + '/'));
      if (!moduleInMenu) continue;
      if (!canAccessPath(role, page.path)) continue;
      pages.push({ label: page.label, href: page.path, group: page.group, kind: 'page', keywords: page.keywords });
    }
  }

  const seen = new Set<string>();
  return [...menu, ...pages].filter((e) => {
    const key = e.href.split('?')[0].replace(/\/$/, '');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export function ShellSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [recents, setRecents] = useState<Entry[]>([]);
  const [active, setActive] = useState(0);
  const [shortcut, setShortcut] = useState('Ctrl K');
  const inputRef = useRef<HTMLInputElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const listId = useId();

  useEffect(() => {
    if (/Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent)) setShortcut('⌘ K');
  }, []);

  const openPalette = useCallback(() => {
    lastFocus.current = document.activeElement as HTMLElement | null;
    setEntries(collectEntries());
    setRecents(readRecents());
    setQuery('');
    setActive(0);
    setOpen(true);
  }, []);

  const closePalette = useCallback(() => {
    setOpen(false);
    window.setTimeout(() => lastFocus.current?.focus?.(), 0);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (open) closePalette(); else openPalette();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, openPalette, closePalette]);

  useEffect(() => {
    if (open) window.requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  const results = useMemo<Entry[]>(() => {
    const q = norm(query).trim();
    if (!q) {
      const rec = recents.slice(0, 4);
      const recHrefs = new Set(rec.map((r) => r.href));
      const base = entries.filter((e) => e.kind === 'menu' && !recHrefs.has(e.href)).slice(0, 8);
      return [...rec, ...base];
    }
    const tokens = q.split(/\s+/).filter(Boolean);
    const scored = entries
      .map((e) => {
        const label = norm(e.label);
        const hay = `${label} ${norm(e.group)} ${norm(e.keywords || '')}`;
        if (!tokens.every((t) => hay.includes(t))) return null;
        const first = tokens[0];
        let score = 15;
        if (label === q) score = 100;
        else if (label.startsWith(first)) score = 70;
        else if (label.split(/\s+/).some((w) => w.startsWith(first))) score = 50;
        else if (label.includes(first)) score = 35;
        if (e.kind === 'menu') score += 5;
        return { e, score };
      })
      .filter((x): x is { e: Entry; score: number } => x !== null)
      .sort((a, b) => b.score - a.score || a.e.label.localeCompare(b.e.label, 'fr'))
      .slice(0, MAX_RESULTS)
      .map((x) => x.e);
    const order: string[] = [];
    scored.forEach((e) => { if (!order.includes(e.group)) order.push(e.group); });
    return scored.sort((a, b) => order.indexOf(a.group) - order.indexOf(b.group));
  }, [query, entries, recents]);

  useEffect(() => { setActive(0); }, [query]);

  const go = (entry: Entry) => {
    saveRecent(entry);
    closePalette();
    router.push(entry.href);
  };

  const onInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => (results.length ? (i + 1) % results.length : 0)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => (results.length ? (i - 1 + results.length) % results.length : 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); const target = results[active]; if (target) go(target); }
    else if (e.key === 'Escape') { e.preventDefault(); closePalette(); }
    else if (e.key === 'Tab') { e.preventDefault(); }
  };

  useEffect(() => {
    if (!open) return;
    document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open, listId]);

  let lastGroup = '';
  const dialog = open ? (
    <div className="shell-palette-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) closePalette(); }}>
      <div className="shell-palette" role="dialog" aria-modal="true" aria-label="Rechercher une page">
        <div className="shell-palette-field">
          <Search size={18} strokeWidth={1.5} aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKey}
            placeholder="Rechercher une page, un module…"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={results.length ? `${listId}-${active}` : undefined}
            aria-label="Rechercher une page ou un menu"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="shell-kbd" aria-hidden="true">Échap</kbd>
        </div>
        <p className="sr-only" role="status">{results.length} résultat(s)</p>
        {results.length === 0 ? (
          <p className="shell-palette-empty">Aucune page ne correspond à « {query} » dans votre menu.</p>
        ) : (
          <ul id={listId} role="listbox" className="shell-palette-list" aria-label="Résultats">
            {results.map((r, i) => {
              const heading = r.group !== lastGroup;
              lastGroup = r.group;
              return (
                <React.Fragment key={`${r.kind}-${r.href}`}>
                  {heading && <li role="presentation" className="shell-palette-group">{r.group}</li>}
                  <li
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={i === active}
                    className="shell-palette-option"
                    onMouseMove={() => { if (i !== active) setActive(i); }}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => go(r)}
                  >
                    {r.kind === 'recent' ? <History size={16} strokeWidth={1.5} aria-hidden="true" /> : <Search size={16} strokeWidth={1.5} aria-hidden="true" />}
                    <span>{r.label}</span>
                    {i === active && <CornerDownLeft size={14} strokeWidth={1.5} aria-hidden="true" style={{ marginLeft: 'auto' }} />}
                  </li>
                </React.Fragment>
              );
            })}
          </ul>
        )}
        <div className="shell-palette-foot" aria-hidden="true">
          <span>↑ ↓ pour naviguer</span><span>↵ pour ouvrir</span><span>Échap pour fermer</span>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button type="button" className="shell-search-trigger" onClick={openPalette} aria-haspopup="dialog" aria-label="Rechercher une page ou un menu">
        <Search size={16} strokeWidth={1.5} aria-hidden="true" />
        <span>Rechercher une page…</span>
        <kbd className="shell-kbd" aria-hidden="true">{shortcut}</kbd>
      </button>
      <button type="button" className="shell-icon-btn shell-search-icon" onClick={openPalette} aria-haspopup="dialog" aria-label="Rechercher une page ou un menu">
        <Search size={20} strokeWidth={1.5} aria-hidden="true" />
      </button>
      {dialog && typeof document !== 'undefined' ? createPortal(dialog, document.body) : null}
    </>
  );
}
