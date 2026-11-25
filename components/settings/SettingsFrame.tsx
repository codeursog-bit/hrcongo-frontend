'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
import { MotionConfig } from 'framer-motion';
import { Building2, Network, Users, Wallet, Gift, Receipt, ListChecks, ShieldCheck, Crown, Settings, FileText } from 'lucide-react';
import { useBasePath } from '@/hooks/useBasePath';
import ModuleNav from '@/components/requests/ModuleNav';
import { ModulePageFrame } from '@/components/requests/ModulePageFrame';
import './settings.css';

export const SETTINGS_LINKS = [
  { href:'/parametres',label:'Vue d’ensemble',icon:Settings,group:'general' },
  { href:'/parametres/entreprise',label:'Entreprise',icon:Building2,group:'organisation' },
  { href:'/parametres/departements',label:'Départements',icon:Network,group:'organisation' },
  { href:'/parametres/users',label:'Utilisateurs',icon:Users,group:'organisation' },
  { href:'/parametres/paie',label:'Règles de paie',icon:Wallet,group:'paie' },
  { href:'/parametres/primes',label:'Primes',icon:Gift,group:'paie' },
  { href:'/parametres/taxes',label:'Cotisations et taxes',icon:Receipt,group:'paie' },
  { href:'/parametres/documents',label:'Documents',icon:FileText,group:'paie' },
  { href:'/parametres/circuits',label:'Circuits de validation',icon:ListChecks,group:'acces' },
  { href:'/parametres/securite',label:'Sécurité',icon:ShieldCheck,group:'acces' },
  { href:'/parametres/subscription',label:'Abonnement',icon:Crown,group:'acces' },
];

export function SettingsFrame({ children, ...props }: React.ComponentProps<typeof ModulePageFrame>) {
  const pathname = usePathname() || '', { bp } = useBasePath();
  if (/^\/(admin|cabinet)(\/|$)/.test(pathname)) return <ModulePageFrame {...props}>{children}</ModulePageFrame>;
  return <MotionConfig reducedMotion="user"><div className="settings-workspace"><ModulePageFrame {...props}>
    {pathname !== bp('/parametres') && <ModuleNav ariaLabel="Navigation des paramètres" groupLabels={{general:'Paramètres',organisation:'Organisation',paie:'Paie et documents',acces:'Accès et gestion'}} items={SETTINGS_LINKS.filter(link => link.href !== '/parametres/documents' || !pathname.startsWith('/pme/')).map(link => ({...link,href:bp(link.href),active:pathname===bp(link.href) || link.href === '/parametres/documents' && pathname.startsWith(bp(link.href) + '/')}))} />}
    {children}
  </ModulePageFrame></div></MotionConfig>;
}
