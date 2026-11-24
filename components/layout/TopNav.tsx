'use client';
import { NotificationPopover, recentNotifications } from '@/components/layout/NotificationPopover';
import { ShellSearch } from './ShellSearch';
import { ThemeControl } from './ThemeControl';
import { AssistantLauncher } from '@/components/assistant/AssistantLauncher';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';

import React, { useEffect, useState, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Menu, ChevronRight, ChevronDown, CheckCircle2, Clock, AlertTriangle, Info, LogOut, User, Mail, Layers, RotateCcw } from 'lucide-react';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import { useMyEmployeePhoto } from '@/hooks/useMyEmployeePhoto';
import { PushMenuItem } from '@/components/PushNotificationBanner';
import { resolveCrumb } from '@/lib/shell/page-index';
import { resetFloatingWidgets } from '@/hooks/useDraggableWidget';

interface TopNavProps {
  onMenuClick: () => void;
  activeLabel?: string;
}

export const TopNav: React.FC<TopNavProps> = ({ onMenuClick, activeLabel }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { bp } = useBasePath();
  const reduceMotion = useReducedMotion();
  
  const [user, setUser] = useState<any>(null);

  // 🆕 Photo de la fiche employé si la personne connectée en a une. Reste
  // `null` sinon (404 avalé silencieusement par le hook, aucune erreur
  // envoyée au front) — on retombe alors sur `avatar` (ui-avatars), inchangé.
  const employeePhotoUrl = useMyEmployeePhoto();
  
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') { setShowNotifs(false); setShowProfileMenu(false); } };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        setUser(u);
      } catch(e) {}
    }
    
    fetchNotifications();
    const interval = setInterval(() => { if (!document.hidden) fetchNotifications(); }, 180000);
    const onPush = () => fetchNotifications();
    window.addEventListener('konza:notif-push', onPush);
    
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifs(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('konza:notif-push', onPush);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await api.get<any[]>('/notifications?limit=5');
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    } catch (e) { console.error("Error fetching notifications", e); }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all', {});
      setUnreadCount(0);
      // ✅ Supprimées côté back désormais — on vide la liste, pas juste le style
      setNotifications([]);
    } catch (e) {}
  };

  // ✅ Lire une notification la SUPPRIME (comportement demandé) — on la
  //    retire de la liste locale au lieu de juste changer son style.
  const handleNotifClick = async (n: any) => {
    if (n.link) {
      router.push(bp(n.link));
      setShowNotifs(false);
    }
    try {
      await api.patch(`/notifications/${n.id}/read`, {});
      setNotifications(prev => prev.filter(x => x.id !== n.id));
      if (!n.read) setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {}
  };

  // ✅ Marquer UNE SEULE notification lue, sans naviguer (bouton dédié par
  //    notification — demandé séparément du clic sur toute la carte, et du
  //    "Tout marquer lu" qui traite tout d'un coup).
  const markOneRead = async (n: any, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.patch(`/notifications/${n.id}/read`, {});
      setNotifications(prev => prev.filter(x => x.id !== n.id));
      if (!n.read) setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {}
  };

  const handleLogout = async () => {
    // Révoquer le cookie côté serveur
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

  const getPageTitle = (path: string) => {
    if (!path) return 'Dashboard';
    if (path === '/' || path === '/dashboard') return 'Tableau de Bord';
    const segment = path.split('/')[1];
    return segment ? segment.charAt(0).toUpperCase() + segment.slice(1) : 'Dashboard';
  };

  const crumb = pathname ? resolveCrumb(pathname) : null;
  const title = activeLabel || crumb?.title || (pathname ? getPageTitle(pathname) : 'Tableau de bord');
  const parentLabel = activeLabel ? null : crumb?.parent ?? null;

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

  return (
    <header className="shell-topbar sticky top-0 z-40 print:hidden px-3 sm:px-4 pt-3">
      <div className="shell-topbar-inner" style={{ background: 'var(--surface)', border: 'none' }}>

        {/* Gauche : menu mobile et fil d'Ariane */}
        <div className="shell-location">
          <button data-guide="navigation-open" type="button" aria-label="Ouvrir le menu" onClick={onMenuClick} className="shell-icon-btn md:hidden -ml-2">
            <Menu size={22} strokeWidth={1.5} aria-hidden="true" />
          </button>

          <nav aria-label="Fil d’Ariane" className="hidden sm:flex items-center text-sm font-medium min-w-0">
            <span style={{ color: 'var(--text-secondary)' }}>Accueil</span>
            {parentLabel && (
              <>
                <ChevronRight size={14} strokeWidth={1.5} className="mx-2 shrink-0" style={{ color: 'var(--text-secondary)' }} aria-hidden="true" />
                <span style={{ color: 'var(--text-secondary)' }}>{parentLabel}</span>
              </>
            )}
            <ChevronRight size={14} strokeWidth={1.5} className="mx-2 shrink-0" style={{ color: 'var(--text-secondary)' }} aria-hidden="true" />
            <span className="font-semibold truncate" aria-current="page" style={{ color: 'var(--text)' }}>{title}</span>
          </nav>
          <span className="sm:hidden font-semibold truncate" style={{ color: 'var(--text)' }}>{title}</span>
        </div>

        {/* Centre : recherche de pages (zone large sur ordinateur, icône sur mobile) */}
        <div className="shell-topbar-search flex flex-1 items-center justify-end md:justify-center md:max-w-md md:mx-6">
          <ShellSearch />
        </div>

        {/* Droite : mode, notifications, profil */}
        <div className="shell-topbar-actions">
          <AssistantLauncher />
          <ThemeControl compact />

          {/* Notifications */}
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
                    <button type="button" onClick={markAllRead} disabled={unreadCount === 0} className="shell-link-btn">
                      Tout marquer lu
                    </button>
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
                          <button
                            type="button"
                            onClick={(e) => markOneRead(n, e)}
                            title="Marquer cette notification comme lue"
                            aria-label="Marquer cette notification comme lue"
                            onKeyDown={e=>e.stopPropagation()} className="shell-notif-check shell-icon-btn"
                          >
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

          {/* Profil */}
          <div className="relative" ref={profileRef}>
            <button
              data-guide="profile-trigger"
              type="button"
              className="shell-profile-btn"
              aria-label="Mon compte"
              aria-haspopup="menu"
              aria-expanded={showProfileMenu}
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <div className="hidden sm:block text-right">
                <p className="shell-profile-name">{user?.firstName} {user?.lastName}</p>
                <p className="shell-profile-status"><span aria-hidden="true" />En ligne</p>
              </div>
              <ProfileAvatar src={employeePhotoUrl} name={[user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Mon compte'} />
              <ChevronDown size={14} strokeWidth={1.5} className={`transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} style={{ color: 'var(--text-secondary)' }} aria-hidden="true" />
            </button>

            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  {...panelMotion}
                  role="menu"
                  aria-label="Mon compte"
                  className="shell-menu absolute right-0 top-full mt-3 w-64 origin-top-right"
                >
                  <div className="shell-menu-profile">
                    <p className="shell-profile-name" style={{ textAlign: 'left' }}>{user?.firstName} {user?.lastName}</p>
                    <p className="shell-menu-mail"><Mail size={12} strokeWidth={1.5} aria-hidden="true" /><span className="truncate">{user?.email}</span></p>
                  </div>
                  <div className="shell-menu-sep" />

                  {/* Visible uniquement pour un compte multi-entreprises */}
                  {user?.manageMultipleCompanies && (
                    <button type="button" role="menuitem" onClick={() => { router.push('/portefeuille/dashboard'); setShowProfileMenu(false); }} className="shell-menu-item is-brand">
                      <Layers size={16} strokeWidth={1.5} aria-hidden="true" />
                      Mon portefeuille
                    </button>
                  )}

                  <button type="button" role="menuitem" onClick={() => { router.push('/mon-profil'); setShowProfileMenu(false); }} className="shell-menu-item">
                    <User size={16} strokeWidth={1.5} aria-hidden="true" />
                    Mon profil
                  </button>

                  {/* Remet Sofia et les alertes contrat à leur place d'origine */}
                  <button type="button" role="menuitem" onClick={() => { resetFloatingWidgets(); setShowProfileMenu(false); }} className="shell-menu-item">
                    <RotateCcw size={16} strokeWidth={1.5} aria-hidden="true" />
                    Remettre les boutons à leur place
                  </button>

                  {/* Notifications téléphone (hors app) */}
                  <AssistantLauncher placement="menu" onLaunch={()=>setShowProfileMenu(false)} />
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
};