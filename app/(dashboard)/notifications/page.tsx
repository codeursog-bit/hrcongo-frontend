'use client';

// ============================================================================
// 📁 app/(dashboard)/notifications/page.tsx
// ✅ Restrictions par rôle :
//    - EMPLOYEE   → ses notifs perso uniquement (congés, paie)
//    - RH/ADMIN   → tout (+ contrats expirants)
// ✅ Fix bug champ : le backend renvoie `read` (champ Prisma réel), pas `isRead` — utilisé partout maintenant, cohérent avec TopNav
// 🎨 Refonte design : tokens CSS + palette émeraude/ambre.
//    L'échelle d'urgence contrat (rouge → orange → jaune) est fonctionnelle : conservée.
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

  // ✅ Lire une notification la SUPPRIME désormais (comportement demandé),
  //    au lieu de juste la marquer lue et la garder affichée.
  const handleMarkAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`, {});
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  // ✅ "Tout marquer lu" supprime maintenant toutes les notifications non lues
  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all', {});
      setNotifications(prev => prev.filter(n => n.read));
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

  // ✅ Fix : compte les non-lus avec le vrai champ `read`
  const unreadCount = visibleNotifications.filter(n => !n.read).length;

  const getIcon = (n: any) => {
    // Icône spéciale pour les alertes contrat — échelle d'urgence fonctionnelle, conservée
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
        return <Calendar className="text-emerald-500" size={20} />;
      case 'PAYROLL_READY':
        return <CheckCircle2 className="text-emerald-500" size={20} />;
      case 'ATTENDANCE_ALERT':
        return <Clock className="text-amber-500" size={20} />;
      case 'PAYROLL_ERROR':
      case 'SYSTEM_ALERT':
        return <AlertTriangle className="text-red-500" size={20} />;
      default:
        return <Info className="text-[var(--text-muted)]" size={20} />;
    }
  };

  // Couleur de bordure gauche selon urgence
  const getBorderColor = (n: any) => {
    if (n.read) return 'border-[var(--border)]';
    if (n.metadata?.notificationType === 'CONTRACT_EXPIRY') {
      const days = n.metadata?.daysLeft ?? 99;
      if (days <= 7)  return 'border-l-4 border-l-red-500 border-[var(--border)]';
      if (days <= 14) return 'border-l-4 border-l-orange-500 border-[var(--border)]';
      return 'border-l-4 border-l-yellow-400 border-[var(--border)]';
    }
    return 'border-l-4 border-l-emerald-500 border-[var(--border)]';
  };

  const filters = getFilters(userRole);

  return (
    <div className="max-w-[1000px] mx-auto pb-20 space-y-8">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 bg-[var(--surface)] text-[var(--text)] rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-[var(--text)] flex items-center gap-3">
              Notifications
              {unreadCount > 0 && (
                <span className="px-3 py-1 text-sm bg-red-500 text-white rounded-full">
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="text-[var(--text-muted)] text-sm mt-0.5">
              {HR_ROLES.includes(userRole)
                ? 'Vue complète — Admin / RH'
                : 'Vos notifications personnelles'}
            </p>
          </div>
        </div>

        {/* ✅ Toujours visible, désactivé s'il n'y a rien à marquer lu */}
        <button
          onClick={handleMarkAllAsRead}
          disabled={unreadCount === 0}
          className={`px-4 py-2 text-sm font-bold rounded-xl transition-colors ${
            unreadCount === 0
              ? 'text-[var(--text-muted)] opacity-50 cursor-not-allowed'
              : 'text-emerald-500 hover:bg-emerald-500/10'
          }`}
        >
          Tout marquer comme lu
        </button>
      </div>

      {/* BANDEAU INFO ROLE */}
      {!HR_ROLES.includes(userRole) && (
        <div className="flex items-center gap-3 p-4 bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl text-sm text-[var(--text-muted)]">
          <Info size={16} className="text-[var(--text-muted)] shrink-0" />
          Vous voyez uniquement vos notifications personnelles (congés, paie, pointage).
        </div>
      )}

      {/* TABS */}
      <div className="flex gap-2 pb-2 overflow-x-auto">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors whitespace-nowrap ${
              filter === f.key
                ? 'bg-emerald-500 text-white border-emerald-500'
                : 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] hover:border-emerald-500/40'
            }`}
          >
            {f.label}
            {/* Badge sur l'onglet Contrats */}
            {f.key === 'CONTRACT' && (() => {
              const contractUnread = visibleNotifications.filter(
                n => !n.read &&
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
          <Loader2 className="animate-spin text-emerald-500" size={48} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center p-20 text-[var(--text-muted)] bg-[var(--surface)] rounded-2xl border border-dashed border-[var(--border)]">
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
              onClick={() => !n.read && handleMarkAsRead(n.id)}
              className={`bg-[var(--surface)] p-5 rounded-2xl border flex gap-4 transition-colors cursor-pointer hover:bg-[var(--surface-2)] ${getBorderColor(n)}`}
            >
              <div className="p-3 bg-[var(--surface-2)] rounded-xl h-fit shrink-0">
                {getIcon(n)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2 mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-[var(--text)]">
                      {n.title}
                    </h3>
                    {!n.read && (
                      <span className="w-2 h-2 bg-emerald-500 rounded-full shrink-0" />
                    )}
                    {/* Badge urgence pour contrats — échelle fonctionnelle, conservée */}
                    {n.metadata?.notificationType === 'CONTRACT_EXPIRY' && (
                      <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                        (n.metadata?.daysLeft ?? 99) <= 7
                          ? 'bg-red-500/15 text-red-500'
                          : (n.metadata?.daysLeft ?? 99) <= 14
                          ? 'bg-orange-500/15 text-orange-500'
                          : 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400'
                      }`}>
                        J-{n.metadata?.daysLeft}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[var(--text-muted)] font-mono shrink-0">
                    {new Date(n.createdAt).toLocaleString('fr-FR', {
                      day: '2-digit', month: '2-digit',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </div>

                <p className="text-[var(--text-muted)] text-sm leading-relaxed">
                  {n.message}
                </p>

                <div className="flex items-center gap-4 mt-2">
                  {/* Lien direct vers l'employé pour les alertes contrat */}
                  {n.metadata?.notificationType === 'CONTRACT_EXPIRY' && n.link && (
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push(n.link); }}
                      className="text-xs font-bold text-emerald-500 hover:underline"
                    >
                      Voir l'employé →
                    </button>
                  )}

                  {/* ✅ Bouton dédié par notification — marque UNE SEULE
                      notification, indépendamment de "Tout marquer comme lu" */}
                  {!n.read && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleMarkAsRead(n.id); }}
                      className="flex items-center gap-1 text-xs font-bold text-[var(--text-muted)] hover:text-emerald-500 transition-colors"
                    >
                      <CheckCircle2 size={14} /> Marquer comme lue
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}