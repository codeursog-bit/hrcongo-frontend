'use client';

// ============================================================================
// 📁 components/ui/SearchSelect.tsx
// Liste déroulante avec barre de recherche (sans accent, sans casse).
// La liste s'ouvre dans le flux (pas de portail) : aucun risque d'être
// coupée par le scroll d'une modale.
// ============================================================================

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, Check } from 'lucide-react';

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
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

export default function SearchSelect({
  value, onChange, options, placeholder = 'Rechercher…', className = '',
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find(o => o.value === value);

  const filtered = useMemo(() => {
    const q = norm(query);
    if (!q) return options;
    return options.filter(o => norm(o.label).includes(q));
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setQuery(''); }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const pick = (v: string) => { onChange(v); setOpen(false); setQuery(''); };

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
        <input
          type="text"
          value={open ? query : (selected?.label ?? '')}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onKeyDown={e => {
            if (e.key === 'Enter' && open && filtered.length > 0) { e.preventDefault(); pick(filtered[0].value); }
            if (e.key === 'Escape') { setOpen(false); setQuery(''); }
          }}
          className={`w-full pl-8 pr-8 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] ${className}`}
        />
        {value && (
          <button
            type="button"
            onClick={() => pick('')}
            aria-label="Effacer"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            <X size={14} />
          </button>
        )}
      </div>
      {open && (
        <ul className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-lg">
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-[var(--text-muted)]">Aucun résultat</li>
          ) : filtered.map(o => (
            <li key={o.value}>
              <button
                type="button"
                onClick={() => pick(o.value)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm text-[var(--text)] hover:bg-[var(--surface-2)]"
              >
                <span className="truncate">{o.label}</span>
                {o.value === value && <Check size={14} className="text-emerald-500 shrink-0" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}