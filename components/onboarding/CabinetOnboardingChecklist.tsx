'use client';

// ============================================================================
// 📁 components/onboarding/CabinetOnboardingChecklist.tsx
//
// Flow cabinet en 2 niveaux :
//   NIVEAU 1 — Cabinet lui-même (1 seule fois)
//     ① Paramètres du cabinet (nom, logo)
//     ② Ajouter un gestionnaire (optionnel mais recommandé)
//
//   NIVEAU 2 — Première PME (guidé pas à pas)
//     ③ Créer la première PME
//     ④ Configurer cette PME (infos légales + département)
//     ⑤ Ajouter un employé dans cette PME
//     ⑥ Générer la première paie de cette PME
//
// Persistance : localStorage par cabinetId
// Disparaît : quand toutes les étapes sont validées (célébration 4s)
// Options : "Réduire" (chevron) / "Masquer" (X) / "Ne plus afficher"
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  CheckCircle2, ChevronRight, X, Sparkles,
  Building2, Users, CreditCard, Settings,
  ArrowRight, Loader2, ChevronDown, ChevronUp,
  UserPlus, Briefcase,
} from 'lucide-react';
import { api } from '@/services/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface StepStatus {
  done: boolean;
  loading: boolean;
}

interface CabinetOnboardingState {
  dismissed: boolean;
  hiddenUntilLogin: boolean;
  completedAt?: string;
}

const STORAGE_KEY_PREFIX = 'konza_cabinet_onboarding_v1_';

function getStorageKey(cabinetId: string) {
  return `${STORAGE_KEY_PREFIX}${cabinetId}`;
}

// ─── Step Icon ────────────────────────────────────────────────────────────────
function StepIcon({ done, loading, index }: { done: boolean; loading: boolean; index: number }) {
  if (loading) {
    return (
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(99,102,241,0.12)' }}>
        <Loader2 size={14} className="animate-spin" style={{ color: '#6366f1' }} />
      </div>
    );
  }
  if (done) {
    return (
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 animate-[pop_0.3s_ease]"
        style={{ background: 'rgba(16,185,129,0.12)' }}>
        <CheckCircle2 size={16} style={{ color: '#10b981' }} />
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.12)' }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>{index + 1}</span>
    </div>
  );
}

// ─── Séparateur de section ────────────────────────────────────────────────────
function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
      <span style={{ fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
    </div>
  );
}

// ─── Config des étapes ────────────────────────────────────────────────────────
function getStepsConfig(cabinetId: string, firstCompanyId: string | null) {
  return [
    // ── NIVEAU 1 : Cabinet ──
    {
      section: 'Votre cabinet',
      icon: Settings,
      iconColor: '#6366f1',
      title: 'Configurez votre cabinet',
      desc: 'Nom, logo et informations qui apparaîtront sur vos documents.',
      cta: 'Configurer',
      href: `/cabinet/${cabinetId}/parametres`,
    },
    {
      section: null, // même section que précédent
      icon: UserPlus,
      iconColor: '#8b5cf6',
      title: 'Invitez un gestionnaire',
      desc: 'Ajoutez un collaborateur pour co-gérer vos PME clientes.',
      cta: 'Inviter',
      href: `/cabinet/${cabinetId}/gestionnaires`,
      optional: true,
    },
    // ── NIVEAU 2 : Première PME ──
    {
      section: 'Votre première PME',
      icon: Building2,
      iconColor: '#0ea5e9',
      title: 'Créez votre première PME cliente',
      desc: 'Ajoutez une entreprise à gérer — elle aura son propre espace isolé.',
      cta: 'Créer une PME',
      href: `/cabinet/${cabinetId}/ajouter-pme`,
    },
    {
      section: null,
      icon: Briefcase,
      iconColor: '#f59e0b',
      title: 'Configurez la PME',
      desc: 'Infos légales (RCCM, adresse) et premier département.',
      cta: 'Configurer',
      href: firstCompanyId
        ? `/cabinet/${cabinetId}/entreprise/${firstCompanyId}/parametres`
        : `/cabinet/${cabinetId}/mes-pme`,
      hint: firstCompanyId
        ? null
        : '⚠️ Créez d\'abord une PME pour accéder à ses paramètres.',
    },
    {
      section: null,
      icon: Users,
      iconColor: '#10b981',
      title: 'Ajoutez des employés à la PME',
      desc: 'Créez les dossiers employés avec contrat et salaire de base.',
      cta: 'Ajouter',
      href: firstCompanyId
        ? `/cabinet/${cabinetId}/entreprise/${firstCompanyId}/employes`
        : `/cabinet/${cabinetId}/mes-pme`,
    },
    {
      section: null,
      icon: CreditCard,
      iconColor: '#06b6d4',
      title: 'Générez la première paie',
      desc: 'Saisie des variables, calcul automatique CNSS/ITS, bulletin PDF.',
      cta: 'Générer',
      href: firstCompanyId
        ? `/cabinet/${cabinetId}/entreprise/${firstCompanyId}/bulletins`
        : `/cabinet/${cabinetId}/mes-pme`,
    },
  ];
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CabinetOnboardingChecklist() {
  const router = useRouter();
  const params = useParams();
  const cabinetId = params.cabinetId as string;

  const [visible, setVisible] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [userName, setUserName] = useState('');
  const [firstCompanyId, setFirstCompanyId] = useState<string | null>(null);
  const [celebrating, setCelebrating] = useState(false);

  const [steps, setSteps] = useState<StepStatus[]>([
    { done: false, loading: true },  // 0 - Paramètres cabinet
    { done: false, loading: true },  // 1 - Gestionnaire (optionnel)
    { done: false, loading: true },  // 2 - Première PME créée
    { done: false, loading: true },  // 3 - PME configurée
    { done: false, loading: true },  // 4 - Employé ajouté
    { done: false, loading: true },  // 5 - Paie générée
  ]);

  // ─── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!cabinetId) return;

    const init = async () => {
      // User info
      try {
        const stored = localStorage.getItem('user');
        if (stored) {
          const u = JSON.parse(stored);
          setUserName(u.firstName || '');
          // Seul CABINET_ADMIN voit l'onboarding
          if (u.role !== 'CABINET_ADMIN') return;
        }
      } catch {}

      // Vérifier état sauvegardé
      const key = getStorageKey(cabinetId);
      const savedRaw = localStorage.getItem(key);
      const saved: CabinetOnboardingState = savedRaw
        ? JSON.parse(savedRaw)
        : { dismissed: false, hiddenUntilLogin: false };

      if (saved.dismissed) return;
      if (saved.hiddenUntilLogin) {
        localStorage.setItem(key, JSON.stringify({ ...saved, hiddenUntilLogin: false }));
        return;
      }

      // Charger la première PME d'abord
      let firstCId: string | null = null;
      try {
        const dash: any = await api.get(`/cabinet/${cabinetId}/dashboard`);
        const companies = dash?.companies || [];
        if (companies.length > 0) {
          firstCId = companies[0].companyId;
          setFirstCompanyId(firstCId);
        }
      } catch {}

      // Vérifier toutes les étapes
      await checkAllSteps(cabinetId, firstCId);
      setVisible(true);
    };

    init();
  }, [cabinetId]);

  // ─── Checks ────────────────────────────────────────────────────────────────
  const checkAllSteps = useCallback(async (cId: string, firstCId: string | null) => {
    const results = await Promise.allSettled([
      checkCabinetConfig(cId),
      checkGestionnaire(cId),
      checkPmeCreee(cId),
      checkPmeConfiguree(firstCId),
      checkEmploye(firstCId),
      checkPaie(cId, firstCId),
    ]);

    const newSteps = results.map(r => ({
      done: r.status === 'fulfilled' ? r.value : false,
      loading: false,
    }));

    setSteps(newSteps);

    // Ignorer l'étape optionnelle (index 1) pour la détection "tout complété"
    const requiredDone = newSteps.filter((s, i) => i !== 1).every(s => s.done);
    if (requiredDone) {
      setAllDoneFlow(cId);
    }

    return newSteps;
  }, []);

  function setAllDoneFlow(cId: string) {
    setCelebrating(true);
    const key = getStorageKey(cId);
    const saved = JSON.parse(localStorage.getItem(key) || '{}');
    localStorage.setItem(key, JSON.stringify({ ...saved, completedAt: new Date().toISOString() }));
    setTimeout(() => setVisible(false), 4000);
  }

  async function checkCabinetConfig(cId: string): Promise<boolean> {
    try {
      const res: any = await api.get(`/cabinet/${cId}/profile`);
      return !!(res?.name && res.name.trim() !== '');
    } catch { return false; }
  }

  async function checkGestionnaire(cId: string): Promise<boolean> {
    try {
      const res: any = await api.get(`/cabinet/${cId}/gestionnaires`);
      const arr = Array.isArray(res) ? res : res?.gestionnaires || [];
      return arr.length > 0;
    } catch { return false; }
  }

  async function checkPmeCreee(cId: string): Promise<boolean> {
    try {
      const dash: any = await api.get(`/cabinet/${cId}/dashboard`);
      return (dash?.companies?.length || 0) > 0;
    } catch { return false; }
  }

  async function checkPmeConfiguree(firstCId: string | null): Promise<boolean> {
    if (!firstCId) return false;
    try {
      const [company, depts]: any[] = await Promise.all([
        api.get(`/companies/${firstCId}`),
        api.get(`/departments?companyId=${firstCId}`),
      ]);
      const deptsArr = Array.isArray(depts) ? depts : depts?.data || [];
      return !!(company?.name && deptsArr.length > 0);
    } catch { return false; }
  }

  async function checkEmploye(firstCId: string | null): Promise<boolean> {
    if (!firstCId) return false;
    try {
      const res: any = await api.get(`/employees?companyId=${firstCId}&status=ACTIVE&limit=1`);
      const arr = Array.isArray(res) ? res : res?.data || res?.employees || [];
      return arr.length > 0;
    } catch { return false; }
  }

  async function checkPaie(cId: string, firstCId: string | null): Promise<boolean> {
    if (!firstCId) return false;
    try {
      const res: any = await api.get(`/payroll?companyId=${firstCId}&limit=1`);
      const arr = Array.isArray(res) ? res : res?.payslips || res?.data || [];
      return arr.length > 0;
    } catch { return false; }
  }

  // ─── Refresh une étape ─────────────────────────────────────────────────────
  const refreshStep = async (index: number) => {
    if (!cabinetId) return;
    setSteps(prev => prev.map((s, i) => i === index ? { ...s, loading: true } : s));

    const checkers = [
      () => checkCabinetConfig(cabinetId),
      () => checkGestionnaire(cabinetId),
      () => checkPmeCreee(cabinetId),
      () => checkPmeConfiguree(firstCompanyId),
      () => checkEmploye(firstCompanyId),
      () => checkPaie(cabinetId, firstCompanyId),
    ];

    const done = await checkers[index]().catch(() => false);

    setSteps(prev => {
      const next = prev.map((s, i) => i === index ? { done, loading: false } : s);
      const requiredDone = next.filter((s, i) => i !== 1).every(s => s.done);
      if (requiredDone) setAllDoneFlow(cabinetId);
      return next;
    });
  };

  // ─── Dismiss ───────────────────────────────────────────────────────────────
  const dismissForever = () => {
    const key = getStorageKey(cabinetId);
    localStorage.setItem(key, JSON.stringify({ dismissed: true }));
    setVisible(false);
  };

  const hideForNow = () => {
    const key = getStorageKey(cabinetId);
    const saved = JSON.parse(localStorage.getItem(key) || '{}');
    localStorage.setItem(key, JSON.stringify({ ...saved, hiddenUntilLogin: true }));
    setVisible(false);
  };

  // ─── Calculs affichage ──────────────────────────────────────────────────────
  const stepsConfig = getStepsConfig(cabinetId, firstCompanyId);
  const completedCount = steps.filter((s, i) => s.done).length;
  // Pour la progression : on compte les required (hors optional index 1)
  const requiredSteps = steps.filter((_, i) => i !== 1);
  const requiredDone = requiredSteps.filter(s => s.done).length;
  const progress = Math.round((requiredDone / requiredSteps.length) * 100);
  const activeIndex = steps.findIndex(s => !s.done && !s.loading);

  if (!visible) return null;

  // ─── Célébration ──────────────────────────────────────────────────────────
  if (celebrating) {
    return (
      <div style={{ margin: '0 0 16px 0', animation: 'fadeInUp 0.4s ease' }}>
        <div style={{
          borderRadius: 20,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4)',
          padding: '20px 24px',
          display: 'flex', alignItems: 'center', gap: 16,
          boxShadow: '0 8px 32px rgba(99,102,241,0.3)',
          position: 'relative', overflow: 'hidden',
        }}>
          {[...Array(10)].map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              width: 6, height: 6, borderRadius: '50%',
              background: ['#fff', '#fde68a', '#a7f3d0', '#bfdbfe'][i % 4],
              opacity: 0.5,
              left: `${10 + i * 9}%`,
              top: `${15 + (i % 3) * 28}%`,
              animation: `float ${1.5 + i * 0.2}s ease-in-out infinite`,
              animationDelay: `${i * 0.12}s`,
            }} />
          ))}
          <div style={{ fontSize: 36 }}>🎉</div>
          <div>
            <p style={{ color: '#fff', fontWeight: 800, fontSize: 16, margin: 0 }}>
              Cabinet configuré avec succès !
            </p>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, margin: '4px 0 0' }}>
              Vous pouvez maintenant gérer toutes vos PME clientes depuis votre tableau de bord.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Rendu principal ───────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pop {
          0% { transform: scale(0.8); }
          60% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .cab-step:hover { background: rgba(255,255,255,0.025); }
        .cab-step-active { background: rgba(99,102,241,0.07) !important; border: 1px solid rgba(99,102,241,0.2) !important; }
        .progress-bar { transition: width 0.6s cubic-bezier(0.4,0,0.2,1); }
        .cab-cta-primary:hover { opacity: 0.9; transform: translateY(-1px); }
        .cab-cta-secondary:hover { background: rgba(255,255,255,0.08) !important; }
      `}</style>

      <div style={{ marginBottom: 16, animation: 'fadeInUp 0.4s ease' }}>
        <div style={{
          borderRadius: 18,
          background: '#151e30',
          border: '1px solid rgba(255,255,255,0.07)',
          overflow: 'hidden',
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        }}>

          {/* ── Header ── */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Sparkles size={15} color="#fff" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>
                    {userName ? `Bienvenue ${userName} 👋` : 'Bienvenue 👋'}
                  </h3>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                    background: 'rgba(99,102,241,0.15)', color: '#818cf8',
                  }}>
                    {completedCount}/{steps.length} étapes
                  </span>
                </div>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                  Configurez votre cabinet en quelques étapes
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => setCollapsed(c => !c)} style={{
                width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer',
                background: 'rgba(255,255,255,0.05)', color: '#64748b',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {collapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
              </button>
              <button onClick={hideForNow} style={{
                width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer',
                background: 'rgba(255,255,255,0.05)', color: '#64748b',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <X size={15} />
              </button>
            </div>
          </div>

          {/* ── Barre de progression ── */}
          <div style={{ padding: '12px 20px 8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: '#64748b' }}>
                {progress === 100 ? '✅ Cabinet prêt !' : `${progress}% complété`}
              </span>
              <span style={{ fontSize: 11, color: '#64748b' }}>
                {requiredDone}/{requiredSteps.length} étapes principales
              </span>
            </div>
            <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.06)' }}>
              <div className="progress-bar" style={{
                height: '100%', borderRadius: 99, width: `${progress}%`,
                background: 'linear-gradient(90deg, #6366f1, #06b6d4)',
              }} />
            </div>
          </div>

          {/* ── Étapes ── */}
          {!collapsed && (
            <div style={{ padding: '4px 8px 8px' }}>
              {stepsConfig.map((cfg, i) => {
                const step = steps[i];
                const Icon = cfg.icon;
                const isActive = i === activeIndex;
                const isOptional = (cfg as any).optional === true;

                return (
                  <React.Fragment key={i}>
                    {/* Séparateur de section */}
                    {cfg.section && (
                      <SectionDivider label={cfg.section} />
                    )}

                    <div
                      className={`cab-step ${isActive && !step.done ? 'cab-step-active' : ''}`}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 12,
                        padding: '10px 12px', borderRadius: 12,
                        marginBottom: 2, border: '1px solid transparent',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {/* Icône statut */}
                      <StepIcon done={step.done} loading={step.loading} index={i} />

                      {/* Contenu */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <p style={{
                            margin: 0, fontSize: 13, fontWeight: 600,
                            color: step.done ? '#475569' : '#e2e8f0',
                            textDecoration: step.done ? 'line-through' : 'none',
                          }}>
                            {cfg.title}
                          </p>
                          {isOptional && (
                            <span style={{
                              fontSize: 9, fontWeight: 700, padding: '1px 6px',
                              borderRadius: 999, background: 'rgba(255,255,255,0.07)',
                              color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em',
                            }}>
                              Optionnel
                            </span>
                          )}
                          {isActive && !step.done && (
                            <span style={{
                              fontSize: 9, fontWeight: 700, padding: '2px 7px',
                              borderRadius: 999, background: '#6366f1',
                              color: '#fff', animation: 'none',
                            }}>
                              ← Maintenant
                            </span>
                          )}
                        </div>

                        {!step.done && (
                          <p style={{ margin: '3px 0 0', fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
                            {cfg.desc}
                          </p>
                        )}

                        {/* Hint */}
                        {!step.done && (cfg as any).hint && (
                          <div style={{
                            marginTop: 8, padding: '8px 12px',
                            background: 'rgba(245,158,11,0.08)',
                            border: '1px solid rgba(245,158,11,0.2)',
                            borderRadius: 8,
                          }}>
                            <p style={{ margin: 0, fontSize: 11, color: '#f59e0b', lineHeight: 1.5 }}>
                              {(cfg as any).hint}
                            </p>
                          </div>
                        )}

                        {/* CTA */}
                        {!step.done && !step.loading && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                            <button
                              className="cab-cta-primary"
                              onClick={() => {
                                router.push(cfg.href);
                                const onFocus = () => { refreshStep(i); window.removeEventListener('focus', onFocus); };
                                window.addEventListener('focus', onFocus);
                              }}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                                fontSize: 12, fontWeight: 700,
                                background: isActive ? '#6366f1' : 'rgba(255,255,255,0.07)',
                                color: isActive ? '#fff' : '#94a3b8',
                                transition: 'all 0.15s ease',
                                boxShadow: isActive ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
                              }}
                            >
                              {cfg.cta}
                              <ArrowRight size={11} />
                            </button>
                            <button
                              className="cab-cta-secondary"
                              onClick={() => refreshStep(i)}
                              style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                fontSize: 11, color: '#475569',
                                textDecoration: 'underline', padding: '4px 2px',
                              }}
                            >
                              Déjà fait ?
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Check si done */}
                      {step.done && (
                        <CheckCircle2 size={15} style={{ color: '#10b981', flexShrink: 0, marginTop: 2 }} />
                      )}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          )}

          {/* ── Footer ── */}
          {!collapsed && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 20px',
              borderTop: '1px solid rgba(255,255,255,0.05)',
            }}>
              <button onClick={dismissForever} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 11, color: '#475569', textDecoration: 'underline',
              }}>
                Ne plus afficher
              </button>
              <a href="/docs" target="_blank" style={{
                fontSize: 11, color: '#6366f1', textDecoration: 'none',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                Centre d'aide <ChevronRight size={11} />
              </a>
            </div>
          )}

        </div>
      </div>
    </>
  );
}