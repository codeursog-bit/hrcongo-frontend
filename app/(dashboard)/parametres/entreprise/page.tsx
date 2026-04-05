// 'use client';

// import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { 
//   ArrowLeft, Building2, Phone, Calendar, BookOpen, 
//   Save, AlertTriangle, History, 
//   Globe, Check,
//   Briefcase, Landmark, MapPin, Mail, Lock, Clock, Loader2,
//   Navigation, Smartphone, Users, ShieldCheck, AlertCircle,
//   HardHat, ShoppingCart, Factory, Flame, Truck,
//   Utensils, Leaf, Wifi, HeartPulse, GraduationCap, Award
// } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { useAlert } from '@/components/providers/AlertProvider';
// import { api } from '@/services/api';

// // ─── TYPES ────────────────────────────────────────────────────────────────────

// interface CompanySettings {
//   legalName: string;
//   tradeName: string;
//   rccmNumber: string;
//   cnssNumber: string;
//   taxNumber: string;
//   address: string;
//   city: string;
//   phone: string;
//   email: string;
//   bankName: string;
//   bankAccount: string;
//   bankRib: string;
//   primaryColor: string;
//   secondaryColor: string;
//   latitude: number;
//   longitude: number;
//   allowedRadius: number;
//   appliesCnssEmployer: boolean;
//   defaultAppliesIrpp: boolean;
//   defaultAppliesCnss: boolean;
//   collectiveAgreement?: string;
// }

// interface PayrollSettings {
//   officialStartHour: number;
//   lateToleranceMinutes: number;
//   workDaysPerMonth: number;
//   workHoursPerDay: number;
//   workDays: number[];
//   fiscalMode:     'AUTO' | 'ITS_2026' | 'IRPP_LEGACY' | 'FORFAIT';
//   forfaitItsRate: number;
// }

// // ─── CNSS PATRONALE : 3 BRANCHES ─────────────────────────────────────────────
// const CNSS_BRANCHES = [
//   {
//     key: 'pension',
//     label: 'Retraite & Pension',
//     rate: 8,
//     plafond: '1 200 000 FCFA',
//     color: 'text-purple-600 dark:text-purple-400',
//     bg: 'bg-purple-50 dark:bg-purple-900/10',
//     border: 'border-purple-200 dark:border-purple-800',
//   },
//   {
//     key: 'famille',
//     label: 'Prestations familiales',
//     rate: 10,
//     plafond: '600 000 FCFA',
//     color: 'text-blue-600 dark:text-blue-400',
//     bg: 'bg-blue-50 dark:bg-blue-900/10',
//     border: 'border-blue-200 dark:border-blue-800',
//   },
//   {
//     key: 'accident',
//     label: 'Accidents du travail',
//     rate: 2.25,
//     plafond: '600 000 FCFA',
//     color: 'text-orange-600 dark:text-orange-400',
//     bg: 'bg-orange-50 dark:bg-orange-900/10',
//     border: 'border-orange-200 dark:border-orange-800',
//   },
// ];

// const CNSS_EMPLOYER_TOTAL = 8 + 10 + 2.25; // 20.25%

// // ─── CONVENTION CONFIG ────────────────────────────────────────────────────────

// const CONVENTION_CONFIG: Record<string, {
//   icon: React.ElementType;
//   color: string;
//   bg: string;
//   label: string;
//   description: string;
// }> = {
//   BTP:              { icon: HardHat,      color: 'text-orange-600 dark:text-orange-400',   bg: 'bg-orange-100 dark:bg-orange-900/30',   label: 'BTP',              description: 'Bâtiment & Travaux Publics' },
//   COMMERCE:         { icon: ShoppingCart, color: 'text-blue-600 dark:text-blue-400',       bg: 'bg-blue-100 dark:bg-blue-900/30',       label: 'Commerce',         description: 'Commerce & Distribution' },
//   INDUSTRIE:        { icon: Factory,      color: 'text-slate-600 dark:text-slate-400',     bg: 'bg-slate-100 dark:bg-slate-700/50',     label: 'Industrie',        description: 'Industrie & Manufacture' },
//   HYDROCARBURES:    { icon: Flame,        color: 'text-red-600 dark:text-red-400',         bg: 'bg-red-100 dark:bg-red-900/30',         label: 'Hydrocarbures',    description: 'Pétrole & Gaz' },
//   BANQUES:          { icon: Landmark,     color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', label: 'Banques & Finances',description: 'Banques, Assurances & Finance' },
//   TRANSPORTS:       { icon: Truck,        color: 'text-purple-600 dark:text-purple-400',   bg: 'bg-purple-100 dark:bg-purple-900/30',   label: 'Transports',       description: 'Transports & Logistique' },
//   HOTELLERIE:       { icon: Utensils,     color: 'text-amber-600 dark:text-amber-400',     bg: 'bg-amber-100 dark:bg-amber-900/30',     label: 'Hôtellerie',       description: 'Hôtellerie & Restauration' },
//   AGRICULTURE:      { icon: Leaf,         color: 'text-green-600 dark:text-green-400',     bg: 'bg-green-100 dark:bg-green-900/30',     label: 'Agriculture',      description: 'Agriculture & Sylviculture' },
//   TELECOMMUNICATIONS:{ icon: Wifi,        color: 'text-cyan-600 dark:text-cyan-400',       bg: 'bg-cyan-100 dark:bg-cyan-900/30',       label: 'Télécommunications',description: 'Télécoms & Technologies' },
//   SANTE:            { icon: HeartPulse,   color: 'text-pink-600 dark:text-pink-400',       bg: 'bg-pink-100 dark:bg-pink-900/30',       label: 'Santé',            description: 'Santé & Pharmacie' },
//   EDUCATION:        { icon: GraduationCap,color: 'text-indigo-600 dark:text-indigo-400',   bg: 'bg-indigo-100 dark:bg-indigo-900/30',   label: 'Éducation',        description: 'Enseignement & Formation' },
// };

// // ─── DEFAULTS ─────────────────────────────────────────────────────────────────

// const DEFAULT_COMPANY: CompanySettings = {
//   legalName: '', tradeName: '', rccmNumber: '', cnssNumber: '', taxNumber: '',
//   address: '', city: '', phone: '', email: '',
//   bankName: '', bankAccount: '', bankRib: '',
//   primaryColor: '#0EA5E9', secondaryColor: '#10B981',
//   latitude: 0, longitude: 0, allowedRadius: 100,
//   appliesCnssEmployer: true,
//   defaultAppliesIrpp: true,
//   defaultAppliesCnss: true,
//   collectiveAgreement: '',
// };

// const DEFAULT_PAYROLL: PayrollSettings = {
//   officialStartHour: 8,
//   lateToleranceMinutes: 0,
//   workDaysPerMonth: 26,
//   workHoursPerDay: 8,
//   workDays: [1, 2, 3, 4, 5],
//   fiscalMode:     'AUTO',
//   forfaitItsRate: 0.08,
// };

// const DAYS_OF_WEEK = [
//   { value: 1, label: 'Lundi' },
//   { value: 2, label: 'Mardi' },
//   { value: 3, label: 'Mercredi' },
//   { value: 4, label: 'Jeudi' },
//   { value: 5, label: 'Vendredi' },
//   { value: 6, label: 'Samedi' },
//   { value: 7, label: 'Dimanche' }
// ];

// // ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────

// export default function CompanySettingsPage() {
//   const alert = useAlert();
//   const router = useRouter();
//   const [activeTab, setActiveTab] = useState<'general' | 'fiscal' | 'convention' | 'location' | 'attendance' | 'contact'>('general');
//   const [companyData, setCompanyData] = useState<CompanySettings>(DEFAULT_COMPANY);
//   const [payrollData, setPayrollData] = useState<PayrollSettings>(DEFAULT_PAYROLL);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isSaving, setIsSaving] = useState(false);
//   const [showConfirm, setShowConfirm] = useState(false);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const company: any = await api.get('/companies/mine');
//         if (company) {
//           setCompanyData({
//             legalName:           company.legalName           || '',
//             tradeName:           company.tradeName           || '',
//             rccmNumber:          company.rccmNumber          || '',
//             cnssNumber:          company.cnssNumber          || '',
//             taxNumber:           company.taxNumber           || '',
//             address:             company.address             || '',
//             city:                company.city                || '',
//             phone:               company.phone               || '',
//             email:               company.email               || '',
//             bankName:            company.bankName            || '',
//             bankAccount:         company.bankAccount         || '',
//             bankRib:             company.bankRib             || '',
//             primaryColor:        company.primaryColor        || '#0EA5E9',
//             secondaryColor:      company.secondaryColor      || '#10B981',
//             latitude:            company.latitude            || 0,
//             longitude:           company.longitude           || 0,
//             allowedRadius:       company.allowedRadius       || 100,
//             appliesCnssEmployer: company.appliesCnssEmployer ?? true,
//             defaultAppliesIrpp:  company.defaultAppliesIrpp  ?? true,
//             defaultAppliesCnss:  company.defaultAppliesCnss  ?? true,
//             collectiveAgreement: company.collectiveAgreement || '',
//           });
//         }

//         const settings: any = await api.get('/payroll-settings');
//         if (settings) {
//           setPayrollData({
//             officialStartHour:    settings.officialStartHour    ?? 8,
//             lateToleranceMinutes: settings.lateToleranceMinutes ?? 0,
//             workDaysPerMonth:     settings.workDaysPerMonth      ?? 26,
//             workHoursPerDay:      settings.workHoursPerDay       ?? 8,
//             workDays:             settings.workDays              || [1, 2, 3, 4, 5],
//             fiscalMode:     settings.fiscalMode     ?? 'AUTO',
//             forfaitItsRate: settings.forfaitItsRate  ?? 0.08,
//           });
//         }
//       } catch (e) {
//         console.error('Erreur chargement paramètres', e);
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     fetchData();
//   }, []);

//   const handleCompanyChange = (field: keyof CompanySettings, value: any) => {
//     setCompanyData(prev => ({ ...prev, [field]: value }));
//   };

//   const handlePayrollChange = (field: keyof PayrollSettings, value: any) => {
//     setPayrollData(prev => ({ ...prev, [field]: value }));
//   };

//   const toggleWorkDay = (day: number) => {
//     setPayrollData(prev => {
//       const workDays = prev.workDays.includes(day)
//         ? prev.workDays.filter(d => d !== day)
//         : [...prev.workDays, day].sort();
//       return { ...prev, workDays };
//     });
//   };

//   const getCurrentLocation = () => {
//     if (!navigator.geolocation) {
//       alert.error('Navigateur non compatible', "La géolocalisation n'est pas supportée.");
//       return;
//     }
//     navigator.geolocation.getCurrentPosition(
//       (position) => {
//         setCompanyData(prev => ({
//           ...prev,
//           latitude:  position.coords.latitude,
//           longitude: position.coords.longitude
//         }));
//         alert.success('Position récupérée', 'Coordonnées GPS enregistrées avec succès.');
//       },
//       (error) => {
//         alert.error('Géolocalisation impossible', error.message || 'Impossible d\'accéder à votre position.');
//       },
//       { enableHighAccuracy: true }
//     );
//   };

//   const handleSave = async () => {
//     setIsSaving(true);
//     try {
//       await api.patch('/companies', {
//         ...companyData,
//         collectiveAgreement: companyData.collectiveAgreement || null,
//       });

//       await api.patch('/payroll-settings', payrollData);

//       setShowConfirm(false);
//       alert.success('Paramètres enregistrés', 'Les modifications ont été appliquées avec succès.');
//     } catch (e: any) {
//       alert.error('Erreur d\'enregistrement', e.message || 'Impossible de sauvegarder les modifications.');
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const calculateLateTime = () => {
//     const total = payrollData.officialStartHour * 60 + payrollData.lateToleranceMinutes;
//     return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
//   };

//   const calculateNextMinute = () => {
//     const total = payrollData.officialStartHour * 60 + payrollData.lateToleranceMinutes + 1;
//     return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
//   };

//   const TabButton = ({ id, label, icon: Icon }: any) => (
//     <button
//       onClick={() => setActiveTab(id)}
//       className={`px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all whitespace-nowrap ${
//         activeTab === id
//           ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg'
//           : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
//       }`}
//     >
//       <Icon size={18} /> {label}
//     </button>
//   );

//   if (isLoading) {
//     return (
//       <div className="flex justify-center items-center min-h-screen">
//         <Loader2 className="animate-spin text-sky-500" size={48} />
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-[1200px] mx-auto pb-24 px-4 relative">

//       {/* HEADER */}
//       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 mt-6">
//         <div className="flex items-center gap-4">
//           <button onClick={() => router.back()}
//             className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors">
//             <ArrowLeft size={20} className="text-gray-500" />
//           </button>
//           <div>
//             <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Paramètres Entreprise</h1>
//             <p className="text-gray-500 dark:text-gray-400 text-sm">Configuration complète : identité, fiscalité et politiques RH.</p>
//           </div>
//         </div>
//       </div>

//       {/* TABS */}
//       <div className="flex gap-2 overflow-x-auto pb-4 mb-4 no-scrollbar">
//         <TabButton id="general"    label="Général"             icon={Building2}   />
//         <TabButton id="fiscal"     label="Fiscalité"           icon={ShieldCheck}  />
//         <TabButton id="convention" label="Convention"          icon={BookOpen}    />
//         <TabButton id="location"   label="Localisation"        icon={MapPin}      />
//         <TabButton id="attendance" label="Horaires & Pointage" icon={Clock}       />
//         <TabButton id="contact"    label="Coordonnées"         icon={Phone}       />
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//         <div className="lg:col-span-2 space-y-6">
//           <AnimatePresence mode="wait">

//             {/* ==================== ONGLET GÉNÉRAL ==================== */}
//             {activeTab === 'general' && (
//               <motion.div key="general" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
//                 <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
//                   <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
//                     <Briefcase size={20} className="text-sky-500" /> Identification
//                   </h3>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     {[
//                       { field: 'legalName',  label: 'Nom Légal*',     type: 'text',  mono: false },
//                       { field: 'tradeName',  label: 'Nom Commercial', type: 'text',  mono: false },
//                       { field: 'rccmNumber', label: 'N° RCCM*',       type: 'text',  mono: true  },
//                       { field: 'cnssNumber', label: 'N° CNSS*',       type: 'text',  mono: true  },
//                       { field: 'taxNumber',  label: 'N° Fiscal (NIU)',type: 'text',  mono: true  },
//                     ].map(({ field, label, type, mono }) => (
//                       <div key={field}>
//                         <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{label}</label>
//                         <input
//                           type={type}
//                           value={(companyData as any)[field]}
//                           onChange={e => handleCompanyChange(field as any, e.target.value)}
//                           className={`w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white ${mono ? 'font-mono' : ''}`}
//                         />
//                       </div>
//                     ))}
//                   </div>
//                 </div>

//                 <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
//                   <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
//                     <Landmark size={20} className="text-emerald-500" /> Banque Principale
//                   </h3>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     <div>
//                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Banque</label>
//                       <select value={companyData.bankName} onChange={e => handleCompanyChange('bankName', e.target.value)}
//                         className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white">
//                         <option value="">Sélectionner...</option>
//                         <option value="BGFI Bank">BGFI Bank</option>
//                         <option value="Ecobank">Ecobank</option>
//                         <option value="LCB">LCB</option>
//                         <option value="UBA">UBA</option>
//                       </select>
//                     </div>
//                     <div>
//                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Numéro de Compte</label>
//                       <input value={companyData.bankAccount} onChange={e => handleCompanyChange('bankAccount', e.target.value)}
//                         className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl font-mono text-gray-900 dark:text-white" />
//                     </div>
//                     <div className="md:col-span-2">
//                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">RIB / IBAN</label>
//                       <input value={companyData.bankRib} onChange={e => handleCompanyChange('bankRib', e.target.value)}
//                         className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl font-mono text-gray-900 dark:text-white" />
//                     </div>
//                   </div>
//                 </div>
//               </motion.div>
//             )}

//             {/* ==================== ONGLET FISCALITÉ ==================== */}
//             {activeTab === 'fiscal' && (
//               <motion.div key="fiscal" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">

//                 {/* CNSS PATRONALE */}
//                 <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
//                   <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
//                     <ShieldCheck size={20} className="text-purple-500" /> CNSS Patronale
//                   </h3>
//                   <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
//                     La CNSS patronale est composée de <strong>3 branches distinctes</strong> avec des plafonds différents,
//                     conformément au Décret 2009-392.
//                   </p>

//                   <label className="flex items-start gap-4 cursor-pointer p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl border-2 border-purple-200 dark:border-purple-700 hover:border-purple-400 transition-all group mb-4">
//                     <input
//                       type="checkbox"
//                       checked={companyData.appliesCnssEmployer}
//                       onChange={e => handleCompanyChange('appliesCnssEmployer', e.target.checked)}
//                       className="w-5 h-5 rounded border-purple-300 text-purple-600 focus:ring-purple-500 focus:ring-offset-0 mt-0.5"
//                     />
//                     <div className="flex-1">
//                       <span className="text-sm font-bold text-gray-900 dark:text-white block mb-1 group-hover:text-purple-600 transition-colors">
//                         L'entreprise est assujettie à la CNSS patronale
//                       </span>
//                       <p className="text-xs text-gray-500 dark:text-gray-400">
//                         Décochez si votre structure n'est pas encore immatriculée à la CNSS.
//                       </p>
//                     </div>
//                   </label>

//                   <AnimatePresence>
//                     {companyData.appliesCnssEmployer && (
//                       <motion.div
//                         initial={{ opacity: 0, height: 0 }}
//                         animate={{ opacity: 1, height: 'auto' }}
//                         exit={{ opacity: 0, height: 0 }}
//                       >
//                         <div className="space-y-3 mb-4">
//                           {CNSS_BRANCHES.map(branch => (
//                             <div key={branch.key}
//                               className={`flex items-center justify-between p-4 rounded-xl border ${branch.bg} ${branch.border}`}>
//                               <div>
//                                 <p className={`font-bold text-sm ${branch.color}`}>{branch.label}</p>
//                                 <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
//                                   Plafond : {branch.plafond}
//                                 </p>
//                               </div>
//                               <div className="text-right">
//                                 <span className={`text-2xl font-black font-mono ${branch.color}`}>
//                                   {branch.rate}%
//                                 </span>
//                               </div>
//                             </div>
//                           ))}
//                         </div>

//                         <div className="flex items-center justify-between p-4 bg-gray-900 dark:bg-black rounded-xl">
//                           <div>
//                             <p className="text-white font-bold text-sm">Total CNSS patronale</p>
//                             <p className="text-gray-400 text-xs mt-0.5">
//                               Taux combiné (sur les bases plafonnées respectives)
//                             </p>
//                           </div>
//                           <span className="text-2xl font-black font-mono text-white">
//                             {CNSS_EMPLOYER_TOTAL}%
//                           </span>
//                         </div>

//                         <p className="text-xs text-gray-400 mt-3 flex items-center gap-1.5">
//                           <AlertCircle size={12} className="text-amber-400 shrink-0" />
//                           Ces taux sont <strong>fixés par la loi congolaise</strong> (Décret 2009-392) et ne sont pas modifiables.
//                           Contactez votre conseiller RH pour toute dérogation.
//                         </p>
//                       </motion.div>
//                     )}
//                   </AnimatePresence>
//                 </div>

//                 {/* PARAMÈTRES PAR DÉFAUT — NOUVEAUX EMPLOYÉS */}
//                 <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
//                   <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
//                     <ShieldCheck size={20} className="text-indigo-500" /> Paramètres par défaut — Nouveaux employés
//                   </h3>
//                   <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
//                     Ces valeurs seront pré-remplies à la création d'un nouvel employé.
//                     Vous pourrez les ajuster individuellement sur chaque fiche.
//                   </p>

//                   {/* Réforme fiscale 2026 */}
//                   <div className="p-4 bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800 rounded-xl mb-5">
//                     <p className="text-sm font-bold text-violet-900 dark:text-violet-100 mb-1 flex items-center gap-2">
//                       <AlertCircle size={15} className="shrink-0" />
//                       Réforme fiscale 2026 — ITS (ex-IRPP)
//                     </p>
//                     <p className="text-xs text-violet-700 dark:text-violet-300 leading-relaxed">
//                       Depuis le 1er janvier 2026, l'IRPP est remplacé par l'<strong>ITS (Impôt sur les Traitements et Salaires)</strong>.
//                       L'abattement passe de <strong>30% (plafond 75 000 F/mois)</strong> à <strong>20% sans plafond</strong>.
//                       Le quotient familial (parts fiscales) est supprimé — tout le monde est taxé sur <strong>1 part</strong>.
//                       Le système bascule automatiquement selon l'année du bulletin.
//                     </p>
//                   </div>

//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <label className="flex items-center gap-3 cursor-pointer p-4 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-300 transition-all">
//                       <input
//                         type="checkbox"
//                         checked={companyData.defaultAppliesIrpp}
//                         onChange={e => handleCompanyChange('defaultAppliesIrpp', e.target.checked)}
//                         className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
//                       />
//                       <div>
//                         <span className="text-sm font-bold text-gray-900 dark:text-white block mb-0.5">
//                           Par défaut, soumis à l'ITS
//                         </span>
//                         <p className="text-xs text-gray-500 dark:text-gray-400">
//                           Barème 1% / 10% / 25% / 40%
//                         </p>
//                       </div>
//                     </label>

//                     <label className="flex items-center gap-3 cursor-pointer p-4 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-300 transition-all">
//                       <input
//                         type="checkbox"
//                         checked={companyData.defaultAppliesCnss}
//                         onChange={e => handleCompanyChange('defaultAppliesCnss', e.target.checked)}
//                         className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
//                       />
//                       <div>
//                         <span className="text-sm font-bold text-gray-900 dark:text-white block mb-0.5">
//                           Par défaut, soumis à la CNSS
//                         </span>
//                         <p className="text-xs text-gray-500 dark:text-gray-400">
//                           4% salarié · plafond 1 200 000 F
//                         </p>
//                       </div>
//                     </label>
//                   </div>

//                   {/* Mode de calcul ITS / IRPP */}
//                   <div className="mt-6 p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
//                     <h4 className="font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2 text-sm">
//                       <ShieldCheck size={16} className="text-indigo-500" />
//                       Mode de calcul ITS / IRPP
//                     </h4>
//                     <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
//                       Choisissez comment l'impôt sur salaires est calculé pour tous les bulletins de votre entreprise.
//                     </p>

//                     <div className="grid grid-cols-1 gap-3">

//                       {/* AUTO */}
//                       <label className={`flex items-start gap-4 cursor-pointer p-4 rounded-xl border-2 transition-all ${
//                         payrollData.fiscalMode === 'AUTO'
//                           ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
//                           : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
//                       }`}>
//                         <input type="radio" name="fiscalMode" value="AUTO"
//                           checked={payrollData.fiscalMode === 'AUTO'}
//                           onChange={() => handlePayrollChange('fiscalMode', 'AUTO')}
//                           className="mt-1 text-indigo-600 focus:ring-indigo-500"
//                         />
//                         <div className="flex-1">
//                           <div className="flex items-center gap-2 mb-0.5">
//                             <span className="text-sm font-bold text-gray-900 dark:text-white">Automatique</span>
//                             <span className="text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-medium">Recommandé</span>
//                           </div>
//                           <p className="text-xs text-gray-500 dark:text-gray-400">
//                             Bulletins &lt; 2026 → IRPP (abattement 30%) · Bulletins ≥ 2026 → ITS (abattement 20%)
//                           </p>
//                         </div>
//                       </label>

//                       {/* ITS_2026 */}
//                       <label className={`flex items-start gap-4 cursor-pointer p-4 rounded-xl border-2 transition-all ${
//                         payrollData.fiscalMode === 'ITS_2026'
//                           ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
//                           : 'border-gray-200 dark:border-gray-700 hover:border-violet-300'
//                       }`}>
//                         <input type="radio" name="fiscalMode" value="ITS_2026"
//                           checked={payrollData.fiscalMode === 'ITS_2026'}
//                           onChange={() => handlePayrollChange('fiscalMode', 'ITS_2026')}
//                           className="mt-1 text-violet-600 focus:ring-violet-500"
//                         />
//                         <div className="flex-1">
//                           <span className="text-sm font-bold text-gray-900 dark:text-white block mb-0.5">
//                             ITS 2026 (nouveau régime)
//                           </span>
//                           <p className="text-xs text-gray-500 dark:text-gray-400">
//                             Barème progressif · Abattement 20% sans plafond · 1 part unique · Conforme loi 2026
//                           </p>
//                         </div>
//                       </label>

//                       {/* IRPP_LEGACY */}
//                       <label className={`flex items-start gap-4 cursor-pointer p-4 rounded-xl border-2 transition-all ${
//                         payrollData.fiscalMode === 'IRPP_LEGACY'
//                           ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
//                           : 'border-gray-200 dark:border-gray-700 hover:border-amber-300'
//                       }`}>
//                         <input type="radio" name="fiscalMode" value="IRPP_LEGACY"
//                           checked={payrollData.fiscalMode === 'IRPP_LEGACY'}
//                           onChange={() => handlePayrollChange('fiscalMode', 'IRPP_LEGACY')}
//                           className="mt-1 text-amber-600 focus:ring-amber-500"
//                         />
//                         <div className="flex-1">
//                           <span className="text-sm font-bold text-gray-900 dark:text-white block mb-0.5">
//                             IRPP (ancien régime avant 2026)
//                           </span>
//                           <p className="text-xs text-gray-500 dark:text-gray-400">
//                             Barème progressif · Abattement 30% plafonné 75 000 F/mois · Avec quotient familial
//                           </p>
//                         </div>
//                       </label>

//                       {/* FORFAIT */}
//                       <label className={`flex items-start gap-4 cursor-pointer p-4 rounded-xl border-2 transition-all ${
//                         payrollData.fiscalMode === 'FORFAIT'
//                           ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20'
//                           : 'border-gray-200 dark:border-gray-700 hover:border-rose-300'
//                       }`}>
//                         <input type="radio" name="fiscalMode" value="FORFAIT"
//                           checked={payrollData.fiscalMode === 'FORFAIT'}
//                           onChange={() => handlePayrollChange('fiscalMode', 'FORFAIT')}
//                           className="mt-1 text-rose-600 focus:ring-rose-500"
//                         />
//                         <div className="flex-1">
//                           <div className="flex items-center gap-2 mb-0.5">
//                             <span className="text-sm font-bold text-gray-900 dark:text-white">Taux forfaitaire</span>
//                             <span className="text-xs bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded-full font-medium">Pratique terrain</span>
//                           </div>
//                           <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
//                             ITS = brut fiscal × taux fixe. Utilisé par de nombreuses entreprises congolaises (SOPEX, COFINA…).
//                             Non conforme au CGI mais compatible avec vos anciens bulletins.
//                           </p>

//                           {payrollData.fiscalMode === 'FORFAIT' && (
//                             <motion.div
//                               initial={{ opacity: 0, y: -5 }}
//                               animate={{ opacity: 1, y: 0 }}
//                               className="flex items-center gap-3 mt-1"
//                             >
//                               <label className="text-xs font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">
//                                 Taux ITS forfaitaire :
//                               </label>
//                               <div className="flex items-center gap-2">
//                                 <input
//                                   type="number" min="1" max="40" step="0.5"
//                                   value={Math.round(payrollData.forfaitItsRate * 100)}
//                                   onChange={e => handlePayrollChange('forfaitItsRate', parseFloat(e.target.value) / 100 || 0.08)}
//                                   className="w-20 text-center border border-rose-300 dark:border-rose-700 rounded-lg px-2 py-1.5 text-sm font-bold bg-white dark:bg-gray-900 text-rose-700 dark:text-rose-300 focus:ring-2 focus:ring-rose-500 focus:border-transparent"
//                                 />
//                                 <span className="text-sm font-bold text-rose-600 dark:text-rose-400">%</span>
//                                 <div className="flex gap-2 ml-2">
//                                   {[6, 8, 10].map(pct => (
//                                     <button key={pct} type="button"
//                                       onClick={() => handlePayrollChange('forfaitItsRate', pct / 100)}
//                                       className={`text-xs px-2 py-1 rounded-lg font-bold border transition-all ${
//                                         Math.round(payrollData.forfaitItsRate * 100) === pct
//                                           ? 'bg-rose-500 text-white border-rose-500'
//                                           : 'border-rose-300 text-rose-600 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-400 dark:hover:bg-rose-900/20'
//                                       }`}
//                                     >
//                                       {pct}%
//                                     </button>
//                                   ))}
//                                 </div>
//                               </div>
//                             </motion.div>
//                           )}
//                         </div>
//                       </label>

//                     </div>

//                     {/* Avertissement FORFAIT */}
//                     {payrollData.fiscalMode === 'FORFAIT' && (
//                       <motion.div
//                         initial={{ opacity: 0 }} animate={{ opacity: 1 }}
//                         className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-2"
//                       >
//                         <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
//                         <p className="text-xs text-amber-700 dark:text-amber-300">
//                           Le taux forfaitaire est une simplification. Il ne correspond pas au barème progressif légal du CGI Congo.
//                           Utilisez ce mode uniquement pour reproduire vos anciens bulletins ou pour des raisons de compatibilité.
//                         </p>
//                       </motion.div>
//                     )}
//                   </div>

//                   {/* CNSS salarié — pour rappel */}
//                   <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-xl">
//                     <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-2 uppercase tracking-wide">
//                       CNSS salarié (pour rappel)
//                     </p>
//                     <div className="flex items-center justify-between">
//                       <div>
//                         <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">Retraite salarié</p>
//                         <p className="text-xs text-emerald-600 dark:text-emerald-400">Plafond : 1 200 000 FCFA/mois</p>
//                       </div>
//                       <span className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-300">4%</span>
//                     </div>
//                   </div>

//                 </div>
//                 {/* FIN card "Paramètres par défaut" */}

//               </motion.div>
//             )}

//             {/* ==================== ONGLET CONVENTION ==================== */}
//             {activeTab === 'convention' && (
//               <motion.div key="convention" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
//                 <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8">
//                   <div className="mb-6">
//                     <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
//                       <BookOpen size={20} className="text-purple-500" /> Convention Collective
//                     </h3>
//                     <p className="text-sm text-gray-500 dark:text-gray-400">
//                       Détermine les catégories professionnelles et salaires minimums lors de la création d'employés.
//                     </p>
//                   </div>

//                   <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
//                     {Object.entries(CONVENTION_CONFIG).map(([code, config]) => {
//                       const Icon = config.icon;
//                       const isSelected = companyData.collectiveAgreement === code;
//                       return (
//                         <button key={code} type="button"
//                           onClick={() => handleCompanyChange('collectiveAgreement', isSelected ? '' : code)}
//                           className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
//                             isSelected
//                               ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
//                               : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50/50 dark:hover:bg-purple-900/10'
//                           }`}>
//                           <div className={`w-10 h-10 ${isSelected ? 'bg-purple-100 dark:bg-purple-900/40' : config.bg} rounded-xl flex items-center justify-center shrink-0`}>
//                             <Icon size={20} className={isSelected ? 'text-purple-600 dark:text-purple-400' : config.color} />
//                           </div>
//                           <div className="flex-1 min-w-0">
//                             <p className={`font-bold text-sm ${isSelected ? 'text-purple-700 dark:text-purple-300' : 'text-gray-900 dark:text-white'}`}>
//                               {config.label}
//                             </p>
//                             <p className="text-xs text-gray-500 truncate">{config.description}</p>
//                           </div>
//                           {isSelected && (
//                             <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center shrink-0">
//                               <Check size={12} className="text-white" />
//                             </div>
//                           )}
//                         </button>
//                       );
//                     })}
//                   </div>

//                   <AnimatePresence>
//                     {companyData.collectiveAgreement && CONVENTION_CONFIG[companyData.collectiveAgreement] && (
//                       <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
//                         className="p-4 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-700 rounded-xl flex items-start gap-3">
//                         <Award size={18} className="text-purple-500 mt-0.5 shrink-0" />
//                         <div>
//                           <p className="text-sm font-bold text-purple-900 dark:text-purple-100">
//                             Convention {CONVENTION_CONFIG[companyData.collectiveAgreement].label} active
//                           </p>
//                           <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">
//                             Les nouveaux employés bénéficieront automatiquement des catégories et salaires minimums de cette convention.
//                           </p>
//                         </div>
//                       </motion.div>
//                     )}
//                   </AnimatePresence>

//                   {!companyData.collectiveAgreement && (
//                     <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700 rounded-xl">
//                       <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
//                         <AlertCircle size={13} />
//                         Aucune convention sélectionnée — les catégories ne seront pas pré-remplies.
//                       </p>
//                     </div>
//                   )}
//                 </div>
//               </motion.div>
//             )}

//             {/* ==================== ONGLET LOCALISATION ==================== */}
//             {activeTab === 'location' && (
//               <motion.div key="location" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
//                 <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800 p-4 rounded-2xl flex gap-3 items-start">
//                   <Smartphone className="text-orange-500 shrink-0 mt-1" size={20} />
//                   <p className="text-xs text-orange-600 dark:text-orange-400">
//                     Pour la précision GPS optimale, effectuez cette manipulation <strong>depuis un smartphone au bureau</strong>.
//                   </p>
//                 </div>

//                 <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
//                   <div className="flex justify-between items-center mb-6">
//                     <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
//                       <Navigation size={20} className="text-red-500" /> Géolocalisation du Site
//                     </h3>
//                     <button onClick={getCurrentLocation}
//                       className="text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-lg border border-red-100 dark:border-red-800 hover:bg-red-100 font-bold flex items-center gap-1">
//                       <MapPin size={12} /> Ma position
//                     </button>
//                   </div>

//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     <div>
//                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Latitude</label>
//                       <input type="number" step="0.000001" value={companyData.latitude}
//                         onChange={e => handleCompanyChange('latitude', parseFloat(e.target.value) || 0)}
//                         className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl font-mono text-gray-900 dark:text-white" />
//                     </div>
//                     <div>
//                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Longitude</label>
//                       <input type="number" step="0.000001" value={companyData.longitude}
//                         onChange={e => handleCompanyChange('longitude', parseFloat(e.target.value) || 0)}
//                         className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl font-mono text-gray-900 dark:text-white" />
//                     </div>
//                     <div className="md:col-span-2">
//                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Rayon autorisé (mètres)</label>
//                       <input type="number" value={companyData.allowedRadius}
//                         onChange={e => handleCompanyChange('allowedRadius', parseFloat(e.target.value) || 0)}
//                         className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl font-bold text-gray-900 dark:text-white" />
//                       <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
//                         <AlertTriangle size={12} className="text-orange-500" />
//                         Les employés ne pourront pointer que dans ce rayon.
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               </motion.div>
//             )}

//             {/* ==================== ONGLET HORAIRES ==================== */}
//             {activeTab === 'attendance' && (
//               <motion.div key="attendance" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">

//                 <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
//                   <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
//                     <Clock size={20} className="text-blue-500" /> Horaires de Travail
//                   </h3>

//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     <div>
//                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Heure de début</label>
//                       <select value={payrollData.officialStartHour}
//                         onChange={e => handlePayrollChange('officialStartHour', parseInt(e.target.value))}
//                         className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl text-lg font-semibold text-gray-900 dark:text-white">
//                         {Array.from({ length: 15 }, (_, i) => i + 6).map(hour => (
//                           <option key={hour} value={hour}>{String(hour).padStart(2, '0')}:00</option>
//                         ))}
//                       </select>
//                     </div>
//                     <div>
//                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tolérance (minutes)</label>
//                       <input type="number" min="0" max="120" step="5" value={payrollData.lateToleranceMinutes}
//                         onChange={e => handlePayrollChange('lateToleranceMinutes', parseInt(e.target.value) || 0)}
//                         className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl text-lg font-semibold text-gray-900 dark:text-white" />
//                     </div>
//                   </div>

//                   <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
//                     <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">Aperçu de la règle</p>
//                     <p className="text-sm text-blue-700 dark:text-blue-300">
//                       En retard après <strong>{calculateLateTime()}</strong>
//                       {' · '}Pointage à {calculateNextMinute()} → retard
//                     </p>
//                   </div>
//                 </div>

//                 <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
//                   <div className="flex justify-between items-center mb-6">
//                     <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
//                       <Users size={20} className="text-purple-500" /> Jours de Travail
//                     </h3>
//                     <button onClick={() => setPayrollData(p => ({ ...p, workDays: [1, 2, 3, 4, 5, 6, 7] }))}
//                       className="text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 px-3 py-1.5 rounded-lg border border-purple-100 dark:border-purple-800 hover:bg-purple-100 font-bold">
//                       Tout sélectionner
//                     </button>
//                   </div>
//                   <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
//                     {DAYS_OF_WEEK.map(day => (
//                       <button key={day.value} onClick={() => toggleWorkDay(day.value)}
//                         className={`p-3 rounded-xl font-bold text-sm transition-all border-2 ${
//                           payrollData.workDays.includes(day.value)
//                             ? 'bg-purple-500 text-white border-purple-500 shadow-lg shadow-purple-500/20'
//                             : 'bg-gray-50 dark:bg-gray-750 text-gray-400 border-gray-200 dark:border-gray-600 hover:border-purple-300'
//                         }`}>
//                         {day.label}
//                       </button>
//                     ))}
//                   </div>
//                 </div>

//                 <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
//                   <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
//                     <Calendar size={20} className="text-emerald-500" /> Temps de Travail Mensuel
//                   </h3>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     <div>
//                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Jours ouvrés / mois</label>
//                       <input type="number" min="20" max="31" value={payrollData.workDaysPerMonth}
//                         onChange={e => handlePayrollChange('workDaysPerMonth', parseInt(e.target.value) || 26)}
//                         className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl text-lg font-semibold text-gray-900 dark:text-white" />
//                     </div>
//                     <div>
//                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Heures normales / jour</label>
//                       <input type="number" min="6" max="12" step="0.5" value={payrollData.workHoursPerDay}
//                         onChange={e => handlePayrollChange('workHoursPerDay', parseFloat(e.target.value) || 8)}
//                         className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl text-lg font-semibold text-gray-900 dark:text-white" />
//                     </div>
//                   </div>
//                   <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-gray-200 dark:border-gray-700">
//                     <p className="text-sm text-gray-600 dark:text-gray-300">
//                       Heures mensuelles :{' '}
//                       <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
//                         {(payrollData.workDaysPerMonth * payrollData.workHoursPerDay).toFixed(1)}
//                       </span> h
//                     </p>
//                   </div>
//                 </div>
//               </motion.div>
//             )}

//             {/* ==================== ONGLET COORDONNÉES ==================== */}
//             {activeTab === 'contact' && (
//               <motion.div key="contact" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
//                 <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
//                   <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
//                     <MapPin size={20} className="text-indigo-500" /> Adresse Postale
//                   </h3>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     <div className="md:col-span-2">
//                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Adresse Complète</label>
//                       <input value={companyData.address} onChange={e => handleCompanyChange('address', e.target.value)}
//                         placeholder="123 Avenue de la République"
//                         className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white" />
//                     </div>
//                     <div>
//                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ville</label>
//                       <input value={companyData.city} onChange={e => handleCompanyChange('city', e.target.value)}
//                         placeholder="Pointe-Noire"
//                         className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white" />
//                     </div>
//                   </div>
//                 </div>

//                 <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
//                   <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
//                     <Phone size={20} className="text-green-500" /> Contacts
//                   </h3>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     <div>
//                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Téléphone</label>
//                       <input value={companyData.phone} onChange={e => handleCompanyChange('phone', e.target.value)}
//                         placeholder="+242 06 123 45 67"
//                         className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white" />
//                     </div>
//                     <div>
//                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
//                       <input type="email" value={companyData.email} onChange={e => handleCompanyChange('email', e.target.value)}
//                         placeholder="contact@entreprise.cg"
//                         className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white" />
//                     </div>
//                   </div>
//                 </div>
//               </motion.div>
//             )}

//           </AnimatePresence>
//         </div>

//         {/* SIDEBAR ACTIONS */}
//         <div className="lg:col-span-1 space-y-6">
//           <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sticky top-6">
//             <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
//               <History size={20} className="text-gray-400" /> Actions
//             </h3>
//             <button onClick={() => setShowConfirm(true)}
//               className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2">
//               <Save size={18} /> Enregistrer
//             </button>
//             <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/30 rounded-xl">
//               <p className="text-xs text-gray-500 dark:text-gray-400">
//                 <strong className="text-gray-700 dark:text-gray-300">Important :</strong> Ces paramètres affectent toute l'entreprise. Les modifications prennent effet immédiatement.
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* MODAL DE CONFIRMATION */}
//       <AnimatePresence>
//         {showConfirm && (
//           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//             className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
//             onClick={() => setShowConfirm(false)}>
//             <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
//               onClick={e => e.stopPropagation()}
//               className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
//               <div className="flex items-center gap-4 mb-6">
//                 <div className="w-12 h-12 bg-sky-100 dark:bg-sky-900/30 text-sky-500 rounded-full flex items-center justify-center">
//                   <Lock size={24} />
//                 </div>
//                 <div>
//                   <h3 className="text-xl font-bold text-gray-900 dark:text-white">Confirmer les changements</h3>
//                   <p className="text-sm text-gray-500">Ces modifications impacteront toute l'entreprise.</p>
//                 </div>
//               </div>
//               <div className="flex gap-3">
//                 <button onClick={() => setShowConfirm(false)}
//                   className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
//                   Annuler
//                 </button>
//                 <button onClick={handleSave} disabled={isSaving}
//                   className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl flex justify-center items-center gap-2 disabled:opacity-50 transition-colors">
//                   {isSaving ? <><Loader2 className="animate-spin" size={20} /> Sauvegarde...</> : 'Confirmer'}
//                 </button>
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//     </div>
//   );
// }



'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Building2, Phone, Calendar, BookOpen,
  Save, AlertTriangle, History,
  Check,
  Briefcase, Landmark, MapPin, Mail, Lock, Clock, Loader2,
  Navigation, Smartphone, Users, ShieldCheck, AlertCircle,
  HardHat, ShoppingCart, Factory, Flame, Truck,
  Utensils, Leaf, Wifi, HeartPulse, GraduationCap, Award,
  Banknote, Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAlert } from '@/components/providers/AlertProvider';
import { api } from '@/services/api';

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface CompanySettings {
  legalName:             string;
  tradeName:             string;
  rccmNumber:            string;
  cnssNumber:            string;
  taxNumber:             string;
  address:               string;
  city:                  string;
  phone:                 string;
  email:                 string;
  bankName:              string;
  bankAccount:           string;
  bankRib:               string;
  primaryColor:          string;
  secondaryColor:        string;
  latitude:              number;
  longitude:             number;
  allowedRadius:         number;
  appliesCnssEmployer:   boolean;
  defaultAppliesIrpp:    boolean;
  defaultAppliesCnss:    boolean;
  collectiveAgreement?:  string;
  // 🆕 Calendrier de paie
  payrollPaymentDay:     number;  // Jour du mois de paiement (1-31)
  payrollCloseDay:       number;  // Jour de clôture des bulletins (1-31)
}

interface PayrollSettings {
  officialStartHour:    number;
  lateToleranceMinutes: number;
  workDaysPerMonth:     number;
  workHoursPerDay:      number;
  workDays:             number[];
  fiscalMode:           'AUTO' | 'ITS_2026' | 'IRPP_LEGACY' | 'FORFAIT';
  forfaitItsRate:       number;
}

// ─── CNSS PATRONALE : 3 BRANCHES ─────────────────────────────────────────────

const CNSS_BRANCHES = [
  { key: 'pension',  label: 'Retraite & Pension',      rate: 8,    plafond: '1 200 000 FCFA', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/10',  border: 'border-purple-200 dark:border-purple-800' },
  { key: 'famille',  label: 'Prestations familiales',   rate: 10,   plafond: '600 000 FCFA',   color: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-50 dark:bg-blue-900/10',      border: 'border-blue-200 dark:border-blue-800'   },
  { key: 'accident', label: 'Accidents du travail',     rate: 2.25, plafond: '600 000 FCFA',   color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/10', border: 'border-orange-200 dark:border-orange-800' },
];
const CNSS_EMPLOYER_TOTAL = 8 + 10 + 2.25;

// ─── CONVENTION CONFIG ────────────────────────────────────────────────────────

const CONVENTION_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string; description: string }> = {
  BTP:               { icon: HardHat,       color: 'text-orange-600 dark:text-orange-400',    bg: 'bg-orange-100 dark:bg-orange-900/30',    label: 'BTP',               description: 'Bâtiment & Travaux Publics'   },
  COMMERCE:          { icon: ShoppingCart,  color: 'text-blue-600 dark:text-blue-400',        bg: 'bg-blue-100 dark:bg-blue-900/30',        label: 'Commerce',          description: 'Commerce & Distribution'      },
  INDUSTRIE:         { icon: Factory,       color: 'text-slate-600 dark:text-slate-400',      bg: 'bg-slate-100 dark:bg-slate-700/50',      label: 'Industrie',         description: 'Industrie & Manufacture'      },
  HYDROCARBURES:     { icon: Flame,         color: 'text-red-600 dark:text-red-400',          bg: 'bg-red-100 dark:bg-red-900/30',          label: 'Hydrocarbures',     description: 'Pétrole & Gaz'                },
  BANQUES:           { icon: Landmark,      color: 'text-emerald-600 dark:text-emerald-400',  bg: 'bg-emerald-100 dark:bg-emerald-900/30',  label: 'Banques & Finances', description: 'Banques, Assurances & Finance'},
  TRANSPORTS:        { icon: Truck,         color: 'text-purple-600 dark:text-purple-400',    bg: 'bg-purple-100 dark:bg-purple-900/30',    label: 'Transports',        description: 'Transports & Logistique'      },
  HOTELLERIE:        { icon: Utensils,      color: 'text-amber-600 dark:text-amber-400',      bg: 'bg-amber-100 dark:bg-amber-900/30',      label: 'Hôtellerie',        description: 'Hôtellerie & Restauration'    },
  AGRICULTURE:       { icon: Leaf,          color: 'text-green-600 dark:text-green-400',      bg: 'bg-green-100 dark:bg-green-900/30',      label: 'Agriculture',       description: 'Agriculture & Sylviculture'   },
  TELECOMMUNICATIONS:{ icon: Wifi,          color: 'text-cyan-600 dark:text-cyan-400',        bg: 'bg-cyan-100 dark:bg-cyan-900/30',        label: 'Télécommunications', description: 'Télécoms & Technologies'      },
  SANTE:             { icon: HeartPulse,    color: 'text-pink-600 dark:text-pink-400',        bg: 'bg-pink-100 dark:bg-pink-900/30',        label: 'Santé',             description: 'Santé & Pharmacie'            },
  EDUCATION:         { icon: GraduationCap, color: 'text-indigo-600 dark:text-indigo-400',    bg: 'bg-indigo-100 dark:bg-indigo-900/30',    label: 'Éducation',         description: 'Enseignement & Formation'     },
};

// ─── DEFAULTS ─────────────────────────────────────────────────────────────────

const DEFAULT_COMPANY: CompanySettings = {
  legalName: '', tradeName: '', rccmNumber: '', cnssNumber: '', taxNumber: '',
  address: '', city: '', phone: '', email: '',
  bankName: '', bankAccount: '', bankRib: '',
  primaryColor: '#0EA5E9', secondaryColor: '#10B981',
  latitude: 0, longitude: 0, allowedRadius: 100,
  appliesCnssEmployer: true,
  defaultAppliesIrpp:  true,
  defaultAppliesCnss:  true,
  collectiveAgreement: '',
  payrollPaymentDay:   10,  // valeur par défaut schema Prisma
  payrollCloseDay:     25,  // valeur par défaut schema Prisma
};

const DEFAULT_PAYROLL: PayrollSettings = {
  officialStartHour:    8,
  lateToleranceMinutes: 0,
  workDaysPerMonth:     26,
  workHoursPerDay:      8,
  workDays:             [1, 2, 3, 4, 5],
  fiscalMode:           'AUTO',
  forfaitItsRate:       0.08,
};

const DAYS_OF_WEEK = [
  { value: 1, label: 'Lundi' }, { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' }, { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' }, { value: 6, label: 'Samedi' },
  { value: 7, label: 'Dimanche' },
];

// ─── TYPE ONGLETS ─────────────────────────────────────────────────────────────

type TabId = 'general' | 'fiscal' | 'convention' | 'payroll_calendar' | 'location' | 'attendance' | 'contact';

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────

export default function CompanySettingsPage() {
  const alert    = useAlert();
  const router   = useRouter();

  const [activeTab,    setActiveTab]    = useState<TabId>('general');
  const [companyData,  setCompanyData]  = useState<CompanySettings>(DEFAULT_COMPANY);
  const [payrollData,  setPayrollData]  = useState<PayrollSettings>(DEFAULT_PAYROLL);
  const [isLoading,    setIsLoading]    = useState(true);
  const [isSaving,     setIsSaving]     = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);

  // ── Chargement ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const company: any = await api.get('/companies/mine');
        if (company) {
          setCompanyData({
            legalName:            company.legalName           || '',
            tradeName:            company.tradeName           || '',
            rccmNumber:           company.rccmNumber          || '',
            cnssNumber:           company.cnssNumber          || '',
            taxNumber:            company.taxNumber           || '',
            address:              company.address             || '',
            city:                 company.city                || '',
            phone:                company.phone               || '',
            email:                company.email               || '',
            bankName:             company.bankName            || '',
            bankAccount:          company.bankAccount         || '',
            bankRib:              company.bankRib             || '',
            primaryColor:         company.primaryColor        || '#0EA5E9',
            secondaryColor:       company.secondaryColor      || '#10B981',
            latitude:             company.latitude            || 0,
            longitude:            company.longitude           || 0,
            allowedRadius:        company.allowedRadius       || 100,
            appliesCnssEmployer:  company.appliesCnssEmployer ?? true,
            defaultAppliesIrpp:   company.defaultAppliesIrpp  ?? true,
            defaultAppliesCnss:   company.defaultAppliesCnss  ?? true,
            collectiveAgreement:  company.collectiveAgreement || '',
            // 🆕 Calendrier de paie — valeurs BDD avec fallback schéma Prisma
            payrollPaymentDay:    company.payrollPaymentDay   ?? 10,
            payrollCloseDay:      company.payrollCloseDay     ?? 25,
          });
        }

        const settings: any = await api.get('/payroll-settings');
        if (settings) {
          setPayrollData({
            officialStartHour:    settings.officialStartHour    ?? 8,
            lateToleranceMinutes: settings.lateToleranceMinutes ?? 0,
            workDaysPerMonth:     settings.workDaysPerMonth     ?? 26,
            workHoursPerDay:      settings.workHoursPerDay      ?? 8,
            workDays:             settings.workDays             || [1, 2, 3, 4, 5],
            fiscalMode:           settings.fiscalMode           ?? 'AUTO',
            forfaitItsRate:       settings.forfaitItsRate       ?? 0.08,
          });
        }
      } catch (e) {
        console.error('Erreur chargement paramètres', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleCompanyChange = (field: keyof CompanySettings, value: any) =>
    setCompanyData(prev => ({ ...prev, [field]: value }));

  const handlePayrollChange = (field: keyof PayrollSettings, value: any) =>
    setPayrollData(prev => ({ ...prev, [field]: value }));

  const toggleWorkDay = (day: number) => {
    setPayrollData(prev => {
      const workDays = prev.workDays.includes(day)
        ? prev.workDays.filter(d => d !== day)
        : [...prev.workDays, day].sort();
      return { ...prev, workDays };
    });
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert.error('Navigateur non compatible', "La géolocalisation n'est pas supportée.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCompanyData(prev => ({ ...prev, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
        alert.success('Position récupérée', 'Coordonnées GPS enregistrées.');
      },
      (err) => alert.error('Géolocalisation impossible', err.message),
      { enableHighAccuracy: true }
    );
  };

  // ── Sauvegarde ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    // Validation minimale date de paie
    if (companyData.payrollPaymentDay < 1 || companyData.payrollPaymentDay > 31) {
      alert.error('Valeur invalide', 'Le jour de paiement doit être entre 1 et 31.');
      return;
    }
    if (companyData.payrollCloseDay < 1 || companyData.payrollCloseDay > 31) {
      alert.error('Valeur invalide', 'Le jour de clôture doit être entre 1 et 31.');
      return;
    }

    setIsSaving(true);
    try {
      // payrollPaymentDay + payrollCloseDay → PATCH /companies (champ sur Company dans Prisma)
      await api.patch('/companies', {
        ...companyData,
        collectiveAgreement: companyData.collectiveAgreement || null,
      });

      // fiscalMode, workDays, etc. → PATCH /payroll-settings
      await api.patch('/payroll-settings', payrollData);

      setShowConfirm(false);
      alert.success('Paramètres enregistrés', 'Les modifications ont été appliquées.');
    } catch (e: any) {
      alert.error("Erreur d'enregistrement", e.message || 'Impossible de sauvegarder.');
    } finally {
      setIsSaving(false);
    }
  };

  const calculateLateTime = () => {
    const total = payrollData.officialStartHour * 60 + payrollData.lateToleranceMinutes;
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  };
  const calculateNextMinute = () => {
    const total = payrollData.officialStartHour * 60 + payrollData.lateToleranceMinutes + 1;
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  };

  // Aperçu du calendrier de paie
  const getPayrollCalendarPreview = () => {
    const closeDay   = companyData.payrollCloseDay;
    const paymentDay = companyData.payrollPaymentDay;
    const now        = new Date();
    const month      = now.toLocaleString('fr-FR', { month: 'long' });
    const nextMonth  = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      .toLocaleString('fr-FR', { month: 'long' });
    return {
      closeLabel:   `${closeDay} ${month}`,
      paymentLabel: `${paymentDay} ${nextMonth}`,
      daysGap:      paymentDay + (31 - closeDay), // approximation
    };
  };

  // ── Tab button ───────────────────────────────────────────────────────────────
  const TabButton = ({ id, label, icon: Icon }: { id: TabId; label: string; icon: React.ElementType }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all whitespace-nowrap ${
        activeTab === id
          ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg'
          : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
      }`}
    >
      <Icon size={18} /> {label}
    </button>
  );

  // ── Chargement initial ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin text-sky-500" size={48} />
      </div>
    );
  }

  const calPreview = getPayrollCalendarPreview();

  // ── RENDU ────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-[1200px] mx-auto pb-24 px-4 relative">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 mt-6">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()}
            className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors">
            <ArrowLeft size={20} className="text-gray-500" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              Paramètres Entreprise
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Configuration complète : identité, fiscalité et politiques RH.
            </p>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 no-scrollbar">
        <TabButton id="general"          label="Général"             icon={Building2}   />
        <TabButton id="fiscal"           label="Fiscalité"           icon={ShieldCheck} />
        <TabButton id="convention"       label="Convention"          icon={BookOpen}    />
        <TabButton id="payroll_calendar" label="Calendrier de paie"  icon={Banknote}    />
        <TabButton id="location"         label="Localisation"        icon={MapPin}      />
        <TabButton id="attendance"       label="Horaires & Pointage" icon={Clock}       />
        <TabButton id="contact"          label="Coordonnées"         icon={Phone}       />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="wait">

            {/* ══════════════════════════════════════════════
                ONGLET GÉNÉRAL
            ══════════════════════════════════════════════ */}
            {activeTab === 'general' && (
              <motion.div key="general" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <Briefcase size={20} className="text-sky-500" /> Identification
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { field: 'legalName',  label: 'Nom Légal*',      mono: false },
                      { field: 'tradeName',  label: 'Nom Commercial',  mono: false },
                      { field: 'rccmNumber', label: 'N° RCCM*',        mono: true  },
                      { field: 'cnssNumber', label: 'N° CNSS*',        mono: true  },
                      { field: 'taxNumber',  label: 'N° Fiscal (NIU)', mono: true  },
                    ].map(({ field, label, mono }) => (
                      <div key={field}>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{label}</label>
                        <input
                          type="text"
                          value={(companyData as any)[field]}
                          onChange={e => handleCompanyChange(field as any, e.target.value)}
                          className={`w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white ${mono ? 'font-mono' : ''}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <Landmark size={20} className="text-emerald-500" /> Banque Principale
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Banque</label>
                      <select value={companyData.bankName} onChange={e => handleCompanyChange('bankName', e.target.value)}
                        className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white">
                        <option value="">Sélectionner...</option>
                        <option>BGFI Bank</option><option>Ecobank</option>
                        <option>LCB</option><option>UBA</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Numéro de Compte</label>
                      <input value={companyData.bankAccount} onChange={e => handleCompanyChange('bankAccount', e.target.value)}
                        className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl font-mono text-gray-900 dark:text-white" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">RIB / IBAN</label>
                      <input value={companyData.bankRib} onChange={e => handleCompanyChange('bankRib', e.target.value)}
                        className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl font-mono text-gray-900 dark:text-white" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════
                ONGLET FISCALITÉ
            ══════════════════════════════════════════════ */}
            {activeTab === 'fiscal' && (
              <motion.div key="fiscal" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">

                {/* CNSS PATRONALE */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <ShieldCheck size={20} className="text-purple-500" /> CNSS Patronale
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
                    La CNSS patronale est composée de <strong>3 branches distinctes</strong> avec des plafonds différents, conformément au Décret 2009-392.
                  </p>

                  <label className="flex items-start gap-4 cursor-pointer p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl border-2 border-purple-200 dark:border-purple-700 hover:border-purple-400 transition-all group mb-4">
                    <input type="checkbox" checked={companyData.appliesCnssEmployer}
                      onChange={e => handleCompanyChange('appliesCnssEmployer', e.target.checked)}
                      className="w-5 h-5 rounded border-purple-300 text-purple-600 focus:ring-purple-500 mt-0.5" />
                    <div className="flex-1">
                      <span className="text-sm font-bold text-gray-900 dark:text-white block mb-1">
                        L'entreprise est assujettie à la CNSS patronale
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Décochez si votre structure n'est pas encore immatriculée à la CNSS.
                      </p>
                    </div>
                  </label>

                  <AnimatePresence>
                    {companyData.appliesCnssEmployer && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                        <div className="space-y-3 mb-4">
                          {CNSS_BRANCHES.map(branch => (
                            <div key={branch.key}
                              className={`flex items-center justify-between p-4 rounded-xl border ${branch.bg} ${branch.border}`}>
                              <div>
                                <p className={`font-bold text-sm ${branch.color}`}>{branch.label}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Plafond : {branch.plafond}</p>
                              </div>
                              <span className={`text-2xl font-black font-mono ${branch.color}`}>{branch.rate}%</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-900 dark:bg-black rounded-xl">
                          <div>
                            <p className="text-white font-bold text-sm">Total CNSS patronale</p>
                            <p className="text-gray-400 text-xs mt-0.5">Taux combiné (bases plafonnées respectives)</p>
                          </div>
                          <span className="text-2xl font-black font-mono text-white">{CNSS_EMPLOYER_TOTAL}%</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-3 flex items-center gap-1.5">
                          <AlertCircle size={12} className="text-amber-400 shrink-0" />
                          Ces taux sont <strong>fixés par la loi congolaise</strong> et ne sont pas modifiables.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* PARAMÈTRES PAR DÉFAUT — NOUVEAUX EMPLOYÉS */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <ShieldCheck size={20} className="text-indigo-500" /> Paramètres par défaut — Nouveaux employés
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
                    Ces valeurs seront pré-remplies à la création d'un nouvel employé.
                  </p>

                  <div className="p-4 bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800 rounded-xl mb-5">
                    <p className="text-sm font-bold text-violet-900 dark:text-violet-100 mb-1 flex items-center gap-2">
                      <AlertCircle size={15} className="shrink-0" /> Réforme fiscale 2026 — ITS (ex-IRPP)
                    </p>
                    <p className="text-xs text-violet-700 dark:text-violet-300 leading-relaxed">
                      Depuis le 1er janvier 2026, l'IRPP est remplacé par l'<strong>ITS</strong>. L'abattement passe de <strong>30% plafonné</strong> à <strong>20% sans plafond</strong>. Quotient familial supprimé — 1 part unique. Le système bascule automatiquement selon l'année du bulletin.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center gap-3 cursor-pointer p-4 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-300 transition-all">
                      <input type="checkbox" checked={companyData.defaultAppliesIrpp}
                        onChange={e => handleCompanyChange('defaultAppliesIrpp', e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                      <div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white block mb-0.5">Par défaut, soumis à l'ITS</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Barème 1% / 10% / 25% / 40%</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer p-4 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-300 transition-all">
                      <input type="checkbox" checked={companyData.defaultAppliesCnss}
                        onChange={e => handleCompanyChange('defaultAppliesCnss', e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                      <div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white block mb-0.5">Par défaut, soumis à la CNSS</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">4% salarié · plafond 1 200 000 F</p>
                      </div>
                    </label>
                  </div>

                  {/* Mode calcul ITS */}
                  <div className="mt-6 p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2 text-sm">
                      <ShieldCheck size={16} className="text-indigo-500" /> Mode de calcul ITS / IRPP
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                      Choisissez comment l'impôt sur salaires est calculé pour tous les bulletins.
                    </p>
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { value: 'AUTO',        color: 'indigo', label: 'Automatique',               badge: 'Recommandé', desc: 'Bulletins < 2026 → IRPP (30%) · Bulletins ≥ 2026 → ITS (20%)' },
                        { value: 'ITS_2026',    color: 'violet', label: 'ITS 2026 (nouveau régime)', badge: null,         desc: 'Barème progressif · Abattement 20% sans plafond · 1 part' },
                        { value: 'IRPP_LEGACY', color: 'amber',  label: 'IRPP (avant 2026)',         badge: null,         desc: 'Barème progressif · Abattement 30% plafonné 75 000 F/mois · Quotient familial' },
                      ].map(opt => (
                        <label key={opt.value} className={`flex items-start gap-4 cursor-pointer p-4 rounded-xl border-2 transition-all ${
                          payrollData.fiscalMode === opt.value
                            ? `border-${opt.color}-500 bg-${opt.color}-50 dark:bg-${opt.color}-900/20`
                            : `border-gray-200 dark:border-gray-700 hover:border-${opt.color}-300`
                        }`}>
                          <input type="radio" name="fiscalMode" value={opt.value}
                            checked={payrollData.fiscalMode === opt.value}
                            onChange={() => handlePayrollChange('fiscalMode', opt.value)}
                            className={`mt-1 text-${opt.color}-600`} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-sm font-bold text-gray-900 dark:text-white">{opt.label}</span>
                              {opt.badge && (
                                <span className={`text-xs bg-${opt.color}-100 dark:bg-${opt.color}-900/40 text-${opt.color}-700 dark:text-${opt.color}-300 px-2 py-0.5 rounded-full font-medium`}>
                                  {opt.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{opt.desc}</p>
                          </div>
                        </label>
                      ))}

                      {/* Forfait */}
                      <label className={`flex items-start gap-4 cursor-pointer p-4 rounded-xl border-2 transition-all ${
                        payrollData.fiscalMode === 'FORFAIT'
                          ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-rose-300'
                      }`}>
                        <input type="radio" name="fiscalMode" value="FORFAIT"
                          checked={payrollData.fiscalMode === 'FORFAIT'}
                          onChange={() => handlePayrollChange('fiscalMode', 'FORFAIT')}
                          className="mt-1 text-rose-600" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-bold text-gray-900 dark:text-white">Taux forfaitaire</span>
                            <span className="text-xs bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded-full font-medium">Pratique terrain</span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                            ITS = brut fiscal × taux fixe. Non conforme CGI mais compatible anciens bulletins.
                          </p>
                          {payrollData.fiscalMode === 'FORFAIT' && (
                            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
                              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">Taux ITS :</label>
                              <div className="flex items-center gap-2">
                                <input type="number" min="1" max="40" step="0.5"
                                  value={Math.round(payrollData.forfaitItsRate * 100)}
                                  onChange={e => handlePayrollChange('forfaitItsRate', parseFloat(e.target.value) / 100 || 0.08)}
                                  className="w-20 text-center border border-rose-300 dark:border-rose-700 rounded-lg px-2 py-1.5 text-sm font-bold bg-white dark:bg-gray-900 text-rose-700 focus:ring-2 focus:ring-rose-500" />
                                <span className="text-sm font-bold text-rose-600">%</span>
                                <div className="flex gap-2 ml-2">
                                  {[6, 8, 10].map(pct => (
                                    <button key={pct} type="button"
                                      onClick={() => handlePayrollChange('forfaitItsRate', pct / 100)}
                                      className={`text-xs px-2 py-1 rounded-lg font-bold border transition-all ${
                                        Math.round(payrollData.forfaitItsRate * 100) === pct
                                          ? 'bg-rose-500 text-white border-rose-500'
                                          : 'border-rose-300 text-rose-600 hover:bg-rose-50'
                                      }`}>{pct}%</button>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════
                ONGLET CONVENTION COLLECTIVE
            ══════════════════════════════════════════════ */}
            {activeTab === 'convention' && (
              <motion.div key="convention" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8">
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
                      <BookOpen size={20} className="text-purple-500" /> Convention Collective
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      La convention collective détermine les catégories professionnelles et salaires minimums appliqués à vos employés.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                    {Object.entries(CONVENTION_CONFIG).map(([code, config]) => {
                      const Icon       = config.icon;
                      const isSelected = companyData.collectiveAgreement === code;
                      return (
                        <button key={code} type="button"
                          onClick={() => handleCompanyChange('collectiveAgreement', isSelected ? '' : code)}
                          className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                            isSelected
                              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50/50'
                          }`}
                        >
                          <div className={`w-10 h-10 ${isSelected ? 'bg-purple-100 dark:bg-purple-900/40' : config.bg} rounded-xl flex items-center justify-center shrink-0`}>
                            <Icon size={20} className={isSelected ? 'text-purple-600 dark:text-purple-400' : config.color} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-bold text-sm ${isSelected ? 'text-purple-700 dark:text-purple-300' : 'text-gray-900 dark:text-white'}`}>
                              {config.label}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{config.description}</p>
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center shrink-0">
                              <Check size={12} className="text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <AnimatePresence>
                    {companyData.collectiveAgreement && CONVENTION_CONFIG[companyData.collectiveAgreement] && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="p-4 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-700 rounded-xl flex items-start gap-3">
                        <Award size={18} className="text-purple-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-purple-900 dark:text-purple-100">
                            Convention {CONVENTION_CONFIG[companyData.collectiveAgreement].label} active
                          </p>
                          <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">
                            Les nouveaux employés bénéficieront automatiquement des catégories et salaires minimums de cette convention.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!companyData.collectiveAgreement && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700 rounded-xl">
                      <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
                        <AlertCircle size={13} />
                        Aucune convention sélectionnée — les catégories ne seront pas pré-remplies.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════
                🆕 ONGLET CALENDRIER DE PAIE
            ══════════════════════════════════════════════ */}
            {activeTab === 'payroll_calendar' && (
              <motion.div key="payroll_calendar" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">

                {/* Bannière info */}
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex gap-3 items-start">
                  <Info size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Impact sur le suivi des impayés</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 leading-relaxed">
                      Ces deux dates configurent l'échéance réelle calculée par le service <strong>UnpaidSalaryService</strong>. Le salaire du mois M est considéré <strong>en retard</strong> si non payé après le <strong>jour {companyData.payrollPaymentDay} du mois M+1</strong>.
                    </p>
                  </div>
                </div>

                {/* Aperçu calendrier */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <Calendar size={20} className="text-emerald-500" /> Aperçu du cycle de paie
                  </h3>

                  {/* Timeline visuelle */}
                  <div className="relative flex items-center justify-between gap-2 mb-8 px-2">
                    {/* Ligne de connexion */}
                    <div className="absolute left-0 right-0 top-6 h-0.5 bg-gradient-to-r from-blue-200 via-emerald-200 to-emerald-400 dark:from-blue-800 dark:via-emerald-800 dark:to-emerald-600 z-0" />

                    {[
                      { day: '1er', label: 'Début du mois', sub: 'Mois de travail', color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300', icon: '📅' },
                      { day: `${companyData.payrollCloseDay}`, label: 'Clôture bulletins', sub: 'Mois courant', color: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300', icon: '📋' },
                      { day: `${companyData.payrollPaymentDay}`, label: 'Date de paiement', sub: 'Mois suivant', color: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300', icon: '💰' },
                    ].map((step, i) => (
                      <div key={i} className="relative z-10 flex flex-col items-center gap-2 flex-1">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg ${step.color}`}>
                          {step.icon}
                        </div>
                        <div className="text-center">
                          <p className={`text-xs font-black ${step.color.split(' ')[2]}`}>Jour {step.day}</p>
                          <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{step.label}</p>
                          <p className="text-xs text-gray-400">{step.sub}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Résumé en box */}
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <p className="text-sm text-emerald-800 dark:text-emerald-300">
                      Le salaire de <strong className="font-black">mois M</strong> est clôturé le{' '}
                      <strong className="font-black">{calPreview.closeLabel}</strong> et doit être payé
                      avant le <strong className="font-black">{calPreview.paymentLabel}</strong>.
                    </p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                      Délai entre clôture et paiement : environ <strong>{calPreview.daysGap} jours</strong>.
                    </p>
                  </div>
                </div>

                {/* Formulaire */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <Banknote size={20} className="text-emerald-500" /> Jours de référence
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
                    Ces valeurs sont stockées sur votre entreprise et utilisées automatiquement pour calculer les retards de paie.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Jour de clôture */}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-wider">
                        Jour de clôture des bulletins
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={companyData.payrollCloseDay}
                          onChange={e => handleCompanyChange('payrollCloseDay', Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))}
                          className="w-full p-3 pr-16 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl text-2xl font-black text-amber-600 dark:text-amber-400 text-center focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 uppercase">du mois</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Jour jusqu'auquel les pointages et absences sont comptabilisés dans les bulletins du mois.
                      </p>
                      {/* Sélecteurs rapides */}
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {[20, 25, 28, 31].map(d => (
                          <button key={d} type="button"
                            onClick={() => handleCompanyChange('payrollCloseDay', d)}
                            className={`text-xs px-3 py-1.5 rounded-lg font-bold border transition-all ${
                              companyData.payrollCloseDay === d
                                ? 'bg-amber-500 text-white border-amber-500'
                                : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-amber-300 hover:text-amber-600'
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Jour de paiement */}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-wider">
                        Jour de paiement des salaires
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={companyData.payrollPaymentDay}
                          onChange={e => handleCompanyChange('payrollPaymentDay', Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))}
                          className="w-full p-3 pr-16 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl text-2xl font-black text-emerald-600 dark:text-emerald-400 text-center focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 uppercase">du M+1</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Jour du mois <strong>suivant</strong> auquel les salaires doivent être versés. Tout retard au-delà déclenche une alerte.
                      </p>
                      {/* Sélecteurs rapides */}
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {[5, 10, 15, 20].map(d => (
                          <button key={d} type="button"
                            onClick={() => handleCompanyChange('payrollPaymentDay', d)}
                            className={`text-xs px-3 py-1.5 rounded-lg font-bold border transition-all ${
                              companyData.payrollPaymentDay === d
                                ? 'bg-emerald-500 text-white border-emerald-500'
                                : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-emerald-300 hover:text-emerald-600'
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Avertissement cohérence */}
                  {companyData.payrollCloseDay >= companyData.payrollPaymentDay && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="mt-5 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3">
                      <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Attention — cohérence des dates</p>
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                          Le jour de clôture ({companyData.payrollCloseDay}) est ≥ au jour de paiement ({companyData.payrollPaymentDay}).
                          Le paiement se fait le mois <strong>suivant</strong> la clôture, donc c'est correct si vous payez en M+1.
                          Si vous payez dans le même mois, vérifiez vos valeurs.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* Note légale Code du Travail */}
                  <div className="mt-5 p-4 bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 rounded-xl">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                      📋 Art. 95 Code du Travail Congo
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                      Les salaires doivent être payés à <strong>intervalles réguliers</strong> et à <strong>date fixe convenue</strong>. Un retard de 3 mois ou plus permet à l'employé de saisir l'Inspection du Travail.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════
                ONGLET LOCALISATION
            ══════════════════════════════════════════════ */}
            {activeTab === 'location' && (
              <motion.div key="location" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800 p-4 rounded-2xl flex gap-3 items-start">
                  <Smartphone className="text-orange-500 shrink-0 mt-1" size={20} />
                  <p className="text-xs text-orange-600 dark:text-orange-400">
                    Pour la précision GPS optimale, effectuez cette manipulation <strong>depuis un smartphone au bureau</strong>.
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Navigation size={20} className="text-red-500" /> Géolocalisation du Site
                    </h3>
                    <button onClick={getCurrentLocation}
                      className="text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-lg border border-red-100 dark:border-red-800 hover:bg-red-100 font-bold flex items-center gap-1">
                      <MapPin size={12} /> Ma position
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Latitude</label>
                      <input type="number" step="0.000001" value={companyData.latitude}
                        onChange={e => handleCompanyChange('latitude', parseFloat(e.target.value) || 0)}
                        className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl font-mono text-gray-900 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Longitude</label>
                      <input type="number" step="0.000001" value={companyData.longitude}
                        onChange={e => handleCompanyChange('longitude', parseFloat(e.target.value) || 0)}
                        className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl font-mono text-gray-900 dark:text-white" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Rayon autorisé (mètres)</label>
                      <input type="number" value={companyData.allowedRadius}
                        onChange={e => handleCompanyChange('allowedRadius', parseFloat(e.target.value) || 0)}
                        className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl font-bold text-gray-900 dark:text-white" />
                      <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                        <AlertTriangle size={12} className="text-orange-500" />
                        Les employés ne pourront pointer que dans ce rayon.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════
                ONGLET HORAIRES & POINTAGE
            ══════════════════════════════════════════════ */}
            {activeTab === 'attendance' && (
              <motion.div key="attendance" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <Clock size={20} className="text-blue-500" /> Horaires de Travail
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Heure de début</label>
                      <select value={payrollData.officialStartHour}
                        onChange={e => handlePayrollChange('officialStartHour', parseInt(e.target.value))}
                        className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl text-lg font-semibold text-gray-900 dark:text-white">
                        {Array.from({ length: 15 }, (_, i) => i + 6).map(h => (
                          <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tolérance (minutes)</label>
                      <input type="number" min="0" max="120" step="5" value={payrollData.lateToleranceMinutes}
                        onChange={e => handlePayrollChange('lateToleranceMinutes', parseInt(e.target.value) || 0)}
                        className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl text-lg font-semibold text-gray-900 dark:text-white" />
                    </div>
                  </div>
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">Aperçu de la règle</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      En retard après <strong>{calculateLateTime()}</strong>
                      {' · '}Pointage à {calculateNextMinute()} → retard
                    </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Users size={20} className="text-purple-500" /> Jours de Travail
                    </h3>
                    <button onClick={() => setPayrollData(p => ({ ...p, workDays: [1, 2, 3, 4, 5, 6, 7] }))}
                      className="text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 px-3 py-1.5 rounded-lg border border-purple-100 dark:border-purple-800 hover:bg-purple-100 font-bold">
                      Tout sélectionner
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {DAYS_OF_WEEK.map(day => (
                      <button key={day.value} onClick={() => toggleWorkDay(day.value)}
                        className={`p-3 rounded-xl font-bold text-sm transition-all border-2 ${
                          payrollData.workDays.includes(day.value)
                            ? 'bg-purple-500 text-white border-purple-500 shadow-lg shadow-purple-500/20'
                            : 'bg-gray-50 dark:bg-gray-750 text-gray-400 border-gray-200 dark:border-gray-600 hover:border-purple-300'
                        }`}
                      >{day.label}</button>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <Calendar size={20} className="text-emerald-500" /> Temps de Travail Mensuel
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Jours ouvrés / mois</label>
                      <input type="number" min="20" max="31" value={payrollData.workDaysPerMonth}
                        onChange={e => handlePayrollChange('workDaysPerMonth', parseInt(e.target.value) || 26)}
                        className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl text-lg font-semibold text-gray-900 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Heures normales / jour</label>
                      <input type="number" min="6" max="12" step="0.5" value={payrollData.workHoursPerDay}
                        onChange={e => handlePayrollChange('workHoursPerDay', parseFloat(e.target.value) || 8)}
                        className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl text-lg font-semibold text-gray-900 dark:text-white" />
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Heures mensuelles :{' '}
                      <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {(payrollData.workDaysPerMonth * payrollData.workHoursPerDay).toFixed(1)}
                      </span> h
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════
                ONGLET COORDONNÉES
            ══════════════════════════════════════════════ */}
            {activeTab === 'contact' && (
              <motion.div key="contact" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <MapPin size={20} className="text-indigo-500" /> Adresse Postale
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Adresse Complète</label>
                      <input value={companyData.address} onChange={e => handleCompanyChange('address', e.target.value)}
                        placeholder="123 Avenue de la République"
                        className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ville</label>
                      <input value={companyData.city} onChange={e => handleCompanyChange('city', e.target.value)}
                        placeholder="Pointe-Noire"
                        className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <Phone size={20} className="text-green-500" /> Contacts
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Téléphone</label>
                      <input value={companyData.phone} onChange={e => handleCompanyChange('phone', e.target.value)}
                        placeholder="+242 06 123 45 67"
                        className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                      <input type="email" value={companyData.email} onChange={e => handleCompanyChange('email', e.target.value)}
                        placeholder="contact@entreprise.cg"
                        className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* ══════════════════════════════════════════════
            SIDEBAR ACTIONS
        ══════════════════════════════════════════════ */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sticky top-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <History size={20} className="text-gray-400" /> Actions
            </h3>
            <button onClick={() => setShowConfirm(true)}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2">
              <Save size={18} /> Enregistrer
            </button>

            {/* Résumé calendrier de paie dans la sidebar */}
            <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Banknote size={12} /> Calendrier de paie
              </p>
              <div className="space-y-1">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Clôture : <strong className="text-amber-600 dark:text-amber-400">jour {companyData.payrollCloseDay}</strong>
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Paiement : <strong className="text-emerald-600 dark:text-emerald-400">jour {companyData.payrollPaymentDay} (M+1)</strong>
                </p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/30 rounded-xl">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                <strong className="text-gray-700 dark:text-gray-300">Important :</strong> Ces paramètres affectent toute l'entreprise. Les modifications prennent effet immédiatement.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          MODAL DE CONFIRMATION
      ══════════════════════════════════════════════ */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowConfirm(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-sky-100 dark:bg-sky-900/30 text-sky-500 rounded-full flex items-center justify-center">
                  <Lock size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Confirmer les changements</h3>
                  <p className="text-sm text-gray-500">Ces modifications impacteront toute l'entreprise.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  Annuler
                </button>
                <button onClick={handleSave} disabled={isSaving}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl flex justify-center items-center gap-2 disabled:opacity-50 transition-colors">
                  {isSaving ? <><Loader2 className="animate-spin" size={20} /> Sauvegarde...</> : 'Confirmer'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}