'use client';
import { LegacyAlerts } from '@/components/providers/legacy-feedback';
import { FeedbackVariants, FeedbackViewport, FeedbackToast } from '@/components/ui/Feedback';

import React, { createContext, useContext, useState } from 'react';



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
  expiresAt?: number;
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

    const newAlert: Alert = { ...alert, id, duration, expiresAt:Date.now()+duration };
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



  return (
    <AlertContext.Provider value={{ showAlert, success, error, warning, info }}>
      {children}

      <FeedbackVariants legacy={<LegacyAlerts alerts={alerts} removeAlert={removeAlert} />}><FeedbackViewport label="Alertes">{alerts.map(alert => <FeedbackToast key={alert.id} tone={alert.type} title={alert.title} message={alert.message} duration={alert.duration} expiresAt={alert.expiresAt} onClose={() => removeAlert(alert.id)} />)}</FeedbackViewport></FeedbackVariants>
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
