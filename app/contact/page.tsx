// ============================================================================
// 📁 app/contact/page.tsx — Konza RH · Contact (dynamique → super admin)
// Le formulaire poste vers POST /api/contact → enregistré en DB + email super admin
// ============================================================================
'use client';
import React,{useState,useEffect,useRef}from'react';
import Link from'next/link';
import{Navbar}from'@/components/landing/Navbar';
import{Footer}from'@/components/landing/Footer';

const C={
  bg:'#020817',card:'#0A1628',cardHov:'#0F1E35',
  border:'rgba(255,255,255,0.07)',
  cyan:'#06B6D4',blue:'#3B82F6',purple:'#8B5CF6',
  green:'#10B981',orange:'#F59E0B',
  text:'#F8FAFC',muted:'#64748B',sub:'#94A3B8',
};

function GridBg(){return<div style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none',backgroundImage:`linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)`,backgroundSize:'44px 44px'}}/>;}
function Blob({color,style}:{color:string;style:React.CSSProperties}){return<div style={{position:'absolute',borderRadius:'50%',filter:'blur(120px)',opacity:0.1,pointerEvents:'none',background:color,...style}}/>;}

function useReveal(){
  const ref=useRef<HTMLDivElement>(null);
  const[v,setV]=useState(false);
  useEffect(()=>{
    const el=ref.current;if(!el)return;
    const obs=new IntersectionObserver(([e])=>{if(e.isIntersecting)setV(true)},{threshold:0.08});
    obs.observe(el);return()=>obs.disconnect();
  },[]);
  return{ref,visible:v};
}
function Reveal({children,delay=0}:{children:React.ReactNode;delay?:number}){
  const{ref,visible}=useReveal();
  return<div ref={ref} style={{opacity:visible?1:0,transform:visible?'none':'translateY(24px)',transition:`opacity 0.55s ease ${delay}ms,transform 0.55s ease ${delay}ms`}}>{children}</div>;
}

const SUBJECTS=['Demande de démo','Question sur les tarifs','Support technique','Partenariat commercial','Demande de formation sur site','Signalement / Bug','Autre'];

const CONTACTS=[
  {icon:<MailIcon/>,label:'Email',value:'contact@konzarh.com',href:'mailto:contact@konzarh.com',color:C.cyan},
  {icon:<PhoneIcon/>,label:'Téléphone',value:'+242 053 079 107',href:'tel:+242053079107',color:C.green},
  {icon:<MapIcon/>,label:'Adresse',value:'Pointe-Noire, Congo-Brazzaville',href:null,color:C.purple},
  {icon:<ClockIcon/>,label:'Disponibilité',value:'Lun–Ven, 8h–18h (heure CG)',href:null,color:C.orange},
];

// ─── Route API à créer : POST /api/contact ────────────────────────────────────
// Elle doit :
// 1. Valider les champs (zod)
// 2. Insérer en DB (table ContactMessage si vous l'ajoutez au schema)
// 3. Envoyer un email au SUPER_ADMIN via Resend/Nodemailer
// 4. Retourner { success: true }
// ─────────────────────────────────────────────────────────────────────────────

type Status='idle'|'sending'|'success'|'error';

export default function ContactPage(){
  const[form,setForm]=useState({name:'',email:'',company:'',phone:'',subject:'',message:''});
  const[status,setStatus]=useState<Status>('idle');
  const[errorMsg,setErrorMsg]=useState('');

  const set=(field:string)=>(e:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>)=>
    setForm(p=>({...p,[field]:e.target.value}));

  async function submit(e:React.FormEvent){
    e.preventDefault();
    setStatus('sending');setErrorMsg('');
    try{
      // 📡 Appel API — créez POST /api/contact dans votre projet Next.js
      const res=await fetch('/api/contact',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(form),
      });
      if(!res.ok){const d=await res.json();throw new Error(d.error||'Erreur serveur');}
      setStatus('success');
    }catch(err:unknown){
      // En développement, simuler le succès si l'API n'existe pas encore
      if(process.env.NODE_ENV==='development'){setStatus('success');return;}
      setErrorMsg(err instanceof Error?err.message:'Une erreur est survenue. Réessayez ou contactez-nous directement.');
      setStatus('error');
    }
  }

  const inp:React.CSSProperties={width:'100%',padding:'12px 16px',background:C.card,border:`1px solid ${C.border}`,borderRadius:10,color:C.text,fontSize:15,outline:'none',fontFamily:'inherit',transition:'border-color 0.2s'};
  const foc=(e:React.FocusEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>)=>e.target.style.borderColor=C.cyan;
  const blu=(e:React.FocusEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>)=>e.target.style.borderColor=C.border;

  return(
    <div style={{background:C.bg,minHeight:'100vh',fontFamily:"system-ui,-apple-system,'Segoe UI',sans-serif",color:C.text,overflowX:'hidden'}}>
      <GridBg/><Navbar/>

      {/* HERO */}
      <section style={{position:'relative',padding:'160px 32px 80px',textAlign:'center',overflow:'hidden',zIndex:1}}>
        <Blob color={C.cyan} style={{width:600,height:400,top:-100,left:'50%',transform:'translateX(-50%)'}}/>
        <div style={{maxWidth:640,margin:'0 auto',position:'relative'}}>
          <Chip>// Contact</Chip>
          <h1 style={{fontSize:'clamp(32px,5vw,58px)',fontWeight:900,letterSpacing:'-0.04em',lineHeight:1.1,margin:'20px 0 18px'}}>
            On vous répond<br/>
            <span style={{background:'linear-gradient(135deg,#06B6D4,#3B82F6)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>sous 24 heures.</span>
          </h1>
          <p style={{fontSize:18,color:C.sub,lineHeight:1.7}}>Une question sur la paie, un besoin de démo, un projet d'intégration ? Notre équipe à Pointe-Noire est là.</p>
        </div>
      </section>

      {/* MAIN */}
      <section style={{position:'relative',zIndex:1,borderTop:`1px solid ${C.border}`}}>
        <div style={{maxWidth:1160,margin:'0 auto',padding:'80px 32px',display:'grid',gridTemplateColumns:'1fr 1.7fr',gap:56,alignItems:'start'}} className="contact-layout">

          {/* Colonne gauche */}
          <div style={{display:'flex',flexDirection:'column',gap:24}}>
            <Reveal>
              <h2 style={{fontSize:21,fontWeight:800,color:C.text,letterSpacing:'-0.02em',marginBottom:8}}>Parlons de votre projet</h2>
              <p style={{fontSize:14,color:C.sub,lineHeight:1.75}}>Démo, questions techniques, devis ou simple curiosité — on répond en français, par des Congolais qui connaissent votre réalité.</p>
            </Reveal>

            <div style={{display:'flex',flexDirection:'column',gap:11}}>
              {CONTACTS.map((c,i)=>(
                <Reveal key={c.label} delay={i*55}>
                  <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:'14px 16px',display:'flex',alignItems:'center',gap:12}}>
                    <div style={{width:38,height:38,borderRadius:10,background:c.color+'18',color:c.color,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{c.icon}</div>
                    <div>
                      <div style={{fontSize:10.5,color:C.muted,fontWeight:700,letterSpacing:'0.07em',textTransform:'uppercase',marginBottom:3}}>{c.label}</div>
                      {c.href?<a href={c.href} style={{fontSize:13.5,color:c.color,textDecoration:'none',fontWeight:600}}>{c.value}</a>:<span style={{fontSize:13.5,color:C.sub}}>{c.value}</span>}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={220}>
              <div style={{background:'linear-gradient(135deg,rgba(6,182,212,0.08),rgba(59,130,246,0.05))',border:'1px solid rgba(6,182,212,0.2)',borderRadius:14,padding:'18px'}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                  <div style={{width:7,height:7,borderRadius:'50%',background:C.green}}/>
                  <span style={{fontSize:12.5,fontWeight:700,color:C.green}}>Équipe disponible</span>
                </div>
                <p style={{fontSize:13,color:C.sub,lineHeight:1.7}}>Temps de réponse moyen : <strong style={{color:C.text}}>moins de 4h</strong> en journée.</p>
              </div>
            </Reveal>

            <Reveal delay={280}>
              <div>
                <p style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:12}}>Liens utiles</p>
                <div style={{display:'flex',flexDirection:'column',gap:9}}>
                  {[{l:'Voir la FAQ',h:'/faq'},{l:'Consulter la documentation',h:'/docs'},{l:'Voir les tarifs',h:'/tarifs'},{l:'Essai gratuit (14 jours)',h:'/auth/register'}].map(lk=>(
                    <Link key={lk.l} href={lk.h} style={{display:'flex',alignItems:'center',gap:7,color:C.muted,textDecoration:'none',fontSize:13.5,fontWeight:500,transition:'color 0.15s'}}
                      onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color=C.cyan}
                      onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color=C.muted}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                      {lk.l}
                    </Link>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>

          {/* Formulaire */}
          <Reveal>
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:'36px 32px'}}>
              {status==='success'?(
                <div style={{textAlign:'center',padding:'40px 16px'}}>
                  <div style={{width:60,height:60,borderRadius:'50%',background:'rgba(16,185,129,0.12)',border:`1px solid ${C.green}40`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px'}}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                  </div>
                  <h3 style={{fontSize:21,fontWeight:800,color:C.text,marginBottom:10}}>Message envoyé !</h3>
                  <p style={{fontSize:14.5,color:C.sub,lineHeight:1.75,marginBottom:22}}>
                    Merci <strong style={{color:C.text}}>{form.name}</strong>. Notre équipe vous répondra sous 24h à <span style={{color:C.cyan}}>{form.email}</span>.
                  </p>
                  <button onClick={()=>{setStatus('idle');setForm({name:'',email:'',company:'',phone:'',subject:'',message:''});}}
                    style={{padding:'9px 22px',background:'rgba(255,255,255,0.05)',border:`1px solid ${C.border}`,borderRadius:8,color:C.sub,fontSize:13.5,cursor:'pointer',fontFamily:'inherit'}}>
                    Envoyer un autre message
                  </button>
                </div>
              ):(
                <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:18}}>
                  <div>
                    <h3 style={{fontSize:19,fontWeight:800,color:C.text,marginBottom:5,letterSpacing:'-0.02em'}}>Écrivez-nous</h3>
                    <p style={{fontSize:12.5,color:C.muted}}>Les champs marqués * sont obligatoires.</p>
                  </div>

                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}} className="form-row">
                    <div>
                      <label style={{display:'block',fontSize:12.5,color:C.sub,marginBottom:6,fontWeight:500}}>Nom complet *</label>
                      <input value={form.name} onChange={set('name')} required placeholder="Jean-Pierre M." style={inp} onFocus={foc} onBlur={blu}/>
                    </div>
                    <div>
                      <label style={{display:'block',fontSize:12.5,color:C.sub,marginBottom:6,fontWeight:500}}>Email *</label>
                      <input type="email" value={form.email} onChange={set('email')} required placeholder="drh@entreprise.com" style={inp} onFocus={foc} onBlur={blu}/>
                    </div>
                  </div>

                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}} className="form-row">
                    <div>
                      <label style={{display:'block',fontSize:12.5,color:C.sub,marginBottom:6,fontWeight:500}}>Entreprise</label>
                      <input value={form.company} onChange={set('company')} placeholder="Nom de votre société" style={inp} onFocus={foc} onBlur={blu}/>
                    </div>
                    <div>
                      <label style={{display:'block',fontSize:12.5,color:C.sub,marginBottom:6,fontWeight:500}}>Téléphone</label>
                      <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+242 0X XXX XXXX" style={inp} onFocus={foc} onBlur={blu}/>
                    </div>
                  </div>

                  <div>
                    <label style={{display:'block',fontSize:12.5,color:C.sub,marginBottom:6,fontWeight:500}}>Sujet *</label>
                    <select value={form.subject} onChange={set('subject')} required style={{...inp,appearance:'none',cursor:'pointer'}} onFocus={foc} onBlur={blu}>
                      <option value="" style={{background:'#0A1628'}}>Choisissez un sujet</option>
                      {SUBJECTS.map(s=><option key={s} value={s} style={{background:'#0A1628'}}>{s}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{display:'block',fontSize:12.5,color:C.sub,marginBottom:6,fontWeight:500}}>Message *</label>
                    <textarea value={form.message} onChange={set('message')} required rows={5}
                      placeholder="Décrivez votre besoin en détail. Plus vous êtes précis, mieux nous pourrons vous aider."
                      style={{...inp,resize:'vertical',minHeight:110}} onFocus={foc} onBlur={blu}/>
                  </div>

                  {status==='error'&&(
                    <div style={{padding:'12px 16px',background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.25)',borderRadius:10,fontSize:13,color:'#FCA5A5',lineHeight:1.6}}>
                      ⚠ {errorMsg}
                    </div>
                  )}

                  <button type="submit" disabled={status==='sending'} style={{
                    padding:'14px 20px',background:status==='sending'?'rgba(6,182,212,0.45)':'linear-gradient(135deg,#06B6D4,#3B82F6)',
                    border:'none',borderRadius:12,color:'#fff',fontWeight:800,fontSize:15,
                    cursor:status==='sending'?'not-allowed':'pointer',
                    display:'flex',alignItems:'center',justifyContent:'center',gap:10,
                    boxShadow:status!=='sending'?'0 0 28px rgba(6,182,212,0.25)':'none',
                    transition:'all 0.2s',fontFamily:'inherit',
                  }}>
                    {status==='sending'?(
                      <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{animation:'spin 1s linear infinite'}}><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>Envoi en cours...</>
                    ):(
                      <>Envoyer le message<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/></svg></>
                    )}
                  </button>
                  <p style={{fontSize:11.5,color:C.muted,textAlign:'center',lineHeight:1.6}}>
                    En soumettant, vous acceptez notre <Link href="/privacy" style={{color:C.cyan,textDecoration:'none'}}>politique de confidentialité</Link>. Votre message est transmis directement à notre équipe.
                  </p>
                </form>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      <Footer/>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}html{scroll-behavior:smooth}::-webkit-scrollbar{width:6px;background:#020817}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:3px}@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@media(max-width:860px){.contact-layout{grid-template-columns:1fr!important}}@media(max-width:540px){.form-row{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}

function Chip({children}:{children:React.ReactNode}){return<div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'6px 16px',background:'rgba(6,182,212,0.08)',border:'1px solid rgba(6,182,212,0.2)',borderRadius:99,fontSize:12,fontWeight:700,color:C.cyan,letterSpacing:'0.08em',textTransform:'uppercase' as const}}>{children}</div>;}
function MailIcon(){return<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;}
function PhoneIcon(){return<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012.18 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.15a16 16 0 006.94 6.94l1.52-1.52a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>;}
function MapIcon(){return<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>;}
function ClockIcon(){return<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;}