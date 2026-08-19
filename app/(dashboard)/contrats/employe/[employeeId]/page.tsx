'use client';

// ============================================================================
// 📁 app/(dashboard)/contrats/employe/[employeeId]/page.tsx
//
// Fiche contrat d'un employé :
//  1. Fiche d'informations contractuelles actuelles (type, salaire, date
//     d'embauche, ancienneté, poste, catégorie...) — lues depuis la fiche
//     employé elle-même, pas depuis l'historique des documents générés.
//  2. Historique des documents de contrat déjà générés — chaque ligne peut
//     être téléchargée en Word ou prévisualisée en PDF, régénérés à la
//     volée à chaque clic (AUCUN fichier n'est stocké sur le cloud).
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, FileSignature, Loader2, Eye, Download, Plus,
  Briefcase, MapPin, Calendar, Wallet, FileX2, Clock, Sparkles,
  Contact, CalendarClock, Layers,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';

interface GeneratedContract {
  id: string;
  kind: 'CONTRAT_TRAVAIL' | 'PRESTATION_SERVICES' | 'CONSULTANT' | 'STAGE';
  contractDuration: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  totalGross: number;
  netPay: number;
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
  professionalCategory?: string | null;
  department?: { name: string };
  baseSalary: number;
  hireDate: string;
  contractType: string; // CDI | CDD | STAGE | CONSULTANT | PRESTATAIRE | INTERIM...
  contractEndDate?: string | null;
  photoUrl?: string | null;
}

const KIND_LABEL: Record<string, string> = {
  CONTRAT_TRAVAIL: 'Contrat de travail',
  PRESTATION_SERVICES: 'Prestation de services',
  CONSULTANT: 'Consultance',
  STAGE: 'Convention de stage',
};

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0));
const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

function anciennete(hireDate: string): string {
  const start = new Date(hireDate);
  const now = new Date();
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  if (now.getDate() < start.getDate()) months -= 1;
  if (months < 0) { years -= 1; months += 12; }
  if (years <= 0 && months <= 0) return "Moins d'un mois";
  const parts = [];
  if (years > 0) parts.push(`${years} an${years > 1 ? 's' : ''}`);
  if (months > 0) parts.push(`${months} mois`);
  return parts.join(' et ');
}

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

      {/* 🆕 Fiche contrat — infos contractuelles actuelles de l'employé */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700/60 shadow-sm p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-1.5">
          <Contact className="w-3.5 h-3.5" /> Fiche contrat
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <InfoTile icon={Layers} label="Type de contrat" value={employee.contractType} />
          <InfoTile icon={Wallet} label="Salaire de base" value={`${fmt(employee.baseSalary)} FCFA`} />
          <InfoTile icon={Calendar} label="Date d'embauche" value={fmtDate(employee.hireDate)} />
          <InfoTile icon={CalendarClock} label="Ancienneté" value={anciennete(employee.hireDate)} />
          <InfoTile icon={Briefcase} label="Poste" value={employee.position} />
          {employee.professionalCategory && (
            <InfoTile icon={Contact} label="Catégorie" value={employee.professionalCategory} />
          )}
          {employee.contractEndDate && (
            <InfoTile icon={Clock} label="Fin de contrat" value={fmtDate(employee.contractEndDate)} />
          )}
        </div>
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

function InfoTile({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div>
      <p className="flex items-center gap-1 text-[11px] text-slate-400 mb-1"><Icon className="w-3 h-3" /> {label}</p>
      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{value}</p>
    </div>
  );
}

function ContractCard({ contract, featured }: { contract: GeneratedContract; featured?: boolean }) {
  const [downloading, setDownloading] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  const downloadDocx = async () => {
    setDownloading(true);
    try {
      const blob: any = await api.get(`/contracts/generation/${contract.id}/download`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${contract.fileName || 'contrat'}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silencieux — le bouton reprend son état normal, l'utilisateur peut réessayer
    } finally {
      setDownloading(false);
    }
  };

  const openPdf = async () => {
    setPreviewing(true);
    try {
      const blob: any = await api.get(`/contracts/generation/${contract.id}/preview`);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      // silencieux
    } finally {
      setPreviewing(false);
    }
  };

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
        <button onClick={openPdf} disabled={previewing}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-colors disabled:opacity-60 ${featured ? 'bg-white/15 hover:bg-white/25 text-white' : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
          {previewing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />} PDF
        </button>
        <button onClick={downloadDocx} disabled={downloading}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-colors disabled:opacity-60 ${featured ? 'bg-white text-indigo-600 hover:bg-white/90' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
          {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} Word
        </button>
      </div>
    </motion.div>
  );
}