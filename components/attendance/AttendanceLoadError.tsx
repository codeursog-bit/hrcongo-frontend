'use client';
import React from 'react';
export function AttendanceLoadError({message,retry}:{message:string;retry:()=>void}) {
  if(!message)return null;
  return <div className="attendance-load-error" role="alert"><p>{message}</p><button type="button" onClick={retry}>Réessayer</button></div>;
}
