'use client';
import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/** Presentation only: do not mutate the notification store or its unread counters. */
export function recentNotifications<T extends { createdAt?: string | null }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const first = new Date(a.createdAt || '').getTime();
    const second = new Date(b.createdAt || '').getTime();
    return (Number.isFinite(second) ? second : 0) - (Number.isFinite(first) ? first : 0);
  }).slice(0, 5);
}

export function NotificationPopover({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose); close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const element = ref.current;
    element?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
    return () => { if (previous?.isConnected && (element?.contains(document.activeElement) || document.activeElement === document.body)) previous.focus({ preventScroll: true }); };
  }, []);
  return <div ref={ref} role="dialog" aria-label="Notifications récentes" className="shell-menu shell-notifications-popover" onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close.current();}}}>
    <button type="button" className="shell-icon-btn shell-notifications-close" aria-label="Fermer les notifications" onClick={onClose}><X size={18} strokeWidth={1.5} aria-hidden="true" /></button>
    {children}
  </div>;
}
