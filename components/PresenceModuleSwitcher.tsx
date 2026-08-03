'use client';

// ============================================================================
// 📁 components/PresenceModuleSwitcher.tsx
// ✅ Mini sélecteur (3 pills) pour sauter entre les modules Présences /
//    Absences / Permissions sans reposer la barre complète PresenceSubNav.
//    À poser UNIQUEMENT sur /presences/absences/* et /presences/permissions/*
//    (au-dessus de AbsenceSubNav / PermissionsSubNav). Le hub /presences
//    garde PresenceSubNav en entier et n'a pas besoin de ce switcher.
// ============================================================================

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fingerprint, FileText, Ticket } from 'lucide-react';
import { useBasePath } from '@/hooks/useBasePath';

const MODULES = [
  { href: '/presences', label: 'Présences', icon: Fingerprint },
  { href: '/presences/absences', label: 'Absences', icon: FileText },
  { href: '/presences/permissions', label: 'Permissions', icon: Ticket },
];

export default function PresenceModuleSwitcher() {
  const { bp } = useBasePath();
  const pathname = usePathname();

  const isActive = (href: string) => {
    const target = bp(href);
    if (href === '/presences') {
      // ne pas matcher les sous-modules absences/permissions
      return pathname === target || (pathname?.startsWith(target) && !pathname?.startsWith(bp('/presences/absences')) && !pathname?.startsWith(bp('/presences/permissions')));
    }
    return pathname?.startsWith(target);
  };

  return (
    <div className="flex gap-1.5 mb-3">
      {MODULES.map(m => {
        const Icon = m.icon;
        const active = isActive(m.href);
        return (
          <Link
            key={m.href}
            href={bp(m.href)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all shrink-0 border ${
              active
                ? 'bg-sky-500 border-sky-500 text-white'
                : 'bg-transparent border-gray-200 dark:border-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            <Icon size={12} /> {m.label}
          </Link>
        );
      })}
    </div>
  );
}
