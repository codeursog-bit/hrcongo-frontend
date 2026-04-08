'use client';

// ============================================================================
// 📁 app/(dashboard)/presences/shifts/page.tsx
// ============================================================================
// 🔥 KONZA SUITE — Gestion des Plannings / Shifts
//
// Permet à l'admin/RH de :
//   • Créer des shifts (Matin, Soir, Nuit, Garde...)
//   • Assigner un shift à un employé pour une date précise
//   • Créer des plannings récurrents (lundi = Matin, mardi = Nuit...)
//   • Gérer les cas pharmacies/hôpitaux avec shifts tournants
//
// Style cohérent avec le reste de l'app (dark/light, sky/blue palette)
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Moon, Sun, Sunset, Clock, Plus, Edit2, Trash2, Users,
  ArrowLeft, Loader2, Check, X, AlertCircle, Calendar,
  ChevronRight, User, Shield, Zap, RefreshCw, Search
} from 'lucide-react';
import { api } from '@/services/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface WorkShift {
  id: string;
  name: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  durationHours: number;
  crossesMidnight: boolean;
  isNightShift: boolean;
  nightPremiumRate: number;
  color: string;
  isDefault: boolean;
  isActive: boolean;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  photoUrl?: string;
  department?: { name: string };
}

interface ShiftAssignment {
  id: string;
  employeeId: string;
  shiftId: string;
  specificDate?: string;
  dayOfWeek?: number;
  validFrom?: string;
  validUntil?: string;
  notes?: string;
  shift: WorkShift;
  employee?: Employee;
}

// ─── Constantes ───────────────────────────────────────────────────────────────
const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const SHIFT_COLORS = [
  '#0EA5E9', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
];

const DEFAULT_SHIFTS = [
  { name: 'Matin',  startHour: 7,  startMinute: 0, endHour: 15, endMinute: 0, color: '#F59E0B', isNightShift: false },
  { name: 'Soir',   startHour: 15, startMinute: 0, endHour: 23, endMinute: 0, color: '#8B5CF6', isNightShift: false },
  { name: 'Nuit',   startHour: 23, startMinute: 0, endHour: 7,  endMinute: 0, color: '#0EA5E9', isNightShift: true  },
  { name: 'Garde',  startHour: 8,  startMinute: 0, endHour: 8,  endMinute: 0, color: '#EF4444', isNightShift: false },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatHHMM(h: number, m: number): string {
  return `${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}`;
}

function computeDuration(sh: number, sm: number, eh: number, em: number): number {
  const start = sh * 60 + sm;
  let end     = eh * 60 + em;
  if (end <= start) end += 24 * 60; // traverse minuit
  return parseFloat(((end - start) / 60).toFixed(2));
}

function ShiftIcon({ shift }: { shift: WorkShift }) {
  if (shift.isNightShift || shift.crossesMidnight) return <Moon size={14} />;
  if (shift.startHour < 12) return <Sun size={14} />;
  if (shift.startHour < 18) return <Sunset size={14} />;
  return <Moon size={14} />;
}

// ─── Composant : Formulaire création/édition shift ───────────────────────────
function ShiftForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial?: Partial<WorkShift>;
  onSave: (data: Partial<WorkShift>) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [name, setName]               = useState(initial?.name ?? '');
  const [startHour, setStartHour]     = useState(initial?.startHour ?? 8);
  const [startMinute, setStartMinute] = useState(initial?.startMinute ?? 0);
  const [endHour, setEndHour]         = useState(initial?.endHour ?? 16);
  const [endMinute, setEndMinute]     = useState(initial?.endMinute ?? 0);
  const [isNightShift, setIsNightShift] = useState(initial?.isNightShift ?? false);
  const [nightPremiumRate, setNightPremiumRate] = useState(initial?.nightPremiumRate ?? 0);
  const [color, setColor]             = useState(initial?.color ?? '#0EA5E9');
  const [isDefault, setIsDefault]     = useState(initial?.isDefault ?? false);

  const duration = computeDuration(startHour, startMinute, endHour, endMinute);
  const crosses  = (endHour * 60 + endMinute) <= (startHour * 60 + startMinute);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      startHour, startMinute,
      endHour, endMinute,
      durationHours: duration,
      crossesMidnight: crosses,
      isNightShift: isNightShift || crosses,
      nightPremiumRate,
      color,
      isDefault,
      isActive: true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />

      <div className="relative w-full sm:max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {initial?.id ? 'Modifier le shift' : 'Nouveau shift'}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Durée calculée : <strong className="text-sky-500">{duration}h</strong>
              {crosses && <span className="ml-1 text-amber-500">(traverse minuit)</span>}
            </p>
          </div>
          <button onClick={onCancel} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5">

          {/* Présets rapides */}
          {!initial?.id && (
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">
                Démarrage rapide
              </label>
              <div className="grid grid-cols-4 gap-2">
                {DEFAULT_SHIFTS.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => {
                      setName(p.name);
                      setStartHour(p.startHour); setStartMinute(0);
                      setEndHour(p.endHour); setEndMinute(0);
                      setIsNightShift(p.isNightShift);
                      setColor(p.color);
                    }}
                    className="flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-sky-400 text-xs font-bold text-gray-600 dark:text-gray-300 transition-all"
                    style={{ borderColor: name === p.name ? p.color : undefined }}
                  >
                    <span className="text-base">
                      {p.isNightShift ? '🌙' : p.startHour < 12 ? '☀️' : '🌆'}
                    </span>
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Nom */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              Nom du shift <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Matin, Nuit, Garde pharmacie..."
              className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
            />
          </div>

          {/* Horaires */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Début</label>
              <div className="flex gap-2">
                <select
                  value={startHour}
                  onChange={(e) => setStartHour(+e.target.value)}
                  className="flex-1 px-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:border-sky-500"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{String(i).padStart(2, '0')}h</option>
                  ))}
                </select>
                <select
                  value={startMinute}
                  onChange={(e) => setStartMinute(+e.target.value)}
                  className="w-20 px-2 py-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:border-sky-500"
                >
                  {[0, 15, 30, 45].map(m => (
                    <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Fin</label>
              <div className="flex gap-2">
                <select
                  value={endHour}
                  onChange={(e) => setEndHour(+e.target.value)}
                  className="flex-1 px-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:border-sky-500"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{String(i).padStart(2, '0')}h</option>
                  ))}
                </select>
                <select
                  value={endMinute}
                  onChange={(e) => setEndMinute(+e.target.value)}
                  className="w-20 px-2 py-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:border-sky-500"
                >
                  {[0, 15, 30, 45].map(m => (
                    <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setIsNightShift(!isNightShift)}
                className={`w-11 h-6 rounded-full transition-colors ${isNightShift ? 'bg-sky-500' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mt-0.5 ${isNightShift ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                  <Moon size={14} className="text-sky-500" /> Shift de nuit
                </p>
                <p className="text-xs text-gray-500">Ouvre droit à la prime de nuit</p>
              </div>
            </label>

            {isNightShift && (
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">
                  Prime de nuit (%)
                </label>
                <input
                  type="number"
                  min={0} max={100} step={5}
                  value={nightPremiumRate}
                  onChange={(e) => setNightPremiumRate(+e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:border-sky-500"
                />
              </div>
            )}

            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setIsDefault(!isDefault)}
                className={`w-11 h-6 rounded-full transition-colors ${isDefault ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mt-0.5 ${isDefault ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Shift par défaut</p>
                <p className="text-xs text-gray-500">Appliqué à tous les employés sans planning spécifique</p>
              </div>
            </label>
          </div>

          {/* Couleur */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Couleur</label>
            <div className="flex gap-2 flex-wrap">
              {SHIFT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-xl transition-all ${color === c ? 'ring-2 ring-offset-2 ring-current scale-110' : 'opacity-70 hover:opacity-100'}`}
                  style={{ backgroundColor: c, color: c }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-sky-500 to-blue-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-lg shadow-sky-500/20 transition-all"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {initial?.id ? 'Mettre à jour' : 'Créer le shift'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Composant : Modal assignation shift ─────────────────────────────────────
function AssignShiftModal({
  shifts,
  employees,
  onAssign,
  onClose,
  saving,
}: {
  shifts: WorkShift[];
  employees: Employee[];
  onAssign: (data: Partial<ShiftAssignment>) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedShift, setSelectedShift]       = useState('');
  const [assignType, setAssignType]             = useState<'date' | 'recurring'>('date');
  const [specificDate, setSpecificDate]         = useState(new Date().toISOString().split('T')[0]);
  const [dayOfWeek, setDayOfWeek]               = useState(1);
  const [validFrom, setValidFrom]               = useState('');
  const [validUntil, setValidUntil]             = useState('');
  const [notes, setNotes]                       = useState('');
  const [searchEmp, setSearchEmp]               = useState('');

  const filteredEmps = employees.filter(e =>
    `${e.firstName} ${e.lastName} ${e.department?.name}`.toLowerCase().includes(searchEmp.toLowerCase())
  );

  const handleAssign = () => {
    if (!selectedEmployee || !selectedShift) return;
    onAssign({
      employeeId: selectedEmployee,
      shiftId:    selectedShift,
      specificDate: assignType === 'date' ? specificDate : undefined,
      dayOfWeek:    assignType === 'recurring' ? dayOfWeek : undefined,
      validFrom:    validFrom || undefined,
      validUntil:   validUntil || undefined,
      notes:        notes || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Assigner un planning</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5">

          {/* Choix shift */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              Shift <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 gap-2">
              {shifts.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedShift(s.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                    selectedShift === s.id
                      ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: s.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                      <ShiftIcon shift={s} />
                      {s.name}
                      {s.isDefault && (
                        <span className="ml-1 px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-md text-[10px] font-bold">
                          Défaut
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatHHMM(s.startHour, s.startMinute)} → {formatHHMM(s.endHour, s.endMinute)}
                      {' · '}{s.durationHours}h
                      {s.isNightShift && s.nightPremiumRate > 0 && ` · Prime nuit +${s.nightPremiumRate}%`}
                    </p>
                  </div>
                  {selectedShift === s.id && <Check size={16} className="text-sky-500 flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Type d'assignation */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Type</label>
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-1">
              <button
                onClick={() => setAssignType('date')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                  assignType === 'date'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500'
                }`}
              >
                📅 Date précise
              </button>
              <button
                onClick={() => setAssignType('recurring')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                  assignType === 'recurring'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500'
                }`}
              >
                🔄 Planning récurrent
              </button>
            </div>
          </div>

          {assignType === 'date' ? (
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">Date</label>
              <input
                type="date"
                value={specificDate}
                onChange={(e) => setSpecificDate(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:border-sky-500"
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">Jour de la semaine</label>
                <div className="grid grid-cols-7 gap-1">
                  {DAY_NAMES.map((day, i) => (
                    <button
                      key={i}
                      onClick={() => setDayOfWeek(i)}
                      className={`py-2 rounded-lg text-xs font-bold transition-all ${
                        dayOfWeek === i
                          ? 'bg-sky-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      {day.slice(0, 2)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Valable du</label>
                  <input
                    type="date"
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Au</label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:border-sky-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Employé */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              Employé <span className="text-red-500">*</span>
            </label>
            <div className="relative mb-2">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchEmp}
                onChange={(e) => setSearchEmp(e.target.value)}
                className="w-full pl-8 pr-4 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:border-sky-500"
              />
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1.5">
              {filteredEmps.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => setSelectedEmployee(emp.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-left transition-all ${
                    selectedEmployee === emp.id
                      ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  {emp.photoUrl ? (
                    <img src={emp.photoUrl} className="w-8 h-8 rounded-lg object-cover" alt="" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-xs font-bold text-white">
                      {emp.firstName[0]}{emp.lastName[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                      {emp.firstName} {emp.lastName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{emp.department?.name}</p>
                  </div>
                  {selectedEmployee === emp.id && <Check size={14} className="text-sky-500" />}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">Notes (optionnel)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Remplacement congé, Formation..."
              className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:border-sky-500"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold">
            Annuler
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedEmployee || !selectedShift || saving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-sky-500 to-blue-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-lg shadow-sky-500/20"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            Assigner
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function ShiftsPage() {
  const router = useRouter();

  const [shifts, setShifts]               = useState<WorkShift[]>([]);
  const [employees, setEmployees]         = useState<Employee[]>([]);
  const [userRole, setUserRole]           = useState('');
  const [loading, setLoading]             = useState(true);
  const [saving, setSaving]               = useState(false);

  const [showShiftForm, setShowShiftForm]     = useState(false);
  const [editingShift, setEditingShift]       = useState<WorkShift | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Chargement ────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [shiftsRes, empsRes, userRes] = await Promise.all([
        api.get('/attendance/shifts') as Promise<WorkShift[]>,
        api.get('/employees?status=ACTIVE&limit=200') as Promise<any>,
        api.get('/auth/me') as Promise<any>,
      ]);
      setShifts(Array.isArray(shiftsRes) ? shiftsRes : []);
      setEmployees(Array.isArray(empsRes) ? empsRes : empsRes?.employees || []);
      setUserRole(userRes?.role || '');
    } catch (e) {
      console.error('Erreur chargement shifts:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const isAdmin = ['ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'].includes(userRole);

  // ── CRUD shifts ───────────────────────────────────────────────────────────
  const handleSaveShift = async (data: Partial<WorkShift>) => {
    setSaving(true);
    try {
      if (editingShift) {
        await api.put(`/attendance/shifts/${editingShift.id}`, data);
        showToast('Shift mis à jour ✅');
      } else {
        await api.post('/attendance/shifts', data);
        showToast('Shift créé ✅');
      }
      setShowShiftForm(false);
      setEditingShift(null);
      fetchData();
    } catch (e: any) {
      showToast(e.message || 'Erreur', false);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteShift = async (id: string) => {
    if (!confirm('Supprimer ce shift ?')) return;
    try {
      await api.delete(`/attendance/shifts/${id}`);
      showToast('Shift supprimé');
      fetchData();
    } catch (e: any) {
      showToast(e.message || 'Erreur', false);
    }
  };

  // ── Assignation ───────────────────────────────────────────────────────────
  const handleAssign = async (data: Partial<ShiftAssignment>) => {
    setSaving(true);
    try {
      await api.post('/attendance/shift-assignments', data);
      showToast('Planning assigné ✅');
      setShowAssignModal(false);
    } catch (e: any) {
      showToast(e.message || 'Erreur', false);
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl text-white shadow-2xl ${toast.ok ? 'bg-emerald-500' : 'bg-red-500'}`}>
          {toast.ok ? <Check size={16} /> : <X size={16} />}
          <span className="font-semibold text-sm">{toast.msg}</span>
        </div>
      )}

      {/* Modals */}
      {(showShiftForm || editingShift) && (
        <ShiftForm
          initial={editingShift || undefined}
          onSave={handleSaveShift}
          onCancel={() => { setShowShiftForm(false); setEditingShift(null); }}
          saving={saving}
        />
      )}
      {showAssignModal && (
        <AssignShiftModal
          shifts={shifts}
          employees={employees}
          onAssign={handleAssign}
          onClose={() => setShowAssignModal(false)}
          saving={saving}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Plannings & Shifts</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gérez les horaires flexibles — Matin, Soir, Nuit, Garde
          </p>
        </div>
        <button
          onClick={() => fetchData()}
          className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 transition-colors"
        >
          <RefreshCw size={18} className={`text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Banner info */}
      <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-2xl p-4 flex items-start gap-3">
        <AlertCircle size={18} className="text-sky-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-sky-800 dark:text-sky-300">
            Gestion des horaires flexibles
          </p>
          <p className="text-xs text-sky-700 dark:text-sky-400 mt-0.5">
            Un shift assigné à un employé remplace l'heure officielle globale pour le calcul des retards et heures sup.
            Idéal pour les <strong>pharmacies</strong>, <strong>hôpitaux</strong> et toute structure avec des relais.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-sky-500" />
        </div>
      ) : (
        <>
          {/* ── Section : Shifts définis ─────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Clock size={18} className="text-sky-500" />
                Shifts ({shifts.length})
              </h2>
              {isAdmin && (
                <button
                  onClick={() => setShowShiftForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl text-sm font-bold shadow-md shadow-sky-500/20 hover:-translate-y-0.5 transition-all"
                >
                  <Plus size={15} /> Nouveau shift
                </button>
              )}
            </div>

            {shifts.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-12 text-center">
                <div className="w-16 h-16 bg-sky-50 dark:bg-sky-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock size={28} className="text-sky-400" />
                </div>
                <p className="font-bold text-gray-700 dark:text-gray-200 mb-1">Aucun shift configuré</p>
                <p className="text-sm text-gray-500 mb-5">
                  Créez des shifts pour gérer des horaires flexibles
                </p>
                {isAdmin && (
                  <button
                    onClick={() => setShowShiftForm(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-500 text-white rounded-xl text-sm font-bold"
                  >
                    <Plus size={15} /> Créer le premier shift
                  </button>
                )}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {shifts.map((shift) => (
                  <div
                    key={shift.id}
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: shift.color }}
                        />
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5 text-sm">
                            <ShiftIcon shift={shift} />
                            {shift.name}
                          </p>
                          {shift.isDefault && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded font-bold">
                              Défaut
                            </span>
                          )}
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditingShift(shift)}
                            className="p-1.5 hover:bg-sky-100 dark:hover:bg-sky-900/30 rounded-lg transition-colors"
                          >
                            <Edit2 size={13} className="text-sky-500" />
                          </button>
                          <button
                            onClick={() => handleDeleteShift(shift.id)}
                            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          >
                            <Trash2 size={13} className="text-red-400" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
                      <div className="flex items-center justify-between">
                        <span>Horaires</span>
                        <span className="font-mono font-bold text-gray-900 dark:text-white">
                          {formatHHMM(shift.startHour, shift.startMinute)} → {formatHHMM(shift.endHour, shift.endMinute)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Durée</span>
                        <span className="font-bold text-sky-600 dark:text-sky-400">{shift.durationHours}h</span>
                      </div>
                      {shift.crossesMidnight && (
                        <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                          <Moon size={11} /> <span>Traverse minuit</span>
                        </div>
                      )}
                      {shift.isNightShift && shift.nightPremiumRate > 0 && (
                        <div className="flex items-center justify-between">
                          <span>Prime nuit</span>
                          <span className="font-bold text-purple-600 dark:text-purple-400">+{shift.nightPremiumRate}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Section : Assigner ───────────────────────────────────────── */}
          {isAdmin && shifts.length > 0 && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <Users size={18} className="text-emerald-500" />
                    Assigner des plannings
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Associez un shift à un employé pour une date ou un planning récurrent
                  </p>
                </div>
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-500/20 hover:-translate-y-0.5 transition-all"
                >
                  <Plus size={15} /> Assigner
                </button>
              </div>

              {/* Explication cas d'usage */}
              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  {
                    emoji: '💊',
                    title: 'Pharmacie / Hôpital',
                    desc: 'Assignez "Garde 20h→8h" à l\'équipe de nuit. Le système sait que ce sont leurs heures normales.',
                  },
                  {
                    emoji: '🏭',
                    title: 'Usine 3×8',
                    desc: 'Matin / Soir / Nuit en rotation hebdomadaire. Chaque équipe a ses propres heures de référence.',
                  },
                  {
                    emoji: '🔐',
                    title: 'Sécurité / Gardiennage',
                    desc: 'Shifts de 12h avec prime nuit configurée. Calcul automatique de la prime sur le bulletin.',
                  },
                ].map((uc) => (
                  <div key={uc.title} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <p className="text-2xl mb-2">{uc.emoji}</p>
                    <p className="text-sm font-bold text-gray-800 dark:text-white mb-1">{uc.title}</p>
                    <p className="text-xs text-gray-500">{uc.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}