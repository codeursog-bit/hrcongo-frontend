// ===========================
// FILE: SelectionStep.tsx
// ✅ Affiche l'estimation venant du back (via isLoadingEstimation prop)
// ===========================
import React from 'react';
import { motion } from 'framer-motion';
import { Check, Wallet, Loader2, RotateCcw } from 'lucide-react';

interface SelectionStepProps {
  employees: any[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  workDays: number;                       // jours théoriques du mois (borne max)
  autoDays: Record<string, number>;       // jours calculés depuis les présences
  daysInput: Record<string, string>;      // jours saisis à la main
  onDaysChange: (id: string, value: string) => void;
  onDaysReset: (id: string) => void;
  estimation: {
    count: number;
    gross: number;
    net: number;
    cost: number;
  };
  isLoadingEstimation?: boolean; // ✅ Nouveau prop
}

export default function SelectionStep({
  employees, selectedIds, onSelectionChange,
  workDays, autoDays, daysInput, onDaysChange, onDaysReset,
  estimation, isLoadingEstimation,
}: SelectionStepProps) {
  const fmt = (val: number) => (val || 0).toLocaleString('fr-FR');

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full flex flex-col"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-0">

        {/* Liste employés */}
        <div className="lg:col-span-2 flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-[var(--text)]">
              Employés ({selectedIds.length}/{employees.length})
            </h3>
            <button
              onClick={() => onSelectionChange(
                selectedIds.length === employees.length ? [] : employees.map(e => e.id)
              )}
              className="text-sm font-bold text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 px-3 py-1 rounded-lg"
            >
              {selectedIds.length === employees.length ? 'Tout désélectionner' : 'Tout sélectionner'}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto border border-[var(--border)] rounded-2xl bg-[var(--surface-2)]/50 p-2 space-y-1 max-h-[400px]">
            {employees.map(emp => (
              <div
                key={emp.id}
                onClick={() => onSelectionChange(
                  selectedIds.includes(emp.id)
                    ? selectedIds.filter(id => id !== emp.id)
                    : [...selectedIds, emp.id]
                )}
                className={`p-3 rounded-xl flex items-center justify-between cursor-pointer border transition-all ${
                  selectedIds.includes(emp.id)
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                    : 'bg-[var(--surface)] border-transparent hover:border-[var(--border)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    selectedIds.includes(emp.id) ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'
                  }`}>
                    {selectedIds.includes(emp.id) && <Check size={12} className="text-white" />}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[var(--text)]">
                      {emp.firstName} {emp.lastName}
                    </p>
                    {emp.position && <p className="text-xs text-gray-400">{emp.position}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {selectedIds.includes(emp.id) && (() => {
                    const auto = autoDays[emp.id];
                    const edited = daysInput[emp.id] !== undefined;
                    const shown = edited ? daysInput[emp.id] : (auto !== undefined ? String(auto) : '');
                    return (
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        {edited && (
                          <button
                            type="button"
                            title={auto !== undefined ? `Revenir à ${auto} j (présences)` : 'Réinitialiser'}
                            onClick={() => onDaysReset(emp.id)}
                            className="p-1 text-amber-500 hover:text-amber-600"
                          >
                            <RotateCcw size={12} />
                          </button>
                        )}
                        <input
                          type="number"
                          inputMode="decimal"
                          min={0}
                          max={workDays}
                          step={0.5}
                          value={shown}
                          placeholder="…"
                          onChange={e => {
                            const v = e.target.value;
                            const n = Number(v);
                            // borne haute : jamais plus que les jours théoriques
                            onDaysChange(emp.id, v !== '' && n > workDays ? String(workDays) : (n < 0 ? '0' : v));
                          }}
                          className={`w-16 px-2 py-1 text-right font-mono text-xs font-bold rounded-lg border bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                            edited ? 'border-amber-400' : 'border-[var(--border)]'
                          }`}
                        />
                        <span className="text-xs text-gray-400">j</span>
                      </div>
                    );
                  })()}
                  <span className="font-mono text-xs font-bold text-gray-600">
                    {Number(emp.baseSalary || 0).toLocaleString()} F
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Estimation — données du back */}
        <div className="lg:col-span-1">
          <div className="bg-gray-900 dark:bg-black rounded-3xl p-6 text-white shadow-xl sticky top-0">
            <div className="flex items-center gap-2 mb-6 opacity-80">
              <Wallet size={20} />
              <span className="text-sm font-bold uppercase tracking-wider">Estimation</span>
              {isLoadingEstimation && <Loader2 size={14} className="animate-spin ml-auto text-emerald-400" />}
            </div>

            <div className={`space-y-4 mb-8 transition-opacity ${isLoadingEstimation ? 'opacity-40' : 'opacity-100'}`}>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Effectif</span>
                <span className="font-bold">{estimation.count}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Total Brut</span>
                <span className="font-mono font-bold">{fmt(estimation.gross)}</span>
              </div>
              <div className="h-px bg-white/10 w-full" />
              <div className="flex justify-between items-center text-sm">
                <span className="text-emerald-400 font-bold">Net Estimé</span>
                <span className="font-mono font-bold text-emerald-400 text-lg">{fmt(estimation.net)}</span>
              </div>
              <div className="h-px bg-white/10 w-full" />
              <div>
                <p className="text-xs text-gray-400 mb-1">Masse Salariale Totale</p>
                <p className="text-2xl font-bold">{fmt(estimation.cost)}</p>
                <p className="text-xs text-gray-500 mt-0.5">Brut + charges patronales</p>
              </div>
            </div>

            {isLoadingEstimation && (
              <p className="text-xs text-center text-gray-500">
                Calcul en cours depuis le serveur...
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}