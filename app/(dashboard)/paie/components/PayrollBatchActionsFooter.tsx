import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, DollarSign, Ban, X, Printer } from 'lucide-react';
import { Button } from '@/components/design-system/primitives';

interface PayrollBatchActionsFooterProps {
  selectedCount: number;
  isLoading: boolean;
  onValidate: () => void;
  onPay: () => void;
  onCancel: () => void;
  onClear: () => void;
  onPrintAll?: () => void;
  isPrinting?: boolean;
}

export function PayrollBatchActionsFooter({
  selectedCount,
  isLoading,
  onValidate,
  onPay,
  onCancel,
  onClear,
  onPrintAll,
  isPrinting = false,
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
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 bg-[var(--surface)] rounded-2xl shadow-lg border border-[var(--border)]">
          
          {/* Gauche : Info sélection */}
          <div className="flex items-center gap-3">
            <div className="text-sm">
              <span className="font-semibold text-[var(--text)] text-lg">
                {selectedCount} bulletin{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}
              </span>
              <p className="text-[var(--text-muted)] text-xs">
                Choisissez une action à appliquer en masse
              </p>
            </div>
          </div>

          {/* Droite : Boutons */}
          <div className="flex items-center gap-4 w-full md:w-auto">
            {isLoading ? (
              <Button variant="secondary" loading className="flex-1 md:flex-none">
                Traitement...
              </Button>
            ) : (
              <>
                {onPrintAll && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={onPrintAll}
                    loading={isPrinting}
                    aria-label={isPrinting ? 'Préparation de l’impression' : 'Imprimer les bulletins sélectionnés'}
                    className="flex-1 md:flex-none"
                  >
                    {!isPrinting && <Printer size={18} aria-hidden="true" />}
                    <span className="hidden sm:inline">{isPrinting ? 'Préparation…' : 'Imprimer'}</span>
                  </Button>
                )}

                <Button
                  type="button"
                  variant="primary"
                  onClick={onValidate}
                  aria-label="Valider les bulletins sélectionnés"
                  className="flex-1 md:flex-none"
                >
                  <CheckCircle2 size={18} aria-hidden="true" />
                  <span className="hidden sm:inline">Valider</span>
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  onClick={onPay}
                  aria-label="Passer les bulletins sélectionnés à payer"
                  className="flex-1 md:flex-none"
                >
                  <DollarSign size={18} aria-hidden="true" />
                  <span className="hidden sm:inline">À payer</span>
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={onCancel}
                  aria-label="Annuler les bulletins sélectionnés"
                  className="flex-1 md:flex-none text-[var(--danger-text)]"
                >
                  <Ban size={18} aria-hidden="true" />
                  <span className="hidden sm:inline">Annuler</span>
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClear}
                  title="Désélectionner tout"
                  aria-label="Désélectionner tous les bulletins"
                  className="shrink-0"
                >
                  <X size={18} aria-hidden="true" />
                </Button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}