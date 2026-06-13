// 'use client';

// import React, { useState, useEffect, useRef } from 'react';
// import { useRouter } from 'next/navigation';
// import {
//   ArrowLeft, Plus, Trash2, Loader2, CheckCircle2,
//   Search, X, Calculator, AlertCircle, ChevronDown,
//   ChevronUp, Building2, Check, CreditCard, Wallet,
//   Calendar, Briefcase, Users, BadgeCheck,
// } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { api } from '@/services/api';

// // ─── Types ──────────────────────────────────────────────────────────────────

// interface Employee {
//   id: string;
//   firstName: string;
//   lastName: string;
//   baseSalary?: number;
//   position?: string;
//   employeeNumber?: string;
//   contractType?: string;
//   hireDate?: string;
//   maritalStatus?: string;
//   numberOfChildren?: number;
//   department?: { name: string };
//   isSubjectToCnss?: boolean;
//   isSubjectToIrpp?: boolean;
//   tolZone?: string;
// }

// interface CompanyInfo {
//   email?: string;
// }

// interface BonusTemplate {
//   id: string;
//   name: string;
//   defaultAmount: number | null;
//   bonusCategory: string;
//   isTaxable: boolean;
//   isCnss: boolean;
//   isActive: boolean;
// }

// interface CompanyTax {
//   id: string;
//   name: string;
//   code: string;
//   employeeRate: number;
//   fixedEmployee: number;
//   isActive: boolean;
// }

// interface Loan {
//   id: string;
//   monthlyRepayment: number;
//   remainingBalance: number;
//   status: string;
//   reason?: string;
//   employeeId?: string;
//   employee?: { id?: string };
// }

// interface Advance {
//   id: string;
//   amount: number;
//   status: string;
//   deducted: boolean;
//   reason?: string;
//   employeeId?: string;
//   employee?: { id?: string };
// }

// interface Row {
//   localId: string;
//   refId?: string;
//   label: string;
//   base: number | '';
//   rate: number | '';
//   amount: number;
// }

// interface ManualDeduction {
//   localId: string;
//   label: string;
//   amount: number | '';
// }

// interface SimResult {
//   employee: { id: string; firstName: string; lastName: string; baseSalary: number; effectiveBaseSalary: number; isSubjectToCnss: boolean; isSubjectToIrpp: boolean };
//   month: number; year: number; daysToPay: number; workDays: number;
//   absenceDeduction: number;
//   overtime: { hours10: number; amount10: number; hours25: number; amount25: number; hours50: number; amount50: number; hours100: number; amount100: number; total: number };
//   bonuses: Array<{ bonusType: string; amount: number }>;
//   adjustedBaseSalary: number; grossSalary: number;
//   cnssSalarial: number; its: number; totalDeductions: number; netSalary: number;
//   cnssEmployerPension: number; cnssEmployerFamily: number; cnssEmployerAccident: number;
//   tusDgiAmount: number; tusCnssAmount: number; totalEmployerCost: number;
//   loans: any[]; advances: any[];
//   totalLoanDeduction: number; totalAdvanceDeduction: number;
//   settings: { cnssSalarialRate: number; overtimeRate10: number; overtimeRate25: number; overtimeRate50: number; overtimeRate100: number };
// }

// // ─── Constants ───────────────────────────────────────────────────────────────

// const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

// const PRIME_SUGGESTIONS = [
//   "Prime d'ancienneté","Prime d'assiduité","Prime de confiance",
//   "Prime de garde","Prime de motivation","Prime de précaire",
//   "Prime de responsabilité","Prime de risque","Prime de base congé",
//   "Prime de diplôme","Prime de technicité","Prime de rendement",
//   "Prime de résultat","Prime de fin d'année",
// ];

// const INDEMNITE_SUGGESTIONS = [
//   "Indemnité de transport","Indemnité de logement","Indemnité de panier",
//   "Indemnité kilométrique","Indemnité de représentation","Indemnité vestimentaire",
//   "Indemnité de déplacement","Indemnité de téléphone",
// ];

// const MARITAL_LABELS: Record<string, string> = {
//   SINGLE: 'Célibataire', MARRIED: 'Marié(e)',
//   DIVORCED: 'Divorcé(e)', WIDOWED: 'Veuf/Veuve',
// };

// const uid  = () => Math.random().toString(36).slice(2, 9);
// const fmt  = (v: number) => Math.round(v || 0).toLocaleString('fr-FR');
// const n    = (v: number | '') => Number(v) || 0;

// const seniority = (hireDate?: string) => {
//   if (!hireDate) return null;
//   const hire = new Date(hireDate);
//   const now  = new Date();
//   const years  = now.getFullYear() - hire.getFullYear();
//   const months = now.getMonth() - hire.getMonth();
//   const total  = years + (months < 0 ? -1 : 0);
//   if (total < 1) {
//     const m = ((years * 12) + months + 12) % 12;
//     return `${m} mois`;
//   }
//   return `${total} an${total > 1 ? 's' : ''}`;
// };

// // ─── Micro-composants ────────────────────────────────────────────────────────

// const SLabel = ({ children }: { children: React.ReactNode }) => (
//   <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">{children}</label>
// );

// const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
//   <div className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 ${className}`}>
//     {children}
//   </div>
// );

// const SectionHeader = ({ icon, title, subtitle, total, color }: {
//   icon: React.ReactNode; title: string; subtitle: string; total?: number; color: string;
// }) => (
//   <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-700/50">
//     <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
//       {icon}
//     </div>
//     <div className="flex-1 min-w-0">
//       <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{title}</p>
//       <p className="text-[11px] text-gray-400 dark:text-gray-500">{subtitle}</p>
//     </div>
//     {total != null && total > 0 && (
//       <span className="text-sm font-mono font-bold text-gray-600 dark:text-gray-300 shrink-0">
//         {fmt(total)} F
//       </span>
//     )}
//   </div>
// );

// const BLine = ({ label, value, cls, sm }: { label: string; value: string; cls?: string; sm?: boolean }) => (
//   <div className={`flex items-center justify-between ${sm ? 'py-0.5' : 'py-1.5'}`}>
//     <span className={`${sm ? 'text-xs' : 'text-sm'} text-gray-500 dark:text-gray-400`}>{label}</span>
//     <span className={`font-mono font-bold tabular-nums ${sm ? 'text-xs' : 'text-sm'} ${cls ?? 'text-gray-700 dark:text-gray-200'}`}>{value}</span>
//   </div>
// );

// const SimpleRow = ({ row, onChangeLabel, onChangeAmount, onRemove, placeholder = 'Libellé…', amountPlaceholder = '0' }: {
//   row: Row; onChangeLabel: (v:string)=>void; onChangeAmount: (v:number|'')=>void; onRemove: ()=>void; placeholder?: string; amountPlaceholder?: string;
// }) => (
//   <motion.div initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-4 }} className="group flex items-center gap-2">
//     <input type="text" value={row.label} onChange={e => onChangeLabel(e.target.value)} placeholder={placeholder}
//       className="flex-1 min-w-0 px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-400/30 placeholder:text-gray-300 dark:placeholder:text-gray-600" />
//     <div className="relative w-32 shrink-0">
//       <input type="number" value={row.amount || ''} onChange={e => onChangeAmount(e.target.value===''?'':Number(e.target.value))} placeholder={amountPlaceholder}
//         className="w-full pl-3 pr-5 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-right text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-400/30" />
//       <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none">F</span>
//     </div>
//     <button onClick={onRemove} className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all shrink-0"><Trash2 size={13} /></button>
//   </motion.div>
// );

// const InputRow = ({
//   row, onChangeLabel, onChangeBase, onChangeRate, onRemove, placeholder = 'Libellé…',
// }: {
//   row: Row;
//   onChangeLabel: (v: string) => void;
//   onChangeBase: (v: number | '') => void;
//   onChangeRate: (v: number | '') => void;
//   onRemove: () => void;
//   placeholder?: string;
// }) => (
//   <motion.div
//     initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
//     className="group grid grid-cols-[1fr_100px_70px_90px_28px] gap-2 items-center"
//   >
//     <input
//       type="text"
//       value={row.label}
//       onChange={e => onChangeLabel(e.target.value)}
//       placeholder={placeholder}
//       className="px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-400/30 placeholder:text-gray-300 dark:placeholder:text-gray-600 w-full"
//     />
//     <div className="relative">
//       <input
//         type="number"
//         value={row.base}
//         onChange={e => onChangeBase(e.target.value === '' ? '' : Number(e.target.value))}
//         placeholder="Base"
//         className="w-full pl-2 pr-5 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono text-right text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
//       />
//       <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-gray-400 pointer-events-none">F</span>
//     </div>
//     <input
//       type="number"
//       value={row.rate}
//       step="0.01"
//       onChange={e => onChangeRate(e.target.value === '' ? '' : Number(e.target.value))}
//       placeholder="Taux"
//       className="w-full px-2 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono text-center text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
//     />
//     <div className={`px-2 py-2 rounded-xl text-sm font-black font-mono text-right tabular-nums border transition-colors ${
//       row.amount > 0
//         ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
//         : 'bg-gray-50 dark:bg-gray-900/30 border-gray-100 dark:border-gray-700/50 text-gray-300 dark:text-gray-600'
//     }`}>
//       {row.amount > 0 ? row.amount.toLocaleString('fr-FR') : '—'}
//     </div>
//     <button
//       onClick={onRemove}
//       className="p-1.5 text-gray-300 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
//     >
//       <Trash2 size={13} />
//     </button>
//   </motion.div>
// );


// // ─── Composant Calculatrice Cumuls ───────────────────────────────────────────
// // L'user tape "135040 + 128000 + 142000" → Enter ou "=" → résultat stocké

// interface CumulVals {
//   brut: number|''; netImp: number|''; chargesSal: number|''; chargesPat: number|'';
//   droits: number|''; pris: number|''; solde: number|'';
// }

// function evalExpr(expr: string): number {
//   // Évalue une expression simple avec + et -
//   // ex: "135040 + 128000 + 142000" → 405040
//   try {
//     const sanitized = expr.replace(/[^0-9+\-.\s]/g, '').trim();
//     if (!sanitized) return 0;
//     return sanitized.split('+').reduce((acc, part) => {
//       return acc + part.split('-').reduce((a, b, i) => i === 0 ? Number(b)||0 : a - (Number(b)||0), 0);
//     }, 0);
//   } catch { return 0; }
// }

// const CALC_FIELDS: { key: keyof CumulVals; label: string; color: string }[] = [
//   { key:'brut',        label:'Brut annuel',   color:'text-emerald-600 dark:text-emerald-400' },
//   { key:'netImp',      label:'Net imposable', color:'text-sky-600 dark:text-sky-400' },
//   { key:'chargesSal',  label:'Charges sal.',  color:'text-rose-600 dark:text-rose-400' },
//   { key:'chargesPat',  label:'Charges pat.',  color:'text-orange-600 dark:text-orange-400' },
// ];

// const CONGE_FIELDS: { key: keyof CumulVals; label: string }[] = [
//   { key:'droits', label:'Droits' },
//   { key:'pris',   label:'Pris' },
//   { key:'solde',  label:'Solde' },
// ];

// function CumulCalculatrice({ onValidate, values }: {
//   onValidate: (v: CumulVals) => void;
//   values: CumulVals;
// }) {
//   const [exprs, setExprs] = React.useState<Record<string, string>>({
//     brut:'', netImp:'', chargesSal:'', chargesPat:'', droits:'', pris:'', solde:'',
//   });
//   const [results, setResults] = React.useState<Record<string, number>>({});

//   const compute = (key: string, expr: string) => {
//     const val = evalExpr(expr);
//     const newResults = { ...results, [key]: val };
//     setResults(newResults);
//     // Notifier le parent avec toutes les valeurs
//     const merged: any = { ...values };
//     Object.entries(newResults).forEach(([k, v]) => { merged[k] = v || ''; });
//     onValidate(merged);
//   };

//   const handleKey = (key: string, expr: string, e: React.KeyboardEvent) => {
//     if (e.key === 'Enter' || e.key === '=') {
//       e.preventDefault();
//       compute(key, expr);
//     }
//   };

//   const handleBlur = (key: string, expr: string) => {
//     if (expr.trim()) compute(key, expr);
//   };

//   const renderField = (fieldKey: string, label: string, colorCls = '') => {
//     const expr   = exprs[fieldKey] ?? '';
//     const result = results[fieldKey];
//     const stored = (values as any)[fieldKey];
//     const display = result != null ? result : (stored ? Number(stored) : null);

//     return (
//       <div key={fieldKey}>
//         <p className={`text-[10px] font-bold mb-1 ${colorCls || 'text-gray-400'}`}>{label}</p>
//         <div className="relative">
//           <input
//             type="text"
//             value={expr}
//             onChange={e => setExprs(prev => ({ ...prev, [fieldKey]: e.target.value }))}
//             onKeyDown={e => handleKey(fieldKey, expr, e)}
//             onBlur={() => handleBlur(fieldKey, expr)}
//             placeholder="ex: 135040 + 128000 + 142000"
//             className="w-full pl-3 pr-2 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-mono text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-400/30 placeholder:text-gray-300 dark:placeholder:text-gray-600"
//           />
//         </div>
//         {display != null && display > 0 && (
//           <p className="text-right text-xs font-black font-mono text-sky-600 dark:text-sky-400 mt-0.5">
//             = {Math.round(display).toLocaleString('fr-FR')} F
//           </p>
//         )}
//       </div>
//     );
//   };

//   return (
//     <div className="space-y-3">
//       <p className="text-[10px] text-gray-400">
//         Tapez les montants séparés par <strong>+</strong> puis appuyez sur <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[9px]">Entrée</kbd> ou <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[9px]">=</kbd>
//       </p>

//       {/* Cumuls principaux */}
//       <div className="grid grid-cols-2 gap-3">
//         {CALC_FIELDS.map(({ key, label, color }) => renderField(key, label, color))}
//       </div>

//       {/* Congés */}
//       <div className="pt-2 border-t border-gray-100 dark:border-gray-700/50">
//         <p className="text-[10px] font-bold text-gray-400 mb-2">Congés annuels (jours)</p>
//         <div className="grid grid-cols-3 gap-2">
//           {CONGE_FIELDS.map(({ key, label }) => renderField(key, label))}
//         </div>
//       </div>
//     </div>
//   );
// }

// // ─── Page principale ─────────────────────────────────────────────────────────

// export default function ManuelPayrollPage() {
//   const router = useRouter();
//   const now    = new Date();

//   const [employees, setEmployees]       = useState<Employee[]>([]);
//   const [empSearch, setEmpSearch]       = useState('');
//   const [showDrop, setShowDrop]         = useState(false);
//   const [selectedEmp, setSelectedEmp]   = useState<Employee | null>(null);
//   const [empDetail, setEmpDetail]       = useState<Employee | null>(null);
//   const [loadingEmp, setLoadingEmp]     = useState(true);
//   const [loadingDetail, setLoadingDetail] = useState(false);
//   const [month, setMonth]               = useState(MONTHS[now.getMonth()]);
//   const [year, setYear]                 = useState(now.getFullYear());
//   const [workedDays, setWorkedDays]     = useState<number | ''>(26);
//   const [ot10, setOt10]   = useState<number | ''>(0);
//   const [ot25, setOt25]   = useState<number | ''>(0);
//   const [ot50, setOt50]   = useState<number | ''>(0);
//   const [ot100, setOt100] = useState<number | ''>(0);

//   const [bonusTemplates, setBonusTemplates] = useState<BonusTemplate[]>([]);
//   const [companyTaxes, setCompanyTaxes]     = useState<CompanyTax[]>([]);
//   const [empLoans, setEmpLoans]             = useState<Loan[]>([]);
//   const [empAdvances, setEmpAdvances]       = useState<Advance[]>([]);
//   const [companyInfo, setCompanyInfo]       = useState<CompanyInfo>({});

//   const [primes, setPrimes]           = useState<Row[]>([]);
//   const [indemnites, setIndemnites]   = useState<Row[]>([]);
//   const [taxes, setTaxes]             = useState<Row[]>([]);
//   const [loans, setLoans]             = useState<Row[]>([]);
//   const [advances, setAdvances]       = useState<Row[]>([]);
//   const [retenues, setRetenues]       = useState<ManualDeduction[]>([]);  // ✅ retenues libres

//   // ── Cumuls annuels — mode auto (ytd BDD) ou manuel (saisie) ─────────────
//   const [cumulMode, setCumulMode]             = useState<'auto'|'manuel'>('manuel');
//   const [cumulBrut, setCumulBrut]             = useState<number|''>('');
//   const [cumulNetImp, setCumulNetImp]         = useState<number|''>('');
//   const [cumulChargesSal, setCumulChargesSal] = useState<number|''>('');
//   const [cumulChargesPat, setCumulChargesPat] = useState<number|''>('');
//   const [congesDroits, setCongesDroits]       = useState<number|''>('');
//   const [congesPris, setCongesPris]           = useState<number|''>('');
//   const [congesSolde, setCongesSolde]         = useState<number|''>('');

//   const [showPrimeSugg, setShowPrimeSugg]     = useState(false);
//   const [showIndemSugg, setShowIndemSugg]     = useState(false);
//   const [showTaxSugg, setShowTaxSugg]         = useState(false);
//   const [primeSuggSearch, setPrimeSuggSearch] = useState('');
//   const [indemSuggSearch, setIndemSuggSearch] = useState('');

//   const [sim, setSim]               = useState<SimResult | null>(null);
//   const [simLoading, setSimLoading] = useState(false);
//   const [simError, setSimError]     = useState<string | null>(null);
//   const [showEmpCost, setShowEmpCost] = useState(false);
//   const debounceRef = useRef<NodeJS.Timeout | null>(null);

//   const [submitting, setSubmitting] = useState(false);
//   const [success, setSuccess]       = useState(false);
//   const [createdId, setCreatedId]   = useState<string | null>(null);

//   useEffect(() => {
//     api.get<any>('/employees/simple')
//       .then(r => setEmployees(Array.isArray(r) ? r : (r?.data ?? [])))
//       .catch(() => setEmployees([]))
//       .finally(() => setLoadingEmp(false));
//   }, []);

//   useEffect(() => {
//     Promise.all([
//       api.get<any>('/bonus-templates').catch(() => []),
//       api.get<any>('/company-taxes').catch(() => []),
//       api.get<any>('/company/info').catch(() => ({})),
//     ]).then(([bt, ct, ci]) => {
//       setBonusTemplates((Array.isArray(bt) ? bt : []).filter((t: BonusTemplate) => t.isActive));
//       setCompanyTaxes((Array.isArray(ct) ? ct : []).filter((t: CompanyTax) => t.isActive));
//       setCompanyInfo(ci ?? {});
//     });
//   }, []);

//   // ✅ Vérifier si c'est l'entreprise parafifi — logique ancienneté/gratif/congés spéciale
//   const isParafifi = companyInfo?.email === 'admin@parafifi.cg';

//   useEffect(() => {
//     if (!selectedEmp) {
//       setEmpDetail(null); setEmpLoans([]); setEmpAdvances([]);
//       setLoans([]); setAdvances([]);
//       return;
//     }
//     setLoadingDetail(true);
//     Promise.all([
//       api.get<any>(`/employees/${selectedEmp.id}`).catch(() => null),
//       api.get<any>('/loans').catch(() => []),
//       api.get<any>('/loans/advances').catch(() => []),
//     ]).then(([detail, allLoans, allAdvances]) => {
//       setEmpDetail(detail);
//       const empId = selectedEmp.id;
//       const activeLoans = (Array.isArray(allLoans) ? allLoans : [])
//         .filter((l: Loan) => (l.employeeId === empId || l.employee?.id === empId) && l.status === 'ACTIVE');
//       const pendingAdv  = (Array.isArray(allAdvances) ? allAdvances : [])
//         .filter((a: Advance) => (a.employeeId === empId || a.employee?.id === empId) && a.status === 'APPROVED' && !a.deducted);
//       setEmpLoans(activeLoans);
//       setEmpAdvances(pendingAdv);
//     }).finally(() => setLoadingDetail(false));
//   }, [selectedEmp]);

//   const filtered = empSearch.length >= 1
//     ? employees.filter(e =>
//         `${e.firstName} ${e.lastName} ${e.employeeNumber ?? ''}`.toLowerCase()
//           .includes(empSearch.toLowerCase())
//       ).slice(0, 8)
//     : [];

//   const newRow = (label = ''): Row => ({ localId: uid(), label, base: '', rate: 1, amount: 0 });

//   const updateRow = (set: React.Dispatch<React.SetStateAction<Row[]>>, localId: string, patch: Partial<Row>) =>
//     set(prev => prev.map(r => {
//       if (r.localId !== localId) return r;
//       const next = { ...r, ...patch };
//       next.amount = Math.round((Number(next.base) || 0) * (Number(next.rate) || 0));
//       return next;
//     }));

//   const removeRow = (set: React.Dispatch<React.SetStateAction<Row[]>>, localId: string) =>
//     set(prev => prev.filter(r => r.localId !== localId));

//   const addSuggestion = (
//     set: React.Dispatch<React.SetStateAction<Row[]>>,
//     rows: Row[],
//     label: string,
//     defaultAmount = 0
//   ) => {
//     if (rows.some(r => r.label === label)) return;
//     set(prev => [...prev, { ...newRow(label), base: defaultAmount || '', rate: defaultAmount ? 1 : '', amount: defaultAmount || 0 }]);
//   };

//   const addTaxFromTemplate = (tax: CompanyTax) => {
//     if (taxes.some(t => t.refId === tax.id)) return;
//     const grossEst = n(empDetail?.baseSalary as any) + primes.reduce((s,r) => s + n(r.amount), 0);
//     const fixed = Number(tax.fixedEmployee);
//     const rate  = Number(tax.employeeRate);
//     const amt   = fixed > 0 ? fixed : Math.round(grossEst * rate);
//     const id    = tax.id;
//     const name  = tax.name;
//     setTaxes(prev => [...prev, { localId: uid(), refId: id, label: name, base: '', rate: 1, amount: amt }]);
//   };

//   // ── Détection auto prime par label — universel ──────────────────────────────
//   const applyAutoIfNeeded = (localId: string, label: string) => {
//     if (!empDetail?.baseSalary) return;
//     const l    = label.toLowerCase().trim();
//     const base = Number(empDetail.baseSalary);
//     if (/anc[iè]/i.test(l)) {
//       const years = getSeniorityYears(empDetail.hireDate);
//       if (years > 0) {
//         const rate = years / 100;
//         setPrimes(prev => prev.map(r => r.localId === localId ? { ...r, base, rate, amount: Math.round(base * rate) } : r));
//       }
//       return;
//     }
//     if (/gratif/i.test(l)) {
//       setPrimes(prev => prev.map(r => r.localId === localId ? { ...r, base, rate: 0.5, amount: Math.round(base / 2) } : r));
//       return;
//     }
//     if (/cong[eé]/i.test(l)) {
//       const brutMois  = base + primes.filter(p => p.localId !== localId).reduce((s, p) => s + p.amount, 0);
//       const baseConge = Math.round((base / 2 + brutMois * 12) / 12);
//       setPrimes(prev => prev.map(r => r.localId === localId ? { ...r, base: baseConge, rate: 1, amount: baseConge } : r));
//       return;
//     }
//   };

//   // ── ✅ Helper payload — base toujours renseignée, rate seulement si significatif ──
//   // ── Calculs spéciaux Parafifi ──────────────────────────────────────────────

//   // Ancienneté en années complètes (ex: 5 ans → 0.05, 29 ans → 0.29)
//   const getSeniorityRate = (hireDate?: string): number => {
//     if (!hireDate) return 0;
//     const hire = new Date(hireDate);
//     const now  = new Date();
//     let years  = now.getFullYear() - hire.getFullYear();
//     const m    = now.getMonth() - hire.getMonth();
//     if (m < 0 || (m === 0 && now.getDate() < hire.getDate())) years--;
//     return Math.max(0, years) / 100; // 5 ans → 0.05
//   };

//   const getSeniorityYears = (hireDate?: string): number => {
//     if (!hireDate) return 0;
//     const hire = new Date(hireDate);
//     const now  = new Date();
//     let years  = now.getFullYear() - hire.getFullYear();
//     const m    = now.getMonth() - hire.getMonth();
//     if (m < 0 || (m === 0 && now.getDate() < hire.getDate())) years--;
//     return Math.max(0, years);
//   };

//   // Ajouter prime d'ancienneté auto (Parafifi) : base = salaire de base, rate = années/100
//   const addAnciennete = () => {
//     if (!empDetail?.baseSalary || !empDetail?.hireDate) return;
//     const base  = Number(empDetail.baseSalary);
//     const years = getSeniorityYears(empDetail.hireDate);
//     if (years === 0) return;
//     const rate   = years / 100;  // 5 ans → 0.05 → affiché "0,05"
//     const amount = Math.round(base * rate);
//     const label  = "Prime d'ancienneté";
//     if (primes.some(p => p.label === label)) return;
//     setPrimes(prev => [...prev, { localId: uid(), label, base, rate, amount }]);
//   };

//   // Gratification = salaire de base / 2 (base brute, pas ajustée)
//   const addGratification = () => {
//     if (!empDetail?.baseSalary) return;
//     const base   = Number(empDetail.baseSalary);
//     const amount = Math.round(base / 2);
//     const label  = 'Gratification';
//     if (primes.some(p => p.label === label)) return;
//     setPrimes(prev => [...prev, { localId: uid(), label, base, rate: 0.5, amount }]);
//   };

//   // Congés payés (Parafifi) :
//   // Gratification = baseSalary / 2
//   // Brut annuel   = brut mois en cours × 12
//   // Base congé    = (gratification + brut annuel) / 12
//   const addCongesPaies = () => {
//     if (!empDetail?.baseSalary) return;
//     const baseSal      = Number(empDetail.baseSalary);
//     const gratif       = baseSal / 2;
//     // brut mois = baseSalary + toutes les primes déjà saisies
//     const brutMois     = baseSal + primes.reduce((s, p) => s + p.amount, 0);
//     const brutAnnuel   = brutMois * 12;
//     const baseConge    = Math.round((gratif + brutAnnuel) / 12);
//     const label        = 'Congés payés';
//     if (primes.some(p => p.label === label)) return;
//     // rate=1 car base = montant direct (pas de multiplicateur)
//     setPrimes(prev => [...prev, { localId: uid(), label, base: baseConge, rate: 1, amount: baseConge }]);
//   };

//   const buildBonusPayload = (rows: Row[], taxable: boolean) =>
//     rows.filter(r => n(r.amount) > 0).map(r => ({
//       bonusType:  r.label || (taxable ? 'Prime' : 'Indemnité'),
//       amount:     r.amount,
//       // ✅ Si base non saisie → base = amount (gain direct sans calcul)
//       base:       n(r.base) > 0 ? n(r.base) : r.amount,
//       // ✅ Rate seulement si saisi et différent de 0 et 1
//       // Si pas de taux ou taux=1 → gain=base, on n'envoie pas rate
//       // Les HS ont leur propre logique dans payroll-items_service, pas touchées ici
//       rate:       n(r.rate) > 0 && n(r.rate) !== 1 ? n(r.rate) : undefined,
//       isTaxable:  taxable,
//       isCnss:     taxable,
//       fiscalType: taxable ? 'TAXABLE_CNSS' : 'NON_TAXABLE',
//     }));

//   useEffect(() => {
//     if (!selectedEmp || !empDetail) return;
//     if (debounceRef.current) clearTimeout(debounceRef.current);
//     debounceRef.current = setTimeout(runSim, 700);
//     return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [primes, indemnites, selectedEmp, empDetail, month, year, workedDays, ot10, ot25, ot50, ot100]);

//   const runSim = async () => {
//     if (!selectedEmp || !empDetail) return;
//     const baseSal = n(empDetail.baseSalary as any);
//     if (!baseSal) return;

//     const primesPayload = buildBonusPayload(primes, true);
//     const indemPayload  = buildBonusPayload(indemnites, false);
//     const manualBonuses = [...primesPayload, ...indemPayload];
//     const manualDeductionsPayload = retenues.filter(r => n(r.amount) > 0)
//       .map(r => ({ label: r.label || 'Retenue', amount: n(r.amount) }));

//     setSimLoading(true); setSimError(null);
//     try {
//       const result = await api.post<SimResult>('/payrolls/simulate', {
//         employeeId: selectedEmp.id,
//         month: MONTHS.findIndex(m => m === month) + 1,
//         year, workedDays: n(workedDays) || 26,
//         baseSalary: baseSal,
//         overtimeHours10:  n(ot10),
//         overtimeHours25:  n(ot25),
//         overtimeHours50:  n(ot50),
//         overtimeHours100: n(ot100),
//         manualBonuses:     manualBonuses.length > 0 ? manualBonuses : undefined,
//         manualDeductions:  manualDeductionsPayload.length > 0 ? manualDeductionsPayload : undefined,
//       });
//       setSim(result);
//     } catch (e: any) {
//       setSimError(e?.response?.data?.message || e?.message || 'Erreur');
//       setSim(null);
//     } finally {
//       setSimLoading(false);
//     }
//   };

//   const submit = async () => {
//     if (!selectedEmp || !sim || !empDetail) return;
//     setSubmitting(true);
//     try {
//       // ✅ Même helper — cohérence simulate / create
//       const primesP = buildBonusPayload(primes, true);
//       const indemP  = buildBonusPayload(indemnites, false);

//       const manualDedP = retenues.filter(r => n(r.amount) > 0)
//         .map(r => ({ label: r.label || 'Retenue', amount: n(r.amount) }));
//       const result: any = await api.post('/payrolls/manual', {
//         employeeId: selectedEmp.id,
//         month: MONTHS.findIndex(m => m === month) + 1,
//         year, workedDays: n(workedDays) || 26,
//         baseSalary: n(empDetail.baseSalary as any),
//         overtimeHours10:  n(ot10), overtimeHours25: n(ot25),
//         overtimeHours50:  n(ot50), overtimeHours100: n(ot100),
//         manualBonuses:    [...primesP, ...indemP],
//         cumulBrut:        cumulMode === 'manuel' ? (n(cumulBrut) || undefined)       : undefined,
//         cumulNetImp:      cumulMode === 'manuel' ? (n(cumulNetImp) || undefined)     : undefined,
//         cumulChargesSal:  cumulMode === 'manuel' ? (n(cumulChargesSal) || undefined) : undefined,
//         cumulChargesPat:  cumulMode === 'manuel' ? (n(cumulChargesPat) || undefined) : undefined,
//         congesDroits:     n(congesDroits) || undefined,
//         congesPris:       n(congesPris)   || undefined,
//         congesSolde:      n(congesSolde)  || undefined,
//         manualDeductions: manualDedP.length > 0 ? manualDedP : undefined,
//       });
//       setCreatedId(result?.id || null);
//       setSuccess(true);
//     } catch (e: any) {
//       alert(`Erreur : ${e?.response?.data?.message || e?.message}`);
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const resetPage = () => {
//     setSuccess(false); setSim(null); setSelectedEmp(null); setEmpSearch('');
//     setEmpDetail(null); setEmpLoans([]); setEmpAdvances([]);
//     setWorkedDays(26); setOt10(0); setOt25(0); setOt50(0); setOt100(0);
//     setPrimes([]); setIndemnites([]); setTaxes([]); setLoans([]); setAdvances([]); setRetenues([]);
//     setCumulBrut(''); setCumulNetImp(''); setCumulChargesSal(''); setCumulChargesPat('');
//     setCongesDroits(''); setCongesPris(''); setCongesSolde(''); setCumulMode('manuel');
//   };

//   const hasOt = [ot10,ot25,ot50,ot100].some(v => n(v) > 0);
//   const totalPrimes     = primes.reduce((s,r) => s + r.amount, 0);
//   const totalIndemnites = indemnites.reduce((s,r) => s + r.amount, 0);
//   const totalTaxes      = taxes.reduce((s,r) => s+n(r.amount), 0);
//   const totalLoans      = loans.reduce((s,r) => s+n(r.amount), 0);
//   const totalAdvances   = advances.reduce((s,r) => s+n(r.amount), 0);
//   const totalRetenues   = retenues.reduce((s,r) => s+n(r.amount), 0);

//   const dbPrimeSugg = bonusTemplates.filter(t => t.isTaxable);
//   const dbIndemSugg = bonusTemplates.filter(t => !t.isTaxable);

//   return (
//     <div className="max-w-[1380px] mx-auto pb-28 px-4 pt-1">

//       {/* ── Header ── */}
//       <div className="flex items-center gap-4 mb-7">
//         <button onClick={() => router.back()}
//           className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shrink-0">
//           <ArrowLeft size={18} className="text-gray-500" />
//         </button>
//         <div>
//           <div className="flex items-center gap-2.5">
//             <h1 className="text-xl font-bold text-gray-900 dark:text-white">Saisie manuelle de paie</h1>
//             <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 uppercase tracking-wide">Manuel</span>
//           </div>
//           <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">CNSS, ITS et TUS calculés automatiquement selon la nature de chaque élément</p>
//         </div>
//       </div>

//       <div className="grid lg:grid-cols-5 gap-6 items-start">

//         {/* ════ COL GAUCHE ════ */}
//         <div className="lg:col-span-3 space-y-4">

//           {/* ── Période ── */}
//           <Card className="p-5">
//             <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4">Période</p>
//             <div className="grid grid-cols-2 gap-3">
//               <div>
//                 <SLabel>Mois</SLabel>
//                 <select value={month} onChange={e => setMonth(e.target.value)}
//                   className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30">
//                   {MONTHS.map(m => <option key={m}>{m}</option>)}
//                 </select>
//               </div>
//               <div>
//                 <SLabel>Année</SLabel>
//                 <select value={year} onChange={e => setYear(Number(e.target.value))}
//                   className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30">
//                   {[2023,2024,2025,2026,2027].map(y => <option key={y}>{y}</option>)}
//                 </select>
//               </div>
//             </div>
//           </Card>

//           {/* ── Employé ── */}
//           <Card className="overflow-visible">
//             <div className="px-5 pt-5 pb-4">
//               <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Employé</p>

//               {selectedEmp ? (
//                 <div>
//                   <div className="flex items-start justify-between p-3 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-2xl mb-4">
//                     <div className="flex items-center gap-3">
//                       <div className="w-11 h-11 rounded-xl bg-sky-200 dark:bg-sky-800 flex items-center justify-center text-sky-700 dark:text-sky-300 font-black text-sm shrink-0">
//                         {selectedEmp.firstName[0]}{selectedEmp.lastName[0]}
//                       </div>
//                       <div>
//                         <p className="font-bold text-gray-900 dark:text-white">{selectedEmp.firstName} {selectedEmp.lastName}</p>
//                         <p className="text-xs text-gray-500">{selectedEmp.position}</p>
//                       </div>
//                     </div>
//                     <div className="flex items-center gap-2">
//                       {loadingDetail && <Loader2 size={14} className="animate-spin text-sky-500" />}
//                       <button onClick={() => { setSelectedEmp(null); setEmpSearch(''); setSim(null); }}
//                         className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
//                         <X size={14} />
//                       </button>
//                     </div>
//                   </div>

//                   {empDetail && (
//                     <div className="grid grid-cols-2 gap-2">
//                       {[
//                         { icon: <BadgeCheck size={13} />, label: 'Matricule',   value: empDetail.employeeNumber || '—' },
//                         { icon: <Briefcase  size={13} />, label: 'Contrat',     value: empDetail.contractType   || '—' },
//                         { icon: <Calendar   size={13} />, label: 'Ancienneté',  value: seniority(empDetail.hireDate) ?? '—' },
//                         { icon: <Users      size={13} />, label: 'Situation',
//                           value: `${MARITAL_LABELS[empDetail.maritalStatus ?? ''] ?? '—'}${empDetail.numberOfChildren ? ` · ${empDetail.numberOfChildren} enf.` : ''}` },
//                       ].map(({ icon, label, value }) => (
//                         <div key={label} className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-900/40 rounded-xl">
//                           <span className="text-gray-400 dark:text-gray-500 shrink-0">{icon}</span>
//                           <div className="min-w-0">
//                             <p className="text-[10px] text-gray-400 dark:text-gray-500">{label}</p>
//                             <p className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">{value}</p>
//                           </div>
//                         </div>
//                       ))}
//                       <div className="col-span-2 flex items-center justify-between px-3 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl">
//                         <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Salaire de base</span>
//                         <span className="text-sm font-black font-mono text-emerald-700 dark:text-emerald-300">
//                           {empDetail.baseSalary ? `${fmt(Number(empDetail.baseSalary))} FCFA` : '—'}
//                         </span>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               ) : (
//                 <div className="relative">
//                   <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
//                   <input type="text" value={empSearch}
//                     onChange={e => { setEmpSearch(e.target.value); setShowDrop(true); }}
//                     onFocus={() => setShowDrop(true)}
//                     placeholder="Rechercher par nom, prénom ou matricule…"
//                     className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 text-gray-800 dark:text-gray-200 placeholder:text-gray-400" />
//                   <AnimatePresence>
//                     {showDrop && filtered.length > 0 && (
//                       <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
//                         className="absolute z-30 left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
//                         {filtered.map((e, i) => (
//                           <button key={e.id}
//                             onClick={() => { setSelectedEmp(e); setEmpSearch(''); setShowDrop(false); }}
//                             className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-sky-50 dark:hover:bg-sky-900/20 text-left transition-colors ${i > 0 ? 'border-t border-gray-50 dark:border-gray-700/50' : ''}`}>
//                             <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-[11px] font-black text-gray-600 dark:text-gray-300 shrink-0">
//                               {e.firstName[0]}{e.lastName[0]}
//                             </div>
//                             <div className="min-w-0">
//                               <p className="text-sm font-bold text-gray-900 dark:text-white">{e.firstName} {e.lastName}</p>
//                               <p className="text-[11px] text-gray-400 truncate">
//                                 {[e.employeeNumber, e.position, e.department?.name].filter(Boolean).join(' · ')}
//                               </p>
//                             </div>
//                           </button>
//                         ))}
//                       </motion.div>
//                     )}
//                   </AnimatePresence>
//                 </div>
//               )}
//             </div>

//             {selectedEmp && (
//               <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-700/50 pt-4">
//                 <SLabel>Jours travaillés <span className="font-normal text-gray-400">/ 26 jours théoriques</span></SLabel>
//                 <div className="flex items-center gap-3">
//                   <input type="number" min={0} max={26} value={workedDays}
//                     onChange={e => setWorkedDays(e.target.value === '' ? '' : Math.min(26, Math.max(0, Number(e.target.value))))}
//                     className="w-20 px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-center text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30" />
//                   <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
//                     <div className="h-full bg-sky-400 rounded-full transition-all"
//                       style={{ width: `${Math.min(100,(n(workedDays)/26)*100)}%` }} />
//                   </div>
//                   <span className="text-xs text-gray-400 tabular-nums w-8 text-right">{Math.round((n(workedDays)/26)*100)}%</span>
//                 </div>
//               </div>
//             )}
//           </Card>

//           {/* ── Heures supplémentaires ── */}
//           <Card className="p-5">
//             <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Heures supplémentaires</p>
//             <div className="grid grid-cols-4 gap-3">
//               {([
//                 { label:'+10%',  v:ot10,  set:setOt10,  col:'text-amber-500',  ring:'focus:ring-amber-400/30' },
//                 { label:'+25%',  v:ot25,  set:setOt25,  col:'text-orange-500', ring:'focus:ring-orange-400/30' },
//                 { label:'+50%',  v:ot50,  set:setOt50,  col:'text-rose-500',   ring:'focus:ring-rose-400/30' },
//                 { label:'+100%', v:ot100, set:setOt100, col:'text-red-500',    ring:'focus:ring-red-400/30' },
//               ] as const).map(({ label, v, set, col, ring }) => (
//                 <div key={label} className="text-center">
//                   <label className={`block text-xs font-bold mb-1.5 ${col}`}>{label}</label>
//                   <div className="relative">
//                     <input type="number" min={0} value={v}
//                       onChange={e => set(e.target.value === '' ? 0 : Number(e.target.value) as any)}
//                       className={`w-full pl-2 pr-5 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-center text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 ${ring}`} />
//                     <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">h</span>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </Card>

//           {/* ── Primes ── */}
//           <Card className="overflow-visible">
//             <SectionHeader
//               icon={<span className="text-violet-600 dark:text-violet-400 text-xs font-black">%</span>}
//               title="Primes"
//               subtitle="Soumises à CNSS et ITS — viennent avant le brut"
//               total={totalPrimes}
//               color="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 text-violet-600"
//             />
//             <div className="px-5 py-4 space-y-2">
//               <div className="grid grid-cols-[1fr_100px_70px_90px_28px] gap-2 px-1 mb-1">
//                 {['Libellé','Base (F)','Taux','Gain (F)',''].map((h,i) => (
//                   <span key={i} className={`text-[10px] font-bold text-gray-400 uppercase tracking-wide ${i===3?'text-right':''}`}>{h}</span>
//                 ))}
//               </div>
//               <AnimatePresence initial={false}>
//                 {primes.map(row => (
//                   <InputRow key={row.localId} row={row}
//                     placeholder="Ex : Prime d'ancienneté, de rendement…"
//                     onChangeLabel={v => {
//                       updateRow(setPrimes, row.localId, { label: v });
//                       applyAutoIfNeeded(row.localId, v);
//                     }}
//                     onChangeBase={v => updateRow(setPrimes, row.localId, { base: v })}
//                     onChangeRate={v => updateRow(setPrimes, row.localId, { rate: v })}
//                     onRemove={() => removeRow(setPrimes, row.localId)} />
//                 ))}
//               </AnimatePresence>
//               <div className="flex flex-wrap items-center gap-2 pt-1">
//                 <button onClick={() => setPrimes(p => [...p, newRow()])}
//                   className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/30 rounded-lg transition-colors">
//                   <Plus size={11} /> Ajouter une prime
//                 </button>
//                 <div className="relative">
//                   <button onClick={() => setShowPrimeSugg(v => !v)}
//                     className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
//                     Suggestions <ChevronDown size={9} className={`transition-transform ${showPrimeSugg ? 'rotate-180':''}`} />
//                   </button>
//                   <AnimatePresence>
//                     {showPrimeSugg && (
//                       <motion.div initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
//                         className="absolute z-[999] left-0 top-full mt-1.5 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-3 space-y-1.5">
//                         <input type="text" value={primeSuggSearch} onChange={e => setPrimeSuggSearch(e.target.value)}
//                           placeholder="Rechercher une prime…"
//                           className="w-full px-3 py-1.5 mb-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-400/30 text-gray-700 dark:text-gray-300" />
//                         <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
//                           {(dbPrimeSugg.length > 0
//                             ? dbPrimeSugg.map(t => ({ name: t.name, amount: t.defaultAmount ? String(Number(t.defaultAmount)) : '' }))
//                             : PRIME_SUGGESTIONS.map(s => ({ name: s, amount: '' }))
//                           ).filter(({ name }) => !primeSuggSearch || name.toLowerCase().includes(primeSuggSearch.toLowerCase()))
//                           .map(({ name, amount }) => {
//                             const added = primes.some(r => r.label === name);
//                             return (
//                               <button key={name}
//                                 onClick={() => { addSuggestion(setPrimes, primes, name, amount as any); }}
//                                 disabled={added}
//                                 className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${added ? 'opacity-40 cursor-not-allowed bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-400' : 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800 hover:bg-violet-100'}`}>
//                                 {added ? <Check size={9}/> : <Plus size={9}/>} {name}
//                               </button>
//                             );
//                           })}
//                         </div>
//                         <button onClick={() => setShowPrimeSugg(false)} className="w-full pt-1 text-xs text-gray-400 hover:text-gray-600 transition-colors">Fermer</button>
//                       </motion.div>
//                     )}
//                   </AnimatePresence>
//                 </div>
//               </div>
//             </div>
//           </Card>

//           {/* ── Indemnités ── */}
//           <Card className="overflow-visible">
//             <SectionHeader
//               icon={<span className="text-emerald-600 dark:text-emerald-400 text-xs font-black">≠</span>}
//               title="Indemnités"
//               subtitle="Non soumises à CNSS ni ITS — transport, logement, panier…"
//               total={totalIndemnites}
//               color="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-600"
//             />
//             <div className="px-5 py-4 space-y-2">
//               <div className="grid grid-cols-[1fr_100px_70px_90px_28px] gap-2 px-1 mb-1">
//                 {['Libellé','Base (F)','Taux','Gain (F)',''].map((h,i) => (
//                   <span key={i} className={`text-[10px] font-bold text-gray-400 uppercase tracking-wide ${i===3?'text-right':''}`}>{h}</span>
//                 ))}
//               </div>
//               <AnimatePresence initial={false}>
//                 {indemnites.map(row => (
//                   <InputRow key={row.localId} row={row}
//                     placeholder="Ex : Indemnité de transport, de logement…"
//                     onChangeLabel={v => updateRow(setIndemnites, row.localId, { label: v })}
//                     onChangeBase={v => updateRow(setIndemnites, row.localId, { base: v })}
//                     onChangeRate={v => updateRow(setIndemnites, row.localId, { rate: v })}
//                     onRemove={() => removeRow(setIndemnites, row.localId)} />
//                 ))}
//               </AnimatePresence>
//               <div className="flex flex-wrap items-center gap-2 pt-1">
//                 <button onClick={() => setIndemnites(p => [...p, newRow()])}
//                   className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg transition-colors">
//                   <Plus size={11} /> Ajouter une indemnité
//                 </button>
//                 <div className="relative">
//                   <button onClick={() => setShowIndemSugg(v => !v)}
//                     className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
//                     Suggestions <ChevronDown size={9} className={`transition-transform ${showIndemSugg?'rotate-180':''}`} />
//                   </button>
//                   <AnimatePresence>
//                     {showIndemSugg && (
//                       <motion.div initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
//                         className="absolute z-[999] left-0 top-full mt-1.5 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-3">
//                         <input type="text" value={indemSuggSearch} onChange={e => setIndemSuggSearch(e.target.value)}
//                           placeholder="Rechercher une indemnité…"
//                           className="w-full px-3 py-1.5 mb-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400/30 text-gray-700 dark:text-gray-300" />
//                         <div className="flex flex-wrap gap-1.5">
//                           {(dbIndemSugg.length > 0
//                             ? dbIndemSugg.map(t => ({ name: t.name, amount: t.defaultAmount ? String(Number(t.defaultAmount)) : '' }))
//                             : INDEMNITE_SUGGESTIONS.map(s => ({ name: s, amount: '' }))
//                           ).filter(({ name }) => !indemSuggSearch || name.toLowerCase().includes(indemSuggSearch.toLowerCase()))
//                           .map(({ name, amount }) => {
//                             const added = indemnites.some(r => r.label === name);
//                             return (
//                               <button key={name}
//                                 onClick={() => addSuggestion(setIndemnites, indemnites, name, amount as any)}
//                                 disabled={added}
//                                 className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${added ? 'opacity-40 cursor-not-allowed bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-400' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'}`}>
//                                 {added ? <Check size={9}/> : <Plus size={9}/>} {name}
//                               </button>
//                             );
//                           })}
//                         </div>
//                         <button onClick={() => setShowIndemSugg(false)} className="w-full pt-2 text-xs text-gray-400 hover:text-gray-600 transition-colors">Fermer</button>
//                       </motion.div>
//                     )}
//                   </AnimatePresence>
//                 </div>
//               </div>
//             </div>
//           </Card>

//           {/* ── Taxes ── */}
//           <Card className="overflow-visible">
//             <SectionHeader
//               icon={<Building2 size={14} className="text-amber-600 dark:text-amber-400" />}
//               title="Taxes & Retenues spécifiques"
//               subtitle="CNSS et ITS automatiques — ajoutez ici les taxes supplémentaires"
//               total={totalTaxes}
//               color="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
//             />
//             <div className="px-5 py-4 space-y-2">
//               <AnimatePresence initial={false}>
//                 {taxes.map(row => (
//                   <SimpleRow key={row.localId} row={row}
//                     placeholder="Ex : CAMU, TOL, Taxe d'apprentissage…"
//                     onChangeLabel={v => updateRow(setTaxes, row.localId, { label: v })}
//                     onChangeAmount={v => updateRow(setTaxes, row.localId, { amount: Number(v)||0 })}
//                     onRemove={() => removeRow(setTaxes, row.localId)} />
//                 ))}
//               </AnimatePresence>
//               <div className="flex flex-wrap items-center gap-2 pt-1">
//                 <button onClick={() => setTaxes(p => [...p, newRow()])}
//                   className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg transition-colors">
//                   <Plus size={11} /> Ajouter une taxe
//                 </button>
//                 {companyTaxes.length > 0 && (
//                   <div className="relative">
//                     <button onClick={() => setShowTaxSugg(v => !v)}
//                       className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
//                       Taxes configurées <ChevronDown size={9} className={`transition-transform ${showTaxSugg?'rotate-180':''}`} />
//                     </button>
//                     <AnimatePresence>
//                       {showTaxSugg && (
//                         <motion.div initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
//                           className="absolute z-[999] left-0 top-full mt-1.5 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-3">
//                           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Taxes de l'entreprise</p>
//                           <div className="space-y-1">
//                             {companyTaxes.map(tax => {
//                               const added = taxes.some(t => t.refId === tax.id);
//                               return (
//                                 <button key={tax.id} onClick={() => { addTaxFromTemplate(tax); setShowTaxSugg(false); }} disabled={added}
//                                   className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors ${added ? 'opacity-40 cursor-not-allowed' : 'hover:bg-amber-50 dark:hover:bg-amber-900/20'}`}>
//                                   <div className="text-left">
//                                     <p className="font-semibold text-gray-800 dark:text-gray-200">{tax.name}</p>
//                                     <p className="text-[10px] text-gray-400 font-mono">{tax.code} · {Number(tax.fixedEmployee)>0?`${fmt(Number(tax.fixedEmployee))} F fixe`:`${(Number(tax.employeeRate)*100).toFixed(2)}%`}</p>
//                                   </div>
//                                   {added ? <Check size={12} className="text-emerald-500"/> : <Plus size={12} className="text-gray-400"/>}
//                                 </button>
//                               );
//                             })}
//                           </div>
//                         </motion.div>
//                       )}
//                     </AnimatePresence>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </Card>

//           {/* ── Prêts ── */}
//           <Card className="overflow-hidden">
//             <SectionHeader
//               icon={<CreditCard size={14} className="text-orange-600 dark:text-orange-400" />}
//               title="Prêts"
//               subtitle="Remboursements mensuels à déduire du net"
//               total={[...empLoans.map(l => Number(l.monthlyRepayment)), ...loans.map(r => n(r.amount))].reduce((s,v)=>s+v,0)}
//               color="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800"
//             />
//             <div className="px-5 py-4 space-y-2">
//               {empLoans.map(loan => (
//                 <div key={loan.id} className="flex items-center justify-between px-3 py-2.5 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/40 rounded-xl">
//                   <div>
//                     <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Prêt{loan.reason ? ` — ${loan.reason}` : ''}</p>
//                     <p className="text-[11px] text-gray-400">Solde restant : {fmt(Number(loan.remainingBalance))} F</p>
//                   </div>
//                   <span className="text-sm font-mono font-black text-orange-600 dark:text-orange-400">−{fmt(Number(loan.monthlyRepayment))} F</span>
//                 </div>
//               ))}
//               <AnimatePresence initial={false}>
//                 {loans.map(row => (
//                   <SimpleRow key={row.localId} row={row}
//                     placeholder="Ex : Remboursement prêt logement…"
//                     amountPlaceholder="Mensualité"
//                     onChangeLabel={v => updateRow(setLoans, row.localId, { label: v })}
//                     onChangeAmount={v => updateRow(setLoans, row.localId, { amount: Number(v)||0 })}
//                     onRemove={() => removeRow(setLoans, row.localId)} />
//                 ))}
//               </AnimatePresence>
//               <button onClick={() => setLoans(p => [...p, newRow()])}
//                 className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-lg transition-colors mt-1">
//                 <Plus size={11} /> Ajouter un prêt manuellement
//               </button>
//             </div>
//           </Card>

//           {/* ── Avances ── */}
//           <Card className="overflow-hidden">
//             <SectionHeader
//               icon={<Wallet size={14} className="text-red-600 dark:text-red-400" />}
//               title="Avances sur salaire"
//               subtitle="Montants à déduire du net ce mois-ci"
//               total={[...empAdvances.map(a => Number(a.amount)), ...advances.map(r => n(r.amount))].reduce((s,v)=>s+v,0)}
//               color="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
//             />
//             <div className="px-5 py-4 space-y-2">
//               {empAdvances.map(adv => (
//                 <div key={adv.id} className="flex items-center justify-between px-3 py-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl">
//                   <div>
//                     <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Avance sur salaire</p>
//                     {adv.reason && <p className="text-[11px] text-gray-400">{adv.reason}</p>}
//                   </div>
//                   <span className="text-sm font-mono font-black text-red-600 dark:text-red-400">−{fmt(Number(adv.amount))} F</span>
//                 </div>
//               ))}
//               <AnimatePresence initial={false}>
//                 {advances.map(row => (
//                   <SimpleRow key={row.localId} row={row}
//                     placeholder="Ex : Avance du 15 janvier…"
//                     amountPlaceholder="Montant"
//                     onChangeLabel={v => updateRow(setAdvances, row.localId, { label: v })}
//                     onChangeAmount={v => updateRow(setAdvances, row.localId, { amount: Number(v)||0 })}
//                     onRemove={() => removeRow(setAdvances, row.localId)} />
//                 ))}
//               </AnimatePresence>
//               <button onClick={() => setAdvances(p => [...p, newRow()])}
//                 className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors mt-1">
//                 <Plus size={11} /> Ajouter une avance manuellement
//               </button>
//             </div>
//           </Card>

//           {/* ════ SECTION RETENUES LIBRES ════ */}
//           <Card className="overflow-hidden">
//             <SectionHeader
//               icon={<span className="text-rose-600 dark:text-rose-400 text-xs font-black">−</span>}
//               title="Autres retenues"
//               subtitle="Retenues sans pré-enregistrement — déduites du net"
//               total={totalRetenues}
//               color="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800"
//             />
//             <div className="px-5 py-4 space-y-2">
//               <AnimatePresence initial={false}>
//                 {retenues.map(r => (
//                   <motion.div key={r.localId} initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-4 }}
//                     className="group flex items-center gap-2">
//                     <input type="text" value={r.label}
//                       onChange={e => setRetenues(prev => prev.map(x => x.localId === r.localId ? { ...x, label: e.target.value } : x))}
//                       placeholder="Ex : Remboursement, Trop-perçu, Cotisation…"
//                       className="flex-1 min-w-0 px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-400/30 placeholder:text-gray-300 dark:placeholder:text-gray-600" />
//                     <div className="relative w-32 shrink-0">
//                       <input type="number" value={r.amount || ''}
//                         onChange={e => setRetenues(prev => prev.map(x => x.localId === r.localId ? { ...x, amount: e.target.value === '' ? '' : Number(e.target.value) } : x))}
//                         placeholder="Montant"
//                         className="w-full pl-3 pr-5 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-right text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-400/30" />
//                       <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none">F</span>
//                     </div>
//                     <button onClick={() => setRetenues(prev => prev.filter(x => x.localId !== r.localId))}
//                       className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all shrink-0">
//                       <Trash2 size={13} />
//                     </button>
//                   </motion.div>
//                 ))}
//               </AnimatePresence>
//               <button onClick={() => setRetenues(prev => [...prev, { localId: uid(), label: '', amount: '' }])}
//                 className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-lg transition-colors mt-1">
//                 <Plus size={11} /> Ajouter une retenue
//               </button>
//             </div>
//           </Card>

//           {/* ════ SUGGESTIONS PARAFIFI ════ */}
//           {isParafifi && empDetail && (
//             <Card className="overflow-visible border-2 border-dashed border-indigo-200 dark:border-indigo-800">
//               <div className="px-5 py-4">
//                 <p className="text-[11px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider mb-3">
//                   🏢 Éléments spéciaux — Parafifi
//                 </p>
//                 <div className="flex flex-wrap gap-2">
//                   {/* Prime ancienneté */}
//                   <button onClick={addAnciennete}
//                     disabled={!empDetail.hireDate || getSeniorityYears(empDetail.hireDate) === 0 || primes.some(p => p.label === "Prime d'ancienneté")}
//                     className="flex flex-col items-start px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
//                     <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">Prime d'ancienneté</span>
//                     <span className="text-[10px] text-indigo-500 mt-0.5">
//                       {empDetail.hireDate
//                         ? `${getSeniorityYears(empDetail.hireDate)} ans → taux ${(getSeniorityRate(empDetail.hireDate) * 100).toFixed(0)}% → ${Math.round(Number(empDetail.baseSalary) * getSeniorityRate(empDetail.hireDate)).toLocaleString('fr-FR')} F`
//                         : 'Date embauche manquante'}
//                     </span>
//                   </button>
//                   {/* Gratification */}
//                   <button onClick={addGratification}
//                     disabled={primes.some(p => p.label === 'Gratification')}
//                     className="flex flex-col items-start px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
//                     <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">Gratification</span>
//                     <span className="text-[10px] text-indigo-500 mt-0.5">
//                       Salaire base ÷ 2 = {Math.round(Number(empDetail.baseSalary) / 2).toLocaleString('fr-FR')} F
//                     </span>
//                   </button>
//                   {/* Congés payés */}
//                   <button onClick={addCongesPaies}
//                     disabled={primes.some(p => p.label === 'Indemnité de congés payés')}
//                     className="flex flex-col items-start px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
//                     <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">Congés payés</span>
//                     <span className="text-[10px] text-indigo-500 mt-0.5">
//                       Salaire base ÷ 2 = {Math.round(Number(empDetail.baseSalary) / 2).toLocaleString('fr-FR')} F
//                     </span>
//                   </button>
//                 </div>
//                 <p className="text-[10px] text-indigo-400 mt-3">Ces éléments sont soumis à CNSS et ITS — ajoutés dans la section Primes.</p>
//               </div>
//             </Card>
//           )}

//           {/* ════ CUMULS ANNUELS + CONGÉS ════ */}
//           {selectedEmp && (
//             <Card className="p-5">
//               <div className="flex items-center justify-between mb-4">
//                 <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Cumuls annuels &amp; Congés</p>
//                 <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
//                   {(['auto','manuel'] as const).map(m => (
//                     <button key={m} onClick={() => setCumulMode(m)}
//                       className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${cumulMode===m?'bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-100 shadow-sm':'text-gray-400 hover:text-gray-600'}`}>
//                       {m === 'auto' ? 'Auto (YTD)' : 'Calculatrice'}
//                     </button>
//                   ))}
//                 </div>
//               </div>

//               {cumulMode === 'manuel' ? (
//                 <CumulCalculatrice
//                   onValidate={(vals) => {
//                     setCumulBrut(vals.brut);
//                     setCumulNetImp(vals.netImp);
//                     setCumulChargesSal(vals.chargesSal);
//                     setCumulChargesPat(vals.chargesPat);
//                     setCongesDroits(vals.droits);
//                     setCongesPris(vals.pris);
//                     setCongesSolde(vals.solde);
//                   }}
//                   values={{
//                     brut: cumulBrut, netImp: cumulNetImp,
//                     chargesSal: cumulChargesSal, chargesPat: cumulChargesPat,
//                     droits: congesDroits, pris: congesPris, solde: congesSolde,
//                   }}
//                 />
//               ) : (
//                 <p className="text-xs text-gray-400 text-center py-4">
//                   Les cumuls seront calculés automatiquement depuis les bulletins validés (Jan → mois actuel).
//                 </p>
//               )}
//             </Card>
//           )}

//           {!selectedEmp && (
//             <div className="flex items-center gap-3 px-4 py-3 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-xl">
//               <AlertCircle size={14} className="text-sky-500 shrink-0" />
//               <p className="text-sm text-sky-700 dark:text-sky-300">Sélectionnez un employé pour commencer la saisie.</p>
//             </div>
//           )}
//         </div>

//         {/* ════ COL DROITE — Aperçu bulletin ════ */}
//         <div className="lg:col-span-2 sticky top-6">
//           <AnimatePresence mode="wait">
//             {sim ? (
//               <motion.div key="sim" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
//                 className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">

//                 <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-slate-800 text-white px-5 py-4">
//                   <div className="flex items-start justify-between mb-2">
//                     <div>
//                       <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Aperçu bulletin</p>
//                       <p className="font-black text-lg mt-0.5">{sim.employee.firstName} {sim.employee.lastName}</p>
//                     </div>
//                     {simLoading && (
//                       <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full">
//                         <Loader2 size={10} className="animate-spin text-sky-400" />
//                         <span className="text-[10px] text-sky-300 font-semibold">Recalcul…</span>
//                       </div>
//                     )}
//                   </div>
//                   <div className="flex flex-wrap gap-1.5 text-[11px] text-gray-400">
//                     <span className="capitalize">{month} {year}</span>
//                     <span>·</span>
//                     <span>{sim.daysToPay}/{sim.workDays} jours</span>
//                     {sim.absenceDeduction > 0 && <><span>·</span><span className="text-orange-400">−{fmt(sim.absenceDeduction)} F abs.</span></>}
//                     {hasOt && <><span>·</span><span className="text-amber-400">HS</span></>}
//                   </div>
//                 </div>

//                 <div className="px-5 py-4 space-y-0.5">
//                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Gains</p>
//                   <BLine label="Salaire de base ajusté" value={`+${fmt(sim.adjustedBaseSalary)} F`} cls="text-gray-800 dark:text-gray-100" />
//                   {sim.overtime.amount10  > 0 && <BLine label={`HS +${sim.settings.overtimeRate10}% (${sim.overtime.hours10}h)`}   value={`+${fmt(sim.overtime.amount10)} F`}  cls="text-amber-500" sm />}
//                   {sim.overtime.amount25  > 0 && <BLine label={`HS +${sim.settings.overtimeRate25}% (${sim.overtime.hours25}h)`}   value={`+${fmt(sim.overtime.amount25)} F`}  cls="text-amber-500" sm />}
//                   {sim.overtime.amount50  > 0 && <BLine label={`HS +${sim.settings.overtimeRate50}% (${sim.overtime.hours50}h)`}   value={`+${fmt(sim.overtime.amount50)} F`}  cls="text-rose-500"  sm />}
//                   {sim.overtime.amount100 > 0 && <BLine label={`HS +${sim.settings.overtimeRate100}% (${sim.overtime.hours100}h)`} value={`+${fmt(sim.overtime.amount100)} F`} cls="text-red-500"   sm />}
//                   {sim.bonuses?.map((b, i) => <BLine key={i} label={b.bonusType} value={`+${fmt(b.amount)} F`} cls="text-emerald-600 dark:text-emerald-400" sm />)}

//                   <div className="flex justify-between items-center py-2 bg-emerald-50 dark:bg-emerald-900/20 px-3 rounded-xl mt-2">
//                     <span className="text-sm font-bold text-emerald-800 dark:text-emerald-200">Salaire brut</span>
//                     <span className="font-mono font-black text-emerald-700 dark:text-emerald-300">{fmt(sim.grossSalary)} F</span>
//                   </div>

//                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pt-3 mb-2">Retenues légales</p>
//                   <BLine label={`CNSS (${sim.settings.cnssSalarialRate}%)`}
//                     value={sim.employee.isSubjectToCnss ? `−${fmt(sim.cnssSalarial)} F` : '0 F (exempté)'}
//                     cls={sim.employee.isSubjectToCnss ? 'text-red-500' : 'text-gray-400'} />
//                   <BLine label="ITS / IRPP"
//                     value={sim.employee.isSubjectToIrpp ? `−${fmt(sim.its)} F` : '0 F (exempté)'}
//                     cls={sim.employee.isSubjectToIrpp ? 'text-red-500' : 'text-gray-400'} />
//                   {sim.totalLoanDeduction    > 0 && <BLine label="Prêts"   value={`−${fmt(sim.totalLoanDeduction)} F`}    cls="text-red-500" sm />}
//                   {sim.totalAdvanceDeduction > 0 && <BLine label="Avances" value={`−${fmt(sim.totalAdvanceDeduction)} F`} cls="text-red-500" sm />}
//                   {(sim as any).manualDeductionTotal > 0 && <BLine label="Autres retenues" value={`−${fmt((sim as any).manualDeductionTotal)} F`} cls="text-red-500" sm />}

//                   <div className="mt-4 pt-4 border-t-2 border-dashed border-gray-200 dark:border-gray-700">
//                     <div className="flex justify-between items-end">
//                       <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Net à payer</span>
//                       <div className="text-right leading-none">
//                         <span className="text-[26px] font-black text-gray-900 dark:text-white font-mono tracking-tight">{fmt(sim.netSalary)}</span>
//                         <span className="text-sm text-gray-400 ml-1">FCFA</span>
//                       </div>
//                     </div>
//                   </div>

//                   <div className="mt-3 border border-orange-200 dark:border-orange-800/40 rounded-xl overflow-hidden">
//                     <button onClick={() => setShowEmpCost(v => !v)}
//                       className="w-full flex items-center justify-between px-4 py-2.5 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100/50 transition-colors">
//                       <span className="flex items-center gap-1.5 text-xs font-bold text-orange-700 dark:text-orange-400">
//                         <Building2 size={12} /> Coût employeur
//                       </span>
//                       <div className="flex items-center gap-2">
//                         <span className="font-mono font-black text-sm text-orange-600 dark:text-orange-400">+{fmt(sim.totalEmployerCost)} F</span>
//                         {showEmpCost ? <ChevronUp size={12} className="text-orange-400"/> : <ChevronDown size={12} className="text-orange-400"/>}
//                       </div>
//                     </button>
//                     <AnimatePresence>
//                       {showEmpCost && (
//                         <motion.div initial={{ height:0 }} animate={{ height:'auto' }} exit={{ height:0 }} className="overflow-hidden">
//                           <div className="px-4 py-3 bg-white dark:bg-gray-800/50 space-y-0.5">
//                             <BLine label="CNSS Pensions (8%)"    value={`+${fmt(sim.cnssEmployerPension)} F`}  cls="text-orange-500" sm />
//                             <BLine label="CNSS Famille (10,03%)" value={`+${fmt(sim.cnssEmployerFamily)} F`}   cls="text-orange-500" sm />
//                             <BLine label="CNSS Accident (2,25%)" value={`+${fmt(sim.cnssEmployerAccident)} F`} cls="text-orange-500" sm />
//                             <BLine label="TUS DGI (2,025%)"      value={`+${fmt(sim.tusDgiAmount)} F`}         cls="text-amber-500"  sm />
//                             <BLine label="TUS CNSS (5,475%)"     value={`+${fmt(sim.tusCnssAmount)} F`}        cls="text-amber-500"  sm />
//                           </div>
//                         </motion.div>
//                       )}
//                     </AnimatePresence>
//                   </div>
//                 </div>

//                 <div className="px-5 pb-5">
//                   <button onClick={submit} disabled={submitting || simLoading}
//                     className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-600 hover:to-emerald-600 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 text-sm">
//                     {submitting ? <><Loader2 size={15} className="animate-spin"/>Enregistrement…</> : <><CheckCircle2 size={15}/>Confirmer & créer le bulletin</>}
//                   </button>
//                 </div>
//               </motion.div>
//             ) : (
//               <motion.div key="empty" initial={{ opacity:0 }} animate={{ opacity:1 }}
//                 className="bg-gray-50 dark:bg-gray-800/50 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl min-h-[260px] flex flex-col items-center justify-center text-center p-8">
//                 {simLoading
//                   ? <><Loader2 size={32} className="animate-spin mb-3 text-sky-500"/><p className="text-sm font-medium text-gray-600 dark:text-gray-300">Calcul en cours…</p></>
//                   : simError
//                   ? <><AlertCircle size={32} className="mb-3 text-red-400"/><p className="text-sm font-medium text-red-500 max-w-[200px]">{simError}</p></>
//                   : <><Calculator size={36} className="mb-3 text-gray-300 dark:text-gray-600"/><p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{!selectedEmp?'Sélectionnez un employé':!empDetail?'Chargement…':'Le bulletin se calcule automatiquement'}</p><p className="text-xs text-gray-400 mt-1">Mis à jour en temps réel</p></>
//                 }
//               </motion.div>
//             )}
//           </AnimatePresence>
//         </div>
//       </div>

//       {/* Modal succès */}
//       <AnimatePresence>
//         {success && (
//           <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" initial={{ opacity:0 }} animate={{ opacity:1 }}>
//             <motion.div initial={{ opacity:0, scale:0.9, y:20 }} animate={{ opacity:1, scale:1, y:0 }} transition={{ type:'spring', stiffness:300, damping:26 }}
//               className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
//               <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-5">
//                 <CheckCircle2 size={34} className="text-emerald-500" />
//               </div>
//               <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Bulletin créé !</h2>
//               <p className="text-gray-400 text-sm mb-7">La fiche de paie a été enregistrée avec succès.</p>
//               <div className="flex gap-3">
//                 <button onClick={resetPage} className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm">Nouveau</button>
//                 {createdId && <button onClick={() => router.push(`/paie/${createdId}`)} className="flex-1 py-3 bg-sky-500 text-white font-bold rounded-xl hover:bg-sky-600 transition-colors text-sm">Voir bulletin</button>}
//                 <button onClick={() => router.push('/paie')} className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors text-sm">Liste paie</button>
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }



'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Plus, Trash2, Loader2, CheckCircle2,
  Search, X, Calculator, AlertCircle, ChevronDown,
  ChevronUp, Building2, Check, CreditCard, Wallet,
  Calendar, Briefcase, Users, BadgeCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  baseSalary?: number;
  position?: string;
  employeeNumber?: string;
  contractType?: string;
  hireDate?: string;
  maritalStatus?: string;
  numberOfChildren?: number;
  department?: { name: string };
  isSubjectToCnss?: boolean;
  isSubjectToIrpp?: boolean;
  tolZone?: string;
}

interface CompanyInfo {
  email?: string;
}

interface BonusTemplate {
  id: string;
  name: string;
  defaultAmount: number | null;
  bonusCategory: string;
  isTaxable: boolean;
  isCnss: boolean;
  isActive: boolean;
}

interface CompanyTax {
  id: string;
  name: string;
  code: string;
  employeeRate: number;
  fixedEmployee: number;
  isActive: boolean;
}

interface Loan {
  id: string;
  monthlyRepayment: number;
  remainingBalance: number;
  status: string;
  reason?: string;
  employeeId?: string;
  employee?: { id?: string };
}

interface Advance {
  id: string;
  amount: number;
  status: string;
  deducted: boolean;
  reason?: string;
  employeeId?: string;
  employee?: { id?: string };
}

interface Row {
  localId: string;
  refId?: string;
  label: string;
  base: number | '';
  rate: number | '';
  amount: number;
}

interface ManualDeduction {
  localId: string;
  label: string;
  amount: number | '';
}

interface SimResult {
  employee: { id: string; firstName: string; lastName: string; baseSalary: number; effectiveBaseSalary: number; isSubjectToCnss: boolean; isSubjectToIrpp: boolean };
  month: number; year: number; daysToPay: number; workDays: number;
  absenceDeduction: number;
  overtime: { hours10: number; amount10: number; hours25: number; amount25: number; hours50: number; amount50: number; hours100: number; amount100: number; total: number };
  bonuses: Array<{ bonusType: string; amount: number }>;
  adjustedBaseSalary: number; grossSalary: number;
  cnssSalarial: number; its: number; totalDeductions: number; netSalary: number;
  cnssEmployerPension: number; cnssEmployerFamily: number; cnssEmployerAccident: number;
  tusDgiAmount: number; tusCnssAmount: number; totalEmployerCost: number;
  loans: any[]; advances: any[];
  totalLoanDeduction: number; totalAdvanceDeduction: number;
  settings: { cnssSalarialRate: number; overtimeRate10: number; overtimeRate25: number; overtimeRate50: number; overtimeRate100: number };
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const PRIME_SUGGESTIONS = [
  "Prime d'ancienneté","Prime d'assiduité","Prime de confiance",
  "Prime de garde","Prime de motivation","Prime de précaire",
  "Prime de responsabilité","Prime de risque","Prime de base congé",
  "Prime de diplôme","Prime de technicité","Prime de rendement",
  "Prime de résultat","Prime de fin d'année",
];

const INDEMNITE_SUGGESTIONS = [
  "Indemnité de transport","Indemnité de logement","Indemnité de panier",
  "Indemnité kilométrique","Indemnité de représentation","Indemnité vestimentaire",
  "Indemnité de déplacement","Indemnité de téléphone",
];

const MARITAL_LABELS: Record<string, string> = {
  SINGLE: 'Célibataire', MARRIED: 'Marié(e)',
  DIVORCED: 'Divorcé(e)', WIDOWED: 'Veuf/Veuve',
};

const uid  = () => Math.random().toString(36).slice(2, 9);
const fmt  = (v: number) => Math.round(v || 0).toLocaleString('fr-FR');
const n    = (v: number | '') => Number(v) || 0;

const seniority = (hireDate?: string) => {
  if (!hireDate) return null;
  const hire = new Date(hireDate);
  const now  = new Date();
  const years  = now.getFullYear() - hire.getFullYear();
  const months = now.getMonth() - hire.getMonth();
  const total  = years + (months < 0 ? -1 : 0);
  if (total < 1) {
    const m = ((years * 12) + months + 12) % 12;
    return `${m} mois`;
  }
  return `${total} an${total > 1 ? 's' : ''}`;
};

// ─── Micro-composants ────────────────────────────────────────────────────────

const SLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">{children}</label>
);

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 ${className}`}>
    {children}
  </div>
);

const SectionHeader = ({ icon, title, subtitle, total, color }: {
  icon: React.ReactNode; title: string; subtitle: string; total?: number; color: string;
}) => (
  <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-700/50">
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{title}</p>
      <p className="text-[11px] text-gray-400 dark:text-gray-500">{subtitle}</p>
    </div>
    {total != null && total > 0 && (
      <span className="text-sm font-mono font-bold text-gray-600 dark:text-gray-300 shrink-0">
        {fmt(total)} F
      </span>
    )}
  </div>
);

const BLine = ({ label, value, cls, sm }: { label: string; value: string; cls?: string; sm?: boolean }) => (
  <div className={`flex items-center justify-between ${sm ? 'py-0.5' : 'py-1.5'}`}>
    <span className={`${sm ? 'text-xs' : 'text-sm'} text-gray-500 dark:text-gray-400`}>{label}</span>
    <span className={`font-mono font-bold tabular-nums ${sm ? 'text-xs' : 'text-sm'} ${cls ?? 'text-gray-700 dark:text-gray-200'}`}>{value}</span>
  </div>
);

const SimpleRow = ({ row, onChangeLabel, onChangeAmount, onRemove, placeholder = 'Libellé…', amountPlaceholder = '0' }: {
  row: Row; onChangeLabel: (v:string)=>void; onChangeAmount: (v:number|'')=>void; onRemove: ()=>void; placeholder?: string; amountPlaceholder?: string;
}) => (
  <motion.div initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-4 }} className="group flex items-center gap-2">
    <input type="text" value={row.label} onChange={e => onChangeLabel(e.target.value)} placeholder={placeholder}
      className="flex-1 min-w-0 px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-400/30 placeholder:text-gray-300 dark:placeholder:text-gray-600" />
    <div className="relative w-32 shrink-0">
      <input type="number" value={row.amount || ''} onChange={e => onChangeAmount(e.target.value===''?'':Number(e.target.value))} placeholder={amountPlaceholder}
        className="w-full pl-3 pr-5 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-right text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-400/30" />
      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none">F</span>
    </div>
    <button onClick={onRemove} className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all shrink-0"><Trash2 size={13} /></button>
  </motion.div>
);

const InputRow = ({
  row, onChangeLabel, onChangeBase, onChangeRate, onRemove, placeholder = 'Libellé…',
}: {
  row: Row;
  onChangeLabel: (v: string) => void;
  onChangeBase: (v: number | '') => void;
  onChangeRate: (v: number | '') => void;
  onRemove: () => void;
  placeholder?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
    className="group grid grid-cols-[1fr_100px_70px_90px_28px] gap-2 items-center"
  >
    <input
      type="text"
      value={row.label}
      onChange={e => onChangeLabel(e.target.value)}
      placeholder={placeholder}
      className="px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-400/30 placeholder:text-gray-300 dark:placeholder:text-gray-600 w-full"
    />
    <div className="relative">
      <input
        type="number"
        value={row.base}
        onChange={e => onChangeBase(e.target.value === '' ? '' : Number(e.target.value))}
        placeholder="Base"
        className="w-full pl-2 pr-5 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono text-right text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
      />
      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-gray-400 pointer-events-none">F</span>
    </div>
    <input
      type="number"
      value={row.rate}
      step="0.01"
      onChange={e => onChangeRate(e.target.value === '' ? '' : Number(e.target.value))}
      placeholder="Taux"
      className="w-full px-2 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono text-center text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
    />
    <div className={`px-2 py-2 rounded-xl text-sm font-black font-mono text-right tabular-nums border transition-colors ${
      row.amount > 0
        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
        : 'bg-gray-50 dark:bg-gray-900/30 border-gray-100 dark:border-gray-700/50 text-gray-300 dark:text-gray-600'
    }`}>
      {row.amount > 0 ? row.amount.toLocaleString('fr-FR') : '—'}
    </div>
    <button
      onClick={onRemove}
      className="p-1.5 text-gray-300 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
    >
      <Trash2 size={13} />
    </button>
  </motion.div>
);


// ─── Composant Calculatrice Cumuls ───────────────────────────────────────────
// L'user tape "135040 + 128000 + 142000" → Enter ou "=" → résultat stocké

interface CumulVals {
  brut: number|''; netImp: number|''; chargesSal: number|''; chargesPat: number|'';
  droits: number|''; pris: number|''; solde: number|'';
}

function evalExpr(expr: string): number {
  // ✅ Évalue une expression arithmétique complète
  // Supporte : + - * / () espaces et nombres décimaux
  // ex: "135040 + 128000 * 2 - (5000 / 2)" → résultat correct
  try {
    // Sanitiser : garder uniquement les caractères mathématiques valides
    const sanitized = expr
      .replace(/\s/g, '')           // supprimer espaces
      .replace(/[^0-9+\-*/().]/g, '') // garder uniquement chiffres + opérateurs + parenthèses
      .trim();
    if (!sanitized) return 0;
    // Évaluation sécurisée — uniquement des opérations mathématiques
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${sanitized})`)();
    if (typeof result !== 'number' || !isFinite(result)) return 0;
    return Math.round(result);
  } catch { return 0; }
}

const CALC_FIELDS: { key: keyof CumulVals; label: string; color: string }[] = [
  { key:'brut',        label:'Brut annuel',   color:'text-emerald-600 dark:text-emerald-400' },
  { key:'netImp',      label:'Net imposable', color:'text-sky-600 dark:text-sky-400' },
  { key:'chargesSal',  label:'Charges sal.',  color:'text-rose-600 dark:text-rose-400' },
  { key:'chargesPat',  label:'Charges pat.',  color:'text-orange-600 dark:text-orange-400' },
];

const CONGE_FIELDS: { key: keyof CumulVals; label: string }[] = [
  { key:'droits', label:'Droits' },
  { key:'pris',   label:'Pris' },
  { key:'solde',  label:'Solde' },
];

function CumulCalculatrice({ onValidate, values }: {
  onValidate: (v: CumulVals) => void;
  values: CumulVals;
}) {
  const [exprs, setExprs] = React.useState<Record<string, string>>({
    brut:'', netImp:'', chargesSal:'', chargesPat:'', droits:'', pris:'', solde:'',
  });
  const [results, setResults] = React.useState<Record<string, number>>({});

  const compute = (key: string, expr: string) => {
    const val = evalExpr(expr);
    const newResults = { ...results, [key]: val };
    setResults(newResults);
    // Notifier le parent avec toutes les valeurs
    const merged: any = { ...values };
    Object.entries(newResults).forEach(([k, v]) => { merged[k] = v || ''; });
    onValidate(merged);
  };

  const handleKey = (key: string, expr: string, e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === '=') {
      e.preventDefault();
      compute(key, expr);
    }
  };

  const handleBlur = (key: string, expr: string) => {
    if (expr.trim()) compute(key, expr);
  };

  const renderField = (fieldKey: string, label: string, colorCls = '') => {
    const expr   = exprs[fieldKey] ?? '';
    const result = results[fieldKey];
    const stored = (values as any)[fieldKey];
    const display = result != null ? result : (stored ? Number(stored) : null);

    return (
      <div key={fieldKey}>
        <p className={`text-[10px] font-bold mb-1 ${colorCls || 'text-gray-400'}`}>{label}</p>
        <div className="relative">
          <input
            type="text"
            value={expr}
            onChange={e => setExprs(prev => ({ ...prev, [fieldKey]: e.target.value }))}
            onKeyDown={e => handleKey(fieldKey, expr, e)}
            onBlur={() => handleBlur(fieldKey, expr)}
            placeholder="ex: 135040 + 128000 + 142000"
            className="w-full pl-3 pr-2 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-mono text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-400/30 placeholder:text-gray-300 dark:placeholder:text-gray-600"
          />
        </div>
        {display != null && display > 0 && (
          <p className="text-right text-xs font-black font-mono text-sky-600 dark:text-sky-400 mt-0.5">
            = {Math.round(display).toLocaleString('fr-FR')} F
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <p className="text-[10px] text-gray-400">
        Tapez les montants séparés par <strong>+</strong> puis appuyez sur <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[9px]">Entrée</kbd> ou <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[9px]">=</kbd>
      </p>

      {/* Cumuls principaux */}
      <div className="grid grid-cols-2 gap-3">
        {CALC_FIELDS.map(({ key, label, color }) => renderField(key, label, color))}
      </div>

      {/* Congés */}
      <div className="pt-2 border-t border-gray-100 dark:border-gray-700/50">
        <p className="text-[10px] font-bold text-gray-400 mb-2">Congés annuels (jours)</p>
        <div className="grid grid-cols-3 gap-2">
          {CONGE_FIELDS.map(({ key, label }) => renderField(key, label))}
        </div>
      </div>
    </div>
  );
}

// ─── Page principale ─────────────────────────────────────────────────────────

export default function ManuelPayrollPage() {
  const router = useRouter();
  const now    = new Date();

  const [employees, setEmployees]       = useState<Employee[]>([]);
  const [empSearch, setEmpSearch]       = useState('');
  const [showDrop, setShowDrop]         = useState(false);
  const [selectedEmp, setSelectedEmp]   = useState<Employee | null>(null);
  const [empDetail, setEmpDetail]       = useState<Employee | null>(null);
  const [loadingEmp, setLoadingEmp]     = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [month, setMonth]               = useState(MONTHS[now.getMonth()]);
  const [year, setYear]                 = useState(now.getFullYear());
  const [workedDays, setWorkedDays]     = useState<number | ''>(26);
  const [ot10, setOt10]   = useState<number | ''>(0);
  const [ot25, setOt25]   = useState<number | ''>(0);
  const [ot50, setOt50]   = useState<number | ''>(0);
  const [ot100, setOt100] = useState<number | ''>(0);

  const [bonusTemplates, setBonusTemplates] = useState<BonusTemplate[]>([]);
  const [companyTaxes, setCompanyTaxes]     = useState<CompanyTax[]>([]);
  const [empLoans, setEmpLoans]             = useState<Loan[]>([]);
  const [empAdvances, setEmpAdvances]       = useState<Advance[]>([]);
  const [companyInfo, setCompanyInfo]       = useState<CompanyInfo>({});

  const [primes, setPrimes]           = useState<Row[]>([]);
  const [indemnites, setIndemnites]   = useState<Row[]>([]);
  const [taxes, setTaxes]             = useState<Row[]>([]);
  const [loans, setLoans]             = useState<Row[]>([]);
  const [advances, setAdvances]       = useState<Row[]>([]);
  const [retenues, setRetenues]       = useState<ManualDeduction[]>([]);  // ✅ retenues libres

  // ── Cumuls annuels — mode auto (ytd BDD) ou manuel (saisie) ─────────────
  const [cumulMode, setCumulMode]             = useState<'auto'|'manuel'>('manuel');
  const [cumulBrut, setCumulBrut]             = useState<number|''>('');
  const [cumulNetImp, setCumulNetImp]         = useState<number|''>('');
  const [cumulChargesSal, setCumulChargesSal] = useState<number|''>('');
  const [cumulChargesPat, setCumulChargesPat] = useState<number|''>('');
  const [congesDroits, setCongesDroits]       = useState<number|''>('');
  const [congesPris, setCongesPris]           = useState<number|''>('');
  const [congesSolde, setCongesSolde]         = useState<number|''>('');

  const [showPrimeSugg, setShowPrimeSugg]     = useState(false);
  const [showIndemSugg, setShowIndemSugg]     = useState(false);
  const [showTaxSugg, setShowTaxSugg]         = useState(false);
  const [primeSuggSearch, setPrimeSuggSearch] = useState('');
  const [indemSuggSearch, setIndemSuggSearch] = useState('');

  const [sim, setSim]               = useState<SimResult | null>(null);
  const [simLoading, setSimLoading] = useState(false);
  const [simError, setSimError]     = useState<string | null>(null);
  const [showEmpCost, setShowEmpCost] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]       = useState(false);
  const [createdId, setCreatedId]   = useState<string | null>(null);

  useEffect(() => {
    api.get<any>('/employees/simple')
      .then(r => setEmployees(Array.isArray(r) ? r : (r?.data ?? [])))
      .catch(() => setEmployees([]))
      .finally(() => setLoadingEmp(false));
  }, []);

  useEffect(() => {
    Promise.all([
      api.get<any>('/bonus-templates').catch(() => []),
      api.get<any>('/company-taxes').catch(() => []),
      api.get<any>('/company/info').catch(() => ({})),
    ]).then(([bt, ct, ci]) => {
      setBonusTemplates((Array.isArray(bt) ? bt : []).filter((t: BonusTemplate) => t.isActive));
      setCompanyTaxes((Array.isArray(ct) ? ct : []).filter((t: CompanyTax) => t.isActive));
      setCompanyInfo(ci ?? {});
    });
  }, []);

  // ✅ Vérifier si c'est l'entreprise parafifi — logique ancienneté/gratif/congés spéciale
  const isParafifi = companyInfo?.email === 'admin@parafifi.cg';

  useEffect(() => {
    if (!selectedEmp) {
      setEmpDetail(null); setEmpLoans([]); setEmpAdvances([]);
      setLoans([]); setAdvances([]);
      return;
    }
    setLoadingDetail(true);
    Promise.all([
      api.get<any>(`/employees/${selectedEmp.id}`).catch(() => null),
      api.get<any>('/loans').catch(() => []),
      api.get<any>('/loans/advances').catch(() => []),
    ]).then(([detail, allLoans, allAdvances]) => {
      setEmpDetail(detail);
      const empId = selectedEmp.id;
      const activeLoans = (Array.isArray(allLoans) ? allLoans : [])
        .filter((l: Loan) => (l.employeeId === empId || l.employee?.id === empId) && l.status === 'ACTIVE');
      const pendingAdv  = (Array.isArray(allAdvances) ? allAdvances : [])
        .filter((a: Advance) => (a.employeeId === empId || a.employee?.id === empId) && a.status === 'APPROVED' && !a.deducted);
      setEmpLoans(activeLoans);
      setEmpAdvances(pendingAdv);
    }).finally(() => setLoadingDetail(false));
  }, [selectedEmp]);

  const filtered = empSearch.length >= 1
    ? employees.filter(e =>
        `${e.firstName} ${e.lastName} ${e.employeeNumber ?? ''}`.toLowerCase()
          .includes(empSearch.toLowerCase())
      ).slice(0, 8)
    : [];

  const newRow = (label = ''): Row => ({ localId: uid(), label, base: '', rate: 1, amount: 0 });

  const updateRow = (set: React.Dispatch<React.SetStateAction<Row[]>>, localId: string, patch: Partial<Row>) =>
    set(prev => prev.map(r => {
      if (r.localId !== localId) return r;
      const next = { ...r, ...patch };
      next.amount = Math.round((Number(next.base) || 0) * (Number(next.rate) || 0));
      return next;
    }));

  const removeRow = (set: React.Dispatch<React.SetStateAction<Row[]>>, localId: string) =>
    set(prev => prev.filter(r => r.localId !== localId));

  const addSuggestion = (
    set: React.Dispatch<React.SetStateAction<Row[]>>,
    rows: Row[],
    label: string,
    defaultAmount = 0
  ) => {
    if (rows.some(r => r.label === label)) return;
    set(prev => [...prev, { ...newRow(label), base: defaultAmount || '', rate: defaultAmount ? 1 : '', amount: defaultAmount || 0 }]);
  };

  const addTaxFromTemplate = (tax: CompanyTax) => {
    if (taxes.some(t => t.refId === tax.id)) return;
    const grossEst = n(empDetail?.baseSalary as any) + primes.reduce((s,r) => s + n(r.amount), 0);
    const fixed = Number(tax.fixedEmployee);
    const rate  = Number(tax.employeeRate);
    const amt   = fixed > 0 ? fixed : Math.round(grossEst * rate);
    const id    = tax.id;
    const name  = tax.name;
    setTaxes(prev => [...prev, { localId: uid(), refId: id, label: name, base: '', rate: 1, amount: amt }]);
  };

  // ── Détection auto prime par label — universel ──────────────────────────────
  const applyAutoIfNeeded = (localId: string, label: string) => {
    if (!empDetail?.baseSalary) return;
    const l    = label.toLowerCase().trim();
    const base = Number(empDetail.baseSalary);
    if (/anc[iè]/i.test(l)) {
      const years = getSeniorityYears(empDetail.hireDate);
      if (years > 0) {
        const rate = years / 100;
        setPrimes(prev => prev.map(r => r.localId === localId ? { ...r, base, rate, amount: Math.round(base * rate) } : r));
      }
      return;
    }
    if (/gratif/i.test(l)) {
      setPrimes(prev => prev.map(r => r.localId === localId ? { ...r, base, rate: 0.5, amount: Math.round(base / 2) } : r));
      return;
    }
    if (/cong[eé]/i.test(l)) {
      const brutMois  = base + primes.filter(p => p.localId !== localId).reduce((s, p) => s + p.amount, 0);
      const baseConge = Math.round((base / 2 + brutMois * 12) / 12);
      setPrimes(prev => prev.map(r => r.localId === localId ? { ...r, base: baseConge, rate: 1, amount: baseConge } : r));
      return;
    }
  };

  // ── ✅ Helper payload — base toujours renseignée, rate seulement si significatif ──
  // ── Calculs spéciaux Parafifi ──────────────────────────────────────────────

  // Ancienneté en années complètes (ex: 5 ans → 0.05, 29 ans → 0.29)
  const getSeniorityRate = (hireDate?: string): number => {
    if (!hireDate) return 0;
    const hire = new Date(hireDate);
    const now  = new Date();
    let years  = now.getFullYear() - hire.getFullYear();
    const m    = now.getMonth() - hire.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < hire.getDate())) years--;
    return Math.max(0, years) / 100; // 5 ans → 0.05
  };

  const getSeniorityYears = (hireDate?: string): number => {
    if (!hireDate) return 0;
    const hire = new Date(hireDate);
    const now  = new Date();
    let years  = now.getFullYear() - hire.getFullYear();
    const m    = now.getMonth() - hire.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < hire.getDate())) years--;
    return Math.max(0, years);
  };

  // Ajouter prime d'ancienneté auto (Parafifi) : base = salaire de base, rate = années/100
  const addAnciennete = () => {
    if (!empDetail?.baseSalary || !empDetail?.hireDate) return;
    const base  = Number(empDetail.baseSalary);
    const years = getSeniorityYears(empDetail.hireDate);
    if (years === 0) return;
    const rate   = years / 100;  // 5 ans → 0.05 → affiché "0,05"
    const amount = Math.round(base * rate);
    const label  = "Prime d'ancienneté";
    if (primes.some(p => p.label === label)) return;
    setPrimes(prev => [...prev, { localId: uid(), label, base, rate, amount }]);
  };

  // Gratification = salaire de base / 2 (base brute, pas ajustée)
  const addGratification = () => {
    if (!empDetail?.baseSalary) return;
    const base   = Number(empDetail.baseSalary);
    const amount = Math.round(base / 2);
    const label  = 'Gratification';
    if (primes.some(p => p.label === label)) return;
    setPrimes(prev => [...prev, { localId: uid(), label, base, rate: 0.5, amount }]);
  };

  // Congés payés (Parafifi) :
  // Gratification = baseSalary / 2
  // Brut annuel   = brut mois en cours × 12
  // Base congé    = (gratification + brut annuel) / 12
  const addCongesPaies = () => {
    if (!empDetail?.baseSalary) return;
    const baseSal      = Number(empDetail.baseSalary);
    const gratif       = baseSal / 2;
    // brut mois = baseSalary + toutes les primes déjà saisies
    const brutMois     = baseSal + primes.reduce((s, p) => s + p.amount, 0);
    const brutAnnuel   = brutMois * 12;
    const baseConge    = Math.round((gratif + brutAnnuel) / 12);
    const label        = 'Congés payés';
    if (primes.some(p => p.label === label)) return;
    // rate=1 car base = montant direct (pas de multiplicateur)
    setPrimes(prev => [...prev, { localId: uid(), label, base: baseConge, rate: 1, amount: baseConge }]);
  };

  const buildBonusPayload = (rows: Row[], taxable: boolean) =>
    rows.filter(r => n(r.amount) > 0).map(r => ({
      bonusType:  r.label || (taxable ? 'Prime' : 'Indemnité'),
      amount:     r.amount,
      // ✅ Si base non saisie → base = amount (gain direct sans calcul)
      base:       n(r.base) > 0 ? n(r.base) : r.amount,
      // ✅ Rate seulement si saisi et différent de 0 et 1
      // Si pas de taux ou taux=1 → gain=base, on n'envoie pas rate
      // Les HS ont leur propre logique dans payroll-items_service, pas touchées ici
      rate:       n(r.rate) > 0 && n(r.rate) !== 1 ? n(r.rate) : undefined,
      isTaxable:  taxable,
      isCnss:     taxable,
      fiscalType: taxable ? 'TAXABLE_CNSS' : 'NON_TAXABLE',
    }));

  useEffect(() => {
    if (!selectedEmp || !empDetail) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(runSim, 700);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primes, indemnites, selectedEmp, empDetail, month, year, workedDays, ot10, ot25, ot50, ot100]);

  const runSim = async () => {
    if (!selectedEmp || !empDetail) return;
    const baseSal = n(empDetail.baseSalary as any);
    if (!baseSal) return;

    const primesPayload = buildBonusPayload(primes, true);
    const indemPayload  = buildBonusPayload(indemnites, false);
    const manualBonuses = [...primesPayload, ...indemPayload];
    const manualDeductionsPayload = retenues.filter(r => n(r.amount) > 0)
      .map(r => ({ label: r.label || 'Retenue', amount: n(r.amount) }));

    setSimLoading(true); setSimError(null);
    try {
      const result = await api.post<SimResult>('/payrolls/simulate', {
        employeeId: selectedEmp.id,
        month: MONTHS.findIndex(m => m === month) + 1,
        year, workedDays: n(workedDays) || 26,
        baseSalary: baseSal,
        overtimeHours10:  n(ot10),
        overtimeHours25:  n(ot25),
        overtimeHours50:  n(ot50),
        overtimeHours100: n(ot100),
        manualBonuses:     manualBonuses.length > 0 ? manualBonuses : undefined,
        manualDeductions:  manualDeductionsPayload.length > 0 ? manualDeductionsPayload : undefined,
      });
      setSim(result);
    } catch (e: any) {
      setSimError(e?.response?.data?.message || e?.message || 'Erreur');
      setSim(null);
    } finally {
      setSimLoading(false);
    }
  };

  const submit = async () => {
    if (!selectedEmp || !sim || !empDetail) return;
    setSubmitting(true);
    try {
      // ✅ Même helper — cohérence simulate / create
      const primesP = buildBonusPayload(primes, true);
      const indemP  = buildBonusPayload(indemnites, false);

      const manualDedP = retenues.filter(r => n(r.amount) > 0)
        .map(r => ({ label: r.label || 'Retenue', amount: n(r.amount) }));
      const result: any = await api.post('/payrolls/manual', {
        employeeId: selectedEmp.id,
        month: MONTHS.findIndex(m => m === month) + 1,
        year, workedDays: n(workedDays) || 26,
        baseSalary: n(empDetail.baseSalary as any),
        overtimeHours10:  n(ot10), overtimeHours25: n(ot25),
        overtimeHours50:  n(ot50), overtimeHours100: n(ot100),
        manualBonuses:    [...primesP, ...indemP],
        cumulBrut:        cumulMode === 'manuel' ? (n(cumulBrut) || undefined)       : undefined,
        cumulNetImp:      cumulMode === 'manuel' ? (n(cumulNetImp) || undefined)     : undefined,
        cumulChargesSal:  cumulMode === 'manuel' ? (n(cumulChargesSal) || undefined) : undefined,
        cumulChargesPat:  cumulMode === 'manuel' ? (n(cumulChargesPat) || undefined) : undefined,
        congesDroits:     n(congesDroits) || undefined,
        congesPris:       n(congesPris)   || undefined,
        congesSolde:      n(congesSolde)  || undefined,
        manualDeductions: manualDedP.length > 0 ? manualDedP : undefined,
      });
      setCreatedId(result?.id || null);
      setSuccess(true);
    } catch (e: any) {
      alert(`Erreur : ${e?.response?.data?.message || e?.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const resetPage = () => {
    setSuccess(false); setSim(null); setSelectedEmp(null); setEmpSearch('');
    setEmpDetail(null); setEmpLoans([]); setEmpAdvances([]);
    setWorkedDays(26); setOt10(0); setOt25(0); setOt50(0); setOt100(0);
    setPrimes([]); setIndemnites([]); setTaxes([]); setLoans([]); setAdvances([]); setRetenues([]);
    setCumulBrut(''); setCumulNetImp(''); setCumulChargesSal(''); setCumulChargesPat('');
    setCongesDroits(''); setCongesPris(''); setCongesSolde(''); setCumulMode('manuel');
  };

  const hasOt = [ot10,ot25,ot50,ot100].some(v => n(v) > 0);
  const totalPrimes     = primes.reduce((s,r) => s + r.amount, 0);
  const totalIndemnites = indemnites.reduce((s,r) => s + r.amount, 0);
  const totalTaxes      = taxes.reduce((s,r) => s+n(r.amount), 0);
  const totalLoans      = loans.reduce((s,r) => s+n(r.amount), 0);
  const totalAdvances   = advances.reduce((s,r) => s+n(r.amount), 0);
  const totalRetenues   = retenues.reduce((s,r) => s+n(r.amount), 0);

  const dbPrimeSugg = bonusTemplates.filter(t => t.isTaxable);
  const dbIndemSugg = bonusTemplates.filter(t => !t.isTaxable);

  return (
    <div className="max-w-[1380px] mx-auto pb-28 px-4 pt-1">

      {/* ── Header ── */}
      <div className="flex items-center gap-4 mb-7">
        <button onClick={() => router.back()}
          className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shrink-0">
          <ArrowLeft size={18} className="text-gray-500" />
        </button>
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Saisie manuelle de paie</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 uppercase tracking-wide">Manuel</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">CNSS, ITS et TUS calculés automatiquement selon la nature de chaque élément</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6 items-start">

        {/* ════ COL GAUCHE ════ */}
        <div className="lg:col-span-3 space-y-4">

          {/* ── Période ── */}
          <Card className="p-5">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4">Période</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <SLabel>Mois</SLabel>
                <select value={month} onChange={e => setMonth(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30">
                  {MONTHS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <SLabel>Année</SLabel>
                <select value={year} onChange={e => setYear(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30">
                  {[2023,2024,2025,2026,2027].map(y => <option key={y}>{y}</option>)}
                </select>
              </div>
            </div>
          </Card>

          {/* ── Employé ── */}
          <Card className="overflow-visible">
            <div className="px-5 pt-5 pb-4">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Employé</p>

              {selectedEmp ? (
                <div>
                  <div className="flex items-start justify-between p-3 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-2xl mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-sky-200 dark:bg-sky-800 flex items-center justify-center text-sky-700 dark:text-sky-300 font-black text-sm shrink-0">
                        {selectedEmp.firstName[0]}{selectedEmp.lastName[0]}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">{selectedEmp.firstName} {selectedEmp.lastName}</p>
                        <p className="text-xs text-gray-500">{selectedEmp.position}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {loadingDetail && <Loader2 size={14} className="animate-spin text-sky-500" />}
                      <button onClick={() => { setSelectedEmp(null); setEmpSearch(''); setSim(null); }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  {empDetail && (
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { icon: <BadgeCheck size={13} />, label: 'Matricule',   value: empDetail.employeeNumber || '—' },
                        { icon: <Briefcase  size={13} />, label: 'Contrat',     value: empDetail.contractType   || '—' },
                        { icon: <Calendar   size={13} />, label: 'Ancienneté',  value: seniority(empDetail.hireDate) ?? '—' },
                        { icon: <Users      size={13} />, label: 'Situation',
                          value: `${MARITAL_LABELS[empDetail.maritalStatus ?? ''] ?? '—'}${empDetail.numberOfChildren ? ` · ${empDetail.numberOfChildren} enf.` : ''}` },
                      ].map(({ icon, label, value }) => (
                        <div key={label} className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-900/40 rounded-xl">
                          <span className="text-gray-400 dark:text-gray-500 shrink-0">{icon}</span>
                          <div className="min-w-0">
                            <p className="text-[10px] text-gray-400 dark:text-gray-500">{label}</p>
                            <p className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">{value}</p>
                          </div>
                        </div>
                      ))}
                      <div className="col-span-2 flex items-center justify-between px-3 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl">
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Salaire de base</span>
                        <span className="text-sm font-black font-mono text-emerald-700 dark:text-emerald-300">
                          {empDetail.baseSalary ? `${fmt(Number(empDetail.baseSalary))} FCFA` : '—'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={empSearch}
                    onChange={e => { setEmpSearch(e.target.value); setShowDrop(true); }}
                    onFocus={() => setShowDrop(true)}
                    placeholder="Rechercher par nom, prénom ou matricule…"
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 text-gray-800 dark:text-gray-200 placeholder:text-gray-400" />
                  <AnimatePresence>
                    {showDrop && filtered.length > 0 && (
                      <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="absolute z-30 left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
                        {filtered.map((e, i) => (
                          <button key={e.id}
                            onClick={() => { setSelectedEmp(e); setEmpSearch(''); setShowDrop(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-sky-50 dark:hover:bg-sky-900/20 text-left transition-colors ${i > 0 ? 'border-t border-gray-50 dark:border-gray-700/50' : ''}`}>
                            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-[11px] font-black text-gray-600 dark:text-gray-300 shrink-0">
                              {e.firstName[0]}{e.lastName[0]}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-gray-900 dark:text-white">{e.firstName} {e.lastName}</p>
                              <p className="text-[11px] text-gray-400 truncate">
                                {[e.employeeNumber, e.position, e.department?.name].filter(Boolean).join(' · ')}
                              </p>
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {selectedEmp && (
              <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-700/50 pt-4">
                <SLabel>Jours travaillés <span className="font-normal text-gray-400">/ 26 jours théoriques</span></SLabel>
                <div className="flex items-center gap-3">
                  <input type="number" min={0} max={26} value={workedDays}
                    onChange={e => setWorkedDays(e.target.value === '' ? '' : Math.min(26, Math.max(0, Number(e.target.value))))}
                    className="w-20 px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-center text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30" />
                  <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-400 rounded-full transition-all"
                      style={{ width: `${Math.min(100,(n(workedDays)/26)*100)}%` }} />
                  </div>
                  <span className="text-xs text-gray-400 tabular-nums w-8 text-right">{Math.round((n(workedDays)/26)*100)}%</span>
                </div>
              </div>
            )}
          </Card>

          {/* ── Heures supplémentaires ── */}
          <Card className="p-5">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Heures supplémentaires</p>
            <div className="grid grid-cols-4 gap-3">
              {([
                { label:'+10%',  v:ot10,  set:setOt10,  col:'text-amber-500',  ring:'focus:ring-amber-400/30' },
                { label:'+25%',  v:ot25,  set:setOt25,  col:'text-orange-500', ring:'focus:ring-orange-400/30' },
                { label:'+50%',  v:ot50,  set:setOt50,  col:'text-rose-500',   ring:'focus:ring-rose-400/30' },
                { label:'+100%', v:ot100, set:setOt100, col:'text-red-500',    ring:'focus:ring-red-400/30' },
              ] as const).map(({ label, v, set, col, ring }) => (
                <div key={label} className="text-center">
                  <label className={`block text-xs font-bold mb-1.5 ${col}`}>{label}</label>
                  <div className="relative">
                    <input type="number" min={0} value={v}
                      onChange={e => set(e.target.value === '' ? 0 : Number(e.target.value) as any)}
                      className={`w-full pl-2 pr-5 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-center text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 ${ring}`} />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">h</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* ── Primes ── */}
          <Card className="overflow-visible">
            <SectionHeader
              icon={<span className="text-violet-600 dark:text-violet-400 text-xs font-black">%</span>}
              title="Primes"
              subtitle="Soumises à CNSS et ITS — viennent avant le brut"
              total={totalPrimes}
              color="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 text-violet-600"
            />
            <div className="px-5 py-4 space-y-2">
              <div className="grid grid-cols-[1fr_100px_70px_90px_28px] gap-2 px-1 mb-1">
                {['Libellé','Base (F)','Taux','Gain (F)',''].map((h,i) => (
                  <span key={i} className={`text-[10px] font-bold text-gray-400 uppercase tracking-wide ${i===3?'text-right':''}`}>{h}</span>
                ))}
              </div>
              <AnimatePresence initial={false}>
                {primes.map(row => (
                  <InputRow key={row.localId} row={row}
                    placeholder="Ex : Prime d'ancienneté, de rendement…"
                    onChangeLabel={v => {
                      updateRow(setPrimes, row.localId, { label: v });
                      applyAutoIfNeeded(row.localId, v);
                    }}
                    onChangeBase={v => updateRow(setPrimes, row.localId, { base: v })}
                    onChangeRate={v => updateRow(setPrimes, row.localId, { rate: v })}
                    onRemove={() => removeRow(setPrimes, row.localId)} />
                ))}
              </AnimatePresence>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button onClick={() => setPrimes(p => [...p, newRow()])}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/30 rounded-lg transition-colors">
                  <Plus size={11} /> Ajouter une prime
                </button>
                <div className="relative">
                  <button onClick={() => setShowPrimeSugg(v => !v)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    Suggestions <ChevronDown size={9} className={`transition-transform ${showPrimeSugg ? 'rotate-180':''}`} />
                  </button>
                  <AnimatePresence>
                    {showPrimeSugg && (
                      <motion.div initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                        className="absolute z-[999] left-0 top-full mt-1.5 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-3 space-y-1.5">
                        <input type="text" value={primeSuggSearch} onChange={e => setPrimeSuggSearch(e.target.value)}
                          placeholder="Rechercher une prime…"
                          className="w-full px-3 py-1.5 mb-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-400/30 text-gray-700 dark:text-gray-300" />
                        <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                          {(dbPrimeSugg.length > 0
                            ? dbPrimeSugg.map(t => ({ name: t.name, amount: t.defaultAmount ? String(Number(t.defaultAmount)) : '' }))
                            : PRIME_SUGGESTIONS.map(s => ({ name: s, amount: '' }))
                          ).filter(({ name }) => !primeSuggSearch || name.toLowerCase().includes(primeSuggSearch.toLowerCase()))
                          .map(({ name, amount }) => {
                            const added = primes.some(r => r.label === name);
                            return (
                              <button key={name}
                                onClick={() => { addSuggestion(setPrimes, primes, name, amount as any); }}
                                disabled={added}
                                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${added ? 'opacity-40 cursor-not-allowed bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-400' : 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800 hover:bg-violet-100'}`}>
                                {added ? <Check size={9}/> : <Plus size={9}/>} {name}
                              </button>
                            );
                          })}
                        </div>
                        <button onClick={() => setShowPrimeSugg(false)} className="w-full pt-1 text-xs text-gray-400 hover:text-gray-600 transition-colors">Fermer</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </Card>

          {/* ── Indemnités ── */}
          <Card className="overflow-visible">
            <SectionHeader
              icon={<span className="text-emerald-600 dark:text-emerald-400 text-xs font-black">≠</span>}
              title="Indemnités"
              subtitle="Non soumises à CNSS ni ITS — transport, logement, panier…"
              total={totalIndemnites}
              color="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-600"
            />
            <div className="px-5 py-4 space-y-2">
              <div className="grid grid-cols-[1fr_100px_70px_90px_28px] gap-2 px-1 mb-1">
                {['Libellé','Base (F)','Taux','Gain (F)',''].map((h,i) => (
                  <span key={i} className={`text-[10px] font-bold text-gray-400 uppercase tracking-wide ${i===3?'text-right':''}`}>{h}</span>
                ))}
              </div>
              <AnimatePresence initial={false}>
                {indemnites.map(row => (
                  <InputRow key={row.localId} row={row}
                    placeholder="Ex : Indemnité de transport, de logement…"
                    onChangeLabel={v => updateRow(setIndemnites, row.localId, { label: v })}
                    onChangeBase={v => updateRow(setIndemnites, row.localId, { base: v })}
                    onChangeRate={v => updateRow(setIndemnites, row.localId, { rate: v })}
                    onRemove={() => removeRow(setIndemnites, row.localId)} />
                ))}
              </AnimatePresence>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button onClick={() => setIndemnites(p => [...p, newRow()])}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg transition-colors">
                  <Plus size={11} /> Ajouter une indemnité
                </button>
                <div className="relative">
                  <button onClick={() => setShowIndemSugg(v => !v)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    Suggestions <ChevronDown size={9} className={`transition-transform ${showIndemSugg?'rotate-180':''}`} />
                  </button>
                  <AnimatePresence>
                    {showIndemSugg && (
                      <motion.div initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                        className="absolute z-[999] left-0 top-full mt-1.5 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-3">
                        <input type="text" value={indemSuggSearch} onChange={e => setIndemSuggSearch(e.target.value)}
                          placeholder="Rechercher une indemnité…"
                          className="w-full px-3 py-1.5 mb-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400/30 text-gray-700 dark:text-gray-300" />
                        <div className="flex flex-wrap gap-1.5">
                          {(dbIndemSugg.length > 0
                            ? dbIndemSugg.map(t => ({ name: t.name, amount: t.defaultAmount ? String(Number(t.defaultAmount)) : '' }))
                            : INDEMNITE_SUGGESTIONS.map(s => ({ name: s, amount: '' }))
                          ).filter(({ name }) => !indemSuggSearch || name.toLowerCase().includes(indemSuggSearch.toLowerCase()))
                          .map(({ name, amount }) => {
                            const added = indemnites.some(r => r.label === name);
                            return (
                              <button key={name}
                                onClick={() => addSuggestion(setIndemnites, indemnites, name, amount as any)}
                                disabled={added}
                                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${added ? 'opacity-40 cursor-not-allowed bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-400' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'}`}>
                                {added ? <Check size={9}/> : <Plus size={9}/>} {name}
                              </button>
                            );
                          })}
                        </div>
                        <button onClick={() => setShowIndemSugg(false)} className="w-full pt-2 text-xs text-gray-400 hover:text-gray-600 transition-colors">Fermer</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </Card>

          {/* ── Taxes ── */}
          <Card className="overflow-visible">
            <SectionHeader
              icon={<Building2 size={14} className="text-amber-600 dark:text-amber-400" />}
              title="Taxes & Retenues spécifiques"
              subtitle="CNSS et ITS automatiques — ajoutez ici les taxes supplémentaires"
              total={totalTaxes}
              color="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
            />
            <div className="px-5 py-4 space-y-2">
              <AnimatePresence initial={false}>
                {taxes.map(row => (
                  <SimpleRow key={row.localId} row={row}
                    placeholder="Ex : CAMU, TOL, Taxe d'apprentissage…"
                    onChangeLabel={v => updateRow(setTaxes, row.localId, { label: v })}
                    onChangeAmount={v => updateRow(setTaxes, row.localId, { amount: Number(v)||0 })}
                    onRemove={() => removeRow(setTaxes, row.localId)} />
                ))}
              </AnimatePresence>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button onClick={() => setTaxes(p => [...p, newRow()])}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg transition-colors">
                  <Plus size={11} /> Ajouter une taxe
                </button>
                {companyTaxes.length > 0 && (
                  <div className="relative">
                    <button onClick={() => setShowTaxSugg(v => !v)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                      Taxes configurées <ChevronDown size={9} className={`transition-transform ${showTaxSugg?'rotate-180':''}`} />
                    </button>
                    <AnimatePresence>
                      {showTaxSugg && (
                        <motion.div initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                          className="absolute z-[999] left-0 top-full mt-1.5 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-3">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Taxes de l'entreprise</p>
                          <div className="space-y-1">
                            {companyTaxes.map(tax => {
                              const added = taxes.some(t => t.refId === tax.id);
                              return (
                                <button key={tax.id} onClick={() => { addTaxFromTemplate(tax); setShowTaxSugg(false); }} disabled={added}
                                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors ${added ? 'opacity-40 cursor-not-allowed' : 'hover:bg-amber-50 dark:hover:bg-amber-900/20'}`}>
                                  <div className="text-left">
                                    <p className="font-semibold text-gray-800 dark:text-gray-200">{tax.name}</p>
                                    <p className="text-[10px] text-gray-400 font-mono">{tax.code} · {Number(tax.fixedEmployee)>0?`${fmt(Number(tax.fixedEmployee))} F fixe`:`${(Number(tax.employeeRate)*100).toFixed(2)}%`}</p>
                                  </div>
                                  {added ? <Check size={12} className="text-emerald-500"/> : <Plus size={12} className="text-gray-400"/>}
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* ── Prêts ── */}
          <Card className="overflow-hidden">
            <SectionHeader
              icon={<CreditCard size={14} className="text-orange-600 dark:text-orange-400" />}
              title="Prêts"
              subtitle="Remboursements mensuels à déduire du net"
              total={[...empLoans.map(l => Number(l.monthlyRepayment)), ...loans.map(r => n(r.amount))].reduce((s,v)=>s+v,0)}
              color="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800"
            />
            <div className="px-5 py-4 space-y-2">
              {empLoans.map(loan => (
                <div key={loan.id} className="flex items-center justify-between px-3 py-2.5 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/40 rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Prêt{loan.reason ? ` — ${loan.reason}` : ''}</p>
                    <p className="text-[11px] text-gray-400">Solde restant : {fmt(Number(loan.remainingBalance))} F</p>
                  </div>
                  <span className="text-sm font-mono font-black text-orange-600 dark:text-orange-400">−{fmt(Number(loan.monthlyRepayment))} F</span>
                </div>
              ))}
              <AnimatePresence initial={false}>
                {loans.map(row => (
                  <SimpleRow key={row.localId} row={row}
                    placeholder="Ex : Remboursement prêt logement…"
                    amountPlaceholder="Mensualité"
                    onChangeLabel={v => updateRow(setLoans, row.localId, { label: v })}
                    onChangeAmount={v => updateRow(setLoans, row.localId, { amount: Number(v)||0 })}
                    onRemove={() => removeRow(setLoans, row.localId)} />
                ))}
              </AnimatePresence>
              <button onClick={() => setLoans(p => [...p, newRow()])}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-lg transition-colors mt-1">
                <Plus size={11} /> Ajouter un prêt manuellement
              </button>
            </div>
          </Card>

          {/* ── Avances ── */}
          <Card className="overflow-hidden">
            <SectionHeader
              icon={<Wallet size={14} className="text-red-600 dark:text-red-400" />}
              title="Avances sur salaire"
              subtitle="Montants à déduire du net ce mois-ci"
              total={[...empAdvances.map(a => Number(a.amount)), ...advances.map(r => n(r.amount))].reduce((s,v)=>s+v,0)}
              color="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
            />
            <div className="px-5 py-4 space-y-2">
              {empAdvances.map(adv => (
                <div key={adv.id} className="flex items-center justify-between px-3 py-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Avance sur salaire</p>
                    {adv.reason && <p className="text-[11px] text-gray-400">{adv.reason}</p>}
                  </div>
                  <span className="text-sm font-mono font-black text-red-600 dark:text-red-400">−{fmt(Number(adv.amount))} F</span>
                </div>
              ))}
              <AnimatePresence initial={false}>
                {advances.map(row => (
                  <SimpleRow key={row.localId} row={row}
                    placeholder="Ex : Avance du 15 janvier…"
                    amountPlaceholder="Montant"
                    onChangeLabel={v => updateRow(setAdvances, row.localId, { label: v })}
                    onChangeAmount={v => updateRow(setAdvances, row.localId, { amount: Number(v)||0 })}
                    onRemove={() => removeRow(setAdvances, row.localId)} />
                ))}
              </AnimatePresence>
              <button onClick={() => setAdvances(p => [...p, newRow()])}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors mt-1">
                <Plus size={11} /> Ajouter une avance manuellement
              </button>
            </div>
          </Card>

          {/* ════ SECTION RETENUES LIBRES ════ */}
          <Card className="overflow-hidden">
            <SectionHeader
              icon={<span className="text-rose-600 dark:text-rose-400 text-xs font-black">−</span>}
              title="Autres retenues"
              subtitle="Retenues sans pré-enregistrement — déduites du net"
              total={totalRetenues}
              color="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800"
            />
            <div className="px-5 py-4 space-y-2">
              <AnimatePresence initial={false}>
                {retenues.map(r => (
                  <motion.div key={r.localId} initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-4 }}
                    className="group flex items-center gap-2">
                    <input type="text" value={r.label}
                      onChange={e => setRetenues(prev => prev.map(x => x.localId === r.localId ? { ...x, label: e.target.value } : x))}
                      placeholder="Ex : Remboursement, Trop-perçu, Cotisation…"
                      className="flex-1 min-w-0 px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-400/30 placeholder:text-gray-300 dark:placeholder:text-gray-600" />
                    <div className="relative w-32 shrink-0">
                      <input type="number" value={r.amount || ''}
                        onChange={e => setRetenues(prev => prev.map(x => x.localId === r.localId ? { ...x, amount: e.target.value === '' ? '' : Number(e.target.value) } : x))}
                        placeholder="Montant"
                        className="w-full pl-3 pr-5 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-right text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-400/30" />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none">F</span>
                    </div>
                    <button onClick={() => setRetenues(prev => prev.filter(x => x.localId !== r.localId))}
                      className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all shrink-0">
                      <Trash2 size={13} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              <button onClick={() => setRetenues(prev => [...prev, { localId: uid(), label: '', amount: '' }])}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-lg transition-colors mt-1">
                <Plus size={11} /> Ajouter une retenue
              </button>
            </div>
          </Card>

          {/* ════ SUGGESTIONS PARAFIFI ════ */}
          {isParafifi && empDetail && (
            <Card className="overflow-visible border-2 border-dashed border-indigo-200 dark:border-indigo-800">
              <div className="px-5 py-4">
                <p className="text-[11px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider mb-3">
                  🏢 Éléments spéciaux — Parafifi
                </p>
                <div className="flex flex-wrap gap-2">
                  {/* Prime ancienneté */}
                  <button onClick={addAnciennete}
                    disabled={!empDetail.hireDate || getSeniorityYears(empDetail.hireDate) === 0 || primes.some(p => p.label === "Prime d'ancienneté")}
                    className="flex flex-col items-start px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">Prime d'ancienneté</span>
                    <span className="text-[10px] text-indigo-500 mt-0.5">
                      {empDetail.hireDate
                        ? `${getSeniorityYears(empDetail.hireDate)} ans → taux ${(getSeniorityRate(empDetail.hireDate) * 100).toFixed(0)}% → ${Math.round(Number(empDetail.baseSalary) * getSeniorityRate(empDetail.hireDate)).toLocaleString('fr-FR')} F`
                        : 'Date embauche manquante'}
                    </span>
                  </button>
                  {/* Gratification */}
                  <button onClick={addGratification}
                    disabled={primes.some(p => p.label === 'Gratification')}
                    className="flex flex-col items-start px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">Gratification</span>
                    <span className="text-[10px] text-indigo-500 mt-0.5">
                      Salaire base ÷ 2 = {Math.round(Number(empDetail.baseSalary) / 2).toLocaleString('fr-FR')} F
                    </span>
                  </button>
                  {/* Congés payés */}
                  <button onClick={addCongesPaies}
                    disabled={primes.some(p => p.label === 'Indemnité de congés payés')}
                    className="flex flex-col items-start px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">Congés payés</span>
                    <span className="text-[10px] text-indigo-500 mt-0.5">
                      Salaire base ÷ 2 = {Math.round(Number(empDetail.baseSalary) / 2).toLocaleString('fr-FR')} F
                    </span>
                  </button>
                </div>
                <p className="text-[10px] text-indigo-400 mt-3">Ces éléments sont soumis à CNSS et ITS — ajoutés dans la section Primes.</p>
              </div>
            </Card>
          )}

          {/* ════ CUMULS ANNUELS + CONGÉS ════ */}
          {selectedEmp && (
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Cumuls annuels &amp; Congés</p>
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
                  {(['auto','manuel'] as const).map(m => (
                    <button key={m} onClick={() => setCumulMode(m)}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${cumulMode===m?'bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-100 shadow-sm':'text-gray-400 hover:text-gray-600'}`}>
                      {m === 'auto' ? 'Auto (YTD)' : 'Calculatrice'}
                    </button>
                  ))}
                </div>
              </div>

              {cumulMode === 'manuel' ? (
                <CumulCalculatrice
                  onValidate={(vals) => {
                    setCumulBrut(vals.brut);
                    setCumulNetImp(vals.netImp);
                    setCumulChargesSal(vals.chargesSal);
                    setCumulChargesPat(vals.chargesPat);
                    setCongesDroits(vals.droits);
                    setCongesPris(vals.pris);
                    setCongesSolde(vals.solde);
                  }}
                  values={{
                    brut: cumulBrut, netImp: cumulNetImp,
                    chargesSal: cumulChargesSal, chargesPat: cumulChargesPat,
                    droits: congesDroits, pris: congesPris, solde: congesSolde,
                  }}
                />
              ) : (
                <p className="text-xs text-gray-400 text-center py-4">
                  Les cumuls seront calculés automatiquement depuis les bulletins validés (Jan → mois actuel).
                </p>
              )}
            </Card>
          )}

          {!selectedEmp && (
            <div className="flex items-center gap-3 px-4 py-3 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-xl">
              <AlertCircle size={14} className="text-sky-500 shrink-0" />
              <p className="text-sm text-sky-700 dark:text-sky-300">Sélectionnez un employé pour commencer la saisie.</p>
            </div>
          )}
        </div>

        {/* ════ COL DROITE — Aperçu bulletin ════ */}
        <div className="lg:col-span-2 sticky top-6">
          <AnimatePresence mode="wait">
            {sim ? (
              <motion.div key="sim" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">

                <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-slate-800 text-white px-5 py-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Aperçu bulletin</p>
                      <p className="font-black text-lg mt-0.5">{sim.employee.firstName} {sim.employee.lastName}</p>
                    </div>
                    {simLoading && (
                      <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full">
                        <Loader2 size={10} className="animate-spin text-sky-400" />
                        <span className="text-[10px] text-sky-300 font-semibold">Recalcul…</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-[11px] text-gray-400">
                    <span className="capitalize">{month} {year}</span>
                    <span>·</span>
                    <span>{sim.daysToPay}/{sim.workDays} jours</span>
                    {sim.absenceDeduction > 0 && <><span>·</span><span className="text-orange-400">−{fmt(sim.absenceDeduction)} F abs.</span></>}
                    {hasOt && <><span>·</span><span className="text-amber-400">HS</span></>}
                  </div>
                </div>

                <div className="px-5 py-4 space-y-0.5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Gains</p>
                  <BLine label="Salaire de base ajusté" value={`+${fmt(sim.adjustedBaseSalary)} F`} cls="text-gray-800 dark:text-gray-100" />
                  {sim.overtime.amount10  > 0 && <BLine label={`HS +${sim.settings.overtimeRate10}% (${sim.overtime.hours10}h)`}   value={`+${fmt(sim.overtime.amount10)} F`}  cls="text-amber-500" sm />}
                  {sim.overtime.amount25  > 0 && <BLine label={`HS +${sim.settings.overtimeRate25}% (${sim.overtime.hours25}h)`}   value={`+${fmt(sim.overtime.amount25)} F`}  cls="text-amber-500" sm />}
                  {sim.overtime.amount50  > 0 && <BLine label={`HS +${sim.settings.overtimeRate50}% (${sim.overtime.hours50}h)`}   value={`+${fmt(sim.overtime.amount50)} F`}  cls="text-rose-500"  sm />}
                  {sim.overtime.amount100 > 0 && <BLine label={`HS +${sim.settings.overtimeRate100}% (${sim.overtime.hours100}h)`} value={`+${fmt(sim.overtime.amount100)} F`} cls="text-red-500"   sm />}
                  {sim.bonuses?.map((b, i) => <BLine key={i} label={b.bonusType} value={`+${fmt(b.amount)} F`} cls="text-emerald-600 dark:text-emerald-400" sm />)}

                  <div className="flex justify-between items-center py-2 bg-emerald-50 dark:bg-emerald-900/20 px-3 rounded-xl mt-2">
                    <span className="text-sm font-bold text-emerald-800 dark:text-emerald-200">Salaire brut</span>
                    <span className="font-mono font-black text-emerald-700 dark:text-emerald-300">{fmt(sim.grossSalary)} F</span>
                  </div>

                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pt-3 mb-2">Retenues légales</p>
                  <BLine label={`CNSS (${sim.settings.cnssSalarialRate}%)`}
                    value={sim.employee.isSubjectToCnss ? `−${fmt(sim.cnssSalarial)} F` : '0 F (exempté)'}
                    cls={sim.employee.isSubjectToCnss ? 'text-red-500' : 'text-gray-400'} />
                  <BLine label="ITS / IRPP"
                    value={sim.employee.isSubjectToIrpp ? `−${fmt(sim.its)} F` : '0 F (exempté)'}
                    cls={sim.employee.isSubjectToIrpp ? 'text-red-500' : 'text-gray-400'} />
                  {sim.totalLoanDeduction    > 0 && <BLine label="Prêts"   value={`−${fmt(sim.totalLoanDeduction)} F`}    cls="text-red-500" sm />}
                  {sim.totalAdvanceDeduction > 0 && <BLine label="Avances" value={`−${fmt(sim.totalAdvanceDeduction)} F`} cls="text-red-500" sm />}
                  {(sim as any).manualDeductionTotal > 0 && <BLine label="Autres retenues" value={`−${fmt((sim as any).manualDeductionTotal)} F`} cls="text-red-500" sm />}

                  <div className="mt-4 pt-4 border-t-2 border-dashed border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Net à payer</span>
                      <div className="text-right leading-none">
                        <span className="text-[26px] font-black text-gray-900 dark:text-white font-mono tracking-tight">{fmt(sim.netSalary)}</span>
                        <span className="text-sm text-gray-400 ml-1">FCFA</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 border border-orange-200 dark:border-orange-800/40 rounded-xl overflow-hidden">
                    <button onClick={() => setShowEmpCost(v => !v)}
                      className="w-full flex items-center justify-between px-4 py-2.5 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100/50 transition-colors">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-orange-700 dark:text-orange-400">
                        <Building2 size={12} /> Coût employeur
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-orange-600 dark:text-orange-400">+{fmt(sim.totalEmployerCost)} F</span>
                        {showEmpCost ? <ChevronUp size={12} className="text-orange-400"/> : <ChevronDown size={12} className="text-orange-400"/>}
                      </div>
                    </button>
                    <AnimatePresence>
                      {showEmpCost && (
                        <motion.div initial={{ height:0 }} animate={{ height:'auto' }} exit={{ height:0 }} className="overflow-hidden">
                          <div className="px-4 py-3 bg-white dark:bg-gray-800/50 space-y-0.5">
                            <BLine label="CNSS Pensions (8%)"    value={`+${fmt(sim.cnssEmployerPension)} F`}  cls="text-orange-500" sm />
                            <BLine label="CNSS Famille (10,03%)" value={`+${fmt(sim.cnssEmployerFamily)} F`}   cls="text-orange-500" sm />
                            <BLine label="CNSS Accident (2,25%)" value={`+${fmt(sim.cnssEmployerAccident)} F`} cls="text-orange-500" sm />
                            <BLine label="TUS DGI (2,025%)"      value={`+${fmt(sim.tusDgiAmount)} F`}         cls="text-amber-500"  sm />
                            <BLine label="TUS CNSS (5,475%)"     value={`+${fmt(sim.tusCnssAmount)} F`}        cls="text-amber-500"  sm />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="px-5 pb-5">
                  <button onClick={submit} disabled={submitting || simLoading}
                    className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-600 hover:to-emerald-600 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 text-sm">
                    {submitting ? <><Loader2 size={15} className="animate-spin"/>Enregistrement…</> : <><CheckCircle2 size={15}/>Confirmer & créer le bulletin</>}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity:0 }} animate={{ opacity:1 }}
                className="bg-gray-50 dark:bg-gray-800/50 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl min-h-[260px] flex flex-col items-center justify-center text-center p-8">
                {simLoading
                  ? <><Loader2 size={32} className="animate-spin mb-3 text-sky-500"/><p className="text-sm font-medium text-gray-600 dark:text-gray-300">Calcul en cours…</p></>
                  : simError
                  ? <><AlertCircle size={32} className="mb-3 text-red-400"/><p className="text-sm font-medium text-red-500 max-w-[200px]">{simError}</p></>
                  : <><Calculator size={36} className="mb-3 text-gray-300 dark:text-gray-600"/><p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{!selectedEmp?'Sélectionnez un employé':!empDetail?'Chargement…':'Le bulletin se calcule automatiquement'}</p><p className="text-xs text-gray-400 mt-1">Mis à jour en temps réel</p></>
                }
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modal succès */}
      <AnimatePresence>
        {success && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" initial={{ opacity:0 }} animate={{ opacity:1 }}>
            <motion.div initial={{ opacity:0, scale:0.9, y:20 }} animate={{ opacity:1, scale:1, y:0 }} transition={{ type:'spring', stiffness:300, damping:26 }}
              className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 size={34} className="text-emerald-500" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Bulletin créé !</h2>
              <p className="text-gray-400 text-sm mb-7">La fiche de paie a été enregistrée avec succès.</p>
              <div className="flex gap-3">
                <button onClick={resetPage} className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm">Nouveau</button>
                {createdId && <button onClick={() => router.push(`/paie/${createdId}`)} className="flex-1 py-3 bg-sky-500 text-white font-bold rounded-xl hover:bg-sky-600 transition-colors text-sm">Voir bulletin</button>}
                <button onClick={() => router.push('/paie')} className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors text-sm">Liste paie</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}