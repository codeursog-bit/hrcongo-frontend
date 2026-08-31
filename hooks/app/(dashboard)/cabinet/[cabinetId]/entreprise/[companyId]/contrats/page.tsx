'use client';

// app/(dashboard)/cabinet/[cabinetId]/entreprise/[companyId]/contrats/page.tsx
// API INCHANGÉE — UX améliorée

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/services/api';
import {
  C, Ico, Card, Badge, Avatar, KpiCard,
  PageHeader, Banner, FilterBar,
  TableShell, Th, Tr, Td,
  EmptyState, LoadingInline,
} from '@/components/cabinet/cabinet-ui';

const CONTRACT_LABELS: Record<string, string> = {
  CDI: 'CDI', CDD: 'CDD', STAGE: 'Stage', INTERIM: 'Intérim', CONSULTANT: 'Consultant',
};

type FilterKey = 'ALL' | 'active' | 'expiring' | 'expired' | 'permanent';

export default function CabinetContratsPage() {
  const params    = useParams();
  const companyId = params.companyId as string;

  const [employees, setEmployees] = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState<FilterKey>('ALL');

  useEffect(() => {
    api.get(`/employees?companyId=${companyId}&status=ACTIVE&limit=200`)
      .then((r: any) => setEmployees(Array.isArray(r) ? r : r?.data ?? []))
      .catch(() => setEmployees([]))
      .finally(() => setLoading(false));
  }, [companyId]);

  const now = new Date();

  const getStatus = (emp: any): FilterKey => {
    if (emp.contractType === 'CDI') return 'permanent';
    if (!emp.contractEndDate) return 'active';
    const end = new Date(emp.contractEndDate);
    const days = Math.ceil((end.getTime() - now.getTime()) / 86400000);
    if (days < 0) return 'expired';
    if (days <= 30) return 'expiring';
    return 'active';
  };

  const STATUS_CFG: Record<FilterKey, { label: string; variant: any }> = {
    ALL:       { label: 'Tous',          variant: 'default' },
    permanent: { label: 'CDI permanent', variant: 'success' },
    active:    { label: 'Actif',         variant: 'info'    },
    expiring:  { label: 'Expire bientôt',variant: 'warning' },
    expired:   { label: 'Expiré',        variant: 'danger'  },
  };

  const stats = {
    cdi:      employees.filter(e => e.contractType === 'CDI').length,
    cdd:      employees.filter(e => e.contractType !== 'CDI').length,
    expiring: employees.filter(e => getStatus(e) === 'expiring').length,
    expired:  employees.filter(e => getStatus(e) === 'expired').length,
  };

  const filtered = filter === 'ALL' ? employees : employees.filter(e => getStatus(e) === filter);

  const FILTER_OPTS: { key: FilterKey; label: string }[] = [
    { key: 'ALL',       label: `Tous (${employees.length})` },
    { key: 'permanent', label: `CDI (${stats.cdi})`        },
    { key: 'active',    label: `Actifs (${stats.cdd})`     },
    { key: 'expiring',  label: `Expirent bientôt (${stats.expiring})` },
    { key: 'expired',   label: `Expirés (${stats.expired})` },
  ];

  return (
    <div className="p-6 space-y-5" style={{ minHeight: '100vh', background: C.pageBg }}>

      <PageHeader
        title="Contrats"
        sub="Suivi des contrats des employés"
        icon={<Ico.FileText size={18} color={C.cyan} />}
      />

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="CDI"            value={stats.cdi}      icon={<Ico.FileText size={16} color={C.emerald} />} accentColor={C.emerald} />
        <KpiCard label="CDD / Stages"   value={stats.cdd}      icon={<Ico.FileText size={16} color={C.cyan}    />} accentColor={C.cyan}    />
        <KpiCard label="Expirent bientôt" value={stats.expiring} icon={<Ico.Alert size={16} color={C.amber}   />} accentColor={C.amber}   />
        <KpiCard label="Expirés"        value={stats.expired}  icon={<Ico.Alert size={16} color={C.red}       />} accentColor={C.red}     />
      </div>

      {/* Alert banners */}
      {stats.expiring > 0 && (
        <Banner
          icon={<Ico.Alert size={16} color={C.amber} />}
          title={`${stats.expiring} contrat${stats.expiring > 1 ? 's expirent' : ' expire'} dans les 30 jours`}
          sub="Pensez à les renouveler ou à planifier la clôture"
          color={C.amber}
        />
      )}
      {stats.expired > 0 && (
        <Banner
          icon={<Ico.Alert size={16} color={C.red} />}
          title={`${stats.expired} contrat${stats.expired > 1 ? 's expirés' : ' expiré'} — action requise`}
          sub="À renouveler ou clôturer dès que possible"
          color={C.red}
        />
      )}

      {/* Filters */}
      <FilterBar filters={FILTER_OPTS} active={filter} onChange={setFilter} />

      {/* Table */}
      {loading ? <LoadingInline /> : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Ico.FileText size={22} color={C.textMuted} />}
            title="Aucun contrat dans cette catégorie"
          />
        </Card>
      ) : (
        <TableShell>
          <thead>
            <tr>
              <Th>Employé</Th>
              <Th>Poste</Th>
              <Th>Type contrat</Th>
              <Th>Date embauche</Th>
              <Th>Fin de contrat</Th>
              <Th>Statut</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((emp: any, i) => {
              const cs       = getStatus(emp);
              const sc       = STATUS_CFG[cs];
              const end      = emp.contractEndDate ? new Date(emp.contractEndDate) : null;
              const daysLeft = end ? Math.ceil((end.getTime() - now.getTime()) / 86400000) : null;
              return (
                <Tr key={emp.id}>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={`${emp.firstName} ${emp.lastName}`} size={30} index={i} />
                      <div>
                        <p className="text-sm font-medium" style={{ color: C.textPrimary }}>
                          {emp.firstName} {emp.lastName}
                        </p>
                        <p className="text-xs" style={{ color: C.textMuted }}>{emp.employeeNumber}</p>
                      </div>
                    </div>
                  </Td>
                  <Td><span className="text-xs" style={{ color: C.textSecondary }}>{emp.position}</span></Td>
                  <Td>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs"
                      style={{ background: 'rgba(255,255,255,0.06)', color: C.textSecondary, border: `1px solid ${C.border}` }}
                    >
                      {CONTRACT_LABELS[emp.contractType] ?? emp.contractType}
                    </span>
                  </Td>
                  <Td>
                    <span className="text-xs" style={{ color: C.textSecondary }}>
                      {emp.hireDate ? new Date(emp.hireDate).toLocaleDateString('fr-FR') : '—'}
                    </span>
                  </Td>
                  <Td>
                    {emp.contractType === 'CDI' ? (
                      <span className="text-xs" style={{ color: C.textMuted }}>Indéterminé</span>
                    ) : end ? (
                      <div>
                        <span className="text-xs" style={{ color: cs === 'expiring' || cs === 'expired' ? C.amber : C.textSecondary }}>
                          {end.toLocaleDateString('fr-FR')}
                        </span>
                        {daysLeft !== null && daysLeft >= 0 && daysLeft <= 60 && (
                          <p className="text-[10px] mt-0.5" style={{ color: C.amber }}>J-{daysLeft}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs" style={{ color: C.textMuted }}>Non renseignée</span>
                    )}
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