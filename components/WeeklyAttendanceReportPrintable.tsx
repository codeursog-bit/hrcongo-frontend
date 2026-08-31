'use client';

// ============================================================================
// 📁 components/WeeklyAttendanceReportPrintable.tsx
// ✅ Rapport hebdomadaire détaillé, imprimable/PDF, avec en-tête entreprise.
//    Contient : le résumé par département + une grille jour-par-jour par
//    employé, pour que les dirigeants comprennent la semaine en un coup d'œil.
// ============================================================================

import React from 'react';

interface CompanyInfo {
  legalName?: string; tradeName?: string; logo?: string | null;
  rccmNumber?: string; taxNumber?: string; address?: string; phone?: string;
}

interface DeptStat {
  name: string; present: number; late: number; absent: number; remote: number; leave: number; total: number;
}

interface EmployeeWeekRow {
  name: string; department?: string;
  days: Array<{ label: string; status: string }>; // 1 entrée par jour de la semaine
  totalHours: number;
}

const STATUS_ABBR: Record<string, string> = {
  PRESENT: 'P', LATE: 'R', ABSENT_UNPAID: 'A', ABSENT_PAID: 'AJ',
  REMOTE: 'TT', ON_LEAVE: 'C', LEAVE: 'C', HOLIDAY: 'F', OFF_DAY: '—',
};

const STATUS_COLOR: Record<string, string> = {
  PRESENT: '#059669', LATE: '#d97706', ABSENT_UNPAID: '#dc2626', ABSENT_PAID: '#2563eb',
  REMOTE: '#7c3aed', ON_LEAVE: '#0284c7', LEAVE: '#0284c7', HOLIDAY: '#2563eb', OFF_DAY: '#9ca3af',
};

export default function WeeklyAttendanceReportPrintable({
  id, company, weekLabel, deptStats, employeeRows,
}: {
  id: string;
  company: CompanyInfo;
  weekLabel: string;
  deptStats: DeptStat[];
  employeeRows: EmployeeWeekRow[];
}) {
  const companyName = company.tradeName || company.legalName || 'Entreprise';

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
          <p style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>RAPPORT HEBDOMADAIRE DE PRÉSENCE</p>
          <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>{weekLabel}</p>
        </div>
      </div>

      {/* Résumé par département */}
      <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Résumé par département</p>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10, marginBottom: 18 }}>
        <thead>
          <tr style={{ background: '#f3f4f6' }}>
            {['Département', 'Pointages', 'Présents', 'Retards', 'Absents', 'Télétravail', 'Congés', 'Taux présence'].map(h => (
              <th key={h} style={{ padding: '5px 8px', borderBottom: '1.5px solid #1f2937', fontSize: 9, textTransform: 'uppercase', textAlign: 'left', color: '#374151' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {deptStats.map(d => (
            <tr key={d.name} style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '5px 8px', fontWeight: 700 }}>{d.name}</td>
              <td style={{ padding: '5px 8px' }}>{d.total}</td>
              <td style={{ padding: '5px 8px', color: '#059669' }}>{d.present}</td>
              <td style={{ padding: '5px 8px', color: '#d97706' }}>{d.late}</td>
              <td style={{ padding: '5px 8px', color: '#dc2626' }}>{d.absent}</td>
              <td style={{ padding: '5px 8px', color: '#7c3aed' }}>{d.remote}</td>
              <td style={{ padding: '5px 8px', color: '#0284c7' }}>{d.leave}</td>
              <td style={{ padding: '5px 8px', fontWeight: 700 }}>{d.total > 0 ? ((d.present / d.total) * 100).toFixed(0) : 0}%</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Grille jour par jour par employé */}
      <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Détail par employé</p>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 9.5 }}>
        <thead>
          <tr style={{ background: '#f3f4f6' }}>
            <th style={{ padding: '5px 8px', borderBottom: '1.5px solid #1f2937', textAlign: 'left', fontSize: 9 }}>Employé</th>
            <th style={{ padding: '5px 8px', borderBottom: '1.5px solid #1f2937', textAlign: 'left', fontSize: 9 }}>Dépt.</th>
            {employeeRows[0]?.days.map(d => (
              <th key={d.label} style={{ padding: '5px 4px', borderBottom: '1.5px solid #1f2937', fontSize: 9, textAlign: 'center' }}>{d.label}</th>
            ))}
            <th style={{ padding: '5px 8px', borderBottom: '1.5px solid #1f2937', textAlign: 'right', fontSize: 9 }}>Heures</th>
          </tr>
        </thead>
        <tbody>
          {employeeRows.map((r, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '5px 8px', fontWeight: 600 }}>{r.name}</td>
              <td style={{ padding: '5px 8px', color: '#6b7280' }}>{r.department || '—'}</td>
              {r.days.map((d, j) => (
                <td key={j} style={{ padding: '5px 4px', textAlign: 'center', fontWeight: 700, color: STATUS_COLOR[d.status] ?? '#9ca3af' }}>
                  {STATUS_ABBR[d.status] ?? '—'}
                </td>
              ))}
              <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 700 }}>{r.totalHours.toFixed(1)}h</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 14, fontSize: 8.5, color: '#6b7280' }}>
        Légende : P = Présent · R = Retard · A = Absent non-payé · AJ = Absent justifié · TT = Télétravail · C = Congé · F = Férié
      </div>

      <div style={{ marginTop: 20, textAlign: 'center', fontSize: 9, color: '#9ca3af', borderTop: '1px solid #e5e7eb', paddingTop: 8 }}>
        {company.address && <span>{company.address}{company.phone ? ` — Tél : ${company.phone}` : ''} · </span>}
        Document généré via Konza RH le {new Date().toLocaleDateString('fr-FR')}
      </div>
    </div>
  );
}
