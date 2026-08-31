'use client';

/**
 * Page employés — vue cabinet (lecture)
 * Route : /cabinet/[cabinetId]/entreprise/[companyId]/employes
 * API INCHANGÉE — UX améliorée
 */

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/services/api';
import {
  C, Ico, Card, Badge, Avatar, Btn,
  PageHeader, SearchBar, TableShell, Th, Tr, Td,
  EmptyState, LoadingInline, InfoNote,
} from '@/components/cabinet/cabinet-ui';

const fmt = (n: number) => new Intl.NumberFormat('fr-CG', { maximumFractionDigits: 0 }).format(n);

interface Employee {
  id: string; firstName: string; lastName: string;
  position: string; department?: { name: string };
  baseSalary: number; contractType: string; status: string;
  hireDate: string; fiscalParts?: number;
  appliesIts?: boolean; appliesCnss?: boolean;
}

const contractBadge: Record<string, any> = {
  CDI: 'success', CDD: 'info', STAGE: 'warning', FREELANCE: 'default',
};

export default function EmployesCabinetPage() {
  const params    = useParams();
  const router    = useRouter();
  const cabinetId = params.cabinetId as string;
  const companyId = params.companyId as string;

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');

  useEffect(() => {
    api.get(`/employees?companyId=${companyId}&status=ACTIVE&limit=200`)
      .then((r: any) => setEmployees(r.data ?? r))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [companyId]);

  const filtered = employees.filter(e =>
    `${e.firstName} ${e.lastName} ${e.position}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-6 space-y-5" style={{ minHeight: '100vh', background: C.pageBg }}>

      <PageHeader
        title="Employés"
        sub={`${employees.length} employés actifs · Vue lecture seule`}
        icon={<Ico.Users size={18} color={C.cyan} />}
        action={
          <Btn
            variant="primary"
            icon={<Ico.Dollar size={14} color="#fff" />}
            onClick={() => router.push(`/cabinet/${cabinetId}/entreprise/${companyId}/paie`)}
          >
            Saisir les variables du mois
          </Btn>
        }
      />

      <div className="max-w-sm">
        <SearchBar value={search} onChange={setSearch} placeholder="Rechercher un employé..." />
      </div>

      {loading ? <LoadingInline /> : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Ico.Users size={22} color={C.textMuted} />}
            title={search ? 'Aucun résultat' : 'Aucun employé actif'}
          />
        </Card>
      ) : (
        <TableShell>
          <thead>
            <tr>
              <Th>Employé</Th>
              <Th>Département</Th>
              <Th>Contrat</Th>
              <Th align="right">Salaire de base</Th>
              <Th align="center">Parts fisc.</Th>
              <Th align="center">ITS</Th>
              <Th align="center">CNSS</Th>
              <Th>Embauche</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((emp, i) => (
              <Tr key={emp.id}>
                <Td>
                  <div className="flex items-center gap-2.5">
                    <Avatar name={`${emp.firstName} ${emp.lastName}`} size={32} index={i} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: C.textPrimary }}>
                        {emp.firstName} {emp.lastName}
                      </p>
                      <p className="text-xs" style={{ color: C.textMuted }}>{emp.position}</p>
                    </div>
                  </div>
                </Td>
                <Td><span className="text-xs" style={{ color: C.textSecondary }}>{emp.department?.name ?? '—'}</span></Td>
                <Td>
                  <Badge label={emp.contractType} variant={contractBadge[emp.contractType] ?? 'default'} />
                </Td>
                <Td className="text-right">
                  <span className="text-sm font-semibold" style={{ color: C.cyan }}>
                    {fmt(emp.baseSalary)}
                  </span>
                  <span className="text-[10px] ml-1" style={{ color: C.textMuted }}>F</span>
                </Td>
                <Td className="text-center">
                  <span className="text-xs" style={{ color: C.textSecondary }}>{emp.fiscalParts ?? 1}</span>
                </Td>
                <Td className="text-center">
                  <span style={{ color: emp.appliesIts !== false ? C.emerald : C.textMuted }}>
                    {emp.appliesIts !== false ? '✓' : '✗'}
                  </span>
                </Td>
                <Td className="text-center">
                  <span style={{ color: emp.appliesCnss !== false ? C.emerald : C.textMuted }}>
                    {emp.appliesCnss !== false ? '✓' : '✗'}
                  </span>
                </Td>
                <Td>
                  <span className="text-xs" style={{ color: C.textSecondary }}>
                    {new Date(emp.hireDate).toLocaleDateString('fr-FR')}
                  </span>
                </Td>
              </Tr>
            ))}
          </tbody>
        </TableShell>
      )}

      <InfoNote>
        Cette vue est en lecture seule. La gestion des profils (embauche, contrats, augmentations)
        est effectuée directement par l'entreprise. En tant que cabinet, vous intervenez uniquement
        sur les variables de paie mensuelles.
      </InfoNote>
    </div>
  );
}