import React from 'react';
import { Heart, Baby, ShieldCheck, AlertCircle, Check } from 'lucide-react';
import { FancySelect } from '@/components/ui/FancySelect';
import { motion, AnimatePresence } from 'framer-motion';

interface Step2FamilyProps {
  formData: any;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (name: string, value: any) => void;
}

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

export const Step2Family: React.FC<Step2FamilyProps> = ({
  formData,
  onInputChange,
  onSelectChange,
}) => {
  return (
    <div className="space-y-6">

      {/* Step title */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
          Situation familiale & Fiscalité
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Ces informations servent au calcul de l'IRPP (quotient familial)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ── Famille ──────────────────────────────────────────────────────── */}
        <div className="p-5 bg-white dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-700/50 space-y-5">
          <SectionLabel icon={Heart} label="Famille" />

          <FancySelect
            label="Situation familiale"
            value={formData.maritalStatus}
            onChange={(v) => onSelectChange('maritalStatus', v)}
            icon={Heart}
            options={[
              { value: 'SINGLE',   label: 'Célibataire' },
              { value: 'MARRIED',  label: 'Marié(e)' },
              { value: 'DIVORCED', label: 'Divorcé(e)' },
              { value: 'WIDOWED',  label: 'Veuf/Veuve' },
            ]}
          />

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Baby size={12} /> Nombre d'enfants
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              name="numberOfChildren"
              value={formData.numberOfChildren}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                onSelectChange('numberOfChildren', val === '' ? '0' : val);
              }}
              className="w-full px-3.5 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-center font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all"
            />
            <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed">
              Impacte le calcul de l'IRPP via le quotient familial. Plus le nombre d'enfants est élevé, plus l'impôt est réduit.
            </p>
          </div>
        </div>

        {/* ── Régime fiscal ─────────────────────────────────────────────────── */}
        <div className="p-5 bg-white dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-700/50 space-y-4">
          <SectionLabel icon={ShieldCheck} label="Régime fiscal" />

          {/* IRPP checkbox */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative mt-0.5 flex-shrink-0">
              <input
                type="checkbox"
                checked={formData.isSubjectToIrpp}
                onChange={(e) => onSelectChange('isSubjectToIrpp', e.target.checked)}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                formData.isSubjectToIrpp
                  ? 'bg-gray-900 dark:bg-white border-gray-900 dark:border-white'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
              }`}>
                {formData.isSubjectToIrpp && (
                  <Check size={11} strokeWidth={3} className="text-white dark:text-gray-900" />
                )}
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Soumis à l'IRPP / ITS</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Retenue impôt sur le revenu (barème progressif)</p>
            </div>
          </label>

          {/* CNSS checkbox */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative mt-0.5 flex-shrink-0">
              <input
                type="checkbox"
                checked={formData.isSubjectToCnss}
                onChange={(e) => onSelectChange('isSubjectToCnss', e.target.checked)}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                formData.isSubjectToCnss
                  ? 'bg-gray-900 dark:bg-white border-gray-900 dark:border-white'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
              }`}>
                {formData.isSubjectToCnss && (
                  <Check size={11} strokeWidth={3} className="text-white dark:text-gray-900" />
                )}
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Soumis à la CNSS salariale (4%)</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Cotisation sociale employé</p>
            </div>
          </label>

          {/* Séparateur */}
          <div className="border-t border-gray-100 dark:border-gray-700 pt-3">

            {/* Raison exemption */}
            <AnimatePresence>
              {(!formData.isSubjectToIrpp || !formData.isSubjectToCnss) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <AlertCircle size={11} /> Raison de l'exemption
                  </label>
                  <select
                    value={formData.taxExemptionReason || ''}
                    onChange={(e) => onSelectChange('taxExemptionReason', e.target.value)}
                    className="w-full px-3.5 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all"
                  >
                    <option value="">Sélectionner une raison…</option>
                    <option value="Stagiaire académique non rémunéré">Stagiaire académique non rémunéré</option>
                    <option value="Consultant externe - Auto-entrepreneur">Consultant externe · Auto-entrepreneur</option>
                    <option value="Expatrié sous convention fiscale">Expatrié sous convention fiscale</option>
                    <option value="Bénévolat / Mission humanitaire">Bénévolat / Mission humanitaire</option>
                    <option value="Employé en période d'essai non rémunérée">Période d'essai non rémunérée</option>
                    <option value="Autre raison légale">Autre raison légale</option>
                  </select>
                  {formData.taxExemptionReason && (
                    <p className="text-[11px] text-gray-400 flex items-center gap-1">
                      <AlertCircle size={10} /> Visible sur le bulletin de paie
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Régime standard */}
            {formData.isSubjectToIrpp && formData.isSubjectToCnss && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <Check size={13} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Régime standard : IRPP/ITS + CNSS salariale
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};