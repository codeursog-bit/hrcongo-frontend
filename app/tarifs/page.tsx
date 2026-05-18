'use client';

import React from 'react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

type Feature = {
  label: string;
  included: boolean | 'partial';
  note?: string;
};

type Plan = {
  id: string;
  name: string;
  tagline: string;
  price: number | null; // null = sur devis
  priceNote: string;
  employees: string;
  users: string;
  color: string;
  accent: string;
  textAccent: string;
  popular?: boolean;
  cta: string;
  ctaHref: string;
  features: Feature[];
};

// ─── Données plans ────────────────────────────────────────────────────────────

const plans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'Pour tester sans risque',
    price: 0,
    priceNote: 'Gratuit pour toujours',
    employees: '1 admin + 2 employés',
    users: '1 utilisateur (admin)',
    color: 'rgba(255,255,255,0.04)',
    accent: 'rgba(148,163,184,0.3)',
    textAccent: '#94A3B8',
    cta: 'Démarrer gratuitement',
    ctaHref: '/auth/register',
    features: [
      { label: 'Gestion de 2 employés', included: true },
      { label: 'Fiche employé complète', included: true },
      { label: 'Congés & absences basiques', included: true },
      { label: 'Tableau de bord RH', included: true },
      { label: 'Calcul de paie (IRPP/CNSS)', included: false },
      { label: 'Bulletins de salaire PDF', included: false },
      { label: 'Pointage GPS', included: false },
      { label: 'Gestion des contrats', included: false },
      { label: 'Rupture de contrat (STC)', included: false },
      { label: 'Gestion des impayés', included: false },
      { label: 'Système de shifts / plannings', included: false },
      { label: 'Recrutement & offres', included: false },
      { label: 'Prêts & avances', included: false },
      { label: 'Déclarations CNSS', included: false },
      { label: 'Support', included: true, note: 'Communauté' },
    ],
  },
  {
    id: 'business',
    name: 'Business',
    tagline: 'La paie professionnelle',
    price: 20000,
    priceNote: "par mois · jusqu'à 30 employés",
    employees: "Jusqu'à 30 employés",
    users: "Admin + tous vos employés",
    color: 'rgba(56,189,248,0.05)',
    accent: 'rgba(6,182,212,0.4)',
    textAccent: '#06B6D4',
    cta: 'Essai 14 jours gratuit',
    ctaHref: '/auth/register?plan=business',
    features: [
      { label: 'Gestion jusqu\'à 30 employés', included: true },
      { label: 'Fiche employé complète', included: true },
      { label: 'Congés & absences avancés', included: true },
      { label: 'Tableau de bord RH', included: true },
      { label: 'Calcul de paie (IRPP/CNSS/TUS)', included: true },
      { label: 'Bulletins de salaire PDF', included: true },
      { label: 'Pointage GPS', included: true },
      { label: 'Gestion des contrats', included: true },
      { label: 'Rupture de contrat (STC)', included: false },
      { label: 'Gestion des impayés', included: false },
      { label: 'Système de shifts / plannings', included: false },
      { label: 'Recrutement & offres', included: 'partial', note: 'Manuel uniquement' },
      { label: 'Prêts & avances', included: true },
      { label: 'Déclarations CNSS', included: false },
      { label: 'Support', included: true, note: 'Email sous 48h' },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'RH complète & conformité totale',
    price: 40000,
    priceNote: "par mois · jusqu'à 100 employés",
    employees: "Jusqu'à 100 employés",
    users: "Admin + tous vos employés",
    color: 'rgba(6,182,212,0.07)',
    accent: 'rgba(6,182,212,0.7)',
    textAccent: '#06B6D4',
    popular: true,
    cta: 'Essai 14 jours gratuit',
    ctaHref: '/auth/register?plan=pro',
    features: [
      { label: 'Gestion jusqu\'à 100 employés', included: true },
      { label: 'Fiche employé complète', included: true },
      { label: 'Congés & absences avancés', included: true },
      { label: 'Tableau de bord RH', included: true },
      { label: 'Calcul de paie (IRPP/CNSS/TUS)', included: true },
      { label: 'Bulletins de salaire PDF', included: true },
      { label: 'Pointage GPS multi-sites', included: true },
      { label: 'Gestion des contrats', included: true },
      { label: 'Rupture de contrat (STC)', included: true },
      { label: 'Gestion des impayés', included: true },
      { label: 'Système de shifts / plannings', included: true },
      { label: 'Recrutement & scoring IA', included: true },
      { label: 'Prêts & avances', included: true },
      { label: 'Déclarations CNSS export', included: true },
      { label: 'Support', included: true, note: 'Prioritaire sous 24h' },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Sur mesure pour grandes structures',
    price: null,
    priceNote: 'Tarif négocié selon vos besoins',
    employees: '100+ employés · illimité',
    users: 'Utilisateurs illimités',
    color: 'rgba(139,92,246,0.05)',
    accent: 'rgba(139,92,246,0.4)',
    textAccent: '#A78BFA',
    cta: 'Nous contacter',
    ctaHref: '/contact',
    features: [
      { label: 'Employés illimités', included: true },
      { label: 'Fiche employé complète', included: true },
      { label: 'Congés & absences avancés', included: true },
      { label: 'Tableau de bord RH', included: true },
      { label: 'Calcul de paie (IRPP/CNSS/TUS)', included: true },
      { label: 'Bulletins de salaire PDF', included: true },
      { label: 'Pointage GPS multi-sites', included: true },
      { label: 'Gestion des contrats', included: true },
      { label: 'Rupture de contrat (STC)', included: true },
      { label: 'Gestion des impayés', included: true },
      { label: 'Système de shifts / plannings', included: true },
      { label: 'Recrutement & scoring IA', included: true },
      { label: 'Prêts & avances', included: true },
      { label: 'Déclarations CNSS export', included: true },
      { label: 'Support', included: true, note: 'Gestionnaire dédié 24/7' },
    ],
  },
];

// ─── Icônes inline ────────────────────────────────────────────────────────────

function IconCheck({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="11" fill={color} fillOpacity="0.15" />
      <path d="M7 12.5l3.5 3.5 6.5-7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconPartial() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="11" fill="#F59E0B" fillOpacity="0.15" />
      <path d="M8 12h8" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconX() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="11" fill="rgba(148,163,184,0.08)" />
      <path d="M9 9l6 6M15 9l-6 6" stroke="rgba(100,116,139,0.5)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ─── Carte plan ───────────────────────────────────────────────────────────────

function PlanCard({ plan, annual }: { plan: Plan; annual: boolean }) {
  const monthlyPrice = plan.price;
  const displayPrice = monthlyPrice !== null
    ? annual ? Math.round(monthlyPrice * 0.85) : monthlyPrice
    : null;

  return (
    <div
      style={{
        background: plan.color,
        border: plan.popular
          ? `2px solid ${plan.accent}`
          : '1px solid rgba(255,255,255,0.08)',
        borderRadius: 20,
        padding: '28px 24px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 20px 60px -10px ${plan.accent}40`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
      }}
    >
      {/* Badge populaire */}
      {plan.popular && (
        <div style={{
          position: 'absolute',
          top: -14,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #06B6D4, #3B82F6)',
          color: '#fff',
          fontSize: 11,
          fontWeight: 700,
          padding: '4px 16px',
          borderRadius: 20,
          letterSpacing: '0.06em',
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 16px rgba(6,182,212,0.4)',
        }}>
          ⭐ RECOMMANDÉ
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{
          display: 'inline-block',
          fontSize: 11,
          fontWeight: 700,
          color: plan.textAccent,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: 8,
          padding: '3px 10px',
          background: `${plan.textAccent}18`,
          borderRadius: 6,
        }}>
          {plan.name}
        </div>
        <p style={{ color: '#64748B', fontSize: 13, margin: '4px 0 16px', lineHeight: 1.4 }}>
          {plan.tagline}
        </p>

        {/* Prix */}
        {displayPrice !== null ? (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{
              fontSize: 42,
              fontWeight: 800,
              color: '#fff',
              letterSpacing: '-0.04em',
              fontFamily: "'DM Sans', system-ui, sans-serif",
              lineHeight: 1,
            }}>
              {displayPrice.toLocaleString('fr-FR')}
            </span>
            <span style={{ color: '#64748B', fontSize: 14 }}>XAF/mois</span>
          </div>
        ) : (
          <div style={{
            fontSize: 28,
            fontWeight: 800,
            color: plan.textAccent,
            fontFamily: "'DM Sans', system-ui, sans-serif",
            lineHeight: 1,
          }}>
            Sur devis
          </div>
        )}

        {annual && displayPrice !== null && displayPrice > 0 && (
          <div style={{
            display: 'inline-block',
            marginTop: 6,
            fontSize: 11,
            color: '#10B981',
            background: 'rgba(16,185,129,0.1)',
            padding: '2px 8px',
            borderRadius: 4,
          }}>
            −15% paiement annuel
          </div>
        )}

        <p style={{ color: '#475569', fontSize: 12, marginTop: 8, lineHeight: 1.5 }}>
          {plan.priceNote}
        </p>
      </div>

      {/* Employés / Users */}
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 10,
        padding: '10px 14px',
        marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke={plan.textAccent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ color: '#CBD5E1', fontSize: 12, fontWeight: 500 }}>{plan.employees}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke={plan.textAccent} strokeWidth="1.5" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={plan.textAccent} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span style={{ color: '#64748B', fontSize: 12 }}>{plan.users}</span>
        </div>
      </div>

      {/* Features */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 24 }}>
        {plan.features.map((f, i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            opacity: f.included === false ? 0.4 : 1,
          }}>
            {f.included === true
              ? <IconCheck color={plan.textAccent} />
              : f.included === 'partial'
              ? <IconPartial />
              : <IconX />
            }
            <span style={{
              fontSize: 13,
              color: f.included === false ? '#475569' : '#CBD5E1',
              flex: 1,
            }}>
              {f.label}
              {f.note && (
                <span style={{
                  marginLeft: 6,
                  fontSize: 11,
                  color: f.included === true ? plan.textAccent : '#64748B',
                  background: f.included === true ? `${plan.textAccent}15` : 'rgba(255,255,255,0.04)',
                  padding: '1px 6px',
                  borderRadius: 4,
                }}>
                  {f.note}
                </span>
              )}
            </span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <Link
        href={plan.ctaHref}
        style={{
          display: 'block',
          textAlign: 'center',
          padding: '13px 20px',
          borderRadius: 12,
          fontSize: 14,
          fontWeight: 700,
          textDecoration: 'none',
          transition: 'all 0.2s ease',
          ...(plan.popular
            ? {
                background: 'linear-gradient(135deg, #06B6D4, #3B82F6)',
                color: '#fff',
                boxShadow: '0 0 30px rgba(6,182,212,0.35)',
              }
            : plan.id === 'enterprise'
            ? {
                background: 'rgba(139,92,246,0.15)',
                color: '#A78BFA',
                border: '1px solid rgba(139,92,246,0.3)',
              }
            : plan.id === 'starter'
            ? {
                background: 'rgba(255,255,255,0.07)',
                color: '#94A3B8',
                border: '1px solid rgba(255,255,255,0.1)',
              }
            : {
                background: 'rgba(6,182,212,0.12)',
                color: '#06B6D4',
                border: '1px solid rgba(6,182,212,0.25)',
              }
          ),
        }}
        onMouseEnter={e => {
          if (!plan.popular) {
            (e.currentTarget as HTMLAnchorElement).style.opacity = '0.85';
            (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1.02)';
          } else {
            (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1.03)';
          }
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLAnchorElement).style.opacity = '1';
          (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1)';
        }}
      >
        {plan.cta}
        {plan.id !== 'enterprise' && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: 6, verticalAlign: 'middle' }}>
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        )}
      </Link>
    </div>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const faqs = [
  {
    q: 'Combien coûte un employé supplémentaire au-delà de 30 (plan Business) ?',
    a: "Le plan Business est conçu jusqu'à 30 employés. Au-delà, vous passez automatiquement au plan Pro (40 000 XAF/mois) qui couvre jusqu'à 100 employés. Nous vous prévenons avant tout changement.",
  },
  {
    q: 'Qu\'est-ce que la gestion des impayés inclut ?',
    a: 'Le module impayés (plan Pro) détecte automatiquement les bulletins générés mais non payés, calcule les jours de retard, envoie des alertes progressives (info → avertissement → urgent) et vous permet de marquer les paiements partiels ou complets.',
  },
  {
    q: 'La rupture de contrat génère-t-elle le solde de tout compte ?',
    a: "Oui. Le module (plan Pro & Enterprise) calcule automatiquement l'indemnité de licenciement, l'indemnité compensatrice de préavis, les congés non pris, et génère le document de solde de tout compte conforme au Code du Travail Congo.",
  },
  {
    q: 'Comment fonctionne le système de shifts ?',
    a: 'Vous créez des shifts (Matin, Soir, Nuit, Garde…) avec leurs horaires, puis les assignez aux employés par date précise ou par planning récurrent (lundi→vendredi). Le pointage GPS se cale automatiquement sur le shift assigné.',
  },
  {
    q: 'Peut-on payer par Mobile Money ?',
    a: 'Oui, nous acceptons MTN Mobile Money et Airtel Money. Le paiement par virement bancaire est aussi disponible pour les plans annuels et Enterprise.',
  },
  {
    q: 'Le plan Starter est-il vraiment gratuit pour toujours ?',
    a: "Oui. Le Starter reste gratuit sans limite de temps pour 1 admin et 2 employés. C'est votre chance de tester l'outil sans engagement. Quand vous grandissez, vous passez au Business en un clic.",
  },
];

function FAQ() {
  const [open, setOpen] = React.useState<number | null>(null);
  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      {faqs.map((f, i) => (
        <div
          key={i}
          style={{
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            overflow: 'hidden',
          }}
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            style={{
              width: '100%',
              background: 'none',
              border: 'none',
              textAlign: 'left',
              padding: '20px 0',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <span style={{ color: '#E2E8F0', fontSize: 15, fontWeight: 500, lineHeight: 1.4 }}>
              {f.q}
            </span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#06B6D4"
              strokeWidth="2"
              style={{
                flexShrink: 0,
                transform: open === i ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.25s ease',
              }}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          <div style={{
            maxHeight: open === i ? 200 : 0,
            overflow: 'hidden',
            transition: 'max-height 0.3s ease',
          }}>
            <p style={{
              color: '#64748B',
              fontSize: 14,
              lineHeight: 1.7,
              paddingBottom: 20,
              margin: 0,
            }}>
              {f.a}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function PricingPage() {
  const [annual, setAnnual] = React.useState(false);

  return (
    <main style={{
      minHeight: '100vh',
      background: '#050816',
      fontFamily: "'DM Sans', system-ui, sans-serif",
      paddingTop: 80,
    }}>

      {/* ── Hero ── */}
      <section style={{ textAlign: 'center', padding: '64px 24px 48px', position: 'relative' }}>
        {/* Glow décoratif */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 600,
          height: 300,
          background: 'radial-gradient(ellipse, rgba(6,182,212,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          display: 'inline-block',
          fontSize: 12,
          fontWeight: 700,
          color: '#06B6D4',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: 20,
          padding: '6px 16px',
          background: 'rgba(6,182,212,0.1)',
          borderRadius: 20,
          border: '1px solid rgba(6,182,212,0.2)',
        }}>
          Tarifs simples & transparents
        </div>

        <h1 style={{
          fontSize: 'clamp(32px, 6vw, 58px)',
          fontWeight: 800,
          color: '#fff',
          letterSpacing: '-0.04em',
          lineHeight: 1.1,
          marginBottom: 16,
        }}>
          Choisissez votre plan<br />
          <span style={{
            background: 'linear-gradient(135deg, #06B6D4, #3B82F6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            HRCongo
          </span>
        </h1>

        <p style={{
          color: '#64748B',
          fontSize: 18,
          maxWidth: 520,
          margin: '0 auto 36px',
          lineHeight: 1.6,
        }}>
          Paie conforme Congo, pointage GPS, recrutement IA — tout en un.
          Payez uniquement pour ce que vous utilisez.
        </p>

        {/* Toggle mensuel / annuel */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 14,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 50,
          padding: '6px 6px 6px 18px',
        }}>
          <span style={{ color: annual ? '#475569' : '#E2E8F0', fontSize: 14, fontWeight: 500, transition: 'color 0.2s' }}>
            Mensuel
          </span>
          <button
            onClick={() => setAnnual(!annual)}
            style={{
              width: 48,
              height: 26,
              background: annual ? 'linear-gradient(135deg, #06B6D4, #3B82F6)' : 'rgba(255,255,255,0.1)',
              borderRadius: 13,
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background 0.3s ease',
              flexShrink: 0,
            }}
            aria-label="Basculer paiement annuel"
          >
            <div style={{
              position: 'absolute',
              top: 3,
              left: annual ? 25 : 3,
              width: 20,
              height: 20,
              background: '#fff',
              borderRadius: '50%',
              transition: 'left 0.3s ease',
              boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
            }} />
          </button>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            paddingRight: 12,
          }}>
            <span style={{ color: annual ? '#E2E8F0' : '#475569', fontSize: 14, fontWeight: 500, transition: 'color 0.2s' }}>
              Annuel
            </span>
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#10B981',
              background: 'rgba(16,185,129,0.12)',
              padding: '2px 8px',
              borderRadius: 10,
              opacity: annual ? 1 : 0.5,
              transition: 'opacity 0.2s',
            }}>
              −15%
            </span>
          </div>
        </div>
      </section>

      {/* ── Grille des plans ── */}
      <section style={{ padding: '0 24px 80px', maxWidth: 1320, margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20,
          alignItems: 'start',
        }}>
          {plans.map(plan => (
            <PlanCard key={plan.id} plan={plan} annual={annual} />
          ))}
        </div>

        {/* Note 14 jours */}
        <p style={{
          textAlign: 'center',
          color: '#334155',
          fontSize: 14,
          marginTop: 28,
        }}>
          14 jours d'essai gratuit sur tous les plans payants · Sans carte bancaire · Résiliation sans engagement
        </p>
      </section>

      {/* ── Comparaison modules clés ── */}
      <section style={{
        padding: '64px 24px',
        background: 'rgba(255,255,255,0.02)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{
            textAlign: 'center',
            fontSize: 28,
            fontWeight: 800,
            color: '#fff',
            letterSpacing: '-0.03em',
            marginBottom: 8,
          }}>
            Comparaison des modules avancés
          </h2>
          <p style={{ textAlign: 'center', color: '#64748B', fontSize: 14, marginBottom: 40 }}>
            Les fonctionnalités qui font la différence au quotidien
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: '#475569', fontWeight: 500, fontSize: 12, borderBottom: '1px solid rgba(255,255,255,0.06)', minWidth: 200 }}>
                    Fonctionnalité
                  </th>
                  {['Starter', 'Business', 'Pro', 'Enterprise'].map((n, i) => (
                    <th key={n} style={{
                      textAlign: 'center',
                      padding: '12px 16px',
                      color: i === 2 ? '#06B6D4' : '#64748B',
                      fontWeight: i === 2 ? 700 : 500,
                      fontSize: 12,
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      {n}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Calcul paie IRPP/CNSS/TUS', false, true, true, true],
                  ['Bulletins PDF', false, true, true, true],
                  ['Pointage GPS', false, true, true, true],
                  ['Pointage GPS multi-sites', false, false, true, true],
                  ['Gestion des contrats', false, true, true, true],
                  ['Rupture de contrat & STC', false, false, true, true],
                  ['Gestion des impayés', false, false, true, true],
                  ['Shifts & plannings', false, false, true, true],
                  ['Recrutement IA + scoring CV', false, 'partial', true, true],
                  ['Prêts & avances', false, true, true, true],
                  ['Déclarations CNSS export', false, false, true, true],
                  ['Convention collective auto', false, false, true, true],
                  ['Performance & OKR', false, false, true, true],
                  ['Formation & onboarding', false, false, true, true],
                  ['Plan social (PSE)', false, false, false, true],
                  ['API & intégrations', false, false, false, true],
                ].map(([label, ...cols], ri) => (
                  <tr key={ri} style={{ background: ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                    <td style={{ padding: '11px 16px', color: '#94A3B8', fontSize: 13 }}>{label}</td>
                    {cols.map((c, ci) => (
                      <td key={ci} style={{ textAlign: 'center', padding: '11px 16px' }}>
                        {c === true
                          ? <span style={{ color: ci === 2 ? '#06B6D4' : '#10B981', fontSize: 16 }}>✓</span>
                          : c === 'partial'
                          ? <span style={{ color: '#F59E0B', fontSize: 11 }}>Manuel</span>
                          : <span style={{ color: 'rgba(100,116,139,0.3)', fontSize: 14 }}>–</span>
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Bloc Enterprise / Devis ── */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{
          maxWidth: 860,
          margin: '0 auto',
          background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(6,182,212,0.08))',
          border: '1px solid rgba(139,92,246,0.2)',
          borderRadius: 24,
          padding: 'clamp(32px, 5vw, 56px)',
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: 32,
          alignItems: 'center',
        }}
        className="enterprise-bloc"
        >
          <div>
            <div style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#A78BFA',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: 12,
            }}>
              Enterprise & grandes structures
            </div>
            <h3 style={{
              fontSize: 26,
              fontWeight: 800,
              color: '#fff',
              letterSpacing: '-0.03em',
              marginBottom: 12,
            }}>
              Plus de 100 employés ?<br />Parlons-en directement.
            </h3>
            <p style={{ color: '#64748B', fontSize: 14, lineHeight: 1.7, marginBottom: 0 }}>
              Groupes, hôtels, banques, ONG, sociétés minières — nous adaptons la plateforme à votre structure,
              vos conventions collectives, vos sites GPS et votre volume de bulletins.
              Tarif négocié, contrat annuel, gestionnaire dédié.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0 }}>
            <Link href="/contact" style={{
              display: 'block',
              textAlign: 'center',
              padding: '14px 28px',
              background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 700,
              whiteSpace: 'nowrap',
              boxShadow: '0 8px 30px rgba(124,58,237,0.3)',
            }}>
              Demander un devis
            </Link>
            <a href="tel:+242053079107" style={{
              display: 'block',
              textAlign: 'center',
              padding: '12px 28px',
              background: 'rgba(255,255,255,0.05)',
              color: '#94A3B8',
              textDecoration: 'none',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 500,
              border: '1px solid rgba(255,255,255,0.08)',
              whiteSpace: 'nowrap',
            }}>
              📞 +242 06 413 36 93
            </a>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: '0 24px 80px' }}>
        <h2 style={{
          textAlign: 'center',
          fontSize: 28,
          fontWeight: 800,
          color: '#fff',
          letterSpacing: '-0.03em',
          marginBottom: 48,
        }}>
          Questions fréquentes
        </h2>
        <FAQ />
      </section>

      {/* ── CTA final ── */}
      <section style={{
        padding: '64px 24px 96px',
        textAlign: 'center',
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}>
        <h2 style={{
          fontSize: 'clamp(24px, 4vw, 38px)',
          fontWeight: 800,
          color: '#fff',
          letterSpacing: '-0.03em',
          marginBottom: 12,
        }}>
          Prêt à moderniser vos RH ?
        </h2>
        <p style={{ color: '#64748B', fontSize: 16, marginBottom: 32 }}>
          Commencez gratuitement. Aucune carte bancaire requise.
        </p>
        <Link href="/auth/register" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '15px 36px',
          background: 'linear-gradient(135deg, #06B6D4, #3B82F6)',
          color: '#fff',
          textDecoration: 'none',
          borderRadius: 14,
          fontSize: 16,
          fontWeight: 700,
          boxShadow: '0 0 40px rgba(6,182,212,0.35)',
        }}>
          Démarrer gratuitement
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </section>

      <style>{`
        @media (max-width: 768px) {
          .enterprise-bloc {
            grid-template-columns: 1fr !important;
          }
        }
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&display=swap');
      `}</style>
    </main>
  );
}