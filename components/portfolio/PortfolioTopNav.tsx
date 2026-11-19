'use client';
import { NotificationPopover, recentNotifications } from '@/components/layout/NotificationPopover';

// components/portfolio/PortfolioTopNav.tsx
// Top bar de l'espace portefeuille.
// ✅ Même représentation que components/layout/TopNav.tsx : carte flottante arrondie,
//    fil d'Ariane, champ de recherche, thème, notifications (cloche + liste),
//    menu profil. Les notifications sont celles de l'entreprise active (comme le dashboard).

import React, { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Menu, ChevronRight, ChevronDown, CheckCircle2, Clock, AlertTriangle, Info, LogOut, User, Mail } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ShellSearch } from '@/components/layout/ShellSearch';
import { ThemeControl } from '@/components/layout/ThemeControl';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import { api } from '@/services/api';
import { PushMenuItem } from '@/components/PushNotificationBanner';

const PAGE_LABELS: Record<string, string> = {
  dashboard: 'Tableau de bord',
  demandes: 'Demandes',
  avis: 'Avis à donner',
  messages: 'Messages',
  'mes-entreprises': 'Mes entreprises',
  employes: 'Employés',
  paie: 'Paie',
  prets: 'Prêts & Avances',
  conges: 'Congés',
  presences: 'Présences',
  absences: 'Absences',
  rapports: 'Rapports',
  equipe: 'Équipe',
  liste: 'Liste de paie',
  effectifs: 'Tableau de bord effectifs',
  'presences-absences': 'Tableau de bord présences',
  'prets-avances': 'Tableau de bord prêts',
};

interface PortfolioTopNavProps {
  userName?: string;
  userEmail?: string;
  /** Photo de la fiche employé, si l'admin multi-comptes en a une (sinon
   *  avatar généré à partir du nom, comme dans le dashboard). */
  userPhotoUrl?: string;
  onMenuClick?: () => void;
}

export default function PortfolioTopNav({ userName, userEmail, userPhotoUrl, onMenuClick }: PortfolioTopNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const data = await api.get<any[]>('/notifications?limit=5');
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    } catch (e) { console.error('Error fetching notifications', e); }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => { if (!document.hidden) fetchNotifications(); }, 180000);
    const onPush = () => fetchNotifications();
    window.addEventListener('konza:notif-push', onPush);

    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfileMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      clearInterval(interval);
      window.removeEventListener('konza:notif-push', onPush);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') { setShowNotifs(false); setShowProfileMenu(false); } };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, []);

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all', {});
      setUnreadCount(0);
      setNotifications([]);
    } catch { /* silencieux */ }
  };

  // Lire une notification la supprime (même comportement que le dashboard)
  const handleNotifClick = async (n: any) => {
    if (n.link) {
      router.push(n.link);
      setShowNotifs(false);
    }
    try {
      await api.patch(`/notifications/${n.id}/read`, {});
      setNotifications(prev => prev.filter(x => x.id !== n.id));
      if (!n.read) setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* silencieux */ }
  };

  const markOneRead = async (n: any, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.patch(`/notifications/${n.id}/read`, {});
      setNotifications(prev => prev.filter(x => x.id !== n.id));
      if (!n.read) setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* silencieux */ }
  };

  const notifIcon = (type: string) => {
    switch (type) {
      case 'CHECK_IN': return <Clock size={16} strokeWidth={1.5} style={{ color: 'var(--action)' }} aria-hidden="true" />;
      case 'ALERT':    return <AlertTriangle size={16} strokeWidth={1.5} style={{ color: 'var(--danger)' }} aria-hidden="true" />;
      case 'LEAVE':    return <Info size={16} strokeWidth={1.5} style={{ color: 'var(--action)' }} aria-hidden="true" />;
      default:         return <Info size={16} strokeWidth={1.5} style={{ color: 'var(--text-secondary)' }} aria-hidden="true" />;
    }
  };

  const panelMotion = {
    initial: reduceMotion ? false : { opacity: 0, y: 8, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 },
    transition: { duration: reduceMotion ? 0 : 0.18 },
  };

  const segments = (pathname ?? '').split('/').filter(Boolean); // ['portefeuille', 'paie', 'liste']
  const current = segments[segments.length - 1];
  const title = PAGE_LABELS[current] ?? 'Mon portefeuille';

  const handleLogout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/logout`, {
        method: 'POST', credentials: 'include',
      });
    } catch { /* silencieux */ } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('notifications_muted_until');
      router.replace('/auth/login');
    }
  };

  return (
    <header className="shell-topbar sticky top-0 z-40 print:hidden px-3 sm:px-4 pt-3">
      <div className="shell-topbar-inner" style={{ background: 'var(--surface)', border: 'none' }}>

        {/* Gauche : menu mobile et fil d'Ariane */}
        <div className="shell-location">
          <button type="button" aria-label="Ouvrir le menu" onClick={onMenuClick} className="shell-icon-btn md:hidden -ml-2">
            <Menu size={22} strokeWidth={1.5} aria-hidden="true" />
          </button>

          <nav aria-label="Fil d’Ariane" className="hidden sm:flex items-center text-sm font-medium min-w-0">
            <span style={{ color: 'var(--text-secondary)' }}>Portefeuille</span>
            <ChevronRight size={14} strokeWidth={1.5} className="mx-2 shrink-0" style={{ color: 'var(--text-secondary)' }} aria-hidden="true" />
            <span className="font-semibold truncate" aria-current="page" style={{ color: 'var(--text)' }}>{title}</span>
          </nav>
          <span className="sm:hidden font-semibold truncate" style={{ color: 'var(--text)' }}>{title}</span>
        </div>

        {/* Centre : recherche dans le menu du portefeuille (Ctrl/⌘ + K) */}
        <div className="shell-topbar-search flex flex-1 items-center justify-end md:justify-center md:max-w-md md:mx-6">
          <ShellSearch />
        </div>

        {/* Droite : mode, notifications, profil */}
        <div className="shell-topbar-actions">
          <ThemeControl compact />

          <div className="relative" ref={notifRef}>
            <button
              type="button"
              className="shell-icon-btn relative"
              aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Notifications'}
              aria-haspopup="true"
              aria-expanded={showNotifs}
              onClick={() => { setShowProfileMenu(false); setShowNotifs(!showNotifs); !showNotifs && void fetchNotifications(); }}
            >
              <Bell size={20} strokeWidth={1.5} aria-hidden="true" />
              {unreadCount > 0 && <span className="shell-dot" aria-hidden="true" />}
            </button>

            <AnimatePresence>
              {showNotifs && (
                <NotificationPopover onClose={() => setShowNotifs(false)}>
                  <div className="shell-menu-head">
                    <div><h3 className="shell-menu-title">Notifications</h3><p className="shell-notifications-subtitle">Les 5 plus récentes</p></div>
                    <button type="button" onClick={markAllRead} disabled={unreadCount === 0} className="shell-link-btn">Tout marquer lu</button>
                  </div>

                  <div className="shell-notifications-list custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="shell-menu-empty">
                        <Bell size={28} strokeWidth={1.5} aria-hidden="true" />
                        <p>Aucune notification.</p>
                      </div>
                    ) : (
                      recentNotifications(notifications).map((n) => (
                        <div
                          key={n.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => handleNotifClick(n)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleNotifClick(n); } }}
                          className={`shell-notif group ${!n.read ? 'is-unread' : ''}`}
                        >
                          <div className="shell-notif-ico">{notifIcon(n.type)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="shell-notif-title">{n.title}</p>
                            <p className="shell-notif-text">{n.message}</p>
                            <p className="shell-notif-date">{new Date(n.createdAt).toLocaleString('fr-FR')}</p>
                          </div>
                          <button type="button" onClick={(e) => markOneRead(n, e)} title="Marquer cette notification comme lue" aria-label="Marquer cette notification comme lue" onKeyDown={e=>e.stopPropagation()} className="shell-notif-check shell-icon-btn">
                            <CheckCircle2 size={16} strokeWidth={1.5} aria-hidden="true" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="shell-menu-sep" />
                  <button type="button" onClick={() => { router.push('/notifications'); setShowNotifs(false); }} className="shell-menu-item" style={{ justifyContent: 'center', fontWeight: 600 }}>
                    Voir tout l'historique
                  </button>
                </NotificationPopover>
              )}
            </AnimatePresence>
          </div>

          <div className="relative" ref={profileRef}>
            <button
              type="button"
              className="shell-profile-btn"
              aria-label="Mon compte"
              aria-haspopup="menu"
              aria-expanded={showProfileMenu}
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <div className="hidden sm:block text-right">
                <p className="shell-profile-name">{userName ?? 'Mon compte'}</p>
                <p className="shell-profile-status"><span aria-hidden="true" />En ligne</p>
              </div>
              <ProfileAvatar src={userPhotoUrl} name={userName || userEmail || 'Mon compte'} />
              <ChevronDown size={14} strokeWidth={1.5} className={`transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} style={{ color: 'var(--text-secondary)' }} aria-hidden="true" />
            </button>

            <AnimatePresence>
              {showProfileMenu && (
                <motion.div {...panelMotion} role="menu" aria-label="Mon compte" className="shell-menu absolute right-0 top-full mt-3 w-64 origin-top-right">
                  <div className="shell-menu-profile">
                    <p className="shell-profile-name" style={{ textAlign: 'left' }}>{userName ?? 'Mon compte'}</p>
                    {userEmail && <p className="shell-menu-mail"><Mail size={12} strokeWidth={1.5} aria-hidden="true" /><span className="truncate">{userEmail}</span></p>}
                  </div>
                  <div className="shell-menu-sep" />
                  <button type="button" role="menuitem" onClick={() => { router.push('/mon-profil'); setShowProfileMenu(false); }} className="shell-menu-item">
                    <User size={16} strokeWidth={1.5} aria-hidden="true" />
                    Mon profil
                  </button>

                  {/* Notifications téléphone (hors app) */}
                  <PushMenuItem />

                  <div className="shell-menu-sep" />
                  <button type="button" role="menuitem" onClick={handleLogout} className="shell-menu-item is-danger">
                    <LogOut size={16} strokeWidth={1.5} aria-hidden="true" />
                    Déconnexion
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
