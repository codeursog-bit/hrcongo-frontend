// ============================================================================
// 📁 components/AbsenceRequestPrintable.tsx
// ✅ Reproduit le formulaire papier "DEMANDE D'AUTORISATION D'ABSENCE"
//    fourni par le client, mais dynamique : logo, nom, RCCM, NIU, adresse
//    et téléphone viennent de l'entreprise connectée (pas de "ORCA" en dur).
// ✅ Utilisé à l'écran (aperçu live pendant la saisie) ET à l'impression
//    via lib/absence-print.ts (id="absence-print-root").
// ============================================================================

'use client';

import React from 'react';

export interface AbsenceRequestPrintableData {
  reference?: string;               // ex: DEA-A1B2C3D4
  company: {
    legalName?: string;
    tradeName?: string;
    logo?: string | null;
    rccmNumber?: string;
    taxNumber?: string;
    address?: string;
    phone?: string;
  };
  employee: {
    firstName: string;
    lastName: string;
    position?: string;
    departmentName?: string;
    responsableName?: string;
  };
  type: 'MALADIE' | 'CONVENTIONNELLE' | 'EXCEPTIONNELLE' | string;
  reason: string;
  isPaid: boolean;
  startDate: string | Date;
  endDate: string | Date;
  workingDays: number | string;
  hasAttachment?: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | string;
  requestedAt?: string | Date;
  reviewedByName?: string;
  reviewedAt?: string | Date;
  rejectionReason?: string;
}

const fmt = (d?: string | Date) => (d ? new Date(d).toLocaleDateString('fr-FR') : '.................................');

const Checkbox = ({ checked }: { checked: boolean }) => (
  <span
    style={{
      display: 'inline-flex',
      width: 16,
      height: 16,
      border: '1.5px solid #1f2937',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 6,
      verticalAlign: 'middle',
      fontSize: 12,
      fontWeight: 700,
      lineHeight: 1,
    }}
  >
    {checked ? '✕' : ''}
  </span>
);

export default function AbsenceRequestPrintable({ data }: { data: AbsenceRequestPrintableData }) {
  const companyName = data.company.tradeName || data.company.legalName || 'Entreprise';

  return (
    <div
      id="absence-print-root"
      data-absence-print-root="true"
      style={{
        width: '210mm',
        minHeight: '297mm',
        margin: '0 auto',
        background: '#fff',
        color: '#1f2937',
        fontFamily: 'Arial, Helvetica, sans-serif',
        padding: '14mm 16mm',
        boxSizing: 'border-box',
      }}
    >
      {/* ── EN-TÊTE ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {data.company.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.company.logo} alt={companyName} style={{ height: 48, objectFit: 'contain' }} />
          )}
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: 1 }}>{companyName}</span>
        </div>
        <div style={{ fontSize: 11, fontWeight: 700 }}>
          Réf. N° : {data.reference || '.....................'}
        </div>
      </div>

      {/* ── TITRE ── */}
      <div style={{ border: '2px solid #1f2937', padding: '10px 16px', marginBottom: 22, transform: 'rotate(-0.3deg)' }}>
        <h1 style={{ fontSize: 17, fontWeight: 800, letterSpacing: 1, margin: 0, textAlign: 'center' }}>
          DEMANDE D&apos;AUTORISATION D&apos;ABSENCE
        </h1>
      </div>

      {/* ── IDENTITÉ ── */}
      <div style={{ fontSize: 13, lineHeight: 2.1 }}>
        <div style={{ display: 'flex', gap: 24 }}>
          <div style={{ flex: 1 }}><strong>Nom :</strong> {data.employee.lastName}</div>
          <div style={{ flex: 1 }}><strong>Prénoms :</strong> {data.employee.firstName}</div>
        </div>
        <div><strong>Département :</strong> {data.employee.departmentName || '—'}</div>
        <div><strong>Fonction :</strong> {data.employee.position || '—'}</div>
        <div><strong>Responsable :</strong> {data.employee.responsableName || '—'}</div>

        <div style={{ marginTop: 8 }}>
          <strong>Type d&apos;absence : </strong>
          <Checkbox checked={data.type === 'MALADIE'} /> Maladie &nbsp;&nbsp;
          <Checkbox checked={data.type === 'CONVENTIONNELLE'} /> Conventionnelle &nbsp;&nbsp;
          <Checkbox checked={data.type === 'EXCEPTIONNELLE'} /> Exceptionnelle
        </div>

        <div style={{ marginTop: 6 }}>
          <strong>Motif de l&apos;absence :</strong> {data.reason}
        </div>

        <div style={{ marginTop: 8 }}>
          <strong>Statut de l&apos;absence : </strong>
          <Checkbox checked={data.isPaid} /> Payé &nbsp;&nbsp;&nbsp;
          <Checkbox checked={!data.isPaid} /> Non-payé
        </div>

        <div style={{ marginTop: 6 }}><strong>Date de départ :</strong> {fmt(data.startDate)}</div>
        <div><strong>Date de reprise du travail :</strong> {fmt(data.endDate)}</div>
        <div><strong>Nombre de jours ouvrables d&apos;absence :</strong> {data.workingDays}</div>

        <div style={{ marginTop: 6 }}>
          <strong>Justificatif joint :</strong> <Checkbox checked={!!data.hasAttachment} /> {data.hasAttachment ? 'Oui' : 'Non'}
        </div>
      </div>

      {/* ── AVIS DU SERVICE ── */}
      <div style={{ marginTop: 26, fontSize: 13 }}>
        <strong>Avis du service :</strong>
        <div style={{ display: 'flex', gap: 40, marginTop: 10 }}>
          <div><Checkbox checked={data.status === 'APPROVED'} /> Accord</div>
          <div><Checkbox checked={data.status === 'REJECTED'} /> Refus</div>
        </div>
        {data.status === 'REJECTED' && data.rejectionReason && (
          <div style={{ marginTop: 8, fontSize: 12, fontStyle: 'italic' }}>
            Motif du refus : {data.rejectionReason}
          </div>
        )}
      </div>

      {/* ── SIGNATURES ── */}
      <div style={{ marginTop: 34, border: '1.5px solid #1f2937', display: 'flex' }}>
        {[
          { label: 'Agent', name: `${data.employee.firstName} ${data.employee.lastName}`, date: data.requestedAt ? fmt(data.requestedAt) : undefined },
          { label: 'Chef de service', name: undefined, date: undefined },
          { label: 'Ressources Humaines', name: data.status !== 'PENDING' ? data.reviewedByName : undefined, date: data.status !== 'PENDING' ? fmt(data.reviewedAt) : undefined },
        ].map((col, i) => (
          <div
            key={col.label}
            style={{
              flex: 1,
              padding: '14px 10px 18px',
              borderLeft: i === 0 ? 'none' : '1.5px solid #1f2937',
              minHeight: 130,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              textAlign: 'center',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 13, textDecoration: 'underline' }}>{col.label}</div>
            <div style={{ fontSize: 12, minHeight: 40 }}>
              {col.name && <div style={{ fontWeight: 600 }}>{col.name}</div>}
              {col.date && <div style={{ color: '#6b7280' }}>{col.date}</div>}
            </div>
            <div style={{ fontWeight: 700, fontSize: 11 }}>Date et signature</div>
          </div>
        ))}
      </div>

      {/* ── PIED DE PAGE ── */}
      <div style={{ marginTop: 26, textAlign: 'center', fontSize: 9.5, color: '#4b5563', lineHeight: 1.6, borderTop: '1px solid #e5e7eb', paddingTop: 10 }}>
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
