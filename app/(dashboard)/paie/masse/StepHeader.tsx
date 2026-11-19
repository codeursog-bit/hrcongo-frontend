// ===========================
// FILE: StepHeader.tsx
// ===========================
import React from 'react';
import { Calendar, Clock, Check, Play } from 'lucide-react';
import { Badge } from '@/components/design-system/primitives';

const STEPS = [
  { id: 1, label: 'Période', icon: Calendar },
  { id: 2, label: 'Sélection', icon: Clock },
  { id: 3, label: 'Traitement', icon: Play },
];

interface StepHeaderProps {
  currentStep: number;
}

export default function StepHeader({ currentStep }: StepHeaderProps) {
  return (
    <ol aria-label="Étapes de génération de la paie" className="grid grid-cols-1 gap-3 border-b border-[var(--border)] p-4 sm:grid-cols-3">
      {STEPS.map((s) => {
        const isActive = currentStep === s.id;
        const isDone = currentStep > s.id;
        return (
          <li key={s.id} aria-current={isActive ? 'step' : undefined}
            className={`flex min-w-0 items-center gap-3 rounded-xl border p-3 transition-colors ${
              isActive ? 'border-[var(--brand-soft)] bg-[var(--brand-soft)]' :
              isDone ? 'border-[var(--border)] bg-[var(--surface)]' : 'border-transparent bg-[var(--surface-2)]'
            }`}>
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              isDone ? 'bg-[var(--green)] text-[var(--on-brand)]' :
              isActive ? 'bg-[var(--action)] text-[var(--on-brand)]' : 'bg-[var(--surface)] text-[var(--text-secondary)]'
            }`}>
              {isDone ? <Check size={18} strokeWidth={1.5} /> : <s.icon size={18} strokeWidth={1.5} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-medium uppercase tracking-wide text-[var(--text-secondary)]">Étape {s.id}</span>
              <span className="block truncate text-sm font-semibold text-[var(--text)]">{s.label}</span>
            </span>
            <Badge tone={isDone ? 'success' : isActive ? 'info' : 'neutral'}>
              {isDone ? 'Terminée' : isActive ? 'En cours' : 'À venir'}
            </Badge>
          </li>
        );
      })}
    </ol>
  );
}