'use client';

// ============================================================================
// 📁 components/contracts/ContractExpiryToast.tsx
// ✅ Modal bas-droite visible uniquement pour Admin / HR_MANAGER / SUPER_ADMIN
// ✅ Polling /notifications toutes les 5 min
// ✅ Affiche les alertes contrat non lues
// ✅ SILENCE si plus aucune alerte (date passée)
// ✅ Prolongation → nouvelles alertes automatiquement
// ✅ Pas d'email, pas d'auth supplémentaire — utilise votre API existante
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  CalendarDays, X, ChevronRight, Clock,
  AlertTriangle, CheckCircle2, Bell,
} from 'lucide-react';
import { api } from '@/services/api';
import { differenceInDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Rôles autorisés à voir les alertes contrat
const ALLOWED_ROLES = ['ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'];
const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes

interface ContractAlert {
  id: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
  metadata?: {
    employeeId?: string;
    threshold?: number;
    daysLeft?: number;
    totalDays?: number;
    contractEndDate?: string;
    contractType?: string;
    notificationType?: 'CONTRACT_EXPIRY' | 'CONTRACT_EXPIRED';
  };
}

function getUrgencyStyle(daysLeft: number) {
  if (daysLeft <= 0)  return { bar: 'bg-red-500',    badge: 'bg-red-100 text-red-700',    dot: 'bg-red-500',    label: 'Expiré' };
  if (daysLeft <= 7)  return { bar: 'bg-red-500',    badge: 'bg-red-100 text-red-700',    dot: 'bg-red-500',    label: `${daysLeft}j restants` };
  if (daysLeft <= 14) return { bar: 'bg-orange-500', badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500', label: `${daysLeft}j restants` };
  if (daysLeft <= 30) return { bar: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500', label: `${daysLeft}j restants` };
  return               { bar: 'bg-blue-500',    badge: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-400',   label: `${daysLeft}j restants` };
}

const CONTRACT_COLORS: Record<string, string> = {
  CDD:        'bg-blue-100 text-blue-700',
  STAGE:      'bg-purple-100 text-purple-700',
  INTERIM:    'bg-pink-100 text-pink-700',
  CONSULTANT: 'bg-cyan-100 text-cyan-700',
};

// ─── COMPOSANT PRINCIPAL ─────────────────────────────────────────────────────
export function ContractExpiryToast({ userRole }: { userRole: string }) {
  const router = useRouter();
  const [alerts, setAlerts]             = useState<ContractAlert[]>([]);
  const [isOpen, setIsOpen]             = useState(false);
  const [dismissed, setDismissed]       = useState(false);
  const [markingId, setMarkingId]       = useState<string | null>(null);
  const autoShownRef                    = useRef(false);
  const intervalRef                     = useRef<ReturnType<typeof setInterval> | null>(null);

  // Ne rien afficher si pas le bon rôle
  const isAllowed = ALLOWED_ROLES.includes(userRole);

  // ── Fetch alertes contrat non lues ──────────────────────────────────────
  const fetchAlerts = useCallback(async () => {
    if (!isAllowed) return;
    try {
      const data = await api.get<any[]>('/notifications?limit=50');
      const contractAlerts = (data || []).filter(
        (n) =>
          !n.read &&
          (n.metadata?.notificationType === 'CONTRACT_EXPIRY' ||
           n.metadata?.notificationType === 'CONTRACT_EXPIRED'),
      ) as ContractAlert[];

      setAlerts(contractAlerts);

      // Auto-afficher le toast si nouvelles alertes critiques (≤7j) et pas encore montré
      const hasCritical = contractAlerts.some(
        (a) => (a.metadata?.daysLeft ?? 999) <= 7,
      );
      if (hasCritical && !autoShownRef.current && !dismissed) {
        autoShownRef.current = true;
        setIsOpen(true);
      }
    } catch {
      // Silencieux
    }
  }, [isAllowed, dismissed]);

  useEffect(() => {
    fetchAlerts();
    intervalRef.current = setInterval(fetchAlerts, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchAlerts]);

  // ── Marquer comme lu ────────────────────────────────────────────────────
  const markRead = async (id: string) => {
    setMarkingId(id);
    try {
      await api.patch(`/notifications/${id}/read`, {});
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch {}
    finally { setMarkingId(null); }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all', {});
      setAlerts([]);
      setIsOpen(false);
    } catch {}
  };

  // ── Naviguer vers l'employé ──────────────────────────────────────────────
  const goToEmployee = (alert: ContractAlert) => {
    if (alert.link) router.push(alert.link);
    markRead(alert.id);
  };

  if (!isAllowed || alerts.length === 0) return null;

  const criticalCount = alerts.filter((a) => (a.metadata?.daysLeft ?? 999) <= 7).length;
  const topAlert      = alerts[0];
  const topDaysLeft   = topAlert?.metadata?.daysLeft ?? 0;
  const topUrgency    = getUrgencyStyle(topDaysLeft);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

      {/* ── PANEL ÉTENDU ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{ opacity: 0,  y: 12, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="w-[360px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            style={{ boxShadow: '0 20px 60px -12px rgba(0,0,0,0.25)' }}
          >
            {/* Barre colorée urgence maximale */}
            <div className={`h-1 w-full ${topUrgency.bar}`} />

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
                  <AlertTriangle size={15} className="text-gray-600 dark:text-gray-300" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">
                    Contrats expirants
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {alerts.length} alerte{alerts.length > 1 ? 's' : ''} non lue{alerts.length > 1 ? 's' : ''}
                    {criticalCount > 0 && (
                      <span className="ml-1 text-red-500 font-semibold">· {criticalCount} critique{criticalCount > 1 ? 's' : ''}</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={markAllRead}
                  className="rounded-lg px-2 py-1 text-[11px] font-semibold text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 transition-colors">
                  Tout lu
                </button>
                <button onClick={() => { setIsOpen(false); setDismissed(true); }}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Liste alertes (max 4 dans le toast) */}
            <div className="max-h-[360px] overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800">
              {alerts.slice(0, 4).map((alert) => {
                const daysLeft = alert.metadata?.daysLeft ?? 0;
                const u        = getUrgencyStyle(daysLeft);
                const endDate  = alert.metadata?.contractEndDate
                  ? format(new Date(alert.metadata.contractEndDate), 'd MMM yyyy', { locale: fr })
                  : '—';

                return (
                  <div key={alert.id} className="group px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-start gap-3">
                      {/* Dot urgence */}
                      <div className="mt-1.5 flex-shrink-0">
                        <span className={`block h-2 w-2 rounded-full ${u.dot}`} />
                      </div>

                      {/* Contenu */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold ${u.badge}`}>
                            {u.label}
                          </span>
                          {alert.metadata?.contractType && (
                            <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold ${CONTRACT_COLORS[alert.metadata.contractType] ?? 'bg-gray-100 text-gray-600'}`}>
                              {alert.metadata.contractType}
                            </span>
                          )}
                        </div>

                        {/* Nom employé extrait du titre */}
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {alert.title.replace(/^[🔴🟠🟡⚠️]\s*(CDD|Stage|Intérim|Consultant|Contrat).*?—\s*/, '')}
                        </p>

                        <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <Clock size={10} /> Expire le {endDate}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => goToEmployee(alert)}
                          className="rounded-lg p-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors"
                          title="Voir l'employé"
                        >
                          <ChevronRight size={12} />
                        </button>
                        <button
                          onClick={() => markRead(alert.id)}
                          disabled={markingId === alert.id}
                          className="rounded-lg p-1.5 border border-gray-200 dark:border-gray-700 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          title="Marquer lu"
                        >
                          <CheckCircle2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer si plus de 4 */}
            {alerts.length > 4 && (
              <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <p className="text-xs text-gray-400 text-center">
                  + {alerts.length - 4} autre{alerts.length - 4 > 1 ? 's' : ''} alerte{alerts.length - 4 > 1 ? 's' : ''}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BOUTON FLOTTANT (toujours visible si alertes) ──────────────── */}
      <motion.button
        onClick={() => { setIsOpen((o) => !o); setDismissed(false); }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative flex items-center gap-2.5 rounded-2xl bg-gray-900 dark:bg-white px-4 py-3 text-white dark:text-gray-900 shadow-2xl transition-all"
        style={{ boxShadow: '0 8px 32px -8px rgba(0,0,0,0.35)' }}
      >
        {/* Icône + badge */}
        <div className="relative">
          <Bell size={18} />
          {alerts.length > 0 && (
            <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white">
              {alerts.length > 9 ? '9+' : alerts.length}
            </span>
          )}
        </div>

        {/* Label compact */}
        <span className="text-sm font-bold whitespace-nowrap">
          {criticalCount > 0
            ? `${criticalCount} contrat${criticalCount > 1 ? 's' : ''} urgent${criticalCount > 1 ? 's' : ''}`
            : `${alerts.length} alerte${alerts.length > 1 ? 's' : ''} contrat`}
        </span>

        {/* Point pulsant si critique */}
        {criticalCount > 0 && (
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
        )}
      </motion.button>
    </div>
  );
}