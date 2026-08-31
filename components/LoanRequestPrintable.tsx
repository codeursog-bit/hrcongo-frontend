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
  rccmNumber?: string; taxNumber?: string; address?: string; city?: string; phone?: string;
  documentFooterText?: string | null; cachetUrl?: string | null;
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
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
    <span style={{ display: 'inline-flex', width: 20, height: 20, border: '2px solid #1f2937', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
      {checked ? '✕' : ''}
    </span>
    <span style={{ fontSize: 15 }}>{label}</span>
  </div>
);

export default function LoanRequestPrintable({ id, data }: { id: string; data: LoanRequestPrintableData }) {
  const companyName = data.company.tradeName || data.company.legalName || 'Entreprise';
  const isDualApproval = data.docType === 'MARCHANDISE' || data.docType === 'ARGENT' || data.docType === 'AUTRE';

  return (
    <div id={id} style={{ width: '210mm', minHeight: '297mm', background: '#fff', color: '#1f2937', fontFamily: 'Arial, Helvetica, sans-serif', padding: '16mm 18mm', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
        {data.company.logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.company.logo} alt={companyName} style={{ height: 56, objectFit: 'contain' }} />
        )}
        <span style={{ fontSize: 21, fontWeight: 800, letterSpacing: 1 }}>{companyName}</span>
      </div>

      <div style={{ border: '2px solid #1f2937', padding: '11px 16px', marginBottom: 20 }}>
        <h1 style={{ fontSize: 19, fontWeight: 800, letterSpacing: 0.5, margin: 0, textAlign: 'center' }}>{TITLE[data.docType]}</h1>
      </div>

      <div style={{ fontSize: 14, marginBottom: 18, fontWeight: 700, textAlign: 'center' }}>Référence : {data.reference || '.....................'}</div>

      <table style={{ width: '100%', fontSize: 15, borderCollapse: 'collapse', marginBottom: 22, lineHeight: 1.6 }}>
        <tbody>
          <tr><td style={{ padding: '7px 0', width: 130 }}><strong>NOM :</strong></td><td colSpan={3} style={{ borderBottom: '1px solid #9ca3af' }}>{data.employee.lastName}</td></tr>
          <tr><td style={{ padding: '7px 0' }}><strong>PRÉNOMS :</strong></td><td colSpan={3} style={{ borderBottom: '1px solid #9ca3af' }}>{data.employee.firstName}</td></tr>
          <tr>
            <td style={{ padding: '7px 0', width: 130 }}><strong>POSTE :</strong></td>
            <td style={{ borderBottom: '1px solid #9ca3af' }}>{data.employee.position || ''}</td>
            <td style={{ padding: '7px 16px', width: 90, textAlign: 'center' }}><strong>TÉL :</strong></td>
            <td style={{ borderBottom: '1px solid #9ca3af', width: 160, textAlign: 'center' }}>{data.employee.phone || ''}</td>
          </tr>
          <tr><td style={{ padding: '7px 0' }}><strong>SERVICE :</strong></td><td colSpan={3} style={{ borderBottom: '1px solid #9ca3af' }}>{data.employee.departmentName || ''}</td></tr>
        </tbody>
      </table>

      {data.reason && data.docType !== 'MARCHANDISE' && (
        <div style={{ marginBottom: 20, fontSize: 15, borderBottom: '1px solid #9ca3af', paddingBottom: 6 }}>
          <strong>Motif :</strong> {data.reason}
        </div>
      )}

      <table style={{ width: '100%', fontSize: 15, borderCollapse: 'collapse', marginBottom: 22, lineHeight: 1.6 }}>
        <tbody>
          <tr>
            <td style={{ padding: '8px 0', width: 270 }}><strong>{data.docType === 'AVANCE' ? "Montant de l'avance demandée :" : data.docType === 'MARCHANDISE' ? 'Montant total de la marchandise :' : 'Montant du prêt demandé :'}</strong></td>
            <td style={{ borderBottom: '1px solid #9ca3af' }}>{fmtMoney(data.amount)} FCFA</td>
          </tr>
          <tr><td style={{ padding: '8px 0' }}><strong>Date :</strong></td><td style={{ borderBottom: '1px solid #9ca3af' }}>{fmt(data.requestedAt)}</td></tr>
          {data.docType !== 'AVANCE' && (
            <>
              <tr><td style={{ padding: '8px 0' }}><strong>Mensualité de prêt :</strong></td><td style={{ borderBottom: '1px solid #9ca3af' }}>{fmtMoney(data.monthlyRepayment)} FCFA</td></tr>
              <tr><td style={{ padding: '8px 0' }}><strong>Durée du prêt :</strong></td><td style={{ borderBottom: '1px solid #9ca3af' }}>{data.durationMonths || '—'} ( Mois )</td></tr>
            </>
          )}
          {data.previousLoanAmount != null && (
            <tr>
              <td style={{ padding: '8px 0' }}><strong>Montant du prêt précédent :</strong></td>
              <td style={{ borderBottom: '1px solid #9ca3af' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span>{fmtMoney(data.previousLoanAmount)} FCFA</span>
                  <span><strong>Total :</strong> {fmtMoney(Number(data.previousLoanAmount) + Number(data.amount || 0))} FCFA</span>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ✅ Bloc "Fait à / Signature / Avis" poussé vers le bas de la page A4 (marginTop: auto)
          plutôt que collé au tableau du dessus — reproduit la position basse du modèle papier. */}
      <div style={{ marginTop: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 34, fontSize: 14 }}>
          <div>Fait à {data.company.city || '...............................'}, le {fmt(data.requestedAt)}</div>
        </div>
        <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 700, marginBottom: 34 }}>Signature de l&apos;Agent</div>

        {/* Avis / signature(s)
            ✅ Le cachet de l'entreprise (paramètres → entreprise) s'affiche à la place
            du couple OUI/NON dès que la décision correspondante est validée — c'est la
            "signature" du validateur, agrandie pour bien ressortir à l'impression. */}
        {!isDualApproval ? (
          <div style={{ border: '2px solid #1f2937', padding: '18px 22px', minHeight: 110 }}>
            <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Avis et Signature du Chef de Service</p>
            {data.chefDecision === 'OUI' && data.company.cachetUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.company.cachetUrl} alt="Cachet" style={{ height: 96, objectFit: 'contain' }} />
            ) : (
              <>
                <Box label="OUI" checked={data.chefDecision === 'OUI'} />
                <Box label="NON" checked={data.chefDecision === 'NON'} />
              </>
            )}
            {data.chefName && <p style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>{data.chefName}</p>}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 18 }}>
            <div style={{ flex: 1, border: '2px solid #1f2937', padding: '18px 22px', minHeight: 110 }}>
              <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Avis et Signature DRH</p>
              {data.drhDecision === 'OUI' && data.company.cachetUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.company.cachetUrl} alt="Cachet" style={{ height: 96, objectFit: 'contain' }} />
              ) : (
                <>
                  <Box label="OUI" checked={data.drhDecision === 'OUI'} />
                  <Box label="NON" checked={data.drhDecision === 'NON'} />
                </>
              )}
              {data.drhName && <p style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>{data.drhName}</p>}
            </div>
            <div style={{ flex: 1, border: '2px solid #1f2937', padding: '18px 22px', minHeight: 110 }}>
              <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Avis et signature Directeur Général</p>
              {data.dgDecision === 'OUI' && data.company.cachetUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.company.cachetUrl} alt="Cachet" style={{ height: 96, objectFit: 'contain' }} />
              ) : (
                <>
                  <Box label="OUI" checked={data.dgDecision === 'OUI'} />
                  <Box label="NON" checked={data.dgDecision === 'NON'} />
                </>
              )}
              {data.dgName && <p style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>{data.dgName}</p>}
            </div>
          </div>
        )}

        <p style={{ fontSize: 11.5, color: '#6b7280', marginTop: 16 }}>P.S : Merci de joindre un justificatif ( Maladie ou autres )</p>
      </div>

      {/* ── PIED DE PAGE ──
          Texte libre défini par l'entreprise (paramètres → Pied de page des documents)
          s'il existe ; sinon composition automatique à partir de RCCM/NIU/adresse. */}
      <div style={{ marginTop: 26, textAlign: 'center', fontSize: 10.5, color: '#4b5563', lineHeight: 1.6, borderTop: '1px solid #e5e7eb', paddingTop: 10, whiteSpace: 'pre-line' }}>
        {data.company.documentFooterText ? (
          data.company.documentFooterText
        ) : (
          <>
            <div style={{ fontWeight: 700 }}>{companyName}</div>
            {(data.company.rccmNumber || data.company.taxNumber) && (
              <div>
                {data.company.rccmNumber && <>RCCM : {data.company.rccmNumber}&nbsp;&nbsp;</>}
                {data.company.taxNumber && <>NIU : {data.company.taxNumber}</>}
              </div>
            )}
            {data.company.address && <div>{data.company.address}</div>}
            <div style={{ marginTop: 6, fontStyle: 'italic' }}>Document généré via Konza RH</div>
          </>
        )}
      </div>
    </div>
  );
}