'use client';

// ============================================================================
// 🎉 PAGE SUCCÈS / ATTENTE / ÉCHEC - FLOW MOBILE MONEY
// ============================================================================
// Fichier: app/(dashboard)/success/page.tsx
//
// Utilisée par pricing/page.tsx ET parametres/subscription/page.tsx
//
// Params URL :
//   ?plan=BASIC&waiting=true   → attente confirmation webhook
//   ?plan=BASIC&immediate=true → paiement immédiat (sandbox)
//   ?failed=true               → paiement échoué
// ============================================================================

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSubscription } from '@/hooks/useSubscription';
import {
  CheckCircle, Crown, ArrowRight, Loader2, XCircle,
  Sparkles, Zap, Phone, RefreshCw, Rocket,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

// ============================================================================
// 📝 TYPES
// ============================================================================
type PageStatus = 'waiting' | 'checking' | 'success' | 'failed';

const PLAN_LABELS: Record<string, string> = {
  FREE: 'Gratuit', BASIC: 'Basic', PRO: 'Pro', ENTERPRISE: 'Enterprise',
};

// ============================================================================
// 🎯 COMPOSANT INTERNE
// ============================================================================
function SuccessContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const plan      = searchParams.get('plan') ?? '';
  const immediate = searchParams.get('immediate') === 'true';
  const failed    = searchParams.get('failed') === 'true';

  const { subscription, isLoading, refetch } = useSubscription();

  // État initial selon les params
  const getInitialStatus = (): PageStatus => {
    if (failed)    return 'failed';
    if (immediate) return 'checking';
    return 'waiting';
  };

  const [status,    setStatus]    = useState<PageStatus>(getInitialStatus);
  const [countdown, setCountdown] = useState(10);
  const [attempts,  setAttempts]  = useState(0);
  const [isChecking, setIsChecking] = useState(false);

  // ── Vérification initiale si paiement immédiat ────────────────────────────
  useEffect(() => {
    if (!immediate) return;
    const timer = setTimeout(() => { refetch(); }, 2000);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Réagir au résultat du refetch quand on est en mode "checking" ─────────
  useEffect(() => {
    if (isLoading) return;
    if (status !== 'checking') return;

    setIsChecking(false);

    if (subscription?.status === 'ACTIVE') {
      setStatus('success');
      if (attempts > 0) toast.success('🎉 Abonnement activé !');
    } else {
      // Pas encore activé → retour en attente
      setStatus('waiting');
    }
  }, [isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Countdown auto (mode waiting uniquement) ──────────────────────────────
  useEffect(() => {
    if (status !== 'waiting') return;

    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }

    // Déclencher une vérification automatique
    setAttempts(a => a + 1);
    setCountdown(10);
    setStatus('checking');
    refetch();
  }, [status, countdown]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Vérification manuelle ─────────────────────────────────────────────────
  const handleManualCheck = () => {
    if (isChecking) return;
    setIsChecking(true);
    setStatus('checking');
    refetch();
  };

  // ==========================================================================
  // 🎨 RENDU
  // ==========================================================================

  // ⏳ VÉRIFICATION EN COURS
  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-6">
        <div className="text-center glass-panel p-10 rounded-2xl max-w-md w-full">
          <div className="relative mb-6">
            <div className="w-20 h-20 mx-auto bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
            </div>
            <Sparkles className="w-6 h-6 text-yellow-400 absolute top-0 right-1/3 animate-bounce" />
          </div>
          <h2 className="text-xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Vérification en cours…
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            On vérifie l'activation de votre abonnement
          </p>
        </div>
      </div>
    );
  }

  // ✅ SUCCÈS
  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 p-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <Sparkles className="w-10 h-10 text-yellow-400 absolute top-10 left-10 animate-pulse" />
          <Sparkles className="w-7 h-7 text-pink-400 absolute top-20 right-20 animate-bounce" />
          <Sparkles className="w-9 h-9 text-purple-400 absolute bottom-20 left-1/4 animate-pulse" />
        </div>

        <div className="max-w-md w-full glass-panel p-8 rounded-2xl shadow-2xl relative z-10">
          <div className="text-center mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/30">
              <CheckCircle className="w-14 h-14 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              Félicitations ! 🎉
            </h1>
            <p className="text-slate-600 dark:text-slate-300 font-medium">
              Votre abonnement est activé
            </p>
          </div>

          {subscription && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-5 mb-6 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                  <Crown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="font-bold text-slate-800 dark:text-white">Votre plan actuel</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded-lg">
                  <span className="text-sm text-slate-500">Plan</span>
                  <span className="font-bold text-lg bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {PLAN_LABELS[subscription.plan] ?? subscription.plan}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded-lg">
                  <span className="text-sm text-slate-500">Statut</span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-green-400 to-emerald-500 text-white">
                    <CheckCircle className="w-3.5 h-3.5" />
                    {subscription.status === 'TRIALING' ? 'Essai gratuit' : 'Actif'}
                  </span>
                </div>
                {subscription.currentPeriodEnd && (
                  <div className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded-lg">
                    <span className="text-sm text-slate-500">Valide jusqu'au</span>
                    <span className="font-semibold text-sm text-slate-800 dark:text-white">
                      {new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </span>
                  </div>
                )}
                {/* FREE plan info si retour au gratuit */}
                {subscription.plan === 'FREE' && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                      Vous êtes sur le plan gratuit. Vous pouvez upgrader à tout moment.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6 border border-blue-100 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300 text-center">
              🚀 Vous avez accès à toutes les fonctionnalités de votre plan !
            </p>
          </div>

          <div className="space-y-3">
            <Link href="/dashboard" className="block">
              <button className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 group">
                <span>Aller au tableau de bord</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <Link href="/parametres/subscription" className="block">
              <button className="w-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold py-3 px-6 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-purple-300 transition-all">
                Gérer mon abonnement
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ❌ ÉCHEC
  if (status === 'failed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50 dark:from-slate-900 dark:to-slate-800 p-6">
        <div className="glass-panel p-8 rounded-2xl max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Paiement échoué
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Le paiement n'a pas pu être traité. Vérifiez votre solde ou réessayez.
            </p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 mb-6 border border-red-200 dark:border-red-800">
            <p className="text-xs text-red-700 dark:text-red-300">
              Causes possibles : solde insuffisant, code PIN incorrect, ou opération annulée.
            </p>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/pricing')}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              <Rocket className="w-4 h-4" />
              Réessayer le paiement
            </button>
            <Link href="/dashboard" className="block">
              <button className="w-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold py-3 px-6 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-all">
                Retour au tableau de bord
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ⏳ EN ATTENTE WEBHOOK (état principal après confirmation téléphone)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-orange-50 to-amber-50 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="glass-panel p-8 rounded-2xl max-w-md w-full">
        <div className="text-center mb-6">
          <div className="relative inline-block mb-4">
            <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto">
              <Phone className="w-10 h-10 text-amber-500" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            En attente de confirmation
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {plan ? (
              <>
                Paiement pour le plan{' '}
                <span className="font-bold text-purple-600 dark:text-purple-400">
                  {PLAN_LABELS[plan] ?? plan}
                </span>{' '}
                en cours de traitement.
              </>
            ) : (
              'Votre paiement est en cours de traitement.'
            )}
          </p>
        </div>

        {/* Étapes */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-5 mb-6">
          <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-3">
            Ce qui se passe
          </p>
          <div className="space-y-3">
            {[
              { icon: '📱', text: 'Vous avez confirmé sur votre téléphone' },
              { icon: '⚡', text: 'Votre opérateur traite la transaction' },
              { icon: '🎉', text: "L'abonnement s'active automatiquement" },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-lg">{step.icon}</span>
                <p className="text-sm text-amber-800 dark:text-amber-300">{step.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Countdown */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-4 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-slate-400" style={{ animation: 'spin 3s linear infinite' }} />
            <span className="text-sm text-slate-500 dark:text-slate-400">Vérification dans</span>
          </div>
          <span className="text-xl font-bold text-purple-600 dark:text-purple-400 font-mono tabular-nums">
            {countdown}s
          </span>
        </div>

        {/* Tentatives */}
        {attempts > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-4 text-center border border-blue-100 dark:border-blue-800">
            <p className="text-xs text-blue-600 dark:text-blue-400">
              Vérification n°{attempts + 1} — Pas encore activé, on continue…
            </p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleManualCheck}
            disabled={isChecking}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isChecking
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Vérification…</>
              : <><RefreshCw className="w-4 h-4" /> Vérifier maintenant</>
            }
          </button>

          <Link href="/parametres/subscription" className="block">
            <button className="w-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold py-3 px-6 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-sm">
              Voir mon abonnement
            </button>
          </Link>

          <p className="text-[11px] text-center text-slate-400">
            Si l'activation tarde, contactez le support.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-900 dark:to-slate-800">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}