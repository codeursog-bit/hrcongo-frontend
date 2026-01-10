'use client';
import React from 'react';
import { Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface OvertimeSectionProps {
  month: string;
  year: number;
  overtime15: number;
  overtime50: number;
  onOvertime15Change: (value: number) => void;
  onOvertime50Change: (value: number) => void;
  overtimeRate15: number;
  overtimeRate50: number;
}

export default function OvertimeSection({
  month,
  year,
  overtime15,
  overtime50,
  onOvertime15Change,
  onOvertime50Change,
  overtimeRate15,
  overtimeRate50
}: OvertimeSectionProps) {
  const hasOvertime = overtime15 > 0 || overtime50 > 0;

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10 rounded-2xl border border-orange-200 dark:border-orange-800 p-6"
    >
      <h3 className="text-lg font-bold text-orange-900 dark:text-orange-200 mb-4 flex items-center gap-2">
        <Clock size={20} /> Heures Supplémentaires
      </h3>
      
      {hasOvertime && (
        <div className="mb-4 p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
          <p className="text-sm text-orange-800 dark:text-orange-300 font-medium">
            ✅ Heures sup détectées pour {month} {year}
          </p>
          <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
            Ces valeurs ont été chargées automatiquement depuis le système de pointage
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1 font-medium text-orange-700 dark:text-orange-300">
            HS +{overtimeRate15}% (heures)
          </label>
          <input 
            type="number" 
            step="0.5"
            value={overtime15} 
            onChange={e => onOvertime15Change(Number(e.target.value) || 0)}
            className="w-full p-3 border border-orange-200 dark:border-orange-800 rounded-xl bg-white dark:bg-gray-800 font-mono text-lg" 
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Ex: 5h = 5, 30min = 0.5
          </p>
        </div>
        <div>
          <label className="block text-sm mb-1 font-medium text-orange-700 dark:text-orange-300">
            HS +{overtimeRate50}% (heures)
          </label>
          <input 
            type="number" 
            step="0.5"
            value={overtime50} 
            onChange={e => onOvertime50Change(Number(e.target.value) || 0)}
            className="w-full p-3 border border-orange-200 dark:border-orange-800 rounded-xl bg-white dark:bg-gray-800 font-mono text-lg" 
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Ex: 2h = 2, 45min = 0.75
          </p>
        </div>
      </div>
    </motion.section>
  );
}