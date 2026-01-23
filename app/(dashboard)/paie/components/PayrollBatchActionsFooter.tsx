import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, DollarSign, Ban, X } from 'lucide-react';

interface PayrollBatchActionsFooterProps {
  selectedCount: number;
  isLoading: boolean;
  onValidate: () => void;
  onPay: () => void;
  onCancel: () => void;
  onClear: () => void;
}

export function PayrollBatchActionsFooter({
  selectedCount,
  isLoading,
  onValidate,
  onPay,
  onCancel,
  onClear
}: PayrollBatchActionsFooterProps) {
  if (selectedCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        // ✅ CORRECTION : Positionnement relatif au contenu, pas à tout l'écran
        className="sticky bottom-6 z-50 mt-6"
      >
        {/* ✅ Le conteneur respecte maintenant la largeur du contenu principal */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
          
          {/* Gauche : Info sélection */}
          <div className="flex items-center gap-3">
            <div className="text-sm">
              <span className="font-bold text-gray-900 dark:text-white text-lg">
                {selectedCount} bulletin{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}
              </span>
              <p className="text-gray-500 dark:text-gray-400 text-xs">
                Choisissez une action à appliquer en masse
              </p>
            </div>
          </div>

          {/* Droite : Boutons */}
          <div className="flex items-center gap-4 w-full md:w-auto">
            {isLoading ? (
              <div className="flex-1 md:flex-none px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold rounded-xl flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                Traitement...
              </div>
            ) : (
              <>
                {/* ✅ Bouton Valider (vert) */}
                <button 
                  onClick={onValidate}
                  className="flex-1 md:flex-none px-6 py-3 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={18} />
                  <span className="hidden sm:inline">Valider</span>
                </button>

                {/* ✅ Bouton Payer (bleu) */}
                <button 
                  onClick={onPay}
                  className="flex-1 md:flex-none px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2"
                >
                  <DollarSign size={18} />
                  <span className="hidden sm:inline">Payer</span>
                </button>

                {/* ✅ Bouton Annuler (rouge) */}
                <button 
                  onClick={onCancel}
                  className="flex-1 md:flex-none px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2"
                >
                  <Ban size={18} />
                  <span className="hidden sm:inline">Annuler</span>
                </button>

                {/* Bouton Fermer */}
                <button 
                  onClick={onClear}
                  className="p-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl transition-colors"
                  title="Désélectionner tout"
                >
                  <X size={18} />
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}