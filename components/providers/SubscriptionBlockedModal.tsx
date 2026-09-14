'use client';

// ============================================================================
// 🚧 SubscriptionBlockedModal
// ----------------------------------------------------------------------------
// Écoute l'événement global 'subscription-blocked' (déclenché par
// services/api.ts dès qu'une réponse porte { error: 'SUBSCRIPTION_BLOCKED' })
// et affiche une vraie modale — plutôt que le message générique perdu dans
// un toast — quelle que soit l'action à l'origine du blocage : ajout
// d'employé, demande de formation, de congé, de prêt, pointage, offre
// d'emploi... tout passe par le même mécanisme côté backend
// (SubscriptionGuard.throwSubscriptionBlocked), donc une seule modale ici
// couvre tous les cas sans avoir à toucher chaque page.
//
// Le contenu s'adapte à l'audience renvoyée par le backend :
//   - ADMIN/RH  → message + bouton vers la page d'abonnement
//   - EMPLOYEE  → message doux "contactez votre RH", pas de bouton paiement
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, MessageCircle, X } from 'lucide-react';

interface BlockedDetail {
  message: string;
  audience: 'ADMIN' | 'EMPLOYEE';
}

export const SubscriptionBlockedModal: React.FC = () => {
  const router = useRouter();
  const [detail, setDetail] = useState<BlockedDetail | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<BlockedDetail>;
      if (custom.detail?.message) setDetail(custom.detail);
    };
    window.addEventListener('subscription-blocked', handler);
    return () => window.removeEventListener('subscription-blocked', handler);
  }, []);

  const close = () => setDetail(null);
  const goToSubscription = () => {
    close();
    router.push('/parametres/subscription');
  };

  const isAdmin = detail?.audience === 'ADMIN';

  return (
    <AnimatePresence>
      {detail && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
          />
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="w-full max-w-md pointer-events-auto"
            >
              <div className="glass-panel rounded-3xl p-6 sm:p-8 relative overflow-hidden bg-white dark:bg-slate-900 border border-white/20 dark:border-white/10 shadow-2xl">
                <div
                  className={`absolute inset-0 pointer-events-none ${
                    isAdmin
                      ? 'bg-gradient-to-br from-orange-500/10 via-red-500/5 to-amber-500/10'
                      : 'bg-gradient-to-br from-slate-500/10 via-slate-400/5 to-slate-500/10'
                  }`}
                />

                <button
                  onClick={close}
                  className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100/60 dark:bg-white/5 hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors z-10"
                >
                  <X size={18} className="text-slate-600 dark:text-slate-400" />
                </button>

                <div className="relative z-10">
                  <div
                    className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-lg ${
                      isAdmin
                        ? 'bg-gradient-to-br from-orange-500 to-red-500 shadow-red-500/20'
                        : 'bg-gradient-to-br from-slate-500 to-slate-600 shadow-slate-500/20'
                    }`}
                  >
                    {isAdmin ? (
                      <AlertTriangle size={30} className="text-white" />
                    ) : (
                      <MessageCircle size={30} className="text-white" />
                    )}
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-center mb-3 text-slate-900 dark:text-white">
                    {isAdmin ? 'Action bloquée' : 'Accès bloqué'}
                  </h3>

                  <p className="text-center text-slate-600 dark:text-slate-400 mb-6 text-sm leading-relaxed">
                    {detail.message}
                  </p>

                  <div className="space-y-3">
                    {isAdmin ? (
                      <button
                        onClick={goToSubscription}
                        className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 text-sm"
                      >
                        Gérer mon abonnement
                        <ArrowRight size={17} />
                      </button>
                    ) : null}
                    <button
                      onClick={close}
                      className="w-full py-3 px-4 bg-white/50 dark:bg-white/5 hover:bg-white/70 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-all text-sm"
                    >
                      {isAdmin ? 'Plus tard' : "J'ai compris"}
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
};