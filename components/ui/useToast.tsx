'use client';

// components/ui/useToast.tsx
// Toasts de l'application : mêmes composants visuels que le design system (.k-toast).
// L'API ne change pas : useToast().success / error / warning / info(titre, message?).
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { FeedbackVariants, FeedbackViewport } from '@/components/ui/Feedback';
import { ToastCountdown } from './ToastCountdown';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Info, X, XCircle } from 'lucide-react';
import { SuccessMark } from '@/components/design-system/feedback';
import '@/components/design-system/design-system.css';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  toast: {
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
  };
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE: Record<ToastType, string> = { success: 'success', error: 'danger', warning: 'warning', info: 'info' };

function ToastItem({ toast, onRemove, timed=false }: { toast: Toast; onRemove: (id: string) => void; timed?:boolean }) {
  const [paused, setPaused] = useState(false);
  const remaining = useRef(toast.duration ?? (toast.type === 'error' ? 7000 : 4000));

  // Le minuteur s'arrête quand la souris est sur le toast.
  useEffect(() => {
    if (paused) return;
    const start = Date.now();
    const timer = setTimeout(() => onRemove(toast.id), remaining.current);
    return () => { clearTimeout(timer); remaining.current = Math.max(0, remaining.current - (Date.now() - start)); };
  }, [paused, toast.id, onRemove]);

  return (
    <motion.div
      layout
      initial={false}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className={`k-toast ${timed ? 'feedback-timed-toast' : ''} k-tone-${TONE[toast.type]}`}
      role={toast.type === 'error' ? 'alert' : 'status'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); }}
    >
      {toast.type === 'success' ? <SuccessMark />
        : toast.type === 'error' ? <XCircle size={22} strokeWidth={1.5} aria-hidden="true" />
        : toast.type === 'warning' ? <AlertTriangle size={22} strokeWidth={1.5} aria-hidden="true" />
        : <Info size={22} strokeWidth={1.5} aria-hidden="true" />}

      <div className="k-grow">
        <strong>{toast.title}</strong>
        {toast.message && <p>{toast.message}</p>}
      </div>

      <button type="button" onClick={() => onRemove(toast.id)} aria-label="Fermer la notification" className="shell-icon-btn" style={{ minWidth: 28, minHeight: 28, padding: 0 }}>
        <X size={16} strokeWidth={1.5} aria-hidden="true" />
      </button>
      {timed && <ToastCountdown duration={toast.duration ?? (toast.type === 'error' ? 7000 : 4000)} paused={paused}/>}
    </motion.div>
  );
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <FeedbackVariants legacy={<div className="k-toasts" aria-label="Notifications"><AnimatePresence mode="popLayout">{toasts.map(t => <ToastItem key={t.id} toast={t} onRemove={onRemove} />)}</AnimatePresence></div>}>
    <FeedbackViewport label="Notifications">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={onRemove} timed />
        ))}
      </AnimatePresence>
    </FeedbackViewport>
    </FeedbackVariants>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const add = useCallback((type: ToastType, title: string, message?: string, duration?: number) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev.slice(-4), { id, type, title, message, duration }]);
  }, []);

  const value: ToastContextValue = {
    toast: {
      success: (title, message) => add('success', title, message),
      error: (title, message) => add('error', title, message),
      warning: (title, message) => add('warning', title, message),
      info: (title, message) => add('info', title, message),
    },
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={remove} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx.toast;
}
