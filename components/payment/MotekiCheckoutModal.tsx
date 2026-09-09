'use client';

// ============================================================================
// components/payment/MotekiCheckoutModal.tsx
// ============================================================================
// Remplace les anciens PaymentModal dupliqués (Yabetoo, 2 étapes intent →
// confirm) par un flux Moteki en une seule étape : on collecte
// opérateur+téléphone, on appelle /subscriptions/upgrade/moteki, puis on
// redirige le navigateur vers la page de paiement hébergée par Moteki
// (checkout_url). Moteki lui-même gère l'écran "confirmez sur votre
// téléphone" ensuite — on n'a plus besoin de le simuler côté app.
//
// Au retour, Moteki renvoie le client vers l'URL configurée sur le store
// Moteki (dashboard → Paramètres), avec ?status=success ou ?status=cancel.
// Cette URL doit être réglée sur .../success côté Moteki. On mémorise le
// plan choisi en sessionStorage juste avant de rediriger, car l'URL de
// retour est fixe côté Moteki et ne peut pas porter nos propres query params
// (voir /success/page.tsx qui lit ce fallback).
// ============================================================================

import React, { useEffect, useState } from 'react';
import { Loader2, X, Phone, ChevronDown, Mail, User as UserIcon } from 'lucide-react';
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
}

// ─── Composant ───────────────────────────────────────────────────────────────

export function MotekiCheckoutModal({
  plan,
  billingPeriod,
  planLabel,
  amount,
  onClose,
  onError,
}: MotekiCheckoutModalProps) {
  const { user } = useAuth();

  const [operators, setOperators] = useState<string[]>([]);
  const [operator, setOperator] = useState<string>('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(user?.email ?? '');
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [loading, setLoading] = useState(false);

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
        // pré-remplie, mais le reste du formulaire reste utilisable une
        // fois Moteki configuré. On ne bloque pas l'affichage du modal
        // pour ça.
      } finally {
        if (!cancelled) setLoadingMethods(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
      const result = await api.post<{ checkoutUrl: string; orderNumber: string; paymentId: string }>(
        '/subscriptions/upgrade/moteki',
        {
          plan,
          billingPeriod,
          customerFirstName: user?.firstName || 'Client',
          customerLastName: user?.lastName || '',
          customerEmail: email,
          customerPhone: phone,
          paymentMethod: 'mobile_money',
          paymentOperator: operator,
        },
      );

      // On mémorise le contexte pour /success — l'URL de retour Moteki est
      // fixe (configurée sur le dashboard) et ne portera pas ces infos.
      sessionStorage.setItem(
        'pendingSubscriptionCheckout',
        JSON.stringify({ plan, billingPeriod, orderNumber: result.orderNumber, paymentId: result.paymentId }),
      );

      window.location.href = result.checkoutUrl;
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
            {loading ? 'Redirection…' : 'Continuer le paiement'}
          </button>

          <p className="text-[11px] text-center text-gray-400">
            Vous serez redirigé vers la page de paiement sécurisée Moteki pour confirmer
            via {OPERATOR_LABELS[operator] ?? 'votre opérateur'}.
          </p>
        </div>
      </div>
    </div>
  );
}