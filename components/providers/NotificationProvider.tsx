'use client';

// ============================================================================
// 📁 components/providers/NotificationProvider.tsx
// ✅ v2 :
//    - toasts déplacés en bas de l'écran (bottom-right), moins intrusifs
//    - chaque toast est cliquable → renvoie vers la page de gestion concernée
//    - au chargement (login / refresh), un toast de SYNTHÈSE est généré par
//      type de demande en attente (absences / permissions / congés), pour
//      que le RH/Admin ne rate jamais un backlog accumulé pendant son absence
//      — jusqu'ici, seuls les événements temps réel (websocket) déclenchaient
//      un toast, donc tout ce qui arrivait hors ligne passait inaperçu.
//    - le flux temps réel (websocket) existant est conservé tel quel.
// ============================================================================

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, UserCheck, AlertTriangle, Info, GraduationCap, CheckCircle,
  FileText, Ticket, Calendar,
} from 'lucide-react';
import { io } from 'socket.io-client';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';

type NotificationType = 'CHECK_IN' | 'ALERT' | 'INFO' | 'TRAINING' | 'SUCCESS' | 'ABSENCE' | 'PERMISSION' | 'LEAVE';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  avatar?: string;
  time: string;
  link?: string; // chemin (relatif, sans basePath) vers la page de gestion concernée
}

interface NotificationContextType {
  addNotification: (notif: Omit<Notification, 'id' | 'time'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const APPROVER_ROLES = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'MANAGER'];

export function NotificationProvider({ children }: { children?: React.ReactNode }) {
  const router = useRouter();
  const { bp } = useBasePath();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [mutedUntil, setMutedUntil] = useState<number | null>(null);

  // --- WEBSOCKET : événements temps réel ---
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
      withCredentials: true,
    });

    socket.on('admin-notification', (data: any) => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (APPROVER_ROLES.includes(user.role)) {
          addNotification({ ...data, link: data.link });
        }
      }
    });

    socket.on('company-notification', (data: any) => {
      addNotification({ type: 'INFO', title: data.title, message: data.message, link: data.link });
    });

    return () => { socket.disconnect(); };
  }, []);

  // --- SYNTHÈSE AU CHARGEMENT : un toast par type de demande en attente ---
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return;
    let user: any;
    try { user = JSON.parse(storedUser); } catch { return; }
    if (!APPROVER_ROLES.includes(user.role)) return;

    (async () => {
      try {
        const counts: any = await api.get('/dashboard/pending-requests-count');

        if (counts.absences > 0) {
          addNotification({
            type: 'ABSENCE',
            title: '📋 Demandes d\u2019absence en attente',
            message: `Vous avez ${counts.absences} demande${counts.absences > 1 ? 's' : ''} d\u2019absence à traiter`,
            link: '/presences/absences',
          });
        }
        if (counts.permissions > 0) {
          addNotification({
            type: 'PERMISSION',
            title: '🎫 Tickets de permission en attente',
            message: `Vous avez ${counts.permissions} demande${counts.permissions > 1 ? 's' : ''} de permission à traiter`,
            link: '/presences/permissions',
          });
        }
        if (counts.leaves > 0) {
          addNotification({
            type: 'LEAVE',
            title: '🌴 Demandes de congé en attente',
            message: `Vous avez ${counts.leaves} demande${counts.leaves > 1 ? 's' : ''} de congé à traiter`,
            link: '/conges',
          });
        }
      } catch (e) {
        console.error('Erreur chargement synthèse des demandes en attente', e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const muteTimestamp = localStorage.getItem('notifications_muted_until');
    if (muteTimestamp) {
      const ts = parseInt(muteTimestamp);
      if (ts > Date.now()) setMutedUntil(ts);
      else localStorage.removeItem('notifications_muted_until');
    }
  }, []);

  const addNotification = (notif: Omit<Notification, 'id' | 'time'>) => {
    if (mutedUntil && mutedUntil > Date.now()) return;

    const id = Math.random().toString(36).substr(2, 9);
    const newNotif = { ...notif, id, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };

    setNotifications((prev) => [newNotif, ...prev].slice(0, 4));

    setTimeout(() => removeNotification(id), 12000);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const muteForToday = () => {
    const tomorrow = new Date();
    tomorrow.setHours(24, 0, 0, 0);
    localStorage.setItem('notifications_muted_until', tomorrow.getTime().toString());
    setMutedUntil(tomorrow.getTime());
    setNotifications([]);
  };

  const handleClick = (n: Notification) => {
    if (n.link) router.push(bp(n.link));
    removeNotification(n.id);
  };

  const iconFor = (n: Notification) => {
    if (n.avatar) return <img src={n.avatar} className="w-full h-full rounded-full object-cover" alt="" />;
    if (n.type === 'SUCCESS') return <CheckCircle size={22} />;
    if (n.type === 'ABSENCE') return <FileText size={22} />;
    if (n.type === 'PERMISSION') return <Ticket size={22} />;
    if (n.type === 'LEAVE') return <Calendar size={22} />;
    if (n.title?.includes('Formation')) return <GraduationCap size={22} />;
    if (n.type === 'ALERT') return <AlertTriangle size={22} />;
    if (n.type === 'INFO') return <Info size={22} />;
    return <UserCheck size={22} />;
  };

  const colorFor = (n: Notification) => {
    if (n.type === 'ALERT') return { bg: 'bg-red-100 text-red-600', bar: 'bg-red-500' };
    if (n.type === 'SUCCESS') return { bg: 'bg-emerald-100 text-emerald-600', bar: 'bg-emerald-500' };
    if (n.type === 'ABSENCE') return { bg: 'bg-orange-100 text-orange-600', bar: 'bg-orange-500' };
    if (n.type === 'PERMISSION') return { bg: 'bg-violet-100 text-violet-600', bar: 'bg-violet-500' };
    if (n.type === 'LEAVE') return { bg: 'bg-sky-100 text-sky-600', bar: 'bg-sky-500' };
    return { bg: 'bg-sky-100 text-sky-600', bar: 'bg-sky-500' };
  };

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}

      {/* Bas de l'écran, à droite — discret, hors du flux de lecture principal */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col-reverse gap-3 w-full max-w-sm pointer-events-none">
        <AnimatePresence>
          {notifications.map((n) => {
            const c = colorFor(n);
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                layout
                onClick={() => handleClick(n)}
                className={`pointer-events-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/20 dark:border-gray-700 p-4 rounded-2xl shadow-2xl shadow-sky-500/10 flex gap-4 relative overflow-hidden group ${n.link ? 'cursor-pointer hover:-translate-y-0.5 transition-transform' : ''}`}
              >
                <motion.div
                  initial={{ width: '100%' }} animate={{ width: 0 }} transition={{ duration: 12, ease: 'linear' }}
                  className={`absolute bottom-0 left-0 h-1 ${c.bar}`}
                />

                <div className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center ${c.bg}`}>
                  {iconFor(n)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-gray-900 dark:text-white text-sm">{n.title}</h4>
                    <span className="text-[10px] text-gray-400 shrink-0">{n.time}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 leading-snug font-medium">{n.message}</p>

                  <div className="flex gap-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {n.link && <span className="text-[10px] font-bold text-sky-500">Voir →</span>}
                    <button onClick={(e) => { e.stopPropagation(); muteForToday(); }} className="text-[10px] font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                      Ne plus afficher ajd.
                    </button>
                  </div>
                </div>

                <button onClick={(e) => { e.stopPropagation(); removeNotification(n.id); }} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
