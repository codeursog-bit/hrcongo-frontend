'use client';

// ============================================================================
// 📁 components/documents/standard/StandardAbsenceRequestForm.tsx
// ✅ Reproduit le modèle "DEMANDE D'AUTORISATION D'ABSENCE" (Axis Oil,
//    Geolane, Petrodys, Infinitium) — un seul composant pour toute
//    entreprise au modèle STANDARD. La liste des motifs et leur nombre de
//    jours conventionnels vient du catalogue propre à l'entreprise
//    (AbsenceMotif) — rien n'est en dur, chaque entreprise a ses propres
//    valeurs (ex: "Décès du conjoint" = 6, 7 ou 10 jours selon le client).
// ✅ Même simplification hiérarchique que les autres modèles : seule la
//    ligne RH reflète une vraie décision ; "Le Supérieur hiérarchique" et
//    "La Direction Générale" restent des cases à signer à la main.
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

export interface StandardAbsenceMotifRow {
  key: string;
  label: string;
  days: number;
}

export interface StandardAbsenceRequestFormData {
  reference?: string;
  company: StandardCompany;
  employee: {
    firstName: string;
    lastName: string;
    employeeNumber?: string | null;
    position?: string;
  };
  /** Catalogue complet de l'entreprise (pour reproduire le tableau tel quel sur le papier). */
  catalog: StandardAbsenceMotifRow[];
  /** Clé du motif choisi dans le catalogue — coche la bonne ligne. */
  motifKey?: string | null;
  startDate: string | Date;
  endDate: string | Date;
  requestedAt?: string | Date;
  status: string; // PENDING | APPROVED | REJECTED | CANCELLED
}

const fmtDate = (d?: string | Date | null) => {
  if (!d) return '……/……./……';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return '……/……./……';
  return date.toLocaleDateString('fr-FR');
};

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span style={{ display: 'inline-flex', width: 13, height: 13, border: '1px solid #1f2937', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>
      {checked ? '✕' : ''}
    </span>
  );
}

export default function StandardAbsenceRequestForm({ data, id }: { data: StandardAbsenceRequestFormData; id?: string }) {
  const companyName = data.company.tradeName || data.company.legalName || 'Entreprise';
  const validated = data.status === 'APPROVED';
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
        DEMANDE D'AUTORISATION D'ABSENCE
      </h1>
      <div style={{ borderTop: '1px solid #92400e', margin: '0 0 8px' }} />
      <p style={{ textAlign: 'center', fontStyle: 'italic', color: '#6b7280', fontSize: 10.5, margin: '0 0 10px' }}>
        Absence pour événement familial ou motif conventionnel
      </p>

      <h2 style={{ color: '#92400e', fontSize: 13, fontWeight: 700, letterSpacing: 0.5, margin: '0 0 6px' }}>
        RENSEIGNEMENTS DU COLLABORATEUR
      </h2>
      <div style={{ marginBottom: 4, fontSize: 12 }}>
        <strong>Nom(s) et prénom(s) :</strong> {`${data.employee.lastName} ${data.employee.firstName}`.trim()}
      </div>
      {data.employee.employeeNumber && (
        <div style={{ marginBottom: 4, fontSize: 12 }}><strong>Matricule :</strong> {data.employee.employeeNumber}</div>
      )}
      <div style={{ marginBottom: 8, fontSize: 12 }}><strong>Poste occupé :</strong> {data.employee.position || ''}</div>

      <h2 style={{ color: '#92400e', fontSize: 13, fontWeight: 700, letterSpacing: 0.5, margin: '0 0 6px' }}>
        MOTIF DE L'ABSENCE (COCHER LA CASE CORRESPONDANTE)
      </h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10.5, marginBottom: 8 }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #1f2937', padding: '3px 8px', textAlign: 'left', background: '#f3f4f6', fontSize: 10.5 }}>Motif</th>
            <th style={{ border: '1px solid #1f2937', padding: '3px 8px', textAlign: 'left', background: '#f3f4f6', width: '16%', fontSize: 10.5 }}>Durée</th>
            <th style={{ border: '1px solid #1f2937', padding: '3px 8px', textAlign: 'center', background: '#f3f4f6', width: 50, fontSize: 10.5 }}>Choix</th>
          </tr>
        </thead>
        <tbody>
          {data.catalog.map((m) => (
            <tr key={m.key}>
              <td style={{ border: '1px solid #1f2937', padding: '3px 8px' }}>{m.label}</td>
              <td style={{ border: '1px solid #1f2937', padding: '3px 8px', color: '#6b7280' }}>
                {m.days}j
              </td>
              <td style={{ border: '1px solid #1f2937', padding: '3px 8px', textAlign: 'center' }}>
                <Checkbox checked={data.motifKey === m.key} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ fontSize: 11.5, marginBottom: 4 }}>
        <strong>Période d'absence du</strong> {fmtDate(data.startDate)} <strong>au</strong> {fmtDate(data.endDate)}
      </div>

      <div style={{ fontSize: 10.5, margin: '8px 0 4px' }}>Fait à {data.company.city || 'Pointe-Noire'}, le {fmtDate(data.requestedAt)}</div>
      <div style={{ fontSize: 10.5, fontWeight: 700, marginBottom: 10 }}>Signature du collaborateur : ___________________________</div>

      <h2 style={{ color: '#92400e', fontSize: 13, fontWeight: 700, letterSpacing: 0.5, margin: '8px 0 4px' }}>
        DÉCISION DE LA HIÉRARCHIE
      </h2>
      <div style={{ fontSize: 11.5, marginBottom: 8 }}>
        <Checkbox checked={validated} /> Accordé &nbsp;&nbsp;&nbsp;<Checkbox checked={rejected} /> Refusé
      </div>
      <div style={{ fontSize: 10.5, marginBottom: 14 }}><strong>Commentaire :</strong> {' '}</div>

      <table style={{ width: '100%', fontSize: 9.5, textAlign: 'center', marginBottom: 8 }}>
        <tbody>
          <tr>
            <td style={{ width: '33%' }}>Le Supérieur hiérarchique</td>
            <td style={{ width: '33%' }}>La Direction des Ressources Humaines</td>
            <td style={{ width: '33%' }}>La Direction Générale</td>
          </tr>
          <tr>
            <td style={{ height: 30 }} />
            <td>
              {validated && data.company.cachetUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.company.cachetUrl} alt="Cachet" style={{ height: 32, objectFit: 'contain', margin: '0 auto' }} />
              ) : null}
            </td>
            <td />
          </tr>
        </tbody>
      </table>

      <div style={{ marginTop: 8, textAlign: 'center', fontSize: 8.5, color: '#4b5563', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
        {data.company.documentFooterText || `${companyName} — Document confidentiel à usage exclusif du destinataire`}
      </div>
    </div>
  );
}