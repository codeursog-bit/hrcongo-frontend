// ============================================================================
// 📁 src/components/payroll/PayrollMonthSelector.tsx
// ============================================================================

import { Calendar, ChevronDown } from 'lucide-react';
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
const YEARS = [2024, 2025, 2026];

export function PayrollMonthSelector({ 
  selectedMonth, 
  selectedYear, 
  onMonthChange, 
  onYearChange, 
  isOpen, 
  onToggle 
}: MonthSelectorProps) {
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
            className="absolute right-0 top-full mt-3 w-72 bg-[var(--surface)] rounded-2xl shadow-2xl border border-[var(--border)] p-4 z-50 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 bg-[var(--surface-2)] rounded-xl p-1">
              {YEARS.map(y => (
                <button 
                  key={y}
                  onClick={() => onYearChange(y)}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-colors ${selectedYear === y ? 'bg-[var(--surface)] shadow text-[var(--success-text)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}
                >
                  {y}
                </button>
              ))}
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {MONTHS.map(m => (
                <button 
                  key={m}
                  onClick={() => onMonthChange(m)}
                  className={`py-2 rounded-lg text-xs font-semibold transition-colors ${selectedMonth === m ? 'bg-[var(--brand-soft)] text-[var(--action)] shadow-lg ' : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)]'}`}
                >
                  {m.slice(0, 3)}.
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}