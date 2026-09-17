// ============================================================================
// 📁 app/sitemap.ts — Sitemap dynamique Konza RH
// ✅ Pages statiques + articles blog (ISR)
// ✅ Priorités et changefreq optimisés SEO
// ============================================================================
// 🐛 FIX (2026-09-16) :
// 1. Ajout de /entreprises, /jobs, /jobs/portal, /docs — pages publiques
//    confirmées indexables, absentes du sitemap jusqu'ici.
// 2. `lastModified: new Date()` était posé sur CHAQUE page statique, à
//    chaque build — donc Google recevait "modifié aujourd'hui" en
//    permanence même pour des pages qui ne changent jamais (/contact,
//    /qui-sommes-nous...). Google finit par considérer ce signal comme
//    non fiable et l'ignore totalement. On ne le garde que là où c'est
//    vrai : l'accueil, la liste du blog, et les articles (vrai updatedAt).
// ============================================================================
import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://konza-rh.cg';
const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.konza-rh.cg';

async function getBlogSlugs(): Promise<Array<{ slug: string; updatedAt: string }>> {
  try {
    const res = await fetch(`${API}/blog?limit=500&page=1`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.posts || []).map((p: any) => ({
      slug: p.slug,
      updatedAt: p.updatedAt || p.publishedAt,
    }));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const blogPosts = await getBlogSlugs();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/simulateur`,
      changeFrequency: 'monthly',
      priority: 0.95,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/outils`,
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/outils/calcul-cnss-congo`,
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/outils/calcul-its-congo`,
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/outils/calcul-camu-congo`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/outils/calcul-heures-supplementaires-congo`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/outils/calcul-tus-congo`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/tarifs`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/entreprises`,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/jobs/portal`,
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/jobs`,
      changeFrequency: 'daily',
      priority: 0.65,
    },
    {
      url: `${SITE_URL}/docs`,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/contact`,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/qui-sommes-nous`,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  const blogPages: MetadataRoute.Sitemap = blogPosts.map(({ slug, updatedAt }) => ({
    url: `${SITE_URL}/blog/${slug}`,
    lastModified: new Date(updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.75,
  }));

  return [...staticPages, ...blogPages];
}