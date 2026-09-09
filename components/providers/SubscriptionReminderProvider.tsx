'use client';

// ============================================================================
// 🔔 SubscriptionReminderProvider
// ----------------------------------------------------------------------------
// Rappelle à l'admin/RH que l'essai ou l'abonnement payant de l'entreprise
// arrive à échéance : toast doux à J-7, toast plus visible à J-3, modal
// difficile à ignorer à J-1 (dernier jour). Un seul affichage par palier et
// par jour (dédoublonné en localStorage) pour ne pas spammer à chaque
// changement de page.
//
// Ne s'affiche JAMAIS pour les employés (rôle EMPLOYEE/MANAGER) — la
// facturation ne les concerne pas ; côté employé, c'est le blocage doux
// "Accès bloqué, contactez votre RH" (côté backend) qui prend le relais si
// l'entreprise finit par repasser en Gratuit.
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { AlarmClock, ArrowRight, Clock3, ShieldAlert, X } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

// ============================================================================
// 🔑 HELPERS
// ============================================================================

const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'];

function getStoredRole(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.role ?? null;
  } catch {
    return null;
  }
}

const todayKey = () => new Date().toISOString().slice(0, 10);

/** Un seul affichage par palier (7/3/1) et par jour civil, par entreprise. */
function alreadyShownToday(dedupKey: string): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(dedupKey) === todayKey();
}
function markShownToday(dedupKey: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(dedupKey, todayKey());
}

// ============================================================================
// 🍞 TOAST (J-7 / J-3)
// ============================================================================

interface ReminderToastProps {
  visible: boolean;
  urgency: 'info' | 'warning';
  daysLeft: number;
  kind: 'essai' | 'abonnement';
  onClose: () => void;
  onRenew: () => void;
}

const ReminderToast: React.FC<ReminderToastProps> = ({
  visible,
  urgency,
  daysLeft,
  kind,
  onClose,
  onRenew,
}) => {
  const isWarning = urgency === 'warning';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40, x: 0 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="fixed bottom-4 right-4 z-[9997] w-[calc(100vw-2rem)] max-w-sm"
        >
          <div className="glass-panel rounded-2xl p-4 shadow-xl border border-white/20 dark:border-white/10 relative overflow-hidden">
            <div
              className={`absolute inset-0 pointer-events-none ${
                isWarning
                  ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/5'
                  : 'bg-gradient-to-br from-cyan-500/10 to-blue-500/5'
              }`}
            />
            <div className="relative z-10 flex gap-3">
              <div
                className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                  isWarning
                    ? 'bg-gradient-to-br from-amber-500 to-orange-500'
                    : 'bg-gradient-to-br from-cyan-500 to-blue-500'
                }`}
              >
                {isWarning ? (
                  <AlarmClock size={18} className="text-white" />
                ) : (
                  <Clock3 size={18} className="text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {kind === 'essai' ? 'Votre essai gratuit' : 'Votre abonnement'} se
                  termine dans {daysLeft} jour{daysLeft > 1 ? 's' : ''}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Pensez à renouveler pour ne pas perdre l'accès complet.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={onRenew}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-transform hover:scale-[1.03] ${
                      isWarning
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                    }`}
                  >
                    Renouveler
                  </button>
                  <button
                    onClick={onClose}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-white/5 transition-colors"
                  >
                    Plus tard
                  </button>
                </div>
              </div>
              <button
                onClick={onClose}
                className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-white/5 transition-colors h-fit"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ============================================================================
// 🚨 MODAL (J-1 — dernier jour)
// ============================================================================

interface ReminderModalProps {
  isOpen: boolean;
  kind: 'essai' | 'abonnement';
  planName?: string;
  onClose: () => void;
  onRenew: () => void;
}

const LastCallModal: React.FC<ReminderModalProps> = ({
  isOpen,
  kind,
  planName,
  onClose,
  onRenew,
}) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
        />
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-full max-w-md pointer-events-auto"
          >
            <div className="glass-panel rounded-3xl p-6 sm:p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-orange-500/5 to-amber-500/10 pointer-events-none" />

              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100/50 dark:bg-white/5 hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors z-10"
              >
                <X size={18} className="text-slate-600 dark:text-slate-400" />
              </button>

              <div className="relative z-10">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/20">
                  <ShieldAlert size={32} className="text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-center mb-3 text-slate-900 dark:text-white">
                  Dernier jour avant échéance
                </h3>
                <p className="text-center text-slate-600 dark:text-slate-400 mb-6 text-sm sm:text-base">
                  {kind === 'essai'
                    ? "Votre essai gratuit se termine demain."
                    : `Votre abonnement ${planName ? `« ${planName} »` : ''} se termine demain.`}{' '}
                  Sans renouvellement, votre entreprise repassera automatiquement sur le
                  plan Gratuit : ajout d'employé, paie groupée et pointage au-delà du
                  quota inclus seront alors limités pour votre équipe.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={onRenew}
                    className="w-full py-3 px-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    Renouveler maintenant
                    <ArrowRight size={18} />
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full py-3 px-4 bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 border border-white/40 dark:border-white/10 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-all text-sm"
                  >
                    Plus tard
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </>
    )}
  </AnimatePresence>
);

// ============================================================================
// 🔄 PROVIDER
// ============================================================================

const EXCLUDED_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/companies/create',
  '/parametres/subscription', // déjà sur la page de renouvellement, pas besoin de le relancer
];

export const SubscriptionReminderProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { subscription, isOnTrial, daysLeft, isExpiringSoon, renewalUrgency, isLoading } =
    useSubscription();

  const [showToast, setShowToast] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const isAdmin = useMemo(() => {
    const role = getStoredRole();
    return !!role && ADMIN_ROLES.includes(role);
  }, [pathname]); // recalculé à chaque navigation (ex: juste après connexion)

  const kind: 'essai' | 'abonnement' = isOnTrial ? 'essai' : 'abonnement';
  const planName = subscription?.planDetails?.name;

  useEffect(() => {
    if (isLoading || !isAdmin) return;
    if (EXCLUDED_PATHS.some((p) => pathname?.startsWith(p))) return;
    if (!isExpiringSoon || !subscription?.id || daysLeft == null) return;

    const dedupKey = `sub-reminder:${subscription.id}:${renewalUrgency}`;

    // Petit délai pour laisser la page se charger avant d'afficher quoi que
    // ce soit (cohérent avec le reste de l'app, voir CompanyReminderProvider).
    const timer = setTimeout(() => {
      if (alreadyShownToday(dedupKey)) return;
      markShownToday(dedupKey);

      if (renewalUrgency === 'urgent') {
        setShowModal(true);
      } else {
        setShowToast(true);
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [isLoading, isAdmin, pathname, isExpiringSoon, subscription?.id, daysLeft, renewalUrgency]);

  const goToSubscriptionPage = () => {
    setShowToast(false);
    setShowModal(false);
    router.push('/parametres/subscription');
  };

  if (!isAdmin) return <>{children}</>;

  return (
    <>
      {children}
      {renewalUrgency !== 'urgent' && daysLeft != null && (
        <ReminderToast
          visible={showToast}
          urgency={renewalUrgency === 'warning' ? 'warning' : 'info'}
          daysLeft={daysLeft}
          kind={kind}
          onClose={() => setShowToast(false)}
          onRenew={goToSubscriptionPage}
        />
      )}
      <LastCallModal
        isOpen={showModal}
        kind={kind}
        planName={planName}
        onClose={() => setShowModal(false)}
        onRenew={goToSubscriptionPage}
      />
    </>
  );
};