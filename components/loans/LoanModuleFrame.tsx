'use client';
import React,{createContext,useContext,useLayoutEffect,useEffect,useRef,useId,useState} from 'react';
import {ListPage,DetailPage,DashboardPage} from '@/components/templates';
import {Card,Skeleton,Button} from '@/components/design-system/primitives';
import './loan-module.css';
import { useReducedMotion, MotionConfig } from 'framer-motion';
const VisualContext=createContext({refonte:false,motion:true});
export const useLoanVisuals=()=>useContext(VisualContext);
export function useLoanPageVisuals(){const reduced=useReducedMotion();return {refonte:true,motion:reduced===false};}
export function LoanModuleFrame({children,kind='list',error}:{children:React.ReactNode;kind?:'list'|'detail'|'dashboard';error?:string}){
  const ref=useRef<HTMLDivElement>(null),id=useId().replace(/:/g,''),[motion,setMotion]=useState(false);
  useEffect(()=>{const media=matchMedia('(prefers-reduced-motion: reduce)'),sync=()=>setMotion(!media.matches);sync();media.addEventListener('change',sync);return()=>media.removeEventListener('change',sync);},[]);
  useLayoutEffect(()=>{
    const root=ref.current;if(!root)return;
    const annotate=()=>{
      root.querySelectorAll<HTMLElement>('[id*="print"],[id*="preview"]').forEach(el=>{if(el.matches('div,article,section')&&!el.closest('.loan-module-controls'))el.classList.add('loan-document-protected');});
      root.querySelectorAll<HTMLTableElement>('table').forEach(table=>{
        if(table.closest('.loan-document-protected'))return;
        const labels=Array.from(table.querySelectorAll('thead tr:last-child th')).map(th=>th.textContent?.trim()||'Actions');
        table.setAttribute('role','table');table.querySelectorAll('tbody tr').forEach(row=>{row.setAttribute('role','row');row.querySelectorAll<HTMLTableCellElement>('td').forEach((cell,i)=>{if(cell.colSpan>1)return;cell.dataset.label=labels[i]||'';cell.setAttribute('role','cell');});});
      });
      root.querySelectorAll<HTMLElement>('input:not([aria-label]):not([id]),select:not([aria-label]):not([id]),textarea:not([aria-label]):not([id])').forEach(el=>{if(el.closest('.loan-document-protected'))return;const label=el.parentElement?.querySelector('label')?.textContent?.trim()||el.getAttribute('placeholder')||(el.tagName==='SELECT'?(el as HTMLSelectElement).options[0]?.textContent:'');if(label)el.setAttribute('aria-label',label);});
    };annotate();const observer=new MutationObserver(annotate);observer.observe(root,{childList:true,subtree:true,characterData:true});return()=>observer.disconnect();
  },[]);
  const Page=kind==='dashboard'?DashboardPage:kind==='detail'?DetailPage:ListPage;
  return <VisualContext.Provider value={{refonte:true,motion}}><MotionConfig reducedMotion="user"><div ref={ref} className="loan-module" style={{'--loan-gradient-1':`url(#${id}-1)`,'--loan-gradient-2':`url(#${id}-2)`,'--loan-gradient-3':`url(#${id}-3)`} as React.CSSProperties}>
    <svg width="0" height="0" aria-hidden="true" className="loan-module-defs"><defs>{['brand','green','mustard'].map((color,i)=><linearGradient key={color} id={`${id}-${i+1}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={`var(--${color})`} stopOpacity=".24"/><stop offset="100%" stopColor={`var(--${color})`} stopOpacity="0"/></linearGradient>)}</defs></svg>
    <Page title="" header={null}><div className="loan-module-content">{error&&<div role="alert" className="loan-module-error"><p>{error}</p><Button variant="secondary" onClick={()=>window.location.reload()}>Réessayer</Button></div>}{children}</div></Page>
  </div></MotionConfig></VisualContext.Provider>;
}
export function LoanModuleSkeleton({label="Chargement du module Prêts"}:{label?:string}={}){return <div className="loan-module template-page" role="status" aria-label={label}><Skeleton style={{height:36,width:260}}/><div className="loan-module-skeleton-kpis">{[0,1,2,3].map(i=><Card key={i}><Skeleton/><Skeleton style={{height:32,marginTop:16}}/></Card>)}</div><Card><Skeleton style={{height:48}}/></Card><Card><div className="template-stack">{[0,1,2].map(i=><Skeleton key={i} style={{height:52}}/>)}</div></Card></div>;}
