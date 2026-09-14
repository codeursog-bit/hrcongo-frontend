// ============================================================================
// 📁 components/auth/AuthShell.tsx
// Coquille commune à toutes les pages d'authentification.
// Reprend fidèlement les codes visuels de la landing (app/page.tsx) :
// fond #050607, halos discrets, grille 48px à 5%, logo, typographie.
// ============================================================================
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { GRID_BG_STYLE } from './tokens';

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen min-h-[100dvh] w-full flex-col items-center overflow-x-hidden bg-[#050607] font-sans text-[#FAFAFA]">
      {/* Halos — identiques à la landing (Hero + FinalCta) */}
      <div className="pointer-events-none fixed -right-40 -top-40 -z-10 h-[600px] w-[600px] rounded-full bg-white/[0.04] blur-[130px]" />
      <div className="pointer-events-none fixed -left-40 bottom-0 -z-10 h-[500px] w-[500px] rounded-full bg-[#10B981]/[0.06] blur-[130px]" />

      {/* Grille discrète */}
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-[0.05]" style={GRID_BG_STYLE} />

      {/* Nav minimale */}
      <div className="flex w-full max-w-6xl items-center justify-between px-6 py-6 sm:px-8">
        <Link href="/" className="flex items-center" aria-label="Konza RH — Accueil">
          <Image
            src="/logos/konza_logo_h_color.png"
            alt="Konza RH"
            width={132}
            height={38}
            className="h-8 w-auto object-contain sm:h-9"
            priority
          />
        </Link>
        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-[13px] text-[#8B8F98] transition-colors hover:border-white/20 hover:text-[#FAFAFA]"
        >
          <ArrowLeft size={13} />
          Accueil
        </Link>
      </div>

      {/* Contenu centré */}
      <div className="relative z-10 flex w-full flex-1 flex-col items-center justify-center px-6 pb-16 pt-6 sm:pt-10">
        {children}
      </div>
    </div>
  );
}

export function AuthCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`w-full rounded-2xl border border-white/[0.08] bg-[#0B0C0F] p-7 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.6)] sm:p-9 ${className}`}
    >
      {children}
    </div>
  );
}

export function AuthHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
}) {
  return (
    <div className="mb-7 text-center">
      {eyebrow && (
        <div className="mx-auto mb-4 w-fit rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-[12px] text-[#8B8F98]">
          {eyebrow}
        </div>
      )}
      <h1 className="text-[26px] font-semibold leading-[1.15] tracking-[-0.02em] text-[#FAFAFA] sm:text-[30px]">
        {title}
      </h1>
      {description && <p className="mt-2 text-[14px] leading-relaxed text-[#8B8F98]">{description}</p>}
    </div>
  );
}