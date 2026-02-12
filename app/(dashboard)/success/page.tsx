// ============================================================================
// 🎉 PAGE DE SUCCÈS APRÈS PAIEMENT - VERSION SIMPLIFIÉE AVEC ANIMATIONS
// ============================================================================
// Fichier: app/(dashboard)/success/page.tsx

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSubscription } from '@/hooks/useSubscription';
import { 
  CheckCircle, 
  Crown, 
  ArrowRight, 
  Loader2, 
  XCircle, 
  AlertTriangle,
  Sparkles,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

// ============================================================================
// 📝 TYPES
// ============================================================================
type PageStatus = 'loading' | 'success' | 'processing' | 'error';

// ============================================================================
// 🎨 COMPOSANT CONFETTI
// ============================================================================
function SuccessConfetti() {
  const { width, height } = useWindowSize();
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Arrêter les confettis après 5 secondes
    const timer = setTimeout(() => setShow(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <Confetti
      width={width}
      height={height}
      recycle={false}
      numberOfPieces={500}
      gravity={0.3}
    />
  );
}

// ============================================================================
// 🎯 COMPOSANT INTERNE AVEC useSearchParams
// ============================================================================
function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const { subscription, isLoading, refetch } = useSubscription();
  const [pageStatus, setPageStatus] = useState<PageStatus>('loading');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const checkSubscription = async () => {
      // 🔒 SÉCURITÉ : Vérifier qu'on vient bien d'un paiement
      const fromPayment = sessionStorage.getItem('payment_initiated');
      
      if (!fromPayment) {
        // Accès direct sans passer par le paiement = SUSPECT
        toast.error('Accès non autorisé');
        router.push('/pricing');
        return;
      }

      // Nettoyer le flag
      sessionStorage.removeItem('payment_initiated');
      
      // Attendre 2 secondes pour laisser le webhook se traiter
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Rafraîchir les données de l'abonnement
      await refetch();
      
      // Vérifier le statut de l'abonnement
      if (subscription) {
        if (subscription.status === 'ACTIVE' || subscription.status === 'TRIALING') {
          setPageStatus('success');
          toast.success('🎉 Abonnement activé avec succès !');
        } else {
          setPageStatus('processing');
        }
      } else {
        setPageStatus('processing');
      }
    };

    checkSubscription();
  }, [subscription, refetch, router]);

  // Countdown pour auto-redirect en cas de processing
  useEffect(() => {
    if (pageStatus === 'processing' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (pageStatus === 'processing' && countdown === 0) {
      window.location.reload();
    }
  }, [pageStatus, countdown]);

  // ============================================================================
  // 🎨 RENDU SELON LE STATUT
  // ============================================================================

  // ⏳ LOADING
  if (pageStatus === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center glass-panel p-8 rounded-2xl max-w-md animate-pulse">
          <div className="relative">
            <Loader2 className="w-16 h-16 text-purple-500 animate-spin mx-auto mb-4" />
            <Sparkles className="w-6 h-6 text-yellow-400 absolute top-0 right-1/3 animate-bounce" />
          </div>
          <h2 className="text-xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Magie en cours...
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Activation de votre abonnement
          </p>
        </div>
      </div>
    );
  }

  // ⏳ PROCESSING (Webhook pas encore traité)
  if (pageStatus === 'processing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center glass-panel p-8 rounded-2xl max-w-md">
          <div className="relative mb-4">
            <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto" />
            <Zap className="w-6 h-6 text-yellow-400 absolute top-0 right-1/3 animate-ping" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Traitement en cours</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Votre paiement est confirmé ! L'activation de votre abonnement est en cours...
          </p>
          <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-400">
              Actualisation automatique dans {countdown} seconde{countdown > 1 ? 's' : ''}...
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Veuillez patienter
          </div>
        </div>
      </div>
    );
  }

  // ❌ ERROR
  if (pageStatus === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50 dark:from-slate-900 dark:to-slate-800">
        <div className="glass-panel p-8 rounded-2xl max-w-md">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Erreur
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Une erreur est survenue. Veuillez contacter le support.
            </p>
          </div>

          <div className="space-y-3">
            <Link href="/pricing" className="block">
              <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2">
                Retour aux offres
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ✅ SUCCESS
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-6 relative overflow-hidden">
      {/* 🎉 CONFETTI ANIMATION */}
      <SuccessConfetti />
      
      {/* 🌟 BACKGROUND SPARKLES */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <Sparkles className="w-12 h-12 text-yellow-400 absolute top-10 left-10 animate-pulse" />
        <Sparkles className="w-8 h-8 text-pink-400 absolute top-20 right-20 animate-bounce" />
        <Sparkles className="w-10 h-10 text-purple-400 absolute bottom-20 left-1/4 animate-pulse" />
        <Sparkles className="w-6 h-6 text-blue-400 absolute bottom-10 right-1/3 animate-bounce" />
      </div>

      <div className="max-w-md w-full glass-panel p-8 rounded-2xl relative z-10 shadow-2xl">
        {/* ✅ Icône de succès avec animation */}
        <div className="text-center mb-6">
          <div className="relative inline-block">
            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce shadow-lg">
              <CheckCircle className="w-14 h-14 text-white" strokeWidth={3} />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-ping">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent animate-pulse">
            Félicitations ! 🎉
          </h1>
          
          <p className="text-lg text-slate-700 dark:text-slate-300 font-medium">
            Votre abonnement est activé
          </p>
        </div>

        {/* ✅ Détails de l'abonnement */}
        {subscription && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 mb-6 border-2 border-purple-200 dark:border-purple-800 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                <Crown className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="font-bold text-lg text-gray-900 dark:text-white">
                Votre nouveau plan
              </h2>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded-lg">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Plan</span>
                <span className="font-bold text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {subscription.plan}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded-lg">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Statut</span>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-md">
                  <CheckCircle className="w-4 h-4" />
                  Actif
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded-lg">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Valide jusqu'au</span>
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

        {/* ✅ Message de bienvenue */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6 border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-300 text-center">
            🚀 Vous avez maintenant accès à toutes les fonctionnalités de votre plan !
          </p>
        </div>

        {/* ✅ Actions */}
        <div className="space-y-3">
          <Link href="/dashboard" className="block">
            <button className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 hover:from-purple-600 hover:via-pink-600 hover:to-purple-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-2 group">
              <span>Découvrir mon tableau de bord</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
          
          <Link href="/settings/subscription" className="block">
            <button className="w-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-3 px-6 rounded-xl transition-all duration-300 border-2 border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700">
              Gérer mon abonnement
            </button>
          </Link>
        </div>

        {/* ✅ Note */}
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-center text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Un email de confirmation vous a été envoyé
          </p>
        </div>
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-900 dark:to-slate-800">
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

