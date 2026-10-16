'use client';

// ============================================================================
// 📁 components/workforce/WorkforcePeriodPicker.tsx
// Sélecteur de période : Mois · Plage de mois (ex. janvier → octobre) · Année.
// Utilise FancySelect (menu React, lisible en mode sombre — pas de <select> natif).
// ============================================================================

import React from 'react';
import { FancySelect } from '@/components/ui/FancySelect';
import { MONTHS_FR, WfPeriodMode, WfPeriodState } from '@/lib/workforce';

const MODES: { id: WfPeriodMode; label: string }[] = [
  { id: 'MOIS', label: 'Un mois' },
  { id: 'PLAGE', label: 'De … à …' },
  { id: 'ANNEE', label: 'Année' },
];

export function WorkforcePeriodPicker({ value, onChange }: { value: WfPeriodState; onChange: (v: WfPeriodState) => void }) {
  const curY = new Date().getFullYear();
  const years = Array.from({ length: 7 }, (_, i) => curY - i);
  const monthOpts = MONTHS_FR.map((l, i) => ({ value: String(i + 1), label: l }));
  const yearOpts = years.map((y) => ({ value: String(y), label: String(y) }));
  const set = (patch: Partial<WfPeriodState>) => onChange({ ...value, ...patch });

  return (
    <div className="flex flex-col gap-3">
      <div className="inline-flex p-1 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] self-start">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => set({ mode: m.id })}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              value.mode === m.id ? 'bg-emerald-500 text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        {value.mode === 'MOIS' && (
          <>
            <div className="w-44"><FancySelect label="Mois" value={String(value.month)} onChange={(v) => set({ month: parseInt(v, 10) })} options={monthOpts} /></div>
            <div className="w-28"><FancySelect label="Année" value={String(value.year)} onChange={(v) => set({ year: parseInt(v, 10) })} options={yearOpts} /></div>
          </>
        )}
        {value.mode === 'ANNEE' && (
          <div className="w-28"><FancySelect label="Année" value={String(value.year)} onChange={(v) => set({ year: parseInt(v, 10) })} options={yearOpts} /></div>
        )}
        {value.mode === 'PLAGE' && (
          <>
            <div className="w-40"><FancySelect label="De (mois)" value={String(value.fromMonth)} onChange={(v) => set({ fromMonth: parseInt(v, 10) })} options={monthOpts} /></div>
            <div className="w-28"><FancySelect label="Année" value={String(value.fromYear)} onChange={(v) => set({ fromYear: parseInt(v, 10) })} options={yearOpts} /></div>
            <span className="pb-3 text-[var(--text-muted)] font-bold">→</span>
            <div className="w-40"><FancySelect label="À (mois)" value={String(value.toMonth)} onChange={(v) => set({ toMonth: parseInt(v, 10) })} options={monthOpts} /></div>
            <div className="w-28"><FancySelect label="Année" value={String(value.toYear)} onChange={(v) => set({ toYear: parseInt(v, 10) })} options={yearOpts} /></div>
          </>
        )}
      </div>
    </div>
  );
}