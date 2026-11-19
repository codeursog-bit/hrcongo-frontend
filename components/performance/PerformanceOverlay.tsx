'use client';
import React, { useEffect, useRef } from 'react';
import './performance.css';

/** Coquille uniquement : contenu, validations et commandes restent dans les formulaires. */
export function PerformanceOverlay({ children, onClose }: { children:React.ReactNode; onClose:()=>void; className?:string; initial?:unknown; animate?:unknown; exit?:unknown; transition?:unknown }) {
  const dialog=useRef<HTMLDialogElement>(null);
  const close=useRef(onClose);close.current=onClose;
  useEffect(()=>{
    const el=dialog.current;if(!el)return;
    const previous=document.activeElement as HTMLElement|null;
    const heading=el.querySelector('h2,h3');
    if(heading){if(!heading.id)heading.id=`performance-dialog-${Math.random().toString(36).slice(2)}`;el.setAttribute('aria-labelledby',heading.id);}
    el.showModal();
    return()=>{el.close();if(previous?.isConnected)previous.focus();};
  },[]);
  return <dialog ref={dialog} className="performance-overlay performance-workspace" aria-label="Fenêtre performance" onCancel={event=>{event.preventDefault();close.current();}} onClick={event=>{
    if(event.target!==event.currentTarget)return;
    const rect=event.currentTarget.getBoundingClientRect();
    if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)close.current();
  }}><div className="performance-dialog-container">{children}</div></dialog>;
}
