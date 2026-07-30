'use client';

// ============================================================================
// 📁 components/LoanRequestPrintable.tsx
// ✅ Reproduit les 2 modèles papier fournis :
//    - "DEMANDE DE PRÊT - AVANCE SUR SALAIRE" (avance) → 1 case Avis/Signature
//    - "DEMANDE DE PRÊT - MARCHANDISES" (prêt argent/marchandise) → 2 cases
//      (DRH puis Directeur Général)
//    Un seul composant, adapté selon `docType`.
// ============================================================================

import React from 'react';

interface CompanyInfo {
  legalName?: string; tradeName?: string; logo?: string | null;
  rccmNumber?: string; taxNumber?: string; address?: string; phone?: string;
}

export interface LoanRequestPrintableData {
  reference?: string;
  company: CompanyInfo;
  employee: {
    firstName: string; lastName: string; position?: string;
    phone?: string; departmentName?: string;
  };
  docType: 'AVANCE' | 'ARGENT' | 'MARCHANDISE' | 'AUTRE';
  reason?: string;
  amount: number | string;
  requestDate?: string | Date;
  monthlyRepayment?: number | string;
  durationMonths?: number | string;
  previousLoanAmount?: number | string;
  status: string; // PENDING, PENDING_DG, ACTIVE, APPROVED, REJECTED, CANCELLED, PAID, DEDUCTED
  drhDecision?: 'OUI' | 'NON' | null;
  drhName?: string;
  dgDecision?: 'OUI' | 'NON' | null;
  dgName?: string;
  chefDecision?: 'OUI' | 'NON' | null; // pour AVANCE (1 seule case)
  chefName?: string;
  requestedAt?: string | Date;
}

const fmt = (d?: string | Date) => (d ? new Date(d).toLocaleDateString('fr-FR') : '.........................');
const fmtMoney = (n?: number | string) => (n != null && n !== '' ? `${Number(n).toLocaleString('fr-FR')}` : '.........................');

const TITLE: Record<string, string> = {
  AVANCE: 'DEMANDE DE PRÊT - AVANCE SUR SALAIRE',
  MARCHANDISE: 'DEMANDE DE PRÊT - MARCHANDISES',
  ARGENT: 'DEMANDE DE PRÊT - ARGENT',
  AUTRE: 'DEMANDE DE PRÊT',
};

const Box = ({ label, checked }: { label: string; checked: boolean }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
    <span style={{ display: 'inline-flex', width: 16, height: 16, border: '1.5px solid #1f2937', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
      {checked ? '✕' : ''}
    </span>
    <span style={{ fontSize: 12 }}>{label}</span>
  </div>
);

export default function LoanRequestPrintable({ id, data }: { id: string; data: LoanRequestPrintableData }) {
  const companyName = data.company.tradeName || data.company.legalName || 'Entreprise';
  const isDualApproval = data.docType === 'MARCHANDISE' || data.docType === 'ARGENT' || data.docType === 'AUTRE';

  return (
    <div id={id} style={{ width: '210mm', minHeight: '297mm', background: '#fff', color: '#1f2937', fontFamily: 'Arial, Helvetica, sans-serif', padding: '14mm 16mm', boxSizing: 'border-box' }}>
      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {data.company.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.company.logo} alt={companyName} style={{ height: 46, objectFit: 'contain' }} />
          )}
          <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: 1 }}>{companyName}</span>
        </div>
        <div style={{ fontSize: 11, fontWeight: 700 }}>Référence : {data.reference || '.....................'}</div>
      </div>

      <div style={{ border: '2px solid #1f2937', padding: '10px 16px', marginBottom: 20 }}>
        <h1 style={{ fontSize: 16, fontWeight: 800, letterSpacing: 0.5, margin: 0, textAlign: 'center' }}>{TITLE[data.docType]}</h1>
      </div>

      <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse', marginBottom: 18 }}>
        <tbody>
          <tr><td style={{ padding: '5px 0', width: 110 }}><strong>NOM :</strong></td><td style={{ borderBottom: '1px solid #9ca3af' }}>{data.employee.lastName}</td></tr>
          <tr><td style={{ padding: '5px 0' }}><strong>PRÉNOMS :</strong></td><td style={{ borderBottom: '1px solid #9ca3af' }}>{data.employee.firstName}</td></tr>
          <tr>
            <td style={{ padding: '5px 0' }}><strong>POSTE :</strong></td>
            <td style={{ borderBottom: '1px solid #9ca3af' }}>
              {data.employee.position || ''} <span style={{ float: 'right' }}><strong>TÉL :</strong> {data.employee.phone || ''}</span>
            </td>
          </tr>
          <tr><td style={{ padding: '5px 0' }}><strong>SERVICE :</strong></td><td style={{ borderBottom: '1px solid #9ca3af' }}>{data.employee.departmentName || ''}</td></tr>
        </tbody>
      </table>

      {data.reason && (
        <div style={{ marginBottom: 16, fontSize: 13 }}>
          <strong>Motif :</strong>
          <div style={{ borderBottom: '1px solid #9ca3af', paddingBottom: 4, marginTop: 4 }}>{data.reason}</div>
        </div>
      )}

      <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse', marginBottom: 18 }}>
        <tbody>
          <tr>
            <td style={{ padding: '6px 0', width: 240 }}><strong>{data.docType === 'AVANCE' ? "Montant de l'avance demandée :" : 'Montant du prêt demandé :'}</strong></td>
            <td style={{ borderBottom: '1px solid #9ca3af' }}>{fmtMoney(data.amount)} FCFA</td>
          </tr>
          <tr><td style={{ padding: '6px 0' }}><strong>Date :</strong></td><td style={{ borderBottom: '1px solid #9ca3af' }}>{fmt(data.requestedAt)}</td></tr>
          {data.docType !== 'AVANCE' && (
            <>
              <tr><td style={{ padding: '6px 0' }}><strong>Mensualité de prêt :</strong></td><td style={{ borderBottom: '1px solid #9ca3af' }}>{fmtMoney(data.monthlyRepayment)} FCFA</td></tr>
              <tr><td style={{ padding: '6px 0' }}><strong>Durée du prêt :</strong></td><td style={{ borderBottom: '1px solid #9ca3af' }}>{data.durationMonths || '—'} ( Mois )</td></tr>
            </>
          )}
          {data.previousLoanAmount != null && (
            <tr><td style={{ padding: '6px 0' }}><strong>Montant du prêt précédent :</strong></td><td style={{ borderBottom: '1px solid #9ca3af' }}>{fmtMoney(data.previousLoanAmount)} FCFA</td></tr>
          )}
        </tbody>
      </table>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40, marginBottom: 30, fontSize: 12 }}>
        <div>Fait à ..............................., le {fmt(data.requestedAt)}</div>
      </div>
      <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, marginBottom: 30 }}>Signature de l&apos;Agent</div>

      {/* Avis / signature(s) */}
      {!isDualApproval ? (
        <div style={{ border: '1.5px solid #1f2937', padding: '14px 18px' }}>
          <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Avis et Signature du Chef de Service</p>
          <Box label="OUI" checked={data.chefDecision === 'OUI'} />
          <Box label="NON" checked={data.chefDecision === 'NON'} />
          {data.chefName && <p style={{ fontSize: 11, color: '#6b7280', marginTop: 8 }}>{data.chefName}</p>}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1, border: '1.5px solid #1f2937', padding: '14px 18px' }}>
            <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Avis et Signature DRH</p>
            <Box label="OUI" checked={data.drhDecision === 'OUI'} />
            <Box label="NON" checked={data.drhDecision === 'NON'} />
            {data.drhName && <p style={{ fontSize: 11, color: '#6b7280', marginTop: 8 }}>{data.drhName}</p>}
          </div>
          <div style={{ flex: 1, border: '1.5px solid #1f2937', padding: '14px 18px' }}>
            <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Avis et signature Directeur Général</p>
            <Box label="OUI" checked={data.dgDecision === 'OUI'} />
            <Box label="NON" checked={data.dgDecision === 'NON'} />
            {data.dgName && <p style={{ fontSize: 11, color: '#6b7280', marginTop: 8 }}>{data.dgName}</p>}
          </div>
        </div>
      )}

      <p style={{ fontSize: 10, color: '#6b7280', marginTop: 14 }}>P.S : Merci de joindre un justificatif ( Maladie ou autres )</p>

      <div style={{ marginTop: 40, textAlign: 'center', fontSize: 9.5, color: '#4b5563', lineHeight: 1.6, borderTop: '1px solid #e5e7eb', paddingTop: 10 }}>
        <div style={{ fontWeight: 700 }}>{companyName}</div>
        {(data.company.rccmNumber || data.company.taxNumber) && (
          <div>
            {data.company.rccmNumber && <>RCCM : {data.company.rccmNumber}&nbsp;&nbsp;</>}
            {data.company.taxNumber && <>NIU : {data.company.taxNumber}</>}
          </div>
        )}
        {data.company.address && <div>{data.company.address}</div>}
        <div style={{ marginTop: 6, fontStyle: 'italic' }}>Document généré via Konza RH</div>
      </div>
    </div>
  );
}
