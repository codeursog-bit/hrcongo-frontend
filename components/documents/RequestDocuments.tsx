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

interface Props<T> {
  template?: string | null;
  id?: string;
  data: T;
}

export function AbsenceRequestDocument({ template, id, data }: Props<ModernAbsenceRequestFormData>) {
  return template === 'MODERN' ? (
    <ModernAbsenceRequestForm id={id} data={data} />
  ) : (
    <StandardAbsenceRequestForm id={id} data={data} />
  );
}

export function LeaveRequestDocument({ template, id, data }: Props<ModernLeaveRequestFormData>) {
  return template === 'MODERN' ? (
    <ModernLeaveRequestForm id={id} data={data} />
  ) : (
    <StandardLeaveRequestForm id={id} data={data} />
  );
}

export function LoanRequestDocument({ template, id, data }: Props<ModernLoanRequestFormData>) {
  return template === 'MODERN' ? (
    <ModernLoanRequestForm id={id} data={data} />
  ) : (
    <StandardLoanRequestForm id={id} data={data} />
  );
}

export function AdvanceRequestDocument({ template, id, data }: Props<ModernAdvanceRequestFormData>) {
  return template === 'MODERN' ? (
    <ModernAdvanceRequestForm id={id} data={data} />
  ) : (
    <StandardAdvanceRequestForm id={id} data={data} />
  );
}