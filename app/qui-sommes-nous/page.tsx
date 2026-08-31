// ============================================================================
// 📁 app/qui-sommes-nous/page.tsx — Konza RH · Page À propos (statique)
// ============================================================================
'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';

const C = {
  bg:'#020817',card:'#0A1628',cardHov:'#0F1E35',
  border:'rgba(255,255,255,0.07)',
  cyan:'#06B6D4',blue:'#3B82F6',purple:'#8B5CF6',
  green:'#10B981',orange:'#F59E0B',pink:'#EC4899',
  red:'#EF4444',
  text:'#F8FAFC',muted:'#64748B',sub:'#94A3B8',
};

function GridBg(){return(<div style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none',backgroundImage:`linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)`,backgroundSize:'44px 44px'}}/>);}
function Blob({color,style}:{color:string;style:React.CSSProperties}){return<div style={{position:'absolute',borderRadius:'50%',filter:'blur(120px)',opacity:0.1,pointerEvents:'none',background:color,...style}}/>;}

function useReveal(){
  const ref=useRef<HTMLDivElement>(null);
  const [v,setV]=useState(false);
  useEffect(()=>{
    const el=ref.current;if(!el)return;
    const obs=new IntersectionObserver(([e])=>{if(e.isIntersecting)setV(true)},{threshold:0.08});
    obs.observe(el);return()=>obs.disconnect();
  },[]);
  return{ref,visible:v};
}

function Reveal({children,delay=0}:{children:React.ReactNode;delay?:number}){
  const{ref,visible}=useReveal();
  return<div ref={ref} style={{opacity:visible?1:0,transform:visible?'none':'translateY(28px)',transition:`opacity 0.6s ease ${delay}ms,transform 0.6s ease ${delay}ms`}}>{children}</div>;
}

const TEAM=[
  {name:'Nathan BONDOMA SOGOYA',role:'Fondateur & Dev Full-Stack',bio:'Développeur Next.js fullstack de Pointe-Noire. Concepteur de l\'architecture complète de Konza RH — du schéma PostgreSQL jusqu\'à l\'interface finale.',img:'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=75',tags:['Next.js 14','PostgreSQL','Prisma','TypeScript'],color:C.cyan},
  {name:'Pôle Juridique & Fiscal',role:'Conformité & Droit du travail',bio:'Experts du droit du travail congolais et de la fiscalité locale. Garants de la conformité CGI, CNSS et Code du Travail à chaque révision légale.',img:'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=400&q=75',tags:['Code du Travail','CGI 2025','CNSS','Fiscalité'],color:C.green},
  {name:'Équipe Support',role:'Accompagnement & Formation terrain',bio:'Notre équipe forme vos DRH à Pointe-Noire et Brazzaville, assure la migration de vos données et reste disponible pour chaque question.',img:'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=400&q=75',tags:['Formation','Migration data','Support','Terrain'],color:C.purple},
];

const VALUES=[
  {icon:'🇨🇬',title:'Congo d\'abord',desc:'Nous sommes de Pointe-Noire. Les coupures internet, les délais CNSS, les spécificités du CGI congolais — on les connaît. Konza RH est conçu pour ici, pas adapté depuis l\'étranger.'},
  {icon:'⚖️',title:'Conformité sans compromis',desc:'Chaque calcul est vérifié contre les textes légaux en vigueur. On met à jour les barèmes avant l\'entrée en application. Zéro surprise fiscale, zéro redressement.'},
  {icon:'🔒',title:'Vos données vous appartiennent',desc:'Chiffrement TLS 1.3, serveurs sécurisés, audit log complet. Vos données de paie ne sont jamais revendues ni partagées. Nous respectons votre confidentialité.'},
  {icon:'🚀',title:'Simplicité radicale',desc:'Une DRH qui ouvre Konza RH doit pouvoir lancer une paie sans formation. Si ce n\'est pas évident, on redesigne. La complexité reste dans le moteur, pas dans l\'interface.'},
];

const TIMELINE=[
  {year:'2023',title:'Naissance du projet',desc:'Constat : aucun logiciel RH ne gère correctement la fiscalité congolaise. Développement démarré à Pointe-Noire.',color:C.cyan},
  {year:'2024',title:'Première bêta',desc:'5 entreprises pilotes. 312 bulletins générés lors de la première clôture. Zéro erreur de calcul CNSS/IRPP.',color:C.blue},
  {year:'2025',title:'Lancement officiel',desc:'50+ entreprises actives, 2 000+ employés gérés. Conformité CGI 2025-2026 certifiée. Expansion vers Brazzaville.',color:C.green},
  {year:'2026',title:'Vision Afrique Centrale',desc:'Extension prévue au Gabon, Cameroun et RDC avec adaptation aux législations locales.',color:C.purple},
];

export default function AboutPage(){
  return(
    <div style={{background:C.bg,minHeight:'100vh',fontFamily:"system-ui,-apple-system,'Segoe UI',sans-serif",color:C.text,overflowX:'hidden'}}>
      <GridBg/>
      <Navbar/>

      {/* HERO */}
      <section style={{position:'relative',padding:'160px 32px 90px',textAlign:'center',overflow:'hidden',zIndex:1}}>
        <Blob color={C.cyan} style={{width:700,height:400,top:-150,left:'50%',transform:'translateX(-50%)'}}/>
        <div style={{maxWidth:780,margin:'0 auto',position:'relative'}}>
          <Chip>// Qui sommes-nous</Chip>
          <h1 style={{fontSize:'clamp(36px,6vw,68px)',fontWeight:900,letterSpacing:'-0.04em',lineHeight:1.05,margin:'20px 0 22px'}}>
            Fabriqué à Pointe-Noire.<br/>
            <span style={{background:'linear-gradient(135deg,#06B6D4,#3B82F6,#8B5CF6)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Pour le Congo entier.</span>
          </h1>
          <p style={{fontSize:19,color:C.sub,lineHeight:1.75,maxWidth:600,margin:'0 auto'}}>
            Konza RH est né d'un constat simple :{' '}
            <strong style={{color:C.text}}>aucun logiciel RH sur le marché ne gère correctement la fiscalité congolaise.</strong>{' '}
            On a décidé de construire celui qui manquait.
          </p>
        </div>
      </section>

      {/* HISTOIRE + TIMELINE */}
      <section style={{position:'relative',zIndex:1,borderTop:`1px solid ${C.border}`}}>
        <div style={{maxWidth:1280,margin:'0 auto',padding:'90px 32px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:72,alignItems:'center'}} className="ab-grid">
          <Reveal>
            <Chip>// Notre histoire</Chip>
            <h2 style={{fontSize:'clamp(26px,3.5vw,42px)',fontWeight:900,letterSpacing:'-0.03em',lineHeight:1.15,margin:'18px 0 24px'}}>
              Le problème qu'on a vécu<br/>avant de le résoudre
            </h2>
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              {['En travaillant avec des entreprises locales, le constat était toujours le même : les DRH passaient 3 à 5 jours par mois sur la paie — Excel, calculatrice, CNSS à la main. Les erreurs coûtaient cher. Les redressements fiscaux aussi.','Les solutions internationales ? Sans connaissance du CGI congolais, sans intégration CNSS, sans quotient familial. Et souvent inutilisables avec une connexion 3G.','Konza RH a été conçu de zéro, à Pointe-Noire, avec une obsession : que la paie soit juste, conforme et rapide — sans être ingénieur pour l\'utiliser.'].map((t,i)=>(
                <p key={i} style={{fontSize:14.5,color:C.sub,lineHeight:1.8}}>{t}</p>
              ))}
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              {TIMELINE.map((m,i)=>(
                <div key={i} style={{display:'flex',gap:18,background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:'18px 20px',alignItems:'flex-start'}}>
                  <div style={{minWidth:52,fontSize:13,fontWeight:900,color:m.color,fontFamily:'ui-monospace,monospace',paddingTop:2}}>{m.year}</div>
                  <div>
                    <div style={{fontSize:14,fontWeight:800,color:C.text,marginBottom:5}}>{m.title}</div>
                    <div style={{fontSize:13,color:C.sub,lineHeight:1.65}}>{m.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* VALEURS */}
      <section style={{position:'relative',zIndex:1,borderTop:`1px solid ${C.border}`,background:'rgba(6,182,212,0.015)'}}>
        <Blob color={C.purple} style={{width:500,height:500,bottom:-100,right:-100}}/>
        <div style={{maxWidth:1280,margin:'0 auto',padding:'90px 32px'}}>
          <Reveal><div style={{textAlign:'center',marginBottom:52}}><Chip>// Nos valeurs</Chip><h2 style={{fontSize:'clamp(26px,4vw,44px)',fontWeight:900,letterSpacing:'-0.03em',lineHeight:1.1,marginTop:18}}>Ce qui guide chaque décision</h2></div></Reveal>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:20}} className="val-grid">
            {VALUES.map((v,i)=>(
              <Reveal key={v.title} delay={i*60}><ValCard {...v}/></Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ÉQUIPE */}
      <section style={{position:'relative',zIndex:1,borderTop:`1px solid ${C.border}`}}>
        <div style={{maxWidth:1280,margin:'0 auto',padding:'90px 32px'}}>
          <Reveal>
            <div style={{textAlign:'center',marginBottom:52}}>
              <Chip>// L'équipe</Chip>
              <h2 style={{fontSize:'clamp(26px,4vw,44px)',fontWeight:900,letterSpacing:'-0.03em',lineHeight:1.1,margin:'18px 0 12px'}}>Les personnes derrière Konza RH</h2>
              <p style={{fontSize:16,color:C.sub,maxWidth:480,margin:'0 auto'}}>Une petite équipe, une grande obsession : que la paie au Congo soit enfin simple et juste.</p>
            </div>
          </Reveal>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:22}} className="team-grid">
            {TEAM.map((m,i)=><Reveal key={m.name} delay={i*80}><TeamCard {...m}/></Reveal>)}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{position:'relative',zIndex:1,borderTop:`1px solid ${C.border}`,background:'rgba(6,182,212,0.02)'}}>
        <div style={{maxWidth:1280,margin:'0 auto',padding:'72px 32px'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:20}} className="stats-grid">
            {[{val:'50+',label:'Entreprises actives',c:C.cyan},{val:'2 000+',label:'Employés gérés',c:C.blue},{val:'< 3 min',label:'Pour 500 bulletins',c:C.green},{val:'100 %',label:'Conformité CGI',c:C.purple}].map(s=>(
              <Reveal key={s.label}>
                <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:'30px 18px',textAlign:'center'}}>
                  <div style={{fontSize:38,fontWeight:900,color:s.c,letterSpacing:'-0.04em',lineHeight:1,fontFamily:'system-ui,sans-serif',marginBottom:10}}>{s.val}</div>
                  <div style={{fontSize:13,color:C.muted}}>{s.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{position:'relative',zIndex:1,borderTop:`1px solid ${C.border}`,padding:'90px 32px',textAlign:'center',overflow:'hidden'}}>
        <Blob color={C.cyan} style={{width:500,height:500,top:'50%',left:'50%',transform:'translate(-50%,-50%)'}}/>
        <div style={{maxWidth:600,margin:'0 auto',position:'relative'}}>
          <h2 style={{fontSize:'clamp(26px,4vw,42px)',fontWeight:900,letterSpacing:'-0.03em',lineHeight:1.15,marginBottom:18}}>Prêt à rejoindre l'aventure Konza RH ?</h2>
          <p style={{fontSize:17,color:C.sub,marginBottom:34,lineHeight:1.7}}>14 jours d'essai gratuit. Configuration en 30 minutes. Support en français, par des Congolais.</p>
          <div style={{display:'flex',justifyContent:'center',gap:14,flexWrap:'wrap'}}>
            <GradBtn href="/auth/register">Démarrer gratuitement</GradBtn>
            <GhostBtn href="/contact">Nous contacter</GhostBtn>
          </div>
        </div>
      </section>

      <Footer/>
      <Styles extra={`.ab-grid,.team-grid{@media(max-width:900px){grid-template-columns:1fr!important}}.val-grid,.stats-grid{@media(max-width:700px){grid-template-columns:1fr!important}}`}/>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function Chip({children}:{children:React.ReactNode}){
  return<div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'6px 16px',background:'rgba(6,182,212,0.08)',border:'1px solid rgba(6,182,212,0.2)',borderRadius:99,fontSize:12,fontWeight:700,color:C.cyan,letterSpacing:'0.08em',textTransform:'uppercase' as const}}>{children}</div>;
}
function GradBtn({href,children}:{href:string;children:React.ReactNode}){
  return<Link href={href} style={{display:'inline-flex',alignItems:'center',gap:8,background:'linear-gradient(135deg,#06B6D4,#3B82F6)',color:'#fff',textDecoration:'none',fontWeight:800,fontSize:15,padding:'14px 30px',borderRadius:12,boxShadow:'0 0 40px rgba(6,182,212,0.3)'}}>{children}<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></Link>;
}
function GhostBtn({href,children}:{href:string;children:React.ReactNode}){
  return<Link href={href} style={{display:'inline-flex',alignItems:'center',gap:8,background:'transparent',color:C.text,textDecoration:'none',fontWeight:700,fontSize:15,padding:'14px 24px',borderRadius:12,border:`1px solid ${C.border}`}}>{children}</Link>;
}
function ValCard({icon,title,desc}:{icon:string;title:string;desc:string}){
  const[h,sH]=useState(false);
  return<div onMouseEnter={()=>sH(true)} onMouseLeave={()=>sH(false)} style={{background:h?C.cardHov:C.card,border:`1px solid ${h?'rgba(6,182,212,0.3)':C.border}`,borderRadius:16,padding:'30px',transition:'all 0.25s ease',transform:h?'translateY(-4px)':'none'}}>
    <div style={{fontSize:30,marginBottom:14}}>{icon}</div>
    <h3 style={{fontSize:17,fontWeight:800,color:C.text,marginBottom:10,letterSpacing:'-0.02em'}}>{title}</h3>
    <p style={{fontSize:14,color:C.sub,lineHeight:1.75}}>{desc}</p>
  </div>;
}
function TeamCard({name,role,bio,img,tags,color}:{name:string;role:string;bio:string;img:string;tags:string[];color:string}){
  const[h,sH]=useState(false);
  return<div onMouseEnter={()=>sH(true)} onMouseLeave={()=>sH(false)} style={{background:h?C.cardHov:C.card,border:`1px solid ${h?color+'40':C.border}`,borderRadius:18,overflow:'hidden',transition:'all 0.25s ease',transform:h?'translateY(-5px)':'none'}}>
    <div style={{height:190,position:'relative',overflow:'hidden'}}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img} alt={name} style={{width:'100%',height:'100%',objectFit:'cover',filter:'brightness(0.6) saturate(0.7)',transition:'transform 0.4s',transform:h?'scale(1.06)':'scale(1)'}}/>
      <div style={{position:'absolute',inset:0,background:`linear-gradient(to bottom,transparent 40%,${C.card}F0)`}}/>
      <div style={{position:'absolute',inset:0,background:color+'18',opacity:h?1:0,transition:'opacity 0.3s'}}/>
    </div>
    <div style={{padding:'22px 22px 26px'}}>
      <div style={{fontSize:15,fontWeight:800,color:C.text,marginBottom:3}}>{name}</div>
      <div style={{fontSize:12.5,color,fontWeight:700,marginBottom:12}}>{role}</div>
      <p style={{fontSize:13,color:C.sub,lineHeight:1.7,marginBottom:14}}>{bio}</p>
      <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
        {tags.map(t=><span key={t} style={{fontSize:11,fontWeight:600,color,background:color+'15',border:`1px solid ${color}25`,padding:'3px 9px',borderRadius:7}}>{t}</span>)}
      </div>
    </div>
  </div>;
}
function Styles({extra=''}:{extra?:string}){
  return<style>{`*{box-sizing:border-box;margin:0;padding:0}html{scroll-behavior:smooth}::-webkit-scrollbar{width:6px;background:#020817}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:3px}@media(max-width:900px){.ab-grid,.team-grid{grid-template-columns:1fr!important}}@media(max-width:700px){.val-grid,.stats-grid{grid-template-columns:1fr!important}}${extra}`}</style>;
}