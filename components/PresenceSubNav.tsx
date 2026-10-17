'use client';

// ============================================================================
// 📁 components/PresenceSubNav.tsx
// ✅ Barre de navigation commune à toutes les pages du module Présences.
// 🆕 Même rendu que Prêts / Absences / Permissions (RequestModuleNav) :
//      PILOTAGE  → Vue d'ensemble · Pointage manuel · Shifts · Tablettes · Écrans QR
//      ANALYSE   → Tableau de bord · Suivi des absences
//      ACTIONS   → Ma pointeuse · Absences · Permissions · Mon résumé
//    Mêmes droits qu'avant (aucune page n'est ajoutée ni retirée selon les rôles).
//    À poser en haut de chaque page : /presences, /presences/pointage, /presences/pointage-manuel,
//    /presences/resume, /presences/shifts, /presences/tablettes, /presences/ecrans, /presences/dashboard…
// ============================================================================

import React from 'react';
import {
  LayoutGrid, Fingerprint, KeyRound, FileText, CalendarClock,
  BarChart3, Ticket, CalendarDays, Tablet, MonitorSmartphone, PieChart,
} from 'lucide-react';
import RequestModuleNav, { NavLinkDef } from '@/components/RequestModuleNav';

interface PresenceSubNavProps {
  userRole: string;
  canRecordAttendanceForAll?: boolean; // permission "secrétaire" : pointage manuel pour tout le monde
}

export default function PresenceSubNav({ userRole, canRecordAttendanceForAll = false }: PresenceSubNavProps) {
  const canManage = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'MANAGER'].includes(userRole);
  // Un employé (ou un manager) ne voit pas les écrans de gestion/suivi des absences et permissions :
  // il est envoyé vers « son espace ».
  const canAdminAbsences = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'].includes(userRole);
  const canManualPointage = canManage || canRecordAttendanceForAll; // secrétaire : pointage manuel uniquement, pas les shifts

  const links: NavLinkDef[] = [
    // ── Pilotage ──
    { href: '/presences', label: 'Vue d\u2019ensemble', icon: LayoutGrid, group: canManage ? 'pilot' : 'action' },
    ...(canManualPointage ? [{ href: '/presences/pointage-manuel', label: 'Pointage manuel', icon: KeyRound, group: 'pilot' as const }] : []),
    ...(canManage ? [{ href: '/presences/shifts', label: 'Shifts', icon: CalendarClock, group: 'pilot' as const }] : []),
    ...(canManage ? [{ href: '/presences/tablettes', label: 'Tablettes', icon: Tablet, group: 'pilot' as const }] : []),
    ...(canAdminAbsences ? [{ href: '/presences/ecrans', label: 'Écrans QR', icon: MonitorSmartphone, group: 'pilot' as const }] : []),

    // ── Analyse ──
    ...(canAdminAbsences ? [
      { href: '/presences/dashboard', label: 'Tableau de bord', icon: PieChart, group: 'analysis' as const },
      { href: '/presences/absences/suivi', label: 'Suivi des absences', icon: CalendarDays, group: 'analysis' as const },
    ] : []),

    // ── Actions ──
    { href: '/presences/pointage', label: 'Ma pointeuse', icon: Fingerprint, group: 'action' },
    canAdminAbsences
      ? { href: '/presences/absences', label: 'Demande d\u2019absence', icon: FileText, group: 'action' as const }
      : { href: '/presences/absences/mon-espace', label: 'Mes absences', icon: FileText, group: 'action' as const },
    canAdminAbsences
      ? { href: '/presences/permissions', label: 'Permissions', icon: Ticket, group: 'action' as const }
      : { href: '/presences/permissions/mon-espace', label: 'Mes permissions', icon: Ticket, group: 'action' as const },
    { href: '/presences/resume', label: 'Mon résumé', icon: BarChart3, group: 'action' },
  ];

  return <RequestModuleNav links={links} accent="emerald" />;
}