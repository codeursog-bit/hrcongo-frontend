// // =============================================================================
// // FICHIER : app/auth/login/page.tsx
// // CHANGES v2 : ajout lecture callbackUrl (notifications push)
// //   - Import useSearchParams ajouté
// //   - 3 lignes ajoutées dans onSubmit et handlePasswordChangeSuccess
// //   Tout le reste est IDENTIQUE à ton fichier original.
// // =============================================================================

// // =============================================================================
// // FICHIER : app/auth/login/page.tsx
// // FIX : useSearchParams() wrappé dans Suspense (Next.js 14 requirement)
// // =============================================================================

// 'use client';

// import React, { useState, Suspense } from 'react';
// import Link from 'next/link';
// import { useRouter, useSearchParams } from 'next/navigation';
// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import * as z from 'zod';
// import {
//   Mail, Lock, ArrowRight, Loader2, CheckCircle2,
//   Hexagon, AlertCircle, Eye, EyeOff, Home, Shield,
// } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { api } from '@/services/api';
// import { authService } from '@/lib/services/authService';
// import { getRedirectUrl } from '@/lib/redirectAfterLogin';

// // =============================================================================
// // TYPES & INTERFACES
// // =============================================================================

// interface LoginResponse {
//   status?: 'MUST_CHANGE_PASSWORD';
//   access_token?: string;
//   refresh_token?: string;
//   tempToken?: string;
//   user: {
//     id: string;
//     email: string;
//     firstName: string;
//     lastName: string;
//     role: string;
//     companyId?: string | null;
//     cabinetId?: string | null;
//   };
// }

// interface PasswordChangeResponse {
//   access_token: string;
//   refresh_token: string;
//   user: {
//     id: string;
//     email: string;
//     firstName: string;
//     lastName: string;
//     role: string;
//     companyId?: string | null;
//     cabinetId?: string | null;
//   };
// }

// // =============================================================================
// // SCHEMAS VALIDATION
// // =============================================================================

// const loginSchema = z.object({
//   email: z.string().email("Format d'email invalide").min(1, "L'email est requis"),
//   password: z.string().min(1, "Le mot de passe est requis"),
//   rememberMe: z.boolean().optional(),
// });

// const passwordChangeSchema = z.object({
//   newPassword: z
//     .string()
//     .min(8, "Au moins 8 caractères")
//     .regex(/[A-Z]/, "Au moins 1 majuscule")
//     .regex(/[a-z]/, "Au moins 1 minuscule")
//     .regex(/[0-9]/, "Au moins 1 chiffre"),
//   confirmPassword: z.string().min(1, "Confirmez votre mot de passe"),
// }).refine((data) => data.newPassword === data.confirmPassword, {
//   message: "Les mots de passe ne correspondent pas",
//   path: ["confirmPassword"],
// });

// type LoginFormValues = z.infer<typeof loginSchema>;
// type PasswordChangeValues = z.infer<typeof passwordChangeSchema>;

// // =============================================================================
// // COMPOSANT CRITÈRE MOT DE PASSE
// // =============================================================================

// function PasswordCriteria({ met, text }: { met: boolean; text: string }) {
//   return (
//     <div className="flex items-center gap-2 text-xs">
//       {met ? (
//         <CheckCircle2 className="text-green-400 shrink-0" size={14} />
//       ) : (
//         <div className="w-3.5 h-3.5 rounded-full border border-gray-600 shrink-0" />
//       )}
//       <span className={met ? 'text-green-400' : 'text-gray-500'}>{text}</span>
//     </div>
//   );
// }

// // =============================================================================
// // COMPOSANT MODAL CHANGEMENT MOT DE PASSE
// // =============================================================================

// interface ChangePasswordModalProps {
//   isOpen: boolean;
//   tempToken: string;
//   userInfo: { firstName: string; lastName: string };
//   onSuccess: (user: PasswordChangeResponse['user']) => void;
//   onCancel: () => void;
// }

// function ChangePasswordModal({
//   isOpen, tempToken, userInfo, onSuccess, onCancel,
// }: ChangePasswordModalProps) {
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [showNewPassword, setShowNewPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const [error, setError] = useState('');

//   const { register, handleSubmit, formState: { errors }, watch } = useForm<PasswordChangeValues>({
//     resolver: zodResolver(passwordChangeSchema),
//     mode: 'onChange',
//   });

//   const newPassword = watch('newPassword', '');

//   const getPasswordStrength = (password: string) => {
//     if (!password) return { strength: 0, label: '', color: '' };
//     let strength = 0;
//     if (password.length >= 8) strength += 25;
//     if (/[A-Z]/.test(password)) strength += 25;
//     if (/[a-z]/.test(password)) strength += 25;
//     if (/[0-9]/.test(password)) strength += 25;
//     if (strength <= 25) return { strength, label: 'Faible', color: 'bg-red-500' };
//     if (strength <= 50) return { strength, label: 'Moyen', color: 'bg-orange-500' };
//     if (strength <= 75) return { strength, label: 'Bon', color: 'bg-yellow-500' };
//     return { strength: 100, label: 'Excellent', color: 'bg-green-500' };
//   };

//   const passwordStrength = getPasswordStrength(newPassword);

//   const onSubmit = async (data: PasswordChangeValues) => {
//     setIsSubmitting(true);
//     setError('');
//     try {
//       const response = await api.post<PasswordChangeResponse>('/auth/force-password-change', {
//         tempToken,
//         newPassword: data.newPassword,
//       });
//       // Les tokens JWT sont dans les cookies HttpOnly — plus besoin de localStorage
//       localStorage.setItem('user', JSON.stringify(response.user));
//       onSuccess(response.user);
//     } catch (err: any) {
//       setError(err.message || "Erreur lors du changement de mot de passe");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   if (!isOpen) return null;

//   return (
//     <AnimatePresence>
//       <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
//         <motion.div
//           initial={{ opacity: 0, scale: 0.95, y: 20 }}
//           animate={{ opacity: 1, scale: 1, y: 0 }}
//           exit={{ opacity: 0, scale: 0.95, y: 20 }}
//           className="bg-gradient-to-br from-gray-900 to-black border-t sm:border border-cyan-500/20 rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-cyan-500/10 w-full sm:max-w-md max-h-[95vh] overflow-y-auto"
//         >
//           <div className="p-5 sm:p-8">
//             <div className="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-6">
//               <div className="p-2.5 sm:p-3 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-xl sm:rounded-2xl shrink-0">
//                 <Shield className="text-cyan-400" size={28} />
//               </div>
//               <div className="min-w-0">
//                 <h3 className="text-xl sm:text-2xl font-bold text-white truncate">Sécurisez votre compte</h3>
//                 <p className="text-xs sm:text-sm text-gray-400 truncate">Bienvenue {userInfo.firstName} !</p>
//               </div>
//             </div>

//             <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 sm:p-4 mb-5 sm:mb-6 flex gap-2 sm:gap-3">
//               <AlertCircle className="text-yellow-400 shrink-0 mt-0.5" size={18} />
//               <div className="text-xs sm:text-sm text-yellow-200 min-w-0">
//                 <p className="font-bold mb-1">Premier changement obligatoire</p>
//                 <p className="text-yellow-300/80">Pour votre sécurité, vous devez créer un nouveau mot de passe avant d'accéder à votre espace.</p>
//               </div>
//             </div>

//             {error && (
//               <motion.div
//                 initial={{ opacity: 0, height: 0 }}
//                 animate={{ opacity: 1, height: 'auto' }}
//                 className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2"
//               >
//                 <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={16} />
//                 <p className="text-xs sm:text-sm text-red-300">{error}</p>
//               </motion.div>
//             )}

//             <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
//               <div>
//                 <label className="block text-xs sm:text-sm font-bold text-gray-300 mb-2">
//                   Nouveau mot de passe
//                 </label>
//                 <div className="relative">
//                   <Lock className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
//                   <input
//                     {...register('newPassword')}
//                     type={showNewPassword ? 'text' : 'password'}
//                     className={`w-full pl-10 sm:pl-12 pr-11 sm:pr-12 py-2.5 sm:py-3 text-sm sm:text-base bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
//                       errors.newPassword
//                         ? 'border-red-500/50 focus:ring-red-500/20'
//                         : 'border-white/10 focus:ring-cyan-500/50'
//                     }`}
//                     placeholder="Minimum 8 caractères"
//                   />
//                   <button
//                     type="button"
//                     onClick={() => setShowNewPassword(!showNewPassword)}
//                     className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
//                   >
//                     {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
//                   </button>
//                 </div>

//                 {newPassword && (
//                   <div className="mt-2">
//                     <div className="flex justify-between text-xs mb-1">
//                       <span className="text-gray-400">Force du mot de passe</span>
//                       <span className={`font-bold ${passwordStrength.strength === 100 ? 'text-green-400' : 'text-gray-400'}`}>
//                         {passwordStrength.label}
//                       </span>
//                     </div>
//                     <div className="h-1.5 sm:h-2 bg-gray-800 rounded-full overflow-hidden">
//                       <motion.div
//                         initial={{ width: 0 }}
//                         animate={{ width: `${passwordStrength.strength}%` }}
//                         className={`h-full ${passwordStrength.color} transition-all duration-300`}
//                       />
//                     </div>
//                   </div>
//                 )}

//                 {errors.newPassword && (
//                   <p className="mt-1 text-xs text-red-400">{errors.newPassword.message}</p>
//                 )}

//                 <div className="mt-3 space-y-1">
//                   <PasswordCriteria met={newPassword.length >= 8} text="Au moins 8 caractères" />
//                   <PasswordCriteria met={/[A-Z]/.test(newPassword)} text="Une majuscule" />
//                   <PasswordCriteria met={/[a-z]/.test(newPassword)} text="Une minuscule" />
//                   <PasswordCriteria met={/[0-9]/.test(newPassword)} text="Un chiffre" />
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-xs sm:text-sm font-bold text-gray-300 mb-2">
//                   Confirmer le mot de passe
//                 </label>
//                 <div className="relative">
//                   <Lock className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
//                   <input
//                     {...register('confirmPassword')}
//                     type={showConfirmPassword ? 'text' : 'password'}
//                     className={`w-full pl-10 sm:pl-12 pr-11 sm:pr-12 py-2.5 sm:py-3 text-sm sm:text-base bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
//                       errors.confirmPassword
//                         ? 'border-red-500/50 focus:ring-red-500/20'
//                         : 'border-white/10 focus:ring-cyan-500/50'
//                     }`}
//                     placeholder="Retapez votre mot de passe"
//                   />
//                   <button
//                     type="button"
//                     onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//                     className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
//                   >
//                     {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
//                   </button>
//                 </div>
//                 {errors.confirmPassword && (
//                   <p className="mt-1 text-xs text-red-400">{errors.confirmPassword.message}</p>
//                 )}
//               </div>

//               <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2 sm:pt-4">
//                 <button
//                   type="button"
//                   onClick={onCancel}
//                   disabled={isSubmitting}
//                   className="flex-1 py-2.5 sm:py-3 border border-white/10 rounded-xl font-bold text-sm text-gray-300 hover:bg-white/5 transition-all disabled:opacity-50"
//                 >
//                   Annuler
//                 </button>
//                 <button
//                   type="submit"
//                   disabled={isSubmitting}
//                   className="flex-1 py-2.5 sm:py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-bold text-sm text-white hover:shadow-lg hover:shadow-cyan-500/50 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
//                 >
//                   {isSubmitting ? (
//                     <Loader2 className="animate-spin" size={18} />
//                   ) : (
//                     <>
//                       <CheckCircle2 size={18} />
//                       Valider
//                     </>
//                   )}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </motion.div>
//       </div>
//     </AnimatePresence>
//   );
// }

// // =============================================================================
// // INNER LOGIN CONTENT — contient useSearchParams, doit être dans <Suspense>
// // =============================================================================

// function LoginContent() {
//   const router       = useRouter();
//   const searchParams = useSearchParams();
//   const callbackUrl  = searchParams.get('callbackUrl');

//   const [isLoading, setIsLoading]                 = useState(false);
//   const [showPassword, setShowPassword]           = useState(false);
//   const [serverError, setServerError]             = useState('');
//   const [showPasswordModal, setShowPasswordModal] = useState(false);
//   const [tempToken, setTempToken]                 = useState('');
//   const [userInfo, setUserInfo]                   = useState({ firstName: '', lastName: '' });

//   const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
//     resolver: zodResolver(loginSchema),
//     mode: 'onChange',
//   });

//   const onSubmit = async (data: LoginFormValues) => {
//     setIsLoading(true);
//     setServerError('');

//     try {
//       const response = await api.post<LoginResponse>('/auth/login', {
//         email: data.email,
//         password: data.password,
//       });

//       if (response.user.role === 'SUPER_ADMIN') {
//         setServerError('⚠️ Les Super Admins doivent se connecter via /admin/login');
//         authService.logout();
//         setIsLoading(false);
//         return;
//       }

//       if (response.status === 'MUST_CHANGE_PASSWORD') {
//         if (response.tempToken) {
//           setTempToken(response.tempToken);
//           setUserInfo(response.user);
//           setShowPasswordModal(true);
//         }
//         setIsLoading(false);
//         return;
//       }

//       if (response.access_token && response.refresh_token) {
//         // Tokens en cookie HttpOnly — rien à stocker en localStorage

//         localStorage.setItem('user', JSON.stringify(response.user));
//         router.push(callbackUrl ?? getRedirectUrl(response.user as any));
//       } else {
//         throw new Error('Réponse du serveur invalide');
//       }

//     } catch (error: any) {
//       const errorMessage = error.message?.toLowerCase() || '';
//       if (errorMessage.includes('incorrect') || errorMessage.includes('invalid')) {
//         setServerError('❌ Email ou mot de passe incorrect');
//       } else if (errorMessage.includes('désactivé') || errorMessage.includes('disabled')) {
//         setServerError('🚫 Votre compte a été désactivé. Contactez votre administrateur.');
//       } else if (errorMessage.includes('réseau') || errorMessage.includes('network')) {
//         setServerError('🌐 Erreur de connexion. Vérifiez votre internet.');
//       } else if (errorMessage.includes('timeout')) {
//         setServerError('⏱️ Le serveur met trop de temps à répondre. Réessayez.');
//       } else {
//         setServerError(error.message || '⚠️ Une erreur est survenue. Réessayez.');
//       }
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handlePasswordChangeSuccess = (user: PasswordChangeResponse['user']) => {
//     setShowPasswordModal(false);
//     router.push(callbackUrl ?? getRedirectUrl(user as any));
//   };

//   const handlePasswordChangeCancel = () => {
//     setShowPasswordModal(false);
//     setTempToken('');
//     setUserInfo({ firstName: '', lastName: '' });
//   };

//   return (
//     <div className="flex min-h-screen min-h-[100dvh] w-full bg-[#020617] text-white font-sans overflow-x-hidden">

//       {/* Background FX */}
//       <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
//       <div className="fixed top-0 right-0 w-[300px] sm:w-[500px] lg:w-[800px] h-[300px] sm:h-[500px] lg:h-[800px] bg-cyan-600/10 rounded-full blur-[80px] lg:blur-[120px] animate-pulse"></div>
//       <div className="fixed bottom-0 left-0 w-[300px] sm:w-[500px] lg:w-[800px] h-[300px] sm:h-[500px] lg:h-[800px] bg-blue-600/10 rounded-full blur-[80px] lg:blur-[120px]"></div>

//       {/* LEFT SIDE: BRANDING (Desktop uniquement) */}
//       <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12 z-10">
//         <div className="relative z-10 text-center max-w-lg">
//           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-10 flex justify-center">
//             <div className="w-24 h-24 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl flex items-center justify-center text-white shadow-[0_0_40px_rgba(6,182,212,0.4)]">
//               <Hexagon size={56} fill="currentColor" />
//             </div>
//           </motion.div>
//           <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-6xl font-extrabold text-white mb-6 tracking-tight leading-tight">
//             Le Futur de la <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Gestion RH</span>
//           </motion.h1>
//           <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-xl text-gray-400 leading-relaxed">
//             Connectez-vous à l'écosystème le plus avancé pour les entreprises congolaises.
//           </motion.p>
//         </div>
//       </div>

//       {/* RIGHT SIDE: LOGIN FORM */}
//       <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 md:px-8 lg:px-20 xl:px-24 py-6 sm:py-8 md:py-12 relative z-10 min-h-screen min-h-[100dvh]">

//         <div className="absolute top-4 sm:top-6 right-4 sm:right-6 z-20">
//           <Link href="/" className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-xs sm:text-sm font-bold">
//             <Home size={14} className="sm:w-4 sm:h-4" />
//             <span className="hidden xs:inline">Accueil</span>
//           </Link>
//         </div>

//         <div className="w-full max-w-md mx-auto">
//           <div className="lg:hidden mb-6 sm:mb-8 flex justify-center">
//             <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
//               <Hexagon size={28} fill="currentColor" />
//             </div>
//           </div>

//           <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
//             <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Connexion</h2>
//             <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-gray-400">Heureux de vous revoir.</p>

//             <AnimatePresence>
//               {serverError && (
//                 <motion.div
//                   initial={{ opacity: 0, height: 0 }}
//                   animate={{ opacity: 1, height: 'auto' }}
//                   exit={{ opacity: 0, height: 0 }}
//                   className="mt-4 sm:mt-6 p-3 sm:p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2 sm:gap-3"
//                 >
//                   <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={16} />
//                   <p className="text-xs sm:text-sm text-red-300 font-medium">{serverError}</p>
//                 </motion.div>
//               )}
//             </AnimatePresence>

//             <form className="mt-6 sm:mt-8 space-y-4 sm:space-y-5" onSubmit={handleSubmit(onSubmit)}>
//               {/* Email */}
//               <div>
//                 <label className="block text-xs sm:text-sm font-bold text-gray-300 mb-1.5">Email</label>
//                 <div className="relative group">
//                   <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
//                     <Mail className={`h-4 w-4 sm:h-5 sm:w-5 transition-colors ${errors.email ? 'text-red-400' : 'text-gray-500 group-focus-within:text-cyan-400'}`} />
//                   </div>
//                   <input
//                     {...register('email')}
//                     type="email"
//                     className={`block w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3.5 text-sm sm:text-base bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-all ${
//                       errors.email
//                         ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
//                         : 'border-white/10 focus:border-cyan-500/50 focus:ring-cyan-500/50'
//                     }`}
//                     placeholder="admin@hrcongo.com"
//                   />
//                 </div>
//                 {errors.email && (
//                   <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
//                 )}
//               </div>

//               {/* Mot de passe */}
//               <div>
//                 <div className="flex items-center justify-between mb-1.5">
//                   <label className="block text-xs sm:text-sm font-bold text-gray-300">Mot de passe</label>
//                   <Link href="#" className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors">Oublié ?</Link>
//                 </div>
//                 <div className="relative group">
//                   <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
//                     <Lock className={`h-4 w-4 sm:h-5 sm:w-5 transition-colors ${errors.password ? 'text-red-400' : 'text-gray-500 group-focus-within:text-cyan-400'}`} />
//                   </div>
//                   <input
//                     {...register('password')}
//                     type={showPassword ? 'text' : 'password'}
//                     className={`block w-full pl-10 sm:pl-12 pr-11 sm:pr-12 py-2.5 sm:py-3.5 text-sm sm:text-base bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-all ${
//                       errors.password
//                         ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
//                         : 'border-white/10 focus:border-cyan-500/50 focus:ring-cyan-500/50'
//                     }`}
//                     placeholder="••••••••"
//                   />
//                   <button
//                     type="button"
//                     onClick={() => setShowPassword(!showPassword)}
//                     className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-gray-500 hover:text-white transition-colors"
//                   >
//                     {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
//                   </button>
//                 </div>
//                 {errors.password && (
//                   <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
//                 )}
//               </div>

//               {/* Mot de passe oublié */}
//               <div className="flex justify-end -mt-1 mb-1">
//                 <Link
//                   href="/auth/forgot-password"
//                   className="text-xs text-gray-400 hover:text-cyan-400 transition-colors"
//                 >
//                   Mot de passe oublié ?
//                 </Link>
//               </div>

//               {/* Bouton Submit */}
//               <button
//                 type="submit"
//                 disabled={isLoading}
//                 className="w-full flex justify-center items-center gap-2 py-3 sm:py-4 px-4 border border-transparent rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] text-sm font-bold text-black bg-gradient-to-r from-cyan-400 to-blue-500 hover:to-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all transform active:scale-[0.98]"
//               >
//                 {isLoading ? (
//                   <Loader2 className="animate-spin" size={18} />
//                 ) : (
//                   <>
//                     Se connecter <ArrowRight size={16} className="sm:w-[18px] sm:h-[18px]" />
//                   </>
//                 )}
//               </button>
//             </form>

//             <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-white/10 text-center">
//               <p className="text-xs sm:text-sm text-gray-400">
//                 Nouveau ici ?{' '}
//                 <Link href="/auth/register" className="font-bold text-cyan-400 hover:text-white transition-colors">
//                   Créer un compte
//                 </Link>
//               </p>
//             </div>
//           </motion.div>
//         </div>
//       </div>

//       {/* MODAL CHANGEMENT MOT DE PASSE */}
//       <ChangePasswordModal
//         isOpen={showPasswordModal}
//         tempToken={tempToken}
//         userInfo={userInfo}
//         onSuccess={handlePasswordChangeSuccess}
//         onCancel={handlePasswordChangeCancel}
//       />
//     </div>
//   );
// }

// // =============================================================================
// // PAGE EXPORT — wrapping LoginContent dans Suspense (fix Next.js 14)
// // =============================================================================

// export default function LoginPage() {
//   return (
//     <Suspense fallback={
//       <div className="flex min-h-screen w-full bg-[#020617] items-center justify-center">
//         <Loader2 className="animate-spin text-cyan-400" size={32} />
//       </div>
//     }>
//       <LoginContent />
//     </Suspense>
//   );
// }





// =============================================================================
// FICHIER : app/auth/login/page.tsx
// CHANGES : ajout gestion 2FA (modal code TOTP + trusted device cookie)
//           + codes de secours, logo Konza, layout amélioré
// =============================================================================

'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Mail, Lock, ArrowRight, Loader2, CheckCircle2,
  AlertCircle, Eye, EyeOff, Home, Shield, Smartphone, Key,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';
import { authService } from '@/lib/services/authService';
import { getRedirectUrl } from '@/lib/redirectAfterLogin';

// =============================================================================
// TYPES
// =============================================================================

interface LoginResponse {
  status?: 'MUST_CHANGE_PASSWORD' | 'REQUIRES_2FA';
  tempToken?: string;
  tempToken2fa?: string;
  user: {
    id: string; email: string;
    firstName: string; lastName: string;
    role: string;
    companyId?: string | null;
    cabinetId?: string | null;
    managedByCabinet?: boolean; // FIX: champ manquant — RH/EMPLOYEE PME cabinet
  };
}

interface PasswordChangeResponse {
  user: {
    id: string; email: string;
    firstName: string; lastName: string;
    role: string;
    companyId?: string | null;
    cabinetId?: string | null;
  };
}

// =============================================================================
// SCHEMAS
// =============================================================================

const loginSchema = z.object({
  email:      z.string().email("Format d'email invalide").min(1, "L'email est requis"),
  password:   z.string().min(1, "Le mot de passe est requis"),
  rememberMe: z.boolean().optional(),
});

const passwordChangeSchema = z.object({
  newPassword:     z.string().min(8, "Au moins 8 caractères")
    .regex(/[A-Z]/, "Au moins 1 majuscule")
    .regex(/[a-z]/, "Au moins 1 minuscule")
    .regex(/[0-9]/, "Au moins 1 chiffre"),
  confirmPassword: z.string().min(1, "Confirmez votre mot de passe"),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type LoginFormValues      = z.infer<typeof loginSchema>;
type PasswordChangeValues = z.infer<typeof passwordChangeSchema>;

// =============================================================================
// COMPOSANT : Critère mot de passe
// =============================================================================

function PasswordCriteria({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {met
        ? <CheckCircle2 className="text-green-400 shrink-0" size={14} />
        : <div className="w-3.5 h-3.5 rounded-full border border-gray-600 shrink-0" />
      }
      <span className={met ? 'text-green-400' : 'text-gray-500'}>{text}</span>
    </div>
  );
}

// =============================================================================
// COMPOSANT : Modal 2FA (code TOTP ou code de secours)
// =============================================================================

interface TwoFAModalProps {
  isOpen:       boolean;
  tempToken2fa: string;
  onSuccess:    (user: LoginResponse['user']) => void;
  onCancel:     () => void;
}

function TwoFAModal({ isOpen, tempToken2fa, onSuccess, onCancel }: TwoFAModalProps) {
  const [code, setCode]                 = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]               = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6) return;
    setIsSubmitting(true);
    setError('');
    try {
      const response = await api.post<{ user: LoginResponse['user'] }>(
        '/auth/2fa/validate',
        { tempToken2fa, code },
      );
      localStorage.setItem('user', JSON.stringify(response.user));
      onSuccess(response.user);
    } catch (err: any) {
      setError(err.message || 'Code invalide. Réessayez.');
      setCode('');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ Accepte chiffres ET lettres (codes de secours = A3F2B1C4)
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 8);
    setCode(val);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-gradient-to-br from-gray-900 to-black border-t sm:border border-cyan-500/20 rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-cyan-500/10 w-full sm:max-w-md"
        >
          <div className="p-6 sm:p-8">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-2xl shrink-0">
                <Smartphone className="text-cyan-400" size={28} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Vérification en 2 étapes</h3>
                <p className="text-xs text-gray-400 mt-0.5">Ouvrez votre application d'authentification</p>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-4 mb-6 space-y-3">
              <div className="flex items-start gap-2">
                <Smartphone size={15} className="text-cyan-400 shrink-0 mt-0.5" />
                <p className="text-sm text-cyan-200">
                  Entrez le code à <span className="font-bold text-cyan-400">6 chiffres</span> affiché
                  dans Google Authenticator, Authy ou Aegis.
                  Le code change toutes les <span className="font-bold">30 secondes</span>.
                </p>
              </div>

              {/* Séparateur */}
              <div className="border-t border-white/5 pt-3 flex items-start gap-2">
                <Key size={14} className="text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-200/70">
                  <span className="font-bold text-amber-400">Téléphone perdu ?</span> Entrez
                  l'un de vos <span className="font-bold">8 codes de secours</span> (format <code className="font-mono bg-white/5 px-1 rounded">A3F2B1C4</code>)
                  dans le même champ ci-dessous.
                </p>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2"
              >
                <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={16} />
                <p className="text-sm text-red-300">{error}</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Champ code OTP / code de secours */}
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">
                  Code d'authentification
                </label>
                <input
                  type="text"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={handleCodeChange}
                  placeholder="000000"
                  autoFocus
                  className="w-full text-center text-3xl font-mono tracking-[0.5em] py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                />
                <p className="text-xs text-gray-500 text-center mt-2">
                  Code TOTP (6 chiffres) ou code de secours (8 caractères)
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isSubmitting}
                  className="flex-1 py-3 border border-white/10 rounded-xl font-bold text-sm text-gray-300 hover:bg-white/5 transition-all disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || code.length < 6}
                  className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-bold text-sm text-white hover:shadow-lg hover:shadow-cyan-500/30 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {isSubmitting
                    ? <Loader2 className="animate-spin" size={18} />
                    : <><Shield size={16} /> Vérifier</>
                  }
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// =============================================================================
// COMPOSANT : Modal changement mot de passe
// =============================================================================

interface ChangePasswordModalProps {
  isOpen:    boolean;
  tempToken: string;
  userInfo:  { firstName: string; lastName: string };
  onSuccess: (user: PasswordChangeResponse['user']) => void;
  onCancel:  () => void;
}

function ChangePasswordModal({ isOpen, tempToken, userInfo, onSuccess, onCancel }: ChangePasswordModalProps) {
  const [isSubmitting, setIsSubmitting]             = useState(false);
  const [showNewPassword, setShowNewPassword]       = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError]                           = useState('');

  const { register, handleSubmit, formState: { errors }, watch } = useForm<PasswordChangeValues>({
    resolver: zodResolver(passwordChangeSchema),
    mode: 'onChange',
  });

  const newPassword = watch('newPassword', '');

  const getPasswordStrength = (p: string) => {
    if (!p) return { strength: 0, label: '', color: '' };
    let s = 0;
    if (p.length >= 8)   s += 25;
    if (/[A-Z]/.test(p)) s += 25;
    if (/[a-z]/.test(p)) s += 25;
    if (/[0-9]/.test(p)) s += 25;
    if (s <= 25) return { strength: s,   label: 'Faible',    color: 'bg-red-500' };
    if (s <= 50) return { strength: s,   label: 'Moyen',     color: 'bg-orange-500' };
    if (s <= 75) return { strength: s,   label: 'Bon',       color: 'bg-yellow-500' };
    return              { strength: 100, label: 'Excellent', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  const onSubmit = async (data: PasswordChangeValues) => {
    setIsSubmitting(true);
    setError('');
    try {
      const response = await api.post<PasswordChangeResponse>('/auth/force-password-change', {
        tempToken,
        newPassword: data.newPassword,
      });
      localStorage.setItem('user', JSON.stringify(response.user));
      onSuccess(response.user);
    } catch (err: any) {
      setError(err.message || "Erreur lors du changement de mot de passe");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-gradient-to-br from-gray-900 to-black border-t sm:border border-cyan-500/20 rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-cyan-500/10 w-full sm:max-w-md max-h-[95vh] overflow-y-auto"
        >
          <div className="p-5 sm:p-8">
            <div className="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-6">
              <div className="p-2.5 sm:p-3 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-xl sm:rounded-2xl shrink-0">
                <Shield className="text-cyan-400" size={28} />
              </div>
              <div className="min-w-0">
                <h3 className="text-xl sm:text-2xl font-bold text-white truncate">Sécurisez votre compte</h3>
                <p className="text-xs sm:text-sm text-gray-400 truncate">Bienvenue {userInfo.firstName} !</p>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 sm:p-4 mb-5 sm:mb-6 flex gap-2 sm:gap-3">
              <AlertCircle className="text-yellow-400 shrink-0 mt-0.5" size={18} />
              <div className="text-xs sm:text-sm text-yellow-200 min-w-0">
                <p className="font-bold mb-1">Premier changement obligatoire</p>
                <p className="text-yellow-300/80">Pour votre sécurité, vous devez créer un nouveau mot de passe avant d'accéder à votre espace.</p>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2"
              >
                <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={16} />
                <p className="text-xs sm:text-sm text-red-300">{error}</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-300 mb-2">Nouveau mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    {...register('newPassword')}
                    type={showNewPassword ? 'text' : 'password'}
                    className={`w-full pl-10 sm:pl-12 pr-11 sm:pr-12 py-2.5 sm:py-3 text-sm sm:text-base bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${errors.newPassword ? 'border-red-500/50 focus:ring-red-500/20' : 'border-white/10 focus:ring-cyan-500/50'}`}
                    placeholder="Minimum 8 caractères"
                  />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {newPassword && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">Force du mot de passe</span>
                      <span className={`font-bold ${passwordStrength.strength === 100 ? 'text-green-400' : 'text-gray-400'}`}>{passwordStrength.label}</span>
                    </div>
                    <div className="h-1.5 sm:h-2 bg-gray-800 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${passwordStrength.strength}%` }} className={`h-full ${passwordStrength.color} transition-all duration-300`} />
                    </div>
                  </div>
                )}
                {errors.newPassword && <p className="mt-1 text-xs text-red-400">{errors.newPassword.message}</p>}
                <div className="mt-3 space-y-1">
                  <PasswordCriteria met={newPassword.length >= 8} text="Au moins 8 caractères" />
                  <PasswordCriteria met={/[A-Z]/.test(newPassword)} text="Une majuscule" />
                  <PasswordCriteria met={/[a-z]/.test(newPassword)} text="Une minuscule" />
                  <PasswordCriteria met={/[0-9]/.test(newPassword)} text="Un chiffre" />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-300 mb-2">Confirmer le mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    {...register('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    className={`w-full pl-10 sm:pl-12 pr-11 sm:pr-12 py-2.5 sm:py-3 text-sm sm:text-base bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${errors.confirmPassword ? 'border-red-500/50 focus:ring-red-500/20' : 'border-white/10 focus:ring-cyan-500/50'}`}
                    placeholder="Retapez votre mot de passe"
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="mt-1 text-xs text-red-400">{errors.confirmPassword.message}</p>}
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2 sm:pt-4">
                <button type="button" onClick={onCancel} disabled={isSubmitting} className="flex-1 py-2.5 sm:py-3 border border-white/10 rounded-xl font-bold text-sm text-gray-300 hover:bg-white/5 transition-all disabled:opacity-50">Annuler</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 sm:py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-bold text-sm text-white hover:shadow-lg hover:shadow-cyan-500/50 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <><CheckCircle2 size={18} />Valider</>}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// =============================================================================
// INNER LOGIN CONTENT
// =============================================================================

function LoginContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl  = searchParams.get('callbackUrl');

  const [isLoading, setIsLoading]                 = useState(false);
  const [showPassword, setShowPassword]           = useState(false);
  const [serverError, setServerError]             = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [show2FAModal, setShow2FAModal]           = useState(false);
  const [tempToken, setTempToken]                 = useState('');
  const [tempToken2fa, setTempToken2fa]           = useState('');
  const [userInfo, setUserInfo]                   = useState({ firstName: '', lastName: '' });

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  });

  const redirectAfterLogin = (user: LoginResponse['user']) => {
    router.push(callbackUrl ?? getRedirectUrl(user as any));
  };

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setServerError('');
    try {
      const response = await api.post<LoginResponse>('/auth/login', {
        email:    data.email,
        password: data.password,
      });

      if (response.user?.role === 'SUPER_ADMIN') {
        setServerError('⚠️ Les Super Admins doivent se connecter via /admin/login');
        authService.logout();
        return;
      }

      // CAS 1 : changement de mot de passe obligatoire
      if (response.status === 'MUST_CHANGE_PASSWORD' && response.tempToken) {
        setTempToken(response.tempToken);
        setUserInfo(response.user);
        setShowPasswordModal(true);
        return;
      }

      // CAS 2 : 2FA requis
      if (response.status === 'REQUIRES_2FA' && response.tempToken2fa) {
        setTempToken2fa(response.tempToken2fa);
        setShow2FAModal(true);
        return;
      }

      // CAS 3 : login normal
      localStorage.setItem('user', JSON.stringify(response.user));
      redirectAfterLogin(response.user);

    } catch (error: any) {
      const msg = error.message?.toLowerCase() || '';
      if (msg.includes('incorrect') || msg.includes('invalid'))
        setServerError('❌ Email ou mot de passe incorrect');
      else if (msg.includes('désactivé') || msg.includes('disabled'))
        setServerError('🚫 Votre compte a été désactivé. Contactez votre administrateur.');
      else if (msg.includes('verrouillé') || msg.includes('locked'))
        setServerError(`🔒 ${error.message}`);
      else if (msg.includes('réseau') || msg.includes('network'))
        setServerError('🌐 Erreur de connexion. Vérifiez votre internet.');
      else
        setServerError(error.message || '⚠️ Une erreur est survenue. Réessayez.');
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FASuccess = (user: LoginResponse['user']) => {
    setShow2FAModal(false);
    redirectAfterLogin(user);
  };

  const handlePasswordChangeSuccess = (user: PasswordChangeResponse['user']) => {
    setShowPasswordModal(false);
    redirectAfterLogin(user);
  };

  return (
    <div className="flex min-h-screen min-h-[100dvh] w-full bg-[#020617] text-white font-sans overflow-x-hidden">

      {/* ── Fond : logo Konza centré, grand et discret ── */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none select-none">
        <div className="relative w-[520px] h-[260px] opacity-[0.06]">
          <Image
            src="/logos/konza_logo_h_color.png"
            alt=""
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Halo cyan haut-droite */}
      <div className="fixed top-0 right-0 w-[300px] sm:w-[500px] lg:w-[700px] h-[300px] sm:h-[500px] lg:h-[700px] bg-cyan-600/10 rounded-full blur-[100px] lg:blur-[140px] animate-pulse pointer-events-none" />
      {/* Halo bleu bas-gauche */}
      <div className="fixed bottom-0 left-0 w-[300px] sm:w-[500px] lg:w-[700px] h-[300px] sm:h-[500px] lg:h-[700px] bg-blue-600/10 rounded-full blur-[100px] lg:blur-[140px] pointer-events-none" />

      {/* ── Panneau gauche (desktop) ── */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12 z-10">
        <div className="relative z-10 text-center max-w-lg">
          {/* Logo Konza — visible, bien dimensionné */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-10 flex justify-center"
          >
            <div className="relative w-72 h-24">
              <Image
                src="/logos/konza_logo_h_color.png"
                alt="Konza"
                fill
                className="object-contain drop-shadow-[0_0_32px_rgba(6,182,212,0.35)]"
                priority
              />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-6xl font-extrabold text-white mb-6 tracking-tight leading-tight"
          >
            Le Futur de la <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              Gestion RH
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-gray-400 leading-relaxed"
          >
            Connectez-vous à l'écosystème le plus avancé pour les entreprises congolaises.
          </motion.p>
        </div>
      </div>

      {/* ── Panneau droit : formulaire ── */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 md:px-8 lg:px-20 xl:px-24 py-6 sm:py-8 md:py-12 relative z-10 min-h-screen min-h-[100dvh]">

        {/* Bouton accueil */}
        <div className="absolute top-4 sm:top-6 right-4 sm:right-6 z-20">
          <Link
            href="/"
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-xs sm:text-sm font-bold"
          >
            <Home size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Accueil</span>
          </Link>
        </div>

        <div className="w-full max-w-md mx-auto">

          {/* Logo mobile — remplace l'hexagone */}
          <div className="lg:hidden mb-6 sm:mb-8 flex justify-center">
            <div className="relative w-52 h-16 sm:w-64 sm:h-20">
              <Image
                src="/logos/konza_logo_h_color.png"
                alt="Konza"
                fill
                className="object-contain drop-shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                priority
              />
            </div>
          </div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Connexion</h2>
            <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-gray-400">Heureux de vous revoir.</p>

            <AnimatePresence>
              {serverError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 sm:mt-6 p-3 sm:p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2 sm:gap-3"
                >
                  <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={16} />
                  <p className="text-xs sm:text-sm text-red-300 font-medium">{serverError}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <form className="mt-6 sm:mt-8 space-y-4 sm:space-y-5" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-300 mb-1.5">Email</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                    <Mail className={`h-4 w-4 sm:h-5 sm:w-5 transition-colors ${errors.email ? 'text-red-400' : 'text-gray-500 group-focus-within:text-cyan-400'}`} />
                  </div>
                  <input
                    {...register('email')}
                    type="email"
                    className={`block w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3.5 text-sm sm:text-base bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-all ${errors.email ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : 'border-white/10 focus:border-cyan-500/50 focus:ring-cyan-500/50'}`}
                    placeholder="admin@hrcongo.com"
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs sm:text-sm font-bold text-gray-300">Mot de passe</label>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                    <Lock className={`h-4 w-4 sm:h-5 sm:w-5 transition-colors ${errors.password ? 'text-red-400' : 'text-gray-500 group-focus-within:text-cyan-400'}`} />
                  </div>
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    className={`block w-full pl-10 sm:pl-12 pr-11 sm:pr-12 py-2.5 sm:py-3.5 text-sm sm:text-base bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-all ${errors.password ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : 'border-white/10 focus:border-cyan-500/50 focus:ring-cyan-500/50'}`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-gray-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
              </div>

              <div className="flex justify-end -mt-1">
                <Link href="/auth/forgot-password" className="text-xs text-gray-400 hover:text-cyan-400 transition-colors">
                  Mot de passe oublié ?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-3 sm:py-4 px-4 border border-transparent rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] text-sm font-bold text-black bg-gradient-to-r from-cyan-400 to-blue-500 hover:to-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all transform active:scale-[0.98]"
              >
                {isLoading
                  ? <Loader2 className="animate-spin" size={18} />
                  : <>Se connecter <ArrowRight size={16} className="sm:w-[18px] sm:h-[18px]" /></>
                }
              </button>
            </form>

            <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-white/10 text-center">
              <p className="text-xs sm:text-sm text-gray-400">
                Nouveau ici ?{' '}
                <Link href="/auth/register" className="font-bold text-cyan-400 hover:text-white transition-colors">
                  Créer un compte
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Modal 2FA */}
      <TwoFAModal
        isOpen={show2FAModal}
        tempToken2fa={tempToken2fa}
        onSuccess={handle2FASuccess}
        onCancel={() => { setShow2FAModal(false); setTempToken2fa(''); }}
      />

      {/* Modal changement mot de passe */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        tempToken={tempToken}
        userInfo={userInfo}
        onSuccess={handlePasswordChangeSuccess}
        onCancel={() => { setShowPasswordModal(false); setTempToken(''); setUserInfo({ firstName: '', lastName: '' }); }}
      />
    </div>
  );
}

// =============================================================================
// PAGE EXPORT
// =============================================================================

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen w-full bg-[#020617] items-center justify-center">
        <Loader2 className="animate-spin text-cyan-400" size={32} />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}