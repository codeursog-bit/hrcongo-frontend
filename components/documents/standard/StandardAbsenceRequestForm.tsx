'use client';

// ============================================================================
// components/documents/standard/StandardAbsenceRequestForm.tsx
// Modèle "DEMANDE D'AUTORISATION D'ABSENCE" (STANDARD) — calé sur le PDF
// Infinitium. Une seule page A4 : hauteur fixe, pied de page ancré en bas.
// Les motifs et leur durée viennent de la convention collective (catalog).
// Les couleurs sont verrouillées par un <style> scopé en !important pour
// résister aux CSS globaux (mode sombre) à l'écran comme à l'export.
// Les espaceurs (<Spacer />) se compriment si le contenu grandit (ex. ligne
// Matricule) afin que le pied de page ne soit jamais rogné.
// ============================================================================

import type { ReactNode } from 'react';

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
  catalog: StandardAbsenceMotifRow[];
  motifKey?: string | null;
  startDate: string | Date;
  endDate: string | Date;
  requestedAt?: string | Date;
  status: string;
}

const FONT = `'Baskerville Old Face', Baskerville, Garamond, Georgia, 'Times New Roman', serif`;
const GOLD = '#b8860b';
const RULE = '#d1d5db';

const fmtDate = (d?: string | Date | null) => {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('fr-FR');
};

const cell = {
  border: `1px solid ${RULE}`,
  padding: '4px 8px',
  verticalAlign: 'top',
} as const;

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span
      className="std-abs-black"
      style={{
        display: 'inline-block',
        width: 10,
        height: 10,
        boxSizing: 'border-box',
        border: '1px solid #4b5563',
        overflow: 'hidden', // baseline identique case cochée / vide
        textAlign: 'center',
        fontSize: 8,
        fontWeight: 700,
        lineHeight: '8px',
        verticalAlign: '-1px',
      }}
    >
      {checked ? '✕' : ''}
    </span>
  );
}

function SectionTitle({ children, mt }: { children: ReactNode; mt: number }) {
  return (
    <h2
      className="std-abs-navy"
      style={{ margin: `${mt}px 0 0`, fontSize: 12.5, fontWeight: 700, letterSpacing: 0.3, lineHeight: 1.2 }}
    >
      {children}
    </h2>
  );
}

function Field({ label, value, mt = 4 }: { label: string; value: ReactNode; mt?: number }) {
  return (
    <div style={{ marginTop: mt }}>
      <div className="std-abs-black" style={{ fontWeight: 700, fontSize: 12, lineHeight: 1.2 }}>{label}</div>
      <div
        className="std-abs-black"
        style={{ boxSizing: 'border-box', height: 21, paddingTop: 3, borderBottom: `1px solid ${RULE}`, fontSize: 12, lineHeight: 1.2 }}
      >
        {value ?? ''}
      </div>
    </div>
  );
}

// Espace vertical compressible : taille nominale h, minimum 10 px.
const Spacer = ({ h }: { h: number }) => (
  <div aria-hidden style={{ flex: `0 1 ${h}px`, minHeight: 10 }} />
);

export default function StandardAbsenceRequestForm({ data, id }: { data: StandardAbsenceRequestFormData; id?: string }) {
  const companyName = data.company.tradeName || data.company.legalName || 'Entreprise';
  const validated = data.status === 'APPROVED';
  const rejected = data.status === 'REJECTED';

  return (
    <div
      id={id}
      className="std-abs-doc"
      style={{
        width: '210mm',
        height: '296mm', // 296 et non 297 : évite une 2e page blanche à l'export
        margin: '0 auto',
        padding: '6mm 18.5mm 2mm',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: '#fff',
        color: '#111827',
        fontFamily: FONT,
        lineHeight: 1.2,
        breakInside: 'avoid',
        pageBreakInside: 'avoid',
      }}
    >
      <style>{`
        .std-abs-doc, .std-abs-doc * { color-scheme: light !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .std-abs-doc { background: #fff !important; color: #111827 !important; }
        .std-abs-doc > *:not([aria-hidden]) { flex-shrink: 0; }
        .std-abs-doc td, .std-abs-doc th { background: transparent !important; }
        .std-abs-doc .std-abs-black { color: #111827 !important; }
        .std-abs-doc .std-abs-gray { color: #4b5563 !important; }
        .std-abs-doc .std-abs-light { color: #6b7280 !important; }
        .std-abs-doc .std-abs-navy { color: #2c3e50 !important; }
      `}</style>

      {/* ── En-tête (hauteur fixe → filet doré à ~47 mm du haut) ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', height: '40.8mm' }}>
        <div>
          <div style={{ height: 60, display: 'flex', alignItems: 'center' }}>
            {data.company.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.company.logo} alt={companyName} style={{ height: 60, objectFit: 'contain' }} />
            ) : (
              <div className="std-abs-black" style={{ fontWeight: 700, fontSize: 20 }}>{companyName}</div>
            )}
          </div>
          <div className="std-abs-black" style={{ marginTop: 5, fontSize: 9, lineHeight: 1.4, fontWeight: 700 }}>
            {data.company.address && <div>{data.company.address}</div>}
            {(data.company.city || data.company.country) && (
              <div>
                {data.company.city}
                {data.company.city && data.company.country ? ', ' : ''}
                {data.company.country ? COUNTRY_LABELS[data.company.country] || data.company.country : ''}
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

        {/* Aligné sur le bloc adresse (logo 60 + marge 5 + ajustement optique) */}
        <div style={{ paddingTop: 68, textAlign: 'right' }}>
          <div className="std-abs-black" style={{ fontWeight: 700, fontSize: 11 }}>Réf. : {data.reference || '—'}</div>
          <div className="std-abs-light" style={{ marginTop: 4, fontStyle: 'italic', fontSize: 10 }}>
            Direction des Ressources Humaines
          </div>
        </div>
      </div>

      {/* ── Filet doré, filet gris, titre, filet gris, sous-titre ── */}
      <div style={{ borderTop: `2px solid ${GOLD}` }} />
      <div style={{ marginTop: 20, borderTop: `1px solid ${RULE}` }} />

      <h1
        className="std-abs-black"
        style={{ margin: '17px 0 0', textAlign: 'center', fontSize: 19, fontWeight: 700, letterSpacing: 0.5, lineHeight: 1.2 }}
      >
        {"DEMANDE D'AUTORISATION D'ABSENCE"}
      </h1>

      <div style={{ marginTop: 16, borderTop: `1px solid ${RULE}` }} />

      <p className="std-abs-light" style={{ margin: '5px 0 0', textAlign: 'center', fontStyle: 'italic', fontSize: 10, lineHeight: 1.2 }}>
        Absence pour événement familial ou motif conventionnel
      </p>

      {/* ── Renseignements ── */}
      <SectionTitle mt={16}>RENSEIGNEMENTS DU COLLABORATEUR</SectionTitle>
      <Field label="Nom(s) et prénom(s)" value={`${data.employee.lastName} ${data.employee.firstName}`.trim()} mt={11} />
      {data.employee.employeeNumber && <Field label="Matricule" value={data.employee.employeeNumber} />}
      <Field label="Poste occupé" value={data.employee.position} />

      {/* ── Motifs ── */}
      <SectionTitle mt={14}>{"MOTIF DE L'ABSENCE (COCHER LA CASE CORRESPONDANTE)"}</SectionTitle>
      <table
        style={{ width: '100%', marginTop: 7, borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: 10, lineHeight: 1.35 }}
      >
        <colgroup>
          <col />
          <col style={{ width: '14%' }} />
          <col style={{ width: 42 }} />
        </colgroup>
        <thead>
          <tr>
            <th className="std-abs-black" style={{ ...cell, textAlign: 'left' }}>Motif</th>
            <th className="std-abs-black" style={{ ...cell, textAlign: 'left', whiteSpace: 'nowrap' }}>
              Durée<br />conventionnelle
            </th>
            <th className="std-abs-black" style={{ ...cell, textAlign: 'center' }}>Choix</th>
          </tr>
        </thead>
        <tbody>
          {data.catalog.map((m) => (
            <tr key={m.key}>
              <td className="std-abs-gray" style={cell}>{m.label}</td>
              <td className="std-abs-light" style={{ ...cell, whiteSpace: 'nowrap' }}>
                {m.days > 0 ? (
                  <>
                    {m.days} jour{m.days > 1 ? 's' : ''}
                    <br />
                    conventionnel{m.days > 1 ? 's' : ''}
                  </>
                ) : (
                  '0 jours'
                )}
              </td>
              <td style={{ ...cell, padding: '8px 4px 4px', textAlign: 'center' }}>
                <Checkbox checked={data.motifKey === m.key} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── Période : une seule ligne, un seul soulignement ── */}
      <div
        className="std-abs-black"
        style={{
          marginTop: 20,
          width: '80.5%',
          display: 'flex',
          alignItems: 'flex-end',
          gap: 8,
          paddingBottom: 4,
          borderBottom: `1px solid ${RULE}`,
          fontSize: 11.5,
          lineHeight: 1.2,
        }}
      >
        <strong>{"Période d'absence du"}</strong>
        <span style={{ flex: 1, textAlign: 'center' }}>{fmtDate(data.startDate)}</span>
        <strong>au</strong>
        <span style={{ flex: 1, textAlign: 'center' }}>{fmtDate(data.endDate)}</span>
      </div>

      <Spacer h={43} />
      <div className="std-abs-gray" style={{ fontSize: 11.5 }}>
        Fait à {data.company.city || 'Pointe-Noire'}, le{' '}
        <strong className="std-abs-black">{fmtDate(data.requestedAt) || '………………………………………'}</strong>
      </div>

      {/* ── Décision ── */}
      <Spacer h={37} />
      <SectionTitle mt={0}>DÉCISION DE LA HIÉRARCHIE</SectionTitle>
      <div className="std-abs-gray" style={{ marginTop: 11, fontSize: 11.5 }}>
        Accordé <Checkbox checked={validated} />
        <span style={{ marginLeft: 28 }}>
          Refusé <Checkbox checked={rejected} />
        </span>
      </div>
      <div className="std-abs-black" style={{ marginTop: 16, fontSize: 11.5, fontWeight: 700 }}>Commentaire</div>

      <div style={{ marginTop: 20, borderTop: `1px solid ${RULE}` }} />

      {/* Table en layout auto : les colonnes se répartissent comme sur le PDF */}
      <Spacer h={37} />
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 10,
          fontWeight: 700,
          textAlign: 'center',
          whiteSpace: 'nowrap',
        }}
      >
        <tbody>
          <tr>
            <td className="std-abs-black">Le Supérieur hiérarchique</td>
            <td className="std-abs-black">La Direction des Ressources Humaines</td>
            <td className="std-abs-black">La Direction Générale</td>
          </tr>
          <tr>
            <td style={{ height: 45 }} />
            <td style={{ verticalAlign: 'middle' }}>
              {validated && data.company.cachetUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.company.cachetUrl} alt="Cachet" style={{ height: 32, objectFit: 'contain', margin: '0 auto' }} />
              ) : null}
            </td>
            <td />
          </tr>
        </tbody>
      </table>

      {/* ── Pied de page ancré en bas de la feuille ── */}
      <div style={{ marginTop: 'auto' }}>
        <div style={{ borderTop: `1px solid ${RULE}` }} />
        {data.company.documentFooterText ? (
          <div
            className="std-abs-gray"
            style={{ marginTop: 6, textAlign: 'center', fontSize: 8.5, lineHeight: 1.4, whiteSpace: 'pre-line' }}
          >
            {data.company.documentFooterText}
          </div>
        ) : null}
      </div>
    </div>
  );
}