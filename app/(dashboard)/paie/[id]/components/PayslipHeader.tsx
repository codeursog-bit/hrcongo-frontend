'use client';

import React from 'react';
import { Building2, Hexagon } from 'lucide-react';

interface Company {
  legalName?: string;
  logo?: string;
  address?: string;
  rccmNumber?: string;
  nif?: string;
  phone?: string;
}

interface PayslipHeaderProps {
  company: Company;
  month: number;
  year: number;
  status: string;
}

const HRCONGO_LOGO = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%230ea5e9;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%2310b981;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23grad)' width='200' height='200' rx='40'/%3E%3Ctext x='100' y='120' font-family='Arial' font-size='80' font-weight='bold' fill='white' text-anchor='middle'%3EHR%3C/text%3E%3C/svg%3E";

export default function PayslipHeader({ company, month, year, status }: PayslipHeaderProps) {
  const getStatusBadge = (status: string) => {
    const map: any = {
      'DRAFT': { label: 'Brouillon', class: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
      'VALIDATED': { label: 'Validé', class: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
      'PAID': { label: 'Payé', class: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' },
      'CANCELLED': { label: 'Annulé', class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
    };
    const s = map[status] || map.DRAFT;
    return <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${s.class}`}>{s.label}</span>;
  };

  const getMonthName = (m: number) => {
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return months[m - 1] || 'Inconnu';
  };

  const displayLogo = company?.logo || HRCONGO_LOGO;

  return (
    <div className="p-8 print:p-6 border-b-2 border-gray-200 dark:border-gray-700 print:border-gray-900 flex justify-between items-start bg-gray-50 dark:bg-gray-900/50 print:bg-white">
      {/* LOGO + INFO ENTREPRISE */}
      <div className="flex items-start gap-4">
        <div className="w-20 h-20 relative flex-shrink-0">
          <img 
            src={displayLogo} 
            alt="Logo" 
            className="w-full h-full object-contain rounded-lg"
            onError={(e) => {
              e.currentTarget.src = HRCONGO_LOGO;
            }}
          />
        </div>
        
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white print:text-black tracking-tight mb-1">
            {company?.legalName || 'Entreprise'}
          </h1>
          <div className="text-sm text-gray-600 dark:text-gray-400 print:text-gray-700 space-y-0.5">
            {company?.address && <p>{company.address}</p>}
            <div className="flex gap-4 flex-wrap">
              {company?.rccmNumber && <p>RCCM: {company.rccmNumber}</p>}
              {company?.nif && <p>NIF: {company.nif}</p>}
            </div>
            {company?.phone && <p>Tél: {company.phone}</p>}
          </div>
        </div>
      </div>

      {/* TITRE + PÉRIODE */}
      <div className="text-right">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white print:text-black uppercase tracking-widest mb-1">
          Bulletin de Paie
        </h2>
        <p className="font-bold text-sky-600 dark:text-sky-400 print:text-black text-lg">
          {getMonthName(month)} {year}
        </p>
        <div className="mt-2 print:hidden">{getStatusBadge(status)}</div>
      </div>
    </div>
  );
}