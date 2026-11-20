'use client';
// ============================================================================
// 📁 app/blog/BlogClient.tsx — Blog public
// Tout le monde voit les articles GLOBAL. Like : empreinte anonyme (pas d'auth).
// Même esprit que l'accueil : fond sombre, un seul accent orange.
// Logique inchangée : blogApi.list / blogApi.like, filtres, recherche, pagination.
// ============================================================================
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { blogApi, BlogPostSummary, BlogCategory } from '@/services/blog-api';

const ACCENT = '#FF9A62';

const CATS = [
  { value: '' as const,              label: 'Tous'          },
  { value: 'ANNONCE' as const,       label: 'Annonces'      },
  { value: 'PAIE' as const,          label: 'Paie & Fisc.'  },
  { value: 'DROIT_TRAVAIL' as const, label: 'Droit travail' },
  { value: 'RECRUTEMENT' as const,   label: 'Recrutement'   },
  { value: 'FORMATION' as const,     label: 'Formation'     },
  { value: 'TEMOIGNAGE' as const,    label: 'Témoignages'   },
  { value: 'GENERAL' as const,       label: 'Général'       },
];

const clamp = (n: number): React.CSSProperties => ({
  display: '-webkit-box', WebkitLineClamp: n, WebkitBoxOrient: 'vertical', overflow: 'hidden',
});

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function Avatar({ initial, size = 26 }: { initial: string; size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-white/10 font-semibold text-[#F2F2F2]"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initial}
    </span>
  );
}

function authorName(post: BlogPostSummary) {
  return post.author.role === 'SUPER_ADMIN' ? 'Konza RH' : `${post.author.firstName} ${post.author.lastName}`;
}

// ─── Carte d'article ─────────────────────────────────────────────────────────
function PostCard({
  post, onLike, onShare, copied,
}: { post: BlogPostSummary; onLike: (slug: string) => void; onShare: (post: BlogPostSummary) => void; copied: boolean }) {
  const isSA = post.author.role === 'SUPER_ADMIN';
  const date = new Date(post.publishedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  const catLabel = CATS.find((c) => c.value === post.category)?.label || post.category;
  const company = post.author.company?.tradeName || post.author.company?.legalName || '';

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0c0d] transition-colors hover:border-white/[0.18]">
      {post.coverImage && (
        <Link href={`/blog/${post.slug}`} className="block h-44 shrink-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.coverImage}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </Link>
      )}

      <div className="flex flex-1 flex-col gap-3 p-6">
        <div className="flex items-center gap-3 text-[12px]">
          <span className="font-semibold uppercase tracking-[0.1em]" style={{ color: ACCENT }}>{catLabel}</span>
          {isSA && <span className="rounded-full border border-white/15 px-2 py-0.5 text-[11px] text-[#d6d6d6]">Officiel</span>}
        </div>

        <Link href={`/blog/${post.slug}`}>
          <h3 className="text-[18px] font-semibold leading-snug tracking-[-0.01em] text-[#F2F2F2]" style={clamp(2)}>
            {post.title}
          </h3>
        </Link>

        {post.excerpt && <p className="text-[14px] leading-relaxed text-[#9a9a9a]" style={clamp(2)}>{post.excerpt}</p>}

        <div className="mt-auto flex items-center gap-2 pt-2 text-[12.5px] text-[#9a9a9a]">
          <Avatar initial={isSA ? 'K' : post.author.firstName[0]} />
          <span className="truncate font-medium text-[#d6d6d6]">{authorName(post)}</span>
          {company && !isSA && <span className="truncate">· {company}</span>}
        </div>

        <div className="flex items-center justify-between border-t border-white/[0.08] pt-3">
          <span className="text-[12px] text-[#6f6f6f]">{date}</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onLike(post.slug)}
              aria-pressed={post.hasLiked}
              aria-label="J’aime"
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium transition-colors hover:bg-white/[0.05]"
              style={{ color: post.hasLiked ? ACCENT : '#9a9a9a' }}
            >
              <HeartIcon filled={!!post.hasLiked} /> {post.likesCount}
            </button>
            <button
              type="button"
              onClick={() => onShare(post)}
              aria-label="Partager"
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] text-[#9a9a9a] transition-colors hover:bg-white/[0.05] hover:text-[#F2F2F2]"
            >
              <ShareIcon /> {copied && <span style={{ color: ACCENT }}>Lien copié</span>}
            </button>
            <Link href={`/blog/${post.slug}`} className="px-2 py-1 text-[12.5px] font-semibold" style={{ color: ACCENT }}>
              Lire →
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function BlogPage() {
  const [posts,    setPosts]    = useState<BlogPostSummary[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);
  const [totalPgs, setTotalPgs] = useState(1);
  const [cat,      setCat]      = useState<BlogCategory | ''>('');
  const [search,   setSearch]   = useState('');
  const [dSearch,  setDSearch]  = useState('');
  const [copiedSlug, setCopiedSlug] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { setDSearch(search); setPage(1); }, 400);
    return () => clearTimeout(timer.current);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await blogApi.list({ page, limit: 12, ...(cat ? { category: cat } : {}), ...(dSearch ? { q: dSearch } : {}) });
      const likedSet = new Set<string>(JSON.parse(localStorage.getItem('kz_liked_posts') || '[]'));
      setPosts(res.posts.map((p) => ({ ...p, hasLiked: p.hasLiked || likedSet.has(p.slug) })));
      setTotalPgs(res.pagination.totalPages);
    } catch { setPosts([]); }
    setLoading(false);
  }, [page, cat, dSearch]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [cat, dSearch]);

  async function handleLike(slug: string) {
    setPosts((p) => p.map((post) => post.slug === slug
      ? { ...post, hasLiked: !post.hasLiked, likesCount: post.hasLiked ? post.likesCount - 1 : post.likesCount + 1 }
      : post));
    try {
      const res = await blogApi.like(slug);
      setPosts((p) => p.map((post) => post.slug === slug ? { ...post, hasLiked: res.liked, likesCount: res.likesCount } : post));
      const set = new Set<string>(JSON.parse(localStorage.getItem('kz_liked_posts') || '[]'));
      if (res.liked) set.add(slug); else set.delete(slug);
      localStorage.setItem('kz_liked_posts', JSON.stringify(Array.from(set)));
    } catch { load(); }
  }

  async function handleShare(post: BlogPostSummary) {
    const url = `${window.location.origin}/blog/${post.slug}`;
    if (navigator.share) { navigator.share({ title: post.title, url }).catch(() => {}); return; }
    try {
      await navigator.clipboard.writeText(url);
      setCopiedSlug(post.slug);
      setTimeout(() => setCopiedSlug(''), 2000);
    } catch { /* presse-papiers indisponible */ }
  }

  const showFeatured = !dSearch && page === 1 && posts.length > 0;
  const featured = showFeatured ? posts[0] : null;
  const gridPosts = showFeatured ? posts.slice(1) : posts;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050607] font-sans text-[#F2F2F2]">
      <Navbar />

      {/* ── Titre ── */}
      <section className="relative px-6 pb-14 pt-36">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(55% 60% at 20% 0%, rgba(247,135,75,.12), transparent 70%)' }}
        />
        <div className="relative mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <div className="mb-4 text-[13px] font-semibold uppercase tracking-[0.12em]" style={{ color: ACCENT }}>Blog RH</div>
            <h1 className="text-[36px] font-bold leading-[1.08] tracking-[-0.03em] sm:text-[52px]">
              Partages et actualités de la <span style={{ color: ACCENT }}>communauté RH</span>
            </h1>
            <p className="mt-5 text-[17px] leading-relaxed text-[#9a9a9a]">
              Bonnes pratiques, actualités fiscales et retours d’expérience, partagés par les RH du Congo.
            </p>
          </div>
          <Link
            href="/auth/login"
            className="rounded-xl border border-white/10 px-5 py-2.5 text-[14px] font-medium text-[#d6d6d6] transition-colors hover:border-white/25 hover:bg-white/[0.04]"
          >
            Se connecter pour publier
          </Link>
        </div>
      </section>

      {/* ── Filtres ── */}
      <section className="border-y border-white/[0.06]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Catégories">
            {CATS.map((c) => {
              const on = cat === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCat(c.value)}
                  aria-pressed={on}
                  className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                    on ? 'border-[#FF9A62] text-[#FF9A62]' : 'border-white/10 text-[#9a9a9a] hover:border-white/25 hover:text-[#F2F2F2]'
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
          <div className="relative">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6f6f6f" strokeWidth="2" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher…"
              aria-label="Rechercher un article"
              className="w-52 rounded-lg border border-white/10 bg-[#0c0c0d] py-2 pl-9 pr-3 text-[13.5px] text-[#F2F2F2] outline-none transition-colors placeholder:text-[#5a5a5a] focus:border-[#FF9A62]/60"
            />
          </div>
        </div>
      </section>

      {/* ── Contenu ── */}
      <section>
        <div className="mx-auto max-w-6xl px-6 py-14">
          {loading ? (
            <p role="status" className="py-20 text-center text-[#9a9a9a]">Chargement…</p>
          ) : posts.length === 0 ? (
            <div className="py-20 text-center">
              <h3 className="mb-2 text-[20px] font-semibold">Aucun article</h3>
              <p className="text-[14px] text-[#9a9a9a]">
                {dSearch ? `Aucun résultat pour « ${dSearch} »` : 'Pas encore d’articles.'}
              </p>
            </div>
          ) : (
            <>
              {/* À la une */}
              {featured && (
                <div className="mb-14">
                  <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#6f6f6f]">À la une</p>
                  <div className="grid overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0c0d] md:grid-cols-2">
                    <div className="relative min-h-[220px] md:min-h-[320px]">
                      {featured.coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={featured.coverImage} alt={featured.title} className="absolute inset-0 h-full w-full object-cover" />
                      ) : (
                        <div className="absolute inset-0" style={{ background: 'radial-gradient(80% 80% at 30% 20%, rgba(247,135,75,.18), #0c0c0d)' }} />
                      )}
                    </div>
                    <div className="flex flex-col justify-center gap-4 p-8 sm:p-10">
                      <div className="flex items-center gap-2.5 text-[12.5px] text-[#9a9a9a]">
                        <Avatar initial={featured.author.role === 'SUPER_ADMIN' ? 'K' : featured.author.firstName[0]} size={28} />
                        <span className="font-medium text-[#d6d6d6]">{authorName(featured)}</span>
                        <span>· {new Date(featured.publishedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                      </div>
                      <Link href={`/blog/${featured.slug}`}>
                        <h2 className="text-[26px] font-semibold leading-tight tracking-[-0.02em] sm:text-[32px]">{featured.title}</h2>
                      </Link>
                      {featured.excerpt && <p className="text-[15px] leading-relaxed text-[#9a9a9a]" style={clamp(3)}>{featured.excerpt}</p>}
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <Link
                          href={`/blog/${featured.slug}`}
                          className="rounded-xl bg-[#FAFAFA] px-5 py-2.5 text-[14px] font-semibold text-black transition-colors hover:bg-white"
                        >
                          Lire l’article
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleLike(featured.slug)}
                          aria-pressed={featured.hasLiked}
                          className="flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2.5 text-[13.5px] font-medium transition-colors hover:border-white/25"
                          style={{ color: featured.hasLiked ? ACCENT : '#9a9a9a' }}
                        >
                          <HeartIcon filled={!!featured.hasLiked} /> {featured.likesCount}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Grille */}
              {gridPosts.length > 0 && (
                <>
                  <p className="mb-5 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#6f6f6f]">
                    {showFeatured ? 'Derniers articles' : `${posts.length} article${posts.length > 1 ? 's' : ''}`}
                  </p>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {gridPosts.map((p) => (
                      <PostCard key={p.id} post={p} onLike={handleLike} onShare={handleShare} copied={copiedSlug === p.slug} />
                    ))}
                  </div>
                </>
              )}

              {/* Pagination */}
              {totalPgs > 1 && (
                <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-lg border border-white/10 px-4 py-2 text-[13px] font-medium text-[#d6d6d6] transition-colors hover:border-white/25 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ← Préc.
                  </button>
                  {Array.from({ length: Math.min(5, totalPgs) }, (_, i) => {
                    const pg = Math.max(1, Math.min(totalPgs - 4, page - 2)) + i;
                    const on = pg === page;
                    return (
                      <button
                        key={pg}
                        type="button"
                        onClick={() => setPage(pg)}
                        aria-current={on ? 'page' : undefined}
                        className={`h-9 w-9 rounded-lg border text-[13px] font-semibold transition-colors ${
                          on ? 'border-[#FF9A62] text-[#FF9A62]' : 'border-white/10 text-[#9a9a9a] hover:border-white/25'
                        }`}
                      >
                        {pg}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPgs, p + 1))}
                    disabled={page === totalPgs}
                    className="rounded-lg border border-white/10 px-4 py-2 text-[13px] font-medium text-[#d6d6d6] transition-colors hover:border-white/25 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Suiv. →
                  </button>
                </nav>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}