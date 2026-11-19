'use client';

// components/ui/SearchSelect.tsx
// Liste déroulante avec barre de recherche (sans accent, sans casse).
// Même rendu que FancySelect (voir select.css). La liste s'ouvre dans le flux (pas de portail) :
// aucun risque d'être coupée par le scroll d'une modale. Clavier : ↑ ↓ Entrée Échap.
import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Search, X, Check } from 'lucide-react';
import './select.css';

export interface SearchSelectOption {
  value: string;
  label: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: SearchSelectOption[];
  placeholder?: string;
  className?: string;
}

const norm = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

export default function SearchSelect({
  value, onChange, options, placeholder = 'Rechercher…', className = '',
}: Props) {
  const uid = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find(o => o.value === value);

  const filtered = useMemo(() => {
    const q = norm(query);
    if (!q) return options;
    return options.filter(o => norm(o.label).includes(q));
  }, [options, query]);

  useEffect(() => { setActive(0); }, [query, open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setQuery(''); }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  useEffect(() => {
    if (open) document.getElementById(`${uid}-opt-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open, uid]);

  const pick = (v: string) => { onChange(v); setOpen(false); setQuery(''); };

  const listId = `${uid}-list`;

  return (
    <div ref={ref} className="k-select">
      <div className="k-select-field">
        <Search size={16} strokeWidth={1.5} className="k-select-field-icon" aria-hidden="true" />
        <input
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={open && filtered.length > 0 ? `${uid}-opt-${active}` : undefined}
          value={open ? query : (selected?.label ?? '')}
          placeholder={placeholder}
          autoComplete="off"
          onFocus={() => setOpen(true)}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onKeyDown={e => {
            if (e.key === 'ArrowDown') { e.preventDefault(); if (!open) setOpen(true); else if (filtered.length) setActive(i => (i + 1) % filtered.length); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); if (open && filtered.length) setActive(i => (i - 1 + filtered.length) % filtered.length); }
            else if (e.key === 'Enter' && open && filtered.length > 0) { e.preventDefault(); pick(filtered[active]?.value ?? filtered[0].value); }
            else if (e.key === 'Escape') { setOpen(false); setQuery(''); }
          }}
          className={`k-select-trigger k-select-input ${className}`}
        />
        {value && (
          <button type="button" onClick={() => pick('')} aria-label="Effacer la sélection" className="k-select-clear">
            <X size={16} strokeWidth={1.5} aria-hidden="true" />
          </button>
        )}
      </div>
      {open && (
        <ul id={listId} role="listbox" aria-label="Résultats" className="k-select-menu k-select-menu-inline">
          {filtered.length === 0 ? (
            <li role="presentation" className="k-select-empty">Aucun résultat</li>
          ) : filtered.map((o, i) => (
            <li key={o.value} role="presentation">
              <button
                id={`${uid}-opt-${i}`}
                type="button"
                role="option"
                aria-selected={o.value === value}
                data-active={i === active}
                tabIndex={-1}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(o.value)}
                className="k-select-option"
              >
                <span className="truncate">{o.label}</span>
                {o.value === value && <Check size={16} strokeWidth={2} aria-hidden="true" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
