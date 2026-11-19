'use client';

import React from 'react';
import { ModulePageFrame } from '@/components/requests/ModulePageFrame';
import './attendance-module.css';
import './attendance-workspace.css';
import { DEMO_MODE } from '@/lib/demo/config';

/** Screen styles only: printable reports keep their own rendering. */
export function AttendanceModuleFrame({ children, kind = 'list', error }: {
  children: React.ReactNode;
  kind?: 'list' | 'detail' | 'dashboard';
  error?: string;
}) {
  return <div className="attendance-module-page" onClickCapture={e=>{
    if(!DEMO_MODE)return;
    const control=(e.target as Element).closest('button,a');
    if(control&&/export|imprim|\bpdf\b|excel/i.test([control.textContent,control.getAttribute('title'),control.getAttribute('aria-label')].join(' '))){e.preventDefault();e.stopPropagation();window.alert('Les documents et exports officiels ne sont pas disponibles dans la démonstration.');}
  }}><ModulePageFrame kind={kind} error={error}>{DEMO_MODE&&<aside className="attendance-demo-notice"><strong>Mode démo · Novembre 2026</strong><p>Présences fictives des 12 et 13 novembre. Les autres jours ne sont pas renseignés. Consultation des shifts et des équipements ; les écritures, scans et exports officiels nécessitent le backend.</p><a href="/ecran">Aperçu écran QR</a><a href="/kiosk">Aperçu tablette</a></aside>}{children}</ModulePageFrame></div>;
}
