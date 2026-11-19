'use client';
import { LegacyReminderToast, LegacyLastCallModal } from '@/components/providers/legacy-feedback';
import { FeedbackVariants, FeedbackViewport, FeedbackToast } from '@/components/ui/Feedback';
import { Modal } from '@/components/design-system/feedback';
import { Button } from '@/components/design-system/primitives';
import '@/components/design-system/design-system.css';

// ============================================================================
// 🔔 SubscriptionReminderProvider
// ----------------------------------------------------------------------------
// Rappelle à l'admin/RH que l'essai ou l'abonnement payant de l'entreprise
// arrive à échéance : toast doux à J-7, toast plus visible à J-3, modal
// difficile à ignorer à J-1 (dernier jour). Un seul affichage par palier et
// par jour (dédoublonné en localStorage) pour ne pas spammer à chaque
// changement de page.
//
// Ne s'affiche JAMAIS pour les employés (rôle EMPLOYEE/MANAGER) — la
// facturation ne les concerne pas ; côté employé, c'est le blocage doux
// "Accès bloqué, contactez votre RH" (côté backend) qui prend le relais si
// l'entreprise finit par repasser en Gratuit.
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';


import { useSubscription } from '@/hooks/useSubscription';

// ============================================================================
// 🔑 HELPERS
// ============================================================================

const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'];

function getStoredRole(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.role ?? null;
  } catch {
    return null;
  }
}

const todayKey = () => new Date().toISOString().slice(0, 10);

/** Un seul affichage par palier (7/3/1) et par jour civil, par entreprise. */
function alreadyShownToday(dedupKey: string): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(dedupKey) === todayKey();
}
function markShownToday(dedupKey: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(dedupKey, todayKey());
}

// ============================================================================
// 🍞 TOAST (J-7 / J-3)
// ============================================================================

interface ReminderToastProps {
  visible: boolean;
  urgency: 'info' | 'warning';
  daysLeft: number;
  kind: 'essai' | 'abonnement';
  onClose: () => void;
  onRenew: () => void;
}

const ReminderToast: React.FC<ReminderToastProps> = props => <FeedbackVariants legacy={<LegacyReminderToast {...props} />}><FeedbackViewport position="reminder" label="Abonnement">{props.visible && <FeedbackToast tone={props.urgency} title={props.kind === 'essai' ? 'Votre essai arrive à échéance' : 'Votre abonnement arrive à échéance'} message={`Il vous reste ${props.daysLeft} jour${props.daysLeft > 1 ? 's' : ''}. Renouvelez pour conserver l’accès complet.`} onClose={props.onClose}><button type="button" className="k-button k-button-primary" onClick={props.onRenew}>Renouveler</button><button type="button" className="k-button k-button-ghost" onClick={props.onClose}>Plus tard</button></FeedbackToast>}</FeedbackViewport></FeedbackVariants>;

// ============================================================================
// 🚨 MODAL (J-1 — dernier jour)
// ============================================================================

interface ReminderModalProps {
  isOpen: boolean;
  kind: 'essai' | 'abonnement';
  planName?: string;
  onClose: () => void;
  onRenew: () => void;
}

const LastCallModal: React.FC<ReminderModalProps> = props => <FeedbackVariants legacy={<LegacyLastCallModal {...props} />}><Modal open={props.isOpen} onClose={props.onClose} title={props.kind === 'essai' ? 'Votre essai se termine' : 'Votre abonnement se termine'} actions={<><Button variant="secondary" onClick={props.onClose}>Plus tard</Button><Button onClick={props.onRenew}>Renouveler maintenant</Button></>}><p className="feedback-modal-message">Dernier jour pour renouveler{props.planName ? ` votre offre ${props.planName}` : ''} et conserver l’accès complet à vos fonctionnalités.</p></Modal></FeedbackVariants>;

// ============================================================================
// 🔄 PROVIDER
// ============================================================================

const EXCLUDED_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/companies/create',
  '/parametres/subscription', // déjà sur la page de renouvellement, pas besoin de le relancer
];

export const SubscriptionReminderProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { subscription, isOnTrial, daysLeft, isExpiringSoon, renewalUrgency, isLoading } =
    useSubscription();

  const [showToast, setShowToast] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const isAdmin = useMemo(() => {
    const role = getStoredRole();
    return !!role && ADMIN_ROLES.includes(role);
  }, [pathname]); // recalculé à chaque navigation (ex: juste après connexion)

  const kind: 'essai' | 'abonnement' = isOnTrial ? 'essai' : 'abonnement';
  const planName = subscription?.planDetails?.name;

  useEffect(() => {
    if (isLoading || !isAdmin) return;
    if (EXCLUDED_PATHS.some((p) => pathname?.startsWith(p))) return;
    if (!isExpiringSoon || !subscription?.id || daysLeft == null) return;

    const dedupKey = `sub-reminder:${subscription.id}:${renewalUrgency}`;

    // Petit délai pour laisser la page se charger avant d'afficher quoi que
    // ce soit (cohérent avec le reste de l'app, voir CompanyReminderProvider).
    const timer = setTimeout(() => {
      if (alreadyShownToday(dedupKey)) return;
      markShownToday(dedupKey);

      if (renewalUrgency === 'urgent') {
        setShowModal(true);
      } else {
        setShowToast(true);
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [isLoading, isAdmin, pathname, isExpiringSoon, subscription?.id, daysLeft, renewalUrgency]);

  const goToSubscriptionPage = () => {
    setShowToast(false);
    setShowModal(false);
    router.push('/parametres/subscription');
  };

  if (!isAdmin) return <>{children}</>;

  return (
    <>
      {children}
      {renewalUrgency !== 'urgent' && daysLeft != null && (
        <ReminderToast
          visible={showToast}
          urgency={renewalUrgency === 'warning' ? 'warning' : 'info'}
          daysLeft={daysLeft}
          kind={kind}
          onClose={() => setShowToast(false)}
          onRenew={goToSubscriptionPage}
        />
      )}
      <LastCallModal
        isOpen={showModal}
        kind={kind}
        planName={planName}
        onClose={() => setShowModal(false)}
        onRenew={goToSubscriptionPage}
      />
    </>
  );
};