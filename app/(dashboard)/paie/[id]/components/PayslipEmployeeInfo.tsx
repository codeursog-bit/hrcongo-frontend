
'use client';

import React from 'react';

interface Employee {
  firstName?: string;
  lastName?: string;
  employeeNumber?: string;
  position?: string;
  department?: { name?: string };
  cnssNumber?: string;
  bankAccount?: string;
  paymentMethod?: string;
}

interface PayslipData {
  month: number;
  year: number;
  workDays: number;
  workedDays: number;
  absenceDays: number;
  daysOnLeave?: number;
  daysRemote?: number;
  daysHoliday?: number;
  overtimeHours15?: number | string;
  overtimeHours50?: number | string;
}

interface PayslipEmployeeInfoProps {
  employee: Employee;
  payslip: PayslipData;
}

export default function PayslipEmployeeInfo({ employee, payslip }: PayslipEmployeeInfoProps) {
  const getMonthName = (m: number) => {
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return months[m - 1] || 'Inconnu';
  };

  // ✅ CORRECTION : Forcer conversion en Number
  const overtime15 = Number(payslip.overtimeHours15) || 0;
  const overtime50 = Number(payslip.overtimeHours50) || 0;
  const totalOvertimeHours = overtime15 + overtime50;

  return (
    <div className="p-8 print:p-6 grid grid-cols-2 gap-x-12 gap-y-6 text-sm border-b border-gray-200 dark:border-gray-700 print:border-gray-300">
      {/* COLONNE GAUCHE : EMPLOYÉ */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase text-gray-400 dark:text-gray-500 print:text-gray-600 tracking-wider border-b border-gray-100 dark:border-gray-700 print:border-gray-300 pb-1">
          Informations Employé
        </h3>
        
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 print:bg-gray-200 rounded-full flex items-center justify-center font-bold text-lg text-gray-600 dark:text-gray-300 print:text-gray-700 print:hidden">
            {employee?.firstName?.[0]}{employee?.lastName?.[0]}
          </div>
          <div>
            <p className="font-bold text-lg text-gray-900 dark:text-white print:text-black">
              {employee?.firstName} {employee?.lastName}
            </p>
            <p className="font-mono text-xs text-gray-500 dark:text-gray-400 print:text-gray-700">
              Matricule: {employee?.employeeNumber}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2">
          <div className="text-gray-500 dark:text-gray-400 print:text-gray-600">Poste:</div>
          <div className="font-medium text-gray-900 dark:text-white print:text-black">{employee?.position || 'N/A'}</div>
          
          <div className="text-gray-500 dark:text-gray-400 print:text-gray-600">Département:</div>
          <div className="font-medium text-gray-900 dark:text-white print:text-black">{employee?.department?.name || 'N/A'}</div>
          
          <div className="text-gray-500 dark:text-gray-400 print:text-gray-600">N° CNSS:</div>
          <div className="font-medium text-gray-900 dark:text-white print:text-black">{employee?.cnssNumber || 'N/A'}</div>
          
          <div className="text-gray-500 dark:text-gray-400 print:text-gray-600">Paiement:</div>
          <div className="font-medium text-gray-900 dark:text-white print:text-black uppercase text-xs">
            {employee?.paymentMethod?.replace('_', ' ') || 'VIREMENT'}
          </div>
        </div>
      </div>
      
      {/* COLONNE DROITE : PÉRIODE & TEMPS */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase text-gray-400 dark:text-gray-500 print:text-gray-600 tracking-wider border-b border-gray-100 dark:border-gray-700 print:border-gray-300 pb-1">
          Période & Temps de Travail
        </h3>
        
        <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2">
          <div className="text-gray-500 dark:text-gray-400 print:text-gray-600">Période:</div>
          <div className="font-medium text-gray-900 dark:text-white print:text-black">
            {getMonthName(payslip.month)} {payslip.year}
          </div>
          
          <div className="text-gray-500 dark:text-gray-400 print:text-gray-600">Jours ouvrables:</div>
          <div className="font-medium text-gray-900 dark:text-white print:text-black">
            {payslip.workDays} jours
          </div>
          
          <div className="text-gray-500 dark:text-gray-400 print:text-gray-600">Jours travaillés:</div>
          <div className="font-bold text-emerald-600 dark:text-emerald-400 print:text-emerald-700">
            {payslip.workedDays} jours
          </div>
          
          {payslip.absenceDays > 0 && (
            <>
              <div className="text-gray-500 dark:text-gray-400 print:text-gray-600">Absences non payées:</div>
              <div className="font-bold text-red-600 dark:text-red-400 print:text-red-700">
                {payslip.absenceDays} jour{payslip.absenceDays > 1 ? 's' : ''}
              </div>
            </>
          )}
          
          {(payslip.daysOnLeave || 0) > 0 && (
            <>
              <div className="text-gray-500 dark:text-gray-400 print:text-gray-600">Congés payés:</div>
              <div className="font-medium text-sky-600 dark:text-sky-400 print:text-sky-700">
                {payslip.daysOnLeave} jour{payslip.daysOnLeave! > 1 ? 's' : ''}
              </div>
            </>
          )}
          
          {(payslip.daysRemote || 0) > 0 && (
            <>
              <div className="text-gray-500 dark:text-gray-400 print:text-gray-600">Télétravail:</div>
              <div className="font-medium text-purple-600 dark:text-purple-400 print:text-purple-700">
                {payslip.daysRemote} jour{payslip.daysRemote! > 1 ? 's' : ''}
              </div>
            </>
          )}
          
          {totalOvertimeHours > 0 && (
            <>
              <div className="text-gray-500 dark:text-gray-400 print:text-gray-600">Heures sup:</div>
              <div className="font-bold text-orange-600 dark:text-orange-400 print:text-orange-700">
                {totalOvertimeHours.toFixed(1)}h
                <span className="text-xs font-normal ml-1">
                  ({overtime15}h +15%, {overtime50}h +50%)
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}