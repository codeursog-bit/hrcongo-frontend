// 'use client';

// import React, { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import {
//   User, Mail, Phone, MapPin, Briefcase, Building2, Calendar,
//   FileText, Users, Award, Clock, CheckCircle2, XCircle,
//   TrendingUp, Fingerprint, ArrowLeft, Loader2, Shield,
//   Hash, Heart, Baby, CreditCard, Flag, BadgeCheck, 
//   BarChart3, AlarmClock, Palmtree
// } from 'lucide-react';
// import { api } from '@/services/api';
// import PushNotificationBanner, { PushToggleButton } from '@/components/PushNotificationBanner';

// // ─── Types ───────────────────────────────────────────────────────────────────

// interface Company {
//   id: string;
//   name: string;
//   logoUrl?: string;
//   email?: string;
//   phone?: string;
//   address?: string;
//   city?: string;
//   country?: string;
//   industry?: string;
// }

// interface Department {
//   id: string;
//   name: string;
//   color?: string;
// }

// interface EmployeeProfile {
//   id: string;
//   employeeNumber: string;
//   firstName: string;
//   lastName: string;
//   email: string;
//   phone: string;
//   address: string;
//   city?: string;
//   photoUrl?: string;
//   position: string;
//   contractType: string;
//   hireDate: string;
//   dateOfBirth: string;
//   placeOfBirth: string;
//   gender: string;
//   maritalStatus: string;
//   numberOfChildren: number;
//   nationalIdNumber?: string;
//   cnssNumber?: string;
//   department: Department;
//   status: string;
//   // Stats
//   leaveBalance?: number;
//   leaveTaken?: number;
//   presencesThisMonth?: number;
//   absencesThisMonth?: number;
// }

// interface AuthUser {
//   id: string;
//   firstName: string;
//   lastName: string;
//   email: string;
//   role: string;
//   companyId: string;
// }

// // ─── Helpers ─────────────────────────────────────────────────────────────────

// const roleLabels: Record<string, { label: string; color: string; bg: string }> = {
//   SUPER_ADMIN: { label: 'Super Admin',  color: 'text-purple-400', bg: 'bg-purple-500/15 border-purple-500/30' },
//   ADMIN:       { label: 'Administrateur', color: 'text-rose-400',   bg: 'bg-rose-500/15 border-rose-500/30' },
//   HR_MANAGER:  { label: 'Responsable RH', color: 'text-sky-400',    bg: 'bg-sky-500/15 border-sky-500/30' },
//   MANAGER:     { label: 'Manager',        color: 'text-amber-400',   bg: 'bg-amber-500/15 border-amber-500/30' },
//   EMPLOYEE:    { label: 'Employé',        color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' },
// };

// const contractLabels: Record<string, string> = {
//   CDI: 'CDI — Contrat à Durée Indéterminée',
//   CDD: 'CDD — Contrat à Durée Déterminée',
//   STAGE: 'Stage',
//   FREELANCE: 'Freelance',
//   INTERIM: 'Intérim',
// };

// const genderLabels: Record<string, string> = { MALE: 'Masculin', FEMALE: 'Féminin' };
// const maritalLabels: Record<string, string> = {
//   SINGLE: 'Célibataire', MARRIED: 'Marié(e)', DIVORCED: 'Divorcé(e)', WIDOWED: 'Veuf/Veuve'
// };

// const fmt = (date?: string) =>
//   date ? new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

// const seniority = (hireDate?: string) => {
//   if (!hireDate) return '—';
//   const diff = Date.now() - new Date(hireDate).getTime();
//   const years  = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
//   const months = Math.floor((diff % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
//   if (years === 0) return `${months} mois`;
//   return `${years} an${years > 1 ? 's' : ''} ${months > 0 ? `${months} mois` : ''}`;
// };

// // ─── Sub-components ───────────────────────────────────────────────────────────

// function InfoRow({ icon: Icon, label, value, accent = false }: {
//   icon: React.ElementType; label: string; value?: string | number | null; accent?: boolean;
// }) {
//   return (
//     <div className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0">
//       <div className="shrink-0 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mt-0.5">
//         <Icon size={15} className="text-slate-400" />
//       </div>
//       <div className="flex-1 min-w-0">
//         <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">{label}</p>
//         <p className={`text-sm font-semibold truncate ${accent ? 'text-sky-300' : 'text-white'}`}>
//           {value ?? '—'}
//         </p>
//       </div>
//     </div>
//   );
// }

// function StatCard({ icon: Icon, label, value, sub, color }: {
//   icon: React.ElementType; label: string; value: number | string; sub?: string; color: string;
// }) {
//   return (
//     <div className={`relative overflow-hidden rounded-2xl p-4 border ${color} bg-white/3`}>
//       <div className="flex items-center justify-between mb-3">
//         <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
//           <Icon size={18} className="text-current opacity-70" />
//         </div>
//       </div>
//       <p className="text-2xl font-black text-white">{value}</p>
//       <p className="text-xs font-bold text-white/60 mt-0.5">{label}</p>
//       {sub && <p className="text-[10px] text-white/40 mt-1">{sub}</p>}
//     </div>
//   );
// }

// function Section({ title, children }: { title: string; children: React.ReactNode }) {
//   return (
//     <div className="rounded-2xl border border-white/8 bg-white/3 overflow-hidden">
//       <div className="px-5 py-3 border-b border-white/8 bg-white/3">
//         <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">{title}</h3>
//       </div>
//       <div className="px-5 py-1">{children}</div>
//     </div>
//   );
// }

// // ─── Page principale ──────────────────────────────────────────────────────────

// export default function MonProfilPage() {
//   const router = useRouter();
//   const [authUser, setAuthUser]       = useState<AuthUser | null>(null);
//   const [employee, setEmployee]       = useState<EmployeeProfile | null>(null);
//   const [company, setCompany]         = useState<Company | null>(null);
//   const [isLoading, setIsLoading]     = useState(true);
//   const [hasEmployee, setHasEmployee] = useState(true);

//   // Rôles qui ont un profil employé enrichi
//   const ROLES_WITH_EMPLOYEE_PROFILE = ['EMPLOYEE', 'HR_MANAGER', 'MANAGER'];

//   useEffect(() => {
//     loadProfile();
//   }, []);

//   const loadProfile = async () => {
//     try {
//       const stored = localStorage.getItem('user');
//       if (!stored) { router.push('/auth/login'); return; }
//       const u: AuthUser = JSON.parse(stored);
//       setAuthUser(u);

//       // Charger la fiche employé si applicable
//       if (ROLES_WITH_EMPLOYEE_PROFILE.includes(u.role)) {
//         try {
//           const emp = await api.get<EmployeeProfile>('/employees/me');
//           setEmployee(emp);
//         } catch {
//           setHasEmployee(false);
//         }
//       } else {
//         setHasEmployee(false);
//       }

//       // Charger l'entreprise
//       try {
//         const comp = await api.get<Company>('/companies/mine');
//         setCompany(comp);
//       } catch { /* silencieux */ }

//     } catch (e) {
//       console.error('Erreur chargement profil', e);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // ── Loading ──────────────────────────────────────────────────────────────────
//   if (isLoading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-[#0a0f1e]">
//         <div className="text-center">
//           <Loader2 className="animate-spin text-sky-500 mx-auto mb-3" size={40} />
//           <p className="text-slate-500 text-sm">Chargement du profil…</p>
//         </div>
//       </div>
//     );
//   }

//   if (!authUser) return null;

//   const roleInfo  = roleLabels[authUser.role] ?? roleLabels['EMPLOYEE'];
//   const fullName  = employee
//     ? `${employee.firstName} ${employee.lastName}`
//     : `${authUser.firstName} ${authUser.lastName}`;
//   const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=0ea5e9&color=fff&size=256`;
//   const photoUrl  = employee?.photoUrl || avatarUrl;

//   // Stats mock (à remplacer par les vraies API si dispo)
//   const stats = {
//     leaveBalance:       employee?.leaveBalance       ?? 18,
//     leaveTaken:         employee?.leaveTaken         ?? 6,
//     presencesThisMonth: employee?.presencesThisMonth ?? 20,
//     absencesThisMonth:  employee?.absencesThisMonth  ?? 1,
//   };

//   // ── Rendu ────────────────────────────────────────────────────────────────────
//   return (
//     <div className="min-h-screen bg-[#0a0f1e] text-white">
//      <PushToggleButton />
//       {/* ── Fond décoratif ── */}
//       <div className="fixed inset-0 pointer-events-none overflow-hidden">
//         <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-sky-600/10 rounded-full blur-[120px]" />
//         <div className="absolute top-1/2 -right-40 w-[400px] h-[400px] bg-indigo-600/8 rounded-full blur-[100px]" />
//         <div
//           className="absolute inset-0 opacity-[0.015]"
//           style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }}
//         />
//       </div>

//       {/* ── Contenu ── */}
//       <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">

//         {/* Back */}
//         <button
//           onClick={() => router.back()}
//           className="mb-6 flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors group"
//         >
//           <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
//           Retour
//         </button>

//         {/* ══ HERO CARD ══════════════════════════════════════════════════════════ */}
//         <div className="relative rounded-3xl overflow-hidden border border-white/10 mb-6">
//           {/* Bandeau gradient haut */}
//           <div className="h-32 bg-gradient-to-r from-sky-900/60 via-slate-800/80 to-indigo-900/60 relative">
//             <div className="absolute inset-0 opacity-20"
//               style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.03) 20px, rgba(255,255,255,0.03) 40px)' }} />
//           </div>

//           <div className="bg-slate-900/60 backdrop-blur-xl px-6 pb-6">
//             {/* Avatar chevauchant le bandeau */}
//             <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 mb-4">
//               <div className="relative">
//                 <img
//                   src={photoUrl}
//                   alt={fullName}
//                   className="w-24 h-24 rounded-2xl object-cover ring-4 ring-slate-900 shadow-2xl"
//                 />
//                 {/* Pastille online */}
//                 <span className="absolute bottom-1.5 right-1.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900" />
//               </div>

//               <div className="flex-1 pb-1">
//                 <div className="flex flex-wrap items-center gap-2 mb-1">
//                   <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest border ${roleInfo.bg} ${roleInfo.color}`}>
//                     <Shield size={10} />
//                     {roleInfo.label}
//                   </span>
//                   {employee && (
//                     <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/5 border border-white/10 text-slate-400">
//                       <Hash size={10} />
//                       {employee.employeeNumber}
//                     </span>
//                   )}
//                 </div>
//                 <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{fullName}</h1>
//                 <p className="text-slate-400 text-sm mt-0.5">
//                   {employee?.position ?? roleInfo.label}
//                   {employee?.department && (
//                     <span className="ml-2 text-sky-400">• {employee.department.name}</span>
//                   )}
//                 </p>
//               </div>

//               {/* Ancienneté badge */}
//               {employee?.hireDate && (
//                 <div className="shrink-0 text-right hidden sm:block">
//                   <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Ancienneté</p>
//                   <p className="text-xl font-black text-white">{seniority(employee.hireDate)}</p>
//                   <p className="text-xs text-slate-500">depuis {fmt(employee.hireDate)}</p>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* ══ STATS (Employé / RH / Manager seulement) ═════════════════════════ */}
//         {hasEmployee && (
//           <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
//             <StatCard
//               icon={Palmtree}
//               label="Congés restants"
//               value={stats.leaveBalance}
//               sub="jours disponibles"
//               color="border-emerald-500/20 text-emerald-400"
//             />
//             <StatCard
//               icon={CheckCircle2}
//               label="Congés pris"
//               value={stats.leaveTaken}
//               sub="cette année"
//               color="border-sky-500/20 text-sky-400"
//             />
//             <StatCard
//               icon={Fingerprint}
//               label="Présences"
//               value={stats.presencesThisMonth}
//               sub="ce mois-ci"
//               color="border-indigo-500/20 text-indigo-400"
//             />
//             <StatCard
//               icon={XCircle}
//               label="Absences"
//               value={stats.absencesThisMonth}
//               sub="ce mois-ci"
//               color="border-rose-500/20 text-rose-400"
//             />
//           </div>
//         )}

//         {/* ══ GRILLE INFOS ═══════════════════════════════════════════════════════ */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

//           {/* Colonne gauche */}
//           <div className="space-y-4">

//             {/* Infos personnelles */}
//             <Section title="Informations personnelles">
//               <InfoRow icon={Mail}     label="Email"          value={authUser.email} accent />
//               <InfoRow icon={Phone}    label="Téléphone"      value={employee?.phone} />
//               <InfoRow icon={MapPin}   label="Adresse"        value={employee?.address} />
//               <InfoRow icon={MapPin}   label="Ville"          value={employee?.city} />
//               <InfoRow icon={Calendar} label="Date de naissance" value={fmt(employee?.dateOfBirth)} />
//               <InfoRow icon={Flag}     label="Lieu de naissance" value={employee?.placeOfBirth} />
//               <InfoRow icon={User}     label="Genre"          value={employee?.gender ? genderLabels[employee.gender] : undefined} />
//               <InfoRow icon={Heart}    label="Situation matrimoniale" value={employee?.maritalStatus ? maritalLabels[employee.maritalStatus] : undefined} />
//               <InfoRow icon={Baby}     label="Nombre d'enfants" value={employee?.numberOfChildren} />
//             </Section>

//             {/* Identité / Documents */}
//             {hasEmployee && (
//               <Section title="Pièces d'identité">
//                 <InfoRow icon={CreditCard}  label="N° CNI"  value={employee?.nationalIdNumber} />
//                 <InfoRow icon={BadgeCheck}  label="N° CNSS" value={employee?.cnssNumber} />
//               </Section>
//             )}

//           </div>

//           {/* Colonne droite */}
//           <div className="space-y-4">

//             {/* Infos professionnelles */}
//             {hasEmployee && (
//               <Section title="Informations professionnelles">
//                 <InfoRow icon={Briefcase} label="Poste"            value={employee?.position} />
//                 <InfoRow icon={Users}     label="Département"      value={employee?.department?.name} accent />
//                 <InfoRow icon={Hash}      label="Matricule"        value={employee?.employeeNumber} />
//                 <InfoRow icon={FileText}  label="Type de contrat"  value={employee?.contractType ? contractLabels[employee.contractType] ?? employee.contractType : undefined} />
//                 <InfoRow icon={Calendar}  label="Date d'embauche"  value={fmt(employee?.hireDate)} />
//                 <InfoRow icon={Clock}     label="Ancienneté"       value={seniority(employee?.hireDate)} />
//                 <InfoRow icon={Award}     label="Statut"           value={employee?.status === 'ACTIVE' ? 'Actif' : employee?.status} />
//               </Section>
//             )}

//             {/* Entreprise */}
//             <Section title="Entreprise">
//               <div className="py-3 flex items-center gap-3 border-b border-white/5">
//                 {company?.logoUrl ? (
//                   <img src={company.logoUrl} alt={company.name} className="w-10 h-10 rounded-xl object-contain bg-white/5 p-1" />
//                 ) : (
//                   <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center">
//                     <Building2 size={18} className="text-sky-400" />
//                   </div>
//                 )}
//                 <div>
//                   <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">Société</p>
//                   <p className="text-sm font-bold text-white">{company?.name ?? '—'}</p>
//                 </div>
//               </div>
//               <InfoRow icon={Mail}     label="Email entreprise" value={company?.email} />
//               <InfoRow icon={Phone}    label="Tél. entreprise"  value={company?.phone} />
//               <InfoRow icon={MapPin}   label="Adresse"          value={company?.address} />
//               <InfoRow icon={MapPin}   label="Ville / Pays"     value={company?.city && company?.country ? `${company.city}, ${company.country}` : company?.city} />
//               <InfoRow icon={Briefcase} label="Secteur"         value={company?.industry} />
//             </Section>

//           </div>
//         </div>

//         {/* Note lecture seule */}
//         <p className="text-center text-xs text-slate-600 mt-8">
//           Ces informations sont en lecture seule. Pour toute modification, contactez votre responsable RH.
//         </p>

//       </div>
//     </div>
//   );
// }


'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  User, Mail, Phone, MapPin, Briefcase, Building2, Calendar,
  FileText, Users, Award, Clock, CheckCircle2, XCircle,
  Fingerprint, ArrowLeft, Loader2, Shield,
  Hash, Heart, Baby, CreditCard, Flag, BadgeCheck,
  Palmtree, KeyRound, Eye, EyeOff, AlertCircle, Lock,
  Cake, HeartPulse, GraduationCap, Car, Languages, Shirt, AlertTriangle,
} from 'lucide-react';
import { api } from '@/services/api';
import { PushToggleButton } from '@/components/PushNotificationBanner';
import { StatCard } from '@/components/ui/StatCard';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Company {
  id: string;
  name: string;
  logoUrl?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  industry?: string;
}

interface Department {
  id: string;
  name: string;
  color?: string;
}

interface EmployeeProfile {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city?: string;
  photoUrl?: string;
  position: string;
  contractType: string;
  hireDate: string;
  dateOfBirth: string;
  placeOfBirth: string;
  gender: string;
  maritalStatus: string;
  numberOfChildren: number;
  nationalIdNumber?: string;
  cnssNumber?: string;
  department: Department;
  status: string;
  leaveBalance?: number;
  leaveTaken?: number;
  presencesThisMonth?: number;
  absencesThisMonth?: number;
  // 🆕 Fiche ORCA — Informations complémentaires
  bloodType?: string;
  pathology?: string;
  fatherName?: string;
  motherName?: string;
  educationLevel?: string;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactPhone?: string;
  hasDrivingLicense?: boolean;
  drivingLicenseNumber?: string;
  foreignLanguages?: string;
  uniformSize?: string;
  shoeSize?: string;
}

interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  companyId: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const roleLabels: Record<string, { label: string; color: string; bg: string }> = {
  SUPER_ADMIN: { label: 'Super Admin',     color: 'text-purple-400', bg: 'bg-purple-500/15 border-purple-500/30' },
  ADMIN:       { label: 'Administrateur',  color: 'text-rose-400',   bg: 'bg-rose-500/15 border-rose-500/30' },
  HR_MANAGER:  { label: 'Responsable RH',  color: 'text-sky-400',    bg: 'bg-sky-500/15 border-sky-500/30' },
  MANAGER:     { label: 'Manager',         color: 'text-amber-400',  bg: 'bg-amber-500/15 border-amber-500/30' },
  EMPLOYEE:    { label: 'Employé',         color: 'text-emerald-400',bg: 'bg-emerald-500/15 border-emerald-500/30' },
};

const contractLabels: Record<string, string> = {
  CDI: 'CDI — Contrat à Durée Indéterminée',
  CDD: 'CDD — Contrat à Durée Déterminée',
  STAGE: 'Stage',
  FREELANCE: 'Freelance',
  INTERIM: 'Intérim',
};

const genderLabels: Record<string, string>  = { MALE: 'Masculin', FEMALE: 'Féminin' };
const maritalLabels: Record<string, string> = {
  SINGLE: 'Célibataire', MARRIED: 'Marié(e)', DIVORCED: 'Divorcé(e)', WIDOWED: 'Veuf/Veuve',
};

const fmt = (date?: string) =>
  date ? new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

const seniority = (hireDate?: string) => {
  if (!hireDate) return '—';
  const diff   = Date.now() - new Date(hireDate).getTime();
  const years  = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
  const months = Math.floor((diff % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
  if (years === 0) return `${months} mois`;
  return `${years} an${years > 1 ? 's' : ''} ${months > 0 ? `${months} mois` : ''}`;
};

// 🆕 Calcule l'âge à partir de la date de naissance
const calculateAge = (dateOfBirth?: string): number | null => {
  if (!dateOfBirth) return null;
  const birth = new Date(dateOfBirth);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
  if (!hasHadBirthdayThisYear) age--;
  return age;
};

// 🆕 Variants d'animation — même langage que le Dashboard
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value, accent = false }: {
  icon: React.ElementType; label: string; value?: string | number | null; accent?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 dark:border-white/5 last:border-0">
      <div className="shrink-0 w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center mt-0.5">
        <Icon size={15} className="text-gray-400 dark:text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-0.5">{label}</p>
        <p className={`text-sm font-semibold truncate ${accent ? 'text-sky-600 dark:text-sky-300' : 'text-gray-900 dark:text-white'}`}>
          {value ?? '—'}
        </p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/8 bg-white dark:bg-white/3 shadow-sm dark:shadow-none overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 dark:border-white/8 bg-gray-50/60 dark:bg-white/3">
        <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-400">{title}</h3>
      </div>
      <div className="px-5 py-1">{children}</div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function MonProfilPage() {
  const router = useRouter();

  const [authUser, setAuthUser]       = useState<AuthUser | null>(null);
  const [employee, setEmployee]       = useState<EmployeeProfile | null>(null);
  const [company, setCompany]         = useState<Company | null>(null);
  const [isLoading, setIsLoading]     = useState(true);
  const [hasEmployee, setHasEmployee] = useState(true);

  // ── Password modal state ─────────────────────────────────────────────────
  const [showPwdModal,   setShowPwdModal]   = useState(false);
  const [pwdForm,        setPwdForm]        = useState({ current: '', next: '', confirm: '' });
  const [pwdError,       setPwdError]       = useState('');
  const [pwdSuccess,     setPwdSuccess]     = useState(false);
  const [pwdLoading,     setPwdLoading]     = useState(false);
  const [showCurrent,    setShowCurrent]    = useState(false);
  const [showNext,       setShowNext]       = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const ROLES_WITH_EMPLOYEE_PROFILE = ['EMPLOYEE', 'HR_MANAGER', 'MANAGER'];

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const stored = localStorage.getItem('user');
      if (!stored) { router.push('/auth/login'); return; }
      const u: AuthUser = JSON.parse(stored);
      setAuthUser(u);

      if (ROLES_WITH_EMPLOYEE_PROFILE.includes(u.role)) {
        try {
          const emp = await api.get<EmployeeProfile>('/employees/me');
          setEmployee(emp);
        } catch {
          setHasEmployee(false);
        }
      } else {
        setHasEmployee(false);
      }

      try {
        const comp = await api.get<Company>('/companies/mine');
        setCompany(comp);
      } catch { /* silencieux */ }

    } catch (e) {
      console.error('Erreur chargement profil', e);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Changement de mot de passe ───────────────────────────────────────────
  const handlePasswordChange = async () => {
    setPwdError('');
    if (!pwdForm.current)           { setPwdError('Entrez votre mot de passe actuel.'); return; }
    if (pwdForm.next.length < 8)    { setPwdError('Le nouveau mot de passe doit faire au moins 8 caractères.'); return; }
    if (!/[A-Z]/.test(pwdForm.next)){ setPwdError('Au moins une majuscule requise.'); return; }
    if (!/[0-9]/.test(pwdForm.next)){ setPwdError('Au moins un chiffre requis.'); return; }
    if (pwdForm.next !== pwdForm.confirm) { setPwdError('Les mots de passe ne correspondent pas.'); return; }

    setPwdLoading(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: pwdForm.current,
        newPassword: pwdForm.next,
      });
      setPwdSuccess(true);
    } catch (err: any) {
      setPwdError(err?.response?.data?.message || err?.message || 'Erreur lors du changement de mot de passe.');
    } finally {
      setPwdLoading(false);
    }
  };

  const closePwdModal = () => {
    setShowPwdModal(false);
    setPwdSuccess(false);
    setPwdForm({ current: '', next: '', confirm: '' });
    setPwdError('');
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0f1e]">
        <div className="text-center">
          <Loader2 className="animate-spin text-sky-500 mx-auto mb-3" size={40} />
          <p className="text-gray-400 dark:text-slate-500 text-sm">Chargement du profil…</p>
        </div>
      </div>
    );
  }

  if (!authUser) return null;

  const roleInfo = roleLabels[authUser.role] ?? roleLabels['EMPLOYEE'];
  const fullName = employee
    ? `${employee.firstName} ${employee.lastName}`
    : `${authUser.firstName} ${authUser.lastName}`;
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=0ea5e9&color=fff&size=256`;
  const photoUrl  = employee?.photoUrl || avatarUrl;

  const stats = {
    leaveBalance:       employee?.leaveBalance       ?? 18,
    leaveTaken:         employee?.leaveTaken         ?? 6,
    presencesThisMonth: employee?.presencesThisMonth ?? 20,
    absencesThisMonth:  employee?.absencesThisMonth  ?? 1,
  };

  // Password strength helpers
  const pwdChecks = [
    /[A-Z]/.test(pwdForm.next),
    /[a-z]/.test(pwdForm.next),
    /[0-9]/.test(pwdForm.next),
    pwdForm.next.length >= 8,
  ];
  const pwdStrength = pwdChecks.filter(Boolean).length;
  const pwdStrengthColor =
    pwdStrength === 4 ? 'bg-emerald-500 w-full' :
    pwdStrength >= 2  ? 'bg-yellow-500 w-2/3'   : 'bg-red-500 w-1/3';
  const pwdStrengthLabel =
    pwdStrength === 4 ? '✓ Excellent' :
    pwdStrength >= 2  ? 'Moyen'       : 'Faible';

  // ── Rendu ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0f1e] text-gray-900 dark:text-white">
      <PushToggleButton />

      {/* Fond décoratif */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-sky-400/8 dark:bg-sky-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -right-40 w-[400px] h-[400px] bg-indigo-400/6 dark:bg-indigo-600/8 rounded-full blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.015]"
          style={{ backgroundImage: 'radial-gradient(circle, #64748b 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        />
      </div>

      {/* Contenu */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative z-10 max-w-4xl mx-auto px-4 py-8"
      >

        {/* Back */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-sm text-gray-400 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Retour
        </button>

        {/* ══ HERO CARD ══════════════════════════════════════════════════════ */}
        <motion.div variants={itemVariants} className="relative rounded-3xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-xl mb-6">
          <div className="h-32 bg-gradient-to-r from-sky-100 via-white to-indigo-100 dark:from-sky-900/60 dark:via-slate-800/80 dark:to-indigo-900/60 relative">
            <div className="absolute inset-0 opacity-30 dark:opacity-20"
              style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(100,116,139,0.06) 20px, rgba(100,116,139,0.06) 40px)' }} />
          </div>

          <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 mb-4">
              <div className="relative">
                <img
                  src={photoUrl}
                  alt={fullName}
                  className="w-24 h-24 rounded-2xl object-cover ring-4 ring-white dark:ring-slate-900 shadow-2xl"
                />
                <span className="absolute bottom-1.5 right-1.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
              </div>

              <div className="flex-1 pb-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest border ${roleInfo.bg} ${roleInfo.color}`}>
                    <Shield size={10} />
                    {roleInfo.label}
                  </span>
                  {employee && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-slate-400">
                      <Hash size={10} />
                      {employee.employeeNumber}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">{fullName}</h1>
                <p className="text-gray-500 dark:text-slate-400 text-sm mt-0.5">
                  {employee?.position ?? roleInfo.label}
                  {employee?.department && (
                    <span className="ml-2 text-sky-600 dark:text-sky-400">• {employee.department.name}</span>
                  )}
                </p>
              </div>

              {employee?.hireDate && (
                <div className="shrink-0 text-right hidden sm:block">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">Ancienneté</p>
                  <p className="text-xl font-black text-gray-900 dark:text-white">{seniority(employee.hireDate)}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500">depuis {fmt(employee.hireDate)}</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ══ STATS ════════════════════════════════════════════════════════ */}
        {hasEmployee && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <motion.div variants={itemVariants}>
              <StatCard label="Congés restants" value={stats.leaveBalance.toString()} trend="jours disponibles" isPositive={true} icon={Palmtree} gradientFrom="from-emerald-400" gradientTo="to-teal-600" />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatCard label="Congés pris" value={stats.leaveTaken.toString()} trend="cette année" isPositive={true} icon={CheckCircle2} gradientFrom="from-cyan-500" gradientTo="to-blue-600" />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatCard label="Présences" value={stats.presencesThisMonth.toString()} trend="ce mois-ci" isPositive={true} icon={Fingerprint} gradientFrom="from-violet-500" gradientTo="to-purple-600" />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatCard label="Absences" value={stats.absencesThisMonth.toString()} trend="ce mois-ci" isPositive={stats.absencesThisMonth === 0} icon={XCircle} gradientFrom="from-orange-400" gradientTo="to-red-500" />
            </motion.div>
          </div>
        )}

        {/* ══ GRILLE INFOS ══════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Colonne gauche */}
          <div className="space-y-4">
            <motion.div variants={itemVariants}>
              <Section title="Informations personnelles">
                <InfoRow icon={Mail}     label="Email"                 value={authUser.email} accent />
                <InfoRow icon={Phone}    label="Téléphone"             value={employee?.phone} />
                <InfoRow icon={MapPin}   label="Adresse"               value={employee?.address} />
                <InfoRow icon={MapPin}   label="Ville"                 value={employee?.city} />
                <InfoRow icon={Calendar} label="Date de naissance"     value={fmt(employee?.dateOfBirth)} />
                <InfoRow icon={Cake}     label="Âge"                   value={employee?.dateOfBirth ? `${calculateAge(employee.dateOfBirth)} ans` : undefined} />
                <InfoRow icon={Flag}     label="Lieu de naissance"     value={employee?.placeOfBirth} />
                <InfoRow icon={User}     label="Genre"                 value={employee?.gender ? genderLabels[employee.gender] : undefined} />
                <InfoRow icon={Heart}    label="Situation matrimoniale"value={employee?.maritalStatus ? maritalLabels[employee.maritalStatus] : undefined} />
                <InfoRow icon={Baby}     label="Nombre d'enfants"      value={employee?.numberOfChildren} />
              </Section>
            </motion.div>

            {hasEmployee && (
              <motion.div variants={itemVariants}>
                <Section title="Pièces d'identité">
                  <InfoRow icon={CreditCard} label="N° CNI"  value={employee?.nationalIdNumber} />
                  <InfoRow icon={BadgeCheck} label="N° CNSS" value={employee?.cnssNumber} />
                </Section>
              </motion.div>
            )}

            {hasEmployee && (
              <motion.div variants={itemVariants}>
                <Section title="Fiche de renseignement — Complément">
                  <InfoRow icon={HeartPulse}      label="Groupe sanguin"           value={employee?.bloodType} />
                  <InfoRow icon={AlertTriangle}   label="Pathologie"               value={employee?.pathology} />
                  <InfoRow icon={GraduationCap}   label="Niveau d'études"          value={employee?.educationLevel} />
                  <InfoRow icon={Users}           label="Nom du père"              value={employee?.fatherName} />
                  <InfoRow icon={Users}           label="Nom de la mère"           value={employee?.motherName} />
                  <InfoRow icon={Languages}       label="Langue étrangère"         value={employee?.foreignLanguages} />
                  <InfoRow icon={Car}             label="Permis de conduire"       value={employee?.hasDrivingLicense ? `Oui${employee?.drivingLicenseNumber ? ` — ${employee.drivingLicenseNumber}` : ''}` : (employee ? 'Non' : undefined)} />
                  <InfoRow icon={Shirt}           label="Taille de la tenue"       value={employee?.uniformSize} />
                  <InfoRow icon={Shirt}           label="Pointure de chaussures"   value={employee?.shoeSize} />
                </Section>
              </motion.div>
            )}

            {hasEmployee && (employee?.emergencyContactName || employee?.emergencyContactPhone) && (
              <motion.div variants={itemVariants}>
                <Section title="Personne à contacter en cas d'urgence">
                  <InfoRow icon={User}  label="Nom"           value={employee?.emergencyContactName} />
                  <InfoRow icon={Heart} label="Lien de parenté" value={employee?.emergencyContactRelation} />
                  <InfoRow icon={Phone} label="Téléphone"      value={employee?.emergencyContactPhone} />
                </Section>
              </motion.div>
            )}
          </div>

          {/* Colonne droite */}
          <div className="space-y-4">
            {hasEmployee && (
              <motion.div variants={itemVariants}>
                <Section title="Informations professionnelles">
                  <InfoRow icon={Briefcase} label="Poste"           value={employee?.position} />
                  <InfoRow icon={Users}     label="Département"     value={employee?.department?.name} accent />
                  <InfoRow icon={Hash}      label="Matricule"       value={employee?.employeeNumber} />
                  <InfoRow icon={FileText}  label="Type de contrat" value={employee?.contractType ? contractLabels[employee.contractType] ?? employee.contractType : undefined} />
                  <InfoRow icon={Calendar}  label="Date d'embauche" value={fmt(employee?.hireDate)} />
                  <InfoRow icon={Clock}     label="Ancienneté"      value={seniority(employee?.hireDate)} />
                  <InfoRow icon={Award}     label="Statut"          value={employee?.status === 'ACTIVE' ? 'Actif' : employee?.status} />
                </Section>
              </motion.div>
            )}

            <motion.div variants={itemVariants}>
              <Section title="Entreprise">
                <div className="py-3 flex items-center gap-3 border-b border-gray-100 dark:border-white/5">
                  {company?.logoUrl ? (
                    <img src={company.logoUrl} alt={company.name} className="w-10 h-10 rounded-xl object-contain bg-gray-100 dark:bg-white/5 p-1" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-500/20 flex items-center justify-center">
                      <Building2 size={18} className="text-sky-600 dark:text-sky-400" />
                    </div>
                  )}
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-0.5">Société</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{company?.name ?? '—'}</p>
                  </div>
                </div>
                <InfoRow icon={Mail}      label="Email entreprise" value={company?.email} />
                <InfoRow icon={Phone}     label="Tél. entreprise"  value={company?.phone} />
                <InfoRow icon={MapPin}    label="Adresse"          value={company?.address} />
                <InfoRow icon={MapPin}    label="Ville / Pays"     value={company?.city && company?.country ? `${company.city}, ${company.country}` : company?.city} />
                <InfoRow icon={Briefcase} label="Secteur"          value={company?.industry} />
              </Section>
            </motion.div>
          </div>
        </div>

        {/* Note lecture seule */}
        <p className="text-center text-xs text-gray-400 dark:text-slate-600 mt-8">
          Ces informations sont en lecture seule. Pour toute modification, contactez votre responsable RH.
        </p>

        {/* ── Sécurité du compte ──────────────────────────────────────── */}
        <motion.div variants={itemVariants} className="rounded-2xl border border-gray-200 dark:border-white/8 bg-white dark:bg-white/3 shadow-sm dark:shadow-none overflow-hidden mt-4">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-white/8 bg-gray-50/60 dark:bg-white/3">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-400">Sécurité du compte</h3>
          </div>
          <div className="px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                <KeyRound size={15} className="text-gray-400 dark:text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Mot de passe</p>
                <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">Modifiez votre mot de passe de connexion</p>
              </div>
            </div>
            <button
              onClick={() => setShowPwdModal(true)}
              className="px-4 py-2 rounded-xl bg-sky-50 dark:bg-sky-500/15 border border-sky-200 dark:border-sky-500/30 text-sky-600 dark:text-sky-400 text-xs font-bold hover:bg-sky-100 dark:hover:bg-sky-500/25 transition-colors"
            >
              Modifier
            </button>
          </div>
        </motion.div>

      </motion.div>

      {/* ── MODALE CHANGEMENT MOT DE PASSE ─────────────────────────── */}
      {showPwdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center">
                <KeyRound size={18} className="text-sky-400" />
              </div>
              <div>
                <h3 className="font-bold text-white">Changer le mot de passe</h3>
                <p className="text-xs text-slate-500">Votre session reste active après le changement</p>
              </div>
            </div>

            {pwdSuccess ? (
              <div className="text-center py-4">
                <CheckCircle2 size={40} className="text-emerald-400 mx-auto mb-3" />
                <p className="font-bold text-white mb-1">Mot de passe modifié !</p>
                <p className="text-xs text-slate-400 mb-5">Votre mot de passe a été mis à jour avec succès.</p>
                <button
                  onClick={closePwdModal}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-sm hover:bg-emerald-500/30 transition-colors"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <div className="space-y-4">

                {/* Mot de passe actuel */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                    Mot de passe actuel
                  </label>
                  <div className="flex items-center gap-2 px-3.5 py-3 rounded-xl border border-white/10 bg-white/5 focus-within:border-sky-500/50 transition-colors">
                    <Lock size={14} className="text-slate-500" />
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      value={pwdForm.current}
                      onChange={e => setPwdForm(f => ({ ...f, current: e.target.value }))}
                      placeholder="Votre mot de passe actuel"
                      className="flex-1 bg-transparent text-white text-sm placeholder-slate-600 outline-none"
                    />
                    <button type="button" onClick={() => setShowCurrent(v => !v)} className="text-slate-500 hover:text-slate-300">
                      {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Nouveau mot de passe */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                    Nouveau mot de passe
                  </label>
                  <div className="flex items-center gap-2 px-3.5 py-3 rounded-xl border border-white/10 bg-white/5 focus-within:border-sky-500/50 transition-colors">
                    <Lock size={14} className="text-slate-500" />
                    <input
                      type={showNext ? 'text' : 'password'}
                      value={pwdForm.next}
                      onChange={e => setPwdForm(f => ({ ...f, next: e.target.value }))}
                      placeholder="Min. 8 car., 1 majuscule, 1 chiffre"
                      className="flex-1 bg-transparent text-white text-sm placeholder-slate-600 outline-none"
                    />
                    <button type="button" onClick={() => setShowNext(v => !v)} className="text-slate-500 hover:text-slate-300">
                      {showNext ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {pwdForm.next && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${pwdStrengthColor}`} />
                      </div>
                      <span className="text-[11px] text-slate-400">{pwdStrengthLabel}</span>
                    </div>
                  )}
                </div>

                {/* Confirmation */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                    Confirmer le nouveau mot de passe
                  </label>
                  <div className={`flex items-center gap-2 px-3.5 py-3 rounded-xl border bg-white/5 transition-colors focus-within:border-sky-500/50
                    ${pwdForm.confirm && pwdForm.confirm !== pwdForm.next ? 'border-red-500/50' : 'border-white/10'}`}>
                    <Lock size={14} className="text-slate-500" />
                    <input
                      type={showConfirmPwd ? 'text' : 'password'}
                      value={pwdForm.confirm}
                      onChange={e => setPwdForm(f => ({ ...f, confirm: e.target.value }))}
                      placeholder="Répétez le nouveau mot de passe"
                      className="flex-1 bg-transparent text-white text-sm placeholder-slate-600 outline-none"
                    />
                    <button type="button" onClick={() => setShowConfirmPwd(v => !v)} className="text-slate-500 hover:text-slate-300">
                      {showConfirmPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Erreur */}
                {pwdError && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-red-300">{pwdError}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={closePwdModal}
                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-slate-400 hover:bg-white/5 transition-colors font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handlePasswordChange}
                    disabled={pwdLoading || !pwdForm.current || !pwdForm.next || !pwdForm.confirm}
                    className="flex-1 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    {pwdLoading
                      ? <><Loader2 size={14} className="animate-spin" /> Modification…</>
                      : 'Modifier'}
                  </button>
                </div>

              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}