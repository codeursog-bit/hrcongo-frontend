// ============================================================================
// 📋 COMPOSANT - ACTIONS EN ATTENTE DE SYNC
// ============================================================================
// Fichier: components/pwa/PendingActions.tsx

'use client';

import { useEffect, useState } from 'react';
import { getPendingAttendances } from '@/lib/pwa/db';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { Clock, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

export function PendingActions() {
  const { pendingCount, isSyncing } = useSyncStatus();
  const [pendingItems, setPendingItems] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPendingItems();
    }
  }, [isOpen, pendingCount]);

  const loadPendingItems = async () => {
    const attendances = await getPendingAttendances();
    setPendingItems(attendances);
  };

  if (pendingCount === 0) {
    return null;
  }

  return (
    <>
      {/* Badge cliquable */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 right-4 z-40 bg-blue-600 text-white px-4 py-3 rounded-full shadow-lg hover:bg-blue-700 transition flex items-center gap-2"
      >
        <Clock className="h-5 w-5" />
        <span className="font-medium">{pendingCount}</span>
        {isSyncing && <RefreshCw className="h-4 w-4 animate-spin" />}
      </button>

      {/* Modal détails */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden shadow-2xl animate-slide-up">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">Actions en attente</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {pendingCount} action{pendingCount > 1 ? 's' : ''} sera{pendingCount > 1 ? 'ont' : ''} synchronisée{pendingCount > 1 ? 's' : ''} automatiquement
              </p>
            </div>

            {/* Liste */}
            <div className="overflow-y-auto max-h-96 p-4 space-y-3">
              {pendingItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Aucune action en attente</p>
                </div>
              ) : (
                pendingItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-sm">
                            {item.type === 'CHECK_IN' ? 'Pointage entrée' : 'Pointage sortie'}
                          </span>
                        </div>
                        
                        <p className="text-xs text-gray-500">
                          {new Date(item.timestamp).toLocaleString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>

                        {item.retryCount > 0 && (
                          <p className="text-xs text-orange-600 mt-1">
                            {item.retryCount} tentative{item.retryCount > 1 ? 's' : ''} échouée{item.retryCount > 1 ? 's' : ''}
                          </p>
                        )}

                        {item.error && (
                          <p className="text-xs text-red-600 mt-1">
                            {item.error}
                          </p>
                        )}
                      </div>

                      {isSyncing ? (
                        <RefreshCw className="h-5 w-5 text-blue-600 animate-spin flex-shrink-0" />
                      ) : (
                        <Clock className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {isSyncing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                    <span>Synchronisation en cours...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Synchronisation automatique activée</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}