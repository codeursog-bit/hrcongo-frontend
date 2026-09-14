'use client';

import Link from 'next/link';

function IconZap() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}
function IconClock() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function IconShield() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function StatCard({ value, label, icon }: { value: string; label: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-white/[0.08] bg-[#0B0C0F] px-6 py-7 text-center">
      <div className="mb-1 text-[#8B8F98]">{icon}</div>
      <div className="font-mono text-3xl font-medium tracking-[-0.02em] text-[#FAFAFA]">
        {value}
      </div>
      <div className="text-[13px] text-[#8B8F98]">{label}</div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#050607] px-6 pb-20 pt-32">
      {/* Glow — un seul accent, restreint au fond */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-white/[0.04] blur-[130px]" />
        <div className="absolute -left-40 bottom-0 h-[500px] w-[500px] rounded-full bg-[#D4A548]/[0.06] blur-[130px]" />
      </div>
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative z-10 w-full max-w-3xl text-center">
        {/* Badge */}
        <div className="mx-auto mb-7 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-[13px] text-[#8B8F98]">
          <span className="text-[#D4A548]">
            <IconZap />
          </span>
          Conforme CGI Congo · Fiscalité 2025–2026
        </div>

        {/* H1 — même texte, sans dégradé arc-en-ciel : un seul poids, plus sobre */}
        <h1 className="text-[40px] font-semibold leading-[1.08] tracking-[-0.03em] text-[#FAFAFA] sm:text-[64px]">
          Gérez votre paie
          <br />
          sans erreur, sans stress.
        </h1>

        <p className="mx-auto mt-6 max-w-[600px] text-[18px] leading-relaxed text-[#8B8F98]">
          Konza RH automatise la paie, les congés, le pointage GPS et le
          recrutement —{' '}
          <strong className="font-semibold text-[#FAFAFA]">
            100% conforme au Code Général des Impôts congolais.
          </strong>
          <br />
          La seule solution RH conçue pour les entreprises du
          Congo-Brazzaville.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/auth/register"
            className="flex items-center gap-2 rounded-xl bg-[#FAFAFA] px-8 py-4 text-[16px] font-medium text-black transition-colors hover:bg-white"
          >
            Démarrer gratuitement
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-7 py-4 text-[16px] font-medium text-[#FAFAFA] transition-colors hover:border-white/20 hover:bg-white/[0.06]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
            Voir la démo
          </button>
        </div>

        {/* Stats */}
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard value="< 3 min" label="500 bulletins générés" icon={<IconClock />} />
          <StatCard value="100%" label="Conformité CNSS & IRPP" icon={<IconShield />} />
          <StatCard value="24 / 7" label="Support en français" icon={<IconZap />} />
        </div>
      </div>

      {/* Aperçu produit */}
      <div className="relative z-10 mx-auto mt-16 w-full max-w-4xl">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0B0C0F] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.6)]">
          <div className="flex h-10 items-center gap-2 border-b border-white/[0.06] px-4">
            <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
          </div>
          <div className="relative h-[420px] overflow-hidden sm:h-[500px]">
            {/* Remplacez par votre vraie capture : /screenshots/dashboard-konza.png */}
            <img
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1400&q=80"
              alt="Dashboard Konza RH — aperçu"
              className="h-full w-full object-cover brightness-[0.5] saturate-[0.7]"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#050607]/60" />

            <div className="absolute right-6 top-6 rounded-xl border border-white/10 bg-[#0B0C0F]/90 px-4 py-3.5 backdrop-blur-md">
              <div className="mb-1 text-[11px] text-[#8B8F98]">Paie du mois</div>
              <div className="font-mono text-xl font-medium text-[#FAFAFA]">
                47,3M <span className="text-[12px] text-[#D4A548]">FCFA</span>
              </div>
              <div className="mt-1 text-[11px] text-emerald-400">
                ↑ 312 bulletins générés
              </div>
            </div>

            <div className="absolute bottom-6 left-6 rounded-xl border border-emerald-500/20 bg-[#0B0C0F]/90 px-4 py-3.5 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-[12px] font-medium text-emerald-400">
                  Conformité validée
                </span>
              </div>
              <div className="mt-1 text-[11px] text-[#8B8F98]">
                CNSS · IRPP/ITS · CGI 2025
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}