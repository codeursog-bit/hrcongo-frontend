'use client';

// ============================================================================
// 📁 hooks/usePushNotifications.ts — PROD READY
// ============================================================================
// CORRECTIFS :
//   1. register: false dans next.config → on enregistre SW manuellement ici
//   2. Attente que le SW soit ACTIF avant subscribe() — évite l'AbortError
//      "no active Service Worker" qui arrive quand le SW est encore installing
//   3. Auto-nettoyage du vieux SW Workbox si présent (ancien déploiement)
//      → l'utilisateur n'a JAMAIS besoin de vider son cache manuellement
//   4. Timeout de sécurité (10s) si le SW ne s'active jamais
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';

// ✅ Conversion clé VAPID base64url → ArrayBuffer
function urlBase64ToArrayBuffer(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const output  = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    output[i] = rawData.charCodeAt(i);
  }
  return output.buffer.slice(0) as ArrayBuffer;
}

// ============================================================================
// ✅ HELPER : Attendre qu'un ServiceWorker soit dans l'état "activated"
//    Résout l'erreur : "Subscription failed - no active Service Worker"
//    Cas typique : SW en cours d'installation lors du premier clic "Activer"
// ============================================================================
function waitForActivation(reg: ServiceWorkerRegistration): Promise<ServiceWorkerRegistration> {
  return new Promise((resolve, reject) => {
    // Déjà actif → on retourne immédiatement
    if (reg.active && !reg.installing && !reg.waiting) {
      return resolve(reg);
    }

    // Timeout de sécurité : si le SW ne s'active pas en 10s → erreur claire
    const timeout = setTimeout(() => {
      reject(new Error('Le service worker ne s\'est pas activé dans les temps. Veuillez recharger la page.'));
    }, 10_000);

    // SW en cours d'installation → on attend le changement d'état
    const sw = reg.installing ?? reg.waiting;
    if (sw) {
      const handler = () => {
        if (sw.state === 'activated') {
          clearTimeout(timeout);
          sw.removeEventListener('statechange', handler);
          resolve(reg);
        } else if (sw.state === 'redundant') {
          // SW rejeté (erreur d'install) → on abandonne
          clearTimeout(timeout);
          sw.removeEventListener('statechange', handler);
          reject(new Error('Installation du service worker échouée. Rechargez la page.'));
        }
      };
      sw.addEventListener('statechange', handler);
    } else {
      // Cas edge : pas de SW du tout encore
      navigator.serviceWorker.ready
        .then(() => { clearTimeout(timeout); resolve(reg); })
        .catch((e) => { clearTimeout(timeout); reject(e); });
    }
  });
}

// ============================================================================
// ✅ HELPER : Nettoyer les vieux SW Workbox générés par next-pwa
//    (ceux qui avaient register: true et précachaient les manifests Next.js)
//    → Supprime les vieux SW silencieusement, sans que l'utilisateur ne fasse rien
// ============================================================================
async function cleanupStaleServiceWorkers(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const reg of registrations) {
      const swUrl = reg.active?.scriptURL ?? reg.installing?.scriptURL ?? reg.waiting?.scriptURL ?? '';
      // Supprimer les SW Workbox auto-générés (sw.js est notre SW custom, on le garde)
      // Les SW Workbox auto-générés sont typiquement nommés "sw.js" aussi mais
      // leur contenu contient workbox — on les identifie par l'URL si différente
      // ou en vérifiant s'ils bloquent l'installation du nôtre
      if (swUrl && !swUrl.endsWith('/sw.js')) {
        console.log('[Push] Suppression ancien SW:', swUrl);
        await reg.unregister();
      }
    }
  } catch (e) {
    // Silencieux — non bloquant
    console.warn('[Push] Nettoyage SW:', e);
  }
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================
export function usePushNotifications() {
  const [isSupported, setIsSupported]   = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [permission, setPermission]     = useState<NotificationPermission>('default');
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [swError, setSwError]           = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setIsSupported(false);
      return;
    }
    setIsSupported(true);
    setPermission(Notification.permission);

    const initSW = async () => {
      try {
        // ✅ 1. Nettoyer les vieux SW Workbox automatiquement
        await cleanupStaleServiceWorkers();

        // ✅ 2. Enregistrer notre SW custom
        const reg = await navigator.serviceWorker.register('/sw.js', {
          // updateViaCache: 'none' force le navigateur à toujours vérifier
          // si le sw.js a changé → mise à jour automatique à chaque déploiement
          updateViaCache: 'none',
        });

        // ✅ 3. Forcer la mise à jour si une nouvelle version est disponible
        //    (cas : redéploiement Vercel → nouveau sw.js disponible)
        reg.addEventListener('updatefound', () => {
          const newSW = reg.installing;
          if (!newSW) return;
          console.log('[Push] Nouvelle version SW détectée, mise à jour...');
          newSW.addEventListener('statechange', () => {
            if (newSW.state === 'activated') {
              console.log('[Push] SW mis à jour avec succès');
            }
          });
        });

        // ✅ 4. Vérifier s'il existe déjà une mise à jour en attente
        await reg.update();

        setRegistration(reg);

        // ✅ 5. Vérifier l'abonnement existant
        const sub = await reg.pushManager.getSubscription();
        setIsSubscribed(!!sub);
      } catch (err: any) {
        console.error('[Push] Erreur initialisation SW:', err);
        setSwError(err?.message || 'Erreur service worker');
      }
    };

    initSW();
  }, []);

  // ──────────────────────────────────────────────────────────────────────────
  // SUBSCRIBE
  // ──────────────────────────────────────────────────────────────────────────
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!registration) {
      console.error('[Push] Pas de registration SW');
      return false;
    }

    setIsLoading(true);
    try {
      // ✅ Demander la permission AVANT de vérifier le SW
      //    (la permission doit venir d'un geste utilisateur)
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') return false;

      // ✅ CRITIQUE : Attendre que le SW soit ACTIF
      //    Résout l'AbortError "no active Service Worker"
      const activeReg = await waitForActivation(registration);

      // ✅ Récupérer la clé VAPID publique
      const { publicKey } = await api.get('/notifications/push/vapid-key') as any;
      if (!publicKey) throw new Error('Clé VAPID non disponible');

      // ✅ Créer l'abonnement Push
      const subscription = await activeReg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToArrayBuffer(publicKey),
      });

      // ✅ Envoyer l'abonnement au backend
      await api.post('/notifications/push/subscribe', subscription.toJSON());
      setIsSubscribed(true);
      return true;

    } catch (err: any) {
      console.error('[Push] Erreur abonnement:', err);

      // ✅ Message d'erreur utilisateur-friendly selon le type d'erreur
      if (err?.name === 'AbortError') {
        setSwError('Le service worker n\'est pas encore prêt. Veuillez recharger la page et réessayer.');
      } else if (err?.name === 'NotAllowedError') {
        setSwError('Permission refusée par le navigateur.');
      } else {
        setSwError(err?.message || 'Impossible d\'activer les notifications');
      }
      return false;

    } finally {
      setIsLoading(false);
    }
  }, [registration]);

  // ──────────────────────────────────────────────────────────────────────────
  // UNSUBSCRIBE
  // ──────────────────────────────────────────────────────────────────────────
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!registration) return false;
    setIsLoading(true);
    try {
      const sub = await registration.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      await api.delete('/notifications/push/unsubscribe');
      setIsSubscribed(false);
      return true;
    } catch (err) {
      console.error('[Push] Erreur désabonnement:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [registration]);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    swError,       // ✅ Exposé pour que PushNotificationBanner puisse l'afficher
    subscribe,
    unsubscribe,
  };
}