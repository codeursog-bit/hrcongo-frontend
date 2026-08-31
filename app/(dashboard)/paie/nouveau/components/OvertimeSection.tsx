'use client';
import React from 'react';
import { Clock, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

interface OvertimeSectionProps {
  month: string;
  year: number;
  overtime10: number;
  overtime25: number;
  overtime50: number;
  overtime100: number;
  onOvertime10Change: (value: number) => void;
  onOvertime25Change: (value: number) => void;
  onOvertime50Change: (value: number) => void;
  onOvertime100Change: (value: number) => void;
  overtimeRate10: number;
  overtimeRate25: number;
  overtimeRate50: number;
  overtimeRate100: number;
}

export default function OvertimeSection({
  month, year,
  overtime10, overtime25, overtime50, overtime100,
  onOvertime10Change, onOvertime25Change, onOvertime50Change, onOvertime100Change,
  overtimeRate10, overtimeRate25, overtimeRate50, overtimeRate100
}: OvertimeSectionProps) {
  const totalOvertime = overtime10 + overtime25 + overtime50 + overtime100;
  const hasOvertime = totalOvertime > 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10 rounded-2xl border border-orange-200 dark:border-orange-800 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-orange-900 dark:text-orange-200 flex items-center gap-2">
          <Clock size={20} /> Heures Supplémentaires
        </h3>
        {totalOvertime > 0 && (
          <span className="text-xs font-bold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-3 py-1 rounded-full">
            {totalOvertime.toFixed(1)}h total
          </span>
        )}
      </div>

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

      {/* Jours normaux */}
      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
        Jours normaux (Art. 20 Décret 78-360)
      </p>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm mb-1 font-medium text-amber-700 dark:text-amber-300">
            HS +{overtimeRate10}% (heures)
            <span className="text-xs font-normal text-gray-500 ml-1">5 premières</span>
          </label>
          <input
            type="number"
            step="0.5"
            min="0"
            value={overtime10}
            onChange={e => onOvertime10Change(Number(e.target.value) || 0)}
            className="w-full p-3 border border-orange-200 dark:border-orange-800 rounded-xl bg-white dark:bg-gray-800 font-mono text-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Ex: 5h = 5, 30min = 0.5</p>
        </div>
        <div>
          <label className="block text-sm mb-1 font-medium text-orange-700 dark:text-orange-300">
            HS +{overtimeRate25}% (heures)
            <span className="text-xs font-normal text-gray-500 ml-1">suivantes</span>
          </label>
          <input
            type="number"
            step="0.5"
            min="0"
            value={overtime25}
            onChange={e => onOvertime25Change(Number(e.target.value) || 0)}
            className="w-full p-3 border border-orange-200 dark:border-orange-800 rounded-xl bg-white dark:bg-gray-800 font-mono text-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Ex: 2h = 2, 45min = 0.75</p>
        </div>
      </div>

      {/* Nuit & Fériés */}
      <div className="pt-4 border-t border-orange-200 dark:border-orange-800/50">
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Moon size={12} /> Nuit &amp; Jours fériés (20h–5h)
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1 font-medium text-purple-700 dark:text-purple-300">
              HS +{overtimeRate50}% (heures)
              <span className="text-xs font-normal text-gray-500 ml-1">nuit repos/férié</span>
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={overtime50}
              onChange={e => onOvertime50Change(Number(e.target.value) || 0)}
              className="w-full p-3 border border-purple-200 dark:border-purple-800 rounded-xl bg-white dark:bg-gray-800 font-mono text-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Ex: 2h = 2, 45min = 0.75</p>
          </div>
          <div>
            <label className="block text-sm mb-1 font-medium text-red-700 dark:text-red-300">
              HS +{overtimeRate100}% (heures)
              <span className="text-xs font-normal text-gray-500 ml-1">nuit dimanche/JF</span>
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={overtime100}
              onChange={e => onOvertime100Change(Number(e.target.value) || 0)}
              className="w-full p-3 border border-red-200 dark:border-red-800 rounded-xl bg-white dark:bg-gray-800 font-mono text-lg focus:outline-none focus:ring-2 focus:ring-red-500/20"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Ex: 3h = 3, 30min = 0.5</p>
          </div>
        </div>
      </div>

      {totalOvertime > 15 && (
        <div className={`mt-4 p-3 rounded-lg border text-xs font-medium flex items-start gap-2 ${
          totalOvertime >= 20
            ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
            : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
        }`}>
          <Clock size={14} className="mt-0.5 shrink-0" />
          <span>
            {totalOvertime >= 20
              ? `⚠️ Limite légale atteinte : ${totalOvertime.toFixed(1)}h / 20h max/semaine (Art. 2 Décret 78-360)`
              : `⏳ ${totalOvertime.toFixed(1)}h / 20h max hebdomadaires autorisées`}
          </span>
        </div>
      )}
    </motion.section>
  );
}