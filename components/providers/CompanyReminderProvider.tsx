'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, X, Sparkles, ArrowRight } from 'lucide-react';
import { api } from '@/services/api';

// ============================================================================
// 🎯 CONTEXT
// ============================================================================

interface CompanyReminderContextType {
  hasCompany: boolean;
  checkCompany: () => Promise<boolean>;
}

const CompanyReminderContext = createContext<CompanyReminderContextType>({
  hasCompany: true,
  checkCompany: async () => true,
});

export const useCompanyReminder = () => useContext(CompanyReminderContext);

// ============================================================================
// 🎨 MESSAGES CHALEUREUX
// ============================================================================

const MESSAGES = [
  {
    title: "Prêt à démarrer ?",
    message: "Créez votre entreprise en 2 minutes pour débloquer toutes les fonctionnalités RH.",
    emoji: "🚀"
  },
  {
    title: "Une dernière étape !",
    message: "Configurez votre structure pour commencer à gérer vos employés efficacement.",
    emoji: "✨"
  },
  {
    title: "On y est presque !",
    message: "Votre compte est prêt, il ne manque plus que votre entreprise.",
    emoji: "🎯"
  },
  {
    title: "Bienvenue sur HRCongo !",
    message: "Créez votre entreprise pour accéder au tableau de bord complet.",
    emoji: "👋"
  }
];

// ============================================================================
// ⏱️ CONFIGURATION DES DÉLAIS
// ============================================================================

const TIMING = {
  AFTER_PAGE_LOAD: 10000,     // 7 secondes après le chargement de la page
  AFTER_MODAL_CLOSE: 120000, // 2 minutes après la fermeture du modal
};

// ============================================================================
// 🎬 MODAL COMPOSANT
// ============================================================================

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCompany: () => void;
  messageIndex: number;
}

const ReminderModal: React.FC<ReminderModalProps> = ({ 
  isOpen, 
  onClose, 
  onCreateCompany,
  messageIndex 
}) => {
  const message = MESSAGES[messageIndex % MESSAGES.length];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]"
          />

          {/* Modal Container - Perfectly Centered */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-full max-w-md pointer-events-auto"
            >
            <div className="glass-panel rounded-3xl p-6 sm:p-8 relative overflow-hidden">
              
              {/* Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none" />
              
              {/* Animated Circles */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl animate-aurora-1" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl animate-aurora-2" />

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100/50 dark:bg-white/5 hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors z-10"
              >
                <X size={18} className="text-slate-600 dark:text-slate-400" />
              </button>

              {/* Content */}
              <div className="relative z-10">
                {/* Icon */}
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
                  <Building2 size={32} className="text-white" />
                </div>

                {/* Emoji */}
                <div className="text-center text-4xl mb-4">{message.emoji}</div>

                {/* Title */}
                <h3 className="text-xl sm:text-2xl font-bold text-center mb-3 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  {message.title}
                </h3>

                {/* Message */}
                <p className="text-center text-slate-600 dark:text-slate-400 mb-6 text-sm sm:text-base">
                  {message.message}
                </p>

                {/* Actions */}
                <div className="space-y-3">
                  <button
                    onClick={onCreateCompany}
                    className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    <Sparkles size={18} />
                    Créer mon entreprise
                    <ArrowRight size={18} />
                  </button>

                  <button
                    onClick={onClose}
                    className="w-full py-3 px-4 bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 border border-white/40 dark:border-white/10 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-all text-sm"
                  >
                    Plus tard
                  </button>
                </div>

                {/* Footnote */}
                <p className="text-xs text-center text-slate-500 dark:text-slate-500 mt-4">
                  Vous pourrez toujours créer votre entreprise depuis le menu
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </>
    )}
  </AnimatePresence>
);
};

// ============================================================================
// 🔄 PROVIDER
// ============================================================================

export const CompanyReminderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  
  const [hasCompany, setHasCompany] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const [modalWasClosed, setModalWasClosed] = useState(false);
  const lastPathnameRef = useRef(pathname);

  // ============================================================================
  // ✅ VÉRIFIER SI L'UTILISATEUR A UNE ENTREPRISE
  // ============================================================================
  
  const checkCompany = async (): Promise<boolean> => {
    try {
      console.log('🔍 [CompanyReminder] Checking company...');
      const company = await api.get('/companies/mine');
      
      const hasCompanyResult = company !== null && company !== undefined;
      
      console.log('🏢 [CompanyReminder] Result:', hasCompanyResult ? '✅ HAS COMPANY' : '❌ NO COMPANY');
      
      setHasCompany(hasCompanyResult);
      
      // 🆕 Si l'entreprise existe maintenant, fermer le modal
      if (hasCompanyResult && showModal) {
        console.log('✅ [CompanyReminder] Company created! Closing modal...');
        setShowModal(false);
      }
      
      return hasCompanyResult;
    } catch (error: any) {
      console.log('⚠️ [CompanyReminder] API Error:', error?.response?.status, error?.message);
      setHasCompany(false);
      return false;
    }
  };

  // ============================================================================
  // 🔍 VÉRIFICATION INITIALE
  // ============================================================================

  useEffect(() => {
    console.log('🚀 [CompanyReminder] Provider mounted');
    checkCompany();
  }, []);

  // ============================================================================
  // 🔄 RE-VÉRIFICATION QUAND ON REVIENT DE /companies/create
  // ============================================================================

  useEffect(() => {
    const previousPath = lastPathnameRef.current;
    
    // Si on vient de quitter la page de création d'entreprise, re-vérifier
    if (previousPath === '/companies/create' && pathname !== '/companies/create') {
      console.log('🔄 [CompanyReminder] Returned from company creation, re-checking...');
      checkCompany();
    }
    
    // Mettre à jour la référence
    lastPathnameRef.current = pathname;
  }, [pathname]);

  // ============================================================================
  // ⏱️ LOGIQUE DES TIMERS
  // ============================================================================

  useEffect(() => {
    // Ignorer si l'utilisateur a déjà une entreprise
    if (hasCompany) {
      console.log('✅ [CompanyReminder] Has company, no reminder needed');
      return;
    }

    // Ignorer sur certaines pages
    const excludedPaths = ['/companies/create', '/auth/login', '/auth/register', '/auth/forgot-password'];
    if (excludedPaths.some(path => pathname.startsWith(path))) {
      console.log('⏭️ [CompanyReminder] Excluded path:', pathname);
      return;
    }

    // Ne pas afficher si le modal est déjà ouvert
    if (showModal) {
      console.log('⏭️ [CompanyReminder] Modal already open, skipping timer');
      return;
    }

    // Déterminer le délai
    let delay: number;
    let reason: string;

    // Si le pathname a changé, c'est un nouveau chargement de page
    if (lastPathnameRef.current !== pathname) {
      delay = TIMING.AFTER_PAGE_LOAD;
      reason = '7s after page load';
      setModalWasClosed(false); // Reset le flag quand on change de page
    } 
    // Si le modal a été fermé, on attend 2 minutes
    else if (modalWasClosed) {
      delay = TIMING.AFTER_MODAL_CLOSE;
      reason = '2min after modal close';
    } 
    // Sinon, premier affichage sur cette page
    else {
      delay = TIMING.AFTER_PAGE_LOAD;
      reason = '7s after initial load';
    }

    console.log(`⏰ [CompanyReminder] Timer started: ${reason} (${delay / 1000}s)`);

    const timer = setTimeout(() => {
      console.log('🎬 [CompanyReminder] Timer expired! Showing modal...');
      setShowModal(true);
      setMessageIndex((prev) => prev + 1);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [pathname, hasCompany, showModal, modalWasClosed]);

  // ============================================================================
  // 🎬 HANDLERS
  // ============================================================================

  const handleClose = () => {
    console.log('❌ [CompanyReminder] Modal closed by user');
    setShowModal(false);
    setModalWasClosed(true); // Marquer que le modal a été fermé
    // Le prochain timer sera de 2 minutes
  };

  const handleCreateCompany = () => {
    console.log('✨ [CompanyReminder] Redirecting to company creation...');
    setShowModal(false);
    router.push('/companies/create');
  };

  // ============================================================================
  // 🎨 RENDER
  // ============================================================================

  return (
    <CompanyReminderContext.Provider value={{ hasCompany, checkCompany }}>
      {children}
      <ReminderModal
        isOpen={showModal}
        onClose={handleClose}
        onCreateCompany={handleCreateCompany}
        messageIndex={messageIndex}
      />
    </CompanyReminderContext.Provider>
  );
};
// 'use client';

// import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
// import { usePathname, useRouter } from 'next/navigation';
// import { motion, AnimatePresence } from 'framer-motion';
// import { Building2, X, Sparkles, ArrowRight } from 'lucide-react';
// import { api } from '@/services/api';

// // ============================================================================
// // 🎯 CONTEXT
// // ============================================================================

// interface CompanyReminderContextType {
//   hasCompany: boolean;
//   checkCompany: () => Promise<boolean>;
// }

// const CompanyReminderContext = createContext<CompanyReminderContextType>({
//   hasCompany: true,
//   checkCompany: async () => true,
// });

// export const useCompanyReminder = () => useContext(CompanyReminderContext);

// // ============================================================================
// // 🎨 MESSAGES CHALEUREUX
// // ============================================================================

// const MESSAGES = [
//   {
//     title: "Prêt à démarrer ?",
//     message: "Créez votre entreprise en 2 minutes pour débloquer toutes les fonctionnalités RH.",
//     emoji: "🚀"
//   },
//   {
//     title: "Une dernière étape !",
//     message: "Configurez votre structure pour commencer à gérer vos employés efficacement.",
//     emoji: "✨"
//   },
//   {
//     title: "On y est presque !",
//     message: "Votre compte est prêt, il ne manque plus que votre entreprise.",
//     emoji: "🎯"
//   },
//   {
//     title: "Bienvenue sur HRCongo !",
//     message: "Créez votre entreprise pour accéder au tableau de bord complet.",
//     emoji: "👋"
//   }
// ];

// // ============================================================================
// // ⏱️ CONFIGURATION DES DÉLAIS
// // ============================================================================

// const TIMING = {
//   AFTER_PAGE_LOAD: 7000,     // 7 secondes après le chargement de la page
//   AFTER_MODAL_CLOSE: 120000, // 2 minutes après la fermeture du modal
// };

// // ============================================================================
// // 🎬 MODAL COMPOSANT
// // ============================================================================

// interface ReminderModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onCreateCompany: () => void;
//   messageIndex: number;
// }

// const ReminderModal: React.FC<ReminderModalProps> = ({ 
//   isOpen, 
//   onClose, 
//   onCreateCompany,
//   messageIndex 
// }) => {
//   const message = MESSAGES[messageIndex % MESSAGES.length];

//   return (
//     <AnimatePresence>
//       {isOpen && (
//         <>
//           {/* Backdrop */}
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             onClick={onClose}
//             className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]"
//           />

//           {/* Modal Container - Perfectly Centered */}
//           <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
//             <motion.div
//               initial={{ opacity: 0, scale: 0.9, y: 20 }}
//               animate={{ opacity: 1, scale: 1, y: 0 }}
//               exit={{ opacity: 0, scale: 0.9, y: 20 }}
//               transition={{ type: 'spring', stiffness: 300, damping: 30 }}
//               className="w-full max-w-md pointer-events-auto"
//             >
//             <div className="glass-panel rounded-3xl p-6 sm:p-8 relative overflow-hidden">
              
//               {/* Gradient Background */}
//               <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none" />
              
//               {/* Animated Circles */}
//               <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl animate-aurora-1" />
//               <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl animate-aurora-2" />

//               {/* Close Button */}
//               <button
//                 onClick={onClose}
//                 className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100/50 dark:bg-white/5 hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors z-10"
//               >
//                 <X size={18} className="text-slate-600 dark:text-slate-400" />
//               </button>

//               {/* Content */}
//               <div className="relative z-10">
//                 {/* Icon */}
//                 <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
//                   <Building2 size={32} className="text-white" />
//                 </div>

//                 {/* Emoji */}
//                 <div className="text-center text-4xl mb-4">{message.emoji}</div>

//                 {/* Title */}
//                 <h3 className="text-xl sm:text-2xl font-bold text-center mb-3 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
//                   {message.title}
//                 </h3>

//                 {/* Message */}
//                 <p className="text-center text-slate-600 dark:text-slate-400 mb-6 text-sm sm:text-base">
//                   {message.message}
//                 </p>

//                 {/* Actions */}
//                 <div className="space-y-3">
//                   <button
//                     onClick={onCreateCompany}
//                     className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 text-sm sm:text-base"
//                   >
//                     <Sparkles size={18} />
//                     Créer mon entreprise
//                     <ArrowRight size={18} />
//                   </button>

//                   <button
//                     onClick={onClose}
//                     className="w-full py-3 px-4 bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 border border-white/40 dark:border-white/10 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-all text-sm"
//                   >
//                     Plus tard
//                   </button>
//                 </div>

//              {/* Footnote */}
//                 <p className="text-xs text-center text-slate-500 dark:text-slate-500 mt-4">
//                   Vous pourrez toujours créer votre entreprise depuis le menu
//                 </p>
//               </div> {/* Ferme le div "relative z-10" */}
//             </div> {/* Ferme le div "glass-panel" */}
//           </motion.div>
//         </div> {/* Ferme le div "fixed inset-0" */}
//       </>
//     )}
//   </AnimatePresence>
// );
// };

// // ============================================================================
// // 🔄 PROVIDER
// // ============================================================================

// export const CompanyReminderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const router = useRouter();
//   const pathname = usePathname();
  
//   const [hasCompany, setHasCompany] = useState(true);
//   const [showModal, setShowModal] = useState(false);
//   const [messageIndex, setMessageIndex] = useState(0);
//   const [modalWasClosed, setModalWasClosed] = useState(false);
//   const lastPathnameRef = useRef(pathname);

//   // ============================================================================
//   // ✅ VÉRIFIER SI L'UTILISATEUR A UNE ENTREPRISE
//   // ============================================================================
  
//   const checkCompany = async (): Promise<boolean> => {
//     try {
//       console.log('🔍 [CompanyReminder] Checking company...');
//       const company = await api.get('/companies/mine');
      
//       const hasCompanyResult = company !== null && company !== undefined;
      
//       console.log('🏢 [CompanyReminder] Result:', hasCompanyResult ? '✅ HAS COMPANY' : '❌ NO COMPANY');
      
//       setHasCompany(hasCompanyResult);
//       return hasCompanyResult;
//     } catch (error: any) {
//       console.log('⚠️ [CompanyReminder] API Error:', error?.response?.status, error?.message);
//       setHasCompany(false);
//       return false;
//     }
//   };

//   // ============================================================================
//   // 🔍 VÉRIFICATION INITIALE
//   // ============================================================================

//   useEffect(() => {
//     console.log('🚀 [CompanyReminder] Provider mounted');
//     checkCompany();
//   }, []);

//   // ============================================================================
//   // ⏱️ LOGIQUE DES TIMERS
//   // ============================================================================

//   useEffect(() => {
//     // Ignorer si l'utilisateur a déjà une entreprise
//     if (hasCompany) {
//       console.log('✅ [CompanyReminder] Has company, no reminder needed');
//       return;
//     }

//     // Ignorer sur certaines pages
//     const excludedPaths = ['/companies/create', '/auth/login', '/auth/register', '/auth/forgot-password'];
//     if (excludedPaths.some(path => pathname.startsWith(path))) {
//       console.log('⏭️ [CompanyReminder] Excluded path:', pathname);
//       return;
//     }

//     // Ne pas afficher si le modal est déjà ouvert
//     if (showModal) {
//       console.log('⏭️ [CompanyReminder] Modal already open, skipping timer');
//       return;
//     }

//     // Déterminer le délai
//     let delay: number;
//     let reason: string;

//     // Si le pathname a changé, c'est un nouveau chargement de page
//     if (lastPathnameRef.current !== pathname) {
//       delay = TIMING.AFTER_PAGE_LOAD;
//       reason = '7s after page load';
//       lastPathnameRef.current = pathname;
//       setModalWasClosed(false); // Reset le flag quand on change de page
//     } 
//     // Si le modal a été fermé, on attend 2 minutes
//     else if (modalWasClosed) {
//       delay = TIMING.AFTER_MODAL_CLOSE;
//       reason = '2min after modal close';
//     } 
//     // Sinon, premier affichage sur cette page
//     else {
//       delay = TIMING.AFTER_PAGE_LOAD;
//       reason = '7s after initial load';
//     }

//     console.log(`⏰ [CompanyReminder] Timer started: ${reason} (${delay / 1000}s)`);

//     const timer = setTimeout(() => {
//       console.log('🎬 [CompanyReminder] Timer expired! Showing modal...');
//       setShowModal(true);
//       setMessageIndex((prev) => prev + 1);
//     }, delay);

//     return () => {
//       clearTimeout(timer);
//     };
//   }, [pathname, hasCompany, showModal, modalWasClosed]);

//   // ============================================================================
//   // 🎬 HANDLERS
//   // ============================================================================

//   const handleClose = () => {
//     console.log('❌ [CompanyReminder] Modal closed by user');
//     setShowModal(false);
//     setModalWasClosed(true); // Marquer que le modal a été fermé
//     // Le prochain timer sera de 2 minutes
//   };

//   const handleCreateCompany = () => {
//     console.log('✨ [CompanyReminder] Redirecting to company creation...');
//     setShowModal(false);
//     router.push('/companies/create');
//   };

//   // ============================================================================
//   // 🎨 RENDER
//   // ============================================================================

//   return (
//     <CompanyReminderContext.Provider value={{ hasCompany, checkCompany }}>
//       {children}
//       <ReminderModal
//         isOpen={showModal}
//         onClose={handleClose}
//         onCreateCompany={handleCreateCompany}
//         messageIndex={messageIndex}
//       />
//     </CompanyReminderContext.Provider>
//   );
// };