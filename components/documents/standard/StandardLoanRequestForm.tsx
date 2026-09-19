'use client';

// ============================================================================
// 📁 components/documents/standard/StandardLoanRequestForm.tsx
// ✅ Reproduit le modèle "FORMULAIRE DE DEMANDE DE PRÊT" (Arkia, Petrodys,
//    Infinitium) — un seul composant pour toute entreprise au modèle
//    STANDARD. Suit companies.documentTemplate === 'STANDARD', même
//    sélecteur que congé/avance (paramètres → Modèle de document).
// ✅ Hiérarchie simplifiée à dessein : seule la ligne "Direction des
//    Ressources Humaines" reflète une vraie décision (drhDecision/
//    dgDecision — la validation est déjà PARALLÈLE dans l'app, RH ou Admin
//    tranche seul). Les lignes "Responsable Comptable" et "Direction
//    Générale" restent des cases à signer à la main, comme sur le papier
//    d'origine — pas de rôle "Responsable Comptable" dans le workflow.
// ============================================================================

import React from 'react';

interface StandardCompany {
  legalName: string;
  tradeName?: string | null;
  logo?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
  cachetUrl?: string | null;
  documentFooterText?: string | null;
}

const COUNTRY_LABELS: Record<string, string> = { CG: 'République du Congo' };

const NATURE_LABELS: Record<string, string> = {
  SOCIAL: 'Prêt social',
  SCOLARITE: 'Prêt scolarité',
  LOGEMENT: 'Prêt logement',
  EXCEPTIONNEL: 'Prêt exceptionnel',
  AUTRE: 'Autre',
};
const NATURE_ORDER = ['SOCIAL', 'SCOLARITE', 'LOGEMENT', 'EXCEPTIONNEL', 'AUTRE'];

export interface StandardLoanRequestFormData {
  reference?: string;
  company: StandardCompany;
  employee: {
    firstName: string;
    lastName: string;
    employeeNumber?: string | null;
    position?: string;
    phone?: string;
  };
  nature?: string | null; // SOCIAL | SCOLARITE | LOGEMENT | EXCEPTIONNEL | AUTRE
  amount: number | string;
  durationMonths?: number | string | null; // dérivé de startDate/endDate côté page
  recoverViaPayroll?: boolean | null;
  reason?: string | null;
  requestedAt?: string | Date;
  drhDecision?: 'OUI' | 'NON' | null;
  dgDecision?: 'OUI' | 'NON' | null;
}

const fmtDate = (d?: string | Date | null) => {
  if (!d) return '……/……./……';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return '……/……./……';
  return date.toLocaleDateString('fr-FR');
};
const fmtMoney = (n?: number | string) => (n != null && n !== '' ? Number(n).toLocaleString('fr-FR') : '…………');

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span style={{ display: 'inline-flex', width: 13, height: 13, border: '1px solid #1f2937', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, marginRight: 4 }}>
      {checked ? '✕' : ''}
    </span>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontWeight: 700, fontSize: 13 }}>{label}</div>
      <div style={{ borderBottom: '1px solid #9ca3af', minHeight: 18, paddingTop: 2, fontSize: 13 }}>{value ?? ''}</div>
    </div>
  );
}

export default function StandardLoanRequestForm({ data, id }: { data: StandardLoanRequestFormData; id?: string }) {
  const companyName = data.company.tradeName || data.company.legalName || 'Entreprise';
  const validated = data.drhDecision === 'OUI';
  const rejected = data.drhDecision === 'NON';

  return (
    <div id={id} style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', background: '#fff', color: '#111827', fontFamily: 'Georgia, "Times New Roman", serif', padding: '16mm 18mm', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          {data.company.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.company.logo} alt={companyName} style={{ height: 64, objectFit: 'contain' }} />
          ) : (
            <div style={{ fontWeight: 700, fontSize: 20 }}>{companyName}</div>
          )}
          <div style={{ marginTop: 6, fontSize: 9.5, color: '#4b5563', lineHeight: 1.5 }}>
            {data.company.address && <div>{data.company.address}</div>}
            {(data.company.city || data.company.country) && (
              <div>
                {data.company.city}{data.company.city && data.company.country ? ', ' : ''}
                {data.company.country ? (COUNTRY_LABELS[data.company.country] || data.company.country) : ''}
              </div>
            )}
            {(data.company.phone || data.company.email) && (
              <div>
                {data.company.phone && <>Tél. : {data.company.phone}</>}
                {data.company.phone && data.company.email ? ' · ' : ''}
                {data.company.email && <>Email : {data.company.email}</>}
              </div>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: 11 }}>
          <div style={{ fontWeight: 700 }}>Réf. : {data.reference || '—'}</div>
          <div style={{ fontStyle: 'italic', color: '#374151' }}>Direction des Ressources Humaines</div>
        </div>
      </div>

      <div style={{ borderTop: '1.5px solid #92400e', margin: '0 0 14px' }} />
      <h1 style={{ textAlign: 'center', fontSize: 20, fontWeight: 700, letterSpacing: 1, margin: '0 0 6px' }}>
        FORMULAIRE DE DEMANDE DE PRÊT
      </h1>
      <div style={{ borderTop: '1px solid #92400e', margin: '0 0 8px' }} />
      <p style={{ textAlign: 'center', fontStyle: 'italic', color: '#6b7280', fontSize: 11, margin: '0 0 16px' }}>
        Prêt au personnel — à usage interne
      </p>

      <p style={{ fontSize: 12.5, marginBottom: 18 }}>
        À compléter par le/la salarié(e) demandeur(se) et à remettre à la Direction des Ressources Humaines, accompagné
        des pièces justificatives requises.
      </p>

      <h2 style={{ color: '#92400e', fontSize: 13, fontWeight: 700, letterSpacing: 0.5, margin: '0 0 8px' }}>
        IDENTITÉ DU DEMANDEUR
      </h2>
      <Field label="Nom et prénom" value={`${data.employee.lastName} ${data.employee.firstName}`.trim()} />
      <Field label="Matricule" value={data.employee.employeeNumber} />
      <Field label="Poste occupé" value={data.employee.position} />
      <Field label="Téléphone" value={data.employee.phone} />

      <h2 style={{ color: '#92400e', fontSize: 13, fontWeight: 700, letterSpacing: 0.5, margin: '18px 0 8px' }}>
        OBJET DE LA DEMANDE
      </h2>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Nature du prêt :</div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12.5 }}>
          {NATURE_ORDER.map((key) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center' }}>
              <Checkbox checked={data.nature === key} /> {NATURE_LABELS[key]}
            </div>
          ))}
        </div>
      </div>
      <Field label="Montant sollicité" value={`${fmtMoney(data.amount)} FCFA`} />
      <Field label="Durée de remboursement souhaitée" value={data.durationMonths ? `${data.durationMonths} mois` : ''} />
      <Field
        label="Mode de remboursement"
        value={data.recoverViaPayroll == null ? '' : data.recoverViaPayroll ? 'Prélèvement sur salaire' : 'Autre'}
      />
      <div style={{ fontSize: 12.5, marginBottom: 18 }}>
        <strong>Motif de la demande :</strong> {data.reason || ''}
      </div>

      <p style={{ fontSize: 12, lineHeight: 1.6, margin: '0 0 20px' }}>
        Je certifie l'exactitude des informations ci-dessus et m'engage, en cas d'accord, à respecter les modalités de
        remboursement fixées par la société.
      </p>

      <div style={{ fontSize: 12, marginBottom: 8 }}>Fait à {data.company.city || 'Pointe-Noire'}, le {fmtDate(data.requestedAt)}</div>
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 22 }}>Signature du demandeur : ___________________________</div>

      <h2 style={{ color: '#92400e', fontSize: 13, fontWeight: 700, letterSpacing: 0.5, margin: '0 0 8px' }}>
        AVIS HIÉRARCHIQUE ET DÉCISION
      </h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #1f2937', padding: '6px 10px', textAlign: 'left', background: '#f3f4f6' }}>Fonction</th>
            <th style={{ border: '1px solid #1f2937', padding: '6px 10px', textAlign: 'left', background: '#f3f4f6' }}>Nom et visa</th>
            <th style={{ border: '1px solid #1f2937', padding: '6px 10px', textAlign: 'left', background: '#f3f4f6' }}>Décision</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #1f2937', padding: '10px' }}>Responsable Comptable</td>
            <td style={{ border: '1px solid #1f2937', padding: '10px' }}>&nbsp;</td>
            <td style={{ border: '1px solid #1f2937', padding: '10px' }}>
              <Checkbox checked={false} /> Favorable &nbsp;&nbsp;<Checkbox checked={false} /> Défavorable
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #1f2937', padding: '10px' }}>Direction des Ressources Humaines</td>
            <td style={{ border: '1px solid #1f2937', padding: '10px' }}>
              {validated && data.company.cachetUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.company.cachetUrl} alt="Cachet" style={{ height: 34, objectFit: 'contain' }} />
              ) : (
                '\u00A0'
              )}
            </td>
            <td style={{ border: '1px solid #1f2937', padding: '10px' }}>
              <Checkbox checked={validated} /> Favorable &nbsp;&nbsp;<Checkbox checked={rejected} /> Défavorable
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #1f2937', padding: '10px' }}>Direction Générale</td>
            <td style={{ border: '1px solid #1f2937', padding: '10px' }}>&nbsp;</td>
            <td style={{ border: '1px solid #1f2937', padding: '10px' }}>
              <Checkbox checked={false} /> Favorable &nbsp;&nbsp;<Checkbox checked={false} /> Défavorable
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ marginTop: 18, fontSize: 12.5 }}>
        Montant approuvé : {validated ? `${fmtMoney(data.amount)} FCFA` : '……………………………………………………..'}
      </div>

      <div style={{ marginTop: 32, textAlign: 'center', fontSize: 10, color: '#4b5563', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
        {data.company.documentFooterText || `${companyName} — Document confidentiel à usage exclusif du destinataire`}
      </div>
    </div>
  );
}