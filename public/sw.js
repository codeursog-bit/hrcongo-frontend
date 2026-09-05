// ============================================================================
// 📁 public/sw.js — Service Worker CUSTOM Konza RH
// ----------------------------------------------------------------------------
// Remplace le sw.js auto-généré par next-pwa (Workbox / "generateSW" mode).
// Cet ancien fichier importait un module compagnon (workbox-XXXXXXXX.js)
// généré à chaque build : si ce fichier n'est pas présent tel quel sur le
// serveur au moment où le navigateur l'installe (redéploiement entre-temps,
// fichier non copié, cache Traefik/Coolify, etc.), l'enregistrement du SW
// échoue avec "Failed to update a ServiceWorker ... Not found" — et SANS
// Service Worker actif, aucune notification push ne peut jamais être reçue,
// même si le backend envoie bien les rappels.
//
// Ce fichier est autonome (zéro dépendance externe) : rien à précharger,
// rien qui puisse manquer au déploiement. Il gère :
//   1. Le cycle de vie du SW (install / activate)
//   2. La réception des notifications push (rappels de pointage)
//   3. Le clic sur une notification (ouvre/focus l'app à la bonne page)
//   4. Un cache minimal pour un usage hors-ligne basique des pages/app
// ============================================================================

const CACHE_NAME = 'konza-rh-cache-v1';
const OFFLINE_URL = '/';

// ─── Cycle de vie ────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Nettoie les anciens caches (versions précédentes de ce même SW)
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith('konza-rh-cache-') && k !== CACHE_NAME)
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

// ─── Cache runtime minimal (best-effort, ne bloque jamais une requête) ──────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // API : toujours réseau (jamais de données de paie/pointage périmées)
  if (url.pathname.startsWith('/api/')) return;

  // Assets statiques Next.js : cache-first (immuables, hashés par build)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      }),
    );
    return;
  }

  // Navigation (pages) : réseau d'abord, repli sur le cache si hors-ligne
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
          return response;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match(OFFLINE_URL))),
    );
  }
});

// ─── Notifications Push (rappels de pointage, HS, etc.) ─────────────────────
// Payload envoyé par push-notifications.service.ts (backend) :
// { title, body, url, tag, icon, badge, requireInteraction, actions, ...actionUrls }
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'Konza RH', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'Konza RH';
  const options = {
    body: data.body || '',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/badge-72x72.png',
    tag: data.tag || 'konza-notif',
    requireInteraction: !!data.requireInteraction,
    actions: Array.isArray(data.actions) ? data.actions : [],
    data: {
      url: data.url || '/',
      // Champs additionnels envoyés par le backend pour les notifs à boutons
      // (ex: { forgot: '/presences/resolve-forgotten/123', overtime: '...' })
      ...data,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const notifData = event.notification.data || {};
  const targetUrl = (event.action && notifData[event.action]) || notifData.url || '/';

  event.waitUntil(
    (async () => {
      const clientsList = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      for (const client of clientsList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if ('navigate' in client) {
            try {
              await client.navigate(targetUrl);
            } catch (e) {
              /* navigate peut échouer selon le navigateur — on garde le focus */
            }
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })(),
  );
});