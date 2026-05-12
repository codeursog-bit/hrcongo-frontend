// ============================================================================
// 📁 app/tarifs/page.tsx — Konza RH · Page Tarifs (statique dédiée)
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
    const obs=new IntersectionObserver(([e])=>{if(e.isIntersecting)setV(true)},{threshold:0.06});
    obs.observe(el);return()=>obs.disconnect();
  },[]);
  return{ref,visible:v};
}
function Reveal({children,delay=0}:{children:React.ReactNode;delay?:number}){
  const{ref,visible}=useReveal();
  return<div ref={ref} style={{opacity:visible?1:0,transform:visible?'none':'translateY(24px)',transition:`opacity 0.55s ease ${delay}ms,transform 0.55s ease ${delay}ms`}}>{children}</div>;
}

// ─── Plans ────────────────────────────────────────────────────────────────────
const PLANS = [
  {
    name:'Gratuit', price:'0', unit:'pour toujours', sub:'Jusqu\'à 5 employés', popular:false,
    color:C.muted, borderColor:'rgba(255,255,255,0.1)',
    cta:'Commencer gratuitement', ctaStyle:'ghost',
    features:[
      {label:'Paie basique (CNSS + IRPP)',ok:true},
      {label:'Bulletins PDF simples',ok:true},
      {label:'Gestion des congés',ok:true},
      {label:'Pointage simple (sans GPS)',ok:true},
      {label:'1 utilisateur',ok:true},
      {label:'Déclaration CNSS automatique',ok:false},
      {label:'Pointage GPS multi-sites',ok:false},
      {label:'Prêts & avances',ok:false},
      {label:'Recrutement intégré',ok:false},
      {label:'Rupture de contrat auto',ok:false},
      {label:'Support prioritaire',ok:false},
    ],
  },
  {
    name:'Startup', price:'15 000', unit:'FCFA / mois', sub:'Jusqu\'à 20 employés', popular:false,
    color:C.blue, borderColor:'rgba(59,130,246,0.25)',
    cta:'Démarrer l\'essai gratuit', ctaStyle:'ghost',
    features:[
      {label:'Tout du plan Gratuit',ok:true},
      {label:'Calcul fiscal complet CGI',ok:true},
      {label:'Déclaration CNSS automatique',ok:true},
      {label:'Bulletins PDF signés',ok:true},
      {label:'Rupture de contrat automatique',ok:true},
      {label:'3 utilisateurs',ok:true},
      {label:'Pointage GPS multi-sites',ok:false},
      {label:'Prêts & avances sur salaire',ok:false},
      {label:'Recrutement & onboarding',ok:false},
      {label:'Mode Cabinet comptable',ok:false},
      {label:'Support prioritaire',ok:false},
    ],
  },
  {
    name:'Business', price:'35 000', unit:'FCFA / mois', sub:'Jusqu\'à 100 employés', popular:true,
    color:C.cyan, borderColor:'rgba(6,182,212,0.45)',
    cta:'Choisir Business', ctaStyle:'gradient',
    features:[
      {label:'Tout du plan Startup',ok:true},
      {label:'Pointage GPS multi-sites',ok:true},
      {label:'Prêts & avances sur salaire',ok:true},
      {label:'Recrutement & onboarding',ok:true},
      {label:'Tableaux de bord analytiques',ok:true},
      {label:'Formations & certifications',ok:true},
      {label:'Blog interne RH (4 posts/mois)',ok:true},
      {label:'10 utilisateurs',ok:true},
      {label:'Support prioritaire',ok:true},
      {label:'Mode Cabinet comptable',ok:false},
      {label:'API & Intégrations ERP',ok:false},
    ],
  },
  {
    name:'Enterprise', price:'65 000', unit:'FCFA / mois', sub:'Employés illimités', popular:false,
    color:C.purple, borderColor:'rgba(139,92,246,0.25)',
    cta:'Nous contacter', ctaStyle:'ghost',
    features:[
      {label:'Tout du plan Business',ok:true},
      {label:'Multi-entreprises',ok:true},
      {label:'Mode Cabinet comptable',ok:true},
      {label:'API & Intégrations ERP/SAGE',ok:true},
      {label:'Export SAGE / CIEL',ok:true},
      {label:'Blog interne illimité',ok:true},
      {label:'Utilisateurs illimités',ok:true},
      {label:'Manager de compte dédié',ok:true},
      {label:'Formation sur site',ok:true},
      {label:'Support 24/7',ok:true},
      {label:'SLA garanti',ok:true},
    ],
  },
];

// ─── Comparatif détaillé ─────────────────────────────────────────────────────
const COMPARE_ROWS = [
  {category:'Paie & Conformité',rows:[
    {label:'Calcul CNSS (4% + 20.28%)',vals:[true,true,true,true]},
    {label:'IRPP/ITS + abattement 20%',vals:[true,true,true,true]},
    {label:'Quotient familial',vals:[true,true,true,true]},
    {label:'TUS automatique',vals:[false,true,true,true]},
    {label:'Déclaration CNSS auto',vals:[false,true,true,true]},
    {label:'Bulletins PDF signés',vals:['Simple',true,true,true]},
    {label:'Rupture de contrat',vals:[false,true,true,true]},
  ]},
  {category:'RH & Présences',rows:[
    {label:'Gestion des congés',vals:[true,true,true,true]},
    {label:'Pointage (sans GPS)',vals:[true,true,true,true]},
    {label:'Pointage GPS multi-sites',vals:[false,false,true,true]},
    {label:'Prêts & avances',vals:[false,false,true,true]},
    {label:'Recrutement & onboarding',vals:[false,false,true,true]},
    {label:'Formations',vals:[false,false,true,true]},
  ]},
  {category:'Collaboration & Blog',rows:[
    {label:'Blog interne RH',vals:[false,false,'4/mois','Illimité']},
    {label:'Likes & interactions',vals:[false,false,true,true]},
    {label:'Annonces admin',vals:[false,false,true,true]},
  ]},
  {category:'Administration',rows:[
    {label:'Utilisateurs',vals:['1','3','10','Illimité']},
    {label:'Multi-entreprises',vals:[false,false,false,true]},
    {label:'Mode Cabinet comptable',vals:[false,false,false,true]},
    {label:'API & Intégrations',vals:[false,false,false,true]},
    {label:'Export SAGE / CIEL',vals:[false,false,false,true]},
  ]},
  {category:'Support',rows:[
    {label:'Support',vals:['Communauté','Email','Prioritaire','24/7 + Manager dédié']},
    {label:'Formation sur site',vals:[false,false,false,true]},
    {label:'SLA garanti',vals:[false,false,false,true]},
  ]},
];

const FAQ_PRICING = [
  {q:'L\'essai gratuit dure combien de temps ?',a:'14 jours sur tous les plans payants, avec accès complet à toutes les fonctionnalités. Aucune carte bancaire requise. À la fin, vous choisissez votre plan ou revenez au plan Gratuit (toujours gratuit pour ≤ 5 employés).'},
  {q:'Puis-je changer de plan en cours d\'abonnement ?',a:'Oui, à tout moment. La mise à niveau prend effet immédiatement. Le passage à un plan inférieur prend effet au prochain renouvellement mensuel.'},
  {q:'Quels moyens de paiement acceptez-vous ?',a:'MTN Mobile Money, Airtel Money et virement bancaire. Aucune carte Visa/Mastercard requise. Facturation mensuelle, sans engagement.'},
  {q:'Qu\'est-ce que le mode Cabinet comptable ?',a:'Il permet à un cabinet expert-comptable de gérer plusieurs entreprises clientes depuis un seul compte. Clôture groupée, droits granulaires par gestionnaire, exports comptables séparés par client.'},
];

// ─── Composants réutilisables ─────────────────────────────────────────────────
function Chip({children}:{children:React.ReactNode}){
  return<div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'6px 16px',background:'rgba(6,182,212,0.08)',border:'1px solid rgba(6,182,212,0.2)',borderRadius:99,fontSize:12,fontWeight:700,color:C.cyan,letterSpacing:'0.08em',textTransform:'uppercase' as const}}>{children}</div>;
}

function CheckIcon({ok,label}:{ok:boolean|string;label?:string}){
  if(typeof ok==='string') return<span style={{fontSize:12,fontWeight:600,color:C.cyan}}>{ok}</span>;
  if(ok) return<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>;
  return<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>;
}

function PlanCard({plan}:{plan:typeof PLANS[0]}){
  const[h,sH]=useState(false);
  return(
    <div onMouseEnter={()=>sH(true)} onMouseLeave={()=>sH(false)} style={{
      background:plan.popular?'linear-gradient(160deg,rgba(6,182,212,0.1),rgba(59,130,246,0.07))':h?C.cardHov:C.card,
      border:`${plan.popular?'2':'1'}px solid ${h?plan.borderColor:plan.popular?plan.borderColor:C.border}`,
      borderRadius:20,padding:'32px 26px',position:'relative',
      transform:plan.popular?'scale(1.03)':h?'translateY(-4px)':'none',
      transition:'all 0.25s ease',
      boxShadow:plan.popular?'0 0 60px rgba(6,182,212,0.1)':'none',
    }}>
      {plan.popular&&<div style={{position:'absolute',top:-14,left:'50%',transform:'translateX(-50%)',background:'linear-gradient(135deg,#06B6D4,#3B82F6)',color:'#fff',fontSize:11,fontWeight:800,padding:'4px 18px',borderRadius:99,letterSpacing:'0.08em',textTransform:'uppercase',whiteSpace:'nowrap'}}>★ Plus populaire</div>}

      <div style={{marginBottom:24}}>
        <div style={{fontSize:11,fontWeight:800,color:plan.color,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:12}}>{plan.name}</div>
        <div style={{display:'flex',alignItems:'baseline',gap:6,marginBottom:4}}>
          <span style={{fontSize:plan.price==='0'?44:36,fontWeight:900,color:C.text,letterSpacing:'-0.04em',lineHeight:1,fontFamily:'system-ui,sans-serif'}}>{plan.price==='0'?'Gratuit':plan.price}</span>
          {plan.price!=='0'&&<span style={{fontSize:14,color:C.muted}}>{plan.unit}</span>}
        </div>
        <p style={{fontSize:12.5,color:C.muted}}>{plan.sub}</p>
      </div>

      <Link href={plan.ctaStyle==='ghost'&&plan.name==='Enterprise'?'/contact':'/auth/register'} style={{
        display:'block',textAlign:'center',padding:'12px 16px',borderRadius:12,fontWeight:800,fontSize:14,textDecoration:'none',marginBottom:24,transition:'all 0.2s',
        background:plan.ctaStyle==='gradient'?'linear-gradient(135deg,#06B6D4,#3B82F6)':'transparent',
        color:plan.ctaStyle==='gradient'?'#fff':C.sub,
        border:plan.ctaStyle==='gradient'?'none':`1px solid ${C.border}`,
        boxShadow:plan.ctaStyle==='gradient'?'0 0 30px rgba(6,182,212,0.25)':'none',
      }}>{plan.cta}</Link>

      <div style={{borderTop:`1px solid ${C.border}`,paddingTop:20,display:'flex',flexDirection:'column',gap:10}}>
        {plan.features.map((f,i)=>(
          <div key={i} style={{display:'flex',alignItems:'flex-start',gap:10}}>
            <div style={{flexShrink:0,marginTop:1}}><CheckIcon ok={f.ok}/></div>
            <span style={{fontSize:13,color:f.ok?C.sub:C.muted,lineHeight:1.45}}>{f.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CompareTable(){
  const plans=['Gratuit','Startup','Business','Enterprise'];
  const planColors=[C.muted,C.blue,C.cyan,C.purple];

  return(
    <div style={{overflowX:'auto'}}>
      <table style={{width:'100%',borderCollapse:'collapse',minWidth:700}}>
        <thead>
          <tr>
            <th style={{width:'35%',padding:'16px 20px',textAlign:'left',fontSize:13,fontWeight:700,color:C.muted,letterSpacing:'0.06em',textTransform:'uppercase',borderBottom:`1px solid ${C.border}`}}>Fonctionnalité</th>
            {plans.map((p,i)=>(
              <th key={p} style={{padding:'16px 16px',textAlign:'center',fontSize:14,fontWeight:800,color:planColors[i],borderBottom:`1px solid ${C.border}`}}>{p}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COMPARE_ROWS.map(cat=>(
            <React.Fragment key={cat.category}>
              <tr>
                <td colSpan={5} style={{padding:'20px 20px 8px',fontSize:11,fontWeight:800,color:C.cyan,letterSpacing:'0.1em',textTransform:'uppercase',background:'rgba(6,182,212,0.03)',borderTop:`1px solid ${C.border}`}}>{cat.category}</td>
              </tr>
              {cat.rows.map((row,ri)=>(
                <tr key={ri} style={{background:ri%2===0?'transparent':'rgba(255,255,255,0.01)'}}>
                  <td style={{padding:'12px 20px',fontSize:13.5,color:C.sub}}>{row.label}</td>
                  {row.vals.map((v,vi)=>(
                    <td key={vi} style={{padding:'12px 16px',textAlign:'center'}}>
                      <div style={{display:'flex',justifyContent:'center'}}><CheckIcon ok={v as boolean|string}/></div>
                    </td>
                  ))}
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FaqItem({q,a}:{q:string;a:string}){
  const[open,setOpen]=useState(false);
  return(
    <div style={{background:C.card,border:`1px solid ${open?'rgba(6,182,212,0.3)':C.border}`,borderRadius:12,overflow:'hidden',transition:'border-color 0.2s'}}>
      <button onClick={()=>setOpen(!open)} style={{width:'100%',display:'flex',justifyContent:'space-between',alignItems:'center',padding:'17px 20px',background:'none',border:'none',cursor:'pointer',color:C.text,textAlign:'left',gap:16,fontFamily:'inherit'}}>
        <span style={{fontSize:14.5,fontWeight:600,color:open?C.text:C.sub,lineHeight:1.45}}>{q}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={open?C.cyan:C.muted} strokeWidth="2.5" style={{flexShrink:0,transform:open?'rotate(45deg)':'none',transition:'transform 0.2s'}}><path d="M12 5v14M5 12h14"/></svg>
      </button>
      {open&&<div style={{padding:'0 20px 18px',fontSize:13.5,color:C.sub,lineHeight:1.75,borderTop:`1px solid ${C.border}`,paddingTop:14}}>{a}</div>}
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function TarifsPage(){
  return(
    <div style={{background:C.bg,minHeight:'100vh',fontFamily:"system-ui,-apple-system,'Segoe UI',sans-serif",color:C.text,overflowX:'hidden'}}>
      <GridBg/>
      <Navbar/>

      {/* HERO */}
      <section style={{position:'relative',padding:'160px 32px 90px',textAlign:'center',overflow:'hidden',zIndex:1}}>
        <Blob color={C.blue} style={{width:700,height:400,top:-200,left:'50%',transform:'translateX(-50%)'}}/>
        <div style={{maxWidth:700,margin:'0 auto',position:'relative'}}>
          <Chip>// Tarifs</Chip>
          <h1 style={{fontSize:'clamp(32px,5.5vw,62px)',fontWeight:900,letterSpacing:'-0.04em',lineHeight:1.08,margin:'20px 0 20px'}}>
            Simple. Transparent.<br/>
            <span style={{background:'linear-gradient(135deg,#06B6D4,#3B82F6)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Sans surprise.</span>
          </h1>
          <p style={{fontSize:18,color:C.sub,lineHeight:1.7,marginBottom:28}}>
            14 jours d'essai gratuit sur tous les plans. Aucune carte bancaire requise.<br/>Paiement par MTN Money · Airtel Money · Virement bancaire.
          </p>
          <div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'10px 18px',background:'rgba(16,185,129,0.08)',border:'1px solid rgba(16,185,129,0.25)',borderRadius:99}}>
            <div style={{width:7,height:7,borderRadius:'50%',background:C.green}}/>
            <span style={{fontSize:13,color:C.green,fontWeight:700}}>Essai gratuit 14 jours · Sans engagement · Sans carte bancaire</span>
          </div>
        </div>
      </section>

      {/* PLANS GRID */}
      <section style={{position:'relative',zIndex:1,borderTop:`1px solid ${C.border}`}}>
        <Blob color={C.purple} style={{width:500,height:500,top:0,right:-150}}/>
        <div style={{maxWidth:1280,margin:'0 auto',padding:'80px 32px'}}>
          <Reveal>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:20,position:'relative'}} className="plans-grid">
              {PLANS.map(p=><PlanCard key={p.name} plan={p}/>)}
            </div>
          </Reveal>
          <p style={{textAlign:'center',color:C.muted,fontSize:13,marginTop:28}}>
            Tous les prix sont HT · Facturation mensuelle · Annulation à tout moment
          </p>
        </div>
      </section>

      {/* PAIE AU VOLUME */}
      <section style={{position:'relative',zIndex:1,borderTop:`1px solid ${C.border}`,background:'rgba(6,182,212,0.02)'}}>
        <div style={{maxWidth:1280,margin:'0 auto',padding:'72px 32px'}}>
          <Reveal>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:60,alignItems:'center'}} className="vol-grid">
              <div>
                <Chip>// Volume & Cabinet</Chip>
                <h2 style={{fontSize:'clamp(24px,3.5vw,40px)',fontWeight:900,letterSpacing:'-0.03em',lineHeight:1.15,margin:'18px 0 18px'}}>Vous gérez plus de 100 employés ou plusieurs entreprises ?</h2>
                <p style={{fontSize:15,color:C.sub,lineHeight:1.8,marginBottom:24}}>
                  Le plan Enterprise est conçu pour les groupes, les entreprises en forte croissance et les cabinets experts-comptables qui gèrent un portefeuille de clients.
                </p>
                <ul style={{listStyle:'none',padding:0,margin:0,display:'flex',flexDirection:'column',gap:12}}>
                  {['Employés illimités — un seul prix fixe','Multi-entreprises depuis un seul compte','API complète pour intégration ERP / SAGE / CIEL','Manager de compte dédié · Formation sur site','SLA garanti · Support 24/7 en français'].map(f=>(
                    <li key={f} style={{display:'flex',gap:12,fontSize:14,color:C.sub}}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.cyan} strokeWidth="2.5" style={{flexShrink:0,marginTop:2}}><path d="M20 6L9 17l-5-5"/></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <div style={{display:'flex',gap:12,marginTop:28,flexWrap:'wrap'}}>
                  <Link href="/contact" style={{display:'inline-flex',alignItems:'center',gap:8,background:'linear-gradient(135deg,#06B6D4,#3B82F6)',color:'#fff',textDecoration:'none',fontWeight:800,fontSize:15,padding:'13px 26px',borderRadius:12,boxShadow:'0 0 30px rgba(6,182,212,0.25)'}}>
                    Demander un devis
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </Link>
                  <Link href="/qui-sommes-nous" style={{display:'inline-flex',alignItems:'center',padding:'13px 22px',borderRadius:12,border:`1px solid ${C.border}`,color:C.sub,textDecoration:'none',fontWeight:700,fontSize:15}}>En savoir plus</Link>
                </div>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:14}}>
                {[
                  {label:'Entreprises 100–500 employés',price:'65 000 FCFA/mois',note:'Tarif fixe illimité'},
                  {label:'Cabinets comptables (multi-clients)',price:'Sur devis',note:'Réduction volume dès 5 clients'},
                  {label:'Groupes & Holdings',price:'Sur devis',note:'Facturation centralisée par entité'},
                ].map(r=>(
                  <div key={r.label} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:'20px 22px',display:'flex',justifyContent:'space-between',alignItems:'center',gap:16}}>
                    <div>
                      <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:4}}>{r.label}</div>
                      <div style={{fontSize:12,color:C.muted}}>{r.note}</div>
                    </div>
                    <div style={{fontSize:15,fontWeight:900,color:C.cyan,whiteSpace:'nowrap',fontFamily:'system-ui,sans-serif'}}>{r.price}</div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* TABLEAU COMPARATIF */}
      <section style={{position:'relative',zIndex:1,borderTop:`1px solid ${C.border}`}}>
        <div style={{maxWidth:1100,margin:'0 auto',padding:'80px 32px'}}>
          <Reveal>
            <div style={{textAlign:'center',marginBottom:48}}>
              <Chip>// Comparatif complet</Chip>
              <h2 style={{fontSize:'clamp(24px,3.5vw,40px)',fontWeight:900,letterSpacing:'-0.03em',lineHeight:1.1,marginTop:18}}>Tout comparer en un coup d'œil</h2>
            </div>
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,overflow:'hidden'}}>
              <CompareTable/>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ PRIX */}
      <section style={{position:'relative',zIndex:1,borderTop:`1px solid ${C.border}`,background:'rgba(6,182,212,0.015)'}}>
        <div style={{maxWidth:800,margin:'0 auto',padding:'72px 32px'}}>
          <Reveal>
            <div style={{textAlign:'center',marginBottom:40}}>
              <Chip>// Questions fréquentes</Chip>
              <h2 style={{fontSize:'clamp(22px,3vw,36px)',fontWeight:900,letterSpacing:'-0.03em',lineHeight:1.1,marginTop:18}}>Questions sur les tarifs</h2>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {FAQ_PRICING.map((f,i)=><FaqItem key={i} {...f}/>)}
            </div>
            <div style={{textAlign:'center',marginTop:32}}>
              <Link href="/faq" style={{color:C.cyan,textDecoration:'none',fontSize:14,fontWeight:700}}>Voir toutes les questions →</Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section style={{position:'relative',zIndex:1,borderTop:`1px solid ${C.border}`,padding:'90px 32px',textAlign:'center',overflow:'hidden'}}>
        <Blob color={C.cyan} style={{width:500,height:500,top:'50%',left:'50%',transform:'translate(-50%,-50%)'}}/>
        <div style={{maxWidth:580,margin:'0 auto',position:'relative'}}>
          <h2 style={{fontSize:'clamp(26px,4vw,44px)',fontWeight:900,letterSpacing:'-0.03em',lineHeight:1.15,marginBottom:18}}>Prêt à simplifier votre paie ?</h2>
          <p style={{fontSize:17,color:C.sub,marginBottom:34,lineHeight:1.7}}>14 jours d'essai gratuit — aucune carte bancaire. Configuration en 30 minutes.</p>
          <div style={{display:'flex',justifyContent:'center',gap:14,flexWrap:'wrap'}}>
            <Link href="/auth/register" style={{display:'inline-flex',alignItems:'center',gap:8,background:'linear-gradient(135deg,#06B6D4,#3B82F6)',color:'#fff',textDecoration:'none',fontWeight:800,fontSize:15,padding:'14px 30px',borderRadius:12,boxShadow:'0 0 40px rgba(6,182,212,0.3)'}}>
              Démarrer gratuitement
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
            <Link href="/contact" style={{display:'inline-flex',alignItems:'center',padding:'14px 24px',borderRadius:12,border:`1px solid ${C.border}`,color:C.sub,textDecoration:'none',fontWeight:700,fontSize:15}}>Demander une démo</Link>
          </div>
        </div>
      </section>

      <Footer/>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}html{scroll-behavior:smooth}::-webkit-scrollbar{width:6px;background:#020817}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:3px}@media(max-width:1024px){.plans-grid{grid-template-columns:repeat(2,1fr)!important}}@media(max-width:640px){.plans-grid,.vol-grid{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}