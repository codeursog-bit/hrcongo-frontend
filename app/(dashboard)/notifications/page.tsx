'use client';

// ============================================================================
// 📁 app/(dashboard)/notifications/page.tsx
// ✅ Restrictions par rôle :
//    - EMPLOYEE   → ses notifs perso uniquement (congés, paie)
//    - RH/ADMIN   → tout (+ contrats expirants)
// ✅ Fix bug isRead : utilise n.isRead partout (cohérent avec TopNav)
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Bell, CheckCircle2, Clock, AlertTriangle,
  Info, Calendar, Loader2, CalendarDays, ShieldAlert,
} from 'lucide-react';
import { api } from '@/services/api';

// Rôles qui voient les alertes contrat
const HR_ROLES = ['ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'];

// Filtre tabs selon le rôle
const getFilters = (role: string) => {
  const base = [
    { key: 'ALL',        label: 'Tout' },
    { key: 'LEAVE',      label: 'Congés' },
    { key: 'PAYROLL',    label: 'Paie' },
    { key: 'ATTENDANCE', label: 'Pointage' },
  ];
  if (HR_ROLES.includes(role)) {
    base.push({ key: 'CONTRACT', label: '📋 Contrats' });
  }
  return base;
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading]         = useState(true);
  const [filter, setFilter]               = useState('ALL');
  const [userRole, setUserRole]           = useState<string>('EMPLOYEE');

  useEffect(() => {
    // Récupère le rôle depuis localStorage (même source que TopNav)
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        setUserRole(u.role ?? 'EMPLOYEE');
      }
    } catch {}
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await api.get<any[]>('/notifications?limit=100');
      setNotifications(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`, {});
      // ✅ Fix : utilise isRead (cohérent avec TopNav)
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all', {});
      // ✅ Fix : utilise isRead
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  // ── Filtrage par rôle ────────────────────────────────────────────────────
  const visibleNotifications = notifications.filter(n => {
    const isContractAlert =
      n.type === 'ATTENDANCE_ALERT' &&
      n.metadata?.notificationType === 'CONTRACT_EXPIRY';

    // EMPLOYEE : ne voit PAS les alertes contrat (réservées RH/Admin)
    if (!HR_ROLES.includes(userRole) && isContractAlert) return false;

    return true;
  });

  // ── Filtrage par tab ─────────────────────────────────────────────────────
  const filtered = visibleNotifications.filter(n => {
    if (filter === 'ALL') return true;
    if (filter === 'CONTRACT') {
      return (
        n.type === 'ATTENDANCE_ALERT' &&
        n.metadata?.notificationType === 'CONTRACT_EXPIRY'
      );
    }
    // Pour les autres tabs on exclut les alertes contrat du tab ATTENDANCE
    if (filter === 'ATTENDANCE') {
      return (
        n.type.includes('ATTENDANCE') &&
        n.metadata?.notificationType !== 'CONTRACT_EXPIRY'
      );
    }
    return n.type.includes(filter);
  });

  // ✅ Fix : compte non lus avec isRead
  const unreadCount = visibleNotifications.filter(n => !n.isRead).length;

  const getIcon = (n: any) => {
    // Icône spéciale pour les alertes contrat
    if (n.metadata?.notificationType === 'CONTRACT_EXPIRY') {
      const days = n.metadata?.daysLeft ?? 99;
      if (days <= 7)  return <CalendarDays className="text-red-500" size={20} />;
      if (days <= 14) return <CalendarDays className="text-orange-500" size={20} />;
      return <CalendarDays className="text-yellow-500" size={20} />;
    }

    switch (n.type) {
      case 'LEAVE_REQUEST':
      case 'LEAVE_APPROVED':
      case 'LEAVE_REJECTED':
        return <Calendar className="text-sky-500" size={20} />;
      case 'PAYROLL_READY':
        return <CheckCircle2 className="text-emerald-500" size={20} />;
      case 'ATTENDANCE_ALERT':
        return <Clock className="text-orange-500" size={20} />;
      case 'PAYROLL_ERROR':
      case 'SYSTEM_ALERT':
        return <AlertTriangle className="text-red-500" size={20} />;
      default:
        return <Info className="text-gray-500" size={20} />;
    }
  };

  // Couleur de bordure gauche selon urgence
  const getBorderColor = (n: any) => {
    if (n.isRead) return 'border-gray-100 dark:border-gray-700';
    if (n.metadata?.notificationType === 'CONTRACT_EXPIRY') {
      const days = n.metadata?.daysLeft ?? 99;
      if (days <= 7)  return 'border-l-4 border-l-red-500 border-gray-200 dark:border-gray-700';
      if (days <= 14) return 'border-l-4 border-l-orange-500 border-gray-200 dark:border-gray-700';
      return 'border-l-4 border-l-yellow-400 border-gray-200 dark:border-gray-700';
    }
    return 'border-l-4 border-l-sky-500 border-gray-200 dark:border-gray-700';
  };

  const filters = getFilters(userRole);

  return (
    <div className="max-w-[1000px] mx-auto pb-20 space-y-8">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 bg-white dark:bg-gray-800 rounded-xl border hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              Notifications
              {unreadCount > 0 && (
                <span className="px-3 py-1 text-sm bg-red-500 text-white rounded-full">
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {HR_ROLES.includes(userRole)
                ? 'Vue complète — Admin / RH'
                : 'Vos notifications personnelles'}
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="px-4 py-2 text-sm font-bold text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-xl transition-colors"
          >
            Tout marquer comme lu
          </button>
        )}
      </div>

      {/* BANDEAU INFO ROLE */}
      {!HR_ROLES.includes(userRole) && (
        <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-600 dark:text-slate-400">
          <Info size={16} className="text-slate-400 shrink-0" />
          Vous voyez uniquement vos notifications personnelles (congés, paie, pointage).
        </div>
      )}

      {/* TABS */}
      <div className="flex gap-2 pb-2 overflow-x-auto">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all whitespace-nowrap ${
              filter === f.key
                ? 'bg-sky-500 text-white border-sky-500'
                : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700 hover:border-sky-300'
            }`}
          >
            {f.label}
            {/* Badge sur l'onglet Contrats */}
            {f.key === 'CONTRACT' && (() => {
              const contractUnread = visibleNotifications.filter(
                n => !n.isRead &&
                     n.metadata?.notificationType === 'CONTRACT_EXPIRY'
              ).length;
              return contractUnread > 0 ? (
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">
                  {contractUnread}
                </span>
              ) : null;
            })()}
          </button>
        ))}
      </div>

      {/* LISTE */}
      {isLoading ? (
        <div className="flex justify-center p-20">
          <Loader2 className="animate-spin text-sky-500" size={48} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center p-20 text-gray-400 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
          <Bell size={48} className="mx-auto mb-4 opacity-20" />
          <p className="font-medium">Aucune notification</p>
          <p className="text-sm mt-1 opacity-60">
            {filter === 'CONTRACT' ? 'Aucune alerte contrat en cours' : 'Tout est à jour !'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(n => (
            <div
              key={n.id}
              onClick={() => !n.isRead && handleMarkAsRead(n.id)}
              className={`bg-white dark:bg-gray-800 p-5 rounded-2xl border flex gap-4 transition-all cursor-pointer hover:shadow-md ${getBorderColor(n)}`}
            >
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl h-fit shrink-0">
                {getIcon(n)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2 mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      {n.title}
                    </h3>
                    {!n.isRead && (
                      <span className="w-2 h-2 bg-sky-500 rounded-full shrink-0" />
                    )}
                    {/* Badge urgence pour contrats */}
                    {n.metadata?.notificationType === 'CONTRACT_EXPIRY' && (
                      <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                        (n.metadata?.daysLeft ?? 99) <= 7
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : (n.metadata?.daysLeft ?? 99) <= 14
                          ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        J-{n.metadata?.daysLeft}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 font-mono shrink-0">
                    {new Date(n.createdAt).toLocaleString('fr-FR', {
                      day: '2-digit', month: '2-digit',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </div>

                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                  {n.message}
                </p>

                {/* Lien direct vers l'employé pour les alertes contrat */}
                {n.metadata?.notificationType === 'CONTRACT_EXPIRY' && n.link && (
                  <button
                    onClick={(e) => { e.stopPropagation(); router.push(n.link); }}
                    className="mt-2 text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline"
                  >
                    Voir l'employé →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}