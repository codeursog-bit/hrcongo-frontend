'use client';

// ============================================================================
// 📁 components/DailyAttendanceReportPrintable.tsx
// ✅ Rapport journalier détaillé, imprimable/PDF, avec en-tête entreprise
//    (logo, RCCM, NIU, adresse, téléphone) — destiné aux dirigeants.
// ============================================================================

import React from 'react';

interface CompanyInfo {
  legalName?: string; tradeName?: string; logo?: string | null;
  rccmNumber?: string; taxNumber?: string; address?: string; phone?: string;
}

interface DailyRow {
  employee: { firstName: string; lastName: string; employeeNumber?: string; department?: { name?: string } | null; position?: string };
  status: string; checkIn?: string; checkOut?: string; totalHours?: number;
}

const STATUS_LABEL: Record<string, string> = {
  PRESENT: 'Présent', LATE: 'Retard', ABSENT_UNPAID: 'Absent (non-payé)',
  ABSENT_PAID: 'Absent (justifié)', REMOTE: 'Télétravail', ON_LEAVE: 'Congé',
  LEAVE: 'Congé', HOLIDAY: 'Férié', OFF_DAY: 'Repos',
};

export default function DailyAttendanceReportPrintable({
  id, company, dateLabel, rows, stats,
}: {
  id: string;
  company: CompanyInfo;
  dateLabel: string;
  rows: DailyRow[];
  stats: { total: number; present: number; late: number; absent: number; remote: number; onLeave: number };
}) {
  const companyName = company.tradeName || company.legalName || 'Entreprise';
  const fmtTime = (d?: string) => d ? new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—';

  return (
    <div id={id} style={{ width: '297mm', minHeight: '210mm', background: '#fff', color: '#1f2937', fontFamily: 'Arial, Helvetica, sans-serif', padding: '10mm 12mm', boxSizing: 'border-box' }}>
      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #1f2937', paddingBottom: 10, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {company.logo && <img src={company.logo} alt={companyName} style={{ height: 42, objectFit: 'contain' }} />}
          <div>
            <p style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>{companyName}</p>
            {(company.rccmNumber || company.taxNumber) && (
              <p style={{ fontSize: 9, color: '#6b7280', margin: 0 }}>
                {company.rccmNumber && <>RCCM : {company.rccmNumber} </>}
                {company.taxNumber && <>— NIU : {company.taxNumber}</>}
              </p>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>RAPPORT JOURNALIER DE PRÉSENCE</p>
          <p style={{ fontSize: 11, color: '#6b7280', margin: 0, textTransform: 'capitalize' }}>{dateLabel}</p>
        </div>
      </div>

      {/* Stats résumé */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Effectif', value: stats.total },
          { label: 'Présents', value: stats.present },
          { label: 'Retards', value: stats.late },
          { label: 'Absents', value: stats.absent },
          { label: 'Télétravail', value: stats.remote },
          { label: 'Congés', value: stats.onLeave },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, textAlign: 'center', border: '1px solid #e5e7eb', borderRadius: 6, padding: '8px 4px' }}>
            <p style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>{s.value}</p>
            <p style={{ fontSize: 9, color: '#6b7280', margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tableau détaillé */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10.5 }}>
        <thead>
          <tr style={{ background: '#f3f4f6', textAlign: 'left' }}>
            {['Matricule', 'Employé', 'Département', 'Fonction', 'Statut', 'Entrée', 'Sortie', 'Durée'].map(h => (
              <th key={h} style={{ padding: '6px 8px', borderBottom: '1.5px solid #1f2937', fontSize: 9.5, textTransform: 'uppercase', color: '#374151' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>{r.employee.employeeNumber || '—'}</td>
              <td style={{ padding: '6px 8px', fontWeight: 600 }}>{r.employee.firstName} {r.employee.lastName}</td>
              <td style={{ padding: '6px 8px' }}>{r.employee.department?.name || '—'}</td>
              <td style={{ padding: '6px 8px' }}>{r.employee.position || '—'}</td>
              <td style={{ padding: '6px 8px' }}>{STATUS_LABEL[r.status] ?? r.status}</td>
              <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>{fmtTime(r.checkIn)}</td>
              <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>{fmtTime(r.checkOut)}</td>
              <td style={{ padding: '6px 8px', fontWeight: 700 }}>{r.totalHours ? `${r.totalHours.toFixed(1)}h` : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 24, textAlign: 'center', fontSize: 9, color: '#9ca3af', borderTop: '1px solid #e5e7eb', paddingTop: 8 }}>
        {company.address && <span>{company.address}{company.phone ? ` — Tél : ${company.phone}` : ''} · </span>}
        Document généré via Konza RH le {new Date().toLocaleDateString('fr-FR')}
      </div>
    </div>
  );
}
