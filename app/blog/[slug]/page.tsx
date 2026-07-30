// ============================================================================
// 📁 app/blog/[slug]/page.tsx — Article blog · SEO-first
// ✅ generateMetadata → title / description / OG dynamiques par article
// ✅ JSON-LD Article schema.org
// ✅ Rendu mixte : metadata côté serveur, contenu côté client
// ============================================================================
import type { Metadata } from 'next';
import BlogPostClient from './BlogPostClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://konza-rh.cg';
const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.konza-rh.cg';

// ── Fetch server-side pour les metadata ──────────────────────────────────────
async function getPostMeta(slug: string) {
  try {
    const res = await fetch(`${API}/blog/${slug}`, {
      next: { revalidate: 3600 }, // ISR : revalide toutes les heures
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ── generateMetadata ─────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostMeta(slug);

  if (!post) {
    return {
      title: 'Article introuvable',
      description: 'Cet article n\'existe pas ou a été supprimé.',
    };
  }

  const isSA = post.author?.role === 'SUPER_ADMIN';
  const authorName = isSA
    ? 'Konza RH'
    : `${post.author?.firstName} ${post.author?.lastName}`;

  const title = post.title;
  const description =
    post.excerpt ||
    post.content?.slice(0, 155).replace(/[#*>\-`\n]/g, ' ').trim() + '…';

  const ogImage = post.coverImage || `${SITE_URL}/og/blog.png`;

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/blog/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/blog/${slug}`,
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [authorName],
      tags: [post.category],
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostMeta(slug);

  // JSON-LD Article
  const articleJsonLd = post
    ? {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.title,
        description:
          post.excerpt ||
          post.content?.slice(0, 155).replace(/[#*>\-`\n]/g, ' ').trim(),
        image: post.coverImage || `${SITE_URL}/og/blog.png`,
        datePublished: post.publishedAt,
        dateModified: post.updatedAt || post.publishedAt,
        url: `${SITE_URL}/blog/${slug}`,
        inLanguage: 'fr-CG',
        author: {
          '@type': post.author?.role === 'SUPER_ADMIN' ? 'Organization' : 'Person',
          name:
            post.author?.role === 'SUPER_ADMIN'
              ? 'Konza RH'
              : `${post.author?.firstName} ${post.author?.lastName}`,
          url: SITE_URL,
        },
        publisher: {
          '@type': 'Organization',
          name: 'Konza RH',
          url: SITE_URL,
          logo: {
            '@type': 'ImageObject',
            url: `${SITE_URL}/logos/konza_logo_h_color.png`,
          },
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `${SITE_URL}/blog/${slug}`,
        },
        keywords: [
          post.category,
          'RH Congo',
          'paie Congo-Brazzaville',
          'droit travail Congo',
        ].join(', '),
      }
    : null;

  // JSON-LD BreadcrumbList
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog RH', item: `${SITE_URL}/blog` },
      {
        '@type': 'ListItem',
        position: 3,
        name: post?.title || slug,
        item: `${SITE_URL}/blog/${slug}`,
      },
    ],
  };

  return (
    <>
      {articleJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {/* Le rendu client existant passe ici inchangé */}
      <BlogPostClient slug={slug} initialPost={post} />
    </>
  );
}