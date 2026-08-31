// ============================================================================
// 📁 app/sitemap.ts — Sitemap dynamique Konza RH
// ✅ Pages statiques + articles blog (ISR)
// ✅ Priorités et changefreq optimisés SEO
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
      lastModified: new Date(),
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
      url: `${SITE_URL}/tarifs`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/qui-sommes-nous`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/outils`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/outils/calcul-cnss-congo`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/outils/calcul-its-congo`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/outils/calcul-camu-congo`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/outils/calcul-heures-supplementaires-congo`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/outils/calcul-tus-congo`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
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