
// 'use client';

// import React from 'react';

// interface Employee {
//   firstName?: string;
//   lastName?: string;
//   employeeNumber?: string;
//   position?: string;
//   department?: { name?: string };
//   cnssNumber?: string;
//   nationalIdNumber?: string;
//   paymentMethod?: string;
//   maritalStatus?: string;
//   numberOfChildren?: number;
//   professionalCategory?: string;
//   echelon?: string;
//   contractType?: string;
//   hireDate?: string;
// }

// // ✅ Interface mise à jour — 4 catégories HS
// interface PayslipData {
//   month: number;
//   year: number;
//   workDays: number;
//   workedDays: number;
//   absenceDays: number;
//   daysOnLeave?: number;
//   daysRemote?: number;
//   daysHoliday?: number;
//   overtimeHours10?: number | string;
//   overtimeHours25?: number | string;
//   overtimeHours50?: number | string;
//   overtimeHours100?: number | string;
//   professionalCategory?: string;
//   collectiveAgreement?: string;
// }

// interface PayslipEmployeeInfoProps {
//   employee: Employee;
//   payslip: PayslipData;
// }

// export default function PayslipEmployeeInfo({ employee, payslip }: PayslipEmployeeInfoProps) {
//   const MONTH_NAMES = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
//   const getMonthName = (m: number) => MONTH_NAMES[m - 1] || '—';

//   // ✅ 4 catégories HS
//   const overtime10  = Number(payslip.overtimeHours10)  || 0;
//   const overtime25  = Number(payslip.overtimeHours25)  || 0;
//   const overtime50  = Number(payslip.overtimeHours50)  || 0;
//   const overtime100 = Number(payslip.overtimeHours100) || 0;
//   const totalOvertimeHours = overtime10 + overtime25 + overtime50 + overtime100;

//   const MARITAL_LABELS: Record<string, string> = {
//     SINGLE: 'Célibataire', MARRIED: 'Marié(e)', DIVORCED: 'Divorcé(e)', WIDOWED: 'Veuf/Veuve'
//   };
//   const PAYMENT_LABELS: Record<string, string> = {
//     CASH: 'Espèces', BANK_TRANSFER: 'Virement bancaire', MOBILE_MONEY: 'Mobile Money'
//   };

//   const getAnciennete = () => {
//     if (!employee?.hireDate) return null;
//     const hire = new Date(employee.hireDate);
//     const now = new Date();
//     const months = Math.floor((now.getTime() - hire.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
//     const years = Math.floor(months / 12);
//     const rem = months % 12;
//     if (years === 0) return `${rem} mois`;
//     return `${years} an${years > 1 ? 's' : ''} ${rem > 0 ? `${rem} mois` : ''}`;
//   };

//   const anciennete = getAnciennete();

//   // Construit le détail HS sous forme lisible
//   const buildOvertimeDetail = () => {
//     const parts: string[] = [];
//     if (overtime10  > 0) parts.push(`${overtime10}h +10%`);
//     if (overtime25  > 0) parts.push(`${overtime25}h +25%`);
//     if (overtime50  > 0) parts.push(`${overtime50}h +50%`);
//     if (overtime100 > 0) parts.push(`${overtime100}h +100%`);
//     return parts.join(', ');
//   };

//   return (
//     <div className="px-8 py-5 print:px-6 border-b-2 border-gray-200 dark:border-gray-700 print:border-gray-400">
      
//       {/* Bandeau période */}
//       <div className="bg-gray-100 dark:bg-gray-700/50 print:bg-gray-100 rounded-xl px-5 py-3 mb-5 flex items-center justify-between">
//         <div>
//           <span className="text-xs font-bold text-gray-500 dark:text-gray-400 print:text-gray-600 uppercase tracking-wider">Période de paie</span>
//           <p className="font-bold text-gray-900 dark:text-white print:text-black text-lg">{getMonthName(payslip.month)} {payslip.year}</p>
//         </div>
//         {(payslip.collectiveAgreement || employee?.professionalCategory || payslip.professionalCategory) && (
//           <div className="text-right">
//             {payslip.collectiveAgreement && (
//               <p className="text-xs text-gray-500 dark:text-gray-400 print:text-gray-600">Convention : <strong className="text-gray-800 dark:text-white print:text-black">{payslip.collectiveAgreement}</strong></p>
//             )}
//             {(employee?.professionalCategory || payslip.professionalCategory) && (
//               <p className="text-xs text-gray-500 dark:text-gray-400 print:text-gray-600">
//                 Catégorie : <strong className="font-mono text-gray-800 dark:text-white print:text-black">{employee?.professionalCategory || payslip.professionalCategory}</strong>
//                 {employee?.echelon && <span> · Échelon <strong>{employee.echelon}</strong></span>}
//               </p>
//             )}
//           </div>
//         )}
//       </div>

//       <div className="grid grid-cols-2 gap-x-10 gap-y-4 text-sm">
//         {/* COLONNE GAUCHE : EMPLOYÉ */}
//         <div className="space-y-3">
//           <h3 className="text-xs font-bold uppercase text-gray-400 dark:text-gray-500 print:text-gray-600 tracking-wider border-b border-gray-100 dark:border-gray-700 print:border-gray-300 pb-1.5">
//             Informations Employé
//           </h3>

//           <div className="flex items-center gap-3 mb-2">
//             <div className="w-10 h-10 bg-sky-100 dark:bg-sky-900/30 print:bg-sky-100 rounded-full flex items-center justify-center font-bold text-sky-700 dark:text-sky-400 print:text-sky-700 text-sm print:hidden">
//               {employee?.firstName?.[0]}{employee?.lastName?.[0]}
//             </div>
//             <div>
//               <p className="font-bold text-base text-gray-900 dark:text-white print:text-black">
//                 {employee?.firstName} {employee?.lastName}
//               </p>
//               <p className="font-mono text-xs text-gray-500 print:text-gray-700">
//                 Matricule : {employee?.employeeNumber}
//               </p>
//             </div>
//           </div>

//           <div className="grid grid-cols-[130px_1fr] gap-x-2 gap-y-1.5 text-xs">
//             <span className="text-gray-500 dark:text-gray-400 print:text-gray-600">Poste</span>
//             <span className="font-semibold text-gray-900 dark:text-white print:text-black">{employee?.position || '—'}</span>

//             <span className="text-gray-500 dark:text-gray-400 print:text-gray-600">Département</span>
//             <span className="font-semibold text-gray-900 dark:text-white print:text-black">{employee?.department?.name || '—'}</span>

//             <span className="text-gray-500 dark:text-gray-400 print:text-gray-600">Contrat</span>
//             <span className="font-semibold text-gray-900 dark:text-white print:text-black">{employee?.contractType || '—'}</span>

//             {anciennete && (
//               <>
//                 <span className="text-gray-500 dark:text-gray-400 print:text-gray-600">Ancienneté</span>
//                 <span className="font-semibold text-gray-900 dark:text-white print:text-black">{anciennete}</span>
//               </>
//             )}

//             <span className="text-gray-500 dark:text-gray-400 print:text-gray-600">Situation familiale</span>
//             <span className="font-semibold text-gray-900 dark:text-white print:text-black">
//               {MARITAL_LABELS[employee?.maritalStatus || ''] || '—'}
//               {(employee?.numberOfChildren || 0) > 0 && ` · ${employee?.numberOfChildren} enfant${(employee?.numberOfChildren || 0) > 1 ? 's' : ''}`}
//             </span>

//             <span className="text-gray-500 dark:text-gray-400 print:text-gray-600">N° CNSS</span>
//             <span className="font-semibold font-mono text-gray-900 dark:text-white print:text-black">{employee?.cnssNumber || '—'}</span>

//             <span className="text-gray-500 dark:text-gray-400 print:text-gray-600">N° CNI</span>
//             <span className="font-semibold font-mono text-gray-900 dark:text-white print:text-black">{employee?.nationalIdNumber || '—'}</span>

//             <span className="text-gray-500 dark:text-gray-400 print:text-gray-600">Mode de paiement</span>
//             <span className="font-semibold text-gray-900 dark:text-white print:text-black">
//               {PAYMENT_LABELS[employee?.paymentMethod || ''] || employee?.paymentMethod || 'Virement'}
//             </span>
//           </div>
//         </div>

//         {/* COLONNE DROITE : TEMPS DE TRAVAIL */}
//         <div className="space-y-3">
//           <h3 className="text-xs font-bold uppercase text-gray-400 dark:text-gray-500 print:text-gray-600 tracking-wider border-b border-gray-100 dark:border-gray-700 print:border-gray-300 pb-1.5">
//             Temps de Travail
//           </h3>
          
//           <div className="grid grid-cols-[160px_1fr] gap-x-2 gap-y-1.5 text-xs">
//             <span className="text-gray-500 dark:text-gray-400 print:text-gray-600">Jours ouvrables</span>
//             <span className="font-semibold text-gray-900 dark:text-white print:text-black">{payslip.workDays} jours</span>

//             <span className="text-gray-500 dark:text-gray-400 print:text-gray-600">Jours travaillés</span>
//             <span className="font-bold text-emerald-600 dark:text-emerald-400 print:text-emerald-700">{payslip.workedDays} jours</span>

//             {payslip.absenceDays > 0 && (
//               <>
//                 <span className="text-gray-500 dark:text-gray-400 print:text-gray-600">Absences non payées</span>
//                 <span className="font-bold text-red-600 dark:text-red-400 print:text-red-700">{payslip.absenceDays} jour{payslip.absenceDays > 1 ? 's' : ''}</span>
//               </>
//             )}

//             {(payslip.daysOnLeave || 0) > 0 && (
//               <>
//                 <span className="text-gray-500 dark:text-gray-400 print:text-gray-600">Congés payés</span>
//                 <span className="font-semibold text-sky-600 dark:text-sky-400 print:text-sky-700">{payslip.daysOnLeave} jour{payslip.daysOnLeave! > 1 ? 's' : ''}</span>
//               </>
//             )}

//             {(payslip.daysRemote || 0) > 0 && (
//               <>
//                 <span className="text-gray-500 dark:text-gray-400 print:text-gray-600">Télétravail</span>
//                 <span className="font-semibold text-purple-600 dark:text-purple-400 print:text-purple-700">{payslip.daysRemote} jour{payslip.daysRemote! > 1 ? 's' : ''}</span>
//               </>
//             )}

//             {(payslip.daysHoliday || 0) > 0 && (
//               <>
//                 <span className="text-gray-500 dark:text-gray-400 print:text-gray-600">Jours fériés</span>
//                 <span className="font-semibold text-amber-600 dark:text-amber-400 print:text-amber-700">{payslip.daysHoliday} jour{payslip.daysHoliday! > 1 ? 's' : ''}</span>
//               </>
//             )}

//             {/* ✅ Heures sup — total + détail 4 catégories */}
//             {totalOvertimeHours > 0 && (
//               <>
//                 <span className="text-gray-500 dark:text-gray-400 print:text-gray-600">Heures supplémentaires</span>
//                 <span className="font-bold text-orange-600 dark:text-orange-400 print:text-orange-700">
//                   {totalOvertimeHours.toFixed(1)}h
//                   <span className="text-xs font-normal ml-1 text-gray-500 print:text-gray-600">
//                     ({buildOvertimeDetail()})
//                   </span>
//                 </span>
//               </>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
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