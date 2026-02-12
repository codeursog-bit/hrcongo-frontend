'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, UserCheck, MapPin, AlertTriangle, Info, GraduationCap, CheckCircle } from 'lucide-react';
import { io } from 'socket.io-client';

type NotificationType = 'CHECK_IN' | 'ALERT' | 'INFO' | 'TRAINING' | 'SUCCESS'; // ✅ Ajout SUCCESS

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  avatar?: string;
  time: string;
}

interface NotificationContextType {
  addNotification: (notif: Omit<Notification, 'id' | 'time'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children?: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [mutedUntil, setMutedUntil] = useState<number | null>(null);

  // --- WEBSOCKET CONNECTION ---
  useEffect(() => {
    const socket = io('http://localhost:3001', {
        withCredentials: true,
    });

    // 1. Notifications Admin (RH)
    socket.on('admin-notification', (data: any) => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            if (['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'MANAGER'].includes(user.role)) {
                addNotification(data);
            }
        }
    });

    // 2. Notifications Globales (Employés) - NOUVEAU
    socket.on('company-notification', (data: any) => {
        // Tout le monde reçoit ça (ex: Nouvelle formation)
        addNotification({
            type: 'INFO', // ou TRAINING
            title: data.title,
            message: data.message
        });
    });

    return () => {
        socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const muteTimestamp = localStorage.getItem('notifications_muted_until');
    if (muteTimestamp) {
        const ts = parseInt(muteTimestamp);
        if (ts > Date.now()) {
            setMutedUntil(ts);
        } else {
            localStorage.removeItem('notifications_muted_until');
        }
    }
  }, []);

  const addNotification = (notif: Omit<Notification, 'id' | 'time'>) => {
    if (mutedUntil && mutedUntil > Date.now()) return;

    const id = Math.random().toString(36).substr(2, 9);
    const newNotif = { ...notif, id, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) };
    
    setNotifications((prev) => [newNotif, ...prev].slice(0, 3)); 

    setTimeout(() => {
      removeNotification(id);
    }, 10000); // 10 secondes d'affichage
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const muteForToday = () => {
    const tomorrow = new Date();
    tomorrow.setHours(24, 0, 0, 0);
    localStorage.setItem('notifications_muted_until', tomorrow.getTime().toString());
    setMutedUntil(tomorrow.getTime());
    setNotifications([]); 
  };

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
      
      <div className="fixed top-24 right-4 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none">
        <AnimatePresence>
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              layout
              className="pointer-events-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/20 dark:border-gray-700 p-4 rounded-2xl shadow-2xl shadow-sky-500/10 flex gap-4 relative overflow-hidden group"
            >
              <motion.div 
                initial={{ width: '100%' }} 
                animate={{ width: 0 }} 
                transition={{ duration: 10, ease: 'linear' }}
                className={`absolute bottom-0 left-0 h-1 ${
                  n.type === 'ALERT' ? 'bg-red-500' : 
                  n.type === 'SUCCESS' ? 'bg-emerald-500' : 
                  'bg-sky-500'
                }`}
              />

              <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                n.type === 'ALERT' ? 'bg-red-100 text-red-600' : 
                n.type === 'SUCCESS' ? 'bg-emerald-100 text-emerald-600' :
                'bg-sky-100 text-sky-600'
              }`}>
                 {n.avatar ? (
                     <img src={n.avatar} className="w-full h-full rounded-full object-cover" />
                 ) : (
                     n.type === 'SUCCESS' ? <CheckCircle size={24} /> :
                     n.title.includes('Formation') ? <GraduationCap size={24} /> :
                     n.type === 'ALERT' ? <AlertTriangle size={24} /> : 
                     n.type === 'INFO' ? <Info size={24} /> : <UserCheck size={24} />
                 )}
              </div>
              
              <div className="flex-1 min-w-0">
                 <div className="flex justify-between items-start">
                    <h4 className="font-bold text-gray-900 dark:text-white text-sm">{n.title}</h4>
                    <span className="text-[10px] text-gray-400">{n.time}</span>
                 </div>
                 <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 leading-snug font-medium">{n.message}</p>
                 
                 <div className="flex gap-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => muteForToday()} className="text-[10px] font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        Ne plus afficher ajd.
                    </button>
                 </div>
              </div>

              <button onClick={() => removeNotification(n.id)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">
                 <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};


// 'use client';

// import React, { createContext, useContext, useState, useEffect } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { Bell, X, UserCheck, MapPin, AlertTriangle, Info, GraduationCap } from 'lucide-react';
// import { io } from 'socket.io-client';

// type NotificationType = 'CHECK_IN' | 'ALERT' | 'INFO' | 'TRAINING';

// interface Notification {
//   id: string;
//   type: NotificationType;
//   title: string;
//   message: string;
//   avatar?: string;
//   time: string;
// }

// interface NotificationContextType {
//   addNotification: (notif: Omit<Notification, 'id' | 'time'>) => void;
// }

// const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// export function NotificationProvider({ children }: { children?: React.ReactNode }) {
//   const [notifications, setNotifications] = useState<Notification[]>([]);
//   const [mutedUntil, setMutedUntil] = useState<number | null>(null);

//   // --- WEBSOCKET CONNECTION ---
//   useEffect(() => {
//     const socket = io('http://localhost:3001', {
//         withCredentials: true,
//     });

//     // 1. Notifications Admin (RH)
//     socket.on('admin-notification', (data: any) => {
//         const storedUser = localStorage.getItem('user');
//         if (storedUser) {
//             const user = JSON.parse(storedUser);
//             if (['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'MANAGER'].includes(user.role)) {
//                 addNotification(data);
//             }
//         }
//     });

//     // 2. Notifications Globales (Employés) - NOUVEAU
//     socket.on('company-notification', (data: any) => {
//         // Tout le monde reçoit ça (ex: Nouvelle formation)
//         addNotification({
//             type: 'INFO', // ou TRAINING
//             title: data.title,
//             message: data.message
//         });
//     });

//     return () => {
//         socket.disconnect();
//     };
//   }, []);

//   useEffect(() => {
//     const muteTimestamp = localStorage.getItem('notifications_muted_until');
//     if (muteTimestamp) {
//         const ts = parseInt(muteTimestamp);
//         if (ts > Date.now()) {
//             setMutedUntil(ts);
//         } else {
//             localStorage.removeItem('notifications_muted_until');
//         }
//     }
//   }, []);

//   const addNotification = (notif: Omit<Notification, 'id' | 'time'>) => {
//     if (mutedUntil && mutedUntil > Date.now()) return;

//     const id = Math.random().toString(36).substr(2, 9);
//     const newNotif = { ...notif, id, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) };
    
//     setNotifications((prev) => [newNotif, ...prev].slice(0, 3)); 

//     setTimeout(() => {
//       removeNotification(id);
//     }, 10000); // 10 secondes d'affichage
//   };

//   const removeNotification = (id: string) => {
//     setNotifications((prev) => prev.filter((n) => n.id !== id));
//   };

//   const muteForToday = () => {
//     const tomorrow = new Date();
//     tomorrow.setHours(24, 0, 0, 0);
//     localStorage.setItem('notifications_muted_until', tomorrow.getTime().toString());
//     setMutedUntil(tomorrow.getTime());
//     setNotifications([]); 
//   };

//   return (
//     <NotificationContext.Provider value={{ addNotification }}>
//       {children}
      
//       <div className="fixed top-24 right-4 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none">
//         <AnimatePresence>
//           {notifications.map((n) => (
//             <motion.div
//               key={n.id}
//               initial={{ opacity: 0, x: 50, scale: 0.9 }}
//               animate={{ opacity: 1, x: 0, scale: 1 }}
//               exit={{ opacity: 0, x: 20, scale: 0.9 }}
//               layout
//               className="pointer-events-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/20 dark:border-gray-700 p-4 rounded-2xl shadow-2xl shadow-sky-500/10 flex gap-4 relative overflow-hidden group"
//             >
//               <motion.div 
//                 initial={{ width: '100%' }} 
//                 animate={{ width: 0 }} 
//                 transition={{ duration: 10, ease: 'linear' }}
//                 className={`absolute bottom-0 left-0 h-1 ${n.type === 'ALERT' ? 'bg-red-500' : 'bg-sky-500'}`}
//               />

//               <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${n.type === 'ALERT' ? 'bg-red-100 text-red-600' : 'bg-sky-100 text-sky-600'}`}>
//                  {n.avatar ? (
//                      <img src={n.avatar} className="w-full h-full rounded-full object-cover" />
//                  ) : (
//                      n.title.includes('Formation') ? <GraduationCap size={24} /> :
//                      n.type === 'ALERT' ? <AlertTriangle size={24} /> : 
//                      n.type === 'INFO' ? <Info size={24} /> : <UserCheck size={24} />
//                  )}
//               </div>
              
//               <div className="flex-1 min-w-0">
//                  <div className="flex justify-between items-start">
//                     <h4 className="font-bold text-gray-900 dark:text-white text-sm">{n.title}</h4>
//                     <span className="text-[10px] text-gray-400">{n.time}</span>
//                  </div>
//                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 leading-snug font-medium">{n.message}</p>
                 
//                  <div className="flex gap-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
//                     <button onClick={() => muteForToday()} className="text-[10px] font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
//                         Ne plus afficher ajd.
//                     </button>
//                  </div>
//               </div>

//               <button onClick={() => removeNotification(n.id)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">
//                  <X size={14} />
//               </button>
//             </motion.div>
//           ))}
//         </AnimatePresence>
//       </div>
//     </NotificationContext.Provider>
//   );
// }

// export const useNotification = () => {
//   const context = useContext(NotificationContext);
//   if (context === undefined) {
//     throw new Error('useNotification must be used within a NotificationProvider');
//   }
//   return context;
// };
