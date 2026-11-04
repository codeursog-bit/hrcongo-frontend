'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/services/api';
import { CabinetAccess, canAccessCabinetPath } from '@/lib/cabinet-access';

const Context = createContext<CabinetAccess | null>(null);
export const useCabinetAccess = () => useContext(Context);

export default function CabinetAccessProvider({ children }: { children: React.ReactNode }) {
  const { cabinetId } = useParams<{ cabinetId: string }>();
  const pathname = usePathname();
  const [access, setAccess] = useState<CabinetAccess | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const load = () => api.get<CabinetAccess>(`/cabinet/${cabinetId}/access`)
      .then(value => { if (!cancelled) { setAccess(value); setError(''); } })
      .catch((e: Error) => { if (!cancelled) { setAccess(null); setError(e.message || 'Accès au cabinet refusé'); } });
    void load();
    window.addEventListener('focus', load);
    return () => { cancelled = true; window.removeEventListener('focus', load); };
  }, [cabinetId, retry]);
  const allowed = access?.cabinetId === cabinetId && canAccessCabinetPath(access.role, pathname, cabinetId);
  if (error || (access?.cabinetId === cabinetId && !allowed)) return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md space-y-4"><h1 className="text-xl font-semibold">Accès non autorisé</h1>
        <p>{error || 'Cette page est réservée aux administrateurs du cabinet.'}</p>
        {access ? <Link className="text-cyan-400 block" href={`/cabinet/${cabinetId}/dashboard`}>Retour au cabinet</Link> : <Link className="text-cyan-400 block" href="/auth/login">Retour à la connexion</Link>}
        <button className="border rounded px-3 py-2" onClick={() => { setError(''); setRetry(x => x + 1); }}>Réessayer</button>
      </div>
    </div>
  );
  if (!allowed) return <div className="min-h-screen bg-slate-950 text-slate-100 p-8" role="status">Vérification des accès au cabinet…</div>;
  return <Context.Provider value={access}>{children}</Context.Provider>;
}
