'use client';

// ============================================================================
// 📁 app/(dashboard)/presences/shifts/page.tsx
// ============================================================================
// ✅ Garde tout le CRUD existant
// 🆕 Ajoute : Vue "Employés & leurs shifts" avec filtres, badges, export rapide
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Moon, Sun, Clock, Plus, Edit2, Trash2, Users,
  ArrowLeft, Loader2, Check, X, AlertCircle, Calendar,
  Search, RefreshCw, AlertTriangle, Eye,
  ChevronDown, Filter, Download, Building2,
  Sunset, Info, UserCheck, UserX, Repeat,
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
  employee: Employee;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtHHMM(h: number, m: number) {
  return `${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}`;
}

function calcDuration(sh: number, sm: number, eh: number, em: number): number {
  const start = sh * 60 + sm;
  let end = eh * 60 + em;
  if (end <= start) end += 24 * 60;
  return parseFloat(((end - start) / 60).toFixed(2));
}

function ShiftIcon({ shift }: { shift: WorkShift }) {
  if (shift.isNightShift || shift.crossesMidnight) return <Moon size={14} />;
  if (shift.startHour < 12) return <Sun size={14} />;
  if (shift.startHour < 18) return <Sunset size={14} />;
  return <Moon size={14} />;
}

const DAY_NAMES_FULL = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const DAY_NAMES = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const SHIFT_COLORS = ['#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
const PRESETS = [
  { name: 'Matin', sh: 7, eh: 15, color: '#F59E0B', night: false },
  { name: 'Soir', sh: 15, eh: 23, color: '#8B5CF6', night: false },
  { name: 'Nuit', sh: 23, eh: 7, color: '#0EA5E9', night: true },
  { name: 'Garde', sh: 20, eh: 8, color: '#EF4444', night: true },
];

// ─── Badge shift inline ───────────────────────────────────────────────────────
function ShiftBadge({ shift, small }: { shift: WorkShift; small?: boolean }) {
  const size = small ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg font-bold ${size}`}
      style={{ backgroundColor: shift.color + '22', color: shift.color, border: `1px solid ${shift.color}44` }}
    >
      <ShiftIcon shift={shift} />
      {shift.name}
      <span className="opacity-70">· {fmtHHMM(shift.startHour, shift.startMinute)}–{fmtHHMM(shift.endHour, shift.endMinute)}</span>
    </span>
  );
}

// ─── Modal Shift ──────────────────────────────────────────────────────────────
function ShiftModal({ initial, onSave, onCancel, saving }: {
  initial?: Partial<WorkShift>;
  onSave: (d: any) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [sh, setSh] = useState(initial?.startHour ?? 8);
  const [sm, setSm] = useState(initial?.startMinute ?? 0);
  const [eh, setEh] = useState(initial?.endHour ?? 16);
  const [em, setEm] = useState(initial?.endMinute ?? 0);
  const [night, setNight] = useState(initial?.isNightShift ?? false);
  const [premium, setPremium] = useState(initial?.nightPremiumRate ?? 0);
  const [color, setColor] = useState(initial?.color ?? '#0EA5E9');
  const [isDefault, setDefault] = useState(initial?.isDefault ?? false);

  const duration = calcDuration(sh, sm, eh, em);
  const crosses = (eh * 60 + em) <= (sh * 60 + sm);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full sm:max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {initial?.id ? 'Modifier' : 'Nouveau shift'}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Durée : <strong className="text-sky-500">{duration}h</strong>
              {crosses && <span className="ml-1 text-amber-500">(traverse minuit)</span>}
            </p>
          </div>
          <button onClick={onCancel} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={18} className="text-gray-400" />
          </button>
        </div>
        <div className="p-6 max-h-[72vh] overflow-y-auto space-y-5">
          {!initial?.id && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Démarrage rapide</p>
              <div className="grid grid-cols-4 gap-2">
                {PRESETS.map(p => (
                  <button key={p.name} onClick={() => { setName(p.name); setSh(p.sh); setSm(0); setEh(p.eh); setEm(0); setNight(p.night); setColor(p.color); }}
                    className="flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-sky-400 text-xs font-bold text-gray-600 dark:text-gray-300 transition-all"
                    style={{ borderColor: name === p.name ? p.color : undefined }}>
                    <span>{p.night ? '🌙' : p.sh < 12 ? '☀️' : '🌆'}</span>
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Nom <span className="text-red-500">*</span></label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Ex : Matin, Nuit, Garde pharmacie..."
              className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Début', h: sh, m: sm, setH: setSh, setM: setSm },
              { label: 'Fin', h: eh, m: em, setH: setEh, setM: setEm },
            ].map(({ label, h, m, setH, setM }) => (
              <div key={label}>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
                <div className="flex gap-2">
                  <select value={h} onChange={e => setH(+e.target.value)}
                    className="flex-1 px-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:border-sky-500">
                    {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2, '0')}h</option>)}
                  </select>
                  <select value={m} onChange={e => setM(+e.target.value)}
                    className="w-20 px-2 py-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:border-sky-500">
                    {[0, 15, 30, 45].map(v => <option key={v} value={v}>{String(v).padStart(2, '0')}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <button type="button" onClick={() => setNight(!night)}
              className={`w-11 h-6 rounded-full transition-colors ${night ? 'bg-sky-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mt-0.5 ${night ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'}`} />
            </button>
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5"><Moon size={14} className="text-sky-500" /> Shift de nuit</p>
              <p className="text-xs text-gray-500">Ouvre droit à la prime de nuit</p>
            </div>
          </label>
          {night && (
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Prime de nuit (%)</label>
              <input type="number" min={0} max={100} step={5} value={premium} onChange={e => setPremium(+e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:border-sky-500" />
            </div>
          )}
          <label className="flex items-center gap-3 cursor-pointer">
            <button type="button" onClick={() => setDefault(!isDefault)}
              className={`w-11 h-6 rounded-full transition-colors ${isDefault ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mt-0.5 ${isDefault ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'}`} />
            </button>
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Shift par défaut</p>
              <p className="text-xs text-gray-500">Appliqué aux employés sans planning spécifique</p>
            </div>
          </label>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Couleur</p>
            <div className="flex gap-2 flex-wrap">
              {SHIFT_COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-xl transition-all ${color === c ? 'ring-2 ring-offset-2 ring-current scale-110' : 'opacity-60 hover:opacity-100'}`}
                  style={{ backgroundColor: c, color: c }} />
              ))}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold">Annuler</button>
          <button
            onClick={() => onSave({ name: name.trim(), startHour: sh, startMinute: sm, endHour: eh, endMinute: em, isNightShift: night || crosses, nightPremiumRate: premium, color, isDefault, durationHours: duration, crossesMidnight: crosses })}
            disabled={!name.trim() || saving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-sky-500 to-blue-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-lg shadow-sky-500/20">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {initial?.id ? 'Mettre à jour' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Assignation ────────────────────────────────────────────────────────
function AssignModal({ shifts, employees, onAssign, onClose, saving }: {
  shifts: WorkShift[];
  employees: Employee[];
  onAssign: (d: any) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [shiftId, setShiftId] = useState('');
  const [empId, setEmpId] = useState('');
  const [type, setType] = useState<'date' | 'recurring'>('date');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dow, setDow] = useState(1);
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');
  const [search, setSearch] = useState('');

  const filtered = employees.filter(e =>
    `${e.firstName} ${e.lastName} ${e.department?.name ?? ''}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Assigner un planning</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"><X size={18} className="text-gray-400" /></button>
        </div>
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Shift <span className="text-red-500">*</span></label>
            <div className="space-y-1.5">
              {shifts.map(s => (
                <button key={s.id} onClick={() => setShiftId(s.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 text-left transition-all ${shiftId === s.id ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5"><ShiftIcon shift={s} />{s.name}{s.isDefault && <span className="ml-1 px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded text-[10px] font-bold">Défaut</span>}</p>
                    <p className="text-xs text-gray-500">{fmtHHMM(s.startHour, s.startMinute)} → {fmtHHMM(s.endHour, s.endMinute)} · {s.durationHours}h{s.nightPremiumRate > 0 ? ` · +${s.nightPremiumRate}%` : ''}</p>
                  </div>
                  {shiftId === s.id && <Check size={14} className="text-sky-500" />}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Type</label>
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-1">
              {(['date', 'recurring'] as const).map(t => (
                <button key={t} onClick={() => setType(t)}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${type === t ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}>
                  {t === 'date' ? '📅 Date précise' : '🔄 Récurrent'}
                </button>
              ))}
            </div>
          </div>
          {type === 'date' ? (
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:border-sky-500" />
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">Jour</label>
                <div className="grid grid-cols-7 gap-1">
                  {DAY_NAMES.map((d, i) => (
                    <button key={i} onClick={() => setDow(i)}
                      className={`py-2 rounded-lg text-xs font-bold transition-all ${dow === i ? 'bg-sky-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200'}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Du</label>
                  <input type="date" value={validFrom} onChange={e => setValidFrom(e.target.value)} className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:border-sky-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Au</label>
                  <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:border-sky-500" />
                </div>
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Employé <span className="text-red-500">*</span></label>
            <div className="relative mb-2">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-4 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:border-sky-500" />
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1.5">
              {filtered.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-4">Aucun employé trouvé</p>
              ) : filtered.map(emp => (
                <button key={emp.id} onClick={() => setEmpId(emp.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-left transition-all ${empId === emp.id ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                  {emp.photoUrl ? <img src={emp.photoUrl} className="w-8 h-8 rounded-lg object-cover" alt="" /> : (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-xs font-bold text-white">
                      {emp.firstName[0]}{emp.lastName[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{emp.firstName} {emp.lastName}</p>
                    <p className="text-xs text-gray-500 truncate">{emp.department?.name}</p>
                  </div>
                  {empId === emp.id && <Check size={14} className="text-sky-500" />}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">Notes (optionnel)</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ex : Remplacement congé..."
              className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:border-sky-500" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold">Annuler</button>
          <button
            onClick={() => onAssign({ shiftId, employeeId: empId, specificDate: type === 'date' ? date : undefined, dayOfWeek: type === 'recurring' ? dow : undefined, validFrom: validFrom || undefined, validUntil: validUntil || undefined, notes: notes || undefined })}
            disabled={!empId || !shiftId || saving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            Assigner
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 🆕 Vue Employés Shiftés ──────────────────────────────────────────────────
function EmployeeShiftView({
  assignments, employees, shifts, loading,
}: {
  assignments: ShiftAssignment[];
  employees: Employee[];
  shifts: WorkShift[];
  loading: boolean;
}) {
  const [search, setSearch] = useState('');
  const [filterShift, setFilterShift] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'date' | 'recurring'>('all');

  // Groupe par employé
  type EmployeeGroup = {
    employee: Employee;
    assignments: ShiftAssignment[];
    hasShift: boolean;
  };

  const employeeMap = new Map<string, EmployeeGroup>();

  // Init tous les employés (même sans shift)
  employees.forEach(emp => {
    employeeMap.set(emp.id, { employee: emp, assignments: [], hasShift: false });
  });

  // Remplir avec les assignations
  assignments.forEach(a => {
    const group = employeeMap.get(a.employeeId);
    if (group) {
      group.assignments.push(a);
      group.hasShift = true;
    } else {
      // Employé dans les assignations mais pas dans la liste (rare)
      employeeMap.set(a.employeeId, {
        employee: a.employee,
        assignments: [a],
        hasShift: true,
      });
    }
  });

  const allGroups = Array.from(employeeMap.values());

  const filtered = allGroups.filter(g => {
    const nameMatch = `${g.employee.firstName} ${g.employee.lastName} ${g.employee.department?.name ?? ''}`.toLowerCase().includes(search.toLowerCase());
    const shiftMatch = !filterShift || g.assignments.some(a => a.shiftId === filterShift);
    const typeMatch =
      filterType === 'all' ||
      (filterType === 'date' && g.assignments.some(a => a.specificDate)) ||
      (filterType === 'recurring' && g.assignments.some(a => a.dayOfWeek !== undefined));
    return nameMatch && shiftMatch && typeMatch;
  }).sort((a, b) => {
    // Employés avec shift d'abord
    if (a.hasShift && !b.hasShift) return -1;
    if (!a.hasShift && b.hasShift) return 1;
    return `${a.employee.firstName} ${a.employee.lastName}`.localeCompare(`${b.employee.firstName} ${b.employee.lastName}`);
  });

  const withShift = filtered.filter(g => g.hasShift).length;
  const withoutShift = filtered.filter(g => !g.hasShift).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={28} className="animate-spin text-sky-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-gray-900 dark:text-white">{employees.length}</p>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center justify-center gap-1"><Users size={11} />Employés total</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{assignments.length > 0 ? new Set(assignments.map(a => a.employeeId)).size : 0}</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center justify-center gap-1"><UserCheck size={11} />Avec planning</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-gray-500">{employees.length - (assignments.length > 0 ? new Set(assignments.map(a => a.employeeId)).size : 0)}</p>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center justify-center gap-1"><UserX size={11} />Horaires globaux</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un employé..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-4 py-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:border-sky-500"
          />
        </div>
        <select
          value={filterShift}
          onChange={e => setFilterShift(e.target.value)}
          className="px-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:border-sky-500"
        >
          <option value="">Tous les shifts</option>
          {shifts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-1">
          {([['all', 'Tous'], ['date', '📅'], ['recurring', '🔄']] as const).map(([val, label]) => (
            <button key={val} onClick={() => setFilterType(val as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterType === val ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table employés */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-12 text-center">
          <Users size={28} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Aucun résultat</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
          {/* Header table */}
          <div className="grid grid-cols-[1fr_auto] sm:grid-cols-[2fr_3fr_auto] gap-4 px-5 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Employé</p>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider hidden sm:block">Planning assigné</p>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Statut</p>
          </div>

          {/* Rows */}
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.map(({ employee, assignments: empAssignments, hasShift }) => (
              <div key={employee.id} className="grid grid-cols-[1fr_auto] sm:grid-cols-[2fr_3fr_auto] gap-4 px-5 py-4 items-start hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                {/* Employé */}
                <div className="flex items-center gap-3 min-w-0">
                  {employee.photoUrl ? (
                    <img src={employee.photoUrl} className="w-9 h-9 rounded-xl object-cover flex-shrink-0" alt="" />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      {employee.firstName[0]}{employee.lastName[0]}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                      {employee.firstName} {employee.lastName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {employee.department?.name && <span className="inline-flex items-center gap-1"><Building2 size={10} />{employee.department.name}</span>}
                    </p>
                    {employee.position && (
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">{employee.position}</p>
                    )}
                  </div>
                </div>

                {/* Planning */}
                <div className="hidden sm:flex flex-col gap-1.5 min-w-0">
                  {!hasShift ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 italic">
                      <Info size={11} />Horaires officiels de l'entreprise
                    </span>
                  ) : (
                    empAssignments.map(a => (
                      <div key={a.id} className="flex items-center gap-2 flex-wrap">
                        <ShiftBadge shift={a.shift} small />
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          {a.specificDate ? (
                            <><Calendar size={10} />{new Date(a.specificDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</>
                          ) : a.dayOfWeek !== undefined ? (
                            <><Repeat size={10} />{DAY_NAMES_FULL[a.dayOfWeek]}s{a.validFrom || a.validUntil ? (
                              <span className="text-gray-400">
                                {a.validFrom ? ` · du ${new Date(a.validFrom).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}` : ''}
                                {a.validUntil ? ` au ${new Date(a.validUntil).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}` : ''}
                              </span>
                            ) : null}</>
                          ) : null}
                        </span>
                        {a.notes && (
                          <span className="text-[10px] text-gray-400 italic truncate max-w-[120px]" title={a.notes}>💬 {a.notes}</span>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Statut */}
                <div className="flex-shrink-0">
                  {hasShift ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-[10px] font-bold">
                      <UserCheck size={10} />Shifté
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-lg text-[10px] font-bold">
                      <Clock size={10} />Global
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {withShift} avec planning · {withoutShift} horaires globaux
            </p>
            <button
              onClick={() => {
                // Export CSV simple
                const lines = ['Nom,Département,Poste,Shift,Type,Détail'];
                filtered.forEach(({ employee, assignments: empAssignments, hasShift }) => {
                  if (!hasShift) {
                    lines.push(`"${employee.firstName} ${employee.lastName}","${employee.department?.name ?? ''}","${employee.position ?? ''}","Horaires globaux","",""`);
                  } else {
                    empAssignments.forEach(a => {
                      const type = a.specificDate ? 'Date' : 'Récurrent';
                      const detail = a.specificDate ? a.specificDate : a.dayOfWeek !== undefined ? DAY_NAMES_FULL[a.dayOfWeek] : '';
                      lines.push(`"${employee.firstName} ${employee.lastName}","${employee.department?.name ?? ''}","${employee.position ?? ''}","${a.shift.name} (${fmtHHMM(a.shift.startHour, a.shift.startMinute)}-${fmtHHMM(a.shift.endHour, a.shift.endMinute)})","${type}","${detail}"`);
                    });
                  }
                });
                const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `plannings-shifts-${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 transition-colors"
            >
              <Download size={12} />Export CSV
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function ShiftsPage() {
  const router = useRouter();

  const [shifts, setShifts] = useState<WorkShift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  const [userRole, setUserRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [assignLoading, setAssignLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<'shifts' | 'employees'>('shifts');

  const [shiftModal, setShiftModal] = useState(false);
  const [editingShift, setEditingShift] = useState<WorkShift | null>(null);
  const [assignModal, setAssignModal] = useState(false);

  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500); };

  const isAdmin = ['ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'].includes(userRole);
  const canAssign = ['ADMIN', 'HR_MANAGER', 'SUPER_ADMIN', 'MANAGER'].includes(userRole);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const userRes: any = await api.get('/auth/me');
      setUserRole(userRes?.role || '');

      let shiftsData: WorkShift[] = [];
      try {
        const sr = await api.get('/attendance/shifts') as any;
        shiftsData = Array.isArray(sr) ? sr : [];
      } catch (e: any) {
        console.warn('Shifts API non disponible:', e.message);
        if (e?.response?.status === 404 || e?.message?.includes('WorkShift')) {
          showToast('ℹ️ Les tables shifts ne sont pas encore créées. Lancez npx prisma migrate dev.', false);
        }
      }
      setShifts(shiftsData);

      try {
        const empsRes: any = await api.get('/employees?status=ACTIVE&limit=200');
        const empsArray = Array.isArray(empsRes) ? empsRes
          : Array.isArray(empsRes?.employees) ? empsRes.employees
          : Array.isArray(empsRes?.data) ? empsRes.data : [];
        setEmployees(empsArray);
      } catch (e) {
        console.warn('Erreur chargement employés:', e);
      }

    } catch (e: any) {
      setError(e?.message || 'Impossible de charger la page');
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger les assignations séparément (peut être lent)
  const fetchAssignments = useCallback(async () => {
    setAssignLoading(true);
    try {
      // On récupère les assignations de tous les employés
      // L'endpoint GET /attendance/shift-assignments/:employeeId ne retourne que pour un employé
      // On fait donc une requête par employé en parallèle (limité)
      const empsRes: any = await api.get('/employees?status=ACTIVE&limit=200');
      const empsArray: Employee[] = Array.isArray(empsRes) ? empsRes
        : Array.isArray(empsRes?.employees) ? empsRes.employees
        : [];

      // Batch les requêtes par groupe de 10
      const allAssignments: ShiftAssignment[] = [];
      const chunks = [];
      for (let i = 0; i < empsArray.length; i += 10) {
        chunks.push(empsArray.slice(i, i + 10));
      }
      for (const chunk of chunks) {
        const results = await Promise.allSettled(
          chunk.map(emp => api.get(`/attendance/shift-assignments/${emp.id}`) as Promise<any>)
        );
        results.forEach((r, idx) => {
          if (r.status === 'fulfilled') {
            const data = Array.isArray(r.value) ? r.value : [];
            data.forEach((a: ShiftAssignment) => {
              // Enrichir avec l'objet employee
              allAssignments.push({ ...a, employee: chunk[idx] });
            });
          }
        });
      }
      setAssignments(allAssignments);
    } catch (e) {
      console.warn('Erreur assignations:', e);
    } finally {
      setAssignLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    if (activeTab === 'employees' && assignments.length === 0) {
      fetchAssignments();
    }
  }, [activeTab, assignments.length, fetchAssignments]);

  const handleSaveShift = async (data: any) => {
    setSaving(true);
    try {
      if (editingShift) {
        await api.put(`/attendance/shifts/${editingShift.id}`, data);
        showToast('Shift mis à jour ✅');
      } else {
        await api.post('/attendance/shifts', data);
        showToast('Shift créé ✅');
      }
      setShiftModal(false);
      setEditingShift(null);
      fetchData();
    } catch (e: any) {
      showToast(e?.response?.data?.message || e.message || 'Erreur', false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Désactiver ce shift ?')) return;
    try {
      await api.delete(`/attendance/shifts/${id}`);
      showToast('Shift désactivé');
      fetchData();
    } catch (e: any) {
      showToast(e?.response?.data?.message || e.message || 'Erreur', false);
    }
  };

  const handleAssign = async (data: any) => {
    setSaving(true);
    try {
      await api.post('/attendance/shift-assignments', data);
      showToast('Planning assigné ✅');
      setAssignModal(false);
      // Refresh les assignations si l'onglet est actif
      if (activeTab === 'employees') fetchAssignments();
    } catch (e: any) {
      showToast(e?.response?.data?.message || e.message || 'Erreur', false);
    } finally {
      setSaving(false);
    }
  };

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
      {(shiftModal || editingShift) && (
        <ShiftModal
          initial={editingShift || undefined}
          onSave={handleSaveShift}
          onCancel={() => { setShiftModal(false); setEditingShift(null); }}
          saving={saving}
        />
      )}
      {assignModal && (
        <AssignModal
          shifts={shifts}
          employees={employees}
          onAssign={handleAssign}
          onClose={() => setAssignModal(false)}
          saving={saving}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
          <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Plannings & Shifts</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gérez les horaires flexibles — Matin, Soir, Nuit, Garde</p>
        </div>
        <div className="flex items-center gap-2">
          {canAssign && shifts.length > 0 && (
            <button onClick={() => setAssignModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-sm font-bold shadow-md hover:-translate-y-0.5 transition-all">
              <Plus size={15} />Assigner
            </button>
          )}
          {isAdmin && (
            <button onClick={() => setShiftModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl text-sm font-bold shadow-md hover:-translate-y-0.5 transition-all">
              <Plus size={15} />Nouveau shift
            </button>
          )}
          <button onClick={fetchData} className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 transition-colors">
            <RefreshCw size={18} className={`text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-2xl p-4 flex items-start gap-3">
        <AlertCircle size={18} className="text-sky-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-sky-700 dark:text-sky-400">
          Un shift assigné remplace l'heure officielle globale pour le calcul des retards et heures sup.
          Un employé à <strong>18h</strong> n'est pas en retard à 8h — son planning prime.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-700 dark:text-red-400">Erreur de chargement</p>
            <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-gray-100 dark:bg-gray-800 rounded-2xl p-1.5 gap-1">
        <button
          onClick={() => setActiveTab('shifts')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'shifts' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          <Clock size={15} />Shifts ({shifts.length})
        </button>
        <button
          onClick={() => setActiveTab('employees')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'employees' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          <Users size={15} />Employés & Plannings
          {assignments.length > 0 && (
            <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded-full">
              {new Set(assignments.map(a => a.employeeId)).size}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-sky-500" />
        </div>
      ) : activeTab === 'shifts' ? (
        /* ── Onglet Shifts ── */
        <div className="space-y-6">
          {shifts.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-12 text-center">
              <div className="w-16 h-16 bg-sky-50 dark:bg-sky-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock size={28} className="text-sky-400" />
              </div>
              <p className="font-bold text-gray-700 dark:text-gray-200 mb-1">Aucun shift configuré</p>
              <p className="text-sm text-gray-500 mb-5">
                {isAdmin ? 'Créez des shifts pour gérer les horaires flexibles.' : "Aucun planning n'a encore été créé."}
              </p>
              {isAdmin && (
                <button onClick={() => setShiftModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-500 text-white rounded-xl text-sm font-bold">
                  <Plus size={15} />Créer le premier shift
                </button>
              )}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {shifts.map(shift => (
                <div key={shift.id}
                  className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 hover:shadow-md transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: shift.color }} />
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5 text-sm">
                          <ShiftIcon shift={shift} />{shift.name}
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
                        <button onClick={() => setEditingShift(shift)}
                          className="p-1.5 hover:bg-sky-100 dark:hover:bg-sky-900/30 rounded-lg transition-colors">
                          <Edit2 size={13} className="text-sky-500" />
                        </button>
                        <button onClick={() => handleDelete(shift.id)}
                          className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                          <Trash2 size={13} className="text-red-400" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
                    <div className="flex items-center justify-between">
                      <span>Horaires</span>
                      <span className="font-mono font-bold text-gray-900 dark:text-white">
                        {fmtHHMM(shift.startHour, shift.startMinute)} → {fmtHHMM(shift.endHour, shift.endMinute)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Durée</span>
                      <span className="font-bold text-sky-600 dark:text-sky-400">{shift.durationHours}h</span>
                    </div>
                    {shift.crossesMidnight && (
                      <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                        <Moon size={11} /><span>Traverse minuit</span>
                      </div>
                    )}
                    {shift.isNightShift && shift.nightPremiumRate > 0 && (
                      <div className="flex items-center justify-between">
                        <span>Prime nuit</span>
                        <span className="font-bold text-purple-600 dark:text-purple-400">+{shift.nightPremiumRate}%</span>
                      </div>
                    )}
                  </div>
                  {/* Nb employés assignés */}
                  {assignments.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-1.5">
                      <Users size={11} className="text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {new Set(assignments.filter(a => a.shiftId === shift.id).map(a => a.employeeId)).size} employé(s)
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Cas d'usage */}
          {canAssign && shifts.length > 0 && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                <Info size={15} className="text-sky-500" />Cas d'usage
              </h3>
              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  { emoji: '💊', title: 'Pharmacie / Hôpital', desc: 'Garde de nuit contractuelle — heures normales avec prime' },
                  { emoji: '🏭', title: 'Usine 3×8', desc: 'Matin / Soir / Nuit en rotation hebdomadaire' },
                  { emoji: '🔐', title: 'Sécurité / Gardiennage', desc: 'Shifts 12h avec prime nuit calculée automatiquement' },
                ].map(uc => (
                  <div key={uc.title} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <p className="text-2xl mb-2">{uc.emoji}</p>
                    <p className="text-sm font-bold text-gray-800 dark:text-white mb-1">{uc.title}</p>
                    <p className="text-xs text-gray-500">{uc.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ── Onglet Employés & Plannings ── */
        <EmployeeShiftView
          assignments={assignments}
          employees={employees}
          shifts={shifts}
          loading={assignLoading}
        />
      )}
    </div>
  );
}