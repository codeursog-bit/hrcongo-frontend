// 'use client';

// import React from 'react';
// import { Scale, FileCheck, Shield } from 'lucide-react';

// export default function PayslipFooter() {
//   return (
//     <div className="mt-6 pt-5 border-t border-gray-200 dark:border-gray-700 print:border-gray-400 space-y-4
//                     print:break-inside-avoid print:mt-4">

//       {/* Réglementation */}
//       <div className="rounded-xl border border-gray-200 dark:border-gray-700 print:border-gray-300 overflow-hidden">
//         <div className="bg-gray-100 dark:bg-gray-800 print:bg-gray-100 px-4 py-2 flex items-center gap-2">
//           <Scale size={12} className="text-gray-500" />
//           <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-400 print:text-gray-700">
//             Réglementation — République du Congo (Brazzaville)
//           </h4>
//         </div>
//         <div className="px-4 py-3 bg-white dark:bg-gray-900 print:bg-white">
//           <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-[10px] text-gray-600 dark:text-gray-400 print:text-gray-700">
//             {[
//               'Code du Travail — Loi n°45-75 du 15 mars 1975 modifiée',
//               'ITS 2026 — Barème progressif : 1 % · 10 % · 25 % · 40 % (sans quotient familial)',
//               'CNSS salarié : 4 % — Plafond pension : 1 200 000 FCFA/mois',
//               'CNSS patronale : pension 8 % · famille 10 % · AT 2,25 % (plafond 600 000)',
//               'SMIG Congo : 70 400 FCFA/mois',
//               'Heures sup — Décret n°78-360 : +10 % (5 premières h.) · +25 % (suivantes)',
//               'Nuit repos/férié : +50 % · Dimanche & jours fériés : +100 %',
//               'TUS — Taxe Unique sur les Salaires (patronale) : 2 % sur brut',
//             ].map((item, i) => (
//               <div key={i} className="flex items-start gap-1.5">
//                 <span className="text-gray-300 dark:text-gray-600 print:text-gray-400 mt-0.5 flex-shrink-0">•</span>
//                 <span>{item}</span>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Mentions légales */}
//       <div className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 print:bg-gray-50
//                       border border-gray-200 dark:border-gray-700 print:border-gray-300">
//         <p className="text-[10px] font-bold text-gray-700 dark:text-gray-300 print:text-gray-800 flex items-center gap-1.5 mb-2">
//           <FileCheck size={11} className="text-emerald-500" />
//           Mentions légales obligatoires
//         </p>
//         <div className="grid grid-cols-2 gap-x-8 gap-y-0.5 text-[10px] text-gray-500 dark:text-gray-400 print:text-gray-600">
//           {[
//             'Ce bulletin doit être remis à l\'employé le jour du paiement (Art. 87 CT Congo)',
//             'L\'employeur conserve un double pendant 5 ans minimum',
//             'Les cotisations CNSS sont versées avant le 15 du mois suivant',
//             'L\'ITS est prélevé à la source et reversé à la DGID',
//             'Ce document fait foi devant le Tribunal du Travail de Brazzaville',
//             'L\'abattement forfaitaire de 20 % est appliqué sur la base imposable',
//           ].map((item, i) => (
//             <p key={i} className="flex items-start gap-1">
//               <span className="text-gray-300 dark:text-gray-600 print:text-gray-400 flex-shrink-0">•</span>
//               {item}
//             </p>
//           ))}
//         </div>
//       </div>

//       {/* Barre basse : certifications + date */}
//       <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500 print:text-gray-500 pt-1">
//         <div className="flex items-center gap-4">
//           <span className="flex items-center gap-1">
//             <FileCheck size={11} className="text-emerald-500" />
//             Document certifié conforme
//           </span>
//           <span className="flex items-center gap-1">
//             <Shield size={11} className="text-sky-500" />
//             Conforme Code du Travail Congo-Brazzaville
//           </span>
//         </div>
//         <span className="font-medium">
//           Généré le {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
//         </span>
//       </div>

//       {/* Branding */}
//       <div className="flex items-center justify-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800 print:border-gray-300">
//         <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-sky-500">
//           <polygon points="8,1 15,5 15,11 8,15 1,11 1,5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
//           <circle cx="8" cy="8" r="2" fill="currentColor"/>
//         </svg>
//         <span className="font-bold text-xs text-gray-500 dark:text-gray-400 print:text-gray-600 uppercase tracking-widest">HRCongo</span>
//         <span className="text-[10px] text-gray-400 dark:text-gray-600 print:text-gray-500">· SIRH pour les entreprises congolaises</span>
//       </div>

//       <div className="hidden print:block text-center text-[10px] text-gray-400">
//         hrcongo.com · contact@hrcongo.cg · Gestion RH Congo Brazzaville
//       </div>
//     </div>
//   );
// }


'use client';

import React from 'react';

export default function PayslipFooter() {
  const reglItems = [
    'Code du Travail — Loi n°45-75 du 15 mars 1975 modifiée',
    'ITS 2026 — Barème : 1% · 10% · 25% · 40% (sans quotient familial)',
    'CNSS salarié : 4% — Plafond pension : 1 200 000 FCFA/mois',
    'CNSS patronale : pension 8% · famille 10% · AT 2,25%',
    'SMIG Congo : 70 400 FCFA/mois (2026)',
    'TUS : 2% sur brut total (patronale, sans plafond)',
    "HS — Décret n°78-360 : +10% · +25% · +50% · +100%",
    "L'ITS est prélevé à la source et reversé à la DGID",
  ];

  const legaItems = [
    "Bulletin remis à l'employé le jour du paiement (Art. 87 CT)",
    'Cotisations CNSS versées avant le 15 du mois suivant',
    "L'employeur conserve un double pendant 5 ans minimum",
    'Ce document fait foi devant le Tribunal du Travail de Brazzaville',
  ];

  const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1.5px solid #e5e7eb', width: '100%' }}>

      {/* Réglementation */}
      <div style={{ borderRadius: 7, border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: 8 }}>
        <div style={{ background: '#f8fafc', padding: '7px 14px', borderBottom: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: '9.5px', fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: '#475569', margin: 0 }}>
            ⚖️ Réglementation — République du Congo (Brazzaville)
          </p>
        </div>
        <div style={{ background: '#ffffff', padding: '10px 14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 20px' }}>
            {reglItems.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 5 }}>
                <span style={{ color: '#cbd5e1', fontSize: '9.5px', flexShrink: 0 }}>•</span>
                <span style={{ fontSize: '9.5px', color: '#64748b', lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mentions légales */}
      <div style={{ borderRadius: 7, border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: 8 }}>
        <div style={{ background: '#f8fafc', padding: '7px 14px', borderBottom: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: '9.5px', fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: '#475569', margin: 0 }}>
            📋 Mentions Légales
          </p>
        </div>
        <div style={{ background: '#ffffff', padding: '10px 14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 20px' }}>
            {legaItems.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 5 }}>
                <span style={{ color: '#cbd5e1', fontSize: '9.5px', flexShrink: 0 }}>•</span>
                <span style={{ fontSize: '9.5px', color: '#64748b', lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Certifications + date */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9.5px', color: '#94a3b8', marginBottom: 8 }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <span>✅ Document certifié conforme</span>
          <span>🛡️ Conforme Code du Travail Congo-Brazzaville</span>
        </div>
        <span style={{ fontWeight: 600, color: '#64748b' }}>Généré le {today}</span>
      </div>

      {/* Branding */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
          <polygon points="8,1 15,5 15,11 8,15 1,11 1,5" stroke="#0ea5e9" strokeWidth="1.5" fill="none"/>
          <circle cx="8" cy="8" r="2" fill="#0ea5e9"/>
        </svg>
        <span style={{ fontSize: '10px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' as const, letterSpacing: '0.15em' }}>
          HRCongo
        </span>
        <span style={{ fontSize: '9.5px', color: '#94a3b8' }}>
          · SIRH pour les entreprises congolaises
        </span>
      </div>
    </div>
  );
}
