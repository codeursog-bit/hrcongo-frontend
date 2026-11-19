'use client';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, MotionConfig, useReducedMotion } from 'framer-motion';
import { AlertTriangle, Info, X, XCircle } from 'lucide-react';
import { SuccessMark } from '@/components/design-system/feedback';
import '@/components/design-system/design-system.css';
import './feedback.css';
import { ToastCountdown } from './ToastCountdown';

export type FeedbackTone = 'success' | 'error' | 'warning' | 'info';
export function FeedbackVariants({ legacy, children }: { legacy:React.ReactNode; children:React.ReactNode }) {
  const path = usePathname() || '';
  return /^\/(admin|cabinet)(\/|$)/.test(path) ? <>{legacy}</> : <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

/** Les piles d’un même coin partagent un hôte : elles restent dans le flux. */
export function FeedbackViewport({ children, position='top', label='Notifications' }: { children:React.ReactNode; position?:'top'|'bottom'|'reminder'; label?:string }) {
  const [host,setHost] = useState<HTMLElement|null>(null);
  const corner = position === 'reminder' ? 'bottom' : position;
  useEffect(() => {
    const id=`konza-feedback-${corner}`;
    let element=document.getElementById(id);
    if (!element) { element=document.createElement('div'); element.id=id; element.className=`feedback-viewport feedback-viewport-${corner}`; document.body.appendChild(element); }
    element.dataset.users=String(Number(element.dataset.users||0)+1);
    setHost(element);
    return () => { const count=Number(element.dataset.users||1)-1; element.dataset.users=String(count); if(!count)element.remove(); };
  },[corner]);
  return host ? createPortal(<div className="feedback-slot" aria-label={label}><AnimatePresence initial={false}>{children}</AnimatePresence></div>,host) : null;
}

export function FeedbackToast({ tone='info', title, message, icon, onClose, children, time, duration, expiresAt }: { tone?:FeedbackTone; title:string; message?:string; icon?:React.ReactNode; onClose:()=>void; children?:React.ReactNode; time?:string; duration?:number; expiresAt?:number }) {
  const reduced=useReducedMotion();
  const Icon=tone==='error'?XCircle:tone==='warning'?AlertTriangle:Info;
  return <motion.div initial={reduced?false:{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:.16}} className={`k-toast feedback-toast k-tone-${tone==='error'?'danger':tone}`} role={tone==='error'?'alert':'status'}>
    <div className="feedback-icon" aria-hidden="true">{icon||(tone==='success'?<SuccessMark/>:<Icon size={21} strokeWidth={1.5}/>)}</div>
    <div className="feedback-content"><strong>{title}</strong>{time&&<span className="feedback-time">{time}</span>}{message&&<p>{message}</p>}</div>
    <button type="button" onClick={onClose} aria-label={`Fermer : ${title}`} className="shell-icon-btn feedback-close"><X size={16} strokeWidth={1.5}/></button>
    {children&&<div className="feedback-actions">{children}</div>}
    {duration !== undefined && duration > 0 && <ToastCountdown duration={duration} expiresAt={expiresAt} />}
  </motion.div>;
}
