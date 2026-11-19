'use client';
import React, { useEffect, useRef, useState } from 'react';

export function ToastCountdown({ duration, expiresAt, paused=false }: { duration:number; expiresAt?:number; paused?:boolean }) {
  const initial=Math.max(0,expiresAt === undefined ? duration : expiresAt-Date.now());
  const remaining=useRef(initial);
  const [left,setLeft]=useState(initial);
  useEffect(() => {
    if(paused)return;
    const deadline=expiresAt ?? Date.now()+remaining.current;
    const tick=()=>{const value=Math.max(0,deadline-Date.now());remaining.current=value;setLeft(value);};
    tick();
    const timer=setInterval(tick,100);
    return ()=>{clearInterval(timer);remaining.current=Math.max(0,deadline-Date.now());};
  },[paused,expiresAt]);
  const progress=Math.max(0,Math.min(1,left/duration));
  return <div className="feedback-lifetime" aria-live="off"><div className="feedback-progress" role="progressbar" aria-label="Temps restant avant fermeture" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress*100)}><span style={{transform:`scaleX(${progress})`}} /></div><span className="feedback-seconds">{paused?'En pause':`${Math.ceil(left/1000)} s`}</span></div>;
}
