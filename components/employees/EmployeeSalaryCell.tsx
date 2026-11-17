'use client';
import React, { useState } from 'react';

/** Reveal in place on hover or keyboard focus, without changing column width. */
export function EmployeeSalaryCell({ value }: { value: number | null }) {
  const [visible, setVisible] = useState(false);
  if (value == null) return <span className="text-[var(--text-secondary)]">—</span>;
  return <button type="button" className="employee-salary-cell" aria-label={visible ? undefined : 'Survoler ou placer le focus pour afficher le salaire'}
    onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}
    onFocus={() => setVisible(true)} onBlur={() => setVisible(false)}
    onClick={event => event.stopPropagation()}>
    <span className="employee-salary-value">{visible ? value.toLocaleString('fr-FR') : '••••••'}{visible && <small> FCFA</small>}</span>
  </button>;
}
