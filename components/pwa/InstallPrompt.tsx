'use client';

// ============================================================================
// 📁 components/pwa/InstallPrompt.tsx — Bannière d'installation de l'application
// Page du PORTAIL / de l'app : on affiche le logo de l'application Konza RH.
// Couleurs = variables du thème de l'app (clair / sombre) : plus de bleu fixe.
// Logique inchangée : apparaît après 10 s, refus mémorisé 7 jours, iOS = étapes.
// ============================================================================

import { useEffect, useState } from 'react';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { Download, Plus, Share, X } from 'lucide-react';

const APP_ICON = '/icons/apple-touch-icon.png';

function AppIcon({ size = 48 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={APP_ICON}
      alt=""
      width={size}
      height={size}
      className="shrink-0 rounded-xl"
      style={{ width: size, height: size, boxShadow: '0 0 0 1px var(--border)' }}
    />
  );
}

const cardStyle: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  color: 'var(--text)',
};

const primaryBtn: React.CSSProperties = { background: 'var(--action)', color: '#fff' };

function Step({ n, title, children }: { n: number; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <span
        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
        style={{ background: 'var(--brand-soft)', color: 'var(--text)' }}
      >
        {n}
      </span>
      <div>
        <p className="font-medium">{title}</p>
        {children && <div className="mt-1 flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>{children}</div>}
      </div>
    </div>
  );
}

export function InstallPrompt() {
  const { canInstall, isIOS, promptInstall, dismissPrompt } = useInstallPrompt();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Déjà refusé : on ne redemande pas pendant 7 jours
    const dismissedUntil = localStorage.getItem('pwa-install-dismissed-until');
    if (dismissedUntil && new Date() < new Date(dismissedUntil)) {
      setIsDismissed(true);
      return;
    }

    // Afficher après 10 secondes
    const timer = setTimeout(() => {
      if (canInstall || isIOS) setShowPrompt(true);
    }, 10000);
    return () => clearTimeout(timer);
  }, [canInstall, isIOS]);

  const handleInstall = async () => {
    if (isIOS) return;
    const result = await promptInstall();
    if (result.outcome === 'accepted') setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setIsDismissed(true);
    const in7Days = new Date();
    in7Days.setDate(in7Days.getDate() + 7);
    localStorage.setItem('pwa-install-dismissed-until', in7Days.toISOString());
    dismissPrompt();
  };

  if (!showPrompt || isDismissed) return null;

  // ── iOS : on ne peut pas installer d'un clic, on explique les étapes ──
  if (isIOS) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
        <div role="dialog" aria-modal="true" aria-label="Installer Konza RH" className="animate-slide-up w-full max-w-md rounded-t-2xl p-6 shadow-2xl sm:rounded-2xl" style={cardStyle}>
          <div className="mb-5 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <AppIcon />
              <div>
                <h3 className="text-lg font-bold">Installer Konza RH</h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Accès rapide depuis votre écran d’accueil</p>
              </div>
            </div>
            <button type="button" onClick={handleDismiss} aria-label="Fermer" style={{ color: 'var(--text-secondary)' }}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <p className="mb-4 text-sm" style={{ color: 'var(--text-secondary)' }}>Pour installer l’application sur votre iPhone :</p>
          <div className="mb-6 space-y-4">
            <Step n={1} title="Appuyez sur le bouton Partager"><Share className="h-4 w-4" /><span>(en bas de Safari)</span></Step>
            <Step n={2} title="Choisissez « Sur l’écran d’accueil »"><Plus className="h-4 w-4" /><span>Ajouter à l’écran d’accueil</span></Step>
            <Step n={3} title="Appuyez sur « Ajouter »"><span>L’icône apparaîtra sur votre écran.</span></Step>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="w-full rounded-xl px-4 py-3 font-medium transition-opacity hover:opacity-80"
            style={{ background: 'var(--surface-2)', color: 'var(--text)' }}
          >
            Compris
          </button>
        </div>
      </div>
    );
  }

  // ── Android / ordinateur ──
  return (
    <div className="animate-slide-up fixed bottom-0 left-0 right-0 z-50 sm:bottom-4 sm:left-auto sm:right-4">
      <div role="dialog" aria-label="Installer Konza RH" className="w-full shadow-2xl sm:w-[420px] sm:max-w-[calc(100vw-2rem)] sm:rounded-2xl" style={cardStyle}>
        <div className="p-5">
          <div className="flex items-start gap-4">
            <AppIcon />
            <div className="min-w-0 flex-1">
              <h3 className="mb-1 text-lg font-bold">Installer Konza RH</h3>
              <p className="mb-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                Accédez à l’application depuis votre écran d’accueil, même avec une connexion instable.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={handleInstall}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-medium transition-opacity hover:opacity-90"
                  style={primaryBtn}
                >
                  <Download className="h-4 w-4" /> Installer
                </button>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="rounded-xl px-4 py-2.5 font-medium transition-opacity hover:opacity-70"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Plus tard
                </button>
              </div>
            </div>
            <button type="button" onClick={handleDismiss} aria-label="Fermer" className="shrink-0" style={{ color: 'var(--text-secondary)' }}>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Bouton d'installation dans les paramètres
export function InstallButton() {
  const { canInstall, isInstalled, promptInstall } = useInstallPrompt();

  if (isInstalled || !canInstall) return null;

  return (
    <button
      type="button"
      onClick={promptInstall}
      className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-medium transition-opacity hover:opacity-90"
      style={primaryBtn}
    >
      <Download className="h-5 w-5" /> Installer l’application
    </button>
  );
}