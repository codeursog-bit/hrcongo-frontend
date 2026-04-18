'use client';

// ============================================================================
// 📁 components/onboarding/CabinetOnboardingChecklist.tsx
// Visibilité : CABINET_ADMIN uniquement
// Flow en 2 niveaux :
//   Niveau 1 — Cabinet (nom/logo + gestionnaire optionnel)
//   Niveau 2 — Première PME (création → config → employé → paie)
// Persistance localStorage par cabinetId :
//   dismissed    → jamais plus
//   completedAt  → complétion, jamais plus
//   hiddenUntilLogin → session uniquement
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  CheckCircle2, X, Sparkles, Building2, Users,
  CreditCard, Settings, ArrowRight, Loader2,
  ChevronDown, ChevronUp, ChevronRight, UserPlus, Briefcase,
} from 'lucide-react';
import { api } from '@/services/api';

interface StepStatus { done: boolean; loading: boolean; }
interface CabinetOnboardingState { dismissed?: boolean; hiddenUntilLogin?: boolean; completedAt?: string; }

const STORAGE_KEY_PREFIX = 'konza_cabinet_onboarding_v1_';
const getKey = (id: string) => `${STORAGE_KEY_PREFIX}${id}`;

function getSaved(key: string): CabinetOnboardingState {
  try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; }
}
function setSaved(key: string, patch: Partial<CabinetOnboardingState>) {
  localStorage.setItem(key, JSON.stringify({ ...getSaved(key), ...patch }));
}

// ─── Section divider ──────────────────────────────────────────────────────────
function SectionLabel({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px 4px' }}>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
      <span style={{ fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
    </div>
  );
}

// ─── Step Icon ────────────────────────────────────────────────────────────────
function StepIcon({ done, loading, index }: { done: boolean; loading: boolean; index: number }) {
  const base: React.CSSProperties = {
    width: 32, height: 32, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  };
  if (loading) return (
    <div style={{ ...base, background: 'rgba(99,102,241,0.12)' }}>
      <Loader2 size={14} style={{ color: '#6366f1', animation: 'spin 1s linear infinite' }} />
    </div>
  );
  if (done) return (
    <div style={{ ...base, background: 'rgba(16,185,129,0.15)', animation: 'cab-pop 0.35s cubic-bezier(0.34,1.56,0.64,1)' }}>
      <CheckCircle2 size={16} style={{ color: '#10b981' }} />
    </div>
  );
  return (
    <div style={{ ...base, background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.1)' }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>{index + 1}</span>
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

  // 6 étapes : 0-1 cabinet, 2-5 PME
  const [steps, setSteps] = useState<StepStatus[]>(
    Array.from({ length: 6 }, () => ({ done: false, loading: true }))
  );

  // ─── Init ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!cabinetId) return;
    (async () => {
      try {
        const stored = localStorage.getItem('user');
        if (!stored) return;
        const u = JSON.parse(stored);
        if (u.role !== 'CABINET_ADMIN') return;
        setUserName(u.firstName || '');

        const saved = getSaved(getKey(cabinetId));
        if (saved.dismissed || saved.completedAt) return;
        if (saved.hiddenUntilLogin) {
          setSaved(getKey(cabinetId), { hiddenUntilLogin: false });
          return;
        }

        // Récupérer la première PME
        let firstCId: string | null = null;
        try {
          const dash: any = await api.get(`/cabinet/${cabinetId}/dashboard`);
          if (dash?.companies?.length > 0) {
            firstCId = dash.companies[0].companyId;
            setFirstCompanyId(firstCId);
          }
        } catch {}

        await checkAll(cabinetId, firstCId);
        setVisible(true);
      } catch (e) { console.warn('Cabinet onboarding:', e); }
    })();
  }, [cabinetId]);

  // ─── Checks ───────────────────────────────────────────────────────────────
  const checkAll = useCallback(async (cId: string, firstCId: string | null) => {
    const fns = [
      () => chkCabinet(cId),
      () => chkGestionnaire(cId),
      () => chkPmeCreee(cId),
      () => chkPmeConfig(firstCId),
      () => chkEmploye(firstCId),
      () => chkPaie(firstCId),
    ];
    const results = await Promise.allSettled(fns.map(fn => fn()));
    const next = results.map(r => ({ done: r.status === 'fulfilled' ? r.value : false, loading: false }));
    setSteps(next);
    // Complétion = toutes les étapes requises (on ignore l'optionnel index 1)
    const required = next.filter((_, i) => i !== 1);
    if (required.every(s => s.done)) complete(cId);
    return next;
  }, []);

  async function chkCabinet(cId: string): Promise<boolean> {
    try { const r: any = await api.get(`/cabinet/${cId}/profile`); return !!(r?.name?.trim()); } catch { return false; }
  }
  async function chkGestionnaire(cId: string): Promise<boolean> {
    try { const r: any = await api.get(`/cabinet/${cId}/gestionnaires`); return (Array.isArray(r) ? r : r?.gestionnaires || []).length > 0; } catch { return false; }
  }
  async function chkPmeCreee(cId: string): Promise<boolean> {
    try { const r: any = await api.get(`/cabinet/${cId}/dashboard`); return (r?.companies?.length || 0) > 0; } catch { return false; }
  }
  async function chkPmeConfig(firstCId: string | null): Promise<boolean> {
    if (!firstCId) return false;
    try {
      const [comp, depts]: any[] = await Promise.all([
        api.get(`/companies/${firstCId}`),
        api.get(`/departments?companyId=${firstCId}`),
      ]);
      return !!(comp?.name) && (Array.isArray(depts) ? depts : depts?.data || []).length > 0;
    } catch { return false; }
  }
  async function chkEmploye(firstCId: string | null): Promise<boolean> {
    if (!firstCId) return false;
    try { const r: any = await api.get(`/employees?companyId=${firstCId}&status=ACTIVE&limit=1`); return (Array.isArray(r) ? r : r?.data || r?.employees || []).length > 0; } catch { return false; }
  }
  async function chkPaie(firstCId: string | null): Promise<boolean> {
    if (!firstCId) return false;
    try { const r: any = await api.get(`/payroll?companyId=${firstCId}&limit=1`); return (Array.isArray(r) ? r : r?.payslips || r?.data || []).length > 0; } catch { return false; }
  }

  // ─── Complétion ───────────────────────────────────────────────────────────
  function complete(cId: string) {
    setCelebrating(true);
    setSaved(getKey(cId), { completedAt: new Date().toISOString() });
    setTimeout(() => { setVisible(false); setCelebrating(false); }, 4500);
  }

  const refreshStep = async (i: number) => {
    if (!cabinetId) return;
    setSteps(prev => prev.map((s, j) => j === i ? { ...s, loading: true } : s));
    const fns = [
      () => chkCabinet(cabinetId),
      () => chkGestionnaire(cabinetId),
      () => chkPmeCreee(cabinetId),
      () => chkPmeConfig(firstCompanyId),
      () => chkEmploye(firstCompanyId),
      () => chkPaie(firstCompanyId),
    ];
    const done = await fns[i]().catch(() => false);
    setSteps(prev => {
      const next = prev.map((s, j) => j === i ? { done, loading: false } : s);
      const required = next.filter((_, j) => j !== 1);
      if (required.every(s => s.done)) complete(cabinetId);
      return next;
    });
  };

  const dismissForever = () => { setSaved(getKey(cabinetId), { dismissed: true }); setVisible(false); };
  const hideForNow = () => { setSaved(getKey(cabinetId), { hiddenUntilLogin: true }); setVisible(false); };

  // ─── Config étapes ────────────────────────────────────────────────────────
  const STEPS_CONFIG = [
    {
      section: 'Votre cabinet',
      icon: Settings, color: '#6366f1',
      title: 'Configurez votre cabinet',
      desc: 'Renseignez le nom, le logo et les couleurs de votre cabinet. Ces informations apparaissent sur l\'espace de vos PME clientes.',
      path: 'Paramètres cabinet',
      cta: 'Configurer', href: `/cabinet/${cabinetId}/parametres`,
    },
    {
      section: null,
      icon: UserPlus, color: '#8b5cf6',
      title: 'Invitez un gestionnaire',
      desc: 'Ajoutez un collaborateur pour co-gérer vos PME clientes en équipe.',
      path: 'Gestionnaires',
      cta: 'Inviter', href: `/cabinet/${cabinetId}/gestionnaires`,
      optional: true,
    },
    {
      section: 'Votre première PME cliente',
      icon: Building2, color: '#0ea5e9',
      title: 'Créez votre première PME',
      desc: 'Ajoutez une entreprise cliente à gérer — elle disposera de son propre espace isolé avec employés, présences et paie.',
      path: 'Mes PME → Ajouter une PME',
      cta: 'Créer une PME', href: `/cabinet/${cabinetId}/ajouter-pme`,
    },
    {
      section: null,
      icon: Briefcase, color: '#f59e0b',
      title: 'Configurez la PME',
      desc: 'Infos légales (RCCM, adresse) et création du premier département. Ces données apparaîtront sur les bulletins de paie.',
      path: 'Entreprise → Paramètres',
      cta: 'Configurer la PME',
      href: firstCompanyId ? `/cabinet/${cabinetId}/entreprise/${firstCompanyId}/parametres` : `/cabinet/${cabinetId}/mes-pme`,
      hint: !firstCompanyId ? '⚠️ Créez d\'abord une PME pour accéder à ses paramètres.' : null,
    },
    {
      section: null,
      icon: Users, color: '#10b981',
      title: 'Ajoutez des employés à la PME',
      desc: 'Créez les dossiers employés avec contrat et salaire de base, ou importez-les via Excel.',
      path: 'Entreprise → Employés',
      cta: 'Ajouter des employés',
      href: firstCompanyId ? `/cabinet/${cabinetId}/entreprise/${firstCompanyId}/employes` : `/cabinet/${cabinetId}/mes-pme`,
    },
    {
      section: null,
      icon: CreditCard, color: '#06b6d4',
      title: 'Générez la première paie',
      desc: 'Saisissez les variables de paie, CNSS/ITS calculés automatiquement, générez les bulletins PDF pour toute la PME.',
      path: 'Entreprise → Bulletins',
      cta: 'Générer la paie',
      href: firstCompanyId ? `/cabinet/${cabinetId}/entreprise/${firstCompanyId}/bulletins` : `/cabinet/${cabinetId}/mes-pme`,
    },
  ];

  // ─── Calculs ──────────────────────────────────────────────────────────────
  const requiredSteps = steps.filter((_, i) => i !== 1); // exclure l'optionnel
  const requiredDone = requiredSteps.filter(s => s.done).length;
  const pct = Math.round((requiredDone / requiredSteps.length) * 100);
  const totalDone = steps.filter(s => s.done).length;
  const activeIdx = steps.findIndex(s => !s.done && !s.loading);

  if (!visible) return null;

  // ─── Célébration ──────────────────────────────────────────────────────────
  if (celebrating) {
    return (
      <div style={{ margin: '0 0 20px 0', animation: 'cab-fadein 0.4s ease' }}>
        <style>{`
          @keyframes cab-fadein{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
          @keyframes cab-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
          @keyframes cab-bounce{0%,100%{transform:scale(1)}40%{transform:scale(1.25)}}
          @keyframes cab-fadeout{0%,70%{opacity:1}100%{opacity:0;transform:translateY(-6px)}}
          @keyframes spin{to{transform:rotate(360deg)}}
          @keyframes cab-pop{0%{transform:scale(0.6)}60%{transform:scale(1.2)}100%{transform:scale(1)}}
        `}</style>
        <div style={{
          position: 'relative', overflow: 'hidden', borderRadius: 20,
          padding: '24px 28px',
          background: 'linear-gradient(135deg,#6366f1,#8b5cf6 50%,#06b6d4)',
          boxShadow: '0 8px 32px rgba(99,102,241,0.35)',
          animation: 'cab-fadein 0.4s ease, cab-fadeout 0.8s ease 3.7s forwards',
        }}>
          {[...Array(14)].map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              width: i%3===0?8:5, height: i%3===0?8:5,
              borderRadius: i%2===0?'50%':'2px',
              background: ['#fff','#fde68a','#a7f3d0','#bfdbfe','#fca5a5'][i%5],
              opacity: 0.6, left:`${5+i*6.5}%`, top:`${8+(i%4)*22}%`,
              animation:`cab-float ${1.2+(i%4)*0.3}s ease-in-out infinite`,
              animationDelay:`${i*0.1}s`,
            }}/>
          ))}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ fontSize: 48, animation: 'cab-bounce 0.5s ease 2' }}>🎉</div>
            <div>
              <h3 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 900, color: '#fff' }}>
                {userName ? `Bravo ${userName} !` : 'Cabinet configuré !'}
              </h3>
              <p style={{ margin: '0 0 12px', fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
                Votre cabinet est opérationnel. Vous pouvez maintenant gérer toutes vos PME clientes, générer leurs bulletins et suivre leur activité RH.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {['✅ Cabinet','✅ PME créée','✅ Configurée','✅ Employés','✅ Paie'].map(t => (
                  <span key={t} style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
                    background: 'rgba(255,255,255,0.18)', color: '#fff',
                  }}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Bannière principale ──────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes cab-fadein{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes cab-pop{0%{transform:scale(0.6)}60%{transform:scale(1.2)}100%{transform:scale(1)}}
        @keyframes cab-pulse{0%,100%{opacity:1}50%{opacity:0.35}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .cab-step{transition:background .15s,border-color .15s;border-radius:14px;border:1px solid transparent;}
        .cab-step:hover{background:rgba(255,255,255,0.025);}
        .cab-active{background:rgba(99,102,241,0.08)!important;border-color:rgba(99,102,241,0.25)!important;}
        .cab-bar{transition:width .7s cubic-bezier(.4,0,.2,1);}
        .cab-btn{transition:all .15s ease;}
        .cab-btn:hover{opacity:.88;transform:translateY(-1px);}
      `}</style>

      <div style={{ marginBottom: 20, animation: 'cab-fadein 0.4s ease' }}>
        <div style={{
          borderRadius: 20, overflow: 'hidden',
          background: '#151e30',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        }}>

          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Sparkles size={16} color="#fff" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>
                    {userName ? `Bienvenue ${userName} 👋` : 'Bienvenue dans votre cabinet 👋'}
                  </h3>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                    background: 'rgba(99,102,241,0.15)', color: '#818cf8',
                  }}>
                    {totalDone}/{steps.length} étapes
                  </span>
                </div>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: '#64748b' }}>
                  Configurez votre cabinet et gérez votre première PME cliente
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => setCollapsed(c => !c)} style={{
                width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer',
                background: 'rgba(255,255,255,0.05)', color: '#64748b',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {collapsed ? <ChevronDown size={15}/> : <ChevronUp size={15}/>}
              </button>
              <button onClick={hideForNow} style={{
                width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer',
                background: 'rgba(255,255,255,0.05)', color: '#64748b',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <X size={15}/>
              </button>
            </div>
          </div>

          {/* Progress */}
          <div style={{ padding: '12px 20px 8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: '#64748b' }}>
                {pct === 100 ? '✅ Cabinet prêt !'
                  : pct === 0 ? 'Commencez par l\'étape 1'
                  : `${pct}% complété — continuez !`}
              </span>
              <span style={{ fontSize: 11, color: '#64748b' }}>{requiredDone}/{requiredSteps.length} étapes principales</span>
            </div>
            <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.06)' }}>
              <div className="cab-bar" style={{
                height: '100%', borderRadius: 99, width: `${pct}%`,
                background: pct === 100
                  ? 'linear-gradient(90deg,#10b981,#0d9488)'
                  : 'linear-gradient(90deg,#6366f1,#06b6d4)',
              }}/>
            </div>
          </div>

          {/* Étapes */}
          {!collapsed && (
            <div style={{ padding: '4px 8px 8px' }}>
              {STEPS_CONFIG.map((cfg, i) => {
                const step = steps[i];
                if (!step) return null;
                const Icon = cfg.icon;
                const isActive = i === activeIdx;
                const isOptional = !!(cfg as any).optional;
                const isLocked = !step.done && activeIdx !== -1 && i > activeIdx && !isOptional;

                return (
                  <React.Fragment key={i}>
                    {cfg.section && <SectionLabel label={cfg.section} />}
                    <div className={`cab-step ${isActive && !step.done ? 'cab-active' : ''}`}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 12px', marginBottom: 2 }}>

                      <StepIcon done={step.done} loading={step.loading} index={i} />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
                          <p style={{
                            margin: 0, fontSize: 13, fontWeight: 600,
                            color: step.done ? '#475569' : isLocked ? '#334155' : '#e2e8f0',
                            textDecoration: step.done ? 'line-through' : 'none',
                          }}>
                            {cfg.title}
                          </p>
                          {isOptional && (
                            <span style={{
                              fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 999,
                              background: 'rgba(255,255,255,0.06)', color: '#64748b',
                              textTransform: 'uppercase', letterSpacing: '0.05em',
                            }}>Optionnel</span>
                          )}
                          {isActive && !step.done && (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
                              background: '#6366f1', color: '#fff',
                            }}>
                              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff', animation: 'cab-pulse 1.2s ease-in-out infinite' }}/>
                              Maintenant
                            </span>
                          )}
                          {step.done && (
                            <span style={{
                              fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 999,
                              background: 'rgba(16,185,129,0.15)', color: '#10b981',
                            }}>Complété ✓</span>
                          )}
                        </div>

                        {!step.done && !isLocked && (
                          <p style={{ margin: '1px 0 0', fontSize: 10, color: '#475569', fontFamily: 'monospace' }}>
                            {cfg.path}
                          </p>
                        )}
                        {!step.done && !isLocked && (
                          <p style={{ margin: '4px 0 6px', fontSize: 12, color: '#64748b', lineHeight: 1.55 }}>
                            {cfg.desc}
                          </p>
                        )}

                        {/* Hint */}
                        {!step.done && !isLocked && (cfg as any).hint && (
                          <div style={{
                            margin: '6px 0', padding: '8px 12px', borderRadius: 10,
                            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
                          }}>
                            <p style={{ margin: 0, fontSize: 11, color: '#f59e0b', lineHeight: 1.5 }}>
                              {(cfg as any).hint}
                            </p>
                          </div>
                        )}

                        {/* CTA */}
                        {!step.done && !step.loading && !isLocked && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <button className="cab-btn"
                              onClick={() => {
                                router.push(cfg.href);
                                const fn = () => { refreshStep(i); window.removeEventListener('focus', fn); };
                                window.addEventListener('focus', fn);
                              }}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                padding: '6px 14px', borderRadius: 9, border: 'none', cursor: 'pointer',
                                fontSize: 12, fontWeight: 700,
                                background: isActive ? cfg.color : 'rgba(255,255,255,0.07)',
                                color: isActive ? '#fff' : '#94a3b8',
                                boxShadow: isActive ? `0 4px 12px ${cfg.color}40` : 'none',
                              }}>
                              {cfg.cta} <ArrowRight size={11}/>
                            </button>
                            <button onClick={() => refreshStep(i)} style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              fontSize: 11, color: '#475569', textDecoration: 'underline',
                            }}>
                              Déjà fait ?
                            </button>
                          </div>
                        )}

                        {isLocked && !step.done && (
                          <p style={{ margin: '4px 0 0', fontSize: 11, color: '#334155', fontStyle: 'italic' }}>
                            Disponible après l'étape {activeIdx + 1}
                          </p>
                        )}
                      </div>

                      {step.done && <CheckCircle2 size={15} style={{ color: '#10b981', flexShrink: 0, marginTop: 2 }}/>}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          )}

          {/* Footer */}
          {!collapsed && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 20px', borderTop: '1px solid rgba(255,255,255,0.05)',
            }}>
              <button onClick={dismissForever} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 11, color: '#475569', textDecoration: 'underline',
              }}>
                Ne plus afficher
              </button>
              <a href="/docs" target="_blank" rel="noopener noreferrer" style={{
                fontSize: 11, color: '#6366f1', textDecoration: 'none',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                Centre d'aide <ChevronRight size={11}/>
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}