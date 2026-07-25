// ============================================================================
// 📁 components/documents/orca/OrcaLoanDocument.tsx
// ✅ Reproduit le modèle Excel "DEMANDE DE PRÊT - MARCHANDISES" / argent
//    fourni par Orca. Double avis : DRH (gauche) puis Directeur Général
//    (droite) — reflète le circuit drhDecision/dgDecision du modèle Loan.
// ============================================================================

import OrcaDocumentShell from './OrcaDocumentShell';

type LoanType = 'ARGENT' | 'MARCHANDISE' | 'AUTRE';
type LoanStatus = 'PENDING' | 'PENDING_DG' | 'ACTIVE' | 'PAID' | 'REJECTED' | 'CANCELLED';
type ApprovalDecision = 'OUI' | 'NON' | null | undefined;

interface OrcaCompany {
  legalName: string;
  tradeName?: string | null;
  rccmNumber: string;
  taxNumber?: string | null;
  address: string;
  city: string;
  phone: string;
  logo?: string | null;
  cachetUrl?: string | null;
}

interface OrcaLoanDocumentProps {
  reference?: string;
  id?: string;
  loanType: LoanType;
  employee: { firstName: string; lastName: string; position: string; phone: string; departmentName: string };
  amount: number | string;
  monthlyRepayment: number | string;
  startDate: string | Date;
  endDate: string | Date;
  status: LoanStatus;
  drhDecision: ApprovalDecision;
  dgDecision: ApprovalDecision;
  company: OrcaCompany;
}

const TITLES: Record<LoanType, string> = {
  ARGENT: 'DEMANDE DE PRÊT - ARGENT',
  MARCHANDISE: 'DEMANDE DE PRÊT - MARCHANDISES',
  AUTRE: 'DEMANDE DE PRÊT',
};

function fmtDate(d: string | Date) {
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return '……………………';
  return date.toLocaleDateString('fr-FR');
}

function fmtAmount(a: number | string) {
  const n = typeof a === 'string' ? parseFloat(a) : a;
  if (isNaN(n)) return '';
  return n.toLocaleString('fr-FR');
}

function monthsBetween(start: string | Date, end: string | Date) {
  const s = typeof start === 'string' ? new Date(start) : start;
  const e = typeof end === 'string' ? new Date(end) : end;
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return '';
  const months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
  return months > 0 ? String(months) : '';
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span
      style={{
        width: 13, height: 13, border: '1px solid #111', display: 'inline-flex',
        alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, marginRight: 6,
      }}
    >
      {checked ? '✕' : ''}
    </span>
  );
}

function FieldLine({ label, value, minWidth = 140 }: { label: string; value: string; minWidth?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
      <span style={{ fontWeight: 700, minWidth, flexShrink: 0 }}>{label} :</span>
      <span style={{ flex: 1, borderBottom: '1px dotted #333', paddingLeft: 4, minHeight: 14 }}>{value || '\u00A0'}</span>
    </div>
  );
}

export default function OrcaLoanDocument({
  reference, id, loanType, employee, amount, monthlyRepayment, startDate, endDate,
  status, drhDecision, dgDecision, company,
}: OrcaLoanDocumentProps) {
  const amountLabel = loanType === 'MARCHANDISE' ? 'Montant total de la marchandise' : 'Montant du prêt demandé';

  return (
    <OrcaDocumentShell company={company} title={TITLES[loanType]} reference={reference} id={id}>
      <FieldLine label="Nom" value={employee.lastName?.toUpperCase()} />
      <FieldLine label="Prénoms" value={employee.firstName} />
      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ flex: 1 }}><FieldLine label="Poste" value={employee.position} minWidth={70} /></div>
        <div style={{ flex: 1 }}><FieldLine label="Tél" value={employee.phone} minWidth={50} /></div>
      </div>
      <FieldLine label="Service" value={employee.departmentName} />

      <FieldLine label={amountLabel} value={amount ? `${fmtAmount(amount)} FCFA` : ''} minWidth={230} />
      <FieldLine label="Date" value={fmtDate(startDate)} minWidth={60} />
      <FieldLine label="Mensualité de prêt" value={monthlyRepayment ? `${fmtAmount(monthlyRepayment)} FCFA` : ''} minWidth={170} />
      <FieldLine label="Durée du prêt (mois)" value={monthsBetween(startDate, endDate)} minWidth={170} />

      <div style={{ marginTop: 30, fontSize: 11, color: '#555' }}>
        Fait à ……………………………, le ……………………………
      </div>

      <div style={{ border: '1px solid #ccc', borderRadius: 4, padding: 10, minHeight: 60, marginTop: 20 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: '#555' }}>
          Signature de l&apos;Agent
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginTop: 14 }}>
        <div style={{ border: '1px solid #ccc', borderRadius: 4, padding: 10, minHeight: 100, position: 'relative' }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: '#555', marginBottom: 6 }}>
            Avis et Signature DRH
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}><Checkbox checked={drhDecision === 'OUI'} /> OUI</div>
            <div style={{ display: 'flex', alignItems: 'center' }}><Checkbox checked={drhDecision === 'NON'} /> NON</div>
          </div>
          {drhDecision === 'OUI' && company.cachetUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={company.cachetUrl} alt="Cachet et signature DRH" style={{ position: 'absolute', right: 6, bottom: 6, height: 74, opacity: 0.92 }} />
          )}
        </div>
        <div style={{ border: '1px solid #ccc', borderRadius: 4, padding: 10, minHeight: 100 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: '#555', marginBottom: 6 }}>
            Avis et signature Directeur Général
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}><Checkbox checked={dgDecision === 'OUI'} /> OUI</div>
            <div style={{ display: 'flex', alignItems: 'center' }}><Checkbox checked={dgDecision === 'NON'} /> NON</div>
          </div>
        </div>
      </div>
    </OrcaDocumentShell>
  );
}