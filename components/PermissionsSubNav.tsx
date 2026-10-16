'use client';

// ============================================================================
// 📁 components/PermissionsSubNav.tsx
// ✅ Sous-navigation du module Permissions — mêmes groupes que Absences et
//    Prêts (voir RequestModuleNav) : Pilotage · Analyse · Actions.
//    Se place SOUS PresenceModuleSwitcher.
// ============================================================================

import React from 'react';
import { LayoutGrid, LineChart, CheckSquare, FileBarChart, History, Plus, UserCircle } from 'lucide-react';
import RequestModuleNav, { NavLinkDef } from '@/components/RequestModuleNav';

const MANAGE_ROLES = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'];

export default function PermissionsSubNav({ userRole }: { userRole: string }) {
  const canManage = MANAGE_ROLES.includes(userRole);
  const links: NavLinkDef[] = [
    ...(canManage ? [
      { href: '/presences/permissions', label: 'Gestion', icon: LayoutGrid, group: 'pilot' as const },
      { href: '/presences/permissions/validations', label: 'Validations', icon: CheckSquare, group: 'pilot' as const },
      { href: '/presences/permissions/suivi', label: 'Suivi', icon: LineChart, group: 'pilot' as const },
      { href: '/presences/permissions/historique', label: 'Historique', icon: History, group: 'analysis' as const },
      { href: '/presences/permissions/rapport', label: 'Rapport', icon: FileBarChart, group: 'analysis' as const },
    ] : []),
    { href: '/presences/permissions/nouveau', label: 'Nouveau ticket', icon: Plus, group: 'action' },
    { href: '/presences/permissions/mon-espace', label: 'Mon espace', icon: UserCircle, group: 'action' },
  ];
  return <RequestModuleNav links={links} accent="emerald" />;
}