// ============================================================================
// Fichier: components/admin/CompanySelect.tsx
// Sélecteur d'entreprise pour le super admin : remplace le <select> natif dont la
// liste déroulante est dessinée par le navigateur (lignes illisibles sur fond
// sombre). Ici tout est stylé par l'app : lisible, avec recherche, clavier et
// liste défilante, même avec des dizaines d'entreprises.
// ============================================================================

'use client';

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, Check } from 'lucide-react';

export interface CompanyOption {
  id: string;
  name: string;
  /** Petit texte à droite (ex. « 3 appareils ») */
  hint?: string;
}

interface Props {
  value: string;
  onChange: (id: string) => void;
  options: CompanyOption[];
  /** Libellé de l'option « toutes » ; mettre null pour ne pas l'afficher */
  allLabel?: string | null;
  /** Valeur renvoyée pour « toutes » (par défaut : chaîne vide) */
  allValue?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function CompanySelect({
  value, onChange, options, allLabel = 'Toutes les entreprises', allValue = '',
  placeholder = 'Choisir une entreprise', disabled = false, className = '',
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [rect, setRect] = useState<{ left: number; top: number; width: number; openUp: boolean } | null>(null);

  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => setMounted(true), []);

  // Liste affichée = « toutes » + options filtrées par la recherche
  const rows = useMemo(() => {
    // Chaque mot tapé doit se retrouver dans le nom (« societe elec » trouve « Société Générale Électrique »)
    const tokens = norm(query.trim()).split(/\s+/).filter(Boolean);
    const q = tokens.length > 0;
    const filtered = q ? options.filter((o) => { const n = norm(o.name); return tokens.every((t) => n.includes(t)); }) : options;
    const all = allLabel !== null && !q ? [{ id: allValue, name: allLabel, hint: undefined as string | undefined }] : [];
    return [...all, ...filtered];
  }, [options, query, allLabel, allValue]);

  const selected = value === allValue && allLabel !== null ? undefined : options.find((o) => o.id === value);
  const label = selected ? selected.name : value === allValue && allLabel !== null ? allLabel : placeholder;

  // Position du panneau (portail : jamais coupé par un parent en overflow-hidden)
  const place = useCallback(() => {
    const b = btnRef.current?.getBoundingClientRect();
    if (!b) return;
    const spaceBelow = window.innerHeight - b.bottom;
    const openUp = spaceBelow < 280 && b.top > spaceBelow;
    setRect({ left: b.left, top: openUp ? b.top : b.bottom, width: b.width, openUp });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    const onMove = () => place();
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);
    return () => {
      window.removeEventListener('resize', onMove);
      window.removeEventListener('scroll', onMove, true);
    };
  }, [open, place]);

  // Clic à l'extérieur : fermer
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // À l'ouverture : focus sur la recherche, ligne active = valeur courante
  useEffect(() => {
    if (!open) return;
    setQuery('');
    const idx = Math.max(0, rows.findIndex((r) => r.id === value));
    setActive(idx);
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Garder la ligne active visible
  useEffect(() => {
    if (!open) return;
    (listRef.current?.children[active] as HTMLElement | undefined)?.scrollIntoView?.({ block: 'nearest' });
  }, [active, open]);

  const pick = (id: string) => {
    onChange(id);
    setOpen(false);
    btnRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(rows.length - 1, a + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (rows[active]) pick(rows[active].id); }
    else if (e.key === 'Escape') { e.preventDefault(); setOpen(false); btnRef.current?.focus(); }
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => { if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) { e.preventDefault(); setOpen(true); } }}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-gray-900 border rounded-xl text-sm text-left text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          open ? 'border-red-500/60' : 'border-gray-700 hover:border-gray-600'
        } ${className}`}
      >
        <span className={`truncate ${selected || (value === allValue && allLabel !== null) ? 'text-white' : 'text-gray-500'}`}>{label}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {mounted && open && rect && createPortal(
        <div
          ref={panelRef}
          onKeyDown={onKeyDown}
          style={{
            position: 'fixed', left: rect.left, width: rect.width, zIndex: 9999,
            ...(rect.openUp ? { bottom: window.innerHeight - rect.top + 6 } : { top: rect.top + 6 }),
          }}
          className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl shadow-black/60 overflow-hidden"
        >
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-800">
            <Search className="w-4 h-4 text-gray-500 shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setActive(0); }}
              placeholder="Rechercher une entreprise…"
              aria-label="Rechercher une entreprise"
              className="w-full bg-transparent text-sm text-white placeholder-gray-500 outline-none"
            />
          </div>
          <ul ref={listRef} role="listbox" className="max-h-64 overflow-y-auto py-1 custom-scrollbar" style={{ scrollbarWidth: 'thin', scrollbarColor: '#4B5563 transparent' }}>
            {rows.length === 0 && <li className="px-3 py-3 text-sm text-gray-500">Aucune entreprise trouvée</li>}
            {rows.map((r, idx) => {
              const isSel = r.id === value;
              return (
                <li
                  key={`${r.id}-${idx}`}
                  role="option"
                  aria-selected={isSel}
                  onMouseEnter={() => setActive(idx)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(r.id)}
                  className={`flex items-center justify-between gap-3 px-3 py-2 text-sm cursor-pointer ${
                    idx === active ? 'bg-gray-800 text-white' : 'text-gray-200'
                  } ${isSel ? 'font-semibold' : ''}`}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <Check className={`w-3.5 h-3.5 shrink-0 ${isSel ? 'text-red-400' : 'text-transparent'}`} />
                    <span className="truncate">{r.name}</span>
                  </span>
                  {r.hint && <span className="text-[11px] text-gray-500 shrink-0">{r.hint}</span>}
                </li>
              );
            })}
          </ul>
        </div>,
        document.body,
      )}
    </>
  );
}

export default CompanySelect;