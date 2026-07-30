// ============================================================================
// 📁 app/layout.tsx — Layout racine SEO-first
// ✅ Metadata globales Open Graph / Twitter Card / JSON-LD Organisation
// ============================================================================
import React from 'react';
import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { NotificationProvider } from '@/components/providers/NotificationProvider';
import { AlertProvider } from '@/components/providers/AlertProvider';
import { CompanyReminderProvider } from '@/components/providers/CompanyReminderProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://konza-rh.cg';
const SITE_NAME = 'Konza RH';
const SITE_DESC =
  'Logiciel RH & Paie Congo-Brazzaville — Bulletins, CNSS, ITS 2026, CAMU, Congés, Contrats. Conforme au droit congolais.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: `${SITE_NAME} — Logiciel RH & Paie Congo-Brazzaville`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESC,

  // ── Open Graph ──────────────────────────────────────────────────────────
  openGraph: {
    type: 'website',
    locale: 'fr_CG',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Logiciel RH & Paie Congo-Brazzaville`,
    description: SITE_DESC,
    images: [
      {
        url: `${SITE_URL}/og/default.png`,
        width: 1200,
        height: 630,
        alt: 'Konza RH — Logiciel RH & Paie Congo-Brazzaville',
      },
    ],
  },

  // ── Twitter Card ─────────────────────────────────────────────────────────
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Logiciel RH & Paie Congo`,
    description: SITE_DESC,
    images: [`${SITE_URL}/og/default.png`],
  },

  // ── Robots ───────────────────────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // ── Alternate / hreflang ─────────────────────────────────────────────────
  alternates: {
    canonical: SITE_URL,
    languages: { 'fr-CG': SITE_URL, 'fr': SITE_URL },
  },

  // ── Icons / PWA ──────────────────────────────────────────────────────────
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Konza RH',
  },

  // ── Verification ─────────────────────────────────────────────────────────
  // Ajoute tes codes de vérification Google Search Console / Bing ici
  // verification: { google: 'TON_CODE_ICI' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#7C3AED',
};

// ── JSON-LD Organisation ──────────────────────────────────────────────────────
const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Konza RH',
  url: SITE_URL,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web, iOS, Android',
  description: SITE_DESC,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'XAF',
    description: 'Essai gratuit disponible',
  },
  provider: {
    '@type': 'Organization',
    name: 'Konza RH',
    url: SITE_URL,
    logo: `${SITE_URL}/logos/konza_logo_h_color.png`,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: 'French',
      areaServed: 'CG',
    },
    sameAs: [
      'https://www.linkedin.com/company/konza-rh',
      'https://twitter.com/konzarh',
    ],
  },
  keywords: [
    'logiciel RH Congo', 'paie Congo-Brazzaville', 'bulletin de paie Congo',
    'CNSS Congo 2026', 'ITS 2026 Congo', 'CAMU Congo', 'TUS Congo',
    'gestion congés Congo', 'contrat travail Congo', 'déclaration CNSS Congo',
  ].join(', '),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        {/* Preconnect pour la perf */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://res.cloudinary.com" />
        {/* JSON-LD Organisation */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </head>
      <body
        className={`${inter.variable} ${mono.variable} font-sans bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-100 antialiased`}
      >
        <ThemeProvider>
          <QueryProvider>
            <AlertProvider>
              <CompanyReminderProvider>
                <NotificationProvider>
                  {/* Fond décoratif */}
                  <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
                    <div className="absolute inset-0 bg-slate-50 dark:opacity-0 transition-opacity duration-700">
                      <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-blue-100/40 rounded-full blur-[100px] mix-blend-multiply" />
                      <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-indigo-100/40 rounded-full blur-[100px] mix-blend-multiply" />
                    </div>
                    <div className="absolute inset-0 opacity-0 dark:opacity-100 transition-opacity duration-700">
                      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-sky-600/10 rounded-full blur-[120px] animate-aurora-1" />
                      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-indigo-600/10 rounded-full blur-[120px] animate-aurora-2" />
                    </div>
                  </div>
                  {children}
                </NotificationProvider>
              </CompanyReminderProvider>
            </AlertProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}