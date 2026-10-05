'use client';

// ============================================================================
// 📄 components/performance/ScorePicker.tsx
// Sélecteur de note 1–5 pensé pour le tactile : 5 grands boutons + libellé du
// niveau choisi en dessous (pas de menu déroulant, pas de curseur imprécis).
// ============================================================================

import React from 'react';

const DEFAULT_LEVELS: Record<string, string> = {
  '1': 'Insuffisant',
  '2': 'À améliorer',
  '3': 'Conforme aux attentes',
  '4': 'Dépasse les attentes',
  '5': 'Exceptionnel',
};

interface Props {
  value?: number | null;
  onChange?: (v: number) => void;
  disabled?: boolean;
  levels?: Record<string, string>;
  /** Repère facultatif (lecture seule) */
  hint?: number | null;
  hintLabel?: string;
}

export function ScorePicker({ value, onChange, disabled, levels, hint, hintLabel = 'Employé' }: Props) {
  const lv = levels ?? DEFAULT_LEVELS;
  const v = Number(value ?? 0);

  return (
    <div>
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2" role="radiogroup">
        {[1, 2, 3, 4, 5].map(n => {
          const active = v === n;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={disabled}
              onClick={() => onChange?.(n)}
              className={`relative min-h-[44px] sm:min-h-[48px] rounded-xl font-bold text-base sm:text-lg transition-all
                ${active
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25 scale-[1.03]'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}
                ${disabled ? 'cursor-default opacity-80' : active ? '' : 'hover:bg-purple-100 dark:hover:bg-purple-900/30 active:scale-95'}`}
            >
              {n}
              {hint === n && (
                <span
                  title={`${hintLabel} : ${n}`}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-400 border-2 border-white dark:border-gray-800"
                />
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs sm:text-sm min-h-[1.25rem] text-gray-500 dark:text-gray-400">
        {v > 0 ? <span className="font-medium text-purple-600 dark:text-purple-400">{lv[String(v)]}</span> : 'Touchez une note de 1 à 5'}
        {hint ? <span className="ml-2 text-amber-600 dark:text-amber-400">· {hintLabel} : {hint}</span> : null}
      </p>
    </div>
  );
}