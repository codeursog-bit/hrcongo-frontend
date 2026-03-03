// 'use client';

// import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { Clock, User, Calendar, Save, X, ArrowLeft, Loader2, Search, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';
// import { api } from '@/services/api';
// import { attendanceApi } from '@/services/attendance-api';
// import { useNotification } from '@/components/providers/NotificationProvider';

// interface Employee {
//   id: string;
//   employeeNumber: string;
//   firstName: string;
//   lastName: string;
//   position: string;
//   photoUrl?: string;
//   department?: {
//     id: string;
//     name: string;
//   };
// }

// interface CurrentUser {
//   id: string;
//   role: string;
// }

// export default function PointageManuelPage() {
//   const router = useRouter();
//   const { addNotification } = useNotification();
  
//   const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
//   const [isAuthorized, setIsAuthorized] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);
  
//   const [employees, setEmployees] = useState<Employee[]>([]);
//   const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
//   const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
//   const [checkInTime, setCheckInTime] = useState('08:00');
//   const [checkOutTime, setCheckOutTime] = useState('17:00');
//   const [notes, setNotes] = useState('');
  
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [showSuccess, setShowSuccess] = useState(false);

//   // ========================================
//   // ✅ VÉRIFICATION DES DROITS D'ACCÈS
//   // ========================================
//   useEffect(() => {
//     checkAuthorization();
//   }, []);

//   const checkAuthorization = async () => {
//     try {
//       const storedUser = localStorage.getItem('user');
//       if (!storedUser) {
//         router.push('/login');
//         return;
//       }

//       const user = JSON.parse(storedUser);
//       setCurrentUser(user);

//       const allowedRoles = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'MANAGER'];
//       if (!allowedRoles.includes(user.role)) {
//         setIsAuthorized(false);
//         setIsLoading(false);
//         return;
//       }

//       setIsAuthorized(true);
//       await loadEmployees();
//     } catch (error) {
//       console.error('Erreur vérification autorisation:', error);
//       setIsAuthorized(false);
//       setIsLoading(false);
//     }
//   };

//   // ========================================
//   // ✅ CHARGEMENT EMPLOYÉS — via /employees/simple
//   //    Le backend filtre déjà par département si MANAGER.
//   //    Plus de double filtrage côté front.
//   // ========================================
//   const loadEmployees = async () => {
//     try {
//       // /employees/simple : liste légère, déjà isolée par entreprise + département
//       const data: Employee[] = await api.get('/employees/simple');
//       setEmployees(data || []);
//       setFilteredEmployees(data || []);
//     } catch (error) {
//       console.error('Erreur chargement employés:', error);
//       setEmployees([]);
//       setFilteredEmployees([]);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (searchQuery.trim() === '') {
//       setFilteredEmployees(employees);
//     } else {
//       const query = searchQuery.toLowerCase();
//       setFilteredEmployees(
//         employees.filter(emp =>
//           emp.firstName.toLowerCase().includes(query) ||
//           emp.lastName.toLowerCase().includes(query) ||
//           emp.employeeNumber.toLowerCase().includes(query)
//         )
//       );
//     }
//   }, [searchQuery, employees]);

//   // ========================================
//   // ✅ SOUMISSION — via get-or-create + correct
//   // ========================================
//   const handleSubmit = async () => {
//     if (!selectedEmployee) {
//       alert('Veuillez sélectionner un employé');
//       return;
//     }

//     if (!checkInTime && !checkOutTime) {
//       alert('Veuillez renseigner au moins une heure');
//       return;
//     }

//     setIsSubmitting(true);

//     try {
//       const selectedDate = date;

//       // 1️⃣ Créer ou récupérer l'attendance du jour
//       const attendanceRecord = await attendanceApi.getOrCreateAttendance(
//         selectedEmployee.id,
//         selectedDate
//       );

//       // 2️⃣ Préparer les timestamps ISO
//       const checkInDateTime = checkInTime
//         ? new Date(`${selectedDate}T${checkInTime}:00`).toISOString()
//         : undefined;

//       const checkOutDateTime = checkOutTime
//         ? new Date(`${selectedDate}T${checkOutTime}:00`).toISOString()
//         : undefined;

//       let totalHours: number | undefined;
//       if (checkInDateTime && checkOutDateTime) {
//         const durationMs = new Date(checkOutDateTime).getTime() - new Date(checkInDateTime).getTime();
//         totalHours = parseFloat((durationMs / (1000 * 60 * 60)).toFixed(2));
//       }

//       // 3️⃣ Correction avec heures personnalisées
//       await attendanceApi.correctAttendance(
//         attendanceRecord.id,
//         {
//           status: 'PRESENT',
//           checkIn: checkInDateTime,
//           checkOut: checkOutDateTime,
//           totalHours,
//           reason: notes || 'Pointage manuel saisi par RH'
//         }
//       );

//       setShowSuccess(true);

//       addNotification({
//         type: 'SUCCESS',
//         title: 'Pointage Enregistré',
//         message: `Pointage manuel pour ${selectedEmployee.firstName} ${selectedEmployee.lastName} le ${selectedDate}`,
//       });

//       setTimeout(() => {
//         setShowSuccess(false);
//         setSelectedEmployee(null);
//         setCheckInTime('08:00');
//         setCheckOutTime('17:00');
//         setNotes('');
//         setDate(new Date().toISOString().split('T')[0]);
//       }, 2000);

//     } catch (error: any) {
//       console.error('Erreur pointage manuel:', error);
//       alert(`Erreur: ${error.message || 'Erreur lors du pointage'}`);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   // ========================================
//   // ✅ LOADING
//   // ========================================
//   if (isLoading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-slate-900">
//         <div className="text-center">
//           <Loader2 className="animate-spin text-blue-500 mx-auto mb-4" size={48}/>
//           <p className="text-slate-400">Vérification des accès...</p>
//         </div>
//       </div>
//     );
//   }

//   // ========================================
//   // ✅ ACCÈS REFUSÉ
//   // ========================================
//   if (!isAuthorized) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
//         <div className="max-w-md w-full bg-red-500/10 backdrop-blur-xl rounded-3xl p-8 border border-red-500/30 text-center">
//           <ShieldAlert size={64} className="text-red-400 mx-auto mb-4"/>
//           <h1 className="text-2xl font-bold text-white mb-2">Accès Refusé</h1>
//           <p className="text-red-300 mb-6">
//             Vous n'avez pas les droits nécessaires pour accéder au pointage manuel.
//           </p>
//           <p className="text-sm text-slate-400 mb-6">
//             Cette fonctionnalité est réservée aux administrateurs, RH et managers.
//           </p>
//           <button
//             onClick={() => router.back()}
//             className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors flex items-center gap-2 mx-auto"
//           >
//             <ArrowLeft size={20}/>
//             Retour
//           </button>
//         </div>
//       </div>
//     );
//   }

//   const isManager = currentUser?.role === 'MANAGER';

//   // ========================================
//   // ✅ INTERFACE PRINCIPALE
//   // ========================================
//   return (
//     <div className="min-h-screen pb-20 relative overflow-hidden bg-slate-900 text-white">
      
//       {/* Background */}
//       <div className="absolute inset-0 pointer-events-none overflow-hidden">
//         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-blue-500/20 rounded-full animate-[ping_3s_linear_infinite]"></div>
//         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-blue-500/30 rounded-full"></div>
//         <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-slate-900"></div>
//       </div>

//       {/* Header */}
//       <div className="absolute top-4 left-4 z-20">
//         <button onClick={() => router.back()} className="p-2 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-colors">
//           <ArrowLeft size={24} className="text-white"/>
//         </button>
//       </div>

//       <div className="w-full pt-12 pb-4 text-center relative z-10">
//         <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-6 border backdrop-blur-md bg-blue-900/50 text-blue-200 border-blue-800">
//           <User size={12}/>
//           Pointage Manuel
//           {isManager && (
//             <span className="ml-2 px-2 py-0.5 bg-orange-500/20 text-orange-300 rounded-full text-[10px]">
//               Département uniquement
//             </span>
//           )}
//         </div>

//         <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">
//           Saisie Manuelle
//         </h1>
//         <p className="text-slate-400 mt-2 text-lg">
//           Enregistrez les présences avec heures personnalisées
//           {isManager && ' (Votre département)'}
//         </p>
//       </div>

//       <div className="w-full max-w-2xl mx-auto px-4 relative z-10 space-y-6">
        
//         {/* Success */}
//         {showSuccess && (
//           <div className="bg-emerald-500/20 backdrop-blur-xl rounded-3xl p-8 border border-emerald-500/30 text-center animate-pulse">
//             <CheckCircle2 size={64} className="mx-auto text-emerald-400 mb-4"/>
//             <h2 className="text-2xl font-bold text-white">Enregistré !</h2>
//             <p className="text-sm text-emerald-300 mt-2">Le pointage a été créé avec succès</p>
//           </div>
//         )}

//         {!showSuccess && (
//           <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10 space-y-6">
            
//             <div className="bg-emerald-500/10 backdrop-blur-md rounded-2xl p-4 border border-emerald-500/30 flex items-start gap-3">
//               <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5"/>
//               <div className="text-sm">
//                 <p className="font-bold text-emerald-300 mb-1">✨ Heures personnalisables</p>
//                 <p className="text-emerald-200/80">
//                   Les heures saisies seront enregistrées exactement comme indiqué. Parfait pour les corrections rétroactives.
//                 </p>
//               </div>
//             </div>

//             {isManager && (
//               <div className="bg-blue-500/10 backdrop-blur-md rounded-2xl p-4 border border-blue-500/30 flex items-start gap-3">
//                 <User size={20} className="text-blue-400 shrink-0 mt-0.5"/>
//                 <div className="text-sm">
//                   <p className="font-bold text-blue-300 mb-1">Mode Manager</p>
//                   <p className="text-blue-200/80">
//                     Vous ne pouvez pointer que les employés de votre département ({employees.length} employé{employees.length > 1 ? 's' : ''}).
//                   </p>
//                 </div>
//               </div>
//             )}

//             {/* Recherche Employé */}
//             <div>
//               <label className="block text-sm font-bold text-slate-300 mb-2">
//                 <User size={16} className="inline mr-2"/>
//                 Employé
//                 {isManager && <span className="ml-2 text-xs text-slate-500">(Votre département)</span>}
//               </label>
              
//               <div className="relative">
//                 <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
//                 <input
//                   type="text"
//                   placeholder={employees.length === 0 ? "Aucun employé accessible" : "Rechercher un employé..."}
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                   disabled={employees.length === 0}
//                   className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
//                 />
//               </div>

//               {searchQuery && (
//                 <div className="mt-2 max-h-60 overflow-y-auto bg-slate-700/50 rounded-xl border border-slate-600">
//                   {filteredEmployees.length > 0 ? (
//                     filteredEmployees.map(emp => (
//                       <button
//                         key={emp.id}
//                         onClick={() => { setSelectedEmployee(emp); setSearchQuery(''); }}
//                         className="w-full p-3 hover:bg-slate-600/50 transition-colors text-left flex items-center gap-3 border-b border-slate-600 last:border-0"
//                       >
//                         <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-white font-bold">
//                           {emp.firstName[0]}{emp.lastName[0]}
//                         </div>
//                         <div className="flex-1">
//                           <p className="font-medium text-white">{emp.firstName} {emp.lastName}</p>
//                           <p className="text-xs text-slate-400">
//                             {emp.employeeNumber} - {emp.position}
//                             {emp.department && <span className="ml-2 text-blue-400">• {emp.department.name}</span>}
//                           </p>
//                         </div>
//                       </button>
//                     ))
//                   ) : (
//                     <p className="p-4 text-center text-slate-400 text-sm">Aucun employé trouvé</p>
//                   )}
//                 </div>
//               )}

//               {selectedEmployee && (
//                 <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center justify-between">
//                   <div className="flex items-center gap-3">
//                     <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-300 font-bold text-lg">
//                       {selectedEmployee.firstName[0]}{selectedEmployee.lastName[0]}
//                     </div>
//                     <div>
//                       <p className="font-bold text-white">{selectedEmployee.firstName} {selectedEmployee.lastName}</p>
//                       <p className="text-xs text-blue-300">
//                         {selectedEmployee.employeeNumber}
//                         {selectedEmployee.department && ` • ${selectedEmployee.department.name}`}
//                       </p>
//                     </div>
//                   </div>
//                   <button onClick={() => setSelectedEmployee(null)} className="p-2 hover:bg-red-500/20 rounded-full transition-colors">
//                     <X size={20} className="text-red-400"/>
//                   </button>
//                 </div>
//               )}
//             </div>

//             {/* Date */}
//             <div>
//               <label className="block text-sm font-bold text-slate-300 mb-2">
//                 <Calendar size={16} className="inline mr-2"/>
//                 Date
//               </label>
//               <input
//                 type="date"
//                 value={date}
//                 onChange={(e) => setDate(e.target.value)}
//                 max={new Date().toISOString().split('T')[0]}
//                 className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//             </div>

//             {/* Heures */}
//             <div className="grid grid-cols-2 gap-4">
//               <div>
//                 <label className="block text-sm font-bold text-slate-300 mb-2">
//                   <Clock size={16} className="inline mr-2 text-green-400"/>
//                   Heure d'Entrée
//                 </label>
//                 <input
//                   type="time"
//                   value={checkInTime}
//                   onChange={(e) => setCheckInTime(e.target.value)}
//                   className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-bold text-slate-300 mb-2">
//                   <Clock size={16} className="inline mr-2 text-red-400"/>
//                   Heure de Sortie
//                 </label>
//                 <input
//                   type="time"
//                   value={checkOutTime}
//                   onChange={(e) => setCheckOutTime(e.target.value)}
//                   className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500"
//                 />
//               </div>
//             </div>

//             {/* Aperçu durée */}
//             {checkInTime && checkOutTime && (
//               <div className="bg-slate-700/30 rounded-xl p-3 flex items-center justify-between">
//                 <span className="text-sm text-slate-400">Durée totale</span>
//                 <span className="text-lg font-bold text-white">
//                   {(() => {
//                     const start = new Date(`2000-01-01T${checkInTime}:00`);
//                     const end = new Date(`2000-01-01T${checkOutTime}:00`);
//                     const diffMs = end.getTime() - start.getTime();
//                     const hours = Math.floor(diffMs / (1000 * 60 * 60));
//                     const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
//                     return `${hours}h${minutes.toString().padStart(2, '0')}`;
//                   })()}
//                 </span>
//               </div>
//             )}

//             {/* Notes */}
//             <div>
//               <label className="block text-sm font-bold text-slate-300 mb-2">
//                 Raison du pointage manuel
//               </label>
//               <textarea
//                 value={notes}
//                 onChange={(e) => setNotes(e.target.value)}
//                 placeholder="Ex: Oubli de pointage, problème technique, correction..."
//                 rows={3}
//                 className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
//               />
//             </div>

//             {/* Submit */}
//             <button
//               onClick={handleSubmit}
//               disabled={isSubmitting || !selectedEmployee || employees.length === 0}
//               className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-blue-500/25 flex justify-center items-center gap-3 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               {isSubmitting ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>}
//               {isSubmitting ? 'Enregistrement...' : 'Enregistrer le Pointage'}
//             </button>

//           </div>
//         )}

//         {/* Info Box */}
//         <div className="bg-slate-800/30 backdrop-blur-md rounded-3xl p-6 border border-white/5">
//           <h3 className="text-xs font-bold uppercase text-slate-500 mb-3 tracking-widest">
//             ℹ️ Information
//           </h3>
//           <p className="text-sm text-slate-400 mb-2">
//             Cette fonctionnalité utilise le système de correction pour enregistrer des pointages
//             avec des heures personnalisées. Les timestamps seront enregistrés exactement comme saisis.
//           </p>
//           <p className="text-xs text-emerald-400 italic mt-2">
//             ✅ Les heures d'entrée et de sortie saisies seront respectées à la minute près.
//           </p>
//           {isManager && (
//             <p className="text-xs text-orange-400 italic mt-2">
//               👤 En tant que Manager, vous ne pouvez pointer que les employés de votre département.
//             </p>
//           )}
//         </div>

//       </div>
//     </div>
//   );
// }




'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Clock, User, Calendar, Save, X, ArrowLeft, Loader2, Search, 
  CheckCircle2, AlertCircle, ShieldAlert, MapPin, Fingerprint, ChevronRight
} from 'lucide-react';
import { api } from '@/services/api';
import { attendanceApi } from '@/services/attendance-api';
import { useNotification } from '@/components/providers/NotificationProvider';

interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  position: string;
  photoUrl?: string;
  department?: {
    id: string;
    name: string;
  };
}

interface CurrentUser {
  id: string;
  role: string;
  firstName: string;
  lastName: string;
}

export default function PointageManuelPage() {
  const router = useRouter();
  const { addNotification } = useNotification();
  
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkInTime, setCheckInTime] = useState('08:00');
  const [checkOutTime, setCheckOutTime] = useState('17:00');
  const [notes, setNotes] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // ========================================
  // ✅ VÉRIFICATION DES DROITS D'ACCÈS
  // ========================================
  useEffect(() => {
    checkAuthorization();
  }, []);

  const checkAuthorization = async () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        router.push('/login');
        return;
      }

      const user = JSON.parse(storedUser);
      setCurrentUser(user);

      const allowedRoles = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'MANAGER'];
      if (!allowedRoles.includes(user.role)) {
        setIsAuthorized(false);
        setIsLoading(false);
        return;
      }

      setIsAuthorized(true);
      await loadEmployees();
    } catch (error) {
      console.error('Erreur vérification autorisation:', error);
      setIsAuthorized(false);
      setIsLoading(false);
    }
  };

  // ========================================
  // ✅ CHARGEMENT EMPLOYÉS
  // ========================================
  const loadEmployees = async () => {
    try {
      const data: Employee[] = await api.get('/employees/simple');
      setEmployees(data || []);
      setFilteredEmployees(data || []);
    } catch (error) {
      console.error('Erreur chargement employés:', error);
      setEmployees([]);
      setFilteredEmployees([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredEmployees(employees);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredEmployees(
        employees.filter(emp =>
          emp.firstName.toLowerCase().includes(query) ||
          emp.lastName.toLowerCase().includes(query) ||
          emp.employeeNumber.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, employees]);

  // ========================================
  // ✅ SOUMISSION POINTAGE MANUEL
  // ========================================
  const handleSubmit = async () => {
    if (!selectedEmployee) {
      alert('Veuillez sélectionner un employé');
      return;
    }

    if (!checkInTime && !checkOutTime) {
      alert('Veuillez renseigner au moins une heure');
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedDate = date;

      const attendanceRecord = await attendanceApi.getOrCreateAttendance(
        selectedEmployee.id,
        selectedDate
      );

      const checkInDateTime = checkInTime
        ? new Date(`${selectedDate}T${checkInTime}:00`).toISOString()
        : undefined;

      const checkOutDateTime = checkOutTime
        ? new Date(`${selectedDate}T${checkOutTime}:00`).toISOString()
        : undefined;

      let totalHours: number | undefined;
      if (checkInDateTime && checkOutDateTime) {
        const durationMs = new Date(checkOutDateTime).getTime() - new Date(checkInDateTime).getTime();
        totalHours = parseFloat((durationMs / (1000 * 60 * 60)).toFixed(2));
      }

      await attendanceApi.correctAttendance(
        attendanceRecord.id,
        {
          status: 'PRESENT',
          checkIn: checkInDateTime,
          checkOut: checkOutDateTime,
          totalHours,
          reason: notes || 'Pointage manuel saisi par RH'
        }
      );

      setShowSuccess(true);

      addNotification({
        type: 'SUCCESS',
        title: 'Pointage Enregistré',
        message: `Pointage manuel pour ${selectedEmployee.firstName} ${selectedEmployee.lastName} le ${selectedDate}`,
      });

      setTimeout(() => {
        setShowSuccess(false);
        setSelectedEmployee(null);
        setCheckInTime('08:00');
        setCheckOutTime('17:00');
        setNotes('');
        setDate(new Date().toISOString().split('T')[0]);
      }, 2000);

    } catch (error: any) {
      console.error('Erreur pointage manuel:', error);
      alert(`Erreur: ${error.message || 'Erreur lors du pointage'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ========================================
  // ✅ LOADING
  // ========================================
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-500 mx-auto mb-4" size={48}/>
          <p className="text-slate-400">Vérification des accès...</p>
        </div>
      </div>
    );
  }

  // ========================================
  // ✅ ACCÈS REFUSÉ
  // ========================================
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
        <div className="max-w-md w-full bg-red-500/10 backdrop-blur-xl rounded-3xl p-8 border border-red-500/30 text-center">
          <ShieldAlert size={64} className="text-red-400 mx-auto mb-4"/>
          <h1 className="text-2xl font-bold text-white mb-2">Accès Refusé</h1>
          <p className="text-red-300 mb-6">
            Vous n'avez pas les droits nécessaires pour accéder au pointage manuel.
          </p>
          <p className="text-sm text-slate-400 mb-6">
            Cette fonctionnalité est réservée aux administrateurs, RH et managers.
          </p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors flex items-center gap-2 mx-auto"
          >
            <ArrowLeft size={20}/>
            Retour
          </button>
        </div>
      </div>
    );
  }

  const isManager = currentUser?.role === 'MANAGER';
  // RH et Admin peuvent se pointer eux-mêmes via GPS
  const canSelfCheckGps = ['HR_MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(currentUser?.role || '');

  // ========================================
  // ✅ INTERFACE PRINCIPALE
  // ========================================
  return (
    <div className="min-h-screen pb-20 relative overflow-hidden bg-slate-900 text-white">
      
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-blue-500/20 rounded-full animate-[ping_3s_linear_infinite]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-blue-500/30 rounded-full"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-slate-900"></div>
      </div>

      {/* Header */}
      <div className="absolute top-4 left-4 z-20">
        <button onClick={() => router.back()} className="p-2 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-colors">
          <ArrowLeft size={24} className="text-white"/>
        </button>
      </div>

      <div className="w-full pt-12 pb-4 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-6 border backdrop-blur-md bg-blue-900/50 text-blue-200 border-blue-800">
          <User size={12}/>
          Pointage Manuel
          {isManager && (
            <span className="ml-2 px-2 py-0.5 bg-orange-500/20 text-orange-300 rounded-full text-[10px]">
              Département uniquement
            </span>
          )}
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">
          Saisie Manuelle
        </h1>
        <p className="text-slate-400 mt-2 text-lg">
          Enregistrez les présences avec heures personnalisées
          {isManager && ' (Votre département)'}
        </p>
      </div>

      <div className="w-full max-w-2xl mx-auto px-4 relative z-10 space-y-6">

        {/* ══════════════════════════════════════════════════════
            🟢 BOUTON GPS SELF-CHECK — visible RH / Admin uniquement
            Placé bien en vue AVANT le formulaire principal
        ══════════════════════════════════════════════════════ */}
        {canSelfCheckGps && (
          <button
            onClick={() => router.push('/presences/pointage')}
            className="
              w-full group relative overflow-hidden
              bg-gradient-to-r from-emerald-500/20 to-teal-500/20
              hover:from-emerald-500/30 hover:to-teal-500/30
              border border-emerald-500/40 hover:border-emerald-400/60
              rounded-2xl p-5 transition-all duration-300
              flex items-center gap-4
            "
          >
            {/* Glow pulse derrière l'icône */}
            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-emerald-400 blur-lg opacity-30 group-hover:opacity-60 transition-opacity rounded-full"></div>
              <div className="relative w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
                <MapPin size={28} className="text-emerald-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>

            {/* Texte */}
            <div className="flex-1 text-left">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-400/70 mb-0.5">
                Me pointer moi-même
              </p>
              <p className="text-lg font-bold text-white">
                Ma Pointeuse GPS
              </p>
              <p className="text-sm text-slate-400 mt-0.5">
                {currentUser?.firstName} {currentUser?.lastName} — Pointer mon arrivée / départ via GPS
              </p>
            </div>

            {/* Flèche */}
            <ChevronRight size={22} className="text-emerald-400/60 group-hover:translate-x-1 transition-transform shrink-0" />
          </button>
        )}
        
        {/* Success */}
        {showSuccess && (
          <div className="bg-emerald-500/20 backdrop-blur-xl rounded-3xl p-8 border border-emerald-500/30 text-center animate-pulse">
            <CheckCircle2 size={64} className="mx-auto text-emerald-400 mb-4"/>
            <h2 className="text-2xl font-bold text-white">Enregistré !</h2>
            <p className="text-sm text-emerald-300 mt-2">Le pointage a été créé avec succès</p>
          </div>
        )}

        {!showSuccess && (
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10 space-y-6">
            
            <div className="bg-emerald-500/10 backdrop-blur-md rounded-2xl p-4 border border-emerald-500/30 flex items-start gap-3">
              <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5"/>
              <div className="text-sm">
                <p className="font-bold text-emerald-300 mb-1">✨ Heures personnalisables</p>
                <p className="text-emerald-200/80">
                  Les heures saisies seront enregistrées exactement comme indiqué. Parfait pour les corrections rétroactives.
                </p>
              </div>
            </div>

            {isManager && (
              <div className="bg-blue-500/10 backdrop-blur-md rounded-2xl p-4 border border-blue-500/30 flex items-start gap-3">
                <User size={20} className="text-blue-400 shrink-0 mt-0.5"/>
                <div className="text-sm">
                  <p className="font-bold text-blue-300 mb-1">Mode Manager</p>
                  <p className="text-blue-200/80">
                    Vous ne pouvez pointer que les employés de votre département ({employees.length} employé{employees.length > 1 ? 's' : ''}).
                  </p>
                </div>
              </div>
            )}

            {/* Recherche Employé */}
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                <User size={16} className="inline mr-2"/>
                Employé
                {isManager && <span className="ml-2 text-xs text-slate-500">(Votre département)</span>}
              </label>
              
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input
                  type="text"
                  placeholder={employees.length === 0 ? "Aucun employé accessible" : "Rechercher un employé..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={employees.length === 0}
                  className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {searchQuery && (
                <div className="mt-2 max-h-60 overflow-y-auto bg-slate-700/50 rounded-xl border border-slate-600">
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map(emp => (
                      <button
                        key={emp.id}
                        onClick={() => { setSelectedEmployee(emp); setSearchQuery(''); }}
                        className="w-full p-3 hover:bg-slate-600/50 transition-colors text-left flex items-center gap-3 border-b border-slate-600 last:border-0"
                      >
                        <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-white font-bold">
                          {emp.firstName[0]}{emp.lastName[0]}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-white">{emp.firstName} {emp.lastName}</p>
                          <p className="text-xs text-slate-400">
                            {emp.employeeNumber} - {emp.position}
                            {emp.department && <span className="ml-2 text-blue-400">• {emp.department.name}</span>}
                          </p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="p-4 text-center text-slate-400 text-sm">Aucun employé trouvé</p>
                  )}
                </div>
              )}

              {selectedEmployee && (
                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-300 font-bold text-lg">
                      {selectedEmployee.firstName[0]}{selectedEmployee.lastName[0]}
                    </div>
                    <div>
                      <p className="font-bold text-white">{selectedEmployee.firstName} {selectedEmployee.lastName}</p>
                      <p className="text-xs text-blue-300">
                        {selectedEmployee.employeeNumber}
                        {selectedEmployee.department && ` • ${selectedEmployee.department.name}`}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedEmployee(null)} className="p-2 hover:bg-red-500/20 rounded-full transition-colors">
                    <X size={20} className="text-red-400"/>
                  </button>
                </div>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                <Calendar size={16} className="inline mr-2"/>
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Heures */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">
                  <Clock size={16} className="inline mr-2 text-green-400"/>
                  Heure d'Entrée
                </label>
                <input
                  type="time"
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">
                  <Clock size={16} className="inline mr-2 text-red-400"/>
                  Heure de Sortie
                </label>
                <input
                  type="time"
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            {/* Aperçu durée */}
            {checkInTime && checkOutTime && (
              <div className="bg-slate-700/30 rounded-xl p-3 flex items-center justify-between">
                <span className="text-sm text-slate-400">Durée totale</span>
                <span className="text-lg font-bold text-white">
                  {(() => {
                    const start = new Date(`2000-01-01T${checkInTime}:00`);
                    const end = new Date(`2000-01-01T${checkOutTime}:00`);
                    const diffMs = end.getTime() - start.getTime();
                    const hours = Math.floor(diffMs / (1000 * 60 * 60));
                    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                    return `${hours}h${minutes.toString().padStart(2, '0')}`;
                  })()}
                </span>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                Raison du pointage manuel
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Oubli de pointage, problème technique, correction..."
                rows={3}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedEmployee || employees.length === 0}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-blue-500/25 flex justify-center items-center gap-3 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>}
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer le Pointage'}
            </button>

          </div>
        )}

        {/* Info Box */}
        <div className="bg-slate-800/30 backdrop-blur-md rounded-3xl p-6 border border-white/5">
          <h3 className="text-xs font-bold uppercase text-slate-500 mb-3 tracking-widest">
            ℹ️ Information
          </h3>
          <p className="text-sm text-slate-400 mb-2">
            Cette fonctionnalité utilise le système de correction pour enregistrer des pointages
            avec des heures personnalisées. Les timestamps seront enregistrés exactement comme saisis.
          </p>
          <p className="text-xs text-emerald-400 italic mt-2">
            ✅ Les heures d'entrée et de sortie saisies seront respectées à la minute près.
          </p>
          {isManager && (
            <p className="text-xs text-orange-400 italic mt-2">
              👤 En tant que Manager, vous ne pouvez pointer que les employés de votre département.
            </p>
          )}
        </div>

      </div>
    </div>
  );
}