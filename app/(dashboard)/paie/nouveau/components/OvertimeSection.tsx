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
      className="bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]  rounded-2xl border border-[var(--border)]  p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[var(--warning-text)]  flex items-center gap-2">
          <Clock size={20} /> Heures Supplémentaires
        </h3>
        {totalOvertime > 0 && (
          <span className="text-xs font-semibold bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]  text-[var(--warning-text)]  px-3 py-1 rounded-full">
            {totalOvertime.toFixed(1)}h total
          </span>
        )}
      </div>

      {hasOvertime && (
        <div className="mb-4 p-3 bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]  rounded-lg border border-[var(--border)] ">
          <p className="text-sm text-[var(--warning-text)]  font-medium">
            ✅ Heures sup détectées pour {month} {year}
          </p>
          <p className="text-xs text-[var(--warning-text)]  mt-1">
            Ces valeurs ont été chargées automatiquement depuis le système de pointage
          </p>
        </div>
      )}

      {/* Jours normaux */}
      <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
        Jours normaux (Art. 20 Décret 78-360)
      </p>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm mb-1 font-medium text-[var(--warning-text)] ">
            HS +{overtimeRate10}% (heures)
            <span className="text-xs font-normal text-[var(--text-secondary)] ml-1">5 premières</span>
          </label>
          <input
            type="number"
            step="0.5"
            min="0"
            value={overtime10}
            onChange={e => onOvertime10Change(Number(e.target.value) || 0)}
            className="w-full p-3 border border-[var(--border)]  rounded-xl bg-[var(--surface)] font-mono text-lg focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
          />
          <p className="text-xs text-[var(--text-muted)] mt-1">Ex: 5h = 5, 30min = 0.5</p>
        </div>
        <div>
          <label className="block text-sm mb-1 font-medium text-[var(--warning-text)] ">
            HS +{overtimeRate25}% (heures)
            <span className="text-xs font-normal text-[var(--text-secondary)] ml-1">suivantes</span>
          </label>
          <input
            type="number"
            step="0.5"
            min="0"
            value={overtime25}
            onChange={e => onOvertime25Change(Number(e.target.value) || 0)}
            className="w-full p-3 border border-[var(--border)]  rounded-xl bg-[var(--surface)] font-mono text-lg focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
          />
          <p className="text-xs text-[var(--text-muted)] mt-1">Ex: 2h = 2, 45min = 0.75</p>
        </div>
      </div>

      {/* Nuit & Fériés */}
      <div className="pt-4 border-t border-[var(--border)] ">
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Moon size={12} /> Nuit &amp; Jours fériés (20h–5h)
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1 font-medium text-[var(--warning-text)] ">
              HS +{overtimeRate50}% (heures)
              <span className="text-xs font-normal text-[var(--text-secondary)] ml-1">nuit repos/férié</span>
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={overtime50}
              onChange={e => onOvertime50Change(Number(e.target.value) || 0)}
              className="w-full p-3 border border-[var(--border)]  rounded-xl bg-[var(--surface)] font-mono text-lg focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">Ex: 2h = 2, 45min = 0.75</p>
          </div>
          <div>
            <label className="block text-sm mb-1 font-medium text-[var(--warning-text)] ">
              HS +{overtimeRate100}% (heures)
              <span className="text-xs font-normal text-[var(--text-secondary)] ml-1">nuit dimanche/JF</span>
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={overtime100}
              onChange={e => onOvertime100Change(Number(e.target.value) || 0)}
              className="w-full p-3 border border-[var(--border)]  rounded-xl bg-[var(--surface)] font-mono text-lg focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">Ex: 3h = 3, 30min = 0.5</p>
          </div>
        </div>
      </div>

      {totalOvertime > 15 && (
        <div className={`mt-4 p-3 rounded-lg border text-xs font-medium flex items-start gap-2 ${
          totalOvertime >= 20
            ? 'bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))]  border-[var(--border)]  text-[var(--danger-text)] '
            : 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]  border-[var(--border)]  text-[var(--warning-text)] '
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