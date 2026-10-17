'use client';

// ============================================================================
// 📁 components/PresenceModuleSwitcher.tsx
// ✅ Sélecteur de module Présences · Absences · Permissions.
//    À poser UNIQUEMENT sur /presences/absences/* et /presences/permissions/*
//    (au-dessus de AbsenceSubNav / PermissionsSubNav).
// 🆕 Même rendu que la navigation de Prêts (RequestModuleNav) : plus de pastilles rondes à part.
// ============================================================================

import React from 'react';
import { Fingerprint, FileText, Ticket } from 'lucide-react';
import RequestModuleNav, { NavLinkDef } from '@/components/RequestModuleNav';

const LINKS: NavLinkDef[] = [
  { href: '/presences', label: 'Présences', icon: Fingerprint, group: 'module' },
  { href: '/presences/absences', label: 'Absences', icon: FileText, group: 'module' },
  { href: '/presences/permissions', label: 'Permissions', icon: Ticket, group: 'module' },
];

export default function PresenceModuleSwitcher() {
  // RequestModuleNav allume le lien le plus spécifique : /presences/absences/* → Absences,
  // /presences/permissions/* → Permissions, le reste de /presences → Présences.
  return <RequestModuleNav links={LINKS} accent="emerald" />;
}