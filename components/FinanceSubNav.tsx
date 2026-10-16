'use client';

// ============================================================================
// 📁 components/FinanceSubNav.tsx
// ✅ Sous-navigation du module Prêts & avances — mêmes groupes que Absences
//    et Permissions (voir RequestModuleNav) : Pilotage · Analyse · Actions.
//    « Relevé » et « Rapport » forment le groupe Analyse (pas de page
//    « Historique » dédiée : le relevé par employé en tient lieu).
// ============================================================================

import React from 'react';
import { LayoutGrid, Plus, UserCircle, LineChart, CheckSquare, FileBarChart, BookOpen } from 'lucide-react';
import RequestModuleNav, { NavLinkDef } from '@/components/RequestModuleNav';

const FINANCE_ROLES = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'];

export default function FinanceSubNav({ userRole }: { userRole: string }) {
  const canManage = FINANCE_ROLES.includes(userRole);
  const links: NavLinkDef[] = [
    ...(canManage ? [
      { href: '/loans', label: 'Gestion', icon: LayoutGrid, group: 'pilot' as const },
      { href: '/loans/validations', label: 'Validations', icon: CheckSquare, group: 'pilot' as const },
      { href: '/loans/suivi-dettes', label: 'Suivi des dettes', icon: LineChart, group: 'pilot' as const },
      { href: '/loans/releve', label: 'Relevé', icon: BookOpen, group: 'analysis' as const },
      { href: '/loans/rapport', label: 'Rapport', icon: FileBarChart, group: 'analysis' as const },
    ] : []),
    { href: '/loans/nouveau', label: 'Nouvelle demande', icon: Plus, group: 'action' },
    { href: '/loans/mon-espace', label: 'Mon espace', icon: UserCircle, group: 'action' },
  ];
  return <RequestModuleNav links={links} accent="sky" />;
}