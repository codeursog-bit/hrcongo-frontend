'use client';

// ============================================================================
// 📁 components/SlideOver.tsx
// ✅ Panneau latéral générique (overlay + animation) réutilisé par les
//    sidebars de détail (employé du jour, département) dans le module
//    Présences. Pas de logique métier ici — juste la coquille.
// ============================================================================

import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { FeedbackVariants } from '@/components/ui/Feedback';
import { LegacySlideOver } from '@/components/providers/legacy-feedback';
import '@/components/ui/feedback.css';

function DetailPanel({
  open, onClose, title, subtitle, children, widthClass = 'max-w-md',
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  widthClass?: string;
}) {
  const dialog=useRef<HTMLDialogElement>(null);
  const titleId=useId();
  const close=useRef(onClose); close.current=onClose;
  useEffect(() => {
    const el=dialog.current;
    if (!open || !el) return;
    const previous=document.activeElement as HTMLElement|null;
    el.showModal();
    return () => { el.close(); if(previous?.isConnected)previous.focus(); };
  },[open]);
  return <dialog ref={dialog} className={`feedback-detail-panel ${widthClass}`} aria-labelledby={titleId} onCancel={event=>{event.preventDefault();close.current();}} onClick={event=>{
    if(event.target!==event.currentTarget)return;
    const rect=event.currentTarget.getBoundingClientRect();
    if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)close.current();
  }}>
    <header><div><h2 id={titleId}>{title}</h2>{subtitle&&<p>{subtitle}</p>}</div><button type="button" className="shell-icon-btn" onClick={onClose} aria-label="Fermer le détail"><X size={19} strokeWidth={1.5}/></button></header>
    <div className="feedback-detail-body">{children}</div>
  </dialog>;
}

export default function SlideOver(props:React.ComponentProps<typeof DetailPanel>) {
  return <FeedbackVariants legacy={<LegacySlideOver {...props}/>}><DetailPanel {...props}/></FeedbackVariants>;
}
