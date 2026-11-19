'use client';
import { LegacyNotifications } from '@/components/providers/legacy-feedback';
import { FeedbackVariants, FeedbackViewport, FeedbackToast } from '@/components/ui/Feedback';

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
import { useRouter, usePathname } from 'next/navigation';


import { io } from 'socket.io-client';
import { DEMO_MODE, isDeferredRoute } from '@/lib/demo/config';
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
  expiresAt?: number;
  link?: string; // chemin (relatif, sans basePath) vers la page de gestion concernée
}

interface NotificationContextType {
  addNotification: (notif: Omit<Notification, 'id' | 'time'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const APPROVER_ROLES = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'];

export function NotificationProvider({ children }: { children?: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isPublicPage = pathname === '/' || /^\/(auth|register|verify|tarifs|contact|qui-sommes-nous|blog|docs|entreprises|privacy|mentions-legales|confidentialite|cgu|cgv|jobs|outils|simulateur|kiosk|ecran|inscription-portefeuille)(\/|$)/.test(pathname);
  const { bp } = useBasePath();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [mutedUntil, setMutedUntil] = useState<number | null>(null);

  // --- WEBSOCKET : événements temps réel ---
  useEffect(() => {
    if ((DEMO_MODE && !isDeferredRoute(pathname)) || isPublicPage || !localStorage.getItem('user')) return;
    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
      withCredentials: true,
    });

    // Prévient la cloche (TopNav / PortfolioTopNav) de recharger tout de suite :
    // leur polling est à 180 s, le socket prend le relais pour l'instantané.
    const pingBell = () => window.dispatchEvent(new Event('konza:notif-push'));

    socket.on('admin-notification', (data: any) => {
      pingBell();
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (APPROVER_ROLES.includes(user.role)) {
          addNotification({ ...data, link: data.link });
        }
      }
    });

    socket.on('company-notification', (data: any) => {
      pingBell();
      addNotification({ type: 'INFO', title: data.title, message: data.message, link: data.link });
    });

    return () => { socket.disconnect(); };
  }, [isPublicPage]);

  // --- SYNTHÈSE AU CHARGEMENT : un toast par type de demande en attente ---
  useEffect(() => {
    if (isPublicPage) { setNotifications([]); return; }
    let cancelled = false;
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return;
    let user: any;
    try { user = JSON.parse(storedUser); } catch { return; }
    if (!APPROVER_ROLES.includes(user.role)) return;

    (async () => {
      try {
        const counts: any = await api.get('/dashboard/pending-requests-count');
        if (cancelled) return;

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
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPublicPage]);

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
    const newNotif = { ...notif, id, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), expiresAt:Date.now()+12000 };

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





  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}

      {/* Bas de l'écran, à droite — discret, hors du flux de lecture principal */}
      <FeedbackVariants legacy={<LegacyNotifications notifications={notifications} handleClick={handleClick} muteForToday={muteForToday} removeNotification={removeNotification} />}>
        <FeedbackViewport position="bottom" label="Notifications récentes">
          {notifications.map(n => <FeedbackToast key={n.id} tone={n.type === 'ALERT' ? 'warning' : n.type === 'SUCCESS' ? 'success' : 'info'} title={n.title.replace(/^[\p{Extended_Pictographic}\uFE0F\s]+/u,'')} message={n.message} time={n.time} duration={12000} expiresAt={n.expiresAt} icon={n.avatar ? <img src={n.avatar} alt="" /> : undefined} onClose={() => removeNotification(n.id)}>
            {n.link && <button type="button" className="k-button k-button-secondary" onClick={() => handleClick(n)}>Voir la demande</button>}
            <button type="button" className="k-button k-button-ghost" onClick={muteForToday}>Masquer pour aujourd’hui</button>
          </FeedbackToast>)}
        </FeedbackViewport>
      </FeedbackVariants>
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
