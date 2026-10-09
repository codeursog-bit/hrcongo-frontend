'use client';
// ============================================================================
// 📁 components/GeoWarmup.tsx  (NOUVEAU)
// Monté une fois dans le layout du dashboard : préchauffe le GPS à l'ouverture de l'app (voir hooks/geoWarmup.ts).
// Ne rend rien.
// ============================================================================
import { useEffect } from 'react';
import { isGpsPunchUser, startGeoWarmup, stopGeoWarmup } from '@/hooks/geoWarmup';

export default function GeoWarmup() {
  useEffect(() => {
    if (!isGpsPunchUser()) return;
    const onVisibility = () => {
      if (document.visibilityState === 'visible') startGeoWarmup();
      else stopGeoWarmup(); // app en arrière-plan : on économise la batterie
    };
    onVisibility();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      stopGeoWarmup();
    };
  }, []);
  return null;
}