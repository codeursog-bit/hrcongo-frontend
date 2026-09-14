'use client';

// ============================================================================
// components/payment/ChariowCheckoutModal.tsx
// ============================================================================
// Plus simple que MotekiCheckoutModal : Chariow affiche lui-même le choix
// de l'opérateur (MTN/Airtel/Orange/carte) sur sa page de checkout hébergée
// — on n'a besoin de collecter que l'identité du client + un code de
// réduction optionnel, puis de rediriger vers checkoutUrl.
//
// Comme pour Moteki, le paymentId (généré côté backend après l'appel à
// Chariow) est mémorisé en sessionStorage juste avant la redirection, et
// relu par /success/page.tsx au retour — impossible de le porter dans
// redirect_url puisqu'il n'existe pas encore au moment où on l'envoie.
// ============================================================================

import React, { useState } from 'react';
import { Loader2, X, Phone, Mail, User as UserIcon, Tag } from 'lucide-react';
import { api } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';

export interface ChariowCheckoutModalProps {
  plan: 'BASIC' | 'PRO' | 'ENTERPRISE';
  billingPeriod: 'monthly' | 'yearly';
  planLabel: string;
  amount: number;
  onClose: () => void;
  onError: (msg: string) => void;
}

export function ChariowCheckoutModal({
  plan,
  billingPeriod,
  planLabel,
  amount,
  onClose,
  onError,
}: ChariowCheckoutModalProps) {
  const { user } = useAuth();

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [showDiscount, setShowDiscount] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!firstName || !lastName) {
      onError('Prénom et nom requis');
      return;
    }
    if (!email) {
      onError('Adresse email requise');
      return;
    }
    if (!phone || phone.length < 9) {
      onError('Numéro de téléphone invalide (9 chiffres minimum)');
      return;
    }

    setLoading(true);
    try {
      // ⚠️ Le paymentId n'existe que côté backend APRÈS l'appel à Chariow
      // (il est créé une fois la réponse de /checkout reçue) — impossible
      // de l'inclure dans redirect_url puisque ce champ part DANS la
      // requête de création. On retombe donc sur sessionStorage, exactement
      // comme pour Moteki (voir /success/page.tsx) : redirect_url ne sert
      // ici qu'à dire à Chariow "reviens sur notre page /success", le
      // paymentId précis est relu depuis sessionStorage à l'arrivée.
      const redirectUrl = `${window.location.origin}/success?provider=chariow`;

      const result = await api.post<{
        paymentId: string;
        saleId: string;
        checkoutUrl: string;
      }>('/subscriptions/upgrade/chariow', {
        plan,
        billingPeriod,
        customerFirstName: firstName,
        customerLastName: lastName,
        customerEmail: email,
        customerPhoneNumber: phone,
        customerPhoneCountryCode: 'CG',
        discountCode: discountCode || undefined,
        redirectUrl,
      });

      sessionStorage.setItem(
        'pendingChariowCheckout',
        JSON.stringify({ plan, billingPeriod, paymentId: result.paymentId }),
      );

      window.location.href = result.checkoutUrl;
    } catch (err: any) {
      onError(
        err?.message ||
          "Erreur lors de l'initiation du paiement. Vérifiez vos informations et réessayez.",
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
            <p className="text-sm font-bold text-gray-900 dark:text-white">Paiement Chariow</p>
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
          {/* Prénom / Nom */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                Prénom
              </label>
              <div className="relative">
                <UserIcon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jean"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-9 pr-3 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 placeholder:text-gray-300 dark:placeholder:text-gray-600"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                Nom
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Dupont"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 placeholder:text-gray-300 dark:placeholder:text-gray-600"
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

          {/* Email */}
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

          {/* Code de réduction (repliable) */}
          {!showDiscount ? (
            <button
              onClick={() => setShowDiscount(true)}
              className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1.5"
            >
              <Tag size={12} /> J'ai un code de réduction
            </button>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                Code de réduction
              </label>
              <div className="relative">
                <Tag size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                  placeholder="SAVE20"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-3 text-sm font-mono text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 placeholder:text-gray-300 dark:placeholder:text-gray-600"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5">
                Le code sera vérifié par Chariow au moment du paiement.
              </p>
            </div>
          )}

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
            disabled={loading || !phone || !firstName || !lastName || !email}
            className="w-full py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {loading ? 'Redirection…' : 'Continuer le paiement'}
          </button>

          <p className="text-[11px] text-center text-gray-400">
            Vous serez redirigé vers la page de paiement sécurisée Chariow
            (mobile money ou carte, au choix).
          </p>
        </div>
      </div>
    </div>
  );
}