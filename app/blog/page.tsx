// ============================================================================
// 📁 app/blog/page.tsx — Blog Konza RH · SEO-first
// ✅ generateMetadata → title/description dynamiques
// ✅ JSON-LD Blog + BreadcrumbList
// ✅ sitemap.ts → toutes les URLs
// ============================================================================
import type { Metadata } from 'next';
import BlogClientPage from './BlogClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://konza.cg';

export const metadata: Metadata = {
  title: 'Blog RH Congo — Paie, Droit du travail, Fiscalité 2026',
  description:
    'Actualités RH Congo-Brazzaville : ITS 2026, CAMU, CNSS, TUS, droit du travail congolais, gestion paie. Articles par des DRH et l\'équipe Konza.',
  alternates: {
    canonical: `${SITE_URL}/blog`,
  },
  openGraph: {
    title: 'Blog RH Congo — Paie, Fiscalité & Droit du travail',
    description:
      'Actualités RH Congo-Brazzaville : ITS 2026, CAMU, CNSS, TUS, droit du travail congolais.',
    url: `${SITE_URL}/blog`,
    type: 'website',
    images: [{ url: `${SITE_URL}/og/blog.png`, width: 1200, height: 630 }],
  },
};

// JSON-LD Blog
const blogJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: 'Blog RH Konza — Congo-Brazzaville',
  description: 'Actualités RH, paie et fiscalité pour les entreprises congolaises.',
  url: `${SITE_URL}/blog`,
  inLanguage: 'fr-CG',
  publisher: {
    '@type': 'Organization',
    name: 'Konza RH',
    url: SITE_URL,
    logo: { '@type': 'ImageObject', url: `${SITE_URL}/logos/konza_logo_h_color.png` },
  },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Blog RH', item: `${SITE_URL}/blog` },
  ],
};

export default function BlogPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <BlogClientPage />
    </>
  );
}