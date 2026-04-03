'use client';

/**
 * Page employés — vue cabinet (lecture)
 * Route : /cabinet/[cabinetId]/entreprise/[companyId]/employes
 *
 * Le cabinet voit les employés de la PME en lecture — salaires de base,
 * contrats, primes récurrentes. Il ne gère pas les RH.
 * Un bouton "Saisir variables" renvoie vers la page paie.
 */

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Users, FileText, Loader2, Search, ArrowRight } from 'lucide-react';
import { api } from '@/services/api';

const fmt = (n: number) => new Intl.NumberFormat('fr-CG', { maximumFractionDigits: 0 }).format(n);

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  department?: { name: string };
  baseSalary: number;
  contractType: string;
  status: string;
  hireDate: string;
  fiscalParts?: number;
  appliesIts?: boolean;
  appliesCnss?: boolean;
}

const contractLabels: Record<string, string> = {
  CDI: 'CDI', CDD: 'CDD', STAGE: 'Stage', FREELANCE: 'Freelance',
};

export default function EmployesCabinetPage() {
  const params    = useParams();
  const router    = useRouter();
  const cabinetId = params.cabinetId as string;
  const companyId = params.companyId as string;

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');

  useEffect(() => {
    api.get(`/employees?companyId=${companyId}&status=ACTIVE&limit=200`)
      .then((r: any) => setEmployees(r.data ?? r))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [companyId]);

  const filtered = employees.filter(e =>
    `${e.firstName} ${e.lastName} ${e.position}`.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <Loader2 size={28} className="animate-spin text-purple-400" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-white p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Users size={20} className="text-cyan-400" /> Employés
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {employees.length} employés actifs · Vue lecture seule
          </p>
        </div>
        <button
          onClick={() => router.push(`/cabinet/${cabinetId}/entreprise/${companyId}/paie`)}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black rounded-xl text-sm font-semibold transition-colors">
          <FileText size={14} /> Saisir les variables du mois
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Recherche */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un employé..."
          className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-cyan-500/50" />
      </div>

      {/* Tableau */}
      <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              {['Employé', 'Département', 'Contrat', 'Salaire de base', 'Parts fiscales', 'ITS', 'CNSS', 'Embauche'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-medium uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map(emp => (
              <tr key={emp.id} className="hover:bg-white/3 transition-colors">
                <td className="px-4 py-3">
                  <p className="text-white font-medium">{emp.firstName} {emp.lastName}</p>
                  <p className="text-gray-500 text-xs">{emp.position}</p>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">{emp.department?.name ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-xs text-gray-400">
                    {contractLabels[emp.contractType] ?? emp.contractType}
                  </span>
                </td>
                <td className="px-4 py-3 text-cyan-400 font-semibold">{fmt(emp.baseSalary)} FCFA</td>
                <td className="px-4 py-3 text-center text-gray-400 text-xs">{emp.fiscalParts ?? 1}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs ${emp.appliesIts !== false ? 'text-emerald-400' : 'text-gray-600'}`}>
                    {emp.appliesIts !== false ? '✓' : '✗'}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs ${emp.appliesCnss !== false ? 'text-emerald-400' : 'text-gray-600'}`}>
                    {emp.appliesCnss !== false ? '✓' : '✗'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {new Date(emp.hireDate).toLocaleDateString('fr-FR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Note cabinet */}
      <div className="mt-4 flex items-start gap-2 p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
        <span className="text-blue-400 text-xs shrink-0 mt-0.5">ⓘ</span>
        <p className="text-blue-400/70 text-xs">
          Cette vue est en lecture seule. La gestion des profils employés (embauche, contrats, augmentations)
          est effectuée directement par l'entreprise. En tant que cabinet, vous intervenez uniquement sur les variables de paie mensuelles.
        </p>
      </div>
    </div>
  );
}