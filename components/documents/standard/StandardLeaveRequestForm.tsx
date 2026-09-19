'use client';

// ============================================================================
// 📁 components/documents/standard/StandardLeaveRequestForm.tsx
// ✅ Reproduit à l'identique le modèle "FORMULAIRE DE DEPART EN CONGE" fourni
//    par les clients Arkia / Axis Oil / Petrodys / Geolane — c'est le MÊME
//    gabarit chez les 4 (mêmes tableaux, mêmes libellés) : seuls le logo, la
//    raison sociale et le pied de page changent. Un seul composant sert donc
//    pour n'importe quelle entreprise ayant choisi ce modèle — rien n'est en
//    dur, tout vient de `company` (déjà multi-entreprise dans l'app).
// ✅ Sélectionné via company.documentTemplate === 'STANDARD' (voir
//    parametres/entreprise → "Modèle de document" → "Modèle 2"), exactement
//    comme le modèle Orca existant. N'importe quelle entreprise dont le
//    service RH utilise ce type de formulaire peut choisir ce même modèle —
//    il n'est pas spécifique à un seul client.
// ============================================================================

import React from 'react';

// Congo (République du) est la valeur par défaut du champ `country` en base
// (@default("CG")) — les autres codes s'affichent tels quels si un client
// est un jour basé ailleurs.
const COUNTRY_LABELS: Record<string, string> = {
  CG: 'République du Congo',
};

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

export interface StandardLeaveRequestFormData {
  id?: string;
  /** Code d'en-tête du document (ex. "ARK-010-2026/FDA/DRH"). Optionnel —
   *  à défaut, la référence de la demande elle-même est affichée (plus
   *  utile : elle identifie CE dossier précis, pas seulement le modèle). */
  documentReferenceCode?: string;
  reference?: string;
  company: StandardCompany;
  employee: {
    firstName: string;
    lastName: string;
    employeeNumber?: string | null;
    position?: string;
    departmentName?: string;
    hireDate?: string | Date | null;
  };
  startDate: string | Date;
  endDate: string | Date;
  daysCount: number | string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | string;
  requestedAt?: string | Date;
}

const fmtDate = (d?: string | Date | null) => {
  if (!d) return '……/……./……';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return '……/……./……';
  return date.toLocaleDateString('fr-FR');
};

function Row({ label, value, tall }: { label: string; value: React.ReactNode; tall?: boolean }) {
  return (
    <tr>
      <td
        style={{
          border: '1px solid #1f2937',
          padding: '8px 12px',
          fontWeight: 700,
          width: '38%',
          verticalAlign: tall ? 'top' : 'middle',
        }}
      >
        {label}
      </td>
      <td
        style={{
          border: '1px solid #1f2937',
          padding: '8px 12px',
          minHeight: tall ? 54 : undefined,
          height: tall ? 54 : undefined,
          verticalAlign: 'top',
        }}
      >
        {value}
      </td>
    </tr>
  );
}

export default function StandardLeaveRequestForm({ data, id }: { data: StandardLeaveRequestFormData; id?: string }) {
  const companyName = data.company.tradeName || data.company.legalName || 'Entreprise';
  const validated = data.status === 'APPROVED';

  return (
    <div
      id={id}
      style={{
        width: '210mm',
        minHeight: '297mm',
        margin: '0 auto',
        background: '#fff',
        color: '#111827',
        fontFamily: 'Georgia, "Times New Roman", serif',
        padding: '16mm 18mm',
        boxSizing: 'border-box',
      }}
    >
      {/* En-tête : logo à gauche, référence + direction à droite */}
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
                {data.company.city}
                {data.company.city && data.company.country ? ', ' : ''}
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
          <div style={{ fontWeight: 700 }}>
            Réf. : {data.documentReferenceCode || data.reference || '—'}
          </div>
          <div style={{ fontStyle: 'italic', color: '#374151' }}>Direction des Ressources Humaines</div>
        </div>
      </div>

      <div style={{ borderTop: '1.5px solid #92400e', margin: '0 0 14px' }} />

      <h1
        style={{
          textAlign: 'center',
          fontSize: 21,
          fontWeight: 700,
          letterSpacing: 1,
          margin: '0 0 6px',
        }}
      >
        FORMULAIRE DE DEPART EN CONGE
      </h1>

      <div style={{ borderTop: '1px solid #92400e', margin: '0 0 26px' }} />

      <h2 style={{ color: '#92400e', fontSize: 14, fontWeight: 700, letterSpacing: 0.5, margin: '0 0 8px' }}>
        IDENTITÉ DU SALARIÉ
      </h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 22 }}>
        <tbody>
          <Row label="Nom et prénom" value={`${data.employee.lastName} ${data.employee.firstName}`.trim()} />
          <Row label="Matricule" value={data.employee.employeeNumber || ''} />
          <Row label="Poste occupé" value={data.employee.position || ''} />
          <Row label="Service / Direction" value={data.employee.departmentName || ''} />
          <Row label="Date d'embauche" value={fmtDate(data.employee.hireDate)} />
        </tbody>
      </table>

      <h2 style={{ color: '#92400e', fontSize: 14, fontWeight: 700, letterSpacing: 0.5, margin: '0 0 8px' }}>
        OBJET DE LA DEMANDE
      </h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 22 }}>
        <tbody>
          <Row label="Date de départ" value={fmtDate(data.startDate)} />
          <Row label="Date de retour" value={fmtDate(data.endDate)} />
          <Row label="Nombre de jours" value={String(data.daysCount)} />
        </tbody>
      </table>

      <h2 style={{ fontSize: 14, fontWeight: 700, textDecoration: 'underline', margin: '0 0 8px' }}>
        Signature
      </h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 26 }}>
        <tbody>
          <Row label="Le Salarié" value=" " tall />
          <Row label="Le Responsable Hiérarchique" value=" " tall />
          <Row
            label="Les Ressources Humaines"
            tall
            value={
              validated && data.company.cachetUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.company.cachetUrl} alt="Cachet" style={{ height: 48, objectFit: 'contain' }} />
              ) : (
                ' '
              )
            }
          />
          <Row label="Signature de la Direction Générale" value=" " tall />
        </tbody>
      </table>

      <p style={{ fontSize: 12, lineHeight: 1.6, margin: '0 0 30px' }}>
        Le présent formulaire, une fois complété et validé, est transmis au service des Ressources Humaines pour
        établissement de l'attestation de mise en congé et mise à jour du dossier administratif du salarié.
      </p>

      <div style={{ textAlign: 'right', fontSize: 12, marginBottom: 30 }}>
        Fait à {data.company.city || 'Pointe-Noire'}, le {fmtDate(data.requestedAt) !== '……/……./……' ? fmtDate(data.requestedAt) : '……/……./……'}
      </div>

      {/* Pied de page — même mécanisme que le reste de l'app (paramètres → pied de page des documents) */}
      <div style={{ marginTop: 'auto', textAlign: 'center', fontSize: 10, color: '#4b5563', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
        {data.company.documentFooterText || `${companyName} — Document confidentiel à usage exclusif du destinataire`}
      </div>
    </div>
  );
}