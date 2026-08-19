'use client';

// ============================================================================
// 📁 app/(dashboard)/contrats/employe/[employeeId]/page.tsx
//
// Fiche contrat d'un employé : identité, poste, et historique des documents
// de contrat déjà générés (avec aperçu/téléchargement), + CTA pour en
// générer un nouveau.
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, FileSignature, Loader2, Eye, Download, Plus,
  Briefcase, MapPin, Calendar, Wallet, FileX2, Clock, Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';

interface GeneratedContract {
  id: string;
  kind: 'CONTRAT_TRAVAIL' | 'PRESTATION_SERVICES' | 'STAGE';
  contractDuration: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  totalGross: number;
  netPay: number;
  fileUrl: string | null;
  fileName: string | null;
  generatedAt: string;
  snapshot: Record<string, any>;
}

interface EmployeeSummary {
  id: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
  position: string;
  department?: { name: string };
  baseSalary: number;
  photoUrl?: string | null;
}

const KIND_LABEL: Record<string, string> = {
  CONTRAT_TRAVAIL: 'Contrat de travail',
  PRESTATION_SERVICES: 'Prestation de services',
  STAGE: 'Convention de stage',
};

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0));
const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function EmployeeContractPage() {
  const params = useParams();
  const router = useRouter();
  const { bp } = useBasePath();
  const employeeId = params.employeeId as string;

  const [employee, setEmployee] = useState<EmployeeSummary | null>(null);
  const [contracts, setContracts] = useState<GeneratedContract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!employeeId) return;
    (async () => {
      setLoading(true);
      try {
        const [emp, list] = await Promise.all([
          api.get(`/employees/${employeeId}`),
          api.get(`/contracts/generation/employee/${employeeId}`),
        ]);
        setEmployee(emp as any);
        setContracts(list as any);
      } finally {
        setLoading(false);
      }
    })();
  }, [employeeId]);

  if (loading) {
    return <div className="flex justify-center py-24"><Loader2 className="w-6 h-6 text-indigo-500 animate-spin" /></div>;
  }

  if (!employee) {
    return <div className="text-center py-24 text-slate-400 text-sm">Employé introuvable</div>;
  }

  const latest = contracts[0];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <button onClick={() => router.push(bp('/contrats'))} className="hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Contrats
        </button>
        <span>/</span>
        <span className="text-slate-600 dark:text-slate-300 font-medium">{employee.firstName} {employee.lastName}</span>
      </div>

      {/* Carte employé */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700/60 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-lg shrink-0">
          {employee.firstName[0]}{employee.lastName[0]}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-black text-slate-900 dark:text-white">{employee.firstName} {employee.lastName}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> {employee.position}</span>
            {employee.department && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {employee.department.name}</span>}
            <span>Mat. {employee.employeeNumber}</span>
          </div>
        </div>
        <button onClick={() => router.push(bp(`/contrats/generer?employeeId=${employee.id}`))}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-500/20 transition-all shrink-0">
          <Plus className="w-4 h-4" /> Générer un contrat
        </button>
      </div>

      {/* Contrat en cours — mis en avant */}
      {latest && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Dernier document généré</p>
          <ContractCard contract={latest} featured />
        </div>
      )}

      {/* Historique */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
          Historique {contracts.length > 1 && `(${contracts.length})`}
        </p>

        {contracts.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 p-10 text-center">
            <FileX2 className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Aucun contrat généré pour cet employé</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">Générez son premier contrat en quelques secondes.</p>
            <button onClick={() => router.push(bp(`/contrats/generer?employeeId=${employee.id}`))}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-500/20 transition-all">
              <Sparkles className="w-4 h-4" /> Générer maintenant
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {contracts.slice(latest ? 1 : 0).map(c => <ContractCard key={c.id} contract={c} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function ContractCard({ contract, featured }: { contract: GeneratedContract; featured?: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 shadow-sm ${
        featured
          ? 'bg-gradient-to-br from-indigo-500 to-violet-500 border-transparent text-white'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700/60'
      }`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${featured ? 'bg-white/15' : 'bg-indigo-50 dark:bg-indigo-950/40'}`}>
        <FileSignature className={`w-5 h-5 ${featured ? 'text-white' : 'text-indigo-500'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`text-sm font-bold ${featured ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
            {KIND_LABEL[contract.kind] || contract.kind}
          </p>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${featured ? 'bg-white/15 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
            {contract.contractDuration === 'DETERMINEE' ? 'Déterminée' : 'Indéterminée'}
          </span>
        </div>
        <div className={`flex items-center gap-3 mt-1 text-xs flex-wrap ${featured ? 'text-white/70' : 'text-slate-400'}`}>
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Généré le {fmtDate(contract.generatedAt)}</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Début {fmtDate(contract.startDate)}</span>
          {contract.endDate && <span>Fin {fmtDate(contract.endDate)}</span>}
          <span className="flex items-center gap-1"><Wallet className="w-3 h-3" /> Net {fmt(contract.netPay)} FCFA</span>
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        {contract.fileUrl && (
          <>
            <a href={contract.fileUrl} target="_blank" rel="noreferrer"
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-colors ${featured ? 'bg-white/15 hover:bg-white/25 text-white' : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
              <Eye className="w-3.5 h-3.5" /> Voir
            </a>
            <a href={contract.fileUrl} download
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-colors ${featured ? 'bg-white text-indigo-600 hover:bg-white/90' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
              <Download className="w-3.5 h-3.5" /> Télécharger
            </a>
          </>
        )}
      </div>
    </motion.div>
  );
}
