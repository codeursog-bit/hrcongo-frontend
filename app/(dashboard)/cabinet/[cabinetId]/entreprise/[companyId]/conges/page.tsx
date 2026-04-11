'use client';

// app/(dashboard)/cabinet/[cabinetId]/entreprise/[companyId]/conges/page.tsx
// API INCHANGÉE — UX améliorée

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/services/api';
import {
  C, Ico, Card, Badge, Avatar, Btn, KpiCard,
  PageHeader, SectionHeader, FilterBar,
  EmptyState, LoadingInline,
} from '@/components/cabinet/cabinet-ui';

const TYPES: Record<string, string> = {
  ANNUAL: 'Annuel', SICK: 'Maladie', MATERNITY: 'Maternité',
  PATERNITY: 'Paternité', UNPAID: 'Sans solde', COMPENSATORY: 'Compensatoire',
};

const STATUS_CFG: Record<string, { label: string; variant: any; color: string }> = {
  PENDING:   { label: 'En attente', variant: 'warning', color: C.amber   },
  APPROVED:  { label: 'Approuvé',   variant: 'success', color: C.emerald },
  REJECTED:  { label: 'Refusé',     variant: 'danger',  color: C.red     },
  CANCELLED: { label: 'Annulé',     variant: 'default', color: C.textMuted },
};

type Filter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

export default function CabinetCongesPage() {
  const params    = useParams();
  const companyId = params.companyId as string;

  const [leaves,   setLeaves]   = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState<Filter>('ALL');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api.get(`/leaves?companyId=${companyId}`)
      .then((data: any) => setLeaves(Array.isArray(data) ? data : []))
      .catch(() => setLeaves([]))
      .finally(() => setLoading(false));
  }, [companyId]);

  const updateStatus = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setUpdating(id);
    try {
      await api.patch(`/leaves/${id}/status?companyId=${companyId}`, { status });
      setLeaves(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    } catch {} finally {
      setUpdating(null);
    }
  };

  const filtered = filter === 'ALL' ? leaves : leaves.filter(l => l.status === filter);

  const stats = {
    PENDING:   leaves.filter(l => l.status === 'PENDING').length,
    APPROVED:  leaves.filter(l => l.status === 'APPROVED').length,
    REJECTED:  leaves.filter(l => l.status === 'REJECTED').length,
    CANCELLED: leaves.filter(l => l.status === 'CANCELLED').length,
  };

  const FILTER_OPTS: { key: Filter; label: string }[] = [
    { key: 'ALL',      label: `Tous (${leaves.length})`              },
    { key: 'PENDING',  label: `En attente (${stats.PENDING})`        },
    { key: 'APPROVED', label: `Approuvés (${stats.APPROVED})`        },
    { key: 'REJECTED', label: `Refusés (${stats.REJECTED})`          },
  ];

  return (
    <div className="p-6 space-y-5" style={{ minHeight: '100vh', background: C.pageBg }}>

      <PageHeader
        title="Congés"
        sub="Demandes de congés de la PME"
        icon={<Ico.Leave size={18} color={C.cyan} />}
      />

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="En attente"  value={stats.PENDING}  icon={<Ico.Clock size={16} color={C.amber}   />} accentColor={C.amber}   />
        <KpiCard label="Approuvés"   value={stats.APPROVED} icon={<Ico.Check size={16} color={C.emerald} />} accentColor={C.emerald} />
        <KpiCard label="Refusés"     value={stats.REJECTED} icon={<Ico.Alert size={16} color={C.red}     />} accentColor={C.red}     />
        <KpiCard label="Annulés"     value={stats.CANCELLED}icon={<Ico.Leave size={16} color={C.textMuted}/>} accentColor={C.textMuted} />
      </div>

      {/* Filters */}
      <FilterBar filters={FILTER_OPTS} active={filter} onChange={setFilter} />

      {/* List */}
      {loading ? <LoadingInline /> : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Ico.Leave size={22} color={C.textMuted} />}
            title="Aucune demande de congé"
            sub={filter !== 'ALL' ? 'Aucun résultat pour ce filtre' : undefined}
          />
        </Card>
      ) : (
        <Card>
          <div>
            {filtered.map((leave, i) => {
              const sc = STATUS_CFG[leave.status] ?? STATUS_CFG['PENDING'];
              const empName = leave.employee
                ? `${leave.employee.firstName ?? ''} ${leave.employee.lastName ?? ''}`.trim()
                : 'Employé';
              return (
                <div
                  key={leave.id}
                  className="flex items-center gap-3 px-5 py-4 transition-colors"
                  style={{
                    borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : 'none',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <Avatar name={empName} size={36} index={i} />

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: C.textPrimary }}>{empName}</p>
                    <p className="text-xs mt-0.5" style={{ color: C.textSecondary }}>
                      {TYPES[leave.type] ?? leave.type}
                      {' · '}
                      {new Date(leave.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      {' → '}
                      {new Date(leave.endDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      {leave.daysCount && ` · ${leave.daysCount} jour${leave.daysCount > 1 ? 's' : ''}`}
                    </p>
                    {leave.reason && (
                      <p className="text-xs mt-0.5 truncate" style={{ color: C.textMuted }}>
                        {leave.reason}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge label={sc.label} variant={sc.variant} />
                    {leave.status === 'PENDING' && (
                      <>
                        <Btn
                          variant="success"
                          size="sm"
                          onClick={() => updateStatus(leave.id, 'APPROVED')}
                          disabled={updating === leave.id}
                        >
                          {updating === leave.id ? '…' : 'Approuver'}
                        </Btn>
                        <Btn
                          variant="danger"
                          size="sm"
                          onClick={() => updateStatus(leave.id, 'REJECTED')}
                          disabled={updating === leave.id}
                        >
                          Refuser
                        </Btn>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}