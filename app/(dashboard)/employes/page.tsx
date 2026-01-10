
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, Filter, Plus, FileDown, LayoutGrid, List, 
  MoreHorizontal, Eye, Pencil, Trash2, Mail, Phone,
  ChevronLeft, ChevronRight, Briefcase, MapPin, 
  BadgeCheck, Clock, Ban, DollarSign, X, Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlobalLoader } from '@/components/ui/GlobalLoader';
import { api } from '@/services/api';
import { FancySelect } from '@/components/ui/FancySelect';

// --- Types ---

interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  department: { name: string };
  status: string;
  contractType: string;
  baseSalary: number;
  photoUrl?: string;
  address: string;
  hireDate: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// --- Components ---

const StatusBadge = ({ status }: { status: string }) => {
  const isSuspended = status === 'SUSPENDED';
  const color = isSuspended 
    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
  
  const label = isSuspended ? 'Suspendu' : 'Actif';

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${color}`}>
      <BadgeCheck size={12} />
      {label}
    </span>
  );
};

const ContractBadge = ({ type }: { type: string }) => {
  const colors: any = {
    CDI: 'border-sky-200 text-sky-700 dark:border-sky-800 dark:text-sky-400',
    CDD: 'border-purple-200 text-purple-700 dark:border-purple-800 dark:text-purple-400',
    STAGE: 'border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-400',
    CONSULTANT: 'border-gray-200 text-gray-700 dark:border-gray-700 dark:text-gray-400',
  };
  return (
    <span className={`px-2 py-0.5 rounded border text-[10px] uppercase font-bold tracking-wide ${colors[type] || colors.CDI}`}>
      {type}
    </span>
  );
};

export default function EmployeeListPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isLoading, setIsLoading] = useState(true);
  
  // ✅ Données de la page courante (vient du backend avec pagination)
  const [currentPageEmployees, setCurrentPageEmployees] = useState<Employee[]>([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  const [departments, setDepartments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    department: 'Tous',
    contract: 'Tous'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // ✅ CHARGEMENT AVEC PAGINATION BACKEND
  useEffect(() => {
    const fetchEmployees = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: itemsPerPage.toString()
        });

        const [empResponse, deptData] = await Promise.all([
          api.get<PaginatedResponse<Employee>>(`/employees/paginated?${params.toString()}`),
          api.get<any[]>('/departments')
        ]);

        setCurrentPageEmployees(empResponse.data || []);
        setTotalEmployees(empResponse.total || 0);
        setTotalPages(empResponse.totalPages || 0);
        setDepartments(deptData || []);
      } catch (error) {
        console.error("Erreur chargement employés", error);
        setCurrentPageEmployees([]);
        setTotalEmployees(0);
        setTotalPages(0);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEmployees();
  }, [currentPage, itemsPerPage]); // ✅ Recharge uniquement quand on change de page

  // ✅ FILTRAGE INSTANTANÉ côté frontend (sur la page courante)
  const filteredEmployees = useMemo(() => {
    let result = [...currentPageEmployees];

    // 1️⃣ Filtre par RECHERCHE
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(emp => 
        emp.firstName.toLowerCase().includes(query) ||
        emp.lastName.toLowerCase().includes(query) ||
        emp.employeeNumber.toLowerCase().includes(query) ||
        emp.email.toLowerCase().includes(query) ||
        emp.position.toLowerCase().includes(query)
      );
    }

    // 2️⃣ Filtre par DÉPARTEMENT
    if (filters.department !== 'Tous') {
      result = result.filter(emp => emp.department?.name === filters.department);
    }

    // 3️⃣ Filtre par TYPE DE CONTRAT
    if (filters.contract !== 'Tous') {
      result = result.filter(emp => emp.contractType === filters.contract);
    }

    return result;
  }, [currentPageEmployees, searchQuery, filters]);

  const resetFilters = () => {
    setFilters({ department: 'Tous', contract: 'Tous' });
    setSearchQuery('');
  };

  const hasActiveFilters = filters.department !== 'Tous' || filters.contract !== 'Tous' || searchQuery !== '';

  const navigateToDetail = (id: string) => {
    router.push(`/employes/${id}`);
  };

  const navigateToEdit = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    router.push(`/employes/${id}/edit`);
  };

  if (isLoading) {
    return <GlobalLoader />;
  }

  return (
    <div className="space-y-6 min-h-screen pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Employés</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
            {totalEmployees} collaborateur{totalEmployees > 1 ? 's' : ''} actif{totalEmployees > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href="/employes/nouveau"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all flex items-center gap-2"
          >
            <Plus size={20} />
            Ajouter Employé
          </Link>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-all">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          
          <div className="relative flex-1 w-full max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher par nom, poste, matricule..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-3 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 no-scrollbar">
            <div className="w-48">
                <FancySelect
                    value={filters.department}
                    onChange={(v) => setFilters(prev => ({ ...prev, department: v }))}
                    icon={Building2}
                    placeholder="Département"
                    options={[
                        { value: 'Tous', label: 'Tous' },
                        ...departments.map(d => ({ value: d.name, label: d.name }))
                    ]}
                    className="min-w-[180px]"
                />
            </div>

            <div className="w-40">
                <FancySelect
                    value={filters.contract}
                    onChange={(v) => setFilters(prev => ({ ...prev, contract: v }))}
                    icon={Briefcase}
                    placeholder="Contrat"
                    options={[
                        { value: 'Tous', label: 'Tous' },
                        { value: 'CDI', label: 'CDI' },
                        { value: 'CDD', label: 'CDD' },
                        { value: 'STAGE', label: 'Stage' }
                    ]}
                    className="min-w-[160px]"
                />
            </div>

            {hasActiveFilters && (
              <button onClick={resetFilters} className="p-3 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 transition-colors" title="Réinitialiser">
                <X size={18} />
              </button>
            )}
            
            <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-2 hidden lg:block" />

            <div className="flex bg-gray-200 dark:bg-gray-700 p-1 rounded-xl">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-800 text-sky-500 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
              >
                <LayoutGrid size={18} />
              </button>
              <button 
                onClick={() => setViewMode('table')}
                className={`p-2.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-gray-800 text-sky-500 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT AREA */}
      <AnimatePresence mode="wait">
        {filteredEmployees.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-48 h-48 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
               <Search size={64} className="text-gray-300 dark:text-gray-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Aucun employé trouvé</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8">
              {hasActiveFilters 
                ? "Aucun résultat ne correspond à vos critères sur cette page."
                : "Aucun employé sur cette page."}
            </p>
            {hasActiveFilters && (
              <button onClick={resetFilters} className="text-sky-500 font-bold hover:underline">
                Effacer les filtres
              </button>
            )}
          </motion.div>
        ) : viewMode === 'grid' ? (
          /* GRID VIEW */
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredEmployees.map((emp) => (
              <div 
                key={emp.id}
                onClick={() => navigateToDetail(emp.id)}
                className="group relative bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-10">
                  <button 
                    onClick={(e) => navigateToEdit(e, emp.id)}
                    className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:text-emerald-500 transition-colors shadow-sm"
                    title="Modifier"
                  >
                    <Pencil size={16}/>
                  </button>
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    <img 
                      src={emp.photoUrl || `https://ui-avatars.com/api/?name=${emp.firstName}+${emp.lastName}&background=random`} 
                      alt={emp.firstName} 
                      className="w-20 h-20 rounded-full object-cover border-4 border-gray-50 dark:border-gray-700 shadow-md" 
                    />
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{emp.firstName} {emp.lastName}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{emp.position}</p>
                  
                  <div className="flex gap-2 mb-4">
                    <StatusBadge status={emp.status || 'ACTIVE'} />
                    <ContractBadge type={emp.contractType} />
                  </div>

                  <div className="w-full pt-4 border-t border-gray-50 dark:border-gray-700 grid grid-cols-2 gap-2 text-left">
                    <div>
                      <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Dept.</p>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{emp.department?.name || 'N/A'}</p>
                    </div>
                    <div>
                       <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Matricule</p>
                       <p className="text-xs font-mono text-gray-500">{emp.employeeNumber}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          /* TABLE VIEW */
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold tracking-wider">
                    <th className="px-6 py-4">Employé</th>
                    <th className="px-6 py-4">Matricule</th>
                    <th className="px-6 py-4">Poste & Dept</th>
                    <th className="px-6 py-4">Contrat</th>
                    <th className="px-6 py-4">Salaire</th>
                    <th className="px-6 py-4">Statut</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredEmployees.map((emp) => (
                    <tr 
                      key={emp.id} 
                      onClick={() => navigateToDetail(emp.id)}
                      className="group hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={emp.photoUrl || `https://ui-avatars.com/api/?name=${emp.firstName}+${emp.lastName}&background=random`} 
                            className="w-10 h-10 rounded-full object-cover" 
                            alt="" 
                          />
                          <div>
                            <div className="font-bold text-gray-900 dark:text-white">{emp.firstName} {emp.lastName}</div>
                            <div className="text-xs text-gray-500">{emp.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-sm text-gray-500">{emp.employeeNumber}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{emp.position}</div>
                        <div className="text-xs text-gray-500">{emp.department?.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <ContractBadge type={emp.contractType} />
                      </td>
                      <td className="px-6 py-4 group/salary relative">
                        <div className="flex items-center gap-1 cursor-help">
                           <span className="text-gray-900 dark:text-white font-mono group-hover/salary:hidden transition-all">• • • • • •</span>
                           <span className="hidden group-hover/salary:block font-bold text-emerald-600 dark:text-emerald-400 transition-all">
                              {emp.baseSalary.toLocaleString('fr-FR')} <span className="text-xs">FCFA</span>
                           </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={emp.status || 'ACTIVE'} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => navigateToEdit(e, emp.id)}
                            className="p-2 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Pencil size={18}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PAGINATION */}
      {totalEmployees > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Affichage de <span className="font-bold text-gray-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> à <span className="font-bold text-gray-900 dark:text-white">{Math.min(currentPage * itemsPerPage, totalEmployees)}</span> sur <span className="font-bold text-gray-900 dark:text-white">{totalEmployees}</span> employé{totalEmployees > 1 ? 's' : ''}
          </p>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            
            <span className="px-4 text-sm font-bold text-gray-700 dark:text-gray-300">
               Page {currentPage} / {totalPages || 1}
            </span>

            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}