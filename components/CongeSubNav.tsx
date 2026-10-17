'use client';

// ============================================================================
// 📁 components/CongeSubNav.tsx
// ✅ Sous-navigation du module Congés.
// 🆕 Même rendu que Prêts / Absences / Permissions (RequestModuleNav) : trois groupes lisibles
//      PILOTAGE  → Vue d'ensemble · Suivi de congé · Calendrier · Soldes
//      ANALYSE   → Historique · Diagrammes · Provision
//      ACTIONS   → Nouvelle demande · Mon espace · Programme des départs
//    Un employé standard ne voit que le groupe Actions (comme sur Prêts).
//    Mêmes droits qu'avant : Provision réservée aux rôles RH.
//    À poser dans : /conges, /conges/nouveau, /conges/mon-espace, /conges/soldes, /conges/calendrier,
//    /conges/provision, /conges/historique, /conges/diagrammes, /conges/planning, /conges/[id]
// ============================================================================

import React from 'react';
import {
  LayoutGrid, Plus, UserCircle, Wallet, CalendarDays, HandCoins, Plane, CalendarRange, History, BarChart3,
} from 'lucide-react';
import RequestModuleNav, { NavLinkDef } from '@/components/RequestModuleNav';

interface CongeSubNavProps {
  userRole: string;
}

const APPROVER_ROLES = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'];
const HR_ROLES = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'];

export default function CongeSubNav({ userRole }: CongeSubNavProps) {
  const canManage = APPROVER_ROLES.includes(userRole);
  const isHR = HR_ROLES.includes(userRole);

  const links: NavLinkDef[] = [
    ...(canManage ? [
      { href: '/conges', label: 'Vue d\u2019ensemble', icon: LayoutGrid, group: 'pilot' as const },
      { href: '/conges/planning', label: 'Suivi de congé', icon: Plane, group: 'pilot' as const },
      { href: '/conges/calendrier', label: 'Calendrier', icon: CalendarDays, group: 'pilot' as const },
      { href: '/conges/soldes', label: 'Soldes', icon: Wallet, group: 'pilot' as const },
      { href: '/conges/historique', label: 'Historique', icon: History, group: 'analysis' as const },
      { href: '/conges/diagrammes', label: 'Diagrammes', icon: BarChart3, group: 'analysis' as const },
    ] : []),
    ...(isHR ? [{ href: '/conges/provision', label: 'Provision', icon: HandCoins, group: 'analysis' as const }] : []),
    { href: '/conges/nouveau', label: 'Nouvelle demande', icon: Plus, group: 'action' },
    { href: '/conges/mon-espace', label: 'Mon espace', icon: UserCircle, group: 'action' },
    { href: '/conges/programme', label: 'Programme des départs', icon: CalendarRange, group: 'action' },
  ];

  return <RequestModuleNav links={links} accent="emerald" />;
}