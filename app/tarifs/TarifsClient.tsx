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
import { PublicSite, PublicClosing } from '@/components/landing/PublicSite';
import s from '@/components/landing/PublicSite.module.css';
import p from './pricing.module.css';
import { usePlans } from '@/hooks/useSubscription';
import { DEMO_MODE } from '@/lib/demo/config';
import {
  buildPublicPlans,
  publicPlanAmount,
  type PublicPricingPlan as Plan,
} from '@/lib/public-pricing';

const ACCENT = 'var(--action)';
const PHONE_DISPLAY = '+242 06 413 36 93';
const PHONE_HREF = 'tel:+242064133693';
const MAX_HIGHLIGHTS = 7; // fonctionnalités listées dans une carte (le reste est dans le tableau)

function IconCheck() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke={ACCENT}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-0.5 shrink-0"
    >
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  );
}

function IconArrow() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

// ─── Carte d'une offre ───────────────────────────────────────────────────────
function PlanCard({
  plan,
  annual,
  withTable,
}: {
  plan: Plan;
  annual: boolean;
  withTable: boolean;
}) {
  const price = publicPlanAmount(plan, annual);
  const included = plan.features.filter((f) => f.included === true);
  const highlightPriority = (label: string) =>
    ['Déclarations CNSS', 'Déclarations DAS', 'Bulletins annuels'].includes(label) ? 0 : label.endsWith('/ mois') ? 1 : 2;
  const shown = [...included].sort((a, b) => highlightPriority(a.label) - highlightPriority(b.label)).slice(0, MAX_HIGHLIGHTS);
  const rest = included.length - shown.length;

  return (
    <div className={[p.planCard, plan.popular ? p.popular : ''].join(' ')}>
      {plan.popular && <span className={p.recommended}>Recommandé</span>}

      <h3 className="text-[18px] font-semibold text-[var(--text)]">{plan.name}</h3>
      <p className={p.tagline}>{plan.tagline}</p>

      <div className={p.price}>
        {price !== null ? (
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-[38px] font-bold leading-none tracking-[-0.03em] text-[var(--text)]">
              {price.toLocaleString('fr-FR')}
            </span>
            <span className="text-[14px] text-[var(--text-secondary)]">
              {plan.currency} / {annual ? 'an' : 'mois'}
            </span>
          </div>
        ) : (
          <div className="text-[23px] font-semibold leading-snug text-[var(--text)]">
            {DEMO_MODE ? 'Tarif indisponible en démo' : 'Tarif à confirmer'}
          </div>
        )}
        <p className="mt-2 text-[12.5px] text-[var(--text-secondary)]">
          {DEMO_MODE && price === null ? 'Prix définis par le superadmin dans le catalogue réel.' : plan.priceNote}
        </p>
      </div>

      {/* Le nom de l'offre est déjà le palier d'effectif (« Jusqu’à 25 employés ») : on ne le répète pas */}
      <div className="my-6 space-y-1.5 border-y border-[var(--border)] py-4 text-[13.5px]">
        {plan.employees !== plan.name && (
          <div className="text-[var(--text-secondary)]">{plan.employees}</div>
        )}
        <div className="text-[var(--text-secondary)]">{plan.users}</div>
      </div>

      <ul className="mb-6 flex flex-1 flex-col gap-2.5">
        {shown.map((f) => (
          <li
            key={f.label}
            className="flex items-start gap-2.5 text-[13.5px] leading-snug text-[var(--text-secondary)]"
          >
            <IconCheck />
            {f.label}
          </li>
        ))}
        {rest > 0 && withTable && (
          <li className="pl-[26px] text-[13px]">
            <a
              href="#comparaison"
              className="text-[var(--text-secondary)] underline-offset-4 hover:text-[var(--text)] hover:underline"
            >
              + {rest} autre{rest > 1 ? 's' : ''} dans la comparaison
            </a>
          </li>
        )}
      </ul>

      <Link
        href={plan.ctaHref}
        className={`flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-[14px] font-semibold transition-colors ${
          plan.popular
            ? 'bg-[var(--text)] text-[var(--surface)] hover:bg-[var(--action)]'
            : 'border border-[var(--border)] text-[var(--text)] hover:border-[var(--border)] hover:bg-[var(--surface-2)]'
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
    <section id="comparaison" className="border-t border-[var(--border)] px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-[30px] font-semibold tracking-[-0.02em] text-[var(--text)] sm:text-[36px]">
          Comparer les offres
        </h2>
        <p className="mt-3 text-[16px] text-[var(--text-secondary)]">
          Toutes les fonctionnalités, offre par offre.
        </p>

        <div
          className="mt-10 overflow-x-auto rounded-xl bg-[var(--surface)]"
          tabIndex={0}
          role="region"
          aria-label="Tableau comparatif des offres"
        >
          <table className="w-full min-w-[640px] border-collapse text-[14px]">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface)]">
                <th className="px-5 py-4 text-left text-[13px] font-medium text-[var(--text-secondary)]">
                  Fonctionnalité
                </th>
                {plans.map((p) => (
                  <th
                    key={p.id}
                    className="px-4 py-4 text-center text-[13px] font-semibold"
                    style={{ color: p.popular ? ACCENT : 'var(--text-secondary)' }}
                  >
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((label) => (
                <tr key={label} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-5 py-3 text-[var(--text-secondary)]">{label}</td>
                  {plans.map((p) => {
                    const on = p.features.find((f) => f.label === label)?.included === true;
                    return (
                      <td key={p.id} className="px-4 py-3 text-center">
                        {on ? (
                          <span
                            aria-label="Inclus"
                            className="font-semibold"
                            style={{ color: ACCENT }}
                          >
                            ✓
                          </span>
                        ) : (
                          <span aria-label="Non inclus" className="text-[var(--text-secondary)]">
                            –
                          </span>
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
    a: 'L’accès aux alertes et à la génération des documents dépend de votre offre. Contactez notre équipe pour vérifier le parcours disponible pour votre entreprise.',
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
          <div key={f.q} className="border-t border-[var(--border)] last:border-b">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 py-5 text-left"
            >
              <span className="text-[16px] font-medium leading-snug text-[var(--text)]">{f.q}</span>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke={ACCENT}
                strokeWidth="2.5"
                className={`shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`}
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
            {isOpen && (
              <p className="pb-6 pr-8 text-[14.5px] leading-relaxed text-[var(--text-secondary)]">
                {f.a}
              </p>
            )}
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
    <PublicSite>
      <header className={[s.container, s.pageHeader].join(' ')}>
        <p className={s.eyebrow}>Tarifs et abonnements</p>
        <div className={s.heroGrid}>
          <h1 className={s.title}>
            Une offre à la taille
            <br />
            de votre entreprise.
          </h1>
          <div>
            <p className={s.intro}>
              Quatre plans : jusqu’à 25, 50 ou 100 employés, puis plus de 100 employés.
              Comparez les fonctionnalités pour choisir votre offre. Pour un besoin spécifique,
              une proposition sur devis est disponible séparément.
            </p>
            {/* Mensuel / annuel */}
            <div
              role="group"
              aria-label="Période de facturation"
              className="mt-9 inline-flex rounded-full border border-[var(--border)] bg-[var(--surface-2)] p-1"
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
                    annual === opt.value
                      ? 'bg-[var(--text)] text-[var(--surface)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* ── Offres ── */}
      <section className={[s.container, p.offers].join(' ')}>
        <p className="mb-6 text-sm text-[var(--text-secondary)]">
          {DEMO_MODE ? 'Mode démo : les fonctionnalités et quotas suivent les plans du serveur ; les prix ne sont pas affichés.' : 'Les prix mensuels et annuels ci-dessous proviennent du catalogue Konza.'}
        </p>
        {isLoading && (
          <p role="status" className="text-center text-[var(--text-secondary)]">
            Chargement des tarifs…
          </p>
        )}
        {error && (
          <div role="alert" className="text-center text-[var(--text-secondary)]">
            Les tarifs sont momentanément indisponibles.{' '}
            <button
              type="button"
              onClick={() => refetch()}
              className="underline underline-offset-4 hover:text-[var(--text)]"
            >
              Réessayer
            </button>
          </div>
        )}
        {!isLoading && !error && (
          <div className={p.plans}>
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} annual={annual} withTable={plans.length > 1} />
            ))}
          </div>
        )}
        <p className="mt-8 text-center text-[14px] text-[var(--text-secondary)]">
          30 jours d’essai gratuit · Sans carte bancaire · Résiliation sans engagement
        </p>
      </section>

      {!isLoading && !error && plans.length > 1 && <ComparisonTable plans={plans} />}

      {/* ── Sur devis ── */}
      <section className="border-t border-[var(--border)] px-6 py-20">
        <div className="mx-auto grid max-w-4xl gap-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 sm:p-12 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div
              className="mb-3 text-[13px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: ACCENT }}
            >
              Besoin spécifique
            </div>
            <h3 className="text-[26px] font-semibold leading-tight tracking-[-0.02em] sm:text-[30px]">
              Sur devis. Parlons de vos besoins.
            </h3>
            <p className="mt-3 max-w-md text-[14.5px] leading-relaxed text-[var(--text-secondary)]">
              Une étude personnalisée selon vos besoins et votre effectif. Le devis est établi par
              notre équipe ; aucun tarif personnalisé n’est appliqué sans validation.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Link
              href="/contact"
              className="whitespace-nowrap rounded-xl bg-[var(--text)] px-7 py-3.5 text-center text-[14px] font-semibold text-[var(--surface)] transition-colors hover:bg-[var(--action)]"
            >
              Demander un devis
            </Link>
            <a
              href={PHONE_HREF}
              className="whitespace-nowrap rounded-xl border border-[var(--border)] px-7 py-3 text-center text-[14px] font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border)] hover:bg-[var(--surface-2)]"
            >
              {PHONE_DISPLAY}
            </a>
          </div>
        </div>
      </section>

      <section className={[s.container, s.section, s.editorial, s.rule].join(' ')}>
        <div>
          <p className={s.eyebrow}>Avant de choisir</p>
          <h2 className={s.sectionTitle}>
            Les questions
            <br />
            les plus fréquentes.
          </h2>
        </div>
        <FaqList />
      </section>
      <PublicClosing />
    </PublicSite>
  );
}
