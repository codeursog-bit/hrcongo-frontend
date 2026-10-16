'use client';

// ============================================================================
// 📁 components/RouteGuard.tsx
// ✅ Garde de routes par rôle (voir lib/route-access.ts).
//    - Attend que useAuth ait vérifié la session auprès du serveur (cookie) :
//      le rôle d'un localStorage modifié à la main ne suffit donc pas.
//    - Si le rôle n'a pas accès : la page N'EST PAS MONTÉE (aucun fetch, aucun
//      flash de contenu) et on affiche l'écran « Accès refusé ».
//    À poser autour de {children} dans app/(dashboard)/layout.tsx et
//    app/pme/[companyId]/layout.tsx.
// ============================================================================

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useBasePath } from '@/hooks/useBasePath';
import { api } from '@/services/api';
import AccessDenied from '@/components/AccessDenied';
import { canAccessPath, homeFor, ruleNeedsAttendanceAll } from '@/lib/route-access';

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, userRole, loading } = useAuth();
  const pathname = usePathname() || '/';
  const { bp } = useBasePath();

  // Droit « pointage pour tous » (secrétaire) — vérifié seulement pour les routes qui en dépendent
  const needsFlag = userRole === 'EMPLOYEE' && ruleNeedsAttendanceAll(pathname);
  const [flag, setFlag] = useState<boolean | null>(null);

  useEffect(() => {
    if (!needsFlag) return;
    if (typeof user?.canRecordAttendanceForAll === 'boolean') { setFlag(user.canRecordAttendanceForAll); return; }
    let cancelled = false;
    api.get<any>('/auth/me')
      .then(r => { if (!cancelled) setFlag(!!r?.canRecordAttendanceForAll); })
      .catch(() => { if (!cancelled) setFlag(false); });
    return () => { cancelled = true; };
  }, [needsFlag, user]);

  if (loading) return null;
  // Pas de session : on laisse le flux d'authentification existant gérer (aucune donnée n'est servie sans cookie)
  if (!userRole) return <>{children}</>;
  if (needsFlag && flag === null) return null;

  if (!canAccessPath(userRole, pathname, { attendanceAll: !!flag })) {
    return <AccessDenied role={userRole} homeHref={bp(homeFor(userRole))} />;
  }
  return <>{children}</>;
}
