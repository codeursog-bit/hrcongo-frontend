'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Plus, Trash2, Loader2, Gift, Zap, Hand,
  DollarSign, Calendar, Save, AlertCircle,
  TrendingUp, Award, Shield, Clock, Search,
  User, ChevronDown, X, CheckCircle2, Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';
import { useAlert } from '@/components/providers/AlertProvider';

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  position?: string;
  departmentName?: string;
  department?: { name: string };
  employeeNumber?: string;
}

interface Bonus {
  id: string;
  bonusType: string;
  amount?: number;
  percentage?: number;
  baseCalculation?: string;
  isRecurring: boolean;
  description?: string;
  source: 'MANUAL' | 'AUTOMATIC';
  targetMonth?: number;
  targetYear?: number;
}

// ─── CONSTANTES ───────────────────────────────────────────────────────────────

const BONUS_TYPES = [
  { value: 'TRANSPORT',  label: 'Prime de transport',   icon: TrendingUp },
  { value: 'PANIER',     label: 'Prime de panier',      icon: Gift },
  { value: 'RENDEMENT',  label: 'Prime de rendement',   icon: Award },
  { value: 'FIN_ANNEE',  label: "Prime de fin d'année", icon: Calendar },
  { value: 'ANCIENNETE', label: "Prime d'ancienneté",   icon: Clock },
  { value: 'SUJÉTION',   label: 'Prime de sujétion',    icon: Shield },
  { value: 'AUTRE',      label: 'Autre prime',          icon: DollarSign },
];

const MONTHS = [
  { value: 1,  label: 'Janvier' },  { value: 2,  label: 'Février' },
  { value: 3,  label: 'Mars' },     { value: 4,  label: 'Avril' },
  { value: 5,  label: 'Mai' },      { value: 6,  label: 'Juin' },
  { value: 7,  label: 'Juillet' },  { value: 8,  label: 'Août' },
  { value: 9,  label: 'Septembre' },{ value: 10, label: 'Octobre' },
  { value: 11, label: 'Novembre' }, { value: 12, label: 'Décembre' },
];

const now = new Date();
const YEARS = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

const defaultBonus = () => ({
  bonusType:       'TRANSPORT',
  amount:          '',
  percentage:      '',
  baseCalculation: 'BASE_SALARY',
  isRecurring:     true,
  description:     '',
  usePercentage:   false,
  targetMonth:     now.getMonth() + 1,
  targetYear:      now.getFullYear(),
});

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────

export default function AssignPrimePage() {
  const router = useRouter();
  const alert = useAlert();
  const searchRef = useRef<HTMLInputElement>(null);

  // États employé
  const [employees, setEmployees]         = useState<Employee[]>([]);
  const [filteredEmployees, setFiltered]  = useState<Employee[]>([]);
  const [selectedEmployee, setSelected]   = useState<Employee | null>(null);
  const [searchQuery, setSearchQuery]     = useState('');
  const [showDropdown, setShowDropdown]   = useState(false);
  const [loadingEmployees, setLoadingEmp] = useState(true);

  // États primes
  const [bonuses, setBonuses]               = useState<Bonus[]>([]);
  const [loadingBonuses, setLoadingBonuses] = useState(false);
  const [showAddModal, setShowAddModal]     = useState(false);
  const [isSaving, setIsSaving]             = useState(false);
  const [deletingId, setDeletingId]         = useState<string | null>(null);

  const [newBonus, setNewBonus] = useState(defaultBonus());

  // ─── CHARGEMENT EMPLOYÉS ──────────────────────────────────────────────────

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<any>('/employees');
        const list: Employee[] = Array.isArray(res) ? res : res?.data || [];
        setEmployees(list);
        setFiltered(list);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingEmp(false);
      }
    };
    load();
  }, []);

  // ─── FILTRAGE RECHERCHE ───────────────────────────────────────────────────

  useEffect(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) { setFiltered(employees); return; }
    setFiltered(employees.filter(emp =>
      `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(q) ||
      emp.position?.toLowerCase().includes(q) ||
      emp.employeeNumber?.toLowerCase().includes(q) ||
      (emp.department?.name || emp.departmentName || '').toLowerCase().includes(q)
    ));
  }, [searchQuery, employees]);

  // ─── CHARGEMENT PRIMES ────────────────────────────────────────────────────

  const loadBonuses = async (emp: Employee) => {
    setLoadingBonuses(true);
    try {
      const res = await api.get<any>(`/employee-bonuses?employeeId=${emp.id}`);
      const all: Bonus[] = Array.isArray(res) ? res : res?.data || [];
      setBonuses(all);
    } catch (e) {
      console.error(e);
      setBonuses([]);
    } finally {
      setLoadingBonuses(false);
    }
  };

  const handleSelectEmployee = (emp: Employee) => {
    setSelected(emp);
    setShowDropdown(false);
    setSearchQuery(`${emp.firstName} ${emp.lastName}`);
    loadBonuses(emp);
  };

  const handleClearEmployee = () => {
    setSelected(null);
    setSearchQuery('');
    setBonuses([]);
    setFiltered(employees);
    setTimeout(() => searchRef.current?.focus(), 100);
  };

  // ─── AJOUTER UNE PRIME ────────────────────────────────────────────────────

  const handleAddBonus = async () => {
    if (!selectedEmployee) return;
    if (!newBonus.usePercentage && !newBonus.amount) {
      alert.error('Montant requis', 'Veuillez saisir un montant.');
      return;
    }
    if (newBonus.usePercentage && !newBonus.percentage) {
      alert.error('Pourcentage requis', 'Veuillez saisir un pourcentage.');
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        employeeId:  selectedEmployee.id,
        bonusType:   newBonus.bonusType,
        isRecurring: newBonus.isRecurring,
        description: newBonus.description || null,
      };

      // ✅ Mois cible uniquement pour les primes ponctuelles
      if (!newBonus.isRecurring) {
        payload.targetMonth = newBonus.targetMonth;
        payload.targetYear  = newBonus.targetYear;
      }

      if (newBonus.usePercentage) {
        payload.percentage      = parseFloat(newBonus.percentage);
        payload.baseCalculation = newBonus.baseCalculation;
      } else {
        payload.amount = parseFloat(newBonus.amount);
      }

      const created = await api.post<Bonus>('/employee-bonuses', payload);
      const entry: Bonus = { ...(created as Bonus), source: 'MANUAL' };
      setBonuses(prev => [entry, ...prev]);

      alert.success('Prime ajoutée', 'La prime a été enregistrée avec succès.');
      setShowAddModal(false);
      setNewBonus(defaultBonus());
    } catch (e: any) {
      alert.error('Erreur', e.message || "Impossible d'ajouter la prime.");
    } finally {
      setIsSaving(false);
    }
  };

  // ─── SUPPRIMER UNE PRIME ──────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await api.delete(`/employee-bonuses/${id}`);
      setBonuses(prev => prev.filter(b => b.id !== id));
      alert.success('Prime supprimée', 'La prime a été retirée.');
    } catch (e: any) {
      alert.error('Erreur', e.message || 'Impossible de supprimer la prime.');
    } finally {
      setDeletingId(null);
    }
  };

  // ─── HELPERS ─────────────────────────────────────────────────────────────

  const getBonusLabel = (type: string) => BONUS_TYPES.find(b => b.value === type)?.label || type;
  const getBonusIcon  = (type: string) => BONUS_TYPES.find(b => b.value === type)?.icon || DollarSign;
  const getMonthLabel = (m?: number)   => MONTHS.find(x => x.value === m)?.label || '';

  const manualBonuses = bonuses.filter(b => b.source === 'MANUAL');
  const autoBonuses   = bonuses.filter(b => b.source === 'AUTOMATIC');
  const totalMensuel  = manualBonuses
    .filter(b => b.isRecurring && b.amount)
    .reduce((sum, b) => sum + (b.amount || 0), 0);

  const deptName = (emp: Employee) => emp.department?.name || emp.departmentName || '—';

  // ─── RENDU ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto pb-20 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-cyan-500 transition-colors">
          <ArrowLeft size={16} /> Retour
        </button>
        {selectedEmployee && (
          <button onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-600 hover:to-sky-600 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all">
            <Plus size={18} /> Ajouter une prime
          </button>
        )}
      </div>

      {/* ── Titre ── */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <Gift size={28} className="text-cyan-500" />
          Attribuer des primes
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Sélectionnez un employé puis gérez ses primes manuelles.
        </p>
      </div>

      {/* ── Sélecteur d'employé ── */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-white/10">
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
          <User size={16} className="text-cyan-500" />
          Choisir un employé
        </label>

        <div className="relative">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all bg-white dark:bg-gray-900 ${
            showDropdown ? 'border-cyan-500 shadow-lg shadow-cyan-500/10' : 'border-slate-200 dark:border-slate-700'
          }`}>
            <Search size={18} className="text-slate-400 shrink-0" />
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setShowDropdown(true); if (selectedEmployee) setSelected(null); }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Rechercher par nom, poste, matricule..."
              className="flex-1 bg-transparent outline-none text-slate-900 dark:text-white placeholder-slate-400 font-medium"
            />
            {selectedEmployee ? (
              <button onClick={handleClearEmployee} className="p-1 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                <X size={16} />
              </button>
            ) : (
              <ChevronDown size={16} className={`text-slate-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            )}
          </div>

          {/* Dropdown */}
          <AnimatePresence>
            {showDropdown && !selectedEmployee && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}
                className="absolute z-50 mt-2 w-full bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
                onMouseDown={e => e.preventDefault()}
              >
                {loadingEmployees ? (
                  <div className="flex items-center justify-center py-8 gap-3">
                    <Loader2 className="animate-spin text-cyan-500" size={20} />
                    <span className="text-slate-500 text-sm">Chargement...</span>
                  </div>
                ) : filteredEmployees.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-sm">Aucun employé trouvé</div>
                ) : (
                  <ul className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredEmployees.map(emp => (
                      <li key={emp.id}>
                        <button onClick={() => handleSelectEmployee(emp)}
                          className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-colors text-left">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-sky-500 flex items-center justify-center shrink-0 text-white font-bold text-sm shadow">
                            {emp.firstName[0]}{emp.lastName[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white truncate">
                              {emp.firstName} {emp.lastName}
                            </p>
                            <p className="text-xs text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                              <Building2 size={11} /> {deptName(emp)}
                              {emp.position && <><span className="text-slate-300 dark:text-slate-600">•</span>{emp.position}</>}
                            </p>
                          </div>
                          {emp.employeeNumber && (
                            <span className="text-xs text-slate-400 font-mono shrink-0">{emp.employeeNumber}</span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Carte employé sélectionné */}
        <AnimatePresence>
          {selectedEmployee && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-4 flex items-center gap-4 p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl border border-cyan-200 dark:border-cyan-800">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-sky-500 flex items-center justify-center text-white font-bold shadow-lg shrink-0">
                {selectedEmployee.firstName[0]}{selectedEmployee.lastName[0]}
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-900 dark:text-white">
                  {selectedEmployee.firstName} {selectedEmployee.lastName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                  <Building2 size={12} /> {deptName(selectedEmployee)}
                  {selectedEmployee.position && <>• {selectedEmployee.position}</>}
                  {selectedEmployee.employeeNumber && <>• {selectedEmployee.employeeNumber}</>}
                </p>
              </div>
              <CheckCircle2 size={22} className="text-cyan-500 shrink-0" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Contenu primes ── */}
      <AnimatePresence>
        {selectedEmployee && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-6">

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass-panel rounded-2xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl flex items-center justify-center">
                  <Hand size={22} className="text-cyan-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-bold">Primes manuelles</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{manualBonuses.length}</p>
                </div>
              </div>
              <div className="glass-panel rounded-2xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                  <Zap size={22} className="text-purple-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-bold">Primes automatiques</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{autoBonuses.length}</p>
                </div>
              </div>
              <div className="glass-panel rounded-2xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                  <DollarSign size={22} className="text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-bold">Total mensuel fixe</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                    {totalMensuel.toLocaleString()}
                    <span className="text-sm font-normal text-slate-400 ml-1">FCFA</span>
                  </p>
                </div>
              </div>
            </div>

            {loadingBonuses ? (
              <div className="flex items-center justify-center py-16 gap-3">
                <Loader2 className="animate-spin text-cyan-500" size={28} />
                <span className="text-slate-500">Chargement des primes...</span>
              </div>
            ) : (
              <>
                {/* ── Primes manuelles ── */}
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg flex items-center justify-center">
                      <Hand size={16} className="text-cyan-500" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Primes Manuelles</h2>
                    <span className="text-xs text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20 px-2 py-0.5 rounded-full font-bold border border-cyan-200 dark:border-cyan-800">
                      Gestion individuelle
                    </span>
                  </div>

                  {manualBonuses.length === 0 ? (
                    <div className="glass-panel rounded-2xl p-10 text-center">
                      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Gift size={28} className="text-slate-400" />
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 font-medium mb-4">Aucune prime manuelle configurée</p>
                      <button onClick={() => setShowAddModal(true)}
                        className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-sky-500 text-white font-bold rounded-xl text-sm flex items-center gap-2 mx-auto">
                        <Plus size={16} /> Ajouter la première prime
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <AnimatePresence>
                        {manualBonuses.map(bonus => {
                          const Icon = getBonusIcon(bonus.bonusType);
                          return (
                            <motion.div key={bonus.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                              className="glass-panel rounded-xl p-5 flex items-center gap-5">
                              <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl flex items-center justify-center shrink-0">
                                <Icon size={22} className="text-cyan-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-bold text-slate-900 dark:text-white">{getBonusLabel(bonus.bonusType)}</p>
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                                    bonus.isRecurring
                                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                                  }`}>
                                    {bonus.isRecurring ? 'Récurrente' : 'Ponctuelle'}
                                  </span>
                                  {/* ✅ Badge mois cible — uniquement si ponctuelle */}
                                  {!bonus.isRecurring && bonus.targetMonth && bonus.targetYear && (
                                    <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 border border-sky-200 dark:border-sky-800 flex items-center gap-1">
                                      <Calendar size={10} />
                                      {getMonthLabel(bonus.targetMonth)} {bonus.targetYear}
                                    </span>
                                  )}
                                </div>
                                {bonus.description && (
                                  <p className="text-xs text-slate-500 mt-0.5">{bonus.description}</p>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                {bonus.amount != null && (
                                  <p className="font-bold text-lg text-slate-900 dark:text-white font-mono">
                                    +{bonus.amount.toLocaleString()} <span className="text-xs text-slate-400">FCFA</span>
                                  </p>
                                )}
                                {bonus.percentage != null && (
                                  <p className="font-bold text-lg text-purple-600 dark:text-purple-400">
                                    +{bonus.percentage}%{' '}
                                    <span className="text-xs text-slate-400">
                                      {bonus.baseCalculation === 'GROSS_SALARY' ? 'du brut' : 'du base'}
                                    </span>
                                  </p>
                                )}
                              </div>
                              <button onClick={() => handleDelete(bonus.id)} disabled={deletingId === bonus.id}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all">
                                {deletingId === bonus.id ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                              </button>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  )}
                </section>

                {/* ── Primes automatiques ── */}
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <Zap size={16} className="text-purple-500" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Primes Automatiques</h2>
                    <span className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded-full font-bold border border-purple-200 dark:border-purple-800">
                      Convention Collective
                    </span>
                  </div>

                  {autoBonuses.length === 0 ? (
                    <div className="glass-panel rounded-2xl p-8 text-center">
                      <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Zap size={24} className="text-purple-400" />
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 font-medium mb-1">Aucune prime automatique</p>
                      <p className="text-xs text-slate-400">
                        Les primes d'ancienneté apparaissent automatiquement selon la convention collective.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {autoBonuses.map(bonus => {
                        const Icon = getBonusIcon(bonus.bonusType);
                        return (
                          <div key={bonus.id}
                            className="glass-panel rounded-xl p-5 flex items-center gap-5 border-l-4 border-l-purple-500">
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center shrink-0">
                              <Icon size={22} className="text-purple-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-bold text-slate-900 dark:text-white">{bonus.bonusType}</p>
                                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                                  <Zap size={10} /> Auto
                                </span>
                              </div>
                              {bonus.description && (
                                <p className="text-xs text-slate-500 mt-0.5">{bonus.description}</p>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              {bonus.amount != null && (
                                <p className="font-bold text-lg text-slate-900 dark:text-white font-mono">
                                  +{bonus.amount.toLocaleString()} <span className="text-xs text-slate-400">FCFA</span>
                                </p>
                              )}
                              {bonus.percentage != null && (
                                <p className="font-bold text-lg text-purple-600 dark:text-purple-400">
                                  +{bonus.percentage}% <span className="text-xs text-slate-400">du base</span>
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </>
            )}

            {/* Info */}
            <div className="glass-panel rounded-2xl p-5 border border-cyan-200 dark:border-cyan-800 bg-cyan-50/50 dark:bg-cyan-900/10">
              <p className="text-sm text-cyan-800 dark:text-cyan-200 flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>
                  <strong>Rappel :</strong> Les primes récurrentes (transport, panier...) sont ajoutées chaque mois automatiquement.
                  Les primes ponctuelles (fin d'année, assiduité...) s'appliquent uniquement sur le bulletin du mois cible choisi.
                </span>
              </p>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* ── État vide ── */}
      {!selectedEmployee && !loadingEmployees && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="glass-panel rounded-2xl p-16 text-center">
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-5">
            <User size={36} className="text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-lg mb-2">Aucun employé sélectionné</p>
          <p className="text-slate-400 text-sm">Recherchez et sélectionnez un employé pour gérer ses primes.</p>
        </motion.div>
      )}

      {/* ================================================================
          MODAL AJOUT — bien fermé, rien en dehors
      ================================================================ */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl p-4"
            onClick={() => setShowAddModal(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-y-auto max-h-[90vh]">

              <button onClick={() => setShowAddModal(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                <X size={20} />
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-500 rounded-full flex items-center justify-center">
                  <Gift size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Nouvelle Prime</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Pour {selectedEmployee?.firstName} {selectedEmployee?.lastName}
                  </p>
                </div>
              </div>

              <div className="space-y-5">

                {/* Type de prime */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Type de prime</label>
                  <select value={newBonus.bonusType}
                    onChange={e => setNewBonus(p => ({ ...p, bonusType: e.target.value }))}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-slate-900 dark:text-white font-medium">
                    {BONUS_TYPES.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                  </select>
                </div>

                {/* Montant ou % */}
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setNewBonus(p => ({ ...p, usePercentage: false }))}
                    className={`p-3 rounded-xl border-2 text-sm font-bold text-center transition-all ${
                      !newBonus.usePercentage
                        ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500'
                    }`}>
                    Montant fixe (FCFA)
                  </button>
                  <button type="button" onClick={() => setNewBonus(p => ({ ...p, usePercentage: true }))}
                    className={`p-3 rounded-xl border-2 text-sm font-bold text-center transition-all ${
                      newBonus.usePercentage
                        ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500'
                    }`}>
                    Pourcentage (%)
                  </button>
                </div>

                {!newBonus.usePercentage ? (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Montant (FCFA)</label>
                    <input type="number" min="0" value={newBonus.amount}
                      onChange={e => setNewBonus(p => ({ ...p, amount: e.target.value }))}
                      placeholder="Ex: 25000"
                      className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none font-bold text-xl text-slate-900 dark:text-white" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Pourcentage (%)</label>
                      <input type="number" min="0" max="100" step="0.5" value={newBonus.percentage}
                        onChange={e => setNewBonus(p => ({ ...p, percentage: e.target.value }))}
                        placeholder="Ex: 5"
                        className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none font-bold text-xl text-slate-900 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Calculé sur</label>
                      <select value={newBonus.baseCalculation}
                        onChange={e => setNewBonus(p => ({ ...p, baseCalculation: e.target.value }))}
                        className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-slate-900 dark:text-white">
                        <option value="BASE_SALARY">Salaire de base</option>
                        <option value="GROSS_SALARY">Salaire brut</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* ✅ FRÉQUENCE — avec exemples concrets pour guider le RH */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Fréquence de versement
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setNewBonus(p => ({ ...p, isRecurring: true }))}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        newBonus.isRecurring
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500'
                      }`}>
                      <div className="font-bold text-sm">Récurrente</div>
                      <div className="text-xs font-normal mt-1 opacity-75">
                        Transport, panier, ancienneté...
                      </div>
                    </button>
                    <button type="button" onClick={() => setNewBonus(p => ({ ...p, isRecurring: false }))}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        !newBonus.isRecurring
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500'
                      }`}>
                      <div className="font-bold text-sm">Ponctuelle</div>
                      <div className="text-xs font-normal mt-1 opacity-75">
                        Fin d'année, assiduité...
                      </div>
                    </button>
                  </div>
                  {/* ✅ Texte d'aide dynamique */}
                  <p className="text-xs text-slate-400 mt-2">
                    {newBonus.isRecurring
                      ? '✅ Ajoutée automatiquement sur chaque bulletin mensuel, même montant.'
                      : '📅 Choisissez le mois exact sur lequel cette prime doit apparaître.'}
                  </p>
                </div>

                {/* ✅ Sélecteur mois/année — uniquement si ponctuelle */}
                <AnimatePresence>
                  {!newBonus.isRecurring && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                      <label className="block text-sm font-bold text-amber-700 dark:text-amber-300 mb-2 flex items-center gap-1">
                        <Calendar size={14} /> Mois cible de la prime
                      </label>
                      <div className="grid grid-cols-2 gap-3 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl">
                        <div>
                          <label className="text-xs text-amber-600 dark:text-amber-400 font-bold mb-1 block">Mois</label>
                          <select value={newBonus.targetMonth}
                            onChange={e => setNewBonus(p => ({ ...p, targetMonth: Number(e.target.value) }))}
                            className="w-full p-2.5 bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-700 rounded-lg outline-none text-slate-900 dark:text-white font-medium text-sm">
                            {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-amber-600 dark:text-amber-400 font-bold mb-1 block">Année</label>
                          <select value={newBonus.targetYear}
                            onChange={e => setNewBonus(p => ({ ...p, targetYear: Number(e.target.value) }))}
                            className="w-full p-2.5 bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-700 rounded-lg outline-none text-slate-900 dark:text-white font-medium text-sm">
                            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                        </div>
                      </div>
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1">
                        <AlertCircle size={11} />
                        Incluse uniquement dans le bulletin de{' '}
                        {MONTHS.find(m => m.value === newBonus.targetMonth)?.label} {newBonus.targetYear}.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Description */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Description (optionnel)
                  </label>
                  <input type="text" value={newBonus.description}
                    onChange={e => setNewBonus(p => ({ ...p, description: e.target.value }))}
                    placeholder="Ex: Prime de performance Q1..."
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-slate-900 dark:text-white" />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowAddModal(false)}
                    className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 transition-all">
                    Annuler
                  </button>
                  <button onClick={handleAddBonus} disabled={isSaving}
                    className="flex-1 py-4 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-600 hover:to-sky-600 text-white font-bold rounded-xl shadow-lg transition-all flex justify-center items-center gap-2 disabled:opacity-50">
                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    Ajouter
                  </button>
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}