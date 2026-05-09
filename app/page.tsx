// ============================================================================
// 📁 app/(landing)/page.tsx  — HRCongo Landing Page (composant unique)
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
function FeatureCard({
  icon, title, desc, color, bg, badge
}: { icon: React.ReactNode; title: string; desc: string; color: string; bg: string; badge?: string }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? C.bgCardHover : C.bgCard,
        border: `1px solid ${hover ? color + '40' : C.border}`,
        borderRadius: 16,
        padding: '28px 28px 32px',
        transition: 'all 0.25s ease',
        transform: hover ? 'translateY(-4px)' : 'none',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
      }}
    >
      {/* Glow on hover */}
      <div style={{
        position: 'absolute', inset: 0, opacity: hover ? 1 : 0, transition: 'opacity 0.3s',
        background: `radial-gradient(ellipse at 0% 0%, ${color}10 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {badge && (
        <span style={{
          position: 'absolute', top: 20, right: 20,
          fontSize: 10, fontWeight: 700, color: '#fff',
          background: 'linear-gradient(135deg,#06B6D4,#3B82F6)',
          padding: '3px 10px', borderRadius: 99, letterSpacing: '0.06em',
        }}>{badge}</span>
      )}

      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 20, transition: 'transform 0.2s',
        transform: hover ? 'scale(1.08)' : 'scale(1)',
        color,
      }}>
        {icon}
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 10, letterSpacing: '-0.02em', fontFamily: "system-ui, sans-serif" }}>
        {title}
      </h3>
      <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.65 }}>{desc}</p>
    </div>
  );
}

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
            HRCongo automatise la paie, les congés, le pointage GPS et le recrutement — 
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

            {/* Fake dashboard - image placeholder zone */}
            <div style={{
              height: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              background: 'linear-gradient(160deg, rgba(6,182,212,0.04) 0%, rgba(59,130,246,0.03) 100%)',
            }}>
              {/* Replace this div with your actual <Image> component */}
              {/* <Image src="/screenshots/dashboard.png" alt="Dashboard HRCongo" fill style={{ objectFit: 'cover' }} /> */}

              {/* Placeholder visuel */}
              <div style={{ textAlign: 'center', opacity: 0.3 }}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={C.cyan} strokeWidth="1.5" style={{ marginBottom: 16 }}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                <p style={{ color: C.cyan, fontSize: 13, fontFamily: 'ui-monospace, monospace' }}>// Capture dashboard — à remplacer</p>
              </div>

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
            {['TOTAL Energies', 'BTP Congo', 'Pharmacie Elite', 'Groupe Bolloré', 'Cabinet Juridique RC', 'Mining Corp CG'].map(name => (
              <div key={name} style={{
                fontSize: 13, fontWeight: 700, color: 'rgba(100,116,139,0.6)',
                letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap',
              }}>{name}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          FEATURES — PAIE & CONFORMITÉ
      ═══════════════════════════════════════════════════════════════════════ */}
      <section style={{ ...s.section, position: 'relative', zIndex: 1 }} id="fonctionnalites" className="reveal" >
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ ...s.label, margin: '0 auto 20px', width: 'fit-content' }}>// Fonctionnalités</div>
          <h2 style={s.h2}>Une suite RH complète,<br/>conçue pour le Congo</h2>
          <p style={{ ...s.p, margin: '0 auto', textAlign: 'center' }}>
            De la fiche employé au bulletin de paie, du pointage GPS à la déclaration CNSS — tout en un, sans compromis.
          </p>
        </div>

        {/* Feature grid 3 cols */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }} className="feat-grid">
          <FeatureCard
            icon={<Icon.Payroll />}
            color={C.cyan} bg="rgba(6,182,212,0.1)"
            title="Paie Automatique & Conformes"
            desc="Bulletins de salaire générés en 1 clic. CNSS 4% salarial + 20.28% patronal, IRPP/ITS avec abattement 20%, quotient familial, primes et retenues — 100% conforme au CGI 2025-2026."
            badge="Core"
          />
          <FeatureCard
            icon={<Icon.Shield />}
            color={C.green} bg="rgba(16,185,129,0.1)"
            title="Conformité Légale Garantie"
            desc="Toutes les règles du Code Général des Impôts congolais appliquées automatiquement. Barèmes IRPP mis à jour, TUS, déclarations CNSS prêtes à soumettre. Zéro risque de redressement."
          />
          <FeatureCard
            icon={<Icon.Map />}
            color={C.pink} bg="rgba(236,72,153,0.1)"
            title="Pointage GPS Multi-Sites"
            desc="Vos équipes pointent depuis leur smartphone. Géolocalisation en temps réel, radius configurable par site, alertes retard/absence automatiques, historique infalsifiable."
          />
          <FeatureCard
            icon={<Icon.Calendar />}
            color={C.blue} bg="rgba(59,130,246,0.1)"
            title="Gestion des Congés & Absences"
            desc="Demandes en ligne, circuit de validation hiérarchique, soldes automatiques calculés sur 26 jours ouvrables, compteurs de RTT, congés maladie, maternité — et jours fériés congolais intégrés."
          />
          <FeatureCard
            icon={<Icon.Loan />}
            color={C.purple} bg="rgba(139,92,246,0.1)"
            title="Prêts, Avances & Acomptes"
            desc="Gérez les demandes de prêt avec validation automatique des plafonds légaux. Remboursements déduits automatiquement sur les fiches de paie. Historique complet par employé."
          />
          <FeatureCard
            icon={<Icon.People />}
            color={C.orange} bg="rgba(245,158,11,0.1)"
            title="Recrutement & Onboarding"
            desc="Page carrière personnalisée avec vos couleurs. Publiez vos offres, recevez les candidatures, gérez les entretiens — et intégrez le nouveau recruté en quelques clics directement dans la paie."
          />
        </div>

        {/* Second row — advanced features */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 20 }} className="feat-grid">
          <FeatureCard
            icon={<Icon.Chart />}
            color={C.cyan} bg="rgba(6,182,212,0.1)"
            title="Tableaux de Bord RH"
            desc="Vue consolidée : masse salariale, effectifs actifs, taux d'absentéisme, coûts patronaux, alertes contrats — tout sur un seul écran, en temps réel."
          />
          <FeatureCard
            icon={<Icon.File />}
            color={C.green} bg="rgba(16,185,129,0.1)"
            title="Documents & Archivage"
            desc="GED intégrée : contrats, avenants, bulletins signés, attestations de travail, DIPE, DAS. Stockage sécurisé, accès rapide, notifications d'expiration."
          />
          <FeatureCard
            icon={<Icon.Cabinet />}
            color={C.purple} bg="rgba(139,92,246,0.1)"
            title="Mode Cabinet Comptable"
            desc="Gérez plusieurs entreprises clientes depuis un seul compte. Clôture de paie groupée, imports/exports comptables, droits granulaires par gestionnaire. Fait pour les experts-comptables."
            badge="Pro"
          />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          WHY US — Chiffres + Avantages
      ═══════════════════════════════════════════════════════════════════════ */}
      <section style={{ position: 'relative', zIndex: 1, borderTop: `1px solid ${C.border}`, overflow: 'hidden' }}>
        <Blob color="#06B6D4" style={{ width: 500, height: 500, top: -100, left: '50%' }} />

        <div style={{ ...s.section, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }} className="why-grid">
          {/* Left — text */}
          <div>
            <div style={{ ...s.label, marginBottom: 24 }}>// Pourquoi HRCongo ?</div>
            <h2 style={{ ...s.h2, marginBottom: 24 }}>Conçu pour la réalité<br/>congolaise.</h2>
            <p style={{ ...s.p, marginBottom: 40 }}>
              La plupart des logiciels RH sont faits pour l'Europe ou les États-Unis. HRCongo est le premier — et seul — système conçu nativement pour les spécificités fiscales, sociales et opérationnelles du Congo-Brazzaville.
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
                "HRCongo nous a économisé 3 jours par mois sur la paie. Les bulletins sont conformes, la DRH est sereine."
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
      <section style={{ ...s.section, position: 'relative', zIndex: 1, borderTop: `1px solid ${C.border}` }} id="tarifs">
        <Blob color="#8B5CF6" style={{ width: 600, height: 600, top: -100, right: -200 }} />
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ ...s.label, margin: '0 auto 20px', width: 'fit-content' }}>// Tarifs</div>
          <h2 style={s.h2}>Simple. Transparent.<br/>Sans surprise.</h2>
          <p style={{ ...s.p, margin: '0 auto', textAlign: 'center' }}>
            14 jours d'essai gratuit sur tous les plans. Aucune carte bancaire requise.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20, position: 'relative' }} className="pricing-grid">
          <PricingCard
            name="Gratuit" price="0" priceUnit="" sub="Jusqu'à 5 employés" cta="Commencer"
            features={['Paie basique (CNSS + IRPP)', 'Gestion des congés', 'Pointage simple', '1 utilisateur', 'Support communauté']}
          />
          <PricingCard
            name="Startup" price="15 000" priceUnit="FCFA/mois" sub="Jusqu'à 20 employés" cta="Démarrer"
            features={['Tout Gratuit +', 'Calcul fiscal complet CGI', 'Bulletins PDF signés', 'Déclaration CNSS auto', '3 utilisateurs', 'Support email']}
          />
          <PricingCard
            name="Business" price="35 000" priceUnit="FCFA/mois" sub="Jusqu'à 100 employés" cta="Choisir Business"
            popular
            features={['Tout Startup +', 'Pointage GPS multi-sites', 'Prêts & avances', 'Recrutement intégré', 'GED documents', 'Formations', '10 utilisateurs', 'Support prioritaire']}
          />
          <PricingCard
            name="Enterprise" price="65 000" priceUnit="FCFA/mois" sub="Employés illimités" cta="Nous contacter"
            features={['Tout Business +', 'Multi-entreprises', 'Mode Cabinet comptable', 'API & Intégrations ERP', 'Export SAGE / CIEL', 'Utilisateurs illimités', 'Manager dédié', 'Support 24/7']}
          />
        </div>

        <p style={{ textAlign: 'center', color: C.muted, fontSize: 13, marginTop: 32 }}>
          Paiement par MTN Mobile Money · Airtel Money · Virement bancaire · Aucune carte requise
        </p>
      </section>

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
            quote="Avant HRCongo, notre DRH passait 4 jours sur la paie chaque mois. Maintenant c'est 2 heures. Les bulletins sont conformes et nos employés reçoivent leurs fiches le 25 sans exception."
            name="Marie-Claire N." role="Directrice Administrative" company="Groupe BTP Pointe-Noire"
          />
          <TestiCard
            quote="Le pointage GPS a changé notre gestion des chantiers. On sait exactement qui est présent, on n'a plus de disputes sur les absences. La CNSS est calculée automatiquement, c'est un gain de temps énorme."
            name="Franck O." role="DRH" company="Entreprise de construction, Brazzaville"
          />
          <TestiCard
            quote="En tant que cabinet comptable, je gère 12 clients avec HRCongo. La clôture groupée me fait économiser 3 jours de travail par mois. Le module d'import/export vers SAGE est parfait."
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

// ─── FAQ accordion ────────────────────────────────────────────────────────────
function FaqList() {
  const [open, setOpen] = useState<number | null>(null);
  const items = [
    {
      q: "Est-ce vraiment conforme à la fiscalité congolaise ?",
      a: "Oui, à 100%. HRCongo applique les barèmes IRPP/ITS avec abattement de 20%, le CNSS salarial (4%) et patronal (20.28%), la Taxe Unique sur les Salaires (TUS), et le quotient familial — selon le Code Général des Impôts 2025-2026. Les barèmes sont mis à jour automatiquement à chaque révision légale."
    },
    {
      q: "Combien de temps pour générer les bulletins de 500 employés ?",
      a: "Moins de 3 minutes. Notre moteur de calcul traite les 500 fiches en parallèle, génère les PDF et prépare l'export CNSS en quelques minutes. Les variables exceptionnelles du mois (absences, primes, heures sup) sont prises en compte automatiquement."
    },
    {
      q: "Peut-on utiliser HRCongo pour plusieurs entreprises ?",
      a: "Oui. Le plan Enterprise et le mode Cabinet comptable permettent de gérer plusieurs entités légales depuis un seul compte. Chaque entreprise a ses propres paramètres fiscaux, ses employés et ses bulletins. Les experts-comptables peuvent gérer tout leur portefeuille clients."
    },
    {
      q: "Comment fonctionne le pointage GPS ?",
      a: "Chaque employé installe l'application mobile et pointe à son arrivée/départ. Le système vérifie sa position GPS en temps réel et la compare au périmètre autorisé (configurable en mètres par site). Les retards et absences sont signalés automatiquement au RH."
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