'use client';

// ============================================================================
// 📁 components/PushNotificationBanner.tsx — CORRIGÉ
// ============================================================================
// ✅ CORRECTIONS :
//   - Tous les imports lucide-react présents (Bell, BellOff, X, Smartphone, Check)
//   - usePushNotifications importé depuis le bon chemin
//   - export default PushNotificationBanner  ← pour le layout/pages
//   - export named { PushToggleButton }      ← pour /mon-profil
//
// USAGE :
//   import PushNotificationBanner from '@/components/PushNotificationBanner';
//   import PushNotificationBanner, { PushToggleButton } from '@/components/PushNotificationBanner';
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Bell, BellOff, X, Smartphone, Check } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

// ─── Bannière principale ──────────────────────────────────────────────────────
export default function PushNotificationBanner({ userName }: { userName?: string }) {
  const { isSupported, isSubscribed, isLoading, permission, subscribe } = usePushNotifications();
  const [dismissed, setDismissed] = useState(false);
  const [success, setSuccess]     = useState(false);

  useEffect(() => {
    if (localStorage.getItem('push-banner-dismissed')) setDismissed(true);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('push-banner-dismissed', '1');
  };

  const handleSubscribe = async () => {
    const ok = await subscribe();
    if (ok) {
      setSuccess(true);
      setTimeout(() => setDismissed(true), 2500);
    }
  };

  if (!isSupported || isSubscribed || dismissed || permission === 'denied') return null;

  if (success) {
    return (
      <div className="mx-4 mt-3 flex items-center gap-3 px-5 py-3.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
        <div className="p-2 bg-emerald-500 rounded-xl">
          <Check size={16} className="text-white" />
        </div>
        <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
          Notifications activées ! Vous serez alerté(e) pour vos pointages.
        </p>
      </div>
    );
  }

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
  const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe, permission } = usePushNotifications();

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
        <span>Permission bloquée — autorisez dans les paramètres du navigateur</span>
      </div>
    );
  }

  return (
    <button
      onClick={isSubscribed ? unsubscribe : subscribe}
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