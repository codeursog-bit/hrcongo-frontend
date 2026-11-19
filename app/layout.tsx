// ============================================================================
// 📁 app/layout.tsx — Layout racine SEO-first
// ✅ Metadata globales Open Graph / Twitter Card / JSON-LD Organisation
// ============================================================================
import React from 'react';
import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { NotificationProvider } from '@/components/providers/NotificationProvider';
import { AlertProvider } from '@/components/providers/AlertProvider';
import { CompanyReminderProvider } from '@/components/providers/CompanyReminderProvider';
import { SubscriptionReminderProvider } from '@/components/providers/SubscriptionReminderProvider';
import { SubscriptionBlockedModal } from '@/components/providers/SubscriptionBlockedModal';
import { SubscriptionEndedBanner } from '@/components/providers/SubscriptionEndedBanner';
import { QueryProvider } from '@/components/providers/QueryProvider';
import './globals.css';
import { appearanceBootstrap } from '@/lib/appearance-bootstrap';
import { RootAppearance } from '@/components/layout/RootAppearance';
import { DemoProvider } from '@/components/providers/DemoProvider';

const inter = localFont({
  src: '../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2',
  weight: '100 900',
  display: 'swap',
  variable: '--font-inter',
});

const jakarta = localFont({
  src: '../node_modules/@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2',
  weight: '200 800',
  display: 'swap',
  variable: '--font-jakarta',
});

const mono = localFont({
  src: '../node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2',
  weight: '100 800',
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
    icon: [
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/konza-icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Konza RH',
  },

  // ── Verification ─────────────────────────────────────────────────────────
  // 👉 Étape à faire : va sur https://search.google.com/search-console,
  // ajoute ta propriété (konza-rh.cg), choisis "Balise HTML", copie le code
  // qui ressemble à "AbCdEfGh123..." et colle-le ci-dessous.
  verification: {
    google: 'Pw-_XPGXUlDyK3WOLBXinAtu_7-sB_vLJt5pg5HK3Cg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#050607',
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
        {process.env.NODE_ENV === 'development' && <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(function(regs){regs.forEach(function(reg){var sw=reg.active;if(sw&&new URL(sw.scriptURL).pathname==='/sw.js'){navigator.serviceWorker.addEventListener('controllerchange',function(){location.reload();},{once:true});reg.update().catch(function(){});}});}).catch(function(){});}` }} />}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var s=localStorage.getItem('theme');var legacy=['admin','cabinet','portefeuille','kiosk','ecran'].indexOf(location.pathname.split('/')[1])>=0;var p=(s==='light'||s==='dark'||s==='auto')?s:'auto';var d=p==='dark'||(p==='auto'&&(legacy&&!s||window.matchMedia('(prefers-color-scheme: dark)').matches));document.documentElement.classList.add(d?'dark':'light');document.documentElement.style.colorScheme=d?'dark':'light';}catch(e){document.documentElement.classList.add('light');}})();` }} />
        <script dangerouslySetInnerHTML={{ __html: appearanceBootstrap(process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || process.env.NEXT_PUBLIC_FEATURE_APPEARANCE_API !== 'false', process.env.NEXT_PUBLIC_DEMO_MODE === 'true') }} />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        {/* Preconnect pour la perf */}
        <link rel="preconnect" href="https://res.cloudinary.com" />
        {/* JSON-LD Organisation */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </head>
      <body
        className={`${jakarta.variable} ${inter.variable} ${mono.variable} font-sans antialiased`}
      >
        <DemoProvider><ThemeProvider>
          <QueryProvider>
            <AlertProvider>
              <CompanyReminderProvider>
                <SubscriptionReminderProvider>
                <NotificationProvider>
                  <RootAppearance />
                  {children}
                  <SubscriptionBlockedModal />
                  <SubscriptionEndedBanner />
                </NotificationProvider>
                </SubscriptionReminderProvider>
              </CompanyReminderProvider>
            </AlertProvider>
          </QueryProvider>
        </ThemeProvider></DemoProvider>
      </body>
    </html>
  );
}
