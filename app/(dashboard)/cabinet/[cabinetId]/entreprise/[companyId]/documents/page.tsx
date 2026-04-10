'use client';

// app/(dashboard)/cabinet/[cabinetId]/entreprise/[companyId]/documents/page.tsx

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { FileText, Loader2, Download, Eye, Search, Plus, Trash2 } from 'lucide-react';
import { api } from '@/services/api';

const DOC_TYPES: Record<string, { label: string; color: string }> = {
  CONTRACT:      { label: 'Contrat',      color: 'text-blue-400' },
  PAYSLIP:       { label: 'Bulletin',     color: 'text-emerald-400' },
  CERTIFICATE:   { label: 'Attestation',  color: 'text-purple-400' },
  AMENDMENT:     { label: 'Avenant',      color: 'text-amber-400' },
  OTHER:         { label: 'Autre',        color: 'text-gray-400' },
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
    return !search ||
      d.name?.toLowerCase().includes(q) ||
      d.employee?.firstName?.toLowerCase().includes(q) ||
      d.employee?.lastName?.toLowerCase().includes(q);
  });

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-gray-600" /></div>;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText size={20} className="text-cyan-400" /> Documents
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">{docs.length} document{docs.length > 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Recherche */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un document..."
          className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 outline-none focus:border-white/30" />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <FileText size={36} className="mx-auto mb-3 text-gray-700" />
          <p>{search ? 'Aucun résultat' : 'Aucun document'}</p>
        </div>
      ) : (
        <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  {['Document','Type','Employé','Date','Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((doc: any) => {
                  const dt = DOC_TYPES[doc.type] ?? DOC_TYPES['OTHER'];
                  return (
                    <tr key={doc.id} className="hover:bg-white/3 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-white/5 border border-white/8 rounded-lg flex items-center justify-center shrink-0">
                            <FileText size={14} className="text-gray-400" />
                          </div>
                          <p className="text-white text-sm truncate max-w-xs">{doc.name || 'Document sans nom'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs ${dt.color}`}>{dt.label}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {doc.employee ? `${doc.employee.firstName} ${doc.employee.lastName}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('fr-FR') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {doc.fileUrl && (
                            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                              className="p-1.5 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors">
                              <Eye size={14} />
                            </a>
                          )}
                          {doc.fileUrl && (
                            <a href={doc.fileUrl} download
                              className="p-1.5 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors">
                              <Download size={14} />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}