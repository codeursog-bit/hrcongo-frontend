'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// ============================================================
// TYPES
// ============================================================

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

// ============================================================
// CONTEXT
// ============================================================

const ToastContext = createContext<ToastContextValue | null>(null);

// ============================================================
// TOAST CONFIG
// ============================================================

const TOAST_CONFIG: Record<ToastType, {
  icon: React.ElementType;
  iconColor: string;
  borderColor: string;
  bgGlow: string;
}> = {
  success: {
    icon: CheckCircle2,
    iconColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/40',
    bgGlow: 'from-emerald-500/10',
  },
  error: {
    icon: XCircle,
    iconColor: 'text-red-400',
    borderColor: 'border-red-500/40',
    bgGlow: 'from-red-500/10',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-yellow-400',
    borderColor: 'border-yellow-500/40',
    bgGlow: 'from-yellow-500/10',
  },
  info: {
    icon: Info,
    iconColor: 'text-cyan-400',
    borderColor: 'border-cyan-500/40',
    bgGlow: 'from-cyan-500/10',
  },
};

// ============================================================
// SINGLE TOAST COMPONENT
// ============================================================

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const config = TOAST_CONFIG[toast.type];
  const Icon = config.icon;

  useEffect(() => {
    const duration = toast.duration ?? 4000;
    const timer = setTimeout(() => onRemove(toast.id), duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`
        relative flex items-start gap-3 w-[360px] max-w-[90vw]
        bg-gradient-to-br ${config.bgGlow} to-slate-900/95
        backdrop-blur-xl border ${config.borderColor}
        rounded-2xl px-4 py-4 shadow-2xl shadow-black/40
        overflow-hidden
      `}
    >
      {/* Glow bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${
        toast.type === 'success' ? 'bg-emerald-500' :
        toast.type === 'error' ? 'bg-red-500' :
        toast.type === 'warning' ? 'bg-yellow-500' :
        'bg-cyan-500'
      }`} />

      <div className={`shrink-0 mt-0.5 ${config.iconColor}`}>
        <Icon size={20} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-bold text-white text-sm leading-tight">{toast.title}</p>
        {toast.message && (
          <p className="text-slate-400 text-xs mt-1 leading-relaxed">{toast.message}</p>
        )}
      </div>

      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 text-slate-500 hover:text-white transition-colors mt-0.5"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
}

// ============================================================
// TOAST CONTAINER
// ============================================================

function ToastContainer({ toasts, onRemove }: {
  toasts: Toast[];
  onRemove: (id: string) => void;
}) {
  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onRemove={onRemove} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// PROVIDER
// ============================================================

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

// ============================================================
// HOOK
// ============================================================

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx.toast;
}