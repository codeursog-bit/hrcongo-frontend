'use client';

// ============================================================================
// 💎 PAGE PRICING - MODAL MOBILE MONEY (nouveau flow)
// ============================================================================
// Fichier: app/(dashboard)/pricing/page.tsx

import { useState, Suspense } from 'react';
import { useSubscription, usePlans } from '@/hooks/useSubscription';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  Check, Zap, Gift, Sparkles, AlertTriangle,
  Rocket, Building2, Star, X, Phone, ChevronDown, Loader2, Crown,
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================================================
// 📝 TYPES
// ============================================================================
interface PaymentIntent {
  intentId: string;
  clientSecret: string;
  paymentId: string;
  plan: string;
  billingPeriod: string;
  amount: number;
}

const OPERATORS = [
  { value: 'MTN',    label: 'MTN Mobile Money' },
  { value: 'AIRTEL', label: 'Airtel Money' },
  { value: 'ORANGE', label: 'Orange Money' },
] as const;

const PLAN_LABELS: Record<string, string> = {
  FREE: 'Gratuit', BASIC: 'Basic', PRO: 'Pro', ENTERPRISE: 'Enterprise',
};

// ============================================================================
// 💳 MODAL PAIEMENT MOBILE MONEY
// ============================================================================
function PaymentModal({
  intent,
  planLabel,
  onClose,
}: {
  intent: PaymentIntent;
  planLabel: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [phone,    setPhone]    = useState('');
  const [operator, setOperator] = useState<'MTN' | 'AIRTEL' | 'ORANGE'>('MTN');
  const [loading,  setLoading]  = useState(false);
  const [step,     setStep]     = useState<'form' | 'waiting'>('form');

  const handleConfirm = async () => {
    if (!phone || phone.length < 9) {
      toast.error('Numéro invalide — 9 chiffres requis');
      return;
    }
    setLoading(true);
    try {
      const result = await api.post<{ status: string; message: string }>(
        '/subscriptions/confirm-payment',
        { intentId: intent.intentId, clientSecret: intent.clientSecret, phone, operator },
      );

      if (result.status === 'succeeded') {
        // Paiement immédiat (rare en sandbox)
        router.push(`/success?plan=${intent.plan}&immediate=true`);
      } else {
        // Cas normal : attente confirmation téléphone
        setStep('waiting');
      }
    } catch {
      toast.error('Erreur lors de l\'envoi. Vérifiez votre numéro.');
    } finally {
      setLoading(false);
    }
  };

  const handleWaitingDone = () => {
    router.push(`/success?plan=${intent.plan}&waiting=true`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">Paiement Mobile Money</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Plan {planLabel} · {intent.amount.toLocaleString('fr-FR')} FCFA/mois
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={15} className="text-slate-500" />
          </button>
        </div>

        {step === 'form' ? (
          <div className="p-5 space-y-4">
            {/* Opérateur */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                Opérateur
              </label>
              <div className="relative">
                <select
                  value={operator}
                  onChange={e => setOperator(e.target.value as 'MTN' | 'AIRTEL' | 'ORANGE')}
                  className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer"
                >
                  {OPERATORS.map(op => (
                    <option key={op.value} value={op.value}>{op.label}</option>
                  ))}
                </select>
                <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Téléphone */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                Numéro de téléphone
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  <Phone size={14} className="text-slate-400" />
                  <span className="text-xs text-slate-400 font-mono">+242</span>
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="06 XXX XX XX"
                  maxLength={9}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-20 pr-4 py-3 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder:text-slate-300 dark:placeholder:text-slate-600"
                />
              </div>
              <p className="mt-1.5 text-[11px] text-slate-400">
                Numéro associé à votre {OPERATORS.find(o => o.value === operator)?.label}
              </p>
            </div>

            {/* Récap */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">Montant à payer</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                {intent.amount.toLocaleString('fr-FR')} FCFA
              </span>
            </div>

            <button
              onClick={handleConfirm}
              disabled={loading || phone.length < 9}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : null}
              {loading ? 'Envoi en cours…' : 'Confirmer le paiement'}
            </button>

            <p className="text-[11px] text-center text-slate-400">
              Une notification sera envoyée sur votre téléphone. Confirmez avec votre PIN.
            </p>
          </div>
        ) : (
          /* Attente confirmation téléphone */
          <div className="p-6 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Phone size={24} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                Confirmez sur votre téléphone
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Demande de{' '}
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {intent.amount.toLocaleString('fr-FR')} FCFA
                </span>{' '}
                envoyée au{' '}
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                  +242 {phone}
                </span>{' '}
                via {OPERATORS.find(o => o.value === operator)?.label}.
              </p>
            </div>
            <div className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 text-left space-y-1.5">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Instructions</p>
              <p className="text-xs text-slate-600 dark:text-slate-300">1. Ouvrez la notification sur votre téléphone</p>
              <p className="text-xs text-slate-600 dark:text-slate-300">2. Entrez votre code PIN Mobile Money</p>
              <p className="text-xs text-slate-600 dark:text-slate-300">3. Cliquez sur "J'ai confirmé" ci-dessous</p>
            </div>
            <button
              onClick={handleWaitingDone}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold transition-all hover:opacity-90 shadow-lg"
            >
              J'ai confirmé le paiement ✓
            </button>
            <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
              Annuler
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

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
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null);
  const [selectedPlan,  setSelectedPlan]  = useState<string>('');

  const handleUpgrade = async (plan: 'BASIC' | 'PRO' | 'ENTERPRISE') => {
    setUpgradingPlan(plan);
    try {
      const data = await api.post<PaymentIntent>('/subscriptions/upgrade', {
        plan,
        billingPeriod,
      });
      setPaymentIntent(data);
      setSelectedPlan(plan);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'initialisation du paiement');
    } finally {
      setUpgradingPlan(null);
    }
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
                Mobile Money direct depuis l'app : MTN, Airtel, Orange via YabetooPay.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal paiement */}
      {paymentIntent && (
        <PaymentModal
          intent={paymentIntent}
          planLabel={PLAN_LABELS[selectedPlan] ?? selectedPlan}
          onClose={() => setPaymentIntent(null)}
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