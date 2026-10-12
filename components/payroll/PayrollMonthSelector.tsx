// ============================================================================
// 📁 src/components/payroll/PayrollMonthSelector.tsx
// ✅ Années dynamiques : navigation ‹ › illimitée (2020 → 2100) + pastilles
//    centrées sur l'année choisie + bouton « Mois en cours ».
//    (avant : liste figée [2024, 2025, 2026])
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

// Bornes alignées sur le backend (GenerateBatchDto : année 2020 → 2100)
const MIN_YEAR = 2020;
const MAX_YEAR = 2100;

export function PayrollMonthSelector({ 
  selectedMonth, 
  selectedYear, 
  onMonthChange, 
  onYearChange, 
  isOpen, 
  onToggle 
}: MonthSelectorProps) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthName = MONTHS[now.getMonth()];

  // 5 années centrées sur l'année sélectionnée, toujours dans les bornes
  const start = Math.min(Math.max(selectedYear - 2, MIN_YEAR), MAX_YEAR - 4);
  const years = Array.from({ length: 5 }, (_, i) => start + i);

  const goToYear = (y: number) => onYearChange(Math.min(Math.max(y, MIN_YEAR), MAX_YEAR));
  const isCurrentPeriod = selectedMonth === currentMonthName && selectedYear === currentYear;

  return (
    <div className="relative z-20">
      <button 
        onClick={onToggle}
        className="flex items-center gap-3 bg-[var(--surface)] p-2 pr-4 rounded-2xl shadow-lg border border-[var(--border)] hover:border-emerald-500 transition-all group"
      >
        <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 p-2 rounded-xl">
          <Calendar size={20} />
        </div>
        <div className="text-left">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Période</p>
          <div className="flex items-center gap-2 font-bold text-[var(--text)]">
            <span className="capitalize">{selectedMonth}</span>
            <span className="text-emerald-600 dark:text-emerald-400">{selectedYear}</span>
            <ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
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
            {/* Navigation année par année */}
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={() => goToYear(selectedYear - 1)}
                disabled={selectedYear <= MIN_YEAR}
                aria-label="Année précédente"
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="font-bold text-[var(--text)]">{selectedYear}</span>
              <button
                type="button"
                onClick={() => goToYear(selectedYear + 1)}
                disabled={selectedYear >= MAX_YEAR}
                aria-label="Année suivante"
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Pastilles d'années autour de l'année choisie */}
            <div className="flex justify-between items-center mb-4 bg-[var(--surface-2)] rounded-xl p-1">
              {years.map(y => (
                <button 
                  key={y}
                  onClick={() => goToYear(y)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedYear === y ? 'bg-[var(--surface)] shadow text-emerald-600' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}
                >
                  {y}
                </button>
              ))}
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {MONTHS.map(m => {
                const isNow = m === currentMonthName && selectedYear === currentYear;
                return (
                  <button 
                    key={m}
                    onClick={() => onMonthChange(m)}
                    className={`relative py-2 rounded-lg text-xs font-bold transition-all ${selectedMonth === m ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)]'}`}
                  >
                    {m.slice(0, 3)}.
                    {isNow && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400" title="Mois en cours" />}
                  </button>
                );
              })}
            </div>

            {/* Retour rapide au mois en cours */}
            <button
              type="button"
              disabled={isCurrentPeriod}
              onClick={() => { onYearChange(currentYear); onMonthChange(currentMonthName); }}
              className="mt-4 w-full py-2 rounded-lg text-xs font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Aller au mois en cours ({currentMonthName.slice(0, 3)}. {currentYear})
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}