
'use client';

import React from 'react';

interface Employee {
  firstName?: string;
  lastName?: string;
  employeeNumber?: string;
  position?: string;
  department?: { name?: string };
  cnssNumber?: string;
  nationalIdNumber?: string;
  paymentMethod?: string;
  maritalStatus?: string;
  numberOfChildren?: number;
  professionalCategory?: string;
  echelon?: string;
  contractType?: string;
  hireDate?: string;
}

// ✅ Interface mise à jour — 4 catégories HS
interface PayslipData {
  month: number;
  year: number;
  workDays: number;
  workedDays: number;
  absenceDays: number;
  daysOnLeave?: number;
  daysRemote?: number;
  daysHoliday?: number;
  overtimeHours10?: number | string;
  overtimeHours25?: number | string;
  overtimeHours50?: number | string;
  overtimeHours100?: number | string;
  professionalCategory?: string;
  collectiveAgreement?: string;
}

interface PayslipEmployeeInfoProps {
  employee: Employee;
  payslip: PayslipData;
}

export default function PayslipEmployeeInfo({ employee, payslip }: PayslipEmployeeInfoProps) {
  const MONTH_NAMES = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const getMonthName = (m: number) => MONTH_NAMES[m - 1] || '—';

  // ✅ 4 catégories HS
  const overtime10  = Number(payslip.overtimeHours10)  || 0;
  const overtime25  = Number(payslip.overtimeHours25)  || 0;
  const overtime50  = Number(payslip.overtimeHours50)  || 0;
  const overtime100 = Number(payslip.overtimeHours100) || 0;
  const totalOvertimeHours = overtime10 + overtime25 + overtime50 + overtime100;

  const MARITAL_LABELS: Record<string, string> = {
    SINGLE: 'Célibataire', MARRIED: 'Marié(e)', DIVORCED: 'Divorcé(e)', WIDOWED: 'Veuf/Veuve'
  };
  const PAYMENT_LABELS: Record<string, string> = {
    CASH: 'Espèces', BANK_TRANSFER: 'Virement bancaire', MOBILE_MONEY: 'Mobile Money'
  };

  const getAnciennete = () => {
    if (!employee?.hireDate) return null;
    const hire = new Date(employee.hireDate);
    const now = new Date();
    const months = Math.floor((now.getTime() - hire.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
    const years = Math.floor(months / 12);
    const rem = months % 12;
    if (years === 0) return `${rem} mois`;
    return `${years} an${years > 1 ? 's' : ''} ${rem > 0 ? `${rem} mois` : ''}`;
  };

  const anciennete = getAnciennete();

  // Construit le détail HS sous forme lisible
  const buildOvertimeDetail = () => {
    const parts: string[] = [];
    if (overtime10  > 0) parts.push(`${overtime10}h +10%`);
    if (overtime25  > 0) parts.push(`${overtime25}h +25%`);
    if (overtime50  > 0) parts.push(`${overtime50}h +50%`);
    if (overtime100 > 0) parts.push(`${overtime100}h +100%`);
    return parts.join(', ');
  };

  return (
    <div className="px-8 py-5 print:px-6 border-b-2 border-gray-200 dark:border-gray-700 print:border-gray-400">
      
      {/* Bandeau période */}
      <div className="bg-gray-100 dark:bg-gray-700/50 print:bg-gray-100 rounded-xl px-5 py-3 mb-5 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 print:text-gray-600 uppercase tracking-wider">Période de paie</span>
          <p className="font-bold text-gray-900 dark:text-white print:text-black text-lg">{getMonthName(payslip.month)} {payslip.year}</p>
        </div>
        {(payslip.collectiveAgreement || employee?.professionalCategory || payslip.professionalCategory) && (
          <div className="text-right">
            {payslip.collectiveAgreement && (
              <p className="text-xs text-gray-500 dark:text-gray-400 print:text-gray-600">Convention : <strong className="text-gray-800 dark:text-white print:text-black">{payslip.collectiveAgreement}</strong></p>
            )}
            {(employee?.professionalCategory || payslip.professionalCategory) && (
              <p className="text-xs text-gray-500 dark:text-gray-400 print:text-gray-600">
                Catégorie : <strong className="font-mono text-gray-800 dark:text-white print:text-black">{employee?.professionalCategory || payslip.professionalCategory}</strong>
                {employee?.echelon && <span> · Échelon <strong>{employee.echelon}</strong></span>}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-10 gap-y-4 text-sm">
        {/* COLONNE GAUCHE : EMPLOYÉ */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase text-gray-400 dark:text-gray-500 print:text-gray-600 tracking-wider border-b border-gray-100 dark:border-gray-700 print:border-gray-300 pb-1.5">
            Informations Employé
          </h3>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-sky-100 dark:bg-sky-900/30 print:bg-sky-100 rounded-full flex items-center justify-center font-bold text-sky-700 dark:text-sky-400 print:text-sky-700 text-sm print:hidden">
              {employee?.firstName?.[0]}{employee?.lastName?.[0]}
            </div>
            <div>
              <p className="font-bold text-base text-gray-900 dark:text-white print:text-black">
                {employee?.firstName} {employee?.lastName}
              </p>
              <p className="font-mono text-xs text-gray-500 print:text-gray-700">
                Matricule : {employee?.employeeNumber}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-[130px_1fr] gap-x-2 gap-y-1.5 text-xs">
            <span className="text-gray-500 dark:text-gray-400 print:text-gray-600">Poste</span>
            <span className="font-semibold text-gray-900 dark:text-white print:text-black">{employee?.position || '—'}</span>

            <span className="text-gray-500 dark:text-gray-400 print:text-gray-600">Département</span>
            <span className="font-semibold text-gray-900 dark:text-white print:text-black">{employee?.department?.name || '—'}</span>

            <span className="text-gray-500 dark:text-gray-400 print:text-gray-600">Contrat</span>
            <span className="font-semibold text-gray-900 dark:text-white print:text-black">{employee?.contractType || '—'}</span>

            {anciennete && (
              <>
                <span className="text-gray-500 dark:text-gray-400 print:text-gray-600">Ancienneté</span>
                <span className="font-semibold text-gray-900 dark:text-white print:text-black">{anciennete}</span>
              </>
            )}

            <span className="text-gray-500 dark:text-gray-400 print:text-gray-600">Situation familiale</span>
            <span className="font-semibold text-gray-900 dark:text-white print:text-black">
              {MARITAL_LABELS[employee?.maritalStatus || ''] || '—'}
              {(employee?.numberOfChildren || 0) > 0 && ` · ${employee?.numberOfChildren} enfant${(employee?.numberOfChildren || 0) > 1 ? 's' : ''}`}
            </span>

            <span className="text-gray-500 dark:text-gray-400 print:text-gray-600">N° CNSS</span>
            <span className="font-semibold font-mono text-gray-900 dark:text-white print:text-black">{employee?.cnssNumber || '—'}</span>

            <span className="text-gray-500 dark:text-gray-400 print:text-gray-600">N° CNI</span>
            <span className="font-semibold font-mono text-gray-900 dark:text-white print:text-black">{employee?.nationalIdNumber || '—'}</span>

            <span className="text-gray-500 dark:text-gray-400 print:text-gray-600">Mode de paiement</span>
            <span className="font-semibold text-gray-900 dark:text-white print:text-black">
              {PAYMENT_LABELS[employee?.paymentMethod || ''] || employee?.paymentMethod || 'Virement'}
            </span>
          </div>
        </div>

        {/* COLONNE DROITE : TEMPS DE TRAVAIL */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase text-gray-400 dark:text-gray-500 print:text-gray-600 tracking-wider border-b border-gray-100 dark:border-gray-700 print:border-gray-300 pb-1.5">
            Temps de Travail
          </h3>
          
          <div className="grid grid-cols-[160px_1fr] gap-x-2 gap-y-1.5 text-xs">
            <span className="text-gray-500 dark:text-gray-400 print:text-gray-600">Jours ouvrables</span>
            <span className="font-semibold text-gray-900 dark:text-white print:text-black">{payslip.workDays} jours</span>

            <span className="text-gray-500 dark:text-gray-400 print:text-gray-600">Jours travaillés</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 print:text-emerald-700">{payslip.workedDays} jours</span>

            {payslip.absenceDays > 0 && (
              <>
                <span className="text-gray-500 dark:text-gray-400 print:text-gray-600">Absences non payées</span>
                <span className="font-bold text-red-600 dark:text-red-400 print:text-red-700">{payslip.absenceDays} jour{payslip.absenceDays > 1 ? 's' : ''}</span>
              </>
            )}

            {(payslip.daysOnLeave || 0) > 0 && (
              <>
                <span className="text-gray-500 dark:text-gray-400 print:text-gray-600">Congés payés</span>
                <span className="font-semibold text-sky-600 dark:text-sky-400 print:text-sky-700">{payslip.daysOnLeave} jour{payslip.daysOnLeave! > 1 ? 's' : ''}</span>
              </>
            )}

            {(payslip.daysRemote || 0) > 0 && (
              <>
                <span className="text-gray-500 dark:text-gray-400 print:text-gray-600">Télétravail</span>
                <span className="font-semibold text-purple-600 dark:text-purple-400 print:text-purple-700">{payslip.daysRemote} jour{payslip.daysRemote! > 1 ? 's' : ''}</span>
              </>
            )}

            {(payslip.daysHoliday || 0) > 0 && (
              <>
                <span className="text-gray-500 dark:text-gray-400 print:text-gray-600">Jours fériés</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400 print:text-amber-700">{payslip.daysHoliday} jour{payslip.daysHoliday! > 1 ? 's' : ''}</span>
              </>
            )}

            {/* ✅ Heures sup — total + détail 4 catégories */}
            {totalOvertimeHours > 0 && (
              <>
                <span className="text-gray-500 dark:text-gray-400 print:text-gray-600">Heures supplémentaires</span>
                <span className="font-bold text-orange-600 dark:text-orange-400 print:text-orange-700">
                  {totalOvertimeHours.toFixed(1)}h
                  <span className="text-xs font-normal ml-1 text-gray-500 print:text-gray-600">
                    ({buildOvertimeDetail()})
                  </span>
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
