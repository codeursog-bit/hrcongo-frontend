'use client';

// app/(dashboard)/cabinet/[cabinetId]/entreprise/[companyId]/recrutement/page.tsx
// API INCHANGÉE — UX améliorée

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/services/api';
import {
  C, Ico, Card, Badge, Btn, KpiCard,
  PageHeader, SearchBar, EmptyState, LoadingInline,
} from '@/components/cabinet/cabinet-ui';

const CONTRACT_TYPES: Record<string, string> = {
  CDI: 'CDI', CDD: 'CDD', STAGE: 'Stage', INTERIM: 'Intérim', CONSULTANT: 'Consultant',
};

const STATUS_CFG: Record<string, { label: string; variant: any }> = {
  OPEN:    { label: 'Ouverte',  variant: 'success' },
  CLOSED:  { label: 'Fermée',  variant: 'default'  },
  ON_HOLD: { label: 'En pause', variant: 'warning'  },
  FILLED:  { label: 'Pourvue', variant: 'info'      },
};

export default function CabinetRecrutementPage() {
  const params    = useParams();
  const router    = useRouter();
  const cabinetId = params.cabinetId as string;
  const companyId = params.companyId as string;

  const [offers,  setOffers]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');

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

  const stats = {
    open:   offers.filter(o => o.status === 'OPEN').length,
    filled: offers.filter(o => o.status === 'FILLED').length,
    total:  offers.reduce((s, o) => s + (o._count?.applications ?? 0), 0),
  };

  return (
    <div className="p-6 space-y-5" style={{ minHeight: '100vh', background: C.pageBg }}>

      <PageHeader
        title="Recrutement"
        sub={`${offers.length} offre${offers.length > 1 ? 's' : ''} d'emploi`}
        icon={<Ico.UserCog size={18} color={C.cyan} />}
        action={
          <Btn
            variant="primary"
            icon={<Ico.Plus size={13} color="#fff" />}
            onClick={() => router.push(`/cabinet/${cabinetId}/entreprise/${companyId}/recrutement/nouvelle`)}
          >
            Nouvelle offre
          </Btn>
        }
      />

      {offers.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <KpiCard label="Offres ouvertes"  value={stats.open}   icon={<Ico.Check  size={16} color={C.emerald} />} accentColor={C.emerald} />
          <KpiCard label="Postes pourvus"   value={stats.filled} icon={<Ico.Users  size={16} color={C.cyan}    />} accentColor={C.cyan}    />
          <KpiCard label="Candidatures"     value={stats.total}  icon={<Ico.FileText size={16} color={C.violet} />} accentColor={C.violet}  />
        </div>
      )}

      <div className="max-w-sm">
        <SearchBar value={search} onChange={setSearch} placeholder="Rechercher une offre..." />
      </div>

      {loading ? <LoadingInline /> : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Ico.UserCog size={22} color={C.textMuted} />}
            title={search ? 'Aucun résultat' : 'Aucune offre d\'emploi'}
            sub={search ? undefined : 'Créez des offres pour cette PME'}
          />
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((offer: any) => {
            const sc = STATUS_CFG[offer.status] ?? STATUS_CFG['OPEN'];
            return (
              <Card
                key={offer.id}
                className="p-5 hover:cursor-pointer"
                onClick={() => router.push(`/cabinet/${cabinetId}/entreprise/${companyId}/recrutement/${offer.id}`)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-2">
                      <h3 className="font-semibold text-sm truncate" style={{ color: C.textPrimary }}>
                        {offer.title}
                      </h3>
                      <Badge label={sc.label} variant={sc.variant} />
                    </div>

                    <div className="flex items-center flex-wrap gap-x-3 gap-y-1">
                      {offer.department?.name && (
                        <span className="flex items-center gap-1 text-xs" style={{ color: C.textSecondary }}>
                          <Ico.Network size={11} color="currentColor" />
                          {offer.department.name}
                        </span>
                      )}
                      {offer.contractType && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(255,255,255,0.06)', color: C.textSecondary, border: `1px solid ${C.border}` }}
                        >
                          {CONTRACT_TYPES[offer.contractType] ?? offer.contractType}
                        </span>
                      )}
                      {offer.location && (
                        <span className="flex items-center gap-1 text-xs" style={{ color: C.textMuted }}>
                          <Ico.MapPin size={11} color="currentColor" />
                          {offer.location}
                        </span>
                      )}
                      {offer._count?.applications !== undefined && (
                        <span className="flex items-center gap-1 text-xs" style={{ color: C.textSecondary }}>
                          <Ico.Users size={11} color="currentColor" />
                          {offer._count.applications} candidature{offer._count.applications > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {offer.description && (
                      <p className="text-xs mt-2 line-clamp-2" style={{ color: C.textMuted }}>
                        {offer.description}
                      </p>
                    )}
                  </div>
                  <Ico.ArrowRight size={14} color={C.textMuted} />
                </div>

                <div
                  className="flex items-center gap-3 mt-3 pt-3 text-xs"
                  style={{ borderTop: `1px solid ${C.border}`, color: C.textMuted }}
                >
                  <span>
                    Créée le {new Date(offer.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  {offer.closingDate && (
                    <span>· Clôture : {new Date(offer.closingDate).toLocaleDateString('fr-FR')}</span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}