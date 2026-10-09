// ============================================================================
// 📁 hooks/geoWarmup.ts  (NOUVEAU)
// Préchauffage du GPS : au moment où l'employé ouvre l'app, le GPS commence déjà à chercher le signal.
// Quand il arrive sur « Pointer », une lecture précise est souvent déjà prête (le 1er fix d'un GPS
// « à froid » peut prendre de longues secondes ; une fois « chaud », il est quasi instantané).
//
// Respect de la vie privée et de la batterie :
//  • jamais de demande d'autorisation en arrière-plan : on ne démarre que si elle est DÉJÀ accordée ;
//  • seulement pour les utilisateurs qui ont déjà pointé par GPS (drapeau local) ;
//  • 45 s maximum à chaque ouverture / retour au premier plan, arrêt dès que l'app passe en arrière-plan.
// ============================================================================

const FLAG_KEY = 'konza:gps-punch-user';
const BUFFER_MS = 30_000;
const MAX_BUFFER = 20;

let watchId: number | null = null;
let stopTimer: ReturnType<typeof setTimeout> | null = null;
let buffer: GeolocationPosition[] = [];

/** À appeler quand l'employé utilise le pointage GPS : active le préchauffage aux ouvertures suivantes. */
export function markGpsPunchUser(): void {
  try { localStorage.setItem(FLAG_KEY, '1'); } catch { /* stockage indisponible : sans effet */ }
}

export function isGpsPunchUser(): boolean {
  try { return localStorage.getItem(FLAG_KEY) === '1'; } catch { return false; }
}

/** Lectures récentes reçues par le préchauffage (partagées avec la page Pointage). */
export function getWarmReadings(maxAgeMs = 15_000): GeolocationPosition[] {
  const now = Date.now();
  return buffer.filter((p) => now - p.timestamp <= maxAgeMs);
}

export function stopGeoWarmup(): void {
  if (stopTimer) { clearTimeout(stopTimer); stopTimer = null; }
  if (watchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
  watchId = null;
}

export async function startGeoWarmup(durationMs = 45_000): Promise<void> {
  if (typeof navigator === 'undefined' || !navigator.geolocation || !navigator.permissions) return;
  try {
    const perm = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
    if (perm.state !== 'granted') return; // jamais de pop-up d'autorisation en arrière-plan
  } catch { return; }

  if (stopTimer) clearTimeout(stopTimer);
  stopTimer = setTimeout(stopGeoWarmup, durationMs);
  if (watchId !== null) return; // déjà en cours : on a seulement prolongé la durée

  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      if (!Number.isFinite(pos.coords.accuracy)) return;
      const now = Date.now();
      buffer = [...buffer.filter((p) => now - p.timestamp <= BUFFER_MS), pos].slice(-MAX_BUFFER);
    },
    () => { /* silencieux : la page Pointage affiche elle-même les erreurs */ },
    { enableHighAccuracy: true, maximumAge: 0, timeout: 30_000 },
  );
}