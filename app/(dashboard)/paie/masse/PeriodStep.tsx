// ===========================
// FILE: PeriodStep.tsx
// ===========================
import React from 'react';
import { motion } from 'framer-motion';

const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

interface PeriodStepProps {
  month: string;
  year: number;
  workDays: number;
  onMonthChange: (month: string) => void;
  onYearChange: (year: number) => void;
  onWorkDaysChange: (days: number) => void;
}

export default function PeriodStep({ month, year, workDays, onMonthChange, onYearChange, onWorkDaysChange }: PeriodStepProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: -20 }} 
      className="max-w-lg mx-auto space-y-8"
    >
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Période de Paie</h2>
        <p className="text-gray-500 text-sm mt-1">Sélectionnez le mois de référence.</p>
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase">Mois</label>
          <select 
            value={month} 
            onChange={e => onMonthChange(e.target.value)} 
            className="w-full p-4 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-2xl font-bold text-lg focus:ring-2 focus:ring-sky-500/20 outline-none"
          >
            {MONTHS.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase">Année</label>
          <select 
            value={year} 
            onChange={e => onYearChange(Number(e.target.value))} 
            className="w-full p-4 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-2xl font-bold text-lg focus:ring-2 focus:ring-sky-500/20 outline-none"
          >
            <option>2024</option>
            <option>2025</option>
            <option>2026</option>
          </select>
        </div>
        <div className="col-span-2 space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase">Jours Ouvrables</label>
          <input 
            type="number" 
            value={workDays} 
            onChange={e => onWorkDaysChange(Number(e.target.value))} 
            className="w-full p-4 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-2xl font-bold text-lg focus:ring-2 focus:ring-sky-500/20 outline-none"
          />
        </div>
      </div>
    </motion.div>
  );
}