'use client';

// app/(dashboard)/cabinet/[cabinetId]/entreprise/[companyId]/resume-presences/page.tsx
// API INCHANGÉE — UX améliorée

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/services/api';
import {
  C, Ico, Card, Badge, Avatar, Btn, KpiCard,
  PageHeader, Banner, EmptyState, LoadingInline,
  TableShell, Th, Tr, Td,
} from '@/components/cabinet/cabinet-ui';

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const fmt2 = (n: number) => n.toFixed(2);

export default function ResumePresencesPage() {
  const params    = useParams();
  const router    = useRouter();
  const cabinetId = params.cabinetId as string;
  const companyId = params.companyId as string;

  const now = new Date();
  const [month,   setMonth]   = useState(now.getMonth() + 1);
  const [year,    setYear]    = useState(now.getFullYear());
  const [report,  setReport]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/attendance/report?companyId=${companyId}&month=${month}&year=${year}`)
      .then((data: any) => setReport(Array.isArray(data) ? data : []))
      .catch(() => setReport([]))
      .finally(() => setLoading(false));
  }, [companyId, month, year]);

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const totals = report.reduce((acc, r) => ({
    present: acc.present + (r.daysPresent      ?? 0),
    absent:  acc.absent  + (r.daysAbsentUnpaid ?? 0),
    leave:   acc.leave   + (r.daysOnLeave       ?? 0),
    ot10:    acc.ot10    + (r.overtime10         ?? 0),
    ot25:    acc.ot25    + (r.overtime25         ?? 0),
    ot50:    acc.ot50    + (r.overtime50         ?? 0),
    ot100:   acc.ot100   + (r.overtime100        ?? 0),
  }), { present: 0, absent: 0, leave: 0, ot10: 0, ot25: 0, ot50: 0, ot100: 0 });

  const hasAnomalies = report.some(r => r.status === 'warning');

  return (
    <div className="p-6 space-y-5" style={{ minHeight: '100vh', background: C.pageBg }}>

      <PageHeader
        title="Résumé présences"
        sub="Variables à reporter dans la saisie de paie"
        icon={<Ico.BarChart size={18} color={C.cyan} />}
        action={
          <Btn
            variant="primary"
            icon={<Ico.ArrowRight size={13} color="#fff" />}
            onClick={() => router.push(`/cabinet/${cabinetId}/entreprise/${companyId}/paie`)}
          >
            Aller à la saisie paie
          </Btn>
        }
      />

      {/* Month selector */}
      <div
        className="flex items-center gap-2 rounded-xl px-3 py-2 w-fit"
        style={{ background: C.cardBg, border: `1px solid ${C.border}` }}
      >
        <button onClick={prevMonth} className="p-1 rounded-lg transition-colors" style={{ color: C.textMuted }}
          onMouseEnter={e => (e.currentTarget.style.color = C.textPrimary)}
          onMouseLeave={e => (e.currentTarget.style.color = C.textMuted)}
        >
          <Ico.ChevronLeft size={14} color="currentColor" />
        </button>
        <span className="font-semibold text-sm min-w-40 text-center" style={{ color: C.textPrimary }}>
          {MONTHS[month - 1]} {year}
        </span>
        <button onClick={nextMonth} className="p-1 rounded-lg transition-colors" style={{ color: C.textMuted }}
          onMouseEnter={e => (e.currentTarget.style.color = C.textPrimary)}
          onMouseLeave={e => (e.currentTarget.style.color = C.textMuted)}
        >
          <Ico.ChevronRight size={14} color="currentColor" />
        </button>
      </div>

      {/* Anomaly banner */}
      {hasAnomalies && (
        <Banner
          icon={<Ico.Alert size={16} color={C.amber} />}
          title="Anomalies détectées"
          sub="Certains employés ont des absences non justifiées. Vérifiez avant de générer la paie."
          color={C.amber}
        />
      )}

      {/* Global totals */}
      {report.length > 0 && (
        <div className="grid grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: 'Jours présents', value: totals.present,          color: C.emerald,   suffix: '' },
            { label: 'Absences',       value: totals.absent,           color: C.red,        suffix: '' },
            { label: 'Congés',         value: totals.leave,            color: C.cyan,       suffix: '' },
            { label: 'H.Sup ×10%',    value: fmt2(totals.ot10),       color: '#a3e635',   suffix: 'h' },
            { label: 'H.Sup ×25%',    value: fmt2(totals.ot25),       color: C.amber,     suffix: 'h' },
            { label: 'H.Sup ×50%',    value: fmt2(totals.ot50),       color: '#f97316',   suffix: 'h' },
            { label: 'H.Sup ×100%',   value: fmt2(totals.ot100),      color: C.red,        suffix: 'h' },
          ].map(({ label, value, color, suffix }) => (
            <Card key={label} className="px-4 py-3.5 text-center">
              <p className="text-lg font-bold" style={{ color }}>
                {value}{suffix}
              </p>
              <p className="text-[10px] mt-0.5 leading-tight" style={{ color: C.textMuted }}>{label}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Table */}
      {loading ? <LoadingInline /> : report.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Ico.BarChart size={22} color={C.textMuted} />}
            title={`Aucune donnée pour ${MONTHS[month - 1]} ${year}`}
          />
        </Card>
      ) : (
        <Card>
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: `1px solid ${C.border}` }}
          >
            <p className="text-sm font-semibold" style={{ color: C.textPrimary }}>
              {report.length} employé{report.length > 1 ? 's' : ''} — {MONTHS[month - 1]} {year}
            </p>
            <p className="text-xs" style={{ color: C.textMuted }}>Variables à reporter dans la paie</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <Th>Employé</Th>
                  <Th align="center">Présents</Th>
                  <Th align="center">Absents</Th>
                  <Th align="center">Congés</Th>
                  <Th align="center">H.Sup ×10%</Th>
                  <Th align="center">H.Sup ×25%</Th>
                  <Th align="center">H.Sup ×50%</Th>
                  <Th align="center">H.Sup ×100%</Th>
                  <Th align="center">Statut</Th>
                </tr>
              </thead>
              <tbody>
                {report.map((row: any, i) => (
                  <Tr key={row.employeeId}>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={row.name ?? '??'} size={30} index={i} />
                        <div>
                          <p className="text-sm font-medium" style={{ color: C.textPrimary }}>{row.name}</p>
                          {row.department && (
                            <p className="text-[10px]" style={{ color: C.textMuted }}>{row.department}</p>
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
                      <span style={{ color: C.cyan }}>{row.daysOnLeave ?? 0}</span>
                    </Td>
                    <Td className="text-center">
                      <span className="text-xs font-mono" style={{ color: (row.overtime10 ?? 0) > 0 ? '#a3e635' : C.textMuted }}>
                        {fmt2(row.overtime10 ?? 0)}h
                      </span>
                    </Td>
                    <Td className="text-center">
                      <span className="text-xs font-mono" style={{ color: (row.overtime25 ?? 0) > 0 ? C.amber : C.textMuted }}>
                        {fmt2(row.overtime25 ?? 0)}h
                      </span>
                    </Td>
                    <Td className="text-center">
                      <span className="text-xs font-mono" style={{ color: (row.overtime50 ?? 0) > 0 ? '#f97316' : C.textMuted }}>
                        {fmt2(row.overtime50 ?? 0)}h
                      </span>
                    </Td>
                    <Td className="text-center">
                      <span className="text-xs font-mono" style={{ color: (row.overtime100 ?? 0) > 0 ? C.red : C.textMuted }}>
                        {fmt2(row.overtime100 ?? 0)}h
                      </span>
                    </Td>
                    <Td className="text-center">
                      <Badge
                        label={row.status === 'perfect' ? '✓ OK' : '⚠ À vérifier'}
                        variant={row.status === 'perfect' ? 'success' : 'warning'}
                      />
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}