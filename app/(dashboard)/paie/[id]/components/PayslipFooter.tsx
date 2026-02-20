'use client';

import React from 'react';
import { Scale, FileCheck, Shield } from 'lucide-react';

export default function PayslipFooter() {
  return (
    <div className="mt-6 pt-5 border-t border-gray-200 dark:border-gray-700 print:border-gray-400 space-y-4
                    print:break-inside-avoid print:mt-4">

      {/* Réglementation */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 print:border-gray-300 overflow-hidden">
        <div className="bg-gray-100 dark:bg-gray-800 print:bg-gray-100 px-4 py-2 flex items-center gap-2">
          <Scale size={12} className="text-gray-500" />
          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-400 print:text-gray-700">
            Réglementation — République du Congo (Brazzaville)
          </h4>
        </div>
        <div className="px-4 py-3 bg-white dark:bg-gray-900 print:bg-white">
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-[10px] text-gray-600 dark:text-gray-400 print:text-gray-700">
            {[
              'Code du Travail — Loi n°45-75 du 15 mars 1975 modifiée',
              'ITS 2026 — Barème progressif : 1 % · 10 % · 25 % · 40 % (sans quotient familial)',
              'CNSS salarié : 4 % — Plafond pension : 1 200 000 FCFA/mois',
              'CNSS patronale : pension 8 % · famille 10 % · AT 2,25 % (plafond 600 000)',
              'SMIG Congo : 70 400 FCFA/mois',
              'Heures sup — Décret n°78-360 : +10 % (5 premières h.) · +25 % (suivantes)',
              'Nuit repos/férié : +50 % · Dimanche & jours fériés : +100 %',
              'TUS — Taxe Unique sur les Salaires (patronale) : 2 % sur brut',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <span className="text-gray-300 dark:text-gray-600 print:text-gray-400 mt-0.5 flex-shrink-0">•</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mentions légales */}
      <div className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 print:bg-gray-50
                      border border-gray-200 dark:border-gray-700 print:border-gray-300">
        <p className="text-[10px] font-bold text-gray-700 dark:text-gray-300 print:text-gray-800 flex items-center gap-1.5 mb-2">
          <FileCheck size={11} className="text-emerald-500" />
          Mentions légales obligatoires
        </p>
        <div className="grid grid-cols-2 gap-x-8 gap-y-0.5 text-[10px] text-gray-500 dark:text-gray-400 print:text-gray-600">
          {[
            'Ce bulletin doit être remis à l\'employé le jour du paiement (Art. 87 CT Congo)',
            'L\'employeur conserve un double pendant 5 ans minimum',
            'Les cotisations CNSS sont versées avant le 15 du mois suivant',
            'L\'ITS est prélevé à la source et reversé à la DGID',
            'Ce document fait foi devant le Tribunal du Travail de Brazzaville',
            'L\'abattement forfaitaire de 20 % est appliqué sur la base imposable',
          ].map((item, i) => (
            <p key={i} className="flex items-start gap-1">
              <span className="text-gray-300 dark:text-gray-600 print:text-gray-400 flex-shrink-0">•</span>
              {item}
            </p>
          ))}
        </div>
      </div>

      {/* Barre basse : certifications + date */}
      <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500 print:text-gray-500 pt-1">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <FileCheck size={11} className="text-emerald-500" />
            Document certifié conforme
          </span>
          <span className="flex items-center gap-1">
            <Shield size={11} className="text-sky-500" />
            Conforme Code du Travail Congo-Brazzaville
          </span>
        </div>
        <span className="font-medium">
          Généré le {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
        </span>
      </div>

      {/* Branding */}
      <div className="flex items-center justify-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800 print:border-gray-300">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-sky-500">
          <polygon points="8,1 15,5 15,11 8,15 1,11 1,5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          <circle cx="8" cy="8" r="2" fill="currentColor"/>
        </svg>
        <span className="font-bold text-xs text-gray-500 dark:text-gray-400 print:text-gray-600 uppercase tracking-widest">HRCongo</span>
        <span className="text-[10px] text-gray-400 dark:text-gray-600 print:text-gray-500">· SIRH pour les entreprises congolaises</span>
      </div>

      <div className="hidden print:block text-center text-[10px] text-gray-400">
        hrcongo.com · contact@hrcongo.cg · Gestion RH Congo Brazzaville
      </div>
    </div>
  );
}

// 'use client';

// import React from 'react';
// import { Shield, FileCheck, Scale } from 'lucide-react';

// export default function PayslipFooter() {
//   return (
//     <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 print:border-gray-400 space-y-4 print:mt-4">

//       {/* Réglementation en vigueur */}
//       <div className="p-4 bg-slate-50 dark:bg-slate-800/50 print:bg-slate-50 rounded-xl border border-slate-200 dark:border-slate-700 print:border-slate-300">
//         <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 print:text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
//           <Scale size={13} /> Réglementation Applicable — République du Congo (Brazzaville)
//         </h4>
//         <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-xs text-slate-600 dark:text-slate-400 print:text-slate-700">
//           <div className="flex items-start gap-1.5">
//             <span className="text-slate-400 mt-0.5">•</span>
//             <span>Code du Travail — Loi n°45-75 du 15 mars 1975 modifiée</span>
//           </div>
//           <div className="flex items-start gap-1.5">
//             <span className="text-slate-400 mt-0.5">•</span>
//             <span>CNSS salariale : 4% — Plafond : 600 000 FCFA/mois</span>
//           </div>
//           <div className="flex items-start gap-1.5">
//             <span className="text-slate-400 mt-0.5">•</span>
//             <span>CNSS patronale : 16,65% (retraite, maladie, maternité, accidents)</span>
//           </div>
//           <div className="flex items-start gap-1.5">
//             <span className="text-slate-400 mt-0.5">•</span>
//             <span>IRPP calculé selon le barème progressif en vigueur au Congo</span>
//           </div>
//           <div className="flex items-start gap-1.5">
//             <span className="text-slate-400 mt-0.5">•</span>
//             <span>SMIG Congo Brazzaville : 70 400 FCFA/mois (2024)</span>
//           </div>
//           <div className="flex items-start gap-1.5">
//             <span className="text-slate-400 mt-0.5">•</span>
//             <span>Heures supplémentaires : +15% (25% nuit) et +50% (100% dimanche/JF)</span>
//           </div>
//         </div>
//       </div>

//       {/* Mentions légales */}
//       <div className="p-4 bg-gray-50 dark:bg-gray-900/30 print:bg-gray-50 rounded-xl text-xs text-gray-600 dark:text-gray-400 print:text-gray-700 space-y-1.5">
//         <p className="font-bold text-gray-700 dark:text-gray-300 print:text-gray-800 flex items-center gap-1.5">
//           <FileCheck size={12} className="text-emerald-500" /> Mentions légales obligatoires
//         </p>
//         <div className="space-y-0.5 ml-4">
//           <p>• Ce bulletin de paie doit être remis à l'employé le jour du paiement (Art. 87 CT Congo)</p>
//           <p>• L'employeur doit conserver un double pendant 5 ans minimum</p>
//           <p>• Les cotisations sociales sont versées à la CNSS avant le 15 du mois suivant</p>
//           <p>• L'IRPP (ITS) est prélevé à la source et reversé à la DGI</p>
//           <p>• En cas de contestation, ce bulletin fait foi devant le Tribunal du Travail de Brazzaville</p>
//         </div>
//       </div>

//       {/* Certifications + date */}
//       <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-600 print:text-gray-600">
//         <div className="flex items-center gap-6">
//           <div className="flex items-center gap-1.5">
//             <FileCheck size={13} className="text-emerald-500 print:text-emerald-600" />
//             <span>Document certifié conforme</span>
//           </div>
//           <div className="flex items-center gap-1.5">
//             <Shield size={13} className="text-sky-500 print:text-sky-600" />
//             <span>Conforme Code du Travail Congo-Brazzaville</span>
//           </div>
//         </div>
//         <span className="font-medium">
//           Généré le {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
//         </span>
//       </div>

//       {/* Branding */}
//       <div className="flex items-center justify-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-800 print:border-gray-300 opacity-60 print:opacity-100">
//         <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-sky-500">
//           <polygon points="8,1 15,5 15,11 8,15 1,11 1,5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
//           <circle cx="8" cy="8" r="2" fill="currentColor"/>
//         </svg>
//         <span className="font-bold text-sm text-gray-600 dark:text-gray-400 print:text-gray-700 tracking-wide uppercase">HRCongo</span>
//         <span className="text-xs text-gray-400 dark:text-gray-600 print:text-gray-600">· SIRH pour les entreprises congolaises</span>
//       </div>
      
//       <div className="hidden print:block text-center text-xs text-gray-400 mt-1">
//         <p>hrcongo.com — contact@hrcongo.cg — Gestion RH Congo Brazzaville</p>
//       </div>
//     </div>
//   );
// }


