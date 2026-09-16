import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://konza-rh.cg';

// ⚠️ En robots.txt, un groupe de règles propre à un user-agent (ex: Googlebot)
// REMPLACE entièrement le groupe générique '*' pour ce bot — les règles ne
// s'additionnent jamais. Avant ce fix, Googlebot/Bingbot avaient leur propre
// groupe avec une liste "disallow" beaucoup plus courte que celle du groupe
// '*', ce qui les autorisait explicitement à crawler /dashboard, /paie/,
// /employes/, /conges/, /parametres/, /pme/, /cabinet/ — l'inverse de
// l'intention. On utilise donc désormais la MÊME liste complète partout.
const PRIVATE_PATHS = [
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
  '/companies/create',
  '/affiliate/dashboard',
];

const PUBLIC_ALLOW = [
  '/',
  '/blog',
  '/blog/',
  '/simulateur',
  '/outils',
  '/outils/',
  '/tarifs',
  '/contact',
  '/qui-sommes-nous',
  '/entreprises',
  '/entreprises/',
  '/jobs',
  '/jobs/',
  '/docs',
  '/register',
  '/verify/',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: PUBLIC_ALLOW,
        disallow: PRIVATE_PATHS,
      },
      {
        userAgent: 'Googlebot',
        allow: PUBLIC_ALLOW,
        disallow: PRIVATE_PATHS,
      },
      {
        userAgent: 'Bingbot',
        allow: PUBLIC_ALLOW,
        disallow: PRIVATE_PATHS,
      },
      {
        userAgent: ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'ClaudeBot', 'anthropic-ai'],
        allow: PUBLIC_ALLOW,
        disallow: PRIVATE_PATHS,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}