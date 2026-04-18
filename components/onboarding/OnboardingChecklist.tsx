'use client';

// ============================================================================
// 📁 components/onboarding/OnboardingChecklist.tsx
//
// Props :
//   hidePaie?: boolean  → masque l'étape paie (PME gérée par cabinet)
//
// Visibilité :
//   - Uniquement rôle ADMIN ou SUPER_ADMIN
//   - HR_MANAGER, MANAGER, EMPLOYEE → rien affiché
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2, X, Sparkles, Building2, Users,
  CreditCard, Clock, ArrowRight, Loader2,
  ChevronDown, ChevronUp, ChevronRight,
} from 'lucide-react';
import { api } from '@/services/api';

interface StepStatus { done: boolean; loading: boolean; }
interface OnboardingState { dismissed: boolean; hiddenUntilLogin: boolean; completedAt?: string; }
interface Props { hidePaie?: boolean; }

const STORAGE_KEY_PREFIX = 'konza_onboarding_v1_';
const getStorageKey = (cId: string) => `${STORAGE_KEY_PREFIX}${cId}`;

function StepIcon({ done, loading, index }: { done: boolean; loading: boolean; index: number }) {
  if (loading) return (
    <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center flex-shrink-0">
      <Loader2 size={14} className="animate-spin text-sky-500" />
    </div>
  );
  if (done) return (
    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0 animate-[pop_0.3s_ease]">
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

  // ─── Steps config ──────────────────────────────────────────────────────────
  const ALL_STEPS = [
    {
      icon: Building2,
      title: 'Configurez votre entreprise',
      desc: 'Nom légal, RCCM, logo et adresse — apparaissent sur vos bulletins.',
      cta: 'Configurer', href: '/settings?tab=company',
    },
    {
      icon: Users,
      title: 'Créez votre premier département',
      desc: 'Organisez votre structure avant d\'ajouter des employés.',
      cta: 'Créer', href: '/settings?tab=departments',
    },
    {
      icon: Users,
      title: 'Ajoutez votre premier employé',
      desc: 'Créez un dossier avec contrat et salaire de base.',
      cta: 'Ajouter', href: '/employes/nouveau',
    },
    {
      icon: Clock,
      title: 'Simulez un pointage',
      desc: 'Un bulletin nécessite des présences. Enregistrez une présence manuelle.',
      cta: 'Pointer manuellement', href: '/presences/pointage-manuel',
      hint: '💡 Présences → Pointage Manuel → sélectionnez l\'employé → saisissez une date.',
    },
    ...(!hidePaie ? [{
      icon: CreditCard,
      title: 'Générez votre premier bulletin',
      desc: 'Paie → Nouveau bulletin → vérifiez et confirmez.',
      cta: 'Générer', href: '/paie',
    }] : []),
  ];

  // ─── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const stored = localStorage.getItem('user');
        if (!stored) return;
        const u = JSON.parse(stored);

        // ⚠️ ADMIN uniquement — pas HR_MANAGER, MANAGER, EMPLOYEE
        if (u.role !== 'ADMIN' && u.role !== 'SUPER_ADMIN') return;

        setUserName(u.firstName || '');

        const meRes: any = await api.get('/auth/me');
        const cId = meRes?.companyId;
        if (!cId) return;
        setCompanyId(cId);

        const key = getStorageKey(cId);
        const saved: OnboardingState = (() => {
          try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; }
        })() as OnboardingState;

        if (saved.dismissed) return;
        if (saved.hiddenUntilLogin) {
          localStorage.setItem(key, JSON.stringify({ ...saved, hiddenUntilLogin: false }));
          return;
        }

        await checkAllSteps(cId);
        setVisible(true);
      } catch (e) {
        console.warn('Onboarding init:', e);
      }
    };
    init();
  }, []);

  // ─── API checks ────────────────────────────────────────────────────────────
  const checkAllSteps = useCallback(async (cId: string) => {
    const fns = [
      checkEntreprise, checkDepartement, checkEmploye, checkPresence,
      ...(hidePaie ? [] : [checkPaie]),
    ];
    const results = await Promise.allSettled(fns.map(fn => fn(cId)));
    const newSteps = results.map(r => ({
      done: r.status === 'fulfilled' ? r.value : false,
      loading: false,
    }));
    setSteps(newSteps);
    if (newSteps.every(s => s.done)) triggerComplete(cId);
    return newSteps;
  }, [hidePaie]);

  async function checkEntreprise(cId: string): Promise<boolean> {
    try { const r: any = await api.get('/company/profile'); return !!(r?.name?.trim()); }
    catch { return false; }
  }
  async function checkDepartement(cId: string): Promise<boolean> {
    try {
      const r: any = await api.get('/departments');
      return (Array.isArray(r) ? r : r?.departments || []).length > 0;
    } catch { return false; }
  }
  async function checkEmploye(cId: string): Promise<boolean> {
    try {
      const r: any = await api.get('/employees?limit=1&status=ACTIVE');
      return (Array.isArray(r) ? r : r?.employees || r?.data || []).length > 0;
    } catch { return false; }
  }
  async function checkPresence(cId: string): Promise<boolean> {
    try {
      const now = new Date();
      const r: any = await api.get(`/attendance?month=${now.getMonth()+1}&year=${now.getFullYear()}`);
      return (r?.attendances || []).some((a: any) => a.status === 'PRESENT' || a.status === 'LATE' || a.checkIn);
    } catch { return false; }
  }
  async function checkPaie(cId: string): Promise<boolean> {
    try {
      const r: any = await api.get('/payroll?limit=1');
      return (Array.isArray(r) ? r : r?.payslips || r?.data || []).length > 0;
    } catch { return false; }
  }

  function triggerComplete(cId: string) {
    setCelebrating(true);
    const key = getStorageKey(cId);
    const saved = (() => { try { return JSON.parse(localStorage.getItem(key)||'{}'); } catch { return {}; } })();
    localStorage.setItem(key, JSON.stringify({ ...saved, completedAt: new Date().toISOString() }));
    setTimeout(() => setVisible(false), 4000);
  }

  const refreshStep = async (index: number) => {
    if (!companyId) return;
    setSteps(prev => prev.map((s, i) => i === index ? { ...s, loading: true } : s));
    const fns = [checkEntreprise, checkDepartement, checkEmploye, checkPresence, ...(hidePaie ? [] : [checkPaie])];
    const done = await fns[index](companyId).catch(() => false);
    setSteps(prev => {
      const next = prev.map((s, i) => i === index ? { done, loading: false } : s);
      if (next.every(s => s.done)) triggerComplete(companyId);
      return next;
    });
  };

  const dismissForever = () => {
    if (!companyId) return;
    localStorage.setItem(getStorageKey(companyId), JSON.stringify({ dismissed: true }));
    setVisible(false);
  };
  const hideForNow = () => {
    if (!companyId) return;
    const key = getStorageKey(companyId);
    const saved = (() => { try { return JSON.parse(localStorage.getItem(key)||'{}'); } catch { return {}; } })();
    localStorage.setItem(key, JSON.stringify({ ...saved, hiddenUntilLogin: true }));
    setVisible(false);
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  const completedCount = steps.filter(s => s.done).length;
  const progress = Math.round((completedCount / steps.length) * 100);
  const activeIndex = steps.findIndex(s => !s.done && !s.loading);

  if (!visible) return null;

  if (celebrating) {
    return (
      <div className="mx-4 sm:mx-6 mb-4" style={{ animation: 'fadeInUp 0.4s ease' }}>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 p-5 text-white shadow-lg">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="absolute w-2 h-2 rounded-full opacity-50"
              style={{ backgroundColor: ['#fff','#fde68a','#a7f3d0','#bfdbfe'][i%4], left:`${8+i*9}%`, top:`${10+(i%3)*30}%`, animation:`float ${1.5+i*0.15}s ease-in-out infinite`, animationDelay:`${i*0.12}s` }} />
          ))}
          <div className="relative z-10 flex items-center gap-4">
            <div className="text-4xl">🎉</div>
            <div>
              <h3 className="font-black text-base">Configuration terminée !</h3>
              <p className="text-emerald-100 text-sm mt-0.5">Votre espace est prêt. Bonne gestion d'équipe !</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes fadeInUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pop{0%{transform:scale(0.8)}60%{transform:scale(1.15)}100%{transform:scale(1)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        .ob-step{transition:background 0.15s;border-radius:12px;border:1px solid transparent;}
        .ob-step:hover{background:rgba(0,0,0,0.02);}
        .dark .ob-step:hover{background:rgba(255,255,255,0.02);}
        .ob-active{background:rgba(14,165,233,0.06)!important;border-color:rgba(14,165,233,0.2)!important;}
        .ob-bar{transition:width 0.6s cubic-bezier(0.4,0,0.2,1);}
      `}</style>

      <div className="mx-4 sm:mx-6 mb-4" style={{ animation: 'fadeInUp 0.4s ease' }}>
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                <Sparkles size={15} className="text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  {userName ? `Bienvenue ${userName} 👋` : 'Bienvenue 👋'}
                  <span className="px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 text-[10px] font-bold">
                    {completedCount}/{steps.length}
                  </span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {hidePaie
                    ? 'Configurez votre espace — la paie est gérée par votre cabinet'
                    : 'Configurez votre espace en quelques étapes simples'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setCollapsed(c => !c)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors">
                {collapsed ? <ChevronDown size={16}/> : <ChevronUp size={16}/>}
              </button>
              <button onClick={hideForNow}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors">
                <X size={16}/>
              </button>
            </div>
          </div>

          {/* Progress */}
          <div className="px-5 pt-3 pb-1">
            <div className="flex justify-between mb-1.5">
              <span className="text-[11px] text-gray-400">{progress === 100 ? '✅ Tout est prêt !' : `${progress}% complété`}</span>
              <span className="text-[11px] text-gray-400">{completedCount} sur {steps.length}</span>
            </div>
            <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div className="ob-bar h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500" style={{ width:`${progress}%` }} />
            </div>
          </div>

          {/* Steps */}
          {!collapsed && (
            <div className="px-3 py-2">
              {ALL_STEPS.map((cfg, i) => {
                const step = steps[i];
                if (!step) return null;
                const Icon = cfg.icon;
                const isActive = i === activeIndex;
                return (
                  <div key={i} className={`ob-step flex items-start gap-3 px-3 py-3 mb-0.5 ${isActive && !step.done ? 'ob-active' : ''}`}>
                    <StepIcon done={step.done} loading={step.loading} index={i} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-sm font-semibold ${step.done ? 'text-gray-400 dark:text-gray-600 line-through' : 'text-gray-800 dark:text-gray-100'}`}>
                          {cfg.title}
                        </p>
                        {isActive && !step.done && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-sky-500 text-white rounded-full">Maintenant</span>
                        )}
                      </div>
                      {!step.done && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{cfg.desc}</p>}
                      {!step.done && (cfg as any).hint && isActive && (
                        <div className="mt-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800/40 rounded-lg">
                          <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">{(cfg as any).hint}</p>
                        </div>
                      )}
                      {!step.done && !step.loading && (
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => {
                              router.push(cfg.href);
                              const onFocus = () => { refreshStep(i); window.removeEventListener('focus', onFocus); };
                              window.addEventListener('focus', onFocus);
                            }}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isActive ? 'bg-sky-500 hover:bg-sky-600 text-white shadow-sm hover:-translate-y-0.5' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'}`}>
                            {cfg.cta} <ArrowRight size={11}/>
                          </button>
                          <button onClick={() => refreshStep(i)}
                            className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline transition-colors">
                            Déjà fait ?
                          </button>
                        </div>
                      )}
                    </div>
                    {step.done && <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0 mt-0.5"/>}
                  </div>
                );
              })}

              {/* Bloc paie cabinet */}
              {hidePaie && (
                <div className="flex items-center gap-3 px-3 py-3 mx-0.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200/60 dark:border-indigo-800/30 mt-1">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                    <CreditCard size={14} className="text-indigo-500"/>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">Paie gérée par votre cabinet</p>
                    <p className="text-[11px] text-indigo-500 dark:text-indigo-400 mt-0.5">
                      La génération des bulletins est prise en charge par votre prestataire RH.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          {!collapsed && (
            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <button onClick={dismissForever} className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors underline">
                Ne plus afficher
              </button>
              <a href="/docs" target="_blank" className="text-[11px] text-sky-500 hover:text-sky-600 transition-colors flex items-center gap-1">
                Centre d'aide <ChevronRight size={11}/>
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// 'use client';

// // ============================================================================
// // 📁 components/onboarding/OnboardingChecklist.tsx
// //
// // Logique de persistance :
// //   - La progression est sauvegardée dans localStorage (clé: onboarding_v1_[companyId])
// //   - Chaque étape est vérifiée via l'API (réelle, pas juste un clic)
// //   - Si l'admin s'arrête en route → la bannière reste avec sa progression
// //   - Disparaît définitivement une fois toutes les étapes validées
// //   - Bouton "Masquer pour l'instant" → réapparaît au prochain login
// //   - Bouton "Ne plus afficher" → supprimé définitivement
// // ============================================================================

// import React, { useState, useEffect, useCallback } from 'react';
// import { useRouter } from 'next/navigation';
// import {
//   CheckCircle2, Circle, ChevronRight, X, Sparkles,
//   Building2, Users, CreditCard, Clock, ArrowRight,
//   Loader2, ChevronDown, ChevronUp,
// } from 'lucide-react';
// import { api } from '@/services/api';

// // ─── Types ────────────────────────────────────────────────────────────────────
// interface StepStatus {
//   done: boolean;
//   loading: boolean;
// }

// interface OnboardingState {
//   dismissed: boolean;       // "Ne plus afficher"
//   hiddenUntilLogin: boolean; // "Masquer pour l'instant"
//   completedAt?: string;     // Date de complétion
// }

// // ─── Constantes ───────────────────────────────────────────────────────────────
// const STORAGE_KEY_PREFIX = 'konza_onboarding_v1_';

// function getStorageKey(companyId: string) {
//   return `${STORAGE_KEY_PREFIX}${companyId}`;
// }

// // ─── Step Check Icon ──────────────────────────────────────────────────────────
// function StepIcon({ done, loading, index }: { done: boolean; loading: boolean; index: number }) {
//   if (loading) {
//     return (
//       <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center flex-shrink-0">
//         <Loader2 size={14} className="animate-spin text-sky-500" />
//       </div>
//     );
//   }
//   if (done) {
//     return (
//       <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0 animate-[pop_0.3s_ease]">
//         <CheckCircle2 size={16} className="text-emerald-500" />
//       </div>
//     );
//   }
//   return (
//     <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center flex-shrink-0">
//       <span className="text-xs font-bold text-gray-400">{index + 1}</span>
//     </div>
//   );
// }

// // ─── Main Component ───────────────────────────────────────────────────────────
// export default function OnboardingChecklist() {
//   const router = useRouter();

//   const [companyId, setCompanyId] = useState<string | null>(null);
//   const [userRole, setUserRole] = useState<string>('');
//   const [userName, setUserName] = useState<string>('');
//   const [visible, setVisible] = useState(false);
//   const [collapsed, setCollapsed] = useState(false);
//   const [initialLoad, setInitialLoad] = useState(true);

//   // Statuts des étapes
//   const [steps, setSteps] = useState<StepStatus[]>([
//     { done: false, loading: true },  // 0 - Entreprise
//     { done: false, loading: true },  // 1 - Département
//     { done: false, loading: true },  // 2 - Employé
//     { done: false, loading: true },  // 3 - Présence (pointage manuel)
//     { done: false, loading: true },  // 4 - Paie
//   ]);

//   const [allDone, setAllDone] = useState(false);
//   const [celebrating, setCelebrating] = useState(false);

//   // ─── Init : charger user + vérifier si doit s'afficher ──────────────────
//   useEffect(() => {
//     const init = async () => {
//       try {
//         // Récupérer l'utilisateur
//         const stored = localStorage.getItem('user');
//         if (!stored) return;
//         const u = JSON.parse(stored);
//         setUserName(u.firstName || '');
//         setUserRole(u.role || '');

//         // Seuls ADMIN, HR_MANAGER, SUPER_ADMIN voient l'onboarding
//         if (!['ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'].includes(u.role)) return;

//         // Récupérer companyId
//         const meRes: any = await api.get('/auth/me');
//         const cId = meRes?.companyId;
//         if (!cId) return;
//         setCompanyId(cId);

//         // Vérifier l'état sauvegardé
//         const key = getStorageKey(cId);
//         const savedRaw = localStorage.getItem(key);
//         const saved: OnboardingState = savedRaw
//           ? JSON.parse(savedRaw)
//           : { dismissed: false, hiddenUntilLogin: false };

//         // Définitivement masqué
//         if (saved.dismissed) return;

//         // Masqué pour cette session
//         if (saved.hiddenUntilLogin) {
//           // Réinitialiser le flag "masqué" au prochain chargement
//           localStorage.setItem(key, JSON.stringify({ ...saved, hiddenUntilLogin: false }));
//           return;
//         }

//         // Vérifier les étapes via API
//         await checkAllSteps(cId);
//         setVisible(true);

//       } catch (e) {
//         console.warn('Onboarding init error:', e);
//       } finally {
//         setInitialLoad(false);
//       }
//     };

//     init();
//   }, []);

//   // ─── Vérifier toutes les étapes via API ──────────────────────────────────
//   const checkAllSteps = useCallback(async (cId: string) => {
//     // Lancer toutes les vérifications en parallèle
//     const checks = await Promise.allSettled([
//       checkEntreprise(cId),
//       checkDepartement(cId),
//       checkEmploye(cId),
//       checkPresence(cId),
//       checkPaie(cId),
//     ]);

//     const newSteps = checks.map(result => ({
//       done: result.status === 'fulfilled' ? result.value : false,
//       loading: false,
//     }));

//     setSteps(newSteps);

//     const allCompleted = newSteps.every(s => s.done);
//     if (allCompleted) {
//       setAllDone(true);
//       setCelebrating(true);
//       // Sauvegarder la complétion
//       if (cId) {
//         const key = getStorageKey(cId);
//         const saved = JSON.parse(localStorage.getItem(key) || '{}');
//         localStorage.setItem(key, JSON.stringify({
//           ...saved,
//           completedAt: new Date().toISOString(),
//         }));
//       }
//       // Masquer après animation de célébration
//       setTimeout(() => setVisible(false), 4000);
//     }

//     return newSteps;
//   }, []);

//   // ─── Checks individuels ───────────────────────────────────────────────────
//   async function checkEntreprise(cId: string): Promise<boolean> {
//     try {
//       const res: any = await api.get('/company/profile');
//       return !!(res?.name && res?.name.trim() !== '');
//     } catch { return false; }
//   }

//   async function checkDepartement(cId: string): Promise<boolean> {
//     try {
//       const res: any = await api.get('/departments');
//       const arr = Array.isArray(res) ? res : res?.departments || [];
//       return arr.length > 0;
//     } catch { return false; }
//   }

//   async function checkEmploye(cId: string): Promise<boolean> {
//     try {
//       const res: any = await api.get('/employees?limit=1&status=ACTIVE');
//       const arr = Array.isArray(res) ? res : res?.employees || res?.data || [];
//       return arr.length > 0;
//     } catch { return false; }
//   }

//   async function checkPresence(cId: string): Promise<boolean> {
//     try {
//       const now = new Date();
//       const month = now.getMonth() + 1;
//       const year = now.getFullYear();
//       const res: any = await api.get(`/attendance?month=${month}&year=${year}`);
//       const atts = res?.attendances || [];
//       return atts.some((a: any) =>
//         a.status === 'PRESENT' || a.status === 'LATE' || a.checkIn
//       );
//     } catch { return false; }
//   }

//   async function checkPaie(cId: string): Promise<boolean> {
//     try {
//       const res: any = await api.get('/payroll?limit=1');
//       const arr = Array.isArray(res) ? res : res?.payslips || res?.data || [];
//       return arr.length > 0;
//     } catch { return false; }
//   }

//   // ─── Rafraîchir une étape après action ───────────────────────────────────
//   const refreshStep = async (index: number) => {
//     if (!companyId) return;
//     setSteps(prev => prev.map((s, i) => i === index ? { ...s, loading: true } : s));

//     const checkers = [checkEntreprise, checkDepartement, checkEmploye, checkPresence, checkPaie];
//     const done = await checkers[index](companyId).catch(() => false);

//     setSteps(prev => {
//       const next = prev.map((s, i) => i === index ? { done, loading: false } : s);
//       if (next.every(s => s.done)) {
//         setAllDone(true);
//         setCelebrating(true);
//         setTimeout(() => setVisible(false), 4000);
//       }
//       return next;
//     });
//   };

//   // ─── Actions dismiss ──────────────────────────────────────────────────────
//   const dismissForever = () => {
//     if (!companyId) return;
//     const key = getStorageKey(companyId);
//     localStorage.setItem(key, JSON.stringify({ dismissed: true }));
//     setVisible(false);
//   };

//   const hideForNow = () => {
//     if (!companyId) return;
//     const key = getStorageKey(companyId);
//     const saved = JSON.parse(localStorage.getItem(key) || '{}');
//     localStorage.setItem(key, JSON.stringify({ ...saved, hiddenUntilLogin: true }));
//     setVisible(false);
//   };

//   // ─── Config des étapes ────────────────────────────────────────────────────
//   const STEPS_CONFIG = [
//     {
//       icon: Building2,
//       iconColor: 'text-blue-500',
//       iconBg: 'bg-blue-100 dark:bg-blue-900/30',
//       title: 'Configurez votre entreprise',
//       desc: 'Nom légal, RCCM, logo et adresse — apparaissent sur vos bulletins de paie.',
//       cta: 'Configurer',
//       href: '/settings?tab=company',
//     },
//     {
//       icon: Users,
//       iconColor: 'text-violet-500',
//       iconBg: 'bg-violet-100 dark:bg-violet-900/30',
//       title: 'Créez votre premier département',
//       desc: 'Organisez votre structure (DRH, Finance, Terrain…) avant d\'ajouter des employés.',
//       cta: 'Créer',
//       href: '/settings?tab=departments',
//     },
//     {
//       icon: Users,
//       iconColor: 'text-sky-500',
//       iconBg: 'bg-sky-100 dark:bg-sky-900/30',
//       title: 'Ajoutez votre premier employé',
//       desc: 'Créez un dossier employé avec son contrat et son salaire de base.',
//       cta: 'Ajouter',
//       href: '/employes/nouveau',
//     },
//     {
//       icon: Clock,
//       iconColor: 'text-amber-500',
//       iconBg: 'bg-amber-100 dark:bg-amber-900/30',
//       title: 'Simulez un pointage',
//       desc: 'Un bulletin de paie nécessite des présences. Enregistrez une présence manuelle pour cet employé.',
//       cta: 'Pointer manuellement',
//       href: '/presences/pointage-manuel',
//       hint: '💡 Allez dans Présences → Pointage Manuel → sélectionnez l\'employé → saisissez une date et heure.',
//     },
//     {
//       icon: CreditCard,
//       iconColor: 'text-emerald-500',
//       iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
//       title: 'Générez votre premier bulletin',
//       desc: 'Paie → Nouveau bulletin → sélectionnez l\'employé → vérifiez et confirmez.',
//       cta: 'Générer',
//       href: '/paie',
//     },
//   ];

//   const completedCount = steps.filter(s => s.done).length;
//   const progress = Math.round((completedCount / steps.length) * 100);

//   // Trouver l'étape active (première non-complétée)
//   const activeIndex = steps.findIndex(s => !s.done && !s.loading);

//   if (!visible || initialLoad) return null;

//   // ─── Écran célébration ────────────────────────────────────────────────────
//   if (celebrating) {
//     return (
//       <div className="mx-4 sm:mx-6 mb-4 animate-[fadeInUp_0.4s_ease]">
//         <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white shadow-lg shadow-emerald-500/20">
//           {/* Confetti dots */}
//           {[...Array(12)].map((_, i) => (
//             <div
//               key={i}
//               className="absolute w-2 h-2 rounded-full opacity-60 animate-[float_2s_ease-in-out_infinite]"
//               style={{
//                 backgroundColor: ['#fff', '#fde68a', '#a7f3d0', '#bfdbfe'][i % 4],
//                 left: `${8 + i * 8}%`,
//                 top: `${10 + (i % 3) * 30}%`,
//                 animationDelay: `${i * 0.15}s`,
//               }}
//             />
//           ))}
//           <div className="relative z-10 flex items-center gap-4">
//             <div className="text-4xl animate-[bounce_1s_ease_3]">🎉</div>
//             <div>
//               <h3 className="font-black text-lg">Configuration terminée !</h3>
//               <p className="text-emerald-100 text-sm mt-0.5">
//                 Votre espace Konza RH est prêt. Vous pouvez maintenant gérer toute votre équipe.
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // ─── Bannière principale ──────────────────────────────────────────────────
//   return (
//     <>
//       <style>{`
//         @keyframes fadeInUp {
//           from { opacity: 0; transform: translateY(12px); }
//           to { opacity: 1; transform: translateY(0); }
//         }
//         @keyframes pop {
//           0% { transform: scale(0.8); }
//           60% { transform: scale(1.15); }
//           100% { transform: scale(1); }
//         }
//         @keyframes float {
//           0%, 100% { transform: translateY(0px); }
//           50% { transform: translateY(-6px); }
//         }
//         @keyframes shimmer {
//           0% { background-position: -200% center; }
//           100% { background-position: 200% center; }
//         }
//         .progress-bar {
//           transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
//         }
//         .step-row {
//           transition: all 0.2s ease;
//         }
//         .step-row:hover {
//           background: rgba(0,0,0,0.02);
//         }
//         .dark .step-row:hover {
//           background: rgba(255,255,255,0.03);
//         }
//       `}</style>

//       <div className="mx-4 sm:mx-6 mb-4 animate-[fadeInUp_0.4s_ease]">
//         <div className="rounded-2xl border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">

//           {/* ── Header ── */}
//           <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
//             <div className="flex items-center gap-3">
//               <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center flex-shrink-0">
//                 <Sparkles size={15} className="text-white" />
//               </div>
//               <div>
//                 <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
//                   {userName ? `Bienvenue ${userName} 👋` : 'Bienvenue 👋'}
//                   <span className="px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 text-[10px] font-bold">
//                     {completedCount}/{steps.length} étapes
//                   </span>
//                 </h3>
//                 <p className="text-xs text-gray-500 mt-0.5">Configurez votre espace en 5 étapes simples</p>
//               </div>
//             </div>

//             <div className="flex items-center gap-1">
//               {/* Collapse toggle */}
//               <button
//                 onClick={() => setCollapsed(c => !c)}
//                 className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors"
//                 title={collapsed ? 'Afficher' : 'Réduire'}
//               >
//                 {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
//               </button>
//               {/* Masquer pour l'instant */}
//               <button
//                 onClick={hideForNow}
//                 className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors"
//                 title="Masquer pour l'instant"
//               >
//                 <X size={16} />
//               </button>
//             </div>
//           </div>

//           {/* ── Barre de progression (toujours visible) ── */}
//           <div className="px-5 pt-3 pb-1">
//             <div className="flex items-center justify-between mb-1.5">
//               <span className="text-[11px] text-gray-400 font-medium">
//                 {progress === 100 ? '✅ Tout est prêt !' : `${progress}% complété`}
//               </span>
//               <span className="text-[11px] text-gray-400">{completedCount} sur {steps.length}</span>
//             </div>
//             <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
//               <div
//                 className="progress-bar h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500"
//                 style={{ width: `${progress}%` }}
//               />
//             </div>
//           </div>

//           {/* ── Étapes (collapsible) ── */}
//           {!collapsed && (
//             <div className="px-3 py-2">
//               {STEPS_CONFIG.map((cfg, i) => {
//                 const step = steps[i];
//                 const Icon = cfg.icon;
//                 const isActive = i === activeIndex;
//                 const isPending = !step.done && i < activeIndex;

//                 return (
//                   <div
//                     key={i}
//                     className={`step-row flex items-start gap-3 px-3 py-3 rounded-xl transition-all ${
//                       isActive && !step.done
//                         ? 'bg-sky-50/70 dark:bg-sky-900/10 border border-sky-200/60 dark:border-sky-800/40'
//                         : ''
//                     }`}
//                   >
//                     {/* Icône statut */}
//                     <StepIcon done={step.done} loading={step.loading} index={i} />

//                     {/* Contenu */}
//                     <div className="flex-1 min-w-0">
//                       <div className="flex items-center gap-2 flex-wrap">
//                         <p className={`text-sm font-semibold ${
//                           step.done
//                             ? 'text-gray-400 dark:text-gray-600 line-through'
//                             : 'text-gray-800 dark:text-gray-100'
//                         }`}>
//                           {cfg.title}
//                         </p>
//                         {isActive && !step.done && (
//                           <span className="text-[10px] font-bold px-1.5 py-0.5 bg-sky-500 text-white rounded-full animate-pulse">
//                             Maintenant
//                           </span>
//                         )}
//                       </div>

//                       {!step.done && (
//                         <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{cfg.desc}</p>
//                       )}

//                       {/* Hint spécial pour le pointage */}
//                       {!step.done && cfg.hint && isActive && (
//                         <div className="mt-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800/40 rounded-lg">
//                           <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">{cfg.hint}</p>
//                         </div>
//                       )}

//                       {/* Bouton CTA — seulement pour l'étape active ou les suivantes */}
//                       {!step.done && !step.loading && (
//                         <div className="flex items-center gap-2 mt-2">
//                           <button
//                             onClick={() => {
//                               router.push(cfg.href);
//                               // Vérification auto au retour via focus
//                               const onFocus = () => {
//                                 refreshStep(i);
//                                 window.removeEventListener('focus', onFocus);
//                               };
//                               window.addEventListener('focus', onFocus);
//                             }}
//                             className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
//                               isActive
//                                 ? 'bg-sky-500 hover:bg-sky-600 text-white shadow-sm shadow-sky-500/30 hover:-translate-y-0.5'
//                                 : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
//                             }`}
//                           >
//                             {cfg.cta}
//                             <ArrowRight size={11} />
//                           </button>
//                           {/* Bouton rafraîchir si l'étape a été faite hors app */}
//                           <button
//                             onClick={() => refreshStep(i)}
//                             className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline transition-colors"
//                           >
//                             Déjà fait ?
//                           </button>
//                         </div>
//                       )}
//                     </div>

//                     {/* Check animé si done */}
//                     {step.done && (
//                       <div className="flex-shrink-0 text-emerald-400">
//                         <CheckCircle2 size={16} />
//                       </div>
//                     )}
//                   </div>
//                 );
//               })}
//             </div>
//           )}

//           {/* ── Footer ── */}
//           {!collapsed && (
//             <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
//               <button
//                 onClick={dismissForever}
//                 className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors underline"
//               >
//                 Ne plus afficher
//               </button>
//               <a
//                 href="/docs"
//                 target="_blank"
//                 className="text-[11px] text-sky-500 hover:text-sky-600 transition-colors flex items-center gap-1"
//               >
//                 Centre d'aide <ChevronRight size={11} />
//               </a>
//             </div>
//           )}

//         </div>
//       </div>
//     </>
//   );
// }