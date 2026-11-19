'use client';

// hooks/useMyEmployeePhoto.ts
//
// Récupère la photo de la fiche employé de la personne connectée, si elle en
// a une (un ADMIN/CABINET_* multi-comptes peut aussi être employé quelque
// part ; un EMPLOYEE/MANAGER/HR_MANAGER classique en a presque toujours une).
//
// Bonnes pratiques appliquées :
// 1. Un seul appel réseau à GET /employees/me par session de navigation, même
//    si Sidebar ET TopNav (montés en même temps) utilisent ce hook — grâce à
//    un cache de la Promise au niveau du module (pas besoin de contexte React
//    ni de lib externe pour un cas aussi simple).
// 2. Le 404 "pas de fiche employé" est un résultat NORMAL (cas d'un admin
//    sans fiche employé), jamais une erreur : il est avalé silencieusement
//    ici, donc jamais loggé dans la console ni remonté au composant appelant.
//    Le composant reçoit simplement `null` et garde son fallback actuel
//    (avatar avec initiales) — rien à catcher côté Sidebar/TopNav.
// 3. `invalidateMyEmployeePhotoCache()` est à appeler juste après un upload de
//    photo réussi (ex: page Mon Profil) pour que le prochain montage de
//    Sidebar/TopNav republie la photo à jour au lieu de l'ancienne valeur en
//    cache.

import { useEffect, useState } from 'react';
import { api } from '@/services/api';

let cachedPromise: Promise<string | null> | null = null;

function fetchEmployeePhoto(): Promise<string | null> {
  if (!cachedPromise) {
    cachedPromise = api
      .get<{ photoUrl?: string }>('/employees/me')
      .then((employee) => employee?.photoUrl || null)
      .catch(() => null); // 404 attendu pour qui n'a pas de fiche employé
  }
  return cachedPromise;
}

/**
 * Renvoie l'URL de la photo de la fiche employé de l'utilisateur connecté, ou
 * `null` tant qu'elle n'est pas encore chargée / s'il n'en a pas. Ne lance
 * jamais d'erreur — le composant appelant n'a rien à catcher.
 */
export function useMyEmployeePhoto(): string | null {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchEmployeePhoto().then((url) => {
      if (alive) setPhotoUrl(url);
    });
    return () => {
      alive = false;
    };
  }, []);

  return photoUrl;
}

/**
 * À appeler après une modification réussie de la photo de profil (upload
 * depuis /mon-profil par ex.) pour invalider le cache — Sidebar et TopNav
 * récupéreront la nouvelle photo dès leur prochain montage/re-render.
 */
export function invalidateMyEmployeePhotoCache() {
  cachedPromise = null;
}