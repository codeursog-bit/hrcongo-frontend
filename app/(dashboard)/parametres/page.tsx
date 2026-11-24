'use client';

import React from 'react';
import Link from 'next/link';
import { Settings, Wallet, Users, Lock, ChevronRight, Building2, Network, Gift, Receipt,Crown,Palette, ListChecks, FileText } from 'lucide-react';
import { SettingsFrame as ModulePageFrame } from '@/components/settings/SettingsFrame';

function ParametresPage() {
  const modules = [
    {
      title: 'Entreprise',
      desc: 'Infos légales, branding, coordonnées.',
      icon: Building2,
      color: 'bg-[var(--brand)]',
      path: '/parametres/entreprise',
    },
    {
      title: 'Départements',
      desc: 'Structure organisationnelle et services.',
      icon: Network,
      color: 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]',
      path: '/parametres/departements',
    },
    {
      title: 'Paramètres de Paie',
      desc: 'Taux CNSS, Barèmes ITS, Heures Supp.',
      icon: Wallet,
      color: 'bg-[var(--brand)]',
      path: '/parametres/paie',
    },
    {
      title: 'Catalogue des Primes',
      desc: 'Créez vos types de primes, configurez ITS et CNSS.',
      icon: Gift,
      color: 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]',
      path: '/parametres/primes',
    },
    {
      title: 'Cotisations & Taxes',
      desc: 'TOL, CAMU, taxes personnalisées salarié / patronales.',
      icon: Receipt,
      color: 'bg-[var(--brand)]',
      path: '/parametres/taxes',
    },
    {
      title: 'Gestion Utilisateurs',
      desc: 'Rôles, permissions et accès.',
      icon: Users,
      color: 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]',
      path: '/parametres/users',
    },
    {
      title: 'Circuits de validation',
      desc: 'Avis demandés avant la décision (prêts, avances).',
      icon: ListChecks,
      color: 'bg-[var(--brand)]',
      path: '/parametres/circuits',
    },
    {
  title: 'Abonnement',
  desc: 'Plan actuel, utilisation et facturation.',
  icon: Crown,
  color: 'bg-[var(--brand)]',
  path: '/parametres/subscription',
},
    {
      title: 'Sécurité',
      desc: 'Double authentification, mot de passe.',
      icon: Lock,
      color: 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]',
      path: '/parametres/securite',
    },
{
  title: 'Apparence Bulletin',
  desc: 'Personnalisez le design de vos bulletins de paie.',
  icon: Palette,
  color: 'bg-[var(--brand)]',
  path: '/parametres/bulletin',
},
    {
      title: 'Documents',
      desc: 'Choisissez le design des bulletins de votre entreprise.',
      icon: FileText,
      color: 'bg-[var(--brand)]',
      path: '/parametres/documents',
    },
  ];

  const uiSettingsGroups = [{"title":"Entreprise et équipe","description":"L’identité de votre entreprise et son organisation.","paths":["/parametres/entreprise","/parametres/departements","/parametres/users"]},{"title":"Paie et documents","description":"Les règles, les rémunérations et leur présentation.","paths":["/parametres/paie","/parametres/primes","/parametres/taxes","/parametres/documents","/parametres/bulletin"]},{"title":"Accès et gestion","description":"Les validations, la sécurité et votre abonnement.","paths":["/parametres/circuits","/parametres/securite","/parametres/subscription"]}];
  return <div className="mx-auto max-w-[1400px] pb-20"><header className="settings-home-header"><h1>Paramètres</h1><p>Retrouvez les réglages de votre entreprise, de votre paie et de vos accès.</p></header><div className="settings-home-groups">{uiSettingsGroups.map(group=><section className="settings-home-group" key={group.title}><header><h2>{group.title}</h2><p>{group.description}</p></header><div className="settings-home-links">{modules.filter(mod=>group.paths.includes(mod.path)).map(mod=><Link href={mod.path} key={mod.path} data-guide={`parametres-${mod.path.split('/').pop()}`} className="settings-home-link"><mod.icon size={20} strokeWidth={1.5} aria-hidden="true" /><div className="flex-1 min-w-0"><h3>{mod.path==='/parametres/bulletin'?'Bulletins et factures':mod.title}</h3><p>{mod.desc}</p></div><ChevronRight size={16} strokeWidth={1.5} aria-hidden="true" /></Link>)}</div></section>)}</div></div>;
}


export default function ParametresPageWithFrame() {
  return (
    <ModulePageFrame kind="list">
      <ParametresPage />
    </ModulePageFrame>
  );
}
