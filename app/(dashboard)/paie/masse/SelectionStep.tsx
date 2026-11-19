// ===========================
// FILE: SelectionStep.tsx
// ✅ Affiche l'estimation venant du back (via isLoadingEstimation prop)
// ===========================
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Loader2, RotateCcw } from 'lucide-react';
import { Badge, Button, Card, EmptyState, Input } from '@/components/design-system/primitives';

interface SelectionStepProps {
  employees: any[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  workDays: number;                       // jours théoriques du mois (borne max)
  month: string;                          // période affichée dans l'estimation
  year: number;
  autoDays: Record<string, number>;       // jours calculés depuis les présences
  daysInput: Record<string, string>;      // jours saisis à la main
  onDaysChange: (id: string, value: string) => void;
  onDaysReset: (id: string) => void;
  onApplyAll: (value: string) => void;    // applique une valeur à tous les employés
  onResetAll: () => void;                 // annule toute saisie manuelle
  estimation: {
    count: number;
    gross: number;
    net: number;
    cost: number;
    bonuses?: number;      // total primes/indemnités (imposables ou non)
    deductions?: number;   // total retenues (CNSS, ITS, taxes, prêts, avances, retenues diverses)
    failed?: number;       // employés dont le calcul a échoué
  };
  isLoadingEstimation?: boolean; // ✅ Nouveau prop
}

export default function SelectionStep({
  employees, selectedIds, onSelectionChange,
  workDays, month, year, autoDays, daysInput, onDaysChange, onDaysReset, onApplyAll, onResetAll,
  estimation, isLoadingEstimation,
}: SelectionStepProps) {
  const fmt = (val: number) => (val || 0).toLocaleString('fr-FR');
  const [bulkDays, setBulkDays] = useState('');
  const editedCount = Object.keys(daysInput).length;
  const bulkValid = bulkDays.trim() !== '' && Number.isFinite(Number(bulkDays.replace(',', '.')));

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
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-[var(--text)]">Employés à inclure</h3>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">{month} {year} · Les jours restent modifiables par personne.</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone="info">{selectedIds.length} / {employees.length} sélectionné(s)</Badge>
              <Button variant="ghost"
              onClick={() => onSelectionChange(
                selectedIds.length === employees.length ? [] : employees.map(e => e.id)
              )}
              >
              {selectedIds.length === employees.length ? 'Tout désélectionner' : 'Tout sélectionner'}
              </Button>
            </div>
          </div>

          {/* Appliquer le même nombre de jours à tous (ex. pointeuse en panne) */}
          <div className="mb-3 grid items-end gap-3 rounded-xl bg-[var(--surface-2)] p-4 sm:grid-cols-[minmax(160px,1fr)_auto]">
            <Input label="Jours travaillés pour tous"
              type="number"
              inputMode="decimal"
              min={0}
              max={workDays}
              step={0.5}
              value={bulkDays}
              placeholder={String(workDays)}
              onChange={e => {
                const v = e.target.value;
                const n = Number(v);
                setBulkDays(v !== '' && n > workDays ? String(workDays) : (n < 0 ? '0' : v));
              }}
              onKeyDown={e => { if (e.key === 'Enter' && bulkValid) onApplyAll(bulkDays); }}
              className="max-w-36 font-mono tabular-nums"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" disabled={!bulkValid} onClick={() => onApplyAll(bulkDays)}>Appliquer à tous</Button>
              {editedCount > 0 && <Button variant="ghost" type="button" onClick={() => { onResetAll(); setBulkDays(''); }}>
                <RotateCcw size={14} strokeWidth={1.5} />Revenir au pointage ({editedCount})
              </Button>}
            </div>
          </div>

          <div className="max-h-[400px] flex-1 space-y-2 overflow-y-auto">
            {employees.length === 0 ? (
              <EmptyState title="Aucun employé disponible">Vérifiez l’accès à la liste des employés, puis réessayez.</EmptyState>
            ) : employees.map(emp => (
              <div
                key={emp.id}
                className={`grid grid-cols-1 items-center gap-3 rounded-xl border p-3 transition-colors sm:grid-cols-[minmax(0,1fr)_auto] ${
                  selectedIds.includes(emp.id)
                    ? 'border-[var(--brand)] bg-[var(--brand-soft)]'
                    : 'border-[var(--border)] bg-[var(--surface)]'
                }`}
              >
                <label className="flex min-w-0 cursor-pointer items-center gap-3">
                  <input type="checkbox" checked={selectedIds.includes(emp.id)}
                    onChange={() => onSelectionChange(selectedIds.includes(emp.id)
                      ? selectedIds.filter(id => id !== emp.id)
                      : [...selectedIds, emp.id])}
                    className="h-4 w-4 accent-[var(--action)]" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-[var(--text)]">{emp.firstName} {emp.lastName}</span>
                    {emp.position && <span className="mt-0.5 block truncate text-xs text-[var(--text-secondary)]">{emp.position}</span>}
                  </span>
                </label>
                <div className="flex flex-wrap items-end justify-between gap-3 sm:justify-end">
                  {selectedIds.includes(emp.id) && (() => {
                    const auto = autoDays[emp.id];
                    const edited = daysInput[emp.id] !== undefined;
                    const shown = edited ? daysInput[emp.id] : (auto !== undefined ? String(auto) : '');
                    return (
                      <div className="flex items-end gap-2">
                        {edited && (
                          <Button variant="ghost" type="button" aria-label={`Réinitialiser les jours de ${emp.firstName} ${emp.lastName}`}
                            title={auto !== undefined ? `Revenir à ${auto} j (présences)` : 'Réinitialiser'}
                            onClick={() => onDaysReset(emp.id)} className="!min-h-10 !px-2">
                            <RotateCcw size={14} strokeWidth={1.5} />
                          </Button>
                        )}
                        <Input label="Jours travaillés" aria-label={`Jours travaillés pour ${emp.firstName} ${emp.lastName}`}
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
                          className={`w-24 text-right font-mono tabular-nums ${edited ? 'border-[var(--warning-text)]' : ''}`}
                        />
                      </div>
                    );
                  })()}
                  <Badge tone="neutral">{Number(emp.baseSalary || 0).toLocaleString('fr-FR')} FCFA</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Estimation — données du back */}
        <div className="lg:col-span-1">
          <Card title="Estimation du lot" action={isLoadingEstimation ? <Loader2 size={16} className="animate-spin text-[var(--brand-strong)]" aria-label="Calcul en cours" /> : <Badge tone="info">{month} {year}</Badge>}
            className="sticky top-4">
            <p className="mb-4 text-xs leading-5 text-[var(--text-secondary)]"><Wallet size={14} className="mr-1 inline-block" aria-hidden="true" />Montants transmis par le calculateur serveur.</p>
            <div className={`space-y-3 transition-opacity ${isLoadingEstimation ? 'opacity-50' : 'opacity-100'}`}>
              <EstimateRow label="Effectif calculé" value={String(estimation.count)} />
              <EstimateRow label="Total brut" value={`${fmt(estimation.gross)} FCFA`} />
              <EstimateRow label="Primes et indemnités" value={`${fmt(estimation.bonuses || 0)} FCFA`} />
              <EstimateRow label="Total retenues" value={`− ${fmt(estimation.deductions || 0)} FCFA`} />
              <div className="border-t border-[var(--border)] pt-3">
                <EstimateRow label="Net estimé" value={`${fmt(estimation.net)} FCFA`} emphasis />
              </div>
              <div className="rounded-xl bg-[var(--surface-2)] p-4">
                <p className="text-xs text-[var(--text-secondary)]">Masse salariale totale</p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-[var(--text)]">{fmt(estimation.cost)} FCFA</p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">Brut + charges patronales</p>
              </div>
            </div>
            {!!estimation.failed && <p className="mt-4"><Badge tone="warning">{estimation.failed} calcul(s) à vérifier</Badge></p>}
            {isLoadingEstimation && <p className="mt-3 text-xs text-[var(--text-secondary)]">Calcul en cours depuis le serveur…</p>}
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

function EstimateRow({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className={emphasis ? 'font-semibold text-[var(--text)]' : 'text-[var(--text-secondary)]'}>{label}</span>
      <span className={`text-right font-mono tabular-nums ${emphasis ? 'font-semibold text-[var(--success-text)]' : 'font-medium text-[var(--text)]'}`}>{value}</span>
    </div>
  );
}