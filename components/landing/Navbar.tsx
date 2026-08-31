// ============================================================================
// 📁 components/landing/Navbar.tsx
// ============================================================================
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { label: 'Accueil', href: '/' },
    { label: 'À propos', href: '/qui-sommes-nous' },
    { label: 'Fonctionnalités', href: '#fonctionnalites' },
    { label: 'Tarifs', href: '/tarifs' },
    { label: 'Blog', href: '/blog' },
    { label: 'Documentation', href: '/docs' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: scrolled ? 'rgba(5, 8, 22, 0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        transition: 'all 0.3s ease',
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>

          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <Image
              src="/logos/konza_logo_h_color.png"
              alt="Logo"
              width={140}
              height={40}
              style={{ objectFit: 'contain', height: 40, width: 'auto' }}
              priority
            />
          </Link>

          {/* Desktop nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="desktop-nav">
            {links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                style={{
                  color: 'rgba(148,163,184,1)',
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: 500,
                  padding: '8px 14px',
                  borderRadius: 8,
                  transition: 'all 0.15s',
                  fontFamily: 'system-ui, sans-serif',
                }}
                onMouseEnter={e => {
                  (e.target as HTMLElement).style.color = '#fff';
                  (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
                }}
                onMouseLeave={e => {
                  (e.target as HTMLElement).style.color = 'rgba(148,163,184,1)';
                  (e.target as HTMLElement).style.background = 'transparent';
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} className="desktop-cta">
            <Link
              href="/auth/login"
              style={{ color: '#94A3B8', textDecoration: 'none', fontSize: 14, fontWeight: 600, padding: '8px 16px', borderRadius: 8, transition: 'color 0.15s' }}
              onMouseEnter={e => { (e.target as HTMLElement).style.color = '#fff'; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.color = '#94A3B8'; }}
            >
              Connexion
            </Link>
            <Link
              href="/auth/register"
              style={{
                background: 'linear-gradient(135deg, #06B6D4, #3B82F6)',
                color: '#fff',
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 700,
                padding: '10px 22px',
                borderRadius: 10,
                boxShadow: '0 0 24px rgba(6,182,212,0.3)',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              Essai gratuit
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            style={{ display: 'none', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4 }}
            className="hamburger"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {isOpen
                ? <><path d="M18 6L6 18"/><path d="M6 6l12 12"/></>
                : <><path d="M3 12h18"/><path d="M3 6h18"/><path d="M3 18h18"/></>
              }
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            paddingBottom: 20,
            paddingTop: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}>
            {links.map(link => (
              <Link
                key={link.label}
                href={link.href}
                style={{ color: '#94A3B8', textDecoration: 'none', fontSize: 15, fontWeight: 500, padding: '10px 8px', borderRadius: 8 }}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/auth/register"
              style={{ marginTop: 12, background: 'linear-gradient(135deg,#06B6D4,#3B82F6)', color: '#fff', textDecoration: 'none', fontWeight: 700, padding: '12px 16px', borderRadius: 10, textAlign: 'center' }}
              onClick={() => setIsOpen(false)}
            >
              Essai gratuit →
            </Link>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .desktop-nav { display: none !important; }
          .desktop-cta { display: none !important; }
          .hamburger { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}