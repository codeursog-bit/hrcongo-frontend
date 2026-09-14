'use client';

import Link from 'next/link';

export function CTA() {
  return (
    <section className="relative overflow-hidden bg-[#050607] px-6 py-28">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#D4A548]/[0.08] blur-[110px]" />

      <div className="relative mx-auto flex max-w-lg flex-col items-center text-center">
        <h2 className="text-[30px] font-semibold tracking-[-0.02em] text-[#FAFAFA] sm:text-[36px]">
          Configurez votre première paie en 10 minutes.
        </h2>
        <p className="mt-4 text-[16px] text-[#8B8F98]">
          Aucune carte bancaire requise pour commencer l'essai.
        </p>
        <Link
          href="/auth/register"
          className="mt-8 rounded-lg border border-[#D4A548]/40 bg-[#D4A548]/10 px-7 py-3 text-[15px] font-medium text-[#D4A548] transition-all hover:border-[#D4A548]/70 hover:bg-[#D4A548]/15"
        >
          Essayer gratuitement
        </Link>
      </div>
    </section>
  );
}