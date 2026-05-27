'use client';
// ============================================================================
// 📁 app/blog/page.tsx — PUBLIC
// Tout le monde voit les posts GLOBAL
// Like : fingerprint anonyme (pas besoin d'auth)
// ============================================================================
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { blogApi, BlogPostSummary, BlogCategory } from '@/services/blog-api';

const CATS = [
  { value: '' as const,              label: 'Tous'           },
  { value: 'ANNONCE' as const,       label: 'Annonces'       },
  { value: 'PAIE' as const,          label: 'Paie & Fisc.'   },
  { value: 'DROIT_TRAVAIL' as const, label: 'Droit travail'  },
  { value: 'RECRUTEMENT' as const,   label: 'Recrutement'    },
  { value: 'FORMATION' as const,     label: 'Formation'      },
  { value: 'TEMOIGNAGE' as const,    label: 'Témoignages'    },
  { value: 'GENERAL' as const,       label: 'Général'        },
];

const CAT_COLOR: Record<string, string> = {
  ANNONCE:'#F59E0B', PAIE:'#06B6D4', DROIT_TRAVAIL:'#8B5CF6',
  RECRUTEMENT:'#10B981', FORMATION:'#3B82F6', TEMOIGNAGE:'#EC4899', GENERAL:'#94A3B8',
};

function getFingerprint() {
  const k = 'kz_fp';
  let fp = localStorage.getItem(k);
  if (!fp) { fp = `anon_${Date.now()}_${Math.random().toString(36).slice(2)}`; localStorage.setItem(k, fp); }
  return fp;
}

function GridBg() {
  return <div style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none',
    backgroundImage:`linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)`,
    backgroundSize:'44px 44px' }}/>;
}

function PostCard({ post, onLike }: { post: BlogPostSummary; onLike: (slug: string) => void }) {
  const [h, sH] = useState(false);
  const cc  = CAT_COLOR[post.category] || '#94A3B8';
  const isSA = post.author.role === 'SUPER_ADMIN';
  const date = new Date(post.publishedAt).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' });
  const catLabel = CATS.find(c => c.value === post.category)?.label || post.category;
  const company = post.author.company?.tradeName || post.author.company?.legalName || '';

  async function share() {
    const url = `${window.location.origin}/blog/${post.slug}`;
    if (navigator.share) navigator.share({ title: post.title, url }).catch(() => {});
    else { await navigator.clipboard.writeText(url); }
  }

  return (
    <div onMouseEnter={() => sH(true)} onMouseLeave={() => sH(false)}
      style={{ background: h ? '#0F1E35' : '#0A1628', border: `1px solid ${h ? 'rgba(6,182,212,0.3)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 16, overflow: 'hidden', transition: 'all 0.25s', transform: h ? 'translateY(-4px)' : 'none',
        display: 'flex', flexDirection: 'column' }}>

      {post.coverImage ? (
        <div style={{ height: 180, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.coverImage} alt={post.title}
            style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.6)', transition:'transform 0.4s', transform: h ? 'scale(1.05)' : 'scale(1)' }}/>
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,transparent 40%,#0A1628E0)' }}/>
          <span style={{ position:'absolute', top:12, left:12, fontSize:10, fontWeight:800, letterSpacing:'0.07em',
            textTransform:'uppercase', color:cc, background:'rgba(2,8,23,0.8)', border:`1px solid ${cc}40`,
            padding:'3px 10px', borderRadius:99, backdropFilter:'blur(8px)' }}>{catLabel}</span>
          {isSA && <span style={{ position:'absolute', top:12, right:12, fontSize:10, fontWeight:800, color:'#fff',
            background:'linear-gradient(135deg,#06B6D4,#3B82F6)', padding:'3px 10px', borderRadius:99 }}>Officiel</span>}
        </div>
      ) : (
        <div style={{ height:56, flexShrink:0, background:`${cc}18`, display:'flex', alignItems:'center', padding:'0 18px', gap:8 }}>
          <span style={{ fontSize:11, fontWeight:800, color:cc, letterSpacing:'0.08em', textTransform:'uppercase' }}>{catLabel}</span>
          {isSA && <span style={{ marginLeft:'auto', fontSize:10, fontWeight:800, color:'#fff', background:'linear-gradient(135deg,#06B6D4,#3B82F6)', padding:'3px 10px', borderRadius:99 }}>Officiel</span>}
        </div>
      )}

      <div style={{ padding:'18px 20px 20px', display:'flex', flexDirection:'column', gap:10, flex:1 }}>
        {/* Auteur */}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:26, height:26, borderRadius:'50%', background:'linear-gradient(135deg,#06B6D4,#3B82F6)',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:'#fff', flexShrink:0 }}>
            {isSA ? 'K' : post.author.firstName[0]}
          </div>
          <span style={{ fontSize:12, fontWeight:700, color:'#F8FAFC' }}>
            {isSA ? 'Konza RH' : `${post.author.firstName} ${post.author.lastName}`}
          </span>
          {company && !isSA && <span style={{ fontSize:11, color:'#64748B' }}>· {company}</span>}
        </div>

        <Link href={`/blog/${post.slug}`} style={{ textDecoration:'none' }}>
          <h3 style={{ fontSize:15.5, fontWeight:800, color:'#F8FAFC', letterSpacing:'-0.02em', lineHeight:1.35,
            display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden', cursor:'pointer' }}>
            {post.title}
          </h3>
        </Link>

        {post.excerpt && (
          <p style={{ fontSize:13, color:'#94A3B8', lineHeight:1.65,
            display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
            {post.excerpt}
          </p>
        )}

        {/* Footer card */}
        <div style={{ marginTop:'auto', paddingTop:10, borderTop:'1px solid rgba(255,255,255,0.07)',
          display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:11.5, color:'#64748B' }}>{date}</span>
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            {/* Like */}
            <button onClick={() => onLike(post.slug)}
              style={{ display:'flex', alignItems:'center', gap:5, background:'none', border:'none', cursor:'pointer',
                color: post.hasLiked ? '#EC4899' : '#64748B', fontSize:12, fontWeight:600, fontFamily:'inherit',
                padding:'4px 8px', borderRadius:7, transition:'all 0.15s' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill={post.hasLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              {post.likesCount}
            </button>
            {/* Share */}
            <button onClick={share}
              style={{ display:'flex', alignItems:'center', background:'none', border:'none', cursor:'pointer',
                color:'#64748B', padding:'4px 8px', borderRadius:7, transition:'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color='#06B6D4'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color='#64748B'}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
            </button>
            {/* Lire */}
            <Link href={`/blog/${post.slug}`}
              style={{ fontSize:12, fontWeight:700, color:'#06B6D4', textDecoration:'none', padding:'4px 8px' }}>
              Lire →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BlogPageLegacy()  {
  const [posts,    setPosts]    = useState<BlogPostSummary[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);
  const [totalPgs, setTotalPgs] = useState(1);
  const [cat,      setCat]      = useState<BlogCategory | ''>('');
  const [search,   setSearch]   = useState('');
  const [dSearch,  setDSearch]  = useState('');
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
      setPosts(res.posts.map(p => ({ ...p, hasLiked: p.hasLiked || likedSet.has(p.slug) })));
      setTotalPgs(res.pagination.totalPages);
    } catch { setPosts([]); }
    setLoading(false);
  }, [page, cat, dSearch]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [cat, dSearch]);

  async function handleLike(slug: string) {
    setPosts(p => p.map(post => post.slug === slug
      ? { ...post, hasLiked: !post.hasLiked, likesCount: post.hasLiked ? post.likesCount - 1 : post.likesCount + 1 }
      : post));
    try {
      const res = await blogApi.like(slug);
      setPosts(p => p.map(post => post.slug === slug ? { ...post, hasLiked: res.liked, likesCount: res.likesCount } : post));
      const set = new Set<string>(JSON.parse(localStorage.getItem('kz_liked_posts') || '[]'));
      if (res.liked) set.add(slug); else set.delete(slug);
      localStorage.setItem('kz_liked_posts', JSON.stringify(Array.from(set)));
    } catch { load(); }
  }

  const featured = posts[0];
  const rest = posts.slice(1);

  return (
    <div style={{ background:'#020817', minHeight:'100vh', fontFamily:"system-ui,-apple-system,'Segoe UI',sans-serif", color:'#F8FAFC', overflowX:'hidden' }}>
      <GridBg/>
      <Navbar/>

      {/* Hero */}
      <section style={{ position:'relative', padding:'150px 32px 70px', overflow:'hidden', zIndex:1 }}>
        <div style={{ position:'absolute', top:-100, left:'50%', transform:'translateX(-50%)', width:600, height:400,
          background:'#3B82F6', borderRadius:'50%', filter:'blur(120px)', opacity:0.08, pointerEvents:'none' }}/>
        <div style={{ maxWidth:1280, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:24 }}>
          <div style={{ maxWidth:560 }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 16px', background:'rgba(6,182,212,0.08)',
              border:'1px solid rgba(6,182,212,0.2)', borderRadius:99, fontSize:12, fontWeight:700, color:'#06B6D4',
              letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:18 }}>// Blog RH</div>
            <h1 style={{ fontSize:'clamp(26px,5vw,52px)', fontWeight:900, letterSpacing:'-0.04em', lineHeight:1.1, marginBottom:14 }}>
              Partages & actualités<br/>
              <span style={{ background:'linear-gradient(135deg,#06B6D4,#3B82F6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                de la communauté RH.
              </span>
            </h1>
            <p style={{ fontSize:16, color:'#94A3B8', lineHeight:1.7, maxWidth:480 }}>
              Bonnes pratiques, actualités fiscales, retours d'expérience — partagés par les RH du Congo.
            </p>
          </div>
          <Link href="/auth/login" style={{ display:'inline-flex', alignItems:'center', gap:7, border:'1px solid rgba(255,255,255,0.07)',
            color:'#94A3B8', textDecoration:'none', fontWeight:600, fontSize:13.5, padding:'10px 18px', borderRadius:10 }}>
            Se connecter pour publier
          </Link>
        </div>
      </section>

      {/* Filtres */}
      <section style={{ position:'relative', zIndex:1, borderTop:'1px solid rgba(255,255,255,0.07)', borderBottom:'1px solid rgba(255,255,255,0.07)', background:'rgba(255,255,255,0.01)' }}>
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'14px 32px', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', justifyContent:'space-between' }}>
          <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
            {CATS.map(c => (
              <button key={c.value} onClick={() => setCat(c.value)}
                style={{ padding:'6px 13px', borderRadius:99, fontSize:12.5, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
                  border:`1px solid ${cat === c.value ? '#06B6D4' : 'rgba(255,255,255,0.07)'}`,
                  background: cat === c.value ? 'rgba(6,182,212,0.1)' : 'transparent',
                  color: cat === c.value ? '#06B6D4' : '#94A3B8', transition:'all 0.15s' }}>
                {c.label}
              </button>
            ))}
          </div>
          <div style={{ position:'relative' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2"
              style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}>
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
              style={{ padding:'8px 13px 8px 33px', background:'#0A1628', border:'1px solid rgba(255,255,255,0.07)',
                borderRadius:9, color:'#F8FAFC', fontSize:13, outline:'none', fontFamily:'inherit', width:200,
                transition:'border-color 0.2s' }}
              onFocus={e => e.target.style.borderColor='#06B6D4'} onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.07)'}/>
          </div>
        </div>
      </section>

      {/* Contenu */}
      <section style={{ position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'56px 32px' }}>
          {loading ? (
            <div style={{ textAlign:'center', padding:'72px 0' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" strokeWidth="2"
                style={{ animation:'spin 1s linear infinite', margin:'0 auto 14px', display:'block' }}>
                <circle cx="12" cy="12" r="10" strokeOpacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
              </svg>
              <p style={{ color:'#64748B', fontSize:14 }}>Chargement...</p>
            </div>
          ) : posts.length === 0 ? (
            <div style={{ textAlign:'center', padding:'72px 0' }}>
              <div style={{ fontSize:44, marginBottom:14 }}>📝</div>
              <h3 style={{ fontSize:19, fontWeight:700, color:'#F8FAFC', marginBottom:8 }}>Aucun article</h3>
              <p style={{ color:'#64748B', fontSize:14 }}>{dSearch ? `Aucun résultat pour "${dSearch}"` : 'Pas encore d\'articles.'}</p>
            </div>
          ) : (
            <>
              {/* Featured */}
              {featured && !dSearch && page === 1 && (
                <div style={{ marginBottom:36 }}>
                  <p style={{ fontSize:11, fontWeight:700, color:'#64748B', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:14 }}>À la une</p>
                  <div style={{ background:'#0A1628', border:'1px solid rgba(255,255,255,0.07)', borderRadius:20, overflow:'hidden',
                    display:'grid', gridTemplateColumns:'1fr 1fr', minHeight:300 }} className="feat-pub">
                    <div style={{ position:'relative', overflow:'hidden', minHeight:220 }}>
                      {featured.coverImage ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={featured.coverImage} alt={featured.title}
                          style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.6)' }}/>
                      ) : (
                        <div style={{ position:'absolute', inset:0, background:`linear-gradient(135deg,${CAT_COLOR[featured.category] || '#94A3B8'}18,#0A1628)` }}/>
                      )}
                      <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right,transparent 40%,#0A1628CC)' }}/>
                    </div>
                    <div style={{ padding:'32px 28px', display:'flex', flexDirection:'column', justifyContent:'center', gap:14 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#06B6D4,#3B82F6)',
                          display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'#fff' }}>
                          {featured.author.role === 'SUPER_ADMIN' ? 'K' : featured.author.firstName[0]}
                        </div>
                        <span style={{ fontSize:12, fontWeight:700, color:'#F8FAFC' }}>
                          {featured.author.role === 'SUPER_ADMIN' ? 'Konza RH' : `${featured.author.firstName} ${featured.author.lastName}`}
                        </span>
                        <span style={{ fontSize:11, color:'#64748B' }}>· {new Date(featured.publishedAt).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</span>
                      </div>
                      <Link href={`/blog/${featured.slug}`} style={{ textDecoration:'none' }}>
                        <h2 style={{ fontSize:'clamp(17px,2.5vw,24px)', fontWeight:900, color:'#F8FAFC', letterSpacing:'-0.025em', lineHeight:1.25, cursor:'pointer' }}>
                          {featured.title}
                        </h2>
                      </Link>
                      {featured.excerpt && <p style={{ fontSize:14, color:'#94A3B8', lineHeight:1.7, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{featured.excerpt}</p>}
                      <div style={{ display:'flex', gap:8 }}>
                        <Link href={`/blog/${featured.slug}`} style={{ display:'inline-flex', alignItems:'center', gap:6, background:'linear-gradient(135deg,#06B6D4,#3B82F6)', color:'#fff', textDecoration:'none', fontWeight:800, fontSize:13, padding:'9px 18px', borderRadius:9 }}>
                          Lire l'article <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                        </Link>
                        <button onClick={() => handleLike(featured.slug)}
                          style={{ display:'flex', alignItems:'center', gap:5, background: featured.hasLiked ? 'rgba(236,72,153,0.1)' : 'rgba(255,255,255,0.05)',
                            border:`1px solid ${featured.hasLiked ? 'rgba(236,72,153,0.3)' : 'rgba(255,255,255,0.1)'}`,
                            borderRadius:9, padding:'8px 14px', cursor:'pointer', color: featured.hasLiked ? '#EC4899' : '#64748B',
                            fontSize:13, fontWeight:600, fontFamily:'inherit', transition:'all 0.15s' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill={featured.hasLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                          </svg>
                          {featured.likesCount}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Grid */}
              {(dSearch || page > 1 ? posts : rest).length > 0 && (
                <>
                  <p style={{ fontSize:11, fontWeight:700, color:'#64748B', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:18 }}>
                    {dSearch || page > 1 ? `${posts.length} article${posts.length > 1 ? 's' : ''}` : 'Derniers articles'}
                  </p>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }} className="blog-pub-grid">
                    {(dSearch || page > 1 ? posts : rest).map(p => (
                      <PostCard key={p.id} post={p} onLike={handleLike}/>
                    ))}
                  </div>
                </>
              )}

              {/* Pagination */}
              {totalPgs > 1 && (
                <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:8, marginTop:44 }}>
                  <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                    style={{ padding:'8px 15px', background:'#0A1628', border:'1px solid rgba(255,255,255,0.07)', borderRadius:8,
                      color: page === 1 ? '#64748B' : '#F8FAFC', cursor: page === 1 ? 'not-allowed' : 'pointer', fontFamily:'inherit', fontSize:13, fontWeight:600 }}>
                    ← Préc.
                  </button>
                  {Array.from({ length: Math.min(5, totalPgs) }, (_, i) => {
                    const pg = Math.max(1, Math.min(totalPgs-4, page-2)) + i;
                    return (
                      <button key={pg} onClick={() => setPage(pg)}
                        style={{ width:36, height:36, borderRadius:8, fontFamily:'inherit',
                          border:`1px solid ${pg === page ? '#06B6D4' : 'rgba(255,255,255,0.07)'}`,
                          background: pg === page ? 'rgba(6,182,212,0.12)' : 'transparent',
                          color: pg === page ? '#06B6D4' : '#94A3B8', cursor:'pointer', fontWeight:700, fontSize:13 }}>
                        {pg}
                      </button>
                    );
                  })}
                  <button onClick={() => setPage(p => Math.min(totalPgs, p+1))} disabled={page === totalPgs}
                    style={{ padding:'8px 15px', background:'#0A1628', border:'1px solid rgba(255,255,255,0.07)', borderRadius:8,
                      color: page === totalPgs ? '#64748B' : '#F8FAFC', cursor: page === totalPgs ? 'not-allowed' : 'pointer', fontFamily:'inherit', fontSize:13, fontWeight:600 }}>
                    Suiv. →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Footer/>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}html{scroll-behavior:smooth}
        ::-webkit-scrollbar{width:6px;background:#020817}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:3px}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @media(max-width:900px){.blog-pub-grid{grid-template-columns:repeat(2,1fr)!important}.feat-pub{grid-template-columns:1fr!important}}
        @media(max-width:580px){.blog-pub-grid{grid-template-columns:1fr!important}}
      `}</style>
    </div>
  );
}