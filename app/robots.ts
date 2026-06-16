// ============================================================================
// 📁 app/robots.ts — Robots.txt dynamique
// ✅ Bloque les routes dashboard/admin pour les crawlers
// ✅ Autorise toutes les pages publiques + sitemap
// ============================================================================
import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://konza-rh.cg';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/blog',
          '/blog/',
          '/simulateur',
          '/outils',
          '/outils/',
          '/tarifs',
          '/contact',
          '/qui-sommes-nous',
        ],
        disallow: [
          '/dashboard',
          '/paie/',
          '/employes/',
          '/conges/',
          '/parametres/',
          '/admin/',
          '/auth/',
          '/pme/',
          '/cabinet/',
          '/api/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin/', '/api/', '/auth/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}