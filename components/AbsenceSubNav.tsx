'use client';

// ============================================================================
// 📁 components/AbsenceSubNav.tsx
// ✅ Sous-navigation du module Absences — mêmes groupes que Permissions et
//    Prêts (voir RequestModuleNav) : Pilotage · Analyse · Actions.
// ============================================================================

import React from 'react';
import { LayoutGrid, CalendarDays, History, FileBarChart, Plus, UserCircle } from 'lucide-react';
import RequestModuleNav, { NavLinkDef } from '@/components/RequestModuleNav';

const MANAGE_ROLES = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'];

export default function AbsenceSubNav({ userRole }: { userRole: string }) {
  const canManage = MANAGE_ROLES.includes(userRole);
  const links: NavLinkDef[] = [
    ...(canManage ? [
      { href: '/presences/absences', label: 'Gestion', icon: LayoutGrid, group: 'pilot' as const },
      { href: '/presences/absences/suivi', label: 'Suivi', icon: CalendarDays, group: 'pilot' as const },
      { href: '/presences/absences/historique', label: 'Historique', icon: History, group: 'analysis' as const },
      { href: '/presences/absences/rapport', label: 'Rapport', icon: FileBarChart, group: 'analysis' as const },
    ] : []),
    { href: '/presences/absences/nouveau', label: 'Nouvelle demande', icon: Plus, group: 'action' },
    { href: '/presences/absences/mon-espace', label: 'Mon espace', icon: UserCircle, group: 'action' },
  ];
  return <RequestModuleNav links={links} accent="emerald" />;
}