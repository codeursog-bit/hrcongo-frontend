// // ============================================================================
// // 🔧 MODIFICATION DES COMPOSANTS QUI CONSOMMENT L'API
// // ============================================================================

// // ✅ COMPOSANT ActivityTable - Reçoit les données via props
// // Fichier: frontend/components/admin/ActivityTable.tsx

// 'use client';

// import React, { useState } from 'react';
// import Link from 'next/link';
// import { Search, MoreVertical, Eye, Ban, Trash2 } from 'lucide-react';

// interface ActivityTableProps {
//   companies?: any[]; // ✅ AJOUT : Recevoir les données
// }

// export function ActivityTable({ companies = [] }: ActivityTableProps) {
//   const [searchTerm, setSearchTerm] = useState('');

//   const filteredCompanies = companies.filter(c => 
//     c.name?.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   return (
//     <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
//       <div className="p-6 border-b border-gray-800 flex justify-between items-center">
//         <h2 className="text-lg font-bold text-white">Entreprises Récentes</h2>
//         <div className="relative w-64">
//           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
//           <input 
//             type="text" 
//             placeholder="Rechercher..." 
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="w-full bg-gray-800 border border-gray-700 text-white pl-10 pr-4 py-2 rounded-lg text-sm outline-none"
//           />
//         </div>
//       </div>

//       <table className="w-full">
//         <thead>
//           <tr className="bg-gray-800/50 text-gray-400 text-xs uppercase">
//             <th className="p-4 text-left">Entreprise</th>
//             <th className="p-4 text-left">Plan</th>
//             <th className="p-4 text-left">Employés</th>
//             <th className="p-4 text-left">Région</th>
//             <th className="p-4 text-left">Dernière Activité</th>
//             <th className="p-4 text-left">Statut</th>
//             <th className="p-4 text-right">MRR</th>
//             <th className="p-4 text-right">Actions</th>
//           </tr>
//         </thead>
//         <tbody className="divide-y divide-gray-800">
//           {filteredCompanies.map(company => (
//             <tr key={company.id} className="hover:bg-gray-800/30">
//               <td className="p-4">
//                 <div className="flex items-center gap-3">
//                   <div className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center text-xs font-bold text-white">
//                     {company.logo}
//                   </div>
//                   <span className="font-medium text-white">{company.name}</span>
//                 </div>
//               </td>
//               <td className="p-4">
//                 <span className="text-xs font-medium text-sky-400 bg-sky-900/10 px-2 py-1 rounded">
//                   {company.plan}
//                 </span>
//               </td>
//               <td className="p-4 text-sm text-gray-300">{company.employees}</td>
//               <td className="p-4 text-sm text-gray-300">{company.region}</td>
//               <td className="p-4 text-xs text-gray-500">{company.lastActive}</td>
//               <td className="p-4">
//                 <span className={`px-2 py-1 text-xs font-bold rounded ${
//                   company.status === 'Active' ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'
//                 }`}>
//                   {company.status}
//                 </span>
//               </td>
//               <td className="p-4 text-right font-mono text-sm text-brand-gold">
//                 {company.mrr?.toLocaleString()}
//               </td>
//               <td className="p-4 text-right">
//                 <Link href={`/admin/companies/${company.id}`} className="text-xs text-brand-red hover:underline">
//                   Gérer
//                 </Link>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }


// ============================================================================
// 🔧 COMPOSANT ActivityTable MODIFIÉ (Reçoit données via props)
// ============================================================================
// Fichier: frontend/components/admin/ActivityTable.tsx

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Filter, MoreVertical, Eye, Ban, Trash2 } from 'lucide-react';

interface ActivityTableProps {
  companies?: any[]; // ✅ AJOUT
}

export const ActivityTable: React.FC<ActivityTableProps> = ({ companies = [] }) => { // ✅ MODIFIÉ
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCompanies = companies.filter(company => 
    company.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.region?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="w-2 h-6 bg-brand-red rounded-sm"></span>
          Recent Company Activity
        </h2>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search companies..." 
              className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg pl-9 pr-4 py-2 focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="p-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 hover:text-white text-gray-400 transition-colors">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-800/50 text-gray-400 text-xs uppercase tracking-wider">
              <th className="p-4 font-semibold">Company</th>
              <th className="p-4 font-semibold">Plan</th>
              <th className="p-4 font-semibold">Employees</th>
              <th className="p-4 font-semibold">Region</th>
              <th className="p-4 font-semibold">Last Active</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold text-right">MRR</th>
              <th className="p-4 font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filteredCompanies.map((company) => (
              <tr key={company.id} className="hover:bg-gray-800/30 transition-colors group">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-gray-700 flex items-center justify-center text-xs font-bold text-white border border-gray-600">
                      {company.logo}
                    </div>
                    <span className="font-medium text-white group-hover:text-brand-red transition-colors">{company.name}</span>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full border ${
                    company.plan === 'Enterprise' ? 'bg-purple-900/20 text-purple-400 border-purple-900/50' :
                    company.plan === 'Pro' ? 'bg-sky-900/20 text-sky-400 border-sky-900/50' :
                    'bg-gray-800 text-gray-400 border-gray-700'
                  }`}>
                    {company.plan}
                  </span>
                </td>
                <td className="p-4 text-sm text-gray-300">{company.employees}</td>
                <td className="p-4 text-sm text-gray-300">{company.region}</td>
                <td className="p-4 text-sm text-gray-400">{company.lastActive}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      company.status === 'Active' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' :
                      company.status === 'Suspended' ? 'bg-red-500' :
                      'bg-orange-500'
                    }`}></span>
                    <span className="text-sm text-gray-300">{company.status}</span>
                  </div>
                </td>
                <td className="p-4 text-right font-mono text-sm text-brand-gold">
                  {company.mrr?.toLocaleString()} FCFA
                </td>
                <td className="p-4 text-center">
                   <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/admin/companies/${company.id}`} className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white" title="View Details"><Eye className="w-4 h-4"/></Link>
                      <button className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-orange-400" title="Suspend"><Ban className="w-4 h-4"/></button>
                      <button className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-red-500" title="Delete"><Trash2 className="w-4 h-4"/></button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-3 border-t border-gray-800 bg-gray-800/20 text-center">
        <Link href="/admin/companies" className="text-xs text-brand-red hover:text-red-400 font-medium transition-colors">
          View all {companies.length} companies →
        </Link>
      </div>
    </div>
  );
};
