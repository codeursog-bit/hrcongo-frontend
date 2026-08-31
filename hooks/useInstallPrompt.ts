// ============================================================================
// 📱 HOOK - PROMPT D'INSTALLATION PWA
// ============================================================================
// Fichier: hooks/useInstallPrompt.ts

'use client';

import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function useInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    // Détecter iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(iosDevice);

    // Vérifier si déjà installé
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      // @ts-ignore
      window.navigator.standalone === true;
    
    setIsInstalled(isStandalone);

    // Écouter l'événement beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    // Écouter l'événement appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Fonction pour déclencher l'installation
  const promptInstall = useCallback(async () => {
    if (!installPrompt) {
      return { outcome: 'unavailable' as const };
    }

    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      
      if (choice.outcome === 'accepted') {
        setCanInstall(false);
        setInstallPrompt(null);
      }

      return choice;
    } catch (error) {
      console.error('Error prompting install:', error);
      return { outcome: 'error' as const };
    }
  }, [installPrompt]);

  // Fonction pour cacher le prompt
  const dismissPrompt = useCallback(() => {
    setCanInstall(false);
  }, []);

  return {
    canInstall,
    isInstalled,
    isIOS,
    promptInstall,
    dismissPrompt,
  };
}