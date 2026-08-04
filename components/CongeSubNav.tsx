'use client';

// ============================================================================
// 📁 components/CongeSubNav.tsx
// ✅ Même principe que FinanceSubNav / PermissionsSubNav, mais Congés a plus
//    de pages que Prêt/Permissions (10 au total pour un ADMIN) → ça déborde
//    sur une seule ligne. On sépare donc en 2 lignes :
//      Ligne 1 (managers/RH)  : Vue d'ensemble, Gestion, Suivi de congé,
//                                Calendrier, Soldes, Provision, Analyse
//      Ligne 2 (tout le monde, plus discrète) : Nouvelle demande, Mon espace,
//                                Programme des départs
//    Un employé standard ne voit que la ligne 2 (3 items, comme sur Prêt).
//    À poser dans : /conges, /conges/nouveau, /conges/mon-espace,
//    /conges/soldes, /conges/calendrier, /conges/provision, /conges/[id]
// ============================================================================

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid, ClipboardList, Plus, UserCircle, Wallet, CalendarDays, HandCoins, Plane, CalendarRange, AreaChart,
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

  const manageLinks = [
    ...(canManage ? [{ href: '/conges',            label: 'Vue d\u2019ensemble', icon: LayoutGrid }] : []),
    ...(canManage ? [{ href: '/conges/gestion',    label: 'Gestion',        icon: ClipboardList }] : []),
    ...(canManage ? [{ href: '/conges/planning',   label: 'Suivi de congé', icon: Plane }] : []),
    ...(canManage ? [{ href: '/conges/calendrier', label: 'Calendrier',     icon: CalendarDays }] : []),
    ...(canManage ? [{ href: '/conges/soldes',     label: 'Soldes',         icon: Wallet }] : []),
    ...(isHR ? [{ href: '/conges/provision', label: 'Provision', icon: HandCoins }] : []),
    ...(isHR ? [{ href: '/conges/analyse',   label: 'Analyse',   icon: AreaChart }] : []),
  ];

  const selfServiceLinks = [
    { href: '/conges/nouveau',    label: 'Nouvelle demande',      icon: Plus },
    { href: '/conges/mon-espace', label: 'Mon espace',            icon: UserCircle },
    { href: '/conges/programme',  label: 'Programme des départs', icon: CalendarRange },
  ];

  const isActive = (href: string) => {
    const target = bp(href);
    return pathname === target || (href !== '/conges' && pathname?.startsWith(target));
  };

  const renderLink = (l: { href: string; label: string; icon: any }, muted: boolean) => {
    const Icon = l.icon;
    const active = isActive(l.href);
    return (
      <Link
        key={l.href}
        href={bp(l.href)}
        className={`flex items-center gap-1.5 rounded-xl whitespace-nowrap transition-all shrink-0 ${
          muted ? 'px-3 py-1.5 text-[11px] font-semibold' : 'px-3.5 py-2 text-xs font-semibold'
        } ${
          active
            ? 'bg-sky-500 text-white shadow-sm'
            : muted
              ? 'bg-transparent border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
        }`}
      >
        <Icon size={muted ? 12 : 14} /> {l.label}
      </Link>
    );
  };

  return (
    <div className="mb-5 -mt-1 space-y-1.5">
      {manageLinks.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {manageLinks.map(l => renderLink(l, false))}
        </div>
      )}
      <div className="flex gap-1.5 overflow-x-auto">
        {selfServiceLinks.map(l => renderLink(l, true))}
      </div>
    </div>
  );
}