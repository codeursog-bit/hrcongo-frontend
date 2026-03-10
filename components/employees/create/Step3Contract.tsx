// import React, { useState, useEffect } from 'react';
// import { 
//   Building2, Wallet, Smartphone, Briefcase, Calendar, DollarSign, CreditCard,
//   AlertCircle, Plus, X, Loader2, Save, Network, Sparkles
// } from 'lucide-react';
// import { FancySelect } from '@/components/ui/FancySelect';
// import { motion, AnimatePresence } from 'framer-motion';
// import { api } from '@/services/api';
// import { useAlert } from '@/components/providers/AlertProvider';

// interface Step3ContractProps {
//   formData: any;
//   onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
//   onSelectChange: (name: string, value: string) => void;
//   departments: any[];
//   onDepartmentCreated: (newDept: any) => void;
// }

// // Interface pour les conventions
// interface ConventionCategory {
//   code: string;
//   label: string;
//   minSalary: number;
//   description?: string;
// }

// // ✅ Fix: interface pour typer la réponse company
// interface CompanyData {
//   collectiveAgreement?: string;
//   [key: string]: any;
// }

// export const Step3Contract: React.FC<Step3ContractProps> = ({
//   formData,
//   onInputChange,
//   onSelectChange,
//   departments,
//   onDepartmentCreated,
// }) => {
//   const alert = useAlert();
//   const [showDeptModal, setShowDeptModal] = useState(false);
//   const [deptFormData, setDeptFormData] = useState({ name: '', code: '' });
//   const [isCreatingDept, setIsCreatingDept] = useState(false);

//   // États pour les conventions collectives
//   const [companyConvention, setCompanyConvention] = useState<string | null>(null);
//   const [conventionCategories, setConventionCategories] = useState<ConventionCategory[]>([]);
//   const [isLoadingConvention, setIsLoadingConvention] = useState(true);

//   // Charger la convention de l'entreprise
//   useEffect(() => {
//     const loadCompanyConvention = async () => {
//       try {
//         // ✅ Fix: typage explicite du retour api.get
//         const company = await api.get<CompanyData>('/companies/mine');
        
//         if (company.collectiveAgreement) {
//           setCompanyConvention(company.collectiveAgreement);
          
//           // ✅ Fix: typage du retour categories
//           const categories = await api.get<ConventionCategory[]>(
//             `/conventions/categories/${company.collectiveAgreement}`
//           );
//           setConventionCategories(categories);
//         }
//       } catch (error) {
//         console.error('Erreur chargement convention:', error);
//       } finally {
//         setIsLoadingConvention(false);
//       }
//     };

//     loadCompanyConvention();
//   }, []);

//   // Gérer le changement de catégorie professionnelle
//   const handleCategoryChange = (categoryCode: string) => {
//     onSelectChange('professionalCategory', categoryCode);
    
//     const category = conventionCategories.find(c => c.code === categoryCode);
//     if (category && category.minSalary) {
//       if (!formData.baseSalary || parseFloat(formData.baseSalary) < category.minSalary) {
//         onSelectChange('baseSalary', category.minSalary.toString());
//         alert.info(
//           'Salaire ajusté',
//           `Le salaire minimum pour ${category.label} est ${category.minSalary.toLocaleString()} FCFA`
//         );
//       }
//     }
//   };

//   const handleCreateDepartment = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsCreatingDept(true);
    
//     try {
//       const newDept = await api.post('/departments', deptFormData);
      
//       alert.success(
//         '✨ Département créé',
//         `${deptFormData.name} a été ajouté avec succès.`
//       );
      
//       setShowDeptModal(false);
//       setDeptFormData({ name: '', code: '' });
//       onDepartmentCreated(newDept);
      
//     } catch (e: any) {
//       alert.error(
//         'Erreur de création',
//         e.message || 'Impossible de créer le département.'
//       );
//     } finally {
//       setIsCreatingDept(false);
//     }
//   };

//   return (
//     <>
//       <div className="space-y-8">
//         <div className="text-center mb-8">
//           <div className="inline-flex items-center justify-center w-20 h-20 bg-cyan-100 dark:bg-cyan-900/30 rounded-full mb-4">
//             <Briefcase size={40} className="text-cyan-500" />
//           </div>
//           <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
//             Contrat & Rémunération
//           </h2>
//           <p className="text-slate-600 dark:text-slate-400">
//             Définissons les conditions d'emploi
//           </p>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//           {/* POSTE & AFFECTATION */}
//           <div className="space-y-6">
//             <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider mb-4 flex items-center gap-2">
//               <Building2 size={16} className="text-cyan-500" /> Poste & Affectation
//             </h3>

//             {/* Département */}
//             <div>
//               <FancySelect
//                 label="Département *"
//                 value={formData.departmentId}
//                 onChange={(v) => onSelectChange('departmentId', v)}
//                 icon={Building2}
//                 options={departments.map((d) => ({ value: d.id, label: d.name }))}
//                 placeholder="Choisir un département..."
//               />
              
//               {departments.length === 0 ? (
//                 <div className="mt-3 p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border-2 border-amber-200 dark:border-amber-800 rounded-xl">
//                   <p className="text-sm text-amber-800 dark:text-amber-200 mb-3 flex items-center gap-2 font-medium">
//                     <AlertCircle size={16} /> 
//                     Aucun département disponible
//                   </p>
//                   <button
//                     type="button"
//                     onClick={() => setShowDeptModal(true)}
//                     className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-600 hover:to-sky-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
//                   >
//                     <Plus size={18} />
//                     Créer le premier département
//                   </button>
//                 </div>
//               ) : (
//                 <div className="mt-2 flex items-center justify-between">
//                   <p className="text-xs text-slate-500 dark:text-slate-400">
//                     {departments.length} département{departments.length > 1 ? 's' : ''} disponible{departments.length > 1 ? 's' : ''}
//                   </p>
//                   <button
//                     type="button"
//                     onClick={() => setShowDeptModal(true)}
//                     className="text-sm text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-semibold flex items-center gap-1.5 transition-colors"
//                   >
//                     <Plus size={14} />
//                     Créer département
//                   </button>
//                 </div>
//               )}
//             </div>

//             {/* Poste */}
//             <div>
//               <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
//                 Intitulé du Poste <span className="text-red-500">*</span>
//               </label>
//               <input
//                 name="position"
//                 value={formData.position}
//                 onChange={onInputChange}
//                 placeholder="Comptable, Développeur, Manager..."
//                 className="w-full px-4 py-4 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all"
//               />
//             </div>

//             {/* Catégorie professionnelle (si convention active) */}
//             {companyConvention && !isLoadingConvention && conventionCategories.length > 0 && (
//               <div className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 border-2 border-purple-200 dark:border-purple-700 rounded-xl space-y-4">
//                 <div className="flex items-center gap-2 mb-3">
//                   <Sparkles size={18} className="text-purple-500" />
//                   <h4 className="font-bold text-purple-900 dark:text-purple-100 text-sm">
//                     Convention Collective : {companyConvention}
//                   </h4>
//                 </div>

//                 <div>
//                   <label className="block text-xs font-bold text-purple-700 dark:text-purple-300 uppercase mb-2">
//                     Catégorie Professionnelle & Échelon
//                   </label>
//                   <select
//                     value={formData.professionalCategory || ''}
//                     onChange={(e) => handleCategoryChange(e.target.value)}
//                     className="w-full p-3 bg-white dark:bg-purple-900/20 border-2 border-purple-300 dark:border-purple-600 rounded-xl font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
//                   >
//                     <option value="">Sélectionner une catégorie...</option>
//                     {conventionCategories.map((cat) => (
//                       <option key={cat.code} value={cat.code}>
//                         {cat.label} - {cat.minSalary.toLocaleString()} FCFA min.
//                       </option>
//                     ))}
//                   </select>
                  
//                   {formData.professionalCategory && (
//                     <motion.p
//                       initial={{ opacity: 0, y: -10 }}
//                       animate={{ opacity: 1, y: 0 }}
//                       className="text-xs text-purple-700 dark:text-purple-300 mt-2 flex items-center gap-1"
//                     >
//                       <AlertCircle size={12} />
//                       Salaire minimum conventionnel appliqué automatiquement
//                     </motion.p>
//                   )}
//                 </div>
//               </div>
//             )}

//             {/* Date d'embauche */}
//             <div>
//               <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
//                 <Calendar size={16} className="text-sky-500" />
//                 Date d'embauche <span className="text-red-500">*</span>
//               </label>
//               <input
//                 type="date"
//                 name="hireDate"
//                 value={formData.hireDate}
//                 onChange={onInputChange}
//                 className="w-full px-4 py-4 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all"
//               />
//             </div>

//             {/* Type de contrat */}
//             <div>
//               <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
//                 Type de Contrat <span className="text-red-500">*</span>
//               </label>
//               <div className="grid grid-cols-2 gap-3">
//                 {['CDI', 'CDD', 'STAGE', 'CONSULTANT'].map((type) => (
//                   <motion.div
//                     key={type}
//                     whileHover={{ scale: 1.02 }}
//                     whileTap={{ scale: 0.98 }}
//                     onClick={() => onSelectChange('contractType', type)}
//                     className={`cursor-pointer p-4 rounded-xl border-2 text-center text-sm font-bold transition-all ${
//                       formData.contractType === type
//                         ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 shadow-lg shadow-cyan-500/20'
//                         : 'border-slate-200 dark:border-slate-700 hover:border-cyan-300 dark:hover:border-cyan-500 text-slate-600 dark:text-slate-400'
//                     }`}
//                   >
//                     {type}
//                   </motion.div>
//                 ))}
//               </div>
//             </div>

//             {/* Salaire */}
//             <div>
//               <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
//                 <DollarSign size={16} className="text-cyan-500" />
//                 Salaire de Base Mensuel <span className="text-red-500">*</span>
//               </label>
//               <div className="relative">
//                 <input
//                   type="number"
//                   name="baseSalary"
//                   value={formData.baseSalary}
//                   onChange={onInputChange}
//                   placeholder="0"
//                   className="w-full px-4 py-4 pr-20 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none font-bold text-2xl transition-all"
//                 />
//                 <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">
//                   FCFA
//                 </span>
//               </div>
//               {formData.baseSalary && parseFloat(formData.baseSalary) > 0 && (
//                 <motion.p 
//                   initial={{ opacity: 0, y: -10 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   className="text-xs text-cyan-600 dark:text-cyan-400 mt-2 font-medium"
//                 >
//                   ≈ {(parseFloat(formData.baseSalary) / 26).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA par jour ouvré
//                 </motion.p>
//               )}
//             </div>
//           </div>

//           {/* MODE DE PAIEMENT */}
//           <div className="space-y-6">
//             <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider mb-4 flex items-center gap-2">
//               <Wallet size={16} className="text-sky-500" /> Mode de Paiement
//             </h3>

//             {/* Canal de versement */}
//             <div>
//               <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
//                 Canal de versement
//               </label>
//               <div className="grid grid-cols-3 gap-3">
//                 <motion.button
//                   type="button"
//                   whileHover={{ scale: 1.05 }}
//                   whileTap={{ scale: 0.95 }}
//                   onClick={() => onSelectChange('paymentMethod', 'MOBILE_MONEY')}
//                   className={`p-4 rounded-xl border-2 text-center transition-all ${
//                     formData.paymentMethod === 'MOBILE_MONEY'
//                       ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 shadow-lg'
//                       : 'border-slate-200 dark:border-slate-700 hover:border-cyan-300'
//                   }`}
//                 >
//                   <Smartphone className="mx-auto mb-1" size={20} />
//                   <div className="text-xs font-bold">Mobile</div>
//                 </motion.button>
                
//                 <motion.button
//                   type="button"
//                   whileHover={{ scale: 1.05 }}
//                   whileTap={{ scale: 0.95 }}
//                   onClick={() => onSelectChange('paymentMethod', 'BANK_TRANSFER')}
//                   className={`p-4 rounded-xl border-2 text-center transition-all ${
//                     formData.paymentMethod === 'BANK_TRANSFER'
//                       ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 shadow-lg'
//                       : 'border-slate-200 dark:border-slate-700 hover:border-cyan-300'
//                   }`}
//                 >
//                   <Building2 className="mx-auto mb-1" size={20} />
//                   <div className="text-xs font-bold">Banque</div>
//                 </motion.button>
                
//                 <motion.button
//                   type="button"
//                   whileHover={{ scale: 1.05 }}
//                   whileTap={{ scale: 0.95 }}
//                   onClick={() => onSelectChange('paymentMethod', 'CASH')}
//                   className={`p-4 rounded-xl border-2 text-center transition-all ${
//                     formData.paymentMethod === 'CASH'
//                       ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 shadow-lg'
//                       : 'border-slate-200 dark:border-slate-700 hover:border-cyan-300'
//                   }`}
//                 >
//                   <CreditCard className="mx-auto mb-1" size={20} />
//                   <div className="text-xs font-bold">Espèces</div>
//                 </motion.button>
//               </div>
//             </div>

//             {/* Virement Bancaire */}
//             <AnimatePresence>
//               {formData.paymentMethod === 'BANK_TRANSFER' && (
//                 <motion.div
//                   initial={{ opacity: 0, height: 0 }}
//                   animate={{ opacity: 1, height: 'auto' }}
//                   exit={{ opacity: 0, height: 0 }}
//                   className="glass-card p-6 rounded-2xl border-2 border-cyan-200 dark:border-cyan-800 space-y-4"
//                 >
//                   <div>
//                     <FancySelect
//                       label="Banque"
//                       value={formData.bankName}
//                       onChange={(v) => onSelectChange('bankName', v)}
//                       icon={Building2}
//                       options={[
//                         { value: 'BGFI', label: 'BGFI Bank' },
//                         { value: 'ECOBANK', label: 'Ecobank' },
//                         { value: 'LCB', label: 'LCB Bank' },
//                         { value: 'UBA', label: 'UBA' },
//                         { value: 'SOCIETE_GENERALE', label: 'Société Générale' },
//                       ]}
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
//                       Numéro de Compte (RIB)
//                     </label>
//                     <input
//                       name="bankAccountNumber"
//                       value={formData.bankAccountNumber}
//                       onChange={onInputChange}
//                       placeholder="XXXXXXXXXXXXXXXXXXXXXXXX"
//                       className="w-full p-3 border-2 border-cyan-300 dark:border-cyan-700 dark:bg-slate-800 rounded-xl font-mono focus:ring-2 focus:ring-cyan-500/20 outline-none"
//                     />
//                   </div>
//                 </motion.div>
//               )}
//             </AnimatePresence>

//             {/* Mobile Money */}
//             <AnimatePresence>
//               {formData.paymentMethod === 'MOBILE_MONEY' && (
//                 <motion.div
//                   initial={{ opacity: 0, height: 0 }}
//                   animate={{ opacity: 1, height: 'auto' }}
//                   exit={{ opacity: 0, height: 0 }}
//                   className="glass-card p-6 rounded-2xl border-2 border-cyan-200 dark:border-cyan-800 space-y-4"
//                 >
//                   <div>
//                     <FancySelect
//                       label="Opérateur"
//                       value={formData.mobileMoneyOperator}
//                       onChange={(v) => onSelectChange('mobileMoneyOperator', v)}
//                       icon={Smartphone}
//                       options={[
//                         { value: 'MTN', label: 'MTN Mobile Money' },
//                         { value: 'AIRTEL', label: 'Airtel Money' },
//                       ]}
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
//                       Numéro de téléphone
//                     </label>
//                     <input
//                       name="mobileMoneyNumber"
//                       value={formData.mobileMoneyNumber}
//                       onChange={onInputChange}
//                       placeholder="06 123 45 67"
//                       className="w-full p-3 border-2 border-cyan-300 dark:border-cyan-700 dark:bg-slate-800 rounded-xl font-mono focus:ring-2 focus:ring-cyan-500/20 outline-none"
//                     />
//                   </div>
//                 </motion.div>
//               )}
//             </AnimatePresence>

//             {/* Message si espèces */}
//             <AnimatePresence>
//               {formData.paymentMethod === 'CASH' && (
//                 <motion.div
//                   initial={{ opacity: 0, height: 0 }}
//                   animate={{ opacity: 1, height: 'auto' }}
//                   exit={{ opacity: 0, height: 0 }}
//                   className="glass-card p-6 rounded-2xl"
//                 >
//                   <p className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-3">
//                     <CreditCard className="text-cyan-500 mt-0.5" size={20} />
//                     <span>
//                       <strong className="text-slate-900 dark:text-white">Paiement en espèces</strong><br/>
//                       L'employé recevra sa rémunération en liquide. Pensez à faire signer un reçu de paiement.
//                     </span>
//                   </p>
//                 </motion.div>
//               )}
//             </AnimatePresence>
//           </div>
//         </div>
//       </div>

//       {/* MODAL CRÉATION DÉPARTEMENT */}
//       <AnimatePresence>
//         {showDeptModal && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xl p-4"
//             onClick={() => setShowDeptModal(false)}
//           >
//             <motion.div
//               initial={{ scale: 0.9, y: 20 }}
//               animate={{ scale: 1, y: 0 }}
//               exit={{ scale: 0.9, y: 20 }}
//               onClick={(e) => e.stopPropagation()}
//               className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
//             >
//               <button
//                 type="button"
//                 onClick={() => setShowDeptModal(false)}
//                 className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
//               >
//                 <X size={20} />
//               </button>

//               <div className="flex items-center gap-4 mb-8">
//                 <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-full flex items-center justify-center">
//                   <Network size={24} />
//                 </div>
//                 <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
//                   Nouveau Département
//                 </h2>
//               </div>

//               <form onSubmit={handleCreateDepartment} className="space-y-6">
//                 <div>
//                   <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
//                     Nom du département
//                   </label>
//                   <input
//                     required
//                     autoFocus
//                     placeholder="Ex: Marketing, IT, Finance..."
//                     value={deptFormData.name}
//                     onChange={(e) =>
//                       setDeptFormData({ ...deptFormData, name: e.target.value })
//                     }
//                     className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-cyan-500/50 outline-none text-lg"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
//                     Code (Optionnel)
//                   </label>
//                   <input
//                     placeholder="Ex: MKT, IT, FIN..."
//                     value={deptFormData.code}
//                     onChange={(e) =>
//                       setDeptFormData({
//                         ...deptFormData,
//                         code: e.target.value.toUpperCase(),
//                       })
//                     }
//                     className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-cyan-500/50 outline-none font-mono tracking-wider"
//                   />
//                 </div>

//                 <div className="flex gap-3">
//                   <button
//                     type="button"
//                     onClick={() => setShowDeptModal(false)}
//                     className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
//                   >
//                     Annuler
//                   </button>
//                   <button
//                     type="submit"
//                     disabled={isCreatingDept}
//                     className="flex-1 py-4 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-600 hover:to-sky-600 text-white font-bold rounded-xl shadow-lg transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
//                   >
//                     {isCreatingDept ? (
//                       <Loader2 className="animate-spin" size={20} />
//                     ) : (
//                       <Save size={20} />
//                     )}
//                     Créer
//                   </button>
//                 </div>
//               </form>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </>
//   );
// };
'use client';

// ============================================================================
// 📁 components/employees/create/Step3Contract.tsx
// 🆕 contractEndDate : champ conditionnel (caché pour CDI, obligatoire sinon)
// 🆕 Calcul automatique durée + aperçu de la période
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  Building2, Wallet, Smartphone, Briefcase, Calendar, DollarSign,
  CreditCard, AlertCircle, Plus, X, Loader2, Save, Network,
  Sparkles, Clock, CalendarDays, Check,
} from 'lucide-react';
import { FancySelect } from '@/components/ui/FancySelect';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';
import { useAlert } from '@/components/providers/AlertProvider';
import { differenceInDays, differenceInMonths, format, addDays } from 'date-fns';
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

// Contrats qui nécessitent une date de fin
const REQUIRES_END_DATE = ['CDD', 'STAGE', 'INTERIM', 'CONSULTANT'];

// Durées suggérées selon le type
const SUGGESTED_DURATIONS: Record<string, { label: string; months: number }[]> = {
  STAGE:      [{ label: '1 mois', months: 1 }, { label: '3 mois', months: 3 }, { label: '6 mois', months: 6 }],
  CDD:        [{ label: '3 mois', months: 3 }, { label: '6 mois', months: 6 }, { label: '1 an', months: 12 }],
  INTERIM:    [{ label: '1 mois', months: 1 }, { label: '3 mois', months: 3 }, { label: '6 mois', months: 6 }],
  CONSULTANT: [{ label: '3 mois', months: 3 }, { label: '6 mois', months: 6 }, { label: '1 an', months: 12 }],
};

// ─── HELPER durée en texte lisible ──────────────────────────────────────────
function formatDuration(days: number): string {
  if (days <= 0) return '—';
  if (days < 30) return `${days} jour${days > 1 ? 's' : ''}`;
  const months = Math.floor(days / 30);
  const rem    = days % 30;
  if (rem === 0) return `${months} mois`;
  return `${months} mois et ${rem} jour${rem > 1 ? 's' : ''}`;
}

// ─── COMPOSANT APERÇU PÉRIODE ────────────────────────────────────────────────
function ContractDurationPreview({
  hireDate,
  endDate,
  contractType,
}: {
  hireDate: string;
  endDate: string;
  contractType: string;
}) {
  if (!hireDate || !endDate) return null;

  const start = new Date(hireDate);
  const end   = new Date(endDate);
  if (end <= start) return null;

  const totalDays = differenceInDays(end, start);
  const today     = new Date();
  const daysLeft  = differenceInDays(end, today);
  const pct       = Math.min(100, Math.round(((totalDays - Math.max(0, daysLeft)) / totalDays) * 100));

  const urgencyColor =
    daysLeft <= 7  ? 'bg-red-500'
    : daysLeft <= 30 ? 'bg-orange-500'
    : daysLeft <= 60 ? 'bg-yellow-500'
    : 'bg-emerald-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3"
    >
      {/* Durée totale */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500 font-medium flex items-center gap-1.5">
          <Clock size={13} /> Durée totale
        </span>
        <span className="font-bold text-slate-900 dark:text-white">{formatDuration(totalDays)}</span>
      </div>

      {/* Barre de progression */}
      <div>
        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={`h-full rounded-full ${urgencyColor}`}
          />
        </div>
        <div className="flex justify-between text-[11px] text-slate-400 mt-1">
          <span>{format(start, 'd MMM yyyy', { locale: fr })}</span>
          <span className={daysLeft <= 30 ? 'text-orange-500 font-bold' : ''}>
            {format(end, 'd MMM yyyy', { locale: fr })}
          </span>
        </div>
      </div>

      {/* Jours restants */}
      {daysLeft > 0 ? (
        <p className={`text-xs font-semibold flex items-center gap-1.5 ${
          daysLeft <= 7 ? 'text-red-600' : daysLeft <= 30 ? 'text-orange-600' : 'text-emerald-600'
        }`}>
          <CalendarDays size={12} />
          {daysLeft <= 0
            ? 'Contrat expiré'
            : `${daysLeft} jour${daysLeft > 1 ? 's' : ''} restant${daysLeft > 1 ? 's' : ''} — alertes automatiques activées`}
        </p>
      ) : (
        <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5">
          <AlertCircle size={12} /> Date de fin dans le passé
        </p>
      )}
    </motion.div>
  );
}

// ─── COMPOSANT PRINCIPAL ─────────────────────────────────────────────────────
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

  const needsEndDate = REQUIRES_END_DATE.includes(formData.contractType);
  const suggestions  = SUGGESTED_DURATIONS[formData.contractType] ?? [];

  // Charger la convention de l'entreprise
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

  // Quand on passe en CDI → effacer la date de fin
  const handleContractTypeChange = (type: string) => {
    onSelectChange('contractType', type);
    if (type === 'CDI') {
      onSelectChange('contractEndDate', '');
    }
  };

  // Suggestion de durée → calculer la date de fin depuis la date d'embauche
  const applySuggestion = (months: number) => {
    if (!formData.hireDate) {
      alert.warning('Date d\'embauche manquante', 'Renseignez d\'abord la date d\'embauche');
      return;
    }
    const start  = new Date(formData.hireDate);
    const end    = new Date(start);
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
      alert.success('✨ Département créé', `${deptFormData.name} a été ajouté.`);
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
    <>
      <div className="space-y-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-cyan-100 dark:bg-cyan-900/30 rounded-full mb-4">
            <Briefcase size={40} className="text-cyan-500" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Contrat & Rémunération</h2>
          <p className="text-slate-600 dark:text-slate-400">Définissons les conditions d'emploi</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ── COLONNE GAUCHE ─────────────────────────────────────────────── */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
              <Building2 size={16} className="text-cyan-500" /> Poste & Affectation
            </h3>

            {/* Département */}
            <div>
              <FancySelect label="Département *" value={formData.departmentId} onChange={(v) => onSelectChange('departmentId', v)} icon={Building2}
                options={departments.map((d) => ({ value: d.id, label: d.name }))} placeholder="Choisir un département..." />
              {departments.length === 0 ? (
                <div className="mt-3 p-4 bg-amber-50 dark:bg-amber-900/10 border-2 border-amber-200 dark:border-amber-800 rounded-xl">
                  <p className="text-sm text-amber-800 dark:text-amber-200 mb-3 flex items-center gap-2 font-medium">
                    <AlertCircle size={16} /> Aucun département disponible
                  </p>
                  <button type="button" onClick={() => setShowDeptModal(true)}
                    className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-sky-500 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                    <Plus size={18} /> Créer le premier département
                  </button>
                </div>
              ) : (
                <div className="mt-2 flex justify-end">
                  <button type="button" onClick={() => setShowDeptModal(true)}
                    className="text-sm text-cyan-600 dark:text-cyan-400 font-semibold flex items-center gap-1.5">
                    <Plus size={14} /> Créer département
                  </button>
                </div>
              )}
            </div>

            {/* Poste */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Intitulé du Poste <span className="text-red-500">*</span>
              </label>
              <input name="position" value={formData.position} onChange={onInputChange}
                placeholder="Comptable, Développeur, Manager..."
                className="w-full px-4 py-4 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all" />
            </div>

            {/* Convention collective */}
            {companyConvention && !isLoadingConvention && conventionCategories.length > 0 && (
              <div className="p-5 bg-purple-50 dark:bg-purple-900/10 border-2 border-purple-200 dark:border-purple-700 rounded-xl space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-purple-500" />
                  <h4 className="font-bold text-purple-900 dark:text-purple-100 text-sm">Convention : {companyConvention}</h4>
                </div>
                <div>
                  <label className="block text-xs font-bold text-purple-700 dark:text-purple-300 uppercase mb-2">Catégorie Professionnelle</label>
                  <select value={formData.professionalCategory || ''} onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full p-3 bg-white dark:bg-purple-900/20 border-2 border-purple-300 dark:border-purple-600 rounded-xl font-medium text-slate-900 dark:text-white focus:border-purple-500 outline-none">
                    <option value="">Sélectionner une catégorie...</option>
                    {conventionCategories.map((cat) => (
                      <option key={cat.code} value={cat.code}>{cat.label} — {cat.minSalary.toLocaleString()} FCFA min.</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Date d'embauche */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <Calendar size={16} className="text-sky-500" /> Date d'embauche <span className="text-red-500">*</span>
              </label>
              <input type="date" name="hireDate" value={formData.hireDate} onChange={onInputChange}
                className="w-full px-4 py-4 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all" />
            </div>

            {/* Type de contrat */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                Type de Contrat <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {['CDI', 'CDD', 'STAGE', 'CONSULTANT', 'INTERIM'].map((type) => (
                  <motion.div key={type} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => handleContractTypeChange(type)}
                    className={`cursor-pointer p-3 rounded-xl border-2 text-center text-sm font-bold transition-all ${
                      formData.contractType === type
                        ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 shadow-lg shadow-cyan-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-cyan-300 text-slate-600 dark:text-slate-400'
                    }`}>
                    {type}
                  </motion.div>
                ))}
              </div>

              {/* Badge CDI = pas de date de fin */}
              <AnimatePresence>
                {formData.contractType === 'CDI' && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Check size={12} className="text-emerald-500" /> Contrat indéterminé — pas de date de fin
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* ── DATE DE FIN (conditionnel) ─────────────────────────────── */}
            <AnimatePresence>
              {needsEndDate && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="p-5 bg-sky-50 dark:bg-sky-900/10 border-2 border-sky-200 dark:border-sky-800 rounded-2xl space-y-4">
                    {/* En-tête */}
                    <div className="flex items-center gap-2">
                      <CalendarDays size={16} className="text-sky-500" />
                      <span className="text-sm font-bold text-sky-900 dark:text-sky-100">
                        Date de fin de contrat <span className="text-red-500">*</span>
                      </span>
                    </div>

                    {/* Raccourcis durée */}
                    {suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {suggestions.map((s) => (
                          <button key={s.months} type="button" onClick={() => applySuggestion(s.months)}
                            className="px-3 py-1.5 bg-white dark:bg-sky-900/30 border border-sky-300 dark:border-sky-600 rounded-lg text-xs font-bold text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-800/40 transition-colors">
                            + {s.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Input date */}
                    <input
                      type="date"
                      name="contractEndDate"
                      value={formData.contractEndDate || ''}
                      onChange={onInputChange}
                      min={formData.hireDate || undefined}
                      className="w-full px-4 py-3 border-2 border-sky-300 dark:border-sky-600 rounded-xl bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all font-medium"
                    />

                    {/* Aperçu durée */}
                    <ContractDurationPreview
                      hireDate={formData.hireDate}
                      endDate={formData.contractEndDate}
                      contractType={formData.contractType}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Salaire */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <DollarSign size={16} className="text-cyan-500" /> Salaire de Base Mensuel <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input type="number" name="baseSalary" value={formData.baseSalary} onChange={onInputChange} placeholder="0"
                  className="w-full px-4 py-4 pr-20 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none font-bold text-2xl transition-all" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">FCFA</span>
              </div>
              {formData.baseSalary && parseFloat(formData.baseSalary) > 0 && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-xs text-cyan-600 dark:text-cyan-400 mt-2 font-medium">
                  ≈ {(parseFloat(formData.baseSalary) / 26).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA par jour ouvré
                </motion.p>
              )}
            </div>
          </div>

          {/* ── COLONNE DROITE : PAIEMENT (inchangée) ──────────────────────── */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
              <Wallet size={16} className="text-sky-500" /> Mode de Paiement
            </h3>

            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'MOBILE_MONEY', label: 'Mobile', icon: Smartphone },
                { value: 'BANK_TRANSFER', label: 'Banque', icon: Building2 },
                { value: 'CASH', label: 'Espèces', icon: CreditCard },
              ].map(({ value, label, icon: Icon }) => (
                <motion.button key={value} type="button" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => onSelectChange('paymentMethod', value)}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    formData.paymentMethod === value
                      ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 shadow-lg'
                      : 'border-slate-200 dark:border-slate-700 hover:border-cyan-300'
                  }`}>
                  <Icon className="mx-auto mb-1" size={20} />
                  <div className="text-xs font-bold">{label}</div>
                </motion.button>
              ))}
            </div>

            <AnimatePresence>
              {formData.paymentMethod === 'BANK_TRANSFER' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="p-6 rounded-2xl border-2 border-cyan-200 dark:border-cyan-800 space-y-4">
                  <FancySelect label="Banque" value={formData.bankName} onChange={(v) => onSelectChange('bankName', v)} icon={Building2}
                    options={[{ value: 'BGFI', label: 'BGFI Bank' }, { value: 'ECOBANK', label: 'Ecobank' }, { value: 'LCB', label: 'LCB Bank' }, { value: 'UBA', label: 'UBA' }, { value: 'SOCIETE_GENERALE', label: 'Société Générale' }]} />
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Numéro de Compte (RIB)</label>
                    <input name="bankAccountNumber" value={formData.bankAccountNumber} onChange={onInputChange}
                      placeholder="XXXXXXXXXXXXXXXXXXXXXXXX" className="w-full p-3 border-2 border-cyan-300 dark:border-cyan-700 dark:bg-slate-800 rounded-xl font-mono focus:border-cyan-500 outline-none" />
                  </div>
                </motion.div>
              )}
              {formData.paymentMethod === 'MOBILE_MONEY' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="p-6 rounded-2xl border-2 border-cyan-200 dark:border-cyan-800 space-y-4">
                  <FancySelect label="Opérateur" value={formData.mobileMoneyOperator} onChange={(v) => onSelectChange('mobileMoneyOperator', v)} icon={Smartphone}
                    options={[{ value: 'MTN', label: 'MTN Mobile Money' }, { value: 'AIRTEL', label: 'Airtel Money' }]} />
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Numéro de téléphone</label>
                    <input name="mobileMoneyNumber" value={formData.mobileMoneyNumber} onChange={onInputChange}
                      placeholder="06 123 45 67" className="w-full p-3 border-2 border-cyan-300 dark:border-cyan-700 dark:bg-slate-800 rounded-xl font-mono focus:border-cyan-500 outline-none" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* MODAL DÉPARTEMENT */}
      <AnimatePresence>
        {showDeptModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xl p-4"
            onClick={() => setShowDeptModal(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
              <button type="button" onClick={() => setShowDeptModal(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white">
                <X size={20} />
              </button>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 rounded-full flex items-center justify-center"><Network size={24} /></div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Nouveau Département</h2>
              </div>
              <form onSubmit={handleCreateDepartment} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nom du département</label>
                  <input required autoFocus placeholder="Ex: Marketing, IT, Finance..." value={deptFormData.name}
                    onChange={(e) => setDeptFormData({ ...deptFormData, name: e.target.value })}
                    className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-cyan-500/50 outline-none text-lg" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Code (Optionnel)</label>
                  <input placeholder="Ex: MKT, IT, FIN..." value={deptFormData.code}
                    onChange={(e) => setDeptFormData({ ...deptFormData, code: e.target.value.toUpperCase() })}
                    className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-cyan-500/50 outline-none font-mono" />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowDeptModal(false)}
                    className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl">Annuler</button>
                  <button type="submit" disabled={isCreatingDept}
                    className="flex-1 py-4 bg-gradient-to-r from-cyan-500 to-sky-500 text-white font-bold rounded-xl shadow-lg flex justify-center items-center gap-2 disabled:opacity-50">
                    {isCreatingDept ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} Créer
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