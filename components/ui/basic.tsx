'use client';

import React from 'react';

/* =======================
   INPUT
======================= */
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-3 py-2 border rounded-lg outline-none 
      focus:ring-2 focus:ring-cyan-500 ${props.className ?? ''}`}
    />
  );
}

/* =======================
   SELECT
======================= */
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { label: string; value: string }[];
}

export function Select({ options, ...props }: SelectProps) {
  return (
    <select
      {...props}
      className={`w-full px-3 py-2 border rounded-lg outline-none 
      focus:ring-2 focus:ring-cyan-500 ${props.className ?? ''}`}
    >
      <option value="">Sélectionner...</option>
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

/* =======================
   BUTTON
======================= */
export function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement>
) {
  return (
    <button
      {...props}
      className={`px-4 py-2 rounded-lg font-semibold 
      bg-cyan-600 text-white hover:bg-cyan-700 
      disabled:opacity-50 ${props.className ?? ''}`}
    />
  );
}

/* =======================
   NOTIFICATION
======================= */
interface NotificationProps {
  type?: 'success' | 'error' | 'info';
  message: string;
}

export function Notification({ type = 'info', message }: NotificationProps) {
  const colors = {
    success: 'bg-green-100 text-green-700',
    error: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
  };

  return (
    <div className={`p-3 rounded-lg text-sm ${colors[type]}`}>
      {message}
    </div>
  );
}
