'use client';

// ============================================================================
// 💳 PAGE ABONNEMENT - AVEC MODAL PAYMENT INTENT (Mobile Money)
// ============================================================================
// Fichier: app/(dashboard)/parametres/subscription/page.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Crown, ChevronLeft, CheckCircle, XCircle, Calendar, CreditCard,
  TrendingUp, Users, Briefcase, Building2, ArrowUpRight, Loader2,
  AlertTriangle, Sparkles, Receipt, Info, Shield, X, Phone, ChevronDown,
  LayoutList, LayoutGrid, Star,
} from 'lucide-react';
import { api } from '@/services/api';
import { MotekiCheckoutModal } from '@/components/payment/MotekiCheckoutModal';
import { ChariowCheckoutModal } from '@/components/payment/ChariowCheckoutModal';
import { YabetooCheckoutModal, type PaymentIntent } from '@/components/payment/YabetooCheckoutModal';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Subscription {
  id: string;
  plan: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';
  status: 'ACTIVE' | 'TRIALING' | 'CANCELED' | 'PAST_DUE' | 'PAUSED';
  currentPeriodEnd: string;
  trialEndsAt?: string;
  pricePerMonth: number;
  currency: string;
  planDetails?: {
    name: string;
    limits: {
      maxEmployees: number;
      maxUsers: number;
      maxDepartments: number;
      maxJobOffers: number;
    };
  };
  payments?: Payment[];
}

interface Payment {
  id: string;
  description?: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED';
  createdAt: string;
}

// ── Configs ───────────────────────────────────────────────────────────────────
const PLAN_STYLES: Record<string, { color: string; bg: string; label: string; iconColor: string }> = {
  FREE:       { color: 'text-gray-600',   bg: 'bg-gray-100 dark:bg-gray-800',       label: 'Gratuit',    iconColor: 'bg-gray-500' },
  BASIC:      { color: 'text-blue-600',   bg: 'bg-blue-100 dark:bg-blue-900/30',     label: 'Basic',      iconColor: 'bg-blue-500' },
  PRO:        { color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30', label: 'Pro',        iconColor: 'bg-purple-500' },
  ENTERPRISE: { color: 'text-amber-600',  bg: 'bg-amber-100 dark:bg-amber-900/30',   label: 'Enterprise', iconColor: 'bg-amber-500' },
};

const STATUS_STYLES: Record<string, { color: string; bg: string; border: string; label: string; icon: React.ReactNode }> = {
  ACTIVE:   { color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-100 dark:bg-emerald-900/30', border: 'border-emerald-200 dark:border-emerald-700', label: 'Actif',         icon: <CheckCircle size={12} /> },
  TRIALING: { color: 'text-blue-700 dark:text-blue-300',       bg: 'bg-blue-100 dark:bg-blue-900/30',       border: 'border-blue-200 dark:border-blue-700',       label: 'Essai gratuit', icon: <Sparkles size={12} /> },
  CANCELED: { color: 'text-red-700 dark:text-red-300',         bg: 'bg-red-100 dark:bg-red-900/30',         border: 'border-red-200 dark:border-red-700',         label: 'Annulé',        icon: <XCircle size={12} /> },
  PAST_DUE: { color: 'text-orange-700 dark:text-orange-300',   bg: 'bg-orange-100 dark:bg-orange-900/30',   border: 'border-orange-200 dark:border-orange-700',   label: 'En retard',     icon: <AlertTriangle size={12} /> },
  PAUSED:   { color: 'text-gray-600 dark:text-gray-400',       bg: 'bg-gray-100 dark:bg-gray-800',          border: 'border-gray-200 dark:border-gray-700',       label: 'Pausé',         icon: <AlertTriangle size={12} /> },
};

// ✅ FREE inclus
const PLANS_CONFIG = [
  {
    name: 'FREE' as const,
    price: 0,
    features: ['5 employés max', '1 utilisateur', '1 département', '2 offres d\'emploi', 'Fonctions de base'],
  },
  {
    name: 'BASIC' as const,
    price: 10000,
    features: ['20 employés max', '3 utilisateurs', '2 départements', '5 offres d\'emploi', 'Support email'],
  },
  {
    name: 'PRO' as const,
    price: 25000,
    features: ['100 employés max', '10 utilisateurs', '10 départements', '20 offres d\'emploi', 'Support prioritaire'],
  },
  {
    name: 'ENTERPRISE' as const,
    price: 45000,
    features: ['Employés illimités', 'Utilisateurs illimités', 'Départements illimités', 'Offres illimitées', 'Support dédié 24/7'],
  },
];

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold border
      ${type === 'success'
        ? 'bg-emerald-50 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-700'
        : 'bg-red-50 dark:bg-red-900/80 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700'}`}>
      {type === 'success' ? '✓' : '✗'} {message}
      <button onClick={onClose} className="ml-1 opacity-60 hover:opacity-100"><X size={14} /></button>
    </div>
  );
}

// ── UsageBar ──────────────────────────────────────────────────────────────────
function UsageBar({ label, icon, current, max }: { label: string; icon: React.ReactNode; current: number; max: number }) {
  const unlimited = max === -1;
  const pct = unlimited ? 0 : Math.min(Math.round((current / max) * 100), 100);
  const barColor = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-orange-400' : 'bg-emerald-500';

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs font-medium">{icon} {label}</span>
        <span className="text-xs font-bold text-gray-900 dark:text-white font-mono">{current} / {unlimited ? '∞' : max}</span>
      </div>
      <div className="h-1.5 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
        {unlimited
          ? <div className="h-full rounded-full bg-emerald-400 w-full opacity-30" />
          : <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
        }
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function SubscriptionPage() {
  const [subscription,   setSubscription]   = useState<Subscription | null>(null);
  const [isLoading,      setIsLoading]      = useState(true);
  const [upgradeLoading, setUpgradeLoading] = useState<string | null>(null);
  const [checkoutTarget, setCheckoutTarget] = useState<{ plan: 'BASIC' | 'PRO' | 'ENTERPRISE'; billingPeriod: 'monthly' | 'yearly'; amount: number } | null>(null);
  const [viewMode,       setViewMode]       = useState<'list' | 'grid'>('list'); // ✅ toggle liste/grille
  const [toast,          setToast]          = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // 🔀 Bascule automatique de prestataire : on demande au backend lequel est
  // configuré (MOTEKI si MOTEKI_SECRET_KEY est présent dans .env côté
  // serveur, sinon YABETOOPAY reprend le relais automatiquement — voir
  // GET /subscriptions/payment-provider). null tant qu'on ne sait pas encore,
  // 'NONE' si aucun des deux n'est configuré côté serveur.
  const [activeProvider, setActiveProvider] = useState<'MOTEKI' | 'CHARIOW' | 'YABETOOPAY' | 'NONE' | null>(null);
  const [paymentIntent,  setPaymentIntent]  = useState<PaymentIntent | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => setToast({ message, type });

  const fetchSubscription = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.get<Subscription>('/subscriptions/current');
      setSubscription(data);
    } catch {
      showToast('Impossible de charger l\'abonnement', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchSubscription(); }, [fetchSubscription]);

  useEffect(() => {
    api.get<{ provider: 'MOTEKI' | 'CHARIOW' | 'YABETOOPAY' | 'NONE' }>('/subscriptions/payment-provider')
      .then((r) => setActiveProvider(r.provider))
      .catch(() => setActiveProvider('NONE')); // repli prudent si l'appel échoue — jamais planter
  }, []);

  // Selon le prestataire actif : Moteki ouvre directement le modal (il
  // initiera le paiement lui-même) ; YabetooPay doit d'abord créer un
  // PaymentIntent via /subscriptions/upgrade avant d'ouvrir son modal
  // (flux en 2 étapes, inchangé — code original intact) ; NONE = aucun
  // prestataire configuré côté serveur, on ne tente rien et on prévient.
  const handleUpgrade = async (targetPlan: string) => {
    if (targetPlan === 'FREE') return;
    const planConfig = PLANS_CONFIG.find((p) => p.name === targetPlan);
    if (!planConfig) return;

    if (activeProvider === 'NONE') {
      showToast('Le paiement en ligne est momentanément indisponible. Contactez le support.', 'error');
      return;
    }

    if (activeProvider === 'YABETOOPAY') {
      setUpgradeLoading(targetPlan);
      try {
        const data = await api.post<PaymentIntent>('/subscriptions/upgrade', {
          plan: targetPlan,
          billingPeriod: 'monthly',
        });
        setPaymentIntent(data);
      } catch {
        showToast('Une erreur est survenue, réessayez.', 'error');
      } finally {
        setUpgradeLoading(null);
      }
      return;
    }

    // MOTEKI (ou encore null le temps du chargement initial — on tente
    // Moteki par défaut plutôt que de bloquer l'utilisateur)
    setCheckoutTarget({
      plan: targetPlan as 'BASIC' | 'PRO' | 'ENTERPRISE',
      billingPeriod: 'monthly',
      amount: planConfig.price,
    });
  };

  const handleYabetooSuccess = () => {
    showToast('Paiement envoyé ! Votre abonnement sera activé après confirmation.', 'success');
    setTimeout(() => fetchSubscription(), 5000);
  };

  const plan        = subscription?.plan    ?? 'FREE';
  const status      = subscription?.status  ?? 'ACTIVE';
  const planStyle   = PLAN_STYLES[plan]     ?? PLAN_STYLES.FREE;
  const statusStyle = STATUS_STYLES[status] ?? STATUS_STYLES.ACTIVE;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-20">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/parametres" className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors">
          <ChevronLeft size={18} className="text-gray-500" />
        </Link>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
          <Crown size={18} color="white" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-black text-gray-900 dark:text-white">Abonnement</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Plan actuel, utilisation et facturation</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-gray-400" size={28} />
        </div>
      ) : (
        <>
          {/* Plan actuel */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={13} className="text-gray-400" />
              <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Plan actuel</h2>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-xl ${planStyle.iconColor} flex items-center justify-center shrink-0`}>
                    {plan === 'FREE'
                      ? <Star size={20} className="text-white" />
                      : <Crown size={20} className="text-white" />
                    }
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${planStyle.bg} ${planStyle.color} border-current/20`}>
                        {plan === 'FREE' ? <Star size={10} /> : <Crown size={10} />} {planStyle.label}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusStyle.bg} ${statusStyle.color} ${statusStyle.border}`}>
                        {statusStyle.icon} {statusStyle.label}
                      </span>
                    </div>
                    {status === 'TRIALING' && subscription?.trialEndsAt && (
                      <p className="text-xs text-blue-500 mt-1 flex items-center gap-1">
                        <Sparkles size={10} />
                        Essai jusqu'au {new Date(subscription.trialEndsAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                      </p>
                    )}
                    {plan === 'FREE' && (
                      <p className="text-xs text-gray-400 mt-1">
                        Fonctionnalités limitées — upgradez pour en profiter pleinement.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 text-right shrink-0">
                  {subscription?.pricePerMonth != null && subscription.pricePerMonth > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 justify-end">
                      <CreditCard size={11} />
                      <span className="font-mono font-bold text-gray-700 dark:text-gray-200">{subscription.pricePerMonth.toLocaleString('fr-FR')} FCFA</span>
                      <span>/mois</span>
                    </div>
                  )}
                  {subscription?.currentPeriodEnd && status !== 'TRIALING' && plan !== 'FREE' && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 justify-end">
                      <Calendar size={11} />
                      Renouvellement le {new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  )}
                </div>
              </div>

              {subscription?.planDetails?.limits && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <UsageBar label="Employés"        icon={<Users size={11} />}     current={0} max={subscription.planDetails.limits.maxEmployees}   />
                  <UsageBar label="Utilisateurs"    icon={<Users size={11} />}     current={0} max={subscription.planDetails.limits.maxUsers}        />
                  <UsageBar label="Départements"    icon={<Building2 size={11} />} current={0} max={subscription.planDetails.limits.maxDepartments}  />
                  <UsageBar label="Offres d'emploi" icon={<Briefcase size={11} />} current={0} max={subscription.planDetails.limits.maxJobOffers}    />
                </div>
              )}
            </div>
          </div>

          {/* Plans disponibles avec toggle liste/grille */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp size={13} className="text-gray-400" />
                <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Changer de plan</h2>
              </div>

              {/* ✅ Toggle liste / grille */}
              <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-all ${viewMode === 'list'
                    ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                  title="Vue liste"
                >
                  <LayoutList size={14} />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid'
                    ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                  title="Vue grille"
                >
                  <LayoutGrid size={14} />
                </button>
              </div>
            </div>

            {/* VUE LISTE */}
            {viewMode === 'list' && (
              <div className="grid gap-3">
                {PLANS_CONFIG.map(p => {
                  const isCurrent   = plan === p.name;
                  const isUpgrading = upgradeLoading === p.name;
                  const ps          = PLAN_STYLES[p.name];
                  const isFree      = p.name === 'FREE';

                  return (
                    <div key={p.name}
                      className={`bg-white dark:bg-gray-800 rounded-2xl border p-4 transition-all
                        ${isCurrent
                          ? 'border-gray-300 dark:border-gray-600 ring-1 ring-gray-200 dark:ring-gray-700'
                          : 'border-gray-100 dark:border-gray-700'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl ${ps.iconColor} flex items-center justify-center shrink-0`}>
                          {isFree ? <Star size={17} className="text-white" /> : <Crown size={17} className="text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`text-sm font-bold ${ps.color}`}>{ps.label}</span>
                            {isCurrent && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                                Plan actuel
                              </span>
                            )}
                            <span className="text-xs font-mono font-bold text-gray-900 dark:text-white ml-auto">
                              {p.price === 0 ? 'Gratuit' : `${p.price.toLocaleString('fr-FR')} FCFA/mois`}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                            {p.features.map((f, i) => (
                              <span key={i} className="text-[11px] text-gray-400 flex items-center gap-1">
                                <CheckCircle size={9} className="text-emerald-400 shrink-0" /> {f}
                              </span>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={() => !isCurrent && !isFree && handleUpgrade(p.name)}
                          disabled={isCurrent || isUpgrading || isFree}
                          className={`shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs transition-all
                            ${isCurrent || isFree
                              ? 'bg-gray-100 dark:bg-white/5 text-gray-400 cursor-not-allowed'
                              : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90'}`}
                        >
                          {isUpgrading
                            ? <Loader2 size={13} className="animate-spin" />
                            : isCurrent ? <CheckCircle size={13} />
                            : isFree    ? <Star size={13} />
                            :             <ArrowUpRight size={13} />
                          }
                          {isUpgrading ? 'Chargement…' : isCurrent ? 'Actuel' : isFree ? 'Gratuit' : 'Choisir'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* VUE GRILLE */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-2 gap-3">
                {PLANS_CONFIG.map(p => {
                  const isCurrent   = plan === p.name;
                  const isUpgrading = upgradeLoading === p.name;
                  const ps          = PLAN_STYLES[p.name];
                  const isFree      = p.name === 'FREE';

                  return (
                    <div key={p.name}
                      className={`bg-white dark:bg-gray-800 rounded-2xl border p-4 flex flex-col gap-3 transition-all
                        ${isCurrent
                          ? 'border-gray-300 dark:border-gray-600 ring-2 ring-gray-300 dark:ring-gray-600'
                          : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'}`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg ${ps.iconColor} flex items-center justify-center shrink-0`}>
                          {isFree ? <Star size={14} className="text-white" /> : <Crown size={14} className="text-white" />}
                        </div>
                        <div>
                          <span className={`text-sm font-bold ${ps.color}`}>{ps.label}</span>
                          {isCurrent && (
                            <span className="ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                              Actuel
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-lg font-black text-gray-900 dark:text-white font-mono">
                        {p.price === 0 ? 'Gratuit' : `${p.price.toLocaleString('fr-FR')}`}
                        {p.price > 0 && <span className="text-xs font-normal text-gray-400 ml-0.5">FCFA/mois</span>}
                      </div>

                      <div className="space-y-1 flex-1">
                        {p.features.slice(0, 3).map((f, i) => (
                          <span key={i} className="flex items-center gap-1 text-[10px] text-gray-400">
                            <CheckCircle size={8} className="text-emerald-400 shrink-0" /> {f}
                          </span>
                        ))}
                        {p.features.length > 3 && (
                          <span className="text-[10px] text-gray-300 dark:text-gray-600">+{p.features.length - 3} autres…</span>
                        )}
                      </div>

                      <button
                        onClick={() => !isCurrent && !isFree && handleUpgrade(p.name)}
                        disabled={isCurrent || isUpgrading || isFree}
                        className={`w-full py-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1
                          ${isCurrent || isFree
                            ? 'bg-gray-100 dark:bg-white/5 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90'}`}
                      >
                        {isUpgrading
                          ? <Loader2 size={12} className="animate-spin" />
                          : isCurrent ? <><CheckCircle size={12} /> Actuel</>
                          : isFree    ? <><Star size={12} /> Gratuit</>
                          :             <><ArrowUpRight size={12} /> Choisir</>
                        }
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Historique paiements */}
          {subscription?.payments && subscription.payments.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Receipt size={13} className="text-gray-400" />
                <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Historique des paiements</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  {subscription.payments.length}
                </span>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                {subscription.payments.map((payment, i) => (
                  <div key={payment.id}
                    className={`flex items-center gap-4 px-5 py-4 ${i !== subscription.payments!.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0
                      ${payment.status === 'SUCCEEDED' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                        payment.status === 'PROCESSING' ? 'bg-blue-100 dark:bg-blue-900/30' :
                        'bg-red-100 dark:bg-red-900/30'}`}>
                      {payment.status === 'SUCCEEDED'
                        ? <CheckCircle size={14} className="text-emerald-600" />
                        : payment.status === 'PROCESSING'
                          ? <Loader2 size={14} className="text-blue-500 animate-spin" />
                          : <XCircle size={14} className="text-red-500" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                        {payment.description ?? 'Paiement abonnement'}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {new Date(payment.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border
                      ${payment.status === 'SUCCEEDED'
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700'
                        : payment.status === 'PROCESSING'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700'}`}>
                      {payment.status === 'SUCCEEDED' ? 'Réussi' : payment.status === 'PROCESSING' ? 'En cours' : 'Échoué'}
                    </span>
                    <span className="font-bold text-sm text-gray-900 dark:text-white font-mono whitespace-nowrap">
                      {payment.amount.toLocaleString('fr-FR')} {payment.currency}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info facturation */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 flex gap-3">
            <Info size={14} className="text-gray-400 shrink-0 mt-0.5" />
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <p className="font-semibold text-gray-700 dark:text-gray-300">Comment fonctionne la facturation ?</p>
              <p>Les paiements sont traités via Moteki (Mobile Money MTN / Airtel / Orange). Votre abonnement est activé après confirmation du paiement sur votre téléphone.</p>
            </div>
          </div>
        </>
      )}

      {/* Modal paiement — Moteki */}
      {checkoutTarget && activeProvider === 'MOTEKI' && (
        <MotekiCheckoutModal
          plan={checkoutTarget.plan}
          billingPeriod={checkoutTarget.billingPeriod}
          amount={checkoutTarget.amount}
          planLabel={PLAN_STYLES[checkoutTarget.plan]?.label ?? checkoutTarget.plan}
          onClose={() => setCheckoutTarget(null)}
          onError={(msg) => showToast(msg, 'error')}
        />
      )}

      {/* Modal paiement — Chariow (redondance de Moteki) */}
      {checkoutTarget && activeProvider === 'CHARIOW' && (
        <ChariowCheckoutModal
          plan={checkoutTarget.plan}
          billingPeriod={checkoutTarget.billingPeriod}
          amount={checkoutTarget.amount}
          planLabel={PLAN_STYLES[checkoutTarget.plan]?.label ?? checkoutTarget.plan}
          onClose={() => setCheckoutTarget(null)}
          onError={(msg) => showToast(msg, 'error')}
        />
      )}

      {/* Modal paiement — YabetooPay (filet de secours, code original intact) */}
      {paymentIntent && (
        <YabetooCheckoutModal
          intent={paymentIntent}
          planLabel={PLAN_STYLES[paymentIntent.plan]?.label ?? paymentIntent.plan}
          onClose={() => setPaymentIntent(null)}
          onSuccess={handleYabetooSuccess}
          onError={(msg) => showToast(msg, 'error')}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}