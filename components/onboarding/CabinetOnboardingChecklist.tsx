'use client';

// ============================================================================
// 📁 components/onboarding/CabinetOnboardingChecklist.tsx
// ✅ Position fixed — ne pousse rien
// ✅ "Passer" → saute l'étape localement
// ✅ Routes corrigées selon les vraies pages cabinet
// ✅ CABINET_ADMIN uniquement
// ✅ completedAt → ne réapparaît plus jamais
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  CheckCircle2, X, Sparkles, Building2, Users,
  CreditCard, Settings, ArrowRight, Loader2,
  ChevronDown, ChevronUp, ChevronRight,
  UserPlus, Briefcase,
} from 'lucide-react';
import { api } from '@/services/api';

interface StepStatus { done: boolean; loading: boolean; skipped: boolean; }
interface SavedState {
  dismissed?: boolean;
  hiddenUntilLogin?: boolean;
  completedAt?: string;
  skipped?: number[];
}

const KEY_PREFIX = 'konza_cabinet_onboarding_v1_';
const getKey = (id: string) => `${KEY_PREFIX}${id}`;
function load(key: string): SavedState {
  try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; }
}
function save(key: string, patch: Partial<SavedState>) {
  localStorage.setItem(key, JSON.stringify({ ...load(key), ...patch }));
}

function StepIcon({ done, loading, skipped, index }: { done: boolean; loading: boolean; skipped: boolean; index: number }) {
  const base: React.CSSProperties = {
    width:28, height:28, borderRadius:'50%',
    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
  };
  if (loading) return (
    <div style={{...base, background:'rgba(99,102,241,.12)'}}>
      <Loader2 size={13} style={{color:'#6366f1', animation:'spin 1s linear infinite'}}/>
    </div>
  );
  if (done) return (
    <div style={{...base, background:'rgba(16,185,129,.15)', animation:'cab-pop .35s cubic-bezier(.34,1.56,.64,1)'}}>
      <CheckCircle2 size={14} style={{color:'#10b981'}}/>
    </div>
  );
  if (skipped) return (
    <div style={{...base, background:'rgba(255,255,255,.04)', border:'1.5px solid rgba(255,255,255,.08)'}}>
      <span style={{fontSize:10}}>→</span>
    </div>
  );
  return (
    <div style={{...base, background:'rgba(255,255,255,.04)', border:'1.5px solid rgba(255,255,255,.1)'}}>
      <span style={{fontSize:10, fontWeight:700, color:'#64748b'}}>{index+1}</span>
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px 4px'}}>
      <div style={{flex:1,height:1,background:'rgba(255,255,255,.05)'}}/>
      <span style={{fontSize:9,fontWeight:700,color:'#475569',letterSpacing:'.07em',textTransform:'uppercase'}}>{label}</span>
      <div style={{flex:1,height:1,background:'rgba(255,255,255,.05)'}}/>
    </div>
  );
}

export default function CabinetOnboardingChecklist() {
  const router = useRouter();
  const params = useParams();
  const cabinetId = params.cabinetId as string;

  const [visible,        setVisible]        = useState(false);
  const [collapsed,      setCollapsed]      = useState(false);
  const [celebrating,    setCelebrating]    = useState(false);
  const [userName,       setUserName]       = useState('');
  const [firstCompanyId, setFirstCompanyId] = useState<string | null>(null);

  const [steps, setSteps] = useState<StepStatus[]>(
    Array.from({length:6}, () => ({done:false, loading:true, skipped:false}))
  );

  // ─── Init ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!cabinetId) return;
    (async () => {
      try {
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        if (u.role !== 'CABINET_ADMIN') return;
        setUserName(u.firstName || '');

        const s = load(getKey(cabinetId));
        if (s.dismissed || s.completedAt) return;
        if (s.hiddenUntilLogin) { save(getKey(cabinetId), {hiddenUntilLogin:false}); return; }

        const skippedIndices = s.skipped || [];

        let firstCId: string | null = null;
        try {
          const dash: any = await api.get(`/cabinet/${cabinetId}/dashboard`);
          if (dash?.companies?.length > 0) {
            firstCId = dash.companies[0].companyId;
            setFirstCompanyId(firstCId);
          }
        } catch {}

        await checkAll(cabinetId, firstCId, skippedIndices);
        setVisible(true);
      } catch {}
    })();
  }, [cabinetId]);

  // ─── Checks API ───────────────────────────────────────────────────────────
  const checkAll = useCallback(async (cId: string, firstCId: string | null, skippedIndices: number[] = []) => {
    const fns = [
      () => chkCabinet(cId),
      () => chkGestionnaire(cId),
      () => chkPmeCreee(cId),
      () => chkPmeConfig(firstCId),
      () => chkEmployee(firstCId),
      () => chkPayroll(firstCId),
    ];
    const results = await Promise.allSettled(fns.map(f => f()));
    const next = results.map((r, i) => ({
      done: r.status === 'fulfilled' ? r.value : false,
      loading: false,
      skipped: skippedIndices.includes(i),
    }));
    setSteps(next);
    if (isComplete(next)) doComplete(cId);
    return next;
  }, []);

  function isComplete(s: StepStatus[]) {
    return s.every(step => step.done || step.skipped);
  }

  async function chkCabinet(cId: string): Promise<boolean> {
    try { const r: any = await api.get(`/cabinet/${cId}/profile`); return !!(r?.name?.trim()); }
    catch { return false; }
  }
  async function chkGestionnaire(cId: string): Promise<boolean> {
    try {
      const r: any = await api.get(`/cabinet/${cId}/gestionnaires`);
      return (Array.isArray(r) ? r : r?.gestionnaires || []).length > 0;
    } catch { return false; }
  }
  async function chkPmeCreee(cId: string): Promise<boolean> {
    try {
      const r: any = await api.get(`/cabinet/${cId}/dashboard`);
      return (r?.companies?.length || 0) > 0;
    } catch { return false; }
  }
  async function chkPmeConfig(firstCId: string | null): Promise<boolean> {
    if (!firstCId) return false;
    try {
      const [comp, depts]: any[] = await Promise.all([
        api.get(`/companies/${firstCId}`),
        api.get(`/departments?companyId=${firstCId}`),
      ]);
      const arr = Array.isArray(depts) ? depts : depts?.departments || depts?.data || [];
      return !!(comp?.name?.trim()) && arr.length > 0;
    } catch { return false; }
  }
  async function chkEmployee(firstCId: string | null): Promise<boolean> {
    if (!firstCId) return false;
    try {
      const r: any = await api.get(`/employees?companyId=${firstCId}&status=ACTIVE&limit=1`);
      return (Array.isArray(r) ? r : r?.employees || r?.data || []).length > 0;
    } catch { return false; }
  }
  async function chkPayroll(firstCId: string | null): Promise<boolean> {
    if (!firstCId) return false;
    try {
      const r: any = await api.get(`/payrolls?companyId=${firstCId}&limit=1`);
      return (Array.isArray(r) ? r : []).length > 0;
    } catch { return false; }
  }

  // ─── Complétion ───────────────────────────────────────────────────────────
  function doComplete(cId: string) {
    setCelebrating(true);
    save(getKey(cId), {completedAt: new Date().toISOString()});
    setTimeout(() => { setVisible(false); setCelebrating(false); }, 4500);
  }

  // ─── Passer une étape ─────────────────────────────────────────────────────
  const skipStep = (i: number) => {
    setSteps(prev => {
      const next = prev.map((s, j) => j === i ? {...s, skipped:true} : s);
      if (isComplete(next)) doComplete(cabinetId);
      return next;
    });
    const s = load(getKey(cabinetId));
    save(getKey(cabinetId), {skipped: [...(s.skipped||[]), i]});
  };

  const dismissForever = () => { save(getKey(cabinetId), {dismissed:true}); setVisible(false); };
  const hideForNow = () => { save(getKey(cabinetId), {hiddenUntilLogin:true}); setVisible(false); };

  // ─── Config étapes — vraies routes cabinet ────────────────────────────────
  const STEPS_CONFIG = [
    {
      section:'Votre cabinet',
      icon:Settings, color:'#6366f1',
      title:'Configurez votre cabinet',
      desc:'Nom, logo et couleurs — apparaissent sur l\'espace de vos PME.',
      path:'Paramètres cabinet',
      cta:'Configurer',
      href:`/cabinet/${cabinetId}/parametres`, // ✅ vraie route
    },
    {
      section:null, optional:true,
      icon:UserPlus, color:'#8b5cf6',
      title:'Invitez un gestionnaire',
      desc:'Ajoutez un collaborateur pour co-gérer vos PME.',
      path:'Gestionnaires',
      cta:'Inviter',
      href:`/cabinet/${cabinetId}/gestionnaires`, // ✅ vraie route
    },
    {
      section:'Votre première PME',
      icon:Building2, color:'#0ea5e9',
      title:'Créez votre première PME',
      desc:'Ajoutez une entreprise cliente avec son propre espace isolé.',
      path:'Mes PME → Ajouter',
      cta:'Créer une PME',
      href:`/cabinet/${cabinetId}/ajouter-pme`, // ✅ vraie route
    },
    {
      section:null,
      icon:Briefcase, color:'#f59e0b',
      title:'Configurez la PME',
      desc:'Infos légales + premier département.',
      path:'Entreprise → Paramètres',
      cta:'Configurer',
      href: firstCompanyId
        ? `/cabinet/${cabinetId}/entreprise/${firstCompanyId}/parametres` // ✅ vraie route
        : `/cabinet/${cabinetId}/mes-pme`,
      hint: !firstCompanyId ? '⚠️ Créez d\'abord une PME.' : null,
    },
    {
      section:null,
      icon:Users, color:'#10b981',
      title:'Ajoutez des employés',
      desc:'Dossiers avec contrat et salaire de base.',
      path:'Entreprise → Employés',
      cta:'Ajouter',
      href: firstCompanyId
        ? `/cabinet/${cabinetId}/entreprise/${firstCompanyId}/employes` // ✅ vraie route
        : `/cabinet/${cabinetId}/mes-pme`,
    },
    {
      section:null,
      icon:CreditCard, color:'#06b6d4',
      title:'Générez la première paie',
      desc:'CNSS/ITS auto, bulletins PDF pour toute la PME.',
      path:'Entreprise → Bulletins',
      cta:'Générer',
      href: firstCompanyId
        ? `/cabinet/${cabinetId}/entreprise/${firstCompanyId}/bulletins` // ✅ vraie route
        : `/cabinet/${cabinetId}/mes-pme`,
    },
  ];

  // ─── Calculs ──────────────────────────────────────────────────────────────
  const doneOrSkipped = steps.filter(s => s.done || s.skipped).length;
  const reqSteps = steps.filter((_, i) => i !== 1); // exclure l'optionnel
  const reqDoneOrSkipped = reqSteps.filter(s => s.done || s.skipped).length;
  const pct = Math.round((reqDoneOrSkipped / reqSteps.length) * 100);
  const activeIdx = steps.findIndex(s => !s.done && !s.skipped && !s.loading);

  if (!visible) return null;

  // ─── Célébration ──────────────────────────────────────────────────────────
  if (celebrating) {
    return (
      <>
        <style>{`
          @keyframes cab-fadein{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
          @keyframes cab-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
          @keyframes cab-fadeout{0%,65%{opacity:1}100%{opacity:0;transform:scale(.95)}}
        `}</style>
        <div style={{position:'fixed', bottom:24, right:24, zIndex:9999, width:340, maxWidth:'calc(100vw - 32px)'}}>
          <div style={{
            position:'relative', overflow:'hidden', borderRadius:20, padding:'20px 22px',
            background:'linear-gradient(135deg,#6366f1,#8b5cf6 50%,#06b6d4)',
            boxShadow:'0 12px 40px rgba(99,102,241,.4)',
            animation:'cab-fadein .4s ease, cab-fadeout .7s ease 3.8s forwards',
          }}>
            {[...Array(12)].map((_,i)=>(
              <div key={i} style={{
                position:'absolute', width:i%3===0?7:4, height:i%3===0?7:4,
                borderRadius:i%2===0?'50%':'2px',
                background:['#fff','#fde68a','#a7f3d0','#bfdbfe'][i%4],
                opacity:.6, left:`${6+i*7.5}%`, top:`${10+(i%3)*30}%`,
                animation:`cab-float ${1.2+(i%3)*.3}s ease-in-out infinite`,
                animationDelay:`${i*.1}s`,
              }}/>
            ))}
            <div style={{position:'relative',zIndex:1,display:'flex',alignItems:'center',gap:16}}>
              <div style={{fontSize:40}}>🎉</div>
              <div>
                <h3 style={{margin:'0 0 4px',fontSize:15,fontWeight:900,color:'#fff'}}>
                  {userName ? `Bravo ${userName} !` : 'Cabinet prêt !'}
                </h3>
                <p style={{margin:0,fontSize:12,color:'rgba(255,255,255,.8)',lineHeight:1.5}}>
                  Gérez toutes vos PME clientes depuis votre tableau de bord.
                </p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─── Panneau flottant ─────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes cab-fadein{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes cab-pop{0%{transform:scale(.6)}60%{transform:scale(1.2)}100%{transform:scale(1)}}
        @keyframes cab-pulse{0%,100%{opacity:1}50%{opacity:.35}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .cab-step{transition:background .15s,border-color .15s;border-radius:10px;border:1px solid transparent;}
        .cab-step:hover{background:rgba(255,255,255,.025);}
        .cab-active{background:rgba(99,102,241,.08)!important;border-color:rgba(99,102,241,.25)!important;}
        .cab-bar{transition:width .6s cubic-bezier(.4,0,.2,1);}
        .cab-btn{transition:all .15s;}
        .cab-btn:hover{opacity:.88;transform:translateY(-1px);}
        .cab-skip{transition:color .15s;background:none;border:none;cursor:pointer;text-decoration:underline;}
        .cab-skip:hover{color:#6366f1!important;}
      `}</style>

      <div style={{
        position:'fixed', bottom:24, right:24, zIndex:9999,
        width:340, maxWidth:'calc(100vw - 32px)',
        animation:'cab-fadein .4s ease',
      }}>
        <div style={{
          borderRadius:18, overflow:'hidden',
          background:'#151e30',
          border:'1px solid rgba(255,255,255,.08)',
          boxShadow:'0 12px 48px rgba(0,0,0,.5),0 2px 8px rgba(0,0,0,.2)',
        }}>

          {/* Header */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderBottom:'1px solid rgba(255,255,255,.06)'}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:32,height:32,borderRadius:9,flexShrink:0,background:'linear-gradient(135deg,#6366f1,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <Sparkles size={14} color="#fff"/>
              </div>
              <div>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <h3 style={{margin:0,fontSize:12,fontWeight:700,color:'#f1f5f9'}}>
                    {userName ? `Bienvenue ${userName} 👋` : 'Démarrage cabinet 👋'}
                  </h3>
                  <span style={{fontSize:9,fontWeight:700,padding:'1px 6px',borderRadius:999,background:'rgba(99,102,241,.15)',color:'#818cf8'}}>
                    {doneOrSkipped}/{steps.length}
                  </span>
                </div>
                <p style={{margin:'2px 0 0',fontSize:10,color:'#64748b'}}>
                  Vous pouvez passer les étapes à tout moment
                </p>
              </div>
            </div>
            <div style={{display:'flex',gap:3}}>
              <button onClick={() => setCollapsed(c=>!c)} style={{width:28,height:28,borderRadius:7,border:'none',cursor:'pointer',background:'rgba(255,255,255,.05)',color:'#64748b',display:'flex',alignItems:'center',justifyContent:'center'}}>
                {collapsed ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
              </button>
              <button onClick={hideForNow} style={{width:28,height:28,borderRadius:7,border:'none',cursor:'pointer',background:'rgba(255,255,255,.05)',color:'#64748b',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <X size={13}/>
              </button>
            </div>
          </div>

          {/* Progress */}
          <div style={{padding:'10px 16px 6px'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
              <span style={{fontSize:10,color:'#64748b'}}>
                {pct===100 ? '✅ Cabinet prêt !' : pct===0 ? 'Explorez à votre rythme' : `${pct}%`}
              </span>
              <span style={{fontSize:10,color:'#64748b'}}>{reqDoneOrSkipped}/{reqSteps.length}</span>
            </div>
            <div style={{height:3,borderRadius:99,background:'rgba(255,255,255,.06)'}}>
              <div className="cab-bar" style={{
                height:'100%', borderRadius:99, width:`${pct}%`,
                background: pct===100 ? 'linear-gradient(90deg,#10b981,#0d9488)' : 'linear-gradient(90deg,#6366f1,#06b6d4)',
              }}/>
            </div>
          </div>

          {/* Étapes */}
          {!collapsed && (
            <div style={{padding:'4px 6px 6px',maxHeight:'65vh',overflowY:'auto'}}>
              {STEPS_CONFIG.map((cfg, i) => {
                const step = steps[i];
                if (!step) return null;
                const isActive = i === activeIdx;
                const isOpt = !!(cfg as any).optional;

                return (
                  <React.Fragment key={i}>
                    {cfg.section && <SectionLabel label={cfg.section}/>}
                    <div className={`cab-step ${isActive && !step.done && !step.skipped ? 'cab-active' : ''}`}
                      style={{display:'flex',alignItems:'flex-start',gap:10,padding:'8px 10px',marginBottom:1}}>

                      <StepIcon done={step.done} loading={step.loading} skipped={step.skipped} index={i}/>

                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'center',gap:5,flexWrap:'wrap',marginBottom:2}}>
                          <p style={{
                            margin:0, fontSize:12, fontWeight:600,
                            color: step.done||step.skipped ? '#475569' : '#e2e8f0',
                            textDecoration: step.done||step.skipped ? 'line-through' : 'none',
                          }}>{cfg.title}</p>
                          {isOpt && (
                            <span style={{fontSize:8,fontWeight:700,padding:'1px 5px',borderRadius:999,background:'rgba(255,255,255,.06)',color:'#64748b',textTransform:'uppercase',letterSpacing:'.06em'}}>
                              Optionnel
                            </span>
                          )}
                          {step.skipped && (
                            <span style={{fontSize:8,fontWeight:700,padding:'1px 5px',borderRadius:999,background:'rgba(255,255,255,.06)',color:'#64748b'}}>
                              Passé
                            </span>
                          )}
                          {isActive && !step.done && !step.skipped && (
                            <span style={{display:'inline-flex',alignItems:'center',gap:3,fontSize:8,fontWeight:700,padding:'1px 6px',borderRadius:999,background:'#6366f1',color:'#fff'}}>
                              <span style={{width:4,height:4,borderRadius:'50%',background:'#fff',animation:'cab-pulse 1.2s ease-in-out infinite'}}/>
                              Maintenant
                            </span>
                          )}
                        </div>

                        {!step.done && !step.skipped && (
                          <>
                            <p style={{margin:'1px 0 2px',fontSize:9,color:'#475569',fontFamily:'monospace'}}>{cfg.path}</p>
                            <p style={{margin:'0 0 5px',fontSize:11,color:'#64748b',lineHeight:1.5}}>{cfg.desc}</p>
                          </>
                        )}

                        {/* Hint */}
                        {!step.done && !step.skipped && (cfg as any).hint && (
                          <div style={{margin:'4px 0 6px',padding:'6px 10px',borderRadius:8,background:'rgba(245,158,11,.08)',border:'1px solid rgba(245,158,11,.2)'}}>
                            <p style={{margin:0,fontSize:10,color:'#f59e0b',lineHeight:1.5}}>{(cfg as any).hint}</p>
                          </div>
                        )}

                        {/* Boutons */}
                        {!step.done && !step.skipped && !step.loading && (
                          <div style={{display:'flex',alignItems:'center',gap:8}}>
                            <button className="cab-btn"
                              onClick={() => router.push(cfg.href)}
                              style={{
                                display:'inline-flex', alignItems:'center', gap:5,
                                padding:'5px 12px', borderRadius:8, border:'none', cursor:'pointer',
                                fontSize:11, fontWeight:700,
                                background: isActive ? cfg.color : 'rgba(255,255,255,.07)',
                                color: isActive ? '#fff' : '#94a3b8',
                                boxShadow: isActive ? `0 3px 10px ${cfg.color}40` : 'none',
                              }}>
                              {cfg.cta} <ArrowRight size={10}/>
                            </button>
                            <button
                              className="cab-skip"
                              style={{fontSize:10, color:'#475569'}}
                              onClick={() => skipStep(i)}>
                              Passer
                            </button>
                          </div>
                        )}
                      </div>

                      {step.done && <CheckCircle2 size={14} style={{color:'#10b981',flexShrink:0,marginTop:2}}/>}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          )}

          {/* Footer */}
          {!collapsed && (
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 16px',borderTop:'1px solid rgba(255,255,255,.05)'}}>
              <button onClick={dismissForever} style={{background:'none',border:'none',cursor:'pointer',fontSize:10,color:'#475569',textDecoration:'underline'}}>
                Ne plus afficher
              </button>
              <a href="/docs" target="_blank" rel="noopener noreferrer" style={{fontSize:10,color:'#6366f1',textDecoration:'none',display:'flex',alignItems:'center',gap:3}}>
                Centre d'aide <ChevronRight size={10}/>
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}