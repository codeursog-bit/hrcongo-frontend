'use client';

// app/(dashboard)/cabinet/[cabinetId]/entreprise/[companyId]/presences/page.tsx
// API INCHANGÉE — UX améliorée

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/services/api';
import {
  C, Ico, Card, Badge, Avatar, Btn, TabBar,
  PageHeader, EmptyState, LoadingInline,
  TableShell, Th, Tr, Td,
} from '@/components/cabinet/cabinet-ui';

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const STATUS_CFG: Record<string, { label: string; variant: any; color: string }> = {
  PRESENT:       { label: 'Présent',     variant: 'success', color: C.emerald    },
  ABSENT_UNPAID: { label: 'Absent',      variant: 'danger',  color: C.red        },
  LATE:          { label: 'Retard',      variant: 'warning', color: C.amber      },
  LEAVE:         { label: 'Congé',       variant: 'info',    color: C.cyan       },
  HOLIDAY:       { label: 'Férié',       variant: 'purple',  color: C.violet     },
  OFF_DAY:       { label: 'Repos',       variant: 'default', color: C.textMuted  },
  REMOTE:        { label: 'Télétravail', variant: 'cyan',    color: C.teal       },
};

const fmt = (n: number) => n.toFixed(2);

export default function CabinetPresencesPage() {
  const params    = useParams();
  const companyId = params.companyId as string;

  const now = new Date();
  const [month,    setMonth]    = useState(now.getMonth() + 1);
  const [year,     setYear]     = useState(now.getFullYear());
  const [report,   setReport]   = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [view,     setView]     = useState<'summary' | 'detail'>('summary');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api.get(`/attendance/report?companyId=${companyId}&month=${month}&year=${year}`)
      .then((data: any) => setReport(Array.isArray(data) ? data : []))
      .catch(() => setReport([]))
      .finally(() => setLoading(false));
  }, [companyId, month, year]);

  const downloadResume = () => {
    window.open(`/api/attendance/export/excel?companyId=${companyId}&month=${month}&year=${year}`, '_blank');
  };

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

  return (
    <div className="p-6 space-y-5" style={{ minHeight: '100vh', background: C.pageBg }}>

      <PageHeader
        title="Présences"
        sub="Rapport mensuel des présences de la PME"
        icon={<Ico.Fingerprint size={18} color={C.cyan} />}
        action={
          <Btn
            variant="ghost"
            size="sm"
            icon={<Ico.Download size={13} color={C.textSecondary} />}
            onClick={downloadResume}
          >
            Exporter Excel
          </Btn>
        }
      />

      {/* Month selector + view toggle */}
      <div className="flex items-center gap-3 flex-wrap">
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2"
          style={{ background: C.cardBg, border: `1px solid ${C.border}` }}
        >
          <button
            onClick={prevMonth}
            className="p-1 rounded-lg transition-colors"
            style={{ color: C.textMuted }}
            onMouseEnter={e => (e.currentTarget.style.color = C.textPrimary)}
            onMouseLeave={e => (e.currentTarget.style.color = C.textMuted)}
          >
            <Ico.ChevronLeft size={14} color="currentColor" />
          </button>
          <span className="font-semibold text-sm min-w-36 text-center" style={{ color: C.textPrimary }}>
            {MONTHS[month - 1]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="p-1 rounded-lg transition-colors"
            style={{ color: C.textMuted }}
            onMouseEnter={e => (e.currentTarget.style.color = C.textPrimary)}
            onMouseLeave={e => (e.currentTarget.style.color = C.textMuted)}
          >
            <Ico.ChevronRight size={14} color="currentColor" />
          </button>
        </div>

        <TabBar
          tabs={[{ key: 'summary', label: 'Résumé' }, { key: 'detail', label: 'Détail journalier' }]}
          active={view}
          onChange={setView}
        />
      </div>

      {loading ? <LoadingInline /> : report.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Ico.Fingerprint size={22} color={C.textMuted} />}
            title={`Aucune donnée pour ${MONTHS[month - 1]} ${year}`}
            sub="Les présences apparaîtront une fois les employés pointés"
          />
        </Card>
      ) : (
        <TableShell>
          <thead>
            <tr>
              <Th>Employé</Th>
              <Th align="center">Présents</Th>
              <Th align="center">Absents</Th>
              <Th align="center">Retards</Th>
              <Th align="center">Congés</Th>
              <Th align="center">H.Sup ×10%</Th>
              <Th align="center">H.Sup ×25%</Th>
              <Th align="center">H.Sup ×50%</Th>
              <Th align="center">Statut</Th>
            </tr>
          </thead>
          <tbody>
            {report.map((row: any, i) => (
              <React.Fragment key={row.employeeId}>
                <Tr onClick={() => view === 'detail' ? setExpanded(expanded === row.employeeId ? null : row.employeeId) : undefined}>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={row.name ?? '??'} size={30} index={i} />
                      <div>
                        <p className="text-sm font-medium" style={{ color: C.textPrimary }}>{row.name}</p>
                        {row.department && (
                          <p className="text-xs" style={{ color: C.textMuted }}>{row.department}</p>
                        )}
                      </div>
                    </div>
                  </Td>
                  <Td className="text-center">
                    <span className="font-semibold" style={{ color: C.emerald }}>{row.daysPresent ?? 0}</span>
                  </Td>
                  <Td className="text-center">
                    <span style={{ color: (row.daysAbsentUnpaid ?? 0) > 0 ? C.red : C.textMuted }}>
                      {row.daysAbsentUnpaid ?? 0}
                    </span>
                  </Td>
                  <Td className="text-center">
                    <span style={{ color: (row.daysLate ?? 0) > 0 ? C.amber : C.textMuted }}>
                      {row.daysLate ?? 0}
                    </span>
                  </Td>
                  <Td className="text-center">
                    <span style={{ color: C.cyan }}>{row.daysOnLeave ?? 0}</span>
                  </Td>
                  <Td className="text-center">
                    <span className="text-xs font-mono" style={{ color: (row.overtime10 ?? 0) > 0 ? C.emerald : C.textMuted }}>
                      {fmt(row.overtime10 ?? 0)}h
                    </span>
                  </Td>
                  <Td className="text-center">
                    <span className="text-xs font-mono" style={{ color: (row.overtime25 ?? 0) > 0 ? C.amber : C.textMuted }}>
                      {fmt(row.overtime25 ?? 0)}h
                    </span>
                  </Td>
                  <Td className="text-center">
                    <span className="text-xs font-mono" style={{ color: (row.overtime50 ?? 0) > 0 ? '#f97316' : C.textMuted }}>
                      {fmt(row.overtime50 ?? 0)}h
                    </span>
                  </Td>
                  <Td className="text-center">
                    <Badge
                      label={row.status === 'perfect' ? 'OK' : 'À vérifier'}
                      variant={row.status === 'perfect' ? 'success' : 'warning'}
                    />
                  </Td>
                </Tr>

                {/* Détail journalier */}
                {view === 'detail' && expanded === row.employeeId && row.details && (
                  <tr>
                    <td colSpan={9} style={{ background: 'rgba(255,255,255,0.015)', padding: '12px 16px' }}>
                      <div className="grid grid-cols-7 gap-1.5 max-h-52 overflow-y-auto pr-1">
                        {row.details.map((d: any, idx: number) => {
                          const sc = STATUS_CFG[d.status];
                          return (
                            <div
                              key={idx}
                              className="rounded-lg p-2 text-center"
                              style={{ background: `${sc?.color ?? C.textMuted}10`, border: `1px solid ${sc?.color ?? C.textMuted}20` }}
                            >
                              <p className="text-[9px] mb-0.5" style={{ color: C.textMuted }}>{d.date?.slice(5)}</p>
                              <p className="text-[10px] font-medium" style={{ color: sc?.color ?? C.textMuted }}>
                                {sc?.label ?? d.status}
                              </p>
                              {d.total && d.total !== '0.00' && (
                                <p className="text-[9px]" style={{ color: C.textMuted }}>{d.total}h</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </TableShell>
      )}
    </div>
  );
}