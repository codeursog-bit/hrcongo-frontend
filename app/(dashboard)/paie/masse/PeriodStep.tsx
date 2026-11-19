// ===========================
// FILE: PeriodStep.tsx
// ===========================
import React from 'react';
import { motion } from 'framer-motion';
import { Badge, Card, Input, Select } from '@/components/design-system/primitives';

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
      className="mx-auto grid max-w-4xl gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(240px,.8fr)]"
    >
      <Card title="Période de paie" action={<Badge tone="info">Étape 1 sur 3</Badge>}>
        <p className="mb-5 text-sm leading-6 text-[var(--text-secondary)]">Choisissez le mois et les paramètres de présence qui serviront à préparer ce lot.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Mois" value={month} onChange={e => onMonthChange(e.target.value)}>
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </Select>
          <Select label="Année" value={year} onChange={e => onYearChange(Number(e.target.value))}>
            {Array.from(new Set([...Array.from({ length: 7 }, (_, i) => Math.max(2020, new Date().getFullYear() - 5) + i), year])).sort((a, b) => a - b).map(y => <option key={y} value={y}>{y}</option>)}
          </Select>
          <div className="sm:col-span-2">
            <Input label="Jours ouvrables" type="number" value={workDays}
              onChange={e => onWorkDaysChange(Number(e.target.value))}
              hint="Utilisés comme référence pour les jours travaillés de chaque bulletin." />
          </div>
        </div>
      </Card>

      <Card title="Avant de continuer">
        <div className="space-y-4 text-sm">
          <p className="leading-6 text-[var(--text-secondary)]">Le lot sera préparé sans enregistrer de bulletin à cette étape.</p>
          <div className="flex items-center justify-between gap-3 rounded-xl bg-[var(--surface-2)] p-3">
            <span className="text-[var(--text-secondary)]">Période choisie</span>
            <Badge tone="neutral">{month} {year}</Badge>
          </div>
          <p className="text-xs leading-5 text-[var(--text-secondary)]">Vous pourrez vérifier la sélection et l’estimation avant de lancer le traitement.</p>
        </div>
      </Card>
    </motion.div>
  );
}