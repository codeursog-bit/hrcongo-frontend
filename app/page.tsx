// ============================================================================
// 📁 app/(landing)/page.tsx  — Konza RH Landing Page (composant unique)
// Dark mode only · Grid background · Design senior & premium
// Navbar et Footer sont importés comme composants séparés
// ============================================================================
'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';

// ─── Palette & tokens ────────────────────────────────────────────────────────
const C = {
  bg:       '#020817',
  bgCard:   '#0A1628',
  bgCardHover: '#0F1E35',
  border:   'rgba(255,255,255,0.07)',
  borderHover: 'rgba(6,182,212,0.4)',
  cyan:     '#06B6D4',
  blue:     '#3B82F6',
  purple:   '#8B5CF6',
  green:    '#10B981',
  orange:   '#F59E0B',
  pink:     '#EC4899',
  text:     '#F8FAFC',
  muted:    '#64748B',
  sub:      '#94A3B8',
};

// ─── Shared styles ────────────────────────────────────────────────────────────
const s = {
  section: {
    padding: '100px 32px',
    maxWidth: 1280,
    margin: '0 auto',
  } as React.CSSProperties,
  label: {
    display: 'inline-flex' as const,
    alignItems: 'center' as const,
    gap: 8,
    padding: '6px 14px',
    background: 'rgba(6,182,212,0.08)',
    border: '1px solid rgba(6,182,212,0.2)',
    borderRadius: 99,
    fontSize: 12,
    fontWeight: 700,
    color: C.cyan,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    marginBottom: 20,
  },
  h2: {
    fontSize: 'clamp(32px,5vw,52px)',
    fontWeight: 900,
    color: C.text,
    lineHeight: 1.1,
    letterSpacing: '-0.03em',
    marginBottom: 16,
    fontFamily: "system-ui, sans-serif",
  },
  p: {
    fontSize: 18,
    color: C.sub,
    lineHeight: 1.7,
    maxWidth: 600,
  },
};

// ─── Grid background SVG ─────────────────────────────────────────────────────
function GridBg() {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 0,
      pointerEvents: 'none',
      backgroundImage: `
        linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
      `,
      backgroundSize: '44px 44px',
    }} />
  );
}

// ─── Glow blob ───────────────────────────────────────────────────────────────
function Blob({ color, style }: { color: string; style: React.CSSProperties }) {
  return (
    <div style={{
      position: 'absolute',
      borderRadius: '50%',
      filter: 'blur(120px)',
      opacity: 0.12,
      pointerEvents: 'none',
      background: color,
      ...style,
    }} />
  );
}

// ─── Feature card ─────────────────────────────────────────────────────────────
// ─── Stat card ───────────────────────────────────────────────────────────────
function StatCard({ value, label, icon }: { value: string; label: string; icon: React.ReactNode }) {
  return (
    <div style={{
      background: C.bgCard,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: '28px 24px',
      textAlign: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    }}>
      <div style={{ color: C.cyan, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 36, fontWeight: 900, color: C.text, letterSpacing: '-0.04em', lineHeight: 1, fontFamily: "system-ui, sans-serif" }}>{value}</div>
      <div style={{ fontSize: 13, color: C.muted, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

// ─── Pricing card ─────────────────────────────────────────────────────────────
function PricingCard({
  name, price, sub, features, popular, cta, priceUnit
}: {
  name: string; price: string; sub: string; features: string[]; popular?: boolean; cta: string; priceUnit?: string;
}) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: popular
          ? 'linear-gradient(160deg, rgba(6,182,212,0.12) 0%, rgba(59,130,246,0.08) 100%)'
          : (hover ? C.bgCardHover : C.bgCard),
        border: popular
          ? `2px solid rgba(6,182,212,0.5)`
          : `1px solid ${hover ? C.border : C.border}`,
        borderRadius: 20,
        padding: '36px 28px',
        position: 'relative',
        transform: popular ? 'scale(1.03)' : hover ? 'translateY(-4px)' : 'none',
        transition: 'all 0.25s ease',
        boxShadow: popular ? '0 0 60px rgba(6,182,212,0.12)' : 'none',
      }}
    >
      {popular && (
        <div style={{
          position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg,#06B6D4,#3B82F6)',
          color: '#fff', fontSize: 11, fontWeight: 800, padding: '4px 16px',
          borderRadius: 99, letterSpacing: '0.08em', textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}>★ Plus populaire</div>
      )}

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: popular ? C.cyan : C.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>{name}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
          <span style={{ fontSize: 44, fontWeight: 900, color: C.text, letterSpacing: '-0.04em', lineHeight: 1, fontFamily: "system-ui, sans-serif" }}>{price}</span>
          {priceUnit && <span style={{ fontSize: 15, color: C.muted }}>{priceUnit}</span>}
        </div>
        <p style={{ fontSize: 13, color: C.muted }}>{sub}</p>
      </div>

      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 24, marginBottom: 28 }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {features.map((f, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: C.sub }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 2, color: popular ? C.cyan : C.green }}>
                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {f}
            </li>
          ))}
        </ul>
      </div>

      <Link
        href="/auth/register"
        style={{
          display: 'block',
          textAlign: 'center',
          padding: '13px 20px',
          borderRadius: 12,
          fontWeight: 700,
          fontSize: 14,
          textDecoration: 'none',
          transition: 'all 0.2s',
          background: popular ? 'linear-gradient(135deg,#06B6D4,#3B82F6)' : 'transparent',
          color: popular ? '#fff' : C.sub,
          border: popular ? 'none' : `1px solid ${C.border}`,
          boxShadow: popular ? '0 0 30px rgba(6,182,212,0.25)' : 'none',
        }}
      >
        {cta}
      </Link>
    </div>
  );
}

// ─── Timeline step ─────────────────────────────────────────────────────────────
function TimelineStep({ num, title, desc, last }: { num: string; title: string; desc: string; last?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 24, position: 'relative' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: 'linear-gradient(135deg,#06B6D4,#3B82F6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 900, color: '#fff', flexShrink: 0,
          boxShadow: '0 0 20px rgba(6,182,212,0.3)',
        }}>{num}</div>
        {!last && <div style={{ width: 1, flex: 1, background: 'linear-gradient(to bottom,rgba(6,182,212,0.3),transparent)', minHeight: 48 }} />}
      </div>
      <div style={{ paddingTop: 8, paddingBottom: last ? 0 : 48 }}>
        <h4 style={{ fontSize: 17, fontWeight: 800, color: C.text, marginBottom: 8, fontFamily: "system-ui, sans-serif" }}>{title}</h4>
        <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.65 }}>{desc}</p>
      </div>
    </div>
  );
}

// ─── Testimonial card ─────────────────────────────────────────────────────────
function TestiCard({ quote, name, role, company }: { quote: string; name: string; role: string; company: string }) {
  return (
    <div style={{
      background: C.bgCard,
      border: `1px solid ${C.border}`,
      borderRadius: 16,
      padding: '28px',
    }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {[0,1,2,3,4].map(i => (
          <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#F59E0B"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        ))}
      </div>
      <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.7, marginBottom: 20, fontStyle: 'italic' }}>"{quote}"</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'linear-gradient(135deg,#06B6D4,#3B82F6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 800, color: '#fff',
        }}>{name[0]}</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{name}</div>
          <div style={{ fontSize: 12, color: C.muted }}>{role} · {company}</div>
        </div>
      </div>
    </div>
  );
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const Icon = {
  Payroll: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
  Shield: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Map: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Calendar: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Loan: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  People: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  Clock: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Chart: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  Lock: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
  Cabinet: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  File: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  Zap: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
};

// ─── MAIN LANDING PAGE ────────────────────────────────────────────────────────
export default function LandingPage() {

  // Intersection observer for section reveals
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { (e.target as HTMLElement).style.opacity = '1'; (e.target as HTMLElement).style.transform = 'translateY(0)'; } }),
      { threshold: 0.08 }
    );
    els.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif", color: C.text, overflowX: 'hidden' }}>
      <GridBg />
      <Navbar />

      {/* ═══════════════════════════════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════════════════════════════ */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 32px 80px', zIndex: 1, overflow: 'hidden' }}>
        <Blob color="#06B6D4" style={{ width: 700, height: 700, top: -200, right: -200 }} />
        <Blob color="#8B5CF6" style={{ width: 600, height: 600, bottom: -100, left: -200 }} />

        <div style={{ maxWidth: 900, width: '100%', textAlign: 'center', position: 'relative', zIndex: 2 }}>
          {/* Badge */}
          <div style={{ ...s.label, margin: '0 auto 28px', width: 'fit-content' }}>
            <Icon.Zap />
            Conforme CGI Congo · Fiscalité 2025–2026
          </div>

          {/* H1 */}
          <h1 style={{
            fontSize: 'clamp(40px,7vw,80px)',
            fontWeight: 900,
            lineHeight: 1.05,
            letterSpacing: '-0.04em',
            color: C.text,
            marginBottom: 24,
            fontFamily: "system-ui, sans-serif",
          }}>
            Gérez votre paie<br />
            <span style={{ background: 'linear-gradient(135deg,#06B6D4 0%,#3B82F6 50%,#8B5CF6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>sans erreur, sans stress.</span>
          </h1>

          <p style={{ ...s.p, margin: '0 auto 40px', textAlign: 'center', fontSize: 20 }}>
            Konza RH automatise la paie, les congés, le pointage GPS et le recrutement — 
            <strong style={{ color: C.text }}> 100% conforme au Code Général des Impôts congolais.</strong>
            <br />La seule solution RH conçue pour les entreprises du Congo-Brazzaville.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 64 }}>
            <Link href="/auth/register" style={{
              background: 'linear-gradient(135deg,#06B6D4,#3B82F6)',
              color: '#fff', textDecoration: 'none', fontWeight: 800,
              fontSize: 16, padding: '16px 36px', borderRadius: 14,
              display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 0 50px rgba(6,182,212,0.35)',
              transition: 'all 0.2s',
            }}>
              Démarrer gratuitement
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
            <button style={{
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${C.border}`,
              color: C.text, fontWeight: 700,
              fontSize: 16, padding: '16px 32px', borderRadius: 14,
              display: 'flex', alignItems: 'center', gap: 8,
              cursor: 'pointer', transition: 'all 0.2s', backdropFilter: 'blur(8px)',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              Voir la démo
            </button>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, maxWidth: 640, margin: '0 auto 80px' }} className="hero-stats">
            <StatCard value="< 3 min" label="500 bulletins générés" icon={<Icon.Clock />} />
            <StatCard value="100%" label="Conformité CNSS & IRPP" icon={<Icon.Shield />} />
            <StatCard value="24 / 7" label="Support en français" icon={<Icon.Zap />} />
          </div>

          {/* Dashboard preview placeholder */}
          <div style={{
            width: '100%',
            maxWidth: 1000,
            margin: '0 auto',
            borderRadius: 20,
            border: `1px solid rgba(6,182,212,0.25)`,
            background: C.bgCard,
            overflow: 'hidden',
            boxShadow: '0 40px 120px rgba(6,182,212,0.08), 0 0 0 1px rgba(255,255,255,0.04)',
            position: 'relative',
          }}>
            {/* Window chrome */}
            <div style={{
              height: 40, background: 'rgba(255,255,255,0.03)',
              borderBottom: `1px solid ${C.border}`,
              display: 'flex', alignItems: 'center', padding: '0 16px', gap: 8,
            }}>
              {['#FF5F57','#FFBD2E','#28C840'].map(c => (
                <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
              ))}
              <div style={{ flex: 1, height: 22, background: 'rgba(255,255,255,0.04)', borderRadius: 6, margin: '0 60px' }} />
            </div>

            {/* Dashboard preview — remplacez l'img src par votre capture réelle */}
            {/* Pour utiliser votre vraie capture : remplacez le src ci-dessous par "/screenshots/dashboard-konza.png" */}
            <div style={{
              height: 500,
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Image provisoire — à remplacer par votre vraie capture dashboard */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1400&q=80"
                alt="Dashboard Konza RH — aperçu"
                style={{
                  width: '100%', height: '100%',
                  objectFit: 'cover',
                  filter: 'brightness(0.6) saturate(0.7)',
                  // 👇 Remplacez tout ce bloc <img> par :
                  // <Image src="/screenshots/dashboard-konza.png" alt="Dashboard Konza RH" fill style={{ objectFit: 'cover' }} />
                }}
              />
              {/* Overlay gradient */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(160deg, rgba(6,182,212,0.08) 0%, rgba(5,8,22,0.4) 100%)',
                pointerEvents: 'none',
              }} />

              {/* Floating mini cards on top of screenshot */}
              <div style={{
                position: 'absolute', top: 24, right: 24,
                background: 'rgba(10,22,40,0.92)', border: `1px solid ${C.border}`,
                borderRadius: 12, padding: '14px 18px', backdropFilter: 'blur(12px)',
              }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Paie du mois</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: C.text, fontFamily: "system-ui, sans-serif" }}>47,3M <span style={{ fontSize: 12, color: C.cyan }}>FCFA</span></div>
                <div style={{ fontSize: 11, color: C.green, marginTop: 4 }}>↑ 312 bulletins générés</div>
              </div>
              <div style={{
                position: 'absolute', bottom: 24, left: 24,
                background: 'rgba(10,22,40,0.92)', border: `1px solid rgba(16,185,129,0.3)`,
                borderRadius: 12, padding: '14px 18px', backdropFilter: 'blur(12px)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.green }} />
                  <span style={{ fontSize: 12, color: C.green, fontWeight: 700 }}>Conformité validée</span>
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>CNSS · IRPP/ITS · CGI 2025</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          LOGOS / SOCIAL PROOF
      ═══════════════════════════════════════════════════════════════════════ */}
      <section style={{ ...s.section, padding: '48px 32px', zIndex: 1, position: 'relative', borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: 13, color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 32 }}>
            Déjà utilisé par des entreprises à Pointe-Noire & Brazzaville
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 48, flexWrap: 'wrap' }}>
            {['TOTAL Energies', 'BTP Congo', 'Pharmacie Elite', 'Groupe Bolloré', 'Cabinet Juridique RDC', 'Mining Corp CG'].map(name => (
              <div key={name} style={{
                fontSize: 13, fontWeight: 700, color: 'rgba(100,116,139,0.6)',
                letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap',
              }}>{name}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          FEATURES
      ═══════════════════════════════════════════════════════════════════════ */}
      <FeaturesSection />

      {/* ═══════════════════════════════════════════════════════════════════════
          WHY US — Chiffres + Avantages
      ═══════════════════════════════════════════════════════════════════════ */}
      <section style={{ position: 'relative', zIndex: 1, borderTop: `1px solid ${C.border}`, overflow: 'hidden' }}>
        <Blob color="#06B6D4" style={{ width: 500, height: 500, top: -100, left: '50%' }} />

        <div style={{ ...s.section, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }} className="why-grid">
          {/* Left — text */}
          <div>
            <div style={{ ...s.label, marginBottom: 24 }}>// Pourquoi Konza RH ?</div>
            <h2 style={{ ...s.h2, marginBottom: 24 }}>Conçu pour la réalité<br/>congolaise.</h2>
            <p style={{ ...s.p, marginBottom: 40 }}>
              La plupart des logiciels RH sont faits pour l'Europe ou les États-Unis. Konza RH est le premier — et seul — système conçu nativement pour les spécificités fiscales, sociales et opérationnelles du Congo-Brazzaville.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {[
                { icon: '⚖', title: 'Code du Travail congolais natif', desc: 'Barèmes CNSS, IRPP, TUS, quotient familial — mis à jour à chaque révision légale.' },
                { icon: '🌍', title: 'Fonctionnel sans infrastructure avancée', desc: 'Optimisé pour les connexions 3G/4G locales. Application mobile légère pour le terrain.' },
                { icon: '🔐', title: '2FA & Sécurité enterprise', desc: "Authentification à deux facteurs, sessions sécurisées, audit log complet de chaque action." },
                { icon: '🏢', title: 'Multi-entreprises & Cabinets', desc: "Gérez un groupe d'entreprises ou un portefeuille de clients comptables depuis un seul compte." },
              ].map(({ icon, title, desc }) => (
                <div key={title} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{icon}</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>{title}</div>
                    <div style={{ fontSize: 14, color: C.sub, lineHeight: 1.6 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — stats card */}
          <div style={{
            background: 'linear-gradient(160deg, rgba(6,182,212,0.08) 0%, rgba(59,130,246,0.05) 100%)',
            border: `1px solid rgba(6,182,212,0.2)`,
            borderRadius: 24,
            padding: 40,
          }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 32, textAlign: 'center' }}>En chiffres</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
              {[
                { val: '50+', label: 'Entreprises actives' },
                { val: '2 000+', label: 'Employés gérés' },
                { val: '99 %', label: 'Satisfaction client' },
                { val: '< 3 min', label: 'Pour 500 bulletins' },
              ].map(({ val, label }) => (
                <div key={label} style={{ textAlign: 'center', padding: '20px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 12 }}>
                  <div style={{ fontSize: 32, fontWeight: 900, color: C.text, letterSpacing: '-0.04em', fontFamily: "system-ui, sans-serif" }}>{val}</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 24, textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 8 }}>
                {[0,1,2,3,4].map(i => (
                  <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill={C.orange}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                ))}
              </div>
              <p style={{ fontSize: 13, color: C.sub, fontStyle: 'italic', lineHeight: 1.6 }}>
                "Konza RH nous a économisé 3 jours par mois sur la paie. Les bulletins sont conformes, la DRH est sereine."
              </p>
              <p style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>— Directeur Administratif, groupe industriel à PNR</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          HOW IT WORKS
      ═══════════════════════════════════════════════════════════════════════ */}
      <section style={{ ...s.section, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'start' }} className="how-grid">
          <div>
            <div style={{ ...s.label, marginBottom: 24 }}>// Comment ça marche</div>
            <h2 style={{ ...s.h2, marginBottom: 40 }}>Opérationnel<br/>en moins d'une heure.</h2>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <TimelineStep num="1" title="Créez votre compte gratuitement"
                desc="Saisissez les infos de votre entreprise (RCCM, CNSS, secteur). Nos paramètres fiscaux s'appliquent automatiquement selon votre activité." />
              <TimelineStep num="2" title="Importez vos employés"
                desc="Import Excel en 1 clic ou saisie manuelle. Contrats, salaires de base, primes, parts fiscales — tout est configuré en quelques minutes." />
              <TimelineStep num="3" title="Lancez votre première paie"
                desc="Définissez les variables du mois (absences, heures supp, primes exceptionnelles) et générez tous les bulletins en moins de 3 minutes." />
              <TimelineStep num="4" title="Exportez & distribuez" last
                desc="Bulletins PDF signés électroniquement, export comptable (SAGE, CIEL), déclaration CNSS prête à déposer. Tout est prêt." />
            </div>
          </div>

          {/* Right — visual */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Process visual cards */}
            {[
              { step: 'Configuration', color: C.cyan, desc: 'RCCM · CNSS · Secteur d\'activité · Règles fiscales', status: 'done' },
              { step: 'Employés importés', color: C.blue, desc: '48 employés · 3 départements · Contrats configurés', status: 'done' },
              { step: 'Variables du mois', color: C.purple, desc: '3 absences · 5 heures supp · 2 primes exceptionnelles', status: 'progress' },
              { step: 'Bulletins générés', color: C.green, desc: '48 bulletins PDF · Export SAGE · Déclaration CNSS', status: 'pending' },
            ].map(({ step, color, desc, status }) => (
              <div key={step} style={{
                background: C.bgCard,
                border: `1px solid ${status === 'done' ? color + '30' : C.border}`,
                borderRadius: 14, padding: '18px 20px',
                display: 'flex', alignItems: 'center', gap: 16,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: status === 'done' ? color + '20' : status === 'progress' ? color + '15' : 'rgba(255,255,255,0.04)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  color: status === 'done' ? color : status === 'progress' ? color : C.muted,
                }}>
                  {status === 'done'
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                    : status === 'progress'
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: status === 'pending' ? C.muted : C.text, marginBottom: 2 }}>{step}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>{desc}</div>
                </div>
                {status === 'progress' && (
                  <div style={{ fontSize: 11, color: color, fontWeight: 700, background: color + '15', padding: '3px 10px', borderRadius: 99 }}>En cours</div>
                )}
              </div>
            ))}

            {/* Summary card */}
            <div style={{
              background: 'linear-gradient(135deg,rgba(6,182,212,0.1),rgba(59,130,246,0.08))',
              border: `1px solid rgba(6,182,212,0.25)`,
              borderRadius: 14, padding: '20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>Masse salariale totale</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: C.text, fontFamily: "system-ui, sans-serif" }}>47 318 400 <span style={{ fontSize: 14, color: C.cyan }}>FCFA</span></div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: C.green, fontWeight: 700, marginBottom: 4 }}>✓ Conforme CGI</div>
                <div style={{ fontSize: 11, color: C.muted }}>CNSS · IRPP · TUS calculés</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          PRICING
      ═══════════════════════════════════════════════════════════════════════ */}

      {/* ═══════════════════════════════════════════════════════════════════════
          TESTIMONIALS
      ═══════════════════════════════════════════════════════════════════════ */}
      <section style={{ ...s.section, position: 'relative', zIndex: 1, borderTop: `1px solid ${C.border}` }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ ...s.label, margin: '0 auto 20px', width: 'fit-content' }}>// Témoignages</div>
          <h2 style={s.h2}>Ce qu'ils disent de nous</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }} className="testi-grid">
          <TestiCard
            quote="Avant Konza RH, notre DRH passait 4 jours sur la paie chaque mois. Maintenant c'est 2 heures. Les bulletins sont conformes et nos employés reçoivent leurs fiches le 25 sans exception."
            name="Marie-Claire N." role="Directrice Administrative" company="Groupe BTP Pointe-Noire"
          />
          <TestiCard
            quote="Le pointage GPS a changé notre gestion des chantiers. On sait exactement qui est présent, on n'a plus de disputes sur les absences. La CNSS est calculée automatiquement, c'est un gain de temps énorme."
            name="Franck O." role="DRH" company="Entreprise de construction, Brazzaville"
          />
          <TestiCard
            quote="En tant que cabinet comptable, je gère 12 clients avec Konza RH. La clôture groupée me fait économiser 3 jours de travail par mois. Le module d'import/export vers SAGE est parfait."
            name="Dr. Paul M." role="Expert-Comptable" company="Cabinet PM & Associés"
          />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          FAQ
      ═══════════════════════════════════════════════════════════════════════ */}
      <section style={{ ...s.section, position: 'relative', zIndex: 1, borderTop: `1px solid ${C.border}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 80, alignItems: 'start' }} className="faq-grid">
          <div>
            <div style={{ ...s.label, marginBottom: 24 }}>// FAQ</div>
            <h2 style={{ ...s.h2, marginBottom: 20 }}>Questions fréquentes</h2>
            <p style={{ ...s.p, marginBottom: 32 }}>Vous avez d'autres questions ? Notre équipe vous répond sous 24h.</p>
            <Link href="/contact" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              color: C.cyan, textDecoration: 'none', fontWeight: 700, fontSize: 14,
              border: `1px solid rgba(6,182,212,0.3)`, padding: '10px 20px', borderRadius: 10,
            }}>
              Contacter le support
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          </div>

          <FaqList />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          CTA FINAL
      ═══════════════════════════════════════════════════════════════════════ */}
      <section style={{ position: 'relative', zIndex: 1, overflow: 'hidden', padding: '100px 32px' }}>
        <Blob color="#06B6D4" style={{ width: 600, height: 600, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <div style={{ ...s.label, margin: '0 auto 24px', width: 'fit-content' }}>// Prêt à commencer ?</div>
          <h2 style={{ ...s.h2, fontSize: 'clamp(36px,6vw,64px)', marginBottom: 20 }}>
            Simplifiez votre paie.<br/>Dès aujourd'hui.
          </h2>
          <p style={{ ...s.p, margin: '0 auto 48px', textAlign: 'center', fontSize: 18 }}>
            Rejoignez les DRH congolais qui ont choisi la sérénité. 14 jours d'essai gratuit, sans engagement, sans carte bancaire.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            <Link href="/auth/register" style={{
              background: 'linear-gradient(135deg,#06B6D4,#3B82F6)',
              color: '#fff', textDecoration: 'none', fontWeight: 800, fontSize: 17,
              padding: '18px 44px', borderRadius: 14,
              boxShadow: '0 0 60px rgba(6,182,212,0.4)',
              display: 'flex', alignItems: 'center', gap: 10,
              transition: 'transform 0.2s',
            }}>
              Commencer gratuitement
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
            <Link href="/contact" style={{
              background: 'transparent',
              color: C.text, textDecoration: 'none', fontWeight: 700, fontSize: 17,
              padding: '18px 32px', borderRadius: 14,
              border: `1px solid ${C.border}`,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              Demander une démo
            </Link>
          </div>
          <p style={{ color: C.muted, fontSize: 13, marginTop: 24 }}>
            ✓ Sans carte bancaire &nbsp;·&nbsp; ✓ Configuration en 30 min &nbsp;·&nbsp; ✓ Support en français
          </p>
        </div>
      </section>

      <Footer />

      {/* ─── Global responsive ───────────────────────────────────────────────── */}
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .reveal { opacity: 0; transform: translateY(32px); transition: opacity 0.6s ease, transform 0.6s ease; }
        @media (max-width: 1024px) {
          .feat-grid { grid-template-columns: repeat(2,1fr) !important; }
          .pricing-grid { grid-template-columns: repeat(2,1fr) !important; }
          .why-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
          .how-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
          .faq-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
        }
        @media (max-width: 700px) {
          .feat-grid { grid-template-columns: 1fr !important; }
          .pricing-grid { grid-template-columns: 1fr !important; }
          .testi-grid { grid-template-columns: 1fr !important; }
          .hero-stats { grid-template-columns: 1fr !important; }
        }
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 6px; background: #020817; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
      `}</style>
    </div>
  );
}

// ─── Features data ───────────────────────────────────────────────────────────
const FEATURES = [
  // ── Big cards (alternées gauche/droite) ──────────────────────────────────
  {
    id: 'paie', group: 'big',
    tag: 'Core', tagColor: C.cyan,
    title: 'Paie automatique & conforme',
    hook: '500 bulletins en moins de 3 minutes.',
    desc: 'Calculs CNSS, IRPP/ITS et TUS appliqués automatiquement selon le CGI 2025-2026. Abattement 20%, quotient familial, primes, retenues — zéro erreur, zéro redressement fiscal.',
    // 👇 Remplacez le src par votre vraie image : '/features/paie.png'
    img: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=75',
    imgAlt: 'Paie automatique Konza RH',
    color: C.cyan, accent: 'rgba(6,182,212,0.1)',
    pills: ['CNSS 4% + 20.28%', 'IRPP / ITS', 'Quotient familial', 'Bulletins PDF'],
  },
  {
    id: 'conformite', group: 'big',
    tag: 'Légal', tagColor: C.green,
    title: 'Conformité légale garantie',
    hook: 'Le CGI 2025-2026 appliqué automatiquement.',
    desc: 'Barèmes mis à jour à chaque révision légale. Déclarations CNSS prêtes à soumettre. TUS, abattement 20%, parts fiscales — rien n\'est oublié. Dormez tranquille.',
    // 👇 Remplacez : '/features/conformite.png'
    img: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=900&q=75',
    imgAlt: 'Conformité fiscale Congo',
    color: C.green, accent: 'rgba(16,185,129,0.1)',
    pills: ['CGI 2025-2026', 'Déclaration CNSS', 'TUS inclus', 'Alertes légales'],
  },
  {
    id: 'pointage', group: 'big',
    tag: 'Terrain', tagColor: C.pink,
    title: 'Pointage GPS multi-sites',
    hook: 'Votre équipe pointe depuis son téléphone.',
    desc: 'Géolocalisation en temps réel, périmètre configurable par site, alertes retard et absence automatiques. Historique infalsifiable, accessible en un clic pour la DRH.',
    // 👇 Remplacez : '/features/pointage.png'
    img: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=900&q=75',
    imgAlt: 'Pointage GPS mobile Congo',
    color: C.pink, accent: 'rgba(236,72,153,0.1)',
    pills: ['Géolocalisation live', 'Multi-sites', 'Alertes retard', 'Historique intégral'],
  },
  {
    id: 'conges', group: 'big',
    tag: 'RH', tagColor: C.blue,
    title: 'Congés & absences simplifiés',
    hook: 'Fini les tableaux Excel de suivi.',
    desc: 'Demandes en ligne, validation hiérarchique, soldes calculés sur 26 jours ouvrables, jours fériés congolais intégrés. RTT, maladie, maternité — tout est automatique.',
    // 👇 Remplacez : '/features/conges.png'
    img: 'https://images.unsplash.com/photo-1506784365847-bbad939e9335?auto=format&fit=crop&w=900&q=75',
    imgAlt: 'Gestion congés Congo',
    color: C.blue, accent: 'rgba(59,130,246,0.1)',
    pills: ['Validation hiérarchique', '26 j. ouvrables', 'Jours fériés CG', 'Soldes auto'],
  },
  // ── Compact cards (grid 2×2) ─────────────────────────────────────────────
  {
    id: 'prets', group: 'compact',
    tag: 'Finance', tagColor: C.purple,
    title: 'Prêts, avances & acomptes',
    hook: 'Sans risque légal, remboursement automatique.',
    desc: 'Plafonds légaux validés automatiquement. Remboursements déduits chaque mois sur la fiche de paie. Historique complet par employé.',
    // 👇 Remplacez : '/features/prets.png'
    img: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=700&q=75',
    imgAlt: 'Prêts avances employés',
    color: C.purple, accent: 'rgba(139,92,246,0.1)',
    pills: ['Plafonds légaux', 'Remboursement auto'],
  },
  {
    id: 'recrutement', group: 'compact',
    tag: 'Talent', tagColor: C.orange,
    title: 'Recrutement & onboarding',
    hook: 'De l\'offre à la première fiche de paie.',
    desc: 'Page carrière personnalisée, gestion des candidatures, entretiens planifiés, intégration directe dans la paie dès le recrutement.',
    // 👇 Remplacez : '/features/recrutement.png'
    img: 'https://images.unsplash.com/photo-1521737852567-6949f3f9f2b5?auto=format&fit=crop&w=700&q=75',
    imgAlt: 'Recrutement onboarding',
    color: C.orange, accent: 'rgba(245,158,11,0.1)',
    pills: ['Page carrière custom', 'ATS intégré'],
  },
  {
    id: 'rupture', group: 'compact',
    tag: 'Légal', tagColor: C.pink,
    title: 'Rupture de contrat',
    hook: 'Calculs de fin de contrat sans erreur.',
    desc: 'Indemnités légales, préavis, solde de tout compte — calculés automatiquement selon le Code du Travail congolais. Documents de sortie PDF générés en 1 clic.',
    // 👇 Remplacez : '/features/rupture.png'
    img: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=700&q=75',
    imgAlt: 'Rupture contrat travail Congo',
    color: C.pink, accent: 'rgba(236,72,153,0.1)',
    pills: ['Indemnités légales', 'Documents de sortie'],
  },
  {
    id: 'cnss', group: 'compact',
    tag: 'Déclaration', tagColor: C.green,
    title: 'Déclaration CNSS automatique',
    hook: 'Plus jamais de retard de déclaration.',
    desc: 'État nominatif des salaires généré chaque mois au format CNSS Congo. Rappels de délais, historique des soumissions, cotisations calculées employé par employé.',
    // 👇 Remplacez : '/features/cnss.png'
    img: 'https://images.unsplash.com/photo-1560472355-536de3962603?auto=format&fit=crop&w=700&q=75',
    imgAlt: 'Déclaration CNSS Congo',
    color: C.green, accent: 'rgba(16,185,129,0.1)',
    pills: ['Export CNSS CG', 'Rappels délais'],
  },
];

// ─── Big card (image côté, texte côté) ───────────────────────────────────────
function FBigCard({ feat, reverse }: { feat: typeof FEATURES[0]; reverse?: boolean }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: reverse ? '1fr 1.15fr' : '1.15fr 1fr',
        background: hover ? feat.accent : C.bgCard,
        border: `1px solid ${hover ? feat.color + '45' : C.border}`,
        borderRadius: 20,
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        minHeight: 340,
      }}
      className="fbig-card"
    >
      {/* Texte */}
      <div style={{
        padding: '48px 44px',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 18,
        order: reverse ? 2 : 1,
      }}>
        <span style={{
          display: 'inline-block', width: 'fit-content',
          fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' as const,
          color: feat.color, background: feat.accent,
          border: `1px solid ${feat.color}30`,
          padding: '4px 12px', borderRadius: 99,
        }}>{feat.tag}</span>

        <h3 style={{ fontSize: 'clamp(20px,2.5vw,28px)', fontWeight: 900, color: C.text, letterSpacing: '-0.025em', lineHeight: 1.2, fontFamily: 'system-ui,sans-serif' }}>
          {feat.title}
        </h3>

        <p style={{ fontSize: 15, fontWeight: 700, color: feat.color, lineHeight: 1.45 }}>{feat.hook}</p>

        <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.75, maxWidth: 400 }}>{feat.desc}</p>

        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8, marginTop: 4 }}>
          {feat.pills?.map(p => (
            <span key={p} style={{
              fontSize: 12, fontWeight: 600, color: feat.color,
              background: feat.accent, border: `1px solid ${feat.color}25`,
              padding: '5px 12px', borderRadius: 8,
            }}>{p}</span>
          ))}
        </div>
      </div>

      {/* Image */}
      <div style={{
        position: 'relative' as const, minHeight: 260, overflow: 'hidden',
        order: reverse ? 1 : 2,
        borderLeft: reverse ? 'none' : `1px solid ${C.border}`,
        borderRight: reverse ? `1px solid ${C.border}` : 'none',
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={feat.img} alt={feat.imgAlt}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', filter: 'brightness(0.6) saturate(0.75)',
            transition: 'transform 0.4s ease',
            transform: hover ? 'scale(1.05)' : 'scale(1)',
          }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: reverse
            ? `linear-gradient(to right, transparent 35%, ${C.bgCard}CC)`
            : `linear-gradient(to left, transparent 35%, ${C.bgCard}CC)`,
        }} />
        <div style={{ position: 'absolute', inset: 0, background: feat.color + '15', opacity: hover ? 1 : 0, transition: 'opacity 0.3s' }} />
      </div>
    </div>
  );
}

// ─── Compact card (image top, texte bas) ─────────────────────────────────────
function FCompactCard({ feat }: { feat: typeof FEATURES[0] }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? C.bgCardHover : C.bgCard,
        border: `1px solid ${hover ? feat.color + '45' : C.border}`,
        borderRadius: 18, overflow: 'hidden',
        transition: 'all 0.25s ease',
        transform: hover ? 'translateY(-5px)' : 'none',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', height: 190, overflow: 'hidden', flexShrink: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={feat.img} alt={feat.imgAlt}
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            filter: 'brightness(0.55) saturate(0.7)',
            transition: 'transform 0.4s ease',
            transform: hover ? 'scale(1.07)' : 'scale(1)',
          }}
        />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, transparent 30%, ${C.bgCard}F2)` }} />
        <div style={{ position: 'absolute', inset: 0, background: feat.color + '18', opacity: hover ? 1 : 0, transition: 'opacity 0.3s' }} />
        <span style={{
          position: 'absolute', top: 14, left: 14,
          fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' as const,
          color: feat.color, background: 'rgba(5,8,22,0.78)',
          border: `1px solid ${feat.color}40`,
          padding: '3px 10px', borderRadius: 99, backdropFilter: 'blur(8px)',
        }}>{feat.tag}</span>
      </div>

      {/* Texte */}
      <div style={{ padding: '24px 26px 28px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        <h3 style={{ fontSize: 19, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', lineHeight: 1.2, fontFamily: 'system-ui,sans-serif' }}>{feat.title}</h3>
        <p style={{ fontSize: 13.5, fontWeight: 700, color: feat.color, lineHeight: 1.45 }}>{feat.hook}</p>
        <p style={{ fontSize: 13.5, color: C.sub, lineHeight: 1.7 }}>{feat.desc}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6, marginTop: 'auto', paddingTop: 8 }}>
          {feat.pills?.map(p => (
            <span key={p} style={{
              fontSize: 11, fontWeight: 600, color: feat.color,
              background: feat.accent, padding: '4px 10px', borderRadius: 7,
              border: `1px solid ${feat.color}20`,
            }}>{p}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Section Features complète ────────────────────────────────────────────────
function FeaturesSection() {
  const bigCards   = FEATURES.filter(f => f.group === 'big');
  const compactCards = FEATURES.filter(f => f.group === 'compact');

  return (
    <section id="fonctionnalites" style={{ padding: '100px 0', position: 'relative', zIndex: 1 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 99, fontSize: 12, fontWeight: 700, color: C.cyan, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 20 }}>
            // Fonctionnalités
          </div>
          <h2 style={{ fontSize: 'clamp(32px,5vw,52px)', fontWeight: 900, color: C.text, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 16, fontFamily: 'system-ui,sans-serif' }}>
            Une suite RH complète,<br />conçue pour le Congo
          </h2>
          <p style={{ fontSize: 18, color: C.sub, maxWidth: 560, margin: '0 auto', lineHeight: 1.65 }}>
            De la fiche employé au bulletin de paie — tout en un, conforme au Code Général des Impôts congolais.
          </p>
        </div>

        {/* Big cards alternées */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {bigCards.map((feat, i) => (
            <FBigCard key={feat.id} feat={feat} reverse={i % 2 === 1} />
          ))}
        </div>

        {/* Séparateur */}
        <div style={{ borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, background: 'rgba(6,182,212,0.03)', margin: '72px -32px', padding: '40px 32px', textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 10 }}>Et aussi — parce que les détails font la différence</p>
          <p style={{ fontSize: 20, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', fontFamily: 'system-ui,sans-serif' }}>
            Gestion de bout en bout,{' '}
            <span style={{ color: C.cyan }}>sans exception.</span>
          </p>
        </div>

        {/* Compact 2×2 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 22 }} className="fcompact-grid">
          {compactCards.map(feat => <FCompactCard key={feat.id} feat={feat} />)}
        </div>

        {/* CTA bas */}
        <div style={{ marginTop: 56, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
          <p style={{ fontSize: 16, color: C.sub, maxWidth: 460 }}>
            Toutes les fonctionnalités incluses dans votre essai gratuit de 14 jours.
          </p>
          <Link href="/auth/register" style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: 'linear-gradient(135deg,#06B6D4,#3B82F6)',
            color: '#fff', textDecoration: 'none', fontWeight: 800, fontSize: 15,
            padding: '14px 32px', borderRadius: 12,
            boxShadow: '0 0 40px rgba(6,182,212,0.28)',
          }}>
            Essayer gratuitement — sans carte bancaire
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>
      </div>

      <style>{`
        .fbig-card { transition: background 0.3s ease, border-color 0.3s ease !important; }
        @media (max-width: 860px) {
          .fbig-card { grid-template-columns: 1fr !important; }
          .fbig-card > div[style*="order: 2"], .fbig-card > div[style*="order: 1"] { order: unset !important; }
          .fbig-card > div:last-child { min-height: 200px; border-left: none !important; border-right: none !important; border-top: 1px solid rgba(255,255,255,0.07); }
        }
        @media (max-width: 640px) {
          .fcompact-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}

// ─── FAQ accordion ────────────────────────────────────────────────────────────
function FaqList() {
  const [open, setOpen] = useState<number | null>(null);
  const items = [
    {
      q: "Est-ce vraiment conforme à la fiscalité congolaise ?",
      a: "Oui, à 100%. Konza RH applique les barèmes IRPP/ITS avec abattement de 20%, le CNSS salarial (4%) et patronal (20.28%), la Taxe Unique sur les Salaires (TUS), et le quotient familial — selon le Code Général des Impôts 2025-2026. Les barèmes sont mis à jour automatiquement à chaque révision légale."
    },
    {
      q: "Combien de temps pour générer les bulletins de 500 employés ?",
      a: "Moins de 3 minutes. Notre moteur de calcul traite les 500 fiches en parallèle, génère les PDF et prépare l'export CNSS en quelques minutes. Les variables exceptionnelles du mois (absences, primes, heures sup) sont prises en compte automatiquement."
    },
    {
      q: "Peut-on utiliser Konza RH pour plusieurs entreprises ?",
      a: "Oui. Le plan Enterprise et le mode Cabinet comptable permettent de gérer plusieurs entités légales depuis un seul compte. Chaque entreprise a ses propres paramètres fiscaux, ses employés et ses bulletins. Les experts-comptables peuvent gérer tout leur portefeuille clients."
    },
    {
      q: "Comment fonctionne le pointage GPS ?",
      a: "Chaque employé installe l'application mobile et pointe à son arrivée/départ. Le système vérifie sa position GPS en temps réel et la compare au périmètre autorisé (configurable en mètres par site). Les retards et absences sont signalés automatiquement au RH."
    },
    {
      q: "Comment Konza RH gère-t-il la rupture de contrat ?",
      a: "Konza RH calcule automatiquement toutes les indemnités légales de fin de contrat selon le Code du Travail congolais : indemnité de licenciement, préavis, congés payés non pris, solde de tout compte. Les documents de sortie (attestation de travail, reçu pour solde de tout compte) sont générés en PDF prêts à signer."
    },
    {
      q: "La déclaration CNSS est-elle générée automatiquement ?",
      a: "Oui. Chaque mois, Konza RH produit automatiquement l'état nominatif des salaires au format requis par la CNSS Congo, avec les cotisations salariales (4%) et patronales (20.28%) calculées employé par employé. Vous n'avez plus qu'à déposer le fichier. Des rappels de délai sont envoyés avant la date limite."
    },
    {
      q: "Quels modes de paiement sont acceptés ?",
      a: "MTN Mobile Money, Airtel Money, et virement bancaire. Aucune carte Visa/Mastercard n'est requise. La facturation est mensuelle, sans engagement minimum."
    },
    {
      q: "Mes données sont-elles sécurisées ?",
      a: "Vos données sont hébergées sur des serveurs PostgreSQL sécurisés (Neon.tech), chiffrées au repos et en transit (TLS 1.3). L'accès est protégé par 2FA, sessions sécurisées, et un audit log complet de chaque action. Conformité RGPD incluse."
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            background: C.bgCard,
            border: `1px solid ${open === i ? 'rgba(6,182,212,0.3)' : C.border}`,
            borderRadius: 14,
            overflow: 'hidden',
            transition: 'border-color 0.2s',
          }}
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            style={{
              width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '18px 20px', background: 'none', border: 'none', cursor: 'pointer',
              color: C.text, textAlign: 'left', gap: 16,
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.4 }}>{item.q}</span>
            <svg
              width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.cyan} strokeWidth="2.5"
              style={{ flexShrink: 0, transform: open === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}
            >
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </button>
          {open === i && (
            <div style={{ padding: '0 20px 20px', fontSize: 14, color: C.sub, lineHeight: 1.7, borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
              {item.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}