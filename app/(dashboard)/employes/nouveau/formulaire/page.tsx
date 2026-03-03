// 'use client';

// import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { 
//   User, Briefcase, Check, ChevronRight, ChevronLeft, Loader2, BadgeCheck,
//   ShieldCheck, Sparkles, Zap, Trophy, Star, Heart, Calendar, Building2
// } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { api } from '@/services/api';
// import { useAlert } from '@/components/providers/AlertProvider';
// import { useImageUpload } from '@/hooks/useImageUpload';
// import { Step1Identity } from '@/components/employees/create/Step1Identity';
// import { Step2Family } from '@/components/employees/create/Step2Family';
// import { Step3Contract } from '@/components/employees/create/Step3Contract';
// import { Step4UserAccount } from '@/components/employees/create/Step4UserAccount';
// import { Step5Validation } from '@/components/employees/create/Step5Validation';

// const STEPS = [
//   { id: 1, label: 'Identité', icon: User },
//   { id: 2, label: 'Famille & Fiscal', icon: Heart },
//   { id: 3, label: 'Contrat', icon: Briefcase },
//   { id: 4, label: 'Accès Système', icon: ShieldCheck },
//   { id: 5, label: 'Validation', icon: Check },
// ];

// const MOTIVATIONAL_MESSAGES = [
//   { step: 1, icon: Sparkles, message: "Excellent départ !" },
//   { step: 2, icon: Zap, message: "Continuez comme ça !" },
//   { step: 3, icon: Star, message: "Presque terminé !" },
//   { step: 4, icon: Trophy, message: "Dernière étape !" },
// ];

// export default function CreateEmployeePage() {
//   const router = useRouter();
//   const alert = useAlert();
//   const [currentStep, setCurrentStep] = useState(1);
//   const [direction, setDirection] = useState(0);
//   const [showSuccess, setShowSuccess] = useState(false);
//   const [showMotivation, setShowMotivation] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [departments, setDepartments] = useState<any[]>([]);

//   const handleDepartmentCreated = (newDept: any) => {
//   // Ajouter le nouveau département à la liste
//   setDepartments((prev) => [...prev, newDept]);
  
//   // Sélectionner automatiquement le nouveau département
//   setFormData((prev) => ({ ...prev, departmentId: newDept.id }));
// };

//   const imageUpload = useImageUpload();

//   const [formData, setFormData] = useState({
//     // IDENTITÉ
//     firstName: '',
//     lastName: '',
//     dateOfBirth: '',
//     placeOfBirth: '',
//     gender: 'MALE',
//     phone: '',
//     email: '',
//     address: '',
//     city: 'Brazzaville',
//     nationalIdNumber: '',
//     cnssNumber: '',
    
//     // FAMILLE & FISCAL
//     maritalStatus: 'SINGLE',
//     numberOfChildren: 0,
//     isSubjectToIrpp: true,
//     isSubjectToCnss: true,
//     taxExemptionReason: '',
    
//     // CONTRAT
//     hireDate: new Date().toISOString().split('T')[0],
//     contractType: 'CDI',
//     position: '',
//     departmentId: '',
//     baseSalary: '',
//     paymentMethod: 'CASH',
//     bankName: '',
//     bankAccountNumber: '',
//     mobileMoneyOperator: 'MTN',
//     mobileMoneyNumber: '',
    
//     // ACCÈS SYSTÈME
//     createUserAccount: false,
//     userRole: 'EMPLOYEE',
//     userPassword: '',
//   });

//   useEffect(() => {
//     const fetchDepts = async () => {
//       try {
//         const data = await api.get<any[]>('/departments');
//         setDepartments(data);
//         if (data.length > 0) {
//           setFormData((prev) => ({ ...prev, departmentId: data[0].id }));
//         }
//       } catch (e) {
//         console.error('Failed to load departments', e);
//         alert.error('Erreur', 'Impossible de charger les départements');
//       }
//     };
//     fetchDepts();
//   }, [alert]);

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleSelectChange = (name: string, value: any) => {
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   // Validations
//   const validateStep1 = (): boolean => {
//     const missing: string[] = [];
//     if (!formData.firstName.trim()) missing.push('Prénom');
//     if (!formData.lastName.trim()) missing.push('Nom');
//     if (!formData.dateOfBirth) missing.push('Date de naissance');
//     if (!formData.placeOfBirth.trim()) missing.push('Lieu de naissance');
//     if (!formData.phone.trim()) missing.push('Téléphone');
//     if (!formData.email.trim()) missing.push('Email');
//     if (!formData.address.trim()) missing.push('Adresse');

//     if (missing.length > 0) {
//       alert.error('Champs obligatoires manquants', `Veuillez remplir : ${missing.join(', ')}`);
//       return false;
//     }
//     return true;
//   };

//   const validateStep2 = (): boolean => {
//     if (!formData.isSubjectToIrpp && !formData.isSubjectToCnss && !formData.taxExemptionReason.trim()) {
//       alert.error('Raison requise', 'Veuillez préciser la raison de l\'exemption fiscale');
//       return false;
//     }
//     return true;
//   };

//   const validateStep3 = (): boolean => {
//     const missing: string[] = [];
//     if (!formData.position.trim()) missing.push('Poste');
//     if (!formData.departmentId) missing.push('Département');
//     if (!formData.baseSalary || parseFloat(formData.baseSalary) <= 0) {
//       missing.push('Salaire de base valide');
//     }

//     if (missing.length > 0) {
//       alert.error('Champs obligatoires manquants', `Veuillez remplir : ${missing.join(', ')}`);
//       return false;
//     }
//     return true;
//   };

//   const validateStep4 = (): boolean => {
//     if (formData.createUserAccount) {
//       if (!formData.userPassword || formData.userPassword.length < 6) {
//         alert.error('Mot de passe requis', 'Le mot de passe doit contenir au moins 6 caractères');
//         return false;
//       }
//     }
//     return true;
//   };

//   const nextStep = () => {
//     if (currentStep === 1 && !validateStep1()) return;
//     if (currentStep === 2 && !validateStep2()) return;
//     if (currentStep === 3 && !validateStep3()) return;
//     if (currentStep === 4 && !validateStep4()) return;

//     if (currentStep < 5) {
//       setDirection(1);
      
//       // Afficher la motivation APRÈS validation
//       if (currentStep > 0 && currentStep < 5) {
//         setShowMotivation(true);
//         setTimeout(() => {
//           setShowMotivation(false);
//           setCurrentStep((curr) => curr + 1);
//         }, 1500);
//       } else {
//         setCurrentStep((curr) => curr + 1);
//       }
//     }
//   };

//   const prevStep = () => {
//     if (currentStep > 1) {
//       setDirection(-1);
//       setCurrentStep((curr) => curr - 1);
//     }
//   };

//   const handleSubmit = async () => {
//     setIsLoading(true);
//     try {
//       const employeePayload = {
//         firstName: formData.firstName,
//         lastName: formData.lastName,
//         dateOfBirth: formData.dateOfBirth,
//         placeOfBirth: formData.placeOfBirth,
//         gender: formData.gender,
//         maritalStatus: formData.maritalStatus,
//         numberOfChildren: parseInt(formData.numberOfChildren as any) || 0,
//         phone: formData.phone,
//         email: formData.email,
//         address: formData.address,
//         city: formData.city,
//         nationalIdNumber: formData.nationalIdNumber.trim() || null,
//         cnssNumber: formData.cnssNumber.trim() || null,
//         hireDate: formData.hireDate,
//         contractType: formData.contractType,
//         position: formData.position,
//         departmentId: formData.departmentId,
//         baseSalary: parseFloat(formData.baseSalary),
//         paymentMethod: formData.paymentMethod,
//         bankName: formData.bankName,
//         bankAccountNumber: formData.bankAccountNumber,
//         mobileMoneyOperator: formData.mobileMoneyOperator,
//         mobileMoneyNumber: formData.mobileMoneyNumber,
//         photoUrl: imageUpload.uploadedUrl,
//         isSubjectToIrpp: formData.isSubjectToIrpp,
//         isSubjectToCnss: formData.isSubjectToCnss,
//         taxExemptionReason: formData.taxExemptionReason || null,
//       };

//       await api.post('/employees', employeePayload);

//       if (formData.createUserAccount) {
//         const userPayload = {
//           email: formData.email,
//           firstName: formData.firstName,
//           lastName: formData.lastName,
//           role: formData.userRole,
//           password: formData.userPassword,
//           departmentId: formData.userRole === 'MANAGER' ? formData.departmentId : undefined,
//         };
        
//         // ✅ TIMEOUT DE 15 SECONDES POUR ÉVITER LE BLOCAGE
//         const timeoutPromise = new Promise((_, reject) => 
//           setTimeout(() => reject(new Error('Timeout: L\'invitation a pris trop de temps')), 15000)
//         );
        
//         try {
//           await Promise.race([
//             api.post('/users/invite', userPayload),
//             timeoutPromise
//           ]);
//         } catch (inviteError: any) {
//           console.warn('Erreur invitation utilisateur:', inviteError.message);
//           // Ne pas bloquer la création si seulement l'email échoue
//           if (inviteError.message.includes('Timeout')) {
//             alert.warning('Compte créé', 'L\'employé a été créé mais l\'envoi de l\'email a échoué. Vous pouvez renvoyer l\'invitation plus tard.');
//           }
//         }
//       }

//       setIsLoading(false);
//       setShowSuccess(true);
//       alert.success('Employé créé !', 'Le dossier RH a été initialisé avec succès.');
//     } catch (error: any) {
//       console.error('Error creating employee', error);
//       setIsLoading(false);

//       if (error.response?.data?.fields) {
//         alert.error('Champs obligatoires manquants', `Veuillez vérifier : ${error.response.data.fields.join(', ')}`);
//       } else if (error.response?.data?.message) {
//         alert.error('Erreur', error.response.data.message);
//       } else {
//         alert.error('Erreur de création', 'Erreur lors de la création.');
//       }
//     }
//   };

//   const variants = {
//     enter: (dir: number) => ({ x: dir > 0 ? 50 : -50, opacity: 0 }),
//     center: { x: 0, opacity: 1 },
//     exit: (dir: number) => ({ x: dir > 0 ? -50 : 50, opacity: 0 }),
//   };

//   const currentMotivation = MOTIVATIONAL_MESSAGES.find(m => m.step === currentStep - 1);

//   return (
//     <div className="w-full flex justify-center items-start min-h-[calc(100vh-100px)] py-4 relative overflow-hidden">
      
//       {/* CONFETTI SUBTIL */}
//       {showMotivation && currentMotivation && (
//         <motion.div 
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           exit={{ opacity: 0 }}
//           className="fixed inset-0 z-40 pointer-events-none"
//         >
//           {[...Array(15)].map((_, i) => (
//             <motion.div
//               key={i}
//               initial={{ 
//                 x: Math.random() * window.innerWidth,
//                 y: -20,
//                 rotate: 0,
//                 opacity: 0.6
//               }}
//               animate={{ 
//                 y: window.innerHeight + 20,
//                 rotate: 360,
//                 opacity: 0
//               }}
//               transition={{ 
//                 duration: 2 + Math.random(),
//                 ease: "easeOut",
//                 delay: Math.random() * 0.3
//               }}
//               className="absolute"
//             >
//               <div className="w-2 h-2 rounded-full bg-cyan-400" />
//             </motion.div>
//           ))}
//         </motion.div>
//       )}

//       {/* MOTIVATION OVERLAY */}
//       <AnimatePresence>
//         {showMotivation && currentMotivation && (
//           <motion.div
//             initial={{ opacity: 0, scale: 0.9 }}
//             animate={{ opacity: 1, scale: 1 }}
//             exit={{ opacity: 0, scale: 0.9 }}
//             className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm pointer-events-none"
//           >
//             <div className="glass-panel rounded-3xl p-10 shadow-2xl">
//               <div className="flex flex-col items-center gap-4">
//                 <currentMotivation.icon className="text-cyan-400 animate-bounce" size={64} />
//                 <h2 className="text-3xl font-bold glow-text">
//                   {currentMotivation.message}
//                 </h2>
//               </div>
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* SUCCESS MODAL */}
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
//               className="glass-panel rounded-3xl p-8 max-w-md w-full text-center relative overflow-hidden shadow-2xl"
//             >
//               {/* Confetti subtil */}
//               <div className="absolute inset-0 pointer-events-none">
//                 {[...Array(20)].map((_, i) => (
//                   <motion.div
//                     key={i}
//                     initial={{ x: '50%', y: '50%', scale: 0 }}
//                     animate={{ 
//                       x: `${Math.random() * 100}%`,
//                       y: `${Math.random() * 100}%`,
//                       scale: [0, 1, 0]
//                     }}
//                     transition={{ duration: 1.5, delay: i * 0.03 }}
//                     className="absolute w-1.5 h-1.5 rounded-full bg-cyan-400"
//                   />
//                 ))}
//               </div>

//               <div className="mx-auto w-20 h-20 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center mb-6 text-cyan-500">
//                 <BadgeCheck size={48} />
//               </div>
//               <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Employé Créé !</h2>
//               <p className="text-slate-600 dark:text-slate-400 mb-8">
//                 {formData.createUserAccount 
//                   ? `${formData.firstName} ${formData.lastName} peut maintenant se connecter.`
//                   : 'Le dossier RH a été initialisé avec succès.'
//                 }
//               </p>
//               <div className="space-y-3">
//                 <button 
//                   onClick={() => router.push('/employes')} 
//                   className="w-full py-3 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-600 hover:to-sky-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/30"
//                 >
//                   Voir le dossier
//                 </button>
//                 <button 
//                   onClick={() => window.location.reload()} 
//                   className="w-full py-3 glass-card text-slate-700 dark:text-white font-bold rounded-xl transition-all"
//                 >
//                   Ajouter un autre
//                 </button>
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       <div className="w-full max-w-5xl glass-panel rounded-3xl shadow-xl overflow-hidden flex flex-col min-h-[600px]">
        
//         {/* STEPPER HEADER - STICKY */}
//         <div className="sticky top-0 z-20 glass-panel border-b border-white/10">
//           <div className="flex items-center justify-between px-6 sm:px-12 py-6 relative max-w-4xl mx-auto">
//             <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 dark:bg-white/10 -z-10 transform -translate-y-1/2" />
            
//             {STEPS.map((step) => {
//               const isActive = step.id === currentStep;
//               const isCompleted = step.id < currentStep;
              
//               return (
//                 <div key={step.id} className="flex flex-col items-center bg-slate-50 dark:bg-slate-900 px-3 rounded-full py-1">
//                   <motion.div 
//                     animate={{ scale: isActive ? 1.1 : 1 }}
//                     transition={{ duration: 0.3 }}
//                     className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
//                       isActive 
//                         ? 'bg-gradient-to-r from-cyan-500 to-sky-500 border-cyan-400 text-white shadow-lg shadow-cyan-500/30' 
//                         : isCompleted 
//                         ? 'bg-cyan-500 border-cyan-500 text-white' 
//                         : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-400'
//                     }`}
//                   >
//                     {isCompleted ? <Check size={24} /> : <step.icon size={24} />}
//                   </motion.div>
//                   <span className={`mt-2 text-xs font-bold uppercase tracking-wider hidden sm:block ${
//                     isActive ? 'glow-text' : 'text-slate-400'
//                   }`}>
//                     {step.label}
//                   </span>
//                 </div>
//               );
//             })}
//           </div>

//           {/* Progress bar */}
//           <div className="h-1 bg-slate-200 dark:bg-slate-700">
//             <motion.div 
//               className="h-full bg-gradient-to-r from-cyan-400 to-sky-500"
//               initial={{ width: 0 }}
//               animate={{ width: `${(currentStep / 5) * 100}%` }}
//               transition={{ duration: 0.5 }}
//             />
//           </div>
//         </div>

//         {/* CONTENT */}
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
//               {currentStep === 1 && <Step1Identity formData={formData} onInputChange={handleInputChange} onSelectChange={handleSelectChange} imageUpload={imageUpload} />}
//               {currentStep === 2 && <Step2Family formData={formData} onInputChange={handleInputChange} onSelectChange={handleSelectChange} />}
//               {currentStep === 3 && <Step3Contract formData={formData} onInputChange={handleInputChange} onSelectChange={handleSelectChange} onDepartmentCreated={handleDepartmentCreated}  departments={departments} />}
//               {currentStep === 4 && <Step4UserAccount formData={formData} onInputChange={handleInputChange} onSelectChange={handleSelectChange} departments={departments} />}
//               {currentStep === 5 && <Step5Validation formData={formData} departments={departments} imagePreview={imageUpload.preview} />}
//             </motion.div>
//           </AnimatePresence>
//         </div>

//         {/* FOOTER */}
//         <div className="p-6 glass-panel border-t border-white/10 flex justify-between items-center">
//           <button 
//             onClick={currentStep === 1 ? () => router.back() : prevStep} 
//             className="px-6 py-3 rounded-xl text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-white/5 transition-colors flex items-center gap-2"
//           >
//             {currentStep === 1 ? 'Annuler' : <><ChevronLeft size={18} /> Précédent</>}
//           </button>

//           <div className="flex gap-2">
//             {[1, 2, 3, 4, 5].map((s) => (
//               <div 
//                 key={s} 
//                 className={`h-2.5 rounded-full transition-all duration-300 ${
//                   s === currentStep 
//                     ? 'w-8 bg-gradient-to-r from-cyan-400 to-sky-500' 
//                     : s < currentStep 
//                     ? 'w-2.5 bg-cyan-500'
//                     : 'w-2.5 bg-slate-200 dark:bg-slate-700'
//                 }`} 
//               />
//             ))}
//           </div>

//           <button 
//             onClick={currentStep === 5 ? handleSubmit : nextStep} 
//             disabled={isLoading || (currentStep === 1 && imageUpload.uploading)}
//             className="px-8 py-3 rounded-xl text-white font-bold shadow-lg hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-600 hover:to-sky-600"
//           >
//             {isLoading && <Loader2 className="animate-spin" size={18} />}
//             {isLoading ? 'Traitement...' : currentStep === 5 ? 'Confirmer Création' : <>Suivant <ChevronRight size={18} /></>}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  User, Briefcase, Check, ChevronRight, ChevronLeft, Loader2, BadgeCheck,
  ShieldCheck, Heart, Sparkles, ArrowRight, Star,
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { api } from '@/services/api';
import { useAlert } from '@/components/providers/AlertProvider';
import { useImageUpload } from '@/hooks/useImageUpload';
import { Step1Identity } from '@/components/employees/create/Step1Identity';
import { Step2Family } from '@/components/employees/create/Step2Family';
import { Step3Contract } from '@/components/employees/create/Step3Contract';
import { Step4UserAccount } from '@/components/employees/create/Step4UserAccount';
import { Step5Validation } from '@/components/employees/create/Step5Validation';

// ─────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Identité',      icon: User },
  { id: 2, label: 'Famille',       icon: Heart },
  { id: 3, label: 'Contrat',       icon: Briefcase },
  { id: 4, label: 'Accès',         icon: ShieldCheck },
  { id: 5, label: 'Validation',    icon: Check },
];

// Messages waouh par étape (après validation réussie)
const STEP_CELEBRATIONS = [
  {
    step: 1,
    headline: 'Identité enregistrée',
    sub: 'Les bases sont posées.',
    accent: 'from-cyan-400 to-sky-500',
    particle: '✦',
  },
  {
    step: 2,
    headline: 'Situation familiale OK',
    sub: 'Fiscalité configurée avec soin.',
    accent: 'from-violet-400 to-purple-500',
    particle: '◆',
  },
  {
    step: 3,
    headline: 'Contrat défini',
    sub: 'Les conditions d\'emploi sont claires.',
    accent: 'from-emerald-400 to-teal-500',
    particle: '▲',
  },
  {
    step: 4,
    headline: 'Accès configuré',
    sub: 'Plus qu\'une étape pour finaliser.',
    accent: 'from-amber-400 to-orange-500',
    particle: '●',
  },
];

// ─────────────────────────────────────────────
// COMPOSANT PARTICLE FLOTTANT
// ─────────────────────────────────────────────

function FloatingParticle({
  char,
  delay,
  x,
  accent,
}: {
  char: string;
  delay: number;
  x: number;
  accent: string;
}) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 0, x, scale: 0.5 }}
      animate={{ opacity: [0, 1, 0], y: -120, scale: [0.5, 1.2, 0.3] }}
      transition={{ duration: 1.6, delay, ease: 'easeOut' }}
      className={`absolute bottom-0 text-lg font-bold bg-gradient-to-r ${accent} bg-clip-text text-transparent pointer-events-none select-none`}
      style={{ left: `${x}%` }}
    >
      {char}
    </motion.span>
  );
}

// ─────────────────────────────────────────────
// MOTIVATION OVERLAY — effet waouh
// ─────────────────────────────────────────────

function MotivationOverlay({
  show,
  step,
}: {
  show: boolean;
  step: number;
}) {
  const data = STEP_CELEBRATIONS.find((s) => s.step === step);
  if (!data) return null;

  const particles = Array.from({ length: 12 }, (_, i) => ({
    x: 5 + i * 8,
    delay: i * 0.07,
  }));

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        >
          {/* Backdrop très léger — ne bloque pas visuellement */}
          <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" />

          {/* Card centrale */}
          <motion.div
            initial={{ scale: 0.85, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: -10, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="relative bg-white dark:bg-slate-900 rounded-3xl px-14 py-10 shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden"
            style={{ boxShadow: '0 32px 80px -12px rgba(0,0,0,0.18)' }}
          >
            {/* Gradient streak en fond */}
            <div className={`absolute inset-0 bg-gradient-to-br ${data.accent} opacity-[0.06] rounded-3xl`} />

            {/* Ligne décorative gauche */}
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className={`absolute left-0 top-6 bottom-6 w-1 rounded-r-full bg-gradient-to-b ${data.accent}`}
              style={{ transformOrigin: 'top' }}
            />

            {/* Numéro d'étape */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className={`text-xs font-black uppercase tracking-[0.2em] bg-gradient-to-r ${data.accent} bg-clip-text text-transparent mb-3`}
            >
              Étape {step} / {STEPS.length - 1} complétée
            </motion.div>

            {/* Headline */}
            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1"
            >
              {data.headline}
            </motion.h2>

            {/* Sous-titre */}
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28 }}
              className="text-slate-500 dark:text-slate-400 text-base font-medium"
            >
              {data.sub}
            </motion.p>

            {/* Barre de progression */}
            <div className="mt-6 flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(step / 4) * 100}%` }}
                  transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
                  className={`h-full rounded-full bg-gradient-to-r ${data.accent}`}
                />
              </div>
              <span className={`text-xs font-black bg-gradient-to-r ${data.accent} bg-clip-text text-transparent`}>
                {Math.round((step / 4) * 100)}%
              </span>
            </div>

            {/* Particles flottantes */}
            <div className="absolute inset-0 overflow-hidden rounded-3xl">
              {particles.map((p, i) => (
                <FloatingParticle
                  key={i}
                  char={data.particle}
                  delay={p.delay}
                  x={p.x}
                  accent={data.accent}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────
// SUCCESS MODAL — cinématique
// ─────────────────────────────────────────────

function SuccessModal({
  show,
  firstName,
  lastName,
  hasAccount,
  fromCandidate,
  onGoToList,
  onAddAnother,
}: {
  show: boolean;
  firstName: string;
  lastName: string;
  hasAccount: boolean;
  fromCandidate: boolean;
  onGoToList: () => void;
  onAddAnother: () => void;
}) {
  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4"
        >
          <motion.div
            initial={{ scale: 0.75, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26, delay: 0.05 }}
            className="bg-white dark:bg-slate-900 rounded-[2rem] p-10 max-w-md w-full relative overflow-hidden"
            style={{ boxShadow: '0 40px 100px -20px rgba(0,0,0,0.3)' }}
          >
            {/* Fond coloré décoratif */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-sky-500/5" />

            {/* Cercle décoratif en haut à droite */}
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br from-cyan-400/10 to-sky-500/10" />
            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br from-cyan-400/15 to-sky-500/15" />

            {/* Confetti petits éléments */}
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ x: '50%', y: '40%', scale: 0, opacity: 1 }}
                animate={{
                  x: `${10 + Math.random() * 80}%`,
                  y: `${10 + Math.random() * 80}%`,
                  scale: [0, 1, 0],
                  opacity: [1, 1, 0],
                }}
                transition={{ duration: 1.2 + Math.random() * 0.6, delay: i * 0.04, ease: 'easeOut' }}
                className="absolute pointer-events-none"
              >
                <div
                  className="rounded-full"
                  style={{
                    width: 4 + Math.random() * 6,
                    height: 4 + Math.random() * 6,
                    background: ['#06b6d4', '#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b'][i % 5],
                  }}
                />
              </motion.div>
            ))}

            {/* Avatar animé */}
            <div className="flex justify-center mb-7 relative">
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}
                className="relative"
              >
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-400 to-sky-500 flex items-center justify-center text-white text-3xl font-black shadow-2xl shadow-cyan-500/30">
                  {initials || <User size={40} />}
                </div>
                {/* Badge check */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.45, stiffness: 400, damping: 20 }}
                  className="absolute -bottom-2 -right-2 w-9 h-9 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-900"
                >
                  <Check size={18} strokeWidth={3} className="text-white" />
                </motion.div>
              </motion.div>
            </div>

            {/* Texte */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="text-center mb-8"
            >
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">
                {firstName} {lastName}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-3">
                Dossier RH créé avec succès
              </p>
              {hasAccount && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  <Check size={12} strokeWidth={3} />
                  Accès système activé — email envoyé
                </div>
              )}
              {fromCandidate && (
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 rounded-xl text-xs font-bold text-cyan-700 dark:text-cyan-400">
                  <Star size={12} />
                  Candidat converti en employé
                </div>
              )}
            </motion.div>

            {/* Boutons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="space-y-3"
            >
              <button
                onClick={onGoToList}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-600 hover:to-sky-600 text-white font-bold rounded-2xl transition-all shadow-xl shadow-cyan-500/25 flex items-center justify-center gap-2 group"
              >
                Voir le dossier employé
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={onAddAnother}
                className="w-full py-3.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-2xl transition-colors border border-slate-200 dark:border-slate-700"
              >
                Créer un autre employé
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────
// INNER COMPONENT (lit les searchParams)
// ─────────────────────────────────────────────

function CreateEmployeeFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const alert = useAlert();
  const imageUpload = useImageUpload();

  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showMotivation, setShowMotivation] = useState(false);
  const [celebrationStep, setCelebrationStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);

  // ── Pré-remplissage depuis query params (venant du flux recrutement)
  const fromCandidate = searchParams.get('fromCandidate') || '';
  const prefill = {
    firstName:  searchParams.get('firstName')  || '',
    lastName:   searchParams.get('lastName')   || '',
    email:      searchParams.get('email')      || '',
    phone:      searchParams.get('phone')      || '',
    position:   searchParams.get('jobTitle')   || '',
  };

  const [formData, setFormData] = useState({
    // IDENTITÉ — pré-rempli si venant du recrutement
    firstName:        prefill.firstName,
    lastName:         prefill.lastName,
    dateOfBirth:      '',
    placeOfBirth:     '',
    gender:           'MALE',
    phone:            prefill.phone,
    email:            prefill.email,
    address:          '',
    city:             'Brazzaville',
    nationalIdNumber: '',
    cnssNumber:       '',
    // FAMILLE
    maritalStatus:    'SINGLE',
    numberOfChildren: 0,
    isSubjectToIrpp:  true,
    isSubjectToCnss:  true,
    taxExemptionReason: '',
    // CONTRAT — position pré-remplie
    hireDate:            new Date().toISOString().split('T')[0],
    contractType:        'CDI',
    position:            prefill.position,
    departmentId:        '',
    baseSalary:          '',
    paymentMethod:       'CASH',
    bankName:            '',
    bankAccountNumber:   '',
    mobileMoneyOperator: 'MTN',
    mobileMoneyNumber:   '',
    // ACCÈS
    createUserAccount: false,
    userRole:          'EMPLOYEE',
    userPassword:      '',
  });

  // Charger les départements
  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const data = await api.get<any[]>('/departments');
        setDepartments(data);
        if (data.length > 0) {
          setFormData((prev) => ({ ...prev, departmentId: data[0].id }));
        }
      } catch {
        alert.error('Erreur', 'Impossible de charger les départements');
      }
    };
    fetchDepts();
  }, []);

  const handleDepartmentCreated = (newDept: any) => {
    setDepartments((prev) => [...prev, newDept]);
    setFormData((prev) => ({ ...prev, departmentId: newDept.id }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ── Validations
  const validateStep1 = () => {
    const missing: string[] = [];
    if (!formData.firstName.trim()) missing.push('Prénom');
    if (!formData.lastName.trim()) missing.push('Nom');
    if (!formData.dateOfBirth) missing.push('Date de naissance');
    if (!formData.placeOfBirth.trim()) missing.push('Lieu de naissance');
    if (!formData.phone.trim()) missing.push('Téléphone');
    if (!formData.email.trim()) missing.push('Email');
    if (!formData.address.trim()) missing.push('Adresse');
    if (missing.length > 0) {
      alert.error('Champs manquants', `Veuillez remplir : ${missing.join(', ')}`);
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.isSubjectToIrpp && !formData.isSubjectToCnss && !formData.taxExemptionReason.trim()) {
      alert.error('Raison requise', 'Précisez la raison de l\'exemption fiscale');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    const missing: string[] = [];
    if (!formData.position.trim()) missing.push('Poste');
    if (!formData.departmentId) missing.push('Département');
    if (!formData.baseSalary || parseFloat(formData.baseSalary) <= 0) missing.push('Salaire valide');
    if (missing.length > 0) {
      alert.error('Champs manquants', `Veuillez remplir : ${missing.join(', ')}`);
      return false;
    }
    return true;
  };

  const validateStep4 = () => {
    if (formData.createUserAccount && (!formData.userPassword || formData.userPassword.length < 6)) {
      alert.error('Mot de passe requis', 'Minimum 6 caractères');
      return false;
    }
    return true;
  };

  const triggerCelebration = (step: number) => {
    setCelebrationStep(step);
    setShowMotivation(true);
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setShowMotivation(false);
        resolve();
      }, 1800);
    });
  };

  const nextStep = async () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep === 3 && !validateStep3()) return;
    if (currentStep === 4 && !validateStep4()) return;

    if (currentStep < 5) {
      setDirection(1);
      await triggerCelebration(currentStep);
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
      const payload = {
        firstName:          formData.firstName,
        lastName:           formData.lastName,
        dateOfBirth:        formData.dateOfBirth,
        placeOfBirth:       formData.placeOfBirth,
        gender:             formData.gender,
        maritalStatus:      formData.maritalStatus,
        numberOfChildren:   parseInt(formData.numberOfChildren as any) || 0,
        phone:              formData.phone,
        email:              formData.email,
        address:            formData.address,
        city:               formData.city,
        nationalIdNumber:   formData.nationalIdNumber.trim() || null,
        cnssNumber:         formData.cnssNumber.trim() || null,
        hireDate:           formData.hireDate,
        contractType:       formData.contractType,
        position:           formData.position,
        departmentId:       formData.departmentId,
        baseSalary:         parseFloat(formData.baseSalary),
        paymentMethod:      formData.paymentMethod,
        bankName:           formData.bankName,
        bankAccountNumber:  formData.bankAccountNumber,
        mobileMoneyOperator:formData.mobileMoneyOperator,
        mobileMoneyNumber:  formData.mobileMoneyNumber,
        photoUrl:           imageUpload.uploadedUrl,
        isSubjectToIrpp:    formData.isSubjectToIrpp,
        isSubjectToCnss:    formData.isSubjectToCnss,
        taxExemptionReason: formData.taxExemptionReason || null,
      };

      await api.post('/employees', payload);

      if (formData.createUserAccount) {
        const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 15000));
        try {
          await Promise.race([
            api.post('/users/invite', {
              email:        formData.email,
              firstName:    formData.firstName,
              lastName:     formData.lastName,
              role:         formData.userRole,
              password:     formData.userPassword,
              departmentId: formData.userRole === 'MANAGER' ? formData.departmentId : undefined,
            }),
            timeout,
          ]);
        } catch (e: any) {
          if (e.message === 'timeout') {
            alert.warning('Email différé', 'L\'employé est créé mais l\'envoi de l\'email a échoué. Renvoyez l\'invitation depuis la gestion des utilisateurs.');
          }
        }
      }

      setIsLoading(false);
      setShowSuccess(true);
    } catch (error: any) {
      setIsLoading(false);
      if (error.response?.data?.fields) {
        alert.error('Champs manquants', `Vérifiez : ${error.response.data.fields.join(', ')}`);
      } else {
        alert.error('Erreur', error.response?.data?.message || 'Erreur lors de la création');
      }
    }
  };

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
  };

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────

  return (
    <div className="w-full flex justify-center items-start min-h-[calc(100vh-100px)] py-4 relative overflow-hidden">

      {/* Overlay motivation waouh */}
      <MotivationOverlay show={showMotivation} step={celebrationStep} />

      {/* Success modal cinématique */}
      <SuccessModal
        show={showSuccess}
        firstName={formData.firstName}
        lastName={formData.lastName}
        hasAccount={formData.createUserAccount}
        fromCandidate={!!fromCandidate}
        onGoToList={() => router.push('/employes')}
        onAddAnother={() => window.location.reload()}
      />

      {/* Bannière candidat pré-rempli */}
      {fromCandidate && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-5 py-2.5 bg-cyan-600 text-white rounded-2xl shadow-xl shadow-cyan-500/30 text-sm font-bold"
        >
          <Sparkles size={15} className="shrink-0" />
          Formulaire pré-rempli depuis le dossier candidat
        </motion.div>
      )}

      <div className="w-full max-w-5xl glass-panel rounded-3xl shadow-xl overflow-hidden flex flex-col min-h-[600px]">

        {/* ── STEPPER HEADER ── */}
        <div className="sticky top-0 z-20 glass-panel border-b border-white/10">
          <div className="flex items-center justify-between px-6 sm:px-12 py-6 relative max-w-4xl mx-auto">

            {/* Ligne de fond */}
            <div className="absolute top-1/2 left-8 right-8 h-px bg-slate-200 dark:bg-white/10 -z-10 -translate-y-1/2" />

            {STEPS.map((step) => {
              const isActive    = step.id === currentStep;
              const isCompleted = step.id < currentStep;

              return (
                <div
                  key={step.id}
                  className="flex flex-col items-center bg-slate-50 dark:bg-slate-900 px-3 rounded-full py-1 transition-all"
                >
                  <motion.div
                    animate={{ scale: isActive ? 1.1 : 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-br from-cyan-500 to-sky-500 border-cyan-400 text-white shadow-lg shadow-cyan-500/30'
                        : isCompleted
                        ? 'bg-gradient-to-br from-cyan-400 to-sky-500 border-cyan-400 text-white'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-400'
                    }`}
                  >
                    {isCompleted ? <Check size={22} strokeWidth={3} /> : <step.icon size={22} />}
                  </motion.div>
                  <span className={`mt-2 text-xs font-bold uppercase tracking-wider hidden sm:block transition-colors ${
                    isActive
                      ? 'text-cyan-600 dark:text-cyan-400'
                      : isCompleted
                      ? 'text-slate-400'
                      : 'text-slate-300 dark:text-slate-600'
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Barre de progression fine */}
          <div className="h-0.5 bg-slate-100 dark:bg-slate-800">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-400 to-sky-500"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep - 1) / 4) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div className="flex-1 p-6 sm:p-10 overflow-x-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 300, damping: 30, duration: 0.3 }}
              className="max-w-4xl mx-auto"
            >
              {currentStep === 1 && (
                <Step1Identity
                  formData={formData}
                  onInputChange={handleInputChange}
                  onSelectChange={handleSelectChange}
                  imageUpload={imageUpload}
                />
              )}
              {currentStep === 2 && (
                <Step2Family
                  formData={formData}
                  onInputChange={handleInputChange}
                  onSelectChange={handleSelectChange}
                />
              )}
              {currentStep === 3 && (
                <Step3Contract
                  formData={formData}
                  onInputChange={handleInputChange}
                  onSelectChange={handleSelectChange}
                  departments={departments}
                  onDepartmentCreated={handleDepartmentCreated}
                />
              )}
              {currentStep === 4 && (
                <Step4UserAccount
                  formData={formData}
                  onInputChange={handleInputChange}
                  onSelectChange={handleSelectChange}
                  departments={departments}
                />
              )}
              {currentStep === 5 && (
                <Step5Validation
                  formData={formData}
                  departments={departments}
                  imagePreview={imageUpload.preview}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── FOOTER ── */}
        <div className="p-6 glass-panel border-t border-white/10 flex justify-between items-center">

          {/* Bouton retour */}
          <button
            onClick={currentStep === 1 ? () => router.back() : prevStep}
            className="px-6 py-3 rounded-xl text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-white/5 transition-colors flex items-center gap-2 text-sm"
          >
            {currentStep === 1 ? (
              'Annuler'
            ) : (
              <>
                <ChevronLeft size={17} />
                Précédent
              </>
            )}
          </button>

          {/* Dots indicateurs */}
          <div className="flex gap-1.5 items-center">
            {[1, 2, 3, 4, 5].map((s) => (
              <motion.div
                key={s}
                animate={{
                  width: s === currentStep ? 28 : 8,
                  opacity: s < currentStep ? 1 : s === currentStep ? 1 : 0.3,
                }}
                transition={{ duration: 0.3 }}
                className={`h-2 rounded-full ${
                  s <= currentStep
                    ? 'bg-gradient-to-r from-cyan-400 to-sky-500'
                    : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>

          {/* Bouton suivant / confirmer */}
          <button
            onClick={currentStep === 5 ? handleSubmit : nextStep}
            disabled={isLoading || (currentStep === 1 && imageUpload.uploading)}
            className={`px-8 py-3 rounded-xl text-white font-bold shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm ${
              currentStep === 5
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-500/25'
                : 'bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-600 hover:to-sky-600 shadow-cyan-500/25'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={17} />
                Création…
              </>
            ) : currentStep === 5 ? (
              <>
                <BadgeCheck size={17} />
                Confirmer la création
              </>
            ) : (
              <>
                Suivant
                <ChevronRight size={17} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// EXPORT — Suspense requis pour useSearchParams
// ─────────────────────────────────────────────

export default function CreateEmployeePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin text-cyan-500" size={36} />
        </div>
      }
    >
      <CreateEmployeeFormInner />
    </Suspense>
  );
}
