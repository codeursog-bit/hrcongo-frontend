'use client';

import React from 'react';
import { ServerCrash, RotateCcw, AlertTriangle, LayoutDashboard } from 'lucide-react';
import { ErrorLayout } from '@/components/ui/ErrorLayout';

// ✅ CORRECTIF : après chaque déploiement, les noms de chunks JS changent.
// Un onglet resté ouvert (ou dont l'index.html a été chargé juste avant le
// déploiement) tente de charger un chunk qui n'existe plus côté serveur —
// message "Loading chunk N failed" / "ChunkLoadError", capturé ici par cette
// error boundary. Ce n'est jamais un vrai bug applicatif : un rechargement
// complet récupère le nouveau build et règle le problème. On le fait donc
// automatiquement, une seule fois par session, plutôt que de laisser la
// personne face à un écran d'erreur pour un souci qui n'en est pas un.
const CHUNK_ERROR_PATTERN = /loading chunk|chunkloaderror|failed to fetch dynamically imported module|importing a module script failed/i;
const CHUNK_RELOAD_FLAG = 'konza-chunk-error-reloaded';

function isChunkLoadError(error: Error): boolean {
  return CHUNK_ERROR_PATTERN.test(error.message || '') || error.name === 'ChunkLoadError';
}

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const errorId = error.digest || `ERR-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Math.floor(Math.random() * 1000)}`;
  const chunkError = isChunkLoadError(error);

  React.useEffect(() => {
    if (!chunkError) return;
    // Évite une boucle de rechargement infinie si le problème persiste
    // réellement (ex. déploiement en échec côté serveur) : on ne se
    // recharge automatiquement qu'une seule fois par session.
    if (sessionStorage.getItem(CHUNK_RELOAD_FLAG)) return;
    sessionStorage.setItem(CHUNK_RELOAD_FLAG, '1');
    window.location.reload();
  }, [chunkError]);

  // Le rechargement est lancé au montage : ce texte n'est visible qu'un
  // instant, ou si le rechargement automatique a déjà eu lieu une fois.
  if (chunkError) {
    return (
      <ErrorLayout
        code="500"
        title="Mise à jour en cours"
        description="Une nouvelle version de l'application est disponible. La page se recharge automatiquement…"
        icon={RotateCcw}
        gradient="from-blue-500 to-cyan-500"
      >
        <div className="w-full max-w-md space-y-6">
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl transition-all shadow-lg hover:scale-105"
            >
              <RotateCcw size={18} /> Recharger maintenant
            </button>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 dark:border-gray-700 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <LayoutDashboard size={18} /> Retour au Dashboard
            </button>
          </div>
          <p className="text-xs text-gray-400 text-center">
            <a href="/" className="underline hover:text-gray-600 dark:hover:text-gray-300">Retour à l'accueil</a>
          </p>
        </div>
      </ErrorLayout>
    );
  }

  return (
    <ErrorLayout
      code="500"
      title="Quelque chose s'est mal passé"
      description="Notre équipe technique a été notifiée. Ce n'est pas de votre faute ! Essayez de rafraîchir la page."
      icon={ServerCrash}
      gradient="from-red-500 to-orange-500"
    >
      <div className="w-full max-w-md space-y-6">
        
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 p-4 rounded-xl flex items-start gap-3 text-left">
          <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
          <div>
            <p className="text-sm font-bold text-red-700 dark:text-red-300">Détails techniques</p>
            <p className="text-xs text-red-600 dark:text-red-400 font-mono mt-1">ID: {errorId}</p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1 line-clamp-2">{error.message || "Erreur interne du serveur"}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={() => reset()}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl transition-all shadow-lg hover:scale-105"
          >
            <RotateCcw size={18} /> Réessayer
          </button>
          {/* ✅ CORRECTIF : renvoyait vers "/" (page publique), pas le tableau
              de bord de l'app — pour un utilisateur déjà connecté, ce bouton
              doit le ramener dans l'application, pas sur la vitrine. */}
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 dark:border-gray-700 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <LayoutDashboard size={18} /> Retour au Dashboard
          </button>
        </div>

        <p className="text-xs text-gray-400">
          Si le problème persiste, contactez le support en mentionnant l'ID d'erreur ci-dessus.
        </p>
        <p className="text-xs text-gray-400">
          <a href="/" className="underline hover:text-gray-600 dark:hover:text-gray-300">Retour à l'accueil</a>
        </p>
      </div>
    </ErrorLayout>
  );
}