'use client';

// ============================================================================
// 📁 components/CongeSubNav.tsx
// ✅ Même principe que PresenceSubNav — une barre de liens courte à poser en
//    haut de chaque page du module Congés, pour naviguer d'une page à l'autre
//    sans repasser par le menu principal.
//    À poser dans : /conges, /conges/nouveau, /conges/mon-espace,
//    /conges/soldes, /conges/calendrier, /conges/provision, /conges/[id]
// ============================================================================

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid, Plus, UserCircle, Wallet, CalendarDays, HandCoins, Plane, ClipboardList, CalendarRange, AreaChart,
} from 'lucide-react';
import { useBasePath } from '@/hooks/useBasePath';

interface CongeSubNavProps {
  userRole: string;
}

const APPROVER_ROLES = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'];
const HR_ROLES = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'];

export default function CongeSubNav({ userRole }: CongeSubNavProps) {
  const { bp } = useBasePath();
  const pathname = usePathname();

  const canManage = APPROVER_ROLES.includes(userRole);
  const isHR = HR_ROLES.includes(userRole);

  const links = [
    { href: '/conges',            label: 'Vue d\u2019ensemble', icon: LayoutGrid },
    { href: '/conges/nouveau',    label: 'Nouvelle demande',   icon: Plus },
    { href: '/conges/mon-espace', label: 'Mon espace',         icon: UserCircle },
    { href: '/conges/soldes',     label: 'Soldes',              icon: Wallet },
    { href: '/conges/calendrier', label: 'Calendrier',          icon: CalendarDays },
    ...(canManage ? [{ href: '/conges/gestion',  label: 'Gestion',        icon: ClipboardList }] : []),
    ...(canManage ? [{ href: '/conges/programme', label: 'Planning',      icon: CalendarRange }] : []),
    ...(canManage ? [{ href: '/conges/planning', label: 'Suivi de congé', icon: Plane }] : []),
    ...(isHR ? [{ href: '/conges/provision', label: 'Provision', icon: HandCoins }] : []),
    ...(isHR ? [{ href: '/conges/analyse', label: 'Analyse', icon: AreaChart }] : []),
  ];

  const isActive = (href: string) => {
    const target = bp(href);
    return pathname === target || (href !== '/conges' && pathname?.startsWith(target));
  };

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 mb-5 -mt-1">
      {links.map(l => {
        const Icon = l.icon;
        const active = isActive(l.href);
        return (
          <Link
            key={l.href}
            href={bp(l.href)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
              active
                ? 'bg-sky-500 text-white shadow-sm'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Icon size={14} /> {l.label}
          </Link>
        );
      })}
    </div>
  );
}