'use client';

// ============================================================================
// components/payment/MotekiCheckoutModal.tsx
// ============================================================================
// ⚠️ MIGRATION v1 → v2 (Merchant Payments API). Contrairement à l'ancien
// flux v1 (redirection vers une page Moteki hébergée), le flux v2 ne
// redirige JAMAIS le navigateur : on envoie un push Mobile Money directement
// au numéro du client (code PIN/USSD à valider sur son téléphone), puis on
// sonde nous-mêmes le statut du paiement (pas de webhook v2 documenté — "le
// polling fait foi"). Ce modal ne quitte donc plus la page : il affiche un
// écran d'attente avec sondage automatique, jusqu'à un état final.
// ============================================================================

import React, { useEffect, useRef, useState } from 'react';
import { Loader2, X, Phone, ChevronDown, Mail, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';

// ─── Types ───────────────────────────────────────────────────────────────────

interface MotekiPaymentMethodOption {
  payment_method: 'mobile_money' | 'card' | 'aggregator';
  payment_operators: string[];
}

const OPERATOR_LABELS: Record<string, string> = {
  'mtn-cg': 'MTN Mobile Money',
  'airtel-cg': 'Airtel Money',
  'orange-cg': 'Orange Money',
};

export interface MotekiCheckoutModalProps {
  plan: 'BASIC' | 'PRO' | 'ENTERPRISE';
  billingPeriod: 'monthly' | 'yearly';
  planLabel: string;
  amount: number;
  onClose: () => void;
  onError: (msg: string) => void;
  /** Appelé une fois le paiement confirmé payé — le parent redirige vers /success. */
  onSuccess: () => void;
}

type ModalPhase = 'form' | 'waiting' | 'succeeded' | 'failed';

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 20; // ~60s de sondage avant d'abandonner l'attente active

// ─── Composant ───────────────────────────────────────────────────────────────

export function MotekiCheckoutModal({
  plan,
  billingPeriod,
  planLabel,
  amount,
  onClose,
  onError,
  onSuccess,
}: MotekiCheckoutModalProps) {
  const { user } = useAuth();

  const [operators, setOperators] = useState<string[]>([]);
  const [operator, setOperator] = useState<string>('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(user?.email ?? '');
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [loading, setLoading] = useState(false);

  const [phase, setPhase] = useState<ModalPhase>('form');
  const [failMessage, setFailMessage] = useState('');
  const pollAttempts = useRef(0);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Charger dynamiquement les opérateurs activés côté Moteki ─────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const methods = await api.get<MotekiPaymentMethodOption[]>(
          '/subscriptions/moteki/payment-methods',
        );
        const momo = methods.find((m) => m.payment_method === 'mobile_money');
        if (!cancelled) {
          const ops = momo?.payment_operators ?? [];
          setOperators(ops);
          if (ops.length > 0) setOperator(ops[0]);
        }
      } catch {
        // Repli silencieux — au pire l'utilisateur ne verra pas de liste
        // pré-remplie, mais le reste du formulaire reste utilisable.
      } finally {
        if (!cancelled) setLoadingMethods(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Nettoyage du timer de polling si le modal se démonte en cours d'attente
  useEffect(() => {
    return () => {
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
  }, []);

  const pollPayment = (paymentId: string) => {
    pollTimer.current = setTimeout(async () => {
      pollAttempts.current += 1;
      try {
        const result = await api.post<{ activated: boolean; status: string }>(
          `/subscriptions/moteki/check-order/${paymentId}`,
          {},
        );
        if (result.activated) {
          setPhase('succeeded');
          setTimeout(onSuccess, 1200);
          return;
        }
        if (result.status === 'failed') {
          setPhase('failed');
          setFailMessage("Le paiement a échoué ou a été refusé sur votre téléphone.");
          return;
        }
      } catch {
        // Erreur réseau ponctuelle — on continue le sondage, pas d'abandon
        // sur un seul échec de requête.
      }

      if (pollAttempts.current >= MAX_POLL_ATTEMPTS) {
        // On abandonne l'attente ACTIVE (l'utilisateur ne va pas rester 5
        // minutes sur cette modale) — mais le cron de polling côté serveur
        // (toutes les 5 min) continue de vérifier en arrière-plan, donc
        // l'abonnement s'activera quand même si le paiement finit par passer.
        setPhase('failed');
        setFailMessage(
          "Toujours en attente de votre part. Si vous avez validé le paiement, votre abonnement s'activera automatiquement dans quelques minutes — sinon réessayez.",
        );
        return;
      }
      pollPayment(paymentId);
    }, POLL_INTERVAL_MS);
  };

  const handleConfirm = async () => {
    if (!phone || phone.length < 9) {
      onError('Numéro de téléphone invalide (9 chiffres minimum)');
      return;
    }
    if (!email) {
      onError('Adresse email requise pour le reçu de paiement');
      return;
    }
    if (!operator) {
      onError('Sélectionnez un opérateur mobile money');
      return;
    }

    setLoading(true);
    try {
      const result = await api.post<{
        paymentId: string;
        paymentReference: string;
        orderNumber: string;
        status: 'processing' | 'succeeded' | 'failed';
        activated: boolean;
        code?: string;
        message?: string;
      }>('/subscriptions/upgrade/moteki', {
        plan,
        billingPeriod,
        customerFirstName: user?.firstName || 'Client',
        customerLastName: user?.lastName || '',
        customerEmail: email,
        customerPhone: phone,
        paymentMethod: 'mobile_money',
        paymentOperator: operator,
      });

      if (result.status === 'succeeded' || result.activated) {
        setPhase('succeeded');
        setTimeout(onSuccess, 1200);
        return;
      }

      if (result.status === 'failed') {
        setPhase('failed');
        setFailMessage(result.message || 'Le paiement a été refusé.');
        setLoading(false);
        return;
      }

      // 'processing' — push envoyé, on bascule sur l'écran d'attente et on
      // sonde nous-mêmes (pas de webhook v2).
      setPhase('waiting');
      pollAttempts.current = 0;
      pollPayment(result.paymentId);
    } catch (err: any) {
      onError(
        err?.message ||
          "Erreur lors de l'initiation du paiement. Vérifiez votre numéro et réessayez.",
      );
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">Paiement Mobile Money</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Plan {planLabel} · {amount.toLocaleString('fr-FR')} FCFA
              {billingPeriod === 'yearly' ? '/an' : '/mois'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={15} className="text-gray-500" />
          </button>
        </div>

        {/* Écran d'attente (push envoyé, en attente de validation PIN/USSD) */}
        {phase === 'waiting' && (
          <div className="p-6 flex flex-col items-center text-center gap-3">
            <Loader2 size={28} className="animate-spin text-gray-400" />
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              Validez le paiement sur votre téléphone
            </p>
            <p className="text-xs text-gray-400">
              Un push a été envoyé au {phone} via {OPERATOR_LABELS[operator] ?? 'votre opérateur'}.
              Entrez votre code PIN pour confirmer.
            </p>
            <p className="text-[11px] text-gray-300 mt-2">Vérification automatique en cours…</p>
          </div>
        )}

        {/* Écran succès */}
        {phase === 'succeeded' && (
          <div className="p-6 flex flex-col items-center text-center gap-3">
            <CheckCircle2 size={32} className="text-emerald-500" />
            <p className="text-sm font-bold text-gray-900 dark:text-white">Paiement confirmé !</p>
            <p className="text-xs text-gray-400">Votre abonnement {planLabel} est en cours d'activation…</p>
          </div>
        )}

        {/* Écran échec */}
        {phase === 'failed' && (
          <div className="p-6 flex flex-col items-center text-center gap-3">
            <XCircle size={32} className="text-red-500" />
            <p className="text-sm font-bold text-gray-900 dark:text-white">Paiement non confirmé</p>
            <p className="text-xs text-gray-400">{failMessage}</p>
            <button
              onClick={() => {
                setPhase('form');
                setLoading(false);
              }}
              className="mt-2 px-4 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold hover:opacity-90"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Formulaire initial */}
        {phase === 'form' && (
        <div className="p-5 space-y-4">
          {/* Opérateur */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
              Opérateur
            </label>
            <div className="relative">
              <select
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                disabled={loadingMethods || operators.length === 0}
                className="w-full appearance-none bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 cursor-pointer disabled:opacity-50"
              >
                {loadingMethods && <option>Chargement…</option>}
                {!loadingMethods && operators.length === 0 && (
                  <option>Aucun opérateur disponible</option>
                )}
                {operators.map((op) => (
                  <option key={op} value={op}>
                    {OPERATOR_LABELS[op] ?? op}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={15}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>

          {/* Téléphone */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
              Numéro de téléphone
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                <Phone size={14} className="text-gray-400" />
                <span className="text-xs text-gray-400 font-mono">+242</span>
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="06 XXX XX XX"
                maxLength={9}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-20 pr-4 py-3 text-sm font-mono text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 placeholder:text-gray-300 dark:placeholder:text-gray-600"
              />
            </div>
          </div>

          {/* Email (pré-rempli, éditable pour le reçu) */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
              Email (reçu de paiement)
            </label>
            <div className="relative">
              <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@entreprise.com"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 placeholder:text-gray-300 dark:placeholder:text-gray-600"
              />
            </div>
          </div>

          {/* Montant */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">Montant à payer</span>
            <span className="text-sm font-bold text-gray-900 dark:text-white font-mono">
              {amount.toLocaleString('fr-FR')} FCFA
            </span>
          </div>

          {/* Bouton confirmer */}
          <button
            onClick={handleConfirm}
            disabled={loading || !phone || !operator}
            className="w-full py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {loading ? 'Envoi du push…' : 'Payer maintenant'}
          </button>

          <p className="text-[11px] text-center text-gray-400">
            Un push sera envoyé sur votre téléphone via {OPERATOR_LABELS[operator] ?? 'votre opérateur'} —
            validez-le avec votre code PIN.
          </p>
        </div>
        )}
      </div>
    </div>
  );
}