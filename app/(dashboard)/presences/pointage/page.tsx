'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, MapPin, Sun, LogOut, ArrowLeft, Loader2, CheckCircle2, AlertTriangle, History, Navigation, Ban, ShieldAlert, Fingerprint, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { attendanceApi } from '@/services/attendance-api';
import { api } from '@/services/api';
import { getDistanceFromLatLonInMeters } from '@/utils/geo';
import { useNotification } from '@/components/providers/NotificationProvider';
import { useAttendanceOffline } from '@/hooks/useAttendanceOffline'; // ← AJOUT PWA

export default function AttendanceCheckInPage() {
  const router = useRouter();
  const { addNotification } = useNotification();
  const { checkIn: offlineCheckIn, isOffline } = useAttendanceOffline(); // ← AJOUT PWA
  
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [status, setStatus] = useState<'loading' | 'idle' | 'working' | 'completed' | 'error'>('loading');
  const [employeeId, setEmployeeId] = useState(''); 
  const [employeeName, setEmployeeName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  
  const [geoState, setGeoState] = useState<{
      allowed: boolean;
      distance: number | null;
      accuracy: number | null;
      latitude: number | null;
      longitude: number | null;
      error: string | null;
      loading: boolean;
      isMockedSuspect: boolean;
  }>({ 
    allowed: false, 
    distance: null, 
    accuracy: null, 
    latitude: null, 
    longitude: null, 
    error: null, 
    loading: true, 
    isMockedSuspect: false 
  });

  const [companySettings, setCompanySettings] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
        try {
            const me: any = await api.get('/employees/me');
            if (!me) {
                setStatus('error');
                return;
            }
            setEmployeeId(me.id);
            setEmployeeName(me.firstName);

            const company: any = await api.get('/companies/mine');
            setCompanySettings(company);

            const todayData: any = await attendanceApi.getToday();
            const myAtt = todayData.find((a: any) => a.employeeId === me.id);
            
            if (myAtt) {
                setStatus(myAtt.checkOut ? 'completed' : 'working');
            } else {
                setStatus('idle');
            }

            const currentMonth = new Date().getMonth() + 1;
            const currentYear = new Date().getFullYear();
            
            const monthlyData: any = await attendanceApi.getMonthly({
                month: currentMonth,
                year: currentYear
            });
            
            if (monthlyData && monthlyData.attendances) {
                const myHistory = monthlyData.attendances
                    .filter((a: any) => a.employeeId === me.id)
                    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 5); 
                setHistory(myHistory);
            }
        } catch (e) {
            console.error("Erreur init pointage", e);
            setStatus('error');
        }
    };
    init();
  }, []);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
      if (!companySettings) return;

      const watchId = navigator.geolocation.watchPosition(
          (pos) => {
              const userLat = pos.coords.latitude;
              const userLng = pos.coords.longitude;
              const accuracy = pos.coords.accuracy;
              
              const companyLat = companySettings.latitude;
              const companyLng = companySettings.longitude;
              const radius = companySettings.allowedRadius || 100;

              let isAllowed = false;
              let dist = 0;

              if (!companyLat || !companyLng) {
                  isAllowed = true;
                  dist = 0;
              } else {
                  dist = getDistanceFromLatLonInMeters(userLat, userLng, companyLat, companyLng);
                  isAllowed = dist <= radius;
              }
              
              const isSuspect = accuracy > 100;

              setGeoState({
                  allowed: isAllowed,
                  distance: Math.round(dist),
                  accuracy: Math.round(accuracy),
                  latitude: userLat,
                  longitude: userLng,
                  error: null,
                  loading: false,
                  isMockedSuspect: isSuspect
              });
          },
          (err) => {
              let msg = "Impossible de vous localiser.";
              if (err.code === 1) msg = "Vous devez autoriser la géolocalisation pour pointer.";
              setGeoState(p => ({ ...p, error: msg, loading: false, allowed: false }));
          },
          { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
  }, [companySettings]); 

  // ✅ MODIFIÉ : Fonction handleAction avec PWA
  const handleAction = async () => {
    if (!employeeId) return;
    
    if (!geoState.allowed && !geoState.isMockedSuspect) {
        return; 
    }

    setIsProcessing(true);
    try {
        if (status === 'idle') {
            // ✅ UTILISE LE HOOK PWA OFFLINE
            const result = await offlineCheckIn({
                employeeId,
                latitude: geoState.latitude || undefined,
                longitude: geoState.longitude || undefined,
                notes: (geoState.isMockedSuspect && !geoState.allowed) ? 'SUSPICIOUS_LOCATION' : undefined,
            }, attendanceApi);

            if (result.success) {
                setStatus('working');
                
                if (result.offline) {
                    addNotification({
                        type: 'ALERT',
                        title: 'Mode Hors Ligne',
                        message: result.message
                    });
                } else if (geoState.isMockedSuspect && !geoState.allowed) {
                    addNotification({
                        type: 'ALERT',
                        title: 'Position Incertaine',
                        message: `Pointage validé mais signalé. Précision GPS faible (${geoState.accuracy}m).`
                    });
                } else {
                    addNotification({
                        type: 'CHECK_IN',
                        title: 'Pointage Réussi',
                        message: `Bonne journée ${employeeName} !`
                    });
                }
            }
        } else {
            await attendanceApi.checkOut({ 
                employeeId,
                latitude: geoState.latitude || undefined,
                longitude: geoState.longitude || undefined
            });
            setStatus('completed');
            setShowConfetti(true);
        }
    } catch (e: any) {
        console.error(e);
        alert(`Erreur de pointage\n\n${e.message || 'Erreur technique lors du pointage.'}`);
    } finally {
        setIsProcessing(false);
    }
  };

  const getGpsBadge = () => {
      if (geoState.loading) return { color: 'bg-gray-800 text-gray-400', icon: <Loader2 className="animate-spin" size={12}/>, text: 'Recherche GPS...' };
      if (geoState.error) return { color: 'bg-red-900/50 text-red-200 border-red-800', icon: <Ban size={12}/>, text: 'GPS Inactif' };
      
      // ✅ AJOUT : Badge offline
      if (isOffline) return { color: 'bg-orange-900/50 text-orange-200 border-orange-800', icon: <Wifi size={12}/>, text: 'Mode Hors Ligne' };
      
      if (geoState.allowed) {
          return { color: 'bg-emerald-900/50 text-emerald-300 border-emerald-800', icon: <MapPin size={12}/>, text: `Zone OK (${geoState.distance}m)` };
      }
      
      if (geoState.isMockedSuspect) {
           return { color: 'bg-yellow-900/50 text-yellow-200 border-yellow-700', icon: <Wifi size={12}/>, text: `Signal Faible (${geoState.accuracy}m)` };
      }
      
      return { color: 'bg-red-900/50 text-red-200 border-red-800', icon: <Ban size={12}/>, text: `Hors Zone (${geoState.distance}m)` };
  };

  const badge = getGpsBadge();

  return (
    <div className="min-h-screen pb-20 relative overflow-hidden flex flex-col items-center bg-slate-900 text-white">
      
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-emerald-500/20 rounded-full animate-[ping_3s_linear_infinite]"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-emerald-500/30 rounded-full"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-slate-900"></div>
      </div>

      <div className="absolute top-4 left-4 z-20">
        <button onClick={() => router.back()} className="p-2 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-colors"><ArrowLeft size={24} className="text-white"/></button>
      </div>

      <div className="w-full pt-12 pb-4 text-center relative z-10">
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-6 border backdrop-blur-md transition-colors duration-500 ${badge.color}`}>
          {badge.icon}
          {badge.text}
        </div>

        <h1 className="text-6xl md:text-8xl font-bold tracking-tight font-mono tabular-nums text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">
          {currentTime ? currentTime.toLocaleTimeString('fr-FR') : '--:--:--'}
        </h1>
        <p className="text-slate-400 mt-2 text-lg capitalize">{currentTime?.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        
        {employeeName && <p className="text-sky-400 font-bold mt-2">Bonjour, {employeeName}</p>}
      </div>

      <div className="w-full max-w-md px-4 relative z-10 space-y-6">
        
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10 text-center relative overflow-hidden">
            
            {showConfetti && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-full h-full bg-emerald-500/10 animate-pulse"></div>
                </div>
            )}

            {geoState.error && status === 'idle' && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-left">
                    <div className="flex items-center gap-2 text-red-400 font-bold mb-1">
                        <AlertTriangle size={18}/> Erreur GPS
                    </div>
                    <p className="text-xs text-red-300">{geoState.error}</p>
                </div>
            )}

            {!geoState.loading && !geoState.error && !geoState.allowed && !geoState.isMockedSuspect && status === 'idle' && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-left">
                    <div className="flex items-center gap-2 text-red-400 font-bold mb-1">
                        <Ban size={18}/> Accès Refusé
                    </div>
                    <p className="text-xs text-red-200">
                        Vous êtes à <strong>{geoState.distance}m</strong> du bureau. Rapprochez-vous de la zone autorisée ({companySettings?.allowedRadius || 100}m).
                    </p>
                </div>
            )}

            {!geoState.loading && !geoState.error && !geoState.allowed && geoState.isMockedSuspect && status === 'idle' && (
                <div className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-left">
                    <div className="flex items-center gap-2 text-yellow-400 font-bold mb-1">
                        <Wifi size={18}/> Signal Faible
                    </div>
                    <p className="text-xs text-yellow-200">
                        Votre position est imprécise ({geoState.accuracy}m). Le pointage est autorisé exceptionnellement mais sera marqué pour vérification.
                    </p>
                </div>
            )}

            {/* ✅ AJOUT : Message offline */}
            {isOffline && status === 'idle' && (
                <div className="mb-6 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-left">
                    <div className="flex items-center gap-2 text-orange-400 font-bold mb-1">
                        <Wifi size={18}/> Mode Hors Ligne
                    </div>
                    <p className="text-xs text-orange-200">
                        Pas de connexion internet. Votre pointage sera enregistré localement et synchronisé automatiquement.
                    </p>
                </div>
            )}

            {status === 'loading' && <div className="py-10"><Loader2 className="animate-spin mx-auto text-sky-500" size={32}/></div>}

            {status === 'idle' && (
                <>
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 transition-all duration-500 ${geoState.allowed || isOffline ? 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]' : geoState.isMockedSuspect ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-700/50 text-slate-500'}`}>
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
                        {isProcessing ? <Loader2 className="animate-spin"/> : <Clock size={20}/>} 
                        {isOffline ? "Pointer (Hors Ligne)" : geoState.allowed ? "Pointer l'Entrée" : geoState.isMockedSuspect ? "Forcer (Signal Faible)" : "Hors Zone"}
                    </button>
                </>
            )}

            {status === 'working' && (
                <>
                    <div className="w-20 h-20 bg-sky-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-sky-400 animate-pulse border border-sky-500/30"><Clock size={32}/></div>
                    <h2 className="text-2xl font-bold mb-2 text-white">Au travail</h2>
                    <p className="text-slate-400 mb-8 text-sm">Débuté à {history.length > 0 && history[0].checkIn ? new Date(history[0].checkIn).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : 'l\'instant'}</p>
                    <button onClick={handleAction} disabled={isProcessing} className="w-full py-4 bg-red-500/10 border border-red-500/50 text-red-400 font-bold rounded-2xl hover:bg-red-500/20 flex justify-center items-center gap-3 transition-transform active:scale-95">
                        {isProcessing ? <Loader2 className="animate-spin"/> : <LogOut size={20}/>} Fin de journée
                    </button>
                </>
            )}

            {status === 'completed' && (
                <>
                    <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-400 border border-indigo-500/30"><CheckCircle2 size={32}/></div>
                    <h2 className="text-2xl font-bold mb-2 text-white">À demain !</h2>
                    <p className="text-slate-400 mb-8 text-sm">Votre journée est enregistrée.</p>
                    <button onClick={() => router.push('/presences')} className="w-full py-3 bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-600 transition-colors">Fermer</button>
                </>
            )}
        </div>

        <div className="bg-slate-800/30 backdrop-blur-md rounded-3xl p-6 border border-white/5 shadow-lg">
            <h3 className="text-xs font-bold uppercase text-slate-500 mb-4 flex items-center gap-2 tracking-widest">
                <History size={12} /> Cette semaine
            </h3>
            
            {history.length > 0 ? (
                <div className="space-y-3">
                    {history.map((record, i) => {
                        const date = new Date(record.date);
                        const isToday = new Date().toDateString() === date.toDateString();
                        
                        return (
                            <div key={i} className={`flex justify-between items-center p-3 rounded-xl border ${isToday ? 'bg-sky-500/10 border-sky-500/30' : 'bg-white/5 border-white/5'}`}>
                                <div>
                                    <p className="font-bold text-slate-200 text-sm capitalize">
                                        {date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}
                                    </p>
                                    <div className="flex gap-3 text-xs text-slate-400 mt-1">
                                        <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> {record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}</span>
                                        <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> {record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}</span>
                                    </div>
                                </div>
                                <div>
                                    {record.status === 'LATE' && <span className="text-[10px] px-2 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold">RETARD</span>}
                                    {record.notes === 'SUSPICIOUS_LOCATION' && <span className="text-[10px] px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-bold ml-1">SUSPECT</span>}
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