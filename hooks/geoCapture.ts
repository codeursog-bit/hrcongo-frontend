// ============================================================================
// 📁 hooks/geoCapture.ts  (NOUVEAU)
// Mesure GPS fiable pour le navigateur.
//
// Pourquoi : la PREMIÈRE lecture renvoyée par le navigateur est souvent une position
// « réseau » (wifi / antenne) décalée de plusieurs centaines de mètres ; le vrai GPS
// n'arrive qu'après quelques secondes. getCurrentPosition() ne donne qu'une lecture,
// donc fréquemment la mauvaise. Ici on écoute le GPS (watchPosition), on s'arrête dès
// que la précision est bonne, sinon on garde la MEILLEURE lecture (ou, pour un point
// fixe comme le centre d'un site, une moyenne pondérée des meilleures lectures).
// ============================================================================

export interface BestFix {
  latitude: number;
  longitude: number;
  accuracy: number; // ± mètres de la meilleure lecture (le navigateur annonce son incertitude)
  samples: number;  // nombre de lectures reçues
}

export interface CaptureOptions {
  maxWaitMs?: number;   // durée maximale d'écoute (défaut 15 s)
  goodEnoughM?: number; // on s'arrête dès qu'une lecture est au moins aussi précise (défaut 15 m)
  average?: boolean;    // true = point fixe (site) : moyenne pondérée des meilleures lectures
  minSamples?: number;  // average : lectures minimum avant de s'arrêter (défaut 5)
  onProgress?: (bestAccuracy: number, samples: number) => void;
}

export function captureBestPosition(
  opts: CaptureOptions = {},
): Promise<{ fix: BestFix | null; denied: boolean }> {
  const { maxWaitMs = 15_000, goodEnoughM = 15, average = false, minSamples = 5, onProgress } = opts;

  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve({ fix: null, denied: false });
      return;
    }

    const readings: GeolocationPosition[] = [];
    let denied = false;
    let done = false;
    let watchId: number | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const build = (): BestFix | null => {
      if (readings.length === 0) return null;
      const best = readings.reduce((b, p) => (p.coords.accuracy < b.coords.accuracy ? p : b));
      if (!average) {
        return {
          latitude: best.coords.latitude, longitude: best.coords.longitude,
          accuracy: best.coords.accuracy, samples: readings.length,
        };
      }
      // Moyenne pondérée (1 / précision²) des lectures proches de la meilleure
      const keep = readings.filter((p) => p.coords.accuracy <= best.coords.accuracy * 2);
      let sw = 0, lat = 0, lng = 0;
      for (const p of keep) {
        const w = 1 / Math.max(p.coords.accuracy, 1) ** 2;
        sw += w; lat += p.coords.latitude * w; lng += p.coords.longitude * w;
      }
      return { latitude: lat / sw, longitude: lng / sw, accuracy: best.coords.accuracy, samples: readings.length };
    };

    const finish = () => {
      if (done) return;
      done = true;
      if (timer) clearTimeout(timer);
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      resolve({ fix: build(), denied });
    };

    timer = setTimeout(finish, maxWaitMs);
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (!Number.isFinite(pos.coords.accuracy)) return;
        readings.push(pos);
        const bestAcc = Math.min(...readings.map((p) => p.coords.accuracy));
        onProgress?.(bestAcc, readings.length);
        if (bestAcc <= goodEnoughM && (!average || readings.length >= minSamples)) finish();
      },
      (err) => {
        if (err.code === 1) { denied = true; finish(); } // permission refusée : inutile d'attendre
        // timeout / position indisponible : on continue d'attendre jusqu'à maxWaitMs
      },
      { enableHighAccuracy: true, timeout: maxWaitMs, maximumAge: 0 },
    );
  });
}

// ============================================================================
// 🆕 POINTAGE : trouver tout seul la bonne précision, le plus vite possible
//
// Plutôt que de demander à l'employé d'« attendre que la précision soit correcte », l'app décide :
//   • elle part des lectures DÉJÀ reçues (page ouverte + préchauffage GPS à l'ouverture de l'app) ;
//   • elle s'arrête dès qu'une lecture est assez bonne, avec un seuil qui s'assouplit avec le temps :
//       ≤ 25 m tout de suite · ≤ 60 m après 6 s · ≤ 100 m après 12 s · sinon la meilleure lecture à 20 s.
// Latitude, longitude et précision viennent de la MÊME lecture. Le serveur reste seul juge de la zone.
// ============================================================================

/** Précision (±m) jugée suffisante après `elapsedMs` d'attente. */
export function accuracyThresholdAt(elapsedMs: number): number {
  return elapsedMs >= 12_000 ? 100 : elapsedMs >= 6_000 ? 60 : 25;
}

export interface AdaptiveOptions {
  seed?: GeolocationPosition[];                 // lectures déjà connues (page + préchauffage)
  maxWaitMs?: number;                           // défaut 20 s
  maxAgeMs?: number;                            // âge max d'une lecture réutilisable (défaut 15 s)
  onProgress?: (bestAccuracy: number | null) => void; // précision de la meilleure lecture, pour l'affichage
}

export function captureAdaptivePosition(opts: AdaptiveOptions = {}): Promise<GeolocationPosition | null> {
  const { seed = [], maxWaitMs = 20_000, maxAgeMs = 15_000, onProgress } = opts;

  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) { resolve(null); return; }

    const startedAt = Date.now();
    const candidates: GeolocationPosition[] = seed.filter(
      (p) => Number.isFinite(p.coords.accuracy) && startedAt - p.timestamp <= maxAgeMs,
    );
    const best = (): GeolocationPosition | null =>
      candidates.reduce<GeolocationPosition | null>(
        (b, p) => (!b || p.coords.accuracy < b.coords.accuracy ? p : b), null);

    // Déjà une lecture bonne → on part tout de suite (pointage instantané)
    const first = best();
    if (first && first.coords.accuracy <= accuracyThresholdAt(0)) { resolve(first); return; }

    let done = false;
    let watchId: number | null = null;
    let tick: ReturnType<typeof setInterval> | null = null;

    const finish = () => {
      if (done) return;
      done = true;
      if (tick) clearInterval(tick);
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      resolve(best()); // null → l'appelant retombe sur son dernier relevé connu
    };
    const evaluate = () => {
      const b = best();
      onProgress?.(b ? b.coords.accuracy : null);
      const elapsed = Date.now() - startedAt;
      if (elapsed >= maxWaitMs || (b && b.coords.accuracy <= accuracyThresholdAt(elapsed))) finish();
    };

    tick = setInterval(evaluate, 250); // le seuil s'assouplit avec le temps même sans nouvelle lecture
    onProgress?.(first ? first.coords.accuracy : null);
    watchId = navigator.geolocation.watchPosition(
      (pos) => { if (Number.isFinite(pos.coords.accuracy)) { candidates.push(pos); evaluate(); } },
      (err) => { if (err.code === 1 && candidates.length === 0) finish(); }, // refus : inutile d'attendre
      { enableHighAccuracy: true, timeout: maxWaitMs, maximumAge: 0 },
    );
  });
}