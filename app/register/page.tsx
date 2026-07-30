'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Redirige /register?ref=XXX → /auth/register?ref=XXX
// Ce fichier existe uniquement pour que le lien affilié fonctionne
// sans changer l'URL générée par le backend.

function RedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get('ref');
    const target = ref ? `/auth/register?ref=${ref}` : '/auth/register';
    router.replace(target);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function RegisterRedirectPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#020617]" />}>
      <RedirectInner />
    </Suspense>
  );
}