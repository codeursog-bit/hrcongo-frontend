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
import { api } from '@/services/api';
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

  // 🛒 Retour Moteki : l'URL de redirection est fixe (configurée sur le
  // dashboard Moteki) et ne porte que ?status=success|cancel — pas nos
  // propres ?plan=/&waiting= comme avec l'ancien flux Yabetoo. On relit
  // donc le plan mémorisé juste avant le redirect (voir MotekiCheckoutModal)
  // si l'URL ne le porte pas.
  const motekiStatus = searchParams.get('status'); // 'success' | 'cancel' | null
  let pendingCheckout: { plan?: string; billingPeriod?: string; paymentId?: string } = {};
  if (typeof window !== 'undefined') {
    try {
      const raw = sessionStorage.getItem('pendingSubscriptionCheckout');
      if (raw) pendingCheckout = JSON.parse(raw);
    } catch {
      // ignore
    }
  }

  // 🛒 Retour Chariow : contrairement à Moteki, on CONTRÔLE le redirect_url
  // envoyé à Chariow (voir ChariowCheckoutModal), mais le paymentId n'existe
  // que côté backend une fois l'appel /checkout terminé — donc trop tard
  // pour être inclus dans ce redirect_url. On relit le paymentId mémorisé
  // en sessionStorage juste avant la redirection, comme pour Moteki. Seul
  // `provider=chariow` est fiable dans l'URL de retour elle-même.
  let pendingChariowCheckout: { plan?: string; billingPeriod?: string; paymentId?: string } = {};
  if (typeof window !== 'undefined') {
    try {
      const raw = sessionStorage.getItem('pendingChariowCheckout');
      if (raw) pendingChariowCheckout = JSON.parse(raw);
    } catch {
      // ignore
    }
  }
  const chariowProvider = searchParams.get('provider') === 'chariow';
  const chariowPaymentId = pendingChariowCheckout.paymentId;

  const plan      = searchParams.get('plan') ?? pendingCheckout.plan ?? pendingChariowCheckout.plan ?? '';
  const immediate = searchParams.get('immediate') === 'true' || motekiStatus === 'success';
  const failed    = searchParams.get('failed') === 'true' || motekiStatus === 'cancel';

  const { subscription, isLoading, refetch } = useSubscription();

  // État initial selon les params
  const getInitialStatus = (): PageStatus => {
    if (failed)    return 'failed';
    if (immediate) return 'checking';
    if (chariowProvider) return 'checking'; // on vérifie tout de suite, jamais d'hypothèse a priori
    return 'waiting';
  };

  const [status,    setStatus]    = useState<PageStatus>(getInitialStatus);
  const [countdown, setCountdown] = useState(10);
  const [attempts,  setAttempts]  = useState(0);
  const [isChecking, setIsChecking] = useState(false);

  // 🛒 Moteki : on ne dépend pas du webhook pour savoir si c'est payé — on
  // interroge nous-mêmes la commande dès l'arrivée sur cette page (au lieu
  // d'attendre le prochain passage du cron de polling, toutes les 5 min).
  // Best-effort : si ça échoue (paiement encore en cours côté opérateur),
  // le countdown "waiting" classique + le cron prennent le relais.
  useEffect(() => {
    if (motekiStatus !== 'success' || !pendingCheckout.paymentId) return;
    (async () => {
      try {
        await api.post(`/subscriptions/moteki/check-order/${pendingCheckout.paymentId}`, {});
      } catch {
        // pas grave — le cron de polling réessaiera dans les minutes qui suivent
      } finally {
        refetch();
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 🛒 Chariow : même principe que Moteki ci-dessus — même chose en best-
  // effort, le cron `check-pending-chariow-sales` (toutes les 5 min) prend
  // le relais si cet appel échoue ou si le paiement n'est pas encore traité.
  useEffect(() => {
    if (!chariowProvider || !chariowPaymentId) return;
    (async () => {
      try {
        await api.post(`/subscriptions/chariow/check-sale/${chariowPaymentId}`, {});
      } catch {
        // pas grave — le cron de polling réessaiera dans les minutes qui suivent
      } finally {
        refetch();
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


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
      try {
        sessionStorage.removeItem('pendingSubscriptionCheckout');
        sessionStorage.removeItem('pendingChariowCheckout');
      } catch {}
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
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-6">
        <div className="text-center glass-panel p-10 rounded-2xl max-w-md w-full">
          <div className="relative mb-6">
            <div className="w-20 h-20 mx-auto bg-emerald-500/10 rounded-full flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
            </div>
            <Sparkles className="w-6 h-6 text-amber-400 absolute top-0 right-1/3 animate-bounce" />
          </div>
          <h2 className="text-xl font-bold mb-2 text-emerald-500">
            Vérification en cours…
          </h2>
          <p className="text-[var(--text-muted)] text-sm">
            On vérifie l'activation de votre abonnement
          </p>
        </div>
      </div>
    );
  }

  // ✅ SUCCÈS
  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <Sparkles className="w-10 h-10 text-amber-400 absolute top-10 left-10 animate-pulse" />
          <Sparkles className="w-7 h-7 text-emerald-400 absolute top-20 right-20 animate-bounce" />
          <Sparkles className="w-9 h-9 text-amber-400 absolute bottom-20 left-1/4 animate-pulse" />
        </div>

        <div className="max-w-md w-full glass-panel p-8 rounded-2xl shadow-2xl relative z-10">
          <div className="text-center mb-6">
            <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
              <CheckCircle className="w-14 h-14 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-bold mb-2 text-emerald-500">
              Félicitations ! 🎉
            </h1>
            <p className="text-[var(--text)] font-medium">
              Votre abonnement est activé
            </p>
          </div>

          {subscription && (
            <div className="bg-emerald-500/10 rounded-xl p-5 mb-6 border border-emerald-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Crown className="w-5 h-5 text-emerald-500" />
                </div>
                <span className="font-bold text-[var(--text)]">Votre plan actuel</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-[var(--surface)] rounded-lg">
                  <span className="text-sm text-[var(--text-muted)]">Plan</span>
                  <span className="font-bold text-lg text-emerald-500">
                    {PLAN_LABELS[subscription.plan] ?? subscription.plan}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-[var(--surface)] rounded-lg">
                  <span className="text-sm text-[var(--text-muted)]">Statut</span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white">
                    <CheckCircle className="w-3.5 h-3.5" />
                    {subscription.status === 'TRIALING' ? 'Essai gratuit' : 'Actif'}
                  </span>
                </div>
                {subscription.currentPeriodEnd && (
                  <div className="flex justify-between items-center p-3 bg-[var(--surface)] rounded-lg">
                    <span className="text-sm text-[var(--text-muted)]">Valide jusqu'au</span>
                    <span className="font-semibold text-sm text-[var(--text)]">
                      {new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </span>
                  </div>
                )}
                {/* FREE plan info si retour au gratuit */}
                {subscription.plan === 'FREE' && (
                  <div className="p-3 bg-[var(--surface-2)] rounded-lg border border-[var(--border)]">
                    <p className="text-xs text-[var(--text-muted)] text-center">
                      Vous êtes sur le plan gratuit. Vous pouvez upgrader à tout moment.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-emerald-500/10 rounded-lg p-4 mb-6 border border-emerald-500/20">
            <p className="text-sm text-emerald-500 text-center">
              🚀 Vous avez accès à toutes les fonctionnalités de votre plan !
            </p>
          </div>

          <div className="space-y-3">
            <Link href="/dashboard" className="block">
              <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 group">
                <span>Aller au tableau de bord</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <Link href="/parametres/subscription" className="block">
              <button className="w-full bg-[var(--surface)] text-[var(--text)] font-semibold py-3 px-6 rounded-xl border-2 border-[var(--border)] hover:border-emerald-500/40 transition-colors">
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
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-6">
        <div className="glass-panel p-8 rounded-2xl max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--text)] mb-2">
              Paiement échoué
            </h1>
            <p className="text-[var(--text-muted)] text-sm">
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
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
            >
              <Rocket className="w-4 h-4" />
              Réessayer le paiement
            </button>
            <Link href="/dashboard" className="block">
              <button className="w-full bg-[var(--surface)] text-[var(--text-muted)] font-semibold py-3 px-6 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors">
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
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-6">
      <div className="glass-panel p-8 rounded-2xl max-w-md w-full">
        <div className="text-center mb-6">
          <div className="relative inline-block mb-4">
            <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto">
              <Phone className="w-10 h-10 text-amber-500" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text)] mb-2">
            En attente de confirmation
          </h1>
          <p className="text-[var(--text-muted)] text-sm">
            {plan ? (
              <>
                Paiement pour le plan{' '}
                <span className="font-bold text-amber-500">
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
        <div className="bg-[var(--surface)] rounded-xl p-4 mb-4 border border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-[var(--text-muted)]" style={{ animation: 'spin 3s linear infinite' }} />
            <span className="text-sm text-[var(--text-muted)]">Vérification dans</span>
          </div>
          <span className="text-xl font-bold text-emerald-500 font-mono tabular-nums">
            {countdown}s
          </span>
        </div>

        {/* Tentatives */}
        {attempts > 0 && (
          <div className="bg-emerald-500/10 rounded-lg p-3 mb-4 text-center border border-emerald-500/20">
            <p className="text-xs text-emerald-500">
              Vérification n°{attempts + 1} — Pas encore activé, on continue…
            </p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleManualCheck}
            disabled={isChecking}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isChecking
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Vérification…</>
              : <><RefreshCw className="w-4 h-4" /> Vérifier maintenant</>
            }
          </button>

          <Link href="/parametres/subscription" className="block">
            <button className="w-full bg-[var(--surface)] text-[var(--text-muted)] font-semibold py-3 px-6 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors text-sm">
              Voir mon abonnement
            </button>
          </Link>

          <p className="text-[11px] text-center text-[var(--text-muted)]">
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
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}