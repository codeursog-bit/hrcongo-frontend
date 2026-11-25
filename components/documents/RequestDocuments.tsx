'use client';

// ============================================================================
// 📁 components/documents/RequestDocuments.tsx
// Aiguillage « Modèle 2 (STANDARD) ou Modèle 3 (MODERN) » pour les 4 documents
// de demande. Les pages passent `template={company.documentTemplate}` : toute
// valeur autre que 'MODERN' donne le modèle 2 (comportement actuel inchangé).
// Les données sont les mêmes pour les deux modèles.
// ============================================================================

import StandardAbsenceRequestForm from './standard/StandardAbsenceRequestForm';
import StandardAdvanceRequestForm from './standard/StandardAdvanceRequestForm';
import StandardLeaveRequestForm from './standard/StandardLeaveRequestForm';
import StandardLoanRequestForm from './standard/StandardLoanRequestForm';
import ModernAbsenceRequestForm, { type ModernAbsenceRequestFormData } from './modern/ModernAbsenceRequestForm';
import ModernAdvanceRequestForm, { type ModernAdvanceRequestFormData } from './modern/ModernAdvanceRequestForm';
import ModernLeaveRequestForm, { type ModernLeaveRequestFormData } from './modern/ModernLeaveRequestForm';
import ModernLoanRequestForm, { type ModernLoanRequestFormData } from './modern/ModernLoanRequestForm';
import dynamic from 'next/dynamic';
import PermissionTicketPrintable, { type PermissionTicketData } from '@/components/PermissionTicketPrintable';
const EngineRequestDocument = dynamic(() => import('./EngineRequestDocument'));

interface Props<T> {
  template?: string | null;
  id?: string;
  data: T;
}

export function AbsenceRequestDocument({ template, id, data }: Props<ModernAbsenceRequestFormData>) {
  if (template === 'CUSTOM') return <EngineRequestDocument id={id} request={{ docType: 'ABSENCE', input: data }} />;
  return template === 'MODERN' ? (
    <ModernAbsenceRequestForm id={id} data={data} />
  ) : (
    <StandardAbsenceRequestForm id={id} data={data} />
  );
}

export function LeaveRequestDocument({ template, id, data }: Props<ModernLeaveRequestFormData>) {
  if (template === 'CUSTOM') return <EngineRequestDocument id={id} request={{ docType: 'LEAVE', input: data }} />;
  return template === 'MODERN' ? (
    <ModernLeaveRequestForm id={id} data={data} />
  ) : (
    <StandardLeaveRequestForm id={id} data={data} />
  );
}

export function LoanRequestDocument({ template, id, data }: Props<ModernLoanRequestFormData>) {
  if (template === 'CUSTOM') return <EngineRequestDocument id={id} request={{ docType: 'LOAN', input: data }} />;
  return template === 'MODERN' ? (
    <ModernLoanRequestForm id={id} data={data} />
  ) : (
    <StandardLoanRequestForm id={id} data={data} />
  );
}

export function AdvanceRequestDocument({ template, id, data }: Props<ModernAdvanceRequestFormData>) {
  if (template === 'CUSTOM') return <EngineRequestDocument id={id} request={{ docType: 'ADVANCE', input: data }} />;
  return template === 'MODERN' ? (
    <ModernAdvanceRequestForm id={id} data={data} />
  ) : (
    <StandardAdvanceRequestForm id={id} data={data} />
  );
}

export function ExitPermissionDocument({ template, id, data }: Props<PermissionTicketData> & { id: string }) {
  return template === 'CUSTOM'
    ? <EngineRequestDocument id={id} request={{ docType: 'EXIT_PERMISSION', input: data }} />
    : <PermissionTicketPrintable id={id} data={data} />;
}
