'use client';

// ============================================================================
// 📁 components/RapportsSubNav.tsx
// ✅ Remplace la rangée de 9 à 11 boutons copiée-collée dans chaque page
//    /rapports/*. Ici : 5 liens principaux visibles + les autres regroupés
//    dans un menu déroulant "Plus" — la navigation reste complète mais ne
//    déborde plus à l'écran.
//
//    Usage dans une page :
//      <RapportsSubNav active="/rapports/departements" />
//
// 🔧 Fix : le menu "Plus" était auparavant DANS le même conteneur que la
//    rangée de boutons en overflow-x-auto. En CSS, dès qu'un axe passe à
//    autre chose que "visible", le navigateur force l'AUTRE axe à "auto"
//    aussi — donc overflow-y devenait "auto" sur ce conteneur et coupait le
//    menu déroulant (positionné en absolute juste dessous), qui s'ouvrait
//    bien mais restait invisible/inaccessible. Le menu "Plus" est maintenant
//    un frère du conteneur scrollable, plus jamais coupé par lui.
// ============================================================================

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, ClipboardList, DollarSign, UsersRound, Building2,
  UserCircle, BarChart3, UmbrellaOff, BookOpen, CalendarDays,
  MoreHorizontal, ChevronDown, Check,
} from 'lucide-react';
import { useBasePath } from '@/hooks/useBasePath';

const PRIMARY = [
  { href: '/rapports',                label: "Vue d'ensemble", Icon: LayoutDashboard },
  { href: '/rapports/complet',         label: 'Rapport Complet', Icon: ClipboardList },
  { href: '/rapports/analyse-paie',    label: 'Paie & Coûts',   Icon: DollarSign },
  { href: '/rapports/effectifs',       label: 'Effectifs',       Icon: UsersRound },
  { href: '/rapports/departements',    label: 'Départements',    Icon: Building2 },
];

const MORE = [
  { href: '/rapports/employes',            label: 'Employés',            Icon: UserCircle },
  { href: '/rapports/indicateurs',         label: 'Indicateurs RH',      Icon: BarChart3 },
  { href: '/rapports/analyse-conges',      label: 'Congés',               Icon: UmbrellaOff },
  { href: '/rapports/observatoire-conges', label: 'Observatoire congés',  Icon: UmbrellaOff },
  { href: '/rapports/absences',            label: 'Absences',             Icon: CalendarDays },
  { href: '/rapports/comptabilite',        label: 'Comptabilité',         Icon: BookOpen },
];

export default function RapportsSubNav({ active }: { active: string }) {
  const router = useRouter();
  const { bp } = useBasePath();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const activeInMore = MORE.find((m) => m.href === active);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function go(href: string) {
    setOpen(false);
    router.push(bp(href));
  }

  return (
    <div className="flex items-center gap-2">
      {/* ✅ Seule la rangée de boutons principaux défile horizontalement */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {PRIMARY.map(({ href, label, Icon }) => (
          <button
            key={href}
            onClick={() => go(href)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
              active === href
                ? 'bg-sky-500 text-white shadow-sm'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* ✅ Le menu "Plus" est maintenant HORS du conteneur à overflow-x-auto */}
      <div className="relative shrink-0" ref={wrapRef}>
        <button
          onClick={() => setOpen((o) => !o)}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeInMore
              ? 'bg-sky-500 text-white shadow-sm'
              : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          {activeInMore ? <activeInMore.Icon size={14} /> : <MoreHorizontal size={14} />}
          {activeInMore ? activeInMore.label : 'Plus'}
          <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute left-0 top-full mt-2 w-56 bg-white dark:bg-[#0B1121] border border-gray-100 dark:border-white/10 rounded-2xl shadow-xl z-20 py-1.5 overflow-hidden">
            {MORE.map(({ href, label, Icon }) => (
              <button
                key={href}
                onClick={() => go(href)}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 text-left"
              >
                <Icon size={15} className="text-gray-400 shrink-0" />
                <span className="flex-1">{label}</span>
                {active === href && <Check size={14} className="text-sky-500" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}