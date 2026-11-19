'use client';
import React from 'react';
import { usePathname } from 'next/navigation';

/** Historical decorations survive only in deferred zones. */
export function RootAppearance() {
  const path = usePathname() || '';
  if (!/^\/(admin|cabinet|portefeuille)(\/|$)/.test(path)) return null;
  return <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none" aria-hidden="true">
    <div className="absolute inset-0 bg-slate-50 dark:opacity-0 transition-opacity duration-700"><div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-blue-100/40 rounded-full blur-[100px] mix-blend-multiply" /><div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-indigo-100/40 rounded-full blur-[100px] mix-blend-multiply" /></div>
    <div className="absolute inset-0 opacity-0 dark:opacity-100 transition-opacity duration-700"><div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-sky-600/10 rounded-full blur-[120px] animate-aurora-1" /><div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-indigo-600/10 rounded-full blur-[120px] animate-aurora-2" /></div>
  </div>;
}
