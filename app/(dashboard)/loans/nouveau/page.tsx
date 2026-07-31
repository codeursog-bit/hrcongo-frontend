'use client';

// ============================================================================
// 📁 app/(dashboard)/loans/nouveau/page.tsx
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Banknote, Package, HelpCircle, Wallet, Send, Loader2, CheckCircle2,
  ArrowLeft, Search, Eye,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import FinanceSubNav from '@/components/FinanceSubNav';
import LoanRequestPrintable from '@/components/LoanRequestPrintable';
import DocumentPreviewModal from '@/components/loans/DocumentPreviewModal';

type ReqType = 'ARGENT' | 'MARCHANDISE' | 'AVANCE' | 'AUTRE';

const TYPE_OPTIONS: Array<{ value: ReqType; label: string; icon: any; hint: string }> = [
  { value: 'ARGENT',      label: 'Prêt en argent',   icon: Banknote,    hint: 'Remboursement mensuel sur plusieurs mois' },
  { value: 'MARCHANDISE', label: 'Prêt marchandise', icon: Package,     hint: 'Achat de marchandise à rembourser' },
  { value: 'AVANCE',      label: 'Avance sur salaire', icon: Wallet,    hint: 'Montant unique, déduit un mois donné' },
  { value: 'AUTRE',       label: 'Autre',            icon: HelpCircle,  hint: 'Cas particulier, à motiver' },
];

const FINANCE_ROLES = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'];

function nextMonthDefault() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

export default function NouvellePretAvancePage() {
  const router = useRouter();
  const { bp } = useBasePath();

  const [userRole, setUserRole] = useState('');
  const [employee, setEmployee] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);

  const [employeesList, setEmployeesList] = useState<any[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [onBehalf, setOnBehalf] = useState(false);

  const [type, setType] = useState<ReqType>('ARGENT');
  const [amount, setAmount] = useState('');
  const [monthlyRepayment, setMonthlyRepayment] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState('');
  const deductDefault = nextMonthDefault();
  const [deductMonth, setDeductMonth] = useState(deductDefault.month);
  const [deductYear, setDeductYear] = useState(deductDefault.year);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFinance = FINANCE_ROLES.includes(userRole);
  const isAdvance = type === 'AVANCE';

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) setUserRole(JSON.parse(stored).role || '');
    } catch {}
    (async () => {
      try { setEmployee(await api.get('/employees/me')); } catch {}
      try { const me: any = await api.get('/auth/me'); setCompany(me?.company ?? null); } catch {}
    })();
  }, []);

  useEffect(() => {
    if (!onBehalf) return;
    (async () => {
      try { setEmployeesList((await api.get('/employees/simple')) || []); } catch {}
    })();
  }, [onBehalf]);

  const filteredEmployees = useMemo(() => {
    if (!employeeSearch.trim()) return employeesList.slice(0, 30);
    const q = employeeSearch.toLowerCase();
    return employeesList.filter(e => `${e.firstName} ${e.lastName}`.toLowerCase().includes(q)).slice(0, 30);
  }, [employeesList, employeeSearch]);

  const targetEmployee = onBehalf ? employeesList.find(e => e.id === selectedEmployeeId) : employee;

  const durationMonths = amount && monthlyRepayment ? Math.ceil(Number(amount) / Number(monthlyRepayment)) : undefined;
  const endDate = useMemo(() => {
    if (!durationMonths) return startDate;
    const d = new Date(startDate);
    d.setMonth(d.getMonth() + durationMonths);
    return d.toISOString().slice(0, 10);
  }, [startDate, durationMonths]);

  const canSubmit = !!amount && Number(amount) > 0 && reason.trim().length >= 3
    && (isAdvance || (!!monthlyRepayment && Number(monthlyRepayment) > 0))
    && (!onBehalf || !!selectedEmployeeId) && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(null);
    try {
      if (isAdvance) {
        await api.post('/loans/advances', {
          employeeId: onBehalf ? selectedEmployeeId : undefined,
          amount: Number(amount),
          deductMonth, deductYear,
          reason: reason.trim(),
        });
      } else {
        await api.post('/loans', {
          employeeId: onBehalf ? selectedEmployeeId : undefined,
          type,
          amount: Number(amount),
          monthlyRepayment: Number(monthlyRepayment),
          startDate,
          endDate,
          reason: reason.trim(),
        });
      }
      setIsDone(true);
    } catch (e: any) {
      setError(e?.message || "Erreur lors de l'envoi de la demande");
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewData = {
    reference: 'XX-XXXXXXXX',
    company: { legalName: company?.legalName, tradeName: company?.tradeName, logo: company?.logo, rccmNumber: company?.rccmNumber, taxNumber: company?.taxNumber, address: company?.address, phone: company?.phone },
    employee: { firstName: targetEmployee?.firstName || '', lastName: targetEmployee?.lastName || '', position: targetEmployee?.position, phone: targetEmployee?.phone, departmentName: targetEmployee?.department?.name },
    docType: type,
    reason: reason || 'Motif…',
    amount: amount || 0,
    requestedAt: new Date(),
    monthlyRepayment: monthlyRepayment || undefined,
    durationMonths,
    status: 'PENDING',
  };

  if (isDone) {
    return (
      <div className="max-w-lg mx-auto py-24 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} />
        </motion.div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Demande envoyée</h1>
        <p className="text-gray-400 text-sm mb-8">Votre demande a été transmise pour validation.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => router.push(bp('/loans/mon-espace'))} className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-semibold text-sm">Voir mes demandes</button>
          <button onClick={() => { setIsDone(false); setAmount(''); setMonthlyRepayment(''); setReason(''); }} className="px-5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl font-semibold text-sm text-gray-600 dark:text-gray-300">Nouvelle demande</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1300px] mx-auto pb-24 space-y-6">
      <FinanceSubNav userRole={userRole} />

      <div className="flex items-center gap-3">
        <button onClick={() => router.push(bp('/loans'))} className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"><ArrowLeft size={18} /></button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nouvelle demande</h1>
          <p className="text-gray-400 text-sm">Prêt (argent / marchandise) ou avance sur salaire</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-5">
        <div className="space-y-5">
          {isFinance && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pour qui ?</label>
                <button onClick={() => { setOnBehalf(!onBehalf); setSelectedEmployeeId(''); }} className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${onBehalf ? 'bg-sky-500' : 'bg-gray-200 dark:bg-gray-600'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${onBehalf ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
              {!onBehalf ? <p className="text-sm text-gray-500">Pour moi-même</p> : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={employeeSearch} onChange={e => setEmployeeSearch(e.target.value)} placeholder="Rechercher un employé…" className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-sm" />
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {filteredEmployees.map(e => (
                      <button key={e.id} onClick={() => setSelectedEmployeeId(e.id)} className={`w-full text-left px-3 py-2 rounded-lg text-sm ${selectedEmployeeId === e.id ? 'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 font-semibold' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                        {e.firstName} {e.lastName}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">Type de demande</label>
            <div className="grid grid-cols-1 gap-2">
              {TYPE_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const active = type === opt.value;
                return (
                  <button key={opt.value} onClick={() => setType(opt.value)} className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${active ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200'}`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${active ? 'bg-sky-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}><Icon size={18} /></div>
                    <div><p className="font-semibold text-sm text-gray-900 dark:text-white">{opt.label}</p><p className="text-xs text-gray-400">{opt.hint}</p></div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Montant demandé (FCFA)</label>
              <input type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-sm" />
            </div>

            {!isAdvance ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Mensualité (FCFA)</label>
                  <input type="number" min="1" value={monthlyRepayment} onChange={e => setMonthlyRepayment(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Date de départ</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-sm" />
                </div>
                {durationMonths && <p className="text-xs text-sky-600 dark:text-sky-400 col-span-2">Durée estimée : {durationMonths} mois (jusqu&apos;au {new Date(endDate).toLocaleDateString('fr-FR')})</p>}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Mois de déduction</label>
                  <select value={deductMonth} onChange={e => setDeductMonth(Number(e.target.value))} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-sm">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Année</label>
                  <input type="number" value={deductYear} onChange={e => setDeductYear(Number(e.target.value))} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-sm" />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Motif</label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-sm resize-none" />
            </div>
          </div>

          {error && <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl">{error}</div>}

          <div className="flex gap-2">
            <button onClick={handleSubmit} disabled={!canSubmit} className="flex-1 py-3.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-sky-500/30">
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />} Envoyer la demande
            </button>
            <button onClick={() => setShowPreviewModal(true)} className="px-4 py-3.5 border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 shrink-0">
              <Eye size={18} />
            </button>
          </div>
        </div>
      </div>

      <DocumentPreviewModal open={showPreviewModal} onClose={() => setShowPreviewModal(false)}>
        <LoanRequestPrintable id="preview-loan" data={previewData as any} />
      </DocumentPreviewModal>
    </div>
  );
}
