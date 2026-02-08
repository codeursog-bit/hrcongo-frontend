// ============================================================================
// ✅ PAGE DE SUCCÈS APRÈS PAIEMENT - CORRIGÉE AVEC SUSPENSE
// ============================================================================
// Fichier: app/(dashboard)/success/page.tsx

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSubscription } from '@/hooks/useSubscription';
import { CheckCircle, Crown, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

// ============================================================================
// 🎯 COMPOSANT INTERNE AVEC useSearchParams
// ============================================================================
function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams(); // ✅ Utilisé à l'intérieur de Suspense
  const sessionId = searchParams.get('session_id');
  
  const { subscription, refetch, isLoading: subLoading } = useSubscription();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // ✅ Rafraîchir l'abonnement après 2 secondes
    const timer = setTimeout(async () => {
      await refetch();
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [refetch]);

  if (isLoading || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">
            Activation de votre abonnement...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8">
        {/* ✅ Icône de succès avec animation */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🎉 Paiement réussi !
          </h1>
          
          <p className="text-slate-600 dark:text-slate-400">
            Votre abonnement a été activé avec succès.
          </p>
        </div>

        {/* ✅ Détails de l'abonnement */}
        {subscription && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-6 mb-6 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-3 mb-4">
              <Crown className="w-6 h-6 text-purple-500" />
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Détails de l'abonnement
              </h2>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Plan :</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {subscription.planDetails?.name || subscription.plan}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Statut :</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                  {subscription.status === 'ACTIVE' ? '✓ Actif' : subscription.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Fin de période :</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ✅ ID de session */}
        {sessionId && (
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 mb-6 border border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
              ID de transaction
            </p>
            <p className="text-xs font-mono text-slate-700 dark:text-slate-300 break-all">
              {sessionId}
            </p>
          </div>
        )}

        {/* ✅ Actions */}
        <div className="space-y-3">
          <Link href="/dashboard" className="block">
            <button className="
              w-full bg-gradient-to-r from-purple-500 to-pink-500 
              hover:from-purple-600 hover:to-pink-600
              text-white font-semibold py-3 px-6 rounded-lg
              shadow-lg hover:shadow-xl
              transition-all duration-300
              flex items-center justify-center gap-2
            ">
              Retour au tableau de bord
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
          
          <Link href="/settings/subscription" className="block">
            <button className="
              w-full bg-slate-100 dark:bg-slate-700 
              hover:bg-slate-200 dark:hover:bg-slate-600
              text-slate-700 dark:text-slate-200 font-semibold py-3 px-6 rounded-lg
              transition-all duration-300
            ">
              Gérer mon abonnement
            </button>
          </Link>
        </div>

        {/* ✅ Note */}
        <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-6">
          📧 Un email de confirmation vous a été envoyé.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// 🎯 COMPOSANT PRINCIPAL AVEC SUSPENSE
// ============================================================================
export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">
            Chargement...
          </p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}