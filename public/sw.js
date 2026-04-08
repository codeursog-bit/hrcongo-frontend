// ============================================================================
// 📁 public/sw.js
// ============================================================================
// 🔥 KONZA SUITE — Service Worker Push Notifications PWA
//
// CHANGE v2 : notificationclick envoie vers /auth/login?callbackUrl=...
//             si l'app est fermée ou session expirée.
//             Les boutons d'action (forgot/overtime) appellent l'API
//             directement en arrière-plan — zéro nouvelle page à créer.
// ============================================================================

const APP_ICON  = '/icons/icon-192x192.png';
const APP_BADGE = '/icons/badge-72x72.png';

// ─── Installation ─────────────────────────────────────────────────────────────
self.addEventListener('install', () => {
  console.log('[SW] Konza Suite installé');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Konza Suite activé');
  event.waitUntil(self.clients.claim());
});

// ─── Réception d'une notification Push ───────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'Konza Suite', body: event.data.text() };
  }

  const title   = payload.title  || 'Konza Suite';
  const options = {
    body:               payload.body               || '',
    icon:               payload.icon               || APP_ICON,
    badge:              payload.badge              || APP_BADGE,
    tag:                payload.tag                || 'konza-notif',
    vibrate:            [200, 100, 200],
    requireInteraction: payload.requireInteraction || false,
    actions:            payload.actions            || [],
    data: {
      url:        payload.url        || '/',
      // URLs pour les boutons d'action (forgot / overtime)
      forgot:     payload.forgot     || null,
      overtime:   payload.overtime   || null,
      // ID du pointage pour les appels API directs
      attendanceId: payload.attendanceId || null,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ─── Clic sur une notification ────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data         = event.notification.data || {};
  const targetUrl    = data.url || '/';
  const attendanceId = data.attendanceId;

  // ── CAS 1 : Bouton "Oubli" — appel API en arrière-plan, puis pointage ──────
  if (event.action === 'forgot' && attendanceId) {
    event.waitUntil(
      // Appel silencieux au backend (le JWT est dans le cookie httpOnly)
      fetch(`/api/attendance/resolve-forgotten/${attendanceId}`, {
        method:      'POST',
        credentials: 'include', // envoie les cookies de session
      })
        .then(() => openOrFocusWindow('/presences/pointage?status=fixed'))
        .catch(() => openOrFocusWindow(buildLoginUrl('/presences/pointage')))
    );
    return;
  }

  // ── CAS 2 : Bouton "Heures sup" — appel API en arrière-plan ─────────────────
  if (event.action === 'overtime' && attendanceId) {
    event.waitUntil(
      fetch(`/api/attendance/declare-overtime/${attendanceId}`, {
        method:      'POST',
        credentials: 'include',
      })
        .then(() => openOrFocusWindow('/presences/pointage?status=overtime-sent'))
        .catch(() => openOrFocusWindow(buildLoginUrl('/presences/pointage')))
    );
    return;
  }

  // ── CAS 3 : Clic normal sur la notification ──────────────────────────────────
  // On envoie vers le login avec le callbackUrl,
  // comme ça si la session est active le middleware redirige directement,
  // sinon le login sait où envoyer l'utilisateur après connexion.
  event.waitUntil(
    openOrFocusWindow(buildLoginUrl(targetUrl))
  );
});

// ─── Fermeture d'une notification ────────────────────────────────────────────
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification fermée:', event.notification.tag);
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Construit l'URL de login avec callbackUrl.
 * Si la session est encore active, le middleware Next.js redirigera
 * directement vers targetPath sans afficher le formulaire.
 */
function buildLoginUrl(targetPath) {
  return `/auth/login?callbackUrl=${encodeURIComponent(targetPath)}`;
}

/**
 * Focus sur un onglet existant ou ouvre une nouvelle fenêtre.
 */
function openOrFocusWindow(url) {
  return clients
    .matchAll({ type: 'window', includeUncontrolled: true })
    .then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    });
}