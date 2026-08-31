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
  const dark = variant === 'dark';

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {CONVENTIONS_CATALOG.map(entry => {
          const Icon = entry.icon;
          const isSelected = selected === entry.code;
          return (
            <button key={entry.code} type="button"
              onClick={() => onSelect(isSelected ? '' : entry.code)}
              className={`relative flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                isSelected
                  ? dark
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : dark
                    ? 'border-white/10 hover:border-purple-500/40 bg-white/5'
                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50/50'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isSelected ? 'bg-purple-500/20' : dark ? 'bg-white/10' : 'bg-gray-100 dark:bg-gray-700'
              }`}>
                <Icon size={20} className={isSelected ? 'text-purple-500' : dark ? 'text-white/70' : 'text-gray-500'} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className={`font-bold text-sm ${isSelected ? 'text-purple-600 dark:text-purple-300' : dark ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                    {entry.label}
                  </p>
                  <StatusBadge status={entry.status} />
                </div>
                <p className={`text-xs truncate ${dark ? 'text-white/50' : 'text-gray-500'}`}>{entry.description}</p>
              </div>

              {isSelected && (
                <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center shrink-0">
                  <Check size={12} className="text-white" />
                </div>
              )}

              {/* "Voir plus" — n'affecte pas la sélection de la carte */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setDetailsFor(entry); }}
                className={`absolute top-1.5 right-1.5 p-1 rounded-full ${
                  dark ? 'text-white/30 hover:text-white/70 hover:bg-white/10' : 'text-gray-300 hover:text-gray-600 hover:bg-gray-100'
                }`}
                title="Voir ce qui est déjà automatisé pour cette convention"
              >
                <Info size={14} />
              </button>
            </button>
          );
        })}
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
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
        <CheckCircle2 size={10} /> Digitalisée
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
      En cours
    </span>
  );
}

function CoverageRow({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm py-1">
      {done
        ? <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
        : <Circle size={16} className="text-gray-300 dark:text-gray-600 shrink-0" />}
      <span className={done ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'}>{label}</span>
    </div>
  );
}

function ConventionDetailsModal({ entry, onClose }: { entry: ConventionCatalogEntry; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-xl">
        <div className="flex items-start justify-between mb-1">
          <h4 className="font-bold text-gray-900 dark:text-white">{entry.label}</h4>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 -m-1">
            <X size={18} />
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-4">{entry.description}</p>

        <div className="space-y-0.5 mb-4">
          <CoverageRow label="Grille salariale (catégories/échelons)" done={entry.coverage.salaryGrid} />
          <CoverageRow label="Prime d'ancienneté" done={entry.coverage.senioritybonus} />
          <CoverageRow label="Congés supplémentaires d'ancienneté" done={entry.coverage.extraLeave} />
          <CoverageRow label="Primes suggérées à l'activation" done={entry.coverage.bonusPresets} />
          <CoverageRow label="Suggestions de changement d'échelon" done={entry.coverage.echelonSuggestions} />
        </div>

        {entry.missingNote && (
          <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10 rounded-lg p-3 mb-4">
            {entry.missingNote}
          </p>
        )}

        <button onClick={onClose}
          className="w-full px-4 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg">
          Fermer
        </button>
      </motion.div>
    </motion.div>
  );
}

export { getConventionCatalogEntry };