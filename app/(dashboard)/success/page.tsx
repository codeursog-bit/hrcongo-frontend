// ============================================================================
// ✅ PAGE DE SUCCÈS APRÈS PAIEMENT - VERSION SÉCURISÉE
// ============================================================================
// Fichier: app/(dashboard)/success/page.tsx

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSubscription } from '@/hooks/useSubscription';
import { api } from '@/lib/api';
import { 
  CheckCircle, 
  Crown, 
  ArrowRight, 
  Loader2, 
  XCircle, 
  AlertTriangle 
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

// ============================================================================
// 📝 TYPES
// ============================================================================
type PaymentStatus = 'loading' | 'success' | 'error' | 'pending';

interface VerificationResult {
  status: string;
  paid: boolean;
  subscription?: any;
  message: string;
}

// ============================================================================
// 🎯 COMPOSANT INTERNE AVEC useSearchParams
// ============================================================================
function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const paymentId = searchParams.get('payment_id');
  
  const { subscription, refetch } = useSubscription();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('loading');
  const [message, setMessage] = useState('Vérification du paiement en cours...');
  const [verifiedSubscription, setVerifiedSubscription] = useState<any>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      // 🔒 SÉCURITÉ : Vérifier qu'on a bien un ID de session ou paiement
      if (!sessionId && !paymentId) {
        setPaymentStatus('error');
        setMessage('Aucune session de paiement trouvée. Accès non autorisé.');
        toast.error('Accès non autorisé à cette page');
        
        // Rediriger vers pricing après 3 secondes
        setTimeout(() => router.push('/pricing'), 3000);
        return;
      }

      try {
        // ✅ ÉTAPE 1 : Vérifier le paiement avec le backend
        console.log('🔍 Vérification du paiement...', { sessionId, paymentId });
        
        // Construire l'URL avec les query params
        const queryParams = new URLSearchParams();
        if (sessionId) queryParams.append('sessionId', sessionId);
        if (paymentId) queryParams.append('paymentId', paymentId);
        
        const response = await api.get<VerificationResult>(
          `/subscriptions/verify-payment?${queryParams.toString()}`
        );

        console.log('📊 Réponse de vérification:', response);

        // ✅ ÉTAPE 2 : Analyser le résultat
        if (response.paid && response.status === 'succeeded') {
          // 🎉 Paiement réussi !
          setPaymentStatus('success');
          setMessage('Paiement vérifié ! Votre abonnement a été activé avec succès.');
          setVerifiedSubscription(response.subscription);
          
          // Rafraîchir les données de l'abonnement
          await refetch();
          
          toast.success('Abonnement activé avec succès !');
        } else if (response.status === 'pending' || response.status === 'processing') {
          // ⏳ Paiement en cours
          setPaymentStatus('pending');
          setMessage('Votre paiement est en cours de traitement. Veuillez patienter...');
          
          // Réessayer après 3 secondes
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        } else {
          // ❌ Paiement échoué
          setPaymentStatus('error');
          setMessage(response.message || 'Le paiement n\'a pas pu être vérifié.');
          toast.error('Échec de la vérification du paiement');
        }
      } catch (error: any) {
        console.error('❌ Erreur de vérification:', error);
        setPaymentStatus('error');
        setMessage(error.message || 'Une erreur est survenue lors de la vérification du paiement.');
        toast.error('Erreur de vérification du paiement');
      }
    };

    verifyPayment();
  }, [sessionId, paymentId, refetch, router]);

  // ============================================================================
  // 🎨 RENDU SELON LE STATUT
  // ============================================================================

  // ⏳ LOADING
  if (paymentStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center glass-panel p-8 rounded-2xl max-w-md">
          <Loader2 className="w-16 h-16 text-purple-500 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Vérification en cours...</h2>
          <p className="text-slate-600 dark:text-slate-400">{message}</p>
        </div>
      </div>
    );
  }

  // ⏳ PENDING
  if (paymentStatus === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center glass-panel p-8 rounded-2xl max-w-md">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Paiement en cours</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">{message}</p>
          <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Actualisation automatique...
          </div>
        </div>
      </div>
    );
  }

  // ❌ ERROR
  if (paymentStatus === 'error') {
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
              {message}
            </p>
          </div>

          <div className="space-y-3">
            <Link href="/pricing" className="block">
              <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2">
                Retour aux offres
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <Link href="/dashboard" className="block">
              <button className="w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold py-3 px-6 rounded-lg transition-all duration-300">
                Tableau de bord
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ✅ SUCCESS
  const currentSubscription = verifiedSubscription || subscription;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-6">
      <div className="max-w-md w-full glass-panel p-8 rounded-2xl">
        {/* ✅ Icône de succès avec animation */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Paiement réussi !
          </h1>
          
          <p className="text-slate-600 dark:text-slate-400">
            {message}
          </p>
        </div>

        {/* ✅ Détails de l'abonnement */}
        {currentSubscription && (
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
                  {currentSubscription.plan}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Statut :</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                  ✓ {currentSubscription.status === 'ACTIVE' ? 'Actif' : currentSubscription.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Valide jusqu'au :</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString('fr-FR', {
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
        {(sessionId || paymentId) && (
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 mb-6 border border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
              ID de transaction
            </p>
            <p className="text-xs font-mono text-slate-700 dark:text-slate-300 break-all">
              {sessionId || paymentId}
            </p>
          </div>
        )}

        {/* ✅ Actions */}
        <div className="space-y-3">
          <Link href="/dashboard" className="block">
            <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2">
              Retour au tableau de bord
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
          
          <Link href="/settings/subscription" className="block">
            <button className="w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold py-3 px-6 rounded-lg transition-all duration-300">
              Gérer mon abonnement
            </button>
          </Link>
        </div>

        {/* ✅ Note */}
        <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-6">
          Un email de confirmation vous a été envoyé.
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


// // ============================================================================
// // ✅ PAGE DE SUCCÈS APRÈS PAIEMENT - CORRIGÉE AVEC SUSPENSE
// // ============================================================================
// // Fichier: app/(dashboard)/success/page.tsx

// 'use client';

// import { useEffect, useState, Suspense } from 'react';
// import { useSearchParams, useRouter } from 'next/navigation';
// import { useSubscription } from '@/hooks/useSubscription';
// import { CheckCircle, Crown, ArrowRight, Loader2 } from 'lucide-react';
// import Link from 'next/link';

// // ============================================================================
// // 🎯 COMPOSANT INTERNE AVEC useSearchParams
// // ============================================================================
// function SuccessContent() {
//   const router = useRouter();
//   const searchParams = useSearchParams(); // ✅ Utilisé à l'intérieur de Suspense
//   const sessionId = searchParams.get('session_id');
  
//   const { subscription, refetch, isLoading: subLoading } = useSubscription();
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     // ✅ Rafraîchir l'abonnement après 2 secondes
//     const timer = setTimeout(async () => {
//       await refetch();
//       setIsLoading(false);
//     }, 2000);

//     return () => clearTimeout(timer);
//   }, [refetch]);

//   if (isLoading || subLoading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
//         <div className="text-center">
//           <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
//           <p className="text-slate-600 dark:text-slate-400">
//             Activation de votre abonnement...
//           </p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-6">
//       <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8">
//         {/* ✅ Icône de succès avec animation */}
//         <div className="text-center mb-6">
//           <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
//             <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
//           </div>
          
//           <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
//             🎉 Paiement réussi !
//           </h1>
          
//           <p className="text-slate-600 dark:text-slate-400">
//             Votre abonnement a été activé avec succès.
//           </p>
//         </div>

//         {/* ✅ Détails de l'abonnement */}
//         {subscription && (
//           <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-6 mb-6 border border-purple-200 dark:border-purple-800">
//             <div className="flex items-center gap-3 mb-4">
//               <Crown className="w-6 h-6 text-purple-500" />
//               <h2 className="font-semibold text-gray-900 dark:text-white">
//                 Détails de l'abonnement
//               </h2>
//             </div>
            
//             <div className="space-y-2 text-sm">
//               <div className="flex justify-between">
//                 <span className="text-slate-600 dark:text-slate-400">Plan :</span>
//                 <span className="font-semibold text-gray-900 dark:text-white">
//                   {subscription.planDetails?.name || subscription.plan}
//                 </span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-slate-600 dark:text-slate-400">Statut :</span>
//                 <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
//                   {subscription.status === 'ACTIVE' ? '✓ Actif' : subscription.status}
//                 </span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-slate-600 dark:text-slate-400">Fin de période :</span>
//                 <span className="font-semibold text-gray-900 dark:text-white">
//                   {new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-FR', {
//                     day: 'numeric',
//                     month: 'long',
//                     year: 'numeric'
//                   })}
//                 </span>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* ✅ ID de session */}
//         {sessionId && (
//           <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 mb-6 border border-slate-200 dark:border-slate-700">
//             <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
//               ID de transaction
//             </p>
//             <p className="text-xs font-mono text-slate-700 dark:text-slate-300 break-all">
//               {sessionId}
//             </p>
//           </div>
//         )}

//         {/* ✅ Actions */}
//         <div className="space-y-3">
//           <Link href="/dashboard" className="block">
//             <button className="
//               w-full bg-gradient-to-r from-purple-500 to-pink-500 
//               hover:from-purple-600 hover:to-pink-600
//               text-white font-semibold py-3 px-6 rounded-lg
//               shadow-lg hover:shadow-xl
//               transition-all duration-300
//               flex items-center justify-center gap-2
//             ">
//               Retour au tableau de bord
//               <ArrowRight className="w-4 h-4" />
//             </button>
//           </Link>
          
//           <Link href="/settings/subscription" className="block">
//             <button className="
//               w-full bg-slate-100 dark:bg-slate-700 
//               hover:bg-slate-200 dark:hover:bg-slate-600
//               text-slate-700 dark:text-slate-200 font-semibold py-3 px-6 rounded-lg
//               transition-all duration-300
//             ">
//               Gérer mon abonnement
//             </button>
//           </Link>
//         </div>

//         {/* ✅ Note */}
//         <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-6">
//           📧 Un email de confirmation vous a été envoyé.
//         </p>
//       </div>
//     </div>
//   );
// }

// // ============================================================================
// // 🎯 COMPOSANT PRINCIPAL AVEC SUSPENSE
// // ============================================================================
// export default function SubscriptionSuccessPage() {
//   return (
//     <Suspense fallback={
//       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
//         <div className="text-center">
//           <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
//           <p className="text-slate-600 dark:text-slate-400">
//             Chargement...
//           </p>
//         </div>
//       </div>
//     }>
//       <SuccessContent />
//     </Suspense>
//   );
// }