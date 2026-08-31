'use client';

// ============================================================================
// 📁 components/PermissionTicketPrintable.tsx
// ✅ "Ticket" de permission de sortie — petit format (80mm, comme un reçu),
//    conçu POUR L'IMPRESSION THERMIQUE NOIR & BLANC en priorité :
//    - Plus de gris clair illisible (#9ca3af, #6b7280 abandonnés) → texte en
//      #000 / #111827 uniquement, poids de police relevé.
//    - Le statut n'est plus signalé par une couleur (invisible en B&W) mais
//      par un badge à FOND NOIR PLEIN + texte blanc, qui ressort net sur
//      n'importe quelle imprimante.
//    - Le logo a désormais un repli garanti (cadre + initiales) : l'en-tête
//      n'est jamais vide même si l'entreprise n'a pas encore uploadé de logo.
// ============================================================================

import React from 'react';

interface CompanyInfo {
  legalName?: string; tradeName?: string; logo?: string | null;
  rccmNumber?: string; taxNumber?: string; address?: string; phone?: string;
}

export interface PermissionTicketData {
  reference: string;
  company: CompanyInfo;
  employee: { firstName: string; lastName: string; employeeNumber?: string; department?: string; position?: string };
  type: 'URGENCE' | 'MISSION' | 'AUTRE' | string;
  missionType?: string | null;
  reason: string;
  destination?: string | null;
  departureTime: string | Date;
  expectedReturnTime: string | Date;
  actualReturnTime?: string | Date | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | string;
  reviewedByName?: string;
  reviewedAt?: string | Date;
  rejectionReason?: string;
  createdByRole?: string;
}

const TYPE_LABEL: Record<string, string> = { URGENCE: 'Urgence', MISSION: 'Mission d\u2019entreprise', AUTRE: 'Autre' };
const MISSION_LABEL: Record<string, string> = {
  PROSPECTION_CLIENT: 'Prospection client', RECOUVREMENT: 'Recouvrement',
  SAV: 'Service après-vente', REPARATION_EXTERNE: 'Réparation externe', AUTRE: 'Autre mission',
};
const STATUS_LABEL: Record<string, string> = { PENDING: 'EN ATTENTE', APPROVED: 'AUTORISÉ', REJECTED: 'REFUSÉ', CANCELLED: 'ANNULÉ' };

const fmtTime = (d?: string | Date) => d ? new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—';
const fmtDate = (d?: string | Date) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

/** Bandeau "code-barres" purement décoratif — renforce le rendu "ticket" */
function FauxBarcode({ seed }: { seed: string }) {
  const bars = Array.from(seed).map(c => (c.charCodeAt(0) % 4) + 1);
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', height: 32, gap: 1.5, justifyContent: 'center' }}>
      {bars.map((w, i) => (
        <div key={i} style={{ width: w, background: '#000', height: '100%' }} />
      ))}
    </div>
  );
}

/** Initiales de secours si aucun logo n'est configuré — l'en-tête n'est jamais vide */
function initialsOf(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?';
}

export default function PermissionTicketPrintable({ id, data }: { id: string; data: PermissionTicketData }) {
  const companyName = data.company.tradeName || data.company.legalName || 'Entreprise';

  return (
    <div
      id={id}
      style={{
        width: '80mm',
        background: '#fff',
        color: '#000',
        fontFamily: "'Courier New', Courier, monospace",
        padding: '5mm 4mm',
        boxSizing: 'border-box',
        border: '1px dashed #000',
      }}
    >
      {/* En-tête entreprise — logo avec repli garanti (jamais vide) */}
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        {data.company.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.company.logo}
            alt={companyName}
            crossOrigin="anonymous"
            style={{ height: 36, maxWidth: '60mm', objectFit: 'contain', margin: '0 auto 4px', display: 'block' }}
          />
        ) : (
          <div style={{
            width: 40, height: 40, margin: '0 auto 4px', borderRadius: 6, border: '2px solid #000',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15,
          }}>
            {initialsOf(companyName)}
          </div>
        )}
        <p style={{ fontSize: 14, fontWeight: 800, margin: 0, letterSpacing: 0.5, color: '#000' }}>{companyName.toUpperCase()}</p>
        {data.company.address && <p style={{ fontSize: 9, fontWeight: 600, color: '#111827', margin: '2px 0 0' }}>{data.company.address}</p>}
        {data.company.phone && <p style={{ fontSize: 9, fontWeight: 600, color: '#111827', margin: 0 }}>Tél : {data.company.phone}</p>}
      </div>

      <div style={{ borderTop: '2px dashed #000', margin: '6px 0' }} />

      <p style={{ textAlign: 'center', fontSize: 13, fontWeight: 800, letterSpacing: 1, margin: '0 0 2px', color: '#000' }}>TICKET DE PERMISSION</p>
      <p style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>N° {data.reference}</p>

      {/* Statut — badge à fond NOIR PLEIN, lisible même sans couleur */}
      <div style={{ textAlign: 'center', margin: '0 0 10px' }}>
        <span style={{
          display: 'inline-block', padding: '5px 16px', background: '#000', color: '#fff',
          fontWeight: 800, fontSize: 12, letterSpacing: 1.5, borderRadius: 4,
        }}>
          {STATUS_LABEL[data.status] ?? data.status}
        </span>
      </div>

      <div style={{ borderTop: '2px dashed #000', margin: '6px 0' }} />

      {/* Employé */}
      <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse', color: '#000' }}>
        <tbody>
          <tr><td style={{ padding: '2.5px 0', fontWeight: 600 }}>Employé</td><td style={{ padding: '2.5px 0', textAlign: 'right', fontWeight: 800 }}>{data.employee.firstName} {data.employee.lastName}</td></tr>
          <tr><td style={{ padding: '2.5px 0', fontWeight: 600 }}>Matricule</td><td style={{ padding: '2.5px 0', textAlign: 'right', fontWeight: 700 }}>{data.employee.employeeNumber || '—'}</td></tr>
          <tr><td style={{ padding: '2.5px 0', fontWeight: 600 }}>Département</td><td style={{ padding: '2.5px 0', textAlign: 'right', fontWeight: 700 }}>{data.employee.department || '—'}</td></tr>
          <tr><td style={{ padding: '2.5px 0', fontWeight: 600 }}>Motif</td><td style={{ padding: '2.5px 0', textAlign: 'right', fontWeight: 800 }}>{TYPE_LABEL[data.type] ?? data.type}</td></tr>
          {data.type === 'MISSION' && data.missionType && (
            <tr><td style={{ padding: '2.5px 0', fontWeight: 600 }}>Type mission</td><td style={{ padding: '2.5px 0', textAlign: 'right', fontWeight: 700 }}>{MISSION_LABEL[data.missionType] ?? data.missionType}</td></tr>
          )}
          {data.destination && (
            <tr><td style={{ padding: '2.5px 0', fontWeight: 600 }}>Destination</td><td style={{ padding: '2.5px 0', textAlign: 'right', fontWeight: 700 }}>{data.destination}</td></tr>
          )}
        </tbody>
      </table>

      <div style={{ borderTop: '2px dashed #000', margin: '8px 0' }} />

      {/* Horaires */}
      <div style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'center' }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 9, fontWeight: 700, color: '#000', margin: 0, textTransform: 'uppercase' }}>Sortie</p>
          <p style={{ fontSize: 18, fontWeight: 800, margin: '2px 0 0', color: '#000' }}>{fmtTime(data.departureTime)}</p>
          <p style={{ fontSize: 9, fontWeight: 600, color: '#111827', margin: 0 }}>{fmtDate(data.departureTime)}</p>
        </div>
        <div style={{ width: 2, background: '#000', margin: '0 8px' }} />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 9, fontWeight: 700, color: '#000', margin: 0, textTransform: 'uppercase' }}>Retour prévu</p>
          <p style={{ fontSize: 18, fontWeight: 800, margin: '2px 0 0', color: '#000' }}>{fmtTime(data.expectedReturnTime)}</p>
          <p style={{ fontSize: 9, fontWeight: 600, color: '#111827', margin: 0 }}>{fmtDate(data.expectedReturnTime)}</p>
        </div>
      </div>

      {data.actualReturnTime && (
        <div style={{ textAlign: 'center', marginTop: 8, padding: '5px 0', border: '2px solid #000', borderRadius: 4 }}>
          <p style={{ fontSize: 9, color: '#000', margin: 0, fontWeight: 800 }}>RETOUR EFFECTUÉ À {fmtTime(data.actualReturnTime)}</p>
        </div>
      )}

      <div style={{ borderTop: '2px dashed #000', margin: '8px 0' }} />

      <p style={{ fontSize: 10.5, fontWeight: 600, margin: '0 0 8px', lineHeight: 1.4, color: '#000' }}>
        <span style={{ fontWeight: 800 }}>Détail : </span>{data.reason}
      </p>

      {data.status === 'REJECTED' && data.rejectionReason && (
        <p style={{ fontSize: 10, fontWeight: 700, color: '#000', margin: '0 0 8px', border: '2px solid #000', padding: '4px 6px', borderRadius: 4 }}>
          Motif du refus : {data.rejectionReason}
        </p>
      )}

      {data.status === 'APPROVED' && (
        <div style={{ textAlign: 'center', margin: '10px 0 4px' }}>
          <p style={{ fontSize: 9, fontWeight: 700, color: '#000', margin: '0 0 2px' }}>Autorisé par</p>
          <p style={{ fontSize: 11, fontWeight: 800, margin: 0, color: '#000' }}>{data.reviewedByName || '—'}</p>
          <p style={{ fontSize: 9, fontWeight: 600, color: '#111827', margin: 0 }}>{data.reviewedAt ? `${fmtDate(data.reviewedAt)} à ${fmtTime(data.reviewedAt)}` : ''}</p>
        </div>
      )}

      <div style={{ borderTop: '2px dashed #000', margin: '8px 0' }} />

      <FauxBarcode seed={data.reference} />
      <p style={{ textAlign: 'center', fontSize: 10, letterSpacing: 2, margin: '4px 0 0', fontWeight: 800, color: '#000' }}>{data.reference}</p>

      <p style={{ textAlign: 'center', fontSize: 8.5, fontWeight: 600, color: '#111827', margin: '8px 0 0', lineHeight: 1.4 }}>
        Ticket à présenter au poste de sécurité / à l&apos;accueil.<br />
        Généré via Konza RH — {new Date().toLocaleDateString('fr-FR')}
      </p>
    </div>
  );
}
