// ============================================================================
// 📁 app/blog/page.tsx — Konza RH · Blog (public)
//
// ✅ Lecture : tout le monde, sans connexion
// ✅ Like : tout le monde (fingerprint localStorage pour anonymes, userId si connecté)
// ✅ Partage : lien public /blog/:slug
// 🔒 Publication : HR_MANAGER, ADMIN, SUPER_ADMIN, CABINET_ADMIN uniquement
// ============================================================================
'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Navbar }  from '@/components/landing/Navbar';
import { Footer }  from '@/components/landing/Footer';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const C = {
  bg:'#020817', card:'#0A1628', cardHov:'#0F1E35',
  border:'rgba(255,255,255,0.07)',
  cyan:'#06B6D4', blue:'#3B82F6', purple:'#8B5CF6',
  green:'#10B981', orange:'#F59E0B', pink:'#EC4899',
  text:'#F8FAFC', muted:'#64748B', sub:'#94A3B8',
};

// Rôles pouvant publier (sync avec NestJS)
const CAN_POST = ['HR_MANAGER','ADMIN','SUPER_ADMIN','CABINET_ADMIN'];

const CATS = [
  { value:'',             label:'Tous' },
  { value:'ANNONCE',      label:'Annonces' },
  { value:'PAIE',         label:'Paie & Fiscalité' },
  { value:'DROIT_TRAVAIL',label:'Droit du travail' },
  { value:'RECRUTEMENT',  label:'Recrutement' },
  { value:'FORMATION',    label:'Formation' },
  { value:'TEMOIGNAGE',   label:'Témoignages' },
  { value:'GENERAL',      label:'Général' },
];

const CAT_COLOR: Record<string,{bg:string;c:string}> = {
  ANNONCE:      { bg:'rgba(245,158,11,0.12)',   c:'#F59E0B' },
  PAIE:         { bg:'rgba(6,182,212,0.12)',    c:'#06B6D4' },
  DROIT_TRAVAIL:{ bg:'rgba(139,92,246,0.12)',   c:'#8B5CF6' },
  RECRUTEMENT:  { bg:'rgba(16,185,129,0.12)',   c:'#10B981' },
  FORMATION:    { bg:'rgba(59,130,246,0.12)',   c:'#3B82F6' },
  TEMOIGNAGE:   { bg:'rgba(236,72,153,0.12)',   c:'#EC4899' },
  GENERAL:      { bg:'rgba(100,116,139,0.12)',  c:'#94A3B8' },
};

const ROLE_LABEL: Record<string,string> = {
  SUPER_ADMIN:'Konza RH', ADMIN:'Administrateur',
  HR_MANAGER:'Responsable RH', CABINET_ADMIN:'Cabinet',
};

// ─── Types ────────────────────────────────────────────────────────────────────
type Post = {
  id:string; title:string; slug:string; excerpt?:string; coverImage?:string;
  category:string; scope:string; likesCount:number; publishedAt:string; hasLiked?:boolean;
  author:{id:string;firstName:string;lastName:string;role:string;
    company?:{tradeName?:string;legalName:string;logo?:string}};
  company?:{tradeName?:string;legalName:string};
};
type Quota = { unlimited?:boolean; used:number; limit:number; remaining:number; canPost:boolean };
type User  = { id:string; firstName:string; lastName:string; role:string; companyId?:string } | null;

// ─── Fingerprint anonyme ─────────────────────────────────────────────────────
function getFingerprint(): string {
  const key = 'kz_fp';
  let fp = localStorage.getItem(key);
  if (!fp) {
    fp = `anon_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(key, fp);
  }
  return fp;
}

// ─── Grid background ─────────────────────────────────────────────────────────
function GridBg() {
  return <div style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none',
    backgroundImage:`linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)`,
    backgroundSize:'44px 44px'}} />;
}

function Blob({color,style}:{color:string;style:React.CSSProperties}) {
  return <div style={{position:'absolute',borderRadius:'50%',filter:'blur(120px)',opacity:0.1,pointerEvents:'none',background:color,...style}} />;
}

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true); }, { threshold: 0.06 });
    obs.observe(el); return () => obs.disconnect();
  }, []);
  return { ref, visible: v };
}
function Reveal({ children, delay=0 }:{ children:React.ReactNode; delay?:number }) {
  const { ref, visible } = useReveal();
  return <div ref={ref} style={{opacity:visible?1:0,transform:visible?'none':'translateY(22px)',transition:`opacity 0.5s ease ${delay}ms,transform 0.5s ease ${delay}ms`}}>{children}</div>;
}

// ─── Share button ─────────────────────────────────────────────────────────────
function ShareBtn({ slug }:{ slug:string }) {
  const [copied, setCopied] = useState(false);
  function share() {
    const url = `${window.location.origin}/blog/${slug}`;
    if (navigator.share) {
      navigator.share({ title: 'Article Konza RH', url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
    }
  }
  return (
    <button onClick={share} style={{display:'flex',alignItems:'center',gap:5,background:'none',border:'none',cursor:'pointer',color:copied?C.green:C.muted,fontSize:12,fontWeight:600,fontFamily:'inherit',padding:'4px 8px',borderRadius:7,transition:'color 0.2s'}}>
      {copied ? '✓ Copiée' : (
        <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>Partager</>
      )}
    </button>
  );
}

// ─── Like button ──────────────────────────────────────────────────────────────
function LikeBtn({ post, onLike }:{ post:Post; onLike:(slug:string)=>void }) {
  return (
    <button onClick={() => onLike(post.slug)} style={{display:'flex',alignItems:'center',gap:5,background:'none',border:'none',cursor:'pointer',color:post.hasLiked?C.pink:C.muted,fontSize:12,fontWeight:600,fontFamily:'inherit',padding:'4px 8px',borderRadius:7,transition:'all 0.15s'}}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill={post.hasLiked?'currentColor':'none'} stroke="currentColor" strokeWidth="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
      {post.likesCount}
    </button>
  );
}

// ─── Auteur badge ─────────────────────────────────────────────────────────────
function AuthorBadge({ author }:{ author:Post['author'] }) {
  const isSA = author.role === 'SUPER_ADMIN';
  const name = isSA ? 'Konza RH' : `${author.firstName} ${author.lastName}`;
  const role = ROLE_LABEL[author.role] || author.role;
  const company = author.company?.tradeName || author.company?.legalName || '';
  return (
    <div style={{display:'flex',alignItems:'center',gap:8}}>
      <div style={{width:28,height:28,borderRadius:'50%',background:`linear-gradient(135deg,${isSA?C.cyan:C.blue},${isSA?C.blue:C.purple})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:'#fff',flexShrink:0}}>
        {isSA?'K':name[0]}
      </div>
      <span style={{fontSize:12,fontWeight:700,color:C.text}}>{name}</span>
      <span style={{fontSize:11,color:C.muted}}>· {role}{company&&!isSA?` · ${company}`:''}</span>
    </div>
  );
}

// ─── Post card (grille) ───────────────────────────────────────────────────────
function PostCard({ post, onLike }:{ post:Post; onLike:(s:string)=>void }) {
  const [h, sH] = useState(false);
  const cc = CAT_COLOR[post.category] || CAT_COLOR.GENERAL;
  const date = new Date(post.publishedAt).toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'});

  return (
    <div onMouseEnter={()=>sH(true)} onMouseLeave={()=>sH(false)}
      style={{background:h?C.cardHov:C.card,border:`1px solid ${h?'rgba(6,182,212,0.3)':C.border}`,borderRadius:16,overflow:'hidden',transition:'all 0.25s ease',transform:h?'translateY(-4px)':'none',display:'flex',flexDirection:'column'}}>

      {/* Image ou bande colorée */}
      {post.coverImage ? (
        <div style={{height:175,overflow:'hidden',position:'relative',flexShrink:0}}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.coverImage} alt={post.title} style={{width:'100%',height:'100%',objectFit:'cover',filter:'brightness(0.6)',transition:'transform 0.4s',transform:h?'scale(1.05)':'scale(1)'}}/>
          <div style={{position:'absolute',inset:0,background:`linear-gradient(to bottom,transparent 40%,${C.card}E0)`}}/>
          <span style={{position:'absolute',top:12,left:12,fontSize:10,fontWeight:800,letterSpacing:'0.07em',textTransform:'uppercase',color:cc.c,background:'rgba(2,8,23,0.78)',border:`1px solid ${cc.c}40`,padding:'3px 9px',borderRadius:99,backdropFilter:'blur(8px)'}}>
            {CATS.find(c=>c.value===post.category)?.label||post.category}
          </span>
          {post.author.role==='SUPER_ADMIN'&&<span style={{position:'absolute',top:12,right:12,fontSize:10,fontWeight:800,color:'#fff',background:'linear-gradient(135deg,#06B6D4,#3B82F6)',padding:'3px 9px',borderRadius:99}}>Officiel</span>}
        </div>
      ):(
        <div style={{height:56,flexShrink:0,background:cc.bg,display:'flex',alignItems:'center',padding:'0 18px',gap:8}}>
          <span style={{fontSize:11,fontWeight:800,color:cc.c,letterSpacing:'0.08em',textTransform:'uppercase'}}>{CATS.find(c=>c.value===post.category)?.label}</span>
          {post.author.role==='SUPER_ADMIN'&&<span style={{marginLeft:'auto',fontSize:10,fontWeight:800,color:'#fff',background:'linear-gradient(135deg,#06B6D4,#3B82F6)',padding:'3px 9px',borderRadius:99}}>Officiel</span>}
        </div>
      )}

      <div style={{padding:'18px 20px 20px',display:'flex',flexDirection:'column',gap:10,flex:1}}>
        <AuthorBadge author={post.author}/>
        <Link href={`/blog/${post.slug}`} style={{textDecoration:'none'}}>
          <h3 style={{fontSize:15.5,fontWeight:800,color:C.text,letterSpacing:'-0.02em',lineHeight:1.35,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden',cursor:'pointer'}}>{post.title}</h3>
        </Link>
        {post.excerpt&&<p style={{fontSize:13,color:C.sub,lineHeight:1.65,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{post.excerpt}</p>}
        <div style={{marginTop:'auto',paddingTop:10,borderTop:`1px solid ${C.border}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span style={{fontSize:11.5,color:C.muted}}>{date}</span>
          <div style={{display:'flex',alignItems:'center',gap:4}}>
            <LikeBtn post={post} onLike={onLike}/>
            <ShareBtn slug={post.slug}/>
            <Link href={`/blog/${post.slug}`} style={{fontSize:12,fontWeight:700,color:C.cyan,textDecoration:'none',padding:'4px 8px'}}>Lire →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Featured post ────────────────────────────────────────────────────────────
function FeaturedCard({ post, onLike }:{ post:Post; onLike:(s:string)=>void }) {
  const [h, sH] = useState(false);
  const cc = CAT_COLOR[post.category] || CAT_COLOR.GENERAL;
  const isSA = post.author.role === 'SUPER_ADMIN';
  const date = new Date(post.publishedAt).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'});

  return (
    <div onMouseEnter={()=>sH(true)} onMouseLeave={()=>sH(false)}
      style={{background:h?C.cardHov:C.card,border:`1px solid ${h?'rgba(6,182,212,0.35)':C.border}`,borderRadius:20,overflow:'hidden',transition:'all 0.3s ease',display:'grid',gridTemplateColumns:'1fr 1fr',minHeight:300}} className="feat-card">
      <div style={{position:'relative',overflow:'hidden',minHeight:220}}>
        {post.coverImage ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={post.coverImage} alt={post.title} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',filter:'brightness(0.6)',transition:'transform 0.4s',transform:h?'scale(1.04)':'scale(1)'}}/>
        ):(
          <div style={{position:'absolute',inset:0,background:`linear-gradient(135deg,${cc.bg},${C.card})`}}/>
        )}
        <div style={{position:'absolute',inset:0,background:'linear-gradient(to right,transparent 40%,#0A1628CC)'}}/>
        <div style={{position:'absolute',top:14,left:14,display:'flex',gap:8}}>
          <span style={{fontSize:11,fontWeight:800,color:cc.c,background:'rgba(2,8,23,0.78)',border:`1px solid ${cc.c}40`,padding:'4px 11px',borderRadius:99,backdropFilter:'blur(8px)',letterSpacing:'0.07em',textTransform:'uppercase'}}>
            {CATS.find(c=>c.value===post.category)?.label}
          </span>
          {isSA&&<span style={{fontSize:11,fontWeight:800,color:'#fff',background:'linear-gradient(135deg,#06B6D4,#3B82F6)',padding:'4px 11px',borderRadius:99}}>Officiel</span>}
        </div>
      </div>
      <div style={{padding:'28px 28px',display:'flex',flexDirection:'column',justifyContent:'center',gap:14}}>
        <AuthorBadge author={post.author}/>
        <Link href={`/blog/${post.slug}`} style={{textDecoration:'none'}}>
          <h2 style={{fontSize:'clamp(17px,2.5vw,24px)',fontWeight:900,color:C.text,letterSpacing:'-0.025em',lineHeight:1.25,cursor:'pointer'}}>{post.title}</h2>
        </Link>
        {post.excerpt&&<p style={{fontSize:13.5,color:C.sub,lineHeight:1.7,display:'-webkit-box',WebkitLineClamp:3,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{post.excerpt}</p>}
        <span style={{fontSize:11.5,color:C.muted}}>{date}</span>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <Link href={`/blog/${post.slug}`} style={{display:'inline-flex',alignItems:'center',gap:6,background:'linear-gradient(135deg,#06B6D4,#3B82F6)',color:'#fff',textDecoration:'none',fontWeight:800,fontSize:13,padding:'9px 18px',borderRadius:9}}>
            Lire l'article <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
          <LikeBtn post={post} onLike={onLike}/>
          <ShareBtn slug={post.slug}/>
        </div>
      </div>
    </div>
  );
}

// ─── Modal création de post ───────────────────────────────────────────────────
function CreateModal({ quota, onClose, onSuccess }:{ quota:Quota|null; onClose:()=>void; onSuccess:()=>void }) {
  const [form, setForm] = useState({ title:'', excerpt:'', content:'', category:'GENERAL', coverImage:'', published:true });
  const [status, setStatus] = useState<'idle'|'sending'|'error'>('idle');
  const [err, setErr] = useState('');

  const set = (f:string) => (e:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) =>
    setForm(p => ({ ...p, [f]: e.target.type==='checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));

  async function submit(e:React.FormEvent) {
    e.preventDefault(); setStatus('sending'); setErr('');
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API}/blog`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type':'application/json', ...(token ? { Authorization:`Bearer ${token}` } : {}) },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || 'Erreur');
      onSuccess();
    } catch (ex:unknown) {
      setErr(ex instanceof Error ? ex.message : 'Erreur'); setStatus('error');
    }
  }

  const inp: React.CSSProperties = { width:'100%', padding:'11px 14px', background:'#020817', border:`1px solid ${C.border}`, borderRadius:9, color:C.text, fontSize:14, outline:'none', fontFamily:'inherit', transition:'border-color 0.2s' };
  const fo = (e:React.FocusEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) => e.target.style.borderColor = C.cyan;
  const bl = (e:React.FocusEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) => e.target.style.borderColor = C.border;

  const quotaFull = quota && !quota.unlimited && quota.remaining === 0;

  return (
    <div style={{position:'fixed',inset:0,zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:20,background:'rgba(0,0,0,0.75)',backdropFilter:'blur(4px)'}}>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,width:'100%',maxWidth:680,maxHeight:'90vh',overflow:'auto',padding:'32px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:22}}>
          <div>
            <h2 style={{fontSize:19,fontWeight:800,color:C.text,marginBottom:4}}>Publier un article</h2>
            {quota&&!quota.unlimited&&<p style={{fontSize:12,color:quotaFull?'#FCA5A5':C.muted}}>Quota ce mois : {quota.used}/{quota.limit} · {quota.remaining} restant{quota.remaining!==1?'s':''}</p>}
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',color:C.muted,cursor:'pointer',fontSize:24,lineHeight:1}}>×</button>
        </div>

        {quotaFull ? (
          <div style={{textAlign:'center',padding:'32px 0'}}>
            <div style={{fontSize:40,marginBottom:14}}>⏳</div>
            <h3 style={{fontSize:17,fontWeight:700,color:C.text,marginBottom:8}}>Quota mensuel atteint</h3>
            <p style={{fontSize:14,color:C.sub,lineHeight:1.7}}>Votre entreprise a utilisé ses {quota.limit} publications ce mois. Revenez le mois prochain.</p>
          </div>
        ) : (
          <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:15}}>
            <div>
              <label style={{display:'block',fontSize:12,color:C.sub,marginBottom:5,fontWeight:500}}>Titre *</label>
              <input value={form.title} onChange={set('title')} required placeholder="Un titre accrocheur..." style={inp} onFocus={fo} onBlur={bl}/>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}} className="modal-row">
              <div>
                <label style={{display:'block',fontSize:12,color:C.sub,marginBottom:5,fontWeight:500}}>Catégorie</label>
                <select value={form.category} onChange={set('category')} style={{...inp,appearance:'none',cursor:'pointer'}} onFocus={fo} onBlur={bl}>
                  {CATS.filter(c=>c.value!=='').map(c=><option key={c.value} value={c.value} style={{background:'#020817'}}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{display:'block',fontSize:12,color:C.sub,marginBottom:5,fontWeight:500}}>Image de couverture (URL)</label>
                <input value={form.coverImage} onChange={set('coverImage')} placeholder="https://..." style={inp} onFocus={fo} onBlur={bl}/>
              </div>
            </div>
            <div>
              <label style={{display:'block',fontSize:12,color:C.sub,marginBottom:5,fontWeight:500}}>Résumé (optionnel — 500 car. max)</label>
              <textarea value={form.excerpt} onChange={set('excerpt')} rows={2} placeholder="Un bref résumé..." style={{...inp,resize:'vertical'}} onFocus={fo} onBlur={bl}/>
            </div>
            <div>
              <label style={{display:'block',fontSize:12,color:C.sub,marginBottom:5,fontWeight:500}}>Contenu *</label>
              <textarea value={form.content} onChange={set('content')} required rows={8} placeholder="Rédigez votre article ici... Partagez votre expérience, vos conseils RH, une actualité." style={{...inp,resize:'vertical',minHeight:180}} onFocus={fo} onBlur={bl}/>
            </div>
            <label style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer',fontSize:13.5,color:C.sub}}>
              <input type="checkbox" checked={form.published} onChange={set('published')} style={{width:15,height:15,accentColor:C.cyan}}/>
              Publier immédiatement
            </label>
            {err&&<div style={{padding:'10px 14px',background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:9,fontSize:13,color:'#FCA5A5'}}>{err}</div>}
            <div style={{display:'flex',gap:10,justifyContent:'flex-end',paddingTop:4}}>
              <button type="button" onClick={onClose} style={{padding:'10px 18px',background:'none',border:`1px solid ${C.border}`,borderRadius:9,color:C.sub,cursor:'pointer',fontFamily:'inherit',fontSize:13.5}}>Annuler</button>
              <button type="submit" disabled={status==='sending'} style={{padding:'10px 22px',background:'linear-gradient(135deg,#06B6D4,#3B82F6)',border:'none',borderRadius:9,color:'#fff',fontWeight:800,fontSize:14,cursor:'pointer',fontFamily:'inherit',opacity:status==='sending'?0.6:1}}>
                {status==='sending'?'Publication...':'Publier l\'article'}
              </button>
            </div>
          </form>
        )}
      </div>
      <style>{`@media(max-width:540px){.modal-row{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}

// ─── PAGE PRINCIPALE ──────────────────────────────────────────────────────────
export default function BlogPage() {
  const [posts,    setPosts]    = useState<Post[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);
  const [totalPgs, setTotalPgs] = useState(1);
  const [cat,      setCat]      = useState('');
  const [search,   setSearch]   = useState('');
  const [debSearch,setDebSearch]= useState('');
  const [showCreate,setShowCreate]=useState(false);
  const [user,     setUser]     = useState<User>(null);
  const [quota,    setQuota]    = useState<Quota|null>(null);
  const [likedSet, setLikedSet] = useState<Set<string>>(new Set()); // fingerprint likes locaux

  // Debounce search
  useEffect(() => { const t = setTimeout(() => setDebSearch(search), 400); return () => clearTimeout(t); }, [search]);

  // Charger user depuis localStorage (pas de fetch nécessaire — déjà stocké par useAuth)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  // Charger liked locaux (anonymes) depuis localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('kz_liked_posts');
      if (raw) setLikedSet(new Set(JSON.parse(raw)));
    } catch {}
  }, []);

  // Quota si peut publier
  useEffect(() => {
    if (!user || !CAN_POST.includes(user.role)) return;
    const token = localStorage.getItem('accessToken');
    fetch(`${API}/blog/quota`, {
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).then(r => r.json()).then(setQuota).catch(() => {});
  }, [user]);

  // Fetch posts
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page), limit: '12',
        ...(cat ? { category: cat } : {}),
        ...(debSearch ? { q: debSearch } : {}),
        ...(user?.companyId ? { companyId: user.companyId } : {}),
      });
      const token = localStorage.getItem('accessToken');
      const r = await fetch(`${API}/blog?${params}`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const d = await r.json();
      // Fusionner hasLiked avec les likes locaux anonymes
      const enriched = (d.posts || []).map((p:Post) => ({
        ...p,
        hasLiked: p.hasLiked || likedSet.has(p.slug),
      }));
      setPosts(enriched);
      setTotalPgs(d.pagination?.totalPages || 1);
    } catch { setPosts([]); }
    setLoading(false);
  }, [page, cat, debSearch, user, likedSet]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);
  useEffect(() => { setPage(1); }, [cat, debSearch]);

  // Toggle like
  async function handleLike(slug: string) {
    const token = localStorage.getItem('accessToken');
    const fp    = getFingerprint();

    // Optimistic update
    setPosts(p => p.map(post => post.slug === slug
      ? { ...post, hasLiked: !post.hasLiked, likesCount: post.hasLiked ? post.likesCount - 1 : post.likesCount + 1 }
      : post
    ));

    try {
      const r = await fetch(`${API}/blog/${slug}/like`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type':'application/json', ...(token ? { Authorization:`Bearer ${token}` } : {}) },
        body: JSON.stringify({ fingerprint: fp }),
      });
      const d = await r.json();
      if (r.ok) {
        // Sync avec la vraie valeur du serveur
        setPosts(p => p.map(post => post.slug === slug ? { ...post, hasLiked: d.liked, likesCount: d.likesCount } : post));
        // Sauvegarder les likes locaux (anonymes)
        if (!user) {
          setLikedSet(prev => {
            const next = new Set(prev);
            if (d.liked) next.add(slug); else next.delete(slug);
            localStorage.setItem('kz_liked_posts', JSON.stringify(Array.from(next)));
            return next;
          });
        }
      }
    } catch {
      // Rollback optimiste si erreur
      fetchPosts();
    }
  }

  const canPost = user && CAN_POST.includes(user.role);
  const featured = posts[0];
  const rest     = posts.slice(1);

  return (
    <div style={{background:C.bg,minHeight:'100vh',fontFamily:"system-ui,-apple-system,'Segoe UI',sans-serif",color:C.text,overflowX:'hidden'}}>
      <GridBg/>
      <Navbar/>

      {/* HERO */}
      <section style={{position:'relative',padding:'150px 32px 70px',overflow:'hidden',zIndex:1}}>
        <Blob color={C.blue} style={{width:600,height:400,top:-100,right:-100}}/>
        <div style={{maxWidth:1280,margin:'0 auto',display:'flex',justifyContent:'space-between',alignItems:'flex-end',flexWrap:'wrap',gap:24}}>
          <div style={{maxWidth:560}}>
            <div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'6px 16px',background:'rgba(6,182,212,0.08)',border:'1px solid rgba(6,182,212,0.2)',borderRadius:99,fontSize:12,fontWeight:700,color:C.cyan,letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:18}}>// Blog RH</div>
            <h1 style={{fontSize:'clamp(26px,5vw,52px)',fontWeight:900,letterSpacing:'-0.04em',lineHeight:1.1,marginBottom:14}}>
              Partages & actualités<br/>
              <span style={{background:'linear-gradient(135deg,#06B6D4,#3B82F6)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>de la communauté RH.</span>
            </h1>
            <p style={{fontSize:16,color:C.sub,lineHeight:1.7,maxWidth:480}}>
              Un espace de partage entre DRH, responsables RH et équipe Konza. Bonnes pratiques, actualités fiscales, retours d'expérience.
            </p>
          </div>
          <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:8}}>
            {canPost ? (
              <>
                <button onClick={() => setShowCreate(true)}
                  style={{display:'inline-flex',alignItems:'center',gap:8,background:'linear-gradient(135deg,#06B6D4,#3B82F6)',color:'#fff',border:'none',fontWeight:800,fontSize:14,padding:'12px 24px',borderRadius:11,cursor:'pointer',boxShadow:'0 0 28px rgba(6,182,212,0.28)',fontFamily:'inherit'}}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                  Publier un article
                </button>
                {quota&&!quota.unlimited&&(
                  <p style={{fontSize:11,color:quota.remaining===0?'#FCA5A5':C.muted}}>{quota.used}/{quota.limit} posts ce mois · {quota.remaining} restant{quota.remaining!==1?'s':''}</p>
                )}
              </>
            ) : !user ? (
              <Link href="/auth/login" style={{display:'inline-flex',alignItems:'center',gap:7,border:`1px solid ${C.border}`,color:C.sub,textDecoration:'none',fontWeight:600,fontSize:13.5,padding:'10px 18px',borderRadius:10}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>
                Se connecter pour publier
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      {/* FILTRES */}
      <section style={{position:'relative',zIndex:1,borderTop:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`,background:'rgba(255,255,255,0.01)'}}>
        <div style={{maxWidth:1280,margin:'0 auto',padding:'14px 32px',display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',justifyContent:'space-between'}}>
          <div style={{display:'flex',gap:7,flexWrap:'wrap'}}>
            {CATS.map(c=>(
              <button key={c.value} onClick={()=>setCat(c.value)}
                style={{padding:'6px 13px',borderRadius:99,fontSize:12.5,fontWeight:600,cursor:'pointer',border:`1px solid ${cat===c.value?C.cyan:C.border}`,background:cat===c.value?'rgba(6,182,212,0.1)':'transparent',color:cat===c.value?C.cyan:C.sub,transition:'all 0.15s',fontFamily:'inherit'}}>
                {c.label}
              </button>
            ))}
          </div>
          <div style={{position:'relative'}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher..."
              style={{padding:'8px 13px 8px 33px',background:C.card,border:`1px solid ${C.border}`,borderRadius:9,color:C.text,fontSize:13,outline:'none',fontFamily:'inherit',width:200,transition:'border-color 0.2s'}}
              onFocus={e=>e.target.style.borderColor=C.cyan} onBlur={e=>e.target.style.borderColor=C.border}/>
          </div>
        </div>
      </section>

      {/* CONTENU */}
      <section style={{position:'relative',zIndex:1}}>
        <div style={{maxWidth:1280,margin:'0 auto',padding:'56px 32px'}}>
          {loading ? (
            <div style={{textAlign:'center',padding:'72px 0'}}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.cyan} strokeWidth="2" style={{animation:'spin 1s linear infinite',margin:'0 auto 14px',display:'block'}}><circle cx="12" cy="12" r="10" strokeOpacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
              <p style={{color:C.muted,fontSize:14}}>Chargement des articles...</p>
            </div>
          ) : posts.length === 0 ? (
            <div style={{textAlign:'center',padding:'72px 0'}}>
              <div style={{fontSize:44,marginBottom:14}}>📝</div>
              <h3 style={{fontSize:19,fontWeight:700,color:C.text,marginBottom:8}}>Aucun article trouvé</h3>
              <p style={{color:C.muted,fontSize:14}}>{search?`Aucun résultat pour "${search}"`:'Pas encore d\'articles dans cette catégorie.'}</p>
              {canPost&&<button onClick={()=>setShowCreate(true)} style={{marginTop:20,padding:'10px 22px',background:'linear-gradient(135deg,#06B6D4,#3B82F6)',border:'none',borderRadius:10,color:'#fff',fontWeight:700,cursor:'pointer',fontFamily:'inherit',fontSize:14}}>Publier le premier article</button>}
            </div>
          ) : (
            <>
              {/* Featured */}
              {featured && !debSearch && page === 1 && (
                <Reveal>
                  <div style={{marginBottom:36}}>
                    <p style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:14}}>À la une</p>
                    <FeaturedCard post={featured} onLike={handleLike}/>
                  </div>
                </Reveal>
              )}

              {/* Grille */}
              {(debSearch||page>1?posts:rest).length > 0 && (
                <Reveal>
                  <p style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:18}}>
                    {debSearch||page>1?`${posts.length} article${posts.length>1?'s':''}`:'Derniers articles'}
                  </p>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:20}} className="posts-grid">
                    {(debSearch||page>1?posts:rest).map((p,i)=>(
                      <Reveal key={p.id} delay={i*35}><PostCard post={p} onLike={handleLike}/></Reveal>
                    ))}
                  </div>
                </Reveal>
              )}

              {/* Pagination */}
              {totalPgs > 1 && (
                <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:8,marginTop:44}}>
                  <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
                    style={{padding:'8px 15px',background:C.card,border:`1px solid ${C.border}`,borderRadius:8,color:page===1?C.muted:C.text,cursor:page===1?'not-allowed':'pointer',fontFamily:'inherit',fontSize:13,fontWeight:600}}>← Précédent</button>
                  {Array.from({length:Math.min(5,totalPgs)},(_,i)=>{
                    const pg=Math.max(1,Math.min(totalPgs-4,page-2))+i;
                    return<button key={pg} onClick={()=>setPage(pg)}
                      style={{width:36,height:36,borderRadius:8,border:`1px solid ${pg===page?C.cyan:C.border}`,background:pg===page?'rgba(6,182,212,0.12)':'transparent',color:pg===page?C.cyan:C.sub,cursor:'pointer',fontWeight:700,fontSize:13,fontFamily:'inherit'}}>{pg}</button>;
                  })}
                  <button onClick={()=>setPage(p=>Math.min(totalPgs,p+1))} disabled={page===totalPgs}
                    style={{padding:'8px 15px',background:C.card,border:`1px solid ${C.border}`,borderRadius:8,color:page===totalPgs?C.muted:C.text,cursor:page===totalPgs?'not-allowed':'pointer',fontFamily:'inherit',fontSize:13,fontWeight:600}}>Suivant →</button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Footer/>

      {showCreate && <CreateModal quota={quota} onClose={()=>setShowCreate(false)} onSuccess={()=>{ setShowCreate(false); setPage(1); fetchPosts(); }}/>}

      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        ::-webkit-scrollbar{width:6px;background:#020817}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:3px}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @media(max-width:900px){.posts-grid{grid-template-columns:repeat(2,1fr)!important}.feat-card{grid-template-columns:1fr!important}}
        @media(max-width:580px){.posts-grid{grid-template-columns:1fr!important}}
      `}</style>
    </div>
  );
}