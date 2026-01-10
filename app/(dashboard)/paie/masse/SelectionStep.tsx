// ===========================
// FILE: SelectionStep.tsx
// ===========================
import React from 'react';
import { motion } from 'framer-motion';
import { Check, Wallet } from 'lucide-react';

interface SelectionStepProps {
  employees: any[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  estimation: {
    count: number;
    gross: number;
    net: number;
    cost: number;
  };
}

export default function SelectionStep({ employees, selectedIds, onSelectionChange, estimation }: SelectionStepProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: -20 }} 
      className="h-full flex flex-col"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-0">
        
        <div className="lg:col-span-2 flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white">
              Employés ({selectedIds.length}/{employees.length})
            </h3>
            <button 
              onClick={() => onSelectionChange(selectedIds.length === employees.length ? [] : employees.map(e => e.id))} 
              className="text-sm font-bold text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/20 px-3 py-1 rounded-lg"
            >
              {selectedIds.length === employees.length ? 'Tout désélectionner' : 'Tout sélectionner'}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto border border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50 p-2 space-y-1 max-h-[400px]">
            {employees.map(emp => (
              <div 
                key={emp.id} 
                onClick={() => onSelectionChange(selectedIds.includes(emp.id) ? selectedIds.filter(id => id !== emp.id) : [...selectedIds, emp.id])} 
                className={`p-3 rounded-xl flex items-center justify-between cursor-pointer border transition-all ${selectedIds.includes(emp.id) ? 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800' : 'bg-white dark:bg-gray-800 border-transparent hover:border-gray-200'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedIds.includes(emp.id) ? 'bg-sky-500 border-sky-500' : 'border-gray-300'}`}>
                    {selectedIds.includes(emp.id) && <Check size={12} className="text-white"/>}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-900 dark:text-white">{emp.firstName} {emp.lastName}</p>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-gray-600">
                  {Number(emp.baseSalary || 0).toLocaleString()} F
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-black rounded-3xl p-6 text-white shadow-xl sticky top-0">
            <div className="flex items-center gap-2 mb-6 opacity-80">
              <Wallet size={20} />
              <span className="text-sm font-bold uppercase tracking-wider">Estimation</span>
            </div>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Effectif</span>
                <span className="font-bold">{estimation.count}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Total Brut</span>
                <span className="font-mono font-bold">{estimation.gross.toLocaleString()}</span>
              </div>
              <div className="h-px bg-white/10 w-full"></div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-emerald-400 font-bold">Net Estimé</span>
                <span className="font-mono font-bold text-emerald-400 text-lg">{estimation.net.toLocaleString()}</span>
              </div>
              <div className="h-px bg-white/10 w-full"></div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Masse Salariale</p>
                <p className="text-2xl font-bold">{estimation.cost.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}