'use client';
import React, { useEffect, useId, useRef, useState } from 'react';
import { Check, Monitor, Moon, Sun } from 'lucide-react';
import { useTheme, type ThemePreference } from '@/components/providers/ThemeProvider';

const OPTIONS: { value: ThemePreference; label: string; hint: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Clair', hint: 'Fond clair en permanence', icon: Sun },
  { value: 'dark', label: 'Sombre', hint: 'Fond sombre en permanence', icon: Moon },
  { value: 'auto', label: 'Auto', hint: 'Suit les réglages de votre appareil', icon: Monitor },
];

/**
 * Compact : bouton d'icône + petit menu (topbar). Complet : liste déroulante (page Mon compte).
 * Le mode reste toujours un choix personnel.
 */
export function ThemeControl({ compact = false }: { compact?: boolean }) {
  const { preference, setPreference, theme } = useTheme();
  const id = useId();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); button.current?.focus(); } };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  if (!compact) {
    return <div className="k-field">
      <label htmlFor={id}>Thème de l’interface</label>
      <select id={id} value={preference} onChange={e => setPreference(e.target.value as ThemePreference)} className="k-input">
        <option value="light">Clair</option><option value="dark">Sombre</option><option value="auto">Auto</option>
      </select>
      <p className="k-help">Auto suit les changements de votre appareil.</p>
    </div>;
  }

  const current = OPTIONS.find(o => o.value === preference) ?? OPTIONS[2];
  const Icon = preference === 'auto' ? Monitor : theme === 'dark' ? Moon : Sun;

  const onMenuKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const items = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]'));
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    const next = e.key === 'ArrowDown' ? (index + 1) % items.length : (index - 1 + items.length) % items.length;
    items[next]?.focus();
  };

  return (
    <div className="relative" ref={wrap}>
      <button
        ref={button}
        type="button"
        className="shell-icon-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? `${id}-menu` : undefined}
        aria-label={`Apparence : ${current.label}`}
        onClick={() => setOpen(o => !o)}
      >
        <Icon size={20} strokeWidth={1.5} aria-hidden="true" />
      </button>
      {open && (
        <div id={`${id}-menu`} role="menu" aria-label="Apparence" className="shell-menu shell-theme-menu" style={{ right: 0, top: 'calc(100% + 10px)', width: 248 }} onKeyDown={onMenuKey}>
          <div className="shell-menu-head"><span className="shell-menu-title">Apparence</span></div>
          {OPTIONS.map(o => (
            <button
              key={o.value}
              type="button"
              role="menuitemradio"
              aria-checked={preference === o.value}
              className="shell-menu-item"
              autoFocus={preference === o.value}
              onClick={() => { setPreference(o.value); setOpen(false); button.current?.focus(); }}
            >
              <o.icon size={18} strokeWidth={1.5} aria-hidden="true" />
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontWeight: 600 }}>{o.label}</span>
                <span style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)' }}>{o.hint}</span>
              </span>
              {preference === o.value && <Check size={16} strokeWidth={2} aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}