'use client';

import React from 'react';

interface Employee {
  id: string;
  firstName?: string;
  lastName?: string;
  professionalCategory?: string;
  employeeNumber?: string;
  position?: string;
  department?: { name?: string };
  cnssNumber?: string;
  nationalIdNumber?: string;
  paymentMethod?: string;
  maritalStatus?: string;
  numberOfChildren?: number;
  echelon?: string;
  contractType?: string;
  hireDate?: string;
}

interface Payslip {
  month: number;
  year: number;
  workDays: number;
  workedDays: number;
  absenceDays: number;
  daysOnLeave?: number;
  daysRemote?: number;
  daysHoliday?: number;
  overtimeHours10?: number;
  overtimeHours25?: number;
  overtimeHours50?: number;
  overtimeHours100?: number;
  professionalCategory?: string;
  collectiveAgreement?: string;
}

interface Props {
  employee: Employee;
  payslip: Payslip;
}

const MARITAL: Record<string, string> = {
  SINGLE: 'Célibataire', MARRIED: 'Marié(e)', DIVORCED: 'Divorcé(e)',
  WIDOWED: 'Veuf/Veuve', COHABITING: 'Concubinage',
};
const CONTRACT: Record<string, string> = {
  CDI: 'CDI', CDD: 'CDD', STAGE: 'Stage', CONSULTANT: 'Consultant',
  FREELANCE: 'Freelance', APPRENTISSAGE: 'Apprentissage',
};
const PAYMENT: Record<string, string> = {
  BANK_TRANSFER: 'Virement bancaire', CASH: 'Espèces',
  MOBILE_MONEY: 'Mobile Money', CHECK: 'Chèque',
};
const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

// Calcul ancienneté lisible
function seniority(hireDate?: string): string {
  if (!hireDate) return '—';
  const hire = new Date(hireDate);
  const now  = new Date();
  let years  = now.getFullYear() - hire.getFullYear();
  let months = now.getMonth() - hire.getMonth();
  if (months < 0) { years--; months += 12; }
  if (years === 0 && months === 0) return '< 1 mois';
  const parts = [];
  if (years > 0)  parts.push(`${years} an${years > 1 ? 's' : ''}`);
  if (months > 0) parts.push(`${months} mois`);
  return parts.join(' ');
}

// Initiales
function initials(emp: Employee): string {
  const f = emp.firstName?.[0] ?? '';
  const l = emp.lastName?.[0]  ?? '';
  return (f + l).toUpperCase() || '?';
}

// ── Styles partagés ──────────────────────────────────────────────────────────
const S = {
  // Conteneur principal
  outer: {
    padding: '14px 20px',
    background: '#ffffff',
    borderBottom: '1.5px solid #e2e8f0',
  } as React.CSSProperties,

  // Bande période
  periodBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#f1f5f9',
    borderRadius: 10,
    padding: '10px 16px',
    marginBottom: 14,
  } as React.CSSProperties,
  periodLeft: {
    display: 'flex', flexDirection: 'column' as const, gap: 2,
  },
  periodTitle: {
    fontSize: 10, fontWeight: 800, textTransform: 'uppercase' as const,
    letterSpacing: '0.1em', color: '#94a3b8',
  },
  periodValue: {
    fontSize: 16, fontWeight: 900, color: '#0f172a',
  },
  periodRight: {
    textAlign: 'right' as const, fontSize: 11, color: '#475569', lineHeight: 1.6,
  },

  // Grid infos employé / temps
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0 24px',
  } as React.CSSProperties,

  sectionTitle: {
    fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase' as const,
    letterSpacing: '0.12em', color: '#94a3b8',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: 6, marginBottom: 10,
  } as React.CSSProperties,

  // Avatar
  avatarWrap: {
    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
  },
  avatar: {
    width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
    background: 'linear-gradient(135deg, #0ea5e9, #10b981)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 900, fontSize: 14,
  },
  empName: {
    fontSize: 13.5, fontWeight: 800, color: '#0f172a',
  },
  empMatricule: {
    fontSize: 10, color: '#64748b', fontFamily: 'monospace',
  },

  // Ligne info
  infoRow: {
    display: 'grid',
    gridTemplateColumns: '140px 1fr',
    gap: '2px 8px',
    marginBottom: 4,
    alignItems: 'baseline',
  } as React.CSSProperties,
  infoLabel: {
    fontSize: 10.5, color: '#64748b', lineHeight: 1.4,
  },
  infoVal: {
    fontSize: 10.5, fontWeight: 700, color: '#0f172a', lineHeight: 1.4,
  },
  infoValMono: {
    fontSize: 10, fontWeight: 700, color: '#0f172a',
    fontFamily: 'monospace', lineHeight: 1.4,
  },
  infoValMissing: {
    fontSize: 10, color: '#94a3b8', fontStyle: 'italic' as const,
  },

  // Temps de travail
  workRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 5, minHeight: 20,
  } as React.CSSProperties,
  workLabel: {
    fontSize: 10.5, color: '#64748b',
  },
  workValNormal: {
    fontSize: 10.5, fontWeight: 700, color: '#0f172a', fontFamily: 'monospace',
  },
  workValPresent: {
    fontSize: 10.5, fontWeight: 700, color: '#059669', fontFamily: 'monospace',
  },
  workValAbsence: {
    fontSize: 10.5, fontWeight: 700, color: '#dc2626', fontFamily: 'monospace',
  },
  workValOT: {
    fontSize: 10.5, fontWeight: 700, color: '#d97706', fontFamily: 'monospace',
  },
  workValLeave: {
    fontSize: 10.5, fontWeight: 700, color: '#0ea5e9', fontFamily: 'monospace',
  },
};

// Composant info row
const InfoRow = ({
  label, value, mono = false, missing = false,
}: { label: string; value?: string | number | null; mono?: boolean; missing?: boolean }) => {
  const val = value ?? null;
  return (
    <div style={S.infoRow}>
      <span style={S.infoLabel}>{label}</span>
      {val !== null && val !== undefined && val !== '' ? (
        <span style={missing ? S.infoValMissing : mono ? S.infoValMono : S.infoVal}>
          {val}
        </span>
      ) : (
        <span style={S.infoValMissing}>—</span>
      )}
    </div>
  );
};

// Composant temps de travail row
const WorkRow = ({
  label, value, style,
}: { label: string; value?: string | number | null; style?: React.CSSProperties }) => (
  <div style={S.workRow}>
    <span style={S.workLabel}>{label}</span>
    <span style={style ?? S.workValNormal}>{value ?? '—'}</span>
  </div>
);

export default function PayslipEmployeeInfo({ employee, payslip }: Props) {
  const {
    workDays = 0, workedDays = 0, absenceDays = 0,
    daysOnLeave, daysRemote, daysHoliday,
    overtimeHours10, overtimeHours25, overtimeHours50, overtimeHours100,
    collectiveAgreement,
  } = payslip;

  const totalOT = (overtimeHours10 ?? 0) + (overtimeHours25 ?? 0) + (overtimeHours50 ?? 0) + (overtimeHours100 ?? 0);

  const otDetail = [
    overtimeHours10  ? `${overtimeHours10}h (+10%)`  : null,
    overtimeHours25  ? `${overtimeHours25}h (+25%)`  : null,
    overtimeHours50  ? `${overtimeHours50}h (+50%)`  : null,
    overtimeHours100 ? `${overtimeHours100}h (+100%)` : null,
  ].filter(Boolean).join(' · ');

  const marital  = MARITAL[employee.maritalStatus ?? ''] ?? employee.maritalStatus ?? '—';
  const contract = CONTRACT[employee.contractType  ?? ''] ?? employee.contractType  ?? '—';
  const payment  = PAYMENT[employee.paymentMethod  ?? ''] ?? employee.paymentMethod  ?? '—';
  const children = employee.numberOfChildren ?? 0;
  const famLabel = `${marital}${children > 0 ? ` · ${children} enfant${children > 1 ? 's' : ''}` : ''}`;

  return (
    <div style={S.outer}>

      {/* ── BANDE PÉRIODE ── */}
      <div style={S.periodBar}>
        <div style={S.periodLeft}>
          <span style={S.periodTitle}>Période de paie</span>
          <span style={S.periodValue}>{MONTHS[(payslip.month ?? 1) - 1]} {payslip.year}</span>
        </div>
        <div style={S.periodRight}>
          {collectiveAgreement && (
            <>
              <div>Convention : <strong style={{ color: '#0f172a' }}>{collectiveAgreement}</strong></div>
            </>
          )}
          {employee.professionalCategory && (
            <div>
              Catégorie <strong style={{ color: '#0f172a' }}>{employee.professionalCategory}</strong>
              {employee.echelon ? ` · Échelon ${employee.echelon}` : ''}
            </div>
          )}
        </div>
      </div>

      {/* ── GRILLE INFOS ── */}
      <div style={S.grid}>

        {/* ─ GAUCHE : Informations Employé ─ */}
        <div>
          <div style={S.sectionTitle}>Informations Employé</div>

          {/* Avatar + nom */}
          <div style={S.avatarWrap}>
            <div style={S.avatar}>{initials(employee)}</div>
            <div>
              <p style={S.empName}>
                {employee.firstName} {employee.lastName}
              </p>
              <p style={S.empMatricule}>
                {employee.employeeNumber ? `Matricule : ${employee.employeeNumber}` : 'Matricule : —'}
              </p>
            </div>
          </div>

          {/* Infos */}
          <InfoRow label="Poste"              value={employee.position} />
          <InfoRow label="Département"        value={employee.department?.name} />
          <InfoRow label="Contrat"            value={contract} />
          <InfoRow label="Ancienneté"         value={seniority(employee.hireDate)} />
          <InfoRow label="Situation familiale" value={famLabel} />
          <InfoRow label="N° CNSS"            value={employee.cnssNumber} mono />
          <InfoRow label="N° CNI"             value={employee.nationalIdNumber} mono />
          <InfoRow label="Mode de paiement"   value={payment} />
        </div>

        {/* ─ DROITE : Temps de Travail ─ */}
        <div>
          <div style={S.sectionTitle}>Temps de Travail</div>

          <WorkRow
            label="Jours ouvrables du mois"
            value={`${workDays} jours`}
            style={S.workValNormal}
          />
          <WorkRow
            label="Jours travaillés"
            value={`${workedDays} jours`}
            style={S.workValPresent}
          />
          {absenceDays > 0 && (
            <WorkRow
              label="Absences non payées"
              value={`${absenceDays} jour${absenceDays > 1 ? 's' : ''}`}
              style={S.workValAbsence}
            />
          )}
          {(daysOnLeave ?? 0) > 0 && (
            <WorkRow
              label="Congés payés"
              value={`${daysOnLeave} jour${(daysOnLeave ?? 0) > 1 ? 's' : ''}`}
              style={S.workValLeave}
            />
          )}
          {(daysRemote ?? 0) > 0 && (
            <WorkRow
              label="Télétravail"
              value={`${daysRemote} jour${(daysRemote ?? 0) > 1 ? 's' : ''}`}
              style={S.workValNormal}
            />
          )}
          {(daysHoliday ?? 0) > 0 && (
            <WorkRow
              label="Jours fériés"
              value={`${daysHoliday} jour${(daysHoliday ?? 0) > 1 ? 's' : ''}`}
              style={S.workValNormal}
            />
          )}

          {/* Séparateur si heures sup */}
          {totalOT > 0 && (
            <>
              <div style={{ borderTop: '1px dashed #e2e8f0', margin: '8px 0' }} />
              <WorkRow
                label="Heures supplémentaires"
                value={`${totalOT}h total`}
                style={S.workValOT}
              />
              {otDetail && (
                <div style={{ ...S.workRow, marginTop: -3 }}>
                  <span style={{ fontSize: 9.5, color: '#94a3b8', paddingLeft: 2 }}>Détail</span>
                  <span style={{ fontSize: 9.5, color: '#d97706', fontFamily: 'monospace' }}>{otDetail}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}