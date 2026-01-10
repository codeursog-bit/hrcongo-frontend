'use client';

import React, { createContext, useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// ============================================
// TYPES
// ============================================

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface Alert {
  id: string;
  type: AlertType;
  title: string;
  message?: string;
  duration?: number;
}

interface AlertContextType {
  showAlert: (alert: Omit<Alert, 'id'>) => void;
  success: (title: string, message?: string, duration?: number) => void;
  error: (title: string, message?: string, duration?: number) => void;
  warning: (title: string, message?: string, duration?: number) => void;
  info: (title: string, message?: string, duration?: number) => void;
}

// ============================================
// CONTEXT
// ============================================

const AlertContext = createContext<AlertContextType | undefined>(undefined);

// ============================================
// PROVIDER
// ============================================

export function AlertProvider({ children }: { children?: React.ReactNode }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const showAlert = (alert: Omit<Alert, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const duration = alert.duration || 4000;
    
    const newAlert: Alert = { ...alert, id, duration };
    setAlerts(prev => [...prev, newAlert]);

    setTimeout(() => {
      removeAlert(id);
    }, duration);
  };

  const removeAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const success = (title: string, message?: string, duration?: number) => 
    showAlert({ type: 'success', title, message, duration });
  
  const error = (title: string, message?: string, duration?: number) => 
    showAlert({ type: 'error', title, message, duration });
  
  const warning = (title: string, message?: string, duration?: number) => 
    showAlert({ type: 'warning', title, message, duration });
  
  const info = (title: string, message?: string, duration?: number) => 
    showAlert({ type: 'info', title, message, duration });

  const getAlertConfig = (type: AlertType) => {
    const configs = {
      success: {
        icon: CheckCircle,
        bgGradient: 'from-emerald-500 to-teal-600',
        bgLight: 'bg-emerald-50 dark:bg-emerald-900/20',
        borderColor: 'border-emerald-200 dark:border-emerald-800',
        textColor: 'text-emerald-900 dark:text-emerald-100',
        iconColor: 'text-emerald-600 dark:text-emerald-400'
      },
      error: {
        icon: XCircle,
        bgGradient: 'from-red-500 to-rose-600',
        bgLight: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800',
        textColor: 'text-red-900 dark:text-red-100',
        iconColor: 'text-red-600 dark:text-red-400'
      },
      warning: {
        icon: AlertTriangle,
        bgGradient: 'from-orange-500 to-amber-600',
        bgLight: 'bg-orange-50 dark:bg-orange-900/20',
        borderColor: 'border-orange-200 dark:border-orange-800',
        textColor: 'text-orange-900 dark:text-orange-100',
        iconColor: 'text-orange-600 dark:text-orange-400'
      },
      info: {
        icon: Info,
        bgGradient: 'from-sky-500 to-blue-600',
        bgLight: 'bg-sky-50 dark:bg-sky-900/20',
        borderColor: 'border-sky-200 dark:border-sky-800',
        textColor: 'text-sky-900 dark:text-sky-100',
        iconColor: 'text-sky-600 dark:text-sky-400'
      }
    };
    return configs[type];
  };

  return (
    <AlertContext.Provider value={{ showAlert, success, error, warning, info }}>
      {children}
      
      <div className="fixed top-24 right-4 z-[9999] flex flex-col gap-3 w-full max-w-md pointer-events-none">
        <AnimatePresence>
          {alerts.map((alert) => {
            const config = getAlertConfig(alert.type);
            const Icon = config.icon;

            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: 100, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 50, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className={`
                  pointer-events-auto
                  ${config.bgLight}
                  backdrop-blur-xl
                  border-2 ${config.borderColor}
                  rounded-2xl
                  shadow-2xl
                  overflow-hidden
                  relative
                  group
                `}
              >
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: 0 }}
                  transition={{ duration: (alert.duration || 4000) / 1000, ease: 'linear' }}
                  className={`absolute top-0 left-0 h-1 bg-gradient-to-r ${config.bgGradient}`}
                />

                <div className="p-4 flex gap-4 items-start">
                  <div className={`shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${config.bgGradient} flex items-center justify-center shadow-lg`}>
                    <Icon size={24} className="text-white" />
                  </div>

                  <div className="flex-1 min-w-0 pt-1">
                    <h4 className={`font-bold text-sm ${config.textColor} mb-1`}>
                      {alert.title}
                    </h4>
                    {alert.message && (
                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                        {alert.message}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => removeAlert(alert.id)}
                    className={`shrink-0 p-1.5 rounded-lg ${config.iconColor} hover:bg-white/20 dark:hover:bg-black/20 transition-colors opacity-0 group-hover:opacity-100`}
                  >
                    <X size={16} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </AlertContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}