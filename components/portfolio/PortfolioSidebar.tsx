'use client';

// components/portfolio/PortfolioSidebar.tsx
// Sidebar de l'espace "Mon portefeuille" (admin multi-entreprises).
// Même langage visuel que components/layout/Sidebar.tsx (Tailwind + CSS vars,
// lucide-react, vert émeraude) — pas le thème navy du cabinet.

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Building2, Users, Wallet, HandCoins,
  Calendar, Users2, ClipboardList, LogOut, BarChart3, UserPlus,
  type LucideIcon,
} from 'lucide-react';

interface NavEntry {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
}

const NAV: NavEntry[] = [
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, path: '/portefeuille/dashboard' },
  { id: 'entreprises', label: 'Mes entreprises', icon: Building2, path: '/portefeuille/mes-entreprises' },
  { id: 'employes', label: 'Employés', icon: Users, path: '/portefeuille/employes' },
  { id: 'paie', label: 'Paie', icon: Wallet, path: '/portefeuille/paie' },
  { id: 'prets', label: 'Prêts & Avances', icon: HandCoins, path: '/portefeuille/prets' },
  { id: 'conges', label: 'Congés', icon: Calendar, path: '/portefeuille/conges' },
  { id: 'presences', label: 'Présences', icon: Users2, path: '/portefeuille/presences' },
  { id: 'absences', label: 'Absences', icon: ClipboardList, path: '/portefeuille/absences' },
  { id: 'rapports', label: 'Rapports', icon: BarChart3, path: '/portefeuille/rapports' },
  { id: 'equipe', label: 'Équipe', icon: UserPlus, path: '/portefeuille/equipe' },
];

interface PortfolioSidebarProps {
  userName?: string;
  userEmail?: string;
}

export default function PortfolioSidebar({ userName, userEmail }: PortfolioSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (path: string) => pathname === path || pathname?.startsWith(`${path}/`);

  const logout = () => { localStorage.clear(); router.push('/auth/login'); };

  const initials = (userName || userEmail || 'MO').slice(0, 2).toUpperCase();

  return (
    <aside
      className="fixed left-0 top-0 h-full w-[240px] flex flex-col z-20"
      style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}
    >
      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <Link href="/portefeuille/dashboard" className="inline-flex flex-col items-start group">
          <Image
            src="/logos/konza_logo_h_color.png"
            alt="Konza RH Logo"
            width={507}
            height={240}
            priority
            className="block dark:hidden transition-opacity duration-300 group-hover:opacity-80"
            style={{ width: '140px', height: 'auto', objectFit: 'contain' }}
          />
          <Image
            src="/logos/konza_logo_h_white.png"
            alt="Konza RH Logo"
            width={507}
            height={240}
            priority
            className="hidden dark:block transition-opacity duration-300 group-hover:opacity-80"
            style={{ width: '140px', height: 'auto', objectFit: 'contain' }}
          />
          <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>Mon portefeuille</p>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2.5 overflow-y-auto space-y-0.5">
        {NAV.map(item => {
          const active = isActive(item.path);
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.path}
              className="relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={{
                color: active ? 'var(--text)' : 'var(--text-muted)',
                background: active ? 'rgba(16,185,129,0.12)' : 'transparent',
              }}
            >
              {active && (
                <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-emerald-500" />
              )}
              <Icon size={18} className={active ? 'text-emerald-500' : ''} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="p-3" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2.5 px-2.5 py-2 mb-1 rounded-xl" style={{ background: 'var(--surface-2)' }}>
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0 text-white text-xs font-bold">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>{userName ?? 'Mon compte'}</p>
            <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{userEmail ?? ''}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500"
          style={{ color: 'var(--text-muted)' }}
        >
          <LogOut size={16} />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}