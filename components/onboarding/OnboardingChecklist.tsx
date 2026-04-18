'use client';

// ============================================================================
// 📁 components/onboarding/OnboardingChecklist.tsx
// Visibilité : ADMIN et SUPER_ADMIN uniquement
// Props : hidePaie (PME cabinet — masque l'étape paie)
// Persistance localStorage par companyId :
//   dismissed    → Ne plus jamais afficher
//   completedAt  → Complétion enregistrée, ne plus jamais afficher
//   hiddenUntilLogin → Masqué pour cette session uniquement
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2, X, Sparkles, Building2, Users,
  CreditCard, Clock, ArrowRight, Loader2,
  ChevronDown, ChevronUp, ChevronRight, UserCheck,
} from 'lucide-react';
import { api } from '@/services/api';

interface StepStatus { done: boolean; loading: boolean; }
interface OnboardingState { dismissed?: boolean; hiddenUntilLogin?: boolean; completedAt?: string; }
interface Props { hidePaie?: boolean; }

const STORAGE_KEY_PREFIX = 'konza_onboarding_v1_';
const getKey = (cId: string) => `${STORAGE_KEY_PREFIX}${cId}`;

function getSaved(key: string): OnboardingState {
  try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; }
}
function setSaved(key: string, patch: Partial<OnboardingState>) {
  localStorage.setItem(key, JSON.stringify({ ...getSaved(key), ...patch }));
}

// ─── Icône statut ─────────────────────────────────────────────────────────────
function StepIcon({ done, loading, index }: { done: boolean; loading: boolean; index: number }) {
  if (loading) return (
    <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center flex-shrink-0">
      <Loader2 size={14} className="animate-spin text-sky-500" />
    </div>
  );
  if (done) return (
    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0"
      style={{ animation: 'ob-pop 0.35s cubic-bezier(0.34,1.56,0.64,1)' }}>
      <CheckCircle2 size={16} className="text-emerald-500" />
    </div>
  );
  return (
    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-bold text-gray-400">{index + 1}</span>
    </div>
  );
}

export default function OnboardingChecklist({ hidePaie = false }: Props) {
  const router = useRouter();

  const [companyId,   setCompanyId]   = useState<string | null>(null);
  const [userName,    setUserName]    = useState('');
  const [visible,     setVisible]     = useState(false);
  const [collapsed,   setCollapsed]   = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  const totalSteps = hidePaie ? 4 : 5;
  const [steps, setSteps] = useState<StepStatus[]>(
    Array.from({ length: totalSteps }, () => ({ done: false, loading: true }))
  );

  // ─── Config étapes ────────────────────────────────────────────────────────
  const STEPS = [
    {
      icon: Building2, color: '#3b82f6',
      title: 'Configurez votre entreprise',
      desc: 'Renseignez le nom légal, le RCCM, le logo et l\'adresse. Ces informations apparaissent sur tous vos bulletins de paie et déclarations CNSS.',
      path: 'Paramètres → Entreprise',
      cta: 'Configurer maintenant', href: '/settings?tab=company',
    },
    {
      icon: Users, color: '#8b5cf6',
      title: 'Créez votre premier département',
      desc: 'Organisez la structure de votre société (DRH, Finance, Terrain…). Chaque employé sera rattaché à un département lors de sa création.',
      path: 'Paramètres → Départements',
      cta: 'Créer un département', href: '/settings?tab=departments',
    },
    {
      icon: UserCheck, color: '#0ea5e9',
      title: 'Ajoutez votre premier employé',
      desc: 'Créez le dossier complet : identité, contrat, salaire de base. Vous pouvez aussi importer plusieurs employés via Excel.',
      path: 'Employés → Nouveau',
      cta: 'Ajouter un employé', href: '/employes/nouveau',
    },
    {
      icon: Clock, color: '#f59e0b',
      title: 'Enregistrez une présence',
      desc: 'Un bulletin de paie nécessite des présences enregistrées. Utilisez le pointage manuel pour simuler une journée de travail de cet employé.',
      path: 'Présences → Pointage Manuel',
      cta: 'Pointage manuel', href: '/presences/pointage-manuel',
      hint: '💡 Sélectionnez l\'employé → choisissez une date → saisissez les heures d\'arrivée et de départ → enregistrez.',
    },
    ...(!hidePaie ? [{
      icon: CreditCard, color: '#10b981',
      title: 'Générez votre premier bulletin de paie',
      desc: 'CNSS, ITS, TOL et CAMU sont calculés automatiquement selon les barèmes congolais. Vérifiez l\'aperçu avant de confirmer.',
      path: 'Paie → Nouveau bulletin',
      cta: 'Générer un bulletin', href: '/paie',
    }] : []),
  ];

  // ─── Init ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const stored = localStorage.getItem('user');
        if (!stored) return;
        const u = JSON.parse(stored);
        if (u.role !== 'ADMIN' && u.role !== 'SUPER_ADMIN') return;
        setUserName(u.firstName || '');

        const me: any = await api.get('/auth/me');
        const cId = me?.companyId;
        if (!cId) return;
        setCompanyId(cId);

        const saved = getSaved(getKey(cId));
        if (saved.dismissed || saved.completedAt) return; // jamais plus
        if (saved.hiddenUntilLogin) {
          setSaved(getKey(cId), { hiddenUntilLogin: false });
          return; // masqué cette session
        }

        await checkAll(cId);
        setVisible(true);
      } catch (e) { console.warn('Onboarding:', e); }
    })();
  }, []);

  // ─── Checks ───────────────────────────────────────────────────────────────
  const checkAll = useCallback(async (cId: string) => {
    const fns = [chkEntreprise, chkDept, chkEmploye, chkPresence, ...(hidePaie ? [] : [chkPaie])];
    const results = await Promise.allSettled(fns.map(fn => fn(cId)));
    const next = results.map(r => ({ done: r.status === 'fulfilled' ? r.value : false, loading: false }));
    setSteps(next);
    if (next.every(s => s.done)) complete(cId);
    return next;
  }, [hidePaie]);

  async function chkEntreprise(cId: string) {
    try { const r: any = await api.get('/company/profile'); return !!(r?.name?.trim()); } catch { return false; }
  }
  async function chkDept(cId: string) {
    try { const r: any = await api.get('/departments'); return (Array.isArray(r) ? r : r?.departments || []).length > 0; } catch { return false; }
  }
  async function chkEmploye(cId: string) {
    try { const r: any = await api.get('/employees?limit=1&status=ACTIVE'); return (Array.isArray(r) ? r : r?.employees || r?.data || []).length > 0; } catch { return false; }
  }
  async function chkPresence(cId: string) {
    try {
      const now = new Date();
      const r: any = await api.get(`/attendance?month=${now.getMonth()+1}&year=${now.getFullYear()}`);
      return (r?.attendances || []).some((a: any) => a.status === 'PRESENT' || a.status === 'LATE' || a.checkIn);
    } catch { return false; }
  }
  async function chkPaie(cId: string) {
    try { const r: any = await api.get('/payroll?limit=1'); return (Array.isArray(r) ? r : r?.payslips || r?.data || []).length > 0; } catch { return false; }
  }

  // ─── Complétion ───────────────────────────────────────────────────────────
  function complete(cId: string) {
    setCelebrating(true);
    // Sauvegarder completedAt → ne plus jamais réapparaître
    setSaved(getKey(cId), { completedAt: new Date().toISOString() });
    setTimeout(() => { setVisible(false); setCelebrating(false); }, 4500);
  }

  const refreshStep = async (i: number) => {
    if (!companyId) return;
    setSteps(prev => prev.map((s, j) => j === i ? { ...s, loading: true } : s));
    const fns = [chkEntreprise, chkDept, chkEmploye, chkPresence, ...(hidePaie ? [] : [chkPaie])];
    const done = await fns[i](companyId).catch(() => false);
    setSteps(prev => {
      const next = prev.map((s, j) => j === i ? { done, loading: false } : s);
      if (next.every(s => s.done)) complete(companyId);
      return next;
    });
  };

  const dismissForever = () => { if (companyId) { setSaved(getKey(companyId), { dismissed: true }); setVisible(false); } };
  const hideForNow = () => { if (companyId) { setSaved(getKey(companyId), { hiddenUntilLogin: true }); setVisible(false); } };

  // ─── Calculs affichage ────────────────────────────────────────────────────
  const done = steps.filter(s => s.done).length;
  const pct = Math.round((done / steps.length) * 100);
  const activeIdx = steps.findIndex(s => !s.done && !s.loading);

  if (!visible) return null;

  // ─── Célébration ──────────────────────────────────────────────────────────
  if (celebrating) {
    return (
      <div className="mx-4 sm:mx-6 mb-5" style={{ animation: 'ob-fadein 0.4s ease' }}>
        <style>{`
          @keyframes ob-fadein{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
          @keyframes ob-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
          @keyframes ob-bounce{0%,100%{transform:scale(1)}40%{transform:scale(1.25)}}
          @keyframes ob-fadeout{0%,70%{opacity:1}100%{opacity:0;transform:translateY(-6px)}}
        `}</style>
        <div className="relative overflow-hidden rounded-2xl p-6 text-white"
          style={{
            background: 'linear-gradient(135deg,#059669,#0d9488 55%,#0891b2)',
            boxShadow: '0 8px 32px rgba(5,150,105,0.3)',
            animation: 'ob-fadein 0.4s ease, ob-fadeout 0.8s ease 3.7s forwards',
          }}>
          {[...Array(14)].map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              width: i%3===0?8:5, height: i%3===0?8:5,
              borderRadius: i%2===0?'50%':'2px',
              background: ['#fff','#fde68a','#a7f3d0','#bfdbfe','#fca5a5'][i%5],
              opacity: 0.65,
              left:`${5+i*6.5}%`, top:`${8+(i%4)*22}%`,
              animation:`ob-float ${1.2+(i%4)*0.3}s ease-in-out infinite`,
              animationDelay:`${i*0.1}s`,
            }}/>
          ))}
          <div className="relative z-10 flex items-center gap-5">
            <div style={{ fontSize: 48, animation: 'ob-bounce 0.5s ease 2' }}>🎉</div>
            <div>
              <h3 className="font-black text-xl mb-1">
                {userName ? `Bravo ${userName} !` : 'Configuration terminée !'}
              </h3>
              <p className="text-emerald-100 text-sm leading-relaxed mb-3">
                Votre espace Konza RH est entièrement configuré. Vous pouvez maintenant gérer vos équipes, suivre les présences et générer vos bulletins en toute autonomie.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {['✅ Entreprise','✅ Département','✅ Employé','✅ Présences',...(!hidePaie?['✅ Paie']:[])].map(t => (
                  <span key={t} className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.18)' }}>{t}</span>
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
        @keyframes ob-fadein{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes ob-pop{0%{transform:scale(0.6)}60%{transform:scale(1.2)}100%{transform:scale(1)}}
        @keyframes ob-pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        .ob-step{transition:background .15s,border-color .15s;border-radius:14px;border:1px solid transparent;}
        .ob-step:hover{background:rgba(0,0,0,.025);}
        .dark .ob-step:hover{background:rgba(255,255,255,.025);}
        .ob-active{background:rgba(14,165,233,.07)!important;border-color:rgba(14,165,233,.25)!important;}
        .ob-bar{transition:width .7s cubic-bezier(.4,0,.2,1);}
        .ob-btn{transition:all .15s ease;}
        .ob-btn:hover{opacity:.88;transform:translateY(-1px);}
      `}</style>

      <div className="mx-4 sm:mx-6 mb-5" style={{ animation: 'ob-fadein 0.4s ease' }}>
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#0ea5e9,#2563eb)' }}>
                <Sparkles size={16} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    {userName ? `Bienvenue ${userName} 👋` : 'Bienvenue sur Konza RH 👋'}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400">
                    {done}/{steps.length} étapes
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {hidePaie
                    ? 'Configurez votre espace — la paie est gérée par votre cabinet RH'
                    : 'Suivez ce guide pour configurer votre espace et générer votre première paie'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => setCollapsed(c => !c)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title={collapsed ? 'Voir les étapes' : 'Réduire'}>
                {collapsed ? <ChevronDown size={16}/> : <ChevronUp size={16}/>}
              </button>
              <button onClick={hideForNow}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Masquer pour cette session">
                <X size={16}/>
              </button>
            </div>
          </div>

          {/* Progress */}
          <div className="px-5 pt-3 pb-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-gray-400">
                {pct === 100 ? '✅ Tout est configuré !'
                  : pct === 0 ? 'Commencez par l\'étape 1'
                  : `${pct}% complété — continuez !`}
              </span>
              <span className="text-[11px] text-gray-400">{done} sur {steps.length}</span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div className="ob-bar h-full rounded-full" style={{
                width: `${pct}%`,
                background: pct === 100
                  ? 'linear-gradient(90deg,#10b981,#0d9488)'
                  : 'linear-gradient(90deg,#0ea5e9,#6366f1)',
              }}/>
            </div>
          </div>

          {/* Étapes */}
          {!collapsed && (
            <div className="px-3 pt-1 pb-2 space-y-0.5">
              {STEPS.map((cfg, i) => {
                const step = steps[i];
                if (!step) return null;
                const Icon = cfg.icon;
                const isActive = i === activeIdx;
                const isLocked = !step.done && activeIdx !== -1 && i > activeIdx;

                return (
                  <div key={i} className={`ob-step flex items-start gap-3 px-3 py-3.5 ${isActive && !step.done ? 'ob-active' : ''}`}>
                    <StepIcon done={step.done} loading={step.loading} index={i} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className={`text-sm font-semibold leading-snug ${
                          step.done ? 'text-gray-400 dark:text-gray-600 line-through'
                          : isLocked ? 'text-gray-400 dark:text-gray-600'
                          : 'text-gray-800 dark:text-gray-100'}`}>
                          {cfg.title}
                        </p>
                        {isActive && !step.done && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500 text-white">
                            <span className="w-1.5 h-1.5 rounded-full bg-white" style={{ animation: 'ob-pulse 1.2s ease-in-out infinite' }}/>
                            Maintenant
                          </span>
                        )}
                        {step.done && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                            Complété ✓
                          </span>
                        )}
                      </div>

                      {!step.done && !isLocked && (
                        <p className="text-[10px] font-mono text-gray-400 dark:text-gray-600 mb-1.5">{cfg.path}</p>
                      )}
                      {!step.done && !isLocked && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-2">{cfg.desc}</p>
                      )}
                      {!step.done && !isLocked && (cfg as any).hint && isActive && (
                        <div className="mb-2 px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800/40">
                          <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">{(cfg as any).hint}</p>
                        </div>
                      )}
                      {!step.done && !step.loading && !isLocked && (
                        <div className="flex items-center gap-3">
                          <button className="ob-btn inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
                            style={{
                              background: isActive ? `linear-gradient(135deg,${cfg.color},${cfg.color}bb)` : 'rgba(0,0,0,0.05)',
                              color: isActive ? '#fff' : '#6b7280',
                              boxShadow: isActive ? `0 4px 14px ${cfg.color}40` : 'none',
                            }}
                            onClick={() => {
                              router.push(cfg.href);
                              const fn = () => { refreshStep(i); window.removeEventListener('focus', fn); };
                              window.addEventListener('focus', fn);
                            }}>
                            {cfg.cta} <ArrowRight size={12}/>
                          </button>
                          <button onClick={() => refreshStep(i)}
                            className="text-[11px] text-gray-400 hover:text-sky-500 dark:hover:text-sky-400 underline underline-offset-2 transition-colors">
                            Déjà fait ?
                          </button>
                        </div>
                      )}
                      {isLocked && !step.done && (
                        <p className="text-[11px] text-gray-400 dark:text-gray-600 italic">
                          Disponible après l'étape {activeIdx + 1}
                        </p>
                      )}
                    </div>

                    {step.done && <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0 mt-0.5"/>}
                  </div>
                );
              })}

              {hidePaie && (
                <div className="flex items-start gap-3 px-3 py-3 mt-1 rounded-xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200/60 dark:border-indigo-800/30">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                    <CreditCard size={14} className="text-indigo-500"/>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-0.5">Paie gérée par votre cabinet RH</p>
                    <p className="text-[11px] text-indigo-500 dark:text-indigo-400 leading-relaxed">
                      La génération des bulletins, le calcul CNSS/ITS et les déclarations sont pris en charge directement par votre prestataire depuis son espace cabinet.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          {!collapsed && (
            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <button onClick={dismissForever}
                className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors underline underline-offset-2">
                Ne plus afficher
              </button>
              <a href="/docs" target="_blank" rel="noopener noreferrer"
                className="text-[11px] text-sky-500 hover:text-sky-600 transition-colors flex items-center gap-1">
                Centre d'aide <ChevronRight size={11}/>
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}