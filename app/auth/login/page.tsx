
// 'use client';

// import React, { useState } from 'react';
// import Link from 'next/link';
// import { useRouter } from 'next/navigation';
// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import * as z from 'zod';
// import { Mail, Lock, ArrowRight, Loader2, CheckCircle2, Hexagon, AlertCircle, Eye, EyeOff, Home } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { api } from '@/services/api';

// const loginSchema = z.object({
//   email: z.string().email("Format d'email invalide").min(1, "L'email est requis"),
//   password: z.string().min(1, "Le mot de passe est requis"),
//   rememberMe: z.boolean().optional(),
// });

// type LoginFormValues = z.infer<typeof loginSchema>;

// export default function LoginPage() {
//   const router = useRouter();
//   const [isLoading, setIsLoading] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const [serverError, setServerError] = useState('');

//   const { register, handleSubmit, formState: { errors, isValid } } = useForm<LoginFormValues>({
//     resolver: zodResolver(loginSchema),
//     mode: 'onChange',
//   });

//   const onSubmit = async (data: LoginFormValues) => {
//     setIsLoading(true);
//     setServerError('');
//     try {
//       const response: any = await api.post('/auth/login', { email: data.email, password: data.password });
//       localStorage.setItem('accessToken', response.access_token);
//       localStorage.setItem('user', JSON.stringify(response.user));
//       router.push('/dashboard');
//     } catch (error: any) {
//       setServerError(error.message || "Identifiants incorrects.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="flex min-h-screen w-full bg-[#020617] text-white font-sans overflow-hidden">
      
//       {/* Background FX */}
//       <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
//       <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-cyan-600/10 rounded-full blur-[120px] animate-pulse"></div>
//       <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px]"></div>

//       {/* --- LEFT SIDE: BRANDING --- */}
//       <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12 z-10">
//         <div className="relative z-10 text-center max-w-lg">
//           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-10 flex justify-center">
//             <div className="w-24 h-24 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl flex items-center justify-center text-white shadow-[0_0_40px_rgba(6,182,212,0.4)]">
//               <Hexagon size={56} fill="currentColor" />
//             </div>
//           </motion.div>
//           <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-6xl font-extrabold text-white mb-6 tracking-tight leading-tight">
//             Le Futur de la <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Gestion RH</span>
//           </motion.h1>
//           <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-xl text-gray-400 leading-relaxed">
//             Connectez-vous à l'écosystème le plus avancé pour les entreprises congolaises.
//           </motion.p>
//         </div>
//       </div>

//       {/* --- RIGHT SIDE: LOGIN FORM --- */}
//       <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24 relative z-10 backdrop-blur-sm bg-black/20 lg:bg-transparent">
        
//         <div className="absolute top-6 right-6">
//             <Link href="/" className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-sm font-bold">
//                 <Home size={16} /> Accueil
//             </Link>
//         </div>

//         <div className="w-full max-w-md mx-auto">
//           <div className="lg:hidden mb-8 flex justify-center">
//             <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
//               <Hexagon size={24} fill="currentColor" />
//             </div>
//           </div>

//           <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
//             <h2 className="text-3xl font-bold text-white tracking-tight">Connexion</h2>
//             <p className="mt-2 text-sm text-gray-400">Heureux de vous revoir.</p>

//             <AnimatePresence>
//               {serverError && (
//                 <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
//                   <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={18} />
//                   <p className="text-sm text-red-300 font-medium">{serverError}</p>
//                 </motion.div>
//               )}
//             </AnimatePresence>

//             <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
//               <div>
//                 <label className="block text-sm font-bold text-gray-300 mb-1">Email</label>
//                 <div className="relative group">
//                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Mail className={`h-5 w-5 transition-colors ${errors.email ? 'text-red-400' : 'text-gray-500 group-focus-within:text-cyan-400'}`} /></div>
//                   <input {...register('email')} type="email" className={`block w-full pl-12 pr-4 py-3.5 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-all ${errors.email ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : 'border-white/10 focus:border-cyan-500/50 focus:ring-cyan-500/50'}`} placeholder="admin@hrcongo.com" />
//                 </div>
//               </div>

//               <div>
//                 <div className="flex items-center justify-between mb-1">
//                   <label className="block text-sm font-bold text-gray-300">Mot de passe</label>
//                   <Link href="#" className="text-xs font-bold text-cyan-400 hover:text-cyan-300">Oublié ?</Link>
//                 </div>
//                 <div className="relative group">
//                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock className={`h-5 w-5 transition-colors ${errors.password ? 'text-red-400' : 'text-gray-500 group-focus-within:text-cyan-400'}`} /></div>
//                   <input {...register('password')} type={showPassword ? 'text' : 'password'} className={`block w-full pl-12 pr-12 py-3.5 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-all ${errors.password ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : 'border-white/10 focus:border-cyan-500/50 focus:ring-cyan-500/50'}`} placeholder="••••••••" />
//                   <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-white transition-colors">
//                     {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
//                   </button>
//                 </div>
//               </div>

//               <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] text-sm font-bold text-black bg-gradient-to-r from-cyan-400 to-blue-500 hover:to-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02]">
//                 {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Se connecter <ArrowRight size={18} /></>}
//               </button>
//             </form>

//             <div className="mt-8 pt-6 border-t border-white/10 text-center">
//               <p className="text-sm text-gray-400">
//                 Nouveau ici ?{' '}
//                 <Link href="/auth/register" className="font-bold text-cyan-400 hover:text-white transition-colors">Créer un compte</Link>
//               </p>
//             </div>
//           </motion.div>
//         </div>
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
import { Mail, Lock, ArrowRight, Loader2, CheckCircle2, Hexagon, AlertCircle, Eye, EyeOff, Home, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface LoginResponse {
  status?: 'MUST_CHANGE_PASSWORD';
  access_token?: string;
  refresh_token?: string;
  tempToken?: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

interface PasswordChangeResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

// ============================================================================
// SCHEMAS VALIDATION
// ============================================================================

const loginSchema = z.object({
  email: z.string().email("Format d'email invalide").min(1, "L'email est requis"),
  password: z.string().min(1, "Le mot de passe est requis"),
  rememberMe: z.boolean().optional(),
});

const passwordChangeSchema = z.object({
  newPassword: z
    .string()
    .min(8, "Au moins 8 caractères")
    .regex(/[A-Z]/, "Au moins 1 majuscule")
    .regex(/[a-z]/, "Au moins 1 minuscule")
    .regex(/[0-9]/, "Au moins 1 chiffre"),
  confirmPassword: z.string().min(1, "Confirmez votre mot de passe"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type PasswordChangeValues = z.infer<typeof passwordChangeSchema>;

// ============================================================================
// COMPOSANT CRITÈRE MOT DE PASSE
// ============================================================================

function PasswordCriteria({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {met ? (
        <CheckCircle2 className="text-green-400 shrink-0" size={14} />
      ) : (
        <div className="w-3.5 h-3.5 rounded-full border border-gray-600 shrink-0" />
      )}
      <span className={met ? 'text-green-400' : 'text-gray-500'}>{text}</span>
    </div>
  );
}

// ============================================================================
// COMPOSANT MODAL CHANGEMENT MOT DE PASSE
// ============================================================================

interface ChangePasswordModalProps {
  isOpen: boolean;
  tempToken: string;
  userInfo: { firstName: string; lastName: string };
  onSuccess: () => void;
  onCancel: () => void;
}

function ChangePasswordModal({ isOpen, tempToken, userInfo, onSuccess, onCancel }: ChangePasswordModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors }, watch } = useForm<PasswordChangeValues>({
    resolver: zodResolver(passwordChangeSchema),
    mode: 'onChange',
  });

  const newPassword = watch('newPassword', '');

  // Calcul force du mot de passe
  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    
    if (strength <= 25) return { strength, label: 'Faible', color: 'bg-red-500' };
    if (strength <= 50) return { strength, label: 'Moyen', color: 'bg-orange-500' };
    if (strength <= 75) return { strength, label: 'Bon', color: 'bg-yellow-500' };
    return { strength: 100, label: 'Excellent', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  const onSubmit = async (data: PasswordChangeValues) => {
    setIsSubmitting(true);
    setError('');
    
    try {
      const response = await api.post<PasswordChangeResponse>('/auth/force-password-change', {
        tempToken,
        newPassword: data.newPassword
      });

      // Sauvegarder les vrais tokens
      localStorage.setItem('accessToken', response.access_token);
      localStorage.setItem('refreshToken', response.refresh_token);
      localStorage.setItem('user', JSON.stringify(response.user));

      onSuccess();
    } catch (err: any) {
      setError(err.message || "Erreur lors du changement de mot de passe");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-gradient-to-br from-gray-900 to-black border border-cyan-500/20 rounded-3xl shadow-2xl shadow-cyan-500/10 max-w-md w-full p-8"
        >
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-2xl">
              <Shield className="text-cyan-400" size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Sécurisez votre compte</h3>
              <p className="text-sm text-gray-400">Bienvenue {userInfo.firstName} !</p>
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6 flex gap-3">
            <AlertCircle className="text-yellow-400 shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-yellow-200">
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
              <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-red-300">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Nouveau mot de passe */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input
                  {...register('newPassword')}
                  type={showNewPassword ? 'text' : 'password'}
                  className={`w-full pl-12 pr-12 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                    errors.newPassword 
                      ? 'border-red-500/50 focus:ring-red-500/20' 
                      : 'border-white/10 focus:ring-cyan-500/50'
                  }`}
                  placeholder="Minimum 8 caractères"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              
              {/* Force du mot de passe */}
              {newPassword && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">Force du mot de passe</span>
                    <span className={`font-bold ${passwordStrength.strength === 100 ? 'text-green-400' : 'text-gray-400'}`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${passwordStrength.strength}%` }}
                      className={`h-full ${passwordStrength.color} transition-all duration-300`}
                    />
                  </div>
                </div>
              )}

              {errors.newPassword && (
                <p className="mt-1 text-xs text-red-400">{errors.newPassword.message}</p>
              )}

              {/* Critères */}
              <div className="mt-3 space-y-1">
                <PasswordCriteria met={newPassword.length >= 8} text="Au moins 8 caractères" />
                <PasswordCriteria met={/[A-Z]/.test(newPassword)} text="Une majuscule" />
                <PasswordCriteria met={/[a-z]/.test(newPassword)} text="Une minuscule" />
                <PasswordCriteria met={/[0-9]/.test(newPassword)} text="Un chiffre" />
              </div>
            </div>

            {/* Confirmation */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={`w-full pl-12 pr-12 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                    errors.confirmPassword 
                      ? 'border-red-500/50 focus:ring-red-500/20' 
                      : 'border-white/10 focus:ring-cyan-500/50'
                  }`}
                  placeholder="Retapez votre mot de passe"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-400">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Boutons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="flex-1 py-3 border border-white/10 rounded-xl font-bold text-gray-300 hover:bg-white/5 transition-all disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-bold text-white hover:shadow-lg hover:shadow-cyan-500/50 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <CheckCircle2 size={20} />
                    Valider
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ============================================================================
// PAGE LOGIN PRINCIPALE
// ============================================================================

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  
  // État modal changement MDP
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [userInfo, setUserInfo] = useState({ firstName: '', lastName: '' });

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setServerError('');
    
    try {
      const response = await api.post<LoginResponse>('/auth/login', { 
        email: data.email, 
        password: data.password 
      });

      // ✅ CAS 1 : Changement de mot de passe obligatoire
      if (response.status === 'MUST_CHANGE_PASSWORD') {
        if (response.tempToken) {
          setTempToken(response.tempToken);
          setUserInfo(response.user);
          setShowPasswordModal(true);
        }
        setIsLoading(false);
        return;
      }

      // ✅ CAS 2 : Login normal réussi
      if (response.access_token && response.refresh_token) {
        localStorage.setItem('accessToken', response.access_token);
        localStorage.setItem('refreshToken', response.refresh_token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        router.push('/dashboard');
      } else {
        throw new Error('Réponse du serveur invalide');
      }

    } catch (error: any) {
      // ✅ GESTION ERREURS DÉTAILLÉES
      const errorMessage = error.message?.toLowerCase() || '';
      
      if (errorMessage.includes('incorrect') || errorMessage.includes('invalid')) {
        setServerError('❌ Email ou mot de passe incorrect');
      } else if (errorMessage.includes('désactivé') || errorMessage.includes('disabled')) {
        setServerError('🚫 Votre compte a été désactivé. Contactez votre administrateur.');
      } else if (errorMessage.includes('réseau') || errorMessage.includes('network')) {
        setServerError('🌐 Erreur de connexion. Vérifiez votre internet.');
      } else if (errorMessage.includes('timeout')) {
        setServerError('⏱️ Le serveur met trop de temps à répondre. Réessayez.');
      } else {
        setServerError(error.message || '⚠️ Une erreur est survenue. Réessayez.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChangeSuccess = () => {
    setShowPasswordModal(false);
    router.push('/dashboard');
  };

  const handlePasswordChangeCancel = () => {
    setShowPasswordModal(false);
    setTempToken('');
    setUserInfo({ firstName: '', lastName: '' });
  };

  return (
    <div className="flex min-h-screen w-full bg-[#020617] text-white font-sans overflow-hidden">
      
      {/* Background FX */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-cyan-600/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px]"></div>

      {/* --- LEFT SIDE: BRANDING --- */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12 z-10">
        <div className="relative z-10 text-center max-w-lg">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-10 flex justify-center">
            <div className="w-24 h-24 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl flex items-center justify-center text-white shadow-[0_0_40px_rgba(6,182,212,0.4)]">
              <Hexagon size={56} fill="currentColor" />
            </div>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-6xl font-extrabold text-white mb-6 tracking-tight leading-tight">
            Le Futur de la <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Gestion RH</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-xl text-gray-400 leading-relaxed">
            Connectez-vous à l'écosystème le plus avancé pour les entreprises congolaises.
          </motion.p>
        </div>
      </div>

      {/* --- RIGHT SIDE: LOGIN FORM --- */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24 relative z-10 backdrop-blur-sm bg-black/20 lg:bg-transparent">
        
        <div className="absolute top-6 right-6">
          <Link href="/" className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-sm font-bold">
            <Home size={16} /> Accueil
          </Link>
        </div>

        <div className="w-full max-w-md mx-auto">
          <div className="lg:hidden mb-8 flex justify-center">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <Hexagon size={24} fill="currentColor" />
            </div>
          </div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <h2 className="text-3xl font-bold text-white tracking-tight">Connexion</h2>
            <p className="mt-2 text-sm text-gray-400">Heureux de vous revoir.</p>

            <AnimatePresence>
              {serverError && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3"
                >
                  <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={18} />
                  <p className="text-sm text-red-300 font-medium">{serverError}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">Email</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className={`h-5 w-5 transition-colors ${errors.email ? 'text-red-400' : 'text-gray-500 group-focus-within:text-cyan-400'}`} />
                  </div>
                  <input 
                    {...register('email')} 
                    type="email" 
                    className={`block w-full pl-12 pr-4 py-3.5 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-all ${
                      errors.email 
                        ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' 
                        : 'border-white/10 focus:border-cyan-500/50 focus:ring-cyan-500/50'
                    }`} 
                    placeholder="admin@hrcongo.com" 
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-bold text-gray-300">Mot de passe</label>
                  <Link href="#" className="text-xs font-bold text-cyan-400 hover:text-cyan-300">Oublié ?</Link>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className={`h-5 w-5 transition-colors ${errors.password ? 'text-red-400' : 'text-gray-500 group-focus-within:text-cyan-400'}`} />
                  </div>
                  <input 
                    {...register('password')} 
                    type={showPassword ? 'text' : 'password'} 
                    className={`block w-full pl-12 pr-12 py-3.5 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-all ${
                      errors.password 
                        ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' 
                        : 'border-white/10 focus:border-cyan-500/50 focus:ring-cyan-500/50'
                    }`} 
                    placeholder="••••••••" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
                )}
              </div>

              <button 
                type="submit" 
                disabled={isLoading} 
                className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] text-sm font-bold text-black bg-gradient-to-r from-cyan-400 to-blue-500 hover:to-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02]"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    Se connecter <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <p className="text-sm text-gray-400">
                Nouveau ici ?{' '}
                <Link href="/auth/register" className="font-bold text-cyan-400 hover:text-white transition-colors">
                  Créer un compte
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ✅ MODAL CHANGEMENT MOT DE PASSE */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        tempToken={tempToken}
        userInfo={userInfo}
        onSuccess={handlePasswordChangeSuccess}
        onCancel={handlePasswordChangeCancel}
      />
    </div>
  );
}