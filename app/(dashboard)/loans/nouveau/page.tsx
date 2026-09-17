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
  // Mode de remboursement, demandé uniquement quand un RH/Admin crée
  // directement pour un employé (le prêt part alors ACTIVE tout de suite,
  // sans passer par un circuit de validation où ce choix serait reposé).
  const [recoverViaPayroll, setRecoverViaPayroll] = useState(true);

  const [type, setType] = useState<ReqType>('ARGENT');
  const [amount, setAmount] = useState('');
  const [durationMonthsInput, setDurationMonthsInput] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState('');
  const deductDefault = nextMonthDefault();
  const [deductMonth, setDeductMonth] = useState(deductDefault.month);
  const [deductYear, setDeductYear] = useState(deductDefault.year);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dette déjà en cours de l'employé (autres prêts/avances non soldés), pour
  // que la personne qui remplit sache où elle en est avant même d'envoyer sa
  // demande. Chargée différemment selon le profil : un employé voit toujours
  // SA PROPRE dette via /loans/me + /loans/advances/me (accessible sans droit
  // finance) ; un RH/Admin qui sélectionne un AUTRE employé (onBehalf) passe
  // par /loans + /loans/advances (réservé finance) filtré côté client.
  const [myLoans, setMyLoans] = useState<any[]>([]);
  const [myAdvances, setMyAdvances] = useState<any[]>([]);
  const [othersLoans, setOthersLoans] = useState<any[]>([]);
  const [othersAdvances, setOthersAdvances] = useState<any[]>([]);
  const [isLoadingDebt, setIsLoadingDebt] = useState(false);

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
      // Ma propre dette (utile aussi bien pour l'employé que pour un RH/Admin
      // qui fait une demande "pour lui-même") — endpoints /me, pas besoin de droit finance.
      try { setMyLoans((await api.get('/loans/me')) || []); } catch {}
      try { setMyAdvances((await api.get('/loans/advances/me')) || []); } catch {}
    })();
  }, []);

  useEffect(() => {
    if (!onBehalf) return;
    (async () => {
      try { setEmployeesList((await api.get('/employees/simple')) || []); } catch {}
      // Liste complète (réservée finance) — filtrée côté client par employé
      // sélectionné pour afficher sa dette existante.
      setIsLoadingDebt(true);
      try { setOthersLoans((await api.get('/loans')) || []); } catch {}
      try { setOthersAdvances((await api.get('/loans/advances')) || []); } catch {}
      setIsLoadingDebt(false);
    })();
  }, [onBehalf]);

  const filteredEmployees = useMemo(() => {
    if (!employeeSearch.trim()) return employeesList.slice(0, 30);
    const q = employeeSearch.toLowerCase();
    return employeesList.filter(e => `${e.firstName} ${e.lastName}`.toLowerCase().includes(q)).slice(0, 30);
  }, [employeesList, employeeSearch]);

  const targetEmployee = onBehalf ? employeesList.find(e => e.id === selectedEmployeeId) : employee;

  // Dette actuellement en cours de l'employé ciblé — uniquement ce qui reste
  // réellement dû (remainingBalance), sur les prêts ACTIFS et avances
  // APPROUVÉES (une dette soldée ne compte plus pour rien).
  const existingDebt = useMemo(() => {
    if (onBehalf) {
      if (!selectedEmployeeId) return 0;
      return othersLoans.filter(l => l.employeeId === selectedEmployeeId && l.status === 'ACTIVE').reduce((s, l) => s + Number(l.remainingBalance), 0)
        + othersAdvances.filter(a => a.employeeId === selectedEmployeeId && a.status === 'APPROVED').reduce((s, a) => s + Number(a.remainingBalance ?? a.amount), 0);
    }
    return myLoans.filter(l => l.status === 'ACTIVE').reduce((s, l) => s + Number(l.remainingBalance), 0)
      + myAdvances.filter(a => a.status === 'APPROVED').reduce((s, a) => s + Number(a.remainingBalance ?? a.amount), 0);
  }, [onBehalf, selectedEmployeeId, othersLoans, othersAdvances, myLoans, myAdvances]);

  const hasKnownEmployee = onBehalf ? !!selectedEmployeeId : !!employee;
  const projectedTotal = existingDebt + (Number(amount) || 0);

  const durationMonths = durationMonthsInput ? Number(durationMonthsInput) : undefined;
  const monthlyRepayment = amount && durationMonths ? Math.ceil(Number(amount) / durationMonths) : undefined;
  const endDate = useMemo(() => {
    if (!durationMonths) return startDate;
    // ✅ Le champ date peut être momentanément vide/invalide pendant que
    // l'utilisateur efface la valeur par défaut pour taper la sienne —
    // new Date('') est une "Invalid Date" et .toISOString() plante dessus.
    // On attend une saisie valide avant de calculer la date de fin.
    const d = new Date(startDate);
    if (isNaN(d.getTime())) return '';
    d.setMonth(d.getMonth() + durationMonths);
    return d.toISOString().slice(0, 10);
  }, [startDate, durationMonths]);

  const canSubmit = !!amount && Number(amount) > 0 && reason.trim().length >= 3
    && (isAdvance || (!!durationMonthsInput && Number(durationMonthsInput) > 0))
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
          ...(isFinance && onBehalf && { recoverViaPayroll }),
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
          ...(isFinance && onBehalf && { recoverViaPayroll }),
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
    // ✅ Avant : new Date() en dur, donc l'aperçu affichait toujours la date
    // du jour même si l'utilisateur choisissait une autre date de départ.
    // startDate vaut déjà aujourd'hui par défaut (voir useState plus haut),
    // donc ça ne change rien tant que l'utilisateur ne la modifie pas.
    // Même précaution ici : évite d'afficher "Invalid Date" sur l'aperçu
    // pendant que le champ date est momentanément vide.
    requestedAt: startDate && !isNaN(new Date(startDate).getTime()) ? new Date(startDate) : new Date(),
    monthlyRepayment: monthlyRepayment || undefined,
    durationMonths,
    previousLoanAmount: hasKnownEmployee ? existingDebt : undefined,
    status: 'PENDING',
  };

  if (isDone) {
    return (
      <div className="max-w-lg mx-auto py-24 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} />
        </motion.div>
        <h1 className="text-2xl font-bold text-[var(--text)] mb-2">Demande envoyée</h1>
        <p className="text-[var(--text-muted)] text-sm mb-8">Votre demande a été transmise pour validation.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => router.push(bp('/loans/mon-espace'))} className="px-5 py-2.5 bg-[var(--text)] text-[var(--bg)] rounded-xl font-semibold text-sm">Voir mes demandes</button>
          <button onClick={() => { setIsDone(false); setAmount(''); setDurationMonthsInput(''); setReason(''); }} className="px-5 py-2.5 border border-[var(--border)] rounded-xl font-semibold text-sm text-[var(--text-muted)]">Nouvelle demande</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1300px] mx-auto pb-24 space-y-6">
      <FinanceSubNav userRole={userRole} />

      <div className="flex items-center gap-3">
        <button onClick={() => router.push(bp('/loans'))} className="p-2 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)]"><ArrowLeft size={18} /></button>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Nouvelle demande</h1>
          <p className="text-[var(--text-muted)] text-sm">Prêt (argent / marchandise) ou avance sur salaire</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-5">
        <div className="space-y-5">
          {isFinance && (
            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Pour qui ?</label>
                <button onClick={() => { setOnBehalf(!onBehalf); setSelectedEmployeeId(''); }} className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${onBehalf ? 'bg-emerald-500' : 'bg-[var(--border)]'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${onBehalf ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
              {!onBehalf ? <p className="text-sm text-[var(--text-muted)]">Pour moi-même</p> : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input value={employeeSearch} onChange={e => setEmployeeSearch(e.target.value)} placeholder="Rechercher un employé…" className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm" />
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {filteredEmployees.map(e => (
                      <button key={e.id} onClick={() => setSelectedEmployeeId(e.id)} className={`w-full text-left px-3 py-2 rounded-lg text-sm ${selectedEmployeeId === e.id ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 font-semibold' : 'hover:bg-[var(--surface-2)]'}`}>
                        {e.firstName} {e.lastName}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {onBehalf && selectedEmployeeId && (
                <div className="mt-4 pt-4 border-t border-[var(--border)]">
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 block">
                    Comment sera-t-il remboursé ?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRecoverViaPayroll(true)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${recoverViaPayroll ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-[var(--border)] hover:border-[var(--border)]'}`}
                    >
                      <p className="font-semibold text-sm text-[var(--text)]">Déduit sur la paie</p>
                      <p className="text-xs text-[var(--text-muted)]">La paie retire automatiquement chaque mois</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecoverViaPayroll(false)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${!recoverViaPayroll ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-[var(--border)] hover:border-[var(--border)]'}`}
                    >
                      <p className="font-semibold text-sm text-[var(--text)]">En espèces</p>
                      <p className="text-xs text-[var(--text-muted)]">La paie ne touche pas à ce prêt</p>
                    </button>
                  </div>
                  {recoverViaPayroll && (
                    <p className="text-xs text-[var(--text-muted)] mt-2">
                      S'il reste un solde après la paie, un remboursement en espèces restera possible en complément.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {hasKnownEmployee && (
            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5">
              <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 block">
                {onBehalf ? `Dette actuelle de ${targetEmployee?.firstName || 'cet employé'}` : 'Ma dette actuelle'}
              </label>
              {isLoadingDebt && onBehalf ? (
                <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]"><Loader2 size={14} className="animate-spin" /> Chargement…</div>
              ) : existingDebt > 0 ? (
                <p className="text-lg font-bold text-amber-600">{existingDebt.toLocaleString('fr-FR')} FCFA <span className="text-xs font-normal text-[var(--text-muted)]">déjà dus (prêts/avances en cours)</span></p>
              ) : (
                <p className="text-sm text-emerald-600 font-semibold">Aucune dette en cours</p>
              )}
            </div>
          )}

          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5">
            <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3 block">Type de demande</label>
            <div className="grid grid-cols-1 gap-2">
              {TYPE_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const active = type === opt.value;
                return (
                  <button key={opt.value} onClick={() => setType(opt.value)} className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${active ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-[var(--border)] hover:border-[var(--border)]'}`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${active ? 'bg-emerald-500 text-white' : 'bg-[var(--surface-2)] text-[var(--text-muted)]'}`}><Icon size={18} /></div>
                    <div><p className="font-semibold text-sm text-[var(--text)]">{opt.label}</p><p className="text-xs text-[var(--text-muted)]">{opt.hint}</p></div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 space-y-4">
            <div>
              <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">Montant demandé (FCFA)</label>
              <input type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm" />
              {hasKnownEmployee && Number(amount) > 0 && existingDebt > 0 && (
                <p className="text-xs text-amber-600 mt-1.5">
                  + {existingDebt.toLocaleString('fr-FR')} FCFA déjà dus = <strong>{projectedTotal.toLocaleString('fr-FR')} FCFA</strong> au total après cette demande
                </p>
              )}
            </div>

            {!isAdvance ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">Durée (en mois)</label>
                  <input type="number" min="1" value={durationMonthsInput} onChange={e => setDurationMonthsInput(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">Date de départ</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm" />
                </div>
                {monthlyRepayment && <p className="text-xs text-emerald-600 dark:text-emerald-400 col-span-2">Mensualité estimée : {monthlyRepayment.toLocaleString('fr-FR')} FCFA/mois (jusqu&apos;au {new Date(endDate).toLocaleDateString('fr-FR')})</p>}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">Mois de déduction</label>
                  <select value={deductMonth} onChange={e => setDeductMonth(Number(e.target.value))} className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">Année</label>
                  <input type="number" value={deductYear} onChange={e => setDeductYear(Number(e.target.value))} className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm" />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">Motif</label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm resize-none" />
            </div>
          </div>

          {error && <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl">{error}</div>}

          <div className="flex gap-2">
            <button onClick={handleSubmit} disabled={!canSubmit} className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30">
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />} Envoyer la demande
            </button>
            <button onClick={() => setShowPreviewModal(true)} className="px-4 py-3.5 border border-dashed border-[var(--border)] text-[var(--text-muted)] font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-[var(--surface-2)] shrink-0">
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