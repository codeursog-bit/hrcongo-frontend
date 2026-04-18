'use client';

// ============================================================================
// 📁 components/onboarding/OnboardingChecklist.tsx
//
// ✅ Position FIXED — ne pousse pas le contenu, flotte en bas à droite
// ✅ Checks API corrigés selon les vrais endpoints backend
// ✅ "Déjà fait ?" → vérifie vraiment l'API et coche
// ✅ ADMIN / SUPER_ADMIN uniquement
// ✅ completedAt → ne réapparaît plus jamais
// Props : hidePaie (PME cabinet)
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
interface SavedState { dismissed?: boolean; hiddenUntilLogin?: boolean; completedAt?: string; }
interface Props { hidePaie?: boolean; }

const KEY_PREFIX = 'konza_onboarding_v1_';
const getKey = (id: string) => `${KEY_PREFIX}${id}`;
function load(key: string): SavedState {
  try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; }
}
function save(key: string, patch: Partial<SavedState>) {
  localStorage.setItem(key, JSON.stringify({ ...load(key), ...patch }));
}

function StepIcon({ done, loading, index }: { done: boolean; loading: boolean; index: number }) {
  if (loading) return (
    <div className="w-7 h-7 rounded-full bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center flex-shrink-0">
      <Loader2 size={13} className="animate-spin text-sky-500" />
    </div>
  );
  if (done) return (
    <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0"
      style={{ animation: 'ob-pop .35s cubic-bezier(.34,1.56,.64,1)' }}>
      <CheckCircle2 size={14} className="text-emerald-500" />
    </div>
  );
  return (
    <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center flex-shrink-0">
      <span className="text-[10px] font-bold text-gray-400">{index + 1}</span>
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
      desc: 'Nom légal, RCCM, logo, adresse — apparaissent sur vos bulletins.',
      path: 'Paramètres → Entreprise',
      cta: 'Configurer', href: '/settings?tab=company',
    },
    {
      icon: Users, color: '#8b5cf6',
      title: 'Créez votre premier département',
      desc: 'DRH, Finance, Terrain… chaque employé sera rattaché à un département.',
      path: 'Paramètres → Départements',
      cta: 'Créer', href: '/settings?tab=departments',
    },
    {
      icon: UserCheck, color: '#0ea5e9',
      title: 'Ajoutez votre premier employé',
      desc: 'Identité, contrat et salaire de base. Import Excel possible.',
      path: 'Employés → Nouveau',
      cta: 'Ajouter', href: '/employes/nouveau',
    },
    {
      icon: Clock, color: '#f59e0b',
      title: 'Enregistrez une présence',
      desc: 'Un bulletin nécessite des présences. Simulez un pointage manuel.',
      path: 'Présences → Pointage Manuel',
      cta: 'Pointer', href: '/presences/pointage-manuel',
      hint: '💡 Sélectionnez l\'employé → choisissez une date → saisissez arrivée/départ.',
    },
    ...(!hidePaie ? [{
      icon: CreditCard, color: '#10b981',
      title: 'Générez votre premier bulletin',
      desc: 'CNSS, ITS, TOL calculés automatiquement. Vérifiez et confirmez.',
      path: 'Paie → Nouveau bulletin',
      cta: 'Générer', href: '/paie',
    }] : []),
  ];

  // ─── Init ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        if (u.role !== 'ADMIN' && u.role !== 'SUPER_ADMIN') return;
        setUserName(u.firstName || '');

        const me: any = await api.get('/auth/me');
        const cId = me?.companyId;
        if (!cId) return;
        setCompanyId(cId);

        const s = load(getKey(cId));
        if (s.dismissed || s.completedAt) return;
        if (s.hiddenUntilLogin) { save(getKey(cId), { hiddenUntilLogin: false }); return; }

        await checkAll(cId);
        setVisible(true);
      } catch {}
    })();
  }, []);

  // ─── Checks API (vrais endpoints) ─────────────────────────────────────────
  const checkAll = useCallback(async (cId: string) => {
    const fns = [chkCompany, chkDept, chkEmployee, chkPresence, ...(hidePaie ? [] : [chkPayroll])];
    const results = await Promise.allSettled(fns.map(f => f()));
    const next = results.map(r => ({ done: r.status === 'fulfilled' ? r.value : false, loading: false }));
    setSteps(next);
    if (next.every(s => s.done)) doComplete(cId);
    return next;
  }, [hidePaie]);

  // GET /companies/mine → retourne { name, ... }
  async function chkCompany(): Promise<boolean> {
    try { const r: any = await api.get('/companies/mine'); return !!(r?.name?.trim()); }
    catch { return false; }
  }

  // GET /departments → retourne un tableau
  async function chkDept(): Promise<boolean> {
    try {
      const r: any = await api.get('/departments');
      return (Array.isArray(r) ? r : r?.departments || []).length > 0;
    } catch { return false; }
  }

  // GET /employees?status=ACTIVE&limit=1 → retourne tableau ou { data, employees }
  async function chkEmployee(): Promise<boolean> {
    try {
      const r: any = await api.get('/employees?status=ACTIVE&limit=1');
      return (Array.isArray(r) ? r : r?.employees || r?.data || []).length > 0;
    } catch { return false; }
  }

  // GET /attendance → retourne { attendances: [...] }
  async function chkPresence(): Promise<boolean> {
    try {
      const now = new Date();
      const r: any = await api.get(`/attendance?month=${now.getMonth() + 1}&year=${now.getFullYear()}`);
      const list = r?.attendances || (Array.isArray(r) ? r : []);
      return list.some((a: any) => a.checkIn || a.status === 'PRESENT' || a.status === 'LATE');
    } catch { return false; }
  }

  // GET /payrolls?limit=1 → retourne tableau directement
  async function chkPayroll(): Promise<boolean> {
    try {
      const r: any = await api.get('/payrolls?limit=1');
      return (Array.isArray(r) ? r : []).length > 0;
    } catch { return false; }
  }

  // ─── Complétion ───────────────────────────────────────────────────────────
  function doComplete(cId: string) {
    setCelebrating(true);
    save(getKey(cId), { completedAt: new Date().toISOString() });
    setTimeout(() => { setVisible(false); setCelebrating(false); }, 4500);
  }

  // ─── Refresh étape ("Déjà fait ?") ───────────────────────────────────────
  const refreshStep = async (i: number) => {
    if (!companyId) return;
    // Mettre loading sur l'étape concernée
    setSteps(prev => prev.map((s, j) => j === i ? { ...s, loading: true } : s));

    const fns = [chkCompany, chkDept, chkEmployee, chkPresence, ...(hidePaie ? [] : [chkPayroll])];
    const done = await fns[i]().catch(() => false);

    setSteps(prev => {
      const next = prev.map((s, j) => j === i ? { done, loading: false } : s);
      if (next.every(s => s.done)) doComplete(companyId);
      return next;
    });
  };

  const dismissForever = () => { if (companyId) { save(getKey(companyId), { dismissed: true }); setVisible(false); } };
  const hideForNow = () => { if (companyId) { save(getKey(companyId), { hiddenUntilLogin: true }); setVisible(false); } };

  // ─── Calculs ──────────────────────────────────────────────────────────────
  const doneCount = steps.filter(s => s.done).length;
  const pct = Math.round((doneCount / steps.length) * 100);
  const activeIdx = steps.findIndex(s => !s.done && !s.loading);

  if (!visible) return null;

  // ─── Célébration ──────────────────────────────────────────────────────────
  if (celebrating) {
    return (
      <>
        <style>{`
          @keyframes ob-fadein{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
          @keyframes ob-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
          @keyframes ob-fadeout{0%,65%{opacity:1}100%{opacity:0;transform:scale(.95)}}
        `}</style>
        {/* Position fixe en bas à droite */}
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          width: 360, maxWidth: 'calc(100vw - 32px)',
        }}>
          <div className="relative overflow-hidden rounded-2xl p-5 text-white"
            style={{
              background: 'linear-gradient(135deg,#059669,#0d9488 55%,#0891b2)',
              boxShadow: '0 12px 40px rgba(5,150,105,0.4)',
              animation: 'ob-fadein .4s ease, ob-fadeout .7s ease 3.8s forwards',
            }}>
            {[...Array(12)].map((_, i) => (
              <div key={i} style={{
                position: 'absolute',
                width: i%3===0?7:4, height: i%3===0?7:4,
                borderRadius: i%2===0?'50%':'2px',
                background: ['#fff','#fde68a','#a7f3d0','#bfdbfe'][i%4],
                opacity: .65, left:`${6+i*7.5}%`, top:`${10+(i%3)*30}%`,
                animation:`ob-float ${1.2+(i%3)*.3}s ease-in-out infinite`,
                animationDelay:`${i*.1}s`,
              }}/>
            ))}
            <div className="relative z-10 flex items-center gap-4">
              <div style={{ fontSize: 40 }}>🎉</div>
              <div>
                <h3 className="font-black text-base mb-1">
                  {userName ? `Bravo ${userName} !` : 'Configuration terminée !'}
                </h3>
                <p className="text-emerald-100 text-xs leading-relaxed">
                  Votre espace est prêt. Gérez vos équipes et générez vos bulletins en toute autonomie.
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
        @keyframes ob-fadein{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes ob-pop{0%{transform:scale(.6)}60%{transform:scale(1.2)}100%{transform:scale(1)}}
        @keyframes ob-pulse{0%,100%{opacity:1}50%{opacity:.35}}
        .ob-step{transition:background .15s,border-color .15s;border-radius:10px;border:1px solid transparent;}
        .ob-step:hover{background:rgba(0,0,0,.025);}
        .dark .ob-step:hover{background:rgba(255,255,255,.025);}
        .ob-active{background:rgba(14,165,233,.07)!important;border-color:rgba(14,165,233,.25)!important;}
        .ob-bar{transition:width .6s cubic-bezier(.4,0,.2,1);}
        .ob-cta{transition:all .15s;}
        .ob-cta:hover{opacity:.88;transform:translateY(-1px);}
      `}</style>

      {/* ── Panneau fixe en bas à droite ── */}
      <div style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        width: 360,
        maxWidth: 'calc(100vw - 32px)',
        animation: 'ob-fadein .4s ease',
      }}>
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 shadow-2xl overflow-hidden"
          style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#0ea5e9,#2563eb)' }}>
                <Sparkles size={14} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-gray-900 dark:text-white">
                    {userName ? `Bienvenue ${userName} 👋` : 'Démarrage rapide 👋'}
                  </h3>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400">
                    {doneCount}/{steps.length}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {hidePaie ? 'La paie est gérée par votre cabinet' : 'Configurez votre espace'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              <button onClick={() => setCollapsed(c => !c)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                {collapsed ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
              </button>
              <button onClick={hideForNow}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X size={14}/>
              </button>
            </div>
          </div>

          {/* Progress bar — toujours visible même replié */}
          <div className="px-4 pt-2.5 pb-1.5">
            <div className="flex justify-between mb-1">
              <span className="text-[10px] text-gray-400">
                {pct === 100 ? '✅ Tout est prêt !' : pct === 0 ? 'Commencez par l\'étape 1' : `${pct}% complété`}
              </span>
              <span className="text-[10px] text-gray-400">{doneCount}/{steps.length}</span>
            </div>
            <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div className="ob-bar h-full rounded-full" style={{
                width: `${pct}%`,
                background: pct===100 ? 'linear-gradient(90deg,#10b981,#0d9488)' : 'linear-gradient(90deg,#0ea5e9,#6366f1)',
              }}/>
            </div>
          </div>

          {/* Étapes */}
          {!collapsed && (
            <div className="px-2 pt-0.5 pb-2 space-y-0.5 max-h-[60vh] overflow-y-auto">
              {STEPS.map((cfg, i) => {
                const step = steps[i];
                if (!step) return null;
                const Icon = cfg.icon;
                const isActive = i === activeIdx;
                const isLocked = !step.done && activeIdx !== -1 && i > activeIdx;

                return (
                  <div key={i} className={`ob-step flex items-start gap-2.5 px-2.5 py-2.5 ${isActive && !step.done ? 'ob-active' : ''}`}>
                    <StepIcon done={step.done} loading={step.loading} index={i} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <p className={`text-xs font-semibold leading-tight ${
                          step.done ? 'text-gray-400 dark:text-gray-600 line-through'
                          : isLocked ? 'text-gray-400 dark:text-gray-600'
                          : 'text-gray-800 dark:text-gray-100'}`}>
                          {cfg.title}
                        </p>
                        {isActive && !step.done && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-sky-500 text-white">
                            <span className="w-1 h-1 rounded-full bg-white" style={{ animation:'ob-pulse 1.2s ease-in-out infinite'}}/>
                            Maintenant
                          </span>
                        )}
                      </div>

                      {!step.done && !isLocked && (
                        <>
                          <p className="text-[9px] font-mono text-gray-400 dark:text-gray-600 mb-1">{cfg.path}</p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed mb-1.5">{cfg.desc}</p>
                        </>
                      )}

                      {!step.done && !isLocked && (cfg as any).hint && isActive && (
                        <div className="mb-1.5 px-2.5 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800/40">
                          <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed">{(cfg as any).hint}</p>
                        </div>
                      )}

                      {!step.done && !step.loading && !isLocked && (
                        <div className="flex items-center gap-2">
                          <button className="ob-cta inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold"
                            style={{
                              background: isActive ? `linear-gradient(135deg,${cfg.color},${cfg.color}bb)` : 'rgba(0,0,0,.05)',
                              color: isActive ? '#fff' : '#6b7280',
                              boxShadow: isActive ? `0 3px 10px ${cfg.color}40` : 'none',
                            }}
                            onClick={() => {
                              router.push(cfg.href);
                              // Vérification auto au retour sur la page
                              const fn = () => { refreshStep(i); window.removeEventListener('focus', fn); };
                              window.addEventListener('focus', fn);
                            }}>
                            {cfg.cta} <ArrowRight size={10}/>
                          </button>
                          <button
                            onClick={() => refreshStep(i)}
                            className="text-[10px] text-gray-400 hover:text-sky-500 dark:hover:text-sky-400 underline underline-offset-1 transition-colors">
                            Déjà fait ?
                          </button>
                        </div>
                      )}

                      {isLocked && !step.done && (
                        <p className="text-[10px] text-gray-400 dark:text-gray-600 italic">
                          Après étape {activeIdx + 1}
                        </p>
                      )}
                    </div>

                    {step.done && <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0 mt-0.5"/>}
                  </div>
                );
              })}

              {hidePaie && (
                <div className="flex items-start gap-2.5 px-2.5 py-2.5 mt-1 rounded-xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200/60 dark:border-indigo-800/30">
                  <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                    <CreditCard size={12} className="text-indigo-500"/>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 mb-0.5">Paie gérée par votre cabinet</p>
                    <p className="text-[10px] text-indigo-500 dark:text-indigo-400 leading-relaxed">
                      Bulletins, CNSS/ITS et déclarations pris en charge par votre prestataire RH.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          {!collapsed && (
            <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <button onClick={dismissForever}
                className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors underline underline-offset-1">
                Ne plus afficher
              </button>
              <a href="/docs" target="_blank" rel="noopener noreferrer"
                className="text-[10px] text-sky-500 hover:text-sky-600 transition-colors flex items-center gap-0.5">
                Centre d'aide <ChevronRight size={10}/>
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}