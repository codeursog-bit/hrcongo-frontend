// 'use client';

// import React, { useState, useEffect, useMemo } from 'react';
// import { useRouter } from 'next/navigation';
// import { ArrowLeft, Send, Loader2, Info, CheckCircle2, Calculator, CalendarDays, User, Umbrella, Stethoscope, Baby, Ban, Star } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { api } from '@/services/api';
// import { FancySelect } from '@/components/ui/FancySelect';

// export default function NewLeaveRequestPage() {
//   const router = useRouter();
//   const [employees, setEmployees] = useState<any[]>([]);
//   const [currentUser, setCurrentUser] = useState<any>(null);
//   const [myEmployee, setMyEmployee] = useState<any>(null);
//   const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
//   const [loadError, setLoadError] = useState<string | null>(null);
//   const [formData, setFormData] = useState({
//     employeeId: '',
//     type: 'ANNUAL',
//     startDate: '',
//     endDate: '',
//     reason: ''
//   });
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [showConfirmation, setShowConfirmation] = useState(false);

//   useEffect(() => {
//     const loadData = async () => {
//       try {
//         const storedUser = localStorage.getItem('user');
//         if (!storedUser) { router.push('/login'); return; }

//         const user = JSON.parse(storedUser);
//         setCurrentUser(user);

//         // ── ADMIN / HR / SUPER_ADMIN ──────────────────────────────────────────
//         // Gèrent les congés pour tous les employés — pas de fiche perso requise
//         if (['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'].includes(user.role)) {
//           try {
//             // ✅ /employees/simple : liste légère, pas d'objet paginé
//             const data = await api.get<any[]>('/employees/simple');
//             const list = Array.isArray(data) ? data : [];
//             setEmployees(list);
//             if (list.length > 0) {
//               setFormData(prev => ({ ...prev, employeeId: list[0].id }));
//             } else {
//               setLoadError("Aucun employé dans l'entreprise.");
//             }
//           } catch (err) {
//             console.error('Erreur chargement employés:', err);
//             setLoadError("Impossible de charger la liste des employés.");
//           }

//         // ── MANAGER ───────────────────────────────────────────────────────────
//         // Peut poser pour lui-même + membres de son département
//         } else if (user.role === 'MANAGER') {
//           try {
//             const [emp, deptList] = await Promise.all([
//               api.get<any>('/employees/me').catch(() => null),
//               // /employees/simple filtre déjà par département côté backend
//               api.get<any[]>('/employees/simple').catch(() => [])
//             ]);

//             const list: any[] = Array.isArray(deptList) ? [...deptList] : [];

//             if (emp?.id) {
//               setMyEmployee(emp);
//               // Ajouter le manager en tête s'il n'est pas déjà dans la liste
//               if (!list.some(e => e.id === emp.id)) {
//                 list.unshift({
//                   id: emp.id,
//                   firstName: emp.firstName,
//                   lastName: emp.lastName,
//                   position: emp.position,
//                   department: emp.department,
//                 });
//               }
//               setFormData(prev => ({ ...prev, employeeId: emp.id }));
//             } else if (list.length > 0) {
//               setFormData(prev => ({ ...prev, employeeId: list[0].id }));
//             }

//             setEmployees(list);
//             if (list.length === 0) {
//               setLoadError("Aucun employé accessible dans votre département.");
//             }
//           } catch (err) {
//             console.error('Erreur chargement employés manager:', err);
//             setLoadError("Impossible de charger les employés.");
//           }

//         // ── EMPLOYEE ──────────────────────────────────────────────────────────
//         // Pose uniquement pour lui-même
//         } else {
//           try {
//             const emp = await api.get<any>('/employees/me');
//             if (emp?.id) {
//               setMyEmployee(emp);
//               setFormData(prev => ({ ...prev, employeeId: emp.id }));
//             } else {
//               setLoadError("Profil employé introuvable. Contactez votre RH.");
//             }
//           } catch (err) {
//             console.error('Erreur profil employé:', err);
//             setLoadError("Impossible de récupérer votre profil.");
//           }
//         }
//       } catch (err) {
//         console.error('Erreur chargement:', err);
//         setLoadError("Erreur inattendue lors du chargement.");
//       } finally {
//         setIsLoadingEmployees(false);
//       }
//     };

//     loadData();
//   }, [router]);

//   const calculationDetails = useMemo(() => {
//     if (!formData.startDate || !formData.endDate) return null;
//     const start = new Date(formData.startDate);
//     const end   = new Date(formData.endDate);
//     if (end < start) return null;

//     let businessDays = 0, weekendDays = 0, totalDays = 0;
//     const cur = new Date(start);
//     while (cur <= end) {
//       const day = cur.getDay();
//       totalDays++;
//       if (day === 0 || day === 6) weekendDays++;
//       else businessDays++;
//       cur.setDate(cur.getDate() + 1);
//     }
//     return { businessDays, weekendDays, totalDays };
//   }, [formData.startDate, formData.endDate]);

//   const handleSubmit = async () => {
//     setIsSubmitting(true);
//     try {
//       await api.post('/leaves', {
//         employeeId: formData.employeeId,
//         type:       formData.type,
//         startDate:  formData.startDate,
//         endDate:    formData.endDate,
//         reason:     formData.reason
//       });
//       setShowConfirmation(true);
//       setTimeout(() => router.push('/conges/mon-espace'), 2500);
//     } catch (e: any) {
//       console.error('Erreur soumission congé:', e);
//       alert(e?.message || "Erreur lors de la demande");
//       setIsSubmitting(false);
//     }
//   };

//   // Rôles qui voient une liste de sélection
//   const showEmployeeSelect = currentUser &&
//     ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'MANAGER'].includes(currentUser.role);

//   // Nom affiché pour EMPLOYEE (pas de liste)
//   const displayName = myEmployee
//     ? `${myEmployee.firstName} ${myEmployee.lastName}`
//     : '—';

//   return (
//     <div className="max-w-3xl mx-auto py-8 px-4">

//       <AnimatePresence>
//         {showConfirmation && (
//           <motion.div
//             initial={{ opacity: 0, scale: 0.9 }}
//             animate={{ opacity: 1, scale: 1 }}
//             className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
//           >
//             <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-gray-100 dark:border-gray-700">
//               <div className="mx-auto w-20 h-20 bg-sky-100 dark:bg-sky-900/30 rounded-full flex items-center justify-center mb-6 text-sky-600">
//                 <Send size={40} />
//               </div>
//               <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Demande Envoyée !</h2>
//               <p className="text-gray-500 dark:text-gray-400 mb-4">
//                 Votre demande de <strong>{calculationDetails?.businessDays} jours</strong> a été transmise pour validation.
//               </p>
//               <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
//                 <motion.div className="h-full bg-sky-500" initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 2.5 }} />
//               </div>
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* Header */}
//       <div className="flex items-center gap-4 mb-8">
//         <button onClick={() => router.back()} className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors">
//           <ArrowLeft size={20} className="text-gray-500 dark:text-gray-400" />
//         </button>
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Planifier une absence</h1>
//           <p className="text-sm text-gray-500 dark:text-gray-400">Remplissez le formulaire pour soumettre votre demande.</p>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//         <div className="lg:col-span-2 space-y-6 bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700">

//           {/* Info solde */}
//           <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 flex gap-3 items-start">
//             <Info className="text-blue-500 shrink-0 mt-0.5" size={20} />
//             <p className="text-sm text-blue-700 dark:text-blue-300">
//               Chaque mois travaillé ajoute <strong>2,5 jours</strong> à votre solde. Ce solde est utilisé uniquement pour les jours ouvrés (Lun-Ven) de votre absence.
//             </p>
//           </div>

//           {/* Sélection employé */}
//           {isLoadingEmployees ? (
//             <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-600 flex items-center gap-3">
//               <Loader2 className="animate-spin text-gray-400" size={20} />
//               <span className="text-sm text-gray-500 dark:text-gray-400">Chargement...</span>
//             </div>

//           ) : loadError && showEmployeeSelect ? (
//             <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-sm">
//               {loadError}
//             </div>

//           ) : showEmployeeSelect ? (
//             <FancySelect
//               label="Employé concerné"
//               value={formData.employeeId}
//               onChange={(v) => setFormData({ ...formData, employeeId: v })}
//               icon={User}
//               options={employees.map(emp => ({
//                 value: emp.id,
//                 label: `${emp.firstName} ${emp.lastName}${emp.department?.name ? ` · ${emp.department.name}` : ''}`
//               }))}
//             />

//           ) : loadError ? (
//             // EMPLOYEE sans profil trouvé
//             <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
//               {loadError}
//             </div>

//           ) : (
//             // EMPLOYEE — affichage fixe
//             <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-600 flex items-center gap-4">
//               <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-600 flex items-center justify-center">
//                 <User size={20} />
//               </div>
//               <div>
//                 <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Demandeur</p>
//                 <p className="font-bold text-gray-900 dark:text-white">{displayName}</p>
//               </div>
//             </div>
//           )}

//           {/* Type d'absence */}
//           <FancySelect
//             label="Type d'absence"
//             value={formData.type}
//             onChange={(v) => setFormData({ ...formData, type: v })}
//             icon={Umbrella}
//             options={[
//               { value: 'ANNUAL',    label: 'Congés Annuels (Payés)',        icon: Umbrella },
//               { value: 'SICK',      label: 'Maladie (Justificatif requis)', icon: Stethoscope },
//               { value: 'MATERNITY', label: 'Maternité',                     icon: Baby },
//               { value: 'PATERNITY', label: 'Paternité',                     icon: User },
//               { value: 'UNPAID',    label: 'Sans Solde',                    icon: Ban },
//               { value: 'SPECIAL',   label: 'Événement Familial',            icon: Star },
//             ]}
//           />

//           {/* Dates */}
//           <div className="grid grid-cols-2 gap-6">
//             <div>
//               <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Du (Inclus)</label>
//               <input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })}
//                 className="w-full p-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500/20 outline-none font-medium" />
//             </div>
//             <div>
//               <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Au (Inclus)</label>
//               <input type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })}
//                 className="w-full p-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500/20 outline-none font-medium" />
//             </div>
//           </div>

//           {/* Motif */}
//           <div>
//             <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Motif & Commentaires</label>
//             <textarea value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })}
//               className="w-full p-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500/20 outline-none font-medium resize-none"
//               rows={3} placeholder="Ex: Voyage prévu, RDV médical, etc..." />
//           </div>

//           <button
//             onClick={handleSubmit}
//             disabled={isSubmitting || showConfirmation || !calculationDetails || !formData.employeeId}
//             className="w-full py-4 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl flex justify-center items-center gap-2 shadow-lg transition-all transform hover:scale-[1.02]"
//           >
//             {isSubmitting ? <Loader2 className="animate-spin" /> : <Send size={20} />}
//             Soumettre pour validation
//           </button>
//         </div>

//         {/* Sidebar simulation */}
//         <div className="lg:col-span-1">
//           <div className="bg-gradient-to-br from-gray-900 to-slate-800 dark:from-slate-800 dark:to-black text-white p-6 rounded-3xl shadow-xl">
//             <div className="flex items-center gap-2 mb-6 opacity-80">
//               <Calculator size={20} />
//               <span className="text-sm font-bold uppercase tracking-wider">Simulation</span>
//             </div>

//             {calculationDetails ? (
//               <div className="space-y-6">
//                 <div className="text-center">
//                   <span className="text-5xl font-extrabold">{calculationDetails.businessDays}</span>
//                   <p className="text-sm text-gray-400 font-medium mt-1">Jours à déduire</p>
//                 </div>
//                 <div className="bg-white/10 rounded-xl p-4 space-y-3">
//                   <div className="flex justify-between text-sm">
//                     <span className="text-gray-300">Durée totale</span>
//                     <span className="font-bold">{calculationDetails.totalDays} jours</span>
//                   </div>
//                   <div className="flex justify-between text-sm">
//                     <span className="text-gray-300">Week-ends (Gratuit)</span>
//                     <span className="font-bold text-emerald-400">-{calculationDetails.weekendDays} jours</span>
//                   </div>
//                   <div className="h-px bg-white/20 my-2" />
//                   <div className="flex justify-between text-sm">
//                     <span className="text-white font-bold">Impact Solde</span>
//                     <span className="font-bold text-orange-400">-{calculationDetails.businessDays}</span>
//                   </div>
//                 </div>
//                 <div className="flex items-start gap-2 text-xs text-gray-400 leading-relaxed">
//                   <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
//                   <p>Les samedis et dimanches ne sont pas décomptés de votre solde de congés.</p>
//                 </div>
//               </div>
//             ) : (
//               <div className="flex flex-col items-center justify-center py-10 text-gray-500">
//                 <CalendarDays size={48} className="mb-4 opacity-20" />
//                 <p className="text-center text-sm">Sélectionnez vos dates pour voir la simulation.</p>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }




'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Send, Loader2, Info, CheckCircle2, Calculator,
  CalendarDays, User, Umbrella, Stethoscope, Baby, Ban, Star,
  AlertTriangle, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';
import { FancySelect } from '@/components/ui/FancySelect';

// ✅ CONGO : 26j/an = 2.1667j/mois (pas 2.5)
const CONGO_MONTHLY_RATE = (26 / 12).toFixed(2); // "2.17"

interface LeaveBalance {
  annualRemaining:    number;
  canTakeAnnualLeave: boolean;
  monthsUntilEligible: number;
  monthsWorked:       number;
}

export default function NewLeaveRequestPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [myEmployee, setMyEmployee] = useState<any>(null);
  const [selectedBalance, setSelectedBalance] = useState<LeaveBalance | null>(null);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    type: 'ANNUAL',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) { router.push('/login'); return; }
        const user = JSON.parse(storedUser);
        setCurrentUser(user);

        if (['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'].includes(user.role)) {
          const data = await api.get<any[]>('/employees/simple');
          const list = Array.isArray(data) ? data : [];
          setEmployees(list);
          if (list.length > 0) setFormData(prev => ({ ...prev, employeeId: list[0].id }));
          else setLoadError("Aucun employé dans l'entreprise.");
        } else if (user.role === 'MANAGER') {
          const [emp, deptList] = await Promise.all([
            api.get<any>('/employees/me').catch(() => null),
            api.get<any[]>('/employees/simple').catch(() => [])
          ]);
          const list: any[] = Array.isArray(deptList) ? [...deptList] : [];
          if (emp?.id) {
            setMyEmployee(emp);
            if (!list.some((e: any) => e.id === emp.id)) list.unshift(emp);
            setFormData(prev => ({ ...prev, employeeId: emp.id }));
          } else if (list.length > 0) {
            setFormData(prev => ({ ...prev, employeeId: list[0].id }));
          }
          setEmployees(list);
        } else {
          const emp = await api.get<any>('/employees/me');
          if (emp?.id) {
            setMyEmployee(emp);
            setFormData(prev => ({ ...prev, employeeId: emp.id }));
          } else {
            setLoadError("Profil employé introuvable. Contactez votre RH.");
          }
        }
      } catch (err) {
        setLoadError("Erreur inattendue lors du chargement.");
      } finally {
        setIsLoadingEmployees(false);
      }
    };
    loadData();
  }, [router]);

  // 🆕 Charger le solde de l'employé sélectionné
  useEffect(() => {
    if (!formData.employeeId) return;
    const fetchBalance = async () => {
      try {
        const bal = await api.get<LeaveBalance>(
          `/leaves/balance/${formData.employeeId}`
        );
        setSelectedBalance(bal);
      } catch {
        setSelectedBalance(null);
      }
    };
    fetchBalance();
  }, [formData.employeeId]);

  const calculationDetails = useMemo(() => {
    if (!formData.startDate || !formData.endDate) return null;
    const start = new Date(formData.startDate);
    const end   = new Date(formData.endDate);
    if (end < start) return null;

    let businessDays = 0, weekendDays = 0, totalDays = 0;
    const cur = new Date(start);
    while (cur <= end) {
      const day = cur.getDay();
      totalDays++;
      if (day === 0 || day === 6) weekendDays++;
      else businessDays++;
      cur.setDate(cur.getDate() + 1);
    }

    // 🆕 Vérification solde insuffisant
    const insufficientBalance = formData.type === 'ANNUAL' && selectedBalance
      ? businessDays > Number(selectedBalance.annualRemaining)
      : false;

    return { businessDays, weekendDays, totalDays, insufficientBalance };
  }, [formData.startDate, formData.endDate, formData.type, selectedBalance]);

  const handleSubmit = async () => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await api.post('/leaves', {
        employeeId: formData.employeeId,
        type:       formData.type,
        startDate:  formData.startDate,
        endDate:    formData.endDate,
        reason:     formData.reason
      });
      setShowConfirmation(true);
      setTimeout(() => router.push('/conges/mon-espace'), 2500);
    } catch (e: any) {
      setSubmitError(e?.message || "Erreur lors de la demande");
      setIsSubmitting(false);
    }
  };

  const showEmployeeSelect = currentUser &&
    ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'MANAGER'].includes(currentUser.role);

  const displayName = myEmployee
    ? `${myEmployee.firstName} ${myEmployee.lastName}` : '—';

  // Vérification éligibilité congé annuel
  const notEligible = formData.type === 'ANNUAL' && selectedBalance &&
    !selectedBalance.canTakeAnnualLeave;

  const canSubmit = !isSubmitting && !showConfirmation &&
    !!calculationDetails && !!formData.employeeId &&
    !calculationDetails.insufficientBalance && !notEligible;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">

      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-gray-100 dark:border-gray-700">
              <div className="mx-auto w-20 h-20 bg-sky-100 dark:bg-sky-900/30 rounded-full flex items-center justify-center mb-6 text-sky-600">
                <Send size={40} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Demande Envoyée !</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Votre demande de <strong>{calculationDetails?.businessDays} jours</strong> a été transmise.
              </p>
              <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                <motion.div className="h-full bg-sky-500" initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 2.5 }} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors">
          <ArrowLeft size={20} className="text-gray-500 dark:text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Planifier une absence</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Remplissez le formulaire pour soumettre votre demande.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6 bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700">

          {/* ✅ Loi congolaise — taux corrigé */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 flex gap-3 items-start">
            <Info className="text-blue-500 shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Droit congolais : <strong>{CONGO_MONTHLY_RATE} jours</strong> acquis par mois travaillé (26j/an). Seuls les jours ouvrés (Lun–Ven) sont décomptés.
            </p>
          </div>

          {/* Sélection employé */}
          {isLoadingEmployees ? (
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-600 flex items-center gap-3">
              <Loader2 className="animate-spin text-gray-400" size={20} />
              <span className="text-sm text-gray-500 dark:text-gray-400">Chargement...</span>
            </div>
          ) : loadError && showEmployeeSelect ? (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 text-amber-700 dark:text-amber-300 text-sm">{loadError}</div>
          ) : showEmployeeSelect ? (
            <FancySelect
              label="Employé concerné"
              value={formData.employeeId}
              onChange={(v) => setFormData({ ...formData, employeeId: v })}
              icon={User}
              options={employees.map(emp => ({
                value: emp.id,
                label: `${emp.firstName} ${emp.lastName}${emp.department?.name ? ` · ${emp.department.name}` : ''}`
              }))}
            />
          ) : loadError ? (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{loadError}</div>
          ) : (
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-600 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-600 flex items-center justify-center">
                <User size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Demandeur</p>
                <p className="font-bold text-gray-900 dark:text-white">{displayName}</p>
              </div>
            </div>
          )}

          {/* 🆕 Alerte éligibilité */}
          {notEligible && selectedBalance && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl">
              <Lock size={18} className="text-amber-500 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Les congés annuels sont accessibles après <strong>12 mois</strong> d'ancienneté (Code du travail congolais). Ancienneté actuelle : <strong>{selectedBalance.monthsWorked} mois</strong>. Encore <strong>{selectedBalance.monthsUntilEligible} mois</strong> requis.
              </p>
            </div>
          )}

          {/* 🆕 Solde disponible */}
          {formData.type === 'ANNUAL' && selectedBalance?.canTakeAnnualLeave && (
            <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl">
              <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                Solde disponible : <strong>{Number(selectedBalance.annualRemaining).toFixed(1)} jours</strong>
              </p>
            </div>
          )}

          {/* Type d'absence */}
          <FancySelect
            label="Type d'absence"
            value={formData.type}
            onChange={(v) => setFormData({ ...formData, type: v })}
            icon={Umbrella}
            options={[
              { value: 'ANNUAL',    label: 'Congés Annuels (Payés)',         icon: Umbrella },
              { value: 'SICK',      label: 'Maladie (Justificatif requis)',  icon: Stethoscope },
              { value: 'MATERNITY', label: 'Maternité (min. 15 semaines)',   icon: Baby },
              { value: 'PATERNITY', label: 'Paternité',                      icon: User },
              { value: 'UNPAID',    label: 'Sans Solde (0 indemnité)',       icon: Ban },
              { value: 'SPECIAL',   label: 'Événement Familial',             icon: Star },
            ]}
          />

          {/* Note congé sans solde */}
          {formData.type === 'UNPAID' && (
            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600 rounded-xl">
              <Info size={16} className="text-gray-400 mt-0.5 shrink-0" />
              <p className="text-xs text-gray-500">
                Le congé sans solde ne génère aucune indemnité. Les jours d'absence seront déduits intégralement du salaire.
              </p>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Du (Inclus)</label>
              <input type="date" value={formData.startDate}
                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full p-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500/20 outline-none font-medium" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Au (Inclus)</label>
              <input type="date" value={formData.endDate}
                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full p-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500/20 outline-none font-medium" />
            </div>
          </div>

          {/* 🆕 Alerte solde insuffisant */}
          {calculationDetails?.insufficientBalance && (
            <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400">
                Solde insuffisant : vous demandez <strong>{calculationDetails.businessDays} jours</strong> mais il vous en reste <strong>{Number(selectedBalance?.annualRemaining ?? 0).toFixed(1)}</strong>.
              </p>
            </div>
          )}

          {/* Motif */}
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Motif & Commentaires</label>
            <textarea value={formData.reason}
              onChange={e => setFormData({ ...formData, reason: e.target.value })}
              className="w-full p-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500/20 outline-none font-medium resize-none"
              rows={3} placeholder="Ex: Voyage prévu, RDV médical..." />
          </div>

          {/* Erreur */}
          {submitError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl text-sm text-red-600 dark:text-red-400">
              {submitError}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full py-4 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl flex justify-center items-center gap-2 shadow-lg transition-all transform hover:scale-[1.02]"
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : <Send size={20} />}
            Soumettre pour validation
          </button>
        </div>

        {/* Sidebar simulation */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-gray-900 to-slate-800 dark:from-slate-800 dark:to-black text-white p-6 rounded-3xl shadow-xl">
            <div className="flex items-center gap-2 mb-6 opacity-80">
              <Calculator size={20} />
              <span className="text-sm font-bold uppercase tracking-wider">Simulation</span>
            </div>

            {calculationDetails ? (
              <div className="space-y-5">
                <div className="text-center">
                  <span className={`text-5xl font-extrabold ${calculationDetails.insufficientBalance ? 'text-red-400' : ''}`}>
                    {calculationDetails.businessDays}
                  </span>
                  <p className="text-sm text-gray-400 font-medium mt-1">Jours ouvrés décomptés</p>
                </div>

                <div className="bg-white/10 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Durée totale</span>
                    <span className="font-bold">{calculationDetails.totalDays} jours</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Week-ends</span>
                    <span className="font-bold text-emerald-400">-{calculationDetails.weekendDays} jours</span>
                  </div>
                  {selectedBalance?.canTakeAnnualLeave && formData.type === 'ANNUAL' && (
                    <>
                      <div className="h-px bg-white/20" />
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">Solde après</span>
                        <span className={`font-bold ${calculationDetails.insufficientBalance ? 'text-red-400' : 'text-sky-300'}`}>
                          {(Number(selectedBalance.annualRemaining) - calculationDetails.businessDays).toFixed(1)}j
                        </span>
                      </div>
                    </>
                  )}
                  <div className="h-px bg-white/20" />
                  <div className="flex justify-between text-sm">
                    <span className="text-white font-bold">Impact Solde</span>
                    <span className={`font-bold ${calculationDetails.insufficientBalance ? 'text-red-400' : 'text-orange-400'}`}>
                      -{calculationDetails.businessDays}j
                    </span>
                  </div>
                </div>

                {/* Type info */}
                <div className="flex items-start gap-2 text-xs text-gray-400 leading-relaxed">
                  <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                  <p>
                    {formData.type === 'UNPAID'
                      ? 'Congé sans solde : aucune indemnité, déduction pure du salaire.'
                      : 'Congé payé : indemnité calculée sur la moyenne de vos 12 derniers mois.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                <CalendarDays size={48} className="mb-4 opacity-20" />
                <p className="text-center text-sm">Sélectionnez vos dates pour voir la simulation.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}