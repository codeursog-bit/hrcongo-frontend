// 'use client';

// // ============================================================================
// // 📁 components/PushNotificationBanner.tsx — PROD READY
// // ============================================================================
// // CORRECTIFS :
// //   1. Affiche swError si le SW a un problème (message clair à l'utilisateur)
// //   2. Bouton "Recharger" automatique si swError → l'utilisateur n'a pas
// //      à savoir ce qu'est un cache ou DevTools
// //   3. Export default + export named { PushToggleButton } conservés
// // ============================================================================

// import React, { useState, useEffect } from 'react';
// import { Bell, BellOff, X, Smartphone, Check, AlertTriangle, RefreshCw } from 'lucide-react';
// import { usePushNotifications } from '@/hooks/usePushNotifications';

// // ─── Bannière principale ──────────────────────────────────────────────────────
// export default function PushNotificationBanner({ userName }: { userName?: string }) {
//   const { isSupported, isSubscribed, isLoading, permission, swError, subscribe } =
//     usePushNotifications();

//   const [dismissed, setDismissed] = useState(false);
//   const [success, setSuccess]     = useState(false);
//   const [localError, setLocalError] = useState<string | null>(null);

//   useEffect(() => {
//     if (typeof window !== 'undefined' && localStorage.getItem('push-banner-dismissed')) {
//       setDismissed(true);
//     }
//   }, []);

//   // Synchroniser les erreurs SW dans l'état local
//   useEffect(() => {
//     if (swError) setLocalError(swError);
//   }, [swError]);

//   const handleDismiss = () => {
//     setDismissed(true);
//     localStorage.setItem('push-banner-dismissed', '1');
//   };

//   const handleSubscribe = async () => {
//     setLocalError(null);
//     const ok = await subscribe();
//     if (ok) {
//       setSuccess(true);
//       setTimeout(() => setDismissed(true), 2500);
//     }
//   };

//   // ── Cas : pas supporté, déjà abonné, fermé par l'utilisateur, ou bloqué ──
//   if (!isSupported || isSubscribed || dismissed || permission === 'denied') return null;

//   // ── Cas : succès ──────────────────────────────────────────────────────────
//   if (success) {
//     return (
//       <div className="mx-4 mt-3 flex items-center gap-3 px-5 py-3.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
//         <div className="p-2 bg-emerald-500 rounded-xl">
//           <Check size={16} className="text-white" />
//         </div>
//         <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
//           Notifications activées ! Vous serez alerté(e) pour vos pointages.
//         </p>
//       </div>
//     );
//   }

//   // ── Cas : erreur SW (message clair + bouton rechargement auto) ────────────
//   if (localError) {
//     return (
//       <div className="mx-4 mt-3 flex items-start gap-3 px-5 py-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl shadow-sm">
//         <div className="p-2.5 bg-amber-500 rounded-xl flex-shrink-0 mt-0.5">
//           <AlertTriangle size={18} className="text-white" />
//         </div>
//         <div className="flex-1 min-w-0">
//           <p className="text-sm font-bold text-amber-900 dark:text-amber-100">
//             Notifications temporairement indisponibles
//           </p>
//           <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5 leading-relaxed">
//             Une mise à jour de l'application est disponible. Rechargez pour activer les notifications.
//           </p>
//         </div>
//         <div className="flex items-center gap-2 flex-shrink-0">
//           <button
//             onClick={() => window.location.reload()}
//             className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-md"
//           >
//             <RefreshCw size={13} />
//             Recharger
//           </button>
//           <button onClick={handleDismiss} className="p-2 text-amber-400 hover:text-amber-600 rounded-xl transition-all">
//             <X size={15} />
//           </button>
//         </div>
//       </div>
//     );
//   }

//   // ── Cas : bannière normale ─────────────────────────────────────────────────
//   return (
//     <div className="mx-4 mt-3 flex items-start gap-3 px-5 py-4 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-2xl shadow-sm">
//       <div className="p-2.5 bg-sky-500 rounded-xl flex-shrink-0 mt-0.5">
//         <Smartphone size={18} className="text-white" />
//       </div>
//       <div className="flex-1 min-w-0">
//         <p className="text-sm font-bold text-sky-900 dark:text-sky-100">
//           {userName ? `${userName}, activez` : 'Activez'} les rappels sur votre téléphone
//         </p>
//         <p className="text-xs text-sky-700 dark:text-sky-300 mt-0.5 leading-relaxed">
//           Recevez des rappels bienveillants pour pointer votre entrée et sortie, même quand l'app est fermée.
//         </p>
//       </div>
//       <div className="flex items-center gap-2 flex-shrink-0">
//         <button
//           onClick={handleSubscribe}
//           disabled={isLoading}
//           className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition-all shadow-md"
//         >
//           {isLoading
//             ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
//             : <Bell size={13} />
//           }
//           Activer
//         </button>
//         <button onClick={handleDismiss} className="p-2 text-sky-400 hover:text-sky-600 rounded-xl transition-all">
//           <X size={15} />
//         </button>
//       </div>
//     </div>
//   );
// }

// // ─── Bouton toggle pour /mon-profil et /parametres ────────────────────────────
// export function PushToggleButton() {
//   const { isSupported, isSubscribed, isLoading, permission, swError, subscribe, unsubscribe } =
//     usePushNotifications();

//   const [localError, setLocalError] = useState<string | null>(null);

//   useEffect(() => {
//     if (swError) setLocalError(swError);
//   }, [swError]);

//   const handleClick = async () => {
//     setLocalError(null);
//     if (isSubscribed) {
//       await unsubscribe();
//     } else {
//       await subscribe();
//     }
//   };

//   if (!isSupported) {
//     return (
//       <div className="flex items-center gap-2 text-sm text-gray-400">
//         <BellOff size={16} />
//         <span>Non supporté sur ce navigateur</span>
//       </div>
//     );
//   }

//   if (permission === 'denied') {
//     return (
//       <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
//         <BellOff size={16} />
//         <span>Permission bloquée — autorisez dans les paramètres du navigateur</span>
//       </div>
//     );
//   }

//   // Erreur SW → bouton rechargement
//   if (localError) {
//     return (
//       <div className="space-y-2">
//         <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
//           <AlertTriangle size={16} />
//           <span>Mise à jour requise pour activer les notifications</span>
//         </div>
//         <button
//           onClick={() => window.location.reload()}
//           className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-2 border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-all"
//         >
//           <RefreshCw size={16} />
//           Recharger la page
//         </button>
//       </div>
//     );
//   }

//   return (
//     <button
//       onClick={handleClick}
//       disabled={isLoading}
//       className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 ${
//         isSubscribed
//           ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-2 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
//           : 'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 border-2 border-sky-200 dark:border-sky-800 hover:bg-sky-100'
//       }`}
//     >
//       {isLoading
//         ? <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
//         : isSubscribed ? <Bell size={16} className="fill-current" /> : <Bell size={16} />
//       }
//       {isSubscribed ? 'Notifications activées' : 'Activer les notifications'}
//     </button>
//   );
// }



'use client';

// ============================================================================
// 📁 components/PushNotificationBanner.tsx — PROD READY
// ============================================================================
// CORRECTIFS :
//   1. Gestion du "Snooze" (3 jours) sur le bouton X (ne disparaît plus à vie).
//   2. Dismiss permanent uniquement après succès de l'abonnement.
//   3. Intégration de swError pour la gestion des problèmes de Service Worker.
//   4. Export default (Banner) + Export named (ToggleButton).
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Bell, BellOff, X, Smartphone, Check, AlertTriangle, RefreshCw } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

// ─── Bannière principale ──────────────────────────────────────────────────────
export default function PushNotificationBanner({ userName }: { userName?: string }) {
  const { isSupported, isSubscribed, isLoading, permission, swError, subscribe } =
    usePushNotifications();

  const [dismissed, setDismissed] = useState(false);
  const [success, setSuccess]     = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Vérifier si l'utilisateur a déjà activé (permanent)
    if (localStorage.getItem('push-banner-dismissed')) {
      setDismissed(true);
      return;
    }

    // Vérifier si on est en période de "snooze" (3 jours)
    const snoozedUntil = localStorage.getItem('push-banner-snoozed-until');
    if (snoozedUntil && Date.now() < Number(snoozedUntil)) {
      setDismissed(true);
    }
  }, []);

  // Synchroniser les erreurs SW dans l'état local
  useEffect(() => {
    if (swError) setLocalError(swError);
  }, [swError]);

  // ✅ ✕ → snooze 3 jours, PAS de dismiss permanent
  const handleDismiss = () => {
    setDismissed(true);
    const snoozeUntil = Date.now() + 3 * 24 * 60 * 60 * 1000; // 3 jours
    localStorage.setItem('push-banner-snoozed-until', String(snoozeUntil));
  };

  // ✅ "Activer" → si succès, dismiss permanent
  const handleSubscribe = async () => {
    setLocalError(null);
    const ok = await subscribe();
    if (ok) {
      setSuccess(true);
      localStorage.removeItem('push-banner-snoozed-until');
      localStorage.setItem('push-banner-dismissed', '1'); // permanent uniquement ici
      setTimeout(() => setDismissed(true), 2500);
    }
  };

  // ── Cas : pas supporté, déjà abonné, bloqué ou déjà masqué ──
  if (!isSupported || isSubscribed || permission === 'denied' || dismissed) return null;
  if (typeof window !== 'undefined' && localStorage.getItem('push-banner-dismissed')) return null;

  // ── Cas : succès ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="mx-4 mt-3 flex items-center gap-3 px-5 py-3.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl animate-in fade-in slide-in-from-top-2">
        <div className="p-2 bg-emerald-500 rounded-xl">
          <Check size={16} className="text-white" />
        </div>
        <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
          Notifications activées ! Vous serez alerté(e) pour vos pointages.
        </p>
      </div>
    );
  }

  // ── Cas : erreur SW (message clair + bouton rechargement auto) ────────────
  if (localError) {
    return (
      <div className="mx-4 mt-3 flex items-start gap-3 px-5 py-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl shadow-sm">
        <div className="p-2.5 bg-amber-500 rounded-xl flex-shrink-0 mt-0.5">
          <AlertTriangle size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-amber-900 dark:text-amber-100">
            Notifications temporairement indisponibles
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5 leading-relaxed">
            Une mise à jour de l'application est disponible. Rechargez pour activer les notifications.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-md"
          >
            <RefreshCw size={13} />
            Recharger
          </button>
          <button onClick={handleDismiss} className="p-2 text-amber-400 hover:text-amber-600 rounded-xl transition-all">
            <X size={15} />
          </button>
        </div>
      </div>
    );
  }

  // ── Cas : bannière normale ─────────────────────────────────────────────────
  return (
    <div className="mx-4 mt-3 flex items-start gap-3 px-5 py-4 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-2xl shadow-sm">
      <div className="p-2.5 bg-sky-500 rounded-xl flex-shrink-0 mt-0.5">
        <Smartphone size={18} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-sky-900 dark:text-sky-100">
          {userName ? `${userName}, activez` : 'Activez'} les rappels sur votre téléphone
        </p>
        <p className="text-xs text-sky-700 dark:text-sky-300 mt-0.5 leading-relaxed">
          Recevez des rappels bienveillants pour pointer votre entrée et sortie, même quand l'app est fermée.
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handleSubscribe}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition-all shadow-md"
        >
          {isLoading
            ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <Bell size={13} />
          }
          Activer
        </button>
        <button onClick={handleDismiss} className="p-2 text-sky-400 hover:text-sky-600 rounded-xl transition-all">
          <X size={15} />
        </button>
      </div>
    </div>
  );
}

// ─── Bouton toggle pour /mon-profil et /parametres ────────────────────────────
export function PushToggleButton() {
  const { isSupported, isSubscribed, isLoading, permission, swError, subscribe, unsubscribe } =
    usePushNotifications();

  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (swError) setLocalError(swError);
  }, [swError]);

  const handleClick = async () => {
    setLocalError(null);
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  if (!isSupported) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <BellOff size={16} />
        <span>Non supporté sur ce navigateur</span>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
        <BellOff size={16} />
        <span>Permission bloquée</span>
      </div>
    );
  }

  if (localError) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
          <AlertTriangle size={16} />
          <span>Mise à jour requise</span>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200"
        >
          <RefreshCw size={14} />
          Recharger
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 ${
        isSubscribed
          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-2 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
          : 'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 border-2 border-sky-200 dark:border-sky-800 hover:bg-sky-100'
      }`}
    >
      {isLoading
        ? <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
        : isSubscribed ? <Bell size={16} className="fill-current" /> : <Bell size={16} />
      }
      {isSubscribed ? 'Notifications activées' : 'Activer les notifications'}
    </button>
  );
}