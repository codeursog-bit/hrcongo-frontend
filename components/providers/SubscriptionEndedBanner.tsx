'use client';
import { LegacyEndedBanner } from '@/components/providers/legacy-feedback';
import { FeedbackVariants, FeedbackViewport, FeedbackToast } from '@/components/ui/Feedback';

// ============================================================================
// 💙 SubscriptionEndedBanner
// ----------------------------------------------------------------------------
// Différent de <SubscriptionReminderProvider> (qui prévient AVANT l'échéance,
// J-7/J-3/J-1) : ce bandeau s'affiche APRÈS coup, quand l'entreprise vient
// d'être rétrogradée en Gratuit faute de renouvellement
// (subscription.downgradedAt renseigné côté backend — voir
// checkExpiredSubscriptions). Jamais affiché si l'entreprise a simplement
// toujours été sur le plan Gratuit.
//
// Positionné en bas à gauche, discret — un bandeau, pas une modale plein
// écran : on veut prévenir, pas interrompre. Le ton reste chaleureux des
// deux côtés (admin/RH vs employé), jamais culpabilisant.
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';


import { useSubscription } from '@/hooks/useSubscription';

const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'];

function getStoredRole(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    return JSON.parse(raw)?.role ?? null;
  } catch {
    return null;
  }
}

const todayKey = () => new Date().toISOString().slice(0, 10);

const EXCLUDED_PATHS = [
  '/auth/login',
  '/auth/register',
  '/companies/create',
  '/parametres/subscription', // déjà sur la page de renouvellement
];

export const SubscriptionEndedBanner: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { subscription, isLoading } = useSubscription();
  const [visible, setVisible] = useState(false);

  const role = useMemo(() => getStoredRole(), [pathname]);
  const isAdmin = !!role && ADMIN_ROLES.includes(role);

  const isDowngraded = !!subscription?.downgradedAt && subscription?.plan === 'FREE';

  useEffect(() => {
    if (isLoading || !isDowngraded) return;
    if (EXCLUDED_PATHS.some((p) => pathname?.startsWith(p))) return;

    // Une fois par jour civil, par entreprise — assez pour rester présent
    // sans harceler à chaque changement de page.
    const dedupKey = `sub-ended-banner:${subscription?.id}`;
    const lastShown = typeof window !== 'undefined' ? localStorage.getItem(dedupKey) : null;
    if (lastShown === todayKey()) return;

    const timer = setTimeout(() => {
      setVisible(true);
      if (typeof window !== 'undefined') localStorage.setItem(dedupKey, todayKey());
    }, 1500);
    return () => clearTimeout(timer);
  }, [isLoading, isDowngraded, pathname, subscription?.id]);

  const close = () => setVisible(false);
  const goRenew = () => {
    close();
    router.push('/parametres/subscription');
  };

  if (!isDowngraded) return null;

  const planName = subscription?.planDetails?.name;

  return (<FeedbackVariants legacy={<LegacyEndedBanner visible={visible} isAdmin={isAdmin} planName={planName} close={close} goRenew={goRenew} />}><FeedbackViewport position="reminder" label="Abonnement">{visible && <FeedbackToast tone="warning" title="Votre abonnement est terminé" message={isAdmin ? `Certaines fonctionnalités sont limitées${planName ? ` (offre ${planName})` : ''}. Renouvelez quand vous le souhaitez.` : 'Certaines fonctionnalités sont limitées. Votre équipe RH peut vous renseigner.'} onClose={close}>{isAdmin && <button type="button" className="k-button k-button-primary" onClick={goRenew}>Renouveler</button>}<button type="button" className="k-button k-button-ghost" onClick={close}>Fermer</button></FeedbackToast>}</FeedbackViewport></FeedbackVariants>);
};