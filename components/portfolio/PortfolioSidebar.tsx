'use client';
import { SidebarAccount } from '@/components/layout/SidebarAccount';
import { SidebarCount } from '@/components/layout/SidebarCount';

// components/portfolio/PortfolioSidebar.tsx
// Sidebar de l'espace "Mon portefeuille" (admin multi-entreprises).
//
// ✅ Même représentation que components/layout/Sidebar.tsx :
//    • carte flottante arrondie (static en desktop, tiroir en mobile)
//    • réduction en mode icônes (bouton ou Ctrl/Cmd+B) avec info-bulles —
//      la préférence `sidebar_collapsed` est PARTAGÉE avec le dashboard
//    • carte profil en haut, menus regroupés par thème (libellés de section)
//    • pastilles d'alerte clignotantes (Demandes / Avis / Messages)
//    • déconnexion identique (révocation du cookie côté serveur)

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Building2, Users, Wallet, HandCoins,
  Calendar, Users2, ClipboardList, LogOut, BarChart3, UserPlus,
  FileClock, MessageSquare, MessageCircle, PanelLeftClose, PanelLeftOpen,
  type LucideIcon,
} from 'lucide-react';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import { AlertBadge, ALERT_TONES } from '@/components/ui/AlertBadge';
import { useChatUnread } from '@/components/chat/ChatProvider';
import { usePortfolioAlerts } from './usePortfolioAlerts';

interface NavEntry {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
  /** Libellé de la section (affiché quand la section change) */
  category?: string;
  /** Si renseigné : pastille rouge clignotante quand le compteur correspondant est > 0 */
  alertKey?: 'requests' | 'avis' | 'messages';
}

const NAV: NavEntry[] = [
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, path: '/portefeuille/dashboard' },
  // 🔔 Centre d'alertes multi-entreprises (pastille rouge clignotante si du nouveau)
  { id: 'demandes', label: 'Demandes', icon: FileClock, path: '/portefeuille/demandes', alertKey: 'requests' },
  { id: 'avis', label: 'Avis à donner', icon: MessageSquare, path: '/portefeuille/avis', alertKey: 'avis' },
  { id: 'messages', label: 'Messages', icon: MessageCircle, path: '/portefeuille/messages', alertKey: 'messages' },
  { id: 'entreprises', label: 'Mes entreprises', icon: Building2, path: '/portefeuille/mes-entreprises', category: 'Portefeuille' },
  { id: 'employes', label: 'Employés', icon: Users, path: '/portefeuille/employes', category: 'Gestion RH' },
  { id: 'effectifs', label: 'Tableau de bord effectifs', icon: BarChart3, path: '/portefeuille/effectifs', category: 'Gestion RH' },
  { id: 'paie', label: 'Paie', icon: Wallet, path: '/portefeuille/paie', category: 'Gestion RH' },
  { id: 'prets', label: 'Prêts & Avances', icon: HandCoins, path: '/portefeuille/prets', category: 'Gestion RH' },
  { id: 'conges', label: 'Congés', icon: Calendar, path: '/portefeuille/conges', category: 'Gestion RH' },
  { id: 'presences', label: 'Présences', icon: Users2, path: '/portefeuille/presences', category: 'Gestion RH' },
  { id: 'absences', label: 'Absences', icon: ClipboardList, path: '/portefeuille/absences', category: 'Gestion RH' },
  { id: 'presences-absences', label: 'Tableau de bord présences', icon: BarChart3, path: '/portefeuille/presences-absences', category: 'Gestion RH' },
  { id: 'prets-avances', label: 'Tableau de bord prêts', icon: BarChart3, path: '/portefeuille/prets-avances', category: 'Gestion RH' },
  { id: 'rapports', label: 'Rapports', icon: BarChart3, path: '/portefeuille/rapports', category: 'Organisation' },
  { id: 'equipe', label: 'Équipe', icon: UserPlus, path: '/portefeuille/equipe', category: 'Organisation' },
];

interface PortfolioSidebarProps {
  userName?: string;
  userEmail?: string;
  /** Libellé du rôle affiché sous le nom (ex. « Admin ») — défaut : « Portefeuille » */
  userRoleLabel?: string;
  /** Photo de la fiche employé, si l'admin multi-comptes en a une (sinon
   *  avatar généré à partir du nom, comme dans le dashboard). */
  userPhotoUrl?: string;
  open?: boolean;
  onClose?: () => void;
}

export default function PortfolioSidebar({ userName, userEmail, userRoleLabel, userPhotoUrl, open = false, onClose }: PortfolioSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // ─── Mode réduit (mêmes clés / mêmes réglages que le dashboard) ──────────────
  const [collapsed, setCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [animate, setAnimate] = useState(false); // évite l'animation au 1er affichage
  const [tip, setTip] = useState<{ label: string; top: number; left: number } | null>(null);
  const mini = collapsed && isDesktop; // en mobile, le tiroir reste toujours déployé

  useEffect(() => {
    try { setCollapsed(localStorage.getItem('sidebar_collapsed') === '1'); } catch { /* stockage indisponible */ }
    const mq = window.matchMedia('(min-width: 768px)');
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    const raf = requestAnimationFrame(() => setAnimate(true));
    return () => { mq.removeEventListener('change', sync); cancelAnimationFrame(raf); };
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c;
      try { localStorage.setItem('sidebar_collapsed', next ? '1' : '0'); } catch { /* ignore */ }
      return next;
    });
    setTip(null);
  };

  // Raccourci clavier : Ctrl/Cmd + B (ignoré pendant la saisie de texte)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'b' || window.innerWidth < 768) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      e.preventDefault();
      toggleCollapsed();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Info-bulle en position fixe (l'aside a overflow-hidden + transform : un tooltip absolu serait coupé)
  const showTip = (e: React.MouseEvent<HTMLElement>, label: string) => {
    if (!mini) return;
    const r = e.currentTarget.getBoundingClientRect();
    setTip({ label, top: r.top + r.height / 2, left: r.right + 10 });
  };

  // 🔔 Compteurs d'alerte : demandes + avis (toutes entreprises) et messages non lus
  const { requests, avis } = usePortfolioAlerts();
  const unreadChat = useChatUnread();
  const alertCounts = { requests, avis, messages: unreadChat };

  const isActive = (path: string) => pathname === path || pathname?.startsWith(`${path}/`);

  // Déconnexion identique à celle du dashboard : le cookie HttpOnly est révoqué côté serveur
  const handleLogout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch { /* silencieux */ } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('notifications_muted_until');
      router.replace('/auth/login');
    }
  };

  const displayName = userName ?? 'Mon compte';

  let lastCategory: string | null = null;

  return (
    <>
      {/* Backdrop mobile */}
      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden print:hidden" onClick={onClose} />
      )}

      <style>{`
        @keyframes konza-wiggle { 0%,84%,100% { transform: rotate(0); } 87% { transform: rotate(-14deg); } 91% { transform: rotate(12deg); } 95% { transform: rotate(-7deg); } }
        .konza-wiggle { animation: konza-wiggle 3.2s ease-in-out infinite; transform-origin: 50% 10%; }
        @media (prefers-reduced-motion: reduce) { .konza-wiggle { animation: none; } }
      `}</style>

      <aside
        aria-label="Navigation du portefeuille"
        className={`shell-sidebar ${mini ? 'shell-sidebar-mini' : 'shell-sidebar-wide'} fixed md:static inset-y-0 left-0 z-50 w-[272px] ${collapsed ? 'md:w-[76px]' : 'md:w-[272px]'} shrink-0 flex flex-col overflow-hidden rounded-r-[28px] md:rounded-[28px] md:m-3 md:mr-0 shadow-[0_12px_40px_-14px_rgba(15,23,42,0.22)] dark:shadow-[0_12px_40px_-14px_rgba(0,0,0,0.65)] transform ${animate ? 'transition-[width,transform] duration-300 ease-out' : ''} ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} print:hidden`}
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="absolute top-0 left-0 right-0 h-px opacity-0 dark:opacity-70" style={{ background: 'linear-gradient(to right, transparent, var(--brand), transparent)' }} />

        {/* Logo */}
        <div className={mini ? 'shell-brand-zone is-mini' : 'shell-brand-zone'}>
          {mini ? (
            <Link
              href="/portefeuille/dashboard"
              aria-label="Tableau de bord"
              className="flex items-center justify-center rounded-2xl shrink-0"
              style={{ width: 44, height: 44, background: 'var(--brand-soft)', border: '1.5px solid var(--border)' }}
            >
              <Wallet size={22} strokeWidth={1.5} aria-hidden="true" style={{ color: 'var(--action)' }} />
            </Link>
          ) : (
            <Link href="/portefeuille/dashboard" className="inline-flex flex-col items-start group">
              <span className="text-[17px] font-semibold leading-tight" style={{ color: 'var(--text)' }}>Mon portefeuille</span>
              <div className="flex items-center gap-1.5 mt-1.5 pl-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--green)' }} aria-hidden="true" />
                <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>Portefeuille</span>
              </div>
            </Link>
          )}
          <button
            onClick={toggleCollapsed}
            onMouseEnter={(e) => showTip(e, 'Déployer le menu (Ctrl+B)')}
            onMouseLeave={() => setTip(null)}
            aria-label={collapsed ? 'Déployer le menu' : 'Réduire le menu'}
            aria-expanded={!collapsed}
            className={`hidden md:flex items-center justify-center rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/10 ${mini ? 'w-10 h-8' : 'absolute top-4 right-3 w-8 h-8'}`}
            style={{ color: 'var(--text-muted)' }}
            title={mini ? undefined : 'Réduire le menu (Ctrl+B)'}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        {/* Carte profil */}


        {/* Navigation */}
        <nav className={`flex-1 ${mini ? 'px-2' : 'px-3'} pb-4 overflow-y-auto overflow-x-hidden space-y-0.5 custom-scrollbar`}>
          {NAV.map(item => {
            const active = isActive(item.path);
            const count = item.alertKey ? alertCounts[item.alertKey] : 0;
            const hasAlert = count > 0;
            const tone = hasAlert ? ALERT_TONES.red : null;
            const category = item.category ?? 'Au quotidien';
            const showLabel = category && category !== lastCategory;
            lastCategory = category;

            return (
              <React.Fragment key={item.id}>
                {showLabel && (mini ? (
                  <div className="mx-3 my-2 h-px" style={{ background: 'var(--border)' }} />
                ) : (
                  <div className="px-4 pt-4 pb-1.5 first:pt-1">
                    <span className="shell-nav-section-title text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{category}</span>
                  </div>
                ))}
                <Link
                  href={item.path}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => { setTip(null); if (window.innerWidth < 768) onClose?.(); }}
                  onMouseEnter={(e) => showTip(e, hasAlert ? `${item.label} (${count})` : item.label)}
                  onMouseLeave={() => setTip(null)}
                  aria-label={mini ? (hasAlert ? `${item.label} (${count})` : item.label) : undefined}
                  className={`relative w-full flex items-center ${mini ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-xl text-sm ${hasAlert && !active ? 'font-semibold' : 'font-medium'} transition-all duration-200 group ${active ? '' : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'}`}
                  style={{
                    color: active ? 'var(--action)' : 'var(--text-secondary)',
                    background: active ? 'var(--brand-soft)' : 'transparent',
                    boxShadow: 'none',
                  }}
                >
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full" style={{ background: 'var(--brand)' }} />
                  )}
                  <item.icon
                    size={18}
                    className={`transition-transform duration-200 group-hover:scale-105 ${hasAlert && !active ? 'konza-wiggle' : ''}`}
                  />
                  {!mini && <span className="flex-1 truncate">{item.label}</span>}
                  {hasAlert && <SidebarCount count={count} mini={mini} />}
                </Link>
              </React.Fragment>
            );
          })}
        </nav>

        <SidebarAccount name={displayName} role={userRoleLabel ?? 'Portefeuille'} email={userEmail} photo={userPhotoUrl} mini={mini} onLogout={handleLogout} />
      </aside>

      {mini && tip && (
        <div
          className="fixed z-[60] -translate-y-1/2 px-3 py-1.5 rounded-xl text-xs font-semibold pointer-events-none shadow-lg whitespace-nowrap print:hidden"
          style={{ top: tip.top, left: tip.left, background: 'var(--text)', color: 'var(--bg)' }}
          role="tooltip"
        >
          {tip.label}
        </div>
      )}
    </>
  );
}