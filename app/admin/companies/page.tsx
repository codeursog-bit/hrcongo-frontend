// 'use client';
// import React, { useState } from 'react';
// import Link from 'next/link';
// import { 
//   Search, Plus, LayoutGrid, List, Map as MapIcon, 
//   MoreVertical, Download, 
//   AlertTriangle, CreditCard, Activity
// } from 'lucide-react';
// import { COMPANIES } from '@/lib/admin/constants';
// import { AddCompanyModal } from '@/components/admin/CompanyManagement';

// export default function CompaniesPage() {
//   const [viewMode, setViewMode] = useState<'grid' | 'table' | 'map'>('grid');
//   const [searchTerm, setSearchTerm] = useState('');
//   const [showAddModal, setShowAddModal] = useState(false);
  
//   // Filter States
//   const [statusFilter, setStatusFilter] = useState('All');
//   const [planFilter, setPlanFilter] = useState('All');

//   // Derived Data
//   const filteredCompanies = COMPANIES.filter(c => {
//     const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
//                           c.region.toLowerCase().includes(searchTerm.toLowerCase());
//     const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
//     const matchesPlan = planFilter === 'All' || c.plan === planFilter;
//     return matchesSearch && matchesStatus && matchesPlan;
//   });

//   const trialCount = COMPANIES.filter(c => c.status === 'Trial').length;
//   const riskCount = COMPANIES.filter(c => c.health?.payment === 'critical' || c.health?.usage === 'critical').length;
//   const totalMrr = COMPANIES.reduce((acc, c) => acc + c.mrr, 0);

//   return (
//     <div className="space-y-6">
//       {/* Header Section */}
//       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
//         <div>
//           <h1 className="text-2xl font-bold text-white">🏢 Companies Management</h1>
//           <p className="text-gray-400 text-sm mt-1">Manage all {COMPANIES.length} client companies</p>
//         </div>
//         <button 
//           onClick={() => setShowAddModal(true)}
//           className="bg-brand-red hover:bg-red-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-lg shadow-red-900/20 transition-all"
//         >
//           <Plus className="w-5 h-5" />
//           Add New Company
//         </button>
//       </div>

//       {/* Stats Overview */}
//       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//         <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
//           <div className="text-xs text-gray-500 uppercase font-semibold">Total Companies</div>
//           <div className="text-2xl font-bold text-white mt-1">{COMPANIES.length}</div>
//         </div>
//         <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
//           <div className="text-xs text-gray-500 uppercase font-semibold">Active Trials</div>
//           <div className="text-2xl font-bold text-orange-500 mt-1 flex items-center gap-2">
//             {trialCount}
//             <span className="text-xs font-normal text-gray-400 bg-gray-800 px-2 py-0.5 rounded">2 ending soon</span>
//           </div>
//         </div>
//         <div className="bg-gray-900 border border-red-900/30 p-4 rounded-xl relative overflow-hidden">
//           <div className="absolute right-0 top-0 p-2 opacity-10"><AlertTriangle className="w-12 h-12 text-red-500" /></div>
//           <div className="text-xs text-red-400 uppercase font-semibold">Churn Risk</div>
//           <div className="text-2xl font-bold text-red-500 mt-1">{riskCount}</div>
//         </div>
//         <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
//           <div className="text-xs text-gray-500 uppercase font-semibold">Total MRR</div>
//           <div className="text-2xl font-bold text-brand-gold mt-1">{(totalMrr / 1000).toFixed(1)}k <span className="text-sm text-gray-500">FCFA</span></div>
//         </div>
//       </div>

//       {/* Filters Bar */}
//       <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl sticky top-0 z-30 shadow-xl">
//         <div className="flex flex-col lg:flex-row gap-4 justify-between">
          
//           {/* Search */}
//           <div className="relative w-full lg:w-[400px]">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
//             <input 
//               type="text" 
//               placeholder="Search by name, RCCM, email..." 
//               className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red outline-none transition-all"
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//             />
//           </div>

//           {/* Filters & Controls */}
//           <div className="flex flex-wrap items-center gap-3">
//             <select 
//               className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-gray-500"
//               value={statusFilter}
//               onChange={(e) => setStatusFilter(e.target.value)}
//             >
//               <option value="All">Status: All</option>
//               <option value="Active">Active</option>
//               <option value="Trial">Trial</option>
//               <option value="Suspended">Suspended</option>
//             </select>

//             <select 
//               className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-gray-500"
//               value={planFilter}
//               onChange={(e) => setPlanFilter(e.target.value)}
//             >
//               <option value="All">Plan: All</option>
//               <option value="Starter">Starter</option>
//               <option value="Pro">Pro</option>
//               <option value="Enterprise">Enterprise</option>
//             </select>

//             <div className="w-px h-8 bg-gray-700 mx-2 hidden md:block"></div>

//             <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
//               <button 
//                 onClick={() => setViewMode('grid')}
//                 className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}
//               >
//                 <LayoutGrid className="w-4 h-4" />
//               </button>
//               <button 
//                 onClick={() => setViewMode('table')}
//                 className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}
//               >
//                 <List className="w-4 h-4" />
//               </button>
//               <button 
//                 onClick={() => setViewMode('map')}
//                 className={`p-1.5 rounded ${viewMode === 'map' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}
//               >
//                 <MapIcon className="w-4 h-4" />
//               </button>
//             </div>

//             <button className="flex items-center gap-2 text-gray-400 hover:text-white text-sm font-medium px-3 py-2 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors">
//               <Download className="w-4 h-4" />
//               Export
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Content Area */}
//       {viewMode === 'grid' && (
//         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
//           {filteredCompanies.map(company => (
//             <div key={company.id} className="group bg-gray-900 border border-gray-800 hover:border-brand-red/50 rounded-xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-red/5 relative">
//               {/* Card Header */}
//               <div className="flex justify-between items-start mb-4">
//                 <div className="flex gap-4">
//                   <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 flex items-center justify-center text-xl font-bold text-gray-300 shadow-inner">
//                     {company.logo}
//                   </div>
//                   <div>
//                     <h3 className="font-bold text-white text-lg">{company.name}</h3>
//                     <p className="text-gray-500 text-xs mt-1">{company.region}</p>
//                     <p className="text-gray-600 text-[10px] mt-0.5 font-mono">{company.rccm || 'No RCCM'}</p>
//                   </div>
//                 </div>
//                 <div className="flex flex-col items-end gap-2">
//                   <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full border ${
//                     company.status === 'Active' ? 'bg-green-900/20 text-green-400 border-green-900/50' :
//                     company.status === 'Trial' ? 'bg-orange-900/20 text-orange-400 border-orange-900/50' :
//                     'bg-red-900/20 text-red-400 border-red-900/50'
//                   }`}>
//                     {company.status}
//                   </span>
//                   <button className="text-gray-500 hover:text-white"><MoreVertical className="w-4 h-4" /></button>
//                 </div>
//               </div>

//               {/* Metrics Grid */}
//               <div className="grid grid-cols-2 gap-y-4 gap-x-2 py-4 border-y border-gray-800 mb-4">
//                 <div>
//                   <div className="text-[10px] text-gray-500 uppercase">Plan</div>
//                   <div className="text-sm font-semibold text-sky-400">{company.plan}</div>
//                 </div>
//                 <div>
//                   <div className="text-[10px] text-gray-500 uppercase">Employees</div>
//                   <div className="text-sm font-semibold text-white">{company.employees}</div>
//                 </div>
//                 <div>
//                   <div className="text-[10px] text-gray-500 uppercase">MRR</div>
//                   <div className="text-sm font-semibold text-brand-gold">{company.mrr.toLocaleString()}</div>
//                 </div>
//                 <div>
//                   <div className="text-[10px] text-gray-500 uppercase">Joined</div>
//                   <div className="text-sm font-semibold text-gray-400">{company.joinedDate || '2023'}</div>
//                 </div>
//               </div>

//               {/* Health Indicators */}
//               <div className="flex justify-between items-center mb-6 px-1">
//                 <div className="flex gap-4">
//                   <div className="flex flex-col items-center gap-1 group/tooltip relative">
//                     <CreditCard className={`w-4 h-4 ${company.health?.payment === 'good' ? 'text-green-500' : 'text-red-500'}`} />
//                     <div className="h-1 w-8 rounded-full bg-gray-800 overflow-hidden">
//                       <div className={`h-full w-full ${company.health?.payment === 'good' ? 'bg-green-500' : 'bg-red-500'}`}></div>
//                     </div>
//                   </div>
//                   <div className="flex flex-col items-center gap-1 group/tooltip relative">
//                     <Activity className={`w-4 h-4 ${company.health?.usage === 'good' ? 'text-green-500' : 'text-orange-500'}`} />
//                     <div className="h-1 w-8 rounded-full bg-gray-800 overflow-hidden">
//                       <div className={`h-full w-full ${company.health?.usage === 'good' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
//                     </div>
//                   </div>
//                 </div>
//                 <div className="text-[10px] text-gray-500">Last active: {company.lastActive}</div>
//               </div>

//               {/* Actions */}
//               <div className="grid grid-cols-2 gap-3">
//                 <Link 
//                   href={`/companies/${company.id}`}
//                   className="col-span-2 bg-gray-800 hover:bg-gray-700 text-center text-white text-sm font-medium py-2 rounded-lg transition-colors border border-gray-700"
//                 >
//                   View Dashboard
//                 </Link>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       {viewMode === 'table' && (
//         <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
//           <table className="w-full text-left border-collapse">
//             <thead>
//               <tr className="bg-gray-800/50 text-gray-400 text-xs uppercase tracking-wider">
//                 <th className="p-4">Company</th>
//                 <th className="p-4">RCCM</th>
//                 <th className="p-4">Plan</th>
//                 <th className="p-4">Contact</th>
//                 <th className="p-4 text-right">MRR</th>
//                 <th className="p-4 text-center">Health</th>
//                 <th className="p-4 text-right">Actions</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-800">
//               {filteredCompanies.map(company => (
//                 <tr key={company.id} className="hover:bg-gray-800/30">
//                   <td className="p-4">
//                     <div className="flex items-center gap-3">
//                       <div className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-300 border border-gray-700">
//                         {company.logo}
//                       </div>
//                       <div>
//                         <div className="font-medium text-white">{company.name}</div>
//                         <div className="text-xs text-gray-500">{company.region}</div>
//                       </div>
//                     </div>
//                   </td>
//                   <td className="p-4 text-xs font-mono text-gray-400">{company.rccm}</td>
//                   <td className="p-4">
//                     <span className="text-xs font-medium text-sky-400 bg-sky-900/10 px-2 py-1 rounded border border-sky-900/30">
//                       {company.plan}
//                     </span>
//                   </td>
//                   <td className="p-4">
//                     <div className="text-sm text-gray-300">{company.contactPerson}</div>
//                     <div className="text-xs text-gray-500">{company.email}</div>
//                   </td>
//                   <td className="p-4 text-right font-mono text-sm text-brand-gold">{company.mrr.toLocaleString()}</td>
//                   <td className="p-4">
//                     <div className="flex justify-center gap-2">
//                       <div className={`w-2 h-2 rounded-full ${company.health?.payment === 'good' ? 'bg-green-500' : 'bg-red-500'}`}></div>
//                       <div className={`w-2 h-2 rounded-full ${company.health?.usage === 'good' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
//                     </div>
//                   </td>
//                   <td className="p-4 text-right">
//                     <Link href={`/companies/${company.id}`} className="text-xs text-gray-400 hover:text-white underline">Manage</Link>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}

//       {/* Map View Placeholder */}
//       {viewMode === 'map' && (
//         <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 h-[600px] relative flex items-center justify-center overflow-hidden">
//           <div className="text-center">
//             <MapIcon className="w-24 h-24 text-gray-800 mx-auto mb-4" />
//             <h3 className="text-xl font-bold text-gray-500">Geographic Distribution</h3>
//             <p className="text-gray-600 mt-2">152 Companies across Congo</p>
//             <p className="text-xs text-gray-700 mt-12 italic">Visual representation only</p>
//           </div>
//         </div>
//       )}

//       {/* Add Company Modal - Imported from reusable component */}
//       <AddCompanyModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
//     </div>
//   );
// }

// ============================================================================
// 🏢 PAGE COMPANIES (MODIFIÉE - Connectée à l'API)
// ============================================================================
// Fichier: frontend/app/admin/companies/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Search, Filter, MoreVertical, Eye, Ban, Trash2, Plus, 
  LayoutGrid, List, MapIcon, Download, AlertTriangle, Loader2
} from 'lucide-react';
import { adminService } from '@/lib/services/adminService'; // ✅ AJOUT
import { AddCompanyModal } from '@/components/admin/CompanyManagement';

export default function CompaniesPage() {
  // ✅ AJOUT : State
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'map'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [planFilter, setPlanFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);

  // ✅ AJOUT : Charger les entreprises
  useEffect(() => {
    loadCompanies();
  }, [statusFilter, planFilter]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (statusFilter !== 'All') filters.status = statusFilter;
      if (planFilter !== 'All') filters.plan = planFilter;
      
     const data = await adminService.getAllCompanies(filters);
     setCompanies(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erreur chargement:', err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ AJOUT : Filtrage côté client
  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalMrr = companies.reduce((sum, c) => sum + (c.mrr || 0), 0);
  const trialCount = companies.filter(c => c.status === 'Trial').length;
  const riskCount = companies.filter(c => 
    c.health?.payment === 'critical' || c.health?.usage === 'critical'
  ).length;

  // ✅ AJOUT : Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 h-12 text-brand-red animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">🏢 Gestion des Entreprises</h1>
          <p className="text-gray-400 text-sm mt-1">Gérer les {companies.length} entreprises clientes</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-brand-red hover:bg-red-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-lg shadow-red-900/20 transition-all"
        >
          <Plus className="w-5 h-5" />
          Nouvelle Entreprise
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
          <div className="text-xs text-gray-500 uppercase font-semibold">Total Entreprises</div>
          <div className="text-2xl font-bold text-white mt-1">{companies.length}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
          <div className="text-xs text-gray-500 uppercase font-semibold">Essais Actifs</div>
          <div className="text-2xl font-bold text-orange-500 mt-1 flex items-center gap-2">
            {trialCount}
            <span className="text-xs font-normal text-gray-400 bg-gray-800 px-2 py-0.5 rounded">2 finissent bientôt</span>
          </div>
        </div>
        <div className="bg-gray-900 border border-red-900/30 p-4 rounded-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 p-2 opacity-10"><AlertTriangle className="w-12 h-12 text-red-500" /></div>
          <div className="text-xs text-red-400 uppercase font-semibold">Risque Churn</div>
          <div className="text-2xl font-bold text-red-500 mt-1">{riskCount}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
          <div className="text-xs text-gray-500 uppercase font-semibold">MRR Total</div>
          <div className="text-2xl font-bold text-brand-gold mt-1">{(totalMrr / 1000).toFixed(1)}k <span className="text-sm text-gray-500">FCFA</span></div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl sticky top-0 z-30 shadow-xl">
        <div className="flex flex-col lg:flex-row gap-4 justify-between">
          
          {/* Search */}
          <div className="relative w-full lg:w-[400px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Rechercher par nom, RCCM, email..." 
              className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters & Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <select 
              className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-gray-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">Statut: Tous</option>
              <option value="Active">Actif</option>
              <option value="Trial">Essai</option>
              <option value="Suspended">Suspendu</option>
            </select>

            <select 
              className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-gray-500"
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
            >
              <option value="All">Plan: Tous</option>
              <option value="FREE">Gratuit</option>
              <option value="BASIC">Basic</option>
              <option value="PRO">Pro</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>

            <div className="w-px h-8 bg-gray-700 mx-2 hidden md:block"></div>

            <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('map')}
                className={`p-1.5 rounded ${viewMode === 'map' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}
              >
                <MapIcon className="w-4 h-4" />
              </button>
            </div>

            <button className="flex items-center gap-2 text-gray-400 hover:text-white text-sm font-medium px-3 py-2 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors">
              <Download className="w-4 h-4" />
              Exporter
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCompanies.map(company => (
            <div key={company.id} className="group bg-gray-900 border border-gray-800 hover:border-brand-red/50 rounded-xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-red/5 relative">
              {/* Card Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 flex items-center justify-center text-xl font-bold text-gray-300 shadow-inner">
                    {company.logo}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">{company.name}</h3>
                    <p className="text-gray-500 text-xs mt-1">{company.region}</p>
                    <p className="text-gray-600 text-[10px] mt-0.5 font-mono">{company.rccm || 'No RCCM'}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full border ${
                    company.status === 'Active' ? 'bg-green-900/20 text-green-400 border-green-900/50' :
                    company.status === 'Trial' ? 'bg-orange-900/20 text-orange-400 border-orange-900/50' :
                    'bg-red-900/20 text-red-400 border-red-900/50'
                  }`}>
                    {company.status}
                  </span>
                  <button className="text-gray-500 hover:text-white"><MoreVertical className="w-4 h-4" /></button>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-y-4 gap-x-2 py-4 border-y border-gray-800 mb-4">
                <div>
                  <div className="text-[10px] text-gray-500 uppercase">Plan</div>
                  <div className="text-sm font-semibold text-sky-400">{company.plan}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase">Employés</div>
                  <div className="text-sm font-semibold text-white">{company.employees}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase">MRR</div>
                  <div className="text-sm font-semibold text-brand-gold">{company.mrr.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase">Rejoint</div>
                  <div className="text-sm font-semibold text-gray-400">
                    {new Date(company.joinedDate).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* Health Indicators */}
              <div className="flex justify-between items-center mb-6 px-1">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-4 h-4 ${company.health?.payment === 'good' ? 'text-green-500' : 'text-red-500'}`}>💳</div>
                    <div className="h-1 w-8 rounded-full bg-gray-800 overflow-hidden">
                      <div className={`h-full w-full ${company.health?.payment === 'good' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-4 h-4 ${company.health?.usage === 'good' ? 'text-green-500' : 'text-orange-500'}`}>📊</div>
                    <div className="h-1 w-8 rounded-full bg-gray-800 overflow-hidden">
                      <div className={`h-full w-full ${company.health?.usage === 'good' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-gray-500">Dernière activité: {company.lastActive}</div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <Link 
                  href={`/admin/companies/${company.id}`}
                  className="col-span-2 bg-gray-800 hover:bg-gray-700 text-center text-white text-sm font-medium py-2 rounded-lg transition-colors border border-gray-700"
                >
                  Voir Détails
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'table' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-800/50 text-gray-400 text-xs uppercase tracking-wider">
                <th className="p-4">Entreprise</th>
                <th className="p-4">RCCM</th>
                <th className="p-4">Plan</th>
                <th className="p-4">Contact</th>
                <th className="p-4 text-right">MRR</th>
                <th className="p-4 text-center">Santé</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredCompanies.map(company => (
                <tr key={company.id} className="hover:bg-gray-800/30">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-300 border border-gray-700">
                        {company.logo}
                      </div>
                      <div>
                        <div className="font-medium text-white">{company.name}</div>
                        <div className="text-xs text-gray-500">{company.region}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-xs font-mono text-gray-400">{company.rccm}</td>
                  <td className="p-4">
                    <span className="text-xs font-medium text-sky-400 bg-sky-900/10 px-2 py-1 rounded border border-sky-900/30">
                      {company.plan}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-gray-300">{company.contactPerson}</div>
                    <div className="text-xs text-gray-500">{company.email}</div>
                  </td>
                  <td className="p-4 text-right font-mono text-sm text-brand-gold">{company.mrr.toLocaleString()}</td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${company.health?.payment === 'good' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <div className={`w-2 h-2 rounded-full ${company.health?.usage === 'good' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <Link href={`/admin/companies/${company.id}`} className="text-xs text-gray-400 hover:text-white underline">Gérer</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Map View Placeholder */}
      {viewMode === 'map' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 h-[600px] relative flex items-center justify-center overflow-hidden">
          <div className="text-center">
            <MapIcon className="w-24 h-24 text-gray-800 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-500">Distribution Géographique</h3>
            <p className="text-gray-600 mt-2">{companies.length} Entreprises à travers le Congo</p>
            <p className="text-xs text-gray-700 mt-12 italic">Représentation visuelle uniquement</p>
          </div>
        </div>
      )}

      <AddCompanyModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
}
