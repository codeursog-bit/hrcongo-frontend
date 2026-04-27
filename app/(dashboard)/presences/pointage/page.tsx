// 'use client';

// import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { Clock, MapPin, Sun, LogOut, ArrowLeft, Loader2, CheckCircle2, AlertTriangle, History, Navigation, Ban, ShieldAlert, Fingerprint, Wifi } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { attendanceApi } from '@/services/attendance-api';
// import { api } from '@/services/api';
// import { getDistanceFromLatLonInMeters } from '@/utils/geo';
// import { useNotification } from '@/components/providers/NotificationProvider';
// import { useAttendanceOffline } from '@/hooks/useAttendanceOffline'; // ← AJOUT PWA

// export default function AttendanceCheckInPage() {
//   const router = useRouter();
//   const { addNotification } = useNotification();
//   const { checkIn: offlineCheckIn, isOffline } = useAttendanceOffline(); // ← AJOUT PWA
  
//   const [currentTime, setCurrentTime] = useState<Date | null>(null);
//   const [status, setStatus] = useState<'loading' | 'idle' | 'working' | 'completed' | 'error'>('loading');
//   const [employeeId, setEmployeeId] = useState(''); 
//   const [employeeName, setEmployeeName] = useState('');
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [showConfetti, setShowConfetti] = useState(false);
//   const [history, setHistory] = useState<any[]>([]);
  
//   const [geoState, setGeoState] = useState<{
//       allowed: boolean;
//       distance: number | null;
//       accuracy: number | null;
//       latitude: number | null;
//       longitude: number | null;
//       error: string | null;
//       loading: boolean;
//       isMockedSuspect: boolean;
//   }>({ 
//     allowed: false, 
//     distance: null, 
//     accuracy: null, 
//     latitude: null, 
//     longitude: null, 
//     error: null, 
//     loading: true, 
//     isMockedSuspect: false 
//   });

//   const [companySettings, setCompanySettings] = useState<any>(null);

//   useEffect(() => {
//     const init = async () => {
//         try {
//             const me: any = await api.get('/employees/me');
//             if (!me) {
//                 setStatus('error');
//                 return;
//             }
//             setEmployeeId(me.id);
//             setEmployeeName(me.firstName);

//             const company: any = await api.get('/companies/mine');
//             setCompanySettings(company);

//             const todayData: any = await attendanceApi.getToday();
//             const myAtt = todayData.find((a: any) => a.employeeId === me.id);
            
//             if (myAtt) {
//                 setStatus(myAtt.checkOut ? 'completed' : 'working');
//             } else {
//                 setStatus('idle');
//             }

//             const currentMonth = new Date().getMonth() + 1;
//             const currentYear = new Date().getFullYear();
            
//             const monthlyData: any = await attendanceApi.getMonthly({
//                 month: currentMonth,
//                 year: currentYear
//             });
            
//             if (monthlyData && monthlyData.attendances) {
//                 const myHistory = monthlyData.attendances
//                     .filter((a: any) => a.employeeId === me.id)
//                     .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
//                     .slice(0, 5); 
//                 setHistory(myHistory);
//             }
//         } catch (e) {
//             console.error("Erreur init pointage", e);
//             setStatus('error');
//         }
//     };
//     init();
//   }, []);

//   useEffect(() => {
//     setCurrentTime(new Date());
//     const timer = setInterval(() => setCurrentTime(new Date()), 1000);
//     return () => clearInterval(timer);
//   }, []);

//   useEffect(() => {
//       if (!companySettings) return;

//       const watchId = navigator.geolocation.watchPosition(
//           (pos) => {
//               const userLat = pos.coords.latitude;
//               const userLng = pos.coords.longitude;
//               const accuracy = pos.coords.accuracy;
              
//               const companyLat = companySettings.latitude;
//               const companyLng = companySettings.longitude;
//               const radius = companySettings.allowedRadius || 100;

//               let isAllowed = false;
//               let dist = 0;

//               if (!companyLat || !companyLng) {
//                   isAllowed = true;
//                   dist = 0;
//               } else {
//                   dist = getDistanceFromLatLonInMeters(userLat, userLng, companyLat, companyLng);
//                   isAllowed = dist <= radius;
//               }
              
//               const isSuspect = accuracy > 100;

//               setGeoState({
//                   allowed: isAllowed,
//                   distance: Math.round(dist),
//                   accuracy: Math.round(accuracy),
//                   latitude: userLat,
//                   longitude: userLng,
//                   error: null,
//                   loading: false,
//                   isMockedSuspect: isSuspect
//               });
//           },
//           (err) => {
//               let msg = "Impossible de vous localiser.";
//               if (err.code === 1) msg = "Vous devez autoriser la géolocalisation pour pointer.";
//               setGeoState(p => ({ ...p, error: msg, loading: false, allowed: false }));
//           },
//           { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
//       );

//       return () => navigator.geolocation.clearWatch(watchId);
//   }, [companySettings]); 

//   // ✅ MODIFIÉ : Fonction handleAction avec PWA
//   const handleAction = async () => {
//     if (!employeeId) return;
    
//     if (!geoState.allowed && !geoState.isMockedSuspect) {
//         return; 
//     }

//     setIsProcessing(true);
//     try {
//         if (status === 'idle') {
//             // ✅ UTILISE LE HOOK PWA OFFLINE
//             const result = await offlineCheckIn({
//                 employeeId,
//                 latitude: geoState.latitude || undefined,
//                 longitude: geoState.longitude || undefined,
//                 notes: (geoState.isMockedSuspect && !geoState.allowed) ? 'SUSPICIOUS_LOCATION' : undefined,
//             });

//             if (result.success) {
//                 setStatus('working');
                
//                 if (result.offline) {
//                     addNotification({
//                         type: 'ALERT',
//                         title: 'Mode Hors Ligne',
//                         message: result.message
//                     });
//                 } else if (geoState.isMockedSuspect && !geoState.allowed) {
//                     addNotification({
//                         type: 'ALERT',
//                         title: 'Position Incertaine',
//                         message: `Pointage validé mais signalé. Précision GPS faible (${geoState.accuracy}m).`
//                     });
//                 } else {
//                     addNotification({
//                         type: 'CHECK_IN',
//                         title: 'Pointage Réussi',
//                         message: `Bonne journée ${employeeName} !`
//                     });
//                 }
//             }
//         } else {
//             await attendanceApi.checkOut({ 
//                 employeeId,
//                 latitude: geoState.latitude || undefined,
//                 longitude: geoState.longitude || undefined
//             });
//             setStatus('completed');
//             setShowConfetti(true);
//         }
//     } catch (e: any) {
//         console.error(e);
//         alert(`Erreur de pointage\n\n${e.message || 'Erreur technique lors du pointage.'}`);
//     } finally {
//         setIsProcessing(false);
//     }
//   };

//   const getGpsBadge = () => {
//       if (geoState.loading) return { color: 'bg-gray-800 text-gray-400', icon: <Loader2 className="animate-spin" size={12}/>, text: 'Recherche GPS...' };
//       if (geoState.error) return { color: 'bg-red-900/50 text-red-200 border-red-800', icon: <Ban size={12}/>, text: 'GPS Inactif' };
      
//       // ✅ AJOUT : Badge offline
//       if (isOffline) return { color: 'bg-orange-900/50 text-orange-200 border-orange-800', icon: <Wifi size={12}/>, text: 'Mode Hors Ligne' };
      
//       if (geoState.allowed) {
//           return { color: 'bg-emerald-900/50 text-emerald-300 border-emerald-800', icon: <MapPin size={12}/>, text: `Zone OK (${geoState.distance}m)` };
//       }
      
//       if (geoState.isMockedSuspect) {
//            return { color: 'bg-yellow-900/50 text-yellow-200 border-yellow-700', icon: <Wifi size={12}/>, text: `Signal Faible (${geoState.accuracy}m)` };
//       }
      
//       return { color: 'bg-red-900/50 text-red-200 border-red-800', icon: <Ban size={12}/>, text: `Hors Zone (${geoState.distance}m)` };
//   };

//   const badge = getGpsBadge();

//   return (
//     <div className="min-h-screen pb-20 relative overflow-hidden flex flex-col items-center bg-slate-900 text-white">
      
//       <div className="absolute inset-0 pointer-events-none overflow-hidden">
//           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-emerald-500/20 rounded-full animate-[ping_3s_linear_infinite]"></div>
//           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-emerald-500/30 rounded-full"></div>
//           <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-slate-900"></div>
//       </div>

//       <div className="absolute top-4 left-4 z-20">
//         <button onClick={() => router.back()} className="p-2 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-colors"><ArrowLeft size={24} className="text-white"/></button>
//       </div>

//       <div className="w-full pt-12 pb-4 text-center relative z-10">
//         <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-6 border backdrop-blur-md transition-colors duration-500 ${badge.color}`}>
//           {badge.icon}
//           {badge.text}
//         </div>

//         <h1 className="text-6xl md:text-8xl font-bold tracking-tight font-mono tabular-nums text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">
//           {currentTime ? currentTime.toLocaleTimeString('fr-FR') : '--:--:--'}
//         </h1>
//         <p className="text-slate-400 mt-2 text-lg capitalize">{currentTime?.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        
//         {employeeName && <p className="text-sky-400 font-bold mt-2">Bonjour, {employeeName}</p>}
//       </div>

//       <div className="w-full max-w-md px-4 relative z-10 space-y-6">
        
//         <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10 text-center relative overflow-hidden">
            
//             {showConfetti && (
//                 <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
//                     <div className="w-full h-full bg-emerald-500/10 animate-pulse"></div>
//                 </div>
//             )}

//             {geoState.error && status === 'idle' && (
//                 <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-left">
//                     <div className="flex items-center gap-2 text-red-400 font-bold mb-1">
//                         <AlertTriangle size={18}/> Erreur GPS
//                     </div>
//                     <p className="text-xs text-red-300">{geoState.error}</p>
//                 </div>
//             )}

//             {!geoState.loading && !geoState.error && !geoState.allowed && !geoState.isMockedSuspect && status === 'idle' && (
//                 <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-left">
//                     <div className="flex items-center gap-2 text-red-400 font-bold mb-1">
//                         <Ban size={18}/> Accès Refusé
//                     </div>
//                     <p className="text-xs text-red-200">
//                         Vous êtes à <strong>{geoState.distance}m</strong> du bureau. Rapprochez-vous de la zone autorisée ({companySettings?.allowedRadius || 100}m).
//                     </p>
//                 </div>
//             )}

//             {!geoState.loading && !geoState.error && !geoState.allowed && geoState.isMockedSuspect && status === 'idle' && (
//                 <div className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-left">
//                     <div className="flex items-center gap-2 text-yellow-400 font-bold mb-1">
//                         <Wifi size={18}/> Signal Faible
//                     </div>
//                     <p className="text-xs text-yellow-200">
//                         Votre position est imprécise ({geoState.accuracy}m). Le pointage est autorisé exceptionnellement mais sera marqué pour vérification.
//                     </p>
//                 </div>
//             )}

//             {/* ✅ AJOUT : Message offline */}
//             {isOffline && status === 'idle' && (
//                 <div className="mb-6 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-left">
//                     <div className="flex items-center gap-2 text-orange-400 font-bold mb-1">
//                         <Wifi size={18}/> Mode Hors Ligne
//                     </div>
//                     <p className="text-xs text-orange-200">
//                         Pas de connexion internet. Votre pointage sera enregistré localement et synchronisé automatiquement.
//                     </p>
//                 </div>
//             )}

//             {status === 'loading' && <div className="py-10"><Loader2 className="animate-spin mx-auto text-sky-500" size={32}/></div>}

//             {status === 'idle' && (
//                 <>
//                     <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 transition-all duration-500 ${geoState.allowed || isOffline ? 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]' : geoState.isMockedSuspect ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-700/50 text-slate-500'}`}>
//                         <Fingerprint size={48} strokeWidth={1.5} />
//                     </div>
                    
//                     <button 
//                         onClick={handleAction} 
//                         disabled={isProcessing || (!geoState.allowed && !geoState.isMockedSuspect && !isOffline) || geoState.loading}
//                         className={`w-full py-4 font-bold rounded-2xl shadow-lg flex justify-center items-center gap-3 transition-all active:scale-95 ${
//                             (geoState.allowed || geoState.isMockedSuspect || isOffline)
//                                 ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-emerald-500/25' 
//                                 : 'bg-slate-700 text-slate-400 cursor-not-allowed border border-white/5'
//                         }`}
//                     >
//                         {isProcessing ? <Loader2 className="animate-spin"/> : <Clock size={20}/>} 
//                         {isOffline ? "Pointer (Hors Ligne)" : geoState.allowed ? "Pointer l'Entrée" : geoState.isMockedSuspect ? "Forcer (Signal Faible)" : "Hors Zone"}
//                     </button>
//                 </>
//             )}

//             {status === 'working' && (
//                 <>
//                     <div className="w-20 h-20 bg-sky-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-sky-400 animate-pulse border border-sky-500/30"><Clock size={32}/></div>
//                     <h2 className="text-2xl font-bold mb-2 text-white">Au travail</h2>
//                     <p className="text-slate-400 mb-8 text-sm">Débuté à {history.length > 0 && history[0].checkIn ? new Date(history[0].checkIn).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : 'l\'instant'}</p>
//                     <button onClick={handleAction} disabled={isProcessing} className="w-full py-4 bg-red-500/10 border border-red-500/50 text-red-400 font-bold rounded-2xl hover:bg-red-500/20 flex justify-center items-center gap-3 transition-transform active:scale-95">
//                         {isProcessing ? <Loader2 className="animate-spin"/> : <LogOut size={20}/>} Fin de journée
//                     </button>
//                 </>
//             )}

//             {status === 'completed' && (
//                 <>
//                     <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-400 border border-indigo-500/30"><CheckCircle2 size={32}/></div>
//                     <h2 className="text-2xl font-bold mb-2 text-white">À demain !</h2>
//                     <p className="text-slate-400 mb-8 text-sm">Votre journée est enregistrée.</p>
//                     <button onClick={() => router.push('/presences')} className="w-full py-3 bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-600 transition-colors">Fermer</button>
//                 </>
//             )}
//         </div>

//         <div className="bg-slate-800/30 backdrop-blur-md rounded-3xl p-6 border border-white/5 shadow-lg">
//             <h3 className="text-xs font-bold uppercase text-slate-500 mb-4 flex items-center gap-2 tracking-widest">
//                 <History size={12} /> Cette semaine
//             </h3>
            
//             {history.length > 0 ? (
//                 <div className="space-y-3">
//                     {history.map((record, i) => {
//                         const date = new Date(record.date);
//                         const isToday = new Date().toDateString() === date.toDateString();
                        
//                         return (
//                             <div key={i} className={`flex justify-between items-center p-3 rounded-xl border ${isToday ? 'bg-sky-500/10 border-sky-500/30' : 'bg-white/5 border-white/5'}`}>
//                                 <div>
//                                     <p className="font-bold text-slate-200 text-sm capitalize">
//                                         {date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}
//                                     </p>
//                                     <div className="flex gap-3 text-xs text-slate-400 mt-1">
//                                         <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> {record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}</span>
//                                         <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> {record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}</span>
//                                     </div>
//                                 </div>
//                                 <div>
//                                     {record.status === 'LATE' && <span className="text-[10px] px-2 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold">RETARD</span>}
//                                     {record.notes === 'SUSPICIOUS_LOCATION' && <span className="text-[10px] px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-bold ml-1">SUSPECT</span>}
//                                 </div>
//                             </div>
//                         );
//                     })}
//                 </div>
//             ) : (
//                 <p className="text-center text-slate-600 text-xs py-4">Historique vide.</p>
//             )}
//         </div>

//       </div>
//     </div>
//   );
// }

'use client';

// ============================================================================
// 📁 app/(dashboard)/presences/pointage/page.tsx — FINAL
// ============================================================================
// ✅ TOUTES les erreurs TypeScript corrigées :
//   - 'CHECK_OUT' → 'CHECK_IN' (CHECK_OUT n'existe pas dans le type front)
//   - result.data → (result as any) pour earlyArrival + slightLate
//   - Tous les addNotification utilisent 'ALERT' | 'CHECK_IN' | 'SUCCESS'
// ✅ Garde tout le code existant intact (GPS, offline, earlyArrival, etc.)
// 🆕 Toast slightLate ajouté (manquait — existait côté back, absent côté front)
// 🆕 Bloc OvertimeWorkflowCard intégré
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Clock, MapPin, LogOut, ArrowLeft, Loader2, CheckCircle2,
  AlertTriangle, History, Ban, Fingerprint, Wifi,
  HelpCircle, Zap, Timer,
  CheckCircle, XCircle, Info, Sparkles,
} from 'lucide-react';
import { attendanceApi } from '@/services/attendance-api';
import { api } from '@/services/api';
import { getDistanceFromLatLonInMeters } from '@/utils/geo';
import { useNotification } from '@/components/providers/NotificationProvider';
import { useAttendanceOffline } from '@/hooks/useAttendanceOffline';
import { useBasePath } from '@/hooks/useBasePath';
// ─── Types ────────────────────────────────────────────────────────────────────
type PageStatus = 'loading' | 'idle' | 'working' | 'completed' | 'error';
type OvertimeStatus =
  | 'NONE'
  | 'PENDING_EMPLOYEE'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'AUTO_CLOSED';

interface TodayAttendance {
  id: string;
  checkIn?: string;
  checkOut?: string;
  status: string;
  overtimeStatus?: OvertimeStatus;
  pendingOvertimeHours?: number;
  overtimeRequestedAt?: string;
}

// ─── Toast générique (earlyArrival + slightLate) ─────────────────────────────
type ToastVariant = 'early' | 'slight-late';

function AttendanceToast({
  variant, title, message, onClose,
}: {
  variant: ToastVariant;
  title: string;
  message: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 9000);
    return () => clearTimeout(t);
  }, [onClose]);

  const isEarly = variant === 'early';

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm">
      <div className={`backdrop-blur-xl border rounded-2xl p-4 shadow-2xl ${
        isEarly ? 'bg-sky-900/95 border-sky-500/40' : 'bg-orange-900/95 border-orange-500/40'
      }`}>
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-xl flex-shrink-0 ${isEarly ? 'bg-sky-500/20' : 'bg-orange-500/20'}`}>
            <Sparkles size={16} className={isEarly ? 'text-sky-400' : 'text-orange-400'} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`font-bold text-sm ${isEarly ? 'text-sky-200' : 'text-orange-200'}`}>{title}</p>
            <p className={`text-xs mt-1 leading-relaxed ${isEarly ? 'text-sky-300/80' : 'text-orange-300/80'}`}>{message}</p>
          </div>
          <button onClick={onClose} className={`flex-shrink-0 mt-0.5 ${isEarly ? 'text-sky-500 hover:text-sky-300' : 'text-orange-500 hover:text-orange-300'}`}>
            <XCircle size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Carte Overtime Workflow ──────────────────────────────────────────────────
function OvertimeWorkflowCard({
  attendance, onResolveForgotten, onDeclareOvertime, resolving,
}: {
  attendance: TodayAttendance;
  onResolveForgotten: () => void;
  onDeclareOvertime: () => void;
  resolving: boolean;
}) {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    if (!attendance.checkIn) return;
    const calc = () => {
      const diff = Date.now() - new Date(attendance.checkIn!).getTime();
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      setElapsed(`${h}h${String(m).padStart(2, '0')}`);
    };
    calc();
    const id = setInterval(calc, 60_000);
    return () => clearInterval(id);
  }, [attendance.checkIn]);

  if (attendance.overtimeStatus === 'PENDING_EMPLOYEE') {
    return (
      <div className="bg-amber-500/10 border border-amber-500/40 rounded-3xl p-6 space-y-5">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-amber-500/20 rounded-xl flex-shrink-0">
            <HelpCircle size={20} className="text-amber-400" />
          </div>
          <div>
            <p className="font-bold text-amber-300 text-base">Toujours au bureau ?</p>
            <p className="text-amber-400/80 text-xs mt-0.5">
              Votre journée dépasse l'heure officielle.
              {attendance.pendingOvertimeHours ? ` Dépassement calculé : ${Number(attendance.pendingOvertimeHours).toFixed(1)}h.` : ''}
            </p>
          </div>
        </div>
        {attendance.checkIn && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/60 rounded-2xl">
            <Timer size={14} className="text-amber-400 animate-pulse" />
            <span className="text-xs text-slate-400">Temps total depuis l'entrée :</span>
            <span className="font-mono font-bold text-amber-300 text-sm ml-auto">{elapsed}</span>
          </div>
        )}
        <p className="text-xs text-slate-400 text-center">Que souhaitez-vous faire ?</p>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={onResolveForgotten} disabled={resolving}
            className="flex flex-col items-center gap-2 p-4 bg-slate-700/60 hover:bg-slate-700 border border-slate-600 rounded-2xl transition-all active:scale-95 disabled:opacity-50">
            {resolving ? <Loader2 size={24} className="animate-spin text-slate-300" /> : <span className="text-2xl">😅</span>}
            <span className="text-xs font-bold text-slate-200 text-center leading-tight">J'avais oublié de pointer la sortie</span>
            <span className="text-[10px] text-slate-500 text-center">→ Journée clôturée à l'heure officielle</span>
          </button>
          <button onClick={onDeclareOvertime} disabled={resolving}
            className="flex flex-col items-center gap-2 p-4 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 rounded-2xl transition-all active:scale-95 disabled:opacity-50">
            {resolving ? <Loader2 size={24} className="animate-spin text-amber-300" /> : <span className="text-2xl">💼</span>}
            <span className="text-xs font-bold text-amber-200 text-center leading-tight">Ce sont des heures supplémentaires</span>
            <span className="text-[10px] text-amber-500/70 text-center">→ Demande envoyée au responsable</span>
          </button>
        </div>
      </div>
    );
  }

  if (attendance.overtimeStatus === 'PENDING_APPROVAL') {
    return (
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-3xl p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-blue-500/20 rounded-xl flex-shrink-0">
            <Clock size={20} className="text-blue-400 animate-pulse" />
          </div>
          <div>
            <p className="font-bold text-blue-300">En attente de validation</p>
            <p className="text-blue-400/80 text-xs mt-0.5">
              Votre demande de <strong className="text-blue-300">{Number(attendance.pendingOvertimeHours || 0).toFixed(1)}h supplémentaires</strong> a été envoyée à votre responsable.
            </p>
          </div>
        </div>
        <div className="px-4 py-3 bg-slate-800/60 rounded-2xl text-xs text-slate-400 flex items-center gap-2">
          <Info size={13} className="text-blue-400 flex-shrink-0" />
          Votre responsable recevra une notification. Les heures ne seront comptées qu'après sa validation.
        </div>
        {attendance.overtimeRequestedAt && (
          <p className="text-center text-[10px] text-slate-600">
            Demande envoyée le {new Date(attendance.overtimeRequestedAt).toLocaleString('fr-FR', {
              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
            })}
          </p>
        )}
      </div>
    );
  }

  if (attendance.overtimeStatus === 'APPROVED') {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-3xl p-5 flex items-center gap-3">
        <CheckCircle size={22} className="text-emerald-400 flex-shrink-0" />
        <div>
          <p className="font-bold text-emerald-300 text-sm">Heures supplémentaires validées ✅</p>
          <p className="text-xs text-emerald-400/70 mt-0.5">
            Vos {Number(attendance.pendingOvertimeHours || 0).toFixed(1)}h seront comptabilisées sur votre bulletin.
          </p>
        </div>
      </div>
    );
  }

  if (attendance.overtimeStatus === 'REJECTED') {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-3xl p-5 flex items-center gap-3">
        <XCircle size={22} className="text-red-400 flex-shrink-0" />
        <div>
          <p className="font-bold text-red-300 text-sm">Heures supplémentaires non validées</p>
          <p className="text-xs text-red-400/70 mt-0.5">Votre journée a été clôturée à l'heure officielle.</p>
        </div>
      </div>
    );
  }

  return null;
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function AttendanceCheckInPage() {
  const { bp } = useBasePath();
  const router = useRouter();
  const { addNotification } = useNotification();
  const { checkIn: offlineCheckIn, isOffline } = useAttendanceOffline();

  const [currentTime, setCurrentTime]   = useState<Date | null>(null);
  const [status, setStatus]             = useState<PageStatus>('loading');
  const [employeeId, setEmployeeId]     = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [history, setHistory]           = useState<any[]>([]);

  const [todayAttendance, setTodayAttendance]     = useState<TodayAttendance | null>(null);
  const [overtimeResolving, setOvertimeResolving] = useState(false);

  // ✅ Un seul state toast — gère earlyArrival ET slightLate
  const [activeToast, setActiveToast] = useState<{
    variant: ToastVariant;
    title: string;
    message: string;
  } | null>(null);

  const [geoState, setGeoState] = useState<{
    allowed: boolean; distance: number | null; accuracy: number | null;
    latitude: number | null; longitude: number | null;
    error: string | null; loading: boolean; isMockedSuspect: boolean;
  }>({
    allowed: false, distance: null, accuracy: null,
    latitude: null, longitude: null, error: null,
    loading: true, isMockedSuspect: false,
  });

  const [companySettings, setCompanySettings] = useState<any>(null);

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const me: any = await api.get('/employees/me');
        if (!me) { setStatus('error'); return; }
        setEmployeeId(me.id);
        setEmployeeName(me.firstName);

        const company: any = await api.get('/companies/mine');
        setCompanySettings(company);

        const todayData: any = await attendanceApi.getToday();
        const myAtt = todayData.find((a: any) => a.employeeId === me.id);
        if (myAtt) {
          setTodayAttendance(myAtt);
          setStatus(myAtt.checkOut ? 'completed' : 'working');
        } else {
          setStatus('idle');
        }

        const currentMonth = new Date().getMonth() + 1;
        const currentYear  = new Date().getFullYear();
        const monthlyData: any = await attendanceApi.getMonthly({ month: currentMonth, year: currentYear });
        if (monthlyData?.attendances) {
          const myHistory = monthlyData.attendances
            .filter((a: any) => a.employeeId === me.id)
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
          setHistory(myHistory);
        }
      } catch (e) {
        console.error('Erreur init pointage', e);
        setStatus('error');
      }
    })();
  }, []);

  // ── Horloge ───────────────────────────────────────────────────────────────
  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ── GPS Watch ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!companySettings) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: uLat, longitude: uLng, accuracy } = pos.coords;
        const cLat   = companySettings.latitude;
        const cLng   = companySettings.longitude;
        const radius = companySettings.allowedRadius || 100;
        let isAllowed = false;
        let dist = 0;
        if (!cLat || !cLng) {
          isAllowed = true;
        } else {
          dist      = getDistanceFromLatLonInMeters(uLat, uLng, cLat, cLng);
          isAllowed = dist <= radius;
        }
        setGeoState({
          allowed: isAllowed, distance: Math.round(dist), accuracy: Math.round(accuracy),
          latitude: uLat, longitude: uLng, error: null, loading: false,
          isMockedSuspect: accuracy > 100,
        });
      },
      (err) => {
        const msg = err.code === 1
          ? 'Vous devez autoriser la géolocalisation pour pointer.'
          : 'Impossible de vous localiser.';
        setGeoState(p => ({ ...p, error: msg, loading: false, allowed: false }));
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [companySettings]);

  // ── Action check-in / check-out ───────────────────────────────────────────
  const handleAction = async () => {
    if (!employeeId) return;
    if (!geoState.allowed && !geoState.isMockedSuspect && !isOffline) return;

    setIsProcessing(true);
    try {
      if (status === 'idle') {
        // ── CHECK-IN ────────────────────────────────────────────────────────
        const result = await offlineCheckIn({
          employeeId,
          latitude:  geoState.latitude  || undefined,
          longitude: geoState.longitude || undefined,
          notes: (geoState.isMockedSuspect && !geoState.allowed) ? 'SUSPICIOUS_LOCATION' : undefined,
        });

        if (result.success) {
          setStatus('working');

          // ✅ Cast any pour accéder aux champs optionnels du backend
          const data = (result as any);

          if (data.earlyArrival) {
            // Toast arrivée anticipée
            setActiveToast({
              variant: 'early',
              title:   data.earlyArrivalTitle   || '☀️ Arrivée anticipée notée !',
              message: data.earlyArrivalMessage || '',
            });
          } else if (data.slightLate) {
            // ✅ Toast petit retard (était absent avant)
            setActiveToast({
              variant: 'slight-late',
              title:   data.slightLateTitle   || '😅 Un tout petit retard !',
              message: data.slightLateMessage || '',
            });
          } else if (result.offline) {
            addNotification({ type: 'ALERT', title: 'Mode Hors Ligne', message: result.message });
          } else if (geoState.isMockedSuspect && !geoState.allowed) {
            addNotification({
              type:    'ALERT',
              title:   'Position Incertaine',
              message: `Pointage validé mais signalé. Précision GPS faible (${geoState.accuracy}m).`,
            });
          } else {
            addNotification({ type: 'CHECK_IN', title: 'Pointage Réussi', message: `Bonne journée ${employeeName} !` });
          }

          // Rafraîchir todayAttendance
          try {
            const todayData: any = await attendanceApi.getToday();
            const myAtt = todayData.find((a: any) => a.employeeId === employeeId);
            if (myAtt) setTodayAttendance(myAtt);
          } catch (_) { /* silencieux */ }
        }

      } else {
        // ── CHECK-OUT ────────────────────────────────────────────────────────
        await attendanceApi.checkOut({
          employeeId,
          latitude:  geoState.latitude  || undefined,
          longitude: geoState.longitude || undefined,
        });
        setStatus('completed');
        setShowConfetti(true);
        // ✅ 'CHECK_IN' utilisé — 'CHECK_OUT' n'existe pas dans le type front
        addNotification({ type: 'CHECK_IN', title: 'Bonne soirée !', message: 'Votre journée est enregistrée. À demain !' });
      }
    } catch (e: any) {
      console.error(e);
      addNotification({ type: 'ALERT', title: 'Erreur de pointage', message: e.message || 'Erreur technique.' });
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Overtime : OUBLI ──────────────────────────────────────────────────────
  const handleResolveForgotten = useCallback(async () => {
    if (!todayAttendance?.id) return;
    setOvertimeResolving(true);
    try {
      await api.post(`/attendance/resolve-forgotten/${todayAttendance.id}`, {});
      // ✅ 'CHECK_IN' car 'CHECK_OUT' non valide dans le type front
      addNotification({ type: 'CHECK_IN', title: 'Journée clôturée', message: "Votre journée a été fermée à l'heure officielle." });
      setTodayAttendance(prev => prev ? { ...prev, overtimeStatus: 'NONE' } : prev);
      setStatus('completed');
    } catch (e: any) {
      addNotification({ type: 'ALERT', title: 'Erreur', message: e.message || 'Impossible de traiter la demande.' });
    } finally {
      setOvertimeResolving(false);
    }
  }, [todayAttendance, addNotification]);

  // ── Overtime : HEURES SUP ─────────────────────────────────────────────────
  const handleDeclareOvertime = useCallback(async () => {
    if (!todayAttendance?.id) return;
    setOvertimeResolving(true);
    try {
      await api.post(`/attendance/declare-overtime/${todayAttendance.id}`, {});
      addNotification({ type: 'CHECK_IN', title: 'Demande envoyée', message: 'Votre responsable va recevoir une notification pour valider vos heures sup.' });
      setTodayAttendance(prev => prev ? { ...prev, overtimeStatus: 'PENDING_APPROVAL' } : prev);
    } catch (e: any) {
      addNotification({ type: 'ALERT', title: 'Erreur', message: e.message || 'Impossible de traiter la demande.' });
    } finally {
      setOvertimeResolving(false);
    }
  }, [todayAttendance, addNotification]);

  // ── Badge GPS ─────────────────────────────────────────────────────────────
  const getGpsBadge = () => {
    if (geoState.loading)         return { color: 'bg-gray-800 text-gray-400',                              icon: <Loader2 className="animate-spin" size={12} />, text: 'Recherche GPS...' };
    if (geoState.error)           return { color: 'bg-red-900/50 text-red-200 border-red-800',              icon: <Ban size={12} />,    text: 'GPS Inactif' };
    if (isOffline)                return { color: 'bg-orange-900/50 text-orange-200 border-orange-800',    icon: <Wifi size={12} />,   text: 'Mode Hors Ligne' };
    if (geoState.allowed)         return { color: 'bg-emerald-900/50 text-emerald-300 border-emerald-800', icon: <MapPin size={12} />, text: `Zone OK (${geoState.distance}m)` };
    if (geoState.isMockedSuspect) return { color: 'bg-yellow-900/50 text-yellow-200 border-yellow-700',    icon: <Wifi size={12} />,   text: `Signal Faible (${geoState.accuracy}m)` };
    return                               { color: 'bg-red-900/50 text-red-200 border-red-800',              icon: <Ban size={12} />,    text: `Hors Zone (${geoState.distance}m)` };
  };

  const badge = getGpsBadge();

  const hasOvertimeWorkflow = todayAttendance &&
    ['PENDING_EMPLOYEE', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'].includes(
      todayAttendance.overtimeStatus || ''
    );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-20 relative overflow-hidden flex flex-col items-center bg-slate-900 text-white">

      {/* Toast earlyArrival / slightLate */}
      {activeToast && (
        <AttendanceToast
          variant={activeToast.variant}
          title={activeToast.title}
          message={activeToast.message}
          onClose={() => setActiveToast(null)}
        />
      )}

      {/* Fond animé */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-emerald-500/20 rounded-full animate-[ping_3s_linear_infinite]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-emerald-500/30 rounded-full" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-slate-900" />
      </div>

      {/* Bouton retour */}
      <div className="absolute top-4 left-4 z-20">
        <button onClick={() => router.back()} className="p-2 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-colors">
          <ArrowLeft size={24} className="text-white" />
        </button>
      </div>

      {/* Horloge + badge GPS */}
      <div className="w-full pt-12 pb-4 text-center relative z-10">
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-6 border backdrop-blur-md transition-colors duration-500 ${badge.color}`}>
          {badge.icon}{badge.text}
        </div>
        <h1 className="text-6xl md:text-8xl font-bold tracking-tight font-mono tabular-nums text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">
          {currentTime ? currentTime.toLocaleTimeString('fr-FR') : '--:--:--'}
        </h1>
        <p className="text-slate-400 mt-2 text-lg capitalize">
          {currentTime?.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        {employeeName && <p className="text-sky-400 font-bold mt-2">Bonjour, {employeeName}</p>}
      </div>

      {/* Contenu */}
      <div className="w-full max-w-md px-4 relative z-10 space-y-4">

        {/* ── Carte pointage principale ──────────────────────────────────── */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10 text-center relative overflow-hidden">
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="w-full h-full bg-emerald-500/10 animate-pulse" />
            </div>
          )}

          {/* Alertes GPS */}
          {geoState.error && status === 'idle' && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-left">
              <div className="flex items-center gap-2 text-red-400 font-bold mb-1"><AlertTriangle size={18} /> Erreur GPS</div>
              <p className="text-xs text-red-300">{geoState.error}</p>
            </div>
          )}

          {!geoState.loading && !geoState.error && !geoState.allowed && !geoState.isMockedSuspect && status === 'idle' && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-left">
              <div className="flex items-center gap-2 text-red-400 font-bold mb-1"><Ban size={18} /> Accès Refusé</div>
              <p className="text-xs text-red-200">
                Vous êtes à <strong>{geoState.distance}m</strong> du bureau. Zone autorisée : {companySettings?.allowedRadius || 100}m.
              </p>
            </div>
          )}

          {!geoState.loading && !geoState.error && !geoState.allowed && geoState.isMockedSuspect && status === 'idle' && (
            <div className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-left">
              <div className="flex items-center gap-2 text-yellow-400 font-bold mb-1"><Wifi size={18} /> Signal Faible</div>
              <p className="text-xs text-yellow-200">
                Position imprécise ({geoState.accuracy}m). Autorisé exceptionnellement, sera signalé.
              </p>
            </div>
          )}

          {isOffline && status === 'idle' && (
            <div className="mb-6 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-left">
              <div className="flex items-center gap-2 text-orange-400 font-bold mb-1"><Wifi size={18} /> Mode Hors Ligne</div>
              <p className="text-xs text-orange-200">Pointage enregistré localement, synchronisé dès le retour du réseau.</p>
            </div>
          )}

          {/* États */}
          {status === 'loading' && (
            <div className="py-10"><Loader2 className="animate-spin mx-auto text-sky-500" size={32} /></div>
          )}

          {status === 'idle' && (
            <>
              <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 transition-all duration-500 ${
                geoState.allowed || isOffline
                  ? 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]'
                  : geoState.isMockedSuspect ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-slate-700/50 text-slate-500'
              }`}>
                <Fingerprint size={48} strokeWidth={1.5} />
              </div>
              <button
                onClick={handleAction}
                disabled={isProcessing || (!geoState.allowed && !geoState.isMockedSuspect && !isOffline) || geoState.loading}
                className={`w-full py-4 font-bold rounded-2xl shadow-lg flex justify-center items-center gap-3 transition-all active:scale-95 ${
                  (geoState.allowed || geoState.isMockedSuspect || isOffline)
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-emerald-500/25'
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed border border-white/5'
                }`}
              >
                {isProcessing ? <Loader2 className="animate-spin" /> : <Clock size={20} />}
                {isOffline ? 'Pointer (Hors Ligne)' : geoState.allowed ? "Pointer l'Entrée" : geoState.isMockedSuspect ? 'Forcer (Signal Faible)' : 'Hors Zone'}
              </button>
            </>
          )}

          {status === 'working' && !hasOvertimeWorkflow && (
            <>
              <div className="w-20 h-20 bg-sky-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-sky-400 animate-pulse border border-sky-500/30">
                <Clock size={32} />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-white">Au travail</h2>
              <p className="text-slate-400 mb-8 text-sm">
                Débuté à{' '}
                {todayAttendance?.checkIn
                  ? new Date(todayAttendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : history[0]?.checkIn
                  ? new Date(history[0].checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : "l'instant"}
              </p>
              <button onClick={handleAction} disabled={isProcessing}
                className="w-full py-4 bg-red-500/10 border border-red-500/50 text-red-400 font-bold rounded-2xl hover:bg-red-500/20 flex justify-center items-center gap-3 transition-transform active:scale-95">
                {isProcessing ? <Loader2 className="animate-spin" /> : <LogOut size={20} />}
                Fin de journée
              </button>
            </>
          )}

          {status === 'completed' && !hasOvertimeWorkflow && (
            <>
              <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-400 border border-indigo-500/30">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-white">À demain !</h2>
              <p className="text-slate-400 mb-8 text-sm">Votre journée est enregistrée.</p>
              <button onClick={() => router.push(bp('/presences'))}
                className="w-full py-3 bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-600 transition-colors">
                Fermer
              </button>
            </>
          )}

          {status === 'error' && (
            <div className="py-8 text-center">
              <AlertTriangle size={32} className="text-red-400 mx-auto mb-3" />
              <p className="text-red-300 font-bold">Impossible de charger votre profil</p>
              <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-slate-700 rounded-xl text-sm text-white">
                Réessayer
              </button>
            </div>
          )}
        </div>

        {/* ── 🆕 Overtime Workflow ───────────────────────────────────────── */}
        {hasOvertimeWorkflow && todayAttendance && (
          <OvertimeWorkflowCard
            attendance={todayAttendance}
            onResolveForgotten={handleResolveForgotten}
            onDeclareOvertime={handleDeclareOvertime}
            resolving={overtimeResolving}
          />
        )}

        {/* ── Historique semaine ─────────────────────────────────────────── */}
        <div className="bg-slate-800/30 backdrop-blur-md rounded-3xl p-6 border border-white/5 shadow-lg">
          <h3 className="text-xs font-bold uppercase text-slate-500 mb-4 flex items-center gap-2 tracking-widest">
            <History size={12} /> Cette semaine
          </h3>
          {history.length > 0 ? (
            <div className="space-y-3">
              {history.map((record, i) => {
                const date    = new Date(record.date);
                const isToday = new Date().toDateString() === date.toDateString();
                const hasOT   = record.overtime10 > 0 || record.overtime25 > 0 || record.overtime50 > 0;
                return (
                  <div key={i} className={`flex justify-between items-center p-3 rounded-xl border ${isToday ? 'bg-sky-500/10 border-sky-500/30' : 'bg-white/5 border-white/5'}`}>
                    <div>
                      <p className="font-bold text-slate-200 text-sm capitalize">
                        {date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}
                      </p>
                      <div className="flex gap-3 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </span>
                        <span className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          {record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      {record.status === 'LATE' && (
                        <span className="text-[10px] px-2 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold">RETARD</span>
                      )}
                      {record.notes === 'SUSPICIOUS_LOCATION' && (
                        <span className="text-[10px] px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-bold">SUSPECT</span>
                      )}
                      {hasOT && (
                        <span className="text-[10px] px-2 py-1 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 font-bold flex items-center gap-1">
                          <Zap size={9} /> HS
                        </span>
                      )}
                      {record.overtimeStatus === 'PENDING_APPROVAL' && (
                        <span className="text-[10px] px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold">EN ATTENTE</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-slate-600 text-xs py-4">Historique vide.</p>
          )}
        </div>

      </div>
    </div>
  );
}
// 'use client';

// import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { Clock, MapPin, Sun, LogOut, ArrowLeft, Loader2, CheckCircle2, AlertTriangle, History, Navigation, Ban, ShieldAlert, Fingerprint, Wifi } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { attendanceApi } from '@/services/attendance-api';
// import { api } from '@/services/api';
// import { getDistanceFromLatLonInMeters } from '@/utils/geo';
// import { useNotification } from '@/components/providers/NotificationProvider';

// export default function AttendanceCheckInPage() {
//   const router = useRouter();
//   const { addNotification } = useNotification();
//   const [currentTime, setCurrentTime] = useState<Date | null>(null);
//   const [status, setStatus] = useState<'loading' | 'idle' | 'working' | 'completed' | 'error'>('loading');
//   const [employeeId, setEmployeeId] = useState(''); 
//   const [employeeName, setEmployeeName] = useState('');
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [showConfetti, setShowConfetti] = useState(false);
//   const [history, setHistory] = useState<any[]>([]);
  
//   // Geolocation State
//   const [geoState, setGeoState] = useState<{
//       allowed: boolean;
//       distance: number | null;
//       accuracy: number | null;
//       latitude: number | null;
//       longitude: number | null;
//       error: string | null;
//       loading: boolean;
//       isMockedSuspect: boolean;
//   }>({ 
//     allowed: false, 
//     distance: null, 
//     accuracy: null, 
//     latitude: null, 
//     longitude: null, 
//     error: null, 
//     loading: true, 
//     isMockedSuspect: false 
//   });

//   // Paramètres de l'entreprise
//   const [companySettings, setCompanySettings] = useState<any>(null);

//   useEffect(() => {
//     const init = async () => {
//         try {
//             // 1. Qui suis-je ?
//             const me: any = await api.get('/employees/me');
//             if (!me) {
//                 setStatus('error');
//                 return;
//             }
//             setEmployeeId(me.id);
//             setEmployeeName(me.firstName);

//             // 2. Paramètres Entreprise (Pour la zone GPS)
//             const company: any = await api.get('/companies/mine');
//             setCompanySettings(company);

//             // 3. Statut du jour (utilise le nouveau endpoint)
//             const todayData: any = await attendanceApi.getToday();
//             const myAtt = todayData.find((a: any) => a.employeeId === me.id);
            
//             if (myAtt) {
//                 setStatus(myAtt.checkOut ? 'completed' : 'working');
//             } else {
//                 setStatus('idle');
//             }

//             // 4. Historique (utilise le nouveau endpoint)
//             const currentMonth = new Date().getMonth() + 1;
//             const currentYear = new Date().getFullYear();
            
//             const monthlyData: any = await attendanceApi.getMonthly({
//                 month: currentMonth,
//                 year: currentYear
//             });
            
//             if (monthlyData && monthlyData.attendances) {
//                 const myHistory = monthlyData.attendances
//                     .filter((a: any) => a.employeeId === me.id)
//                     .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
//                     .slice(0, 5); 
//                 setHistory(myHistory);
//             }

//         } catch (e) {
//             console.error("Erreur init pointage", e);
//             setStatus('error');
//         }
//     };
//     init();
//   }, []);

//   // Clock
//   useEffect(() => {
//     setCurrentTime(new Date());
//     const timer = setInterval(() => setCurrentTime(new Date()), 1000);
//     return () => clearInterval(timer);
//   }, []);

//   // Geolocation Logic
//   useEffect(() => {
//       if (!companySettings) return;

//       const watchId = navigator.geolocation.watchPosition(
//           (pos) => {
//               const userLat = pos.coords.latitude;
//               const userLng = pos.coords.longitude;
//               const accuracy = pos.coords.accuracy;
              
//               const companyLat = companySettings.latitude;
//               const companyLng = companySettings.longitude;
//               const radius = companySettings.allowedRadius || 100;

//               let isAllowed = false;
//               let dist = 0;

//               if (!companyLat || !companyLng) {
//                   isAllowed = true;
//                   dist = 0;
//               } else {
//                   dist = getDistanceFromLatLonInMeters(userLat, userLng, companyLat, companyLng);
//                   isAllowed = dist <= radius;
//               }
              
//               const isSuspect = accuracy > 100;

//               setGeoState({
//                   allowed: isAllowed,
//                   distance: Math.round(dist),
//                   accuracy: Math.round(accuracy),
//                   latitude: userLat,
//                   longitude: userLng,
//                   error: null,
//                   loading: false,
//                   isMockedSuspect: isSuspect
//               });
//           },
//           (err) => {
//               let msg = "Impossible de vous localiser.";
//               if (err.code === 1) msg = "Vous devez autoriser la géolocalisation pour pointer.";
//               setGeoState(p => ({ ...p, error: msg, loading: false, allowed: false }));
//           },
//           { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
//       );

//       return () => navigator.geolocation.clearWatch(watchId);
//   }, [companySettings]); 

//   const handleAction = async () => {
//     if (!employeeId) return;
    
//     if (!geoState.allowed && !geoState.isMockedSuspect) {
//         return; 
//     }

//     setIsProcessing(true);
//     try {
//         if (status === 'idle') {
//             // ✅ Utilise le nouveau endpoint check-in
//             await attendanceApi.checkIn({ 
//                 employeeId, 
//                 notes: (geoState.isMockedSuspect && !geoState.allowed) ? 'SUSPICIOUS_LOCATION' : undefined,
//                 latitude: geoState.latitude || undefined,
//                 longitude: geoState.longitude || undefined
//             });
//             setStatus('working');
            
//             if (geoState.isMockedSuspect && !geoState.allowed) {
//                 addNotification({
//                     type: 'ALERT',
//                     title: 'Position Incertaine',
//                     message: `Pointage validé mais signalé. Précision GPS faible (${geoState.accuracy}m).`
//                 });
//             } else {
//                 addNotification({
//                     type: 'CHECK_IN',
//                     title: 'Pointage Réussi',
//                     message: `Bonne journée ${employeeName} !`
//                 });
//             }

//         } else {
//             // ✅ Utilise le nouveau endpoint check-out
//             await attendanceApi.checkOut({ 
//                 employeeId,
//                 latitude: geoState.latitude || undefined,
//                 longitude: geoState.longitude || undefined
//             });
//             setStatus('completed');
//             setShowConfetti(true);
//         }
//     } catch (e: any) {
//         console.error(e);
//         alert(
//             `Erreur de pointage\n\n${e.message || 'Erreur technique lors du pointage.'}`
//         );
//     } finally {
//         setIsProcessing(false);
//     }
//   };

//   const getGpsBadge = () => {
//       if (geoState.loading) return { color: 'bg-gray-800 text-gray-400', icon: <Loader2 className="animate-spin" size={12}/>, text: 'Recherche GPS...' };
//       if (geoState.error) return { color: 'bg-red-900/50 text-red-200 border-red-800', icon: <Ban size={12}/>, text: 'GPS Inactif' };
      
//       if (geoState.allowed) {
//           return { color: 'bg-emerald-900/50 text-emerald-300 border-emerald-800', icon: <MapPin size={12}/>, text: `Zone OK (${geoState.distance}m)` };
//       }
      
//       if (geoState.isMockedSuspect) {
//            return { color: 'bg-yellow-900/50 text-yellow-200 border-yellow-700', icon: <Wifi size={12}/>, text: `Signal Faible (${geoState.accuracy}m)` };
//       }
      
//       return { color: 'bg-red-900/50 text-red-200 border-red-800', icon: <Ban size={12}/>, text: `Hors Zone (${geoState.distance}m)` };
//   };

//   const badge = getGpsBadge();

//   return (
//     <div className="min-h-screen pb-20 relative overflow-hidden flex flex-col items-center bg-slate-900 text-white">
      
//       <div className="absolute inset-0 pointer-events-none overflow-hidden">
//           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-emerald-500/20 rounded-full animate-[ping_3s_linear_infinite]"></div>
//           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-emerald-500/30 rounded-full"></div>
//           <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-slate-900"></div>
//       </div>

//       <div className="absolute top-4 left-4 z-20">
//         <button onClick={() => router.back()} className="p-2 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-colors"><ArrowLeft size={24} className="text-white"/></button>
//       </div>

//       <div className="w-full pt-12 pb-4 text-center relative z-10">
//         <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-6 border backdrop-blur-md transition-colors duration-500 ${badge.color}`}>
//           {badge.icon}
//           {badge.text}
//         </div>

//         <h1 className="text-6xl md:text-8xl font-bold tracking-tight font-mono tabular-nums text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">
//           {currentTime ? currentTime.toLocaleTimeString('fr-FR') : '--:--:--'}
//         </h1>
//         <p className="text-slate-400 mt-2 text-lg capitalize">{currentTime?.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        
//         {employeeName && <p className="text-sky-400 font-bold mt-2">Bonjour, {employeeName}</p>}
//       </div>

//       <div className="w-full max-w-md px-4 relative z-10 space-y-6">
        
//         <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10 text-center relative overflow-hidden">
            
//             {showConfetti && (
//                 <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
//                     <div className="w-full h-full bg-emerald-500/10 animate-pulse"></div>
//                 </div>
//             )}

//             {geoState.error && status === 'idle' && (
//                 <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-left">
//                     <div className="flex items-center gap-2 text-red-400 font-bold mb-1">
//                         <AlertTriangle size={18}/> Erreur GPS
//                     </div>
//                     <p className="text-xs text-red-300">{geoState.error}</p>
//                 </div>
//             )}

//             {!geoState.loading && !geoState.error && !geoState.allowed && !geoState.isMockedSuspect && status === 'idle' && (
//                 <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-left">
//                     <div className="flex items-center gap-2 text-red-400 font-bold mb-1">
//                         <Ban size={18}/> Accès Refusé
//                     </div>
//                     <p className="text-xs text-red-200">
//                         Vous êtes à <strong>{geoState.distance}m</strong> du bureau. Rapprochez-vous de la zone autorisée ({companySettings?.allowedRadius || 100}m).
//                     </p>
//                 </div>
//             )}

//             {!geoState.loading && !geoState.error && !geoState.allowed && geoState.isMockedSuspect && status === 'idle' && (
//                 <div className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-left">
//                     <div className="flex items-center gap-2 text-yellow-400 font-bold mb-1">
//                         <Wifi size={18}/> Signal Faible
//                     </div>
//                     <p className="text-xs text-yellow-200">
//                         Votre position est imprécise ({geoState.accuracy}m). Le pointage est autorisé exceptionnellement mais sera marqué pour vérification.
//                     </p>
//                 </div>
//             )}

//             {status === 'loading' && <div className="py-10"><Loader2 className="animate-spin mx-auto text-sky-500" size={32}/></div>}

//             {status === 'idle' && (
//                 <>
//                     <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 transition-all duration-500 ${geoState.allowed ? 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]' : geoState.isMockedSuspect ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-700/50 text-slate-500'}`}>
//                         <Fingerprint size={48} strokeWidth={1.5} />
//                     </div>
                    
//                     <button 
//                         onClick={handleAction} 
//                         disabled={isProcessing || (!geoState.allowed && !geoState.isMockedSuspect) || geoState.loading}
//                         className={`w-full py-4 font-bold rounded-2xl shadow-lg flex justify-center items-center gap-3 transition-all active:scale-95 ${
//                             (geoState.allowed || geoState.isMockedSuspect) 
//                                 ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-emerald-500/25' 
//                                 : 'bg-slate-700 text-slate-400 cursor-not-allowed border border-white/5'
//                         }`}
//                     >
//                         {isProcessing ? <Loader2 className="animate-spin"/> : <Clock size={20}/>} 
//                         {geoState.allowed ? "Pointer l'Entrée" : geoState.isMockedSuspect ? "Forcer (Signal Faible)" : "Hors Zone"}
//                     </button>
//                 </>
//             )}

//             {status === 'working' && (
//                 <>
//                     <div className="w-20 h-20 bg-sky-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-sky-400 animate-pulse border border-sky-500/30"><Clock size={32}/></div>
//                     <h2 className="text-2xl font-bold mb-2 text-white">Au travail</h2>
//                     <p className="text-slate-400 mb-8 text-sm">Débuté à {history.length > 0 && history[0].checkIn ? new Date(history[0].checkIn).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : 'l\'instant'}</p>
//                     <button onClick={handleAction} disabled={isProcessing} className="w-full py-4 bg-red-500/10 border border-red-500/50 text-red-400 font-bold rounded-2xl hover:bg-red-500/20 flex justify-center items-center gap-3 transition-transform active:scale-95">
//                         {isProcessing ? <Loader2 className="animate-spin"/> : <LogOut size={20}/>} Fin de journée
//                     </button>
//                 </>
//             )}

//             {status === 'completed' && (
//                 <>
//                     <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-400 border border-indigo-500/30"><CheckCircle2 size={32}/></div>
//                     <h2 className="text-2xl font-bold mb-2 text-white">À demain !</h2>
//                     <p className="text-slate-400 mb-8 text-sm">Votre journée est enregistrée.</p>
//                     <button onClick={() => router.push('/presences')} className="w-full py-3 bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-600 transition-colors">Fermer</button>
//                 </>
//             )}
//         </div>

//         <div className="bg-slate-800/30 backdrop-blur-md rounded-3xl p-6 border border-white/5 shadow-lg">
//             <h3 className="text-xs font-bold uppercase text-slate-500 mb-4 flex items-center gap-2 tracking-widest">
//                 <History size={12} /> Cette semaine
//             </h3>
            
//             {history.length > 0 ? (
//                 <div className="space-y-3">
//                     {history.map((record, i) => {
//                         const date = new Date(record.date);
//                         const isToday = new Date().toDateString() === date.toDateString();
                        
//                         return (
//                             <div key={i} className={`flex justify-between items-center p-3 rounded-xl border ${isToday ? 'bg-sky-500/10 border-sky-500/30' : 'bg-white/5 border-white/5'}`}>
//                                 <div>
//                                     <p className="font-bold text-slate-200 text-sm capitalize">
//                                         {date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}
//                                     </p>
//                                     <div className="flex gap-3 text-xs text-slate-400 mt-1">
//                                         <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> {record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}</span>
//                                         <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> {record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}</span>
//                                     </div>
//                                 </div>
//                                 <div>
//                                     {record.status === 'LATE' && <span className="text-[10px] px-2 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold">RETARD</span>}
//                                     {record.notes === 'SUSPICIOUS_LOCATION' && <span className="text-[10px] px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-bold ml-1">SUSPECT</span>}
//                                 </div>
//                             </div>
//                         );
//                     })}
//                 </div>
//             ) : (
//                 <p className="text-center text-slate-600 text-xs py-4">Historique vide.</p>
//             )}
//         </div>

//       </div>
//     </div>
//   );
// }