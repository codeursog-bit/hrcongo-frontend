// ============================================================================
// 📁 components/employees/create/Step4Validation.tsx
// Anciennement Step5Validation — renommé car on passe de 5 à 4 étapes
// AUCUN changement de code, juste le nom du composant exporté
// ============================================================================

import React from 'react';
import { User, Check, Briefcase, Heart, ShieldCheck, MapPin, Phone, Mail, Calendar, Building2, Wallet, Baby, AlertCircle, CalendarDays } from 'lucide-react';
import { motion } from 'framer-motion';
import { differenceInDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Step4ValidationProps {
  formData: any;
  departments: any[];
  imagePreview: string | null;
}

const REQUIRES_END_DATE = ['CDD', 'STAGE', 'INTERIM', 'CONSULTANT'];

export const Step4Validation: React.FC<Step4ValidationProps> = ({
  formData,
  departments,
  imagePreview,
}) => {
  const department = departments.find((d) => d.id === formData.departmentId);
  const needsEndDate = REQUIRES_END_DATE.includes(formData.contractType);

  // Calcul durée contrat si date de fin présente
  const contractDuration = needsEndDate && formData.hireDate && formData.contractEndDate
    ? differenceInDays(new Date(formData.contractEndDate), new Date(formData.hireDate))
    : null;

  return (
    <div className="space-y-8">
      {/* HEADER — identique à Step5Validation original */}
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

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">

        {/* IDENTITÉ */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-700">
            <User size={18} className="text-cyan-500" /> Identité
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2"><Calendar size={14} /> Né(e) le</span>
              <span className="font-bold text-slate-900 dark:text-white">{new Date(formData.dateOfBirth).toLocaleDateString('fr-FR')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2"><MapPin size={14} /> Lieu</span>
              <span className="font-bold text-slate-900 dark:text-white">{formData.placeOfBirth}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2"><Phone size={14} /> Téléphone</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{formData.phone}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2"><Mail size={14} /> Email</span>
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
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2"><Baby size={14} /> Enfants</span>
              <span className="font-bold text-slate-900 dark:text-white">{formData.numberOfChildren}</span>
            </div>
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
              <div className={`flex items-center justify-between p-2 rounded-lg ${formData.isSubjectToIrpp ? 'bg-cyan-50 dark:bg-cyan-900/20' : 'bg-slate-50 dark:bg-slate-750'}`}>
                <span className="text-xs font-bold text-slate-900 dark:text-white">IRPP/ITS</span>
                {formData.isSubjectToIrpp
                  ? <span className="text-cyan-600 dark:text-cyan-400 font-bold text-xs">✓ Soumis</span>
                  : <span className="text-slate-400 font-bold text-xs">✗ Exempté</span>}
              </div>
              <div className={`flex items-center justify-between p-2 rounded-lg ${formData.isSubjectToCnss ? 'bg-cyan-50 dark:bg-cyan-900/20' : 'bg-slate-50 dark:bg-slate-750'}`}>
                <span className="text-xs font-bold text-slate-900 dark:text-white">CNSS (4%)</span>
                {formData.isSubjectToCnss
                  ? <span className="text-cyan-600 dark:text-cyan-400 font-bold text-xs">✓ Soumis</span>
                  : <span className="text-slate-400 font-bold text-xs">✗ Exempté</span>}
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

        {/* CONTRAT — 🆕 affiche contractEndDate si présent */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-700">
            <Briefcase size={18} className="text-cyan-500" /> Contrat
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Embauche</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {format(new Date(formData.hireDate), 'd MMM yyyy', { locale: fr })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Type</span>
              <span className="font-bold text-slate-900 dark:text-white">{formData.contractType}</span>
            </div>

            {/* Date de fin + durée si contrat temporaire */}
            {needsEndDate && formData.contractEndDate && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <CalendarDays size={13} /> Fin contrat
                  </span>
                  <span className="font-bold text-orange-600 dark:text-orange-400">
                    {format(new Date(formData.contractEndDate), 'd MMM yyyy', { locale: fr })}
                  </span>
                </div>
                {contractDuration !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Durée totale</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {contractDuration < 30
                        ? `${contractDuration} jours`
                        : `${Math.floor(contractDuration / 30)} mois${contractDuration % 30 > 0 ? ` ${contractDuration % 30}j` : ''}`}
                    </span>
                  </div>
                )}
                {/* Badge alertes actives */}
                <div className="flex items-center gap-2 p-2 bg-sky-50 dark:bg-sky-900/20 rounded-lg">
                  <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                  <span className="text-xs text-sky-700 dark:text-sky-300 font-semibold">Alertes expiration automatiques activées</span>
                </div>
              </>
            )}

            {/* CDI — pas de date de fin */}
            {formData.contractType === 'CDI' && (
              <div className="flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <Check size={13} className="text-emerald-500" />
                <span className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">CDI — durée indéterminée</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400">Salaire brut</span>
              <span className="font-mono font-bold text-lg text-cyan-600 dark:text-cyan-400">
                {parseFloat(formData.baseSalary || '0').toLocaleString('fr-FR')} FCFA
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

        {/* ACCÈS AUTOMATIQUE — remplace l'ancien bloc createUserAccount */}
        <div className="md:col-span-2 glass-card p-6 rounded-2xl border-2 border-cyan-200 dark:border-cyan-800 space-y-4">
          <h3 className="font-bold text-cyan-700 dark:text-cyan-300 flex items-center gap-2 pb-3 border-b border-cyan-200 dark:border-cyan-700">
            <ShieldCheck size={18} /> Accès au Système
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-cyan-700 dark:text-cyan-400 text-xs font-bold block mb-1">Email de connexion</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{formData.email}</span>
            </div>
            <div>
              <span className="text-cyan-700 dark:text-cyan-400 text-xs font-bold block mb-1">Rôle initial</span>
              <span className="font-bold text-slate-900 dark:text-white">Employé — modifiable depuis la gestion des utilisateurs</span>
            </div>
          </div>
          <div className="p-4 bg-cyan-100 dark:bg-cyan-900/20 border border-cyan-300 dark:border-cyan-700 rounded-xl">
            <p className="text-sm text-cyan-800 dark:text-cyan-300 flex items-center gap-2">
              <Check size={16} />
              Un compte sera créé automatiquement. Le mot de passe généré s'affichera après confirmation.
            </p>
          </div>
        </div>

      </div>

      {/* CALL TO ACTION */}
      <div className="max-w-2xl mx-auto text-center p-8 glass-card rounded-2xl border-2 border-cyan-200 dark:border-cyan-800">
        <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Tout est prêt !</h4>
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          Vérifiez les informations ci-dessus et cliquez sur "Créer l'employé" pour finaliser.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
          Création instantanée — accès généré automatiquement
        </div>
      </div>
    </div>
  );
};