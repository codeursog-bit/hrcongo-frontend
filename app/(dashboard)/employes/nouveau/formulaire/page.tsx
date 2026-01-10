
// 'use client';

// import React, { useState, useEffect, useRef } from 'react';
// import { useRouter } from 'next/navigation';
// import Link from 'next/link';
// import { 
//   User, Briefcase, CreditCard, Check, Camera, Upload, 
//   Calendar, MapPin, Phone, Mail, FileText, ChevronRight, 
//   ChevronLeft, X, Smartphone, Banknote, BadgeCheck, Building2,
//   Loader2, Image as ImageIcon, ShieldCheck, Plus, Wallet, Heart, Users
// } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { api } from '@/services/api';
// import { FancySelect } from '@/components/ui/FancySelect';
// import { useAlert } from '@/components/providers/AlertProvider';

// const STEPS = [
//   { id: 1, label: 'Identité & Administratif', icon: User },
//   { id: 2, label: 'Contrat & Paiement', icon: Briefcase },
//   { id: 3, label: 'Validation', icon: Check },
// ];

// export default function CreateEmployeePage() {
//   const router = useRouter();
//   const alert = useAlert();
//   const fileInputRef = useRef<HTMLInputElement>(null);
//   const [currentStep, setCurrentStep] = useState(1);
//   const [direction, setDirection] = useState(0);
//   const [showSuccess, setShowSuccess] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [departments, setDepartments] = useState<any[]>([]);
  
//   // Image Upload State
//   const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

//   // Form State
//   const [formData, setFormData] = useState({
//     firstName: '',
//     lastName: '',
//     dateOfBirth: '',
//     placeOfBirth: '',
//     gender: 'MALE',
//     maritalStatus: 'SINGLE',
//     phone: '',
//     email: '',
//     address: '',
//     nationalIdNumber: '',
//     cnssNumber: '',
    
//     hireDate: new Date().toISOString().split('T')[0],
//     contractType: 'CDI',
//     position: '',
//     departmentId: '',
//     baseSalary: '',

//     // Paiement
//     paymentMethod: 'CASH', // BANK_TRANSFER, MOBILE_MONEY, CASH
//     bankName: '',
//     bankAccountNumber: '', // RIB (Modifié pour BDD)
//     mobileMoneyOperator: 'MTN', // MTN, AIRTEL (Modifié pour BDD)
//     mobileMoneyNumber: '',
//   });

//   // Fetch Departments
//   useEffect(() => {
//     const fetchDepts = async () => {
//         try {
//             const data = await api.get<any[]>('/departments');
//             setDepartments(data);
//             if (data.length > 0) setFormData(prev => ({...prev, departmentId: data[0].id}));
//         } catch (e) {
//             console.error("Failed to load departments", e);
//         }
//     };
//     fetchDepts();
//   }, []);

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };

//   const handleSelectChange = (name: string, value: string) => {
//       setFormData(prev => ({ ...prev, [name]: value }));
//   };

//   const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (file) {
//       const reader = new FileReader();
//       reader.onloadend = () => {
//         setAvatarPreview(reader.result as string);
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   const nextStep = () => {
//     if (currentStep < 3) {
//       setDirection(1);
//       setCurrentStep(curr => curr + 1);
//     }
//   };

//   const prevStep = () => {
//     if (currentStep > 1) {
//       setDirection(-1);
//       setCurrentStep(curr => curr - 1);
//     }
//   };

//   const handleSubmit = async () => {
//     setIsLoading(true);
//     try {
//         await api.post('/employees', {
//             ...formData,
//             baseSalary: parseFloat(formData.baseSalary),
//             photoUrl: avatarPreview 
//         });
//         setIsLoading(false);
//         setShowSuccess(true);
//     } catch (error) {
//         console.error("Error creating employee", error);
//         setIsLoading(false);
//          alert.error('Erreur de création', 'Erreur lors de la création. Vérifiez que tous les champs obligatoires sont remplis');
//     }
//   };

//   const variants = {
//     enter: (dir: number) => ({ x: dir > 0 ? 50 : -50, opacity: 0 }),
//     center: { x: 0, opacity: 1 },
//     exit: (dir: number) => ({ x: dir > 0 ? -50 : 50, opacity: 0 }),
//   };

//   return (
//     <div className="w-full flex justify-center items-start min-h-[calc(100vh-100px)] py-4">
//       <AnimatePresence>
//         {showSuccess && (
//           <motion.div 
//             initial={{ opacity: 0 }} 
//             animate={{ opacity: 1 }} 
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
//           >
//             <motion.div 
//               initial={{ scale: 0.8, y: 20 }}
//               animate={{ scale: 1, y: 0 }}
//               className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md w-full text-center relative overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-700"
//             >
//               <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-sky-500"></div>
//               <div className="mx-auto w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6 text-emerald-500">
//                 <BadgeCheck size={48} />
//               </div>
//               <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Employé Créé !</h2>
//               <p className="text-gray-500 dark:text-gray-400 mb-8">
//                 Le dossier RH a été initialisé avec succès.
//               </p>
//               <div className="space-y-3">
//                 <button onClick={() => router.push('/employes')} className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-emerald-500/30">
//                   Voir le dossier
//                 </button>
//                 <button onClick={() => window.location.reload()} className="w-full py-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-white font-bold rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
//                   Ajouter un autre
//                 </button>
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       <div className="w-full max-w-5xl bg-white dark:bg-gray-800/50 backdrop-blur-md rounded-3xl shadow-xl border border-gray-100 dark:border-white/5 overflow-hidden flex flex-col min-h-[600px]">
//         {/* Stepper Header */}
//         <div className="bg-white/80 dark:bg-gray-900/80 border-b border-gray-100 dark:border-white/5 relative z-10 backdrop-blur-md">
//           <div className="flex items-center justify-between px-6 sm:px-12 py-6 relative max-w-3xl mx-auto">
//             <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 dark:bg-gray-700 -z-10 transform -translate-y-1/2" />
//             {STEPS.map((step) => {
//               const isActive = step.id === currentStep;
//               const isCompleted = step.id < currentStep;
//               return (
//                 <div key={step.id} className="flex flex-col items-center bg-gray-50 dark:bg-gray-900 px-4 rounded-full py-1">
//                   <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${isActive ? 'bg-sky-500 border-sky-500 text-white shadow-lg shadow-sky-500/30 scale-110' : isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400'}`}>
//                     {isCompleted ? <Check size={24} /> : <step.icon size={24} />}
//                   </div>
//                   <span className={`mt-2 text-xs font-bold uppercase tracking-wider ${isActive ? 'text-sky-600 dark:text-sky-400' : 'text-gray-400'}`}>{step.label}</span>
//                 </div>
//               );
//             })}
//           </div>
//         </div>

//         {/* Content Body */}
//         <div className="flex-1 p-6 sm:p-10 overflow-x-hidden">
//           <AnimatePresence mode="wait" custom={direction}>
//             <motion.div
//               key={currentStep}
//               custom={direction}
//               variants={variants}
//               initial="enter"
//               animate="center"
//               exit="exit"
//               transition={{ type: 'spring', stiffness: 300, damping: 30 }}
//               className="max-w-4xl mx-auto"
//             >
//               {currentStep === 1 && (
//                 <div className="space-y-8">
                    
//                     {/* PHOTO UPLOAD */}
//                     <div className="flex flex-col items-center justify-center mb-8">
//                         <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
//                             <div className={`w-32 h-32 rounded-full overflow-hidden border-4 transition-all ${avatarPreview ? 'border-sky-500' : 'border-gray-200 dark:border-gray-700 border-dashed bg-gray-50 dark:bg-gray-800'}`}>
//                                 {avatarPreview ? (
//                                     <img src={avatarPreview} className="w-full h-full object-cover" />
//                                 ) : (
//                                     <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
//                                         <Camera size={32} />
//                                         <span className="text-xs mt-1 font-medium">Photo</span>
//                                     </div>
//                                 )}
//                             </div>
//                             <div className="absolute bottom-0 right-0 p-2 bg-sky-500 rounded-full text-white shadow-lg group-hover:scale-110 transition-transform">
//                                 <Plus size={16} />
//                             </div>
//                             <input 
//                                 type="file" 
//                                 ref={fileInputRef} 
//                                 onChange={handleImageUpload} 
//                                 className="hidden" 
//                                 accept="image/*"
//                             />
//                         </div>
//                     </div>

//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                         {/* IDENTITÉ */}
//                         <div className="space-y-4">
//                             <h3 className="text-sm font-bold uppercase text-gray-400 tracking-wider mb-2">Identité</h3>
//                             <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Prénom*</label><input name="firstName" value={formData.firstName} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-sky-500/20 outline-none"/></div>
//                             <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Nom*</label><input name="lastName" value={formData.lastName} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-sky-500/20 outline-none"/></div>
//                             <div className="grid grid-cols-2 gap-4">
//                                 <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Date Naissance*</label><input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-sky-500/20 outline-none"/></div>
                                
//                                 {/* FANCY SELECT GENRE */}
//                                 <div>
//                                     <FancySelect 
//                                         label="Genre"
//                                         value={formData.gender} 
//                                         onChange={(v) => handleSelectChange('gender', v)}
//                                         icon={User}
//                                         options={[
//                                             { value: 'MALE', label: 'Homme' },
//                                             { value: 'FEMALE', label: 'Femme' }
//                                         ]}
//                                     />
//                                 </div>
//                             </div>
//                             {/* FANCY SELECT MARITAL */}
//                             <div>
//                                 <FancySelect 
//                                     label="Situation Familiale"
//                                     value={formData.maritalStatus} 
//                                     onChange={(v) => handleSelectChange('maritalStatus', v)}
//                                     icon={Heart}
//                                     options={[
//                                         { value: 'SINGLE', label: 'Célibataire' },
//                                         { value: 'MARRIED', label: 'Marié(e)' },
//                                         { value: 'DIVORCED', label: 'Divorcé(e)' },
//                                         { value: 'WIDOWED', label: 'Veuf/Veuve' }
//                                     ]}
//                                 />
//                             </div>
//                         </div>

//                         {/* CONTACT & CIVIL */}
//                         <div className="space-y-4">
//                             <h3 className="text-sm font-bold uppercase text-gray-400 tracking-wider mb-2">Coordonnées & Administratif</h3>
//                             <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Email</label><input name="email" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-sky-500/20 outline-none"/></div>
//                             <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Téléphone</label><input name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-sky-500/20 outline-none"/></div>
//                             <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Adresse</label><input name="address" value={formData.address} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-sky-500/20 outline-none"/></div>
                            
//                             {/* RESTORED CNI & CNSS */}
//                             <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100 dark:border-gray-700">
//                                 <div>
//                                     <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">N° CNI / Passeport*</label>
//                                     <input name="nationalIdNumber" value={formData.nationalIdNumber} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-sky-500/20 outline-none font-mono text-sm" placeholder="ID-12345"/>
//                                 </div>
//                                 <div>
//                                     <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">N° CNSS</label>
//                                     <input name="cnssNumber" value={formData.cnssNumber} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-sky-500/20 outline-none font-mono text-sm" placeholder="123456789"/>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//               )}

//               {currentStep === 2 && (
//                 <div className="space-y-8">
//                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
//                     <div className="space-y-4">
//                         <h3 className="text-sm font-bold uppercase text-gray-400 tracking-wider mb-2">Poste & Affectation</h3>
                        
//                         {/* FANCY SELECT DEPARTMENT */}
//                         <div>
//                             <FancySelect 
//                                 label="Département"
//                                 value={formData.departmentId} 
//                                 onChange={(v) => handleSelectChange('departmentId', v)}
//                                 icon={Building2}
//                                 options={departments.map(d => ({ value: d.id, label: d.name }))}
//                                 placeholder="Choisir un département..."
//                             />
//                             {departments.length === 0 && (
//                                 <p className="text-xs text-orange-500 mt-1">Aucun département. Créez-en un dans les paramètres.</p>
//                             )}
//                         </div>

//                         <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Intitulé du Poste</label><input name="position" value={formData.position} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-sky-500/20 outline-none"/></div>
//                         <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Date d'embauche</label><input type="date" name="hireDate" value={formData.hireDate} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-sky-500/20 outline-none"/></div>
                        
//                         {/* CUSTOM CONTRACT SELECTOR */}
//                         <div>
//                             <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Type de Contrat</label>
//                             <div className="grid grid-cols-2 gap-3">
//                                 {['CDI', 'CDD', 'STAGE', 'CONSULTANT'].map(type => (
//                                     <div key={type} onClick={() => setFormData(prev => ({...prev, contractType: type}))} className={`cursor-pointer p-4 rounded-xl border-2 text-center text-sm font-bold transition-all ${formData.contractType === type ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 shadow-md shadow-sky-500/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
//                                         {type}
//                                     </div>
//                                 ))}
//                             </div>
//                         </div>
//                         <div>
//                             <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Salaire de Base Mensuel</label>
//                             <div className="relative">
//                                 <input type="number" name="baseSalary" value={formData.baseSalary} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-sky-500/20 outline-none font-bold text-lg" placeholder="0"/>
//                                 <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">FCFA</span>
//                             </div>
//                         </div>
//                     </div>
                    
//                     {/* SECTION PAIEMENT */}
//                     <div className="space-y-4">
//                         <h3 className="text-sm font-bold uppercase text-gray-400 tracking-wider mb-2 flex items-center gap-2">
//                             <Wallet size={16} /> Mode de Paiement
//                         </h3>
                        
//                         <div>
//                             <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Canal de versement</label>
//                             <div className="grid grid-cols-3 gap-2">
//                                 <button onClick={() => setFormData(prev => ({...prev, paymentMethod: 'MOBILE_MONEY'}))} className={`p-3 rounded-xl border-2 text-center text-xs font-bold transition-all ${formData.paymentMethod === 'MOBILE_MONEY' ? 'border-yellow-500 bg-yellow-50 text-yellow-700' : 'border-gray-200 dark:border-gray-700'}`}>
//                                     Mobile Money
//                                 </button>
//                                 <button onClick={() => setFormData(prev => ({...prev, paymentMethod: 'BANK_TRANSFER'}))} className={`p-3 rounded-xl border-2 text-center text-xs font-bold transition-all ${formData.paymentMethod === 'BANK_TRANSFER' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 dark:border-gray-700'}`}>
//                                     Virement Bancaire
//                                 </button>
//                                 <button onClick={() => setFormData(prev => ({...prev, paymentMethod: 'CASH'}))} className={`p-3 rounded-xl border-2 text-center text-xs font-bold transition-all ${formData.paymentMethod === 'CASH' ? 'border-gray-500 bg-gray-50 text-gray-700' : 'border-gray-200 dark:border-gray-700'}`}>
//                                     Espèces
//                                 </button>
//                             </div>
//                         </div>

//                         {formData.paymentMethod === 'BANK_TRANSFER' && (
//                             <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-200 dark:border-blue-800 animate-in fade-in slide-in-from-top-2">
//                                 <div className="mb-3">
//                                     {/* FANCY SELECT BANK */}
//                                     <FancySelect 
//                                         label="Banque"
//                                         value={formData.bankName} 
//                                         onChange={(v) => handleSelectChange('bankName', v)}
//                                         icon={Building2}
//                                         options={[
//                                             { value: 'BGFI', label: 'BGFI Bank' },
//                                             { value: 'ECOBANK', label: 'Ecobank' },
//                                             { value: 'LCB', label: 'LCB Bank' },
//                                             { value: 'UBA', label: 'UBA' },
//                                             { value: 'SOCIETE_GENERALE', label: 'Société Générale' }
//                                         ]}
//                                     />
//                                 </div>
//                                 <div>
//                                     <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Numéro de Compte (RIB)</label>
//                                     <input name="bankAccountNumber" value={formData.bankAccountNumber} onChange={handleInputChange} placeholder="XXXXXXXXXXXXXXXXXXXXXXXX" className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded-lg font-mono"/>
//                                 </div>
//                             </div>
//                         )}
                        
//                         {formData.paymentMethod === 'MOBILE_MONEY' && (
//                             <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-xl border border-yellow-200 dark:border-yellow-800 animate-in fade-in slide-in-from-top-2">
//                                 <div className="mb-3">
//                                     <FancySelect 
//                                         label="Opérateur"
//                                         value={formData.mobileMoneyOperator} 
//                                         onChange={(v) => handleSelectChange('mobileMoneyOperator', v)}
//                                         icon={Smartphone}
//                                         options={[
//                                             { value: 'MTN', label: 'MTN Mobile Money' },
//                                             { value: 'AIRTEL', label: 'Airtel Money' }
//                                         ]}
//                                     />
//                                 </div>
//                                 <div>
//                                     <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Numéro de téléphone</label>
//                                     <input name="mobileMoneyNumber" value={formData.mobileMoneyNumber} onChange={handleInputChange} placeholder="06..." className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded-lg font-mono"/>
//                                 </div>
//                             </div>
//                         )}
//                     </div>

//                   </div>
//                 </div>
//               )}

//               {/* ... STEP 3 remains the same ... */}
//               {currentStep === 3 && (
//                 <div className="flex flex-col items-center justify-center space-y-8 py-10">
//                    <div className="relative">
//                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-gray-700 shadow-xl mx-auto bg-gray-100 flex items-center justify-center">
//                             {avatarPreview ? (
//                                 <img src={avatarPreview} className="w-full h-full object-cover" />
//                             ) : (
//                                 <User size={64} className="text-gray-300" />
//                             )}
//                        </div>
//                        <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-full border-4 border-white dark:border-gray-800">
//                            <Check size={20} strokeWidth={3} />
//                        </div>
//                    </div>
                   
//                    <div className="text-center">
//                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{formData.firstName} {formData.lastName}</h2>
//                        <div className="flex items-center justify-center gap-3">
//                            <span className="px-3 py-1 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 rounded-lg font-bold text-sm">{formData.position}</span>
//                            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg font-bold text-sm">{formData.contractType}</span>
//                        </div>
//                    </div>

//                    <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-200 dark:border-white/5 w-full max-w-lg">
//                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200 dark:border-white/5">
//                            <span className="text-gray-500">Département</span>
//                            <span className="font-bold">{departments.find(d => d.id === formData.departmentId)?.name || '-'}</span>
//                        </div>
//                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200 dark:border-white/5">
//                            <span className="text-gray-500">Salaire</span>
//                            <span className="font-bold font-mono">{parseFloat(formData.baseSalary || '0').toLocaleString()} FCFA</span>
//                        </div>
//                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200 dark:border-white/5">
//                            <span className="text-gray-500">CNI</span>
//                            <span className="font-bold font-mono">{formData.nationalIdNumber}</span>
//                        </div>
//                        <div className="flex justify-between items-center">
//                            <span className="text-gray-500">CNSS</span>
//                            <span className="font-bold font-mono">{formData.cnssNumber || 'Non renseigné'}</span>
//                        </div>
//                    </div>
//                 </div>
//               )}
//             </motion.div>
//           </AnimatePresence>
//         </div>

//         {/* Footer Actions */}
//         <div className="p-6 bg-white/80 dark:bg-gray-900/80 border-t border-gray-100 dark:border-white/5 backdrop-blur-md flex justify-between items-center">
//           <button onClick={currentStep === 1 ? () => router.back() : prevStep} className="px-6 py-3 rounded-xl text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-100 dark:hover:bg-white/5 transition-colors flex items-center gap-2">
//             {currentStep === 1 ? 'Annuler' : <><ChevronLeft size={18}/> Précédent</>}
//           </button>
          
//           <div className="flex gap-2">
//              {[1,2,3].map(s => (
//                  <div key={s} className={`w-2.5 h-2.5 rounded-full transition-colors ${s === currentStep ? 'bg-sky-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
//              ))}
//           </div>

//           <button onClick={currentStep === 3 ? handleSubmit : nextStep} disabled={isLoading} className="px-8 py-3 rounded-xl text-white font-bold bg-gray-900 dark:bg-white dark:text-gray-900 shadow-lg hover:scale-105 transition-all flex items-center gap-2">
//             {isLoading && <Loader2 className="animate-spin" size={18}/>}
//             {isLoading ? 'Traitement...' : (currentStep === 3 ? 'Confirmer Création' : <>{'Suivant'} <ChevronRight size={18}/></>)}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Briefcase, Check, ChevronRight, ChevronLeft, Loader2, BadgeCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';
import { useAlert } from '@/components/providers/AlertProvider';
import { useImageUpload } from '@/hooks/useImageUpload';
import { Step1Identity } from '@/components/employees/create/Step1Identity';
import { Step2Contract } from '@/components/employees/create/Step2Contract';
import { Step3Validation } from '@/components/employees/create/Step3Validation';

const STEPS = [
  { id: 1, label: 'Identité & Administratif', icon: User },
  { id: 2, label: 'Contrat & Paiement', icon: Briefcase },
  { id: 3, label: 'Validation', icon: Check },
];

export default function CreateEmployeePage() {
  const router = useRouter();
  const alert = useAlert();
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);

  // Hook d'upload d'image
  const imageUpload = useImageUpload();

  // État du formulaire
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    placeOfBirth: '',
    gender: 'MALE',
    maritalStatus: 'SINGLE',
    numberOfChildren: 0,
    phone: '',
    email: '',
    address: '',
    city: 'Brazzaville',
    nationalIdNumber: '',
    cnssNumber: '',
    hireDate: new Date().toISOString().split('T')[0],
    contractType: 'CDI',
    position: '',
    departmentId: '',
    baseSalary: '',
    paymentMethod: 'CASH',
    bankName: '',
    bankAccountNumber: '',
    mobileMoneyOperator: 'MTN',
    mobileMoneyNumber: '',
  });

  // Chargement des départements
  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const data = await api.get<any[]>('/departments');
        setDepartments(data);
        if (data.length > 0) {
          setFormData((prev) => ({ ...prev, departmentId: data[0].id }));
        }
      } catch (e) {
        console.error('Failed to load departments', e);
        alert.error('Erreur', 'Impossible de charger les départements');
      }
    };
    fetchDepts();
  }, [alert]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Validation Step 1
  const validateStep1 = (): boolean => {
    const missing: string[] = [];

    if (!formData.firstName.trim()) missing.push('Prénom');
    if (!formData.lastName.trim()) missing.push('Nom');
    if (!formData.dateOfBirth) missing.push('Date de naissance');
    if (!formData.placeOfBirth.trim()) missing.push('Lieu de naissance');
    if (!formData.phone.trim()) missing.push('Téléphone');
    if (!formData.email.trim()) missing.push('Email');
    if (!formData.address.trim()) missing.push('Adresse');

    if (missing.length > 0) {
      alert.error('Champs obligatoires manquants', `Veuillez remplir : ${missing.join(', ')}`);
      return false;
    }

    return true;
  };

  // Validation Step 2
  const validateStep2 = (): boolean => {
    const missing: string[] = [];

    if (!formData.position.trim()) missing.push('Poste');
    if (!formData.departmentId) missing.push('Département');
    if (!formData.baseSalary || parseFloat(formData.baseSalary) <= 0) {
      missing.push('Salaire de base valide');
    }

    if (missing.length > 0) {
      alert.error('Champs obligatoires manquants', `Veuillez remplir : ${missing.join(', ')}`);
      return false;
    }

    return true;
  };

  const nextStep = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;

    if (currentStep < 3) {
      setDirection(1);
      setCurrentStep((curr) => curr + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setDirection(-1);
      setCurrentStep((curr) => curr - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await api.post('/employees', {
        ...formData,
        baseSalary: parseFloat(formData.baseSalary),
        numberOfChildren: parseInt(formData.numberOfChildren as any) || 0,
        photoUrl: imageUpload.uploadedUrl, // ✅ URL Cloudinary
        nationalIdNumber: formData.nationalIdNumber.trim() || null,
        cnssNumber: formData.cnssNumber.trim() || null,
      });

      setIsLoading(false);
      setShowSuccess(true);
      alert.success('Employé créé !', 'Le dossier RH a été initialisé avec succès.');
    } catch (error: any) {
      console.error('Error creating employee', error);
      setIsLoading(false);

      if (error.response?.data?.fields) {
        alert.error('Champs obligatoires manquants', `Veuillez vérifier : ${error.response.data.fields.join(', ')}`);
      } else if (error.response?.data?.message) {
        alert.error('Erreur', error.response.data.message);
      } else {
        alert.error('Erreur de création', 'Erreur lors de la création. Vérifiez que tous les champs obligatoires sont remplis');
      }
    }
  };

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 50 : -50, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -50 : 50, opacity: 0 }),
  };

  return (
    <div className="w-full flex justify-center items-start min-h-[calc(100vh-100px)] py-4">
      {/* Modal de succès */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.8, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md w-full text-center relative overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-700">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-sky-500"></div>
              <div className="mx-auto w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6 text-emerald-500">
                <BadgeCheck size={48} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Employé Créé !</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8">Le dossier RH a été initialisé avec succès.</p>
              <div className="space-y-3">
                <button onClick={() => router.push('/employes')} className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-emerald-500/30">
                  Voir le dossier
                </button>
                <button onClick={() => window.location.reload()} className="w-full py-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-white font-bold rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                  Ajouter un autre
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-5xl bg-white dark:bg-gray-800/50 backdrop-blur-md rounded-3xl shadow-xl border border-gray-100 dark:border-white/5 overflow-hidden flex flex-col min-h-[600px]">
        {/* Stepper Header */}
        <div className="bg-white/80 dark:bg-gray-900/80 border-b border-gray-100 dark:border-white/5 relative z-10 backdrop-blur-md">
          <div className="flex items-center justify-between px-6 sm:px-12 py-6 relative max-w-3xl mx-auto">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 dark:bg-gray-700 -z-10 transform -translate-y-1/2" />
            {STEPS.map((step) => {
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;
              return (
                <div key={step.id} className="flex flex-col items-center bg-gray-50 dark:bg-gray-900 px-4 rounded-full py-1">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${isActive ? 'bg-sky-500 border-sky-500 text-white shadow-lg shadow-sky-500/30 scale-110' : isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400'}`}>
                    {isCompleted ? <Check size={24} /> : <step.icon size={24} />}
                  </div>
                  <span className={`mt-2 text-xs font-bold uppercase tracking-wider ${isActive ? 'text-sky-600 dark:text-sky-400' : 'text-gray-400'}`}>{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 sm:p-10 overflow-x-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div key={currentStep} custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="max-w-4xl mx-auto">
              {currentStep === 1 && <Step1Identity formData={formData} onInputChange={handleInputChange} onSelectChange={handleSelectChange} imageUpload={imageUpload} />}

              {currentStep === 2 && <Step2Contract formData={formData} onInputChange={handleInputChange} onSelectChange={handleSelectChange} departments={departments} />}

              {currentStep === 3 && <Step3Validation formData={formData} departments={departments} imagePreview={imageUpload.preview} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-white/80 dark:bg-gray-900/80 border-t border-gray-100 dark:border-white/5 backdrop-blur-md flex justify-between items-center">
          <button onClick={currentStep === 1 ? () => router.back() : prevStep} className="px-6 py-3 rounded-xl text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-100 dark:hover:bg-white/5 transition-colors flex items-center gap-2">
            {currentStep === 1 ? 'Annuler' : <><ChevronLeft size={18} /> Précédent</>}
          </button>

          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`w-2.5 h-2.5 rounded-full transition-colors ${s === currentStep ? 'bg-sky-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
            ))}
          </div>

          <button onClick={currentStep === 3 ? handleSubmit : nextStep} disabled={isLoading || (currentStep === 1 && imageUpload.uploading)} className="px-8 py-3 rounded-xl text-white font-bold bg-gray-900 dark:bg-white dark:text-gray-900 shadow-lg hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            {isLoading && <Loader2 className="animate-spin" size={18} />}
            {isLoading ? 'Traitement...' : currentStep === 3 ? 'Confirmer Création' : <>Suivant <ChevronRight size={18} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}