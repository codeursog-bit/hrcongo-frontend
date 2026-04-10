'use client';

// app/(dashboard)/cabinet/[cabinetId]/entreprise/[companyId]/materiel/page.tsx

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Package, Loader2, Search, Tag } from 'lucide-react';
import { api } from '@/services/api';

const fmt = (n: number) => new Intl.NumberFormat('fr-CG', { maximumFractionDigits: 0 }).format(n);

const ASSET_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE:       { label: 'Actif',     color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  IN_REPAIR:    { label: 'En réparation', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  RETIRED:      { label: 'Retraité', color: 'text-gray-400',    bg: 'bg-gray-500/10 border-gray-500/20' },
  LOST:         { label: 'Perdu',    color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20' },
};

export default function CabinetMaterielPage() {
  const params    = useParams();
  const companyId = params.companyId as string;

  const [assets,  setAssets]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');

  useEffect(() => {
    api.get(`/assets?companyId=${companyId}`)
      .then((r: any) => setAssets(Array.isArray(r) ? r : r?.data ?? []))
      .catch(() => setAssets([]))
      .finally(() => setLoading(false));
  }, [companyId]);

  const filtered = assets.filter(a => {
    const q = search.toLowerCase();
    return !search || a.name?.toLowerCase().includes(q) || a.category?.toLowerCase().includes(q) ||
      a.assignedEmployee?.firstName?.toLowerCase().includes(q) || a.assignedEmployee?.lastName?.toLowerCase().includes(q);
  });

  const totalValue = assets.reduce((s, a) => s + (a.purchasePrice ?? 0), 0);

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-gray-600" /></div>;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Package size={20} className="text-cyan-400" /> Matériel
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {assets.length} actif{assets.length > 1 ? 's' : ''} · Valeur totale : {fmt(totalValue)} F
          </p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un actif..."
          className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 outline-none focus:border-white/30" />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Package size={36} className="mx-auto mb-3 text-gray-700" />
          <p>{search ? 'Aucun résultat' : 'Aucun actif enregistré'}</p>
        </div>
      ) : (
        <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  {['Actif','Catégorie','Affecté à','Valeur','Statut'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((a: any) => {
                  const sc = ASSET_STATUS[a.status] ?? ASSET_STATUS['ACTIVE'];
                  return (
                    <tr key={a.id} className="hover:bg-white/3 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-white/5 border border-white/8 rounded-lg flex items-center justify-center shrink-0">
                            <Package size={14} className="text-gray-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium">{a.name}</p>
                            {a.serialNumber && <p className="text-xs text-gray-500">{a.serialNumber}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {a.category && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Tag size={11} />{a.category}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {a.assignedEmployee
                          ? `${a.assignedEmployee.firstName} ${a.assignedEmployee.lastName}`
                          : <span className="text-gray-600">Non affecté</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-xs">
                        {a.purchasePrice ? `${fmt(a.purchasePrice)} F` : '—'}
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
        </div>
      )}
    </div>
  );
}