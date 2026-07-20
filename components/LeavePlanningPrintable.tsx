'use client';

// ============================================================================
// 📁 components/LeavePlanningPrintable.tsx
// ✅ Reproduit le modèle "PROGRAMME DES DÉPARTS EN CONGÉ DU MOIS DE [X]" /
//    "Planning congé à payer" — imprimable en paysage (beaucoup de colonnes),
//    en-tête entreprise dynamique.
// ============================================================================

import React from 'react';

interface CompanyInfo {
  legalName?: string; tradeName?: string; logo?: string | null;
  rccmNumber?: string; taxNumber?: string; address?: string; phone?: string;
}

export interface LeavePlanningRow {
  employee: {
    firstName: string; lastName: string; position?: string;
    hireDate?: string | Date; contractType?: string;
    department?: { name?: string } | null;
  };
  startDate: string | Date;
  endDate: string | Date;
  daysCount: number | string;
  indemnityAmount?: number;
  status: string;
}

const CONTRACT_LABEL: Record<string, string> = {
  CDI: 'CDI', CDD: 'CDD', STAGE: 'Stage', CONSULTANT: 'Consultant', INTERIM: 'Intérim', PRESTATAIRE: 'Prestataire',
};

const fmtDate = (d?: string | Date) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
const fmtHireDate = (d?: string | Date) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' }) : '—';
const fmtMoney = (n?: number) => n != null && n > 0 ? `${Math.round(n).toLocaleString('fr-FR')} FCFA` : '—';

export default function LeavePlanningPrintable({
  id, company, monthLabel, rows, mode, signatoryLabel = 'LA DIRECTION DES RESSOURCES HUMAINES',
}: {
  id: string;
  company: CompanyInfo;
  monthLabel: string; // ex: "Juin 2026"
  rows: LeavePlanningRow[];
  mode: 'departures' | 'payable'; // "Programme des départs" vs "Planning à payer"
  signatoryLabel?: string;
}) {
  const companyName = company.tradeName || company.legalName || 'Entreprise';
  const title = mode === 'departures'
    ? `PROGRAMME DES DÉPARTS EN CONGÉ DU MOIS DE ${monthLabel.toUpperCase()}`
    : `PLANNING CONGÉ À PAYER — ${monthLabel.toUpperCase()}`;

  return (
    <div id={id} style={{ width: '297mm', minHeight: '210mm', background: '#fff', color: '#1f2937', fontFamily: 'Arial, Helvetica, sans-serif', padding: '10mm 12mm', boxSizing: 'border-box' }}>
      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        {company.logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={company.logo} alt={companyName} style={{ height: 44, objectFit: 'contain' }} />
        )}
        <div>
          <p style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>{companyName}</p>
          {(company.rccmNumber || company.taxNumber) && (
            <p style={{ fontSize: 9, color: '#6b7280', margin: 0 }}>
              {company.rccmNumber && <>RCCM : {company.rccmNumber} </>}
              {company.taxNumber && <>— NIU : {company.taxNumber}</>}
            </p>
          )}
        </div>
      </div>

      <div style={{ background: '#e0f2fe', padding: '10px 14px', marginBottom: 16, textAlign: 'center' }}>
        <h1 style={{ fontSize: 15, fontWeight: 800, letterSpacing: 0.5, margin: 0 }}>{title}</h1>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10.5 }}>
        <thead>
          <tr style={{ background: '#f3f4f6' }}>
            {['Items', 'Noms & Prénoms', 'Poste occupé', 'Département', 'Date d\u2019embauche', 'Nature contrat', 'Date de départ congé', 'Date de retour congé', ...(mode === 'payable' ? ['Montant à payer'] : [])].map(h => (
              <th key={h} style={{ padding: '6px 8px', border: '1px solid #1f2937', fontSize: 9.5, textAlign: 'left', textTransform: 'uppercase', color: '#374151' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td style={{ padding: '6px 8px', border: '1px solid #d1d5db', textAlign: 'center' }}>{i + 1}</td>
              <td style={{ padding: '6px 8px', border: '1px solid #d1d5db', fontWeight: 600 }}>{r.employee.firstName} {r.employee.lastName}</td>
              <td style={{ padding: '6px 8px', border: '1px solid #d1d5db' }}>{r.employee.position || '—'}</td>
              <td style={{ padding: '6px 8px', border: '1px solid #d1d5db' }}>{r.employee.department?.name || '—'}</td>
              <td style={{ padding: '6px 8px', border: '1px solid #d1d5db', fontFamily: 'monospace' }}>{fmtHireDate(r.employee.hireDate)}</td>
              <td style={{ padding: '6px 8px', border: '1px solid #d1d5db' }}>{CONTRACT_LABEL[r.employee.contractType || ''] || r.employee.contractType || '—'}</td>
              <td style={{ padding: '6px 8px', border: '1px solid #d1d5db', fontFamily: 'monospace' }}>{fmtDate(r.startDate)}</td>
              <td style={{ padding: '6px 8px', border: '1px solid #d1d5db', fontFamily: 'monospace' }}>{fmtDate(r.endDate)}</td>
              {mode === 'payable' && (
                <td style={{ padding: '6px 8px', border: '1px solid #d1d5db', fontWeight: 700, textAlign: 'right' }}>{fmtMoney(r.indemnityAmount)}</td>
              )}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={mode === 'payable' ? 9 : 8} style={{ padding: '20px', border: '1px solid #d1d5db', textAlign: 'center', color: '#9ca3af' }}>
                Aucun départ en congé ce mois-ci.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <p style={{ fontSize: 10, marginTop: 14 }}>
        <strong>N.B :</strong> Conformément aux instructions de la direction, chaque travailleur a l&apos;obligation de
        prendre son congé annuel et de profiter de ses jours de repos.
      </p>

      <div style={{ marginTop: 40, textAlign: 'right', fontWeight: 800, fontSize: 12 }}>{signatoryLabel}</div>

      <div style={{ marginTop: 30, textAlign: 'center', fontSize: 9, color: '#9ca3af', borderTop: '1px solid #e5e7eb', paddingTop: 8 }}>
        {company.address && <span>{company.address}{company.phone ? ` — Tél : ${company.phone}` : ''} · </span>}
        Document généré via Konza RH le {new Date().toLocaleDateString('fr-FR')}
      </div>
    </div>
  );
}
