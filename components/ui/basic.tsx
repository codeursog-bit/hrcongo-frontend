'use client';

// components/ui/basic.tsx — composants de base hérités, alignés sur le design system.
// (Aucune page ne les utilise aujourd'hui ; ils suivent les mêmes classes que le reste de l'app.)
import React from 'react';
import '@/components/design-system/design-system.css';
import '@/components/ui/select.css';

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`k-input ${props.className ?? ''}`} />;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { label: string; value: string }[];
}

export function Select({ options, ...props }: SelectProps) {
  return (
    <select {...props} className={`k-input ${props.className ?? ''}`}>
      <option value="">Sélectionner…</option>
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`k-button k-button-primary ${props.className ?? ''}`} />;
}

interface NotificationProps {
  type?: 'success' | 'error' | 'info';
  message: string;
}

export function Notification({ type = 'info', message }: NotificationProps) {
  const tone = { success: 'k-tone-success', error: 'k-tone-danger', info: 'k-tone-info' }[type];
  return (
    <div className={`${tone} text-sm`} role={type === 'error' ? 'alert' : 'status'} style={{ padding: '12px 14px', borderRadius: 'var(--radius-control)' }}>
      {message}
    </div>
  );
}
