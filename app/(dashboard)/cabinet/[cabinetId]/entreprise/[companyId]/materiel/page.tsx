'use client';

// app/(dashboard)/cabinet/[cabinetId]/entreprise/[companyId]/materiel/page.tsx
// API INCHANGÉE — UX améliorée

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/services/api';
import {
  C, Ico, Card, Badge, KpiCard,
  PageHeader, SearchBar, TableShell, Th, Tr, Td,
  EmptyState, LoadingInline,
} from '@/components/cabinet/cabinet-ui';

const fmt = (n: number) => new Intl.NumberFormat('fr-CG', { maximumFractionDigits: 0 }).format(n);

const ASSET_STATUS: Record<string, { label: string; variant: any }> = {
  ACTIVE:    { label: 'Actif',          variant: 'success' },
  IN_REPAIR: { label: 'En réparation',  variant: 'warning' },
  RETIRED:   { label: 'Retraité',       variant: 'default' },
  LOST:      { label: 'Perdu',          variant: 'danger'  },
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
    return !search
      || a.name?.toLowerCase().includes(q)
      || a.category?.toLowerCase().includes(q)
      || a.assignedEmployee?.firstName?.toLowerCase().includes(q)
      || a.assignedEmployee?.lastName?.toLowerCase().includes(q);
  });

  const totalValue = assets.reduce((s, a) => s + (a.purchasePrice ?? 0), 0);
  const stats = {
    active:   assets.filter(a => a.status === 'ACTIVE').length,
    repair:   assets.filter(a => a.status === 'IN_REPAIR').length,
    retired:  assets.filter(a => a.status === 'RETIRED').length,
  };

  return (
    <div className="p-6 space-y-5" style={{ minHeight: '100vh', background: C.pageBg }}>

      <PageHeader
        title="Matériel"
        sub={`${assets.length} actif${assets.length > 1 ? 's' : ''} · Valeur totale : ${fmt(totalValue)} F`}
        icon={<Ico.Package size={18} color={C.cyan} />}
      />

      {assets.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          <KpiCard label="Actifs"          value={stats.active}  icon={<Ico.Check   size={16} color={C.emerald} />} accentColor={C.emerald} />
          <KpiCard label="En réparation"   value={stats.repair}  icon={<Ico.Alert   size={16} color={C.amber}   />} accentColor={C.amber}   />
          <KpiCard label="Retraités"       value={stats.retired} icon={<Ico.Package size={16} color={C.textMuted}/>} accentColor={C.textMuted} />
          <KpiCard label="Valeur totale"   value={`${fmt(totalValue)} F`} icon={<Ico.Wallet size={16} color={C.cyan} />} accentColor={C.cyan} />
        </div>
      )}

      <div className="max-w-sm">
        <SearchBar value={search} onChange={setSearch} placeholder="Rechercher un actif..." />
      </div>

      {loading ? <LoadingInline /> : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Ico.Package size={22} color={C.textMuted} />}
            title={search ? 'Aucun résultat' : 'Aucun actif enregistré'}
            sub={search ? undefined : 'Le matériel de la PME apparaîtra ici'}
          />
        </Card>
      ) : (
        <TableShell>
          <thead>
            <tr>
              <Th>Actif</Th>
              <Th>Catégorie</Th>
              <Th>Affecté à</Th>
              <Th align="right">Valeur</Th>
              <Th>Statut</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a: any) => {
              const sc = ASSET_STATUS[a.status] ?? ASSET_STATUS['ACTIVE'];
              return (
                <Tr key={a.id}>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}` }}
                      >
                        <Ico.Package size={13} color={C.textMuted} />
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: C.textPrimary }}>{a.name}</p>
                        {a.serialNumber && (
                          <p className="text-xs" style={{ color: C.textMuted }}>{a.serialNumber}</p>
                        )}
                      </div>
                    </div>
                  </Td>
                  <Td>
                    {a.category ? (
                      <span className="flex items-center gap-1 text-xs" style={{ color: C.textSecondary }}>
                        <Ico.Tag size={11} color="currentColor" />
                        {a.category}
                      </span>
                    ) : (
                      <span style={{ color: C.textMuted }}>—</span>
                    )}
                  </Td>
                  <Td>
                    <span className="text-xs" style={{ color: C.textSecondary }}>
                      {a.assignedEmployee
                        ? `${a.assignedEmployee.firstName} ${a.assignedEmployee.lastName}`
                        : <span style={{ color: C.textMuted }}>Non affecté</span>
                      }
                    </span>
                  </Td>
                  <Td className="text-right">
                    <span className="text-sm" style={{ color: C.textSecondary }}>
                      {a.purchasePrice ? `${fmt(a.purchasePrice)} F` : '—'}
                    </span>
                  </Td>
                  <Td>
                    <Badge label={sc.label} variant={sc.variant} />
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </TableShell>
      )}
    </div>
  );
}