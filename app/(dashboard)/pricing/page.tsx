
// ============================================================================
// 💎 PAGE PRICING - AVEC SUSPENSE POUR useSearchParams
// ============================================================================
// Fichier: app/(dashboard)/pricing/page.tsx

'use client';

import { useState, Suspense } from 'react';
import { useSubscription, usePlans } from '@/hooks/useSubscription';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Check, Crown, Zap, Gift, Sparkles, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

// ✅ TYPE POUR LA RÉPONSE
interface UpgradeResponse {
  checkoutUrl: string;
  sessionId: string;
}

// ============================================================================
// 🎯 COMPOSANT INTERNE AVEC useSearchParams
// ============================================================================
function PricingContent() {
  const router = useRouter();
  const searchParams = useSearchParams(); // ✅ Utilisé à l'intérieur de Suspense
  const canceled = searchParams.get('canceled');
  
  const { subscription } = useSubscription();
  const { plans, isLoading } = usePlans();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [upgrading, setUpgrading] = useState(false);

  const handleUpgrade = async (plan: 'BASIC' | 'PRO' | 'ENTERPRISE') => {
    try {
      setUpgrading(true);

      const response = await api.post<UpgradeResponse>('/subscriptions/upgrade', {
        plan,
        billingPeriod,
      });

      const data = response as UpgradeResponse;

      console.log('🔗 Redirecting to:', data.checkoutUrl);
      window.location.href = data.checkoutUrl;

    } catch (error: any) {
      console.error('❌ Upgrade error:', error);
      toast.error(error.message || 'Erreur lors de l\'upgrade');
      setUpgrading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const planOrder = ['FREE', 'BASIC', 'PRO', 'ENTERPRISE'];
  const sortedPlans = Object.entries(plans || {})
    .sort(([a], [b]) => planOrder.indexOf(a) - planOrder.indexOf(b));

  return (
    <div className="min-h-screen pb-20">
      {/* Fond Aurora animé */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 -left-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-aurora-1"></div>
        <div className="absolute bottom-0 -right-40 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-aurora-2"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        {/* ⚠️ ALERTE ANNULATION */}
        {canceled && (
          <div className="mb-8 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-6 rounded-lg">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-400 mb-2">
                  Paiement annulé
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Vous avez annulé le processus de paiement. Aucune somme n'a été prélevée sur votre compte.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 glass-card rounded-full mb-6">
            <Gift className="w-5 h-5 text-purple-400" />
            <span className="text-sm font-semibold glow-text">
              🎁 30 jours d'essai PRO gratuit !
            </span>
          </div>

          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Choisissez votre plan
          </h1>
          
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Commencez avec 30 jours d'essai PRO gratuit, puis choisissez le plan qui vous convient
          </p>
        </div>

        {/* Toggle Mensuel / Annuel */}
        <div className="flex justify-center mb-12">
          <div className="glass-card p-1.5 rounded-full inline-flex">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`
                px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-300
                ${billingPeriod === 'monthly'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }
              `}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`
                px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 relative
                ${billingPeriod === 'yearly'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }
              `}
            >
              Annuel
              <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
                -17%
              </span>
            </button>
          </div>
        </div>

        {/* Cartes de prix */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {sortedPlans.map(([planKey, plan]: [string, any]) => {
            const isCurrentPlan = subscription?.plan === planKey;
            const isPro = planKey === 'PRO';
            const isFree = planKey === 'FREE';
            
            const price = billingPeriod === 'yearly' ? plan.priceYearly : plan.priceMonthly;
            const monthlyPrice = billingPeriod === 'yearly' ? Math.round(plan.priceYearly / 12) : plan.priceMonthly;

            return (
              <div
                key={planKey}
                className={`
                  relative glass-panel rounded-2xl p-6
                  ${isPro ? 'border-2 border-purple-500/50 shadow-2xl shadow-purple-500/20' : ''}
                  ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}
                  hover:scale-105 transition-all duration-300
                `}
              >
                {isPro && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold rounded-full shadow-lg flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    Populaire
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute -top-4 right-4 px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                    ✓ Plan actuel
                  </div>
                )}

                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    {planKey === 'BASIC' && <Zap className="w-5 h-5 text-blue-400" />}
                    {(planKey === 'PRO' || planKey === 'ENTERPRISE') && <Crown className="w-5 h-5 text-purple-400" />}
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {plan.description}
                  </p>
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
                            {price.toLocaleString()} FCFA / an
                            <span className="ml-2 text-green-500 font-semibold">
                              Économisez {((plan.priceMonthly * 12) - plan.priceYearly).toLocaleString()} FCFA
                            </span>
                          </>
                        ) : (
                          '/ mois'
                        )}
                      </div>
                    </>
                  )}
                </div>

                <button
                  onClick={() => !isFree && !isCurrentPlan && handleUpgrade(planKey as any)}
                  disabled={isFree || isCurrentPlan || upgrading}
                  className={`
                    w-full py-3 px-6 rounded-lg font-bold text-sm mb-6
                    transition-all duration-300
                    ${isFree 
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                      : isCurrentPlan
                        ? 'bg-green-500 text-white cursor-not-allowed'
                        : isPro
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:scale-105'
                          : 'bg-gradient-to-r from-blue-500 to-sky-500 text-white hover:shadow-lg hover:scale-105'
                    }
                  `}
                >
                  {isFree 
                    ? 'Plan gratuit' 
                    : isCurrentPlan 
                      ? 'Plan actuel' 
                      : upgrading
                        ? '🔄 Redirection...'
                        : '🚀 Upgrader'
                  }
                </button>

                <div className="space-y-3">
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Inclus :
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>
                        {plan.limits.maxEmployees === -1 ? 'Employés illimités' : `${plan.limits.maxEmployees} employés max`}
                      </span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>
                        {plan.limits.maxUsers === -1 ? 'Utilisateurs illimités' : `${plan.limits.maxUsers} utilisateur${plan.limits.maxUsers > 1 ? 's' : ''}`}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-700 pt-3 mt-3 space-y-2">
                    {plan.limits.hasEmployeeImportExcel && (
                      <div className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Import Excel</span>
                      </div>
                    )}
                    {plan.limits.hasLeaveManagement && (
                      <div className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Gestion congés</span>
                      </div>
                    )}
                    {plan.limits.hasAttendanceGPS && (
                      <div className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Pointage GPS</span>
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
          <h2 className="text-2xl font-bold mb-6 text-center">
            Questions fréquentes
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold mb-2">🎁 Comment fonctionne l'essai gratuit ?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                30 jours d'essai PRO gratuit dès l'inscription. Aucune carte bancaire requise !
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-2">💳 Moyens de paiement ?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Mobile Money : Airtel, MTN, Orange via YabetooPay.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 🎯 COMPOSANT PRINCIPAL AVEC SUSPENSE
// ============================================================================
export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    }>
      <PricingContent />
    </Suspense>
  );
}

// // ============================================================================
// // 💎 PAGE PRICING - VERSION CORRIGÉE TYPESCRIPT
// // ============================================================================
// // Fichier: app/(dashboard)/pricing/page.tsx

// 'use client';

// import { useState } from 'react';
// import { useSubscription, usePlans } from '@/hooks/useSubscription';
// import { useRouter, useSearchParams } from 'next/navigation';
// import { api } from '@/lib/api';
// import { Check, Crown, Zap, Gift, Sparkles, AlertTriangle } from 'lucide-react';
// import { toast } from 'sonner';

// // ✅ TYPE POUR LA RÉPONSE
// interface UpgradeResponse {
//   checkoutUrl: string;
//   sessionId: string;
// }

// export default function PricingPage() {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const canceled = searchParams.get('canceled');
  
//   const { subscription } = useSubscription();
//   const { plans, isLoading } = usePlans();
//   const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
//   const [upgrading, setUpgrading] = useState(false);

//   const handleUpgrade = async (plan: 'BASIC' | 'PRO' | 'ENTERPRISE') => {
//     try {
//       setUpgrading(true);

//       // ✅ TYPER LA RÉPONSE
//       const response = await api.post<UpgradeResponse>('/subscriptions/upgrade', {
//         plan,
//         billingPeriod,
//       });

//       // ✅ CAST EXPLICITE
//       const data = response as UpgradeResponse;

//       console.log('🔗 Redirecting to:', data.checkoutUrl);
//       window.location.href = data.checkoutUrl;

//     } catch (error: any) {
//       console.error('❌ Upgrade error:', error);
//       toast.error(error.message || 'Erreur lors de l\'upgrade');
//       setUpgrading(false);
//     }
//   };

//   if (isLoading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
//       </div>
//     );
//   }

//   const planOrder = ['FREE', 'BASIC', 'PRO', 'ENTERPRISE'];
//   const sortedPlans = Object.entries(plans || {})
//     .sort(([a], [b]) => planOrder.indexOf(a) - planOrder.indexOf(b));

//   return (
//     <div className="min-h-screen pb-20">
//       {/* Fond Aurora animé */}
//       <div className="fixed inset-0 -z-10 overflow-hidden">
//         <div className="absolute top-0 -left-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-aurora-1"></div>
//         <div className="absolute bottom-0 -right-40 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-aurora-2"></div>
//       </div>

//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
//         {/* ⚠️ ALERTE ANNULATION */}
//         {canceled && (
//           <div className="mb-8 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-6 rounded-lg">
//             <div className="flex items-start gap-4">
//               <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
//               <div>
//                 <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-400 mb-2">
//                   Paiement annulé
//                 </h3>
//                 <p className="text-sm text-yellow-700 dark:text-yellow-300">
//                   Vous avez annulé le processus de paiement. Aucune somme n'a été prélevée sur votre compte.
//                 </p>
//                 <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
//                   Vous pouvez réessayer quand vous le souhaitez en sélectionnant un plan ci-dessous.
//                 </p>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Header */}
//         <div className="text-center mb-12">
//           <div className="inline-flex items-center gap-2 px-4 py-2 glass-card rounded-full mb-6">
//             <Gift className="w-5 h-5 text-purple-400" />
//             <span className="text-sm font-semibold glow-text">
//               🎁 30 jours d'essai PRO gratuit !
//             </span>
//           </div>

//           <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
//             Choisissez votre plan
//           </h1>
          
//           <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
//             Commencez avec 30 jours d'essai PRO gratuit, puis choisissez le plan qui vous convient
//           </p>
//         </div>

//         {/* Toggle Mensuel / Annuel */}
//         <div className="flex justify-center mb-12">
//           <div className="glass-card p-1.5 rounded-full inline-flex">
//             <button
//               onClick={() => setBillingPeriod('monthly')}
//               className={`
//                 px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-300
//                 ${billingPeriod === 'monthly'
//                   ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
//                   : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
//                 }
//               `}
//             >
//               Mensuel
//             </button>
//             <button
//               onClick={() => setBillingPeriod('yearly')}
//               className={`
//                 px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 relative
//                 ${billingPeriod === 'yearly'
//                   ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
//                   : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
//                 }
//               `}
//             >
//               Annuel
//               <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
//                 -17%
//               </span>
//             </button>
//           </div>
//         </div>

//         {/* Cartes de prix */}
//         <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
//           {sortedPlans.map(([planKey, plan]: [string, any]) => {
//             const isCurrentPlan = subscription?.plan === planKey;
//             const isPro = planKey === 'PRO';
//             const isFree = planKey === 'FREE';
            
//             const price = billingPeriod === 'yearly' ? plan.priceYearly : plan.priceMonthly;
//             const monthlyPrice = billingPeriod === 'yearly' ? Math.round(plan.priceYearly / 12) : plan.priceMonthly;

//             return (
//               <div
//                 key={planKey}
//                 className={`
//                   relative glass-panel rounded-2xl p-6
//                   ${isPro ? 'border-2 border-purple-500/50 shadow-2xl shadow-purple-500/20' : ''}
//                   ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}
//                   hover:scale-105 transition-all duration-300
//                 `}
//               >
//                 {/* Badge "Populaire" */}
//                 {isPro && (
//                   <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold rounded-full shadow-lg flex items-center gap-1.5">
//                     <Sparkles className="w-4 h-4" />
//                     Populaire
//                   </div>
//                 )}

//                 {/* Badge "Plan actuel" */}
//                 {isCurrentPlan && (
//                   <div className="absolute -top-4 right-4 px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
//                     ✓ Plan actuel
//                   </div>
//                 )}

//                 {/* Nom du plan */}
//                 <div className="mb-6">
//                   <div className="flex items-center gap-2 mb-2">
//                     {planKey === 'BASIC' && <Zap className="w-5 h-5 text-blue-400" />}
//                     {(planKey === 'PRO' || planKey === 'ENTERPRISE') && <Crown className="w-5 h-5 text-purple-400" />}
//                     <h3 className="text-xl font-bold">{plan.name}</h3>
//                   </div>
//                   <p className="text-sm text-slate-600 dark:text-slate-400">
//                     {plan.description}
//                   </p>
//                 </div>

//                 {/* Prix */}
//                 <div className="mb-6">
//                   {isFree ? (
//                     <div className="text-4xl font-bold">
//                       Gratuit
//                     </div>
//                   ) : (
//                     <>
//                       <div className="text-4xl font-bold mb-1">
//                         {monthlyPrice.toLocaleString()} <span className="text-lg">FCFA</span>
//                       </div>
//                       <div className="text-sm text-slate-500">
//                         {billingPeriod === 'yearly' ? (
//                           <>
//                             {price.toLocaleString()} FCFA / an
//                             <span className="ml-2 text-green-500 font-semibold">
//                               Économisez {((plan.priceMonthly * 12) - plan.priceYearly).toLocaleString()} FCFA
//                             </span>
//                           </>
//                         ) : (
//                           '/ mois'
//                         )}
//                       </div>
//                     </>
//                   )}
//                 </div>

//                 {/* Bouton CTA */}
//                 <button
//                   onClick={() => !isFree && !isCurrentPlan && handleUpgrade(planKey as any)}
//                   disabled={isFree || isCurrentPlan || upgrading}
//                   className={`
//                     w-full py-3 px-6 rounded-lg font-bold text-sm mb-6
//                     transition-all duration-300
//                     ${isFree 
//                       ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
//                       : isCurrentPlan
//                         ? 'bg-green-500 text-white cursor-not-allowed'
//                         : isPro
//                           ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:scale-105'
//                           : 'bg-gradient-to-r from-blue-500 to-sky-500 text-white hover:shadow-lg hover:scale-105'
//                     }
//                   `}
//                 >
//                   {isFree 
//                     ? 'Plan gratuit' 
//                     : isCurrentPlan 
//                       ? 'Plan actuel' 
//                       : upgrading
//                         ? '🔄 Redirection...'
//                         : '🚀 Upgrader maintenant'
//                   }
//                 </button>

//                 {/* Features - reste du code identique */}
//                 <div className="space-y-3">
//                   <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
//                     Inclus :
//                   </div>
                  
//                   <div className="space-y-2">
//                     <div className="flex items-start gap-2 text-sm">
//                       <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
//                       <span>
//                         {plan.limits.maxEmployees === -1 ? 'Employés illimités' : `${plan.limits.maxEmployees} employés max`}
//                       </span>
//                     </div>
//                     <div className="flex items-start gap-2 text-sm">
//                       <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
//                       <span>
//                         {plan.limits.maxUsers === -1 ? 'Utilisateurs illimités' : `${plan.limits.maxUsers} utilisateur${plan.limits.maxUsers > 1 ? 's' : ''}`}
//                       </span>
//                     </div>
//                   </div>

//                   <div className="border-t border-slate-200 dark:border-slate-700 pt-3 mt-3 space-y-2">
//                     {plan.limits.hasEmployeeImportExcel && (
//                       <div className="flex items-start gap-2 text-sm">
//                         <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
//                         <span>Import Excel</span>
//                       </div>
//                     )}
//                     {plan.limits.hasLeaveManagement && (
//                       <div className="flex items-start gap-2 text-sm">
//                         <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
//                         <span>Gestion congés</span>
//                       </div>
//                     )}
//                     {plan.limits.hasAttendanceGPS && (
//                       <div className="flex items-start gap-2 text-sm">
//                         <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
//                         <span>Pointage GPS</span>
//                       </div>
//                     )}
//                     {plan.limits.hasRecruitmentAI && (
//                       <div className="flex items-start gap-2 text-sm">
//                         <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
//                         <span>🤖 Recrutement IA</span>
//                       </div>
//                     )}
//                     {plan.limits.hasPayrollAccountingExport && (
//                       <div className="flex items-start gap-2 text-sm">
//                         <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
//                         <span>Export comptable</span>
//                       </div>
//                     )}
//                     {plan.limits.hasAPIAccess && (
//                       <div className="flex items-start gap-2 text-sm">
//                         <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
//                         <span>Accès API</span>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             );
//           })}
//         </div>

//         {/* FAQ Section */}
//         <div className="mt-20 glass-panel p-8 rounded-2xl">
//           <h2 className="text-2xl font-bold mb-6 text-center">
//             Questions fréquentes
//           </h2>
//           <div className="grid md:grid-cols-2 gap-6">
//             <div>
//               <h3 className="font-bold mb-2">🎁 Comment fonctionne l'essai gratuit ?</h3>
//               <p className="text-sm text-slate-600 dark:text-slate-400">
//                 Lors de votre inscription, vous bénéficiez automatiquement de 30 jours d'essai PRO gratuit avec toutes les fonctionnalités. Aucune carte bancaire requise !
//               </p>
//             </div>
//             <div>
//               <h3 className="font-bold mb-2">💳 Quels moyens de paiement acceptez-vous ?</h3>
//               <p className="text-sm text-slate-600 dark:text-slate-400">
//                 Nous acceptons les paiements Mobile Money via Airtel Money, MTN Mobile Money et Orange Money grâce à YabetooPay.
//               </p>
//             </div>
//             <div>
//               <h3 className="font-bold mb-2">🔄 Puis-je changer de plan à tout moment ?</h3>
//               <p className="text-sm text-slate-600 dark:text-slate-400">
//                 Oui ! Vous pouvez upgrader ou downgrader votre plan à tout moment depuis les paramètres de votre compte.
//               </p>
//             </div>
//             <div>
//               <h3 className="font-bold mb-2">❌ Que se passe-t-il si j'annule ?</h3>
//               <p className="text-sm text-slate-600 dark:text-slate-400">
//                 Vous revenez automatiquement au plan gratuit et conservez l'accès aux fonctionnalités de base.
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }