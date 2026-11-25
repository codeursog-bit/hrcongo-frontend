'use client';

import { AbsenceRequestDocument, AdvanceRequestDocument, LeaveRequestDocument, LoanRequestDocument } from './RequestDocuments';
import PermissionTicketPrintable from '@/components/PermissionTicketPrintable';
import OrcaLeaveAbsenceDocument from './orca/OrcaLeaveAbsenceDocument';
import OrcaLoanDocument from './orca/OrcaLoanDocument';
import OrcaAdvanceDocument from './orca/OrcaAdvanceDocument';
import type { AdministrativeType } from '@/lib/document-engine/administrative';

const company = { legalName: 'Entreprise Exemple', rccmNumber: 'CG/EX/0000',
  address: 'Avenue de l’Indépendance', city: 'Pointe-Noire', phone: '00 000 00 00' };
const employee = { firstName: 'Camille', lastName: 'Exemple', employeeNumber: 'EMP-001',
  position: 'Assistante administrative', departmentName: 'Administration', phone: '00 000 00 00' };
const dates = { startDate: '2026-11-16', endDate: '2026-11-20', returnDate: '2026-11-23' };
const sample = { reference: 'EX-2026-001', company, employee, status: 'PENDING' as const, requestedAt: '2026-11-12' };

export default function HistoricRequestPreview({ type, template }: { type: AdministrativeType; template: string }) {
  if (type === 'EXIT_PERMISSION') {
    return <PermissionTicketPrintable id="historical-ticket-preview" data={{ ...sample, type: 'MISSION',
      reason: 'Dépôt de documents administratifs', destination: 'Pointe-Noire',
      departureTime: '2026-11-16T09:30:00+01:00', expectedReturnTime: '2026-11-16T11:30:00+01:00' }} />;
  }
  if (template === 'ORCA') {
    if (type === 'LEAVE' || type === 'ABSENCE') {
      return <OrcaLeaveAbsenceDocument {...sample} {...dates} variant={type === 'LEAVE' ? 'CONGE' : 'ABSENCE'}
        responsableName="Direction administrative" type={type === 'LEAVE' ? 'ANNUAL' : 'CONVENTIONNELLE'}
        isPaid daysCount={5} />;
    }
    if (type === 'LOAN') return <OrcaLoanDocument {...sample} loanType="ARGENT" {...dates}
      amount={150000} monthlyRepayment={25000} drhDecision={null} dgDecision={null} />;
    if (type === 'ADVANCE') return <OrcaAdvanceDocument {...sample} amount={50000} requestDate="2026-11-12" />;
  }
  switch (type) {
    case 'LEAVE': return <LeaveRequestDocument template={template} data={{ ...sample, ...dates, daysCount: 5 }} />;
    case 'ABSENCE': return <AbsenceRequestDocument template={template} data={{ ...sample, ...dates, workingDays: 2,
      motifKey: 'FAMILY', catalog: [{ key: 'FAMILY', label: 'Événement familial', days: 2 }] }} />;
    case 'LOAN': return <LoanRequestDocument template={template} data={{ ...sample, amount: 150000, durationMonths: 6, monthlyRepayment: 25000, nature: 'SOCIAL' }} />;
    case 'ADVANCE': return <AdvanceRequestDocument template={template} data={{ ...sample, amount: 50000, month: 11, year: 2026 }} />;
  }
}
