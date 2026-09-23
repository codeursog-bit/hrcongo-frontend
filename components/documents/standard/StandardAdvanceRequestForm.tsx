'use client';

// ============================================================================
// 📁 components/documents/standard/StandardAdvanceRequestForm.tsx
// ✅ Reproduit le modèle "FORMULAIRE DE DEMANDE D'AVANCE SUR SALAIRE" (Arkia,
//    Axis Oil, Petrodys, Geolane). "Mois de rattachement" (vu uniquement sur
//    le PDF Axis) est affiché dès qu'on a la donnée — les autres entreprises
//    au même modèle ne le remplissent simplement jamais, aucune branche
//    séparée nécessaire.
// ✅ Même simplification hiérarchique que le prêt : seule la ligne RH reflète
//    une vraie décision ; Responsable direct / Direction Générale restent
//    des cases à signer à la main.
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
const MONTH_LABELS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

export interface StandardAdvanceRequestFormData {
  reference?: string;
  company: StandardCompany;
  employee: {
    firstName: string;
    lastName: string;
    employeeNumber?: string | null;
    position?: string;
    phone?: string;
  };
  amount: number | string;
  /** Mois/année auquel se rattache l'avance — affiché seulement si fourni (cas Axis). */
  month?: number | null;
  year?: number | null;
  recoverViaPayroll?: boolean | null;
  reason?: string | null;
  requestedAt?: string | Date;
  status: string; // PENDING | APPROVED | REJECTED | PAID | DEDUCTED | CANCELLED
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
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontWeight: 700, fontSize: 12.5 }}>{label}</div>
      <div style={{ borderBottom: '1px solid #9ca3af', minHeight: 15, paddingTop: 1, fontSize: 12.5 }}>{value ?? ''}</div>
    </div>
  );
}

export default function StandardAdvanceRequestForm({ data, id }: { data: StandardAdvanceRequestFormData; id?: string }) {
  const companyName = data.company.tradeName || data.company.legalName || 'Entreprise';
  const validated = data.status === 'APPROVED' || data.status === 'PAID' || data.status === 'DEDUCTED';
  const rejected = data.status === 'REJECTED';

  return (
    <div id={id} style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', background: '#fff', color: '#111827', fontFamily: 'Georgia, "Times New Roman", serif', padding: '12mm 15mm', boxSizing: 'border-box' }}>
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
      <h1 style={{ textAlign: 'center', fontSize: 18, fontWeight: 700, letterSpacing: 1, margin: '0 0 4px' }}>
        FORMULAIRE DE DEMANDE D'AVANCE SUR SALAIRE
      </h1>
      <div style={{ borderTop: '1px solid #92400e', margin: '0 0 8px' }} />
      <p style={{ textAlign: 'center', fontStyle: 'italic', color: '#6b7280', fontSize: 10.5, margin: '0 0 10px' }}>
        Avance sur salaire — à usage interne
      </p>

      <p style={{ fontSize: 11.5, marginBottom: 12 }}>
        À compléter par le/la salarié(e) demandeur(se) et à remettre à la Direction des Ressources Humaines, accompagné
        des pièces justificatives requises.
      </p>

      <h2 style={{ color: '#92400e', fontSize: 13, fontWeight: 700, letterSpacing: 0.5, margin: '0 0 6px' }}>
        IDENTITÉ DU DEMANDEUR
      </h2>
      <Field label="Nom et prénom" value={`${data.employee.lastName} ${data.employee.firstName}`.trim()} />
      <Field label="Matricule" value={data.employee.employeeNumber} />
      <Field label="Poste occupé" value={data.employee.position} />
      <Field label="Téléphone" value={data.employee.phone} />

      <h2 style={{ color: '#92400e', fontSize: 13, fontWeight: 700, letterSpacing: 0.5, margin: '12px 0 6px' }}>
        OBJET DE LA DEMANDE
      </h2>
      <Field label="Montant de l'avance sollicitée" value={`${fmtMoney(data.amount)} FCFA`} />
      {data.month && data.year && (
        <Field label="Mois de rattachement" value={`${MONTH_LABELS[data.month - 1] || data.month} ${data.year}`} />
      )}
      <Field
        label="Mode de récupération"
        value={data.recoverViaPayroll == null ? '' : data.recoverViaPayroll ? 'Prélèvement sur salaire' : 'Autre'}
      />
      <div style={{ fontSize: 11.5, marginBottom: 10 }}>
        <strong>Motif de la demande :</strong> {data.reason || ''}
      </div>

      <p style={{ fontSize: 10.5, lineHeight: 1.4, margin: '0 0 12px' }}>
        Je reconnais que cette avance sera déduite de mon salaire selon les modalités approuvées par la Direction,
        conformément au règlement intérieur en vigueur.
      </p>

      <div style={{ fontSize: 11, marginBottom: 6 }}>Fait à {data.company.city || 'Pointe-Noire'}, le {fmtDate(data.requestedAt)}</div>
      <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 14 }}>Signature du demandeur : ___________________________</div>

      <h2 style={{ color: '#92400e', fontSize: 13, fontWeight: 700, letterSpacing: 0.5, margin: '10px 0 6px' }}>
        AVIS HIÉRARCHIQUE ET DÉCISION
      </h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #1f2937', padding: '5px 10px', textAlign: 'left', background: '#f3f4f6' }}>Fonction</th>
            <th style={{ border: '1px solid #1f2937', padding: '5px 10px', textAlign: 'left', background: '#f3f4f6' }}>Nom et visa</th>
            <th style={{ border: '1px solid #1f2937', padding: '5px 10px', textAlign: 'left', background: '#f3f4f6' }}>Décision</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #1f2937', padding: '6px 10px' }}>Responsable direct</td>
            <td style={{ border: '1px solid #1f2937', padding: '6px 10px' }}>&nbsp;</td>
            <td style={{ border: '1px solid #1f2937', padding: '6px 10px' }}>
              <Checkbox checked={false} /> Favorable &nbsp;&nbsp;<Checkbox checked={false} /> Défavorable
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #1f2937', padding: '6px 10px' }}>Direction des Ressources Humaines</td>
            <td style={{ border: '1px solid #1f2937', padding: '6px 10px' }}>
              {validated && data.company.cachetUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.company.cachetUrl} alt="Cachet" style={{ height: 34, objectFit: 'contain' }} />
              ) : (
                '\u00A0'
              )}
            </td>
            <td style={{ border: '1px solid #1f2937', padding: '6px 10px' }}>
              <Checkbox checked={validated} /> Favorable &nbsp;&nbsp;<Checkbox checked={rejected} /> Défavorable
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #1f2937', padding: '6px 10px' }}>Direction Générale</td>
            <td style={{ border: '1px solid #1f2937', padding: '6px 10px' }}>&nbsp;</td>
            <td style={{ border: '1px solid #1f2937', padding: '6px 10px' }}>
              <Checkbox checked={false} /> Favorable &nbsp;&nbsp;<Checkbox checked={false} /> Défavorable
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ marginTop: 10, fontSize: 11.5 }}>
        Montant approuvé : {validated ? `${fmtMoney(data.amount)} FCFA` : '……………………………………………………..'}
      </div>

      <div style={{ marginTop: 16, textAlign: 'center', fontSize: 9, color: '#4b5563', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
        {data.company.documentFooterText || `${companyName} — Document confidentiel à usage exclusif du destinataire`}
      </div>
    </div>
  );
}