import React, { useState } from 'react';
import { 
  Building2, Wallet, Smartphone, Briefcase, Calendar, DollarSign, CreditCard,
  AlertCircle, Plus, X, Loader2, Save, Network 
} from 'lucide-react';
import { FancySelect } from '@/components/ui/FancySelect';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';
import { useAlert } from '@/components/providers/AlertProvider';

interface Step3ContractProps {
  formData: any;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (name: string, value: string) => void;
  departments: any[];
  onDepartmentCreated: (newDept: any) => void;
}

export const Step3Contract: React.FC<Step3ContractProps> = ({
  formData,
  onInputChange,
  onSelectChange,
  departments,
  onDepartmentCreated,
}) => {
  const alert = useAlert();
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptFormData, setDeptFormData] = useState({ name: '', code: '' });
  const [isCreatingDept, setIsCreatingDept] = useState(false);

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingDept(true);
    
    try {
      const newDept = await api.post('/departments', deptFormData);
      
      alert.success(
        '✨ Département créé',
        `${deptFormData.name} a été ajouté avec succès.`
      );
      
      // Réinitialiser et fermer
      setShowDeptModal(false);
      setDeptFormData({ name: '', code: '' });
      
      // Notifier la page parente
      onDepartmentCreated(newDept);
      
    } catch (e: any) {
      alert.error(
        'Erreur de création',
        e.message || 'Impossible de créer le département.'
      );
    } finally {
      setIsCreatingDept(false);
    }
  };

  return (
    <>
      <div className="space-y-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-cyan-100 dark:bg-cyan-900/30 rounded-full mb-4">
            <Briefcase size={40} className="text-cyan-500" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Contrat & Rémunération
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Définissons les conditions d'emploi
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* POSTE & AFFECTATION */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider mb-4 flex items-center gap-2">
              <Building2 size={16} className="text-cyan-500" /> Poste & Affectation
            </h3>

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
                <div className="mt-3 p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border-2 border-amber-200 dark:border-amber-800 rounded-xl">
                  <p className="text-sm text-amber-800 dark:text-amber-200 mb-3 flex items-center gap-2 font-medium">
                    <AlertCircle size={16} /> 
                    Aucun département disponible
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowDeptModal(true)}
                    className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-600 hover:to-sky-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                  >
                    <Plus size={18} />
                    Créer le premier département
                  </button>
                </div>
              ) : (
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {departments.length} département{departments.length > 1 ? 's' : ''} disponible{departments.length > 1 ? 's' : ''}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowDeptModal(true)}
                    className="text-sm text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Plus size={14} />
                    Créer département
                  </button>
                </div>
              )}
            </div>

            {/* Poste */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Intitulé du Poste <span className="text-red-500">*</span>
              </label>
              <input
                name="position"
                value={formData.position}
                onChange={onInputChange}
                placeholder="Comptable, Développeur, Manager..."
                className="w-full px-4 py-4 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all"
              />
            </div>

            {/* Date d'embauche */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <Calendar size={16} className="text-sky-500" />
                Date d'embauche <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="hireDate"
                value={formData.hireDate}
                onChange={onInputChange}
                className="w-full px-4 py-4 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all"
              />
            </div>

            {/* Type de contrat */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                Type de Contrat <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {['CDI', 'CDD', 'STAGE', 'CONSULTANT'].map((type) => (
                  <motion.div
                    key={type}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelectChange('contractType', type)}
                    className={`cursor-pointer p-4 rounded-xl border-2 text-center text-sm font-bold transition-all ${
                      formData.contractType === type
                        ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 shadow-lg shadow-cyan-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-cyan-300 dark:hover:border-cyan-500 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {type}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Salaire */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <DollarSign size={16} className="text-cyan-500" />
                Salaire de Base Mensuel <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="baseSalary"
                  value={formData.baseSalary}
                  onChange={onInputChange}
                  placeholder="0"
                  className="w-full px-4 py-4 pr-20 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none font-bold text-2xl transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">
                  FCFA
                </span>
              </div>
              {formData.baseSalary && parseFloat(formData.baseSalary) > 0 && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-cyan-600 dark:text-cyan-400 mt-2 font-medium"
                >
                  ≈ {(parseFloat(formData.baseSalary) / 26).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA par jour ouvré
                </motion.p>
              )}
            </div>
          </div>

          {/* MODE DE PAIEMENT */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider mb-4 flex items-center gap-2">
              <Wallet size={16} className="text-sky-500" /> Mode de Paiement
            </h3>

            {/* Canal de versement */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                Canal de versement
              </label>
              <div className="grid grid-cols-3 gap-3">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSelectChange('paymentMethod', 'MOBILE_MONEY')}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    formData.paymentMethod === 'MOBILE_MONEY'
                      ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 shadow-lg'
                      : 'border-slate-200 dark:border-slate-700 hover:border-cyan-300'
                  }`}
                >
                  <Smartphone className="mx-auto mb-1" size={20} />
                  <div className="text-xs font-bold">Mobile</div>
                </motion.button>
                
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSelectChange('paymentMethod', 'BANK_TRANSFER')}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    formData.paymentMethod === 'BANK_TRANSFER'
                      ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 shadow-lg'
                      : 'border-slate-200 dark:border-slate-700 hover:border-cyan-300'
                  }`}
                >
                  <Building2 className="mx-auto mb-1" size={20} />
                  <div className="text-xs font-bold">Banque</div>
                </motion.button>
                
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSelectChange('paymentMethod', 'CASH')}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    formData.paymentMethod === 'CASH'
                      ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 shadow-lg'
                      : 'border-slate-200 dark:border-slate-700 hover:border-cyan-300'
                  }`}
                >
                  <CreditCard className="mx-auto mb-1" size={20} />
                  <div className="text-xs font-bold">Espèces</div>
                </motion.button>
              </div>
            </div>

            {/* Virement Bancaire */}
            <AnimatePresence>
              {formData.paymentMethod === 'BANK_TRANSFER' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="glass-card p-6 rounded-2xl border-2 border-cyan-200 dark:border-cyan-800 space-y-4"
                >
                  <div>
                    <FancySelect
                      label="Banque"
                      value={formData.bankName}
                      onChange={(v) => onSelectChange('bankName', v)}
                      icon={Building2}
                      options={[
                        { value: 'BGFI', label: 'BGFI Bank' },
                        { value: 'ECOBANK', label: 'Ecobank' },
                        { value: 'LCB', label: 'LCB Bank' },
                        { value: 'UBA', label: 'UBA' },
                        { value: 'SOCIETE_GENERALE', label: 'Société Générale' },
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                      Numéro de Compte (RIB)
                    </label>
                    <input
                      name="bankAccountNumber"
                      value={formData.bankAccountNumber}
                      onChange={onInputChange}
                      placeholder="XXXXXXXXXXXXXXXXXXXXXXXX"
                      className="w-full p-3 border-2 border-cyan-300 dark:border-cyan-700 dark:bg-slate-800 rounded-xl font-mono focus:ring-2 focus:ring-cyan-500/20 outline-none"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mobile Money */}
            <AnimatePresence>
              {formData.paymentMethod === 'MOBILE_MONEY' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="glass-card p-6 rounded-2xl border-2 border-cyan-200 dark:border-cyan-800 space-y-4"
                >
                  <div>
                    <FancySelect
                      label="Opérateur"
                      value={formData.mobileMoneyOperator}
                      onChange={(v) => onSelectChange('mobileMoneyOperator', v)}
                      icon={Smartphone}
                      options={[
                        { value: 'MTN', label: 'MTN Mobile Money' },
                        { value: 'AIRTEL', label: 'Airtel Money' },
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                      Numéro de téléphone
                    </label>
                    <input
                      name="mobileMoneyNumber"
                      value={formData.mobileMoneyNumber}
                      onChange={onInputChange}
                      placeholder="06 123 45 67"
                      className="w-full p-3 border-2 border-cyan-300 dark:border-cyan-700 dark:bg-slate-800 rounded-xl font-mono focus:ring-2 focus:ring-cyan-500/20 outline-none"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Message si espèces */}
            <AnimatePresence>
              {formData.paymentMethod === 'CASH' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="glass-card p-6 rounded-2xl"
                >
                  <p className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-3">
                    <CreditCard className="text-cyan-500 mt-0.5" size={20} />
                    <span>
                      <strong className="text-slate-900 dark:text-white">Paiement en espèces</strong><br/>
                      L'employé recevra sa rémunération en liquide. Pensez à faire signer un reçu de paiement.
                    </span>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* MODAL CRÉATION DÉPARTEMENT */}
      <AnimatePresence>
        {showDeptModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xl p-4"
            onClick={() => setShowDeptModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => setShowDeptModal(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-full flex items-center justify-center">
                  <Network size={24} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Nouveau Département
                </h2>
              </div>

              <form onSubmit={handleCreateDepartment} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Nom du département
                  </label>
                  <input
                    required
                    autoFocus
                    placeholder="Ex: Marketing, IT, Finance..."
                    value={deptFormData.name}
                    onChange={(e) =>
                      setDeptFormData({ ...deptFormData, name: e.target.value })
                    }
                    className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-cyan-500/50 outline-none text-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Code (Optionnel)
                  </label>
                  <input
                    placeholder="Ex: MKT, IT, FIN..."
                    value={deptFormData.code}
                    onChange={(e) =>
                      setDeptFormData({
                        ...deptFormData,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-cyan-500/50 outline-none font-mono tracking-wider"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowDeptModal(false)}
                    className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingDept}
                    className="flex-1 py-4 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-600 hover:to-sky-600 text-white font-bold rounded-xl shadow-lg transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingDept ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <Save size={20} />
                    )}
                    Créer
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};


// import React from 'react';
// import { User, Check } from 'lucide-react';

// interface Step3ValidationProps {
//   formData: any;
//   departments: any[];
//   imagePreview: string | null;
// }

// export const Step3Validation: React.FC<Step3ValidationProps> = ({
//   formData,
//   departments,
//   imagePreview,
// }) => {
//   return (
//     <div className="flex flex-col items-center justify-center space-y-8 py-10">
//       {/* Photo de profil */}
//       <div className="relative">
//         <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-gray-700 shadow-xl mx-auto bg-gray-100 flex items-center justify-center">
//           {imagePreview ? (
//             <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
//           ) : (
//             <User size={64} className="text-gray-300" />
//           )}
//         </div>
//         <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-full border-4 border-white dark:border-gray-800">
//           <Check size={20} strokeWidth={3} />
//         </div>
//       </div>

//       {/* Nom et badges */}
//       <div className="text-center">
//         <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
//           {formData.firstName} {formData.lastName}
//         </h2>
//         <div className="flex items-center justify-center gap-3">
//           <span className="px-3 py-1 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 rounded-lg font-bold text-sm">
//             {formData.position || 'Poste non défini'}
//           </span>
//           <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg font-bold text-sm">
//             {formData.contractType}
//           </span>
//         </div>
//       </div>

//       {/* Récapitulatif */}
//       <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-200 dark:border-white/5 w-full max-w-lg">
//         <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200 dark:border-white/5">
//           <span className="text-gray-500">Département</span>
//           <span className="font-bold">
//             {departments.find((d) => d.id === formData.departmentId)?.name || '-'}
//           </span>
//         </div>
//         <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200 dark:border-white/5">
//           <span className="text-gray-500">Salaire</span>
//           <span className="font-bold font-mono">
//             {parseFloat(formData.baseSalary || '0').toLocaleString()} FCFA
//           </span>
//         </div>
//         <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200 dark:border-white/5">
//           <span className="text-gray-500">Situation familiale</span>
//           <span className="font-bold">
//             {formData.maritalStatus} - {formData.numberOfChildren} enfant(s)
//           </span>
//         </div>
//         <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200 dark:border-white/5">
//           <span className="text-gray-500">CNI</span>
//           <span className="font-bold font-mono">
//             {formData.nationalIdNumber || 'Non renseigné'}
//           </span>
//         </div>
//         <div className="flex justify-between items-center">
//           <span className="text-gray-500">CNSS</span>
//           <span className="font-bold font-mono">
//             {formData.cnssNumber || 'Non renseigné'}
//           </span>
//         </div>
//       </div>
//     </div>
//   );
// };