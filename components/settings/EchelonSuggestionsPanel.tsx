'use client';

// ============================================================================
// 📁 src/components/settings/EchelonSuggestionsPanel.tsx
//
// Affiché uniquement quand companyData.echelonReminderEnabled === true
// (rendu conditionnel dans parametres/entreprise/page.tsx). Consomme les
// endpoints backend du module echelon-suggestions :
//   GET  /echelon-suggestions
//   POST /echelon-suggestions/:id/accept
//   POST /echelon-suggestions/:id/reject
//   POST /echelon-suggestions/accept-all
//
// Décision produit : jamais d'automatisation silencieuse — chaque validation
// individuelle passe par une confirmation ("Êtes-vous sûr ?"), et "Tout
// valider" affiche un récapitulatif de ce qui a changé après coup.
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, XCircle, Loader2, TrendingUp, ListChecks } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';
import { useAlert } from '@/components/providers/AlertProvider';

interface EchelonSuggestion {
  id: string;
  employeeId: string;
  employeeName: string;
  currentEchelonLabel: string;
  suggestedEchelonLabel: string;
  yearsCompleted: number;
  scheduledNotifyDate: string;
}

interface BulkAcceptResultItem {
  employeeId: string;
  employeeName: string;
  oldEchelonLabel: string;
  newEchelonLabel: string;
}

export function EchelonSuggestionsPanel() {
  const alert = useAlert();
  const [suggestions, setSuggestions] = useState<EchelonSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [recap, setRecap] = useState<BulkAcceptResultItem[] | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<EchelonSuggestion[]>('/echelon-suggestions');
      setSuggestions(data ?? []);
    } catch {
      // silencieux — pas bloquant pour le reste de la page paramètres
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAccept = async (id: string) => {
    setBusyId(id);
    try {
      await api.post(`/echelon-suggestions/${id}/accept`, {});
      setSuggestions(list => list.filter(s => s.id !== id));
      alert.success('Échelon mis à jour', '');
    } catch (e: any) {
      alert.error('Erreur', e.message || "Impossible de valider ce changement d'échelon.");
    } finally {
      setBusyId(null);
      setConfirmId(null);
    }
  };

  const handleReject = async (id: string) => {
    setBusyId(id);
    try {
      await api.post(`/echelon-suggestions/${id}/reject`, {});
      setSuggestions(list => list.filter(s => s.id !== id));
    } catch (e: any) {
      alert.error('Erreur', e.message || 'Impossible de refuser cette suggestion.');
    } finally {
      setBusyId(null);
    }
  };

  const handleAcceptAll = async () => {
    setBulkBusy(true);
    try {
      const result = await api.post<BulkAcceptResultItem[]>('/echelon-suggestions/accept-all', {});
      setSuggestions([]);
      setRecap(result ?? []);
    } catch (e: any) {
      alert.error('Erreur', e.message || 'Impossible de tout valider.');
    } finally {
      setBulkBusy(false);
      setConfirmBulk(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
        <Loader2 size={16} className="animate-spin" /> Chargement des suggestions…
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <p className="text-xs text-gray-400 py-2">
        Aucune suggestion de changement d'échelon en attente pour le moment.
      </p>
    );
  }

  return (
    <div className="border-t border-purple-100 dark:border-purple-800 pt-5">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <TrendingUp size={16} className="text-purple-500" />
          {suggestions.length} suggestion{suggestions.length > 1 ? 's' : ''} en attente
        </h4>
        <button
          type="button"
          onClick={() => setConfirmBulk(true)}
          disabled={bulkBusy}
          className="flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-700 disabled:opacity-50"
        >
          <ListChecks size={14} /> Tout valider
        </button>
      </div>

      <div className="space-y-2">
        {suggestions.map(s => (
          <div key={s.id}
            className="flex items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-700/40 rounded-lg text-sm">
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white truncate">{s.employeeName}</p>
              <p className="text-xs text-gray-500">
                {s.yearsCompleted} ans d'ancienneté — {s.currentEchelonLabel} → <span className="font-semibold text-purple-600">{s.suggestedEchelonLabel}</span>
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button type="button" onClick={() => handleReject(s.id)} disabled={busyId === s.id}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-50"
                title="Refuser — l'échelon actuel est conservé">
                <XCircle size={18} />
              </button>
              <button type="button" onClick={() => setConfirmId(s.id)} disabled={busyId === s.id}
                className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 disabled:opacity-50"
                title="Valider ce changement d'échelon">
                {busyId === s.id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Confirmation individuelle */}
      <AnimatePresence>
        {confirmId && (
          <ConfirmDialog
            title="Confirmer le changement d'échelon"
            message="Êtes-vous sûr ? L'échelon de cet employé sera mis à jour."
            onCancel={() => setConfirmId(null)}
            onConfirm={() => handleAccept(confirmId)}
          />
        )}
      </AnimatePresence>

      {/* Confirmation en masse */}
      <AnimatePresence>
        {confirmBulk && (
          <ConfirmDialog
            title="Tout valider"
            message={`Êtes-vous sûr ? Les ${suggestions.length} suggestions en attente seront appliquées d'un coup.`}
            onCancel={() => setConfirmBulk(false)}
            onConfirm={handleAcceptAll}
          />
        )}
      </AnimatePresence>

      {/* Récapitulatif après "Tout valider" */}
      <AnimatePresence>
        {recap && (
          <RecapModal items={recap} onClose={() => setRecap(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sous-composants ────────────────────────────────────────────────────────

function ConfirmDialog({ title, message, onCancel, onConfirm }: {
  title: string; message: string; onCancel: () => void; onConfirm: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4"
      onClick={onCancel}>
      <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-xl">
        <h4 className="font-bold text-gray-900 dark:text-white mb-2">{title}</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{message}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg">
            Annuler
          </button>
          <button onClick={onConfirm}
            className="px-4 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg">
            Confirmer
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function RecapModal({ items, onClose }: { items: BulkAcceptResultItem[]; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-xl max-h-[80vh] overflow-y-auto">
        <h4 className="font-bold text-gray-900 dark:text-white mb-1">
          {items.length} employé{items.length > 1 ? 's' : ''} mis à jour
        </h4>
        <p className="text-xs text-gray-500 mb-4">Récapitulatif des changements d'échelon appliqués.</p>
        <div className="space-y-1.5 mb-5">
          {items.map(it => (
            <div key={it.employeeId} className="text-sm flex justify-between gap-2 py-1 border-b border-gray-100 dark:border-gray-700 last:border-0">
              <span className="text-gray-700 dark:text-gray-200 truncate">{it.employeeName}</span>
              <span className="text-gray-400 shrink-0">{it.oldEchelonLabel} → <span className="font-semibold text-purple-600">{it.newEchelonLabel}</span></span>
            </div>
          ))}
        </div>
        <button onClick={onClose}
          className="w-full px-4 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg">
          Fermer
        </button>
      </motion.div>
    </motion.div>
  );
}