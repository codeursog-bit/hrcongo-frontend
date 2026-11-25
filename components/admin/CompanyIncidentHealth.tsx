'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminService } from '@/lib/services/adminService';
export function CompanyIncidentHealth({companyId}:{companyId:string}){
  const [health,setHealth]=useState<{occurrences:number;unresolved:number}|null>(null),[failed,setFailed]=useState(false);
  useEffect(()=>{if(process.env.NEXT_PUBLIC_INCIDENTS_ENABLED!=='true')return;let active=true;const load=()=>adminService.get<{occurrences:number;unresolved:number}>(`/admin/incidents/company/${companyId}/health`).then(result=>{if(active){setHealth(result);setFailed(false)}}).catch(()=>{if(active)setFailed(true)});void load();const timer=setInterval(()=>void load(),60000);return()=>{active=false;clearInterval(timer)}},[companyId]);
  if(process.env.NEXT_PUBLIC_INCIDENTS_ENABLED!=='true')return null;
  return <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--text)]"><strong>Santé applicative · dernières 24 h</strong><p className="mt-1 text-[var(--text-muted)]">{failed?'Suivi temporairement indisponible.':health?`${health.occurrences} erreur(s) signalée(s) · ${health.unresolved} incident(s) à traiter`:'Chargement du suivi…'}</p><Link className="mt-2 inline-block underline" href={`/admin/errors?companyId=${companyId}`}>Consulter les incidents de cette entreprise</Link></div>;
}
