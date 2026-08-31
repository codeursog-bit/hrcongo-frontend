'use client';

// ============================================================================
// hooks/useBasePath.ts
// Détecte automatiquement le contexte PME depuis l'URL
// et préfixe tous les liens de navigation.
//
// Utilisation :
//   const { bp, companyId, isPme } = useBasePath();
//   router.push(bp('/conges'))        // → '/pme/abc123/conges'  en PME
//                                     // → '/conges'             en entreprise normale
//   <Link href={bp('/employes')}>     // idem
// ============================================================================

import { useParams, usePathname } from 'next/navigation';

export function useBasePath() {
  const params   = useParams();
  const pathname = usePathname();

  // On est en contexte PME si l'URL commence par /pme/[companyId]
  const companyId = (params?.companyId as string) || '';
  const isPme     = pathname.startsWith('/pme/') && !!companyId;
  const base      = isPme ? `/pme/${companyId}` : '';

  /**
   * Préfixe un chemin avec le basePath PME si nécessaire.
   * bp('/conges') → '/pme/abc/conges' (PME) ou '/conges' (normal)
   */
  const bp = (path: string): string => {
    if (!isPme) return path;
    // Eviter le double préfixe si le path contient déjà /pme/
    if (path.startsWith('/pme/')) return path;
    return `${base}${path}`;
  };

  return { bp, base, companyId, isPme };
}