// ============================================================================
// 📁 app/(dashboard)/paie/components/PayrollMonthSelector.tsx
// ============================================================================
// ✅ Années dynamiques : navigation ‹ › de 2020 à 2100 + pastilles centrées sur
//    l'année choisie + bouton « Mois en cours ».
//    (avant : liste figée [2024, 2025, 2026] → impossible d'aller en 2027+)
//    Le design (variables CSS) est inchangé. La page PME ré-exporte ce fichier,
//    elle en profite donc aussi.
// ============================================================================

import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MonthSelectorProps {
  selectedMonth: string;
  selectedYear: number;
  onMonthChange: (month: string) => void;
  onYearChange: (year: number) => void;
  isOpen: boolean;
  onToggle: (e: React.MouseEvent) => void;
}

const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

// Bornes alignées sur le backend (année 2020 → 2100)
const MIN_YEAR = 2020;
const MAX_YEAR = 2100;

export function PayrollMonthSelector({
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
  isOpen,
  onToggle,
}: MonthSelectorProps) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthName = MONTHS[now.getMonth()];

  // 5 années centrées sur l'année sélectionnée, toujours dans les bornes
  const start = Math.min(Math.max(selectedYear - 2, MIN_YEAR), MAX_YEAR - 4);
  const years = Array.from({ length: 5 }, (_, i) => start + i);

  const goToYear = (y: number) =>
    onYearChange(Math.min(Math.max(y, MIN_YEAR), MAX_YEAR));
  const isCurrentPeriod =
    selectedMonth === currentMonthName && selectedYear === currentYear;

  return (
    <div className="relative z-20">
      <button
        onClick={onToggle}
        className="flex items-center gap-3 bg-[var(--surface)] p-2 pr-4 rounded-2xl shadow-lg border border-[var(--border)] hover:border-[var(--border)] transition-colors group"
      >
        <div className="bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))]  text-[var(--success-text)] p-2 rounded-xl">
          <Calendar size={20} />
        </div>
        <div className="text-left">
          <p className="text-xs text-[var(--text-secondary)] font-semibold uppercase tracking-wider">Période</p>
          <div className="flex items-center gap-2 font-semibold text-[var(--text)]">
            <span className="capitalize">{selectedMonth}</span>
            <span className="text-[var(--success-text)] ">{selectedYear}</span>
            <ChevronDown size={14} className={`text-[var(--text-secondary)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 top-full mt-3 w-80 bg-[var(--surface)] rounded-2xl shadow-2xl border border-[var(--border)] p-4 z-50 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Années : flèches + 5 pastilles centrées sur l'année choisie */}
            <div className="flex items-center gap-1 mb-4 bg-[var(--surface-2)] rounded-xl p-1">
              <button
                onClick={() => goToYear(selectedYear - 1)}
                disabled={selectedYear <= MIN_YEAR}
                aria-label="Année précédente"
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              {years.map((y) => (
                <button
                  key={y}
                  onClick={() => onYearChange(y)}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-colors ${selectedYear === y ? 'bg-[var(--surface)] shadow text-[var(--success-text)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}
                >
                  {y}
                </button>
              ))}
              <button
                onClick={() => goToYear(selectedYear + 1)}
                disabled={selectedYear >= MAX_YEAR}
                aria-label="Année suivante"
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {MONTHS.map((m) => (
                <button
                  key={m}
                  onClick={() => onMonthChange(m)}
                  className={`py-2 rounded-lg text-xs font-semibold transition-colors ${selectedMonth === m ? 'bg-[var(--brand-soft)] text-[var(--action)] shadow-lg ' : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)]'}`}
                >
                  {m.slice(0, 3)}.
                </button>
              ))}
            </div>

            {/* Retour rapide au mois en cours */}
            {!isCurrentPeriod && (
              <button
                onClick={() => {
                  onYearChange(currentYear);
                  onMonthChange(currentMonthName);
                }}
                className="mt-3 w-full py-2 rounded-lg text-xs font-semibold text-[var(--text-secondary)] bg-[var(--surface-2)] hover:text-[var(--text)] transition-colors"
              >
                Revenir à {currentMonthName} {currentYear}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}