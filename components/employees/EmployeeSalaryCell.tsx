'use client';
import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/** Salary visibility is an explicit choice, never a hover-driven layout change. */
export function EmployeeSalaryCell({ value }: { value: number | null }) {
  const [visible, setVisible] = useState(false);
  if (value == null) return <span className="text-[var(--text-secondary)]">—</span>;
  return <div className="employee-salary-cell">
    <span className="employee-salary-value">{visible ? value.toLocaleString('fr-FR') : '••••••'}{visible && <small> FCFA</small>}</span>
    <button type="button" aria-label={visible ? 'Masquer le salaire' : 'Afficher le salaire'} aria-pressed={visible}
      onClick={event => { event.stopPropagation(); setVisible(current => !current); }}>
      {visible ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
    </button>
  </div>;
}
