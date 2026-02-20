'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Printer, Download, Check, Ban,
  DollarSign, ChevronDown, ChevronUp, AlertCircle,
  Loader2, Info, Building2, Gift, Pencil, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';

import PayslipHeader from './components/PayslipHeader';
import PayslipEmployeeInfo from './components/PayslipEmployeeInfo';
import PayslipBreakdown from './components/PayslipBreakdown';
import PayslipFooter from './components/PayslipFooter';

interface PayrollData {
  employee?: {
    id: string;
    firstName?: string;
    lastName?: string;
    isSubjectToCnss?: boolean;
    isSubjectToIrpp?: boolean;
    professionalCategory?: string;
    employeeNumber?: string;
    position?: string;
    department?: { name?: string };
    cnssNumber?: string;
    nationalIdNumber?: string;
    paymentMethod?: string;
    maritalStatus?: string;
    numberOfChildren?: number;
    echelon?: string;
    contractType?: string;
    hireDate?: string;
  };
  company?: {
    legalName?: string;
    logo?: string;
    address?: string;
    rccmNumber?: string;
    nif?: string;
    phone?: string;
    collectiveAgreement?: string;
    [key: string]: any;
  };
  items?: Array<{
    id: string; code: string; label: string;
    type: 'GAIN' | 'DEDUCTION' | 'EMPLOYER_COST';
    base?: number; rate?: number; amount: number;
    isTaxable: boolean; isCnss: boolean; order: number;
  }>;
  status: string;
  month: number;
  year: number;
  grossSalary: number;
  netSalary: number;
  totalDeductions: number;
  totalEmployerCost?: number;
  workDays?: number;
  workedDays?: number;
  absenceDays?: number;
  daysOnLeave?: number;
  daysRemote?: number;
  daysHoliday?: number;
  overtimeHours10?: number;
  overtimeHours25?: number;
  overtimeHours50?: number;
  overtimeHours100?: number;
}

// Statuts qui autorisent la modification
const EDITABLE_STATUSES = ['DRAFT'];
// Statuts qui autorisent la suppression définitive
const DELETABLE_STATUSES = ['DRAFT', 'CANCELLED', 'PAID', 'VALIDATED'];

export default function PayslipPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);

  const [data, setData]                 = useState<PayrollData | null>(null);
  const [userRole, setUserRole]         = useState<string | null>(null);
  const [isLoading, setIsLoading]       = useState(true);
  const [isUpdating, setIsUpdating]     = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isDeleting, setIsDeleting]     = useState(false);
  const [showEmployer, setShowEmployer] = useState(false);
  const [showConfirm, setShowConfirm]   = useState<{ show: boolean; action: 'validate' | 'pay' | 'cancel' | 'delete' } | null>(null);
  const [bonuses, setBonuses]           = useState<any[]>([]);

  useEffect(() => { fetchData(); }, [params.id]);

  const fetchData = async () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) setUserRole(JSON.parse(storedUser).role);

      const payroll = await api.get<PayrollData>(`/payrolls/${params.id}`);
      setData(payroll);

      if (payroll?.employee?.id) {
        try {
          const bonusesData: any = await api.get(`/employee-bonuses?employeeId=${payroll.employee.id}`);
          const all = Array.isArray(bonusesData) ? bonusesData : bonusesData?.data || [];
          setBonuses(all.filter((b: any) => b.isRecurring || b.source === 'AUTOMATIC'));
        } catch {}
      }
    } catch (error: any) {
      console.error('Erreur chargement:', error);
      router.push('/paie');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Actions statut ──────────────────────────────────────────────────────
  const handleAction = async () => {
    if (!showConfirm) return;

    // Suppression définitive
    if (showConfirm.action === 'delete') {
      setIsDeleting(true);
      try {
        await api.delete(`/payrolls/${params.id}`);
        router.push('/paie');
      } catch (e: any) {
        alert(`Erreur: ${e.response?.data?.message || e.message}`);
        setIsDeleting(false);
      }
      return;
    }

    setIsUpdating(true);
    const statusMap: any = { validate: 'VALIDATED', pay: 'PAID', cancel: 'CANCELLED' };
    try {
      const updated = await api.patch<PayrollData>(`/payrolls/${params.id}`, { status: statusMap[showConfirm.action] });
      setData(updated);
      setShowConfirm(null);
    } catch (e: any) {
      alert(`Erreur: ${e.response?.data?.message || e.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // ── PDF via impression navigateur (meilleure qualité que html2canvas) ──
  const handleDownloadPDF = () => window.print();

  const fmt = (val: number) => (val ?? 0).toLocaleString('fr-FR');
  const canEditStatus = ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'].includes(userRole || '');
  const canEdit       = canEditStatus && EDITABLE_STATUSES.includes(data?.status || '');
  const canDelete     = canEditStatus;

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-sky-500" size={32} />
    </div>
  );

  if (!data) return (
    <div className="p-8 text-center">
      <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
      <p className="text-gray-500">Bulletin introuvable</p>
      <button onClick={() => router.push('/paie')} className="mt-4 px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold">Retour</button>
    </div>
  );

  const employerCosts = (data.items || []).filter(i => i.type === 'EMPLOYER_COST');
  const cnssItem  = (data.items || []).find(i => i.code === 'CNSS' || i.code?.includes('CNSS'));
  const irppItem  = (data.items || []).find(i => ['ITS', 'IRPP'].includes(i.code) || i.code?.includes('ITS'));
  const isSubjectToCnss = data.employee?.isSubjectToCnss ?? ((cnssItem?.amount ?? 0) > 0);
  const isSubjectToIrpp = data.employee?.isSubjectToIrpp ?? ((irppItem?.amount ?? 0) > 0);

  const CONFIRM_CONFIG = {
    validate: { title: 'Valider le bulletin ?',       sub: 'Le bulletin ne pourra plus être modifié.',              color: 'bg-emerald-500 hover:bg-emerald-600', icon: Check },
    pay:      { title: 'Confirmer le paiement ?',     sub: "L'employé pourra accéder à son bulletin.",              color: 'bg-sky-500 hover:bg-sky-600',     icon: DollarSign },
    cancel:   { title: 'Annuler ce bulletin ?',        sub: 'Le bulletin sera invalidé définitivement.',             color: 'bg-orange-500 hover:bg-orange-600',icon: Ban },
    delete:   { title: 'Supprimer définitivement ?',  sub: 'Le bulletin sera effacé de la base de données. Vous devrez recréer un bulletin si nécessaire.', color: 'bg-red-600 hover:bg-red-700', icon: Trash2 },
  };

  return (
    <>
      {/* ── STYLES IMPRESSION A4 ───────────────────────────────────────────── */}
      <style jsx global>{`
        @media print {
          body { background: white !important; print-color-adjust: exact; -webkit-print-color-adjust: exact; font-size: 11px; }
          .no-print { display: none !important; }
          @page { size: A4 portrait; margin: 12mm 14mm 10mm 14mm; }

          /* Forcer couleurs sur le print */
          * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }

          /* Eviter coupures dans les blocs clés */
          .payslip-root { max-width: 100% !important; page-break-inside: avoid; }
          table { break-inside: auto; }
          tr { break-inside: avoid; }
          .print-no-break { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>

      <div className="max-w-[1200px] mx-auto pb-20 px-4 print:p-0 print:max-w-none">

        {/* ── BARRE D'ACTIONS ── */}
        <div className="no-print flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <button onClick={() => router.back()}
            className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors">
            <ArrowLeft size={20} className="text-gray-500" />
          </button>

          <div className="flex flex-wrap items-center gap-3">
            {canEditStatus && (
              <>
                {/* Modifier — uniquement DRAFT */}
                {canEdit && (
                  <button
                    onClick={() => router.push(`/paie/${params.id}/modifier`)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 transition-colors">
                    <Pencil size={16} /> Modifier
                  </button>
                )}

                {data.status === 'DRAFT' && (
                  <button onClick={() => setShowConfirm({ show: true, action: 'validate' })}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg flex items-center gap-2">
                    <Check size={18} /> Valider
                  </button>
                )}
                {data.status === 'VALIDATED' && (
                  <button onClick={() => setShowConfirm({ show: true, action: 'pay' })}
                    className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl shadow-lg flex items-center gap-2">
                    <DollarSign size={18} /> Marquer Payé
                  </button>
                )}
                {!['CANCELLED', 'PAID'].includes(data.status) && (
                  <button onClick={() => setShowConfirm({ show: true, action: 'cancel' })}
                    className="px-4 py-2 border border-orange-200 dark:border-orange-800 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/10 font-bold rounded-xl flex items-center gap-2">
                    <Ban size={18} /> Annuler
                  </button>
                )}

                {/* Supprimer définitivement — toujours visible pour admin */}
                {canDelete && (
                  <button onClick={() => setShowConfirm({ show: true, action: 'delete' })}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center gap-2 transition-colors">
                    <Trash2 size={16} /> Supprimer
                  </button>
                )}
              </>
            )}

            <button onClick={handleDownloadPDF} disabled={isGeneratingPDF}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 disabled:opacity-50">
              {isGeneratingPDF ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
              PDF
            </button>
            <button onClick={() => window.print()}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-50 flex items-center gap-2">
              <Printer size={18} /> Imprimer
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start print:block">

          {/* ── BULLETIN ── */}
          <div
            ref={printRef}
            className="payslip-root lg:col-span-2 bg-white dark:bg-gray-800 shadow-xl print:shadow-none
                       rounded-xl print:rounded-none overflow-hidden
                       border border-gray-200 dark:border-gray-700 print:border-0 print:bg-white"
          >
            <PayslipHeader
              company={data.company ?? {}}
              month={data.month}
              year={data.year}
              status={data.status}
            />
            <PayslipEmployeeInfo
              employee={data.employee ?? { id: '' }}
              payslip={{
                month: data.month, year: data.year,
                workDays: data.workDays ?? 0, workedDays: data.workedDays ?? 0, absenceDays: data.absenceDays ?? 0,
                daysOnLeave: data.daysOnLeave, daysRemote: data.daysRemote, daysHoliday: data.daysHoliday,
                overtimeHours10: data.overtimeHours10, overtimeHours25: data.overtimeHours25,
                overtimeHours50: data.overtimeHours50, overtimeHours100: data.overtimeHours100,
                professionalCategory: data.employee?.professionalCategory,
                collectiveAgreement: data.company?.collectiveAgreement,
              }}
            />
            <div className="p-8 print:p-5">
              <PayslipBreakdown
                items={(data.items || []) as any}
                grossSalary={data.grossSalary}
                netSalary={data.netSalary}
                totalDeductions={data.totalDeductions}
                isSubjectToCnss={isSubjectToCnss}
                isSubjectToIrpp={isSubjectToIrpp}
                bonuses={bonuses}
              />
              <PayslipFooter />
            </div>
          </div>

          {/* ── SIDEBAR ── */}
          <div className="space-y-6 no-print">

            {bonuses.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                  <Gift size={18} className="text-cyan-500" />
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">Primes ce mois</h3>
                </div>
                <div className="p-4 space-y-2">
                  {bonuses.map((b: any) => (
                    <div key={b.id} className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{b.bonusType}</span>
                      <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">+{fmt(b.amount || 0)} F</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(!isSubjectToCnss || !isSubjectToIrpp) && (
              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700 rounded-2xl p-4">
                <p className="font-bold text-amber-800 dark:text-amber-200 text-sm flex items-center gap-2 mb-2">
                  <AlertCircle size={15} /> Exemptions actives
                </p>
                {!isSubjectToCnss && <p className="text-xs text-amber-600 dark:text-amber-400">• CNSS : exempté</p>}
                {!isSubjectToIrpp && <p className="text-xs text-amber-600 dark:text-amber-400">• ITS : exempté</p>}
              </div>
            )}

            {canEditStatus && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <button onClick={() => setShowEmployer(!showEmployer)}
                  className="w-full flex items-center justify-between p-4 font-bold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                  <span className="flex items-center gap-2 text-sm"><Building2 size={16} className="text-sky-500" />Coût Employeur</span>
                  {showEmployer ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                <AnimatePresence>
                  {showEmployer && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                      className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 overflow-hidden">
                      <div className="p-4 space-y-2 text-sm">
                        <div className="flex justify-between text-gray-600 dark:text-gray-400">
                          <span>Brut</span>
                          <span className="font-mono font-bold">{fmt(data.grossSalary)} F</span>
                        </div>
                        {employerCosts.map(cost => (
                          <div key={cost.id} className="flex justify-between text-gray-600 dark:text-gray-400">
                            <span>{cost.label}</span>
                            <span className="font-mono font-bold text-red-500">+{fmt(cost.amount ?? 0)} F</span>
                          </div>
                        ))}
                        <div className="flex justify-between font-bold pt-2 border-t border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
                          <span>Coût Total</span>
                          <span className="font-mono">{fmt(data.totalEmployerCost ?? 0)} F</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Récapitulatif sidebar */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-sm">Récapitulatif</h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Brut</span>
                  <span className="font-mono font-bold text-emerald-600">{fmt(data.grossSalary)} F</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">CNSS</span>
                  <span className="font-mono text-red-500">{isSubjectToCnss ? `-${fmt(cnssItem?.amount || 0)}` : '0'} F</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">ITS</span>
                  <span className="font-mono text-red-500">{isSubjectToIrpp ? `-${fmt(irppItem?.amount || 0)}` : '0'} F</span>
                </div>
                <div className="flex justify-between pt-2.5 border-t border-gray-200 dark:border-gray-700">
                  <span className="font-bold text-gray-900 dark:text-white">Net</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-white">{fmt(data.netSalary)} F</span>
                </div>
              </div>
            </div>

            {/* Info réglementation */}
            <div className="bg-gradient-to-br from-sky-50 to-emerald-50 dark:from-sky-900/20 dark:to-emerald-900/20 rounded-2xl p-5 border border-sky-200 dark:border-sky-800">
              <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm">
                <Info size={16} className="text-sky-500" /> Réglementation Congo 2026
              </h3>
              <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                <p>• ITS 2026 — sans quotient familial</p>
                <p>• CNSS salarié : 4% (plafond 1 200 000 FCFA)</p>
                <p>• CNSS patronal : pension 8% + famille 10% + AT 2,25%</p>
                <p>• TUS : 2% sur brut (patronale)</p>
                <p>• SMIG : 70 400 FCFA/mois</p>
                <p className="text-sky-600 dark:text-sky-400 font-medium">Décret n°78-360 du 12 mai 1978</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── MODAL CONFIRMATION ── */}
        <AnimatePresence>
          {showConfirm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print">
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                <div className="flex flex-col items-center text-center">
                  {(() => {
                    const cfg = CONFIRM_CONFIG[showConfirm.action];
                    const Icon = cfg.icon;
                    const isDelete = showConfirm.action === 'delete';
                    return (
                      <>
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4
                          ${isDelete ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-600'}`}>
                          <Icon size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{cfg.title}</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{cfg.sub}</p>
                        {isDelete && (
                          <div className="w-full mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                            <p className="text-xs text-red-700 dark:text-red-300 font-bold text-left">
                              ⚠️ Cette action est irréversible. Le bulletin sera définitivement supprimé de la base de données.
                            </p>
                          </div>
                        )}
                        <div className="flex gap-3 w-full">
                          <button onClick={() => setShowConfirm(null)}
                            className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700">
                            Retour
                          </button>
                          <button onClick={handleAction}
                            disabled={isUpdating || isDeleting}
                            className={`flex-1 py-3 text-white font-bold rounded-xl flex justify-center items-center gap-2 ${cfg.color}`}>
                            {(isUpdating || isDeleting)
                              ? <Loader2 className="animate-spin" size={20} />
                              : isDelete ? 'Supprimer' : 'Confirmer'}
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

// 'use client';

// import React, { useState, useEffect, useRef } from 'react';
// import { useRouter } from 'next/navigation';
// import { 
//   ArrowLeft, Printer, Download, Check, Ban, 
//   DollarSign, ChevronDown, ChevronUp, AlertCircle,
//   Loader2, Info, Building2, Gift
// } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { api } from '@/services/api';
// import html2canvas from 'html2canvas';
// import jsPDF from 'jspdf';

// import PayslipHeader from './components/PayslipHeader';
// import PayslipEmployeeInfo from './components/PayslipEmployeeInfo';
// import PayslipBreakdown from './components/PayslipBreakdown';
// import PayslipFooter from './components/PayslipFooter';

// // ✅ Interface alignée avec les composants enfants
// interface PayrollData {
//   employee?: {
//     id: string;
//     firstName?: string;
//     lastName?: string;
//     isSubjectToCnss?: boolean;
//     isSubjectToIrpp?: boolean;
//     professionalCategory?: string;
//     employeeNumber?: string;
//     position?: string;
//     department?: { name?: string };
//     cnssNumber?: string;
//     nationalIdNumber?: string;
//     paymentMethod?: string;
//     maritalStatus?: string;
//     numberOfChildren?: number;
//     echelon?: string;
//     contractType?: string;
//     hireDate?: string;
//   };
//   company?: {
//     legalName?: string;
//     logo?: string;
//     address?: string;
//     rccmNumber?: string;
//     nif?: string;
//     phone?: string;
//     collectiveAgreement?: string;
//     [key: string]: any;
//   };
//   // ✅ items alignés avec PayrollItem de PayslipBreakdown
//   items?: Array<{
//     id: string;
//     code: string;
//     label: string;
//     type: 'GAIN' | 'DEDUCTION' | 'EMPLOYER_COST';
//     base?: number;
//     rate?: number;
//     amount: number;
//     isTaxable: boolean;
//     isCnss: boolean;
//     order: number;
//   }>;
//   status: string;
//   month: number;
//   year: number;
//   grossSalary: number;
//   netSalary: number;
//   totalDeductions: number;
//   totalEmployerCost?: number;
//   workDays?: number;
//   workedDays?: number;
//   absenceDays?: number;
//   daysOnLeave?: number;
//   daysRemote?: number;
//   daysHoliday?: number;
//   overtimeHours10?: number;
//   overtimeHours25?: number;
//   overtimeHours50?: number;
//   overtimeHours100?: number;
// }

// export default function PayslipPage({ params }: { params: { id: string } }) {
//   const router = useRouter();
//   const printRef = useRef<HTMLDivElement>(null);
  
//   const [data, setData] = useState<PayrollData | null>(null);
//   const [userRole, setUserRole] = useState<string | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isUpdating, setIsUpdating] = useState(false);
//   const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
//   const [showEmployer, setShowEmployer] = useState(false);
//   const [showConfirm, setShowConfirm] = useState<{show: boolean, action: 'validate' | 'pay' | 'cancel'} | null>(null);
  
//   const [bonuses, setBonuses] = useState<any[]>([]);

//   useEffect(() => { fetchData(); }, [params.id]);

//   const fetchData = async () => {
//     try {
//       const storedUser = localStorage.getItem('user');
//       if (storedUser) {
//         const user = JSON.parse(storedUser);
//         setUserRole(user.role);
//       }

//       const payroll = await api.get<PayrollData>(`/payrolls/${params.id}`);
//       setData(payroll);

//       if (payroll?.employee?.id) {
//         try {
//           const bonusesData: any = await api.get(`/employee-bonuses?employeeId=${payroll.employee.id}`);
//           const allBonuses = Array.isArray(bonusesData) ? bonusesData : bonusesData?.data || [];
//           setBonuses(allBonuses.filter((b: any) => b.isRecurring || b.source === 'AUTOMATIC'));
//         } catch {}
//       }
//     } catch (error: any) {
//       console.error('Erreur chargement:', error);
//       if (error.message?.includes('propres bulletins')) {
//         alert('Vous ne pouvez accéder qu\'à vos propres bulletins de paie');
//       } else {
//         alert('Impossible de charger le bulletin');
//       }
//       router.push('/paie');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleAction = async () => {
//     if (!showConfirm) return;
//     setIsUpdating(true);
//     const statusMap: any = { validate: 'VALIDATED', pay: 'PAID', cancel: 'CANCELLED' };
//     try {
//       const updated = await api.patch<PayrollData>(`/payrolls/${params.id}`, { status: statusMap[showConfirm.action] });
//       setData(updated);
//       setShowConfirm(null);
//       if (showConfirm.action === 'pay') {
//         alert('Bulletin marqué comme payé. L\'employé peut maintenant y accéder.');
//       }
//     } catch (e: any) {
//       alert(`Erreur: ${e.response?.data?.message || e.message}`);
//     } finally {
//       setIsUpdating(false);
//     }
//   };

//   const handleDownloadPDF = async () => {
//     if (!printRef.current || !data) return;
//     setIsGeneratingPDF(true);
//     try {
//       const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
//       const pdf = new jsPDF('p', 'mm', 'a4');
//       const pdfWidth = pdf.internal.pageSize.getWidth();
//       const ratio = pdfWidth / canvas.width;
//       pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 10, canvas.width * ratio, canvas.height * ratio);
//       pdf.save(`Bulletin_${data.employee?.firstName}_${data.employee?.lastName}_${data.month}-${data.year}.pdf`);
//     } catch { alert('Erreur génération PDF'); }
//     finally { setIsGeneratingPDF(false); }
//   };

//   const fmt = (val: number) => (val ?? 0).toLocaleString('fr-FR');
//   const canEditStatus = ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'].includes(userRole || '');

//   if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-sky-500" size={32} /></div>;
//   if (!data) return (
//     <div className="p-8 text-center">
//       <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
//       <p className="text-gray-500">Bulletin introuvable</p>
//       <button onClick={() => router.push('/paie')} className="mt-4 px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold">Retour</button>
//     </div>
//   );

//   const employerCosts = (data.items || []).filter((i) => i.type === 'EMPLOYER_COST');
//   const cnssItem = (data.items || []).find((i) => i.code === 'CNSS' || i.code?.includes('CNSS'));
//   const irppItem = (data.items || []).find((i) => i.code === 'ITS' || i.code === 'IRPP' || i.code?.includes('ITS'));
//   const isSubjectToCnss = data.employee?.isSubjectToCnss ?? ((cnssItem?.amount ?? 0) > 0);
//   const isSubjectToIrpp = data.employee?.isSubjectToIrpp ?? ((irppItem?.amount ?? 0) > 0);

//   // ✅ Fallbacks pour les props requises par les composants enfants
//   const companyProps = data.company ?? {};

//   const employeeProps = data.employee ?? { id: '' };

//   return (
//     <>
//       <style jsx global>{`
//         @media print {
//           body { background: white !important; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
//           .no-print { display: none !important; }
//           @page { size: A4; margin: 1.5cm; }
//         }
//       `}</style>

//       <div className="max-w-[1200px] mx-auto pb-20 px-4 print:p-0 print:max-w-none">
        
//         {/* BARRE D'ACTIONS */}
//         <div className="no-print flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
//           <button onClick={() => router.back()} className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors">
//             <ArrowLeft size={20} className="text-gray-500" />
//           </button>
//           <div className="flex flex-wrap items-center gap-3">
//             {canEditStatus && (
//               <>
//                 {data.status === 'DRAFT' && (
//                   <button onClick={() => setShowConfirm({show: true, action: 'validate'})}
//                     className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg flex items-center gap-2">
//                     <Check size={18} /> Valider
//                   </button>
//                 )}
//                 {data.status === 'VALIDATED' && (
//                   <button onClick={() => setShowConfirm({show: true, action: 'pay'})}
//                     className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl shadow-lg flex items-center gap-2">
//                     <DollarSign size={18} /> Marquer Payé
//                   </button>
//                 )}
//                 {!['CANCELLED', 'PAID'].includes(data.status) && (
//                   <button onClick={() => setShowConfirm({show: true, action: 'cancel'})}
//                     className="px-4 py-2 border border-red-200 dark:border-red-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 font-bold rounded-xl flex items-center gap-2">
//                     <Ban size={18} /> Annuler
//                   </button>
//                 )}
//               </>
//             )}
//             <button onClick={handleDownloadPDF} disabled={isGeneratingPDF}
//               className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 disabled:opacity-50">
//               {isGeneratingPDF ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
//               {isGeneratingPDF ? 'Génération...' : 'PDF'}
//             </button>
//             <button onClick={() => window.print()}
//               className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-50 flex items-center gap-2">
//               <Printer size={18} /> Imprimer
//             </button>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start print:block">
          
//           {/* ── BULLETIN ── */}
//           <div ref={printRef}
//             className="lg:col-span-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-xl print:shadow-none rounded-xl print:rounded-none overflow-hidden border border-gray-200 dark:border-gray-700 print:border-2 print:border-gray-900 print:bg-white print:text-black">
            
//             {/* ✅ companyProps est toujours un objet (jamais undefined) */}
//             <PayslipHeader
//               company={companyProps}
//               month={data.month}
//               year={data.year}
//               status={data.status}
//             />

//             {/* ✅ employeeProps est toujours un objet + fallbacks number avec ?? 0 */}
//             <PayslipEmployeeInfo
//               employee={employeeProps}
//               payslip={{
//                 month: data.month,
//                 year: data.year,
//                 workDays:    data.workDays    ?? 0,
//                 workedDays:  data.workedDays  ?? 0,
//                 absenceDays: data.absenceDays ?? 0,
//                 daysOnLeave:  data.daysOnLeave,
//                 daysRemote:   data.daysRemote,
//                 daysHoliday:  data.daysHoliday,
//                 overtimeHours10:  data.overtimeHours10,
//                 overtimeHours25:  data.overtimeHours25,
//                 overtimeHours50:  data.overtimeHours50,
//                 overtimeHours100: data.overtimeHours100,
//                 professionalCategory: data.employee?.professionalCategory,
//                 collectiveAgreement:  data.company?.collectiveAgreement,
//               }}
//             />

//             <div className="p-8 print:p-6">
//               {/* ✅ items castés — la shape complète est garantie par PayrollData */}
//               <PayslipBreakdown
//                 items={(data.items || []) as any}
//                 grossSalary={data.grossSalary}
//                 netSalary={data.netSalary}
//                 totalDeductions={data.totalDeductions}
//                 isSubjectToCnss={isSubjectToCnss}
//                 isSubjectToIrpp={isSubjectToIrpp}
//                 bonuses={bonuses}
//               />
//               <PayslipFooter />
//             </div>
//           </div>

//           {/* ── SIDEBAR ── */}
//           <div className="space-y-6 no-print">

//             {/* Primes */}
//             {bonuses.length > 0 && (
//               <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
//                 <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
//                   <Gift size={18} className="text-cyan-500" />
//                   <h3 className="font-bold text-gray-900 dark:text-white text-sm">Primes ce mois</h3>
//                 </div>
//                 <div className="p-4 space-y-2">
//                   {bonuses.map((b: any) => (
//                     <div key={b.id} className="flex justify-between text-sm">
//                       <span className="text-gray-600 dark:text-gray-400">{b.bonusType}</span>
//                       <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
//                         +{fmt(b.amount || b.computedAmount || 0)} F
//                       </span>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* Exemptions fiscales */}
//             {(!isSubjectToCnss || !isSubjectToIrpp) && (
//               <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700 rounded-2xl p-4">
//                 <p className="font-bold text-amber-800 dark:text-amber-200 text-sm flex items-center gap-2 mb-2">
//                   <AlertCircle size={15} /> Exemptions actives
//                 </p>
//                 {!isSubjectToCnss && <p className="text-xs text-amber-600 dark:text-amber-400">• CNSS salariale : 0 FCFA (exempté)</p>}
//                 {!isSubjectToIrpp && <p className="text-xs text-amber-600 dark:text-amber-400">• IRPP / ITS : 0 FCFA (exempté)</p>}
//               </div>
//             )}

//             {/* Coût employeur — ADMIN seulement */}
//             {canEditStatus && (
//               <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
//                 <button onClick={() => setShowEmployer(!showEmployer)}
//                   className="w-full flex items-center justify-between p-4 font-bold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
//                   <span className="flex items-center gap-2 text-sm"><Building2 size={16} className="text-sky-500" />Coût Employeur</span>
//                   {showEmployer ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
//                 </button>
//                 <AnimatePresence>
//                   {showEmployer && (
//                     <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
//                       className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 overflow-hidden">
//                       <div className="p-4 space-y-2 text-sm">
//                         <div className="flex justify-between text-gray-600 dark:text-gray-400">
//                           <span>Salaire Brut</span>
//                           <span className="font-mono font-bold">{fmt(data.grossSalary)} F</span>
//                         </div>
//                         {employerCosts.map((cost) => (
//                           <div key={cost.id} className="flex justify-between text-gray-600 dark:text-gray-400">
//                             <span>{cost.label}</span>
//                             <span className="font-mono font-bold text-red-500">+{fmt(cost.amount ?? 0)} F</span>
//                           </div>
//                         ))}
//                         <div className="flex justify-between font-bold pt-2 border-t border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
//                           <span>Coût Total</span>
//                           <span className="font-mono">{fmt(data.totalEmployerCost ?? 0)} F</span>
//                         </div>
//                       </div>
//                     </motion.div>
//                   )}
//                 </AnimatePresence>
//               </div>
//             )}

//             {/* Réglementation */}
//             <div className="bg-gradient-to-br from-sky-50 to-emerald-50 dark:from-sky-900/20 dark:to-emerald-900/20 rounded-2xl p-5 border border-sky-200 dark:border-sky-800">
//               <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm">
//                 <Info size={16} className="text-sky-500" /> Réglementation Congo-Brazzaville
//               </h3>
//               <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
//                 <p>• Code du Travail Congo (Loi n°45-75)</p>
//                 <p>• CNSS : 4% salarié + 16,65% patronal</p>
//                 <p>• Plafond CNSS : 600 000 FCFA/mois</p>
//                 <p>• SMIG : 70 400 FCFA/mois</p>
//                 <p>• HS : +10% (5 premières h.) · +25% (suivantes)</p>
//                 <p>• HS nuit : +50% (repos/férié) · +100% (dimanche/JF)</p>
//                 <p className="text-sky-600 dark:text-sky-400 font-medium">Décret n°78-360 du 12 mai 1978</p>
//               </div>
//             </div>

//             {/* Récapitulatif */}
//             <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
//               <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-sm">Récapitulatif</h3>
//               <div className="space-y-2.5 text-sm">
//                 <div className="flex justify-between">
//                   <span className="text-gray-500">Brut</span>
//                   <span className="font-mono font-bold text-emerald-600">{fmt(data.grossSalary)} F</span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-gray-500">CNSS salarié</span>
//                   <span className="font-mono text-red-500">{isSubjectToCnss ? `-${fmt(cnssItem?.amount || 0)}` : '0 (exempté)'} F</span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-gray-500">IRPP / ITS</span>
//                   <span className="font-mono text-red-500">{isSubjectToIrpp ? `-${fmt(irppItem?.amount || 0)}` : '0 (exempté)'} F</span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-gray-500">Autres retenues</span>
//                   <span className="font-mono text-red-500">-{fmt((data.totalDeductions || 0) - (cnssItem?.amount || 0) - (irppItem?.amount || 0))} F</span>
//                 </div>
//                 <div className="flex justify-between pt-2.5 border-t border-gray-200 dark:border-gray-700">
//                   <span className="font-bold text-gray-900 dark:text-white">Net</span>
//                   <span className="font-mono font-bold text-gray-900 dark:text-white">{fmt(data.netSalary)} F</span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* MODAL CONFIRMATION */}
//         <AnimatePresence>
//           {canEditStatus && showConfirm && (
//             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//               className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print">
//               <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
//                 <div className="flex flex-col items-center text-center">
//                   <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
//                     showConfirm.action === 'validate' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500' :
//                     showConfirm.action === 'pay' ? 'bg-sky-100 dark:bg-sky-900/30 text-sky-500' :
//                     'bg-red-100 dark:bg-red-900/30 text-red-500'}`}>
//                     <AlertCircle size={32} />
//                   </div>
//                   <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
//                     {showConfirm.action === 'validate' ? 'Valider le bulletin ?' :
//                      showConfirm.action === 'pay' ? 'Confirmer le paiement ?' : 'Annuler ce bulletin ?'}
//                   </h3>
//                   <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
//                     {showConfirm.action === 'validate' ? 'Le bulletin ne pourra plus être modifié.' :
//                      showConfirm.action === 'pay' ? 'L\'employé pourra accéder à son bulletin après cette action.' :
//                      'Le bulletin sera invalidé définitivement.'}
//                   </p>
//                   <div className="flex gap-3 w-full">
//                     <button onClick={() => setShowConfirm(null)}
//                       className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700">
//                       Retour
//                     </button>
//                     <button onClick={handleAction} disabled={isUpdating}
//                       className={`flex-1 py-3 text-white font-bold rounded-xl flex justify-center items-center gap-2 ${
//                         showConfirm.action === 'validate' ? 'bg-emerald-500 hover:bg-emerald-600' :
//                         showConfirm.action === 'pay' ? 'bg-sky-500 hover:bg-sky-600' : 'bg-red-500 hover:bg-red-600'}`}>
//                       {isUpdating ? <Loader2 className="animate-spin" size={20} /> : 'Confirmer'}
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </div>
//     </>
//   );
// }