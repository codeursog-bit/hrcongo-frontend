


// 'use client';

// import React from 'react';

// export default function PayslipFooter() {
//   const reglItems = [
//     'Code du Travail — Loi n°45-75 du 15 mars 1975 modifiée',
//     'ITS 2026 — Barème : 1% · 10% · 25% · 40% (sans quotient familial)',
//     'CNSS salarié : 4% — Plafond pension : 1 200 000 FCFA/mois',
//     'CNSS patronale : pension 8% · famille 10% · AT 2,25%',
//     'SMIG Congo : 70 400 FCFA/mois (2026)',
//     'TUS : 2% sur brut total (patronale, sans plafond)',
//     "HS — Décret n°78-360 : +10% · +25% · +50% · +100%",
//     "L'ITS est prélevé à la source et reversé à la DGID",
//   ];

//   const legaItems = [
//     "Bulletin remis à l'employé le jour du paiement (Art. 87 CT)",
//     'Cotisations CNSS versées avant le 15 du mois suivant',
//     "L'employeur conserve un double pendant 5 ans minimum",
//     'Ce document fait foi devant le Tribunal du Travail de Brazzaville',
//   ];

//   const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

//   return (
//     <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1.5px solid #e5e7eb', width: '100%' }}>

//       {/* Réglementation */}
//       <div style={{ borderRadius: 7, border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: 8 }}>
//         <div style={{ background: '#f8fafc', padding: '7px 14px', borderBottom: '1px solid #e5e7eb' }}>
//           <p style={{ fontSize: '9.5px', fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: '#475569', margin: 0 }}>
//             ⚖️ Réglementation — République du Congo (Brazzaville)
//           </p>
//         </div>
//         <div style={{ background: '#ffffff', padding: '10px 14px' }}>
//           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 20px' }}>
//             {reglItems.map((item, i) => (
//               <div key={i} style={{ display: 'flex', gap: 5 }}>
//                 <span style={{ color: '#cbd5e1', fontSize: '9.5px', flexShrink: 0 }}>•</span>
//                 <span style={{ fontSize: '9.5px', color: '#64748b', lineHeight: 1.5 }}>{item}</span>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Mentions légales */}
//       <div style={{ borderRadius: 7, border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: 8 }}>
//         <div style={{ background: '#f8fafc', padding: '7px 14px', borderBottom: '1px solid #e5e7eb' }}>
//           <p style={{ fontSize: '9.5px', fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: '#475569', margin: 0 }}>
//             📋 Mentions Légales
//           </p>
//         </div>
//         <div style={{ background: '#ffffff', padding: '10px 14px' }}>
//           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 20px' }}>
//             {legaItems.map((item, i) => (
//               <div key={i} style={{ display: 'flex', gap: 5 }}>
//                 <span style={{ color: '#cbd5e1', fontSize: '9.5px', flexShrink: 0 }}>•</span>
//                 <span style={{ fontSize: '9.5px', color: '#64748b', lineHeight: 1.5 }}>{item}</span>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Certifications + date */}
//       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9.5px', color: '#94a3b8', marginBottom: 8 }}>
//         <div style={{ display: 'flex', gap: 16 }}>
//           <span>✅ Document certifié conforme</span>
//           <span>🛡️ Conforme Code du Travail Congo-Brazzaville</span>
//         </div>
//         <span style={{ fontWeight: 600, color: '#64748b' }}>Généré le {today}</span>
//       </div>

//       {/* Branding */}
//       <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
//         <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
//           <polygon points="8,1 15,5 15,11 8,15 1,11 1,5" stroke="#0ea5e9" strokeWidth="1.5" fill="none"/>
//           <circle cx="8" cy="8" r="2" fill="#0ea5e9"/>
//         </svg>
//         <span style={{ fontSize: '10px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' as const, letterSpacing: '0.15em' }}>
//           HRCongo
//         </span>
//         <span style={{ fontSize: '9.5px', color: '#94a3b8' }}>
//           · SIRH pour les entreprises congolaises
//         </span>
//       </div>
//     </div>
//   );
// }



'use client';
 
import React from 'react';
 
export default function PayslipFooter() {
  const reglItems = [
    'Code du Travail — Loi n°45-75 du 15 mars 1975 modifiée',
    'ITS 2026 — Barème : 1 200F · 10% · 15% · 20% · 30% (sans quotient familial)',
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
 