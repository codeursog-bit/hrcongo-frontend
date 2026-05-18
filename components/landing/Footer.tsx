// ============================================================================
// 📁 components/landing/Footer.tsx
// ============================================================================
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  return (
    <footer style={{ background: '#020817', borderTop: '1px solid rgba(255,255,255,0.06)', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 32px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, paddingBottom: 48, borderBottom: '1px solid rgba(255,255,255,0.06)' }} className="footer-grid">

          {/* Brand */}
          <div>
            <div style={{ marginBottom: 16 }}>
              <Link href="/" style={{ display: 'inline-flex', textDecoration: 'none' }}>
                <Image
                  src="/logos/konza_logo_h_color.png"
                  alt="Logo"
                  width={140}
                  height={40}
                  style={{ objectFit: 'contain', height: 40, width: 'auto' }}
                />
              </Link>
            </div>
            <p style={{ color: '#64748B', fontSize: 14, lineHeight: 1.7, maxWidth: 300, marginBottom: 24 }}>
              La première plateforme RH conçue pour le marché congolais. Paie conforme, pointage GPS, recrutement — tout en un.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { icon: '✉', text: 'contact@hrcongo.com', href: 'mailto:contact@konzarh.com' },
                { icon: '☎', text: '+242 06 413 3693', href: 'tel:+242064133693' },
                { icon: '⌖', text: 'Pointe-Noire, Congo-Brazzaville', href: null },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: '#06B6D4', fontSize: 13 }}>{item.icon}</span>
                  {item.href
                    ? <a href={item.href} style={{ color: '#64748B', fontSize: 13, textDecoration: 'none', transition: 'color 0.15s' }}
                        onMouseEnter={e => (e.target as HTMLElement).style.color = '#fff'}
                        onMouseLeave={e => (e.target as HTMLElement).style.color = '#64748B'}
                      >{item.text}</a>
                    : <span style={{ color: '#64748B', fontSize: 13 }}>{item.text}</span>
                  }
                </div>
              ))}
            </div>
          </div>

          {/* Produit */}
          <div>
            <h4 style={{ color: '#fff', fontWeight: 700, fontSize: 14, marginBottom: 20, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Produit</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {['Fonctionnalités', 'Tarification', 'Changelog', 'Statut système', 'API Docs'].map(item => (
                <li key={item}>
                  <a href="#" style={{ color: '#64748B', fontSize: 14, textDecoration: 'none', transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.target as HTMLElement).style.color = '#fff'}
                    onMouseLeave={e => (e.target as HTMLElement).style.color = '#64748B'}
                  >{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Entreprise */}
          <div>
            <h4 style={{ color: '#fff', fontWeight: 700, fontSize: 14, marginBottom: 20, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Entreprise</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'À propos', href: '/qui-sommes-nous' },
                { label: 'Blog', href: '/blog' },
                { label: 'Partenaires', href: '#' },
                { label: 'Contact', href: '/contact' },
              ].map(item => (
                <li key={item.label}>
                  <Link href={item.href} style={{ color: '#64748B', fontSize: 14, textDecoration: 'none', transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.target as HTMLElement).style.color = '#fff'}
                    onMouseLeave={e => (e.target as HTMLElement).style.color = '#64748B'}
                  >{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h4 style={{ color: '#fff', fontWeight: 700, fontSize: 14, marginBottom: 20, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Légal & Support</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'FAQ', href: ' "' },
                { label: 'CGU', href: '#' },
                { label: 'Confidentialité', href: '#' },
                { label: 'Cookies', href: '#' },
              ].map(item => (
                <li key={item.label}>
                  <Link href={item.href} style={{ color: '#64748B', fontSize: 14, textDecoration: 'none', transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.target as HTMLElement).style.color = '#fff'}
                    onMouseLeave={e => (e.target as HTMLElement).style.color = '#64748B'}
                  >{item.label}</Link>
                </li>
              ))}
            </ul>

            {/* Newsletter mini */}
            <div style={{ marginTop: 28 }}>
              <p style={{ color: '#64748B', fontSize: 13, marginBottom: 10 }}>Newsletter RH Congo :</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="email"
                  placeholder="votre@email.com"
                  style={{
                    flex: 1, padding: '8px 12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', minWidth: 0,
                  }}
                />
                <button style={{ padding: '8px 14px', background: 'linear-gradient(135deg,#06B6D4,#3B82F6)', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 0', flexWrap: 'wrap', gap: 16 }}>
          <p style={{ color: '#334155', fontSize: 13 }}>© 2025 HRCongo. Tous droits réservés. Fait avec ❤ à Pointe-Noire.</p>
          <div style={{ display: 'flex', gap: 16 }}>
            {['Facebook', 'LinkedIn', 'Twitter'].map(sn => (
              <a key={sn} href="#" style={{ color: '#334155', fontSize: 13, textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.target as HTMLElement).style.color = '#06B6D4'}
                onMouseLeave={e => (e.target as HTMLElement).style.color = '#334155'}
              >{sn}</a>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 600px) {
          .footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </footer>
  );
}