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

import React from 'react';
import {
  LayoutDashboard, ClipboardList, DollarSign, UsersRound, Building2,
  UserCircle, BarChart3, UmbrellaOff, BookOpen, CalendarDays,
  ReceiptText, FileSpreadsheet, ArrowRightLeft,
} from 'lucide-react';
import { useBasePath } from '@/hooks/useBasePath';
import ModuleNav from '@/components/requests/ModuleNav';

const PRIMARY = [
  { href: '/rapports',                label: "Vue d'ensemble", Icon: LayoutDashboard },
  { href: '/rapports/complet',         label: 'Rapport Complet', Icon: ClipboardList },
  { href: '/rapports/analyse-paie',    label: 'Paie & Coûts',   Icon: DollarSign },
  { href: '/rapports/effectifs',       label: 'Effectifs',       Icon: UsersRound },
  { href: '/rapports/departements',    label: 'Départements',    Icon: Building2 },
];

const MORE = [
  { href: '/rapports/recap-personnel',     label: 'Récap. Personnel',    Icon: ReceiptText },
  { href: '/rapports/journal-paie',        label: 'Journal de paie',      Icon: BookOpen },
  { href: '/rapports/mouvements-effectifs', label: 'Mouvements Effectif', Icon: ArrowRightLeft },
  { href: '/rapports/das-declaration',     label: 'DAS annuelle',        Icon: FileSpreadsheet },
  { href: '/rapports/recap-bulletins-annuel',     label: 'Récap Bulletin Annuel',     Icon: BookOpen },
  { href: '/rapports/its-bnc',             label: 'ITS / BNC par mois',  Icon: DollarSign },
  { href: '/rapports/indicateurs',         label: 'Indicateurs RH',      Icon: BarChart3 },
  { href: '/rapports/analyse-conges',      label: 'Congés',               Icon: UmbrellaOff },
  { href: '/rapports/observatoire-conges', label: 'Observatoire congés',  Icon: UmbrellaOff },
  { href: '/rapports/absences',            label: 'Absences',             Icon: CalendarDays },
  { href: '/rapports/comptabilite',        label: 'Comptabilité',         Icon: BookOpen },
];

export default function RapportsSubNav({ active }: { active: string }) {
  const { bp } = useBasePath();
  // Même barre que tous les modules : les rapports qui ne tiennent pas passent dans « Plus ».
  const items = [
    ...PRIMARY.map(({ href, label, Icon }) => ({ href: bp(href), label, icon: Icon, group: 'main', active: active === href })),
    ...MORE.map(({ href, label, Icon }) => ({ href: bp(href), label, icon: Icon, group: 'more', active: active === href })),
  ];
  return <ModuleNav items={items} groupLabels={{ main: 'Rapports principaux', more: 'Autres rapports' }} ariaLabel="Navigation des rapports" />;
}
