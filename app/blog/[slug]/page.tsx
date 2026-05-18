// ============================================================================
// 📁 app/blog/[slug]/page.tsx — Konza RH · Détail d'un article (public)
//
// ✅ Public : tout le monde peut lire et partager
// ✅ Like : tout le monde (fingerprint si anonyme, userId si connecté)
// ✅ Partage : bouton natif Web Share API + copie URL
// ============================================================================
'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const C = {
  bg:'#020817', card:'#0A1628', cardHov:'#0F1E35',
  border:'rgba(255,255,255,0.07)',
  cyan:'#06B6D4', blue:'#3B82F6', purple:'#8B5CF6',
  green:'#10B981', orange:'#F59E0B', pink:'#EC4899',
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

type Post = {
  id: string; title: string; slug: string; excerpt?: string;
  content: string; coverImage?: string; category: string; scope: string;
  likesCount: number; publishedAt: string; updatedAt: string; hasLiked?: boolean;
  author: { id:string; firstName:string; lastName:string; role:string;
    company?: { tradeName?:string; legalName:string; logo?:string }};
  company?: { tradeName?:string; legalName:string };
};

function GridBg() {
  return <div style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none',
    backgroundImage:`linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)`,
    backgroundSize:'44px 44px'}} />;
}

function Blob({ color, style }: { color: string; style: React.CSSProperties }) {
  return <div style={{position:'absolute',borderRadius:'50%',filter:'blur(120px)',opacity:0.1,pointerEvents:'none',background:color,...style}} />;
}

function getFingerprint(): string {
  const key = 'kz_fp';
  let fp = localStorage.getItem(key);
  if (!fp) {
    fp = `anon_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(key, fp);
  }
  return fp;
}

// ─── Rendu du contenu markdown-like simple ────────────────────────────────────
// Pas de lib externe — on parse les patterns de base inline
function RenderContent({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('# ')) {
      elements.push(<h1 key={i} style={{fontSize:'clamp(22px,3vw,32px)',fontWeight:900,color:C.text,letterSpacing:'-0.03em',lineHeight:1.2,margin:'32px 0 16px',fontFamily:'system-ui,sans-serif'}}>{line.slice(2)}</h1>);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} style={{fontSize:'clamp(18px,2.5vw,24px)',fontWeight:800,color:C.text,letterSpacing:'-0.025em',lineHeight:1.25,margin:'28px 0 12px',fontFamily:'system-ui,sans-serif'}}>{line.slice(3)}</h2>);
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={i} style={{fontSize:18,fontWeight:700,color:C.text,letterSpacing:'-0.02em',margin:'22px 0 10px',fontFamily:'system-ui,sans-serif'}}>{line.slice(4)}</h3>);
    } else if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={i} style={{margin:'24px 0',padding:'16px 20px',borderLeft:`3px solid ${C.cyan}`,background:'rgba(6,182,212,0.05)',borderRadius:'0 8px 8px 0'}}>
          <p style={{fontSize:15.5,color:C.sub,fontStyle:'italic',lineHeight:1.7,margin:0}}>{line.slice(2)}</p>
        </blockquote>
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      // Collecte tous les items de liste contigus
      const items: string[] = [];
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        items.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} style={{margin:'16px 0',paddingLeft:0,listStyle:'none',display:'flex',flexDirection:'column',gap:8}}>
          {items.map((item, idx) => (
            <li key={idx} style={{display:'flex',gap:10,fontSize:15,color:C.sub,lineHeight:1.65}}>
              <span style={{color:C.cyan,flexShrink:0,marginTop:2}}>→</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    } else if (line.startsWith('---') || line.startsWith('***')) {
      elements.push(<div key={i} style={{height:1,background:C.border,margin:'32px 0'}}/>);
    } else if (line.trim() === '') {
      // Espace entre paragraphes
    } else {
      // Paragraphe normal avec bold/italic inline
      const parsed = line
        .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#F8FAFC;font-weight:700">$1</strong>')
        .replace(/\*(.+?)\*/g, '<em style="color:#94A3B8;font-style:italic">$1</em>')
        .replace(/`(.+?)`/g, '<code style="background:rgba(255,255,255,0.08);padding:2px 6px;border-radius:4px;font-family:ui-monospace,monospace;font-size:13px;color:#06B6D4">$1</code>');

      elements.push(
        <p key={i} style={{fontSize:15.5,color:C.sub,lineHeight:1.8,margin:'12px 0'}}
          dangerouslySetInnerHTML={{ __html: parsed }}/>
      );
    }
    i++;
  }

  return <div style={{maxWidth:'100%'}}>{elements}</div>;
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function BlogPostPage() {
  const params   = useParams();
  const router   = useRouter();
  const slug     = params?.slug as string;

  const [post,    setPost]    = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [liked,   setLiked]   = useState(false);
  const [likes,   setLikes]   = useState(0);
  const [copied,  setCopied]  = useState(false);
  const [related, setRelated] = useState<Post[]>([]);

  // Charger l'article
  useEffect(() => {
    if (!slug) return;
    async function load() {
      setLoading(true);
      try {
        const token = localStorage.getItem('accessToken');
        const r = await fetch(`${API}/blog/${slug}`, {
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (r.status === 404) { setError('Article introuvable'); setLoading(false); return; }
        if (r.status === 403) { setError('Cet article est réservé aux membres de cette entreprise'); setLoading(false); return; }
        if (!r.ok) throw new Error('Erreur serveur');
        const d = await r.json();
        setPost(d);
        setLiked(d.hasLiked || false);
        setLikes(d.likesCount || 0);

        // Charger des articles liés (même catégorie)
        const rr = await fetch(`${API}/blog?category=${d.category}&limit=3`, {
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const dr = await rr.json();
        setRelated((dr.posts || []).filter((p: Post) => p.slug !== slug).slice(0, 3));
      } catch {
        setError('Erreur lors du chargement de l\'article');
      }
      setLoading(false);
    }
    load();
  }, [slug]);

  // Like/unlike
  async function handleLike() {
    if (!post) return;
    const prev = liked;
    // Optimistic
    setLiked(!liked);
    setLikes(l => liked ? l - 1 : l + 1);

    try {
      const token = localStorage.getItem('accessToken');
      const fp    = getFingerprint();
      const r = await fetch(`${API}/blog/${slug}/like`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type':'application/json', ...(token ? { Authorization:`Bearer ${token}` } : {}) },
        body: JSON.stringify({ fingerprint: fp }),
      });
      const d = await r.json();
      if (r.ok) {
        setLiked(d.liked);
        setLikes(d.likesCount);
        // Persister les likes anonymes
        if (!token) {
          try {
            const raw = localStorage.getItem('kz_liked_posts');
            const set = new Set<string>(raw ? JSON.parse(raw) : []);
            if (d.liked) set.add(slug); else set.delete(slug);
            localStorage.setItem('kz_liked_posts', JSON.stringify(Array.from(set)));
          } catch {}
        }
      } else {
        setLiked(prev); setLikes(l => prev ? l + 1 : l - 1);
      }
    } catch {
      setLiked(prev); setLikes(l => prev ? l + 1 : l - 1);
    }
  }

  function share() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: post?.title || 'Article Konza RH', url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
    }
  }

  if (loading) return (
    <div style={{background:C.bg,minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui,sans-serif'}}>
      <GridBg/>
      <Navbar/>
      <div style={{textAlign:'center',zIndex:1}}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.cyan} strokeWidth="2" style={{animation:'spin 1s linear infinite',margin:'0 auto 14px',display:'block'}}><circle cx="12" cy="12" r="10" strokeOpacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
        <p style={{color:C.muted,fontSize:14}}>Chargement...</p>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error || !post) return (
    <div style={{background:C.bg,minHeight:'100vh',fontFamily:'system-ui,sans-serif',color:C.text}}>
      <GridBg/>
      <Navbar/>
      <div style={{maxWidth:640,margin:'160px auto 0',padding:'0 32px',textAlign:'center',zIndex:1,position:'relative'}}>
        <div style={{fontSize:56,marginBottom:20}}>📭</div>
        <h1 style={{fontSize:28,fontWeight:800,color:C.text,marginBottom:12}}>{error || 'Article introuvable'}</h1>
        <p style={{color:C.muted,fontSize:15,marginBottom:28}}>L'article que vous cherchez n'existe pas ou a été supprimé.</p>
        <Link href="/blog" style={{display:'inline-flex',alignItems:'center',gap:7,background:'linear-gradient(135deg,#06B6D4,#3B82F6)',color:'#fff',textDecoration:'none',fontWeight:700,fontSize:14,padding:'11px 22px',borderRadius:10}}>
          ← Retour au blog
        </Link>
      </div>
      <Footer/>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}`}</style>
    </div>
  );

  const cc      = CAT_COLOR[post.category] || CAT_COLOR.GENERAL;
  const isSA    = post.author.role === 'SUPER_ADMIN';
  const author  = isSA ? 'Konza RH' : `${post.author.firstName} ${post.author.lastName}`;
  const role    = ROLE_LABEL[post.author.role] || post.author.role;
  const company = post.author.company?.tradeName || post.author.company?.legalName || '';
  const date    = new Date(post.publishedAt).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' });

  return (
    <div style={{background:C.bg,minHeight:'100vh',fontFamily:"system-ui,-apple-system,'Segoe UI',sans-serif",color:C.text,overflowX:'hidden'}}>
      <GridBg/>
      <Blob color={C.blue} style={{width:500,height:400,top:0,right:-100}}/>
      <Navbar/>

      {/* HERO ARTICLE */}
      <section style={{position:'relative',padding:'130px 32px 0',zIndex:1,overflow:'hidden'}}>
        <div style={{maxWidth:840,margin:'0 auto'}}>
          {/* Breadcrumb */}
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:24,flexWrap:'wrap'}}>
            <Link href="/blog" style={{fontSize:13,color:C.muted,textDecoration:'none',display:'flex',alignItems:'center',gap:5,transition:'color 0.15s'}}
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color=C.cyan}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color=C.muted}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Blog
            </Link>
            <span style={{color:C.border}}>›</span>
            <span style={{fontSize:13,color:C.muted,maxWidth:300,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{post.title}</span>
          </div>

          {/* Category + badges */}
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:20,flexWrap:'wrap'}}>
            <span style={{fontSize:12,fontWeight:800,letterSpacing:'0.08em',textTransform:'uppercase',color:cc.c,background:cc.bg,border:`1px solid ${cc.c}30`,padding:'4px 12px',borderRadius:99}}>
              {CAT_LABEL[post.category] || post.category}
            </span>
            {isSA && <span style={{fontSize:12,fontWeight:800,color:'#fff',background:'linear-gradient(135deg,#06B6D4,#3B82F6)',padding:'4px 12px',borderRadius:99}}>Officiel Konza RH</span>}
          </div>

          {/* Titre */}
          <h1 style={{fontSize:'clamp(28px,5vw,52px)',fontWeight:900,letterSpacing:'-0.04em',lineHeight:1.1,color:C.text,marginBottom:22}}>
            {post.title}
          </h1>

          {/* Excerpt */}
          {post.excerpt && (
            <p style={{fontSize:18,color:C.sub,lineHeight:1.7,marginBottom:24,fontStyle:'italic',borderLeft:`3px solid ${cc.c}`,paddingLeft:16}}>
              {post.excerpt}
            </p>
          )}

          {/* Meta */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:16,paddingBottom:28,borderBottom:`1px solid ${C.border}`}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:40,height:40,borderRadius:'50%',background:`linear-gradient(135deg,${isSA?C.cyan:C.blue},${isSA?C.blue:C.purple})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:800,color:'#fff',flexShrink:0}}>
                {isSA?'K':author[0]}
              </div>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:C.text}}>{author}</div>
                <div style={{fontSize:12,color:C.muted}}>{role}{company&&!isSA?` · ${company}`:''} · {date}</div>
              </div>
            </div>

            {/* Actions */}
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              {/* Like */}
              <button onClick={handleLike} style={{display:'flex',alignItems:'center',gap:6,background:liked?'rgba(236,72,153,0.1)':'rgba(255,255,255,0.05)',border:`1px solid ${liked?C.pink+'40':C.border}`,borderRadius:9,padding:'8px 14px',cursor:'pointer',color:liked?C.pink:C.muted,fontSize:13,fontWeight:600,fontFamily:'inherit',transition:'all 0.2s'}}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill={liked?'currentColor':'none'} stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                {likes} {likes <= 1 ? 'like' : 'likes'}
              </button>

              {/* Partage */}
              <button onClick={share} style={{display:'flex',alignItems:'center',gap:6,background:copied?'rgba(16,185,129,0.1)':'rgba(255,255,255,0.05)',border:`1px solid ${copied?C.green+'40':C.border}`,borderRadius:9,padding:'8px 14px',cursor:'pointer',color:copied?C.green:C.muted,fontSize:13,fontWeight:600,fontFamily:'inherit',transition:'all 0.2s'}}>
                {copied ? (
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>Copié !</>
                ) : (
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>Partager</>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Cover image */}
      {post.coverImage && (
        <section style={{position:'relative',zIndex:1,padding:'32px 32px 0'}}>
          <div style={{maxWidth:840,margin:'0 auto',borderRadius:16,overflow:'hidden',border:`1px solid ${C.border}`}}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.coverImage} alt={post.title} style={{width:'100%',height:'auto',maxHeight:440,objectFit:'cover',display:'block',filter:'brightness(0.85)'}}/>
          </div>
        </section>
      )}

      {/* CONTENT */}
      <section style={{position:'relative',zIndex:1,padding:'40px 32px 80px'}}>
        <div style={{maxWidth:840,margin:'0 auto',display:'grid',gridTemplateColumns:'1fr 220px',gap:48,alignItems:'start'}} className="article-layout">

          {/* Article body */}
          <article>
            <RenderContent content={post.content}/>

            {/* Footer article */}
            <div style={{marginTop:48,paddingTop:28,borderTop:`1px solid ${C.border}`,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:16}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:36,height:36,borderRadius:'50%',background:`linear-gradient(135deg,${isSA?C.cyan:C.blue},${isSA?C.blue:C.purple})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,color:'#fff'}}>
                  {isSA?'K':author[0]}
                </div>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:C.text}}>{author}</div>
                  <div style={{fontSize:11,color:C.muted}}>{role}{company&&!isSA?` · ${company}`:''}</div>
                </div>
              </div>
              <div style={{display:'flex',gap:8}}>
                <button onClick={handleLike} style={{display:'flex',alignItems:'center',gap:6,background:liked?'rgba(236,72,153,0.1)':'rgba(255,255,255,0.05)',border:`1px solid ${liked?C.pink+'40':C.border}`,borderRadius:9,padding:'7px 14px',cursor:'pointer',color:liked?C.pink:C.muted,fontSize:13,fontWeight:600,fontFamily:'inherit',transition:'all 0.2s'}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={liked?'currentColor':'none'} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  {likes}
                </button>
                <button onClick={share} style={{display:'flex',alignItems:'center',gap:6,background:'rgba(255,255,255,0.04)',border:`1px solid ${C.border}`,borderRadius:9,padding:'7px 14px',cursor:'pointer',color:C.muted,fontSize:13,fontWeight:600,fontFamily:'inherit'}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                  Partager
                </button>
              </div>
            </div>
          </article>

          {/* Sidebar sticky */}
          <aside style={{position:'sticky',top:100,display:'flex',flexDirection:'column',gap:20}} className="article-sidebar">
            {/* À propos de l'auteur */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:'20px'}}>
              <p style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:14}}>Auteur</p>
              <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:10}}>
                <div style={{width:38,height:38,borderRadius:'50%',background:`linear-gradient(135deg,${isSA?C.cyan:C.blue},${isSA?C.blue:C.purple})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,color:'#fff',flexShrink:0}}>
                  {isSA?'K':author[0]}
                </div>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:C.text}}>{author}</div>
                  <div style={{fontSize:11,color:C.muted}}>{role}</div>
                </div>
              </div>
              {company&&!isSA&&<div style={{fontSize:12,color:C.muted,padding:'6px 10px',background:'rgba(255,255,255,0.03)',borderRadius:8}}>{company}</div>}
            </div>

            {/* Articles liés */}
            {related.length > 0 && (
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:'20px'}}>
                <p style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:14}}>Articles liés</p>
                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  {related.map(r => (
                    <Link key={r.id} href={`/blog/${r.slug}`} style={{textDecoration:'none'}}>
                      <div style={{padding:'10px',borderRadius:9,transition:'background 0.15s',cursor:'pointer'}}
                        onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.04)'}
                        onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}>
                        <div style={{fontSize:13,fontWeight:700,color:C.text,lineHeight:1.35,marginBottom:4,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{r.title}</div>
                        <div style={{fontSize:11,color:C.muted}}>{new Date(r.publishedAt).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Back */}
            <Link href="/blog" style={{display:'flex',alignItems:'center',gap:7,color:C.muted,textDecoration:'none',fontSize:13,fontWeight:600,padding:'10px',borderRadius:9,border:`1px solid ${C.border}`,justifyContent:'center',transition:'all 0.15s'}}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.cyan;(e.currentTarget as HTMLElement).style.color=C.cyan;}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=C.border;(e.currentTarget as HTMLElement).style.color=C.muted;}}>
              ← Retour au blog
            </Link>
          </aside>
        </div>
      </section>

      <Footer/>

      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        ::-webkit-scrollbar{width:6px;background:#020817}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:3px}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @media(max-width:768px){
          .article-layout{grid-template-columns:1fr!important}
          .article-sidebar{position:static!important;display:none!important}
        }
      `}</style>
    </div>
  );
}