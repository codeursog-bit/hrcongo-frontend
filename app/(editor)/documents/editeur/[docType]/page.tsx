'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import SubscriptionAccessGate from '@/components/subscription/SubscriptionAccessGate';
import { administrativeTypes } from '@/lib/document-engine/administrative';

const DocumentEditor = dynamic(() => import('@/components/DocumentEditor'), {
  ssr: false,
  loading: () => <p className="p-6" role="status">Chargement de l’éditeur…</p>,
});
const AdministrativeEditor = dynamic(() => import('@/components/DocumentEditor/AdministrativeEditor'), {
  ssr: false,
  loading: () => <p className="p-6" role="status">Chargement de l’éditeur…</p>,
});

export default function DocumentEditorPage() {
  const { docType } = useParams<{ docType: string }>();
  const { user, userRole, loading } = useAuth();
  const requestType = administrativeTypes.find(type => type === docType);
  if (loading) return <p className="p-6" role="status">Vérification de la session…</p>;
  if (!user?.companyId || !['ADMIN', 'HR_MANAGER'].includes(userRole ?? '') || docType !== 'PAYSLIP' && docType !== 'CONTRACTOR_INVOICE' && !requestType) {
    return <main className="space-y-4 p-6">
      <h1 className="font-semibold">Éditeur indisponible</h1>
      <p>L’édition des modèles est réservée aux administrateurs et aux RH de l’entreprise.</p>
      <Link href={user ? '/dashboard' : '/auth/login'} className="underline">{user ? 'Tableau de bord' : 'Se connecter'}</Link>
    </main>;
  }
  return <SubscriptionAccessGate>{docType === 'CONTRACTOR_INVOICE' ? <AdministrativeEditor companyId={user.companyId} docType="CONTRACTOR_INVOICE" /> : requestType
    ? <AdministrativeEditor key={`${user.companyId}:${requestType}`} companyId={user.companyId} docType={requestType} />
    : <DocumentEditor key={user.companyId} companyId={user.companyId} userId={user.id} />}</SubscriptionAccessGate>;
}
