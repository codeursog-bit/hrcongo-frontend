'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2, Wallet, Smartphone, Briefcase, Calendar, DollarSign,
  CreditCard, AlertCircle, Plus, X, Loader2, Save, Network,
  Sparkles, Clock, CalendarDays, Check,
  Infinity, CalendarCheck, GraduationCap, UserCheck, Handshake, RefreshCw,
} from 'lucide-react';
import { FancySelect } from '@/components/ui/FancySelect';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';
import { useAlert } from '@/components/providers/AlertProvider';
import { differenceInDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Step3ContractProps {
  formData: any;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (name: string, value: string) => void;
  departments: any[];
  onDepartmentCreated: (newDept: any) => void;
}

interface ConventionCategory {
  code: string;
  label: string;
  minSalary: number;
  description?: string;
}

interface CompanyData {
  collectiveAgreement?: string;
  [key: string]: any;
}

const REQUIRES_END_DATE  = ['CDD', 'STAGE', 'INTERIM', 'CONSULTANT', 'PRESTATAIRE'];
const CAN_HAVE_TRIAL     = ['CDI', 'CDD'];
const BNC_CONTRACTS      = ['CONSULTANT', 'PRESTATAIRE'];
const TRIAL_MAX_DAYS: Record<string, number> = { CDI: 90, CDD: 30 };

const SUGGESTED_DURATIONS: Record<string, { label: string; months: number }[]> = {
  STAGE:       [{ label: '1 mois', months: 1 }, { label: '3 mois', months: 3 }, { label: '6 mois', months: 6 }],
  CDD:         [{ label: '3 mois', months: 3 }, { label: '6 mois', months: 6 }, { label: '1 an',   months: 12 }],
  INTERIM:     [{ label: '1 mois', months: 1 }, { label: '3 mois', months: 3 }, { label: '6 mois', months: 6 }],
  CONSULTANT:  [{ label: '3 mois', months: 3 }, { label: '6 mois', months: 6 }, { label: '1 an',   months: 12 }],
  PRESTATAIRE: [{ label: '1 mois', months: 1 }, { label: '3 mois', months: 3 }, { label: '6 mois', months: 6 }],
};

const CONTRACT_ICONS: Record<string, React.ElementType> = {
  CDI:         Infinity,
  CDD:         CalendarCheck,
  STAGE:       GraduationCap,
  CONSULTANT:  UserCheck,
  PRESTATAIRE: Handshake,
  INTERIM:     RefreshCw,
};

const CONTRACT_INFO: Record<string, { desc: string; bulletin: boolean; cnss: string; impot: string; tus: string; alertes: string[] }> = {
  CDI:         { desc: 'Permanent',  bulletin: true,  cnss: 'CNSS 4% sal. + 20,28% pat.',  impot: 'ITS barème',      tus: 'TUS 7,5%', alertes: [] },
  CDD:         { desc: 'Temporaire', bulletin: true,  cnss: 'CNSS identique CDI',            impot: 'ITS barème',      tus: 'TUS 7,5%', alertes: ['Max 2 ans renouvellement inclus'] },
  STAGE:       { desc: 'Formation',  bulletin: true,  cnss: 'AT patronale 2,25% seulement',  impot: 'ITS si > SMIG',   tus: 'Aucun',    alertes: ['Convention tripartite obligatoire', 'Max 6 mois'] },
  CONSULTANT:  { desc: 'Prestation', bulletin: false, cnss: 'Aucune CNSS',                   impot: 'BNC à la source', tus: 'Aucun',    alertes: ['Facture HT — pas de bulletin', 'BNC reversé DGI avant le 15'] },
  PRESTATAIRE: { desc: 'Service',    bulletin: false, cnss: 'Aucune CNSS',                   impot: 'BNC à la source', tus: 'Aucun',    alertes: ['Facture HT — pas de bulletin', 'BNC reversé DGI avant le 15'] },
  INTERIM:     { desc: 'Agence',     bulletin: false, cnss: "Géré par l'agence",              impot: "Géré par l'agence", tus: "Géré par l'agence", alertes: ["Pas de bulletin — suivi mission uniquement"] },
};

function formatDuration(days: number): string {
  if (days <= 0) return '—';
  if (days < 30) return `${days} jour${days > 1 ? 's' : ''}`;
  const months = Math.floor(days / 30);
  const rem    = days % 30;
  if (rem === 0) return `${months} mois`;
  return `${months} mois ${rem}j`;
}

// ─── Section label ────────────────────────────────────────────────────────────
function SectionLabel({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <Icon size={13} className="text-gray-400 dark:text-gray-500" />
      </div>
      <span className="text-[11px] font-black uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500">
        {label}
      </span>
    </div>
  );
}

// ─── Field wrapper ─────────────────────────────────────────────────────────────
function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        {label}
        {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-gray-400 dark:text-gray-500">{hint}</p>}
    </div>
  );
}

function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-3.5 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 dark:focus:border-sky-500 transition-all ${className}`}
    />
  );
}

// ─── Contract duration preview ─────────────────────────────────────────────────
function ContractDurationPreview({ hireDate, endDate, contractType }: {
  hireDate: string; endDate: string; contractType: string;
}) {
  if (!hireDate || !endDate) return null;
  const start = new Date(hireDate);
  const end   = new Date(endDate);
  if (end <= start) return null;

  const totalDays = differenceInDays(end, start);
  const today     = new Date();
  const daysLeft  = differenceInDays(end, today);
  const pct       = Math.min(100, Math.round(((totalDays - Math.max(0, daysLeft)) / totalDays) * 100));
  const barColor  = daysLeft <= 7 ? 'bg-red-500' : daysLeft <= 30 ? 'bg-amber-500' : daysLeft <= 60 ? 'bg-yellow-500' : 'bg-emerald-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 space-y-3"
    >
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500 flex items-center gap-1.5"><Clock size={12} /> Durée totale</span>
        <span className="font-bold text-gray-900 dark:text-white">{formatDuration(totalDays)}</span>
      </div>
      <div>
        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={`h-full rounded-full ${barColor}`}
          />
        </div>
        <div className="flex justify-between text-[10px] text-gray-400 mt-1">
          <span>{format(start, 'd MMM yyyy', { locale: fr })}</span>
          <span className={daysLeft <= 30 ? 'text-amber-500 font-bold' : ''}>
            {format(end, 'd MMM yyyy', { locale: fr })}
          </span>
        </div>
      </div>
      <p className={`text-xs font-semibold flex items-center gap-1.5 ${
        daysLeft <= 7 ? 'text-red-500' : daysLeft <= 30 ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'
      }`}>
        <CalendarDays size={11} />
        {daysLeft > 0
          ? `${daysLeft} jour${daysLeft > 1 ? 's' : ''} restant${daysLeft > 1 ? 's' : ''} — alertes automatiques actives`
          : 'Date de fin dans le passé'
        }
      </p>
    </motion.div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export const Step3Contract: React.FC<Step3ContractProps> = ({
  formData,
  onInputChange,
  onSelectChange,
  departments,
  onDepartmentCreated,
}) => {
  const alert = useAlert();
  const [showDeptModal, setShowDeptModal]   = useState(false);
  const [deptFormData, setDeptFormData]     = useState({ name: '', code: '' });
  const [isCreatingDept, setIsCreatingDept] = useState(false);
  const [companyConvention, setCompanyConvention]       = useState<string | null>(null);
  const [conventionCategories, setConventionCategories] = useState<ConventionCategory[]>([]);
  const [isLoadingConvention, setIsLoadingConvention]   = useState(true);

  const needsEndDate  = REQUIRES_END_DATE.includes(formData.contractType);
  const canHaveTrial  = CAN_HAVE_TRIAL.includes(formData.contractType);
  const isBncContract = BNC_CONTRACTS.includes(formData.contractType);
  const contractMeta  = CONTRACT_INFO[formData.contractType] ?? CONTRACT_INFO['CDI'];
  const suggestions   = SUGGESTED_DURATIONS[formData.contractType] ?? [];
  const maxTrialDays  = TRIAL_MAX_DAYS[formData.contractType] ?? 90;
  const trialDays     = parseInt(formData.trialPeriodDays as string || '0') || 0;
  const trialEndDate  = (canHaveTrial && trialDays > 0 && formData.hireDate)
    ? (() => { const d = new Date(formData.hireDate); d.setDate(d.getDate() + trialDays); return d; })()
    : null;

  const montantHT  = parseFloat(formData.baseSalary as string) || 0;
  const isResident = formData.isResident !== 'false';
  const bncTaux    = isResident ? 0.10 : 0.20;
  const bncMontant = isBncContract && montantHT > 0 ? Math.round(montantHT * bncTaux) : 0;
  const bncNet     = montantHT - bncMontant;

  useEffect(() => {
    const load = async () => {
      try {
        const company = await api.get<CompanyData>('/companies/mine');
        if (company.collectiveAgreement) {
          setCompanyConvention(company.collectiveAgreement);
          const cats = await api.get<ConventionCategory[]>(`/conventions/categories/${company.collectiveAgreement}`);
          setConventionCategories(cats);
        }
      } catch {}
      finally { setIsLoadingConvention(false); }
    };
    load();
  }, []);

  const handleContractTypeChange = (type: string) => {
    onSelectChange('contractType', type);
    if (type === 'CDI') onSelectChange('contractEndDate', '');
    if (!CAN_HAVE_TRIAL.includes(type)) {
      onSelectChange('trialPeriodDays', '0');
      onSelectChange('trialEndDate', '');
    }
    if (BNC_CONTRACTS.includes(type) && !formData.isResident)
      onSelectChange('isResident', 'true');
  };

  const applySuggestion = (months: number) => {
    if (!formData.hireDate) {
      alert.warning("Date d'embauche manquante", "Renseignez d'abord la date d'embauche");
      return;
    }
    const end = new Date(formData.hireDate);
    end.setMonth(end.getMonth() + months);
    onSelectChange('contractEndDate', end.toISOString().split('T')[0]);
  };

  const handleCategoryChange = (categoryCode: string) => {
    onSelectChange('professionalCategory', categoryCode);
    const cat = conventionCategories.find((c) => c.code === categoryCode);
    if (cat?.minSalary && (!formData.baseSalary || parseFloat(formData.baseSalary) < cat.minSalary)) {
      onSelectChange('baseSalary', cat.minSalary.toString());
      alert.info('Salaire ajusté', `Minimum pour ${cat.label} : ${cat.minSalary.toLocaleString()} FCFA`);
    }
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingDept(true);
    try {
      const newDept = await api.post('/departments', deptFormData);
      alert.success('Département créé', `${deptFormData.name} a été ajouté.`);
      setShowDeptModal(false);
      setDeptFormData({ name: '', code: '' });
      onDepartmentCreated(newDept);
    } catch (e: any) {
      alert.error('Erreur', e.message || 'Impossible de créer le département.');
    } finally {
      setIsCreatingDept(false);
    }
  };

  return (
    <div>
      <div className="space-y-6">

        {/* Step title */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
            Contrat & Rémunération
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Définissons les conditions d'emploi
          </p>
        </div>

        {/* ── BLOC 1 : Poste & Affectation ──────────────────────────────────── */}
        <div className="p-5 bg-white dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-700/50 space-y-4">
          <SectionLabel icon={Building2} label="Poste & Affectation" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Département */}
            <div>
              <FancySelect
                label="Département *"
                value={formData.departmentId}
                onChange={(v) => onSelectChange('departmentId', v)}
                icon={Building2}
                options={departments.map((d) => ({ value: d.id, label: d.name }))}
                placeholder="Choisir un département..."
              />
              {departments.length === 0 ? (
                <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-xl">
                  <p className="text-xs text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-1.5">
                    <AlertCircle size={12} /> Aucun département
                  </p>
                  <button type="button" onClick={() => setShowDeptModal(true)}
                    className="w-full py-2 px-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5">
                    <Plus size={13} /> Créer le premier
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => setShowDeptModal(true)}
                  className="mt-1.5 text-xs text-sky-600 dark:text-sky-400 font-semibold flex items-center gap-1 hover:underline">
                  <Plus size={12} /> Créer un département
                </button>
              )}
            </div>

            {/* Poste */}
            <Field label="Intitulé du poste" required>
              <Input
                name="position"
                value={formData.position}
                onChange={onInputChange}
                placeholder="Comptable, Dev, Manager…"
              />
            </Field>
          </div>

          {/* Convention collective */}
          {companyConvention && !isLoadingConvention && conventionCategories.length > 0 && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-gray-500" />
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                  Convention collective · {companyConvention}
                </span>
              </div>
              <select
                value={formData.professionalCategory || ''}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3.5 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all"
              >
                <option value="">Sélectionner une catégorie…</option>
                {conventionCategories.map((cat) => (
                  <option key={cat.code} value={cat.code}>
                    {cat.label} — {cat.minSalary.toLocaleString()} FCFA min.
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date d'embauche */}
          <Field label="Date d'embauche" required>
            <div className="relative">
              <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <Input
                type="date"
                name="hireDate"
                value={formData.hireDate}
                onChange={onInputChange}
                className="pl-9"
              />
            </div>
          </Field>
        </div>

        {/* ── BLOC 2 : Type de contrat ──────────────────────────────────────── */}
        <div className="p-5 bg-white dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-700/50 space-y-4">
          <SectionLabel icon={Briefcase} label="Type de contrat" />

          {/* Contract type pills */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {(['CDI', 'CDD', 'STAGE', 'CONSULTANT', 'PRESTATAIRE', 'INTERIM'] as const).map((type) => {
              const meta         = CONTRACT_INFO[type];
              const ContractIcon = CONTRACT_ICONS[type];
              const isSelected   = formData.contractType === type;
              return (
                <motion.button
                  key={type}
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleContractTypeChange(type)}
                  className={`relative p-3 rounded-xl border text-center transition-all ${
                    isSelected
                      ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <ContractIcon size={16} className="mx-auto mb-1" />
                  <div className="text-[11px] font-black">{type}</div>
                  <div className="text-[9px] opacity-60 mt-0.5 hidden sm:block">{meta?.desc}</div>
                </motion.button>
              );
            })}
          </div>

          {/* Résumé fiscal inline — discret */}
          <AnimatePresence mode="wait">
            {formData.contractType && (
              <motion.div
                key={`fiscal-${formData.contractType}`}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-3.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700"
              >
                <div className="grid grid-cols-3 gap-3 text-[11px]">
                  {[
                    { label: 'CNSS',  value: contractMeta?.cnss },
                    { label: 'Impôt', value: contractMeta?.impot },
                    { label: 'TUS',   value: contractMeta?.tus },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">{label}</p>
                      <p className="font-semibold text-gray-700 dark:text-gray-300 text-[11px] leading-tight">{value}</p>
                    </div>
                  ))}
                </div>
                {contractMeta?.alertes.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 space-y-1">
                    {contractMeta.alertes.map((a, i) => (
                      <p key={i} className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                        <AlertCircle size={10} className="shrink-0" /> {a}
                      </p>
                    ))}
                  </div>
                )}
                {formData.contractType === 'CDI' && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-1.5">
                    <Check size={10} /> Contrat indéterminé — pas de date de fin requise
                  </p>
                )}
                {formData.contractType === 'INTERIM' && (
                  <p className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-1.5">
                    <RefreshCw size={10} /> Aucun bulletin généré côté entreprise
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Date de fin conditionnelle */}
          <AnimatePresence mode="wait">
            {needsEndDate && (
              <motion.div
                key="endDate"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CalendarDays size={12} /> Date de fin <span className="text-red-400">*</span>
                  </label>
                  {/* Durée suggérée */}
                  {suggestions.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap justify-end">
                      {suggestions.map((s) => (
                        <button key={s.months} type="button" onClick={() => applySuggestion(s.months)}
                          className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-[11px] font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                          +{s.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Input
                  type="date"
                  name="contractEndDate"
                  value={formData.contractEndDate || ''}
                  onChange={onInputChange}
                  min={formData.hireDate || undefined}
                />
                <ContractDurationPreview
                  hireDate={formData.hireDate}
                  endDate={formData.contractEndDate}
                  contractType={formData.contractType}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Période d'essai */}
          <AnimatePresence mode="wait">
            {canHaveTrial && (
              <motion.div
                key="trial"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22 }}
                className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock size={13} className="text-gray-400" />
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Période d'essai <span className="font-normal text-gray-400 lowercase">(optionnel)</span>
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full font-semibold">
                    Max {maxTrialDays}j
                  </span>
                </div>

                {/* Quick buttons */}
                <div className="flex gap-1.5 flex-wrap">
                  {[
                    { label: 'Sans essai', days: 0 },
                    { label: '15j', days: 15 },
                    { label: '30j', days: 30 },
                    ...(formData.contractType === 'CDI' ? [{ label: '60j', days: 60 }, { label: '90j', days: 90 }] : []),
                  ].map(({ label, days }) => (
                    <button key={days} type="button"
                      onClick={() => { onSelectChange('trialPeriodDays', String(days)); if (days === 0) onSelectChange('trialEndDate', ''); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        trialDays === days
                          ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white'
                          : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400'
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>

                {/* Manual input */}
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  name="trialPeriodDays"
                  value={formData.trialPeriodDays as string || '0'}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    onSelectChange('trialPeriodDays', val === '' ? '0' : val);
                  }}
                  placeholder="Ou saisir en jours…"
                />
                {trialDays > maxTrialDays && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle size={11} /> Dépasse le maximum légal ({maxTrialDays}j)
                  </p>
                )}
                {trialDays > 0 && trialEndDate && formData.hireDate && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex items-center justify-between px-3 py-2.5 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 text-xs">
                    <span className="text-gray-500">Fin de période d'essai</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {format(trialEndDate, 'd MMMM yyyy', { locale: fr })}
                    </span>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── BLOC 3 : Rémunération ─────────────────────────────────────────── */}
        <div className="p-5 bg-white dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-700/50 space-y-4">
          <SectionLabel icon={DollarSign} label={isBncContract ? 'Prestation' : 'Rémunération'} />

          {/* Salaire */}
          <Field
            label={isBncContract ? 'Montant HT de la prestation' : formData.contractType === 'STAGE' ? 'Gratification mensuelle' : 'Salaire de base mensuel'}
            required
            hint={
              !isBncContract && formData.baseSalary && parseFloat(formData.baseSalary) > 0
                ? `≈ ${(parseFloat(formData.baseSalary) / 26).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA par jour ouvré`
                : undefined
            }
          >
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                name="baseSalary"
                value={formData.baseSalary}
                onChange={(e) => {
                  // Allow only digits and single dot
                  const val = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
                  onSelectChange('baseSalary', val);
                }}
                placeholder="0"
                className="w-full pl-3.5 pr-16 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 dark:text-gray-500">
                FCFA
              </span>
            </div>
          </Field>

          {/* BNC section (Consultant / Prestataire) */}
          <AnimatePresence mode="wait">
            {isBncContract && (
              <motion.div
                key="bnc"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22 }}
                className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 space-y-4"
              >
                <div className="flex items-center gap-2">
                  <UserCheck size={13} className="text-gray-500" />
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Retenue BNC · Résidence fiscale
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                  CGI Congo art. 47 ter & art. 44 — le taux dépend du statut de résidence.
                </p>

                {/* Résidence */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'true',  label: 'Résident / Congolais',   sub: 'BNC 10%', active: isResident },
                    { value: 'false', label: 'Étranger non résident',  sub: 'BNC 20%', active: !isResident },
                  ].map(({ value, label, sub, active }) => (
                    <motion.button
                      key={value}
                      type="button"
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onSelectChange('isResident', value)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        active
                          ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md'
                          : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      <p className="text-[11px] font-bold">{label}</p>
                      <p className={`text-base font-black mt-0.5 ${active ? '' : 'text-gray-400'}`}>{sub}</p>
                    </motion.button>
                  ))}
                </div>

                {/* Nationalité */}
                <Field label="Nationalité (optionnel)">
                  <Input
                    name="nationality"
                    value={formData.nationality as string || ''}
                    onChange={onInputChange}
                    placeholder="CG, FR, US, CM…"
                  />
                </Field>

                {/* BNC preview */}
                {montantHT > 0 && (
                  <motion.div
                    key={`bnc-${isResident}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2 text-xs"
                  >
                    <p className="font-bold text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                      <DollarSign size={11} /> Calcul BNC
                    </p>
                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                      <span>Montant HT</span>
                      <span className="font-bold text-gray-900 dark:text-white">{montantHT.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                      <span>BNC retenu ({bncTaux * 100}%)</span>
                      <span className="font-bold text-red-500">− {bncMontant.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-100 dark:border-gray-700 pt-2">
                      <span className="font-bold text-gray-700 dark:text-gray-300">Net versé</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{bncNet.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                    <p className="text-[10px] text-gray-400 pt-0.5">
                      Les {bncMontant.toLocaleString('fr-FR')} FCFA sont à reverser à la DGI avant le 15 du mois.
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── BLOC 4 : Mode de paiement ─────────────────────────────────────── */}
        <div className="p-5 bg-white dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-700/50 space-y-4">
          <SectionLabel icon={Wallet} label="Mode de paiement" />

          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'CASH',          label: 'Espèces',  icon: CreditCard },
              { value: 'BANK_TRANSFER', label: 'Banque',   icon: Building2 },
              { value: 'MOBILE_MONEY',  label: 'Mobile',   icon: Smartphone },
            ].map(({ value, label, icon: Icon }) => {
              const isSelected = formData.paymentMethod === value;
              return (
                <motion.button
                  key={value}
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onSelectChange('paymentMethod', value)}
                  className={`p-3.5 rounded-xl border text-center transition-all ${
                    isSelected
                      ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <Icon size={18} className="mx-auto mb-1.5" />
                  <div className="text-xs font-bold">{label}</div>
                </motion.button>
              );
            })}
          </div>

          {/* Bank details */}
          <AnimatePresence mode="wait">
            {formData.paymentMethod === 'BANK_TRANSFER' && (
              <motion.div key="bank"
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1"
              >
                <FancySelect
                  label="Banque"
                  value={formData.bankName}
                  onChange={(v) => onSelectChange('bankName', v)}
                  icon={Building2}
                  options={[
                    { value: 'BGFI',             label: 'BGFI Bank' },
                    { value: 'ECOBANK',           label: 'Ecobank' },
                    { value: 'LCB',               label: 'LCB Bank' },
                    { value: 'UBA',               label: 'UBA' },
                    { value: 'SOCIETE_GENERALE',  label: 'Société Générale' },
                  ]}
                />
                <Field label="N° de compte (RIB)">
                  <Input
                    name="bankAccountNumber"
                    value={formData.bankAccountNumber}
                    onChange={onInputChange}
                    placeholder="XXXXXXXXXXXXXXXXXXXXXXXX"
                    className="font-mono"
                  />
                </Field>
              </motion.div>
            )}
            {formData.paymentMethod === 'MOBILE_MONEY' && (
              <motion.div key="mobile"
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1"
              >
                <FancySelect
                  label="Opérateur"
                  value={formData.mobileMoneyOperator}
                  onChange={(v) => onSelectChange('mobileMoneyOperator', v)}
                  icon={Smartphone}
                  options={[
                    { value: 'MTN',    label: 'MTN Mobile Money' },
                    { value: 'AIRTEL', label: 'Airtel Money' },
                  ]}
                />
                <Field label="Numéro de téléphone">
                  <Input
                    name="mobileMoneyNumber"
                    value={formData.mobileMoneyNumber}
                    onChange={onInputChange}
                    placeholder="06 123 45 67"
                    className="font-mono"
                  />
                </Field>
              </motion.div>
            )}
            {formData.paymentMethod === 'CASH' && (
              <motion.div key="cash"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700"
              >
                <Check size={13} className="text-gray-400" />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Paiement en espèces — aucune information bancaire requise
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Modal création département ──────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {showDeptModal && (
          <motion.div
            key="dept-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowDeptModal(false)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 16 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
            >
              <button type="button" onClick={() => setShowDeptModal(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X size={18} />
              </button>
              <div className="flex items-center gap-3 mb-7">
                <div className="w-11 h-11 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
                  <Network size={20} className="text-gray-500 dark:text-gray-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Nouveau département</h2>
              </div>
              <form onSubmit={handleCreateDepartment} className="space-y-5">
                <Field label="Nom du département" required>
                  <Input
                    required autoFocus
                    placeholder="Marketing, IT, Finance…"
                    value={deptFormData.name}
                    onChange={(e) => setDeptFormData({ ...deptFormData, name: e.target.value })}
                  />
                </Field>
                <Field label="Code (optionnel)">
                  <Input
                    placeholder="MKT, IT, FIN…"
                    value={deptFormData.code}
                    onChange={(e) => setDeptFormData({ ...deptFormData, code: e.target.value.toUpperCase() })}
                    className="font-mono"
                  />
                </Field>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowDeptModal(false)}
                    className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-2xl text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    Annuler
                  </button>
                  <button type="submit" disabled={isCreatingDept}
                    className="flex-1 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-2xl text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors shadow-lg">
                    {isCreatingDept ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                    Créer
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};