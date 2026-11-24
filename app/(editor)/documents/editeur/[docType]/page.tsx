'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import SubscriptionAccessGate from '@/components/subscription/SubscriptionAccessGate';

const DocumentEditor = dynamic(() => import('@/components/DocumentEditor'), {
  ssr: false,
  loading: () => <p className="p-6" role="status">Chargement de l’éditeur…</p>,
});

export default function DocumentEditorPage() {
  const { docType } = useParams<{ docType: string }>();
  const { user, userRole, loading } = useAuth();
  if (loading) return <p className="p-6" role="status">Vérification de la session…</p>;
  if (!user?.companyId || !['ADMIN', 'HR_MANAGER'].includes(userRole ?? '') || docType !== 'PAYSLIP') {
    return <main className="space-y-4 p-6">
      <h1 className="font-semibold">Éditeur indisponible</h1>
      <p>L’édition du bulletin est réservée aux administrateurs et aux RH de l’entreprise.</p>
      <Link href={user ? '/dashboard' : '/auth/login'} className="underline">{user ? 'Tableau de bord' : 'Se connecter'}</Link>
    </main>;
  }
  return <SubscriptionAccessGate><DocumentEditor companyId={user.companyId} userId={user.id} /></SubscriptionAccessGate>;
}
