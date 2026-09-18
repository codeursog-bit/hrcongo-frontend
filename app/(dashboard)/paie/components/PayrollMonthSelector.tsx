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
            className="absolute right-0 top-full mt-3 w-72 bg-[var(--surface)] rounded-2xl shadow-2xl border border-[var(--border)] p-4 z-50 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 bg-[var(--surface-2)] rounded-xl p-1">
              {YEARS.map(y => (
                <button 
                  key={y}
                  onClick={() => onYearChange(y)}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition-all ${selectedYear === y ? 'bg-[var(--surface)] shadow text-emerald-600' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}
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
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${selectedMonth === m ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)]'}`}
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