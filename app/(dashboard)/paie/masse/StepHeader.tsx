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
    <div className="grid grid-cols-3 border-b border-gray-100 dark:border-gray-700">
      {STEPS.map((s) => {
        const isActive = currentStep === s.id;
        const isDone = currentStep > s.id;
        return (
          <div 
            key={s.id} 
            className={`relative flex flex-col items-center justify-center py-6 transition-colors ${isActive ? 'bg-sky-50/50 dark:bg-sky-900/10' : ''}`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all ${isActive ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30 scale-110' : isDone ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
              {isDone ? <Check size={20} /> : <s.icon size={20}/>}
            </div>
            <span className={`text-xs font-bold uppercase tracking-wider ${isActive ? 'text-sky-600 dark:text-sky-400' : isDone ? 'text-emerald-600' : 'text-gray-400'}`}>
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
