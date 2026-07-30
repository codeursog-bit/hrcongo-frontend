'use client';

// ============================================================================
// components/payment/PaymentModal.tsx
// Modal paiement Mobile Money — partagé entre entreprise et cabinet
// ============================================================================
// IMPORTANT : Ce composant est EXTRAIT du code existant de
// app/(dashboard)/parametres/subscription/page.tsx — logique INCHANGÉE.
// L'ancien PaymentModal inline dans subscription/page.tsx peut soit rester
// tel quel (aucun risque), soit importer ce composant à la place.
// ============================================================================

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, X, Phone, ChevronDown } from 'lucide-react';
import { api } from '@/services/api';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PaymentIntent {
  intentId:     string;
  clientSecret: string;
  paymentId?:   string;
  plan:         string;
  planLabel?:   string;
  billingPeriod?: string;
  amount:       number;
}

export type MobileOperator = 'MTN' | 'AIRTEL' | 'ORANGE';

export const OPERATORS: { value: MobileOperator; label: string }[] = [
  { value: 'MTN',    label: 'MTN Mobile Money' },
  { value: 'AIRTEL', label: 'Airtel Money'     },
  { value: 'ORANGE', label: 'Orange Money'     },
];

export interface PaymentModalProps {
  intent:         PaymentIntent;
  planLabel:      string;
  /** Route de l'endpoint de confirmation — différente pour cabinet et entreprise */
  confirmEndpoint: string;
  /** URL de redirection après succès */
  successUrl:     string;
  onClose:        () => void;
  onSuccess:      () => void;
  onError:        (msg: string) => void;
}

// ─── Composant ───────────────────────────────────────────────────────────────

export function PaymentModal({
  intent,
  planLabel,
  confirmEndpoint,
  successUrl,
  onClose,
  onSuccess,
  onError,
}: PaymentModalProps) {
  const [phone,    setPhone]    = useState('');
  const [operator, setOperator] = useState<MobileOperator>('MTN');
  const [loading,  setLoading]  = useState(false);
  const [step,     setStep]     = useState<'form' | 'waiting'>('form');
  const router = useRouter();

  const handleConfirm = async () => {
    if (!phone || phone.length < 9) {
      onError('Numéro de téléphone invalide (9 chiffres minimum)');
      return;
    }
    setLoading(true);
    try {
      const result = await api.post<{ status: string; message: string }>(confirmEndpoint, {
        intentId:     intent.intentId,
        clientSecret: intent.clientSecret,
        phone,
        operator,
      });

      if (result.status === 'succeeded') {
        router.push(`${successUrl}?plan=${intent.plan}&immediate=true`);
        onClose();
        onSuccess();
      } else {
        setStep('waiting');
      }
    } catch {
      onError("Erreur lors de l'envoi du paiement. Vérifiez votre numéro.");
    } finally {
      setLoading(false);
    }
  };

  const handleWaitingDone = () => {
    router.push(`${successUrl}?plan=${intent.plan}&waiting=true`);
    onClose();
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">Paiement Mobile Money</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Plan {planLabel} · {intent.amount.toLocaleString('fr-FR')} FCFA/mois
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={15} className="text-gray-500" />
          </button>
        </div>

        {/* ── Étape 1 : saisie ── */}
        {step === 'form' ? (
          <div className="p-5 space-y-4">

            {/* Opérateur */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                Opérateur
              </label>
              <div className="relative">
                <select
                  value={operator}
                  onChange={e => setOperator(e.target.value as MobileOperator)}
                  className="w-full appearance-none bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 cursor-pointer"
                >
                  {OPERATORS.map(op => (
                    <option key={op.value} value={op.value}>{op.label}</option>
                  ))}
                </select>
                <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
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
                  onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="06 XXX XX XX"
                  maxLength={9}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-20 pr-4 py-3 text-sm font-mono text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 placeholder:text-gray-300 dark:placeholder:text-gray-600"
                />
              </div>
              <p className="mt-1.5 text-[11px] text-gray-400">
                Le numéro associé à votre compte {OPERATORS.find(o => o.value === operator)?.label}
              </p>
            </div>

            {/* Montant */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Montant à payer</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white font-mono">
                {intent.amount.toLocaleString('fr-FR')} FCFA
              </span>
            </div>

            {/* Bouton confirmer */}
            <button
              onClick={handleConfirm}
              disabled={loading || !phone}
              className="w-full py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? 'Envoi en cours…' : 'Confirmer le paiement'}
            </button>

            <p className="text-[11px] text-center text-gray-400">
              Une demande de paiement sera envoyée sur votre téléphone. Confirmez-la pour activer votre abonnement.
            </p>
          </div>

        ) : (
          /* ── Étape 2 : en attente de confirmation ── */
          <div className="p-6 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Phone size={24} className="text-gray-600 dark:text-gray-300" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                Confirmez sur votre téléphone
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Une demande de{' '}
                <span className="font-bold text-gray-700 dark:text-gray-300">
                  {intent.amount.toLocaleString('fr-FR')} FCFA
                </span>{' '}
                a été envoyée au{' '}
                <span className="font-mono font-bold text-gray-700 dark:text-gray-300">+242 {phone}</span>{' '}
                via {OPERATORS.find(o => o.value === operator)?.label}.
              </p>
            </div>
            <div className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 text-left space-y-1.5">
              <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Instructions</p>
              <p className="text-xs text-gray-600 dark:text-gray-300">1. Ouvrez la notification sur votre téléphone</p>
              <p className="text-xs text-gray-600 dark:text-gray-300">2. Entrez votre code PIN Mobile Money</p>
              <p className="text-xs text-gray-600 dark:text-gray-300">3. Revenez ici et cliquez sur "J'ai confirmé"</p>
            </div>
            <button
              onClick={handleWaitingDone}
              className="w-full py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold transition-all hover:opacity-90"
            >
              J'ai confirmé le paiement
            </button>
            <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              Annuler
            </button>
          </div>
        )}
      </div>
    </div>
  );
}