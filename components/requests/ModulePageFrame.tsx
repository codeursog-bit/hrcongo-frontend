'use client';
import React from 'react';
import { LoanModuleFrame, LoanModuleSkeleton } from '@/components/loans/LoanModuleFrame';
import './module-page.css';
export { useLoanVisuals as useModuleVisuals } from '@/components/loans/LoanModuleFrame';
export { useLoanPageVisuals as useModulePageVisuals } from '@/components/loans/LoanModuleFrame';

/** Reuse the established templates and token-based screen styles for request modules. */
export function ModulePageFrame({children,kind='list',error}:{children:React.ReactNode;kind?:'list'|'detail'|'dashboard';error?:string}){
  return <div className="request-module-page"><LoanModuleFrame kind={kind} error={error}>{children}</LoanModuleFrame></div>;
}
export function ModulePageSkeleton({label='Chargement des congés'}:{label?:string}={}){return <LoanModuleSkeleton label={label} />;}
