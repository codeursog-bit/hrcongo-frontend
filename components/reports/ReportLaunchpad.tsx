'use client';
import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, FileCheck2, Users, Wallet } from 'lucide-react';
import { useBasePath } from '@/hooks/useBasePath';

const reports=[
  {href:'/rapports/analyse-paie',title:'Comprendre la paie',description:'Masse salariale, retenues et coût employeur.',icon:Wallet},
  {href:'/rapports/effectifs',title:'Suivre les effectifs',description:'Répartition des équipes, contrats et tendances.',icon:Users},
  {href:'/rapports/recap-personnel',title:'Préparer les déclarations',description:'Récapitulatifs du personnel et contrôles avant diffusion.',icon:FileCheck2},
];
export function ReportLaunchpad() {
  const {bp}=useBasePath();
  return <section aria-label="Explorer les rapports" className="reports-launchpad">{reports.map(({href,title,description,icon:Icon})=><Link key={href} href={bp(href)}><div><Icon size={20} strokeWidth={1.5}/><ArrowUpRight size={17} strokeWidth={1.5}/></div><h2>{title}</h2><p>{description}</p><span>Ouvrir le rapport</span></Link>)}</section>;
}
