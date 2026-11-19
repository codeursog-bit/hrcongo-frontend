'use client';

import React from 'react';
import { Calendar, CalendarDays, CalendarRange } from 'lucide-react';
import { FancySelect } from '@/components/ui/FancySelect';
import '@/components/ui/select.css';

// ─────────────────────────────────────────────────────────────────────────
// ✅ Sélecteur de période partagé — même composant (FancySelect) et même
// style que la page Effectifs, pour que tous les rapports se ressemblent.
// 3 modes : Mensuel, Annuel, ou plage pluriannuelle (ex. 2020 → 2023).
//
// Utilise FancySelect plutôt qu'un <select> natif : le menu déroulant est
// un vrai composant React (portal), pas le widget natif du navigateur —
// ça évite le bug où le menu ouvert ignore les couleurs du thème et
// affiche du texte illisible.
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

const MODE_META: Record<PeriodMode, { label: string; icon: any }> = {
  MOIS: { label: 'Mensuel', icon: Calendar },
  ANNEE: { label: 'Annuel', icon: CalendarDays },
  PLAGE: { label: 'Plusieurs années', icon: CalendarRange },
};

export default function PeriodSelector({ value, onChange, minYear, maxYear, modes }: Props) {
  const currentYear = new Date().getFullYear();
  const lo = minYear ?? currentYear - 6;
  const hi = maxYear ?? currentYear;
  const yearOptions = Array.from({ length: hi - lo + 1 }, (_, i) => hi - i).map((y) => ({
    value: String(y),
    label: String(y),
  }));
  const monthOptions = MOIS.map((m, i) => ({ value: String(i + 1), label: m }));
  const availableModes: PeriodMode[] = modes ?? ['MOIS', 'ANNEE', 'PLAGE'];

  function setMode(mode: PeriodMode) {
    if (mode === 'PLAGE' && value.yearTo === undefined) {
      onChange({ ...value, mode, yearTo: value.year });
    } else {
      onChange({ ...value, mode });
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      {/* Sélecteur de mode — même esprit que les filtres Effectifs, en pilules */}
      {availableModes.length > 1 && (
        <div className="k-segmented self-end" role="group" aria-label="Type de période">
          {availableModes.map((m) => {
            const Icon = MODE_META[m].icon;
            const active = value.mode === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                aria-pressed={active}
                className="k-segmented-item"
              >
                <Icon size={16} strokeWidth={1.5} aria-hidden="true" />
                {MODE_META[m].label}
              </button>
            );
          })}
        </div>
      )}

      {value.mode === 'MOIS' && (
        <>
          <div className="w-40">
            <FancySelect
              label="Mois"
              value={String(value.month)}
              onChange={(v) => onChange({ ...value, month: Number(v) })}
              icon={Calendar}
              options={monthOptions}
            />
          </div>
          <div className="w-32">
            <FancySelect
              label="Année"
              value={String(value.year)}
              onChange={(v) => onChange({ ...value, year: Number(v) })}
              icon={Calendar}
              options={yearOptions}
            />
          </div>
        </>
      )}

      {value.mode === 'ANNEE' && (
        <div className="w-32">
          <FancySelect
            label="Année"
            value={String(value.year)}
            onChange={(v) => onChange({ ...value, year: Number(v) })}
            icon={Calendar}
            options={yearOptions}
          />
        </div>
      )}

      {value.mode === 'PLAGE' && (
        <>
          <div className="w-32">
            <FancySelect
              label="De"
              value={String(value.year)}
              onChange={(v) => {
                const y = Number(v);
                onChange({ ...value, year: y, yearTo: Math.max(y, value.yearTo ?? y) });
              }}
              icon={Calendar}
              options={yearOptions}
            />
          </div>
          <div className="w-32">
            <FancySelect
              label="À"
              value={String(value.yearTo ?? value.year)}
              onChange={(v) => onChange({ ...value, yearTo: Number(v) })}
              icon={Calendar}
              options={yearOptions.filter((o) => Number(o.value) >= value.year)}
            />
          </div>
        </>
      )}
    </div>
  );
}