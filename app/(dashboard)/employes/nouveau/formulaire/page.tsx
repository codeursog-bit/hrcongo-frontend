'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, Briefcase, Check, ChevronRight, ChevronLeft, Loader2, BadgeCheck,
  ShieldCheck, Sparkles, Zap, Trophy, Star, Heart, Calendar, Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';
import { useAlert } from '@/components/providers/AlertProvider';
import { useImageUpload } from '@/hooks/useImageUpload';
import { Step1Identity } from '@/components/employees/create/Step1Identity';
import { Step2Family } from '@/components/employees/create/Step2Family';
import { Step3Contract } from '@/components/employees/create/Step3Contract';
import { Step4UserAccount } from '@/components/employees/create/Step4UserAccount';
import { Step5Validation } from '@/components/employees/create/Step5Validation';

const STEPS = [
  { id: 1, label: 'Identité', icon: User },
  { id: 2, label: 'Famille & Fiscal', icon: Heart },
  { id: 3, label: 'Contrat', icon: Briefcase },
  { id: 4, label: 'Accès Système', icon: ShieldCheck },
  { id: 5, label: 'Validation', icon: Check },
];

const MOTIVATIONAL_MESSAGES = [
  { step: 1, icon: Sparkles, message: "Excellent départ !" },
  { step: 2, icon: Zap, message: "Continuez comme ça !" },
  { step: 3, icon: Star, message: "Presque terminé !" },
  { step: 4, icon: Trophy, message: "Dernière étape !" },
];

export default function CreateEmployeePage() {
  const router = useRouter();
  const alert = useAlert();
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showMotivation, setShowMotivation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);

  const handleDepartmentCreated = (newDept: any) => {
  // Ajouter le nouveau département à la liste
  setDepartments((prev) => [...prev, newDept]);
  
  // Sélectionner automatiquement le nouveau département
  setFormData((prev) => ({ ...prev, departmentId: newDept.id }));
};

  const imageUpload = useImageUpload();

  const [formData, setFormData] = useState({
    // IDENTITÉ
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    placeOfBirth: '',
    gender: 'MALE',
    phone: '',
    email: '',
    address: '',
    city: 'Brazzaville',
    nationalIdNumber: '',
    cnssNumber: '',
    
    // FAMILLE & FISCAL
    maritalStatus: 'SINGLE',
    numberOfChildren: 0,
    isSubjectToIrpp: true,
    isSubjectToCnss: true,
    taxExemptionReason: '',
    
    // CONTRAT
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
    
    // ACCÈS SYSTÈME
    createUserAccount: false,
    userRole: 'EMPLOYEE',
    userPassword: '',
  });

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

  const handleSelectChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Validations
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

  const validateStep2 = (): boolean => {
    if (!formData.isSubjectToIrpp && !formData.isSubjectToCnss && !formData.taxExemptionReason.trim()) {
      alert.error('Raison requise', 'Veuillez préciser la raison de l\'exemption fiscale');
      return false;
    }
    return true;
  };

  const validateStep3 = (): boolean => {
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

  const validateStep4 = (): boolean => {
    if (formData.createUserAccount) {
      if (!formData.userPassword || formData.userPassword.length < 6) {
        alert.error('Mot de passe requis', 'Le mot de passe doit contenir au moins 6 caractères');
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep === 3 && !validateStep3()) return;
    if (currentStep === 4 && !validateStep4()) return;

    if (currentStep < 5) {
      setDirection(1);
      
      // Afficher la motivation APRÈS validation
      if (currentStep > 0 && currentStep < 5) {
        setShowMotivation(true);
        setTimeout(() => {
          setShowMotivation(false);
          setCurrentStep((curr) => curr + 1);
        }, 1500);
      } else {
        setCurrentStep((curr) => curr + 1);
      }
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
      const employeePayload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        placeOfBirth: formData.placeOfBirth,
        gender: formData.gender,
        maritalStatus: formData.maritalStatus,
        numberOfChildren: parseInt(formData.numberOfChildren as any) || 0,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        city: formData.city,
        nationalIdNumber: formData.nationalIdNumber.trim() || null,
        cnssNumber: formData.cnssNumber.trim() || null,
        hireDate: formData.hireDate,
        contractType: formData.contractType,
        position: formData.position,
        departmentId: formData.departmentId,
        baseSalary: parseFloat(formData.baseSalary),
        paymentMethod: formData.paymentMethod,
        bankName: formData.bankName,
        bankAccountNumber: formData.bankAccountNumber,
        mobileMoneyOperator: formData.mobileMoneyOperator,
        mobileMoneyNumber: formData.mobileMoneyNumber,
        photoUrl: imageUpload.uploadedUrl,
        isSubjectToIrpp: formData.isSubjectToIrpp,
        isSubjectToCnss: formData.isSubjectToCnss,
        taxExemptionReason: formData.taxExemptionReason || null,
      };

      await api.post('/employees', employeePayload);

      if (formData.createUserAccount) {
        const userPayload = {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.userRole,
          password: formData.userPassword,
          departmentId: formData.userRole === 'MANAGER' ? formData.departmentId : undefined,
        };
        await api.post('/users/invite', userPayload);
      }

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
        alert.error('Erreur de création', 'Erreur lors de la création.');
      }
    }
  };

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 50 : -50, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -50 : 50, opacity: 0 }),
  };

  const currentMotivation = MOTIVATIONAL_MESSAGES.find(m => m.step === currentStep - 1);

  return (
    <div className="w-full flex justify-center items-start min-h-[calc(100vh-100px)] py-4 relative overflow-hidden">
      
      {/* CONFETTI SUBTIL */}
      {showMotivation && currentMotivation && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 pointer-events-none"
        >
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                x: Math.random() * window.innerWidth,
                y: -20,
                rotate: 0,
                opacity: 0.6
              }}
              animate={{ 
                y: window.innerHeight + 20,
                rotate: 360,
                opacity: 0
              }}
              transition={{ 
                duration: 2 + Math.random(),
                ease: "easeOut",
                delay: Math.random() * 0.3
              }}
              className="absolute"
            >
              <div className="w-2 h-2 rounded-full bg-cyan-400" />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* MOTIVATION OVERLAY */}
      <AnimatePresence>
        {showMotivation && currentMotivation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm pointer-events-none"
          >
            <div className="glass-panel rounded-3xl p-10 shadow-2xl">
              <div className="flex flex-col items-center gap-4">
                <currentMotivation.icon className="text-cyan-400 animate-bounce" size={64} />
                <h2 className="text-3xl font-bold glow-text">
                  {currentMotivation.message}
                </h2>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SUCCESS MODAL */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              className="glass-panel rounded-3xl p-8 max-w-md w-full text-center relative overflow-hidden shadow-2xl"
            >
              {/* Confetti subtil */}
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ x: '50%', y: '50%', scale: 0 }}
                    animate={{ 
                      x: `${Math.random() * 100}%`,
                      y: `${Math.random() * 100}%`,
                      scale: [0, 1, 0]
                    }}
                    transition={{ duration: 1.5, delay: i * 0.03 }}
                    className="absolute w-1.5 h-1.5 rounded-full bg-cyan-400"
                  />
                ))}
              </div>

              <div className="mx-auto w-20 h-20 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center mb-6 text-cyan-500">
                <BadgeCheck size={48} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Employé Créé !</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-8">
                {formData.createUserAccount 
                  ? `${formData.firstName} ${formData.lastName} peut maintenant se connecter.`
                  : 'Le dossier RH a été initialisé avec succès.'
                }
              </p>
              <div className="space-y-3">
                <button 
                  onClick={() => router.push('/employes')} 
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-600 hover:to-sky-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/30"
                >
                  Voir le dossier
                </button>
                <button 
                  onClick={() => window.location.reload()} 
                  className="w-full py-3 glass-card text-slate-700 dark:text-white font-bold rounded-xl transition-all"
                >
                  Ajouter un autre
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-5xl glass-panel rounded-3xl shadow-xl overflow-hidden flex flex-col min-h-[600px]">
        
        {/* STEPPER HEADER - STICKY */}
        <div className="sticky top-0 z-20 glass-panel border-b border-white/10">
          <div className="flex items-center justify-between px-6 sm:px-12 py-6 relative max-w-4xl mx-auto">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 dark:bg-white/10 -z-10 transform -translate-y-1/2" />
            
            {STEPS.map((step) => {
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;
              
              return (
                <div key={step.id} className="flex flex-col items-center bg-slate-50 dark:bg-slate-900 px-3 rounded-full py-1">
                  <motion.div 
                    animate={{ scale: isActive ? 1.1 : 1 }}
                    transition={{ duration: 0.3 }}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                      isActive 
                        ? 'bg-gradient-to-r from-cyan-500 to-sky-500 border-cyan-400 text-white shadow-lg shadow-cyan-500/30' 
                        : isCompleted 
                        ? 'bg-cyan-500 border-cyan-500 text-white' 
                        : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-400'
                    }`}
                  >
                    {isCompleted ? <Check size={24} /> : <step.icon size={24} />}
                  </motion.div>
                  <span className={`mt-2 text-xs font-bold uppercase tracking-wider hidden sm:block ${
                    isActive ? 'glow-text' : 'text-slate-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-slate-200 dark:bg-slate-700">
            <motion.div 
              className="h-full bg-gradient-to-r from-cyan-400 to-sky-500"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / 5) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 p-6 sm:p-10 overflow-x-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div 
              key={currentStep} 
              custom={direction} 
              variants={variants} 
              initial="enter" 
              animate="center" 
              exit="exit" 
              transition={{ type: 'spring', stiffness: 300, damping: 30 }} 
              className="max-w-4xl mx-auto"
            >
              {currentStep === 1 && <Step1Identity formData={formData} onInputChange={handleInputChange} onSelectChange={handleSelectChange} imageUpload={imageUpload} />}
              {currentStep === 2 && <Step2Family formData={formData} onInputChange={handleInputChange} onSelectChange={handleSelectChange} />}
              {currentStep === 3 && <Step3Contract formData={formData} onInputChange={handleInputChange} onSelectChange={handleSelectChange} onDepartmentCreated={handleDepartmentCreated}  departments={departments} />}
              {currentStep === 4 && <Step4UserAccount formData={formData} onInputChange={handleInputChange} onSelectChange={handleSelectChange} departments={departments} />}
              {currentStep === 5 && <Step5Validation formData={formData} departments={departments} imagePreview={imageUpload.preview} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* FOOTER */}
        <div className="p-6 glass-panel border-t border-white/10 flex justify-between items-center">
          <button 
            onClick={currentStep === 1 ? () => router.back() : prevStep} 
            className="px-6 py-3 rounded-xl text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-white/5 transition-colors flex items-center gap-2"
          >
            {currentStep === 1 ? 'Annuler' : <><ChevronLeft size={18} /> Précédent</>}
          </button>

          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <div 
                key={s} 
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  s === currentStep 
                    ? 'w-8 bg-gradient-to-r from-cyan-400 to-sky-500' 
                    : s < currentStep 
                    ? 'w-2.5 bg-cyan-500'
                    : 'w-2.5 bg-slate-200 dark:bg-slate-700'
                }`} 
              />
            ))}
          </div>

          <button 
            onClick={currentStep === 5 ? handleSubmit : nextStep} 
            disabled={isLoading || (currentStep === 1 && imageUpload.uploading)}
            className="px-8 py-3 rounded-xl text-white font-bold shadow-lg hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-600 hover:to-sky-600"
          >
            {isLoading && <Loader2 className="animate-spin" size={18} />}
            {isLoading ? 'Traitement...' : currentStep === 5 ? 'Confirmer Création' : <>Suivant <ChevronRight size={18} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}


// 'use client';

// import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { User, Briefcase, Check, ChevronRight, ChevronLeft, Loader2, BadgeCheck } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { api } from '@/services/api';
// import { useAlert } from '@/components/providers/AlertProvider';
// import { useImageUpload } from '@/hooks/useImageUpload';
// import { Step1Identity } from '@/components/employees/create/Step1Identity';
// import { Step2Contract } from '@/components/employees/create/Step2Contract';
// import { Step3Validation } from '@/components/employees/create/Step3Validation';

// const STEPS = [
//   { id: 1, label: 'Identité & Administratif', icon: User },
//   { id: 2, label: 'Contrat & Paiement', icon: Briefcase },
//   { id: 3, label: 'Validation', icon: Check },
// ];

// export default function CreateEmployeePage() {
//   const router = useRouter();
//   const alert = useAlert();
//   const [currentStep, setCurrentStep] = useState(1);
//   const [direction, setDirection] = useState(0);
//   const [showSuccess, setShowSuccess] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [departments, setDepartments] = useState<any[]>([]);

//   // Hook d'upload d'image
//   const imageUpload = useImageUpload();

//   // État du formulaire
//   const [formData, setFormData] = useState({
//     firstName: '',
//     lastName: '',
//     dateOfBirth: '',
//     placeOfBirth: '',
//     gender: 'MALE',
//     maritalStatus: 'SINGLE',
//     numberOfChildren: 0,
//     phone: '',
//     email: '',
//     address: '',
//     city: 'Brazzaville',
//     nationalIdNumber: '',
//     cnssNumber: '',
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
//   });

//   // Chargement des départements
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

//   const handleSelectChange = (name: string, value: string) => {
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   // Validation Step 1
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

//   // Validation Step 2
//   const validateStep2 = (): boolean => {
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

//   const nextStep = () => {
//     if (currentStep === 1 && !validateStep1()) return;
//     if (currentStep === 2 && !validateStep2()) return;

//     if (currentStep < 3) {
//       setDirection(1);
//       setCurrentStep((curr) => curr + 1);
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
//       await api.post('/employees', {
//         ...formData,
//         baseSalary: parseFloat(formData.baseSalary),
//         numberOfChildren: parseInt(formData.numberOfChildren as any) || 0,
//         photoUrl: imageUpload.uploadedUrl, // ✅ URL Cloudinary
//         nationalIdNumber: formData.nationalIdNumber.trim() || null,
//         cnssNumber: formData.cnssNumber.trim() || null,
//       });

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
//         alert.error('Erreur de création', 'Erreur lors de la création. Vérifiez que tous les champs obligatoires sont remplis');
//       }
//     }
//   };

//   const variants = {
//     enter: (dir: number) => ({ x: dir > 0 ? 50 : -50, opacity: 0 }),
//     center: { x: 0, opacity: 1 },
//     exit: (dir: number) => ({ x: dir > 0 ? -50 : 50, opacity: 0 }),
//   };

//   return (
//     <div className="w-full flex justify-center items-start min-h-[calc(100vh-100px)] py-4">
//       {/* Modal de succès */}
//       <AnimatePresence>
//         {showSuccess && (
//           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
//             <motion.div initial={{ scale: 0.8, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md w-full text-center relative overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-700">
//               <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-sky-500"></div>
//               <div className="mx-auto w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6 text-emerald-500">
//                 <BadgeCheck size={48} />
//               </div>
//               <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Employé Créé !</h2>
//               <p className="text-gray-500 dark:text-gray-400 mb-8">Le dossier RH a été initialisé avec succès.</p>
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
//             <motion.div key={currentStep} custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="max-w-4xl mx-auto">
//               {currentStep === 1 && <Step1Identity formData={formData} onInputChange={handleInputChange} onSelectChange={handleSelectChange} imageUpload={imageUpload} />}

//               {currentStep === 2 && <Step2Contract formData={formData} onInputChange={handleInputChange} onSelectChange={handleSelectChange} departments={departments} />}

//               {currentStep === 3 && <Step3Validation formData={formData} departments={departments} imagePreview={imageUpload.preview} />}
//             </motion.div>
//           </AnimatePresence>
//         </div>

//         {/* Footer Actions */}
//         <div className="p-6 bg-white/80 dark:bg-gray-900/80 border-t border-gray-100 dark:border-white/5 backdrop-blur-md flex justify-between items-center">
//           <button onClick={currentStep === 1 ? () => router.back() : prevStep} className="px-6 py-3 rounded-xl text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-100 dark:hover:bg-white/5 transition-colors flex items-center gap-2">
//             {currentStep === 1 ? 'Annuler' : <><ChevronLeft size={18} /> Précédent</>}
//           </button>

//           <div className="flex gap-2">
//             {[1, 2, 3].map((s) => (
//               <div key={s} className={`w-2.5 h-2.5 rounded-full transition-colors ${s === currentStep ? 'bg-sky-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
//             ))}
//           </div>

//           <button onClick={currentStep === 3 ? handleSubmit : nextStep} disabled={isLoading || (currentStep === 1 && imageUpload.uploading)} className="px-8 py-3 rounded-xl text-white font-bold bg-gray-900 dark:bg-white dark:text-gray-900 shadow-lg hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
//             {isLoading && <Loader2 className="animate-spin" size={18} />}
//             {isLoading ? 'Traitement...' : currentStep === 3 ? 'Confirmer Création' : <>Suivant <ChevronRight size={18} /></>}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }