
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Bell, Menu, ChevronRight, ChevronDown, Moon, Sun, CheckCircle2, Clock, AlertTriangle, Info, X, LogOut, User, Mail } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';

interface TopNavProps {
  onMenuClick: () => void;
  activeLabel?: string;
}

export const TopNav: React.FC<TopNavProps> = ({ onMenuClick, activeLabel }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  
  // User Info
  const [user, setUser] = useState<any>(null);
  const [avatar, setAvatar] = useState<string>('');
  
  // States
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        try {
            const u = JSON.parse(storedUser);
            setUser(u);
            setAvatar(`https://ui-avatars.com/api/?name=${u.firstName}+${u.lastName}&background=random&color=fff`);
        } catch(e) {}
    }
    
    // Fetch initial notifications
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    
    // Click outside handler
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
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchNotifications = async () => {
      try {
          const data = await api.get<any[]>('/notifications?limit=5');
          setNotifications(data);
          setUnreadCount(data.filter(n => !n.isRead).length);
      } catch (e) { console.error("Error fetching notifications", e); }
  };

  const markAllRead = async () => {
      try {
          await api.patch('/notifications/read-all', {});
          setUnreadCount(0);
          setNotifications(prev => prev.map(n => ({...n, isRead: true})));
      } catch (e) {}
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    localStorage.removeItem('notifications_muted_until');
    router.replace('/auth/login');
  };

  const getPageTitle = (path: string) => {
    if (!path) return 'Dashboard';
    if (path === '/' || path === '/dashboard') return 'Tableau de Bord';
    const segment = path.split('/')[1];
    return segment ? segment.charAt(0).toUpperCase() + segment.slice(1) : 'Dashboard';
  };

  const title = activeLabel || (pathname ? getPageTitle(pathname) : 'Dashboard');

  const getNotifIcon = (type: string) => {
      switch(type) {
          case 'CHECK_IN': return <Clock size={16} className="text-emerald-500" />;
          case 'ALERT': return <AlertTriangle size={16} className="text-red-500" />;
          case 'LEAVE': return <Info size={16} className="text-sky-500" />;
          default: return <Info size={16} className="text-gray-500" />;
      }
  };

  return (
    <header className="sticky top-4 z-40 mx-4 md:mx-6 mb-6 print:hidden">
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-2xl shadow-lg shadow-slate-200/40 dark:shadow-2xl px-6 py-4 flex items-center justify-between transition-all duration-300">
        
        {/* Left: Menu & Breadcrumbs */}
        <div className="flex items-center gap-4">
          <button onClick={onMenuClick} className="p-2 -ml-2 text-slate-600 dark:text-slate-400 md:hidden rounded-xl">
            <Menu size={24} />
          </button>

          <nav className="hidden sm:flex items-center text-sm font-medium">
            <span className="text-slate-500 dark:text-slate-400">Accueil</span>
            <ChevronRight size={14} className="mx-2 text-slate-300 dark:text-slate-600" />
            <span className="text-slate-800 dark:text-white bg-slate-100 dark:bg-white/10 px-3 py-1 rounded-lg border border-slate-200 dark:border-white/5 shadow-sm">
              {title}
            </span>
          </nav>
        </div>

        {/* Center: Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search size={16} className="text-slate-400 group-focus-within:text-sky-500" /></div>
            <input type="text" className="block w-full pl-10 pr-12 py-2.5 border border-slate-200 dark:border-white/10 rounded-xl bg-slate-50/50 dark:bg-black/20 text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/50 text-sm transition-all" placeholder="Rechercher (Cmd+K)" />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          
          <button onClick={toggleTheme} className="p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setShowNotifs(!showNotifs)}
                className={`p-2.5 rounded-xl transition-colors ${showNotifs ? 'bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10'}`}
              >
                <div className="relative">
                    <Bell size={20} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
                    )}
                </div>
              </button>

              <AnimatePresence>
                  {showNotifs && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 top-full mt-4 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50 origin-top-right"
                      >
                          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                              <h3 className="font-bold text-slate-900 dark:text-white">Notifications</h3>
                              {unreadCount > 0 && (
                                  <button onClick={markAllRead} className="text-xs font-bold text-sky-500 hover:text-sky-600">Tout marquer lu</button>
                              )}
                          </div>
                          
                          <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                              {notifications.length === 0 ? (
                                  <div className="p-8 text-center text-slate-400">
                                      <Bell size={32} className="mx-auto mb-2 opacity-20"/>
                                      <p className="text-sm">Aucune notification.</p>
                                  </div>
                              ) : (
                                  notifications.map((n) => (
                                      <div key={n.id} className={`p-4 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${!n.isRead ? 'bg-sky-50/30 dark:bg-sky-900/10' : ''}`}>
                                          <div className="flex gap-3">
                                              <div className={`mt-1 shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800`}>
                                                  {getNotifIcon(n.type)}
                                              </div>
                                              <div>
                                                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{n.title}</p>
                                                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</p>
                                                  <p className="text-[10px] text-slate-400 mt-2">{new Date(n.time).toLocaleString()}</p>
                                              </div>
                                          </div>
                                      </div>
                                  ))
                              )}
                          </div>
                          
                          <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                              <button onClick={() => { router.push('/notifications'); setShowNotifs(false); }} className="w-full py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all">
                                  Voir tout l'historique
                              </button>
                          </div>
                      </motion.div>
                  )}
              </AnimatePresence>
          </div>

          <div className="h-8 w-px bg-slate-200 dark:bg-white/10 mx-1 hidden sm:block"></div>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className={`flex items-center gap-3 pl-2 pr-1 py-1 rounded-xl transition-all ${showProfileMenu ? 'bg-slate-100 dark:bg-white/10' : 'hover:bg-slate-100 dark:hover:bg-white/5'}`}
              >
                  <div className="hidden sm:block text-right mr-1">
                      <p className="text-sm font-bold text-slate-800 dark:text-white">{user?.firstName} {user?.lastName}</p>
                      <p className="text-[10px] uppercase font-bold text-sky-600 dark:text-cyan-400 tracking-wider">En ligne</p>
                  </div>
                  <img src={avatar || 'https://via.placeholder.com/100'} className="h-9 w-9 rounded-lg object-cover ring-2 ring-white dark:ring-slate-800 shadow-sm" />
                  <ChevronDown size={14} className={`text-slate-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                  {showProfileMenu && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 top-full mt-4 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50 origin-top-right p-2"
                      >
                          <div className="p-3 border-b border-slate-100 dark:border-slate-700 mb-2">
                              <p className="font-bold text-slate-900 dark:text-white">{user?.firstName} {user?.lastName}</p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                                  <Mail size={12} /> <span className="truncate">{user?.email}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-1 text-xs text-emerald-500 font-bold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Actif
                              </div>
                          </div>

                          <div className="space-y-1">
                              <button onClick={() => router.push('/parametres/users')} className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 text-slate-700 dark:text-slate-300">
                                  <User size={16} /> Mon Compte
                              </button>
                              <div className="h-px bg-slate-100 dark:bg-slate-800 my-1"></div>
                              <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 text-red-600 dark:text-red-400 font-bold">
                                  <LogOut size={16} /> Déconnexion
                              </button>
                          </div>
                      </motion.div>
                  )}
              </AnimatePresence>
          </div>

        </div>
      </div>
    </header>
  );
};
