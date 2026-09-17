'use client';

// components/portfolio/PortfolioTopNav.tsx
// Équivalent simplifié de components/layout/TopNav.tsx pour l'espace portefeuille.

import React, { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronRight, Moon, Sun, ChevronDown, User, LogOut, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/components/providers/ThemeProvider';

const PAGE_LABELS: Record<string, string> = {
  dashboard: 'Tableau de bord',
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
};

interface PortfolioTopNavProps {
  userName?: string;
  userEmail?: string;
}

export default function PortfolioTopNav({ userName, userEmail }: PortfolioTopNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const segments = (pathname ?? '').split('/').filter(Boolean); // ['portefeuille', 'paie', 'liste']
  const current = segments[segments.length - 1];
  const title = PAGE_LABELS[current] ?? 'Mon portefeuille';

  const initials = (userName || userEmail || 'MO').slice(0, 2).toUpperCase();

  const handleLogout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/logout`, {
        method: 'POST', credentials: 'include',
      });
    } catch { /* silencieux */ } finally {
      localStorage.removeItem('user');
      router.replace('/auth/login');
    }
  };

  return (
    <header className="sticky top-0 z-40 print:hidden">
      <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <nav className="flex items-center text-sm font-medium">
          <span style={{ color: 'var(--text-muted)' }}>Portefeuille</span>
          <ChevronRight size={14} className="mx-2" style={{ color: 'var(--text-muted)' }} />
          <span className="font-bold" style={{ color: 'var(--text)' }}>{title}</span>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/10"
            style={{ color: 'var(--text-muted)' }}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <div className="h-8 w-px bg-slate-200 dark:bg-white/10 mx-1 hidden sm:block" />

          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfileMenu(s => !s)}
              className={`flex items-center gap-2.5 pl-2 pr-1 py-1 rounded-lg transition-colors ${showProfileMenu ? 'bg-black/5 dark:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
            >
              <div className="hidden sm:block text-right mr-1">
                <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{userName ?? 'Mon compte'}</p>
                <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">Portefeuille</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {initials}
              </div>
              <ChevronDown size={14} className={`text-slate-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-3 w-64 rounded-xl shadow-lg overflow-hidden z-50 origin-top-right p-2"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <div className="p-3 border-b border-slate-100 dark:border-slate-700 mb-2">
                    <p className="font-bold" style={{ color: 'var(--text)' }}>{userName ?? 'Mon compte'}</p>
                    {userEmail && (
                      <div className="flex items-center gap-2 mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <Mail size={12} />
                        <span className="truncate">{userEmail}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <button
                      onClick={() => { router.push('/mon-profil'); setShowProfileMenu(false); }}
                      className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3"
                      style={{ color: 'var(--text)' }}
                    >
                      <User size={16} />
                      Mon Profil
                    </button>
                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 text-red-600 dark:text-red-400 font-bold"
                    >
                      <LogOut size={16} />
                      Déconnexion
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
}