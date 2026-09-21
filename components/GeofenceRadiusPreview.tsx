'use client';

// ============================================================================
// 📁 components/GeofenceRadiusPreview.tsx
// ============================================================================
// Aperçu visuel (schématique, pas une vraie carte) du rayon de géofencing
// configuré pour un site : un cercle plein pour le rayon autorisé, un anneau
// en pointillés pour matérialiser l'incertitude GPS typique (~10m), et des
// cercles-repères concentriques avec leur distance en mètres.
//
// Volontairement PAS une vraie carte (pas de tuiles, pas de dépendance
// externe type Leaflet/Google Maps) — juste un schéma géométrique centré sur
// le point enregistré, pour que l'admin visualise "à quoi ressemble" son
// rayon et comprenne pourquoi un rayon trop petit (ex: 2-5m) est irréaliste
// vu la marge d'erreur du GPS.
// ============================================================================

import React from 'react';

interface GeofenceRadiusPreviewProps {
  radius: number;           // Rayon autorisé, en mètres
  gpsUncertainty?: number;  // Marge d'incertitude GPS à illustrer, en mètres (défaut 10m)
  siteName?: string;        // Optionnel : nom affiché au centre
  // ✅ Position de l'utilisateur relative au centre, en mètres (est/nord =
  // positif). Calculée par l'appelant (pas ce composant) via
  // computeMetersOffset() ci-dessous, à partir de deux couples lat/lon.
  userOffset?: { east: number; north: number } | null;
  // ✅ Cap actuel du téléphone (0-360°, 0 = Nord, sens horaire), fourni par
  // DeviceOrientationEvent côté appelant. Optionnel — si absent (capteur
  // indisponible, permission refusée), le composant retombe simplement sur
  // le texte directionnel existant, sans flèche.
  deviceHeading?: number | null;
  // ✅ Message d'analyse de fiabilité du rayon (ex: "Remontez à au moins
  // 20m") — utile à l'admin qui configure le rayon, mais inutile (et
  // déroutant, car il n'a pas la main dessus) pour l'employé qui consulte
  // juste sa position. Par défaut affiché (usage admin), à désactiver
  // explicitement côté écran employé.
  showReliabilityMessage?: boolean;
}

// ✅ Convertit un delta lat/lon en mètres est/nord depuis un point central,
// via une approximation équirectangulaire (largement suffisante à cette
// échelle — quelques dizaines/centaines de mètres, pas de la navigation
// longue distance).
export function computeMetersOffset(
  centerLat: number, centerLon: number,
  pointLat: number, pointLon: number,
): { east: number; north: number } {
  const R = 6371000; // rayon terrestre, mètres
  const dLat = (pointLat - centerLat) * Math.PI / 180;
  const dLon = (pointLon - centerLon) * Math.PI / 180;
  const meanLat = (pointLat + centerLat) / 2 * Math.PI / 180;
  return {
    north: dLat * R,
    east: dLon * R * Math.cos(meanLat),
  };
}

const COMPASS = ['Nord', 'Nord-Est', 'Est', 'Sud-Est', 'Sud', 'Sud-Ouest', 'Ouest', 'Nord-Ouest'];
// ✅ Angle brut (continu, 0-360°, 0 = Nord, sens horaire) — utilisé pour
// faire tourner la flèche boussole en douceur. compassLabel() (ci-dessous)
// s'en sert aussi, mais arrondit à 8 directions pour le texte.
function bearingDegrees(east: number, north: number): number {
  return (Math.atan2(east, north) * 180 / Math.PI + 360) % 360;
}
function compassLabel(east: number, north: number): string {
  const angle = bearingDegrees(east, north);
  return COMPASS[Math.round(angle / 45) % 8];
}
const OPPOSITE: Record<string, string> = {
  'Nord': 'Sud', 'Sud': 'Nord', 'Est': 'Ouest', 'Ouest': 'Est',
  'Nord-Est': 'Sud-Ouest', 'Sud-Ouest': 'Nord-Est',
  'Nord-Ouest': 'Sud-Est', 'Sud-Est': 'Nord-Ouest',
};

export default function GeofenceRadiusPreview({
  radius,
  gpsUncertainty = 10,
  siteName,
  userOffset,
  deviceHeading,
  showReliabilityMessage = true,
}: GeofenceRadiusPreviewProps) {
  const safeRadius = Math.max(1, radius || 1);

  // ── Niveau de fiabilité — seuils fixes en mètres (plus simples à lire
  // qu'un ratio) : < 5m critique, 5-10m faible, 11-20m correct, > 20m bon.
  const reliability =
    safeRadius < 5
      ? {
          level: 'critique' as const,
          color: '#ef4444', // rouge
          label: 'Fiabilité très faible',
          message:
            `Le GPS d'un smartphone "bruite" naturellement de quelques mètres (rebond du signal sur les ` +
            `murs/bâtiments, précision limitée du capteur) — avec un rayon aussi petit, ce bruit à lui seul ` +
            `suffit à faire refuser un employé pourtant réellement sur place. Remontez à au moins 20m.`,
        }
      : safeRadius <= 10
      ? {
          level: 'faible' as const,
          color: '#f97316', // orange
          label: 'Fiabilité faible',
          message:
            `Rayon proche du bruit GPS habituel (rebond du signal, précision du capteur) — des refus ` +
            `occasionnels sont probables, surtout en intérieur. Un rayon > 20m évite ce souci.`,
        }
      : safeRadius <= 20
      ? {
          level: 'correcte' as const,
          color: '#eab308', // jaune
          label: 'Fiabilité correcte',
          message:
            `Correct dans la plupart des cas. Le bruit naturel du GPS (précision du capteur, rebond du ` +
            `signal en intérieur) peut occasionnellement faire fluctuer une position proche de cette limite.`,
        }
      : {
          level: 'bonne' as const,
          color: '#10b981', // vert
          label: 'Fiabilité confortable',
          message: null, // rien à signaler, pas besoin d'encombrer l'écran
        };

  // ── Choix d'un pas "rond" pour les cercles-repères, selon l'échelle ───────
  const step =
    safeRadius <= 20 ? 5 :
    safeRadius <= 50 ? 10 :
    safeRadius <= 150 ? 25 :
    safeRadius <= 400 ? 50 :
    100;

  // Distance max à afficher : le rayon + la marge d'incertitude + un peu d'air
  const displayMax = safeRadius + gpsUncertainty + step;

  // ── Mise à l'échelle mètres → pixels ────────────────────────────────────
  const viewBoxSize = 280;
  const center = viewBoxSize / 2;
  const drawablePx = center - 30; // marge pour les labels
  const scale = drawablePx / displayMax; // px par mètre

  const mainR = safeRadius * scale;
  const uncertaintyR = (safeRadius + gpsUncertainty) * scale;

  // Cercles-repères concentriques (multiples de `step`, jusqu'à displayMax)
  const guideRings: number[] = [];
  for (let d = step; d <= displayMax; d += step) guideRings.push(d);

  // ── Position de l'utilisateur sur le schéma (si fournie) ────────────────
  let userPoint: {
    px: number; py: number; distance: number; direction: string;
    inside: boolean; clamped: boolean;
  } | null = null;

  // ✅ Garde-fou : si le calcul d'offset produit une valeur non numérique
  // (coordonnée GPS aberrante, division par zéro dans l'angle), on n'affiche
  // simplement pas le point plutôt que de planter toute la page avec une
  // direction indéfinie.
  if (userOffset && Number.isFinite(userOffset.east) && Number.isFinite(userOffset.north)) {
    const distance = Math.sqrt(userOffset.east ** 2 + userOffset.north ** 2);
    const direction = compassLabel(userOffset.east, userOffset.north);
    const inside = distance <= safeRadius;

    // Position brute en pixels (y inversé : nord = vers le haut du SVG)
    let px = center + userOffset.east * scale;
    let py = center - userOffset.north * scale;

    // Si l'utilisateur est encore loin (hors de la zone visible du schéma),
    // on clampe le point sur le bord dans la bonne direction plutôt que de
    // le laisser sortir du cadre — le schéma garde son échelle lisible.
    const maxPx = drawablePx - 6;
    const distPx = Math.sqrt((px - center) ** 2 + (py - center) ** 2);
    const clamped = distPx > maxPx;
    if (clamped && distPx > 0) {
      const ratio = maxPx / distPx;
      px = center + (px - center) * ratio;
      py = center + (py - center) * ratio;
    }

    userPoint = { px, py, distance, direction, inside, clamped };
  }

  // ── Boussole : angle de la flèche à afficher ─────────────────────────────
  // bearingToCenter = direction réelle (0-360°, Nord=0) à suivre pour
  // rejoindre le centre depuis la position actuelle — l'inverse de la
  // direction "centre → utilisateur" qu'on a déjà (d'où le +180°).
  // arrowRotation = ce cap, corrigé de l'orientation actuelle du téléphone,
  // pour que la flèche pointe physiquement vers le centre à l'écran quel
  // que soit le sens vers lequel l'utilisateur tient son téléphone.
  let arrowRotation: number | null = null;
  if (
    userOffset && Number.isFinite(userOffset.east) && Number.isFinite(userOffset.north) &&
    Number.isFinite(deviceHeading)
  ) {
    const bearingToCenter = (bearingDegrees(userOffset.east, userOffset.north) + 180) % 360;
    arrowRotation = (bearingToCenter - (deviceHeading as number) + 360) % 360;
  }

  return (
    <div className="flex flex-col items-center">
      {/* ✅ Badge de fiabilité — vue d'ensemble immédiate avant même de lire
          le schéma en détail */}
      <div
        className="mb-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
        style={{ backgroundColor: `${reliability.color}20`, color: reliability.color }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: reliability.color }} />
        {reliability.label}
      </div>

      <svg
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        className="w-full max-w-[280px] h-auto"
      >
        {/* Cercles-repères en pointillés fins, avec leur distance */}
        {guideRings.map((d) => (
          <g key={d}>
            <circle
              cx={center} cy={center} r={d * scale}
              fill="none" stroke="currentColor" strokeWidth="1"
              strokeDasharray="2,4" className="text-[var(--border)]"
            />
            <text
              x={center + d * scale + 4} y={center + 3}
              fontSize="8" className="fill-[var(--text-muted)]"
            >
              {d}m
            </text>
          </g>
        ))}

        {/* Anneau d'incertitude GPS (zone où la position réelle peut "traîner") */}
        <circle
          cx={center} cy={center} r={uncertaintyR}
          fill="rgba(234,179,8,0.08)" stroke="#eab308" strokeWidth="1.5"
          strokeDasharray="4,3"
        />

        {/* Rayon autorisé — la vraie zone de pointage, coloré selon la fiabilité */}
        <circle
          cx={center} cy={center} r={mainR}
          fill={`${reliability.color}1F`} stroke={reliability.color} strokeWidth="2.5"
        />

        {/* Centre = point GPS enregistré — en bleu, pour ne jamais se
            confondre avec le rouge "fiabilité critique" du rayon */}
        <circle cx={center} cy={center} r="5" fill="#2563eb" />
        <circle cx={center} cy={center} r="9" fill="none" stroke="#2563eb" strokeWidth="1.5" opacity="0.5" />

        {/* ✅ Position de l'utilisateur — violet, pour se distinguer du bleu
            (centre) et des couleurs de fiabilité (rouge/orange/jaune/vert) */}
        {userPoint && (
          <g>
            {/* Trait reliant le centre au point, pour visualiser le trajet */}
            <line
              x1={center} y1={center} x2={userPoint.px} y2={userPoint.py}
              stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="3,3" opacity="0.6"
            />
            {userPoint.clamped ? (
              // Trop loin pour tenir dans le cadre : flèche sur le bord
              <circle cx={userPoint.px} cy={userPoint.py} r="6" fill="#8b5cf6" opacity="0.85" />
            ) : (
              <>
                <circle cx={userPoint.px} cy={userPoint.py} r="10" fill="#8b5cf6" opacity="0.15">
                  <animate attributeName="r" values="8;14;8" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.25;0.05;0.25" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx={userPoint.px} cy={userPoint.py} r="6" fill="#8b5cf6" />
              </>
            )}
          </g>
        )}
      </svg>

      <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
        <div className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-full border-2 inline-block"
            style={{ backgroundColor: `${reliability.color}30`, borderColor: reliability.color }}
          />
          <span className="text-[var(--text-muted)]">
            Rayon autorisé : <strong>{safeRadius}m</strong> (Ø {safeRadius * 2}m)
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full border-2 border-dashed border-yellow-500 inline-block" />
          <span className="text-[var(--text-muted)]">
            + incertitude GPS (~{gpsUncertainty}m)
          </span>
        </div>
        <div className="flex items-center gap-1.5 col-span-2">
          <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
          <span className="text-[var(--text-muted)]">
            {siteName ? siteName : 'Point GPS enregistré (centre du site)'}
          </span>
        </div>
        {userPoint && (
          <div className="flex items-center gap-1.5 col-span-2">
            <span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />
            <span className="text-[var(--text-muted)]">Votre position actuelle</span>
          </div>
        )}
      </div>

      {/* ✅ Message-guide dynamique, basé sur la position en direct */}
      {userPoint && (
        <p className={`mt-2 text-xs font-medium text-center ${userPoint.inside ? 'text-emerald-600 dark:text-emerald-400' : 'text-violet-600 dark:text-violet-400'}`}>
          {userPoint.inside
            ? `✅ Vous êtes dans la zone (à ${Math.round(userPoint.distance)}m du centre).`
            : `Vous êtes à ${Math.round(userPoint.distance)}m au ${(userPoint.direction || '').toLowerCase()} du centre — avancez vers le ${(OPPOSITE[userPoint.direction] || '').toLowerCase()}.`}
        </p>
      )}

      {/* ✅ Cadran boussole — uniquement si le cap du téléphone est
          disponible (capteur + permission accordée) ET qu'on n'est pas déjà
          dans la zone (inutile une fois arrivé). Purement une aide visuelle
          en plus du texte ci-dessus, jamais la seule source d'info. */}
      {userPoint && !userPoint.inside && arrowRotation !== null && (
        <div className="mt-3 flex flex-col items-center">
          <div className="relative w-16 h-16">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <circle cx="50" cy="50" r="46" fill="none" stroke="var(--border)" strokeWidth="2" />
              <text x="50" y="13" textAnchor="middle" fontSize="9" className="fill-[var(--text-muted)]">N</text>
              <g style={{ transform: `rotate(${arrowRotation}deg)`, transformOrigin: '50px 50px', transition: 'transform 0.15s linear' }}>
                <polygon points="50,16 42,58 50,48 58,58" fill="#8b5cf6" />
              </g>
              <circle cx="50" cy="50" r="3" fill="#8b5cf6" />
            </svg>
          </div>
          <span className="text-[10px] text-[var(--text-muted)] mt-1">Suivez la flèche</span>
        </div>
      )}

      {showReliabilityMessage && reliability.message && (
        <p
          className="mt-2 text-[11px] text-center max-w-[260px]"
          style={{ color: reliability.color }}
        >
          ⚠️ {reliability.message}
        </p>
      )}
    </div>
  );
}