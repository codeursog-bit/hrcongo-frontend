'use client';

// ============================================================================
// 📁 app/tarifs/TarifsClient.tsx
// Même esprit que l'accueil : fond sombre, un seul accent orange, pas d'effets.
// Les offres, les prix et les fonctionnalités viennent du catalogue
// (usePlans + buildPublicPlans) : rien n'est écrit en dur dans les cartes,
// et le tableau de comparaison est construit à partir de ces mêmes données,
// donc il ne peut pas se contredire.
// ============================================================================

import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { usePlans } from '@/hooks/useSubscription';
import { buildPublicPlans, publicPlanAmount, type PublicPricingPlan as Plan } from '@/lib/public-pricing';

const ACCENT = '#FF9A62';
const PHONE_DISPLAY = '+242 06 413 36 93';
const PHONE_HREF = 'tel:+242064133693';
const MAX_HIGHLIGHTS = 7; // fonctionnalités listées dans une carte (le reste est dans le tableau)

function IconCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  );
}

function IconArrow() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

// ─── Carte d'une offre ───────────────────────────────────────────────────────
function PlanCard({ plan, annual, withTable }: { plan: Plan; annual: boolean; withTable: boolean }) {
  const price = publicPlanAmount(plan, annual);
  const included = plan.features.filter((f) => f.included === true);
  const shown = included.slice(0, MAX_HIGHLIGHTS);
  const rest = included.length - shown.length;

  return (
    <div
      className={`relative flex flex-col rounded-2xl border bg-[#0c0c0d] p-7 transition-colors ${
        plan.popular ? 'border-[#FF9A62]' : 'border-white/[0.08] hover:border-white/[0.18]'
      }`}
    >
      {plan.popular && (
        <span className="absolute -top-3 left-7 rounded-full bg-[#FF9A62] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-black">
          Recommandé
        </span>
      )}

      <h3 className="text-[18px] font-semibold text-[#F2F2F2]">{plan.name}</h3>
      <p className="mt-2 text-[13.5px] leading-snug text-[#9a9a9a] xl:min-h-[110px]">{plan.tagline}</p>

      <div className="mt-6">
        {price !== null ? (
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-[38px] font-bold leading-none tracking-[-0.03em] text-[#F2F2F2]">
              {price.toLocaleString('fr-FR')}
            </span>
            <span className="text-[14px] text-[#9a9a9a]">
              {plan.currency} / {annual ? 'an' : 'mois'}
            </span>
          </div>
        ) : (
          <div className="text-[28px] font-bold leading-none text-[#F2F2F2]">Sur devis</div>
        )}
        <p className="mt-2 text-[12.5px] text-[#6f6f6f]">{plan.priceNote}</p>
      </div>

      {/* Le nom de l'offre est déjà le palier d'effectif (« Jusqu’à 25 employés ») : on ne le répète pas */}
      <div className="my-6 space-y-1.5 border-y border-white/[0.08] py-4 text-[13.5px]">
        {plan.employees !== plan.name && <div className="text-[#d6d6d6]">{plan.employees}</div>}
        <div className="text-[#d6d6d6]">{plan.users}</div>
      </div>

      <ul className="mb-6 flex flex-1 flex-col gap-2.5">
        {shown.map((f) => (
          <li key={f.label} className="flex items-start gap-2.5 text-[13.5px] leading-snug text-[#d6d6d6]">
            <IconCheck />
            {f.label}
          </li>
        ))}
        {rest > 0 && withTable && (
          <li className="pl-[26px] text-[13px]">
            <a href="#comparaison" className="text-[#9a9a9a] underline-offset-4 hover:text-[#F2F2F2] hover:underline">
              + {rest} autre{rest > 1 ? 's' : ''} dans la comparaison
            </a>
          </li>
        )}
      </ul>

      <Link
        href={plan.ctaHref}
        className={`flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-[14px] font-semibold transition-colors ${
          plan.popular
            ? 'bg-[#FAFAFA] text-black hover:bg-white'
            : 'border border-white/10 text-[#F2F2F2] hover:border-white/25 hover:bg-white/[0.04]'
        }`}
      >
        {plan.cta}
        {plan.id !== 'enterprise' && <IconArrow />}
      </Link>
    </div>
  );
}

// ─── Tableau de comparaison (construit à partir du catalogue) ───────────────
function ComparisonTable({ plans }: { plans: Plan[] }) {
  // Lignes = fonctionnalités oui/non. Les limites chiffrées (« 5 prêts / mois »,
  // « illimités ») varient d'une offre à l'autre : elles restent dans les cartes.
  const rows = React.useMemo(() => {
    const labels: string[] = [];
    plans.forEach((p) =>
      p.features.forEach((f) => {
        if (!/\d|illimité/i.test(f.label) && !labels.includes(f.label)) labels.push(f.label);
      }),
    );
    return labels;
  }, [plans]);

  if (rows.length === 0) return null;

  return (
    <section id="comparaison" className="border-t border-white/[0.06] px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-[30px] font-semibold tracking-[-0.02em] text-[#F2F2F2] sm:text-[36px]">
          Comparer les offres
        </h2>
        <p className="mt-3 text-[16px] text-[#9a9a9a]">Toutes les fonctionnalités, offre par offre.</p>

        <div className="mt-10 overflow-x-auto rounded-2xl border border-white/[0.08]">
          <table className="w-full min-w-[640px] border-collapse text-[14px]">
            <thead>
              <tr className="border-b border-white/[0.08] bg-[#0c0c0d]">
                <th className="px-5 py-4 text-left text-[13px] font-medium text-[#6f6f6f]">Fonctionnalité</th>
                {plans.map((p) => (
                  <th
                    key={p.id}
                    className="px-4 py-4 text-center text-[13px] font-semibold"
                    style={{ color: p.popular ? ACCENT : '#d6d6d6' }}
                  >
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((label) => (
                <tr key={label} className="border-b border-white/[0.05] last:border-0">
                  <td className="px-5 py-3 text-[#d6d6d6]">{label}</td>
                  {plans.map((p) => {
                    const on = p.features.find((f) => f.label === label)?.included === true;
                    return (
                      <td key={p.id} className="px-4 py-3 text-center">
                        {on ? (
                          <span aria-label="Inclus" className="font-semibold" style={{ color: ACCENT }}>✓</span>
                        ) : (
                          <span aria-label="Non inclus" className="text-white/20">–</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: 'Que se passe-t-il si mon entreprise dépasse la limite de son offre ?',
    a: 'Chaque offre correspond à un nombre maximum d’employés actifs. Si votre effectif dépasse ce palier, passez à l’offre supérieure ou contactez-nous pour étudier vos besoins.',
  },
  {
    q: 'Comment fonctionne l’essai gratuit ?',
    a: 'Chaque nouveau compte bénéficie de 30 jours d’essai gratuit, sans carte bancaire, avec l’accès de l’offre Pro. À la fin de l’essai, vous choisissez l’offre adaptée à votre effectif.',
  },
  {
    q: 'Quelle offre choisir ?',
    a: 'Le nom de chaque offre indique l’effectif maximum : jusqu’à 25, 50 ou 100 employés, et plus de 100 employés. Prenez celle qui couvre votre effectif actuel avec un peu de marge. Le tableau de comparaison détaille ce que chaque offre inclut.',
  },
  {
    q: 'La rupture de contrat génère-t-elle le solde de tout compte ?',
    a: 'Oui. Konza RH calcule l’indemnité de licenciement, l’indemnité compensatrice de préavis et les congés non pris, puis génère le document de solde de tout compte selon le Code du Travail du Congo.',
  },
  {
    q: 'Comment fonctionne le système de shifts ?',
    a: 'Vous créez des shifts (Matin, Soir, Nuit, Garde…) avec leurs horaires, puis vous les assignez aux employés par date précise ou par planning récurrent (lundi au vendredi). Le pointage GPS se cale automatiquement sur le shift assigné.',
  },
  {
    q: 'Peut-on payer par Mobile Money ?',
    a: 'Oui, nous acceptons MTN Mobile Money et Airtel Money. Le virement bancaire est aussi disponible pour les plans annuels et Enterprise.',
  },
];

function FaqList() {
  const [open, setOpen] = React.useState<number | null>(null);
  return (
    <div className="mx-auto max-w-3xl">
      {FAQS.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={f.q} className="border-t border-white/10 last:border-b">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 py-5 text-left"
            >
              <span className="text-[16px] font-medium leading-snug text-[#F2F2F2]">{f.q}</span>
              <svg
                width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2.5"
                className={`shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`}
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
            {isOpen && <p className="pb-6 pr-8 text-[14.5px] leading-relaxed text-[#9a9a9a]">{f.a}</p>}
          </div>
        );
      })}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function PricingPage() {
  const [annual, setAnnual] = React.useState(false);
  const { plans: catalog, isLoading, error, refetch } = usePlans();
  const plans = buildPublicPlans(catalog || {});

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050607] font-sans text-[#F2F2F2]">
      <Navbar />

      {/* ── Titre ── */}
      <section className="relative px-6 pb-12 pt-36 text-center">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(55% 60% at 50% 0%, rgba(247,135,75,.12), transparent 70%)' }}
        />
        <div className="relative mx-auto max-w-2xl">
          <div className="mb-4 text-[13px] font-semibold uppercase tracking-[0.12em]" style={{ color: ACCENT }}>
            Tarifs
          </div>
          <h1 className="text-[38px] font-bold leading-[1.08] tracking-[-0.03em] sm:text-[54px]">
            Des tarifs simples et <span style={{ color: ACCENT }}>transparents</span>
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-[18px] leading-relaxed text-[#9a9a9a]">
            Paie, pointage GPS, congés et recrutement dans un seul outil. Choisissez l’offre qui correspond à votre
            effectif.
          </p>

          {/* Mensuel / annuel */}
          <div
            role="group"
            aria-label="Période de facturation"
            className="mt-9 inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1"
          >
            {[
              { label: 'Mensuel', value: false },
              { label: 'Annuel', value: true },
            ].map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => setAnnual(opt.value)}
                aria-pressed={annual === opt.value}
                className={`rounded-full px-6 py-2 text-[14px] font-medium transition-colors ${
                  annual === opt.value ? 'bg-[#FAFAFA] text-black' : 'text-[#9a9a9a] hover:text-[#F2F2F2]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Offres ── */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        {isLoading && (
          <p role="status" className="text-center text-[#9a9a9a]">Chargement des tarifs…</p>
        )}
        {error && (
          <div role="alert" className="text-center text-[#9a9a9a]">
            Les tarifs sont momentanément indisponibles.{' '}
            <button type="button" onClick={() => refetch()} className="underline underline-offset-4 hover:text-[#F2F2F2]">
              Réessayer
            </button>
          </div>
        )}
        {!isLoading && !error && (
          <div className="grid items-stretch gap-5 pt-3 sm:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} annual={annual} withTable={plans.length > 1} />
            ))}
          </div>
        )}
        <p className="mt-8 text-center text-[14px] text-[#6f6f6f]">
          30 jours d’essai gratuit · Sans carte bancaire · Résiliation sans engagement
        </p>
      </section>

      {!isLoading && !error && plans.length > 1 && <ComparisonTable plans={plans} />}

      {/* ── Sur devis ── */}
      <section className="border-t border-white/[0.06] px-6 py-20">
        <div className="mx-auto grid max-w-4xl gap-8 rounded-2xl border border-white/[0.08] bg-[#0c0c0d] p-8 sm:p-12 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="mb-3 text-[13px] font-semibold uppercase tracking-[0.12em]" style={{ color: ACCENT }}>
              Besoin spécifique
            </div>
            <h3 className="text-[26px] font-semibold leading-tight tracking-[-0.02em] sm:text-[30px]">
              Sur devis. Parlons de vos besoins.
            </h3>
            <p className="mt-3 max-w-md text-[14.5px] leading-relaxed text-[#9a9a9a]">
              Une étude personnalisée selon vos besoins et votre effectif. Le devis est établi par notre équipe ;
              aucun tarif personnalisé n’est appliqué sans validation.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Link
              href="/contact"
              className="whitespace-nowrap rounded-xl bg-[#FAFAFA] px-7 py-3.5 text-center text-[14px] font-semibold text-black transition-colors hover:bg-white"
            >
              Demander un devis
            </Link>
            <a
              href={PHONE_HREF}
              className="whitespace-nowrap rounded-xl border border-white/10 px-7 py-3 text-center text-[14px] font-medium text-[#d6d6d6] transition-colors hover:border-white/25 hover:bg-white/[0.04]"
            >
              {PHONE_DISPLAY}
            </a>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="border-t border-white/[0.06] px-6 py-20">
        <h2 className="mb-12 text-center text-[30px] font-semibold tracking-[-0.02em] sm:text-[36px]">
          Questions fréquentes
        </h2>
        <FaqList />
      </section>

      {/* ── Appel final ── */}
      <section className="border-t border-white/[0.06] px-6 py-24 text-center">
        <h2 className="text-[30px] font-bold tracking-[-0.025em] sm:text-[42px]">
          Prêt à moderniser vos <span style={{ color: ACCENT }}>RH</span> ?
        </h2>
        <p className="mx-auto mt-4 max-w-md text-[17px] text-[#9a9a9a]">
          Commencez gratuitement. Aucune carte bancaire requise.
        </p>
        <Link
          href="/auth/register"
          className="mt-9 inline-flex items-center gap-2.5 rounded-xl bg-[#FAFAFA] px-9 py-4 text-[16px] font-semibold text-black transition-colors hover:bg-white"
        >
          Démarrer gratuitement <IconArrow />
        </Link>
      </section>

      <Footer />
    </main>
  );
}