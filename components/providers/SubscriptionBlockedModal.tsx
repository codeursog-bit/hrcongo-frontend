'use client';
import { LegacyBlockedModal } from '@/components/providers/legacy-feedback';
import { FeedbackVariants } from '@/components/ui/Feedback';
import { Modal } from '@/components/design-system/feedback';
import { Button } from '@/components/design-system/primitives';
import '@/components/design-system/design-system.css';

// ============================================================================
// 🚧 SubscriptionBlockedModal
// ----------------------------------------------------------------------------
// Écoute l'événement global 'subscription-blocked' (déclenché par
// services/api.ts dès qu'une réponse porte { error: 'SUBSCRIPTION_BLOCKED' })
// et affiche une vraie modale — plutôt que le message générique perdu dans
// un toast — quelle que soit l'action à l'origine du blocage : ajout
// d'employé, demande de formation, de congé, de prêt, pointage, offre
// d'emploi... tout passe par le même mécanisme côté backend
// (SubscriptionGuard.throwSubscriptionBlocked), donc une seule modale ici
// couvre tous les cas sans avoir à toucher chaque page.
//
// Le contenu s'adapte à l'audience renvoyée par le backend :
//   - ADMIN/RH  → message + bouton vers la page d'abonnement
//   - EMPLOYEE  → message doux "contactez votre RH", pas de bouton paiement
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';



interface BlockedDetail {
  message: string;
  audience: 'ADMIN' | 'EMPLOYEE';
  reason?: string;
}

export const SubscriptionBlockedModal: React.FC = () => {
  const router = useRouter();
  const [detail, setDetail] = useState<BlockedDetail | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<BlockedDetail>;
      // Les pages métier sont déjà remplacées par SubscriptionAccessGate.
      if (custom.detail?.reason === 'SUBSCRIPTION_EXPIRED' &&
          !['/dashboard', '/parametres/subscription', '/pricing', '/success'].includes(window.location.pathname)) return;
      if (custom.detail?.message) setDetail(custom.detail);
    };
    window.addEventListener('subscription-blocked', handler);
    return () => window.removeEventListener('subscription-blocked', handler);
  }, []);

  const close = () => { setDetail(null); if (detail?.reason === 'SUBSCRIPTION_EXPIRED') router.replace('/dashboard'); };
  const goToSubscription = () => {
    setDetail(null);
    router.push('/parametres/subscription');
  };

  const isAdmin = detail?.audience === 'ADMIN';

  return (<FeedbackVariants legacy={<LegacyBlockedModal detail={detail} isAdmin={isAdmin} close={close} goToSubscription={goToSubscription} />}><Modal open={!!detail} onClose={close} title={detail?.reason === 'SUBSCRIPTION_EXPIRED' ? 'Votre abonnement est terminé' : isAdmin ? 'Action bloquée' : 'Accès bloqué'} actions={<><Button variant="secondary" onClick={close}>{detail?.reason === 'SUBSCRIPTION_EXPIRED' ? 'Retour au tableau de bord' : isAdmin ? 'Plus tard' : "J’ai compris"}</Button>{isAdmin && <Button onClick={goToSubscription}>Renouveler l’abonnement</Button>}</>}><p className="feedback-modal-message">{detail?.message}</p></Modal></FeedbackVariants>);
};
