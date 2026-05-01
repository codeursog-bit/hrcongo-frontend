// ============================================================================
// 📁 components/employees/create/Step4Validation.tsx
// ============================================================================

import React from 'react';
import {
  User, Check, Briefcase, Heart, ShieldCheck, MapPin, Phone,
  Mail, Calendar, Building2, Wallet, Baby, AlertCircle, CalendarDays,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { differenceInDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Step4ValidationProps {
  formData: any;
  departments: any[];
  imagePreview: string | null;
}

const REQUIRES_END_DATE = ['CDD', 'STAGE', 'INTERIM', 'CONSULTANT'];

const MARITAL_LABELS: Record<string, string> = {
  SINGLE:   'Célibataire',
  MARRIED:  'Marié(e)',
  DIVORCED: 'Divorcé(e)',
  WIDOWED:  'Veuf/Veuve',
};

const PAYMENT_LABELS: Record<string, string> = {
  BANK_TRANSFER: 'Virement bancaire',
  MOBILE_MONEY:  'Mobile Money',
  CASH:          'Espèces',
};

// ─── Summary row ──────────────────────────────────────────────────────────────
function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
      <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 pt-0.5">{label}</span>
      <span className={`text-sm font-bold text-gray-900 dark:text-white text-right ${mono ? 'font-mono text-xs' : ''}`}>
        {value}
      </span>
    </div>
  );
}

// ─── Summary card ─────────────────────────────────────────────────────────────
function Card({ icon: Icon, title, children }: {
  icon: React.ElementType; title: string; children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 bg-white dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-700/50"
    >
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100 dark:border-gray-700/50">
        <div className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
          <Icon size={13} className="text-gray-400 dark:text-gray-500" />
        </div>
        <span className="text-[11px] font-black uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500">
          {title}
        </span>
      </div>
      <div>{children}</div>
    </motion.div>
  );
}

export const Step4Validation: React.FC<Step4ValidationProps> = ({
  formData,
  departments,
  imagePreview,
}) => {
  const department   = departments.find((d) => d.id === formData.departmentId);
  const needsEndDate = REQUIRES_END_DATE.includes(formData.contractType);

  const contractDuration = needsEndDate && formData.hireDate && formData.contractEndDate
    ? differenceInDays(new Date(formData.contractEndDate), new Date(formData.hireDate))
    : null;

  const initials = `${formData.firstName?.[0] ?? ''}${formData.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <div className="space-y-6">

      {/* ── Hero : avatar + nom + badges ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center text-center py-6"
      >
        {/* Avatar */}
        <div className="relative mb-4">
          <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden shadow-md">
            {imagePreview
              ? <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              : <span className="text-2xl font-black text-gray-400 dark:text-gray-500">{initials || <User size={28} />}</span>
            }
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2, stiffness: 400, damping: 20 }}
            className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-gray-900 dark:bg-white rounded-xl flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-900"
          >
            <Check size={13} strokeWidth={3} className="text-white dark:text-gray-900" />
          </motion.div>
        </div>

        <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight mb-1">
          {formData.firstName} {formData.lastName}
        </h2>

        <div className="flex flex-wrap justify-center gap-2 mt-1">
          {formData.position && (
            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl text-xs font-bold">
              {formData.position}
            </span>
          )}
          <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl text-xs font-bold">
            {formData.contractType}
          </span>
          {department && (
            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl text-xs font-bold flex items-center gap-1">
              <Building2 size={11} /> {department.name}
            </span>
          )}
        </div>
      </motion.div>

      {/* ── Summary grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Identité */}
        <Card icon={User} title="Identité">
          <Row label="Né(e) le" value={formData.dateOfBirth ? new Date(formData.dateOfBirth).toLocaleDateString('fr-FR') : '—'} />
          <Row label="Lieu" value={formData.placeOfBirth || '—'} />
          <Row label="Téléphone" value={formData.phone || '—'} mono />
          <Row label="Email" value={
            <span className="truncate block max-w-[180px]">{formData.email || '—'}</span>
          } />
          <Row label="Adresse" value={`${formData.address || '—'}${formData.city ? `, ${formData.city}` : ''}`} />
        </Card>

        {/* Famille & Fiscal */}
        <Card icon={Heart} title="Famille & Fiscalité">
          <Row label="Situation" value={MARITAL_LABELS[formData.maritalStatus] || formData.maritalStatus} />
          <Row label="Enfants" value={
            <span className="flex items-center gap-1"><Baby size={12} /> {formData.numberOfChildren}</span>
          } />
          <div className="mt-2 space-y-1.5">
            <div className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold ${
              formData.isSubjectToIrpp
                ? 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                : 'bg-gray-50 dark:bg-gray-800 text-gray-400'
            }`}>
              <span>IRPP / ITS</span>
              <span className="flex items-center gap-1">
                {formData.isSubjectToIrpp
                  ? <><Check size={10} /> Soumis</>
                  : '— Exempté'}
              </span>
            </div>
            <div className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold ${
              formData.isSubjectToCnss
                ? 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                : 'bg-gray-50 dark:bg-gray-800 text-gray-400'
            }`}>
              <span>CNSS (4%)</span>
              <span className="flex items-center gap-1">
                {formData.isSubjectToCnss
                  ? <><Check size={10} /> Soumis</>
                  : '— Exempté'}
              </span>
            </div>
            {(!formData.isSubjectToIrpp || !formData.isSubjectToCnss) && formData.taxExemptionReason && (
              <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1.5">
                <AlertCircle size={11} className="flex-shrink-0 mt-0.5" />
                <span>{formData.taxExemptionReason}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Contrat */}
        <Card icon={Briefcase} title="Contrat">
          <Row label="Embauche" value={
            formData.hireDate ? format(new Date(formData.hireDate), 'd MMM yyyy', { locale: fr }) : '—'
          } />
          <Row label="Type" value={formData.contractType} />

          {needsEndDate && formData.contractEndDate && (
            <>
              <Row label="Fin de contrat" value={
                <span className="text-amber-600 dark:text-amber-400">
                  {format(new Date(formData.contractEndDate), 'd MMM yyyy', { locale: fr })}
                </span>
              } />
              {contractDuration !== null && (
                <Row label="Durée" value={
                  contractDuration < 30
                    ? `${contractDuration} jours`
                    : `${Math.floor(contractDuration / 30)} mois${contractDuration % 30 > 0 ? ` ${contractDuration % 30}j` : ''}`
                } />
              )}
              <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse flex-shrink-0" />
                <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Alertes expiration actives</span>
              </div>
            </>
          )}

          {formData.contractType === 'CDI' && (
            <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <Check size={11} className="text-emerald-500 flex-shrink-0" />
              <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Durée indéterminée</span>
            </div>
          )}

          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-700">
            <span className="text-xs text-gray-400">Salaire brut</span>
            <span className="font-mono font-bold text-base text-gray-900 dark:text-white">
              {parseFloat(formData.baseSalary || '0').toLocaleString('fr-FR')} FCFA
            </span>
          </div>
        </Card>

        {/* Paiement */}
        <Card icon={Wallet} title="Paiement">
          <Row label="Canal" value={PAYMENT_LABELS[formData.paymentMethod] || formData.paymentMethod} />
          {formData.paymentMethod === 'BANK_TRANSFER' && formData.bankName && (
            <>
              <Row label="Banque" value={formData.bankName} />
              {formData.bankAccountNumber && (
                <Row label="RIB" value={`${formData.bankAccountNumber.substring(0, 10)}…`} mono />
              )}
            </>
          )}
          {formData.paymentMethod === 'MOBILE_MONEY' && formData.mobileMoneyOperator && (
            <>
              <Row label="Opérateur" value={formData.mobileMoneyOperator} />
              {formData.mobileMoneyNumber && (
                <Row label="Numéro" value={formData.mobileMoneyNumber} mono />
              )}
            </>
          )}
          {formData.paymentMethod === 'CASH' && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Paiement en espèces</p>
          )}
        </Card>

      </div>

      {/* ── Accès système ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-5 bg-white dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-700/50"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <ShieldCheck size={13} className="text-gray-400 dark:text-gray-500" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500">
            Accès au système
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Email de connexion</p>
            <p className="font-mono text-sm font-bold text-gray-900 dark:text-white break-all">{formData.email}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Rôle initial</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">Employé</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Modifiable depuis la gestion des utilisateurs</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
          <Check size={13} className="text-gray-500 flex-shrink-0" />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Un compte sera créé automatiquement. Le mot de passe provisoire s'affichera après confirmation.
          </p>
        </div>
      </motion.div>

      {/* ── CTA message ────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center py-4"
      >
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Vérifiez les informations ci-dessus, puis cliquez sur{' '}
          <span className="font-bold text-gray-700 dark:text-gray-300">Créer l'employé</span> pour finaliser.
        </p>
        <div className="flex items-center justify-center gap-2 mt-2 text-xs text-gray-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Création instantanée · accès généré automatiquement
        </div>
      </motion.div>
    </div>
  );
};