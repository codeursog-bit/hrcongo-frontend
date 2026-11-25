// ============================================================================
// 📁 app/blog/[slug]/BlogPostClient.tsx
// Wrapper client du composant existant, accepte initialPost pour le SSR
// ============================================================================
// 🎨 REFONTE LISIBILITÉ (2026-09-16) :
// L'ancien rendu du contenu était une simple chaîne de .replace() regex qui ne
// gérait ni les listes (- item / 1. item), ni les tableaux, ni les liens
// [texte](url) — tout ce qui n'était pas un titre/citation/gras finissait fondu
// en un seul paragraphe. Remplacé par un vrai petit parseur par blocs
// (renderArticleContent) qui produit du HTML sémantique (h2/h3/h4, ul, ol,
// table, blockquote, p, a) + extrait un sommaire (table des matières) affiché
// dans la sidebar avec suivi du scroll, et un temps de lecture estimé.
// ============================================================================
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/landing/Navbar';
import s from '@/components/landing/PublicSite.module.css';
import { Footer } from '@/components/landing/Footer';
import { sanitizeArticleHtml } from '@/lib/sanitize-html';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.konza-rh.cg';

// ── Types ─────────────────────────────────────────────────────────────────────
type Post = {
  id: string; title: string; slug: string; excerpt?: string;
  content: string; coverImage?: string; category: string; scope: string;
  likesCount: number; publishedAt: string; updatedAt: string; hasLiked?: boolean;
  author: { id: string; firstName: string; lastName: string; role: string;
    company?: { tradeName?: string; legalName: string; logo?: string } };
  company?: { tradeName?: string; legalName: string };
};

type TocEntry = { id: string; text: string; level: 2 | 3 };

// ── Constantes ────────────────────────────────────────────────────────────────
const ACCENT = 'var(--action)';

const CAT_LABEL: Record<string, string> = {
  ANNONCE:'Annonce', PAIE:'Paie & Fiscalité', DROIT_TRAVAIL:'Droit du travail',
  RECRUTEMENT:'Recrutement', FORMATION:'Formation', TEMOIGNAGE:'Témoignage', GENERAL:'Général',
};

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN:'Konza RH', ADMIN:'Administrateur',
  HR_MANAGER:'Responsable RH', CABINET_ADMIN:'Cabinet',
};

function getFingerprint(): string {
  const key = 'kz_fp';
  let fp = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
  if (!fp) {
    fp = `anon_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    if (typeof window !== 'undefined') localStorage.setItem(key, fp);
  }
  return fp!;
}

// ============================================================================
// 📝 PARSEUR DE CONTENU — remplace l'ancienne chaîne de regex.replace()
// ============================================================================
// Convention conservée (compat articles déjà publiés) :
//   # titre   → <h2>   (section principale, entre dans le sommaire)
//   ## titre  → <h3>   (sous-section, entre dans le sommaire)
//   ### titre → <h4>   (détail, n'entre pas dans le sommaire)
//   > citation → bloc "callout" mis en avant (citations légales, définitions)
//   - item / * item → <ul>
//   1. item         → <ol>
//   | a | b |  suivi de | - | - |  → tableau (barèmes, taux...)
//   **gras**, *italique*, `code`, [texte](url)
// ============================================================================

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // enlève les accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);
}

// 🔒 CORRECTIF SÉCURITÉ (audit, moyen) : le texte brut n'était jamais échappé
// avant d'être inséré dans le HTML final rendu via dangerouslySetInnerHTML.
// Un article contenant du HTML/JS brut (<script>, <img onerror=...>, un lien
// javascript:) s'exécutait donc chez TOUT visiteur public du blog. Réservé
// aux comptes admin aujourd'hui, mais aucune barrière technique n'empêchait
// un compte de rédaction (si ce rôle existe/est ajouté un jour) d'en abuser.
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;') // doit être fait EN PREMIER
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// N'autorise que des schémas d'URL inoffensifs dans les liens — bloque
// notamment javascript:, data:, vbscript:, etc.
function safeHref(url: string): string {
  const trimmed = url.trim();
  if (/^(https?:|mailto:|tel:|#|\/)/i.test(trimmed)) return trimmed;
  return '#';
}

function renderInline(text: string): string {
  // Échappement AVANT toute transformation markdown — les marqueurs
  // markdown (`, *, [, ], (, )) ne sont pas touchés par escapeHtml, donc les
  // remplacements ci-dessous continuent de fonctionner normalement.
  const escaped = escapeHtml(text);
  return escaped
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, url) => {
      return `<a href="${safeHref(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
    });
}

function renderArticleContent(markdown: string): { html: string; toc: TocEntry[] } {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const toc: TocEntry[] = [];
  const usedIds = new Set<string>();
  let html = '';
  let listType: 'ul' | 'ol' | null = null;

  const closeList = () => {
    if (listType) { html += `</${listType}>`; listType = null; }
  };

  const uniqueId = (base: string) => {
    let id = base || 'section';
    let n = 2;
    while (usedIds.has(id)) { id = `${base}-${n}`; n++; }
    usedIds.add(id);
    return id;
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) { closeList(); i++; continue; }

    let m: RegExpMatchArray | null;

    // ── Titres ────────────────────────────────────────────────────────────
    if ((m = line.match(/^### (.+)/))) {
      closeList();
      html += `<h4>${renderInline(m[1])}</h4>`;
      i++; continue;
    }
    if ((m = line.match(/^## (.+)/))) {
      closeList();
      const id = uniqueId(slugify(m[1]));
      toc.push({ id, text: m[1], level: 3 });
      html += `<h3 id="${id}">${renderInline(m[1])}</h3>`;
      i++; continue;
    }
    if ((m = line.match(/^# (.+)/))) {
      closeList();
      const id = uniqueId(slugify(m[1]));
      toc.push({ id, text: m[1], level: 2 });
      html += `<h2 id="${id}">${renderInline(m[1])}</h2>`;
      i++; continue;
    }

    // ── Citation / callout ─────────────────────────────────────────────────
    if ((m = line.match(/^> ?(.+)/))) {
      closeList();
      const quoteLines = [m[1]];
      i++;
      while (i < lines.length && lines[i].match(/^> ?(.*)/)) {
        quoteLines.push(lines[i].replace(/^> ?/, ''));
        i++;
      }
      html += `<blockquote>${quoteLines.map(l => `<p>${renderInline(l)}</p>`).join('')}</blockquote>`;
      continue;
    }

    // ── Tableau (| a | b |) ─────────────────────────────────────────────────
    if (line.trim().startsWith('|') && lines[i + 1] && /^\s*\|?[\s:-]+\|[\s:|-]*\|?\s*$/.test(lines[i + 1])) {
      closeList();
      const parseRow = (row: string) =>
        row.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
      const header = parseRow(line);
      i += 2; // saute la ligne d'en-tête + la ligne séparatrice
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(parseRow(lines[i]));
        i++;
      }
      html += '<div class="article-table-wrap"><table><thead><tr>' +
        header.map(h => `<th>${renderInline(h)}</th>`).join('') +
        '</tr></thead><tbody>' +
        rows.map(r => `<tr>${r.map(c => `<td>${renderInline(c)}</td>`).join('')}</tr>`).join('') +
        '</tbody></table></div>';
      continue;
    }

    // ── Liste non-ordonnée ───────────────────────────────────────────────────
    if ((m = line.match(/^[-*] (.+)/))) {
      if (listType !== 'ul') { closeList(); html += '<ul>'; listType = 'ul'; }
      html += `<li>${renderInline(m[1])}</li>`;
      i++; continue;
    }

    // ── Liste ordonnée ───────────────────────────────────────────────────────
    if ((m = line.match(/^\d+\. (.+)/))) {
      if (listType !== 'ol') { closeList(); html += '<ol>'; listType = 'ol'; }
      html += `<li>${renderInline(m[1])}</li>`;
      i++; continue;
    }

    // ── Séparateur ───────────────────────────────────────────────────────────
    if (/^---+$/.test(line.trim())) {
      closeList();
      html += '<hr />';
      i++; continue;
    }

    // ── Paragraphe (accumulation jusqu'à ligne vide ou nouveau bloc) ────────
    closeList();
    const para = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,3} |> ?|[-*] |\d+\. |---+$|\|)/.test(lines[i])
    ) {
      para.push(lines[i]);
      i++;
    }
    html += `<p>${renderInline(para.join(' '))}</p>`;
  }
  closeList();

  return { html, toc };
}

function estimateReadingTime(markdown: string): number {
  const plain = markdown.replace(/[#>*`\-|]/g, ' ').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  const words = plain.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  slug: string;
  initialPost: Post | null;
}

export default function BlogPostClient({ slug, initialPost }: Props) {
  const [post,    setPost]    = useState<Post | null>(initialPost);
  const [loading, setLoading] = useState(!initialPost);
  const [error,   setError]   = useState('');
  const [liked,   setLiked]   = useState(initialPost?.hasLiked || false);
  const [likes,   setLikes]   = useState(initialPost?.likesCount || 0);
  const [copied,  setCopied]  = useState(false);
  const [related, setRelated] = useState<Post[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const articleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialPost) {
      setPost(initialPost);
      setLiked(initialPost.hasLiked || false);
      setLikes(initialPost.likesCount || 0);
      // Charger les articles liés
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      fetch(`${API}/blog?category=${initialPost.category}&limit=3`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then(r => r.json())
        .then(d => setRelated((d.posts || []).filter((p: Post) => p.slug !== slug).slice(0, 3)))
        .catch(() => {});
      return;
    }

    // Fallback fetch si pas d'initialPost
    async function load() {
      setLoading(true);
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        const r = await fetch(`${API}/blog/${slug}`, {
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (r.status === 404) { setError('Article introuvable'); setLoading(false); return; }
        if (!r.ok) throw new Error('Erreur serveur');
        const d = await r.json();
        setPost(d); setLiked(d.hasLiked || false); setLikes(d.likesCount || 0);
        const rr = await fetch(`${API}/blog?category=${d.category}&limit=3`, {
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const dr = await rr.json();
        setRelated((dr.posts || []).filter((p: Post) => p.slug !== slug).slice(0, 3));
      } catch { setError('Erreur lors du chargement'); }
      setLoading(false);
    }
    load();
  }, [slug, initialPost]);

  // ── Contenu parsé + sommaire (mémoïsé, ne recalcule que si le contenu change) ──
  const { html: contentHtml, toc } = useMemo(
    () => {
      if (!post) return { html: '', toc: [] };
      const { html, toc } = renderArticleContent(post.content);
      return { html: sanitizeArticleHtml(html), toc };
    },
    [post?.content],
  );
  const readingTime = useMemo(
    () => (post ? estimateReadingTime(post.content) : 0),
    [post?.content],
  );

  // ── Sommaire : suivi de la section visible au scroll ────────────────────────
  useEffect(() => {
    if (!toc.length) return;
    const headings = toc
      .map(t => document.getElementById(t.id))
      .filter((el): el is HTMLElement => !!el);
    if (!headings.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-100px 0px -70% 0px' },
    );
    headings.forEach(h => observer.observe(h));
    return () => observer.disconnect();
  }, [toc, contentHtml]);

  async function handleLike() {
    if (!post) return;
    const prev = liked;
    setLiked(!liked);
    setLikes(l => liked ? l - 1 : l + 1);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const fp = getFingerprint();
      const r = await fetch(`${API}/blog/${slug}/like`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ fingerprint: fp }),
      });
      const d = await r.json();
      if (r.ok) { setLiked(d.liked); setLikes(d.likesCount); }
      else { setLiked(prev); setLikes(l => prev ? l + 1 : l - 1); }
    } catch {
      setLiked(prev); setLikes(l => prev ? l + 1 : l - 1);
    }
  }

  function share() {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: post?.title || 'Article Konza RH', url }).catch(() => {});
    } else if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
    }
  }

  if (loading) return (
    <div className={s.site}>
      <Navbar />
      <p role="status" className="flex min-h-screen items-center justify-center text-[var(--text-secondary)]">Chargement…</p>
    </div>
  );

  if (error || !post) return (
    <div className={s.site}>
      <Navbar />
      <div className="mx-auto max-w-xl px-6 pt-44 text-center">
        <h1 className="mb-5 text-[30px] font-semibold">{error || 'Article introuvable'}</h1>
        <Link href="/blog" className="inline-flex rounded-xl bg-[var(--text)] px-6 py-3 text-[14px] font-semibold text-[var(--surface)] transition-colors hover:bg-[var(--surface-2)]">
          ← Retour au blog
        </Link>
      </div>
      <Footer />
    </div>
  );

  const isSA   = post.author.role === 'SUPER_ADMIN';
  const author = isSA ? 'Konza RH' : `${post.author.firstName} ${post.author.lastName}`;
  const role   = ROLE_LABEL[post.author.role] || post.author.role;
  const company = post.author.company?.tradeName || post.author.company?.legalName || '';
  const date   = new Date(post.publishedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const updated = post.updatedAt && post.updatedAt !== post.publishedAt
    ? new Date(post.updatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  const cardCls = 'rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5';
  const labelCls = 'mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]';

  return (
    <div className={s.site}>
      <Navbar />

      {/* ── En-tête de l'article ── */}
      <header className="px-6 pt-16">
        <div className="mx-auto max-w-5xl">
          <nav aria-label="Fil d’Ariane" className="mb-7 flex items-center gap-2 text-[13px] text-[var(--text-secondary)]">
            <Link href="/" className="transition-colors hover:text-[var(--text)]">Accueil</Link>
            <span aria-hidden>›</span>
            <Link href="/blog" className="transition-colors hover:text-[var(--text)]">Blog RH</Link>
            <span aria-hidden>›</span>
            <span className="max-w-[280px] truncate text-[var(--text-secondary)]">{post.title}</span>
          </nav>

          <div className="mb-5 flex flex-wrap items-center gap-3 text-[12.5px]">
            <span className="font-semibold uppercase tracking-[0.1em]" style={{ color: ACCENT }}>
              {CAT_LABEL[post.category] || post.category}
            </span>
            {isSA && <span className="rounded-full border border-[var(--border)] px-2.5 py-0.5 text-[12px] text-[var(--text-secondary)]">Officiel Konza RH</span>}
          </div>

          <h1 className="max-w-3xl text-[32px] font-bold leading-[1.1] tracking-[-0.03em] sm:text-[46px]">{post.title}</h1>

          {post.excerpt && (
            <p className="mt-6 max-w-3xl border-l-2 pl-4 text-[18px] leading-relaxed text-[var(--text-secondary)]" style={{ borderColor: ACCENT }}>
              {post.excerpt}
            </p>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-7">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-[14px] font-semibold">
                {isSA ? 'K' : author[0]}
              </span>
              <div>
                <div className="text-[14px] font-semibold">{author}</div>
                <div className="text-[12.5px] text-[var(--text-secondary)]">
                  {role}{company && !isSA ? ` · ${company}` : ''} · <time dateTime={post.publishedAt}>{date}</time>
                  {updated && <> · <span title={`Mis à jour le ${updated}`}>mis à jour le {updated}</span></>}
                  {' · '}{readingTime} min de lecture
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleLike}
                aria-pressed={liked}
                className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-[13.5px] font-medium transition-colors hover:border-[var(--border)]"
                style={{ color: liked ? ACCENT : 'var(--text-secondary)' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                {likes}
              </button>
              <button
                type="button"
                onClick={share}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-[13.5px] font-medium transition-colors hover:border-[var(--border)]"
                style={{ color: copied ? ACCENT : 'var(--text-secondary)' }}
              >
                {copied ? 'Lien copié' : 'Partager'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Image de couverture ── */}
      {post.coverImage && (
        <div className="px-6 pt-8">
          <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-[var(--border)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.coverImage} alt={post.title} className="block max-h-[460px] w-full object-cover" />
          </div>
        </div>
      )}

      {/* ── Contenu ── */}
      <main id="contenu" className="px-6 pb-24 pt-10">
        <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[minmax(0,1fr)_240px]">
          <article ref={articleRef} className="article-content" dangerouslySetInnerHTML={{ __html: contentHtml }} />

          <aside className="hidden lg:block">
            <div className="sticky top-24 flex flex-col gap-5">
              {toc.length > 1 && (
                <nav aria-label="Sommaire" className={cardCls}>
                  <p className={labelCls}>Sommaire</p>
                  <div className="flex flex-col">
                    {toc.map((t) => {
                      const on = activeId === t.id;
                      return (
                        <a
                          key={t.id}
                          href={`#${t.id}`}
                          className={`border-l-2 py-1.5 text-[13px] leading-snug transition-colors ${t.level === 3 ? 'pl-6' : 'pl-3'} ${
                            on ? 'border-[var(--action)] font-semibold text-[var(--action)]' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text)]'
                          }`}
                        >
                          {t.text}
                        </a>
                      );
                    })}
                  </div>
                </nav>
              )}

              <div className={cardCls}>
                <p className={labelCls}>Auteur</p>
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-[13px] font-semibold">
                    {isSA ? 'K' : author[0]}
                  </span>
                  <div>
                    <div className="text-[13.5px] font-semibold">{author}</div>
                    <div className="text-[12px] text-[var(--text-secondary)]">{role}</div>
                  </div>
                </div>
              </div>

              {related.length > 0 && (
                <div className={cardCls}>
                  <p className={labelCls}>Articles liés</p>
                  <div className="flex flex-col gap-4">
                    {related.map((r) => (
                      <Link key={r.id} href={`/blog/${r.slug}`} className="group block">
                        <div
                          className="mb-1 text-[13.5px] font-semibold leading-snug transition-colors group-hover:text-[var(--action)]"
                          style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                        >
                          {r.title}
                        </div>
                        <div className="text-[12px] text-[var(--text-secondary)]">
                          {new Date(r.publishedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className={cardCls}>
                <p className="mb-1.5 text-[13.5px] font-semibold">Gérez la paie de votre entreprise</p>
                <p className="mb-4 text-[12.5px] leading-relaxed text-[var(--text-secondary)]">Bulletins PDF, CNSS, CAMU, congés, selon le droit congolais.</p>
                <Link href="/auth/register" className="block rounded-lg bg-[var(--text)] px-4 py-2.5 text-center text-[13px] font-semibold text-[var(--surface)] transition-colors hover:bg-[var(--surface-2)]">
                  Essayer Konza RH
                </Link>
              </div>

              <Link href="/blog" className="rounded-lg border border-[var(--border)] px-4 py-2.5 text-center text-[13px] font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border)] hover:text-[var(--text)]">
                ← Retour au blog
              </Link>
            </div>
          </aside>
        </div>

        {/* Mobile : la barre latérale est masquée, on garde l'essentiel en bas */}
        <div className="mx-auto mt-12 flex max-w-5xl flex-col gap-4 lg:hidden">
          <div className={cardCls}>
            <p className="mb-1.5 text-[14px] font-semibold">Gérez la paie de votre entreprise</p>
            <p className="mb-4 text-[13px] text-[var(--text-secondary)]">Bulletins PDF, CNSS, CAMU, congés, selon le droit congolais.</p>
            <Link href="/auth/register" className="inline-block rounded-lg bg-[var(--text)] px-5 py-2.5 text-[13.5px] font-semibold text-[var(--surface)]">
              Essayer Konza RH
            </Link>
          </div>
          <Link href="/blog" className="text-center text-[14px] text-[var(--text-secondary)] hover:text-[var(--text)]">← Retour au blog</Link>
        </div>
      </main>

      <Footer />

      {/* Typographie du corps d'article (limitée à .article-content : plus de reset global) */}
      <style>{`
        .article-content{scroll-behavior:smooth}
        .article-content{font-size:16.5px;color:var(--text-secondary);line-height:1.85}
        .article-content h2{
          scroll-margin-top:100px;font-size:clamp(22px,2.6vw,30px);font-weight:700;color:var(--text);
          letter-spacing:-0.02em;margin:48px 0 16px;padding-top:12px;border-top:1px solid var(--border);
        }
        .article-content h2:first-child{border-top:none;padding-top:0;margin-top:0}
        .article-content h3{scroll-margin-top:100px;font-size:21px;font-weight:650;color:var(--text);margin:32px 0 12px}
        .article-content h4{font-size:17px;font-weight:650;color:var(--text);margin:24px 0 8px}
        .article-content p{margin:0 0 18px;font-size:16.5px;color:var(--text-secondary);line-height:1.85}
        .article-content strong{color:var(--text);font-weight:650}
        .article-content em{font-style:italic}
        .article-content code{background:var(--border);padding:2px 6px;border-radius:4px;font-family:ui-monospace,monospace;font-size:13.5px;color:${ACCENT}}
        .article-content a{color:${ACCENT};text-decoration:underline;text-underline-offset:3px}
        .article-content a:hover{color:var(--brand-strong)}
        .article-content hr{border:none;border-top:1px solid var(--border);margin:32px 0}

        .article-content ul,.article-content ol{margin:0 0 20px;padding-left:0;list-style:none}
        .article-content ul li,.article-content ol li{position:relative;padding-left:28px;margin-bottom:10px;font-size:16.5px;line-height:1.7;color:var(--text-secondary)}
        .article-content ul li::before{content:'';position:absolute;left:6px;top:12px;width:6px;height:6px;border-radius:50%;background:${ACCENT}}
        .article-content ol{counter-reset:kz-ol}
        .article-content ol li{counter-increment:kz-ol}
        .article-content ol li::before{
          content:counter(kz-ol);position:absolute;left:0;top:3px;width:20px;height:20px;border-radius:6px;
          background:var(--brand-soft);color:${ACCENT};font-size:11.5px;font-weight:700;display:flex;align-items:center;justify-content:center;
        }

        .article-content blockquote{margin:24px 0;padding:16px 20px;border-left:3px solid ${ACCENT};background:var(--brand-soft);border-radius:0 10px 10px 0}
        .article-content blockquote p{font-style:italic;color:var(--text-secondary);margin:0 0 6px;font-size:15.5px}
        .article-content blockquote p:last-child{margin-bottom:0}

        .article-table-wrap{margin:24px 0;overflow-x:auto;border:1px solid var(--border);border-radius:12px}
        .article-content table{width:100%;border-collapse:collapse;font-size:14px}
        .article-content thead th{background:var(--surface-2);color:var(--text);font-weight:650;text-align:left;padding:10px 14px;border-bottom:1px solid var(--border);white-space:nowrap}
        .article-content tbody td{padding:10px 14px;border-bottom:1px solid var(--border);color:var(--text-secondary)}
        .article-content tbody tr:last-child td{border-bottom:none}
        .article-content tbody tr:hover{background:var(--surface-2)}
        @media(max-width:768px){.article-content{font-size:15.5px}.article-content p,.article-content li{font-size:15.5px!important}}
      `}</style>
    </div>
  );
}