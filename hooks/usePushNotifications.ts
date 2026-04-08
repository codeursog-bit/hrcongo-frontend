'use client';

// ============================================================================
// 📁 hooks/usePushNotifications.ts — CORRIGÉ
// ============================================================================
// ✅ CORRECTION TS2322 : Uint8Array<ArrayBufferLike> → ArrayBuffer
//    applicationServerKey exige ArrayBuffer ou string, pas Uint8Array directement
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';

// ✅ FIXÉ : retourne .buffer casté en ArrayBuffer (pas Uint8Array<ArrayBufferLike>)
function urlBase64ToArrayBuffer(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const output  = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    output[i] = rawData.charCodeAt(i);
  }
  // ✅ .buffer retourne ArrayBufferLike — on le cast explicitement en ArrayBuffer
  return output.buffer.slice(0) as ArrayBuffer;
}

export function usePushNotifications() {
  const [isSupported, setIsSupported]   = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [permission, setPermission]     = useState<NotificationPermission>('default');
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setIsSupported(false);
      return;
    }
    setIsSupported(true);
    setPermission(Notification.permission);

    navigator.serviceWorker
      .register('/sw.js')
      .then(async (reg) => {
        setRegistration(reg);
        const sub = await reg.pushManager.getSubscription();
        setIsSubscribed(!!sub);
      })
      .catch((err) => console.error('[Push] Erreur enregistrement SW:', err));
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!registration) return false;
    setIsLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') return false;

      const { publicKey } = await api.get('/notifications/push/vapid-key') as any;
      if (!publicKey) throw new Error('Clé VAPID non disponible');

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToArrayBuffer(publicKey), // ✅ ArrayBuffer
      });

      await api.post('/notifications/push/subscribe', subscription.toJSON());
      setIsSubscribed(true);
      return true;
    } catch (err) {
      console.error('[Push] Erreur abonnement:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [registration]);

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

  return { isSupported, isSubscribed, isLoading, permission, subscribe, unsubscribe };
}