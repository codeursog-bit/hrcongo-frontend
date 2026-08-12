'use client';

// ============================================================================
// 📁 components/LeaveRequestFormPrintable.tsx
// ✅ Même structure que AbsenceRequestPrintable — pour que le "formulaire de
//    demande" ait une présentation cohérente entre congés et absences.
// ============================================================================

import React from 'react';

interface CompanyInfo {
  legalName?: string; tradeName?: string; logo?: string | null;
  rccmNumber?: string; taxNumber?: string; address?: string; phone?: string;
  cachetUrl?: string | null;
}

export interface LeaveRequestFormData {
  reference?: string;
  company: CompanyInfo;
  employee: { firstName: string; lastName: string; position?: string; departmentName?: string; responsableName?: string };
  type: string; // ANNUAL, SICK, MATERNITY, PATERNITY, UNPAID, COMPENSATORY
  reason?: string;
  isPaid: boolean;
  startDate: string | Date;
  endDate: string | Date;
  daysCount: number | string;
  hasAttachment?: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | string;
  requestedAt?: string | Date;
  reviewedByName?: string;
  reviewedAt?: string | Date;
  rejectionReason?: string;
}

const TYPE_LABEL: Record<string, string> = {
  ANNUAL: 'Congé annuel', SICK: 'Congé maladie', MATERNITY: 'Congé maternité',
  PATERNITY: 'Congé paternité', UNPAID: 'Congé sans solde', COMPENSATORY: 'Récupération',
};

const fmt = (d?: string | Date) => (d ? new Date(d).toLocaleDateString('fr-FR') : '.................................');

const Checkbox = ({ checked }: { checked: boolean }) => (
  <span style={{ display: 'inline-flex', width: 16, height: 16, border: '1.5px solid #1f2937', alignItems: 'center', justifyContent: 'center', marginRight: 6, verticalAlign: 'middle', fontSize: 12, fontWeight: 700, lineHeight: 1 }}>
    {checked ? '✕' : ''}
  </span>
);

export default function LeaveRequestFormPrintable({ data }: { data: LeaveRequestFormData }) {
  const companyName = data.company.tradeName || data.company.legalName || 'Entreprise';

  return (
    <div
      id="leave-form-print-root"
      data-leave-form-print-root="true"
      style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', background: '#fff', color: '#1f2937', fontFamily: 'Arial, Helvetica, sans-serif', padding: '14mm 16mm', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {data.company.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.company.logo} alt={companyName} style={{ height: 52, objectFit: 'contain' }} />
          )}
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: 1 }}>{companyName}</span>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700 }}>Réf. N° : {data.reference || '.....................'}</div>
      </div>

      <div style={{ border: '2px solid #1f2937', padding: '11px 16px', marginBottom: 24 }}>
        <h1 style={{ fontSize: 19, fontWeight: 800, letterSpacing: 1, margin: 0, textAlign: 'center' }}>DEMANDE DE CONGÉ</h1>
      </div>

      <div style={{ fontSize: 14, lineHeight: 2.2 }}>
        <div style={{ display: 'flex', gap: 24 }}>
          <div style={{ flex: 1 }}><strong>Nom :</strong> {data.employee.lastName}</div>
          <div style={{ flex: 1 }}><strong>Prénoms :</strong> {data.employee.firstName}</div>
        </div>
        <div><strong>Département :</strong> {data.employee.departmentName || '—'}</div>
        <div><strong>Fonction :</strong> {data.employee.position || '—'}</div>
        <div><strong>Responsable :</strong> {data.employee.responsableName || '—'}</div>

        <div style={{ marginTop: 9 }}><strong>Type de congé :</strong> {TYPE_LABEL[data.type] ?? data.type}</div>

        {data.reason && <div style={{ marginTop: 7 }}><strong>Motif :</strong> {data.reason}</div>}

        <div style={{ marginTop: 9 }}>
          <strong>Statut : </strong>
          <Checkbox checked={data.isPaid} /> Payé &nbsp;&nbsp;&nbsp;
          <Checkbox checked={!data.isPaid} /> Non-payé
        </div>

        <div style={{ marginTop: 7 }}><strong>Date de départ :</strong> {fmt(data.startDate)}</div>
        <div><strong>Date de reprise du travail :</strong> {fmt(data.endDate)}</div>
        <div><strong>Nombre de jours ouvrables :</strong> {data.daysCount}</div>

        <div style={{ marginTop: 7 }}>
          <strong>Justificatif joint :</strong> <Checkbox checked={!!data.hasAttachment} /> {data.hasAttachment ? 'Oui' : 'Non'}
        </div>
      </div>

      <div style={{ marginTop: 28, fontSize: 14 }}>
        <strong>Avis du service :</strong>
        <div style={{ display: 'flex', gap: 40, marginTop: 10 }}>
          <div><Checkbox checked={data.status === 'APPROVED'} /> Accord</div>
          <div><Checkbox checked={data.status === 'REJECTED'} /> Refus</div>
        </div>
        {data.status === 'REJECTED' && data.rejectionReason && (
          <div style={{ marginTop: 8, fontSize: 13, fontStyle: 'italic' }}>Motif du refus : {data.rejectionReason}</div>
        )}
      </div>

      <div style={{ marginTop: 34, border: '1.5px solid #1f2937', display: 'flex' }}>
        {[
          { label: 'Agent', name: `${data.employee.firstName} ${data.employee.lastName}`, date: data.requestedAt ? fmt(data.requestedAt) : undefined, stamp: false },
          { label: 'Chef de service', name: undefined, date: undefined, stamp: false },
          { label: 'Ressources Humaines', name: undefined, date: data.status === 'APPROVED' ? fmt(data.reviewedAt) : undefined, stamp: data.status === 'APPROVED' },
        ].map((col, i) => (
          <div key={col.label} style={{ flex: 1, padding: '14px 10px 18px', borderLeft: i === 0 ? 'none' : '1.5px solid #1f2937', minHeight: 150, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 14, textDecoration: 'underline' }}>{col.label}</div>
            {/* ✅ Le cachet (cachetUrl, entreprise → paramètres/entreprise) remplace tout
                texte d'identité du validateur — jamais son nom ni son email. */}
            {col.stamp && data.company.cachetUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.company.cachetUrl} alt="Cachet" style={{ height: 78, objectFit: 'contain' }} />
            ) : (
              <div style={{ fontSize: 13, minHeight: 46 }}>
                {col.name && <div style={{ fontWeight: 600 }}>{col.name}</div>}
              </div>
            )}
            <div>
              {col.date && <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>{col.date}</div>}
              <div style={{ fontWeight: 700, fontSize: 12 }}>Date et signature</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 'auto', textAlign: 'center', fontSize: 11, color: '#4b5563', lineHeight: 1.7, borderTop: '1px solid #e5e7eb', paddingTop: 12 }}>
        <div style={{ fontWeight: 700 }}>{companyName}</div>
        {(data.company.rccmNumber || data.company.taxNumber) && (
          <div>
            {data.company.rccmNumber && <>RCCM : {data.company.rccmNumber}&nbsp;&nbsp;</>}
            {data.company.taxNumber && <>NIU : {data.company.taxNumber}</>}
          </div>
        )}
        {data.company.address && <div>{data.company.address}{data.company.phone ? ` — Tél : ${data.company.phone}` : ''}</div>}
        <div style={{ marginTop: 6, fontStyle: 'italic' }}>Document généré via Konza RH</div>
      </div>
    </div>
  );
}