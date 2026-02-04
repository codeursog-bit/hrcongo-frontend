import React from 'react';
import { User, Check, Briefcase, Heart, ShieldCheck, MapPin, Phone, Mail, Calendar, Building2, Wallet, Baby, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface Step5ValidationProps {
  formData: any;
  departments: any[];
  imagePreview: string | null;
}

export const Step5Validation: React.FC<Step5ValidationProps> = ({
  formData,
  departments,
  imagePreview,
}) => {
  const department = departments.find((d) => d.id === formData.departmentId);

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-cyan-400 to-sky-500 rounded-full mb-6 relative"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 to-sky-500 opacity-20 animate-ping"></div>
          {imagePreview ? (
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-full border-4 border-white dark:border-slate-800" />
          ) : (
            <User size={48} className="text-white" />
          )}
          <div className="absolute -bottom-2 -right-2 bg-cyan-500 text-white p-2.5 rounded-full border-4 border-white dark:border-slate-800 shadow-lg">
            <Check size={24} strokeWidth={3} />
          </div>
        </motion.div>

        <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-3">
          {formData.firstName} {formData.lastName}
        </h2>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <span className="px-4 py-2 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-xl font-bold text-sm">
            {formData.position || 'Poste non défini'}
          </span>
          <span className="px-4 py-2 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 rounded-xl font-bold text-sm">
            {formData.contractType}
          </span>
          {department && (
            <span className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm flex items-center gap-1">
              <Building2 size={14} /> {department.name}
            </span>
          )}
        </div>
      </div>

      {/* GRID DE VALIDATION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        
        {/* IDENTITÉ */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-700">
            <User size={18} className="text-cyan-500" /> Identité
          </h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Calendar size={14} /> Né(e) le
              </span>
              <span className="font-bold text-slate-900 dark:text-white">{new Date(formData.dateOfBirth).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <MapPin size={14} /> Lieu
              </span>
              <span className="font-bold text-slate-900 dark:text-white">{formData.placeOfBirth}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Phone size={14} /> Téléphone
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{formData.phone}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Mail size={14} /> Email
              </span>
              <span className="font-mono text-xs font-bold truncate max-w-[200px] text-slate-900 dark:text-white">{formData.email}</span>
            </div>
          </div>
        </div>

        {/* FAMILLE & FISCAL */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-700">
            <Heart size={18} className="text-sky-500" /> Famille & Fiscalité
          </h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Situation</span>
              <span className="font-bold text-slate-900 dark:text-white">{formData.maritalStatus}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Baby size={14} /> Enfants
              </span>
              <span className="font-bold text-slate-900 dark:text-white">{formData.numberOfChildren}</span>
            </div>
            
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
              <div className={`flex items-center justify-between p-2 rounded-lg ${formData.isSubjectToIrpp ? 'bg-cyan-50 dark:bg-cyan-900/20' : 'bg-slate-50 dark:bg-slate-750'}`}>
                <span className="text-xs font-bold text-slate-900 dark:text-white">IRPP/ITS</span>
                {formData.isSubjectToIrpp ? (
                  <span className="text-cyan-600 dark:text-cyan-400 font-bold text-xs">✓ Soumis</span>
                ) : (
                  <span className="text-slate-400 font-bold text-xs">✗ Exempté</span>
                )}
              </div>
              <div className={`flex items-center justify-between p-2 rounded-lg ${formData.isSubjectToCnss ? 'bg-cyan-50 dark:bg-cyan-900/20' : 'bg-slate-50 dark:bg-slate-750'}`}>
                <span className="text-xs font-bold text-slate-900 dark:text-white">CNSS (4%)</span>
                {formData.isSubjectToCnss ? (
                  <span className="text-cyan-600 dark:text-cyan-400 font-bold text-xs">✓ Soumis</span>
                ) : (
                  <span className="text-slate-400 font-bold text-xs">✗ Exempté</span>
                )}
              </div>
              
              {(!formData.isSubjectToIrpp || !formData.isSubjectToCnss) && formData.taxExemptionReason && (
                <div className="p-3 glass-card border border-slate-200 dark:border-slate-700 rounded-lg">
                  <p className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                    <span><strong>Raison :</strong> {formData.taxExemptionReason}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CONTRAT */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-700">
            <Briefcase size={18} className="text-cyan-500" /> Contrat
          </h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Embauche</span>
              <span className="font-bold text-slate-900 dark:text-white">{new Date(formData.hireDate).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Type</span>
              <span className="font-bold text-slate-900 dark:text-white">{formData.contractType}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Salaire brut</span>
              <span className="font-mono font-bold text-lg text-cyan-600 dark:text-cyan-400">
                {parseFloat(formData.baseSalary || '0').toLocaleString()} FCFA
              </span>
            </div>
          </div>
        </div>

        {/* PAIEMENT */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-700">
            <Wallet size={18} className="text-sky-500" /> Mode de Paiement
          </h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Canal</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {formData.paymentMethod === 'BANK_TRANSFER' && 'Virement bancaire'}
                {formData.paymentMethod === 'MOBILE_MONEY' && 'Mobile Money'}
                {formData.paymentMethod === 'CASH' && 'Espèces'}
              </span>
            </div>
            
            {formData.paymentMethod === 'BANK_TRANSFER' && formData.bankName && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Banque</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formData.bankName}</span>
                </div>
                {formData.bankAccountNumber && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">RIB</span>
                    <span className="font-mono text-xs text-slate-900 dark:text-white">{formData.bankAccountNumber.substring(0, 10)}...</span>
                  </div>
                )}
              </>
            )}

            {formData.paymentMethod === 'MOBILE_MONEY' && formData.mobileMoneyOperator && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Opérateur</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formData.mobileMoneyOperator}</span>
                </div>
                {formData.mobileMoneyNumber && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Numéro</span>
                    <span className="font-mono text-slate-900 dark:text-white">{formData.mobileMoneyNumber}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ACCÈS SYSTÈME */}
        {formData.createUserAccount && (
          <div className="md:col-span-2 glass-card p-6 rounded-2xl border-2 border-cyan-200 dark:border-cyan-800 space-y-4">
            <h3 className="font-bold text-cyan-700 dark:text-cyan-300 flex items-center gap-2 pb-3 border-b border-cyan-200 dark:border-cyan-700">
              <ShieldCheck size={18} /> Accès au Système
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-cyan-700 dark:text-cyan-400 text-xs font-bold block mb-1">Email de connexion</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{formData.email}</span>
              </div>
              <div>
                <span className="text-cyan-700 dark:text-cyan-400 text-xs font-bold block mb-1">Rôle système</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formData.userRole === 'EMPLOYEE' && 'Employé'}
                  {formData.userRole === 'MANAGER' && 'Manager'}
                  {formData.userRole === 'HR_MANAGER' && 'Manager RH'}
                  {formData.userRole === 'ADMIN' && 'Administrateur'}
                </span>
              </div>
              <div>
                <span className="text-cyan-700 dark:text-cyan-400 text-xs font-bold block mb-1">Mot de passe provisoire</span>
                <span className="font-mono text-xs text-slate-500">••••••••••••</span>
              </div>
            </div>

            <div className="p-4 bg-cyan-100 dark:bg-cyan-900/20 border border-cyan-300 dark:border-cyan-700 rounded-xl">
              <p className="text-sm text-cyan-800 dark:text-cyan-300 flex items-center gap-2">
                <Check size={16} />
                Un compte utilisateur sera créé automatiquement. {formData.firstName} recevra un email avec ses identifiants.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* CALL TO ACTION */}
      <div className="max-w-2xl mx-auto text-center p-8 glass-card rounded-2xl border-2 border-cyan-200 dark:border-cyan-800">
        <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Tout est prêt !
        </h4>
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          Vérifiez les informations ci-dessus et cliquez sur "Confirmer Création" pour finaliser le dossier.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
          Création instantanée
        </div>
      </div>
    </div>
  );
};