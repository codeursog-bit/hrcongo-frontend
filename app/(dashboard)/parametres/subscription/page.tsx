// ============================================================================
// 💳 PAGE ABONNEMENT - PARAMÈTRES
// ============================================================================
// Fichier: app/(dashboard)/parametres/subscription/page.tsx

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Crown,
  ChevronRight,
  Zap,
  CheckCircle,
  XCircle,
  Calendar,
  CreditCard,
  TrendingUp,
  Users,
  Briefcase,
  Building2,
  ArrowUpRight,
  Loader2,
  AlertTriangle,
  Sparkles,
  Receipt,
} from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from 'sonner';

// ============================================================================
// 🎨 BADGE PLAN
// ============================================================================
const PLAN_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  FREE:       { color: 'text-gray-600',   bg: 'bg-gray-100 dark:bg-gray-800',         label: 'Gratuit' },
  BASIC:      { color: 'text-blue-600',   bg: 'bg-blue-100 dark:bg-blue-900/30',       label: 'Basic' },
  PRO:        { color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30',   label: 'Pro' },
  ENTERPRISE: { color: 'text-amber-600',  bg: 'bg-amber-100 dark:bg-amber-900/30',     label: 'Enterprise' },
};

const STATUS_STYLES: Record<string, { color: string; bg: string; label: string; icon: React.ReactNode }> = {
  ACTIVE:   { color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30', label: 'Actif',         icon: <CheckCircle size={14} /> },
  TRIALING: { color: 'text-blue-600',    bg: 'bg-blue-100 dark:bg-blue-900/30',       label: 'Essai gratuit', icon: <Sparkles size={14} /> },
  CANCELED: { color: 'text-red-600',     bg: 'bg-red-100 dark:bg-red-900/30',         label: 'Annulé',        icon: <XCircle size={14} /> },
  PAST_DUE: { color: 'text-orange-600',  bg: 'bg-orange-100 dark:bg-orange-900/30',   label: 'En retard',     icon: <AlertTriangle size={14} /> },
  PAUSED:   { color: 'text-gray-600',    bg: 'bg-gray-100 dark:bg-gray-800',          label: 'Pausé',         icon: <AlertTriangle size={14} /> },
};

// ============================================================================
// 🧮 BARRE D'UTILISATION
// ============================================================================
function UsageBar({ label, icon, current, max }: {
  label: string;
  icon: React.ReactNode;
  current: number;
  max: number;
}) {
  const unlimited = max === -1;
  const pct = unlimited ? 0 : Math.min(Math.round((current / max) * 100), 100);
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-orange-400' : 'bg-emerald-500';

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400 font-medium">
          {icon} {label}
        </span>
        <span className="font-semibold text-gray-900 dark:text-white">
          {current} / {unlimited ? '∞' : max}
        </span>
      </div>
      <div className="h-2 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
        {!unlimited && (
          <div
            className={`h-full rounded-full transition-all duration-700 ${color}`}
            style={{ width: `${pct}%` }}
          />
        )}
        {unlimited && (
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 w-full opacity-40" />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 🏷️ CARTE PLAN DISPONIBLE
// ============================================================================
function PlanCard({ name, price, features, current, onSelect, loading }: {
  name: string;
  price: number;
  features: string[];
  current: boolean;
  onSelect: () => void;
  loading: boolean;
}) {
  const style = PLAN_STYLES[name] || PLAN_STYLES.FREE;
  const isEnterprise = name === 'ENTERPRISE';

  return (
    <div className={`group relative bg-white dark:bg-gray-800/50 backdrop-blur-xl rounded-3xl p-6 border transition-all duration-300 overflow-hidden
      ${current
        ? 'border-sky-500/50 ring-2 ring-sky-500/20'
        : 'border-gray-100 dark:border-white/5 hover:border-sky-500/30 hover:bg-gray-50 dark:hover:bg-gray-800'
      }`}
    >
      {/* Glow background */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-white/5 to-white/0 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700" />

      {current && (
        <div className="absolute top-4 right-4 text-xs font-bold px-2 py-1 rounded-full bg-sky-500 text-white">
          Plan actuel
        </div>
      )}

      <div className="relative z-10">
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold mb-4 ${style.bg} ${style.color}`}>
          <Crown size={14} />
          {style.label}
        </div>

        <div className="mb-4">
          <span className="text-3xl font-bold text-gray-900 dark:text-white">
            {price === 0 ? 'Gratuit' : `${price.toLocaleString()} FCFA`}
          </span>
          {price > 0 && <span className="text-gray-400 text-sm ml-1">/mois</span>}
        </div>

        <ul className="space-y-2 mb-6">
          {features.map((f, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle size={14} className="text-emerald-500 shrink-0" />
              {f}
            </li>
          ))}
        </ul>

        <button
          onClick={onSelect}
          disabled={current || loading}
          className={`w-full py-3 px-4 rounded-2xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2
            ${current
              ? 'bg-gray-100 dark:bg-white/5 text-gray-400 cursor-not-allowed'
              : isEnterprise
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl'
                : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl'
            }`}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : current ? 'Plan actuel' : <>Choisir ce plan <ArrowUpRight size={14} /></>}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// 🎯 PAGE PRINCIPALE
// ============================================================================
export default function SubscriptionPage() {
  const { subscription, isLoading } = useSubscription();
  const [upgradeLoading, setUpgradeLoading] = useState<string | null>(null);

  const plan = subscription?.plan ?? 'FREE';
  const status = subscription?.status ?? 'ACTIVE';
  const planStyle = PLAN_STYLES[plan] ?? PLAN_STYLES.FREE;
  const statusStyle = STATUS_STYLES[status] ?? STATUS_STYLES.ACTIVE;

  const handleUpgrade = async (targetPlan: string) => {
    setUpgradeLoading(targetPlan);
    try {
      const res = await fetch('/api/subscriptions/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: targetPlan, billingPeriod: 'monthly' }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        sessionStorage.setItem('payment_initiated', 'true');
        window.location.href = data.checkoutUrl;
      } else {
        toast.error('Impossible de créer la session de paiement');
      }
    } catch {
      toast.error('Une erreur est survenue');
    } finally {
      setUpgradeLoading(null);
    }
  };

  const PLANS_CONFIG = [
    {
      name: 'BASIC',
      price: 25000,
      features: ['Jusqu\'à 20 employés', '3 utilisateurs', '2 départements', 'Support email'],
    },
    {
      name: 'PRO',
      price: 75000,
      features: ['Jusqu\'à 100 employés', '10 utilisateurs', '10 départements', 'Support prioritaire'],
    },
    {
      name: 'ENTERPRISE',
      price: 200000,
      features: ['Employés illimités', 'Utilisateurs illimités', 'Départements illimités', 'Support dédié 24/7'],
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-sky-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">

      {/* ── EN-TÊTE ── */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-xl">
          <Crown size={32} className="text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Abonnement</h1>
          <p className="text-gray-500 dark:text-gray-400">Gérez votre plan et suivez votre utilisation.</p>
        </div>
      </div>

      {/* ── CARTE STATUT ACTUEL ── */}
      <div className="bg-white dark:bg-gray-800/50 backdrop-blur-xl rounded-3xl p-6 border border-gray-100 dark:border-white/5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg
              ${plan === 'FREE' ? 'bg-gray-500' : plan === 'BASIC' ? 'bg-blue-500' : plan === 'PRO' ? 'bg-purple-500' : 'bg-amber-500'}`}>
              <Crown size={28} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{planStyle.label}</h2>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyle.bg} ${statusStyle.color}`}>
                  {statusStyle.icon} {statusStyle.label}
                </span>
              </div>
              {subscription?.status === 'TRIALING' && subscription.trialEndsAt && (
                <p className="text-sm text-blue-500 mt-0.5 flex items-center gap-1">
                  <Sparkles size={12} />
                  Essai jusqu'au {new Date(subscription.trialEndsAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 text-sm">
            {subscription?.currentPeriodEnd && status !== 'TRIALING' && (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-white/5 rounded-xl text-gray-600 dark:text-gray-400">
                <Calendar size={14} />
                Renouvellement : {new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            )}
            {subscription?.pricePerMonth != null && subscription.pricePerMonth > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-white/5 rounded-xl text-gray-600 dark:text-gray-400">
                <CreditCard size={14} />
                {subscription.pricePerMonth.toLocaleString()} FCFA / mois
              </div>
            )}
          </div>
        </div>

        {/* ── UTILISATION ── */}
        {subscription?.planDetails?.limits && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-white/5">
            <UsageBar
              label="Employés"
              icon={<Users size={14} />}
              current={0}
              max={subscription.planDetails.limits.maxEmployees ?? -1}
            />
            <UsageBar
              label="Utilisateurs"
              icon={<Users size={14} />}
              current={0}
              max={subscription.planDetails.limits.maxUsers ?? -1}
            />
            <UsageBar
              label="Départements"
              icon={<Building2 size={14} />}
              current={0}
              max={subscription.planDetails.limits.maxDepartments ?? -1}
            />
            <UsageBar
              label="Offres d'emploi"
              icon={<Briefcase size={14} />}
              current={0}
              max={subscription.planDetails.limits.maxJobOffers ?? -1}
            />
          </div>
        )}
      </div>

      {/* ── PLANS DISPONIBLES ── */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl shadow">
            <TrendingUp size={18} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Changer de plan</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLANS_CONFIG.map((p) => (
            <PlanCard
              key={p.name}
              name={p.name}
              price={p.price}
              features={p.features}
              current={plan === p.name}
              loading={upgradeLoading === p.name}
              onSelect={() => handleUpgrade(p.name)}
            />
          ))}
        </div>
      </div>

      {/* ── HISTORIQUE PAIEMENTS ── */}
      {subscription?.payments && subscription.payments.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl shadow">
              <Receipt size={18} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Historique des paiements</h2>
          </div>

          <div className="bg-white dark:bg-gray-800/50 backdrop-blur-xl rounded-3xl border border-gray-100 dark:border-white/5 overflow-hidden">
            {subscription.payments.map((payment: any, i: number) => (
              <div
                key={payment.id}
                className={`flex items-center justify-between px-6 py-4 gap-4
                  ${i !== subscription.payments.length - 1 ? 'border-b border-gray-100 dark:border-white/5' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center
                    ${payment.status === 'SUCCEEDED' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                    {payment.status === 'SUCCEEDED'
                      ? <CheckCircle size={16} className="text-emerald-600" />
                      : <XCircle size={16} className="text-red-600" />
                    }
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">{payment.description ?? 'Paiement'}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(payment.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <span className="font-bold text-gray-900 dark:text-white whitespace-nowrap">
                  {payment.amount?.toLocaleString()} {payment.currency}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── LIEN RETOUR PARAMÈTRES ── */}
      <Link href="/parametres">
        <div className="group bg-white dark:bg-gray-800/50 backdrop-blur-xl rounded-3xl p-5 border border-gray-100 dark:border-white/5 hover:border-sky-500/30 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-white/0 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700" />
          <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 group-hover:bg-sky-500 group-hover:text-white transition-all duration-300 relative z-10">
            <Zap size={22} />
          </div>
          <div className="flex-1 relative z-10">
            <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-sky-500 transition-colors">Retour aux paramètres</h3>
            <p className="text-sm text-gray-400">Gérez les autres configurations de votre entreprise.</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 group-hover:bg-sky-500 group-hover:text-white transition-all duration-300">
            <ChevronRight size={18} />
          </div>
        </div>
      </Link>
    </div>
  );
}