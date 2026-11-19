'use client';
import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { Modal } from '@/components/design-system/feedback';
import { Button } from '@/components/design-system/primitives';
import { pageEntitlement } from '@/lib/subscription-access';

export default function SubscriptionAccessGate({ children }: { children: React.ReactNode }) {
  const { user, userRole } = useAuth();
  const { subscription, isLoading, error, refetch } = useSubscription();
  const pathname = usePathname();
  const router = useRouter();
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const exempt = !user?.companyId || user?.managedByCabinet || ['SUPER_ADMIN', 'SUPPORT', 'CABINET_ADMIN', 'CABINET_GESTIONNAIRE'].includes(userRole || '');
  const end = subscription?.status === 'TRIALING' ? subscription.trialEndsAt : subscription?.plan !== 'FREE' ? subscription?.currentPeriodEnd : null;
  const restricted = !!subscription && (subscription.accessRestricted === true || !!subscription.downgradedAt ||
    !['ACTIVE', 'TRIALING'].includes(subscription.status) || (!!end && new Date(end).getTime() <= now));
  // /pricing est l'autre entrée du même paiement (devis et retour prestataire).
  const allowed = pathname === '/dashboard' || pathname === '/parametres/subscription' || pathname === '/pricing' || pathname === '/success';
  const home = () => router.replace('/dashboard');
  if (exempt) return <>{children}</>;
  // Ne jamais monter une page métier avant d'avoir reçu l'état serveur.
  if (isLoading) return <p role="status" className="p-6 text-[var(--text-secondary)]">Vérification de l’abonnement…</p>;
  if ((error || !subscription) && !allowed) return <div className="p-6"><p>Impossible de vérifier votre abonnement.</p><Button onClick={() => void refetch()}>Réessayer</Button><Button variant="secondary" onClick={home}>Tableau de bord</Button></div>;
  const feature=pageEntitlement(pathname||'');
  const featureBlocked=!!feature && subscription?.planDetails?.limits?.[feature]!==true;
  if (allowed || (!restricted&&!featureBlocked)) return <>{children}</>;
  const canPay = ['ADMIN', 'HR_MANAGER'].includes(userRole || '');
  return <Modal open onClose={home} title={restricted?'Votre abonnement est terminé':'Cette fonctionnalité est disponible en option'} actions={<>
    <Button variant="secondary" onClick={home}>Rester sur le tableau de bord</Button>
    {canPay && <Button onClick={() => router.replace('/parametres/subscription')}>{restricted?'Renouveler l’abonnement':'Voir les offres et options'}</Button>}
  </>}><p className="leading-relaxed text-[var(--text)]">{restricted?(canPay ? 'Renouvelez votre abonnement pour retrouver les modules et les actions de votre entreprise.' : 'Contactez votre administrateur pour renouveler l’abonnement. Le tableau de bord reste accessible.'):'Vous pouvez choisir une autre offre ou demander uniquement cette fonctionnalité à Support Konza. Votre offre actuelle est conservée.'}</p></Modal>;
}
