'use client';

import React from 'react';

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

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  DRAFT:     { label: 'Brouillon', bg: 'bg-gray-100 dark:bg-gray-700',          text: 'text-gray-600 dark:text-gray-300',    dot: 'bg-gray-400' },
  VALIDATED: { label: 'Validé',    bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  PAID:      { label: 'Payé',      bg: 'bg-sky-100 dark:bg-sky-900/40',         text: 'text-sky-700 dark:text-sky-300',       dot: 'bg-sky-500' },
  CANCELLED: { label: 'Annulé',    bg: 'bg-red-100 dark:bg-red-900/40',         text: 'text-red-700 dark:text-red-300',       dot: 'bg-red-500' },
};

export default function PayslipHeader({ company, month, year, status }: PayslipHeaderProps) {
  const s = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
  const displayLogo = company?.logo || HRCONGO_LOGO;

  return (
    <div className="relative overflow-hidden print:overflow-visible">
      {/* Bande colorée en haut — visible print */}
      <div className="h-1.5 bg-gradient-to-r from-sky-500 via-emerald-500 to-teal-500 print:bg-gray-900" />

      <div className="px-8 py-6 print:px-6 print:py-4 flex justify-between items-start gap-6
                      bg-white dark:bg-gray-900 print:bg-white border-b border-gray-200 dark:border-gray-700 print:border-gray-300">

        {/* ── GAUCHE : Logo + Entreprise ── */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 print:border-gray-400 shadow-sm">
            <img
              src={displayLogo}
              alt="Logo"
              className="w-full h-full object-contain"
              onError={(e) => { e.currentTarget.src = HRCONGO_LOGO; }}
            />
          </div>

          <div className="min-w-0">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white print:text-black leading-tight truncate">
              {company?.legalName || 'Entreprise'}
            </h1>
            <div className="mt-1 space-y-0.5 text-xs text-gray-500 dark:text-gray-400 print:text-gray-600">
              {company?.address && (
                <p className="truncate">{company.address}</p>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                {company?.rccmNumber && <span>RCCM : <strong className="text-gray-700 dark:text-gray-300 print:text-gray-800">{company.rccmNumber}</strong></span>}
                {company?.nif        && <span>NIF : <strong className="text-gray-700 dark:text-gray-300 print:text-gray-800">{company.nif}</strong></span>}
                {company?.phone      && <span>Tél : <strong className="text-gray-700 dark:text-gray-300 print:text-gray-800">{company.phone}</strong></span>}
              </div>
            </div>
          </div>
        </div>

        {/* ── DROITE : Titre bulletin ── */}
        <div className="text-right flex-shrink-0">
          {/* Badge statut — uniquement screen */}
          <div className="no-print mb-2 flex justify-end">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${s.bg} ${s.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
              {s.label}
            </span>
          </div>

          <div className="inline-block text-right">
            {/* Titre stylisé */}
            <div className="flex items-baseline gap-2 justify-end">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 print:text-gray-500">
                Bulletin de
              </span>
            </div>
            <h2 className="text-2xl font-black uppercase tracking-widest text-gray-900 dark:text-white print:text-black leading-none">
              Paie
            </h2>

            {/* Séparateur */}
            <div className="mt-2 mb-1.5 h-px bg-gradient-to-l from-sky-500 to-transparent print:bg-gray-300" />

            <p className="text-base font-bold text-sky-600 dark:text-sky-400 print:text-gray-800 tracking-wide">
              {MONTHS[month - 1]} {year}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// 'use client';

// import React from 'react';
// import { Building2, Hexagon } from 'lucide-react';

// interface Company {
//   legalName?: string;
//   logo?: string;
//   address?: string;
//   rccmNumber?: string;
//   nif?: string;
//   phone?: string;
// }

// interface PayslipHeaderProps {
//   company: Company;
//   month: number;
//   year: number;
//   status: string;
// }

// const HRCONGO_LOGO = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%230ea5e9;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%2310b981;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23grad)' width='200' height='200' rx='40'/%3E%3Ctext x='100' y='120' font-family='Arial' font-size='80' font-weight='bold' fill='white' text-anchor='middle'%3EHR%3C/text%3E%3C/svg%3E";

// export default function PayslipHeader({ company, month, year, status }: PayslipHeaderProps) {
//   const getStatusBadge = (status: string) => {
//     const map: any = {
//       'DRAFT': { label: 'Brouillon', class: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
//       'VALIDATED': { label: 'Validé', class: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
//       'PAID': { label: 'Payé', class: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' },
//       'CANCELLED': { label: 'Annulé', class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
//     };
//     const s = map[status] || map.DRAFT;
//     return <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${s.class}`}>{s.label}</span>;
//   };

//   const getMonthName = (m: number) => {
//     const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
//     return months[m - 1] || 'Inconnu';
//   };

//   const displayLogo = company?.logo || HRCONGO_LOGO;

//   return (
//     <div className="p-8 print:p-6 border-b-2 border-gray-200 dark:border-gray-700 print:border-gray-900 flex justify-between items-start bg-gray-50 dark:bg-gray-900/50 print:bg-white">
//       {/* LOGO + INFO ENTREPRISE */}
//       <div className="flex items-start gap-4">
//         <div className="w-20 h-20 relative flex-shrink-0">
//           <img 
//             src={displayLogo} 
//             alt="Logo" 
//             className="w-full h-full object-contain rounded-lg"
//             onError={(e) => {
//               e.currentTarget.src = HRCONGO_LOGO;
//             }}
//           />
//         </div>
        
//         <div>
//           <h1 className="text-xl font-bold text-gray-900 dark:text-white print:text-black tracking-tight mb-1">
//             {company?.legalName || 'Entreprise'}
//           </h1>
//           <div className="text-sm text-gray-600 dark:text-gray-400 print:text-gray-700 space-y-0.5">
//             {company?.address && <p>{company.address}</p>}
//             <div className="flex gap-4 flex-wrap">
//               {company?.rccmNumber && <p>RCCM: {company.rccmNumber}</p>}
//               {company?.nif && <p>NIF: {company.nif}</p>}
//             </div>
//             {company?.phone && <p>Tél: {company.phone}</p>}
//           </div>
//         </div>
//       </div>

//       {/* TITRE + PÉRIODE */}
//       <div className="text-right">
//         <h2 className="text-2xl font-bold text-gray-900 dark:text-white print:text-black uppercase tracking-widest mb-1">
//           Bulletin de Paie
//         </h2>
//         <p className="font-bold text-sky-600 dark:text-sky-400 print:text-black text-lg">
//           {getMonthName(month)} {year}
//         </p>
//         <div className="mt-2 print:hidden">{getStatusBadge(status)}</div>
//       </div>
//     </div>
//   );
// }