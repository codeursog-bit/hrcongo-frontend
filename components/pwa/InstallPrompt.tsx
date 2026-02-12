'use client';

import { useEffect, useState } from 'react';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { Download, X, Share, Plus } from 'lucide-react';

export function InstallPrompt() {
  const { canInstall, isIOS, promptInstall, dismissPrompt } = useInstallPrompt();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Vérifier si déjà refusé (pendant 7 jours)
    const dismissedUntil = localStorage.getItem('pwa-install-dismissed-until');
    
    if (dismissedUntil) {
      const until = new Date(dismissedUntil);
      if (new Date() < until) {
        setIsDismissed(true);
        return;
      }
    }

    // Afficher après 10 secondes
    const timer = setTimeout(() => {
      if (canInstall || isIOS) {
        setShowPrompt(true);
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [canInstall, isIOS]);

  const handleInstall = async () => {
    if (isIOS) {
      return;
    }

    const result = await promptInstall();
    if (result.outcome === 'accepted') {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setIsDismissed(true);
    
    // ✅ Cacher pendant 7 jours au lieu de définitivement
    const in7Days = new Date();
    in7Days.setDate(in7Days.getDate() + 7);
    localStorage.setItem('pwa-install-dismissed-until', in7Days.toISOString());
    
    dismissPrompt();
  };

  if (!showPrompt || isDismissed) {
    return null;
  }

  // Instructions iOS
  if (isIOS) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl max-w-md w-full p-6 shadow-2xl animate-slide-up">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
                <Download className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Installer KonzaRH</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Accès rapide depuis votre écran</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4 mb-6">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Pour installer l'application sur votre iPhone :
            </p>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-sm">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 dark:text-blue-400 font-bold text-xs">1</span>
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Appuyez sur le bouton Partager</p>
                  <div className="flex items-center gap-2 mt-1 text-slate-500 dark:text-slate-400">
                    <Share className="h-4 w-4" />
                    <span className="text-xs">(en bas de Safari)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 text-sm">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 dark:text-blue-400 font-bold text-xs">2</span>
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Sélectionnez "Sur l'écran d'accueil"</p>
                  <div className="flex items-center gap-2 mt-1 text-slate-500 dark:text-slate-400">
                    <Plus className="h-4 w-4" />
                    <span className="text-xs">Ajouter à l'écran d'accueil</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 text-sm">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 dark:text-blue-400 font-bold text-xs">3</span>
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Appuyez sur "Ajouter"</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">L'icône apparaîtra sur votre écran</p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg font-medium text-slate-700 dark:text-slate-200 transition"
          >
            Compris
          </button>
        </div>
      </div>
    );
  }

  // Prompt Android/Desktop
  return (
    <div className="fixed bottom-0 left-0 right-0 sm:bottom-4 sm:left-4 sm:right-auto z-50 animate-slide-up">
      <div className="bg-white dark:bg-slate-800 sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-md">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center flex-shrink-0">
              <Download className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1 text-slate-900 dark:text-white">Installer KonzaRH</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                Accédez rapidement depuis votre écran d'accueil, même sans internet
              </p>
              
              <div className="flex gap-2">
                <button
                  onClick={handleInstall}
                  className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                >
                  Installer
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-4 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium transition"
                >
                  Plus tard
                </button>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Bouton d'installation dans les settings
export function InstallButton() {
  const { canInstall, isInstalled, promptInstall } = useInstallPrompt();

  if (isInstalled || !canInstall) {
    return null;
  }

  return (
    <button
      onClick={promptInstall}
      className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
    >
      <Download className="h-5 w-5" />
      Installer l'application
    </button>
  );
}