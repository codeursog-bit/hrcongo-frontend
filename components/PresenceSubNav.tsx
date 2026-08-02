'use client';

// ============================================================================
// 📁 components/PresenceSubNav.tsx
// ✅ Barre de navigation courte, commune à toutes les pages du module
//    Présences (anciennes et nouvelles) — pour qu'on puisse toujours passer
//    de l'une à l'autre en un clic, sans repasser par le menu principal.
//    À poser en haut de chaque page : /presences, /presences/pointage,
//    /presences/pointage-manuel, /presences/resume, /presences/shifts,
//    /presences/absences, /presences/absences/nouveau, /presences/absences/mon-espace
// ============================================================================

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid, Fingerprint, KeyRound, FileText, CalendarClock,
  BarChart3, Ticket, CalendarDays,
} from 'lucide-react';
import { useBasePath } from '@/hooks/useBasePath';

interface PresenceSubNavProps {
  userRole: string;
}

export default function PresenceSubNav({ userRole }: PresenceSubNavProps) {
  const { bp } = useBasePath();
  const pathname = usePathname();

  const canManage = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'MANAGER'].includes(userRole);

  const links = [
    { href: '/presences',                  label: 'Vue d\u2019ensemble', icon: LayoutGrid },
    { href: '/presences/pointage',         label: 'Ma pointeuse',       icon: Fingerprint },
    ...(canManage ? [{ href: '/presences/pointage-manuel', label: 'Pointage manuel', icon: KeyRound }] : []),
    { href: '/presences/absences',         label: 'Demande d\u2019absence', icon: FileText },
    { href: '/presences/absences/suivi',   label: 'Suivi des absences', icon: CalendarDays },
    { href: '/presences/permissions',      label: 'Permissions',        icon: Ticket },
    ...(canManage ? [{ href: '/presences/shifts', label: 'Shifts', icon: CalendarClock }] : []),
    { href: '/presences/resume',           label: 'Mon résumé',         icon: BarChart3 },
  ];

  const isActive = (href: string) => {
    const target = bp(href);
    if (pathname === target) return true;
    if (href === '/presences') return false;
    // ✅ '/presences/absences' ne doit pas matcher '/presences/absences/suivi'
    //    (routes distinctes désormais : demande vs suivi)
    if (href === '/presences/absences') {
      return pathname?.startsWith(target) && !pathname?.startsWith(bp('/presences/absences/suivi'));
    }
    return pathname?.startsWith(target);
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
