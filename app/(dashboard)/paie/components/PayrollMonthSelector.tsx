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
        className="flex items-center gap-3 bg-white dark:bg-gray-800 p-2 pr-4 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 hover:border-sky-500 transition-all group"
      >
        <div className="bg-sky-100 dark:bg-sky-900/30 text-sky-600 p-2 rounded-xl">
          <Calendar size={20} />
        </div>
        <div className="text-left">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Période</p>
          <div className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
            <span className="capitalize">{selectedMonth}</span>
            <span className="text-sky-600 dark:text-sky-400">{selectedYear}</span>
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
            className="absolute right-0 top-full mt-3 w-72 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 z-50 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 bg-gray-50 dark:bg-gray-800 rounded-xl p-1">
              {YEARS.map(y => (
                <button 
                  key={y}
                  onClick={() => onYearChange(y)}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition-all ${selectedYear === y ? 'bg-white dark:bg-gray-700 shadow text-sky-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
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
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${selectedMonth === m ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
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
