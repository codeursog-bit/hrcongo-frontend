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
  hasCompany: boolean | null;
  setHasCompany: (value: boolean) => void;
  recheckCompany: () => Promise<void>;
}

const CompanyReminderContext = createContext<CompanyReminderContextType>({
  hasCompany: null,
  setHasCompany: () => {},
  recheckCompany: async () => {},
});

export const useCompanyReminder = () => useContext(CompanyReminderContext);

// ============================================================================
// 🎨 MESSAGES
// ============================================================================

const MESSAGES = [
  { title: "Prêt à démarrer ?",      message: "Créez votre entreprise en 2 minutes pour débloquer toutes les fonctionnalités RH.", emoji: "🚀" },
  { title: "Une dernière étape !",    message: "Configurez votre structure pour commencer à gérer vos employés efficacement.",      emoji: "✨" },
  { title: "On y est presque !",      message: "Votre compte est prêt, il ne manque plus que votre entreprise.",                    emoji: "🎯" },
  { title: "Bienvenue sur HRCongo !", message: "Créez votre entreprise pour accéder au tableau de bord complet.",                   emoji: "👋" },
];

// ============================================================================
// ⏱️ DÉLAIS
// ============================================================================

const TIMING = {
  AFTER_PAGE_LOAD:   7000,   // 7s après chargement de page
  AFTER_MODAL_CLOSE: 120000, // 2min après fermeture du modal
};

// Pages où on n'affiche jamais le modal
const EXCLUDED_PATHS = [
  '/companies/create',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
];

// ============================================================================
// 🔑 HELPER : l'user est-il authentifié ?
// ============================================================================

const isUserAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem('accessToken');
  return !!token && token.length > 0;
};

// ============================================================================
// 🎬 MODAL
// ============================================================================

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCompany: () => void;
  messageIndex: number;
}

const ReminderModal: React.FC<ReminderModalProps> = ({ isOpen, onClose, onCreateCompany, messageIndex }) => {
  const message = MESSAGES[messageIndex % MESSAGES.length];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]"
          />
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-full max-w-md pointer-events-auto"
            >
              <div className="glass-panel rounded-3xl p-6 sm:p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl animate-aurora-1" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl animate-aurora-2" />

                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100/50 dark:bg-white/5 hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors z-10"
                >
                  <X size={18} className="text-slate-600 dark:text-slate-400" />
                </button>

                <div className="relative z-10">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
                    <Building2 size={32} className="text-white" />
                  </div>
                  <div className="text-center text-4xl mb-4">{message.emoji}</div>
                  <h3 className="text-xl sm:text-2xl font-bold text-center mb-3 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                    {message.title}
                  </h3>
                  <p className="text-center text-slate-600 dark:text-slate-400 mb-6 text-sm sm:text-base">
                    {message.message}
                  </p>
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
  const router   = useRouter();
  const pathname = usePathname();

  // null  = pas encore vérifié OU non authentifié
  // true  = a une entreprise  → JAMAIS de modal, vérification terminée
  // false = n'a pas d'entreprise → modal actif
  const [hasCompany, setHasCompany]         = useState<boolean | null>(null);
  const [showModal, setShowModal]           = useState(false);
  const [messageIndex, setMessageIndex]     = useState(0);
  const [modalWasClosed, setModalWasClosed] = useState(false);

  // '' pour que le premier pathname soit toujours détecté comme "nouveau"
  const lastPathnameRef      = useRef<string>('');
  // Garder trace du dernier pathname vérifié pour éviter les doubles vérifications
  const lastCheckedPathRef   = useRef<string>('');

  // ============================================================================
  // ✅ VÉRIFICATION PRINCIPALE
  // ============================================================================

  const checkCompany = async () => {
    // Pas de token → pas authentifié → on ne vérifie rien
    if (!isUserAuthenticated()) {
      console.log('🔒 [CompanyReminder] Pas de token, skip vérification');
      setHasCompany(null);
      return;
    }

    try {
      console.log('🔍 [CompanyReminder] Checking company...');
      const company = await api.get('/companies/mine');

      const result =
        company !== null &&
        company !== undefined &&
        typeof company === 'object' &&
        'id' in company &&
        !!company.id;

      console.log('🏢 [CompanyReminder] Result:', result ? '✅ HAS COMPANY' : '❌ NO COMPANY');
      setHasCompany(result);

      // Si entreprise trouvée → fermer le modal s'il était ouvert
      if (result) {
        setShowModal(false);
      }

    } catch (error: any) {
      console.log('⚠️ [CompanyReminder] Catch error:', error?.message);

      // ── Détecter le status HTTP depuis toutes les formes possibles ──
      // Axios : error.response.status
      // Fetch wrapper : error.status
      // Message string : "401", "Unauthorized"
      const status: number | undefined =
        error?.response?.status ??
        error?.status ??
        (() => {
          const msg = (error?.message ?? '').toLowerCase();
          if (msg.includes('401') || msg.includes('unauthorized')) return 401;
          if (msg.includes('403') || msg.includes('forbidden'))     return 403;
          if (msg.includes('404') || msg.includes('not found'))     return 404;
          return undefined;
        })();

      console.log('⚠️ [CompanyReminder] Status détecté:', status ?? 'inconnu');

      if (status === 401 || status === 403) {
        // Non authentifié → rester à null, ne pas afficher le modal
        console.log('🔒 [CompanyReminder] 401/403 → Non authentifié, skip modal');
        setHasCompany(null);
        return;
      }

      if (status === 404) {
        // Pas d'entreprise
        console.log('❌ [CompanyReminder] 404 → Pas d\'entreprise');
        setHasCompany(false);
        return;
      }

      // Réponse vide (ancien comportement avant fix back)
      if (
        error instanceof SyntaxError ||
        error?.message?.includes('Unexpected end of JSON') ||
        error?.message?.includes('Failed to execute')
      ) {
        console.log('❌ [CompanyReminder] Réponse vide → Pas d\'entreprise');
        setHasCompany(false);
        return;
      }

      // Autre erreur réseau → on ne sait pas, on ne spamme pas
      console.log('🌐 [CompanyReminder] Erreur réseau inconnue, skip modal');
      setHasCompany(null);
    }
  };

  // Exposé au contexte (utilisé par CreateCompanyPage après création)
  const recheckCompany = async () => {
    console.log('🔄 [CompanyReminder] Force recheck...');
    await checkCompany();
  };

  // ============================================================================
  // 🔍 VÉRIFICATION INITIALE AU MONTAGE
  // ============================================================================

  useEffect(() => {
    console.log('🚀 [CompanyReminder] Provider mounted');
    checkCompany();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ============================================================================
  // 🔄 RE-VÉRIFICATION QUAND ON ARRIVE SUR UNE PAGE AUTHENTIFIÉE
  // ─────────────────────────────────────────────────────────────
  // Cas typique : l'user était sur /auth/login (401 → hasCompany=null)
  // puis se connecte et arrive sur /dashboard
  // → on re-vérifie car maintenant le token existe
  // ============================================================================

  useEffect(() => {
    const isExcluded = EXCLUDED_PATHS.some(p => pathname.startsWith(p));

    if (
      !isExcluded &&                        // page normale (pas login/register...)
      isUserAuthenticated() &&              // token présent
      hasCompany === null &&                // pas encore de résultat valide
      lastCheckedPathRef.current !== pathname // éviter la double vérification
    ) {
      console.log('🔄 [CompanyReminder] Arrivée sur page authentifiée → re-vérification');
      lastCheckedPathRef.current = pathname;
      checkCompany();
    }
  }, [pathname, hasCompany]); // eslint-disable-line react-hooks/exhaustive-deps

  // ============================================================================
  // ⏱️ TIMERS — déclenchés uniquement si hasCompany === false
  // ============================================================================

  useEffect(() => {
    // Attendre résultat de la vérification
    if (hasCompany === null) {
      console.log('⏳ [CompanyReminder] Vérification en cours, attente...');
      return;
    }

    // ✅ Entreprise confirmée → STOP, jamais de modal
    if (hasCompany === true) {
      console.log('✅ [CompanyReminder] Has company, no reminder needed');
      return;
    }

    // Page exclue
    if (EXCLUDED_PATHS.some(p => pathname.startsWith(p))) {
      console.log('⏭️ [CompanyReminder] Excluded path:', pathname);
      return;
    }

    // Modal déjà ouvert
    if (showModal) {
      console.log('⏭️ [CompanyReminder] Modal already open, skipping timer');
      return;
    }

    const isNewPage = lastPathnameRef.current !== pathname;
    lastPathnameRef.current = pathname;

    if (isNewPage) {
      setModalWasClosed(false);
    }

    const delay  = (!isNewPage && modalWasClosed) ? TIMING.AFTER_MODAL_CLOSE : TIMING.AFTER_PAGE_LOAD;
    const reason = (!isNewPage && modalWasClosed)
      ? `2min après fermeture du modal`
      : isNewPage
        ? `7s après changement de page (${pathname})`
        : `7s après chargement initial`;

    console.log(`⏰ [CompanyReminder] Timer démarré: ${reason} (${delay / 1000}s)`);

    const timer = setTimeout(() => {
      console.log('🎬 [CompanyReminder] Timer expiré ! Affichage du modal...');
      setShowModal(true);
      setMessageIndex(prev => prev + 1);
    }, delay);

    return () => {
      console.log('🧹 [CompanyReminder] Timer annulé (cleanup)');
      clearTimeout(timer);
    };

  }, [pathname, hasCompany, showModal]); // eslint-disable-line react-hooks/exhaustive-deps

  // ============================================================================
  // 🎬 HANDLERS
  // ============================================================================

  const handleClose = () => {
    console.log('❌ [CompanyReminder] Modal fermé par l\'utilisateur');
    setShowModal(false);
    setModalWasClosed(true);
  };

  const handleCreateCompany = () => {
    console.log('✨ [CompanyReminder] Redirection vers création d\'entreprise...');
    setShowModal(false);
    router.push('/companies/create');
  };

  // ============================================================================
  // 🎨 RENDER
  // ============================================================================

  return (
    <CompanyReminderContext.Provider value={{ hasCompany, setHasCompany, recheckCompany }}>
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


