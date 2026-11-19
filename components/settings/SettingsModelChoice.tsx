'use client';
import React from 'react';
import { Eye } from 'lucide-react';

export function SettingsModelChoice({ children, selected, onPreview, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { selected: boolean; onPreview: () => void }) {
  return <button {...props} type="button" className={`settings-model-choice ${props.className || ''}`} aria-pressed={selected} onClick={event => {
    onClick?.(event);
    onPreview();
    requestAnimationFrame(() => {
      if (window.matchMedia('(max-width: 900px)').matches) document.getElementById('settings-model-reader')?.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
    });
  }}>{children}<span className="settings-model-choice-hint"><Eye size={15} strokeWidth={1.5} aria-hidden="true" />{selected ? 'Modèle sélectionné · voir l’aperçu' : 'Choisir et prévisualiser'}</span></button>;
}
