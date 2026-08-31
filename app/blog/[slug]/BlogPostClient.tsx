// ============================================================================
// 📁 app/blog/[slug]/BlogPostClient.tsx
// Wrapper client du composant existant, accepte initialPost pour le SSR
// ============================================================================
'use client';

// Ce fichier est juste un re-export de ton composant existant app/blog/[slug]/page.tsx
// en le transformant pour accepter des props (initialPost) depuis le Server Component.
// Tu colles ici le corps de ton BlogPostPage existant, en remplaçant :
//   const params = useParams(); const slug = params?.slug as string;
// par les props :
//   export default function BlogPostClient({ slug, initialPost }: Props)
// Et tu utilises initialPost pour pré-remplir le state (évite le premier fetch côté client)

import React, { useState, useEffect } from 'react';
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

// ── Constantes ────────────────────────────────────────────────────────────────
const C = {
  bg:'#020817', card:'#0A1628',
  border:'rgba(255,255,255,0.07)',
  cyan:'#06B6D4', blue:'#3B82F6', purple:'#8B5CF6',
  green:'#10B981', pink:'#EC4899',
  text:'#F8FAFC', muted:'#64748B', sub:'#94A3B8',
};

const CAT_COLOR: Record<string, { bg: string; c: string }> = {
  ANNONCE:      { bg:'rgba(245,158,11,0.12)',  c:'#F59E0B' },
  PAIE:         { bg:'rgba(6,182,212,0.12)',   c:'#06B6D4' },
  DROIT_TRAVAIL:{ bg:'rgba(139,92,246,0.12)',  c:'#8B5CF6' },
  RECRUTEMENT:  { bg:'rgba(16,185,129,0.12)',  c:'#10B981' },
  FORMATION:    { bg:'rgba(59,130,246,0.12)',  c:'#3B82F6' },
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
        <Link href="/blog" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'linear-gradient(135deg,#06B6D4,#3B82F6)', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 14, padding: '11px 22px', borderRadius: 10 }}>
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

  // Rendu simplifié — tu peux coller ici l'intégralité de ton BlogPostPage existant
  // en remplaçant juste l'en-tête (useParams → props)
  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: "system-ui,-apple-system,'Segoe UI',sans-serif", color: C.text }}>
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
            {isSA && <span style={{ fontSize: 12, fontWeight: 800, color: '#fff', background: 'linear-gradient(135deg,#06B6D4,#3B82F6)', padding: '4px 12px', borderRadius: 99 }}>Officiel Konza RH</span>}
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
                <div style={{ fontSize: 12, color: C.muted }}>{role}{company && !isSA ? ` · ${company}` : ''} · <time dateTime={post.publishedAt}>{date}</time></div>
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
          <article>
            {/* Contenu — on garde ton RenderContent existant */}
            <div style={{ fontSize: 15.5, color: C.sub, lineHeight: 1.8 }}
              dangerouslySetInnerHTML={{
                __html: post.content
                  .replace(/^# (.+)$/gm, '<h2 style="font-size:clamp(20px,2.5vw,28px);font-weight:900;color:#F8FAFC;margin:32px 0 16px;letter-spacing:-0.03em">$1</h2>')
                  .replace(/^## (.+)$/gm, '<h3 style="font-size:20px;font-weight:800;color:#F8FAFC;margin:28px 0 12px">$1</h3>')
                  .replace(/^### (.+)$/gm, '<h4 style="font-size:17px;font-weight:700;color:#F8FAFC;margin:22px 0 10px">$1</h4>')
                  .replace(/^> (.+)$/gm, '<blockquote style="margin:24px 0;padding:16px 20px;border-left:3px solid #06B6D4;background:rgba(6,182,212,0.05);border-radius:0 8px 8px 0"><p style="font-style:italic;color:#94A3B8;margin:0">$1</p></blockquote>')
                  .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#F8FAFC;font-weight:700">$1</strong>')
                  .replace(/\*(.+?)\*/g, '<em>$1</em>')
                  .replace(/`(.+?)`/g, '<code style="background:rgba(255,255,255,0.08);padding:2px 6px;border-radius:4px;font-family:monospace;font-size:13px;color:#06B6D4">$1</code>')
                  .replace(/\n\n/g, '</p><p style="margin:12px 0;font-size:15.5px;color:#94A3B8;line-height:1.8">')
                  .replace(/^(?!<)(.)/m, '<p style="margin:12px 0;font-size:15.5px;color:#94A3B8;line-height:1.8">$1')
                  + '</p>'
              }}
            />
          </article>

          {/* Sidebar sticky */}
          <aside style={{ position: 'sticky', top: 100, display: 'flex', flexDirection: 'column', gap: 20 }} className="article-sidebar">
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
            <div style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.15),rgba(99,102,241,0.1))', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 14, padding: 18 }}>
              <p style={{ fontSize: 12, fontWeight: 800, color: C.text, marginBottom: 6 }}>Gérez la paie de votre entreprise</p>
              <p style={{ fontSize: 11, color: C.sub, lineHeight: 1.5, marginBottom: 12 }}>Bulletins PDF, CNSS, CAMU, congés — conforme droit congolais.</p>
              <Link href="https://app.konza.cg" target="_blank"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'linear-gradient(135deg,#7C3AED,#6366F1)', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 12, padding: '8px 14px', borderRadius: 9 }}>
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
      <style>{`*{box-sizing:border-box;margin:0;padding:0}html{scroll-behavior:smooth}::-webkit-scrollbar{width:6px;background:#020817}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:3px}@media(max-width:768px){.article-layout{grid-template-columns:1fr!important}.article-sidebar{display:none!important}}`}</style>
    </div>
  );
}