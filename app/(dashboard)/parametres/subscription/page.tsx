'use client';

// ============================================================================
// 💳 PAGE ABONNEMENT - AVEC MODAL PAYMENT INTENT (Mobile Money)
// ============================================================================
// Fichier: app/(dashboard)/parametres/subscription/page.tsx

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Crown, ChevronLeft, CheckCircle, XCircle, Calendar, CreditCard,
  TrendingUp, Users, Briefcase, Building2, ArrowUpRight, Loader2,
  AlertTriangle, Sparkles, Receipt, Info, Shield, X, Phone, ChevronDown,
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
  status: 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED';
  createdAt: string;
}

interface PaymentIntent {
  intentId: string;
  clientSecret: string;
  paymentId: string;
  plan: string;
  billingPeriod: string;
  amount: number;
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

const OPERATORS = [
  { value: 'MTN',    label: 'MTN Mobile Money' },
  { value: 'AIRTEL', label: 'Airtel Money' },
  { value: 'ORANGE', label: 'Orange Money' },
] as const;

const PLANS_CONFIG = [
  {
    name: 'BASIC' as const,
    price: 25000,
    features: ['20 employés max', '3 utilisateurs', '2 départements', '5 offres d\'emploi', 'Support email'],
  },
  {
    name: 'PRO' as const,
    price: 75000,
    features: ['100 employés max', '10 utilisateurs', '10 départements', '20 offres d\'emploi', 'Support prioritaire'],
  },
  {
    name: 'ENTERPRISE' as const,
    price: 200000,
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

// ── Modal Paiement Mobile Money ───────────────────────────────────────────────
function PaymentModal({
  intent,
  planLabel,
  onClose,
  onSuccess,
  onError,
}: {
  intent: PaymentIntent;
  planLabel: string;
  onClose: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const [phone, setPhone]       = useState('');
  const [operator, setOperator] = useState<'MTN' | 'AIRTEL' | 'ORANGE'>('MTN');
  const [loading, setLoading]   = useState(false);
  const [step, setStep]         = useState<'form' | 'waiting'>('form');

  const handleConfirm = async () => {
    if (!phone || phone.length < 9) {
      onError('Numéro de téléphone invalide');
      return;
    }

    setLoading(true);
    try {
      const result = await api.post<{ status: string; message: string }>('/subscriptions/confirm-payment', {
        intentId: intent.intentId,
        clientSecret: intent.clientSecret,
        phone,
        operator,
      });

      if (result.status === 'succeeded') {
        onSuccess();
        onClose();
      } else {
        // En attente de confirmation sur le téléphone
        setStep('waiting');
      }
    } catch {
      onError('Erreur lors de l\'envoi du paiement. Vérifiez votre numéro.');
    } finally {
      setLoading(false);
    }
  };

  const handleWaitingDone = () => {
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">Paiement Mobile Money</p>
            <p className="text-xs text-gray-400 mt-0.5">Plan {planLabel} · {intent.amount.toLocaleString('fr-FR')} FCFA/mois</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <X size={15} className="text-gray-500" />
          </button>
        </div>

        {step === 'form' ? (
          <div className="p-5 space-y-4">
            {/* Opérateur */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Opérateur</label>
              <div className="relative">
                <select
                  value={operator}
                  onChange={e => setOperator(e.target.value as any)}
                  className="w-full appearance-none bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 cursor-pointer"
                >
                  {OPERATORS.map(op => (
                    <option key={op.value} value={op.value}>{op.label}</option>
                  ))}
                </select>
                <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Numéro de téléphone */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Numéro de téléphone</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  <Phone size={14} className="text-gray-400" />
                  <span className="text-xs text-gray-400 font-mono">+242</span>
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="06 XXX XX XX"
                  maxLength={9}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-20 pr-4 py-3 text-sm font-mono text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 placeholder:text-gray-300 dark:placeholder:text-gray-600"
                />
              </div>
              <p className="mt-1.5 text-[11px] text-gray-400">Le numéro associé à votre compte {OPERATORS.find(o => o.value === operator)?.label}</p>
            </div>

            {/* Montant récap */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Montant à payer</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white font-mono">{intent.amount.toLocaleString('fr-FR')} FCFA</span>
            </div>

            {/* Bouton confirmer */}
            <button
              onClick={handleConfirm}
              disabled={loading || !phone}
              className="w-full py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : null}
              {loading ? 'Envoi en cours…' : 'Confirmer le paiement'}
            </button>

            <p className="text-[11px] text-center text-gray-400">
              Une demande de paiement sera envoyée sur votre téléphone. Confirmez-la pour activer votre abonnement.
            </p>
          </div>
        ) : (
          /* Étape attente confirmation téléphone */
          <div className="p-6 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Phone size={24} className="text-gray-600 dark:text-gray-300" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">Confirmez sur votre téléphone</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Une demande de paiement de <span className="font-bold text-gray-700 dark:text-gray-300">{intent.amount.toLocaleString('fr-FR')} FCFA</span> a été envoyée au <span className="font-mono font-bold text-gray-700 dark:text-gray-300">+242 {phone}</span> via {OPERATORS.find(o => o.value === operator)?.label}.
              </p>
            </div>
            <div className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 text-left space-y-1.5">
              <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Instructions</p>
              <p className="text-xs text-gray-600 dark:text-gray-300">1. Ouvrez la notification sur votre téléphone</p>
              <p className="text-xs text-gray-600 dark:text-gray-300">2. Entrez votre code PIN Mobile Money</p>
              <p className="text-xs text-gray-600 dark:text-gray-300">3. Revenez ici et cliquez sur "J'ai confirmé"</p>
            </div>
            <button
              onClick={handleWaitingDone}
              className="w-full py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold transition-all hover:opacity-90"
            >
              J'ai confirmé le paiement
            </button>
            <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              Annuler
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function SubscriptionPage() {
  const [subscription,   setSubscription]   = useState<Subscription | null>(null);
  const [isLoading,      setIsLoading]      = useState(true);
  const [upgradeLoading, setUpgradeLoading] = useState<string | null>(null);
  const [paymentIntent,  setPaymentIntent]  = useState<PaymentIntent | null>(null);
  const [selectedPlan,   setSelectedPlan]   = useState<string>('');
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

  // ── Initier le paiement (crée le payment intent) ──────────────────────────
  const handleUpgrade = async (targetPlan: string) => {
    setUpgradeLoading(targetPlan);
    try {
      const data = await api.post<PaymentIntent>('/subscriptions/upgrade', {
        plan: targetPlan,
        billingPeriod: 'monthly',
      });

      setPaymentIntent(data);
      setSelectedPlan(targetPlan);
    } catch {
      showToast('Une erreur est survenue, réessayez.', 'error');
    } finally {
      setUpgradeLoading(null);
    }
  };

  // ── Succès paiement ────────────────────────────────────────────────────────
  const handlePaymentSuccess = () => {
    showToast('Paiement envoyé ! Votre abonnement sera activé après confirmation.', 'success');
    // Refetch après 5s pour laisser le webhook activer
    setTimeout(() => fetchSubscription(), 5000);
  };

  const plan        = subscription?.plan    ?? 'FREE';
  const status      = subscription?.status  ?? 'ACTIVE';
  const planStyle   = PLAN_STYLES[plan]     ?? PLAN_STYLES.FREE;
  const statusStyle = STATUS_STYLES[status] ?? STATUS_STYLES.ACTIVE;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-20">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
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
          {/* ── Plan actuel ─────────────────────────────────────────────────── */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={13} className="text-gray-400" />
              <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Plan actuel</h2>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-xl ${planStyle.iconColor} flex items-center justify-center shrink-0`}>
                    <Crown size={20} className="text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${planStyle.bg} ${planStyle.color} border-current/20`}>
                        <Crown size={10} /> {planStyle.label}
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
                  {subscription?.currentPeriodEnd && status !== 'TRIALING' && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 justify-end">
                      <Calendar size={11} />
                      Renouvellement le {new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  )}
                </div>
              </div>

              {/* Barres d'utilisation */}
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

          {/* ── Plans disponibles ────────────────────────────────────────────── */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={13} className="text-gray-400" />
              <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Changer de plan</h2>
            </div>

            <div className="grid gap-3">
              {PLANS_CONFIG.map(p => {
                const isCurrent  = plan === p.name;
                const isLoading  = upgradeLoading === p.name;
                const ps         = PLAN_STYLES[p.name];

                return (
                  <div key={p.name}
                    className={`bg-white dark:bg-gray-800 rounded-2xl border p-4 transition-all
                      ${isCurrent
                        ? 'border-gray-300 dark:border-gray-600 ring-1 ring-gray-200 dark:ring-gray-700'
                        : 'border-gray-100 dark:border-gray-700'
                      }`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl ${ps.iconColor} flex items-center justify-center shrink-0`}>
                        <Crown size={17} className="text-white" />
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
                        onClick={() => !isCurrent && handleUpgrade(p.name)}
                        disabled={isCurrent || isLoading}
                        className={`shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs transition-all
                          ${isCurrent
                            ? 'bg-gray-100 dark:bg-white/5 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90'
                          }`}
                      >
                        {isLoading
                          ? <Loader2 size={13} className="animate-spin" />
                          : isCurrent
                            ? <CheckCircle size={13} />
                            : <ArrowUpRight size={13} />
                        }
                        {isLoading ? 'Chargement…' : isCurrent ? 'Actuel' : 'Choisir'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Historique paiements ─────────────────────────────────────────── */}
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
                      ${payment.status === 'SUCCEEDED' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700'
                        : payment.status === 'PROCESSING' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700'
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

          {/* ── Info ─────────────────────────────────────────────────────────── */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 flex gap-3">
            <Info size={14} className="text-gray-400 shrink-0 mt-0.5" />
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <p className="font-semibold text-gray-700 dark:text-gray-300">Comment fonctionne la facturation ?</p>
              <p>Les paiements sont traités via YabetooPay (Mobile Money MTN / Airtel / Orange). Votre abonnement est activé après confirmation du paiement sur votre téléphone.</p>
            </div>
          </div>
        </>
      )}

      {/* ── Modal paiement ──────────────────────────────────────────────────── */}
      {paymentIntent && (
        <PaymentModal
          intent={paymentIntent}
          planLabel={PLAN_STYLES[selectedPlan]?.label ?? selectedPlan}
          onClose={() => setPaymentIntent(null)}
          onSuccess={handlePaymentSuccess}
          onError={(msg) => showToast(msg, 'error')}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}