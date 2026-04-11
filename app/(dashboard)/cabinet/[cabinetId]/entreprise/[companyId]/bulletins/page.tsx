'use client';

/**
 * Page bulletins — vue cabinet
 * Route : /cabinet/[cabinetId]/entreprise/[companyId]/bulletins
 * API INCHANGÉE — UX améliorée
 */

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/services/api';
import {
  C, Ico, Card, Badge, Avatar, Btn,
  PageHeader, SectionHeader, TableShell, Th, Tr, Td,
  EmptyState, LoadingInline,
} from '@/components/cabinet/cabinet-ui';

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const fmt = (n: number) => new Intl.NumberFormat('fr-CG', { maximumFractionDigits: 0 }).format(n);

interface Payroll {
  id: string;
  employee: { id: string; firstName: string; lastName: string; position: string };
  grossSalary: number;
  netSalary: number;
  totalEmployerCost: number;
  cnssEmployer: number;
  tusTotal: number;
  status: 'DRAFT' | 'VALIDATED' | 'PAID';
  month: number;
  year: number;
}

const STATUS_BADGE: Record<string, { label: string; variant: any }> = {
  DRAFT:     { label: 'Brouillon', variant: 'default'  },
  VALIDATED: { label: 'Validé',    variant: 'info'     },
  PAID:      { label: 'Payé',      variant: 'success'  },
};

export default function BulletinsPage() {
  const params       = useParams();
  const searchParams = useSearchParams();
  const router       = useRouter();
  const cabinetId    = params.cabinetId as string;
  const companyId    = params.companyId as string;

  const month = Number(searchParams.get('month') ?? new Date().getMonth() + 1);
  const year  = Number(searchParams.get('year')  ?? new Date().getFullYear());

  const [payrolls,  setPayrolls]  = useState<Payroll[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    api.get(`/payrolls?companyId=${companyId}&month=${month}&year=${year}&limit=200`)
      .then((r: any) => setPayrolls(r.data ?? r))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [companyId, month, year]);

  const toggleSelect = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const selectAll = () =>
    setSelected(selected.length === payrolls.length ? [] : payrolls.map(p => p.id));

  const validateAll = async () => {
    for (const id of (selected.length ? selected : payrolls.map(p => p.id))) {
      await api.patch(`/payrolls/${id}`, { status: 'VALIDATED' }).catch(() => null);
    }
    setPayrolls(prev => prev.map(p =>
      (!selected.length || selected.includes(p.id)) ? { ...p, status: 'VALIDATED' } : p,
    ));
  };

  const exportPDF = async () => {
    setExporting(true);
    try {
      const ids  = selected.length ? selected : payrolls.map(p => p.id);
      const blob: any = await api.post('/payrolls/export/batch-pdf', { payrollIds: ids });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `bulletins-${MONTHS[month - 1]}-${year}.pdf`;
      a.click();
    } catch (e: any) {
      alert(`Erreur export : ${e.message}`);
    } finally {
      setExporting(false);
    }
  };

  const exportSage = async () => {
    setExporting(true);
    try {
      const ids  = selected.length ? selected : payrolls.map(p => p.id);
      const blob: any = await api.post('/payrolls/export/sage', { payrollIds: ids, companyId });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `sage-paie-${month}-${year}.csv`;
      a.click();
    } catch (e: any) {
      alert(`Erreur export Sage : ${e.message}`);
    } finally {
      setExporting(false);
    }
  };

  const totals = payrolls.reduce((acc, p) => ({
    brut: acc.brut + p.grossSalary,
    net:  acc.net  + p.netSalary,
    cnss: acc.cnss + p.cnssEmployer,
    tus:  acc.tus  + p.tusTotal,
    cout: acc.cout + p.totalEmployerCost,
  }), { brut: 0, net: 0, cnss: 0, tus: 0, cout: 0 });

  const KPI_TOTALS = [
    { label: 'Masse brute',    value: totals.brut, color: C.textPrimary },
    { label: 'Net à payer',    value: totals.net,  color: C.emerald     },
    { label: 'CNSS patronale', value: totals.cnss, color: C.violet      },
    { label: 'TUS',            value: totals.tus,  color: C.violet      },
    { label: 'Coût employeur', value: totals.cout, color: C.amber       },
  ];

  return (
    <div className="p-6 space-y-5" style={{ minHeight: '100vh', background: C.pageBg }}>

      {/* Header */}
      <PageHeader
        title={`Bulletins — ${MONTHS[month - 1]} ${year}`}
        sub={`${payrolls.length} bulletin${payrolls.length > 1 ? 's' : ''} généré${payrolls.length > 1 ? 's' : ''}`}
        icon={<Ico.Payroll size={18} color={C.indigoL} />}
        action={
          <div className="flex items-center gap-2">
            <Btn
              variant="success"
              size="sm"
              icon={<Ico.Check size={13} color={C.emerald} />}
              onClick={validateAll}
            >
              {selected.length ? `Valider (${selected.length})` : 'Valider tout'}
            </Btn>
            <Btn
              variant="ghost"
              size="sm"
              icon={exporting ? <Ico.Loader size={13} /> : <Ico.Download size={13} color={C.textSecondary} />}
              onClick={exportPDF}
              disabled={exporting}
            >
              PDF
            </Btn>
            <Btn
              variant="ghost"
              size="sm"
              icon={exporting ? <Ico.Loader size={13} /> : <Ico.Download size={13} color={C.textSecondary} />}
              onClick={exportSage}
              disabled={exporting}
            >
              Export Sage
            </Btn>
          </div>
        }
      />

      {/* KPI Totals */}
      <div className="grid grid-cols-5 gap-3">
        {KPI_TOTALS.map(({ label, value, color }) => (
          <Card key={label} className="px-4 py-3.5">
            <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: C.textMuted }}>{label}</p>
            <p className="text-sm font-bold" style={{ color }}>
              {fmt(value)}{' '}
              <span className="text-[10px] font-normal" style={{ color: C.textMuted }}>FCFA</span>
            </p>
          </Card>
        ))}
      </div>

      {/* Table */}
      {loading ? <LoadingInline /> : payrolls.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Ico.Payroll size={22} color={C.textMuted} />}
            title="Aucun bulletin généré"
            sub="Saisissez les variables de paie pour générer les bulletins"
          />
        </Card>
      ) : (
        <TableShell>
          <thead>
            <tr>
              <Th>
                <input
                  type="checkbox"
                  checked={selected.length === payrolls.length && payrolls.length > 0}
                  onChange={selectAll}
                  className="rounded"
                />
              </Th>
              <Th>Employé</Th>
              <Th align="right">Brut</Th>
              <Th align="right">Net</Th>
              <Th align="right">Coût emp.</Th>
              <Th align="center">Statut</Th>
              <Th align="center">Bulletin</Th>
            </tr>
          </thead>
          <tbody>
            {payrolls.map((p, i) => {
              const sb = STATUS_BADGE[p.status];
              return (
                <Tr key={p.id}>
                  <Td>
                    <input
                      type="checkbox"
                      checked={selected.includes(p.id)}
                      onChange={() => toggleSelect(p.id)}
                      className="rounded"
                    />
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={`${p.employee.firstName} ${p.employee.lastName}`} size={30} index={i} />
                      <div>
                        <p className="text-sm font-medium" style={{ color: C.textPrimary }}>
                          {p.employee.firstName} {p.employee.lastName}
                        </p>
                        <p className="text-xs" style={{ color: C.textMuted }}>{p.employee.position}</p>
                      </div>
                    </div>
                  </Td>
                  <Td className="text-right">
                    <span style={{ color: C.textSecondary }}>{fmt(p.grossSalary)}</span>
                  </Td>
                  <Td className="text-right">
                    <span className="font-semibold" style={{ color: C.emerald }}>{fmt(p.netSalary)}</span>
                  </Td>
                  <Td className="text-right">
                    <span style={{ color: C.violet }}>{fmt(p.totalEmployerCost)}</span>
                  </Td>
                  <Td className="text-center">
                    <Badge label={sb.label} variant={sb.variant} />
                  </Td>
                  <Td className="text-center">
                    <button
                      onClick={() => router.push(`/cabinet/${cabinetId}/entreprise/${companyId}/bulletins/${p.id}`)}
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ color: C.textMuted }}
                      onMouseEnter={e => (e.currentTarget.style.color = C.textPrimary)}
                      onMouseLeave={e => (e.currentTarget.style.color = C.textMuted)}
                    >
                      <Ico.Eye size={14} color="currentColor" />
                    </button>
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