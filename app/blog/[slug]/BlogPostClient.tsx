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

// Ce fichier est juste un re-export de ton composant existant app/blog/[slug]/page.tsx
// en le transformant pour accepter des props (initialPost) depuis le Server Component.
// Tu colles ici le corps de ton BlogPostPage existant, en remplaçant :
//   const params = useParams(); const slug = params?.slug as string;
// par les props :
//   export default function BlogPostClient({ slug, initialPost }: Props)
// Et tu utilises initialPost pour pré-remplir le state (évite le premier fetch côté client)

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';

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
const C = {
  bg:'#050607', card:'#0B0C0F',
  border:'rgba(255,255,255,0.07)',
  cyan:'#10B981', blue:'#059669', purple:'#64748B',
  green:'#10B981', pink:'#EC4899',
  text:'#F8FAFC', muted:'#64748B', sub:'#94A3B8',
};

const CAT_COLOR: Record<string, { bg: string; c: string }> = {
  ANNONCE:      { bg:'rgba(245,158,11,0.12)',  c:'#F59E0B' },
  PAIE:         { bg:'rgba(45,212,191,0.12)',   c:'#2DD4BF' },
  DROIT_TRAVAIL:{ bg:'rgba(100,116,139,0.12)',  c:'#64748B' },
  RECRUTEMENT:  { bg:'rgba(16,185,129,0.12)',  c:'#10B981' },
  FORMATION:    { bg:'rgba(5,150,105,0.12)',  c:'#059669' },
  TEMOIGNAGE:   { bg:'rgba(236,72,153,0.12)', c:'#EC4899' },
  GENERAL:      { bg:'rgba(100,116,139,0.12)', c:'#94A3B8' },
};

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

function renderInline(text: string): string {
  return text
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
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
    () => (post ? renderArticleContent(post.content) : { html: '', toc: [] }),
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
    <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui,sans-serif' }}>
      <Navbar />
      <p style={{ color: C.muted, zIndex: 1 }}>Chargement...</p>
    </div>
  );

  if (error || !post) return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: 'system-ui,sans-serif', color: C.text }}>
      <Navbar />
      <div style={{ maxWidth: 640, margin: '160px auto 0', padding: '0 32px', textAlign: 'center', zIndex: 1, position: 'relative' }}>
        <div style={{ fontSize: 56, marginBottom: 20 }}>📭</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: C.text, marginBottom: 12 }}>{error || 'Article introuvable'}</h1>
        <Link href="/blog" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#FAFAFA', color: '#000', textDecoration: 'none', fontWeight: 500, fontSize: 14, padding: '11px 22px', borderRadius: 10 }}>
          ← Retour au blog
        </Link>
      </div>
      <Footer />
    </div>
  );

  const cc     = CAT_COLOR[post.category] || CAT_COLOR.GENERAL;
  const isSA   = post.author.role === 'SUPER_ADMIN';
  const author = isSA ? 'Konza RH' : `${post.author.firstName} ${post.author.lastName}`;
  const role   = ROLE_LABEL[post.author.role] || post.author.role;
  const company = post.author.company?.tradeName || post.author.company?.legalName || '';
  const date   = new Date(post.publishedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const updated = post.updatedAt && post.updatedAt !== post.publishedAt
    ? new Date(post.updatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: "system-ui,-apple-system,'Segoe UI',sans-serif", color: C.text, position: 'relative', overflowX: 'hidden' }}>
      <div style={{ position:'fixed', top:-160, right:-160, width:600, height:600, borderRadius:'50%',
        background:'rgba(255,255,255,0.04)', filter:'blur(130px)', pointerEvents:'none', zIndex:0 }}/>
      <div style={{ position:'fixed', left:-160, bottom:0, width:500, height:500, borderRadius:'50%',
        background:'rgba(212,165,72,0.06)', filter:'blur(130px)', pointerEvents:'none', zIndex:0 }}/>
      <Navbar />

      <section style={{ padding: '130px 32px 0', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 840, margin: '0 auto' }}>

          {/* Breadcrumb SEO-friendly */}
          <nav aria-label="breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 13 }}>
            <Link href="/" style={{ color: C.muted, textDecoration: 'none' }}>Accueil</Link>
            <span style={{ color: C.border }}>›</span>
            <Link href="/blog" style={{ color: C.muted, textDecoration: 'none' }}>Blog RH</Link>
            <span style={{ color: C.border }}>›</span>
            <span style={{ color: C.sub, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title}</span>
          </nav>

          {/* Catégorie */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: cc.c, background: cc.bg, border: `1px solid ${cc.c}30`, padding: '4px 12px', borderRadius: 99 }}>
              {CAT_LABEL[post.category] || post.category}
            </span>
            {isSA && <span style={{ fontSize: 12, fontWeight: 800, color: '#fff', background: 'linear-gradient(135deg,#10B981,#059669)', padding: '4px 12px', borderRadius: 99 }}>Officiel Konza RH</span>}
          </div>

          {/* H1 — balise la plus importante SEO */}
          <h1 style={{ fontSize: 'clamp(28px,5vw,48px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1, color: C.text, marginBottom: 20 }}>
            {post.title}
          </h1>

          {/* Excerpt en italique */}
          {post.excerpt && (
            <p style={{ fontSize: 18, color: C.sub, lineHeight: 1.7, marginBottom: 24, fontStyle: 'italic', borderLeft: `3px solid ${cc.c}`, paddingLeft: 16 }}>
              {post.excerpt}
            </p>
          )}

          {/* Meta auteur + actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, paddingBottom: 28, borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg,${isSA ? C.cyan : C.blue},${isSA ? C.blue : C.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff' }}>
                {isSA ? 'K' : author[0]}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{author}</div>
                <div style={{ fontSize: 12, color: C.muted }}>
                  {role}{company && !isSA ? ` · ${company}` : ''} · <time dateTime={post.publishedAt}>{date}</time>
                  {updated && <> · <span title={`Mis à jour le ${updated}`}>mis à jour {updated}</span></>}
                  {' · '}{readingTime} min de lecture
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleLike} style={{ display: 'flex', alignItems: 'center', gap: 6, background: liked ? 'rgba(236,72,153,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${liked ? C.pink + '40' : C.border}`, borderRadius: 9, padding: '8px 14px', cursor: 'pointer', color: liked ? C.pink : C.muted, fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                {likes}
              </button>
              <button onClick={share} style={{ display: 'flex', alignItems: 'center', gap: 6, background: copied ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${copied ? C.green + '40' : C.border}`, borderRadius: 9, padding: '8px 14px', cursor: 'pointer', color: copied ? C.green : C.muted, fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>
                {copied ? '✓ Copié !' : 'Partager'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Cover image */}
      {post.coverImage && (
        <section style={{ position: 'relative', zIndex: 1, padding: '32px 32px 0' }}>
          <div style={{ maxWidth: 840, margin: '0 auto', borderRadius: 16, overflow: 'hidden', border: `1px solid ${C.border}` }}>
            <img src={post.coverImage} alt={post.title} style={{ width: '100%', height: 'auto', maxHeight: 440, objectFit: 'cover', display: 'block' }} />
          </div>
        </section>
      )}

      {/* Contenu article */}
      <section style={{ position: 'relative', zIndex: 1, padding: '40px 32px 80px' }}>
        <div style={{ maxWidth: 840, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 220px', gap: 48, alignItems: 'start' }} className="article-layout">
          <article
            ref={articleRef}
            className="article-content"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />

          {/* Sidebar sticky */}
          <aside style={{ position: 'sticky', top: 100, display: 'flex', flexDirection: 'column', gap: 20 }} className="article-sidebar">

            {/* Sommaire — nouveau, suit la section active au scroll */}
            {toc.length > 1 && (
              <nav aria-label="Sommaire" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Sommaire</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {toc.map(t => (
                    <a
                      key={t.id}
                      href={`#${t.id}`}
                      style={{
                        fontSize: 12.5,
                        lineHeight: 1.5,
                        padding: t.level === 3 ? '5px 0 5px 14px' : '5px 0',
                        color: activeId === t.id ? cc.c : C.sub,
                        fontWeight: activeId === t.id ? 700 : 500,
                        borderLeft: `2px solid ${activeId === t.id ? cc.c : 'transparent'}`,
                        paddingLeft: t.level === 3 ? 14 : 10,
                        textDecoration: 'none',
                        transition: 'color .15s, border-color .15s',
                      }}
                    >
                      {t.text}
                    </a>
                  ))}
                </div>
              </nav>
            )}

            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Auteur</p>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: `linear-gradient(135deg,${isSA ? C.cyan : C.blue},${isSA ? C.blue : C.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff' }}>
                  {isSA ? 'K' : author[0]}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{author}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{role}</div>
                </div>
              </div>
            </div>

            {related.length > 0 && (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Articles liés</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {related.map(r => (
                    <Link key={r.id} href={`/blog/${r.slug}`} style={{ textDecoration: 'none' }}>
                      <div style={{ padding: 10, borderRadius: 9 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, lineHeight: 1.35, marginBottom: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.title}</div>
                        <div style={{ fontSize: 11, color: C.muted }}>{new Date(r.publishedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* CTA konza dans la sidebar */}
            <div style={{ background: 'linear-gradient(135deg,rgba(71,85,105,0.15),rgba(100,116,139,0.1))', border: '1px solid rgba(71,85,105,0.2)', borderRadius: 14, padding: 18 }}>
              <p style={{ fontSize: 12, fontWeight: 800, color: C.text, marginBottom: 6 }}>Gérez la paie de votre entreprise</p>
              <p style={{ fontSize: 11, color: C.sub, lineHeight: 1.5, marginBottom: 12 }}>Bulletins PDF, CNSS, CAMU, congés — conforme droit congolais.</p>
              <Link href="/auth/register"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'linear-gradient(135deg,#475569,#64748B)', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 12, padding: '8px 14px', borderRadius: 9 }}>
                Essayer Konza →
              </Link>
            </div>

            <Link href="/blog" style={{ display: 'flex', alignItems: 'center', gap: 7, color: C.muted, textDecoration: 'none', fontSize: 13, fontWeight: 600, padding: 10, borderRadius: 9, border: `1px solid ${C.border}`, justifyContent: 'center' }}>
              ← Retour au blog
            </Link>
          </aside>
        </div>
      </section>

      <Footer />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        ::-webkit-scrollbar{width:6px;background:#050607}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:3px}

        /* ── Typographie du corps d'article ─────────────────────────────── */
        .article-content{font-size:16px;color:${C.sub};line-height:1.85}
        .article-content h2{
          scroll-margin-top:100px;
          font-size:clamp(20px,2.5vw,28px);font-weight:900;color:${C.text};
          letter-spacing:-0.03em;margin:44px 0 16px;padding-top:8px;
          border-top:1px solid ${C.border};
        }
        .article-content h2:first-child{border-top:none;padding-top:0;margin-top:0}
        .article-content h3{scroll-margin-top:100px;font-size:20px;font-weight:800;color:${C.text};margin:30px 0 12px}
        .article-content h4{font-size:16.5px;font-weight:700;color:${C.text};margin:22px 0 8px}
        .article-content p{margin:0 0 18px;font-size:16px;color:${C.sub};line-height:1.85}
        .article-content strong{color:${C.text};font-weight:700}
        .article-content em{font-style:italic}
        .article-content code{background:rgba(255,255,255,0.08);padding:2px 6px;border-radius:4px;font-family:ui-monospace,monospace;font-size:13.5px;color:#10B981}
        .article-content a{color:#2DD4BF;text-decoration:underline;text-underline-offset:2px}
        .article-content a:hover{color:#5EEAD4}
        .article-content hr{border:none;border-top:1px solid ${C.border};margin:32px 0}

        /* ── Listes : marqueurs colorés, espacement propre entre items ───── */
        .article-content ul,.article-content ol{margin:0 0 20px;padding-left:0;list-style:none}
        .article-content ul li,.article-content ol li{
          position:relative;padding-left:28px;margin-bottom:10px;font-size:16px;line-height:1.7;color:${C.sub};
        }
        .article-content ul li::before{
          content:'';position:absolute;left:6px;top:11px;width:6px;height:6px;border-radius:50%;
          background:#10B981;
        }
        .article-content ol{counter-reset:kz-ol}
        .article-content ol li{counter-increment:kz-ol}
        .article-content ol li::before{
          content:counter(kz-ol);position:absolute;left:0;top:0;
          width:20px;height:20px;border-radius:6px;background:rgba(16,185,129,0.12);color:#10B981;
          font-size:11.5px;font-weight:800;display:flex;align-items:center;justify-content:center;
        }

        /* ── Citations / callouts (lois, définitions clés) ────────────────── */
        .article-content blockquote{
          margin:24px 0;padding:16px 20px;border-left:3px solid #10B981;
          background:rgba(16,185,129,0.05);border-radius:0 10px 10px 0;
        }
        .article-content blockquote p{
          font-style:italic;color:${C.sub};margin:0 0 6px;font-size:15px;
        }
        .article-content blockquote p:last-child{margin-bottom:0}

        /* ── Tableaux (barèmes, taux, plafonds) ───────────────────────────── */
        .article-table-wrap{margin:24px 0;overflow-x:auto;border:1px solid ${C.border};border-radius:12px}
        .article-content table{width:100%;border-collapse:collapse;font-size:14px}
        .article-content thead th{
          background:rgba(255,255,255,0.04);color:${C.text};font-weight:700;text-align:left;
          padding:10px 14px;border-bottom:1px solid ${C.border};white-space:nowrap;
        }
        .article-content tbody td{padding:10px 14px;border-bottom:1px solid ${C.border};color:${C.sub}}
        .article-content tbody tr:last-child td{border-bottom:none}
        .article-content tbody tr:hover{background:rgba(255,255,255,0.02)}

        @media(max-width:768px){
          .article-layout{grid-template-columns:1fr!important}
          .article-sidebar{display:none!important}
          .article-content{font-size:15.5px}
        }
      `}</style>
    </div>
  );
}