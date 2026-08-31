// ============================================================================
// 📁 components/documents/orca/OrcaLeaveAbsenceDocument.tsx
// ✅ Reproduit à l'identique le modèle Word "DEMANDE DE CONGÉ" fourni par
//    Orca. Un seul composant sert pour congé ET absence — seules changent :
//    le titre, la liste "type", le libellé "Motif", et le libellé
//    "Nombre de jours ouvrables du congé / d'absence".
// ✅ Cachet + signature RH masqués tant que la demande n'est pas APPROVED.
// ============================================================================

import OrcaDocumentShell from './OrcaDocumentShell';

type LeaveType = 'ANNUAL' | 'SICK' | 'MATERNITY' | 'PATERNITY' | 'UNPAID' | 'COMPENSATORY';
type AbsenceType = 'MALADIE' | 'CONVENTIONNELLE' | 'EXCEPTIONNELLE';
type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

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

interface OrcaLeaveAbsenceDocumentProps {
  variant: 'CONGE' | 'ABSENCE';
  reference?: string;
  id?: string;
  employee: { firstName: string; lastName: string; position: string; departmentName: string };
  responsableName: string;
  type: LeaveType | AbsenceType;
  isPaid: boolean; // congé : Statut du congé Payé/Non-payé — absence : n'affecte pas l'affichage
  startDate: string | Date;
  endDate: string | Date;
  daysCount: number | string;
  reason?: string | null;
  status: RequestStatus;
  company: OrcaCompany;
}

// Libellés "type" affichés selon le modèle papier — dans l'ordre du formulaire
const CONGE_TYPES: { key: LeaveType[]; label: string }[] = [
  { key: ['ANNUAL'], label: 'Annuel' },
  { key: ['MATERNITY', 'PATERNITY'], label: 'Maternité/Paternité' },
  { key: ['SICK', 'UNPAID', 'COMPENSATORY'], label: 'Exceptionnel' },
];

const ABSENCE_TYPES: { key: AbsenceType[]; label: string }[] = [
  { key: ['MALADIE'], label: 'Maladie' },
  { key: ['CONVENTIONNELLE'], label: 'Conventionnel' },
  { key: ['EXCEPTIONNELLE'], label: 'Exceptionnel' },
];

function fmtDate(d: string | Date) {
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return '……………………';
  return date.toLocaleDateString('fr-FR');
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span
      style={{
        width: 13,
        height: 13,
        border: '1px solid #111',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 10,
        fontWeight: 700,
        marginRight: 6,
        flexShrink: 0,
      }}
    >
      {checked ? '✕' : ''}
    </span>
  );
}

function FieldLine({ label, value, minWidth = 90 }: { label: string; value: string; minWidth?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
      <span style={{ fontWeight: 700, minWidth, flexShrink: 0 }}>{label} :</span>
      <span style={{ flex: 1, borderBottom: '1px dotted #333', paddingLeft: 4, minHeight: 14 }}>{value || '\u00A0'}</span>
    </div>
  );
}

export default function OrcaLeaveAbsenceDocument({
  variant,
  reference,
  id,
  employee,
  responsableName,
  type,
  isPaid,
  startDate,
  endDate,
  daysCount,
  reason,
  status,
  company,
}: OrcaLeaveAbsenceDocumentProps) {
  const isConge = variant === 'CONGE';
  const typeOptions = isConge ? CONGE_TYPES : ABSENCE_TYPES;
  const validated = status === 'APPROVED';

  const title = isConge ? 'DEMANDE DE CONGÉ' : "DEMANDE D'AUTORISATION D'ABSENCE";
  const typeLabel = isConge ? 'Type de congé' : "Type d'absence";
  const motifLabel = isConge ? "Motif de l'absence" : 'Motif';
  const daysLabel = isConge ? 'Nombre de jours ouvrables du congé' : "Nombre de jours ouvrables d'absence";

  return (
    <OrcaDocumentShell company={company} title={title} reference={reference} id={id}>
      <FieldLine label="Nom" value={employee.lastName?.toUpperCase()} />
      <FieldLine label="Prénoms" value={employee.firstName} />
      <FieldLine label="Département" value={employee.departmentName} />
      <FieldLine label="Fonction" value={employee.position} />
      <FieldLine label="Responsable" value={responsableName} />

      <div style={{ margin: '18px 0 14px' }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>{typeLabel} :</div>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {typeOptions.map((opt) => (
            <div key={opt.label} style={{ display: 'flex', alignItems: 'center' }}>
              <Checkbox checked={(opt.key as string[]).includes(type)} />
              {opt.label}
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>{motifLabel} :</div>
        <div style={{ borderBottom: '1px dotted #333', minHeight: 16, paddingLeft: 4 }}>{reason || '\u00A0'}</div>
      </div>

      {isConge && (
        <div style={{ margin: '14px 0' }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Statut du congé :</div>
          <div style={{ display: 'flex', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}><Checkbox checked={isPaid} /> Payé</div>
            <div style={{ display: 'flex', alignItems: 'center' }}><Checkbox checked={!isPaid} /> Non-payé</div>
          </div>
        </div>
      )}

      <FieldLine label="Date de départ" value={fmtDate(startDate)} minWidth={140} />
      <FieldLine label="Date de reprise du travail" value={fmtDate(endDate)} minWidth={190} />
      <FieldLine label={daysLabel} value={String(daysCount)} minWidth={260} />

      {/* Avis de la Hiérarchie (gauche) — Justificatif (coin haut droit), comme le modèle original */}
      <div style={{ marginTop: 22, paddingTop: 12, borderTop: '1px solid #ccc', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 12, right: 0, fontSize: 11, fontStyle: 'italic', color: '#444' }}>
          Justificatif
        </div>
        <div style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: 12, marginBottom: 8 }}>
          Avis de la Hiérarchie
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}><Checkbox checked={validated} /> Accord</div>
          <div style={{ display: 'flex', alignItems: 'center' }}><Checkbox checked={status === 'REJECTED'} /> Refus</div>
        </div>
      </div>

      {/* Signatures */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginTop: 30 }}>
        {['Agent', 'Hiérarchie', 'Ressources Humaines'].map((label) => (
          <div
            key={label}
            style={{
              border: '1px solid #ccc',
              borderRadius: 4,
              padding: 10,
              minHeight: 100,
              position: 'relative',
            }}
          >
            <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: '#555' }}>{label}</div>
            <div style={{ fontSize: 9.5, color: '#888' }}>Date et signature</div>
            {label === 'Ressources Humaines' && validated && company.cachetUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={company.cachetUrl}
                alt="Cachet et signature"
                style={{ position: 'absolute', right: 6, bottom: 6, height: 82, opacity: 0.92 }}
              />
            )}
          </div>
        ))}
      </div>
    </OrcaDocumentShell>
  );
}