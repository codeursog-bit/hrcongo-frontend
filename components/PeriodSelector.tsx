'use client';

import React from 'react';
import { Calendar } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────
// ✅ Sélecteur de période partagé — à utiliser sur toute page rapport qui
// a besoin de plus qu'un simple mois courant : vue mensuelle, vue annuelle,
// ou plage pluriannuelle (ex. 2020 → 2023) pour comparer plusieurs années
// d'un coup. Un seul composant, un seul comportement, sur toutes les pages.
// ─────────────────────────────────────────────────────────────────────────

export type PeriodMode = 'MOIS' | 'ANNEE' | 'PLAGE';

export interface PeriodValue {
  mode: PeriodMode;
  month: number; // 1-12, pertinent seulement si mode === 'MOIS'
  year: number; // année seule (MOIS / ANNEE), ou borne de départ (PLAGE)
  yearTo?: number; // borne de fin, pertinent seulement si mode === 'PLAGE'
}

const MOIS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

interface Props {
  value: PeriodValue;
  onChange: (v: PeriodValue) => void;
  minYear?: number; // par défaut : année courante - 6
  maxYear?: number; // par défaut : année courante
  modes?: PeriodMode[]; // limiter les modes proposés si une page n'a pas besoin des 3
}

export default function PeriodSelector({ value, onChange, minYear, maxYear, modes }: Props) {
  const currentYear = new Date().getFullYear();
  const lo = minYear ?? currentYear - 6;
  const hi = maxYear ?? currentYear;
  const years = Array.from({ length: hi - lo + 1 }, (_, i) => hi - i);
  const availableModes: PeriodMode[] = modes ?? ['MOIS', 'ANNEE', 'PLAGE'];

  const MODE_LABEL: Record<PeriodMode, string> = {
    MOIS: 'Mensuel',
    ANNEE: 'Annuel',
    PLAGE: 'Plusieurs années',
  };

  function setMode(mode: PeriodMode) {
    if (mode === 'PLAGE' && value.yearTo === undefined) {
      onChange({ ...value, mode, yearTo: value.year });
    } else {
      onChange({ ...value, mode });
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl px-3 py-2">
      <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />

      {/* Sélecteur de mode */}
      <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
        {availableModes.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`px-2.5 py-1 text-xs font-medium transition-colors ${
              value.mode === m
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {MODE_LABEL[m]}
          </button>
        ))}
      </div>

      {/* Contrôles contextuels selon le mode */}
      {value.mode === 'MOIS' && (
        <>
          <select
            value={value.month}
            onChange={(e) => onChange({ ...value, month: Number(e.target.value) })}
            className="bg-transparent text-sm font-semibold text-slate-900 dark:text-white outline-none cursor-pointer"
          >
            {MOIS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={value.year}
            onChange={(e) => onChange({ ...value, year: Number(e.target.value) })}
            className="bg-transparent text-sm font-semibold text-slate-900 dark:text-white outline-none cursor-pointer"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </>
      )}

      {value.mode === 'ANNEE' && (
        <select
          value={value.year}
          onChange={(e) => onChange({ ...value, year: Number(e.target.value) })}
          className="bg-transparent text-sm font-semibold text-slate-900 dark:text-white outline-none cursor-pointer"
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      )}

      {value.mode === 'PLAGE' && (
        <>
          <span className="text-xs text-slate-400">De</span>
          <select
            value={value.year}
            onChange={(e) => {
              const y = Number(e.target.value);
              onChange({ ...value, year: y, yearTo: Math.max(y, value.yearTo ?? y) });
            }}
            className="bg-transparent text-sm font-semibold text-slate-900 dark:text-white outline-none cursor-pointer"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <span className="text-xs text-slate-400">à</span>
          <select
            value={value.yearTo ?? value.year}
            onChange={(e) => onChange({ ...value, yearTo: Number(e.target.value) })}
            className="bg-transparent text-sm font-semibold text-slate-900 dark:text-white outline-none cursor-pointer"
          >
            {years.filter((y) => y >= value.year).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </>
      )}
    </div>
  );
}