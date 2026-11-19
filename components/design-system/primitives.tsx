'use client';

import React, { forwardRef, useId } from 'react';
import { Inbox, Loader2, type LucideIcon } from 'lucide-react';
import './design-system.css';

export function Card({ title, action, children, className = '', ...props }: React.HTMLAttributes<HTMLElement> & { title?: string; action?: React.ReactNode }) {
  return <section {...props} className={`k-card ${className}`}>
    {(title || action) && <header className="k-card-header"><h3>{title}</h3>{action}</header>}{children}
  </section>;
}

export const Button = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'; loading?: boolean;
}>(function Button({ variant = 'primary', loading, disabled, children, className = '', type = 'button', ...props }, ref) {
  return <button {...props} type={type} ref={ref} disabled={disabled || loading} aria-busy={loading || undefined} className={`k-button k-button-${variant} ${className}`}>
    {loading && <Loader2 className="k-spin" size={18} strokeWidth={1.5} aria-hidden="true" />}{children}
  </button>;
});

type FieldMeta = { label: string; hint?: string; error?: string };
export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & FieldMeta>(function Input({ label, hint, error, id, className = '', ...props }, ref) {
  const generated = useId(); const fieldId = id || generated;
  return <div className="k-field"><label htmlFor={fieldId}>{label}</label><input {...props} ref={ref} id={fieldId} className={`k-input ${className}`} aria-invalid={!!error} aria-describedby={error || hint ? `${fieldId}-message` : undefined} />
    {(error || hint) && <p id={`${fieldId}-message`} className={error ? 'k-error' : 'k-help'}>{error || hint}</p>}</div>;
});
export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & FieldMeta>(function Select({ label, hint, error, id, children, ...props }, ref) {
  const generated = useId(); const fieldId = id || generated;
  return <div className="k-field"><label htmlFor={fieldId}>{label}</label><select {...props} ref={ref} id={fieldId} className="k-input" aria-invalid={!!error} aria-describedby={error || hint ? `${fieldId}-message` : undefined}>{children}</select>
    {(error || hint) && <p id={`${fieldId}-message`} className={error ? 'k-error' : 'k-help'}>{error || hint}</p>}</div>;
});
export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & FieldMeta>(function Textarea({ label, hint, error, id, ...props }, ref) {
  const generated = useId(); const fieldId = id || generated;
  return <div className="k-field"><label htmlFor={fieldId}>{label}</label><textarea {...props} ref={ref} id={fieldId} className="k-input" aria-invalid={!!error} aria-describedby={error || hint ? `${fieldId}-message` : undefined} />
    {(error || hint) && <p id={`${fieldId}-message`} className={error ? 'k-error' : 'k-help'}>{error || hint}</p>}</div>;
});

export type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';
export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: React.ReactNode }) {
  return <span className={`k-badge k-tone-${tone}`}>{children}</span>;
}
export function EmptyState({ title, children, action, icon: Icon = Inbox }: { title: string; children: React.ReactNode; action?: React.ReactNode; icon?: LucideIcon }) {
  return <div className="k-empty"><Icon size={42} strokeWidth={1.5} aria-hidden="true" /><h3>{title}</h3><p>{children}</p>{action}</div>;
}
export function Skeleton({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} aria-hidden="true" className={`k-skeleton ${className}`} />;
}
export function TableSkeleton() {
  return <div role="status" aria-label="Chargement des employés" className="k-stack"><span className="k-sr-only">Chargement des employés…</span>{[0, 1, 2].map(i => <div key={i} className="k-skeleton-row"><Skeleton className="k-avatar-skeleton" /><div className="k-stack k-grow"><Skeleton /><Skeleton className="k-short" /></div><Skeleton className="k-badge-skeleton" /></div>)}</div>;
}

export interface Column<T> { key: string; label: string; render: (row: T) => React.ReactNode; sort?: 'ascending' | 'descending' | 'none'; onSort?: () => void }
export function DataTable<T>({ caption, columns, rows, rowKey, empty }: { caption: string; columns: Column<T>[]; rows: T[]; rowKey: (row: T) => string; empty?: React.ReactNode }) {
  if (!rows.length) return <>{empty || <EmptyState title="La liste est prête à accueillir votre équipe">Ajoutez un premier employé pour commencer.</EmptyState>}</>;
  return <><div className="k-table-desktop"><table className="k-table"><caption className="k-sr-only">{caption}</caption><thead><tr>{columns.map(c => <th key={c.key} scope="col" aria-sort={c.sort}>{c.onSort ? <button type="button" onClick={c.onSort}>{c.label}<span aria-hidden="true"> {c.sort === 'descending' ? '↓' : '↑'}</span></button> : c.label}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={rowKey(row)}>{columns.map(c => <td key={c.key}>{c.render(row)}</td>)}</tr>)}</tbody></table></div>
    <ul className="k-table-mobile" aria-label={caption}>{rows.map(row => <li key={rowKey(row)}><dl>{columns.map(c => <div key={c.key}><dt>{c.label}</dt><dd>{c.render(row)}</dd></div>)}</dl></li>)}</ul></>;
}
