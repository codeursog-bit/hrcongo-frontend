'use client';

import React, { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react';
import { AlertTriangle, Check, Info, X, XCircle } from 'lucide-react';
import { Button } from './primitives';

export function SuccessMark() { return <svg className="k-success-mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="m7 12 3 3 7-7" /></svg>; }

export function Modal({ open, onClose, title, children, actions }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; actions?: React.ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null); const titleId = useId();
  const close = useRef(onClose); close.current = onClose;
  useEffect(() => {
    const el = dialog.current; if (!el || !open) return;
    const previous = document.activeElement as HTMLElement | null;
    el.showModal();
    return () => { el.close(); previous?.focus(); };
  }, [open]);
  return (
    <dialog
      ref={dialog}
      className="k-modal"
      aria-labelledby={titleId}
      onCancel={event => { event.preventDefault(); close.current(); }}
      onKeyDown={event => {
        if (event.key === 'Escape') {
          event.preventDefault();
          close.current();
        }
      }}
      onClick={event => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close.current();
      }}
    >
      <header className="k-card-header">
        <h2 id={titleId}>{title}</h2>
        <Button variant="ghost" aria-label="Fermer la fenêtre" onClick={onClose}><X size={20} strokeWidth={1.5} /></Button>
      </header>
      <div>{children}</div>
      {actions && <footer className="k-modal-actions">{actions}</footer>}
    </dialog>
  );
}

type ToastKind = 'success' | 'error' | 'warning' | 'info';
type Toast = { id: number; kind: ToastKind; title: string; message?: string; duration: number };
type Notify = (kind: ToastKind, title: string, message?: string) => void;
const ToastContext = createContext<Notify | null>(null);
function ToastItem({ toast, remove }: { toast: Toast; remove: (id: number) => void }) {
  const [paused, setPaused] = useState(false);
  const remaining = useRef(toast.duration);
  useEffect(() => {
    if (paused) return;
    const start = Date.now(); const timer = setTimeout(() => remove(toast.id), remaining.current);
    return () => { clearTimeout(timer); remaining.current = Math.max(0, remaining.current - (Date.now() - start)); };
  }, [paused, remove, toast.id]);
  const Icon = { success: Check, error: XCircle, warning: AlertTriangle, info: Info }[toast.kind];
  return <div className={`k-toast k-tone-${toast.kind === 'error' ? 'danger' : toast.kind}`} role={toast.kind === 'error' ? 'alert' : 'status'} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={e => { if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false); }}>
    {toast.kind === 'success' ? <SuccessMark /> : <Icon size={22} strokeWidth={1.5} aria-hidden="true" />}<div className="k-grow"><strong>{toast.title}</strong>{toast.message && <p>{toast.message}</p>}</div><Button variant="ghost" aria-label={`Fermer : ${toast.title}`} onClick={() => remove(toast.id)}><X size={16} strokeWidth={1.5} /></Button><span className="k-toast-progress" style={{ animationDuration: `${toast.duration}ms`, animationPlayState: paused ? 'paused' : 'running' }} /></div>;
}
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]); const id = useRef(0);
  const remove = useCallback((key: number) => setToasts(items => items.filter(t => t.id !== key)), []);
  const notify = useCallback<Notify>((kind, title, message) => { const key = ++id.current; setToasts(items => [...items.slice(-4), { id: key, kind, title, message, duration: kind === 'error' ? 7000 : 4000 }]); }, []);
  return <ToastContext.Provider value={notify}>{children}<div className="k-toasts" aria-label="Notifications">{toasts.map(t => <ToastItem key={t.id} toast={t} remove={remove} />)}</div></ToastContext.Provider>;
}
export function useToast() { const notify = useContext(ToastContext); if (!notify) throw new Error('ToastProvider requis'); return notify; }
