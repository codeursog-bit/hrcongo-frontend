'use client';

// ============================================================================
// 📄 components/performance/PerformanceNav.tsx
// Barre de navigation commune à toutes les pages « Performance » + une phrase
// qui explique, en langage simple, à quoi sert la page affichée.
//   • Employé : 2 entrées seulement (Ma performance, Mes objectifs)
//   • Manager / RH : toutes les entrées utiles à leur rôle
// Le serveur reste l'autorité : masquer un lien n'ouvre ni ne ferme aucun droit.
// ============================================================================

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ClipboardCheck, UserCircle, Rocket, GraduationCap, Route, Target, ListChecks } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useBasePath } from '@/hooks/useBasePath';
import { MANAGE_ROLES, getStoredUser } from './sheet-types';
import ModuleNav from '@/components/requests/ModuleNav';

interface Item {
  href: string;
  label: string;
  desc: string;
  Icon: LucideIcon;
  /** Chemins qui comptent aussi comme « page active » pour cet onglet */
  also?: string[];
}

const MANAGE_ITEMS: Item[] = [
  { href: '/performance', label: 'Évaluations', Icon: ClipboardCheck, also: ['/performance/fiche'],
    desc: "Les évaluations de votre équipe. Ouvrez-en une pour la noter, la relire ou l'envoyer à l'employé." },
  { href: '/performance/objectifs', label: 'Objectifs', Icon: Target,
    desc: "Ce que chaque personne doit atteindre. Les objectifs sont repris automatiquement dans les évaluations." },
  { href: '/performance/cycles', label: 'Campagnes', Icon: Rocket,
    desc: "Une campagne = lancer l'évaluation de toute l'équipe en une seule fois (ex : T4 2026)." },
  { href: '/performance/modeles', label: 'Grilles', Icon: ListChecks,
    desc: "Une grille = la liste des critères sur lesquels on note (qualité, ponctualité…). Vous pouvez en créer une par poste." },
  { href: '/performance/competences', label: 'Compétences', Icon: GraduationCap,
    desc: "Ce que chaque poste demande et où il manque du niveau. Sert à choisir les bonnes formations." },
  { href: '/performance/carriere', label: 'Carrière', Icon: Route,
    desc: "Le parcours de chaque employé, les propositions de promotion et les plans pour progresser." },
  { href: '/performance/mon-espace', label: 'Ma performance', Icon: UserCircle,
    desc: "Vos propres objectifs et évaluations." },
];

const EMPLOYEE_ITEMS: Item[] = [
  { href: '/performance/mon-espace', label: 'Ma performance', Icon: UserCircle, also: ['/performance/fiche'],
    desc: "Ce que vous devez faire, vos objectifs et vos évaluations." },
  { href: '/performance/objectifs', label: 'Mes objectifs', Icon: Target,
    desc: "Vos objectifs. Mettez à jour votre avancement pour que votre responsable le voie." },
];

export default function PerformanceNav() {
  const pathname = usePathname() ?? '';
  const { bp } = useBasePath();
  const [items, setItems] = useState<Item[] | null>(null);

  useEffect(() => {
    const u = getStoredUser();
    setItems(!!u?.role && MANAGE_ROLES.includes(u.role) ? MANAGE_ITEMS : EMPLOYEE_ITEMS);
  }, []);

  if (!items) return null;

  const under = (path: string) => pathname === bp(path) || pathname.startsWith(bp(path) + '/');
  const isActive = (it: Item) =>
    it.href === '/performance'
      ? pathname === bp('/performance') || (it.also ?? []).some(under)
      : under(it.href) || (it.also ?? []).some(under);

  const active = items.find(isActive);

  return (
    <div className="print:hidden">
      <ModuleNav
        tight={!!active}
        ariaLabel="Navigation performance"
        items={items.map(it => ({ href: bp(it.href), label: it.label, icon: it.Icon, active: it === active }))}
      />
      {active && <p className="module-nav-desc">{active.desc}</p>}
    </div>
  );
}
