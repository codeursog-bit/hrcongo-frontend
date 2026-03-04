// ============================================================================
// 💳 PAGE ABONNEMENT - PARAMÈTRES
// ============================================================================
// Fichier: app/(dashboard)/parametres/subscription/page.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Crown, ChevronLeft, CheckCircle, XCircle, Calendar, CreditCard,
  TrendingUp, Users, Briefcase, Building2, ArrowUpRight, Loader2,
  AlertTriangle, Sparkles, Receipt, Info, Shield, X, Zap,
} from 'lucide-react';
import { api } from '@/services/api';

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
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED';
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

const PLANS_CONFIG = [
  {
    name: 'BASIC' as const,
    price: 25000,
    color: 'blue',
    features: [
      '20 employés max',
      '3 utilisateurs',
      '2 départements',
      '5 offres d\'emploi',
      'Support email',
    ],
  },
  {
    name: 'PRO' as const,
    price: 75000,
    color: 'purple',
    features: [
      '100 employés max',
      '10 utilisateurs',
      '10 départements',
      '20 offres d\'emploi',
      'Support prioritaire',
    ],
  },
  {
    name: 'ENTERPRISE' as const,
    price: 200000,
    color: 'amber',
    features: [
      'Employés illimités',
      'Utilisateurs illimités',
      'Départements illimités',
      'Offres illimitées',
      'Support dédié 24/7',
    ],
  },
];

// ── Composant Toast ───────────────────────────────────────────────────────────
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold border transition-all
      ${type === 'success'
        ? 'bg-emerald-50 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-700'
        : 'bg-red-50 dark:bg-red-900/80 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700'}`}>
      {type === 'success' ? '✓' : '✗'} {message}
      <button onClick={onClose} className="ml-1 opacity-60 hover:opacity-100"><X size={14} /></button>
    </div>
  );
}

// ── Barre d'utilisation ───────────────────────────────────────────────────────
function UsageBar({ label, icon, current, max }: {
  label: string; icon: React.ReactNode; current: number; max: number;
}) {
  const unlimited = max === -1;
  const pct = unlimited ? 0 : Math.min(Math.round((current / max) * 100), 100);
  const barColor = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-orange-400' : 'bg-emerald-500';

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400 font-medium text-xs">
          {icon} {label}
        </span>
        <span className="font-semibold text-gray-900 dark:text-white text-xs font-mono">
          {current} / {unlimited ? '∞' : max}
        </span>
      </div>
      <div className="h-2 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
        {unlimited
          ? <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 w-full opacity-40" />
          : <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
        }
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading]       = useState(true);
  const [upgradeLoading, setUpgradeLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => setToast({ message, type });

  // ── Fetch abonnement ───────────────────────────────────────────────────────
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

  // ── Upgrade ────────────────────────────────────────────────────────────────
  const handleUpgrade = async (targetPlan: string) => {
    setUpgradeLoading(targetPlan);
    try {
      const data = await api.post<{ checkoutUrl: string }>('/subscriptions/upgrade', {
        plan: targetPlan,
        billingPeriod: 'monthly',
      });
      if (data.checkoutUrl) {
        sessionStorage.setItem('payment_initiated', 'true');
        window.location.href = data.checkoutUrl;
      } else {
        showToast('Impossible de créer la session de paiement', 'error');
      }
    } catch {
      showToast('Une erreur est survenue', 'error');
    } finally {
      setUpgradeLoading(null);
    }
  };

  const plan        = subscription?.plan   ?? 'FREE';
  const status      = subscription?.status ?? 'ACTIVE';
  const planStyle   = PLAN_STYLES[plan]    ?? PLAN_STYLES.FREE;
  const statusStyle = STATUS_STYLES[status] ?? STATUS_STYLES.ACTIVE;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-20">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
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
          <Loader2 className="animate-spin text-amber-500" size={32} />
        </div>
      ) : (
        <>
          {/* ── Carte statut actuel ─────────────────────────────────────────── */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={14} className="text-gray-400" />
              <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Plan actuel</h2>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
              {/* Infos plan */}
              <div className="flex items-start justify-between gap-4 mb-5">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl ${planStyle.iconColor} flex items-center justify-center shadow-lg shrink-0`}>
                    <Crown size={22} className="text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${planStyle.bg} ${planStyle.color} border-current/20`}>
                        <Crown size={11} /> {planStyle.label}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusStyle.bg} ${statusStyle.color} ${statusStyle.border}`}>
                        {statusStyle.icon} {statusStyle.label}
                      </span>
                    </div>
                    {status === 'TRIALING' && subscription?.trialEndsAt && (
                      <p className="text-xs text-blue-500 mt-1 flex items-center gap-1">
                        <Sparkles size={11} />
                        Essai jusqu'au {new Date(subscription.trialEndsAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 text-right shrink-0">
                  {subscription?.pricePerMonth != null && subscription.pricePerMonth > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 justify-end">
                      <CreditCard size={12} />
                      <span className="font-mono font-bold text-gray-700 dark:text-gray-200">
                        {subscription.pricePerMonth.toLocaleString('fr-FR')} FCFA
                      </span>
                      <span>/mois</span>
                    </div>
                  )}
                  {subscription?.currentPeriodEnd && status !== 'TRIALING' && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 justify-end">
                      <Calendar size={12} />
                      Renouvellement le {new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  )}
                </div>
              </div>

              {/* Barres d'utilisation */}
              {subscription?.planDetails?.limits && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <UsageBar label="Employés"        icon={<Users size={12} />}    current={0} max={subscription.planDetails.limits.maxEmployees}   />
                  <UsageBar label="Utilisateurs"    icon={<Users size={12} />}    current={0} max={subscription.planDetails.limits.maxUsers}        />
                  <UsageBar label="Départements"    icon={<Building2 size={12} />} current={0} max={subscription.planDetails.limits.maxDepartments} />
                  <UsageBar label="Offres d'emploi" icon={<Briefcase size={12} />} current={0} max={subscription.planDetails.limits.maxJobOffers}   />
                </div>
              )}
            </div>
          </div>

          {/* ── Plans disponibles ───────────────────────────────────────────── */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={14} className="text-amber-500" />
              <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Changer de plan</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700">
                {PLANS_CONFIG.length} plans
              </span>
            </div>

            <div className="grid gap-3">
              {PLANS_CONFIG.map(p => {
                const isCurrent = plan === p.name;
                const isLoading = upgradeLoading === p.name;
                const ps = PLAN_STYLES[p.name];

                return (
                  <div key={p.name}
                    className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 transition-all
                      ${isCurrent ? 'ring-2 ring-amber-400 ring-opacity-50 border-amber-200 dark:border-amber-700' : ''}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl ${ps.iconColor} flex items-center justify-center shadow shrink-0`}>
                        <Crown size={18} className="text-white" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-sm font-bold ${ps.color}`}>{ps.label}</span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700">
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
                              <CheckCircle size={10} className="text-emerald-400 shrink-0" /> {f}
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => !isCurrent && handleUpgrade(p.name)}
                        disabled={isCurrent || isLoading}
                        className={`shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs transition-all
                          ${isCurrent
                            ? 'bg-gray-100 dark:bg-white/5 text-gray-400 cursor-not-allowed'
                            : p.name === 'ENTERPRISE'
                              ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-500/25'
                              : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white shadow-sm'
                          }`}
                      >
                        {isLoading
                          ? <Loader2 size={14} className="animate-spin" />
                          : isCurrent
                            ? <CheckCircle size={14} />
                            : <ArrowUpRight size={14} />
                        }
                        {isLoading ? 'Redirection…' : isCurrent ? 'Actuel' : 'Choisir'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Historique paiements ────────────────────────────────────────── */}
          {subscription?.payments && subscription.payments.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Receipt size={14} className="text-orange-500" />
                <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Historique des paiements</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-700">
                  {subscription.payments.length}
                </span>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                {subscription.payments.map((payment, i) => (
                  <div key={payment.id}
                    className={`flex items-center gap-4 px-5 py-4 ${i !== subscription.payments!.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''}`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                      ${payment.status === 'SUCCEEDED' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                      {payment.status === 'SUCCEEDED'
                        ? <CheckCircle size={16} className="text-emerald-600" />
                        : <XCircle size={16} className="text-red-500" />
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
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border
                      ${payment.status === 'SUCCEEDED'
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700'
                      }`}>
                      {payment.status === 'SUCCEEDED' ? 'Réussi' : 'Échoué'}
                    </span>
                    <span className="font-bold text-sm text-gray-900 dark:text-white font-mono whitespace-nowrap">
                      {payment.amount.toLocaleString('fr-FR')} {payment.currency}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Info box ────────────────────────────────────────────────────── */}
          <div className="p-4 bg-sky-50 dark:bg-sky-900/20 rounded-2xl border border-sky-200 dark:border-sky-800 flex gap-3">
            <Info size={15} className="text-sky-500 shrink-0 mt-0.5" />
            <div className="text-xs text-sky-700 dark:text-sky-300 space-y-1">
              <p className="font-bold">Comment fonctionne la facturation ?</p>
              <p>Les paiements sont traités via YabetooPay (Mobile Money MTN/Airtel/Orange). Votre abonnement est activé instantanément après confirmation du paiement. Vous pouvez changer de plan à tout moment.</p>
            </div>
          </div>
        </>
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}