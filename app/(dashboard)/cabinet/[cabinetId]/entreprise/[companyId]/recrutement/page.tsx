'use client';

// app/(dashboard)/cabinet/[cabinetId]/entreprise/[companyId]/recrutement/page.tsx
// Cabinet gère le recrutement de ses PME clientes

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { UserCog, Loader2, Plus, Search, ExternalLink, Users, Eye } from 'lucide-react';
import { api } from '@/services/api';

const CONTRACT_TYPES: Record<string, string> = {
  CDI: 'CDI', CDD: 'CDD', STAGE: 'Stage', INTERIM: 'Intérim', CONSULTANT: 'Consultant',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  OPEN:      { label: 'Ouverte',  color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  CLOSED:    { label: 'Fermée',   color: 'text-gray-400',    bg: 'bg-gray-500/10 border-gray-500/20' },
  ON_HOLD:   { label: 'En pause', color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20' },
  FILLED:    { label: 'Pourvue',  color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20' },
};

export default function CabinetRecrutementPage() {
  const params    = useParams();
  const router    = useRouter();
  const cabinetId = params.cabinetId as string;
  const companyId = params.companyId as string;

  const [offers,   setOffers]   = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');

  useEffect(() => {
    api.get(`/recruitment/offers?companyId=${companyId}`)
      .then((r: any) => setOffers(Array.isArray(r) ? r : r?.data ?? []))
      .catch(() => setOffers([]))
      .finally(() => setLoading(false));
  }, [companyId]);

  const filtered = offers.filter(o => {
    const q = search.toLowerCase();
    return !search || o.title?.toLowerCase().includes(q) || o.department?.name?.toLowerCase().includes(q);
  });

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-gray-600" /></div>;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <UserCog size={20} className="text-cyan-400" /> Recrutement
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">{offers.length} offre{offers.length > 1 ? 's' : ''} d'emploi</p>
        </div>
        <button
          onClick={() => router.push(`/cabinet/${cabinetId}/entreprise/${companyId}/recrutement/nouvelle`)}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-xl text-sm transition-colors"
        >
          <Plus size={14} /> Nouvelle offre
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher une offre..."
          className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 outline-none focus:border-white/30" />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <UserCog size={36} className="mx-auto mb-3 text-gray-700" />
          <p>{search ? 'Aucun résultat' : 'Aucune offre d\'emploi'}</p>
          <p className="text-xs text-gray-600 mt-1">Créez des offres pour cette PME</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((offer: any) => {
            const sc = STATUS_CONFIG[offer.status] ?? STATUS_CONFIG['OPEN'];
            return (
              <div key={offer.id} className="bg-white/3 border border-white/8 rounded-2xl p-4 hover:bg-white/4 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white text-sm truncate">{offer.title}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${sc.bg} ${sc.color}`}>
                        {sc.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {offer.department?.name && <span>{offer.department.name}</span>}
                      {offer.contractType && <span>· {CONTRACT_TYPES[offer.contractType] ?? offer.contractType}</span>}
                      {offer.location && <span>· {offer.location}</span>}
                      {offer._count?.applications !== undefined && (
                        <span className="flex items-center gap-1">
                          <Users size={11} /> {offer._count.applications} candidature{offer._count.applications > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    {offer.description && (
                      <p className="text-xs text-gray-400 mt-2 line-clamp-2">{offer.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => router.push(`/cabinet/${cabinetId}/entreprise/${companyId}/recrutement/${offer.id}`)}
                      className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors"
                      title="Voir les candidatures"
                    >
                      <Eye size={15} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                  <p className="text-xs text-gray-600">
                    Créée le {new Date(offer.createdAt).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })}
                  </p>
                  {offer.closingDate && (
                    <p className="text-xs text-gray-600">
                      · Clôture : {new Date(offer.closingDate).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}