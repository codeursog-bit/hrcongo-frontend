'use client';

// app/(dashboard)/cabinet/[cabinetId]/entreprise/[companyId]/documents/page.tsx
// API INCHANGÉE — UX améliorée

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/services/api';
import {
  C, Ico, Card, Badge, Avatar,
  PageHeader, SearchBar, TableShell, Th, Tr, Td,
  EmptyState, LoadingInline,
} from '@/components/cabinet/cabinet-ui';

const DOC_TYPES: Record<string, { label: string; variant: any; color: string }> = {
  CONTRACT:    { label: 'Contrat',     variant: 'info',    color: C.cyan    },
  PAYSLIP:     { label: 'Bulletin',    variant: 'success', color: C.emerald },
  CERTIFICATE: { label: 'Attestation', variant: 'purple',  color: C.violet  },
  AMENDMENT:   { label: 'Avenant',     variant: 'warning', color: C.amber   },
  OTHER:       { label: 'Autre',       variant: 'default', color: C.textMuted },
};

export default function CabinetDocumentsPage() {
  const params    = useParams();
  const companyId = params.companyId as string;

  const [docs,    setDocs]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');

  useEffect(() => {
    api.get(`/documents?companyId=${companyId}`)
      .then((r: any) => setDocs(Array.isArray(r) ? r : r?.data ?? []))
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, [companyId]);

  const filtered = docs.filter(d => {
    const q = search.toLowerCase();
    return !search
      || d.name?.toLowerCase().includes(q)
      || d.employee?.firstName?.toLowerCase().includes(q)
      || d.employee?.lastName?.toLowerCase().includes(q);
  });

  return (
    <div className="p-6 space-y-5" style={{ minHeight: '100vh', background: C.pageBg }}>

      <PageHeader
        title="Documents"
        sub={`${docs.length} document${docs.length > 1 ? 's' : ''}`}
        icon={<Ico.Payroll size={18} color={C.cyan} />}
      />

      <div className="max-w-sm">
        <SearchBar value={search} onChange={setSearch} placeholder="Rechercher un document..." />
      </div>

      {loading ? <LoadingInline /> : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Ico.Payroll size={22} color={C.textMuted} />}
            title={search ? 'Aucun résultat' : 'Aucun document'}
            sub={search ? undefined : 'Les documents RH apparaîtront ici'}
          />
        </Card>
      ) : (
        <TableShell>
          <thead>
            <tr>
              <Th>Document</Th>
              <Th>Type</Th>
              <Th>Employé</Th>
              <Th>Date</Th>
              <Th align="center">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((doc: any, i) => {
              const dt = DOC_TYPES[doc.type] ?? DOC_TYPES['OTHER'];
              return (
                <Tr key={doc.id}>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `${dt.color}15`, border: `1px solid ${dt.color}25` }}
                      >
                        <Ico.FileText size={13} color={dt.color} />
                      </div>
                      <p className="text-sm font-medium truncate max-w-xs" style={{ color: C.textPrimary }}>
                        {doc.name || 'Document sans nom'}
                      </p>
                    </div>
                  </Td>
                  <Td>
                    <Badge label={dt.label} variant={dt.variant} />
                  </Td>
                  <Td>
                    {doc.employee ? (
                      <div className="flex items-center gap-2">
                        <Avatar
                          name={`${doc.employee.firstName} ${doc.employee.lastName}`}
                          size={24}
                          index={i}
                        />
                        <span className="text-xs" style={{ color: C.textSecondary }}>
                          {doc.employee.firstName} {doc.employee.lastName}
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: C.textMuted }}>—</span>
                    )}
                  </Td>
                  <Td>
                    <span className="text-xs" style={{ color: C.textSecondary }}>
                      {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('fr-FR') : '—'}
                    </span>
                  </Td>
                  <Td className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      {doc.fileUrl && (
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: C.textMuted }}
                          onMouseEnter={e => (e.currentTarget.style.color = C.textPrimary)}
                          onMouseLeave={e => (e.currentTarget.style.color = C.textMuted)}
                        >
                          <Ico.Eye size={14} color="currentColor" />
                        </a>
                      )}
                      {doc.fileUrl && (
                        <a
                          href={doc.fileUrl}
                          download
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: C.textMuted }}
                          onMouseEnter={e => (e.currentTarget.style.color = C.textPrimary)}
                          onMouseLeave={e => (e.currentTarget.style.color = C.textMuted)}
                        >
                          <Ico.Download size={14} color="currentColor" />
                        </a>
                      )}
                    </div>
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