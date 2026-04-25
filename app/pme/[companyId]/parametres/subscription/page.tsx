'use client';

// ============================================================================
// app/pme/[companyId]/parametres/subscription/page.tsx
// Page abonnement PME — affichage différent selon gestion cabinet ou normale
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Crown, ChevronLeft, CheckCircle, XCircle, Calendar,
  Loader2, AlertTriangle, Sparkles, Info, Shield,
} from 'lucide-react';
import { api } from '@/services/api';

interface Subscription {
  plan:             string;
  status:           string;
  currentPeriodEnd: string;
  trialEndsAt?:     string | null;
  pricePerMonth:    number;
  currency:         string;
  isCabinetManaged?: boolean;
  cabinetName?:     string | null;
  planDetails?: {
    name: string;
    limits: Record<string, any>;
  };
  payments?: Array<{
    id: string; amount: number; currency: string;
    status: string; createdAt: string; description?: string;
  }>;
}

const STATUS_STYLES: Record<string, { color: string; bg: string; label: string; icon: React.ReactNode }> = {
  ACTIVE:   { color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-100 dark:bg-emerald-900/30', label: 'Actif',         icon: <CheckCircle size={12} /> },
  TRIALING: { color: 'text-blue-700 dark:text-blue-300',       bg: 'bg-blue-100 dark:bg-blue-900/30',       label: 'Essai gratuit', icon: <Sparkles size={12} /> },
  CANCELED: { color: 'text-red-700 dark:text-red-300',         bg: 'bg-red-100 dark:bg-red-900/30',         label: 'Annulé',        icon: <XCircle size={12} /> },
  PAST_DUE: { color: 'text-orange-700 dark:text-orange-300',   bg: 'bg-orange-100 dark:bg-orange-900/30',   label: 'En retard',     icon: <AlertTriangle size={12} /> },
  PAUSED:   { color: 'text-gray-600 dark:text-gray-400',       bg: 'bg-gray-100 dark:bg-gray-800',          label: 'Pausé',         icon: <AlertTriangle size={12} /> },
};

export default function PmeSubscriptionPage() {
  const params    = useParams();
  const companyId = params.companyId as string;

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading,    setIsLoading]    = useState(true);

  useEffect(() => {
    api.get<Subscription>('/subscriptions/current')
      .then((data: any) => setSubscription(data))
      .catch(() => null)
      .finally(() => setIsLoading(false));
  }, []);

  const statusStyle = STATUS_STYLES[subscription?.status ?? 'ACTIVE'] ?? STATUS_STYLES.ACTIVE;

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-gray-400" size={28} />
      </div>
    );
  }

  // ── PME gérée par cabinet ────────────────────────────────────────────────
  if (subscription?.isCabinetManaged) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 pb-20">

        <div className="flex items-center gap-3 mb-6">
          <Link
            href={`/pme/${companyId}/parametres`}
            className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft size={18} className="text-gray-500" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Shield size={18} color="white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white">Abonnement</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Géré par votre cabinet comptable</p>
          </div>
        </div>

        {/* Card principale */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
              <Shield size={22} className="text-violet-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                {subscription.cabinetName ?? 'Cabinet comptable'}
              </p>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${statusStyle.bg} ${statusStyle.color}`}>
                {statusStyle.icon} {statusStyle.label}
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <Crown size={13} /> Plan
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                Géré par cabinet
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <Calendar size={13} /> Valide jusqu'au
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-FR', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Facturation</span>
              <span className="font-semibold text-emerald-600">
                Inclus dans l'abonnement cabinet
              </span>
            </div>
          </div>
        </div>

        {/* Features débloquées */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            Fonctionnalités incluses
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              'Gestion des employés',
              'Présences & GPS',
              'Congés & provisions',
              'Contrats & documents',
              'Performances',
              'Formation',
              'Recrutement',
              'Rapports & analyses',
            ].map(f => (
              <div key={f} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                <CheckCircle size={12} className="text-emerald-500 shrink-0" />
                {f}
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-700">
            <Info size={11} className="shrink-0" />
            La génération de bulletins de paie est gérée directement par votre cabinet.
          </div>
        </div>

        {/* Info si abonnement suspendu */}
        {subscription.status === 'PAST_DUE' && (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
            <AlertTriangle size={16} className="text-orange-500 shrink-0 mt-0.5" />
            <p className="text-sm text-orange-700 dark:text-orange-300">
              L'abonnement de votre cabinet est en retard de paiement.
              Contactez votre cabinet pour régulariser la situation.
            </p>
          </div>
        )}
      </div>
    );
  }

  // ── PME normale (abonnement propre) → affichage standard ────────────────
  // Re-diriger vers le composant normal - on import la page subscription standard
  // En pratique, cette branche sera rarement atteinte ici car la PME normale
  // accède via /parametres/subscription (dashboard), pas /pme/[id]/parametres/subscription

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/pme/${companyId}/parametres`}
          className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
        >
          <ChevronLeft size={18} className="text-gray-500" />
        </Link>
        <h1 className="text-xl font-black text-gray-900 dark:text-white">Abonnement</h1>
      </div>

      {subscription ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Crown size={20} className="text-amber-500" />
            <div>
              <p className="font-bold text-gray-900 dark:text-white">
                Plan {subscription.planDetails?.name ?? subscription.plan}
              </p>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${statusStyle.bg} ${statusStyle.color}`}>
                {statusStyle.icon} {statusStyle.label}
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Pour gérer votre abonnement, rendez-vous dans les paramètres complets.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 text-center text-gray-400 text-sm">
          Aucun abonnement trouvé.
        </div>
      )}
    </div>
  );
}