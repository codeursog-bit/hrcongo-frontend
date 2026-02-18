import React from 'react';
import { Heart, Baby, ShieldCheck, AlertCircle, Check } from 'lucide-react';
import { FancySelect } from '@/components/ui/FancySelect';
import { motion, AnimatePresence } from 'framer-motion';

interface Step2FamilyProps {
  formData: any;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (name: string, value: any) => void;
}

export const Step2Family: React.FC<Step2FamilyProps> = ({
  formData,
  onInputChange,
  onSelectChange,
}) => {
  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Situation Familiale & Fiscalité
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Ces informations servent au calcul de l'IRPP (quotient familial)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* SITUATION FAMILIALE */}
        <div className="space-y-6">
          <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider mb-4 flex items-center gap-2">
            <Heart size={16} className="text-sky-500" /> Famille
          </h3>

          <div>
            <FancySelect
              label="Situation Familiale"
              value={formData.maritalStatus}
              onChange={(v) => onSelectChange('maritalStatus', v)}
              icon={Heart}
              options={[
                { value: 'SINGLE', label: 'Célibataire' },
                { value: 'MARRIED', label: 'Marié(e)' },
                { value: 'DIVORCED', label: 'Divorcé(e)' },
                { value: 'WIDOWED', label: 'Veuf/Veuve' },
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              <div className="flex items-center gap-2">
                <Baby size={16} className="text-cyan-500" />
                Nombre d'enfants <span className="text-red-500">*</span>
              </div>
              <span className="text-xs text-slate-400 font-normal">
                (impacte le calcul de l'IRPP via le quotient familial)
              </span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="20"
                name="numberOfChildren"
                value={formData.numberOfChildren}
                onChange={onInputChange}
                placeholder="0"
                className="w-full px-4 py-4 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none text-2xl font-bold text-center transition-all"
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 glass-card p-3 rounded-lg">
              <strong>Info :</strong> Plus le nombre d'enfants est élevé, plus le quotient familial augmente, réduisant ainsi le montant de l'IRPP.
            </p>
          </div>
        </div>

        {/* RÉGIME FISCAL */}
        <div className="space-y-6">
          <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider mb-4 flex items-center gap-2">
            <ShieldCheck size={16} className="text-cyan-500" /> Régime Fiscal
          </h3>

          <div className="glass-card p-5 rounded-2xl space-y-4">
            
            {/* IRPP */}
            <label className="flex items-start gap-3 cursor-pointer p-4 bg-white/70 dark:bg-slate-900/50 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-cyan-400 dark:hover:border-cyan-500 transition-all group">
              <input 
                type="checkbox"
                checked={formData.isSubjectToIrpp}
                onChange={(e) => onSelectChange('isSubjectToIrpp', e.target.checked)}
                className="w-6 h-6 mt-0.5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 focus:ring-offset-0"
              />
              <div className="flex-1">
                <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors block mb-1">
                  Soumis à l'IRPP/ITS
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Retenue de l'impôt sur le revenu (barème progressif)
                </p>
              </div>
            </label>

            {/* CNSS */}
            <label className="flex items-start gap-3 cursor-pointer p-4 bg-white/70 dark:bg-slate-900/50 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-cyan-400 dark:hover:border-cyan-500 transition-all group">
              <input 
                type="checkbox"
                checked={formData.isSubjectToCnss}
                onChange={(e) => onSelectChange('isSubjectToCnss', e.target.checked)}
                className="w-6 h-6 mt-0.5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 focus:ring-offset-0"
              />
              <div className="flex-1">
                <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors block mb-1">
                  Soumis à la CNSS salariale (4%)
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Cotisation sociale employé
                </p>
              </div>
            </label>

            {/* RAISON D'EXEMPTION */}
            <AnimatePresence>
              {(!formData.isSubjectToIrpp || !formData.isSubjectToCnss) && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 bg-slate-100 dark:bg-slate-900/30 border-2 border-slate-300 dark:border-slate-700 rounded-xl"
                >
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2 flex items-center gap-2">
                    <AlertCircle size={14} /> Raison de l'exemption fiscale
                  </label>
                  <select 
                    value={formData.taxExemptionReason || ''}
                    onChange={(e) => onSelectChange('taxExemptionReason', e.target.value)}
                    className="w-full p-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                  >
                    <option value="">Sélectionner une raison...</option>
                    <option value="Stagiaire académique non rémunéré">Stagiaire académique non rémunéré</option>
                    <option value="Consultant externe - Auto-entrepreneur">Consultant externe - Auto-entrepreneur</option>
                    <option value="Expatrié sous convention fiscale">Expatrié sous convention fiscale</option>
                    <option value="Bénévolat / Mission humanitaire">Bénévolat / Mission humanitaire</option>
                    <option value="Employé en période d'essai non rémunérée">Période d'essai non rémunérée</option>
                    <option value="Autre raison légale">Autre raison légale</option>
                  </select>
                  
                  {formData.taxExemptionReason && (
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-slate-600 dark:text-slate-400 mt-2 flex items-center gap-1"
                    >
                      <AlertCircle size={12} />
                      Cette exemption sera visible sur le bulletin de paie
                    </motion.p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* INFO PAR DÉFAUT */}
            {formData.isSubjectToIrpp && formData.isSubjectToCnss && (
              <div className="p-3 bg-cyan-50 dark:bg-cyan-900/10 border-2 border-cyan-200 dark:border-cyan-800 rounded-lg">
                <p className="text-xs text-cyan-700 dark:text-cyan-400 flex items-center gap-2 font-medium">
                  <Check size={14} className="text-cyan-600" />
                  Régime fiscal standard : IRPP/ITS + CNSS salariale
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

