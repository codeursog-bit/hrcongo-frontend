// ============================================================================
// 📁 app/blog/page.tsx — Konza RH · Blog (dynamique)
// Lecture : tout le monde (pour les posts GLOBAL)
// Like : utilisateurs connectés
// Publier : HR_MANAGER, ADMIN, SUPER_ADMIN, CABINET_ADMIN (4 posts/mois/entreprise)
// ============================================================================
'use client';
import React,{useState,useEffect,useRef,useCallback}from'react';
import Link from'next/link';
import{Navbar}from'@/components/landing/Navbar';
import{Footer}from'@/components/landing/Footer';

const C={
  bg:'#020817',card:'#0A1628',cardHov:'#0F1E35',
  border:'rgba(255,255,255,0.07)',
  cyan:'#06B6D4',blue:'#3B82F6',purple:'#8B5CF6',
  green:'#10B981',orange:'#F59E0B',pink:'#EC4899',
  text:'#F8FAFC',muted:'#64748B',sub:'#94A3B8',
};

// Rôles autorisés à publier (selon schema.prisma)
const CAN_POST_ROLES=['HR_MANAGER','ADMIN','SUPER_ADMIN','CABINET_ADMIN'];

const CATEGORIES=[
  {value:'',label:'Tous'},
  {value:'ANNONCE',label:'Annonces'},
  {value:'PAIE',label:'Paie & Fiscalité'},
  {value:'DROIT_TRAVAIL',label:'Droit du travail'},
  {value:'RECRUTEMENT',label:'Recrutement'},
  {value:'FORMATION',label:'Formation'},
  {value:'TEMOIGNAGE',label:'Témoignages'},
  {value:'GENERAL',label:'Général'},
];

const CAT_COLORS:Record<string,{bg:string;text:string}>={
  ANNONCE:{bg:'rgba(245,158,11,0.15)',text:'#F59E0B'},
  PAIE:{bg:'rgba(6,182,212,0.15)',text:'#06B6D4'},
  DROIT_TRAVAIL:{bg:'rgba(139,92,246,0.15)',text:'#8B5CF6'},
  RECRUTEMENT:{bg:'rgba(16,185,129,0.15)',text:'#10B981'},
  FORMATION:{bg:'rgba(59,130,246,0.15)',text:'#3B82F6'},
  TEMOIGNAGE:{bg:'rgba(236,72,153,0.15)',text:'#EC4899'},
  GENERAL:{bg:'rgba(100,116,139,0.15)',text:'#94A3B8'},
};

const ROLE_LABELS:Record<string,string>={
  SUPER_ADMIN:'Konza RH',
  ADMIN:'Administrateur',
  HR_MANAGER:'Responsable RH',
  CABINET_ADMIN:'Cabinet',
};

type Post={
  id:string;title:string;slug:string;excerpt?:string;coverImage?:string;
  category:string;scope:string;likesCount:number;publishedAt:string;hasLiked?:boolean;
  author:{id:string;firstName:string;lastName:string;role:string;company?:{tradeName?:string;legalName:string;logo?:string}};
  company?:{tradeName?:string;legalName:string;logo?:string};
};

type Quota={used:number;limit:number;remaining:number;canPost:boolean;unlimited?:boolean};
type User={id:string;firstName:string;lastName:string;role:string;companyId?:string}|null;

function GridBg(){return<div style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none',backgroundImage:`linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)`,backgroundSize:'44px 44px'}}/>;}
function Blob({color,style}:{color:string;style:React.CSSProperties}){return<div style={{position:'absolute',borderRadius:'50%',filter:'blur(120px)',opacity:0.1,pointerEvents:'none',background:color,...style}}/>;}

function useReveal(){
  const ref=useRef<HTMLDivElement>(null);
  const[v,setV]=useState(false);
  useEffect(()=>{
    const el=ref.current;if(!el)return;
    const obs=new IntersectionObserver(([e])=>{if(e.isIntersecting)setV(true)},{threshold:0.06});
    obs.observe(el);return()=>obs.disconnect();
  },[]);
  return{ref,visible:v};
}
function Reveal({children,delay=0}:{children:React.ReactNode;delay?:number}){
  const{ref,visible}=useReveal();
  return<div ref={ref} style={{opacity:visible?1:0,transform:visible?'none':'translateY(22px)',transition:`opacity 0.5s ease ${delay}ms,transform 0.5s ease ${delay}ms`}}>{children}</div>;
}

// ─── Post Card ────────────────────────────────────────────────────────────────
function PostCard({post,onLike,canLike}:{post:Post;onLike:(slug:string)=>void;canLike:boolean}){
  const[h,sH]=useState(false);
  const cat=CAT_COLORS[post.category]??CAT_COLORS.GENERAL;
  const companyName=post.company?.tradeName||post.company?.legalName||post.author.company?.tradeName||post.author.company?.legalName||'';
  const isSuperAdmin=post.author.role==='SUPER_ADMIN';
  const date=new Date(post.publishedAt).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'});

  return(
    <div onMouseEnter={()=>sH(true)} onMouseLeave={()=>sH(false)}
      style={{background:h?C.cardHov:C.card,border:`1px solid ${h?'rgba(6,182,212,0.3)':C.border}`,borderRadius:16,overflow:'hidden',transition:'all 0.25s ease',transform:h?'translateY(-4px)':'none',display:'flex',flexDirection:'column'}}>

      {/* Cover image */}
      {post.coverImage?(
        <div style={{height:180,overflow:'hidden',position:'relative',flexShrink:0}}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.coverImage} alt={post.title} style={{width:'100%',height:'100%',objectFit:'cover',filter:'brightness(0.65)',transition:'transform 0.4s',transform:h?'scale(1.05)':'scale(1)'}}/>
          <div style={{position:'absolute',inset:0,background:`linear-gradient(to bottom,transparent 40%,${C.card}E0)`}}/>
          {/* Category badge flottant */}
          <span style={{position:'absolute',top:12,left:12,fontSize:10,fontWeight:800,letterSpacing:'0.07em',textTransform:'uppercase',color:cat.text,background:'rgba(5,8,22,0.8)',border:`1px solid ${cat.text}40`,padding:'3px 10px',borderRadius:99,backdropFilter:'blur(8px)'}}>
            {CATEGORIES.find(c=>c.value===post.category)?.label||post.category}
          </span>
          {isSuperAdmin&&<span style={{position:'absolute',top:12,right:12,fontSize:10,fontWeight:800,color:'#fff',background:'linear-gradient(135deg,#06B6D4,#3B82F6)',padding:'3px 10px',borderRadius:99}}>Officiel</span>}
        </div>
      ):(
        <div style={{height:80,flexShrink:0,background:cat.bg,display:'flex',alignItems:'center',padding:'0 20px',gap:10}}>
          <span style={{fontSize:12,fontWeight:800,color:cat.text,letterSpacing:'0.08em',textTransform:'uppercase'}}>{CATEGORIES.find(c=>c.value===post.category)?.label||post.category}</span>
          {isSuperAdmin&&<span style={{marginLeft:'auto',fontSize:10,fontWeight:800,color:'#fff',background:'linear-gradient(135deg,#06B6D4,#3B82F6)',padding:'3px 10px',borderRadius:99}}>Officiel</span>}
        </div>
      )}

      <div style={{padding:'20px 22px 22px',display:'flex',flexDirection:'column',gap:12,flex:1}}>
        {/* Auteur */}
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{width:28,height:28,borderRadius:'50%',background:`linear-gradient(135deg,${isSuperAdmin?C.cyan:C.blue},${isSuperAdmin?C.blue:C.purple})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:'#fff',flexShrink:0}}>
            {post.author.firstName[0]}{post.author.lastName[0]}
          </div>
          <div>
            <span style={{fontSize:12,fontWeight:700,color:C.text}}>{isSuperAdmin?'Konza RH':`${post.author.firstName} ${post.author.lastName}`}</span>
            <span style={{fontSize:11,color:C.muted,marginLeft:6}}>· {isSuperAdmin?'Équipe Konza RH':ROLE_LABELS[post.author.role]||post.author.role}{companyName&&!isSuperAdmin?` · ${companyName}`:''}</span>
          </div>
        </div>

        <Link href={`/blog/${post.slug}`} style={{textDecoration:'none'}}>
          <h3 style={{fontSize:16,fontWeight:800,color:C.text,letterSpacing:'-0.02em',lineHeight:1.35,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden',cursor:'pointer'}}>
            {post.title}
          </h3>
        </Link>

        {post.excerpt&&(
          <p style={{fontSize:13,color:C.sub,lineHeight:1.65,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
            {post.excerpt}
          </p>
        )}

        <div style={{marginTop:'auto',paddingTop:12,borderTop:`1px solid ${C.border}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span style={{fontSize:11.5,color:C.muted}}>{date}</span>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            {/* Like button */}
            <button onClick={()=>canLike&&onLike(post.slug)}
              style={{display:'flex',alignItems:'center',gap:5,background:'none',border:'none',cursor:canLike?'pointer':'default',padding:'4px 8px',borderRadius:8,color:post.hasLiked?C.pink:C.muted,transition:'all 0.15s',fontSize:12,fontWeight:600,fontFamily:'inherit'}}
              title={canLike?'Liker cet article':'Connectez-vous pour liker'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill={post.hasLiked?'currentColor':'none'} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              {post.likesCount}
            </button>
            <Link href={`/blog/${post.slug}`} style={{fontSize:12,fontWeight:700,color:C.cyan,textDecoration:'none'}}>Lire →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Featured post (premier, grande carte) ────────────────────────────────────
function FeaturedPost({post,onLike,canLike}:{post:Post;onLike:(slug:string)=>void;canLike:boolean}){
  const[h,sH]=useState(false);
  const cat=CAT_COLORS[post.category]??CAT_COLORS.GENERAL;
  const isSA=post.author.role==='SUPER_ADMIN';
  const date=new Date(post.publishedAt).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'});

  return(
    <div onMouseEnter={()=>sH(true)} onMouseLeave={()=>sH(false)}
      style={{background:h?C.cardHov:C.card,border:`1px solid ${h?'rgba(6,182,212,0.35)':C.border}`,borderRadius:20,overflow:'hidden',transition:'all 0.3s ease',display:'grid',gridTemplateColumns:'1fr 1fr',minHeight:320}} className="feat-post">

      {/* Image */}
      <div style={{position:'relative',overflow:'hidden'}}>
        {post.coverImage?(
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={post.coverImage} alt={post.title} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',filter:'brightness(0.6)',transition:'transform 0.4s',transform:h?'scale(1.04)':'scale(1)'}}/>
        ):(
          <div style={{position:'absolute',inset:0,background:`linear-gradient(135deg,${cat.bg},${C.card})`}}/>
        )}
        <div style={{position:'absolute',inset:0,background:'linear-gradient(to right,transparent 50%,#0A1628CC)'}}/>
        <div style={{position:'absolute',top:16,left:16,display:'flex',gap:8}}>
          <span style={{fontSize:11,fontWeight:800,color:cat.text,background:'rgba(5,8,22,0.8)',border:`1px solid ${cat.text}40`,padding:'4px 12px',borderRadius:99,backdropFilter:'blur(8px)',letterSpacing:'0.07em',textTransform:'uppercase'}}>
            {CATEGORIES.find(c=>c.value===post.category)?.label}
          </span>
          {isSA&&<span style={{fontSize:11,fontWeight:800,color:'#fff',background:'linear-gradient(135deg,#06B6D4,#3B82F6)',padding:'4px 12px',borderRadius:99}}>Officiel</span>}
        </div>
      </div>

      {/* Contenu */}
      <div style={{padding:'32px 32px',display:'flex',flexDirection:'column',justifyContent:'center',gap:16}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{width:32,height:32,borderRadius:'50%',background:`linear-gradient(135deg,${isSA?C.cyan:C.blue},${isSA?C.blue:C.purple})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,color:'#fff'}}>
            {isSA?'K':post.author.firstName[0]+post.author.lastName[0]}
          </div>
          <div>
            <span style={{fontSize:13,fontWeight:700,color:C.text}}>{isSA?'Konza RH':`${post.author.firstName} ${post.author.lastName}`}</span>
            <span style={{fontSize:12,color:C.muted,marginLeft:5}}>· {date}</span>
          </div>
        </div>
        <Link href={`/blog/${post.slug}`} style={{textDecoration:'none'}}>
          <h2 style={{fontSize:'clamp(18px,2.5vw,26px)',fontWeight:900,color:C.text,letterSpacing:'-0.025em',lineHeight:1.25,cursor:'pointer'}}>{post.title}</h2>
        </Link>
        {post.excerpt&&<p style={{fontSize:14.5,color:C.sub,lineHeight:1.7,display:'-webkit-box',WebkitLineClamp:3,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{post.excerpt}</p>}
        <div style={{display:'flex',alignItems:'center',gap:14,marginTop:4}}>
          <Link href={`/blog/${post.slug}`} style={{display:'inline-flex',alignItems:'center',gap:7,background:'linear-gradient(135deg,#06B6D4,#3B82F6)',color:'#fff',textDecoration:'none',fontWeight:800,fontSize:14,padding:'10px 20px',borderRadius:10}}>
            Lire l'article
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
          <button onClick={()=>canLike&&onLike(post.slug)}
            style={{display:'flex',alignItems:'center',gap:6,background:'none',border:`1px solid ${post.hasLiked?C.pink+'50':C.border}`,borderRadius:8,padding:'8px 14px',cursor:canLike?'pointer':'default',color:post.hasLiked?C.pink:C.muted,fontSize:13,fontWeight:600,fontFamily:'inherit',transition:'all 0.15s'}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill={post.hasLiked?'currentColor':'none'} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            {post.likesCount}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Créer un post ──────────────────────────────────────────────────────
function CreatePostModal({quota,onClose,onSuccess}:{quota:Quota|null;onClose:()=>void;onSuccess:()=>void}){
  const[form,setForm]=useState({title:'',excerpt:'',content:'',category:'GENERAL',coverImage:'',published:true});
  const[status,setStatus]=useState<'idle'|'sending'|'error'>('idle');
  const[err,setErr]=useState('');

  const set=(f:string)=>(e:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>)=>
    setForm(p=>({...p,[f]:e.target.type==='checkbox'?(e.target as HTMLInputElement).checked:e.target.value}));

  async function submit(e:React.FormEvent){
    e.preventDefault();setStatus('sending');setErr('');
    try{
      const res=await fetch('/api/blog',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});
      const d=await res.json();
      if(!res.ok)throw new Error(d.error||'Erreur');
      onSuccess();
    }catch(ex:unknown){setErr(ex instanceof Error?ex.message:'Erreur');setStatus('error');}
  }

  const inp:React.CSSProperties={width:'100%',padding:'11px 14px',background:'#020817',border:`1px solid ${C.border}`,borderRadius:9,color:C.text,fontSize:14,outline:'none',fontFamily:'inherit'};

  return(
    <div style={{position:'fixed',inset:0,zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:20,background:'rgba(0,0,0,0.7)',backdropFilter:'blur(4px)'}}>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,width:'100%',maxWidth:680,maxHeight:'90vh',overflow:'auto',padding:'32px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
          <div>
            <h2 style={{fontSize:20,fontWeight:800,color:C.text,marginBottom:4}}>Publier un article</h2>
            {quota&&!quota.unlimited&&<p style={{fontSize:12.5,color:quota.remaining===0?'#FCA5A5':C.muted}}>
              Quota ce mois : {quota.used}/{quota.limit} utilisé{quota.used>1?'s':''} · {quota.remaining} restant{quota.remaining>1?'s':''}
            </p>}
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',color:C.muted,cursor:'pointer',fontSize:24,lineHeight:1}}>×</button>
        </div>

        {quota&&quota.remaining===0&&!quota.unlimited?(
          <div style={{textAlign:'center',padding:'32px 0'}}>
            <div style={{fontSize:40,marginBottom:16}}>⏳</div>
            <h3 style={{fontSize:18,fontWeight:700,color:C.text,marginBottom:10}}>Quota mensuel atteint</h3>
            <p style={{fontSize:14,color:C.sub,lineHeight:1.7}}>Votre entreprise a utilisé ses {quota.limit} publications ce mois. Revenez le mois prochain.</p>
          </div>
        ):(
          <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:16}}>
            <div>
              <label style={{display:'block',fontSize:12.5,color:C.sub,marginBottom:5,fontWeight:500}}>Titre *</label>
              <input value={form.title} onChange={set('title')} required placeholder="Un titre accrocheur..." style={inp}
                onFocus={e=>e.target.style.borderColor=C.cyan} onBlur={e=>e.target.style.borderColor=C.border}/>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
              <div>
                <label style={{display:'block',fontSize:12.5,color:C.sub,marginBottom:5,fontWeight:500}}>Catégorie</label>
                <select value={form.category} onChange={set('category')} style={{...inp,appearance:'none',cursor:'pointer'}}
                  onFocus={e=>e.target.style.borderColor=C.cyan} onBlur={e=>e.target.style.borderColor=C.border}>
                  {CATEGORIES.filter(c=>c.value!=='').map(c=><option key={c.value} value={c.value} style={{background:'#020817'}}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{display:'block',fontSize:12.5,color:C.sub,marginBottom:5,fontWeight:500}}>Image de couverture (URL)</label>
                <input value={form.coverImage} onChange={set('coverImage')} placeholder="https://..." style={inp}
                  onFocus={e=>e.target.style.borderColor=C.cyan} onBlur={e=>e.target.style.borderColor=C.border}/>
              </div>
            </div>
            <div>
              <label style={{display:'block',fontSize:12.5,color:C.sub,marginBottom:5,fontWeight:500}}>Résumé (optionnel)</label>
              <textarea value={form.excerpt} onChange={set('excerpt')} rows={2} placeholder="Un bref résumé de votre article..." style={{...inp,resize:'vertical'}}
                onFocus={e=>e.target.style.borderColor=C.cyan} onBlur={e=>e.target.style.borderColor=C.border}/>
            </div>
            <div>
              <label style={{display:'block',fontSize:12.5,color:C.sub,marginBottom:5,fontWeight:500}}>Contenu *</label>
              <textarea value={form.content} onChange={set('content')} required rows={8} placeholder="Rédigez votre article ici... Partagez votre expérience, vos conseils RH, une actualité..."
                style={{...inp,resize:'vertical',minHeight:200}}
                onFocus={e=>e.target.style.borderColor=C.cyan} onBlur={e=>e.target.style.borderColor=C.border}/>
            </div>
            <label style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer',fontSize:13.5,color:C.sub}}>
              <input type="checkbox" checked={form.published} onChange={set('published')} style={{width:16,height:16,accentColor:C.cyan}}/>
              Publier immédiatement
            </label>
            {err&&<div style={{padding:'11px 14px',background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.25)',borderRadius:9,fontSize:13,color:'#FCA5A5'}}>{err}</div>}
            <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
              <button type="button" onClick={onClose} style={{padding:'11px 20px',background:'none',border:`1px solid ${C.border}`,borderRadius:9,color:C.sub,cursor:'pointer',fontFamily:'inherit',fontSize:14}}>Annuler</button>
              <button type="submit" disabled={status==='sending'} style={{padding:'11px 24px',background:'linear-gradient(135deg,#06B6D4,#3B82F6)',border:'none',borderRadius:9,color:'#fff',fontWeight:800,fontSize:14,cursor:'pointer',fontFamily:'inherit',opacity:status==='sending'?0.6:1}}>
                {status==='sending'?'Publication...':'Publier l\'article'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── PAGE PRINCIPALE ──────────────────────────────────────────────────────────
export default function BlogPage(){
  const[posts,setPosts]=useState<Post[]>([]);
  const[loading,setLoading]=useState(true);
  const[page,setPage]=useState(1);
  const[totalPages,setTotalPages]=useState(1);
  const[category,setCategory]=useState('');
  const[search,setSearch]=useState('');
  const[debouncedSearch,setDebouncedSearch]=useState('');
  const[showCreate,setShowCreate]=useState(false);
  const[user,setUser]=useState<User>(null);
  const[quota,setQuota]=useState<Quota|null>(null);

  // Debounce search
  useEffect(()=>{const t=setTimeout(()=>setDebouncedSearch(search),400);return()=>clearTimeout(t);},[search]);

  // Fetch user (session)
  useEffect(()=>{
    fetch('/api/auth/me').then(r=>r.ok?r.json():null).then(d=>{if(d?.user)setUser(d.user);}).catch(()=>{});
  },[]);

  // Fetch quota if can post
  useEffect(()=>{
    if(user&&CAN_POST_ROLES.includes(user.role)){
      fetch('/api/blog/quota').then(r=>r.json()).then(setQuota).catch(()=>{});
    }
  },[user]);

  // Fetch posts
  const fetchPosts=useCallback(async()=>{
    setLoading(true);
    try{
      const params=new URLSearchParams({page:String(page),limit:'12',...(category?{category}:{}),...(debouncedSearch?{q:debouncedSearch}:{})});
      const r=await fetch(`/api/blog?${params}`);
      const d=await r.json();
      setPosts(d.posts||[]);
      setTotalPages(d.pagination?.totalPages||1);
    }catch{setPosts([]);}
    setLoading(false);
  },[page,category,debouncedSearch]);

  useEffect(()=>{fetchPosts();},[fetchPosts]);
  useEffect(()=>{setPage(1);},[category,debouncedSearch]);

  async function handleLike(slug:string){
    if(!user)return;
    try{
      const r=await fetch(`/api/blog/${slug}/like`,{method:'POST'});
      const d=await r.json();
      if(r.ok){
        setPosts(p=>p.map(post=>post.slug===slug?{...post,hasLiked:d.liked,likesCount:d.likesCount}:post));
      }
    }catch{}
  }

  const canPost=user&&CAN_POST_ROLES.includes(user.role);
  const canLike=!!user;
  const featured=posts[0];
  const rest=posts.slice(1);

  return(
    <div style={{background:C.bg,minHeight:'100vh',fontFamily:"system-ui,-apple-system,'Segoe UI',sans-serif",color:C.text,overflowX:'hidden'}}>
      <GridBg/>
      <Navbar/>

      {/* HERO */}
      <section style={{position:'relative',padding:'150px 32px 80px',overflow:'hidden',zIndex:1}}>
        <Blob color={C.blue} style={{width:600,height:400,top:-100,right:-100}}/>
        <div style={{maxWidth:1280,margin:'0 auto',display:'flex',justifyContent:'space-between',alignItems:'flex-end',flexWrap:'wrap',gap:24}}>
          <div style={{maxWidth:600}}>
            <div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'6px 16px',background:'rgba(6,182,212,0.08)',border:'1px solid rgba(6,182,212,0.2)',borderRadius:99,fontSize:12,fontWeight:700,color:C.cyan,letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:20}}>// Blog RH</div>
            <h1 style={{fontSize:'clamp(28px,5vw,56px)',fontWeight:900,letterSpacing:'-0.04em',lineHeight:1.1,marginBottom:16}}>
              Partages & actualités<br/>
              <span style={{background:'linear-gradient(135deg,#06B6D4,#3B82F6)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>de la communauté RH.</span>
            </h1>
            <p style={{fontSize:17,color:C.sub,lineHeight:1.7,maxWidth:500}}>
              Un espace pour que RH, admins et partenaires partagent leurs expériences, bonnes pratiques et actualités fiscales congolaises.
            </p>
          </div>
          {canPost&&(
            <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:8}}>
              <button onClick={()=>setShowCreate(true)}
                style={{display:'inline-flex',alignItems:'center',gap:8,background:'linear-gradient(135deg,#06B6D4,#3B82F6)',color:'#fff',border:'none',fontWeight:800,fontSize:15,padding:'13px 26px',borderRadius:12,cursor:'pointer',boxShadow:'0 0 30px rgba(6,182,212,0.28)',fontFamily:'inherit'}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                Publier un article
              </button>
              {quota&&!quota.unlimited&&(
                <p style={{fontSize:11.5,color:quota.remaining===0?'#FCA5A5':C.muted,textAlign:'right'}}>
                  {quota.used}/{quota.limit} posts ce mois · {quota.remaining} restant{quota.remaining>1?'s':''}
                </p>
              )}
            </div>
          )}
          {!user&&(
            <Link href="/auth/login" style={{display:'inline-flex',alignItems:'center',gap:8,border:`1px solid ${C.border}`,color:C.sub,textDecoration:'none',fontWeight:600,fontSize:14,padding:'11px 20px',borderRadius:11}}>
              Connectez-vous pour interagir
            </Link>
          )}
        </div>
      </section>

      {/* FILTRES */}
      <section style={{position:'relative',zIndex:1,borderTop:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`,background:'rgba(255,255,255,0.01)'}}>
        <div style={{maxWidth:1280,margin:'0 auto',padding:'16px 32px',display:'flex',alignItems:'center',gap:12,flexWrap:'wrap',justifyContent:'space-between'}}>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {CATEGORIES.map(cat=>(
              <button key={cat.value} onClick={()=>setCategory(cat.value)}
                style={{padding:'6px 14px',borderRadius:99,fontSize:13,fontWeight:600,cursor:'pointer',border:`1px solid ${category===cat.value?C.cyan:C.border}`,background:category===cat.value?'rgba(6,182,212,0.12)':'transparent',color:category===cat.value?C.cyan:C.sub,transition:'all 0.15s',fontFamily:'inherit'}}>
                {cat.label}
              </button>
            ))}
          </div>
          <div style={{position:'relative'}}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}>
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher..."
              style={{padding:'8px 14px 8px 36px',background:C.card,border:`1px solid ${C.border}`,borderRadius:9,color:C.text,fontSize:13.5,outline:'none',fontFamily:'inherit',width:220}}
              onFocus={e=>e.target.style.borderColor=C.cyan} onBlur={e=>e.target.style.borderColor=C.border}/>
          </div>
        </div>
      </section>

      {/* CONTENU */}
      <section style={{position:'relative',zIndex:1}}>
        <div style={{maxWidth:1280,margin:'0 auto',padding:'60px 32px'}}>

          {loading?(
            <div style={{textAlign:'center',padding:'80px 0'}}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.cyan} strokeWidth="2" style={{animation:'spin 1s linear infinite',margin:'0 auto 16px',display:'block'}}><circle cx="12" cy="12" r="10" strokeOpacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
              <p style={{color:C.muted,fontSize:14}}>Chargement des articles...</p>
            </div>
          ):posts.length===0?(
            <div style={{textAlign:'center',padding:'80px 0'}}>
              <div style={{fontSize:48,marginBottom:16}}>📝</div>
              <h3 style={{fontSize:20,fontWeight:700,color:C.text,marginBottom:10}}>Aucun article trouvé</h3>
              <p style={{color:C.muted,fontSize:14}}>{search?`Aucun résultat pour "${search}"`:'Soyez le premier à publier !'}</p>
              {canPost&&<button onClick={()=>setShowCreate(true)} style={{marginTop:20,padding:'10px 22px',background:'linear-gradient(135deg,#06B6D4,#3B82F6)',border:'none',borderRadius:10,color:'#fff',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>Publier un article</button>}
            </div>
          ):(
            <>
              {/* Featured */}
              {featured&&!debouncedSearch&&page===1&&(
                <Reveal>
                  <div style={{marginBottom:40}}>
                    <p style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:16}}>À la une</p>
                    <FeaturedPost post={featured} onLike={handleLike} canLike={canLike}/>
                  </div>
                </Reveal>
              )}

              {/* Grid */}
              {rest.length>0&&(
                <Reveal>
                  <p style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:20}}>
                    {debouncedSearch||page>1?`${posts.length} article${posts.length>1?'s':''} trouvé${posts.length>1?'s':''}`:'Derniers articles'}
                  </p>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:22}} className="posts-grid">
                    {(debouncedSearch||page>1?posts:rest).map((p,i)=>(
                      <Reveal key={p.id} delay={i*40}><PostCard post={p} onLike={handleLike} canLike={canLike}/></Reveal>
                    ))}
                  </div>
                </Reveal>
              )}

              {/* Pagination */}
              {totalPages>1&&(
                <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:10,marginTop:48}}>
                  <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
                    style={{padding:'8px 16px',background:C.card,border:`1px solid ${C.border}`,borderRadius:8,color:page===1?C.muted:C.text,cursor:page===1?'not-allowed':'pointer',fontFamily:'inherit',fontSize:13,fontWeight:600}}>
                    ← Précédent
                  </button>
                  {Array.from({length:Math.min(5,totalPages)},(_,i)=>{
                    const pg=Math.max(1,Math.min(totalPages-4,page-2))+i;
                    return<button key={pg} onClick={()=>setPage(pg)}
                      style={{width:38,height:38,borderRadius:8,border:`1px solid ${pg===page?C.cyan:C.border}`,background:pg===page?'rgba(6,182,212,0.15)':'transparent',color:pg===page?C.cyan:C.sub,cursor:'pointer',fontWeight:700,fontSize:13,fontFamily:'inherit'}}>
                      {pg}
                    </button>;
                  })}
                  <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
                    style={{padding:'8px 16px',background:C.card,border:`1px solid ${C.border}`,borderRadius:8,color:page===totalPages?C.muted:C.text,cursor:page===totalPages?'not-allowed':'pointer',fontFamily:'inherit',fontSize:13,fontWeight:600}}>
                    Suivant →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Footer/>

      {/* Modal */}
      {showCreate&&<CreatePostModal quota={quota} onClose={()=>setShowCreate(false)} onSuccess={()=>{setShowCreate(false);fetchPosts();}}/>}

      <style>{`*{box-sizing:border-box;margin:0;padding:0}html{scroll-behavior:smooth}::-webkit-scrollbar{width:6px;background:#020817}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:3px}@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@media(max-width:900px){.posts-grid{grid-template-columns:repeat(2,1fr)!important}.feat-post{grid-template-columns:1fr!important}}@media(max-width:600px){.posts-grid{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}