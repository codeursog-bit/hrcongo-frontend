'use client';

// ============================================================================
// 📁 components/conventions/ConventionPicker.tsx
//
// Grille de sélection de convention partagée entre l'inscription
// (app/companies/create) et les paramètres entreprise. Remplace les listes
// locales CONVENTION_CONFIG dupliquées dans chacune des deux pages (et qui
// contenaient des codes de convention inexistants côté backend).
//
// Chaque carte affiche un badge "Digitalisée" ou "En cours" et un bouton
// "Voir plus" (n'affecte pas la sélection — stopPropagation) qui ouvre le
// détail de ce qui est déjà automatisé pour cette convention.
// ============================================================================

import { useState } from 'react';
import { Check, Info, X, CheckCircle2, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CONVENTIONS_CATALOG,
  ConventionCatalogEntry,
  getConventionCatalogEntry,
} from '@/lib/conventions/conventions-catalog';

interface ConventionPickerProps {
  selected: string;
  onSelect: (code: string) => void;
  /** Style visuel — 'dark' pour l'inscription (glassmorphism sombre), 'light' pour les paramètres */
  variant?: 'dark' | 'light';
}

export function ConventionPicker({ selected, onSelect, variant = 'light' }: ConventionPickerProps) {
  const [detailsFor, setDetailsFor] = useState<ConventionCatalogEntry | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {CONVENTIONS_CATALOG.map((entry) => {
          const Icon = entry.icon;
          const isSelected = selected === entry.code;
          return (
            <div
              key={entry.code}
              className={`relative rounded-xl transition-colors ${isSelected ? 'bg-[var(--brand-soft)]' : 'bg-[var(--surface-2)]'}`}
            >
              <button
                type="button"
                onClick={() => onSelect(isSelected ? '' : entry.code)}
                aria-pressed={isSelected}
                className="flex w-full items-start gap-3 p-4 pr-12 text-left rounded-xl focus-visible:outline-2 focus-visible:outline-[var(--focus)]"
              >
                <Icon size={20} className="shrink-0 mt-0.5 text-[var(--text-secondary)]" />
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-[var(--text)]">{entry.label}</span>
                    <StatusBadge status={entry.status} />
                  </span>
                  <span className="block text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                    {entry.description}
                  </span>
                </span>
                {isSelected && <Check size={17} className="text-[var(--action)] shrink-0" />}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDetailsFor(entry);
                }}
                className="absolute top-3 right-3 p-1 text-[var(--text-secondary)] hover:text-[var(--action)] rounded-md"
                aria-label={`Détails : ${entry.label}`}
                title="Voir ce qui est déjà automatisé pour cette convention"
              >
                <Info size={16} />
              </button>
            </div>
          );
        })}{' '}
      </div>

      <AnimatePresence>
        {detailsFor && (
          <ConventionDetailsModal entry={detailsFor} onClose={() => setDetailsFor(null)} />
        )}
      </AnimatePresence>
    </>
  );
}

function StatusBadge({ status }: { status: 'complete' | 'pending' }) {
  if (status === 'complete') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] text-[var(--success-text)]">
        <CheckCircle2 size={10} /> Digitalisée
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[color-mix(in_srgb,var(--mustard)_12%,var(--surface))] text-[var(--warning-text)]">
      En cours
    </span>
  );
}

function CoverageRow({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm py-1">
      {done ? (
        <CheckCircle2 size={16} className="text-[var(--success-text)] shrink-0" />
      ) : (
        <Circle
          size={16}
          className="text-[var(--text-secondary)] shrink-0"
        />
      )}
      <span
        className={
          done
            ? 'text-[var(--text)] text-[var(--text)]'
            : 'text-[var(--text-secondary)] text-[var(--text-secondary)]'
        }
      >
        {label}
      </span>
    </div>
  );
}

function ConventionDetailsModal({
  entry,
  onClose,
}: {
  entry: ConventionCatalogEntry;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--surface)] rounded-2xl p-6 max-w-sm w-full shadow-xl"
      >
        <div className="flex items-start justify-between mb-1">
          <h4 className="font-bold text-[var(--text)]">{entry.label}</h4>
          <button
            onClick={onClose}
            className="text-[var(--text-secondary)] hover:text-[var(--text-secondary)] p-1 -m-1"
          >
            <X size={18} />
          </button>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mb-4">{entry.description}</p>

        <div className="space-y-0.5 mb-4">
          <CoverageRow
            label="Grille salariale (catégories/échelons)"
            done={entry.coverage.salaryGrid}
          />
          <CoverageRow label="Prime d'ancienneté" done={entry.coverage.senioritybonus} />
          <CoverageRow
            label="Congés supplémentaires d'ancienneté"
            done={entry.coverage.extraLeave}
          />
          <CoverageRow label="Primes suggérées à l'activation" done={entry.coverage.bonusPresets} />
          <CoverageRow
            label="Suggestions de changement d'échelon"
            done={entry.coverage.echelonSuggestions}
          />
        </div>

        {entry.missingNote && (
          <p className="text-xs text-[var(--warning-text)] bg-[color-mix(in_srgb,var(--mustard)_12%,var(--surface))] rounded-lg p-3 mb-4">
            {entry.missingNote}
          </p>
        )}

        <button
          onClick={onClose}
          className="w-full px-4 py-2 text-sm font-bold text-[var(--surface)] bg-[var(--text)] hover:bg-[var(--action)] rounded-lg"
        >
          Fermer
        </button>
      </motion.div>
    </motion.div>
  );
}

export { getConventionCatalogEntry };
