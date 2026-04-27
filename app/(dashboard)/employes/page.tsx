'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  Search, Plus, LayoutGrid, List,
  Eye, Pencil, Trash2,
  ChevronLeft, ChevronRight, Briefcase,
  BadgeCheck, Building2, X, Lock,FileText,
  Loader2, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlobalLoader } from '@/components/ui/GlobalLoader';
import { api } from '@/services/api';
import { FancySelect } from '@/components/ui/FancySelect';
import { useBasePath } from '@/hooks/useBasePath';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  department: { id: string; name: string };
  status: string;
  contractType: string;
  baseSalary: number | null;
  photoUrl?: string;
  hireDate: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function getRoleFromStorage(): string {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return 'EMPLOYEE';
    const u = JSON.parse(raw);
    return u?.role || 'EMPLOYEE';
  } catch {
    return 'EMPLOYEE';
  }
}

// ─── Badges ───────────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => {
  const isActive = status === 'ACTIVE';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
      isActive
        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    }`}>
      <BadgeCheck size={12} />
      {isActive ? 'Actif' : 'Suspendu'}
    </span>
  );
};

const ContractBadge = ({ type }: { type: string }) => {
  const colors: Record<string, string> = {
    CDI:        'border-sky-200 text-sky-700 dark:border-sky-800 dark:text-sky-400',
    CDD:        'border-purple-200 text-purple-700 dark:border-purple-800 dark:text-purple-400',
    STAGE:      'border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-400',
    CONSULTANT: 'border-gray-200 text-gray-700 dark:border-gray-700 dark:text-gray-400',
  };
  return (
    <span className={`px-2 py-0.5 rounded border text-[10px] uppercase font-bold tracking-wide ${colors[type] || colors.CDI}`}>
      {type}
    </span>
  );
};

// ─── Modal de suppression custom ─────────────────────────────────────────────

interface DeleteModalProps {
  employee: Employee | null;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmModal = ({ employee, isDeleting, onConfirm, onCancel }: DeleteModalProps) => {
  if (!employee) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !isDeleting && onCancel()}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="relative bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-2xl max-w-md w-full border-2 border-red-200 dark:border-red-800 z-10 overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-44 h-44 bg-red-50 dark:bg-red-900/10 rounded-bl-full -mr-12 -mt-12 pointer-events-none" />

        {!isDeleting && (
          <button onClick={onCancel} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors z-10">
            <X size={18} />
          </button>
        )}

        <div className="flex justify-center mb-5">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <div className="w-14 h-14 bg-red-200 dark:bg-red-800/40 rounded-full flex items-center justify-center">
              <Trash2 size={26} className="text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-1">Désactiver cet employé ?</h2>
        <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-1">Vous êtes sur le point de désactiver</p>
        <p className="text-center font-extrabold text-gray-900 dark:text-white text-lg mb-5">
          {employee.firstName} {employee.lastName}
        </p>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-2xl p-4 mb-6">
          <p className="text-red-700 dark:text-red-300 text-sm font-bold flex items-center gap-2 mb-3">
            <AlertCircle size={16} className="shrink-0" />
            Cette action est irréversible
          </p>
          <ul className="space-y-2">
            {[
              { text: <>Le statut passera à <strong>TERMINÉ</strong></>, red: true },
              { text: <>Le compte utilisateur associé sera <strong>définitivement supprimé</strong></>, red: true },
              { text: <>L'adresse email sera à nouveau <strong>disponible</strong></>, red: true },
              { text: <>L'historique de paie et congés sera <strong>conservé</strong></>, red: false },
            ].map((item, i) => (
              <li key={i} className={`flex items-start gap-2 text-xs ${item.red ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${item.red ? 'bg-red-400' : 'bg-emerald-400'}`} />
                {item.text}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-bold transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-red-500/25"
          >
            {isDeleting
              ? <><Loader2 size={16} className="animate-spin" /> Suppression...</>
              : <><Trash2 size={16} /> Supprimer</>
            }
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Page principale ──────────────────────────────────────────────────────────

export default function EmployeeListPage() {
  const { bp } = useBasePath();
  const router = useRouter();
  const [viewMode, setViewMode]             = useState<'grid' | 'table'>('grid');
  const [isLoading, setIsLoading]           = useState(true);
  const [employees, setEmployees]           = useState<Employee[]>([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [totalPages, setTotalPages]         = useState(0);
  const [departments, setDepartments]       = useState<any[]>([]);
  const [searchQuery, setSearchQuery]       = useState('');
  const [filters, setFilters]               = useState({ department: 'Tous', contract: 'Tous' });
  const [currentPage, setCurrentPage]       = useState(1);
  const [userRole, setUserRole]             = useState('EMPLOYEE');
  const itemsPerPage = 12;

  // 🆕 États modal
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [isDeleting, setIsDeleting]             = useState(false);

  // ── companyId depuis l'URL (contexte cabinet/PME) ─────────────────────────
  const params = useParams();
  const pmeCompanyId = (params?.companyId as string) || '';
  // Suffix à ajouter au lien "Ajouter" pour que le formulaire sache quel companyId utiliser
  const addEmployeeSuffix = pmeCompanyId ? `?companyId=${pmeCompanyId}` : '';

  const canCreate    = ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'CABINET_ADMIN', 'CABINET_GESTIONNAIRE'].includes(userRole);
  const canEdit      = ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'].includes(userRole);
  const canDelete    = ['SUPER_ADMIN', 'ADMIN'].includes(userRole);
  const canSeeSalary = ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'].includes(userRole);
  const isManager    = userRole === 'MANAGER';

  useEffect(() => { setUserRole(getRoleFromStorage()); }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: currentPage.toString(), limit: itemsPerPage.toString() });
      const [empResponse, deptData] = await Promise.all([
        api.get<PaginatedResponse<Employee>>(`/employees?${params}`),
        api.get<any[]>('/departments'),
      ]);
      setEmployees(empResponse.data || []);
      setTotalEmployees(empResponse.total || 0);
      setTotalPages(empResponse.totalPages || 0);
      setDepartments(deptData || []);
    } catch (error) {
      console.error('Erreur chargement employés', error);
      setEmployees([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredEmployees = useMemo(() => {
    let result = [...employees];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(emp =>
        emp.firstName.toLowerCase().includes(q) ||
        emp.lastName.toLowerCase().includes(q) ||
        emp.employeeNumber?.toLowerCase().includes(q) ||
        emp.email.toLowerCase().includes(q) ||
        emp.position.toLowerCase().includes(q),
      );
    }
    if (filters.department !== 'Tous') result = result.filter(emp => emp.department?.name === filters.department);
    if (filters.contract !== 'Tous')   result = result.filter(emp => emp.contractType === filters.contract);
    return result;
  }, [employees, searchQuery, filters]);

  const hasActiveFilters = filters.department !== 'Tous' || filters.contract !== 'Tous' || searchQuery !== '';
  const resetFilters = () => { setFilters({ department: 'Tous', contract: 'Tous' }); setSearchQuery(''); };

  // 🆕 Ouvre la modal au lieu d'un confirm() natif
  const requestDelete = (e: React.MouseEvent, emp: Employee) => {
    e.stopPropagation();
    setEmployeeToDelete(emp);
  };

  // 🆕 Suppression effective + event pour sync dashboard
  const confirmDelete = async () => {
    if (!employeeToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/employees/${employeeToDelete.id}`);

      // Mise à jour locale immédiate
      setEmployees(prev => prev.filter(emp => emp.id !== employeeToDelete.id));
      setTotalEmployees(prev => Math.max(0, prev - 1));

      // 🆕 Event global → DashboardContent écoute et décrémente son compteur
      window.dispatchEvent(new CustomEvent('employee:deleted', {
        detail: {
          employeeId:   employeeToDelete.id,
          departmentId: employeeToDelete.department?.id,
        }
      }));

      setEmployeeToDelete(null);
    } catch (err: any) {
      // 🆕 Event toast custom → pas d'alert() natif
      window.dispatchEvent(new CustomEvent('toast:error', {
        detail: { message: err?.message || 'Erreur lors de la désactivation' }
      }));
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) return <GlobalLoader />;

  return (
    <div className="space-y-6 min-h-screen pb-20">

      {/* 🆕 Modal suppression custom — remplace confirm() */}
      <AnimatePresence>
        {employeeToDelete && (
          <DeleteConfirmModal
            employee={employeeToDelete}
            isDeleting={isDeleting}
            onConfirm={confirmDelete}
            onCancel={() => !isDeleting && setEmployeeToDelete(null)}
          />
        )}
      </AnimatePresence>

      {/* ── HEADER ── */}
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
  <div>
    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Employés</h1>
    <p className="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      {totalEmployees} collaborateur{totalEmployees > 1 ? 's' : ''} actif{totalEmployees > 1 ? 's' : ''}
      {isManager && (
        <span className="ml-2 px-2 py-0.5 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 rounded-full text-xs font-bold">
          Votre département uniquement
        </span>
      )}
    </p>
  </div>

  <div className="flex items-center gap-3">
    {/* --- ✅ BOUTON GÉRER LES CONTRATS (Visible uniquement pour RH/Admin) --- */}
    {canCreate && (
      <Link 
        href={bp("/contrats")} 
        className="px-5 py-2.5 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center gap-2"
      >
        <FileText size={20} className="text-sky-500" /> 
        Gérer les contrats
      </Link>
    )}

    {/* --- BOUTON AJOUTER --- */}
    {canCreate ? (
      <Link 
        href={`/employes/nouveau${addEmployeeSuffix}`}
        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all flex items-center gap-2"
      >
        <Plus size={20} /> Ajouter un employé
      </Link>
    ) : (
      <div 
        className="px-5 py-2.5 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 font-bold flex items-center gap-2 cursor-not-allowed select-none" 
        title="Seuls les RH et administrateurs peuvent gérer les employés"
      >
        <Lock size={16} /> Ajouter un employé
      </div>
    )}
  </div>
</div>

      {/* ── BARRE DE FILTRES ── */}
      <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher par nom, poste, matricule..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-3 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0">
            {!isManager && (
              <div className="w-48">
                <FancySelect value={filters.department} onChange={v => setFilters(prev => ({ ...prev, department: v }))} icon={Building2} placeholder="Département"
                  options={[{ value: 'Tous', label: 'Tous' }, ...departments.map(d => ({ value: d.name, label: d.name }))]}
                />
              </div>
            )}
            <div className="w-40">
              <FancySelect value={filters.contract} onChange={v => setFilters(prev => ({ ...prev, contract: v }))} icon={Briefcase} placeholder="Contrat"
                options={[
                  { value: 'Tous', label: 'Tous' }, { value: 'CDI', label: 'CDI' },
                  { value: 'CDD', label: 'CDD' }, { value: 'STAGE', label: 'Stage' },
                  { value: 'CONSULTANT', label: 'Consultant' },
                ]}
              />
            </div>
            {hasActiveFilters && (
              <button onClick={resetFilters} className="p-3 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 transition-colors" title="Réinitialiser">
                <X size={18} />
              </button>
            )}
            <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-2 hidden lg:block" />
            <div className="flex bg-gray-200 dark:bg-gray-700 p-1 rounded-xl">
              <button onClick={() => setViewMode('grid')} className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-800 text-sky-500 shadow-sm' : 'text-gray-500'}`}><LayoutGrid size={18} /></button>
              <button onClick={() => setViewMode('table')} className={`p-2.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-gray-800 text-sky-500 shadow-sm' : 'text-gray-500'}`}><List size={18} /></button>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENU ── */}
      <AnimatePresence mode="wait">
        {filteredEmployees.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-32 h-32 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
              <Search size={48} className="text-gray-300 dark:text-gray-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Aucun employé trouvé</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
              {hasActiveFilters ? 'Aucun résultat pour ces filtres.' : 'Aucun employé dans ce périmètre.'}
            </p>
            {hasActiveFilters && <button onClick={resetFilters} className="text-sky-500 font-bold hover:underline">Effacer les filtres</button>}
          </motion.div>

        ) : viewMode === 'grid' ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredEmployees.map(emp => (
              <div key={emp.id} onClick={() => router.push(`/employes/${emp.id}`)}
                className="group relative bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
              >
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1.5 z-10">
                  <button onClick={e => { e.stopPropagation(); router.push(`/employes/${emp.id}`); }} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:text-sky-500 transition-colors" title="Voir"><Eye size={15} /></button>
                  {canEdit && <button onClick={e => { e.stopPropagation(); router.push(`/employes/${emp.id}/edit`); }} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:text-emerald-500 transition-colors" title="Modifier"><Pencil size={15} /></button>}
                  {canDelete && <button onClick={e => requestDelete(e, emp)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:text-red-500 transition-colors" title="Désactiver"><Trash2 size={15} /></button>}
                </div>
                <div className="flex flex-col items-center text-center">
                  <img src={emp.photoUrl || `https://ui-avatars.com/api/?name=${emp.firstName}+${emp.lastName}&background=random`} alt={emp.firstName} className="w-20 h-20 rounded-full object-cover border-4 border-gray-50 dark:border-gray-700 shadow-md mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{emp.firstName} {emp.lastName}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{emp.position}</p>
                  <div className="flex gap-2 mb-4">
                    <StatusBadge status={emp.status || 'ACTIVE'} />
                    <ContractBadge type={emp.contractType} />
                  </div>
                  <div className="w-full pt-4 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-2 text-left">
                    <div>
                      <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Dept.</p>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">{emp.department?.name || 'N/A'}</p>
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                    <th className="px-6 py-4">Employé</th>
                    <th className="px-6 py-4">Matricule</th>
                    <th className="px-6 py-4">Poste & Dept</th>
                    <th className="px-6 py-4">Contrat</th>
                    {canSeeSalary && <th className="px-6 py-4">Salaire</th>}
                    <th className="px-6 py-4">Statut</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredEmployees.map(emp => (
                    <tr key={emp.id} onClick={() => router.push(`/employes/${emp.id}`)} className="group hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors cursor-pointer">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={emp.photoUrl || `https://ui-avatars.com/api/?name=${emp.firstName}+${emp.lastName}&background=random`} className="w-10 h-10 rounded-full object-cover flex-shrink-0" alt="" />
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
                      <td className="px-6 py-4"><ContractBadge type={emp.contractType} /></td>
                      {canSeeSalary && (
                        <td className="px-6 py-4 group/salary">
                          {emp.baseSalary != null ? (
                            <div className="flex items-center gap-1 cursor-help">
                              <span className="text-gray-900 dark:text-white font-mono group-hover/salary:hidden">• • • • •</span>
                              <span className="hidden group-hover/salary:block font-bold text-emerald-600 dark:text-emerald-400">{emp.baseSalary.toLocaleString('fr-FR')} <span className="text-xs">FCFA</span></span>
                            </div>
                          ) : <span className="text-gray-300 dark:text-gray-600 text-xs italic">—</span>}
                        </td>
                      )}
                      <td className="px-6 py-4"><StatusBadge status={emp.status || 'ACTIVE'} /></td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={e => { e.stopPropagation(); router.push(`/employes/${emp.id}`); }} className="p-2 text-gray-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-lg transition-colors" title="Voir"><Eye size={17} /></button>
                          {canEdit && <button onClick={e => { e.stopPropagation(); router.push(`/employes/${emp.id}/edit`); }} className="p-2 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors" title="Modifier"><Pencil size={17} /></button>}
                          {canDelete && <button onClick={e => requestDelete(e, emp)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Désactiver"><Trash2 size={17} /></button>}
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

      {/* ── PAGINATION ── */}
      {totalEmployees > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-500">
            Affichage de{' '}
            <span className="font-bold text-gray-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span>
            {' '}à{' '}
            <span className="font-bold text-gray-900 dark:text-white">{Math.min(currentPage * itemsPerPage, totalEmployees)}</span>
            {' '}sur{' '}
            <span className="font-bold text-gray-900 dark:text-white">{totalEmployees}</span> employé{totalEmployees > 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"><ChevronLeft size={18} /></button>
            <span className="px-4 text-sm font-bold text-gray-700 dark:text-gray-300">Page {currentPage} / {totalPages || 1}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages || totalPages === 0} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"><ChevronRight size={18} /></button>
          </div>
        </div>
      )}
    </div>
  );
}