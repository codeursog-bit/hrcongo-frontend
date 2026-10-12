'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { NAVIGATION_ITEMS } from '@/lib/admin/constants';
import { Plus, Activity, Bug, RefreshCw, AlertTriangle, CheckCircle2, Zap, LogOut, X } from 'lucide-react';

export interface SidebarAlerts {
  level: 'OK' | 'WARNING' | 'CRITICAL';
  count: number;
  items: Array<{ key: string; level: 'WARNING' | 'CRITICAL'; title: string; detail: string; href: string }>;
}

interface SidebarProps {
  recentActivity?: Array<{
    id: string;
    type: 'success' | 'critical' | 'info';
    message: string;
    time: string;
  }>;
  /** Alertes réelles (null = chargement en cours) */
  alerts?: SidebarAlerts | null;
  onRefresh?: () => void;
  refreshing?: boolean;
  /** Tiroir pour les écrans < xl (le menu n'existait pas du tout avant) */
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  recentActivity = [], alerts = null, onRefresh, refreshing = false, mobileOpen = false, onMobileClose,
}) => {
  const pathname = usePathname();
  const router = useRouter();

  // Échap ferme le tiroir
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onMobileClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen, onMobileClose]);

  const handleLogout = async () => {
    // Le cookie HttpOnly est révoqué côté serveur
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch { /* silencieux */ } finally {
      localStorage.removeItem('admin_user');
      localStorage.removeItem('user');
      router.push('/admin/login');
    }
  };

  const alertTone =
    alerts?.level === 'CRITICAL' ? 'border-red-900/40'
    : alerts?.level === 'WARNING' ? 'border-orange-900/40'
    : 'border-green-900/30';
  const alertTitleTone =
    alerts?.level === 'CRITICAL' ? 'text-red-400'
    : alerts?.level === 'WARNING' ? 'text-orange-400'
    : 'text-green-400';

  const actionClass =
    'flex flex-col items-center justify-center p-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-all group';

  // Un seul bloc défilant (navigation + panneaux) : avant, la navigation était
  // hors de la zone défilante et les derniers menus étaient coupés.
  const content = (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">

        {/* Navigation Menu */}
        <div className="p-4 border-b border-gray-800">
          <nav className="space-y-1">
            {NAVIGATION_ITEMS.map((item) => {
              const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={onMobileClose}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-red/10 text-brand-red border border-brand-red/20'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${isActive ? 'text-brand-red' : 'text-gray-500'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 space-y-6">
          {/* Raccourcis — chacun mène à une vraie page ou lance une vraie action */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Zap className="w-3 h-3 text-brand-gold" /> Actions Rapides
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/admin/companies" onClick={onMobileClose} className={actionClass}>
                <Plus className="w-4 h-4 text-brand-red mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-medium text-gray-300">Entreprises</span>
              </Link>
              <Link href="/admin/serveur" onClick={onMobileClose} className={actionClass}>
                <Activity className="w-4 h-4 text-sky-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-medium text-gray-300">Serveur</span>
              </Link>
              <Link href="/admin/errors" onClick={onMobileClose} className={actionClass}>
                <Bug className="w-4 h-4 text-purple-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-medium text-gray-300">Erreurs</span>
              </Link>
              <button type="button" onClick={onRefresh} disabled={!onRefresh || refreshing} className={`${actionClass} disabled:opacity-50`}>
                <RefreshCw className={`w-4 h-4 text-green-400 mb-1 ${refreshing ? 'animate-spin' : 'group-hover:scale-110 transition-transform'}`} />
                <span className="text-[10px] font-medium text-gray-300">Actualiser</span>
              </button>
            </div>
          </div>

          {/* Alertes réelles */}
          <div className={`bg-gray-900 border ${alertTone} rounded-xl p-4`}>
            <h3 className={`text-xs font-bold ${alertTitleTone} uppercase tracking-wider mb-3 flex items-center gap-2`}>
              {alerts?.level === 'OK' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />} Alertes
              {alerts && alerts.count > 0 && <span className="ml-auto text-[10px] font-mono">{alerts.count}</span>}
            </h3>
            <div className="space-y-2">
              {alerts === null ? (
                <p className="text-xs text-gray-500 italic">Analyse en cours…</p>
              ) : alerts.items.length === 0 ? (
                <p className="text-xs text-green-400/80">Aucune alerte : tout est normal.</p>
              ) : (
                alerts.items.map((a) => {
                  const crit = a.level === 'CRITICAL';
                  return (
                    <Link
                      key={a.key}
                      href={a.href}
                      onClick={onMobileClose}
                      className={`p-2.5 rounded-lg flex items-start gap-2.5 border transition-colors ${
                        crit ? 'bg-red-900/10 border-red-900/30 hover:bg-red-900/20' : 'bg-orange-900/10 border-orange-900/30 hover:bg-orange-900/20'
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${crit ? 'bg-red-500 animate-pulse' : 'bg-orange-500'}`}></div>
                      <div className="min-w-0">
                        <p className={`text-[11px] font-bold leading-snug ${crit ? 'text-red-200' : 'text-orange-200'}`}>{a.title}</p>
                        <p className={`text-[10px] mt-0.5 leading-snug line-clamp-2 ${crit ? 'text-red-400/80' : 'text-orange-400/80'}`}>{a.detail}</p>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>

          {/* Flux en direct (activité réelle) */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Flux en Direct</h3>
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
            </div>

            <div className="relative pl-3 border-l border-gray-800 space-y-5">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="relative">
                    <div className={`absolute -left-[17px] top-1 w-2 h-2 rounded-full border border-gray-900 ${
                      activity.type === 'success' ? 'bg-green-500' :
                      activity.type === 'critical' ? 'bg-red-500' :
                      'bg-sky-500'
                    }`}></div>
                    <p className="text-[11px] text-gray-300 font-medium leading-snug">{activity.message}</p>
                    <span className="text-[10px] text-gray-600 font-mono mt-0.5 block">{activity.time}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 italic">Aucune activité récente</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-800 shrink-0">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-gray-500 hover:text-white text-xs font-medium w-full px-2 py-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Déconnexion
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Grand écran : menu fixe */}
      <aside className="hidden xl:flex flex-col w-[280px] shrink-0 border-l border-gray-800 bg-[#0B0F19]/50 backdrop-blur-sm h-full overflow-hidden">
        {content}
      </aside>

      {/* Petit écran : tiroir ouvert depuis l'en-tête */}
      {mobileOpen && (
        <div className="xl:hidden fixed inset-0 z-[60] flex">
          <div className="absolute inset-0 bg-black/60" onClick={onMobileClose} aria-hidden="true" />
          <aside className="relative w-[300px] max-w-[85vw] h-full bg-[#0B0F19] border-r border-gray-800 flex flex-col shadow-2xl">
            <button
              type="button"
              onClick={onMobileClose}
              aria-label="Fermer le menu"
              className="absolute top-3 right-3 z-10 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <X className="w-4 h-4" />
            </button>
            {content}
          </aside>
        </div>
      )}
    </>
  );
};