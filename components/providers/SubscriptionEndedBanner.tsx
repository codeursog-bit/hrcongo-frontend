'use client';

// ============================================================================
// 💙 SubscriptionEndedBanner
// ----------------------------------------------------------------------------
// Différent de <SubscriptionReminderProvider> (qui prévient AVANT l'échéance,
// J-7/J-3/J-1) : ce bandeau s'affiche APRÈS coup, quand l'entreprise vient
// d'être rétrogradée en Gratuit faute de renouvellement
// (subscription.downgradedAt renseigné côté backend — voir
// checkExpiredSubscriptions). Jamais affiché si l'entreprise a simplement
// toujours été sur le plan Gratuit.
//
// Positionné en bas à gauche, discret — un bandeau, pas une modale plein
// écran : on veut prévenir, pas interrompre. Le ton reste chaleureux des
// deux côtés (admin/RH vs employé), jamais culpabilisant.
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, ArrowRight, X } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'];

function getStoredRole(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    return JSON.parse(raw)?.role ?? null;
  } catch {
    return null;
  }
}

const todayKey = () => new Date().toISOString().slice(0, 10);

const EXCLUDED_PATHS = [
  '/auth/login',
  '/auth/register',
  '/companies/create',
  '/parametres/subscription', // déjà sur la page de renouvellement
];

export const SubscriptionEndedBanner: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { subscription, isLoading } = useSubscription();
  const [visible, setVisible] = useState(false);

  const role = useMemo(() => getStoredRole(), [pathname]);
  const isAdmin = !!role && ADMIN_ROLES.includes(role);

  const isDowngraded = !!subscription?.downgradedAt && subscription?.plan === 'FREE';

  useEffect(() => {
    if (isLoading || !isDowngraded) return;
    if (EXCLUDED_PATHS.some((p) => pathname?.startsWith(p))) return;

    // Une fois par jour civil, par entreprise — assez pour rester présent
    // sans harceler à chaque changement de page.
    const dedupKey = `sub-ended-banner:${subscription?.id}`;
    const lastShown = typeof window !== 'undefined' ? localStorage.getItem(dedupKey) : null;
    if (lastShown === todayKey()) return;

    const timer = setTimeout(() => {
      setVisible(true);
      if (typeof window !== 'undefined') localStorage.setItem(dedupKey, todayKey());
    }, 1500);
    return () => clearTimeout(timer);
  }, [isLoading, isDowngraded, pathname, subscription?.id]);

  const close = () => setVisible(false);
  const goRenew = () => {
    close();
    router.push('/parametres/subscription');
  };

  if (!isDowngraded) return null;

  const planName = subscription?.planDetails?.name;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: -40, y: 0 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ type: 'spring', stiffness: 280, damping: 26 }}
          className="fixed bottom-4 left-4 z-[9996] w-[calc(100vw-2rem)] max-w-sm"
        >
          <div className="glass-panel rounded-2xl p-4 shadow-xl border border-white/20 dark:border-white/10 relative overflow-hidden bg-white dark:bg-slate-900">
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-rose-400/10 via-pink-400/5 to-amber-300/10" />

            <div className="relative z-10 flex gap-3">
              <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-rose-400 to-amber-400">
                <Heart size={18} className="text-white" fill="white" />
              </div>

              <div className="flex-1 min-w-0">
                {isAdmin ? (
                  <>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      Votre abonnement est terminé
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      Certaines fonctionnalités sont désormais limitées{planName ? ` (retour au plan ${planName})` : ''}.
                      Réactivez votre abonnement quand vous voulez pour retrouver un accès complet, en toute tranquillité.
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={goRenew}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white bg-gradient-to-r from-rose-400 to-amber-400 transition-transform hover:scale-[1.03] flex items-center gap-1"
                      >
                        Renouveler
                        <ArrowRight size={12} />
                      </button>
                      <button
                        onClick={close}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-white/5 transition-colors"
                      >
                        Plus tard
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      Un petit mot de votre entreprise
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      L'abonnement de votre entreprise est arrivé à échéance et certaines actions sont
                      temporairement limitées. N'hésitez pas à contacter votre RH ou administrateur pour
                      en savoir plus.
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={close}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white bg-gradient-to-r from-rose-400 to-amber-400 transition-transform hover:scale-[1.03]"
                      >
                        J'ai compris
                      </button>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={close}
                className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-white/5 transition-colors h-fit"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};