// 'use client';

// import React, { useState } from 'react';
// import Link from 'next/link';
// import { useRouter } from 'next/navigation';
// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import * as z from 'zod';
// import { 
//   Building2, User, Check, ArrowRight, ArrowLeft, 
//   MapPin, Phone, Mail, Lock, Eye, EyeOff, Loader2,
//   Briefcase, Hexagon, AlertCircle, Sparkles, Home
// } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { api } from '@/services/api';

// // --- Validation Schemas ---

// const step1Schema = z.object({
//   firstName: z.string().min(2, "Prénom requis"),
//   lastName: z.string().min(2, "Nom requis"),
//   email: z.string().email("Email invalide"),
//   password: z.string().min(8, "8 caractères minimum"),
//   confirmPassword: z.string()
// }).refine((data) => data.password === data.confirmPassword, {
//   message: "Les mots de passe ne correspondent pas",
//   path: ["confirmPassword"],
// });

// const step2Schema = z.object({
//   companyName: z.string().min(2, "Le nom de l'entreprise est requis"),
//   rccm: z.string().optional(),
//   phone: z.string().min(9, "Numéro invalide"),
//   city: z.string().min(1, "Veuillez sélectionner une ville"),
//   sector: z.string().min(1, "Secteur requis"),
//   address: z.string().min(5, "Adresse requise"),
// });

// type Step1Data = z.infer<typeof step1Schema>;
// type Step2Data = z.infer<typeof step2Schema>;

// // --- Components ---

// const Confetti = () => {
//   return (
//     <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center z-50">
//       {Array.from({ length: 50 }).map((_, i) => (
//         <motion.div
//           key={i}
//           initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
//           animate={{ 
//             opacity: [1, 1, 0],
//             scale: Math.random() * 1 + 0.5,
//             x: (Math.random() - 0.5) * 600,
//             y: (Math.random() - 0.5) * 600,
//             rotate: Math.random() * 360
//           }}
//           transition={{ duration: 2, ease: "easeOut" }}
//           className={`absolute w-3 h-3 rounded-full ${
//             ['bg-cyan-500', 'bg-purple-500', 'bg-emerald-500', 'bg-pink-500'][Math.floor(Math.random() * 4)]
//           }`}
//         />
//       ))}
//     </div>
//   );
// };

// export default function RegisterPage() {
//   const router = useRouter();
//   const [step, setStep] = useState(1);
//   const [direction, setDirection] = useState(0);
//   const [isLoading, setIsLoading] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const [formData, setFormData] = useState<Partial<Step1Data & Step2Data>>({});
//   const [errorMsg, setErrorMsg] = useState('');

//   // Forms
//   const form1 = useForm<Step1Data>({ 
//     resolver: zodResolver(step1Schema), 
//     mode: 'onChange'
//   });
//   const form2 = useForm<Step2Data>({ resolver: zodResolver(step2Schema), mode: 'onChange' });

//   // Password Strength
//   const passwordValue = form1.watch('password');
//   const getPasswordStrength = (pass: string) => {
//     if (!pass) return 0;
//     let score = 0;
//     if (pass.length >= 8) score += 25;
//     if (/[A-Z]/.test(pass)) score += 25;
//     if (/[0-9]/.test(pass)) score += 25;
//     if (/[^A-Za-z0-9]/.test(pass)) score += 25;
//     return score;
//   };
//   const strength = getPasswordStrength(passwordValue || '');

//   // Handlers
//   const onStep1Submit = (data: Step1Data) => {
//     setFormData(prev => ({ ...prev, ...data }));
//     setDirection(1);
//     setStep(2);
//   };

//   const onStep2Submit = async (data: Step2Data) => {
//     setIsLoading(true);
//     setErrorMsg('');
//     const fullData = { ...formData, ...data }; 

//     try {
//         // 1. Create User FIRST
//         const authResponse: any = await api.post('/auth/register', {
//             email: fullData.email,
//             password: fullData.password,
//             firstName: fullData.firstName,
//             lastName: fullData.lastName
//         });

//         localStorage.setItem('accessToken', authResponse.access_token);
//         localStorage.setItem('user', JSON.stringify(authResponse.user));

//         // 2. Create Company AFTER (with token already set)
//         await api.post('/companies', {
//             legalName: fullData.companyName, 
//             rccmNumber: fullData.rccm || 'EN-COURS', 
//             address: fullData.address,
//             city: fullData.city,
//             country: 'CG',
//             phone: fullData.phone,
//             email: fullData.email,
//             industry: fullData.sector
//         });

//         setDirection(1);
//         setStep(3);
//     } catch (err: any) {
//         console.error("Registration error", err);
//         setErrorMsg(err.message || "Une erreur est survenue lors de l'inscription.");
//     } finally {
//         setIsLoading(false);
//     }
//   };

//   const goBack = () => {
//     setDirection(-1);
//     setStep(1);
//   };

//   const variants = {
//     enter: (dir: number) => ({ x: dir > 0 ? 50 : -50, opacity: 0 }),
//     center: { x: 0, opacity: 1 },
//     exit: (dir: number) => ({ x: dir > 0 ? -50 : 50, opacity: 0 }),
//   };

//   return (
//     <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      
//       {/* --- BACKGROUND FX --- */}
//       <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
//       <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-cyan-600/20 rounded-full blur-[120px] animate-aurora-1"></div>
//       <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-purple-600/20 rounded-full blur-[120px] animate-aurora-2"></div>

//       {/* --- HEADER --- */}
//       <div className="absolute top-6 left-6 z-20">
//         <Link href="/" className="flex items-center gap-3 group">
//           <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(6,182,212,0.5)] group-hover:scale-105 transition-transform">
//             <Hexagon size={20} fill="currentColor" />
//           </div>
//           <span className="text-xl font-bold tracking-tight">HRCongo</span>
//         </Link>
//       </div>

//       <div className="absolute top-6 right-6 z-20">
//         <Link href="/" className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-gray-400 hover:text-white">
//             <Home size={20} />
//         </Link>
//       </div>

//       <div className="w-full max-w-xl relative z-10">
        
//         {/* --- STEPPER --- */}
//         <div className="mb-10 mx-auto max-w-sm">
//           <div className="flex items-center justify-between relative">
//             <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/10 -z-10 transform -translate-y-1/2" />
            
//             {[1, 2, 3].map((s) => {
//               const isActive = s === step;
//               const isCompleted = s < step;
//               return (
//                 <div key={s} className="flex flex-col items-center gap-2">
//                   <motion.div 
//                     initial={false}
//                     animate={{ scale: isActive ? 1.2 : 1, backgroundColor: isActive ? '#06b6d4' : isCompleted ? '#10b981' : '#1e293b' }}
//                     className={`
//                       w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all duration-300 shadow-lg
//                       ${isActive ? 'border-cyan-400 text-white shadow-cyan-500/50' : ''}
//                       ${isCompleted ? 'border-emerald-500 text-white' : 'border-white/10 text-gray-500'}
//                     `}
//                   >
//                     {isCompleted ? <Check size={18} strokeWidth={3} /> : s === 1 ? <User size={18} /> : s === 2 ? <Building2 size={18} /> : <Sparkles size={18} />}
//                   </motion.div>
//                   <span className={`text-xs font-bold tracking-wider ${isActive ? 'text-cyan-400' : isCompleted ? 'text-emerald-400' : 'text-gray-500'}`}>
//                     {s === 1 ? 'COMPTE' : s === 2 ? 'ENTREPRISE' : 'SUCCÈS'}
//                   </span>
//                 </div>
//               );
//             })}
//           </div>
//         </div>

//         {/* --- MAIN CARD --- */}
//         <motion.div 
//             layout
//             className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
//         >
//           {/* Glass Reflection */}
//           <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>

//           <AnimatePresence mode="wait" custom={direction}>
            
//             {/* STEP 1 - COMPTE ADMIN */}
//             {step === 1 && (
//               <motion.div
//                 key="step1"
//                 custom={direction}
//                 variants={variants}
//                 initial="enter"
//                 animate="center"
//                 exit="exit"
//                 transition={{ type: 'spring', stiffness: 300, damping: 30 }}
//                 className="space-y-6"
//               >
//                 <div className="text-center mb-6">
//                   <h2 className="text-2xl font-bold text-white">Administrateur</h2>
//                   <p className="text-sm text-gray-400 mt-1">Créez vos accès sécurisés.</p>
//                 </div>

//                 <form onSubmit={form1.handleSubmit(onStep1Submit)} className="space-y-5">
//                   <div className="grid grid-cols-2 gap-4">
//                     <div>
//                       <input 
//                         {...form1.register('firstName')}
//                         className="block w-full px-4 py-3.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none" 
//                         placeholder="Prénom" 
//                       />
//                       {form1.formState.errors.firstName && <p className="text-xs text-red-400 mt-1 ml-1">{form1.formState.errors.firstName.message}</p>}
//                     </div>
//                     <div>
//                       <input 
//                         {...form1.register('lastName')}
//                         className="block w-full px-4 py-3.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none" 
//                         placeholder="Nom" 
//                       />
//                       {form1.formState.errors.lastName && <p className="text-xs text-red-400 mt-1 ml-1">{form1.formState.errors.lastName.message}</p>}
//                     </div>
//                   </div>

//                   <div className="relative group">
//                     <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" /></div>
//                     <input 
//                       {...form1.register('email')}
//                       className="block w-full pl-12 pr-4 py-3.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none" 
//                       placeholder="Email professionnel" 
//                     />
//                     {form1.formState.errors.email && <p className="text-xs text-red-400 mt-1 ml-1">{form1.formState.errors.email.message}</p>}
//                   </div>

//                   <div className="relative group">
//                     <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" /></div>
//                     <input 
//                       {...form1.register('password')}
//                       type={showPassword ? 'text' : 'password'}
//                       className="block w-full pl-12 pr-10 py-3.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none" 
//                       placeholder="Mot de passe" 
//                     />
//                     <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-white transition-colors">
//                         {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
//                     </button>
//                     {form1.formState.errors.password && <p className="text-xs text-red-400 mt-1 ml-1">{form1.formState.errors.password.message}</p>}
//                   </div>

//                   {/* Password Strength */}
//                   <div className="flex gap-1 h-1 w-full bg-white/10 rounded-full overflow-hidden">
//                       <div className={`h-full transition-all duration-300 ${strength > 0 ? 'bg-red-500' : ''}`} style={{ width: '25%' }}></div>
//                       <div className={`h-full transition-all duration-300 ${strength > 25 ? 'bg-orange-500' : ''}`} style={{ width: '25%' }}></div>
//                       <div className={`h-full transition-all duration-300 ${strength > 50 ? 'bg-yellow-500' : ''}`} style={{ width: '25%' }}></div>
//                       <div className={`h-full transition-all duration-300 ${strength > 75 ? 'bg-emerald-500' : ''}`} style={{ width: '25%' }}></div>
//                   </div>

//                   <div>
//                     <input 
//                       {...form1.register('confirmPassword')}
//                       type="password"
//                       className="block w-full px-4 py-3.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none" 
//                       placeholder="Confirmer mot de passe" 
//                     />
//                     {form1.formState.errors.confirmPassword && <p className="text-xs text-red-400 mt-1 ml-1">{form1.formState.errors.confirmPassword.message}</p>}
//                   </div>

//                   <div className="pt-4">
//                     <button
//                       type="submit"
//                       className="w-full flex justify-center items-center gap-2 py-4 px-4 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] text-sm font-bold text-black bg-gradient-to-r from-cyan-400 to-cyan-300 hover:to-white transition-all transform hover:scale-[1.02]"
//                     >
//                       Suivant <ArrowRight size={18} />
//                     </button>
//                   </div>
//                 </form>
//               </motion.div>
//             )}

//             {/* STEP 2 - ENTREPRISE */}
//             {step === 2 && (
//               <motion.div
//                 key="step2"
//                 custom={direction}
//                 variants={variants}
//                 initial="enter"
//                 animate="center"
//                 exit="exit"
//                 transition={{ type: 'spring', stiffness: 300, damping: 30 }}
//                 className="space-y-6"
//               >
//                 <div className="text-center mb-6">
//                   <h2 className="text-2xl font-bold text-white">Votre Structure</h2>
//                   <p className="text-sm text-gray-400 mt-1">Configurez l'identité de votre entreprise.</p>
//                 </div>

//                 <form onSubmit={form2.handleSubmit(onStep2Submit)} className="space-y-5">
//                   <div className="space-y-4">
//                     <div className="relative group">
//                       <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Building2 className="h-5 w-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" /></div>
//                       <input 
//                         {...form2.register('companyName')}
//                         className="block w-full pl-12 pr-4 py-3.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all outline-none" 
//                         placeholder="Nom de l'entreprise" 
//                       />
//                       {form2.formState.errors.companyName && <p className="text-xs text-red-400 mt-1 ml-1">{form2.formState.errors.companyName.message}</p>}
//                     </div>

//                     <div className="grid grid-cols-2 gap-4">
//                         <div className="relative group">
//                             <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><MapPin className="h-5 w-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" /></div>
//                             <select {...form2.register('city')} className="block w-full pl-12 pr-4 py-3.5 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none appearance-none cursor-pointer">
//                                 <option value="" className="bg-slate-900">Ville...</option>
//                                 <option value="Brazzaville" className="bg-slate-900">Brazzaville</option>
//                                 <option value="Pointe-Noire" className="bg-slate-900">Pointe-Noire</option>
//                                 <option value="Dolisie" className="bg-slate-900">Dolisie</option>
//                                 <option value="Oyo" className="bg-slate-900">Oyo</option>
//                             </select>
//                             {form2.formState.errors.city && <p className="text-xs text-red-400 mt-1 ml-1">{form2.formState.errors.city.message}</p>}
//                         </div>
//                         <div className="relative group">
//                             <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Briefcase className="h-5 w-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" /></div>
//                             <select {...form2.register('sector')} className="block w-full pl-12 pr-4 py-3.5 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none appearance-none cursor-pointer">
//                                 <option value="" className="bg-slate-900">Secteur...</option>
//                                 <option value="IT" className="bg-slate-900">IT & Tech</option>
//                                 <option value="Commerce" className="bg-slate-900">Commerce</option>
//                                 <option value="Finance" className="bg-slate-900">Finance</option>
//                                 <option value="Sante" className="bg-slate-900">Santé</option>
//                             </select>
//                             {form2.formState.errors.sector && <p className="text-xs text-red-400 mt-1 ml-1">{form2.formState.errors.sector.message}</p>}
//                         </div>
//                     </div>

//                     <div className="relative group">
//                       <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Phone className="h-5 w-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" /></div>
//                       <input 
//                         {...form2.register('phone')}
//                         className="block w-full pl-12 pr-4 py-3.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all outline-none" 
//                         placeholder="Téléphone (+242...)" 
//                       />
//                       {form2.formState.errors.phone && <p className="text-xs text-red-400 mt-1 ml-1">{form2.formState.errors.phone.message}</p>}
//                     </div>

//                     <div className="relative group">
//                       <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><MapPin className="h-5 w-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" /></div>
//                       <input 
//                         {...form2.register('address')}
//                         className="block w-full pl-12 pr-4 py-3.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all outline-none" 
//                         placeholder="Adresse Complète" 
//                       />
//                       {form2.formState.errors.address && <p className="text-xs text-red-400 mt-1 ml-1">{form2.formState.errors.address.message}</p>}
//                     </div>

//                     <div className="relative group">
//                       <input 
//                         {...form2.register('rccm')}
//                         className="block w-full px-4 py-3.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all outline-none font-mono text-sm" 
//                         placeholder="N° RCCM (Optionnel)" 
//                       />
//                     </div>
//                   </div>

//                   {errorMsg && (
//                     <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm flex items-center gap-2">
//                         <AlertCircle size={16} /> {errorMsg}
//                     </div>
//                   )}

//                   <div className="pt-4 flex gap-3">
//                     <button
//                       type="button"
//                       onClick={goBack}
//                       className="flex-1 py-3 border border-white/10 hover:bg-white/5 rounded-xl font-bold text-gray-400 hover:text-white transition-colors"
//                     >
//                       Retour
//                     </button>
//                     <button
//                       type="submit"
//                       disabled={isLoading}
//                       className="flex-1 py-3 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] text-sm font-bold text-black bg-gradient-to-r from-emerald-400 to-emerald-300 hover:to-white transition-all transform hover:scale-[1.02] flex justify-center items-center gap-2"
//                     >
//                       {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Créer Entreprise <Check size={18} /></>}
//                     </button>
//                   </div>
//                 </form>
//               </motion.div>
//             )}

//             {/* STEP 3 - SUCCÈS */}
//             {step === 3 && (
//               <motion.div
//                 key="step3"
//                 initial={{ opacity: 0, scale: 0.8 }}
//                 animate={{ opacity: 1, scale: 1 }}
//                 className="text-center py-12 relative"
//               >
//                 <Confetti />
                
//                 <motion.div 
//                   initial={{ scale: 0 }} 
//                   animate={{ scale: 1 }} 
//                   transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
//                   className="w-24 h-24 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
//                 >
//                   <Check size={48} strokeWidth={3} />
//                 </motion.div>

//                 <h2 className="text-3xl font-bold text-white mb-2">Bienvenue à bord !</h2>
//                 <p className="text-gray-400 mb-8 max-w-sm mx-auto">
//                   Votre espace HRCongo est configuré et prêt à l'emploi.
//                 </p>

//                 <div className="space-y-3 max-w-xs mx-auto">
//                   <button 
//                     onClick={() => router.push('/dashboard')}
//                     className="w-full py-4 bg-white text-black font-bold rounded-xl shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2"
//                   >
//                     Entrer dans le Dashboard <ArrowRight size={18} />
//                   </button>
//                   <p className="text-xs text-gray-500">Un email de confirmation a été envoyé à {formData.email}</p>
//                 </div>
//               </motion.div>
//             )}

//           </AnimatePresence>
//         </motion.div>

//         {/* Footer Login Link */}
//         {step < 3 && (
//           <div className="mt-6 text-center">
//             <p className="text-sm text-gray-500">
//               Vous avez déjà un compte ?{' '}
//               <Link href="/auth/login" className="font-bold text-cyan-400 hover:text-cyan-300 hover:underline transition-colors">
//                 Se connecter
//               </Link>
//             </p>
//           </div>
//         )}

//       </div>
//     </div>
//   );
// }


'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Building2, User, Check, ArrowRight, ArrowLeft, 
  MapPin, Phone, Mail, Lock, Eye, EyeOff, Loader2,
  Briefcase, Hexagon, AlertCircle, Sparkles, Home
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';

// --- Validation Schemas ---

const step1Schema = z.object({
  firstName: z.string().min(2, "Prénom requis"),
  lastName: z.string().min(2, "Nom requis"),
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "8 caractères minimum"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

const step2Schema = z.object({
  companyName: z.string().min(2, "Le nom de l'entreprise est requis"),
  rccm: z.string().optional(),
  phone: z.string().min(9, "Numéro invalide"),
  city: z.string().min(1, "Veuillez sélectionner une ville"),
  sector: z.string().min(1, "Secteur requis"),
  address: z.string().min(5, "Adresse requise"),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;

// --- Components ---

const Confetti = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center z-50">
      {Array.from({ length: 50 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
          animate={{ 
            opacity: [1, 1, 0],
            scale: Math.random() * 1 + 0.5,
            x: (Math.random() - 0.5) * 600,
            y: (Math.random() - 0.5) * 600,
            rotate: Math.random() * 360
          }}
          transition={{ duration: 2, ease: "easeOut" }}
          className={`absolute w-3 h-3 rounded-full ${
            ['bg-cyan-500', 'bg-purple-500', 'bg-emerald-500', 'bg-pink-500'][Math.floor(Math.random() * 4)]
          }`}
        />
      ))}
    </div>
  );
};

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<Partial<Step1Data & Step2Data>>({});
  const [errorMsg, setErrorMsg] = useState('');

  // Forms
  const form1 = useForm<Step1Data>({ 
    resolver: zodResolver(step1Schema), 
    mode: 'onChange'
  });
  const form2 = useForm<Step2Data>({ resolver: zodResolver(step2Schema), mode: 'onChange' });

  // Password Strength
  const passwordValue = form1.watch('password');
  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 8) score += 25;
    if (/[A-Z]/.test(pass)) score += 25;
    if (/[0-9]/.test(pass)) score += 25;
    if (/[^A-Za-z0-9]/.test(pass)) score += 25;
    return score;
  };
  const strength = getPasswordStrength(passwordValue || '');

  // Handlers
  const onStep1Submit = (data: Step1Data) => {
    setFormData(prev => ({ ...prev, ...data }));
    setDirection(1);
    setStep(2);
  };

  const onStep2Submit = async (data: Step2Data) => {
    setIsLoading(true);
    setErrorMsg('');
    const fullData = { ...formData, ...data }; 

    try {
        const authResponse: any = await api.post('/auth/register', {
            email: fullData.email,
            password: fullData.password,
            firstName: fullData.firstName,
            lastName: fullData.lastName
        });

        localStorage.setItem('accessToken', authResponse.access_token);
        localStorage.setItem('user', JSON.stringify(authResponse.user));

        await api.post('/companies', {
            legalName: fullData.companyName, 
            rccmNumber: fullData.rccm || 'EN-COURS', 
            address: fullData.address,
            city: fullData.city,
            country: 'CG',
            phone: fullData.phone,
            email: fullData.email,
            industry: fullData.sector
        });

        setDirection(1);
        setStep(3);
    } catch (err: any) {
        console.error("Registration error", err);
        setErrorMsg(err.message || "Une erreur est survenue lors de l'inscription.");
    } finally {
        setIsLoading(false);
    }
  };

  const goBack = () => {
    setDirection(-1);
    setStep(1);
  };

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 50 : -50, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -50 : 50, opacity: 0 }),
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden font-sans">
      
      {/* --- BACKGROUND FX --- */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-cyan-600/20 rounded-full blur-[120px] animate-aurora-1"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-purple-600/20 rounded-full blur-[120px] animate-aurora-2"></div>

      {/* --- HEADER --- */}
      <div className="absolute top-4 sm:top-6 left-4 sm:left-6 z-20">
        <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(6,182,212,0.5)] group-hover:scale-105 transition-transform">
            <Hexagon size={16} className="sm:w-5 sm:h-5" fill="currentColor" />
          </div>
          <span className="text-lg sm:text-xl font-bold tracking-tight">HRCongo</span>
        </Link>
      </div>

      <div className="absolute top-4 sm:top-6 right-4 sm:right-6 z-20">
        <Link href="/" className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-gray-400 hover:text-white">
            <Home size={18} className="sm:w-5 sm:h-5" />
        </Link>
      </div>

      <div className="w-full max-w-xl relative z-10 mt-16 sm:mt-20 md:mt-0">
        
        {/* --- STEPPER --- */}
        <div className="mb-6 sm:mb-8 md:mb-10 mx-auto max-w-xs sm:max-w-sm px-4">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/10 -z-10 transform -translate-y-1/2" />
            
            {[1, 2, 3].map((s) => {
              const isActive = s === step;
              const isCompleted = s < step;
              return (
                <div key={s} className="flex flex-col items-center gap-1.5 sm:gap-2">
                  <motion.div 
                    initial={false}
                    animate={{ scale: isActive ? 1.2 : 1, backgroundColor: isActive ? '#06b6d4' : isCompleted ? '#10b981' : '#1e293b' }}
                    className={`
                      w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border-2 transition-all duration-300 shadow-lg
                      ${isActive ? 'border-cyan-400 text-white shadow-cyan-500/50' : ''}
                      ${isCompleted ? 'border-emerald-500 text-white' : 'border-white/10 text-gray-500'}
                    `}
                  >
                    {isCompleted ? <Check size={16} className="sm:w-[18px] sm:h-[18px]" strokeWidth={3} /> : s === 1 ? <User size={16} className="sm:w-[18px] sm:h-[18px]" /> : s === 2 ? <Building2 size={16} className="sm:w-[18px] sm:h-[18px]" /> : <Sparkles size={16} className="sm:w-[18px] sm:h-[18px]" />}
                  </motion.div>
                  <span className={`text-[10px] sm:text-xs font-bold tracking-wider ${isActive ? 'text-cyan-400' : isCompleted ? 'text-emerald-400' : 'text-gray-500'}`}>
                    {s === 1 ? 'COMPTE' : s === 2 ? 'ENTREPRISE' : 'SUCCÈS'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* --- MAIN CARD --- */}
        <motion.div 
            layout
            className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden mx-4 sm:mx-0"
        >
          {/* Glass Reflection */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>

          <AnimatePresence mode="wait" custom={direction}>
            
            {/* STEP 1 - COMPTE ADMIN */}
            {step === 1 && (
              <motion.div
                key="step1"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="space-y-5 sm:space-y-6"
              >
                <div className="text-center mb-4 sm:mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Administrateur</h2>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">Créez vos accès sécurisés.</p>
                </div>

                <form onSubmit={form1.handleSubmit(onStep1Submit)} className="space-y-4 sm:space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <input 
                        {...form1.register('firstName')}
                        className="block w-full px-3 sm:px-4 py-3 sm:py-3.5 bg-black/20 border border-white/10 rounded-xl text-sm sm:text-base text-white placeholder-gray-500 focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none transition-all" 
                        placeholder="Prénom" 
                      />
                      {form1.formState.errors.firstName && <p className="text-xs text-red-400 mt-1 ml-1">{form1.formState.errors.firstName.message}</p>}
                    </div>
                    <div>
                      <input 
                        {...form1.register('lastName')}
                        className="block w-full px-3 sm:px-4 py-3 sm:py-3.5 bg-black/20 border border-white/10 rounded-xl text-sm sm:text-base text-white placeholder-gray-500 focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none transition-all" 
                        placeholder="Nom" 
                      />
                      {form1.formState.errors.lastName && <p className="text-xs text-red-400 mt-1 ml-1">{form1.formState.errors.lastName.message}</p>}
                    </div>
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none"><Mail className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" /></div>
                    <input 
                      {...form1.register('email')}
                      className="block w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-3.5 bg-black/20 border border-white/10 rounded-xl text-sm sm:text-base text-white placeholder-gray-500 focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none transition-all" 
                      placeholder="Email professionnel" 
                    />
                    {form1.formState.errors.email && <p className="text-xs text-red-400 mt-1 ml-1">{form1.formState.errors.email.message}</p>}
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none"><Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" /></div>
                    <input 
                      {...form1.register('password')}
                      type={showPassword ? 'text' : 'password'}
                      className="block w-full pl-10 sm:pl-12 pr-10 py-3 sm:py-3.5 bg-black/20 border border-white/10 rounded-xl text-sm sm:text-base text-white placeholder-gray-500 focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none transition-all" 
                      placeholder="Mot de passe" 
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-white transition-colors">
                        {showPassword ? <EyeOff size={16} className="sm:w-[18px] sm:h-[18px]" /> : <Eye size={16} className="sm:w-[18px] sm:h-[18px]" />}
                    </button>
                    {form1.formState.errors.password && <p className="text-xs text-red-400 mt-1 ml-1">{form1.formState.errors.password.message}</p>}
                  </div>

                  {/* Password Strength */}
                  <div className="flex gap-1 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-300 ${strength > 0 ? 'bg-red-500' : ''}`} style={{ width: '25%' }}></div>
                      <div className={`h-full transition-all duration-300 ${strength > 25 ? 'bg-orange-500' : ''}`} style={{ width: '25%' }}></div>
                      <div className={`h-full transition-all duration-300 ${strength > 50 ? 'bg-yellow-500' : ''}`} style={{ width: '25%' }}></div>
                      <div className={`h-full transition-all duration-300 ${strength > 75 ? 'bg-emerald-500' : ''}`} style={{ width: '25%' }}></div>
                  </div>

                  <div>
                    <input 
                      {...form1.register('confirmPassword')}
                      type="password"
                      className="block w-full px-3 sm:px-4 py-3 sm:py-3.5 bg-black/20 border border-white/10 rounded-xl text-sm sm:text-base text-white placeholder-gray-500 focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none transition-all" 
                      placeholder="Confirmer mot de passe" 
                    />
                    {form1.formState.errors.confirmPassword && <p className="text-xs text-red-400 mt-1 ml-1">{form1.formState.errors.confirmPassword.message}</p>}
                  </div>

                  <div className="pt-2 sm:pt-4">
                    <button
                      type="submit"
                      className="w-full flex justify-center items-center gap-2 py-3 sm:py-4 px-4 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] text-sm font-bold text-black bg-gradient-to-r from-cyan-400 to-cyan-300 hover:to-white transition-all transform hover:scale-[1.02]"
                    >
                      Suivant <ArrowRight size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* STEP 2 - ENTREPRISE */}
            {step === 2 && (
              <motion.div
                key="step2"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="space-y-5 sm:space-y-6"
              >
                <div className="text-center mb-4 sm:mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Votre Structure</h2>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">Configurez l'identité de votre entreprise.</p>
                </div>

                <form onSubmit={form2.handleSubmit(onStep2Submit)} className="space-y-4 sm:space-y-5">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none"><Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" /></div>
                      <input 
                        {...form2.register('companyName')}
                        className="block w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-3.5 bg-black/20 border border-white/10 rounded-xl text-sm sm:text-base text-white placeholder-gray-500 focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all outline-none" 
                        placeholder="Nom de l'entreprise" 
                      />
                      {form2.formState.errors.companyName && <p className="text-xs text-red-400 mt-1 ml-1">{form2.formState.errors.companyName.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none"><MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" /></div>
                            <select {...form2.register('city')} className="block w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-3.5 bg-black/20 border border-white/10 rounded-xl text-sm sm:text-base text-white focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none appearance-none cursor-pointer">
                                <option value="" className="bg-slate-900">Ville...</option>
                                <option value="Brazzaville" className="bg-slate-900">Brazzaville</option>
                                <option value="Pointe-Noire" className="bg-slate-900">Pointe-Noire</option>
                                <option value="Dolisie" className="bg-slate-900">Dolisie</option>
                                <option value="Oyo" className="bg-slate-900">Oyo</option>
                            </select>
                            {form2.formState.errors.city && <p className="text-xs text-red-400 mt-1 ml-1">{form2.formState.errors.city.message}</p>}
                        </div>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none"><Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" /></div>
                            <select {...form2.register('sector')} className="block w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-3.5 bg-black/20 border border-white/10 rounded-xl text-sm sm:text-base text-white focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none appearance-none cursor-pointer">
                                <option value="" className="bg-slate-900">Secteur...</option>
                                <option value="IT" className="bg-slate-900">IT & Tech</option>
                                <option value="Commerce" className="bg-slate-900">Commerce</option>
                                <option value="Finance" className="bg-slate-900">Finance</option>
                                <option value="Sante" className="bg-slate-900">Santé</option>
                            </select>
                            {form2.formState.errors.sector && <p className="text-xs text-red-400 mt-1 ml-1">{form2.formState.errors.sector.message}</p>}
                        </div>
                    </div>

                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none"><Phone className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" /></div>
                      <input 
                        {...form2.register('phone')}
                        className="block w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-3.5 bg-black/20 border border-white/10 rounded-xl text-sm sm:text-base text-white placeholder-gray-500 focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all outline-none" 
                        placeholder="Téléphone (+242...)" 
                      />
                      {form2.formState.errors.phone && <p className="text-xs text-red-400 mt-1 ml-1">{form2.formState.errors.phone.message}</p>}
                    </div>

                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none"><MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" /></div>
                      <input 
                        {...form2.register('address')}
                        className="block w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-3.5 bg-black/20 border border-white/10 rounded-xl text-sm sm:text-base text-white placeholder-gray-500 focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all outline-none" 
                        placeholder="Adresse Complète" 
                      />
                      {form2.formState.errors.address && <p className="text-xs text-red-400 mt-1 ml-1">{form2.formState.errors.address.message}</p>}
                    </div>

                    <div className="relative group">
                      <input 
                        {...form2.register('rccm')}
                        className="block w-full px-3 sm:px-4 py-3 sm:py-3.5 bg-black/20 border border-white/10 rounded-xl text-sm sm:text-base text-white placeholder-gray-500 focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all outline-none font-mono" 
                        placeholder="N° RCCM (Optionnel)" 
                      />
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-xs sm:text-sm flex items-center gap-2">
                        <AlertCircle size={16} /> {errorMsg}
                    </div>
                  )}

                  <div className="pt-2 sm:pt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={goBack}
                      className="flex-1 py-3 border border-white/10 hover:bg-white/5 rounded-xl font-bold text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      Retour
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-3 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] text-sm font-bold text-black bg-gradient-to-r from-emerald-400 to-emerald-300 hover:to-white transition-all transform hover:scale-[1.02] flex justify-center items-center gap-2"
                    >
                      {isLoading ? <Loader2 className="animate-spin" size={18} /> : <>Créer Entreprise <Check size={16} className="sm:w-[18px] sm:h-[18px]" /></>}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* STEP 3 - SUCCÈS */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8 sm:py-12 relative"
              >
                <Confetti />
                
                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                  className="w-20 h-20 sm:w-24 sm:h-24 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                >
                  <Check size={40} className="sm:w-12 sm:h-12" strokeWidth={3} />
                </motion.div>

                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Bienvenue à bord !</h2>
                <p className="text-sm sm:text-base text-gray-400 mb-6 sm:mb-8 max-w-sm mx-auto px-4">
                  Votre espace HRCongo est configuré et prêt à l'emploi.
                </p>

                <div className="space-y-3 max-w-xs mx-auto px-4">
                  <button 
                    onClick={() => router.push('/dashboard')}
                    className="w-full py-3 sm:py-4 bg-white text-black font-bold rounded-xl shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
>
Entrer dans le Dashboard <ArrowRight size={16} className="sm:w-[18px] sm:h-[18px]" />
</button>
<p className="text-xs text-gray-500">Un email de confirmation a été envoyé à {formData.email}</p>
</div>
</motion.div>
)}
</AnimatePresence>
    </motion.div>

    {/* Footer Login Link */}
    {step < 3 && (
      <div className="mt-4 sm:mt-6 text-center px-4">
        <p className="text-xs sm:text-sm text-gray-500">
          Vous avez déjà un compte ?{' '}
          <Link href="/auth/login" className="font-bold text-cyan-400 hover:text-cyan-300 hover:underline transition-colors">
            Se connecter
          </Link>
        </p>
      </div>
    )}

  </div>
</div>
);
}