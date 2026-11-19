'use client';
import React, { useEffect, useRef } from 'react';

/** Retains each existing form/header; adds native focus, Escape and backdrop. */
export function AttendanceDialog({children,title,onClose,busy=false}:{children:React.ReactNode;title:string;onClose:()=>void;busy?:boolean}) {
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const dialog=ref.current,previous=document.activeElement as HTMLElement|null;dialog?.showModal();return()=>{dialog?.close();previous?.focus();};},[]);
  return <dialog ref={ref} aria-label={title} className="attendance-dialog" onCancel={e=>{e.preventDefault();if(!busy)onClose();}} onClick={e=>{
    if(busy||e.target!==e.currentTarget)return;
    const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)onClose();
  }}>{children}</dialog>;
}
