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
    const target = ref ? `/auth/register?ref=${encodeURIComponent(ref)}` : '/auth/register';
    router.replace(target);
  }, [router, searchParams]);

  return (
    <div role="status" className="flex min-h-screen items-center justify-center bg-[#050607]">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#FF9A62] border-t-transparent" />
    </div>
  );
}

export default function RegisterRedirectPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050607]" />}>
      <RedirectInner />
    </Suspense>
  );
}