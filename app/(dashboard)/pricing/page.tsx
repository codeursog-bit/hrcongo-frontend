'use client';

// ============================================================================
// 💎 PAGE PRICING - MODAL MOBILE MONEY (nouveau flow)
// ============================================================================
// Fichier: app/(dashboard)/pricing/page.tsx

import { useState, useEffect, Suspense } from 'react';
import { useSubscription, usePlans } from '@/hooks/useSubscription';
import { useSearchParams, useRouter } from 'next/navigation';
import { MotekiCheckoutModal } from '@/components/payment/MotekiCheckoutModal';
import { YabetooCheckoutModal, type PaymentIntent } from '@/components/payment/YabetooCheckoutModal';
import { api } from '@/services/api';
import {
  Check, Zap, Gift, Sparkles, AlertTriangle,
  Rocket, Building2, Star, X, Phone, ChevronDown, Loader2, Crown,
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================================================
// 📝 TYPES
// ============================================================================
const PLAN_LABELS: Record<string, string> = {
  FREE: 'Gratuit', BASIC: 'Basic', PRO: 'Pro', ENTERPRISE: 'Enterprise',
};

// ============================================================================
// 🎯 COMPOSANT PRICING
// ============================================================================
function PricingContent() {
  const searchParams  = useSearchParams();
  const canceled      = searchParams.get('canceled');
  const { subscription } = useSubscription();
  const { plans, isLoading } = usePlans();

  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);
  const [checkoutTarget, setCheckoutTarget] = useState<{ plan: 'BASIC' | 'PRO' | 'ENTERPRISE'; billingPeriod: 'monthly' | 'yearly'; amount: number } | null>(null);

  // 🔀 Bascule automatique de prestataire — voir GET /subscriptions/payment-provider.
  const [activeProvider, setActiveProvider] = useState<'MOTEKI' | 'YABETOOPAY' | null>(null);
  const [paymentIntent,  setPaymentIntent]  = useState<PaymentIntent | null>(null);

  useEffect(() => {
    api.get<{ provider: 'MOTEKI' | 'YABETOOPAY' }>('/subscriptions/payment-provider')
      .then((r) => setActiveProvider(r.provider))
      .catch(() => setActiveProvider('YABETOOPAY')); // repli prudent si l'appel échoue
  }, []);

  // Moteki initie ET déclenche le paiement en un seul appel (fait par
  // MotekiCheckoutModal lui-même). YabetooPay a besoin d'un PaymentIntent
  // créé d'abord via /subscriptions/upgrade (flux original en 2 étapes,
  // inchangé) avant d'ouvrir son propre modal.
  const handleUpgrade = async (plan: 'BASIC' | 'PRO' | 'ENTERPRISE') => {
    const planData = plans?.[plan];
    const amount = billingPeriod === 'yearly' ? planData?.priceYearly : planData?.priceMonthly;
    if (!amount) {
      toast.error("Impossible de déterminer le tarif de ce plan, réessayez.");
      return;
    }

    if (activeProvider === 'YABETOOPAY') {
      setUpgradingPlan(plan);
      try {
        const data = await api.post<PaymentIntent>('/subscriptions/upgrade', { plan, billingPeriod });
        setPaymentIntent(data);
      } catch (error: any) {
        toast.error(error.message || "Erreur lors de l'initialisation du paiement");
      } finally {
        setUpgradingPlan(null);
      }
      return;
    }

    setCheckoutTarget({ plan, billingPeriod, amount });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
      </div>
    );
  }

  const planOrder   = ['FREE', 'BASIC', 'PRO', 'ENTERPRISE'];
  const sortedPlans = Object.entries(plans || {})
    .sort(([a], [b]) => planOrder.indexOf(a) - planOrder.indexOf(b));

  const getPlanIcon = (planKey: string) => {
    switch (planKey) {
      case 'FREE':       return <Star      className="w-5 h-5 text-slate-400" />;
      case 'BASIC':      return <Rocket    className="w-5 h-5 text-blue-400" />;
      case 'PRO':        return <Zap       className="w-5 h-5 text-purple-400" />;
      case 'ENTERPRISE': return <Building2 className="w-5 h-5 text-pink-400" />;
      default:           return <Star      className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Fond Aurora */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 -right-40 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">

        {/* Alerte annulation */}
        {canceled && (
          <div className="mb-8 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-6 rounded-lg flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-400 mb-1">Paiement annulé</h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Aucune somme n'a été prélevée. Vous pouvez réessayer ci-dessous.
              </p>
            </div>
          </div>
        )}

        {/* Plan FREE actuel si retour au gratuit */}
        {subscription?.plan === 'FREE' && (
          <div className="mb-8 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-5 rounded-xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
              <Star className="w-5 h-5 text-slate-500" />
            </div>
            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
                Vous êtes sur le plan <span className="font-bold">Gratuit</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Choisissez un plan ci-dessous pour débloquer toutes les fonctionnalités.
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 glass-card rounded-full mb-6">
            <Gift className="w-5 h-5 text-purple-400" />
            <span className="text-sm font-semibold glow-text">30 jours d'essai PRO gratuit !</span>
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Choisissez votre plan
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Paiement Mobile Money direct — MTN, Airtel, Orange. Activation immédiate.
          </p>
        </div>

        {/* Toggle Mensuel / Annuel */}
        <div className="flex justify-center mb-12">
          <div className="glass-card p-1.5 rounded-full inline-flex">
            {(['monthly', 'yearly'] as const).map(period => (
              <button
                key={period}
                onClick={() => setBillingPeriod(period)}
                className={`
                  px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 relative
                  ${billingPeriod === period
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}
                `}
              >
                {period === 'monthly' ? 'Mensuel' : 'Annuel'}
                {period === 'yearly' && (
                  <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
                    -17%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Cartes */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {sortedPlans.map(([planKey, plan]: [string, any]) => {
            const isCurrentPlan = subscription?.plan === planKey;
            const isPro         = planKey === 'PRO';
            const isFree        = planKey === 'FREE';
            const isUpgrading   = upgradingPlan === planKey;
            const monthlyPrice  = billingPeriod === 'yearly'
              ? Math.round(plan.priceYearly / 12)
              : plan.priceMonthly;
            const totalPrice    = billingPeriod === 'yearly' ? plan.priceYearly : plan.priceMonthly;

            return (
              <div
                key={planKey}
                className={`
                  relative glass-panel rounded-2xl p-6 transition-all duration-300 hover:scale-105
                  ${isPro ? 'border-2 border-purple-500/50 shadow-2xl shadow-purple-500/20' : ''}
                  ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}
                `}
              >
                {isPro && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold rounded-full shadow-lg flex items-center gap-1.5 whitespace-nowrap">
                    <Sparkles className="w-4 h-4" /> Populaire
                  </div>
                )}
                {isCurrentPlan && (
                  <div className="absolute -top-4 right-4 px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full whitespace-nowrap">
                    ✓ Plan actuel
                  </div>
                )}

                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    {getPlanIcon(planKey)}
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{plan.description}</p>
                </div>

                <div className="mb-6">
                  {isFree ? (
                    <div className="text-4xl font-bold">Gratuit</div>
                  ) : (
                    <>
                      <div className="text-4xl font-bold mb-1">
                        {monthlyPrice.toLocaleString()} <span className="text-lg">FCFA</span>
                      </div>
                      <div className="text-sm text-slate-500">
                        {billingPeriod === 'yearly' ? (
                          <>
                            {totalPrice.toLocaleString()} FCFA / an
                            <span className="ml-2 text-green-500 font-semibold">
                              -{((plan.priceMonthly * 12) - plan.priceYearly).toLocaleString()} FCFA
                            </span>
                          </>
                        ) : '/ mois'}
                      </div>
                    </>
                  )}
                </div>

                <button
                  onClick={() => !isFree && !isCurrentPlan && handleUpgrade(planKey as 'BASIC' | 'PRO' | 'ENTERPRISE')}
                  disabled={isFree || isCurrentPlan || isUpgrading}
                  className={`
                    w-full py-3 px-6 rounded-lg font-bold text-sm mb-6
                    transition-all duration-300 flex items-center justify-center gap-2
                    ${isFree
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                      : isCurrentPlan
                        ? 'bg-green-500 text-white cursor-not-allowed'
                        : isUpgrading
                          ? 'bg-purple-400 text-white cursor-not-allowed'
                          : isPro
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:scale-105'
                            : 'bg-gradient-to-r from-blue-500 to-sky-500 text-white hover:shadow-lg hover:scale-105'
                    }
                  `}
                >
                  {isFree ? (
                    <><Star className="w-4 h-4" /> Plan gratuit</>
                  ) : isCurrentPlan ? (
                    <><Check className="w-4 h-4" /> Plan actuel</>
                  ) : isUpgrading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Préparation…</>
                  ) : (
                    <><Rocket className="w-4 h-4" /> Choisir ce plan</>
                  )}
                </button>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">Inclus :</p>
                  <div className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span>
                      {plan.limits.maxEmployees === -1 ? 'Employés illimités' : `${plan.limits.maxEmployees} employés max`}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span>
                      {plan.limits.maxUsers === -1 ? 'Utilisateurs illimités' : `${plan.limits.maxUsers} utilisateur${plan.limits.maxUsers > 1 ? 's' : ''}`}
                    </span>
                  </div>
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-2 mt-2 space-y-2">
                    {plan.limits.hasEmployeeImportExcel && (
                      <div className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /><span>Import Excel</span>
                      </div>
                    )}
                    {plan.limits.hasLeaveManagement && (
                      <div className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /><span>Gestion congés</span>
                      </div>
                    )}
                    {plan.limits.hasAttendanceGPS && (
                      <div className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /><span>Pointage GPS</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ */}
        <div className="mt-20 glass-panel p-8 rounded-2xl">
          <h2 className="text-2xl font-bold mb-6 text-center">Questions fréquentes</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold mb-2 flex items-center gap-2">
                <Gift className="w-5 h-5 text-purple-400" /> Comment fonctionne l'essai gratuit ?
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                30 jours d'essai PRO gratuit à l'inscription. Aucune carte bancaire requise.
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-2 flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-400" /> Moyens de paiement ?
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Mobile Money direct depuis l'app : MTN, Airtel, Orange via Moteki.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal paiement — Moteki */}
      {checkoutTarget && (
        <MotekiCheckoutModal
          plan={checkoutTarget.plan}
          billingPeriod={checkoutTarget.billingPeriod}
          amount={checkoutTarget.amount}
          planLabel={PLAN_LABELS[checkoutTarget.plan] ?? checkoutTarget.plan}
          onClose={() => setCheckoutTarget(null)}
          onError={(msg) => toast.error(msg)}
        />
      )}

      {/* Modal paiement — YabetooPay (filet de secours, code original intact) */}
      {paymentIntent && (
        <YabetooCheckoutModal
          intent={paymentIntent}
          planLabel={PLAN_LABELS[paymentIntent.plan] ?? paymentIntent.plan}
          onClose={() => setPaymentIntent(null)}
          onSuccess={() => {
            toast.success('Paiement envoyé ! Votre abonnement sera activé après confirmation.');
          }}
          onError={(msg) => toast.error(msg)}
        />
      )}
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
      </div>
    }>
      <PricingContent />
    </Suspense>
  );
}