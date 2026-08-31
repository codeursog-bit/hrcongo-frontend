// ============================================================================
// 📁 components/documents/orca/OrcaAdvanceDocument.tsx
// ✅ Reproduit le modèle Excel "DEMANDE DE PRÊT - AVANCE SUR SALAIRE" fourni
//    par Orca. Un seul avis (Chef de Service), contrairement au prêt
//    argent/marchandise qui a un double avis DRH + Directeur Général.
// ============================================================================

import OrcaDocumentShell from './OrcaDocumentShell';

type AdvanceStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID' | 'DEDUCTED' | 'CANCELLED';

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

interface OrcaAdvanceDocumentProps {
  reference?: string;
  id?: string;
  employee: { firstName: string; lastName: string; position: string; phone: string; departmentName: string };
  amount: number | string;
  reason?: string | null;
  requestDate: string | Date;
  status: AdvanceStatus;
  company: OrcaCompany;
}

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

export default function OrcaAdvanceDocument({
  reference, id, employee, amount, reason, requestDate, status, company,
}: OrcaAdvanceDocumentProps) {
  const validated = ['APPROVED', 'PAID', 'DEDUCTED'].includes(status);

  return (
    <OrcaDocumentShell company={company} title="DEMANDE DE PRÊT - AVANCE SUR SALAIRE" reference={reference} id={id}>
      <FieldLine label="Nom" value={employee.lastName?.toUpperCase()} />
      <FieldLine label="Prénoms" value={employee.firstName} />
      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ flex: 1 }}><FieldLine label="Poste" value={employee.position} minWidth={70} /></div>
        <div style={{ flex: 1 }}><FieldLine label="Tél" value={employee.phone} minWidth={50} /></div>
      </div>
      <FieldLine label="Service" value={employee.departmentName} />

      <div style={{ margin: '14px 0' }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>Motif :</div>
        <div style={{ borderBottom: '1px dotted #333', minHeight: 16, paddingLeft: 4 }}>{reason || '\u00A0'}</div>
        <div style={{ fontSize: 10, color: '#888', marginTop: 4, fontStyle: 'italic' }}>
          P.S : Merci de joindre un justificatif (Maladie ou autres)
        </div>
      </div>

      <FieldLine label="Montant du prêt demandé" value={amount ? `${fmtAmount(amount)} FCFA` : ''} minWidth={220} />
      <FieldLine label="Date" value={fmtDate(requestDate)} minWidth={60} />

      <div style={{ marginTop: 30, fontSize: 11, color: '#555' }}>
        Fait à ……………………………, le ……………………………
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginTop: 24 }}>
        <div style={{ border: '1px solid #ccc', borderRadius: 4, padding: 10, minHeight: 90 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: '#555' }}>
            Signature de l&apos;Agent
          </div>
        </div>
        <div style={{ border: '1px solid #ccc', borderRadius: 4, padding: 10, minHeight: 90, position: 'relative' }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: '#555', marginBottom: 6 }}>
            Avis et Signature du Chef de Service
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}><Checkbox checked={validated} /> OUI</div>
            <div style={{ display: 'flex', alignItems: 'center' }}><Checkbox checked={status === 'REJECTED'} /> NON</div>
          </div>
          {validated && company.cachetUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={company.cachetUrl} alt="Cachet et signature" style={{ position: 'absolute', right: 6, bottom: 6, height: 74, opacity: 0.92 }} />
          )}
        </div>
      </div>
    </OrcaDocumentShell>
  );
}