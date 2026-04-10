'use client';

// app/(dashboard)/cabinet/[cabinetId]/entreprise/[companyId]/contrats/page.tsx

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { FileCheck, Loader2, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { api } from '@/services/api';

const CONTRACT_LABELS: Record<string, string> = {
  CDI: 'CDI', CDD: 'CDD', STAGE: 'Stage', INTERIM: 'Intérim', CONSULTANT: 'Consultant',
};

export default function CabinetContratsPage() {
  const params    = useParams();
  const companyId = params.companyId as string;

  const [employees, setEmployees] = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState('ALL');

  useEffect(() => {
    api.get(`/employees?companyId=${companyId}&status=ACTIVE&limit=200`)
      .then((r: any) => setEmployees(Array.isArray(r) ? r : r?.data ?? []))
      .catch(() => setEmployees([]))
      .finally(() => setLoading(false));
  }, [companyId]);

  const now = new Date();

  const getContractStatus = (emp: any) => {
    if (emp.contractType === 'CDI') return 'permanent';
    if (!emp.contractEndDate) return 'no-date';
    const end = new Date(emp.contractEndDate);
    const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return 'expired';
    if (daysLeft <= 30) return 'expiring';
    return 'active';
  };

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    permanent: { label: 'CDI permanent',  color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    active:    { label: 'Actif',          color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20' },
    expiring:  { label: '⚠️ Expire bientôt', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    expired:   { label: 'Expiré',         color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20' },
    'no-date': { label: 'Sans date fin',  color: 'text-gray-400',    bg: 'bg-gray-500/10 border-gray-500/20' },
  };

  const filtered = filter === 'ALL' ? employees : employees.filter(e => getContractStatus(e) === filter);

  const stats = {
    expiring: employees.filter(e => getContractStatus(e) === 'expiring').length,
    expired:  employees.filter(e => getContractStatus(e) === 'expired').length,
    cdi:      employees.filter(e => e.contractType === 'CDI').length,
    cdd:      employees.filter(e => e.contractType !== 'CDI').length,
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-gray-600" /></div>;

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <FileCheck size={20} className="text-cyan-400" /> Contrats
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Suivi des contrats des employés</p>
      </div>

      {/* Alertes */}
      {(stats.expiring > 0 || stats.expired > 0) && (
        <div className="grid grid-cols-2 gap-3">
          {stats.expiring > 0 && (
            <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <AlertCircle size={16} className="text-amber-400 shrink-0" />
              <div>
                <p className="text-amber-400 font-medium text-sm">{stats.expiring} contrat{stats.expiring > 1 ? 's' : ''} expire bientôt</p>
                <p className="text-amber-400/60 text-xs">Dans les 30 prochains jours</p>
              </div>
            </div>
          )}
          {stats.expired > 0 && (
            <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <AlertCircle size={16} className="text-red-400 shrink-0" />
              <div>
                <p className="text-red-400 font-medium text-sm">{stats.expired} contrat{stats.expired > 1 ? 's' : ''} expiré{stats.expired > 1 ? 's' : ''}</p>
                <p className="text-red-400/60 text-xs">À renouveler ou clôturer</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'CDI',    value: stats.cdi,      color: 'text-emerald-400' },
          { label: 'CDD/Stage', value: stats.cdd,  color: 'text-blue-400' },
          { label: 'Expire bientôt', value: stats.expiring, color: 'text-amber-400' },
          { label: 'Expirés', value: stats.expired, color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="bg-white/3 border border-white/8 rounded-xl p-3 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filtre */}
      <div className="flex gap-1 bg-white/3 border border-white/8 rounded-lg p-1 w-fit">
        {['ALL','active','expiring','expired','permanent'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-md text-xs transition-colors ${filter === f ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}>
            {f === 'ALL' ? 'Tous' : statusConfig[f]?.label ?? f}
          </button>
        ))}
      </div>

      {/* Liste */}
      <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm">Aucun contrat dans cette catégorie</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  {['Employé','Poste','Type contrat','Date embauche','Fin de contrat','Statut'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((emp: any) => {
                  const cs  = getContractStatus(emp);
                  const sc  = statusConfig[cs];
                  const end = emp.contractEndDate ? new Date(emp.contractEndDate) : null;
                  const daysLeft = end ? Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
                  return (
                    <tr key={emp.id} className="hover:bg-white/3 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-white font-medium">{emp.firstName} {emp.lastName}</p>
                        <p className="text-xs text-gray-500">{emp.employeeNumber}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{emp.position}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-white/5 border border-white/8 rounded-full text-xs text-gray-300">
                          {CONTRACT_LABELS[emp.contractType] || emp.contractType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {emp.hireDate ? new Date(emp.hireDate).toLocaleDateString('fr-FR') : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {emp.contractType === 'CDI' ? (
                          <span className="text-gray-600">Indéterminé</span>
                        ) : end ? (
                          <div>
                            <span className={cs === 'expiring' || cs === 'expired' ? 'text-amber-400 font-medium' : 'text-gray-300'}>
                              {end.toLocaleDateString('fr-FR')}
                            </span>
                            {daysLeft !== null && daysLeft >= 0 && daysLeft <= 60 && (
                              <p className="text-[10px] text-amber-400 mt-0.5">J-{daysLeft}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-600">Non renseignée</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${sc.bg} ${sc.color}`}>
                          {sc.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}