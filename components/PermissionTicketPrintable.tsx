'use client';

// ============================================================================
// 📁 components/PermissionTicketPrintable.tsx
// ✅ "Ticket" de permission de sortie — petit format (80mm, comme un reçu),
//    utilisable à l'écran et imprimable, avec présentation soignée pour
//    représenter l'autorisation de sortie d'un employé déjà pointé présent.
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
const STATUS_LABEL: Record<string, string> = { PENDING: 'En attente', APPROVED: 'AUTORISÉ', REJECTED: 'REFUSÉ', CANCELLED: 'ANNULÉ' };

const fmtTime = (d?: string | Date) => d ? new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—';
const fmtDate = (d?: string | Date) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

/** Bandeau "code-barres" purement décoratif — renforce le rendu "ticket" */
function FauxBarcode({ seed }: { seed: string }) {
  const bars = Array.from(seed).map(c => (c.charCodeAt(0) % 4) + 1);
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', height: 32, gap: 1.5, justifyContent: 'center' }}>
      {bars.map((w, i) => (
        <div key={i} style={{ width: w, background: '#1f2937', height: '100%' }} />
      ))}
    </div>
  );
}

export default function PermissionTicketPrintable({ id, data }: { id: string; data: PermissionTicketData }) {
  const companyName = data.company.tradeName || data.company.legalName || 'Entreprise';
  const statusColor = data.status === 'APPROVED' ? '#059669' : data.status === 'REJECTED' ? '#dc2626' : data.status === 'CANCELLED' ? '#6b7280' : '#d97706';

  return (
    <div
      id={id}
      style={{
        width: '80mm',
        background: '#fff',
        color: '#1f2937',
        fontFamily: "'Courier New', Courier, monospace",
        padding: '5mm 4mm',
        boxSizing: 'border-box',
        border: '1px dashed #9ca3af',
      }}
    >
      {/* En-tête entreprise */}
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        {data.company.logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.company.logo} alt={companyName} style={{ height: 34, objectFit: 'contain', margin: '0 auto 4px' }} />
        )}
        <p style={{ fontSize: 13, fontWeight: 800, margin: 0, letterSpacing: 0.5 }}>{companyName.toUpperCase()}</p>
        {data.company.address && <p style={{ fontSize: 8, color: '#6b7280', margin: '2px 0 0' }}>{data.company.address}</p>}
        {data.company.phone && <p style={{ fontSize: 8, color: '#6b7280', margin: 0 }}>Tél : {data.company.phone}</p>}
      </div>

      <div style={{ borderTop: '1px dashed #9ca3af', margin: '6px 0' }} />

      <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 800, letterSpacing: 1, margin: '0 0 2px' }}>TICKET DE PERMISSION</p>
      <p style={{ textAlign: 'center', fontSize: 9, color: '#6b7280', margin: '0 0 8px' }}>N° {data.reference}</p>

      {/* Statut */}
      <div style={{ textAlign: 'center', margin: '0 0 10px' }}>
        <span style={{ display: 'inline-block', padding: '4px 14px', border: `1.5px solid ${statusColor}`, color: statusColor, fontWeight: 800, fontSize: 11, letterSpacing: 1, borderRadius: 4 }}>
          {STATUS_LABEL[data.status] ?? data.status}
        </span>
      </div>

      <div style={{ borderTop: '1px dashed #9ca3af', margin: '6px 0' }} />

      {/* Employé */}
      <table style={{ width: '100%', fontSize: 10, borderCollapse: 'collapse' }}>
        <tbody>
          <tr><td style={{ padding: '2px 0', color: '#6b7280' }}>Employé</td><td style={{ padding: '2px 0', textAlign: 'right', fontWeight: 700 }}>{data.employee.firstName} {data.employee.lastName}</td></tr>
          <tr><td style={{ padding: '2px 0', color: '#6b7280' }}>Matricule</td><td style={{ padding: '2px 0', textAlign: 'right' }}>{data.employee.employeeNumber || '—'}</td></tr>
          <tr><td style={{ padding: '2px 0', color: '#6b7280' }}>Département</td><td style={{ padding: '2px 0', textAlign: 'right' }}>{data.employee.department || '—'}</td></tr>
          <tr><td style={{ padding: '2px 0', color: '#6b7280' }}>Motif</td><td style={{ padding: '2px 0', textAlign: 'right', fontWeight: 700 }}>{TYPE_LABEL[data.type] ?? data.type}</td></tr>
          {data.type === 'MISSION' && data.missionType && (
            <tr><td style={{ padding: '2px 0', color: '#6b7280' }}>Type mission</td><td style={{ padding: '2px 0', textAlign: 'right' }}>{MISSION_LABEL[data.missionType] ?? data.missionType}</td></tr>
          )}
          {data.destination && (
            <tr><td style={{ padding: '2px 0', color: '#6b7280' }}>Destination</td><td style={{ padding: '2px 0', textAlign: 'right' }}>{data.destination}</td></tr>
          )}
        </tbody>
      </table>

      <div style={{ borderTop: '1px dashed #9ca3af', margin: '8px 0' }} />

      {/* Horaires */}
      <div style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'center' }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 8, color: '#6b7280', margin: 0, textTransform: 'uppercase' }}>Sortie</p>
          <p style={{ fontSize: 16, fontWeight: 800, margin: '2px 0 0' }}>{fmtTime(data.departureTime)}</p>
          <p style={{ fontSize: 8, color: '#9ca3af', margin: 0 }}>{fmtDate(data.departureTime)}</p>
        </div>
        <div style={{ width: 1, background: '#e5e7eb', margin: '0 8px' }} />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 8, color: '#6b7280', margin: 0, textTransform: 'uppercase' }}>Retour prévu</p>
          <p style={{ fontSize: 16, fontWeight: 800, margin: '2px 0 0' }}>{fmtTime(data.expectedReturnTime)}</p>
          <p style={{ fontSize: 8, color: '#9ca3af', margin: 0 }}>{fmtDate(data.expectedReturnTime)}</p>
        </div>
      </div>

      {data.actualReturnTime && (
        <div style={{ textAlign: 'center', marginTop: 8, padding: '4px 0', background: '#f0fdf4', borderRadius: 4 }}>
          <p style={{ fontSize: 8, color: '#059669', margin: 0, fontWeight: 700 }}>RETOUR EFFECTUÉ À {fmtTime(data.actualReturnTime)}</p>
        </div>
      )}

      <div style={{ borderTop: '1px dashed #9ca3af', margin: '8px 0' }} />

      <p style={{ fontSize: 9.5, margin: '0 0 8px', lineHeight: 1.4 }}>
        <span style={{ color: '#6b7280' }}>Détail : </span>{data.reason}
      </p>

      {data.status === 'REJECTED' && data.rejectionReason && (
        <p style={{ fontSize: 9, color: '#dc2626', margin: '0 0 8px' }}>Motif du refus : {data.rejectionReason}</p>
      )}

      {data.status === 'APPROVED' && (
        <div style={{ textAlign: 'center', margin: '10px 0 4px' }}>
          <p style={{ fontSize: 8, color: '#6b7280', margin: '0 0 2px' }}>Autorisé par</p>
          <p style={{ fontSize: 10, fontWeight: 700, margin: 0 }}>{data.reviewedByName || '—'}</p>
          <p style={{ fontSize: 8, color: '#9ca3af', margin: 0 }}>{data.reviewedAt ? `${fmtDate(data.reviewedAt)} à ${fmtTime(data.reviewedAt)}` : ''}</p>
        </div>
      )}

      <div style={{ borderTop: '1px dashed #9ca3af', margin: '8px 0' }} />

      <FauxBarcode seed={data.reference} />
      <p style={{ textAlign: 'center', fontSize: 9, letterSpacing: 2, margin: '4px 0 0', fontWeight: 700 }}>{data.reference}</p>

      <p style={{ textAlign: 'center', fontSize: 7.5, color: '#9ca3af', margin: '8px 0 0', lineHeight: 1.4 }}>
        Ticket à présenter au poste de sécurité / à l&apos;accueil.<br />
        Généré via Konza RH — {new Date().toLocaleDateString('fr-FR')}
      </p>
    </div>
  );
}
