'use client';
import React, { useLayoutEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { DEMO_MODE, isDeferredRoute } from '@/lib/demo/config';
import { demoUser } from '@/lib/demo/employees';
import { installDemoTransport } from '@/lib/demo/transport';

const backup = 'konza:demo:previous-user';
export function DemoProvider({ children }: { children: React.ReactNode }) {
  const path = usePathname() || '';
  const active = DEMO_MODE && !isDeferredRoute(path);
  const [readyFor, setReadyFor] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  useLayoutEffect(() => {
    try {
    if (!active) {
      const saved = sessionStorage.getItem(backup);
      if (saved !== null) { if (saved) localStorage.setItem('user', saved); else localStorage.removeItem('user'); sessionStorage.removeItem(backup); }
      setReadyFor(false); return;
    }
    const storedRole = sessionStorage.getItem('konza:demo:role'); const role = storedRole === 'EMPLOYEE' ? 'EMPLOYEE' : 'ADMIN';
    if (sessionStorage.getItem(backup) === null) sessionStorage.setItem(backup, localStorage.getItem('user') || '');
    localStorage.setItem('user', JSON.stringify(demoUser(role)));
    const uninstall = installDemoTransport(role); setReadyFor(true);
    return () => { uninstall(); };
    } catch {
      if (active) setError('Le mode démo nécessite le stockage local du navigateur.');
      setReadyFor(false);
    }
  }, [active]);
  // Mount consumers only after transport and display-session initialization.
  if (active && error) return <div role="alert" style={{ padding: 32 }}>{error}</div>;
  if (DEMO_MODE && readyFor !== active) return null;
  return <>{children}</>;
}
export function DemoBadge() {
  if (!DEMO_MODE) return null;
  return <div className="shell-demo-badge"><span>Mode démo</span><label>Vue <select aria-label="Vue de démonstration" defaultValue={typeof window !== 'undefined' ? sessionStorage.getItem('konza:demo:role') || 'ADMIN' : 'ADMIN'} onChange={e => { sessionStorage.setItem('konza:demo:role', e.target.value); window.location.reload(); }}><option value="ADMIN">Admin / RH</option><option value="EMPLOYEE">Employé</option></select></label></div>;
}
