// ===========================
// FILE: StepHeader.tsx
// ===========================
import React from 'react';
import { Calendar, Clock, Check, Play } from 'lucide-react';

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
    <div className="grid grid-cols-3 border-b border-[var(--border)]">
      {STEPS.map((s) => {
        const isActive = currentStep === s.id;
        const isDone = currentStep > s.id;
        return (
          <div 
            key={s.id} 
            className={`relative flex flex-col items-center justify-center py-6 transition-colors ${isActive ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''}`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all ${isActive ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-110' : isDone ? 'bg-emerald-500/60 text-white' : 'bg-[var(--surface-2)] text-gray-400'}`}>
              {isDone ? <Check size={20} /> : <s.icon size={20}/>}
            </div>
            <span className={`text-xs font-bold uppercase tracking-wider ${isActive ? 'text-emerald-600 dark:text-emerald-400' : isDone ? 'text-emerald-600' : 'text-gray-400'}`}>
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}