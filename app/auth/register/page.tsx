// 'use client';

// import React, { useState, useEffect } from 'react';
// import Link from 'next/link';
// import { useRouter } from 'next/navigation';
// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { useSearchParams } from 'next/navigation';
// import * as z from 'zod';
// import {
//   User, Check, ArrowRight, Mail, Lock, Eye, EyeOff,
//   Loader2, Hexagon, AlertCircle, Sparkles, Home,
//   Building2, Briefcase, Globe, Phone,
// } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { api } from '@/services/api';

// // ─── Schemas ─────────────────────────────────────────────────────────────────

// const baseSchema = z.object({
//   firstName: z.string().min(2, 'Prénom requis'),
//   lastName:  z.string().min(2, 'Nom requis'),
//   email:     z.string().email('Email invalide'),
//   password:  z.string().min(8, '8 caractères minimum'),
//   confirmPassword: z.string(),
//   accountType: z.enum(['COMPANY', 'CABINET']),
// });

// const companySchema = baseSchema.refine(
//   (d) => d.password === d.confirmPassword,
//   { message: 'Les mots de passe ne correspondent pas', path: ['confirmPassword'] },
// );

// const cabinetSchema = baseSchema.extend({
//   cabinetName: z.string().min(2, 'Nom du cabinet requis'),
//   subdomain: z
//     .string()
//     .min(3, '3 caractères minimum')
//     .regex(/^[a-z0-9-]+$/, 'Lettres minuscules, chiffres et tirets uniquement'),
//   cabinetPhone: z.string().optional(),
// }).refine(
//   (d) => d.password === d.confirmPassword,
//   { message: 'Les mots de passe ne correspondent pas', path: ['confirmPassword'] },
// );

// type FormData = z.infer<typeof cabinetSchema>;

// // ─── Helpers ──────────────────────────────────────────────────────────────────

// const Confetti = () => (
//   <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center z-50">
//     {Array.from({ length: 50 }).map((_, i) => (
//       <motion.div
//         key={i}
//         initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
//         animate={{
//           opacity: [1, 1, 0],
//           scale: Math.random() * 1 + 0.5,
//           x: (Math.random() - 0.5) * 600,
//           y: (Math.random() - 0.5) * 600,
//           rotate: Math.random() * 360,
//         }}
//         transition={{ duration: 2, ease: 'easeOut' }}
//         className={`absolute w-3 h-3 rounded-full ${
//           ['bg-cyan-500', 'bg-purple-500', 'bg-emerald-500', 'bg-pink-500'][
//             Math.floor(Math.random() * 4)
//           ]
//         }`}
//       />
//     ))}
//   </div>
// );

// const getPasswordStrength = (pass: string) => {
//   if (!pass) return 0;
//   let score = 0;
//   if (pass.length >= 8)          score += 25;
//   if (/[A-Z]/.test(pass))        score += 25;
//   if (/[0-9]/.test(pass))        score += 25;
//   if (/[^A-Za-z0-9]/.test(pass)) score += 25;
//   return score;
// };

// const inputClass =
//   'block w-full bg-black/20 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none transition-all py-3 px-4';

// const inputWithIconClass =
//   'block w-full bg-black/20 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none transition-all py-3 pl-11 pr-4';

// // ─── Page ─────────────────────────────────────────────────────────────────────

// export default function RegisterPage() {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const [step, setStep]               = useState<'type' | 'form' | 'success'>('type');
//   const [accountType, setAccountType] = useState<'COMPANY' | 'CABINET' | null>(null);
//   const [isLoading, setIsLoading]     = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const [errorMsg, setErrorMsg]       = useState('');

//   const form = useForm<FormData>({
//     resolver: zodResolver(accountType === 'CABINET' ? cabinetSchema : companySchema),
//     mode: 'onChange',
//     defaultValues: { accountType: 'COMPANY' },
//   });

//   const passwordValue = form.watch('password');
//   const subdomainValue = form.watch('subdomain') || '';
//   const strength = getPasswordStrength(passwordValue || '');

//   // ─── Affiliate ref tracking ───────────────────────────────────────────────
//   useEffect(() => {
//     const ref = searchParams.get('ref');
//     if (ref) {
//       localStorage.setItem('affiliate_ref', ref);
//     }
//   }, [searchParams]);

//   const selectType = (type: 'COMPANY' | 'CABINET') => {
//     setAccountType(type);
//     form.setValue('accountType', type);
//     setStep('form');
//   };

//   const onSubmit = async (data: FormData) => {
//     setIsLoading(true);
//     setErrorMsg('');

//     try {
//       const payload: any = {
//         firstName:   data.firstName,
//         lastName:    data.lastName,
//         email:       data.email,
//         password:    data.password,
//         accountType: data.accountType,
//       };

//       if (data.accountType === 'CABINET') {
//         payload.cabinetName  = data.cabinetName;
//         payload.subdomain    = data.subdomain;
//         payload.cabinetPhone = data.cabinetPhone;
//       }

//       const res: any = await api.post('/auth/register', payload);

//       localStorage.setItem('accessToken', res.access_token);
//       localStorage.setItem('refreshToken', res.refresh_token);
//       localStorage.setItem('user', JSON.stringify(res.user));

//       setStep('success');
//     } catch (err: any) {
//       setErrorMsg(err.message || "Une erreur est survenue lors de l'inscription.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleSuccess = () => {
//     const user = JSON.parse(localStorage.getItem('user') || '{}');
//     if (user.role === 'CABINET_ADMIN' || user.role === 'CABINET_GESTIONNAIRE') {
//       router.push(`/cabinet/${user.cabinetId}/dashboard`);
//     } else {
//       router.push('/companies/create');
//     }
//   };

//   const variants = {
//     enter: { opacity: 0, y: 16 },
//     center: { opacity: 1, y: 0 },
//     exit: { opacity: 0, y: -16 },
//   };

//   return (
//     <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">

//       {/* Background FX */}
//       <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-cyan-600/20 rounded-full blur-[120px]" />
//       <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-purple-600/20 rounded-full blur-[120px]" />

//       {/* Header */}
//       <div className="absolute top-6 left-6 z-20">
//         <Link href="/" className="flex items-center gap-2 group">
//           <div className="w-9 h-9 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.5)] group-hover:scale-105 transition-transform">
//             <Hexagon size={16} fill="currentColor" />
//           </div>
//           <span className="text-lg font-bold tracking-tight">Konza</span>
//         </Link>
//       </div>
//       <div className="absolute top-6 right-6 z-20">
//         <Link href="/" className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-gray-400 hover:text-white">
//           <Home size={18} />
//         </Link>
//       </div>

//       <div className="w-full max-w-lg relative z-10">

//         <AnimatePresence mode="wait">

//           {/* ── STEP 1 : Choix du type ── */}
//           {step === 'type' && (
//             <motion.div key="type" variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
//               <div className="text-center mb-8">
//                 <h1 className="text-3xl font-bold text-white">Créer un compte</h1>
//                 <p className="text-gray-400 mt-2 text-sm">Choisissez votre profil pour commencer</p>
//               </div>

//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

//                 {/* Entreprise */}
//                 <button
//                   onClick={() => selectType('COMPANY')}
//                   className="group bg-white/5 hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-500/50 rounded-2xl p-6 text-left transition-all duration-200 hover:scale-[1.02]"
//                 >
//                   <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-cyan-500/30 transition-colors">
//                     <Building2 size={22} className="text-cyan-400" />
//                   </div>
//                   <h3 className="text-white font-bold text-base mb-1">Je suis une entreprise</h3>
//                   <p className="text-gray-500 text-xs leading-relaxed">
//                     Gérez votre RH en interne — paie, employés, présences, congés.
//                   </p>
//                   <div className="mt-4 flex items-center gap-1 text-cyan-400 text-xs font-semibold">
//                     Commencer <ArrowRight size={14} />
//                   </div>
//                 </button>

//                 {/* Cabinet */}
//                 <button
//                   onClick={() => selectType('CABINET')}
//                   className="group bg-white/5 hover:bg-purple-500/10 border border-white/10 hover:border-purple-500/50 rounded-2xl p-6 text-left transition-all duration-200 hover:scale-[1.02]"
//                 >
//                   <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-500/30 transition-colors">
//                     <Briefcase size={22} className="text-purple-400" />
//                   </div>
//                   <h3 className="text-white font-bold text-base mb-1">Je suis un cabinet RH</h3>
//                   <p className="text-gray-500 text-xs leading-relaxed">
//                     Gérez la paie de vos PME clientes depuis un seul espace.
//                   </p>
//                   <div className="mt-4 flex items-center gap-1 text-purple-400 text-xs font-semibold">
//                     Essai gratuit 3 mois <Sparkles size={14} />
//                   </div>
//                 </button>
//               </div>

//               <p className="text-center text-xs text-gray-500 mt-6">
//                 Déjà un compte ?{' '}
//                 <Link href="/auth/login" className="text-cyan-400 hover:underline font-semibold">
//                   Se connecter
//                 </Link>
//               </p>
//             </motion.div>
//           )}

//           {/* ── STEP 2 : Formulaire ── */}
//           {step === 'form' && (
//             <motion.div key="form" variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>

//               {/* Badge type */}
//               <div className="flex items-center justify-between mb-6">
//                 <button
//                   onClick={() => setStep('type')}
//                   className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1"
//                 >
//                   ← Retour
//                 </button>
//                 <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${
//                   accountType === 'CABINET'
//                     ? 'text-purple-400 border-purple-500/40 bg-purple-500/10'
//                     : 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10'
//                 }`}>
//                   {accountType === 'CABINET' ? 'Cabinet RH' : 'Entreprise'}
//                 </span>
//               </div>

//               <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-2xl">
//                 <h2 className="text-xl font-bold text-white mb-5">
//                   {accountType === 'CABINET' ? 'Créer votre cabinet' : 'Créer votre compte'}
//                 </h2>

//                 <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

//                   {/* Prénom / Nom */}
//                   <div className="grid grid-cols-2 gap-3">
//                     <div>
//                       <input {...form.register('firstName')} className={inputClass} placeholder="Prénom" />
//                       {form.formState.errors.firstName && (
//                         <p className="text-xs text-red-400 mt-1">{form.formState.errors.firstName.message}</p>
//                       )}
//                     </div>
//                     <div>
//                       <input {...form.register('lastName')} className={inputClass} placeholder="Nom" />
//                       {form.formState.errors.lastName && (
//                         <p className="text-xs text-red-400 mt-1">{form.formState.errors.lastName.message}</p>
//                       )}
//                     </div>
//                   </div>

//                   {/* Champs cabinet uniquement */}
//                   {accountType === 'CABINET' && (
//                     <>
//                       <div className="relative group">
//                         <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
//                         <input {...form.register('cabinetName')} className={inputWithIconClass} placeholder="Nom du cabinet (ex: GL Conseil RH)" />
//                         {form.formState.errors.cabinetName && (
//                           <p className="text-xs text-red-400 mt-1">{form.formState.errors.cabinetName.message}</p>
//                         )}
//                       </div>

//                       <div>
//                         <div className="relative group">
//                           <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
//                           <input
//                             {...form.register('subdomain')}
//                             className={inputWithIconClass}
//                             placeholder="sous-domaine (ex: gl-conseil)"
//                           />
//                         </div>
//                         {subdomainValue && !form.formState.errors.subdomain && (
//                           <p className="text-xs text-purple-400 mt-1 ml-1">
//                             Votre portail : <span className="font-mono">{subdomainValue}.konza-rh.app</span>
//                           </p>
//                         )}
//                         {form.formState.errors.subdomain && (
//                           <p className="text-xs text-red-400 mt-1">{form.formState.errors.subdomain.message}</p>
//                         )}
//                       </div>

//                       <div className="relative group">
//                         <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
//                         <input {...form.register('cabinetPhone')} className={inputWithIconClass} placeholder="Téléphone (optionnel)" />
//                       </div>
//                     </>
//                   )}

//                   {/* Email */}
//                   <div className="relative group">
//                     <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
//                     <input {...form.register('email')} className={inputWithIconClass} placeholder="Email professionnel" />
//                     {form.formState.errors.email && (
//                       <p className="text-xs text-red-400 mt-1">{form.formState.errors.email.message}</p>
//                     )}
//                   </div>

//                   {/* Password */}
//                   <div>
//                     <div className="relative group">
//                       <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
//                       <input
//                         {...form.register('password')}
//                         type={showPassword ? 'text' : 'password'}
//                         className={`${inputWithIconClass} pr-10`}
//                         placeholder="Mot de passe"
//                       />
//                       <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
//                         {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
//                       </button>
//                     </div>
//                     {/* Barre de force */}
//                     <div className="flex gap-1 h-1 mt-2 rounded-full overflow-hidden bg-white/10">
//                       {[25, 50, 75, 100].map((threshold, i) => (
//                         <div key={i} className={`h-full w-1/4 transition-all duration-300 ${
//                           strength >= threshold
//                             ? ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500'][i]
//                             : ''
//                         }`} />
//                       ))}
//                     </div>
//                     {form.formState.errors.password && (
//                       <p className="text-xs text-red-400 mt-1">{form.formState.errors.password.message}</p>
//                     )}
//                   </div>

//                   {/* Confirm password */}
//                   <div>
//                     <input
//                       {...form.register('confirmPassword')}
//                       type="password"
//                       className={inputClass}
//                       placeholder="Confirmer le mot de passe"
//                     />
//                     {form.formState.errors.confirmPassword && (
//                       <p className="text-xs text-red-400 mt-1">{form.formState.errors.confirmPassword.message}</p>
//                     )}
//                   </div>

//                   {/* Erreur globale */}
//                   {errorMsg && (
//                     <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
//                       <AlertCircle size={14} /> {errorMsg}
//                     </div>
//                   )}

//                   {/* Submit */}
//                   <button
//                     type="submit"
//                     disabled={isLoading}
//                     className={`w-full flex justify-center items-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] disabled:opacity-50 ${
//                       accountType === 'CABINET'
//                         ? 'bg-gradient-to-r from-purple-500 to-purple-400 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]'
//                         : 'bg-gradient-to-r from-cyan-400 to-cyan-300 text-black shadow-[0_0_20px_rgba(6,182,212,0.3)]'
//                     }`}
//                   >
//                     {isLoading
//                       ? <Loader2 className="animate-spin" size={18} />
//                       : <>{accountType === 'CABINET' ? 'Créer mon cabinet' : 'Créer mon compte'} <ArrowRight size={16} /></>
//                     }
//                   </button>
//                 </form>
//               </div>

//               <p className="text-center text-xs text-gray-500 mt-4">
//                 Déjà un compte ?{' '}
//                 <Link href="/auth/login" className="text-cyan-400 hover:underline font-semibold">
//                   Se connecter
//                 </Link>
//               </p>
//             </motion.div>
//           )}

//           {/* ── STEP 3 : Succès ── */}
//           {step === 'success' && (
//             <motion.div key="success" initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12 relative">
//               <Confetti />

//               <motion.div
//                 initial={{ scale: 0 }}
//                 animate={{ scale: 1 }}
//                 transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
//                 className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
//                   accountType === 'CABINET'
//                     ? 'bg-purple-500/20 text-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.3)]'
//                     : 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]'
//                 }`}
//               >
//                 <Check size={44} strokeWidth={3} />
//               </motion.div>

//               <h2 className="text-3xl font-bold text-white mb-2">
//                 {accountType === 'CABINET' ? 'Cabinet créé !' : 'Bienvenue sur Konza !'}
//               </h2>
//               <p className="text-gray-400 text-sm mb-2 max-w-sm mx-auto">
//                 {accountType === 'CABINET'
//                   ? 'Votre cabinet est prêt. Vous avez 3 mois d\'accès gratuit au plan Growth.'
//                   : 'Votre compte a été créé. Configurez maintenant votre entreprise.'}
//               </p>

//               {accountType === 'CABINET' && (
//                 <p className="text-purple-400 text-xs font-mono mb-6">
//                   {form.getValues('subdomain')}.konza-rh.app
//                 </p>
//               )}

//               <button
//                 onClick={handleSuccess}
//                 className={`px-8 py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-105 flex items-center gap-2 mx-auto ${
//                   accountType === 'CABINET'
//                     ? 'bg-gradient-to-r from-purple-500 to-purple-400 text-white'
//                     : 'bg-gradient-to-r from-emerald-400 to-emerald-500 text-white'
//                 }`}
//               >
//                 {accountType === 'CABINET' ? 'Accéder à mon cabinet' : 'Créer mon entreprise'}
//                 <ArrowRight size={16} />
//               </button>
//             </motion.div>
//           )}

//         </AnimatePresence>
//       </div>
//     </div>
//   );
// }



'use client';

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'next/navigation';
import * as z from 'zod';
import {
  User, Check, ArrowRight, Mail, Lock, Eye, EyeOff,
  Loader2, Hexagon, AlertCircle, Sparkles, Home,
  Building2, Briefcase, Globe, Phone,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';

const baseSchema = z.object({
  firstName: z.string().min(2, 'Prénom requis'),
  lastName:  z.string().min(2, 'Nom requis'),
  email:     z.string().email('Email invalide'),
  password:  z.string().min(8, '8 caractères minimum'),
  confirmPassword: z.string(),
  accountType: z.enum(['COMPANY', 'CABINET']),
});

const companySchema = baseSchema.refine(
  (d) => d.password === d.confirmPassword,
  { message: 'Les mots de passe ne correspondent pas', path: ['confirmPassword'] },
);

const cabinetSchema = baseSchema.extend({
  cabinetName: z.string().min(2, 'Nom du cabinet requis'),
  subdomain: z
    .string()
    .min(3, '3 caractères minimum')
    .regex(/^[a-z0-9-]+$/, 'Lettres minuscules, chiffres et tirets uniquement'),
  cabinetPhone: z.string().optional(),
}).refine(
  (d) => d.password === d.confirmPassword,
  { message: 'Les mots de passe ne correspondent pas', path: ['confirmPassword'] },
);

type FormData = z.infer<typeof cabinetSchema>;

const Confetti = () => (
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
          rotate: Math.random() * 360,
        }}
        transition={{ duration: 2, ease: 'easeOut' }}
        className={`absolute w-3 h-3 rounded-full ${
          ['bg-cyan-500', 'bg-purple-500', 'bg-emerald-500', 'bg-pink-500'][
            Math.floor(Math.random() * 4)
          ]
        }`}
      />
    ))}
  </div>
);

const getPasswordStrength = (pass: string) => {
  if (!pass) return 0;
  let score = 0;
  if (pass.length >= 8)          score += 25;
  if (/[A-Z]/.test(pass))        score += 25;
  if (/[0-9]/.test(pass))        score += 25;
  if (/[^A-Za-z0-9]/.test(pass)) score += 25;
  return score;
};

const inputClass =
  'block w-full bg-black/20 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none transition-all py-3 px-4';

const inputWithIconClass =
  'block w-full bg-black/20 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none transition-all py-3 pl-11 pr-4';

// ─── Composant interne (utilise useSearchParams) ───────────────────────────────

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep]               = useState<'type' | 'form' | 'success'>('type');
  const [accountType, setAccountType] = useState<'COMPANY' | 'CABINET' | null>(null);
  const [isLoading, setIsLoading]     = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg]       = useState('');

  const form = useForm<FormData>({
    resolver: zodResolver(accountType === 'CABINET' ? cabinetSchema : companySchema),
    mode: 'onChange',
    defaultValues: { accountType: 'COMPANY' },
  });

  const passwordValue  = form.watch('password');
  const subdomainValue = form.watch('subdomain') || '';
  const strength       = getPasswordStrength(passwordValue || '');

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) localStorage.setItem('affiliate_ref', ref);
  }, [searchParams]);

  const selectType = (type: 'COMPANY' | 'CABINET') => {
    setAccountType(type);
    form.setValue('accountType', type);
    setStep('form');
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const payload: any = {
        firstName:   data.firstName,
        lastName:    data.lastName,
        email:       data.email,
        password:    data.password,
        accountType: data.accountType,
      };
      if (data.accountType === 'CABINET') {
        payload.cabinetName  = data.cabinetName;
        payload.subdomain    = data.subdomain;
        payload.cabinetPhone = data.cabinetPhone;
      }
      const res: any = await api.post('/auth/register', payload);
      localStorage.setItem('accessToken',  res.access_token);
      localStorage.setItem('refreshToken', res.refresh_token);
      localStorage.setItem('user',         JSON.stringify(res.user));
      setStep('success');
    } catch (err: any) {
      setErrorMsg(err.message || "Une erreur est survenue lors de l'inscription.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccess = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role === 'CABINET_ADMIN' || user.role === 'CABINET_GESTIONNAIRE') {
      router.push(`/cabinet/${user.cabinetId}/dashboard`);
    } else {
      router.push('/companies/create');
    }
  };

  const variants = {
    enter:  { opacity: 0, y: 16 },
    center: { opacity: 1, y: 0 },
    exit:   { opacity: 0, y: -16 },
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">

      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-cyan-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-purple-600/20 rounded-full blur-[120px]" />

      <div className="absolute top-6 left-6 z-20">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.5)] group-hover:scale-105 transition-transform">
            <Hexagon size={16} fill="currentColor" />
          </div>
          <span className="text-lg font-bold tracking-tight">Konza</span>
        </Link>
      </div>
      <div className="absolute top-6 right-6 z-20">
        <Link href="/" className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-gray-400 hover:text-white">
          <Home size={18} />
        </Link>
      </div>

      <div className="w-full max-w-lg relative z-10">
        <AnimatePresence mode="wait">

          {step === 'type' && (
            <motion.div key="type" variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white">Créer un compte</h1>
                <p className="text-gray-400 mt-2 text-sm">Choisissez votre profil pour commencer</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button onClick={() => selectType('COMPANY')} className="group bg-white/5 hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-500/50 rounded-2xl p-6 text-left transition-all duration-200 hover:scale-[1.02]">
                  <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-cyan-500/30 transition-colors">
                    <Building2 size={22} className="text-cyan-400" />
                  </div>
                  <h3 className="text-white font-bold text-base mb-1">Je suis une entreprise</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">Gérez votre RH en interne — paie, employés, présences, congés.</p>
                  <div className="mt-4 flex items-center gap-1 text-cyan-400 text-xs font-semibold">Commencer <ArrowRight size={14} /></div>
                </button>
                <button onClick={() => selectType('CABINET')} className="group bg-white/5 hover:bg-purple-500/10 border border-white/10 hover:border-purple-500/50 rounded-2xl p-6 text-left transition-all duration-200 hover:scale-[1.02]">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-500/30 transition-colors">
                    <Briefcase size={22} className="text-purple-400" />
                  </div>
                  <h3 className="text-white font-bold text-base mb-1">Je suis un cabinet RH</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">Gérez la paie de vos PME clientes depuis un seul espace.</p>
                  <div className="mt-4 flex items-center gap-1 text-purple-400 text-xs font-semibold">Essai gratuit 3 mois <Sparkles size={14} /></div>
                </button>
              </div>
              <p className="text-center text-xs text-gray-500 mt-6">
                Déjà un compte ?{' '}
                <Link href="/auth/login" className="text-cyan-400 hover:underline font-semibold">Se connecter</Link>
              </p>
            </motion.div>
          )}

          {step === 'form' && (
            <motion.div key="form" variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
              <div className="flex items-center justify-between mb-6">
                <button onClick={() => setStep('type')} className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1">← Retour</button>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${accountType === 'CABINET' ? 'text-purple-400 border-purple-500/40 bg-purple-500/10' : 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10'}`}>
                  {accountType === 'CABINET' ? 'Cabinet RH' : 'Entreprise'}
                </span>
              </div>

              <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-2xl">
                <h2 className="text-xl font-bold text-white mb-5">
                  {accountType === 'CABINET' ? 'Créer votre cabinet' : 'Créer votre compte'}
                </h2>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input {...form.register('firstName')} className={inputClass} placeholder="Prénom" />
                      {form.formState.errors.firstName && <p className="text-xs text-red-400 mt-1">{form.formState.errors.firstName.message}</p>}
                    </div>
                    <div>
                      <input {...form.register('lastName')} className={inputClass} placeholder="Nom" />
                      {form.formState.errors.lastName && <p className="text-xs text-red-400 mt-1">{form.formState.errors.lastName.message}</p>}
                    </div>
                  </div>

                  {accountType === 'CABINET' && (
                    <>
                      <div className="relative group">
                        <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                        <input {...form.register('cabinetName')} className={inputWithIconClass} placeholder="Nom du cabinet (ex: GL Conseil RH)" />
                        {form.formState.errors.cabinetName && <p className="text-xs text-red-400 mt-1">{form.formState.errors.cabinetName.message}</p>}
                      </div>
                      <div>
                        <div className="relative group">
                          <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                          <input {...form.register('subdomain')} className={inputWithIconClass} placeholder="sous-domaine (ex: gl-conseil)" />
                        </div>
                        {subdomainValue && !form.formState.errors.subdomain && (
                          <p className="text-xs text-purple-400 mt-1 ml-1">Votre portail : <span className="font-mono">{subdomainValue}.konza-rh.app</span></p>
                        )}
                        {form.formState.errors.subdomain && <p className="text-xs text-red-400 mt-1">{form.formState.errors.subdomain.message}</p>}
                      </div>
                      <div className="relative group">
                        <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                        <input {...form.register('cabinetPhone')} className={inputWithIconClass} placeholder="Téléphone (optionnel)" />
                      </div>
                    </>
                  )}

                  <div className="relative group">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                    <input {...form.register('email')} className={inputWithIconClass} placeholder="Email professionnel" />
                    {form.formState.errors.email && <p className="text-xs text-red-400 mt-1">{form.formState.errors.email.message}</p>}
                  </div>

                  <div>
                    <div className="relative group">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                      <input {...form.register('password')} type={showPassword ? 'text' : 'password'} className={`${inputWithIconClass} pr-10`} placeholder="Mot de passe" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <div className="flex gap-1 h-1 mt-2 rounded-full overflow-hidden bg-white/10">
                      {[25, 50, 75, 100].map((threshold, i) => (
                        <div key={i} className={`h-full w-1/4 transition-all duration-300 ${strength >= threshold ? ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500'][i] : ''}`} />
                      ))}
                    </div>
                    {form.formState.errors.password && <p className="text-xs text-red-400 mt-1">{form.formState.errors.password.message}</p>}
                  </div>

                  <div>
                    <input {...form.register('confirmPassword')} type="password" className={inputClass} placeholder="Confirmer le mot de passe" />
                    {form.formState.errors.confirmPassword && <p className="text-xs text-red-400 mt-1">{form.formState.errors.confirmPassword.message}</p>}
                  </div>

                  {errorMsg && (
                    <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                      <AlertCircle size={14} /> {errorMsg}
                    </div>
                  )}

                  <button
                    type="submit" disabled={isLoading}
                    className={`w-full flex justify-center items-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] disabled:opacity-50 ${
                      accountType === 'CABINET'
                        ? 'bg-gradient-to-r from-purple-500 to-purple-400 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                        : 'bg-gradient-to-r from-cyan-400 to-cyan-300 text-black shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                    }`}
                  >
                    {isLoading
                      ? <Loader2 className="animate-spin" size={18} />
                      : <>{accountType === 'CABINET' ? 'Créer mon cabinet' : 'Créer mon compte'} <ArrowRight size={16} /></>
                    }
                  </button>
                </form>
              </div>

              <p className="text-center text-xs text-gray-500 mt-4">
                Déjà un compte ?{' '}
                <Link href="/auth/login" className="text-cyan-400 hover:underline font-semibold">Se connecter</Link>
              </p>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12 relative">
              <Confetti />
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
                  accountType === 'CABINET'
                    ? 'bg-purple-500/20 text-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.3)]'
                    : 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]'
                }`}
              >
                <Check size={44} strokeWidth={3} />
              </motion.div>
              <h2 className="text-3xl font-bold text-white mb-2">
                {accountType === 'CABINET' ? 'Cabinet créé !' : 'Bienvenue sur Konza !'}
              </h2>
              <p className="text-gray-400 text-sm mb-2 max-w-sm mx-auto">
                {accountType === 'CABINET'
                  ? "Votre cabinet est prêt. Vous avez 3 mois d'accès gratuit au plan Growth."
                  : 'Votre compte a été créé. Configurez maintenant votre entreprise.'}
              </p>
              {accountType === 'CABINET' && (
                <p className="text-purple-400 text-xs font-mono mb-6">{form.getValues('subdomain')}.konza-rh.app</p>
              )}
              <button
                onClick={handleSuccess}
                className={`px-8 py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-105 flex items-center gap-2 mx-auto ${
                  accountType === 'CABINET'
                    ? 'bg-gradient-to-r from-purple-500 to-purple-400 text-white'
                    : 'bg-gradient-to-r from-emerald-400 to-emerald-500 text-white'
                }`}
              >
                {accountType === 'CABINET' ? 'Accéder à mon cabinet' : 'Créer mon entreprise'}
                <ArrowRight size={16} />
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Export avec Suspense boundary ────────────────────────────────────────────

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#020617]" />}>
      <RegisterForm />
    </Suspense>
  );
}