'use client';
import React, { useEffect, useRef } from 'react';
import { ChevronDown, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/design-system/primitives';

export function DossierSection({id,title,hint,children}:{id:string;title:string;hint:string;children:React.ReactNode}) {
  return <details id={id} className="dossier-section"><summary id={`${id}-summary`}><span><h2>{title}</h2><span className="dossier-section-hint">{hint}</span></span><ChevronDown size={18} strokeWidth={1.5} aria-hidden="true" /></summary><div className="dossier-section-content" role="group" aria-labelledby={`${id}-summary`}>{children}</div></details>;
}

export function DossierActions({children}:{children:React.ReactNode}) {
  const ref=useRef<HTMLDetailsElement>(null);
  useEffect(()=>{
    const outside=(e:MouseEvent)=>{if(ref.current?.open&&!ref.current.contains(e.target as Node))ref.current.open=false;};
    const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'&&ref.current?.open){ref.current.open=false;ref.current.querySelector('summary')?.focus();}};
    document.addEventListener('click',outside);document.addEventListener('keydown',escape);
    return()=>{document.removeEventListener('click',outside);document.removeEventListener('keydown',escape);};
  },[]);
  return <details ref={ref} className="dossier-actions-menu"><summary aria-label="Autres actions"><MoreHorizontal size={18} strokeWidth={1.5} aria-hidden="true" /><span>Autres actions</span></summary><div className="dossier-actions-panel" onClick={e=>{if((e.target as Element).closest('a,button')&&ref.current){ref.current.open=false;ref.current.querySelector('summary')?.focus();}}}>{children}</div></details>;
}

export function DossierReveal({target,children}:{target:string;children:React.ReactNode}) {
  return <Button variant="ghost" onClick={()=>{
    const section=document.getElementById(target);if(!(section instanceof HTMLDetailsElement))return;
    section.open=true;section.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});section.querySelector('summary')?.focus();
  }}>{children}</Button>;
}

export function DossierTabList({children}:{children:React.ReactNode}) {
  return <div role="tablist" aria-label="Rubriques du dossier employé" className="dossier-tabs" onKeyDown={e=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
    const tabs=Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('button[role="tab"]')),index=tabs.indexOf(e.target as HTMLButtonElement);if(index<0)return;
    e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(index+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tabs[next]?.focus();tabs[next]?.click();
  }}>{children}</div>;
}
